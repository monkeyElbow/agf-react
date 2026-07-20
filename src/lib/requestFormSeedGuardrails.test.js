import { describe, expect, it } from 'vitest';
import {
  buildDynamicRequestDefaultBlocksForPath,
  normalizeDynamicRequestFormSettings,
  normalizeStoredConfig,
} from '../context/ContentAdminContext';
import { contentBlockBlueprintsByPath, genericPageBlockBlueprint } from '../data/contentBlockBlueprints';
import { getNativePageContent } from '../data/nativePageContent';

const AUTO_REQUEST_FORM_ROUTES = [];

const EXPLICIT_REQUEST_FORM_ROUTES = [
  '/services/planned-giving/charitable-gift-annuities',
  '/services/planned-giving/endowments',
  '/services/planned-giving/generosity-fund',
  '/services/planned-giving/ministry-impact-fund',
];

const STANDALONE_EXPLICIT_REQUEST_FORM_ROUTES = [
  '/services/insurance/life-insurance-quote',
];

const STANDALONE_CLASS_HOOK_REQUEST_FORM_ROUTES = {
  '/contact-us': {
    sectionClassName: 'contact-us-request',
    step1Signal: '"firstName"',
    step2Signal: '"inquiryType"',
  },
  '/services/loans/loan-consultants': {
    sectionClassName: 'loans-consultant-native-contact',
    step1Signal: '"firstName"',
    step2Signal: '"ministry"',
  },
  '/services/retirement/retirement-consultants': {
    sectionClassName: 'loans-consultant-native-contact',
    step1Signal: '"firstName"',
    step2Signal: '"churchOrMinistry"',
  },
  '/services/insurance/certificate-request': {
    sectionClassName: 'certificate-request-native-section',
    step1Signal: '"firstName"',
    step2Signal: '"address1"',
  },
  '/services/insurance/group-term-life-insurance': {
    sectionClassName: 'group-life-native-quote',
    step1Signal: '"contactFirstName"',
    step2Signal: '"organizationName"',
  },
  '/services/insurance/property-casualty-insurance': {
    sectionClassName: 'insurance-pc-native-quote',
    step1Signal: '"contactFirstName"',
    step2Signal: '"organizationName"',
  },
};

const CTA_OWNED_FORM_ROUTES = [
  '/about-us',
  '/calculators',
  '/services/insurance',
  '/services/planned-giving/charitable-trusts',
  '/services/insurance/ministers-group-life-plan',
  '/services/planned-giving',
  '/services/retirement/409a',
  '/services/retirement/403b',
  '/services/retirement/rollovers',
];

const EXPLICIT_REQUEST_OVERRIDES = {};

function getRequestTemplate() {
  const template = genericPageBlockBlueprint().find((block) => (
    block?.mode === 'dynamic' && block?.kind === 'request_form'
  ));
  if (!template) {
    throw new Error('Missing request form template');
  }
  return template;
}

function toSectionTargetKey(section, sectionIndex) {
  if (section?.id) {
    return `id:${section.id}`;
  }
  if (section?.className) {
    return `class:${section.className}`;
  }
  return `index:${sectionIndex}`;
}

function getStaticRequestSections(pathname, options = {}) {
  const includeCertificate = Boolean(options?.includeCertificate);
  const nativeContent = getNativePageContent(pathname, '');
  const sections = Array.isArray(nativeContent?.sections) ? nativeContent.sections : [];
  return sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => (
      section?.form
      && typeof section.form === 'object'
      && (
        includeCertificate
        || String(section.form.variant || '').trim().toLowerCase() !== 'certificate-request'
      )
    ));
}

