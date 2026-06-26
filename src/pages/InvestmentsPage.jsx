import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BlockOwnershipOverlay, { getBlockOwnershipVisual, isForeignOwnedBlockOwnership } from '../components/BlockOwnershipOverlay';
import FrontHudAnchorTag from '../components/FrontHudAnchorTag';
import PageBlocksRenderer from '../components/blocks/PageBlocksRenderer';
import { inspectDynamicHeroSettings, useContentAdmin } from '../context/ContentAdminContext';
import { useFrontHud } from '../context/FrontHudContext';
import { useRates } from '../context/RatesContext';
import { useDocuments } from '../context/DocumentsContext';
import { useTestimonials } from '../context/TestimonialsContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import SafeRichText from '../components/SafeRichText';
import CertificateRatesSheet from '../components/CertificateRatesSheet';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
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
  buildDynamicFeaturePanelFromBlock,
  buildDynamicHeroFromBlock,
  buildDynamicIntroFromBlock,
  heroAnimationClassForLine,
  isExternalLinkHref,
  renderTextWithHighlights,
} from '../lib/dynamicPageBlocks';
import { shouldRenderHeroInlineEditor } from '../lib/heroHudMode';
import { getHeroSeedContract } from '../lib/heroSeedContracts';

const BlockHudPanelHost = lazy(() => import('../components/BlockHudPanelHost'));
const FrontHudPanelShell = lazy(() => import('../components/FrontHudPanelShell'));
const FrontHudPageWorkflow = lazy(() => import('../components/FrontHudPageWorkflow'));
const HeroInlineLiveEditor = lazy(async () => {
  const {
    HeroInlineLiveEditor: HeroInlineLiveEditorComponent,
    renderHeroRangesAsNodes,
  } = await import('../components/HeroHudEditorShared');
  return {
    default: function InvestmentsHeroInlineLiveEditor(props) {
      return (
        <HeroInlineLiveEditorComponent
          {...props}
          renderLineContent={(line) => renderHeroRangesAsNodes(line.text, line.highlights)}
        />
      );
    },
  };
});

const defaultInvestmentsIntroSettings = {
  heading: 'Invest like it matters. Because it does.',
  headingClassName: '',
  headingHighlightsJson: '[{"text":"Because it does.","className":"is-atlantean"}]',
  bodyHtml: '<p>Your investment dollars don\'t just multiply; they multiply ministry impact. Every dollar you invest generates a competitive return while funding church construction and ministry growth. When you invest like it matters, everything matters more.</p>',
  body: '',
  justify: 'center',
  lineSpacing: 1.04,
  extraLine: 'That\'s the power of faith-driven investing.',
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
};
const defaultInvestmentsCtaSettings = {
  title: 'Talk with an investments consultant.',
  titleClassName: '',
  titleHighlightsJson: '',
  bodyHtml: '<p>Share a few details and we’ll follow up with options that fit your goals.</p>',
  bgTone: 'white',
  submitStyle: 'outline',
  submitTone: 'atlantean',
  submitLabel: 'Follow-up with me',
  successMessage: 'Thanks. We’ll reach out soon.',
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
  field4Type: 'textarea',
  field4Label: 'Message',
  field4Placeholder: 'What would you like to discuss?',
  field4Options: '',
  field4Required: false,
};

const certificateCards = [
  {
    titleTop: 'Demand',
    titleBottom: 'Certificates',
    tone: 'atlantean',
    buttonTone: 'atlantean',
    description: 'Demand Certificates are variable rate investments that provide access to funds on demand (within 30 days).',
    minimum: 'Minimum investment $250.',
  },
  {
    titleTop: 'Term',
    titleBottom: 'Certificates',
    tone: 'mango',
    buttonTone: 'mango',
    description: 'Term Certificates have fixed or variable interest rates over a predetermined amount of time, ranging from three months to ten years.',
    minimum: 'Minimum investment $500.',
  },
];

const defaultInvestmentsGrowthFeatureSettings = {
  featureId: 'investments_growth_feature',
  body: 'Log in to manage.',
  buttonLabel: 'Go to my dashboard',
  buttonUrl: 'https://secure.agfinancial.org/',
  buttonPageRef: '',
  buttonOpenInNewWindow: true,
};

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
const INVESTMENTS_GROWTH_FEATURE_HUD_PANEL_ID = 'investments-growth-feature';
const INVESTMENTS_CALCULATOR_CTA_HUD_PANEL_ID = 'investments-calculator-cta';
const INVESTMENTS_CTA_HUD_PANEL_ID = 'investments-cta';
const INVESTMENTS_HUD_PANEL_ID_BY_BLOCK_ID = {
  hero: INVESTMENTS_HERO_HUD_PANEL_ID,
  intro: INVESTMENTS_INTRO_HUD_PANEL_ID,
  testimonials: INVESTMENTS_TESTIMONIALS_HUD_PANEL_ID,
  cash_reserves: INVESTMENTS_FEATURE_PANEL_HUD_PANEL_ID,
  growth_feature: INVESTMENTS_GROWTH_FEATURE_HUD_PANEL_ID,
  cta_form: INVESTMENTS_CTA_HUD_PANEL_ID,
  laddering: INVESTMENTS_CALCULATOR_CTA_HUD_PANEL_ID,
};
const CHURCH_CASH_RESERVES_ARTICLE_FEATURE = getResourceArticleFeatureConfig({
  slug: 'church-cash-reserves',
  title: 'Church Cash Reserves',
  fallbackImageAlt: 'Church Cash Reserves',
});
const INVESTMENTS_HERO_ANIMATION_PRESET = getHeroSeedContract('/services/investments')?.animationPreset || 'default';
const INVESTMENTS_BLUEPRINT_BLOCKS = Object.freeze(
  Array.isArray(contentBlockBlueprintsByPath['/services/investments'])
    ? contentBlockBlueprintsByPath['/services/investments']
    : [],
);
const INVESTMENTS_GROWTH_FEATURE_BLUEPRINT = Object.freeze(
  INVESTMENTS_BLUEPRINT_BLOCKS.find((block) => block?.id === 'growth_feature' && block?.kind === 'site_feature')
    || {
      id: 'growth_feature',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: defaultInvestmentsGrowthFeatureSettings,
    },
);
const INVESTMENTS_CTA_FORM_BLUEPRINT = Object.freeze(
  INVESTMENTS_BLUEPRINT_BLOCKS.find((block) => block?.id === 'cta_form' && block?.kind === 'cta_form')
    || {
      id: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      settings: defaultInvestmentsCtaSettings,
    },
);

