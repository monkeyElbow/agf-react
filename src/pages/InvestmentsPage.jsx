import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BlockHudPanelHost from '../components/BlockHudPanelHost';
import BlockOwnershipOverlay, { getBlockOwnershipVisual } from '../components/BlockOwnershipOverlay';
import FrontHudAnchorTag from '../components/FrontHudAnchorTag';
import { inspectDynamicHeroSettings, useContentAdmin } from '../context/ContentAdminContext';
import { useFrontHud } from '../context/FrontHudContext';
import { useRates } from '../context/RatesContext';
import { useDocuments } from '../context/DocumentsContext';
import { useTestimonials } from '../context/TestimonialsContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import { HeroInlineLiveEditor, renderHeroRangesAsNodes } from '../components/HeroHudEditorShared';
import FrontHudPanelShell from '../components/FrontHudPanelShell';
import FrontHudPageWorkflow from '../components/FrontHudPageWorkflow';
import SafeRichText from '../components/SafeRichText';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import { defaultInvestmentsIntroSettings } from '../data/contentBlockBlueprints';
import { getResourceArticleFeatureConfig } from '../data/resourceArticles';
import {
  formatTestimonialAttribution,
  normalizeDisplayTestimonials,
  normalizeTestimonialsSelectionMode,
  parseTokenList,
  resolveTestimonialsBlockData,
} from '../lib/testimonials';
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
  actionButtonClassName,
  buildDynamicCalculatorCtaFromBlock,
  buildDynamicCtaBandFromBlock,
  buildDynamicFeaturePanelFromBlock,
  buildDynamicHeroFromBlock,
  buildDynamicIntroFromBlock,
  heroAnimationClassForLine,
  isExternalLinkHref,
  renderTextWithHighlights,
} from '../lib/dynamicPageBlocks';
import { shouldRenderHeroInlineEditor } from '../lib/heroHudMode';
import { getHeroSeedContract } from '../lib/heroSeedContracts';
import { buildPresetFamilyRuntimeClassName } from '../lib/presetFamilyContract';

const certificateCards = [
  {
    titleTop: 'Demand',
    titleBottom: 'Certificates',
    description: 'Demand Certificates are variable rate investments that provide access to funds on demand (within 30 days).',
    minimum: 'Minimum investment $250.',
  },
  {
    titleTop: 'Term',
    titleBottom: 'Certificates',
    description: 'Term Certificates have fixed or variable interest rates over a predetermined amount of time, ranging from three months to ten years.',
    minimum: 'Minimum investment $500.',
  },
];

const growthCards = [
  {
    title: 'Grow your return.',
    body: 'Why choose between financial growth and spiritual impact? Deliver both at the same time.',
  },
  {
    title: 'Grow your "Plan B."',
    body: "Your church's emergency funds should build the Kingdom while preparing for the unexpected.",
  },
  {
    title: 'Grow the Kingdom.',
    body: "Every dollar helps provide loans to churches and ministries. Today's investment is tomorrow's church.",
  },
];

const testimonials = [
  {
    quote: '"It\'s an easy yes for me to continue to recommend AGFinancial."',
    authorName: 'Jeremy Johnson',
    authorTitle: 'President, Northwest University',
  },
  {
    quote: '"There are two returns. There\'s a return on the investment, and there\'s a return to the Kingdom."',
    authorName: 'Bryan Jarrett',
    authorTitle: 'Pastor, Northplace Church, TX',
  },
  {
    quote: '"Convoy of Hope would not be where we are without our partnership with AGFinancial."',
    authorName: 'Hal Donaldson',
    authorTitle: 'President, Convoy of Hope',
  },
];
const defaultInvestmentsTestimonialsFineprint = 'Testimonials are examples only. Every situation is different and results vary.';

const MAX_LADDER_YEARS = 20;
const DEFAULT_LADDER_YEARS = 5;
const MAX_VISUALIZE_YEARS = 60;
const DEFAULT_LADDER_TOTAL = '100,000';
const INVESTMENTS_HERO_HUD_PANEL_ID = 'investments-hero';
const INVESTMENTS_INTRO_HUD_PANEL_ID = 'investments-intro';
const INVESTMENTS_TESTIMONIALS_HUD_PANEL_ID = 'investments-testimonials';
const INVESTMENTS_FEATURE_PANEL_HUD_PANEL_ID = 'investments-feature-panel';
const INVESTMENTS_CTA_BAND_HUD_PANEL_ID = 'investments-cta-band';
const INVESTMENTS_CALCULATOR_CTA_HUD_PANEL_ID = 'investments-calculator-cta';
const INVESTMENTS_HUD_PANEL_ID_BY_BLOCK_ID = {
  hero: INVESTMENTS_HERO_HUD_PANEL_ID,
  intro: INVESTMENTS_INTRO_HUD_PANEL_ID,
  testimonials: INVESTMENTS_TESTIMONIALS_HUD_PANEL_ID,
  cash_reserves: INVESTMENTS_FEATURE_PANEL_HUD_PANEL_ID,
  investor_cta: INVESTMENTS_CTA_BAND_HUD_PANEL_ID,
  laddering: INVESTMENTS_CALCULATOR_CTA_HUD_PANEL_ID,
};
const CHURCH_CASH_RESERVES_ARTICLE_FEATURE = getResourceArticleFeatureConfig({
  slug: 'church-cash-reserves',
  title: 'Church Cash Reserves',
  fallbackImageAlt: 'Church Cash Reserves',
});
const INVESTMENTS_HERO_ANIMATION_PRESET = getHeroSeedContract('/services/investments')?.animationPreset || 'loans-unblur';

function resolveInvestmentsHeroAnimationPreset(value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === 'default') {
    return INVESTMENTS_HERO_ANIMATION_PRESET;
  }
  return normalized;
}

function clampFrontHudOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 15;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

const ladderStateOptions = [
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

function formatNumberInput(value) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  if (!cleaned) {
    return '';
  }
  const [whole, ...decimals] = cleaned.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return [formattedWhole, ...decimals].join('.');
}

function parseNumber(value) {
  return Number.parseFloat(String(value || '').replace(/,/g, '')) || 0;
}

