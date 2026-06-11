import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('calculators native page content', () => {
  it('groups calculator cards by purpose and keeps the page free of a contact form', () => {
    const content = getNativePageContent('/calculators', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const collections = sections.filter((section) => String(section?.className || '').includes('calculators-native-collection'));
    const cards = collections.flatMap((section) => (Array.isArray(section?.cards) ? section.cards : []));

    expect(content?.pageClass).toBe('native-info-page--calculators');
    expect(collections.map((section) => section?.title)).toEqual([
      'Plan for the future',
      'Manage cash flow',
      'Understand your full picture',
      'Grow ministry resources',
    ]);
    expect(cards).toHaveLength(8);
    expect(cards.every((card) => card?.stretchedLink?.label === 'Launch')).toBe(true);
    expect(cards.map((card) => card?.stretchedLink?.to)).toEqual([
      '/services/retirement#retirement-savings-calculator',
      '/calculators/increased-contribution',
      '/services/retirement#retirement-savings-calculator',
      '/services/loans#run-some-numbers',
      '/calculators/emergency-fund',
      '/calculators/net-worth',
      '/services/investments#laddering-calculator',
      '/services/legacy-giving/endowments#endowment-investment-earnings-calculator',
    ]);
    expect(sections.some((section) => String(section?.className || '').includes('calculators-native-contact'))).toBe(false);
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
