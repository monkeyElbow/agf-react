const SHARED_FORM_SUBMISSION_FIELD_IDS = Object.freeze([
  'salesforceUrl',
  'submitLabel',
  'successMessage',
]);

export const CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'text', label: 'Text' }),
  Object.freeze({ value: 'email', label: 'Email' }),
  Object.freeze({ value: 'tel', label: 'Phone' }),
  Object.freeze({ value: 'textarea', label: 'Long text' }),
  Object.freeze({ value: 'select', label: 'Dropdown (single)' }),
  Object.freeze({ value: 'checkbox', label: 'Checkbox' }),
]);

export const REQUEST_FORM_STEP_FIELD_TYPE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'text', label: 'Text' }),
  Object.freeze({ value: 'email', label: 'Email' }),
  Object.freeze({ value: 'tel', label: 'Phone' }),
  Object.freeze({ value: 'textarea', label: 'Long text' }),
  Object.freeze({ value: 'select', label: 'Dropdown' }),
  Object.freeze({ value: 'radio-group', label: 'Radio group' }),
  Object.freeze({ value: 'checkbox-group', label: 'Checkbox group' }),
  Object.freeze({ value: 'file', label: 'File upload' }),
]);

export const REQUEST_FORM_STEP_FIELD_FORMAT_OPTIONS = Object.freeze([
  Object.freeze({ value: '', label: 'None' }),
  Object.freeze({ value: 'phone', label: 'Phone mask' }),
  Object.freeze({ value: 'zip', label: 'ZIP mask' }),
]);

const CTA_FORM_DYNAMIC_FIELD_TYPE_SET = new Set([
  ...CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS.map((option) => option.value),
  'multiselect',
]);
const REQUEST_FORM_STEP_FIELD_TYPE_SET = new Set(
  REQUEST_FORM_STEP_FIELD_TYPE_OPTIONS.map((option) => option.value),
);

export const CTA_FORM_MAX_FIELDS = 8;
export const CTA_FORM_CONTACT_PREFERENCE_FIELD_ID = 'contact_preference';
export const CTA_FORM_CONTACT_PREFERENCE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'email', label: 'Email' }),
  Object.freeze({ value: 'phone', label: 'Phone' }),
  Object.freeze({ value: 'either', label: 'No preference' }),
]);
const DEFAULT_FOLLOW_UP_SUBMIT_LABEL = 'Follow up with me';
const PREVIOUS_FOLLOW_UP_SUBMIT_LABEL = 'Follow-up with me';

const CTA_FORM_SPECIFIC_FIELD_IDS = Object.freeze([
  'title',
  'subtitle',
  'titleClassName',
  'titleHighlightsJson',
  'bodyHtml',
  'fineprint',
  'fieldsJson',
  'includeContactPreference',
  'bgTone',
  'submitStyle',
  'submitTone',
]);

const CTA_FORM_EXCLUSIVE_FIELD_IDS = Object.freeze([
  'fieldsJson',
  'includeContactPreference',
  'submitStyle',
  'submitTone',
]);

const REQUEST_FORM_SPECIFIC_FIELD_IDS = Object.freeze([
  'title',
  'titleClassName',
  'titleHighlightsJson',
  'subtitle',
  'bodyHtml',
  'body',
  'bgTone',
  'textTone',
  'spaceBeforeRem',
  'spaceAfterRem',
  ...Array.from({ length: 5 }, (_, index) => {
    const step = index + 1;
    return [
      `step${step}Title`,
      `step${step}Note`,
      `step${step}Alert`,
      `step${step}FieldsJson`,
    ];
  }).flat(),
]);

const REQUEST_FORM_EXCLUSIVE_FIELD_IDS = Object.freeze([
  'body',
  'textTone',
  'spaceBeforeRem',
  'spaceAfterRem',
  ...Array.from({ length: 5 }, (_, index) => {
    const step = index + 1;
    return [
      `step${step}Title`,
      `step${step}Note`,
      `step${step}Alert`,
      `step${step}FieldsJson`,
    ];
  }).flat(),
]);

