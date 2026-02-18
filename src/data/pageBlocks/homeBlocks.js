import charitableIcon from '../../assets/service-icons/Charitable.png';
import insureIcon from '../../assets/service-icons/Insure.png';
import investIcon from '../../assets/service-icons/Invest.png';
import loansIcon from '../../assets/service-icons/Loans.png';
import retireIcon from '../../assets/service-icons/Retire.png';
import ratesIcon from '../../assets/service-icons/chart.png';
import ministersHousingImage from '../../assets/ministers-housing.jpg';
import doTheMathImage from '../../assets/do-the-math.jpg';

export const homePageBlocks = [
  {
    type: 'top_strip',
    loginLabel: 'Secure Login',
    loginHref: 'https://secure.agfinancial.org/',
    phone: '866.621.1787',
    ratesLabel: 'Ask about our rates!',
    ratesPath: '/rates',
  },
  {
    type: 'hero',
    eyebrowPrefix: "Today's",
    titlePrefix: "Tomorrow's",
    highlight: 'investment',
    accentWord: 'church',
    ctaLabel: 'Explore investments',
    ctaPath: '/services/investments',
  },
  {
    type: 'services_grid',
    heading: 'Bold, smart steps. Together.',
    cards: [
      { title: 'Loans', path: '/services/loans', image: loansIcon, action: 'Options' },
      { title: 'Retirement', path: '/services/retirement', image: retireIcon, action: 'Explore' },
      { title: 'Investments', path: '/services/investments', image: investIcon, action: 'Grow' },
      { title: 'Legacy Giving', path: '/services/legacy-giving', image: charitableIcon, action: 'Plan' },
      { title: 'Insurance', path: '/services/insurance', image: insureIcon, action: 'Protect' },
      { title: 'View Rates', path: '/rates', image: ratesIcon, action: 'View Rates', featured: true },
    ],
    browseLabel: 'Browse all services',
    browsePath: '/services',
  },
  {
    type: 'impact_stat',
    titlePrefix: 'What you do here',
    highlight: 'matters',
    body: 'As an AGFinancial client, you are also our ministry ally. Together, we improve financial health while fueling Kingdom growth and support.',
    ctaLabel: 'Tell me more',
    ctaPath: '/about-us/impact',
    stats: [
      { value: '$11 billion', label: 'assets under management', tone: 'mango' },
      { value: '1,583', label: 'ministries supported', tone: 'atlantean' },
      { value: '38,654', label: 'super happy clients', tone: 'sandstone' },
    ],
  },
  {
    type: 'cta_form',
    headingPrefix: 'Ready to connect',
    headingHighlight: 'your',
    headingSuffix: 'faith & finances?',
    buttonLabel: 'Follow-up with me',
    phonePlaceholder: '(555) 555-5555',
    messagePlaceholder: 'What would you like to discuss?',
    note: 'It starts with a conversation. We’re happy to reach out.',
  },
  {
    type: 'feature_split',
    heading: 'Ministers Housing Allowance',
    body: 'This significant tax-saving benefit is available to retired ministers through the AGFinancial 403(b) plan.',
    ctaLabel: 'See the details',
    ctaPath: '/services/retirement/403b#housing',
    imagePath: ministersHousingImage,
    imageAlt: 'Retired couple reviewing financial paperwork',
    imageOnLeft: true,
    sand: true,
  },
  {
    type: 'feature_split',
    leadHighlight: '(let us)',
    heading: 'Do the math.',
    body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
    ctaLabel: 'Use the calculators',
    ctaPath: '/calculators',
    imagePath: doTheMathImage,
    imageAlt: 'Calculator and notebook',
    imageOnLeft: false,
  },
  {
    type: 'newsletter',
    headingPrefix: 'Stay in the',
    headingHighlight: 'loop',
    body: 'Get the occasional message about rates, products, services, and even a few pro tips.',
    buttonLabel: 'Sign me up',
  },
];
