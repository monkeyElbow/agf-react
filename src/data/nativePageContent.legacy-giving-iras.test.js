import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

describe('planned giving and IRA native page content', () => {
  it('keeps planned giving overview block-only while preserving child-route cleanup', () => {
    const legacyContent = getNativePageContent('/services/planned-giving', '');
    const legacyBlocks = contentBlockBlueprintsByPath['/services/planned-giving'] || [];
    const endowmentsContent = getNativePageContent('/services/planned-giving/endowments', '');
    const generosityContent = getNativePageContent('/services/planned-giving/generosity-fund', '');
    const ministryImpactContent = getNativePageContent('/services/planned-giving/ministry-impact-fund', '');
    const charitableTrustsContent = getNativePageContent('/services/planned-giving/charitable-trusts', '');
    const endowmentBlocks = contentBlockBlueprintsByPath['/services/planned-giving/endowments'] || [];
    const generosityBlocks = contentBlockBlueprintsByPath['/services/planned-giving/generosity-fund'] || [];
    const ministryImpactBlocks = contentBlockBlueprintsByPath['/services/planned-giving/ministry-impact-fund'] || [];

    const givingOptionsBlock = legacyBlocks.find((block) => block?.id === 'giving_options');
    const stewardshipBlock = legacyBlocks.find((block) => block?.id === 'stewardship_story');
    const joyBlock = legacyBlocks.find((block) => block?.id === 'joy_billboard');
    const comparisonBlock = legacyBlocks.find((block) => block?.id === 'comparison_table');
    const generosityHero = generosityBlocks.find((block) => block?.id === 'hero');
    const generosityIntro = generosityBlocks.find((block) => block?.id === 'intro');
    const generositySteps = generosityBlocks.find((block) => block?.id === 'how_it_works');
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
    const charitableTrustsCrt = charitableTrustsBlocks.find((block) => block?.id === 'remainder_trust_billboard');
    const charitableTrustsTypes = charitableTrustsBlocks.find((block) => block?.id === 'remainder_trust_type_cards');
    const charitableTrustsTrigger = charitableTrustsBlocks.find((block) => block?.id === 'cta_trigger');
    const charitableTrustsInlineCta = charitableTrustsBlocks.find((block) => block?.id === 'cta_form');
    const charitableTrustsClt = charitableTrustsBlocks.find((block) => block?.id === 'lead_trust_billboard');
    const charitableTrustsCltTypes = charitableTrustsBlocks.find((block) => block?.id === 'lead_trust_type_cards');
    const charitableTrustsCta = charitableTrustsBlocks.find((block) => block?.id === 'cta_form_legacy_child_native_cta_legacy_child_native_trusts_cta');

    expect(legacyContent).toMatchObject({
      pageClass: 'native-info-page--legacy-giving',
      compact: true,
    });
    expect(legacyContent?.hero).toBeUndefined();
    expect(legacyContent?.intro).toBeUndefined();
    expect(legacyContent?.sections).toBeUndefined();
    expect(givingOptionsBlock?.settings?.card1Body).toContain('Donor Advised Fund');
    expect(givingOptionsBlock?.settings?.card3Body).toContain('provides payments for you');
    expect(givingOptionsBlock?.settings?.sectionClassName).toBe('legacy-giving-types');
    expect(stewardshipBlock?.settings?.featureId).toBe('legacy_giving_stewardship_story');
    expect(stewardshipBlock?.settings?.sectionClassName).toBe('legacy-giving-stewardship legacy-stewardship-story');
    expect(joyBlock?.settings?.sectionClassName).toContain('fade-out');
    expect(joyBlock?.settings?.copyClassName).toBe('fade-up');
    expect(comparisonBlock?.settings?.anchorId).toBe('charitable-giving-plan-comparison');
    expect(comparisonBlock?.settings?.title).toBe('Which Charitable Giving plan is right for you?');
    expect(endowmentsContent).toMatchObject({
      pageClass: 'native-info-page--legacy-child native-info-page--legacy-endowments',
      compact: true,
    });
    expect(endowmentsContent?.hero).toBeUndefined();
    expect(endowmentsContent?.intro).toBeUndefined();
    expect(endowmentsContent?.sections).toBeUndefined();
    expect(endowmentBlocks.find((block) => block?.id === 'how_it_works')?.settings?.sectionClassName).toBe('legacy-child-native-endowments-duo');
    expect(endowmentBlocks.find((block) => block?.id === 'give_forever')?.settings?.sectionClassName).toBe('legacy-child-native-endowments-big-cta');
    expect(endowmentBlocks.find((block) => block?.id === 'give_forever')?.settings?.buttonLabel).toBe('');
    expect(endowmentBlocks.find((block) => block?.id === 'request_form')?.settings?.sectionClassName).toBe('legacy-child-native-endowments-legacy-form');
    expect(endowmentBlocks.find((block) => block?.id === 'request_form')?.settings?.title).toBe('Begin the Endowment sign up process');
    expect(generosityContent).toMatchObject({
      pageClass: 'native-info-page--legacy-child native-info-page--legacy-generosity-fund',
      compact: true,
    });
    expect(generosityContent?.hero).toBeUndefined();
    expect(generosityContent?.intro).toBeUndefined();
    expect(generosityContent?.sections).toBeUndefined();
    expect(generosityHero?.settings).toMatchObject({
      line1Text: 'Your giving.',
      line2Text: 'Managed.',
      button1Url: 'https://secure.agfinancial.org/generosityfund/signup',
      button2Url: '#traditional-daf-form',
      button2Style: 'outline',
      button2Tone: 'super-grey',
    });
    expect(generosityIntro?.settings?.heading).toBe('All your charitable giving in one place.');
    expect(generositySteps?.settings).toMatchObject({
      sectionClassName: 'legacy-child-native-steps',
      card1Title: '01',
      card3Title: '03',
    });
    expect(generosityAssets?.settings).toMatchObject({
      sectionClassName: 'legacy-child-native-assets legacy-child-native-generosity-assets',
      card1Title: 'What you give',
      card1ButtonUrl: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expect(generosityRequest?.settings).toMatchObject({
      anchorId: 'traditional-daf-form',
      sectionClassName: 'legacy-child-native-generosity-request',
      body: 'Let’s discover the best way for you to give, and in the easiest way possible.',
      step1FieldsJson: JSON.stringify([
        { id: 'name', label: 'Name*', type: 'text', required: true },
        { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
        { id: 'email', label: 'Email*', type: 'email', required: true },
        { id: 'message', label: 'Message', type: 'textarea', rows: 4, placeholder: 'What would you like to discuss?' },
      ]),
    });
    expect(generosityOutro?.settings).toMatchObject({
      title: 'Simple, joyful giving.',
      subtitle: 'Powered by your generosity.',
      buttonUrl: 'https://secure.agfinancial.org/generosityfund/signup',
      button2DocumentId: 'document-planned-giving-terms-and-conditions',
      sectionClassName: 'legacy-child-native-generosity-outro',
    });
    expect(generosityStepsIndex).toBeGreaterThan(generosityBlocks.findIndex((block) => block?.id === 'intro'));
    expect(generosityRequestIndex).toBeGreaterThan(generosityStepsIndex);
    expect(generosityOutroIndex).toBeGreaterThan(generosityRequestIndex);
    expect(ministryImpactContent).toMatchObject({
      pageClass: 'native-info-page--legacy-child native-info-page--legacy-ministry-impact',
      compact: true,
    });
    expect(ministryImpactContent?.hero).toBeUndefined();
    expect(ministryImpactContent?.intro).toBeUndefined();
    expect(ministryImpactContent?.sections).toBeUndefined();
    expect(ministryImpactIntro?.settings?.heading).toBe('Most wealth isn’t cash.');
    expect(ministryImpactSteps?.settings?.sectionClassName).toBe('legacy-child-native-steps');
    expect(ministryImpactSteps?.settings?.card3Title).toBe('03');
    expect(ministryImpactStockSection?.settings?.card1Title).toBe('Intent to Gift of Securities');
    expect(ministryImpactStockSection?.settings?.card1ButtonDocumentId).toBe('document-planned-giving-intent-to-gift-form');
    expect(ministryImpactStockSection?.settings?.card1Button2Url).toBe('https://uploads.agfinancial.org/');
    expect(ministryImpactStockSection?.settings?.card2Title).toBe('Brokerage Letter of Authorization (LOA)');
    expect(ministryImpactStockSection?.settings?.card2ButtonDocumentId).toBe('document-planned-giving-brokerage-loa-form');
    expect(ministryImpactRequestSection?.settings?.step1Title).toBe('Talk with planned giving');
    expect(ministryImpactRequestSection?.settings?.step1Note).toBe('Let’s map out the best next step.');
    expect(ministryImpactRequestSection?.settings?.step1FieldsJson).toContain('"firstName"');
    expect(charitableTrustsContent).toMatchObject({
      pageClass: 'native-info-page--legacy-child native-info-page--legacy-trusts',
      compact: true,
    });
    expect(charitableTrustsContent?.hero).toBeUndefined();
    expect(charitableTrustsContent?.intro).toBeUndefined();
    expect(charitableTrustsContent?.sections).toBeUndefined();
    expect(charitableTrustsChoiceCards?.settings?.card1ButtonPageRef).toBe('/services/planned-giving/charitable-trusts#crt');
    expect(charitableTrustsChoiceCards?.settings?.card2ButtonPageRef).toBe('/services/planned-giving/charitable-trusts#clt');
    expect(charitableTrustsDifferences?.settings?.title).toBe('The differences. At a glance.');
    expect(charitableTrustsDifferences?.settings?.card1ListJson).toBe('["Cash","Securities (stocks, bonds, mutual funds)","Real estate","Other marketable assets"]');
    expect(charitableTrustsDifferences?.settings?.card2ListJson).toContain('**Best for:** Appreciated assets');
    expect(charitableTrustsDifferences?.settings?.card3ListJson).toContain('**Best for:** Estate planning');
    expect(charitableTrustsCrt?.settings?.anchorId).toBe('crt');
    expect(charitableTrustsCrt?.settings?.title).toBe('Charitable Remainder Trust');
    expect(charitableTrustsCrt?.settings?.bodyHtml).toContain('The trust pays you (and your spouse, if married) income for life.');
    expect(charitableTrustsTypes?.settings?.card1Title).toBe('Charitable Remainder Unitrust (CRUT)');
    expect(charitableTrustsTypes?.settings?.card1ListJson).toContain('Minimum required payout of 5%');
    expect(charitableTrustsTypes?.settings?.card2Title).toBe('Charitable Remainder Annuity (CRAT)');
    expect(charitableTrustsTypes?.settings?.card2ListJson).toContain('Payments may begin immediately upon funding');
    expect(charitableTrustsClt?.settings?.anchorId).toBe('clt');
    expect(charitableTrustsClt?.settings?.title).toBe('Charitable Lead Trust');
    expect(charitableTrustsClt?.settings?.bodyHtml).toContain('The trust pays income to the ministry(ies) you’ve selected for a set number of years.');
    expect(charitableTrustsCltTypes?.settings?.card1Title).toBe('Grantor Lead Trust');
    expect(charitableTrustsCltTypes?.settings?.card1ListJson).toContain('Donor is taxed on the trust’s income each year');
    expect(charitableTrustsCltTypes?.settings?.card2Title).toBe('Non-Grantor Lead Trust');
    expect(charitableTrustsCltTypes?.settings?.card2ListJson).toContain('Income is taxed at the trust level each year');
    expect(charitableTrustsTrigger?.settings).toMatchObject({
      justify: 'center',
      buttonLabel: 'Start the process',
      buttonAction: 'open_cta_form',
      buttonTargetAnchorId: 'charitable-trusts-inline-form',
      buttonStyle: 'outline',
      buttonTone: 'white',
    });
    expect(charitableTrustsInlineCta?.settings?.anchorId).toBe('charitable-trusts-inline-form');
    expect(charitableTrustsInlineCta?.settings?.displayMode).toBe('inline_reveal');
    expect(charitableTrustsInlineCta?.settings?.triggerMode).toBe('external');
    expect(charitableTrustsCta?.settings?.anchorId).toBe('charitable-trusts-form');
    expect(charitableTrustsCta?.settings?.displayMode).toBeUndefined();
    expect(charitableTrustsCta?.settings?.triggerMode).toBeUndefined();
    expect(charitableTrustsBlockIds.indexOf('remainder_trust_type_cards')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('remainder_trust_billboard'));
    expect(charitableTrustsBlockIds.indexOf('cta_trigger')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('remainder_trust_type_cards'));
    expect(charitableTrustsBlockIds.indexOf('cta_form')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('cta_trigger'));
    expect(charitableTrustsBlockIds.indexOf('lead_trust_billboard')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('cta_form'));
    expect(charitableTrustsBlockIds.indexOf('cta_form_legacy_child_native_cta_legacy_child_native_trusts_cta')).toBeGreaterThan(charitableTrustsBlockIds.indexOf('lead_trust_billboard'));
    expect(JSON.parse(charitableTrustsCta?.settings?.fieldsJson || '[]').map((field) => field.id)).toEqual([
      'firstName',
      'lastName',
      'phone',
      'email',
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
    expect(openIra?.settings).toMatchObject({
      buttonLabel: 'Open IRA',
      buttonUrl: 'https://secure.agfinancial.org/invest',
    });
    expect(rollover?.settings?.bodyHtml).toContain('single AGFinancial IRA');
    expect(rollover?.settings?.targetSectionKey).toBeUndefined();
  });
});
