import heroHudIcon from '../../assets/admin-block-icons/hero.svg';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';
import { buildDynamicHeroFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';
import {
  DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
  DEFAULT_HERO_TITLE_SIZE_REM,
} from '../../lib/heroTitleSize';
import { validateLegacyLinkFieldGroups } from '../../lib/linkValue';

const HERO_LINE_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-sandstone', label: 'Sandstone', swatch: 'linear-gradient(145deg, #c4beb6 0%, #b1aaa2 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const HERO_BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
];

const HERO_BUTTON_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'sandstone', label: 'Sandstone', swatch: '#c4beb6' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

const HERO_BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand Gradient', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
  { value: 'blue', label: 'Blue Gradient', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

function validateHeroLinks(block) {
  const settings = block?.settings || {};
  return validateLegacyLinkFieldGroups(settings, [
    {
      hrefKeys: ['button1Url'],
      toKeys: ['button1PageRef'],
      openInNewWindowKeys: ['button1OpenInNewWindow'],
    },
    {
      hrefKeys: ['button2Url'],
      toKeys: ['button2PageRef'],
      openInNewWindowKeys: ['button2OpenInNewWindow'],
    },
  ]);
}

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({
        id: 'animationPreset',
        label: 'Hero animation preset',
        type: 'select',
        options: [
          { value: 'default', label: 'Default' },
          { value: 'none', label: 'None' },
          { value: 'loans-unblur', label: 'Unblur + slide' },
        ],
      }),
      defineEditorField({
        id: 'justify',
        label: 'Hero justify',
        type: 'select',
        options: [
          { value: 'center', label: 'Center' },
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
        ],
      }),
      defineEditorField({
        id: 'actionJustify',
        label: 'Button row justify',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      }),
      defineEditorField({
        id: 'bgTone',
        label: 'Hero background',
        type: 'swatch',
        options: HERO_BACKGROUND_OPTIONS,
      }),
      defineEditorField({
        id: 'heightMode',
        label: 'Hero height mode',
        type: 'select',
        options: [
          { value: 'default', label: 'Default' },
          { value: 'custom', label: 'Custom (% viewport)' },
        ],
      }),
      defineEditorField({ id: 'heightSvh', label: 'Hero height (% of viewport)', type: 'number' }),
      defineEditorField({ id: 'titleSizeRem', label: 'Hero title size (rem)', type: 'number' }),
      defineEditorField({ id: 'titleLetterSpacingEm', label: 'Hero title tracking (em)', type: 'number' }),
      defineEditorField({ id: 'lineHeight', label: 'Hero text line height', type: 'number' }),
      defineEditorField({ id: 'lineGap', label: 'Gap between hero lines', type: 'number' }),
      ...[1, 2, 3].flatMap((lineNumber) => ([
        defineEditorField({ id: `line${lineNumber}Text`, label: `Line ${lineNumber} text`, type: 'text' }),
        defineEditorField({
          id: `line${lineNumber}ClassName`,
          label: `Line ${lineNumber} full-line color (optional)`,
          type: 'swatch',
          options: HERO_LINE_TONE_OPTIONS,
        }),
        defineEditorField({
          id: `line${lineNumber}HighlightsJson`,
          label: `Line ${lineNumber} highlighted phrases`,
          type: 'highlight_list',
          options: HERO_LINE_TONE_OPTIONS.filter((option) => option.value),
        }),
      ])),
    ],
  },
  {
    id: 'actions',
    title: 'Actions',
    surfaces: ['hud', 'admin'],
    fields: [
      ...[1, 2].flatMap((buttonNumber) => defineTransitionalActionFields({
        labelId: `button${buttonNumber}Label`,
        labelLabel: `Button ${buttonNumber} label`,
        hrefId: `button${buttonNumber}Url`,
        hrefLabel: `Button ${buttonNumber} URL`,
        toId: `button${buttonNumber}PageRef`,
        toLabel: `Button ${buttonNumber} internal page path`,
        openInNewWindowId: `button${buttonNumber}OpenInNewWindow`,
        openInNewWindowLabel: `Button ${buttonNumber} opens in new window`,
        styleId: `button${buttonNumber}Style`,
        styleLabel: `Button ${buttonNumber} style`,
        styleOptions: HERO_BUTTON_STYLE_OPTIONS,
        toneId: `button${buttonNumber}Tone`,
        toneLabel: `Button ${buttonNumber} color`,
        toneOptions: HERO_BUTTON_TONE_OPTIONS,
      })),
    ],
  },
];

export const heroBlockDefinition = createBlockDefinition({
  kind: 'hero',
  label: 'Hero',
  icon: heroHudIcon,
  editorType: 'hero',
  singleton: true,
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    animationPreset: 'default',
    bgTone: 'sand',
    justify: 'center',
    actionJustify: 'center',
    heightMode: 'default',
    titleSizeRem: DEFAULT_HERO_TITLE_SIZE_REM,
    titleLetterSpacingEm: DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
    lineHeight: 0.9,
    lineGap: 0,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicHeroFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'actions'],
    adminSectionIds: ['content', 'actions'],
  },
  validators: [
    (block) => Array.isArray(buildDynamicHeroFromBlock(block)?.lines) && buildDynamicHeroFromBlock(block).lines.length > 0,
    validateHeroLinks,
  ],
  styleScope: {
    rootClassName: 'service-native-hero',
    cssNamespace: 'hero',
  },
});
