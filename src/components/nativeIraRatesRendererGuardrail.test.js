import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native ira rates renderer guardrail', () => {
  it('keeps the retirement IRA rates section on the shared IRA rates sheet instead of a bespoke legacy table widget', () => {
    const source = readSource('./NativeContentPage.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(source).toContain("import IraRatesSheet from './IraRatesSheet';");
    expect(source).toContain('function RetirementIraRateTableWidget({ iraRates, ratesMeta }) {');
    expect(source).toContain('<IraRatesSheet rates={iraRates} />');
    expect(source).not.toContain('<div className="retirement-ira-rate-widget">');
    expect(source).not.toContain('function RetirementIraRateTableWidget({ iraRates, ratesMeta }) {\n  const rows = Array.isArray(iraRates) ? iraRates : [];');
    expect(cssSource).toContain('.native-info-page--retirement-iras .retirement-ira-native-rates {');
    expect(cssSource).toContain('padding-top: clamp(5.6rem, 8.5vw, 7rem);');
    expect(cssSource).toContain('.native-info-page--retirement-iras .retirement-ira-native-rates > .ag-panel-rail {');
    expect(cssSource).toContain('max-width: 58rem;');
    expect(cssSource).toContain('.native-info-page--retirement-iras .retirement-ira-native-rates .ira-rates-sheet {');
    expect(cssSource).toContain('max-width: 44rem;');
    expect(cssSource).not.toContain('.native-info-page--retirement-iras .retirement-ira-native-rates .retirement-ira-rate-widget .data-table {');
  });
});
