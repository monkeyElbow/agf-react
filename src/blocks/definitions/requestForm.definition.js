import requestFormHudIcon from '../../assets/admin-block-icons/request-form.svg';
import { buildDynamicRequestFormFromBlock } from '../../lib/dynamicPageBlocks';
import {
  PANEL_TEXT_TONE_OPTIONS,
  SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT,
  SURFACE_BG_TONE_OPTIONS,
} from '../../lib/colorSystem';
import { defineEditorField } from '../foundation/editorDescriptors';
import {
  REQUEST_FORM_STEP_FIELD_FORMAT_OPTIONS,
  REQUEST_FORM_STEP_FIELD_TYPE_OPTIONS,
  createFormBlockDefinitionScaffold,
} from '../foundation/forms';

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Form heading', type: 'textarea', rows: 2 }),
      defineEditorField({
        id: 'titleClassName',
        label: 'Form heading color',
        type: 'swatch',
        options: SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT,
      }),
      defineEditorField({
        id: 'titleHighlightsJson',
        label: 'Form heading highlights',
        type: 'highlight_list',
        options: SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT.filter((option) => option.value),
      }),
      defineEditorField({ id: 'subtitle', label: 'Lead copy', type: 'textarea', rows: 3 }),
      defineEditorField({ id: 'body', label: 'Body text fallback', type: 'textarea', rows: 3 }),
    ],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({
        id: 'bgTone',
        label: 'Background tone',
        type: 'swatch',
        options: SURFACE_BG_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'textTone',
        label: 'Text color',
        type: 'swatch',
        options: PANEL_TEXT_TONE_OPTIONS,
      }),
      defineEditorField({ id: 'anchorId', label: 'Anchor ID', type: 'text' }),
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
      defineEditorField({ id: 'spaceBeforeRem', label: 'Space before (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'spaceAfterRem', label: 'Space after (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
    ],
  },
  {
    id: 'integration',
    title: 'Integration',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'submitLabel', label: 'Submit button', type: 'text' }),
      defineEditorField({ id: 'successMessage', label: 'Success message', type: 'text' }),
      defineEditorField({ id: 'salesforceUrl', label: 'Salesforce endpoint (optional)', type: 'text' }),
    ],
  },
  {
    id: 'steps',
    title: 'Steps',
    surfaces: ['hud', 'admin'],
    fields: [1, 2, 3, 4, 5].flatMap((step) => ([
      defineEditorField({ id: `step${step}Title`, label: `Step ${step} title`, type: 'text' }),
      defineEditorField({ id: `step${step}Note`, label: `Step ${step} note`, type: 'text' }),
      defineEditorField({ id: `step${step}Alert`, label: `Step ${step} alert`, type: 'text' }),
      defineEditorField({
        id: `step${step}FieldsJson`,
        label: `Step ${step} fields (JSON array)`,
        type: 'textarea',
        rows: 4,
      }),
    ])),
  },
];

export const requestFormBlockDefinition = createFormBlockDefinitionScaffold({
  kind: 'request_form',
  label: 'Request Form',
  icon: requestFormHudIcon,
  sections,
  defaults: {
    title: 'Request a quote',
    titleClassName: '',
    titleHighlightsJson: '',
    subtitle: 'Tell us what you need and we will respond quickly.',
    body: '',
    bgTone: 'sand',
    textTone: 'dark',
    anchorId: '',
    sectionClassName: '',
    spaceBeforeRem: 1.6,
    spaceAfterRem: 1.6,
    submitLabel: 'Submit request',
    successMessage: 'Thanks. We received your request.',
    salesforceUrl: '',
    step1Title: 'Contact info',
    step1Note: '',
    step1Alert: '',
    step2Title: 'Organization details',
    step2Note: '',
    step2Alert: '',
    step3Title: 'Wrap up',
    step3Note: '',
    step3Alert: '',
    step4Title: '',
    step4Note: '',
    step4Alert: '',
    step5Title: '',
    step5Note: '',
    step5Alert: '',
    step1FieldsJson: JSON.stringify([
      { id: 'contactFirstName', label: 'First Name', type: 'text', required: true },
      { id: 'contactLastName', label: 'Last Name', type: 'text', required: true },
      { id: 'contactEmail', label: 'Email', type: 'email', required: true },
      { id: 'contactPhone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555' },
    ]),
    step2FieldsJson: JSON.stringify([
      { id: 'organization', label: 'Organization', type: 'text', required: true },
      { id: 'city', label: 'City', type: 'text', required: true },
      { id: 'state', label: 'State', type: 'text', required: true },
      { id: 'zip', label: 'Zip', type: 'text', required: true, placeholder: '5-digit zip' },
    ]),
    step3FieldsJson: JSON.stringify([
      { id: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
    ]),
    step4FieldsJson: '[]',
    step5FieldsJson: '[]',
  },
  renderer: {
    buildRuntime: buildDynamicRequestFormFromBlock,
  },
  validators: [
    (block) => Boolean(buildDynamicRequestFormFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'native-dynamic-request',
    cssNamespace: 'request-form',
  },
});

export {
  REQUEST_FORM_STEP_FIELD_FORMAT_OPTIONS,
  REQUEST_FORM_STEP_FIELD_TYPE_OPTIONS,
};
