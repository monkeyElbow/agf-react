export function getNativePageContent(path, title) {
  const direct = directContent[path];
  if (direct) {
    return direct;
  }

  if (path.startsWith('/services/insurance/')) {
    return insuranceChildPages[path] || serviceChildContent(title, '/services/insurance', [
      { label: 'Insurance overview', to: '/services/insurance' },
      { label: 'Group term life insurance', to: '/services/insurance/group-term-life-insurance' },
      { label: 'Mission Assure', to: '/services/insurance/mission-assure' },
      { label: 'Contact insurance team', to: '/contact-us' },
    ]);
  }

  if (path.startsWith('/services/legacy-giving/')) {
    return legacyChildPages[path] || serviceChildContent(title, '/services/legacy-giving', [
      { label: 'Legacy Giving overview', to: '/services/legacy-giving' },
      { label: 'Charitable Gift Annuities', to: '/services/legacy-giving/charitable-gift-annuities' },
      { label: 'Charitable Trusts', to: '/services/legacy-giving/charitable-trusts' },
      { label: 'Talk with a specialist', to: '/contact-us' },
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
      { label: 'Legacy Giving', to: '/services/legacy-giving' },
    ]);
  }

  if (path.startsWith('/about-us/')) {
    return companyChildContent(path, title);
  }

  return {
    compact: true,
    hero: { title, highlight: null },
    intro: 'This page is now React-native and will be rebuilt block-by-block to exact saved-page parity.',
    sections: [
      {
        title: 'Next step',
        body: [
          'Core routing, performance, and design tokens are now native.',
          'Content and style parity for this route is queued for the next pass.',
        ],
      },
    ],
    actions: [{ label: 'Back to services', to: '/services' }, { label: 'Contact us', to: '/contact-us', ghost: true }],
  };
}

