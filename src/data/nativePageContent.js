import ministersHousingImage from '../assets/ministers-housing.jpg';
import { formsLibraryLinks } from './formsLibraryLinks';
import {
  DEFAULT_PHONE_PLACEHOLDER,
} from './ctaFormSeeds';

const TAX_GUIDE_ACCESS_EMAIL = 'info@agfinancial.org';
const RETIREMENT_403B_PLAN_SUMMARY_URL = 'https://files.agfinancial.org/Retirement/Plansummary.pdf';
const RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_FORM_URL = 'https://files.agfinancial.org/retirement/403b-Enrollment-Form.pdf';
const RETIREMENT_403B_PAYROLL_DEDUCTION_FORM_URL = 'https://files.agfinancial.org/retirement/Payroll-Deduction-Form.pdf';
const RETIREMENT_403B_QCCO_AGREEMENT_URL = 'https://files.agfinancial.org/Retirement/QCCO%20403(b)%20Adoption%20and%20Service%20Agreement.pdf';
const RETIREMENT_403B_NQCCO_AGREEMENT_URL = 'https://files.agfinancial.org/Retirement/NQCCO%20403(b)%20Adoption%20and%20Service%20Agreement.pdf';
const RETIREMENT_403B_QCCO_GUIDELINES_URL = 'https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf';
const RETIREMENT_403B_NQCCO_GUIDELINES_URL = 'https://files.agfinancial.org/retirement/NQCCO-Guidelines.pdf';
const RETIREMENT_SECURE_UPLOAD_URL = 'https://sft.agfinancial.org/documents/Send.do';
const RETIREMENT_403B_PLAN_FEATURE_CARDS = [
  {
    title: 'MBA Income Fund',
    titleClassName: 'is-atlantean',
    body: 'The AGFinancial flagship fixed income investment option provides a fixed rate of return, and helps build churches and ministry facilities.',
  },
  {
    title: 'Screened Investments',
    titleClassName: 'is-mango',
    body: 'This unique investment option ensures the securities you own are aligned with biblical ethical standards.',
  },
  {
    title: 'Faith-Based Investments',
    titleClassName: 'is-super-grey',
    body: 'Our values, beliefs about stewardship, and our mission are the same as yours.',
  },
  {
    title: 'Roth / Pretax Deferrals',
    titleClassName: 'is-atlantean',
    body: 'This option allows taxes to be paid on the contribution now, in order to provide tax-free withdrawals at retirement.',
  },
  {
    title: 'Rollovers',
    titleClassName: 'is-mango',
    body: 'Retirement savings can be simplified by consolidating other retirement accounts into a single 403(b).',
  },
  {
    title: 'Variety',
    titleClassName: 'is-super-grey',
    body: 'Investment options include low-cost index funds, actively-managed funds, risk-based and target-date strategies, and individual funds.',
  },
  {
    title: 'Your Own Consultant',
    titleClassName: 'is-atlantean',
    body: 'Our regional consultants are available to answer your questions, help customize your plan, and assist you with implementation.',
  },
  {
    title: 'Education',
    titleClassName: 'is-mango',
    body: 'Onsite education for your participants is available, and includes retirement trends, IRS regulations, and customized action plans.',
  },
];

function buildCalculatorTeamFormSection(body) {
  return {
    className: 'calculator-tool-shell calculator-tool-contact',
    copyWrap: true,
    title: 'Talk with our team.',
    body: [body],
    form: {
      fields: [
        { id: 'name', label: 'Name*', type: 'text', required: true },
        { id: 'email', label: 'Email*', type: 'email', required: true },
        { id: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: DEFAULT_PHONE_PLACEHOLDER },
        { id: 'message', label: 'Message', type: 'textarea', required: false, rows: 4 },
      ],
      submitLabel: 'Submit',
    },
  };
}

