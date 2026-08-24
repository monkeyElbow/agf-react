import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('color system convergence guardrail', () => {
  it('keeps shared editor and runtime color wiring on the central color system path', () => {
    const tokensSource = readSource('../styles/tokens.css');
    const heroHudSource = readSource('../components/HeroHudEditorShared.jsx');
    const introHudSource = readSource('../components/IntroHudEditorShared.jsx');
    const ctaHudSource = readSource('../components/CtaHudEditorPanel.jsx');
    const columnsHudSource = readSource('../components/ColumnsHudEditorPanel.jsx');
    const migratedEditorsSource = readSource('../components/block-editors/migratedBlockEditors.jsx');
    const adminPageSource = readSource('../pages/AdminContentPage.jsx');
    const nativePageSource = readSource('../components/NativeContentPage.jsx');
    const runtimeSource = readSource('./dynamicPageBlocks.js');
    const pageBlocksSource = readSource('../components/blocks/PageBlocksRenderer.jsx');
    const htmlEditorSource = readSource('../components/AdminHtmlEditor.jsx');
    const serviceNativeStyles = readSource('../styles/service-native.css');
    const definitionSources = [
      '../blocks/definitions/hero.definition.js',
      '../blocks/definitions/billboard.definition.js',
      '../blocks/definitions/columns.definition.js',
      '../blocks/definitions/cardGrid.definition.js',
      '../blocks/definitions/ctaForm.definition.js',
      '../blocks/definitions/intro.definition.js',
      '../blocks/definitions/newsletter.definition.js',
      '../blocks/definitions/pageContent.definition.js',
    ].map(readSource);

    expect(tokensSource).toContain('--ag-color-white');
    expect(tokensSource).toContain('--ag-color-sand');
    expect(tokensSource).toContain('--ag-color-mango-dark');
    expect(tokensSource).toContain('--ag-color-super-grey-dark');

    [
      heroHudSource,
      introHudSource,
      ctaHudSource,
      columnsHudSource,
      migratedEditorsSource,
      adminPageSource,
      nativePageSource,
      runtimeSource,
      pageBlocksSource,
      htmlEditorSource,
    ].forEach((source) => {
      expect(source).toContain('colorSystem');
    });

    definitionSources.forEach((source) => {
      expect(source).toContain("from '../../lib/colorSystem'");
    });

    expect(heroHudSource).not.toContain('const HERO_BG_SWATCH_OPTIONS = [');
    expect(heroHudSource).not.toContain('const HERO_TEXT_COLOR_OPTIONS = [');

    expect(introHudSource).not.toContain('const INTRO_HEADING_COLOR_OPTIONS = [');
    expect(introHudSource).not.toContain('const INTRO_BG_SWATCH_OPTIONS = [');
    expect(introHudSource).not.toContain('const INTRO_TEXT_TONE_OPTIONS = [');
    expect(introHudSource).not.toContain('const INTRO_EXTRA_LINE_TONE_OPTIONS = [');

    expect(ctaHudSource).not.toContain('const CTA_HUD_BG_SWATCH_OPTIONS = [');
    expect(ctaHudSource).not.toContain('const CTA_HUD_TITLE_COLOR_OPTIONS = [');
    expect(ctaHudSource).not.toContain('const CTA_HUD_SUBMIT_TONE_OPTIONS = [');

    expect(adminPageSource).not.toContain("linear-gradient(145deg, #00adbb");
    expect(migratedEditorsSource).not.toContain("linear-gradient(145deg, #00adbb");
    expect(htmlEditorSource).not.toContain("{ id: 'atlantean'");

    expect(nativePageSource).toContain('normalizeSemanticTextColorClass');
    expect(nativePageSource).toContain('resolveIntroAccentColor');
    expect(runtimeSource).toContain('normalizeSurfaceBgTone');
    expect(runtimeSource).toContain('normalizeButtonTone');
    expect(pageBlocksSource).toContain('normalizeSemanticTextColorClass');

    // The public rich-body authority must preserve the light semantic
    // Atlantean token. Buttons intentionally use their separate dark/hover
    // contract and are not covered by this selector.
    expect(serviceNativeStyles).toContain(
      '.service-native-page .native-info-rich-html .is-atlantean {\n  color: var(--ag-color-atlantean) !important;',
    );
    expect(serviceNativeStyles).not.toContain(
      '.service-native-page .native-info-rich-html .is-atlantean {\n  color: var(--ag-color-atlantean-dark) !important;',
    );
  });
});
