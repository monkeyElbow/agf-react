import pageContentHudIcon from '../../assets/admin-block-icons/page-content.svg';
import { buildDynamicCardChartFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';
import { SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT } from '../../lib/colorSystem';

const CARD_CHART_COUNT_OPTIONS = [2, 3, 4, 5, 6].map((count) => ({ value: String(count), label: `${count} cards` }));
const CARD_CHART_JUSTIFY_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];
const CARD_CHART_COLOR_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'sandstone', label: 'Sandstone', swatch: '#c4beb6' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
];
const cardFields = Array.from({ length: 6 }, (_, index) => {
  const slot = index + 1;
  return [
    defineEditorField({ id: `card${slot}Title`, label: `Card ${slot} title`, type: 'text' }),
    defineEditorField({ id: `card${slot}Color`, label: `Card ${slot} color`, type: 'swatch', defaultValue: CARD_CHART_COLOR_OPTIONS[index % CARD_CHART_COLOR_OPTIONS.length].value, options: CARD_CHART_COLOR_OPTIONS }),
    defineEditorField({
      id: `card${slot}Bullets`,
      label: `Card ${slot} comparison points`,
      type: 'textarea',
      rows: 8,
      placeholder: 'Enter one comparison point per line',
    }),
  ];
}).flat();

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Chart heading', type: 'textarea', rows: 2 }),
      defineEditorField({ id: 'justify', label: 'Chart heading justify', type: 'select', defaultValue: 'center', options: CARD_CHART_JUSTIFY_OPTIONS }),
      defineEditorField({ id: 'titleClassName', label: 'Chart heading color', type: 'swatch', options: SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT }),
      defineEditorField({ id: 'titleHighlightsJson', label: 'Chart heading highlights', type: 'highlight_list', options: SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT.filter((option) => option.value) }),
      defineEditorField({ id: 'cardCount', label: 'Number of cards', type: 'select', options: CARD_CHART_COUNT_OPTIONS }),
      defineEditorField({
        id: 'valueAlignment',
        label: 'Card content alignment',
        type: 'select',
        options: [
          { value: '', label: 'Default' },
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      }),
    ],
  },
  {
    id: 'spacing',
    title: 'Spacing',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'spaceBeforeRem', label: 'Space before (rem)', type: 'range', min: 0, max: 8, step: 0.25, defaultValue: 0, suffix: 'rem' }),
      defineEditorField({ id: 'spaceAfterRem', label: 'Space after (rem)', type: 'range', min: 0, max: 8, step: 0.25, defaultValue: 0, suffix: 'rem' }),
      defineEditorField({ id: 'headerGapRem', label: 'Space below heading (rem)', type: 'range', min: 0.5, max: 6, step: 0.25, defaultValue: 2.4, suffix: 'rem' }),
      defineEditorField({ id: 'paddingTopRem', label: 'Padding top (rem)', type: 'range', min: 0, max: 8, step: 0.25, defaultValue: 2.4, suffix: 'rem' }),
      defineEditorField({ id: 'paddingBottomRem', label: 'Padding bottom (rem)', type: 'range', min: 0, max: 8, step: 0.25, defaultValue: 2.4, suffix: 'rem' }),
      defineEditorField({ id: 'cellPaddingRem', label: 'Cell padding (rem)', type: 'range', min: 0.55, max: 1.8, step: 0.05, defaultValue: 0.9, suffix: 'rem' }),
      defineEditorField({ id: 'cellTextSizeRem', label: 'Cell text size (rem)', type: 'range', min: 0.8, max: 1.5, step: 0.05, defaultValue: 1.05, suffix: 'rem' }),
      defineEditorField({
        id: 'cellTextWeight',
        label: 'Cell text weight',
        type: 'select',
        defaultValue: '650',
        options: [
          { value: '400', label: 'Regular' },
          { value: '500', label: 'Medium' },
          { value: '600', label: 'Semibold' },
          { value: '650', label: 'Strong' },
          { value: '700', label: 'Bold' },
          { value: '780', label: 'Heavy' },
        ],
      }),
    ],
  },
  {
    id: 'cards',
    title: 'Cards',
    surfaces: ['hud', 'admin'],
    fields: [
      ...cardFields,
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'fullBleed', label: 'Full bleed rail', type: 'boolean' }),
      defineEditorField({ id: 'contentMaxWidthPx', label: 'Chart width (px)', type: 'range', min: 760, max: 1440, step: 10, defaultValue: 1180, suffix: 'px' }),
      // Retained in the schema for route-specific presentation compatibility;
      // it is an internal hook and is intentionally not exposed to admins.
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
      defineEditorField({ id: 'anchorId', label: 'Anchor ID', type: 'text' }),
    ],
  },
  {
    id: 'fineprint',
    title: 'Fineprint',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'fineprint', label: 'Fineprint', type: 'textarea', rows: 8, placeholder: 'Enter one disclosure line per paragraph' }),
      defineEditorField({
        id: 'fineprintJustify',
        label: 'Fineprint justify',
        type: 'select',
        defaultValue: 'center',
        options: CARD_CHART_JUSTIFY_OPTIONS,
      }),
      defineEditorField({ id: 'fineprintSizeRem', label: 'Fineprint size (rem)', type: 'range', min: 0.65, max: 1.3, step: 0.05, defaultValue: 0.88, suffix: 'rem' }),
      defineEditorField({ id: 'fineprintDisclosureId', label: 'Fineprint disclosure ID', type: 'text' }),
    ],
  },
];

export const cardChartBlockDefinition = createBlockDefinition({
  kind: 'card_chart',
  label: 'Card Chart',
  icon: pageContentHudIcon,
  editorType: 'card_chart',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: { title: 'Card Chart', justify: 'center', titleClassName: '', titleHighlightsJson: '', cardCount: '2', fineprint: '', fineprintDisclosureId: '', fineprintJustify: 'center', fineprintSizeRem: 0.88, valueAlignment: '', fullBleed: true, spaceBeforeRem: 0, spaceAfterRem: 0, headerGapRem: 2.4, paddingTopRem: 2.4, paddingBottomRem: 2.4, cellPaddingRem: 0.9, cellTextSizeRem: 1.05, cellTextWeight: '650', contentMaxWidthPx: 1180, sectionClassName: '', anchorId: '' },
  schema: { fields: sections.flatMap((section) => section.fields) },
  renderer: { buildRuntime: buildDynamicCardChartFromBlock },
  editor: { sections, hudSectionIds: ['content', 'spacing', 'cards', 'fineprint', 'layout'], adminSectionIds: ['content', 'spacing', 'cards', 'fineprint', 'layout'] },
  validators: [(block) => Boolean(buildDynamicCardChartFromBlock(block))],
  styleScope: { rootClassName: 'native-dynamic-card-chart', cssNamespace: 'card-chart' },
});
