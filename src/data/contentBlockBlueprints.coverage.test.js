import { describe, expect, it } from 'vitest';
import { sitePages } from './siteMap';
import {
  CANONICAL_BLUEPRINT_SEED_TEMPLATE_IDS_BY_LOOKUP_ID,
  contentBlockBlueprintsByPath,
  genericPageBlockBlueprint,
  genericPageFallbackBlueprint,
  getAllBlockTemplateBlueprints,
  isPersistedBlueprintBridgeTemplateId,
  PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS,
} from './contentBlockBlueprints';
import { getRetiredInsertCompatibilityTemplateIds } from '../lib/compatibilityTemplateRetirement';
import { getLegacyEditableFieldsForKind } from '../blocks/registry';

describe('content block blueprint coverage', () => {
  it('keeps explicit blueprint coverage for every non-admin site route', () => {
    const missing = sitePages
      .map((page) => String(page?.path || '').trim())
      .filter(Boolean)
      .filter((path) => !path.startsWith('/admin/'))
      .filter((path) => !Object.prototype.hasOwnProperty.call(contentBlockBlueprintsByPath, path));

    expect(missing).toEqual([]);
  });

  it('keeps the generic page fallback limited to page content only', () => {
    const fallbackBlocks = genericPageFallbackBlueprint();

    expect(fallbackBlocks).toHaveLength(1);
    expect(fallbackBlocks[0]?.id).toBe('page_content');
    expect(fallbackBlocks[0]?.kind).toBe('content');
  });

  it('keeps the generic template source available for request-form seeding', () => {
    const templateBlocks = genericPageBlockBlueprint();

    expect(templateBlocks.some((block) => block?.kind === 'request_form')).toBe(true);
  });

  it('seeds a real hero block for ministers group life instead of fallback-only page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance/ministers-group-life-plan'] || [];

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(true);
  });

  it('seeds real hero and intro blocks for the insurance overview page', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance'] || [];
    const missionAssureBlock = blocks.find((block) => block?.id === 'mission_assure');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(true);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(missionAssureBlock).toMatchObject({
      kind: 'feature_panel',
      mode: 'dynamic',
    });
    expect(missionAssureBlock?.settings?.targetSectionKey).toBe('class:insurance-native-mission-assure');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content' && block?.mode === 'dynamic')).toBe(true);
  });

  it('seeds the services overview feature band as a billboard block without changing its intro identity', () => {
    const blocks = contentBlockBlueprintsByPath['/services'] || [];
    const servicesIntroBand = blocks.find((block) => block?.id === 'intro');

    expect(servicesIntroBand?.kind).toBe('billboard');
    expect(servicesIntroBand?.mode).toBe('dynamic');
    expect(servicesIntroBand?.settings?.title).toBe('A complete financial strategy for your ministry and your family.');
    expect(servicesIntroBand?.settings?.bgTone).toBe('grey');
    expect(servicesIntroBand?.settings?.textTone).toBe('white');
  });

  it('seeds real hero, intro, and billboard blocks for the impact page without a fallback page-content block', () => {
    const blocks = contentBlockBlueprintsByPath['/about-us/impact'] || [];

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(true);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'static')).toBe(true);
    expect(blocks.some((block) => block?.id === 'billboard' && block?.kind === 'billboard' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'billboard' && block?.kind === 'billboard' && block?.mode === 'static')).toBe(true);
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds a real request-form block for 403(b) individual enrollment without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/403b/403b-individual-enrollment'] || [];

    expect(blocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds a real hero block for 403(b) group enrollment while retaining page content editing', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/403b/403b-group-enrollment'] || [];
    const complianceBillboard = blocks.find((block) => block?.id === 'billboard');
    const introBlock = blocks.find((block) => block?.id === 'intro');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(true);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'billboard' && block?.kind === 'billboard' && block?.mode === 'dynamic')).toBe(true);
    expect(introBlock?.settings?.button1Url).toBe('https://files.agfinancial.org/Retirement/Plansummary.pdf');
    expect(introBlock?.settings?.button1PageRef).toBe('');
    expect(introBlock?.settings?.button2Url).toBe('https://files.agfinancial.org/retirement/403b-Enrollment-Form.pdf');
    expect(introBlock?.settings?.button2PageRef).toBe('');
    expect(complianceBillboard?.settings?.bgTone).toBe('white');
    expect(complianceBillboard?.settings?.textTone).toBe('dark');
    expect(complianceBillboard?.settings?.buttonUrl).toBe('https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf');
    expect(complianceBillboard?.settings?.buttonPageRef).toBe('');
    expect(complianceBillboard?.settings?.button2Url).toBe('https://files.agfinancial.org/retirement/NQCCO-Guidelines.pdf');
    expect(complianceBillboard?.settings?.button2PageRef).toBe('');
    expect((blocks.findIndex((block) => block?.id === 'request_form'))).toBeLessThan(blocks.findIndex((block) => block?.id === 'billboard'));
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(true);
  });

  it('seeds explicit managed blocks for endowments, generosity fund, and IRAs without fallback page content', () => {
    const endowmentBlocks = contentBlockBlueprintsByPath['/services/legacy-giving/endowments'] || [];
    const generosityBlocks = contentBlockBlueprintsByPath['/services/legacy-giving/generosity-fund'] || [];
    const iraBlocks = contentBlockBlueprintsByPath['/services/retirement/iras'] || [];

    expect(endowmentBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(endowmentBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(endowmentBlocks.some((block) => block?.id === 'give_forever' && block?.kind === 'billboard' && block?.mode === 'dynamic')).toBe(true);
    expect(endowmentBlocks.find((block) => block?.id === 'request_form')?.settings?.targetSectionKey).toBe('class:legacy-child-native-endowments-legacy-form');
    expect(endowmentBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);

    expect(generosityBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(generosityBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(generosityBlocks.find((block) => block?.id === 'request_form')?.settings?.title).toBe('Make the most of your giving.');
    expect(generosityBlocks.find((block) => block?.id === 'request_form')?.settings?.targetSectionKey).toBe('class:legacy-child-native-generosity-request');
    expect(generosityBlocks.find((block) => block?.id === 'joyful_giving_billboard')?.settings?.targetSectionKey).toBe('class:legacy-child-native-generosity-outro');
    expect(generosityBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);

    expect(iraBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(iraBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(iraBlocks.find((block) => block?.id === 'rollover_billboard')?.settings?.targetSectionKey).toBe('class:retirement-child-native-rollover');
    expect(iraBlocks.find((block) => block?.id === 'daily_billboard')?.settings?.targetSectionKey).toBe('class:retirement-ira-native-cta');
    expect(iraBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds the 403(b) loan section with existing content and grid blocks instead of native-only sections', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/403b'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const investmentStrategyHeadingBlock = blocks.find((block) => block?.id === 'investment_strategy_heading' && block?.kind === 'billboard');
    const investmentStrategyOptionsBlock = blocks.find((block) => block?.id === 'investment_strategy_options' && block?.kind === 'card_grid');
    const whoQualifiesBlock = blocks.find((block) => block?.id === 'who_qualifies' && block?.kind === 'card_grid');
    const pageContentBlock = blocks.find((block) => block?.id === 'page_content' && block?.kind === 'content');
    const loanApplyBlock = blocks.find((block) => block?.id === 'loan_apply' && block?.kind === 'card_grid');
    const onlineContributionsBlock = blocks.find((block) => block?.id === 'online_contributions' && block?.kind === 'columns');

    expect(heroBlock?.settings?.justify).toBe('right');
    expect(heroBlock?.settings?.line1Text).toBe('Saving while serving.');
    expect(investmentStrategyHeadingBlock?.mode).toBe('dynamic');
    expect(investmentStrategyHeadingBlock?.settings?.title).toBe('Investment Strategy Options');
    expect(investmentStrategyHeadingBlock?.settings?.buttonUrl).toBe('https://files.agfinancial.org/retirement/Performance-Update/Performance-Update.pdf');
    expect(investmentStrategyHeadingBlock?.settings?.buttonPageRef).toBe('');
    expect(investmentStrategyOptionsBlock?.presetId).toBe('investment-options');
    expect(investmentStrategyOptionsBlock?.templateId).toBe('investment_strategy_options');
    expect(investmentStrategyOptionsBlock?.mode).toBe('dynamic');
    expect(investmentStrategyOptionsBlock?.settings?.columns).toBe('two');
    expect(investmentStrategyOptionsBlock?.settings?.card1LinksJson).toContain('Download the MBA Fact sheet PDF');
    expect(investmentStrategyOptionsBlock?.settings?.card1LinksJson).toContain('fund-descriptor-retirement-mba-income-fund');
    expect(investmentStrategyOptionsBlock?.settings?.card2AccordionsJson).toContain('fund-descriptor-retirement-fidelity-asset-manager-40');
    expect(investmentStrategyOptionsBlock?.settings?.card4Button2PageRef).toBe('/prospectus');
    expect(whoQualifiesBlock?.presetId).toBe('eligibility-cards');
    expect(whoQualifiesBlock?.templateId).toBe('who_qualifies');
    expect(whoQualifiesBlock?.mode).toBe('dynamic');
    expect(whoQualifiesBlock?.settings?.cardStyle).toBe('none');
    expect(whoQualifiesBlock?.settings?.card1Title).toBe('Employees of eligible employers');
    expect(whoQualifiesBlock?.settings?.card1Body).toContain('church-affiliated, tax-exempt 501(c)(3) organizations');
    expect(whoQualifiesBlock?.settings?.card3Title).toBe('Self-employed credentialed ministers');
    expect(pageContentBlock?.mode).toBe('dynamic');
    expect(String(pageContentBlock?.settings?.html || '')).toContain('403(b) Plan Loans');
    expect(String(pageContentBlock?.settings?.html || '')).toContain('The requested 403(b) loan amount cannot be less than $1,500');
    expect(loanApplyBlock?.presetId).toBe('step-cards');
    expect(loanApplyBlock?.templateId).toBe('loan_apply');
    expect(loanApplyBlock?.mode).toBe('dynamic');
    expect(loanApplyBlock?.settings?.columns).toBe('two');
    expect(loanApplyBlock?.settings?.card1ButtonUrl).toBe('https://files.agfinancial.org/retirement/403(b)-Loan-Rules.pdf');
    expect(loanApplyBlock?.settings?.card1ButtonPageRef).toBe('');
    expect(loanApplyBlock?.settings?.card2ButtonUrl).toBe('https://secure.agfinancial.org/');
    expect(loanApplyBlock?.settings?.card2ButtonPageRef).toBe('');
    expect(String(loanApplyBlock?.settings?.card3Body || '')).toContain('Loan Services > Loan Modeling/Request');
    expect(onlineContributionsBlock?.mode).toBe('dynamic');
    expect(onlineContributionsBlock?.presetId).toBe('default');
    expect(onlineContributionsBlock?.settings?.col1Title).toBe('Online Contributions');
    expect(onlineContributionsBlock?.settings?.col1ButtonUrl).toBe('/online-contributions');
  });

  it('keeps migrated blueprint routes on canonical editable field sets', () => {
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];
    const retirementBlocks = contentBlockBlueprintsByPath['/services/retirement'] || [];
    const testBlocks = contentBlockBlueprintsByPath['/test'] || [];

    expect(loansBlocks.find((block) => block?.id === 'value_cards')?.editableFields).toEqual(
      getLegacyEditableFieldsForKind('columns'),
    );
    expect(retirementBlocks.find((block) => block?.id === 'billboard')?.editableFields).toEqual(
      getLegacyEditableFieldsForKind('billboard'),
    );
    expect(testBlocks.find((block) => block?.id === 'intro')?.editableFields).toEqual(
      getLegacyEditableFieldsForKind('intro'),
    );
    expect(testBlocks.find((block) => block?.id === 'billboard')?.editableFields).toEqual(
      getLegacyEditableFieldsForKind('billboard'),
    );
    expect(testBlocks.find((block) => block?.id === 'columns')?.editableFields).toEqual(
      getLegacyEditableFieldsForKind('columns'),
    );
  });

  it('keeps canonical columns-family seeds explicit about their preset identity', () => {
    const homeBlocks = contentBlockBlueprintsByPath['/'] || [];
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];
    const testBlocks = contentBlockBlueprintsByPath['/test'] || [];

    expect(homeBlocks.find((block) => block?.id === 'columns_mha' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'columns',
      templateId: 'columns_mha',
      presetId: 'housing-allowance',
    });
    expect(homeBlocks.find((block) => block?.id === 'columns_math' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'columns',
      templateId: 'columns_math',
      presetId: 'do-the-math',
    });
    expect(loansBlocks.find((block) => block?.id === 'value_cards' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'columns',
      templateId: 'value_cards',
      presetId: 'value-cards',
    });
    expect(testBlocks.find((block) => block?.id === 'columns' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'columns',
      templateId: 'columns',
      presetId: 'default',
    });
  });

  it('preserves nested transitional split fields for touched grid and column blueprint seeds', () => {
    const homeBlocks = contentBlockBlueprintsByPath['/'] || [];
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];
    const testBlocks = contentBlockBlueprintsByPath['/test'] || [];

    const servicesGrid = homeBlocks.find((block) => block?.id === 'services_grid');
    const loansValueCards = loansBlocks.find((block) => block?.id === 'value_cards');
    const testGrid = testBlocks.find((block) => block?.id === 'card_grid');

    expect(servicesGrid?.settings?.browsePath).toBe('/services');
    expect(servicesGrid?.settings?.browsePageRef).toBe('/services');
    expect(servicesGrid?.settings?.card1Path).toBe('/services/loans');
    expect(servicesGrid?.settings?.card1PageRef).toBe('/services/loans');
    expect(servicesGrid?.settings?.card6Path).toBe('/rates');
    expect(servicesGrid?.settings?.card6PageRef).toBe('/rates');

    expect(loansValueCards?.settings?.col1ButtonLabel).toBe('');
    expect(loansValueCards?.settings?.col1ButtonUrl).toBe('');
    expect(loansValueCards?.settings?.col1ButtonPageRef).toBe('');
    expect(loansValueCards?.settings?.col4ButtonLabel).toBe('');
    expect(loansValueCards?.settings?.col4ButtonUrl).toBe('');
    expect(loansValueCards?.settings?.col4ButtonPageRef).toBe('');
    expect(loansValueCards?.templateId).toBe('value_cards');
    expect(loansValueCards?.presetId).toBe('value-cards');

    expect(testGrid?.templateId).toBe('card_grid');
    expect(testGrid?.presetId).toBe('default');
    expect(testGrid?.settings?.card1ButtonLabel).toBe('');
    expect(testGrid?.settings?.card1ButtonUrl).toBe('');
    expect(testGrid?.settings?.card1ButtonPageRef).toBe('');
    expect(testGrid?.settings?.card8ButtonLabel).toBe('');
    expect(testGrid?.settings?.card8ButtonUrl).toBe('');
    expect(testGrid?.settings?.card8ButtonPageRef).toBe('');
  });

  it('preserves touched static blueprint placeholders after cleanup simplification', () => {
    const homeBlocks = contentBlockBlueprintsByPath['/'] || [];
    const servicesBlocks = contentBlockBlueprintsByPath['/services'] || [];
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];
    const investmentBlocks = contentBlockBlueprintsByPath['/services/investments'] || [];
    const retirementBlocks = contentBlockBlueprintsByPath['/services/retirement'] || [];
    const testBlocks = contentBlockBlueprintsByPath['/test'] || [];

    expect(homeBlocks.some((block) => block?.id === 'top_strip' && block?.mode === 'static' && block?.kind === 'top_strip')).toBe(true);
    expect(homeBlocks.some((block) => block?.id === 'hero' && block?.mode === 'static' && block?.kind === 'hero')).toBe(true);

    expect(servicesBlocks.find((block) => block?.id === 'intro' && block?.mode === 'dynamic')?.kind).toBe('billboard');
    expect(servicesBlocks.find((block) => block?.id === 'intro' && block?.mode === 'dynamic')?.settings?.title).toBe('A complete financial strategy for your ministry and your family.');
    expect(servicesBlocks.find((block) => block?.id === 'services_cards' && block?.mode === 'static')?.settings?.cardStyle).toBe('card2');
    expect(servicesBlocks.find((block) => block?.id === 'services_cards' && block?.mode === 'static')?.templateId).toBe('card_grid');
    expect(servicesBlocks.find((block) => block?.id === 'services_cards' && block?.mode === 'static')?.presetId).toBe('default');
    expect(servicesBlocks.find((block) => block?.id === 'matters_band' && block?.mode === 'static')?.settings?.background).toBe('blue');

    expect(loansBlocks.some((block) => block?.id === 'loan_options' && block?.mode === 'static' && block?.kind === 'card_grid')).toBe(true);
    expect(loansBlocks.find((block) => block?.id === 'loan_options' && block?.mode === 'static')?.templateId).toBe('loan_options');
    expect(loansBlocks.find((block) => block?.id === 'loan_options' && block?.mode === 'static')?.presetId).toBe('default');
    expect(loansBlocks.some((block) => block?.id === 'cta_band' && block?.mode === 'static' && block?.kind === 'cta_band')).toBe(true);
    expect(loansBlocks.find((block) => block?.id === 'cta_band' && block?.mode === 'static')?.templateId).toBe('cta_band');
    expect(loansBlocks.find((block) => block?.id === 'cta_band' && block?.mode === 'static')?.presetId).toBe('default');
    expect(investmentBlocks.some((block) => block?.id === 'certificates' && block?.mode === 'static' && block?.kind === 'card_grid')).toBe(true);
    expect(investmentBlocks.find((block) => block?.id === 'certificates' && block?.mode === 'static')?.templateId).toBe('certificates');
    expect(investmentBlocks.find((block) => block?.id === 'certificates' && block?.mode === 'static')?.presetId).toBe('default');
    expect(investmentBlocks.some((block) => block?.id === 'rates_table')).toBe(false);
    expect(retirementBlocks.some((block) => block?.id === 'plan_features' && block?.mode === 'static' && block?.kind === 'card_grid')).toBe(true);
    expect(retirementBlocks.find((block) => block?.id === 'plan_features' && block?.mode === 'static')?.templateId).toBe('plan_features');
    expect(retirementBlocks.find((block) => block?.id === 'plan_features' && block?.mode === 'static')?.presetId).toBe('default');
    expect(retirementBlocks.some((block) => block?.id === 'housing_allowance')).toBe(false);
    expect(testBlocks.some((block) => block?.id === 'hero' && block?.mode === 'static' && block?.kind === 'hero')).toBe(true);
    expect(homeBlocks.find((block) => block?.id === 'columns_mha' && block?.mode === 'static')).toMatchObject({
      kind: 'columns',
      templateId: 'columns_mha',
      presetId: 'housing-allowance',
    });
    expect(homeBlocks.find((block) => block?.id === 'columns_math' && block?.mode === 'static')).toMatchObject({
      kind: 'columns',
      templateId: 'columns_math',
      presetId: 'do-the-math',
    });
  });

  it('distinguishes canonical seed defaults from persisted bridge ids in aggregated template sources', () => {
    const templates = getAllBlockTemplateBlueprints();
    const servicesCardsTemplate = templates.find((template) => template?.templateLookupId === 'services_cards');
    const mattersBandTemplate = templates.find((template) => template?.templateLookupId === 'matters_band');
    const loanOptionsTemplate = templates.find((template) => template?.templateLookupId === 'loan_options');

    expect(CANONICAL_BLUEPRINT_SEED_TEMPLATE_IDS_BY_LOOKUP_ID.services_cards).toBe('card_grid');
    expect(servicesCardsTemplate).toMatchObject({
      templateLookupId: 'services_cards',
      templateId: 'card_grid',
      mode: 'static',
      kind: 'card_grid',
    });
    expect(isPersistedBlueprintBridgeTemplateId(servicesCardsTemplate?.templateId)).toBe(false);

    expect(mattersBandTemplate).toMatchObject({
      templateLookupId: 'matters_band',
      templateId: 'matters_band',
      mode: 'static',
      kind: 'cta_band',
    });
    expect(loanOptionsTemplate).toMatchObject({
      templateLookupId: 'loan_options',
      templateId: 'loan_options',
      mode: 'static',
      kind: 'card_grid',
    });

    PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS.forEach((templateId) => {
      expect(isPersistedBlueprintBridgeTemplateId(templateId)).toBe(true);
    });

    getRetiredInsertCompatibilityTemplateIds('static').forEach((templateId) => {
      expect(PERSISTED_BLUEPRINT_BRIDGE_TEMPLATE_IDS.includes(templateId)).toBe(true);
    });
  });

  it('keeps investments CTA-like seeds explicit about what belongs to the cta-band family', () => {
    const investmentBlocks = contentBlockBlueprintsByPath['/services/investments'] || [];
    const investorCtaBlock = investmentBlocks.find((block) => block?.id === 'investor_cta');
    const featurePanelBlock = investmentBlocks.find((block) => block?.id === 'cash_reserves');
    const calculatorCtaBlock = investmentBlocks.find((block) => block?.id === 'laddering');

    expect(investorCtaBlock?.kind).toBe('cta_band');
    expect(investorCtaBlock?.templateId).toBe('investor_cta');
    expect(investorCtaBlock?.presetId).toBe('dashboard-login');
    expect(featurePanelBlock?.kind).toBe('feature_panel');
    expect(featurePanelBlock?.presetId).toBeUndefined();
    expect(calculatorCtaBlock?.kind).toBe('calculator_cta');
    expect(calculatorCtaBlock?.presetId).toBeUndefined();
  });

  it('keeps /rates seeded on canonical rates identity without an investments rates placeholder block', () => {
    const ratesBlocks = contentBlockBlueprintsByPath['/rates'] || [];
    const investmentBlocks = contentBlockBlueprintsByPath['/services/investments'] || [];

    expect(ratesBlocks.find((block) => block?.id === 'certificates_table')).toMatchObject({
      kind: 'rates',
      mode: 'dynamic',
    });
    expect(ratesBlocks.find((block) => block?.id === 'ira_table')).toMatchObject({
      kind: 'rates',
      mode: 'dynamic',
    });
    expect(ratesBlocks.some((block) => block?.kind === 'rates_table')).toBe(false);
    expect(investmentBlocks.some((block) => block?.id === 'rates_table')).toBe(false);
  });
});
