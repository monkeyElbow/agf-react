import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BlockHudPanelHost from '../components/BlockHudPanelHost';
import BlockOwnershipOverlay, { getBlockOwnershipVisual } from '../components/BlockOwnershipOverlay';
import ColorPalette from '../components/ColorPalette';
import DynamicCtaSection from '../components/DynamicCtaSection';
import FrontHudAnchorTag from '../components/FrontHudAnchorTag';
import FrontHudPanelShell from '../components/FrontHudPanelShell';
import FrontHudPageWorkflow from '../components/FrontHudPageWorkflow';
import { HeroInlineLiveEditor, renderHeroRangesAsNodes } from '../components/HeroHudEditorShared';
import SafeRichText from '../components/SafeRichText';
import { ColumnsBlock } from '../components/blocks/PageBlocksRenderer';
import { getResourceArticleFeatureConfig } from '../data/resourceArticles';
import { inspectDynamicHeroSettings, useContentAdmin } from '../context/ContentAdminContext';
import { useFrontHud } from '../context/FrontHudContext';
import { useTestimonials } from '../context/TestimonialsContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import {
  applySelectionColor,
  extractHeroLineColorToken,
  parseHeroRangeHighlights,
  remapHighlightsJsonForTextChange,
  removeSelectionRange,
  replaceHeroLineColorClass,
} from '../lib/heroHudRanges';
import { logHeroDriftWarningOnce } from '../lib/heroDriftWarnings';
import {
  formatTestimonialAttribution,
  normalizeDisplayTestimonials,
  normalizeTestimonialsSelectionMode,
  parseTokenList,
  resolveTestimonialsBlockData,
} from '../lib/testimonials';
import {
  actionButtonClassName,
  buildDynamicBillboardFromBlock,
  buildDynamicHeroFromBlock,
  buildDynamicIntroFromBlock,
  buildDynamicSplitPanelFromBlock,
  heroAnimationClassForLine,
  isExternalLinkHref,
  renderTextWithHighlights,
} from '../lib/dynamicPageBlocks';
import { getTokenSwatch } from '../lib/colorSystem';
import { shouldRenderHeroInlineEditor } from '../lib/heroHudMode';

const testimonials = [
  {
    quote: '“I so appreciate AGFinancial for making sure our church team is set up for success.”',
    author: 'Russell Bryan Johnson, Lead Pastor, Pursuit NW',
  },
  {
    quote: 'AGFinancial is more than a financial institution. They are my partners and coworkers who are also involved in ministry, so they speak my language.',
    author: 'Nino Gonzales, Lead Pastor, Calvario City Church, FL',
  },
  {
    quote: '“I absolutely trust what they stand for. I trust the people who work there…professional, godly, friendly.”',
    author: 'Mike McClaflin, AGWM, Convoy of Hope',
  },
];
const RETIREMENT_TOP_3_ARTICLE_FEATURE = getResourceArticleFeatureConfig({
  slug: 'top-3-investing-mistakes-to-avoid',
  title: 'Top 3 investing mistakes to avoid...',
  fallbackImageAlt: 'Top 3 investing mistakes to avoid',
});

const states = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];
const retirementCtaStateOptions = states.map(([value, label]) => `${value}|${label}`).join('\n');
const defaultRetirementCtaSettings = {
  title: 'Imagine the possibilities.',
  titleClassName: '',
  titleHighlightsJson: '',
  bodyHtml: '',
  bgTone: 'white',
  submitLabel: 'Follow-up with me',
  successMessage: 'Thanks. We\'ll reach out soon.',
  salesforceUrl: '',
  field1Enabled: true,
  field1Type: 'text',
  field1Label: 'Name',
  field1Placeholder: '',
  field1Options: '',
  field1Required: true,
  field2Enabled: true,
  field2Type: 'email',
  field2Label: 'Email',
  field2Placeholder: '',
  field2Options: '',
  field2Required: true,
  field3Enabled: true,
  field3Type: 'tel',
  field3Label: 'Phone',
  field3Placeholder: '(555) 555-5555',
  field3Options: '',
  field3Required: false,
  field4Enabled: true,
  field4Type: 'select',
  field4Label: 'State',
  field4Placeholder: 'Select a State',
  field4Options: retirementCtaStateOptions,
  field4Required: true,
  field5Enabled: true,
  field5Type: 'textarea',
  field5Label: 'Message',
  field5Placeholder: 'What would you like to discuss?',
  field5Options: '',
  field5Required: false,
};

function normalizeRetirementCtaSettings(settings = {}) {
  const nextSettings = {
    ...defaultRetirementCtaSettings,
    ...(settings && typeof settings === 'object' ? settings : {}),
  };
  const field4Label = String(nextSettings.field4Label || '').trim().toLowerCase();
  const field4Type = String(nextSettings.field4Type || '').trim().toLowerCase();
  const hasLegacyMessageField = field4Label === 'message' || field4Type === 'textarea';
  const hasStateField = field4Type === 'select' && field4Label === 'state';

  nextSettings.bodyHtml = '';

  if (!hasStateField && hasLegacyMessageField) {
    nextSettings.field4Enabled = true;
    nextSettings.field4Type = 'select';
    nextSettings.field4Label = 'State';
    nextSettings.field4Placeholder = 'Select a State';
    nextSettings.field4Options = retirementCtaStateOptions;
    nextSettings.field4Required = true;
    nextSettings.field5Enabled = true;
    nextSettings.field5Type = 'textarea';
    nextSettings.field5Label = 'Message';
    nextSettings.field5Placeholder = 'What would you like to discuss?';
    nextSettings.field5Options = '';
    nextSettings.field5Required = false;
  }

  return nextSettings;
}

const RETIREMENT_HERO_HUD_PANEL_ID = 'retirement-hero';
const RETIREMENT_INTRO_HUD_PANEL_ID = 'retirement-intro';
const RETIREMENT_BILLBOARD_HUD_PANEL_ID = 'retirement-billboard';
const RETIREMENT_COLUMNS_MHA_HUD_PANEL_ID = 'retirement-columns-mha';
const RETIREMENT_CTA_HUD_PANEL_ID = 'retirement-cta';
const RETIREMENT_TESTIMONIALS_HUD_PANEL_ID = 'retirement-testimonials';
const RETIREMENT_SPLIT_PANEL_HUD_PANEL_ID = 'retirement-split-panel';
const RETIREMENT_HUD_PANEL_ID_BY_BLOCK_ID = {
  hero: RETIREMENT_HERO_HUD_PANEL_ID,
  intro: RETIREMENT_INTRO_HUD_PANEL_ID,
  billboard: RETIREMENT_BILLBOARD_HUD_PANEL_ID,
  columns_mha: RETIREMENT_COLUMNS_MHA_HUD_PANEL_ID,
  cta_form: RETIREMENT_CTA_HUD_PANEL_ID,
  testimonials: RETIREMENT_TESTIMONIALS_HUD_PANEL_ID,
  split_options: RETIREMENT_SPLIT_PANEL_HUD_PANEL_ID,
};
const RETIREMENT_HUD_ANCHOR_SELECTOR_BY_BLOCK_ID = {
  hero: '.service-native-hero',
  intro: '.service-native-intro',
  billboard: '.retirement-everyday',
  columns_mha: '.native-dynamic-columns[data-block-id="columns_mha"]',
  cta_form: '.native-dynamic-cta',
  testimonials: '.native-dynamic-testimonials, .test-dynamic-testimonials',
  split_options: '.retirement-accounts-section',
};
const DEFAULT_RETIREMENT_BILLBOARD_SETTINGS = {
  title: 'Retire a little every day.',
  titleClassName: '',
  titleHighlightsJson: '[{"text":"every day","className":"is-mango"}]',
  bodyHtml: '<h3>Starting now.</h3>',
  bgTone: 'white',
  textTone: 'dark',
  justify: 'center',
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
};
const DEFAULT_RETIREMENT_BILLBOARD = {
  title: 'Retire a little every day.',
  titleClassName: '',
  titleHighlights: [{ text: 'every day', className: 'is-mango' }],
  titleStyle: {
    lineHeight: 0.95,
    fontFamily: 'var(--ag-font-helv)',
    fontWeight: 700,
    fontSize: 'clamp(calc(5.25rem * 0.58), 8vw, 5.25rem)',
    letterSpacing: '-0.03em',
  },
  bodyHtml: '<h3>Starting now.</h3>',
  bgTone: 'white',
  textTone: 'dark',
  justify: 'center',
  action: {
    label: 'Reach my consultant',
    href: '/services/retirement/retirement-consultants',
    style: 'blue',
    tone: 'atlantean',
    openInNewWindow: false,
  },
};
const DEFAULT_RETIREMENT_SPLIT_PANEL_SETTINGS = {
  leftTitle: 'Individual Retirement Accounts (IRAs)',
  leftBodyHtml: '<p>An IRA (Individual Retirement Account) provides beneficial options, both now and in the future. We offer <strong>Traditional</strong> and <strong>Roth</strong> IRAs. Learn more about each below.</p>',
  leftBody: '',
  leftButtonLabel: 'Explore IRAs',
  leftButtonUrl: '/services/retirement/iras',
  leftButtonPageRef: '/services/retirement/iras',
  leftButtonOpenInNewWindow: false,
  rightTitle: 'Deferred Compensation Plan (409A)',
  rightBodyHtml: '<p>Available exclusively to ministers, ministry employees, and Qualified Church-Controlled Organizations (QCCO), this 409A plan allows participants to defer compensation above and beyond standard retirement contribution limits.</p>',
  rightBody: '',
  rightButtonLabel: 'Learn more',
  rightButtonUrl: '/services/retirement/409a',
  rightButtonPageRef: '/services/retirement/409a',
  rightButtonOpenInNewWindow: false,
};
const DEFAULT_RETIREMENT_INTRO_SETTINGS = {
  heading: 'Invest in tomorrow. Start today.',
  headingClassName: '',
  headingHighlightsJson: '',
  bodyHtml: '<p>For decades, we\'ve helped build retirement strategies for ministers, ministry employees, churches, and organizations. Let\'s create yours.</p>',
  body: '',
  justify: 'center',
  lineSpacing: 1.04,
  extraLine: 'It\'s your ministry, your future, your plan.',
  extraLineTone: '',
  bgTone: 'blue',
  textTone: 'white',
  button1Label: '',
  button1Url: '',
  button1PageRef: '',
  button1Style: 'dark',
  button1Tone: 'super-grey',
  button2Label: '',
  button2Url: '',
  button2PageRef: '',
  button2Style: 'dark',
  button2Tone: 'super-grey',
};
const RETIREMENT_HUD_BG_SWATCH_OPTIONS = [
  { value: 'white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #efefef 100%)' },
  { value: 'sand', label: 'Sand', swatch: 'linear-gradient(145deg, #f2eeeb 0%, #d9d3cb 100%)' },
  { value: 'blue', label: 'Blue', swatch: getTokenSwatch('blue') },
  { value: 'grey', label: 'Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
];
const RETIREMENT_HUD_TEXT_COLOR_OPTIONS = [
  { value: 'is-atlantean', label: 'Blue', swatch: getTokenSwatch('atlantean') },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
];
const RETIREMENT_HUD_TEXT_SWATCH_OPTIONS = [
  { value: 'dark', label: 'Dark', swatch: '#414042' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
  { value: 'blue', label: 'Blue', swatch: '#00adbb' },
];
const RETIREMENT_HUD_JUSTIFY_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];
const RETIREMENT_HUD_TITLE_FONT_OPTIONS = [
  { value: 'heading', label: 'Avenir' },
  { value: 'helv', label: 'Helvetica Neue' },
];
const RETIREMENT_HUD_TITLE_WEIGHT_OPTIONS = [600, 700, 800, 900];
const RETIREMENT_HUD_BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
];
const RETIREMENT_HUD_BUTTON_TONE_OPTIONS = [
  { value: 'atlantean', label: 'Blue', swatch: '#00adbb' },
  { value: 'super-grey', label: 'Super Grey', swatch: '#414042' },
  { value: 'mango', label: 'Mango', swatch: '#f6b146' },
  { value: 'melon', label: 'Melon', swatch: '#f48f7a' },
  { value: 'white', label: 'White', swatch: '#ffffff' },
];
const RETIREMENT_BUTTON_STYLE_SET = new Set(['blue', 'dark', 'outline']);
const RETIREMENT_BUTTON_TONE_SET = new Set(['atlantean', 'super-grey', 'mango', 'melon', 'white']);

function clampFrontHudOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 15;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function formatPhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (!digits) {
    return '';
  }
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function parseNumber(value) {
  return Number.parseFloat(String(value || '').replace(/,/g, '')) || 0;
}

function formatAmountInput(value) {
  const raw = String(value || '').replace(/[^\d.]/g, '');
  if (!raw) {
    return '';
  }
  const parts = raw.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function normalizeRetirementBillboardTextTone(value) {
  const token = String(value || '').trim().toLowerCase();
  return ['dark', 'white', 'blue'].includes(token) ? token : 'dark';
}

function normalizeRetirementBillboardLineSpacing(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.max(0.85, Math.min(1.25, Number(numeric.toFixed(2))));
}

function normalizeRetirementBillboardTitleFontFamily(value) {
  const token = String(value || '').trim().toLowerCase();
  return ['heading', 'helv'].includes(token) ? token : 'helv';
}

function normalizeRetirementBillboardTitleFontWeight(value, fontFamily = 'helv') {
  const numeric = Number(value);
  const fallback = fontFamily === 'helv' ? 700 : 800;
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const rounded = Math.round(numeric / 100) * 100;
  return Math.max(400, Math.min(900, rounded));
}

function normalizeRetirementBillboardTitleSizeRem(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 5.25;
  }
  return Math.max(2.4, Math.min(8, Number(numeric.toFixed(2))));
}

function normalizeRetirementBillboardLetterSpacingEm(value, fontFamily = 'helv') {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fontFamily === 'helv' ? -0.015 : -0.03;
  }
  return Math.max(-0.08, Math.min(0.04, Number(numeric.toFixed(3))));
}

function normalizeRetirementButtonStyle(value) {
  const token = String(value || '').trim().toLowerCase();
  return RETIREMENT_BUTTON_STYLE_SET.has(token) ? token : 'blue';
}

function normalizeRetirementButtonTone(value, fallback = 'atlantean') {
  const fallbackTone = RETIREMENT_BUTTON_TONE_SET.has(String(fallback || '').trim())
    ? String(fallback || '').trim()
    : 'atlantean';
  const token = String(value || '').trim().toLowerCase();
  return RETIREMENT_BUTTON_TONE_SET.has(token) ? token : fallbackTone;
}

