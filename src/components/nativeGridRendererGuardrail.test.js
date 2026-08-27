import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native grid renderer guardrail', () => {
  it('keeps the shared dynamic grid builder in the native page path', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicGridFromBlock,');
    expect(source).toContain('const runtime = buildDynamicGridFromBlock(block);');
    expect(source).toContain("const sectionClassBase = pathname === '/test' ? 'test-dynamic-grid' : 'native-dynamic-grid';");
    expect(source).toContain("const presetRuntimeClassName = buildPresetFamilyRuntimeClassName('card_grid', presetId);");
    expect(source).not.toContain('is-card-grid-preset-${presetId}');
    expect(source).toContain('buildDynamicGridSection(renderBlock, pathname, { getConsultants });');
    expect(source).not.toContain('buildDynamicGridSection(block, activePath, resolveManagedPathFromRef)');
  });

  it('keeps shared lead-copy sizing on the grid intro copy in runtime CSS', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-section.native-dynamic-grid .native-info-section-copy > p,');
    expect(cssSource).toContain('.service-native-section.native-dynamic-grid .native-info-section-copy .native-info-rich-html > p:first-child,');
    expect(cssSource).toContain('font-size: clamp(1.08rem, 1.9vw, 1.26rem);');
    expect(cssSource).toContain(':is(.native-info-rich-html, .service-native-card-rich-body) .is-text-display {\n  font-size: 1.3em !important;\n}');
    expect(cssSource).toContain('var(--dynamic-grid-subhead-color)');
  });
});
