import pageContentHudIcon from '../../assets/admin-block-icons/page-content.svg';
import {
  buildDynamicLegalCopyFromBlock,
  DEFAULT_RATES_LEGAL_COPY_SETTINGS,
} from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';

const sections = [
  {
    id: 'certificates',
    title: 'Certificates copy',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'certificatesHtml', label: 'Certificates disclosure HTML', type: 'html' }),
    ],
  },
  {
    id: 'ira',
    title: 'IRA copy',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'iraHtml', label: 'IRA disclosure HTML', type: 'html' }),
    ],
  },
];

export const legalCopyBlockDefinition = createBlockDefinition({
  kind: 'legal_copy',
  label: 'Disclosure Copy',
  icon: pageContentHudIcon,
  editorType: 'legal_copy',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    certificatesHtml: DEFAULT_RATES_LEGAL_COPY_SETTINGS.certificatesHtml,
    iraHtml: DEFAULT_RATES_LEGAL_COPY_SETTINGS.iraHtml,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicLegalCopyFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['certificates', 'ira'],
    adminSectionIds: ['certificates', 'ira'],
  },
  validators: [
    (block) => Boolean(buildDynamicLegalCopyFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'rates-disclaimer',
    cssNamespace: 'legal-copy',
  },
});
