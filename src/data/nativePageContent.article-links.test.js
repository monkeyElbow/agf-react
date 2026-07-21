import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';

function expectInternalLink(settings, fieldId, to) {
  expect(JSON.parse(settings?.[fieldId] || '{}')).toEqual(expect.objectContaining({
    kind: 'internal',
    to,
    openInNewWindow: false,
  }));
}

describe('native page content article feature links', () => {
  it('wires the insurance fraud feature to the seeded article route and media', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance'] || [];
    const featureBlock = blocks.find((block) => block?.id === 'fraud_feature');

    expect(featureBlock?.settings?.title).toBe('Defend Yourself Against Fraud');
    expect(featureBlock?.settings?.imageUrl).toContain('media.agfinancial.org');
    expect(featureBlock?.settings?.buttonLabel).toBe('Read article');
    expectInternalLink(featureBlock?.settings, 'buttonLinkJson', '/resources/article/defend-yourself-against-fraud');
  });

  it('wires the planned giving opportunity feature to the seeded article route and media', () => {
    const blocks = contentBlockBlueprintsByPath['/services/planned-giving'] || [];
    const featureBlock = blocks.find((block) => block?.id === 'opportunity_feature');

    expect(featureBlock?.settings?.title).toBe('Opportunity is Knocking');
    expect(featureBlock?.settings?.imageUrl).toContain('media.agfinancial.org');
    expect(featureBlock?.settings?.buttonLabel).toBe('Answer the door');
    expectInternalLink(featureBlock?.settings, 'buttonLinkJson', '/resources/article/opportunity');
    expect(featureBlock?.settings?.sectionClassName).toBe('legacy-giving-opportunity');
  });

  it('wires the mission assure summer camp feature to the seeded article route and media', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance/mission-assure'] || [];
    const featureBlock = blocks.find((block) => block?.id === 'camp_safety');

    expect(featureBlock?.settings?.title).toBe('Summer Camp Safety Tips');
    expect(featureBlock?.settings?.imageUrl).toContain('media.agfinancial.org');
    expect(featureBlock?.settings?.buttonLabel).toBe('Go safely!');
    expectInternalLink(featureBlock?.settings, 'buttonLinkJson', '/resources/article/summer-camp-safety-tips');
  });
});