function inferExpectedBgTone(section) {
  const classToken = String(section?.className || '').toLowerCase();
  if (classToken.includes('loans-consultant-native-contact')) {
    return 'blue';
  }
  if (classToken.includes('legacy-giving-joy')) {
    return 'white';
  }
  if (classToken.includes('grey') || classToken.includes('gray') || classToken.includes('dark')) {
    return 'grey';
  }
  if (classToken.includes('blue')) {
    return 'blue';
  }
  if (classToken.includes('sand')) {
    return 'sand';
  }
  if (classToken.includes('white')) {
    return 'white';
  }
  const hasWhiteHighlight = Array.isArray(section?.titleHighlights)
    && section.titleHighlights.some((entry) => String(entry?.className || '').trim().toLowerCase() === 'is-white');
  if (hasWhiteHighlight) {
    return 'blue';
  }
  return 'sand';
}

function inferExpectedTextTone(section, bgTone) {
  if (bgTone === 'blue' || bgTone === 'grey') {
    return 'white';
  }
  const hasWhiteHighlight = Array.isArray(section?.titleHighlights)
    && section.titleHighlights.some((entry) => String(entry?.className || '').trim().toLowerCase() === 'is-white');
  return hasWhiteHighlight ? 'white' : 'dark';
}

function toExpectedTitleHighlightsJson(section) {
  return Array.isArray(section?.titleHighlights) && section.titleHighlights.length
    ? JSON.stringify(section.titleHighlights)
    : '';
}

function toExpectedSubtitle(section) {
  return String(section?.subtitle || section?.form?.subtitle || '').trim();
}

