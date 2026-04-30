import gridHudIcon from '../../assets/admin-block-icons/grid.svg';
import charitableIcon from '../../assets/service-icons/Charitable.png';
import insureIcon from '../../assets/service-icons/Insure.png';
import investIcon from '../../assets/service-icons/Invest.png';
import loansIcon from '../../assets/service-icons/Loans.png';
import retireIcon from '../../assets/service-icons/Retire.png';
import ratesIcon from '../../assets/service-icons/chart.png';
import { buildDynamicServicesGridFromBlock } from '../../lib/dynamicPageBlocks';
import { validateLegacyLinkFieldGroups } from '../../lib/linkValue';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField, defineTransitionalLinkFields } from '../foundation/editorDescriptors';

function validateServicesGridLinks(block) {
  const settings = block?.settings || {};
  return validateLegacyLinkFieldGroups(
    settings,
    [
      {
        hrefKeys: ['browsePath'],
        toKeys: ['browsePageRef'],
      },
      ...Array.from({ length: 6 }, (_, index) => {
        const slot = index + 1;
        return {
          hrefKeys: [`card${slot}Path`],
          toKeys: [`card${slot}PageRef`],
        };
      }),
    ],
  );
}

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'heading', label: 'Services grid heading', type: 'text' }),
      defineEditorField({ id: 'headingSizeRem', label: 'Section heading size (rem)', type: 'number', min: 2.5, max: 5.5, step: 0.05 }),
      defineEditorField({ id: 'cardTitleSizeRem', label: 'Card title size (rem)', type: 'number', min: 1.2, max: 3, step: 0.05 }),
      defineEditorField({ id: 'cardPaddingRem', label: 'Card vertical padding (rem)', type: 'number', min: 1, max: 3, step: 0.05 }),
      defineEditorField({ id: 'browseLabel', label: 'Browse label', type: 'text' }),
      ...defineTransitionalLinkFields({
        hrefId: 'browsePath',
        hrefLabel: 'Browse URL / Path',
        toId: 'browsePageRef',
        toLabel: 'Browse internal page path',
      }),
    ],
  },
  {
    id: 'cards',
    title: 'Cards',
    surfaces: ['hud', 'admin'],
    fields: [
      ...Array.from({ length: 6 }, (_, index) => {
        const slot = index + 1;
        return [
          defineEditorField({ id: `card${slot}Title`, label: `Card ${slot} title`, type: 'text' }),
          ...defineTransitionalLinkFields({
            hrefId: `card${slot}Path`,
            hrefLabel: `Card ${slot} URL / Path`,
            toId: `card${slot}PageRef`,
            toLabel: `Card ${slot} internal page path`,
          }),
          defineEditorField({ id: `card${slot}ImageUrl`, label: `Card ${slot} image URL`, type: 'text' }),
          defineEditorField({ id: `card${slot}ImageAlt`, label: `Card ${slot} image alt text`, type: 'text' }),
          defineEditorField({ id: `card${slot}Action`, label: `Card ${slot} action label`, type: 'text' }),
          defineEditorField({ id: `card${slot}Featured`, label: `Card ${slot} featured`, type: 'boolean' }),
        ];
      }).flat(),
    ],
  },
];

export const servicesGridBlockDefinition = createBlockDefinition({
  kind: 'services_grid',
  label: 'Services Grid',
  icon: gridHudIcon,
  editorType: 'services_grid',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    heading: 'Bold, smart steps. Together.',
    headingSizeRem: 4.5625,
    cardTitleSizeRem: 2.1875,
    cardPaddingRem: 1.85,
    browseLabel: 'Browse all services',
    browsePath: '/services',
    browsePageRef: '/services',
    card1Title: 'Loans',
    card1Path: '/services/loans',
    card1PageRef: '/services/loans',
    card1ImageUrl: loansIcon,
    card1ImageAlt: '',
    card1Action: 'Options',
    card1Featured: false,
    card2Title: 'Retirement',
    card2Path: '/services/retirement',
    card2PageRef: '/services/retirement',
    card2ImageUrl: retireIcon,
    card2ImageAlt: '',
    card2Action: 'Explore',
    card2Featured: false,
    card3Title: 'Investments',
    card3Path: '/services/investments',
    card3PageRef: '/services/investments',
    card3ImageUrl: investIcon,
    card3ImageAlt: '',
    card3Action: 'Grow',
    card3Featured: false,
    card4Title: 'Legacy Giving',
    card4Path: '/services/legacy-giving',
    card4PageRef: '/services/legacy-giving',
    card4ImageUrl: charitableIcon,
    card4ImageAlt: '',
    card4Action: 'Plan',
    card4Featured: false,
    card5Title: 'Insurance',
    card5Path: '/services/insurance',
    card5PageRef: '/services/insurance',
    card5ImageUrl: insureIcon,
    card5ImageAlt: '',
    card5Action: 'Protect',
    card5Featured: false,
    card6Title: 'View Rates',
    card6Path: '/rates',
    card6PageRef: '/rates',
    card6ImageUrl: ratesIcon,
    card6ImageAlt: '',
    card6Action: 'View Rates',
    card6Featured: true,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicServicesGridFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'cards'],
    adminSectionIds: ['content', 'cards'],
  },
  validators: [
    (block) => Boolean(buildDynamicServicesGridFromBlock(block)),
    validateServicesGridLinks,
  ],
  styleScope: {
    rootClassName: 'home-native-services',
    cssNamespace: 'services-grid',
  },
});
