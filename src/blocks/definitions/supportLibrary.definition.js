import pageContentHudIcon from '../../assets/admin-block-icons/page-content.svg';
import { buildDynamicPageContentFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Section title', type: 'textarea', rows: 2 }),
      defineEditorField({ id: 'subtitle', label: 'Section subtitle', type: 'text' }),
      defineEditorField({ id: 'html', label: 'Intro copy', type: 'html' }),
    ],
  },
  {
    id: 'support',
    title: 'Support library',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'supportGroupsJson', label: 'Support groups', type: 'support_library_groups' }),
      defineEditorField({ id: 'supportGroupsExpanded', label: 'Expand support items by default', type: 'boolean' }),
      defineEditorField({ id: 'supportGroupsCollapsible', label: 'Support items are collapsible', type: 'boolean' }),
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'fullBleed', label: 'Full bleed rail', type: 'boolean' }),
      defineEditorField({ id: 'spaceBeforeRem', label: 'Space before (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'spaceAfterRem', label: 'Space after (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'paddingTopRem', label: 'Padding top (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'paddingBottomRem', label: 'Padding bottom (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'contentMaxWidthPx', label: 'Content max width (px)', type: 'number', min: 560, max: 1440, step: 10 }),
    ],
  },
];

export const supportLibraryBlockDefinition = createBlockDefinition({
  kind: 'support_library',
  label: 'Support library',
  icon: pageContentHudIcon,
  editorType: 'support_library',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    title: '',
    subtitle: '',
    html: '',
    fullBleed: false,
    spaceBeforeRem: 0.5,
    spaceAfterRem: 0.5,
    paddingTopRem: 2.4,
    paddingBottomRem: 2.4,
    contentMaxWidthPx: 1184,
    supportGroupsJson: '',
    supportGroupsExpanded: true,
    supportGroupsCollapsible: false,
  },
  schema: { fields: sections.flatMap((section) => section.fields) },
  renderer: { buildRuntime: buildDynamicPageContentFromBlock },
  editor: {
    sections,
    hudSectionIds: ['content', 'support', 'layout'],
    adminSectionIds: ['content', 'support', 'layout'],
  },
  validators: [
    (block) => Boolean(buildDynamicPageContentFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'native-support-library-block',
    cssNamespace: 'support-library',
  },
});
