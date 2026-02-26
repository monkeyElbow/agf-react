import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sitePages } from '../data/siteMap';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import { getNativePageContent } from '../data/nativePageContent';
import { useConsultants } from '../context/ConsultantsContext';
import { useCareersJobs } from '../context/CareersJobsContext';
import { useRates } from '../context/RatesContext';
import { useContentAdmin } from '../context/ContentAdminContext';
import { useDocuments } from '../context/DocumentsContext';
import GivingComparisonMatrix from './GivingComparisonMatrix';
import CharitableGivingTableWidget from './CharitableGivingTableWidget';
import CharitableGiftTestDriveWidget from './CharitableGiftTestDriveWidget';
import EmergencyFundCalculatorWidget from './EmergencyFundCalculatorWidget';
import IncreasedContributionCalculatorWidget from './IncreasedContributionCalculatorWidget';
import NetWorthCalculatorWidget from './NetWorthCalculatorWidget';

const US_STATE_LABELS = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

function stateOptionLabel(code) {
  return `${US_STATE_LABELS[code] || code} (${code})`;
}

function getLocationOptions(section) {
  const options = Array.isArray(section?.locationFilter?.options) ? section.locationFilter.options : [];
  if (options.length) {
    return options
      .map((option) => (typeof option === 'string'
        ? { value: option, label: stateOptionLabel(option) }
        : { value: option.value, label: option.label || stateOptionLabel(option.value) }))
      .filter((option) => Boolean(option.value));
  }

  const states = new Set();
  (section.cards || []).forEach((card) => {
    (card.states || []).forEach((stateCode) => {
      if (stateCode) {
        states.add(stateCode);
      }
    });
  });

  return Array.from(states)
    .sort((a, b) => stateOptionLabel(a).localeCompare(stateOptionLabel(b)))
    .map((value) => ({ value, label: stateOptionLabel(value) }));
}

function Action({ item }) {
  const { resolveDocumentLink } = useDocuments();
  const extraClass = item.className ? ` ${item.className}` : '';
  const buttonClass = `service-native-btn${item.ghost ? ' is-ghost' : ''}${extraClass}`;
  const resolved = resolveNativeLinkItem(item, resolveDocumentLink);
  if (resolved?.href) {
    return (
      <a
        href={resolved.href}
        target={resolved.external ? '_blank' : undefined}
        rel={resolved.external ? 'noreferrer noopener' : undefined}
        className={buttonClass}
      >
        {resolved.label}
      </a>
    );
  }
  if (!resolved?.to && !item?.to) {
    return null;
  }
  return (
    <Link to={resolved?.to || item.to} className={buttonClass}>
      {resolved?.label || item.label}
    </Link>
  );
}

function isExternalLinkTarget(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function resolveNativeLinkItem(item, resolveDocumentLink) {
  const source = item && typeof item === 'object' ? item : {};
  if (source.documentId && typeof resolveDocumentLink === 'function') {
    const doc = resolveDocumentLink(source.documentId);
    if (doc?.url) {
      return {
        label: source.label || doc.title,
        href: doc.external ? doc.url : undefined,
        to: doc.external ? undefined : doc.url,
        external: Boolean(doc.external),
        document: doc,
      };
    }
  }

  if (source.href) {
    return {
      label: source.label,
      href: source.href,
      to: undefined,
      external: isExternalLinkTarget(source.href),
    };
  }

  if (source.to) {
    return {
      label: source.label,
      href: undefined,
      to: source.to,
      external: false,
    };
  }

  return {
    label: source.label,
    href: undefined,
    to: undefined,
    external: false,
  };
}

function NativeLink({ item, className, children }) {
  const { resolveDocumentLink } = useDocuments();
  const resolved = resolveNativeLinkItem(item, resolveDocumentLink);
  const label = children ?? resolved.label ?? item?.label;

  if (resolved.href) {
    return (
      <a
        href={resolved.href}
        target={resolved.external ? '_blank' : undefined}
        rel={resolved.external ? 'noreferrer noopener' : undefined}
        className={className}
      >
        {label}
      </a>
    );
  }
  if (!resolved.to && !item?.to) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link to={resolved.to || item?.to || '#'} className={className}>
      {label}
    </Link>
  );
}

function firstNameFromDisplayName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return 'Consultant';
  }
  return trimmed.split(/\s+/)[0];
}

function formatPostedDate(value) {
  const iso = String(value || '').trim();
  if (!iso) {
    return '';
  }
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const HERO_COLOR_CLASS_SET = new Set(['is-atlantean', 'is-mango', 'is-melon', 'is-white', 'is-super-grey']);
const HERO_ANIMATION_PRESET_SET = new Set(['default', 'none', 'loans-unblur']);
const HERO_HEIGHT_MODE_SET = new Set(['default', 'custom']);
const HERO_BG_TONE_SET = new Set(['white', 'sand', 'blue', 'grey']);
const HERO_JUSTIFY_SET = new Set(['left', 'center', 'right']);

function normalizeHeroColorClass(value) {
  const token = String(value || '').trim();
  return HERO_COLOR_CLASS_SET.has(token) ? token : '';
}

function normalizeHeroAnimationPreset(value) {
  const token = String(value || '').trim();
  return HERO_ANIMATION_PRESET_SET.has(token) ? token : 'default';
}

function normalizeHeroHeightMode(value) {
  const token = String(value || '').trim();
  return HERO_HEIGHT_MODE_SET.has(token) ? token : 'default';
}

function normalizeHeroBgTone(value) {
  const token = String(value || '').trim();
  return HERO_BG_TONE_SET.has(token) ? token : 'white';
}

function normalizeHeroJustify(value) {
  const token = String(value || '').trim();
  return HERO_JUSTIFY_SET.has(token) ? token : 'center';
}

function normalizeHeroHeightSvh(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 42;
  }
  return Math.max(20, Math.min(90, Math.round(numeric)));
}

function normalizeHeroLineGapEm(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(-0.2, Math.min(0.7, Number(numeric.toFixed(2))));
}

function heroAnimationClassForLine(preset, lineNumber) {
  const normalized = normalizeHeroAnimationPreset(preset);
  if (normalized === 'none') {
    return 'hero-anim-none';
  }
  if (normalized === 'loans-unblur') {
    return lineNumber === 1 ? 'hero-anim-loans-unblur' : 'hero-anim-loans-slide';
  }
  return '';
}

function getHeroRailInlineStyle(hero) {
  if (!hero || normalizeHeroHeightMode(hero.heightMode) !== 'custom') {
    return undefined;
  }
  const heightSvh = normalizeHeroHeightSvh(hero.heightSvh);
  return {
    minHeight: `clamp(220px, ${heightSvh}svh, 700px)`,
  };
}

function parseHeroHighlightsJson(raw) {
  const source = String(raw || '').trim();
  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const className = normalizeHeroColorClass(item.className);
        const hasRange = Number.isFinite(Number(item.start)) && Number.isFinite(Number(item.end));
        if (hasRange) {
          return {
            start: Number(item.start),
            end: Number(item.end),
            className,
            text: String(item.text || ''),
          };
        }
        return {
          text: String(item.text || ''),
          className,
        };
      })
      .filter((item) => (
        item.className
        && ((Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start) || item.text)
      ));
  } catch {
    return [];
  }
}

function buildSimpleHeroHighlight(textValue, colorValue) {
  const text = String(textValue || '').trim();
  const className = normalizeHeroColorClass(colorValue);
  if (!text || !className) {
    return [];
  }
  return [{ text, className }];
}

function buildTestDynamicHero(block) {
  if (!block || block.mode !== 'dynamic') {
    return null;
  }

  const settings = block.settings || {};
  const animationPreset = normalizeHeroAnimationPreset(settings.animationPreset);
  const bgTone = normalizeHeroBgTone(settings.bgTone);
  const justify = normalizeHeroJustify(settings.justify);
  const heightMode = normalizeHeroHeightMode(settings.heightMode);
  const heightSvh = normalizeHeroHeightSvh(settings.heightSvh);
  const lineGap = normalizeHeroLineGapEm(settings.lineGap);
  const line1Text = String(settings.line1Text || '').trim();
  const line2Text = String(settings.line2Text || '').trim();

  const lines = [
    {
      title: line1Text,
      className: normalizeHeroColorClass(settings.line1ClassName),
      highlights: (() => {
        const advanced = parseHeroHighlightsJson(settings.line1HighlightsJson);
        return advanced.length ? advanced : buildSimpleHeroHighlight(settings.line1HighlightText, settings.line1HighlightColor);
      })(),
    },
    {
      title: line2Text,
      className: normalizeHeroColorClass(settings.line2ClassName),
      highlights: (() => {
        const advanced = parseHeroHighlightsJson(settings.line2HighlightsJson);
        return advanced.length ? advanced : buildSimpleHeroHighlight(settings.line2HighlightText, settings.line2HighlightColor);
      })(),
    },
  ].filter((line) => line.title);

  if (!lines.length) {
    return null;
  }

  return {
    lines,
    animationPreset,
    bgTone,
    justify,
    heightMode,
    heightSvh,
    lineGap,
  };
}

function toActionLinkConfig(label, url, style) {
  const nextLabel = String(label || '').trim();
  const nextUrl = String(url || '').trim();
  if (!nextLabel || !nextUrl) {
    return null;
  }

  const normalizedStyle = String(style || '').trim().toLowerCase();
  const className = normalizedStyle === 'dark' ? 'is-dark' : '';
  const isExternal = /^(https?:|mailto:|tel:)/i.test(nextUrl);

  return isExternal
    ? { label: nextLabel, href: nextUrl, className }
    : { label: nextLabel, to: nextUrl.startsWith('/') ? nextUrl : `/${nextUrl}`, className };
}

function buildTestDynamicIntro(block) {
  if (!block || block.mode !== 'dynamic') {
    return null;
  }

  const settings = block.settings || {};
  const heading = String(settings.heading || '').trim();
  const headingClassName = normalizeHeroColorClass(settings.headingClassName);
  const headingHighlights = parseHeroHighlightsJson(settings.headingHighlightsJson);
  const body = String(settings.body || '').trim();
  const extraLine = String(settings.extraLine || '').trim();
  const bgTone = String(settings.bgTone || 'sand').trim();
  const textTone = String(settings.textTone || 'dark').trim();
  const extraLineTone = String(settings.extraLineTone || 'default').trim();
  const actions = [
    toActionLinkConfig(settings.button1Label, settings.button1Url, settings.button1Style),
    toActionLinkConfig(settings.button2Label, settings.button2Url, settings.button2Style),
  ].filter(Boolean);

  if (!heading && !body && !extraLine && !actions.length) {
    return null;
  }

  return {
    heading: heading || null,
    headingClassName: headingClassName || '',
    headingHighlights: headingHighlights.length ? headingHighlights : [],
    body: body ? [body] : [],
    emphasis: extraLine || null,
    emphasisClassName: extraLine ? `is-${extraLineTone}` : '',
    actions,
    className: `test-dynamic-intro is-bg-${bgTone} is-text-${textTone}`,
  };
}

const CERTIFICATE_REQUEST_COVERAGE_OPTIONS = [
  { value: 'general-liability', label: 'General Liability' },
  { value: 'workers-compensation', label: 'Workers Compensation' },
  { value: 'business-automobile', label: 'Business Automobile' },
  { value: 'umbrella', label: 'Umbrella' },
];

function toStateOptions() {
  return Object.entries(US_STATE_LABELS).map(([code, label]) => ({ value: code, label }));
}

function formatPhoneValue(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length > 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
}

