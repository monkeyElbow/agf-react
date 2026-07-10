import aboutIntroImage from '../assets/about-intro.jpg';
import { buildImpactProofStoryMetrics } from './impactProofStorySeed';

export const SITE_FEATURE_ACTION_FIELD_IDS = Object.freeze([
  'buttonLabel',
  'buttonUrl',
  'buttonPageRef',
  'buttonOpenInNewWindow',
]);

export const SITE_FEATURE_BASE_FIELD_IDS = Object.freeze([
  'featureId',
  'headline',
  'body',
]);

export const SITE_FEATURE_DEFAULT_EDITABLE_FIELD_IDS = Object.freeze([
  ...SITE_FEATURE_BASE_FIELD_IDS,
  ...SITE_FEATURE_ACTION_FIELD_IDS,
]);
export const SITE_FEATURE_MINIMAL_ACTION_EDITABLE_FIELD_IDS = Object.freeze([
  ...SITE_FEATURE_BASE_FIELD_IDS,
  'buttonLabel',
  'buttonUrl',
  'buttonPageRef',
]);
export const SITE_FEATURE_BODY_ACTION_EDITABLE_FIELD_IDS = Object.freeze([
  'featureId',
  'body',
  'buttonLabel',
  'buttonUrl',
  'buttonPageRef',
]);
export const SITE_FEATURE_HEADLINE_ACTION_EDITABLE_FIELD_IDS = Object.freeze([
  'featureId',
  'headline',
  'buttonLabel',
  'buttonUrl',
  'buttonPageRef',
]);
export const SITE_FEATURE_BODY_ONLY_ACTION_EDITABLE_FIELD_IDS = Object.freeze([
  'featureId',
  'body',
  'buttonLabel',
  'buttonUrl',
  'buttonPageRef',
  'buttonOpenInNewWindow',
]);
export const SITE_FEATURE_FEATURE_ONLY_EDITABLE_FIELD_IDS = Object.freeze([
  'featureId',
]);

