import legacyOpportunityImage from '../assets/legacy-opportunity.jpg';

export function getNativePageContent(path, title) {
  const direct = directContent[path];
  if (direct) {
    return direct;
  }

  if (path.startsWith('/services/loans/')) {
    return loansChildPages[path] || serviceChildContent(title, '/services/loans', [
      { label: 'Loans overview', to: '/services/loans' },
      { label: 'Find A Consultant', to: '/services/loans/loans-consultant' },
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
  '/services/insurance': {
    pageClass: 'native-info-page--insurance',
    hero: {
      title: 'Low premiums, impressive coverage.',
      highlights: [{ text: 'impressive coverage', className: 'is-atlantean' }],
    },
    intro: {
      heading: 'Protect what matters most.',
      body: [
        "We're committed to helping you get the coverage you need, at highly competitive rates, to protect your people and property.",
      ],
      emphasis: "It's protection, security, and confidence.",
      actions: [{ label: 'Request a quote', to: '/services/insurance/life-insurance-quote' }],
    },
    sections: [
      {
        title: 'Coverage solutions',
        hideTitle: true,
        className: 'insurance-native-coverage',
        columns: 'two',
        cards: [
          {
            title: 'Property & Casualty',
            body: "Our specialty is protecting churches, schools, ministries, and other nonprofits, as well as businesses. It's the best coverage at the best possible rates for your organization.",
            to: '/services/insurance/property-casualty-insurance',
            cta: 'Learn more',
            cardClass: 'card4',
          },
          {
            title: 'Life Insurance',
            body: 'Your life insurance policy is customized specifically for you. We partner with only A- or higher rated carriers, so the coverage you receive equals the peace of mind you deserve.',
            actions: [
              { label: 'Individual', to: '/services/insurance/life-insurance-quote' },
              { label: 'Group', to: '/services/insurance/group-term-life-insurance' },
            ],
            cardClass: 'card4',
          },
          {
            title: 'Mission Assure',
            body: 'Full coverage for mission trips, camps, retreats, events, and everything in between, with low per-person, per-day premiums. Mission Assure offers superior protection at minimum cost.',
            to: '/services/insurance/mission-assure',
            cta: 'Learn more',
            cardClass: 'card4',
          },
          {
            title: 'Bonds',
            body: 'Contracting, license, permit, and more. Apply for your certificate below.',
            actions: [
              { label: 'Notary bonds', href: 'https://www.orsurety.com/commercial-bonds' },
            ],
            cardClass: 'card4',
          },
        ],
        actions: [
          { label: 'Certificate request', to: '/services/insurance/certificate-request' },
        ],
      },
      {
        title: 'Get a quote.',
        subtitle: "It's on the house.",
        className: 'insurance-native-quote',
        body: [
          'Your first step toward the right coverage starts right here.',
        ],
        actions: [
          { label: 'Life Insurance', to: '/services/insurance/life-insurance-quote' },
          { label: 'Property & Casualty', to: '/services/insurance/property-casualty-insurance' },
        ],
      },
      {
        title: 'Risk Management',
        titleHighlights: [{ text: 'Risk', className: 'is-mango' }],
        className: 'insurance-native-risk',
        body: [
          'Ministries are often faced with issues that can cause disruptions, loss of resources, and heartache.',
          'Practicing good risk management helps increase safety and security for children, families, church workers, and leaders while helping your church avoid costly disruptions.',
          'Our church Risk Management Guide can help you recognize areas of risk and proactively address them.',
          'Focus on your ministry. We will manage the risk.',
        ],
        links: [
          { label: 'Church Risk Management Guide', href: 'https://www.agfinancial.org/risk-management' },
          { label: 'Church Risk Management Resource', href: 'https://www.agfinancial.org/resources' },
        ],
      },
      {
        title: 'Ready to protect your ministry?',
        className: 'insurance-native-cta',
        body: [
          'Share a few details and we will help map your best options.',
        ],
        form: {
          title: 'Get a quote. It is on the house.',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555', required: true },
            { id: 'organization', label: 'Organization', type: 'text' },
            { id: 'coverageFocus', label: 'Coverage focus', type: 'text', placeholder: 'Property, life, mission, or all' },
          ],
          submitLabel: 'Request quote',
        },
      },
      {
        title: 'Mission Assure',
        logoText: 'Mission Assure',
        subtitle: 'Full coverage for mission trips, retreats, and everything in between.',
        className: 'insurance-native-mission-assure',
        body: [
          "With low per-person, per-day premiums, Mission Assure offers superior protection at minimum cost. Every trip is a step of faith, but you do not have to take it uninsured.",
        ],
        actions: [{ label: 'Learn more', to: '/services/insurance/mission-assure' }],
      },
      {
        title: 'Defend Yourself Against Fraud',
        className: 'insurance-native-fraud',
        hideTitle: true,
        fullBleed: true,
        feature: {
          title: 'Defend Yourself Against Fraud',
          image: 'https://media.agfinancial.org/2019_AGF-Blog-Header-FraudSecurity.jpg?v=1591166912',
          imageAlt: 'Defend Yourself Against Fraud',
          body: [
            'Protect your ministry with practical guidance to reduce fraud risk and strengthen internal controls.',
          ],
          actions: [{ label: 'Read article', to: '/resources/article/defend-yourself-against-fraud' }],
        },
      },
    ],
    actions: [],
  },

  '/services/legacy-giving': {
    pageClass: 'native-info-page--legacy-giving',
    hero: {
      lines: [
        {
          title: 'Generous giving.',
          highlights: [{ text: 'giving', className: 'is-atlantean' }],
        },
        {
          title: 'With strategy.',
          highlights: [{ text: 'strategy', className: 'is-mango' }],
        },
      ],
    },
    intro: {
      heading: 'Make a difference that lasts for generations.',
      body: 'Your generosity has the power to bless both the ministries and people you love. Explore options that provide potential tax savings and income generation benefitting ministries, donors, and loved ones.',
    },
    sections: [
      {
        title: 'This is legacy planning and charitable giving made easy.',
        titleHighlights: [{ text: 'made easy', className: 'is-atlantean' }],
        className: 'legacy-giving-types',
        fullBleed: true,
        cards: [
          {
            title: 'Donor Advised Funds / Generosity Fund®',
            body: 'Our Generosity Fund® is a Donor Advised Fund that can be used to simplify your giving—and increase your joy doing so. A Generosity Fund® is a giving tool available to anyone, regardless of income level.',
            actions: [
              { label: 'Watch video', href: 'https://media.agfinancial.org/2021_Generosity-Fund.mp4', ghost: true },
              { label: 'Learn more', to: '/services/legacy-giving/generosity-fund' },
            ],
          },
          {
            title: 'Endowments',
            body: 'This long-term, stable source of funding is designed to keep your gifted principal intact so it can grow over time. The annual investment income may be used for scholarships, ministries, or other purposes you specify.',
            to: '/services/legacy-giving/endowments',
            cta: 'Learn more',
          },
          {
            title: 'Charitable Gift Annuities',
            body: 'A popular planned gift that provides income for you, a Charitable Gift Annuity (CGA) allows you to receive dependable lifetime fixed payments and leave a gift to the ministry of your choice.',
            to: '/services/legacy-giving/charitable-gift-annuities',
            cta: 'Learn more',
          },
          {
            title: 'Customized Giving Plans',
            body: 'Creating a giving plan is not only a smart financial choice—it’s also a way to provide for your loved ones, gain potential tax savings, and bless the ministries close to your heart.',
            actions: [
              { label: 'Gift options', href: 'https://aggift.org/?pageID=123' },
              { label: 'Create your plan', href: 'https://aggift.org/?pageID=124', ghost: true },
            ],
          },
          {
            title: 'Charitable Trusts',
            body: 'Similar to a CGA, a Charitable Trust provides generous support for ministry while the donor receives potential tax benefits. You choose when to support the ministry: at the completion of the trust, or at its onset.',
            to: '/services/legacy-giving/charitable-trusts',
            cta: 'Learn more',
          },
          {
            title: 'Ministry Impact Fund',
            body: 'Designed for churches to receive gifts of any type: cash, stock, real estate, and more, a Ministry Impact Fund removes giving barriers and delivers cash directly to your ministry.',
            to: '/services/legacy-giving/ministry-impact-fund',
            cta: 'Learn more',
          },
        ],
      },
      {
        title: 'Wills & Estate Services',
        className: 'legacy-giving-wills',
        sand: true,
        body: [
          'Simple and straightforward, a will ensures a distribution end-of-life plan for your assets. This service is provided free of charge when you designate a 10% gift to an AG ministry of your choice.',
          '*Form to be completed by you and requires review by your attorney. Then, if you prefer, we will be happy to act as trustee, so you can relax, knowing your estate is in good hands.',
        ],
        actions: [
          { label: 'Download packet', href: 'https://files.agfinancial.org/Planned-Giving/Will-Planning-Packet.pdf', ghost: true },
          { label: 'Online form*', href: 'https://sft.agfinancial.org/documents/Send.do' },
        ],
      },
      {
        title: 'Smart stewardship—for today and tomorrow.',
        className: 'legacy-giving-stewardship',
        cards: [
          {
            title: 'Generate more retirement income',
            cardClass: 'card2',
          },
          {
            title: 'Transition out of appreciated assets',
            cardClass: 'card2',
          },
          {
            title: 'Leave a legacy for family and ministry',
            cardClass: 'card2',
          },
        ],
      },
      {
        title: 'More joy in giving.',
        titleHighlights: [{ text: 'joy', className: 'is-atlantean' }],
        subtitle: 'It’s easier than you think.',
        className: 'legacy-giving-joy',
        body: [
          'Your charitable giving plan makes it easy to manage both your cash and non-cash assets.',
        ],
        form: {
          title: 'We help every step of the way. Always.',
          subtitle: 'Let’s map out the best strategy together.',
          submitLabel: 'Follow-up with me',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555' },
          ],
        },
      },
      {
        title: 'Which Legacy Giving plan is right for you?',
        titleHighlights: [{ text: 'Legacy Giving', className: 'is-atlantean' }],
        className: 'legacy-giving-comparison',
        table: {
          headers: [
            'Type of Giving',
            'How it’s Funded',
            'Minimum Required',
            'Donor Benefits',
            'Ministry Benefits',
            'Potential Tax Benefits',
          ],
          rows: [
            ['Donor Advised Fund', 'Cash, stocks, bonds or property', '$10K cash or securities, $100K real estate', 'Tax benefit', 'Full income tax deduction, savings on capital gains tax', 'Full income tax deduction, savings on capital gains tax'],
            ['Endowment', 'Cash, stocks, bonds or property', '$10K cash or securities, $100K real estate', 'Tax benefit', 'Full income tax deduction, savings on capital gains tax', 'Full income tax deduction, savings on capital gains tax'],
            ['Charitable Gift Annuity', 'Cash, stocks or bonds', '$10K', 'Annuity payments for life', 'After beneficiary death, actuarial value of annuity to ministry', 'Partial income tax deduction, partial tax-free payment'],
            ['Charitable Remainder Trust', 'Cash or appreciated property, stocks or bonds', '$50K cash or securities, $100K real estate', 'Unitrust payment to donor or others', 'After death of donor or trust termination', 'Partial income tax deduction, savings on capital gains tax'],
            ['Deferred Charitable Gift Annuity', 'Cash, stocks or bonds', '$10K', 'Annuity payments for life', 'After beneficiary death, actuarial value of annuity to ministry', 'Partial income tax deduction, partial tax-free payment'],
            ['Charitable Remainder Annuity Trust', 'Cash or appreciated stocks or bonds', '$50K cash or securities', 'Annuity fixed payment to donor or others', 'After death of donor', 'Partial income tax deduction, minimal savings on capital gains tax'],
            ['Charitable Lead Trust', 'Cash, property, or income-producing securities', '$50K cash or securities, $100K real estate', 'After # of years, 100% of principal returned to donor or others', 'Immediate, annuity or unitrust payment for stated term', 'Partial income tax deduction, savings on capital gains tax'],
          ],
        },
      },
      {
        title: 'Testimonials',
        className: 'legacy-giving-testimonials',
        hideTitle: true,
        testimonials: [
          {
            quote: '“The speed, elegance and ease of interacting with AGFinancial is fantastic. It really is a much more enjoyable process.”',
            author: 'Andy, Donor Advised Fund Client',
          },
          {
            quote: '“Our 120-acre center for ministry for children and rural pastors wouldn’t be here today had it not been for the creative ways that AGFinancial can help leverage people’s resources.”',
            author: 'Bryan Jarrett, Lead Pastor, Northplace Church, TX',
          },
          {
            quote: '“We feel like we’re part of the good work AGFinancial is doing.”',
            author: 'Mike, Donor Advised Fund Corporate Client',
          },
        ],
      },
      {
        title: 'Testimonials fine print',
        className: 'legacy-giving-fineprint',
        hideTitle: true,
        fineprint: 'Testimonials found on this site are examples of what we have done for other clients, and what some of our clients have said about us. However, we cannot guarantee the results in any case. Your results may vary and every situation is different. No compensation was provided for these testimonials.',
      },
      {
        title: 'Opportunity is Knocking',
        className: 'legacy-giving-opportunity',
        fullBleed: true,
        hideTitle: true,
        feature: {
          title: 'Opportunity is Knocking',
          image: legacyOpportunityImage,
          body: [
            'The SECURE 2.0 Act allows you to distribute funds from your IRA into a Charitable Gift Annuity.**',
          ],
          actions: [
            { label: 'Answer the door', href: 'http://newpublic.agfinancial.org/wordpress/index.php/opportunity-is-knocking/' },
          ],
        },
      },
    ],
    actions: [],
  },

  '/about-us': {
    compact: true,
    hero: { title: 'Bold, smart steps. Together.', highlight: 'Together' },
    intro: {
      heading: 'Connect your faith & finances.',
      body: [
        'Our goal is to deliver the best financial products, services, and experiences that align with biblical values. Our mission is your financial health and ministry growth.',
        'AGFinancial is a culture where business and faith grow together.',
      ],
    },
    sections: [
      {
        title: 'Create a complete, robust financial strategy for your ministry and your family.',
        cards: [
          {
            title: 'Focus',
            body: 'Our faith and our clients’ financial health come first. Everything else flows from our unwavering commitment to both.',
            cardClass: 'card1',
          },
          {
            title: 'Responsibility',
            body: 'The highest standards of biblical stewardship and professional integrity guide every decision.',
            cardClass: 'card1',
          },
          {
            title: 'Experience',
            body: 'Decades of trusted financial expertise help us successfully navigate challenges for both individuals and ministries.',
            cardClass: 'card1',
          },
        ],
        actions: [{ label: 'Explore all services', to: '/services' }],
      },
      {
        title: 'Ministry allies.',
        body: [
          'We’re serving you, alongside you.',
        ],
        actions: [
          { label: 'See what we’re doing together', to: '/about-us/impact' },
          { label: 'Careers', to: '/about-us/careers', ghost: true },
        ],
      },
      {
        title: 'Why our work matters',
        body: [
          'This is where business and faith meet to create measurable ministry outcomes.',
          'Explore the stories and numbers behind the impact.',
        ],
        actions: [
          { label: 'This is why we matter', to: '/about-us/impact' },
        ],
      },
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
    hero: { title: 'Resources', highlight: null },
    intro: 'Articles, calculators, and practical planning tools for church and personal stewardship.',
    sections: [
      {
        title: 'Featured',
        cards: [
          {
            title: 'Summer Camp Safety Tips',
            body: 'Practical safety tips to help your summer camp prevent injuries, protect children, and be prepared for the unexpected.',
            href: '/resources',
            cta: 'Church Risk Management',
          },
          {
            title: 'Top 5 Reasons for Church Litigation',
            body: 'A single lawsuit can derail a thriving church and cost thousands of dollars. Start with prevention fundamentals.',
            href: '/resources',
            cta: 'Church Risk Management',
          },
          {
            title: 'Tariffs, Timing & Truth: Keep Building Through the Chaos',
            body: 'A practical look at timing, financing, and church construction decisions in volatile conditions.',
            href: '/resources',
            cta: 'Church Loans',
          },
        ],
      },
      {
        title: 'Categories',
        links: [
          { label: 'Calculators', to: '/calculators' },
          { label: 'Church Finance Basics', href: '/resources' },
          { label: 'Church Loans', href: '/resources' },
          { label: 'Church Risk Management', href: '/resources' },
          { label: 'Insurance', href: '/resources' },
          { label: 'Personal Finance', href: '/resources' },
          { label: 'Planned Giving', href: '/resources' },
          { label: 'Investments', href: '/resources' },
          { label: 'Retirement', href: '/resources' },
          { label: 'Tax & End of Year', href: '/resources' },
        ],
      },
    ],
  },

  '/calculators': {
    compact: true,
    hero: { title: 'Calculators', highlight: null },
    intro: 'Run practical planning scenarios and then discuss next steps with our team.',
    sections: [
      {
        title: 'Calculator tools',
        cards: [
          {
            title: 'Retirement Savings',
            body: 'Sneak a peek at the future and discover what you need to do now to make retirement a reality.',
            to: '/services/retirement',
            cta: 'Launch',
          },
          {
            title: 'Compound Interest',
            body: 'Watch your money grow over time by earning interest on a deposit and monthly contributions.',
            href: '/calculators',
            cta: 'Launch',
          },
          {
            title: 'Increased Contribution',
            body: 'Explore how much your retirement balance could grow if you increased your contribution now.',
            href: '/calculators',
            cta: 'Launch',
          },
          {
            title: 'Loan Payment',
            body: 'Run some numbers to see if the loan you need is in the ballpark.',
            to: '/services/loans#run-some-numbers',
            cta: 'Launch',
          },
          {
            title: 'Emergency Fund',
            body: 'Find out how much you need to save in order to cover six months of your expenses.',
            href: '/calculators',
            cta: 'Launch',
          },
          {
            title: 'Laddering',
            body: 'See how much more you could earn by laddering your investments instead of focusing only on short-term accounts.',
            to: '/services/investments',
            cta: 'Launch',
          },
          {
            title: 'Net Worth',
            body: 'Get a view of your financial position and make adjustments to see how things could change.',
            href: '/calculators',
            cta: 'Launch',
          },
        ],
      },
      {
        title: 'Numbers are great. People are better.',
        body: [
          'Complete the short contact form below, and one of our team will be in touch within 24 business hours.',
        ],
        actions: [{ label: 'Let’s discuss', to: '/contact-us' }],
      },
    ],
  },

  '/contact-us': {
    compact: true,
    hero: { title: 'Contact', highlight: null },
    intro: 'How can we help? Share some information, and our team will contact you within one business day.',
    sections: [
      {
        title: 'AGFinancial',
        body: [
          '3900 S Overland Avenue, Springfield, Missouri 65807',
          'clientservices@AGFinancial.org',
          'Call 866.621.1787',
          'Fax 417.831.7429',
          'Hours Monday - Friday, 8 a.m. to 4:30 p.m. CST',
        ],
      },
      {
        title: 'Help Center Quick Links',
        cards: [
          {
            title: 'FAQ',
            body: 'Find the answers to commonly asked questions.',
            href: '/resources',
            cta: 'Open',
          },
          {
            title: 'Resource Library',
            body: 'Visit our Resource Library and browse several different topics.',
            to: '/resources',
            cta: 'Browse',
          },
          {
            title: 'Find a Consultant',
            body: 'Talk one-on-one with one of our experienced representatives.',
            to: '/services/loans/loans-consultant',
            cta: 'Find',
          },
          {
            title: '24-Hour Rate Line',
            body: 'Call 866.520.3203 to get access to rates any time, day or night.',
            href: 'tel:8665203203',
            cta: 'Call',
          },
          {
            title: 'Search AGFinancial',
            body: 'Use our search feature to find exactly what you need.',
            to: '/search',
            cta: 'Search',
          },
        ],
      },
    ],
    actions: [{ label: 'Secure Login', href: 'https://secure.agfinancial.org/' }],
  },

  '/online-contributions': {
    compact: true,
    hero: { title: 'Employer contributions', highlight: null },
    intro: 'Minimize monthly data entry and maximize accuracy as you make retirement contributions on behalf of your employees.',
    sections: [
      {
        title: 'Set-up is easy',
        body: [
          'Create a new user account for your company in Online Access.',
          'Select “403(b) Employer” as the Account Type.',
          'Contact Client Services at 866.621.1787 or clientservices@agfinancial.org for your Employer Code to complete setup.',
          'When your account is established, you may remit funds by EFT or check.',
          'Contact your AGFinancial retirement consultant for more information.',
        ],
        actions: [
          { label: 'Create account', href: 'https://secure.agfinancial.org/' },
          { label: 'Email', href: 'mailto:clientservices@agfinancial.org', ghost: true },
          { label: 'Call', href: 'tel:8666211787', ghost: true },
        ],
      },
    ],
    actions: [{ label: 'Contact us', to: '/contact-us' }],
  },

  '/prospectus': {
    compact: true,
    hero: { title: 'Prospectus', highlight: null },
    intro: 'Reference prospectus and investment documents.',
    sections: [
      {
        title: 'Documents',
        body: [
          'Steward Funds Prospectus',
          'Fidelity Asset Manager Prospectus',
          'Fidelity 500 Prospectus',
          'Fidelity Small Cap Prospectus',
          'Fidelity International Index Fund Prospectus',
          'Fidelity NASDAQ Composite Index Fund Prospectus',
          'Vanguard Mid-Cap Index Fund Prospectus',
          'Vanguard Total World Stock Index Fund Prospectus',
          'Vanguard Total Bond Market Index Fund Prospectus',
          'Vanguard Real Estate Index Fund Prospectus',
          'JPMorgan Hedged Equity 3 Fund Prospectus',
          'Russell Life Points Strategies',
        ],
      },
    ],
    actions: [{ label: 'Download offering circular', href: 'https://media.agfinancial.org/AGLF-Offering-Circular.pdf' }],
  },

  '/subscribe': {
    compact: true,
    hero: { title: 'Subscribe', highlight: null },
    intro: 'Subscribe to the newsletter.',
    sections: [
      {
        title: 'Stay in the loop',
        body: ['Use the home page signup block for now while we complete this page migration.'],
      },
    ],
    actions: [{ label: 'Go to home signup', to: '/#stay-in-the-loop' }],
  },

  '/terms-of-service': legalContent('Terms of Service'),
  '/privacy-policy': legalContent('Privacy Policy'),
  '/accessibility': legalContent('Accessibility'),

  '/vineyard': {
    compact: true,
    hero: { title: 'Welcome, Vineyard', highlight: 'Vineyard' },
    intro: 'AGFinancial was created to support churches, ministers, and individuals with industry-leading financial solutions and personalized support to help build financial health at every stage and advance the Kingdom of God.',
    sections: [
      {
        title: 'Put your money where your faith is',
        cards: [
          {
            title: 'Investing in Kingdom Growth',
            body: 'AGFinancial investments provide a competitive rate of return while helping grow ministries all over the country.',
            to: '/services/investments',
            cta: 'Individual Investments',
          },
          {
            title: 'Create Peace of Mind',
            body: 'Insurance coverage helps churches manage risk and prepare for the future.',
            to: '/services/insurance/property-casualty-insurance',
            cta: 'Church Insurance',
          },
          {
            title: 'Resourcing Ministry',
            body: 'More than $500 million has been distributed to ministry over the past decade through AG Foundation and the stewardship of donors.',
            to: '/services/legacy-giving',
            cta: 'Planned Giving',
          },
          {
            title: 'Build toward the Future',
            body: 'Our current church lending portfolio is over $1.5 billion.',
            to: '/services/loans',
            cta: 'Church Loans',
          },
        ],
      },
    ],
  },
  '/yourplan': {
    compact: true,
    hero: { title: 'Your Plan', highlight: 'Plan' },
    intro: 'Build a practical plan aligned with your faith, goals, and stage of life.',
    sections: [
      {
        title: 'Start here',
        links: [
          { label: 'Loans', to: '/services/loans' },
          { label: 'Investments', to: '/services/investments' },
          { label: 'Retirement', to: '/services/retirement' },
          { label: 'Legacy Giving', to: '/services/legacy-giving' },
          { label: 'Insurance', to: '/services/insurance' },
        ],
      },
    ],
    actions: [{ label: 'Contact us', to: '/contact-us' }],
  },
  '/test': {
    compact: true,
    hero: { title: 'Test', highlight: null },
    intro: 'Testing route for native page behavior and content rendering.',
    sections: [
      {
        title: 'Primary routes',
        links: [
          { label: 'Home', to: '/' },
          { label: 'Services', to: '/services' },
          { label: 'Rates', to: '/rates' },
          { label: 'Search', to: '/search' },
        ],
      },
    ],
  },
};

const insuranceChildPages = {
  '/services/insurance/certificate-request': {
    compact: true,
    hero: { title: 'Certificate Request', highlight: null },
    intro: 'Please complete this form in full, including location details. Incomplete submissions may delay your insurance certificate request.',
    sections: [
      {
        title: 'Request checklist',
        body: [
          'Name of your organization (legal name shown on policy).',
          'Address, city, zip code, and authorized contact details.',
          'Event/activity name, description, and location details.',
          'Event start and end dates.',
          'Certificate holder name, address, and contact details.',
          'Attach contract or special wording requirements as needed.',
        ],
      },
      {
        title: 'Need help with special wording?',
        body: [
          'There may be an additional charge for Additional Insured endorsement.',
          'If so, you will be contacted for authorization.',
        ],
        actions: [
          { label: 'Email cert team', href: 'mailto:cert@agfinancial.org' },
        ],
      },
    ],
    actions: [{ label: 'Email certificate request', href: 'mailto:cert@agfinancial.org' }],
  },
  '/services/insurance/group-term-life-insurance': {
    compact: true,
    hero: {
      title: 'Group Life. Take care of the team.',
      highlights: [
        { text: 'Group', className: 'is-atlantean' },
        { text: 'team', className: 'is-mango' },
      ],
    },
    intro: 'Protect the people who power your ministry. Coverage for your team that replaces income and secures families when the unexpected strikes is a benefit that shows your people are valued beyond their workdays.',
    sections: [
      {
        title: 'Request a quote for group life',
        body: [
          'Provide a few specifics, and we’ll contact you about a policy customized specifically for your team.',
          'For Standard Group Life Insurance questions, call Innovo Benefits Administration at 800.829.5601.',
        ],
        form: {
          title: 'Group Term Life quote request',
          fields: [
            { id: 'contactFirstName', label: 'Contact First Name', type: 'text', required: true },
            { id: 'contactLastName', label: 'Contact Last Name', type: 'text', required: true },
            { id: 'contactEmail', label: 'Contact Email Address', type: 'email', required: true },
            { id: 'contactPhone', label: 'Contact Phone Number', type: 'tel', placeholder: '555-555-5555', required: true },
            { id: 'organizationName', label: 'Organization Name', type: 'text', required: true },
            { id: 'organizationAddress1', label: 'Organization Address', type: 'text', required: true },
            { id: 'organizationAddress2', label: 'Street Address Line 2 (optional)', type: 'text' },
            { id: 'organizationCity', label: 'Organization City', type: 'text', required: true },
            { id: 'organizationCounty', label: 'Organization County', type: 'text', required: true },
            { id: 'organizationState', label: 'Organization State', type: 'text', required: true },
            { id: 'organizationZip', label: 'Organization Zip Code', type: 'text', placeholder: '5-digit zip code', required: true },
            {
              id: 'isBroker',
              label: 'Are you an insurance broker?',
              type: 'radio',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
          ],
          submitLabel: 'Submit quote request',
        },
      },
      {
        title: 'Group Term Life',
        body: [
          'AGFinancial Insurance offers customized group life insurance plans for nonprofit organizations, schools, and companies, providing comprehensive coverage for your employees.',
          'We are here to provide customer service both during and after the initial enrollment.',
        ],
      },
      {
        title: 'AG Insurance Program',
        body: [
          'Discounted premiums. Exclusively for AG churches. Expanded coverages. No extra charge.',
          "The AG Insurance Program is offered in exclusive partnership with Standard Insurance Company. Through this program, we offer broader coverage, lower pricing, and value-added services.",
        ],
      },
      {
        title: 'Need to get more nitty gritty?',
        body: [
          'For plan details, enrollment support, and servicing questions, connect with our insurance specialists and we will walk through your options.',
        ],
        actions: [
          { label: 'Email insurance team', href: 'mailto:info@agfinancialinsurance.com' },
          { label: 'Call Innovo', href: 'tel:8008295601', ghost: true },
        ],
      },
    ],
    actions: [{ label: 'Email insurance team', href: 'mailto:info@agfinancialinsurance.com' }],
  },
  '/services/insurance/life-insurance-quote': {
    pageClass: 'native-info-page--life-quote',
    compact: true,
    hero: {
      title: 'Get a life quote.',
      highlights: [{ text: 'Get a', className: 'is-mango' }],
    },
    intro: {
      heading: 'Take care of your family.',
      headingHighlights: [{ text: 'family', className: 'is-mango' }],
      body: [
        "Your financial safety net for the unexpected, individual life can replace income, cover the mortgage, and keep your loved ones secure—and it's made specifically for you with quality coverage and competitive pricing.",
      ],
    },
    sections: [
      {
        className: 'insurance-native-life-quote',
        copyWrap: true,
        title: 'Request a quote for individual life.',
        titleHighlights: [{ text: 'individual life', className: 'is-white' }],
        body: ['Provide a few specifics, and we’ll contact you about a policy customized specifically for you.'],
        form: {
          steps: [
            {
              id: 'contact',
              fields: [
                { id: 'firstName', label: 'First Name*', type: 'text', required: true },
                { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
                { id: 'email', label: 'Email*', type: 'email', required: true },
                { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
              ],
              nextLabel: 'Next',
            },
            {
              id: 'organization',
              fields: [
                { id: 'organizationName', label: 'Organization Name', type: 'text' },
                { id: 'organizationAddress', label: 'Organization Address', type: 'text' },
                { id: 'city', label: 'City*', type: 'text', required: true },
                { id: 'state', label: 'State*', type: 'text', required: true },
                { id: 'zip', label: 'Zip*', type: 'text', required: true },
              ],
              backLabel: 'Back',
              nextLabel: 'Next',
            },
            {
              id: 'policy',
              fields: [
                { id: 'currentInsuranceCompany', label: 'Current Insurance Company*', type: 'text', required: true },
                {
                  id: 'policyExpirationDate',
                  label: 'Expiration Date of Current Policy*',
                  type: 'text',
                  placeholder: 'mm/dd/yyyy',
                  inputMode: 'numeric',
                  pattern: '^(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/\\d{4}$',
                  title: 'Use mm/dd/yyyy',
                  required: true,
                },
              ],
              backLabel: 'Back',
              submitLabel: 'Submit',
            },
          ],
        },
      },
    ],
  },
  '/services/insurance/ministers-group-life-plan': {
    compact: true,
    hero: { title: "Minister's Group Life Plan", highlight: 'Life' },
    intro: 'Enrollment and support options for ministers and missionaries in group term life plans.',
    sections: [
      {
        title: 'Enroll in the Ministers or Missionary Life Insurance Plans',
        body: [
          'Download and complete the appropriate minister or missionary form.',
          'If applicable, complete the state-specific medical history form.',
          'Complete the Electronic Funds Transfer (EFT) form.',
          'Fax or mail completed forms to AGFinancial Insurance.',
        ],
      },
      {
        title: 'Current client support',
        body: [
          'For those currently enrolled in the Group Term Life Plan, review beneficiary, billing, bank change, and address forms.',
          'For billing support, contact Innovo Benefits Administration at 800.829.5601.',
          'For more information about policy details, contact 800.447.0446.',
        ],
      },
    ],
    actions: [{ label: 'Email insurance team', href: 'mailto:info@agfinancialinsurance.com' }],
  },
  '/services/insurance/mission-assure': {
    compact: true,
    hero: { title: 'Packed & covered.', highlight: 'covered' },
    intro: 'Every trip is a step of faith, but you do not have to take it uninsured. Mission Assure helps take the what-if out of church trips and events.',
    sections: [
      {
        title: 'Get covered',
        body: [
          'Apply for coverage and manage all your trips in one place.',
          'As low as $1.25/day for domestic trips and $4.95/day for international trips.',
        ],
        actions: [
          { label: 'Let’s start', href: 'https://www.missionassure.com/' },
          { label: 'Report a claim', to: '/services/insurance/mission-assure/report-a-claim', ghost: true },
        ],
      },
      {
        title: 'Practical safety tips',
        body: [
          'Practical safety tips to help your summer camp prevent injuries, protect children, and be prepared for the unexpected.',
        ],
        actions: [{ label: 'Go safely!', to: '/resources' }],
      },
    ],
    actions: [{ label: 'Report a claim', to: '/services/insurance/mission-assure/report-a-claim' }],
  },
  '/services/insurance/mission-assure/report-a-claim': {
    compact: true,
    hero: { title: 'Report a claim', highlight: 'claim' },
    intro: 'Information to provide: policy holder name, policy number, type and description of loss, date of event, and contact details.',
    sections: [
      {
        title: 'Email',
        body: [
          'ACEClaimsFirstNotice@acegroup.com',
          'This email address is for new claim reporting only.',
        ],
      },
      {
        title: 'Phone',
        body: ['(800) 433-0385 (Business Hours)', '(800) 523-9254 (After Business Hours)'],
      },
      {
        title: 'Fax',
        body: ['(877) 395-0131 (Toll Free)', '(302) 476-7524 (Local)'],
      },
      {
        title: 'Mail',
        body: [
          'ACE North American Claims',
          'P.O. Box 5122',
          'Scranton, PA 18505-0554',
        ],
      },
    ],
    actions: [{ label: 'Email claims support', href: 'mailto:ACEClaimsFirstNotice@acegroup.com' }],
  },
  '/services/insurance/property-casualty-insurance': {
    compact: true,
    hero: {
      title: 'Property & Casualty',
      highlights: [
        { text: 'Property', className: 'is-atlantean' },
        { text: 'Casualty', className: 'is-mango' },
      ],
    },
    intro: 'AG Insurance Program with Church Mutual Insurance offers meaningful extras for Assemblies of God churches.',
    sections: [
      {
        title: 'Request a P&C quote',
        body: [
          'Provide a few specifics, and we’ll contact you about a policy built specifically for your ministry.',
        ],
        form: {
          title: 'Property and Casualty quote request',
          fields: [
            { id: 'contactFirstName', label: 'Contact First Name', type: 'text', required: true },
            { id: 'contactLastName', label: 'Contact Last Name', type: 'text', required: true },
            { id: 'contactEmail', label: 'Contact Email Address', type: 'email', required: true },
            { id: 'contactPhone', label: 'Contact Phone Number', type: 'tel', placeholder: '555-555-5555', required: true },
            { id: 'organizationName', label: 'Organization Name', type: 'text', required: true },
            { id: 'organizationAddress1', label: 'Organization Address', type: 'text', required: true },
            { id: 'organizationAddress2', label: 'Street Address Line 2 (optional)', type: 'text' },
            { id: 'organizationCity', label: 'Organization City', type: 'text', required: true },
            { id: 'organizationCounty', label: 'Organization County', type: 'text', required: true },
            { id: 'organizationState', label: 'Organization State', type: 'text', required: true },
            { id: 'organizationZip', label: 'Organization Zip Code', type: 'text', placeholder: '5-digit zip code', required: true },
            {
              id: 'isBroker',
              label: 'Are you an insurance broker?',
              type: 'radio',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
          ],
          submitLabel: 'Submit quote request',
        },
      },
      {
        title: 'AG Insurance Program',
        body: [
          'Discounted premiums. Exclusively for AG churches. Expanded coverages. No extra charge.',
          'The AG Insurance Program is offered in exclusive partnership with Church Mutual Insurance Company.',
          'Through this program, we offer broader coverage, lower pricing, and value-added services with the strength and experience of a leading church insurance provider.',
        ],
      },
      {
        title: 'Identifying and managing against risk',
        body: [
          'Risk management helps identify risks, implement smart policies, and obtain the right insurance coverage.',
          'Taking special precautions to minimize your risks and liabilities is important. Our church risk advisors know how to assist your church and help ensure the continuity of your ministry.',
          'Access our extensive risk management resources at agfinancial.org/risk-management.',
        ],
      },
      {
        title: 'Additional coverages available',
        body: [
          'Sexual misconduct liability',
          'Pastoral/counseling professional liability',
          "Educator's legal liability",
          'Directors, officers, and trustees liability',
          'Umbrella liability',
        ],
      },
      {
        title: 'Extensive risk management resources',
        links: [
          { label: 'Church Risk Management Guide', href: 'https://www.agfinancial.org/risk-management' },
          { label: 'Church Risk Management Resource', href: 'https://www.agfinancial.org/resources' },
        ],
      },
      {
        title: 'Coverage notice',
        fineprint: 'This material may include only a general description of insurance coverages and does not include all terms, conditions, and limitations found in Church Mutual Insurance Company policies. The insurance policy forms the contract between the insured and Church Mutual.',
      },
    ],
    actions: [
      { label: 'Email insurance team', href: 'mailto:info@agfinancialinsurance.com' },
      { label: 'Call insurance team', href: 'tel:8666628210', ghost: true },
    ],
  },
};

const legacyChildPages = {
  '/services/legacy-giving/charitable-gift-annuities': {
    compact: true,
    hero: { title: 'Charitable Gift Annuities', highlight: 'Gift' },
    intro: 'Create lifetime fixed payments while leaving a gift to the ministry of your choice.',
    sections: [
      {
        title: 'How it works',
        body: [
          'A charitable gift annuity allows you to contribute cash or other assets and receive fixed payments for life.',
          'At the end of the annuity term, the remaining value supports the ministry or cause you select.',
        ],
      },
      {
        title: 'Benefits',
        body: [
          'Potential tax savings and dependable lifetime fixed payments.',
          'A planned legacy gift to the ministry of your choice.',
        ],
      },
    ],
    actions: [{ label: 'Gift options', href: 'https://aggift.org/?pageID=123' }],
  },
  '/services/legacy-giving/charitable-trusts': {
    compact: true,
    hero: { title: 'Charitable Trusts', highlight: 'Trusts' },
    intro: 'Build a charitable trust strategy that aligns giving goals with tax and income planning.',
    sections: [
      {
        title: 'Trust options',
        body: [
          'Charitable Remainder Unitrust',
          'Charitable Remainder Annuity Trust',
          'Charitable Lead Trust',
          'Grantor Lead Trust',
          'Non-Grantor Lead Trust',
        ],
      },
      {
        title: 'Planning support',
        body: [
          'Trust structures can provide support for ministry while the donor receives potential tax and estate planning benefits.',
        ],
      },
    ],
    actions: [{ label: 'Create your plan', href: 'https://aggift.org/?pageID=124' }],
  },
  '/services/legacy-giving/endowments': {
    compact: true,
    hero: { title: 'Endowments', highlight: null },
    intro: 'Your endowment is a gift that gives forever. Interest earnings support your chosen ministry while the principal remains protected and growing.',
    sections: [
      {
        title: 'How it works',
        body: [
          'Designated assets are invested to ensure protection and growth.',
          'Payments are made from ongoing interest earned from the gifted assets.',
          'An endowment requires the principal to remain intact indefinitely.',
        ],
      },
      {
        title: 'Assets you may give',
        body: [
          'Minimum funding requirements are $10,000 for cash or securities, and $100,000 for real estate.',
          'Cash, real estate, securities, art, antiques, business interests, and other assets may be used.',
        ],
      },
    ],
    actions: [
      { label: 'Talk to a Gift Planner', to: '/contact-us' },
      { label: 'Set up an endowment', href: 'https://sft.agfinancial.org/documents/Send.do', ghost: true },
    ],
  },
  '/services/legacy-giving/generosity-fund': {
    compact: true,
    hero: { title: 'Generosity Fund', highlight: 'Generosity' },
    intro: 'A Generosity Fund is a Donor Advised Fund that provides a convenient, tax-efficient way to manage your giving from tithing to disaster relief and everything in between.',
    sections: [
      {
        title: 'How it works',
        body: [
          'Open a Generosity Fund online and fund it with cash or appreciated assets.',
          'AG Foundation tracks your giving and handles administration.',
          'You continue giving when and to whom you want, and can give anonymously.',
        ],
      },
      {
        title: 'Assets you may give',
        body: [
          'Start with a minimum of $10,000.',
          'Additional funding can be made with as little as $100, as often as you like.',
          'Funding can include cash, household income, sale proceeds, stocks, securities, and other sources.',
        ],
      },
    ],
    actions: [
      { label: 'Open a Generosity Fund', href: 'https://sft.agfinancial.org/documents/Send.do' },
      { label: 'See Terms & Conditions', href: 'https://aggift.org/?pageID=123', ghost: true },
    ],
  },
  '/services/legacy-giving/ministry-impact-fund': {
    compact: true,
    hero: { title: 'Ministry Impact Fund', highlight: 'Impact' },
    intro: 'Most wealth is not cash. A Ministry Impact Fund makes it easy for donors to give in any form while reducing administrative burden for ministries.',
    sections: [
      {
        title: 'How it works',
        body: [
          'Donors transfer cash or assets to a Ministry Impact Fund and may receive a charitable deduction with reduced or eliminated capital gains.',
          'AG Foundation liquidates the assets and handles administration.',
          'Your ministry gains immediate access to cash.',
        ],
      },
      {
        title: 'Asset types',
        body: [
          'Cash, appreciated assets, stock, real estate, gifts-in-kind, and other gifts.',
          'Initial contribution required.',
        ],
      },
      {
        title: 'Transferring stock',
        body: [
          'Complete the Intent to Gift of Securities form and submit through secure message.',
          'Complete a Brokerage Letter of Authorization and submit to your broker/dealer.',
        ],
      },
    ],
    actions: [
      { label: 'Open a Ministry Impact Fund', href: 'https://sft.agfinancial.org/documents/Send.do' },
      { label: 'Contact planned giving', href: 'mailto:plannedgiving@agfinancial.org', ghost: true },
    ],
  },
};

const loansChildPages = {
  '/services/loans/loans-consultant': {
    compact: true,
    hero: { title: 'Find A Consultant', highlight: 'Consultant' },
    intro: 'Talk with a consultant. Fill out the form to start a conversation with our consultants or find your region contact below.',
    sections: [
      {
        title: 'Select your location',
        cards: [
          {
            title: 'Northwest Region',
            body: 'Emily Brinkley • 417.447.2444',
            href: 'tel:4174472444',
            cta: 'Call',
          },
          {
            title: 'South Region',
            body: 'Bruce Gibbons • 417.860.4176',
            href: 'tel:4178604176',
            cta: 'Call',
          },
          {
            title: 'South Central Region',
            body: 'Jason Gibbons • 417.860.6842',
            href: 'tel:4178606842',
            cta: 'Call',
          },
          {
            title: 'Southwest Region',
            body: 'Jason Hopping • 858.349.5728',
            href: 'tel:8583495728',
            cta: 'Call',
          },
          {
            title: 'North Central Region',
            body: 'Randy Smith • 417.860.8174',
            href: 'tel:4178608174',
            cta: 'Call',
          },
          {
            title: 'East Region',
            body: 'Pat Williams • 334.318.6237',
            href: 'tel:3343186237',
            cta: 'Call',
          },
        ],
      },
      {
        title: 'Send a message',
        body: ['To: Consultant'],
        actions: [{ label: 'Contact us', to: '/contact-us' }],
      },
    ],
  },
};

const retirementChildPages = {
  '/services/retirement/403b': {
    compact: true,
    hero: { title: 'AGFinancial 403(b)', highlight: '403(b)' },
    intro: 'Saving while serving. The AGFinancial 403(b) offers higher contribution limits and potential employer matching and is designed specifically for ministers and ministry employees.',
    sections: [
      {
        title: 'Quick links',
        links: [
          { label: '403(b) individual enrollment', to: '/services/retirement/403b/403b-individual-enrollment' },
          { label: '403(b) group enrollment', to: '/services/retirement/403b-for-groups/403b-group-enrollment' },
          { label: '403(b) terms & definitions', to: '/services/retirement/403b/403b-terms-definitions' },
          { label: 'Retirement consultants', to: '/services/retirement/retirement-consultants' },
        ],
      },
      {
        title: 'Investment strategies',
        body: [
          'MBA Income Fund',
          'Risk-Based Strategies',
          'Target-Date Strategies',
          'Individual Investment Option',
        ],
        actions: [{ label: 'Enroll now', to: '/services/retirement/403b/403b-individual-enrollment' }],
      },
      {
        title: 'Next steps',
        actions: [
          { label: 'For myself', to: '/services/retirement/403b/403b-individual-enrollment' },
          { label: 'For a group', to: '/services/retirement/403b-for-groups/403b-group-enrollment', ghost: true },
        ],
      },
    ],
  },
  '/services/retirement/403b/403b-terms-definitions': {
    compact: true,
    hero: { title: '403(b) Terms & Definitions', highlight: 'Terms' },
    intro: 'Key 403(b) terms for QCCO and NQCCO plan administration and enrollment workflows.',
    sections: [
      {
        title: 'Core definitions',
        body: [
          'QCCO = Qualified Church-Controlled Organization.',
          'NQCCO = Nonqualified Church-Controlled Organization.',
          'Eligibility, compensation, and benefits are defined in your selected agreement.',
        ],
      },
      {
        title: 'Need help?',
        body: ['For assistance contact 800.622.7526 or email 403bregs@agfinancial.org.'],
      },
    ],
    actions: [{ label: 'Back to 403(b)', to: '/services/retirement/403b' }],
  },
  '/services/retirement/403b/403b-individual-enrollment': {
    compact: true,
    hero: { title: 'AGFinancial 403(b) Individual Enrollment', highlight: 'Enrollment' },
    intro: 'What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in super simple, easy-to-follow steps.',
    sections: [
      {
        title: 'Complete these four steps to enroll',
        body: [
          'Confirm eligibility.',
          'Complete enrollment form.',
          'Return enrollment form by mail, fax, or secure online submission.',
          'Complete payroll deduction agreement form.',
        ],
      },
      {
        title: 'Enrollment documents',
        links: [
          { label: 'Download Plan Summary', href: '/services/retirement/403b' },
          { label: 'Download Form', href: '/services/retirement/403b' },
        ],
      },
      {
        title: 'Return Enrollment Form',
        body: [
          'By Mail: AGFinancial, PO Box 2515, Springfield, MO 65801',
          'By Fax: 417.520.0406',
          'To submit securely online, click here.',
        ],
      },
    ],
  },
  '/services/retirement/403b-for-groups': {
    compact: true,
    hero: { title: '403b for Groups', highlight: 'Groups' },
    intro: 'Group enrollment options and compliance support for churches and organizations.',
    sections: [
      {
        title: 'Start group enrollment',
        links: [
          { label: '403b Group Enrollment', to: '/services/retirement/403b-for-groups/403b-group-enrollment' },
          { label: '403(b) Terms & Definitions', to: '/services/retirement/403b/403b-terms-definitions' },
        ],
      },
    ],
    actions: [{ label: 'Next steps', to: '/services/retirement/403b-for-groups/403b-group-enrollment' }],
  },
  '/services/retirement/403b-for-groups/403b-group-enrollment': {
    compact: true,
    hero: { title: 'AGFinancial 403(b) Group Enrollment', highlight: 'Group' },
    intro: 'What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in super simple, easy-to-follow steps.',
    sections: [
      {
        title: 'Complete these four steps to enroll',
        body: [
          'Confirm eligibility.',
          'Complete enrollment form.',
          'Customize your plan with the correct agreement.',
          'Return forms and complete payroll deduction agreement process.',
        ],
      },
      {
        title: 'Customize your plan',
        body: [
          'Agreement 1: Your ministry is a church or QCCO.',
          'Agreement 2: Your ministry is an NQCCO.',
          'See 403(b) Terms & Definitions for full details.',
        ],
      },
      {
        title: '403(b) Compliance Regulations',
        body: [
          'IRS regulations require written plan documents and compliant administration.',
          'If AGFinancial is your exclusive service provider, compliance implementation can be easier.',
          'For assistance, contact 800.622.7526 or 403bregs@agfinancial.org.',
        ],
      },
    ],
  },
  '/services/retirement/409a': {
    compact: true,
    hero: { title: 'Beyond the limits.', highlight: 'limits' },
    intro: 'Where standard retirement plan contributions max out, a 409A Deferred Compensation Plan steps in. Exclusively for ministers and qualified church organizations, it allows participants to defer additional income and reduce current taxes.',
    sections: [
      {
        title: 'Common scenarios',
        body: [
          'Contributing above the AG 403(b) maximum limitation.',
          'Catch-up funding when employer contributions have not been regular.',
          'Lump-sum retirement gifts.',
        ],
      },
      {
        title: 'Boundary-free future',
        body: [
          'A well-drafted Deferred Compensation Plan can allow deferment of taxable compensation until distribution.',
        ],
        actions: [{ label: 'Find my consultant', to: '/services/retirement/retirement-consultants' }],
      },
    ],
  },
  '/services/retirement/iras': {
    compact: true,
    hero: { title: 'Individual Retirement Account (IRA)', highlight: 'IRA' },
    intro: 'Tax advantages and broad investment options can anchor your retirement savings. Whether you are starting a nest egg or adding to existing plans, an IRA may be the right fit for your goals.',
    sections: [
      {
        title: 'Traditional IRA',
        body: ['A Traditional IRA allows contributions and earnings to grow tax-deferred until retirement distribution.'],
        actions: [{ label: 'Open Traditional IRA', to: '/services/retirement/iras/fund-an-ira' }],
      },
      {
        title: 'Roth IRA',
        body: ['A Roth IRA allows tax-free growth and qualified tax-free withdrawals in retirement.'],
        actions: [{ label: 'Open Roth IRA', to: '/services/retirement/iras/fund-an-ira' }],
      },
      {
        title: 'At a glance',
        body: [
          'Traditional IRA: contributions may be tax-deductible and earnings are tax-deferred.',
          'Roth IRA: contributions are not tax-deductible and qualified earnings can be tax-free.',
          'Contact your tax advisor. Additional AGFinancial early redemption penalties and IRA custodial fees may apply.',
        ],
      },
      {
        title: 'Contribution limits',
        body: [
          'Modified adjusted gross income (MAGI) may affect Roth IRA eligibility and Traditional IRA deductibility.',
          'Contact your own tax advisor before taking any action that would have a tax consequence.',
        ],
        actions: [
          { label: 'Fund an IRA', to: '/services/retirement/iras/fund-an-ira' },
          { label: 'Reach my consultant', to: '/services/retirement/retirement-consultants', ghost: true },
        ],
      },
    ],
  },
  '/services/retirement/iras/fund-an-ira': {
    compact: true,
    hero: { title: 'Fund an IRA', highlight: 'IRA' },
    intro: 'Start your IRA funding process and choose the retirement strategy that fits your goals.',
    sections: [
      {
        title: 'Funding support',
        body: [
          'Use this route to start either a Traditional IRA or Roth IRA funding conversation.',
          'Our team can help with contribution options and rollover or transfer steps.',
        ],
      },
    ],
    actions: [{ label: 'Reach my consultant', to: '/services/retirement/retirement-consultants' }],
  },
  '/services/retirement/retirement-consultants': {
    compact: true,
    hero: { title: 'Retirement Consultants', highlight: 'Consultants' },
    intro: 'Talk with a consultant. Fill out the form to start a conversation with our consultants or find your region contact below.',
    sections: [
      {
        title: 'Select your location',
        cards: [
          {
            title: 'West Region',
            body: 'Tim McDowell • 417.379.4274',
            href: 'tel:4173794274',
            cta: 'Call',
          },
          {
            title: 'Central Region',
            body: 'Jacob Rebert CFP • 417.350.5480',
            href: 'tel:4173505480',
            cta: 'Call',
          },
          {
            title: 'East Region',
            body: 'Chris Teague CFP • 417.619.2987',
            href: 'tel:4176192987',
            cta: 'Call',
          },
        ],
      },
      {
        title: 'Send a message',
        body: ['To: Consultant'],
        actions: [{ label: 'Contact us', to: '/contact-us' }],
      },
    ],
  },
  '/services/retirement/rollovers': {
    compact: true,
    hero: { title: 'One account. One login.', highlight: 'One' },
    intro: 'A rollover lets you move funds from one retirement account into an AGFinancial 403(b) without paying taxes or penalties. It is an easier way to access and manage your retirement.',
    sections: [
      {
        title: 'Rollover',
        body: [
          'Traditional IRAs can be rolled over any time.',
          'Other plans may be rolled over after a qualifying event such as separation from service, disability, or turning age 59½.',
        ],
        actions: [{ label: 'Initiate a rollover', to: '/contact-us' }],
      },
      {
        title: 'Transfer',
        body: [
          'A transfer occurs between accounts of the same kind.',
          'AGFinancial must be an approved vendor of your employer in order to transfer a 403(b).',
        ],
        actions: [{ label: 'Start a transfer', to: '/contact-us' }],
      },
      {
        title: 'Simple process',
        body: [
          'Download and complete the Rollover/Transfer form.',
          'Return completed form with recent statements to AGFinancial PO Box 2515, Springfield, MO 65801.',
          'A confirmation letter will be sent when complete.',
        ],
      },
      {
        title: 'You can also rollover to your AGFinancial IRA.',
        actions: [{ label: 'Fund an IRA', to: '/services/retirement/iras/fund-an-ira' }],
      },
    ],
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
      compact: true,
      hero: { title: 'Be part of something BIGGER.', highlight: 'BIGGER' },
      intro: 'Faith + career. You can make a difference in your work at the intersection of ministry and expertise.',
      sections: [
        {
          title: 'Just a few reasons you’ll love working here',
          body: [
            'Service-based PTO and paid holidays.',
            'Medical, dental, vision, supplemental, and more.',
            '403(b) options with company contribution when eligible.',
            'Student loan and tuition assistance programs available.',
          ],
        },
        {
          title: 'Ready when you are',
          body: ['See all open positions and apply online.'],
          actions: [{ label: 'Apply Online', href: '/about-us/careers' }],
        },
      ],
      actions: [{ label: 'Contact us', to: '/contact-us' }],
    };
  }

  if (path === '/about-us/impact') {
    return {
      compact: true,
      hero: { title: 'We’re making a difference... thanks to you.', highlight: 'difference' },
      intro: 'Put your money where your faith is. As a customer, you become part of a vision to improve financial health and grow the Kingdom of God.',
      sections: [
        {
          title: 'Impact highlights',
          cards: [
            {
              title: '4,000',
              body: 'Fueling churches and ministries every year.',
              to: '/services/loans',
              cta: 'Explore Loans',
            },
            {
              title: '$40 Million',
              body: 'Under trusted care for long-term stewardship.',
              to: '/services/legacy-giving',
              cta: 'Plan with us',
            },
            {
              title: '687',
              body: 'Mission trips covered.',
              to: '/services/insurance/mission-assure',
              cta: 'Cover your trip',
            },
            {
              title: '299',
              body: 'Ministers retired this year with AGFinancial.',
              to: '/services/retirement',
              cta: 'Start your plan',
            },
          ],
        },
      ],
      actions: [{ label: 'Back to About Us', to: '/about-us' }],
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
      compact: true,
      hero: { title, highlight: null },
      intro: 'We’re committed to accessibility and continually improving the user experience for everyone.',
      sections: [
        {
          title: 'Conformance Status',
          body: [
            'The AGFinancial website is fully conformant with WCAG Level A and partially conformant with WCAG Level AA.',
          ],
        },
        {
          title: 'Limitations',
          body: [
            'Limitations to WCAG Level AA conformance may include color contrast.',
            'We welcome your feedback if you encounter accessibility barriers.',
          ],
          actions: [{ label: 'Contact Us', to: '/contact-us' }],
        },
      ],
      actions: [{ label: 'Contact us', to: '/contact-us' }],
    };
  }

  if (title === 'Privacy Policy') {
    return {
      compact: true,
      hero: { title, highlight: null },
      intro: 'The privacy portion of this website includes AGFinancial’s privacy policy and our internet privacy practices applicable to all internet users.',
      sections: [
        {
          title: 'Collection and Use of Personal Information',
          body: [
            'AGFinancial collects nonpublic personal information to administer accounts, process transactions, and provide requested services.',
            'Information may come from applications, transactions, agents, and communications.',
          ],
        },
        {
          title: 'Sharing and Retention',
          body: [
            'As permitted by law, information may be shared within AGFinancial, with service providers, employers for sponsored plans, and applicable regulators.',
            'Personal data is retained as long as required to provide services and meet regulatory obligations.',
          ],
        },
        {
          title: 'Updates and Contact',
          body: [
            'It may be necessary to amend this policy from time to time.',
            'Revision Date January 2, 2020.',
          ],
          actions: [{ label: 'Contact Privacy Compliance', href: 'mailto:webmaster@agfinancial.org' }],
        },
      ],
      actions: [{ label: 'Contact us', to: '/contact-us' }],
    };
  }

  if (title === 'Terms of Service') {
    return {
      compact: true,
      hero: { title, highlight: null },
      intro: 'Your use of this website is subject to these Terms of Service and any updates posted by AGFinancial.',
      sections: [
        {
          title: 'Acceptance of Terms',
          body: [
            'Your continued use of the website following posted revisions means that you accept and agree to the changes.',
            'You are responsible for ensuring all persons who access the website through your connection comply with these terms.',
          ],
        },
        {
          title: 'Use Restrictions and User Contributions',
          body: [
            'The website is for personal, non-commercial use unless otherwise authorized.',
            'User contributions must comply with applicable law and the content standards in these terms.',
          ],
        },
        {
          title: 'Disclaimers and Liability',
          body: [
            'The website and services are provided on an as-is and as-available basis.',
            'Additional legal terms, limitations, and governing law provisions apply.',
          ],
        },
      ],
      actions: [{ label: 'Contact us', to: '/contact-us' }],
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
