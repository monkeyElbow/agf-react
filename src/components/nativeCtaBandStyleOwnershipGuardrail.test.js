import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native cta-band style ownership guardrail', () => {
  it('keeps the investments dashboard styling on its current shared billboard hook instead of generic cta-band selectors', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('.investments-native-dashboard-billboard .native-info-section-copy > p,');
    expect(source).toContain('.investments-native-dashboard-billboard > .ag-panel-rail {');
    expect(source).not.toContain('.service-native-cta-band.is-cta-band-preset-dashboard-login .investments-native-dashboard-title + p {');
    expect(source).not.toContain('.service-native-cta-band.is-cta-band-preset-dashboard-login .ag-panel-rail {');
    expect(source).not.toContain('.service-native-cta-band .investments-native-dashboard-title + p {');
  });
});
