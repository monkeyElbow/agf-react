/**
 * Runtime ownership map for managed content.
 *
 * Durable rule protected: every managed route/block family has one declared
 * authority or an explicit, testable selection rule.
 * Legitimate admin action still allowed: route-specific renderers and legacy
 * compatibility paths may remain when their condition and lifecycle status are
 * declared here.
 * Protected layer: route selection, content source selection, composition,
 * rendering, editor ownership, and CSS ownership.
 * Failure symptom: a plausible edit succeeds in code but another runtime path
 * supplies the browser output.
 * Proof method: registry validation plus the development runtime descriptor.
 * Retirement condition: remove an entry only after browser proof shows that no
 * active route selects the legacy path.
 */

const NATIVE_ROUTE = Object.freeze({
  routeOwner: 'NativeContentPage',
  sourceSelector: 'useManagedContentSource',
  composer: 'composeManagedPage',
  renderer: 'NativeContentPage.buildManagedBlockSection',
  editor: 'blockRegistry.getBlockDefinition',
  cssFamily: ['service-native.css', 'service-native-numbered-cards.css'],
  routeSpecificCssException: 'none declared; inspect computed winner before adding one',
  fallback: { status: 'legacy-retained', selectionRule: 'native sections without managed identity remain in native content' },
  authorityStatus: 'confirmed',
});

const PAGE_BLOCKS_ROUTE = Object.freeze({
  routeOwner: 'HomePage',
  sourceSelector: 'PageBlocksRenderer props.blocks',
  composer: 'composeManagedBlockOrder',
  renderer: 'PageBlocksRenderer.blockRenderers',
  editor: 'blockRegistry.getBlockDefinition',
  cssFamily: ['home-service-public.css', 'service-native.css', 'service-native-numbered-cards.css'],
  routeSpecificCssException: 'home-service-public.css owns home-native surfaces',
  fallback: { status: 'legacy-retained', selectionRule: 'HomePage native composition surrounds managed blocks' },
  authorityStatus: 'confirmed',
});

const ROUTE_FAMILIES = Object.freeze([
  Object.freeze({
    id: 'home',
    pathPattern: '^/$',
    ...PAGE_BLOCKS_ROUTE,
    notes: 'HomePage supplies the PageBlocksRenderer route and home-native composition.',
  }),
  Object.freeze({
    id: 'services',
    pathPattern: '^/services$',
    routeOwner: 'ServicesPage',
    sourceSelector: 'ServicesPage route-local managed block selection',
    composer: 'ServicesPage route-local section composition',
    renderer: 'ServicesPage dynamic builders',
    editor: 'blockRegistry.getBlockDefinition',
    cssFamily: ['service-native.css', 'home-service-public.css'],
    routeSpecificCssException: 'service-native.css route selectors for ServicesPage',
    fallback: { status: 'legacy-retained', selectionRule: 'ServicesPage native route content remains alongside managed blocks' },
    authorityStatus: 'confirmed',
    notes: 'This route does not use NativeContentPage for its primary sections.',
  }),
  Object.freeze({
    id: 'investments',
    pathPattern: '^/services/investments$',
    routeOwner: 'InvestmentsPage',
    sourceSelector: 'InvestmentsPage managed source plus PageBlocksRenderer sections',
    composer: 'InvestmentsPage route composition and PageBlocksRenderer',
    renderer: 'InvestmentsPage dynamic builders | PageBlocksRenderer',
    editor: 'blockRegistry.getBlockDefinition',
    cssFamily: ['service-native.css', 'home-service-public.css'],
    routeSpecificCssException: 'InvestmentsPage route sections and calculator styles',
    fallback: { status: 'legacy-retained', selectionRule: 'InvestmentsPage selects route-local sections when present' },
    authorityStatus: 'ambiguous',
    notes: 'Both route-local builders and PageBlocksRenderer participate under different sections.',
  }),
  Object.freeze({
    id: 'loans',
    pathPattern: '^/services/loans$',
    routeOwner: 'LoansPage',
    sourceSelector: 'LoansPage route-local managed block selection',
    composer: 'LoansPage route-local section composition',
    renderer: 'LoansPage dynamic builders | PageBlocksRenderer exported block components',
    editor: 'blockRegistry.getBlockDefinition',
    cssFamily: ['service-native.css', 'home-service-public.css'],
    routeSpecificCssException: 'LoansPage route-local service-native selectors',
    fallback: { status: 'legacy-retained', selectionRule: 'LoansPage local builders remain active for route sections' },
    authorityStatus: 'ambiguous',
    notes: 'LoansPage directly calls dynamic builders and imports renderer components.',
  }),
  Object.freeze({
    id: 'retirement',
    pathPattern: '^/services/retirement$',
    routeOwner: 'RetirementPage',
    sourceSelector: 'RetirementPage route-local managed block selection',
    composer: 'RetirementPage route-local section composition',
    renderer: 'RetirementPage dynamic builders',
    editor: 'blockRegistry.getBlockDefinition',
    cssFamily: ['service-native.css', 'service-native-numbered-cards.css'],
    routeSpecificCssException: 'RetirementPage route-local service-native selectors',
    fallback: { status: 'legacy-retained', selectionRule: 'RetirementPage local builders remain active for route sections' },
    authorityStatus: 'ambiguous',
    notes: 'RetirementPage owns the route and directly calls several dynamic builders.',
  }),
  Object.freeze({
    id: 'planned-giving',
    pathPattern: '^/services/planned-giving(?:/.*)?$',
    ...NATIVE_ROUTE,
    notes: 'Planned-giving product routes are managed by NativeContentPage.',
  }),
  Object.freeze({
    id: 'managed-native',
    pathPattern: '^/(?!admin(?:/|$)|services$|services/(?:investments|loans|retirement)$).*',
    ...NATIVE_ROUTE,
    notes: 'Fallback managed route family for registered content pages.',
  }),
]);