function computeProjection(current, monthly, monthlyRate, months) {
  if (monthlyRate === 0) {
    return current + monthly * months;
  }
  return current * Math.pow(1 + monthlyRate, months)
    + monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

export default function RetirementPage() {
  const pageRef = useRef(null);
  const heroSectionRef = useRef(null);
  const introSectionRef = useRef(null);
  const billboardSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);
  const testimonialsSectionRef = useRef(null);
  const billboardTitleInputRef = useRef(null);
  const billboardBodyInputRef = useRef(null);
  const ctaTitleInputRef = useRef(null);
  const introHeadingInputRef = useRef(null);
  const introExtraLineInputRef = useRef(null);
  const introBodyInputRef = useRef(null);
  const heroLineInputRefs = useRef({ line1: null, line2: null, line3: null });
  const {
    blocksByPath,
    pageHierarchy,
    setActiveBlockLock = () => ({ ok: false }),
    getBlockCollaboration = () => null,
    devIdentity = null,
    claimBufferedBlockEdit = () => false,
    commitBlockSettingsPatch = () => false,
    registerExternalDraftFlushHandler = null,
  } = useContentAdmin();
  const { enabled: frontHudEnabled, opacity: frontHudOpacity } = useFrontHud();
  const { testimonials: testimonialsLibrary } = useTestimonials();
  useNativeEnhancements(pageRef);
  const [calc, setCalc] = useState({
    ageNow: '40',
    retireAge: '67',
    lifeExpectancy: '90',
    currentSavings: '50,000',
    monthlySavings: '500',
    desiredIncome: '60,000',
    socialSecurity: '20,000',
    growthRate: '6',
  });
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    organization: '',
    state: '',
    email: '',
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
  const [activeHudPanelId, setActiveHudPanelId] = useState('');
  const [heroSelection, setHeroSelection] = useState({
    line: '',
    start: 0,
    end: 0,
    text: '',
  });
  const [ctaTitleSelection, setCtaTitleSelection] = useState({
    start: 0,
    end: 0,
    text: '',
  });
  const [billboardTitleSelection, setBillboardTitleSelection] = useState({
    start: 0,
    end: 0,
    text: '',
  });
  const [heroActiveLine, setHeroActiveLine] = useState('line1');
  const [introHeadingSelection, setIntroHeadingSelection] = useState({ start: 0, end: 0, text: '' });
  const [introBodyMiniEditorEnabled, setIntroBodyMiniEditorEnabled] = useState(false);
  const managedBlocksSource = useMemo(
    () => (Array.isArray(blocksByPath?.['/services/retirement']) ? blocksByPath['/services/retirement'] : []),
    [blocksByPath],
  );
  const { blocks: managedBlocks, stageLocalBlockSetting, stageLocalBlockSettings } = useLocalBlockDrafts({
    pathname: '/services/retirement',
    blocks: managedBlocksSource,
    claimBufferedBlockEdit,
    commitBlockSettingsPatch,
    registerExternalDraftFlushHandler,
  });
  const heroBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'hero'
      && block?.kind === 'hero'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const introBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'intro'
      && block?.kind === 'intro'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const billboardBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'billboard'
      && block?.kind === 'billboard'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const columnsMhaBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'columns_mha'
      && block?.kind === 'columns'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const dynamicTestimonialsBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'testimonials'
      && block?.kind === 'testimonials'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const ctaBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'cta_form'
      && block?.kind === 'cta_form'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const splitPanelBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'split_options'
      && block?.kind === 'split_panel'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const testimonialsData = useMemo(
    () => resolveTestimonialsBlockData({
      block: dynamicTestimonialsBlock,
      library: testimonialsLibrary,
      fallbackItems: testimonials,
      defaultTag: 'retirement',
    }),
    [dynamicTestimonialsBlock, testimonialsLibrary],
  );
  const introHudSettings = useMemo(
    () => ({ ...DEFAULT_RETIREMENT_INTRO_SETTINGS, ...(introBlock?.settings && typeof introBlock.settings === 'object' ? introBlock.settings : {}) }),
    [introBlock],
  );
  const dynamicIntro = useMemo(() => {
    if (!introBlock) {
      return null;
    }
    return buildDynamicIntroFromBlock({
      ...introBlock,
      settings: introHudSettings,
    });
  }, [introBlock, introHudSettings]);
  const billboardHudSettings = useMemo(
    () => ({
      ...DEFAULT_RETIREMENT_BILLBOARD_SETTINGS,
      ...(billboardBlock?.settings && typeof billboardBlock.settings === 'object' ? billboardBlock.settings : {}),
    }),
    [billboardBlock],
  );
  const dynamicBillboard = useMemo(() => {
    if (!billboardBlock) {
      return null;
    }
    return buildDynamicBillboardFromBlock({
      ...billboardBlock,
      settings: billboardHudSettings,
    });
  }, [billboardBlock, billboardHudSettings]);
  const billboardSectionStyle = dynamicBillboard?.action
    ? { '--dynamic-billboard-padding-bottom': 'clamp(4.1rem, 8vw, 6.8rem)' }
    : undefined;
  const billboardRailStyle = dynamicBillboard?.contentMaxWidthPx
    ? { '--dynamic-billboard-max-width': `${dynamicBillboard.contentMaxWidthPx}px` }
    : undefined;
  const heroInspection = useMemo(
    () => inspectDynamicHeroSettings('/services/retirement', heroBlock?.settings),
    [heroBlock],
  );
  const heroHudSettings = heroInspection.normalizedSettings;
  const dynamicHero = useMemo(() => {
    if (!heroBlock) {
      return null;
    }
    return buildDynamicHeroFromBlock({
      ...heroBlock,
      settings: heroHudSettings,
    });
  }, [heroBlock, heroHudSettings]);
  const splitPanelRuntime = useMemo(
    () => buildDynamicSplitPanelFromBlock(splitPanelBlock || {
      id: 'split_options',
      kind: 'split_panel',
      mode: 'dynamic',
      settings: DEFAULT_RETIREMENT_SPLIT_PANEL_SETTINGS,
    }),
    [splitPanelBlock],
  );
  const heroHudLineHeight = Number.isFinite(Number(heroHudSettings.lineHeight))
    ? Number(heroHudSettings.lineHeight)
    : 0.9;
  const heroHudBgTone = String(heroHudSettings.bgTone || dynamicHero?.bgTone || 'white').trim() || 'white';
  const heroHudJustify = String(heroHudSettings.justify || dynamicHero?.justify || 'center').trim().toLowerCase() || 'center';
  const heroHudEditableLines = useMemo(() => {
    const candidateLines = [1, 2, 3].map((lineNumber) => {
      const lineKey = `line${lineNumber}`;
      const text = String(heroHudSettings[`${lineKey}Text`] || '');
      const className = String(heroHudSettings[`${lineKey}ClassName`] || '').trim();
      return {
        key: lineKey,
        label: `Line ${lineNumber}`,
        text,
        className: className || `line${lineNumber}`,
        lineColor: extractHeroLineColorToken(className),
        highlights: parseHeroRangeHighlights(heroHudSettings[`${lineKey}HighlightsJson`], text),
      };
    });

    const withText = candidateLines.filter((line) => String(line.text || '').trim());
    return withText.length ? withText : candidateLines.slice(0, 1);
  }, [heroHudSettings]);
  const heroActiveLineData = heroHudEditableLines.find((line) => line.key === heroActiveLine) || heroHudEditableLines[0] || null;

  useEffect(() => {
    logHeroDriftWarningOnce(heroInspection, 'Retirement hero');
  }, [heroInspection]);
  const introHudJustify = String(introHudSettings.justify || 'center').trim().toLowerCase() || 'center';
  const introHudLineSpacing = Number.isFinite(Number(introHudSettings.lineSpacing)) ? Number(introHudSettings.lineSpacing) : 1.04;
  const introHudBgTone = String(introHudSettings.bgTone || 'blue').trim().toLowerCase() || 'blue';
  const introHudTextTone = String(introHudSettings.textTone || 'white').trim().toLowerCase() || 'white';
  const introHudHeadingColor = String(introHudSettings.headingClassName || '').trim();
  const introHudExtraLineTone = String(introHudSettings.extraLineTone || '').trim();
  const billboardHudBgTone = String(billboardHudSettings.bgTone || 'white').trim().toLowerCase() || 'white';
  const billboardHudTextTone = normalizeRetirementBillboardTextTone(billboardHudSettings.textTone);
  const billboardHudJustify = String(billboardHudSettings.justify || 'center').trim().toLowerCase() || 'center';
  const billboardHudLineSpacing = normalizeRetirementBillboardLineSpacing(billboardHudSettings.lineSpacing);
  const billboardHudTitleFontFamily = normalizeRetirementBillboardTitleFontFamily(billboardHudSettings.titleFontFamily);
  const billboardHudTitleFontWeight = normalizeRetirementBillboardTitleFontWeight(
    billboardHudSettings.titleFontWeight,
    billboardHudTitleFontFamily,
  );
  const billboardHudTitleSizeRem = normalizeRetirementBillboardTitleSizeRem(billboardHudSettings.titleSizeRem);
  const billboardHudTitleLetterSpacingEm = normalizeRetirementBillboardLetterSpacingEm(
    billboardHudSettings.titleLetterSpacingEm,
    billboardHudTitleFontFamily,
  );
  const billboardHudTitleColor = extractHeroLineColorToken(String(billboardHudSettings.titleClassName || '').trim());
  const billboardHudButtonStyle = normalizeRetirementButtonStyle(billboardHudSettings.buttonStyle);
  const billboardHudButtonTone = normalizeRetirementButtonTone(
    billboardHudSettings.buttonTone,
    billboardHudButtonStyle === 'dark' ? 'super-grey' : 'atlantean',
  );
  const ctaHudSettings = useMemo(
    () => normalizeRetirementCtaSettings(ctaBlock?.settings),
    [ctaBlock],
  );
  const testimonialsHudSettings = dynamicTestimonialsBlock?.settings || {};
  const testimonialsHudSelectionMode = normalizeTestimonialsSelectionMode(testimonialsHudSettings.selectionMode);
  const testimonialsHudLibrary = useMemo(
    () => normalizeDisplayTestimonials(testimonialsLibrary),
    [testimonialsLibrary],
  );
  const testimonialsHudSelectedIds = useMemo(
    () => parseTokenList(testimonialsHudSettings.selectedIdsCsv),
    [testimonialsHudSettings.selectedIdsCsv],
  );
  const testimonialsHudFilterTags = useMemo(
    () => parseTokenList(testimonialsHudSettings.filterTagsCsv),
    [testimonialsHudSettings.filterTagsCsv],
  );
  const testimonialsHudAvailableTags = useMemo(() => {
    const tags = new Set();
    testimonialsHudLibrary.forEach((item) => {
      (Array.isArray(item?.tags) ? item.tags : []).forEach((tag) => {
        const token = parseTokenList(tag)[0];
        if (token) {
          tags.add(token);
        }
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [testimonialsHudLibrary]);
  const testimonialsHudResolved = useMemo(
    () => resolveTestimonialsBlockData({
      block: dynamicTestimonialsBlock,
      library: testimonialsHudLibrary,
      fallbackItems: [],
      fallbackFineprint: '',
      defaultTag: 'retirement',
    }),
    [dynamicTestimonialsBlock, testimonialsHudLibrary],
  );
  const testimonialsHudPreviewItems = Array.isArray(testimonialsHudResolved?.items)
    ? testimonialsHudResolved.items.slice(0, 4)
    : [];
  const frontHudOpacityRatio = clampFrontHudOpacity(frontHudOpacity) / 100;
  const hudPanels = useMemo(
    () => buildHudPanelsFromBlocks(managedBlocks, {
      panelIdById: RETIREMENT_HUD_PANEL_ID_BY_BLOCK_ID,
      anchorSelectorById: RETIREMENT_HUD_ANCHOR_SELECTOR_BY_BLOCK_ID,
    }),
    [managedBlocks],
  );
  const routeLinkOptions = useMemo(
    () => Object.values(pageHierarchy || {})
      .filter((page) => page && page.path && !page.path.startsWith('/admin/') && page.path !== '/search')
      .sort((a, b) => a.path.localeCompare(b.path)),
    [pageHierarchy],
  );
  const showFrontHud = frontHudEnabled && hudPanels.length > 0;
  const hasOpenHudPanel = showFrontHud && !hudDockCollapsed && Boolean(activeHudPanelId);
  const isHeroHudFocusTarget = hasOpenHudPanel && activeHudPanelId === RETIREMENT_HERO_HUD_PANEL_ID;
  const isIntroHudFocusTarget = hasOpenHudPanel && activeHudPanelId === RETIREMENT_INTRO_HUD_PANEL_ID;
  const isBillboardHudFocusTarget = hasOpenHudPanel && activeHudPanelId === RETIREMENT_BILLBOARD_HUD_PANEL_ID;
  const isCtaHudFocusTarget = hasOpenHudPanel && activeHudPanelId === RETIREMENT_CTA_HUD_PANEL_ID;
  const renderedBillboard = dynamicBillboard || DEFAULT_RETIREMENT_BILLBOARD;
  const renderedBillboardTitleStyle = {
    ...(renderedBillboard?.titleStyle || {}),
    letterSpacing: '-0.03em',
  };
  const activeHudPanel = useMemo(
    () => hudPanels.find((panel) => panel.id === activeHudPanelId) || null,
    [activeHudPanelId, hudPanels],
  );
  const hudPanelByBlockId = useMemo(() => (
    hudPanels.reduce((next, panel) => {
      const blockId = String(panel?.blockId || '').trim();
      if (blockId) {
        next[blockId] = panel;
      }
      return next;
    }, {})
  ), [hudPanels]);
  const activeHudBlockId = hasOpenHudPanel ? String(activeHudPanel?.blockId || activeHudPanel?.block?.id || '').trim() : '';
  const getHudBlockStateClassName = (blockId) => {
    const normalizedBlockId = String(blockId || '').trim();
    if (!hasOpenHudPanel || !normalizedBlockId) {
      return '';
    }
    return activeHudBlockId === normalizedBlockId ? ' is-hud-focus-target' : ' is-hud-dimmed';
  };
  const getOwnershipVisualForBlockId = (blockId) => {
    if (!showFrontHud || !blockId) {
      return { className: '', overlayLabel: '', overlayDetail: '', state: 'none', isOwnedByOther: false };
    }
    return getBlockOwnershipVisual(getBlockCollaboration('/services/retirement', blockId), devIdentity?.userId);
  };
  const {
    orderedPanels: orderedHudPanels,
    getDockTabDragProps,
    isPanelDragging,
    isPanelDragOver,
    getPanelDropPosition,
    isDockDragging,
  } = useHudDockOrder({
    panels: hudPanels,
    storageKey: 'retirement',
  });

  useEffect(() => {
    if (!showFrontHud) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
    }
  }, [showFrontHud]);

  const scrollToElement = (target, extraOffset = 8) => {
    if (!target || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const nav = document.querySelector('.site-nav');
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    });
  };

  const scrollToSelector = (selector) => {
    if (!selector || typeof document === 'undefined') {
      return;
    }
    const target = document.querySelector(selector);
    if (!target) {
      return;
    }
    scrollToElement(target);
  };

  const setHudPanelOpen = (panelId, anchorSelector, options = {}) => {
    const shouldScroll = options.scrollToTarget !== false;
    setHudDockCollapsed(false);
    setActiveHudPanelId(panelId);
    if (shouldScroll) {
      if (panelId === RETIREMENT_HERO_HUD_PANEL_ID) {
        scrollToElement(heroSectionRef.current);
        return;
      }
      scrollToSelector(anchorSelector);
    }
  };

  const openHudPanel = (panelId, anchorSelector) => {
    if (!hudDockCollapsed && activeHudPanelId === panelId) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      return;
    }
    setHudPanelOpen(panelId, anchorSelector);
  };

  const closeHudDock = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
  };
  const renderHudAnchor = (blockId) => {
    if (!showFrontHud) {
      return null;
    }
    const panel = hudPanelByBlockId[String(blockId || '').trim()];
    if (!panel) {
      return null;
    }
    return (
      <FrontHudAnchorTag
        label={panel.label}
        isActive={!hudDockCollapsed && activeHudPanelId === panel.id}
        onClick={() => openHudPanel(panel.id, panel.anchorSelector)}
        style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
      />
    );
  };
  const updateHeroSetting = (settingKey, settingValue) => {
    if (!heroBlock) {
      return;
    }
    stageLocalBlockSetting(heroBlock.id, settingKey, settingValue);
  };
  const updateHeroSettings = (settingsPatch) => {
    if (!heroBlock) {
      return;
    }
    stageLocalBlockSettings(heroBlock.id, settingsPatch);
  };
  const updateIntroSetting = (settingKey, settingValue) => {
    if (!introBlock) {
      return;
    }
    stageLocalBlockSetting(introBlock.id, settingKey, settingValue);
  };
  const updateBillboardSetting = (settingKey, settingValue) => {
    if (!billboardBlock) {
      return;
    }
    stageLocalBlockSetting(billboardBlock.id, settingKey, settingValue);
  };
  const updateCtaSetting = (settingKey, settingValue) => {
    if (!ctaBlock) {
      return;
    }
    stageLocalBlockSetting(ctaBlock.id, settingKey, settingValue);
  };
  const updateTestimonialsSetting = (settingKey, settingValue) => {
    if (!dynamicTestimonialsBlock) {
      return;
    }
    stageLocalBlockSetting(dynamicTestimonialsBlock.id, settingKey, settingValue);
  };
  const focusHudField = (fieldRef, options = {}) => {
    const field = fieldRef?.current;
    if (!field) {
      return;
    }
    const requestedStart = Number(options.selectionStart);
    const requestedEnd = Number(options.selectionEnd);
    const hasExplicitSelection = Number.isInteger(requestedStart) && Number.isInteger(requestedEnd);
    const caretMode = String(options.caret || 'end').trim().toLowerCase();
    window.requestAnimationFrame(() => {
      field.focus();
      if (typeof field.setSelectionRange === 'function') {
        const value = String(field.value || '');
        if (hasExplicitSelection) {
          const safeStart = Math.max(0, Math.min(requestedStart, value.length));
          const safeEnd = Math.max(safeStart, Math.min(requestedEnd, value.length));
          field.setSelectionRange(safeStart, safeEnd);
          return;
        }
        const paragraphEndIndex = value.search(/<\/p>/i);
        const caretPosition = caretMode === 'start'
          ? 0
          : (caretMode === 'paragraph-end' && paragraphEndIndex > -1 ? paragraphEndIndex : value.length);
        field.setSelectionRange(caretPosition, caretPosition);
      }
    });
  };
  const getSelectionOffsetsWithinElement = (element) => {
    if (!element || typeof window === 'undefined') {
      return null;
    }
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount < 1) {
      return null;
    }
    const range = selection.getRangeAt(0);
    if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) {
      return null;
    }
    const startRange = range.cloneRange();
    startRange.selectNodeContents(element);
    startRange.setEnd(range.startContainer, range.startOffset);
    const endRange = range.cloneRange();
    endRange.selectNodeContents(element);
    endRange.setEnd(range.endContainer, range.endOffset);
    const start = Math.max(0, startRange.toString().length);
    const end = Math.max(start, endRange.toString().length);
    return { start, end };
  };
  const captureIntroHeadingSelection = () => {
    const input = introHeadingInputRef.current;
    if (!input) {
      return;
    }
    const rawStart = Number(input.selectionStart);
    const rawEnd = Number(input.selectionEnd);
    if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
      return;
    }
    const start = Math.max(0, Math.min(rawStart, rawEnd));
    const end = Math.max(start, rawStart, rawEnd);
    const source = String(input.value || '');
    setIntroHeadingSelection({
      start,
      end,
      text: source.slice(start, end),
    });
  };
  const captureCtaTitleSelection = () => {
    const input = ctaTitleInputRef.current;
    if (!input) {
      return;
    }
    const rawStart = Number(input.selectionStart);
    const rawEnd = Number(input.selectionEnd);
    if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
      return;
    }
    const start = Math.max(0, Math.min(rawStart, rawEnd));
    const end = Math.max(start, Math.max(rawStart, rawEnd));
    const text = String(input.value || '').slice(start, end);
    setCtaTitleSelection({ start, end, text });
  };
  const captureBillboardTitleSelection = () => {
    const input = billboardTitleInputRef.current;
    if (!input) {
      return;
    }
    const rawStart = Number(input.selectionStart);
    const rawEnd = Number(input.selectionEnd);
    if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
      return;
    }
    const start = Math.max(0, Math.min(rawStart, rawEnd));
    const end = Math.max(start, Math.max(rawStart, rawEnd));
    const text = String(input.value || '').slice(start, end);
    setBillboardTitleSelection({ start, end, text });
  };
  const handleBillboardBodyEditIntent = (event) => {
    if (!showFrontHud || !billboardBlock) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setHudPanelOpen(RETIREMENT_BILLBOARD_HUD_PANEL_ID, '.retirement-everyday', { scrollToTarget: false });
    focusHudField(billboardBodyInputRef, { caret: 'paragraph-end' });
  };
  const handleBillboardTitleEditIntent = (event) => {
    if (!showFrontHud || !billboardBlock) {
      return;
    }
    const requestedSelection = event?.currentTarget
      ? getSelectionOffsetsWithinElement(event.currentTarget)
      : null;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setHudPanelOpen(RETIREMENT_BILLBOARD_HUD_PANEL_ID, '.retirement-everyday', { scrollToTarget: false });
    focusHudField(
      billboardTitleInputRef,
      requestedSelection
        ? { selectionStart: requestedSelection.start, selectionEnd: requestedSelection.end }
        : undefined,
    );
  };
  const handleIntroBodyEditIntent = (event) => {
    if (!showFrontHud || !introBlock) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setHudPanelOpen(RETIREMENT_INTRO_HUD_PANEL_ID, '.service-native-intro', { scrollToTarget: false });
    setIntroBodyMiniEditorEnabled(false);
    focusHudField(introBodyInputRef, { caret: 'paragraph-end' });
  };
  const handleIntroHeadingEditIntent = (event) => {
    if (!showFrontHud || !introBlock) {
      return;
    }
    const requestedSelection = event?.currentTarget
      ? getSelectionOffsetsWithinElement(event.currentTarget)
      : null;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setHudPanelOpen(RETIREMENT_INTRO_HUD_PANEL_ID, '.service-native-intro', { scrollToTarget: false });
    focusHudField(
      introHeadingInputRef,
      requestedSelection
        ? { selectionStart: requestedSelection.start, selectionEnd: requestedSelection.end }
        : undefined,
    );
  };
  const handleIntroExtraLineEditIntent = (event) => {
    if (!showFrontHud || !introBlock) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setHudPanelOpen(RETIREMENT_INTRO_HUD_PANEL_ID, '.service-native-intro', { scrollToTarget: false });
    focusHudField(introExtraLineInputRef);
  };
  const handleBodyEditKeyDown = (event, onActivate) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onActivate(event);
  };
  const setTestimonialsSelectedIds = (nextIds) => {
    const normalized = parseTokenList((Array.isArray(nextIds) ? nextIds : []).join(','));
    updateTestimonialsSetting('selectedIdsCsv', normalized.join(','));
    if (testimonialsHudSelectionMode !== 'manual') {
      updateTestimonialsSetting('selectionMode', 'manual');
    }
  };
  const toggleTestimonialsSelectedId = (id) => {
    const token = parseTokenList(id)[0];
    if (!token) {
      return;
    }
    const nextIds = testimonialsHudSelectedIds.includes(token)
      ? testimonialsHudSelectedIds.filter((entry) => entry !== token)
      : [...testimonialsHudSelectedIds, token];
    setTestimonialsSelectedIds(nextIds);
  };
  const setTestimonialsFilterTags = (nextTags) => {
    const normalized = parseTokenList((Array.isArray(nextTags) ? nextTags : []).join(','));
    updateTestimonialsSetting('filterTagsCsv', normalized.join(','));
  };
  const toggleTestimonialsFilterTag = (tag) => {
    const token = parseTokenList(tag)[0];
    if (!token) {
      return;
    }
    const nextTags = testimonialsHudFilterTags.includes(token)
      ? testimonialsHudFilterTags.filter((entry) => entry !== token)
      : [...testimonialsHudFilterTags, token];
    setTestimonialsFilterTags(nextTags);
  };
  const captureHeroSelection = (lineKey, interactionMeta = null) => {
    const meta = interactionMeta && typeof interactionMeta === 'object' ? interactionMeta : null;
    const metaStart = Number(meta?.selectionStart);
    const metaEnd = Number(meta?.selectionEnd);
    const metaValue = String(meta?.value || '');
    if (Number.isInteger(metaStart) && Number.isInteger(metaEnd)) {
      const start = Math.max(0, Math.min(metaStart, metaEnd));
      const end = Math.max(start, metaStart, metaEnd);
      setHeroSelection({
        line: lineKey,
        start,
        end,
        text: metaValue.slice(start, end),
      });
      return;
    }
    const input = heroLineInputRefs.current[lineKey];
    if (!input) {
      return;
    }
    const rawStart = Number(input.selectionStart);
    const rawEnd = Number(input.selectionEnd);
    if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
      return;
    }
    const start = Math.max(0, Math.min(rawStart, rawEnd));
    const end = Math.max(start, rawStart, rawEnd);
    const lineText = String(input.value || '');
    setHeroSelection({
      line: lineKey,
      start,
      end,
      text: lineText.slice(start, end),
    });
  };

  const handleHeroHudLineTextChange = (lineKey, value) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    const previousText = String(heroHudSettings[`${normalizedLineKey}Text`] || '');
    const nextText = String(value || '');
    updateHeroSettings({
      [`${normalizedLineKey}Text`]: nextText,
      [`${normalizedLineKey}HighlightsJson`]: remapHighlightsJsonForTextChange(
        heroHudSettings[`${normalizedLineKey}HighlightsJson`],
        previousText,
        nextText,
      ),
    });
    setHeroSelection((previous) => (
      previous.line === normalizedLineKey
        ? { line: normalizedLineKey, start: 0, end: 0, text: '' }
        : previous
    ));
  };

  const handleHeroLineInteract = (lineKey, interactionMeta) => {
    setHeroActiveLine(lineKey);
    setHudPanelOpen(RETIREMENT_HERO_HUD_PANEL_ID, '.service-native-hero', { scrollToTarget: false });
    captureHeroSelection(lineKey, interactionMeta);
  };

  const applyHeroLineColor = (lineKey, colorValue) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    const classNameKey = `${normalizedLineKey}ClassName`;
    const currentClassName = String(heroHudSettings[classNameKey] || '').trim() || normalizedLineKey;
    updateHeroSetting(classNameKey, replaceHeroLineColorClass(currentClassName, colorValue));
  };

  const applyHeroSelectionColor = (lineKey, colorValue) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    const lineText = String(heroHudSettings[`${normalizedLineKey}Text`] || '');
    const safeStart = Math.max(0, Math.min(Number(heroSelection.start) || 0, lineText.length));
    const safeEnd = Math.max(safeStart, Math.min(Number(heroSelection.end) || 0, lineText.length));
    if (safeEnd <= safeStart) {
      return;
    }
    const highlightsKey = `${normalizedLineKey}HighlightsJson`;
    updateHeroSetting(
      highlightsKey,
      applySelectionColor(
        heroHudSettings[highlightsKey],
        lineText,
        safeStart,
        safeEnd,
        colorValue,
      ),
    );
  };

  const removeHeroSpan = (lineKey, index) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    const lineText = String(heroHudSettings[`${normalizedLineKey}Text`] || '');
    const highlightsKey = `${normalizedLineKey}HighlightsJson`;
    updateHeroSetting(
      highlightsKey,
      removeSelectionRange(
        heroHudSettings[highlightsKey],
        lineText,
        index,
      ),
    );
  };

  const clearHeroLineSpans = (lineKey) => {
    const normalizedLineKey = lineKey === 'line2' || lineKey === 'line3' ? lineKey : 'line1';
    updateHeroSetting(`${normalizedLineKey}HighlightsJson`, '');
    setHeroSelection((previous) => (
      previous.line === normalizedLineKey
        ? { line: normalizedLineKey, start: 0, end: 0, text: '' }
        : previous
    ));
  };

  const applyIntroHeadingColor = (colorValue) => {
    updateIntroSetting('headingClassName', colorValue);
  };

  const applyIntroHeadingSelectionColor = (colorValue) => {
    const sourceText = String(introHudSettings.heading || '');
    const safeStart = Math.max(0, Math.min(Number(introHeadingSelection.start) || 0, sourceText.length));
    const safeEnd = Math.max(safeStart, Math.min(Number(introHeadingSelection.end) || 0, sourceText.length));
    if (safeEnd <= safeStart) {
      return;
    }
    updateIntroSetting(
      'headingHighlightsJson',
      applySelectionColor(
        introHudSettings.headingHighlightsJson,
        sourceText,
        safeStart,
        safeEnd,
        colorValue,
      ),
    );
  };

  const removeIntroHeadingSpan = (index) => {
    const sourceText = String(introHudSettings.heading || '');
    updateIntroSetting(
      'headingHighlightsJson',
      removeSelectionRange(
        introHudSettings.headingHighlightsJson,
        sourceText,
        index,
      ),
    );
  };

  const clearIntroHeadingSpans = () => {
    updateIntroSetting('headingHighlightsJson', '');
    setIntroHeadingSelection({ start: 0, end: 0, text: '' });
  };

  const calcResults = useMemo(() => {
    const ageNow = Number.parseInt(calc.ageNow, 10) || 0;
    const retireAge = Number.parseInt(calc.retireAge, 10) || 0;
    const lifeExpectancy = Number.parseInt(calc.lifeExpectancy, 10) || 0;
    const desiredIncome = parseNumber(calc.desiredIncome);
    const socialSecurity = parseNumber(calc.socialSecurity);
    const currentSavings = parseNumber(calc.currentSavings);
    const monthlySavings = parseNumber(calc.monthlySavings);
    const growthRate = (Number.parseFloat(calc.growthRate) || 0) / 100;

    const yearsToRetirement = Math.max(0, retireAge - ageNow);
    const monthsToRetirement = yearsToRetirement * 12;
    const yearsRetired = Math.max(0, lifeExpectancy - retireAge);
    const neededNestEgg = Math.max(0, desiredIncome - socialSecurity) * yearsRetired;
    const monthlyRate = growthRate / 12;
    const projectedSavings = computeProjection(currentSavings, monthlySavings, monthlyRate, monthsToRetirement);

    let extraNeeded = 0;
    if (monthsToRetirement > 0 && projectedSavings < neededNestEgg) {
      const gap = neededNestEgg - projectedSavings;
      extraNeeded = monthlyRate === 0
        ? gap / monthsToRetirement
        : (gap * monthlyRate) / (Math.pow(1 + monthlyRate, monthsToRetirement) - 1);
    }

    const labels = [];
    const projectedSeries = [];
    for (let year = 0; year <= yearsToRetirement; year += 1) {
      const months = year * 12;
      labels.push(String(ageNow + year));
      projectedSeries.push(computeProjection(currentSavings, monthlySavings, monthlyRate, months));
    }
    const neededSeries = new Array(labels.length).fill(neededNestEgg);

    const chartWidth = 860;
    const chartHeight = 320;
    const padTop = 16;
    const padRight = 14;
    const padBottom = 30;
    const padLeft = 64;
    const innerWidth = chartWidth - padLeft - padRight;
    const innerHeight = chartHeight - padTop - padBottom;

    const maxY = Math.max(neededNestEgg, ...projectedSeries, 1);
    const pointFor = (value, index, count) => {
      const xFactor = count > 1 ? index / (count - 1) : 0;
      const x = padLeft + (xFactor * innerWidth);
      const y = padTop + ((1 - (value / maxY)) * innerHeight);
      return `${x},${y}`;
    };

    const projectedPoints = projectedSeries.map((value, index) => (
      pointFor(value, index, projectedSeries.length)
    )).join(' ');
    const targetPoints = neededSeries.map((value, index) => (
      pointFor(value, index, neededSeries.length)
    )).join(' ');

    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const value = Math.round(maxY * (1 - ratio));
      return {
        value,
        y: padTop + (ratio * innerHeight),
      };
    });

    return {
      neededNestEgg: Math.max(0, Math.round(neededNestEgg)),
      projectedSavings: Math.max(0, Math.round(projectedSavings)),
      extraNeeded: Math.max(0, Math.round(extraNeeded)),
      growthPercent: (growthRate * 100).toFixed(1),
      labels,
      projectedPoints,
      targetPoints,
      yTicks,
      chartWidth,
      chartHeight,
      padLeft,
      padRight,
      padBottom,
      padTop,
    };
  }, [calc]);

  const onCalcNumberChange = (field, value) => {
    setCalc((prev) => ({ ...prev, [field]: value }));
  };

  const onCalcAmountChange = (field, value) => {
    setCalc((prev) => ({ ...prev, [field]: formatAmountInput(value) }));
  };

  const onLeadSubmit = (event) => {
    event.preventDefault();
    if (!leadForm.name.trim() || !leadForm.email.trim()) {
      return;
    }
    setLeadSubmitted(true);
    setLeadForm({
      name: '',
      phone: '',
      organization: '',
      state: '',
      email: '',
    });
  };

  const dollars = (value) => value.toLocaleString();

  return (
    <div
      ref={pageRef}
      className={`service-native-page retirement-native-page${showFrontHud ? ' is-front-hud-docked' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}`}
    >
      {showFrontHud ? (
        <aside className={`admin-front-hud-dock${hudDockCollapsed ? ' is-collapsed' : ''}`} aria-label="Front HUD editor panels">
          <div className={`admin-front-hud-dock-tabs${isDockDragging ? ' is-drag-active' : ''}`}>
            {orderedHudPanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`admin-front-hud-dock-tab${!hudDockCollapsed && activeHudPanel?.id === panel.id ? ' is-active' : ''}${isPanelDragging(panel.id) ? ' is-dragging' : ''}${isPanelDragOver(panel.id) ? ' is-drag-over' : ''}${getPanelDropPosition(panel.id) ? ` is-drop-${getPanelDropPosition(panel.id)}` : ''}`}
                onClick={() => openHudPanel(panel.id, panel.anchorSelector)}
                aria-label={`Edit ${panel.label}`}
                title={`Edit ${panel.label}`}
                {...getDockTabDragProps(panel.id)}
              >
                <img src={panel.icon} alt="" aria-hidden="true" className="admin-front-hud-dock-tab-icon" />
                <span className="admin-front-hud-visually-hidden">{panel.label}</span>
              </button>
            ))}
          </div>
          <div className="admin-front-hud-dock-actions">
            <button
              type="button"
              className="admin-front-hud-dock-collapse"
              onClick={() => setHudDockCollapsed((current) => !current)}
              aria-label={hudDockCollapsed ? 'Show panels' : 'Hide panels'}
              title={hudDockCollapsed ? 'Show panels' : 'Hide panels'}
            >
              {hudDockCollapsed ? '▢' : '×'}
            </button>
          </div>
        </aside>
      ) : null}
      {showFrontHud ? (
        <FrontHudPageWorkflow pathname="/services/retirement" reviewHref="/admin/content?page=%2Fservices%2Fretirement" placement="bar" />
      ) : null}
      {hasOpenHudPanel && activeHudPanel ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          onClose={closeHudDock}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
        >
          <BlockHudPanelHost
            block={activeHudPanel.block}
            pathname="/services/retirement"
            routeOptions={routeLinkOptions}
            testimonialsLibrary={testimonialsLibrary}
            ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
            onOwnershipAction={() => {
              if (!activeHudPanel?.block?.id) {
                return;
              }
              setActiveBlockLock('/services/retirement', activeHudPanel.block.id, { force: true });
            }}
            onSettingChange={(settingKey, nextValue) => stageLocalBlockSetting(activeHudPanel.block.id, settingKey, nextValue)}
          />
        </FrontHudPanelShell>
      ) : null}
      <section
        ref={heroSectionRef}
        className={`service-native-hero${dynamicHero ? ` is-bg-${dynamicHero.bgTone || 'white'} is-justify-${dynamicHero.justify || 'center'}` : ''}${showFrontHud ? ' has-admin-front-hud' : ''}${hasOpenHudPanel ? (isHeroHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed') : ''}${getOwnershipVisualForBlockId('hero').className || ''}`}
        data-block-id="hero"
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('hero')} />
        {renderHudAnchor('hero')}
        <div className="ag-panel-rail">
          {shouldRenderHeroInlineEditor({
            hudEnabled: showFrontHud,
            hasDynamicHero: Boolean(heroBlock),
            activeHudPanelId,
            heroHudPanelId: RETIREMENT_HERO_HUD_PANEL_ID,
          }) ? (
            <HeroInlineLiveEditor
              lines={heroHudEditableLines}
              activeLineKey={heroActiveLineData?.key || ''}
              lineHeight={heroHudLineHeight}
              onLineTextChange={handleHeroHudLineTextChange}
              onLineInteract={handleHeroLineInteract}
              setLineInputRef={(lineKey, node) => {
                heroLineInputRefs.current[lineKey] = node;
              }}
              renderLineContent={(line) => renderHeroRangesAsNodes(line.text, line.highlights)}
              resolveLineClassName={(line, index) => line.className || `line${index + 1}`}
            />
          ) : dynamicHero?.lines?.length ? dynamicHero.lines.map((line, index) => {
            const animationClass = heroAnimationClassForLine(dynamicHero.animationPreset, index + 1);
            const className = [line.className, animationClass].filter(Boolean).join(' ');
            return (
              <h1
                key={`retirement-hero-line-${line.id || index + 1}`}
                className={className || undefined}
                style={{
                  lineHeight: dynamicHero.lineHeight,
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: renderTextWithHighlights(line.text, line.highlights) }} />
              </h1>
            );
          }) : (
            <>
              <h1 className="retirement-native-hero-line line1">
                Your <mark>future</mark>.
              </h1>
              <h1 className="retirement-native-hero-line line2">
                Your <mark className="is-mango">plan</mark>.
              </h1>
            </>
          )}
        </div>
      </section>

      <section
        ref={introSectionRef}
        className={`service-native-intro retirement-native-intro${dynamicIntro ? ` dynamic-intro is-bg-${dynamicIntro.bgTone || 'white'} is-text-${dynamicIntro.textTone || 'dark'}` : ''}${showFrontHud ? ' has-admin-front-hud' : ''}${hasOpenHudPanel ? (isIntroHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed') : ''}${getOwnershipVisualForBlockId('intro').className || ''}`}
        data-block-id="intro"
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('intro')} />
        {renderHudAnchor('intro')}
        <div className="ag-panel-rail">
          <div
            className={`service-native-intro-copy is-justify-${dynamicIntro?.justify || 'center'}`}
            style={{ '--intro-heading-line-height': dynamicIntro?.lineSpacing || 1.04 }}
          >
            <h2
              className={`${dynamicIntro?.headingClassName || ''}${showFrontHud && introBlock ? ' admin-front-hud-click-edit-target' : ''}`.trim() || undefined}
              onClick={showFrontHud && introBlock ? handleIntroHeadingEditIntent : undefined}
              onKeyDown={showFrontHud && introBlock ? (event) => handleBodyEditKeyDown(event, handleIntroHeadingEditIntent) : undefined}
              role={showFrontHud && introBlock ? 'button' : undefined}
              tabIndex={showFrontHud && introBlock ? 0 : undefined}
              aria-label={showFrontHud && introBlock ? 'Edit intro heading' : undefined}
            >
              {dynamicIntro ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: renderTextWithHighlights(dynamicIntro.heading, dynamicIntro.headingHighlights),
                  }}
                />
              ) : 'Invest in tomorrow. Start today.'}
            </h2>
            {dynamicIntro?.bodyHtml ? (
              <SafeRichText
                as="div"
                className={`native-info-rich-html${showFrontHud && introBlock ? ' admin-front-hud-click-edit-target' : ''}`}
                html={dynamicIntro.bodyHtml}
                onClick={showFrontHud && introBlock ? handleIntroBodyEditIntent : undefined}
                onKeyDown={showFrontHud && introBlock ? (event) => handleBodyEditKeyDown(event, handleIntroBodyEditIntent) : undefined}
                role={showFrontHud && introBlock ? 'button' : undefined}
                tabIndex={showFrontHud && introBlock ? 0 : undefined}
                aria-label={showFrontHud && introBlock ? 'Edit intro body HTML' : undefined}
              />
            ) : (
              <p
                className={showFrontHud && introBlock ? 'admin-front-hud-click-edit-target' : undefined}
                onClick={showFrontHud && introBlock ? handleIntroBodyEditIntent : undefined}
                onKeyDown={showFrontHud && introBlock ? (event) => handleBodyEditKeyDown(event, handleIntroBodyEditIntent) : undefined}
                role={showFrontHud && introBlock ? 'button' : undefined}
                tabIndex={showFrontHud && introBlock ? 0 : undefined}
                aria-label={showFrontHud && introBlock ? 'Edit intro body HTML' : undefined}
              >
                Retirement is your future. It’s where your career journey leads. For decades, we’ve helped build thoughtful retirement plans for individuals, churches, and other ministries.
              </p>
            )}
            {dynamicIntro?.extraLine ? (
              <p
                className={`${dynamicIntro?.extraLineClassName || ''}${showFrontHud && introBlock ? ' admin-front-hud-click-edit-target' : ''}`.trim() || undefined}
                style={dynamicIntro?.extraLineStyle}
                onClick={showFrontHud && introBlock ? handleIntroExtraLineEditIntent : undefined}
                onKeyDown={showFrontHud && introBlock ? (event) => handleBodyEditKeyDown(event, handleIntroExtraLineEditIntent) : undefined}
                role={showFrontHud && introBlock ? 'button' : undefined}
                tabIndex={showFrontHud && introBlock ? 0 : undefined}
                aria-label={showFrontHud && introBlock ? 'Edit intro extra line' : undefined}
              >
                <strong>{dynamicIntro.extraLine}</strong>
              </p>
            ) : (
              <p
                className={showFrontHud && introBlock ? 'admin-front-hud-click-edit-target' : undefined}
                onClick={showFrontHud && introBlock ? handleIntroExtraLineEditIntent : undefined}
                onKeyDown={showFrontHud && introBlock ? (event) => handleBodyEditKeyDown(event, handleIntroExtraLineEditIntent) : undefined}
                role={showFrontHud && introBlock ? 'button' : undefined}
                tabIndex={showFrontHud && introBlock ? 0 : undefined}
                aria-label={showFrontHud && introBlock ? 'Edit intro extra line' : undefined}
              >
                <strong>It's your ministry, your future, your plan.</strong>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="service-native-section retirement-plan-section">
        <div className="ag-panel-rail-wide">
          <div className="retirement-plan-intro">
            <h2 className="retirement-plan-heading">AGFinancial 403(b) Retirement Plan</h2>
            <h3 className="retirement-plan-subheading">Smart benefits, strong advantages</h3>
            <p className="retirement-plan-lead">
              The <strong>AGFinancial</strong> flagship retirement plan is customized specifically for ministers and ministry or organization employees. This is a plan exempt from ERISA. Choose from a variety of strategies.
            </p>
          </div>
          <h4 className="retirement-plan-footer">
            Includes minister&apos;s housing allowance, and more.
          </h4>
          <div className="service-native-action-row retirement-plan-actions">
            <Link to="/services/retirement/403b" className="service-native-btn">Explore 403(b)</Link>
          </div>
        </div>
      </section>

      {splitPanelRuntime ? (
        <section
          className={`service-native-section retirement-accounts-section${getHudBlockStateClassName('split_options')}${getOwnershipVisualForBlockId('split_options').className || ''}`}
          data-block-id="split_options"
        >
          <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('split_options')} />
          {renderHudAnchor('split_options')}
          <div className="ag-panel-rail">
            <div className="service-native-grid is-two retirement-account-grid">
              {splitPanelRuntime.items.map((item) => {
                const action = item.action || null;
                const actionTarget = action?.to || action?.href || '';
                const isInternal = Boolean(action?.to || (action?.href && !isExternalLinkHref(action.href) && action.href.startsWith('/')));

                return (
                  <article key={`split-panel-${item.side || item.slot}`} className="retirement-account-card fade-up">
                    {item.title ? <h3>{item.title}</h3> : null}
                    {item.bodyHtml ? (
                      <SafeRichText as="div" className="retirement-account-body" html={item.bodyHtml} />
                    ) : item.body ? (
                      <p>{item.body}</p>
                    ) : null}
                    {action ? (
                      <div className="service-native-action-row">
                        {isInternal ? (
                          <Link
                            to={actionTarget}
                            className="service-native-btn"
                            target={action.openInNewWindow ? '_blank' : undefined}
                            rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
                          >
                            {action.label}
                          </Link>
                        ) : (
                          <a
                            href={actionTarget}
                            className="service-native-btn"
                            target={action.openInNewWindow ? '_blank' : undefined}
                            rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
                          >
                            {action.label}
                          </a>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="service-native-section retirement-calc-section" id="retirement-savings-calculator">
        <div className="ag-panel-rail">
          <div className="retirement-calc-intro">
            <h2 className="retirement-calc-title">Retirement Savings Calculator</h2>
            <p className="retirement-calc-lead">Plug in some numbers. Take a sneak peek at your financial future.</p>
          </div>

          <div className="retirement-calc-box fade-up">
            <div className="retirement-calc-grid">
                  <label>
                    Current Age
                    <input type="number" value={calc.ageNow} onChange={(e) => onCalcNumberChange('ageNow', e.target.value)} />
                  </label>
                  <label>
                    Retirement Age
                    <input type="number" value={calc.retireAge} onChange={(e) => onCalcNumberChange('retireAge', e.target.value)} />
                  </label>
                  <label>
                    Life Expectancy
                    <input type="number" value={calc.lifeExpectancy} onChange={(e) => onCalcNumberChange('lifeExpectancy', e.target.value)} />
                  </label>
                  <label>
                    Current Retirement Savings ($)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={calc.currentSavings}
                      onChange={(e) => onCalcAmountChange('currentSavings', e.target.value)}
                    />
                  </label>
                  <label>
                    Monthly Contributions ($)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={calc.monthlySavings}
                      onChange={(e) => onCalcAmountChange('monthlySavings', e.target.value)}
                    />
                  </label>
                  <label>
                    Desired Annual Retirement Income ($)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={calc.desiredIncome}
                      onChange={(e) => onCalcAmountChange('desiredIncome', e.target.value)}
                    />
                  </label>
                  <label>
                    Expected Annual Social Security ($)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={calc.socialSecurity}
                      onChange={(e) => onCalcAmountChange('socialSecurity', e.target.value)}
                    />
                  </label>
                  <label>
                    Expected Annual Return (%): <strong>{calcResults.growthPercent}</strong>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.1"
                      value={calc.growthRate}
                      onChange={(e) => onCalcNumberChange('growthRate', e.target.value)}
                    />
                  </label>
                </div>

            <div className="retirement-calc-results">
              <h3>Results</h3>
              <p className="retirement-calc-result-row">
                <span>Total Needed at Retirement:</span>
                <strong>${dollars(calcResults.neededNestEgg)}</strong>
              </p>
              <p className="retirement-calc-result-row">
                <span>Projected Savings at Retirement:</span>
                <strong>${dollars(calcResults.projectedSavings)}</strong>
              </p>
              <p className="retirement-calc-result-row">
                <span>Additional Monthly Savings Needed:</span>
                <strong>${dollars(calcResults.extraNeeded)}</strong>
              </p>

              <div className="retirement-calc-chart" aria-hidden="true">
                <svg viewBox={`0 0 ${calcResults.chartWidth} ${calcResults.chartHeight}`} role="img" aria-label="Retirement projection chart">
                  <line
                    x1={calcResults.padLeft}
                    y1={calcResults.chartHeight - calcResults.padBottom}
                    x2={calcResults.chartWidth - calcResults.padRight}
                    y2={calcResults.chartHeight - calcResults.padBottom}
                    stroke="#d3d8dd"
                    strokeWidth="1"
                  />
                  {calcResults.yTicks.map((tick) => (
                    <g key={tick.value}>
                      <line
                        x1={calcResults.padLeft}
                        y1={tick.y}
                        x2={calcResults.chartWidth - calcResults.padRight}
                        y2={tick.y}
                        stroke="#edf1f4"
                        strokeWidth="1"
                      />
                      <text
                        x={calcResults.padLeft - 10}
                        y={tick.y + 4}
                        textAnchor="end"
                        fontSize="12"
                        fill="#6a7480"
                      >
                        ${tick.value.toLocaleString()}
                      </text>
                    </g>
                  ))}
                  <polyline
                    fill="none"
                    stroke="#00A3B3"
                    strokeWidth="3"
                    points={calcResults.projectedPoints}
                  />
                  <polyline
                    fill="none"
                    stroke="#FFA400"
                    strokeWidth="3"
                    points={calcResults.targetPoints}
                  />
                  {calcResults.labels.length > 0 ? (
                    <>
                      <text
                        x={calcResults.padLeft}
                        y={calcResults.chartHeight - 8}
                        textAnchor="start"
                        fontSize="12"
                        fill="#6a7480"
                      >
                        Age {calcResults.labels[0]}
                      </text>
                      <text
                        x={calcResults.chartWidth - calcResults.padRight}
                        y={calcResults.chartHeight - 8}
                        textAnchor="end"
                        fontSize="12"
                        fill="#6a7480"
                      >
                        Age {calcResults.labels[calcResults.labels.length - 1]}
                      </text>
                    </>
                  ) : null}
                </svg>
                <div className="retirement-calc-legend">
                  <span className="is-projected">Projected balance</span>
                  <span className="is-target">Target at retirement</span>
                </div>
              </div>
            </div>

            <div className="retirement-lead-form">
              <h5>Ready to take the next step?</h5>
              <p>Enter your info below to start a chat about your retirement.</p>
              {leadSubmitted ? (
                <p className="retirement-lead-thanks">
                  Thanks for reaching out! A retirement advisor will review your info and follow up shortly.
                </p>
              ) : (
                <form onSubmit={onLeadSubmit}>
                  <div className="retirement-calc-grid">
                    <label>
                      Name
                      <input
                        type="text"
                        value={leadForm.name}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        type="tel"
                        value={leadForm.phone}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: formatPhoneInput(event.target.value) }))}
                      />
                    </label>
                    <label>
                      Organization
                      <input
                        type="text"
                        value={leadForm.organization}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, organization: event.target.value }))}
                      />
                    </label>
                    <label>
                      State
                      <select
                        value={leadForm.state}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, state: event.target.value }))}
                      >
                        <option value="">State</option>
                        {states.map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="retirement-calc-grid-span">
                      Email
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                        required
                      />
                    </label>
                  </div>
                  <div className="service-native-action-row">
                    <button type="submit" className="service-native-btn retirement-btn-reset">Send</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        ref={billboardSectionRef}
        className={`service-native-section retirement-everyday is-bg-${renderedBillboard.bgTone || 'white'} is-text-${renderedBillboard.textTone || 'dark'}${showFrontHud && billboardBlock ? ' has-admin-front-hud' : ''}${hasOpenHudPanel ? (isBillboardHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed') : ''}${getOwnershipVisualForBlockId('billboard').className || ''}`}
        data-block-id="billboard"
        style={billboardSectionStyle || undefined}
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('billboard')} />
        {renderHudAnchor('billboard')}
        <div className="ag-panel-rail" style={billboardRailStyle || undefined}>
          <div className={`native-info-section-copy is-justify-${renderedBillboard.justify || 'center'}`}>
            <h2
              className={`${renderedBillboard.titleClassName || ''}${showFrontHud && billboardBlock ? ' admin-front-hud-click-edit-target' : ''}`.trim() || undefined}
              style={renderedBillboardTitleStyle}
              onClick={showFrontHud && billboardBlock ? handleBillboardTitleEditIntent : undefined}
              onKeyDown={showFrontHud && billboardBlock ? (event) => handleBodyEditKeyDown(event, handleBillboardTitleEditIntent) : undefined}
              role={showFrontHud && billboardBlock ? 'button' : undefined}
              tabIndex={showFrontHud && billboardBlock ? 0 : undefined}
              aria-label={showFrontHud && billboardBlock ? 'Edit retirement billboard title' : undefined}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: renderTextWithHighlights(renderedBillboard.title, renderedBillboard.titleHighlights),
                }}
              />
            </h2>
            {renderedBillboard.bodyHtml ? (
              <SafeRichText
                as="div"
                className={`native-info-rich-html${showFrontHud && billboardBlock ? ' admin-front-hud-click-edit-target' : ''}`}
                html={renderedBillboard.bodyHtml}
                onClick={showFrontHud && billboardBlock ? handleBillboardBodyEditIntent : undefined}
                onKeyDown={showFrontHud && billboardBlock ? (event) => handleBodyEditKeyDown(event, handleBillboardBodyEditIntent) : undefined}
                role={showFrontHud && billboardBlock ? 'button' : undefined}
                tabIndex={showFrontHud && billboardBlock ? 0 : undefined}
                aria-label={showFrontHud && billboardBlock ? 'Edit retirement billboard body HTML' : undefined}
              />
            ) : null}
            {renderedBillboard.action ? (
              <div className={`service-native-action-row${(renderedBillboard.justify || 'center') === 'center' ? ' is-centered' : ''}${(renderedBillboard.justify || 'center') === 'right' ? ' is-right' : ''}`}>
                {(renderedBillboard.action.to
                || (renderedBillboard.action.href
                && !isExternalLinkHref(renderedBillboard.action.href)
                && renderedBillboard.action.href.startsWith('/'))) ? (
                  <Link
                    to={renderedBillboard.action.to || renderedBillboard.action.href}
                    className={actionButtonClassName(renderedBillboard.action.style, renderedBillboard.action.tone)}
                    target={renderedBillboard.action.openInNewWindow ? '_blank' : undefined}
                    rel={renderedBillboard.action.openInNewWindow ? 'noreferrer noopener' : undefined}
                  >
                    {renderedBillboard.action.label}
                  </Link>
                  ) : (
                    <a
                      href={renderedBillboard.action.href || renderedBillboard.action.to}
                      className={actionButtonClassName(renderedBillboard.action.style, renderedBillboard.action.tone)}
                      target={renderedBillboard.action.openInNewWindow ? '_blank' : undefined}
                      rel={renderedBillboard.action.openInNewWindow ? 'noreferrer noopener' : undefined}
                    >
                      {renderedBillboard.action.label}
                    </a>
                  )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {columnsMhaBlock ? (
        <ColumnsBlock
          block={columnsMhaBlock}
          resolveTo={(value) => value}
          ownership={getOwnershipVisualForBlockId('columns_mha')}
          hudAnchor={renderHudAnchor('columns_mha')}
          extraSectionClassName={getHudBlockStateClassName('columns_mha')}
        />
      ) : null}

      <div ref={ctaSectionRef}>
        <DynamicCtaSection
          managedBlocks={managedBlocks}
          defaultSettings={defaultRetirementCtaSettings}
          sectionClassName="service-native-section retirement-addon-wrap"
          sectionHudClassName={hasOpenHudPanel ? (isCtaHudFocusTarget ? 'is-hud-focus-target' : 'is-hud-dimmed') : ''}
          ownership={getOwnershipVisualForBlockId('cta_form')}
          hudAnchor={renderHudAnchor('cta_form')}
          formWrapperClassName="retirement-addon-box"
          submitButtonClassName="service-native-btn retirement-btn-reset"
          fieldIdPrefix="retirement-connect"
          titlePlacement="inside"
        />
      </div>

      <section
        ref={testimonialsSectionRef}
        className={`service-native-section retirement-testimonials${getHudBlockStateClassName('testimonials')}${getOwnershipVisualForBlockId('testimonials').className || ''}`}
        data-block-id="testimonials"
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('testimonials')} />
        {renderHudAnchor('testimonials')}
        <div className="ag-panel-rail">
          <div className="carousel-stack">
            {testimonialsData.items.length ? testimonialsData.items.map((item, index) => (
              <article key={`${item.author}-${item.quote.slice(0, 24)}`} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p className="retirement-testimonial-quote"><strong>{item.quote}</strong></p>
                <p className="retirement-testimonial-author">-<strong>{item.author}</strong></p>
              </article>
            )) : showFrontHud ? (
              <article className="carousel-frame is-active">
                <p className="retirement-testimonial-quote"><strong>No testimonials selected yet.</strong></p>
                <p className="retirement-testimonial-author"><strong>Choose quotes in the HUD selector.</strong></p>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      {testimonialsData.showFineprint ? (
        <section className="service-native-section retirement-fineprint">
          <div className="ag-panel-rail">
            <p className="service-native-note">{testimonialsData.fineprint}</p>
          </div>
        </section>
      ) : null}

      <section className="service-native-section retirement-top3">
        <div className="ag-panel-rail-wide">
          <div className="service-native-dark-feature">
            <div className="service-native-dark-feature-inner">
              <div
                className="service-native-dark-feature-media retirement-top3-media"
                role="img"
                aria-label={RETIREMENT_TOP_3_ARTICLE_FEATURE.imageAlt || 'Top 3 investing mistakes to avoid'}
                style={RETIREMENT_TOP_3_ARTICLE_FEATURE.image ? { backgroundImage: `url(${RETIREMENT_TOP_3_ARTICLE_FEATURE.image})` } : undefined}
              />
              <div className="service-native-dark-feature-copy">
                <h3>Top 3 investing mistakes to avoid...</h3>
                <p>... and how to navigate today&apos;s volatile markets.</p>
                <div className="service-native-action-row">
                  <Link to={RETIREMENT_TOP_3_ARTICLE_FEATURE.to} className="service-native-btn">Read more</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
