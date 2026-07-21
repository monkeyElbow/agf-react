import pageContentHudIcon from '../../assets/admin-block-icons/page-content.svg';
import {
  CALCULATOR_INTRO_EDITABLE_FIELDS,
  CALCULATOR_INTRO_KIND,
  CALCULATOR_INTRO_LABEL,
} from '../../lib/calculatorWidgetIdentity';
import { buildDynamicPageContentFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: CALCULATOR_INTRO_EDITABLE_FIELDS.filter((field) => (
      ['title', 'titleClassName', 'titleHighlightsJson', 'body'].includes(field.id)
    )),
  },
  {
    id: 'layout',
    title: 'Layout',
    surfaces: ['hud', 'admin'],
    fields: CALCULATOR_INTRO_EDITABLE_FIELDS.filter((field) => (
      ['fullBleed', 'spaceBeforeRem', 'spaceAfterRem', 'paddingTopRem', 'paddingBottomRem', 'contentMaxWidthPx', 'copyWrap'].includes(field.id)
    )),
  },
  {
    id: 'placement',
    title: 'Placement',
    surfaces: ['hud', 'admin'],
    fields: CALCULATOR_INTRO_EDITABLE_FIELDS.filter((field) => ['anchorId', 'sectionClassName'].includes(field.id)),
  },
];

export const calculatorIntroBlockDefinition = createBlockDefinition({
  kind: CALCULATOR_INTRO_KIND,
  label: CALCULATOR_INTRO_LABEL,
  icon: pageContentHudIcon,
  editorType: 'calculator_intro',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    title: '',
    titleClassName: '',
    titleHighlightsJson: '',
    body: '',
    fullBleed: false,
    spaceBeforeRem: 0,
    spaceAfterRem: 0,
    paddingTopRem: 2.4,
    paddingBottomRem: 2.4,
    contentMaxWidthPx: 980,
    anchorId: '',
    sectionClassName: 'calculator-tool-shell',
    copyWrap: true,
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicPageContentFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'layout', 'placement'],
    adminSectionIds: ['content', 'layout', 'placement'],
  },
  validators: [
    (block) => Boolean(buildDynamicPageContentFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'native-dynamic-calculator-intro',
    cssNamespace: 'calculator-intro',
  },
});
