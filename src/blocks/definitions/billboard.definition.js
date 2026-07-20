import billboardHudIcon from '../../assets/admin-block-icons/billboard.svg';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';
import { buildDynamicBillboardFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';
import { validateLegacyActionFieldGroups } from '../../lib/linkValue';

const BILLBOARD_TITLE_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const BILLBOARD_BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand Gradient', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
  { value: 'blue', label: 'Blue Gradient', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

const BILLBOARD_TEXT_TONE_OPTIONS = [
  { value: 'dark', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5c5b5d 100%)' },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'blue', label: 'Blue', swatch: getTokenSwatch('blue') },
];

const BILLBOARD_BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
];

const BILLBOARD_BUTTON_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'sandstone', label: 'Sandstone', swatch: '#c4beb6' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

function validateBillboardAction(block) {
  const settings = block?.settings || {};
  return validateLegacyActionFieldGroups(settings, [
    {
      labelKeys: ['buttonLabel'],
      hrefKeys: ['buttonUrl'],
      toKeys: ['buttonPageRef'],
      openInNewWindowKeys: ['buttonOpenInNewWindow'],
    },
    {
      labelKeys: ['button2Label'],
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
      defineEditorField({ id: 'title', label: 'Billboard title', type: 'textarea', rows: 2 }),
      defineEditorField({
        id: 'titleClassName',
        label: 'Billboard title color',
        type: 'swatch',
        options: BILLBOARD_TITLE_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'titleHighlightsJson',
        label: 'Billboard title highlights',
        type: 'highlight_list',
        options: BILLBOARD_TITLE_TONE_OPTIONS.filter((option) => option.value),
      }),
      defineEditorField({ id: 'subtitle', label: 'Subtitle', type: 'text' }),
      defineEditorField({
        id: 'subtitleClassName',
        label: 'Subtitle color',
        type: 'swatch',
        options: BILLBOARD_TITLE_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'subtitleDisplay',
        label: 'Subtitle style',
        type: 'select',
        options: [
          { value: 'supporting', label: 'Supporting copy' },
          { value: 'headline', label: 'Headline' },
        ],
      }),
      defineEditorField({ id: 'subtitleSizeRem', label: 'Subtitle size (rem)', type: 'number', min: 1, max: 8, step: 0.05 }),
      defineEditorField({
        id: 'titleFontFamily',
        label: 'Billboard title font',
        type: 'select',
        options: [
          { value: 'heading', label: 'Avenir' },
          { value: 'helv', label: 'Helvetica' },
        ],
      }),
      defineEditorField({
        id: 'titleFontWeight',
        label: 'Billboard title font weight',
        type: 'number',
        min: 400,
        max: 900,
        step: 100,
      }),
      defineEditorField({ id: 'titleSizeRem', label: 'Billboard heading size (rem)', type: 'number', min: 2.4, max: 8, step: 0.05 }),
      defineEditorField({ id: 'titleLetterSpacingEm', label: 'Billboard heading letter spacing (em)', type: 'number', min: -0.12, max: 0.04, step: 0.005 }),
      defineEditorField({ id: 'bodyHtml', label: 'Billboard body HTML', type: 'html' }),
      defineEditorField({ id: 'body', label: 'Fallback body text', type: 'textarea', rows: 3 }),
      defineEditorField({ id: 'fineprint', label: 'Fineprint', type: 'textarea', rows: 4 }),
      defineEditorField({ id: 'fineprintDisclosureId', label: 'Fineprint disclosure ID', type: 'text' }),
      defineEditorField({
        id: 'bgTone',
        label: 'Billboard background',
        type: 'swatch',
        options: BILLBOARD_BACKGROUND_OPTIONS,
      }),
      defineEditorField({
        id: 'textTone',
        label: 'Billboard text color',
        type: 'swatch',
        options: BILLBOARD_TEXT_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'justify',
        label: 'Billboard justify',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      }),
      defineEditorField({ id: 'lineSpacing', label: 'Billboard title line spacing', type: 'number' }),
      defineEditorField({ id: 'contentMaxWidthPx', label: 'Billboard content max width (px)', type: 'number', min: 560, max: 1440, step: 10 }),
      defineEditorField({ id: 'headlineMaxWidthPx', label: 'Headline max width (px)', type: 'number', min: 560, max: 1440, step: 10 }),
    ],
  },
  {
    id: 'actions',
    title: 'Actions',
    surfaces: ['hud', 'admin'],
    fields: [
      ...defineTransitionalActionFields({
        labelId: 'buttonLabel',
        labelLabel: 'Button 1 label',
        hrefId: 'buttonUrl',
        hrefLabel: 'Button 1 URL',
        toId: 'buttonPageRef',
        toLabel: 'Button 1 internal page path',
        openInNewWindowId: 'buttonOpenInNewWindow',
        openInNewWindowLabel: 'Button 1 opens in new window',
        styleId: 'buttonStyle',
        styleLabel: 'Button 1 style',
        styleOptions: BILLBOARD_BUTTON_STYLE_OPTIONS,
        toneId: 'buttonTone',
        toneLabel: 'Button 1 color',
        toneOptions: BILLBOARD_BUTTON_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'buttonAction',
        label: 'Button 1 action type',
        type: 'select',
        options: [
          { value: '', label: 'Link action' },
          { value: 'open_cta_form', label: 'Reveal CTA form' },
        ],
      }),
      defineEditorField({ id: 'buttonTargetAnchorId', label: 'Button 1 target anchor ID', type: 'text' }),
      defineEditorField({ id: 'buttonTargetBlockId', label: 'Button 1 target block ID', type: 'text' }),
      ...defineTransitionalActionFields({
        labelId: 'button2Label',
        labelLabel: 'Button 2 label',
        hrefId: 'button2Url',
        hrefLabel: 'Button 2 URL',
        toId: 'button2PageRef',
        toLabel: 'Button 2 internal page path',
        openInNewWindowId: 'button2OpenInNewWindow',
        openInNewWindowLabel: 'Button 2 opens in new window',
        styleId: 'button2Style',
        styleLabel: 'Button 2 style',
        styleOptions: BILLBOARD_BUTTON_STYLE_OPTIONS,
        toneId: 'button2Tone',
        toneLabel: 'Button 2 color',
        toneOptions: BILLBOARD_BUTTON_TONE_OPTIONS,
      }),
    ],
  },
  {
    id: 'placement',
    title: 'Placement',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'anchorId', label: 'Anchor ID', type: 'text' }),
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
      defineEditorField({ id: 'copyClassName', label: 'Copy class name', type: 'text' }),
    ],
  },
];

export const billboardBlockDefinition = createBlockDefinition({
  kind: 'billboard',
  label: 'Billboard',
  icon: billboardHudIcon,
  editorType: 'billboard',
  allowedVariants: ['default', 'feature'],
  supportedModes: ['dynamic'],
  defaults: {
    bgTone: 'blue',
    textTone: 'white',
    justify: 'center',
    lineSpacing: 1,
    titleFontFamily: 'helv',
    titleFontWeight: 700,
    titleSizeRem: 3.4,
    titleLetterSpacingEm: -0.038,
    subtitleDisplay: 'supporting',
    anchorId: '',
    sectionClassName: '',
    copyClassName: '',
    fineprint: '',
    fineprintDisclosureId: '',
    buttonAction: '',
    buttonTargetAnchorId: '',
    buttonTargetBlockId: '',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicBillboardFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'actions', 'placement'],
    adminSectionIds: ['content', 'actions', 'placement'],
  },
  validators: [
    (block) => Boolean(buildDynamicBillboardFromBlock(block)),
    validateBillboardAction,
  ],
  styleScope: {
    rootClassName: 'dynamic-billboard',
    cssNamespace: 'billboard',
  },
});
