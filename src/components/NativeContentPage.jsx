import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BlockHudPanelHost from './BlockHudPanelHost';
import BlockOwnershipOverlay, { getBlockOwnershipVisual, isForeignOwnedBlockOwnership } from './BlockOwnershipOverlay';
import FrontHudPageWorkflow from './FrontHudPageWorkflow';
import MobileFrontHudActionTray from './MobileFrontHudActionTray';
import {
  createInitialFormValues,
  normalizeFormSubmissionConfig,
  validateRequiredFormFields,
} from '../blocks/foundation/forms';
import useNativeEnhancements from '../hooks/useNativeEnhancements';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import { getNativePageContent } from '../data/nativePageContent';
import { isPageHiddenFromSitemap } from '../data/siteMap';
import { useConsultants } from '../context/ConsultantsContext';
import { useCareersJobs } from '../context/CareersJobsContext';
import { useCharts } from '../context/ChartsContext';
import { useDisclosures } from '../context/DisclosuresContext';
import { useRates } from '../context/RatesContext';
import { inspectDynamicHeroSettings, useContentAdmin } from '../context/ContentAdminContext';
import { useDocuments } from '../context/DocumentsContext';
import { useConsultantResponses } from '../context/ConsultantResponsesContext';
import { useFrontHud } from '../context/FrontHudContext';
import { useTestimonials } from '../context/TestimonialsContext';
import { logHeroDriftWarningOnce } from '../lib/heroDriftWarnings';
import { shouldRenderHeroInlineEditor } from '../lib/heroHudMode';
import {
  applySelectionColor,
  extractHeroLineColorToken,
  parseHeroRangeHighlights,
  readTextSelectionState,
  remapHighlightsJsonForTextChange,
  removeSelectionRange,
  replaceHeroLineColorClass,
  resolveHeroLineDisplayClassName,
} from '../lib/heroHudRanges';
import { hasDisplayableHeroLineText, resolveVisibleHeroLineKeys } from '../lib/heroEditorLines';
import {
  formatTestimonialAttribution,
  normalizeDisplayTestimonials,
  normalizeTestimonialsSelectionMode,
  parseTokenList,
  resolveTestimonialsBlockData,
} from '../lib/testimonials';
import { normalizeIntroLineSpacing } from '../lib/dynamicSectionTypography';
import {
  buildDynamicBillboardFromBlock,
  buildDynamicCtaPresentationClassName,
  buildDynamicCtaFormFromBlock,
  buildDynamicColumnsFromBlock,
  buildDynamicFeaturePanelFromBlock,
  buildDynamicGridFromBlock,
  buildDynamicHeroFromBlock,
  buildDynamicIntroFromBlock,
  buildDynamicNewsletterFromBlock,
  buildDynamicPageContentFromBlock,
  buildDynamicRequestFormFromBlock,
  buildDynamicSiteFeatureFromBlock,
  buildDynamicTestimonialsFromBlock,
  normalizeDynamicCtaDisplayMode,
  normalizeDynamicCtaTriggerMode,
  normalizeUniversalOutlineButtonClassName,
  parseTextHighlights,
  renderTextWithHighlights,
  shouldUseUniversalOutlineButtonLink,
} from '../lib/dynamicPageBlocks';
import { buildNativeHudPanels } from '../lib/nativeHudPanels';
import useHudDockOrder from '../hooks/useHudDockOrder';
import GivingComparisonMatrix from './GivingComparisonMatrix';
import CharitableGivingTableWidget from './CharitableGivingTableWidget';
import CharitableGiftTestDriveWidget from './CharitableGiftTestDriveWidget';
import EmergencyFundCalculatorWidget from './EmergencyFundCalculatorWidget';
import IncreasedContributionCalculatorWidget from './IncreasedContributionCalculatorWidget';
import NetWorthCalculatorWidget from './NetWorthCalculatorWidget';
import FrontHudPanelShell from './FrontHudPanelShell';
import { HeroInlineLiveEditor, renderHeroRangesAsNodes } from './HeroHudEditorShared';
import LegacyGivingStewardshipStoryFeature from './LegacyGivingStewardshipStoryFeature';
import ImpactProofStoryFeature from './ImpactProofStoryFeature';
import DynamicRequestFormSection from './DynamicRequestFormSection';
import FrontHudAnchorTag from './FrontHudAnchorTag';
import InfoTableSheet from './InfoTableSheet';
import IraRatesSheet from './IraRatesSheet';
import {
  getInvestmentByMailInstitutionStateRule,
  investmentByMailInstitutionDocumentIds,
  investmentByMailInstitutionExistingInvestorQuestion,
  investmentByMailInstitutionLimitedClassAcknowledgment,
  investmentByMailInstitutionMailAddressLines,
  investmentByMailInstitutionMailReminder,
  investmentByMailInstitutionStandardAcknowledgment,
} from '../data/investmentByMailInstitutionConfig';
import NewsletterSignupForm from './NewsletterSignupForm';
import SafeRichText from './SafeRichText';
import {
  composeConsultantSections,
  composeRetirement403bSections,
} from './nativeRouteComposition';
import {
  buildCareersRouteSections,
  isNativeCareersJobsSection,
  NativeCareersJobsSection,
  NativeFormsRouteRenderer,
  NativeProspectusRouteRenderer,
  NativeSitemapRouteRenderer,
} from './nativeFunctionalRouteRenderers';
import { coerceLegacyLinkValue, createLinkValue } from '../lib/linkValue';
import {
  normalizeHeroTitleLetterSpacingEm,
  heroTitleSizeRemToRuntimeCss,
  normalizeHeroTitleSizeRem,
} from '../lib/heroTitleSize';
import {
  buildHeroLineStyle,
  normalizeHeroLineGapEm,
  normalizeHeroLineHeightEm,
} from '../lib/heroLineStyle';
import {
  normalizeButtonTone,
  normalizePanelTextTone as normalizeSharedPanelTextTone,
  normalizeSemanticTextColorClass,
  normalizeSurfaceBgTone,
  resolveIntroAccentColor,
} from '../lib/colorSystem';
import {
  buildPresetFamilyRuntimeClassName,
  resolvePresetFamilyClassToken,
} from '../lib/presetFamilyContract';
import { setupInvestmentsGrowthRevealMotion } from '../lib/investmentsGrowthReveal';

const US_STATE_LABELS = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

const MOBILE_FRONT_HUD_MEDIA_QUERY = '(max-width: 760px)';

function stateOptionLabel(code) {
  return `${US_STATE_LABELS[code] || code} (${code})`;
}

function findVisibleDynamicBlockByKind(blocks, kind) {
  return blocks.find((block) => block?.kind === kind && block?.mode === 'dynamic') || null;
}

function collectFullyHiddenBlockIds(blocks) {
  const entriesById = new Map();

  (Array.isArray(blocks) ? blocks : []).forEach((block) => {
    const blockId = String(block?.id || '').trim();
    if (!blockId) {
      return;
    }
    const hidden = toBoolean(block?.hidden);
    const existing = entriesById.get(blockId) || { hasVisibleVariant: false, hasHiddenVariant: false };
    if (hidden) {
      existing.hasHiddenVariant = true;
    } else {
      existing.hasVisibleVariant = true;
    }
    entriesById.set(blockId, existing);
  });

  return new Set(
    Array.from(entriesById.entries())
      .filter(([, entry]) => entry.hasHiddenVariant && !entry.hasVisibleVariant)
      .map(([blockId]) => blockId),
  );
}

function getLocationOptions(section) {
  const options = Array.isArray(section?.locationFilter?.options) ? section.locationFilter.options : [];
  if (options.length) {
    return options
      .map((option) => (typeof option === 'string'
        ? { value: option, label: stateOptionLabel(option) }
        : { value: option.value, label: option.label || stateOptionLabel(option.value) }))
      .filter((option) => Boolean(option.value));
  }

  const states = new Set();
  (section.cards || []).forEach((card) => {
    (card.states || []).forEach((stateCode) => {
      if (stateCode) {
        states.add(stateCode);
      }
    });
  });

  return Array.from(states)
    .sort((a, b) => stateOptionLabel(a).localeCompare(stateOptionLabel(b)))
    .map((value) => ({ value, label: stateOptionLabel(value) }));
}

const MOBILE_HUD_SELECTION_BLOCKED_SELECTOR = [
  'input',
  'select',
  'textarea',
  'option',
  'label',
  '[contenteditable="true"]',
  '[role="textbox"]',
  '[data-admin-mobile-hud-ignore]',
].join(', ');

const MOBILE_HUD_SELECTION_INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'summary',
  '[role="button"]',
  '[role="link"]',
].join(', ');

function isMobileHudSelectionBlocked(target) {
  return target instanceof Element
    && Boolean(target.closest(MOBILE_HUD_SELECTION_BLOCKED_SELECTOR));
}

function isMobileHudSelectionInteractiveTarget(target) {
  return target instanceof Element
    && Boolean(target.closest(MOBILE_HUD_SELECTION_INTERACTIVE_SELECTOR));
}

const CTA_REVEAL_ACTION_TYPE = 'open_cta_form';
const InlineCtaRevealContext = createContext(null);

function buildInlineCtaTargetKey(kind, value) {
  const normalizedValue = String(value || '').trim();
  if (!kind || !normalizedValue) {
    return '';
  }
  return `${kind}:${normalizedValue}`;
}

function collectInlineCtaTargetKeys(item) {
  const source = item && typeof item === 'object' ? item : {};
  const keys = [];
  const targetBlockId = String(source.targetBlockId || '').trim();
  const targetAnchorId = String(source.targetAnchorId || '').trim();
  const toValue = String(source.to || '').trim();

  if (targetBlockId) {
    keys.push(buildInlineCtaTargetKey('block', targetBlockId));
  }
  if (targetAnchorId) {
    keys.push(buildInlineCtaTargetKey('anchor', targetAnchorId));
  }
  if (toValue.startsWith('#') && toValue.length > 1) {
    keys.push(buildInlineCtaTargetKey('anchor', toValue.slice(1)));
  }

  return Array.from(new Set(keys.filter(Boolean)));
}

function resolveInlineCtaRevealAction(item, lookup) {
  if (!lookup || typeof lookup.get !== 'function') {
    return null;
  }

  const source = item && typeof item === 'object' ? item : {};
  const hasExplicitRevealAction = String(source.action || '').trim().toLowerCase() === CTA_REVEAL_ACTION_TYPE;
  const targetKeys = collectInlineCtaTargetKeys(source);

  if (!hasExplicitRevealAction && !targetKeys.length) {
    return null;
  }

  const targetEntry = targetKeys
    .map((key) => lookup.get(key))
    .find(Boolean);

  return targetEntry
    ? {
        source,
        targetEntry,
      }
    : null;
}

function isInlineCtaSectionShape(section) {
  const sectionClassName = String(section?.className || '').trim();
  const formVariant = String(section?.form?.variant || '').trim().toLowerCase();
  return Boolean(
    section?.form
    && typeof section.form === 'object'
    && (formVariant === 'dynamic-cta' || sectionClassName.includes('cta'))
  );
}

function getInlineCtaPresentationRuntime(section) {
  if (!isInlineCtaSectionShape(section)) {
    return {
      displayMode: 'default',
      triggerMode: 'default',
      className: '',
      isExternalInlineReveal: false,
    };
  }

  const displayMode = normalizeDynamicCtaDisplayMode(section?.form?.displayMode);
  const triggerMode = normalizeDynamicCtaTriggerMode(section?.form?.triggerMode);
  const className = buildDynamicCtaPresentationClassName({ displayMode, triggerMode });

  return {
    displayMode,
    triggerMode,
    className,
    isExternalInlineReveal: displayMode === 'inline_reveal' && triggerMode === 'external',
  };
}

function Action({ item }) {
  const { resolveDocumentLink } = useDocuments();
  const { resolveManagedPathFromRef } = useContentAdmin();
  const inlineCtaReveal = useContext(InlineCtaRevealContext);
  const extraClass = item.className ? ` ${item.className}` : '';
  const resolved = resolveNativeLinkItem(item, resolveDocumentLink, resolveManagedPathFromRef);
  const baseButtonClass = `service-native-btn${item.ghost ? ' is-ghost' : ''}${extraClass}`;
  const buttonClass = shouldUseUniversalOutlineButtonLink({
    href: resolved?.href,
    to: resolved?.to,
    external: resolved?.external,
    documentUrl: resolved?.document?.url,
  })
    ? normalizeUniversalOutlineButtonClassName(baseButtonClass, item?.tone || 'atlantean')
    : baseButtonClass;
  const revealAction = resolveInlineCtaRevealAction(item, inlineCtaReveal?.lookup);
  const targetBlank = Boolean(resolved && (resolved.external || resolved.openInNewWindow));
  const relAttr = targetBlank ? 'noreferrer noopener' : undefined;
  const onClick = revealAction
    ? (event) => {
        event.preventDefault();
        inlineCtaReveal?.onReveal?.(revealAction.targetEntry);
      }
    : undefined;

  if (revealAction && !resolved?.href && !resolved?.to && !item?.to) {
    return (
      <button type="button" className={buttonClass} onClick={onClick}>
        {resolved?.label || item.label}
      </button>
    );
  }

  if (resolved?.href) {
    return (
      <a
        href={resolved.href}
        target={targetBlank ? '_blank' : undefined}
        rel={relAttr}
        className={buttonClass}
        onClick={onClick}
      >
        {resolved.label}
      </a>
    );
  }
  if (!resolved?.to && !item?.to) {
    return null;
  }
  return (
    <Link
      to={resolved?.to || item.to}
      className={buttonClass}
      target={targetBlank ? '_blank' : undefined}
      rel={relAttr}
      onClick={onClick}
    >
      {resolved?.label || item.label}
    </Link>
  );
}

function isExternalLinkTarget(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function resolveNativeLinkItem(item, resolveDocumentLink, resolveManagedPathFromRef) {
  const source = item && typeof item === 'object' ? item : {};
  const linkValue = createLinkValue(source.link) || coerceLegacyLinkValue(source);
  const openInNewWindow = Boolean(linkValue?.openInNewWindow ?? source.openInNewWindow);

  if (linkValue?.kind === 'document' && typeof resolveDocumentLink === 'function') {
    const doc = resolveDocumentLink(linkValue.documentId);
    if (doc?.url) {
      return {
        label: source.label || doc.title,
        href: doc.external ? doc.url : undefined,
        to: doc.external ? undefined : doc.url,
        external: Boolean(doc.external),
        openInNewWindow,
        document: doc,
      };
    }
  }

  if (linkValue?.kind === 'internal') {
    const resolvedTo = typeof resolveManagedPathFromRef === 'function'
      ? resolveManagedPathFromRef(linkValue.to, linkValue.to)
      : linkValue.to;
    return {
      label: source.label,
      href: undefined,
      to: resolvedTo || linkValue.to,
      external: false,
      openInNewWindow,
    };
  }

  if (linkValue?.href) {
    return {
      label: source.label,
      href: linkValue.href,
      to: undefined,
      external: isExternalLinkTarget(linkValue.href),
      openInNewWindow,
    };
  }

  if (source.documentId && typeof resolveDocumentLink === 'function') {
    const doc = resolveDocumentLink(source.documentId);
    if (doc?.url) {
      return {
        label: source.label || doc.title,
        href: doc.external ? doc.url : undefined,
        to: doc.external ? undefined : doc.url,
        external: Boolean(doc.external),
        openInNewWindow,
        document: doc,
      };
    }
  }

  if (source.to) {
    const resolvedTo = typeof resolveManagedPathFromRef === 'function'
      ? resolveManagedPathFromRef(String(source.pageRef || source.to), source.to)
      : source.to;
    return {
      label: source.label,
      href: undefined,
      to: resolvedTo || source.to,
      external: false,
      openInNewWindow,
    };
  }

  return {
    label: source.label,
    href: undefined,
    to: undefined,
    external: false,
    openInNewWindow,
  };
}

function NativeLink({ item, className, children }) {
  const { resolveDocumentLink } = useDocuments();
  const { resolveManagedPathFromRef } = useContentAdmin();
  const inlineCtaReveal = useContext(InlineCtaRevealContext);
  const resolved = resolveNativeLinkItem(item, resolveDocumentLink, resolveManagedPathFromRef);
  const baseClassName = String(className || item?.className || '').trim();
  const resolvedClassName = shouldUseUniversalOutlineButtonLink({
    href: resolved?.href,
    to: resolved?.to,
    external: resolved?.external,
    documentUrl: resolved?.document?.url,
  })
    ? normalizeUniversalOutlineButtonClassName(baseClassName, item?.tone || 'atlantean')
    : (baseClassName || undefined);
  const revealAction = resolveInlineCtaRevealAction(item, inlineCtaReveal?.lookup);
  const label = children ?? resolved.label ?? item?.label;
  const targetBlank = Boolean(resolved && (resolved.external || resolved.openInNewWindow));
  const relAttr = targetBlank ? 'noreferrer noopener' : undefined;
  const onClick = revealAction
    ? (event) => {
        event.preventDefault();
        inlineCtaReveal?.onReveal?.(revealAction.targetEntry);
      }
    : undefined;

  if (revealAction && !resolved?.href && !resolved?.to && !item?.to) {
    return <button type="button" className={resolvedClassName} onClick={onClick}>{label}</button>;
  }

  if (resolved.href) {
    return (
      <a
        href={resolved.href}
        target={targetBlank ? '_blank' : undefined}
        rel={relAttr}
        className={resolvedClassName}
        onClick={onClick}
      >
        {label}
      </a>
    );
  }
  if (!resolved.to && !item?.to) {
    return <span className={resolvedClassName}>{label}</span>;
  }

  return (
    <Link
      to={resolved.to || item?.to || '#'}
      className={resolvedClassName}
      target={targetBlank ? '_blank' : undefined}
      rel={relAttr}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

function NativeCardAccordion({ cardTitle, accordion }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (!isOpen || !panelRef.current) {
      return undefined;
    }

    const measure = () => {
      setPanelHeight(panelRef.current?.scrollHeight || 0);
    };

    measure();

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(measure);
      observer.observe(panelRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, accordion]);

  const panelId = `native-card-accordion-${cardTitle}-${accordion?.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (
    <div className={`service-native-card-accordion${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="service-native-card-accordion-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{accordion.title}</span>
      </button>
      <div
        id={panelId}
        ref={panelRef}
        className="service-native-card-accordion-panel"
        aria-hidden={isOpen ? 'false' : 'true'}
        style={{ maxHeight: isOpen ? `${panelHeight}px` : '0px' }}
      >
        {Array.isArray(accordion.links) && accordion.links.length ? (
          <ul className="service-native-card-accordion-links">
            {accordion.links.map((item) => (
              <li key={`${accordion.title}-${item.label}-${item.to || item.href || item.documentId}`}>
                <NativeLink item={item} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function firstNameFromDisplayName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return 'Consultant';
  }
  return trimmed.split(/\s+/)[0];
}

const HERO_COLOR_CLASS_SET = new Set(['is-atlantean', 'is-mango', 'is-melon', 'is-sandstone', 'is-white', 'is-super-grey']);
const HERO_ANIMATION_PRESET_SET = new Set(['default', 'none', 'loans-unblur']);
const HERO_HEIGHT_MODE_SET = new Set(['default', 'custom']);
const HERO_BG_TONE_SET = new Set(['white', 'sand', 'blue', 'grey']);
const HERO_JUSTIFY_SET = new Set(['left', 'center', 'right']);
const ACTION_BUTTON_STYLE_SET = new Set(['blue', 'dark', 'outline', 'ghost']);
const NATIVE_HERO_LINE_KEYS = ['line1', 'line2', 'line3'];
const NATIVE_HERO_LINE_CLASS_FALLBACKS = {
  line1: 'line1',
  line2: 'line2',
  line3: 'line3',
};

function clampFrontHudOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 15;
  }
  return Math.max(0, Math.min(90, Math.round(numeric)));
}

function normalizeHeroColorClass(value) {
  const token = normalizeSemanticTextColorClass(value);
  return HERO_COLOR_CLASS_SET.has(token) ? token : '';
}

function normalizeHeroAnimationPreset(value) {
  const token = String(value || '').trim();
  return HERO_ANIMATION_PRESET_SET.has(token) ? token : 'default';
}

function normalizeHeroHeightMode(value) {
  const token = String(value || '').trim();
  return HERO_HEIGHT_MODE_SET.has(token) ? token : 'default';
}

function normalizeHeroBgTone(value) {
  const token = String(value || '').trim();
  return HERO_BG_TONE_SET.has(token) ? token : 'white';
}

function normalizeHeroJustify(value) {
  const token = String(value || '').trim();
  return HERO_JUSTIFY_SET.has(token) ? token : 'center';
}

function buildActionRowClassName(justify, fallback = 'left') {
  const normalized = normalizeHeroJustify(
    typeof justify === 'string' && justify.trim() ? justify : fallback,
  );

  if (normalized === 'center') {
    return 'service-native-action-row is-centered';
  }
  if (normalized === 'right') {
    return 'service-native-action-row is-right';
  }
  return 'service-native-action-row is-left';
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}

function normalizeHeroHeightSvh(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 42;
  }
  return Math.max(20, Math.min(90, Math.round(numeric)));
}

function normalizeNativeHeroLineKey(value) {
  const token = String(value || '').trim().toLowerCase();
  return NATIVE_HERO_LINE_KEYS.includes(token) ? token : 'line1';
}

function normalizePanelTextTone(value, fallback = 'dark') {
  return normalizeSharedPanelTextTone(value, fallback);
}

function normalizePageContentSpaceRem(value, fallback = 0, min = 0, max = 8) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Number(numeric.toFixed(2))));
}

function normalizeActionButtonStyle(value) {
  const token = String(value || '').trim().toLowerCase();
  return ACTION_BUTTON_STYLE_SET.has(token) ? token : 'blue';
}

function normalizeActionButtonTone(value, fallback = 'atlantean') {
  return normalizeButtonTone(value, fallback);
}

function toActionButtonClassConfig(style, tone) {
  const normalizedStyle = normalizeActionButtonStyle(style);
  const defaultTone = normalizedStyle === 'dark' || normalizedStyle === 'ghost' ? 'super-grey' : 'atlantean';
  const normalizedTone = normalizedStyle === 'outline'
    ? normalizeActionButtonTone(tone, defaultTone)
    : defaultTone;
  const className = [
    normalizedStyle === 'dark' ? 'is-dark' : '',
    normalizedStyle === 'ghost' ? 'is-ghost' : '',
    normalizedStyle === 'outline' ? 'is-outline' : '',
    `is-tone-${normalizedTone}`,
  ].filter(Boolean).join(' ');
  return {
    style: normalizedStyle,
    tone: normalizedTone,
    className,
  };
}

function normalizeIntroEmphasisClassName(value) {
  const normalized = normalizeSemanticTextColorClass(value);
  return HERO_COLOR_CLASS_SET.has(normalized) ? normalized : '';
}

function resolveIntroEmphasisColor(value) {
  return resolveIntroAccentColor(value);
}

function heroAnimationClassForLine(preset, lineNumber) {
  const normalized = normalizeHeroAnimationPreset(preset);
  if (normalized === 'none') {
    return 'hero-anim-none';
  }
  if (normalized === 'loans-unblur') {
    if (lineNumber === 1) {
      return 'hero-anim-loans-unblur';
    }
    if (lineNumber === 2) {
      return 'hero-anim-loans-slide';
    }
    return 'hero-anim-loans-slide-followup';
  }
  return '';
}

function getHeroRailInlineStyle(hero) {
  if (!hero || normalizeHeroHeightMode(hero.heightMode) !== 'custom') {
    return undefined;
  }
  const heightSvh = normalizeHeroHeightSvh(hero.heightSvh);
  return {
    minHeight: `clamp(220px, ${heightSvh}svh, 700px)`,
  };
}

function buildTestDynamicHero(block) {
  const runtime = buildDynamicHeroFromBlock(block);
  if (!runtime) {
    return null;
  }

  const settings = block.settings || {};
  const heightMode = normalizeHeroHeightMode(settings.heightMode);
  const heightSvh = normalizeHeroHeightSvh(settings.heightSvh);
  const lines = runtime.lines.map((line) => {
    const lineKey = `line${line.id}`;
    return {
      title: line.text,
      className: String(line.className || NATIVE_HERO_LINE_CLASS_FALLBACKS[lineKey] || lineKey).trim() || lineKey,
      highlights: Array.isArray(line.highlights) ? line.highlights : [],
    };
  });
  const actions = Array.isArray(runtime.actions)
    ? runtime.actions.map((action) => toNativeActionItem(action)).filter(Boolean)
    : [];

  return {
    lines,
    animationPreset: normalizeHeroAnimationPreset(runtime.animationPreset),
    bgTone: normalizeHeroBgTone(runtime.bgTone),
    justify: normalizeHeroJustify(runtime.justify),
    titleSizeRem: normalizeHeroTitleSizeRem(runtime.titleSizeRem),
    heightMode,
    heightSvh,
    lineGap: normalizeHeroLineGapEm(runtime.lineGap),
    lineHeight: normalizeHeroLineHeightEm(runtime.lineHeight),
    actions,
    actionJustify: normalizeHeroJustify(runtime.actionJustify || runtime.justify || 'left'),
  };
}

function toActionLinkConfig(label, url, style, tone, pageRef, resolvePathFromRef, forceExternal = false) {
  const nextLabel = String(label || '').trim();
  const nextUrl = String(url || '').trim();
  if (!nextLabel || !nextUrl) {
    return null;
  }

  const buttonClassConfig = toActionButtonClassConfig(style, tone);
  const className = buttonClassConfig.className;
  const isExternal = /^(https?:|mailto:|tel:)/i.test(nextUrl);
  const resolvedTo = typeof resolvePathFromRef === 'function'
    ? resolvePathFromRef(pageRef, nextUrl)
    : nextUrl;

  return isExternal
    ? { label: nextLabel, href: nextUrl, className, openInNewWindow: Boolean(forceExternal) }
    : { label: nextLabel, to: resolvedTo, className, openInNewWindow: Boolean(forceExternal) };
}

function normalizeHtmlContent(value) {
  const html = String(value || '').trim();
  if (!html || html === '<p></p>' || html === '<p><br></p>') {
    return '';
  }
  return html;
}

function toNativeActionItem(action) {
  if (!action || typeof action !== 'object') {
    return null;
  }
  const className = toActionButtonClassConfig(action.style, action.tone).className;
  return {
    ...action,
    className: className || undefined,
  };
}

function buildNativeIntroConfig(block, { includeTestClassName = false } = {}) {
  const runtime = buildDynamicIntroFromBlock(block);
  if (!runtime) {
    return null;
  }

  const actions = Array.isArray(runtime.actions)
    ? runtime.actions.map((action) => toNativeActionItem(action)).filter(Boolean)
    : [];

  return {
    heading: runtime.heading || null,
    headingClassName: runtime.headingClassName || '',
    headingHighlights: Array.isArray(runtime.headingHighlights) ? runtime.headingHighlights : [],
    bodyHtml: normalizeHtmlContent(runtime.bodyHtml),
    body: runtime.body ? [runtime.body] : [],
    emphasis: runtime.extraLine || null,
    emphasisClassName: runtime.extraLine ? (runtime.extraLineClassName || '') : '',
    emphasisStyle: runtime.extraLineStyle || undefined,
    justify: normalizeHeroJustify(runtime.justify),
    lineSpacing: normalizeIntroLineSpacing(runtime.lineSpacing),
    actions,
    className: `dynamic-intro is-bg-${normalizeSurfaceBgTone(runtime.bgTone, 'sand')} is-text-${normalizePanelTextTone(runtime.textTone, 'dark')}${includeTestClassName ? ' test-dynamic-intro' : ''}`,
  };
}

function buildNativeBillboardSection(block, { includeTestClassName = false } = {}) {
  const runtime = buildDynamicBillboardFromBlock(block);
  if (!runtime) {
    return null;
  }

  const actions = Array.isArray(runtime.actions)
    ? runtime.actions.map((action) => toNativeActionItem(action)).filter(Boolean)
    : [];
  const sectionStyle = actions.length
    ? { '--dynamic-billboard-padding-bottom': 'clamp(4.1rem, 8vw, 6.8rem)' }
    : undefined;
  const railStyle = runtime.contentMaxWidthPx
    ? { '--dynamic-billboard-max-width': `${runtime.contentMaxWidthPx}px` }
    : undefined;

  return {
    id: 'dynamic-billboard',
    blockId: String(block?.id || '').trim() || undefined,
    targetSectionKey: runtime.targetSectionKey || '',
    copyWrap: true,
    className: `dynamic-billboard${includeTestClassName ? ' test-dynamic-billboard' : ''} is-bg-${normalizeHeroBgTone(runtime.bgTone || 'blue')} is-text-${normalizePanelTextTone(runtime.textTone, 'white')}`,
    title: runtime.title,
    titleClassName: runtime.titleClassName || undefined,
    titleStyle: runtime.titleStyle,
    titleHighlights: Array.isArray(runtime.titleHighlights) ? runtime.titleHighlights : [],
    subtitle: runtime.subtitle || undefined,
    subtitleClassName: runtime.subtitleClassName || undefined,
    subtitleStyle: runtime.subtitleStyle || undefined,
    html: normalizeHtmlContent(runtime.bodyHtml),
    body: runtime.body ? [runtime.body] : [],
    justify: normalizeHeroJustify(runtime.justify),
    copyStyle: runtime.copyStyle || undefined,
    copyClassName: runtime.copyClassName || '',
    copyFadeRootMargin: runtime.copyFadeRootMargin || undefined,
    sectionStyle,
    railStyle,
    actions,
  };
}

function buildDynamicPageContentSection(block, pathname) {
  const runtime = buildDynamicPageContentFromBlock(block);
  if (!runtime) {
    return null;
  }

  const {
    html,
    spaceBeforeRem,
    spaceAfterRem,
    paddingTopRem,
    paddingBottomRem,
    contentMaxWidthPx,
  } = runtime;

  return {
    id: `${pathname}-page-content`,
    blockId: String(block?.id || '').trim() || undefined,
    hideTitle: true,
    className: pathname === '/test' ? 'test-dynamic-page-content' : 'native-dynamic-page-content',
    html,
    sectionStyle: {
      '--dyn-content-margin-top': `${spaceBeforeRem}rem`,
      '--dyn-content-margin-bottom': `${spaceAfterRem}rem`,
      '--dyn-content-padding-top': `${paddingTopRem}rem`,
      '--dyn-content-padding-bottom': `${paddingBottomRem}rem`,
      '--dyn-content-max-width': `${contentMaxWidthPx}px`,
    },
  };
}

function buildDynamicGridSection(block, pathname) {
  const runtime = buildDynamicGridFromBlock(block);
  if (!runtime) {
    return null;
  }

  const {
    presetId,
    title,
    titleClassName,
    titleHighlights,
    body,
    bodyHtml,
    bgTone,
    contentWidth,
    columns,
    cardStyle,
    titleTone,
    bodyTone,
    dividerTone,
    showTitleDivider,
    cardPaddingRem,
    cardTitleSizeRem,
    cardBodySizeRem,
    cardBodyLineHeight,
    cards: runtimeCards,
    targetSectionKey,
  } = runtime;
  const hasIntroCopy = Boolean(title || body || bodyHtml);
  const sectionClassBase = pathname === '/test' ? 'test-dynamic-grid' : 'native-dynamic-grid';
  const presetRuntimeClassName = buildPresetFamilyRuntimeClassName('card_grid', presetId);
  const cards = (Array.isArray(runtimeCards) ? runtimeCards : [])
    .map((card) => ({
      slot: card.slot,
      title: card.title,
      titleClassName: card.titleClassName,
      titleHighlights: Array.isArray(card.titleHighlights) ? card.titleHighlights : [],
      body: card.body,
      list: Array.isArray(card.list) ? card.list : undefined,
      cardClass: card.cardClass,
      dividerTone: card.dividerTone,
      actions: (Array.isArray(card.actions) ? card.actions : (card.action ? [card.action] : []))
        .map((action) => toNativeActionItem(action))
        .filter(Boolean),
      links: Array.isArray(card.links) ? card.links : undefined,
      accordions: Array.isArray(card.accordions) ? card.accordions : undefined,
    }))
    .filter(Boolean);

  return {
    id: `${pathname}-dynamic-grid-${String(block.id || 'grid').trim() || 'grid'}`,
    blockId: String(block?.id || '').trim() || undefined,
    hideTitle: !title,
    title,
    titleClassName: titleClassName || undefined,
    titleHighlights: titleHighlights.length ? titleHighlights : [],
    body: body ? [body] : [],
    html: bodyHtml,
    copyWrap: hasIntroCopy,
    wide: contentWidth === 'browser',
    columns,
    cards,
    sectionStyle: {
      '--dynamic-grid-card-padding': `${cardPaddingRem}rem`,
      '--dynamic-grid-card-title-size': `${cardTitleSizeRem}rem`,
      '--dynamic-grid-card-body-size': `${cardBodySizeRem}rem`,
      '--dynamic-grid-card-body-line-height': String(cardBodyLineHeight),
    },
    targetSectionKey: targetSectionKey || '',
    className: `${sectionClassBase} is-bg-${bgTone} is-width-${contentWidth} is-title-${titleTone} is-body-${bodyTone} is-divider-tone-${dividerTone} ${presetRuntimeClassName}${cardStyle === 'none' ? ' is-card-none' : ''}${showTitleDivider ? ' is-divider-on' : ' is-divider-off'}`,
  };
}

function buildDynamicColumnsSection(block, pathname) {
  const runtime = buildDynamicColumnsFromBlock(block);
  if (!runtime) {
    return null;
  }

  const {
    title,
    titleClassName,
    titleHighlights,
    leadLine,
    leadLineClassName,
    leadLineHighlights,
    bodyHtml,
    followupLine,
    followupLineClassName,
    followupLineHighlights,
    justify,
    bgTone,
    contentWidth,
    columns,
    columnsStyle,
    items,
  } = runtime;
  const hasIntroCopy = Boolean(title || leadLine || bodyHtml || followupLine);
  const sectionClassBase = pathname === '/test' ? 'test-dynamic-columns' : 'native-dynamic-columns';
  const presetClassToken = resolvePresetFamilyClassToken(block);
  const presetRuntimeClassName = buildPresetFamilyRuntimeClassName('columns', presetClassToken);
  const isLegacyHighlight = columnsStyle === 'legacy-highlight';
  const columnsItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      slot: item.slot,
      type: isLegacyHighlight ? 'text' : item.type,
      title: item.title || '',
      body: !isLegacyHighlight && item.body ? [item.body] : [],
      image: !isLegacyHighlight ? (item.imageUrl || '') : '',
      imageAlt: !isLegacyHighlight ? (item.imageAlt || '') : '',
      actions: !isLegacyHighlight && item.action ? [item.action] : [],
    }))
    .filter(Boolean);

  return {
    id: `${pathname}-dynamic-columns-${String(block.id || 'columns').trim() || 'columns'}`,
    blockId: String(block?.id || '').trim() || undefined,
    hideTitle: !title,
    title,
    titleClassName: titleClassName || undefined,
    titleHighlights: Array.isArray(titleHighlights) ? titleHighlights : [],
    leadLine: leadLine || '',
    leadLineClassName: leadLineClassName || undefined,
    leadLineHighlights: Array.isArray(leadLineHighlights) ? leadLineHighlights : [],
    html: bodyHtml || '',
    followupLine: followupLine || '',
    followupLineClassName: followupLineClassName || undefined,
    followupLineHighlights: Array.isArray(followupLineHighlights) ? followupLineHighlights : [],
    justify,
    copyWrap: hasIntroCopy,
    wide: contentWidth === 'browser',
    columns,
    columnsStyle,
    columnsItems,
    className: `${sectionClassBase} is-bg-${bgTone} is-width-${contentWidth} is-columns-style-${columnsStyle} ${presetRuntimeClassName}`,
  };
}