export function getNativePageContent(path, title) {
  const direct = directContent[path];
  if (direct) {
    return direct;
  }

  if (path.startsWith('/services/loans/')) {
    return loansChildPages[path] || serviceChildContent(title, '/services/loans', [
      { label: 'Loans overview', to: '/services/loans' },
      { label: 'Loan Consultants', to: '/services/loans/loan-consultants' },
    ]);
  }

  if (path.startsWith('/services/insurance/')) {
    return insuranceChildPages[path] || serviceChildContent(title, '/services/insurance', [
      { label: 'Insurance overview', to: '/services/insurance' },
      { label: 'Group term life insurance', to: '/services/insurance/group-term-life-insurance' },
      { label: 'Mission Assure', to: '/services/insurance/mission-assure' },
      { label: 'Contact insurance team', to: '/contact-us' },
    ]);
  }

  if (path.startsWith('/services/planned-giving/')) {
    return legacyChildPages[path] || serviceChildContent(title, '/services/planned-giving', [
      { label: 'Planned Giving overview', to: '/services/planned-giving' },
      { label: 'Charitable Gift Annuities', to: '/services/planned-giving/charitable-gift-annuities' },
      { label: 'Charitable Trusts', to: '/services/planned-giving/charitable-trusts' },
      { label: 'Talk with a specialist', to: '/contact-us' },
    ]);
  }

  if (path.startsWith('/services/investments/')) {
    return investmentsChildPages[path] || serviceChildContent(title, '/services/investments', [
      { label: 'Investments overview', to: '/services/investments' },
      { label: 'Open an Investment by Mail', to: '/services/investments/invest-by-mail' },
      { label: 'Rates', to: '/rates' },
      { label: 'Prospectus', to: '/prospectus' },
    ]);
  }

  if (path.startsWith('/services/retirement/')) {
    return retirementChildPages[path] || serviceChildContent(title, '/services/retirement', [
      { label: 'Retirement overview', to: '/services/retirement' },
      { label: '403(b)', to: '/services/retirement/403b' },
      { label: 'IRAs', to: '/services/retirement/iras' },
      { label: 'Retirement consultants', to: '/services/retirement/retirement-consultants' },
    ]);
  }

  if (path.startsWith('/services/')) {
    return serviceChildContent(title, '/services', [
      { label: 'Loans', to: '/services/loans' },
      { label: 'Investments', to: '/services/investments' },
      { label: 'Retirement', to: '/services/retirement' },
      { label: 'Insurance', to: '/services/insurance' },
      { label: 'Planned Giving', to: '/services/planned-giving' },
    ]);
  }

  if (path.startsWith('/about-us/')) {
    return companyChildContent(path, title);
  }

  return {
    compact: true,
    hero: { title, highlight: null },
    intro: 'This page is available in native React while we finish final saved-page content parity.',
    sections: [
      {
        title: 'Quick links',
        body: [
          'Core routing, performance, and design tokens are now native.',
          'Use the links below to continue to active service pages.',
        ],
        links: [
          { label: 'Services', to: '/services' },
          { label: 'Contact us', to: '/contact-us' },
        ],
      },
    ],
    actions: [{ label: 'Back to services', to: '/services' }, { label: 'Contact us', to: '/contact-us', ghost: true }],
  };
}

