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
    const sharedRendererSource = readSource('./blocks/PageBlocksRenderer.jsx');
    const runtimeSource = readSource('../lib/dynamicPageBlocks.js');
    const compositionSource = readSource('../lib/managedPageComposition.js');

    expect(source).toContain("import { buildCanonicalBlockRuntime } from '../blocks/registry';");
    expect(source).toContain("import { normalizeIntroLineSpacing } from '../lib/dynamicSectionTypography';");
    expect(source).toContain("function buildActionRowClassName(justify, fallback = 'left') {");
    expect(source).toContain("function buildActionRowStyle(justify, fallback = 'left') {");
    expect(source).toContain('function buildNativeIntroConfig(block, { includeTestClassName = false } = {}) {');
    expect(source).toContain('const runtime = buildCanonicalBlockRuntime(block);');
    expect(source).toContain('className: `dynamic-intro${runtime.sectionClassName');
    expect(source).toContain("is-bg-${normalizeSurfaceBgTone(runtime.bgTone, 'sand')}");
    expect(source).toContain('backgroundEffects: runtime.backgroundEffects');
    expect(source).toContain('function buildNativeBillboardSection(block, { includeTestClassName = false } = {}) {');
    expect(source).toContain('const runtime = buildCanonicalBlockRuntime(block);');
    expect(source).not.toContain("targetSectionKey: runtime.targetSectionKey || '',");
    expect(source).not.toContain('const targetedDynamicBillboardSections = new Map();');
    expect(source).not.toContain('consumedDynamicBillboardBlockIds.add(targetEntry.block.id);');
    expect(source).toContain('.split(/\\s+/)');
    expect(source).toContain("const heroActionRowClass = buildActionRowClassName(heroActionJustify, 'center');");
    expect(source).toContain('className={buildActionRowClassName(introJustify, \'center\')}');
    expect(sharedRendererSource).toContain('function buildBillboardActionRowStyle(justify, actionGapRem) {');
    expect(sharedRendererSource).toContain('className={`service-native-action-row${effectiveJustify === \'center\' ? \' is-centered\' : \'\'}');
    expect(sharedRendererSource).toContain('...buildBillboardActionRowStyle(effectiveJustify, runtime.actionGapRem)');
    expect(source).toContain('function buildManagedBlockSection(block, {');
    expect(source).toContain("if (renderBlock.kind === 'billboard') {");
    expect(source).toContain('buildNativeBillboardSection(renderBlock, { includeTestClassName: isTestPage });');
    expect(compositionSource).toContain('const managedEntries = renderedBlocks');
    expect(compositionSource).toContain('buildSection(block, { pathname, isBlockOnlyManagedPage })');
    expect(source).not.toContain('routeScopedClassName');
    expect(source).not.toContain("pathname === '/services/retirement/403b'");
    expect(source).not.toContain('function normalizeIntroLineSpacing(');
    expect(source).not.toContain('function normalizeBillboardLineSpacing(');
    expect(runtimeSource).toContain("} from './dynamicSectionTypography';");
    expect(runtimeSource).toContain('normalizeBillboardSubtitleSizeRem(settings.subtitleSizeRem)');
    expect(runtimeSource).toContain('normalizeIntroExtraLineSizeRem(settings.extraLineSizeRem)');
    expect(runtimeSource).toContain("'--service-native-intro-emphasis-size'");
    expect(runtimeSource).toContain("'--service-native-intro-emphasis-space-before'");
    expect(runtimeSource).toContain("'--service-native-intro-emphasis-line-height'");
    expect(runtimeSource).toContain('subtitleStyle: buildBillboardSubtitleStyle({');
    expect(runtimeSource).toContain('titleStyle: buildBillboardTitleStyle({');
    expect(runtimeSource).toContain("const bodyJustifyToken = String(settings.bodyJustify || settings.justify || 'center').trim().toLowerCase();");
    expect(runtimeSource).toContain("'--dynamic-billboard-body-max-width'");
    expect(runtimeSource).toContain("'--dynamic-billboard-header-gap'");
    expect(source).toContain('bodyJustify: normalizeHeroJustify(runtime.bodyJustify || \'center\')');
    expect(source).toContain('is-dynamic-billboard-header-gap');
    expect(source).toContain('is-body-justify-${sectionBodyJustifyToken}');
    expect(source).toContain("'billboard-body-copy',");
    expect(source).toContain("section.htmlClassName || '',");
    expect(source).not.toContain('copyClassName: `is-justify-${normalizeHeroJustify(runtime.justify)}`');
    expect(source).not.toContain('function buildTestDynamicIntro(');
    expect(source).not.toContain('function buildTestDynamicBillboard(');
  });

  it('keeps semantic body swatches working for plain-text native billboards', () => {
    const cssSource = readSource('../styles/service-native.css');
    const selector = '.native-info-section-copy > p.billboard-body-copy';

    expect(cssSource).toContain(`${selector}.is-atlantean`);
    expect(cssSource).toContain(`${selector}.is-mango`);
    expect(cssSource).toContain(`${selector}.is-melon`);
    expect(cssSource).toContain(`${selector}.is-sandstone`);
    expect(cssSource).toContain(`${selector}.is-super-grey`);
    expect(cssSource).toContain(`${selector}.is-white`);
  });

  it('keeps billboard background swatches separate from the explicit text-tone swatch', () => {
    const cssSource = readSource('../styles/service-native.css');
    const homeCssSource = readSource('../styles/home-native.css');

    expect(cssSource).not.toContain(
      '.service-native-section.dynamic-billboard.is-bg-blue {\n'
        + '  background: var(--ag-surface-blue-gradient);\n'
        + '  color: #ffffff;',
    );
    expect(cssSource).not.toContain(
      '.service-native-section.test-dynamic-billboard.is-bg-blue {\n'
        + '  background: var(--ag-surface-blue-gradient);\n'
        + '  color: #ffffff;',
    );
    expect(homeCssSource).not.toContain(
      '.home-native-page .service-native-section.home-native-billboard.is-bg-blue {\n'
        + '  background: var(--ag-surface-blue-gradient);\n'
        + '  color: #ffffff;',
    );
  });

  it('keeps shared intro heading color overrides available in generic runtime CSS, not only the test route', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-intro {');
    expect(cssSource).toContain('--service-native-intro-padding-top: clamp(3.55rem, 8vw, 5.95rem);');
    expect(cssSource).toContain('--service-native-intro-padding-bottom: clamp(4.1rem, 9.2vw, 6.95rem);');
    expect(cssSource).toContain('padding: var(--service-native-intro-padding-top) 0 var(--service-native-intro-padding-bottom);');
    expect(cssSource).toContain('.native-info-page--impact .service-native-intro {');
    expect(cssSource).toContain('.native-info-page--careers .service-native-intro.careers-native-top-intro {');
    expect(cssSource).toContain('.native-info-page--careers .service-native-intro.careers-native-top-intro h2,');
    expect(cssSource).not.toContain('.native-info-page--impact .service-native-intro {\n  background: linear-gradient(145deg, #f3f0eb 0%, #e6e1d7 100%);\n  padding-bottom: clamp(2.2rem, 5vw, 3.8rem);\n}');
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
    expect(cssSource).toContain('.service-native-intro.dynamic-intro.is-text-blue .native-info-rich-html a:not(.service-native-btn),');
    expect(cssSource).toContain('.native-info-rich-html .is-atlantean {');
    expect(cssSource).toContain('.native-info-rich-html .is-white {');
    expect(cssSource).toContain('margin-top: var(--service-native-intro-emphasis-space-before, 1rem);');
    expect(cssSource).toContain('line-height: var(--service-native-intro-emphasis-line-height, 0.94);');
    expect(cssSource).toContain('.service-native-section.test-dynamic-billboard .native-info-section-copy > h2.is-sandstone,');
    expect(cssSource).toContain('.service-native-section.test-dynamic-billboard .native-info-section-copy > h2 mark.is-sandstone {');
  });

  it('keeps white available for intro HUD backgrounds without changing the shared intro runtime palette plumbing', () => {
    const editorSource = readSource('./block-editors/migratedBlockEditors.jsx');
    const hudSource = readSource('./IntroHudEditorShared.jsx');

    expect(editorSource).toContain('allowWhiteBackground');
    expect(editorSource).not.toContain('allowWhiteBackground={false}');
    expect(hudSource).toContain('allowWhiteBackground = false,');
    expect(hudSource).toContain('const backgroundOptions = allowWhiteBackground');
    expect(hudSource).toContain('? SURFACE_BG_TONE_OPTIONS');
    expect(hudSource).toContain(": SURFACE_BG_TONE_OPTIONS.filter((option) => option.value !== 'white');");
  });

  it('keeps custom billboard pages wired to the shared runtime contract without page-local fallback blocks', () => {
    const loansSource = readSource('../pages/LoansPage.jsx');
    const retirementSource = readSource('../pages/RetirementPage.jsx');
    const servicesSource = readSource('../pages/ServicesPage.jsx');
    const sharedRendererSource = readSource('./blocks/PageBlocksRenderer.jsx');
    const cssSource = readSource('../styles/service-native.css');

    expect(loansSource).toContain('<BillboardBlock');
    expect(loansSource).toContain('block={visionFuelBlock}');
    expect(loansSource).toContain('extraSectionClassName={`loans-native-vision-fuel${getHudBlockStateClassName(\'vision_fuel\')}`}');
    expect(loansSource).not.toContain('fallbackVisionFuel');
    expect(cssSource).toContain('.loans-native-vision-fuel > .ag-panel-rail {');
    expect(sharedRendererSource).toContain('export function BillboardBlock');
    expect(sharedRendererSource).toContain('buildCanonicalBlockRuntime(block)');
    expect(sharedRendererSource).toContain('data-block-id={block?.id || undefined}');
    expect(sharedRendererSource).toContain('runtime.subtitle ?');
    expect(sharedRendererSource).toContain('runtime.actionGapRem');
    expect(cssSource).toContain('.loans-native-vision-fuel .native-info-section-subtitle {');
    expect(cssSource).toContain('--dynamic-billboard-copy-max-width: 44rem;');
    expect(cssSource).toContain('--dynamic-billboard-body-max-width: 36ch;');
    expect(cssSource).not.toContain('.loans-native-vision-fuel .loans-native-vision-fuel-title,');

    expect(retirementSource).toContain('<BillboardBlock');
    expect(retirementSource).toContain("ownership={getOwnershipVisualForBlockId('rollover_billboard')}");
    expect(retirementSource).toContain("ownership={getOwnershipVisualForBlockId('billboard')}");
    expect(retirementSource).not.toContain('fallbackRolloverBillboard');

    expect(servicesSource).toContain('bodyColorClassName: runtime.bodyColorClassName');
    expect(servicesSource).toContain('resolvedIntro.bodyColorClassName');
    expect(servicesSource).toContain('servicesMattersRuntime.bodyColorClassName');

    expect(cssSource).toContain('.services-native-page [data-block-id="intro"]');
    expect(cssSource).toContain('.services-native-page [data-block-id="matters_band"]');
    expect(cssSource).toContain('.loans-native-option-question-wrap');
    expect(cssSource).toContain('.retirement-do-the-math-billboard');
  });
});