function parseInteger(value) {
  return Number.parseInt(String(value || '').replace(/\D/g, ''), 10) || 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function suggestedHorizon(ladderYears) {
  return Math.max(ladderYears + 5, 10);
}

function formatCurrency(value) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function parsePercentValue(value) {
  const cleaned = String(value || '').replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return null;
  }
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function renderHeroLineHtml(text, highlights) {
  return renderTextWithHighlights(text, highlights).replace(/\n/g, '<br />');
}

function getLadderYearApy(rows, year) {
  const row = rows.find((item) => String(item.product || '').toUpperCase().includes(`${year}-YEAR`));
  if (!row && year > 0) {
    return null;
  }
  const preferred = [row.standardApy, row.premiumApy, row.standardRate, row.premiumRate];
  for (const entry of preferred) {
    const value = parsePercentValue(entry);
    if (value !== null) {
      return value.toFixed(2);
    }
  }
  return null;
}

function buildLadderRateSeeds(rows, maxYears) {
  const fallbackDefault = '4.00';
  const seeds = {};
  let fallbackRate = getLadderYearApy(rows || [], DEFAULT_LADDER_YEARS) || fallbackDefault;

  for (let year = 1; year <= maxYears; year += 1) {
    const next = getLadderYearApy(rows || [], year);
    if (next !== null) {
      seeds[year] = next;
      fallbackRate = next;
    } else {
      seeds[year] = fallbackRate;
    }
  }
  return seeds;
}

function splitPrincipalEvenly(totalInvestment, ladderYears) {
  const totalCents = Math.round(totalInvestment * 100);
  const baseCents = Math.floor(totalCents / ladderYears);
  const remainder = totalCents - (baseCents * ladderYears);
  const slices = [];

  for (let index = 0; index < ladderYears; index += 1) {
    const cents = index === ladderYears - 1 ? baseCents + remainder : baseCents;
    slices.push(cents / 100);
  }
  return slices;
}

function computeApyInterest(principal, apyPercent, years) {
  const apyDecimal = apyPercent / 100;
  return principal * (Math.pow(1 + apyDecimal, years) - 1);
}

// Year-by-year ladder simulation with rollover support.
function simulateLadderSchedule({
  totalInvestment,
  ladderYears,
  horizonYears,
  reinvestMode,
  apyByYear,
}) {
  const principalSlices = splitPrincipalEvenly(totalInvestment, ladderYears);
  const initialRows = [];
  const scheduleRows = [];
  const timelineBars = [];
  const activeRungs = [];

  let rungId = 0;
  let totalInterestEarnedToDate = 0;

  const createRung = ({ principal, termYears, startYear, isRollover }) => {
    const apyPercent = apyByYear[termYears];
    const interest = computeApyInterest(principal, apyPercent, termYears);
    return {
      id: ++rungId,
      principal,
      termYears,
      apyPercent,
      startYear,
      maturityYear: startYear + termYears,
      interest,
      endingValue: principal + interest,
      isRollover,
    };
  };

  for (let termYears = 1; termYears <= ladderYears; termYears += 1) {
    const rung = createRung({
      principal: principalSlices[termYears - 1],
      termYears,
      startYear: 0,
      isRollover: false,
    });
    activeRungs.push(rung);
    initialRows.push(rung);
    timelineBars.push(rung);
  }

  for (let year = 1; year <= horizonYears; year += 1) {
    const maturedRungs = [];
    for (let index = activeRungs.length - 1; index >= 0; index -= 1) {
      if (activeRungs[index].maturityYear === year) {
        maturedRungs.push(activeRungs[index]);
        activeRungs.splice(index, 1);
      }
    }

    const principalMaturing = maturedRungs.reduce((sum, rung) => sum + rung.principal, 0);
    const interestMaturing = maturedRungs.reduce((sum, rung) => sum + rung.interest, 0);
    totalInterestEarnedToDate += interestMaturing;

    let reinvestedPrincipal = 0;
    if (reinvestMode === 'reinvest_longest' && principalMaturing > 0) {
      maturedRungs.forEach((matured) => {
        const rolledRung = createRung({
          principal: matured.principal,
          termYears: ladderYears,
          startYear: year,
          isRollover: true,
        });
        activeRungs.push(rolledRung);
        timelineBars.push(rolledRung);
        reinvestedPrincipal += matured.principal;
      });
    }

    // "Available" reflects what matures this year, regardless of reinvest choice.
    const principalAvailable = principalMaturing;
    const interestAvailable = interestMaturing;
    const totalCashAvailable = principalAvailable + interestAvailable;
    const lockedPrincipal = activeRungs.reduce((sum, rung) => sum + rung.principal, 0);

    scheduleRows.push({
      year,
      principalMaturing,
      interestMaturing,
      reinvested: reinvestedPrincipal > 0,
      reinvestedPrincipal,
      principalAvailable,
      interestAvailable,
      totalCashAvailable,
      lockedPrincipal,
      totalInterestEarnedToDate,
    });
  }

  return {
    ladderYears,
    horizonYears,
    reinvestMode,
    totalInvestment,
    apyByYear,
    initialRows,
    scheduleRows,
    timelineBars,
  };
}

function defaultLadderInput() {
  const years = DEFAULT_LADDER_YEARS;
  return {
    totalInvestment: DEFAULT_LADDER_TOTAL,
    ladderYears: String(years),
    visualizeYears: String(suggestedHorizon(years)),
    reinvestMode: 'reinvest_longest',
  };
}

export default function InvestmentsPage() {
  const pageRef = useRef(null);
  const heroSectionRef = useRef(null);
  const introSectionRef = useRef(null);
  const testimonialsSectionRef = useRef(null);
  const featurePanelSectionRef = useRef(null);
  const ctaBandSectionRef = useRef(null);
  const calculatorCtaSectionRef = useRef(null);
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
  const { rates, ratesMeta } = useRates();
  const { resolveDocumentLink } = useDocuments();
  const offeringCircularDoc = resolveDocumentLink('prospectus-prospectus-download-offering-circular')
    || resolveDocumentLink('document-aglf-offering-circular');
  const ladderRateSeeds = useMemo(() => buildLadderRateSeeds(rates, MAX_LADDER_YEARS), [rates]);
  const [ladderInput, setLadderInput] = useState(() => defaultLadderInput());
  const [ladderRates, setLadderRates] = useState(() => ladderRateSeeds);
  const [ladderResult, setLadderResult] = useState(null);
  const [ladderError, setLadderError] = useState('');
  const [ladderVisualizeTouched, setLadderVisualizeTouched] = useState(false);
  const [ladderDownload, setLadderDownload] = useState({
    name: '',
    email: '',
  });
  const [ladderDiscuss, setLadderDiscuss] = useState({
    organization: '',
    state: '',
    phone: '',
  });
  const [ladderDiscussMessage, setLadderDiscussMessage] = useState('');
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
  const [activeHudPanelId, setActiveHudPanelId] = useState('');
  const [heroSelection, setHeroSelection] = useState({
    line: '',
    start: 0,
    end: 0,
    text: '',
  });
  const [heroActiveLine, setHeroActiveLine] = useState('line1');
  const [introHeadingSelection, setIntroHeadingSelection] = useState({ start: 0, end: 0, text: '' });
  const [introBodyMiniEditorEnabled, setIntroBodyMiniEditorEnabled] = useState(false);
  useNativeEnhancements(pageRef);

  const managedBlocksSource = useMemo(
    () => (Array.isArray(blocksByPath?.['/services/investments']) ? blocksByPath['/services/investments'] : []),
    [blocksByPath],
  );
  const { blocks: managedBlocks, stageLocalBlockSetting, stageLocalBlockSettings } = useLocalBlockDrafts({
    pathname: '/services/investments',
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
  const dynamicTestimonialsBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'testimonials'
      && block?.kind === 'testimonials'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const featurePanelBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'cash_reserves'
      && block?.kind === 'feature_panel'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const investorCtaBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'investor_cta'
      && block?.kind === 'cta_band'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const calculatorCtaBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'laddering'
      && block?.kind === 'calculator_cta'
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
      fallbackFineprint: defaultInvestmentsTestimonialsFineprint,
      defaultTag: 'investments',
    }),
    [dynamicTestimonialsBlock, testimonialsLibrary],
  );
  const introHudSettings = useMemo(
    () => ({ ...defaultInvestmentsIntroSettings, ...(introBlock?.settings && typeof introBlock.settings === 'object' ? introBlock.settings : {}) }),
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
  const heroInspection = useMemo(
    () => inspectDynamicHeroSettings('/services/investments', heroBlock?.settings),
    [heroBlock],
  );
  const heroHudSettings = heroInspection.normalizedSettings;
  const dynamicHero = useMemo(() => {
    if (!heroBlock) {
      return null;
    }
    return buildDynamicHeroFromBlock({
      ...heroBlock,
      settings: {
        ...heroHudSettings,
        animationPreset: resolveInvestmentsHeroAnimationPreset(
          heroHudSettings.animationPreset || heroBlock.settings?.animationPreset,
        ),
      },
    });
  }, [heroBlock, heroHudSettings]);
  const featurePanelRuntime = useMemo(() => {
    const fallbackSettings = {
      title: 'Church Cash Reserves',
      bodyHtml: '<p>Financial stability is essential for long-term growth. Build a practical reserve strategy so your ministry is ready for both opportunity and disruption.</p>',
      body: '',
      imageUrl: CHURCH_CASH_RESERVES_ARTICLE_FEATURE.image,
      imageAlt: CHURCH_CASH_RESERVES_ARTICLE_FEATURE.imageAlt,
      buttonLabel: 'Ready for the unexpected?',
      buttonUrl: CHURCH_CASH_RESERVES_ARTICLE_FEATURE.to,
      buttonPageRef: CHURCH_CASH_RESERVES_ARTICLE_FEATURE.to,
      buttonOpenInNewWindow: false,
    };
    const sourceBlock = featurePanelBlock || {
      id: 'cash_reserves',
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: fallbackSettings,
    };
    const sourceSettings = sourceBlock?.settings && typeof sourceBlock.settings === 'object'
      ? sourceBlock.settings
      : {};
    const normalizedSettings = {
      ...fallbackSettings,
      ...sourceSettings,
    };
    const currentButtonUrl = String(normalizedSettings.buttonUrl || '').trim();
    const currentButtonPageRef = String(normalizedSettings.buttonPageRef || '').trim();
    if (!String(normalizedSettings.imageUrl || '').trim()) {
      normalizedSettings.imageUrl = CHURCH_CASH_RESERVES_ARTICLE_FEATURE.image;
    }
    if (!String(normalizedSettings.imageAlt || '').trim()) {
      normalizedSettings.imageAlt = CHURCH_CASH_RESERVES_ARTICLE_FEATURE.imageAlt;
    }
    if (!currentButtonUrl || currentButtonUrl === '/resources') {
      normalizedSettings.buttonUrl = CHURCH_CASH_RESERVES_ARTICLE_FEATURE.to;
    }
    if (!currentButtonPageRef || currentButtonPageRef === '/resources') {
      normalizedSettings.buttonPageRef = CHURCH_CASH_RESERVES_ARTICLE_FEATURE.to;
    }
    return buildDynamicFeaturePanelFromBlock({
      ...sourceBlock,
      settings: normalizedSettings,
    });
  }, [featurePanelBlock]);
  const investorCtaRuntime = useMemo(
    () => buildDynamicCtaBandFromBlock(investorCtaBlock || {
      id: 'investor_cta',
      kind: 'cta_band',
      mode: 'dynamic',
      settings: {
        title: 'Already an investor?',
        body: 'Log in to manage.',
        bgTone: 'white',
        buttonLabel: 'Go to my dashboard',
        buttonUrl: 'https://secure.agfinancial.org/',
        buttonPageRef: '',
        buttonOpenInNewWindow: true,
      },
    }),
    [investorCtaBlock],
  );
  const calculatorCtaRuntime = useMemo(
    () => buildDynamicCalculatorCtaFromBlock(calculatorCtaBlock || {
      id: 'laddering',
      kind: 'calculator_cta',
      mode: 'dynamic',
      settings: {
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
    }),
    [calculatorCtaBlock],
  );
  const heroHudLineHeight = Number.isFinite(Number(heroHudSettings.lineHeight))
    ? Number(heroHudSettings.lineHeight)
    : 0.9;
  const heroHudBgTone = String(heroHudSettings.bgTone || dynamicHero?.bgTone || 'white').trim() || 'white';
  const heroHudJustify = String(heroHudSettings.justify || dynamicHero?.justify || 'left').trim().toLowerCase() || 'left';
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
    logHeroDriftWarningOnce(heroInspection, 'Investments hero');
  }, [heroInspection]);
  const introHudJustify = String(introHudSettings.justify || defaultInvestmentsIntroSettings.justify).trim().toLowerCase() || defaultInvestmentsIntroSettings.justify;
  const introHudLineSpacing = Number.isFinite(Number(introHudSettings.lineSpacing))
    ? Number(introHudSettings.lineSpacing)
    : defaultInvestmentsIntroSettings.lineSpacing;
  const introHudBgTone = String(introHudSettings.bgTone || defaultInvestmentsIntroSettings.bgTone).trim().toLowerCase() || defaultInvestmentsIntroSettings.bgTone;
  const introHudTextTone = String(introHudSettings.textTone || defaultInvestmentsIntroSettings.textTone).trim().toLowerCase() || defaultInvestmentsIntroSettings.textTone;
  const introHudHeadingColor = String(introHudSettings.headingClassName || '').trim();
  const introHudExtraLineTone = String(introHudSettings.extraLineTone || '').trim();
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
      defaultTag: 'investments',
    }),
    [dynamicTestimonialsBlock, testimonialsHudLibrary],
  );
  const testimonialsHudPreviewItems = Array.isArray(testimonialsHudResolved?.items)
    ? testimonialsHudResolved.items.slice(0, 4)
    : [];
  const frontHudOpacityRatio = clampFrontHudOpacity(frontHudOpacity) / 100;
  const hudPanels = useMemo(
    () => buildHudPanelsFromBlocks(managedBlocks, {
      panelIdById: INVESTMENTS_HUD_PANEL_ID_BY_BLOCK_ID,
    }).map((panel) => ({
      ...panel,
      sectionRef: panel.blockId === 'hero'
        ? heroSectionRef
        : panel.blockId === 'intro'
          ? introSectionRef
          : panel.blockId === 'testimonials'
            ? testimonialsSectionRef
            : panel.blockId === 'cash_reserves'
              ? featurePanelSectionRef
              : panel.blockId === 'investor_cta'
                ? ctaBandSectionRef
                : panel.blockId === 'laddering'
                  ? calculatorCtaSectionRef
                : null,
    })),
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
  const isHeroHudFocusTarget = hasOpenHudPanel && activeHudPanelId === INVESTMENTS_HERO_HUD_PANEL_ID;
  const isIntroHudFocusTarget = hasOpenHudPanel && activeHudPanelId === INVESTMENTS_INTRO_HUD_PANEL_ID;
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
    return getBlockOwnershipVisual(getBlockCollaboration('/services/investments', blockId), devIdentity?.userId);
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
    storageKey: 'investments',
  });

  useEffect(() => {
    if (!showFrontHud) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
    }
  }, [showFrontHud]);

  const scrollElementWithNavOffset = (target, extraOffset = 8) => {
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

  const setHudPanelOpen = (panelId, sectionRef, options = {}) => {
    const shouldScroll = options.scrollToTarget !== false;
    setHudDockCollapsed(false);
    setActiveHudPanelId(panelId);
    if (shouldScroll) {
      scrollElementWithNavOffset(sectionRef?.current);
    }
  };

  const toggleHudPanel = (panelId, sectionRef) => {
    if (!hudDockCollapsed && activeHudPanelId === panelId) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      return;
    }
    setHudPanelOpen(panelId, sectionRef);
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
        onClick={() => toggleHudPanel(panel.id, panel.sectionRef)}
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
  const handleIntroBodyEditIntent = (event) => {
    if (!showFrontHud || !introBlock) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setHudPanelOpen(INVESTMENTS_INTRO_HUD_PANEL_ID, introSectionRef, { scrollToTarget: false });
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
    setHudPanelOpen(INVESTMENTS_INTRO_HUD_PANEL_ID, introSectionRef, { scrollToTarget: false });
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
    setHudPanelOpen(INVESTMENTS_INTRO_HUD_PANEL_ID, introSectionRef, { scrollToTarget: false });
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
    setHudPanelOpen(INVESTMENTS_HERO_HUD_PANEL_ID, heroSectionRef, { scrollToTarget: false });
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

  useEffect(() => {
    setLadderInput(defaultLadderInput());
    setLadderRates(ladderRateSeeds);
    setLadderResult(null);
    setLadderError('');
    setLadderVisualizeTouched(false);
  }, [ladderRateSeeds]);

  const ladderYears = clamp(
    parseInteger(ladderInput.ladderYears) || DEFAULT_LADDER_YEARS,
    1,
    MAX_LADDER_YEARS,
  );

  const ladderBuildSteadyCopy = `In the early years, you're building the ladder. After year ${ladderYears}, you'll usually see a steady rhythm, and something matures each year.`;
  const ladderToggleHelper = ladderInput.reinvestMode === 'reinvest_longest'
    ? 'Keep the ladder going: roll each maturity into a new longest-term certificate.'
    : 'Take maturities as cash: the ladder will gradually wind down.';

  const hasCustomRateInputs = Array.from({ length: ladderYears }, (_, index) => index + 1).some((year) => (
    Math.abs(parseNumber(ladderRates[year]) - parseNumber(ladderRateSeeds[year])) > 0.0001
  ));

  const canDownloadLadder = Boolean(ladderResult)
    && ladderDownload.name.trim().length > 0
    && isValidEmail(ladderDownload.email);
  const ladderDiscussTone = ladderDiscussMessage.startsWith('Thanks') ? 'is-success' : 'is-alert';

  const timelineYears = useMemo(() => (
    ladderResult ? Array.from({ length: ladderResult.horizonYears + 1 }, (_, year) => year) : []
  ), [ladderResult]);

  const timelineBars = useMemo(() => {
    if (!ladderResult) {
      return [];
    }
    const horizon = ladderResult.horizonYears;
    return ladderResult.timelineBars
      .filter((bar) => bar.startYear < horizon)
      .slice()
      .sort((a, b) => (
        a.startYear - b.startYear
        || a.maturityYear - b.maturityYear
        || a.id - b.id
      ));
  }, [ladderResult]);

  const ladderSummary = useMemo(() => {
    if (!ladderResult) {
      return null;
    }
    const totalPrincipalMaturing = ladderResult.scheduleRows.reduce((sum, row) => sum + row.principalMaturing, 0);
    const totalInterestMaturing = ladderResult.scheduleRows.reduce((sum, row) => sum + row.interestMaturing, 0);
    const totalCashAvailable = ladderResult.scheduleRows.reduce((sum, row) => sum + row.totalCashAvailable, 0);
    return {
      totalPrincipalMaturing,
      totalInterestMaturing,
      totalCashAvailable,
    };
  }, [ladderResult]);

  const onLadderTotalChange = (value) => {
    setLadderInput((prev) => ({ ...prev, totalInvestment: formatNumberInput(value) }));
  };

  const onLadderYearsChange = (value) => {
    const normalizedYears = clamp(parseInteger(value) || 1, 1, MAX_LADDER_YEARS);
    setLadderInput((prev) => ({
      ...prev,
      ladderYears: String(normalizedYears),
      visualizeYears: ladderVisualizeTouched
        ? prev.visualizeYears
        : String(suggestedHorizon(normalizedYears)),
    }));
    setLadderRates((prev) => {
      const next = { ...prev };
      for (let year = 1; year <= normalizedYears; year += 1) {
        if (!next[year]) {
          next[year] = year === 1
            ? ladderRateSeeds[1]
            : next[year - 1] || ladderRateSeeds[year] || ladderRateSeeds[DEFAULT_LADDER_YEARS];
        }
      }
      return next;
    });
  };

  const onLadderVisualizeYearsChange = (value) => {
    const parsed = clamp(parseInteger(value) || 1, 1, MAX_VISUALIZE_YEARS);
    setLadderVisualizeTouched(true);
    setLadderInput((prev) => ({ ...prev, visualizeYears: String(parsed) }));
  };

  const onLadderReinvestModeChange = (value) => {
    setLadderInput((prev) => ({ ...prev, reinvestMode: value }));
  };

  const onLadderRateChange = (year, value) => {
    setLadderRates((prev) => ({ ...prev, [year]: formatNumberInput(value) }));
  };

  const calculateLadder = () => {
    try {
      const totalInvestment = parseNumber(ladderInput.totalInvestment);
      if (totalInvestment <= 0) {
        throw new Error('Enter a total investment amount greater than $0.');
      }

      const normalizedYears = clamp(parseInteger(ladderInput.ladderYears) || DEFAULT_LADDER_YEARS, 1, MAX_LADDER_YEARS);
      let horizonYears = parseInteger(ladderInput.visualizeYears);
      if (!horizonYears) {
        horizonYears = suggestedHorizon(normalizedYears);
      }
      horizonYears = clamp(horizonYears, normalizedYears + 1, MAX_VISUALIZE_YEARS);

      const apyByYear = {};
      for (let year = 1; year <= normalizedYears; year += 1) {
        const apy = parseNumber(ladderRates[year]);
        if (apy < 0) {
          throw new Error('APY values must be zero or greater.');
        }
        apyByYear[year] = apy;
      }

      const result = simulateLadderSchedule({
        totalInvestment,
        ladderYears: normalizedYears,
        horizonYears,
        reinvestMode: ladderInput.reinvestMode,
        apyByYear,
      });

      setLadderInput((prev) => ({
        ...prev,
        ladderYears: String(normalizedYears),
        visualizeYears: String(horizonYears),
      }));
      setLadderError('');
      setLadderResult(result);
    } catch (error) {
      setLadderResult(null);
      setLadderError(error instanceof Error ? error.message : 'Unable to calculate ladder.');
    }
  };

  const downloadLadderSample = () => {
    if (!canDownloadLadder || !ladderResult) {
      return;
    }
    const summary = [
      'AGFinancial Laddering Sample',
      '',
      `Prepared for: ${ladderDownload.name.trim()}`,
      `Email: ${ladderDownload.email.trim()}`,
      '',
      `Total Investment Amount: $${formatCurrency(ladderResult.totalInvestment)}`,
      `Ladder span (years / longest term): ${ladderResult.ladderYears}`,
      `Years to visualize: ${ladderResult.horizonYears}`,
      `Maturity behavior: ${ladderResult.reinvestMode === 'reinvest_longest' ? 'Reinvest into longest term' : 'Keep matured principal as cash'}`,
      'Return model: APY-based effective annual yield, principal-only reinvestment',
      '',
      'Year | Principal Maturing | Interest Maturing | Reinvested | Locked Principal | Cash Available',
      ...ladderResult.scheduleRows.map((row) => (
        `Year ${row.year} | ${formatCurrency(row.principalMaturing)} | ${formatCurrency(row.interestMaturing)} | ${row.reinvested ? 'Yes' : 'No'} | ${formatCurrency(row.lockedPrincipal)} | ${formatCurrency(row.totalCashAvailable)}`
      )),
      '',
      'This tool illustrates ladder mechanics. APY values can change. Results are estimates.',
    ].join('\n');
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeName = ladderDownload.name.trim().replace(/[^\w-]+/g, '-');
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeName || 'investor'}-laddering-sample.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const sendLadderDiscuss = () => {
    if (ladderDiscuss.state === 'OH') {
      setLadderDiscussMessage('Investments are not available in Ohio.');
      return;
    }
    if (!ladderDiscuss.phone.trim()) {
      setLadderDiscussMessage('Add a phone number so our team can follow up.');
      return;
    }
    setLadderDiscussMessage('Thanks. A member of our investments team will contact you soon.');
  };

  return (
    <div
      ref={pageRef}
      className={`service-native-page investments-native-page${showFrontHud ? ' is-front-hud-docked' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}`}
    >
      {showFrontHud ? (
        <aside className={`admin-front-hud-dock${hudDockCollapsed ? ' is-collapsed' : ''}`} aria-label="Front HUD editor panels">
          <div className={`admin-front-hud-dock-tabs${isDockDragging ? ' is-drag-active' : ''}`}>
            {orderedHudPanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`admin-front-hud-dock-tab${!hudDockCollapsed && activeHudPanel?.id === panel.id ? ' is-active' : ''}${isPanelDragging(panel.id) ? ' is-dragging' : ''}${isPanelDragOver(panel.id) ? ' is-drag-over' : ''}${getPanelDropPosition(panel.id) ? ` is-drop-${getPanelDropPosition(panel.id)}` : ''}`}
                onClick={() => toggleHudPanel(panel.id, panel.sectionRef)}
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
        <FrontHudPageWorkflow pathname="/services/investments" reviewHref="/admin/content?page=%2Fservices%2Finvestments" placement="bar" />
      ) : null}
      {hasOpenHudPanel && activeHudPanel ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          onClose={closeHudDock}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
        >
          <BlockHudPanelHost
            block={activeHudPanel.block}
            pathname="/services/investments"
            routeOptions={routeLinkOptions}
            testimonialsLibrary={testimonialsLibrary}
            ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
            onOwnershipAction={() => {
              if (!activeHudPanel?.block?.id) {
                return;
              }
              setActiveBlockLock('/services/investments', activeHudPanel.block.id, { force: true });
            }}
            onSettingChange={(settingKey, nextValue) => stageLocalBlockSetting(activeHudPanel.block.id, settingKey, nextValue)}
          />
        </FrontHudPanelShell>
      ) : null}
      <section
        ref={heroSectionRef}
        className={`service-native-hero investments-native-hero${dynamicHero ? ` is-bg-${dynamicHero.bgTone || 'white'} is-justify-${dynamicHero.justify || 'left'}` : ''}${showFrontHud ? ' has-admin-front-hud' : ''}${hasOpenHudPanel ? (isHeroHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed') : ''}${getOwnershipVisualForBlockId('hero').className || ''}`}
        data-block-id="hero"
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('hero')} />
        {renderHudAnchor('hero')}
        <div className="ag-panel-rail">
          {shouldRenderHeroInlineEditor({
            hudEnabled: showFrontHud,
            hasDynamicHero: Boolean(heroBlock),
            activeHudPanelId,
            heroHudPanelId: INVESTMENTS_HERO_HUD_PANEL_ID,
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
                key={`investments-hero-line-${line.id || index + 1}`}
                className={className || undefined}
                style={{
                  lineHeight: dynamicHero.lineHeight,
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: renderHeroLineHtml(line.text, line.highlights) }} />
              </h1>
            );
          }) : (
            <>
              <h1 className={`line1 ${heroAnimationClassForLine('loans-unblur', 1)}`}>
                Your <mark className="is-atlantean">investments</mark>.
              </h1>
              <h1 className={`line2 ${heroAnimationClassForLine('loans-unblur', 2)}`}>
                Your <mark className="is-mango">faith</mark>.
              </h1>
              <h1 className={`line3 ${heroAnimationClassForLine('loans-unblur', 3)}`}>
                Better <mark className="is-sandstone">together</mark>.
              </h1>
            </>
          )}
        </div>
      </section>

      <section
        ref={introSectionRef}
        className={`service-native-intro investments-native-intro fade-out${dynamicIntro ? ` dynamic-intro is-bg-${dynamicIntro.bgTone || defaultInvestmentsIntroSettings.bgTone} is-text-${dynamicIntro.textTone || defaultInvestmentsIntroSettings.textTone}` : ''}${showFrontHud ? ' has-admin-front-hud' : ''}${hasOpenHudPanel ? (isIntroHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed') : ''}${getOwnershipVisualForBlockId('intro').className || ''}`}
        data-block-id="intro"
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('intro')} />
        {renderHudAnchor('intro')}
        <div className="ag-panel-rail">
          <div
            className={`service-native-intro-copy is-justify-${dynamicIntro?.justify || 'center'}`}
            style={{ '--intro-heading-line-height': dynamicIntro?.lineSpacing || defaultInvestmentsIntroSettings.lineSpacing }}
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
              ) : (
                <>
                  Invest like it matters.
                  {' '}
                  <mark>Because it does.</mark>
                </>
              )}
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
                Your investment dollars don't just multiply; they multiply ministry impact. Every dollar you invest generates a competitive return while funding church construction and ministry growth. When you invest like it matters, everything matters more.
              </p>
            )}
            {dynamicIntro?.extraLine ? (
              <p
                className={`investments-native-intro-tagline${dynamicIntro?.extraLineClassName ? ` ${dynamicIntro.extraLineClassName}` : ''}${showFrontHud && introBlock ? ' admin-front-hud-click-edit-target' : ''}`}
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
                className={`investments-native-intro-tagline${showFrontHud && introBlock ? ' admin-front-hud-click-edit-target' : ''}`}
                onClick={showFrontHud && introBlock ? handleIntroExtraLineEditIntent : undefined}
                onKeyDown={showFrontHud && introBlock ? (event) => handleBodyEditKeyDown(event, handleIntroExtraLineEditIntent) : undefined}
                role={showFrontHud && introBlock ? 'button' : undefined}
                tabIndex={showFrontHud && introBlock ? 0 : undefined}
                aria-label={showFrontHud && introBlock ? 'Edit intro extra line' : undefined}
              >
                <strong>That's the power of faith-driven investing.</strong>
              </p>
            )}
            {(dynamicIntro?.actions || []).length ? (
              <div className={`service-native-action-row${(dynamicIntro.justify || 'center') === 'center' ? ' is-centered' : ''}`}>
                {dynamicIntro.actions.map((action) => {
                  const buttonClassName = actionButtonClassName(action.style);
                  const actionTarget = action.to || action.href || '';
                  const isInternal = Boolean(action.to || (action.href && !isExternalLinkHref(action.href) && action.href.startsWith('/')));
                  return isInternal ? (
                    <Link
                      key={`investments-intro-action-${actionTarget}-${action.label}`}
                      to={actionTarget}
                      className={buttonClassName}
                      target={action.openInNewWindow ? '_blank' : undefined}
                      rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <a
                      key={`investments-intro-action-${actionTarget}-${action.label}`}
                      href={actionTarget}
                      className={buttonClassName}
                      target={action.openInNewWindow ? '_blank' : undefined}
                      rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
                    >
                      {action.label}
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="service-native-section investments-native-panel" id="certificates">
        <div className="ag-panel-rail">
          <div className="service-native-grid is-two investments-native-cert-grid fade-out">
            {certificateCards.map((card) => (
              <article key={`${card.titleTop}-${card.titleBottom}`} className="service-native-card card1 investments-native-cert-card fade-up">
                <h3>{card.titleTop}<br />{card.titleBottom}</h3>
                <p>
                  {card.description}
                  {' '}
                  <strong>{card.minimum}</strong>
                </p>
                <div className="service-native-action-row">
                  <a href="https://secure.agfinancial.org/invest" target="_blank" rel="noreferrer noopener" className="service-native-btn">
                    Start investing
                  </a>
                </div>
              </article>
            ))}
          </div>

          <h2 className="investments-native-build-title fade-out">
            <mark>Build</mark>
            {' '}
            financial health.
            {' '}
            <mark>Grow</mark>.
            {' '}
            <mark>Minister</mark>.
          </h2>

          <div
            className="service-native-grid investments-native-growth-grid fade-out"
            data-fade-out-start-vh="0.02"
            data-fade-out-end-vh="-0.22"
          >
            {growthCards.map((card) => (
              <article key={card.title} className="investments-native-growth-card fade-up">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-native-section investments-native-rates-section">
        <div className="ag-panel-rail" id="rates">
          <h2 className="investments-native-rates-title">AGFinancial Investment Certificates Rates</h2>
          <div className="service-native-rates investments-native-rates-wrap fade-up">
            <div className="table-scroll">
              <table className="ag-table has-fixed-layout">
                <thead>
                  <tr>
                    <th>Investment Type</th>
                    <th>Standard Rate</th>
                    <th>Standard APY*</th>
                    <th>Premium Rate**</th>
                    <th>Premium APY*</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((row) => (
                    <tr key={row.id}>
                      <td>{row.product}</td>
                      <td>{row.standardRate}</td>
                      <td>{row.standardApy}</td>
                      <td>{row.premiumRate}</td>
                      <td>{row.premiumApy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rates-disclaimer investments-native-rates-disclaimer">
            <p className="investments-native-rates-disclaimer-lead">
              <strong>*Annual Percentage Yield</strong>
              <br />
              <strong>**Premium rates may be available for investments of $250,000 or greater.</strong>
              <br />
              <strong>Effective {ratesMeta?.certificatesEffectiveDate || 'January 1, 2025'}.</strong>
            </p>
            <p>
              Rates subject to change. Demand certificates are investments that do not represent cash and are payable
              within 30 days after demand by the investor. Penalties may apply to redemptions prior to maturity.
            </p>
            <p>
              This is not an offer to sell securities referred to herein and we are not soliciting you to purchase
              these securities. The offering is made only by the Offering Circular which includes risk factors. The
              Offering Circular may be obtained by writing or calling AGFinancial or by clicking
              {' '}
              <a href={offeringCircularDoc?.url || '/prospectus'} target="_blank" rel="noreferrer noopener">here</a>
              . AGFinancial investments are offered and sold only in states where authorized or exempt from
              authorization. A limited offering is available in Washington. Not available in Ohio.
            </p>
            <p>Not FDIC or SIPC Insured. Not a Bank Deposit. No AGFinancial Guarantee.</p>
            <p>
              <em>AGFinancial is a DBA of Assemblies of God Loan Fund, an affiliated entity of Assemblies of God Financial Services Group.</em>
            </p>
          </div>
        </div>
      </section>

      {investorCtaRuntime ? (
        <section
          ref={ctaBandSectionRef}
          className={`service-native-cta-band investments-native-dashboard-band ${buildPresetFamilyRuntimeClassName('cta_band', investorCtaRuntime.presetId)}${getHudBlockStateClassName('investor_cta')}${getOwnershipVisualForBlockId('investor_cta').className || ''}`}
          data-block-id="investor_cta"
        >
          <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('investor_cta')} />
          {renderHudAnchor('investor_cta')}
          <div className="ag-panel-rail">
            {investorCtaRuntime.title ? <h2 className="investments-native-dashboard-title">{investorCtaRuntime.title}</h2> : null}
            {investorCtaRuntime.body ? <p>{investorCtaRuntime.body}</p> : null}
            {investorCtaRuntime.action ? (
              <div className="service-native-action-row is-centered">
                {(investorCtaRuntime.action.to
                  || (investorCtaRuntime.action.href
                    && !isExternalLinkHref(investorCtaRuntime.action.href)
                    && investorCtaRuntime.action.href.startsWith('/'))) ? (
                      <Link
                        to={investorCtaRuntime.action.to || investorCtaRuntime.action.href}
                        className="service-native-btn"
                        target={investorCtaRuntime.action.openInNewWindow ? '_blank' : undefined}
                        rel={investorCtaRuntime.action.openInNewWindow ? 'noreferrer noopener' : undefined}
                      >
                        {investorCtaRuntime.action.label}
                      </Link>
                    ) : (
                      <a
                        href={investorCtaRuntime.action.href || investorCtaRuntime.action.to || '#'}
                        className="service-native-btn"
                        target={investorCtaRuntime.action.openInNewWindow ? '_blank' : undefined}
                        rel={investorCtaRuntime.action.openInNewWindow ? 'noreferrer noopener' : undefined}
                      >
                        {investorCtaRuntime.action.label}
                      </a>
                    )}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section
        ref={calculatorCtaSectionRef}
        className={`service-native-section investments-native-ladder-section${getHudBlockStateClassName('laddering')}${getOwnershipVisualForBlockId('laddering').className || ''}`}
        id="laddering-calculator"
        data-block-id="laddering"
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('laddering')} />
        {renderHudAnchor('laddering')}
        <div className="ag-panel-rail">
          <div className="investments-native-ladder-box fade-up">
            <h2>{calculatorCtaRuntime?.title}</h2>
            <h3>{calculatorCtaRuntime?.subtitle}</h3>
            <p className="investments-native-ladder-copy">
              {calculatorCtaRuntime?.body}
            </p>
            <h4 className="investments-native-ladder-subtitle">{calculatorCtaRuntime?.howItWorksTitle}</h4>
            <ul className="investments-native-ladder-list">
              <li>{calculatorCtaRuntime?.step1}</li>
              <li>{calculatorCtaRuntime?.step2}</li>
              <li>{calculatorCtaRuntime?.step3}</li>
            </ul>

            <p className="investments-native-ladder-phase-note">{ladderBuildSteadyCopy}</p>

            <div className="investments-native-ladder-grid is-meta">
              <label htmlFor="ladder-total">
                {calculatorCtaRuntime?.totalInvestmentLabel}
                <div className="investments-native-ladder-currency">
                  <input
                    id="ladder-total"
                    type="text"
                    inputMode="decimal"
                    value={ladderInput.totalInvestment}
                    onChange={(event) => onLadderTotalChange(event.target.value)}
                  />
                </div>
              </label>

              <label htmlFor="ladder-years">
                {calculatorCtaRuntime?.ladderYearsLabel}
                <input
                  id="ladder-years"
                  type="text"
                  inputMode="numeric"
                  value={ladderInput.ladderYears}
                  onChange={(event) => onLadderYearsChange(event.target.value)}
                />
                <span className="investments-native-ladder-field-helper">
                  {calculatorCtaRuntime?.ladderYearsHelper}
                </span>
              </label>
            </div>

            <div className="investments-native-ladder-maturity">
              <p className="investments-native-ladder-field-label">{calculatorCtaRuntime?.maturityLabel}</p>
              <div className="investments-native-ladder-reinvest-toggle">
                <label htmlFor="ladder-reinvest">
                  <input
                    id="ladder-reinvest"
                    type="radio"
                    name="ladder-reinvest-mode"
                    value="reinvest_longest"
                    checked={ladderInput.reinvestMode === 'reinvest_longest'}
                    onChange={(event) => onLadderReinvestModeChange(event.target.value)}
                  />
                  {calculatorCtaRuntime?.reinvestOptionLabel}
                </label>
                <label htmlFor="ladder-cashout">
                  <input
                    id="ladder-cashout"
                    type="radio"
                    name="ladder-reinvest-mode"
                    value="cash_out"
                    checked={ladderInput.reinvestMode === 'cash_out'}
                    onChange={(event) => onLadderReinvestModeChange(event.target.value)}
                  />
                  {calculatorCtaRuntime?.cashOutOptionLabel}
                </label>
              </div>
              <p className="investments-native-ladder-helper">{ladderToggleHelper}</p>
            </div>

            <div className="investments-native-ladder-visualize">
              <label htmlFor="ladder-visualize-years">
                {calculatorCtaRuntime?.visualizeYearsLabel}
                <input
                  id="ladder-visualize-years"
                  type="text"
                  inputMode="numeric"
                  value={ladderInput.visualizeYears}
                  onChange={(event) => onLadderVisualizeYearsChange(event.target.value)}
                />
              </label>
              <p className="investments-native-ladder-helper">
                {calculatorCtaRuntime?.visualizeYearsHelper}
              </p>
            </div>

            <div className="investments-native-ladder-rate-grid">
              {Array.from({ length: ladderYears }, (_, index) => index + 1).map((year) => (
                <label key={year} htmlFor={`ladder-rate-${year}`}>
                  {year}
                  -Year APY (%)
                  <input
                    id={`ladder-rate-${year}`}
                    type="text"
                    inputMode="decimal"
                    value={ladderRates[year] || ''}
                    onChange={(event) => onLadderRateChange(year, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <div className="service-native-action-row investments-native-ladder-action">
              <button type="button" className="service-native-btn" onClick={calculateLadder}>
                {calculatorCtaRuntime?.calculateLabel}
              </button>
            </div>
            <p className="investments-native-ladder-note">
              {calculatorCtaRuntime?.note}
            </p>
            <p className="investments-native-ladder-disclaimer">
              {calculatorCtaRuntime?.disclaimer}
            </p>
            {hasCustomRateInputs ? (
              <p className="investments-native-ladder-custom-note">
                {calculatorCtaRuntime?.customRatesNote}
              </p>
            ) : null}
            {ladderError ? <p className="investments-native-ladder-error">{ladderError}</p> : null}

            {ladderResult ? (
              <div className="investments-native-ladder-results">
                <h3>{calculatorCtaRuntime?.resultsTitle}</h3>
                <div className="table-scroll">
                  <table className="ag-table has-fixed-layout">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Principal</th>
                        <th>APY</th>
                        <th>Interest Earned</th>
                        <th>Ending Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ladderResult.initialRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.termYears}-Year</td>
                          <td>${formatCurrency(row.principal)}</td>
                          <td>{row.apyPercent.toFixed(2)}%</td>
                          <td>${formatCurrency(row.interest)}</td>
                          <td>${formatCurrency(row.endingValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {ladderSummary ? (
                  <div className="investments-native-ladder-summary-grid">
                    <article className="investments-native-ladder-summary-card">
                      <strong>Total principal maturing (timeline)</strong>
                      <span>${formatCurrency(ladderSummary.totalPrincipalMaturing)}</span>
                    </article>
                    <article className="investments-native-ladder-summary-card">
                      <strong>Total interest maturing (timeline)</strong>
                      <span>${formatCurrency(ladderSummary.totalInterestMaturing)}</span>
                    </article>
                    <article className="investments-native-ladder-summary-card">
                      <strong>Cumulative cash available (timeline)</strong>
                      <span>${formatCurrency(ladderSummary.totalCashAvailable)}</span>
                    </article>
                  </div>
                ) : null}

                <div className="investments-native-ladder-accordion">
                  <details className="investments-native-ladder-accordion-item">
                    <summary className="investments-native-ladder-accordion-summary">Timeline</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="investments-native-ladder-timeline-scroll">
                        <div className="investments-native-ladder-timeline-shell">
                          <div
                            className="investments-native-ladder-timeline-grid"
                            style={{ gridTemplateColumns: `repeat(${timelineYears.length}, minmax(92px, 1fr))` }}
                          >
                            {timelineYears.map((year) => (
                              <div key={`label-${year}`} className="investments-native-ladder-year-label">Year {year}</div>
                            ))}
                          </div>
                          <div
                            className="investments-native-ladder-timeline-grid is-badge-row"
                            style={{ gridTemplateColumns: `repeat(${timelineYears.length}, minmax(92px, 1fr))` }}
                          >
                            <div className="investments-native-ladder-year-badge">
                              <strong>Start</strong>
                              Initial purchase
                            </div>
                            {ladderResult.scheduleRows.map((row) => (
                              <div key={`badge-${row.year}`} className="investments-native-ladder-year-badge">
                                <strong>Matures</strong>
                                ${formatCurrency(row.principalMaturing)}
                                <br />
                                Interest: ${formatCurrency(row.interestMaturing)}
                              </div>
                            ))}
                          </div>
                          <div className="investments-native-ladder-timeline-rungs">
                            {timelineBars.map((bar, index) => {
                              const safeHorizon = Math.max(ladderResult.horizonYears, 1);
                              const visibleStart = Math.max(0, Math.min(bar.startYear, safeHorizon));
                              const visibleEnd = Math.max(visibleStart, Math.min(bar.maturityYear, safeHorizon));
                              const spanYears = Math.max(0.01, visibleEnd - visibleStart);
                              const leftPct = (visibleStart / safeHorizon) * 100;
                              const widthPct = (spanYears / safeHorizon) * 100;
                              const maturityPct = (Math.min(bar.maturityYear, safeHorizon) / safeHorizon) * 100;

                              return (
                                <div key={bar.id} className="investments-native-ladder-rung-row">
                                  <div className="investments-native-ladder-rung-label">Rung {index + 1}</div>
                                  <div className="investments-native-ladder-rung-track" style={{ '--ladder-tick-step': `${100 / safeHorizon}%` }}>
                                    <div
                                      className={`investments-native-ladder-rung-bar${bar.isRollover ? ' is-rollover' : ''}`}
                                      style={{
                                        left: `${leftPct}%`,
                                        width: `${widthPct}%`,
                                      }}
                                    >
                                      ${formatCurrency(bar.principal)} @ {bar.termYears}-year
                                    </div>
                                    <span className="investments-native-ladder-rung-dot" style={{ left: `${maturityPct}%` }} />
                                    {bar.isRollover ? (
                                      <span className="investments-native-ladder-rung-rollover" style={{ left: `${maturityPct}%` }}>-&gt;</span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>

                  <details className="investments-native-ladder-accordion-item">
                    <summary className="investments-native-ladder-accordion-summary">Year-by-year schedule</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="table-scroll">
                        <table className="ag-table has-fixed-layout">
                          <thead>
                            <tr>
                              <th>Year</th>
                              <th>Principal Maturing</th>
                              <th>Interest Maturing</th>
                              <th>Reinvested</th>
                              <th>Principal Still Locked</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ladderResult.scheduleRows.map((row) => (
                              <tr key={`schedule-${row.year}`}>
                                <td>Year {row.year}</td>
                                <td>${formatCurrency(row.principalMaturing)}</td>
                                <td>${formatCurrency(row.interestMaturing)}</td>
                                <td>{row.reinvested ? 'Yes' : 'No'}</td>
                                <td>${formatCurrency(row.lockedPrincipal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>

                  <details className="investments-native-ladder-accordion-item">
                    <summary className="investments-native-ladder-accordion-summary">Cash available by year</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="table-scroll">
                        <table className="ag-table has-fixed-layout">
                          <thead>
                            <tr>
                              <th>Year</th>
                              <th>Principal Available</th>
                              <th>Interest Available</th>
                              <th>Total Cash Available</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ladderResult.scheduleRows.map((row) => (
                              <tr key={`cash-${row.year}`}>
                                <td>Year {row.year}</td>
                                <td>${formatCurrency(row.principalAvailable)}</td>
                                <td>${formatCurrency(row.interestAvailable)}</td>
                                <td>${formatCurrency(row.totalCashAvailable)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="investments-native-ladder-gated">
                  <div className="investments-native-ladder-gated-download">
                    <h4>{calculatorCtaRuntime?.downloadTitle}</h4>
                    <p className="investments-native-ladder-cta-note">
                      {calculatorCtaRuntime?.downloadBody}
                    </p>
                    <div className="investments-native-ladder-gated-row">
                      <input
                        id="ladder-download-name"
                        type="text"
                        placeholder="Your name"
                        value={ladderDownload.name}
                        onChange={(event) => setLadderDownload((prev) => ({ ...prev, name: event.target.value }))}
                      />
                      <input
                        id="ladder-download-email"
                        type="email"
                        placeholder="you@example.com"
                        value={ladderDownload.email}
                        onChange={(event) => setLadderDownload((prev) => ({ ...prev, email: event.target.value }))}
                      />
                    </div>
                    <div className="investments-native-ladder-gated-actions">
                      <button type="button" className="service-native-btn" disabled={!canDownloadLadder} onClick={downloadLadderSample}>
                        {calculatorCtaRuntime?.downloadButtonLabel}
                      </button>
                    </div>
                  </div>

                  <div className="investments-native-ladder-contact">
                    <h4 className="investments-native-ladder-contact-heading">{calculatorCtaRuntime?.discussTitle}</h4>
                    <p className="investments-native-ladder-contact-message">
                      {calculatorCtaRuntime?.discussBody}
                    </p>
                    <div className="investments-native-ladder-contact-info-row">
                      <input
                        id="ladder-discuss-org"
                        type="text"
                        placeholder="Organization"
                        value={ladderDiscuss.organization}
                        onChange={(event) => setLadderDiscuss((prev) => ({ ...prev, organization: event.target.value }))}
                      />
                      <select
                        id="ladder-discuss-state"
                        value={ladderDiscuss.state}
                        onChange={(event) => setLadderDiscuss((prev) => ({ ...prev, state: event.target.value }))}
                      >
                        <option value="">State</option>
                        {ladderStateOptions.map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="investments-native-ladder-contact-phone-row">
                      <input
                        id="ladder-discuss-phone"
                        className="investments-native-ladder-contact-phone"
                        type="tel"
                        placeholder="(555) 555-5555"
                        value={ladderDiscuss.phone}
                        onChange={(event) => setLadderDiscuss((prev) => ({ ...prev, phone: formatPhoneInput(event.target.value) }))}
                      />
                      <div className="investments-native-ladder-contact-submit">
                        <button type="button" className="service-native-btn" onClick={sendLadderDiscuss}>
                          {calculatorCtaRuntime?.discussButtonLabel}
                        </button>
                        {ladderDiscussMessage ? (
                          <span className={`investments-native-ladder-discuss-message ${ladderDiscussTone}`}>
                            {ladderDiscussMessage}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section
        ref={testimonialsSectionRef}
        className={`service-native-section${getHudBlockStateClassName('testimonials')}${getOwnershipVisualForBlockId('testimonials').className || ''}`}
        data-block-id="testimonials"
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('testimonials')} />
        {renderHudAnchor('testimonials')}
        <div className="ag-panel-rail">
          <div className="service-native-testimonials-wrap carousel-stack">
            {testimonialsData.items.length ? testimonialsData.items.map((item, index) => (
              <article key={`${item.author}-${item.quote.slice(0, 24)}`} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p style={{ fontSize: 'clamp(1.35rem, 2.9vw, 2.2rem)', lineHeight: 1.15 }}>{item.quote}</p>
                <p>
                  -<strong>{item.author}{item.authorTitle ? ',' : ''}</strong>
                  {item.authorTitle ? <em> {item.authorTitle}</em> : null}
                </p>
              </article>
            )) : showFrontHud ? (
              <article className="carousel-frame is-active">
                <p style={{ fontSize: 'clamp(1.35rem, 2.9vw, 2.2rem)', lineHeight: 1.15 }}>No testimonials selected yet.</p>
                <p><strong>Choose quotes in the HUD selector.</strong></p>
              </article>
            ) : null}
          </div>
          {testimonialsData.showFineprint ? (
            <p className="service-native-note" style={{ textAlign: 'center' }}>
              {testimonialsData.fineprint}
            </p>
          ) : null}
        </div>
      </section>

      {featurePanelRuntime ? (
        <section
          ref={featurePanelSectionRef}
          className={`service-native-section${getHudBlockStateClassName('cash_reserves')}${getOwnershipVisualForBlockId('cash_reserves').className || ''}`}
          data-block-id="cash_reserves"
        >
          <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('cash_reserves')} />
          {renderHudAnchor('cash_reserves')}
          <div className="ag-panel-rail-wide">
            <div className="service-native-dark-feature fade-up">
              <div className="service-native-dark-feature-inner">
                <div
                  className="service-native-dark-feature-media"
                  role="img"
                  aria-label={featurePanelRuntime.imageAlt || featurePanelRuntime.title || 'Featured article'}
                  style={featurePanelRuntime.imageUrl ? {
                    backgroundImage: `radial-gradient(circle at 18% 28%, rgba(250, 163, 26, 0.44), transparent 52%), var(--ag-surface-blue-overlay-strong), url(${featurePanelRuntime.imageUrl})`,
                    backgroundSize: 'cover, cover, cover',
                    backgroundPosition: 'center, center, center',
                  } : undefined}
                />
                <div className="service-native-dark-feature-copy">
                  {featurePanelRuntime.title ? <h3>{featurePanelRuntime.title}</h3> : null}
                  {featurePanelRuntime.bodyHtml ? (
                    <SafeRichText as="div" className="service-native-dark-feature-body" html={featurePanelRuntime.bodyHtml} />
                  ) : featurePanelRuntime.body ? (
                    <p>{featurePanelRuntime.body}</p>
                  ) : null}
                  {featurePanelRuntime.action ? (
                    <div className="service-native-action-row">
                      {(featurePanelRuntime.action.to
                        || (featurePanelRuntime.action.href
                          && !isExternalLinkHref(featurePanelRuntime.action.href)
                          && featurePanelRuntime.action.href.startsWith('/'))) ? (
                            <Link
                              to={featurePanelRuntime.action.to || featurePanelRuntime.action.href}
                              className="service-native-btn"
                              target={featurePanelRuntime.action.openInNewWindow ? '_blank' : undefined}
                              rel={featurePanelRuntime.action.openInNewWindow ? 'noreferrer noopener' : undefined}
                            >
                              {featurePanelRuntime.action.label}
                            </Link>
                        ) : (
                          <a
                            href={featurePanelRuntime.action.href || featurePanelRuntime.action.to || '#'}
                            className="service-native-btn"
                            target={featurePanelRuntime.action.openInNewWindow ? '_blank' : undefined}
                            rel={featurePanelRuntime.action.openInNewWindow ? 'noreferrer noopener' : undefined}
                          >
                            {featurePanelRuntime.action.label}
                          </a>
                        )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