const directContent = {
  '/services/loans': {
    pageClass: 'loans-native-page native-info-page--loans',
  },

  '/services': {
    pageClass: 'services-native-page',
  },

  '/services/investments': {
    pageClass: 'investments-native-page',
  },

  '/services/retirement': {
    pageClass: 'retirement-native-page',
  },

  '/services/insurance': {
    pageClass: 'native-info-page--insurance',
  },

  '/services/planned-giving': {
    pageClass: 'native-info-page--legacy-giving',
    compact: true,
  },

  '/about-us': {
    pageClass: 'native-info-page--about',
    compact: true,
    hideHero: true,
  },

  '/resources': {
    compact: true,
  },

  '/calculators': {
    pageClass: 'native-info-page--calculators',
    compact: true,
  },

  '/calculators/emergency-fund': {
    pageClass: 'native-info-page--calculator-tool',
    compact: true,
    hero: {
      title: 'Emergency Fund Calculator',
      highlight: null,
      titleSizeRem: 4.5,
      lineHeight: 0.94,
      titleLetterSpacingEm: -0.03,
    },
    hideIntro: true,
    sections: [
      {
        className: 'calculator-tool-shell',
        copyWrap: true,
        title: 'Build a cash cushion with a target in mind.',
        body: [
          'Use a monthly expense total or itemize your spending to estimate your emergency fund goal and see a simple savings plan to reach it.',
        ],
      },
      {
        className: 'calculator-tool-shell calculator-tool-widget',
        hideTitle: true,
        widget: 'emergency-fund-calculator',
      },
      buildCalculatorTeamFormSection(
        'Share a few details if you would like help talking through your reserve target and next step.',
      ),
    ],
    actions: [],
  },

  '/calculators/increased-contribution': {
    pageClass: 'native-info-page--calculator-tool native-info-page--calculator-increased-contribution',
    compact: true,
    hero: {
      title: 'Increased Contribution Calculator',
      highlight: null,
      titleSizeRem: 4.5,
      lineHeight: 0.94,
      titleLetterSpacingEm: -0.03,
    },
    hideIntro: true,
    sections: [
      {
        className: 'calculator-tool-shell',
        copyWrap: true,
        title: 'See the impact of a higher contribution rate.',
        body: [
          'Compare your current and proposed contribution percentages to estimate how a change today may affect your retirement balance over time.',
        ],
      },
      {
        className: 'calculator-tool-shell calculator-tool-widget',
        hideTitle: true,
        widget: 'increased-contribution-calculator',
      },
      buildCalculatorTeamFormSection(
        'Share a few details if you would like to talk through contribution options and retirement next steps.',
      ),
    ],
    actions: [],
  },

  '/calculators/net-worth': {
    pageClass: 'native-info-page--calculator-tool',
    compact: true,
    hero: {
      title: 'Net Worth Calculator',
      highlight: null,
      titleSizeRem: 4.5,
      lineHeight: 0.94,
      titleLetterSpacingEm: -0.03,
    },
    hideIntro: true,
    sections: [
      {
        className: 'calculator-tool-shell',
        copyWrap: true,
        title: 'Take inventory of your financial picture.',
        body: [
          'In order to get where you want to go, you need to know where you are. You can get a view of your financial position by generating a personal net worth statement.',
          'Over time your net worth will change as your assets earn interest or are depleted and your liabilities increase or decrease. Use this calculator to estimate what your net worth could be in the future based on specified growth rates.',
        ],
      },
      {
        className: 'calculator-tool-shell calculator-tool-widget',
        hideTitle: true,
        widget: 'net-worth-calculator',
      },
      buildCalculatorTeamFormSection(
        'Share a few details if you would like help reviewing your balance sheet and planning next steps.',
      ),
    ],
    actions: [],
  },

  '/contact-us': {
    pageClass: 'native-info-page--contact-us',
  },

  '/online-contributions': {
    pageClass: 'native-info-page--online-contributions',
    compact: true,
  },

  '/prospectus': {
    pageClass: 'native-info-page--prospectus',
    compact: true,
    hero: { title: 'Prospectus', highlight: null },
    intro: 'Reference prospectus and investment documents.',
    hideIntro: true,
    sections: [
      {
        className: 'native-prospectus-docs',
        title: 'Documents',
        links: [
          { label: 'Steward Funds Prospectus', documentId: 'prospectus-prospectus-steward-funds-prospectus' },
          { label: 'Fidelity Asset Manager® Prospectus', documentId: 'prospectus-prospectus-fidelity-asset-manager-prospectus' },
          { label: 'Fidelity® 500 Prospectus', documentId: 'prospectus-prospectus-fidelity-500-prospectus' },
          { label: 'Fidelity® Small Cap Prospectus', documentId: 'prospectus-prospectus-fidelity-small-cap-prospectus' },
          { label: 'Fidelity® International Index Fund Prospectus', documentId: 'prospectus-prospectus-fidelity-international-index-fund-prospectus' },
          { label: 'Fidelity® NASDAQ® Composite Index Fund Prospectus', documentId: 'prospectus-prospectus-fidelity-nasdaq-composite-index-fund-prospectus' },
          { label: 'Vanguard Mid-Cap Index Fund Prospectus', documentId: 'prospectus-prospectus-vanguard-mid-cap-index-fund-prospectus' },
          { label: 'Vanguard Total World Stock Index Fund Prospectus', documentId: 'prospectus-prospectus-vanguard-total-world-stock-index-fund-prospectus' },
          { label: 'Vanguard Total Bond Market Index Fund Prospectus', documentId: 'prospectus-prospectus-vanguard-total-bond-market-index-fund-prospectus' },
          { label: 'Vanguard Real Estate Index Fund Prospectus', documentId: 'prospectus-prospectus-vanguard-real-estate-index-fund-prospectus' },
          { label: 'JPMorgan Hedged Equity 3 Fund Prospectus', documentId: 'prospectus-prospectus-jpmorgan-hedged-equity-3-fund-prospectus' },
          { label: 'Russell Life Points® Strategies', documentId: 'prospectus-prospectus-russell-life-points-strategies' },
        ],
      },
    ],
    actions: [{ label: 'Download offering circular', documentId: 'document-offering-circular' }],
  },

  '/forms': {
    pageClass: 'native-info-page--forms',
    compact: true,
    hero: { title: 'Forms', highlight: null },
    intro: 'Browse AGFinancial form links by topic.',
    hideIntro: true,
    forms: formsLibraryLinks,
  },

  '/subscribe': {
    compact: true,
  },

  '/taxguide': {
    pageClass: 'native-info-page--tax-guide',
    compact: true,
    hero: { title: 'Tax Guide', highlight: null },
    hideIntro: true,
    sections: [],
    actions: [],
  },

  '/terms-of-service': {
    compact: true,
  },
  '/privacy-policy': {
    compact: true,
  },
  '/accessibility': legalContent('Accessibility'),

  '/vineyard': {
    compact: true,
  },
  '/yourplan': {
    compact: true,
  },
  '/test': {
    compact: true,
    pageClass: 'native-info-page--test',
    hero: {
      lines: [
        { title: 'Dynamic', highlights: [{ text: 'Dynamic', className: 'is-atlantean' }] },
        { title: 'Panels.', highlights: [{ text: 'Panels.', className: 'is-mango' }] },
      ],
    },
    intro: 'Testing route for native page behavior and content rendering.',
    sections: [],
  },
};

