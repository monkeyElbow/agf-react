/* eslint-disable no-undef */
import process from 'node:process';

const args = new Map(
  process.argv.slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...rest] = arg.slice(2).split('=');
      return [key, rest.join('=') || 'true'];
    }),
);

const pathname = String(args.get('path') || process.env.VERIFY_ROUTE || '/online-contributions').trim() || '/';
const baseUrl = String(args.get('url') || process.env.VITE_DEV_URL || 'http://127.0.0.1:5174').replace(/\/$/, '');
const auditWidths = String(args.get('widths') || process.env.VERIFY_WIDTHS || '1440')
  .split(',')
  .map((width) => Number(width.trim()))
  .filter((width) => Number.isFinite(width) && width > 0);
const requestedPort = Number(args.get('cdp-port') || 0);
const cdpPorts = requestedPort
  ? [requestedPort]
  : String(process.env.CDP_PORTS || '9222,9223,9224,9226,9227')
    .split(',')
    .map((port) => Number(port.trim()))
    .filter(Boolean);
const requestedBlockId = String(args.get('block-id') || '').trim();
const requestedSelector = String(args.get('selector') || '').trim();
const requestedStyleProperties = String(args.get('style') || '')
  .split(',')
  .map((property) => property.trim())
  .filter(Boolean);
const requestedCssVariables = String(args.get('css-vars') || '')
  .split(',')
  .map((property) => property.trim())
  .filter(Boolean);
const requestedLinkSelector = String(args.get('link-selector') || '').trim();
const expectedRenderer = String(args.get('expect-renderer') || '').trim();
const expectedSource = String(args.get('expect-source') || '').trim();
const requestedReadbackKeys = String(args.get('readback-keys') || '')
  .split(',')
  .map((key) => key.trim())
  .filter(Boolean);
const expectedHud = args.has('expect-hud')
  ? String(args.get('expect-hud')).toLowerCase() === 'true'
  : null;

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(url + ' returned ' + response.status);
  }
  return response.json();
}

