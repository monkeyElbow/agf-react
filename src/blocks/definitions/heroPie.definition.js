import heroHudIcon from '../../assets/admin-block-icons/hero.svg';
import { buildDynamicHeroPieFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';

const sections = [
  {
    id: 'behavior',
    title: 'Behavior',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'autoplay', label: 'Autoplay wedges', type: 'boolean' }),
      defineEditorField({ id: 'autoplayMs', label: 'Autoplay interval (ms)', type: 'number', min: 1200, max: 10000, step: 100 }),
      defineEditorField({ id: 'slicesJson', label: 'Service slices (JSON)', type: 'textarea', rows: 16 }),
    ],
  },
];

export const heroPieBlockDefinition = createBlockDefinition({
  kind: 'hero_pie',
  label: 'Hero Pie',
  icon: heroHudIcon,
  editorType: 'hero_pie',
  singleton: true,
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    autoplay: true,
    autoplayMs: 2400,
    slicesJson: '[]',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicHeroPieFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['behavior'],
    adminSectionIds: ['behavior'],
  },
  validators: [
    (block) => Boolean(buildDynamicHeroPieFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'services-pie-hero',
    cssNamespace: 'hero-pie',
  },
});
