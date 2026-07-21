export const READABILITY_LARGE_FILE_LINE_THRESHOLD = 2000;

export const SYSTEM_READABILITY_BOUNDARIES = Object.freeze([
  {
    file: 'src/styles/service-native.css',
    owner: 'shared block surfaces, site features, and functional route shell styles',
    currentBoundary: 'single global service-native stylesheet',
    nextSplit: 'split into block-surface CSS, named site-feature CSS, and functional-route shell CSS',
    pass: 'Pass 5',
  },
  {
    file: 'src/styles.css',
    owner: 'global application styles, admin styles, and shared base styles',
    currentBoundary: 'single global stylesheet imported by the app',
    nextSplit: 'split admin CSS, global base CSS, and app shell utilities after service-native ownership is reduced',
    pass: 'Pass 5',
  },
  {
    file: 'src/styles/home-native.css',
    owner: 'home page native styles and home-specific block surfaces',
    currentBoundary: 'single home native stylesheet',
    nextSplit: 'split reusable home block surfaces from one-off home route choreography',
    pass: 'Pass 5',
  },
  {
    file: 'src/data/contentBlockBlueprints.js',
    owner: 'managed content inventory and block blueprint factories',
    currentBoundary: 'single exported managed inventory',
    nextSplit: 'split route-family blueprint modules while keeping one exported inventory',
    pass: 'Pass 5',
  },
  {
    file: 'src/components/block-editors/migratedBlockEditors.jsx',
    owner: 'admin block editor surfaces',
    currentBoundary: 'single editor registry implementation',
    nextSplit: 'split editor families to match block registry kinds',
    pass: 'Pass 5',
  },
  {
    file: 'src/components/NativeContentPage.jsx',
    owner: 'native page shell, block mounting, and functional route adapters',
    currentBoundary: 'shared shell and functional route rendering in one component',
    nextSplit: 'separate block page shell from calculators/forms/widgets and functional page adapters',
    pass: 'Pass 5',
  },
  {
    file: 'src/components/blocks/PageBlocksRenderer.jsx',
    owner: 'shared dynamic block rendering and per-kind runtime view adapters',
    currentBoundary: 'single renderer for all dynamic block kinds',
    nextSplit: 'split renderer families by block registry kind after runtime contracts are generated',
    pass: 'Pass 5',
  },
  {
    file: 'src/context/ContentAdminContext.jsx',
    owner: 'content admin state, migrations, collaboration, drafts, and shared authority operations',
    currentBoundary: 'single provider with named migration adapter inventory',
    nextSplit: 'split normalization, migration adapters, shared authority, local drafts, revision restore, and block operations',
    pass: 'Pass 5',
  },
  {
    file: 'src/pages/AdminContentPage.jsx',
    owner: 'content admin route UI, block panels, save bar, and revision controls',
    currentBoundary: 'single admin content page surface',
    nextSplit: 'split page picker, block inspector/editor shell, save/publish bar, history drawer, and recovery actions',
    pass: 'Pass 5',
  },
  {
    file: 'src/lib/dynamicPageBlocks.js',
    owner: 'dynamic block runtime builders',
    currentBoundary: 'single runtime builder module for all migrated block kinds',
    nextSplit: 'split by block family after schema and editor parity contracts are stable',
    pass: 'Pass 5',
  },
  {
    file: 'src/pages/InvestmentsPage.jsx',
    owner: 'investments root product route and custom dynamic block rendering',
    currentBoundary: 'root product page with route-local calculator, rates, HUD, and block rendering',
    nextSplit: 'separate calculator/rates widgets from route shell or move simple blocks behind the common renderer',
    pass: 'Pass 5',
  },
  {
    file: 'src/pages/RetirementPage.jsx',
    owner: 'retirement root product route and custom dynamic block rendering',
    currentBoundary: 'root product page with route-local calculators, HUD, and block rendering',
    nextSplit: 'separate calculator widgets from route shell or move simple blocks behind the common renderer',
    pass: 'Pass 5',
  },
]);