function formatZipValue(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function buildCertificateRequestSteps(stateOptions) {
  return [
    {
      id: 'requester',
      fields: [
        { id: 'firstName', label: 'First Name *', type: 'text', required: true, placeholder: 'First Name' },
        { id: 'lastName', label: 'Last Name *', type: 'text', required: true, placeholder: 'Last Name' },
        { id: 'email', label: 'Email Address *', type: 'email', required: true, placeholder: 'me@email.com', full: true },
        {
          id: 'authorizedBy',
          label: 'Authorized By *',
          type: 'text',
          required: true,
          placeholder: 'John Doe',
          help: 'The person requesting certificates must be authorized on file with our office.',
        },
        {
          id: 'organizationName',
          label: 'Name of Your Organization *',
          type: 'text',
          required: true,
          placeholder: 'Church Name',
          help: 'Use the legal name shown on your policy.',
        },
      ],
    },
    {
      id: 'organization',
      fields: [
        { id: 'address1', label: 'Address of Organization *', type: 'text', required: true, placeholder: 'Address', full: true },
        { id: 'address2', label: 'Address Line 2', type: 'text', placeholder: '', full: true },
        { id: 'city', label: 'City *', type: 'text', required: true, placeholder: 'City' },
        { id: 'state', label: 'State *', type: 'select', required: true, options: stateOptions, placeholder: 'Select a State' },
        {
          id: 'zip',
          label: 'Zip Code *',
          type: 'text',
          required: true,
          placeholder: '12345',
          maxLength: 10,
          format: 'zip',
        },
        {
          id: 'phone',
          label: 'Phone Number *',
          type: 'text',
          required: true,
          placeholder: '555-555-5555',
          format: 'phone',
        },
        {
          id: 'fax',
          label: 'Fax Number',
          type: 'text',
          placeholder: '555-555-5555',
          full: true,
          format: 'phone',
        },
        {
          id: 'coverageNeeded',
          label: 'Coverage Needed *',
          type: 'checkbox-group',
          required: true,
          options: CERTIFICATE_REQUEST_COVERAGE_OPTIONS,
          full: true,
          errorMessage: 'Please select at least one coverage option.',
        },
      ],
    },
    {
      id: 'event',
      note: 'Event Details',
      fields: [
        {
          id: 'eventDescription',
          label: 'Event/Activity Name and Description',
          type: 'textarea',
          placeholder: 'Please provide as much detail as possible here.',
          full: true,
          help: 'Include event name, activities, and any sports/athletics sponsored.',
        },
        {
          id: 'eventLocation',
          label: 'Event Site/Location *',
          type: 'text',
          required: true,
          placeholder: 'Include full address or intersection here.',
          full: true,
        },
        { id: 'eventStartDate', label: 'Event Start Date', type: 'text', placeholder: 'MM/DD/YY' },
        { id: 'eventEndDate', label: 'Event End Date', type: 'text', placeholder: 'MM/DD/YY' },
        {
          id: 'eventFrequency',
          label: 'Event Frequency',
          type: 'radio-group',
          options: [
            { value: 'one-time', label: 'One Time' },
            { value: 'periodical', label: 'Periodical' },
          ],
          full: true,
          help: 'Recurring events may require an endorsement. Contact 1-866-662-8210 if needed.',
        },
      ],
    },
    {
      id: 'certificate-holder',
      note: 'Certificate Holder',
      noteBody: 'The certificate holder is the organization/entity requesting proof of your insurance, not your church or organization.',
      fields: [
        { id: 'holderName', label: 'Certificate Holder Name *', type: 'text', required: true, placeholder: 'John Doe' },
        { id: 'holderAddress', label: 'Certificate Holder Address *', type: 'text', required: true, placeholder: 'Address' },
        { id: 'holderAddress2', label: 'Address Line 2', type: 'text', full: true },
        { id: 'holderCity', label: 'Certificate Holder City *', type: 'text', required: true, placeholder: 'City' },
        { id: 'holderState', label: 'State *', type: 'select', required: true, options: stateOptions, placeholder: 'Select a State' },
        {
          id: 'holderZip',
          label: 'Certificate Holder Zip Code *',
          type: 'text',
          required: true,
          placeholder: '12345',
          maxLength: 10,
          format: 'zip',
        },
        {
          id: 'holderFax',
          label: 'Certificate Holder Fax Number',
          type: 'text',
          placeholder: '555-555-5555',
          format: 'phone',
        },
        {
          id: 'holderEmail',
          label: 'Certificate Holder Email Address',
          type: 'email',
          placeholder: 'me@mail.com',
          full: true,
        },
        {
          id: 'deliveryMethod',
          label: 'Deliver to Certificate Holder By:',
          type: 'radio-group',
          options: [
            { value: 'mail', label: 'Mail' },
            { value: 'email', label: 'Email' },
            { value: 'fax', label: 'Fax' },
          ],
          full: true,
        },
      ],
    },
    {
      id: 'additional-insured',
      note: 'Additional Insured Wording Required by Contract',
      noteBody: 'Located on the contract or communicated by the certificate holder. Examples: officers, officials, agents, board members, volunteers, servants.',
      alert: 'Please note: There may be an additional charge for Additional Insured endorsement. If so, you will be contacted for authorization.',
      fields: [
        {
          id: 'additionalInsuredRequired',
          label: 'Is Additional Insured a requirement of the certificate holder? *',
          type: 'radio-group',
          required: true,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          full: true,
          help: 'Only select Yes if required by the certificate holder/contract.',
        },
        {
          id: 'comments',
          label: 'Additional Comments or Remarks',
          type: 'textarea',
          placeholder: 'Additional instructions here.',
          full: true,
        },
        {
          id: 'attachment',
          label: 'Attach Contract or Other Documentation',
          type: 'file',
          full: true,
          help: 'Upload any special wording/higher limit requirements, or send to cert@agfinancial.org.',
        },
      ],
    },
  ];
}

function CertificateRequestForm({ config }) {
  const startedAtRef = useRef(Date.now());
  const fieldRefs = useRef({});
  const stateOptions = useMemo(() => toStateOptions(), []);
  const steps = useMemo(() => buildCertificateRequestSteps(stateOptions), [stateOptions]);
  const initialValues = useMemo(() => {
    const values = {};
    steps.forEach((step) => {
      step.fields.forEach((field) => {
        if (field.type === 'checkbox-group') {
          values[field.id] = [];
          return;
        }
        values[field.id] = '';
      });
    });
    return values;
  }, [steps]);

  const [activeStep, setActiveStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [stepError, setStepError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    setValues(initialValues);
    setStepError('');
    setSubmitted(false);
    setElapsedTime(0);
    startedAtRef.current = Date.now();
    fieldRefs.current = {};
  }, [initialValues, config]);

  const currentStep = steps[Math.min(activeStep, steps.length - 1)];

  const setFieldRef = (fieldId) => (node) => {
    if (node && !fieldRefs.current[fieldId]) {
      fieldRefs.current[fieldId] = node;
    }
  };

  const onChangeValue = (field, nextValue) => {
    let value = nextValue;
    if (field.format === 'phone') {
      value = formatPhoneValue(value);
    } else if (field.format === 'zip') {
      value = formatZipValue(value);
    }

    setValues((prev) => ({ ...prev, [field.id]: value }));
    if (stepError) {
      setStepError('');
    }
  };

  const toggleCheckboxGroupValue = (fieldId, optionValue, checked) => {
    setValues((prev) => {
      const currentValues = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      if (checked) {
        return { ...prev, [fieldId]: Array.from(new Set([...currentValues, optionValue])) };
      }
      return { ...prev, [fieldId]: currentValues.filter((value) => value !== optionValue) };
    });
    if (stepError) {
      setStepError('');
    }
  };

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    if (!step) {
      return { valid: true };
    }

    for (let index = 0; index < step.fields.length; index += 1) {
      const field = step.fields[index];
      const rawValue = values[field.id];

      if (!field.required) {
        continue;
      }

      if (field.type === 'checkbox-group') {
        const count = Array.isArray(rawValue) ? rawValue.length : 0;
        if (!count) {
          return {
            valid: false,
            message: field.errorMessage || 'Please select at least one option.',
            fieldId: field.id,
          };
        }
        continue;
      }

      if (field.type === 'radio-group' || field.type === 'select') {
        if (!rawValue) {
          return {
            valid: false,
            message: 'Please complete all required fields before continuing.',
            fieldId: field.id,
          };
        }
        continue;
      }

      if (!String(rawValue || '').trim()) {
        return {
          valid: false,
          message: 'Please complete all required fields before continuing.',
          fieldId: field.id,
        };
      }
    }

    return { valid: true };
  };

  const focusField = (fieldId) => {
    const element = fieldRefs.current[fieldId];
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  };

  const onNext = () => {
    const result = validateStep(activeStep);
    if (!result.valid) {
      setStepError(result.message);
      if (result.fieldId) {
        focusField(result.fieldId);
      }
      return;
    }

    setStepError('');
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const onBack = () => {
    setStepError('');
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const result = validateStep(activeStep);
    if (!result.valid) {
      setStepError(result.message);
      if (result.fieldId) {
        focusField(result.fieldId);
      }
      return;
    }

    setStepError('');
    setElapsedTime(Math.round((Date.now() - startedAtRef.current) / 1000));
    setSubmitted(true);
  };

  const renderField = (field) => {
    const fieldId = `certificate-request-${field.id}`;
    const fieldClassName = `certificate-request-field${field.full ? ' full' : ''}`;

    if (field.type === 'select') {
      return (
        <div key={field.id} className={fieldClassName}>
          <label htmlFor={fieldId}>{field.label}</label>
          <select
            id={fieldId}
            value={values[field.id] || ''}
            onChange={(event) => onChangeValue(field, event.target.value)}
            required={Boolean(field.required)}
            ref={setFieldRef(field.id)}
          >
            <option value="">{field.placeholder || 'Select one'}</option>
            {(field.options || []).map((option) => (
              <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className={fieldClassName}>
          <label htmlFor={fieldId}>{field.label}</label>
          <textarea
            id={fieldId}
            value={values[field.id] || ''}
            onChange={(event) => onChangeValue(field, event.target.value)}
            placeholder={field.placeholder || undefined}
            rows={field.rows || 4}
            required={Boolean(field.required)}
            ref={setFieldRef(field.id)}
          />
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </div>
      );
    }

    if (field.type === 'radio-group') {
      return (
        <fieldset key={field.id} className={`certificate-request-fieldset ${field.full ? 'full' : ''}`}>
          <legend>{field.label}</legend>
          <div className="certificate-request-choice-row">
            {(field.options || []).map((option, index) => (
              <label key={`${field.id}-${option.value}`} htmlFor={`${fieldId}-${option.value}`}>
                <input
                  id={`${fieldId}-${option.value}`}
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={values[field.id] === option.value}
                  onChange={(event) => onChangeValue(field, event.target.value)}
                  required={Boolean(field.required)}
                  ref={index === 0 ? setFieldRef(field.id) : undefined}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </fieldset>
      );
    }

    if (field.type === 'checkbox-group') {
      const selectedValues = Array.isArray(values[field.id]) ? values[field.id] : [];

      return (
        <fieldset key={field.id} className={`certificate-request-fieldset ${field.full ? 'full' : ''}`}>
          <legend>{field.label}</legend>
          <div className="certificate-request-choice-row">
            {(field.options || []).map((option, index) => (
              <label key={`${field.id}-${option.value}`} htmlFor={`${fieldId}-${option.value}`}>
                <input
                  id={`${fieldId}-${option.value}`}
                  type="checkbox"
                  name={field.id}
                  value={option.value}
                  checked={selectedValues.includes(option.value)}
                  onChange={(event) => toggleCheckboxGroupValue(field.id, option.value, event.target.checked)}
                  ref={index === 0 ? setFieldRef(field.id) : undefined}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </fieldset>
      );
    }

    if (field.type === 'file') {
      return (
        <div key={field.id} className={fieldClassName}>
          <label htmlFor={fieldId}>{field.label}</label>
          <input
            id={fieldId}
            type="file"
            onChange={(event) => onChangeValue(field, event.target.files?.[0] || '')}
            ref={setFieldRef(field.id)}
          />
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </div>
      );
    }

    return (
      <div key={field.id} className={fieldClassName}>
        <label htmlFor={fieldId}>{field.label}</label>
        <input
          id={fieldId}
          type={field.type || 'text'}
          value={values[field.id] || ''}
          onChange={(event) => onChangeValue(field, event.target.value)}
          placeholder={field.placeholder || undefined}
          maxLength={field.maxLength || undefined}
          required={Boolean(field.required)}
          ref={setFieldRef(field.id)}
        />
        {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="native-info-inline-form certificate-request-form" aria-label={config.title || 'Certificate request form'}>
        <div className="certificate-request-thank-you" role="status">
          <h5>Thank you.</h5>
          <p>We’ll be in touch soon.</p>
          {elapsedTime > 0 ? <p className="certificate-request-elapsed">Submitted in about {elapsedTime} seconds.</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="native-info-inline-form certificate-request-form" aria-label={config.title || 'Certificate request form'}>
      {config.title ? <h5>{config.title}</h5> : null}
      <p className="certificate-request-intro">Please complete this form in full, including location details. Incomplete submissions may delay your insurance certificate request.</p>
      <form onSubmit={onSubmit} noValidate>
        {currentStep.note ? (
          <div className="certificate-request-note">
            <strong>{currentStep.note}</strong>
            {currentStep.noteBody ? <p>{currentStep.noteBody}</p> : null}
          </div>
        ) : null}
        {currentStep.alert ? <p className="certificate-request-alert">{currentStep.alert}</p> : null}
        <div className="certificate-request-grid">
          {currentStep.fields.map(renderField)}
        </div>
        {stepError ? <p className="certificate-request-error" role="alert">{stepError}</p> : null}
        <div className="native-info-inline-form-step-actions">
          {activeStep > 0 ? (
            <button type="button" className="service-native-btn is-ghost" onClick={onBack}>Back</button>
          ) : (
            <span className="native-info-inline-form-step-spacer" aria-hidden="true" />
          )}
          {activeStep === steps.length - 1 ? (
            <button type="submit" className="service-native-btn">Submit Request</button>
          ) : (
            <button type="button" className="service-native-btn" onClick={onNext}>Next</button>
          )}
        </div>
        <div className="native-info-inline-form-progress" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`native-info-inline-form-dot${index === activeStep ? ' is-active' : ''}`}
            />
          ))}
        </div>
      </form>
    </div>
  );
}

function GenericNativeContentForm({ config }) {
  if (!config) {
    return null;
  }

  const stepConfigs = Array.isArray(config.steps) && config.steps.length
    ? config.steps
    : null;
  const [activeStep, setActiveStep] = useState(0);
  const isMultiStep = Boolean(stepConfigs);
  const currentStep = isMultiStep ? stepConfigs[Math.min(activeStep, stepConfigs.length - 1)] : null;
  const fields = isMultiStep
    ? (Array.isArray(currentStep?.fields) ? currentStep.fields : [])
    : (Array.isArray(config.fields) && config.fields.length
      ? config.fields
      : [
        { id: 'name', label: 'Name', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true },
        { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555' },
      ]);

  useEffect(() => {
    setActiveStep(0);
  }, [config, isMultiStep]);

  const renderField = (field) => {
    const fieldId = `native-form-${field.id}`;

    if (field.type === 'select') {
      return (
        <label key={field.id} htmlFor={fieldId}>
          {field.label}
          <select
            id={fieldId}
            required={Boolean(field.required)}
            defaultValue={field.defaultValue || ''}
          >
            <option value="" disabled>{field.placeholder || 'Select one'}</option>
            {(field.options || []).map((option) => (
              <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === 'textarea') {
      return (
        <label key={field.id} htmlFor={fieldId}>
          {field.label}
          <textarea
            id={fieldId}
            placeholder={field.placeholder || undefined}
            required={Boolean(field.required)}
            rows={field.rows || 4}
          />
        </label>
      );
    }

    if (field.type === 'radio' && Array.isArray(field.options) && field.options.length) {
      return (
        <fieldset key={field.id}>
          <legend>{field.label}</legend>
          <div className="native-info-inline-form-radio-row">
            {field.options.map((option) => (
              <label key={`${field.id}-${option.value}`} htmlFor={`${fieldId}-${option.value}`}>
                <input
                  id={`${fieldId}-${option.value}`}
                  name={field.id}
                  type="radio"
                  value={option.value}
                  required={Boolean(field.required)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    return (
      <label key={field.id} htmlFor={fieldId}>
        {field.label}
        <input
          id={fieldId}
          type={field.type || 'text'}
          placeholder={field.placeholder || undefined}
          inputMode={field.inputMode || undefined}
          pattern={field.pattern || undefined}
          title={field.title || undefined}
          maxLength={field.maxLength || undefined}
          required={Boolean(field.required)}
        />
      </label>
    );
  };

  const onNextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, stepConfigs.length - 1));
  };

  const onBackStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const isLastStep = !isMultiStep || activeStep === stepConfigs.length - 1;
  const stepSubmitLabel = currentStep?.submitLabel || config.submitLabel || 'Submit';
  const backLabel = currentStep?.backLabel || 'Back';
  const nextLabel = currentStep?.nextLabel || 'Next';

  return (
    <div className="native-info-inline-form" aria-label={config.title || 'Contact form'}>
      {config.title ? <h5>{config.title}</h5> : null}
      <form onSubmit={(event) => event.preventDefault()}>
        {fields.map(renderField)}
        {config.subtitle ? <h6>{config.subtitle}</h6> : null}
        {isMultiStep ? (
          <>
            <div className="native-info-inline-form-step-actions">
              {activeStep > 0 ? (
                <button type="button" className="service-native-btn is-ghost" onClick={onBackStep}>{backLabel}</button>
              ) : (
                <span className="native-info-inline-form-step-spacer" aria-hidden="true" />
              )}
              {isLastStep ? (
                <button type="submit" className="service-native-btn">{stepSubmitLabel}</button>
              ) : (
                <button type="button" className="service-native-btn" onClick={onNextStep}>{nextLabel}</button>
              )}
            </div>
            <div className="native-info-inline-form-progress" aria-hidden="true">
              {stepConfigs.map((step, index) => (
                <span
                  key={step.id || `step-${index + 1}`}
                  className={`native-info-inline-form-dot${index === activeStep ? ' is-active' : ''}`}
                />
              ))}
            </div>
          </>
        ) : (
          <button type="submit" className="service-native-btn">{config.submitLabel || 'Submit'}</button>
        )}
      </form>
    </div>
  );
}

function NativeContentForm({ config }) {
  if (!config) {
    return null;
  }
  if (config.variant === 'certificate-request') {
    return <CertificateRequestForm config={config} />;
  }
  return <GenericNativeContentForm config={config} />;
}

function CopyAddressBlock({ config, className = '' }) {
  const [copyTip, setCopyTip] = useState('');

  useEffect(() => {
    if (!copyTip) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCopyTip(''), 1800);
    return () => window.clearTimeout(timer);
  }, [copyTip]);

  if (!config || !Array.isArray(config.lines) || !config.lines.length) {
    return null;
  }

  const title = String(config.title || '').trim();
  const lines = config.lines.map((line) => String(line || '').trim()).filter(Boolean);
  const copyText = [title, ...lines].filter(Boolean).join('\n');

  const onCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
        setCopyTip('Address copied.');
        return;
      }
      throw new Error('Clipboard unavailable');
    } catch {
      setCopyTip('Copy not available in this browser.');
    }
  };

  return (
    <div className={`native-info-copy-address${className ? ` ${className}` : ''}`}>
      <button type="button" className="native-info-copy-address-btn" onClick={onCopy}>
        {title ? <span className="native-info-copy-address-title">{title}</span> : null}
        <span className="native-info-copy-address-lines">
          {lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </button>
      <p className={`native-info-copy-address-tip${copyTip ? ' is-visible' : ''}`} aria-live="polite">
        {copyTip || 'Click address to copy'}
      </p>
    </div>
  );
}

function ConsultantMessagePanel({ card, layout = 'toggle', onOpenChange }) {
  const consultantName = String(card.title || '').trim() || 'Consultant';
  const firstName = firstNameFromDisplayName(consultantName);
  const consultantEmail = String(card.consultantEmail || '').trim();
  const isInline = layout === 'inline';
  const [isOpen, setIsOpen] = useState(isInline);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [values, setValues] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    if (isInline) {
      setIsOpen(true);
    }
  }, [isInline]);

  const formIdBase = consultantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const onChangeField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const inquiryLabel = String(card.inquiryLabel || 'Consultant inquiry').trim();
    const subject = encodeURIComponent(`${inquiryLabel} - ${consultantName}`);
    const body = encodeURIComponent(
      [
        `Consultant: ${consultantName}`,
        `From: ${values.name}`,
        `Email: ${values.email}`,
        '',
        values.message,
      ].join('\n'),
    );

    if (consultantEmail && typeof window !== 'undefined') {
      window.location.href = `mailto:${consultantEmail}?subject=${subject}&body=${body}`;
    }

    setWasSubmitted(true);
  };

  const setPanelOpen = (nextOpen) => {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      setWasSubmitted(false);
    }
  };

  const formUi = (
    <form className="consultant-message-form" onSubmit={onSubmit}>
      <div className="consultant-message-head">
        <p className="consultant-message-title">Message {firstName}</p>
        <button type="button" className="consultant-message-close" onClick={() => setPanelOpen(false)} aria-label={`Close message panel for ${consultantName}`}>Close</button>
      </div>
      <div className="consultant-message-row">
        <label htmlFor={`consultant-name-${formIdBase}`} className="consultant-message-label">
          <span className="consultant-message-label-text">Your name</span>
          <input
            id={`consultant-name-${formIdBase}`}
            type="text"
            value={values.name}
            onChange={(event) => onChangeField('name', event.target.value)}
            placeholder="Your name*"
            required
          />
        </label>
        <label htmlFor={`consultant-email-${formIdBase}`} className="consultant-message-label">
          <span className="consultant-message-label-text">Your email</span>
          <input
            id={`consultant-email-${formIdBase}`}
            type="email"
            value={values.email}
            onChange={(event) => onChangeField('email', event.target.value)}
            placeholder="Your email*"
            required
          />
        </label>
      </div>
      <label htmlFor={`consultant-message-${formIdBase}`} className="consultant-message-label">
        <span className="consultant-message-label-text">Message</span>
        <textarea
          id={`consultant-message-${formIdBase}`}
          value={values.message}
          onChange={(event) => onChangeField('message', event.target.value)}
          rows={4}
          placeholder="How can I help?"
          required
        />
      </label>
      <div className="consultant-message-actions">
        <button type="submit" className="service-native-btn">Send</button>
      </div>
      {wasSubmitted ? (
        <p className="consultant-message-status">
          {consultantEmail
            ? 'Your email draft is ready. Send it to continue.'
            : 'Message captured. We will route it to this consultant.'}
        </p>
      ) : null}
    </form>
  );

  if (isInline) {
    return (
      <div className="consultant-message-wrap is-inline">
        {formUi}
      </div>
    );
  }

  return (
    <div className="consultant-message-wrap">
      <button
        type="button"
        className="service-native-btn consultant-message-toggle"
        aria-expanded={isOpen}
        aria-controls={`consultant-message-panel-${formIdBase}`}
        onClick={() => {
          setPanelOpen(!isOpen);
        }}
      >
        {card.messageCta || `Message ${firstName}`}
      </button>
      <div id={`consultant-message-panel-${formIdBase}`} className={`consultant-message-panel${isOpen ? ' is-open' : ''}`}>
        <div className="consultant-message-panel-inner">
          {formUi}
        </div>
      </div>
    </div>
  );
}

function renderHighlightedText(source, highlights) {
  const text = String(source || '');
  const rules = Array.isArray(highlights) ? highlights.filter(Boolean) : [];

  if (!text || !rules.length) {
    return text;
  }

  const rangeRules = rules
    .filter((item) => Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start && item.className)
    .map((item) => ({
      start: Math.max(0, Math.min(text.length, item.start)),
      end: Math.max(0, Math.min(text.length, item.end)),
      className: item.className,
    }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (rangeRules.length) {
    const pieces = [];
    let cursor = 0;
    let key = 0;
    const nextKey = (prefix) => {
      key += 1;
      return `${prefix}-${key}`;
    };

    rangeRules.forEach((rule) => {
      if (rule.start > cursor) {
        pieces.push(<span key={nextKey('t')}>{text.slice(cursor, rule.start)}</span>);
      }
      const start = Math.max(cursor, rule.start);
      const end = Math.max(start, rule.end);
      if (end > start) {
        pieces.push(
          <mark key={nextKey('m')} className={rule.className || undefined}>
            {text.slice(start, end)}
          </mark>,
        );
        cursor = end;
      }
    });

    if (cursor < text.length) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor)}</span>);
    }
    return pieces;
  }

  const textRules = rules.filter((item) => item && item.text);

  const lower = text.toLowerCase();
  const pieces = [];
  let cursor = 0;
  let key = 0;
  const nextKey = (prefix) => {
    key += 1;
    return `${prefix}-${key}`;
  };

  while (cursor < text.length) {
    let next = null;

    textRules.forEach((rule) => {
      const needle = String(rule.text).toLowerCase();
      if (!needle) {
        return;
      }
      const idx = lower.indexOf(needle, cursor);
      if (idx < 0) {
        return;
      }
      if (!next || idx < next.index) {
        next = { index: idx, rule, length: needle.length };
      }
    });

    if (!next) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor)}</span>);
      break;
    }

    if (next.index > cursor) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor, next.index)}</span>);
    }

    pieces.push(
      <mark key={nextKey('m')} className={next.rule.className || undefined}>
        {text.slice(next.index, next.index + next.length)}
      </mark>,
    );

    cursor = next.index + next.length;
  }

  return pieces;
}

