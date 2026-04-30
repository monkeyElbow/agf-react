import billboardHudIcon from '../../assets/admin-block-icons/billboard.svg';
import { buildDynamicFeaturePanelFromBlock } from '../../lib/dynamicPageBlocks';
import { validateLegacyActionFieldGroup } from '../../lib/linkValue';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';

function validateFeaturePanelAction(block) {
  const settings = block?.settings || {};
  return validateLegacyActionFieldGroup(settings, {
    labelKeys: ['buttonLabel'],
    hrefKeys: ['buttonUrl'],
    toKeys: ['buttonPageRef'],
    openInNewWindowKeys: ['buttonOpenInNewWindow'],
  });
}

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Feature panel title', type: 'text' }),
      defineEditorField({ id: 'bodyHtml', label: 'Feature panel body HTML', type: 'html' }),
      defineEditorField({ id: 'body', label: 'Fallback body text', type: 'textarea', rows: 3 }),
    ],
  },
  {
    id: 'action',
    title: 'Action',
    surfaces: ['hud', 'admin'],
    fields: [
      ...defineTransitionalActionFields({
        labelId: 'buttonLabel',
        labelLabel: 'Button label',
        hrefId: 'buttonUrl',
        hrefLabel: 'Button URL / Path',
        toId: 'buttonPageRef',
        toLabel: 'Button internal page path',
        openInNewWindowId: 'buttonOpenInNewWindow',
        openInNewWindowLabel: 'Open button in new window',
      }),
    ],
  },
];

export const featurePanelBlockDefinition = createBlockDefinition({
  kind: 'feature_panel',
  label: 'Feature Panel',
  icon: billboardHudIcon,
  editorType: 'feature_panel',
  allowedVariants: ['default', 'feature'],
  supportedModes: ['dynamic'],
  defaults: {
    title: 'Church Cash Reserves',
    bodyHtml: '<p>Financial stability is essential for long-term growth. Build a practical reserve strategy so your ministry is ready for both opportunity and disruption.</p>',
    body: '',
    buttonLabel: 'Ready for the unexpected?',
    buttonUrl: '/resources',
    buttonPageRef: '/resources',
    buttonOpenInNewWindow: false,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicFeaturePanelFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'action'],
    adminSectionIds: ['content', 'action'],
  },
  validators: [
    (block) => Boolean(buildDynamicFeaturePanelFromBlock(block)),
    validateFeaturePanelAction,
  ],
  styleScope: {
    rootClassName: 'service-native-dark-feature',
    cssNamespace: 'feature-panel',
  },
});