function resolveInvestmentsHeroAnimationPreset(value) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === 'default' || normalized === 'loans-unblur') {
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

function buildInvestmentsCanonicalBlocks(blocks) {
  const sourceBlocks = Array.isArray(blocks) ? blocks : [];
  const visibleBlocks = sourceBlocks.filter((block) => block && typeof block === 'object');
  const hasGrowthFeature = visibleBlocks.some((block) => block?.id === 'growth_feature' && block?.kind === 'site_feature');
  const hasCtaForm = visibleBlocks.some((block) => block?.id === 'cta_form' && block?.kind === 'cta_form');
  const legacyInvestorCta = visibleBlocks.find((block) => block?.id === 'investor_cta' && block?.kind === 'cta_band');
  const legacyInvestorSettings = legacyInvestorCta?.settings && typeof legacyInvestorCta.settings === 'object'
    ? legacyInvestorCta.settings
    : {};
  const reconciledGrowthFeatureBlock = {
    ...INVESTMENTS_GROWTH_FEATURE_BLUEPRINT,
    settings: {
      ...(INVESTMENTS_GROWTH_FEATURE_BLUEPRINT.settings || {}),
      body: String(legacyInvestorSettings.body || legacyInvestorSettings.subtitle || '').trim()
        || String(INVESTMENTS_GROWTH_FEATURE_BLUEPRINT.settings?.body || '').trim()
        || defaultInvestmentsGrowthFeatureSettings.body,
      buttonLabel: String(legacyInvestorSettings.buttonLabel || '').trim()
        || String(INVESTMENTS_GROWTH_FEATURE_BLUEPRINT.settings?.buttonLabel || '').trim()
        || defaultInvestmentsGrowthFeatureSettings.buttonLabel,
      buttonUrl: String(legacyInvestorSettings.buttonUrl || '').trim()
        || String(INVESTMENTS_GROWTH_FEATURE_BLUEPRINT.settings?.buttonUrl || '').trim()
        || defaultInvestmentsGrowthFeatureSettings.buttonUrl,
      buttonPageRef: String(legacyInvestorSettings.buttonPageRef || '').trim()
        || String(INVESTMENTS_GROWTH_FEATURE_BLUEPRINT.settings?.buttonPageRef || '').trim()
        || defaultInvestmentsGrowthFeatureSettings.buttonPageRef,
      buttonOpenInNewWindow: legacyInvestorSettings.buttonOpenInNewWindow !== undefined
        ? legacyInvestorSettings.buttonOpenInNewWindow !== false
        : (INVESTMENTS_GROWTH_FEATURE_BLUEPRINT.settings?.buttonOpenInNewWindow !== false),
    },
  };

  const nextBlocks = [];
  let insertedGrowthFeature = false;
  let insertedCtaForm = false;

  const insertGrowthFeature = () => {
    if (insertedGrowthFeature || hasGrowthFeature) {
      return;
    }
    nextBlocks.push(reconciledGrowthFeatureBlock);
    insertedGrowthFeature = true;
  };

  const insertCtaForm = () => {
    if (insertedCtaForm || hasCtaForm) {
      return;
    }
    nextBlocks.push(INVESTMENTS_CTA_FORM_BLUEPRINT);
    insertedCtaForm = true;
  };

  visibleBlocks.forEach((block) => {
    if (block?.id === 'investor_cta' && block?.kind === 'cta_band') {
      insertGrowthFeature();
      insertCtaForm();
      return;
    }

    nextBlocks.push(block);

    if (block?.id === 'certificates' && !hasGrowthFeature) {
      insertGrowthFeature();
    }

    if (block?.id === 'growth_feature') {
      insertedGrowthFeature = true;
      insertCtaForm();
    }
  });

  insertGrowthFeature();
  insertCtaForm();

  return nextBlocks;
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

function pdfEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdfDocument(pageContents) {
  const encoder = new TextEncoder();
  const safePages = Array.isArray(pageContents) && pageContents.length ? pageContents : [''];
  const pageIds = safePages.map((_, index) => 4 + (index * 2));
  const contentIds = safePages.map((_, index) => 5 + (index * 2));

  const header = '%PDF-1.4\n';
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    `2 0 obj << /Type /Pages /Count ${safePages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >> endobj\n`,
    '3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];

  safePages.forEach((content, index) => {
    const contentBytes = encoder.encode(content);
    objects.push(
      `${pageIds[index]} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentIds[index]} 0 R >> endobj\n`,
    );
    objects.push(
      `${contentIds[index]} 0 obj << /Length ${contentBytes.length} >> stream\n${content}endstream\nendobj\n`,
    );
  });

  const offsets = [0];
  let cursor = encoder.encode(header).length;
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(cursor);
    cursor += encoder.encode(objects[index]).length;
  }

  const xrefStart = cursor;
  let xref = 'xref\n';
  xref += `0 ${offsets.length}\n`;
  xref += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  xref += '\n';

  const trailer = `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return new Blob([encoder.encode(`${header}${objects.join('')}${xref}${trailer}`)], { type: 'application/pdf' });
}

function buildLadderPdf({
  result,
  summaryCards,
  preparedFor,
  email,
}) {
  const teal = '0 0.64 0.70';
  const darkTeal = '0.03 0.31 0.37';
  const paleBlue = '0.93 0.97 0.98';
  const lightLine = '0.82 0.87 0.90';
  const pageCommands = [];
  const safeSummaryCards = Array.isArray(summaryCards) ? summaryCards.slice(0, 4) : [];
  const detailLines = [
    preparedFor ? `Prepared for: ${preparedFor}` : null,
    email ? `Email: ${email}` : null,
    `Total Investment Amount: $${formatCurrency(result.totalInvestment)}`,
    `Ladder span (years / longest term): ${result.ladderYears}`,
    `Timeline years to visualize: ${result.horizonYears}`,
    `Maturity behavior: ${result.reinvestMode === 'reinvest_longest' ? 'Reinvest matured principal into longest term' : 'Keep matured principal as cash'}`,
    `APY assumptions: ${Array.from({ length: result.ladderYears }, (_, index) => (
      `${index + 1}-Year ${Number(result.apyByYear[index + 1] || 0).toFixed(2)}%`
    )).join('  |  ')}`,
  ].filter(Boolean);

  const scheduleRows = Array.isArray(result.scheduleRows) ? result.scheduleRows : [];
  const initialRows = Array.isArray(result.initialRows) ? result.initialRows : [];
  const scheduleChunks = [];
  const firstScheduleCapacity = 14;
  const laterScheduleCapacity = 32;

  scheduleChunks.push(scheduleRows.slice(0, firstScheduleCapacity));
  for (let index = firstScheduleCapacity; index < scheduleRows.length; index += laterScheduleCapacity) {
    scheduleChunks.push(scheduleRows.slice(index, index + laterScheduleCapacity));
  }

  const makeHeader = (title, subtitle, pageNumber) => {
    let content = '';
    content += 'q\n';
    content += `${teal} rg\n`;
    content += '36 724 540 48 re f\n';
    content += `${paleBlue} rg\n`;
    content += '36 706 540 18 re f\n';
    content += 'Q\n';
    content += 'BT\n';
    content += '1 1 1 rg\n';
    content += '/F1 20 Tf\n';
    content += `1 0 0 1 54 751 Tm (${pdfEscape(title)}) Tj\n`;
    content += `${darkTeal} rg\n`;
    content += '/F1 9 Tf\n';
    content += `1 0 0 1 54 712 Tm (${pdfEscape(subtitle)}) Tj\n`;
    content += `1 0 0 1 520 712 Tm (Page ${pageNumber}) Tj\n`;
    content += 'ET\n';
    return content;
  };

  let firstPage = makeHeader('AGFinancial Investment Laddering Strategy', 'Strategy summary and yearly breakdown', 1);
  firstPage += 'q\n';
  safeSummaryCards.forEach((card, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 54 + (column * 252);
    const y = 632 - (row * 72);
    firstPage += `${paleBlue} rg\n`;
    firstPage += `${x} ${y} 234 58 re f\n`;
    firstPage += `${lightLine} RG 1 w\n`;
    firstPage += `${x} ${y} 234 58 re S\n`;
  });
  firstPage += 'Q\n';
  firstPage += 'BT\n';
  safeSummaryCards.forEach((card, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 68 + (column * 252);
    const y = 674 - (row * 72);
    firstPage += `${darkTeal} rg\n`;
    firstPage += '/F1 8 Tf\n';
    firstPage += `1 0 0 1 ${x} ${y} Tm (${pdfEscape(card.label)}) Tj\n`;
    firstPage += `${teal} rg\n`;
    firstPage += '/F1 13 Tf\n';
    firstPage += `1 0 0 1 ${x} ${y - 20} Tm (${pdfEscape(card.value)}) Tj\n`;
  });
  firstPage += `${darkTeal} rg\n`;
  firstPage += '/F1 9 Tf\n';
  detailLines.forEach((line, index) => {
    firstPage += `1 0 0 1 54 ${520 - (index * 14)} Tm (${pdfEscape(line)}) Tj\n`;
  });
  firstPage += 'ET\n';

  firstPage += 'q\n';
  firstPage += `${paleBlue} rg\n54 406 540 22 re f\n`;
  firstPage += '150 266 92 140 re f\n';
  firstPage += '430 266 108 140 re f\n';
  firstPage += '396 76 142 168 re f\n';
  firstPage += `${lightLine} RG 1 w\n`;
  firstPage += '54 406 540 22 re S\n';
  firstPage += '54 244 540 22 re S\n';
  firstPage += 'Q\n';
  firstPage += 'BT\n';
  firstPage += `${darkTeal} rg\n/F1 10 Tf\n`;
  firstPage += '1 0 0 1 68 413 Tm (Ladder breakdown) Tj\n';
  firstPage += '1 0 0 1 68 251 Tm (Year-by-year schedule) Tj\n';
  firstPage += '/F1 8 Tf\n';
  firstPage += '1 0 0 1 68 391 Tm (Term) Tj\n';
  firstPage += '1 0 0 1 160 391 Tm (Principal) Tj\n';
  firstPage += '1 0 0 1 258 391 Tm (APY) Tj\n';
  firstPage += '1 0 0 1 334 391 Tm (Interest) Tj\n';
  firstPage += '1 0 0 1 442 391 Tm (Ending Value) Tj\n';
  firstPage += '1 0 0 1 68 236 Tm (Year) Tj\n';
  firstPage += '1 0 0 1 124 236 Tm (Principal) Tj\n';
  firstPage += '1 0 0 1 220 236 Tm (Interest) Tj\n';
  firstPage += '1 0 0 1 308 236 Tm (Reinvested) Tj\n';
  firstPage += '1 0 0 1 408 236 Tm (Cash Available) Tj\n';
  firstPage += `${darkTeal} rg\n/F1 8 Tf\n`;

  initialRows.forEach((row, index) => {
    const y = 374 - (index * 15);
    firstPage += `1 0 0 1 68 ${y} Tm (${pdfEscape(`${row.termYears}-Year`)}) Tj\n`;
    firstPage += `1 0 0 1 160 ${y} Tm ($${pdfEscape(formatCurrency(row.principal))}) Tj\n`;
    firstPage += `1 0 0 1 258 ${y} Tm (${pdfEscape(`${row.apyPercent.toFixed(2)}%`)}) Tj\n`;
    firstPage += `1 0 0 1 334 ${y} Tm ($${pdfEscape(formatCurrency(row.interest))}) Tj\n`;
    firstPage += `1 0 0 1 442 ${y} Tm ($${pdfEscape(formatCurrency(row.endingValue))}) Tj\n`;
  });

  (scheduleChunks[0] || []).forEach((row, index) => {
    const y = 220 - (index * 12);
    firstPage += `1 0 0 1 68 ${y} Tm (${pdfEscape(`Year ${row.year}`)}) Tj\n`;
    firstPage += `1 0 0 1 124 ${y} Tm ($${pdfEscape(formatCurrency(row.principalMaturing))}) Tj\n`;
    firstPage += `1 0 0 1 220 ${y} Tm ($${pdfEscape(formatCurrency(row.interestMaturing))}) Tj\n`;
    firstPage += `1 0 0 1 320 ${y} Tm (${pdfEscape(row.reinvested ? 'Yes' : 'No')}) Tj\n`;
    firstPage += `1 0 0 1 408 ${y} Tm ($${pdfEscape(formatCurrency(row.totalCashAvailable))}) Tj\n`;
  });

  firstPage += `${darkTeal} rg\n/F1 8 Tf\n`;
  firstPage += `1 0 0 1 54 42 Tm (${pdfEscape('This tool illustrates ladder mechanics. APY values can change. Results are estimates.')}) Tj\n`;
  firstPage += 'ET\n';
  pageCommands.push(firstPage);

  for (let pageIndex = 1; pageIndex < scheduleChunks.length; pageIndex += 1) {
    const pageRows = scheduleChunks[pageIndex];
    let page = makeHeader('AGFinancial Investment Laddering Strategy', 'Year-by-year schedule continued', pageIndex + 1);
    page += 'q\n';
    page += `${paleBlue} rg\n54 666 540 22 re f\n`;
    page += '396 118 142 548 re f\n';
    page += 'Q\n';
    page += 'BT\n';
    page += `${darkTeal} rg\n/F1 10 Tf\n`;
    page += '1 0 0 1 68 673 Tm (Year-by-year schedule) Tj\n';
    page += '/F1 8 Tf\n';
    page += '1 0 0 1 68 649 Tm (Year) Tj\n';
    page += '1 0 0 1 124 649 Tm (Principal) Tj\n';
    page += '1 0 0 1 220 649 Tm (Interest) Tj\n';
    page += '1 0 0 1 308 649 Tm (Reinvested) Tj\n';
    page += '1 0 0 1 408 649 Tm (Cash Available) Tj\n';
    page += `${darkTeal} rg\n`;
    pageRows.forEach((row, index) => {
      const y = 632 - (index * 16);
      page += `1 0 0 1 68 ${y} Tm (${pdfEscape(`Year ${row.year}`)}) Tj\n`;
      page += `1 0 0 1 124 ${y} Tm ($${pdfEscape(formatCurrency(row.principalMaturing))}) Tj\n`;
      page += `1 0 0 1 220 ${y} Tm ($${pdfEscape(formatCurrency(row.interestMaturing))}) Tj\n`;
      page += `1 0 0 1 320 ${y} Tm (${pdfEscape(row.reinvested ? 'Yes' : 'No')}) Tj\n`;
      page += `1 0 0 1 408 ${y} Tm ($${pdfEscape(formatCurrency(row.totalCashAvailable))}) Tj\n`;
    });
    page += `${darkTeal} rg\n/F1 8 Tf\n`;
    page += `1 0 0 1 54 42 Tm (${pdfEscape('This tool illustrates ladder mechanics. APY values can change. Results are estimates.')}) Tj\n`;
    page += 'ET\n';
    pageCommands.push(page);
  }

  return buildPdfDocument(pageCommands);
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
export function simulateLadderSchedule({
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

  const createRung = ({
    principal,
    termYears,
    startYear,
    isRollover,
    laneId,
    originTermYears,
  }) => {
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
      laneId,
      originTermYears,
    };
  };

  for (let termYears = 1; termYears <= ladderYears; termYears += 1) {
    const rung = createRung({
      principal: principalSlices[termYears - 1],
      termYears,
      startYear: 0,
      isRollover: false,
      laneId: termYears,
      originTermYears: termYears,
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
          laneId: matured.laneId,
          originTermYears: matured.originTermYears,
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

function renderLadderTitle(title) {
  const source = String(title || '').trim();
  if (!source) {
    return null;
  }
  const match = source.match(/laddering/i);
  if (!match || typeof match.index !== 'number') {
    return source;
  }
  const start = match.index;
  const end = start + match[0].length;
  return (
    <>
      {source.slice(0, start)}
      <mark className="is-atlantean">{source.slice(start, end)}</mark>
      {source.slice(end)}
    </>
  );
}

function buildLadderVisualRows(result) {
  if (!result) {
    return [];
  }
  const rowsByLane = new Map();

  result.timelineBars
    .filter((bar) => bar.startYear < result.horizonYears)
    .slice()
    .sort((a, b) => (
      a.startYear - b.startYear
      || a.maturityYear - b.maturityYear
      || (a.laneId || 0) - (b.laneId || 0)
      || a.id - b.id
    ))
    .forEach((bar) => {
      const laneId = bar.laneId || bar.originTermYears || bar.termYears || bar.id;
      if (!rowsByLane.has(laneId)) {
        rowsByLane.set(laneId, {
          laneId,
          originTermYears: bar.originTermYears || bar.termYears || laneId,
          principal: bar.principal,
          bars: [],
        });
      }
      rowsByLane.get(laneId).bars.push(bar);
    });

  return Array.from(rowsByLane.values())
    .sort((a, b) => a.originTermYears - b.originTermYears)
    .map((row) => {
      const sortedBars = row.bars.slice().sort((a, b) => (
        a.startYear - b.startYear
        || a.maturityYear - b.maturityYear
        || a.id - b.id
      ));
      const markers = sortedBars
        .filter((bar) => bar.maturityYear <= result.horizonYears)
        .map((bar) => ({
          id: `marker-${bar.id}`,
          year: bar.maturityYear,
          rollsForward: sortedBars.some((candidate) => candidate.startYear === bar.maturityYear),
        }));

      return {
        ...row,
        bars: sortedBars,
        markers,
      };
    });
}

function getLadderStrategyLabel(reinvestMode, ladderYears) {
  return reinvestMode === 'reinvest_longest'
    ? `Reinvest into ${ladderYears}-year terms`
    : 'Keep maturities available as cash';
}

function buildLadderSummaryCards(result, reinvestMode, helperText) {
  if (!result) {
    return [];
  }
  const firstMaturity = result.scheduleRows.find((row) => row.principalMaturing > 0)?.year || 1;
  return [
    {
      label: 'Starting amount',
      value: `$${formatCurrency(result.totalInvestment)}`,
      detail: 'Allocated across the initial ladder.',
    },
    {
      label: 'Certificates',
      value: `${result.initialRows.length} total`,
      detail: `Built from 1-year through ${result.ladderYears}-year terms.`,
    },
    {
      label: 'Maturity rhythm',
      value: `Year ${firstMaturity} onward`,
      detail: reinvestMode === 'reinvest_longest'
        ? 'Maturities stay in motion with annual rollover opportunities.'
        : 'Maturities stay available as cash as the ladder winds down.',
    },
    {
      label: 'Strategy',
      value: getLadderStrategyLabel(reinvestMode, result.ladderYears),
      detail: helperText,
    },
  ];
}

export default function InvestmentsPage() {
  const pageRef = useRef(null);
  const heroSectionRef = useRef(null);
  const introSectionRef = useRef(null);
  const testimonialsSectionRef = useRef(null);
  const featurePanelSectionRef = useRef(null);
  const growthFeatureSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);
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
  const [ladderDownloadOptIn, setLadderDownloadOptIn] = useState(true);
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
    () => buildInvestmentsCanonicalBlocks(
      Array.isArray(blocksByPath?.['/services/investments']) ? blocksByPath['/services/investments'] : [],
    ),
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
  const growthFeatureBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'growth_feature'
      && block?.kind === 'site_feature'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const ctaFormBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'cta_form'
      && block?.kind === 'cta_form'
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
  const renderedGrowthFeatureBlock = useMemo(() => (
    growthFeatureBlock || {
      id: 'growth_feature',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: defaultInvestmentsGrowthFeatureSettings,
    }
  ), [growthFeatureBlock]);
  const renderedCtaFormBlock = useMemo(() => (
    ctaFormBlock || {
      id: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      settings: defaultInvestmentsCtaSettings,
    }
  ), [ctaFormBlock]);
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
              : panel.blockId === 'growth_feature'
                ? growthFeatureSectionRef
                : panel.blockId === 'cta_form'
                    ? ctaSectionRef
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
  const hudAnchorPanelsByBlockId = useMemo(() => (
    hudPanels.reduce((next, panel) => {
      const blockId = String(panel?.blockId || '').trim();
      if (!blockId) {
        return next;
      }
      next[blockId] = {
        panelId: panel.id,
        label: panel.label,
        anchorSelector: `[data-block-id="${blockId}"]`,
      };
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
  const scrollToSelector = (selector) => {
    if (!selector || typeof document === 'undefined') {
      return;
    }
    scrollElementWithNavOffset(document.querySelector(selector));
  };

  const setHudPanelOpen = (panelId, sectionRef, options = {}) => {
    const shouldScroll = options.scrollToTarget !== false;
    setHudDockCollapsed(false);
    setActiveHudPanelId(panelId);
    if (shouldScroll) {
      scrollElementWithNavOffset(sectionRef?.current);
    }
  };
  const openHudPanelBySelector = (panelId, anchorSelector) => {
    setHudDockCollapsed(false);
    setActiveHudPanelId(panelId);
    scrollToSelector(anchorSelector);
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
    if (isForeignOwnedBlockOwnership(getOwnershipVisualForBlockId('hero'))) {
      return;
    }
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
  const ladderVisualizeYears = clamp(
    parseInteger(ladderInput.visualizeYears) || suggestedHorizon(ladderYears),
    ladderYears + 1,
    MAX_VISUALIZE_YEARS,
  );

  const hasCustomRateInputs = Array.from({ length: ladderYears }, (_, index) => index + 1).some((year) => (
    Math.abs(parseNumber(ladderRates[year]) - parseNumber(ladderRateSeeds[year])) > 0.0001
  ));

  const canDownloadLadder = Boolean(ladderResult);
  const ladderDiscussTone = ladderDiscussMessage.startsWith('Thanks') ? 'is-success' : 'is-alert';

  const ladderPreview = useMemo(() => {
    const apyByYear = {};
    for (let year = 1; year <= ladderYears; year += 1) {
      apyByYear[year] = Math.max(0, parseNumber(ladderRates[year] || ladderRateSeeds[year]));
    }
    return simulateLadderSchedule({
      totalInvestment: Math.max(0, parseNumber(ladderInput.totalInvestment)),
      ladderYears,
      horizonYears: ladderVisualizeYears,
      reinvestMode: ladderInput.reinvestMode,
      apyByYear,
    });
  }, [
    ladderInput.reinvestMode,
    ladderInput.totalInvestment,
    ladderRateSeeds,
    ladderRates,
    ladderVisualizeYears,
    ladderYears,
  ]);

  const ladderPreviewYears = useMemo(() => (
    Array.from({ length: ladderPreview.horizonYears + 1 }, (_, year) => year)
  ), [ladderPreview]);

  const ladderPreviewRows = useMemo(
    () => buildLadderVisualRows(ladderPreview),
    [ladderPreview],
  );

  const ladderPreviewSummaryCards = useMemo(
    () => buildLadderSummaryCards(ladderPreview, ladderInput.reinvestMode, ladderToggleHelper),
    [ladderInput.reinvestMode, ladderPreview, ladderToggleHelper],
  );

  const ladderResultSummaryCards = useMemo(
    () => (ladderResult ? buildLadderSummaryCards(ladderResult, ladderResult.reinvestMode, ladderToggleHelper) : []),
    [ladderResult, ladderToggleHelper],
  );

  const ladderResultsRhythm = useMemo(() => (
    ladderResult ? ladderResult.scheduleRows.filter((row) => row.principalMaturing > 0 || row.interestMaturing > 0) : []
  ), [ladderResult]);

  const onLadderTotalChange = (value) => {
    setLadderInput((prev) => ({ ...prev, totalInvestment: formatNumberInput(value) }));
  };

  const onLadderYearsChange = (value) => {
    const normalizedYears = clamp(parseInteger(value) || 1, 1, MAX_LADDER_YEARS);
    setLadderInput((prev) => ({
      ...prev,
      ladderYears: String(normalizedYears),
      visualizeYears: ladderVisualizeTouched
        ? String(clamp(
          parseInteger(prev.visualizeYears) || suggestedHorizon(normalizedYears),
          normalizedYears + 1,
          MAX_VISUALIZE_YEARS,
        ))
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
    const parsed = clamp(parseInteger(value) || (ladderYears + 1), ladderYears + 1, MAX_VISUALIZE_YEARS);
    setLadderVisualizeTouched(true);
    setLadderInput((prev) => ({ ...prev, visualizeYears: String(parsed) }));
  };

  const onLadderReinvestModeChange = (value) => {
    setLadderInput((prev) => ({ ...prev, reinvestMode: value }));
  };

  const onLadderRateChange = (year, value) => {
    setLadderRates((prev) => ({ ...prev, [year]: formatNumberInput(value) }));
  };

  const stepLadderYears = (delta) => {
    onLadderYearsChange(String(clamp(ladderYears + delta, 1, MAX_LADDER_YEARS)));
  };

  const stepLadderVisualizeYears = (delta) => {
    onLadderVisualizeYearsChange(String(clamp(
      ladderVisualizeYears + delta,
      ladderYears + 1,
      MAX_VISUALIZE_YEARS,
    )));
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
    if (!ladderResult) {
      return;
    }
    const blob = buildLadderPdf({
      result: ladderResult,
      summaryCards: ladderResultSummaryCards,
      preparedFor: ladderDownload.name.trim(),
      email: ladderDownload.email.trim(),
    });
    const url = URL.createObjectURL(blob);
    const safeName = ladderDownload.name.trim().replace(/[^\w-]+/g, '-');
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeName || 'investor'}-laddering-strategy.pdf`;
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
        <Suspense fallback={null}>
          <FrontHudPageWorkflow pathname="/services/investments" reviewHref="/admin/content?page=%2Fservices%2Finvestments" placement="bar" />
        </Suspense>
      ) : null}
      {hasOpenHudPanel && activeHudPanel ? (
        <Suspense fallback={null}>
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
        </Suspense>
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
            <Suspense fallback={null}>
              <HeroInlineLiveEditor
                lines={heroHudEditableLines}
                activeLineKey={heroActiveLineData?.key || ''}
                lineHeight={heroHudLineHeight}
                onLineTextChange={handleHeroHudLineTextChange}
                commitOnBlurOnly
                readOnly={isForeignOwnedBlockOwnership(getOwnershipVisualForBlockId('hero'))}
                onLineInteract={handleHeroLineInteract}
                setLineInputRef={(lineKey, node) => {
                  heroLineInputRefs.current[lineKey] = node;
                }}
                resolveLineClassName={(line, index) => line.className || `line${index + 1}`}
              />
            </Suspense>
          ) : dynamicHero?.lines?.length ? dynamicHero.lines.map((line, index) => {
            const lineNumber = index + 1;
            const animationClass = heroAnimationClassForLine(dynamicHero.animationPreset, lineNumber);
            const className = [line.className || `line${lineNumber}`, animationClass].filter(Boolean).join(' ');
            return (
              <h1
                key={`investments-hero-line-${line.id || lineNumber}`}
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
              <h1 className={['line1', heroAnimationClassForLine(INVESTMENTS_HERO_ANIMATION_PRESET, 1)].filter(Boolean).join(' ')}>
                Your <mark className="is-atlantean">investments</mark>.
              </h1>
              <h1 className={['line2', heroAnimationClassForLine(INVESTMENTS_HERO_ANIMATION_PRESET, 2)].filter(Boolean).join(' ')}>
                Your <mark className="is-mango">faith</mark>.
              </h1>
              <h1 className={['line3', heroAnimationClassForLine(INVESTMENTS_HERO_ANIMATION_PRESET, 3)].filter(Boolean).join(' ')}>
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
          <div className="service-native-grid is-two investments-native-cert-grid">
            {certificateCards.map((card) => (
              <article
                key={`${card.titleTop}-${card.titleBottom}`}
                className={`service-native-card investments-native-cert-card investments-native-cert-card--${card.tone} fade-up fade-up-force-observe`}
              >
                <div className="investments-native-cert-card__cap">
                  <h3>{card.titleTop}<br />{card.titleBottom}</h3>
                </div>
                <div className="investments-native-cert-card__body">
                  <p>
                    {card.description}
                    {' '}
                    <strong>{card.minimum}</strong>
                  </p>
                  <div className="service-native-action-row">
                    <a
                      href="https://secure.agfinancial.org/invest"
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`service-native-btn is-outline is-tone-${card.buttonTone}`}
                    >
                      Start investing
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div ref={growthFeatureSectionRef}>
        <PageBlocksRenderer
          blocks={[renderedGrowthFeatureBlock]}
          ownershipEnabled={showFrontHud}
          ownershipPathname="/services/investments"
          hudAnchorsByBlockId={showFrontHud ? hudAnchorPanelsByBlockId : null}
          activeHudPanelId={activeHudPanelId}
          hudDockCollapsed={hudDockCollapsed}
          hudOpacityRatio={frontHudOpacityRatio}
          onHudAnchorClick={showFrontHud ? openHudPanelBySelector : null}
        />
      </div>

      <div ref={ctaSectionRef}>
        <PageBlocksRenderer
          blocks={[renderedCtaFormBlock]}
          ownershipEnabled={showFrontHud}
          ownershipPathname="/services/investments"
          hudAnchorsByBlockId={showFrontHud ? hudAnchorPanelsByBlockId : null}
          activeHudPanelId={activeHudPanelId}
          hudDockCollapsed={hudDockCollapsed}
          hudOpacityRatio={frontHudOpacityRatio}
          onHudAnchorClick={showFrontHud ? openHudPanelBySelector : null}
        />
      </div>

      <section className="service-native-section investments-native-rates-section">
        <div className="ag-panel-rail" id="rates">
          <h2 className="investments-native-rates-title">AGFinancial Investment Certificates Rates</h2>
          <div className="investments-native-rates-wrap fade-up">
            <CertificateRatesSheet rates={rates} className="investments-native-certificate-rates-sheet" />
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
              Offering Circular may be obtained by writing or calling AGFinancial or by clicking to
              {' '}
              <a href={offeringCircularDoc?.url || '/prospectus'} target="_blank" rel="noreferrer noopener">read the prospectus</a>
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
            <div className="investments-native-ladder-intro" data-ladder-intro>
              <div className="investments-native-ladder-intro-copy">
                <h2>{renderLadderTitle(calculatorCtaRuntime?.title)}</h2>
                <p className="investments-native-ladder-lead">{calculatorCtaRuntime?.subtitle}</p>
                <p className="investments-native-ladder-copy">{calculatorCtaRuntime?.body}</p>
              </div>
            </div>

            <div className="investments-native-ladder-shell">
              <section className="investments-native-ladder-panel investments-native-ladder-preview" aria-labelledby="ladder-preview-title" data-ladder-preview-card>
                <div className="investments-native-ladder-panel-head">
                  <div>
                    <h3 id="ladder-preview-title">Your ladder at a glance</h3>
                    <p>
                      All {ladderPreview.initialRows.length} certificate{ladderPreview.initialRows.length === 1 ? '' : 's'} start today,
                      with staggered maturity years.
                    </p>
                  </div>
                  <span className="investments-native-ladder-badge">Initial setup</span>
                </div>

                <div className="investments-native-ladder-summary-strip">
                  {ladderPreviewSummaryCards.map((item) => (
                    <div key={item.label} className="investments-native-ladder-summary-chip" data-ladder-summary-tile>
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>

                <p className="investments-native-ladder-preview-copy">
                  {ladderInput.reinvestMode === 'reinvest_longest'
                    ? `Start with equal investments across 1-year through ${ladderYears}-year certificates. As each matures, it can roll into a new ${ladderYears}-year certificate.`
                    : `Start with equal investments across 1-year through ${ladderYears}-year certificates. As each matures, keep that cash available instead of rolling into a new ${ladderYears}-year certificate.`}
                </p>
                <p className="investments-native-ladder-preview-note">
                  This view shows the starting ladder. Open the timeline to see how maturities roll forward.
                </p>

                <div className="investments-native-ladder-mini-visual" aria-label="Initial ladder setup">
                  <p className="investments-native-ladder-mini-heading">Initial ladder setup</p>
                  <div
                    className="investments-native-ladder-mini-scale"
                    style={{ gridTemplateColumns: `58px repeat(${ladderYears}, minmax(0, 1fr))` }}
                  >
                    <span data-ladder-mini-axis-label>Start</span>
                    {Array.from({ length: ladderYears }, (_, index) => index + 1).map((year) => (
                      <span key={`mini-year-${year}`} data-ladder-mini-axis-year={year}>Year {year}</span>
                    ))}
                  </div>

                  <div className="investments-native-ladder-visual-rows is-mini">
                    {ladderPreviewRows.map((row) => {
                      const safeHorizon = Math.max(ladderYears, 1);
                      const initialBars = row.bars.filter((bar) => bar.startYear === 0);
                      const initialMarker = row.markers.find((marker) => marker.year <= safeHorizon);

                      return (
                        <article key={`mini-row-${row.laneId}`} className="investments-native-ladder-rung-row is-mini" data-ladder-mini-row={row.originTermYears}>
                          <div className="investments-native-ladder-rung-meta is-mini">
                            <strong>{row.originTermYears}-Year</strong>
                            {initialMarker ? (
                              <span className="sr-only">
                                {`${row.originTermYears}-year certificate matures in Year ${initialMarker.year}.`}
                              </span>
                            ) : null}
                          </div>
                          <div className="investments-native-ladder-rung-track is-mini" style={{ '--ladder-tick-step': `${100 / safeHorizon}%` }}>
                            {initialBars.map((bar) => {
                              const visibleStart = Math.max(0, Math.min(bar.startYear, safeHorizon));
                              const visibleEnd = Math.max(visibleStart, Math.min(bar.maturityYear, safeHorizon));
                              const spanYears = Math.max(0.01, visibleEnd - visibleStart);
                              const leftPct = (visibleStart / safeHorizon) * 100;
                              const widthPct = (spanYears / safeHorizon) * 100;

                              return (
                                <div
                                  key={`mini-bar-${bar.id}`}
                                  className="investments-native-ladder-rung-bar"
                                  data-ladder-mini-bar={row.originTermYears}
                                  style={{
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                  }}
                                />
                              );
                            })}
                            {initialMarker ? (
                              <span
                                className="investments-native-ladder-rung-marker"
                                style={{ left: `${(initialMarker.year / safeHorizon) * 100}%` }}
                                data-ladder-mini-maturity-marker={initialMarker.year}
                                aria-hidden="true"
                              >
                                <span className="investments-native-ladder-rung-dot" />
                              </span>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <details className="investments-native-ladder-timeline-details">
                  <summary className="investments-native-ladder-advanced-summary">View ongoing rollover timeline</summary>
                  <p className="investments-native-ladder-detail-intro">{ladderBuildSteadyCopy}</p>
                  <div className="investments-native-ladder-legend" aria-label="Ladder legend">
                    <span><i className="is-bar" aria-hidden="true" />Active certificate term</span>
                    <span><i className="is-dot" aria-hidden="true" />Maturity / cash access</span>
                    <span><i className="is-rollover" aria-hidden="true" />Rollover</span>
                  </div>
                  <div className="investments-native-ladder-preview-scale" aria-hidden="true">
                    <span>Start</span>
                    <span>Year {Math.max(1, Math.round(ladderPreview.horizonYears / 2))}</span>
                    <span>Year {ladderPreview.horizonYears}</span>
                  </div>
                  <div className="investments-native-ladder-scroll-hint">Scroll horizontally to see the full timeline.</div>
                  <div className="investments-native-ladder-visual-scroll has-fade">
                    <div className="investments-native-ladder-visual-shell">
                      <div
                        className="investments-native-ladder-visual-years"
                        style={{ gridTemplateColumns: `repeat(${ladderPreviewYears.length}, minmax(70px, 1fr))` }}
                      >
                        {ladderPreviewYears.map((year) => (
                          <div key={`preview-year-${year}`} className="investments-native-ladder-year-label">
                            Year {year}
                          </div>
                        ))}
                      </div>

                      <div className="investments-native-ladder-visual-rows is-detailed">
                        {ladderPreviewRows.map((row) => {
                          const safeHorizon = Math.max(ladderPreview.horizonYears, 1);
                          return (
                            <article key={`timeline-row-${row.laneId}`} className="investments-native-ladder-rung-row" data-ladder-rung-row>
                              <div className="investments-native-ladder-rung-meta">
                                <strong>Rung {row.originTermYears}</strong>
                                <span>{row.originTermYears}-year start</span>
                                <small>${formatCurrency(row.principal)} principal</small>
                              </div>
                              <div className="investments-native-ladder-rung-track" style={{ '--ladder-tick-step': `${100 / safeHorizon}%` }}>
                                {row.bars.map((bar) => {
                                  const visibleStart = Math.max(0, Math.min(bar.startYear, safeHorizon));
                                  const visibleEnd = Math.max(visibleStart, Math.min(bar.maturityYear, safeHorizon));
                                  const spanYears = Math.max(0.01, visibleEnd - visibleStart);
                                  const leftPct = (visibleStart / safeHorizon) * 100;
                                  const widthPct = (spanYears / safeHorizon) * 100;

                                  return (
                                    <div
                                      key={`timeline-bar-${bar.id}`}
                                      className={`investments-native-ladder-rung-bar${bar.isRollover ? ' is-rollover' : ''}`}
                                      style={{
                                        left: `${leftPct}%`,
                                        width: `${widthPct}%`,
                                      }}
                                    >
                                      {bar.termYears}-year
                                    </div>
                                  );
                                })}
                                {row.markers.map((marker) => {
                                  const maturityPct = (Math.min(marker.year, safeHorizon) / safeHorizon) * 100;
                                  return (
                                    <span
                                      key={`timeline-marker-${marker.id}`}
                                      className="investments-native-ladder-rung-marker"
                                      style={{ left: `${maturityPct}%` }}
                                      data-ladder-maturity-marker
                                      aria-hidden="true"
                                    >
                                      <span className="investments-native-ladder-rung-dot" />
                                      {marker.rollsForward ? (
                                        <span className="investments-native-ladder-rung-rollover" aria-hidden="true">↻</span>
                                      ) : null}
                                    </span>
                                  );
                                })}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </details>
              </section>

              <section className="investments-native-ladder-panel investments-native-ladder-builder" aria-labelledby="ladder-builder-title">
                <div className="investments-native-ladder-panel-head">
                  <div>
                    <h3 id="ladder-builder-title">Adjust my ladder</h3>
                    <p>Update the amount, span, and maturity strategy.</p>
                  </div>
                </div>

                <div className="investments-native-ladder-builder-grid">
                  <label htmlFor="ladder-total" className="investments-native-ladder-field is-amount">
                    <span className="investments-native-ladder-field-label">{calculatorCtaRuntime?.totalInvestmentLabel}</span>
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

                  <div className="investments-native-ladder-field">
                    <div className="investments-native-ladder-field-head">
                      <label htmlFor="ladder-years" className="investments-native-ladder-field-label">{calculatorCtaRuntime?.ladderYearsLabel}</label>
                      <span className="investments-native-ladder-chip-note">Popular spans</span>
                    </div>
                    <div className="investments-native-ladder-chip-row" role="group" aria-label="Popular ladder span options">
                      {[3, 4, 5].map((year) => {
                        const isSelected = ladderYears === year;
                        return (
                          <button
                            key={year}
                            type="button"
                            className={`investments-native-ladder-chip${isSelected ? ' is-selected' : ''}`}
                            aria-pressed={isSelected}
                            onClick={() => onLadderYearsChange(String(year))}
                          >
                            <span>{year}-Year</span>
                          </button>
                        );
                      })}
                    </div>
                    <details className="investments-native-ladder-span-details">
                      <summary className="investments-native-ladder-advanced-summary">Custom span</summary>
                      <div className="investments-native-ladder-span-stepper-shell">
                        <div className="investments-native-ladder-stepper">
                          <button type="button" className="investments-native-ladder-stepper-btn" aria-label="Decrease ladder span" onClick={() => stepLadderYears(-1)}>−</button>
                          <input
                            id="ladder-years"
                            type="text"
                            inputMode="numeric"
                            value={ladderInput.ladderYears}
                            onChange={(event) => onLadderYearsChange(event.target.value)}
                          />
                          <button type="button" className="investments-native-ladder-stepper-btn" aria-label="Increase ladder span" onClick={() => stepLadderYears(1)}>+</button>
                        </div>
                      </div>
                    </details>
                    <span className="investments-native-ladder-field-helper">
                      {calculatorCtaRuntime?.ladderYearsHelper}
                    </span>
                  </div>

                  <fieldset className="investments-native-ladder-field investments-native-ladder-choice-group">
                    <legend className="investments-native-ladder-field-label">{calculatorCtaRuntime?.maturityLabel}</legend>
                    <div className="investments-native-ladder-choice-grid is-compact">
                      <label htmlFor="ladder-reinvest" className={`investments-native-ladder-choice${ladderInput.reinvestMode === 'reinvest_longest' ? ' is-selected' : ''}`}>
                        <input
                          id="ladder-reinvest"
                          type="radio"
                          name="ladder-reinvest-mode"
                          value="reinvest_longest"
                          checked={ladderInput.reinvestMode === 'reinvest_longest'}
                          onChange={(event) => onLadderReinvestModeChange(event.target.value)}
                        />
                        <span className="investments-native-ladder-choice-copy">
                          <strong>{calculatorCtaRuntime?.reinvestOptionLabel}</strong>
                        </span>
                      </label>
                      <label htmlFor="ladder-cashout" className={`investments-native-ladder-choice${ladderInput.reinvestMode === 'cash_out' ? ' is-selected' : ''}`}>
                        <input
                          id="ladder-cashout"
                          type="radio"
                          name="ladder-reinvest-mode"
                          value="cash_out"
                          checked={ladderInput.reinvestMode === 'cash_out'}
                          onChange={(event) => onLadderReinvestModeChange(event.target.value)}
                        />
                        <span className="investments-native-ladder-choice-copy">
                          <strong>{calculatorCtaRuntime?.cashOutOptionLabel}</strong>
                        </span>
                      </label>
                    </div>
                    <p className="investments-native-ladder-helper">{ladderToggleHelper}</p>
                  </fieldset>

                  <details className="investments-native-ladder-advanced">
                    <summary className="investments-native-ladder-advanced-summary">Advanced assumptions</summary>
                    <div className="investments-native-ladder-advanced-body">
                      <div className="investments-native-ladder-field">
                        <div className="investments-native-ladder-field-head">
                          <label htmlFor="ladder-visualize-years" className="investments-native-ladder-field-label">{calculatorCtaRuntime?.visualizeYearsLabel}</label>
                          <span className="investments-native-ladder-chip-note">Preview horizon</span>
                        </div>
                        <div className="investments-native-ladder-stepper">
                          <button type="button" className="investments-native-ladder-stepper-btn" aria-label="Decrease timeline years" onClick={() => stepLadderVisualizeYears(-1)}>−</button>
                          <input
                            id="ladder-visualize-years"
                            type="text"
                            inputMode="numeric"
                            value={ladderInput.visualizeYears}
                            onChange={(event) => onLadderVisualizeYearsChange(event.target.value)}
                          />
                          <button type="button" className="investments-native-ladder-stepper-btn" aria-label="Increase timeline years" onClick={() => stepLadderVisualizeYears(1)}>+</button>
                        </div>
                        <div className="investments-native-ladder-meter" aria-hidden="true">
                          <span style={{ width: `${(ladderVisualizeYears / MAX_VISUALIZE_YEARS) * 100}%` }} />
                        </div>
                        <p className="investments-native-ladder-helper">
                          {calculatorCtaRuntime?.visualizeYearsHelper}
                        </p>
                      </div>

                      <div className="investments-native-ladder-field investments-native-ladder-rates-field">
                        <div className="investments-native-ladder-field-head">
                          <span className="investments-native-ladder-field-label">APY assumptions</span>
                          <span className="investments-native-ladder-chip-note">Editable by term</span>
                        </div>
                        <div className="investments-native-ladder-rate-grid is-compact">
                          {Array.from({ length: ladderYears }, (_, index) => index + 1).map((year) => (
                            <label key={year} htmlFor={`ladder-rate-${year}`}>
                              <span>{year}-Year APY (%)</span>
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
                      </div>
                    </div>
                  </details>
                </div>

                <div className="investments-native-ladder-builder-footer">
                  <div className="service-native-action-row investments-native-ladder-action">
                    <button type="button" className="service-native-btn" onClick={calculateLadder}>
                      {calculatorCtaRuntime?.calculateLabel}
                    </button>
                  </div>
                  <div className="investments-native-ladder-footnotes">
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
                  </div>
                </div>
              </section>
            </div>

            {ladderResult ? (
              <div className="investments-native-ladder-results">
                <div className="investments-native-ladder-rhythm investments-native-ladder-result-sheet" data-ladder-results-sheet>
                  <div className="investments-native-ladder-panel-head investments-native-ladder-panel-head--results">
                    <div>
                      <h3>Your maturity rhythm</h3>
                      <p>Calculated results from your latest ladder setup.</p>
                    </div>
                  </div>
                  <div className="investments-native-ladder-summary-strip is-results">
                    {ladderResultSummaryCards.map((item) => (
                      <div key={`result-summary-${item.label}`} className="investments-native-ladder-summary-chip">
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="investments-native-ladder-rhythm-strip">
                    {ladderResultsRhythm.map((row) => (
                      <article key={`rhythm-${row.year}`} className="investments-native-ladder-rhythm-card">
                        <strong>Year {row.year}</strong>
                        <span>${formatCurrency(row.totalCashAvailable)}</span>
                        <small>
                          Principal ${formatCurrency(row.principalMaturing)}
                          {' '}
                          + interest ${formatCurrency(row.interestMaturing)}
                        </small>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="investments-native-ladder-accordion">
                  <details className="investments-native-ladder-accordion-item investments-native-ladder-result-sheet" data-ladder-results-sheet>
                    <summary className="investments-native-ladder-accordion-summary">{calculatorCtaRuntime?.resultsTitle}</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="investments-native-ladder-table-shell">
                        <table className="investments-native-ladder-table investments-native-ladder-table--breakdown">
                          <thead>
                            <tr>
                              <th scope="col">Year</th>
                              <th scope="col" className="is-highlight">Principal</th>
                              <th scope="col">APY</th>
                              <th scope="col">Interest Earned</th>
                              <th scope="col" className="is-highlight">Ending Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ladderResult.initialRows.map((row) => (
                              <tr key={row.id}>
                                <th scope="row">{row.termYears}-Year</th>
                                <td className="investments-native-ladder-table-cell--value">${formatCurrency(row.principal)}</td>
                                <td className="investments-native-ladder-table-cell--secondary">{row.apyPercent.toFixed(2)}%</td>
                                <td>${formatCurrency(row.interest)}</td>
                                <td className="investments-native-ladder-table-cell--value">${formatCurrency(row.endingValue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="investments-native-ladder-mobile-sheet">
                        {ladderResult.initialRows.map((row) => (
                          <article key={`breakdown-mobile-${row.id}`} className="investments-native-ladder-mobile-row">
                            <div className="investments-native-ladder-mobile-row-head">
                              <h4>{row.termYears}-Year</h4>
                            </div>
                            <div className="investments-native-ladder-mobile-row-grid">
                              <div className="investments-native-ladder-mobile-cell is-value">
                                <span>Principal</span>
                                <strong>${formatCurrency(row.principal)}</strong>
                              </div>
                              <div className="investments-native-ladder-mobile-cell is-secondary">
                                <span>APY</span>
                                <strong>{row.apyPercent.toFixed(2)}%</strong>
                              </div>
                              <div className="investments-native-ladder-mobile-cell">
                                <span>Interest Earned</span>
                                <strong>${formatCurrency(row.interest)}</strong>
                              </div>
                              <div className="investments-native-ladder-mobile-cell is-value">
                                <span>Ending Value</span>
                                <strong>${formatCurrency(row.endingValue)}</strong>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </details>

                  <details className="investments-native-ladder-accordion-item investments-native-ladder-result-sheet" data-ladder-results-sheet>
                    <summary className="investments-native-ladder-accordion-summary">Year-by-year schedule</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="investments-native-ladder-table-shell">
                        <table className="investments-native-ladder-table investments-native-ladder-table--schedule">
                          <thead>
                            <tr>
                              <th scope="col">Year</th>
                              <th scope="col" className="is-highlight">Principal Maturing</th>
                              <th scope="col">Interest Maturing</th>
                              <th>Reinvested</th>
                              <th scope="col" className="is-highlight">Principal Still Locked</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ladderResult.scheduleRows.map((row) => (
                              <tr key={`schedule-${row.year}`}>
                                <th scope="row">Year {row.year}</th>
                                <td className="investments-native-ladder-table-cell--value">${formatCurrency(row.principalMaturing)}</td>
                                <td>${formatCurrency(row.interestMaturing)}</td>
                                <td>
                                  <span className={`investments-native-ladder-status${row.reinvested ? ' is-reinvested' : ' is-cash'}`}>
                                    {row.reinvested ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td className="investments-native-ladder-table-cell--value">${formatCurrency(row.lockedPrincipal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="investments-native-ladder-mobile-sheet">
                        {ladderResult.scheduleRows.map((row) => (
                          <article key={`schedule-mobile-${row.year}`} className="investments-native-ladder-mobile-row">
                            <div className="investments-native-ladder-mobile-row-head">
                              <h4>Year {row.year}</h4>
                              <span className={`investments-native-ladder-status${row.reinvested ? ' is-reinvested' : ' is-cash'}`}>
                                {row.reinvested ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="investments-native-ladder-mobile-row-grid">
                              <div className="investments-native-ladder-mobile-cell is-value">
                                <span>Principal Maturing</span>
                                <strong>${formatCurrency(row.principalMaturing)}</strong>
                              </div>
                              <div className="investments-native-ladder-mobile-cell">
                                <span>Interest Maturing</span>
                                <strong>${formatCurrency(row.interestMaturing)}</strong>
                              </div>
                              <div className="investments-native-ladder-mobile-cell">
                                <span>Reinvested</span>
                                <strong>{row.reinvested ? 'Yes' : 'No'}</strong>
                              </div>
                              <div className="investments-native-ladder-mobile-cell is-value">
                                <span>Principal Still Locked</span>
                                <strong>${formatCurrency(row.lockedPrincipal)}</strong>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </details>

                  <details className="investments-native-ladder-accordion-item investments-native-ladder-result-sheet" data-ladder-results-sheet>
                    <summary className="investments-native-ladder-accordion-summary">Cash available by year</summary>
                    <div className="investments-native-ladder-accordion-body">
                      <div className="investments-native-ladder-table-shell">
                        <table className="investments-native-ladder-table investments-native-ladder-table--cash">
                          <thead>
                            <tr>
                              <th scope="col">Year</th>
                              <th scope="col">Principal Available</th>
                              <th>Interest Available</th>
                              <th scope="col" className="is-highlight">Total Cash Available</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ladderResult.scheduleRows.map((row) => (
                              <tr key={`cash-${row.year}`}>
                                <th scope="row">Year {row.year}</th>
                                <td>${formatCurrency(row.principalAvailable)}</td>
                                <td>${formatCurrency(row.interestAvailable)}</td>
                                <td className="investments-native-ladder-table-cell--value is-cash">${formatCurrency(row.totalCashAvailable)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="investments-native-ladder-mobile-sheet">
                        {ladderResult.scheduleRows.map((row) => (
                          <article key={`cash-mobile-${row.year}`} className="investments-native-ladder-mobile-row">
                            <div className="investments-native-ladder-mobile-row-head">
                              <h4>Year {row.year}</h4>
                            </div>
                            <div className="investments-native-ladder-mobile-row-grid">
                              <div className="investments-native-ladder-mobile-cell">
                                <span>Principal Available</span>
                                <strong>${formatCurrency(row.principalAvailable)}</strong>
                              </div>
                              <div className="investments-native-ladder-mobile-cell">
                                <span>Interest Available</span>
                                <strong>${formatCurrency(row.interestAvailable)}</strong>
                              </div>
                              <div className="investments-native-ladder-mobile-cell is-value is-cash">
                                <span>Total Cash Available</span>
                                <strong>${formatCurrency(row.totalCashAvailable)}</strong>
                              </div>
                            </div>
                          </article>
                        ))}
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
                    <div className="investments-native-ladder-gated-actions">
                      <button type="button" className="service-native-btn" disabled={!canDownloadLadder} onClick={downloadLadderSample}>
                        Download PDF
                      </button>
                    </div>
                    <label className="investments-native-ladder-opt-in">
                      <input
                        type="checkbox"
                        checked={ladderDownloadOptIn}
                        onChange={(event) => {
                          setLadderDownloadOptIn(event.target.checked);
                          setLadderDiscussMessage('');
                        }}
                      />
                      <span>I&apos;d like follow-up from the investments team.</span>
                    </label>
                    <p className="investments-native-ladder-opt-in-note">{calculatorCtaRuntime?.discussBody}</p>
                  </div>

                  {ladderDownloadOptIn ? (
                    <div className="investments-native-ladder-contact">
                      <h4 className="investments-native-ladder-contact-heading">{calculatorCtaRuntime?.discussTitle}</h4>
                      <p className="investments-native-ladder-contact-message">
                        {calculatorCtaRuntime?.discussBody}
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
                  ) : null}
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
