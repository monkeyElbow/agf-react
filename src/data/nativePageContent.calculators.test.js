import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

describe('calculators native page content', () => {
  it('keeps calculators shell-only with block-owned cards, widget, billboard, and cta sections', () => {
    const content = getNativePageContent('/calculators', '');
    const blocks = contentBlockBlueprintsByPath['/calculators'] || [];
    const cardsBlock = blocks.find((block) => block?.id === 'calculator_cards');
    const quickCheckBlock = blocks.find((block) => block?.id === 'ministers_housing_quick_check');
    const billboardBlock = blocks.find((block) => block?.id === 'billboard');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form');

    expect(content?.pageClass).toBe('native-info-page--calculators');
    expect(content?.hero).toBeUndefined();
    expect(content?.hideIntro).toBeUndefined();
    expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);
    expect(cardsBlock?.settings?.columns).toBe('two');
    expect(cardsBlock?.settings?.sectionClassName).toBe('calculators-native-collection calculators-native-collection--grid');
    expect(Array.from({ length: 8 }, (_, index) => cardsBlock?.settings?.[`card${index + 1}ButtonLabel`])).toEqual(Array(8).fill('Launch'));
    expect(Array.from({ length: 8 }, (_, index) => cardsBlock?.settings?.[`card${index + 1}ButtonUrl`])).toEqual([
      '/services/retirement#retirement-savings-calculator',
      '/calculators/increased-contribution',
      '/services/retirement#retirement-savings-calculator',
      '/services/loans#run-some-numbers',
      '/calculators/emergency-fund',
      '/calculators#ministers-housing-allowance-quick-check',
      '/calculators/net-worth',
      '/services/investments#laddering-calculator',
    ]);
    expect(quickCheckBlock?.settings?.widget).toBe('retirement-minister-housing-quick-check');
    expect(quickCheckBlock?.settings?.anchorId).toBe('ministers-housing-allowance-quick-check');
    expect(billboardBlock?.settings?.sectionClassName).toBe('calculators-native-billboard');
    expect(ctaBlock?.settings?.sectionClassName).toBe('calculators-native-cta');
    expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
  });

  it('restores real team-follow-up forms on standalone calculator routes instead of dead-end cta bands', () => {
    [
      '/calculators/emergency-fund',
      '/calculators/increased-contribution',
      '/calculators/net-worth',
    ].forEach((pathname) => {
      const content = getNativePageContent(pathname, '');
      const sections = Array.isArray(content?.sections) ? content.sections : [];
      const formSection = sections.find((section) => String(section?.className || '').includes('calculator-tool-contact'));

      expect(Array.isArray(content?.actions) ? content.actions : []).toEqual([]);
      expect(formSection?.title).toBe('Talk with our team.');
      expect((Array.isArray(formSection?.form?.fields) ? formSection.form.fields : []).map((field) => field.id)).toEqual([
        'name',
        'email',
        'phone',
        'message',
      ]);
    });
  });
});
