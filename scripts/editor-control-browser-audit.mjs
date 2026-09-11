/* global CSS, HTMLElement, HTMLInputElement, InputEvent, document, getComputedStyle, window */
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_PATHS = Object.freeze([
  '/',
  '/services',
  '/services/loans',
  '/services/investments',
  '/services/retirement',
  '/services/planned-giving',
  '/services/insurance',
  '/about-us',
  '/about-us/impact',
  '/online-contributions',
  '/calculators',
  '/test',
]);

const args = new Map(
  process.argv.slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...rest] = arg.slice(2).split('=');
      return [key, rest.join('=') || 'true'];
    }),
);

const requestedBaseUrl = String(args.get('url') || process.env.VITE_DEV_URL || '').replace(/\/$/, '');
const paths = String(args.get('paths') || process.env.CONTROL_AUDIT_PATHS || DEFAULT_PATHS.join(','))
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const blockFilter = new Set(
  String(args.get('blocks') || process.env.CONTROL_AUDIT_BLOCKS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);
const waitAfterInputMs = Number(args.get('wait-ms') || process.env.CONTROL_AUDIT_WAIT_MS || 400);

function getBrowserPath() {
  const candidates = [
    process.env.BROWSER_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'google-chrome',
    'chromium',
  ].filter(Boolean);

  return candidates.find((candidate) => candidate.includes('/')
    ? fs.existsSync(candidate)
    : true) || '';
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address()?.port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForHttp(url, child, timeoutMs = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Isolated Vite server exited before becoming ready (code ${child.exitCode}).`);
    }
    try {
      const response = await fetch(url, { headers: { Accept: 'text/html' } });
      if (response.ok || response.status < 500) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Isolated Vite server did not become ready at ${url}.`);
}

async function startIsolatedDevServer() {
  const repoRoot = process.cwd();
  const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-editor-control-fixture-'));
  const persistenceFile = path.join(fixtureDirectory, 'content-admin-shared.json');
  const seedBaselineFile = path.join(fixtureDirectory, 'content-admin-seed-baseline.json');
  const disclosuresFile = path.join(fixtureDirectory, 'disclosures-shared.json');
  const revisionDirectory = path.join(fixtureDirectory, 'content-admin-revisions');
  const authorityLockFile = path.join(fixtureDirectory, 'content-admin-authority.lock');
  fs.copyFileSync(path.join(repoRoot, 'dev-data/content-admin-shared.json'), persistenceFile);
  fs.copyFileSync(path.join(repoRoot, 'dev-data/content-admin-seed-baseline.json'), seedBaselineFile);
  fs.copyFileSync(path.join(repoRoot, 'dev-data/disclosures-shared.json'), disclosuresFile);
  fs.mkdirSync(revisionDirectory);

  const port = await getFreePort();
  const viteCli = path.join(repoRoot, 'node_modules/vite/bin/vite.js');
  const child = spawn(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CONTENT_ADMIN_PERSISTENCE_FILE: persistenceFile,
      CONTENT_ADMIN_REVISION_DIRECTORY: revisionDirectory,
      CONTENT_ADMIN_AUTHORITY_LOCK_FILE: authorityLockFile,
      CONTENT_ADMIN_DISCLOSURES_FILE: disclosuresFile,
    },
    stdio: 'ignore',
  });
  const url = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${url}/`, child);
  } catch (error) {
    child.kill();
    fs.rmSync(fixtureDirectory, { recursive: true, force: true });
    throw error;
  }
  return { url, child, fixtureDirectory };
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function waitForCdp(port, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const version = await getJson(`http://127.0.0.1:${port}/json/version`);
      if (version?.webSocketDebuggerUrl) {
        return version;
      }
    } catch {
      // The browser may need a moment to open its debugging endpoint.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Browser debugging endpoint did not open on port ${port}.`);
}