const directContent = {
  '/services/insurance': {
    hero: { title: 'Low premiums, protect what matters most.', highlight: 'protect' },
    intro: 'Focus on your ministry. We will manage the risk.',
    sections: [
      {
        title: 'Coverage solutions for ministry life',
        cards: [
          {
            title: 'Property and Casualty',
            body: 'Coverage for facilities, property, liability, and operations so your ministry can move with confidence.',
            to: '/services/insurance/property-casualty-insurance',
            cta: 'Learn more',
          },
          {
            title: 'Life Insurance Quote',
            body: 'Personal life insurance options for ministry leaders and families.',
            to: '/services/insurance/life-insurance-quote',
            cta: 'Get a quote',
          },
          {
            title: 'Group Term Life Insurance',
            body: 'Group coverage options built for credentialed ministers and ministry teams.',
            to: '/services/insurance/group-term-life-insurance',
            cta: 'Learn more',
          },
          {
            title: 'Mission Assure',
            body: 'Mission trip and travel protection for outreach, retreats, and ministry activity.',
            to: '/services/insurance/mission-assure',
            cta: 'Learn more',
          },
          {
            title: 'Certificate Request',
            body: 'Quick certificate support for policy confirmation and related ministry requirements.',
            to: '/services/insurance/certificate-request',
            cta: 'Request now',
          },
          {
            title: 'Notary Bonds',
            body: 'Bond resources and external support links when your ministry role requires notary coverage.',
            href: 'https://www.orsurety.com/commercial-bonds',
            cta: 'Open bonds resource',
          },
        ],
      },
      {
        title: 'What coverage is best for your ministry?',
        sand: true,
        body: [
          'Tell us your ministry setup, team size, and risk priorities. We can map out life, property and casualty, and mission options that fit.',
        ],
        actions: [
          { label: 'Request a quote', to: '/services/insurance/life-insurance-quote' },
          { label: 'Certificate request', to: '/services/insurance/certificate-request', ghost: true },
        ],
      },
      {
        title: 'Frequently Asked Questions',
        faqs: [
          {
            question: 'Do you offer personal insurance products?',
            answer: 'Yes. We offer personal insurance products, including life insurance and mission trip travel insurance.',
          },
          {
            question: 'What is key man insurance?',
            answer: 'Key man insurance is a policy owned by the ministry that can help offset financial impact if a key leader dies.',
          },
          {
            question: 'How should churches handle replacement value?',
            answer: 'Most churches should insure to replacement cost value and review appraisals regularly to avoid coverage gaps.',
          },
          {
            question: 'Who should I contact about claims?',
            answer: 'For Church Mutual policy claims call 800.554.2642 option 2. For all other claims call 866.662.8210 or email info@agfinancialinsurance.com.',
          },
        ],
      },
      {
        title: 'Mission coverage highlight',
        body: [
          'Full coverage for mission trips, retreats, and everything in between.',
          'If you need to report a mission-related claim now, use the dedicated flow.',
        ],
        actions: [{ label: 'Report a claim', to: '/services/insurance/mission-assure/report-a-claim' }],
      },
    ],
    actions: [{ label: 'Email insurance team', href: 'mailto:info@agfinancialinsurance.com' }],
  },

  '/services/legacy-giving': {
    hero: { title: 'Generous giving. With strategy.', highlight: 'strategy' },
    intro: 'Make a difference that lasts for generations.',
    sections: [
      {
        title: 'Legacy planning and charitable giving made easy',
        cards: [
          {
            title: 'Donor Advised Funds / Generosity Fund',
            body: 'Flexible giving built for ongoing generosity with practical planning support.',
            to: '/services/legacy-giving/generosity-fund',
            cta: 'Learn more',
          },
          {
            title: 'Endowments',
            body: 'Long-term funding structures designed to support ministry goals over time.',
            to: '/services/legacy-giving/endowments',
            cta: 'Learn more',
          },
          {
            title: 'Charitable Gift Annuities',
            body: 'Create income potential for you while supporting ministry through charitable gifts.',
            to: '/services/legacy-giving/charitable-gift-annuities',
            cta: 'Learn more',
          },
          {
            title: 'Customized Giving Plans',
            body: 'Build a charitable strategy that fits your giving goals, tax posture, and timeline.',
            href: 'https://aggift.org/?pageID=124',
            cta: 'Create your plan',
          },
          {
            title: 'Charitable Trusts',
            body: 'Trust structures for personalized giving, income planning, and stewardship outcomes.',
            to: '/services/legacy-giving/charitable-trusts',
            cta: 'Learn more',
          },
          {
            title: 'Ministry Impact Fund',
            body: 'A giving vehicle that supports ministry investment and long-term Kingdom impact.',
            to: '/services/legacy-giving/ministry-impact-fund',
            cta: 'Learn more',
          },
          {
            title: 'Wills and Estate Services',
            body: 'Support for estate documents and charitable planning decisions that honor your legacy goals.',
            href: 'https://files.agfinancial.org/Planned-Giving/Will-Planning-Packet.pdf',
            cta: 'Download packet',
          },
        ],
      },
      {
        title: 'Smart stewardship for today and tomorrow',
        sand: true,
        body: [
          'Planned giving integrates personal, financial, and estate planning goals with your desire to create charitable impact now and in the future.',
          'Some strategies are straightforward like bequests, while others can include income streams, tax planning, and long-term ministry support.',
        ],
        actions: [
          { label: 'Gift options', href: 'https://aggift.org/?pageID=123' },
          { label: 'Watch video', href: 'https://media.agfinancial.org/2021_Generosity-Fund.mp4', ghost: true },
        ],
      },
      {
        title: 'We help every step of the way. Always.',
        body: [
          'Our team can walk with you through strategy selection, setup, and ongoing stewardship support.',
          'If you are ready to start, we can map out a plan that fits your goals.',
        ],
        actions: [
          { label: 'Start online form', href: 'https://sft.agfinancial.org/documents/Send.do' },
          { label: 'Email planned giving', href: 'mailto:plannedgiving@agfinancial.org', ghost: true },
        ],
      },
    ],
    actions: [{ label: 'Talk with a specialist', to: '/contact-us' }],
  },

  '/about-us': {
    compact: true,
    hero: { title: 'About AGFinancial', highlight: 'AGFinancial' },
    intro: 'For over 75 years, we have partnered with ministers, ministries, and families to align financial strategy with mission and stewardship.',
    sections: [
      {
        title: 'Explore',
        cards: [
          {
            title: 'Impact',
            body: 'See how clients and ministries are creating measurable Kingdom impact together.',
            to: '/about-us/impact',
            cta: 'View impact',
          },
          {
            title: 'Careers',
            body: 'Join a team serving churches, ministries, and families with purpose.',
            to: '/about-us/careers',
            cta: 'View careers',
          },
        ],
      },
    ],
  },

  '/resources': {
    compact: true,
    hero: { title: 'Resources for ministry finance', highlight: 'Resources' },
    intro: 'Articles, tools, and practical planning help for financial decisions across church and personal stewardship.',
    sections: [
      {
        title: 'Tools and guides',
        cards: [
          {
            title: 'Calculators',
            body: 'Estimate savings growth, loan payments, and planning scenarios.',
            to: '/calculators',
            cta: 'Open calculators',
          },
          {
            title: 'Rates',
            body: 'Review current investment rates and effective dates.',
            to: '/rates',
            cta: 'View rates',
          },
          {
            title: 'Prospectus',
            body: 'Read offering and disclosure information.',
            to: '/prospectus',
            cta: 'View prospectus',
          },
        ],
      },
    ],
  },

  '/calculators': {
    compact: true,
    hero: { title: 'Financial calculators', highlight: 'calculators' },
    intro: 'Use these tools to model contributions, compounding, emergency savings, and other planning decisions.',
    sections: [
      {
        title: 'Start with these pages',
        links: [
          { label: 'Loans payment calculator', to: '/services/loans#run-some-numbers' },
          { label: 'Investment laddering calculator', to: '/services/investments' },
          { label: 'Retirement planning options', to: '/services/retirement' },
        ],
      },
    ],
  },

  '/contact-us': {
    compact: true,
    hero: { title: 'Contact us', highlight: null },
    intro: 'Talk with our team about rates, services, or next steps. We are ready to help with your questions.',
    sections: [
      {
        title: 'Client Services',
        body: ['Phone: 866.621.1787', 'Secure login: secure.agfinancial.org'],
      },
    ],
    actions: [{ label: 'Secure Login', href: 'https://secure.agfinancial.org/' }],
  },

  '/online-contributions': {
    compact: true,
    hero: { title: 'Online contributions', highlight: null },
    intro: 'Support your giving goals with secure online contribution workflows.',
    sections: [
      {
        title: 'Need setup help?',
        body: ['Reach out and we can walk through contribution options and account setup.'],
      },
    ],
    actions: [{ label: 'Contact us', to: '/contact-us' }],
  },

  '/prospectus': {
    compact: true,
    hero: { title: 'Prospectus', highlight: null },
    intro: 'Offering and disclosure materials are provided here for review.',
    sections: [
      {
        title: 'Documents',
        actions: [{ label: 'Download offering circular', href: 'https://media.agfinancial.org/AGLF-Offering-Circular.pdf' }],
      },
    ],
  },

  '/subscribe': {
    compact: true,
    hero: { title: 'Subscribe', highlight: null },
    intro: 'Get occasional updates about rates, services, and practical planning resources.',
    sections: [
      {
        title: 'Stay in the loop',
        body: ['Use the home page signup block now while we finish the dedicated subscribe experience.'],
      },
    ],
    actions: [{ label: 'Go to home signup', to: '/#stay-in-the-loop' }],
  },

  '/terms-of-service': legalContent('Terms of Service'),
  '/privacy-policy': legalContent('Privacy Policy'),
  '/accessibility': legalContent('Accessibility'),

  '/vineyard': {
    compact: true,
    hero: { title: 'Vineyard', highlight: null },
    intro: 'This page is now native and ready for final approved content migration.',
    sections: [
      {
        title: 'Next step',
        body: ['We will populate this section with exact saved-page copy and links in the next content pass.'],
      },
    ],
  },
};

