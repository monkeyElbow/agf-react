import columnsHudIcon from '../../assets/admin-block-icons/columns.svg';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';
import { buildDynamicColumnsFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';
import { getColumnsPresetDefinitions } from '../../lib/columnsPresets';
import { validateLegacyLinkFieldGroups } from '../../lib/linkValue';

const COLUMNS_HEADING_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const COLUMNS_BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: 'sand', label: 'Sand Gradient', swatch: 'linear-gradient(147deg, rgb(242, 238, 235) 62%, rgb(218, 215, 208) 100%)' },
  { value: 'blue', label: 'Blue Gradient', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Super Grey Gradient', swatch: 'linear-gradient(145deg, #414042 0%, #636265 100%)' },
];

const COLUMNS_STYLE_OPTIONS = [
  { value: 'retirement', label: 'Retirement split style' },
  { value: 'legacy-highlight', label: 'Legacy highlight style' },
  { value: 'loans-value', label: 'Loans value cards style' },
];

const COLUMNS_COUNT_OPTIONS = [
  { value: 'two', label: '2 columns' },
  { value: 'three', label: '3 columns' },
  { value: 'four', label: '4 columns' },
];

const COLUMNS_TYPE_OPTIONS = [
  { value: 'text', label: 'Text column' },
  { value: 'photo', label: 'Photo column' },
];

const COLUMNS_BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Super Grey' },
  { value: 'outline', label: 'Outline' },
];

const COLUMNS_BUTTON_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];

function validateColumnsLinks(block) {
  const settings = block?.settings || {};
  return validateLegacyLinkFieldGroups(
    settings,
    Array.from({ length: 4 }, (_, index) => {
      const slot = index + 1;
      return {
        hrefKeys: [`col${slot}ButtonUrl`],
        toKeys: [`col${slot}ButtonPageRef`],
      };
    }),
  );
}

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Columns heading', type: 'textarea', rows: 2 }),
      defineEditorField({
        id: 'titleClassName',
        label: 'Columns heading color',
        type: 'swatch',
        options: COLUMNS_HEADING_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'titleHighlightsJson',
        label: 'Columns heading highlights',
        type: 'highlight_list',
        options: COLUMNS_HEADING_TONE_OPTIONS.filter((option) => option.value),
      }),
      defineEditorField({ id: 'bodyHtml', label: 'Columns intro HTML', type: 'html' }),
      defineEditorField({ id: 'leadLine', label: 'Lead line', type: 'text' }),
      defineEditorField({ id: 'followupLine', label: 'Follow-up line', type: 'text' }),
      defineEditorField({
        id: 'columnsStyle',
        label: 'Columns style',
        type: 'select',
        options: COLUMNS_STYLE_OPTIONS,
      }),
      defineEditorField({
        id: 'bgTone',
        label: 'Columns background',
        type: 'swatch',
        options: COLUMNS_BACKGROUND_OPTIONS,
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
        label: 'Columns count',
        type: 'select',
        options: COLUMNS_COUNT_OPTIONS,
      }),
    ],
  },
  {
    id: 'columns',
    title: 'Columns',
    surfaces: ['hud', 'admin'],
    fields: [
      ...[1, 2, 3, 4].flatMap((slot) => ([
        defineEditorField({ id: `col${slot}Enabled`, label: `Column ${slot} enabled`, type: 'boolean' }),
        defineEditorField({
          id: `col${slot}Type`,
          label: `Column ${slot} type`,
          type: 'select',
          options: COLUMNS_TYPE_OPTIONS,
        }),
        defineEditorField({ id: `col${slot}Title`, label: `Column ${slot} title`, type: 'text' }),
        defineEditorField({ id: `col${slot}Body`, label: `Column ${slot} body`, type: 'textarea', rows: 3 }),
        defineEditorField({ id: `col${slot}ImageUrl`, label: `Column ${slot} photo URL`, type: 'text' }),
        defineEditorField({ id: `col${slot}ImageAlt`, label: `Column ${slot} photo alt text`, type: 'text' }),
        ...defineTransitionalActionFields({
          labelId: `col${slot}ButtonLabel`,
          labelLabel: `Column ${slot} button label`,
          hrefId: `col${slot}ButtonUrl`,
          hrefLabel: `Column ${slot} button URL`,
          toId: `col${slot}ButtonPageRef`,
          toLabel: `Column ${slot} button internal page path`,
          styleId: `col${slot}ButtonStyle`,
          styleLabel: `Column ${slot} button style`,
          styleOptions: COLUMNS_BUTTON_STYLE_OPTIONS,
          toneId: `col${slot}ButtonTone`,
          toneLabel: `Column ${slot} button color`,
          toneOptions: COLUMNS_BUTTON_TONE_OPTIONS,
        }),
        defineEditorField({
          id: `col${slot}WidthShare`,
          label: `Column ${slot} width share`,
          type: 'number',
          min: 0.5,
          max: 2.5,
          step: 0.05,
        }),
      ])),
    ],
  },
];

export const columnsBlockDefinition = createBlockDefinition({
  kind: 'columns',
  label: 'Columns',
  icon: columnsHudIcon,
  editorType: 'columns',
  presets: getColumnsPresetDefinitions(),
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    columnsStyle: 'retirement',
    bgTone: 'white',
    contentWidth: 'content',
    columns: 'two',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicColumnsFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'columns'],
    adminSectionIds: ['content', 'columns'],
  },
  validators: [
    (block) => Boolean(buildDynamicColumnsFromBlock(block)),
    validateColumnsLinks,
  ],
  styleScope: {
    rootClassName: 'native-dynamic-columns',
    cssNamespace: 'columns',
  },
});
