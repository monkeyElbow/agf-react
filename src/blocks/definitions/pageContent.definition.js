import pageContentHudIcon from '../../assets/admin-block-icons/page-content.svg';
import { buildDynamicPageContentFromBlock } from '../../lib/dynamicPageBlocks';
import { PAGE_CONTENT_IDENTITY } from '../../lib/pageContentIdentity';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'html', label: 'Page Content HTML', type: 'html' }),
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'spaceBeforeRem', label: 'Space before (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'spaceAfterRem', label: 'Space after (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'paddingTopRem', label: 'Padding top (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'paddingBottomRem', label: 'Padding bottom (rem)', type: 'number', min: 0, max: 8, step: 0.25 }),
      defineEditorField({ id: 'contentMaxWidthPx', label: 'Content max width (px)', type: 'number', min: 560, max: 1440, step: 10 }),
    ],
  },
];

export const pageContentBlockDefinition = createBlockDefinition({
  kind: PAGE_CONTENT_IDENTITY.kind,
  label: PAGE_CONTENT_IDENTITY.label,
  icon: pageContentHudIcon,
  editorType: PAGE_CONTENT_IDENTITY.editorType,
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    html: '',
    spaceBeforeRem: 0.5,
    spaceAfterRem: 0.5,
    paddingTopRem: 2.4,
    paddingBottomRem: 2.4,
    contentMaxWidthPx: 980,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicPageContentFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'layout'],
    adminSectionIds: ['content', 'layout'],
  },
  validators: [
    (block) => Boolean(buildDynamicPageContentFromBlock(block)),
  ],
  styleScope: {
    rootClassName: PAGE_CONTENT_IDENTITY.rootClassName,
    cssNamespace: PAGE_CONTENT_IDENTITY.cssNamespace,
  },
});
