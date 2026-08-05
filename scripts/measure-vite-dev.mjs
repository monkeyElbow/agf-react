import { performance } from 'node:perf_hooks';

const baseUrl = String(process.env.VITE_DEV_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const routes = ['/', '/services/planned-giving', '/services/planned-giving/charitable-trusts'];

async function measure(pathname) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { Accept: 'text/html' },
  });
  const body = await response.arrayBuffer();
  const durationMs = performance.now() - startedAt;
  return {
    path: pathname,
    status: response.status,
    durationMs: Math.round(durationMs * 100) / 100,
    bytes: body.byteLength,
  };
}

async function main() {
  const cold = [];
  const warm = [];
  for (const pathname of routes) {
    cold.push(await measure(pathname));
  }
  for (const pathname of routes) {
    warm.push(await measure(pathname));
  }

  const diagnosticsResponse = await fetch(`${baseUrl}/__dev/content-admin/diagnostics`);
  const diagnostics = diagnosticsResponse.ok ? await diagnosticsResponse.json() : null;

  console.log(JSON.stringify({
    baseUrl,
    measuredAt: new Date().toISOString(),
    cold,
    warm,
    diagnostics,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
