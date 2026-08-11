import introHudIcon from '../../assets/admin-block-icons/intro.svg';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';
import { buildDynamicIntroFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';
import { validateLinkFieldGroups } from '../../lib/linkValue';

const SHARED_HEADING_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const INTRO_BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand Gradient', swatch: getTokenSwatch('sand') },
  { value: 'blue', label: 'Blue Gradient', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

const INTRO_TEXT_TONE_OPTIONS = [
  { value: 'dark', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5c5b5d 100%)' },
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'blue', label: 'Blue', swatch: getTokenSwatch('blue') },
];

const INTRO_EXTRA_LINE_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
  { value: 'blue', label: 'Blue', swatch: '#00adbb' },
  { value: 'muted', label: 'Muted', swatch: '#8c8b8e' },
];

const INTRO_BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
];

const INTRO_BUTTON_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'super-grey', label: 'Super Grey', swatch: getTokenSwatch('super-grey') },
  { value: 'mango', label: 'Mango', swatch: getTokenSwatch('mango') },
  { value: 'melon', label: 'Melon', swatch: getTokenSwatch('melon') },
  { value: 'sandstone', label: 'Sandstone', swatch: getTokenSwatch('sandstone') },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

function validateIntroLinks(block) {
  const settings = block?.settings || {};
  return validateLinkFieldGroups(settings, [
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
      defineEditorField({ id: 'heading', label: 'Heading text', type: 'textarea', rows: 2 }),
      defineEditorField({
        id: 'headingClassName',
        label: 'Heading color',
        type: 'swatch',
        options: SHARED_HEADING_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'headingHighlightsJson',
        label: 'Heading highlights',
        type: 'highlight_list',
        options: SHARED_HEADING_TONE_OPTIONS.filter((option) => option.value),
      }),
      defineEditorField({ id: 'bodyHtml', label: 'Body HTML', type: 'html' }),
      defineEditorField({ id: 'bodyColorClassName', label: 'Body color', type: 'swatch', options: SHARED_HEADING_TONE_OPTIONS }),
      defineEditorField({ id: 'body', label: 'Body text', type: 'textarea', rows: 4 }),
      defineEditorField({
        id: 'justify',
        label: 'Intro justify',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      }),
      defineEditorField({ id: 'lineSpacing', label: 'Intro heading line spacing', type: 'number' }),
      defineEditorField({ id: 'extraLine', label: 'Accent line (optional)', type: 'text' }),
      defineEditorField({
        id: 'extraLineTone',
        label: 'Accent line color',
        type: 'swatch',
        options: INTRO_EXTRA_LINE_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'bgTone',
        label: 'Intro background',
        type: 'swatch',
        layout: 'half',
        options: INTRO_BACKGROUND_OPTIONS,
      }),
      defineEditorField({
        id: 'textTone',
        label: 'Text color',
        type: 'swatch',
        layout: 'half',
        options: INTRO_TEXT_TONE_OPTIONS,
      }),
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
    ],
  },
  {
    id: 'actions',
    title: 'Actions',
    surfaces: ['hud', 'admin'],
    fields: [
      ...defineTransitionalActionFields({
        labelId: 'button1Label',
        labelLabel: 'Button 1 label',
        hrefId: 'button1Url',
        hrefLabel: 'Button 1 URL',
        toId: 'button1PageRef',
        toLabel: 'Button 1 internal page path',
        openInNewWindowId: 'button1OpenInNewWindow',
        openInNewWindowLabel: 'Button 1 opens in new window',
        styleId: 'button1Style',
        styleLabel: 'Button 1 style',
        styleOptions: INTRO_BUTTON_STYLE_OPTIONS,
        toneId: 'button1Tone',
        toneLabel: 'Button 1 color',
        toneOptions: INTRO_BUTTON_TONE_OPTIONS,
      }),
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
        styleOptions: INTRO_BUTTON_STYLE_OPTIONS,
        toneId: 'button2Tone',
        toneLabel: 'Button 2 color',
        toneOptions: INTRO_BUTTON_TONE_OPTIONS,
      }),
    ],
  },
];

export const introBlockDefinition = createBlockDefinition({
  kind: 'intro',
  label: 'Intro',
  icon: introHudIcon,
  editorType: 'intro',
  singleton: true,
  allowedVariants: ['default', 'split'],
  supportedModes: ['dynamic'],
  defaults: {
    bodyColorClassName: '',
    justify: 'center',
    lineSpacing: 1.04,
    bgTone: 'sand',
    textTone: 'dark',
    button1Style: 'blue',
    button1Tone: 'atlantean',
    button2Style: 'blue',
    button2Tone: 'atlantean',
    sectionClassName: '',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicIntroFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'actions'],
    adminSectionIds: ['content', 'actions'],
  },
  validators: [
    (block) => Boolean(buildDynamicIntroFromBlock(block)),
    validateIntroLinks,
  ],
  styleScope: {
    rootClassName: 'service-native-intro',
    cssNamespace: 'intro',
  },
});
