import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from '../context/ContentAdminContext';
import { contentBlockBlueprintsByPath, genericPageBlockBlueprint } from '../data/contentBlockBlueprints';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPLICIT_REQUEST_FORM_ROUTES = {
  '/services/planned-giving/charitable-gift-annuities': {
    sectionClassName: 'legacy-child-native-cga-request',
  },
  '/services/planned-giving/endowments': {
    sectionClassName: 'legacy-child-native-endowments-legacy-form',
  },
  '/services/planned-giving/generosity-fund': {
    sectionClassName: 'legacy-child-native-generosity-request',
  },
  '/services/planned-giving/ministry-impact-fund': {
    sectionClassName: 'legacy-child-native-request',
  },
  '/services/insurance/life-insurance-quote': {
    step1Signal: '"firstName"',
    step3Signal: '"policyExpirationDate"',
  },
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

const TARGET_BRIDGE_KEYS = [
  'targetSectionKey',
  'targetFineprintSectionKey',
  'targetSectionClassName',
  'targetSectionIndex',
];

function getRequestBlock(pathname) {
  return (contentBlockBlueprintsByPath[pathname] || []).find((entry) => (
    entry?.kind === 'request_form' && entry?.mode === 'dynamic'
  ));
}

function expectNoTargetBridgeSettings(settings, label) {
  TARGET_BRIDGE_KEYS.forEach((key) => {
    expect(settings?.[key], `${label} should not carry ${key}`).toBeUndefined();
  });
}

describe('request form seed guardrails', () => {
  it('keeps request-form routes on explicit dynamic blueprints without target bridge fields', () => {
    Object.entries(EXPLICIT_REQUEST_FORM_ROUTES).forEach(([pathname, expected]) => {
      const block = getRequestBlock(pathname);

      if (!block) {
        throw new Error(`Missing explicit request form seed for ${pathname}`);
      }

      expect(block.mode).toBe('dynamic');
      if (expected.sectionClassName) {
        expect(block.settings?.sectionClassName).toBe(expected.sectionClassName);
      }
      expectNoTargetBridgeSettings(block.settings, pathname);
      expect(JSON.parse(block.settings?.step1FieldsJson || '[]').length, pathname).toBeGreaterThan(0);
      if (expected.step1Signal) {
        expect(block.settings?.step1FieldsJson).toContain(expected.step1Signal);
      }
      if (expected.step2Signal) {
        expect(block.settings?.step2FieldsJson).toContain(expected.step2Signal);
      }
      if (expected.step3Signal) {
        expect(block.settings?.step3FieldsJson).toContain(expected.step3Signal);
      }
    });
  });

  it('keeps the generic request-form insert template free of target bridge fields', () => {
    const template = genericPageBlockBlueprint().find((block) => (
      block?.mode === 'dynamic' && block?.kind === 'request_form'
    ));

    expect(template).toBeTruthy();
    expectNoTargetBridgeSettings(template?.settings, 'generic request-form template');
  });

  it('does not expose native request-section seed helpers from ContentAdminContext', () => {
    const source = readFileSync(path.resolve(__dirname, '../context/ContentAdminContext.jsx'), 'utf8');

    [
      'buildDynamicRequestDefaultBlocksForPath',
      'normalizeDynamicRequestFormSettings',
      'findStaticRequestFormSection',
      'toSectionTargetKey',
      'seedFromNativePageContent',
    ].forEach((name) => {
      expect(source, `${name} should not be part of the request-form contract`).not.toContain(name);
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
    expect(block.mode).toBe('dynamic');
    expect(block.settings?.sectionClassName).toBe('insurance-pc-native-quote');
    expectNoTargetBridgeSettings(block.settings, '/services/insurance/property-casualty-insurance normalized request');
    expect(block.settings?.title).toBe('Request a P&C quote.');
    expect(block.settings?.body).toBe('Provide a few specifics, and we’ll contact you about a policy built specifically for your ministry.');
    expect(block.settings?.step1FieldsJson).toContain('"contactFirstName"');
    expect(block.settings?.step2FieldsJson).toContain('"organizationName"');
    expect(String(block.settings?.step1NextLabel || '')).toBe('Next');
    expect(String(block.settings?.step2BackLabel || '')).toBe('Back');
    expect(String(block.settings?.step2NextLabel || '')).toBe('Next');
  });
});
