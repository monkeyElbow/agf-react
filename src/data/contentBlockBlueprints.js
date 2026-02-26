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
  '/test': [
    {
      id: 'hero',
      name: 'Dynamic Hero Test',
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        animationPreset: 'default',
        bgTone: 'white',
        justify: 'center',
        heightMode: 'default',
        heightSvh: 42,
        lineGap: 0,
        line1Text: 'Dynamic',
        line1ClassName: '',
        line1HighlightText: 'Dynamic',
        line1HighlightColor: 'is-atlantean',
        line1HighlightsJson: '[{\"text\":\"Dynamic\",\"className\":\"is-atlantean\"}]',
        line2Text: 'Panels.',
        line2ClassName: '',
        line2HighlightText: 'Panels.',
        line2HighlightColor: 'is-mango',
        line2HighlightsJson: '[{\"text\":\"Panels.\",\"className\":\"is-mango\"}]',
      },
      editableFields: [
        {
          id: 'animationPreset',
          label: 'Hero animation preset',
          type: 'select',
          options: [
            { value: 'default', label: 'Default' },
            { value: 'none', label: 'None' },
            { value: 'loans-unblur', label: 'Unblur + slide' },
          ],
        },
        {
          id: 'justify',
          label: 'Hero justify',
          type: 'select',
          options: [
            { value: 'center', label: 'Center' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ],
        },
        {
          id: 'bgTone',
          label: 'Hero background',
          type: 'swatch',
          options: [
            { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #f2f2f2 100%)' },
            { value: 'sand', label: 'Sand Gradient', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
            { value: 'blue', label: 'Blue Gradient', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
            { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
          ],
        },
        {
          id: 'heightMode',
          label: 'Hero height mode',
          type: 'select',
          options: [
            { value: 'default', label: 'Default' },
            { value: 'custom', label: 'Custom (% viewport)' },
          ],
        },
        { id: 'heightSvh', label: 'Hero height (% of viewport)', type: 'number' },
        { id: 'lineGap', label: 'Hero line gap', type: 'number' },
        { id: 'line1Text', label: 'Line 1 text', type: 'text' },
        {
          id: 'line1ClassName',
          label: 'Line 1 full-line color (optional)',
          type: 'swatch',
          options: [
            { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
            { value: 'is-atlantean', label: 'Blue', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
            { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
            { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
            { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
            { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
          ],
        },
        {
          id: 'line1HighlightsJson',
          label: 'Line 1 highlighted phrases',
          type: 'highlight_list',
          options: [
            { value: 'is-atlantean', label: 'Blue', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
            { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
            { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
            { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
            { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
          ],
        },
        { id: 'line2Text', label: 'Line 2 text', type: 'text' },
        {
          id: 'line2ClassName',
          label: 'Line 2 full-line color (optional)',
          type: 'swatch',
          options: [
            { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
            { value: 'is-atlantean', label: 'Blue', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
            { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
            { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
            { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
            { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
          ],
        },
        {
          id: 'line2HighlightsJson',
          label: 'Line 2 highlighted phrases',
          type: 'highlight_list',
          options: [
            { value: 'is-atlantean', label: 'Blue', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
            { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
            { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
            { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
            { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
          ],
        },
      ],
    },
    {
      id: 'intro',
      name: 'Dynamic Intro Test',
      kind: 'intro',
      mode: 'dynamic',
      settings: {
        heading: 'Test the panel system before we roll it out.',
        headingClassName: '',
        headingHighlightsJson: '',
        body: 'Use this route to preview editable intro layouts, colors, and button combinations before applying the pattern to live pages.',
        extraLine: 'Optional extra line for emphasis or supporting context.',
        extraLineTone: 'default',
        bgTone: 'sand',
        textTone: 'dark',
        button1Label: 'Primary action',
        button1Url: '/contact-us',
        button1Style: 'blue',
        button2Label: 'Secondary action',
        button2Url: '/services',
        button2Style: 'dark',
      },
      editableFields: [
        { id: 'heading', label: 'Heading text', type: 'textarea', rows: 2 },
        { id: 'body', label: 'Body text', type: 'textarea', rows: 4 },
        { id: 'extraLine', label: 'Extra line (optional)', type: 'text' },
        {
          id: 'extraLineTone',
          label: 'Extra line style',
          type: 'select',
          options: [
            { value: 'default', label: 'Default' },
            { value: 'blue', label: 'Blue' },
            { value: 'white', label: 'White' },
            { value: 'muted', label: 'Muted' },
          ],
        },
        {
          id: 'bgTone',
          label: 'Intro background',
          type: 'swatch',
          layout: 'half',
          options: [
            { value: 'sand', label: 'Sand Gradient', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
            { value: 'blue', label: 'Blue Gradient', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
            { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
          ],
        },
        {
          id: 'textTone',
          label: 'Text color',
          type: 'swatch',
          layout: 'half',
          options: [
            { value: 'dark', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5c5b5d 100%)' },
            { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
            { value: 'blue', label: 'Blue', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
          ],
        },
        { id: 'button1Label', label: 'Button 1 label', type: 'text' },
        { id: 'button1Url', label: 'Button 1 URL', type: 'text' },
        {
          id: 'button1Style',
          label: 'Button 1 style',
          type: 'select',
          options: [
            { value: 'blue', label: 'Blue' },
            { value: 'dark', label: 'Super Grey' },
          ],
        },
        { id: 'button2Label', label: 'Button 2 label', type: 'text' },
        { id: 'button2Url', label: 'Button 2 URL', type: 'text' },
        {
          id: 'button2Style',
          label: 'Button 2 style',
          type: 'select',
          options: [
            { value: 'blue', label: 'Blue' },
            { value: 'dark', label: 'Super Grey' },
          ],
        },
      ],
    },
    {
      id: 'page_content',
      name: 'Page Content',
      kind: 'content',
      mode: 'static',
      settings: {
        notes: 'Dynamic hero test route for panel experiments.',
      },
      editableFields: [
        { id: 'notes', label: 'Migration notes', type: 'text' },
      ],
    },
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
