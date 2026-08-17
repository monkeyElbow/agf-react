import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sitePages } from './siteMap';
import {
  contentBlockBlueprintsByPath,
  genericPageBlockBlueprint,
  genericPageFallbackBlueprint,
  getAllBlockTemplateBlueprints,
} from './contentBlockBlueprints';
import { BLOCK_ONLY_MANAGED_PAGE_PATHS } from '../lib/managedPageShells';
import { getEditableFieldsForKind } from '../blocks/registry';
import {
  parseCtaFormFieldsJson,
} from '../blocks/foundation/forms';

const TARGET_BRIDGE_SETTING_KEYS = [
  'targetSectionKey',
  'targetFineprintSectionKey',
  'targetSectionClassName',
  'targetSectionIndex',
];
const SPLIT_LINK_HREF_SUFFIXES = ['Url', 'Path', 'Href'];
const SPLIT_LINK_SETTING_SUFFIX_PATTERN = /(?:Url|Path|Href|PageRef|OpenInNewWindow)$/;
const ACTION_LIKE_SPLIT_LINK_BASE_PATTERN = /^(?:button\d*|button2?|cta|browse|card\d+(?:Button\d*)?|col\d+Button|leftButton|rightButton)$/i;
const RETIRED_CTA_FORM_SLOT_FIELD_PATTERN = /^field[1-5](?:Enabled|Type|Label|Placeholder|Options|Required|Key)$/;

function getTargetBridgeSettingKeys(block) {
  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : {};

  return TARGET_BRIDGE_SETTING_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(settings, key));
}

function getSplitLinkFindings({ pathname, block }) {
  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : {};
  const findings = [];

  Object.entries(settings).forEach(([key, value]) => {
    if (!key.endsWith('PageRef')) {
      return;
    }

    const pageRef = String(value || '').trim();
    const baseKey = key.replace(/PageRef$/, '');
    const hrefKeys = SPLIT_LINK_HREF_SUFFIXES
      .map((suffix) => `${baseKey}${suffix}`)
      .filter((hrefKey) => Object.prototype.hasOwnProperty.call(settings, hrefKey));

    if (pageRef && !pageRef.startsWith('/')) {
      findings.push(`${pathname}:${block?.id || 'block'}:${key}:non-internal`);
    }

    hrefKeys.forEach((hrefKey) => {
      const href = String(settings[hrefKey] || '').trim();
      if (pageRef && href && !href.startsWith('/')) {
        findings.push(`${pathname}:${block?.id || 'block'}:${hrefKey}:target-conflict`);
        return;
      }
      if (href.startsWith('/') && !pageRef) {
        findings.push(`${pathname}:${block?.id || 'block'}:${hrefKey}:missing-page-ref`);
        return;
      }
      if (href.startsWith('/') && pageRef && href !== pageRef) {
        findings.push(`${pathname}:${block?.id || 'block'}:${hrefKey}:target-drift`);
      }
    });
  });

  return findings;
}

function expectCanonicalLink(settings, fieldId, expectedLink) {
  expect(settings?.[fieldId]).toBeTruthy();
  expect(JSON.parse(settings[fieldId])).toEqual(expect.objectContaining({
    openInNewWindow: false,
    ...expectedLink,
  }));
}

function expectNoSettings(settings, fieldIds) {
  fieldIds.forEach((fieldId) => {
    expect(Object.prototype.hasOwnProperty.call(settings || {}, fieldId)).toBe(false);
  });
}

