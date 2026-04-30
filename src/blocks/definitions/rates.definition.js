import ratesHudIcon from '../../assets/admin-block-icons/rates.svg';
import { buildDynamicRatesFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';

const sections = [
  {
    id: 'management',
    title: 'Management',
    surfaces: ['hud', 'admin'],
    fields: [],
  },
];

export const ratesBlockDefinition = createBlockDefinition({
  kind: 'rates',
  label: 'Rates',
  icon: ratesHudIcon,
  editorType: 'rates',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {},
  schema: {
    fields: [],
  },
  renderer: {
    buildRuntime: buildDynamicRatesFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['management'],
    adminSectionIds: ['management'],
  },
  validators: [
    (block) => Boolean(buildDynamicRatesFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'rates-page',
    cssNamespace: 'rates',
  },
});