async function findCdpBrowser() {
  for (const port of cdpPorts) {
    try {
      const version = await getJson('http://127.0.0.1:' + port + '/json/version');
      if (version?.webSocketDebuggerUrl) {
        return { port, version };
      }
    } catch {
      // Try the next local browser debugging port.
    }
  }
  throw new Error('No browser debugging port found. Tried ' + cdpPorts.join(', ') + '.');
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
    const pendingCommand = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      pendingCommand.reject(new Error(message.error.message || 'CDP command failed'));
    } else {
      pendingCommand.resolve(message.result || {});
    }
  });

  return {
    socket,
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

async function waitForTarget(port, targetId) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const targets = await getJson('http://127.0.0.1:' + port + '/json');
    const target = targets.find((entry) => entry.id === targetId && entry.webSocketDebuggerUrl);
    if (target) {
      return target;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Browser target ' + targetId + ' did not become available.');
}

function buildProbe(path) {
  return async function probe() {
    const validateAuthority = ({ blockId = '', actualAuthority = null, expectedRenderer = '', expectedSource = '', expectedHud = null, actualHud = null } = {}) => {
      const failures = [];
      const normalizedBlockId = String(blockId || '').trim() || '(current block)';
      if (!actualAuthority) {
        failures.push(normalizedBlockId + ': runtime authority descriptor unavailable');
        return failures;
      }
      if (expectedRenderer && actualAuthority.renderer !== expectedRenderer) {
        failures.push('wrong renderer for ' + normalizedBlockId + ': expected ' + expectedRenderer + ', actual ' + (actualAuthority.renderer || '(unknown)') + '. Repair may be targeting the wrong implementation.');
      }
      if (expectedSource && actualAuthority.source !== expectedSource) {
        failures.push('wrong source for ' + normalizedBlockId + ': expected ' + expectedSource + ', actual ' + (actualAuthority.source || '(unknown)') + '. Repair may be targeting the wrong snapshot.');
      }
      if (expectedHud !== null && Boolean(actualHud) !== Boolean(expectedHud)) {
        failures.push('HUD state is ' + Boolean(actualHud) + ', expected ' + Boolean(expectedHud));
      }
      return failures;
    };
    const buildStyleProof = ({ elementExists = false, selector = '', computedStyles = {}, cssVariables = {}, inlineStyles = {}, matchedRules = [] } = {}) => ({
      selector: String(selector || '').trim(),
      elementExists: Boolean(elementExists),
      computedStyles: { ...(computedStyles || {}) },
      cssVariables: { ...(cssVariables || {}) },
      inlineStyles: { ...(inlineStyles || {}) },
      matchedRules: Array.isArray(matchedRules) ? matchedRules : [],
    });
    const contractResponse = await fetch('/__dev/content-admin/render-contract?path=' + encodeURIComponent(path), {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const routeStateResponse = await fetch('/__dev/content-admin/route-state?path=' + encodeURIComponent(path), {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const diagnosticsResponse = await fetch('/__dev/content-admin/diagnostics', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const contract = await contractResponse.json().catch(() => null);
    const routeState = await routeStateResponse.json().catch(() => null);
    const diagnostics = await diagnosticsResponse.json().catch(() => null);
    const failures = [];
    const sections = [...document.querySelectorAll('[data-block-id]')];
    const runtimeAuthority = window.__AGF_CONTENT_RUNTIME_AUTHORITY__ || null;
    const source = sections.find((section) => section.dataset.contentSource)?.dataset.contentSource || 'published';
    const expected = contract?.[source]
      || (source === 'draft' ? contract?.authoring : null)
      || (source === 'fallback' ? contract?.published : null)
      || null;

    if (!contractResponse.ok || !expected) {
      failures.push('render contract unavailable for ' + path);
    }
    if (!routeStateResponse.ok || !routeState) {
      failures.push('route authority readback unavailable for ' + path);
    }
    if (!diagnosticsResponse.ok || !diagnostics?.buildId) {
      failures.push('Vite runtime diagnostics unavailable');
    }

    const buildIds = [...new Set(
      sections.map((section) => section.dataset.runtimeBuildId).filter(Boolean),
    )];
    if (diagnostics?.buildId && buildIds.length && !buildIds.includes(diagnostics.buildId)) {
      failures.push('stale browser bundle: DOM build ' + buildIds.join(', ') + ' != server build ' + diagnostics.buildId);
    }

    const descriptorBlocks = Array.isArray(runtimeAuthority?.blocks) ? runtimeAuthority.blocks : [];
    const descriptorById = new Map(descriptorBlocks.map((block) => [block.blockId, block]));

    const requestedSection = requestedBlockId
      ? sections.find((section) => section.dataset.blockId === requestedBlockId)
      : null;
    const requestedAuthority = requestedBlockId ? descriptorById.get(requestedBlockId) : null;
    if (requestedBlockId && !requestedSection) {
      failures.push(requestedBlockId + ': requested block is not rendered');
    }
    if (requestedBlockId && !requestedAuthority) {
      failures.push(requestedBlockId + ': requested block has no runtime authority descriptor');
    }
    if (requestedBlockId || expectedRenderer || expectedSource || expectedHud !== null) {
      failures.push(...validateAuthority({
        blockId: requestedBlockId,
        actualAuthority: requestedAuthority,
        expectedRenderer,
        expectedSource,
        expectedHud,
        actualHud: runtimeAuthority?.hudEnabled,
      }));
    }

    let requestedElement = requestedSection;
    if (requestedSection && requestedSelector) {
      requestedElement = requestedSection.querySelector(requestedSelector);
      if (!requestedElement) {
        failures.push(requestedBlockId + ': selector ' + requestedSelector + ' is not rendered');
      }
    }
    const requestedComputedStyle = requestedElement ? getComputedStyle(requestedElement) : null;
    const requestedStyles = {};
    requestedStyleProperties.forEach((property) => {
      if (requestedComputedStyle) {
        requestedStyles[property] = requestedComputedStyle.getPropertyValue(property).trim();
      }
    });
    const requestedVariables = {};
    requestedCssVariables.forEach((property) => {
      if (requestedComputedStyle) {
        requestedVariables[property] = requestedComputedStyle.getPropertyValue(property).trim();
      }
    });
    const requestedInlineStyles = requestedElement
      ? requestedStyleProperties.reduce((values, property) => ({
          ...values,
          [property]: requestedElement.style.getPropertyValue(property).trim(),
        }), {})
      : {};
    const requestedMatchedRules = [];
    if (requestedElement && requestedStyleProperties.length) {
      const visitRules = (rules, source) => {
        [...rules].forEach((rule) => {
          if (rule.cssRules) {
            visitRules(rule.cssRules, source);
            return;
          }
          if (!rule.selectorText || !requestedElement.matches(rule.selectorText)) {
            return;
          }
          const values = {};
          requestedStyleProperties.forEach((property) => {
            const value = rule.style?.getPropertyValue(property)?.trim();
            if (value) values[property] = value;
          });
          if (Object.keys(values).length) {
            requestedMatchedRules.push({ selector: rule.selectorText, source, values });
          }
        });
      };
      [...document.styleSheets].forEach((sheet) => {
        try {
          visitRules(sheet.cssRules, sheet.href || 'inline stylesheet');
        } catch {
          requestedMatchedRules.push({
            selector: '(stylesheet unavailable)',
            source: sheet.href || 'cross-origin stylesheet',
            values: {},
          });
        }
      });
    }
    const requestedLinks = requestedSection
      ? [...requestedSection.querySelectorAll(requestedLinkSelector || 'a')].map((link) => ({
          text: String(link.textContent || '').trim(),
          href: link.getAttribute('href') || '',
          target: link.getAttribute('target') || '',
          className: String(link.className || ''),
          isInsideRequestedSelector: requestedSelector ? Boolean(link.closest(requestedSelector)) : true,
        }))
      : [];
    const readbackState = expectedSource === 'published' || expectedSource === 'fallback'
      ? (routeState?.baseSnapshot || routeState?.state || {})
      : (routeState?.state || routeState?.baseSnapshot || {});
    const readbackBlock = requestedBlockId
      ? (readbackState?.blocksByPath?.[path] || []).find((block) => String(block?.id || '').trim() === requestedBlockId)
      : null;
    const authorityReadback = readbackBlock
      ? {
          blockId: requestedBlockId,
          kind: readbackBlock.kind || readbackBlock.type || '',
          settings: requestedReadbackKeys.length
            ? Object.fromEntries(requestedReadbackKeys.map((key) => [key, readbackBlock.settings?.[key]]))
            : undefined,
          draftRevision: contract?.authoring?.revision || '',
          publishedRevision: contract?.published?.revision || '',
        }
      : null;

    for (const block of expected?.blocks || []) {
      const section = sections.find((candidate) => candidate.dataset.blockId === block.blockId);
      if (!section) {
        failures.push(block.blockId + ': block is not rendered');
        continue;
      }
      if (section.dataset.renderPresetId !== (block.presetId || '')) {
        failures.push(block.blockId + ': DOM preset ' + (section.dataset.renderPresetId || '(none)') + ' != ' + (block.presetId || '(none)'));
      }
      if (block.runtimeClassName && !section.classList.contains(block.runtimeClassName)) {
        failures.push(block.blockId + ': missing runtime class ' + block.runtimeClassName);
      }

      if (block.kind === 'card_grid' && block.presetId === 'step-cards') {
        const grid = section.querySelector('.service-native-grid');
        const cards = grid ? [...grid.children] : [];
        if (!grid || !cards.length) {
          failures.push(block.blockId + ': step-card grid/cards are missing');
          continue;
        }
        const gridRect = grid.getBoundingClientRect();
        const widestCard = Math.max(...cards.map((card) => card.getBoundingClientRect().width));
        if (gridRect.width > 0 && widestCard < gridRect.width * 0.75) {
          failures.push(block.blockId + ': step cards are still laid out as narrow columns');
        }
        const heading = cards[0].querySelector('h3');
        if (heading && Number.parseFloat(getComputedStyle(heading).fontSize) < 24) {
          failures.push(block.blockId + ': step number font is still editor-sized');
        }
      }
    }

    const numberedSections = sections.filter((section) => section.classList.contains('is-numbered-step-cards'));
    for (const section of numberedSections) {
      const rail = [...section.children].find((child) => child.matches('.ag-panel-rail, .ag-panel-rail-wide, .native-info-full-bleed'));
      const grid = section.querySelector('.service-native-grid');
      const cards = grid ? [...grid.children].filter((card) => card.classList.contains('service-native-card')) : [];
      if (!rail || !grid || !cards.length) {
        failures.push((section.dataset.blockId || 'numbered-step-cards') + ': shared numbered-card rail or cards are missing');
        continue;
      }

      const railRect = rail.getBoundingClientRect();
      const railCenter = railRect.left + (railRect.width / 2);
      if (Math.abs(railCenter - (window.innerWidth / 2)) > 4) {
        failures.push((section.dataset.blockId || 'numbered-step-cards') + ': numbered-card rail is not centered');
      }

      const card = cards[0];
      const heading = card.querySelector('h3');
      const headingStyle = heading ? getComputedStyle(heading) : null;
      const cardStyle = getComputedStyle(card);
      const gridStyle = getComputedStyle(grid);
      const numberSize = headingStyle ? Number.parseFloat(headingStyle.fontSize) : 0;
      const radius = Number.parseFloat(cardStyle.borderTopLeftRadius);
      const expectedBorderColors = [
        'rgb(0, 173, 187)',
        'rgb(250, 163, 26)',
        'rgb(177, 170, 162)',
      ];
      if (!heading || numberSize < 40) {
        failures.push((section.dataset.blockId || 'numbered-step-cards') + ': shared number font is not applied');
      }
      if (Math.abs(radius - 28) > 1) {
        failures.push((section.dataset.blockId || 'numbered-step-cards') + ': shared card radius is ' + radius + 'px, expected 28px');
      }
      cards.slice(0, 3).forEach((candidate, index) => {
        const expectedBorderColor = expectedBorderColors[index];
        const actualBorderColor = getComputedStyle(candidate).borderTopColor;
        if (actualBorderColor !== expectedBorderColor) {
          failures.push(
            (section.dataset.blockId || 'numbered-step-cards')
              + ': card '
              + (index + 1)
              + ' border color is '
              + actualBorderColor
              + ', expected '
              + expectedBorderColor,
          );
        }
      });
      if (window.innerWidth > 720 && gridStyle.gridTemplateColumns.split(' ').length !== 1) {
        failures.push((section.dataset.blockId || 'numbered-step-cards') + ': numbered cards are not stacked');
      }
    }

    return {
      ok: failures.length === 0,
      pathname: path,
      source,
      contractRevision: expected?.revision || '',
      runtimeBuildIds: buildIds,
      serverBuildId: diagnostics?.buildId || '',
      renderedBlocks: sections.map((section) => ({
        blockId: section.dataset.blockId || '',
        presetId: section.dataset.renderPresetId || '',
        runtimeClass: section.dataset.renderRuntimeClass || '',
        source: section.dataset.contentSource || '',
      })),
      runtimeAuthority,
      requestedBlock: requestedBlockId
        ? {
            blockId: requestedBlockId,
            authority: requestedAuthority || null,
            selector: requestedSelector,
            exists: Boolean(requestedSection),
            domText: requestedElement ? String(requestedElement.textContent || '').trim() : '',
            ...buildStyleProof({
              elementExists: Boolean(requestedElement),
              selector: requestedSelector,
              computedStyles: requestedStyles,
              cssVariables: requestedVariables,
              inlineStyles: requestedInlineStyles,
              matchedRules: requestedMatchedRules,
            }),
            links: requestedLinks,
            authorityReadback,
          }
        : null,
      failures,
    };
  };
}

async function main() {
  const browser = await findCdpBrowser();
  const browserConnection = connectWebSocket(browser.version.webSocketDebuggerUrl);
  const targetResult = await browserConnection.command('Target.createTarget', { url: 'about:blank' });
  const target = await waitForTarget(browser.port, targetResult.targetId);
  const pageConnection = connectWebSocket(target.webSocketDebuggerUrl);

  try {
    await pageConnection.command('Page.enable');
    await pageConnection.command('Runtime.enable');
    const reports = [];
    for (const width of (auditWidths.length ? auditWidths : [1440])) {
      await pageConnection.command('Emulation.setDeviceMetricsOverride', {
        width,
        height: width <= 720 ? 900 : 1000,
        deviceScaleFactor: 1,
        mobile: width <= 720,
      });
      await pageConnection.command('Page.navigate', { url: baseUrl + pathname });
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const expression = '(' + buildProbe(pathname).toString() + ')()';
      const result = await pageConnection.command('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      reports.push({
        width,
        ...(result?.result?.value || { ok: false, failures: ['browser probe returned no result'] }),
      });
    }
    const report = {
      ok: reports.every((entry) => entry.ok),
      pathname,
      baseUrl,
      cdpPort: browser.port,
      widths: reports,
    };
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.ok ? 0 : 1;
  } finally {
    await pageConnection.close();
    await browserConnection.command('Target.closeTarget', { targetId: targetResult.targetId }).catch(() => {});
    await browserConnection.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
