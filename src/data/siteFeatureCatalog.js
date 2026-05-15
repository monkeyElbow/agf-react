import aboutIntroImage from '../assets/about-intro.jpg';

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
      body: 'As an AGFinancial client, you are also our ministry ally. Together, we improve financial health while fueling Kingdom growth and support.',
      action: {
        label: 'Tell me more',
        to: '/about-us/impact',
        openInNewWindow: false,
      },
      metrics: Object.freeze([
        Object.freeze({ value: '$11 billion', label: 'assets under management', tone: 'mango' }),
        Object.freeze({ value: '1,583', label: 'ministries supported', tone: 'atlantean' }),
        Object.freeze({ value: '38,654', label: 'clients served', tone: 'sandstone' }),
      ]),
      imageUrl: '',
      imageAlt: '',
    }),
  }),
  Object.freeze({
    featureId: 'legacy_giving_stewardship_story',
    label: 'Legacy Giving stewardship story',
    description: 'Premium Legacy Giving story sequence with a static-safe fallback and a restrained desktop-only held stage.',
    runtimeKey: 'legacy_giving_stewardship_story',
    allowedEditableFieldIds: SITE_FEATURE_HEADLINE_ACTION_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/services/legacy-giving']),
    previewLabel: 'Legacy Giving stewardship story',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: 'Smart stewardship—for today and tomorrow.',
      beats: Object.freeze([
        'Receive payments for life.',
        'Transition out of appreciated assets',
        'Leave a legacy for family and ministry',
        'Smart stewardship—for today and tomorrow.',
      ]),
      action: {
        label: 'Learn more',
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
      metrics: Object.freeze([
        Object.freeze({
          value: '4,000',
          eyebrow: 'Loans',
          label: 'Churches and ministries fueled each year.',
          body: 'From first conversation to final funding, we help ministries move from idea to opening day with financing that understands church realities.',
          tone: 'atlantean',
          action: Object.freeze({
            label: 'Explore Loans',
            to: '/services/loans',
            openInNewWindow: false,
          }),
        }),
        Object.freeze({
          value: '$40 Million',
          eyebrow: 'Legacy Giving',
          label: 'Under trusted care for future ministry.',
          body: 'Legacy plans, charitable tools, and long-horizon stewardship are organized with the kind of discipline that lets generosity keep working for the Kingdom.',
          tone: 'mango',
          action: Object.freeze({
            label: 'Plan with us',
            to: '/services/legacy-giving',
            openInNewWindow: false,
          }),
        }),
        Object.freeze({
          value: '687',
          eyebrow: 'Insurance',
          label: 'Mission trips covered with protection in place.',
          body: 'Teams can travel, serve, and respond quickly because practical coverage is already handled before the wheels ever leave the runway.',
          tone: 'super-grey',
          action: Object.freeze({
            label: 'Cover your trip',
            to: '/services/insurance',
            openInNewWindow: false,
          }),
        }),
        Object.freeze({
          value: '299',
          eyebrow: 'Retirement',
          label: 'Ministers retired this year with AGFinancial.',
          body: 'Retirement planning that respects decades of calling and helps leaders step into the next season with structure, confidence, and care.',
          tone: 'atlantean-dark',
          action: Object.freeze({
            label: 'Start your plan',
            to: '/services/retirement',
            openInNewWindow: false,
          }),
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
