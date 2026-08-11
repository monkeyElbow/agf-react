import gridHudIcon from '../../assets/admin-block-icons/grid.svg';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';
import { buildDynamicGridFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';
import { getCardGridPresetDefinitions } from '../../lib/cardGridPresets';
import { validateLinkFieldGroups } from '../../lib/linkValue';

const GRID_HEADING_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const GRID_BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand Gradient', swatch: getTokenSwatch('sand') },
  { value: 'blue', label: 'Blue Gradient', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

const GRID_CARD_STYLE_OPTIONS = [
  { value: 'card1', label: 'Card 1' },
  { value: 'card2', label: 'Card 2' },
  { value: 'card3', label: 'Card 3' },
  { value: 'card4', label: 'Card 4' },
  { value: 'none', label: 'No card style' },
  { value: 'borderless-shadow', label: 'Borderless with shadow' },
];

const GRID_TEXT_TONE_OPTIONS = [
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

const GRID_CARD_TITLE_TONE_OPTIONS = [
  ...GRID_TEXT_TONE_OPTIONS,
  { value: 'alternating', label: 'Alternating brand colors', swatch: 'linear-gradient(90deg, #00adbb 0 33%, #f6b146 33% 66%, #f48f7a 66%)' },
];

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Grid heading', type: 'textarea', rows: 2 }),
      defineEditorField({
        id: 'titleClassName',
        label: 'Grid heading color',
        type: 'swatch',
        options: GRID_HEADING_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'titleHighlightsJson',
        label: 'Grid heading highlights',
        type: 'highlight_list',
        options: GRID_HEADING_TONE_OPTIONS.filter((option) => option.value),
      }),
      defineEditorField({ id: 'bodyHtml', label: 'Grid intro HTML', type: 'html' }),
      defineEditorField({ id: 'body', label: 'Fallback body text', type: 'textarea', rows: 3 }),
      defineEditorField({
        id: 'bgTone',
        label: 'Grid background',
        type: 'swatch',
        options: GRID_BACKGROUND_OPTIONS,
      }),
      defineEditorField({
        id: 'contentWidth',
        label: 'Content width',
        type: 'select',
        options: [
          { value: 'content', label: 'Content width' },
          { value: 'browser', label: 'Page/browser width' },
        ],
      }),
      defineEditorField({
        id: 'columns',
        label: 'Grid columns',
        type: 'select',
        options: [
          { value: 'two', label: '2 columns' },
          { value: 'three', label: '3 columns' },
          { value: 'four', label: '4 columns' },
        ],
      }),
      defineEditorField({
        id: 'cardStyle',
        label: 'Card style',
        type: 'select',
        options: GRID_CARD_STYLE_OPTIONS,
      }),
      defineEditorField({ id: 'cardPaddingRem', label: 'Card padding (rem)', type: 'number', min: 0.75, max: 3, step: 0.05 }),
      defineEditorField({ id: 'cardTitleSizeRem', label: 'Card title size (rem)', type: 'number', min: 0.9, max: 2, step: 0.05 }),
      defineEditorField({ id: 'cardBodySizeRem', label: 'Card body size (rem)', type: 'number', min: 0.8, max: 1.5, step: 0.05 }),
      defineEditorField({ id: 'cardBodyLineHeight', label: 'Card body line height', type: 'number', min: 1.1, max: 2.1, step: 0.05 }),
      defineEditorField({
        id: 'titleTone',
        label: 'Title color',
        type: 'swatch',
        options: GRID_CARD_TITLE_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'bodyTone',
        label: 'Body color',
        type: 'swatch',
        options: GRID_TEXT_TONE_OPTIONS,
      }),
      defineEditorField({ id: 'subtitle', label: 'Grid subtitle', type: 'textarea', rows: 2 }),
      defineEditorField({ id: 'anchorId', label: 'Anchor ID', type: 'text' }),
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
      defineEditorField({ id: 'fullBleed', label: 'Use full-bleed rail', type: 'boolean' }),
      defineEditorField({ id: 'sand', label: 'Use sand section surface', type: 'boolean' }),
      ...defineTransitionalActionFields({
        labelId: 'buttonLabel',
        labelLabel: 'Section button label',
        hrefId: 'buttonUrl',
        hrefLabel: 'Section button URL',
        toId: 'buttonPageRef',
        toLabel: 'Section internal page path',
        openInNewWindowId: 'buttonOpenInNewWindow',
        openInNewWindowLabel: 'Section button opens in new window',
      }),
      defineEditorField({
        id: 'buttonStyle',
        label: 'Section button style',
        type: 'select',
        options: [
          { value: 'blue', label: 'Blue' },
          { value: 'dark', label: 'Dark' },
          { value: 'outline', label: 'Outline' },
        ],
      }),
      defineEditorField({
        id: 'buttonTone',
        label: 'Section button color',
        type: 'swatch',
        options: GRID_TEXT_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'consultantService',
        label: 'Consultant directory source',
        type: 'select',
        options: [
          { value: '', label: 'Manual cards' },
          { value: 'loans', label: 'Loans consultants' },
          { value: 'retirement', label: 'Retirement consultants' },
        ],
      }),
      defineEditorField({ id: 'locationFilterEnabled', label: 'Enable state filter', type: 'boolean' }),
      defineEditorField({ id: 'locationFilterLabel', label: 'Filter label', type: 'text' }),
      defineEditorField({ id: 'locationFilterAriaLabel', label: 'Filter aria label', type: 'text' }),
      defineEditorField({ id: 'locationFilterPlaceholder', label: 'Filter placeholder', type: 'text' }),
      defineEditorField({ id: 'locationFilterRequireSelection', label: 'Require a state selection', type: 'boolean' }),
      defineEditorField({ id: 'locationFilterFocusMessageCard', label: 'Focus selected consultant card', type: 'boolean' }),
    ],
  },
  {
    id: 'cards',
    title: 'Cards',
    surfaces: ['hud', 'admin'],
    fields: [
      ...[1, 2, 3, 4, 5, 6, 7, 8].flatMap((slot) => ([
        defineEditorField({ id: `card${slot}Title`, label: `Card ${slot} title`, type: 'text' }),
        defineEditorField({ id: `card${slot}TitleClassName`, label: `Card ${slot} title class name`, type: 'text' }),
        defineEditorField({ id: `card${slot}ClassName`, label: `Card ${slot} class name`, type: 'text' }),
        defineEditorField({ id: `card${slot}IconKey`, label: `Card ${slot} icon key`, type: 'text' }),
        defineEditorField({
          id: `card${slot}IconTone`,
          label: `Card ${slot} icon color`,
          type: 'swatch',
          options: GRID_TEXT_TONE_OPTIONS,
        }),
        defineEditorField({ id: `card${slot}PanelTone`, label: `Card ${slot} panel tone`, type: 'text' }),
        defineEditorField({ id: `card${slot}Body`, label: `Card ${slot} body`, type: 'textarea', rows: 2 }),
        defineEditorField({ id: `card${slot}ListJson`, label: `Card ${slot} bullet list JSON`, type: 'textarea', rows: 5 }),
        defineEditorField({ id: `card${slot}Fineprint`, label: `Card ${slot} fineprint`, type: 'textarea', rows: 2 }),
        defineEditorField({ id: `card${slot}LinksJson`, label: `Card ${slot} PDF / link list JSON`, type: 'textarea', rows: 4 }),
        defineEditorField({ id: `card${slot}AccordionsJson`, label: `Card ${slot} accordion JSON`, type: 'textarea', rows: 6 }),
        ...defineTransitionalActionFields({
          labelId: `card${slot}ButtonLabel`,
          labelLabel: `Card ${slot} button label`,
          hrefId: `card${slot}ButtonUrl`,
          hrefLabel: `Card ${slot} button URL`,
          toId: `card${slot}ButtonPageRef`,
          toLabel: `Card ${slot} internal page path`,
        }),
        defineEditorField({ id: `card${slot}ButtonDocumentId`, label: `Card ${slot} button document ID`, type: 'text' }),
        defineEditorField({ id: `card${slot}ButtonClassName`, label: `Card ${slot} button class name`, type: 'text' }),
        ...defineTransitionalActionFields({
          labelId: `card${slot}Button2Label`,
          labelLabel: `Card ${slot} button 2 label`,
          hrefId: `card${slot}Button2Url`,
          hrefLabel: `Card ${slot} button 2 URL`,
          toId: `card${slot}Button2PageRef`,
          toLabel: `Card ${slot} button 2 internal page path`,
        }),
        defineEditorField({ id: `card${slot}Button2DocumentId`, label: `Card ${slot} button 2 document ID`, type: 'text' }),
        defineEditorField({ id: `card${slot}Button2ClassName`, label: `Card ${slot} button 2 class name`, type: 'text' }),
      ])),
    ],
  },
];

