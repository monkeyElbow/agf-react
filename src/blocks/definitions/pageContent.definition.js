import pageContentHudIcon from '../../assets/admin-block-icons/page-content.svg';
import { buildDynamicPageContentFromBlock } from '../../lib/dynamicPageBlocks';
import { PAGE_CONTENT_IDENTITY } from '../../lib/pageContentIdentity';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';
import { getTokenSwatch } from '../../lib/colorSystem';

const PAGE_CONTENT_HEADING_TONE_OPTIONS = [
  { value: '', label: 'Default', swatch: 'linear-gradient(145deg, #f3f3f3 0%, #d8d8d8 100%)' },
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #d8423c 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-sandstone', label: 'Sandstone', swatch: 'linear-gradient(145deg, #c4beb6 0%, #b1aaa2 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];

const PAGE_CONTENT_HIGHLIGHT_TONE_OPTIONS = PAGE_CONTENT_HEADING_TONE_OPTIONS.filter((option) => option.value);

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Section title', type: 'textarea', rows: 2 }),
      defineEditorField({
        id: 'titleClassName',
        label: 'Section title color',
        type: 'swatch',
        options: PAGE_CONTENT_HEADING_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'titleHighlightsJson',
        label: 'Section title highlights',
        type: 'highlight_list',
        options: PAGE_CONTENT_HIGHLIGHT_TONE_OPTIONS,
      }),
      defineEditorField({ id: 'subtitle', label: 'Section subtitle', type: 'text' }),
      defineEditorField({ id: 'body', label: 'Section body', type: 'textarea', rows: 4 }),
      defineEditorField({ id: 'html', label: 'Page Content HTML', type: 'html' }),
      defineEditorField({ id: 'widget', label: 'Widget key', type: 'text' }),
    ],
  },
  {
    id: 'media',
    title: 'Media',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'logoImage', label: 'Logo image URL', type: 'text' }),
      defineEditorField({ id: 'logoAlt', label: 'Logo alt text', type: 'text' }),
      defineEditorField({ id: 'logoText', label: 'Logo text fallback', type: 'text' }),
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
    id: 'support',
    title: 'Support Library',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'supportGroupsJson', label: 'Support groups JSON', type: 'textarea', rows: 8 }),
      defineEditorField({ id: 'supportGroupsExpanded', label: 'Expand support items by default', type: 'boolean' }),
      defineEditorField({ id: 'supportGroupsCollapsible', label: 'Support items are collapsible', type: 'boolean' }),
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
    titleClassName: '',
    titleHighlightsJson: '',
    subtitle: '',
    body: '',
    html: '',
    widget: '',
    logoImage: '',
    logoAlt: '',
    logoText: '',
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
    supportGroupsJson: '',
    supportGroupsExpanded: false,
    supportGroupsCollapsible: true,
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
    hudSectionIds: ['content', 'layout', 'placement', 'media', 'actions', 'address', 'table', 'support', 'fineprint'],
    adminSectionIds: ['content', 'layout', 'placement', 'media', 'actions', 'address', 'table', 'support', 'fineprint'],
  },
  validators: [
    (block) => Boolean(buildDynamicPageContentFromBlock(block)),
  ],
  styleScope: {
    rootClassName: PAGE_CONTENT_IDENTITY.rootClassName,
    cssNamespace: PAGE_CONTENT_IDENTITY.cssNamespace,
  },
});
