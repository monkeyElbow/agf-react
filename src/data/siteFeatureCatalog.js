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
    featureId: 'services_breakdown',
    label: 'Services breakdown',
    description: 'Services overview breakdown list with nested product links.',
    runtimeKey: 'services_breakdown',
    allowedEditableFieldIds: SITE_FEATURE_FEATURE_ONLY_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/services']),
    previewLabel: 'Services breakdown',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: 'What would you like to explore?',
      rows: Object.freeze([
        Object.freeze({
          slug: 'loans',
          title: 'Loans',
          path: '/services/loans',
          description: 'The right loan can change everything for your ministry. 100% customized. Every loan, from construction to lines of credit.',
          links: Object.freeze([
            Object.freeze({ label: 'Loan options', path: '/services/loans' }),
          ]),
        }),
        Object.freeze({
          slug: 'investments',
          title: 'Investments',
          path: '/services/investments',
          description: "It's much more than money. Your funds help churches reach their communities. Growth for you, growth for Kingdom.",
          links: Object.freeze([
            Object.freeze({ label: 'Rates', path: '/services/investments#rates' }),
            Object.freeze({ label: 'Demand Certificates', path: '/services/investments#certificates' }),
            Object.freeze({ label: 'Term Certificates', path: '/services/investments#certificates' }),
          ]),
        }),
        Object.freeze({
          slug: 'retirement',
          title: 'Retirement',
          path: '/services/retirement',
          description: 'Plan, contribute, and build for tomorrow. Options include screened investments, IRAs, and our very own MBA Income Fund.',
          links: Object.freeze([
            Object.freeze({ label: '403(b)', path: '/services/retirement/403b' }),
            Object.freeze({ label: 'IRAs', path: '/services/retirement/iras' }),
            Object.freeze({ label: '409A', path: '/services/retirement/409a' }),
          ]),
        }),
        Object.freeze({
          slug: 'planned-giving',
          title: 'Planned Giving',
          path: '/services/planned-giving',
          description: 'Legacy planning and charitable giving made easy. Tax savings and income generation options that benefit ministries, donors, and loved ones.',
          links: Object.freeze([
            Object.freeze({ label: 'Charitable Gift Annuities', path: '/services/planned-giving/charitable-gift-annuities' }),
            Object.freeze({ label: 'Charitable Trusts', path: '/services/planned-giving/charitable-trusts' }),
            Object.freeze({ label: 'Donor Advised Funds / Generosity Fund', path: '/services/planned-giving/generosity-fund' }),
            Object.freeze({ label: 'Endowments', path: '/services/planned-giving/endowments' }),
            Object.freeze({ label: 'Ministry Impact Fund®', path: '/services/planned-giving/ministry-impact-fund' }),
            Object.freeze({ label: 'Wills & Estate Services', path: '/services/planned-giving' }),
          ]),
        }),
        Object.freeze({
          slug: 'insurance',
          title: 'Insurance',
          path: '/services/insurance',
          description: 'Coverage built for churches, ministries and individuals to protect what’s most important.',
          links: Object.freeze([
            Object.freeze({ label: 'Property & Casualty', path: '/services/insurance/property-casualty-insurance' }),
            Object.freeze({ label: 'Group Life', path: '/services/insurance/group-term-life-insurance' }),
            Object.freeze({ label: 'Individual Life', path: '/services/insurance/life-insurance-quote' }),
            Object.freeze({ label: 'Mission Assure', path: '/services/insurance/mission-assure' }),
          ]),
        }),
      ]),
    }),
  }),
  Object.freeze({
    featureId: 'services_matters_band',
    label: 'Services matters band',
    description: 'Services overview impact CTA band.',
    runtimeKey: 'services_matters_band',
    allowedEditableFieldIds: SITE_FEATURE_BODY_ACTION_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/services']),
    previewLabel: 'Services matters band',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: 'What you do matters.',
      body: 'As an AGFinancial customer, your financial decisions fund real ministry work, transforming lives, including yours.',
      action: {
        label: "See what we're doing together",
        to: '/about-us/impact',
        openInNewWindow: false,
      },
    }),
  }),
  Object.freeze({
    featureId: 'retirement_plan_feature',
    label: 'Retirement plan feature',
    description: 'Retirement overview 403(b) plan feature using the shared growth-card presentation.',
    runtimeKey: 'retirement_plan_feature',
    allowedEditableFieldIds: SITE_FEATURE_BODY_ACTION_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/services/retirement']),
    previewLabel: 'Retirement plan feature',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      className: 'retirement-plan-feature',
      disableInvestorExitReveal: true,
      headlineLines: Object.freeze([
        Object.freeze([
          Object.freeze({ text: 'AGFinancial 403(b) Retirement Plan', className: 'is-white' }),
        ]),
      ]),
      panels: Object.freeze([
        Object.freeze({
          title: 'Smart benefits, strong advantages',
          tone: 'mango',
          surfaceTone: 'blue',
          body: 'The AGFinancial retirement plan is customized specifically for ministers and ministry or organization employees. This is a plan exempt from ERISA.',
        }),
        Object.freeze({
          kind: 'investor',
          title: 'Includes minister\'s housing allowance, and a variety of investment strategies.',
          surfaceTone: 'white',
        }),
      ]),
      action: Object.freeze({
        label: 'Explore the 403(b)',
        to: '/services/retirement/403b',
        className: 'service-native-btn retirement-plan-feature-action',
      }),
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
        'Transition out of appreciated assets.',
        'Receive payments for life.',
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
    featureId: 'about_history_feature',
    label: 'About history feature',
    description: 'About-page one-off history section using the value-card story presentation.',
    runtimeKey: 'about_history_feature',
    allowedEditableFieldIds: SITE_FEATURE_FEATURE_ONLY_EDITABLE_FIELD_IDS,
    routeAllowlist: Object.freeze(['/about-us']),
    previewLabel: 'About history feature',
    previewThumbnail: '',
    experimental: false,
    internalOnly: false,
    buildRuntime: () => ({
      title: '',
      body: '',
      cards: Object.freeze([
        Object.freeze({
          title: 'It started with live, working parts.',
          titleClassName: 'is-super-grey',
          panelTone: 'blue',
          body: 'AGFinancial grew out of something already alive and working. That’s a stupid sentence. This is all temporary, by the way.',
          cardClass: 'about-native-history-card about-native-history-card--origins',
        }),
        Object.freeze({
          title: 'Too many strong parts were still separate.',
          titleClassName: 'is-super-grey',
          panelTone: 'mango',
          body: 'For decades, the Assemblies of God General Council headquarters operated several independent financial departments: a ministers benefit association, a loan fund, and a foundation, among others. Each had its own leadership, its own church loan portfolio, its own operations, and its own strengths. However, operating separately naturally created consistency and efficiency challenges.',
          cardClass: 'about-native-history-card about-native-history-card--departments',
        }),
        Object.freeze({
          titleClassName: 'is-super-grey',
          panelTone: 'sand',
          title: '1998 gave the structure a new center.',
          body: 'In the mid-1990s, AG General Superintendent Thomas Trask recognized and championed an opportunity for these growing entities to transform into a unified, professional management group that could serve the church better, and with the same rigor expected in any financial arena. That vision gave rise to AG Financial Services Group (AGFSG), which officially launched operations on October 1, 1998.',
          cardClass: 'about-native-history-card about-native-history-card--launch',
        }),
        Object.freeze({
          title: 'The goal was simple: serve the church well.',
          titleClassName: 'is-super-grey',
          panelTone: 'white',
          body: 'From the beginning, the goal was simple: support the General Council and the local church through sound financial services. Not only because it made good business sense, but because it was the right stewardship of what had been entrusted to the ministry.',
          cardClass: 'about-native-history-card about-native-history-card--purpose',
        }),
        Object.freeze({
          title: 'The tools changed. The mission didn’t.',
          titleClassName: 'is-super-grey',
          panelTone: 'blue',
          body: 'In the years since, AGFinancial has grown steadily — adding investment management, real estate, and other capabilities — while staying anchored to that original purpose. The tools have evolved. The mission hasn’t.',
          cardClass: 'about-native-history-card about-native-history-card--growth',
        }),
        Object.freeze({
          title: 'That history is why the impact matters.',
          titleClassName: 'is-super-grey',
          panelTone: 'sand',
          body: 'Maybe after that, we send to the “impact” page to show why our work matters, and what sort of difference we’re making…via the button, of course.',
          cardClass: 'about-native-history-card about-native-history-card--impact',
        }),
      ]),
      action: Object.freeze({
        label: 'This is why we matter',
        to: '/about-us/impact',
        openInNewWindow: false,
      }),
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
