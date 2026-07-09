// Visibility flags on route metadata are the future target for admin page settings controls.
export const sitePages = [
  { path: '/', title: 'Home', section: 'Core', source: null },
  { path: '/services', title: 'Services', section: 'Services', source: null },
  { path: '/services/loans', title: 'Loans', section: 'Services', source: null },
  { path: '/services/loans/loan-consultants', title: 'Loan Consultants', section: 'Services', source: null },
  { path: '/services/investments', title: 'Investments', section: 'Services', source: null },
  { path: '/services/investments/invest-by-mail', title: 'Open an Investment by Mail', section: 'Investments', source: null },
  { path: '/services/retirement', title: 'Retirement', section: 'Services', source: null },
  { path: '/services/retirement/403b', title: '403(b)', section: 'Retirement', source: null },
  { path: '/services/retirement/403b/403b-terms-definitions', title: '403(b) Terms & Definitions', section: 'Retirement', source: null },
  { path: '/services/retirement/403b/403b-individual-enrollment', title: '403b Individual Enrollment', section: 'Retirement', source: null },
  {
    path: '/services/retirement/403b/403b-group-enrollment',
    title: '403b Group Enrollment',
    section: 'Retirement',
    source: null,
    linkRefAliases: [
      '/services/retirement/403b-for-groups/403b-group-enrollment',
      '/services/retirement/403b-for-groups',
    ],
  },
  { path: '/services/retirement/409a', title: '409A Deferred Compensation Plan', section: 'Retirement', source: null },
  { path: '/services/retirement/iras', title: 'IRAs', section: 'Retirement', source: null },
  { path: '/services/retirement/iras/fund-an-ira', title: 'Fund an IRA', section: 'Retirement', source: null },
  { path: '/services/retirement/retirement-consultants', title: 'Retirement Consultants', section: 'Retirement', source: null },
  { path: '/services/retirement/rollovers', title: 'Rollovers', section: 'Retirement', source: null },
  {
    path: '/services/planned-giving',
    title: 'Planned Giving',
    section: 'Services',
    source: null,
    linkRefAliases: ['/services/legacy-giving'],
  },
  {
    path: '/services/planned-giving/charitable-gift-annuities',
    title: 'Charitable Gift Annuities',
    section: 'Planned Giving',
    source: null,
    linkRefAliases: ['/services/legacy-giving/charitable-gift-annuities'],
  },
  {
    path: '/services/planned-giving/charitable-trusts',
    title: 'Charitable Trusts',
    section: 'Planned Giving',
    source: null,
    linkRefAliases: ['/services/legacy-giving/charitable-trusts'],
  },
  {
    path: '/services/planned-giving/endowments',
    title: 'Endowments',
    section: 'Planned Giving',
    source: null,
    linkRefAliases: ['/services/legacy-giving/endowments'],
  },
  {
    path: '/services/planned-giving/generosity-fund',
    title: 'Generosity Fund',
    section: 'Planned Giving',
    source: null,
    linkRefAliases: ['/services/legacy-giving/generosity-fund'],
  },
  {
    path: '/services/planned-giving/ministry-impact-fund',
    title: 'Ministry Impact Fund',
    section: 'Planned Giving',
    source: null,
    linkRefAliases: ['/services/legacy-giving/ministry-impact-fund'],
  },
  { path: '/services/insurance', title: 'Insurance', section: 'Services', source: null },
  { path: '/services/insurance/certificate-request', title: 'Certificate Request', section: 'Insurance', source: null },
  { path: '/services/insurance/group-term-life-insurance', title: 'Group term life insurance', section: 'Insurance', source: null },
  { path: '/services/insurance/life-insurance-quote', title: 'Life Insurance Quote', section: 'Insurance', source: null },
  { path: '/services/insurance/ministers-group-life-plan', title: 'Minister\'s Group Life Plan', section: 'Insurance', source: null },
  { path: '/services/insurance/mission-assure', title: 'Mission Assure', section: 'Insurance', source: null },
  { path: '/services/insurance/mission-assure/report-a-claim', title: 'Report a claim', section: 'Insurance', source: null },
  { path: '/services/insurance/property-casualty-insurance', title: 'Property & Casualty Insurance', section: 'Insurance', source: null },
  { path: '/about-us', title: 'About Us', section: 'Company', source: null },
  { path: '/about-us/careers', title: 'Careers', section: 'Company', source: null },
  { path: '/about-us/impact', title: 'Impact', section: 'Company', source: null },
  { path: '/brand', title: 'Brand', section: 'Company', source: null, hideFromSitemap: true, hideFromSearch: true },
  { path: '/resources', title: 'Resources', section: 'Resources', source: null },
  { path: '/calculators', title: 'Calculators', section: 'Resources', source: null },
  { path: '/forms', title: 'Forms', section: 'Resources', source: null },
  { path: '/calculators/emergency-fund', title: 'Emergency Fund Calculator', section: 'Resources', source: null, hideFromSitemap: true },
  { path: '/calculators/increased-contribution', title: 'Increased Contribution Calculator', section: 'Resources', source: null, hideFromSitemap: true },
  { path: '/calculators/net-worth', title: 'Net Worth Calculator', section: 'Resources', source: null, hideFromSitemap: true },
  { path: '/contact-us', title: 'Contact Us', section: 'Core', source: null },
  { path: '/online-contributions', title: 'Online Contributions', section: 'Core', source: null },
  { path: '/prospectus', title: 'Prospectus', section: 'Core', source: null },
  { path: '/rates', title: 'Rates', section: 'Core', source: null },
  { path: '/subscribe', title: 'Subscribe', section: 'Core', source: null },
  { path: '/search', title: 'Search', section: 'Core', source: null },
  { path: '/sitemap', title: 'Sitemap', section: 'Core', source: null, hideFromSitemap: true },
  { path: '/taxguide', title: 'Tax Guide', section: 'Resources', source: null, hideFromSitemap: true },
  { path: '/terms-of-service', title: 'Terms of Service', section: 'Legal', source: null },
  { path: '/privacy-policy', title: 'Privacy Policy', section: 'Legal', source: null },
  { path: '/accessibility', title: 'Accessibility', section: 'Legal', source: null },
  { path: '/vineyard', title: 'Vineyard', section: 'Core', source: null, hideFromSitemap: true },
  { path: '/yourplan', title: 'Your Plan', section: 'Core', source: null, hideFromSitemap: true },
  { path: '/test', title: 'Test', section: 'Core', source: null, hideFromSitemap: true },
  { path: '/admin/rates', title: 'Admin - Rates', section: 'Admin', source: null },
  { path: '/admin/content', title: 'Admin - Content', section: 'Admin', source: null },
  { path: '/admin/resources', title: 'Admin - Resources', section: 'Admin', source: null },
  { path: '/admin/media-audit', title: 'Admin - Media Audit', section: 'Admin', source: null },
  { path: '/admin/message', title: 'Admin - Message', section: 'Admin', source: null },
  { path: '/admin/consultants', title: 'Admin - Consultants', section: 'Admin', source: null },
  { path: '/admin/testimonials', title: 'Admin - Testimonials', section: 'Admin', source: null },
  { path: '/admin/disclosures', title: 'Admin - Disclosures', section: 'Admin', source: null },
  { path: '/admin/charts', title: 'Admin - Charts', section: 'Admin', source: null },
  { path: '/admin/documents', title: 'Admin - Documents', section: 'Admin', source: null },
  { path: '/admin/jobs', title: 'Admin - Jobs', section: 'Admin', source: null },
  { path: '/admin/redirects', title: 'Admin - Redirects', section: 'Admin', source: null },
  { path: '/admin/blocks', title: 'Admin - Blocks Audit', section: 'Admin', source: null },
];