const insuranceChildPages = {
  '/services/insurance/certificate-request': {
    compact: true,
    hero: { title: 'Certificate Request', highlight: null },
    intro: 'Request your certificate quickly and we will route it to the right team for processing.',
    sections: [
      {
        title: 'What to include',
        links: [
          { label: 'Organization name and contact', to: '/contact-us' },
          { label: 'Policy details and deadline', to: '/contact-us' },
          { label: 'Email insurance team', href: 'mailto:info@agfinancialinsurance.com' },
        ],
      },
    ],
    actions: [{ label: 'Email certificate request', href: 'mailto:info@agfinancialinsurance.com' }],
  },
  '/services/insurance/group-term-life-insurance': {
    compact: true,
    hero: { title: 'Group Term Life Insurance', highlight: 'Group' },
    intro: 'Take care of the team with group life coverage options tailored for ministry contexts.',
    sections: [
      {
        title: 'Need a quote for group life?',
        body: [
          'Share team structure and coverage goals and we can help map out options.',
          'For Standard Group Life Insurance questions, call Innovo Benefits Administration at 800.829.5601.',
        ],
      },
    ],
    actions: [{ label: 'Request quote', to: '/services/insurance/life-insurance-quote' }],
  },
  '/services/insurance/life-insurance-quote': {
    compact: true,
    hero: { title: 'Life Insurance Quote', highlight: 'Quote' },
    intro: 'Tell us what coverage you need and our team can guide you through the next steps.',
    sections: [
      {
        title: 'Quote support',
        body: ['Individual life, group life, and key man options are available based on ministry needs.'],
      },
    ],
    actions: [{ label: 'Contact insurance team', href: 'mailto:info@agfinancialinsurance.com' }],
  },
  '/services/insurance/ministers-group-life-plan': {
    compact: true,
    hero: { title: "Minister's Group Life Plan", highlight: 'Group' },
    intro: 'Coverage options designed specifically for credentialed ministers and ministry leadership scenarios.',
    sections: [
      {
        title: 'Plan support',
        body: ['For questions and enrollment support, contact our insurance team and we will route you quickly.'],
      },
    ],
    actions: [{ label: 'Email insurance team', href: 'mailto:info@agfinancialinsurance.com' }],
  },
  '/services/insurance/mission-assure': {
    compact: true,
    hero: { title: 'Mission Assure', highlight: 'Mission' },
    intro: 'Full coverage for mission trips, retreats, and travel tied to ministry outreach.',
    sections: [
      {
        title: 'Coverage includes',
        links: [
          { label: 'Trip and travel protection', to: '/services/insurance/mission-assure' },
          { label: 'Report a claim', to: '/services/insurance/mission-assure/report-a-claim' },
          { label: 'Contact mission coverage team', href: 'mailto:info@agfinancialinsurance.com' },
        ],
      },
    ],
    actions: [{ label: 'Report a claim', to: '/services/insurance/mission-assure/report-a-claim' }],
  },
  '/services/insurance/mission-assure/report-a-claim': {
    compact: true,
    hero: { title: 'Report a claim', highlight: 'claim' },
    intro: 'Use this route for active mission-related claims and urgent insurance claim support.',
    sections: [
      {
        title: 'Claim contacts',
        body: [
          'Church Mutual policy holders: 800.554.2642 (option 2).',
          'All other claims: 866.662.8210 or info@agfinancialinsurance.com.',
        ],
      },
    ],
    actions: [{ label: 'Email claims support', href: 'mailto:info@agfinancialinsurance.com' }],
  },
  '/services/insurance/property-casualty-insurance': {
    compact: true,
    hero: { title: 'Property and Casualty Insurance', highlight: 'Casualty' },
    intro: 'Protect facilities and operations with ministry-focused coverage and practical risk guidance.',
    sections: [
      {
        title: 'Risk management essentials',
        body: [
          'Comprehensive risk management helps protect people and reduce financial exposure before incidents happen.',
          'Replacement cost reviews and workers compensation planning are key parts of church risk strategy.',
        ],
      },
    ],
    actions: [{ label: 'Request property quote', to: '/services/insurance/life-insurance-quote' }],
  },
};

