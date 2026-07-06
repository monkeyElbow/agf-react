export const DEFAULT_INVESTMENTS_INTRO_HEADING = 'Invest like it matters. Because it does.';
export const DEFAULT_INVESTMENTS_INTRO_HEADING_HIGHLIGHTS = Object.freeze([
  Object.freeze({ text: 'Because it does.', className: 'is-atlantean' }),
]);
export const DEFAULT_INVESTMENTS_INTRO_HEADING_HIGHLIGHTS_JSON = '[{"text":"Because it does.","className":"is-atlantean"}]';
export const DEFAULT_INVESTMENTS_INTRO_BODY_TEXT = 'Your investment dollars don\'t just multiply; they multiply ministry impact. Every dollar you invest generates a strong return while funding church construction and ministry growth. When you invest like it matters, everything matters more.';
export const DEFAULT_INVESTMENTS_INTRO_BODY_HTML = `<p>${DEFAULT_INVESTMENTS_INTRO_BODY_TEXT}</p>`;
export const DEFAULT_INVESTMENTS_INTRO_EXTRA_LINE = 'That\'s the power of faith-driven investing.';

export const defaultInvestmentsIntroSettings = Object.freeze({
  heading: DEFAULT_INVESTMENTS_INTRO_HEADING,
  headingClassName: '',
  headingHighlightsJson: DEFAULT_INVESTMENTS_INTRO_HEADING_HIGHLIGHTS_JSON,
  bodyHtml: DEFAULT_INVESTMENTS_INTRO_BODY_HTML,
  body: '',
  justify: 'center',
  lineSpacing: 1.04,
  extraLine: DEFAULT_INVESTMENTS_INTRO_EXTRA_LINE,
  extraLineTone: '',
  bgTone: 'sand',
  textTone: 'dark',
  button1Label: '',
  button1Url: '',
  button1PageRef: '',
  button1Style: 'primary',
  button1Tone: 'atlantean',
  button1OpenInNewWindow: false,
  button2Label: '',
  button2Url: '',
  button2PageRef: '',
  button2Style: 'dark',
  button2Tone: 'super-grey',
  button2OpenInNewWindow: false,
});

export function buildDefaultInvestmentsIntroRuntime() {
  return Object.freeze({
    heading: defaultInvestmentsIntroSettings.heading,
    headingClassName: defaultInvestmentsIntroSettings.headingClassName,
    headingHighlights: DEFAULT_INVESTMENTS_INTRO_HEADING_HIGHLIGHTS,
    bodyHtml: defaultInvestmentsIntroSettings.bodyHtml,
    body: defaultInvestmentsIntroSettings.body,
    justify: defaultInvestmentsIntroSettings.justify,
    lineSpacing: defaultInvestmentsIntroSettings.lineSpacing,
    extraLine: defaultInvestmentsIntroSettings.extraLine,
    extraLineTone: defaultInvestmentsIntroSettings.extraLineTone,
    bgTone: defaultInvestmentsIntroSettings.bgTone,
    textTone: defaultInvestmentsIntroSettings.textTone,
  });
}

export function buildDefaultInvestmentsNativeIntro() {
  return Object.freeze({
    heading: defaultInvestmentsIntroSettings.heading,
    headingHighlights: DEFAULT_INVESTMENTS_INTRO_HEADING_HIGHLIGHTS,
    body: Object.freeze([DEFAULT_INVESTMENTS_INTRO_BODY_TEXT]),
    emphasis: DEFAULT_INVESTMENTS_INTRO_EXTRA_LINE,
    justify: defaultInvestmentsIntroSettings.justify,
    bgTone: defaultInvestmentsIntroSettings.bgTone,
    textTone: defaultInvestmentsIntroSettings.textTone,
  });
}
