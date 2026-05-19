import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('careers route review polish guardrail', () => {
  it('keeps negative tracking on the Ready and Work Matters section titles only on the careers route', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--careers .careers-native-ready > .ag-panel-rail > h2 {');
    expect(cssSource).toContain('.native-info-page--careers .careers-native-matters > .ag-panel-rail > h2 {');
    expect(cssSource).toContain('letter-spacing: -0.03em;');
  });

  it('keeps the ADP apply link scoped to the careers jobs list action row rather than turning the whole card into a stretched link', () => {
    const rendererSource = readSource('./nativeFunctionalRouteRenderers.jsx');

    expect(rendererSource).toContain('<article key={job.id || job.title} className="careers-native-job">');
    expect(rendererSource).toContain('<div className="service-native-action-row is-centered">');
    expect(rendererSource).toContain('<a href={job.applyUrl} target="_blank" rel="noreferrer noopener" className="service-native-btn">');
    expect(rendererSource).not.toContain('careers-native-job service-native-card has-stretched-link');
  });
});
