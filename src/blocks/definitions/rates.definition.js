import ratesHudIcon from '../../assets/admin-block-icons/rates.svg';
import { buildDynamicRatesFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';

const DATASET_OPTIONS = [
  { value: 'certificates', label: 'Certificates' },
  { value: 'ira', label: 'IRA' },
  { value: '403b', label: '403(b) Investment Rate' },
];

const dataSchemaFields = [
  defineEditorField({ id: 'rowsJson', label: 'Rate rows', type: 'textarea' }),
  defineEditorField({ id: 'effectiveDate', label: 'Effective date', type: 'text' }),
  defineEditorField({ id: 'retirement403bMbaRate', label: '403(b) MBA rate', type: 'text' }),
  defineEditorField({ id: 'retirement403bMbaApy', label: '403(b) MBA APY', type: 'text' }),
];

const sections = [
  {
    id: 'management',
    title: 'Management',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'dataset', label: 'Rates dataset', type: 'select', options: DATASET_OPTIONS }),
      defineEditorField({ id: 'displayName', label: 'Display name', type: 'text' }),
      defineEditorField({ id: 'panelId', label: 'HUD panel ID', type: 'text' }),
      defineEditorField({ id: 'anchorId', label: 'Anchor ID', type: 'text' }),
    ],
  },
];

export const ratesBlockDefinition = createBlockDefinition({
  kind: 'rates',
  label: 'Rates',
  icon: ratesHudIcon,
  editorType: 'rates',
  allowedVariants: ['default', 'inline'],
  supportedModes: ['dynamic'],
  defaults: {
    dataset: 'certificates',
    displayName: 'Certificates Rates',
    panelId: 'rates-certificates',
    anchorId: 'certificates-rates',
  },
  schema: {
    fields: [...sections.flatMap((section) => section.fields), ...dataSchemaFields],
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
