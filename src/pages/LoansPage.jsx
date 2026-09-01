import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/service-native.css';
import '../styles/service-native-functional-tools.css';
import { Link } from 'react-router-dom';
import {
  FrontHudPageWorkflow,
  FrontHudPanelShell,
  FrontHudStructureControls,
  LazyBlockHudPanelHost as BlockHudPanelHost,
  preloadBlockHudPanelHost,
  preloadFrontHudChrome,
} from '../components/BlockHudPanelHostLoader';
import BlockOwnershipOverlay, { getBlockOwnershipVisual } from '../components/BlockOwnershipOverlay';
import FrontHudAnchorTag from '../components/FrontHudAnchorTag';
import DynamicCtaSection from '../components/DynamicCtaSection';
import DynamicRequestFormSection from '../components/DynamicRequestFormSection';
import ManagedBlockOrder from '../components/ManagedBlockOrder';
import SafeRichText from '../components/SafeRichText';
import { BillboardBlock, ColumnsBlock, renderHighlightedText } from '../components/blocks/PageBlocksRenderer';
import { useDisclosures } from '../context/DisclosuresContext';
import { getResourceArticleFeatureConfig } from '../data/resourceArticleFeatureIndex';
import { useFrontHud } from '../context/FrontHudContext';
import { useContentAdmin } from '../context/ContentAdminContextCore';
import { useTestimonials } from '../context/TestimonialsContext';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useHudDockOrder from '../hooks/useHudDockOrder';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import { useManagedContentSource } from '../hooks/useManagedContentSource';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';
import { resolveTestimonialsBlockData } from '../lib/testimonials';
import {
  actionButtonClassName,
  buildDynamicBillboardFromBlock,
  buildDynamicGridFromBlock,
  buildDynamicHeroFromBlock,
  buildDynamicIntroFromBlock,
  heroAnimationClassForLine,
  isExternalLinkHref,
  parseTextHighlights,
  renderTextWithHighlights,
} from '../lib/dynamicPageBlocks';
import { defaultLoansCtaSettings } from '../data/ctaFormSeeds';
import { buildDefaultLoansIntroRuntime } from '../data/loansIntroSeed';

const LOANS_TARIFFS_ARTICLE_FEATURE = getResourceArticleFeatureConfig({
  slug: 'tariffs-timing-truth-keep-building-through-the-chaos',
  title: 'Tariffs, Timing & Truth: Keep Building Through the Chaos',
  fallbackImageAlt: 'Tariffs, Timing & Truth',
});

const estimatedLoanAmountOptions = [
  '$100,000-$499,999',
  '$500,000-$2,999,999',
  '$3,000,000+',
];

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

const defaultLoanInquiryBodyHtml = 'First things first, whether you\'re simply curious or ready to greenlight your project: <mark>complete the inquiry form</mark>. It\'s short, sweet, and vital. The information you provide will help share your vision with your consultant.';
const DEFAULT_LOANS_INTRO = buildDefaultLoansIntroRuntime();
const LOANS_HUD_ANCHOR_SELECTOR_BY_ID = {
  hero: '.service-native-hero',
  intro: '.service-native-intro',
  loan_options: '.loans-native-options',
  request_form: '.loans-native-inquiry',
  value_cards: '.loans-native-more',
  vision_fuel: '.loans-native-vision-fuel',
  cta_form: '.native-dynamic-cta',
  testimonials: '.loans-native-testimonials',
  cta_band: '.loans-native-option-question-wrap',
};
const LOANS_INLINE_SECTION_ANCHOR_IDS = [
  'hero',
  'intro',
  'loan_options',
  'request_form',
  'value_cards',
  'vision_fuel',
  'cta_form',
  'testimonials',
];
const LOANS_INLINE_CANONICAL_BLOCK_IDS = new Set([
  ...LOANS_INLINE_SECTION_ANCHOR_IDS,
  'cta_band',
]);

function clampFrontHudOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 15;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
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

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseLoanRequestFieldOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => ({
      value: String(option?.value || '').trim(),
      label: String(option?.label || '').trim(),
    }))
    .filter((option) => option.value || option.label);
}

function parseLoanRequestFields(rawValue) {
  if (!rawValue) {
    return [];
  }
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((field) => ({
        id: String(field?.id || '').trim(),
        label: String(field?.label || '').trim(),
        type: String(field?.type || 'text').trim().toLowerCase(),
        required: Boolean(field?.required),
        placeholder: String(field?.placeholder || '').trim(),
        format: String(field?.format || '').trim().toLowerCase(),
        maxLength: Number(field?.maxLength) || undefined,
        rows: Number(field?.rows) || undefined,
        options: parseLoanRequestFieldOptions(field?.options),
      }))
      .filter((field) => field.id && field.label);
  } catch {
    return [];
  }
}

function buildLoanInquiryConfigFromBlock(block) {
  if (!block || block.mode !== 'dynamic') {
    return null;
  }
  const settings = block.settings || {};
  const title = String(settings.title || '').trim() || 'Ready to grow\nwhen you are.';
  const titleHighlightsJson = String(settings.titleHighlightsJson || '').trim();
  const titleLines = title.split(/\n+/).map((part) => part.trim()).filter(Boolean);
  const derivedSecondLineHighlight = !titleHighlightsJson && titleLines.length > 1
    ? JSON.stringify([
      {
        start: title.indexOf(titleLines[1]),
        end: title.indexOf(titleLines[1]) + titleLines[1].length,
        className: 'is-white',
      },
    ])
    : titleHighlightsJson;
  const subtitle = String(settings.subtitle || '').trim();
  const bodyHtml = String(settings.bodyHtml || '').trim() || (!subtitle.includes('<') ? '' : subtitle);
  const steps = [1, 2, 3, 4, 5]
    .map((slot) => ({
      id: `step${slot}`,
      title: String(settings[`step${slot}Title`] || '').trim(),
      note: String(settings[`step${slot}Note`] || '').trim(),
      fields: parseLoanRequestFields(settings[`step${slot}FieldsJson`]),
    }))
    .filter((step) => step.fields.length);

  if (!steps.length) {
    return null;
  }

  return {
    title,
    titleClassName: String(settings.titleClassName || '').trim(),
    titleHighlightsJson: derivedSecondLineHighlight,
    subtitle: subtitle && !subtitle.includes('<') ? subtitle : '',
    bodyHtml: bodyHtml || defaultLoanInquiryBodyHtml,
    hideStepTitles: true,
    submitLabel: String(settings.submitLabel || '').trim() || 'Submit',
    successMessage: String(settings.successMessage || '').trim() || 'Your submission has been received. We\'ll be in touch shortly.',
    steps,
  };
}

function buildDefaultLoanInquiryConfig() {
  return {
    title: 'Ready to grow\nwhen you are.',
    titleClassName: '',
    titleHighlightsJson: JSON.stringify([
      {
        start: 'Ready to grow\n'.length,
        end: 'Ready to grow\nwhen you are.'.length,
        className: 'is-white',
      },
    ]),
    subtitle: '',
    bodyHtml: defaultLoanInquiryBodyHtml,
    hideStepTitles: true,
    submitLabel: 'Submit',
    successMessage: 'Your submission has been received. We\'ll be in touch shortly.',
    steps: [
      {
        id: 'step1',
        title: 'Contact',
        note: '',
        fields: [
          { id: 'firstName', label: 'First Name*', type: 'text', required: true },
          { id: 'lastName', label: 'Last Name*', type: 'text', required: true },
          { id: 'phone', label: 'Phone*', type: 'tel', required: true, format: 'phone' },
          { id: 'email', label: 'Email*', type: 'email', required: true },
        ],
      },
      {
        id: 'step2',
        title: 'Ministry',
        note: '',
        fields: [
          { id: 'ministryName', label: 'Ministry Name*', type: 'text', required: true },
          { id: 'ministryWebsite', label: 'Ministry Website', type: 'text' },
          { id: 'city', label: 'City*', type: 'text', required: true },
          {
            id: 'state',
            label: 'State*',
            type: 'select',
            required: true,
            placeholder: 'Choose one',
            options: states.map(([value, label]) => ({ value, label })),
          },
        ],
      },
      {
        id: 'step3',
        title: 'Project details',
        note: '',
        fields: [
          {
            id: 'estimatedLoanAmount',
            label: 'Estimated Loan Amount*',
            type: 'select',
            required: true,
            placeholder: 'Choose one',
            options: estimatedLoanAmountOptions.map((value) => ({ value, label: value })),
          },
          { id: 'purpose', label: 'Purpose of Loan', type: 'text' },
          { id: 'attendance', label: 'Weekly attendance (if applicable)', type: 'text' },
          { id: 'heardAbout', label: 'How did you hear about us?*', type: 'text', required: true },
        ],
      },
    ],
  };
}

