import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('native page content article feature links', () => {
  it('wires the insurance fraud feature to the seeded article route and media', () => {
    const content = getNativePageContent('/services/insurance', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const featureSection = sections.find((section) => section?.className === 'insurance-native-fraud');
    const action = featureSection?.feature?.actions?.[0];

    expect(featureSection?.feature?.title).toBe('Defend Yourself Against Fraud');
    expect(featureSection?.feature?.image).toContain('media.agfinancial.org');
    expect(action?.label).toBe('Read article');
    expect(action?.to).toBe('/resources/article/defend-yourself-against-fraud');
  });

  it('wires the planned giving opportunity feature to the seeded article route and media', () => {
    const content = getNativePageContent('/services/planned-giving', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const featureSection = sections.find((section) => section?.className === 'legacy-giving-opportunity');
    const action = featureSection?.feature?.actions?.[0];

    expect(featureSection?.feature?.title).toBe('Opportunity is Knocking');
    expect(featureSection?.feature?.image).toContain('media.agfinancial.org');
    expect(action?.label).toBe('Answer the door');
    expect(action?.to).toBe('/resources/article/opportunity');
  });

  it('wires the mission assure summer camp feature to the seeded article route and media', () => {
    const content = getNativePageContent('/services/insurance/mission-assure', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const featureSection = sections.find((section) => section?.className === 'mission-assure-native-camp-safety');
    const action = featureSection?.feature?.actions?.[0];

    expect(featureSection?.feature?.title).toBe('Summer Camp Safety Tips');
    expect(featureSection?.feature?.image).toContain('media.agfinancial.org');
    expect(action?.label).toBe('Go safely!');
    expect(action?.to).toBe('/resources/article/summer-camp-safety-tips');
  });
});
