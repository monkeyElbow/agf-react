import ctaFormHudIcon from '../../assets/admin-block-icons/cta-form.svg';
import { buildDynamicCtaFormFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';
import { defineEditorField } from '../foundation/editorDescriptors';
import {
  CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS,
  CTA_FORM_MAX_FIELDS,
  createFormBlockDefinitionScaffold,
} from '../foundation/forms';

const CTA_FORM_HEADING_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const CTA_FORM_HIGHLIGHT_TONE_OPTIONS = CTA_FORM_HEADING_TONE_OPTIONS.filter((option) => option.value);

const CTA_FORM_BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand Gradient', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
  { value: 'blue', label: 'Blue Gradient', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'CTA form heading', type: 'textarea', rows: 2 }),
      defineEditorField({
        id: 'titleClassName',
        label: 'CTA form heading color',
        type: 'swatch',
        options: CTA_FORM_HEADING_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'titleHighlightsJson',
        label: 'CTA form heading highlights',
        type: 'highlight_list',
        options: CTA_FORM_HIGHLIGHT_TONE_OPTIONS,
      }),
      defineEditorField({ id: 'bodyHtml', label: 'Lead copy HTML', type: 'html' }),
      defineEditorField({ id: 'fieldsJson', label: 'CTA field definitions JSON', type: 'textarea', rows: 8 }),
      defineEditorField({ id: 'includeContactPreference', label: 'Ask for contact preference', type: 'boolean' }),
      defineEditorField({
        id: 'bgTone',
        label: 'CTA background',
        type: 'swatch',
        options: CTA_FORM_BACKGROUND_OPTIONS,
      }),
    ],
  },
  {
    id: 'integration',
    title: 'Integration',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'salesforceUrl', label: 'Salesforce endpoint URL (placeholder)', type: 'text' }),
      defineEditorField({ id: 'submitLabel', label: 'Submit button label', type: 'text' }),
      defineEditorField({ id: 'successMessage', label: 'Success message', type: 'textarea', rows: 2 }),
    ],
  },
  {
    id: 'placement',
    title: 'Placement',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'anchorId', label: 'Anchor ID', type: 'text' }),
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
    ],
  },
  {
    id: 'fields',
    title: 'Fields',
    surfaces: ['hud', 'admin'],
    fields: [1, 2, 3, 4, 5].flatMap((slot) => ([
      defineEditorField({ id: `field${slot}Enabled`, label: `Field ${slot} enabled`, type: 'boolean' }),
      defineEditorField({
        id: `field${slot}Type`,
        label: `Field ${slot} type`,
        type: 'select',
        options: CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS,
      }),
      defineEditorField({ id: `field${slot}Label`, label: `Field ${slot} label`, type: 'text' }),
      defineEditorField({ id: `field${slot}Placeholder`, label: `Field ${slot} placeholder`, type: 'text' }),
      defineEditorField({
        id: `field${slot}Options`,
        label: `Field ${slot} dropdown choices`,
        type: 'textarea',
        rows: 4,
        placeholder: 'Option label\nvalue|Custom label',
      }),
      defineEditorField({ id: `field${slot}Required`, label: `Field ${slot} required`, type: 'boolean' }),
    ])),
  },
];

export const ctaFormBlockDefinition = createFormBlockDefinitionScaffold({
  kind: 'cta_form',
  label: 'CTA Form',
  icon: ctaFormHudIcon,
  sections,
  defaults: {
    title: '',
    titleClassName: '',
    titleHighlightsJson: '',
    bodyHtml: '',
    subtitle: '',
    fieldsJson: '',
    includeContactPreference: false,
    bgTone: 'white',
    salesforceUrl: '',
    submitLabel: 'Follow up with me',
    successMessage: 'Thanks. We will reach out soon.',
    anchorId: '',
    sectionClassName: '',
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
    field3Placeholder: '(555) 555-5555',
    field3Options: '',
    field3Required: false,
    field4Enabled: true,
    field4Type: 'textarea',
    field4Label: 'Message',
    field4Placeholder: 'What would you like to discuss?',
    field4Options: '',
    field4Required: false,
    field5Enabled: false,
    field5Type: 'text',
    field5Label: '',
    field5Placeholder: '',
    field5Options: '',
    field5Required: false,
  },
  renderer: {
    buildRuntime: buildDynamicCtaFormFromBlock,
  },
  validators: [
    (block) => {
      const runtime = buildDynamicCtaFormFromBlock(block);
      return Boolean(runtime) && (Array.isArray(runtime?.fields) ? runtime.fields.length : 0) <= CTA_FORM_MAX_FIELDS + 1;
    },
  ],
  styleScope: {
    rootClassName: 'native-dynamic-cta',
    cssNamespace: 'cta-form',
  },
});
