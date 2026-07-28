import billboardHudIcon from '../../assets/admin-block-icons/billboard.svg';
import { buildDynamicCtaBandFromBlock } from '../../lib/dynamicPageBlocks';
import { getCtaBandPresetDefinitions } from '../../lib/ctaBandPresets';
import { getTokenSwatch } from '../../lib/colorSystem';
import { validateActionFieldGroup } from '../../lib/linkValue';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';

const CTA_BAND_BG_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
  { value: 'blue', label: 'Blue', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Grey', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

function validateCtaBandAction(block) {
  const settings = block?.settings || {};
  return validateActionFieldGroup(settings, {
    labelKeys: ['buttonLabel'],
    hrefKeys: ['buttonUrl'],
    toKeys: ['buttonPageRef'],
    openInNewWindowKeys: ['buttonOpenInNewWindow'],
  });
}

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'CTA band title', type: 'text' }),
      defineEditorField({ id: 'body', label: 'CTA band body', type: 'textarea', rows: 3 }),
      defineEditorField({
        id: 'bgTone',
        label: 'CTA band background',
        type: 'swatch',
        compact: true,
        iconOnly: true,
        options: CTA_BAND_BG_OPTIONS,
      }),
    ],
  },
  {
    id: 'action',
    title: 'Action',
    surfaces: ['hud', 'admin'],
    fields: [
      ...defineTransitionalActionFields({
        labelId: 'buttonLabel',
        labelLabel: 'Button label',
        hrefId: 'buttonUrl',
        hrefLabel: 'Button URL / Path',
        toId: 'buttonPageRef',
        toLabel: 'Button internal page path',
        openInNewWindowId: 'buttonOpenInNewWindow',
        openInNewWindowLabel: 'Open button in new window',
      }),
    ],
  },
];

export const ctaBandBlockDefinition = createBlockDefinition({
  kind: 'cta_band',
  label: 'CTA Band',
  icon: billboardHudIcon,
  editorType: 'cta_band',
  presets: getCtaBandPresetDefinitions(),
  allowedVariants: ['default', 'band'],
  supportedModes: ['dynamic'],
  defaults: {
    title: 'Already an investor?',
    body: '',
    bgTone: 'white',
    buttonLabel: 'Log in to manage',
    buttonUrl: 'https://secure.agfinancial.org/',
    buttonPageRef: '',
    buttonOpenInNewWindow: true,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicCtaBandFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'action'],
    adminSectionIds: ['content', 'action'],
  },
  validators: [
    (block) => Boolean(buildDynamicCtaBandFromBlock(block)),
    validateCtaBandAction,
  ],
  styleScope: {
    rootClassName: 'service-native-cta-band',
    cssNamespace: 'cta-band',
  },
});
