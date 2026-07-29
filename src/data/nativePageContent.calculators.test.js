import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('calculators native page content', () => {
  it('keeps calculators shell-only with block-owned cards, billboard, and cta sections', () => {
    const content = getNativePageContent('/calculators', '');
    const blocks = contentBlockBlueprintsByPath['/calculators'] || [];
    const utilityHeaderBlock = blocks.find((block) => block?.id === 'utility_header');
    const cardsBlock = blocks.find((block) => block?.id === 'calculator_cards');
    const billboardBlock = blocks.find((block) => block?.id === 'billboard');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form');

    expect(content?.pageClass).toBe('native-info-page--calculators');
    expect(content?.hero).toBeUndefined();
    expect(content?.hideIntro).toBeUndefined();
    expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);
    expect(blocks.some((block) => block?.id === 'hero' || block?.kind === 'hero')).toBe(false);
    expect(utilityHeaderBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Calculators',
        headingLevel: 'h1',
        sectionClassName: 'calculators-native-page-head native-functional-page-head native-functional-page-head--utility',
        justify: 'left',
      },
    });
    expect(cardsBlock).toMatchObject({ kind: 'card_grid', mode: 'dynamic' });
    expect(blocks.some((block) => block?.id === 'ministers_housing_quick_check')).toBe(false);
    expect(billboardBlock).toMatchObject({ kind: 'billboard', mode: 'dynamic' });
    expect(ctaBlock).toMatchObject({ kind: 'cta_form', mode: 'dynamic' });
    expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);

    const cssSource = readSource('../styles/service-native.css');
    expect(cssSource).not.toContain('.native-info-page--calculators .service-native-hero');
    expect(cssSource).toContain('.native-functional-page-head--utility,');
    expect(cssSource).toContain('padding: clamp(2.1rem, 4vw, 3rem) 0 clamp(1.15rem, 3vw, 1.9rem);');
    expect(cssSource).toContain('.native-functional-page-head--utility h1,');
    expect(cssSource).toContain('text-align: left;');
    expect(cssSource).toContain('.native-info-page--calculators .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).calculators-native-collection,');
    expect(cssSource).toContain('.native-info-page--calculators .calculators-native-page-head + .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).calculators-native-collection {\n  padding-top: 0;\n}');
    expect(cssSource).toContain('.calculators-native-collection .service-native-grid {\n  margin-top: 0;');
    expect(cssSource).toContain('.native-info-page--calculators .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).calculators-native-collection .service-native-grid {\n  margin-top: 0;\n}');
    expect(cssSource).toContain('.native-info-page--calculators .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).calculators-native-collection .service-native-card {');
    expect(cssSource).toContain('padding: clamp(1.75rem, 2.6vw, 2.25rem);');
    expect(cssSource).toContain('transform 240ms cubic-bezier(0.22, 1, 0.36, 1),');
    expect(cssSource).toContain('.native-info-page--calculators .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).calculators-native-collection .service-native-card:is(:hover, :focus-within) {');
    expect(cssSource).toContain('transform: translateY(-2px) scale(1.004);');
    expect(cssSource).toContain('.native-info-page--calculators .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).calculators-native-collection .service-native-card h3 {');
    expect(cssSource).toContain('min-height: 0;');
    expect(cssSource).toContain('font-size: clamp(1.95rem, 3.05vw, 2.52rem);');
    expect(cssSource).toContain('letter-spacing: -0.03em;');
    expect(cssSource).toContain('.native-info-page--calculators .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).calculators-native-collection .service-native-card:nth-child(3n) h3 {\n  color: var(--ag-color-super-grey);\n}');
    expect(cssSource).toContain('.native-info-page--calculators .service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).calculators-native-collection .service-native-card > div > p:not(.service-native-card-subtitle):not(.service-native-card-phone) {');
    expect(cssSource).toContain('font-size: clamp(1.02rem, 1.55vw, 1.18rem);');
    expect(cssSource).toContain('font-weight: 400;');
  });

  it('keeps standalone calculator routes shell-only with block-owned intro, widget, and contact form sections', () => {
    [
      ['/calculators/emergency-fund', 'emergency-fund-calculator'],
      ['/calculators/increased-contribution', 'increased-contribution-calculator'],
      ['/calculators/ministers-housing-allowance-quick-check', 'retirement-minister-housing-quick-check'],
      ['/calculators/net-worth', 'net-worth-calculator'],
    ].forEach(([pathname, widget]) => {
      const content = getNativePageContent(pathname, '');
      const blocks = contentBlockBlueprintsByPath[pathname] || [];
      const utilityHeaderBlock = blocks.find((block) => block?.id === 'utility_header');
      const introBlock = blocks.find((block) => block?.id === 'intro');
      const widgetBlock = blocks.find((block) => block?.id === 'calculator_tool');
      const formBlock = blocks.find((block) => block?.id === 'cta_form');

      expect(content?.hero).toBeUndefined();
      expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);
      expect(Array.isArray(content?.actions) ? content.actions : []).toEqual([]);
      expect(blocks.map((block) => block?.id)).toEqual(expect.arrayContaining(['utility_header', 'intro', 'calculator_tool', 'cta_form']));
      expect(blocks.some((block) => block?.id === 'hero' || block?.kind === 'hero')).toBe(false);
      expect(blocks.some((block) => block?.id === 'page_content' || block?.kind === 'page_content')).toBe(false);
      expect(utilityHeaderBlock).toMatchObject({
        kind: 'content',
        mode: 'dynamic',
        settings: {
          headingLevel: 'h1',
          sectionClassName: 'calculator-tool-native-page-head native-functional-page-head native-functional-page-head--utility',
          justify: 'left',
        },
      });
      expect(introBlock?.kind).toBe('calculator_intro');
      expect((introBlock?.editableFields || []).some((field) => field.id === 'html' || field.label === 'Page Content HTML')).toBe(false);
      expect(widgetBlock?.kind).toBe('calculator_widget');
      expect(widgetBlock?.settings?.widget).toBe(widget);
      expect((widgetBlock?.editableFields || []).map((field) => field.id)).toEqual(expect.arrayContaining(['widget']));
      expect((widgetBlock?.editableFields || []).some((field) => field.id === 'html' || field.label === 'Page Content HTML')).toBe(false);
      expect(formBlock?.kind).toBe('cta_form');
      expect(formBlock?.settings?.bgTone).toBe(pathname === '/calculators/net-worth' ? 'white' : 'sand');
      expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
    });

    const cssSource = readSource('../styles/service-native.css');
    expect(cssSource).toContain('.native-functional-page-head--utility h1,');
    expect(cssSource).toContain('.native-info-page--calculator-tool .calculator-tool-native-page-head + .service-native-section.calculator-tool-shell {');
    expect(cssSource).not.toContain('.native-info-page--calculator-tool .service-native-hero');
  });
});
