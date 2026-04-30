import billboardHudIcon from '../../assets/admin-block-icons/billboard.svg';
import { buildDynamicCalculatorCtaFromBlock } from '../../lib/dynamicPageBlocks';
import { createBlockDefinition } from '../foundation/models';
import { defineEditorField } from '../foundation/editorDescriptors';

const sections = [
  {
    id: 'content',
    title: 'Content',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'title', label: 'Calculator title', type: 'text' }),
      defineEditorField({ id: 'subtitle', label: 'Calculator subtitle', type: 'text' }),
      defineEditorField({ id: 'body', label: 'Calculator body', type: 'textarea', rows: 3 }),
      defineEditorField({ id: 'howItWorksTitle', label: 'How it works title', type: 'text' }),
      defineEditorField({ id: 'step1', label: 'Step 1', type: 'text' }),
      defineEditorField({ id: 'step2', label: 'Step 2', type: 'text' }),
      defineEditorField({ id: 'step3', label: 'Step 3', type: 'text' }),
      defineEditorField({ id: 'resultsTitle', label: 'Results title', type: 'text' }),
    ],
  },
  {
    id: 'calculator',
    title: 'Calculator Labels',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'totalInvestmentLabel', label: 'Total investment label', type: 'text' }),
      defineEditorField({ id: 'ladderYearsLabel', label: 'Ladder years label', type: 'text' }),
      defineEditorField({ id: 'ladderYearsHelper', label: 'Ladder years helper', type: 'textarea', rows: 2 }),
      defineEditorField({ id: 'maturityLabel', label: 'Maturity label', type: 'text' }),
      defineEditorField({ id: 'reinvestOptionLabel', label: 'Reinvest option label', type: 'text' }),
      defineEditorField({ id: 'cashOutOptionLabel', label: 'Cash out option label', type: 'text' }),
      defineEditorField({ id: 'visualizeYearsLabel', label: 'Visualize years label', type: 'text' }),
      defineEditorField({ id: 'visualizeYearsHelper', label: 'Visualize years helper', type: 'textarea', rows: 2 }),
      defineEditorField({ id: 'calculateLabel', label: 'Calculate button label', type: 'text' }),
      defineEditorField({ id: 'note', label: 'Calculator note', type: 'textarea', rows: 2 }),
      defineEditorField({ id: 'disclaimer', label: 'Calculator disclaimer', type: 'textarea', rows: 2 }),
      defineEditorField({ id: 'customRatesNote', label: 'Custom rates note', type: 'textarea', rows: 2 }),
    ],
  },
  {
    id: 'followup',
    title: 'Follow-up',
    surfaces: ['hud', 'admin'],
    fields: [
      defineEditorField({ id: 'downloadTitle', label: 'Download title', type: 'text' }),
      defineEditorField({ id: 'downloadBody', label: 'Download body', type: 'textarea', rows: 3 }),
      defineEditorField({ id: 'downloadButtonLabel', label: 'Download button label', type: 'text' }),
      defineEditorField({ id: 'discussTitle', label: 'Discuss title', type: 'text' }),
      defineEditorField({ id: 'discussBody', label: 'Discuss body', type: 'textarea', rows: 3 }),
      defineEditorField({ id: 'discussButtonLabel', label: 'Discuss button label', type: 'text' }),
    ],
  },
];

export const calculatorCtaBlockDefinition = createBlockDefinition({
  kind: 'calculator_cta',
  label: 'Calculator CTA',
  icon: billboardHudIcon,
  editorType: 'calculator_cta',
  allowedVariants: ['default'],
  supportedModes: ['dynamic'],
  defaults: {
    title: 'Investment Laddering Strategy',
    subtitle: 'Longer term rates with shorter term access',
    body: 'Laddering splits your savings into multiple certificates that mature at different times. That gives you regular access to cash while you pursue longer-term rates.',
    howItWorksTitle: 'How it works',
    step1: 'Split your total into equal parts.',
    step2: 'Start by buying certificates with staggered maturities (1-year, 2-year, 3-year...).',
    step3: 'When one matures, either reinvest into your selected longest-term certificate to keep the ladder going, or take the maturity as cash.',
    totalInvestmentLabel: 'Total Investment Amount',
    ladderYearsLabel: 'Ladder span (years / longest term)',
    ladderYearsHelper: 'Builds 1-year through N-year certificates; reinvestment uses the N-year term.',
    maturityLabel: 'When a certificate matures',
    reinvestOptionLabel: 'Reinvest matured principal into longest term',
    cashOutOptionLabel: 'Keep matured principal as cash',
    visualizeYearsLabel: 'Timeline years to visualize',
    visualizeYearsHelper: 'Timeline filter only. Increase or decrease to expand the visual range.',
    calculateLabel: 'Calculate',
    note: 'Calculator math uses APY as an effective annual yield estimate.',
    disclaimer: 'This tool illustrates ladder mechanics. APY values can change. Results are estimates.',
    customRatesNote: 'Rates entered here are for illustration only and are not AGFinancial posted APY values or guarantees.',
    resultsTitle: 'Ladder Breakdown',
    downloadTitle: 'Download your laddering sample.',
    downloadBody: 'Provide your name and email to get your personalized laddering summary, including your inputs and yearly breakdown.',
    downloadButtonLabel: 'Download sample',
    discussTitle: 'Ready to discuss your investment possibilities?',
    discussBody: 'A member of our investments team will contact you, ready to guide you through the process.',
    discussButtonLabel: 'Send',
  },
  schema: {
    fields: sections.flatMap((section) => section.fields),
  },
  renderer: {
    buildRuntime: buildDynamicCalculatorCtaFromBlock,
  },
  editor: {
    sections,
    hudSectionIds: ['content', 'calculator', 'followup'],
    adminSectionIds: ['content', 'calculator', 'followup'],
  },
  validators: [
    (block) => Boolean(buildDynamicCalculatorCtaFromBlock(block)),
  ],
  styleScope: {
    rootClassName: 'investments-native-ladder-section',
    cssNamespace: 'calculator-cta',
  },
});