const legacyChildPages = {
  '/services/legacy-giving/charitable-gift-annuities': {
    compact: true,
    hero: { title: 'Charitable Gift Annuities', highlight: 'Gift' },
    intro: 'Create income potential while supporting ministry through charitable giving.',
    sections: [
      {
        title: 'Explore options',
        body: ['Our team can help you compare gift annuity options based on your giving and income goals.'],
      },
    ],
    actions: [{ label: 'Gift options', href: 'https://aggift.org/?pageID=123' }],
  },
  '/services/legacy-giving/charitable-trusts': {
    compact: true,
    hero: { title: 'Charitable Trusts', highlight: 'Trusts' },
    intro: 'Use trust strategies to align giving goals with tax and income planning.',
    sections: [
      {
        title: 'Trust planning support',
        body: ['We can walk through trust structures and help identify an approach that fits your stewardship goals.'],
      },
    ],
    actions: [{ label: 'Create your plan', href: 'https://aggift.org/?pageID=124' }],
  },
  '/services/legacy-giving/endowments': {
    compact: true,
    hero: { title: 'Endowments', highlight: null },
    intro: 'Build long-term giving support for ministries and causes you care about.',
    sections: [
      {
        title: 'Long-term impact',
        body: ['Endowments can provide durable support for future ministry opportunities and mission initiatives.'],
      },
    ],
    actions: [{ label: 'Talk with a specialist', to: '/contact-us' }],
  },
  '/services/legacy-giving/generosity-fund': {
    compact: true,
    hero: { title: 'Generosity Fund', highlight: 'Generosity' },
    intro: 'A donor-advised style giving experience with flexible contribution and grant support.',
    sections: [
      {
        title: 'Get started',
        body: ['Use the online process to begin setup and then tailor giving strategy with our team.'],
      },
    ],
    actions: [{ label: 'Start online form', href: 'https://sft.agfinancial.org/documents/Send.do' }],
  },
  '/services/legacy-giving/ministry-impact-fund': {
    compact: true,
    hero: { title: 'Ministry Impact Fund', highlight: 'Impact' },
    intro: 'A giving vehicle focused on sustained ministry investment and Kingdom impact.',
    sections: [
      {
        title: 'How it helps',
        body: ['Pair strategic giving with practical stewardship support to build long-term ministry outcomes.'],
      },
    ],
    actions: [{ label: 'Contact planned giving', href: 'mailto:plannedgiving@agfinancial.org' }],
  },
};

