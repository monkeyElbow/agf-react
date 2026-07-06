export const DEFAULT_FOLLOW_UP_SUBMIT_LABEL = 'Follow-up with me';
export const DEFAULT_FOLLOW_UP_SUCCESS_MESSAGE = 'Thanks. We’ll reach out soon.';
export const DEFAULT_PHONE_PLACEHOLDER = '(555) 555-5555';
export const DEFAULT_MESSAGE_PLACEHOLDER = 'What would you like to discuss?';

export const US_STATE_ENTRIES = Object.freeze([
  Object.freeze(['AL', 'Alabama']),
  Object.freeze(['AK', 'Alaska']),
  Object.freeze(['AZ', 'Arizona']),
  Object.freeze(['AR', 'Arkansas']),
  Object.freeze(['CA', 'California']),
  Object.freeze(['CO', 'Colorado']),
  Object.freeze(['CT', 'Connecticut']),
  Object.freeze(['DE', 'Delaware']),
  Object.freeze(['DC', 'District of Columbia']),
  Object.freeze(['FL', 'Florida']),
  Object.freeze(['GA', 'Georgia']),
  Object.freeze(['HI', 'Hawaii']),
  Object.freeze(['ID', 'Idaho']),
  Object.freeze(['IL', 'Illinois']),
  Object.freeze(['IN', 'Indiana']),
  Object.freeze(['IA', 'Iowa']),
  Object.freeze(['KS', 'Kansas']),
  Object.freeze(['KY', 'Kentucky']),
  Object.freeze(['LA', 'Louisiana']),
  Object.freeze(['ME', 'Maine']),
  Object.freeze(['MD', 'Maryland']),
  Object.freeze(['MA', 'Massachusetts']),
  Object.freeze(['MI', 'Michigan']),
  Object.freeze(['MN', 'Minnesota']),
  Object.freeze(['MS', 'Mississippi']),
  Object.freeze(['MO', 'Missouri']),
  Object.freeze(['MT', 'Montana']),
  Object.freeze(['NE', 'Nebraska']),
  Object.freeze(['NV', 'Nevada']),
  Object.freeze(['NH', 'New Hampshire']),
  Object.freeze(['NJ', 'New Jersey']),
  Object.freeze(['NM', 'New Mexico']),
  Object.freeze(['NY', 'New York']),
  Object.freeze(['NC', 'North Carolina']),
  Object.freeze(['ND', 'North Dakota']),
  Object.freeze(['OH', 'Ohio']),
  Object.freeze(['OK', 'Oklahoma']),
  Object.freeze(['OR', 'Oregon']),
  Object.freeze(['PA', 'Pennsylvania']),
  Object.freeze(['RI', 'Rhode Island']),
  Object.freeze(['SC', 'South Carolina']),
  Object.freeze(['SD', 'South Dakota']),
  Object.freeze(['TN', 'Tennessee']),
  Object.freeze(['TX', 'Texas']),
  Object.freeze(['UT', 'Utah']),
  Object.freeze(['VT', 'Vermont']),
  Object.freeze(['VA', 'Virginia']),
  Object.freeze(['WA', 'Washington']),
  Object.freeze(['WV', 'West Virginia']),
  Object.freeze(['WI', 'Wisconsin']),
  Object.freeze(['WY', 'Wyoming']),
]);
export const US_STATE_OPTIONS = Object.freeze(
  US_STATE_ENTRIES.map(([value, label]) => Object.freeze({ value, label })),
);

export const RETIREMENT_CTA_STATE_OPTIONS_TEXT = US_STATE_ENTRIES.map(([value, label]) => `${value}|${label}`).join('\n');

function buildBaseFollowUpSettings({
  title = '',
  titleClassName = '',
  titleHighlightsJson = '',
  bodyHtml = '',
  subtitle = '',
  bgTone = 'white',
  submitStyle = undefined,
  submitTone = undefined,
  includeContactPreference = undefined,
} = {}) {
  return {
    title,
    titleClassName,
    titleHighlightsJson,
    bodyHtml,
    subtitle,
    bgTone,
    submitLabel: DEFAULT_FOLLOW_UP_SUBMIT_LABEL,
    successMessage: DEFAULT_FOLLOW_UP_SUCCESS_MESSAGE,
    salesforceUrl: '',
    ...(submitStyle ? { submitStyle } : {}),
    ...(submitTone ? { submitTone } : {}),
    ...(includeContactPreference === undefined ? {} : { includeContactPreference }),
    field1Enabled: true,
    field1Type: 'text',
    field1Label: 'Name',
    field1Placeholder: '',
    field1Options: '',
    field1Required: true,
    field2Enabled: true,
    field2Type: 'email',
    field2Label: 'Email',
    field2Placeholder: '',
    field2Options: '',
    field2Required: true,
    field3Enabled: true,
    field3Type: 'tel',
    field3Label: 'Phone',
    field3Placeholder: DEFAULT_PHONE_PLACEHOLDER,
    field3Options: '',
    field3Required: false,
  };
}

export function buildNameEmailPhoneMessageCtaSettings(options = {}) {
  const base = buildBaseFollowUpSettings(options);
  return Object.freeze({
    ...base,
    field4Enabled: true,
    field4Type: 'textarea',
    field4Label: 'Message',
    field4Placeholder: DEFAULT_MESSAGE_PLACEHOLDER,
    field4Options: '',
    field4Required: false,
  });
}

export function buildNameEmailPhoneStateMessageCtaSettings({
  stateOptionsText = RETIREMENT_CTA_STATE_OPTIONS_TEXT,
  ...options
} = {}) {
  const base = buildBaseFollowUpSettings(options);
  return Object.freeze({
    ...base,
    field4Enabled: true,
    field4Type: 'select',
    field4Label: 'State',
    field4Placeholder: 'Select a State',
    field4Options: stateOptionsText,
    field4Required: true,
    field5Enabled: true,
    field5Type: 'textarea',
    field5Label: 'Message',
    field5Placeholder: DEFAULT_MESSAGE_PLACEHOLDER,
    field5Options: '',
    field5Required: false,
  });
}

export const defaultServicesCtaSettings = buildNameEmailPhoneMessageCtaSettings({
  title: 'Connect your faith & finances. Start here.',
  titleHighlightsJson: '[{"text":"faith & finances","className":"is-atlantean"}]',
});

export const defaultLoansCtaSettings = buildNameEmailPhoneMessageCtaSettings({
  title: 'Explore your options. Zero pressure.',
  bodyHtml: '<p>Let\'s talk about making it happen.</p>',
});

export const defaultInvestmentsCtaSettings = buildNameEmailPhoneMessageCtaSettings({
  title: 'Talk with an investments consultant.',
  bodyHtml: '<p>Share a few details and we’ll follow up with options that fit your goals.</p>',
  submitStyle: 'outline',
  submitTone: 'atlantean',
});

export const defaultRetirementCtaSettings = buildNameEmailPhoneStateMessageCtaSettings({
  title: 'Imagine the possibilities.',
});
