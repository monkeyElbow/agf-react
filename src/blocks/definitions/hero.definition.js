import heroHudIcon from '../../assets/admin-block-icons/hero.svg';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';
import { buildDynamicHeroFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';
import {
  DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
  DEFAULT_HERO_TITLE_SIZE_REM,
} from '../../lib/heroTitleSize';
import { validateActionFieldGroup } from '../../lib/linkValue';

const HERO_LINE_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-sandstone', label: 'Sandstone', swatch: getTokenSwatch('sandstone') },
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
  { value: 'sandstone', label: 'Sandstone', swatch: getTokenSwatch('sandstone') },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

const HERO_BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand Gradient', swatch: getTokenSwatch('sand') },
  { value: 'blue', label: 'Blue Gradient', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

const HERO_ACTION_TYPE_OPTIONS = [
  { value: '', label: 'Link action' },
  { value: 'open_cta_form', label: 'Reveal CTA form' },
];

function validateHeroAction(settings, buttonNumber) {
  const label = String(settings?.[`button${buttonNumber}Label`] || '').trim();
  const explicitAction = String(settings?.[`button${buttonNumber}Action`] || '').trim();
  const targetAnchorId = String(settings?.[`button${buttonNumber}TargetAnchorId`] || '').trim();
  const targetBlockId = String(settings?.[`button${buttonNumber}TargetBlockId`] || '').trim();
  const hasExplicitTarget = Boolean(targetAnchorId || targetBlockId);

  if (explicitAction || hasExplicitTarget) {
    return Boolean(label && explicitAction && hasExplicitTarget);
  }

  return validateActionFieldGroup(settings, {
    labelKeys: [`button${buttonNumber}Label`],
    hrefKeys: [`button${buttonNumber}Url`],
    toKeys: [`button${buttonNumber}PageRef`],
    openInNewWindowKeys: [`button${buttonNumber}OpenInNewWindow`],
  });
}

function validateHeroLinks(block) {
  const settings = block?.settings || {};
  return [1, 2].every((buttonNumber) => validateHeroAction(settings, buttonNumber));
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
      ...[1, 2].flatMap((buttonNumber) => ([
        ...defineTransitionalActionFields({
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
        }),
        defineEditorField({
          id: `button${buttonNumber}Action`,
          label: `Button ${buttonNumber} action type`,
          type: 'select',
          options: HERO_ACTION_TYPE_OPTIONS,
        }),
        defineEditorField({
          id: `button${buttonNumber}TargetAnchorId`,
          label: `Button ${buttonNumber} target anchor ID`,
          type: 'text',
        }),
        defineEditorField({
          id: `button${buttonNumber}TargetBlockId`,
          label: `Button ${buttonNumber} target block ID`,
          type: 'text',
        }),
      ])),
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
