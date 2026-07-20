import photoColumnHudIcon from '../../assets/admin-block-icons/photo-column.svg';
import { buildDynamicPhotoColumnFromBlock } from '../../lib/dynamicPageBlocks';
import { validateLinkFieldGroup } from '../../lib/linkValue';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';

const PHOTO_COLUMN_BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Super Grey' },
  { value: 'outline', label: 'Outline' },
];

const PHOTO_COLUMN_BUTTON_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

function validatePhotoColumnLink(block) {
  const settings = block?.settings || {};
  return validateLinkFieldGroup(settings, {
    hrefKeys: ['buttonUrl'],
    toKeys: ['buttonPageRef'],
  });
}

const sections = [
  {
    id: 'photo',
    title: 'Photo Column',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Photo label', type: 'text' }),
      defineEditorField({ id: 'body', label: 'Photo caption', type: 'textarea', rows: 3 }),
      defineEditorField({ id: 'imageUrl', label: 'Photo URL', type: 'text' }),
      defineEditorField({ id: 'imageAlt', label: 'Photo alt text', type: 'text' }),
      ...defineTransitionalActionFields({
        labelId: 'buttonLabel',
        labelLabel: 'Button label',
        hrefId: 'buttonUrl',
        hrefLabel: 'Button URL / Path',
        toId: 'buttonPageRef',
        toLabel: 'Button internal page path',
        styleId: 'buttonStyle',
        styleLabel: 'Button style',
        styleOptions: PHOTO_COLUMN_BUTTON_STYLE_OPTIONS,
        toneId: 'buttonTone',
        toneLabel: 'Button color',
        toneOptions: PHOTO_COLUMN_BUTTON_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'widthShare',
        label: 'Width share',
        type: 'number',
        min: 0.5,
        max: 2.5,
        step: 0.05,
      }),
    ],
  },
];

export const photoColumnBlockDefinition = createBlockDefinition({
  kind: 'photo_column',
  label: 'Photo Column',
  icon: photoColumnHudIcon,
  editorType: 'photo_column',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    buttonStyle: 'blue',
    buttonTone: 'atlantean',
    widthShare: 1,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicPhotoColumnFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['photo'],
    adminSectionIds: ['photo'],
  },
  validators: [
    (block) => Boolean(buildDynamicPhotoColumnFromBlock(block)),
    validatePhotoColumnLink,
  ],
  styleScope: {
    rootClassName: 'native-dynamic-columns',
    cssNamespace: 'photo-column',
  },
});