const SHARED_BLOCK_METADATA = {
  editor: 'blockRegistry.getBlockDefinition',
  cssFamily: ['service-native.css'],
  routeSpecificCssException: 'route-specific selectors may override shared family; verify computed winner',
  authorityStatus: 'confirmed',
};

const BLOCK_FAMILIES = Object.freeze([
  ['hero', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.HeroBlock', ['service-native.css', 'home-service-public.css']],
  ['billboard', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.BillboardBlock', ['service-native.css', 'home-service-public.css']],
  ['intro', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.IntroBlock', ['service-native.css', 'home-service-public.css']],
  ['card_grid', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.card_grid', ['service-native.css', 'home-service-public.css', 'service-native-numbered-cards.css']],
  ['card_chart', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.card_chart', ['service-native.css']],
  ['cta_form', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.CtaFormBlock', ['service-native.css']],
  ['request_form', 'NativeContentPage.buildManagedBlockSection | dynamic request renderer', ['service-native.css']],
  ['columns', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.ColumnsBlock', ['service-native.css']],
  ['split_panel', 'RetirementPage.buildDynamicSplitPanelFromBlock | legacy native sections', ['service-native.css']],
  ['top_strip', 'PageBlocksRenderer.TopStripBlock | legacy native sections', ['service-native.css']],
  ['content', 'NativeContentPage.buildManagedBlockSection', ['service-native.css']],
  ['support_library', 'NativeContentPage.buildManagedBlockSection', ['service-native.css']],
  ['feature_panel', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.FeaturePanelBlock', ['service-native.css', 'home-service-public.css']],
  ['site_feature', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.SiteFeatureBlock', ['service-native.css', 'home-service-public.css']],
  ['photo_column', 'dynamicPageBlocks.buildDynamicPhotoColumnFromBlock', ['service-native.css']],
  ['newsletter', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.NewsletterBlock', ['service-native.css']],
  ['testimonials', 'NativeContentPage.buildManagedBlockSection | PageBlocksRenderer.testimonials', ['service-native.css']],
  ['calculator_cta', 'InvestmentsPage dynamic builder | legacy native sections', ['service-native.css', 'service-native-calculators.css']],
  ['calculator_intro', 'NativeContentPage.buildManagedBlockSection', ['service-native.css', 'service-native-calculators.css']],
  ['calculator_widget', 'NativeContentPage.buildManagedBlockSection', ['service-native.css', 'service-native-calculators.css']],
  ['hero_pie', 'ServicesPage.buildDynamicHeroPieFromBlock', ['service-native.css']],
  ['impact_stat', 'PageBlocksRenderer.ImpactStatBlock | dynamic builder', ['service-native.css', 'home-service-public.css']],
  ['legal_copy', 'dynamicPageBlocks.buildDynamicLegalCopyFromBlock', ['service-native.css']],
  ['rates', 'InvestmentsPage.buildDynamicRatesFromBlock', ['service-native.css', 'service-native-calculators.css']],
  ['services_grid', 'dynamicPageBlocks.buildDynamicServicesGridFromBlock', ['service-native.css', 'home-service-public.css']],
]);

const BLOCK_FAMILY_ENTRIES = Object.freeze(BLOCK_FAMILIES.map(([kind, renderer, cssFamily]) => Object.freeze({
  kind,
  canonicalBlockIdPattern: `^${kind}(?:[-_].*)?$`,
  renderer,
  ...SHARED_BLOCK_METADATA,
  cssFamily,
  routeSpecificCssException: SHARED_BLOCK_METADATA.routeSpecificCssException,
  authorityStatus: renderer.includes('|') ? 'ambiguous' : 'confirmed',
  fallback: renderer.includes('|')
    ? { status: 'legacy-retained', selectionRule: 'route authority and block condition determine the active path' }
    : { status: 'none', selectionRule: 'canonical block renderer' },
})));

export const MANAGED_ROUTE_AUTHORITY_MANIFEST = Object.freeze({
  version: 1,
  routeFamilies: ROUTE_FAMILIES,
  blockFamilies: BLOCK_FAMILY_ENTRIES,
  selectionRules: Object.freeze([
    Object.freeze({
      id: 'custom-route-owner-wins',
      condition: 'exact route owner in App.jsx',
      authority: 'route family entry',
      note: 'Custom route pages take precedence over the generic NativeContentPage family.',
    }),
    Object.freeze({
      id: 'native-route-fallback',
      condition: 'no exact custom route owner',
      authority: 'managed-native route family',
      note: 'NativeContentPage is authoritative for registered managed pages.',
    }),
    Object.freeze({
      id: 'ambiguous-is-explicit',
      condition: 'more than one known runtime path participates',
      authority: 'ambiguous until browser descriptor identifies the winner',
      note: 'Ambiguity is recorded rather than silently treated as convergence.',
    }),
  ]),
});

function normalizePathname(pathname) {
  const value = String(pathname || '').trim();
  return value || '/';
}

export function getRouteAuthority(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  return MANAGED_ROUTE_AUTHORITY_MANIFEST.routeFamilies.find((entry) => (
    new RegExp(entry.pathPattern).test(normalizedPathname)
  )) || null;
}

export function getBlockAuthority(kind, pathname = '/') {
  const normalizedKind = String(kind || '').trim();
  const route = getRouteAuthority(pathname);
  const block = MANAGED_ROUTE_AUTHORITY_MANIFEST.blockFamilies.find((entry) => entry.kind === normalizedKind) || null;
  if (!route || !block) {
    return null;
  }
  const effectiveRenderer = route.routeOwner === 'NativeContentPage'
    ? 'NativeContentPage.buildManagedBlockSection'
    : route.routeOwner === 'HomePage'
      ? 'PageBlocksRenderer.blockRenderers'
      : route.renderer;
  const hasExplicitRouteSelection = route.routeOwner === 'NativeContentPage'
    || route.routeOwner === 'HomePage';
  return {
    route,
    block,
    renderer: effectiveRenderer,
    authorityStatus: route.authorityStatus === 'ambiguous' && !hasExplicitRouteSelection
      ? 'ambiguous'
      : 'confirmed',
  };
}

export function validateManagedRouteAuthorityManifest(registeredKinds = []) {
  const errors = [];
  const routeIds = new Set();
  MANAGED_ROUTE_AUTHORITY_MANIFEST.routeFamilies.forEach((entry) => {
    if (routeIds.has(entry.id)) errors.push(`duplicate route family: ${entry.id}`);
    routeIds.add(entry.id);
    if (!entry.routeOwner || !entry.sourceSelector || !entry.composer || !entry.renderer || !entry.editor || !entry.routeSpecificCssException || !entry.fallback) {
      errors.push(`incomplete route authority: ${entry.id}`);
    }
  });

  const manifestKinds = new Set(MANAGED_ROUTE_AUTHORITY_MANIFEST.blockFamilies.map((entry) => entry.kind));
  (Array.isArray(registeredKinds) ? registeredKinds : []).forEach((kind) => {
    if (!manifestKinds.has(kind)) errors.push(`registered managed block has no authority: ${kind}`);
  });
  MANAGED_ROUTE_AUTHORITY_MANIFEST.blockFamilies.forEach((entry) => {
    if (!entry.renderer || !entry.editor || !entry.cssFamily?.length || !entry.routeSpecificCssException || !entry.fallback) {
      errors.push(`incomplete block authority: ${entry.kind}`);
    }
  });

  return { ok: errors.length === 0, errors };
}

export function resolveManagedAuthority(pathname, kind) {
  return getBlockAuthority(kind, pathname);
}

export default MANAGED_ROUTE_AUTHORITY_MANIFEST;