async function waitForTarget(port, targetId) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const target = targets.find((entry) => entry.id === targetId && entry.webSocketDebuggerUrl);
    if (target) {
      return target;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Browser target ${targetId} did not become available.`);
}

function connectWebSocket(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let nextId = 0;
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data || '{}'));
    if (!message.id || !pending.has(message.id)) {
      return;
    }
    const command = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      command.reject(new Error(message.error.message || 'CDP command failed'));
    } else {
      command.resolve(message.result || {});
    }
  });

  return {
    async command(method, params = {}) {
      await ready;
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    async close() {
      await ready.catch(() => {});
      socket.close();
    },
  };
}

function buildBrowserAudit() {
  return async function auditCurrentPage(waitMs, requestedBlockIds = []) {
    const blockFilter = new Set(requestedBlockIds);
    const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
    const authority = window.__AGF_CONTENT_RUNTIME_AUTHORITY__ || {};
    const authorityById = new Map(
      (Array.isArray(authority.blocks) ? authority.blocks : [])
        .map((block) => [String(block?.blockId || ''), block]),
    );
    const sectionById = new Map(
      [...document.querySelectorAll('[data-block-id]')]
        .map((section) => [String(section.dataset.blockId || ''), section])
        .filter(([blockId]) => blockId),
    );
    const waitForPanel = async () => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const panel = document.querySelector('.admin-front-hud-tool.is-panel-active');
        if (panel) return panel;
        await sleep(50);
      }
      return null;
    };
    const getStyleSignature = (root) => {
      if (!root) return '';
      const isHudOverlay = (node) => node !== root && Boolean(
        node.matches?.('[class*="admin-front-hud"], [class*="admin-hud"], [data-mobile-front-hud-selectable]')
        || node.closest?.('[class*="admin-front-hud"], [class*="admin-hud"], [data-mobile-front-hud-selectable]'),
      );
      const nodes = [root, ...root.querySelectorAll('*')]
        .filter((node) => !isHudOverlay(node))
        .slice(0, 260);
      return JSON.stringify(nodes.map((node) => {
        const style = getComputedStyle(node);
        const cleanNode = node.cloneNode(true);
        cleanNode.querySelectorAll?.('[class*="admin-front-hud"], [class*="admin-hud"], [data-mobile-front-hud-selectable]')
          .forEach((overlay) => overlay.remove());
        const cssVars = {};
        for (let index = 0; index < style.length; index += 1) {
          const property = style[index];
          if (property.startsWith('--')) {
            cssVars[property] = style.getPropertyValue(property).trim();
          }
        }
        return {
          tag: node.tagName,
          className: String(node.className || ''),
          text: String(cleanNode.textContent || '').trim().slice(0, 500),
          html: cleanNode instanceof HTMLElement ? cleanNode.innerHTML.slice(0, 500) : '',
          attributes: {
            href: node.getAttribute('href') || '',
            src: node.getAttribute('src') || '',
            value: node.getAttribute('value') || '',
            ariaChecked: node.getAttribute('aria-checked') || '',
            ariaPressed: node.getAttribute('aria-pressed') || '',
            style: node.getAttribute('style') || '',
          },
          styles: {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            opacity: style.opacity,
            width: style.width,
            height: style.height,
            margin: style.margin,
            padding: style.padding,
            border: style.border,
            borderRadius: style.borderRadius,
            boxShadow: style.boxShadow,
            display: style.display,
            gap: style.gap,
            gridTemplateColumns: style.gridTemplateColumns,
          },
          cssVars,
        };
      }));
    };
    const pickControl = (field) => field.querySelector(
      'input[type="range"], select, input[type="checkbox"], input[type="radio"], textarea, input[type="text"], input[type="search"], [contenteditable="true"], button[role="radio"], button[aria-pressed], button.admin-boolean-pill-option, button.admin-color-swatch-btn, button.admin-highlight-swatch-btn',
    );
    const isVisible = (element) => {
      const ownerPanel = element?.closest('.admin-hud-editor-panel');
      if (ownerPanel && getComputedStyle(ownerPanel).display === 'none') {
        return false;
      }
      return Boolean(element?.getClientRects?.().length || element?.offsetParent || ownerPanel);
    };
    const collectControlDescriptors = (panel) => {
      const descriptors = [];
      const seen = new Set();
      panel.querySelectorAll('[data-editor-field-id]').forEach((field) => {
        if (!isVisible(field)) return;
        const fieldId = String(field.dataset.editorFieldId || '').trim();
        const control = pickControl(field);
        if (!fieldId || !control || seen.has(fieldId)) return;
        seen.add(fieldId);
        descriptors.push({ id: fieldId, field, control });
      });
      panel.querySelectorAll(
        'input[type="range"], select, input[type="checkbox"], input[type="radio"], textarea, input[type="text"], input[type="search"], [contenteditable="true"]',
      ).forEach((control) => {
        if (control.closest('[data-editor-field-id]') || !isVisible(control)) return;
        const ariaLabel = String(control.getAttribute('aria-label') || '').trim();
        if (!ariaLabel || seen.has(`aria:${ariaLabel}`)) return;
        seen.add(`aria:${ariaLabel}`);
        descriptors.push({ id: `aria:${ariaLabel}`, field: control.parentElement, control });
      });
      return descriptors;
    };
    const dispatchValue = (element, value) => {
      const previousValue = String(element.value ?? '');
      const setter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set
        || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(element, value);
      // React's controlled-input tracker otherwise treats this programmatic
      // probe as if no native value change occurred.
      element._valueTracker?.setValue(previousValue);
      const reactPropsKey = Object.keys(element).find((key) => key.startsWith('__reactProps$'));
      const reactOnChange = reactPropsKey ? element[reactPropsKey]?.onChange : null;
      if (typeof reactOnChange === 'function') {
        reactOnChange({ target: element, currentTarget: element });
        return;
      }
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const mutateControl = (control, fieldId) => {
      if (!control || control.disabled) return null;
      const initialState = readControlState(control);
      if (control.matches('input[type="range"]')) {
        const min = Number(control.min || 0);
        const max = Number(control.max || 100);
        const step = Number(control.step || 1) || 1;
        const current = Number(control.value);
        const next = Number.isFinite(current) && current + step <= max
          ? current + step
          : min;
        control.focus();
        dispatchValue(control, String(next));
        return { control, beforeState: initialState };
      }
      if (control.matches('input[role="spinbutton"]')) {
        const min = Number(control.getAttribute('aria-valuemin'));
        const max = Number(control.getAttribute('aria-valuemax'));
        const current = Number(control.getAttribute('aria-valuenow') ?? control.value);
        const next = Number.isFinite(current) && Number.isFinite(max) && current + 0.1 <= max
          ? current + 0.1
          : (Number.isFinite(min) ? min : current + 1);
        control.focus();
        dispatchValue(control, String(Math.round(next * 1000) / 1000));
        control.blur();
        return { control, beforeState: initialState };
      }
      if (control.matches('select')) {
        const options = [...control.options].filter((option) => !option.disabled);
        const next = options.find((option) => option.value !== control.value) || options[0];
        if (!next) return null;
        dispatchValue(control, next.value);
        return { control, beforeState: initialState };
      }
      if (control.matches('input[type="checkbox"], input[type="radio"]')) {
        control.click();
        return { control, beforeState: initialState };
      }
      if (control.matches('button')) {
        const group = control.closest('[role="group"], [role="radiogroup"]') || control.parentElement;
        const candidate = [...(group?.querySelectorAll('button') || [])]
          .find((button) => !button.disabled && button !== control && !button.classList.contains('is-active'));
        const target = candidate || control;
        const beforeState = readControlState(target);
        const controlKey = target.getAttribute('aria-label')
          || target.getAttribute('title')
          || String(target.textContent || '').trim();
        const reactPropsKey = Object.keys(target).find((key) => key.startsWith('__reactProps$'));
        const reactOnClick = reactPropsKey ? target[reactPropsKey]?.onClick : null;
        if (typeof reactOnClick === 'function') {
          reactOnClick({ target, currentTarget: target, preventDefault() {}, stopPropagation() {} });
          // Boolean pills are intentionally idempotent (Off/On), so a native
          // click fallback is safe and covers React builds that do not expose
          // the delegated handler through the private props key.
          if (target.classList.contains('admin-boolean-pill-option')) {
            target.click();
          }
        } else {
          target.click();
        }
        return { control: target, beforeState, controlKey };
      }
      if (control.matches('[contenteditable="true"]')) {
        control.textContent = `__browser_control_probe__${fieldId}`;
        control.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
        control.dispatchEvent(new Event('blur', { bubbles: true }));
        return { control, beforeState: initialState };
      }
      dispatchValue(control, `__browser_control_probe__${fieldId}`);
      control.dispatchEvent(new Event('blur', { bubbles: true }));
      return { control, beforeState: initialState };
    };

    const readControlState = (control) => {
      if (!control) return '';
      if (control.matches('input[type="checkbox"], input[type="radio"]')) {
        return `${control.checked ? 'checked' : 'unchecked'}:${control.value}`;
      }
      if (control.matches('button')) {
        const group = control.closest('[role="group"], [role="radiogroup"]');
        const selected = [...(group?.querySelectorAll('button') || [])]
          .find((button) => button.classList.contains('is-active')
            || button.getAttribute('aria-pressed') === 'true'
            || button.getAttribute('aria-checked') === 'true');
        if (selected) {
          return `selected:${selected.getAttribute('aria-label') || selected.getAttribute('title') || String(selected.textContent || '').trim()}`;
        }
        return `${control.classList.contains('is-active') ? 'active' : 'inactive'}:${control.getAttribute('aria-pressed') || ''}:${control.getAttribute('aria-checked') || ''}`;
      }
      if (control.matches('[contenteditable="true"]')) return control.textContent || '';
      return String(control.value ?? '');
    };

    const reports = [];
    for (const [blockId, section] of sectionById) {
      if (blockFilter.size && !blockFilter.has(blockId)) continue;
      const anchor = section.querySelector('.admin-front-hud-anchor-btn');
      const report = {
        blockId,
        kind: authorityById.get(blockId)?.kind || '',
        controls: 0,
        pass: [],
        failures: [],
        visualReview: [],
        skipped: [],
      };
      if (!anchor) {
        report.skipped.push(`${blockId}: no HUD anchor rendered (hud=${String(authority.hudEnabled)}, preference=${localStorage.getItem('agf-admin-front-hud-enabled-v1')}, dock=${Boolean(document.querySelector('.admin-front-hud-dock'))})`);
        reports.push(report);
        continue;
      }

      anchor.click();
      const panel = await waitForPanel();
      if (!panel) {
        report.failures.push(`${blockId}/<panel>: HUD editor panel did not open`);
        reports.push(report);
        continue;
      }
      report.kind = panel.querySelector('[data-hud-editor-kind]')?.dataset.hudEditorKind || report.kind;
      const pageRoot = document.querySelector('.service-native-page, .home-native-page');
      const renderedSection = document.querySelector(`[data-block-id="${CSS.escape(blockId)}"]`);
      report.hudPresentation = {
        pageClass: String(pageRoot?.className || ''),
        sectionClass: String(renderedSection?.className || ''),
        dimStrength: pageRoot ? getComputedStyle(pageRoot).getPropertyValue('--ag-admin-front-hud-dim-strength').trim() : '',
        sectionOverlayOpacity: renderedSection ? getComputedStyle(renderedSection, '::after').opacity : '',
      };
      if (pageRoot?.classList.contains('service-native-page') && renderedSection) {
        if (!renderedSection.classList.contains('is-hud-focus-target')) {
          report.failures.push(`${blockId}/hudFocus: active service block did not receive is-hud-focus-target`);
        }
        if (Number(report.hudPresentation.sectionOverlayOpacity) > 0.001) {
          report.failures.push(`${blockId}/hudDim: active service block overlay opacity was ${report.hudPresentation.sectionOverlayOpacity}`);
        }
      }

      const railButtons = [...panel.querySelectorAll('.admin-hud-editor-rail-button')]
        .filter((button) => !button.classList.contains('is-block-options'));
      const sectionButtons = railButtons.length ? railButtons : [null];
      const testedControlIds = new Set();
      for (let sectionIndex = 0; sectionIndex < sectionButtons.length; sectionIndex += 1) {
        const railButton = sectionButtons[sectionIndex];
        railButton?.click();
        await sleep(80);
        const descriptors = collectControlDescriptors(panel);
        for (const descriptor of descriptors) {
          const { id: fieldId } = descriptor;
          if (testedControlIds.has(fieldId)) continue;
          testedControlIds.add(fieldId);
          report.controls += 1;
          const currentPanelBeforeMutation = document.querySelector('.admin-front-hud-tool.is-panel-active') || panel;
          const currentField = fieldId.startsWith('aria:')
            ? [...currentPanelBeforeMutation.querySelectorAll('[aria-label]')].find((candidate) => (
              `aria:${candidate.getAttribute('aria-label') || ''}` === fieldId
            ))
            : currentPanelBeforeMutation.querySelector(`[data-editor-field-id="${CSS.escape(fieldId)}"]`);
          if (!currentField) {
            report.skipped.push(`${blockId}/${fieldId}: field was conditionally replaced or hidden by an earlier staged mutation`);
            continue;
          }
          const currentControl = pickControl(currentField) || currentField;
          const before = getStyleSignature(section);
          const mutation = mutateControl(currentControl, fieldId);
          if (!mutation) {
            report.skipped.push(`${blockId}/${fieldId}: control is disabled or has no alternate value`);
            continue;
          }
          const {
            control: mutatedControl,
            beforeState: beforeControlState,
            controlKey: mutatedControlKey,
          } = mutation;
          await sleep(waitMs);
          const after = getStyleSignature(section);
          const currentPanel = document.querySelector('.admin-front-hud-tool.is-panel-active') || panel;
          const refreshedField = fieldId.startsWith('aria:')
            ? [...currentPanel.querySelectorAll('[aria-label]')].find((candidate) => (
              `aria:${candidate.getAttribute('aria-label') || ''}` === fieldId
            ))
            : currentPanel.querySelector(`[data-editor-field-id="${CSS.escape(fieldId)}"]`);
          const refreshedButtons = refreshedField?.querySelectorAll?.('button') || [];
          const refreshedButton = mutatedControlKey
            ? [...refreshedButtons].find((candidate) => (
              candidate.getAttribute('aria-label') === mutatedControlKey
              || candidate.getAttribute('title') === mutatedControlKey
              || String(candidate.textContent || '').trim() === mutatedControlKey
            ))
            : null;
          const afterControl = refreshedButton
            || (refreshedField ? pickControl(refreshedField) || refreshedField : mutatedControl);
          if (!refreshedField && !fieldId.startsWith('aria:')) {
            report.visualReview.push(`${blockId}/${fieldId}: field was conditionally replaced or hidden after mutation`);
            continue;
          }
          const afterControlState = readControlState(afterControl);
          if (beforeControlState === afterControlState) {
            report.failures.push(`${blockId}/${fieldId}: control did not retain its changed value (before=${JSON.stringify(beforeControlState)}, after=${JSON.stringify(afterControlState)}, target=${JSON.stringify(mutatedControlKey || mutatedControl?.outerHTML?.slice(0, 180) || '')}, afterHtml=${JSON.stringify(afterControl?.outerHTML?.slice(0, 220) || '')})`);
          } else if (before === after) {
            report.visualReview.push(`${blockId}/${fieldId}: control changed and remained staged, but rendered block DOM/computed styles did not change`);
          } else {
            report.pass.push(fieldId);
          }
        }
      }
      const closeButton = panel.querySelector('.admin-front-hud-tool-close');
      closeButton?.click();
      await sleep(50);
      reports.push(report);
    }

    return {
      path: window.location.pathname,
      renderedBlocks: reports.length,
      reports,
    };
  };
}

async function evaluate(connection, expression, awaitPromise = true) {
  const result = await connection.command('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result?.result?.subtype === 'error' || result?.exceptionDetails) {
    const description = result.exceptionDetails?.exception?.description
      || result.exceptionDetails?.text
      || result.result?.description
      || 'Browser evaluation failed';
    throw new Error(description);
  }
  return result?.result?.value;
}

async function main() {
  if (requestedBaseUrl && process.env.CONTROL_AUDIT_ALLOW_EXTERNAL !== '1') {
    throw new Error(
      'External browser audit targets are disabled by default. Omit --url/VITE_DEV_URL to launch the isolated fixture, '
      + 'or set CONTROL_AUDIT_ALLOW_EXTERNAL=1 explicitly.',
    );
  }
  const browserPath = getBrowserPath();
  if (!browserPath) {
    throw new Error('Chrome, Edge, or Chromium was not found. Set BROWSER_BIN to a browser executable.');
  }

  const cdpPort = await getFreePort();
  const profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-editor-control-browser-'));
  const isolatedServer = requestedBaseUrl ? null : await startIsolatedDevServer();
  const baseUrl = requestedBaseUrl || isolatedServer.url;
  const browserProcess = spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDirectory}`,
    `--remote-debugging-port=${cdpPort}`,
    'about:blank',
  ], { stdio: 'ignore' });
  let browserConnection;
  let pageConnection;
  let targetId = '';

  try {
    const browserVersion = await waitForCdp(cdpPort);
    browserConnection = connectWebSocket(browserVersion.webSocketDebuggerUrl);
    const targetResult = await browserConnection.command('Target.createTarget', { url: 'about:blank' });
    targetId = targetResult.targetId;
    const target = await waitForTarget(cdpPort, targetId);
    pageConnection = connectWebSocket(target.webSocketDebuggerUrl);
    await pageConnection.command('Page.enable');
    await pageConnection.command('Runtime.enable');
    await pageConnection.command('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await pageConnection.command('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        try {
          const auditFetch = window.fetch.bind(window);
          window.fetch = (input, init = {}) => {
            const requestUrl = typeof input === 'string' ? input : input?.url || '';
            const requestMethod = String(init?.method || input?.method || 'GET').toUpperCase();
            if (requestMethod !== 'GET' && requestMethod !== 'HEAD' && requestUrl.includes('/__dev/content-admin')) {
              return Promise.reject(new Error('Browser control audit blocked a shared content-authority write.'));
            }
            return auditFetch(input, init);
          };
          localStorage.setItem('agf-admin-front-hud-enabled-v1', 'true');
          localStorage.setItem('agf-dev-identity-v1', JSON.stringify({
            userId: 'dev-control-audit',
            displayName: 'Control Audit',
            nickname: 'Control Audit',
            fullName: 'Control Audit',
            email: 'control-audit@example.test',
            accentColor: '#00adbb'
          }));
        } catch (error) {}
      `,
    });

    const auditExpression = `(${buildBrowserAudit().toString()})(${Math.max(50, waitAfterInputMs)}, ${JSON.stringify([...blockFilter])})`;
    const reports = [];
    for (const pathname of paths) {
      await pageConnection.command('Page.navigate', { url: `${baseUrl}${pathname}` });
      // Set the preference again after navigation as a guard against the
      // application's first-run preference read racing the new-document hook.
      await evaluate(pageConnection, `(() => {
        localStorage.setItem('agf-admin-front-hud-enabled-v1', 'true');
        return true;
      })()`);
      await pageConnection.command('Page.reload', { ignoreCache: true });
      const readiness = await evaluate(pageConnection, `(
        async () => {
            for (let attempt = 0; attempt < 80; attempt += 1) {
            if (document.querySelector('[data-block-id]')) {
              return { ready: true };
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          return {
            ready: false,
            url: window.location.href,
            title: document.title,
            appBooted: Boolean(window.__AGF_APP_BOOTED__),
            rootText: document.getElementById('root')?.innerText?.slice(0, 300) || '',
            rootHtml: document.getElementById('root')?.innerHTML?.slice(0, 300) || '',
          };
        }
      )()`);
      if (!readiness?.ready) {
        reports.push({
          path: pathname,
          renderedBlocks: 0,
          reports: [],
          failures: [
            `no rendered block sections after waiting 8000ms (${JSON.stringify(readiness)})`,
          ],
        });
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      const report = await evaluate(pageConnection, auditExpression);
      reports.push(report);
    }

    const failures = reports.flatMap((report) => [
      ...(report.failures || []).map((failure) => `${report.path}: ${failure}`),
      ...(report.reports || []).flatMap((block) => block.failures.map((failure) => `${report.path}: ${failure}`)),
    ]);
    const totals = reports.reduce((result, report) => {
      result.blocks += report.reports?.length || 0;
      result.controls += report.reports?.reduce((sum, block) => sum + block.controls, 0) || 0;
      result.pass += report.reports?.reduce((sum, block) => sum + block.pass.length, 0) || 0;
      result.fail += report.reports?.reduce((sum, block) => sum + block.failures.length, 0) || 0;
      result.visualReview += report.reports?.reduce((sum, block) => sum + block.visualReview.length, 0) || 0;
      result.skipped += report.reports?.reduce((sum, block) => sum + block.skipped.length, 0) || 0;
      return result;
    }, { blocks: 0, controls: 0, pass: 0, fail: 0, visualReview: 0, skipped: 0 });
    console.log(JSON.stringify({
      ok: failures.length === 0,
      baseUrl,
      paths,
      totals,
      failures,
      reports,
    }, null, 2));
    process.exitCode = failures.length ? 1 : 0;
  } finally {
    await pageConnection?.close();
    if (browserConnection) {
      await browserConnection.command('Target.closeTarget', { targetId }).catch(() => {});
      await browserConnection.close();
    }
    browserProcess.kill();
    isolatedServer?.child.kill();
    try {
      fs.rmSync(profileDirectory, { recursive: true, force: true });
    } catch {
      // Chrome can hold a profile lock briefly after its process exits.
    }
    try {
      if (isolatedServer?.fixtureDirectory) {
        fs.rmSync(isolatedServer.fixtureDirectory, { recursive: true, force: true });
      }
    } catch {
      // The temporary authority fixture is safe to remove on the next run.
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