const insuranceChildPages = {
  '/services/insurance/certificate-request': {
    compact: true,
    pageClass: 'native-info-page--certificate-request',
    hideIntro: true,
  },
  '/services/insurance/group-term-life-insurance': {
    compact: true,
    pageClass: 'native-info-page--group-life-quote',
  },
  '/services/insurance/life-insurance-quote': {
    pageClass: 'native-info-page--life-quote',
    compact: true,
  },
  '/services/insurance/ministers-group-life-plan': {
    compact: true,
    hideIntro: true,
    pageClass: 'native-info-page--ministers-group-life-plan',
  },
  '/services/insurance/mission-assure': {
    compact: true,
    pageClass: 'native-info-page--mission-assure',
    hideIntro: true,
  },
  '/services/insurance/mission-assure/report-a-claim': {
    compact: true,
  },
  '/services/insurance/property-casualty-insurance': {
    compact: true,
    pageClass: 'native-info-page--insurance-pc',
  },
};

const legacyChildPages = {
  '/services/planned-giving/charitable-gift-annuities': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-cga',
    compact: true,
  },
  '/services/planned-giving/charitable-trusts': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-trusts',
    compact: true,
  },
  '/services/planned-giving/endowments': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-endowments',
    compact: true,
  },
  '/services/planned-giving/generosity-fund': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-generosity-fund',
    compact: true,
  },
  '/services/planned-giving/ministry-impact-fund': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-ministry-impact',
    compact: true,
  },
};

const loansChildPages = {
  '/services/loans/loan-consultants': {
    pageClass: 'native-info-page--loans-consultant',
    compact: true,
  },
};

const investmentsChildPages = {
  '/services/investments/invest-by-mail': {
    pageClass: 'native-info-page--investments-child native-info-page--investments-invest-by-mail',
    compact: true,
  },
};

const retirementChildPages = {
  '/services/retirement/403b': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-403b',
    compact: true,
  },
  '/services/retirement/403b/403b-terms-definitions': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-403b',
    compact: true,
  },
  '/services/retirement/403b/403b-individual-enrollment': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-403b',
  },
  '/services/retirement/403b/403b-group-enrollment': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-403b',
  },
  '/services/retirement/409a': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-409a',
    compact: true,
  },
  '/services/retirement/iras': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-iras',
    compact: true,
  },
  '/services/retirement/iras/fund-an-ira': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-simple native-info-page--retirement-fund-ira',
    compact: true,
  },
  '/services/retirement/retirement-consultants': {
    pageClass: 'native-info-page--loans-consultant native-info-page--retirement-consultants',
    compact: true,
  },
  '/services/retirement/rollovers': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-simple native-info-page--retirement-rollovers',
    compact: true,
  },
};

function serviceChildContent(title, parentPath, links) {
  return {
    compact: true,
    hero: { title, highlight: null },
    intro: 'This service route is available in native React with saved-page copy restoration in progress.',
    sections: [
      {
        title: 'Related pages',
        links,
      },
    ],
    actions: [{ label: 'Back to parent service', to: parentPath }],
  };
}