export const SYSTEM_VISUAL_ACCESSIBILITY_GATES = Object.freeze([
  {
    id: 'static-native-content-accessibility',
    status: 'covered',
    command: 'vitest run src/data/nativePageContent.accessibility.test.js',
    scope: 'static native content heading/link/accessibility structure',
    pass: 'Pass 6',
  },
  {
    id: 'browser-admin-smoke',
    status: 'tooling-needed',
    command: '',
    scope: 'admin route selection, block edit, save, publish, reload, restore, and takeover in a real browser',
    pass: 'Pass 6',
  },
  {
    id: 'visual-regression',
    status: 'tooling-needed',
    command: '',
    scope: 'desktop/tablet/mobile screenshots for high-value managed pages',
    pass: 'Pass 6',
  },
  {
    id: 'keyboard-and-a11y-smoke',
    status: 'tooling-needed',
    command: '',
    scope: 'HUD controls, admin panels, mobile nav, forms, focus order, labels, and error announcements',
    pass: 'Pass 6',
  },
]);

export const SYSTEM_2_0_READINESS_TARGETS = Object.freeze([
  {
    id: 'forms-canonical-array-schema',
    status: 'partially-complete',
    currentAdapter: 'canonical CTA fieldsJson arrays with guarded slot compatibility fields',
    retireWhen: 'form settings use canonical arrays plus endpoint-specific serializers',
    pass: 'Pass 7',
  },
  {
    id: 'links-canonical-object',
    status: 'partially-complete',
    currentAdapter: 'canonical LinkJson snapshot storage and editor controls with guarded split-field import/render compatibility',
    retireWhen: 'route blueprints, seed defaults, and runtime renderers no longer carry split URL/PageRef/OpenInNewWindow compatibility fields',
    pass: 'Pass 7',
  },
  {
    id: 'special-route-brand',
    route: '/brand',
    status: 'classified-special',
    currentAdapter: 'functional-brand-kit',
    retireWhen: 'route is intentionally retained as functional or migrated to explicit blocks',
    pass: 'Pass 7',
  },
  {
    id: 'special-route-taxguide',
    route: '/taxguide',
    status: 'classified-special',
    currentAdapter: 'legacy-page-content',
    retireWhen: 'route is intentionally retained, migrated to blocks, or retired',
    pass: 'Pass 7',
  },
  {
    id: 'special-route-rates',
    route: '/rates',
    status: 'classified-special',
    currentAdapter: 'functional-rates-admin',
    retireWhen: 'rates route ownership remains functional or moves behind explicit block contracts',
    pass: 'Pass 7',
  },
  {
    id: 'special-route-test',
    route: '/test',
    status: 'classified-special',
    currentAdapter: 'development-sandbox',
    retireWhen: 'sandbox route is removed from production assumptions or kept as documented dev-only surface',
    pass: 'Pass 7',
  },
  {
    id: 'admin-blocks-diagnostics',
    route: '/admin/blocks',
    status: 'snapshot-health-diagnostic',
    currentAdapter: 'snapshot residue audit surface',
    retireWhen: 'kept as a permanent health dashboard or removed after snapshot recovery is observable elsewhere',
    pass: 'Pass 7',
  },
]);

export function getReadabilityBoundaryForFile(file) {
  const normalizedFile = String(file || '').trim();
  return SYSTEM_READABILITY_BOUNDARIES.find((entry) => entry.file === normalizedFile) || null;
}

export function getSystemReadinessInventory() {
  return {
    largeFileLineThreshold: READABILITY_LARGE_FILE_LINE_THRESHOLD,
    readabilityBoundaries: SYSTEM_READABILITY_BOUNDARIES,
    visualAccessibilityGates: SYSTEM_VISUAL_ACCESSIBILITY_GATES,
    readinessTargets2_0: SYSTEM_2_0_READINESS_TARGETS,
  };
}
