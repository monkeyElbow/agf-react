import billboardHudIcon from '../../assets/admin-block-icons/billboard.svg';
import { buildDynamicImpactStatFromBlock } from '../../lib/dynamicPageBlocks';
import { validateLegacyActionFieldGroup } from '../../lib/linkValue';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalActionFields } from '../foundation/editorDescriptors';

const IMPACT_STAT_TONE_OPTIONS = [
  { value: 'mango', label: 'Mango' },
  { value: 'atlantean', label: 'Blue' },
  { value: 'sandstone', label: 'Sandstone' },
  { value: 'melon', label: 'Melon' },
  { value: 'super-grey', label: 'Super Grey' },
  { value: 'white', label: 'White' },
];

function validateImpactStatAction(block) {
  const settings = block?.settings || {};
  return validateLegacyActionFieldGroup(settings, {
    labelKeys: ['ctaLabel'],
    hrefKeys: ['ctaPath'],
    toKeys: ['ctaPageRef'],
    openInNewWindowKeys: ['ctaOpenInNewWindow'],
  });
}

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'titlePrefix', label: 'Impact title prefix', type: 'text' }),
      defineEditorField({ id: 'highlight', label: 'Impact highlight word', type: 'text' }),
      defineEditorField({ id: 'body', label: 'Impact body text', type: 'textarea', rows: 4 }),
      defineEditorField({ id: 'countUp', label: 'Animate stat count-up', type: 'boolean' }),
    ],
  },
  {
    id: 'action',
    title: 'Action',
    surfaces: ['hud', 'admin'],
    fields: [
      ...defineTransitionalActionFields({
        labelId: 'ctaLabel',
        labelLabel: 'CTA label',
        hrefId: 'ctaPath',
        hrefLabel: 'CTA URL / Path',
        toId: 'ctaPageRef',
        toLabel: 'CTA internal page path',
        openInNewWindowId: 'ctaOpenInNewWindow',
        openInNewWindowLabel: 'Open CTA in new window',
      }),
    ],
  },
  ...Array.from({ length: 3 }, (_, index) => {
    const slot = index + 1;
    return {
      id: `stat-${slot}`,
      title: `Stat ${slot}`,
      surfaces: ['hud', 'admin'],
      fields: [
        defineEditorField({ id: `stat${slot}Value`, label: `Stat ${slot} value`, type: 'text' }),
        defineEditorField({ id: `stat${slot}Label`, label: `Stat ${slot} label`, type: 'text' }),
        defineEditorField({
          id: `stat${slot}Tone`,
          label: `Stat ${slot} tone`,
          type: 'select',
          options: IMPACT_STAT_TONE_OPTIONS,
        }),
      ],
    };
  }),
];

export const impactStatBlockDefinition = createBlockDefinition({
  kind: 'impact_stat',
  label: 'Impact Stat',
  icon: billboardHudIcon,
  editorType: 'impact_stat',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    titlePrefix: 'What you do here',
    highlight: 'matters',
    body: 'Your financial decisions can strengthen more than just your future.',
    countUp: true,
    ctaLabel: 'Tell me more',
    ctaPath: '/about-us/impact',
    ctaPageRef: '/about-us/impact',
    ctaOpenInNewWindow: false,
    stat1Value: '$11 billion',
    stat1Label: 'assets under management',
    stat1Tone: 'mango',
    stat2Value: '1,583',
    stat2Label: 'ministries supported',
    stat2Tone: 'atlantean',
    stat3Value: '38,654',
    stat3Label: 'super happy clients',
    stat3Tone: 'sandstone',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicImpactStatFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'action', 'stat-1', 'stat-2', 'stat-3'],
    adminSectionIds: ['content', 'action', 'stat-1', 'stat-2', 'stat-3'],
  },
  validators: [
    (block) => Boolean(buildDynamicImpactStatFromBlock(block)),
    validateImpactStatAction,
  ],
  styleScope: {
    rootClassName: 'home-native-impact',
    cssNamespace: 'impact-stat',
  },
});