export const CANONICAL_FORM_BLOCK_BOUNDARIES = Object.freeze({
  cta_form: Object.freeze({
    kind: 'cta_form',
    sharedFieldIds: SHARED_FORM_SUBMISSION_FIELD_IDS,
    specificFieldIds: CTA_FORM_SPECIFIC_FIELD_IDS,
    exclusiveFieldIds: CTA_FORM_EXCLUSIVE_FIELD_IDS,
    runtimeIdentity: 'cta_form',
    editorOwner: 'CtaFormBlockEditor',
  }),
  request_form: Object.freeze({
    kind: 'request_form',
    sharedFieldIds: SHARED_FORM_SUBMISSION_FIELD_IDS,
    specificFieldIds: REQUEST_FORM_SPECIFIC_FIELD_IDS,
    exclusiveFieldIds: REQUEST_FORM_EXCLUSIVE_FIELD_IDS,
    runtimeIdentity: 'request_form',
    editorOwner: 'RequestFormBlockEditor',
    transitionalAdapters: Object.freeze(['step-fields-json']),
  }),
});

export const CANONICAL_FORM_BLOCK_KINDS = Object.freeze(
  Object.keys(CANONICAL_FORM_BLOCK_BOUNDARIES),
);

export function isCanonicalFormBlockKind(kind) {
  return Object.prototype.hasOwnProperty.call(
    CANONICAL_FORM_BLOCK_BOUNDARIES,
    String(kind || '').trim(),
  );
}

export function getCanonicalFormBlockBoundary(kind) {
  const token = String(kind || '').trim();
  return CANONICAL_FORM_BLOCK_BOUNDARIES[token] || null;
}

export function getSharedFormConfigFieldIds() {
  return Array.from(SHARED_FORM_SUBMISSION_FIELD_IDS);
}

export function getFormBlockSpecificFieldIds(kind) {
  return Array.from(getCanonicalFormBlockBoundary(kind)?.specificFieldIds || []);
}

export function getFormBlockExclusiveFieldIds(kind) {
  return Array.from(getCanonicalFormBlockBoundary(kind)?.exclusiveFieldIds || []);
}

export function getFormBlockAllowedFieldIds(kind) {
  const boundary = getCanonicalFormBlockBoundary(kind);
  if (!boundary) {
    return [];
  }
  return Array.from(new Set([
    ...boundary.sharedFieldIds,
    ...boundary.specificFieldIds,
  ]));
}

export function isFieldAllowedForFormBlock(kind, fieldId) {
  const token = String(fieldId || '').trim();
  return getFormBlockAllowedFieldIds(kind).includes(token);
}

export function pickFieldDescriptors(fieldById, fieldIds = []) {
  return (Array.isArray(fieldIds) ? fieldIds : [])
    .map((fieldId) => (fieldById instanceof Map ? fieldById.get(fieldId) : null))
    .filter(Boolean);
}

export function normalizeCtaFormFieldType(value) {
  const token = String(value || '').trim().toLowerCase();
  if (CTA_FORM_DYNAMIC_FIELD_TYPE_SET.has(token)) {
    return token;
  }
  if (token === 'phone') {
    return 'tel';
  }
  if (token === 'radio') {
    return 'select';
  }
  if (token === 'checkbox-group') {
    return 'multiselect';
  }
  return 'text';
}

export function normalizeRequestFormFieldType(value) {
  const token = String(value || '').trim().toLowerCase();
  if (REQUEST_FORM_STEP_FIELD_TYPE_SET.has(token)) {
    return token;
  }
  if (token === 'radio') {
    return 'radio-group';
  }
  if (token === 'multiselect') {
    return 'checkbox-group';
  }
  return 'text';
}

function toOptionValue(rawValue, fallbackIndex, { slugifyValues = false } = {}) {
  const token = String(rawValue || '').trim();
  if (!slugifyValues) {
    return token || `option-${fallbackIndex + 1}`;
  }
  const slug = token
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `option-${fallbackIndex + 1}`;
}

export function normalizeCtaFormFieldKey(value, fallbackIndex = 0) {
  const token = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return token || `field_${fallbackIndex + 1}`;
}

export function parseFormChoiceOptionsText(source, options = {}) {
  if (Array.isArray(source)) {
    return source
      .map((option, index) => {
        if (option && typeof option === 'object') {
          const value = toOptionValue(option.value || option.label, index, options);
          const label = String(option.label || option.value || '').trim();
          if (!value && !label) {
            return null;
          }
          return { value: value || label, label: label || value };
        }
        const token = String(option || '').trim();
        if (!token) {
          return null;
        }
        return { value: toOptionValue(token, index, options), label: token };
      })
      .filter(Boolean);
  }

  const splitPattern = options?.splitOnComma ? /\r?\n|,/ : /\r?\n/;
  const seen = new Set();
  return String(source || '')
    .split(splitPattern)
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
    .map((entry, index) => {
      const [valuePart, labelPart] = entry.includes('|')
        ? entry.split('|')
        : [entry, entry];
      const value = toOptionValue(valuePart, index, options);
      const label = String(labelPart || valuePart || '').trim();
      if (!value && !label) {
        return null;
      }
      const resolvedValue = value || label;
      if (seen.has(resolvedValue)) {
        return null;
      }
      seen.add(resolvedValue);
      return {
        value: resolvedValue,
        label: label || resolvedValue,
      };
    })
    .filter(Boolean);
}

