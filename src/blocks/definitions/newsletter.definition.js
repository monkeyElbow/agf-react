import newsletterHudIcon from '../../assets/admin-block-icons/newsletter.svg';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';
import { buildDynamicNewsletterFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';

const NEWSLETTER_HEADING_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const NEWSLETTER_BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand Gradient', swatch: getTokenSwatch('sand') },
  { value: 'blue', label: 'Blue Gradient', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

const NEWSLETTER_TEXT_TONE_OPTIONS = [
  { value: 'dark', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5c5b5d 100%)' },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'blue', label: 'Blue', swatch: getTokenSwatch('blue') },
];

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Newsletter heading', type: 'textarea', rows: 2 }),
      defineEditorField({
        id: 'titleClassName',
        label: 'Newsletter heading color',
        type: 'swatch',
        options: NEWSLETTER_HEADING_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'titleHighlightsJson',
        label: 'Newsletter heading highlights',
        type: 'highlight_list',
        options: NEWSLETTER_HEADING_TONE_OPTIONS.filter((option) => option.value),
      }),
      defineEditorField({ id: 'bodyHtml', label: 'Newsletter body HTML', type: 'html' }),
      defineEditorField({
        id: 'bgTone',
        label: 'Newsletter background',
        type: 'swatch',
        options: NEWSLETTER_BACKGROUND_OPTIONS,
      }),
      defineEditorField({
        id: 'textTone',
        label: 'Newsletter text color',
        type: 'swatch',
        options: NEWSLETTER_TEXT_TONE_OPTIONS,
      }),
    ],
  },
  {
    id: 'integration',
    title: 'Integration',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'formId', label: 'Constant Contact form ID', type: 'text' }),
      defineEditorField({ id: 'accountId', label: 'Constant Contact account ID (optional)', type: 'text' }),
      defineEditorField({ id: 'sourceId', label: 'Constant Contact source ID (optional)', type: 'text' }),
    ],
  },
];

export const newsletterBlockDefinition = createBlockDefinition({
  kind: 'newsletter',
  label: 'Newsletter',
  icon: newsletterHudIcon,
  editorType: 'newsletter',
  singleton: true,
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    bgTone: 'grey',
    textTone: 'white',
    formId: '',
    accountId: '',
    sourceId: '',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicNewsletterFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'integration'],
    adminSectionIds: ['content', 'integration'],
  },
  validators: [
    (block) => Boolean(buildDynamicNewsletterFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'native-dynamic-newsletter',
    cssNamespace: 'newsletter',
  },
});
