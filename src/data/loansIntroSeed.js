import { buildDynamicIntroFromBlock } from '../lib/dynamicPageBlocks';
import { serializeLinkValue } from '../lib/linkValue';

export const DEFAULT_LOANS_INTRO_HEADING = 'The right loan can change everything.';
export const DEFAULT_LOANS_INTRO_BODY_TEXT = 'Your vision of reaching communities and changing lives drives us. As one of the nation\'s largest, most experienced church loan providers, we want to be part of your ministry. Let\'s take bold steps together for the Kingdom.';

export const defaultLoansIntroSettings = Object.freeze({
  heading: DEFAULT_LOANS_INTRO_HEADING,
  headingClassName: '',
  headingHighlightsJson: '',
  bodyHtml: `<p>${DEFAULT_LOANS_INTRO_BODY_TEXT}</p>`,
  body: '',
  justify: 'center',
  lineSpacing: 1.04,
  extraLine: '',
  extraLineTone: '',
  bgTone: 'blue',
  textTone: 'white',
  button1Label: 'Get started',
  button1LinkJson: serializeLinkValue({
    kind: 'internal',
    to: '/services/loans#form',
  }),
  button1Style: 'blue',
  button1Tone: 'atlantean',
  button2Label: '',
  button2Style: 'dark',
  button2Tone: 'super-grey',
});

export function buildDefaultLoansIntroRuntime() {
  return Object.freeze(buildDynamicIntroFromBlock({
    id: 'intro',
    kind: 'intro',
    mode: 'dynamic',
    settings: defaultLoansIntroSettings,
  }));
}