function toBooleanFlag(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  const token = String(value || '').trim().toLowerCase();
  if (!token) {
    return false;
  }
  return !['false', '0', 'no', 'off'].includes(token);
}

function buildLoanValueCardsRenderableBlock(block) {
  if (!block || block.mode !== 'dynamic') {
    return null;
  }

  return {
    ...block,
    kind: 'columns',
    type: 'columns',
    templateId: String(block.templateId || '').trim() || 'columns',
    presetId: String(block.presetId || '').trim() || 'value-cards',
    settings: {
      ...(block.settings || {}),
      columnsStyle: 'loans-value',
      bgTone: 'white',
      contentWidth: 'browser',
      columns: 'four',
    },
  };
}

function buildLoanVisionFuelConfigFromBlock(block) {
  if (!block || block.mode !== 'dynamic') {
    return null;
  }

  const dynamicBillboard = buildDynamicBillboardFromBlock(block);
  if (!dynamicBillboard) {
    return null;
  }

  return {
    ...dynamicBillboard,
    buttonClassName: dynamicBillboard.action
      ? actionButtonClassName(dynamicBillboard.action.style, dynamicBillboard.action.tone)
      : '',
  };
}

function formatLoanPayoffLabel(totalMonths) {
  const safeMonths = Math.max(0, Math.round(totalMonths));
  if (!safeMonths) {
    return '0 months';
  }

  const years = Math.floor(safeMonths / 12);
  const months = safeMonths % 12;

  if (!years) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  if (!months) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
}

export function calculateLoanSchedule({
  loanAmount, annualRatePercent, termYears, displayOption, additionalPrincipalPayment = 0,
}) {
  const principal = parseNumber(loanAmount);
  const annualRate = Number.parseFloat(annualRatePercent) || 0;
  const years = Number.parseFloat(termYears) || 0;
  if (!principal || !annualRate || !years) {
    return {
      rows: [],
      payment: 0,
      recurringPayment: 0,
      totalPaid: 0,
      totalInterest: 0,
      totalExtraPrincipal: 0,
      payoffMonths: 0,
    };
  }

  const months = Math.round(years * 12);
  const monthlyRate = annualRate / 100 / 12;
  const payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const extraPrincipal = Math.max(parseNumber(additionalPrincipalPayment), 0);

  let balance = principal;
  const monthlyRows = [];
  let totalPaid = 0;
  let totalInterest = 0;
  let totalExtraPrincipal = 0;

  for (let month = 1; month <= months && balance > 0.005; month += 1) {
    const interest = balance * monthlyRate;
    const scheduledPrincipalPaid = payment - interest;
    const remainingAfterScheduledPrincipal = Math.max(balance - scheduledPrincipalPaid, 0);
    const extraPrincipalPaid = Math.min(extraPrincipal, remainingAfterScheduledPrincipal);
    const principalPaid = Math.min(balance, scheduledPrincipalPaid + extraPrincipalPaid);
    const actualPayment = interest + principalPaid;
    balance -= principalPaid;
    totalPaid += actualPayment;
    totalInterest += interest;
    totalExtraPrincipal += extraPrincipalPaid;

    monthlyRows.push({
      term: month,
      payment: actualPayment,
      principal: principalPaid,
      interest,
      balance: balance > 0 ? balance : 0,
      extraPrincipal: extraPrincipalPaid,
    });
  }

  const rows = displayOption === 'yearly'
    ? monthlyRows.reduce((acc, _, index) => {
      if (index % 12 !== 0) {
        return acc;
      }
      const yearSlice = monthlyRows.slice(index, index + 12);
      acc.push({
        term: `Year ${(index / 12) + 1}`,
        payment: yearSlice.reduce((sum, row) => sum + row.payment, 0),
        principal: yearSlice.reduce((sum, row) => sum + row.principal, 0),
        interest: yearSlice.reduce((sum, row) => sum + row.interest, 0),
        balance: yearSlice[yearSlice.length - 1]?.balance || 0,
        extraPrincipal: yearSlice.reduce((sum, row) => sum + row.extraPrincipal, 0),
      });
      return acc;
    }, [])
    : monthlyRows;

  return {
    rows,
    payment,
    recurringPayment: payment + extraPrincipal,
    totalPaid,
    totalInterest,
    totalExtraPrincipal,
    payoffMonths: monthlyRows.length,
  };
}

function pdfEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildLoanPdf(summaryText, rows) {
  const encoder = new TextEncoder();
  const lines = String(summaryText || '').split('\n').map(pdfEscape);

  const teal = '0 0.64 0.70';
  const gold = '0.98 0.64 0.10';

  let content = '';
  content += 'q\n';
  content += `${teal} rg\n`;
  content += '36 730 540 60 re f\n';
  content += 'Q\n';
  content += 'BT\n';
  content += '1 1 1 rg\n';
  content += '/F1 18 Tf\n';
  content += '1 0 0 1 54 758 Tm (AGFinancial Loan Payment Summary) Tj\n';
  content += 'ET\n';
  content += 'BT\n';
  content += '0 0 0 rg\n';
  content += '/F1 12 Tf\n';

  let y = 710;
  const leadLines = lines.slice(0, 10);
  leadLines.forEach((line, index) => {
    content += `1 0 0 1 54 ${y - (index * 16)} Tm (${line}) Tj\n`;
  });

  y -= (leadLines.length * 16) + 10;
  content += `${gold} rg\n`;
  content += '/F1 12 Tf\n';
  content += `1 0 0 1 54 ${y} Tm (Amortization Schedule) Tj\n`;
  content += '0 0 0 rg\n';
  y -= 18;
  content += '/F1 10 Tf\n';
  content += `${gold} rg\n`;
  content += `1 0 0 1 54 ${y} Tm (Period) Tj\n`;
  content += `1 0 0 1 140 ${y} Tm (Payment) Tj\n`;
  content += `1 0 0 1 230 ${y} Tm (Principal) Tj\n`;
  content += `1 0 0 1 330 ${y} Tm (Interest) Tj\n`;
  content += `1 0 0 1 430 ${y} Tm (Balance) Tj\n`;
  content += '0 0 0 rg\n';
  y -= 14;

  rows.forEach((row, index) => {
    const posY = y - (index * 12);
    if (posY < 80) {
      return;
    }
    content += `1 0 0 1 54 ${posY} Tm (${pdfEscape(String(row.term))}) Tj\n`;
    content += `1 0 0 1 140 ${posY} Tm ($${row.payment.toFixed(2)}) Tj\n`;
    content += `1 0 0 1 230 ${posY} Tm ($${row.principal.toFixed(2)}) Tj\n`;
    content += `1 0 0 1 330 ${posY} Tm ($${row.interest.toFixed(2)}) Tj\n`;
    content += `1 0 0 1 430 ${posY} Tm ($${row.balance.toFixed(2)}) Tj\n`;
  });
  content += 'ET\n';

  const contentBytes = encoder.encode(content);
  const header = '%PDF-1.4\n';
  const objs = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj\n',
    `4 0 obj << /Length ${contentBytes.length} >> stream\n${content}endstream\nendobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];

  const offsets = [0];
  let cursor = encoder.encode(header).length;
  for (let i = 0; i < objs.length; i += 1) {
    offsets.push(cursor);
    cursor += encoder.encode(objs[i]).length;
  }

  const xrefStart = cursor;
  let xref = 'xref\n';
  xref += `0 ${offsets.length}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xref += '\n';

  const trailer = `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  const pdfString = `${header}${objs.join('')}${xref}${trailer}`;
  return new Blob([encoder.encode(pdfString)], { type: 'application/pdf' });
}

export default function LoansPage({ sectionsOnly = false }) {
  const pageRef = useRef(null);
  const {
    resolveManagedPathFromRef = (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    resolveAuthoringManagedPathFromRef = null,
    setActiveBlockLock = () => ({ ok: false }),
    clearActiveBlockLock = () => ({ ok: false }),
    getBlockCollaboration = () => null,
    devIdentity = null,
    claimBufferedBlockEdit = () => false,
    commitBlockSettingsPatch = () => false,
    registerExternalDraftFlushHandler = null,
    registerExternalDraftStatusHandler = null,
  } = useContentAdmin();
  const {
    enabled: frontHudEnabled,
    opacity: frontHudOpacity,
    setEnabled: setFrontHudEnabled = null,
  } = useFrontHud();
  const {
    blocksByPath: managedBlocksByPath,
    pageHierarchy: managedPageHierarchy,
  } = useManagedContentSource({ pathname: '/services/loans' });
  const managedResolveManagedPathFromRef = frontHudEnabled
    ? (resolveAuthoringManagedPathFromRef || resolveManagedPathFromRef)
    : resolveManagedPathFromRef;
  const { testimonials: testimonialsLibrary } = useTestimonials();
  const { getDisclosureValue } = useDisclosures();
  const loanCalculatorDisclosure = getDisclosureValue(
    'loans-calculator-disclosure',
    'This calculator uses example data and is not an AGFinancial official quote or recommendation.',
  );

  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [displayOption, setDisplayOption] = useState('yearly');
  const [additionalPrincipalPayment, setAdditionalPrincipalPayment] = useState('');
  const [loanRows, setLoanRows] = useState([]);
  const [estimatedPayment, setEstimatedPayment] = useState(0);
  const [estimatedRecurringPayment, setEstimatedRecurringPayment] = useState(0);
  const [estimatedTotalPaid, setEstimatedTotalPaid] = useState(0);
  const [estimatedTotalInterest, setEstimatedTotalInterest] = useState(0);
  const [estimatedPayoffMonths, setEstimatedPayoffMonths] = useState(0);
  const [estimatedInterestSaved, setEstimatedInterestSaved] = useState(0);
  const [estimatedTimeSavedMonths, setEstimatedTimeSavedMonths] = useState(0);
  const [downloadName, setDownloadName] = useState('');
  const [downloadEmail, setDownloadEmail] = useState('');
  const [loanChurch, setLoanChurch] = useState('');
  const [loanState, setLoanState] = useState('');
  const [loanPhone, setLoanPhone] = useState('');
  const [loanPhoneNote, setLoanPhoneNote] = useState('');
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
  const [activeHudPanelId, setActiveHudPanelId] = useState('');

  useNativeEnhancements(pageRef);

  const managedBlocksSource = useMemo(() => {
    return Array.isArray(managedBlocksByPath?.['/services/loans']) ? managedBlocksByPath['/services/loans'] : [];
  }, [managedBlocksByPath]);
  const { blocks: managedBlocks, stageLocalBlockSetting } = useLocalBlockDrafts({
    pathname: '/services/loans',
    blocks: managedBlocksSource,
    claimBufferedBlockEdit,
    commitBlockSettingsPatch,
    registerExternalDraftFlushHandler,
    registerExternalDraftStatusHandler,
  });

  const heroBlock = useMemo(() => {
    return managedBlocks.find((block) => block?.id === 'hero' && block?.mode === 'dynamic') || null;
  }, [managedBlocks]);

  const introBlock = useMemo(() => {
    return managedBlocks.find((block) => block?.id === 'intro' && block?.mode === 'dynamic') || null;
  }, [managedBlocks]);

  const requestFormBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'request_form'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const loanOptionsBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'loan_options'
      && block?.kind === 'card_grid'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const valueCardsBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'value_cards'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const visionFuelBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'vision_fuel'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const loanOptionsBillboardBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'cta_band'
      && block?.kind === 'billboard'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);
  const testimonialsBlock = useMemo(() => (
    managedBlocks.find((block) => (
      block?.id === 'testimonials'
      && block?.kind === 'testimonials'
      && block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    )) || null
  ), [managedBlocks]);

  const inquiryConfig = useMemo(
    () => buildLoanInquiryConfigFromBlock(requestFormBlock) || buildDefaultLoanInquiryConfig(),
    [requestFormBlock],
  );
  const loanOptionsGrid = useMemo(
    () => buildDynamicGridFromBlock(loanOptionsBlock),
    [loanOptionsBlock],
  );
  const renderedValueCardsBlock = useMemo(
    () => buildLoanValueCardsRenderableBlock(valueCardsBlock),
    [valueCardsBlock],
  );
  const loanOptionsBillboard = useMemo(
    () => buildDynamicBillboardFromBlock(loanOptionsBillboardBlock),
    [loanOptionsBillboardBlock],
  );
  const dynamicVisionFuel = useMemo(
    () => buildLoanVisionFuelConfigFromBlock(visionFuelBlock),
    [visionFuelBlock],
  );
  const resolvedVisionFuel = dynamicVisionFuel;
  const visionFuelTitle = String(resolvedVisionFuel?.title || '').trim();
  const visionFuelSubtitle = String(resolvedVisionFuel?.subtitle || '').trim();
  const visionFuelBodyHtml = String(resolvedVisionFuel?.bodyHtml || '').trim();
  const visionFuelBody = String(resolvedVisionFuel?.body || '').trim();
  const visionFuelAction = resolvedVisionFuel?.action || null;
  const visionFuelButtonLabel = String(visionFuelAction?.label || '').trim();
  const visionFuelButtonHref = String(visionFuelAction?.to || visionFuelAction?.href || '').trim();
  const visionFuelButtonOpenInNewWindow = Boolean(visionFuelAction?.openInNewWindow);
  const visionFuelButtonClassName = String(resolvedVisionFuel?.buttonClassName || '').trim() || 'service-native-btn';
  const visionFuelContentMaxWidthPx = Number(resolvedVisionFuel?.contentMaxWidthPx);
  const visionFuelSectionStyle = visionFuelAction
    ? { '--dynamic-billboard-padding-bottom': 'clamp(4.1rem, 8vw, 6.8rem)' }
    : undefined;
  const visionFuelRailStyle = Number.isFinite(visionFuelContentMaxWidthPx) && visionFuelContentMaxWidthPx > 0
    ? { '--dynamic-billboard-max-width': `${Math.round(visionFuelContentMaxWidthPx)}px` }
    : undefined;
  const visionFuelCopyClassName = [
    'native-info-section-copy',
    `is-justify-${resolvedVisionFuel?.justify || 'center'}`,
    resolvedVisionFuel?.copyClassName || '',
  ].filter(Boolean).join(' ');
  const testimonialsData = useMemo(
    () => resolveTestimonialsBlockData({
      block: testimonialsBlock,
      library: testimonialsLibrary,
      defaultTag: 'loans',
    }),
    [testimonialsBlock, testimonialsLibrary],
  );
  const routeLinkOptions = useMemo(
    () => Object.values(managedPageHierarchy || {})
      .filter((page) => page && page.path && !page.path.startsWith('/admin/') && page.path !== '/search')
      .sort((a, b) => a.path.localeCompare(b.path)),
    [managedPageHierarchy],
  );
  const frontHudOpacityRatio = clampFrontHudOpacity(frontHudOpacity) / 100;
  const hudPanels = useMemo(
    () => buildHudPanelsFromBlocks(managedBlocks, {
      anchorSelectorById: LOANS_HUD_ANCHOR_SELECTOR_BY_ID,
      includeHidden: true,
    }),
    [managedBlocks],
  );
  const showFrontHud = !sectionsOnly && frontHudEnabled && hudPanels.length > 0;
  const hasOpenHudPanel = showFrontHud && !hudDockCollapsed && Boolean(activeHudPanelId);
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
  const managedBlockIndexById = useMemo(() => (
    managedBlocks.reduce((next, block, index) => {
      const blockId = String(block?.id || '').trim();
      if (blockId && !next.has(blockId)) {
        next.set(blockId, index);
      }
      return next;
    }, new Map())
  ), [managedBlocks]);
  const managedBlockOrderStyle = (blockId) => {
    const index = managedBlockIndexById.get(String(blockId || '').trim());
    return { order: Number.isFinite(index) ? index * 10 : 999 };
  };
  const additionalBillboardBlocks = useMemo(() => (
    managedBlocks.filter((block) => (
      block
      && String(block.id || '').trim()
      && !LOANS_INLINE_CANONICAL_BLOCK_IDS.has(String(block.id || '').trim())
      && String(block.kind || '').trim() === 'billboard'
      && String(block.mode || '').trim() === 'dynamic'
      && block.hidden !== true
      && block.hidden !== 'true'
    ))
  ), [managedBlocks]);
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
    return getBlockOwnershipVisual(getBlockCollaboration('/services/loans', blockId), devIdentity?.userId);
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
    storageKey: 'loans',
  });

  useEffect(() => {
    if (showFrontHud) {
      void preloadFrontHudChrome();
      void preloadBlockHudPanelHost();
    }
  }, [showFrontHud]);

  useEffect(() => {
    if (!showFrontHud) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
    }
  }, [showFrontHud]);

  const dynamicHero = useMemo(() => buildDynamicHeroFromBlock(heroBlock), [heroBlock]);
  const dynamicIntro = useMemo(() => buildDynamicIntroFromBlock(introBlock), [introBlock]);
  const resolvedIntro = dynamicIntro || DEFAULT_LOANS_INTRO;

  const canDownload = useMemo(
    () => loanRows.length > 0 && downloadName.trim() && validEmail(downloadEmail),
    [loanRows.length, downloadEmail, downloadName],
  );
  const hasAdditionalPrincipal = parseNumber(additionalPrincipalPayment) > 0;
  const loanSummaryCards = useMemo(() => {
    if (!loanRows.length) {
      return [];
    }

    const cards = [
      {
        label: 'Scheduled payment',
        value: `$${formatCurrency(estimatedPayment)}`,
      },
      {
        label: 'Estimated payoff',
        value: formatLoanPayoffLabel(estimatedPayoffMonths),
      },
      {
        label: 'Total paid',
        value: `$${formatCurrency(estimatedTotalPaid)}`,
      },
      {
        label: 'Total interest',
        value: `$${formatCurrency(estimatedTotalInterest)}`,
      },
    ];

    if (hasAdditionalPrincipal) {
      cards.push(
        {
          label: 'Monthly extra principal',
          value: `$${formatCurrency(parseNumber(additionalPrincipalPayment))}`,
          tone: 'is-emphasis',
        },
        {
          label: 'Interest saved',
          value: `$${formatCurrency(estimatedInterestSaved)}`,
          tone: 'is-emphasis',
        },
        {
          label: 'Time saved',
          value: formatLoanPayoffLabel(estimatedTimeSavedMonths),
          tone: 'is-emphasis',
        },
      );
    }

    return cards;
  }, [
    additionalPrincipalPayment,
    estimatedInterestSaved,
    estimatedPayoffMonths,
    estimatedPayment,
    estimatedTimeSavedMonths,
    estimatedTotalInterest,
    estimatedTotalPaid,
    hasAdditionalPrincipal,
    loanRows.length,
  ]);

  function runLoanCalculation() {
    const result = calculateLoanSchedule({
      loanAmount,
      annualRatePercent: interestRate,
      termYears: loanTerm,
      displayOption,
      additionalPrincipalPayment,
    });
    const baseline = calculateLoanSchedule({
      loanAmount,
      annualRatePercent: interestRate,
      termYears: loanTerm,
      displayOption,
      additionalPrincipalPayment: 0,
    });
    setLoanRows(result.rows);
    setEstimatedPayment(result.payment);
    setEstimatedRecurringPayment(result.recurringPayment);
    setEstimatedTotalPaid(result.totalPaid);
    setEstimatedTotalInterest(result.totalInterest);
    setEstimatedPayoffMonths(result.payoffMonths);
    setEstimatedInterestSaved(Math.max(baseline.totalInterest - result.totalInterest, 0));
    setEstimatedTimeSavedMonths(Math.max(baseline.payoffMonths - result.payoffMonths, 0));
  }

  function onLoanDownload(event) {
    event.preventDefault();
    if (!canDownload) {
      return;
    }

    const summary = [
      `Prepared for: ${downloadName.trim() || 'you'}`,
      `Email: ${downloadEmail.trim() || '-'}`,
      '',
      `Loan Amount: $${formatCurrency(parseNumber(loanAmount))}`,
      `Annual Interest Rate: ${(Number.parseFloat(interestRate) || 0).toFixed(2)}%`,
      `Term: ${loanTerm || '-'} years`,
      `Display: ${displayOption === 'yearly' ? 'Yearly' : 'Monthly'}`,
      `Scheduled Payment: $${formatCurrency(estimatedPayment)}`,
      `Typical Monthly Outflow: $${formatCurrency(estimatedRecurringPayment || estimatedPayment)}`,
      `Additional Principal: $${formatCurrency(parseNumber(additionalPrincipalPayment))} / month`,
      `Estimated Payoff: ${formatLoanPayoffLabel(estimatedPayoffMonths)}`,
      `Estimated Total Paid: $${formatCurrency(estimatedTotalPaid)}`,
      `Estimated Total Interest: $${formatCurrency(estimatedTotalInterest)}`,
      hasAdditionalPrincipal ? `Estimated Interest Saved: $${formatCurrency(estimatedInterestSaved)}` : null,
      hasAdditionalPrincipal ? `Estimated Time Saved: ${formatLoanPayoffLabel(estimatedTimeSavedMonths)}` : null,
      '',
      `Disclosure: ${loanCalculatorDisclosure}`,
    ].filter(Boolean).join('\n');

    const blob = buildLoanPdf(summary, loanRows);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const prefix = downloadName.trim() ? `${downloadName.trim().replace(/[^\w-]+/g, '-')}-` : '';
    anchor.href = url;
    anchor.download = `${prefix}AGFinancial-Loan-Payment.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function onLoanPhoneSubmit(event) {
    event.preventDefault();
    if (!loanPhone.trim()) {
      setLoanPhoneNote('Please enter a phone number.');
      return;
    }
    setLoanPhoneNote('Thanks! We will reach out soon.');
  }

  const scrollToSelector = (selector, extraOffset = 8) => {
    if (!selector || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    const target = document.querySelector(selector);
    if (!target) {
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

  const setHudPanelOpen = (panelId, anchorSelector, options = {}) => {
    const shouldScroll = options.scrollToTarget !== false;
    setHudDockCollapsed(false);
    setActiveHudPanelId(panelId);
    if (shouldScroll) {
      scrollToSelector(anchorSelector);
    }
  };

  const toggleHudPanel = (panelId, anchorSelector) => {
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
    setFrontHudEnabled?.(false);
  };

  useEffect(() => () => {
    const activeHudBlockId = String(activeHudPanel?.block?.id || '').trim();
    if (activeHudBlockId) {
      clearActiveBlockLock('/services/loans', activeHudBlockId);
    }
  }, [activeHudPanel?.block?.id, clearActiveBlockLock]);
  const resolveHudAnchor = (blockId) => {
    if (!showFrontHud) {
      return null;
    }
    const panel = hudPanelByBlockId[String(blockId || '').trim()];
    if (!panel) {
      return null;
    }
    return {
      label: panel.label,
      icon: panel.icon,
      isActive: !hudDockCollapsed && activeHudPanelId === panel.id,
      onClick: () => toggleHudPanel(panel.id, panel.anchorSelector),
      style: { '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) },
    };
  };
  const renderHudAnchor = (blockId) => {
    const hudAnchor = resolveHudAnchor(blockId);
    if (!hudAnchor) {
      return null;
    }
    return (
      <FrontHudAnchorTag
        label={hudAnchor.label}
        icon={hudAnchor.icon}
        isActive={hudAnchor.isActive}
        onClick={hudAnchor.onClick}
        style={hudAnchor.style}
        structureControls={(
          <FrontHudStructureControls pathname="/services/loans" blockId={blockId} canReorder={blockId !== 'cta_band'} placement="anchor" />
        )}
      />
    );
  };
  const resolveRoutePath = (pathRef, fallback = '/') => {
    const resolved = managedResolveManagedPathFromRef(pathRef, pathRef);
    return resolved || fallback;
  };

  const updateLoansBlockSetting = (block, settingKey, settingValue) => {
    if (!block) {
      return;
    }
    stageLocalBlockSetting(block.id, settingKey, settingValue);
  };
  const renderAdditionalBillboardsAfter = (anchorBlockId) => {
    const normalizedAnchorId = String(anchorBlockId || '').trim();
    const anchorIndex = normalizedAnchorId === '__start'
      ? -1
      : managedBlockIndexById.get(normalizedAnchorId);
    if (!Number.isFinite(anchorIndex)) {
      return null;
    }
    const nextKnownIndex = LOANS_INLINE_SECTION_ANCHOR_IDS
      .map((blockId) => managedBlockIndexById.get(blockId))
      .filter((index) => Number.isFinite(index) && index > anchorIndex)
      .sort((left, right) => left - right)[0] ?? Number.POSITIVE_INFINITY;
    const slotBlocks = additionalBillboardBlocks.filter((block) => {
      const blockIndex = managedBlockIndexById.get(String(block?.id || '').trim());
      return Number.isFinite(blockIndex) && blockIndex > anchorIndex && blockIndex < nextKnownIndex;
    });
    if (!slotBlocks.length) {
      return null;
    }
    return slotBlocks.map((block) => {
      const blockId = String(block?.id || '').trim();
      return (
        <div
          key={`loans-extra-billboard-${blockId}`}
          data-block-id={blockId}
          style={managedBlockOrderStyle(blockId)}
        >
          <BillboardBlock
            block={block}
            resolveTo={resolveRoutePath}
            ownership={getOwnershipVisualForBlockId(blockId)}
            hudAnchor={resolveHudAnchor(blockId)}
            extraSectionClassName={getHudBlockStateClassName(blockId).trim()}
          />
        </div>
      );
    });
  };
  const loanOptionsCards = Array.isArray(loanOptionsGrid?.cards) ? loanOptionsGrid.cards : [];
  const showLoanOptionsSection = Boolean(
    loanOptionsGrid?.title
    || loanOptionsGrid?.subtitle
    || loanOptionsGrid?.bodyHtml
    || loanOptionsGrid?.body
    || loanOptionsCards.length
    || loanOptionsBillboard,
  );
  const loanOptionsCtaAction = loanOptionsBillboard?.actions?.[0] || null;
  const loanOptionsCtaHref = String(loanOptionsCtaAction?.to || loanOptionsCtaAction?.href || '').trim();
  const loanOptionsCtaLabel = String(loanOptionsCtaAction?.label || '').trim();
  const loanOptionsCtaClassName = loanOptionsCtaAction?.className
    || actionButtonClassName(loanOptionsCtaAction?.style || 'blue', loanOptionsCtaAction?.tone || 'atlantean');

  return (
    <div
      ref={sectionsOnly ? undefined : pageRef}
      className={`${sectionsOnly ? '' : 'service-native-page '}loans-native-page${showFrontHud ? ' is-front-hud-docked admin-front-hud-scope' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}`}
    >
      {showFrontHud ? (
        <aside className={`admin-front-hud-dock${hudDockCollapsed ? ' is-collapsed' : ''}`} aria-label="Front HUD editor panels">
          <div className={`admin-front-hud-dock-tabs${isDockDragging ? ' is-drag-active' : ''}`}>
            {orderedHudPanels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`admin-front-hud-dock-tab${panel.isHidden ? ' is-hidden-block' : ''}${!hudDockCollapsed && activeHudPanel?.id === panel.id ? ' is-active' : ''}${isPanelDragging(panel.id) ? ' is-dragging' : ''}${isPanelDragOver(panel.id) ? ' is-drag-over' : ''}${getPanelDropPosition(panel.id) ? ` is-drop-${getPanelDropPosition(panel.id)}` : ''}`}
                onClick={() => toggleHudPanel(panel.id, panel.anchorSelector)}
                {...getDockTabDragProps(panel.id)}
              >
                <img src={panel.icon} alt="" aria-hidden="true" className="admin-front-hud-dock-tab-icon" />
                <span className="admin-front-hud-dock-tab-label">{panel.label}</span>
                {panel.isHidden ? <span className="admin-front-hud-dock-tab-hidden-marker" aria-hidden="true">Hidden</span> : null}
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
      <FrontHudPageWorkflow pathname="/services/loans" reviewHref="/admin/content?page=%2Fservices%2Floans" placement="bar" isVisible={showFrontHud} />
      {hasOpenHudPanel && activeHudPanel ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          blockId={activeHudPanel.block.id}
          pathname="/services/loans"
          ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
          onOwnershipAction={() => {
            if (!activeHudPanel?.block?.id) {
              return;
            }
            setActiveBlockLock('/services/loans', activeHudPanel.block.id, { force: true });
          }}
          onClose={closeHudDock}
          style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
        >
          <FrontHudPageWorkflow
            pathname="/services/loans"
            reviewHref="/admin/content?page=%2Fservices%2Floans"
            placement="dock-inline"
            showBlockDiscardAction
            blockId={activeHudPanel.block.id}
            block={activeHudPanel.block}
            blockLabel={activeHudPanel.label}
            onDoneEditing={closeHudDock}
          />
          <BlockHudPanelHost
            block={activeHudPanel.block}
            pathname="/services/loans"
            routeOptions={routeLinkOptions}
            testimonialsLibrary={testimonialsLibrary}
            ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
            onOwnershipAction={() => {
              if (!activeHudPanel?.block?.id) {
                return;
              }
              setActiveBlockLock('/services/loans', activeHudPanel.block.id, { force: true });
            }}
            onSettingChange={(settingKey, nextValue) => updateLoansBlockSetting(activeHudPanel.block, settingKey, nextValue)}
          />
        </FrontHudPanelShell>
      ) : null}
      <ManagedBlockOrder className="loans-native-page-content" blocks={managedBlocks}>
      {renderAdditionalBillboardsAfter('__start')}
      {!sectionsOnly ? (
      <section
        className={`service-native-hero${dynamicHero ? ` is-bg-${dynamicHero.bgTone || 'white'} is-justify-${dynamicHero.justify || 'center'}` : ''}${getHudBlockStateClassName('hero')}${getOwnershipVisualForBlockId('hero').className || ''}`}
        data-block-id="hero"
        style={managedBlockOrderStyle('hero')}
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('hero')} />
        {renderHudAnchor('hero')}
        <div className="ag-panel-rail">
          {dynamicHero?.lines?.length ? dynamicHero.lines.map((line, index) => {
            const animationClass = heroAnimationClassForLine(dynamicHero.animationPreset, index + 1);
            const lineClassName = ['loans-native-hero-line', animationClass, line.className].filter(Boolean).join(' ');
            const headingHtml = renderTextWithHighlights(line.text, line.highlights);
            return (
              <h1
                key={`loans-hero-line-${line.id || index + 1}`}
                className={lineClassName}
                style={{
                  lineHeight: dynamicHero.lineHeight,
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: headingHtml }} />
              </h1>
            );
          }) : (
            <>
              <h1 className="lineblur loans-native-hero-line is-vision">
                <mark>Your</mark>
                {' '}
                vision
                <mark>.</mark>
              </h1>
              <h1 className="lineB loans-native-hero-line is-purpose">
                <mark>Our</mark>
                {' '}
                purpose
                <mark>.</mark>
              </h1>
            </>
          )}
        </div>
      </section>
      ) : null}
      {renderAdditionalBillboardsAfter('hero')}

      {!sectionsOnly ? (
      <section
        className={`service-native-intro loans-native-intro dynamic-intro is-bg-${resolvedIntro.bgTone || 'sand'} is-text-${resolvedIntro.textTone || 'dark'}${getHudBlockStateClassName('intro')}${getOwnershipVisualForBlockId('intro').className || ''}`}
        data-block-id="intro"
        style={managedBlockOrderStyle('intro')}
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('intro')} />
        {renderHudAnchor('intro')}
        <div className="ag-panel-rail">
          <div
            className={`service-native-intro-copy is-justify-${resolvedIntro.justify || 'center'}`}
            style={{ '--intro-heading-line-height': resolvedIntro.lineSpacing || 1.05 }}
          >
            <h2 className={resolvedIntro.headingClassName || undefined}>
              <span
                dangerouslySetInnerHTML={{
                  __html: renderTextWithHighlights(resolvedIntro.heading, resolvedIntro.headingHighlights),
                }}
              />
            </h2>
            {resolvedIntro.bodyHtml ? (
              <SafeRichText as="div" className="native-info-rich-html" html={resolvedIntro.bodyHtml} />
            ) : resolvedIntro.body ? (
              <p>{resolvedIntro.body}</p>
            ) : null}
            {resolvedIntro.extraLine ? (
              <p
                className={`native-info-intro-emphasis${resolvedIntro.extraLineClassName ? ` ${resolvedIntro.extraLineClassName}` : ''}`}
                style={resolvedIntro.extraLineStyle}
              >
                {resolvedIntro.extraLine}
              </p>
            ) : null}
            {(resolvedIntro.actions || []).length ? (
              <div className={`service-native-action-row${(resolvedIntro.justify || 'center') === 'center' ? ' is-centered' : ''}`}>
                {resolvedIntro.actions.map((action) => {
                  const actionTarget = action.to || action.href || '';
                  const isInternal = Boolean(action.to || (action.href && !isExternalLinkHref(action.href) && action.href.startsWith('/')));
                  const buttonClassName = actionButtonClassName(action.style);
                  return isInternal ? (
                    <Link
                      key={actionTarget}
                      to={actionTarget}
                      className={buttonClassName}
                      target={action.openInNewWindow ? '_blank' : undefined}
                      rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <a
                      key={actionTarget}
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
      ) : null}
      {renderAdditionalBillboardsAfter('intro')}

      {showLoanOptionsSection ? (
      <section
        className={`service-native-section loans-native-options${getHudBlockStateClassName('loan_options')}${getOwnershipVisualForBlockId('loan_options').className || ''}`}
        id="loan-options"
        data-block-id="loan_options"
        style={managedBlockOrderStyle('loan_options')}
      >
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('loan_options')} />
        {renderHudAnchor('loan_options')}
        <div className="ag-panel-rail-wide">
          {loanOptionsGrid?.title ? (
            <h2 className={loanOptionsGrid.titleClassName || 'loans-native-display-heading loans-native-options-title'}>
              {loanOptionsGrid.titleHighlights?.length
                ? renderHighlightedText(loanOptionsGrid.title, loanOptionsGrid.titleHighlights)
                : loanOptionsGrid.title}
            </h2>
          ) : null}
          {loanOptionsGrid?.subtitle ? (
            <h3 className="loans-native-display-heading loans-native-options-subtitle">
              {loanOptionsGrid.subtitle}
            </h3>
          ) : null}
          {loanOptionsGrid?.bodyHtml ? (
            <SafeRichText as="div" className="loans-native-options-lead native-info-rich-html" html={loanOptionsGrid.bodyHtml} />
          ) : loanOptionsGrid?.body ? (
            <p className="loans-native-options-lead">{loanOptionsGrid.body}</p>
          ) : null}
          {loanOptionsCards.length ? (
            <div className="service-native-grid loans-native-options-grid">
              {loanOptionsCards.map((item) => (
                <article
                  key={`loan-option-${item.slot}-${item.title}`}
                  className={['service-native-card loans-native-option-card fade-up', item.cardClass || 'card2'].filter(Boolean).join(' ')}
                >
                  <h3 className={item.titleClassName || undefined}>
                    {item.titleHighlights?.length
                      ? renderHighlightedText(item.title, item.titleHighlights)
                      : item.title}
                  </h3>
                  {loanOptionsGrid.showTitleDivider ? <hr /> : null}
                  {item.body ? <p>{item.body}</p> : null}
                  {item.actions?.length ? (
                    <div className="service-native-action-row">
                      {item.actions.map((action) => {
                        const actionTarget = action.to || action.href || '';
                        const isInternal = Boolean(action.to || (action.href && !isExternalLinkHref(action.href) && action.href.startsWith('/')));
                        const buttonClassName = action.className || actionButtonClassName(action.style || 'blue', action.tone || 'atlantean');
                        return isInternal ? (
                          <Link
                            key={`${item.slot}-${action.label}-${actionTarget}`}
                            to={actionTarget}
                            className={buttonClassName}
                            target={action.openInNewWindow ? '_blank' : undefined}
                            rel={action.openInNewWindow ? 'noreferrer noopener' : undefined}
                          >
                            {action.label}
                          </Link>
                        ) : (
                          <a
                            key={`${item.slot}-${action.label}-${actionTarget}`}
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
                </article>
              ))}
            </div>
          ) : null}
          {loanOptionsBillboard ? (
            <div
              className={`loans-native-option-question-wrap fade-up${getHudBlockStateClassName('cta_band')}${getOwnershipVisualForBlockId('cta_band').className || ''}`}
              data-block-id="cta_band"
            >
              <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('cta_band')} />
              {renderHudAnchor('cta_band')}
              <div className="native-info-section-copy is-justify-center">
                {loanOptionsBillboard.title ? <h2>{loanOptionsBillboard.title}</h2> : null}
                {loanOptionsBillboard.bodyHtml ? (
                  <SafeRichText as="div" className="native-info-rich-html" html={loanOptionsBillboard.bodyHtml} />
                ) : loanOptionsBillboard.body ? <p>{loanOptionsBillboard.body}</p> : null}
                {loanOptionsCtaLabel && loanOptionsCtaHref ? (
                  <div className="service-native-action-row is-centered">
                    {loanOptionsCtaHref.startsWith('/') ? (
                      <Link
                        to={loanOptionsCtaHref}
                        className={loanOptionsCtaClassName}
                        target={loanOptionsCtaAction?.openInNewWindow ? '_blank' : undefined}
                        rel={loanOptionsCtaAction?.openInNewWindow ? 'noreferrer noopener' : undefined}
                      >
                        {loanOptionsCtaLabel}
                      </Link>
                    ) : (
                      <a
                        href={loanOptionsCtaHref}
                        className={loanOptionsCtaClassName}
                        target={loanOptionsCtaAction?.openInNewWindow ? '_blank' : undefined}
                        rel={loanOptionsCtaAction?.openInNewWindow ? 'noreferrer noopener' : undefined}
                      >
                        {loanOptionsCtaLabel}
                      </a>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>
      ) : null}
      {renderAdditionalBillboardsAfter('loan_options')}

      <section className={`service-native-section loans-native-inquiry native-dynamic-request is-request-form-preset-loans-inquiry is-bg-blue is-text-white${getHudBlockStateClassName('request_form')}${getOwnershipVisualForBlockId('request_form').className || ''}`} id="form" data-block-id="request_form" style={managedBlockOrderStyle('request_form')}>
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('request_form')} />
        {renderHudAnchor('request_form')}
        <div className="ag-panel-rail">
          <DynamicRequestFormSection config={inquiryConfig} />
        </div>
      </section>
      {renderAdditionalBillboardsAfter('request_form')}

      {renderedValueCardsBlock ? (
        <div data-block-id="value_cards" style={managedBlockOrderStyle('value_cards')}>
          <ColumnsBlock
            block={renderedValueCardsBlock}
            resolveTo={resolveRoutePath}
            ownership={getOwnershipVisualForBlockId('value_cards')}
            hudAnchor={resolveHudAnchor('value_cards')}
            sectionId="theresmore"
            extraSectionClassName={`loans-native-more${getHudBlockStateClassName('value_cards')}`}
          />
        </div>
      ) : null}
      {renderAdditionalBillboardsAfter('value_cards')}

      <section className="service-native-section loans-native-calculator-wrap" id="run-some-numbers" style={{ order: 45 }}>
        <div className="ag-panel-rail">
          <h2 className="loans-native-calculator-title">
            Run some numbers.
            {' '}
            <mark>Impress your pastor.</mark>
          </h2>
          <div className="loans-native-calculator native-financial-tool">
            <h3>Loan Payment Calculator</h3>
            <div className="loans-native-calculator-grid">
              <div>
                <label htmlFor="loan-calc-amount">Loan Amount ($)</label>
                <input
                  id="loan-calc-amount"
                  value={loanAmount}
                  inputMode="numeric"
                  onChange={(event) => setLoanAmount(formatAmountInput(event.target.value))}
                />
              </div>
              <div>
                <label htmlFor="loan-calc-rate">Annual Interest Rate (%)</label>
                <input
                  id="loan-calc-rate"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="loan-calc-term">Term of Loan (years)</label>
                <select id="loan-calc-term" value={loanTerm} onChange={(event) => setLoanTerm(event.target.value)}>
                  <option value="" disabled>Choose one</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="30">30</option>
                </select>
              </div>
              <div>
                <label htmlFor="loan-calc-display">Display Table By</label>
                <select id="loan-calc-display" value={displayOption} onChange={(event) => setDisplayOption(event.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

            <details className="loans-native-calc-advanced">
              <summary>Optional payoff accelerator</summary>
              <div className="loans-native-calc-advanced-body">
                <div className="loans-native-calc-advanced-grid">
                  <div>
                    <label htmlFor="loan-calc-additional-principal">Additional principal payment ($)</label>
                    <input
                      id="loan-calc-additional-principal"
                      value={additionalPrincipalPayment}
                      inputMode="numeric"
                      onChange={(event) => setAdditionalPrincipalPayment(formatAmountInput(event.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="loans-native-calc-helper">
                  Applied monthly on top of the scheduled payment. Leave blank to keep the standard amortization schedule unchanged.
                </p>
              </div>
            </details>

            <div className="loans-native-calc-actions">
              <button type="button" className="service-native-btn" onClick={runLoanCalculation}>Calculate</button>
              <p className="loans-native-disclaimer">
                <strong>Disclosure:</strong>
                {' '}
                This calculator is for illustration purposes only. It is neither an official AGFinancial quote nor recommendation.
              </p>
            </div>

            {loanRows.length ? (
              <div className="loans-native-calc-results">
                <div className="loans-native-results-sheet">
                  <div className="loans-native-results-head">
                    <div>
                      <h4>Amortization Schedule</h4>
                      <p>
                        {hasAdditionalPrincipal
                          ? `Includes an added $${formatCurrency(parseNumber(additionalPrincipalPayment))} principal payment each month.`
                          : 'Standard amortization based on the scheduled payment only.'}
                      </p>
                    </div>
                    {hasAdditionalPrincipal ? (
                      <span className="loans-native-results-badge">Accelerated payoff</span>
                    ) : null}
                  </div>

                  <div className="loans-native-calc-summary">
                    {loanSummaryCards.map((card) => (
                      <article
                        key={card.label}
                        className={`loans-native-summary-card${card.tone ? ` ${card.tone}` : ''}`}
                      >
                        <strong>{card.label}</strong>
                        <span>{card.value}</span>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="table-scroll loans-native-table-scroll financial-tool-table-wrap">
                  <table className="loans-native-results-table financial-tool-table">
                    <thead>
                      <tr>
                        <th>Term</th>
                        <th>Payment</th>
                        <th>Principal Paid</th>
                        <th>Interest Paid</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanRows.map((row) => (
                        <tr key={row.term}>
                          <td>{row.term}</td>
                          <td>${formatCurrency(row.payment)}</td>
                          <td>${formatCurrency(row.principal)}</td>
                          <td>${formatCurrency(row.interest)}</td>
                          <td>${formatCurrency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="loans-native-mobile-sheet">
                  {loanRows.map((row) => (
                    <article key={`mobile-${row.term}`} className="loans-native-mobile-row" data-loans-results-row>
                      <div className="loans-native-mobile-row-head">
                        <h5>{row.term}</h5>
                        <strong>${formatCurrency(row.payment)}</strong>
                      </div>
                      <div className="loans-native-mobile-row-grid">
                        <div>
                          <span>Principal Paid</span>
                          <strong>${formatCurrency(row.principal)}</strong>
                        </div>
                        <div>
                          <span>Interest Paid</span>
                          <strong>${formatCurrency(row.interest)}</strong>
                        </div>
                        <div>
                          <span>Balance</span>
                          <strong>${formatCurrency(row.balance)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="loans-native-gated">
                  <h4>Download your example.</h4>
                  <p className="loans-native-gated-note">Provide your name and organization to personalize your summary. None of this information is collected or retained. Your example is for illustrative purposes only.</p>
                  <div className="loans-native-gated-row">
                    <input value={downloadName} placeholder="Your name" onChange={(event) => setDownloadName(event.target.value)} />
                    <input type="email" value={downloadEmail} placeholder="you@example.com" onChange={(event) => setDownloadEmail(event.target.value)} />
                  </div>
                  <div className="loans-native-gated-actions">
                    <button type="button" className="service-native-btn" onClick={onLoanDownload} disabled={!canDownload}>Download PDF</button>
                  </div>
                </div>

                <div className="loans-native-contact">
                  <h4>Ready to share your vision?</h4>
                  <p>Your AGFinancial loan consultant will contact you, ready to discuss what you have in mind. Zero pressure.</p>
                  <div className="loans-native-contact-row">
                    <input value={loanChurch} placeholder="Organization" onChange={(event) => setLoanChurch(event.target.value)} />
                    <select value={loanState} onChange={(event) => setLoanState(event.target.value)}>
                      <option value="">State</option>
                      {states.map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="loans-native-contact-row">
                    <input value={loanPhone} placeholder="(555) 555-5555" onChange={(event) => setLoanPhone(formatPhoneInput(event.target.value))} />
                    <button type="button" className="service-native-btn" onClick={onLoanPhoneSubmit}>Call me</button>
                    {loanPhoneNote ? <span className="loans-native-contact-note">{loanPhoneNote}</span> : null}
                  </div>
                  <p className="loans-native-disclaimer">
                    <strong>Disclosure:</strong>
                    {' '}
                    {loanCalculatorDisclosure}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {resolvedVisionFuel ? (
        <section
          className={`service-native-section dynamic-billboard loans-native-vision-fuel is-bg-${resolvedVisionFuel.bgTone || 'white'} is-text-${resolvedVisionFuel.textTone || 'dark'}${getHudBlockStateClassName('vision_fuel')}${getOwnershipVisualForBlockId('vision_fuel').className || ''}`}
          data-block-id="vision_fuel"
          style={{ ...managedBlockOrderStyle('vision_fuel'), ...(visionFuelSectionStyle || {}) }}
        >
          <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('vision_fuel')} />
          {renderHudAnchor('vision_fuel')}
          <div className="ag-panel-rail" style={visionFuelRailStyle || undefined}>
            <div
              className={visionFuelCopyClassName}
              style={resolvedVisionFuel.copyStyle || undefined}
              data-fade-root-margin={resolvedVisionFuel.copyFadeRootMargin || undefined}
            >
              {visionFuelTitle ? (
                <h2
                  className={resolvedVisionFuel.titleClassName || undefined}
                  style={resolvedVisionFuel.titleStyle}
                >
                  {resolvedVisionFuel.titleHighlights?.length
                    ? renderHighlightedText(visionFuelTitle, resolvedVisionFuel.titleHighlights)
                    : visionFuelTitle}
                </h2>
              ) : null}
              {visionFuelSubtitle ? (
                <p
                  className={['native-info-section-subtitle', resolvedVisionFuel.subtitleClassName || ''].filter(Boolean).join(' ')}
                  style={resolvedVisionFuel.subtitleStyle || undefined}
                >
                  {visionFuelSubtitle}
                </p>
              ) : null}
              {visionFuelBodyHtml ? (
                <SafeRichText as="div" className={`native-info-rich-html is-body-justify-${resolvedVisionFuel?.bodyJustify || resolvedVisionFuel?.justify || 'center'}${resolvedVisionFuel?.headerGapRem !== null && resolvedVisionFuel?.headerGapRem !== undefined ? ' is-dynamic-billboard-header-gap' : ''}`} html={visionFuelBodyHtml} />
              ) : visionFuelBody ? (
                <div className={`native-info-rich-html is-body-justify-${resolvedVisionFuel?.bodyJustify || resolvedVisionFuel?.justify || 'center'}${resolvedVisionFuel?.headerGapRem !== null && resolvedVisionFuel?.headerGapRem !== undefined ? ' is-dynamic-billboard-header-gap' : ''}`}>
                  <p>{visionFuelBody}</p>
                </div>
              ) : null}
              {visionFuelAction && visionFuelButtonLabel && visionFuelButtonHref ? (
                <div className="service-native-action-row is-centered">
                  {visionFuelButtonHref.startsWith('/') ? (
                    <Link
                      to={visionFuelButtonHref}
                      className={visionFuelButtonClassName}
                      target={visionFuelButtonOpenInNewWindow ? '_blank' : undefined}
                      rel={visionFuelButtonOpenInNewWindow ? 'noreferrer' : undefined}
                    >
                      {visionFuelButtonLabel}
                    </Link>
                  ) : (
                    <a
                      href={visionFuelButtonHref}
                      className={visionFuelButtonClassName}
                      target={visionFuelButtonOpenInNewWindow ? '_blank' : undefined}
                      rel={visionFuelButtonOpenInNewWindow ? 'noreferrer' : undefined}
                    >
                      {visionFuelButtonLabel}
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
      {renderAdditionalBillboardsAfter('vision_fuel')}

      <div data-block-id="cta_form" style={managedBlockOrderStyle('cta_form')}>
        <DynamicCtaSection
          managedBlocks={managedBlocks}
          defaultSettings={defaultLoansCtaSettings}
          sectionClassName="service-native-section loans-native-cta-addon"
          sectionHudClassName={getHudBlockStateClassName('cta_form').trim()}
          ownership={getOwnershipVisualForBlockId('cta_form')}
          hudAnchor={renderHudAnchor('cta_form')}
          formWrapperClassName="loans-native-addon-form"
          fieldIdPrefix="loans-connect"
          renderDefaultWhenMissing={false}
          onSubmitData={({ values }) => {
            const payload = {
              fields: values,
              loan: {
                amount: parseNumber(loanAmount),
                rateAnnualPct: Number.parseFloat(interestRate) || 0,
                termYears: Number.parseFloat(loanTerm) || 0,
                displayOption,
                estPayment: Number(estimatedPayment.toFixed(2)),
                estTotalPaid: Number(estimatedTotalPaid.toFixed(2)),
                estTotalInterest: Number(estimatedTotalInterest.toFixed(2)),
              },
            };
            document.dispatchEvent(new CustomEvent('agf:cta-submit', { detail: payload }));
          }}
        />
      </div>
      {renderAdditionalBillboardsAfter('cta_form')}

      <section className={`service-native-section loans-native-testimonials${getHudBlockStateClassName('testimonials')}${getOwnershipVisualForBlockId('testimonials').className || ''}`} data-block-id="testimonials" style={managedBlockOrderStyle('testimonials')}>
        <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId('testimonials')} />
        {renderHudAnchor('testimonials')}
        <div className="ag-panel-rail">
          <div className="carousel-stack">
            {testimonialsData.items.map((item, index) => (
              <article key={`${item.author}-${item.quote.slice(0, 24)}`} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p className="loans-native-testimonial-quote"><strong>{item.quote}</strong></p>
                <p className="loans-native-testimonial-author">-<strong>{item.author}</strong></p>
              </article>
            ))}
          </div>
          {testimonialsData.showFineprint ? (
            <p className="loans-native-fineprint">{testimonialsData.fineprint}</p>
          ) : null}
        </div>
      </section>
      {renderAdditionalBillboardsAfter('testimonials')}

      <section className="service-native-section service-native-article-teaser loans-native-tariffs" style={{ order: 90 }}>
        <div className="ag-panel-rail-wide">
          <div className="service-native-dark-feature fade-up">
            <div className="service-native-dark-feature-inner">
              <div
                className="service-native-dark-feature-media loans-native-tariffs-media"
                role="img"
                aria-label={LOANS_TARIFFS_ARTICLE_FEATURE.imageAlt || 'Tariffs, Timing & Truth'}
                style={LOANS_TARIFFS_ARTICLE_FEATURE.image ? {
                  backgroundImage: `var(--ag-surface-blue-overlay-soft), radial-gradient(circle at 30% 38%, rgba(250, 163, 26, 0.42), transparent 52%), url(${LOANS_TARIFFS_ARTICLE_FEATURE.image})`,
                } : undefined}
              />
              <div className="service-native-dark-feature-copy">
                <h3>Tariffs, Timing &amp; Truth</h3>
                <p>Keep your ministry&apos;s building plan moving forward, even through chaotic markets.</p>
                <div className="service-native-action-row">
                  <Link to={LOANS_TARIFFS_ARTICLE_FEATURE.to} className="service-native-btn">See the strategies</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </ManagedBlockOrder>
    </div>
  );
}