export const pageByPath = Object.fromEntries(sitePages.map((page) => [page.path, page]));
export const pageLinkRefByPath = Object.fromEntries(
  sitePages.map((page) => [page.path, String(page.linkRef || page.path)]),
);

const pageRefPairs = [];
sitePages.forEach((page) => {
  const primaryRef = String(page.linkRef || page.path).trim();
  if (primaryRef) {
    pageRefPairs.push([primaryRef, page]);
  }
  const aliases = Array.isArray(page.linkRefAliases) ? page.linkRefAliases : [];
  aliases.forEach((alias) => {
    const key = String(alias || '').trim();
    if (key) {
      pageRefPairs.push([key, page]);
    }
  });
});

export const pageByLinkRef = Object.fromEntries(pageRefPairs);

export function isPageHiddenFromSitemap(page) {
  return Boolean(page?.hideFromSitemap);
}

export function isPageHiddenFromSearch(page) {
  return Boolean(page?.hideFromSearch || page?.hideFromSitemap);
}

export function toPageLinkRef(pageLike) {
  if (!pageLike || typeof pageLike !== 'object') {
    return '';
  }
  return String(pageLike.linkRef || pageLike.path || '').trim();
}

export function resolvePagePathFromRef(pageRef, fallbackPath = '') {
  const ref = String(pageRef || '').trim();
  if (ref && pageByLinkRef[ref]?.path) {
    return pageByLinkRef[ref].path;
  }

  const fallback = String(fallbackPath || '').trim();
  if (!fallback) {
    return '';
  }
  return fallback.startsWith('/') ? fallback : `/${fallback}`;
}

export const navSections = [
  {
    title: 'Services',
    rootPath: '/services',
    items: [
      { path: '/services/loans', label: 'Loans' },
      { path: '/services/investments', label: 'Investments' },
      { path: '/services/retirement', label: 'Retirement' },
      { path: '/services/planned-giving', label: 'Planned Giving' },
      { path: '/services/insurance', label: 'Insurance' },
    ],
  },
  {
    title: 'About',
    rootPath: '/about-us',
    items: [
      { path: '/about-us/careers', label: 'Careers' },
      { path: '/about-us/impact', label: 'Impact' },
    ],
  },
  {
    title: 'Resources',
    rootPath: '/resources',
    items: [
      { path: '/rates', label: 'Rates' },
      { path: '/calculators', label: 'Calculators' },
      { path: '/forms', label: 'Forms' },
      { path: '/sitemap', label: 'Sitemap' },
    ],
  },
];
