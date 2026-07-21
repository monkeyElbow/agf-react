import pageContentHudIcon from '../../assets/admin-block-icons/page-content.svg';
import {
  CALCULATOR_WIDGET_EDITABLE_FIELDS,
  CALCULATOR_WIDGET_KIND,
  CALCULATOR_WIDGET_LABEL,
} from '../../lib/calculatorWidgetIdentity';
import { buildDynamicPageContentFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';

const sections = [
  {
    id: 'widget',
    title: 'Widget',
    surfaces: ['hud', 'admin'],
    fields: CALCULATOR_WIDGET_EDITABLE_FIELDS.filter((field) => field.id === 'widget'),
  },
  {
    id: 'layout',
    title: 'Layout',
    surfaces: ['hud', 'admin'],
    fields: CALCULATOR_WIDGET_EDITABLE_FIELDS.filter((field) => (
      ['fullBleed', 'spaceBeforeRem', 'spaceAfterRem', 'paddingTopRem', 'paddingBottomRem', 'contentMaxWidthPx'].includes(field.id)
    )),
  },
  {
    id: 'placement',
    title: 'Placement',
    surfaces: ['hud', 'admin'],
    fields: CALCULATOR_WIDGET_EDITABLE_FIELDS.filter((field) => ['anchorId', 'sectionClassName'].includes(field.id)),
  },
];

export const calculatorWidgetBlockDefinition = createBlockDefinition({
  kind: CALCULATOR_WIDGET_KIND,
  label: CALCULATOR_WIDGET_LABEL,
  icon: pageContentHudIcon,
  editorType: 'calculator_widget',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    widget: '',
    fullBleed: false,
    spaceBeforeRem: 0,
    spaceAfterRem: 0,
    paddingTopRem: 2.4,
    paddingBottomRem: 2.4,
    contentMaxWidthPx: 980,
    anchorId: '',
    sectionClassName: 'calculator-tool-shell calculator-tool-widget',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicPageContentFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['widget', 'layout', 'placement'],
    adminSectionIds: ['widget', 'layout', 'placement'],
  },
  validators: [
    (block) => Boolean(buildDynamicPageContentFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'native-dynamic-calculator-widget',
    cssNamespace: 'calculator-widget',
  },
});
