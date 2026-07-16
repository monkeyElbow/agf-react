import pageContentHudIcon from '../../assets/admin-block-icons/page-content.svg';
import { buildDynamicPageContentFromBlock } from '../../lib/dynamicPageBlocks';
import { PAGE_CONTENT_IDENTITY } from '../../lib/pageContentIdentity';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Section title', type: 'textarea', rows: 2 }),
      defineEditorField({ id: 'subtitle', label: 'Section subtitle', type: 'text' }),
      defineEditorField({ id: 'body', label: 'Section body', type: 'textarea', rows: 4 }),
      defineEditorField({ id: 'html', label: 'Page Content HTML', type: 'html' }),
      defineEditorField({ id: 'widget', label: 'Widget key', type: 'text' }),
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
  {
    id: 'placement',
    title: 'Placement',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'anchorId', label: 'Anchor ID', type: 'text' }),
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
      defineEditorField({ id: 'copyWrap', label: 'Wrap section copy', type: 'boolean' }),
    ],
  },
  {
    id: 'actions',
    title: 'Actions',
    surfaces: ['hud', 'admin'],
    fields: [
      ...defineTransitionalActionFields({
        labelId: 'buttonLabel',
        labelLabel: 'Button label',
        hrefId: 'buttonUrl',
        hrefLabel: 'Button URL',
        toId: 'buttonPageRef',
        toLabel: 'Button internal page path',
        openInNewWindowId: 'buttonOpenInNewWindow',
        openInNewWindowLabel: 'Button opens in new window',
      }),
      defineEditorField({ id: 'buttonDocumentId', label: 'Button document ID', type: 'text' }),
    ],
  },
  {
    id: 'address',
    title: 'Address Block',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'addressClassName', label: 'Address block class name', type: 'text' }),
      defineEditorField({ id: 'addressTitle', label: 'Address title', type: 'text' }),
      defineEditorField({ id: 'addressLines', label: 'Address lines', type: 'textarea', rows: 4 }),
    ],
  },
  {
    id: 'table',
    title: 'Table',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'tableHeadersJson', label: 'Table headers JSON', type: 'textarea', rows: 3 }),
      defineEditorField({ id: 'tableRowsJson', label: 'Table rows JSON', type: 'textarea', rows: 8 }),
      defineEditorField({
        id: 'tableValueAlignment',
        label: 'Table value alignment',
        type: 'select',
        options: [
          { value: '', label: 'Default' },
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      }),
      defineEditorField({ id: 'tableChartId', label: 'Managed chart ID', type: 'text' }),
    ],
  },
  {
    id: 'fineprint',
    title: 'Fineprint',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'fineprint', label: 'Fineprint lines', type: 'textarea', rows: 5 }),
      defineEditorField({ id: 'fineprintDisclosureId', label: 'Managed disclosure ID', type: 'text' }),
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
    title: '',
    subtitle: '',
    body: '',
    html: '',
    widget: '',
    fullBleed: false,
    spaceBeforeRem: 0.5,
    spaceAfterRem: 0.5,
    paddingTopRem: 2.4,
    paddingBottomRem: 2.4,
    contentMaxWidthPx: 980,
    anchorId: '',
    sectionClassName: '',
    copyWrap: false,
    buttonLabel: '',
    buttonUrl: '',
    buttonPageRef: '',
    buttonOpenInNewWindow: false,
    buttonDocumentId: '',
    addressClassName: '',
    addressTitle: '',
    addressLines: '',
    tableHeadersJson: '',
    tableRowsJson: '',
    tableValueAlignment: '',
    tableChartId: '',
    fineprint: '',
    fineprintDisclosureId: '',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicPageContentFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'layout', 'placement', 'actions', 'address', 'table', 'fineprint'],
    adminSectionIds: ['content', 'layout', 'placement', 'actions', 'address', 'table', 'fineprint'],
  },
  validators: [
    (block) => Boolean(buildDynamicPageContentFromBlock(block)),
  ],
  styleScope: {
    rootClassName: PAGE_CONTENT_IDENTITY.rootClassName,
    cssNamespace: PAGE_CONTENT_IDENTITY.cssNamespace,
  },
});
