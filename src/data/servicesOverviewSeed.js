import { buildDynamicBillboardFromBlock } from '../lib/dynamicPageBlocks';

export const DEFAULT_SERVICES_INTRO_HEADING = 'A robust financial strategy for your ministry and your family.';
export const DEFAULT_SERVICES_INTRO_HIGHLIGHTS = Object.freeze([
  Object.freeze({ text: 'your ministry', className: 'is-atlantean' }),
  Object.freeze({ text: 'your family', className: 'is-gold' }),
]);
export const DEFAULT_SERVICES_INTRO_HIGHLIGHTS_JSON = JSON.stringify(DEFAULT_SERVICES_INTRO_HIGHLIGHTS);

export const defaultServicesIntroBillboardSettings = Object.freeze({
  title: DEFAULT_SERVICES_INTRO_HEADING,
  titleClassName: '',
  titleHighlightsJson: DEFAULT_SERVICES_INTRO_HIGHLIGHTS_JSON,
  subtitle: '',
  bodyHtml: '',
  body: '',
  bgTone: 'grey',
  textTone: 'white',
  justify: 'center',
  lineSpacing: 1.04,
  titleFontFamily: 'heading',
  titleFontWeight: 800,
  titleSizeRem: 4.3,
  titleLetterSpacingEm: -0.03,
});

export function buildDefaultServicesIntroRuntime() {
  const billboardRuntime = buildDynamicBillboardFromBlock({
    id: 'intro',
    kind: 'billboard',
    mode: 'dynamic',
    settings: defaultServicesIntroBillboardSettings,
  });
  return Object.freeze({
    heading: billboardRuntime?.title || DEFAULT_SERVICES_INTRO_HEADING,
    headingClassName: billboardRuntime?.titleClassName || '',
    headingHighlights: billboardRuntime?.titleHighlights || DEFAULT_SERVICES_INTRO_HIGHLIGHTS,
    bodyHtml: billboardRuntime?.bodyHtml || '',
    body: billboardRuntime?.body || '',
    extraLine: billboardRuntime?.subtitle || '',
    extraLineClassName: '',
    extraLineStyle: undefined,
    justify: billboardRuntime?.justify || defaultServicesIntroBillboardSettings.justify,
    lineSpacing: billboardRuntime?.lineSpacing || defaultServicesIntroBillboardSettings.lineSpacing,
    bgTone: billboardRuntime?.bgTone || defaultServicesIntroBillboardSettings.bgTone,
    textTone: billboardRuntime?.textTone || defaultServicesIntroBillboardSettings.textTone,
    actions: billboardRuntime?.actions || [],
  });
}

export function buildDefaultServicesNativeIntro() {
  return Object.freeze({
    heading: DEFAULT_SERVICES_INTRO_HEADING,
    headingHighlights: DEFAULT_SERVICES_INTRO_HIGHLIGHTS,
    justify: defaultServicesIntroBillboardSettings.justify,
    bgTone: defaultServicesIntroBillboardSettings.bgTone,
    textTone: defaultServicesIntroBillboardSettings.textTone,
  });
}