function getSectionTargetKeys(section, sectionIndex) {
  const keys = [];
  const id = String(section?.id || '').trim();
  const className = String(section?.className || '').trim();
  if (id) {
    keys.push(`id:${id}`);
  }
  if (className) {
    keys.push(`class:${className}`);
    className
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => {
        keys.push(`class:${token}`);
      });
  }
  keys.push(`index:${sectionIndex}`);
  return Array.from(new Set(keys));
}

function mergeClassNames(baseClassName, nextClassName) {
  const tokens = `${String(baseClassName || '').trim()} ${String(nextClassName || '').trim()}`
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return [...new Set(tokens)].join(' ');
}

function applyManagedDisclosureValue(sourceValue, disclosureId, getDisclosureValue) {
  const token = String(disclosureId || '').trim();
  if (!token) {
    return sourceValue;
  }
  return getDisclosureValue(token, sourceValue);
}

function applyManagedDisclosuresToSection(section, getDisclosureValue) {
  if (!section || typeof section !== 'object') {
    return section;
  }

  const nextSection = {
    ...section,
    fineprint: applyManagedDisclosureValue(section.fineprint, section.fineprintDisclosureId, getDisclosureValue),
  };

  if (Array.isArray(section.cards)) {
    nextSection.cards = section.cards.map((card) => {
      if (!card || typeof card !== 'object') {
        return card;
      }
      const nextFineprint = applyManagedDisclosureValue(card.fineprint, card.fineprintDisclosureId, getDisclosureValue);
      return nextFineprint === card.fineprint
        ? card
        : { ...card, fineprint: nextFineprint };
    });
  }

  return nextSection;
}

function applyManagedChartValue(sourceValue, chartId, getChartValue) {
  const token = String(chartId || '').trim();
  if (!token) {
    return sourceValue;
  }
  const managedChart = getChartValue(token, null);
  if (!managedChart || typeof managedChart !== 'object') {
    return sourceValue;
  }
  return {
    headers: Array.isArray(managedChart.headers) ? managedChart.headers : sourceValue?.headers,
    rows: Array.isArray(managedChart.rows) ? managedChart.rows : sourceValue?.rows,
    valueAlignment: String(managedChart.valueAlignment || sourceValue?.valueAlignment || 'left').trim().toLowerCase() === 'right'
      ? 'right'
      : 'left',
  };
}

function applyManagedChartsToSection(section, getChartValue) {
  if (!section || typeof section !== 'object') {
    return section;
  }

  const nextTable = applyManagedChartValue(section.table, section.tableChartId, getChartValue);
  return nextTable === section.table
    ? section
    : {
        ...section,
        table: nextTable,
      };
}

function buildDynamicCtaSection(block, pathname) {
  const runtime = buildDynamicCtaFormFromBlock(block);
  if (!runtime) {
    return null;
  }

  const sectionClassBase = pathname === '/test' ? 'test-dynamic-cta' : 'native-dynamic-cta';
  const submitButtonConfig = toActionButtonClassConfig(runtime.submitStyle, runtime.submitTone);
  const presentationClassName = buildDynamicCtaPresentationClassName(runtime);

  return {
    id: `${pathname}-dynamic-cta-${String(block.id || 'cta_form').trim() || 'cta_form'}`,
    blockId: String(block?.id || '').trim() || undefined,
    targetSectionKey: runtime.targetSectionKey || '',
    copyWrap: true,
    className: `${sectionClassBase} is-bg-${runtime.bgTone}${presentationClassName ? ` ${presentationClassName}` : ''}`,
    title: runtime.title,
    titleClassName: runtime.titleClassName || undefined,
    titleHighlights: runtime.titleHighlights?.length ? runtime.titleHighlights : [],
    html: runtime.bodyHtml,
    form: {
      variant: 'dynamic-cta',
      title: '',
      subtitle: runtime.subtitle || '',
      submitLabel: runtime.submitLabel,
      submitClassName: submitButtonConfig.className,
      successMessage: runtime.successMessage,
      salesforceUrl: runtime.salesforceUrl,
      displayMode: runtime.displayMode,
      triggerMode: runtime.triggerMode,
      fields: runtime.fields,
    },
  };
}

function buildDynamicRequestFormSection(block, pathname) {
  const runtime = buildDynamicRequestFormFromBlock(block, { pathname });
  if (!runtime) {
    return null;
  }

  return {
    id: `${pathname}-dynamic-request-${String(block.id || 'request_form').trim() || 'request_form'}`,
    blockId: String(block?.id || '').trim() || undefined,
    targetSectionKey: runtime.targetSectionKey || '',
    hideCopy: true,
    className: runtime.sectionClassName,
    sectionStyle: runtime.sectionStyle,
    form: {
      variant: 'dynamic-request',
      formClassName: runtime.formClassName,
      title: runtime.title,
      titleClassName: runtime.titleClassName,
      titleHighlightsJson: runtime.titleHighlightsJson,
      subtitle: runtime.subtitle,
      bodyHtml: runtime.bodyHtml,
      body: runtime.body,
      steps: runtime.steps,
      submitLabel: runtime.submitLabel,
      successMessage: runtime.successMessage,
      salesforceUrl: runtime.salesforceUrl,
    },
  };
}

function buildDynamicTestimonialsSection(block, pathname, testimonialsLibrary) {
  const runtime = buildDynamicTestimonialsFromBlock(block, {
    pathname,
    library: testimonialsLibrary,
  });
  if (!runtime) {
    return null;
  }

  const { items, fineprint, targetFineprintSectionKey } = runtime;
  const sectionClassBase = pathname === '/test' ? 'test-dynamic-testimonials' : 'native-dynamic-testimonials';

  return {
    id: `${pathname}-dynamic-testimonials-${String(block.id || 'testimonials').trim() || 'testimonials'}`,
    blockId: String(block?.id || '').trim() || undefined,
    targetSectionKey: runtime.targetSectionKey || '',
    className: sectionClassBase,
    hideTitle: true,
    testimonials: items.map((item) => ({
      quote: item.quote,
      author: item.authorTitle ? `${item.author}, ${item.authorTitle}` : item.author,
    })),
    fineprint,
    targetFineprintSectionKey,
  };
}

function buildDynamicNewsletterSection(block, pathname) {
  const runtime = buildDynamicNewsletterFromBlock(block);
  if (!runtime) {
    return null;
  }

  const { title, titleClassName, titleHighlights, bodyHtml, bgTone, textTone, formId, accountId, sourceId } = runtime;
  const sectionClassBase = pathname === '/test' ? 'test-dynamic-newsletter' : 'native-dynamic-newsletter';

  return {
    id: `${pathname}-dynamic-newsletter-${String(block.id || 'newsletter').trim() || 'newsletter'}`,
    copyWrap: true,
    className: `${sectionClassBase} is-bg-${bgTone} is-text-${textTone}`,
    title,
    titleClassName: titleClassName || undefined,
    titleHighlights: titleHighlights.length ? titleHighlights : [],
    html: bodyHtml,
    form: {
      variant: 'dynamic-newsletter',
      title: 'Newsletter signup form',
      formId,
      accountId,
      sourceId,
    },
  };
}

function buildDynamicFeaturePanelSection(block, pathname) {
  const runtime = buildDynamicFeaturePanelFromBlock(block);
  if (!runtime) {
    return null;
  }

  return {
    id: `${pathname}-dynamic-feature-panel-${String(block.id || 'feature-panel').trim() || 'feature-panel'}`,
    blockId: String(block?.id || '').trim() || undefined,
    targetSectionKey: runtime.targetSectionKey || '',
    className: pathname === '/test' ? 'test-dynamic-feature-panel' : 'native-dynamic-feature-panel',
    feature: {
      title: runtime.title,
      body: runtime.body ? [runtime.body] : [],
      html: runtime.bodyHtml || '',
      image: runtime.imageUrl || '',
      imageAlt: runtime.imageAlt || '',
      actions: runtime.action ? [runtime.action] : [],
    },
  };
}

function buildDynamicSiteFeatureSection(block, pathname) {
  const runtime = buildDynamicSiteFeatureFromBlock(block);
  if (!runtime) {
    return null;
  }

  return {
    id: `${pathname}-dynamic-site-feature-${String(block.id || 'site-feature').trim() || 'site-feature'}`,
    blockId: String(block?.id || '').trim() || undefined,
    targetSectionKey: runtime.targetSectionKey || '',
    className: pathname === '/test' ? 'test-dynamic-site-feature' : 'native-dynamic-site-feature',
    siteFeatureRuntime: runtime,
    feature: {
      title: runtime.title,
      body: runtime.body ? [runtime.body] : [],
      image: runtime.imageUrl || '',
      imageAlt: runtime.imageAlt || '',
      actions: runtime.action ? [runtime.action] : [],
    },
  };
}

const CERTIFICATE_REQUEST_COVERAGE_OPTIONS = [
  { value: 'general-liability', label: 'General Liability' },
  { value: 'workers-compensation', label: 'Workers Compensation' },
  { value: 'business-automobile', label: 'Business Automobile' },
  { value: 'umbrella', label: 'Umbrella' },
];

function toStateOptions() {
  return Object.entries(US_STATE_LABELS).map(([code, label]) => ({ value: code, label }));
}

