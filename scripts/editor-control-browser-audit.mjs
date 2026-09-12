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
const controlFilter = new Set(
  String(args.get('controls') || process.env.CONTROL_AUDIT_CONTROLS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);
const waitAfterInputMs = Number(args.get('wait-ms') || process.env.CONTROL_AUDIT_WAIT_MS || 400);
const cdpCommandTimeoutMs = Number(args.get('cdp-timeout-ms') || process.env.CONTROL_AUDIT_CDP_TIMEOUT_MS || 120000);

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
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP command timed out after ${cdpCommandTimeoutMs}ms: ${method}`));
        }, cdpCommandTimeoutMs);
        pending.set(id, {
          resolve: (value) => {
            clearTimeout(timeout);
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timeout);
            reject(error);
          },
        });
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
  return async function auditCurrentPage(waitMs, requestedBlockIds = [], requestedControlIds = []) {
    const blockFilter = new Set(requestedBlockIds);
    const controlFilter = new Set(requestedControlIds);
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
    const matchedControlFilters = new Set();
    const auditFailures = [];
    const waitForPanel = async () => {
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const panel = document.querySelector('.admin-front-hud-tool.is-panel-active');
        if (panel) {
          const editorReady = panel.querySelector(
            '.admin-hud-editor-rail, [data-hud-editor-kind], [data-editor-field-id], .admin-front-hud-note',
          );
          const loading = panel.querySelector('.admin-front-hud-editor-loading');
          if (editorReady && !loading) return panel;
        }
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
    const pickControl = (field) => {
      // HTML editors contain a toolbar before the editable surface. Prefer the
      // actual editor so a bodyHtml probe tests content wiring instead of
      // accidentally clicking its first formatting swatch.
      const editable = field.querySelector('[contenteditable="true"], textarea.admin-html-editor-source');
      if (editable) return editable;
      return field.querySelector(
        'input[type="range"], select, input[type="checkbox"], input[type="radio"], textarea, input[type="text"], input[type="search"], button[role="radio"], button[aria-pressed], button.admin-boolean-pill-option, button.admin-color-swatch-btn, button.admin-highlight-swatch-btn',
      );
    };
    const ariaControlSelector = 'input[type="range"], select, input[type="checkbox"], input[type="radio"], textarea, input[type="text"], input[type="search"], [contenteditable="true"]';
    const findAriaControl = (root, descriptor) => (
      [...root.querySelectorAll(ariaControlSelector)].filter(
        (candidate) => isVisible(candidate) && candidate.getAttribute('aria-label') === descriptor.ariaLabel,
      )[descriptor.ariaOccurrence]
      || null
    );
    const isVisible = (element) => {
      const ownerPanel = element?.closest('.admin-hud-editor-panel');
      if (ownerPanel && getComputedStyle(ownerPanel).display === 'none') {
        return false;
      }
      return Boolean(element?.getClientRects?.().length || element?.offsetParent || ownerPanel);
    };
    const isDisabled = (element) => Boolean(
      element?.disabled
      || element?.matches?.(':disabled')
      || element?.closest?.('fieldset[disabled]')
    );
    const collectControlDescriptors = (panel) => {
      const descriptors = [];
      const seen = new Set();
      panel.querySelectorAll('[data-editor-field-id]').forEach((field) => {
        if (!isVisible(field)) return;
        const fieldId = String(field.dataset.editorFieldId || '').trim();
        const control = pickControl(field);
        if (
          !fieldId
          || !control
          || field.closest('.admin-hud-editor-rail')
          || control.closest('.admin-hud-editor-rail')
          || control.classList.contains('admin-hud-editor-rail-button')
          || seen.has(fieldId)
        ) return;
        seen.add(fieldId);
        descriptors.push({ id: fieldId, field, control });
      });
      const ariaOccurrences = new Map();
      panel.querySelectorAll(
        ariaControlSelector,
      ).forEach((control) => {
        if (
          control.closest('[data-editor-field-id]')
          || control.closest('.admin-hud-editor-rail')
          || control.classList.contains('admin-hud-editor-rail-button')
          || !isVisible(control)
        ) return;
        const ariaLabel = String(control.getAttribute('aria-label') || '').trim();
        if (!ariaLabel) return;
        const occurrence = ariaOccurrences.get(ariaLabel) || 0;
        ariaOccurrences.set(ariaLabel, occurrence + 1);
        const id = `aria:${ariaLabel}#${occurrence + 1}`;
        if (seen.has(id)) return;
        seen.add(id);
        descriptors.push({
          id,
          field: control.parentElement,
          control,
          ariaLabel,
          ariaOccurrence: occurrence,
        });
      });
      return descriptors.sort((left, right) => {
        const leftIsLinkToggle = /open in new window/i.test(left.ariaLabel || '');
        const rightIsLinkToggle = /open in new window/i.test(right.ariaLabel || '');
        return Number(rightIsLinkToggle) - Number(leftIsLinkToggle);
      });
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
      if (!control || isDisabled(control)) return null;
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
        if (!next || next.value === control.value) return null;
        dispatchValue(control, next.value);
        return { control, beforeState: initialState };
      }
      if (control.matches('input[type="checkbox"], input[type="radio"]')) {
        const routeLinkControl = control.closest('.admin-route-link-control');
        if (routeLinkControl) {
          const hasDestination = [
            ...routeLinkControl.querySelectorAll('input[type="text"], select'),
          ].some((candidate) => String(candidate.value || '').trim());
          if (!hasDestination) return null;
        }
        const desiredChecked = !control.checked;
        const checkedSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set;
        checkedSetter?.call(control, desiredChecked);
        const reactPropsKey = Object.keys(control).find((key) => key.startsWith('__reactProps$'));
        const reactOnChange = reactPropsKey ? control[reactPropsKey]?.onChange : null;
        if (typeof reactOnChange === 'function') {
          reactOnChange({ target: control, currentTarget: control });
        } else {
          control.dispatchEvent(new Event('input', { bubbles: true }));
          control.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return { control, beforeState: initialState };
      }
      if (control.matches('button')) {
        const group = control.closest('[role="group"], [role="radiogroup"]') || control.parentElement;
        const candidate = [...(group?.querySelectorAll('button') || [])]
          .find((button) => !isDisabled(button) && button !== control && !button.classList.contains('is-active'));
        const target = candidate || control;
        const beforeState = readControlState(target);
        const controlKey = target.getAttribute('aria-label')
          || target.getAttribute('title')
          || String(target.textContent || '').trim();
        // Use the browser's native click path for button controls. This keeps
        // event ordering identical to an admin click and avoids depending on
        // React's private prop keys (which can be stale after a rerender).
        target.click();
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
      // Some legacy page renderers use a data-block wrapper around the actual
      // service section. Inspect that inner section for HUD overlay styles so
      // a content animation on the wrapper is not mistaken for dimming.
      const hudSection = renderedSection?.matches?.('.service-native-hero, .service-native-intro, .service-native-section')
        ? renderedSection
        : renderedSection?.querySelector?.('.service-native-hero, .service-native-intro, .service-native-section');
      report.hudPresentation = {
        pageClass: String(pageRoot?.className || ''),
        sectionClass: String(hudSection?.className || renderedSection?.className || ''),
        dimStrength: pageRoot ? getComputedStyle(pageRoot).getPropertyValue('--ag-admin-front-hud-dim-strength').trim() : '',
        sectionOverlayOpacity: hudSection ? getComputedStyle(hudSection, '::after').opacity : '',
      };
      if (pageRoot?.classList.contains('service-native-page') && hudSection) {
        if (!hudSection.classList.contains('is-hud-focus-target')) {
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
          const matchingFilters = [...controlFilter].filter((filter) => (
            filter === fieldId || filter === (descriptor.ariaLabel || '')
          ));
          if (matchingFilters.length) {
            matchingFilters.forEach((filter) => matchedControlFilters.add(filter));
          }
          if (controlFilter.size && !matchingFilters.length) {
            continue;
          }
          if (testedControlIds.has(fieldId)) continue;
          testedControlIds.add(fieldId);
          report.controls += 1;
          const currentPanelBeforeMutation = document.querySelector('.admin-front-hud-tool.is-panel-active') || panel;
          const currentField = fieldId.startsWith('aria:')
            ? findAriaControl(currentPanelBeforeMutation, descriptor)
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
          const immediateControlState = readControlState(mutation.control);
          const {
            control: mutatedControl,
            beforeState: beforeControlState,
            controlKey: mutatedControlKey,
          } = mutation;
          await sleep(waitMs);
          const after = getStyleSignature(section);
          const currentPanel = document.querySelector('.admin-front-hud-tool.is-panel-active') || panel;
          const refreshedField = fieldId.startsWith('aria:')
            ? findAriaControl(currentPanel, descriptor)
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
            report.failures.push(`${blockId}/${fieldId}: control did not retain its changed value (before=${JSON.stringify(beforeControlState)}, immediate=${JSON.stringify(immediateControlState)}, after=${JSON.stringify(afterControlState)}, target=${JSON.stringify(mutatedControlKey || mutatedControl?.outerHTML?.slice(0, 180) || '')}, afterHtml=${JSON.stringify(afterControl?.outerHTML?.slice(0, 220) || '')})`);
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
      const pageAfterClose = document.querySelector('.service-native-page, .home-native-page, .loans-native-page, .rates-page');
      const staleFocusTargets = pageAfterClose
        ? pageAfterClose.querySelectorAll('.is-hud-focus-target, .is-hud-dimmed').length
        : 0;
      const staleActivePanel = Boolean(document.querySelector('.admin-front-hud-tool.is-panel-active'));
      report.hudAfterClose = {
        hasActivePanel: staleActivePanel,
        staleFocusTargets,
        pageHasActiveHudClass: Boolean(pageAfterClose?.classList.contains('has-active-front-hud-panel')),
      };
      if (staleActivePanel || staleFocusTargets || report.hudAfterClose.pageHasActiveHudClass) {
        report.failures.push(`${blockId}/hudClose: HUD state remained active after closing the editor (${JSON.stringify(report.hudAfterClose)})`);
      }
      reports.push(report);
    }

    if (blockFilter.size) {
      const renderedBlockIds = new Set(reports.map((report) => report.blockId));
      const missingBlockIds = [...blockFilter].filter((blockId) => !renderedBlockIds.has(blockId));
      if (missingBlockIds.length) {
        auditFailures.push(`requested block filter matched no rendered block: ${missingBlockIds.join(', ')}`);
      }
    }
    if (controlFilter.size) {
      const missingControlFilters = [...controlFilter].filter((filter) => !matchedControlFilters.has(filter));
      if (missingControlFilters.length) {
        auditFailures.push(`requested control filter matched no rendered control: ${missingControlFilters.join(', ')}`);
      }
    }

    return {
      path: window.location.pathname,
      renderedBlocks: reports.length,
      failures: auditFailures,
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
            if (${JSON.stringify(Boolean(requestedBaseUrl))} && requestMethod !== 'GET' && requestMethod !== 'HEAD' && requestUrl.includes('/__dev/content-admin')) {
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

    const auditExpression = `(${buildBrowserAudit().toString()})(${Math.max(50, waitAfterInputMs)}, ${JSON.stringify([...blockFilter])}, ${JSON.stringify([...controlFilter])})`;
    const reports = [];
    for (const pathname of paths) {
      console.log(`[CONTROL BROWSER AUDIT] ${pathname}`);
      await pageConnection.command('Page.navigate', { url: `${baseUrl}${pathname}` });
      // Page.navigate resolves before the new document owns the execution
      // context. Wait for that context before touching localStorage or
      // reloading; otherwise a fast route can silently keep the HUD disabled.
      let documentReady = false;
      for (let attempt = 0; attempt < 80 && !documentReady; attempt += 1) {
        try {
          documentReady = Boolean(await evaluate(pageConnection, `(
            () => window.location.pathname === ${JSON.stringify(pathname)}
              && document.readyState !== 'loading'
          )()`));
        } catch {
          // The navigation may have replaced the execution context.
        }
        if (!documentReady) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      if (!documentReady) {
        reports.push({
          path: pathname,
          renderedBlocks: 0,
          reports: [],
          failures: [`navigation did not settle at ${pathname}`],
        });
        continue;
      }
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
            const hasBlocks = Boolean(document.querySelector('[data-block-id]'));
            const hasHud = Boolean(
              document.querySelector('.admin-front-hud-dock, .admin-front-hud-anchor'),
            );
            if (hasBlocks && hasHud) {
              return { ready: true };
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          return {
            ready: false,
            url: window.location.href,
            title: document.title,
            appBooted: Boolean(window.__AGF_APP_BOOTED__),
            hudDock: Boolean(document.querySelector('.admin-front-hud-dock')),
            hudAnchors: document.querySelectorAll('.admin-front-hud-anchor').length,
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
