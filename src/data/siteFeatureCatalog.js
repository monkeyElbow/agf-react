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