function formatPhoneValue(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (digits.length > 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
}

function formatZipValue(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function buildCertificateRequestSteps(stateOptions) {
  return [
    {
      id: 'requester',
      fields: [
        { id: 'firstName', label: 'First Name *', type: 'text', required: true, placeholder: 'First Name' },
        { id: 'lastName', label: 'Last Name *', type: 'text', required: true, placeholder: 'Last Name' },
        { id: 'email', label: 'Email Address *', type: 'email', required: true, placeholder: 'me@email.com', full: true },
        {
          id: 'authorizedBy',
          label: 'Authorized By *',
          type: 'text',
          required: true,
          placeholder: 'John Doe',
          help: 'The person requesting certificates must be authorized on file with our office.',
        },
        {
          id: 'organizationName',
          label: 'Name of Your Organization *',
          type: 'text',
          required: true,
          placeholder: 'Church Name',
          help: 'Use the legal name shown on your policy.',
        },
      ],
    },
    {
      id: 'organization',
      fields: [
        { id: 'address1', label: 'Address of Organization *', type: 'text', required: true, placeholder: 'Address', full: true },
        { id: 'address2', label: 'Address Line 2', type: 'text', placeholder: '', full: true },
        { id: 'city', label: 'City *', type: 'text', required: true, placeholder: 'City' },
        { id: 'state', label: 'State *', type: 'select', required: true, options: stateOptions, placeholder: 'Select a State' },
        {
          id: 'zip',
          label: 'Zip Code *',
          type: 'text',
          required: true,
          placeholder: '12345',
          maxLength: 10,
          format: 'zip',
        },
        {
          id: 'phone',
          label: 'Phone Number *',
          type: 'text',
          required: true,
          placeholder: '555-555-5555',
          format: 'phone',
        },
        {
          id: 'fax',
          label: 'Fax Number',
          type: 'text',
          placeholder: '555-555-5555',
          full: true,
          format: 'phone',
        },
        {
          id: 'coverageNeeded',
          label: 'Coverage Needed *',
          type: 'checkbox-group',
          required: true,
          options: CERTIFICATE_REQUEST_COVERAGE_OPTIONS,
          full: true,
          errorMessage: 'Please select at least one coverage option.',
        },
      ],
    },
    {
      id: 'event',
      note: 'Event Details',
      fields: [
        {
          id: 'eventDescription',
          label: 'Event/Activity Name and Description',
          type: 'textarea',
          placeholder: 'Please provide as much detail as possible here.',
          full: true,
          help: 'Include event name, activities, and any sports/athletics sponsored.',
        },
        {
          id: 'eventLocation',
          label: 'Event Site/Location *',
          type: 'text',
          required: true,
          placeholder: 'Include full address or intersection here.',
          full: true,
        },
        { id: 'eventStartDate', label: 'Event Start Date', type: 'text', placeholder: 'MM/DD/YY' },
        { id: 'eventEndDate', label: 'Event End Date', type: 'text', placeholder: 'MM/DD/YY' },
        {
          id: 'eventFrequency',
          label: 'Event Frequency',
          type: 'radio-group',
          options: [
            { value: 'one-time', label: 'One Time' },
            { value: 'periodical', label: 'Periodical' },
          ],
          full: true,
          help: 'Recurring events may require an endorsement. Contact 1-866-662-8210 if needed.',
        },
      ],
    },
    {
      id: 'certificate-holder',
      note: 'Certificate Holder',
      noteBody: 'The certificate holder is the organization/entity requesting proof of your insurance, not your church or organization.',
      fields: [
        { id: 'holderName', label: 'Certificate Holder Name *', type: 'text', required: true, placeholder: 'John Doe' },
        { id: 'holderAddress', label: 'Certificate Holder Address *', type: 'text', required: true, placeholder: 'Address' },
        { id: 'holderAddress2', label: 'Address Line 2', type: 'text', full: true },
        { id: 'holderCity', label: 'Certificate Holder City *', type: 'text', required: true, placeholder: 'City' },
        { id: 'holderState', label: 'State *', type: 'select', required: true, options: stateOptions, placeholder: 'Select a State' },
        {
          id: 'holderZip',
          label: 'Certificate Holder Zip Code *',
          type: 'text',
          required: true,
          placeholder: '12345',
          maxLength: 10,
          format: 'zip',
        },
        {
          id: 'holderFax',
          label: 'Certificate Holder Fax Number',
          type: 'text',
          placeholder: '555-555-5555',
          format: 'phone',
        },
        {
          id: 'holderEmail',
          label: 'Certificate Holder Email Address',
          type: 'email',
          placeholder: 'me@mail.com',
          full: true,
        },
        {
          id: 'deliveryMethod',
          label: 'Deliver to Certificate Holder By:',
          type: 'radio-group',
          options: [
            { value: 'mail', label: 'Mail' },
            { value: 'email', label: 'Email' },
            { value: 'fax', label: 'Fax' },
          ],
          full: true,
        },
      ],
    },
    {
      id: 'additional-insured',
      note: 'Additional Insured Wording Required by Contract',
      noteBody: 'Located on the contract or communicated by the certificate holder. Examples: officers, officials, agents, board members, volunteers, servants.',
      alert: 'Please note: There may be an additional charge for Additional Insured endorsement. If so, you will be contacted for authorization.',
      fields: [
        {
          id: 'additionalInsuredRequired',
          label: 'Is Additional Insured a requirement of the certificate holder? *',
          type: 'radio-group',
          required: true,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
          full: true,
          help: 'Only select Yes if required by the certificate holder/contract.',
        },
        {
          id: 'comments',
          label: 'Additional Comments or Remarks',
          type: 'textarea',
          placeholder: 'Additional instructions here.',
          full: true,
        },
        {
          id: 'attachment',
          label: 'Attach Contract or Other Documentation',
          type: 'file',
          full: true,
          help: 'Upload any special wording/higher limit requirements, or send to cert@agfinancial.org.',
        },
      ],
    },
  ];
}

function CertificateRequestForm({ config }) {
  const startedAtRef = useRef(Date.now());
  const fieldRefs = useRef({});
  const stateOptions = useMemo(() => toStateOptions(), []);
  const steps = useMemo(() => buildCertificateRequestSteps(stateOptions), [stateOptions]);
  const initialValues = useMemo(() => {
    const values = {};
    steps.forEach((step) => {
      step.fields.forEach((field) => {
        if (field.type === 'checkbox-group') {
          values[field.id] = [];
          return;
        }
        values[field.id] = '';
      });
    });
    return values;
  }, [steps]);

  const [activeStep, setActiveStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [stepError, setStepError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    setActiveStep(0);
    setValues(initialValues);
    setStepError('');
    setSubmitted(false);
    setElapsedTime(0);
    startedAtRef.current = Date.now();
    fieldRefs.current = {};
  }, [initialValues, config]);

  const currentStep = steps[Math.min(activeStep, steps.length - 1)];

  const setFieldRef = (fieldId) => (node) => {
    if (node && !fieldRefs.current[fieldId]) {
      fieldRefs.current[fieldId] = node;
    }
  };

  const onChangeValue = (field, nextValue) => {
    let value = nextValue;
    if (field.format === 'phone') {
      value = formatPhoneValue(value);
    } else if (field.format === 'zip') {
      value = formatZipValue(value);
    }

    setValues((prev) => ({ ...prev, [field.id]: value }));
    if (stepError) {
      setStepError('');
    }
  };

  const toggleCheckboxGroupValue = (fieldId, optionValue, checked) => {
    setValues((prev) => {
      const currentValues = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      if (checked) {
        return { ...prev, [fieldId]: Array.from(new Set([...currentValues, optionValue])) };
      }
      return { ...prev, [fieldId]: currentValues.filter((value) => value !== optionValue) };
    });
    if (stepError) {
      setStepError('');
    }
  };

  const validateStep = (stepIndex) => {
    const step = steps[stepIndex];
    if (!step) {
      return { valid: true };
    }

    for (let index = 0; index < step.fields.length; index += 1) {
      const field = step.fields[index];
      const rawValue = values[field.id];

      if (!field.required) {
        continue;
      }

      if (field.type === 'checkbox-group') {
        const count = Array.isArray(rawValue) ? rawValue.length : 0;
        if (!count) {
          return {
            valid: false,
            message: field.errorMessage || 'Please select at least one option.',
            fieldId: field.id,
          };
        }
        continue;
      }

      if (field.type === 'radio-group' || field.type === 'select') {
        if (!rawValue) {
          return {
            valid: false,
            message: 'Please complete all required fields before continuing.',
            fieldId: field.id,
          };
        }
        continue;
      }

      if (!String(rawValue || '').trim()) {
        return {
          valid: false,
          message: 'Please complete all required fields before continuing.',
          fieldId: field.id,
        };
      }
    }

    return { valid: true };
  };

  const focusField = (fieldId) => {
    const element = fieldRefs.current[fieldId];
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  };

  const onNext = () => {
    const result = validateStep(activeStep);
    if (!result.valid) {
      setStepError(result.message);
      if (result.fieldId) {
        focusField(result.fieldId);
      }
      return;
    }

    setStepError('');
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const onBack = () => {
    setStepError('');
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const result = validateStep(activeStep);
    if (!result.valid) {
      setStepError(result.message);
      if (result.fieldId) {
        focusField(result.fieldId);
      }
      return;
    }

    setStepError('');
    setElapsedTime(Math.round((Date.now() - startedAtRef.current) / 1000));
    setSubmitted(true);
  };

  const renderField = (field) => {
    const fieldId = `certificate-request-${field.id}`;
    const fieldClassName = `certificate-request-field${field.full ? ' full' : ''}`;

    if (field.type === 'select') {
      return (
        <div key={field.id} className={fieldClassName}>
          <label htmlFor={fieldId}>{field.label}</label>
          <select
            id={fieldId}
            value={values[field.id] || ''}
            onChange={(event) => onChangeValue(field, event.target.value)}
            required={Boolean(field.required)}
            ref={setFieldRef(field.id)}
          >
            <option value="">{field.placeholder || 'Select one'}</option>
            {(field.options || []).map((option) => (
              <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className={fieldClassName}>
          <label htmlFor={fieldId}>{field.label}</label>
          <textarea
            id={fieldId}
            value={values[field.id] || ''}
            onChange={(event) => onChangeValue(field, event.target.value)}
            placeholder={field.placeholder || undefined}
            rows={field.rows || 4}
            required={Boolean(field.required)}
            ref={setFieldRef(field.id)}
          />
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </div>
      );
    }

    if (field.type === 'radio-group') {
      return (
        <fieldset key={field.id} className={`certificate-request-fieldset ${field.full ? 'full' : ''}`}>
          <legend>{field.label}</legend>
          <div className="certificate-request-choice-row">
            {(field.options || []).map((option, index) => (
              <label key={`${field.id}-${option.value}`} htmlFor={`${fieldId}-${option.value}`}>
                <input
                  id={`${fieldId}-${option.value}`}
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={values[field.id] === option.value}
                  onChange={(event) => onChangeValue(field, event.target.value)}
                  required={Boolean(field.required)}
                  ref={index === 0 ? setFieldRef(field.id) : undefined}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </fieldset>
      );
    }

    if (field.type === 'checkbox-group') {
      const selectedValues = Array.isArray(values[field.id]) ? values[field.id] : [];

      return (
        <fieldset key={field.id} className={`certificate-request-fieldset ${field.full ? 'full' : ''}`}>
          <legend>{field.label}</legend>
          <div className="certificate-request-choice-row">
            {(field.options || []).map((option, index) => (
              <label key={`${field.id}-${option.value}`} htmlFor={`${fieldId}-${option.value}`}>
                <input
                  id={`${fieldId}-${option.value}`}
                  type="checkbox"
                  name={field.id}
                  value={option.value}
                  checked={selectedValues.includes(option.value)}
                  onChange={(event) => toggleCheckboxGroupValue(field.id, option.value, event.target.checked)}
                  ref={index === 0 ? setFieldRef(field.id) : undefined}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </fieldset>
      );
    }

    if (field.type === 'file') {
      return (
        <div key={field.id} className={fieldClassName}>
          <label htmlFor={fieldId}>{field.label}</label>
          <input
            id={fieldId}
            type="file"
            onChange={(event) => onChangeValue(field, event.target.files?.[0] || '')}
            ref={setFieldRef(field.id)}
          />
          {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
        </div>
      );
    }

    return (
      <div key={field.id} className={fieldClassName}>
        <label htmlFor={fieldId}>{field.label}</label>
        <input
          id={fieldId}
          type={field.type || 'text'}
          value={values[field.id] || ''}
          onChange={(event) => onChangeValue(field, event.target.value)}
          placeholder={field.placeholder || undefined}
          maxLength={field.maxLength || undefined}
          required={Boolean(field.required)}
          ref={setFieldRef(field.id)}
        />
        {field.help ? <small className="certificate-request-help">{field.help}</small> : null}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="native-info-inline-form certificate-request-form" aria-label={config.title || 'Certificate request form'}>
        <div className="certificate-request-thank-you" role="status">
          <h5>Thank you.</h5>
          <p>We’ll be in touch soon.</p>
          {elapsedTime > 0 ? <p className="certificate-request-elapsed">Submitted in about {elapsedTime} seconds.</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="native-info-inline-form certificate-request-form" aria-label={config.title || 'Certificate request form'}>
      {config.title ? <h5>{config.title}</h5> : null}
      <p className="certificate-request-intro">Please complete this form in full, including location details. Incomplete submissions may delay your insurance certificate request.</p>
      <form onSubmit={onSubmit} noValidate>
        {currentStep.note ? (
          <div className="certificate-request-note">
            <strong>{currentStep.note}</strong>
            {currentStep.noteBody ? <p>{currentStep.noteBody}</p> : null}
          </div>
        ) : null}
        {currentStep.alert ? <p className="certificate-request-alert">{currentStep.alert}</p> : null}
        <div className="certificate-request-grid">
          {currentStep.fields.map(renderField)}
        </div>
        {stepError ? <p className="certificate-request-error" role="alert">{stepError}</p> : null}
        <div className="native-info-inline-form-step-actions">
          {activeStep > 0 ? (
            <button type="button" className="service-native-btn is-ghost" onClick={onBack}>Back</button>
          ) : (
            <span className="native-info-inline-form-step-spacer" aria-hidden="true" />
          )}
          {activeStep === steps.length - 1 ? (
            <button type="submit" className="service-native-btn">Submit Request</button>
          ) : (
            <button type="button" className="service-native-btn" onClick={onNext}>Next</button>
          )}
        </div>
        <div className="native-info-inline-form-progress" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`native-info-inline-form-dot${index === activeStep ? ' is-active' : ''}`}
            />
          ))}
        </div>
      </form>
    </div>
  );
}

function GenericNativeContentForm({ config }) {
  const safeConfig = config || {};

  const stepConfigs = Array.isArray(safeConfig.steps) && safeConfig.steps.length
    ? safeConfig.steps
    : null;
  const [activeStep, setActiveStep] = useState(0);
  const isMultiStep = Boolean(stepConfigs);
  const currentStep = isMultiStep ? stepConfigs[Math.min(activeStep, stepConfigs.length - 1)] : null;
  const fields = isMultiStep
    ? (Array.isArray(currentStep?.fields) ? currentStep.fields : [])
    : (Array.isArray(safeConfig.fields) && safeConfig.fields.length
      ? safeConfig.fields
      : [
        { id: 'name', label: 'Name', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true },
        { id: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555' },
      ]);

  useEffect(() => {
    setActiveStep(0);
  }, [config, isMultiStep]);

  if (!config) {
    return null;
  }

  const renderField = (field) => {
    const fieldId = `native-form-${field.id}`;

    if (field.type === 'multiselect') {
      return (
        <label key={field.id} htmlFor={fieldId}>
          {field.label}
          <select
            id={fieldId}
            required={Boolean(field.required)}
            defaultValue={Array.isArray(field.defaultValue) ? field.defaultValue : []}
            multiple
            size={Number.isFinite(Number(field.size)) ? Number(field.size) : undefined}
          >
            {(field.options || []).map((option) => (
              <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
          {field.help ? <small>{field.help}</small> : null}
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <label key={field.id} htmlFor={fieldId}>
          {field.label}
          <select
            id={fieldId}
            required={Boolean(field.required)}
            defaultValue={field.defaultValue || ''}
          >
            <option value="" disabled>{field.placeholder || 'Select one'}</option>
            {(field.options || []).map((option) => (
              <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === 'textarea') {
      return (
        <label key={field.id} htmlFor={fieldId}>
          {field.label}
          <textarea
            id={fieldId}
            placeholder={field.placeholder || undefined}
            required={Boolean(field.required)}
            rows={field.rows || 4}
          />
        </label>
      );
    }

    if (field.type === 'radio' && Array.isArray(field.options) && field.options.length) {
      return (
        <fieldset key={field.id}>
          <legend>{field.label}</legend>
          <div className="native-info-inline-form-radio-row">
            {field.options.map((option) => (
              <label key={`${field.id}-${option.value}`} htmlFor={`${fieldId}-${option.value}`}>
                <input
                  id={`${fieldId}-${option.value}`}
                  name={field.id}
                  type="radio"
                  value={option.value}
                  required={Boolean(field.required)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    return (
      <label key={field.id} htmlFor={fieldId}>
        {field.label}
        <input
          id={fieldId}
          type={field.type || 'text'}
          placeholder={field.placeholder || undefined}
          inputMode={field.inputMode || undefined}
          pattern={field.pattern || undefined}
          title={field.title || undefined}
          maxLength={field.maxLength || undefined}
          required={Boolean(field.required)}
        />
      </label>
    );
  };

  const onNextStep = () => {
    setActiveStep((prev) => Math.min(prev + 1, stepConfigs.length - 1));
  };

  const onBackStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const isLastStep = !isMultiStep || activeStep === stepConfigs.length - 1;
  const stepSubmitLabel = currentStep?.submitLabel || config.submitLabel || 'Submit';
  const backLabel = currentStep?.backLabel || 'Back';
  const nextLabelRaw = String(currentStep?.nextLabel || '').trim();
  const nextLabel = !nextLabelRaw || nextLabelRaw === 'Next'
    ? 'Go to next step'
    : nextLabelRaw;

  return (
    <div className="native-info-inline-form" aria-label={config.title || 'Contact form'}>
      {config.title ? <h5>{config.title}</h5> : null}
      <form onSubmit={(event) => event.preventDefault()}>
        {fields.map(renderField)}
        {config.subtitle ? <h6>{config.subtitle}</h6> : null}
        {isMultiStep ? (
          <>
            <div className="native-info-inline-form-step-actions">
              {activeStep > 0 ? (
                <button type="button" className="service-native-btn is-ghost" onClick={onBackStep}>{backLabel}</button>
              ) : (
                <span className="native-info-inline-form-step-spacer" aria-hidden="true" />
              )}
              {isLastStep ? (
                <button type="submit" className="service-native-btn">{stepSubmitLabel}</button>
              ) : (
                <button type="button" className="service-native-btn" onClick={onNextStep}>{nextLabel}</button>
              )}
            </div>
            <div className="native-info-inline-form-progress" aria-hidden="true">
              {stepConfigs.map((step, index) => (
                <span
                  key={step.id || `step-${index + 1}`}
                  className={`native-info-inline-form-dot${index === activeStep ? ' is-active' : ''}`}
                />
              ))}
            </div>
          </>
        ) : (
          <button type="submit" className="service-native-btn">{config.submitLabel || 'Submit'}</button>
        )}
      </form>
    </div>
  );
}

function DynamicCtaForm({ config }) {
  const fields = useMemo(
    () => (Array.isArray(config?.fields) ? config.fields.filter(Boolean) : []),
    [config],
  );
  const [values, setValues] = useState(() => (
    createInitialFormValues(fields, { multiValueTypes: ['multiselect'], booleanTypes: ['checkbox'] })
  ));
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setValues(createInitialFormValues(fields, { multiValueTypes: ['multiselect'], booleanTypes: ['checkbox'] }));
    setSubmitted(false);
    setErrorMessage('');
  }, [config, fields]);

  const onChangeField = (fieldId, nextValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: nextValue }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validate = () => {
    return validateRequiredFormFields(fields, values, {
      multiValueTypes: ['multiselect'],
      booleanTypes: ['checkbox'],
      resolveMessage: (field) => `Please complete "${field.label}" before submitting.`,
    });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const nextError = validate();
    if (nextError) {
      setErrorMessage(nextError);
      return;
    }
    setErrorMessage('');
    setSubmitted(true);
  };

  const { submitLabel, successMessage, salesforceUrl } = normalizeFormSubmissionConfig(config, {
    submitLabel: 'Submit',
    successMessage: 'Thanks. We received your request.',
  });
  const submitClassName = String(config?.submitClassName || '').trim();
  const submitButtonClassName = `service-native-btn${submitClassName ? ` ${submitClassName}` : ''}`;

  if (submitted) {
    return (
      <div
        className="native-info-inline-form dynamic-cta-form"
        aria-label={config?.title || 'CTA form'}
        data-cta-state="success"
        data-cta-display-mode={config?.displayMode || 'default'}
        data-cta-trigger-mode={config?.triggerMode || 'default'}
      >
        <div className="dynamic-cta-form-success" role="status">
          <h5>Thank you.</h5>
          <p>{successMessage}</p>
          {salesforceUrl ? (
            <p className="dynamic-cta-form-salesforce-note">Salesforce endpoint saved for future wiring: {salesforceUrl}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className="native-info-inline-form dynamic-cta-form"
      aria-label={config?.title || 'CTA form'}
      data-cta-state="ready"
      data-cta-display-mode={config?.displayMode || 'default'}
      data-cta-trigger-mode={config?.triggerMode || 'default'}
    >
      {config?.title ? <h5>{config.title}</h5> : null}
      <form onSubmit={onSubmit} noValidate>
        {fields.map((field) => {
          const fieldId = `dynamic-cta-${field.id}`;
          const options = Array.isArray(field.options) ? field.options : [];

          if (field.type === 'multiselect') {
            const selectedValues = Array.isArray(values[field.id]) ? values[field.id] : [];
            return (
              <label key={field.id} htmlFor={fieldId}>
                {field.label}
                <select
                  id={fieldId}
                  multiple
                  size={Math.min(Math.max(options.length || 3, 3), 8)}
                  value={selectedValues}
                  onChange={(event) => {
                    const nextValues = Array.from(event.target.selectedOptions || []).map((option) => option.value);
                    onChangeField(field.id, nextValues);
                  }}
                  required={Boolean(field.required)}
                >
                  {options.map((option) => (
                    <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            );
          }

          if (field.type === 'select') {
            return (
              <label key={field.id} htmlFor={fieldId}>
                {field.label}
                <select
                  id={fieldId}
                  value={String(values[field.id] || '')}
                  onChange={(event) => onChangeField(field.id, event.target.value)}
                  required={Boolean(field.required)}
                >
                  <option value="" disabled>{field.placeholder || 'Select one'}</option>
                  {options.map((option) => (
                    <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            );
          }

          if (field.type === 'textarea') {
            return (
              <label key={field.id} htmlFor={fieldId}>
                {field.label}
                <textarea
                  id={fieldId}
                  rows={4}
                  value={values[field.id] || ''}
                  onChange={(event) => onChangeField(field.id, event.target.value)}
                  placeholder={field.placeholder || undefined}
                  required={Boolean(field.required)}
                />
              </label>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <label key={field.id} htmlFor={fieldId} className="dynamic-cta-checkbox-field">
                <span>{field.label}</span>
                <input
                  id={fieldId}
                  type="checkbox"
                  checked={Boolean(values[field.id])}
                  onChange={(event) => onChangeField(field.id, event.target.checked)}
                  required={Boolean(field.required)}
                />
              </label>
            );
          }

          return (
            <label key={field.id} htmlFor={fieldId}>
              {field.label}
              <input
                id={fieldId}
                type={field.type || 'text'}
                value={values[field.id] || ''}
                onChange={(event) => onChangeField(field.id, event.target.value)}
                placeholder={field.placeholder || undefined}
                required={Boolean(field.required)}
              />
            </label>
          );
        })}
        {config?.subtitle ? <h6>{config.subtitle}</h6> : null}
        {errorMessage ? <p className="dynamic-cta-form-error" role="alert">{errorMessage}</p> : null}
        <button type="submit" className={submitButtonClassName}>{submitLabel}</button>
      </form>
    </div>
  );
}

function DynamicRequestForm({ config }) {
  return <DynamicRequestFormSection config={config} />;
}

function DynamicNewsletterForm({ config }) {
  return (
    <div className="dynamic-newsletter-form" aria-label={config?.title || 'Newsletter signup form'}>
      <NewsletterSignupForm className="is-native-newsletter" />
    </div>
  );
}

function NativeContentForm({ config }) {
  if (!config) {
    return null;
  }
  if (config.variant === 'certificate-request') {
    return <CertificateRequestForm config={config} />;
  }
  if (config.variant === 'dynamic-cta') {
    return <DynamicCtaForm config={config} />;
  }
  if (config.variant === 'dynamic-newsletter') {
    return <DynamicNewsletterForm config={config} />;
  }
  if (config.variant === 'dynamic-request') {
    return <DynamicRequestForm config={config} />;
  }
  return <GenericNativeContentForm config={config} />;
}

function CopyAddressBlock({ config, className = '' }) {
  const [copyTip, setCopyTip] = useState('');

  useEffect(() => {
    if (!copyTip) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCopyTip(''), 1800);
    return () => window.clearTimeout(timer);
  }, [copyTip]);

  if (!config || !Array.isArray(config.lines) || !config.lines.length) {
    return null;
  }

  const title = String(config.title || '').trim();
  const lines = config.lines.map((line) => String(line || '').trim()).filter(Boolean);
  const copyText = [title, ...lines].filter(Boolean).join('\n');

  const onCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
        setCopyTip('Address copied.');
        return;
      }
      throw new Error('Clipboard unavailable');
    } catch {
      setCopyTip('Copy not available in this browser.');
    }
  };

  return (
    <div className={`native-info-copy-address${className ? ` ${className}` : ''}`}>
      <button type="button" className="native-info-copy-address-btn" onClick={onCopy}>
        {title ? <span className="native-info-copy-address-title">{title}</span> : null}
        <span className="native-info-copy-address-lines">
          {lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </button>
      <p className={`native-info-copy-address-tip${copyTip ? ' is-visible' : ''}`} aria-live="polite">
        <span className="native-info-copy-address-tip-text">
          {copyTip || 'Click address to copy'}
        </span>
      </p>
    </div>
  );
}

function ConsultantMessagePanel({ card, layout = 'toggle', onOpenChange, onSubmitMessage }) {
  const consultantName = String(card.title || '').trim() || 'Consultant';
  const firstName = firstNameFromDisplayName(consultantName);
  const consultantEmail = String(card.consultantEmail || '').trim();
  const isInline = layout === 'inline';
  const [isOpen, setIsOpen] = useState(isInline);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [values, setValues] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    if (isInline) {
      setIsOpen(true);
    }
  }, [isInline]);

  const formIdBase = consultantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const onChangeField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const trimmedName = String(values.name || '').trim();
    const trimmedEmail = String(values.email || '').trim();
    const trimmedMessage = String(values.message || '').trim();
    onSubmitMessage?.({
      pagePath: String(card.pagePath || '').trim(),
      service: String(card.service || '').trim(),
      inquiryLabel: String(card.inquiryLabel || '').trim(),
      consultantName,
      consultantEmail,
      fromName: trimmedName,
      fromEmail: trimmedEmail,
      message: trimmedMessage,
      salesforceUrl: String(card.salesforceUrl || '').trim(),
      submittedAt: new Date().toISOString(),
    });

    setWasSubmitted(true);
  };

  const setPanelOpen = (nextOpen) => {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      setWasSubmitted(false);
    }
  };

  const formUi = (
    <form className="consultant-message-form" onSubmit={onSubmit}>
      <div className="consultant-message-head">
        <p className="consultant-message-title">Message {firstName}</p>
        <button type="button" className="consultant-message-close" onClick={() => setPanelOpen(false)} aria-label={`Close message panel for ${consultantName}`}>Close</button>
      </div>
      <div className="consultant-message-row">
        <label htmlFor={`consultant-name-${formIdBase}`} className="consultant-message-label">
          <span className="consultant-message-label-text">Your name</span>
          <input
            id={`consultant-name-${formIdBase}`}
            type="text"
            value={values.name}
            onChange={(event) => onChangeField('name', event.target.value)}
            placeholder="Your name*"
            required
          />
        </label>
        <label htmlFor={`consultant-email-${formIdBase}`} className="consultant-message-label">
          <span className="consultant-message-label-text">Your email</span>
          <input
            id={`consultant-email-${formIdBase}`}
            type="email"
            value={values.email}
            onChange={(event) => onChangeField('email', event.target.value)}
            placeholder="Your email*"
            required
          />
        </label>
      </div>
      <label htmlFor={`consultant-message-${formIdBase}`} className="consultant-message-label">
        <span className="consultant-message-label-text">Message</span>
        <textarea
          id={`consultant-message-${formIdBase}`}
          value={values.message}
          onChange={(event) => onChangeField('message', event.target.value)}
          rows={4}
          placeholder="How can I help?"
          required
        />
      </label>
      <div className="consultant-message-actions">
        <button type="submit" className="service-native-btn">Send</button>
      </div>
      {wasSubmitted ? (
        <p className="consultant-message-status">
          Message captured and queued in admin for consultant follow-up.
        </p>
      ) : null}
    </form>
  );

  if (isInline) {
    return (
      <div className="consultant-message-wrap is-inline">
        {formUi}
      </div>
    );
  }

  return (
    <div className="consultant-message-wrap">
      <button
        type="button"
        className="service-native-btn consultant-message-toggle"
        aria-expanded={isOpen}
        aria-controls={`consultant-message-panel-${formIdBase}`}
        onClick={() => {
          setPanelOpen(!isOpen);
        }}
      >
        {card.messageCta || `Message ${firstName}`}
      </button>
      <div id={`consultant-message-panel-${formIdBase}`} className={`consultant-message-panel${isOpen ? ' is-open' : ''}`}>
        <div className="consultant-message-panel-inner">
          {formUi}
        </div>
      </div>
    </div>
  );
}

function renderHighlightedText(source, highlights) {
  const text = String(source || '');
  const rules = Array.isArray(highlights) ? highlights.filter(Boolean) : [];

  if (!text || !rules.length) {
    return text;
  }

  const rangeRules = rules
    .filter((item) => Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start && item.className)
    .map((item) => ({
      start: Math.max(0, Math.min(text.length, item.start)),
      end: Math.max(0, Math.min(text.length, item.end)),
      className: item.className,
    }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (rangeRules.length) {
    const pieces = [];
    let cursor = 0;
    let key = 0;
    const nextKey = (prefix) => {
      key += 1;
      return `${prefix}-${key}`;
    };

    rangeRules.forEach((rule) => {
      if (rule.start > cursor) {
        pieces.push(<span key={nextKey('t')}>{text.slice(cursor, rule.start)}</span>);
      }
      const start = Math.max(cursor, rule.start);
      const end = Math.max(start, rule.end);
      if (end > start) {
        pieces.push(
          <mark key={nextKey('m')} className={rule.className || undefined}>
            {text.slice(start, end)}
          </mark>,
        );
        cursor = end;
      }
    });

    if (cursor < text.length) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor)}</span>);
    }
    return pieces;
  }

  const textRules = rules.filter((item) => item && item.text);

  const lower = text.toLowerCase();
  const pieces = [];
  let cursor = 0;
  let key = 0;
  const nextKey = (prefix) => {
    key += 1;
    return `${prefix}-${key}`;
  };

  while (cursor < text.length) {
    let next = null;

    textRules.forEach((rule) => {
      const needle = String(rule.text).toLowerCase();
      if (!needle) {
        return;
      }
      const idx = lower.indexOf(needle, cursor);
      if (idx < 0) {
        return;
      }
      if (!next || idx < next.index) {
        next = { index: idx, rule, length: needle.length };
      }
    });

    if (!next) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor)}</span>);
      break;
    }

    if (next.index > cursor) {
      pieces.push(<span key={nextKey('t')}>{text.slice(cursor, next.index)}</span>);
    }

    pieces.push(
      <mark key={nextKey('m')} className={next.rule.className || undefined}>
        {text.slice(next.index, next.index + next.length)}
      </mark>,
    );

    cursor = next.index + next.length;
  }

  return pieces;
}

function renderTextWithStrong(source) {
  const text = String(source || '');
  if (!text.includes('**')) {
    return text;
  }

  const chunks = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return chunks.map((chunk, index) => {
    const isStrong = chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4;
    if (!isStrong) {
      return <span key={`t-${index}`}>{chunk}</span>;
    }
    return <strong key={`s-${index}`}>{chunk.slice(2, -2)}</strong>;
  });
}

function formatCurrency(value) {
  const amount = Number(value) || 0;
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function Retirement403bRateTableWidget({ rates, ratesMeta }) {
  const proxyRateRow = Array.isArray(rates)
    ? (rates.find((row) => row.id === '1-year') || rates.find((row) => row.product === '1-YEAR') || rates[0])
    : null;

  const rate = ratesMeta?.retirement403bMbaRate || proxyRateRow?.premiumRate || proxyRateRow?.standardRate || '4.000%';
  const apy = ratesMeta?.retirement403bMbaApy || proxyRateRow?.premiumApy || proxyRateRow?.standardApy || '4.07%';
  const effectiveDate = ratesMeta?.certificatesEffectiveDate || 'January 1, 2025';
  const rows = [['MBA Income Fund', rate, apy]];

  return (
    <div className="retirement-403b-rate-widget">
      <div className="native-info-table-wrap">
        <InfoTableSheet
          headers={['Investment Type', 'Rate', 'APY*']}
          rows={rows}
          valueAlignment="right"
        />
      </div>
      <p className="service-native-note">*Annual Percentage Yield</p>
      <p className="service-native-note">Effective {effectiveDate}</p>
    </div>
  );
}

function RetirementIraRateTableWidget({ iraRates, ratesMeta }) {
  const effectiveDate = ratesMeta?.iraEffectiveDate || 'January 1, 2025';

  return (
    <>
      <IraRatesSheet rates={iraRates} />
      <p className="service-native-note">*Annual Percentage Yield</p>
      <p className="service-native-note">Effective {effectiveDate}.</p>
    </>
  );
}

function MissionAssurePricingWidget({ pricing }) {
  const entries = Array.isArray(pricing?.entries) ? pricing.entries.filter(Boolean) : [];
  if (!entries.length) {
    return null;
  }

  return (
    <div className="mission-assure-pricing" aria-label="Mission Assure pricing">
      {entries.map((entry) => (
        <article
          key={`${entry.trip}-${entry.rate}`}
          className="mission-assure-pricing-card service-native-rates"
        >
          <p className="mission-assure-pricing-trip">{entry.trip}</p>
          <p className="mission-assure-pricing-rate">{entry.rate}</p>
          {entry.note ? <p className="mission-assure-pricing-note">{entry.note}</p> : null}
        </article>
      ))}
    </div>
  );
}

const FUND_IRA_EXCLUDED_STATES = {
  OH: 'This offering is not available to residents of Ohio.',
  WA: 'AGFinancial investments are not available to new investors in Washington.',
};

function getIraDocumentId(iraPrefix, variant) {
  const prefix = String(iraPrefix || '').toLowerCase();
  const map = {
    'application-simplifier': {
      traditional: 'document-ira-traditional-ira-simplifier-form',
      roth: 'document-ira-roth-ira-simplifier-form',
    },
    'transfer-request': {
      traditional: 'document-ira-traditional-ira-transfer-request-form',
      roth: 'document-ira-roth-ira-transfer-request-form',
    },
    'open-zip': {
      traditional: 'document-ira-traditional-open-ira-zip',
      roth: 'document-ira-roth-open-ira-zip',
    },
    'transfer-zip': {
      traditional: 'document-ira-traditional-transfer-ira-zip',
      roth: 'document-ira-roth-transfer-ira-zip',
    },
    'direct-rollover-zip': {
      traditional: 'document-ira-traditional-direct-rollover-ira-zip',
      roth: 'document-ira-roth-direct-rollover-ira-zip',
    },
    'indirect-rollover-zip': {
      traditional: 'document-ira-traditional-indirect-rollover-ira-zip',
      roth: 'document-ira-roth-indirect-rollover-ira-zip',
    },
  };
  return map[variant]?.[prefix] || null;
}

function getFundIraDownloadPackage(iraType, fundingOption) {
  if (!iraType || !fundingOption) {
    return null;
  }

  if (iraType === 'sep') {
    return {
      title: 'Contact a Consultant',
      actions: [{ label: 'Contact Us', to: '/services/retirement/retirement-consultants' }],
      paragraphs: ['SEP IRA funding is handled with a consultant.'],
    };
  }

  const isRoth = iraType === 'roth';
  const iraLabel = isRoth ? 'Roth IRA' : 'Traditional IRA';
  const iraPrefix = isRoth ? 'Roth' : 'Traditional';
  const mailAddress = 'AGFinancial Investments\nP.O. Box 1867\nSpringfield, MO 65801';

  const packageByOption = {
    open: {
      title: `Download and Complete the Paperwork (${iraLabel})`,
      actions: [
        {
          label: `${iraPrefix} IRA Simplifier Form*`,
          documentId: getIraDocumentId(iraPrefix, 'application-simplifier'),
        },
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
      ],
      bullets: [
        'Provide two forms of identification*',
        'Include a check payable to “AGCU”',
      ],
      noteActions: [
        {
          label: 'Download All Forms',
          documentId: getIraDocumentId(iraPrefix, 'open-zip'),
        },
      ],
    },
    contribution: {
      title: 'Complete the paperwork and send back',
      actions: [
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
      ],
      paragraphs: [
        'Include check payable to “AGCU”.',
        `Mail all paperwork to:\n${mailAddress}`,
        'If you are establishing a new account, do not forget to include your two forms of identification.',
      ],
    },
    transfer: {
      title: `Download and Complete the Paperwork (${iraLabel})`,
      actions: [
        {
          label: `${iraPrefix} IRA Simplifier Form*`,
          documentId: getIraDocumentId(iraPrefix, 'application-simplifier'),
        },
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
        {
          label: `${iraPrefix} IRA Transfer Request Form`,
          documentId: getIraDocumentId(iraPrefix, 'transfer-request'),
        },
      ],
      bullets: [
        'Provide two forms of identification*',
        'Provide your most recent IRA statement.',
      ],
      noteActions: [
        {
          label: 'Download All Forms',
          documentId: getIraDocumentId(iraPrefix, 'transfer-zip'),
        },
      ],
      paragraphs: isRoth
        ? [`Mail all paperwork to:\n${mailAddress}`, 'If you are establishing a new account, do not forget to include your two forms of identification.']
        : [],
    },
    'direct-rollover': {
      title: `Download and Complete the Paperwork (${iraLabel})`,
      actions: [
        {
          label: `${iraPrefix} IRA Simplifier Form*`,
          documentId: getIraDocumentId(iraPrefix, 'application-simplifier'),
        },
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
        {
          label: 'Direct Rollover Request Form',
          documentId: 'document-ira-direct-rollover-request-form',
        },
      ],
      bullets: [
        'Provide two forms of identification*',
        'Provide your most recent IRA statement.',
      ],
      noteActions: [
        {
          label: 'Download All Forms',
          documentId: getIraDocumentId(iraPrefix, 'direct-rollover-zip'),
        },
      ],
      paragraphs: isRoth
        ? [`Mail all paperwork to:\n${mailAddress}`, 'If you are establishing a new account, do not forget to include your two forms of identification.']
        : [],
    },
    'indirect-rollover': {
      title: `Download and Complete the Paperwork (${iraLabel})`,
      actions: [
        {
          label: `${iraPrefix} IRA Simplifier Form*`,
          documentId: getIraDocumentId(iraPrefix, 'application-simplifier'),
        },
        {
          label: 'Investment Authorization Form',
          documentId: 'document-ira-investment-authorization-form',
        },
      ],
      bullets: ['Provide two forms of identification*'],
      noteActions: [
        {
          label: 'Download All Forms',
          documentId: getIraDocumentId(iraPrefix, 'indirect-rollover-zip'),
        },
      ],
      paragraphs: isRoth
        ? [`Mail all paperwork to:\n${mailAddress}`, 'If you are establishing a new account, do not forget to include your two forms of identification.']
        : [],
    },
  };

  return packageByOption[fundingOption] || null;
}

function FundAnIraWidget() {
  const { resolveDocumentLink } = useDocuments();
  const stateOptions = useMemo(
    () => toStateOptions().sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );
  const [stateCode, setStateCode] = useState('');
  const [hasOpenedCircular, setHasOpenedCircular] = useState(false);
  const [agreedCircular, setAgreedCircular] = useState(false);
  const [iraType, setIraType] = useState('');
  const [fundingOption, setFundingOption] = useState('');

  const stateError = stateCode ? (FUND_IRA_EXCLUDED_STATES[stateCode] || '') : '';
  const isEligible = Boolean(stateCode) && !stateError;
  const step2Unlocked = isEligible;
  const step3Unlocked = step2Unlocked && agreedCircular;
  const downloadPackage = step3Unlocked ? getFundIraDownloadPackage(iraType, fundingOption) : null;
  const offeringCircularDoc = resolveDocumentLink('document-investments-aglf-offering-circular');

  const stepClassName = (step) => {
    if (step === 1) {
      return `fund-ira-step-card ${isEligible ? 'done' : 'active'}`;
    }
    if (step === 2) {
      if (!step2Unlocked) return 'fund-ira-step-card locked';
      return `fund-ira-step-card ${agreedCircular ? 'done' : 'active'}`;
    }
    if (step === 3) {
      if (!step3Unlocked) return 'fund-ira-step-card locked';
      return `fund-ira-step-card ${downloadPackage ? 'done' : 'active'}`;
    }
    if (step === 4) {
      if (!downloadPackage) return 'fund-ira-step-card locked';
      return 'fund-ira-step-card active';
    }
    return 'fund-ira-step-card';
  };

  const stepPill = (step) => {
    if (step === 1) return isEligible ? 'Complete' : 'Start';
    if (step === 2) {
      if (!step2Unlocked) return 'Locked';
      return agreedCircular ? 'Complete' : 'In progress';
    }
    if (step === 3) {
      if (!step3Unlocked) return 'Locked';
      return downloadPackage ? 'Complete' : 'In progress';
    }
    if (step === 4) return downloadPackage ? 'Ready' : 'Locked';
    return '';
  };

  const resetFollowingSteps = (resetFromStep2 = true) => {
    if (resetFromStep2) {
      setHasOpenedCircular(false);
      setAgreedCircular(false);
    }
    setIraType('');
    setFundingOption('');
  };

  return (
    <div className="fund-ira-widget">
      <div className="fund-ira-header">
        <h2>Fund an IRA</h2>
        <p>Follow the four steps below. Each step unlocks the next one once complete.</p>
      </div>

      <div className="fund-ira-grid">
        <section className={`${stepClassName(1)} is-full`}>
          <div className="fund-ira-step-heading">
            <span className="fund-ira-step-number">1</span>
            <div>
              <p className="fund-ira-step-title">Confirm eligibility</p>
              <p className="fund-ira-step-sub">Start with your state</p>
            </div>
            <span className="fund-ira-step-pill">{stepPill(1)}</span>
          </div>

          <label htmlFor="fund-ira-state" className="fund-ira-label">Select your state</label>
          <select
            id="fund-ira-state"
            className="fund-ira-select"
            value={stateCode}
            onChange={(event) => {
              const next = event.target.value;
              setStateCode(next);
              resetFollowingSteps(true);
            }}
          >
            <option value="">Select your state</option>
            {stateOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label} ({option.value})
                              </option>
            ))}
          </select>

          {stateError ? <div className="fund-ira-alert">{stateError}</div> : null}
        </section>

        <section className={`${stepClassName(2)} is-full`}>
          <div className="fund-ira-step-heading">
            <span className="fund-ira-step-number">2</span>
            <div>
              <p className="fund-ira-step-title">Review and acknowledge</p>
              <p className="fund-ira-step-sub">Download the Offering Circular</p>
            </div>
            <span className="fund-ira-step-pill">{stepPill(2)}</span>
          </div>

          <div className="fund-ira-action-row">
            <a
              href={offeringCircularDoc?.url || '/prospectus'}
              target="_blank"
              rel="noreferrer noopener"
              className="service-native-btn is-outline is-tone-atlantean"
              onClick={() => setHasOpenedCircular(true)}
            >
              View Offering Circular
            </a>
          </div>

          <label className="fund-ira-checkbox-row">
            <input
              type="checkbox"
              checked={agreedCircular}
              disabled={!step2Unlocked || !hasOpenedCircular}
              onChange={(event) => {
                const next = event.target.checked;
                setAgreedCircular(next);
                setIraType('');
                setFundingOption('');
              }}
            />
            <span>I have received and agree to the Offering Circular (download to unlock).</span>
          </label>
        </section>

        <section className={`${stepClassName(3)} is-full`}>
          <div className="fund-ira-step-heading">
            <span className="fund-ira-step-number">3</span>
            <div>
              <p className="fund-ira-step-title">Choose how you want to fund</p>
              <p className="fund-ira-step-sub">Pick IRA type and funding</p>
            </div>
            <span className="fund-ira-step-pill">{stepPill(3)}</span>
          </div>

          <label htmlFor="fund-ira-type" className="fund-ira-label">Choose IRA Type</label>
          <select
            id="fund-ira-type"
            className="fund-ira-select"
            value={iraType}
            disabled={!step3Unlocked}
            onChange={(event) => setIraType(event.target.value)}
          >
            <option value="">Select...</option>
            <option value="traditional">Traditional IRA</option>
            <option value="roth">Roth IRA</option>
            <option value="sep">SEP IRA</option>
          </select>
          <p className="fund-ira-hint">SEP IRA always routes to a consultant.</p>

          <label htmlFor="funding-option" className="fund-ira-label">Funding Option</label>
          <select
            id="funding-option"
            className="fund-ira-select"
            value={fundingOption}
            disabled={!step3Unlocked}
            onChange={(event) => setFundingOption(event.target.value)}
          >
            <option value="">Select...</option>
            <option value="open">Open</option>
            <option value="contribution">Additional Contribution</option>
            <option value="transfer">Transfer</option>
            <option value="direct-rollover">Direct Rollover</option>
            <option value="indirect-rollover">Indirect Rollover</option>
          </select>
        </section>

        <section className={`${stepClassName(4)} is-full`}>
          <div className="fund-ira-step-heading">
            <span className="fund-ira-step-number">4</span>
            <div>
              <p className="fund-ira-step-title">Download what you need</p>
              <p className="fund-ira-step-sub">Your ready-to-send packet</p>
            </div>
            <span className="fund-ira-step-pill">{stepPill(4)}</span>
          </div>

          {downloadPackage ? (
            <div className="fund-ira-downloads">
              <h3>{downloadPackage.title}</h3>

              {Array.isArray(downloadPackage.actions) && downloadPackage.actions.length ? (
                <div className="fund-ira-download-actions">
                  {downloadPackage.actions.map((item) => (
                    <Action key={`${item.label}-${item.href || item.to}`} item={item} />
                  ))}
                </div>
              ) : null}

              {Array.isArray(downloadPackage.bullets) && downloadPackage.bullets.length ? (
                <ul className="fund-ira-bullets">
                  {downloadPackage.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}

              {Array.isArray(downloadPackage.paragraphs) && downloadPackage.paragraphs.length ? (
                <div className="fund-ira-copy-stack">
                  {downloadPackage.paragraphs.map((paragraph) => (
                    <p key={paragraph}>
                      {paragraph.split('\n').map((line, index, arr) => (
                        <span key={`${paragraph}-${line}-${index}`}>
                          {line}
                          {index < arr.length - 1 ? <br /> : null}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              ) : null}

              {Array.isArray(downloadPackage.noteActions) && downloadPackage.noteActions.length ? (
                <div className="fund-ira-note-actions">
                  {downloadPackage.noteActions.map((item) => (
                    <Action key={`${item.label}-${item.href || item.to}`} item={item} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function InstitutionalInvestmentByMailFlowWidget() {
  const stateOptions = useMemo(
    () => toStateOptions().sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );
  const [stateCode, setStateCode] = useState('');
  const [investorRelationship, setInvestorRelationship] = useState('');
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState(false);
  const [hasOpenedCircular, setHasOpenedCircular] = useState(false);
  const [agreedCircular, setAgreedCircular] = useState(false);
  const [downloadsUnlocked, setDownloadsUnlocked] = useState(false);
  const [mailStepUnlocked, setMailStepUnlocked] = useState(false);

  const stateRule = getInvestmentByMailInstitutionStateRule(stateCode);
  const requiresExistingInvestorAnswer = Boolean(stateRule?.requiresExistingInvestorAnswer);
  const isOhioBlocked = stateRule?.eligibility === 'blocked';
  const isWashingtonBlocked = stateCode === 'WA' && investorRelationship === 'no';
  const isBlocked = isOhioBlocked || isWashingtonBlocked;
  const blockMessage = isOhioBlocked
    ? stateRule?.blockMessage || ''
    : (isWashingtonBlocked ? stateRule?.newInvestorBlockMessage || '' : '');
  const acknowledgmentCopy = stateRule?.eligibility === 'limited'
    ? investmentByMailInstitutionLimitedClassAcknowledgment
    : investmentByMailInstitutionStandardAcknowledgment;
  const canContinueEligibility = Boolean(stateCode) && (!requiresExistingInvestorAnswer || Boolean(investorRelationship));
  const step2Unlocked = eligibilityConfirmed && !isBlocked;
  const step3Unlocked = step2Unlocked && agreedCircular && downloadsUnlocked;
  const step4Unlocked = step3Unlocked && mailStepUnlocked;

  const { resolveDocumentLink } = useDocuments();
  const offeringCircularDoc = resolveDocumentLink(investmentByMailInstitutionDocumentIds.offeringCircular);
  const investmentFormDoc = resolveDocumentLink(investmentByMailInstitutionDocumentIds.investmentForm);

  const resetFollowOnSteps = () => {
    setEligibilityConfirmed(false);
    setHasOpenedCircular(false);
    setAgreedCircular(false);
    setDownloadsUnlocked(false);
    setMailStepUnlocked(false);
  };

  const stepClassName = (step) => {
    if (step === 1) {
      return `invest-mail-step-card ${eligibilityConfirmed || isBlocked ? 'done' : 'active'}`;
    }
    if (step === 2) {
      if (!step2Unlocked) return 'invest-mail-step-card locked';
      return `invest-mail-step-card ${downloadsUnlocked ? 'done' : 'active'}`;
    }
    if (step === 3) {
      if (!step3Unlocked) return 'invest-mail-step-card locked';
      return `invest-mail-step-card ${mailStepUnlocked ? 'done' : 'active'}`;
    }
    if (step === 4) {
      if (!step4Unlocked) return 'invest-mail-step-card locked';
      return 'invest-mail-step-card active';
    }
    return 'invest-mail-step-card';
  };

  const stepPill = (step) => {
    if (step === 1) {
      return eligibilityConfirmed || isBlocked ? 'Done' : 'Required';
    }
    if (step === 2) {
      if (!step2Unlocked) return 'Locked';
      return downloadsUnlocked ? 'Done' : 'Review';
    }
    if (step === 3) {
      if (!step3Unlocked) return 'Locked';
      return mailStepUnlocked ? 'Done' : 'Download';
    }
    if (step === 4) {
      return step4Unlocked ? 'Ready' : 'Locked';
    }
    return '';
  };

  return (
    <div className="invest-mail-widget">
      <div className="invest-mail-header">
        <h2>Open an Investment by Mail</h2>
        <p>Follow the four steps below to open an institutional investment by mail.</p>
      </div>

      <div className="invest-mail-grid">
        <section className={`${stepClassName(1)} is-full`}>
          <div className="invest-mail-step-heading">
            <span className="invest-mail-step-number">1</span>
            <div>
              <p className="invest-mail-step-title">Select Your State</p>
              <p className="invest-mail-step-sub">Confirm eligibility before downloading anything.</p>
            </div>
            <span className="invest-mail-step-pill">{stepPill(1)}</span>
          </div>

          <label htmlFor="institutional-invest-mail-state" className="invest-mail-label">Select your state</label>
          <select
            id="institutional-invest-mail-state"
            className="invest-mail-select"
            value={stateCode}
            onChange={(event) => {
              setStateCode(event.target.value);
              resetFollowOnSteps();
            }}
          >
            <option value="">Select your state</option>
            {stateOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <fieldset className="invest-mail-radio-group">
            <legend className="invest-mail-label">{investmentByMailInstitutionExistingInvestorQuestion}</legend>
            <label className="invest-mail-radio-row">
              <input
                type="radio"
                name="institutional-invest-mail-existing-investor"
                value="yes"
                checked={investorRelationship === 'yes'}
                onChange={(event) => {
                  setInvestorRelationship(event.target.value);
                  resetFollowOnSteps();
                }}
              />
              <span>Yes</span>
            </label>
            <label className="invest-mail-radio-row">
              <input
                type="radio"
                name="institutional-invest-mail-existing-investor"
                value="no"
                checked={investorRelationship === 'no'}
                onChange={(event) => {
                  setInvestorRelationship(event.target.value);
                  resetFollowOnSteps();
                }}
              />
              <span>No</span>
            </label>
          </fieldset>

          {isBlocked ? (
            <div className="invest-mail-alert" role="alert">
              <p>{blockMessage}</p>
              <div className="invest-mail-back-row">
                <Action item={{ label: 'Back to Investments', to: '/services/investments' }} />
              </div>
            </div>
          ) : null}

          {!isBlocked ? (
            <div className="invest-mail-continue-row">
              <button
                type="button"
                className="service-native-btn is-tone-atlantean"
                disabled={!canContinueEligibility}
                onClick={() => setEligibilityConfirmed(true)}
              >
                Continue
              </button>
            </div>
          ) : null}
        </section>

        {step2Unlocked ? (
          <section className={`${stepClassName(2)} is-full`}>
            <div className="invest-mail-step-heading">
              <span className="invest-mail-step-number">2</span>
              <div>
                <p className="invest-mail-step-title">Review Terms of Offering</p>
                <p className="invest-mail-step-sub">Open the Offering Circular, then acknowledge the terms.</p>
              </div>
              <span className="invest-mail-step-pill">{stepPill(2)}</span>
            </div>

            <div className="invest-mail-action-row">
              <a
                href={offeringCircularDoc?.url || '/prospectus'}
                target="_blank"
                rel="noreferrer noopener"
                className="service-native-btn is-outline is-tone-atlantean"
                onClick={() => setHasOpenedCircular(true)}
              >
                Offering Circular
              </a>
            </div>

            <label className="invest-mail-checkbox-row">
              <input
                type="checkbox"
                checked={agreedCircular}
                disabled={!hasOpenedCircular}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setAgreedCircular(checked);
                  if (!checked) {
                    setDownloadsUnlocked(false);
                    setMailStepUnlocked(false);
                  }
                }}
              />
              <span>{acknowledgmentCopy}</span>
            </label>

            <div className="invest-mail-continue-row">
              <button
                type="button"
                className="service-native-btn is-tone-atlantean"
                disabled={!agreedCircular}
                onClick={() => setDownloadsUnlocked(true)}
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step3Unlocked ? (
          <section className={`${stepClassName(3)} is-full`}>
            <div className="invest-mail-step-heading">
              <span className="invest-mail-step-number">3</span>
              <div>
                <p className="invest-mail-step-title">Download and Complete the Investment Form</p>
                <p className="invest-mail-step-sub">Use the managed document link below to get the right paperwork.</p>
              </div>
              <span className="invest-mail-step-pill">{stepPill(3)}</span>
            </div>

            <div className="invest-mail-action-row">
              <a
                href={investmentFormDoc?.url || '#'}
                target="_blank"
                rel="noreferrer noopener"
                className="service-native-btn is-outline is-tone-super-grey"
              >
                Download Form
              </a>
            </div>

            <div className="invest-mail-continue-row">
              <button
                type="button"
                className="service-native-btn is-tone-atlantean"
                onClick={() => setMailStepUnlocked(true)}
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step4Unlocked ? (
          <section className={`${stepClassName(4)} is-full`}>
            <div className="invest-mail-step-heading">
              <span className="invest-mail-step-number">4</span>
              <div>
                <p className="invest-mail-step-title">Mail Your Completed Paperwork to AGFinancial</p>
                <p className="invest-mail-step-sub">Send the full packet to the address below.</p>
              </div>
              <span className="invest-mail-step-pill">{stepPill(4)}</span>
            </div>

            <div className="invest-mail-copy-stack">
              <p>Mail all forms and paperwork to:</p>
              <p className="invest-mail-address">
                {investmentByMailInstitutionMailAddressLines.map((line, index) => (
                  <span key={line}>
                    {line}
                    {index < investmentByMailInstitutionMailAddressLines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
              <p>{investmentByMailInstitutionMailReminder}</p>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

const ENDOWMENT_RATE = 0.045;
const ENDOWMENT_SEGMENTS = [
  { key: 'cash', label: 'Cash', color: '#00a3b3' },
  { key: 'securities', label: 'Securities', color: '#22c6d3' },
  { key: 'realEstate', label: 'Real Estate', color: '#ffa400' },
  { key: 'other', label: 'Business/Other', color: '#ffcd66' },
];
const ENDOWMENT_MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const ENDOWMENT_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function parseEndowmentAmount(value) {
  return Number(String(value || '').replace(/[^\d.-]/g, '')) || 0;
}

function formatEndowmentAmount(value) {
  if (!value) {
    return '';
  }
  return ENDOWMENT_NUMBER_FORMATTER.format(value);
}

function formatEndowmentMoney(value) {
  return ENDOWMENT_MONEY_FORMATTER.format(Number(value) || 0);
}

function buildEndowmentSummary(values, totalGift, totalImpact) {
  return [
    (values.name ? `Example prepared for ${values.name}\n` : '') + 'AGFinancial Endowment Illustration',
    '===========================================',
    `Total Gift: ${formatEndowmentMoney(totalGift)}`,
    `Assumed annual distribution rate: ${(ENDOWMENT_RATE * 100).toFixed(1)}%`,
    `Estimated annual support: ${formatEndowmentMoney(totalImpact)}  (/year)`,
    `Monthly equivalent: ${formatEndowmentMoney(totalImpact / 12)}`,
    '',
    'Breakdown (annual):',
    `• Cash: ${formatEndowmentMoney(values.cash * ENDOWMENT_RATE)}`,
    `• Securities: ${formatEndowmentMoney(values.securities * ENDOWMENT_RATE)}`,
    `• Real Estate: ${formatEndowmentMoney(values.realEstate * ENDOWMENT_RATE)}`,
    `• Business/Other: ${formatEndowmentMoney(values.other * ENDOWMENT_RATE)}`,
    '',
    'Source: agfinancial.org',
    '',
    'Notes:',
    '- Principal remains invested; distributions fund ongoing support.',
    '- Illustration only. Returns and policies vary; consult AGFinancial and your advisors.',
  ].join('\n');
}

function EndowmentCalculatorWidget() {
  const baseId = useId();
  const [fields, setFields] = useState({
    cash: '10,000',
    securities: '25,000',
    realEstate: '100,000',
    other: '50,000',
    name: '',
    email: '',
    phone: '',
  });

  const amounts = useMemo(() => ({
    cash: parseEndowmentAmount(fields.cash),
    securities: parseEndowmentAmount(fields.securities),
    realEstate: parseEndowmentAmount(fields.realEstate),
    other: parseEndowmentAmount(fields.other),
  }), [fields.cash, fields.securities, fields.realEstate, fields.other]);

  const totalGift = amounts.cash + amounts.securities + amounts.realEstate + amounts.other;
  const impact = {
    cash: amounts.cash * ENDOWMENT_RATE,
    securities: amounts.securities * ENDOWMENT_RATE,
    realEstate: amounts.realEstate * ENDOWMENT_RATE,
    other: amounts.other * ENDOWMENT_RATE,
  };
  const totalImpact = impact.cash + impact.securities + impact.realEstate + impact.other;
  const emailValue = fields.email.trim();
  const phoneValue = fields.phone.trim();
  const nameValue = fields.name.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const canSubmit = Boolean(nameValue && phoneValue && isEmailValid);
  const summary = useMemo(
    () => buildEndowmentSummary({ ...amounts, name: nameValue }, totalGift, totalImpact),
    [amounts, nameValue, totalGift, totalImpact],
  );

  const updateField = (key) => (event) => {
    const { value } = event.target;
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const formatAmountField = (key) => () => {
    setFields((prev) => {
      const nextValue = formatEndowmentAmount(parseEndowmentAmount(prev[key]));
      return { ...prev, [key]: nextValue };
    });
  };

  const handleTalkToPlanner = () => {
    if (!canSubmit || typeof window === 'undefined') {
      return;
    }
    const subject = encodeURIComponent('Endowment illustration request');
    const body = encodeURIComponent(summary);
    window.location.href = `mailto:plannedgiving@agfinancial.org?subject=${subject}&body=${body}`;
  };

  const handleDownload = () => {
    if (!canSubmit || typeof window === 'undefined') {
      return;
    }
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = nameValue ? `${nameValue.replace(/[^\w-]+/g, '-')}-` : '';
    link.href = url;
    link.download = `${safeName}AGFinancial-Endowment-Illustration.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const chartSegments = ENDOWMENT_SEGMENTS.map((segment) => ({
    ...segment,
    value: impact[segment.key],
  }));
  const chartTotal = chartSegments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="endowment-calculator">
      <p className="endowment-calculator-sub">
        Enter assets you may gift. We’ll show your <em>annual ministry impact</em> from investment earnings (your principal remains invested).
      </p>

      <div className="endowment-calculator-assets">
        <div className="endowment-calculator-assets-grid">
          <label htmlFor={`${baseId}-cash`} className="endowment-calculator-field">
            <span>Cash ($)</span>
            <input
              id={`${baseId}-cash`}
              type="text"
              inputMode="numeric"
              value={fields.cash}
              onChange={updateField('cash')}
              onBlur={formatAmountField('cash')}
              className="endowment-calculator-input"
            />
            <span className="endowment-calculator-hint">Minimum guideline: 10,000</span>
          </label>
          <label htmlFor={`${baseId}-securities`} className="endowment-calculator-field">
            <span>Securities ($)</span>
            <input
              id={`${baseId}-securities`}
              type="text"
              inputMode="numeric"
              value={fields.securities}
              onChange={updateField('securities')}
              onBlur={formatAmountField('securities')}
              className="endowment-calculator-input"
            />
            <span className="endowment-calculator-hint">Restricted or marketable</span>
          </label>
          <label htmlFor={`${baseId}-realEstate`} className="endowment-calculator-field">
            <span>Real Estate ($)</span>
            <input
              id={`${baseId}-realEstate`}
              type="text"
              inputMode="numeric"
              value={fields.realEstate}
              onChange={updateField('realEstate')}
              onBlur={formatAmountField('realEstate')}
              className="endowment-calculator-input"
            />
            <span className="endowment-calculator-hint">Minimum guideline: 100,000</span>
          </label>
          <label htmlFor={`${baseId}-other`} className="endowment-calculator-field">
            <span>Business/Other ($)</span>
            <input
              id={`${baseId}-other`}
              type="text"
              inputMode="numeric"
              value={fields.other}
              onChange={updateField('other')}
              onBlur={formatAmountField('other')}
              className="endowment-calculator-input"
            />
            <span className="endowment-calculator-hint">Art, antiques, business interests…</span>
          </label>
        </div>
      </div>

      <div className="endowment-calculator-results">
        <div className="endowment-calculator-card">
          {nameValue ? (
            <div className="endowment-calculator-prepared">Example prepared for {nameValue}</div>
          ) : null}
          <div className="endowment-calculator-total">Total Gift: {formatEndowmentMoney(totalGift)}</div>
          <div className="endowment-calculator-annual">
            <span className="endowment-calculator-annual-number">{formatEndowmentMoney(totalImpact)}</span>
            <span className="endowment-calculator-annual-note"> / year — every year</span>
          </div>
          <div className="endowment-calculator-monthly">{formatEndowmentMoney(totalImpact / 12)} per month equivalent</div>
          <div className="endowment-calculator-breakdown">
            <div>• Cash: {formatEndowmentMoney(impact.cash)} / yr</div>
            <div>• Securities: {formatEndowmentMoney(impact.securities)} / yr</div>
            <div>• Real estate: {formatEndowmentMoney(impact.realEstate)} / yr</div>
            <div>• Business/Other: {formatEndowmentMoney(impact.other)} / yr</div>
          </div>
          <p className="endowment-calculator-note">
            Based on a representative annual distribution rate (4.5%). Actual results vary with markets, rates, and endowment spending policies.
          </p>
        </div>

        <div className="endowment-calculator-chart" aria-label="Annual impact breakdown chart">
          <svg viewBox="0 0 120 120" className="endowment-calculator-donut" role="img">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#e1e1e1"
              strokeWidth="18"
            />
            {chartTotal > 0 ? chartSegments.map((segment) => {
              const dash = (segment.value / chartTotal) * circumference;
              const dashArray = `${dash} ${circumference - dash}`;
              const segmentOffset = offset;
              offset += dash;
              return (
                <circle
                  key={segment.key}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth="18"
                  strokeDasharray={dashArray}
                  strokeDashoffset={-segmentOffset}
                />
              );
            }) : null}
          </svg>
          <ul className="endowment-calculator-legend">
            {chartSegments.map((segment) => (
              <li key={segment.key}>
                <span className="endowment-calculator-legend-dot" style={{ backgroundColor: segment.color }} />
                <span>{segment.label}</span>
                <span className="endowment-calculator-legend-value">{formatEndowmentMoney(segment.value)} / yr</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="endowment-calculator-form">
        <div className="endowment-calculator-contact">
          <input
            type="text"
            placeholder="Your name"
            value={fields.name}
            onChange={updateField('name')}
          />
          <input
            type="email"
            placeholder="you@example.com"
            value={fields.email}
            onChange={updateField('email')}
          />
          <input
            type="tel"
            placeholder="555-555-5555"
            value={fields.phone}
            onChange={updateField('phone')}
          />
        </div>
        <div className="endowment-calculator-actions">
          <button
            type="button"
            className="service-native-btn endowment-calculator-btn"
            onClick={handleTalkToPlanner}
            disabled={!canSubmit}
          >
            Talk with a consultant
          </button>
          <button
            type="button"
            className="service-native-btn is-outline endowment-calculator-btn"
            onClick={handleDownload}
            disabled={!canSubmit}
          >
            Download Your Example
          </button>
        </div>
      </div>

      <p className="endowment-calculator-fineprint">
        For illustrative purposes only. Assumptions reflect a generalized annual distribution rate and do not guarantee future results. Actual returns, distribution policies, fees, and spending rules vary by fund, market conditions, and timing. This material is not tax, legal, or investment advice. Consult your advisors and AGFinancial for a personalized illustration and current rates.
      </p>
    </div>
  );
}

const MINISTER_HOUSING_FIELDS = [
  ['rent', 'Rent'],
  ['down', 'Down payment'],
  ['remodel', 'Remodeling & improvements'],
  ['mortgage', 'Mortgage payments (principal + interest)'],
  ['furnish', 'Furnishings & appliances (purchase/repair)'],
  ['utils', 'Utilities (gas, water, sewer, electricity, etc.)'],
  ['ins', 'Property insurance'],
  ['taxes', 'Real estate taxes'],
  ['hoa', 'HOA dues'],
  ['repairs', 'Repairs'],
  ['maint', 'Maintenance (cleaners, bulbs, pest, yard, etc.)'],
  ['misc', 'Misc. home expenses'],
];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function MinisterHousingQuickCheckWidget() {
  const STEPS = [
    { key: 'eligibility', label: 'Eligibility' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'frv', label: 'FRV' },
    { key: 'summary', label: 'Summary' },
  ];
  const [eligibility, setEligibility] = useState({
    cred: false,
    earned: false,
    retired: false,
    primary: false,
  });
  const [expenses, setExpenses] = useState(() => Object.fromEntries(MINISTER_HOUSING_FIELDS.map(([id]) => [id, ''])));
  const [frv, setFrv] = useState('');
  const [stepIndex, setStepIndex] = useState(0);

  const totalExpenses = useMemo(
    () => MINISTER_HOUSING_FIELDS.reduce((sum, [id]) => sum + (parseFloat(expenses[id] || 0) || 0), 0),
    [expenses],
  );
  const frvValue = parseFloat(frv || 0) || 0;
  const hasBothAmounts = totalExpenses > 0 && frvValue > 0;
  const maxClaim = hasBothAmounts ? Math.min(totalExpenses, frvValue) : 0;
  const eligibilityPass = Object.values(eligibility).every(Boolean);
  const isLastStep = stepIndex === STEPS.length - 1;

  let resultMessage = 'Complete eligibility checklist and amounts to see your result.';
  let resultClass = '';
  if (!eligibilityPass) {
    resultMessage = 'Not qualified yet. Check all four eligibility items.';
    resultClass = 'is-bad';
  } else if (!hasBothAmounts) {
    resultMessage = 'Incomplete. Enter total expenses and FRV to compute the allowable amount.';
    resultClass = 'is-bad';
  } else {
    resultMessage = `You likely qualify to claim housing allowance on up to ${formatCurrency(maxClaim)} (the lesser of actual expenses or FRV).`;
    resultClass = 'is-good';
  }

  function handleSavePdf() {
    if (typeof window === 'undefined') return;

    const checkedEligibility = [
      ['Credentialed during contribution period', eligibility.cred],
      ['Income earned from ministry', eligibility.earned],
      ['Retired minister', eligibility.retired],
      ['Primary residence only', eligibility.primary],
    ];

    const expenseRows = MINISTER_HOUSING_FIELDS.map(([id, label]) => ({
      label,
      amount: Number.parseFloat(expenses[id] || 0) || 0,
    }));

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=920,height=760');
    if (!popup) return;

    const rowsHtml = expenseRows.map((row) => (
      `<tr><td>${escapeHtml(row.label)}</td><td style="text-align:right;">${escapeHtml(formatCurrency(row.amount))}</td></tr>`
    )).join('');

    const checksHtml = checkedEligibility.map(([label, passed]) => (
      `<li>${passed ? 'Yes' : 'No'} - ${escapeHtml(label)}</li>`
    )).join('');

    const nowLabel = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    popup.document.open();
    popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Minister Housing Allowance Quick Check</title>
    <style>
      body { font-family: Helvetica, Arial, sans-serif; color: #1f2937; margin: 32px; line-height: 1.45; }
      h1 { margin: 0 0 6px; font-size: 28px; color: #414042; }
      h2 { margin: 20px 0 8px; font-size: 18px; color: #006b86; }
      p { margin: 0 0 10px; }
      .muted { color: #6b7280; font-size: 13px; }
      .summary { border: 1px solid #d1d5db; border-radius: 10px; padding: 14px; margin-top: 12px; }
      .summary-row { display: flex; justify-content: space-between; gap: 16px; margin: 6px 0; }
      .summary-row strong { color: #111827; }
      .summary-row.claim { border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 10px; }
      .result { margin-top: 10px; padding: 10px; border-radius: 8px; font-weight: 600; }
      .result.good { background: #ecfeff; color: #0f766e; }
      .result.bad { background: #fff1f2; color: #be123c; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: top; }
      th { text-align: left; background: #f8fafc; }
      ul { margin: 8px 0 0 18px; padding: 0; }
      @media print { body { margin: 18px; } }
    </style>
  </head>
  <body>
    <h1>Minister's Housing Allowance Quick Check</h1>
    <p class="muted">Generated ${escapeHtml(nowLabel)}</p>
    <p class="muted">Educational estimate only. Consult your tax advisor and AGFinancial retirement consultant.</p>

    <h2>Eligibility Checklist</h2>
    <ul>${checksHtml}</ul>

    <h2>Annual Housing Expenses</h2>
    <table>
      <thead><tr><th>Expense</th><th>Amount</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>

    <div class="summary">
      <div class="summary-row"><span>Actual annual housing expenses</span><strong>${escapeHtml(formatCurrency(totalExpenses))}</strong></div>
      <div class="summary-row"><span>Actual annual FRV (home + furniture + utilities)</span><strong>${escapeHtml(formatCurrency(frvValue))}</strong></div>
      <div class="summary-row claim"><span>Maximum amount you may claim</span><strong>${escapeHtml(hasBothAmounts ? formatCurrency(maxClaim) : '$0.00')}</strong></div>
      <div class="result ${resultClass === 'is-good' ? 'good' : 'bad'}">${escapeHtml(resultMessage)}</div>
    </div>
  </body>
</html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  return (
    <div className="retirement-403b-quickcheck-widget" aria-label="Minister's Housing Allowance Quick Check">
      <div className="ret403b-qc-stepper" role="tablist" aria-label="Quick check steps">
        {STEPS.map((step, index) => (
          <button
            key={step.key}
            type="button"
            role="tab"
            aria-selected={index === stepIndex}
            className={`ret403b-qc-step${index === stepIndex ? ' is-active' : ''}${index < stepIndex ? ' is-complete' : ''}`}
            onClick={() => setStepIndex(index)}
          >
            <span className="ret403b-qc-step-num">{index + 1}</span>
            <span className="ret403b-qc-step-label">{step.label}</span>
          </button>
        ))}
      </div>

      <div className="ret403b-qc-step-meta">
        <strong>Step {stepIndex + 1} of {STEPS.length}</strong>
        <span>Minister&apos;s Housing Allowance Quick Check</span>
      </div>

      {stepIndex === 0 ? (
        <div className="ret403b-qc-card">
          <h3>Eligibility checklist</h3>
          <div className="ret403b-qc-grid">
            {[
              ['cred', 'I was credentialed during the time the contribution was made.'],
              ['earned', 'I earned the income for the contribution from ministry.'],
              ['retired', 'I am retired.'],
              ['primary', 'I am considering expenses on my primary residence only.'],
            ].map(([id, label]) => (
              <label key={id} className="ret403b-qc-check">
                <input
                  type="checkbox"
                  checked={eligibility[id]}
                  onChange={(event) => setEligibility((prev) => ({ ...prev, [id]: event.target.checked }))}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="ret403b-qc-note">These are the baseline requirements from the worksheet. You’ll see a pass/fail after you enter amounts.</p>
        </div>
      ) : null}

      {stepIndex === 1 ? (
        <div className="ret403b-qc-card">
          <h3>Annual housing expenses</h3>
          <div className="ret403b-qc-fields">
            {MINISTER_HOUSING_FIELDS.map(([id, label]) => (
              <label key={id} className="ret403b-qc-field">
                <span>{label}</span>
                <div className="ret403b-qc-money">
                  <span aria-hidden="true">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenses[id]}
                    onChange={(event) => setExpenses((prev) => ({ ...prev, [id]: event.target.value }))}
                  />
                </div>
              </label>
            ))}
          </div>
          <p className="ret403b-qc-total"><strong>Total housing expenses:</strong> <span>{formatCurrency(totalExpenses)}</span></p>
        </div>
      ) : null}

      {stepIndex === 2 ? (
        <div className="ret403b-qc-card">
          <h3>Fair rental value (FRV)</h3>
          <label className="ret403b-qc-field">
            <span>Actual annual Fair Rental Value (home + furniture + utilities)</span>
            <div className="ret403b-qc-money">
              <span aria-hidden="true">$</span>
              <input type="number" min="0" step="0.01" value={frv} onChange={(event) => setFrv(event.target.value)} />
            </div>
          </label>
          <p className="ret403b-qc-note">Enter your annual FRV estimate to compare against actual housing expenses.</p>
        </div>
      ) : null}

      {stepIndex === 3 ? (
        <div className="ret403b-qc-card">
          <h3>Summary</h3>
          <div className="ret403b-qc-summary">
            <div className="ret403b-qc-summary-row">
              <span>Actual annual housing expenses</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>
            <div className="ret403b-qc-summary-row">
              <span>Actual annual FRV (home + furniture + utilities)</span>
              <strong>{formatCurrency(frvValue)}</strong>
            </div>
            <div className="ret403b-qc-summary-row is-claim">
              <span>Maximum amount you may claim</span>
              <strong>{hasBothAmounts ? formatCurrency(maxClaim) : '$0.00'}</strong>
            </div>
            <p className={`ret403b-qc-result ${resultClass}`}>{resultMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="ret403b-qc-nav">
        <button
          type="button"
          className="action-btn action-btn-outline"
          onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
          disabled={stepIndex === 0}
        >
          Back
        </button>
        <div className="ret403b-qc-nav-status" aria-live="polite">
          {stepIndex === 0 ? (
            <span>{Object.values(eligibility).filter(Boolean).length}/4 eligibility items checked</span>
          ) : null}
          {stepIndex === 1 ? (
            <span>Expenses total: <strong>{formatCurrency(totalExpenses)}</strong></span>
          ) : null}
          {stepIndex === 2 ? (
            <span>FRV entered: <strong>{formatCurrency(frvValue)}</strong></span>
          ) : null}
          {stepIndex === 3 ? (
            <span>Review result and save a PDF if helpful.</span>
          ) : null}
        </div>
        <button
          type="button"
          className="action-btn action-btn-primary"
          onClick={() => {
            if (isLastStep) {
              setStepIndex(0);
              return;
            }
            setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
          }}
        >
          {isLastStep ? 'Start over' : 'Next'}
        </button>
      </div>

      {stepIndex === 3 ? (
        <div className="ret403b-qc-actions">
          <button type="button" className="action-btn action-btn-primary" onClick={handleSavePdf}>
            Save PDF summary
          </button>
          <button type="button" className="action-btn action-btn-outline" disabled title="Coming soon">
            Send to a consultant (coming soon)
          </button>
        </div>
      ) : null}
    </div>
  );
}


function HeroTitle({ hero }) {
  const heroLineHeight = normalizeHeroLineHeightEm(hero?.lineHeight);
  const heroLineGap = normalizeHeroLineGapEm(hero?.lineGap);
  const heroTitleSize = heroTitleSizeRemToRuntimeCss(hero?.titleSizeRem);
  const heroLetterSpacing = `${normalizeHeroTitleLetterSpacingEm(hero?.titleLetterSpacingEm)}em`;
  const heroBgTone = normalizeHeroBgTone(hero?.bgTone);
  if (Array.isArray(hero?.lines) && hero.lines.length) {
    return (
      <>
        {hero.lines.slice(0, 3).map((line, index) => {
          const lineConfig = typeof line === 'string' ? { title: line } : line;
          const lineNumber = index + 1;
          const lineClass = `line${lineNumber}`;
          const animationClass = heroAnimationClassForLine(hero?.animationPreset, lineNumber);
          const source = String(lineConfig?.title || lineConfig?.text || '');
          const highlightRules = Array.isArray(lineConfig?.highlights) && lineConfig.highlights.length
            ? lineConfig.highlights
            : (lineConfig?.highlight ? [{ text: lineConfig.highlight, className: lineConfig.highlightClass }] : []);
          const content = highlightRules.length ? renderHighlightedText(source, highlightRules) : source;
          const displayClassName = resolveHeroLineDisplayClassName(
            `${lineClass}${lineConfig?.className ? ` ${lineConfig.className}` : ''}${animationClass ? ` ${animationClass}` : ''}`,
            heroBgTone,
          );

          const lineStyle = buildHeroLineStyle({
            lineHeight: heroLineHeight,
            fontSize: heroTitleSize,
            letterSpacing: heroLetterSpacing,
            lineGap: heroLineGap,
            lineIndex: index,
          });
          return (
            <h1
              key={`${lineClass}-${source}`}
              className={displayClassName}
              style={lineStyle}
            >
              {content}
            </h1>
          );
        })}
      </>
    );
  }

  if (!hero?.highlight && !Array.isArray(hero?.highlights)) {
    return (
      <h1
        className={resolveHeroLineDisplayClassName('line1 line2', heroBgTone)}
        style={{ lineHeight: heroLineHeight, fontSize: heroTitleSize, letterSpacing: heroLetterSpacing }}
      >
        {hero?.title}
      </h1>
    );
  }

  const source = String(hero.title || '');
  const highlightRules = Array.isArray(hero.highlights) && hero.highlights.length
    ? hero.highlights
    : [{ text: hero.highlight, className: hero.highlightClass }];

  if (!highlightRules.length) {
    return <h1 className="line1 line2" style={{ lineHeight: heroLineHeight, fontSize: heroTitleSize, letterSpacing: heroLetterSpacing }}>{source}</h1>;
  }

  return (
    <h1 className={resolveHeroLineDisplayClassName('line1 line2', heroBgTone)} style={{ lineHeight: heroLineHeight, fontSize: heroTitleSize, letterSpacing: heroLetterSpacing }}>
      {renderHighlightedText(source, highlightRules)}
    </h1>
  );
}

function SearchableSupportGroups({ section }) {
  const [query, setQuery] = useState('');
  const searchId = useId();
  const groups = Array.isArray(section?.supportGroups) ? section.supportGroups : [];
  const expandItemsByDefault = Boolean(section?.supportGroupsExpanded);
  const collapsibleItems = section?.supportGroupsCollapsible !== false;

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return groups;
    }

    return groups
      .map((group) => {
        const groupLinks = Array.isArray(group?.links) ? group.links : [];
        const items = (Array.isArray(group?.items) ? group.items : []).filter((item) => {
          const linkLabels = Array.isArray(item?.links)
            ? item.links.map((entry) => String(entry?.label || '').trim()).join(' ')
            : '';
          const haystack = [
            group?.title,
            item?.question,
            item?.answer,
            linkLabels,
          ].join(' ').toLowerCase();
          return haystack.includes(needle);
        });
        const filteredGroupLinks = groupLinks.filter((entry) => {
          const haystack = [
            group?.title,
            group?.description,
            entry?.label,
          ].join(' ').toLowerCase();
          return haystack.includes(needle);
        });

        return items.length || filteredGroupLinks.length
          ? { ...group, items, links: filteredGroupLinks }
          : null;
      })
      .filter(Boolean);
  }, [groups, query]);

  const totalItems = groups.reduce(
    (count, group) => (
      count
      + (Array.isArray(group?.items) ? group.items.length : 0)
      + (Array.isArray(group?.links) ? group.links.length : 0)
    ),
    0,
  );
  const filteredCount = filteredGroups.reduce(
    (count, group) => (
      count
      + (Array.isArray(group?.items) ? group.items.length : 0)
      + (Array.isArray(group?.links) ? group.links.length : 0)
    ),
    0,
  );

  if (!groups.length) {
    return null;
  }

  return (
    <div className="native-support-library">
      <div className="native-support-library-tools">
        <label htmlFor={searchId} className="native-support-library-search">
          <span>Search support</span>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search billing, forms, travel assistance, and more"
          />
        </label>
        <p className="native-support-library-count">
          {filteredCount} of {totalItems} topics
        </p>
      </div>

      {filteredGroups.length ? (
        <div className="native-support-library-groups">
          {filteredGroups.map((group) => (
            <section key={group.title} className="native-support-library-group">
              {(() => {
                const groupItems = Array.isArray(group?.items) ? group.items : [];
                return (
                  <>
              <div className="native-support-library-group-head">
                <h3>{group.title}</h3>
              </div>
              {group.description ? <p className="native-support-library-group-description">{group.description}</p> : null}
              {Array.isArray(group.links) && group.links.length ? (
                <ul className="native-support-library-links native-support-library-group-links">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}-${link.to || link.href || link.documentId}`}>
                      <NativeLink item={link} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {groupItems.length ? (
                <div className="native-faq-list native-support-library-faq-list">
                  {groupItems.map((item) => (
                  collapsibleItems ? (
                    <details
                      key={`${group.title}-${item.question}`}
                      className="native-faq-item native-support-library-item"
                      open={expandItemsByDefault}
                    >
                      <summary>{item.question}</summary>
                      <div className="native-support-library-answer">
                        {item.answer ? <p>{item.answer}</p> : null}
                        {Array.isArray(item.links) && item.links.length ? (
                          <ul className="native-support-library-links">
                            {item.links.map((link) => (
                              <li key={`${item.question}-${link.label}-${link.to || link.href || link.documentId}`}>
                                <NativeLink item={link} />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </details>
                  ) : (
                    <div
                      key={`${group.title}-${item.question}`}
                      className="native-faq-item native-support-library-item is-static"
                    >
                      <h4 className="native-support-library-question">{item.question}</h4>
                      <div className="native-support-library-answer">
                        {item.answer ? <p>{item.answer}</p> : null}
                        {Array.isArray(item.links) && item.links.length ? (
                          <ul className="native-support-library-links">
                            {item.links.map((link) => (
                              <li key={`${item.question}-${link.label}-${link.to || link.href || link.documentId}`}>
                                <NativeLink item={link} />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  )
                  ))}
                </div>
              ) : null}
                  </>
                );
              })()}
            </section>
          ))}
        </div>
      ) : (
        <div className="native-support-library-empty">
          <p>No support topics match your search.</p>
          <button type="button" onClick={() => setQuery('')}>Reset search</button>
        </div>
      )}
    </div>
  );
}

function LegalDocumentSection({ content, page }) {
  const { resolveManagedPathFromRef } = useContentAdmin();
  const doc = content?.legalDocument || {};
  const toc = Array.isArray(doc.toc) ? doc.toc : [];

  return (
    <>
      <section className="native-functional-page-head native-functional-page-head--legal">
        <div className="ag-panel-rail">
          <h1>{doc.title || page.title}</h1>
          {doc.summary ? <p>{doc.summary}</p> : null}
        </div>
      </section>

      <section className="service-native-section native-legal-section">
        <div className="ag-panel-rail">
          <div className="native-legal-layout">
            <aside className="native-legal-sidebar" aria-label="Legal page summary">
              {doc.effectiveDate || doc.contactEmail ? (
                <div className="native-legal-meta">
                  {doc.effectiveDate ? (
                    <p>
                      <span>Revision date</span>
                      {doc.effectiveDate}
                    </p>
                  ) : null}
                  {doc.contactEmail ? (
                    <p>
                      <span>Contact</span>
                      <a href={`mailto:${doc.contactEmail}`}>{doc.contactEmail}</a>
                    </p>
                  ) : null}
                  <div className="service-native-action-row">
                    <Link to={resolveManagedPathFromRef('/contact-us', '/contact-us') || '/contact-us'} className="service-native-btn">Contact us</Link>
                  </div>
                </div>
              ) : null}

              {toc.length ? (
                <nav className="native-legal-toc" aria-label="On this page">
                  <h2>On this page</h2>
                  <ul>
                    {toc.map((item) => (
                      <li key={item.id}>
                        <a href={`#${item.id}`}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </aside>

            <article className="native-legal-article">
              <SafeRichText as="div" className="native-legal-article-inner" html={doc.html || ''} />
            </article>
          </div>
        </div>
      </section>
    </>
  );
}

export default function NativeContentPage({ page }) {
  const pageRef = useRef(null);
  const activePath = String(page?.path || '').trim();
  const templatePath = String(page?.routeKey || page?.path || '').trim();
  const resolvedPagePath = String(activePath || templatePath || '/').trim() || '/';
  const isTestPage = templatePath === '/test';
  const isLegacyGivingPage = resolvedPagePath === '/services/planned-giving';
  useNativeEnhancements(pageRef, templatePath);
  const { getConsultants } = useConsultants();
  const { getVisibleJobs } = useCareersJobs();
  const { getChartValue } = useCharts();
  const { getDisclosureValue } = useDisclosures();
  const { rates, iraRates, ratesMeta } = useRates();
  const { enabled: frontHudEnabled, opacity: frontHudOpacity } = useFrontHud();
  const {
    blocksByPath,
    authoringBlocksByPath,
    resolveManagedPathFromRef,
    resolveAuthoringManagedPathFromRef = null,
    setActiveBlockLock = () => ({ ok: false }),
    clearActiveBlockLock = () => ({ ok: false }),
    updateBlock = () => {},
    moveBlock = () => {},
    removeBlock = () => {},
    pageHierarchy,
    authoringPageHierarchy,
    getBlockCollaboration = () => null,
    devIdentity = null,
    claimBufferedBlockEdit = () => false,
    commitBlockSettingsPatch = () => false,
    registerExternalDraftFlushHandler = null,
    registerExternalDraftStatusHandler = null,
  } = useContentAdmin();
  const managedBlocksByPath = frontHudEnabled ? (authoringBlocksByPath || blocksByPath) : blocksByPath;
  const managedPageHierarchy = frontHudEnabled ? (authoringPageHierarchy || pageHierarchy) : pageHierarchy;
  const managedResolveManagedPathFromRef = frontHudEnabled
    ? (resolveAuthoringManagedPathFromRef || resolveManagedPathFromRef)
    : resolveManagedPathFromRef;
  const { addResponse } = useConsultantResponses();
  const { testimonials: testimonialsLibrary } = useTestimonials();
  const baseContent = getNativePageContent(templatePath, page.title);
  const editableBlockPath = managedBlocksByPath[activePath]
    ? activePath
    : (managedBlocksByPath[templatePath] ? templatePath : '');
  const editablePageBlocksSource = editableBlockPath ? (managedBlocksByPath[editableBlockPath] || []) : [];
  const { blocks: editablePageBlocks, stageLocalBlockSetting, stageLocalBlockSettings } = useLocalBlockDrafts({
    pathname: editableBlockPath,
    blocks: editablePageBlocksSource,
    claimBufferedBlockEdit,
    commitBlockSettingsPatch,
    registerExternalDraftFlushHandler,
    registerExternalDraftStatusHandler,
  });
  const heroLineInputRefs = useRef({ line1: null, line2: null, line3: null });
  const heroHudSectionRef = useRef(null);
  const introHudSectionRef = useRef(null);
  const dynamicHudSectionRefs = useRef({});
  const inlineCtaRevealSectionRefs = useRef({});
  const [heroActiveLine, setHeroActiveLine] = useState('');
  const [heroShowOptionalLine3, setHeroShowOptionalLine3] = useState(false);
  const [hudDockCollapsed, setHudDockCollapsed] = useState(true);
  const [activeHudPanelId, setActiveHudPanelId] = useState('');
  const [isMobileFrontHudViewport, setIsMobileFrontHudViewport] = useState(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(MOBILE_FRONT_HUD_MEDIA_QUERY).matches
      : false,
  );
  const [mobileHudMoreOpen, setMobileHudMoreOpen] = useState(false);
  const [mobileHudDeleteConfirmBlockId, setMobileHudDeleteConfirmBlockId] = useState('');

  const content = useMemo(() => {
    let nextBaseContent = baseContent;
    const pageBlocks = editablePageBlocks;
    const fullyHiddenBlockIds = collectFullyHiddenBlockIds(pageBlocks);
    const visibleBlocks = pageBlocks.filter((block) => !toBoolean(block?.hidden));
    const heroBlock = findVisibleDynamicBlockByKind(visibleBlocks, 'hero');

    if (isTestPage) {
      const introBlock = findVisibleDynamicBlockByKind(visibleBlocks, 'intro');
      const adminHero = buildTestDynamicHero(heroBlock);
      const adminIntro = buildNativeIntroConfig(introBlock, { includeTestClassName: true });
      if (adminHero) {
        nextBaseContent = {
          ...nextBaseContent,
          hero: adminHero,
        };
      }
      if (adminIntro) {
        nextBaseContent = {
          ...nextBaseContent,
          intro: adminIntro,
        };
      }
    } else {
      const adminHero = buildDynamicHeroFromBlock(heroBlock);
      if (adminHero) {
        nextBaseContent = {
          ...nextBaseContent,
          hero: {
            ...(nextBaseContent.hero || {}),
            ...adminHero,
          },
        };
      }
    }

    const consumedDynamicCtaBlockIds = new Set();
    const consumedDynamicFeaturePanelBlockIds = new Set();
    const consumedDynamicGridBlockIds = new Set();
    const consumedDynamicRequestBlockIds = new Set();
    const consumedDynamicSiteFeatureBlockIds = new Set();
    const consumedDynamicTestimonialsBlockIds = new Set();
    const consumedDynamicBillboardBlockIds = new Set();
    const targetedDynamicCtaSections = new Map();
    const targetedDynamicFeatureSections = new Map();
    const targetedDynamicGridSections = new Map();
    const targetedDynamicRequestSections = new Map();
    const targetedDynamicSiteFeatureSections = new Map();
    const targetedDynamicTestimonialsSections = new Map();
    const targetedDynamicTestimonialsFineprintSections = new Map();
    const targetedDynamicBillboardSections = new Map();

    visibleBlocks.forEach((block) => {
      const mappedSection = buildNativeBillboardSection(block, { includeTestClassName: isTestPage });
      const targetKey = String(mappedSection?.targetSectionKey || '').trim();
      if (!mappedSection || !targetKey || targetedDynamicBillboardSections.has(targetKey)) {
        return;
      }
      targetedDynamicBillboardSections.set(targetKey, { block, mappedSection });
    });

    visibleBlocks.forEach((block) => {
      const mappedSection = buildDynamicCtaSection(block, activePath);
      const targetKey = String(mappedSection?.targetSectionKey || '').trim();
      if (!mappedSection || !targetKey || targetedDynamicCtaSections.has(targetKey)) {
        return;
      }
      targetedDynamicCtaSections.set(targetKey, { block, mappedSection });
    });

    visibleBlocks.forEach((block) => {
      const mappedSection = buildDynamicGridSection(block, activePath);
      const targetKey = String(mappedSection?.targetSectionKey || '').trim();
      if (!mappedSection || !targetKey || targetedDynamicGridSections.has(targetKey)) {
        return;
      }
      targetedDynamicGridSections.set(targetKey, { block, mappedSection });
    });

    visibleBlocks.forEach((block) => {
      const mappedSection = buildDynamicFeaturePanelSection(block, activePath);
      const targetKey = String(mappedSection?.targetSectionKey || '').trim();
      if (!mappedSection || !targetKey || targetedDynamicFeatureSections.has(targetKey)) {
        return;
      }
      targetedDynamicFeatureSections.set(targetKey, { block, mappedSection });
    });

    visibleBlocks.forEach((block) => {
      const mappedSection = buildDynamicSiteFeatureSection(block, activePath);
      const targetKey = String(mappedSection?.targetSectionKey || '').trim();
      if (!mappedSection || !targetKey || targetedDynamicSiteFeatureSections.has(targetKey)) {
        return;
      }
      targetedDynamicSiteFeatureSections.set(targetKey, { block, mappedSection });
    });

    visibleBlocks.forEach((block) => {
      const mappedSection = buildDynamicRequestFormSection(block, activePath);
      const targetKey = String(mappedSection?.targetSectionKey || '').trim();
      if (!mappedSection || !targetKey || targetedDynamicRequestSections.has(targetKey)) {
        return;
      }
      targetedDynamicRequestSections.set(targetKey, { block, mappedSection });
    });

    visibleBlocks.forEach((block) => {
      const mappedSection = buildDynamicTestimonialsSection(block, activePath, testimonialsLibrary);
      const targetKey = String(mappedSection?.targetSectionKey || '').trim();
      if (mappedSection && targetKey && !targetedDynamicTestimonialsSections.has(targetKey)) {
        targetedDynamicTestimonialsSections.set(targetKey, { block, mappedSection });
      }
      const fineprintTargetKey = String(mappedSection?.targetFineprintSectionKey || '').trim();
      if (mappedSection && fineprintTargetKey && !targetedDynamicTestimonialsFineprintSections.has(fineprintTargetKey)) {
        targetedDynamicTestimonialsFineprintSections.set(fineprintTargetKey, { block, mappedSection });
      }
    });

    if (targetedDynamicBillboardSections.size && Array.isArray(nextBaseContent.sections) && nextBaseContent.sections.length) {
      nextBaseContent = {
        ...nextBaseContent,
        sections: nextBaseContent.sections.map((section, sectionIndex) => {
          const targetKey = getSectionTargetKeys(section, sectionIndex).find((key) => targetedDynamicBillboardSections.has(key));
          if (!targetKey) {
            return section;
          }

          const targetEntry = targetedDynamicBillboardSections.get(targetKey);
          consumedDynamicBillboardBlockIds.add(targetEntry.block.id);
          const mappedSection = targetEntry.mappedSection;
          const hasMappedHtml = Boolean(mappedSection.html);
          const hasMappedBody = Array.isArray(mappedSection.body) && mappedSection.body.length > 0;

          return {
            ...section,
            blockId: mappedSection.blockId || section.blockId,
            className: mergeClassNames(section.className, mappedSection.className),
            copyWrap: Object.prototype.hasOwnProperty.call(mappedSection, 'copyWrap') ? mappedSection.copyWrap : section.copyWrap,
            title: mappedSection.title || section.title,
            titleClassName: mappedSection.titleClassName || section.titleClassName,
            titleStyle: mappedSection.titleStyle || section.titleStyle,
            titleHighlights: mappedSection.titleHighlights?.length ? mappedSection.titleHighlights : section.titleHighlights,
            subtitle: mappedSection.subtitle || section.subtitle,
            subtitleClassName: mappedSection.subtitleClassName || section.subtitleClassName,
            subtitleStyle: mappedSection.subtitleStyle || section.subtitleStyle,
            html: hasMappedHtml ? mappedSection.html : (hasMappedBody ? '' : section.html),
            body: hasMappedBody ? mappedSection.body : (hasMappedHtml ? [] : section.body),
            justify: mappedSection.justify || section.justify,
            copyStyle: mappedSection.copyStyle || section.copyStyle,
            sectionStyle: {
              ...(section.sectionStyle || {}),
              ...(mappedSection.sectionStyle || {}),
            },
            railStyle: {
              ...(section.railStyle || {}),
              ...(mappedSection.railStyle || {}),
            },
            actions: mappedSection.actions?.length ? mappedSection.actions : section.actions,
          };
        }),
      };
    }

    if (targetedDynamicGridSections.size && Array.isArray(nextBaseContent.sections) && nextBaseContent.sections.length) {
      nextBaseContent = {
        ...nextBaseContent,
        sections: nextBaseContent.sections.map((section, sectionIndex) => {
          const targetKey = getSectionTargetKeys(section, sectionIndex).find((key) => targetedDynamicGridSections.has(key));
          if (!targetKey) {
            return section;
          }

          const targetEntry = targetedDynamicGridSections.get(targetKey);
          consumedDynamicGridBlockIds.add(targetEntry.block.id);
          const mappedSection = targetEntry.mappedSection;

          return {
            ...section,
            blockId: mappedSection.blockId || section.blockId,
            className: mergeClassNames(section.className, mappedSection.className),
            hideTitle: mappedSection.hideTitle,
            title: mappedSection.title || section.title,
            titleClassName: mappedSection.titleClassName || section.titleClassName,
            titleHighlights: mappedSection.titleHighlights?.length ? mappedSection.titleHighlights : section.titleHighlights,
            body: mappedSection.body?.length ? mappedSection.body : section.body,
            html: mappedSection.html || section.html,
            columns: mappedSection.columns || section.columns,
            cards: mappedSection.cards?.length ? mappedSection.cards : section.cards,
            sectionStyle: {
              ...(section.sectionStyle || {}),
              ...(mappedSection.sectionStyle || {}),
            },
          };
        }),
      };
    }

    if (targetedDynamicCtaSections.size && Array.isArray(nextBaseContent.sections) && nextBaseContent.sections.length) {
      nextBaseContent = {
        ...nextBaseContent,
        sections: nextBaseContent.sections.map((section, sectionIndex) => {
          const targetKey = getSectionTargetKeys(section, sectionIndex).find((key) => targetedDynamicCtaSections.has(key));
          if (!targetKey) {
            return section;
          }

          const targetEntry = targetedDynamicCtaSections.get(targetKey);
          consumedDynamicCtaBlockIds.add(targetEntry.block.id);
          const mappedSection = targetEntry.mappedSection;

          const baseForm = section?.form && typeof section.form === 'object' ? section.form : {};
          const mappedForm = mappedSection?.form && typeof mappedSection.form === 'object' ? mappedSection.form : null;
          const baseFields = Array.isArray(baseForm.fields) ? baseForm.fields : [];
          const mappedFields = Array.isArray(mappedForm?.fields) ? mappedForm.fields : [];
          const mergedFormFields = mappedFields.length
            ? [
                ...mappedFields,
                ...baseFields.slice(mappedFields.length),
              ]
            : baseFields;
          const baseSectionIsCtaShell = String(section?.className || '').includes('cta');
          const fallbackFormTitle = String(
            baseForm.title
            || ((section?.hideCopy || baseSectionIsCtaShell) ? (mappedSection.title || section?.title || '') : '')
            || ''
          ).trim();
          const fallbackFormSubtitle = String(
            baseForm.subtitle
            || (baseSectionIsCtaShell ? (mappedSection.subtitle || section?.subtitle || '') : '')
            || ''
          ).trim();
          const mergedForm = mappedForm
            ? {
                ...baseForm,
                ...mappedForm,
                title: String(mappedForm.title || fallbackFormTitle || '').trim(),
                subtitle: String(mappedForm.subtitle || fallbackFormSubtitle || '').trim(),
                fields: mergedFormFields.length ? mergedFormFields : baseForm.fields,
              }
            : section.form;

          return {
            ...section,
            blockId: mappedSection.blockId || section.blockId,
            title: mappedSection.title || section.title,
            titleClassName: mappedSection.titleClassName || section.titleClassName,
            titleHighlights: mappedSection.titleHighlights?.length ? mappedSection.titleHighlights : section.titleHighlights,
            html: mappedSection.html || section.html,
            form: mergedForm,
            copyWrap: Object.prototype.hasOwnProperty.call(mappedSection, 'copyWrap') ? mappedSection.copyWrap : section.copyWrap,
          };
        }),
      };
    }

    if (targetedDynamicFeatureSections.size && Array.isArray(nextBaseContent.sections) && nextBaseContent.sections.length) {
      nextBaseContent = {
        ...nextBaseContent,
        sections: nextBaseContent.sections.map((section, sectionIndex) => {
          const targetKey = getSectionTargetKeys(section, sectionIndex).find((key) => targetedDynamicFeatureSections.has(key));
          if (!targetKey) {
            return section;
          }

          const targetEntry = targetedDynamicFeatureSections.get(targetKey);
          consumedDynamicFeaturePanelBlockIds.add(targetEntry.block.id);
          const mappedSection = targetEntry.mappedSection;
          const baseFeature = section?.feature && typeof section.feature === 'object' ? section.feature : {};
          const mappedFeature = mappedSection?.feature && typeof mappedSection.feature === 'object' ? mappedSection.feature : {};

          return {
            ...section,
            blockId: mappedSection.blockId || section.blockId,
            className: mergeClassNames(section.className, mappedSection.className),
            feature: {
              ...baseFeature,
              ...mappedFeature,
              title: mappedFeature.title || baseFeature.title,
              image: mappedFeature.image || baseFeature.image,
              imageAlt: mappedFeature.imageAlt || baseFeature.imageAlt,
              body: mappedFeature.body?.length ? mappedFeature.body : baseFeature.body,
              html: mappedFeature.html || baseFeature.html,
              actions: mappedFeature.actions?.length ? mappedFeature.actions : baseFeature.actions,
              titleHighlights: mappedFeature.titleHighlights?.length ? mappedFeature.titleHighlights : baseFeature.titleHighlights,
            },
          };
        }),
      };
    }

    if (targetedDynamicSiteFeatureSections.size) {
      const mergeTargetedSiteFeatureSections = (sections = []) => (
        sections.map((section, sectionIndex) => {
          const targetKey = getSectionTargetKeys(section, sectionIndex).find((key) => targetedDynamicSiteFeatureSections.has(key));
          if (!targetKey) {
            return section;
          }

          const targetEntry = targetedDynamicSiteFeatureSections.get(targetKey);
          consumedDynamicSiteFeatureBlockIds.add(targetEntry.block.id);
          const mappedSection = targetEntry.mappedSection;

          return {
            ...section,
            blockId: mappedSection.blockId || section.blockId,
            className: mergeClassNames(section.className, mappedSection.className),
            siteFeatureRuntime: mappedSection.siteFeatureRuntime || null,
          };
        })
      );

      nextBaseContent = {
        ...nextBaseContent,
        preIntroSections: Array.isArray(nextBaseContent.preIntroSections)
          ? mergeTargetedSiteFeatureSections(nextBaseContent.preIntroSections)
          : nextBaseContent.preIntroSections,
        sections: Array.isArray(nextBaseContent.sections)
          ? mergeTargetedSiteFeatureSections(nextBaseContent.sections)
          : nextBaseContent.sections,
      };
    }

    if (targetedDynamicRequestSections.size && Array.isArray(nextBaseContent.sections) && nextBaseContent.sections.length) {
      nextBaseContent = {
        ...nextBaseContent,
        sections: nextBaseContent.sections.map((section, sectionIndex) => {
          const targetKey = getSectionTargetKeys(section, sectionIndex).find((key) => targetedDynamicRequestSections.has(key));
          if (!targetKey) {
            return section;
          }

          const targetEntry = targetedDynamicRequestSections.get(targetKey);
          consumedDynamicRequestBlockIds.add(targetEntry.block.id);
          const mappedSection = targetEntry.mappedSection;

          return {
            ...section,
            blockId: mappedSection.blockId || section.blockId,
            className: mergeClassNames(section.className, mappedSection.className),
            sectionStyle: {
              ...(section.sectionStyle || {}),
              ...(mappedSection.sectionStyle || {}),
            },
            hideCopy: Boolean(mappedSection.hideCopy),
            form: mappedSection.form || section.form,
          };
        }),
      };
    }

    if (
      (targetedDynamicTestimonialsSections.size || targetedDynamicTestimonialsFineprintSections.size)
      && Array.isArray(nextBaseContent.sections)
      && nextBaseContent.sections.length
    ) {
      nextBaseContent = {
        ...nextBaseContent,
        sections: nextBaseContent.sections.map((section, sectionIndex) => {
          const sectionKeys = getSectionTargetKeys(section, sectionIndex);
          const targetKey = sectionKeys.find((key) => targetedDynamicTestimonialsSections.has(key));
          const fineprintTargetKey = sectionKeys.find((key) => targetedDynamicTestimonialsFineprintSections.has(key));

          if (!targetKey && !fineprintTargetKey) {
            return section;
          }

          if (targetKey) {
            const targetEntry = targetedDynamicTestimonialsSections.get(targetKey);
            consumedDynamicTestimonialsBlockIds.add(targetEntry.block.id);
            const mappedSection = targetEntry.mappedSection;

            return {
              ...section,
              blockId: mappedSection.blockId || section.blockId,
              testimonials: mappedSection.testimonials || section.testimonials,
              fineprint: mappedSection.fineprint || section.fineprint,
            };
          }

          const targetEntry = targetedDynamicTestimonialsFineprintSections.get(fineprintTargetKey);
          consumedDynamicTestimonialsBlockIds.add(targetEntry.block.id);
          const mappedSection = targetEntry.mappedSection;

          return {
            ...section,
            blockId: mappedSection.blockId || section.blockId,
            fineprint: mappedSection.fineprint || section.fineprint,
          };
        }),
      };
    }

    const dynamicSections = visibleBlocks.reduce((acc, block) => {
      if (block.mode === 'dynamic' && block.kind === 'content') {
        const pageContentSection = buildDynamicPageContentSection(block, activePath);
        if (pageContentSection) {
          acc.push(pageContentSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'card_grid') {
        if (consumedDynamicGridBlockIds.has(block.id)) {
          return acc;
        }
        const gridSection = buildDynamicGridSection(block, activePath);
        if (gridSection) {
          acc.push(gridSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'columns') {
        const columnsSection = buildDynamicColumnsSection(block, activePath);
        if (columnsSection) {
          acc.push(columnsSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'newsletter') {
        const newsletterSection = buildDynamicNewsletterSection(block, activePath);
        if (newsletterSection) {
          acc.push(newsletterSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'feature_panel') {
        if (consumedDynamicFeaturePanelBlockIds.has(block.id)) {
          return acc;
        }
        const featurePanelSection = buildDynamicFeaturePanelSection(block, activePath);
        if (featurePanelSection) {
          acc.push(featurePanelSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'site_feature') {
        if (consumedDynamicSiteFeatureBlockIds.has(block.id)) {
          return acc;
        }
        const siteFeatureSection = buildDynamicSiteFeatureSection(block, activePath);
        if (siteFeatureSection) {
          acc.push(siteFeatureSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'cta_form') {
        if (consumedDynamicCtaBlockIds.has(block.id)) {
          return acc;
        }
        const ctaSection = buildDynamicCtaSection(block, activePath);
        if (ctaSection) {
          acc.push(ctaSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'request_form') {
        if (consumedDynamicRequestBlockIds.has(block.id)) {
          return acc;
        }
        const requestSection = buildDynamicRequestFormSection(block, activePath);
        if (requestSection) {
          acc.push(requestSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'testimonials') {
        if (consumedDynamicTestimonialsBlockIds.has(block.id)) {
          return acc;
        }
        const testimonialsSection = buildDynamicTestimonialsSection(block, activePath, testimonialsLibrary);
        if (testimonialsSection) {
          acc.push(testimonialsSection);
        }
        return acc;
      }

      if (block.mode === 'dynamic' && block.kind === 'billboard') {
        if (consumedDynamicBillboardBlockIds.has(block.id)) {
          return acc;
        }
        const billboardSection = buildNativeBillboardSection(block, { includeTestClassName: isTestPage });
        if (billboardSection) {
          acc.push(billboardSection);
        }
        return acc;
      }

      return acc;
    }, []);

    if (fullyHiddenBlockIds.size) {
      nextBaseContent = {
        ...nextBaseContent,
        sections: (nextBaseContent.sections || []).filter((section) => !fullyHiddenBlockIds.has(section?.id)),
      };
    }

    const retirement403bComposition = composeRetirement403bSections({
      pathname: activePath,
      baseContent: nextBaseContent,
      dynamicSections,
    });
    nextBaseContent = retirement403bComposition.nextBaseContent;
    let remainingDynamicSections = retirement403bComposition.remainingDynamicSections;

    if (remainingDynamicSections.length) {
      nextBaseContent = {
        ...nextBaseContent,
        sections: [...(nextBaseContent.sections || []), ...remainingDynamicSections],
      };
    }

    const dynamicIntroBlock = findVisibleDynamicBlockByKind(visibleBlocks, 'intro');
    const adminIntro = buildNativeIntroConfig(dynamicIntroBlock, { includeTestClassName: isTestPage });
    if (adminIntro) {
      const baseIntro = nextBaseContent?.intro;
      const baseIntroObj = baseIntro && typeof baseIntro === 'object'
        ? baseIntro
        : (baseIntro ? { body: baseIntro } : {});
      const mergedClassName = [baseIntroObj.className, adminIntro.className].filter(Boolean).join(' ').trim();
      nextBaseContent = {
        ...nextBaseContent,
        intro: {
          ...baseIntroObj,
          ...adminIntro,
          className: mergedClassName || undefined,
        },
      };
    }

    let nextSections = composeConsultantSections({
      pathname: templatePath,
      pagePath: activePath,
      sections: nextBaseContent.sections || [],
      getConsultants,
    });
    nextSections = buildCareersRouteSections({
      pathname: templatePath,
      sections: nextSections,
      getVisibleJobs,
    });

    return {
      ...nextBaseContent,
      hideHero: Boolean(nextBaseContent.hideHero) || fullyHiddenBlockIds.has('hero'),
      hideIntro: Boolean(nextBaseContent.hideIntro) || fullyHiddenBlockIds.has('intro'),
      sections: nextSections,
    };
  }, [baseContent, editablePageBlocks, activePath, getConsultants, getVisibleJobs, isTestPage, templatePath, testimonialsLibrary]);
  const contentWithManagedDisclosures = useMemo(() => ({
    ...content,
    preIntroSections: Array.isArray(content.preIntroSections)
      ? content.preIntroSections
        .map((section) => applyManagedDisclosuresToSection(section, getDisclosureValue))
        .map((section) => applyManagedChartsToSection(section, getChartValue))
      : [],
    sections: Array.isArray(content.sections)
      ? content.sections
        .map((section) => applyManagedDisclosuresToSection(section, getDisclosureValue))
        .map((section) => applyManagedChartsToSection(section, getChartValue))
      : [],
  }), [content, getChartValue, getDisclosureValue]);
  const preIntroSections = Array.isArray(contentWithManagedDisclosures.preIntroSections) ? contentWithManagedDisclosures.preIntroSections : [];
  const postIntroSections = Array.isArray(contentWithManagedDisclosures.sections) ? contentWithManagedDisclosures.sections : [];
  const sectionList = [...preIntroSections, ...postIntroSections];
  const inlineCtaRevealTargets = useMemo(() => {
    const lookup = new Map();
    const entries = sectionList
      .map((section, sectionIndex) => {
        const presentation = getInlineCtaPresentationRuntime(section);
        if (!presentation.isExternalInlineReveal) {
          return null;
        }

        const blockId = String(section?.blockId || '').trim();
        const anchorId = String(section?.anchorId || '').trim();
        const id = blockId || anchorId || `section-${sectionIndex + 1}`;
        const keys = [
          buildInlineCtaTargetKey('block', blockId),
          buildInlineCtaTargetKey('anchor', anchorId),
        ].filter(Boolean);

        if (!keys.length) {
          return null;
        }

        return {
          id,
          blockId,
          anchorId,
          sectionIndex,
          keys,
        };
      })
      .filter(Boolean);

    entries.forEach((entry) => {
      entry.keys.forEach((key) => {
        if (!lookup.has(key)) {
          lookup.set(key, entry);
        }
      });
    });

    return { entries, lookup };
  }, [sectionList]);
  const [revealedInlineCtaIds, setRevealedInlineCtaIds] = useState(() => new Set());
  const [pendingInlineCtaScrollId, setPendingInlineCtaScrollId] = useState('');
  const [locationFilters, setLocationFilters] = useState({});
  const [activeMessageCards, setActiveMessageCards] = useState({});
  const introConfig = content?.intro && typeof content.intro === 'object' ? content.intro : null;
  const introHeading = introConfig?.heading || null;
  const introHeadingHighlights = Array.isArray(introConfig?.headingHighlights) ? introConfig.headingHighlights : [];
  const introBodyHtml = normalizeHtmlContent(introConfig?.bodyHtml);
  const introParagraphs = introConfig
    ? (Array.isArray(introConfig.body) ? introConfig.body : (introConfig.body ? [introConfig.body] : []))
    : (content.intro ? [content.intro] : []);
  const introEmphasis = introConfig?.emphasis || null;
  const introEmphasisClassName = introConfig?.emphasisClassName || '';
  const introEmphasisStyle = introConfig?.emphasisStyle && typeof introConfig.emphasisStyle === 'object'
    ? introConfig.emphasisStyle
    : undefined;
  const introActions = Array.isArray(introConfig?.actions) ? introConfig.actions : [];
  const introJustify = normalizeHeroJustify(introConfig?.justify);
  const introLineSpacing = normalizeIntroLineSpacing(introConfig?.lineSpacing);
  const heroBase = content.hero || null;
  const heroLinkOptions = useMemo(() => {
    const pages = Object.values(managedPageHierarchy || {});
    return pages
      .filter((page) => !page.path.startsWith('/admin/') && page.path !== '/search' && !isPageHiddenFromSitemap(page))
      .map((page) => ({
        label: page.title || page.path,
        value: page.path,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [managedPageHierarchy]);
  const introImage = introConfig?.image || '';
  const introImageAlt = introConfig?.imageAlt || '';
  const introSplit = Boolean(introImage && introConfig?.layout === 'split');
  const pageClass = content.pageClass ? ` ${content.pageClass}` : '';
  const compactClass = content.compact ? ' is-compact' : '';
  const hideHero = Boolean(content.hideHero);
  const hideIntro = Boolean(content.hideIntro);
  const legalDoc = content?.legalDocument || null;
  const visibleEditablePageBlocks = useMemo(
    () => editablePageBlocks.filter((block) => !toBoolean(block?.hidden)),
    [editablePageBlocks],
  );
  const hudDockPanels = useMemo(
    () => buildNativeHudPanels({ blocks: visibleEditablePageBlocks }),
    [visibleEditablePageBlocks],
  );
  const hudPanelById = useMemo(() => (
    hudDockPanels.reduce((next, panel) => {
      const panelId = String(panel?.id || '').trim();
      if (panelId) {
        next[panelId] = panel;
      }
      return next;
    }, {})
  ), [hudDockPanels]);
  const hudPanelByBlockId = useMemo(() => (
    hudDockPanels.reduce((next, panel) => {
      const blockId = String(panel?.blockId || '').trim();
      if (blockId) {
        next[blockId] = panel;
      }
      return next;
    }, {})
  ), [hudDockPanels]);
  const dynamicHeroBlock = hudPanelByBlockId.hero?.block || findVisibleDynamicBlockByKind(visibleEditablePageBlocks, 'hero');
  const dynamicIntroBlock = hudPanelByBlockId.intro?.block || findVisibleDynamicBlockByKind(visibleEditablePageBlocks, 'intro');
  const dynamicTestimonialsBlock = findVisibleDynamicBlockByKind(visibleEditablePageBlocks, 'testimonials');
  const frontHudOpacityRatio = clampFrontHudOpacity(frontHudOpacity) / 100;
  const showFrontHud = frontHudEnabled && hudDockPanels.length > 0;
  const isMobileFrontHud = showFrontHud && isMobileFrontHudViewport;
  const adminHudEditPath = resolvedPagePath;
  const adminHudEditHref = `/admin/content?page=${encodeURIComponent(adminHudEditPath)}`;
  const heroInspection = useMemo(
    () => (dynamicHeroBlock ? inspectDynamicHeroSettings(adminHudEditPath, dynamicHeroBlock.settings) : null),
    [adminHudEditPath, dynamicHeroBlock],
  );
  const heroHudSettings = heroInspection?.normalizedSettings || null;
  const renderedDynamicHero = useMemo(
    () => (
      dynamicHeroBlock && heroHudSettings
        ? buildDynamicHeroFromBlock({
          ...dynamicHeroBlock,
          settings: heroHudSettings,
        })
        : null
    ),
    [dynamicHeroBlock, heroHudSettings],
  );
  const renderedHero = dynamicHeroBlock
    ? {
      ...heroBase,
      ...(renderedDynamicHero || {}),
      bgTone: renderedDynamicHero?.bgTone || heroHudSettings.bgTone,
      justify: renderedDynamicHero?.justify || heroHudSettings.justify,
      actionJustify: renderedDynamicHero?.actionJustify || heroHudSettings.actionJustify || heroBase?.actionJustify || heroHudSettings.justify,
      titleSizeRem: renderedDynamicHero?.titleSizeRem || heroHudSettings.titleSizeRem,
      titleLetterSpacingEm: renderedDynamicHero?.titleLetterSpacingEm ?? heroHudSettings.titleLetterSpacingEm,
      lineHeight: renderedDynamicHero?.lineHeight || heroHudSettings.lineHeight,
      heightMode: heroHudSettings.heightMode,
      heightSvh: heroHudSettings.heightSvh,
      actions: Array.isArray(renderedDynamicHero?.actions)
        ? renderedDynamicHero.actions.map((action) => toNativeActionItem(action)).filter(Boolean)
        : (Array.isArray(heroBase?.actions) ? heroBase.actions : []),
    }
    : heroBase;
  const renderedHeroBgTone = normalizeHeroBgTone(renderedHero?.bgTone);
  const renderedHeroJustify = normalizeHeroJustify(renderedHero?.justify);
  const heroActions = Array.isArray(renderedHero?.actions) ? renderedHero.actions : [];
  const heroActionJustify = normalizeHeroJustify(renderedHero?.actionJustify || 'center');
  const heroActionRowClass = buildActionRowClassName(heroActionJustify, 'center');
  const heroRailStyle = getHeroRailInlineStyle(renderedHero);
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
  const testimonialsHudDefaultTag = isLegacyGivingPage ? 'legacy-giving' : '';
  const testimonialsHudResolved = useMemo(
    () => resolveTestimonialsBlockData({
      block: dynamicTestimonialsBlock,
      library: testimonialsHudLibrary,
      fallbackItems: [],
      fallbackFineprint: '',
      defaultTag: testimonialsHudDefaultTag,
    }),
    [dynamicTestimonialsBlock, testimonialsHudDefaultTag, testimonialsHudLibrary],
  );
  const testimonialsHudPreviewItems = Array.isArray(testimonialsHudResolved?.items)
    ? testimonialsHudResolved.items.slice(0, 4)
    : [];
  const heroHudLineHeight = normalizeHeroLineHeightEm(heroHudSettings?.lineHeight);
  const heroHudLineGap = normalizeHeroLineGapEm(heroHudSettings?.lineGap);
  const heroHudTitleSize = heroTitleSizeRemToRuntimeCss(heroHudSettings?.titleSizeRem);
  const heroHudLetterSpacingEm = normalizeHeroTitleLetterSpacingEm(heroHudSettings?.titleLetterSpacingEm);
  const heroHudHasLine3Content = heroHudSettings ? hasDisplayableHeroLineText(heroHudSettings, 'line3') : false;
  useEffect(() => {
    if (heroHudHasLine3Content) {
      setHeroShowOptionalLine3(true);
    }
  }, [heroHudHasLine3Content]);
  const heroHudEditableLines = useMemo(() => (
    heroHudSettings
      ? resolveVisibleHeroLineKeys({
        settings: heroHudSettings,
        lineKeys: NATIVE_HERO_LINE_KEYS,
        includeOptionalLine3: heroShowOptionalLine3,
      }).map((lineKey, index) => ({
        key: lineKey,
        label: `Line ${index + 1}`,
        text: String(heroHudSettings[`${lineKey}Text`] || ''),
        className: String(
          heroHudSettings[`${lineKey}ClassName`]
          || NATIVE_HERO_LINE_CLASS_FALLBACKS[lineKey]
          || lineKey
        ).trim() || NATIVE_HERO_LINE_CLASS_FALLBACKS[lineKey] || lineKey,
        lineColor: extractHeroLineColorToken(heroHudSettings[`${lineKey}ClassName`]),
        highlights: parseHeroRangeHighlights(
          heroHudSettings[`${lineKey}HighlightsJson`],
          heroHudSettings[`${lineKey}Text`],
        ),
      }))
      : []
  ), [
    heroShowOptionalLine3,
    heroHudSettings,
  ]);
  useEffect(() => {
    if (heroInspection) {
      logHeroDriftWarningOnce(heroInspection, 'Native hero');
    }
  }, [heroInspection]);
  const heroHudPanel = dynamicHeroBlock ? (hudPanelByBlockId[dynamicHeroBlock.id] || null) : null;
  const introHudPanel = dynamicIntroBlock ? (hudPanelByBlockId[dynamicIntroBlock.id] || null) : null;
  const showHeroHud = showFrontHud && !hideHero && Boolean(heroHudPanel);
  const showIntroHud = showFrontHud && !hideIntro && Boolean(introHudPanel);
  const getOwnershipVisualForBlockId = (blockId) => {
    if (!showFrontHud || !editableBlockPath || !blockId) {
      return { className: '', overlayLabel: '', overlayDetail: '', state: 'none', isOwnedByOther: false };
    }
    return getBlockOwnershipVisual(
      getBlockCollaboration(editableBlockPath, blockId),
      devIdentity?.userId,
    );
  };
  const firstDynamicSectionIndexByBlockId = useMemo(() => {
    const firstIndexByBlock = {};
    sectionList.forEach((section, sectionIndex) => {
      const blockId = String(section?.blockId || '').trim();
      if (blockId && firstIndexByBlock[blockId] == null) {
        firstIndexByBlock[blockId] = sectionIndex;
      }
    });
    return firstIndexByBlock;
  }, [sectionList]);

  useEffect(() => {
    if (resolvedPagePath !== '/about-us' || typeof window === 'undefined') {
      return undefined;
    }

    const section = pageRef.current?.querySelector('.about-native-building-shot');
    const media = section?.querySelector('.native-columns-media');
    if (!(section instanceof HTMLElement) || !(media instanceof HTMLElement)) {
      return undefined;
    }

    let rafId = 0;
    const maxOffset = 26;

    const updateParallax = () => {
      rafId = 0;
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const sectionCenter = rect.top + (rect.height / 2);
      const viewportCenter = viewportHeight / 2;
      const normalized = Math.max(-1, Math.min(1, (viewportCenter - sectionCenter) / (viewportHeight * 0.9)));
      media.style.setProperty('--about-building-parallax-y', `${(normalized * maxOffset).toFixed(2)}px`);
    };

    const queueParallax = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(updateParallax);
    };

    queueParallax();
    window.addEventListener('scroll', queueParallax, { passive: true });
    window.addEventListener('resize', queueParallax);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      media.style.removeProperty('--about-building-parallax-y');
      window.removeEventListener('scroll', queueParallax);
      window.removeEventListener('resize', queueParallax);
    };
  }, [resolvedPagePath]);

  useEffect(() => {
    if (resolvedPagePath !== '/about-us/careers' || typeof window === 'undefined') {
      return undefined;
    }

    const root = pageRef.current;
    const benefitsSection = root?.querySelector('.careers-native-benefits');
    const readySection = root?.querySelector('.careers-native-ready');
    const benefitsHeading = benefitsSection?.querySelector('h2');
    const readyHeading = readySection?.querySelector('h2');
    if (
      !(root instanceof HTMLElement)
      || !(benefitsSection instanceof HTMLElement)
      || !(readySection instanceof HTMLElement)
      || !(benefitsHeading instanceof HTMLElement)
      || !(readyHeading instanceof HTMLElement)
    ) {
      return undefined;
    }

    let rafId = 0;

    const updateCareersSectionProgress = () => {
      rafId = 0;
      const viewportHeight = Math.max(window.innerHeight || 0, 1);
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const benefitsHeadingRect = benefitsHeading.getBoundingClientRect();
      const readyHeadingRect = readyHeading.getBoundingClientRect();
      const benefitsHeadingMid = benefitsHeadingRect.top + scrollY + (benefitsHeadingRect.height * 0.5);
      const readyHeadingMid = readyHeadingRect.top + scrollY + (readyHeadingRect.height * 0.5);
      const startY = benefitsHeadingMid - (viewportHeight * 0.5);
      const endY = readyHeadingMid - (viewportHeight * 0.5);
      const range = Math.max(endY - startY, 1);
      const progress = Math.max(0, Math.min(1, (scrollY - startY) / range));

      root.style.setProperty('--careers-benefits-ready-progress', progress.toFixed(3));
    };

    const queueCareersSectionProgress = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(updateCareersSectionProgress);
    };

    queueCareersSectionProgress();
    window.addEventListener('scroll', queueCareersSectionProgress, { passive: true });
    window.addEventListener('resize', queueCareersSectionProgress);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      root.style.removeProperty('--careers-benefits-ready-progress');
      window.removeEventListener('scroll', queueCareersSectionProgress);
      window.removeEventListener('resize', queueCareersSectionProgress);
    };
  }, [resolvedPagePath, sectionList.length]);

  useEffect(() => {
    const root = pageRef.current;
    if (!(root instanceof HTMLElement)) {
      return undefined;
    }

    const featurePanelRoots = Array.from(
      root.querySelectorAll('.service-native-section.is-cards-preset-value-cards'),
    );
    if (!featurePanelRoots.length) {
      return undefined;
    }

    const cleanups = featurePanelRoots.map((node) => setupInvestmentsGrowthRevealMotion(node, { includeBackgroundMotion: false }));
    return () => {
      cleanups.forEach((cleanup) => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    };
  }, [activePath, sectionList.length]);

  const {
    orderedPanels: orderedHudDockPanels,
    getDockTabDragProps,
    isPanelDragging,
    isPanelDragOver,
    getPanelDropPosition,
    isDockDragging,
  } = useHudDockOrder({
    panels: hudDockPanels,
    storageKey: `native:v2:${resolvedPagePath || 'page'}`,
  });
  const hasOpenHudPanel = showFrontHud && !hudDockCollapsed && Boolean(activeHudPanelId);
  const activeHudPanel = useMemo(
    () => orderedHudDockPanels.find((panel) => panel.id === activeHudPanelId) || null,
    [orderedHudDockPanels, activeHudPanelId],
  );
  const activeHudBlockId = hasOpenHudPanel ? String(activeHudPanel?.blockId || activeHudPanel?.block?.id || '').trim() : '';
  const mobileSelectedHudPanel = isMobileFrontHud && activeHudPanelId
    ? (hudPanelById[activeHudPanelId] || null)
    : null;
  const mobileSelectedHudBlock = mobileSelectedHudPanel?.block || null;
  const mobileSelectedHudBlockId = String(mobileSelectedHudBlock?.id || '').trim();
  const mobileSelectedHudBlockIndex = mobileSelectedHudBlockId
    ? editablePageBlocks.findIndex((block) => block.id === mobileSelectedHudBlockId)
    : -1;
  const canMoveMobileSelectedHudBlockUp = mobileSelectedHudBlockIndex > 0;
  const canMoveMobileSelectedHudBlockDown = mobileSelectedHudBlockIndex >= 0
    && mobileSelectedHudBlockIndex < editablePageBlocks.length - 1;
  const heroHudPanelId = heroHudPanel?.id || '';
  const introHudPanelId = introHudPanel?.id || '';
  const isHeroHudFocusTarget = hasOpenHudPanel && Boolean(heroHudPanelId) && activeHudPanelId === heroHudPanelId;
  const isIntroHudFocusTarget = hasOpenHudPanel && Boolean(introHudPanelId) && activeHudPanelId === introHudPanelId;

  const scrollElementWithNavOffset = (target, extraOffset = 8) => {
    if (!target || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const nav = document.querySelector('.site-nav');
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - extraOffset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const scrollHudPanelIntoView = (panelId) => {
    if (!panelId) {
      return;
    }
    const panel = hudPanelById[panelId] || null;
    const panelBlockId = String(panel?.blockId || panel?.block?.id || '').trim();
    const target = panelBlockId === 'hero'
      ? heroHudSectionRef.current
      : (panelBlockId === 'intro' ? introHudSectionRef.current : (dynamicHudSectionRefs.current[panelBlockId] || null));
    if (target) {
      scrollElementWithNavOffset(target);
      return;
    }
    if (typeof document === 'undefined') {
      return;
    }
    const fallbackSelector = String(panel?.anchorSelector || '').trim();
    if (!fallbackSelector) {
      return;
    }
    const fallbackTarget = document.querySelector(fallbackSelector);
    if (!fallbackTarget) {
      return;
    }
    scrollElementWithNavOffset(fallbackTarget);
  };

  useEffect(() => {
    const validIds = new Set(inlineCtaRevealTargets.entries.map((entry) => entry.id));
    setRevealedInlineCtaIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    setPendingInlineCtaScrollId((prev) => (prev && !validIds.has(prev) ? '' : prev));
  }, [inlineCtaRevealTargets]);

  useEffect(() => {
    if (!pendingInlineCtaScrollId || !revealedInlineCtaIds.has(pendingInlineCtaScrollId)) {
      return undefined;
    }

    const scrollToRevealTarget = () => {
      const target = inlineCtaRevealSectionRefs.current[pendingInlineCtaScrollId] || null;
      if (target) {
        scrollElementWithNavOffset(target, 12);
      }
      setPendingInlineCtaScrollId('');
    };

    const usesAnimationFrame = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function';
    const frameId = usesAnimationFrame
      ? window.requestAnimationFrame(scrollToRevealTarget)
      : window.setTimeout(scrollToRevealTarget, 0);

    return () => {
      if (usesAnimationFrame && typeof frameId === 'number' && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
        return;
      }
      if (!usesAnimationFrame && typeof frameId === 'number' && typeof window !== 'undefined') {
        window.clearTimeout(frameId);
      }
    };
  }, [pendingInlineCtaScrollId, revealedInlineCtaIds]);

  const revealInlineCtaTarget = (targetEntry) => {
    if (!targetEntry?.id) {
      return;
    }

    setRevealedInlineCtaIds((prev) => {
      if (prev.has(targetEntry.id)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(targetEntry.id);
      return next;
    });
    setPendingInlineCtaScrollId(targetEntry.id);
  };

  const openHudPanel = (panelId, options = {}) => {
    if (!panelId) {
      return;
    }
    setActiveHudPanelId(panelId);
    setHudDockCollapsed(false);
    if (options.scrollToTarget) {
      window.requestAnimationFrame(() => {
        scrollHudPanelIntoView(panelId);
      });
    }
  };

  const toggleHudPanel = (panelId, options = {}) => {
    if (!panelId) {
      return;
    }
    if (!hudDockCollapsed && activeHudPanelId === panelId) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      return;
    }
    openHudPanel(panelId, options);
  };

  const closeHudDock = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
  };

  const closeMobileHudPanel = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
  };

  const clearMobileHudSelection = () => {
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
  };

  useEffect(() => () => {
    const activeHudBlockId = String(activeHudPanel?.block?.id || '').trim();
    if (editableBlockPath && activeHudBlockId) {
      clearActiveBlockLock(editableBlockPath, activeHudBlockId);
    }
  }, [activeHudPanel?.block?.id, clearActiveBlockLock, editableBlockPath]);

  const selectMobileHudPanel = (panelId, options = {}) => {
    if (!isMobileFrontHud || !panelId) {
      return;
    }
    setActiveHudPanelId(panelId);
    setHudDockCollapsed(true);
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
    if (options.scrollToTarget) {
      window.requestAnimationFrame(() => {
        scrollHudPanelIntoView(panelId);
      });
    }
  };

  const handleMobilePageHudClickCapture = (event) => {
    if (!isMobileFrontHud || !showFrontHud || isMobileHudSelectionBlocked(event?.target)) {
      return;
    }
    const blockNode = event.target instanceof Element
      ? event.target.closest('[data-mobile-front-hud-selectable="true"]')
      : null;
    const blockId = String(blockNode?.getAttribute('data-block-id') || '').trim();
    if (!blockId) {
      return;
    }
    const panel = hudPanelByBlockId[blockId] || null;
    if (!panel?.id) {
      return;
    }
    const isAlreadySelected = hudDockCollapsed && activeHudPanelId === panel.id;
    if (isAlreadySelected) {
      return;
    }
    if (isMobileHudSelectionInteractiveTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
    selectMobileHudPanel(panel.id);
  };

  const isMobileHudPanelSelected = (panelId) => (
    isMobileFrontHud
    && Boolean(panelId)
    && activeHudPanelId === panelId
  );

  const isHudPanelVisible = (panelId) => (
    showFrontHud
    && !hudDockCollapsed
    && activeHudPanelId === panelId
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const media = window.matchMedia(MOBILE_FRONT_HUD_MEDIA_QUERY);
    const syncMobileHudState = () => setIsMobileFrontHudViewport(media.matches);
    syncMobileHudState();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncMobileHudState);
      return () => media.removeEventListener('change', syncMobileHudState);
    }
    media.addListener(syncMobileHudState);
    return () => media.removeListener(syncMobileHudState);
  }, []);

  useEffect(() => {
    if (!showFrontHud || !hudDockPanels.length) {
      setHudDockCollapsed(true);
      setActiveHudPanelId('');
      return;
    }
    if (!activeHudPanelId || !hudDockPanels.some((panel) => panel.id === activeHudPanelId)) {
      if (isMobileFrontHud) {
        setActiveHudPanelId('');
        return;
      }
      setActiveHudPanelId(hudDockPanels[0].id);
    }
  }, [showFrontHud, hudDockPanels, activeHudPanelId, isMobileFrontHud]);

  useEffect(() => {
    if (!isMobileFrontHud || !mobileSelectedHudBlockId || hasOpenHudPanel) {
      setMobileHudMoreOpen(false);
      setMobileHudDeleteConfirmBlockId('');
    }
  }, [hasOpenHudPanel, isMobileFrontHud, mobileSelectedHudBlockId]);

  const handleIntroBodyEditIntent = (event) => {
    if (!showIntroHud || !dynamicIntroBlock) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    openHudPanel(introHudPanelId);
  };

  const handleIntroHeadingEditIntent = (event) => {
    if (!showIntroHud || !dynamicIntroBlock) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    openHudPanel(introHudPanelId);
  };

  const handleIntroExtraLineEditIntent = (event) => {
    if (!showIntroHud || !dynamicIntroBlock) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    openHudPanel(introHudPanelId);
  };

  const handleSectionBodyEditIntent = (panelId, event) => {
    if (!showFrontHud || !panelId) {
      return;
    }
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    openHudPanel(panelId);
  };

  const handleBodyEditKeyDown = (event, onActivate) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onActivate(event);
  };

  const handleHudSetting = (block, key, value) => {
    if (!block || !editableBlockPath) {
      return;
    }
    stageLocalBlockSetting(block.id, key, value);
  };

  const handleHudSettings = (block, settingsPatch) => {
    if (!block || !editableBlockPath) {
      return;
    }
    stageLocalBlockSettings(block.id, settingsPatch);
  };

  const handleBlockLineTextChange = (block, textKey, highlightsKey, nextTextValue) => {
    if (!block || !editableBlockPath) {
      return;
    }
    const currentSettings = block.settings || {};
    const previousText = String(currentSettings[textKey] || '');
    const nextText = String(nextTextValue || '');
    handleHudSettings(block, {
      [textKey]: nextText,
      [highlightsKey]: remapHighlightsJsonForTextChange(currentSettings[highlightsKey], previousText, nextText),
    });
  };

  const setTestimonialsSelectedIds = (nextIds) => {
    if (!dynamicTestimonialsBlock) {
      return;
    }
    const normalized = parseTokenList((Array.isArray(nextIds) ? nextIds : []).join(','));
    handleHudSetting(dynamicTestimonialsBlock, 'selectedIdsCsv', normalized.join(','));
  };

  const toggleTestimonialsSelectedId = (id) => {
    const token = parseTokenList(id)[0];
    if (!token || !dynamicTestimonialsBlock) {
      return;
    }
    const nextIds = testimonialsHudSelectedIds.includes(token)
      ? testimonialsHudSelectedIds.filter((entry) => entry !== token)
      : [...testimonialsHudSelectedIds, token];
    setTestimonialsSelectedIds(nextIds);
    if (testimonialsHudSelectionMode !== 'manual') {
      handleHudSetting(dynamicTestimonialsBlock, 'selectionMode', 'manual');
    }
  };

  const setTestimonialsFilterTags = (nextTags) => {
    if (!dynamicTestimonialsBlock) {
      return;
    }
    const normalized = parseTokenList((Array.isArray(nextTags) ? nextTags : []).join(','));
    handleHudSetting(dynamicTestimonialsBlock, 'filterTagsCsv', normalized.join(','));
  };

  const toggleTestimonialsFilterTag = (tag) => {
    const token = parseTokenList(tag)[0];
    if (!token || !dynamicTestimonialsBlock) {
      return;
    }
    const nextTags = testimonialsHudFilterTags.includes(token)
      ? testimonialsHudFilterTags.filter((entry) => entry !== token)
      : [...testimonialsHudFilterTags, token];
    setTestimonialsFilterTags(nextTags);
    if (testimonialsHudSelectionMode !== 'tag') {
      handleHudSetting(dynamicTestimonialsBlock, 'selectionMode', 'tag');
    }
  };

  const handleHeroHudLineTextChange = (lineKey, nextTextValue) => {
    if (!dynamicHeroBlock || !editableBlockPath) {
      return;
    }
    if (isForeignOwnedBlockOwnership(getOwnershipVisualForBlockId(dynamicHeroBlock.id))) {
      return;
    }
    const normalizedLineKey = normalizeNativeHeroLineKey(lineKey);
    const nextText = String(nextTextValue || '');
    if (/[\r\n]/.test(nextText)) {
      const segmentsRaw = nextText
        .replaceAll('\r', '')
        .split('\n');
      const startIndex = NATIVE_HERO_LINE_KEYS.indexOf(normalizedLineKey);
      const destinationKeys = startIndex >= 0 ? NATIVE_HERO_LINE_KEYS.slice(startIndex) : [normalizedLineKey];
      const segments = destinationKeys.map((_, index) => {
        if (!segmentsRaw.length) {
          return '';
        }
        if (index === destinationKeys.length - 1 && segmentsRaw.length > destinationKeys.length) {
          return segmentsRaw.slice(index).join(' ').trim();
        }
        return String(segmentsRaw[index] || '').trim();
      });
      destinationKeys.forEach((key, index) => {
        const textKey = `${key}Text`;
        const highlightsKey = `${key}HighlightsJson`;
        handleHudSettings(dynamicHeroBlock, {
          [textKey]: segments[index] || '',
          [highlightsKey]: '',
        });
      });
      return;
    }
    const textKey = `${normalizedLineKey}Text`;
    const highlightsKey = `${normalizedLineKey}HighlightsJson`;
    handleBlockLineTextChange(dynamicHeroBlock, textKey, highlightsKey, nextText);
  };

  const handleMobileHudEdit = () => {
    if (!mobileSelectedHudPanel?.id) {
      return;
    }
    openHudPanel(mobileSelectedHudPanel.id);
  };

  const handleMobileHudMove = (direction) => {
    if (!editableBlockPath || !mobileSelectedHudBlockId) {
      return;
    }
    moveBlock(editableBlockPath, mobileSelectedHudBlockId, direction);
  };

  const handleMobileHudToggleVisibility = () => {
    if (!editableBlockPath || !mobileSelectedHudBlockId || !mobileSelectedHudBlock) {
      return;
    }
    updateBlock(editableBlockPath, mobileSelectedHudBlockId, {
      hidden: !toBoolean(mobileSelectedHudBlock.hidden),
    });
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
  };

  const handleMobileHudDelete = () => {
    if (!editableBlockPath || !mobileSelectedHudBlockId) {
      return;
    }
    if (mobileHudDeleteConfirmBlockId !== mobileSelectedHudBlockId) {
      setMobileHudDeleteConfirmBlockId(mobileSelectedHudBlockId);
      return;
    }
    removeBlock(editableBlockPath, mobileSelectedHudBlockId);
    setHudDockCollapsed(true);
    setActiveHudPanelId('');
    setMobileHudMoreOpen(false);
    setMobileHudDeleteConfirmBlockId('');
  };

  const allowOnPageClickEdit = !isMobileFrontHud;
  const showHeroInlineHudEditor = !isMobileFrontHud && shouldRenderHeroInlineEditor({
    hudEnabled: showHeroHud,
    hasDynamicHero: true,
    activeHudPanelId: hasOpenHudPanel ? activeHudPanelId : '',
    heroHudPanelId,
  });

  useEffect(() => {
    setLocationFilters({});
    setActiveMessageCards({});
  }, [activePath]);
  const inlineCtaRevealContextValue = {
    lookup: inlineCtaRevealTargets.lookup,
    onReveal: revealInlineCtaTarget,
  };

  if (templatePath === '/sitemap') {
    return (
      <NativeSitemapRouteRenderer
        pageRef={pageRef}
        compactClass={compactClass}
        pageClass={pageClass}
      />
    );
  }

  if (templatePath === '/prospectus') {
    return (
      <InlineCtaRevealContext.Provider value={inlineCtaRevealContextValue}>
        <NativeProspectusRouteRenderer
          pageRef={pageRef}
          compactClass={compactClass}
          pageClass={pageClass}
          hasOpenHudPanel={hasOpenHudPanel}
          intro={introParagraphs[0] || ''}
          actions={content.actions}
          sections={contentWithManagedDisclosures.sections}
          ActionRenderer={Action}
          NativeLinkRenderer={NativeLink}
        />
      </InlineCtaRevealContext.Provider>
    );
  }

  if (templatePath === '/forms') {
    return (
      <InlineCtaRevealContext.Provider value={inlineCtaRevealContextValue}>
        <NativeFormsRouteRenderer
          pageRef={pageRef}
          compactClass={compactClass}
          pageClass={pageClass}
          intro={introParagraphs[0] || ''}
          seedForms={content.forms}
          NativeLinkRenderer={NativeLink}
        />
      </InlineCtaRevealContext.Provider>
    );
  }

  if (legalDoc) {
    return (
      <InlineCtaRevealContext.Provider value={inlineCtaRevealContextValue}>
        <div ref={pageRef} className={`ag-page-shell service-native-page native-info-page${compactClass}${pageClass}`}>
          <LegalDocumentSection content={content} page={page} />
        </div>
      </InlineCtaRevealContext.Provider>
    );
  }

  return (
    <InlineCtaRevealContext.Provider value={inlineCtaRevealContextValue}>
      <div
        ref={pageRef}
        className={`ag-page-shell service-native-page native-info-page${compactClass}${pageClass}${showFrontHud ? ' is-front-hud-docked' : ''}${hasOpenHudPanel ? ' has-active-front-hud-panel' : ''}${isMobileFrontHud ? ' is-mobile-front-hud' : ''}${isMobileFrontHud && mobileSelectedHudPanel && hudDockCollapsed ? ' has-mobile-selected-front-hud' : ''}`}
        onClickCapture={isMobileFrontHud ? handleMobilePageHudClickCapture : undefined}
      >
      {showFrontHud && hudDockPanels.length && !isMobileFrontHud ? (
        <aside className={`admin-front-hud-dock${hudDockCollapsed ? ' is-collapsed' : ''}`} aria-label="Front HUD editor panels">
          <div className={`admin-front-hud-dock-tabs${isDockDragging ? ' is-drag-active' : ''}`}>
            {orderedHudDockPanels.map((panel) => (
              <button
                key={`dock-${panel.id}`}
                type="button"
                className={`admin-front-hud-dock-tab${!hudDockCollapsed && activeHudPanelId === panel.id ? ' is-active' : ''}${isPanelDragging(panel.id) ? ' is-dragging' : ''}${isPanelDragOver(panel.id) ? ' is-drag-over' : ''}${getPanelDropPosition(panel.id) ? ` is-drop-${getPanelDropPosition(panel.id)}` : ''}`}
                onClick={() => toggleHudPanel(panel.id, { scrollToTarget: true })}
                title={panel.label}
                aria-label={panel.label}
                {...getDockTabDragProps(panel.id)}
              >
                {panel.icon ? (
                  <img
                    src={panel.icon}
                    alt=""
                    className="admin-front-hud-dock-tab-icon"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="admin-front-hud-dock-tab-fallback" aria-hidden="true">{panel.label.slice(0, 1)}</span>
                )}
                <span className="admin-front-hud-visually-hidden">{panel.label}</span>
              </button>
            ))}
          </div>
          <div className="admin-front-hud-dock-actions">
            {!hudDockCollapsed ? (
              <button
                type="button"
                className="admin-front-hud-dock-collapse"
                onClick={closeHudDock}
                aria-label="Hide panels"
                title="Hide panels"
              >
                ×
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}
      {showFrontHud && hudDockPanels.length ? (
        <FrontHudPageWorkflow pathname={adminHudEditPath} reviewHref={adminHudEditHref} placement="bar" />
      ) : null}
      {!hideHero ? (
        <section
          ref={dynamicHeroBlock ? heroHudSectionRef : undefined}
          className={`service-native-hero is-bg-${renderedHeroBgTone} is-justify-${renderedHeroJustify}${showHeroHud ? ' has-admin-front-hud' : ''}${hasOpenHudPanel ? (isHeroHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed') : ''}${getOwnershipVisualForBlockId(dynamicHeroBlock?.id).className || ''}`}
          data-block-id={dynamicHeroBlock?.id || 'hero'}
          data-mobile-front-hud-selectable={showHeroHud && isMobileFrontHud ? 'true' : undefined}
          data-mobile-front-hud-selected={isMobileHudPanelSelected(heroHudPanelId) ? 'true' : undefined}
          data-mobile-front-hud-label={showHeroHud && isMobileFrontHud ? (heroHudPanel?.label || 'Hero') : undefined}
        >
          <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId(dynamicHeroBlock?.id)} />
          <div className="ag-panel-rail" style={heroRailStyle}>
            {showHeroInlineHudEditor ? (
              <HeroInlineLiveEditor
                lines={heroHudEditableLines}
                activeLineKey={heroActiveLine}
                fontSize={heroHudTitleSize}
                lineHeight={heroHudLineHeight}
                lineGap={heroHudLineGap}
                letterSpacing={heroHudLetterSpacingEm}
                onLineTextChange={handleHeroHudLineTextChange}
                commitOnBlurOnly
                readOnly={isForeignOwnedBlockOwnership(getOwnershipVisualForBlockId(dynamicHeroBlock?.id))}
                onLineInteract={(lineKey, interactionMeta) => {
                  openHudPanel(heroHudPanelId);
                  setHeroActiveLine(lineKey);
                }}
                setLineInputRef={(lineKey, node) => {
                  heroLineInputRefs.current[lineKey] = node;
                }}
                renderLineContent={(line) => renderHeroRangesAsNodes(line.text, line.highlights)}
                resolveLineClassName={(line, index) => (
                  resolveHeroLineDisplayClassName(
                    String(line.className || '').trim(),
                    renderedHeroBgTone,
                    `line${index + 1}`,
                  )
                )}
              />
            ) : (
              <HeroTitle hero={renderedHero || { title: page.title }} />
            )}
            {heroActions.length ? (
              <div className={heroActionRowClass}>
                {heroActions.map((item) => (
                  <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                ))}
              </div>
            ) : null}
          </div>
          {showHeroHud && !isMobileFrontHud ? (
            <FrontHudAnchorTag
              label={heroHudPanel?.label || 'Hero'}
              isActive={isHudPanelVisible(heroHudPanelId)}
              onClick={() => toggleHudPanel(heroHudPanelId, { scrollToTarget: true })}
              style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
            />
          ) : null}
        </section>
      ) : null}

      {preIntroSections.map((section, sectionIndex) => {
        const sectionKey = `${activePath}-pre-intro-${sectionIndex}-${section.title || 'section'}`;
        const sectionClassName = String(section.className || '');
        const formVariant = String(section?.form?.variant || '').trim().toLowerCase();
        const isInlineCtaSection = isInlineCtaSectionShape(section);
        const resolvedFormConfig = isInlineCtaSection
          ? {
              ...section.form,
              title: String(section.form.title || section.title || '').trim(),
              subtitle: String(section.form.subtitle || section.subtitle || '').trim(),
            }
          : section.form;
        const ctaPresentation = getInlineCtaPresentationRuntime({
          ...section,
          form: resolvedFormConfig,
        });
        const inlineCtaRevealId = String(section?.blockId || '').trim()
          || String(section?.anchorId || '').trim()
          || `section-${sectionIndex + 1}`;
        const isHiddenPendingInlineCtaReveal = ctaPresentation.isExternalInlineReveal
          && !revealedInlineCtaIds.has(inlineCtaRevealId)
          && !showFrontHud;

        if (isHiddenPendingInlineCtaReveal) {
          return null;
        }

        return (
          <section
            key={sectionKey}
            id={section.anchorId || undefined}
            ref={(node) => {
              if (ctaPresentation.isExternalInlineReveal) {
                if (node) {
                  inlineCtaRevealSectionRefs.current[inlineCtaRevealId] = node;
                } else {
                  delete inlineCtaRevealSectionRefs.current[inlineCtaRevealId];
                }
              }
            }}
            className={`service-native-section${sectionClassName ? ` ${sectionClassName}` : ''}${ctaPresentation.className ? ` ${ctaPresentation.className}` : ''}${isInlineCtaSection ? ' has-inline-cta-shell' : ''}`}
            data-cta-display-mode={isInlineCtaSection ? ctaPresentation.displayMode : undefined}
            data-cta-trigger-mode={isInlineCtaSection ? ctaPresentation.triggerMode : undefined}
            style={section.sectionStyle || undefined}
          >
            <div className={section.fullBleed ? 'ag-panel-rail-wide native-info-full-bleed' : (section.wide ? 'ag-panel-rail-wide' : 'ag-panel-rail')} style={section.railStyle || undefined}>
              {resolvedFormConfig ? <NativeContentForm config={resolvedFormConfig} /> : null}
            </div>
          </section>
        );
      })}

      {!hideIntro ? (
        <section
          ref={dynamicIntroBlock ? introHudSectionRef : undefined}
          className={`service-native-intro${introSplit ? ' is-split' : ''}${introConfig?.className ? ` ${introConfig.className}` : ''}${showIntroHud ? ' has-admin-front-hud' : ''}${hasOpenHudPanel ? (isIntroHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed') : ''}${getOwnershipVisualForBlockId(dynamicIntroBlock?.id).className || ''}`}
          data-block-id={dynamicIntroBlock?.id || 'intro'}
          data-mobile-front-hud-selectable={showIntroHud && isMobileFrontHud ? 'true' : undefined}
          data-mobile-front-hud-selected={isMobileHudPanelSelected(introHudPanelId) ? 'true' : undefined}
          data-mobile-front-hud-label={showIntroHud && isMobileFrontHud ? (introHudPanel?.label || 'Intro') : undefined}
        >
          <BlockOwnershipOverlay ownership={getOwnershipVisualForBlockId(dynamicIntroBlock?.id)} />
          <div className="ag-panel-rail">
            <div className={`service-native-intro-shell${introSplit ? ' has-media' : ''}`}>
              <div
                className={`service-native-intro-copy is-justify-${introJustify}${introConfig?.copyClassName ? ` ${introConfig.copyClassName}` : ''}`}
                style={{ '--intro-heading-line-height': String(introLineSpacing) }}
              >
                {introHeading ? (
                  <h2
                    className={`${introConfig?.headingClassName || ''}${showIntroHud && allowOnPageClickEdit ? ' admin-front-hud-click-edit-target' : ''}`.trim() || undefined}
                    onClick={showIntroHud && allowOnPageClickEdit ? handleIntroHeadingEditIntent : undefined}
                    onKeyDown={showIntroHud && allowOnPageClickEdit ? (event) => handleBodyEditKeyDown(event, handleIntroHeadingEditIntent) : undefined}
                    role={showIntroHud && allowOnPageClickEdit ? 'button' : undefined}
                    tabIndex={showIntroHud && allowOnPageClickEdit ? 0 : undefined}
                    aria-label={showIntroHud && allowOnPageClickEdit ? 'Edit intro heading' : undefined}
                  >
                    {introHeadingHighlights.length ? renderHighlightedText(introHeading, introHeadingHighlights) : introHeading}
                  </h2>
                ) : null}
                {introBodyHtml ? (
                  <SafeRichText
                    as="div"
                    className={`native-info-rich-html${showIntroHud && allowOnPageClickEdit ? ' admin-front-hud-click-edit-target' : ''}`}
                    html={introBodyHtml}
                    onClick={showIntroHud && allowOnPageClickEdit ? handleIntroBodyEditIntent : undefined}
                    onKeyDown={showIntroHud && allowOnPageClickEdit ? (event) => handleBodyEditKeyDown(event, handleIntroBodyEditIntent) : undefined}
                    role={showIntroHud && allowOnPageClickEdit ? 'button' : undefined}
                    tabIndex={showIntroHud && allowOnPageClickEdit ? 0 : undefined}
                    aria-label={showIntroHud && allowOnPageClickEdit ? 'Edit intro body HTML' : undefined}
                  />
                ) : (
                  introParagraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className={showIntroHud && allowOnPageClickEdit ? 'admin-front-hud-click-edit-target' : undefined}
                      onClick={showIntroHud && allowOnPageClickEdit ? handleIntroBodyEditIntent : undefined}
                      onKeyDown={showIntroHud && allowOnPageClickEdit ? (event) => handleBodyEditKeyDown(event, handleIntroBodyEditIntent) : undefined}
                      role={showIntroHud && allowOnPageClickEdit ? 'button' : undefined}
                      tabIndex={showIntroHud && allowOnPageClickEdit ? 0 : undefined}
                      aria-label={showIntroHud && allowOnPageClickEdit ? 'Edit intro body HTML' : undefined}
                    >
                      {renderTextWithStrong(paragraph)}
                    </p>
                  ))
                )}
                {introEmphasis ? (
                  <p
                    className={`native-info-intro-emphasis${introEmphasisClassName ? ` ${introEmphasisClassName}` : ''}${showIntroHud && allowOnPageClickEdit ? ' admin-front-hud-click-edit-target' : ''}`}
                    style={introEmphasisStyle}
                    onClick={showIntroHud && allowOnPageClickEdit ? handleIntroExtraLineEditIntent : undefined}
                    onKeyDown={showIntroHud && allowOnPageClickEdit ? (event) => handleBodyEditKeyDown(event, handleIntroExtraLineEditIntent) : undefined}
                    role={showIntroHud && allowOnPageClickEdit ? 'button' : undefined}
                    tabIndex={showIntroHud && allowOnPageClickEdit ? 0 : undefined}
                    aria-label={showIntroHud && allowOnPageClickEdit ? 'Edit intro extra line' : undefined}
                  >
                    {renderTextWithStrong(introEmphasis)}
                  </p>
                ) : null}
                {introActions.length ? (
                  <div className={buildActionRowClassName(introJustify, 'center')}>
                    {introActions.map((item) => (
                      <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                    ))}
                  </div>
                ) : null}
              </div>
              {introSplit ? (
                <figure className="service-native-intro-media">
                  <img src={introImage} alt={introImageAlt} loading="lazy" />
                </figure>
              ) : null}
            </div>
          </div>
          {showIntroHud && !isMobileFrontHud ? (
            <FrontHudAnchorTag
              label={introHudPanel?.label || 'Intro'}
              isActive={isHudPanelVisible(introHudPanelId)}
              onClick={() => toggleHudPanel(introHudPanelId, { scrollToTarget: true })}
              layerClassName="is-intro"
              anchorClassName="is-intro"
              style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
            />
          ) : null}
        </section>
      ) : null}

      {postIntroSections.map((section, sectionIndex) => {
        const globalSectionIndex = preIntroSections.length + sectionIndex;
        if (section?.hidden) {
          return null;
        }
        const cards = Array.isArray(section.cards) ? section.cards : [];
        const columnsItems = Array.isArray(section.columnsItems) ? section.columnsItems : [];
        const sectionKey = `${activePath}-${globalSectionIndex}-${section.title || 'section'}`;
        const sectionHtml = normalizeHtmlContent(section.html);
        const sectionJustifyToken = typeof section.justify === 'string' && section.justify.trim()
          ? normalizeHeroJustify(section.justify)
          : '';
        const hasLocationFilter = Boolean(section.locationFilter);
        const selectedLocation = locationFilters[sectionKey] || '';
        const locationOptions = hasLocationFilter ? getLocationOptions(section) : [];
        const requireLocationSelection = Boolean(section.locationFilter?.requireSelection);
        const focusMessageCard = Boolean(section.locationFilter?.focusMessageCard || section.focusMessageCard);
        const activeMessageCard = activeMessageCards[sectionKey] || '';
        const locationFilterLabel = hasLocationFilter
          ? (typeof section.locationFilter.label === 'string' ? section.locationFilter.label : 'Select your location')
          : '';
        const filteredCards = selectedLocation
          ? cards.filter((card) => {
            if (!Array.isArray(card.states) || !card.states.length) {
              return true;
            }
            return card.states.includes(selectedLocation);
          })
          : (requireLocationSelection ? [] : cards);
        const activeCardStillVisible = !activeMessageCard
          || filteredCards.some((card) => card.title === activeMessageCard);
        const visibleCards = focusMessageCard && activeMessageCard && activeCardStillVisible
          ? filteredCards.filter((card) => card.title === activeMessageCard)
          : filteredCards;
        const sectionClassName = String(section.className || '');
        const cardsPresetToken = String(section.cardsPreset || '').trim().toLowerCase();
        const formVariant = String(section?.form?.variant || '').trim().toLowerCase();
        const SectionLogoComponent = typeof section.logoComponent === 'function' ? section.logoComponent : null;
        const isInlineCtaSection = isInlineCtaSectionShape(section);
        const resolvedFormConfig = isInlineCtaSection
          ? {
              ...section.form,
              title: String(section.form.title || section.title || '').trim(),
              subtitle: String(section.form.subtitle || section.subtitle || '').trim(),
            }
          : section.form;
        const ctaPresentation = getInlineCtaPresentationRuntime({
          ...section,
          form: resolvedFormConfig,
        });
        const isLegacyHighlightColumns = section.columnsStyle === 'legacy-highlight';
        const showSectionCopy = !section.hideCopy && !isInlineCtaSection;
        const isValueCardsFeatureSection = cardsPresetToken === 'value-cards';
        const shouldShowValueCardsSurface = isValueCardsFeatureSection && section.cardsPresetSurface !== false;
        const shouldAnimateValueCardsTitle = isValueCardsFeatureSection && section.cardsPresetAnimateTitle !== false;
        const hasSectionCopyContent = showSectionCopy && Boolean(
          section.copyWrap
          || section.title
          || section.subtitle
          || section.leadLine
          || (Array.isArray(section.body) && section.body.length)
          || sectionHtml
          || section.followupLine
          || (Array.isArray(section.links) && section.links.length)
        );
        const hasInlineRequestShell = Boolean(
          section.form
          && typeof section.form === 'object'
          && formVariant !== 'certificate-request'
          && hasSectionCopyContent
          && !isInlineCtaSection
        );
        const hasManagedRequestShell = formVariant === 'dynamic-request';
        const hasInlineCtaShell = isInlineCtaSection;
        const isHiddenPendingInlineCtaReveal = ctaPresentation.isExternalInlineReveal
          && !revealedInlineCtaIds.has(
            String(section?.blockId || '').trim()
            || String(section?.anchorId || '').trim()
            || `section-${globalSectionIndex + 1}`
          )
          && !showFrontHud;
        const isDynamicBillboardSection = section.id === 'dynamic-billboard' || sectionClassName.includes('test-dynamic-billboard');
        const isDynamicCtaSection = sectionClassName.includes('dynamic-cta');
        const isDynamicPageContentSection = sectionClassName.includes('dynamic-page-content');
        const isDynamicRequestSection = sectionClassName.includes('native-dynamic-request');
        const dynamicSectionBlockId = String(section?.blockId || '').trim();

        if (isHiddenPendingInlineCtaReveal) {
          return null;
        }
        const dynamicSectionPanel = dynamicSectionBlockId ? (hudPanelByBlockId[dynamicSectionBlockId] || null) : null;
        const dynamicSectionHudPanelId = dynamicSectionPanel?.id || '';
        const firstDynamicSectionIndex = dynamicSectionBlockId
          ? (firstDynamicSectionIndexByBlockId[dynamicSectionBlockId] ?? -1)
          : -1;
        const isDynamicSectionHudTarget = Boolean(dynamicSectionHudPanelId) && sectionIndex === firstDynamicSectionIndex;
        const activePanelIsHeroOrIntro = hasOpenHudPanel && (
          activeHudPanelId === heroHudPanelId
          || activeHudPanelId === introHudPanelId
        );
        const activePanelUsesSectionFocus = hasOpenHudPanel && (
          !activePanelIsHeroOrIntro
          && (firstDynamicSectionIndexByBlockId[activeHudBlockId] ?? -1) >= 0
        );
        const isSectionHudFocusTarget = hasOpenHudPanel && (
          activeHudBlockId === dynamicSectionBlockId
          && isDynamicSectionHudTarget
        );
        const sectionHudFocusClass = activePanelUsesSectionFocus
          ? (isSectionHudFocusTarget ? ' is-hud-focus-target' : ' is-hud-dimmed')
          : '';
        const sectionOwnership = getOwnershipVisualForBlockId(dynamicSectionBlockId);
        const showSectionHud = showFrontHud && Boolean(dynamicSectionPanel) && isDynamicSectionHudTarget;
        const showBillboardSectionHud = isDynamicBillboardSection && showSectionHud;
        const showCtaSectionHud = isDynamicCtaSection && showSectionHud;
        const showPageContentSectionHud = isDynamicPageContentSection && showSectionHud;
        const showRequestSectionHud = isDynamicRequestSection && showSectionHud;

        if (section.siteFeatureRuntime?.runtimeKey === 'legacy_giving_stewardship_story') {
          const runtime = section.siteFeatureRuntime;

          return (
            <section
              key={sectionKey}
              id={section.anchorId || undefined}
              ref={(node) => {
                if (dynamicSectionBlockId && isDynamicSectionHudTarget) {
                  dynamicHudSectionRefs.current[dynamicSectionBlockId] = node;
                }
              }}
              className={`service-native-section${section.sand ? ' is-sand' : ''}${section.className ? ` ${section.className}` : ''} legacy-stewardship-story${showSectionHud ? ' has-admin-front-hud' : ''}${sectionHudFocusClass}${sectionOwnership.className || ''}`}
              data-block-id={dynamicSectionBlockId || undefined}
              data-mobile-front-hud-selectable={showSectionHud && isMobileFrontHud ? 'true' : undefined}
              data-mobile-front-hud-selected={isMobileHudPanelSelected(dynamicSectionHudPanelId) ? 'true' : undefined}
              data-mobile-front-hud-label={showSectionHud && isMobileFrontHud ? (dynamicSectionPanel?.label || 'Section') : undefined}
              style={section.sectionStyle || undefined}
            >
              <BlockOwnershipOverlay ownership={sectionOwnership} />
              <LegacyGivingStewardshipStoryFeature
                headline={runtime.title}
                beats={runtime.beats}
                action={runtime.action}
                resolveTo={managedResolveManagedPathFromRef}
              />
              {showSectionHud && !isMobileFrontHud ? (
                <FrontHudAnchorTag
                  label={dynamicSectionPanel?.label || 'Section'}
                  isActive={Boolean(dynamicSectionHudPanelId) && isHudPanelVisible(dynamicSectionHudPanelId)}
                  onClick={() => toggleHudPanel(dynamicSectionHudPanelId, { scrollToTarget: true })}
                  style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
                />
              ) : null}
            </section>
          );
        }

        if (section.siteFeatureRuntime?.runtimeKey === 'impact_proof_story') {
          const runtime = section.siteFeatureRuntime;

          return (
            <section
              key={sectionKey}
              id={section.anchorId || undefined}
              ref={(node) => {
                if (dynamicSectionBlockId && isDynamicSectionHudTarget) {
                  dynamicHudSectionRefs.current[dynamicSectionBlockId] = node;
                }
              }}
              className={`service-native-section${section.sand ? ' is-sand' : ''}${section.className ? ` ${section.className}` : ''}${showSectionHud ? ' has-admin-front-hud' : ''}${sectionHudFocusClass}${sectionOwnership.className || ''}`}
              data-block-id={dynamicSectionBlockId || undefined}
              data-mobile-front-hud-selectable={showSectionHud && isMobileFrontHud ? 'true' : undefined}
              data-mobile-front-hud-selected={isMobileHudPanelSelected(dynamicSectionHudPanelId) ? 'true' : undefined}
              data-mobile-front-hud-label={showSectionHud && isMobileFrontHud ? (dynamicSectionPanel?.label || 'Section') : undefined}
              style={section.sectionStyle || undefined}
            >
              <BlockOwnershipOverlay ownership={sectionOwnership} />
              <ImpactProofStoryFeature
                intro={section.featureIntro}
                headline={runtime.title}
                body={runtime.body}
                action={runtime.action}
                metrics={runtime.metrics}
                resolveTo={managedResolveManagedPathFromRef}
              />
              {showSectionHud && !isMobileFrontHud ? (
                <FrontHudAnchorTag
                  label={dynamicSectionPanel?.label || 'Section'}
                  isActive={Boolean(dynamicSectionHudPanelId) && isHudPanelVisible(dynamicSectionHudPanelId)}
                  onClick={() => toggleHudPanel(dynamicSectionHudPanelId, { scrollToTarget: true })}
                  style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
                />
              ) : null}
            </section>
          );
        }

        if (section.feature) {
          const feature = section.feature;
          const featureBody = Array.isArray(feature.body)
            ? feature.body
            : (feature.body ? [feature.body] : []);
          const featureHtml = normalizeHtmlContent(feature.html);
          const FeatureLogoComponent = typeof feature.logoComponent === 'function' ? feature.logoComponent : null;

          return (
            <section
              key={sectionKey}
              id={section.anchorId || undefined}
              ref={(node) => {
                if (dynamicSectionBlockId && isDynamicSectionHudTarget) {
                  dynamicHudSectionRefs.current[dynamicSectionBlockId] = node;
                }
              }}
              className={`service-native-section${section.sand ? ' is-sand' : ''}${section.className ? ` ${section.className}` : ''}${showSectionHud ? ' has-admin-front-hud' : ''}${sectionHudFocusClass}${sectionOwnership.className || ''}`}
              data-block-id={dynamicSectionBlockId || undefined}
              data-mobile-front-hud-selectable={showSectionHud && isMobileFrontHud ? 'true' : undefined}
              data-mobile-front-hud-selected={isMobileHudPanelSelected(dynamicSectionHudPanelId) ? 'true' : undefined}
              data-mobile-front-hud-label={showSectionHud && isMobileFrontHud ? (dynamicSectionPanel?.label || 'Section') : undefined}
              style={section.sectionStyle || undefined}
            >
              <BlockOwnershipOverlay ownership={sectionOwnership} />
              <div className={section.fullBleed ? 'ag-panel-rail-wide native-info-full-bleed' : (section.wide ? 'ag-panel-rail-wide' : 'ag-panel-rail')}>
                <div className="service-native-dark-feature">
                  <div className="service-native-dark-feature-inner">
                    <div
                      className="service-native-dark-feature-media"
                      style={feature.image ? { backgroundImage: `url(${feature.image})` } : undefined}
                      role={feature.imageAlt ? 'img' : undefined}
                      aria-label={feature.imageAlt || undefined}
                    />
                    <div className="service-native-dark-feature-copy">
                      {FeatureLogoComponent ? (
                        <FeatureLogoComponent
                          className="native-info-feature-logo"
                          decorative={!feature.logoAlt}
                          title={feature.logoAlt || 'Feature logo'}
                        />
                      ) : null}
                      {feature.logoImage ? (
                        <img
                          src={feature.logoImage}
                          alt={feature.logoAlt || ''}
                          className="native-info-feature-logo"
                        />
                      ) : null}
                      {feature.title ? (
                        <h3>
                          {Array.isArray(feature.titleHighlights) && feature.titleHighlights.length
                            ? renderHighlightedText(feature.title, feature.titleHighlights)
                            : feature.title}
                        </h3>
                      ) : null}
                      {featureBody.map((paragraph) => <p key={paragraph}>{renderTextWithStrong(paragraph)}</p>)}
                      {featureHtml ? <SafeRichText as="div" className="native-info-rich-html" html={featureHtml} /> : null}
                      {Array.isArray(feature.actions) && feature.actions.length ? (
                        <div className="service-native-action-row">
                          {feature.actions.map((item) => (
                            <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              {showSectionHud && !isMobileFrontHud ? (
                <FrontHudAnchorTag
                  label={dynamicSectionPanel?.label || 'Section'}
                  isActive={Boolean(dynamicSectionHudPanelId) && isHudPanelVisible(dynamicSectionHudPanelId)}
                  onClick={() => toggleHudPanel(dynamicSectionHudPanelId, { scrollToTarget: true })}
                  style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
                />
              ) : null}
            </section>
          );
        }

        return (
          <section
            key={sectionKey}
            id={section.anchorId || undefined}
            ref={(node) => {
              if (dynamicSectionBlockId && isDynamicSectionHudTarget) {
                dynamicHudSectionRefs.current[dynamicSectionBlockId] = node;
              }
              const inlineCtaRevealId = String(section?.blockId || '').trim()
                || String(section?.anchorId || '').trim()
                || `section-${globalSectionIndex + 1}`;
              if (ctaPresentation.isExternalInlineReveal) {
                if (node) {
                  inlineCtaRevealSectionRefs.current[inlineCtaRevealId] = node;
                } else {
                  delete inlineCtaRevealSectionRefs.current[inlineCtaRevealId];
                }
              }
            }}
            className={`service-native-section${section.sand ? ' is-sand' : ''}${section.className ? ` ${section.className}` : ''}${cardsPresetToken ? ` is-cards-preset-${cardsPresetToken}` : ''}${ctaPresentation.className ? ` ${ctaPresentation.className}` : ''}${hasInlineRequestShell ? ' has-inline-request-shell' : ''}${hasManagedRequestShell ? ' has-managed-request-shell' : ''}${hasInlineCtaShell ? ' has-inline-cta-shell' : ''}${showSectionHud ? ' has-admin-front-hud' : ''}${sectionHudFocusClass}${sectionOwnership.className || ''}`}
            data-block-id={dynamicSectionBlockId || undefined}
            data-cta-display-mode={hasInlineCtaShell ? ctaPresentation.displayMode : undefined}
            data-cta-trigger-mode={hasInlineCtaShell ? ctaPresentation.triggerMode : undefined}
            data-mobile-front-hud-selectable={showSectionHud && isMobileFrontHud ? 'true' : undefined}
            data-mobile-front-hud-selected={isMobileHudPanelSelected(dynamicSectionHudPanelId) ? 'true' : undefined}
            data-mobile-front-hud-label={showSectionHud && isMobileFrontHud ? (dynamicSectionPanel?.label || 'Section') : undefined}
            style={section.sectionStyle || undefined}
          >
            <BlockOwnershipOverlay ownership={sectionOwnership} />
            {shouldShowValueCardsSurface ? (
              <div className="investments-native-growth-surface native-columns-growth-surface" aria-hidden="true">
                <div className="investments-native-growth-surface-layer is-blue" />
                <div className="investments-native-growth-surface-layer is-mango" />
                <div className="investments-native-growth-surface-layer is-sand" />
                <div className="investments-native-growth-surface-layer is-white" />
              </div>
            ) : null}
            <div
              className={section.fullBleed ? 'ag-panel-rail-wide native-info-full-bleed' : (section.wide ? 'ag-panel-rail-wide' : 'ag-panel-rail')}
              style={section.railStyle || undefined}
            >
            {SectionLogoComponent ? (
              <SectionLogoComponent
                className="native-info-section-logo"
                decorative={!section.logoAlt}
                title={section.logoAlt || 'Section logo'}
              />
            ) : null}
            {section.logoImage ? (
              <img
                src={section.logoImage}
                alt={section.logoAlt || ''}
                className="native-info-section-logo"
              />
            ) : null}
            {!SectionLogoComponent && !section.logoImage && section.logoText ? (
              <p className="native-info-section-logo-text">{section.logoText}</p>
            ) : null}
            {showSectionCopy ? (
              section.copyWrap ? (
                <div
                  className={`native-info-section-copy${section.copyClassName ? ` ${section.copyClassName}` : ''}${sectionJustifyToken ? ` is-justify-${sectionJustifyToken}` : ''}`}
                  style={section.copyStyle || undefined}
                  data-fade-root-margin={section.copyFadeRootMargin || undefined}
                >
                  {!section.hideTitle ? (
                    <h2
                      className={[
                        section.titleClassName || '',
                        shouldAnimateValueCardsTitle ? 'investments-native-build-title investments-growth-scroll-reveal investments-growth-scroll-reveal-title' : '',
                      ].filter(Boolean).join(' ') || undefined}
                      style={section.titleStyle || undefined}
                      data-investments-growth-reveal={shouldAnimateValueCardsTitle ? 'title' : undefined}
                      data-investments-growth-start-vh={shouldAnimateValueCardsTitle ? '0.98' : undefined}
                      data-investments-growth-end-vh={shouldAnimateValueCardsTitle ? '0.48' : undefined}
                      data-investments-growth-anchor-ratio={shouldAnimateValueCardsTitle ? '0.22' : undefined}
                      data-investments-growth-anchor-max-px={shouldAnimateValueCardsTitle ? '120' : undefined}
                      data-investments-growth-min-opacity={shouldAnimateValueCardsTitle ? '0.24' : undefined}
                      data-investments-growth-base-scale={shouldAnimateValueCardsTitle ? '0.945' : undefined}
                      data-investments-growth-shift-y={shouldAnimateValueCardsTitle ? '34' : undefined}
                    >
                      {renderHighlightedText(section.title, section.titleHighlights)}
                    </h2>
                  ) : null}
                  {section.subtitle ? (
                    <h3
                      className={['native-info-section-subtitle', section.subtitleClassName || ''].filter(Boolean).join(' ')}
                      style={section.subtitleStyle || undefined}
                    >
                      {section.subtitle}
                    </h3>
                  ) : null}
                  {section.leadLine ? (
                    <p className={`native-columns-lead-line${section.leadLineClassName ? ` ${section.leadLineClassName}` : ''}`}>
                      {Array.isArray(section.leadLineHighlights) && section.leadLineHighlights.length
                        ? renderHighlightedText(section.leadLine, section.leadLineHighlights)
                        : renderTextWithStrong(section.leadLine)}
                    </p>
                  ) : null}
                  {(section.body || []).map((paragraph) => <p key={paragraph}>{renderTextWithStrong(paragraph)}</p>)}
                  {sectionHtml ? (
                    <SafeRichText
                      as="div"
                      className={`native-info-rich-html${(showBillboardSectionHud || showPageContentSectionHud) && allowOnPageClickEdit ? ' admin-front-hud-click-edit-target' : ''}`}
                      html={sectionHtml}
                      onClick={(showBillboardSectionHud || showPageContentSectionHud) && allowOnPageClickEdit
                        ? (event) => handleSectionBodyEditIntent(dynamicSectionHudPanelId, event)
                        : undefined}
                      onKeyDown={(showBillboardSectionHud || showPageContentSectionHud) && allowOnPageClickEdit
                        ? (event) => handleBodyEditKeyDown(event, (nextEvent) => handleSectionBodyEditIntent(dynamicSectionHudPanelId, nextEvent))
                        : undefined}
                      role={(showBillboardSectionHud || showPageContentSectionHud) && allowOnPageClickEdit ? 'button' : undefined}
                      tabIndex={(showBillboardSectionHud || showPageContentSectionHud) && allowOnPageClickEdit ? 0 : undefined}
                      aria-label={showBillboardSectionHud && allowOnPageClickEdit
                        ? 'Edit billboard body HTML'
                        : (showPageContentSectionHud && allowOnPageClickEdit ? 'Edit page content HTML' : undefined)}
                    />
                  ) : null}
                  {section.followupLine ? (
                    <p className={`native-columns-followup-line${section.followupLineClassName ? ` ${section.followupLineClassName}` : ''}`}>
                      {Array.isArray(section.followupLineHighlights) && section.followupLineHighlights.length
                        ? renderHighlightedText(section.followupLine, section.followupLineHighlights)
                        : renderTextWithStrong(section.followupLine)}
                    </p>
                  ) : null}

                  {Array.isArray(section.links) && section.links.length ? (
                    <ul className="native-info-link-list">
                      {section.links.map((item) => (
                        <li key={`${item.label}-${item.to || item.href || item.documentId}`}>
                          <NativeLink item={item} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <>
                  {!section.hideTitle ? (
                    <h2
                      className={[
                        section.titleClassName || '',
                        shouldAnimateValueCardsTitle ? 'investments-native-build-title investments-growth-scroll-reveal investments-growth-scroll-reveal-title' : '',
                      ].filter(Boolean).join(' ') || undefined}
                      style={section.titleStyle || undefined}
                      data-investments-growth-reveal={shouldAnimateValueCardsTitle ? 'title' : undefined}
                      data-investments-growth-start-vh={shouldAnimateValueCardsTitle ? '0.98' : undefined}
                      data-investments-growth-end-vh={shouldAnimateValueCardsTitle ? '0.48' : undefined}
                      data-investments-growth-anchor-ratio={shouldAnimateValueCardsTitle ? '0.22' : undefined}
                      data-investments-growth-anchor-max-px={shouldAnimateValueCardsTitle ? '120' : undefined}
                      data-investments-growth-min-opacity={shouldAnimateValueCardsTitle ? '0.24' : undefined}
                      data-investments-growth-base-scale={shouldAnimateValueCardsTitle ? '0.945' : undefined}
                      data-investments-growth-shift-y={shouldAnimateValueCardsTitle ? '34' : undefined}
                    >
                      {renderHighlightedText(section.title, section.titleHighlights)}
                    </h2>
                  ) : null}
                  {section.subtitle ? (
                    <h3
                      className={['native-info-section-subtitle', section.subtitleClassName || ''].filter(Boolean).join(' ')}
                      style={section.subtitleStyle || undefined}
                    >
                      {section.subtitle}
                    </h3>
                  ) : null}
                  {section.leadLine ? (
                    <p className={`native-columns-lead-line${section.leadLineClassName ? ` ${section.leadLineClassName}` : ''}`}>
                      {Array.isArray(section.leadLineHighlights) && section.leadLineHighlights.length
                        ? renderHighlightedText(section.leadLine, section.leadLineHighlights)
                        : renderTextWithStrong(section.leadLine)}
                    </p>
                  ) : null}
                  {(section.body || []).map((paragraph) => <p key={paragraph}>{renderTextWithStrong(paragraph)}</p>)}
                  {sectionHtml ? (
                    <SafeRichText
                      as="div"
                      className={`native-info-rich-html${showPageContentSectionHud && allowOnPageClickEdit ? ' admin-front-hud-click-edit-target' : ''}`}
                      html={sectionHtml}
                      onClick={showPageContentSectionHud && allowOnPageClickEdit ? (event) => handleSectionBodyEditIntent(dynamicSectionHudPanelId, event) : undefined}
                      onKeyDown={showPageContentSectionHud && allowOnPageClickEdit ? (event) => handleBodyEditKeyDown(event, (nextEvent) => handleSectionBodyEditIntent(dynamicSectionHudPanelId, nextEvent)) : undefined}
                      role={showPageContentSectionHud && allowOnPageClickEdit ? 'button' : undefined}
                      tabIndex={showPageContentSectionHud && allowOnPageClickEdit ? 0 : undefined}
                      aria-label={showPageContentSectionHud && allowOnPageClickEdit ? 'Edit page content HTML' : undefined}
                    />
                  ) : null}
                  {section.followupLine ? (
                    <p className={`native-columns-followup-line${section.followupLineClassName ? ` ${section.followupLineClassName}` : ''}`}>
                      {Array.isArray(section.followupLineHighlights) && section.followupLineHighlights.length
                        ? renderHighlightedText(section.followupLine, section.followupLineHighlights)
                        : renderTextWithStrong(section.followupLine)}
                    </p>
                  ) : null}

                  {Array.isArray(section.links) && section.links.length ? (
                    <ul className="native-info-link-list">
                      {section.links.map((item) => (
                        <li key={`${item.label}-${item.to || item.href || item.documentId}`}>
                          <NativeLink item={item} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              )
            ) : null}

            {hasLocationFilter ? (
              <div className="native-info-location-filter">
                <label htmlFor={`native-location-${sectionIndex}`} className={!locationFilterLabel ? 'is-label-hidden' : ''}>
                  {locationFilterLabel ? <span>{locationFilterLabel}</span> : null}
                  <select
                    id={`native-location-${sectionIndex}`}
                    value={selectedLocation}
                    aria-label={locationFilterLabel || section.locationFilter.ariaLabel || 'Select your location'}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setLocationFilters((prev) => ({
                        ...prev,
                        [sectionKey]: nextValue,
                      }));
                      setActiveMessageCards((prev) => ({
                        ...prev,
                        [sectionKey]: '',
                      }));
                    }}
                  >
                    <option value="">{section.locationFilter.placeholder || 'Choose your state'}</option>
                    {locationOptions.map((option) => (
                      <option key={`${sectionKey}-${option.value}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {section.actionsBeforeCards && Array.isArray(section.actions) && section.actions.length ? (
              <div className={buildActionRowClassName(sectionJustifyToken, 'left')}>
                {section.actions.map((item) => (
                  <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                ))}
              </div>
            ) : null}

            {columnsItems.length ? (
              <div className={`native-columns-grid is-${section.columns || 'two'}`}>
                {columnsItems.map((column, columnIndex) => (
                  <article
                    key={`${sectionKey}-column-${column.slot || columnIndex + 1}`}
                    className={`native-columns-item is-${column.type || 'text'}`}
                  >
                    {column.image ? (
                      <div className="native-columns-media-wrap">
                        <img
                          src={column.image}
                          alt={column.imageAlt || ''}
                          className="native-columns-media"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <div className="native-columns-copy">
                      {column.title ? <h3>{renderTextWithStrong(column.title)}</h3> : null}
                      {!isLegacyHighlightColumns && Array.isArray(column.body) && column.body.length
                        ? column.body.map((paragraph) => <p key={`${sectionKey}-${column.slot || columnIndex + 1}-${paragraph}`}>{renderTextWithStrong(paragraph)}</p>)
                        : null}
                      {!isLegacyHighlightColumns && column.html ? (
                        <SafeRichText as="div" className="native-info-rich-html" html={column.html} />
                      ) : null}
                      {!isLegacyHighlightColumns && Array.isArray(column.actions) && column.actions.length ? (
                        <div className="service-native-action-row">
                          {column.actions.map((item) => (
                            <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {cards.length && visibleCards.length && isValueCardsFeatureSection ? (
              <div className="investments-native-growth-grid native-value-cards-grid">
                {visibleCards.map((card, cardIndex) => (
                  <article
                    key={card.title}
                    className={[
                      'investments-native-growth-card',
                      'investments-growth-scroll-reveal',
                      String(card.cardClass || '').trim(),
                    ].filter(Boolean).join(' ')}
                    data-investments-growth-reveal="card"
                    data-investments-growth-background-panel={String(card.panelTone || '').trim() || ['blue', 'mango', 'sand'][cardIndex % 3]}
                    data-investments-growth-start-vh="1.08"
                    data-investments-growth-end-vh="0.54"
                    data-investments-growth-anchor-ratio="0.28"
                    data-investments-growth-anchor-max-px="154"
                    data-investments-growth-min-opacity="0.18"
                    data-investments-growth-base-scale="0.92"
                    data-investments-growth-shift-y="52"
                  >
                    <div className="native-columns-copy">
                      <h3 className={card.titleClassName || undefined}>
                        {Array.isArray(card.titleHighlights) && card.titleHighlights.length
                          ? renderHighlightedText(card.title, card.titleHighlights)
                          : card.title}
                      </h3>
                      {card.subtitle ? <p className="service-native-card-subtitle">{renderTextWithStrong(card.subtitle)}</p> : null}
                      {card.body ? <p>{renderTextWithStrong(card.body)}</p> : null}
                      {Array.isArray(card.list) && card.list.length ? (
                        <ul className="service-native-card-bullet-list">
                          {card.list.map((item) => (
                            <li key={`${card.title}-${item}`}>{renderTextWithStrong(item)}</li>
                          ))}
                        </ul>
                      ) : null}
                      {Array.isArray(card.actions) && card.actions.length ? (
                        <div className="service-native-action-row">
                          {card.actions.map((item) => (
                            <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {cards.length && visibleCards.length && !isValueCardsFeatureSection ? (
              <div className={`service-native-grid${section.columns ? ` is-${section.columns}` : ''}${focusMessageCard && activeMessageCard ? ' is-focus-open' : ''}`}>
                {visibleCards.map((card) => {
                  const isActiveMessageCard = focusMessageCard && activeMessageCard === card.title;
                  const resolvedMessageLayout = isActiveMessageCard && card.messagePanel ? 'inline' : 'toggle';
                  const stretchedLink = !card.messagePanel && card.stretchedLink && typeof card.stretchedLink === 'object'
                    ? card.stretchedLink
                    : null;
                  const shouldAnimateCard = !focusMessageCard;
                  const forceScrollRevealCard = shouldAnimateCard && sectionClassName.includes('legacy-giving-types');

                  return (
                  <article key={card.title} className={`service-native-card ${shouldAnimateCard ? 'fade-up' : ''}${forceScrollRevealCard ? ' fade-up-force-observe' : ''} ${card.cardClass || 'card2'}${card.dividerTone ? ` is-divider-tone-${card.dividerTone}` : ''}${card.messagePanel && resolvedMessageLayout === 'inline' ? ' has-inline-message' : ''}${stretchedLink ? ' has-stretched-link' : ''}`.trim()}>
                    <div className={card.messagePanel && resolvedMessageLayout === 'inline' ? 'consultant-card-details' : undefined}>
                      <h3 className={card.titleClassName || undefined}>
                        {Array.isArray(card.titleHighlights) && card.titleHighlights.length
                          ? renderHighlightedText(card.title, card.titleHighlights)
                          : card.title}
                        {card.titleSuffix ? <span className="consultant-name-credentials">&nbsp;{card.titleSuffix}</span> : null}
                      </h3>
                      {card.subtitle ? <p className="service-native-card-subtitle">{renderTextWithStrong(card.subtitle)}</p> : null}
                      {card.phone ? (
                        <p className="service-native-card-phone">
                          {card.phoneHref ? (
                            <a href={card.phoneHref}>{card.phone}</a>
                          ) : card.phone}
                        </p>
                      ) : null}
                      {card.body ? <p>{renderTextWithStrong(card.body)}</p> : null}
                      {Array.isArray(card.list) && card.list.length ? (
                        <ul className="service-native-card-bullet-list">
                          {card.list.map((item) => (
                            <li key={`${card.title}-${item}`}>{renderTextWithStrong(item)}</li>
                          ))}
                        </ul>
                      ) : null}
                      {Array.isArray(card.links) && card.links.length ? (
                        <ul className="service-native-card-link-list">
                          {card.links.map((item) => (
                            <li key={`${card.title}-${item.label}-${item.to || item.href || item.documentId}`}>
                              <NativeLink item={item} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {Array.isArray(card.accordions) && card.accordions.length ? (
                        <div className="service-native-card-accordions">
                          {card.accordions.map((accordion) => (
                            <NativeCardAccordion
                              key={`${card.title}-${accordion.title}`}
                              cardTitle={card.title}
                              accordion={accordion}
                            />
                          ))}
                        </div>
                      ) : null}
                      {card.fineprint ? (
                        Array.isArray(card.fineprint)
                          ? card.fineprint.map((line, index) => (
                            <p key={`${card.title}-fineprint-${index + 1}`} className="service-native-card-fineprint">
                              {renderTextWithStrong(line)}
                            </p>
                          ))
                          : (
                            <p className="service-native-card-fineprint">
                              {renderTextWithStrong(card.fineprint)}
                            </p>
                          )
                      ) : null}
                    </div>
                    {card.messagePanel ? (
                      <ConsultantMessagePanel
                        card={card}
                        layout={resolvedMessageLayout}
                        onSubmitMessage={addResponse}
                        onOpenChange={(nextOpen) => {
                          setActiveMessageCards((prev) => ({
                            ...prev,
                            [sectionKey]: nextOpen ? card.title : '',
                          }));
                        }}
                      />
                    ) : null}
                    {!card.messagePanel && Array.isArray(card.actions) && card.actions.length ? (
                      <div className="service-native-action-row">
                        {card.actions.map((item) => (
                          <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                        ))}
                      </div>
                    ) : null}
                    {stretchedLink ? (
                      <div className="service-native-action-row">
                        <span className="service-native-btn is-static" aria-hidden="true">
                          {stretchedLink.label || card.cta || 'Learn more'}
                        </span>
                      </div>
                    ) : null}
                    {!card.messagePanel && !stretchedLink && !Array.isArray(card.actions) && (card.to || card.href || card.documentId) ? (
                      <div className="service-native-action-row">
                        <Action
                          item={{
                            label: card.cta || 'Learn more',
                            to: card.to,
                            href: card.href,
                            documentId: card.documentId,
                          }}
                        />
                      </div>
                    ) : null}
                    {stretchedLink ? (
                      <NativeLink item={stretchedLink} className="service-native-card-stretched-link">
                        <span className="service-native-card-stretched-link-label">
                          {stretchedLink.label || card.cta || card.title || 'Open card link'}
                        </span>
                      </NativeLink>
                    ) : null}
                  </article>
                  );
                })}
              </div>
            ) : null}

            {cards.length && !visibleCards.length ? (
              <p className="native-info-location-empty">
                {requireLocationSelection && !selectedLocation
                  ? 'Select your state to view your consultant.'
                  : 'No consultant currently listed for that state. Please call 866.621.1787.'}
              </p>
            ) : null}

            {isNativeCareersJobsSection(section) ? <NativeCareersJobsSection jobs={section.jobs} /> : null}

            {resolvedFormConfig ? <NativeContentForm config={resolvedFormConfig} /> : null}

            {section.widget === 'retirement-403b-rate-table' ? (
              <Retirement403bRateTableWidget rates={rates} ratesMeta={ratesMeta} />
            ) : null}

            {section.widget === 'retirement-ira-rate-table' ? (
              <RetirementIraRateTableWidget iraRates={iraRates} ratesMeta={ratesMeta} />
            ) : null}

            {section.widget === 'mission-assure-pricing' ? (
              <MissionAssurePricingWidget pricing={section.pricing} />
            ) : null}

            {section.widget === 'retirement-fund-ira' ? (
              <FundAnIraWidget />
            ) : null}

            {section.widget === 'investments-institutional-by-mail' ? (
              <InstitutionalInvestmentByMailFlowWidget />
            ) : null}

            {section.widget === 'endowment-calculator' ? (
              <EndowmentCalculatorWidget />
            ) : null}

            {section.widget === 'giving-comparison-matrix' ? (
              <GivingComparisonMatrix />
            ) : null}

            {section.widget === 'charitable-giving-table' ? (
              <CharitableGivingTableWidget />
            ) : null}

            {section.widget === 'charitable-gift-test-drive' ? (
              <CharitableGiftTestDriveWidget />
            ) : null}

            {section.widget === 'retirement-minister-housing-quick-check' ? (
              <MinisterHousingQuickCheckWidget />
            ) : null}

            {section.widget === 'emergency-fund-calculator' ? (
              <EmergencyFundCalculatorWidget />
            ) : null}

            {section.widget === 'net-worth-calculator' ? (
              <NetWorthCalculatorWidget />
            ) : null}

            {section.widget === 'increased-contribution-calculator' ? (
              <IncreasedContributionCalculatorWidget />
            ) : null}

            {section.table ? (
              <div className="native-info-table-wrap">
                <InfoTableSheet
                  headers={section.table.headers}
                  rows={section.table.rows}
                  valueAlignment={section.table.valueAlignment}
                />
              </div>
            ) : null}

            {Array.isArray(section.testimonials) && section.testimonials.length ? (
              <div className="service-native-testimonials-wrap">
                <div className="carousel-stack">
                  {section.testimonials.map((item, index) => (
                    <article key={item.author} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                      <p><strong>{item.quote}</strong></p>
                      <p>—<strong>{item.author}</strong></p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {section.addressBlock ? (
              <CopyAddressBlock
                config={section.addressBlock}
                className={section.addressBlock.className || ''}
              />
            ) : null}

            {section.fineprint ? (
              Array.isArray(section.fineprint)
                ? section.fineprint.map((line, index) => (
                  <p key={`${sectionKey}-fineprint-${index + 1}`} className="service-native-note">{renderTextWithStrong(line)}</p>
                ))
                : <p className="service-native-note">{renderTextWithStrong(section.fineprint)}</p>
            ) : null}

            {Array.isArray(section.faqs) && section.faqs.length ? (
              <div className="native-faq-list">
                {section.faqs.map((item) => (
                  <details key={item.question} className="native-faq-item">
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            ) : null}

            {Array.isArray(section.supportGroups) && section.supportGroups.length ? (
              <SearchableSupportGroups section={section} />
            ) : null}

            {!section.actionsBeforeCards && Array.isArray(section.actions) && section.actions.length ? (
              <div className={buildActionRowClassName(sectionJustifyToken, 'left')}>
                {section.actions.map((item) => (
                  <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
                ))}
              </div>
            ) : null}
            </div>
            {showSectionHud && !isMobileFrontHud ? (
              <FrontHudAnchorTag
                label={dynamicSectionPanel?.label || ''}
                isActive={isHudPanelVisible(dynamicSectionHudPanelId)}
                onClick={() => toggleHudPanel(dynamicSectionHudPanelId, { scrollToTarget: true })}
                layerClassName={`is-section${showCtaSectionHud || showRequestSectionHud ? ' is-cta' : ''}`}
                style={{ '--ag-admin-front-hud-opacity': String(frontHudOpacityRatio) }}
              />
            ) : null}
          </section>
        );
      })}

      {hasOpenHudPanel && activeHudPanel?.block ? (
        <FrontHudPanelShell
          title={activeHudPanel.label}
          onClose={isMobileFrontHud ? closeMobileHudPanel : closeHudDock}
          className={isMobileFrontHud ? 'is-mobile-sheet' : ''}
          draggable={!isMobileFrontHud}
          isMobileSheet={isMobileFrontHud}
        >
          <FrontHudPageWorkflow
            pathname={adminHudEditPath}
            reviewHref={adminHudEditHref}
            placement="dock-inline"
            onDoneEditing={isMobileFrontHud ? closeMobileHudPanel : closeHudDock}
          />
          <BlockHudPanelHost
            block={activeHudPanel.block}
            pathname={adminHudEditPath}
            routeOptions={heroLinkOptions}
            testimonialsLibrary={testimonialsHudLibrary}
            ownership={getOwnershipVisualForBlockId(activeHudPanel.block.id)}
            onOwnershipAction={() => {
              if (!editableBlockPath || !activeHudPanel?.block?.id) {
                return;
              }
              setActiveBlockLock(editableBlockPath, activeHudPanel.block.id, { force: true });
            }}
            onSettingChange={(settingKey, nextValue) => handleHudSetting(activeHudPanel.block, settingKey, nextValue)}
          />
        </FrontHudPanelShell>
      ) : null}

      {isMobileFrontHud && mobileSelectedHudPanel && hudDockCollapsed ? (
        <MobileFrontHudActionTray
          blockLabel={mobileSelectedHudPanel.label}
          isHidden={toBoolean(mobileSelectedHudBlock?.hidden)}
          canMoveUp={canMoveMobileSelectedHudBlockUp}
          canMoveDown={canMoveMobileSelectedHudBlockDown}
          isMoreOpen={mobileHudMoreOpen}
          isDeleteConfirming={mobileHudDeleteConfirmBlockId === mobileSelectedHudBlockId}
          onEdit={handleMobileHudEdit}
          onMoveUp={() => handleMobileHudMove('up')}
          onMoveDown={() => handleMobileHudMove('down')}
          onToggleMore={() => {
            setMobileHudMoreOpen((current) => !current);
            setMobileHudDeleteConfirmBlockId('');
          }}
          onToggleVisibility={handleMobileHudToggleVisibility}
          onDelete={handleMobileHudDelete}
          onDismiss={clearMobileHudSelection}
        />
      ) : null}

      {Array.isArray(content.actions) && content.actions.length ? (
        <section className="service-native-cta-band">
          <div className="ag-panel-rail">
            <div className="service-native-action-row is-centered">
              {content.actions.map((item) => (
                <Action key={`${item.label}-${item.to || item.href || item.documentId}`} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      </div>
    </InlineCtaRevealContext.Provider>
  );
}