const retirementChildPages = {
  '/services/retirement/403b': {
    compact: true,
    hero: { title: 'AGFinancial 403(b)', highlight: '403(b)' },
    intro: 'Retirement plan options built for ministry employees and organizations.',
    sections: [
      {
        title: 'Quick links',
        links: [
          { label: '403(b) individual enrollment', to: '/services/retirement/403b/403b-individual-enrollment' },
          { label: '403(b) group enrollment', to: '/services/retirement/403b-for-groups/403b-group-enrollment' },
          { label: 'Retirement consultants', to: '/services/retirement/retirement-consultants' },
        ],
      },
    ],
  },
};

function serviceChildContent(title, parentPath, links) {
  return {
    compact: true,
    hero: { title, highlight: null },
    intro: 'This service page is now React-native. Exact copy and block styling are being aligned from approved saved pages.',
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
      compact: true,
      hero: { title: 'Careers', highlight: null },
      intro: 'Join a team focused on helping ministries and families steward finances with purpose.',
      sections: [{ title: 'Company links', links: companyLinks }],
      actions: [{ label: 'Contact us', to: '/contact-us' }],
    };
  }

  if (path === '/about-us/impact') {
    return {
      compact: true,
      hero: { title: 'Impact', highlight: null },
      intro: 'See how financial stewardship and ministry partnership create measurable Kingdom impact together.',
      sections: [{ title: 'Company links', links: companyLinks }],
      actions: [{ label: 'Back to About Us', to: '/about-us' }],
    };
  }

  return {
    compact: true,
    hero: { title, highlight: null },
    intro: 'Company page migration is in progress with native blocks and admin-ready structure.',
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
  return {
    compact: true,
    hero: { title, highlight: null },
    intro: 'This legal page is now served from native React routes. Final legal copy and publication metadata will be inserted in the next pass.',
    sections: [
      {
        title: 'Need assistance?',
        body: ['If you have legal or policy questions, contact our team and we will route to the right person.'],
      },
    ],
    actions: [{ label: 'Contact us', to: '/contact-us' }],
  };
}
