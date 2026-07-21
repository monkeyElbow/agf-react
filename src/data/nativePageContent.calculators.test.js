import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

function readLinkTarget(settings, fieldId) {
  const linkValue = JSON.parse(settings?.[fieldId] || '{}');
  return linkValue.to || linkValue.href || '';
}

describe('calculators native page content', () => {
  it('keeps calculators shell-only with block-owned cards, widget, billboard, and cta sections', () => {
    const content = getNativePageContent('/calculators', '');
    const blocks = contentBlockBlueprintsByPath['/calculators'] || [];
    const cardsBlock = blocks.find((block) => block?.id === 'calculator_cards');
    const billboardBlock = blocks.find((block) => block?.id === 'billboard');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form');

    expect(content?.pageClass).toBe('native-info-page--calculators');
    expect(content?.hero).toBeUndefined();
    expect(content?.hideIntro).toBeUndefined();
    expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);
    expect(cardsBlock?.settings?.columns).toBe('two');
    expect(cardsBlock?.settings?.sectionClassName).toBe('calculators-native-collection calculators-native-collection--grid');
    expect(cardsBlock?.settings?.showTitleDivider).toBe(false);
    expect(Array.from({ length: 8 }, (_, index) => cardsBlock?.settings?.[`card${index + 1}ButtonLabel`])).toEqual(Array(8).fill('Launch'));
    expect(Array.from({ length: 8 }, (_, index) => (
      readLinkTarget(cardsBlock?.settings, `card${index + 1}ButtonLinkJson`)
    ))).toEqual([
      '/services/retirement#retirement-savings-calculator',
      '/calculators/increased-contribution',
      '/services/retirement#retirement-savings-calculator',
      '/services/loans#run-some-numbers',
      '/calculators/emergency-fund',
      '/calculators/ministers-housing-allowance-quick-check',
      '/calculators/net-worth',
      '/services/investments#laddering-calculator',
    ]);
    expect(blocks.some((block) => block?.id === 'ministers_housing_quick_check')).toBe(false);
    expect(billboardBlock?.settings?.sectionClassName).toBe('calculators-native-billboard');
    expect(ctaBlock?.settings?.sectionClassName).toBe('calculators-native-cta');
    expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
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
      const heroBlock = blocks.find((block) => block?.id === 'hero');
      const introBlock = blocks.find((block) => block?.id === 'intro');
      const widgetBlock = blocks.find((block) => block?.id === 'calculator_tool');
      const formBlock = blocks.find((block) => block?.id === 'cta_form');

      expect(content?.hero).toBeUndefined();
      expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);
      expect(Array.isArray(content?.actions) ? content.actions : []).toEqual([]);
      expect(blocks.map((block) => block?.id)).toEqual(['hero', 'intro', 'calculator_tool', 'cta_form']);
      expect(blocks.some((block) => block?.id === 'page_content' || block?.kind === 'page_content')).toBe(false);
      expect(heroBlock?.kind).toBe('hero');
      expect(introBlock?.name).toBe('Calculator Intro');
      expect(introBlock?.kind).toBe('calculator_intro');
      expect(introBlock?.settings?.sectionClassName).toBe('calculator-tool-shell');
      expect((introBlock?.editableFields || []).some((field) => field.id === 'html' || field.label === 'Page Content HTML')).toBe(false);
      expect(Object.keys(introBlock?.settings || {}).sort()).toEqual([
        'anchorId',
        'body',
        'contentMaxWidthPx',
        'copyWrap',
        'fullBleed',
        'paddingBottomRem',
        'paddingTopRem',
        'sectionClassName',
        'spaceAfterRem',
        'spaceBeforeRem',
        'title',
        'titleClassName',
        'titleHighlightsJson',
      ]);
      expect(widgetBlock?.name).toBe('Calculator Tool');
      expect(widgetBlock?.kind).toBe('calculator_widget');
      expect(widgetBlock?.settings?.widget).toBe(widget);
      expect(widgetBlock?.settings?.sectionClassName).toBe('calculator-tool-shell calculator-tool-widget');
      expect((widgetBlock?.editableFields || []).map((field) => field.id)).toEqual([
        'widget',
        'fullBleed',
        'spaceBeforeRem',
        'spaceAfterRem',
        'paddingTopRem',
        'paddingBottomRem',
        'contentMaxWidthPx',
        'anchorId',
        'sectionClassName',
      ]);
      expect((widgetBlock?.editableFields || []).some((field) => field.id === 'html' || field.label === 'Page Content HTML')).toBe(false);
      expect(formBlock?.kind).toBe('cta_form');
      expect(formBlock?.settings?.title).toBe('Talk with our team.');
      expect(formBlock?.settings?.submitLabel).toBe('Submit');
      expect(formBlock?.settings?.sectionClassName).toBe('calculator-tool-shell calculator-tool-contact');
      expect(JSON.parse(formBlock?.settings?.fieldsJson || '[]').map((field) => field.id)).toEqual([
        'name',
        'email',
        'phone',
        'message',
      ]);
      expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
    });
  });
});
