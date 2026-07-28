import {
  parseFormChoiceOptionsText,
  serializeCtaFormFields,
} from '../blocks/foundation/forms';

export const DEFAULT_FOLLOW_UP_SUBMIT_LABEL = 'Follow up with me';
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

const BASE_CONTACT_FIELDS = Object.freeze([
  Object.freeze({
    id: 'name',
    label: 'Name',
    type: 'text',
    required: true,
  }),
  Object.freeze({
    id: 'email',
    label: 'Email',
    type: 'email',
    required: true,
  }),
  Object.freeze({
    id: 'phone',
    label: 'Phone',
    type: 'tel',
    placeholder: DEFAULT_PHONE_PLACEHOLDER,
  }),
]);

const MESSAGE_FIELD = Object.freeze({
  id: 'message',
  label: 'Message',
  type: 'textarea',
  placeholder: DEFAULT_MESSAGE_PLACEHOLDER,
});

function withCanonicalFieldsJson(settings, fields) {
  return {
    ...settings,
    fieldsJson: serializeCtaFormFields(fields),
  };
}

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
  };
}

export function buildNameEmailPhoneMessageCtaSettings(options = {}) {
  const base = buildBaseFollowUpSettings(options);
  return Object.freeze(withCanonicalFieldsJson(base, [
    ...BASE_CONTACT_FIELDS,
    MESSAGE_FIELD,
  ]));
}

export function buildNameEmailPhoneStateMessageCtaSettings({
  stateOptionsText = RETIREMENT_CTA_STATE_OPTIONS_TEXT,
  ...options
} = {}) {
  const base = buildBaseFollowUpSettings(options);
  return Object.freeze(withCanonicalFieldsJson(base, [
    ...BASE_CONTACT_FIELDS,
    {
      id: 'state',
      label: 'State',
      type: 'select',
      placeholder: 'Select a State',
      required: true,
      options: parseFormChoiceOptionsText(stateOptionsText),
    },
    MESSAGE_FIELD,
  ]));
}

export const defaultServicesCtaSettings = buildNameEmailPhoneMessageCtaSettings({
  title: 'Connect your faith & finances.',
  titleHighlightsJson: '[{"text":"faith & finances","className":"is-atlantean"}]',
});

export const defaultLoansCtaSettings = buildNameEmailPhoneMessageCtaSettings({
  title: 'Explore your options. Zero pressure.',
  bodyHtml: '<p>Let\'s talk about making it happen.</p>',
});

export const defaultInvestmentsCtaSettings = buildNameEmailPhoneMessageCtaSettings({
  title: 'Talk with an investment consultant.',
  bodyHtml: '<p>Share a few details and we’ll get in touch with options for you.</p>',
  submitStyle: 'outline',
  submitTone: 'atlantean',
});

export const defaultRetirementCtaSettings = buildNameEmailPhoneStateMessageCtaSettings({
  title: 'Imagine the possibilities.',
});
