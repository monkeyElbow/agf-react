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
const baseUrl = String(args.get('url') || process.env.VITE_DEV_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const requestedPort = Number(args.get('cdp-port') || 0);
const cdpPorts = requestedPort
  ? [requestedPort]
  : String(process.env.CDP_PORTS || '9222,9223,9224,9226,9227')
    .split(',')
    .map((port) => Number(port.trim()))
    .filter(Boolean);

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
    const contractResponse = await fetch('/__dev/content-admin/render-contract?path=' + encodeURIComponent(path), {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const diagnosticsResponse = await fetch('/__dev/content-admin/diagnostics', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const contract = await contractResponse.json().catch(() => null);
    const diagnostics = await diagnosticsResponse.json().catch(() => null);
    const failures = [];
    const sections = [...document.querySelectorAll('[data-block-id]')];
    const source = sections.find((section) => section.dataset.contentSource)?.dataset.contentSource || 'published';
    const expected = contract?.[source] || null;

    if (!contractResponse.ok || !expected) {
      failures.push('render contract unavailable for ' + path);
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
    await pageConnection.command('Page.navigate', { url: baseUrl + pathname });
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const expression = '(' + buildProbe(pathname).toString() + ')()';
    const result = await pageConnection.command('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    const report = result?.result?.value || { ok: false, failures: ['browser probe returned no result'] };
    console.log(JSON.stringify({ ...report, cdpPort: browser.port, baseUrl }, null, 2));
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
