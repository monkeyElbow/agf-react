const BLOCK_ONLY_MANAGED_PAGE_PATHS = new Set([
  // Add paths here only after every visible section on that route is owned by explicit blocks.
  '/',
  '/services/retirement/403b',
  '/services/retirement/403b/403b-individual-enrollment',
  '/services/retirement/403b/403b-group-enrollment',
  '/services/retirement/403b/403b-terms-definitions',
  '/online-contributions',
  '/resources',
  '/calculators',
  '/calculators/emergency-fund',
  '/calculators/increased-contribution',
  '/calculators/net-worth',
  '/contact-us',
  '/about-us/impact',
  '/services',
  '/services/loans',
  '/services/retirement',
  '/services/retirement/409a',
  '/services/retirement/iras',
  '/services/retirement/iras/fund-an-ira',
  '/services/retirement/rollovers',
  '/services/retirement/retirement-consultants',
  '/services/loans/loan-consultants',
  '/services/investments',
  '/about-us',
  '/services/planned-giving',
  '/services/planned-giving/charitable-gift-annuities',
  '/services/planned-giving/charitable-trusts',
  '/services/planned-giving/endowments',
  '/services/planned-giving/generosity-fund',
  '/services/planned-giving/ministry-impact-fund',
  '/services/insurance',
  '/services/insurance/certificate-request',
  '/services/insurance/group-term-life-insurance',
  '/services/insurance/life-insurance-quote',
  '/services/insurance/ministers-group-life-plan',
  '/services/insurance/mission-assure',
  '/services/insurance/mission-assure/report-a-claim',
  '/services/insurance/property-casualty-insurance',
  '/accessibility',
  '/privacy-policy',
  '/subscribe',
  '/terms-of-service',
  '/vineyard',
  '/yourplan',
  '/services/investments/invest-by-mail',
]);

const BLOCKLESS_MANAGED_PAGE_PATHS = new Set([
  // Functional and specialized native routes whose visible UI is owned outside admin blocks.
  '/about-us/careers',
  '/forms',
  '/prospectus',
  '/search',
  '/sitemap',
]);

const SPECIAL_MANAGED_PAGE_CLASSIFICATIONS = Object.freeze({
  '/brand': 'functional-brand-kit',
  '/rates': 'functional-rates-admin',
  '/taxguide': 'legacy-page-content',
  '/test': 'development-sandbox',
});

function normalizeManagedPagePath(pathname) {
  return String(pathname || '').trim() || '/';
}

export function isBlockOnlyManagedPagePath(pathname) {
  return BLOCK_ONLY_MANAGED_PAGE_PATHS.has(normalizeManagedPagePath(pathname));
}

export function isBlocklessManagedPagePath(pathname) {
  return BLOCKLESS_MANAGED_PAGE_PATHS.has(normalizeManagedPagePath(pathname));
}

export function getSpecialManagedPageClassification(pathname) {
  return SPECIAL_MANAGED_PAGE_CLASSIFICATIONS[normalizeManagedPagePath(pathname)] || '';
}

export function toBlockOnlyManagedPageShell(content) {
  if (!content || typeof content !== 'object') {
    return {
      hero: null,
      intro: null,
      preIntroSections: [],
      sections: [],
      actions: [],
      forms: [],
    };
  }

  return {
    ...content,
    hero: null,
    intro: null,
    preIntroSections: [],
    sections: [],
    actions: [],
    forms: [],
  };
}

export {
  BLOCK_ONLY_MANAGED_PAGE_PATHS,
  BLOCKLESS_MANAGED_PAGE_PATHS,
  SPECIAL_MANAGED_PAGE_CLASSIFICATIONS,
};
