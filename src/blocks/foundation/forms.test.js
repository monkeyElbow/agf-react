import { describe, expect, it } from 'vitest';
import { getBlockHudDefinition } from '../../lib/blockHudRegistry';
import { getEditorParityContract } from '../../lib/editorParityContract';
import {
  buildCtaFormSettingsPatch,
  CANONICAL_FORM_BLOCK_KINDS,
  createCtaContactPreferenceField,
  createFormBlockDefinitionScaffold,
  extractCtaFormFields,
  createInitialFormValues,
  formatFormPhoneInput,
  getCanonicalFormBlockBoundary,
  getSharedFormConfigFieldIds,
  isFieldAllowedForFormBlock,
  normalizeFormSubmissionConfig,
  parseCtaFormFieldsJson,
  serializeCtaFormFields,
  validateRequiredFormFields,
} from './forms';

describe('canonical form foundation', () => {
  it('keeps CTA and request forms as distinct canonical block kinds', () => {
    expect(CANONICAL_FORM_BLOCK_KINDS).toEqual(['cta_form', 'request_form']);

    const ctaBoundary = getCanonicalFormBlockBoundary('cta_form');
    const requestBoundary = getCanonicalFormBlockBoundary('request_form');

    expect(ctaBoundary?.kind).toBe('cta_form');
    expect(requestBoundary?.kind).toBe('request_form');
    expect(ctaBoundary?.runtimeIdentity).toBe('cta_form');
    expect(requestBoundary?.runtimeIdentity).toBe('request_form');
    expect(ctaBoundary?.editorOwner).toBe('CtaFormBlockEditor');
    expect(requestBoundary?.editorOwner).toBe('RequestFormBlockEditor');
    expect(ctaBoundary?.sharedFieldIds).toEqual(getSharedFormConfigFieldIds());
    expect(requestBoundary?.sharedFieldIds).toEqual(getSharedFormConfigFieldIds());
    expect(ctaBoundary?.specificFieldIds).not.toEqual(requestBoundary?.specificFieldIds);
  });

  it('keeps shared form primitives from collapsing block-specific field boundaries', () => {
    expect(isFieldAllowedForFormBlock('cta_form', 'field1Type')).toBe(true);
    expect(isFieldAllowedForFormBlock('cta_form', 'step1FieldsJson')).toBe(false);
    expect(isFieldAllowedForFormBlock('request_form', 'step1FieldsJson')).toBe(true);
    expect(isFieldAllowedForFormBlock('request_form', 'field1Type')).toBe(false);
  });

  it('keeps HUD/editor metadata distinct for CTA and request forms', () => {
    expect(getBlockHudDefinition({ id: 'cta_form', kind: 'cta_form' }).editorType).toBe('cta_form');
    expect(getBlockHudDefinition({ id: 'request_form', kind: 'request_form' }).editorType).toBe('request_form');
    expect(getEditorParityContract('cta_form')?.label).toBe('CTA Form');
    expect(getEditorParityContract('request_form')?.label).toBe('Request Form');
  });

  it('provides shared lower-level form primitives without changing block identity', () => {
    const values = createInitialFormValues([
      { id: 'name', type: 'text' },
      { id: 'choices', type: 'multiselect' },
      { id: 'boxes', type: 'checkbox-group' },
    ], {
      multiValueTypes: ['multiselect', 'checkbox-group'],
    });

    expect(values).toEqual({
      name: '',
      choices: [],
      boxes: [],
    });

    expect(createInitialFormValues([
      { id: 'consent', type: 'checkbox' },
    ])).toEqual({
      consent: false,
    });

    expect(validateRequiredFormFields([
      { id: 'name', label: 'Name', type: 'text', required: true },
      { id: 'choices', label: 'Choices', type: 'multiselect', required: true },
    ], {
      name: 'Jordan',
      choices: [],
    }, {
      multiValueTypes: ['multiselect'],
      resolveMessage: (field) => `Missing ${field.label}`,
    })).toBe('Missing Choices');

    expect(normalizeFormSubmissionConfig({}, {
      submitLabel: 'Follow-up with me',
      successMessage: 'Thanks. We will reach out soon.',
    })).toEqual({
      submitLabel: 'Follow-up with me',
      successMessage: 'Thanks. We will reach out soon.',
      salesforceUrl: '',
    });

    expect(formatFormPhoneInput('5556211787')).toBe('(555) 621-1787');
    expect(validateRequiredFormFields([
      { id: 'consent', label: 'Consent', type: 'checkbox', required: true },
    ], {
      consent: false,
    }, {
      booleanTypes: ['checkbox'],
      resolveMessage: (field) => `Missing ${field.label}`,
    })).toBe('Missing Consent');
  });

  it('supports structured CTA field definitions with legacy slot syncing', () => {
    const fields = parseCtaFormFieldsJson(JSON.stringify([
      {
        id: 'full_name',
        label: 'Full name',
        type: 'text',
        required: true,
      },
      {
        id: 'contact_reason',
        label: 'What do you need help with?',
        type: 'select',
        options: [
          { value: 'planning', label: 'Planning' },
          { value: 'giving', label: 'Giving' },
        ],
      },
    ]));

    expect(fields).toEqual([
      expect.objectContaining({
        id: 'full_name',
        label: 'Full name',
        type: 'text',
        required: true,
      }),
      expect.objectContaining({
        id: 'contact_reason',
        type: 'select',
        optionsText: 'planning|Planning\ngiving|Giving',
      }),
    ]);

    expect(serializeCtaFormFields(fields)).toContain('"id":"full_name"');

    expect(extractCtaFormFields({
      fieldsJson: serializeCtaFormFields(fields),
    })).toEqual(fields);

    expect(buildCtaFormSettingsPatch({ fields, includeContactPreference: true })).toMatchObject({
      includeContactPreference: true,
      field1Enabled: true,
      field1Label: 'Full name',
      field2Type: 'select',
      field2Options: 'planning|Planning\ngiving|Giving',
    });

    expect(createCtaContactPreferenceField()).toMatchObject({
      id: 'contact_preference',
      label: 'Preferred contact method',
      type: 'select',
    });
  });

  it('provides a future definition scaffold that preserves form block identity', () => {
    const ctaScaffold = createFormBlockDefinitionScaffold({
      kind: 'cta_form',
      label: 'CTA Form',
      sections: [{ id: 'content', fields: [{ id: 'title' }] }],
      renderer: { buildRuntime: () => ({}) },
      styleScope: { rootClassName: 'native-dynamic-cta' },
    });
    const requestScaffold = createFormBlockDefinitionScaffold({
      kind: 'request_form',
      label: 'Request Form',
      sections: [{ id: 'content', fields: [{ id: 'title' }] }],
      renderer: { buildRuntime: () => ({}) },
      styleScope: { rootClassName: 'native-dynamic-request' },
    });

    expect(ctaScaffold.kind).toBe('cta_form');
    expect(ctaScaffold.editorType).toBe('cta_form');
    expect(ctaScaffold.formBoundary.kind).toBe('cta_form');
    expect(requestScaffold.kind).toBe('request_form');
    expect(requestScaffold.editorType).toBe('request_form');
    expect(requestScaffold.formBoundary.kind).toBe('request_form');
  });
});
