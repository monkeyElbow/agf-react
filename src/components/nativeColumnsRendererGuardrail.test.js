import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native columns renderer guardrail', () => {
  it('keeps the shared dynamic columns builder in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicColumnsFromBlock,');
    expect(source).toContain('const runtime = buildDynamicColumnsFromBlock(block);');
    expect(source).toContain("const sectionClassBase = pathname === '/test' ? 'test-dynamic-columns' : 'native-dynamic-columns';");
    expect(source).toContain('const presetClassToken = resolvePresetFamilyClassToken(block);');
    expect(source).toContain("const presetRuntimeClassName = buildPresetFamilyRuntimeClassName('columns', presetClassToken);");
    expect(source).not.toContain('normalizeColumnsPresetClassToken(block);');
    expect(source).toContain('buildDynamicColumnsSection(renderBlock, pathname);');
    expect(source).not.toContain('buildDynamicColumnsSection(block, activePath, resolveManagedPathFromRef)');
  });

  it('does not keep a dormant loans value-cards skip in the native page renderer once the legacy bridge is retired', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).not.toContain("if (activePath === '/services/loans' && block.id === 'value_cards') {");
    expect(source).not.toContain('const hasLoansLegacySections = (');
    expect(source).not.toContain("if (hasLoansLegacySections && block.id === 'value_cards') {");
    expect(source).not.toContain("nextBaseContent.sections.some((section) => section?.widget === 'loans-legacy-sections')");
  });
});