function toExpectedBody(section) {
  const bodyList = Array.isArray(section?.body) ? section.body : (section?.body ? [section.body] : []);
  return bodyList
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

function toExpectedRequestSteps(section) {
  const form = section?.form && typeof section.form === 'object' ? section.form : {};
  const normalizeField = (field) => {
    const config = {
      id: String(field?.id || '').trim(),
      label: String(field?.label || '').trim(),
      type: String(field?.type || 'text').trim(),
      required: Boolean(field?.required),
      placeholder: String(field?.placeholder || '').trim(),
      full: Boolean(field?.full),
      help: String(field?.help || '').trim(),
      format: String(field?.format || '').trim(),
      errorMessage: String(field?.errorMessage || '').trim(),
    };

    if (Number.isFinite(Number(field?.maxLength)) && Number(field.maxLength) > 0) {
      config.maxLength = Number(field.maxLength);
    }
    if (config.type === 'textarea' && Number.isFinite(Number(field?.rows)) && Number(field.rows) > 0) {
      config.rows = Number(field.rows);
    }
    if (Array.isArray(field?.options) && field.options.length) {
      config.options = field.options.map((option) => ({
        value: String(option?.value || '').trim(),
        label: String(option?.label || '').trim(),
      })).filter((option) => option.value || option.label);
    }

    return config;
  };

  if (Array.isArray(form.steps) && form.steps.length) {
    return form.steps
      .map((step, index) => ({
        title: String(step?.title || `Step ${index + 1}`).trim(),
        note: String(step?.note || '').trim(),
        nextLabel: String(step?.nextLabel || '').trim(),
        backLabel: String(step?.backLabel || '').trim(),
        fields: (Array.isArray(step?.fields) ? step.fields : []).map(normalizeField),
      }))
      .filter((step) => step.fields.length)
      .slice(0, 5);
  }

  const fields = Array.isArray(form.fields) ? form.fields : [];
  if (!fields.length) {
    return [];
  }

  return [{
    title: String(form.title || '').trim(),
    note: String(form.subtitle || '').trim(),
    nextLabel: String(form.nextLabel || '').trim(),
    backLabel: String(form.backLabel || '').trim(),
    fields: fields.map(normalizeField),
  }];
}

function findMatchedStaticSection(pathname, settings, options = {}) {
  const sections = getStaticRequestSections(pathname, options);
  const targetKey = String(settings?.targetSectionKey || '').trim();
  const targetClassName = String(settings?.targetSectionClassName || '').trim().toLowerCase();
  return sections.find(({ section, index }) => (
    toSectionTargetKey(section, index) === targetKey
    || String(section?.className || '').trim().toLowerCase() === targetClassName
  )) || null;
}

function expectRequestSettingsToMatchStatic(pathname, settings, options = {}) {
  const matched = findMatchedStaticSection(pathname, settings, options);
  if (!matched) {
    throw new Error(`Missing static request section match for ${pathname}`);
  }

  const { section, index } = matched;
  const explicitOverride = EXPLICIT_REQUEST_OVERRIDES[pathname] || null;
  const expectedBgTone = explicitOverride?.bgTone || inferExpectedBgTone(section);
  const expectedSubtitle = explicitOverride?.subtitle || toExpectedSubtitle(section);
  const expectedTextTone = explicitOverride?.textTone || inferExpectedTextTone(section, expectedBgTone);
  const expectedBody = toExpectedBody(section);

  expect(String(settings.title || '')).toBe(String(explicitOverride?.title || section?.title || section?.form?.title || '').trim());
  expect(String(settings.titleClassName || '')).toBe(String(section?.titleClassName || '').trim());
  expect(String(settings.titleHighlightsJson || '')).toBe(toExpectedTitleHighlightsJson(section));
  expect(String(settings.subtitle || '')).toBe(expectedSubtitle);
  expect(String(settings.body || '')).toBe(expectedBody);
  expect(String(settings.bgTone || '')).toBe(expectedBgTone);
  expect(String(settings.textTone || '')).toBe(expectedTextTone);
  expect(String(settings.targetSectionKey || '')).toBe(toSectionTargetKey(section, index));
  expect(String(settings.targetSectionClassName || '')).toBe(String(section?.className || '').trim());
  expect(Number(settings.targetSectionIndex)).toBe(index);

  if (options?.expectSteps) {
    const expectedSteps = toExpectedRequestSteps(section);
    expectedSteps.forEach((step, stepIndex) => {
      const slot = stepIndex + 1;
      expect(String(settings[`step${slot}Title`] || '')).toBe(step.title);
      expect(String(settings[`step${slot}Note`] || '')).toBe(step.note);
      expect(String(settings[`step${slot}FieldsJson`] || '')).toBe(JSON.stringify(step.fields));
      expect(String(settings[`step${slot}NextLabel`] || '')).toBe(step.nextLabel);
      expect(String(settings[`step${slot}BackLabel`] || '')).toBe(step.backLabel);
    });
  }
}

describe('request form seed guardrails', () => {
  it('keeps explicit request-form seeds aligned to their static request sections', () => {
    EXPLICIT_REQUEST_FORM_ROUTES.forEach((pathname) => {
      const block = (contentBlockBlueprintsByPath[pathname] || []).find((entry) => (
        entry?.kind === 'request_form' && entry?.mode === 'dynamic'
      ));

      if (!block) {
        throw new Error(`Missing explicit request form seed for ${pathname}`);
      }

      if (
        pathname === '/services/planned-giving/charitable-gift-annuities'
        || pathname === '/services/planned-giving/endowments'
        || pathname === '/services/planned-giving/generosity-fund'
        || pathname === '/services/planned-giving/ministry-impact-fund'
      ) {
        expect(block.settings?.sectionClassName).toBe(
          pathname === '/services/planned-giving/charitable-gift-annuities'
            ? 'legacy-child-native-cga-request'
            : pathname === '/services/planned-giving/endowments'
              ? 'legacy-child-native-endowments-legacy-form'
              : pathname === '/services/planned-giving/generosity-fund'
                ? 'legacy-child-native-generosity-request'
                : 'legacy-child-native-request',
        );
        expect(String(block.settings?.targetSectionKey || '')).toBe('');
        expect(String(block.settings?.targetSectionClassName || '')).toBe('');
        return;
      }

      expectRequestSettingsToMatchStatic(pathname, block.settings || {}, { includeCertificate: true });
    });
  });

  it('does not auto-generate request-form seeds for routes with explicit request-form blueprints', () => {
    const requestTemplate = getRequestTemplate();

    [
      ...EXPLICIT_REQUEST_FORM_ROUTES,
      ...STANDALONE_EXPLICIT_REQUEST_FORM_ROUTES,
      ...Object.keys(STANDALONE_CLASS_HOOK_REQUEST_FORM_ROUTES),
    ].forEach((pathname) => {
      const blocks = buildDynamicRequestDefaultBlocksForPath(
        pathname,
        '',
        contentBlockBlueprintsByPath[pathname] || [],
        requestTemplate,
      );

      expect(blocks).toHaveLength(0);
    });
  });

  it('does not auto-generate request-form seeds for CTA-owned form routes', () => {
    const requestTemplate = getRequestTemplate();

    CTA_OWNED_FORM_ROUTES.forEach((pathname) => {
      const blocks = buildDynamicRequestDefaultBlocksForPath(
        pathname,
        '',
        contentBlockBlueprintsByPath[pathname] || [],
        requestTemplate,
      );

      expect(blocks).toHaveLength(0);
    });
  });

  it('keeps auto-generated request-form seeds aligned to their static request sections', () => {
    const requestTemplate = getRequestTemplate();

    AUTO_REQUEST_FORM_ROUTES.forEach((pathname) => {
      const staticSections = getStaticRequestSections(pathname);
      const blocks = buildDynamicRequestDefaultBlocksForPath(
        pathname,
        '',
        contentBlockBlueprintsByPath[pathname] || [],
        requestTemplate,
      );

      expect(blocks).toHaveLength(staticSections.length);
      blocks.forEach((block) => {
        expectRequestSettingsToMatchStatic(pathname, block.settings || {});
      });
    });
  });

  it('restores styled request-form defaults when stored settings lose them', () => {
    const requestTemplate = getRequestTemplate();

    AUTO_REQUEST_FORM_ROUTES.forEach((pathname) => {
      const blocks = buildDynamicRequestDefaultBlocksForPath(
        pathname,
        '',
        contentBlockBlueprintsByPath[pathname] || [],
        requestTemplate,
      );

      blocks.forEach((block) => {
        const normalized = normalizeDynamicRequestFormSettings(pathname, {
          targetSectionKey: block?.settings?.targetSectionKey || '',
          title: '',
          titleClassName: '',
          titleHighlightsJson: '',
          subtitle: '',
          body: '',
          bgTone: '',
          textTone: '',
          targetSectionClassName: '',
          targetSectionIndex: NaN,
        });

        expectRequestSettingsToMatchStatic(pathname, normalized);
      });
    });
  });

  it('repairs stale property and casualty request-form browser state back to the standalone canonical block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/property-casualty-insurance': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Request a Property & Casualty Insurance Quote',
              subtitle: 'We’re passionate about protecting your ministry.',
              body: 'Share a few details and we’ll help you explore broader coverage and value-added risk management tailored to your church or organization.',
              bgTone: 'blue',
              textTone: 'white',
              targetSectionKey: 'class:insurance-pc-native-quote',
              targetSectionClassName: 'insurance-pc-native-quote',
              step1NextLabel: 'Go to next step',
            },
          },
        ],
      },
    });

    const block = (normalized.blocksByPath['/services/insurance/property-casualty-insurance'] || [])
      .find((entry) => entry?.id === 'request_form');

    expect(block).toBeTruthy();
    expect(block?.settings?.sectionClassName).toBe('insurance-pc-native-quote');
    expect(String(block?.settings?.targetSectionKey || '')).toBe('');
    expect(String(block?.settings?.targetSectionClassName || '')).toBe('');
    expect(String(block?.settings?.targetSectionIndex || '')).toBe('');
    expect(block?.settings?.title).toBe('Request a P&C quote.');
    expect(block?.settings?.body).toBe('Provide a few specifics, and we’ll contact you about a policy built specifically for your ministry.');
    expect(block?.settings?.step1FieldsJson).toContain('"contactFirstName"');
    expect(block?.settings?.step2FieldsJson).toContain('"organizationName"');
    expect(String(block?.settings?.step1NextLabel || '')).toBe('Next');
    expect(String(block?.settings?.step2BackLabel || '')).toBe('Back');
    expect(String(block?.settings?.step2NextLabel || '')).toBe('Next');
  });

  it('keeps standalone explicit request-form seeds authoritative after removing the native request section', () => {
    STANDALONE_EXPLICIT_REQUEST_FORM_ROUTES.forEach((pathname) => {
      const block = (contentBlockBlueprintsByPath[pathname] || []).find((entry) => (
        entry?.kind === 'request_form' && entry?.mode === 'dynamic'
      ));

      if (!block) {
        throw new Error(`Missing standalone explicit request form seed for ${pathname}`);
      }

      expect(getStaticRequestSections(pathname)).toHaveLength(0);
      expect(String(block?.settings?.targetSectionKey || '')).toBe('');
      expect(String(block?.settings?.targetSectionClassName || '')).toBe('');
      expect(block?.settings?.step1FieldsJson).toContain('"firstName"');
      expect(block?.settings?.step3FieldsJson).toContain('"policyExpirationDate"');
    });
  });

  it('keeps standalone explicit request-form seeds with class hooks authoritative after removing the native request section', () => {
    Object.entries(STANDALONE_CLASS_HOOK_REQUEST_FORM_ROUTES).forEach(([pathname, expected]) => {
      const block = (contentBlockBlueprintsByPath[pathname] || []).find((entry) => (
        entry?.kind === 'request_form' && entry?.mode === 'dynamic'
      ));

      if (!block) {
        throw new Error(`Missing standalone class-hook request form seed for ${pathname}`);
      }

      expect(getStaticRequestSections(pathname)).toHaveLength(0);
      expect(String(block?.settings?.sectionClassName || '')).toBe(expected.sectionClassName);
      expect(String(block?.settings?.targetSectionKey || '')).toBe('');
      expect(String(block?.settings?.targetSectionClassName || '')).toBe('');
      expect(block?.settings?.step1FieldsJson).toContain(expected.step1Signal);
      expect(block?.settings?.step2FieldsJson).toContain(expected.step2Signal);
    });
  });

  it('keeps an insurance request-form block static when the user switches it off dynamic', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/property-casualty-insurance': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'static',
            settings: {},
          },
        ],
      },
    });

    const block = (normalized.blocksByPath['/services/insurance/property-casualty-insurance'] || [])
      .find((entry) => entry?.id === 'request_form');

    expect(block).toBeTruthy();
    expect(block.mode).toBe('static');
  });

  it('keeps home managed billboard blocks on the canonical dynamic path when the user switches them on', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'home_ministry_allies',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Ministry allies.',
              bodyHtml: '<p>We are serving you.</p>',
            },
          },
          {
            id: 'home_do_the_math',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: '(let us) Do the math.',
              body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
            },
          },
        ],
      },
    });

    const columnsMha = (normalized.blocksByPath['/'] || []).find((entry) => entry?.id === 'home_ministry_allies');
    const columnsMath = (normalized.blocksByPath['/'] || []).find((entry) => entry?.id === 'home_do_the_math');

    expect(columnsMha).toBeTruthy();
    expect(columnsMha.mode).toBe('dynamic');
    expect(columnsMha.kind).toBe('billboard');
    expect(columnsMha.settings.title).toBe('Ministry allies.');
    expect(columnsMha.settings.bodyHtml).toContain('We are serving you');
    expect(columnsMath).toBeTruthy();
    expect(columnsMath.mode).toBe('dynamic');
    expect(columnsMath.kind).toBe('billboard');
    expect(columnsMath.settings.title).toBe('(let us) Do the math.');
    expect(columnsMath.settings.body).toBe('Retirement savings, compound interest, loan payments, net worth, and more.');
  });
});