// Source-default only. This suite documents starter blueprints and contracts;
// it must never be used as an active-state or admin-copy convergence test.
describe('source-default content block blueprint coverage', () => {
  it('exports canonical link settings without action-like split link settings', () => {
    const offenders = [];
    const inspectBlock = (scope, block) => {
      const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
      Object.keys(settings).forEach((key) => {
        const baseKey = key.replace(SPLIT_LINK_SETTING_SUFFIX_PATTERN, '');
        if (baseKey !== key && ACTION_LIKE_SPLIT_LINK_BASE_PATTERN.test(baseKey)) {
          offenders.push(`${scope}:${block?.id || 'block'}:${key}`);
        }
      });
    };

    Object.entries(contentBlockBlueprintsByPath).forEach(([pathname, blocks]) => {
      (Array.isArray(blocks) ? blocks : []).forEach((block) => inspectBlock(pathname, block));
    });
    genericPageBlockBlueprint().forEach((block) => inspectBlock('generic', block));
    getAllBlockTemplateBlueprints().forEach((block) => inspectBlock('template', block));

    expect(offenders).toEqual([]);
  });

  it('does not expose split link compatibility fields as editable authoring controls', () => {
    const offenders = [];
    Object.entries(contentBlockBlueprintsByPath).forEach(([pathname, blocks]) => {
      (Array.isArray(blocks) ? blocks : []).forEach((block) => {
        const routeLinkOpenFieldIds = new Set(
          (Array.isArray(block?.editableFields) ? block.editableFields : [])
            .filter((field) => field?.type === 'route_link')
            .map((field) => String(field?.openInNewWindowFieldId || '').trim())
            .filter(Boolean),
        );
        (Array.isArray(block?.editableFields) ? block.editableFields : []).forEach((field) => {
          const fieldId = String(field?.id || '').trim();
          if (fieldId.endsWith('PageRef')) {
            offenders.push(`${pathname}:${block?.id || 'block'}:${fieldId}`);
          }
          if (routeLinkOpenFieldIds.has(fieldId)) {
            offenders.push(`${pathname}:${block?.id || 'block'}:${fieldId}`);
          }
          if (field?.type === 'route_link') {
            const linkJsonFieldId = String(field.linkJsonFieldId || '').trim();
            if (!fieldId.endsWith('LinkJson') || (linkJsonFieldId && fieldId !== linkJsonFieldId)) {
              offenders.push(`${pathname}:${block?.id || 'block'}:${fieldId}:not-canonical-link-json-id`);
            }
          }
        });
      });
    });

    getAllBlockTemplateBlueprints().forEach((block) => {
      const routeLinkOpenFieldIds = new Set(
        (Array.isArray(block?.editableFields) ? block.editableFields : [])
          .filter((field) => field?.type === 'route_link')
          .map((field) => String(field?.openInNewWindowFieldId || '').trim())
          .filter(Boolean),
      );
      (Array.isArray(block?.editableFields) ? block.editableFields : []).forEach((field) => {
        const fieldId = String(field?.id || '').trim();
        if (fieldId.endsWith('PageRef')) {
          offenders.push(`template:${block?.id || block?.kind || 'block'}:${fieldId}`);
        }
        if (routeLinkOpenFieldIds.has(fieldId)) {
          offenders.push(`template:${block?.id || block?.kind || 'block'}:${fieldId}`);
        }
        if (field?.type === 'route_link') {
          const linkJsonFieldId = String(field.linkJsonFieldId || '').trim();
          if (!fieldId.endsWith('LinkJson') || (linkJsonFieldId && fieldId !== linkJsonFieldId)) {
            offenders.push(`template:${block?.id || block?.kind || 'block'}:${fieldId}:not-canonical-link-json-id`);
          }
        }
      });
    });

    expect(offenders).toEqual([]);
  });

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

  it('keeps migrated retirement routes out of the fallback-only blueprint list', () => {
    const source = readFileSync('src/data/contentBlockBlueprints.js', 'utf8');
    const fallbackListSource = source.match(/const pageContentFallbackOnlyBlueprintPaths = \[[\s\S]*?\];/)?.[0] || '';

    [
      '/',
      '/services/retirement/403b',
      '/services/retirement/403b/403b-group-enrollment',
      '/services/retirement/403b/403b-individual-enrollment',
      '/services/retirement/403b/403b-terms-definitions',
      '/about-us/careers',
      '/online-contributions',
      '/calculators',
      '/contact-us',
      '/forms',
      '/prospectus',
      '/services/retirement',
      '/services/retirement/iras',
      '/services/retirement/iras/fund-an-ira',
      '/services/retirement/rollovers',
      '/services/retirement/retirement-consultants',
      '/services/loans',
      '/services/loans/loan-consultants',
      '/services/investments',
      '/resources',
      '/services/insurance',
      '/services/insurance/ministers-group-life-plan',
      '/services/insurance/mission-assure',
      '/search',
      '/services/insurance/mission-assure/report-a-claim',
      '/sitemap',
      '/accessibility',
      '/privacy-policy',
      '/subscribe',
      '/terms-of-service',
      '/vineyard',
      '/yourplan',
    ].forEach((pathname) => {
      const escapedPathname = pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(fallbackListSource, `${pathname} should use explicit block blueprints`).not.toMatch(new RegExp(`['"]${escapedPathname}['"]`));
    });
  });

  it('keeps the generic template source available for request-form seeding', () => {
    const templateBlocks = genericPageBlockBlueprint();

    expect(templateBlocks.some((block) => block?.kind === 'request_form')).toBe(true);
  });

  it('keeps blockless functional routes explicit without fallback page-content blueprints', () => {
    [
      '/about-us/careers',
      '/forms',
      '/prospectus',
      '/search',
      '/sitemap',
    ].forEach((pathname) => {
      expect(contentBlockBlueprintsByPath).toHaveProperty(pathname);
      expect(contentBlockBlueprintsByPath[pathname]).toEqual([]);
    });
  });

  it('keeps tax guide page-content styling owned by its content block hook', () => {
    const blocks = contentBlockBlueprintsByPath['/taxguide'] || [];
    const pageContentBlock = blocks.find((block) => block?.id === 'page_content');

    expect(pageContentBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'tax-guide-content',
      },
    });
  });

  it('keeps block-only managed page blueprints dynamic-only and target-bridge-free', () => {
    Array.from(BLOCK_ONLY_MANAGED_PAGE_PATHS).forEach((pathname) => {
      const blocks = contentBlockBlueprintsByPath[pathname] || [];
      const staticBlocks = blocks
        .filter((block) => block?.mode === 'static')
        .map((block) => block?.id);
      const targetBridgeBlocks = blocks
        .map((block) => ({
          id: block?.id,
          keys: getTargetBridgeSettingKeys(block),
        }))
        .filter((entry) => entry.keys.length);

      expect(staticBlocks, `${pathname} should not seed static block placeholders`).toEqual([]);
      expect(targetBridgeBlocks, `${pathname} should not seed target bridge fields`).toEqual([]);
    });
  });

  it('keeps CTA form blueprints authored with canonical fieldsJson', () => {
    const routeBlocks = Object.entries(contentBlockBlueprintsByPath)
      .flatMap(([pathname, blocks]) => (
        (Array.isArray(blocks) ? blocks : []).map((block) => ({ pathname, block }))
      ));
    const templateBlocks = getAllBlockTemplateBlueprints()
      .map((block) => ({ pathname: 'template', block }));
    const ctaBlocksMissingFieldsJson = [...routeBlocks, ...templateBlocks]
      .filter(({ block }) => String(block?.kind || '').trim() === 'cta_form')
      .filter(({ block }) => !parseCtaFormFieldsJson(block?.settings?.fieldsJson).length)
      .map(({ pathname, block }) => `${pathname}:${block?.id || 'cta_form'}`);
    const ctaBlocksWithSlotSettings = [...routeBlocks, ...templateBlocks]
      .filter(({ block }) => String(block?.kind || '').trim() === 'cta_form')
      .map(({ pathname, block }) => ({
        id: `${pathname}:${block?.id || 'cta_form'}`,
        slotKeys: Object.keys(block?.settings || {})
          .filter((key) => RETIRED_CTA_FORM_SLOT_FIELD_PATTERN.test(String(key || ''))),
      }))
      .filter(({ slotKeys }) => slotKeys.length);

    expect(ctaBlocksMissingFieldsJson).toEqual([]);
    expect(ctaBlocksWithSlotSettings).toEqual([]);
  });

  it('keeps blueprint split link targets normalized', () => {
    const routeBlocks = Object.entries(contentBlockBlueprintsByPath)
      .flatMap(([pathname, blocks]) => (
        (Array.isArray(blocks) ? blocks : []).map((block) => ({ pathname, block }))
      ));
    const templateBlocks = getAllBlockTemplateBlueprints()
      .map((block) => ({ pathname: 'template', block }));

    const findings = [...routeBlocks, ...templateBlocks]
      .flatMap(getSplitLinkFindings);

    expect(findings).toEqual([]);
  });

  it('seeds contact us as block-owned hero, address, and request form sections', () => {
    const blocks = contentBlockBlueprintsByPath['/contact-us'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero');
    const addressBlock = blocks.find((block) => block?.id === 'contact_address');
    const requestBlock = blocks.find((block) => block?.id === 'request_form');

    expect(heroBlock).toMatchObject({
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        line1Text: 'Contact',
      },
    });
    expect(addressBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'AGFinancial',
        sectionClassName: 'contact-us-address',
        copyWrap: true,
      },
    });
    expect(addressBlock?.settings?.body).toContain('3900 S Overland Avenue');
    expect(requestBlock).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        title: 'How can we help?',
        sectionClassName: 'contact-us-request',
        presetId: 'contact',
      },
    });
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
  });

  it('seeds the about us intro and building photo as independent editable blocks', () => {
    const blocks = contentBlockBlueprintsByPath['/about-us'] || [];
    const introBlock = blocks.find((block) => block?.id === 'intro');
    const buildingShotBlock = blocks.find((block) => block?.id === 'building_shot');

    expect(introBlock).toMatchObject({
      kind: 'intro',
      mode: 'dynamic',
    });
    expect(buildingShotBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        logoAlt: 'AGFinancial office building',
        fullBleed: true,
        sectionClassName: 'about-native-building-shot',
        railClassName: 'native-info-viewport-bleed',
      },
    });
    expect(introBlock?.hidden).not.toBe(true);
  });

  it('seeds ministers group life as block-owned plan, enrollment, support, and CTA sections', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance/ministers-group-life-plan'] || [];
    const detailsBlock = blocks.find((block) => block?.id === 'plan_details');
    const enrollBlock = blocks.find((block) => block?.id === 'enroll_steps');
    const returnBlock = blocks.find((block) => block?.id === 'enroll_return');
    const supportBlock = blocks.find((block) => block?.id === 'support');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(false);
    expect(detailsBlock).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'ministers-group-life-native-details',
        card1Title: 'Ministers',
        card2Title: 'Missionaries',
      },
    });
    expect(enrollBlock).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'step-cards',
      settings: {
        sectionClassName: 'ministers-group-life-native-enroll',
        card1ButtonLabel: 'Minister enrollment form',
        card1Button2Label: 'Missionary enrollment form',
        card3ButtonLabel: 'Electronic Funds Transfer form',
      },
    });
    expect(returnBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'ministers-group-life-native-enroll ministers-group-life-native-enroll-return',
        addressClassName: 'ministers-group-life-copy-address',
        fineprint: '**FAX:** 417.447.7475',
      },
    });
    expect(supportBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'ministers-group-life-native-support',
        supportGroupsExpanded: true,
        supportGroupsCollapsible: false,
      },
    });
    expect(supportBlock?.settings?.supportGroupsJson).toContain('Life Services Toolkit');
    expect(ctaBlock).toMatchObject({
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        anchorId: 'form',
        sectionClassName: 'ministers-group-life-native-cta insurance-native-cta',
        title: 'Still need help?',
      },
    });
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(blocks.some((block) => block?.kind === 'site_feature')).toBe(false);
    blocks.forEach((block) => {
      expect(String(block?.settings?.targetSectionKey || ''), block?.id).toBe('');
      expect(String(block?.settings?.targetSectionClassName || ''), block?.id).toBe('');
    });
  });

  it('seeds real hero and intro blocks for life insurance quote instead of relying on fallback-only native content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance/life-insurance-quote'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const typesBlock = blocks.find((block) => block?.id === 'life_types');
    const requestBlock = blocks.find((block) => block?.id === 'request_form');

    expect(heroBlock?.settings?.line1Text).toBe('Get a life quote.');
    expect(heroBlock?.settings?.line1HighlightsJson).toBe('[{"text":"Get a","className":"is-mango"}]');
    expect(introBlock?.settings?.heading).toBe('Take care of your family.');
    expect(introBlock?.settings?.headingHighlightsJson).toBe('[{"text":"family","className":"is-mango"}]');
    expect(introBlock?.settings?.bgTone).toBe('grey');
    expect(introBlock?.settings?.textTone).toBe('white');
    expect(typesBlock?.kind).toBe('card_grid');
    expect(typesBlock?.settings?.sectionClassName).toBe('life-quote-native-types');
    expect(typesBlock?.settings?.cardStyle).toBe('card2');
    expect(typesBlock?.settings?.showTitleDivider).toBe(false);
    expect(typesBlock?.settings?.card1Title).toBe('Term Life');
    expect(typesBlock?.settings?.card2Title).toBe('Whole Life');
    expect(typesBlock?.settings?.card3Title).toBe('Universal Life');
    expect(blocks.some((block) => block?.id === 'quote_bridge')).toBe(false);
    expect(requestBlock?.kind).toBe('request_form');
    expect(requestBlock?.settings?.anchorId).toBe('quote');
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    blocks.forEach((block) => {
      expect(String(block?.settings?.targetSectionKey || ''), block?.id).toBe('');
    });
  });

  it('seeds the insurance overview as block-owned cards, billboards, features, and CTA form sections', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance'] || [];
    const coverageBlock = blocks.find((block) => block?.id === 'coverage_solutions');
    const quoteBlock = blocks.find((block) => block?.id === 'quote_billboard');
    const certificateBlock = blocks.find((block) => block?.id === 'certificate_proof');
    const riskBlock = blocks.find((block) => block?.id === 'risk_management');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form');
    const missionAssureBlock = blocks.find((block) => block?.id === 'mission_assure');
    const fraudBlock = blocks.find((block) => block?.id === 'fraud_feature');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(false);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(coverageBlock).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-coverage',
        title: 'Coverage options',
        card1Title: 'Property & Casualty',
        card2Button2Style: 'dark',
        card2Button2Tone: 'super-grey',
      },
    });
    expectCanonicalLink(coverageBlock?.settings, 'card2Button2LinkJson', {
      kind: 'internal',
      to: '/services/insurance/group-term-life-insurance',
    });
    expectCanonicalLink(coverageBlock?.settings, 'card4ButtonLinkJson', {
      kind: 'external',
      href: 'https://www.orsurety.com/commercial-bonds',
      openInNewWindow: true,
    });
    expect(quoteBlock).toMatchObject({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-quote',
        button2Style: 'dark',
        button2Tone: 'super-grey',
        titleSizeRem: 4.625,
        titleLetterSpacingEm: -0.034,
        subtitleSizeRem: 2.8125,
        subtitleLetterSpacingEm: -0.03,
      },
    });
    expectCanonicalLink(quoteBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/services/insurance/life-insurance-quote',
    });
    expectCanonicalLink(quoteBlock?.settings, 'button2LinkJson', {
      kind: 'internal',
      to: '/services/insurance/property-casualty-insurance',
    });
    expect(certificateBlock).toMatchObject({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-certificate-proof',
        bgTone: 'grey',
        textTone: 'white',
        buttonStyle: 'blue',
        buttonTone: 'white',
      },
    });
    expectCanonicalLink(certificateBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/services/insurance/certificate-request',
    });
    expect(riskBlock).toMatchObject({
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-risk',
        titleHighlightsJson: '[{"text":"Risk","className":"is-melon"}]',
      },
    });
    expectCanonicalLink(riskBlock?.settings, 'buttonLinkJson', {
      kind: 'external',
      href: 'https://media.agfinancial.org/insurance-riskmanagementguide-noforms.pdf',
      openInNewWindow: true,
    });
    expect(ctaBlock).toMatchObject({
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-cta',
        title: 'What coverage is best for your ministry?',
      },
    });
    expect(ctaBlock?.settings?.fieldsJson).toContain('coverageFocus');
    expect(missionAssureBlock).toMatchObject({
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-mission-assure',
        title: 'Full coverage for mission trips, retreats…',
        body: '…and everything in between. With low per-person, per-day premiums, Mission Assure® offers superior protection at minimum cost. Every trip is a step of faith, but you don’t have to take it uninsured.',
      },
    });
    expect(fraudBlock).toMatchObject({
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-fraud',
      },
    });
    expectCanonicalLink(fraudBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/resources/article/defend-yourself-against-fraud',
    });
    expect(missionAssureBlock?.settings?.targetSectionKey).toBeUndefined();
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds the services overview feature band as a billboard block without changing its intro identity', () => {
    const blocks = contentBlockBlueprintsByPath['/services'] || [];
    const servicesIntroBand = blocks.find((block) => block?.id === 'intro');

    expect(servicesIntroBand?.kind).toBe('billboard');
    expect(servicesIntroBand?.mode).toBe('dynamic');
  });

  it('seeds Mission Assure as block-owned content, billboard, and feature sections without bridge targets', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance/mission-assure'] || [];
    const introPricing = blocks.find((block) => block?.id === 'intro_pricing');
    const medicalIncluded = blocks.find((block) => block?.id === 'medical_included');
    const getCovered = blocks.find((block) => block?.id === 'get_covered_billboard');
    const reportClaim = blocks.find((block) => block?.id === 'report_claim_billboard');
    const campSafety = blocks.find((block) => block?.id === 'camp_safety');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(false);
    expect(introPricing).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        widget: 'mission-assure-pricing',
        sectionClassName: 'mission-assure-native-intro',
      },
    });
    expect(introPricing?.settings?.pricingEntriesJson).toContain('"Domestic"');
    expect(medicalIncluded).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'mission-assure-native-medical',
      },
    });
    expect(medicalIncluded?.settings?.html).toContain('mission-assure-medical-badge');
    expect(getCovered).toMatchObject({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'mission-assure-native-get-covered',
      },
    });
    expect(reportClaim).toMatchObject({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'mission-assure-native-report-claim',
      },
    });
    expect(campSafety).toMatchObject({
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'mission-assure-native-camp-safety',
      },
    });
    expect(getCovered?.settings?.targetSectionKey).toBeUndefined();
    expect(reportClaim?.settings?.targetSectionKey).toBeUndefined();
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds real editable blocks for the impact page without a fallback page-content block', () => {
    const blocks = contentBlockBlueprintsByPath['/about-us/impact'] || [];
    const dynamicHero = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const dynamicIntro = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const dynamicBillboard = blocks.find((block) => block?.id === 'billboard' && block?.kind === 'billboard' && block?.mode === 'dynamic');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(false);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'billboard' && block?.kind === 'billboard' && block?.mode === 'dynamic')).toBe(true);
    expect(dynamicHero?.hidden).toBe(true);
    expect(dynamicIntro?.hidden).toBe(true);
    expect(dynamicBillboard).toBeTruthy();
    expect(blocks.find((block) => (
      block?.id === 'impact_proof_story'
      && block?.kind === 'site_feature'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        featureId: 'impact_proof_story',
        sectionClassName: 'impact-native-stats impact-proof-story',
      },
    });
    expect(blocks.some((block) => (
      block?.id === 'impact_proof_story'
      && block?.kind === 'site_feature'
      && block?.mode === 'static'
    ))).toBe(false);
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(blocks.some((block) => block?.mode === 'static')).toBe(false);
  });

  it('seeds explicit managed sections for 403(b) individual enrollment without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/403b/403b-individual-enrollment'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const qualifyBlock = blocks.find((block) => block?.id === 'confirm_eligibility' && block?.kind === 'card_grid');
    const enrollmentStepsBlock = blocks.find((block) => block?.id === 'enrollment_steps' && block?.kind === 'card_grid');
    const returnFormsBlock = blocks.find((block) => block?.id === 'return_forms' && block?.kind === 'content');

    expect(heroBlock).toBeTruthy();
    expect(introBlock).toBeTruthy();
    expect(qualifyBlock).toMatchObject({ mode: 'dynamic' });
    expect(enrollmentStepsBlock).toMatchObject({ mode: 'dynamic' });
    expect(returnFormsBlock).toMatchObject({ mode: 'dynamic' });
    expect(blocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds property and casualty as block-owned quote, program, resources, CTA, and notice sections', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance/property-casualty-insurance'] || [];
    const requestBlock = blocks.find((block) => block?.id === 'request_form');
    const agProgramBlock = blocks.find((block) => block?.id === 'ag_program');
    const partnerBlock = blocks.find((block) => block?.id === 'partner');
    const resourcesBlock = blocks.find((block) => block?.id === 'resources');
    const safeBlock = blocks.find((block) => block?.id === 'safe_sound');
    const noticeBlock = blocks.find((block) => block?.id === 'coverage_notice');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(requestBlock).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        title: 'Request a P&C quote.',
        titleClassName: 'is-super-grey',
        titleHighlightsJson: '[{"text":"P&C","className":"is-white"}]',
        body: 'Provide a few specifics, and we’ll contact you about a policy built specifically for your ministry.',
        sectionClassName: 'insurance-pc-native-quote',
        presetId: 'insurance-quote',
      },
    });
    expect(agProgramBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        anchorId: 'ag-program',
        sectionClassName: 'insurance-pc-native-ag-program',
        title: 'AG Insurance Program',
      },
    });
    expect(partnerBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-pc-native-partner',
        logoAlt: 'Church Mutual Insurance',
      },
    });
    expect(resourcesBlock).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-pc-native-resources',
        card1Title: 'Additional coverages available',
        card2Title: 'Extensive risk management resources',
      },
    });
    expect(safeBlock?.settings?.titleHighlightsJson).toBe('[{"text":"Safe & sound","className":"is-sandstone"}]');
    expect(noticeBlock?.settings?.fineprintDisclosureId).toBe('insurance-property-casualty-coverage-notice');
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    blocks.forEach((block) => {
      expect(String(block?.settings?.targetSectionKey || ''), block?.id).toBe('');
      expect(String(block?.settings?.targetSectionClassName || ''), block?.id).toBe('');
    });
  });

  it('seeds 409A with explicit managed sections instead of fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/409a'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const scenariosBlock = blocks.find((block) => block?.id === 'scenarios' && block?.kind === 'card_grid');
    const quoteBlock = blocks.find((block) => block?.id === 'quote' && block?.kind === 'content');
    const ctaFormBlock = blocks.find((block) => block?.id === 'cta_form' && block?.kind === 'cta_form');
    const teaserBlock = blocks.find((block) => block?.id === 'teaser' && block?.kind === 'content');

    expect(heroBlock).toBeTruthy();
    expect(introBlock).toBeTruthy();
    expect(scenariosBlock).toMatchObject({ mode: 'dynamic' });
    expect(quoteBlock).toMatchObject({ mode: 'dynamic' });
    expect(ctaFormBlock).toMatchObject({ mode: 'dynamic' });
    expect(teaserBlock).toMatchObject({ mode: 'dynamic' });
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
  });

  it('seeds invest-by-mail with explicit hero and intro blocks instead of fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/investments/invest-by-mail'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const mailFlowBlock = blocks.find((block) => block?.id === 'mail_flow' && block?.kind === 'content' && block?.mode === 'dynamic');

    expect(heroBlock?.settings?.line1Text).toBe('Institutional Investments');
    expect(heroBlock?.settings?.line1HighlightsJson).toBe('[{"text":"Investments","className":"is-atlantean"}]');
    expect(introBlock?.settings?.heading).toBe('Open an Investment by Mail');
    expect(introBlock?.settings?.bgTone).toBe('sand');
    expect(introBlock?.settings?.textTone).toBe('dark');
    expect(mailFlowBlock?.settings?.widget).toBe('investments-institutional-by-mail');
    expect(mailFlowBlock?.settings?.sectionClassName).toBe('investments-mail-native-shell');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds charitable gift annuities with explicit managed blocks instead of fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/planned-giving/charitable-gift-annuities'] || [];
    const requestBlock = blocks.find((block) => block?.id === 'request_form');
    const outroBlock = blocks.find((block) => block?.id === 'outro' && block?.mode === 'dynamic');
    const stateNoticesBlock = blocks.find((block) => block?.id === 'state_notices' && block?.mode === 'dynamic');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.find((block) => block?.id === 'how_it_works')).toMatchObject({
      kind: 'columns',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-cga-steps',
        columns: 'three',
        col1Type: 'flow-step',
        col1Title: '',
        col1IconKey: 'daf-step-1',
        col1IconTone: 'super-grey',
        col2Type: 'flow-step',
        col2IconKey: 'cga-step-2',
        col2IconTone: 'super-grey',
        col3Type: 'flow-step',
        col3IconKey: 'cga-step-3',
        col3IconTone: 'super-grey',
        col4Enabled: false,
      },
    });
    const giftAssetsBlock = blocks.find((block) => block?.id === 'gift_assets');
    expect(giftAssetsBlock).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-assets legacy-child-native-cga-assets',
        card1Title: 'Gift funding options',
        card1Fineprint: '*as of 2025',
        card1Body: expect.stringContaining('<ul>'),
      },
    });
    expect(giftAssetsBlock?.settings?.card1Body).toContain('The SECURE 2.0 Act of 2022');
    expect(giftAssetsBlock?.settings?.card1BodyHtml).toBeUndefined();
    expect(giftAssetsBlock?.settings?.card1ListJson).toBe('');
    expect(blocks.find((block) => block?.id === 'hero')?.settings).toMatchObject({
      button1Label: 'Try the CGA estimator',
    });
    expectCanonicalLink(blocks.find((block) => block?.id === 'hero')?.settings, 'button1LinkJson', {
      kind: 'anchor',
      href: '#demo',
    });
    expect(giftAssetsBlock?.settings?.card1Body).toContain('Cash');
    expect(blocks.find((block) => block?.id === 'secure_act')).toBeUndefined();
    expect(blocks.find((block) => block?.id === 'qcd_fineprint')).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-cga-qcd-fineprint',
        fineprintDisclosureId: 'planned-giving-cga-qcd-fineprint',
      },
    });
    expect(blocks.find((block) => block?.id === 'qcd_fineprint')?.settings?.html)
      .toContain('Also available');
    expect(blocks.find((block) => block?.id === 'qcd_fineprint')?.settings?.html)
      .not.toContain('The SECURE 2.0 Act');
    expect(blocks.find((block) => block?.id === 'annuity_options')).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-options legacy-child-native-cga-options',
        columns: 'two',
        showTitleDivider: false,
      },
    });
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(blocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
    expect(requestBlock).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        title: 'Your gifts are more powerful than you think.',
        sectionClassName: 'legacy-child-native-cga-request',
      },
    });
    const requestFields = JSON.parse(requestBlock?.settings?.step1FieldsJson || '[]');
    expect(requestFields.find((field) => field.id === 'givingProduct')?.options)
      .toEqual([
        { value: 'cga-immediate', label: 'CGA (immediate)' },
        { value: 'cga-deferred', label: 'CGA (deferred)' },
      ]);
    expect(outroBlock).toMatchObject({
      kind: 'billboard',
      settings: {
        title: 'Plenty of options.',
        titleFontFamily: 'helv',
        titleFontWeight: 700,
        justify: 'center',
        actionsBeforeCards: true,
        sectionClassName: 'legacy-child-native-cga-outro',
      },
    });
    expect(outroBlock?.settings?.fineprint).toBeUndefined();
    expect(outroBlock?.settings?.fineprintDisclosureId).toBeUndefined();
    expect(stateNoticesBlock).toMatchObject({
      kind: 'content',
      settings: {
        sectionClassName: 'legacy-child-native-cga-state-notices',
        fineprintDisclosureId: 'planned-giving-cga-state-notices',
      },
    });
    expect(stateNoticesBlock?.settings?.fineprint).toContain('Additional information for California residents');
  });

  it('seeds ministry impact fund with explicit managed blocks instead of fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/planned-giving/ministry-impact-fund'] || [];
    const requestBlock = blocks.find((block) => block?.id === 'request_form');
    const outroBlock = blocks.find((block) => block?.id === 'outro' && block?.mode === 'dynamic');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.find((block) => block?.id === 'how_it_works')).toMatchObject({
      kind: 'columns',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-ministry-impact-steps',
        col1Type: 'flow-step',
        col1IconKey: 'daf-step-1',
        col1IconTone: 'sandstone',
        col2Type: 'flow-step',
        col2IconKey: 'mif-step-2',
        col2IconTone: 'sandstone',
        col3Type: 'flow-step',
        col3IconKey: 'mif-step-3',
        col3IconTone: 'sandstone',
        col4Enabled: false,
      },
    });
    expect(blocks.find((block) => block?.id === 'how_it_works')?.settings).toMatchObject({
      col1Body: 'Open a Ministry Impact Fund®. Your donors transfer cash or assets to the fund, potentially a charitable deduction and minimized or eliminated capital gains.',
      col2Body: 'AG Foundation liquidates the assets for you and your donors, handling all administrative details.',
    });
    expectCanonicalLink(blocks.find((block) => block?.id === 'how_it_works')?.settings, 'col2ButtonLinkJson', {
      kind: 'external',
      href: 'https://uploads.agfinancial.org/',
    });
    expect(blocks.find((block) => block?.id === 'gift_types')).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-assets',
        card1Title: 'Gift types',
        card1TitleClassName: 'legacy-child-native-assets-card-title',
      },
    });
    expect(blocks.find((block) => block?.id === 'stock_transfer')).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        anchorId: 'stock-transfer',
        sectionClassName: 'legacy-child-native-stock',
        card1ButtonDocumentId: 'document-planned-giving-intent-to-gift-form',
        card2ButtonDocumentId: 'document-planned-giving-brokerage-loa-form',
      },
    });
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(blocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
    expect(requestBlock).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        title: 'Ministry support. Unlocked and expanded.',
        anchorId: 'ministry-impact-form',
        sectionClassName: 'legacy-child-native-request',
        presetId: 'legacy-impact',
        titleClassName: '',
        titleHighlightsJson: '',
        body: 'Use this form to start the Ministry Impact Fund® process.',
        textTone: 'white',
        spaceAfterRem: 4.2,
        hideStepTitles: true,
        step1Title: '',
        step1Note: '',
      },
    });
    const requestFields = JSON.parse(requestBlock?.settings?.step1FieldsJson || '[]');
    expect(requestFields.find((field) => field.id === 'givingProduct')?.options)
      .toEqual([{ value: 'ministry-impact-fund', label: 'Ministry Impact Fund®' }]);
    expect(outroBlock).toMatchObject({
      kind: 'billboard',
      settings: {
        title: 'More joy in receiving.',
        titleFontFamily: 'helv',
        titleFontWeight: 700,
        titleSizeRem: 4.59375,
        sectionClassName: 'legacy-child-native-billboard',
      },
    });
  });

  it('seeds calculators with explicit billboard and cta-form blocks without inert page content', () => {
    const blocks = contentBlockBlueprintsByPath['/calculators'] || [];
    const utilityHeaderBlock = blocks.find((block) => block?.id === 'utility_header');
    const cardsBlock = blocks.find((block) => block?.id === 'calculator_cards');
    const billboardBlock = blocks.find((block) => block?.id === 'billboard');
    const ctaBlock = blocks.find((block) => block?.id === 'cta_form');

    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(blocks.some((block) => block?.id === 'request_form')).toBe(false);
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
    expect(cardsBlock).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        columns: 'two',
        sectionClassName: 'calculators-native-collection calculators-native-collection--grid',
        showTitleDivider: false,
        card1Title: 'Retirement Savings',
        card8Title: 'Laddering',
      },
    });
    expectCanonicalLink(cardsBlock?.settings, 'card6ButtonLinkJson', {
      kind: 'internal',
      to: '/calculators/ministers-housing-allowance-quick-check',
    });
    expect(blocks.some((block) => block?.id === 'ministers_housing_quick_check')).toBe(false);
    expect(billboardBlock).toMatchObject({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Numbers are great.',
        subtitle: 'People are better.',
        sectionClassName: 'calculators-native-billboard',
      },
    });
    expect(ctaBlock).toMatchObject({
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        title: 'Connect your faith & finances. Start here.',
        subtitle: 'Let’s explore what we can do together.',
        sectionClassName: 'calculators-native-cta',
      },
    });
    expect(blocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
  });

  it('seeds certificate request, group term life, and consultant pages without inert page content', () => {
    const certificateRequestBlocks = contentBlockBlueprintsByPath['/services/insurance/certificate-request'] || [];
    const groupLifeBlocks = contentBlockBlueprintsByPath['/services/insurance/group-term-life-insurance'] || [];
    const retirementConsultantBlocks = contentBlockBlueprintsByPath['/services/retirement/retirement-consultants'] || [];
    const loanConsultantBlocks = contentBlockBlueprintsByPath['/services/loans/loan-consultants'] || [];

    expect(certificateRequestBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(certificateRequestBlocks.some((block) => block?.id === 'site_feature')).toBe(false);
    expect(groupLifeBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(groupLifeBlocks.some((block) => block?.id === 'site_feature')).toBe(false);
    expect(retirementConsultantBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(retirementConsultantBlocks.some((block) => block?.id === 'hero' || block?.kind === 'hero')).toBe(false);
    expect(loanConsultantBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(loanConsultantBlocks.some((block) => block?.id === 'hero' || block?.kind === 'hero')).toBe(false);

    expect(certificateRequestBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(certificateRequestBlocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form')).toBe(true);
    expect(certificateRequestBlocks.find((block) => block?.id === 'request_form')?.settings?.sectionClassName).toBe('certificate-request-native-section');
    expect(certificateRequestBlocks.find((block) => block?.id === 'request_form')?.settings?.presetId).toBe('certificate-request');
    expect(groupLifeBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(groupLifeBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(groupLifeBlocks.find((block) => block?.id === 'lead')?.settings?.sectionClassName).toBe('group-life-native-lead');
    expect(groupLifeBlocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form')).toBe(true);
    expect(groupLifeBlocks.find((block) => block?.id === 'request_form')?.settings?.sectionClassName).toBe('group-life-native-quote');
    expect(groupLifeBlocks.find((block) => block?.id === 'request_form')?.settings?.presetId).toBe('group-life-quote');
    expect(groupLifeBlocks.find((block) => block?.id === 'request_form')?.settings?.step1Title).toBe('');
    expect(groupLifeBlocks.find((block) => block?.id === 'honor')?.settings?.sectionClassName).toBe('group-life-native-honor');
    expect(groupLifeBlocks.find((block) => block?.id === 'benefits')?.settings?.sectionClassName).toBe('group-life-native-benefits');
    expect(groupLifeBlocks.find((block) => block?.id === 'benefits')?.settings?.cardStyle).toBe('card2');
    expect(groupLifeBlocks.find((block) => block?.id === 'benefits')?.settings?.showTitleDivider).toBe(false);
    expect(groupLifeBlocks.find((block) => block?.id === 'benefits_cta')?.settings?.paddingBottomRem).toBe(4.8);
    expectCanonicalLink(groupLifeBlocks.find((block) => block?.id === 'benefits_cta')?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/services/insurance/ministers-group-life-plan',
    });
    expect(retirementConsultantBlocks.find((block) => block?.id === 'page_header')).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Retirement Consultants',
        sectionClassName: 'consultant-native-page-head native-functional-page-head native-functional-page-head--utility',
        headingLevel: 'h1',
      },
    });
    expect(retirementConsultantBlocks.find((block) => block?.id === 'request_form')).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
      hidden: false,
      settings: {
        title: 'Talk with a consultant.',
        sectionClassName: 'loans-consultant-native-contact',
        presetId: 'consultant-contact',
        bgTone: 'blue',
        textTone: 'white',
      },
    });
    expect(retirementConsultantBlocks.find((block) => block?.id === 'request_form')?.settings?.step2FieldsJson).toContain('"churchOrMinistry"');
    expect(loanConsultantBlocks.find((block) => block?.id === 'page_header')).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Loan Consultants',
        sectionClassName: 'consultant-native-page-head native-functional-page-head native-functional-page-head--utility',
        headingLevel: 'h1',
      },
    });
    expect(loanConsultantBlocks.find((block) => block?.id === 'consultant_directory')).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'loans-consultant-native-locations',
        consultantService: 'loans',
      },
    });
    expect(loanConsultantBlocks.find((block) => block?.id === 'request_form')).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
      hidden: false,
      settings: {
        title: 'Talk with a consultant.',
        sectionClassName: 'loans-consultant-native-contact',
        presetId: 'consultant-contact',
        bgTone: 'blue',
        textTone: 'white',
      },
    });
    expect(loanConsultantBlocks.find((block) => block?.id === 'request_form')?.settings?.step2FieldsJson).toContain('"ministry"');
  });

  it('seeds explicit managed blocks for 403(b) group enrollment without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/403b/403b-group-enrollment'] || [];
    const eligibilityBlock = blocks.find((block) => block?.id === 'confirm_eligibility' && block?.kind === 'card_grid');
    const eligibilityDisclosureBlock = blocks.find((block) => block?.id === 'eligibility_disclosure' && block?.kind === 'content');
    const enrollmentStepsBlock = blocks.find((block) => block?.id === 'enrollment_steps' && block?.kind === 'card_grid');
    const returnFormsBlock = blocks.find((block) => block?.id === 'return_forms' && block?.kind === 'content');
    const complianceBillboard = blocks.find((block) => block?.id === 'billboard');
    const introBlock = blocks.find((block) => block?.id === 'intro');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'static')).toBe(false);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form' && block?.mode === 'dynamic')).toBe(true);
    expect(blocks.some((block) => block?.id === 'billboard' && block?.kind === 'billboard' && block?.mode === 'dynamic')).toBe(true);
    expect(eligibilityBlock).toMatchObject({ mode: 'dynamic' });
    expect(eligibilityDisclosureBlock).toMatchObject({ mode: 'dynamic' });
    expect(enrollmentStepsBlock).toMatchObject({ mode: 'dynamic' });
    expect(returnFormsBlock).toMatchObject({ mode: 'dynamic' });
    expect(complianceBillboard).toMatchObject({ mode: 'dynamic' });
    expect(introBlock).toMatchObject({ mode: 'dynamic' });
    expect(blocks.some((block) => block?.id === 'request_form' && block?.kind === 'request_form')).toBe(true);
    expect(blocks.some((block) => block?.id === 'billboard' && block?.kind === 'billboard')).toBe(true);
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds explicit managed blocks for endowments, generosity fund, and IRAs without fallback page content', () => {
    const legacyGivingBlocks = contentBlockBlueprintsByPath['/services/planned-giving'] || [];
    const charitableTrustsBlocks = contentBlockBlueprintsByPath['/services/planned-giving/charitable-trusts'] || [];
    const qcdBlocks = contentBlockBlueprintsByPath['/services/planned-giving/qualified-charitable-distribution'] || [];
    const endowmentBlocks = contentBlockBlueprintsByPath['/services/planned-giving/endowments'] || [];
    const generosityBlocks = contentBlockBlueprintsByPath['/services/planned-giving/donor-advised-fund'] || [];
    const iraBlocks = contentBlockBlueprintsByPath['/services/retirement/iras'] || [];
    const givingOptionsBlock = legacyGivingBlocks.find((block) => (
      block?.id === 'giving_options'
      && block?.kind === 'card_grid'
      && block?.mode === 'dynamic'
    ));

    expect(legacyGivingBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(legacyGivingBlocks.find((block) => block?.id === 'hero' && block?.mode === 'dynamic')).toMatchObject({
      settings: {
        line1Text: 'Generous giving.',
        line2Text: 'With strategy.',
      },
    });
    expect(legacyGivingBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(legacyGivingBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(legacyGivingBlocks.find((block) => block?.id === 'intro' && block?.mode === 'dynamic')).toMatchObject({
      settings: {
        heading: 'Make a difference that lasts for generations.',
        bgTone: 'sand',
      },
    });
    expect(givingOptionsBlock).toMatchObject({
      settings: {
        title: 'This is legacy planning and charitable giving made easy.',
        sectionClassName: 'legacy-giving-types',
        card1Title: 'Donor Advised Funds',
        card1Body: 'A Donor Advised Fund lets you contribute assets, receive an immediate tax deduction, and recommend grants to the ministries and causes you care about. It’s a tax-smart, flexible way to give on your own timeline.',
        card1ButtonLabel: '',
        card1ButtonStyle: 'ghost',
        card1Button2Style: 'blue',
        card2Title: 'Charitable Trusts',
        card3Title: 'Charitable Gift Annuities',
        card4Title: 'Endowments',
        card5Title: 'Ministry Impact Fund®',
        card6Title: 'Customized Giving Plans',
        card6Button2Style: 'ghost',
        card7Title: 'Wills & Estates',
        card7Body: 'Simple and straightforward, a will ensures a distribution end-of-life plan for your assets. This service is provided free of charge when you designate a 10% gift to an Assemblies of God ministry.',
        card7ButtonLabel: 'Download packet',
        card7ButtonDocumentId: 'form-planned-giving-will-planning-document',
        card7Button2Label: 'Online form*',
        card7ButtonStyle: 'outline',
        card7ButtonTone: 'atlantean',
        card7Button2Style: 'blue',
        card7Button2Tone: 'atlantean',
        card8Title: 'Qualified Charitable Distribution',
        card8Body: 'Your IRA can do more than fund your retirement. If you’re 70½ or older, a Qualified Charitable Distribution (QCD) lets you transfer up to $110,000 per year directly to your church or an eligible ministry tax-free, and straight from the source.',
        card8ButtonLabel: 'Learn more',
      },
    });
    expectCanonicalLink(givingOptionsBlock?.settings, 'card1Button2LinkJson', {
      kind: 'internal',
      to: '/services/planned-giving/donor-advised-fund',
    });
    expectCanonicalLink(givingOptionsBlock?.settings, 'card2ButtonLinkJson', {
      kind: 'internal',
      to: '/services/planned-giving/charitable-trusts',
    });
    expectCanonicalLink(givingOptionsBlock?.settings, 'card8ButtonLinkJson', {
      kind: 'internal',
      to: '/services/planned-giving/qualified-charitable-distribution',
    });
    expect(legacyGivingBlocks.find((block) => block?.id === 'wills_estate_billboard')).toBeUndefined();
    expect(legacyGivingBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(legacyGivingBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetFineprintSectionKey))).toBe(false);
    expect(legacyGivingBlocks.find((block) => block?.id === 'stewardship_story')).toMatchObject({
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'legacy_giving_stewardship_story',
        sectionClassName: 'legacy-giving-stewardship legacy-stewardship-story',
      },
    });
    expect(legacyGivingBlocks.find((block) => (
      block?.id === 'joy_billboard'
      && block?.kind === 'billboard'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        title: 'More joy in giving.',
        subtitle: 'It’s easier than you think.',
        sectionClassName: 'legacy-giving-joy fade-out',
        copyClassName: 'fade-up',
      },
    });
    expect(legacyGivingBlocks.find((block) => block?.id === 'cta_form')).toMatchObject({
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-giving-cta',
        fineprint: '* fields required',
      },
    });
    const plannedGivingCtaFields = parseCtaFormFieldsJson(
      legacyGivingBlocks.find((block) => block?.id === 'cta_form')?.settings?.fieldsJson,
    );
    expect(plannedGivingCtaFields.find((field) => field.id === 'name')).toMatchObject({ label: 'Name*', required: true });
    expect(plannedGivingCtaFields.find((field) => field.id === 'phone')).toMatchObject({ label: 'Phone*', required: true });
    expect(plannedGivingCtaFields.find((field) => field.id === 'contact_preference')).toMatchObject({
      label: 'Contact preference',
      type: 'select',
      options: [
        { value: 'phone', label: 'Phone' },
        { value: 'email', label: 'Email' },
      ],
    });
    const productField = plannedGivingCtaFields.find((field) => field.id === 'legacyproduct');
    expect(productField).toMatchObject({ label: 'Planned giving product of interest*', type: 'select' });
    expect(productField?.options).toContainEqual({ value: 'not-sure', label: "I'm not sure." });
    const comparisonTableBlock = legacyGivingBlocks.find((block) => block?.id === 'comparison_table');
    expect(comparisonTableBlock).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        anchorId: 'charitable-giving-plan-comparison',
        sectionClassName: 'legacy-giving-comparison',
        widget: 'giving-comparison-matrix',
        tableHeadersJson: '',
        tableRowsJson: '',
      },
    });
    expect(legacyGivingBlocks.find((block) => block?.id === 'comparison_matrix')).toBeUndefined();
    expect(legacyGivingBlocks.some((block) => block?.settings?.widget === 'charitable-giving-table')).toBe(false);
    expect(legacyGivingBlocks.find((block) => block?.id === 'testimonials')).toMatchObject({
      kind: 'testimonials',
      mode: 'dynamic',
      settings: {
        selectedIdsCsv: 'mike-daf-corporate-client\nbryan-jarrett-northplace-legacy\nandy-daf-client',
        sectionClassName: 'legacy-giving-testimonials',
        showFineprint: false,
      },
    });
    expect(legacyGivingBlocks.find((block) => block?.id === 'testimonials_fineprint')).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-giving-fineprint',
      },
    });
    expect(legacyGivingBlocks.find((block) => block?.id === 'opportunity_feature')).toMatchObject({
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-giving-opportunity',
      },
    });
    expectCanonicalLink(
      legacyGivingBlocks.find((block) => block?.id === 'opportunity_feature')?.settings,
      'buttonLinkJson',
      {
        kind: 'internal',
        to: '/resources/article/opportunity',
      },
    );

    expect(charitableTrustsBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(charitableTrustsBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(qcdBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(qcdBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(qcdBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(qcdBlocks.find((block) => block?.id === 'hero')).toMatchObject({
      settings: {
        line1Text: 'Qualified Charitable',
        line2Text: 'Distribution',
      },
    });
    expect(qcdBlocks.find((block) => block?.id === 'intro')).toMatchObject({
      settings: {
        heading: 'Your IRA can do more.',
        bgTone: 'sand',
      },
    });
    expect(qcdBlocks.find((block) => block?.id === 'intro')?.settings?.bodyHtml)
      .toBe('<p>If you\'re 70½ or older, a Qualified Charitable Distribution (QCD) lets you transfer up to $110,000 per year directly to your church or an eligible ministry — tax-free, and straight from the source. It counts toward your required minimum distribution, and not a dollar goes to taxes first.</p>');
    expect(qcdBlocks.find((block) => block?.id === 'how_it_works')).toMatchObject({
      kind: 'columns',
      mode: 'dynamic',
      presetId: 'planned-giving-steps',
      settings: {
        title: 'How it works',
        sectionClassName: '',
        col1Type: 'flow-step',
        col1IconKey: 'endowments-step-1',
        col1IconTone: 'atlantean',
        col1Body: 'Placeholder: describe the first QCD step here.',
        col2Type: 'flow-step',
        col2IconKey: 'daf-step-3',
        col2IconTone: 'atlantean',
        col3Type: 'flow-step',
        col3IconKey: 'qcd-step-3',
        col3IconTone: 'atlantean',
        col3Body: 'Because the distribution goes directly to the ministry, it\'s excluded from your taxable income entirely. Your generosity goes further.',
        col4Enabled: false,
      },
    });
    expect(qcdBlocks.find((block) => block?.id === 'card_grid')?.settings).toMatchObject({
      title: 'It starts with your IRA.',
      card1Title: 'A few things to know:',
      card1ListJson: JSON.stringify([
        'Must be age 70½ or older',
        'Transfers up to $110,000 per year',
        'Counts toward your required minimum distribution (RMD)',
        'Goes directly from your IRA to the ministry, never to you first',
        'Excluded from your taxable income',
        'Must go to an eligible 501(c)(3) — not a DAF or private foundation',
      ]),
    });
    expect(qcdBlocks.find((block) => block?.id === 'request_form')).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        title: 'Your IRA. Their gain.',
        body: 'Ready to make your distribution count? Use this form to take the first step.',
        anchorId: 'qcd-request-form',
        presetId: 'legacy-generosity',
      },
    });
    expect(sitePages.some((page) => page.path === '/services/planned-giving/qualified-charitable-distribution')).toBe(true);
    expect(charitableTrustsBlocks.find((block) => (
      block?.id === 'intro'
      && block?.kind === 'intro'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        heading: 'Charitable Trusts',
        textTone: 'white',
      },
    });
    expect(charitableTrustsBlocks.find((block) => (
      block?.id === 'trust_type_cards'
      && block?.kind === 'card_grid'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        columns: 'two',
        showTitleDivider: false,
        sectionClassName: 'legacy-child-native-trust-choices legacy-child-native-trust-choices--trusts',
        card1Title: 'Charitable Remainder Trust (CRT)',
        card1TitleHighlightsJson: '[{"text":"Remainder","className":"is-melon"}]',
        card2Title: 'Charitable Lead Trust (CLT)',
        card2TitleHighlightsJson: '[{"text":"Lead","className":"is-mango"}]',
      },
    });
    expect(charitableTrustsBlocks.find((block) => (
      block?.id === 'trust_differences'
      && block?.kind === 'card_grid'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        title: 'The differences. At a glance.',
        columns: 'two',
        cardStyle: 'none',
        showTitleDivider: false,
        sectionClassName: 'legacy-child-native-trusts-differences',
        card1Title: 'CRTs & taxes',
        card2Title: 'CLTs & taxes',
      },
    });
    expect(charitableTrustsBlocks.find((block) => (
      block?.id === 'trust_funding'
      && block?.kind === 'card_grid'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        title: 'Fund both CRTs and CLTs:',
        columns: 'one',
        cardStyle: 'card2',
        showTitleDivider: true,
        sectionClassName: 'legacy-child-native-assets legacy-child-native-trusts-funding',
        card1Title: 'Funding',
        card1Body: '',
        card1ListJson: '["Cash","Securities (stocks, bonds, mutual funds)","Real estate","Other marketable assets"]',
        card1ButtonLabel: 'Start here',
        card1ButtonStyle: 'blue',
        card1ButtonTone: 'atlantean',
      },
    });
    expectCanonicalLink(charitableTrustsBlocks.find((block) => (
      block?.id === 'trust_funding'
      && block?.kind === 'card_grid'
      && block?.mode === 'dynamic'
    ))?.settings, 'card1ButtonLinkJson', {
      kind: 'anchor',
      href: '#charitable-trusts-form',
    });
    expect(charitableTrustsBlocks.find((block) => (
      block?.id === 'remainder_trust_billboard'
      && block?.kind === 'billboard'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        title: 'Charitable Remainder Trust',
        bgTone: 'blue',
        textTone: 'white',
        anchorId: 'crt',
        sectionClassName: 'legacy-child-native-trusts-crt',
      },
    });
    expect(charitableTrustsBlocks.find((block) => block?.id === 'remainder_trust_how_it_works')).toBeUndefined();
    expect(charitableTrustsBlocks.find((block) => (
      block?.id === 'remainder_trust_type_cards'
      && block?.kind === 'card_grid'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        columns: 'two',
        showTitleDivider: false,
        sectionClassName: 'legacy-child-native-trusts-crt-types',
        card1Title: 'Charitable Remainder Unitrust (CRUT)',
        card2Title: 'Charitable Remainder Annuity (CRAT)',
      },
    });
    expect(charitableTrustsBlocks.find((block) => block?.id === 'cta_trigger')).toBeUndefined();
    expect(charitableTrustsBlocks.find((block) => block?.id === 'cta_form')).toBeUndefined();
    expect(charitableTrustsBlocks.find((block) => (
      block?.id === 'lead_trust_billboard'
      && block?.kind === 'billboard'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        title: 'Charitable Lead Trust',
        bgTone: 'sand',
        textTone: 'dark',
        anchorId: 'clt',
        sectionClassName: 'legacy-child-native-trusts-clt',
      },
    });
    expect(charitableTrustsBlocks.find((block) => (
      block?.id === 'lead_trust_type_cards'
      && block?.kind === 'card_grid'
      && block?.mode === 'dynamic'
    ))).toMatchObject({
      settings: {
        columns: 'two',
        showTitleDivider: false,
        sectionClassName: 'legacy-child-native-trusts-clt-types',
        card1Title: 'Grantor Lead Trust',
        card2Title: 'Non-Grantor Lead Trust',
      },
    });
    expect(charitableTrustsBlocks.find((block) => block?.id === 'request_form')).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        anchorId: 'charitable-trusts-form',
        sectionClassName: 'legacy-child-native-trusts-request',
        presetId: 'legacy-trusts',
        bgTone: 'blue',
        textTone: 'white',
        subtitle: '',
        bodyHtml: '<p>Use this form to start the Charitable Trust process. Let’s transform your generosity into a tax-saving, ministry-supporting win.</p>',
      },
    });
    expect(charitableTrustsBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(charitableTrustsBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(charitableTrustsBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);

    expect(endowmentBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(endowmentBlocks.find((block) => block?.id === 'hero')?.settings).toMatchObject({
      button1Label: 'Set up an endowment',
      button1Style: 'blue',
      button1Tone: 'atlantean',
    });
    expectCanonicalLink(endowmentBlocks.find((block) => block?.id === 'hero')?.settings, 'button1LinkJson', {
      kind: 'anchor',
      href: '#endowment-request-form',
      openInNewWindow: false,
    });
    expect(endowmentBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(endowmentBlocks.find((block) => block?.id === 'how_it_works')).toMatchObject({
      kind: 'columns',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-endowments-duo',
        columns: 'three',
        col1Type: 'flow-step',
        col1IconKey: 'daf-step-1',
        col1IconTone: 'atlantean',
        col2IconKey: 'mif-step-3',
        col2IconTone: 'atlantean',
        col3IconKey: 'endowments-step-3',
        col3IconTone: 'atlantean',
        col4Enabled: false,
      },
    });
    const endowmentAssetsBlock = endowmentBlocks.find((block) => block?.id === 'assets_you_may_give');
    expect(endowmentAssetsBlock).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-assets legacy-child-native-give-assets legacy-child-native-endowments-assets',
        title: 'Assets you may give',
        card1Title: 'What you give',
        card1Fineprint: 'Minimum funding requirements are $10,000 for cash or securities, and $100,000 for real estate.',
      },
    });
    expect(JSON.parse(endowmentAssetsBlock?.settings?.card1ListJson || '[]'))
      .toEqual(['Cash', 'Real estate', 'Art', 'Securities (restricted and marketable)', 'Antiques', 'Business interests']);
    expect(endowmentBlocks.find((block) => block?.id === 'calculator')).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        widget: 'endowment-calculator',
        sectionClassName: 'legacy-child-native-endowments-calculator',
      },
    });
    expect(endowmentBlocks.find((block) => block?.id === 'give_forever')).toMatchObject({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-endowments-big-cta',
        titleFontFamily: 'helv',
        titleSizeRem: 5.8,
        titleLetterSpacingEm: -0.035,
        scrollReveal: 'scale-up',
      },
    });
    expect(endowmentBlocks.find((block) => block?.id === 'request_form')?.settings).toMatchObject({
      sectionClassName: 'legacy-child-native-endowments-legacy-form',
      presetId: 'legacy-endowment',
      anchorId: 'endowment-request-form',
      title: 'Leave a legacy that lasts.',
      titleClassName: 'is-super-grey',
      body: 'Use this form to start your Endowment setup',
      bgTone: 'blue',
      textTone: 'white',
    });
    const endowmentRequestFields = JSON.parse(endowmentBlocks.find((block) => block?.id === 'request_form')?.settings?.step1FieldsJson || '[]');
    expect(endowmentRequestFields.find((field) => field.id === 'givingProduct')?.options)
      .toEqual([{ value: 'endowments', label: 'Endowment' }]);
    expect(endowmentBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(endowmentBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(endowmentBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);

    expect(generosityBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(generosityBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(generosityBlocks.find((block) => block?.id === 'hero')?.settings?.button1Label).toBe('Open a traditional DAF');
    expect(generosityBlocks.find((block) => block?.id === 'hero')?.settings?.button1Style).toBe('outline');
    expect(generosityBlocks.find((block) => block?.id === 'hero')?.settings?.button1Tone).toBe('super-grey');
    expect(generosityBlocks.find((block) => block?.id === 'hero')?.settings?.button2Label).toBe('Open a Generosity Fund®');
    expectCanonicalLink(generosityBlocks.find((block) => block?.id === 'hero')?.settings, 'button1LinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
    expectCanonicalLink(generosityBlocks.find((block) => block?.id === 'hero')?.settings, 'button2LinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/generosityfund/signup',
    });
    expect(generosityBlocks.find((block) => block?.id === 'how_it_works')).toMatchObject({
      kind: 'columns',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-generosity-steps',
        buttonLabel: 'Open a traditional DAF',
        buttonStyle: 'outline',
        buttonTone: 'super-grey',
        col1Type: 'flow-step',
        col1Title: '',
        col1IconKey: 'daf-step-1',
        col1IconTone: 'atlantean',
        col2Type: 'flow-step',
        col2IconKey: 'daf-step-2',
        col2IconTone: 'atlantean',
        col3Type: 'flow-step',
        col3IconKey: 'daf-step-3',
        col3IconTone: 'atlantean',
        col4Enabled: false,
      },
    });
    expectCanonicalLink(generosityBlocks.find((block) => block?.id === 'how_it_works')?.settings, 'buttonLinkJson', {
      kind: 'anchor',
      href: '#traditional-daf-form',
    });
    expect(generosityBlocks.find((block) => block?.id === 'traditional_daf_cta')).toBeUndefined();
    expect(generosityBlocks.find((block) => block?.id === 'generosity_fund_online')).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Generosity Fund®',
        titleHtml: 'Generosity Fund<sup>®</sup>',
        subtitle: 'Our fully online Donor Advised Fund simplifies your giving even more, letting you manage your giving anytime you want.',
        sectionClassName: 'legacy-child-native-generosity-online',
        buttonLabel: 'Open a Generosity Fund®',
      },
    });
    expect(generosityBlocks.find((block) => block?.id === 'gift_assets')).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-assets legacy-child-native-give-assets legacy-child-native-generosity-assets',
        card1Title: 'What you give',
        card1ClassName: 'generosity-fund-assets-card',
        card1ListJson: JSON.stringify([
          '**Cash**',
          '**Household income**',
          '**Proceeds from selling a home or business**',
          '**Securities** (stocks, bonds, mutual funds, etc.)',
          '**A variety of other funding sources**',
          '**$10,000 minimum**',
          'Additional funding can be made with as little as $100, as often as you like.',
        ]),
        card1Button2Label: 'Open a traditional DAF',
        card1Button2Style: 'blue',
        card1Button2Tone: 'atlantean',
      },
    });
    expect(generosityBlocks.find((block) => block?.id === 'request_form')).toMatchObject({
      kind: 'request_form',
      mode: 'dynamic',
    });
    expect(generosityBlocks.find((block) => block?.id === 'joyful_giving_billboard')).toMatchObject({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Simple, joyful giving.',
        titleFontFamily: 'helv',
        titleFontWeight: 700,
        titleSizeRem: 5.6,
        titleLetterSpacingEm: -0.03,
      },
    });
    expect(generosityBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(generosityBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(generosityBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);

    expect(iraBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(iraBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(iraBlocks.find((block) => block?.id === 'ira_types')).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
    });
    expect(iraBlocks.find((block) => block?.id === 'open_ira')).toBeUndefined();
    expect(iraBlocks.find((block) => block?.id === 'comparison_table')).toMatchObject({
      kind: 'content',
      mode: 'dynamic',
    });
    expect(iraBlocks.find((block) => block?.id === 'rate_table')).toMatchObject({
      settings: {
        paddingTopRem: 5.8,
        fineprintDisclosureId: 'retirement-ira-rates-disclosure',
      },
    });
    expect(iraBlocks.find((block) => block?.id === 'contribution_limits')?.settings?.fineprintDisclosureId).toBe('retirement-ira-contribution-limits-disclosure');
    expect(iraBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds fund-an-IRA as a block-owned widget route without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/iras/fund-an-ira'] || [];
    const utilityHeaderBlock = blocks.find((block) => block?.id === 'utility_header' && block?.kind === 'content' && block?.mode === 'dynamic');
    const widgetBlock = blocks.find((block) => block?.id === 'fund_ira_widget' && block?.kind === 'content');

    expect(blocks.some((block) => block?.id === 'hero' && block?.kind === 'hero')).toBe(false);
    expect(utilityHeaderBlock?.settings).toMatchObject({
      title: 'Fund an IRA',
      titleHighlightsJson: '[{"text":"IRA","className":"is-mango"}]',
      headingLevel: 'h1',
      sectionClassName: 'fund-ira-native-page-head native-functional-page-head native-functional-page-head--utility',
    });
    expect(widgetBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        widget: 'retirement-fund-ira',
        sectionClassName: 'retirement-fund-ira-native-shell',
        paddingTopRem: 0,
        paddingBottomRem: 0,
      },
    });
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds 403(b) terms definitions as explicit editable blocks', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/403b/403b-terms-definitions'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const definitionsBlock = blocks.find((block) => block?.id === 'core_definitions' && block?.kind === 'content');

    expect(heroBlock?.settings?.line1Text).toBe('403(b) Terms & Definitions');
    expect(heroBlock?.settings?.line1HighlightsJson).toBe('[{"text":"Terms","className":"is-mango"}]');
    expect(introBlock?.settings?.bodyHtml).toContain('Key 403(b) terms');
    expect(definitionsBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        sectionClassName: 'retirement-403b-terms-definitions-core',
        copyWrap: true,
        buttonLabel: 'Back to 403(b)',
      },
    });
    expectCanonicalLink(definitionsBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/services/retirement/403b',
    });
    expect(definitionsBlock?.settings?.html).toContain('QCCO = Qualified Church-Controlled Organization.');
    expect(definitionsBlock?.settings?.html).toContain('403bregs@agfinancial.org');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds subscribe as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/subscribe'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const contentBlock = blocks.find((block) => block?.id === 'stay_in_loop' && block?.kind === 'content');

    expect(heroBlock?.settings?.line1Text).toBe('Subscribe');
    expect(introBlock?.settings?.bodyHtml).toBe('<p>Subscribe to the newsletter.</p>');
    expect(contentBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        sectionClassName: 'subscribe-native-stay-in-loop',
        copyWrap: true,
        buttonLabel: 'Go to home signup',
      },
    });
    expectCanonicalLink(contentBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/#stay-in-the-loop',
    });
    expect(contentBlock?.settings?.html).toContain('Stay in the loop');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds yourplan as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/yourplan'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const startHereBlock = blocks.find((block) => block?.id === 'start_here' && block?.kind === 'card_grid');
    const contactBlock = blocks.find((block) => block?.id === 'contact_cta' && block?.kind === 'content');

    expect(heroBlock?.settings?.line1Text).toBe('Your Plan');
    expect(heroBlock?.settings?.line1HighlightsJson).toBe('[{"text":"Plan","className":"is-mango"}]');
    expect(introBlock?.settings?.bodyHtml).toContain('Build a practical plan');
    expect(startHereBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        title: 'Start here',
        sectionClassName: 'yourplan-native-start-here',
      },
    });
    expectCanonicalLink(startHereBlock?.settings, 'card1ButtonLinkJson', {
      kind: 'internal',
      to: '/services/loans',
    });
    expectCanonicalLink(startHereBlock?.settings, 'card5ButtonLinkJson', {
      kind: 'internal',
      to: '/services/insurance',
    });
    expect(contactBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        sectionClassName: 'yourplan-native-contact-cta',
        buttonLabel: 'Contact us',
      },
    });
    expectCanonicalLink(contactBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/contact-us',
    });
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds vineyard as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/vineyard'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const cardsBlock = blocks.find((block) => block?.id === 'faith_money_cards' && block?.kind === 'card_grid');

    expect(heroBlock?.settings?.line1Text).toBe('Welcome, Vineyard');
    expect(heroBlock?.settings?.line1HighlightsJson).toBe('[{"text":"Vineyard","className":"is-mango"}]');
    expect(introBlock?.settings?.bodyHtml).toContain('support churches, ministers, and individuals');
    expect(cardsBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        title: 'Put your money where your faith is',
        sectionClassName: 'vineyard-native-faith-money',
      },
    });
    expectCanonicalLink(cardsBlock?.settings, 'card1ButtonLinkJson', {
      kind: 'internal',
      to: '/services/investments',
    });
    expectCanonicalLink(cardsBlock?.settings, 'card2ButtonLinkJson', {
      kind: 'internal',
      to: '/services/insurance/property-casualty-insurance',
    });
    expectCanonicalLink(cardsBlock?.settings, 'card3ButtonLinkJson', {
      kind: 'internal',
      to: '/services/planned-giving',
    });
    expectCanonicalLink(cardsBlock?.settings, 'card4ButtonLinkJson', {
      kind: 'internal',
      to: '/services/loans',
    });
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds privacy policy as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/privacy-policy'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const contentBlock = blocks.find((block) => block?.id === 'privacy_details' && block?.kind === 'content');

    expect(heroBlock?.settings?.line1Text).toBe('Privacy Policy');
    expect(introBlock?.settings?.bodyHtml).toContain('privacy practices applicable to all internet users');
    expect(contentBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legal-native-privacy-details',
        copyWrap: true,
        buttonLabel: 'Contact us',
      },
    });
    expectCanonicalLink(contentBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/contact-us',
    });
    expect(contentBlock?.settings?.html).toContain('Collection and Use of Personal Information');
    expect(contentBlock?.settings?.html).toContain('webmaster@agfinancial.org');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds accessibility as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/accessibility'] || [];
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const conformanceBlock = blocks.find((block) => block?.id === 'conformance_status' && block?.kind === 'content');
    const limitationsBlock = blocks.find((block) => block?.id === 'limitations' && block?.kind === 'content');
    const feedbackBlock = blocks.find((block) => block?.id === 'feedback' && block?.kind === 'content');

    expect(blocks.some((block) => block?.id === 'hero')).toBe(false);
    expect(introBlock?.settings?.heading).toBe("We're committed to accessibility.");
    expect(introBlock?.settings?.bodyHtml).toContain('ensuring visitors with disabilities');
    expect(conformanceBlock?.settings?.html).toContain('https://www.w3.org/WAI/standards-guidelines/wcag/');
    expect(limitationsBlock?.settings?.html).toContain('https://osxdaily.com/2014/10/22/increase-contrast-mac-os-x-yosemite/');
    expect(limitationsBlock?.settings?.html).toContain('https://support.microsoft.com/en-us/help/13862/windows-10-use-high-contrast-mode');
    expect(feedbackBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        sectionClassName: 'accessibility-native-feedback',
        buttonLabel: 'Contact Us',
      },
    });
    expectCanonicalLink(feedbackBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/contact-us',
    });
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds mission assure report-a-claim as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/services/insurance/mission-assure/report-a-claim'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const contactsBlock = blocks.find((block) => block?.id === 'claim_contacts' && block?.kind === 'card_grid');

    expect(heroBlock?.settings?.line1Text).toBe('Report a claim');
    expect(heroBlock?.settings?.line1HighlightsJson).toBe('[{"text":"claim","className":"is-mango"}]');
    expect(introBlock?.settings?.bodyHtml).toContain('policy holder name');
    expect(contactsBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        title: 'Claim contact information',
        sectionClassName: 'mission-assure-claim-contacts',
      },
    });
    expectCanonicalLink(contactsBlock?.settings, 'card1ButtonLinkJson', {
      kind: 'email',
      href: 'mailto:ACEClaimsFirstNotice@acegroup.com',
    });
    expect(contactsBlock?.settings?.card1Body).toContain('ACEClaimsFirstNotice@acegroup.com');
    expect(contactsBlock?.settings?.card4Body).toContain('Scranton, PA 18505-0554');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds resources as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/resources'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const featuredBlock = blocks.find((block) => block?.id === 'featured_resources' && block?.kind === 'card_grid');
    const categoriesBlock = blocks.find((block) => block?.id === 'categories' && block?.kind === 'content');

    expect(heroBlock?.settings?.line1Text).toBe('Resources');
    expect(introBlock?.settings?.bodyHtml).toContain('Articles, calculators');
    expect(featuredBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        title: 'Featured',
        sectionClassName: 'resources-native-featured',
      },
    });
    expectCanonicalLink(featuredBlock?.settings, 'card1ButtonLinkJson', {
      kind: 'internal',
      to: '/resources',
    });
    expectCanonicalLink(featuredBlock?.settings, 'card3ButtonLinkJson', {
      kind: 'internal',
      to: '/resources',
    });
    expect(featuredBlock?.settings?.card3Title).toContain('Tariffs');
    expect(categoriesBlock?.settings?.html).toContain('<a href="/calculators">Calculators</a>');
    expect(categoriesBlock?.settings?.html).toContain('Tax &amp; End of Year');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds online contributions as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/online-contributions'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const overviewBlock = blocks.find((block) => block?.id === 'setup_overview' && block?.kind === 'content');
    const stepsBlock = blocks.find((block) => block?.id === 'setup_steps' && block?.kind === 'card_grid');
    const helpBlock = blocks.find((block) => block?.id === 'help_cta' && block?.kind === 'billboard');

    expect(heroBlock?.settings?.line1Text).toBe('Employer contributions');
    expect(introBlock?.settings?.heading).toBe('Manage Contributions');
    expect(overviewBlock?.settings?.sectionClassName).toBe('online-contrib-native-overview');
    expect(overviewBlock?.settings?.html).toContain('clientservices@agfinancial.org');
    expect(stepsBlock).toMatchObject({
      mode: 'dynamic',
      presetId: 'step-cards',
      settings: {
        sectionClassName: 'online-contrib-native-steps',
        columns: 'one',
        card1Title: '01',
        card2Title: '02',
        card3Title: '03',
      },
    });
    expectCanonicalLink(stepsBlock?.settings, 'card1ButtonLinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/cp/do/user/login',
    });
    expectCanonicalLink(stepsBlock?.settings, 'card3ButtonLinkJson', {
      kind: 'email',
      href: 'mailto:clientservices@agfinancial.org',
    });
    expectCanonicalLink(stepsBlock?.settings, 'card3Button2LinkJson', {
      kind: 'phone',
      href: 'tel:18666211787',
    });
    expect(helpBlock?.settings).toMatchObject({
      sectionClassName: 'online-contrib-native-help',
    });
    expectCanonicalLink(helpBlock?.settings, 'buttonLinkJson', {
      kind: 'email',
      href: 'mailto:retirement@agfinancial.org',
    });
    expectCanonicalLink(helpBlock?.settings, 'button2LinkJson', {
      kind: 'phone',
      href: 'tel:18006227526',
    });
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds terms of service as explicit editable blocks without fallback page content', () => {
    const blocks = contentBlockBlueprintsByPath['/terms-of-service'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const contentBlock = blocks.find((block) => block?.id === 'terms_details' && block?.kind === 'content');

    expect(heroBlock?.settings?.line1Text).toBe('Terms of Service');
    expect(introBlock?.settings?.bodyHtml).toContain('subject to these Terms of Service');
    expect(contentBlock).toMatchObject({
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legal-native-terms-details',
        copyWrap: true,
        buttonLabel: 'Contact us',
      },
    });
    expectCanonicalLink(contentBlock?.settings, 'buttonLinkJson', {
      kind: 'internal',
      to: '/contact-us',
    });
    expect(contentBlock?.settings?.html).toContain('Acceptance of Terms');
    expect(contentBlock?.settings?.html).toContain('Disclaimers and Liability');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('seeds the 403(b) loan section with explicit semantic blocks instead of native-only sections', () => {
    const blocks = contentBlockBlueprintsByPath['/services/retirement/403b'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic');
    const introBlock = blocks.find((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic');
    const benefitsCardsBlock = blocks.find((block) => block?.id === 'benefits_cards' && block?.kind === 'card_grid');
    const investmentStrategyHeadingBlock = blocks.find((block) => block?.id === 'investment_strategy_heading' && block?.kind === 'billboard');
    const investmentStrategyOptionsBlock = blocks.find((block) => block?.id === 'investment_strategy_options' && block?.kind === 'content');
    const whoQualifiesBlock = blocks.find((block) => block?.id === 'who_qualifies' && block?.kind === 'card_grid');
    const loanDetailsBlock = blocks.find((block) => block?.id === 'loan_details' && block?.kind === 'content');
    const housingFeatureBlock = blocks.find((block) => block?.id === 'housing_feature' && block?.kind === 'columns');
    const loanApplyBlock = blocks.find((block) => block?.id === 'loan_apply' && block?.kind === 'card_grid');
    const onlineContributionsBlock = blocks.find((block) => block?.id === 'online_contributions' && block?.kind === 'columns');

    expect(heroBlock?.settings?.justify).toBe('right');
    expect(heroBlock?.settings?.line1Text).toBe('Saving while serving.');
    expect(heroBlock?.settings?.bgTone).toBe('white');
    expect(introBlock?.settings?.button1Label).toBe('Find my consultant');
    expectCanonicalLink(introBlock?.settings, 'button1LinkJson', {
      kind: 'internal',
      to: '/services/retirement/retirement-consultants',
    });
    expect(benefitsCardsBlock?.settings?.contentWidth).toBe('browser');
    expect(benefitsCardsBlock?.settings?.fullBleed).toBe(true);
    expect(benefitsCardsBlock?.settings?.card3Title).toBe("Ministers' Housing Allowance");
    expect(benefitsCardsBlock?.settings?.card3Body).toContain('retired ministers through the AGFinancial 403(b) plan');
    expect(benefitsCardsBlock?.settings?.card5Title).toBe('Rollovers');
    expect(benefitsCardsBlock?.settings?.card8Title).toBe('Education');
    expect(blocks.some((block) => block?.id === 'benefits_callout')).toBe(false);
    expect(investmentStrategyHeadingBlock?.mode).toBe('dynamic');
    expect(investmentStrategyHeadingBlock?.settings?.title).toBe('Investment Strategy Options');
    expect(investmentStrategyHeadingBlock?.settings?.buttonLabel).toBe('View the monthly performance');
    expectCanonicalLink(investmentStrategyHeadingBlock?.settings, 'buttonLinkJson', {
      kind: 'external',
      href: 'https://files.agfinancial.org/retirement/Performance-Update/Performance-Update.pdf',
    });
    expect(investmentStrategyHeadingBlock?.settings?.button2Label).toBe('Prospectus');
    expectCanonicalLink(investmentStrategyHeadingBlock?.settings, 'button2LinkJson', {
      kind: 'internal',
      to: '/prospectus',
    });
    expect(investmentStrategyHeadingBlock?.settings?.button2Style).toBe('dark');
    expect(investmentStrategyOptionsBlock?.mode).toBe('dynamic');
    expect(investmentStrategyOptionsBlock?.settings?.fullBleed).toBe(true);
    expect(String(investmentStrategyOptionsBlock?.settings?.html || '')).toContain('ret403b-strategy-feature');
    expect(String(investmentStrategyOptionsBlock?.settings?.html || '')).toContain('services-breakdown-panel');
    expect(String(investmentStrategyOptionsBlock?.settings?.html || '')).toContain('ret403b-strategy-feature-links');
    expect(String(investmentStrategyOptionsBlock?.settings?.html || '')).toContain('service-native-btn is-outline is-tone-atlantean');
    expect(String(investmentStrategyOptionsBlock?.settings?.html || '')).toContain('Individual Investment Options');
    expect(String(investmentStrategyOptionsBlock?.settings?.html || '')).not.toContain('Prospectus');
    expect(String(investmentStrategyOptionsBlock?.settings?.html || '')).not.toContain('PDF');
    expect(whoQualifiesBlock?.presetId).toBe('eligibility-cards');
    expect(whoQualifiesBlock?.templateId).toBe('card_grid');
    expect(whoQualifiesBlock?.mode).toBe('dynamic');
    expect(whoQualifiesBlock?.settings?.cardStyle).toBe('none');
    expect(whoQualifiesBlock?.settings?.cardTitleSizeRem).toBe(1.58);
    expect(whoQualifiesBlock?.settings?.card1Title).toBe('Employees of eligible employers');
    expect(whoQualifiesBlock?.settings?.card1Body).toContain('church-affiliated, tax-exempt 501(c)(3) organizations');
    expect(whoQualifiesBlock?.settings?.card3Title).toBe('Self-employed credentialed ministers');
    expect(blocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
    expect(loanDetailsBlock?.mode).toBe('dynamic');
    expect(loanDetailsBlock?.settings?.sectionClassName).toBe('retirement-403b-native-loans');
    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('403(b) Plan Loans');
    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('The requested 403(b) loan amount cannot be less than $1,500');
    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('retirement-403b-loan-detail-card');
    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('retirement-403b-loan-followup');
    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('retirement-403b-loan-fineprint');
    expect(String(loanDetailsBlock?.settings?.html || '')).toContain('Contact your AGFinancial retirement consultant for more information.');
    expect(housingFeatureBlock?.presetId).toBe('housing-allowance');
    expect(housingFeatureBlock?.templateId).toBe('columns');
    expect(housingFeatureBlock?.settings?.bgTone).toBe('white');
    expect(housingFeatureBlock?.settings?.col1Type).toBe('photo');
    expect(housingFeatureBlock?.settings?.col2Title).toBe("Retired Ministers' Housing Allowance");
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).toContain('This unique IRS benefit');
    expect(housingFeatureBlock?.settings?.col2ButtonLabel).toBe('IRS information');
    expectCanonicalLink(housingFeatureBlock?.settings, 'col2ButtonLinkJson', {
      kind: 'external',
      href: 'https://www.irs.gov/publications/p517',
      openInNewWindow: true,
    });
    expect(housingFeatureBlock?.settings?.col2ButtonStyle).toBe('outline');
    expect(housingFeatureBlock?.settings?.col2ButtonTone).toBe('atlantean');
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).not.toContain('The maximum housing allowance exemption in any tax year is the lesser of:');
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).not.toContain('<ul>');
    expect(String(housingFeatureBlock?.settings?.col2BodyHtml || '')).not.toContain('Compare your annual housing expenses to Fair Rental Value');
    expect(blocks.some((block) => block?.id === 'quickcheck')).toBe(false);
    expect(loanApplyBlock?.presetId).toBe('step-cards');
    expect(loanApplyBlock?.templateId).toBe('card_grid');
    expect(loanApplyBlock?.mode).toBe('dynamic');
    expect(blocks.some((block) => block?.id === 'loan_details')).toBe(true);
    expect(blocks.some((block) => block?.id === 'loan_apply')).toBe(true);
    expect(loanApplyBlock?.settings?.columns).toBe('one');
    expectCanonicalLink(loanApplyBlock?.settings, 'card1ButtonLinkJson', {
      kind: 'external',
      href: 'https://files.agfinancial.org/retirement/403(b)-Loan-Rules.pdf',
    });
    expect(loanApplyBlock?.settings?.card1Body).toBe('Review the loan rules.');
    expectCanonicalLink(loanApplyBlock?.settings, 'card2ButtonLinkJson', {
      kind: 'external',
      href: 'https://secure.agfinancial.org/',
    });
    expect(loanApplyBlock?.settings?.card2Body).toBe('Log in.');
    expect(loanApplyBlock?.settings?.card3Body).toBe('Select your 403(b) account.');
    expect(loanApplyBlock?.settings?.card5Body).toContain('**Info**');
    expect(loanApplyBlock?.settings?.card6Body).toContain('**Request a Loan**');
    expect(blocks.find((block) => block?.id === 'start_enrollment' && block?.kind === 'card_grid')?.settings?.card1Title).toBe('Establish an individual plan');
    expect(onlineContributionsBlock?.mode).toBe('dynamic');
    expect(onlineContributionsBlock?.presetId).toBe('do-the-math');
    expect(onlineContributionsBlock?.settings?.col1Title).toBe('Online Contributions');
    expectCanonicalLink(onlineContributionsBlock?.settings, 'col1ButtonLinkJson', {
      kind: 'internal',
      to: '/online-contributions',
    });
    expect(blocks.some((block) => block?.id === 'investment_strategy_options')).toBe(true);
    expect(blocks.some((block) => block?.id === 'who_qualifies')).toBe(true);
    expect(blocks.some((block) => block?.id === 'loan_details')).toBe(true);
  });

  it('keeps migrated blueprint routes on canonical editable field sets', () => {
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];
    const retirementBlocks = contentBlockBlueprintsByPath['/services/retirement'] || [];
    const testBlocks = contentBlockBlueprintsByPath['/test'] || [];
    const retirementHeroBlock = retirementBlocks.find((block) => block?.id === 'hero');
    const retirementIntroBlock = retirementBlocks.find((block) => block?.id === 'intro');

    expect(loansBlocks.find((block) => block?.id === 'value_cards')?.editableFields).toEqual(
      getEditableFieldsForKind('columns'),
    );
    expect(retirementHeroBlock?.settings).toMatchObject({
      line1Text: 'Invest in tomorrow.',
      line1HighlightsJson: '[{"text":"tomorrow","className":"is-atlantean"}]',
      line2Text: 'Start today.',
      line2HighlightsJson: '[{"text":"today","className":"is-mango"}]',
    });
    expect(retirementIntroBlock?.hidden).toBe(true);
    expect(retirementBlocks.find((block) => block?.id === 'billboard')?.editableFields).toEqual(
      getEditableFieldsForKind('billboard'),
    );
    expect(testBlocks.find((block) => block?.id === 'intro')?.editableFields).toEqual(
      getEditableFieldsForKind('intro'),
    );
    expect(testBlocks.find((block) => block?.id === 'billboard')?.editableFields).toEqual(
      getEditableFieldsForKind('billboard'),
    );
    expect(testBlocks.find((block) => block?.id === 'columns')?.editableFields).toEqual(
      getEditableFieldsForKind('columns'),
    );
  });

  it('keeps canonical columns-family seeds explicit about their preset identity', () => {
    const homeBlocks = contentBlockBlueprintsByPath['/'] || [];
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];
    const retirementBlocks = contentBlockBlueprintsByPath['/services/retirement'] || [];
    const testBlocks = contentBlockBlueprintsByPath['/test'] || [];

    expect(homeBlocks.find((block) => block?.id === 'home_ministry_allies' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'billboard',
    });
    expect(homeBlocks.find((block) => block?.id === 'home_do_the_math' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'billboard',
    });
    expect(retirementBlocks.find((block) => block?.id === 'columns_math' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'billboard',
      settings: {
        justify: 'center',
        lineSpacing: 0.94,
        contentMaxWidthPx: 1216,
      },
    });
    expect(retirementBlocks.some((block) => block?.id === 'housing_feature')).toBe(false);
    expect(loansBlocks.find((block) => block?.id === 'value_cards' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'columns',
      templateId: 'columns',
      presetId: 'value-cards',
    });
    expect(testBlocks.find((block) => block?.id === 'columns' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'columns',
      templateId: 'columns',
      presetId: 'default',
    });
  });

  it('exports canonical link settings for touched grid and column blueprint seeds', () => {
    const homeBlocks = contentBlockBlueprintsByPath['/'] || [];
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];
    const testBlocks = contentBlockBlueprintsByPath['/test'] || [];

    const homeServicesFeature = homeBlocks.find((block) => block?.id === 'home_services_feature_animation');
    const servicesGrid = homeBlocks.find((block) => block?.id === 'services_grid');
    const loansValueCards = loansBlocks.find((block) => block?.id === 'value_cards');
    const testGrid = testBlocks.find((block) => block?.id === 'card_grid');

    expect(homeServicesFeature?.kind).toBe('site_feature');
    expect(homeServicesFeature?.mode).toBe('dynamic');
    expect(homeServicesFeature?.settings?.featureId).toBe('home_services_feature_animation');
    expect(homeServicesFeature?.settings?.headline).toBe('Bold, smart steps.\nTogether.');
    expectCanonicalLink(servicesGrid?.settings, 'browseLinkJson', {
      kind: 'internal',
      to: '/services',
    });
    expectCanonicalLink(servicesGrid?.settings, 'card1LinkJson', {
      kind: 'internal',
      to: '/services/loans',
    });
    expectCanonicalLink(servicesGrid?.settings, 'card6LinkJson', {
      kind: 'internal',
      to: '/rates',
    });
    expectNoSettings(servicesGrid?.settings, [
      'browsePath',
      'browsePageRef',
      'card1Path',
      'card1PageRef',
      'card6Path',
      'card6PageRef',
    ]);

    expect(loansValueCards?.settings?.col1ButtonLabel).toBe('');
    expect(loansValueCards?.settings?.columns).toBe('four');
    expect(loansValueCards?.settings?.col4Enabled).toBe(true);
    expect(loansValueCards?.settings?.col4Title).toBe('Loyalty.');
    expect(loansValueCards?.settings?.col4Body).toBe("A ministry returning to us for its next loan — and the next — really says something. Many of our borrowers are repeat clients. That's the best endorsement we could ask for.");
    expect(loansValueCards?.settings?.col4ButtonLabel).toBe('');
    expectNoSettings(loansValueCards?.settings, [
      'col1ButtonUrl',
      'col1ButtonPageRef',
      'col4ButtonUrl',
      'col4ButtonPageRef',
    ]);
    expect(loansValueCards?.templateId).toBe('columns');
    expect(loansValueCards?.presetId).toBe('value-cards');

    expect(testGrid?.templateId).toBe('card_grid');
    expect(testGrid?.presetId).toBe('default');
    expect(testGrid?.settings?.card1ButtonLabel).toBe('');
    expect(testGrid?.settings?.card8ButtonLabel).toBe('');
    expectNoSettings(testGrid?.settings, [
      'card1ButtonUrl',
      'card1ButtonPageRef',
      'card8ButtonUrl',
      'card8ButtonPageRef',
    ]);
  });

  it('keeps touched blueprint inventories dynamic-only after cleanup simplification', () => {
    const homeBlocks = contentBlockBlueprintsByPath['/'] || [];
    const servicesBlocks = contentBlockBlueprintsByPath['/services'] || [];
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];
    const investmentBlocks = contentBlockBlueprintsByPath['/services/investments'] || [];
    const retirementBlocks = contentBlockBlueprintsByPath['/services/retirement'] || [];

    expect(homeBlocks.some((block) => block?.id === 'top_strip' && block?.mode === 'dynamic' && block?.kind === 'top_strip')).toBe(true);
    expect(homeBlocks.some((block) => block?.id === 'hero' && block?.mode === 'dynamic' && block?.kind === 'hero')).toBe(true);
    expect(homeBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(homeBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);

    expect(servicesBlocks.find((block) => block?.id === 'intro' && block?.mode === 'dynamic')?.kind).toBe('billboard');
    expect(servicesBlocks.find((block) => block?.id === 'intro' && block?.mode === 'dynamic')?.settings?.title).toBe('A robust financial strategy for your ministry and your family.');
    expect(servicesBlocks.find((block) => block?.id === 'services_cards')).toMatchObject({
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'services_breakdown',
        sectionClassName: 'services-native-grid-wrap services-breakdown-section',
      },
    });
    expect(servicesBlocks.find((block) => block?.id === 'matters_band')).toMatchObject({
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'services_matters_band',
        buttonLabel: "See what we're doing together",
        sectionClassName: 'services-native-matters',
      },
    });
    expect(servicesBlocks.find((block) => block?.id === 'testimonials')?.settings?.sectionClassName).toBe('services-native-testimonials');
    expect(servicesBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(servicesBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);

    expect(loansBlocks.find((block) => block?.id === 'loan_options')).toMatchObject({
      kind: 'card_grid',
      mode: 'dynamic',
      templateId: 'card_grid',
      presetId: 'default',
      settings: {
        title: 'Every loan, 100% customized.',
        sectionClassName: 'loans-native-options',
      },
    });
    expect(loansBlocks.find((block) => block?.id === 'cta_band')).toMatchObject({
      kind: 'billboard',
      mode: 'dynamic',
      templateId: 'billboard',
      presetId: 'default',
      settings: {
        title: 'Which loan is right for me?',
      },
    });
    expect(loansBlocks.find((block) => block?.id === 'testimonials')?.settings?.sectionClassName).toBe('loans-native-testimonials');
    expect(loansBlocks.some((block) => block?.id === 'hero' && block?.mode === 'dynamic' && block?.kind === 'hero')).toBe(true);
    expect(loansBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(loansBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
    expect(investmentBlocks.some((block) => block?.id === 'hero' && block?.mode === 'dynamic' && block?.kind === 'hero')).toBe(true);
    expect(investmentBlocks.some((block) => block?.id === 'hero' && block?.mode === 'static')).toBe(false);
    expect(investmentBlocks.some((block) => block?.id === 'certificates' && block?.mode === 'dynamic' && block?.kind === 'card_grid')).toBe(true);
    expect(investmentBlocks.find((block) => block?.id === 'certificates' && block?.mode === 'dynamic')?.templateId).toBe('card_grid');
    expect(investmentBlocks.find((block) => block?.id === 'certificates' && block?.mode === 'dynamic')?.presetId).toBe('default');
    expect(investmentBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(investmentBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
    expect(investmentBlocks.some((block) => block?.id === 'rates_table')).toBe(false);
    expect(retirementBlocks.find((block) => block?.id === 'retirement_plan_feature')).toMatchObject({
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'retirement_plan_feature',
        sectionClassName: 'retirement-plan-feature',
      },
    });
    expect(retirementBlocks.find((block) => block?.id === 'rollover_billboard')?.settings?.sectionClassName).toBe('retirement-rollover-billboard');
    expect(retirementBlocks.find((block) => block?.id === 'testimonials')?.settings?.sectionClassName).toBe('retirement-testimonials');
    expect(retirementBlocks.some((block) => block?.mode === 'static')).toBe(false);
    expect(retirementBlocks.some((block) => Boolean(block?.settings?.targetSectionKey || block?.settings?.targetSectionClassName || block?.settings?.targetSectionIndex))).toBe(false);
    expect(retirementBlocks.some((block) => block?.id === 'housing_allowance')).toBe(false);
    expect(homeBlocks.find((block) => block?.id === 'home_ministry_allies' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'billboard',
    });
    expect(homeBlocks.find((block) => block?.id === 'home_do_the_math' && block?.mode === 'dynamic')).toMatchObject({
      kind: 'billboard',
    });
  });

  it('keeps route-owned blocks in page blueprints without promoting them into add templates', () => {
    const templates = getAllBlockTemplateBlueprints();
    const servicesBlocks = contentBlockBlueprintsByPath['/services'] || [];
    const loansBlocks = contentBlockBlueprintsByPath['/services/loans'] || [];

    expect(servicesBlocks.find((block) => block?.id === 'services_cards')).toMatchObject({
      id: 'services_cards',
      mode: 'dynamic',
      kind: 'site_feature',
    });
    expect(servicesBlocks.find((block) => block?.id === 'matters_band')).toMatchObject({
      id: 'matters_band',
      mode: 'dynamic',
      kind: 'site_feature',
    });
    expect(loansBlocks.find((block) => block?.id === 'loan_options')).toMatchObject({
      id: 'loan_options',
      mode: 'dynamic',
      kind: 'card_grid',
    });
    expect(templates.some((template) => ['services_cards', 'matters_band', 'loan_options'].includes(template?.templateLookupId))).toBe(false);
    expect(templates.some((template) => template?.mode === 'static')).toBe(false);
    expect(templates.some((template) => template?.isCompatibility)).toBe(false);
  });

  it('keeps investments growth follow-up seeded on the site feature plus reusable CTA form path', () => {
    const investmentBlocks = contentBlockBlueprintsByPath['/services/investments'] || [];
    const growthFeatureBlock = investmentBlocks.find((block) => block?.id === 'growth_feature');
    const ctaFormBlock = investmentBlocks.find((block) => block?.id === 'cta_form');
    const featurePanelBlock = investmentBlocks.find((block) => block?.id === 'cash_reserves');
    const calculatorCtaBlock = investmentBlocks.find((block) => block?.id === 'laddering');
    const testimonialsBlock = investmentBlocks.find((block) => block?.id === 'testimonials');
    const certificatesBlock = investmentBlocks.find((block) => block?.id === 'certificates');
    const ratesBlock = investmentBlocks.find((block) => block?.id === 'certificates_table');

    expect(certificatesBlock?.kind).toBe('card_grid');
    expect(certificatesBlock?.mode).toBe('dynamic');
    expect(certificatesBlock?.settings?.card1Title).toBe('Demand Certificates');
    expect(certificatesBlock?.settings?.card2Title).toBe('Term Certificates');
    expect(ratesBlock).toMatchObject({
      kind: 'rates',
      mode: 'dynamic',
    });
    expect(growthFeatureBlock?.kind).toBe('site_feature');
    expect(growthFeatureBlock?.settings?.featureId).toBe('investments_growth_feature');
    expect(ctaFormBlock?.kind).toBe('cta_form');
    expect(ctaFormBlock?.settings?.submitStyle).toBe('blue');
    expect(ctaFormBlock?.settings?.targetSectionKey).toBeUndefined();
    expect(ctaFormBlock?.settings?.targetSectionClassName).toBeUndefined();
    expect(ctaFormBlock?.settings?.targetSectionIndex).toBeUndefined();
    expect(featurePanelBlock?.kind).toBe('feature_panel');
    expect(featurePanelBlock?.presetId).toBeUndefined();
    expect(calculatorCtaBlock?.kind).toBe('calculator_cta');
    expect(calculatorCtaBlock?.presetId).toBeUndefined();
    expect(testimonialsBlock?.kind).toBe('testimonials');
    expect(testimonialsBlock?.settings?.targetSectionKey).toBeUndefined();
    expect(testimonialsBlock?.settings?.targetFineprintSectionKey).toBeUndefined();
    expect(testimonialsBlock?.settings?.targetSectionClassName).toBeUndefined();
    expect(testimonialsBlock?.settings?.targetSectionIndex).toBeUndefined();
  });

  it('keeps /rates and investments seeded on canonical rates identity without retired rates placeholders', () => {
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
    expect(investmentBlocks.find((block) => block?.id === 'certificates_table')).toMatchObject({
      kind: 'rates',
      mode: 'dynamic',
    });
    expect(ratesBlocks.some((block) => block?.kind === 'rates_table')).toBe(false);
    expect(investmentBlocks.some((block) => block?.id === 'rates_table')).toBe(false);
    expect(investmentBlocks.some((block) => block?.kind === 'rates_table')).toBe(false);
  });
});
