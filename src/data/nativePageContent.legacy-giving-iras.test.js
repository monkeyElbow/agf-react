import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

function expectLink(settings, fieldId, expectedLink) {
  expect(JSON.parse(settings?.[fieldId] || '{}')).toEqual(expect.objectContaining(expectedLink));
}

// Source-default documentation only. These assertions describe native compatibility
// boundaries and operational block contracts; they must not constrain active admin copy.
describe('planned giving and IRA source defaults', () => {
  it('keeps planned giving overview block-only while preserving child-route cleanup', () => {
    const legacyContent = getNativePageContent('/services/planned-giving', '');
    const legacyBlocks = contentBlockBlueprintsByPath['/services/planned-giving'] || [];
    const endowmentsContent = getNativePageContent('/services/planned-giving/endowments', '');
    const generosityContent = getNativePageContent('/services/planned-giving/donor-advised-fund', '');
    const ministryImpactContent = getNativePageContent('/services/planned-giving/ministry-impact-fund', '');
    const charitableTrustsContent = getNativePageContent('/services/planned-giving/charitable-trusts', '');
    const endowmentBlocks = contentBlockBlueprintsByPath['/services/planned-giving/endowments'] || [];
    const generosityBlocks = contentBlockBlueprintsByPath['/services/planned-giving/donor-advised-fund'] || [];
    const ministryImpactBlocks = contentBlockBlueprintsByPath['/services/planned-giving/ministry-impact-fund'] || [];

    const givingOptionsBlock = legacyBlocks.find((block) => block?.id === 'giving_options');
    const stewardshipBlock = legacyBlocks.find((block) => block?.id === 'stewardship_story');
    const joyBlock = legacyBlocks.find((block) => block?.id === 'joy_billboard');
    const comparisonBlock = legacyBlocks.find((block) => block?.id === 'comparison_table');
    const generosityHero = generosityBlocks.find((block) => block?.id === 'hero');
    const generosityIntro = generosityBlocks.find((block) => block?.id === 'intro');
    const generositySteps = generosityBlocks.find((block) => block?.id === 'how_it_works');
    const generosityOnline = generosityBlocks.find((block) => block?.id === 'generosity_fund_online');
    const generosityAssets = generosityBlocks.find((block) => block?.id === 'gift_assets');
    const generosityRequest = generosityBlocks.find((block) => block?.id === 'request_form');
    const generosityOutro = generosityBlocks.find((block) => block?.id === 'joyful_giving_billboard');
    const generosityStepsIndex = generosityBlocks.findIndex((block) => block?.id === 'how_it_works');
    const generosityRequestIndex = generosityBlocks.findIndex((block) => block?.id === 'request_form');
    const generosityOutroIndex = generosityBlocks.findIndex((block) => block?.id === 'joyful_giving_billboard');
    const ministryImpactIntro = ministryImpactBlocks.find((block) => block?.id === 'intro');
    const ministryImpactSteps = ministryImpactBlocks.find((block) => block?.id === 'how_it_works');
    const ministryImpactStockSection = ministryImpactBlocks.find((block) => block?.id === 'stock_transfer');
    const ministryImpactRequestSection = ministryImpactBlocks.find((block) => block?.id === 'request_form');
    const charitableTrustsBlocks = contentBlockBlueprintsByPath['/services/planned-giving/charitable-trusts'] || [];
    const charitableTrustsBlockIds = charitableTrustsBlocks.map((block) => block?.id);
    const charitableTrustsChoiceCards = charitableTrustsBlocks.find((block) => block?.id === 'trust_type_cards');
    const charitableTrustsDifferences = charitableTrustsBlocks.find((block) => block?.id === 'trust_differences');
    const charitableTrustsFunding = charitableTrustsBlocks.find((block) => block?.id === 'trust_funding');
    const charitableTrustsCrt = charitableTrustsBlocks.find((block) => block?.id === 'remainder_trust_billboard');
    const charitableTrustsTypes = charitableTrustsBlocks.find((block) => block?.id === 'remainder_trust_type_cards');
    const charitableTrustsTrigger = charitableTrustsBlocks.find((block) => block?.id === 'cta_trigger');
    const charitableTrustsInlineCta = charitableTrustsBlocks.find((block) => block?.id === 'cta_form');
    const charitableTrustsClt = charitableTrustsBlocks.find((block) => block?.id === 'lead_trust_billboard');
    const charitableTrustsCltTypes = charitableTrustsBlocks.find((block) => block?.id === 'lead_trust_type_cards');
    const charitableTrustsRequest = charitableTrustsBlocks.find((block) => block?.id === 'request_form');

    expect(legacyContent).toMatchObject({
      pageClass: 'native-info-page--legacy-giving',
      compact: true,
    });
    expect(legacyContent?.hero).toBeUndefined();
    expect(legacyContent?.intro).toBeUndefined();
    expect(legacyContent?.sections).toBeUndefined();
    expect(givingOptionsBlock?.settings?.sectionClassName).toBe('legacy-giving-types');
    expect(stewardshipBlock?.settings?.featureId).toBe('legacy_giving_stewardship_story');
    expect(stewardshipBlock?.settings?.sectionClassName).toBe('legacy-giving-stewardship legacy-stewardship-story');
    expect(joyBlock?.settings?.sectionClassName).toContain('fade-out');
    expect(joyBlock?.settings?.copyClassName).toBe('fade-up');
    expect(comparisonBlock?.settings?.anchorId).toBe('charitable-giving-plan-comparison');
    expect(comparisonBlock?.settings?.title).toBe('');
    expect(comparisonBlock?.settings?.widget).toBe('giving-comparison-matrix');
    expect(comparisonBlock?.settings?.tableRowsJson).toBe('');
    expect(endowmentsContent).toMatchObject({
      pageClass: 'native-info-page--legacy-child native-info-page--legacy-endowments',
      compact: true,
    });
    expect(endowmentsContent?.hero).toBeUndefined();
    expect(endowmentsContent?.intro).toBeUndefined();
    expect(endowmentsContent?.sections).toBeUndefined();
    expect(endowmentBlocks.find((block) => block?.id === 'how_it_works')?.settings?.sectionClassName).toBe('legacy-child-native-flow-steps legacy-child-native-endowments-duo');
    expect(endowmentBlocks.find((block) => block?.id === 'how_it_works')?.settings?.col4Enabled).toBe(false);
    expect(endowmentBlocks.find((block) => block?.id === 'assets_you_may_give')?.settings?.sectionClassName).toBe('legacy-child-native-assets legacy-child-native-give-assets legacy-child-native-endowments-assets');
    expect(endowmentBlocks.find((block) => block?.id === 'give_forever')?.settings?.sectionClassName).toBe('legacy-child-native-endowments-big-cta');
    expect(endowmentBlocks.find((block) => block?.id === 'give_forever')?.settings?.buttonLabel).toBe('');
    expect(endowmentBlocks.find((block) => block?.id === 'request_form')?.settings?.sectionClassName).toBe('legacy-child-native-endowments-legacy-form');
    expect(endowmentBlocks.find((block) => block?.id === 'request_form')).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
    });
    expect(generosityContent).toMatchObject({
      pageClass: 'native-info-page--legacy-child native-info-page--legacy-generosity-fund',
      compact: true,
    });
    expect(generosityContent?.hero).toBeUndefined();
    expect(generosityContent?.intro).toBeUndefined();
    expect(generosityContent?.sections).toBeUndefined();
    expect(generosityHero?.settings).toMatchObject({
      button1Style: 'outline',
      button1Tone: 'super-grey',
      button2Style: 'blue',
      button2Tone: 'atlantean',
    });
    expectLink(generosityHero?.settings, 'button1LinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
    expectLink(generosityHero?.settings, 'button2LinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expect(generosityIntro?.settings?.heading).toEqual(expect.any(String));
    expect(generositySteps?.settings).toMatchObject({
      sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-generosity-steps',
      columns: 'three',
      buttonStyle: 'outline',
      buttonTone: 'super-grey',
      col1Type: 'flow-step',
      col3Type: 'flow-step',
    });
    expectLink(generositySteps?.settings, 'buttonLinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
    expect(generosityBlocks.find((block) => block?.id === 'traditional_daf_cta')).toBeUndefined();
    expect(generosityOnline?.settings).toMatchObject({
      sectionClassName: 'legacy-child-native-generosity-online',
    });
    expectLink(generosityOnline?.settings, 'buttonLinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expect(generosityAssets?.settings).toMatchObject({
      sectionClassName: 'legacy-child-native-assets legacy-child-native-give-assets legacy-child-native-generosity-assets',
      card1Button2Style: 'blue',
      card1Button2Tone: 'atlantean',
    });
    expectLink(generosityAssets?.settings, 'card1ButtonLinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expectLink(generosityAssets?.settings, 'card1Button2LinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
    expect(generosityRequest?.settings).toMatchObject({
      anchorId: 'traditional-daf-form',
      sectionClassName: 'legacy-child-native-generosity-request',
      step1FieldsJson: JSON.stringify([
        { id: 'name', label: 'Name*', type: 'text', required: true },
        {
          id: 'givingProduct',
          label: 'Product of interest',
          type: 'select',
          placeholder: 'Select one',
          required: true,
          options: [
            { value: 'donor-advised-fund', label: 'Donor Advised Fund' },
            { value: 'generosity-fund', label: 'Generosity Fund' },
          ],
        },
        {
          id: 'contactPreference',
          label: 'How should we get in touch with you?',
          type: 'select',
          placeholder: 'Select one',
          required: true,
          options: [
            { value: 'phone', label: 'Phone' },
            { value: 'email', label: 'Email' },
          ],
        },
        { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
        { id: 'email', label: 'Email*', type: 'email', required: true },
        { id: 'message', label: 'Message', type: 'textarea', rows: 4, placeholder: 'How can we help?' },
      ]),
    });
    expect(generosityOutro?.settings).toMatchObject({
      button2DocumentId: 'document-planned-giving-terms-and-conditions',
      sectionClassName: 'legacy-child-native-generosity-outro',
    });
    expectLink(generosityOutro?.settings, 'buttonLinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expect(generosityStepsIndex).toBeGreaterThan(generosityBlocks.findIndex((block) => block?.id === 'intro'));
    expect(generosityBlocks.findIndex((block) => block?.id === 'generosity_fund_online')).toBeGreaterThan(generosityStepsIndex);
    expect(generosityRequestIndex).toBeGreaterThan(generosityBlocks.findIndex((block) => block?.id === 'generosity_fund_online'));
    expect(generosityOutroIndex).toBeGreaterThan(generosityRequestIndex);
    expect(ministryImpactContent).toMatchObject({
      pageClass: 'native-info-page--legacy-child native-info-page--legacy-ministry-impact',
      compact: true,
    });
    expect(ministryImpactContent?.hero).toBeUndefined();
    expect(ministryImpactContent?.intro).toBeUndefined();
    expect(ministryImpactContent?.sections).toBeUndefined();
    expect(ministryImpactIntro?.settings?.heading).toEqual(expect.any(String));
    expect(ministryImpactSteps?.settings).toMatchObject({
      sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-ministry-impact-steps',
      columns: 'three',
      col1Type: 'flow-step',
      col3Type: 'flow-step',
    });
    expect(ministryImpactStockSection?.settings?.card1ButtonDocumentId).toBe('document-planned-giving-intent-to-gift-form');
    expectLink(ministryImpactStockSection?.settings, 'card1Button2LinkJson', {
      kind: 'external',
      href: 'https://uploads.agfinancial.org/',
    });
    expect(ministryImpactStockSection?.settings?.card2ButtonDocumentId).toBe('document-planned-giving-brokerage-loa-form');
    expect(ministryImpactRequestSection?.settings).toMatchObject({
      titleClassName: '',
      titleHighlightsJson: '[{"text":"Unlocked","className":"is-white"},{"text":"expanded","className":"is-white"}]',
      textTone: 'white',
      spaceAfterRem: 4.2,
      hideStepTitles: true,
      step1Title: '',
      step1Note: '',
    });
    expect(ministryImpactRequestSection?.settings?.step1FieldsJson).toContain('"id":"name"');
    expect(charitableTrustsContent).toMatchObject({
      pageClass: 'native-info-page--legacy-child native-info-page--legacy-trusts',
      compact: true,
    });
    expect(charitableTrustsContent?.hero).toBeUndefined();
    expect(charitableTrustsContent?.intro).toBeUndefined();
    expect(charitableTrustsContent?.sections).toBeUndefined();
    expectLink(charitableTrustsChoiceCards?.settings, 'card1ButtonLinkJson', {
      kind: 'internal',
      to: '/services/planned-giving/charitable-trusts#crt',
    });
    expectLink(charitableTrustsChoiceCards?.settings, 'card2ButtonLinkJson', {
      kind: 'internal',
      to: '/services/planned-giving/charitable-trusts#clt',
    });
    expect(charitableTrustsDifferences?.settings?.columns).toBe('two');
    expect(charitableTrustsFunding?.settings).toMatchObject({
      columns: 'one',
      cardStyle: 'card2',
      sectionClassName: 'legacy-child-native-assets legacy-child-native-trusts-funding',
      card1TitleClassName: 'legacy-child-native-assets-card-title',
      card1ButtonStyle: 'blue',
      card1ButtonTone: 'atlantean',
    });
    expectLink(charitableTrustsFunding?.settings, 'card1ButtonLinkJson', {
      kind: 'anchor',
      href: '#charitable-trusts-form',
      openInNewWindow: false,
    });
    expect(charitableTrustsCrt?.settings?.anchorId).toBe('crt');
    expect(charitableTrustsTypes).toMatchObject({ kind: 'card_chart', mode: 'dynamic' });
    expect(charitableTrustsClt?.settings?.anchorId).toBe('clt');
    expect(charitableTrustsCltTypes).toMatchObject({ kind: 'card_chart', mode: 'dynamic' });
    expect(charitableTrustsTrigger).toBeUndefined();
    expect(charitableTrustsInlineCta).toBeUndefined();
    expect(charitableTrustsRequest?.kind).toBe('request_form');
    expect(charitableTrustsRequest?.settings?.anchorId).toBe('charitable-trusts-form');
    expect(charitableTrustsRequest?.settings?.sectionClassName).toBe('legacy-child-native-trusts-request');
    expect(charitableTrustsRequest?.settings?.presetId).toBe('legacy-trusts');
    expect(charitableTrustsRequest?.settings?.bgTone).toBe('blue');
    expect(charitableTrustsRequest?.settings?.textTone).toBe('white');
    expect(charitableTrustsRequest?.settings?.bodyHtml).toEqual(expect.any(String));
    // Retained order contract: these sections form the anchored trust-reading flow.
    expect(charitableTrustsBlockIds.indexOf('trust_funding')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('trust_differences'));
    expect(charitableTrustsBlockIds.indexOf('remainder_trust_billboard')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('trust_funding'));
    expect(charitableTrustsBlockIds.indexOf('remainder_trust_type_cards')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('remainder_trust_billboard'));
    expect(charitableTrustsBlockIds).not.toContain('cta_trigger');
    expect(charitableTrustsBlockIds).not.toContain('cta_form');
    expect(charitableTrustsBlockIds.indexOf('lead_trust_billboard')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('remainder_trust_type_cards'));
    expect(charitableTrustsBlockIds.indexOf('request_form')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('lead_trust_billboard'));
    expect(JSON.parse(charitableTrustsRequest?.settings?.step1FieldsJson || '[]').map((field) => field.id)).toEqual([
      'firstName',
      'lastName',
      'phone',
      'email',
      'contactPreference',
      'trustProduct',
      'message',
    ]);
  });

  it('uses block-owned IRA cards, open button, and rollover copy', () => {
    const iraContent = getNativePageContent('/services/retirement/iras', '');
    const iraBlocks = contentBlockBlueprintsByPath['/services/retirement/iras'] || [];
    const iraTypes = iraBlocks.find((block) => block?.id === 'ira_types');
    const openIra = iraBlocks.find((block) => block?.id === 'open_ira');
    const rollover = iraBlocks.find((block) => block?.id === 'rollover_billboard');

    expect(Array.isArray(iraContent?.sections) ? iraContent.sections : []).toEqual([]);
    expect(iraTypes?.settings?.card1ButtonLabel).toBe('');
    expect(iraTypes?.settings?.card2ButtonLabel).toBe('');
    expect(iraTypes?.settings).toMatchObject({
      bodyTone: 'super-grey',
      justify: 'center',
      buttonStyle: 'outline',
      buttonTone: 'white',
    });
    expect(iraBlocks.find((block) => block?.id === 'rollover_billboard')?.settings?.titleFontFamily).toBe('helv');
    expectLink(iraTypes?.settings, 'buttonLinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/invest',
      openInNewWindow: true,
    });
    expect(openIra).toBeUndefined();
    expect(rollover?.settings?.bodyHtml).toEqual(expect.any(String));
    expect(rollover?.settings?.targetSectionKey).toBeUndefined();
    expect(iraBlocks.find((block) => block?.id === 'daily_billboard')?.settings).toMatchObject({
      bodyHtml: '<h3>Starting now.</h3>',
      justify: 'center',
      scrollReveal: 'scale-up',
      lineSpacing: 0.88,
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      titleSizeRem: 5.25,
      titleLetterSpacingEm: -0.03,
      contentMaxWidthPx: 1480,
      headlineMaxWidthPx: 1480,
      sectionClassName: 'retirement-everyday retirement-daily-billboard',
    });
  });
});
