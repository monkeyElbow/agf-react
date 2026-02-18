export const contentBlockBlueprintsByPath = {
  '/': [
    {
      id: 'top_strip',
      name: 'Top Strip',
      kind: 'top_strip',
      mode: 'static',
      settings: {
        showPhone: true,
        showLogin: true,
        ratesLabel: 'Ask about our rates!',
      },
      editableFields: [
        { id: 'showPhone', label: 'Show phone', type: 'boolean' },
        { id: 'showLogin', label: 'Show secure login', type: 'boolean' },
        { id: 'ratesLabel', label: 'Rates label', type: 'text' },
      ],
    },
    {
      id: 'hero',
      name: 'Hero',
      kind: 'hero',
      mode: 'static',
      settings: {
        eyebrow: "Today's investment",
        title: "Tomorrow's church",
        ctaLabel: 'Explore investments',
      },
      editableFields: [
        { id: 'eyebrow', label: 'Eyebrow copy', type: 'text' },
        { id: 'title', label: 'Title copy', type: 'text' },
        { id: 'ctaLabel', label: 'Button label', type: 'text' },
      ],
    },
    {
      id: 'services_grid',
      name: 'Services Grid',
      kind: 'services_grid',
      mode: 'static',
      settings: {
        columns: 3,
        featuredCard: 'View Rates',
      },
      editableFields: [
        { id: 'columns', label: 'Desktop columns', type: 'number' },
        { id: 'featuredCard', label: 'Featured card title', type: 'text' },
      ],
    },
    {
      id: 'impact_stat',
      name: 'Impact + Countup',
      kind: 'impact_stat',
      mode: 'static',
      settings: {
        countUp: true,
        statValue: '105',
      },
      editableFields: [
        { id: 'countUp', label: 'Enable count up', type: 'boolean' },
        { id: 'statValue', label: 'Stat value', type: 'text' },
      ],
    },
    {
      id: 'cta_form',
      name: 'CTA Form',
      kind: 'cta_form',
      mode: 'static',
      settings: {
        submitLabel: 'Send my message',
        successText: 'Thanks. We will reach out soon.',
      },
      editableFields: [
        { id: 'submitLabel', label: 'Submit button', type: 'text' },
        { id: 'successText', label: 'Success message', type: 'text' },
      ],
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      kind: 'newsletter',
      mode: 'static',
      settings: {
        submitLabel: 'Sign me up',
        successText: 'Thanks, you are on the list.',
      },
      editableFields: [
        { id: 'submitLabel', label: 'Submit button', type: 'text' },
        { id: 'successText', label: 'Success message', type: 'text' },
      ],
    },
  ],
  '/services': [
    {
      id: 'hero_pie',
      name: 'Service Pie Hero',
      kind: 'hero_pie',
      mode: 'static',
      settings: {
        autoplay: true,
        autoplayMs: 2400,
      },
      editableFields: [
        { id: 'autoplay', label: 'Autoplay wedges', type: 'boolean' },
        { id: 'autoplayMs', label: 'Autoplay interval (ms)', type: 'number' },
      ],
    },
    {
      id: 'intro',
      name: 'Intro Band',
      kind: 'intro',
      mode: 'static',
      settings: {
        heading: 'A complete financial strategy',
        centered: true,
      },
      editableFields: [
        { id: 'heading', label: 'Heading text', type: 'text' },
        { id: 'centered', label: 'Center align content', type: 'boolean' },
      ],
    },
    {
      id: 'services_cards',
      name: 'Service Cards',
      kind: 'card_grid',
      mode: 'static',
      settings: {
        cardStyle: 'card2',
        showIcons: false,
      },
      editableFields: [
        { id: 'cardStyle', label: 'Card style token', type: 'text' },
        { id: 'showIcons', label: 'Show icons', type: 'boolean' },
      ],
    },
    {
      id: 'matters_band',
      name: 'What You Do Matters',
      kind: 'cta_band',
      mode: 'static',
      settings: {
        background: 'blue',
      },
      editableFields: [{ id: 'background', label: 'Background style', type: 'text' }],
    },
    {
      id: 'testimonials',
      name: 'Testimonials',
      kind: 'testimonials',
      mode: 'static',
      settings: {
        carousel: true,
      },
      editableFields: [{ id: 'carousel', label: 'Use carousel rotation', type: 'boolean' }],
    },
  ],
  '/services/loans': [
    { id: 'hero', name: 'Hero', kind: 'hero', mode: 'static', settings: {}, editableFields: [] },
    { id: 'intro', name: 'Intro', kind: 'intro', mode: 'static', settings: {}, editableFields: [] },
    { id: 'loan_options', name: 'Loan Options Grid', kind: 'card_grid', mode: 'static', settings: {}, editableFields: [] },
    { id: 'value_cards', name: 'Value Cards', kind: 'card_grid', mode: 'static', settings: {}, editableFields: [] },
    { id: 'cta_band', name: 'CTA Band', kind: 'cta_band', mode: 'static', settings: {}, editableFields: [] },
  ],
  '/services/investments': [
    { id: 'hero', name: 'Hero', kind: 'hero', mode: 'static', settings: {}, editableFields: [] },
    { id: 'intro', name: 'Intro', kind: 'intro', mode: 'static', settings: {}, editableFields: [] },
    { id: 'certificates', name: 'Certificates Cards', kind: 'card_grid', mode: 'static', settings: {}, editableFields: [] },
    { id: 'rates_table', name: 'Rates Table', kind: 'rates_table', mode: 'static', settings: {}, editableFields: [] },
    { id: 'investor_cta', name: 'Already Investor CTA', kind: 'cta_band', mode: 'static', settings: {}, editableFields: [] },
    { id: 'laddering', name: 'Laddering Strategy', kind: 'calculator_cta', mode: 'static', settings: {}, editableFields: [] },
    { id: 'testimonials', name: 'Testimonials', kind: 'testimonials', mode: 'static', settings: {}, editableFields: [] },
    { id: 'cash_reserves', name: 'Church Cash Reserves', kind: 'feature_panel', mode: 'static', settings: {}, editableFields: [] },
  ],
  '/services/retirement': [
    { id: 'hero', name: 'Hero', kind: 'hero', mode: 'static', settings: {}, editableFields: [] },
    { id: 'intro', name: 'Intro', kind: 'intro', mode: 'static', settings: {}, editableFields: [] },
    { id: 'plan_features', name: 'Plan Features', kind: 'card_grid', mode: 'static', settings: {}, editableFields: [] },
    { id: 'split_options', name: 'IRA + 409A Split', kind: 'split_panel', mode: 'static', settings: {}, editableFields: [] },
    { id: 'housing_allowance', name: 'Housing Allowance CTA', kind: 'cta_band', mode: 'static', settings: {}, editableFields: [] },
  ],
  '/rates': [
    { id: 'certificates_table', name: 'Certificates Rate Table', kind: 'rates_table', mode: 'dynamic', settings: {}, editableFields: [] },
    { id: 'ira_table', name: 'IRA Rate Table', kind: 'rates_table', mode: 'dynamic', settings: {}, editableFields: [] },
    { id: 'disclaimer', name: 'Disclosure Copy', kind: 'legal_copy', mode: 'static', settings: {}, editableFields: [] },
  ],
};

export function genericPageBlockBlueprint() {
  return [
    {
      id: 'page_content',
      name: 'Page Content',
      kind: 'content',
      mode: 'static',
      settings: {
        notes: 'Static content placeholder for this route.',
      },
      editableFields: [
        { id: 'notes', label: 'Migration notes', type: 'text' },
      ],
    },
  ];
}
