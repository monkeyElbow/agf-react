import { getSiteFeatureCatalogEntry } from './siteFeatureCatalog';

export const BLOCK_CATALOG_VISIBILITIES = Object.freeze([
  'standard',
  'contextual',
  'internal',
  'hidden',
]);

export const BLOCK_CATALOG_ARCHITECTURE_TYPES = Object.freeze([
  'standard-block',
  'preset',
  'site-feature',
  'functional-route',
  'migration-only',
]);

const STANDARD_BLOCK_KINDS = new Set([
  'billboard',
  'card_grid',
  'columns',
  'cta_band',
  'feature_panel',
  'intro',
  'legal_copy',
  'newsletter',
  'photo_column',
]);

const CONTEXTUAL_BLOCK_KINDS = new Set([
  'calculator_cta',
  'calculator_intro',
  'cta_form',
  'impact_stat',
  'request_form',
  'site_feature',
  'split_panel',
]);

const CONTEXTUAL_BLOCK_PAGE_FAMILIES = Object.freeze({
  calculator_cta: Object.freeze(['calculators', 'investments', 'retirement']),
  calculator_intro: Object.freeze(['calculators']),
  cta_form: Object.freeze(['insurance', 'investments', 'loans', 'planned-giving', 'retirement']),
  impact_stat: Object.freeze(['about', 'home']),
  request_form: Object.freeze(['insurance', 'loans', 'planned-giving', 'retirement']),
  split_panel: Object.freeze(['investments', 'planned-giving', 'retirement']),
});

const INTERNAL_BLOCK_KINDS = new Set([
  'calculator_widget',
  'hero',
  'hero_pie',
  'rates',
  'services_grid',
  'testimonials',
  'top_strip',
]);

const HIDDEN_BLOCK_KINDS = new Set(['content']);

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeList(values) {
  return Object.freeze(Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )));
}

export function getManagedPageFamily(pathname) {
  const path = String(pathname || '').trim().toLowerCase();
  if (path === '/') return 'home';
  if (path.startsWith('/services/loans')) return 'loans';
  if (path.startsWith('/services/investments')) return 'investments';
  if (path.startsWith('/services/retirement')) return 'retirement';
  if (path.startsWith('/services/planned-giving')) return 'planned-giving';
  if (path.startsWith('/services/insurance')) return 'insurance';
  if (path === '/services' || path.startsWith('/services/')) return 'services';
  if (path.startsWith('/about-us')) return 'about';
  if (path.startsWith('/calculators')) return 'calculators';
  return 'editorial';
}

function buildKindMetadata(kind) {
  const token = normalizeToken(kind);
  if (HIDDEN_BLOCK_KINDS.has(token)) {
    return {
      catalogVisibility: 'hidden',
      architectureType: 'migration-only',
      category: 'content',
      description: 'Legacy page-content compatibility type; use a standard editorial block instead.',
    };
  }
  if (INTERNAL_BLOCK_KINDS.has(token)) {
    return {
      catalogVisibility: 'internal',
      architectureType: token === 'hero' ? 'standard-block' : 'site-feature',
      category: token.includes('calculator') || token === 'rates' ? 'data' : 'specialized',
      description: 'Code-managed or route-owned block; available through existing page templates only.',
    };
  }
  if (CONTEXTUAL_BLOCK_KINDS.has(token)) {
    return {
      catalogVisibility: 'contextual',
      architectureType: token === 'site_feature' ? 'site-feature' : 'standard-block',
      category: token.includes('form') || token.includes('cta') ? 'conversion' : 'specialized',
      description: 'Available only on compatible page families.',
      allowedPageFamilies: CONTEXTUAL_BLOCK_PAGE_FAMILIES[token] || [],
    };
  }
  if (STANDARD_BLOCK_KINDS.has(token)) {
    return {
      catalogVisibility: 'standard',
      architectureType: ['card_grid', 'columns', 'cta_band'].includes(token) ? 'preset' : 'standard-block',
      category: ['cta_band', 'feature_panel'].includes(token) ? 'conversion' : 'content',
      description: 'Reusable content block.',
    };
  }
  return {
    catalogVisibility: 'hidden',
    architectureType: 'migration-only',
    category: 'specialized',
    description: 'Unclassified block; it must be classified before it can be added by admins.',
  };
}

function featureMetadata(template) {
  const featureId = String(template?.settings?.featureId || template?.featureId || '').trim();
  const feature = getSiteFeatureCatalogEntry(featureId);
  if (!feature) {
    return buildKindMetadata('site_feature');
  }
  return {
    catalogVisibility: feature.catalogVisibility || (feature.routeAllowlist?.length ? 'contextual' : 'hidden'),
    architectureType: 'site-feature',
    category: 'specialized',
    description: String(feature.description || '').trim() || 'Specialized site feature.',
    featureId,
    allowedRoutes: normalizeList(feature.routeAllowlist),
    allowedPageFamilies: normalizeList(feature.allowedPageFamilies),
  };
}

export function getBlockCatalogMetadata(template) {
  const base = String(template?.kind || '').trim().toLowerCase() === 'site_feature'
    ? featureMetadata(template)
    : buildKindMetadata(template?.kind);
  const presetId = String(template?.presetId || '').trim();
  return Object.freeze({
    ...base,
    kind: String(template?.kind || '').trim(),
    catalogVisibility: BLOCK_CATALOG_VISIBILITIES.includes(base.catalogVisibility)
      ? base.catalogVisibility
      : 'hidden',
    architectureType: BLOCK_CATALOG_ARCHITECTURE_TYPES.includes(base.architectureType)
      ? base.architectureType
      : 'migration-only',
    category: String(base.category || 'specialized').trim() || 'specialized',
    presetId,
    allowedRoutes: normalizeList(base.allowedRoutes),
    allowedPageFamilies: normalizeList(base.allowedPageFamilies),
  });
}

export function isBlockCatalogChoiceAllowed(template, { pathname = '', pageFamily = '' } = {}) {
  const metadata = getBlockCatalogMetadata(template);
  if (metadata.catalogVisibility === 'standard') {
    return true;
  }
  if (metadata.catalogVisibility !== 'contextual') {
    return false;
  }
  const route = String(pathname || '').trim();
  const family = String(pageFamily || '').trim() || getManagedPageFamily(route);
  if (metadata.allowedRoutes.length && !metadata.allowedRoutes.includes(route)) {
    return false;
  }
  if (metadata.allowedPageFamilies.length && !metadata.allowedPageFamilies.includes(family)) {
    return false;
  }
  if (metadata.kind === 'site_feature' && !metadata.allowedRoutes.length && !metadata.allowedPageFamilies.length) {
    return false;
  }
  return true;
}

export function getBlockCatalogKinds() {
  return Object.freeze([
    ...STANDARD_BLOCK_KINDS,
    ...CONTEXTUAL_BLOCK_KINDS,
    ...INTERNAL_BLOCK_KINDS,
    ...HIDDEN_BLOCK_KINDS,
  ]);
}
