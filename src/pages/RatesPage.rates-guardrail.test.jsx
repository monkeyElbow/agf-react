import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('rates page renderer guardrail', () => {
  it('keeps the shared dynamic rates/legal copy builders, safe rich text boundary, HUD host, and investments-matching certificate wrapper classes in the rates page path', () => {
    const source = readSource('./RatesPage.jsx');
    const cssSource = readSource('../styles.css');
    const serviceNativeCssSource = readSource('../styles/service-native.css');

    expect(source).toContain("LazyBlockHudPanelHost as BlockHudPanelHost");
    expect(source).not.toContain("from '../components/BlockHudPanelHost';");
    expect(source).toContain("import RatesBlock from '../components/RatesBlock';");
    expect(source).toContain("import SafeRichText from '../components/SafeRichText';");
    expect(source).toContain("import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';");
    expect(source).toContain("buildDynamicLegalCopyFromBlock, buildDynamicRatesFromBlock } from '../lib/dynamicPageBlocks';");
    expect(source).toContain('function buildRatesPageRuntime(block) {');
    expect(source).toContain("if (blockKind === 'rates') {");
    expect(source).not.toContain("if (blockKind === 'legal_copy') {");
    expect(source).toContain('runtime: buildRatesPageRuntime(block),');
    expect(source).not.toContain('runtime: buildDynamicRatesFromBlock(block) || buildDynamicLegalCopyFromBlock(block, {');
    expect(source).not.toContain("panelIdByKind: { rates: 'rates-table' },");
    expect(source).toContain('settings: legalCopy,');
    expect(source).toContain('const managedBlockRef = useRef(null);');
    expect(source).toContain('scrollToElement(managedBlockRef.current);');
    expect(source).toContain('className="rates-page-managed-block"');
    expect(source).toContain('className={`rates-page-managed-rate rates-page-managed-rate--${dataset || \'unknown\'} fade-up`}');
    expect(source).toContain('<BlockHudPanelHost');
    expect(source).toContain("dataset === 'ira' ? (");
    expect(source).toContain('<h2 className="rates-page-subheading">IRA Investment Rates</h2>');
    expect(source).toContain('<RatesBlock runtime={runtime} rates={rates} iraRates={iraRates} ratesMeta={ratesMeta} />');
    expect(source).toContain('<SafeRichText');
    expect(source).toContain('const legalHtml = dataset === \'ira\'');
    expect(source).toContain('pathname="/rates"');
    expect(source).not.toContain('This is not an offer to sell securities.');
    expect(source).not.toContain('<table className="data-table data-table--fixed">');
    expect(cssSource).toContain('.rates-page .page-shell-header h1 {');
    expect(cssSource).toContain('.rates-page-managed-block {');
    expect(cssSource).toContain('padding-bottom: max(1.5rem, var(--site-chatbot-mobile-reserved-space, 0px));');
    expect(cssSource).toContain('.rates-page .rates-disclaimer p:first-child {');
    expect(serviceNativeCssSource).toContain('.retirement-403b-native-rate-table > .ag-panel-rail > h2 {');
    expect(serviceNativeCssSource).toContain('color: var(--ag-color-atlantean);');
    expect(serviceNativeCssSource).not.toContain('retirement-403b-native-rate-table > .ag-panel-rail > h2 {\n  color: var(--ag-color-atlantean-dark);');
  });
});
