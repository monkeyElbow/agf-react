import { buildDynamicBillboardFromBlock, buildDynamicIntroFromBlock } from '../lib/dynamicPageBlocks';

export const DEFAULT_RETIREMENT_INTRO_HEADING = 'Invest in tomorrow. Start today.';
export const DEFAULT_RETIREMENT_INTRO_BODY_TEXT = 'For decades, we\'ve helped build retirement strategies for ministers, ministry employees, churches, and organizations. Let\'s create yours.';
export const DEFAULT_RETIREMENT_INTRO_EXTRA_LINE = 'It\'s your ministry, your future, your plan.';

export const defaultRetirementIntroSettings = Object.freeze({
  heading: DEFAULT_RETIREMENT_INTRO_HEADING,
  headingClassName: '',
  headingHighlightsJson: '',
  bodyHtml: `<p>${DEFAULT_RETIREMENT_INTRO_BODY_TEXT}</p>`,
  body: '',
  justify: 'center',
  lineSpacing: 1.04,
  extraLine: DEFAULT_RETIREMENT_INTRO_EXTRA_LINE,
  extraLineTone: '',
  bgTone: 'blue',
  textTone: 'white',
  button1Label: '',
  button1Url: '',
  button1PageRef: '',
  button1Style: 'dark',
  button1Tone: 'super-grey',
  button1OpenInNewWindow: false,
  button2Label: '',
  button2Url: '',
  button2PageRef: '',
  button2Style: 'dark',
  button2Tone: 'super-grey',
  button2OpenInNewWindow: false,
});

export function buildDefaultRetirementIntroRuntime() {
  return Object.freeze(buildDynamicIntroFromBlock({
    id: 'intro',
    kind: 'intro',
    mode: 'dynamic',
    settings: defaultRetirementIntroSettings,
  }));
}

export function buildDefaultRetirementNativeIntro() {
  return Object.freeze({
    heading: DEFAULT_RETIREMENT_INTRO_HEADING,
    body: Object.freeze([DEFAULT_RETIREMENT_INTRO_BODY_TEXT]),
    emphasis: DEFAULT_RETIREMENT_INTRO_EXTRA_LINE,
    justify: defaultRetirementIntroSettings.justify,
    bgTone: defaultRetirementIntroSettings.bgTone,
    textTone: defaultRetirementIntroSettings.textTone,
    actions: Object.freeze([]),
  });
}

export const DEFAULT_RETIREMENT_BILLBOARD_TITLE = 'Retire a little every day.';
export const DEFAULT_RETIREMENT_BILLBOARD_TITLE_HIGHLIGHTS = Object.freeze([
  Object.freeze({ text: 'every day', className: 'is-mango' }),
]);
export const DEFAULT_RETIREMENT_BILLBOARD_TITLE_HIGHLIGHTS_JSON = '[{"text":"every day","className":"is-mango"}]';

export const defaultRetirementBillboardSettings = Object.freeze({
  title: DEFAULT_RETIREMENT_BILLBOARD_TITLE,
  titleClassName: '',
  titleHighlightsJson: DEFAULT_RETIREMENT_BILLBOARD_TITLE_HIGHLIGHTS_JSON,
  bodyHtml: '<h3>Starting now.</h3>',
  bgTone: 'white',
  textTone: 'dark',
  justify: 'right',
  scrollReveal: 'scale-up',
  lineSpacing: 0.95,
  titleFontFamily: 'helv',
  titleFontWeight: 700,
  titleSizeRem: 5.25,
  titleLetterSpacingEm: -0.03,
  buttonLabel: 'Reach my consultant',
  buttonUrl: '/services/retirement/retirement-consultants',
  buttonPageRef: '/services/retirement/retirement-consultants',
  buttonStyle: 'blue',
  buttonTone: 'atlantean',
  buttonOpenInNewWindow: false,
  contentMaxWidthPx: 1216,
  headlineMaxWidthPx: 560,
});

export function buildDefaultRetirementBillboardRuntime() {
  return Object.freeze(buildDynamicBillboardFromBlock({
    id: 'billboard',
    kind: 'billboard',
    mode: 'dynamic',
    settings: defaultRetirementBillboardSettings,
  }));
}

export const DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_TITLE = 'A rollover is easy. Smart, too.';
export const DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_TITLE_HIGHLIGHTS = Object.freeze([
  Object.freeze({ text: 'Smart, too.', className: 'is-melon' }),
]);
export const DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_TITLE_HIGHLIGHTS_JSON = '[{"text":"Smart, too.","className":"is-melon"}]';
export const DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_BODY_HTML = '<p>Rolling over your scattered retirement savings into a single AGFinancial 403(b) is surprisingly simple...and undeniably smart. One account. One login.</p>';

export const defaultRetirementRolloverBillboardSettings = Object.freeze({
  title: DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_TITLE,
  titleClassName: '',
  titleHighlightsJson: DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_TITLE_HIGHLIGHTS_JSON,
  bodyHtml: DEFAULT_RETIREMENT_ROLLOVER_BILLBOARD_BODY_HTML,
  bgTone: 'grey',
  textTone: 'white',
  justify: 'center',
  scrollReveal: 'scale-up',
  lineSpacing: 0.94,
  titleFontFamily: 'helv',
  titleFontWeight: 800,
  titleSizeRem: 4.4,
  titleLetterSpacingEm: -0.024,
  contentMaxWidthPx: 1080,
  buttonLabel: 'Start a rollover',
  buttonUrl: '/services/retirement/rollovers',
  buttonPageRef: '/services/retirement/rollovers',
  buttonStyle: 'blue',
  buttonTone: 'atlantean',
  buttonOpenInNewWindow: false,
});

export function buildDefaultRetirementRolloverBillboardRuntime() {
  return Object.freeze(buildDynamicBillboardFromBlock({
    id: 'rollover_billboard',
    kind: 'billboard',
    mode: 'dynamic',
    settings: defaultRetirementRolloverBillboardSettings,
  }));
}
