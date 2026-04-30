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
  it('keeps the shared dynamic rates/legal copy builders, safe rich text boundary, and HUD host in the rates page path', () => {
    const source = readSource('./RatesPage.jsx');

    expect(source).toContain("import BlockHudPanelHost from '../components/BlockHudPanelHost';");
    expect(source).toContain("import SafeRichText from '../components/SafeRichText';");
    expect(source).toContain("import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';");
    expect(source).toContain("buildDynamicLegalCopyFromBlock, buildDynamicRatesFromBlock } from '../lib/dynamicPageBlocks';");
    expect(source).toContain('function buildRatesPageRuntime(block) {');
    expect(source).toContain("if (blockKind === 'rates') {");
    expect(source).not.toContain("if (blockKind === 'legal_copy') {");
    expect(source).toContain('runtime: buildRatesPageRuntime(block),');
    expect(source).not.toContain('runtime: buildDynamicRatesFromBlock(block) || buildDynamicLegalCopyFromBlock(block, {');
    expect(source).toContain("panelIdByKind: { rates: 'rates-table' },");
    expect(source).toContain('settings: legalCopy,');
    expect(source).toContain('const managedBlockRef = useRef(null);');
    expect(source).toContain('scrollToElement(managedBlockRef.current);');
    expect(source).toContain('className="rates-page-managed-block"');
    expect(source).toContain('<BlockHudPanelHost');
    expect(source).toContain('<SafeRichText');
    expect(source).toContain("html={legalCopyRuntime?.certificatesHtml || ''}");
    expect(source).toContain("html={legalCopyRuntime?.iraHtml || ''}");
    expect(source).toContain('pathname="/rates"');
    expect(source).not.toContain('This is not an offer to sell securities.');
  });
});
