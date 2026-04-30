import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native intro and billboard renderer guardrail', () => {
  it('keeps native intro and billboard merge paths sourced from shared canonical runtimes', () => {
    const source = readSource('./NativeContentPage.jsx');

    expect(source).toContain('buildDynamicIntroFromBlock,');
    expect(source).toContain('buildDynamicBillboardFromBlock,');
    expect(source).toContain("function buildActionRowClassName(justify, fallback = 'left') {");
    expect(source).toContain('function buildNativeIntroConfig(block, { includeTestClassName = false } = {}) {');
    expect(source).toContain('const runtime = buildDynamicIntroFromBlock(block);');
    expect(source).toContain("className: `dynamic-intro is-bg-${normalizeSurfaceBgTone(runtime.bgTone, 'sand')} is-text-${normalizePanelTextTone(runtime.textTone, 'dark')}${includeTestClassName ? ' test-dynamic-intro' : ''}`");
    expect(source).toContain('function buildNativeBillboardSection(block, { includeTestClassName = false } = {}) {');
    expect(source).toContain('const runtime = buildDynamicBillboardFromBlock(block);');
    expect(source).toContain("targetSectionKey: runtime.targetSectionKey || '',");
    expect(source).toContain('const targetedDynamicBillboardSections = new Map();');
    expect(source).toContain('consumedDynamicBillboardBlockIds.add(targetEntry.block.id);');
    expect(source).toContain('.split(/\\s+/)');
    expect(source).toContain("const heroActionRowClass = buildActionRowClassName(heroActionJustify, 'center');");
    expect(source).toContain('className={buildActionRowClassName(introJustify, \'center\')}');
    expect(source).toContain("className={buildActionRowClassName(sectionJustifyToken, 'left')}");
    expect(source).toContain("const introBlock = findVisibleDynamicBlockByKind(visibleBlocks, 'intro');");
    expect(source).toContain("const adminIntro = buildNativeIntroConfig(introBlock, { includeTestClassName: true });");
    expect(source).toContain("if (block.mode === 'dynamic' && block.kind === 'billboard') {");
    expect(source).toContain("const billboardSection = buildNativeBillboardSection(block, { includeTestClassName: isTestPage });");
    expect(source).not.toContain('copyClassName: `is-justify-${normalizeHeroJustify(runtime.justify)}`');
    expect(source).not.toContain('function buildTestDynamicIntro(');
    expect(source).not.toContain('function buildTestDynamicBillboard(');
  });

  it('keeps shared intro heading color overrides available in generic runtime CSS, not only the test route', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-intro.dynamic-intro .service-native-intro-copy > h2.is-super-grey,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro .service-native-intro-copy > h2 mark.is-super-grey,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro .service-native-intro-copy > h2.is-white,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro .service-native-intro-copy > h2 mark.is-white,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro .service-native-intro-copy > h2.is-atlantean,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro .service-native-intro-copy > h2 mark.is-atlantean,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro .service-native-intro-copy > h2.is-sandstone,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro .service-native-intro-copy > h2 mark.is-sandstone,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro.is-text-blue,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro.is-text-blue .service-native-intro-copy > h2,');
    expect(cssSource).toContain('.service-native-intro.dynamic-intro.is-text-blue .native-info-rich-html a,');
    expect(cssSource).toContain('.native-info-rich-html .is-atlantean {');
    expect(cssSource).toContain('.native-info-rich-html .is-white {');
    expect(cssSource).toContain('.native-info-page--test .service-native-section.test-dynamic-billboard .native-info-section-copy > h2.is-sandstone,');
    expect(cssSource).toContain('.native-info-page--test .service-native-section.test-dynamic-billboard .native-info-section-copy > h2 mark.is-sandstone {');
  });
});
