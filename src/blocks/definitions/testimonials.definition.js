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
    ],
  },
  {
    id: 'targeting',
    title: 'Targeting',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'targetSectionKey', label: 'Target section key (optional)', type: 'text' }),
      defineEditorField({ id: 'targetFineprintSectionKey', label: 'Target fineprint section key (optional)', type: 'text' }),
      defineEditorField({ id: 'targetSectionClassName', label: 'Target section class name (optional)', type: 'text' }),
      defineEditorField({ id: 'targetSectionIndex', label: 'Target section index (optional)', type: 'number', min: 0, max: 30, step: 1 }),
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
    targetSectionKey: '',
    targetFineprintSectionKey: '',
    targetSectionClassName: '',
    targetSectionIndex: '',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicTestimonialsFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['selection', 'display', 'targeting'],
    adminSectionIds: ['selection', 'display', 'targeting'],
  },
  validators: [
    (block) => Boolean(block && block.kind === 'testimonials' && block.mode === 'dynamic'),
  ],
  styleScope: {
    rootClassName: 'native-dynamic-testimonials',
    cssNamespace: 'testimonials',
  },
});
