import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('calculators native page content', () => {
  it('uses stretched-link calculator cards and keeps the shared CTA contact section', () => {
    const content = getNativePageContent('/calculators', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const directorySection = sections.find((section) => section?.className === 'calculators-native-directory');
    const contactSection = sections.find((section) => section?.className === 'calculators-native-contact');
    const cards = Array.isArray(directorySection?.cards) ? directorySection.cards : [];

    expect(content?.pageClass).toBe('native-info-page--calculators');
    expect(cards).toHaveLength(8);
    expect(cards.every((card) => card?.stretchedLink?.label === 'Launch')).toBe(true);
    expect(cards.map((card) => card?.stretchedLink?.to)).toEqual([
      '/services/retirement#retirement-savings-calculator',
      '/services/retirement#retirement-savings-calculator',
      '/calculators/increased-contribution',
      '/services/loans#run-some-numbers',
      '/calculators/emergency-fund',
      '/services/investments#laddering-calculator',
      '/calculators/net-worth',
      '/services/legacy-giving/endowments#endowment-investment-earnings-calculator',
    ]);
    expect(contactSection?.anchorId).toBe('calculator-contact');
    expect(contactSection?.hideCopy).toBe(true);
    expect(contactSection?.form?.variant).toBe('dynamic-request');
    expect(contactSection?.form?.title).toBe('Numbers are great.');
    expect(contactSection?.form?.subtitle).toBe('People are better.');
    expect(contactSection?.title).toBeUndefined();
    expect(contactSection?.body).toBeUndefined();
    expect(Array.isArray(contactSection?.form?.steps)).toBe(true);
    expect(contactSection?.form?.steps).toHaveLength(1);
    expect(contactSection?.form?.steps?.[0]?.fields?.map((field) => field.id)).toEqual([
      'firstName',
      'lastName',
      'email',
      'phone',
      'message',
    ]);
    expect(contactSection?.form?.submitLabel).toBe('Let’s discuss');
  });
});