export function formatFormChoiceOptionsText(options = []) {
  return (Array.isArray(options) ? options : [])
    .map((option) => {
      const value = String(option?.value || '').trim();
      const label = String(option?.label || '').trim();
      if (!value && !label) {
        return '';
      }
      if (!value || value === label) {
        return label || value;
      }
      return `${value}|${label}`;
    })
    .filter(Boolean)
    .join('\n');
}

function normalizeCtaFormFieldRecord(field, index = 0) {
  if (!field || typeof field !== 'object') {
    return null;
  }

  const type = normalizeCtaFormFieldType(field.type);
  const id = normalizeCtaFormFieldKey(field.id || field.key, index);
  const label = String(field.label || '').trim() || `Field ${index + 1}`;
  const placeholder = String(field.placeholder || '').trim();
  const required = Boolean(field.required);
  const options = type === 'select' || type === 'multiselect'
    ? parseFormChoiceOptionsText(
      Array.isArray(field.options) ? field.options : (field.optionsText || field.optionsCsv || ''),
      { splitOnComma: true },
    )
    : [];

  return {
    id,
    label,
    type,
    required,
    placeholder,
    options,
    optionsText: formatFormChoiceOptionsText(options),
  };
}

export function createCtaFormFieldDraft(fieldNumber = 1) {
  return {
    id: normalizeCtaFormFieldKey(`field_${fieldNumber}`, fieldNumber - 1),
    label: `Field ${fieldNumber}`,
    type: 'text',
    required: false,
    placeholder: '',
    options: [],
    optionsText: '',
  };
}

export function parseCtaFormFieldsJson(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((field, index) => normalizeCtaFormFieldRecord(field, index))
      .filter(Boolean)
      .slice(0, CTA_FORM_MAX_FIELDS);
  } catch {
    return [];
  }
}

export function extractCtaFormFields(
  source,
  fallbackSource = null,
  { allowLegacyStepFields = false } = {},
) {
  const configuredFields = parseCtaFormFieldsJson(source?.fieldsJson);
  if (configuredFields.length) {
    return configuredFields;
  }

  if (fallbackSource && fallbackSource !== source) {
    const fallbackConfiguredFields = parseCtaFormFieldsJson(fallbackSource?.fieldsJson);
    if (fallbackConfiguredFields.length) {
      return fallbackConfiguredFields;
    }
  }

  // Transitional read-only bridge for published snapshots created before CTA
  // fields became canonical. Migration still owns persistence cleanup; this
  // prevents the public renderer from dropping legitimate fields meanwhile.
  if (allowLegacyStepFields) {
    const legacyFields = parseCtaFormFieldsJson(source?.step1FieldsJson);
    if (legacyFields.length) {
      return legacyFields;
    }

    if (fallbackSource && fallbackSource !== source) {
      const fallbackLegacyFields = parseCtaFormFieldsJson(fallbackSource?.step1FieldsJson);
      if (fallbackLegacyFields.length) {
        return fallbackLegacyFields;
      }
    }
  }

  return [];
}

export function serializeCtaFormFields(fields = []) {
  return JSON.stringify(
    (Array.isArray(fields) ? fields : [])
      .map((field, index) => normalizeCtaFormFieldRecord(field, index))
      .filter(Boolean)
      .slice(0, CTA_FORM_MAX_FIELDS)
      .map((field) => {
        const nextField = {
          id: field.id,
          label: field.label,
          type: field.type,
        };
        if (field.required) {
          nextField.required = true;
        }
        if (field.placeholder) {
          nextField.placeholder = field.placeholder;
        }
        if ((field.type === 'select' || field.type === 'multiselect') && field.options.length) {
          nextField.options = field.options;
        }
        return nextField;
      }),
  );
}

export function buildCtaFormSettingsPatch({
  fields = [],
  includeContactPreference,
} = {}) {
  const normalizedFields = (Array.isArray(fields) ? fields : [])
    .map((field, index) => normalizeCtaFormFieldRecord(field, index))
    .filter(Boolean)
    .slice(0, CTA_FORM_MAX_FIELDS);
  const patch = {
    fieldsJson: serializeCtaFormFields(normalizedFields),
  };

  if (includeContactPreference !== undefined) {
    patch.includeContactPreference = Boolean(includeContactPreference);
  }

  return patch;
}