function companyChildContent(path, title) {
  if (path === '/about-us/careers') {
    return {
      pageClass: 'native-info-page--careers',
      compact: true,
      hero: {
        lines: [
          { title: 'Be part of', className: 'careers-hero-line is-mango' },
          { title: 'something', className: 'careers-hero-line is-mango' },
          {
            title: 'bigger.',
            className: 'careers-hero-line careers-hero-line--major is-mango',
            highlights: [{ text: 'bigger', className: 'is-mango' }],
          },
        ],
        bgTone: 'white',
        titleSizeRem: 7,
        lineGap: 0.04,
        lineHeight: 0.92,
      },
      intro: {
        className: 'careers-native-top-intro',
        copyClassName: 'careers-native-top-intro-copy',
        headingClassName: 'careers-native-top-intro-heading fade-up fade-up-force-observe fade-up-no-shift',
        emphasisClassName: 'careers-native-top-intro-emphasis fade-up fade-up-force-observe',
        heading: 'Faith + Career.',
        bodyHtml: '<p class="careers-native-top-intro-body fade-up fade-up-force-observe">You can make a difference in your work. We mean that, and our customers experience it. Our office ecosystem is at the intersection of ministry and expertise. At AGFinancial, it’s our desire to honor Jesus by doing great work, and by treating others well.</p>',
        emphasis: 'What you do here truly matters.',
      },
      sections: [
        {
          title: 'Just a few reasons you’ll love working here…',
          className: 'careers-native-benefits',
          titleClassName: 'loans-native-display-heading careers-native-benefits-title',
          fullBleed: true,
          columns: 'four',
          cards: [
            {
              title: 'Paid Time Off (PTO)',
              body: 'Service-based, and earns up to 120 hours per year.',
              cardClass: 'card3',
            },
            {
              title: 'Mortgage program',
              body: 'Special loan financing rates for full-time employees.',
              cardClass: 'card3',
            },
            {
              title: 'Bonuses',
              body: 'Potential annual bonus plan.',
              cardClass: 'card3',
            },
            {
              title: 'Insurance',
              body: 'Medical, dental, vision, supplemental, and more.',
              cardClass: 'card3',
            },
            {
              title: 'Holidays',
              body: '14 paid holidays per year.',
              cardClass: 'card3',
            },
            {
              title: 'Retirement',
              body: '403(b) plan with options, and 9% company contribution (when eligible).',
              cardClass: 'card3',
            },
            {
              title: 'Students',
              body: 'Student loan and tuition assistance programs available.',
              cardClass: 'card3',
            },
            {
              title: 'Perks',
              body: 'Onsite fitness center, complimentary coffee, espresso, and tea, and more…',
              cardClass: 'card3',
            },
          ],
        },
        {
          className: 'careers-native-ready',
          copyWrap: true,
          copyClassName: 'careers-native-ready-copy fade-up fade-up-force-observe',
          justify: 'center',
          title: 'Ready when you are.',
          body: ['See all open positions below and apply online.'],
        },
        {
          className: 'careers-native-jobs-list',
          title: 'Open positions',
          hideTitle: true,
          jobs: [],
        },
        {
          className: 'careers-native-matters',
          copyWrap: true,
          copyClassName: 'careers-native-matters-copy fade-up',
          justify: 'center',
          title: 'Your work matters.',
          titleHighlights: [{ text: 'matters', className: 'is-atlantean' }],
          body: ['As part of our team, you’ll make a difference every  day.'],
          actions: [{ label: 'See how we’re helping', to: '/about-us/impact' }],
        },
        {
          className: 'careers-native-fineprint',
          title: 'Equal opportunity',
          hideTitle: true,
          fineprint: 'AGFinancial (AGF) is an equal opportunity/affirmative action employer. AGF considers applicants for all positions without regard to race, color, ancestry, national origin, citizenship, age, sex, marital status, parental status, disability, military or veteran status of an otherwise qualified individual. In addition to being a 501(c)3 tax-exempt corporation, AGF is a faith-based religious organization. As a faith-based religious organization pursuant to the Civil Rights Act of 1964 (42 U.S.C. @2000e-1), AGF hires candidates who agree and attest to our Standards of Conduct.',
        },
      ],
      actions: [],
    };
  }

  if (path === '/about-us/impact') {
    return {
      pageClass: 'native-info-page--impact',
      hideHero: true,
      hideIntro: true,
      actions: [],
    };
  }

  return {
    compact: true,
    hero: { title, highlight: null },
    intro: 'Company content is being restored from approved saved pages.',
    sections: [{ title: 'Company links', links: companyLinks }],
  };
}

const companyLinks = [
  { label: 'About us', to: '/about-us' },
  { label: 'Careers', to: '/about-us/careers' },
  { label: 'Impact', to: '/about-us/impact' },
  { label: 'Contact us', to: '/contact-us' },
];

function legalContent(title) {
  if (title === 'Accessibility') {
    return {
      pageClass: 'native-info-page--accessibility',
      compact: true,
      hideHero: true,
    };
  }

  return {
    compact: true,
    hero: { title, highlight: null },
    intro: 'Legal copy is being served from native React routes.',
    sections: [
      {
        title: 'Need assistance?',
        body: ['If you have legal or policy questions, contact our team and we will route to the right person.'],
      },
    ],
    actions: [{ label: 'Contact us', to: '/contact-us' }],
  };
}
