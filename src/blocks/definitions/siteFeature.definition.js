import billboardHudIcon from '../../assets/admin-block-icons/billboard.svg';
import {
  getDefaultSiteFeatureCatalogEntry,
  getSiteFeatureOptions,
} from '../../data/siteFeatureCatalog';
import { buildDynamicSiteFeatureFromBlock } from '../../lib/dynamicPageBlocks';
import {
  DYNAMIC_GRID_BODY_TONE_OPTIONS,
  DYNAMIC_GRID_TITLE_TONE_OPTIONS,
} from '../../lib/dynamicGridPresentation';
import { validateActionFieldGroup } from '../../lib/linkValue';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';

function validateSiteFeatureAction(block) {
  const settings = block?.settings || {};
  return validateActionFieldGroup(settings, {
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
      defineEditorField({ id: 'introHeading', label: 'Feature intro heading', type: 'text' }),
      defineEditorField({ id: 'introBody', label: 'Feature intro body', type: 'textarea', rows: 4 }),
      defineEditorField({ id: 'introEmphasis', label: 'Feature intro emphasis', type: 'text' }),
      defineEditorField({ id: 'sectionClassName', label: 'Section class name', type: 'text' }),
    ],
  },
  {
    id: 'panels',
    title: 'Panels',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'panelsJson', label: 'Feature panels', type: 'feature_collection' }),
      defineEditorField({ id: 'metricsJson', label: 'Feature metrics', type: 'feature_collection' }),
      defineEditorField({ id: 'cardsJson', label: 'Feature cards', type: 'feature_collection' }),
      defineEditorField({ id: 'beatsJson', label: 'Feature story beats', type: 'feature_collection' }),
    ],
  },
  {
    id: 'gallery',
    title: 'Gallery presentation',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({
        id: 'cardTitleSizeRem',
        label: 'Card title size (rem)',
        type: 'range',
        min: 3,
        max: 6,
        step: 0.05,
        defaultValue: 5.4,
      }),
      defineEditorField({
        id: 'cardTitleLineHeight',
        label: 'Card title line height',
        type: 'range',
        min: 0.8,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.95,
      }),
      defineEditorField({
        id: 'cardBodySizeRem',
        label: 'Card body size (rem)',
        type: 'range',
        min: 0.9,
        max: 2,
        step: 0.05,
        defaultValue: 1.14,
      }),
      defineEditorField({
        id: 'cardBodyLineHeight',
        label: 'Card body line height',
        type: 'range',
        min: 1.1,
        max: 2.1,
        step: 0.05,
        defaultValue: 1.72,
      }),
      defineEditorField({
        id: 'titleTone',
        label: 'Card title color',
        type: 'swatch',
        options: DYNAMIC_GRID_TITLE_TONE_OPTIONS,
      }),
      defineEditorField({
        id: 'bodyTone',
        label: 'Card body color',
        type: 'swatch',
        options: DYNAMIC_GRID_BODY_TONE_OPTIONS,
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
    sectionClassName: '',
    cardTitleSizeRem: 5.4,
    cardTitleLineHeight: 0.95,
    cardBodySizeRem: 1.14,
    cardBodyLineHeight: 1.72,
    titleTone: 'super-grey',
    bodyTone: 'super-grey',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicSiteFeatureFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['feature', 'panels', 'gallery', 'action'],
    adminSectionIds: ['feature', 'panels', 'gallery', 'action'],
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
