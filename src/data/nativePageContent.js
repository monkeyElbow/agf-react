import legacyOpportunityImage from '../assets/legacy-opportunity.jpg';
import insuranceRiskGuideImage from '../assets/insurance-riskmanagementguide.jpg';
import churchMutualInsuranceLogo from '../assets/church-mutual-insurance.png';
import insuranceMissionAssureImage from '../assets/insurance-mission-assure.jpg';
import missionAssureMedicalIncludedImage from '../assets/mission-assure-medical-included.png';
import missionAssureSummerCampSafetyImage from '../assets/mission-assure-summer-camp-safety.jpg';
import MissionAssureLogo from '../components/MissionAssureLogo';
import aboutIntroImage from '../assets/about-intro.jpg';
import ministersHousingImage from '../assets/ministers-housing.jpg';
import { formsLibraryLinks } from './formsLibraryLinks';
import { getResourceArticleFeatureConfig } from './resourceArticles';

const TAX_GUIDE_ACCESS_EMAIL = 'info@agfinancial.org';
const findFormHref = (topic, label) => (
  formsLibraryLinks.find((item) => item.topic === topic && item.label === label)?.href || ''
);
const GROUP_LIFE_MINISTER_ENROLLMENT_FORM_URL = findFormHref('Insurance', 'Life Enrollment and Change Form (minister)');
const GROUP_LIFE_EFT_FORM_URL = findFormHref('Insurance', 'Electronic Funds Transfer');
const GROUP_LIFE_MINISTERS_PLAN_DETAILS_URL = 'https://www.standard.com/eforms/12505vl_646522a.pdf';
const GROUP_LIFE_STANDARD_PACKET_URL = 'https://www.standard.com/eforms/12505vl_646527a.pdf';
const GROUP_LIFE_MISSIONARIES_PLAN_DETAILS_URL = 'https://www.standard.com/eforms/12505vl_646524a.pdf';
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
        { id: 'phone', label: 'Phone', type: 'tel', required: false, placeholder: '(555) 555-5555' },
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
  '/services/loans': {
    pageClass: 'loans-native-page native-info-page--loans',
    hero: {
      lines: [
        {
          title: 'Your vision.',
          className: 'loans-native-hero-line is-vision lineblur',
          highlights: [
            { text: 'Your', className: 'is-super-grey' },
            { text: '.', className: 'is-super-grey' },
          ],
        },
        {
          title: 'Our purpose.',
          className: 'loans-native-hero-line is-purpose lineB',
          highlights: [
            { text: 'Our', className: 'is-super-grey' },
            { text: '.', className: 'is-super-grey' },
          ],
        },
      ],
      animationPreset: 'none',
      bgTone: 'white',
      justify: 'center',
    },
    intro: {
      heading: 'The right loan can change everything.',
      body: [
        "Your vision of reaching communities and changing lives drives us. As one of the nation's largest, most experienced church loan providers, we want to be part of your ministry. Let's take bold steps together for the Kingdom.",
      ],
      actions: [{ label: 'Get started', to: '/services/loans#form' }],
      justify: 'center',
      bgTone: 'blue',
      textTone: 'white',
    },
    sections: [],
  },

  '/services': {
    pageClass: 'services-native-page',
    intro: {
      heading: 'A robust financial strategy for your ministry and your family.',
      headingHighlights: [
        { text: 'your ministry', className: 'is-atlantean' },
        { text: 'your family', className: 'is-gold' },
      ],
      justify: 'center',
      bgTone: 'grey',
      textTone: 'white',
    },
    sections: [],
    actions: [],
  },

  '/services/investments': {
    pageClass: 'investments-native-page',
    intro: {
      heading: 'Invest like it matters. Because it does.',
      headingHighlights: [{ text: 'Because it does.', className: 'is-atlantean' }],
      body: [
        "Your investment dollars don't just multiply; they multiply ministry impact. Every dollar you invest generates a competitive return while funding church construction and ministry growth. When you invest like it matters, everything matters more.",
      ],
      emphasis: "That's the power of faith-driven investing.",
      justify: 'center',
      bgTone: 'sand',
      textTone: 'dark',
    },
    sections: [],
    actions: [],
  },

  '/services/retirement': {
    pageClass: 'retirement-native-page',
    intro: {
      heading: 'Invest in tomorrow. Start today.',
      body: [
        "For decades, we've helped build retirement strategies for ministers, ministry employees, churches, and organizations. Let's create yours.",
      ],
      emphasis: "It's your ministry, your future, your plan.",
      justify: 'center',
      bgTone: 'blue',
      textTone: 'white',
      actions: [],
    },
    sections: [],
    actions: [],
  },

  '/services/insurance': {
    pageClass: 'native-info-page--insurance',
    hero: {
      lines: [
        {
          title: 'Impressive coverage.',
          className: 'is-super-grey',
        },
        {
          title: 'Built for churches & ministries.',
          className: 'is-super-grey',
          highlights: [{ text: 'churches & ministries', className: 'is-atlantean' }],
        },
      ],
    },
    intro: {
      heading: 'Protect what matters most.',
      body: [
        'We’re committed to helping you get the coverage you need, at competitive rates, to protect your people and property. It’s more than insurance.',
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
            body: 'Our specialty is helping protect churches, schools, ministries, and other nonprofits, as well as businesses.',
            to: '/services/insurance/property-casualty-insurance',
            cta: 'Learn more',
            cardClass: 'card1',
          },
          {
            title: 'Life Insurance',
            body: 'Your life insurance policy is made specifically for you. We partner with only A- or higher rated carriers, so the coverage you receive equals the peace of mind you deserve.',
            actions: [
              { label: 'Individual', to: '/services/insurance/life-insurance-quote' },
              { label: 'Group', to: '/services/insurance/group-term-life-insurance' },
            ],
            cardClass: 'card1',
          },
          {
            title: 'Mission Assure',
            body: 'Full coverage for mission trips, camps, retreats, events, and everything in between, with low per-person, per-day premiums. **Mission Assure®** offers superior protection at minimum cost.',
            to: '/services/insurance/mission-assure',
            cta: 'Learn more',
            cardClass: 'card1',
          },
          {
            title: 'Bonds',
            body: 'We partner with Old Republic Surety to offer notary bonds upon request. For contracting, license, permit, and more, use the form below.',
            actions: [
              { label: 'Old Republic Surety', href: 'https://www.orsurety.com/commercial-bonds', className: 'is-outline' },
            ],
            cardClass: 'card1',
          },
        ],
        actions: [],
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
        title: 'Need proof of insurance?',
        className: 'insurance-native-certificate-proof',
        titleClassName: 'is-mango',
        body: [],
        actions: [
          {
            label: 'Certificate request',
            to: '/services/insurance/certificate-request',
            className: 'is-outline',
          },
        ],
      },
      {
        title: 'Risk Management',
        className: 'insurance-native-risk',
        hideTitle: true,
        feature: {
          title: 'Risk Management',
          titleHighlights: [{ text: 'Risk', className: 'is-melon' }],
          image: insuranceRiskGuideImage,
          imageAlt: 'Church Risk Management Guide',
          body: [
            "Focus on your ministry. We'll manage the risk.",
            'Our church **Risk Management Guide** can help you recognize areas of risk and learn how to proactively address them. From establishing a church safety and security team to financial protection to emergency preparedness, this guide can assist you in protecting your church and congregants.',
          ],
          actions: [{ label: 'Download the guide', documentId: 'document-risk-management-guide' }],
        },
      },
      {
        title: 'Ready to protect your ministry?',
        className: 'insurance-native-cta',
        hideTitle: true,
        body: [],
        form: {
          title: 'What coverage is best for your ministry?',
          subtitle: 'Let’s walk through the options.',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555', required: true },
            { id: 'organization', label: 'Organization', type: 'text' },
            { id: 'coverageFocus', label: 'Coverage focus', type: 'text', placeholder: 'Property, life, mission, or all' },
          ],
          submitLabel: 'Follow-up with me',
        },
      },
      {
        className: 'insurance-native-mission-assure',
        hideTitle: true,
        feature: {
          image: insuranceMissionAssureImage,
          imageAlt: 'Mission Assure coverage',
          logoComponent: MissionAssureLogo,
          logoAlt: 'Mission Assure®',
          title: 'Full coverage for mission trips, retreats, and everything in between.',
          body: [
            "With low per-person, per-day premiums, Mission Assure® offers superior protection at minimum cost. Every trip is a step of faith, but you don’t have to take it uninsured.",
          ],
          actions: [{ label: 'Let’s go', to: '/services/insurance/mission-assure' }],
        },
      },
      {
        title: 'Defend Yourself Against Fraud',
        className: 'insurance-native-fraud',
        hideTitle: true,
        fullBleed: true,
        feature: {
          ...(() => {
            const article = getResourceArticleFeatureConfig({
              slug: 'defend-yourself-against-fraud',
              fallbackImageAlt: 'Defend Yourself Against Fraud',
            });
            return {
              title: article.title || 'Defend Yourself Against Fraud',
              image: article.image,
              imageAlt: article.imageAlt,
              actions: [{ label: 'Read article', to: article.to }],
            };
          })(),
          body: [
            'Protect your ministry with practical guidance to reduce fraud risk and strengthen internal controls.',
          ],
        },
      },
    ],
    actions: [],
  },

  '/services/legacy-giving': {
    pageClass: 'native-info-page--legacy-giving',
    hero: {
      justify: 'right',
      lines: [
        {
          title: 'Generous giving.',
          highlights: [{ text: 'giving', className: 'is-atlantean' }],
        },
        {
          title: 'With strategy.',
          highlights: [{ text: 'strategy', className: 'is-melon' }],
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
            body: 'Our Generosity Fund® is a Donor Advised Fund that can be used to simplify your giving and increase your joy doing so. A Generosity Fund® is a giving tool available to anyone, regardless of income level.',
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
            body: 'A popular planned gift that provides payments for you, a Charitable Gift Annuity (CGA) allows you to receive dependable lifetime fixed payments and leave a gift to the ministry of your choice.',
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
          { label: 'Download packet', documentId: 'form-planned-giving-will-planning-document', className: 'is-outline is-tone-atlantean' },
          { label: 'Online form*', href: 'https://sft.agfinancial.org/documents/Send.do' },
        ],
      },
      {
        id: 'legacy-giving-stewardship-story',
        title: 'Smart stewardship—for today and tomorrow.',
        className: 'legacy-giving-stewardship',
        cards: [
          {
            title: 'Receive payments for life.',
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
        className: 'legacy-giving-joy fade-out',
        copyWrap: true,
        copyClassName: 'fade-up',
        body: [
          'Your charitable giving plan makes it easy to manage both your cash and non-cash assets.',
        ],
      },
      {
        className: 'legacy-giving-cta',
        hideCopy: true,
        form: {
          title: 'We help every step of the way. Always.',
          subtitle: 'Let’s map out the best strategy together.',
          submitLabel: 'Follow-up with me',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555' },
            {
              id: 'legacyProduct',
              label: 'Legacy giving product of interest*',
              type: 'select',
              required: true,
              placeholder: 'Select one',
              options: [
                { value: 'donor-advised-fund', label: 'Donor Advised Fund' },
                { value: 'endowment', label: 'Endowment' },
                { value: 'charitable-gift-annuity', label: 'Charitable Gift Annuity' },
                { value: 'charitable-remainder-trust', label: 'Charitable Remainder Trust' },
                { value: 'charitable-lead-trust', label: 'Charitable Lead Trust' },
                { value: 'ministry-impact-fund', label: 'Ministry Impact Fund' },
              ],
            },
            {
              id: 'message',
              label: 'Message',
              type: 'textarea',
              full: true,
              rows: 4,
              placeholder: 'Tell us what you’d like to discuss',
            },
          ],
        },
      },
      {
        anchorId: 'charitable-giving-plan-comparison',
        title: 'Which Charitable Giving plan is right for you?',
        titleHighlights: [{ text: 'Charitable Giving', className: 'is-atlantean' }],
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
        className: 'legacy-giving-comparison-matrix',
        hideTitle: true,
        widget: 'giving-comparison-matrix',
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
          ...(() => {
            const article = getResourceArticleFeatureConfig({
              slug: 'opportunity',
              fallbackImage: legacyOpportunityImage,
              fallbackImageAlt: 'Opportunity is Knocking',
              actionLabel: 'Answer the door',
            });
            return {
              title: article.title || 'Opportunity is Knocking',
              image: article.image,
              imageAlt: article.imageAlt,
              actions: [{ label: 'Answer the door', to: article.to }],
            };
          })(),
          body: [
            'The SECURE 2.0 Act allows you to distribute funds from your IRA into a Charitable Gift Annuity.**',
          ],
        },
      },
    ],
    actions: [],
  },

  '/about-us': {
    pageClass: 'native-info-page--about',
    compact: true,
    hideHero: true,
    hero: {
      lines: [
        {
          title: 'Bold, smart steps.',
          highlights: [{ text: 'steps', className: 'is-atlantean' }],
        },
        {
          title: 'Together.',
          highlights: [{ text: 'Together', className: 'is-mango' }],
        },
      ],
    },
    intro: {
      className: 'about-native-top-intro',
      copyClassName: 'about-native-top-intro-copy',
      justify: 'center',
      heading: 'Where faith & finance grow together.',
      body: [
        'Our culture is delivering the best financial products and experiences that align with biblical values.',
      ],
      emphasis: 'Our mission is your financial health and ministry growth.',
    },
    sections: [
      {
        className: 'about-native-building-shot',
        hideCopy: true,
        fullBleed: true,
        columns: 'two',
        columnsItems: [
          {
            slot: 1,
            type: 'photo',
            image: aboutIntroImage,
            imageAlt: 'AGFinancial office building',
          },
        ],
      },
      {
        className: 'about-native-strategy',
        copyWrap: true,
        actionsBeforeCards: true,
        title: 'Create a complete, robust financial strategy for your ministry and your family.',
        titleHighlights: [
          { text: 'your ministry', className: 'is-atlantean' },
          { text: 'your family', className: 'is-mango' },
        ],
        html: '<p>It is our honor to serve more than 38,000 clients, and more than 4,000 churches and ministries worldwide. With $12 billion+ in assets under management, we are driven to God-honoring stewardship. Through <a href="/services/loans">loans</a>, <a href="/services/investments">investments</a>, <a href="/services/retirement">retirement</a>, <a href="/services/legacy-giving">planned giving</a>, and <a href="/services/insurance">insurance</a>, we’re dedicated to providing the best financial experience for both ministries and individuals.</p>',
        cards: [
          {
            title: 'Focus',
            body: 'Our faith and our clients’ financial health come first. Everything else flows from our unwavering commitment to both.',
            cardClass: 'card3 about-native-strategy-card about-native-strategy-card--focus',
          },
          {
            title: 'Responsibility',
            body: 'The highest standards of biblical stewardship and professional integrity guide every decision.',
            cardClass: 'card3 about-native-strategy-card about-native-strategy-card--responsibility',
          },
          {
            title: 'Experience',
            body: 'Decades of trusted financial expertise help us successfully navigate challenges for both individuals and ministries.',
            cardClass: 'card3 about-native-strategy-card about-native-strategy-card--experience',
          },
        ],
        actions: [{ label: 'Explore all services', to: '/services' }],
      },
      {
        className: 'about-native-allies',
        copyWrap: true,
        title: 'Ministry allies.',
        html: '<p>We\'re <mark class="is-atlantean">serving</mark> you, <mark class="is-mango">alongside</mark> you.</p>',
        actions: [
          { label: "See what we're doing together", to: '/about-us/impact' },
        ],
      },
      {
        className: 'about-native-history',
        copyWrap: true,
        title: 'Some history things.',
        body: [
          'AGFinancial grew out of something already alive and working. That’s a stupid sentence. This is all temporary, by the way.',
          'For decades, the Assemblies of God General Council headquarters operated several independent financial departments: a ministers benefit association, a loan fund, and a foundation, among others. Each had its own leadership, its own church loan portfolio, its own operations, and its own strengths. However, operating separately naturally created consistency and efficiency challenges.',
          'In the mid-1990s, AG General Superintendent Thomas Trask recognized and championed an opportunity for these growing entities to transform into a unified, professional management group that could serve the church better, and with the same rigor expected in any financial arena. That vision gave rise to AG Financial Services Group (AGFSG), which officially launched operations on October 1, 1998.',
          'From the beginning, the goal was simple: support the General Council and the local church through sound financial services. Not only because it made good business sense, but because it was the right stewardship of what had been entrusted to the ministry.',
          'In the years since, AGFinancial has grown steadily — adding investment management, real estate, and other capabilities — while staying anchored to that original purpose. The tools have evolved. The mission hasn’t.',
          'Maybe after that, we send to the “impact” page to show why our work matters, and what sort of difference we’re making…via the button, of course.',
        ],
        actions: [
          { label: 'This is why we matter', to: '/about-us/impact' },
        ],
      },
      {
        className: 'about-native-cta-form',
        title: 'What can we do for you?',
        copyWrap: true,
        body: ['Let’s explore a bold, smart financial plan together.'],
        form: {
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555' },
            { id: 'notes', label: 'What would you like to discuss?', type: 'textarea', rows: 4 },
          ],
          submitLabel: 'Follow-up with me',
          successMessage: 'Got it. We’ll reach out soon.',
        },
      },
    ],
    actions: [],
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
    pageClass: 'native-info-page--calculators',
    compact: true,
    hero: {
      title: 'Calculators',
      highlight: null,
      titleSizeRem: 4.5,
      lineHeight: 0.9,
      titleLetterSpacingEm: -0.04,
    },
    hideIntro: true,
    sections: [
      {
        className: 'calculators-native-collection calculators-native-collection--future',
        columns: 'three',
        title: 'Plan for the future',
        cards: [
          {
            title: 'Retirement Savings',
            body: 'See whether your current savings pace is moving you toward retirement.',
            stretchedLink: {
              label: 'Launch',
              to: '/services/retirement#retirement-savings-calculator',
            },
            cta: 'Launch',
            cardClass: 'card2',
          },
          {
            title: 'Increased Contribution',
            body: 'Measure how a higher contribution rate could change your long-term balance.',
            stretchedLink: {
              label: 'Launch',
              to: '/calculators/increased-contribution',
            },
            cta: 'Launch',
            cardClass: 'card2',
          },
          {
            title: 'Compound Interest',
            body: 'Project how steady deposits and time can help your money grow.',
            stretchedLink: {
              label: 'Launch',
              to: '/services/retirement#retirement-savings-calculator',
            },
            cta: 'Launch',
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'calculators-native-collection calculators-native-collection--cashflow',
        columns: 'two',
        title: 'Manage cash flow',
        cards: [
          {
            title: 'Loan Payment',
            body: 'Estimate a payment schedule and review the cost of borrowing over time.',
            stretchedLink: {
              label: 'Launch',
              to: '/services/loans#run-some-numbers',
            },
            cta: 'Launch',
            cardClass: 'card2',
          },
          {
            title: 'Emergency Fund',
            body: 'Set a savings target based on expenses and build a more resilient cash reserve.',
            stretchedLink: {
              label: 'Launch',
              to: '/calculators/emergency-fund',
            },
            cta: 'Launch',
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'calculators-native-collection calculators-native-collection--picture',
        columns: 'three',
        title: 'Understand your full picture',
        cards: [
          {
            title: 'Net Worth',
            body: 'Organize your assets and liabilities for a clearer view of your financial position.',
            stretchedLink: {
              label: 'Launch',
              to: '/calculators/net-worth',
            },
            cta: 'Launch',
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'calculators-native-collection calculators-native-collection--ministry',
        columns: 'two',
        title: 'Grow ministry resources',
        cards: [
          {
            title: 'Laddering',
            body: 'Compare a laddered certificate approach with shorter-term cash strategies.',
            stretchedLink: {
              label: 'Launch',
              to: '/services/investments#laddering-calculator',
            },
            cta: 'Launch',
            cardClass: 'card2',
          },
          {
            title: 'Endowment Investment Earnings',
            body: 'Estimate how invested endowment assets may support ministry year after year.',
            stretchedLink: {
              label: 'Launch',
              to: '/services/legacy-giving/endowments#endowment-investment-earnings-calculator',
            },
            cta: 'Launch',
            cardClass: 'card2',
          },
        ],
      },
    ],
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
    hero: { title: 'Contact', highlight: null },
    hideIntro: true,
    sections: [
      {
        className: 'contact-us-address',
        title: 'AGFinancial',
        titleClassName: 'contact-us-address-title',
        body: [
          '3900 S Overland Avenue',
          'Springfield, Missouri 65807',
          '**clientservices@AGFinancial.org**',
          'Call **866.621.1787**',
          'Fax **417.831.7429**',
          '**Hours**',
          'Monday - Friday',
          '8 a.m. to 4:30 p.m. CST',
        ],
      },
      {
        className: 'contact-us-request',
        copyWrap: true,
        title: 'How can we help?',
        body: ['Share some information, and our team will contact you within one business day.'],
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
              id: 'inquiry',
              fields: [
                {
                  id: 'inquiryType',
                  label: 'Type of inquiry*',
                  type: 'select',
                  required: true,
                  options: [
                    { value: 'Loans', label: 'Loans' },
                    { value: 'Investments', label: 'Investments' },
                    { value: 'Retirement', label: 'Retirement' },
                    { value: 'Planned Giving', label: 'Planned Giving' },
                    { value: 'Insurance', label: 'Insurance' },
                    { value: 'Client Services', label: 'Client Services' },
                    { value: 'Other', label: 'Other' },
                  ],
                },
                { id: 'message', label: 'Message', type: 'textarea', rows: 5, placeholder: 'How can we help?' },
              ],
              backLabel: 'Back',
              submitLabel: 'Submit',
            },
          ],
        },
      },
      {
        hidden: true,
        title: 'Help Center Quick Links',
        cards: [
          {
            title: 'Resource Library',
            body: 'Visit our Resource Library and browse several different topics.',
            to: '/resources',
            cta: 'Browse',
          },
          {
            title: 'Loan Consultants',
            body: 'Talk one-on-one with one of our experienced representatives.',
            to: '/services/loans/loan-consultants',
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
    pageClass: 'native-info-page--online-contributions',
    compact: true,
    hero: {
      lines: [
        {
          title: 'Employer contributions',
        },
      ],
    },
    intro: {
      heading: 'Manage Contributions',
      body: [
        'Minimize monthly data entry, and maximize accuracy as you make retirement contributions on behalf of your employees.',
      ],
    },
    sections: [
      {
        className: 'online-contrib-native-overview',
        title: 'Set-up is easy',
        titleClassName: 'online-contrib-native-title',
        body: [
          'Create a new user account for your company in **Online Access**.',
          'Select “403(b) Employer” as the **Account Type**.',
          'Contact Client Services at 866.621.1787 or clientservices@agfinancial.org for your Employer Code to complete your account setup.',
          'When your account is established, you may remit funds by EFT or check.',
        ],
        links: [
          { label: 'Online Access', href: 'https://secure.agfinancial.org/cp/do/user/login' },
        ],
      },
      {
        className: 'online-contrib-native-steps',
        fullBleed: true,
        hideTitle: true,
        columns: 'three',
        cards: [
          {
            title: '1) Create a new user account for your company.',
            body: 'Start in Online Access and create a user account for your company.',
            actions: [{ label: 'Create account', href: 'https://secure.agfinancial.org/cp/do/user/login' }],
            cardClass: 'card2',
          },
          {
            title: '2) Select “403(b) Employer” as the Account Type',
            body: 'Choose the employer contribution account type during setup so the account is configured correctly.',
            cardClass: 'card2',
          },
          {
            title: '3) Get your Employer Code',
            body: 'Contact Client Services at 866.621.1787 or clientservices@agfinancial.org for your Employer Code to complete your account setup.',
            actions: [
              { label: 'Email', href: 'mailto:clientservices@agfinancial.org' },
              { label: 'Call', href: 'tel:18666211787', ghost: true },
            ],
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'online-contrib-native-help',
        title: 'Need some help? Maybe just curious?',
        subtitle: 'Let’s talk.',
        body: [
          'Contact your AGFinancial retirement consultant for more information.',
        ],
        actions: [
          { label: 'Email', href: 'mailto:retirement@agfinancial.org' },
          { label: 'Call', href: 'tel:18006227526', ghost: true },
        ],
      },
    ],
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

  '/taxguide': {
    pageClass: 'native-info-page--tax-guide',
    compact: true,
    hero: { title: 'Tax Guide', highlight: null },
    hideIntro: true,
    sections: [],
    actions: [],
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
    hero: { title: 'Certificate Request', highlight: null },
    sections: [
      {
        className: 'certificate-request-native-section',
        hideTitle: true,
        body: [],
        form: {
          variant: 'certificate-request',
          title: 'Certificate Request',
        },
      },
    ],
  },
  '/services/insurance/group-term-life-insurance': {
    compact: true,
    pageClass: 'native-info-page--group-life-quote',
    hero: {
      lines: [
        {
          title: 'Get a group quote.',
          highlights: [
            { text: 'group', className: 'is-atlantean' },
            { text: 'quote', className: 'is-atlantean' },
          ],
        },
      ],
    },
    intro: {
      heading: 'Take care of the team.',
      headingHighlights: [{ text: 'team', className: 'is-atlantean' }],
      body: [
        'Protect the people who power your ministry. Coverage for your team that replaces income and secures families when the unexpected strikes is a benefit that shows your people are valued beyond their workdays.',
      ],
    },
    sections: [
      {
        className: 'group-life-native-lead',
        title: 'Group Term Life',
        titleHighlights: [{ text: 'Group Term Life', className: 'is-mango' }],
        body: [
          'Comprehensive life insurance plans for nonprofits, schools, and businesses—customized for your group. Use the form below to request a quote.',
        ],
      },
      {
        className: 'group-life-native-quote',
        copyWrap: true,
        title: 'Request a quote for group life.',
        titleClassName: 'is-super-grey',
        titleHighlights: [{ start: 20, end: 30, className: 'is-white' }],
        body: [
          'Provide a few specifics, and we’ll contact you about a policy customized specifically for your team.',
        ],
        form: {
          steps: [
            {
              id: 'contact',
              fields: [
                { id: 'contactFirstName', label: 'Contact First Name', type: 'text', required: true },
                { id: 'contactLastName', label: 'Contact Last Name', type: 'text', required: true },
                { id: 'contactEmail', label: 'Contact Email Address', type: 'email', required: true },
                { id: 'contactPhone', label: 'Contact Phone Number', type: 'tel', placeholder: '555-555-5555', required: true },
              ],
              nextLabel: 'Go to next step',
            },
            {
              id: 'organization',
              fields: [
                { id: 'organizationName', label: 'Organization Name', type: 'text', required: true },
                { id: 'organizationAddress1', label: 'Organization Address', type: 'text', required: true },
                { id: 'organizationAddress2', label: 'Street Address Line 2 (optional)', type: 'text' },
                { id: 'organizationCity', label: 'Organization City', type: 'text', required: true },
              ],
              backLabel: 'Back',
              nextLabel: 'Go to next step',
            },
            {
              id: 'organization-details',
              fields: [
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
              backLabel: 'Back',
              submitLabel: 'Submit quote request',
            },
          ],
        },
      },
      {
        className: 'group-life-native-honor',
        justify: 'center',
        title: 'AG Ministry Group Life',
        html: '<p>It’s our honor to administer the group term life plan for the <mark class="is-atlantean">GC of the Assemblies of God</mark>. Available to any credentialed AG minister, the plan is provided through our group carrier, The Standard Insurance Company.</p>',
      },
      {
        className: 'group-life-native-benefits',
        fullBleed: true,
        hideTitle: true,
        justify: 'center',
        columns: 'three',
        cards: [
          {
            title: 'Coverage for you and your family.',
            body: 'Extend protection to your spouse and dependent children, all under one plan.',
            cardClass: 'card4',
          },
          {
            title: 'No medical sign-off.',
            body: 'Newly credentialed ministers can enroll up to the Guarantee Issue Amount without medical approval during the eligible enrollment period.',
            cardClass: 'card4',
          },
          {
            title: 'Accelerated benefit.',
            body: 'Access a portion of your life benefit early to help cover terminal illness expenses when it matters most.',
            cardClass: 'card4',
          },
        ],
        actions: [{ label: "Ministers' Group Life Plan details", to: '/services/insurance/ministers-group-life-plan' }],
      },
    ],
  },
  '/services/insurance/life-insurance-quote': {
    pageClass: 'native-info-page--life-quote',
    compact: true,
    hero: {
      lines: [
        {
          title: 'Get a life quote.',
          highlights: [{ text: 'Get a', className: 'is-mango' }],
        },
      ],
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
        className: 'life-quote-native-types',
        fullBleed: true,
        hideTitle: true,
        columns: 'three',
        cards: [
          {
            title: 'Term Life',
            body: 'Coverage for typically 10, 20, or 30 years. Designed to protect your “highest-need” years.',
            cardClass: 'card4',
          },
          {
            title: 'Whole Life',
            body: 'Lifelong coverage. Guaranteed death benefit, and grows cash value over time.',
            cardClass: 'card4',
          },
          {
            title: 'Universal Life',
            body: 'Flexible lifelong coverage. Premiums and death benefit are adjustable. Builds cash value over time.',
            cardClass: 'card4',
          },
        ],
      },
      {
        className: 'life-quote-native-divider',
        hideTitle: true,
        body: [],
      },
      {
        className: 'life-quote-native-bridge',
        title: 'Which is best for you?',
        subtitle: 'We’re ready to help.',
        body: ['Use the quote form below to get started.'],
        anchorId: 'quote',
      },
    ],
  },
  '/services/insurance/ministers-group-life-plan': {
    compact: true,
    hideIntro: true,
    pageClass: 'native-info-page--ministers-group-life-plan',
    hero: {
      bgTone: 'white',
      lines: [
        {
          title: 'AG Ministry',
          highlights: [{ text: 'AG Ministry', className: 'is-mango' }],
        },
        { title: 'Group Life' },
      ],
    },
    sections: [
      {
        className: 'ministers-group-life-native-details',
        title: 'About the plan',
        subtitle: 'Learn about eligibility requirements, coverage amounts, rates, and more.',
        columns: 'two',
        cards: [
          {
            title: 'Ministers',
            cta: 'Plan details (527a PDF)',
            stretchedLink: {
              label: 'Plan details (527a PDF)',
              href: GROUP_LIFE_MINISTERS_PLAN_DETAILS_URL,
            },
            cardClass: 'card2 ministers-group-life-details-card',
          },
          {
            title: 'Missionaries',
            cta: 'Plan details (524a PDF)',
            stretchedLink: {
              label: 'Plan details (524a PDF)',
              href: GROUP_LIFE_MISSIONARIES_PLAN_DETAILS_URL,
            },
            cardClass: 'card2 ministers-group-life-details-card',
          },
        ],
      },
      {
        className: 'ministers-group-life-native-enroll',
        fullBleed: true,
        sand: true,
        title: 'How to enroll',
        subtitle: 'Three steps. One clear path.',
        columns: 'three',
        cards: [
          {
            title: '1. Start with the enrollment form',
            body: 'Download and complete the enrollment packet that matches your situation.',
            actions: [
              {
                label: 'Minister enrollment form',
                href: GROUP_LIFE_MINISTER_ENROLLMENT_FORM_URL,
              },
              {
                label: 'Missionary enrollment form',
                href: GROUP_LIFE_STANDARD_PACKET_URL,
              },
            ],
            cardClass: 'card2 ministers-group-life-step-card',
          },
          {
            title: '2. Add medical history if required',
            body: 'If applicable, complete the state-specific medical history form as part of your enrollment packet.',
            actions: [
              {
                label: 'Medical history form',
                href: GROUP_LIFE_STANDARD_PACKET_URL,
              },
            ],
            cardClass: 'card2 ministers-group-life-step-card',
          },
          {
            title: '3. Complete Electronic Funds Transfer',
            body: 'Use the EFT form so billing details are set up correctly with your enrollment.',
            actions: [
              {
                label: 'Electronic Funds Transfer form',
                href: GROUP_LIFE_EFT_FORM_URL,
              },
            ],
            cardClass: 'card2 ministers-group-life-step-card',
          },
        ],
        addressBlock: {
          className: 'ministers-group-life-copy-address',
          title: 'Mail or fax completed forms to:',
          lines: ['AGFinancial Insurance', 'PO Box 10263', 'Springfield, MO 65808-0263'],
        },
        fineprint: '**FAX:** 417.447.7475',
      },
      {
        className: 'ministers-group-life-native-support',
        title: 'Support for current clients',
        subtitle: 'Search by topic, form, or support program.',
        supportGroupsExpanded: true,
        supportGroupsCollapsible: false,
        html: '<p>Please reach out to us with any questions. Call <a href="tel:18004470446">800.447.0446</a> or <a href="#form">use the form below</a>.</p>',
        supportGroups: [
          {
            title: 'Plan details',
            links: [
              {
                label: 'Ministers enrolled before March 1, 2005 (PDF)',
                documentId: 'policy-insurance-group-life-credentialed-ministers-before-2005',
              },
              {
                label: 'Ministers enrolled after March 1, 2005 (PDF)',
                documentId: 'policy-insurance-group-life-credentialed-ministers-after-2005',
              },
              {
                label: 'Missionaries or ministers living overseas (PDF)',
                documentId: 'policy-insurance-group-life-missionaries-overseas',
              },
            ],
          },
          {
            title: 'Changes and billing',
            links: [
              {
                label: 'Beneficiary designation form (PDF)',
                documentId: 'form-insurance-standard-life-beneficiary-designation-change',
              },
              {
                label: 'Address and contact information form (PDF)',
                documentId: 'form-insurance-contact-information',
              },
              {
                label: 'Bank draft and electronic funds transfer form (PDF)',
                documentId: 'form-insurance-electronic-funds-transfer',
              },
            ],
          },
          {
            title: 'Standard Life certificates',
            links: [
              {
                label: 'AG entity certificate before March 1, 2005 (PDF)',
                documentId: 'policy-insurance-group-life-ag-entity-before-2005',
              },
              {
                label: 'AG entity certificate March 1, 2005 to February 28, 2009 (PDF)',
                documentId: 'policy-insurance-group-life-ag-entity-2005-2009',
              },
            ],
          },
          {
            title: 'Travel Assistance (Assist America, Inc)',
            links: [
              {
                label: 'Assist America benefits overview (English PDF)',
                documentId: 'document-insurance-assist-america-benefits-overview-english',
              },
              {
                label: 'Assist America program description (English PDF)',
                documentId: 'document-insurance-assist-america-program-description-english',
              },
              {
                label: 'Assist America benefits overview (Spanish PDF)',
                documentId: 'document-insurance-assist-america-benefits-overview-spanish',
              },
              {
                label: 'Assist America program description (Spanish PDF)',
                documentId: 'document-insurance-assist-america-program-description-spanish',
              },
            ],
          },
          {
            title: 'Life Services Toolkit',
            links: [
              {
                label: 'Life Services Toolkit benefits overview (English PDF)',
                documentId: 'document-insurance-life-services-toolkit-benefits-overview-english',
              },
              {
                label: 'Life Services Toolkit resources and tools (English PDF)',
                documentId: 'document-insurance-life-services-toolkit-resources-tools-english',
              },
              {
                label: 'Life Services Toolkit benefits overview (Spanish PDF)',
                documentId: 'document-insurance-life-services-toolkit-benefits-overview-spanish',
              },
              {
                label: 'Life Services Toolkit resources and tools (Spanish PDF)',
                documentId: 'document-insurance-life-services-toolkit-resources-tools-spanish',
              },
            ],
          },
        ],
      },
      {
        anchorId: 'form',
        className: 'ministers-group-life-native-cta insurance-native-cta',
        hideCopy: true,
        form: {
          title: 'Still need help?',
          subtitle: '',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555' },
            { id: 'message', label: 'Message', type: 'textarea', rows: 4, placeholder: 'How can we help?' },
          ],
          submitLabel: 'Follow-up with me',
        },
      },
    ],
  },
  '/services/insurance/mission-assure': {
    compact: true,
    pageClass: 'native-info-page--mission-assure',
    hideIntro: true,
    hero: {
      lines: [
        { title: 'Packed &' },
        {
          title: 'covered.',
          highlights: [{ text: 'covered.', className: 'is-white' }],
        },
      ],
    },
    sections: [
      {
        className: 'mission-assure-native-intro',
        logoComponent: MissionAssureLogo,
        logoAlt: 'Mission Assure®',
        title: 'Every trip is a step of faith,\nbut you don’t have to take it uninsured.',
        titleHighlights: [{ text: 'faith', className: 'is-atlantean' }],
        body: [
          'As low as **$1.25/day**',
          'Mission Assure® helps take the “what if” out of church trips and events. At only $4.95 per person per day for **international** trips, and $1.25 per person per day for **domestic** trips or outings, Mission Assure® offers superior short-term insurance at an affordable price. Use the buttons below to apply for coverage, manage your trips, or report a claim.',
        ],
        widget: 'mission-assure-pricing',
        pricing: {
          entries: [
            {
              trip: 'Domestic',
              rate: '$1.25/day',
              note: 'Limited medical coverage included',
            },
            {
              trip: 'International',
              rate: '$4.95/day',
              note: 'Medical coverage included',
            },
          ],
        },
      },
      {
        className: 'mission-assure-native-medical',
        hideTitle: true,
        logoImage: missionAssureMedicalIncludedImage,
        body: [],
      },
      {
        className: 'mission-assure-native-get-covered',
        title: 'Get covered',
        body: ['Apply for coverage and manage all your trips in one place.'],
        actions: [{ label: 'Let’s start', href: 'https://www.missionassure.com/' }],
      },
      {
        className: 'mission-assure-native-report-claim',
        title: 'Need to report a claim?',
        body: ['Start here.'],
        actions: [{ label: 'Report a claim', to: '/services/insurance/mission-assure/report-a-claim' }],
      },
      {
        className: 'mission-assure-native-camp-safety',
        fullBleed: true,
        feature: {
          ...(() => {
            const article = getResourceArticleFeatureConfig({
              slug: 'summer-camp-safety-tips',
              fallbackImage: missionAssureSummerCampSafetyImage,
              fallbackImageAlt: 'Summer camp safety',
              actionLabel: 'Go safely!',
            });
            return {
              title: article.title || 'Summer Camp Safety Tips',
              image: article.image,
              imageAlt: article.imageAlt,
              actions: [{ label: 'Go safely!', to: article.to }],
            };
          })(),
          body: [
            'Practical safety tips to help your summer camp prevent injuries, protect children, and be prepared for the unexpected.',
          ],
        },
      },
    ],
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
    pageClass: 'native-info-page--insurance-pc',
    hero: {
      lines: [
        {
          title: 'Property',
          highlights: [{ text: 'Property', className: 'is-atlantean' }],
        },
        {
          title: '& Casualty',
          highlights: [{ text: 'Casualty', className: 'is-mango' }],
        },
      ],
    },
    intro: {
      body: [
        "You focus on people. We'll handle the protection-powered confidence to keep your ministry safe and sound. Additionally, our **AG Insurance Program** with Church Mutual Insurance offers some nice extras for Assemblies of God churches.",
      ],
      actions: [{ label: 'Jump to the AG program', to: '/services/insurance/property-casualty-insurance#ag-program' }],
    },
    sections: [
      {
        title: 'Request a Property & Casualty Insurance Quote',
        titleHighlights: [{ text: 'Property & Casualty', className: 'is-white' }],
        className: 'insurance-pc-native-quote',
        anchorId: 'quote',
        subtitle: 'We’re passionate about protecting your ministry.',
        body: [
          'Share a few details and we’ll help you explore broader coverage and value-added risk management tailored to your church or organization.',
        ],
        form: {
          steps: [
            {
              id: 'contact',
              fields: [
                { id: 'contactFirstName', label: 'Contact First Name', type: 'text', required: true },
                { id: 'contactLastName', label: 'Contact Last Name', type: 'text', required: true },
                { id: 'contactEmail', label: 'Contact Email Address', type: 'email', required: true },
                { id: 'contactPhone', label: 'Contact Phone Number', type: 'tel', placeholder: '555-555-5555', required: true },
              ],
              nextLabel: 'Next',
            },
            {
              id: 'organization',
              fields: [
                { id: 'organizationName', label: 'Organization Name', type: 'text', required: true },
                { id: 'organizationAddress1', label: 'Organization Address', type: 'text', required: true },
                { id: 'organizationAddress2', label: 'Street Address Line 2 (optional)', type: 'text' },
                { id: 'organizationCity', label: 'Organization City', type: 'text', required: true },
                { id: 'organizationCounty', label: 'Organization County', type: 'text', required: true },
              ],
              backLabel: 'Back',
              nextLabel: 'Next',
            },
            {
              id: 'details',
              fields: [
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
              backLabel: 'Back',
              submitLabel: 'Submit quote request',
            },
          ],
        },
      },
      {
        title: 'AG Insurance Program',
        anchorId: 'ag-program',
        className: 'insurance-pc-native-ag-program',
        body: [
          '**Discounted premiums.** Exclusively for AG churches.',
          '**Expanded coverages.** No extra charge.',
          '**Kingdom support.** Your participation funds ministry.',
        ],
      },
      {
        title: 'Church Mutual partnership',
        hideTitle: true,
        className: 'insurance-pc-native-partner',
        logoImage: churchMutualInsuranceLogo,
        logoAlt: 'Church Mutual Insurance',
        body: [
          '**The AG Insurance Program is offered in exclusive partnership with Church Mutual Insurance Company.**',
          'Through this program, we’re pleased to offer broader coverage, lower pricing, and other value-added services-all with the strength and experience of America’s leading church insurance provider.',
        ],
      },
      {
        title: 'Coverage and resources',
        hideTitle: true,
        className: 'insurance-pc-native-resources',
        columns: 'two',
        cards: [
          {
            title: 'Additional coverages available',
            body: '› Sexual misconduct liability\n› Pastoral/counseling professional liability\n› Educator’s legal liability\n› Directors, officers, and trustees liability\n› Medical payments\n› Umbrella liability\n› Religious freedom legal defense',
            cardClass: 'card2',
          },
          {
            title: 'Extensive risk management resources',
            body: '› On-site safety and hazard analysis\n› Case management\n› Worker and volunteer screening\n› Water and temperature sensors\n› Swimmer and allergy bands\n› Ergonomic evaluations\n› Online safety tools\n› **Comprehensive risk management guide**',
            cardClass: 'card2',
          },
        ],
      },
      {
        title: 'Your people & property. Safe & sound',
        titleHighlights: [{ text: 'Safe & sound', className: 'is-sandstone' }],
        className: 'insurance-pc-native-safe',
        actions: [{ label: 'Start here', to: '/services/insurance/property-casualty-insurance#quote' }],
      },
      {
        title: 'Coverage notice',
        hideTitle: true,
        className: 'insurance-pc-native-fineprint',
        fineprint: [
          '**CM0045 (04-2020)**',
          'This material may include only a general description of insurance coverages and does not include all terms, conditions, and limitations found in Church Mutual Insurance Company, S.I. (“Church Mutual”) policies. The insurance policy, not any general descriptions of coverage that may be found in this material, will form the contract between the insured and Church Mutual. Neither Church Mutual nor its employees, representatives, or agents shall be liable to any party for the use of any information or statements made or contained herein.',
          '(C) 2020 Church Mutual Insurance Company, S.I. Church Mutual is a registered trademark of Church Mutual Insurance Company, S.I. S.I.= a stock insurer. AGFinancial Insurance is a service mark of the General Council of the Assemblies of God.',
        ],
      },
    ],
  },
};

const legacyChildPages = {
  '/services/legacy-giving/charitable-gift-annuities': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-cga',
    compact: true,
    hero: {
      lines: [
        { title: 'Generous.' },
        {
          title: 'Rewarding, too.',
          highlights: [{ text: 'Rewarding', className: 'is-mango' }],
        },
      ],
    },
    intro: {
      heading: 'Tax benefits.\nMinistry support.\nPayments for life.',
      body: [
        '...and completely unaffected by the economy. Through a Charitable Gift Annuity (CGA), your generosity has the power to bless both the ministries and the people you love—with fixed payments, potential tax deductions, and attractive rates.',
      ],
    },
    sections: [
      {
        className: 'legacy-child-native-steps',
        title: 'How it works',
        fullBleed: true,
        columns: 'three',
        cards: [
          {
            title: '1. Fund the gift',
            body: 'You fund the gift with cash or securities, and should receive an immediate charitable deduction.',
            cardClass: 'card2',
          },
          {
            title: '2. Invest & pay',
            body: 'AG Foundation invests those assets and pays you a fixed amount (according to your age) every year for the rest of your life.',
            cardClass: 'card2',
          },
          {
            title: '3. Support',
            body: 'When you pass away, the remainder goes to support ministry.',
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'legacy-child-native-assets legacy-child-native-cga-assets',
        title: 'It starts with your gift.',
        titleHighlights: [{ text: 'your gift', className: 'is-atlantean' }],
        cards: [
          {
            title: 'Gift funding options',
            cardClass: 'card2 cga-assets-card',
            list: [
              'Cash (a significant portion of the annuity income may be tax-free)',
              'Appreciated securities (may avoid a portion of capital gains tax)',
              '$10,000 minimum',
              'The SECURE 2.0 Act of 2022 allows you to fund a Charitable Gift Annuity with funds distributed from your IRA up to $50,000* of your annual Qualified Charitable Distribution limit (QCD). This charitable distribution amount is both retirement income for you, and a gift of support to a ministry you choose. Even better, this distribution can count toward your IRA’s annual Required Minimum Distribution (RMD).',
              '**You’re permitted to take advantage of this unique opportunity only once.**',
            ],
          },
        ],
        actions: [{ label: 'Learn more about this', to: '/services/legacy-giving/charitable-gift-annuities#demo' }],
      },
      {
        className: 'legacy-child-native-cga-qcd-fineprint',
        hideTitle: true,
        body: ['**Also available for Charitable Remainder Unitrust (CRUT) or Charitable Remainder Annuity Trust (CRAT)**'],
        links: [
          { label: 'Charitable Remainder Unitrust (CRUT)', to: '/services/legacy-giving/charitable-trusts#crt' },
          { label: 'Charitable Remainder Annuity Trust (CRAT)', to: '/services/legacy-giving/charitable-trusts#crt' },
        ],
        fineprint: [
          '*Indexed annually for inflation',
          'Restrictions apply.',
        ],
      },
      {
        className: 'legacy-child-native-options legacy-child-native-cga-options',
        title: 'Charitable Gift Annuity Options',
        columns: 'two',
        cards: [
          {
            title: 'Immediate',
            subtitle: 'Start receiving payments **now**.',
            body: 'If you desire current income, you may transfer cash or securities in exchange for a contract for payment to begin within four weeks. You should receive a current income tax charitable deduction for the value of your gift to AG Foundation.',
            cardClass: 'card2',
          },
          {
            title: 'Deferred',
            subtitle: 'Receive payments in the **future**.',
            body: 'Deferment compresses payout into a shorter time frame, so your annual payments will be higher than an immediate CGA. You should receive a current charitable income tax deduction.',
            cardClass: 'card2',
          },
        ],
        actions: [{ label: 'Try the CGA estimator', to: '/services/legacy-giving/charitable-gift-annuities#demo' }],
      },
      {
        className: 'legacy-child-native-cga-comparison',
        anchorId: 'demo',
        hideTitle: true,
        widget: 'charitable-gift-test-drive',
      },
      {
        className: 'legacy-child-native-cga-request',
        copyWrap: true,
        title: 'Your gifts are more powerful than you think.',
        titleHighlights: [{ text: 'powerful', className: 'is-mango' }],
        body: [
          'When you’re ready for tax deductions, fixed payments, and attractive rates—all while supporting ministry—we’re ready to walk you through the setup process.',
        ],
        form: {
          fields: [
            { id: 'firstName', label: 'First Name*', type: 'text', required: true },
            { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true, placeholder: '(555) 555-5555' },
            { id: 'email', label: 'Email*', type: 'email', required: true },
          ],
          submitLabel: 'Submit',
        },
      },
      {
        className: 'legacy-child-native-cga-outro',
        copyWrap: true,
        title: 'Plenty of options.',
        subtitle: 'Explore other charitable and legacy giving strategies.',
        actionsBeforeCards: true,
        actions: [{ label: 'Discover more', to: '/services/legacy-giving' }],
        fineprint: [
          'Except for California, your Assemblies of God Charitable Gift Annuity will be issued by Assemblies of God Foundation (“AG Foundation”) and will be a general obligation of the organization. Charitable Gift Annuities are not available in Alabama, Hawaii, Montana, New Jersey, New York, or Washington.',
          'Additional information for California residents: Annuities are subject to regulation by the State of California. Payments under this agreement, however, are not protected or otherwise guaranteed by any government agency or the California Life and Health Insurance Guarantee Association. AG Foundation does not practice law and no legal advice is provided. If you need legal advice, you should consult your own legal counsel. Your Assemblies of God Charitable Gift Annuity will be issued by the General Council of the Assemblies of God (“General Council”) and will be a general obligation of that organization. AG Foundation is responsible for the management of your gift annuity.',
          'Additional information for Oklahoma residents: A Charitable Gift Annuity is not regulated by the Oklahoma Insurance Department and is not protected by a guaranty association with the Oklahoma Insurance Department.',
          'Additional information for South Dakota residents: Charitable Gift Annuities are not regulated by and are not under the jurisdiction of the South Dakota Division of Insurance.',
        ],
      },
    ],
  },
  '/services/legacy-giving/charitable-trusts': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-trusts',
    compact: true,
    hero: {
      lines: [
        { title: 'Complex assets.' },
        {
          title: 'Smart giving.',
          highlights: [{ text: 'giving', className: 'is-mango' }],
        },
      ],
    },
    intro: {
      heading: 'Charitable Trusts',
      body: [
        'Charitable Trusts create a win-win. You receive regular payments and potentially immediate substantial tax deductions, while ministries you care about receive generous support either now or in the future.',
        'Income for you. Impact for ministry.',
      ],
    },
    sections: [
      {
        className: 'legacy-child-native-trust-choices legacy-child-native-trust-choices--trusts',
        hideTitle: true,
        columns: 'two',
        cards: [
          {
            title: 'Charitable Remainder Trust (CRT)',
            titleHighlights: [{ text: 'Remainder', className: 'is-melon' }],
            body: 'This option allows you to receive income payments for you and your family while potentially receiving immediate tax benefits. At the completion of the trust, you’ll have the joy of giving to the ministry of your choice. **Minimum requirements:** $50,000 cash or securities; $100,000 real estate.',
            actions: [{ label: 'Explore CRT options', to: '/services/legacy-giving/charitable-trusts#crt' }],
            cardClass: 'card2',
          },
          {
            title: 'Charitable Lead Trust (CLT)',
            titleHighlights: [{ text: 'Lead', className: 'is-mango' }],
            body: 'This option allows ministry to receive income payments for a set term while you potentially receive immediate tax benefits. At the completion of the trust, assets return to you or transfer to your family—often with significant growth. **Minimum requirements:** $50,000 cash or securities; $100,000 real estate.',
            actions: [{ label: 'Explore CLT options', to: '/services/legacy-giving/charitable-trusts#clt' }],
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'legacy-child-native-trusts-differences',
        title: 'The differences. At a glance.',
        wide: true,
        columns: 'three',
        cards: [
          {
            title: 'Funding',
            titleClassName: 'trusts-difference-title trusts-difference-title--funding',
            body: '**Both CRTs and CLTs accept these assets:**',
            list: ['Cash', 'Securities (stocks, bonds, mutual funds)', 'Real estate', 'Other marketable assets'],
            cardClass: 'trusts-difference-card',
          },
          {
            title: 'CRTs & taxes',
            titleClassName: 'trusts-difference-title trusts-difference-title--crt',
            list: [
              '**Best for:** Appreciated assets you want to sell (stocks, real estate)',
              '**Tax advantage:** Avoids capital gains tax when assets are sold',
              '**Note:** Immediate charitable deduction',
            ],
            cardClass: 'trusts-difference-card trusts-difference-card--crt',
          },
          {
            title: 'CLTs & taxes',
            titleClassName: 'trusts-difference-title trusts-difference-title--clt',
            list: [
              '**Best for:** Estate planning and wealth transfer to heirs',
              '**Tax advantage:** Reduces estate taxes, enables tax-efficient transfers to children',
              '**Note:** No capital gains benefits; trust income may be taxable to you',
            ],
            cardClass: 'trusts-difference-card trusts-difference-card--clt',
          },
        ],
      },
      {
        className: 'legacy-child-native-trusts-crt',
        anchorId: 'crt',
        title: 'Charitable Remainder Trust',
        body: [
          'You contribute cash, stocks, real estate, or other assets to AG Foundation to establish the trust. The trust pays you (and your spouse, if married) income for life. You can also designate others, like children, to receive payments for up to 20 years. When the trust ends, the remaining assets go to the ministry(ies) you’ve selected.',
        ],
      },
      {
        className: 'legacy-child-native-trusts-crt-types',
        hideTitle: true,
        columns: 'two',
        cards: [
          {
            title: 'Charitable Remainder Unitrust (CRUT)',
            list: [
              'Annual payout is determined by donor',
              'Account balance is revalued at the beginning of each year',
              'Minimum required payout of 5%',
              'Income may fluctuate from year to year',
            ],
            cardClass: 'trusts-type-card',
          },
          {
            title: 'Charitable Remainder Annuity (CRAT)',
            list: [
              'Donor receives a fixed payment',
              'Payment can be based on life expectancy or term of years',
              'Payments may begin immediately upon funding',
            ],
            cardClass: 'trusts-type-card',
          },
        ],
      },
      {
        className: 'legacy-child-native-trusts-crt-trigger',
        hideTitle: true,
        hideCopy: true,
        justify: 'center',
        actions: [{
          label: 'Start the process',
          action: 'open_cta_form',
          targetAnchorId: 'charitable-trusts-inline-form',
          className: 'is-outline is-tone-atlantean',
        }],
      },
      {
        className: 'legacy-child-native-cta legacy-child-native-trusts-cta legacy-child-native-trusts-cta-inline',
        anchorId: 'charitable-trusts-inline-form',
        copyWrap: true,
        title: 'Income and impact.',
        titleHighlights: [
          { text: 'and', className: 'is-atlantean' },
          { text: 'impact', className: 'is-mango' },
        ],
        body: ['Let’s transform your generosity into a tax-saving, ministry-supporting win. Ready when you are.'],
        form: {
          displayMode: 'inline_reveal',
          triggerMode: 'external',
          fields: [
            { id: 'firstName', label: 'First Name*', type: 'text', required: true },
            { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true, placeholder: '(555) 555-5555' },
            { id: 'email', label: 'Email*', type: 'email', required: true },
            {
              id: 'trustProduct',
              label: 'Trust product of interest*',
              type: 'select',
              required: true,
              placeholder: 'Select one',
              options: [
                { value: 'charitable-remainder-trust', label: 'Charitable Remainder Trust' },
                { value: 'charitable-lead-trust', label: 'Charitable Lead Trust' },
              ],
            },
            { id: 'message', label: 'Message', type: 'textarea', rows: 4, placeholder: 'How can we help?' },
          ],
          submitLabel: 'Start planning',
        },
      },
      {
        className: 'legacy-child-native-trusts-clt',
        anchorId: 'clt',
        title: 'Charitable Lead Trust',
        body: [
          'A Charitable Lead Trust works in the opposite way of a Charitable Remainder Trust. You contribute cash, stocks, real estate, or other assets to AG Foundation to establish the trust. The trust pays income to the ministry(ies) you’ve selected for a set number of years. When the trust ends, the remaining assets return to you or transfer to your family—often with significant growth in value.',
        ],
      },
      {
        className: 'legacy-child-native-trusts-clt-types',
        hideTitle: true,
        columns: 'two',
        cards: [
          {
            title: 'Grantor Lead Trust',
            list: [
              'Donor receives remainder of trust after stated period of time',
              'Charitable income tax deduction (equal to the total value of the income payments to ministry) is given in the year the trust is created',
              'Donor is taxed on the trust’s income each year',
            ],
            cardClass: 'trusts-type-card trusts-type-card--muted',
          },
          {
            title: 'Non-Grantor Lead Trust',
            list: [
              'A named beneficiary, ministry, or heirs receive remainder of trust after predetermined payout period',
              'Permanent transfer of asset',
              'Reduces gift or estate tax and removes asset from estate',
              'Income is taxed at the trust level each year',
            ],
            cardClass: 'trusts-type-card trusts-type-card--muted',
          },
        ],
      },
      {
        className: 'legacy-child-native-cta legacy-child-native-trusts-cta',
        anchorId: 'charitable-trusts-form',
        copyWrap: true,
        title: 'Income and impact.',
        titleHighlights: [
          { text: 'and', className: 'is-atlantean' },
          { text: 'impact', className: 'is-mango' },
        ],
        body: ['Let’s transform your generosity into a tax-saving, ministry-supporting win. Ready when you are.'],
        form: {
          fields: [
            { id: 'firstName', label: 'First Name*', type: 'text', required: true },
            { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true, placeholder: '(555) 555-5555' },
            { id: 'email', label: 'Email*', type: 'email', required: true },
            {
              id: 'trustProduct',
              label: 'Trust product of interest*',
              type: 'select',
              required: true,
              placeholder: 'Select one',
              options: [
                { value: 'charitable-remainder-trust', label: 'Charitable Remainder Trust' },
                { value: 'charitable-lead-trust', label: 'Charitable Lead Trust' },
              ],
            },
            { id: 'message', label: 'Message', type: 'textarea', rows: 4, placeholder: 'How can we help?' },
          ],
          submitLabel: 'Start planning',
        },
      },
    ],
  },
  '/services/legacy-giving/endowments': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-endowments',
    compact: true,
    hero: {
      lines: [
        { title: 'Generosity that lasts.', highlights: [{ text: 'lasts', className: 'is-atlantean' }] },
        { title: 'And lasts.', highlights: [{ text: 'lasts', className: 'is-mango' }] },
      ],
    },
    intro: {
      heading: 'Create an enduring legacy.',
      body: [
        'Your endowment is a gift that gives forever. The interest earnings from your carefully-invested donation support your chosen ministry or cause. Meanwhile, your original gift stays protected and continues to grow.',
        '**This generosity never runs out.**',
      ],
    },
    sections: [
      {
        className: 'legacy-child-native-endowments-duo',
        title: 'How it works',
        fullBleed: true,
        columns: 'three',
        columnsItems: [
          {
            slot: 1,
            type: 'flow-step',
            body: [
              'Designated assets are invested to ensure their protection and growth.',
            ],
          },
          {
            slot: 2,
            type: 'flow-step',
            body: [
              'Payments are made from ongoing interest earned from the gifted asset(s).',
            ],
          },
          {
            slot: 3,
            type: 'flow-step',
            body: [
              'An endowment requires that the principal remain intact indefinitely—or until sufficient assets have accumulated to ensure the endowment’s perpetuity.',
            ],
          },
          {
            slot: 4,
            type: 'support',
            title: 'Assets you may give',
            titleClassName: 'endowments-assets-title',
            html: '<p>Minimum funding requirements are <strong>$10,000</strong> for cash or securities, and <strong>$100,000</strong> for real estate.</p><p>Endowments may be funded with:</p><ul><li>Cash</li><li>Real estate</li><li>Securities (restricted and marketable)</li><li>Art</li><li>Antiques</li><li>Business interests</li><li>Other assets</li></ul>',
          },
        ],
      },
      {
        className: 'legacy-child-native-endowments-calculator',
        anchorId: 'endowment-investment-earnings-calculator',
        title: 'See how your endowment can keep giving.',
        titleHighlights: [{ text: 'keep giving', className: 'is-atlantean' }],
        widget: 'endowment-calculator',
      },
      {
        className: 'legacy-child-native-endowments-big-cta',
        title: 'Give once, forever.',
        titleHighlights: [{ text: 'forever', className: 'is-atlantean' }],
        subtitle: 'And bless generations.',
        actions: [],
      },
      {
        className: 'legacy-child-native-endowments-legacy-form',
        copyWrap: true,
        title: 'Begin the Endowment sign up process',
        body: [],
        form: {
          fields: [
            { id: 'firstName', label: 'First Name*', type: 'text', required: true },
            { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true },
            { id: 'email', label: 'Email*', type: 'email', required: true },
          ],
          submitLabel: 'Submit',
        },
      },
    ],
  },
  '/services/legacy-giving/generosity-fund': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-generosity-fund',
    compact: true,
    hero: {
      lines: [
        { title: 'Your giving.' },
        { title: 'Managed.', highlights: [{ text: 'Managed', className: 'is-mango' }] },
      ],
      actions: [
        { label: 'Open a Generosity Fund®', href: 'https://secure.agfinancial.org/generosityfund/signup' },
        {
          label: 'Open a traditional DAF',
          action: 'open_cta_form',
          targetAnchorId: 'traditional-daf-inline-form',
          className: 'is-outline is-tone-super-grey',
        },
      ],
    },
    intro: {
      heading: 'All your charitable giving in one place.',
      body: [
        'A **Generosity Fund**® is a Donor Advised Fund (DAF) that provides a convenient, tax-efficient way to manage your giving—from tithing to disaster relief, and all donations in between. Our frictionless process makes even complex securities **easier to give than ever**.',
      ],
    },
    preIntroSections: [
      {
        anchorId: 'traditional-daf-inline-form',
        className: 'legacy-child-native-generosity-request legacy-child-native-generosity-cta legacy-child-native-generosity-request-inline',
        copyWrap: true,
        title: 'Make the most of your giving.',
        titleHighlights: [{ text: 'most', className: 'is-white' }],
        body: [],
        form: {
          displayMode: 'inline_reveal',
          triggerMode: 'external',
          fields: [
            { id: 'name', label: 'Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true, placeholder: '(555) 555-5555' },
            { id: 'email', label: 'Email*', type: 'email', required: true },
          ],
          submitLabel: 'Submit',
        },
      },
    ],
    sections: [
      {
        className: 'legacy-child-native-steps',
        title: 'How it works',
        fullBleed: true,
        columns: 'three',
        cards: [
          {
            title: 'Create & contribute',
            body: 'Open a **Generosity Fund®** online, and fund it with cash or appreciated assets. You may receive immediate tax benefits.',
            cardClass: 'card2',
          },
          {
            title: 'Frictionless',
            body: 'AG Foundation takes it from there, keeping track of your giving while handling the details.',
            cardClass: 'card2',
          },
          {
            title: 'Whenever, wherever',
            body: 'Continue giving when and to whom you want by accessing your **Generosity Fund®** online. You may even give anonymously.',
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'legacy-child-native-assets legacy-child-native-generosity-assets',
        title: 'It starts with what you give.',
        titleHighlights: [{ text: 'what you give', className: 'is-atlantean' }],
        cards: [
          {
            title: 'What you give',
            cardClass: 'card2 generosity-fund-assets-card',
            list: [
              'Cash',
              'Household income',
              'Proceeds from selling a home or business',
              'Stocks',
              'Securities',
              'A variety of other funding sources',
              '$10,000 minimum',
              'Additional funding can be made with as little as $100, as often as you like.',
            ],
          },
        ],
        actions: [{ label: 'Open a Generosity Fund®', href: 'https://secure.agfinancial.org/generosityfund/signup' }],
      },
      {
        id: 'traditional-daf-form',
        anchorId: 'traditional-daf-form',
        className: 'legacy-child-native-generosity-request',
        copyWrap: true,
        title: 'Make the most of your giving.',
        titleHighlights: [{ text: 'most', className: 'is-white' }],
        body: [],
        form: {
          fields: [
            { id: 'name', label: 'Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true, placeholder: '(555) 555-5555' },
            { id: 'email', label: 'Email*', type: 'email', required: true },
          ],
          submitLabel: 'Submit',
        },
      },
      {
        className: 'legacy-child-native-generosity-outro',
        copyWrap: true,
        title: 'Simple, joyful giving.',
        subtitle: 'Powered by your generosity.',
        actions: [
          { label: 'Open a Generosity Fund®', href: 'https://secure.agfinancial.org/generosityfund/signup' },
          { label: 'Terms and Conditions', documentId: 'document-planned-giving-terms-and-conditions', ghost: true },
        ],
      },
    ],
  },
  '/services/legacy-giving/ministry-impact-fund': {
    pageClass: 'native-info-page--legacy-child native-info-page--legacy-ministry-impact',
    compact: true,
    hero: {
      lines: [
        { title: 'Any gift.', highlights: [{ text: 'gift', className: 'is-atlantean' }] },
        { title: 'Any asset.', highlights: [{ text: 'asset', className: 'is-atlantean' }] },
        { title: 'Unlocked.', highlights: [{ text: 'Unlocked', className: 'is-mango' }] },
      ],
    },
    intro: {
      heading: 'Most wealth isn’t cash.',
      body: [
        'It’s assets. A Ministry Impact Fund® makes it easy for donors to give in any form. No administrative hassle—just streamlined generosity that expands giving options, maximizes tax deductions, and eliminates capital gains.',
        '**This is generosity without limits.**',
      ],
    },
    sections: [
      {
        className: 'legacy-child-native-steps',
        title: 'How it works',
        fullBleed: true,
        columns: 'three',
        cards: [
          {
            title: 'Make the transfer',
            body: 'Your donor transfers cash or asset(s) to your Ministry Impact Fund®, potentially receiving a charitable deduction and minimized or eliminated capital gains.',
            cardClass: 'card2',
            actions: [
              { label: 'Open a Ministry Impact Fund®', to: '#ministry-impact-form' },
            ],
          },
          {
            title: 'Give us the keys',
            body: 'AG Foundation liquidates the asset(s) for you, handling all administrative details.',
            cardClass: 'card2',
            actions: [
              { label: 'Secure message upload', href: 'https://uploads.agfinancial.org/' },
            ],
          },
          {
            title: 'Put it to work',
            body: 'Your ministry gains immediate access to the cash.',
            cardClass: 'card2',
            actions: [
              { label: 'Talk to planned giving', href: 'mailto:plannedgiving@agfinancial.org' },
            ],
          },
        ],
      },
      {
        className: 'legacy-child-native-assets',
        title: 'It starts with the donor gift.',
        titleHighlights: [{ text: 'donor gift', className: 'is-atlantean' }],
        cards: [
          {
            title: 'Gift types',
            titleClassName: 'legacy-child-native-assets-card-title',
            cardClass: 'card2',
            list: [
              '**Cash**',
              '**Appreciated assets**',
              '**Stock** (see below)',
              '**Real estate**',
              '**Gifts-in-kind**',
              '**A variety of other gifts**',
              'Initial contribution required.',
            ],
          },
        ],
        actions: [
          { label: 'Open a Ministry Impact Fund®', to: '#ministry-impact-form' },
        ],
      },
      {
        className: 'legacy-child-native-stock',
        anchorId: 'stock-transfer',
        title: 'Transferring stock? Start here.',
        titleHighlights: [{ text: 'Start here', className: 'is-atlantean' }],
        body: [
          'Follow the two steps below. If you have questions or would like help, email **plannedgiving@AGFinancial.org** or call 417.447.2440.',
          '**1. Intent to Gift of Securities** — Complete this form (ignore section 3) and submit it via this secure message link. Indicate “Attn: Jason Idell” in the secure message.',
          '**2. Brokerage Letter of Authorization (LOA)** — Complete this form and submit it to your broker/dealer; however, notify the brokerage firm before sending the completed LOA form. Some broker/dealers may require additional paperwork.',
        ],
        actions: [
          { label: 'Intent to Gift form', documentId: 'document-planned-giving-intent-to-gift-form' },
          { label: 'Secure message upload', href: 'https://uploads.agfinancial.org/', ghost: true },
          { label: 'Brokerage LOA form', documentId: 'document-planned-giving-brokerage-loa-form', ghost: true },
        ],
      },
      {
        className: 'legacy-child-native-billboard',
        copyWrap: true,
        title: 'More joy in receiving.',
        titleHighlights: [{ text: 'joy', className: 'is-atlantean' }],
        subtitle: 'It’s easier than you think.',
        body: ['We’re ready to help your ministry receive non-cash assets and turn them into working funds.'],
      },
      {
        className: 'legacy-child-native-request',
        anchorId: 'ministry-impact-form',
        copyWrap: true,
        title: 'A legacy of giving.',
        titleHighlights: [{ text: 'legacy', className: 'is-white' }],
        body: ['We’re ready to help you explore how your gift can continue to give. And give. And give…'],
        form: {
          title: 'Talk with planned giving',
          subtitle: 'Let’s map out the best next step.',
          fields: [
            { id: 'firstName', label: 'First Name*', type: 'text', required: true },
            { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true, placeholder: '(555) 555-5555' },
            { id: 'email', label: 'Email*', type: 'email', required: true },
          ],
          submitLabel: 'Contact planned giving',
        },
      },
    ],
  },
};

const loanConsultantStatesByRegion = {
  northwest: ['AK', 'ID', 'MT', 'ND', 'OR', 'SD', 'UT', 'WA', 'WY'],
  south: ['AL', 'FL', 'GA', 'LA', 'MS', 'SC', 'TN'],
  southCentral: ['AR', 'KS', 'MO', 'NM', 'OK', 'TX'],
  southwest: ['AZ', 'CA', 'CO', 'HI', 'NV'],
  northCentral: ['IA', 'IL', 'IN', 'MI', 'MN', 'NE', 'OH', 'WI'],
  east: ['CT', 'DC', 'DE', 'KY', 'MA', 'MD', 'ME', 'NC', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VA', 'VT', 'WV'],
};

const loansChildPages = {
  '/services/loans/loan-consultants': {
    pageClass: 'native-info-page--loans-consultant',
    compact: true,
    hideIntro: true,
    hero: { title: 'Loan Consultants', highlight: 'Consultants' },
    intro: 'Talk with a consultant. Fill out the form to start a conversation with our consultants or find your region contact below.',
    sections: [
      {
        title: 'Select your location',
        hideTitle: true,
        className: 'loans-consultant-native-locations',
        locationFilter: {
          type: 'state',
          label: '',
          ariaLabel: 'Select your state',
          placeholder: 'Select your state',
          requireSelection: false,
          messageLayout: 'toggle',
          focusMessageCard: true,
        },
        cards: [
          {
            title: 'Emily Brinkley',
            subtitle: 'Northwest Region',
            phone: '417.447.2444',
            phoneHref: 'tel:4174472444',
            messagePanel: true,
            messageCta: 'Message Emily',
            consultantEmail: 'ebrinkley@agfinancial.org',
            states: loanConsultantStatesByRegion.northwest,
          },
          {
            title: 'Bruce Gibbons',
            subtitle: 'South Region',
            phone: '417.860.4176',
            phoneHref: 'tel:4178604176',
            messagePanel: true,
            messageCta: 'Message Bruce',
            states: loanConsultantStatesByRegion.south,
          },
          {
            title: 'Jason Gibbons',
            subtitle: 'South Central Region',
            phone: '417.860.6842',
            phoneHref: 'tel:4178606842',
            messagePanel: true,
            messageCta: 'Message Jason',
            states: loanConsultantStatesByRegion.southCentral,
          },
          {
            title: 'Jason Hopping',
            subtitle: 'Southwest Region',
            phone: '858.349.5728',
            phoneHref: 'tel:8583495728',
            messagePanel: true,
            messageCta: 'Message Jason',
            states: loanConsultantStatesByRegion.southwest,
          },
          {
            title: 'Randy Smith',
            subtitle: 'North Central Region',
            phone: '417.860.8174',
            phoneHref: 'tel:4178608174',
            messagePanel: true,
            messageCta: 'Message Randy',
            states: loanConsultantStatesByRegion.northCentral,
          },
          {
            title: 'Pat Williams',
            subtitle: 'East Region',
            phone: '334.318.6237',
            phoneHref: 'tel:3343186237',
            messagePanel: true,
            messageCta: 'Message Pat',
            states: loanConsultantStatesByRegion.east,
          },
        ],
      },
      {
        title: 'Talk with a consultant.',
        className: 'loans-consultant-native-contact',
        copyWrap: true,
        body: [
          'Share a few details below and our team will connect you with the right consultant.',
        ],
        form: {
          steps: [
            {
              id: 'contact',
              fields: [
                { id: 'firstName', label: 'First name*', type: 'text', required: true },
                { id: 'lastName', label: 'Last name*', type: 'text', required: true },
                { id: 'email', label: 'Email*', type: 'email', required: true },
                { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
              ],
              nextLabel: 'Next',
            },
            {
              id: 'details',
              fields: [
                { id: 'ministry', label: 'Ministry name', type: 'text' },
                { id: 'state', label: 'State', type: 'text', placeholder: 'Enter state' },
                { id: 'message', label: 'Message', type: 'textarea', rows: 4, placeholder: 'How can we help?' },
              ],
              backLabel: 'Back',
              submitLabel: 'Send message',
            },
          ],
          submitLabel: 'Send message',
        },
      },
    ],
  },
};

const retirementChildPages = {
  '/services/retirement/403b': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-403b',
    compact: true,
    hero: {
      justify: 'right',
      lines: [
        {
          title: 'Saving while serving.',
          highlights: [
            { text: 'Saving', className: 'is-atlantean' },
            { text: 'serving', className: 'is-mango' },
          ],
        },
      ],
    },
    intro: {
      heading: 'Ministry-powered retirement.',
      body: [
        'The AGFinancial 403(b) offers higher contribution limits and potential employer matching—advantages you won’t find with an IRA. Designed specifically for ministers and ministry employees, it’s a powerful way to save while you serve.',
      ],
      bgTone: 'sand',
      textTone: 'dark',
    },
    sections: [
      {
        className: 'retirement-403b-native-benefits-copy',
        title: 'With benefits like these…',
        subtitle: 'Smart benefits, strong advantages',
        body: [
          'The AGFinancial flagship retirement plan is customized specifically for ministers and ministry or organization employees. This is a plan exempt from ERISA. Choose from a variety of strategies.',
          'Includes minister’s housing allowance, higher contribution limits, and more.',
        ],
      },
      {
        className: 'retirement-403b-native-benefits-cards',
        fullBleed: true,
        columns: 'four',
        hideTitle: true,
        cards: RETIREMENT_403B_PLAN_FEATURE_CARDS,
      },
      {
        className: 'retirement-403b-native-rate-table',
        title: '403(b) Investment Rate',
        widget: 'retirement-403b-rate-table',
      },
      {
        className: 'retirement-child-native-strategies retirement-403b-native-strategy-options',
        title: 'Investment Strategy Options',
        fullBleed: true,
        columns: 'two',
        actionsBeforeCards: true,
        actions: [
          { label: 'View the monthly performance', documentId: 'document-monthly-performance' },
        ],
        cards: [
          {
            title: 'MBA Income Fund',
            body: 'AGFinancial’s flagship fund pays a fixed rate declared quarterly, with interest compounding monthly. Your investment is used to provide loans to build churches and ministry facilities across the country.',
            links: [
              { label: 'Download the MBA Fact sheet PDF', documentId: 'fund-descriptor-retirement-mba-income-fund' },
            ],
            actions: [
              { label: 'Prospectus', to: '/prospectus', ghost: true },
            ],
            cardClass: 'card2',
          },
          {
            title: 'Risk-Based Strategies',
            body: 'These pre-mixed strategies are based on risk tolerance levels, and create a diversified portfolio with a single investment choice.',
            actions: [
              { label: 'Prospectus', to: '/prospectus', ghost: true },
            ],
            accordions: [
              {
                title: 'Screened strategy PDFs',
                links: [
                  { label: 'Steward Conservative Strategy', documentId: 'fund-descriptor-retirement-steward-conservative-strategy' },
                  { label: 'Steward Moderate Strategy', documentId: 'fund-descriptor-retirement-steward-conservative-strategy' },
                  { label: 'Steward Balanced Strategy', documentId: 'fund-descriptor-retirement-steward-conservative-strategy' },
                  { label: 'Steward Aggressive Growth Strategy', documentId: 'fund-descriptor-retirement-steward-conservative-strategy' },
                  { label: 'Steward Diversified Equity Strategy', documentId: 'fund-descriptor-retirement-steward-conservative-strategy' },
                ],
              },
              {
                title: 'Index strategy PDFs',
                links: [
                  { label: 'Fidelity Asset Manager 40%', documentId: 'fund-descriptor-retirement-fidelity-asset-manager-40' },
                  { label: 'Fidelity Asset Manager 60%', documentId: 'fund-descriptor-retirement-fidelity-asset-manager-60' },
                  { label: 'Fidelity Asset Manager 85%', documentId: 'fund-descriptor-retirement-fidelity-asset-manager-85' },
                ],
              },
            ],
            cardClass: 'card2',
          },
          {
            title: 'Target-Date Strategies',
            body: 'Based on your target date of retirement, these screened strategies automatically adjust to become more conservative as your target date approaches.',
            actions: [
              { label: 'Prospectus', to: '/prospectus', ghost: true },
            ],
            accordions: [
              {
                title: 'View target-date fund PDFs',
                links: [
                  { label: 'Steward Target-Date Strategies', documentId: 'fund-descriptor-retirement-steward-target-date-strategies' },
                ],
              },
            ],
            cardClass: 'card2',
          },
          {
            title: 'Individual Investment Option',
            body: 'This option creates a fully custom-built portfolio designed specifically for you and your retirement goals.',
            actions: [
              { label: 'Prospectus', to: '/prospectus', ghost: true },
            ],
            accordions: [
              {
                title: 'View fund PDFs',
                links: [
                  { label: 'MBA Income Fund', documentId: 'fund-descriptor-retirement-mba-income-fund' },
                  { label: 'Steward Select Bond Fund', documentId: 'fund-descriptor-retirement-steward-select-bond-fund' },
                  { label: 'Steward Equity Market Neutral Fund', documentId: 'fund-descriptor-retirement-steward-equity-market-neutral-fund' },
                  { label: 'Steward Global Equity Income Fund', documentId: 'fund-descriptor-retirement-steward-global-equity-income-fund' },
                  { label: 'Steward Covered Call Income Fund', documentId: 'fund-descriptor-retirement-steward-covered-call-income-fund' },
                  { label: 'Fidelity 500 Index Fund', documentId: 'fund-descriptor-retirement-fidelity-500-index-fund' },
                  { label: 'Vanguard Total Bond Market Index Fund', documentId: 'fund-descriptor-retirement-vanguard-total-bond-market-index-fund' },
                ],
              },
            ],
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'retirement-403b-native-strategy-enroll-cta',
        hideTitle: true,
        justify: 'center',
        actions: [
          { label: 'Enroll now', to: '/services/retirement/403b/403b-individual-enrollment' },
        ],
      },
      {
        className: 'retirement-child-native-qualify',
        title: 'Who qualifies for the AGFinancial 403(b)?',
        fullBleed: true,
        columns: 'three',
        cards: [
          {
            title: 'Employees of eligible employers',
            body: 'For example: churches; denominational headquarters or councils; church-affiliated, tax-exempt 501(c)(3) organizations.',
            cardClass: 'card2',
            titleClassName: 'ret-403b-qualify-card-title',
          },
          {
            title: 'Others serving in a ministerial capacity',
            body: 'Such as a chaplain, campus pastor, or counselor in a non-ministry organization.',
            cardClass: 'card2',
            titleClassName: 'ret-403b-qualify-card-title',
          },
          {
            title: 'Self-employed credentialed ministers',
            body: 'Such as pastors, evangelists, or independent ministry leaders.',
            cardClass: 'card2',
            titleClassName: 'ret-403b-qualify-card-title',
          },
        ],
      },
      {
        className: 'retirement-child-native-enroll',
        title: 'Start your enrollment',
        columns: 'two',
        cards: [
          {
            title: 'For myself',
            actions: [{ label: 'Enroll now', to: '/services/retirement/403b/403b-individual-enrollment' }],
            cardClass: 'card2',
          },
          {
            title: 'For a group',
            actions: [{ label: 'Next steps', to: '/services/retirement/403b/403b-group-enrollment' }],
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'retirement-child-native-table',
        title: 'Annual Contribution Limits',
        table: {
          headers: ['403(b) Contribution Limit', '2025', '2024'],
          rows: [
            ['Under age 50 deferral limit (pre-tax and Roth after-tax)', 'The lesser of $23,500 or includible compensation.', 'The lesser of $23,000 or includible compensation.'],
            ['Age 50 and up deferral limit', 'The lesser of $31,000 or includible compensation.', 'The lesser of $30,500 or includible compensation.'],
            ['Age 60-63 deferral limit*', 'The lesser of $34,750 or includible compensation.', 'N/A'],
            ['Overall limit under age 50**', '$70,000', '$69,000'],
            ['Overall limit age 50 and up†', '$77,500', '$76,500'],
            ['Overall limit age 60-63*', '$81,250', 'N/A'],
          ],
        },
        fineprint: [
          '*The rule applies to individuals who will attain age 60 in the taxable year and continues until the taxable year in which they turn 64.',
          '**All types of contributions including deferrals, employer, and traditional after-tax. Cannot exceed includible compensation.',
          '†All types of contributions including deferrals, employer, and traditional after-tax; amounts over the general overall limit must be age 50 catch-up deferrals. Cannot exceed includible compensation except to the extent that the age 50 or older catch-up deferral has been utilized.',
          'Contact your own tax advisor before taking any action that would have a tax consequence. This information is not tax advice. Information is from sources deemed reliable. Information is subject to error, omission, withdrawal, or change.',
        ],
      },
      {
        className: 'retirement-child-native-rollover',
        title: 'A rollover is easy. Smart, too.',
        titleHighlights: [{ text: 'Smart, too.', className: 'is-melon' }],
        body: [
          'Rolling over your scattered retirement savings into a single AGFinancial 403(b) is surprisingly simple…and undeniably smart. One account. One login.',
        ],
        actions: [{ label: 'Let’s simplify things', to: '/services/retirement/rollovers' }],
      },
      {
        className: 'retirement-403b-native-housing',
        hideTitle: true,
        feature: {
          image: ministersHousingImage,
          imageAlt: 'Living room with fireplace',
          title: 'Retired Ministers Housing Allowance',
          body: [
            'The unique benefit—which gives ministers a significant tax savings—is not available through secular 403(b) plans or IRAs. It allows retired ministers to have distributions from the AGFinancial 403(b) plan designated as clergy housing allowance.',
            'The maximum housing allowance exemption in any tax year is the lesser of:',
            '• Your actual expenditures',
            '• The fair rental value of your home, as furnished, plus utilities',
            '• The amount distributed by your retirement plan to you and declared in advance as your housing allowance',
            '**Use the Quick Check feature below.**',
            '**Compare your annual housing expenses to Fair Rental Value (FRV), and determine the maximum amount you may claim.**',
          ],
        },
      },
      {
        className: 'retirement-403b-native-quickcheck',
        title: 'Quick Check',
        subtitle: 'Minister’s Housing Allowance',
        body: [
          'Answer a few questions, total your annual housing expenses, and compare to Fair Rental Value (FRV). You may save a PDF version of your summary, or submit it to a retirement consultant for review and discussion.',
        ],
        widget: 'retirement-minister-housing-quick-check',
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
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-403b',
    hero: {
      justify: 'center',
      titleSizeRem: 4.8,
      lineHeight: 0.92,
      lines: [
        {
          title: 'AGFinancial 403(b)',
          highlights: [{ text: '403', className: 'is-atlantean' }],
        },
        {
          title: 'Individual Enrollment',
          highlights: [{ text: 'Individual', className: 'is-mango' }],
        },
      ],
      bgTone: 'white',
    },
    intro: {
      heading: 'Start with the 403(b) plan summary.',
      body: [
        'Review the plan summary for eligibility, participation details, and key enrollment information before you complete your forms.',
      ],
      actions: [{ label: 'Download 403(b) Summary PDF', href: RETIREMENT_403B_PLAN_SUMMARY_URL }],
      justify: 'center',
      bgTone: 'blue',
      textTone: 'white',
    },
    sections: [
      {
        className: 'retirement-child-native-qualify',
        title: 'Confirm eligibility',
        subtitle: 'The AGFinancial 403(b) Retirement Plan is available to these participant groups.',
        fullBleed: true,
        columns: 'three',
        cards: [
          {
            title: 'Self-employed credentialed ministers',
            body: 'Assemblies of God credentialed ministers who are self-employed within the meaning of Internal Revenue Code 414(e)(5)(A)(i)(I). Example: an evangelist would qualify.',
            cardClass: 'card2',
          },
          {
            title: 'Ministers serving outside AG organizations',
            body: 'Assemblies of God credentialed ministers who provide ministry-related services to organizations unrelated to the Assemblies of God, such as a chaplain. The employer may contribute, or the minister may contribute directly.',
            cardClass: 'card2',
          },
          {
            title: 'Employees of eligible employers',
            body: 'Employees of an Assemblies of God church, the General Council, a District Council, or another organization controlled by or associated with the Assemblies of God that is tax-exempt under 501(c)(3).',
            cardClass: 'card2',
          },
        ],
        fineprint: [
          '*501(c)(3) organizations are tax-exempt entities organized and operated exclusively for religious, charitable, scientific, testing for public safety, literary, or educational purposes, among other qualified purposes under the Internal Revenue Code.',
        ],
      },
      {
        className: 'retirement-child-native-strategies',
        title: 'Complete your enrollment',
        subtitle: 'Three steps. One clear path.',
        fullBleed: true,
        sand: true,
        columns: 'three',
        cards: [
          {
            title: '1. Complete the enrollment form',
            body: 'Fill out the AGFinancial 403(b) Individual Enrollment form with the information needed to open your account.',
            actions: [{ label: 'Download Enrollment Form', href: RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_FORM_URL }],
            cardClass: 'card2 ministers-group-life-step-card',
          },
          {
            title: '2. Return your enrollment form',
            body: 'Send the completed enrollment form by mail, fax, or secure online submission.',
            actions: [{ label: 'Submit securely online', href: RETIREMENT_SECURE_UPLOAD_URL }],
            cardClass: 'card2 ministers-group-life-step-card',
          },
          {
            title: '3. Complete payroll deduction',
            body: 'Complete the Payroll Deduction Agreement Form to request pre-tax salary reduction contributions or after-tax Roth 403(b) contributions. Keep a copy for your records and send the original form to your employer.',
            actions: [{ label: 'Download Payroll Deduction Form', href: RETIREMENT_403B_PAYROLL_DEDUCTION_FORM_URL }],
            cardClass: 'card2 ministers-group-life-step-card',
          },
        ],
        addressBlock: {
          className: 'ministers-group-life-copy-address',
          title: 'Mail or fax completed forms to:',
          lines: ['AGFinancial', 'PO Box 2515', 'Springfield, MO 65801'],
        },
        fineprint: '**FAX:** 417.520.0406',
      },
    ],
  },
  '/services/retirement/403b/403b-group-enrollment': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-403b',
    hero: {
      justify: 'center',
      lines: [
        {
          title: 'AGFinancial 403(b)',
          highlights: [{ text: '403', className: 'is-atlantean' }],
        },
        {
          title: 'Group Enrollment',
          highlights: [{ text: 'Group', className: 'is-mango' }],
        },
      ],
      bgTone: 'white',
    },
    intro: {
      heading: 'How do I enroll my staff in AGFinancial 403(b)?',
      body: [
        'Use these simple steps to establish your organization’s plan, collect employee enrollment forms, and finish the paperwork needed to begin payroll contributions.',
      ],
      actions: [
        { label: 'Download Plan Summary', href: RETIREMENT_403B_PLAN_SUMMARY_URL },
      ],
      justify: 'center',
      bgTone: 'blue',
      textTone: 'white',
    },
    sections: [
      {
        className: 'retirement-child-native-qualify',
        title: 'Confirm eligibility',
        subtitle: 'Use the group enrollment path when your organization is establishing a plan for eligible ministers or ministry employees.',
        fullBleed: true,
        columns: 'three',
        cards: [
          {
            title: 'Assemblies of God churches',
            body: 'Use group enrollment if your church is establishing an AGFinancial 403(b) plan for eligible ministers or ministry employees. This is the employer setup path for churches sponsoring staff participation.',
            cardClass: 'card2',
          },
          {
            title: 'General and district councils',
            body: 'The General Council of the Assemblies of God and District Councils use this path when establishing 403(b) participation for employees. It supports employer setup, enrollment collection, and payroll coordination.',
            cardClass: 'card2',
          },
          {
            title: 'AG-affiliated 501(c)(3) ministries',
            body: 'Organizations controlled by or associated with the Assemblies of God that are tax-exempt under 501(c)(3) can use group enrollment for eligible employees. Choose the correct agreement below based on whether your ministry is a church or QCCO, or an NQCCO.',
            cardClass: 'card2',
          },
        ],
        fineprint: [
          '*501(c)(3) organizations are tax-exempt entities organized and operated exclusively for religious, charitable, scientific, testing for public safety, literary, or educational purposes, among other qualified purposes under the Internal Revenue Code.',
        ],
      },
      {
        className: 'retirement-child-native-strategies retirement-403b-group-enrollment-steps',
        title: 'Complete your enrollment',
        subtitle: 'Easy steps.',
        fullBleed: true,
        sand: true,
        columns: 'two',
        cards: [
          {
            title: '1. Establish your plan',
            body: 'Start by selecting the agreement that matches your ministry structure, then work through the setup items below in order so employer setup, employee enrollment, and payroll administration all stay aligned.',
            links: [
              { label: 'Agreement 1: Church or QCCO', href: RETIREMENT_403B_QCCO_AGREEMENT_URL },
              { label: 'Agreement 2: NQCCO', href: RETIREMENT_403B_NQCCO_AGREEMENT_URL },
              { label: '403(b) Terms & Definitions', to: '/services/retirement/403b/403b-terms-definitions' },
              { label: 'Download Enrollment Form', href: RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_FORM_URL },
              { label: 'Download Payroll Deduction Form', href: RETIREMENT_403B_PAYROLL_DEDUCTION_FORM_URL },
              { label: 'Submit securely online', href: RETIREMENT_SECURE_UPLOAD_URL },
            ],
            list: [
              'Choose the correct agreement for your organization type.',
              'Review the 403(b) terms and definitions before collecting employee paperwork.',
              'Have each participating employee complete an enrollment form.',
              'Collect completed forms and return them through secure upload, mail, or fax.',
              'Complete payroll deduction setup for each participating employee.',
              'QCCO = Qualified Church-Controlled Organization.',
              'NQCCO = Nonqualified Church-Controlled Organization.',
            ],
            fineprint: [
              'The service agreement helps define employer and AGFinancial responsibilities for administration, hardship distributions, and plan loans.',
              'Mail or fax completed forms to:',
              'AGFinancial',
              'PO Box 2515',
              'Springfield, MO 65801',
              '**FAX:** 417.520.0406',
            ],
            actions: [],
            cardClass: 'card2 ministers-group-life-step-card',
          },
        ],
      },
    ],
  },
  '/services/retirement/409a': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-409a',
    compact: true,
    hero: {
      lines: [
        { title: 'Beyond the' },
        { title: 'limits.', highlights: [{ text: 'limits.', className: 'is-mango' }] },
      ],
    },
    intro: {
      heading: 'Boundary-free future.',
      body: [
        'Where standard retirement plan contributions max out, a 409A Deferred Compensation Plan steps in. Exclusively for ministers and qualified church organizations, it allows participants to defer additional income and reduce current taxes.',
      ],
      actions: [{ label: 'Find my consultant', to: '/services/retirement/retirement-consultants' }],
    },
    sections: [
      {
        className: 'retirement-child-native-scenarios',
        title: '409A considerations',
        fullBleed: true,
        columns: 'three',
        cards: [
          {
            title: 'Maxed-out',
            body: 'The participant wants to contribute above the maximum limitation of the AG 403(b) plan.',
            cardClass: 'card2',
          },
          {
            title: 'Lost time',
            body: 'The participant has several years’ worth of contributions from an employer who has not been contributing regularly, and/or the employer wants to send a lump sum plus monthly contributions.',
            cardClass: 'card2',
          },
          {
            title: 'Gift deposit',
            body: 'The contribution is a lump-sum deposit given to the minister as a retirement gift.',
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'retirement-child-native-quote',
        hideTitle: true,
        title: '409A deferment',
        body: [
          'A well-drafted Deferred Compensation Plan can allow for deferment of **all taxable compensation** until distribution. The money still legally belongs to the employer, but it can be set aside and invested for growth in the 409A.',
        ],
      },
      {
        className: 'retirement-child-native-cta',
        copyWrap: true,
        title: 'Is a 409A right for you?',
        subtitle: 'Let’s walk through it together.',
        form: {
          title: 'Start the conversation',
          fields: [
            { id: 'firstName', label: 'First Name*', type: 'text', required: true },
            { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true, placeholder: '(555) 555-5555' },
            { id: 'email', label: 'Email*', type: 'email', required: true },
            { id: 'organizationName', label: 'Organization Name*', type: 'text', required: true },
            { id: 'organizationWebsite', label: 'Organization Website', type: 'text' },
            { id: 'city', label: 'City*', type: 'text', required: true },
            { id: 'state', label: 'State*', type: 'text', required: true },
            { id: 'message', label: 'How can we help?', type: 'textarea', rows: 4 },
          ],
          submitLabel: 'Follow-up with me',
        },
      },
      {
        className: 'retirement-child-native-teaser',
        title: '409A deserves love too.',
        body: ['The ugly stepchild of retirement. Just ask Kyle.'],
      },
    ],
  },
  '/services/retirement/iras': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-iras',
    compact: true,
    hero: {
      lines: [
        {
          title: 'Individual Retirement Account (IRA)',
          highlights: [{ text: '(IRA)', className: 'is-mango' }],
        },
      ],
    },
    intro: {
      heading: 'Take that, taxes.',
      headingHighlights: [{ text: 'that', className: 'is-melon' }],
      body: [
        'Tax advantages and a broad range of investment options can anchor your retirement savings. Whether you’re starting a nest egg or adding to existing plans, an IRA may be the perfect fit for your needs and goals.',
      ],
      actions: [
        { label: 'Fund an IRA', to: '/services/retirement/iras/fund-an-ira' },
        { label: 'Contribution Limits', to: '/services/retirement/iras#IRA-contribution-limits', ghost: true },
      ],
    },
    sections: [
      {
        className: 'retirement-child-native-ira-types',
        hideTitle: true,
        columns: 'two',
        cards: [
          {
            title: 'Traditional IRA',
            body: 'A Traditional IRA lets your contributions and earnings grow tax-deferred. You won’t pay taxes on them until you withdraw the money in retirement. This allows your savings to compound faster over time, plus your contributions are deductible on your tax returns.',
            cardClass: 'card2',
          },
          {
            title: 'Roth IRA',
            body: 'A Roth IRA lets your savings grow completely tax-free. Unlike a Traditional IRA, you pay taxes on your contributions now, but in retirement you can withdraw everything—including all your earnings—without paying any taxes.',
            cardClass: 'card2',
          },
        ],
        actions: [{ label: 'Open IRA', href: 'https://secure.agfinancial.org/invest' }],
      },
      {
        className: 'retirement-child-native-comparison',
        fullBleed: true,
        title: 'The differences. At a glance.',
        titleHighlights: [{ text: 'At a glance', className: 'is-mango' }],
        columns: 'two',
        cards: [
          {
            title: 'Traditional',
            list: [
              'Must have earned income',
              'No income limits to establish',
              'Contributions may be tax-deductible',
              'Earnings are tax-deferred until distributed',
              'Distributions may begin at age 59½',
              'Early distributions may be subject to penalty',
              'Required minimum distributions after age 72 (70½ if reached prior to January 1, 2020)',
            ],
            cardClass: 'card2',
          },
          {
            title: 'Roth',
            list: [
              'Income limits must be met for Roth IRA eligibility',
              'Contributions are not tax-deductible',
              'No age limit to contribute as long as you have earned income',
              'Earnings may be tax-free at distribution if qualified',
              'Principal contributions may be distributed without penalty',
              'Qualified distributions on earnings may begin at 59½',
              'Early distributions on earnings are subject to penalty',
              'No required distribution age',
              'Traditional IRAs may be converted to Roth IRAs',
            ],
            cardClass: 'card2',
          },
        ],
        fineprint: [
          'Contact your tax advisor. Additional AGFinancial early redemption penalties and IRA custodial fees may apply.',
        ],
      },
      {
        className: 'retirement-ira-native-rates',
        title: 'IRA Investment Rates',
        widget: 'retirement-ira-rate-table',
        body: [],
        fineprint: [
          'Rates subject to change. Demand certificates are investments that do not represent cash and are payable within 30 days after demand by the investor. Penalties may apply to redemptions prior to maturity.',
          'This is not an offer to sell securities referred to herein and we are not soliciting you to purchase these securities. The offering is made only by the Offering Circular which includes risk factors. The Offering Circular may be obtained by writing or calling AGFinancial or by clicking **here**.',
          'Not FDIC or SIPC Insured. Not a Bank Deposit. No AGFinancial Guarantee.',
          '**AGFinancial is a DBA of Assemblies of God Loan Fund, an affiliated entity of Assemblies of God Financial Services Group.**',
        ],
      },
      {
        className: 'retirement-ira-native-limits',
        anchorId: 'IRA-contribution-limits',
        title: 'Roth and Traditional IRA Contribution Limits',
        table: {
          headers: ['Age', '2025', '2024'],
          rows: [
            ['Age 49 and under', '100% of compensation, up to $7,000', '100% of compensation, up to $7,000'],
            ['Age 50 and older', '100% of compensation, up to $8,000', '100% of compensation, up to $8,000'],
          ],
        },
        fineprint: [
          'Your modified adjusted gross income (MAGI) may affect your eligibility to make contributions to a Roth IRA, as well as limit the deductibility of contributions to a Traditional IRA.',
          '**Contact your own tax advisor before taking any action that would have a tax consequence. This information is not tax advice. Information is from sources deemed reliable. Information is subject to error, omission, withdrawal, or change.**',
        ],
      },
      {
        className: 'retirement-child-native-rollover',
        title: 'Already have an IRA? Simplify.',
        titleHighlights: [{ text: 'Simplify.', className: 'is-melon' }],
        body: [
          'Rolling over your other retirement savings into a single AGFinancial IRA is surprisingly simple and undeniably smart. One account. One login.',
        ],
        actions: [{ label: 'Let’s simplify things', to: '/services/retirement/rollovers' }],
      },
      {
        className: 'retirement-child-native-cta retirement-ira-native-cta',
        copyWrap: true,
        title: 'Retire a little every day.',
        titleHighlights: [{ text: 'every day', className: 'is-mango' }],
        subtitle: 'Starting now.',
        body: [],
        actions: [{ label: 'Reach my consultant', to: '/services/retirement/retirement-consultants' }],
      },
    ],
  },
  '/services/retirement/iras/fund-an-ira': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-simple native-info-page--retirement-fund-ira',
    compact: true,
    hero: { title: 'Fund an IRA', highlight: 'IRA' },
    hideIntro: true,
    intro: 'Start your IRA funding process and choose the retirement strategy that fits your goals.',
    sections: [
      {
        className: 'retirement-fund-ira-native-shell',
        hideTitle: true,
        sand: true,
        widget: 'retirement-fund-ira',
        body: [],
      },
    ],
  },
  '/services/retirement/retirement-consultants': {
    pageClass: 'native-info-page--loans-consultant native-info-page--retirement-consultants',
    compact: true,
    hero: { title: 'Retirement Consultants', highlight: 'Consultants' },
    hideIntro: true,
    intro: 'Talk with a consultant. Fill out the form to start a conversation with our consultants or find your region contact below.',
    sections: [
      {
        title: 'Select your location',
        hideTitle: true,
        className: 'loans-consultant-native-locations',
        locationFilter: {
          type: 'state',
          label: '',
          ariaLabel: 'Select your state',
          placeholder: 'Select your state',
          requireSelection: false,
          messageLayout: 'toggle',
          focusMessageCard: true,
        },
        cards: [],
      },
      {
        title: 'Talk with a consultant.',
        className: 'loans-consultant-native-contact',
        copyWrap: true,
        body: [
          'Share a few details below and our team will connect you with the right consultant.',
        ],
        form: {
          steps: [
            {
              id: 'contact',
              fields: [
                { id: 'firstName', label: 'First name*', type: 'text', required: true },
                { id: 'lastName', label: 'Last name*', type: 'text', required: true },
                { id: 'email', label: 'Email*', type: 'email', required: true },
                { id: 'phone', label: 'Phone*', type: 'tel', placeholder: '(555) 555-5555', required: true },
              ],
              nextLabel: 'Next',
            },
            {
              id: 'details',
              fields: [
                { id: 'churchOrMinistry', label: 'Church or ministry', type: 'text' },
                { id: 'state', label: 'State', type: 'text', placeholder: 'Enter state' },
                { id: 'message', label: 'Message', type: 'textarea', rows: 4, placeholder: 'How can we help?' },
              ],
              backLabel: 'Back',
              submitLabel: 'Send message',
            },
          ],
          submitLabel: 'Send message',
        },
      },
    ],
  },
  '/services/retirement/rollovers': {
    pageClass: 'native-info-page--retirement-child native-info-page--retirement-simple native-info-page--retirement-rollovers',
    compact: true,
    hero: {
      lines: [
        { title: 'One account.' },
        { title: 'One login.', highlights: [{ text: 'login', className: 'is-mango' }] },
      ],
    },
    intro: {
      heading: 'One future. Yours.',
      headingHighlights: [{ text: 'Yours.', className: 'is-melon' }],
      body: [
        'A rollover lets you move funds from one retirement account into an AGFinancial 403(b) without paying taxes or penalties. It’s just that simple. A rollover is an easier way to access and manage your retirement.',
      ],
    },
    sections: [
      {
        className: 'retirement-rollovers-native-options',
        title: 'Move your funds.',
        columns: 'two',
        cards: [
          {
            title: 'Rollover',
            body: 'Traditional IRAs can be rolled-over any time. Otherwise, you may roll over because of a qualifying event, such as a separation from service, disability, or turning age 59½. If you meet one of these qualifiers, you may roll over your 401(k), 457, or 403(b).',
            actions: [{ label: 'Initiate a rollover', to: '/services/retirement/rollovers#start-the-process' }],
            cardClass: 'card2',
          },
          {
            title: 'Transfer',
            body: 'A transfer occurs between accounts of the same kind, so you must already have a 403(b) through a current employer and not meet any of the rollover conditions. AGFinancial must be an approved vendor of your employer in order to transfer a 403(b).',
            actions: [{ label: 'Start a transfer', to: '/services/retirement/rollovers#start-the-process' }],
            cardClass: 'card2',
          },
        ],
      },
      {
        className: 'retirement-rollovers-native-process',
        anchorId: 'start-the-process',
        title: 'Start the process',
        body: [
          '1) Download and complete the Rollover/Transfer form below.',
          '2) Return the completed form, along with the most recent statement(s) from the other account(s) to the address below.',
          '3) A confirmation letter will be sent to you when your rollover or transfer is complete.',
        ],
        addressBlock: {
          className: 'rollovers-copy-address',
          title: 'AGFinancial',
          lines: ['PO Box 2515', 'Springfield MO 65801'],
        },
        actions: [
          {
            label: 'Rollover/Transfer Form',
            documentId: 'document-retirement-rollover-transfer-form',
          },
        ],
      },
      {
        className: 'retirement-rollovers-native-cta retirement-child-native-cta',
        copyWrap: true,
        title: 'Simple is better.',
        titleHighlights: [{ text: 'Simple', className: 'is-white' }],
        body: [
          'Our rollover specialists are happy to help focus your retirement.',
        ],
        form: {
          title: '',
          subtitle: '',
          fields: [
            { id: 'firstName', label: 'First Name*', type: 'text', required: true },
            { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
            { id: 'phone', label: 'Phone*', type: 'tel', required: true, placeholder: '(555) 555-5555' },
            { id: 'email', label: 'Email*', type: 'email', required: true },
          ],
          submitLabel: 'Follow-up with me',
        },
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
      pageClass: 'native-info-page--careers',
      compact: true,
      hero: {
        lines: [
          { title: 'Be part of something' },
          { title: 'BIGGER.', highlights: [{ text: 'BIGGER', className: 'is-white' }] },
        ],
      },
      intro: {
        heading: 'Faith + career.',
        body: [
          'You can make a difference in your work. We mean that, and our customers experience it. Our office ecosystem is at the intersection of ministry and expertise. At AGFinancial, it’s our desire to honor Jesus by doing great work, and by treating others well.',
        ],
        emphasis: 'What you do here truly matters.',
      },
      sections: [
        {
          title: 'Just a few reasons you’ll love working here…',
          className: 'careers-native-benefits',
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
          title: 'Your work matters.',
          titleHighlights: [{ text: 'matters', className: 'is-atlantean' }],
          body: ['As part of our team, you’ll make a difference every single day.'],
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
      hero: {
        lines: [
          { title: 'We’re making' },
          {
            title: 'a difference… thanks to you.',
            highlights: [
              { text: 'difference', className: 'is-mango' },
              { text: 'you', className: 'is-atlantean' },
            ],
          },
        ],
      },
      intro: {
        heading: 'Put your money where your faith is.',
        body: [
          'AGFinancial was created to support churches and ministries, ministers, and individuals by improving financial health and growing the Kingdom of God. As a client, you become part of that vision. We’re ministry allies.',
        ],
        emphasis: 'It’s our privilege to serve you, **alongside** you.',
      },
      sections: [
        {
          title: 'Impact highlights',
          hideTitle: true,
          className: 'impact-native-stats',
          featureIntro: {
            heading: 'Serving you, alongside you.',
            body: 'AGFinancial was created to support churches and ministries, ministers, and individuals by improving financial health while growing God’s kingdom. As a client, you become part of that vision.',
            emphasis: 'We’re ministry allies.',
          },
          columns: 'two',
          cards: [
            {
              title: '4,000',
              titleClassName: 'countup',
              subtitle: 'churches and ministries fueled each year.',
              body: 'From first conversation to final funding, we help ministries move from idea to opening day with financing that understands church realities.',
              to: '/services/loans',
              cta: 'Explore loans',
              stretchedLink: {
                label: 'Explore loans',
                to: '/services/loans',
              },
              cardClass: 'impact-native-card impact-native-card--loans',
            },
            {
              title: '$450 million',
              titleClassName: 'countup',
              subtitle: 'distributed to ministries through AG Foundation.',
              body: 'That’s the power of generous donors using smart strategies.',
              to: '/services/legacy-giving',
              cta: 'Plan with us',
              stretchedLink: {
                label: 'Plan with us',
                to: '/services/legacy-giving',
              },
              cardClass: 'impact-native-card impact-native-card--legacy',
            },
            {
              title: '5,117',
              titleClassName: 'countup',
              subtitle: 'mission trips covered and protected.',
              body: 'Peace of mind allows you to focus on what matters at home and abroad: serving others, and sharing the Gospel with confidence.',
              to: '/services/insurance',
              cta: 'Cover your ministry',
              stretchedLink: {
                label: 'Cover your ministry',
                to: '/services/insurance',
              },
              cardClass: 'impact-native-card impact-native-card--insurance',
            },
            {
              title: '29,000+',
              titleClassName: 'countup',
              subtitle: 'retirements planned.',
              body: 'Your participation helps individuals, churches, ministries—and you—step confidently into the next season.',
              to: '/services/retirement',
              cta: 'Start your tomorrow',
              stretchedLink: {
                label: 'Start your tomorrow',
                to: '/services/retirement',
              },
              cardClass: 'impact-native-card impact-native-card--retirement',
            },
          ],
        },
      ],
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
      hero: { title, highlight: null },
      intro: {
        heading: "We're committed to accessibility.",
        body: [
          'AGFinancial is committed to ensuring visitors with disabilities have the same quality of access to all the information on our website as non-disabled visitors. We are continually improving the user experience for everyone and applying updates to meet or exceed accessibility standards.',
        ],
        justify: 'left',
      },
      sections: [
        {
          title: 'Conformance Status',
          html: '<p>The <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noreferrer noopener">Web Content Accessibility Guidelines (WCAG)</a> define requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. The AGFinancial website is fully conformant with WCAG Level A and partially conformant with WCAG Level AA.</p>',
        },
        {
          title: 'Limitations',
          body: [
            'Limitations to WCAG Level AA conformance on the AGFinancial website may include color contrast. To increase the color contrast, follow these instructions according to your operating system:',
          ],
          html: '<ul><li><a href="https://osxdaily.com/2014/10/22/increase-contrast-mac-os-x-yosemite/" target="_blank" rel="noreferrer noopener">Increase Contrast for Mac OS</a></li><li><a href="https://support.microsoft.com/en-us/help/13862/windows-10-use-high-contrast-mode" target="_blank" rel="noreferrer noopener">Increase Contrast for Windows</a></li></ul>',
        },
        {
          title: 'Give Feedback',
          body: [
            'We welcome your feedback on the accessibility of our website. Please let us know if you encounter accessibility barriers by contacting us.',
          ],
          actions: [{ label: 'Contact Us', to: '/contact-us' }],
        },
      ],
      actions: [],
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
