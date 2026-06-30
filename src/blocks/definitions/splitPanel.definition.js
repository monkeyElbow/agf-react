import columnsHudIcon from '../../assets/admin-block-icons/columns.svg';
import { buildDynamicSplitPanelFromBlock } from '../../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../../lib/colorSystem';
import { validateLegacyActionFieldGroups } from '../../lib/linkValue';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';

const SPLIT_PANEL_PRESENTATION_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'certificate_cards', label: 'Certificate Cards' },
];

const SPLIT_PANEL_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'sandstone', label: 'Sandstone', swatch: '#c4beb6' },
];

function validateSplitPanelActions(block) {
  const settings = block?.settings || {};
  return validateLegacyActionFieldGroups(settings, [
    {
      labelKeys: ['leftButtonLabel'],
      hrefKeys: ['leftButtonUrl'],
      toKeys: ['leftButtonPageRef'],
      openInNewWindowKeys: ['leftButtonOpenInNewWindow'],
    },
    {
      labelKeys: ['rightButtonLabel'],
      hrefKeys: ['rightButtonUrl'],
      toKeys: ['rightButtonPageRef'],
      openInNewWindowKeys: ['rightButtonOpenInNewWindow'],
    },
  ]);
}

const sections = [
  {
    id: 'presentation',
    title: 'Presentation',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({
        id: 'presentation',
        label: 'Card presentation',
        type: 'select',
        options: SPLIT_PANEL_PRESENTATION_OPTIONS,
      }),
      defineEditorField({
        id: 'leftTone',
        label: 'Left card color',
        type: 'swatch',
        options: SPLIT_PANEL_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'rightTone',
        label: 'Right card color',
        type: 'swatch',
        options: SPLIT_PANEL_TONE_OPTIONS,
      }),
    ],
  },
  {
    id: 'left',
    title: 'Left Panel',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'leftTitle', label: 'Left title', type: 'text' }),
      defineEditorField({ id: 'leftBodyHtml', label: 'Left body HTML', type: 'html' }),
      defineEditorField({ id: 'leftBody', label: 'Left fallback body', type: 'textarea', rows: 3 }),
      ...defineTransitionalActionFields({
        labelId: 'leftButtonLabel',
        labelLabel: 'Left button label',
        hrefId: 'leftButtonUrl',
        hrefLabel: 'Left button URL / Path',
        toId: 'leftButtonPageRef',
        toLabel: 'Left button internal page path',
        openInNewWindowId: 'leftButtonOpenInNewWindow',
        openInNewWindowLabel: 'Left button opens in new window',
      }),
    ],
  },
  {
    id: 'right',
    title: 'Right Panel',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'rightTitle', label: 'Right title', type: 'text' }),
      defineEditorField({ id: 'rightBodyHtml', label: 'Right body HTML', type: 'html' }),
      defineEditorField({ id: 'rightBody', label: 'Right fallback body', type: 'textarea', rows: 3 }),
      ...defineTransitionalActionFields({
        labelId: 'rightButtonLabel',
        labelLabel: 'Right button label',
        hrefId: 'rightButtonUrl',
        hrefLabel: 'Right button URL / Path',
        toId: 'rightButtonPageRef',
        toLabel: 'Right button internal page path',
        openInNewWindowId: 'rightButtonOpenInNewWindow',
        openInNewWindowLabel: 'Right button opens in new window',
      }),
    ],
  },
];

export const splitPanelBlockDefinition = createBlockDefinition({
  kind: 'split_panel',
  label: 'Split Panel',
  icon: columnsHudIcon,
  editorType: 'split_panel',
  allowedVariants: ['default', 'split'],
  supportedModes: ['dynamic'],
  defaults: {
    presentation: 'default',
    leftTone: 'atlantean',
    rightTone: 'mango',
    leftTitle: 'Individual Retirement Accounts (IRAs)',
    leftBodyHtml: '<p>An IRA (Individual Retirement Account) provides beneficial options, both now and in the future. We offer <strong>Traditional</strong> and <strong>Roth</strong> IRAs. Learn more about each below.</p>',
    leftBody: '',
    leftButtonLabel: 'Explore IRAs',
    leftButtonUrl: '/services/retirement/iras',
    leftButtonPageRef: '/services/retirement/iras',
    leftButtonOpenInNewWindow: false,
    rightTitle: 'Deferred Compensation Plan (409A)',
    rightBodyHtml: '<p>Available exclusively to ministers, ministry employees, and Qualified Church-Controlled Organizations (QCCO), this 409A plan allows participants to defer compensation above and beyond standard retirement contribution limits.</p>',
    rightBody: '',
    rightButtonLabel: 'Explore 409A',
    rightButtonUrl: '/services/retirement/409a',
    rightButtonPageRef: '/services/retirement/409a',
    rightButtonOpenInNewWindow: false,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicSplitPanelFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['presentation', 'left', 'right'],
    adminSectionIds: ['presentation', 'left', 'right'],
  },
  validators: [
    (block) => Boolean(buildDynamicSplitPanelFromBlock(block)),
    validateSplitPanelActions,
  ],
  styleScope: {
    rootClassName: 'retirement-account-grid',
    cssNamespace: 'split-panel',
  },
});
