import testimonialsHudIcon from '../../assets/admin-block-icons/testimonials.svg';
import { DEFAULT_TESTIMONIAL_FINEPRINT } from '../../data/testimonialsLibrarySeed';
import { buildDynamicTestimonialsFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';

const TESTIMONIAL_SELECTION_MODE_OPTIONS = [
  { value: 'manual', label: 'Manual IDs' },
  { value: 'tag', label: 'Filter by tags' },
];

const sections = [
  {
    id: 'selection',
    title: 'Selection',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({
        id: 'selectionMode',
        label: 'Selection mode',
        type: 'select',
        options: TESTIMONIAL_SELECTION_MODE_OPTIONS,
      }),
      defineEditorField({ id: 'selectedIdsCsv', label: 'Selected testimonial IDs (CSV or newline)', type: 'textarea', rows: 4 }),
      defineEditorField({ id: 'filterTagsCsv', label: 'Filter tags (CSV)', type: 'text' }),
      defineEditorField({ id: 'limit', label: 'Max testimonials (0 = all)', type: 'number', min: 0, step: 1 }),
    ],
  },
  {
    id: 'display',
    title: 'Display',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'showFineprint', label: 'Show fineprint', type: 'boolean' }),
      defineEditorField({ id: 'fineprint', label: 'Fineprint text', type: 'textarea', rows: 3 }),
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
    ],
  },
];

export const testimonialsBlockDefinition = createBlockDefinition({
  kind: 'testimonials',
  label: 'Testimonials',
  icon: testimonialsHudIcon,
  editorType: 'testimonials',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    selectionMode: 'manual',
    selectedIdsCsv: '',
    filterTagsCsv: '',
    limit: 0,
    showFineprint: true,
    fineprint: DEFAULT_TESTIMONIAL_FINEPRINT,
    sectionClassName: '',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicTestimonialsFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['selection', 'display'],
    adminSectionIds: ['selection', 'display'],
  },
  validators: [
    (block) => Boolean(block && block.kind === 'testimonials' && block.mode === 'dynamic'),
  ],
  styleScope: {
    rootClassName: 'native-dynamic-testimonials',
    cssNamespace: 'testimonials',
  },
});
