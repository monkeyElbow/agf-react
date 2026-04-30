import billboardHudIcon from '../../assets/admin-block-icons/billboard.svg';
import {
  getDefaultSiteFeatureCatalogEntry,
  getSiteFeatureOptions,
} from '../../data/siteFeatureCatalog';
import { buildDynamicSiteFeatureFromBlock } from '../../lib/dynamicPageBlocks';
import { validateLegacyActionFieldGroup } from '../../lib/linkValue';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';

function validateSiteFeatureAction(block) {
  const settings = block?.settings || {};
  return validateLegacyActionFieldGroup(settings, {
    labelKeys: ['buttonLabel'],
    hrefKeys: ['buttonUrl'],
    toKeys: ['buttonPageRef'],
    openInNewWindowKeys: ['buttonOpenInNewWindow'],
  });
}

const defaultSiteFeatureEntry = getDefaultSiteFeatureCatalogEntry();
const featureIdOptions = getSiteFeatureOptions();

const sections = [
  {
    id: 'feature',
    title: 'Feature',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({
        id: 'featureId',
        label: 'Code-managed feature',
        type: 'select',
        options: featureIdOptions,
      }),
      defineEditorField({
        id: 'headline',
        label: 'Headline override',
        type: 'text',
      }),
      defineEditorField({
        id: 'body',
        label: 'Body override',
        type: 'textarea',
        rows: 4,
      }),
    ],
  },
  {
    id: 'action',
    title: 'Action',
    surfaces: ['hud', 'admin'],
    fields: [
      ...defineTransitionalActionFields({
        labelId: 'buttonLabel',
        labelLabel: 'CTA label override',
        hrefId: 'buttonUrl',
        hrefLabel: 'CTA URL / Path override',
        toId: 'buttonPageRef',
        toLabel: 'CTA internal page path override',
        openInNewWindowId: 'buttonOpenInNewWindow',
        openInNewWindowLabel: 'Open CTA in new window',
      }),
    ],
  },
];

export const siteFeatureBlockDefinition = createBlockDefinition({
  kind: 'site_feature',
  label: 'Site Feature',
  icon: billboardHudIcon,
  editorType: 'site_feature',
  allowedVariants: ['default', 'feature'],
  supportedModes: ['dynamic'],
  defaults: {
    featureId: defaultSiteFeatureEntry?.featureId || 'editorial_spotlight',
    headline: '',
    body: '',
    buttonLabel: '',
    buttonUrl: '',
    buttonPageRef: '',
    buttonOpenInNewWindow: false,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicSiteFeatureFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['feature', 'action'],
    adminSectionIds: ['feature', 'action'],
  },
  validators: [
    (block) => Boolean(buildDynamicSiteFeatureFromBlock(block)),
    validateSiteFeatureAction,
  ],
  styleScope: {
    rootClassName: 'service-native-dark-feature',
    cssNamespace: 'site-feature',
  },
});