function renderTextWithStrong(source) {
  const text = String(source || '');
  if (!text.includes('**')) {
    return text;
  }

  const chunks = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return chunks.map((chunk, index) => {
    const isStrong = chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4;
    if (!isStrong) {
      return <span key={`t-${index}`}>{chunk}</span>;
    }
    return <strong key={`s-${index}`}>{chunk.slice(2, -2)}</strong>;
  });
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function Retirement403bRateTableWidget({ rates, ratesMeta }) {
  const proxyRateRow = Array.isArray(rates)
    ? (rates.find((row) => row.id === '1-year') || rates.find((row) => row.product === '1-YEAR') || rates[0])
    : null;

  const rate = ratesMeta?.retirement403bMbaRate || proxyRateRow?.premiumRate || proxyRateRow?.standardRate || '4.000%';
  const apy = ratesMeta?.retirement403bMbaApy || proxyRateRow?.premiumApy || proxyRateRow?.standardApy || '4.07%';
  const effectiveDate = ratesMeta?.certificatesEffectiveDate || 'January 1, 2025';

  return (
    <div className="retirement-403b-rate-widget">
      <div className="native-info-table-wrap">
        <table className="ag-table has-fixed-layout">
          <thead>
            <tr>
              <th>Investment Type</th>
              <th>RATE</th>
              <th>APY*</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MBA Income Fund</td>
              <td>{rate}</td>
              <td>{apy}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="service-native-note">*Annual Percentage Yield</p>
      <p className="service-native-note">Effective {effectiveDate}</p>
    </div>
  );
}

function RetirementIraRateTableWidget({ iraRates, ratesMeta }) {
  const rows = Array.isArray(iraRates) ? iraRates : [];
  const effectiveDate = ratesMeta?.iraEffectiveDate || 'January 1, 2025';

  return (
    <div className="retirement-ira-rate-widget">
      <div className="native-info-table-wrap">
        <table className="ag-table has-fixed-layout">
          <thead>
            <tr>
              <th>Investment Type</th>
              <th>Rate</th>
              <th>APY*</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id || row.product}>
                <td>{row.product}</td>
                <td>{row.rate}</td>
                <td>{row.apy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="service-native-note"><strong>*Annual Percentage Yield</strong><strong><br />Effective {effectiveDate}.</strong></p>
    </div>
  );
}

const FUND_IRA_EXCLUDED_STATES = {
  OH: 'This offering is not available to residents of Ohio.',
  WA: 'AGFinancial investments are not available to new investors in Washington.',
};

function getIraDocumentId(iraPrefix, variant) {
  const prefix = String(iraPrefix || '').toLowerCase();
  const map = {
    'application-simplifier': {
      traditional: 'document-ira-traditional-ira-simplifier-form',
      roth: 'document-ira-roth-ira-simplifier-form',
    },
    'transfer-request': {
      traditional: 'document-ira-traditional-ira-transfer-request-form',
      roth: 'document-ira-roth-ira-transfer-request-form',
    },
    'open-zip': {
      traditional: 'document-ira-traditional-open-ira-zip',
      roth: 'document-ira-roth-open-ira-zip',
    },
    'transfer-zip': {
      traditional: 'document-ira-traditional-transfer-ira-zip',
      roth: 'document-ira-roth-transfer-ira-zip',
    },
    'direct-rollover-zip': {
      traditional: 'document-ira-traditional-direct-rollover-ira-zip',
      roth: 'document-ira-roth-direct-rollover-ira-zip',
    },
    'indirect-rollover-zip': {
      traditional: 'document-ira-traditional-indirect-rollover-ira-zip',
      roth: 'document-ira-roth-indirect-rollover-ira-zip',
    },
  };
  return map[variant]?.[prefix] || null;
}

function getFundIraDownloadPackage(iraType, fundingOption) {
  if (!iraType || !fundingOption) {
    return null;
  }

  if (iraType === 'sep') {
    return {
      title: 'Contact a Consultant',
      actions: [{ label: 'Contact Us', to: '/services/retirement/retirement-consultants' }],
      paragraphs: ['SEP IRA funding is handled with a consultant.'],
    };
  }

  const isRoth = iraType === 'roth';
  const iraLabel = isRoth ? 'Roth IRA' : 'Traditional IRA';
  const iraPrefix = isRoth ? 'Roth' : 'Traditional';
  const mailAddress = 'AGFinancial Investments\nP.O. Box 1867\nSpringfield, MO 65801';

  const packageByOption = {
    open: {
      title: `Download and Complete the Paperwork (${iraLabel})`,
      actions: [
        {
          label: `${iraPrefix} IRA Simplifier Form*`,
          documentId: getIraDocumentId(iraPrefix, 'application-simplifier'),
        },
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
      ],
      bullets: [
        'Provide two forms of identification*',
        'Include a check payable to “AGCU”',
      ],
      noteActions: [
        {
          label: 'Download All Forms',
          documentId: getIraDocumentId(iraPrefix, 'open-zip'),
        },
      ],
    },
    contribution: {
      title: 'Complete the paperwork and send back',
      actions: [
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
      ],
      paragraphs: [
        'Include check payable to “AGCU”.',
        `Mail all paperwork to:\n${mailAddress}`,
        'If you are establishing a new account, do not forget to include your two forms of identification.',
      ],
    },
    transfer: {
      title: `Download and Complete the Paperwork (${iraLabel})`,
      actions: [
        {
          label: `${iraPrefix} IRA Simplifier Form*`,
          documentId: getIraDocumentId(iraPrefix, 'application-simplifier'),
        },
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
        {
          label: `${iraPrefix} IRA Transfer Request Form`,
          documentId: getIraDocumentId(iraPrefix, 'transfer-request'),
        },
      ],
      bullets: [
        'Provide two forms of identification*',
        'Provide your most recent IRA statement.',
      ],
      noteActions: [
        {
          label: 'Download All Forms',
          documentId: getIraDocumentId(iraPrefix, 'transfer-zip'),
        },
      ],
      paragraphs: isRoth
        ? [`Mail all paperwork to:\n${mailAddress}`, 'If you are establishing a new account, do not forget to include your two forms of identification.']
        : [],
    },
    'direct-rollover': {
      title: `Download and Complete the Paperwork (${iraLabel})`,
      actions: [
        {
          label: `${iraPrefix} IRA Simplifier Form*`,
          documentId: getIraDocumentId(iraPrefix, 'application-simplifier'),
        },
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
        {
          label: 'Direct Rollover Request Form',
          documentId: 'document-ira-direct-rollover-request-form',
        },
      ],
      bullets: [
        'Provide two forms of identification*',
        'Provide your most recent IRA statement.',
      ],
      noteActions: [
        {
          label: 'Download All Forms',
          documentId: getIraDocumentId(iraPrefix, 'direct-rollover-zip'),
        },
      ],
      paragraphs: isRoth
        ? [`Mail all paperwork to:\n${mailAddress}`, 'If you are establishing a new account, do not forget to include your two forms of identification.']
        : [],
    },
    'indirect-rollover': {
      title: `Download and Complete the Paperwork (${iraLabel})`,
      actions: [
        {
          label: `${iraPrefix} IRA Simplifier Form*`,
          documentId: getIraDocumentId(iraPrefix, 'application-simplifier'),
        },
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
      ],
      bullets: ['Provide two forms of identification*'],
      noteActions: [
        {
          label: 'Download All Forms',
          documentId: getIraDocumentId(iraPrefix, 'indirect-rollover-zip'),
        },
      ],
      paragraphs: isRoth
        ? [`Mail all paperwork to:\n${mailAddress}`, 'If you are establishing a new account, do not forget to include your two forms of identification.']
        : [],
    },
  };

  return packageByOption[fundingOption] || null;
}

function FundAnIraWidget() {
  const { resolveDocumentLink } = useDocuments();
  const stateOptions = useMemo(
    () => toStateOptions().sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );
  const [stateCode, setStateCode] = useState('');
  const [hasOpenedCircular, setHasOpenedCircular] = useState(false);
  const [agreedCircular, setAgreedCircular] = useState(false);
  const [iraType, setIraType] = useState('');
  const [fundingOption, setFundingOption] = useState('');

  const stateError = stateCode ? (FUND_IRA_EXCLUDED_STATES[stateCode] || '') : '';
  const isEligible = Boolean(stateCode) && !stateError;
  const step2Unlocked = isEligible;
  const step3Unlocked = step2Unlocked && agreedCircular;
  const downloadPackage = step3Unlocked ? getFundIraDownloadPackage(iraType, fundingOption) : null;
  const offeringCircularDoc = resolveDocumentLink('document-investments-aglf-offering-circular');

  const stepClassName = (step) => {
    if (step === 1) {
      return `fund-ira-step-card ${isEligible ? 'done' : 'active'}`;
    }
    if (step === 2) {
      if (!step2Unlocked) return 'fund-ira-step-card locked';
      return `fund-ira-step-card ${agreedCircular ? 'done' : 'active'}`;
    }
    if (step === 3) {
      if (!step3Unlocked) return 'fund-ira-step-card locked';
      return `fund-ira-step-card ${downloadPackage ? 'done' : 'active'}`;
    }
    if (step === 4) {
      if (!downloadPackage) return 'fund-ira-step-card locked';
      return 'fund-ira-step-card active';
    }
    return 'fund-ira-step-card';
  };

  const stepPill = (step) => {
    if (step === 1) return isEligible ? 'Complete' : 'Start';
    if (step === 2) {
      if (!step2Unlocked) return 'Locked';
      return agreedCircular ? 'Complete' : 'In progress';
    }
    if (step === 3) {
      if (!step3Unlocked) return 'Locked';
      return downloadPackage ? 'Complete' : 'In progress';
    }
    if (step === 4) return downloadPackage ? 'Ready' : 'Locked';
    return '';
  };

  const resetFollowingSteps = (resetFromStep2 = true) => {
    if (resetFromStep2) {
      setHasOpenedCircular(false);
      setAgreedCircular(false);
    }
    setIraType('');
    setFundingOption('');
  };

  return (
    <div className="fund-ira-widget">
      <div className="fund-ira-header">
        <h2>Fund an IRA</h2>
        <p>Follow the four steps below. Each step unlocks the next one once complete.</p>
      </div>

      <div className="fund-ira-grid">
        <section className={`${stepClassName(1)} is-full`}>
          <div className="fund-ira-step-heading">
            <span className="fund-ira-step-number">1</span>
            <div>
              <p className="fund-ira-step-title">Confirm eligibility</p>
              <p className="fund-ira-step-sub">Start with your state</p>
            </div>
            <span className="fund-ira-step-pill">{stepPill(1)}</span>
          </div>

          <label htmlFor="fund-ira-state" className="fund-ira-label">Select your state</label>
          <select
            id="fund-ira-state"
            className="fund-ira-select"
            value={stateCode}
            onChange={(event) => {
              const next = event.target.value;
              setStateCode(next);
              resetFollowingSteps(true);
            }}
          >
            <option value="">Select your state</option>
            {stateOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {stateError ? <div className="fund-ira-alert">{stateError}</div> : null}
        </section>

        <section className={`${stepClassName(2)} is-full`}>
          <div className="fund-ira-step-heading">
            <span className="fund-ira-step-number">2</span>
            <div>
              <p className="fund-ira-step-title">Review and acknowledge</p>
              <p className="fund-ira-step-sub">Download the Offering Circular</p>
            </div>
            <span className="fund-ira-step-pill">{stepPill(2)}</span>
          </div>

          <div className="fund-ira-action-row">
            <a
              href={offeringCircularDoc?.url || '/prospectus'}
              target="_blank"
              rel="noreferrer noopener"
              className="service-native-btn"
              onClick={() => setHasOpenedCircular(true)}
            >
              View Offering Circular
            </a>
          </div>

          <label className="fund-ira-checkbox-row">
            <input
              type="checkbox"
              checked={agreedCircular}
              disabled={!step2Unlocked || !hasOpenedCircular}
              onChange={(event) => {
                const next = event.target.checked;
                setAgreedCircular(next);
                setIraType('');
                setFundingOption('');
              }}
            />
            <span>I have received and agree to the Offering Circular (download to unlock).</span>
          </label>
        </section>

        <section className={`${stepClassName(3)} is-full`}>
          <div className="fund-ira-step-heading">
            <span className="fund-ira-step-number">3</span>
            <div>
              <p className="fund-ira-step-title">Choose how you want to fund</p>
              <p className="fund-ira-step-sub">Pick IRA type and funding</p>
            </div>
            <span className="fund-ira-step-pill">{stepPill(3)}</span>
          </div>

          <label htmlFor="fund-ira-type" className="fund-ira-label">Choose IRA Type</label>
          <select
            id="fund-ira-type"
            className="fund-ira-select"
            value={iraType}
            disabled={!step3Unlocked}
            onChange={(event) => setIraType(event.target.value)}
          >
            <option value="">Select...</option>
            <option value="traditional">Traditional IRA</option>
            <option value="roth">Roth IRA</option>
            <option value="sep">SEP IRA</option>
          </select>
          <p className="fund-ira-hint">SEP IRA always routes to a consultant.</p>

          <label htmlFor="funding-option" className="fund-ira-label">Funding Option</label>
          <select
            id="funding-option"
            className="fund-ira-select"
            value={fundingOption}
            disabled={!step3Unlocked}
            onChange={(event) => setFundingOption(event.target.value)}
          >
            <option value="">Select...</option>
            <option value="open">Open</option>
            <option value="contribution">Additional Contribution</option>
            <option value="transfer">Transfer</option>
            <option value="direct-rollover">Direct Rollover</option>
            <option value="indirect-rollover">Indirect Rollover</option>
          </select>
        </section>

        <section className={`${stepClassName(4)} is-full`}>
          <div className="fund-ira-step-heading">
            <span className="fund-ira-step-number">4</span>
            <div>
              <p className="fund-ira-step-title">Download what you need</p>
              <p className="fund-ira-step-sub">Your ready-to-send packet</p>
            </div>
            <span className="fund-ira-step-pill">{stepPill(4)}</span>
          </div>

          {downloadPackage ? (
            <div className="fund-ira-downloads">
              <h3>{downloadPackage.title}</h3>

              {Array.isArray(downloadPackage.actions) && downloadPackage.actions.length ? (
                <div className="fund-ira-download-actions">
                  {downloadPackage.actions.map((item) => (
                    <Action key={`${item.label}-${item.href || item.to}`} item={item} />
                  ))}
                </div>
              ) : null}

              {Array.isArray(downloadPackage.bullets) && downloadPackage.bullets.length ? (
                <ul className="fund-ira-bullets">
                  {downloadPackage.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}

              {Array.isArray(downloadPackage.paragraphs) && downloadPackage.paragraphs.length ? (
                <div className="fund-ira-copy-stack">
                  {downloadPackage.paragraphs.map((paragraph) => (
                    <p key={paragraph}>
                      {paragraph.split('\n').map((line, index, arr) => (
                        <span key={`${paragraph}-${line}-${index}`}>
                          {line}
                          {index < arr.length - 1 ? <br /> : null}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              ) : null}

              {Array.isArray(downloadPackage.noteActions) && downloadPackage.noteActions.length ? (
                <div className="fund-ira-note-actions">
                  {downloadPackage.noteActions.map((item) => (
                    <Action key={`${item.label}-${item.href || item.to}`} item={item} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

const ENDOWMENT_RATE = 0.045;
const ENDOWMENT_SEGMENTS = [
  { key: 'cash', label: 'Cash', color: '#00a3b3' },
  { key: 'securities', label: 'Securities', color: '#22c6d3' },
  { key: 'realEstate', label: 'Real Estate', color: '#ffa400' },
  { key: 'other', label: 'Business/Other', color: '#ffcd66' },
];
const ENDOWMENT_MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const ENDOWMENT_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function parseEndowmentAmount(value) {
  return Number(String(value || '').replace(/[^\d.-]/g, '')) || 0;
}

function formatEndowmentAmount(value) {
  if (!value) {
    return '';
  }
  return ENDOWMENT_NUMBER_FORMATTER.format(value);
}

function formatEndowmentMoney(value) {
  return ENDOWMENT_MONEY_FORMATTER.format(Number(value) || 0);
}

function buildEndowmentSummary(values, totalGift, totalImpact) {
  return [
    (values.name ? `Example prepared for ${values.name}\n` : '') + 'AGFinancial Endowment Illustration',
    '===========================================',
    `Total Gift: ${formatEndowmentMoney(totalGift)}`,
    `Assumed annual distribution rate: ${(ENDOWMENT_RATE * 100).toFixed(1)}%`,
    `Estimated annual support: ${formatEndowmentMoney(totalImpact)}  (/year)`,
    `Monthly equivalent: ${formatEndowmentMoney(totalImpact / 12)}`,
    '',
    'Breakdown (annual):',
    `• Cash: ${formatEndowmentMoney(values.cash * ENDOWMENT_RATE)}`,
    `• Securities: ${formatEndowmentMoney(values.securities * ENDOWMENT_RATE)}`,
    `• Real Estate: ${formatEndowmentMoney(values.realEstate * ENDOWMENT_RATE)}`,
    `• Business/Other: ${formatEndowmentMoney(values.other * ENDOWMENT_RATE)}`,
    '',
    'Source: agfinancial.org',
    '',
    'Notes:',
    '- Principal remains invested; distributions fund ongoing support.',
    '- Illustration only. Returns and policies vary; consult AGFinancial and your advisors.',
  ].join('\n');
}

function EndowmentCalculatorWidget() {
  const baseId = useId();
  const [fields, setFields] = useState({
    cash: '10,000',
    securities: '25,000',
    realEstate: '100,000',
    other: '50,000',
    name: '',
    email: '',
    phone: '',
  });

  const amounts = useMemo(() => ({
    cash: parseEndowmentAmount(fields.cash),
    securities: parseEndowmentAmount(fields.securities),
    realEstate: parseEndowmentAmount(fields.realEstate),
    other: parseEndowmentAmount(fields.other),
  }), [fields.cash, fields.securities, fields.realEstate, fields.other]);

  const totalGift = amounts.cash + amounts.securities + amounts.realEstate + amounts.other;
  const impact = {
    cash: amounts.cash * ENDOWMENT_RATE,
    securities: amounts.securities * ENDOWMENT_RATE,
    realEstate: amounts.realEstate * ENDOWMENT_RATE,
    other: amounts.other * ENDOWMENT_RATE,
  };
  const totalImpact = impact.cash + impact.securities + impact.realEstate + impact.other;
  const emailValue = fields.email.trim();
  const phoneValue = fields.phone.trim();
  const nameValue = fields.name.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const canSubmit = Boolean(nameValue && phoneValue && isEmailValid);
  const summary = useMemo(
    () => buildEndowmentSummary({ ...amounts, name: nameValue }, totalGift, totalImpact),
    [amounts, nameValue, totalGift, totalImpact],
  );

  const updateField = (key) => (event) => {
    const { value } = event.target;
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const formatAmountField = (key) => () => {
    setFields((prev) => {
      const nextValue = formatEndowmentAmount(parseEndowmentAmount(prev[key]));
      return { ...prev, [key]: nextValue };
    });
  };

  const handleTalkToPlanner = () => {
    if (!canSubmit || typeof window === 'undefined') {
      return;
    }
    const subject = encodeURIComponent('Endowment illustration request');
    const body = encodeURIComponent(summary);
    window.location.href = `mailto:plannedgiving@agfinancial.org?subject=${subject}&body=${body}`;
  };

  const handleDownload = () => {
    if (!canSubmit || typeof window === 'undefined') {
      return;
    }
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = nameValue ? `${nameValue.replace(/[^\w-]+/g, '-')}-` : '';
    link.href = url;
    link.download = `${safeName}AGFinancial-Endowment-Illustration.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const chartSegments = ENDOWMENT_SEGMENTS.map((segment) => ({
    ...segment,
    value: impact[segment.key],
  }));
  const chartTotal = chartSegments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="endowment-calculator">
      <p className="endowment-calculator-sub">
        Enter assets you may gift. We’ll show your <em>annual ministry impact</em> from investment earnings (your principal remains invested).
      </p>

      <div className="endowment-calculator-assets">
        <div className="endowment-calculator-assets-grid">
          <label htmlFor={`${baseId}-cash`} className="endowment-calculator-field">
            <span>Cash ($)</span>
            <input
              id={`${baseId}-cash`}
              type="text"
              inputMode="numeric"
              value={fields.cash}
              onChange={updateField('cash')}
              onBlur={formatAmountField('cash')}
              className="endowment-calculator-input"
            />
            <span className="endowment-calculator-hint">Minimum guideline: 10,000</span>
          </label>
          <label htmlFor={`${baseId}-securities`} className="endowment-calculator-field">
            <span>Securities ($)</span>
            <input
              id={`${baseId}-securities`}
              type="text"
              inputMode="numeric"
              value={fields.securities}
              onChange={updateField('securities')}
              onBlur={formatAmountField('securities')}
              className="endowment-calculator-input"
            />
            <span className="endowment-calculator-hint">Restricted or marketable</span>
          </label>
          <label htmlFor={`${baseId}-realEstate`} className="endowment-calculator-field">
            <span>Real Estate ($)</span>
            <input
              id={`${baseId}-realEstate`}
              type="text"
              inputMode="numeric"
              value={fields.realEstate}
              onChange={updateField('realEstate')}
              onBlur={formatAmountField('realEstate')}
              className="endowment-calculator-input"
            />
            <span className="endowment-calculator-hint">Minimum guideline: 100,000</span>
          </label>
          <label htmlFor={`${baseId}-other`} className="endowment-calculator-field">
            <span>Business/Other ($)</span>
            <input
              id={`${baseId}-other`}
              type="text"
              inputMode="numeric"
              value={fields.other}
              onChange={updateField('other')}
              onBlur={formatAmountField('other')}
              className="endowment-calculator-input"
            />
            <span className="endowment-calculator-hint">Art, antiques, business interests…</span>
          </label>
        </div>
      </div>

      <div className="endowment-calculator-results">
        <div className="endowment-calculator-card">
          {nameValue ? (
            <div className="endowment-calculator-prepared">Example prepared for {nameValue}</div>
          ) : null}
          <div className="endowment-calculator-total">Total Gift: {formatEndowmentMoney(totalGift)}</div>
          <div className="endowment-calculator-annual">
            <span className="endowment-calculator-annual-number">{formatEndowmentMoney(totalImpact)}</span>
            <span className="endowment-calculator-annual-note"> / year — every year</span>
          </div>
          <div className="endowment-calculator-monthly">{formatEndowmentMoney(totalImpact / 12)} per month equivalent</div>
          <div className="endowment-calculator-breakdown">
            <div>• Cash: {formatEndowmentMoney(impact.cash)} / yr</div>
            <div>• Securities: {formatEndowmentMoney(impact.securities)} / yr</div>
            <div>• Real estate: {formatEndowmentMoney(impact.realEstate)} / yr</div>
            <div>• Business/Other: {formatEndowmentMoney(impact.other)} / yr</div>
          </div>
          <p className="endowment-calculator-note">
            Based on a representative annual distribution rate (4.5%). Actual results vary with markets, rates, and endowment spending policies.
          </p>
        </div>

        <div className="endowment-calculator-chart" aria-label="Annual impact breakdown chart">
          <svg viewBox="0 0 120 120" className="endowment-calculator-donut" role="img">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#e1e1e1"
              strokeWidth="18"
            />
            {chartTotal > 0 ? chartSegments.map((segment) => {
              const dash = (segment.value / chartTotal) * circumference;
              const dashArray = `${dash} ${circumference - dash}`;
              const segmentOffset = offset;
              offset += dash;
              return (
                <circle
                  key={segment.key}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="18"
                  strokeDasharray={dashArray}
                  strokeDashoffset={-segmentOffset}
                />
              );
            }) : null}
          </svg>
          <ul className="endowment-calculator-legend">
            {chartSegments.map((segment) => (
              <li key={segment.key}>
                <span className="endowment-calculator-legend-dot" style={{ backgroundColor: segment.color }} />
                <span>{segment.label}</span>
                <span className="endowment-calculator-legend-value">{formatEndowmentMoney(segment.value)} / yr</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="endowment-calculator-form">
        <div className="endowment-calculator-contact">
          <input
            type="text"
            placeholder="Your name"
            value={fields.name}
            onChange={updateField('name')}
          />
          <input
            type="email"
            placeholder="you@example.com"
            value={fields.email}
            onChange={updateField('email')}
          />
          <input
            type="tel"
            placeholder="555-555-5555"
            value={fields.phone}
            onChange={updateField('phone')}
          />
        </div>
        <div className="endowment-calculator-actions">
          <button
            type="button"
            className="service-native-btn endowment-calculator-btn"
            onClick={handleTalkToPlanner}
            disabled={!canSubmit}
          >
            Talk to a Gift Planner
          </button>
          <button
            type="button"
            className="service-native-btn is-ghost endowment-calculator-btn"
            onClick={handleDownload}
            disabled={!canSubmit}
          >
            Download Your Example
          </button>
        </div>
      </div>

      <p className="endowment-calculator-fineprint">
        For illustrative purposes only. Assumptions reflect a generalized annual distribution rate and do not guarantee future results. Actual returns, distribution policies, fees, and spending rules vary by fund, market conditions, and timing. This material is not tax, legal, or investment advice. Consult your advisors and AGFinancial for a personalized illustration and current rates.
      </p>
    </div>
  );
}

const MINISTER_HOUSING_FIELDS = [
  ['rent', 'Rent'],
  ['down', 'Down payment'],
  ['remodel', 'Remodeling & improvements'],
  ['mortgage', 'Mortgage payments (principal + interest)'],
  ['furnish', 'Furnishings & appliances (purchase/repair)'],
  ['utils', 'Utilities (gas, water, sewer, electricity, etc.)'],
  ['ins', 'Property insurance'],
  ['taxes', 'Real estate taxes'],
  ['hoa', 'HOA dues'],
  ['repairs', 'Repairs'],
  ['maint', 'Maintenance (cleaners, bulbs, pest, yard, etc.)'],
  ['misc', 'Misc. home expenses'],
];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function MinisterHousingQuickCheckWidget() {
  const STEPS = [
    { key: 'eligibility', label: 'Eligibility' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'frv', label: 'FRV' },
    { key: 'summary', label: 'Summary' },
  ];
  const [eligibility, setEligibility] = useState({
    cred: false,
    earned: false,
    retired: false,
    primary: false,
  });
  const [expenses, setExpenses] = useState(() => Object.fromEntries(MINISTER_HOUSING_FIELDS.map(([id]) => [id, ''])));
  const [frv, setFrv] = useState('');
  const [stepIndex, setStepIndex] = useState(0);

  const totalExpenses = useMemo(
    () => MINISTER_HOUSING_FIELDS.reduce((sum, [id]) => sum + (parseFloat(expenses[id] || 0) || 0), 0),
    [expenses],
  );
  const frvValue = parseFloat(frv || 0) || 0;
  const hasBothAmounts = totalExpenses > 0 && frvValue > 0;
  const maxClaim = hasBothAmounts ? Math.min(totalExpenses, frvValue) : 0;
  const eligibilityPass = Object.values(eligibility).every(Boolean);
  const isLastStep = stepIndex === STEPS.length - 1;

  let resultMessage = 'Complete eligibility checklist and amounts to see your result.';
  let resultClass = '';
  if (!eligibilityPass) {
    resultMessage = 'Not qualified yet. Check all four eligibility items.';
    resultClass = 'is-bad';
  } else if (!hasBothAmounts) {
    resultMessage = 'Incomplete. Enter total expenses and FRV to compute the allowable amount.';
    resultClass = 'is-bad';
  } else {
    resultMessage = `You likely qualify to claim housing allowance on up to ${formatCurrency(maxClaim)} (the lesser of actual expenses or FRV).`;
    resultClass = 'is-good';
  }

  function handleSavePdf() {
    if (typeof window === 'undefined') return;

    const checkedEligibility = [
      ['Credentialed during contribution period', eligibility.cred],
      ['Income earned from ministry', eligibility.earned],
      ['Retired minister', eligibility.retired],
      ['Primary residence only', eligibility.primary],
    ];

    const expenseRows = MINISTER_HOUSING_FIELDS.map(([id, label]) => ({
      label,
      amount: Number.parseFloat(expenses[id] || 0) || 0,
    }));

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=920,height=760');
    if (!popup) return;

    const rowsHtml = expenseRows.map((row) => (
      `<tr><td>${escapeHtml(row.label)}</td><td style="text-align:right;">${escapeHtml(formatCurrency(row.amount))}</td></tr>`
    )).join('');

    const checksHtml = checkedEligibility.map(([label, passed]) => (
      `<li>${passed ? 'Yes' : 'No'} - ${escapeHtml(label)}</li>`
    )).join('');

    const nowLabel = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    popup.document.open();
    popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Minister Housing Allowance Quick Check</title>
    <style>
      body { font-family: Helvetica, Arial, sans-serif; color: #1f2937; margin: 32px; line-height: 1.45; }
      h1 { margin: 0 0 6px; font-size: 28px; color: #414042; }
      h2 { margin: 20px 0 8px; font-size: 18px; color: #006b86; }
      p { margin: 0 0 10px; }
      .muted { color: #6b7280; font-size: 13px; }
      .summary { border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; margin-top: 12px; }
      .summary-row { display: flex; justify-content: space-between; gap: 16px; margin: 6px 0; }
      .summary-row strong { color: #111827; }
      .summary-row.claim { border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 10px; }
      .result { margin-top: 10px; padding: 10px; border-radius: 8px; font-weight: 600; }
      .result.good { background: #ecfeff; color: #0f766e; }
      .result.bad { background: #fff1f2; color: #be123c; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: top; }
      th { text-align: left; background: #f8fafc; }
      ul { margin: 8px 0 0 18px; padding: 0; }
      @media print { body { margin: 18px; } }
    </style>
  </head>
  <body>
    <h1>Minister's Housing Allowance Quick Check</h1>
    <p class="muted">Generated ${escapeHtml(nowLabel)}</p>
    <p class="muted">Educational estimate only. Consult your tax advisor and AGFinancial retirement consultant.</p>

    <h2>Eligibility Checklist</h2>
    <ul>${checksHtml}</ul>

    <h2>Annual Housing Expenses</h2>
    <table>
      <thead><tr><th>Expense</th><th>Amount</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="summary">
      <div class="summary-row"><span>Actual annual housing expenses</span><strong>${escapeHtml(formatCurrency(totalExpenses))}</strong></div>
      <div class="summary-row"><span>Actual annual FRV (home + furniture + utilities)</span><strong>${escapeHtml(formatCurrency(frvValue))}</strong></div>
      <div class="summary-row claim"><span>Maximum amount you may claim</span><strong>${escapeHtml(hasBothAmounts ? formatCurrency(maxClaim) : '$0.00')}</strong></div>
      <div class="result ${resultClass === 'is-good' ? 'good' : 'bad'}">${escapeHtml(resultMessage)}</div>
    </div>
  </body>
</html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="retirement-403b-quickcheck-widget" aria-label="Minister's Housing Allowance Quick Check">
      <div className="ret403b-qc-stepper" role="tablist" aria-label="Quick check steps">
        {STEPS.map((step, index) => (
          <button
            key={step.key}
            type="button"
            role="tab"
            aria-selected={index === stepIndex}
            className={`ret403b-qc-step${index === stepIndex ? ' is-active' : ''}${index < stepIndex ? ' is-complete' : ''}`}
            onClick={() => setStepIndex(index)}
          >
            <span className="ret403b-qc-step-num">{index + 1}</span>
            <span className="ret403b-qc-step-label">{step.label}</span>
          </button>
        ))}
      </div>

      <div className="ret403b-qc-step-meta">
        <strong>Step {stepIndex + 1} of {STEPS.length}</strong>
        <span>Minister&apos;s Housing Allowance Quick Check</span>
      </div>

      {stepIndex === 0 ? (
        <div className="ret403b-qc-card">
          <h3>Eligibility checklist</h3>
          <div className="ret403b-qc-grid">
            {[
              ['cred', 'I was credentialed during the time the contribution was made.'],
              ['earned', 'I earned the income for the contribution from ministry.'],
              ['retired', 'I am retired.'],
              ['primary', 'I am considering expenses on my primary residence only.'],
            ].map(([id, label]) => (
              <label key={id} className="ret403b-qc-check">
                <input
                  type="checkbox"
                  checked={eligibility[id]}
                  onChange={(event) => setEligibility((prev) => ({ ...prev, [id]: event.target.checked }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="ret403b-qc-note">These are the baseline requirements from the worksheet. You’ll see a pass/fail after you enter amounts.</p>
        </div>
      ) : null}

      {stepIndex === 1 ? (
        <div className="ret403b-qc-card">
          <h3>Annual housing expenses</h3>
          <div className="ret403b-qc-fields">
            {MINISTER_HOUSING_FIELDS.map(([id, label]) => (
              <label key={id} className="ret403b-qc-field">
                <span>{label}</span>
                <div className="ret403b-qc-money">
                  <span aria-hidden="true">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenses[id]}
                    onChange={(event) => setExpenses((prev) => ({ ...prev, [id]: event.target.value }))}
                  />
                </div>
              </label>
            ))}
          </div>
          <p className="ret403b-qc-total"><strong>Total housing expenses:</strong> <span>{formatCurrency(totalExpenses)}</span></p>
        </div>
      ) : null}

      {stepIndex === 2 ? (
        <div className="ret403b-qc-card">
          <h3>Fair rental value (FRV)</h3>
          <label className="ret403b-qc-field">
            <span>Actual annual Fair Rental Value (home + furniture + utilities)</span>
            <div className="ret403b-qc-money">
              <span aria-hidden="true">$</span>
              <input type="number" min="0" step="0.01" value={frv} onChange={(event) => setFrv(event.target.value)} />
            </div>
          </label>
          <p className="ret403b-qc-note">Enter your annual FRV estimate to compare against actual housing expenses.</p>
        </div>
      ) : null}

      {stepIndex === 3 ? (
        <div className="ret403b-qc-card">
          <h3>Summary</h3>
          <div className="ret403b-qc-summary">
            <div className="ret403b-qc-summary-row">
              <span>Actual annual housing expenses</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>
            <div className="ret403b-qc-summary-row">
              <span>Actual annual FRV (home + furniture + utilities)</span>
              <strong>{formatCurrency(frvValue)}</strong>
            </div>
            <div className="ret403b-qc-summary-row is-claim">
              <span>Maximum amount you may claim</span>
              <strong>{hasBothAmounts ? formatCurrency(maxClaim) : '$0.00'}</strong>
            </div>
            <p className={`ret403b-qc-result ${resultClass}`}>{resultMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="ret403b-qc-nav">
        <button
          type="button"
          className="action-btn action-btn-outline"
          onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
          disabled={stepIndex === 0}
        >
          Back
        </button>
        <div className="ret403b-qc-nav-status" aria-live="polite">
          {stepIndex === 0 ? (
            <span>{Object.values(eligibility).filter(Boolean).length}/4 eligibility items checked</span>
          ) : null}
          {stepIndex === 1 ? (
            <span>Expenses total: <strong>{formatCurrency(totalExpenses)}</strong></span>
          ) : null}
          {stepIndex === 2 ? (
            <span>FRV entered: <strong>{formatCurrency(frvValue)}</strong></span>
          ) : null}
          {stepIndex === 3 ? (
            <span>Review result and save a PDF if helpful.</span>
          ) : null}
        </div>
        <button
          type="button"
          className="action-btn action-btn-primary"
          onClick={() => {
            if (isLastStep) {
              setStepIndex(0);
              return;
            }
            setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
          }}
        >
          {isLastStep ? 'Start over' : 'Next'}
        </button>
      </div>

      {stepIndex === 3 ? (
        <div className="ret403b-qc-actions">
          <button type="button" className="action-btn action-btn-primary" onClick={handleSavePdf}>
            Save PDF summary
          </button>
          <button type="button" className="action-btn action-btn-outline" disabled title="Coming soon">
            Send to a consultant (coming soon)
          </button>
        </div>
      ) : null}
    </div>
  );
}


function HeroTitle({ hero }) {
  const heroLineGap = normalizeHeroLineGapEm(hero?.lineGap);
  if (Array.isArray(hero?.lines) && hero.lines.length) {
    return (
      <>
        {hero.lines.slice(0, 3).map((line, index) => {
          const lineConfig = typeof line === 'string' ? { title: line } : line;
          const lineNumber = index + 1;
          const lineClass = `line${lineNumber}`;
          const animationClass = heroAnimationClassForLine(hero?.animationPreset, lineNumber);
          const source = String(lineConfig?.title || '');
          const highlightRules = Array.isArray(lineConfig?.highlights) && lineConfig.highlights.length
            ? lineConfig.highlights
            : (lineConfig?.highlight ? [{ text: lineConfig.highlight, className: lineConfig.highlightClass }] : []);
          const content = highlightRules.length ? renderHighlightedText(source, highlightRules) : source;

          const lineStyle = index > 0 && heroLineGap
            ? { marginTop: `${heroLineGap}em` }
            : undefined;
          return (
            <h1
              key={`${lineClass}-${source}`}
              className={`${lineClass}${lineConfig?.className ? ` ${lineConfig.className}` : ''}${animationClass ? ` ${animationClass}` : ''}`}
              style={lineStyle}
            >
              {content}
            </h1>
          );
        })}
      </>
    );
  }

  if (!hero?.highlight && !Array.isArray(hero?.highlights)) {
    return <h1 className="line1 line2">{hero?.title}</h1>;
  }

  const source = String(hero.title || '');
  const highlightRules = Array.isArray(hero.highlights) && hero.highlights.length
    ? hero.highlights
    : [{ text: hero.highlight, className: hero.highlightClass }];

  if (!highlightRules.length) {
    return <h1 className="line1 line2">{source}</h1>;
  }

  return (
    <h1 className="line1 line2">
      {renderHighlightedText(source, highlightRules)}
    </h1>
  );
}

function SitemapSection() {
  const sectionLabelMap = {
    Core: 'General',
  };

  const groups = useMemo(() => {
    const pages = sitePages.filter((page) => (
      !page.path.startsWith('/admin/')
      && page.path !== '/search'
      && !page.hideFromSitemap
    ));
    const grouped = pages.reduce((acc, page) => {
      if (!acc[page.section]) {
        acc[page.section] = [];
      }
      acc[page.section].push(page);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([section, items]) => [
        section,
        [...items].sort((a, b) => a.title.localeCompare(b.title)),
      ])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  return (
    <section className="service-native-section native-sitemap-section">
      <div className="ag-panel-rail">
        <div className="native-sitemap-grid">
          {groups.map(([section, pages]) => (
            <div key={section} className="native-info-links-block native-sitemap-group">
              <h3>{sectionLabelMap[section] || section}</h3>
              <ul className="native-info-link-list">
                {pages.map((page) => (
                  <li key={page.path}>
                    <Link to={page.path}>{page.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProspectusSection({ content }) {
  const [query, setQuery] = useState('');
  const docsSection = Array.isArray(content?.sections)
    ? content.sections.find((section) => Array.isArray(section?.links) && section.links.length)
    : null;
  const docs = Array.isArray(docsSection?.links) ? docsSection.links : [];
  const filteredDocs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return docs;
    }
    return docs.filter((item) => String(item.label || '').toLowerCase().includes(needle));
  }, [docs, query]);

  return (
    <section className="service-native-section native-prospectus-section">
      <div className="ag-panel-rail">
        <div className="native-prospectus-tools">
          <label htmlFor="prospectus-doc-search" className="native-prospectus-search">
            <span>Search documents</span>
            <input
              id="prospectus-doc-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a fund or provider name"
            />
          </label>
          <p className="native-prospectus-count">
            {filteredDocs.length} of {docs.length} documents
          </p>
        </div>
        <div className="native-prospectus-grid">
          {filteredDocs.map((item) => (
            <article key={`${item.label}-${item.href || item.to || item.documentId}`} className="native-prospectus-card">
              <h3>{item.label}</h3>
              <NativeLink item={item}>
                {item.href ? 'Open PDF' : 'Open'}
              </NativeLink>
            </article>
          ))}
        </div>
        {!filteredDocs.length ? (
          <p className="native-prospectus-empty">No documents match your search.</p>
        ) : null}
      </div>
    </section>
  );
}

function FormsLibrarySection({ content }) {
  const [query, setQuery] = useState('');
  const { documents } = useDocuments();
  const forms = useMemo(() => {
    const libraryDocs = Array.isArray(documents)
      ? documents.filter((doc) => doc.active && doc.category === 'form' && doc.url)
        .map((doc) => ({
          topic: doc.topic || 'Other',
          label: doc.title,
          href: doc.url,
          documentId: doc.id,
        }))
      : [];

    if (libraryDocs.length) {
      return libraryDocs;
    }

    return Array.isArray(content?.forms) ? content.forms : [];
  }, [content?.forms, documents]);
  const filteredForms = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return forms;
    }
    return forms.filter((item) => {
      const haystack = `${item.topic || ''} ${item.label || ''} ${item.href || ''}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [forms, query]);

  const groups = useMemo(() => {
    const grouped = filteredForms.reduce((acc, item) => {
      const topic = String(item.topic || 'Other');
      if (!acc[topic]) {
        acc[topic] = [];
      }
      acc[topic].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([topic, items]) => [
        topic,
        [...items].sort((a, b) => String(a.label || '').localeCompare(String(b.label || ''))),
      ])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredForms]);

  return (
    <section className="service-native-section native-forms-section">
      <div className="ag-panel-rail">
        <div className="native-forms-tools">
          <label htmlFor="forms-library-search" className="native-prospectus-search native-forms-search">
            <span>Search forms</span>
            <input
              id="forms-library-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a form name or topic"
            />
          </label>
          <p className="native-prospectus-count native-forms-count">
            {filteredForms.length} of {forms.length} forms
          </p>
        </div>

        {groups.length ? (
          <div className="native-forms-grid">
            {groups.map(([topic, items]) => (
              <article key={topic} className="native-forms-group">
                <div className="native-forms-group-head">
                  <h3>{topic}</h3>
                  <p>{items.length} form{items.length === 1 ? '' : 's'}</p>
                </div>
                <ul className="native-forms-list">
                  {items.map((item) => (
                    <li key={`${item.topic}-${item.label}-${item.href}`}>
                      <NativeLink item={item} />
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : null}

        {!groups.length ? (
          <p className="native-forms-empty">No forms match your search.</p>
        ) : null}
      </div>
    </section>
  );
}

function LegalDocumentSection({ content, page }) {
  const doc = content?.legalDocument || {};
  const toc = Array.isArray(doc.toc) ? doc.toc : [];

  return (
    <>
      <section className="native-functional-page-head native-functional-page-head--legal">
        <div className="ag-panel-rail">
          <h1>{doc.title || page.title}</h1>
          {doc.summary ? <p>{doc.summary}</p> : null}
        </div>
      </section>

      <section className="service-native-section native-legal-section">
        <div className="ag-panel-rail">
          <div className="native-legal-layout">
            <aside className="native-legal-sidebar" aria-label="Legal page summary">
              {doc.effectiveDate || doc.contactEmail ? (
                <div className="native-legal-meta">
                  {doc.effectiveDate ? (
                    <p>
                      <span>Revision date</span>
                      {doc.effectiveDate}
                    </p>
                  ) : null}
                  {doc.contactEmail ? (
                    <p>
                      <span>Contact</span>
                      <a href={`mailto:${doc.contactEmail}`}>{doc.contactEmail}</a>
                    </p>
                  ) : null}
                  <div className="service-native-action-row">
                    <Link to="/contact-us" className="service-native-btn">Contact us</Link>
                  </div>
                </div>
              ) : null}

              {toc.length ? (
                <nav className="native-legal-toc" aria-label="On this page">
                  <h2>On this page</h2>
                  <ul>
                    {toc.map((item) => (
                      <li key={item.id}>
                        <a href={`#${item.id}`}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </aside>

            <article className="native-legal-article">
              <div
                className="native-legal-article-inner"
                dangerouslySetInnerHTML={{ __html: doc.html || '' }}
              />
            </article>
          </div>
        </div>
      </section>
    </>
  );
}

export default function NativeContentPage({ page }) {
  const pageRef = useRef(null);
  useNativeEnhancements(pageRef, page.path);
  const { getConsultants } = useConsultants();
  const { getVisibleJobs } = useCareersJobs();
  const { rates, iraRates, ratesMeta } = useRates();
  const { blocksByPath } = useContentAdmin();
  const baseContent = getNativePageContent(page.path, page.title);
  const content = useMemo(() => {
    let nextBaseContent = baseContent;

    if (page.path === '/test') {
      const pageBlocks = blocksByPath['/test'] || [];
      const heroBlock = pageBlocks.find((block) => block.id === 'hero');
      const introBlock = pageBlocks.find((block) => block.id === 'intro');
      const adminHero = buildTestDynamicHero(heroBlock);
      const adminIntro = buildTestDynamicIntro(introBlock);
      if (adminHero) {
        nextBaseContent = {
          ...nextBaseContent,
          hero: adminHero,
        };
      }
      if (adminIntro) {
        nextBaseContent = {
          ...nextBaseContent,
          intro: adminIntro,
        };
      }
    }

    const consultantService = page.path === '/services/loans/loans-consultant'
      ? 'loans'
      : (page.path === '/services/retirement/retirement-consultants' ? 'retirement' : null);

    const isCareersPage = page.path === '/about-us/careers';
    if (!consultantService && !isCareersPage) {
      return nextBaseContent;
    }

    let nextSections = [...(nextBaseContent.sections || [])];

    if (consultantService) {
      const consultants = getConsultants(consultantService);
      const inquiryLabel = consultantService === 'loans' ? 'Loan consultant inquiry' : 'Retirement consultant inquiry';

      const cards = consultants.map((item) => {
        const name = String(item.name || '').trim();
        const phone = String(item.phone || '').trim();
        const digits = phone.replace(/\D/g, '');

        return {
          title: name || 'Consultant',
          subtitle: String(item.region || '').trim(),
          phone,
          phoneHref: digits ? `tel:${digits}` : undefined,
          messagePanel: true,
          messageCta: `Message ${firstNameFromDisplayName(name)}`,
          consultantEmail: String(item.email || '').trim(),
          states: Array.isArray(item.states) ? item.states : [],
          inquiryLabel,
        };
      });

      nextSections = nextSections.map((section) => {
        if (section.className !== 'loans-consultant-native-locations') {
          return section;
        }
        return {
          ...section,
          cards,
        };
      });
    }

    if (isCareersPage) {
      const jobs = getVisibleJobs().map((job) => ({
        id: job.id,
        title: job.title,
        location: job.location,
        summary: job.summary,
        note: job.note,
        postedDate: formatPostedDate(job.postedDate),
        applyUrl: job.applyUrl,
        buttonLabel: job.buttonLabel || 'Apply Online',
      }));

      nextSections = nextSections.map((section) => {
        if (section.className !== 'careers-native-jobs-list') {
          return section;
        }
        return {
          ...section,
          jobs,
        };
      });
    }

    return {
      ...nextBaseContent,
      sections: nextSections,
    };
  }, [baseContent, blocksByPath, getConsultants, getVisibleJobs, page.path]);
  const [locationFilters, setLocationFilters] = useState({});
  const [activeMessageCards, setActiveMessageCards] = useState({});
  const introConfig = content?.intro && typeof content.intro === 'object' ? content.intro : null;
  const introHeading = introConfig?.heading || null;
  const introHeadingHighlights = Array.isArray(introConfig?.headingHighlights) ? introConfig.headingHighlights : [];
  const introParagraphs = introConfig
    ? (Array.isArray(introConfig.body) ? introConfig.body : (introConfig.body ? [introConfig.body] : []))
    : (content.intro ? [content.intro] : []);
  const introEmphasis = introConfig?.emphasis || null;
  const introEmphasisClassName = introConfig?.emphasisClassName || '';
  const introActions = Array.isArray(introConfig?.actions) ? introConfig.actions : [];
  const heroActions = Array.isArray(content.hero?.actions) ? content.hero.actions : [];
  const heroRailStyle = getHeroRailInlineStyle(content.hero);
  const introImage = introConfig?.image || '';
  const introImageAlt = introConfig?.imageAlt || '';
  const introSplit = Boolean(introImage && introConfig?.layout === 'split');
  const pageClass = content.pageClass ? ` ${content.pageClass}` : '';
  const compactClass = content.compact ? ' is-compact' : '';
  const hideIntro = Boolean(content.hideIntro);
  const legalDoc = content?.legalDocument || null;

  useEffect(() => {
    setLocationFilters({});
    setActiveMessageCards({});
  }, [page.path]);

  if (page.path === '/sitemap') {
    return (
      <div ref={pageRef} className={`service-native-page native-info-page native-info-page--sitemap${compactClass}${pageClass}`}>
        <section className="native-functional-page-head native-functional-page-head--sitemap">
          <div className="ag-panel-rail">
            <h1>Sitemap</h1>
          </div>
        </section>
        <SitemapSection />
      </div>
    );
  }

  if (page.path === '/prospectus') {
    return (
      <div ref={pageRef} className={`service-native-page native-info-page${compactClass}${pageClass}`}>
        <section className="native-functional-page-head native-functional-page-head--prospectus">
          <div className="ag-panel-rail">
            <h1 className="native-prospectus-hero-title">
              <span>Prospectus</span>
              <span>financialis.</span>
            </h1>
            {introParagraphs.length ? <p>{introParagraphs[0]}</p> : null}
            {Array.isArray(content.actions) && content.actions.length ? (
              <div className="service-native-action-row">
                {content.actions.map((item) => (
                  <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
        <ProspectusSection content={content} />
      </div>
    );
  }

  if (page.path === '/forms') {
    return (
      <div ref={pageRef} className={`service-native-page native-info-page${compactClass}${pageClass}`}>
        <section className="native-functional-page-head native-functional-page-head--forms">
          <div className="ag-panel-rail">
            <h1>Forms</h1>
            {introParagraphs.length ? <p>{introParagraphs[0]}</p> : null}
          </div>
        </section>
        <FormsLibrarySection content={content} />
      </div>
    );
  }

  if (legalDoc) {
    return (
      <div ref={pageRef} className={`service-native-page native-info-page${compactClass}${pageClass}`}>
        <LegalDocumentSection content={content} page={page} />
      </div>
    );
  }

  return (
      <div ref={pageRef} className={`service-native-page native-info-page${compactClass}${pageClass}`}>
      <section
        className={`service-native-hero${content.hero?.bgTone ? ` is-bg-${normalizeHeroBgTone(content.hero.bgTone)}` : ''}${content.hero?.justify ? ` is-justify-${normalizeHeroJustify(content.hero.justify)}` : ''}`}
      >
        <div className="ag-panel-rail" style={heroRailStyle}>
          <HeroTitle hero={content.hero || { title: page.title }} />
          {heroActions.length ? (
            <div className="service-native-action-row is-centered">
              {heroActions.map((item) => (
                <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {!hideIntro ? (
        <section className={`service-native-intro${introSplit ? ' is-split' : ''}${introConfig?.className ? ` ${introConfig.className}` : ''}`}>
          <div className="ag-panel-rail">
            <div className={`service-native-intro-shell${introSplit ? ' has-media' : ''}`}>
              <div className={`service-native-intro-copy${introConfig?.copyClassName ? ` ${introConfig.copyClassName}` : ''}`}>
                {introHeading ? (
                  <h2 className={introConfig?.headingClassName || undefined}>
                    {introHeadingHighlights.length ? renderHighlightedText(introHeading, introHeadingHighlights) : introHeading}
                  </h2>
                ) : null}
                {introParagraphs.map((paragraph) => <p key={paragraph}>{renderTextWithStrong(paragraph)}</p>)}
                {introEmphasis ? (
                  <p className={`native-info-intro-emphasis${introEmphasisClassName ? ` ${introEmphasisClassName}` : ''}`}>
                    {renderTextWithStrong(introEmphasis)}
                  </p>
                ) : null}
                {introActions.length ? (
                  <div className="service-native-action-row is-centered">
                    {introActions.map((item) => (
                      <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                    ))}
                  </div>
                ) : null}
              </div>
              {introSplit ? (
                <figure className="service-native-intro-media">
                  <img src={introImage} alt={introImageAlt} loading="lazy" />
                </figure>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {(content.sections || []).map((section, sectionIndex) => {
        const cards = Array.isArray(section.cards) ? section.cards : [];
        const sectionKey = `${page.path}-${sectionIndex}-${section.title || 'section'}`;
        const hasLocationFilter = Boolean(section.locationFilter);
        const selectedLocation = locationFilters[sectionKey] || '';
        const locationOptions = hasLocationFilter ? getLocationOptions(section) : [];
        const requireLocationSelection = Boolean(section.locationFilter?.requireSelection);
        const focusMessageCard = Boolean(section.locationFilter?.focusMessageCard || section.focusMessageCard);
        const activeMessageCard = activeMessageCards[sectionKey] || '';
        const locationFilterLabel = hasLocationFilter
          ? (typeof section.locationFilter.label === 'string' ? section.locationFilter.label : 'Select your location')
          : '';
        const filteredCards = selectedLocation
          ? cards.filter((card) => {
            if (!Array.isArray(card.states) || !card.states.length) {
              return true;
            }
            return card.states.includes(selectedLocation);
          })
          : (requireLocationSelection ? [] : cards);
        const activeCardStillVisible = !activeMessageCard
          || filteredCards.some((card) => card.title === activeMessageCard);
        const visibleCards = focusMessageCard && activeMessageCard && activeCardStillVisible
          ? filteredCards.filter((card) => card.title === activeMessageCard)
          : filteredCards;

        if (section.feature) {
          const feature = section.feature;
          const featureBody = Array.isArray(feature.body)
            ? feature.body
            : (feature.body ? [feature.body] : []);

          return (
            <section
              key={section.title}
              id={section.anchorId || undefined}
              className={`service-native-section${section.sand ? ' is-sand' : ''}${section.className ? ` ${section.className}` : ''}`}
            >
              <div className={section.fullBleed ? 'ag-panel-rail-wide native-info-full-bleed' : (section.wide ? 'ag-panel-rail-wide' : 'ag-panel-rail')}>
                <div className="service-native-dark-feature">
                  <div className="service-native-dark-feature-inner">
                    <div
                      className="service-native-dark-feature-media"
                      style={feature.image ? { backgroundImage: `url(${feature.image})` } : undefined}
                      role={feature.imageAlt ? 'img' : undefined}
                      aria-label={feature.imageAlt || undefined}
                    />
                    <div className="service-native-dark-feature-copy">
                      {feature.logoImage ? (
                        <img
                          src={feature.logoImage}
                          alt={feature.logoAlt || ''}
                          className="native-info-feature-logo"
                        />
                      ) : null}
                      {feature.title ? (
                        <h3>
                          {Array.isArray(feature.titleHighlights) && feature.titleHighlights.length
                            ? renderHighlightedText(feature.title, feature.titleHighlights)
                            : feature.title}
                        </h3>
                      ) : null}
                      {featureBody.map((paragraph) => <p key={paragraph}>{renderTextWithStrong(paragraph)}</p>)}
                      {Array.isArray(feature.actions) && feature.actions.length ? (
                        <div className="service-native-action-row">
                          {feature.actions.map((item) => (
                            <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        return (
          <section
            key={section.title}
            id={section.anchorId || undefined}
            className={`service-native-section${section.sand ? ' is-sand' : ''}${section.className ? ` ${section.className}` : ''}`}
          >
            <div className={section.fullBleed ? 'ag-panel-rail-wide native-info-full-bleed' : (section.wide ? 'ag-panel-rail-wide' : 'ag-panel-rail')}>
            {section.logoImage ? (
              <img
                src={section.logoImage}
                alt={section.logoAlt || ''}
                className="native-info-section-logo"
              />
            ) : null}
            {!section.logoImage && section.logoText ? (
              <p className="native-info-section-logo-text">{section.logoText}</p>
            ) : null}
            {section.copyWrap ? (
              <div className={`native-info-section-copy${section.copyClassName ? ` ${section.copyClassName}` : ''}`}>
                {!section.hideTitle ? (
                  <h2 className={section.titleClassName || undefined}>
                    {renderHighlightedText(section.title, section.titleHighlights)}
                  </h2>
                ) : null}
                {section.subtitle ? <h3 className="native-info-section-subtitle">{section.subtitle}</h3> : null}
                {(section.body || []).map((paragraph) => <p key={paragraph}>{renderTextWithStrong(paragraph)}</p>)}

                {Array.isArray(section.links) && section.links.length ? (
                  <ul className="native-info-link-list">
                    {section.links.map((item) => (
                      <li key={`${item.label}-${item.to || item.href || item.documentId}`}>
                        <NativeLink item={item} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <>
                {!section.hideTitle ? (
                  <h2 className={section.titleClassName || undefined}>
                    {renderHighlightedText(section.title, section.titleHighlights)}
                  </h2>
                ) : null}
                {section.subtitle ? <h3 className="native-info-section-subtitle">{section.subtitle}</h3> : null}
                {(section.body || []).map((paragraph) => <p key={paragraph}>{renderTextWithStrong(paragraph)}</p>)}

                {Array.isArray(section.links) && section.links.length ? (
                  <ul className="native-info-link-list">
                    {section.links.map((item) => (
                      <li key={`${item.label}-${item.to || item.href || item.documentId}`}>
                        <NativeLink item={item} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}

            {hasLocationFilter ? (
              <div className="native-info-location-filter">
                <label htmlFor={`native-location-${sectionIndex}`} className={!locationFilterLabel ? 'is-label-hidden' : ''}>
                  {locationFilterLabel ? <span>{locationFilterLabel}</span> : null}
                  <select
                    id={`native-location-${sectionIndex}`}
                    value={selectedLocation}
                    aria-label={locationFilterLabel || section.locationFilter.ariaLabel || 'Select your location'}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setLocationFilters((prev) => ({
                        ...prev,
                        [sectionKey]: nextValue,
                      }));
                      setActiveMessageCards((prev) => ({
                        ...prev,
                        [sectionKey]: '',
                      }));
                    }}
                  >
                    <option value="">{section.locationFilter.placeholder || 'Choose your state'}</option>
                    {locationOptions.map((option) => (
                      <option key={`${sectionKey}-${option.value}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {section.actionsBeforeCards && Array.isArray(section.actions) && section.actions.length ? (
              <div className="service-native-action-row">
                {section.actions.map((item) => (
                  <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                ))}
              </div>
            ) : null}

            {cards.length && visibleCards.length ? (
              <div className={`service-native-grid${section.columns ? ` is-${section.columns}` : ''}${focusMessageCard && activeMessageCard ? ' is-focus-open' : ''}`}>
                {visibleCards.map((card) => {
                  const isActiveMessageCard = focusMessageCard && activeMessageCard === card.title;
                  const resolvedMessageLayout = isActiveMessageCard && card.messagePanel ? 'inline' : 'toggle';

                  return (
                  <article key={card.title} className={`service-native-card ${focusMessageCard ? '' : 'fade-up'} ${card.cardClass || 'card2'}${card.messagePanel && resolvedMessageLayout === 'inline' ? ' has-inline-message' : ''}`.trim()}>
                    <div className={card.messagePanel && resolvedMessageLayout === 'inline' ? 'consultant-card-details' : undefined}>
                      <h3 className={card.titleClassName || undefined}>
                        {Array.isArray(card.titleHighlights) && card.titleHighlights.length
                          ? renderHighlightedText(card.title, card.titleHighlights)
                          : card.title}
                      </h3>
                      {card.subtitle ? <p className="service-native-card-subtitle">{renderTextWithStrong(card.subtitle)}</p> : null}
                      {card.phone ? (
                        <p className="service-native-card-phone">
                          {card.phoneHref ? (
                            <a href={card.phoneHref}>{card.phone}</a>
                          ) : card.phone}
                        </p>
                      ) : null}
                      {card.body ? <p>{renderTextWithStrong(card.body)}</p> : null}
                      {Array.isArray(card.list) && card.list.length ? (
                        <ul className="service-native-card-bullet-list">
                          {card.list.map((item) => (
                            <li key={`${card.title}-${item}`}>{renderTextWithStrong(item)}</li>
                          ))}
                        </ul>
                      ) : null}
                      {Array.isArray(card.links) && card.links.length ? (
                        <ul className="service-native-card-link-list">
                          {card.links.map((item) => (
                            <li key={`${card.title}-${item.label}-${item.to || item.href || item.documentId}`}>
                              <NativeLink item={item} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {Array.isArray(card.accordions) && card.accordions.length ? (
                        <div className="service-native-card-accordions">
                          {card.accordions.map((accordion) => (
                            <details key={`${card.title}-${accordion.title}`} className="service-native-card-accordion">
                              <summary>{accordion.title}</summary>
                              {Array.isArray(accordion.links) && accordion.links.length ? (
                                <ul className="service-native-card-accordion-links">
                                  {accordion.links.map((item) => (
                                    <li key={`${accordion.title}-${item.label}-${item.to || item.href || item.documentId}`}>
                                      <NativeLink item={item} />
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </details>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {Boolean(card.messagePanel) ? (
                      <ConsultantMessagePanel
                        card={card}
                        layout={resolvedMessageLayout}
                        onOpenChange={(nextOpen) => {
                          setActiveMessageCards((prev) => ({
                            ...prev,
                            [sectionKey]: nextOpen ? card.title : '',
                          }));
                        }}
                      />
                    ) : null}
                    {!card.messagePanel && Array.isArray(card.actions) && card.actions.length ? (
                      <div className="service-native-action-row">
                        {card.actions.map((item) => (
                          <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                        ))}
                      </div>
                    ) : null}
                    {!card.messagePanel && !Array.isArray(card.actions) && (card.to || card.href || card.documentId) ? (
                      <div className="service-native-action-row">
                        <Action
                          item={{
                            label: card.cta || 'Learn more',
                            to: card.to,
                            href: card.href,
                            documentId: card.documentId,
                          }}
                        />
                      </div>
                    ) : null}
                  </article>
                  );
                })}
              </div>
            ) : null}

            {cards.length && !visibleCards.length ? (
              <p className="native-info-location-empty">
                {requireLocationSelection && !selectedLocation
                  ? 'Select your state to view your consultant.'
                  : 'No consultant currently listed for that state. Please call 866.621.1787.'}
              </p>
            ) : null}

            {Array.isArray(section.jobs) && section.jobs.length ? (
              <div className="careers-native-jobs-list-wrap">
                {section.jobs.map((job) => (
                  <article key={job.id || job.title} className="careers-native-job">
                    <h3>{job.title}</h3>
                    {job.location ? <p className="careers-native-job-location">{job.location}</p> : null}
                    {job.postedDate ? <p className="careers-native-job-posted">Posted {job.postedDate}</p> : null}
                    {job.summary ? <p className="careers-native-job-summary">{job.summary}</p> : null}
                    {job.note ? <p className="careers-native-job-note"><em>{job.note}</em></p> : null}
                    {job.applyUrl ? (
                      <div className="service-native-action-row is-centered">
                        <a href={job.applyUrl} target="_blank" rel="noreferrer noopener" className="service-native-btn">
                          {job.buttonLabel || 'Apply Online'}
                        </a>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            {Array.isArray(section.jobs) && !section.jobs.length ? (
              <p className="native-info-location-empty">There are currently no open positions to display.</p>
            ) : null}

            {section.form ? <NativeContentForm config={section.form} /> : null}

            {section.widget === 'retirement-403b-rate-table' ? (
              <Retirement403bRateTableWidget rates={rates} ratesMeta={ratesMeta} />
            ) : null}

            {section.widget === 'retirement-ira-rate-table' ? (
              <RetirementIraRateTableWidget iraRates={iraRates} ratesMeta={ratesMeta} />
            ) : null}

            {section.widget === 'retirement-fund-ira' ? (
              <FundAnIraWidget />
            ) : null}

            {section.widget === 'endowment-calculator' ? (
              <EndowmentCalculatorWidget />
            ) : null}

            {section.widget === 'giving-comparison-matrix' ? (
              <GivingComparisonMatrix />
            ) : null}

            {section.widget === 'charitable-giving-table' ? (
              <CharitableGivingTableWidget />
            ) : null}

            {section.widget === 'charitable-gift-test-drive' ? (
              <CharitableGiftTestDriveWidget />
            ) : null}

            {section.widget === 'retirement-minister-housing-quick-check' ? (
              <MinisterHousingQuickCheckWidget />
            ) : null}

            {section.widget === 'emergency-fund-calculator' ? (
              <EmergencyFundCalculatorWidget />
            ) : null}

            {section.widget === 'net-worth-calculator' ? (
              <NetWorthCalculatorWidget />
            ) : null}

            {section.widget === 'increased-contribution-calculator' ? (
              <IncreasedContributionCalculatorWidget />
            ) : null}

            {section.table ? (
              <div className="native-info-table-wrap">
                <table className="ag-table has-fixed-layout">
                  <thead>
                    <tr>
                      {section.table.headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, rowIndex) => (
                      <tr key={row.join('|')}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}-${cell}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {Array.isArray(section.testimonials) && section.testimonials.length ? (
              <div className="service-native-testimonials-wrap">
                <div className="carousel-stack">
                  {section.testimonials.map((item, index) => (
                    <article key={item.author} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                      <p><strong>{item.quote}</strong></p>
                      <p>—<strong>{item.author}</strong></p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {section.addressBlock ? (
              <CopyAddressBlock
                config={section.addressBlock}
                className={section.addressBlock.className || ''}
              />
            ) : null}

            {section.fineprint ? (
              Array.isArray(section.fineprint)
                ? section.fineprint.map((line, index) => (
                  <p key={`${sectionKey}-fineprint-${index + 1}`} className="service-native-note">{renderTextWithStrong(line)}</p>
                ))
                : <p className="service-native-note">{renderTextWithStrong(section.fineprint)}</p>
            ) : null}

            {Array.isArray(section.faqs) && section.faqs.length ? (
              <div className="native-faq-list">
                {section.faqs.map((item) => (
                  <details key={item.question} className="native-faq-item">
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            ) : null}

            {!section.actionsBeforeCards && Array.isArray(section.actions) && section.actions.length ? (
              <div className="service-native-action-row">
                {section.actions.map((item) => (
                  <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                ))}
              </div>
            ) : null}
            </div>
          </section>
        );
      })}

      {Array.isArray(content.actions) && content.actions.length ? (
        <section className="service-native-cta-band">
          <div className="ag-panel-rail">
            <div className="service-native-action-row is-centered">
              {content.actions.map((item) => (
                <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