function validateCardGridLinks(block) {
  const settings = block?.settings || {};
  return validateLinkFieldGroups(
    settings,
    [{
      hrefKeys: ['buttonUrl'],
      toKeys: ['buttonPageRef'],
      openInNewWindowKeys: ['buttonOpenInNewWindow'],
    }].concat(Array.from({ length: 8 }, (_, index) => {
      const slot = index + 1;
      return {
        hrefKeys: [`card${slot}ButtonUrl`],
        toKeys: [`card${slot}ButtonPageRef`],
      };
    })).concat(
      Array.from({ length: 8 }, (_, index) => {
        const slot = index + 1;
        return {
          hrefKeys: [`card${slot}Button2Url`],
          toKeys: [`card${slot}Button2PageRef`],
        };
      }),
    ),
  );
}

export const cardGridBlockDefinition = createBlockDefinition({
  kind: 'card_grid',
  label: 'Card Grid',
  icon: gridHudIcon,
  editorType: 'card_grid',
  presets: getCardGridPresetDefinitions(),
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    bgTone: 'white',
    contentWidth: 'content',
    columns: 'three',
    cardStyle: 'card2',
    titleTone: 'super-grey',
    bodyTone: 'super-grey',
    cardPaddingRem: 1.35,
    cardTitleSizeRem: 1.14,
    cardBodySizeRem: 1,
    cardBodyLineHeight: 1.58,
    anchorId: '',
    buttonLabel: '',
    buttonUrl: '',
    buttonPageRef: '',
    buttonOpenInNewWindow: false,
    buttonStyle: 'blue',
    buttonTone: 'atlantean',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicGridFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'cards'],
    adminSectionIds: ['content', 'cards'],
  },
  validators: [
    (block) => Boolean(buildDynamicGridFromBlock(block)),
    validateCardGridLinks,
  ],
  styleScope: {
    rootClassName: 'native-dynamic-grid',
    cssNamespace: 'card-grid',
  },
});