export function createCtaContactPreferenceField() {
  return {
    id: CTA_FORM_CONTACT_PREFERENCE_FIELD_ID,
    label: 'Preferred contact method',
    type: 'select',
    required: false,
    placeholder: 'Select a preference',
    options: CTA_FORM_CONTACT_PREFERENCE_OPTIONS.map((option) => ({ ...option })),
  };
}

export function formatFormPhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (!digits) {
    return '';
  }
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function createInitialFormValues(fields, options = {}) {
  const multiValueTypes = new Set(options?.multiValueTypes || ['multiselect', 'checkbox-group']);
  const booleanTypes = new Set(options?.booleanTypes || ['checkbox']);
  return Object.fromEntries(
    (Array.isArray(fields) ? fields : []).map((field) => {
      const fieldType = String(field?.type || '').trim().toLowerCase();
      return [field.id, multiValueTypes.has(fieldType) ? [] : (booleanTypes.has(fieldType) ? false : '')];
    }),
  );
}

export function validateRequiredFormFields(fields, values, options = {}) {
  const multiValueTypes = new Set(options?.multiValueTypes || ['multiselect', 'checkbox-group']);
  const booleanTypes = new Set(options?.booleanTypes || ['checkbox']);
  const fileValueTypes = new Set(options?.fileValueTypes || ['file']);
  const resolveMessage = typeof options?.resolveMessage === 'function'
    ? options.resolveMessage
    : (field) => String(field?.errorMessage || '').trim() || `Please complete "${field?.label || 'this field'}".`;

  for (let index = 0; index < (Array.isArray(fields) ? fields.length : 0); index += 1) {
    const field = fields[index];
    if (!field?.required) {
      continue;
    }
    const fieldType = String(field?.type || '').trim().toLowerCase();
    const fieldValue = values?.[field.id];

    if (multiValueTypes.has(fieldType)) {
      if (!Array.isArray(fieldValue) || fieldValue.length === 0) {
        return resolveMessage(field);
      }
      continue;
    }

    if (fileValueTypes.has(fieldType)) {
      if (!fieldValue) {
        return resolveMessage(field);
      }
      continue;
    }

    if (booleanTypes.has(fieldType)) {
      if (!fieldValue) {
        return resolveMessage(field);
      }
      continue;
    }

    if (!String(fieldValue || '').trim()) {
      return resolveMessage(field);
    }
  }

  return '';
}

export function normalizeFollowUpSubmitLabel(value, fallback = '') {
  const label = String(value || '').trim() || String(fallback || '').trim();
  if (!label) {
    return '';
  }
  return label === PREVIOUS_FOLLOW_UP_SUBMIT_LABEL ? DEFAULT_FOLLOW_UP_SUBMIT_LABEL : label;
}

export function normalizeFormSubmissionConfig(source, defaults = {}) {
  return {
    submitLabel: normalizeFollowUpSubmitLabel(source?.submitLabel, defaults?.submitLabel)
      || 'Submit',
    successMessage: String(source?.successMessage || '').trim()
      || String(defaults?.successMessage || '').trim()
      || 'Thanks. We received your request.',
    salesforceUrl: String(source?.salesforceUrl || '').trim()
      || String(defaults?.salesforceUrl || '').trim(),
  };
}

export function createFormBlockDefinitionScaffold({
  kind,
  label,
  icon,
  sections = [],
  defaults = {},
  renderer = {},
  styleScope = {},
  validators = [],
}) {
  const boundary = getCanonicalFormBlockBoundary(kind);
  if (!boundary) {
    throw new Error(`Unknown canonical form block kind "${String(kind || '').trim() || '<empty>'}".`);
  }

  return {
    kind: boundary.kind,
    label: String(label || '').trim(),
    icon,
    editorType: boundary.kind,
    allowedVariants: ['default'],
    supportedModes: ['dynamic'],
    defaults,
    schema: {
      fields: (Array.isArray(sections) ? sections : []).flatMap((section) => (
        Array.isArray(section?.fields) ? section.fields : []
      )),
    },
    renderer,
    editor: {
      sections,
      hudSectionIds: (Array.isArray(sections) ? sections : []).map((section) => section.id).filter(Boolean),
      adminSectionIds: (Array.isArray(sections) ? sections : []).map((section) => section.id).filter(Boolean),
    },
    validators,
    styleScope,
    formBoundary: boundary,
  };
}