const SITE_FEATURE_CATALOG = Object.freeze([
  Object.freeze({
    featureId: 'editorial_spotlight',
    label: 'Editorial spotlight',
    description: 'Code-managed editorial placeholder for future art-directed storytelling moments.',
    runtimeKey: 'editorial_spotlight',
    allowedEditableFieldIds: SITE_FEATURE_DEFAULT_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze([]),
    previewLabel: 'Editorial spotlight',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: 'Steady stories deserve careful presentation.',
      body: 'Use this slot for art-directed AGFinancial storytelling moments. Layout and motion stay in code so the experience remains consistent.',
      imageUrl: aboutIntroImage,
      imageAlt: 'AGFinancial editorial feature placeholder',
      action: null,
    }),
  }),
  Object.freeze({
    featureId: 'home_services_feature_animation',
    label: 'Home services feature animation',
    description: 'Home-only animated services stack that replaces the static card grid while keeping that grid available as fallback.',
    runtimeKey: 'home_services_feature_animation',
    allowedEditableFieldIds: SITE_FEATURE_FEATURE_ONLY_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/']),
    previewLabel: 'Home services feature animation',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: 'Bold, smart steps.\nTogether.',
      panels: Object.freeze([
        Object.freeze({
          title: 'Loans',
          body: 'The right loan for your ministry can change everything.\nLet’s find yours.',
          tone: 'atlantean',
          action: Object.freeze({
            label: 'Explore options',
            to: '/services/loans',
            openInNewWindow: false,
          }),
        }),
        Object.freeze({
          title: 'Investments',
          body: 'Your returns grow while supporting ministries.\nToday’s investment. Tomorrow’s church.',
          tone: 'atlantean-dark',
          action: Object.freeze({
            label: 'See rates',
            to: '/services/investments',
            openInNewWindow: false,
          }),
        }),
        Object.freeze({
          title: 'Retirement',
          body: 'Time is your ally. Plan, contribute, and build for tomorrow. Starting today.',
          tone: 'investments-blue',
          action: Object.freeze({
            label: 'Get started',
            to: '/services/retirement',
            openInNewWindow: false,
          }),
        }),
        Object.freeze({
          title: 'Planned Giving',
          body: 'Generosity and legacy planning, simple and joyful.\nMake a difference that lasts for generations.',
          tone: 'legacy-warm',
          action: Object.freeze({
            label: 'Learn & strategize',
            to: '/services/planned-giving',
            openInNewWindow: false,
          }),
        }),
        Object.freeze({
          title: 'Insurance',
          body: 'The right coverage means protection, security, and confidence.',
          tone: 'super-grey',
          action: Object.freeze({
            label: 'Start here',
            to: '/services/insurance',
            openInNewWindow: false,
          }),
        }),
      ]),
    }),
  }),
  Object.freeze({
    featureId: 'home_impact_story',
    label: 'Home impact story',
    description: 'Premium home-page impact story with a shared static fallback and a restrained desktop-only pinned enhancement.',
    runtimeKey: 'home_impact_story',
    allowedEditableFieldIds: SITE_FEATURE_MINIMAL_ACTION_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/']),
    previewLabel: 'Home impact story',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: 'What you do here matters.',
      body: 'Your financial decisions can strengthen more than just your future.',
      action: {
        label: "See what we're doing",
        to: '/about-us/impact',
        openInNewWindow: false,
      },
      metrics: Object.freeze([
        Object.freeze({ value: '1,400+', label: 'ministries served by loans', tone: 'sandstone', valueTone: 'white' }),
        Object.freeze({ value: '29,000+', label: 'retirements planned', tone: 'sandstone' }),
        Object.freeze({ value: '$450 million', label: 'distributed to ministries through AG Foundation', tone: 'sandstone', valueTone: 'mango' }),
      ]),
      imageUrl: '',
      imageAlt: '',
    }),
  }),
  Object.freeze({
    featureId: 'legacy_giving_stewardship_story',
    label: 'Planned Giving stewardship story',
    description: 'Premium Planned Giving story sequence with a static-safe fallback and a restrained desktop-only held stage.',
    runtimeKey: 'legacy_giving_stewardship_story',
    allowedEditableFieldIds: SITE_FEATURE_HEADLINE_ACTION_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/services/planned-giving']),
    previewLabel: 'Planned Giving stewardship story',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: 'Smart stewardship for today and tomorrow.',
      beats: Object.freeze([
        'Receive payments for life.',
        'Transition out of appreciated assets.',
        'Leave a legacy for family and ministry.',
        'Smart stewardship for today and tomorrow.',
      ]),
      action: {
        label: 'Compare charitable giving ideas',
        to: '#charitable-giving-plan-comparison',
        openInNewWindow: false,
      },
    }),
  }),
  Object.freeze({
    featureId: 'impact_proof_story',
    label: 'Impact proof story',
    description: 'Code-owned Impact proof story with an editorial proof stack and a narrow, reviewed edit surface.',
    runtimeKey: 'impact_proof_story',
    allowedEditableFieldIds: SITE_FEATURE_BODY_ACTION_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/about-us/impact']),
    previewLabel: 'Impact proof story',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: '',
      body: '',
      action: null,
      metrics: buildImpactProofStoryMetrics(),
    }),
  }),
  Object.freeze({
    featureId: 'investments_growth_feature',
    label: 'Investments growth feature',
    description: 'Investments-only scroll feature with the final investor dashboard panel embedded as the last card.',
    runtimeKey: 'investments_growth_feature',
    allowedEditableFieldIds: SITE_FEATURE_BODY_ONLY_ACTION_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/services/investments']),
    previewLabel: 'Investments growth feature',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: 'Build financial health.',
      body: 'Log in to manage.',
      billboardBodyHtml: '',
      action: {
        label: 'Go to my dashboard',
        href: 'https://secure.agfinancial.org/',
        openInNewWindow: true,
      },
      headlineLines: Object.freeze([
        Object.freeze([
          Object.freeze({ text: 'Build ', className: 'is-atlantean' }),
          Object.freeze({ text: 'financial health.', className: 'is-super-grey' }),
        ]),
      ]),
      panels: Object.freeze([
        Object.freeze({
          title: 'Grow your return.',
          tone: 'atlantean',
          surfaceTone: 'blue',
          body: 'Financial growth. Lasting impact. Your money works hard for both your future and the church.',
        }),
        Object.freeze({
          title: 'Grow your backup plan.',
          tone: 'mango',
          surfaceTone: 'mango',
          body: "Your church's emergency funds should build the Kingdom while preparing for the unexpected.",
        }),
        Object.freeze({
          title: 'Grow the Kingdom.',
          tone: 'sandstone',
          surfaceTone: 'blue',
          body: "Every dollar helps provide loans to churches and ministries. Today's investment is tomorrow's church.",
        }),
        Object.freeze({
          kind: 'investor',
          title: 'Already an investor?',
          surfaceTone: 'white',
        }),
      ]),
    }),
  }),
]);

const SITE_FEATURE_CATALOG_BY_ID = Object.freeze(
  Object.fromEntries(SITE_FEATURE_CATALOG.map((entry) => [entry.featureId, entry])),
);

export function getSiteFeatureCatalog() {
  return SITE_FEATURE_CATALOG;
}

export function getDefaultSiteFeatureCatalogEntry() {
  return SITE_FEATURE_CATALOG[0] || null;
}

export function getSiteFeatureCatalogEntry(featureId) {
  const token = String(featureId || '').trim();
  if (!token) {
    return null;
  }
  return SITE_FEATURE_CATALOG_BY_ID[token] || null;
}

export function resolveSiteFeatureCatalogEntry(featureId) {
  return getSiteFeatureCatalogEntry(featureId) || getDefaultSiteFeatureCatalogEntry();
}

export function getSiteFeatureOptions() {
  return SITE_FEATURE_CATALOG.map((entry) => ({
    value: entry.featureId,
    label: entry.label,
  }));
}

export function getAllowedSiteFeatureEditableFieldIds(featureId) {
  return resolveSiteFeatureCatalogEntry(featureId)?.allowedEditableFieldIds || SITE_FEATURE_DEFAULT_EDITABLE_FIELD_IDS;
}
