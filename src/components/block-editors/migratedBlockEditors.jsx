import { useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import AdminNumberInput from '../AdminNumberInput';
import AdminHtmlEditor from '../AdminHtmlEditor';
import BillboardHudEditorPanel from '../BillboardHudEditorPanel';
import ColorPalette from '../ColorPalette';
import { HeroDriftNotice } from '../HeroHudEditorShared';
import IntroHudEditorPanel from '../IntroHudEditorShared';
import PageContentHudEditorPanel, { PageContentLayoutControls } from '../PageContentHudEditorPanel';
import TestimonialsHudEditorPanel from '../TestimonialsHudEditorPanel';
import TopStripHudEditorPanel from '../TopStripHudEditorPanel';
import { inspectDynamicHeroSettings } from '../../context/ContentAdminContext';
import { DocumentsContext } from '../../context/DocumentsContext';
import {
  buildCtaFormSettingsPatch,
  createCtaFormFieldDraft,
  CTA_FORM_MAX_FIELDS,
  CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS,
  REQUEST_FORM_STEP_FIELD_FORMAT_OPTIONS,
  REQUEST_FORM_STEP_FIELD_TYPE_OPTIONS,
  extractCtaFormFields,
  getSharedFormConfigFieldIds,
  normalizeRequestFormFieldType,
  parseFormChoiceOptionsText,
  formatFormChoiceOptionsText,
  pickFieldDescriptors,
} from '../../blocks/foundation/forms';
import { getBlockEditorSections, resolveBlockPresetDefinition } from '../../blocks/registry';
import {
  applySelectionColor,
  extractHeroLineColorToken,
  parseHeroRangeHighlights,
  readTextSelectionState,
  remapHighlightsJsonForTextChange,
  removeSelectionRange,
  replaceHeroLineColorClass,
  resolveHeroLineDisplayClassName,
  resolveSelectionRangeColor,
} from '../../lib/heroHudRanges';
import {
  hasDisplayableHeroLineText,
  resolveVisibleHeroLineNumbers,
  supportsOptionalHeroLine3,
} from '../../lib/heroEditorLines';
import {
  DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
  DEFAULT_HERO_TITLE_SIZE_REM,
  heroTitleSizeRemToEditorCss,
  normalizeHeroTitleLetterSpacingEm,
  normalizeHeroTitleSizeRem,
} from '../../lib/heroTitleSize';
import { getVisibleDynamicColumnSlots } from '../../lib/dynamicColumns';
import {
  formatTestimonialAttribution,
  normalizeDisplayTestimonials,
  normalizeTestimonialsSelectionMode,
  parseTokenList,
  resolveTestimonialsBlockData,
} from '../../lib/testimonials';
import {
  getGridCompatibleCardStyleOptions,
  getGridCompatibleToneOptions,
  getGridSafeCardStyleForBg,
  getGridSafeToneForBg,
  normalizeGridBgTone,
  normalizeGridCardStyleToken,
  normalizeGridToneToken,
} from '../../lib/dynamicGrid';
import {
  BUTTON_TONE_OPTIONS as SHARED_BUTTON_TONE_OPTIONS,
  HERO_TEXT_COLOR_OPTIONS,
  PANEL_TEXT_TONE_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
  normalizeButtonTone,
  normalizePanelTextTone,
  normalizeSemanticTextColorClass,
  normalizeSurfaceBgTone,
  resolvePanelTextToneClassName,
} from '../../lib/colorSystem';
import {
  getAllowedSiteFeatureEditableFieldIds,
  resolveSiteFeatureCatalogEntry,
  SITE_FEATURE_ACTION_FIELD_IDS,
} from '../../data/siteFeatureCatalog';
import { buildDynamicRatesFromBlock } from '../../lib/dynamicPageBlocks';

const BILLBOARD_BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
];

const HERO_ANIMATION_PRESET_OPTIONS = [
  { value: 'default', label: 'Default entrance' },
  { value: 'none', label: 'No line animation' },
  { value: 'loans-unblur', label: 'Unblur + slide' },
];

const DEFAULT_INTRO_LINE_SPACING = 1.04;
const DEFAULT_BILLBOARD_LINE_SPACING = 1;
const DEFAULT_BILLBOARD_TITLE_FONT_WEIGHT = 800;
const DEFAULT_BILLBOARD_TITLE_SIZE_REM = 3.4;
const DEFAULT_BILLBOARD_TITLE_LETTER_SPACING_EM = -0.03;
const EDITOR_LOCAL_DRAFT_COMMIT_DELAY_MS = 320;
const SITE_FEATURE_LOCAL_DRAFT_FIELD_IDS = Object.freeze(['headline', 'body', 'buttonLabel', 'buttonUrl']);
const CTA_BAND_LOCAL_DRAFT_FIELD_IDS = Object.freeze(['title', 'body', 'buttonLabel', 'buttonUrl']);
const IMPACT_STAT_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'titlePrefix',
  'highlight',
  'body',
  'ctaLabel',
  'ctaPath',
  'stat1Value',
  'stat1Label',
  'stat2Value',
  'stat2Label',
  'stat3Value',
  'stat3Label',
]);
const SERVICES_GRID_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'heading',
  'headingSizeRem',
  'cardTitleSizeRem',
  'cardPaddingRem',
  'browseLabel',
  'browsePath',
  'card1Title',
  'card1Path',
  'card1ImageUrl',
  'card1ImageAlt',
  'card2Title',
  'card2Path',
  'card2ImageUrl',
  'card2ImageAlt',
  'card3Title',
  'card3Path',
  'card3ImageUrl',
  'card3ImageAlt',
  'card4Title',
  'card4Path',
  'card4ImageUrl',
  'card4ImageAlt',
  'card5Title',
  'card5Path',
  'card5ImageUrl',
  'card5ImageAlt',
  'card6Title',
  'card6Path',
  'card6ImageUrl',
  'card6ImageAlt',
]);
const GRID_LOCAL_DRAFT_FIELD_IDS = Object.freeze(
  Array.from({ length: 8 }, (_, index) => index + 1).flatMap((slot) => ([
    `card${slot}Title`,
    `card${slot}Body`,
    `card${slot}ButtonLabel`,
    `card${slot}ButtonUrl`,
    `card${slot}Button2Label`,
    `card${slot}Button2Url`,
  ])),
);
const CALCULATOR_CTA_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'title',
  'subtitle',
  'body',
  'howItWorksTitle',
  'step1',
  'step2',
  'step3',
  'resultsTitle',
  'totalInvestmentLabel',
  'ladderYearsLabel',
  'ladderYearsHelper',
  'maturityLabel',
  'reinvestOptionLabel',
  'cashOutOptionLabel',
  'visualizeYearsLabel',
  'visualizeYearsHelper',
  'calculateLabel',
  'note',
  'disclaimer',
  'customRatesNote',
  'downloadTitle',
  'downloadBody',
  'downloadButtonLabel',
  'discussTitle',
  'discussBody',
  'discussButtonLabel',
]);
const BILLBOARD_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'title',
  'subtitle',
  'body',
  'bodyHtml',
  'buttonLabel',
  'buttonUrl',
  'button2Label',
  'button2Url',
]);
const CTA_FORM_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'salesforceUrl',
  'submitLabel',
  'successMessage',
  'bodyHtml',
  ...Array.from({ length: 5 }, (_, index) => {
    const slot = index + 1;
    return [
      `field${slot}Label`,
      `field${slot}Placeholder`,
      `field${slot}Options`,
    ];
  }).flat(),
]);
const CTA_FORM_GRID_LOCAL_DRAFT_FIELD_IDS = Object.freeze(
  CTA_FORM_LOCAL_DRAFT_FIELD_IDS.filter((fieldId) => fieldId !== 'bodyHtml'),
);
const INTRO_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'bodyHtml',
  'extraLine',
  'button1Label',
  'button1Url',
  'button2Label',
  'button2Url',
]);
const HERO_BUTTON_LOCAL_DRAFT_FIELD_IDS = Object.freeze({
  1: Object.freeze(['button1Label', 'button1Url']),
  2: Object.freeze(['button2Label', 'button2Url']),
});
const REQUEST_FORM_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'salesforceUrl',
  'submitLabel',
  'successMessage',
  'subtitle',
]);
const REQUEST_FORM_CONFIG_LOCAL_DRAFT_FIELD_IDS = Object.freeze(
  REQUEST_FORM_LOCAL_DRAFT_FIELD_IDS.filter((fieldId) => fieldId !== 'subtitle'),
);
const COLOR_TEXT_SELECTION_DRAFT_BLOCK_KINDS = Object.freeze([
  'cta_form',
  'request_form',
  'intro',
  'card_grid',
  'newsletter',
  'columns',
]);
const COLUMNS_LOCAL_DRAFT_FIELD_IDS = Object.freeze(
  Array.from({ length: 4 }, (_, index) => index + 1).flatMap((slot) => ([
    `col${slot}Title`,
    `col${slot}Body`,
    `col${slot}ImageUrl`,
    `col${slot}ImageAlt`,
    `col${slot}ButtonLabel`,
    `col${slot}ButtonUrl`,
  ])),
);
const PHOTO_COLUMN_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'title',
  'body',
  'imageUrl',
  'imageAlt',
  'buttonLabel',
  'buttonUrl',
]);
const BUFFERED_STRING_DRAFT_BLOCK_KINDS = Object.freeze([
  'site_feature',
  'feature_panel',
  'split_panel',
  'cta_band',
  'impact_stat',
  'services_grid',
  'card_grid',
  'calculator_cta',
  'billboard',
  'intro',
  'cta_form',
  'request_form',
  'columns',
  'photo_column',
]);

const JUSTIFY_ICON_ORDER = ['left', 'center', 'right'];
const ACTION_BUTTON_STYLE_SET = new Set(['blue', 'dark', 'outline']);
const HERO_SWATCH_OPTIONS = HERO_TEXT_COLOR_OPTIONS;
const BILLBOARD_BG_SWATCH_OPTIONS = SURFACE_BG_TONE_OPTIONS;
const BILLBOARD_TEXT_SWATCH_OPTIONS = PANEL_TEXT_TONE_OPTIONS;
const BILLBOARD_BUTTON_TONE_OPTIONS = SHARED_BUTTON_TONE_OPTIONS;
const HERO_BG_SWATCH_OPTIONS = SURFACE_BG_TONE_OPTIONS;
const GRID_RESOURCE_LINK_TYPE_OPTIONS = [
  { value: 'document', label: 'PDF / document' },
  { value: 'internal', label: 'Internal page' },
  { value: 'external', label: 'External URL' },
];

function resolveEditorFields(kind, surface = 'admin', fallbackFields = []) {
  const sections = getBlockEditorSections(kind, surface);
  const fields = sections.flatMap((section) => (Array.isArray(section?.fields) ? section.fields : []));
  return fields.length ? fields : (Array.isArray(fallbackFields) ? fallbackFields : []);
}

export function getBufferedStringDraftBlockKinds() {
  return [...BUFFERED_STRING_DRAFT_BLOCK_KINDS];
}

export function getColorTextSelectionDraftBlockKinds() {
  return [...COLOR_TEXT_SELECTION_DRAFT_BLOCK_KINDS];
}

function normalizeRouteOption(page) {
  if (!page || typeof page !== 'object') {
    return null;
  }
  const path = String(page.path || page.value || '').trim();
  if (!path) {
    return null;
  }
  const title = String(page.title || page.label || path).trim() || path;
  const linkRef = String(page.linkRef || path).trim() || path;
  return {
    ...page,
    path,
    title,
    label: String(page.label || title).trim() || title,
    value: String(page.value || path).trim() || path,
    linkRef,
  };
}

function sortPages(pages) {
  return [...pages]
    .map(normalizeRouteOption)
    .filter(Boolean)
    .sort((a, b) => a.path.localeCompare(b.path));
}

function toManagedPageLinkRef(page) {
  return String(page?.linkRef || page?.path || '').trim();
}

function findSearchTargetPage(needle, pages) {
  const query = needle.trim().toLowerCase();
  if (!query || !pages.length) {
    return null;
  }

  const exact = pages.find((page) => (
    page.path.toLowerCase() === query
    || page.title.toLowerCase() === query
  ));
  if (exact) {
    return exact;
  }

  const startsWith = pages.find((page) => (
    page.path.toLowerCase().startsWith(query)
    || page.title.toLowerCase().startsWith(query)
  ));
  if (startsWith) {
    return startsWith;
  }

  if (pages.length === 1) {
    return pages[0];
  }

  return null;
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

function parseHighlightListValue(value) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        text: String(item.text || ''),
        className: String(item.className || ''),
      }))
      .filter((item) => item.text.trim());
  } catch {
    return [];
  }
}

function serializeHighlightListValue(items) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => ({
      text: String(item?.text || '').trim(),
      className: String(item?.className || '').trim(),
    }))
    .filter((item) => item.text && item.className);

  return normalized.length ? JSON.stringify(normalized) : '';
}

function normalizeGridResourceLinkItem(item) {
  const source = item && typeof item === 'object' ? item : {};
  const label = String(source.label || source.title || '').trim();
  const documentId = String(source.documentId || '').trim();
  const to = String(source.to || source.pageRef || '').trim();
  const href = String(source.href || source.url || '').trim();
  const openInNewWindow = toBoolean(source.openInNewWindow);

  if (documentId) {
    return {
      label,
      kind: 'document',
      documentId,
      to: '',
      href: '',
      openInNewWindow,
    };
  }

  if (to || href.startsWith('/')) {
    return {
      label,
      kind: 'internal',
      documentId: '',
      to: to || href,
      href: '',
      openInNewWindow,
    };
  }

  return {
    label,
    kind: 'external',
    documentId: '',
    to: '',
    href,
    openInNewWindow,
  };
}

function parseGridResourceLinkItems(value) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => normalizeGridResourceLinkItem(item));
  } catch {
    return [];
  }
}

function serializeGridResourceLinkItems(items) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => normalizeGridResourceLinkItem(item))
    .map((item) => {
      if (item.kind === 'document') {
        if (!item.label || !item.documentId) {
          return null;
        }
        return {
          label: item.label,
          documentId: item.documentId,
          ...(item.openInNewWindow ? { openInNewWindow: true } : {}),
        };
      }
      if (item.kind === 'internal') {
        if (!item.label || !item.to) {
          return null;
        }
        return {
          label: item.label,
          to: item.to,
          ...(item.openInNewWindow ? { openInNewWindow: true } : {}),
        };
      }
      if (!item.label || !item.href) {
        return null;
      }
      return {
        label: item.label,
        href: item.href,
        ...(item.openInNewWindow ? { openInNewWindow: true } : {}),
      };
    })
    .filter(Boolean);

  return normalized.length ? JSON.stringify(normalized) : '';
}

function parseGridResourceAccordions(value) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        title: String(item.title || '').trim(),
        links: parseGridResourceLinkItems(JSON.stringify(Array.isArray(item.links) ? item.links : [])),
      }));
  } catch {
    return [];
  }
}

function serializeGridResourceAccordions(items) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => ({
      title: String(item?.title || '').trim(),
      links: JSON.parse(serializeGridResourceLinkItems(item?.links) || '[]'),
    }))
    .filter((item) => item.title && item.links.length);

  return normalized.length ? JSON.stringify(normalized) : '';
}

function renderPreviewHighlightedText(source, highlights) {
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
      className: String(item.className || ''),
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

    rules.forEach((rule) => {
      const needle = String(rule.text || '').toLowerCase();
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

function normalizeHeroColorClass(value) {
  return normalizeSemanticTextColorClass(value);
}

function normalizeActionButtonStyleToken(value) {
  const token = String(value || '').trim().toLowerCase();
  return ACTION_BUTTON_STYLE_SET.has(token) ? token : 'blue';
}

function normalizeActionButtonToneToken(value, fallback = 'atlantean') {
  return normalizeButtonTone(value, fallback);
}

function normalizeJustifySelection(value, options) {
  const values = (Array.isArray(options) ? options : [])
    .map((option) => String(option?.value || '').trim())
    .filter((optionValue) => JUSTIFY_ICON_ORDER.includes(optionValue));
  const fallback = values.includes('center') ? 'center' : (values[0] || 'center');
  const token = String(value || '').trim();
  return values.includes(token) ? token : fallback;
}

function normalizeIntroLineSpacing(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_INTRO_LINE_SPACING;
  }
  return Math.max(0.85, Math.min(1.4, Number(numeric.toFixed(2))));
}

function normalizeBillboardLineSpacing(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_BILLBOARD_LINE_SPACING;
  }
  return Math.max(0.85, Math.min(1.25, Number(numeric.toFixed(2))));
}

function normalizeBillboardTitleFontFamily(value) {
  const token = String(value || '').trim().toLowerCase();
  return ['heading', 'helv'].includes(token) ? token : 'heading';
}

function normalizeBillboardTitleSizeRem(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_BILLBOARD_TITLE_SIZE_REM;
  }
  return Math.max(2.4, Math.min(8, Number(numeric.toFixed(2))));
}

function normalizeBillboardTitleFontWeight(value, fontFamily = 'heading') {
  const numeric = Number(value);
  const fallback = fontFamily === 'helv' ? 700 : DEFAULT_BILLBOARD_TITLE_FONT_WEIGHT;
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const rounded = Math.round(numeric / 100) * 100;
  return Math.max(400, Math.min(900, rounded));
}

function normalizeBillboardTitleLetterSpacingEm(value, fontFamily = 'heading') {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fontFamily === 'helv' ? -0.015 : DEFAULT_BILLBOARD_TITLE_LETTER_SPACING_EM;
  }
  return Math.max(-0.08, Math.min(0.04, Number(numeric.toFixed(3))));
}

function normalizePanelBgTone(value) {
  return normalizeSurfaceBgTone(value, 'white');
}

function getPanelTextTonePreviewClassName(value, fallback = 'dark') {
  const previewClassName = resolvePanelTextToneClassName(value, fallback);
  return previewClassName === 'is-atlantean' ? 'is-blue' : previewClassName;
}

function mergePreviewClassNames(lineClassName, previewClassName) {
  const lineClasses = String(lineClassName || '').trim().split(/\s+/).filter(Boolean);
  const previewClasses = String(previewClassName || '').trim().split(/\s+/).filter(Boolean);
  const hasExplicitLineColor = lineClasses.some((token) => Boolean(normalizeHeroColorClass(token)));
  const filteredPreviewClasses = hasExplicitLineColor
    ? previewClasses.filter((token) => !['is-white', 'is-super-grey', 'is-blue'].includes(token))
    : previewClasses;
  return [...lineClasses, ...filteredPreviewClasses].join(' ').trim();
}

function JustifyIcon({ align }) {
  const offsets = align === 'left'
    ? [2, 2, 2]
    : align === 'right'
      ? [7, 5, 3]
      : [4, 3, 4];

  return (
    <svg className="admin-justify-pill-icon" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <rect x={offsets[0]} y="3" width="8" height="1.5" rx="0.75" />
      <rect x={offsets[1]} y="6.25" width="9" height="1.5" rx="0.75" />
      <rect x={offsets[2]} y="9.5" width="7" height="1.5" rx="0.75" />
    </svg>
  );
}

function areSlotListsEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function mergeVisibleSlotList(current, existing, availableSlots) {
  const allowed = new Set((Array.isArray(availableSlots) ? availableSlots : []).map((slot) => Number(slot)).filter(Number.isFinite));
  const merged = Array.from(new Set([
    ...(Array.isArray(existing) ? existing : []),
    ...(Array.isArray(current) ? current : []),
  ]))
    .map((slot) => Number(slot))
    .filter((slot) => Number.isFinite(slot) && allowed.has(slot))
    .sort((left, right) => left - right);
  return merged;
}

function summarizeProgressiveSlot(parts) {
  return (Array.isArray(parts) ? parts : [])
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' · ');
}

function ProgressiveCardEditorList({
  heading = 'Cards',
  slots = [],
  expandedSlot = null,
  onToggleSlot,
  onRevealNextSlot,
  revealLabel = 'Add card',
  renderSlotBody,
  className = '',
}) {
  return (
    <div className={`admin-progressive-slot-list${className ? ` ${className}` : ''}`}>
      <div className="admin-progressive-slot-list-head">
        <h4>{heading}</h4>
        {onRevealNextSlot ? (
          <button
            type="button"
            className="admin-front-hud-mini-action"
            onClick={onRevealNextSlot}
          >
            {revealLabel}
          </button>
        ) : null}
      </div>

      {slots.map((slotData) => {
        const slot = Number(slotData?.slot);
        const isExpanded = expandedSlot === slot;
        return (
          <section
            key={`progressive-slot-${slot}`}
            className={`admin-progressive-slot-card${isExpanded ? ' is-expanded' : ''}`}
          >
            <button
              type="button"
              className="admin-progressive-slot-toggle"
              onClick={() => onToggleSlot?.(slot)}
              aria-expanded={isExpanded ? 'true' : 'false'}
            >
              <span className="admin-progressive-slot-kicker">{slotData?.kicker || `Card ${slot}`}</span>
              <span className="admin-progressive-slot-title-row">
                <span className="admin-progressive-slot-title">
                  {slotData?.title || slotData?.fallbackTitle || `Card ${slot}`}
                </span>
                <span className="admin-progressive-slot-chevron" aria-hidden="true">
                  {isExpanded ? '−' : '+'}
                </span>
              </span>
              {slotData?.summary ? (
                <span className="admin-progressive-slot-summary">{slotData.summary}</span>
              ) : null}
            </button>

            {isExpanded ? (
              <div className="admin-progressive-slot-body">
                {renderSlotBody?.(slotData)}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function JustifyPillControl({ label, value, options, onChange, className = '' }) {
  const optionByValue = new Map(
    (Array.isArray(options) ? options : [])
      .map((option) => [String(option?.value || '').trim(), option]),
  );
  const orderedOptions = JUSTIFY_ICON_ORDER
    .map((optionValue) => optionByValue.get(optionValue))
    .filter(Boolean);
  const normalizedOptions = orderedOptions.length
    ? orderedOptions
    : JUSTIFY_ICON_ORDER.map((optionValue) => ({ value: optionValue, label: optionValue }));
  const selectedValue = normalizeJustifySelection(value, normalizedOptions);

  return (
    <div className={`admin-justify-pill-control${className ? ` ${className}` : ''}`} role="radiogroup" aria-label={label}>
      {normalizedOptions.map((option) => {
        const optionValue = String(option.value || '').trim();
        const isActive = selectedValue === optionValue;
        return (
          <button
            key={`${label}-${optionValue}`}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            className={`admin-justify-pill-btn${isActive ? ' is-active' : ''}`}
            title={option.label}
            onClick={() => onChange(optionValue)}
          >
            <JustifyIcon align={optionValue} />
          </button>
        );
      })}
    </div>
  );
}

function RouteLinkField({ value, routeRefValue, onChange, onRouteRefChange, routeOptions = [] }) {
  const [routeSearch, setRouteSearch] = useState('');
  const allRouteOptions = useMemo(
    () => sortPages(Array.isArray(routeOptions) ? routeOptions : []),
    [routeOptions],
  );
  const filteredRoutes = useMemo(() => {
    const needle = routeSearch.trim().toLowerCase();
    if (!needle) {
      return allRouteOptions;
    }
    return allRouteOptions.filter((page) => {
      const haystack = `${page.title} ${page.path}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [routeSearch, allRouteOptions]);

  const applyRoutePage = (page) => {
    if (!page || !page.path) {
      return;
    }
    onChange(page.path);
    if (typeof onRouteRefChange === 'function') {
      onRouteRefChange(toManagedPageLinkRef(page));
    }
  };

  useEffect(() => {
    if (!routeRefValue) {
      if (typeof onRouteRefChange === 'function') {
        const exactPage = allRouteOptions.find((page) => page.path === String(value || '').trim());
        if (exactPage) {
          onRouteRefChange(toManagedPageLinkRef(exactPage));
        }
      }
      return;
    }
    const matchedPage = allRouteOptions.find((page) => toManagedPageLinkRef(page) === String(routeRefValue).trim());
    if (!matchedPage?.path) {
      return;
    }
    if (String(value || '').trim() === matchedPage.path) {
      return;
    }
    onChange(matchedPage.path);
  }, [routeRefValue, value, onChange, onRouteRefChange, allRouteOptions]);

  return (
    <div className="admin-route-link-control">
      <input
        type="text"
        value={value ?? ''}
        placeholder="/contact-us"
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          if (typeof onRouteRefChange === 'function') {
            const exactPage = allRouteOptions.find((page) => page.path === nextValue.trim());
            onRouteRefChange(exactPage ? toManagedPageLinkRef(exactPage) : '');
          }
        }}
      />
      <div className="admin-route-link-search">
        <input
          type="search"
          value={routeSearch}
          placeholder="Search pages"
          onChange={(event) => setRouteSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') {
              return;
            }
            const target = findSearchTargetPage(routeSearch, filteredRoutes.length ? filteredRoutes : allRouteOptions);
            if (!target) {
              return;
            }
            event.preventDefault();
            applyRoutePage(target);
            setRouteSearch('');
          }}
        />
        <select
          value=""
          onChange={(event) => {
            if (!event.target.value) {
              return;
            }
            const selectedPage = allRouteOptions.find((page) => page.path === event.target.value);
            if (!selectedPage) {
              return;
            }
            applyRoutePage(selectedPage);
            setRouteSearch('');
          }}
        >
          <option value="">Pick page route…</option>
          {filteredRoutes.map((page) => (
            <option key={`route-link-${page.path}`} value={page.path}>
              {page.path} — {page.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function promoteRouteLinkDescriptor(field, routeRefFieldId) {
  if (!field || !routeRefFieldId) {
    return field || null;
  }
  if (field.type === 'route_link' && field.routeRefFieldId === routeRefFieldId) {
    return field;
  }
  return {
    ...field,
    type: 'route_link',
    routeRefFieldId,
  };
}

function getPromotedRouteLinkField(fieldById, fieldId, routeRefFieldId) {
  return promoteRouteLinkDescriptor(fieldById?.get(fieldId), routeRefFieldId);
}

function getCompactToneField(fieldById, fieldId, isVisible) {
  const toneField = fieldById?.get(fieldId);
  if (!isVisible || !toneField) {
    return null;
  }
  return {
    ...toneField,
    compact: true,
    iconOnly: true,
    swatchClassName: 'admin-button-tone-swatch-list',
  };
}

function buildInlineActionFields({
  fieldById,
  labelFieldId,
  hrefFieldId,
  routeRefFieldId,
  openInNewWindowFieldId = '',
  styleFieldId = '',
  toneFieldId = '',
  showTone = false,
} = {}) {
  return [
    labelFieldId ? fieldById?.get(labelFieldId) : null,
    hrefFieldId ? getPromotedRouteLinkField(fieldById, hrefFieldId, routeRefFieldId) : null,
    openInNewWindowFieldId ? fieldById?.get(openInNewWindowFieldId) : null,
    styleFieldId ? fieldById?.get(styleFieldId) : null,
    toneFieldId ? getCompactToneField(fieldById, toneFieldId, showTone) : null,
  ].filter(Boolean);
}

function buildHeroActionFields(fieldById, settings, buttonNumber) {
  const styleFieldId = `button${buttonNumber}Style`;
  const showTone = String(settings?.[styleFieldId] || '').trim().toLowerCase() === 'outline';

  return buildInlineActionFields({
    fieldById,
    labelFieldId: `button${buttonNumber}Label`,
    hrefFieldId: `button${buttonNumber}Url`,
    routeRefFieldId: `button${buttonNumber}PageRef`,
    openInNewWindowFieldId: `button${buttonNumber}OpenInNewWindow`,
    styleFieldId,
    toneFieldId: `button${buttonNumber}Tone`,
    showTone,
  }).map((field) => {
    const fieldId = String(field?.id || '').trim();
    if (fieldId === `button${buttonNumber}Label`) {
      return { ...field, label: 'Label', layout: 'half' };
    }
    if (fieldId === `button${buttonNumber}Url`) {
      return { ...field, label: 'Destination' };
    }
    if (fieldId === `button${buttonNumber}OpenInNewWindow`) {
      return { ...field, label: 'New window', layout: 'half' };
    }
    if (fieldId === `button${buttonNumber}Style`) {
      return { ...field, label: 'Style', layout: 'half' };
    }
    if (fieldId === `button${buttonNumber}Tone`) {
      return { ...field, label: 'Tone', layout: 'half' };
    }
    return field;
  });
}

function GridResourceLinkListEditor({
  label,
  items,
  onChange,
  routeOptions = [],
  documentOptions = [],
  addLabel = 'Add link',
  compact = false,
}) {
  const datalistId = useId();
  const rows = Array.isArray(items) ? items : [];

  return (
    <div className={`admin-grid-resource-editor${compact ? ' is-compact' : ''}`}>
      <div className="admin-grid-resource-editor-head">
        <strong>{label}</strong>
        <button
          type="button"
          className="action-btn action-btn-outline"
          onClick={() => onChange([
            ...rows,
            { label: '', kind: 'document', documentId: '', to: '', href: '', openInNewWindow: false },
          ])}
        >
          {addLabel}
        </button>
      </div>

      {rows.length ? (
        <div className="admin-grid-resource-link-list">
          {rows.map((item, index) => {
            const normalized = normalizeGridResourceLinkItem(item);
            return (
              <div key={`${label}-resource-${index}`} className="admin-grid-resource-link-card">
                <div className="admin-grid-resource-link-toprow">
                  <input
                    type="text"
                    value={normalized.label}
                    placeholder="Link label"
                    onChange={(event) => {
                      const next = [...rows];
                      next[index] = { ...normalized, label: event.target.value };
                      onChange(next);
                    }}
                  />
                  <select
                    value={normalized.kind}
                    onChange={(event) => {
                      const nextKind = event.target.value;
                      const next = [...rows];
                      next[index] = {
                        label: normalized.label,
                        kind: nextKind,
                        documentId: '',
                        to: '',
                        href: '',
                        openInNewWindow: false,
                      };
                      onChange(next);
                    }}
                  >
                    {GRID_RESOURCE_LINK_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="admin-highlight-remove-btn"
                    onClick={() => onChange(rows.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    Remove
                  </button>
                </div>

                {normalized.kind === 'document' ? (
                  <select
                    value={normalized.documentId}
                    onChange={(event) => {
                      const next = [...rows];
                      next[index] = { ...normalized, documentId: event.target.value };
                      onChange(next);
                    }}
                  >
                    <option value="">Select document</option>
                    {documentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : null}

                {normalized.kind === 'internal' ? (
                  <>
                    <input
                      list={datalistId}
                      type="text"
                      value={normalized.to}
                      placeholder="/page-path"
                      onChange={(event) => {
                        const next = [...rows];
                        next[index] = { ...normalized, to: event.target.value };
                        onChange(next);
                      }}
                    />
                    <datalist id={datalistId}>
                      {routeOptions.map((option) => (
                        <option key={`route-${option.path}`} value={option.path}>{option.title}</option>
                      ))}
                    </datalist>
                  </>
                ) : null}

                {normalized.kind === 'external' ? (
                  <input
                    type="text"
                    value={normalized.href}
                    placeholder="https://..."
                    onChange={(event) => {
                      const next = [...rows];
                      next[index] = { ...normalized, href: event.target.value };
                      onChange(next);
                    }}
                  />
                ) : null}

                {normalized.kind !== 'internal' ? (
                  <label className="admin-grid-resource-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(normalized.openInNewWindow)}
                      onChange={(event) => {
                        const next = [...rows];
                        next[index] = { ...normalized, openInNewWindow: event.target.checked };
                        onChange(next);
                      }}
                    />
                    <span>Open in new window</span>
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="admin-grid-resource-empty">No links added.</p>
      )}
    </div>
  );
}

function GridResourceAccordionEditor({
  value,
  onChange,
  routeOptions = [],
  documentOptions = [],
}) {
  const accordions = Array.isArray(value) ? value : [];

  return (
    <div className="admin-grid-resource-editor">
      <div className="admin-grid-resource-editor-head">
        <strong>Accordion groups</strong>
        <button
          type="button"
          className="action-btn action-btn-outline"
          onClick={() => onChange([...accordions, { title: '', links: [] }])}
        >
          Add accordion
        </button>
      </div>

      {accordions.length ? (
        <div className="admin-grid-accordion-list">
          {accordions.map((accordion, index) => (
            <div key={`accordion-${index}`} className="admin-grid-accordion-card">
              <div className="admin-grid-resource-link-toprow">
                <input
                  type="text"
                  value={accordion.title || ''}
                  placeholder="Accordion heading"
                  onChange={(event) => {
                    const next = [...accordions];
                    next[index] = { ...accordion, title: event.target.value };
                    onChange(next);
                  }}
                />
                <button
                  type="button"
                  className="admin-highlight-remove-btn"
                  onClick={() => onChange(accordions.filter((_, accordionIndex) => accordionIndex !== index))}
                >
                  Remove
                </button>
              </div>

              <GridResourceLinkListEditor
                label="Accordion links"
                items={accordion.links}
                onChange={(nextLinks) => {
                  const next = [...accordions];
                  next[index] = { ...accordion, links: nextLinks };
                  onChange(next);
                }}
                routeOptions={routeOptions}
                documentOptions={documentOptions}
                addLabel="Add accordion link"
                compact
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="admin-grid-resource-empty">No accordion groups added.</p>
      )}
    </div>
  );
}

function renderFieldControl(field, value, onChange, settings, onSettingChange, routeOptions = []) {
  if (field.type === 'boolean') {
    const activeValue = toBoolean(value);
    return (
      <div className="admin-boolean-pill" role="group" aria-label={field.label || 'Boolean setting'}>
        <button
          type="button"
          className={`admin-boolean-pill-option${activeValue ? ' is-active' : ''}`}
          onClick={() => onChange(true)}
        >
          On
        </button>
        <button
          type="button"
          className={`admin-boolean-pill-option${!activeValue ? ' is-active' : ''}`}
          onClick={() => onChange(false)}
        >
          Off
        </button>
      </div>
    );
  }

  if (field.type === 'number') {
    const min = Number.isFinite(Number(field.min)) ? Number(field.min) : undefined;
    const max = Number.isFinite(Number(field.max)) ? Number(field.max) : undefined;
    const step = Number.isFinite(Number(field.step)) ? Number(field.step) : 'any';
    return (
      <AdminNumberInput
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
      />
    );
  }

  if (field.type === 'select') {
    const options = Array.isArray(field.options) ? field.options : [];
    if (field.id === 'justify') {
      return (
        <JustifyPillControl
          label={field.label}
          value={value ?? 'center'}
          options={options}
          onChange={onChange}
        />
      );
    }

    return (
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'swatch') {
    const options = Array.isArray(field.options) ? field.options : [];
    const selectedValue = value ?? '';
    const swatchClassName = String(field.swatchClassName || '');
    const useCompactPalette = field.compact !== false;
    const useIconOnlyPalette = field.iconOnly !== false;
    const usesBgPaletteStyle = swatchClassName.includes('admin-button-tone-swatch-list')
      || swatchClassName.includes('admin-intro-bg-palette-swatch-list')
      || swatchClassName.includes('admin-control-swatch-palette');
    return (
      <ColorPalette
        variant="admin"
        className={`${useCompactPalette ? ' is-compact' : ''}${useIconOnlyPalette ? ' is-icon-only' : ''}${swatchClassName ? ` ${swatchClassName}` : ''}`}
        ariaLabel={field.label}
        options={options}
        value={selectedValue}
        onChange={(nextValue) => onChange(nextValue)}
        getOptionClassName={(option, state) => {
          const optionToken = String(option.value || '').trim().toLowerCase();
          const isWhiteTone = optionToken === 'white';
          return `${usesBgPaletteStyle ? ' admin-bg-swatch-option' : ''}${state.active ? ' is-active' : ''}${isWhiteTone ? ' is-white-tone' : ''}${option.value === '' ? ' is-clear' : ''}`;
        }}
        getOptionShortLabel={(option) => (useCompactPalette ? (option.shortLabel || option.label) : option.label)}
        hideSwatchForOption={(option) => Boolean(option.hideSwatch)}
      />
    );
  }

  if (field.type === 'highlight_list') {
    const options = Array.isArray(field.options) ? field.options : [];
    const selectedItems = parseHighlightListValue(value);
    const items = selectedItems.length ? selectedItems : [];

    const updateItems = (nextItems) => {
      onChange(serializeHighlightListValue(nextItems));
    };

    return (
      <div className="admin-highlight-list-editor">
        {items.map((item, index) => (
          <div key={`${field.id}-highlight-${index}`} className="admin-highlight-list-row">
            <input
              type="text"
              value={item.text}
              placeholder="Highlighted word or phrase"
              onChange={(event) => {
                const nextItems = [...items];
                nextItems[index] = { ...nextItems[index], text: event.target.value };
                updateItems(nextItems);
              }}
            />
            <ColorPalette
              variant="admin"
              className="is-compact is-icon-only admin-highlight-color-swatches"
              ariaLabel={`${field.label} color ${index + 1}`}
              options={options}
              value={item.className || ''}
              preventMouseDown
              onChange={(nextValue) => {
                const nextItems = [...items];
                nextItems[index] = { ...nextItems[index], className: nextValue };
                updateItems(nextItems);
              }}
              getOptionClassName={(option, state) => `admin-highlight-swatch-btn${state.active ? ' is-active' : ''}`}
              getOptionLabel={(option) => option.label}
              getOptionShortLabel={(option) => option.shortLabel || option.label}
            />
            <button
              type="button"
              className="admin-highlight-remove-btn"
              onClick={() => {
                const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
                updateItems(nextItems);
              }}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="admin-highlight-list-actions">
          <button
            type="button"
            className="action-btn action-btn-outline"
            onClick={() => {
              const defaultColor = options[0]?.value || 'is-atlantean';
              updateItems([...items, { text: '', className: defaultColor }]);
            }}
          >
            Add highlight
          </button>
          <span className="admin-highlight-list-help">Multiple words/phrases are supported, including punctuation like ".". Order matters.</span>
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        rows={field.rows || 4}
        value={value ?? ''}
        placeholder={field.placeholder || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === 'html') {
    return (
      <AdminHtmlEditor
        value={value ?? ''}
        onChange={onChange}
        placeholder={field.placeholder || 'Start writing...'}
      />
    );
  }

  if (field.type === 'route_link') {
    const routeRefFieldId = String(field.routeRefFieldId || '').trim();
    return (
      <RouteLinkField
        value={value}
        routeRefValue={routeRefFieldId ? settings?.[routeRefFieldId] : ''}
        onChange={onChange}
        onRouteRefChange={routeRefFieldId ? (nextValue) => onSettingChange(routeRefFieldId, nextValue) : undefined}
        routeOptions={routeOptions}
      />
    );
  }

  return <input type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
}

function FieldControlGrid({ fields, settings, onSettingChange, className = '', routeOptions = [] }) {
  const items = Array.isArray(fields) ? fields.filter(Boolean) : [];
  if (!items.length) {
    return null;
  }

  return (
    <div className={`admin-content-field-list${className ? ` ${className}` : ''}`}>
      {items.map((field) => (
        <label key={field.id} className={field.layout === 'half' ? 'is-half' : undefined}>
          <span>{field.label}</span>
          {renderFieldControl(
            field,
            settings?.[field.id],
            (nextValue) => {
              onSettingChange(field.id, nextValue);
            },
            settings,
            onSettingChange,
            routeOptions,
          )}
        </label>
      ))}
    </div>
  );
}

function PanelAppearanceControls({
  fields,
  settings,
  onSettingChange,
  className = '',
  compactSwatches = true,
}) {
  const items = (Array.isArray(fields) ? fields : [])
    .filter(Boolean)
    .map((field) => (
      field.type === 'swatch' && compactSwatches
        ? { ...field, compact: true }
        : field
    ));
  if (!items.length) {
    return null;
  }

  return (
    <section className={`admin-panel-appearance${className ? ` ${className}` : ''}`}>
      <FieldControlGrid
        fields={items}
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-content-field-list--inline admin-panel-appearance-grid"
      />
    </section>
  );
}

function toEditorHtml(value, fallbackText = '') {
  const source = String(value || '').trim();
  if (source) {
    return source;
  }
  const text = String(fallbackText || '').trim();
  if (!text) {
    return '<p></p>';
  }
  const escaped = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return `<p>${escaped}</p>`;
}

function EditorButtonPreview({ buttons }) {
  const items = Array.isArray(buttons) ? buttons : [];
  const visible = items
    .map((item, index) => {
      const label = String(item?.label || '').trim() || `Button ${index + 1}`;
      const style = normalizeActionButtonStyleToken(item?.style);
      const defaultTone = style === 'dark' ? 'super-grey' : 'atlantean';
      const tone = style === 'outline'
        ? normalizeActionButtonToneToken(item?.tone, defaultTone)
        : defaultTone;
      const className = [
        'service-native-btn',
        style === 'outline' ? 'is-outline' : '',
        `is-tone-${tone}`,
      ].filter(Boolean).join(' ');
      return { label, className };
    });

  return (
    <div className="admin-button-preview-wrap" aria-label="Button preview">
      <span className="admin-button-preview-label">Button preview</span>
      <div className="admin-button-preview-row">
        {visible.map((item, index) => (
          <span key={`btn-preview-${index}`} className={item.className}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

export function CtaFormBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const ctaBgTone = normalizePanelBgTone(settings.bgTone);
  const configFields = pickFieldDescriptors(fieldById, getSharedFormConfigFieldIds());
  const {
    draftValues: ctaFormDraftValues,
    updateDraftField: updateCtaFormDraftField,
    commitDraftOnBlur: commitCtaFormDraftOnBlur,
  } = useBufferedStringFieldDrafts({
    settings,
    onSettingChange,
    fieldIds: ['bodyHtml'],
  });
  const ctaFormDraftSettings = useMemo(() => ({
    ...settings,
    ...ctaFormDraftValues,
  }), [ctaFormDraftValues, settings]);
  const externalCtaFields = useMemo(
    () => extractCtaFormFields(settings),
    [settings],
  );
  const serializedExternalCtaFields = useMemo(
    () => JSON.stringify(externalCtaFields),
    [externalCtaFields],
  );
  const [ctaFields, setCtaFields] = useState(externalCtaFields);
  const [hasDirtyCtaFields, setHasDirtyCtaFields] = useState(false);
  const ctaFieldsRef = useRef(externalCtaFields);
  const ctaFieldCommitTimerRef = useRef(null);
  const canAddCtaField = ctaFields.length < CTA_FORM_MAX_FIELDS;

  useEffect(() => {
    ctaFieldsRef.current = ctaFields;
  }, [ctaFields]);

  useEffect(() => () => {
    if (ctaFieldCommitTimerRef.current) {
      window.clearTimeout(ctaFieldCommitTimerRef.current);
      ctaFieldCommitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasDirtyCtaFields) {
      setCtaFields(externalCtaFields);
      ctaFieldsRef.current = externalCtaFields;
      return;
    }

    if (JSON.stringify(ctaFieldsRef.current) === serializedExternalCtaFields) {
      setHasDirtyCtaFields(false);
    }
  }, [externalCtaFields, hasDirtyCtaFields, serializedExternalCtaFields]);

  const clearScheduledCtaFieldCommit = () => {
    if (!ctaFieldCommitTimerRef.current) {
      return;
    }
    window.clearTimeout(ctaFieldCommitTimerRef.current);
    ctaFieldCommitTimerRef.current = null;
  };

  const commitCtaFields = (nextFields) => {
    clearScheduledCtaFieldCommit();
    Object.entries(buildCtaFormSettingsPatch({
      fields: nextFields,
      includeContactPreference: settings.includeContactPreference,
    })).forEach(([fieldId, nextValue]) => {
      onSettingChange(fieldId, nextValue);
    });
  };

  const scheduleCtaFieldCommit = (nextFields) => {
    clearScheduledCtaFieldCommit();
    ctaFieldCommitTimerRef.current = window.setTimeout(() => {
      commitCtaFields(nextFields);
    }, EDITOR_LOCAL_DRAFT_COMMIT_DELAY_MS);
  };

  const updateCtaFieldDrafts = (updater, { commitImmediately = false } = {}) => {
    const currentFields = Array.isArray(ctaFieldsRef.current) ? ctaFieldsRef.current : [];
    const nextFields = typeof updater === 'function' ? updater(currentFields) : currentFields;
    ctaFieldsRef.current = nextFields;
    setCtaFields(nextFields);
    setHasDirtyCtaFields(true);
    if (commitImmediately) {
      commitCtaFields(nextFields);
      return;
    }
    scheduleCtaFieldCommit(nextFields);
  };

  const commitCtaFieldDraftsOnBlur = () => {
    commitCtaFields(ctaFieldsRef.current);
  };

  const ctaFieldTypeOptions = CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS;
  const ctaFieldTypeLabelByValue = new Map(
    ctaFieldTypeOptions.map((option) => [String(option.value || ''), String(option.label || option.value || '')]),
  );

  return (
    <div className="admin-intro-block-editor">
      <div className="admin-dynamic-panel-primary-grid admin-dynamic-panel-primary-grid--intro">
        <div className="admin-intro-editor-main admin-intro-editor-main--cta">
          <ColorTextSelectionEditor
            label="CTA form heading"
            text={settings.title ?? ''}
            lineClassName={settings.titleClassName ?? ''}
            highlightsJson={settings.titleHighlightsJson ?? ''}
            onTextChange={(nextValue) => onSettingChange('title', nextValue)}
            onLineClassNameChange={(nextValue) => onSettingChange('titleClassName', nextValue)}
            onHighlightsJsonChange={(nextValue) => onSettingChange('titleHighlightsJson', nextValue)}
            placeholder="CTA form heading"
            rows={2}
            className="is-intro-heading"
            unifiedPreviewEditor
            previewWrapClassName={`is-bg-${ctaBgTone}`}
            spanDetailsUnderToggle
            useResetForClear
          />
        </div>

        <div className="admin-intro-appearance-stack">
          {bgToneField ? (
            <section className="admin-panel-appearance admin-panel-appearance--intro-text admin-panel-appearance--intro-bg">
              <div className="admin-content-field-list admin-content-field-list--inline admin-panel-appearance-grid">
                <label>
                  <span>{bgToneField.label || 'Background color'}</span>
                  <ColorPalette
                    variant="admin"
                    className="is-compact admin-hero-inline-swatch-list is-icon-only admin-intro-bg-palette-swatch-list"
                    ariaLabel={bgToneField.label || 'CTA background'}
                    options={Array.isArray(bgToneField.options) ? bgToneField.options : []}
                    value={String(settings.bgTone || '')}
                    preventMouseDown
                    onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
                    getOptionClassName={(option, state) => ` admin-bg-swatch-option${state.active ? ' is-active' : ''}`}
                  />
                </label>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <DraftBackedFieldControlGrid
        fields={configFields}
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-content-field-list--inline"
        routeOptions={routeOptions}
        draftFieldIds={CTA_FORM_GRID_LOCAL_DRAFT_FIELD_IDS}
      />

      <section className="admin-panel-appearance admin-panel-appearance--intro-text">
        <div className="admin-content-field-list admin-content-field-list--inline">
          <label>
            <span>Lead Copy</span>
            <AdminHtmlEditor
              compact
              value={toEditorHtml(ctaFormDraftSettings.bodyHtml)}
              onChange={(nextValue) => updateCtaFormDraftField('bodyHtml', nextValue)}
              onBlur={() => commitCtaFormDraftOnBlur('bodyHtml')}
              placeholder="Optional lead copy above the form"
            />
          </label>
        </div>
      </section>

      <div className="admin-cta-field-slots admin-request-form-step-list">
        <section className="admin-cta-field-slot-card">
          <div className="admin-grid-card-slot-head">
            <div>
              <h4>Field Builder</h4>
              <p className="admin-cta-field-summary-copy">
                Configure a short CTA form with up to {CTA_FORM_MAX_FIELDS} fields.
              </p>
            </div>
            <button
              type="button"
              className="admin-cta-slot-add"
              onClick={() => updateCtaFieldDrafts((current) => ([
                ...current,
                createCtaFormFieldDraft(current.length + 1),
              ]), { commitImmediately: true })}
              disabled={!canAddCtaField}
            >
              Add field
            </button>
          </div>
          <label className="admin-content-checkbox-row admin-content-checkbox-row--request-form">
            <input
              type="checkbox"
              checked={Boolean(settings.includeContactPreference)}
              onChange={(event) => onSettingChange('includeContactPreference', event.target.checked)}
            />
            <span>Ask for contact preference</span>
          </label>
          {settings.includeContactPreference ? (
            <p className="admin-cta-field-summary-copy">
              Adds a standard “Preferred contact method” dropdown after the main contact fields.
            </p>
          ) : null}
        </section>

        {ctaFields.map((field, index) => {
          const type = String(field.type || 'text').trim().toLowerCase() || 'text';
          const showOptions = type === 'select';
          const typeLabel = ctaFieldTypeLabelByValue.get(type) || type;
          return (
            <section key={`cta-field-${field.id || index + 1}`} className="admin-cta-field-slot-card admin-request-form-step-field">
              <div className="admin-grid-card-slot-head">
                <div>
                  <h4>{String(field.label || `Field ${index + 1}`).trim() || `Field ${index + 1}`}</h4>
                  <p className="admin-cta-field-summary-copy">
                    {[typeLabel, field.required ? 'Required' : 'Optional', `Field key: ${String(field.id || '').trim() || `field_${index + 1}`}`].join(' · ')}
                  </p>
                </div>
                <div className="admin-layer-order-controls">
                  <button
                    type="button"
                    className="admin-layer-order-btn"
                    aria-label={`Move field ${index + 1} up`}
                    onClick={() => updateCtaFieldDrafts((current) => {
                      if (index === 0) {
                        return current;
                      }
                      const next = [...current];
                      const [movedField] = next.splice(index, 1);
                      next.splice(index - 1, 0, movedField);
                      return next;
                    }, { commitImmediately: true })}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-layer-order-btn"
                    aria-label={`Move field ${index + 1} down`}
                    onClick={() => updateCtaFieldDrafts((current) => {
                      if (index >= current.length - 1) {
                        return current;
                      }
                      const next = [...current];
                      const [movedField] = next.splice(index, 1);
                      next.splice(index + 1, 0, movedField);
                      return next;
                    }, { commitImmediately: true })}
                    disabled={index >= ctaFields.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>

              <div className="admin-content-field-list admin-content-field-list--inline">
                <label>
                  <span>{`Field ${index + 1} label`}</span>
                  <input
                    type="text"
                    value={String(field.label || '')}
                    onChange={(event) => updateCtaFieldDrafts((current) => current.map((entry, itemIndex) => (
                      itemIndex === index ? { ...entry, label: event.target.value } : entry
                    )))}
                    onBlur={commitCtaFieldDraftsOnBlur}
                  />
                </label>
                <label>
                  <span>{`Field ${index + 1} key`}</span>
                  <input
                    type="text"
                    value={String(field.id || '')}
                    onChange={(event) => updateCtaFieldDrafts((current) => current.map((entry, itemIndex) => (
                      itemIndex === index ? { ...entry, id: event.target.value } : entry
                    )))}
                    onBlur={commitCtaFieldDraftsOnBlur}
                  />
                </label>
                <label>
                  <span>{`Field ${index + 1} type`}</span>
                  <select
                    value={type}
                    onChange={(event) => updateCtaFieldDrafts((current) => current.map((entry, itemIndex) => (
                      itemIndex === index
                        ? {
                            ...entry,
                            type: event.target.value,
                            optionsText: event.target.value === 'select' ? String(entry.optionsText || '') : '',
                            placeholder: event.target.value === 'checkbox' ? '' : String(entry.placeholder || ''),
                          }
                        : entry
                    )), { commitImmediately: true })}
                  >
                    {ctaFieldTypeOptions.map((option) => (
                      <option key={`cta-field-type-${option.value}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <div className="admin-request-form-step-field-behavior">
                  <span className="admin-request-form-step-field-behavior-label">Field behavior</span>
                  <div className="admin-request-form-step-field-behavior-toggles">
                    <label className="admin-content-checkbox-row admin-content-checkbox-row--request-form">
                      <input
                        type="checkbox"
                        checked={Boolean(field.required)}
                        onChange={(event) => updateCtaFieldDrafts((current) => current.map((entry, itemIndex) => (
                          itemIndex === index ? { ...entry, required: event.target.checked } : entry
                        )), { commitImmediately: true })}
                      />
                      <span>Required</span>
                    </label>
                  </div>
                </div>
                <label>
                  <span>{`Field ${index + 1} placeholder`}</span>
                  <input
                    type="text"
                    value={String(field.placeholder || '')}
                    onChange={(event) => updateCtaFieldDrafts((current) => current.map((entry, itemIndex) => (
                      itemIndex === index ? { ...entry, placeholder: event.target.value } : entry
                    )))}
                    onBlur={commitCtaFieldDraftsOnBlur}
                    disabled={type === 'checkbox'}
                  />
                </label>
                {showOptions ? (
                  <label className="is-full">
                    <span>{`Field ${index + 1} options`}</span>
                    <textarea
                      rows={4}
                      value={String(field.optionsText || '')}
                      onChange={(event) => updateCtaFieldDrafts((current) => current.map((entry, itemIndex) => (
                        itemIndex === index ? { ...entry, optionsText: event.target.value } : entry
                      )))}
                      onBlur={commitCtaFieldDraftsOnBlur}
                      placeholder={'option-value|Option label\noption-two|Option two'}
                    />
                  </label>
                ) : null}
              </div>

              <button
                type="button"
                className="admin-cta-slot-remove"
                onClick={() => updateCtaFieldDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index), { commitImmediately: true })}
              >
                Remove field
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function parseRequestFormFieldOptionsText(value) {
  return parseFormChoiceOptionsText(value);
}

function formatRequestFormFieldOptionsText(options) {
  return formatFormChoiceOptionsText(options);
}

function parseRequestFormStepFieldsJson(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((field, index) => {
      const normalizedType = normalizeRequestFormFieldType(field?.type);
      const options = Array.isArray(field?.options) ? field.options : [];
      return {
        id: String(field?.id || '').trim() || `field${index + 1}`,
        label: String(field?.label || '').trim(),
        type: normalizedType,
        required: Boolean(field?.required),
        placeholder: String(field?.placeholder || '').trim(),
        help: String(field?.help || '').trim(),
        format: String(field?.format || '').trim(),
        maxLength: Number.isFinite(Number(field?.maxLength)) ? Number(field.maxLength) : '',
        rows: Number.isFinite(Number(field?.rows)) ? Number(field.rows) : '',
        full: Boolean(field?.full),
        options,
        optionsText: formatRequestFormFieldOptionsText(options),
      };
    });
  } catch {
    return [];
  }
}

function serializeRequestFormStepFields(fields) {
  return JSON.stringify(
    (Array.isArray(fields) ? fields : []).map((field, index) => {
      const normalizedType = normalizeRequestFormFieldType(field?.type);
      const nextField = {
        id: String(field?.id || '').trim() || `field${index + 1}`,
        label: String(field?.label || '').trim() || `Field ${index + 1}`,
        type: normalizedType,
      };
      if (field?.required) {
        nextField.required = true;
      }
      if (String(field?.placeholder || '').trim()) {
        nextField.placeholder = String(field.placeholder).trim();
      }
      if (String(field?.help || '').trim()) {
        nextField.help = String(field.help).trim();
      }
      if (String(field?.format || '').trim()) {
        nextField.format = String(field.format).trim();
      }
      if (Number.isFinite(Number(field?.maxLength)) && Number(field.maxLength) > 0) {
        nextField.maxLength = Number(field.maxLength);
      }
      if (normalizedType === 'textarea' && Number.isFinite(Number(field?.rows)) && Number(field.rows) > 0) {
        nextField.rows = Number(field.rows);
      }
      if (field?.full) {
        nextField.full = true;
      }
      if (normalizedType === 'select' || normalizedType === 'radio-group' || normalizedType === 'checkbox-group') {
        const options = parseRequestFormFieldOptionsText(field?.optionsText);
        if (options.length) {
          nextField.options = options;
        }
      }
      return nextField;
    }),
  );
}

function RequestFormStepEditor({ stepNumber, settings, onSettingChange, expanded, onToggle }) {
  const fieldsKey = `step${stepNumber}FieldsJson`;
  const titleKey = `step${stepNumber}Title`;
  const externalStepFields = useMemo(
    () => parseRequestFormStepFieldsJson(settings?.[fieldsKey]),
    [fieldsKey, settings],
  );
  const serializedExternalStepFields = useMemo(
    () => serializeRequestFormStepFields(externalStepFields),
    [externalStepFields],
  );
  const [stepFields, setStepFields] = useState(externalStepFields);
  const [hasDirtyStepFields, setHasDirtyStepFields] = useState(false);
  const stepFieldsRef = useRef(externalStepFields);
  const commitTimerRef = useRef(null);
  const summaryTitle = String(settings?.[titleKey] || '').trim() || 'Untitled step';
  const summaryMeta = `${stepFields.length} ${stepFields.length === 1 ? 'field' : 'fields'}`;

  useEffect(() => {
    stepFieldsRef.current = stepFields;
  }, [stepFields]);

  useEffect(() => () => {
    if (commitTimerRef.current) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasDirtyStepFields) {
      setStepFields(externalStepFields);
      stepFieldsRef.current = externalStepFields;
      return;
    }

    if (serializeRequestFormStepFields(stepFieldsRef.current) === serializedExternalStepFields) {
      setHasDirtyStepFields(false);
    }
  }, [externalStepFields, hasDirtyStepFields, serializedExternalStepFields]);

  const clearScheduledCommit = () => {
    if (!commitTimerRef.current) {
      return;
    }
    window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
  };

  const commitStepFields = (nextFields) => {
    clearScheduledCommit();
    onSettingChange(fieldsKey, serializeRequestFormStepFields(nextFields));
  };

  const scheduleStepFieldCommit = (nextFields) => {
    clearScheduledCommit();
    commitTimerRef.current = window.setTimeout(() => {
      commitStepFields(nextFields);
    }, EDITOR_LOCAL_DRAFT_COMMIT_DELAY_MS);
  };

  const updateStepFieldDrafts = (updater, { commitImmediately = false } = {}) => {
    const currentFields = Array.isArray(stepFieldsRef.current) ? stepFieldsRef.current : [];
    const nextFields = typeof updater === 'function' ? updater(currentFields) : currentFields;
    stepFieldsRef.current = nextFields;
    setStepFields(nextFields);
    setHasDirtyStepFields(true);
    if (commitImmediately) {
      commitStepFields(nextFields);
      return;
    }
    scheduleStepFieldCommit(nextFields);
  };

  const commitStepFieldDraftsOnBlur = () => {
    commitStepFields(stepFieldsRef.current);
  };

  return (
    <section className={`admin-cta-field-slot-card admin-request-form-step-card${expanded ? ' is-expanded' : ' is-collapsed'}`}>
      <button
        type="button"
        className="admin-request-form-step-toggle"
        onClick={() => onToggle(stepNumber)}
        aria-expanded={expanded}
      >
        <span className="admin-request-form-step-toggle-copy">
          <span className="admin-request-form-step-kicker">{`Step ${stepNumber}`}</span>
          <span className="admin-request-form-step-toggle-title">{summaryTitle}</span>
        </span>
        <span className="admin-request-form-step-toggle-meta">{summaryMeta}</span>
      </button>

      {expanded ? (
        <>
          <div className="admin-request-form-step-fields">
            {stepFields.map((field, index) => {
              const type = normalizeRequestFormFieldType(field.type);
              const showOptions = type === 'select' || type === 'radio-group' || type === 'checkbox-group';
              const showRows = type === 'textarea';
              return (
                <div key={`request-step-${stepNumber}-field-${field.id || index + 1}`} className="admin-request-form-step-field">
                  <div className="admin-content-field-list admin-content-field-list--inline">
                    <label>
                      <span>{`Step ${stepNumber} field ${index + 1} label`}</span>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                          itemIndex === index ? { ...entry, label: event.target.value } : entry
                        )))}
                        onBlur={commitStepFieldDraftsOnBlur}
                      />
                    </label>
                    <label>
                      <span>{`Step ${stepNumber} field ${index + 1} ID`}</span>
                      <input
                        type="text"
                        value={field.id}
                        onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                          itemIndex === index ? { ...entry, id: event.target.value } : entry
                        )))}
                        onBlur={commitStepFieldDraftsOnBlur}
                      />
                    </label>
                    <label>
                      <span>{`Step ${stepNumber} field ${index + 1} type`}</span>
                      <select
                        value={type}
                        onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                          itemIndex === index
                            ? {
                                ...entry,
                                type: event.target.value,
                                rows: event.target.value === 'textarea' ? (entry.rows || 3) : '',
                                optionsText: ['select', 'radio-group', 'checkbox-group'].includes(event.target.value)
                                  ? entry.optionsText
                                  : '',
                              }
                            : entry
                        )), { commitImmediately: true })}
                      >
                        {REQUEST_FORM_STEP_FIELD_TYPE_OPTIONS.map((option) => (
                          <option key={`request-step-type-${option.value}`} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <div className="admin-request-form-step-field-behavior">
                      <span className="admin-request-form-step-field-behavior-label">Field behavior</span>
                      <div className="admin-request-form-step-field-behavior-toggles">
                        <label className="admin-content-checkbox-row admin-content-checkbox-row--request-form">
                          <input
                            type="checkbox"
                            checked={Boolean(field.required)}
                            onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                              itemIndex === index ? { ...entry, required: event.target.checked } : entry
                            )), { commitImmediately: true })}
                          />
                          <span>Required</span>
                        </label>
                        <label className="admin-content-checkbox-row admin-content-checkbox-row--request-form">
                          <input
                            type="checkbox"
                            checked={Boolean(field.full)}
                            onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                              itemIndex === index ? { ...entry, full: event.target.checked } : entry
                            )), { commitImmediately: true })}
                          />
                          <span>Full width</span>
                        </label>
                      </div>
                    </div>
                    <label>
                      <span>{`Step ${stepNumber} field ${index + 1} placeholder`}</span>
                      <input
                        type="text"
                        value={field.placeholder}
                        onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                          itemIndex === index ? { ...entry, placeholder: event.target.value } : entry
                        )))}
                        onBlur={commitStepFieldDraftsOnBlur}
                      />
                    </label>
                    <label>
                      <span>{`Step ${stepNumber} field ${index + 1} help`}</span>
                      <input
                        type="text"
                        value={field.help}
                        onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                          itemIndex === index ? { ...entry, help: event.target.value } : entry
                        )))}
                        onBlur={commitStepFieldDraftsOnBlur}
                      />
                    </label>
                    <label>
                      <span>{`Step ${stepNumber} field ${index + 1} format`}</span>
                      <select
                        value={field.format || ''}
                        onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                          itemIndex === index ? { ...entry, format: event.target.value } : entry
                        )), { commitImmediately: true })}
                      >
                        {REQUEST_FORM_STEP_FIELD_FORMAT_OPTIONS.map((option) => (
                          <option key={`request-step-format-${option.value || 'none'}`} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>{`Step ${stepNumber} field ${index + 1} max length`}</span>
                      <input
                        type="number"
                        min="0"
                        value={field.maxLength}
                        onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                          itemIndex === index ? { ...entry, maxLength: event.target.value } : entry
                        )), { commitImmediately: true })}
                      />
                    </label>
                    {showRows ? (
                      <label>
                        <span>{`Step ${stepNumber} field ${index + 1} rows`}</span>
                        <input
                          type="number"
                          min="2"
                          value={field.rows}
                          onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                            itemIndex === index ? { ...entry, rows: event.target.value } : entry
                          )), { commitImmediately: true })}
                        />
                      </label>
                    ) : null}
                    {showOptions ? (
                      <label className="is-full">
                        <span>{`Step ${stepNumber} field ${index + 1} options`}</span>
                        <textarea
                          rows={4}
                          value={field.optionsText}
                          onChange={(event) => updateStepFieldDrafts((current) => current.map((entry, itemIndex) => (
                            itemIndex === index ? { ...entry, optionsText: event.target.value } : entry
                          )))}
                          onBlur={commitStepFieldDraftsOnBlur}
                        />
                      </label>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="admin-cta-slot-remove"
                    onClick={() => updateStepFieldDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index), { commitImmediately: true })}
                  >
                    Remove field
                  </button>
                </div>
              );
            })}
          </div>

          <div className="admin-request-form-step-actions">
            <button
              type="button"
              className="admin-cta-slot-add"
              onClick={() => updateStepFieldDrafts((current) => [
                ...current,
                {
                  id: `field${current.length + 1}`,
                  label: `Field ${current.length + 1}`,
                  type: 'text',
                  required: false,
                  placeholder: '',
                  help: '',
                  format: '',
                  maxLength: '',
                  rows: '',
                  full: false,
                  optionsText: '',
                },
              ], { commitImmediately: true })}
            >
              Add field
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function createRequestFormStepFieldDraft(fieldNumber) {
  return {
    id: `field${fieldNumber}`,
    label: `Field ${fieldNumber}`,
    type: 'text',
    required: false,
    placeholder: '',
    help: '',
    format: '',
    maxLength: '',
    rows: '',
    full: false,
    optionsText: '',
  };
}

export function RequestFormBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const titleColorField = fieldById.get('titleClassName') || null;
  const bgToneField = fieldById.get('bgTone') || null;
  const textToneField = fieldById.get('textTone') || null;
  const requestBgTone = normalizePanelBgTone(settings.bgTone);
  const requestTextTone = normalizePanelTextTone(settings.textTone, 'dark');
  const spacingFields = ['spaceBeforeRem', 'spaceAfterRem']
    .map((id) => fieldById.get(id))
    .filter(Boolean);
  const configFields = pickFieldDescriptors(fieldById, getSharedFormConfigFieldIds());
  const requestTitleColorOptions = Array.isArray(titleColorField?.options) && titleColorField.options.length
    ? titleColorField.options
    : HERO_SWATCH_OPTIONS;
  const {
    draftValues: requestFormDraftValues,
    updateDraftField: updateRequestFormDraftField,
    commitDraftOnBlur: commitRequestFormDraftOnBlur,
  } = useBufferedStringFieldDrafts({
    settings,
    onSettingChange,
    fieldIds: ['subtitle'],
  });
  const requestFormDraftSettings = useMemo(() => ({
    ...settings,
    ...requestFormDraftValues,
  }), [requestFormDraftValues, settings]);
  const visibleStepNumbers = [1, 2, 3, 4, 5].filter((stepNumber) => (
    parseRequestFormStepFieldsJson(settings?.[`step${stepNumber}FieldsJson`]).length > 0
  ));
  const nextStepNumber = [1, 2, 3, 4, 5].find((stepNumber) => !visibleStepNumbers.includes(stepNumber)) || null;
  const [expandedSteps, setExpandedSteps] = useState(() => new Set(visibleStepNumbers));

  useEffect(() => {
    setExpandedSteps((current) => {
      const next = new Set();
      visibleStepNumbers.forEach((stepNumber) => {
        if (current.has(stepNumber) || visibleStepNumbers.length <= 3) {
          next.add(stepNumber);
        }
      });
      if (!next.size && visibleStepNumbers.length) {
        next.add(visibleStepNumbers[0]);
      }
      return next;
    });
  }, [settings?.step1FieldsJson, settings?.step2FieldsJson, settings?.step3FieldsJson, settings?.step4FieldsJson, settings?.step5FieldsJson]);

  return (
    <div className="admin-intro-block-editor admin-request-form-editor">
      <div className="admin-dynamic-panel-primary-grid admin-dynamic-panel-primary-grid--intro admin-request-form-primary-grid">
        <div className="admin-intro-editor-main admin-request-form-editor-main">
          <ColorTextSelectionEditor
            label="Form heading"
            text={settings.title ?? ''}
            lineClassName={settings.titleClassName ?? ''}
            highlightsJson={settings.titleHighlightsJson ?? ''}
            onTextChange={(nextValue) => onSettingChange('title', nextValue)}
            onLineClassNameChange={(nextValue) => onSettingChange('titleClassName', nextValue)}
            onHighlightsJsonChange={(nextValue) => onSettingChange('titleHighlightsJson', nextValue)}
            placeholder="Request form heading"
            rows={2}
            className="is-intro-heading"
            unifiedPreviewEditor
            previewClassName={getPanelTextTonePreviewClassName(requestTextTone, 'dark')}
            previewWrapClassName={`is-bg-${requestBgTone}`}
            spanDetailsUnderToggle
            useResetForClear
            swatchOptions={requestTitleColorOptions}
          />
          <label className="admin-front-hud-field admin-request-form-lead-field">
            <span>Lead Copy</span>
            <textarea
              rows={3}
              value={String(requestFormDraftSettings.subtitle || '')}
              onChange={(event) => updateRequestFormDraftField('subtitle', event.target.value)}
              onBlur={() => commitRequestFormDraftOnBlur('subtitle')}
            />
          </label>
        </div>

        <div className="admin-intro-appearance-stack admin-request-form-appearance-stack">
          <section className="admin-panel-appearance admin-panel-appearance--intro-text admin-request-form-appearance-panel">
            <div className="admin-request-form-swatch-groups">
              {bgToneField ? (
                <label className="admin-request-form-swatch-group">
                  <span>{bgToneField.label || 'Background color'}</span>
                  <ColorPalette
                    variant="admin"
                    className="is-compact admin-hero-inline-swatch-list is-icon-only admin-intro-bg-palette-swatch-list admin-request-form-swatch-palette"
                    ariaLabel={bgToneField.label || 'Request form background'}
                    options={Array.isArray(bgToneField.options) ? bgToneField.options : []}
                    value={String(settings.bgTone || '')}
                    preventMouseDown
                    onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
                    getOptionClassName={(option, state) => ` admin-bg-swatch-option${state.active ? ' is-active' : ''}`}
                  />
                </label>
              ) : null}

              {textToneField ? (
                <label className="admin-request-form-swatch-group">
                  <span>{textToneField.label || 'Text color'}</span>
                  <ColorPalette
                    variant="admin"
                    className="is-compact admin-hero-inline-swatch-list is-icon-only admin-intro-bg-palette-swatch-list admin-request-form-swatch-palette"
                    ariaLabel={textToneField.label || 'Request form text color'}
                    options={Array.isArray(textToneField.options) ? textToneField.options : []}
                    value={String(settings.textTone || '')}
                    preventMouseDown
                    onChange={(nextValue) => onSettingChange('textTone', nextValue)}
                  />
                </label>
              ) : null}
            </div>

            {spacingFields.length ? (
              <details className="admin-request-form-spacing-details">
                <summary>Spacing</summary>
                <div className="admin-request-form-spacing-grid">
                  {spacingFields.map((field) => {
                    const currentValue = Number.isFinite(Number(settings?.[field.id])) ? Number(settings[field.id]) : 0;
                    return (
                      <label key={`request-form-spacing-${field.id}`} className="admin-request-form-spacing-control">
                        <span>{field.label}</span>
                        <div className="admin-hero-inline-height-row">
                          <input
                            type="range"
                            min={Number(field.min) || 0}
                            max={Number(field.max) || 8}
                            step={Number(field.step) || 0.25}
                            value={currentValue}
                            onChange={(event) => onSettingChange(field.id, Number(event.target.value))}
                            aria-label={field.label}
                          />
                          <input
                            className="admin-hero-inline-height-number"
                            type="number"
                            min={Number(field.min) || 0}
                            max={Number(field.max) || 8}
                            step={Number(field.step) || 0.25}
                            value={currentValue}
                            onChange={(event) => onSettingChange(field.id, Number(event.target.value))}
                            aria-label={`${field.label} number`}
                          />
                          <span className="admin-hero-inline-height-unit">rem</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </details>
            ) : null}
          </section>
        </div>
      </div>

      {configFields.length ? (
        <details className="admin-request-form-config-details">
          <summary>Form behavior</summary>
          <DraftBackedFieldControlGrid
            fields={configFields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            draftFieldIds={REQUEST_FORM_CONFIG_LOCAL_DRAFT_FIELD_IDS}
          />
        </details>
      ) : null}

      <div className="admin-cta-field-slots admin-request-form-step-list">
        {visibleStepNumbers.map((stepNumber) => (
          <RequestFormStepEditor
            key={`request-form-step-${stepNumber}`}
            stepNumber={stepNumber}
            settings={settings}
            onSettingChange={onSettingChange}
            expanded={expandedSteps.has(stepNumber)}
            onToggle={(nextStep) => setExpandedSteps((current) => {
              const next = new Set(current);
              if (next.has(nextStep)) {
                next.delete(nextStep);
              } else {
                next.add(nextStep);
              }
              return next;
            })}
          />
        ))}
      </div>
      {nextStepNumber ? (
        <div className="admin-request-form-step-actions">
          <button
            type="button"
            className="admin-cta-slot-add"
            onClick={() => {
              const fieldsKey = `step${nextStepNumber}FieldsJson`;
              onSettingChange(fieldsKey, JSON.stringify([createRequestFormStepFieldDraft(1)]));
              setExpandedSteps((current) => {
                const next = new Set(current);
                next.add(nextStepNumber);
                return next;
              });
            }}
          >
            {`Add step ${nextStepNumber}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ColorTextSelectionEditor({
  label,
  text,
  lineClassName,
  highlightsJson,
  onTextChange,
  onLineClassNameChange,
  onHighlightsJsonChange,
  placeholder = '',
  rows = 2,
  className = '',
  inputNearSwatches = false,
  unifiedPreviewEditor = false,
  previewClassName = '',
  previewWrapClassName = '',
  previewStyle = undefined,
  previewOverlay = null,
  afterSwatches = null,
  spanDetailsUnderToggle = false,
  showSpanDetailsInline = false,
  showClearSpansButton = false,
  useResetForClear = false,
  showPlaceholderInPreview = true,
  swatchOptions = HERO_SWATCH_OPTIONS,
}) {
  const inputRef = useRef(null);
  const commitTimerRef = useRef(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSpanDetails, setShowSpanDetails] = useState(false);
  const externalText = String(text ?? '');
  const externalHighlightsJson = String(highlightsJson ?? '');
  const [draftText, setDraftText] = useState(externalText);
  const [draftHighlightsJson, setDraftHighlightsJson] = useState(externalHighlightsJson);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const value = draftText;
  const activeHighlightsJson = draftHighlightsJson;
  const normalizedLineClass = String(lineClassName || '').trim();
  const mergedPreviewClassName = mergePreviewClassNames(normalizedLineClass, previewClassName);
  const highlights = useMemo(() => parseHeroRangeHighlights(activeHighlightsJson, value), [activeHighlightsJson, value]);
  const hasSelection = selection.end > selection.start;
  const selectedRangeColor = hasSelection
    ? resolveSelectionRangeColor(highlights, selection.start, selection.end)
    : '';

  useEffect(() => () => {
    if (commitTimerRef.current) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasLocalDraft) {
      setDraftText(externalText);
      setDraftHighlightsJson(externalHighlightsJson);
      return;
    }

    if (draftText === externalText && draftHighlightsJson === externalHighlightsJson) {
      setHasLocalDraft(false);
    }
  }, [draftHighlightsJson, draftText, externalHighlightsJson, externalText, hasLocalDraft]);

  const clearScheduledCommit = () => {
    if (!commitTimerRef.current) {
      return;
    }
    window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = null;
  };

  const syncLocalDraft = (nextText, nextHighlightsJson) => {
    setDraftText(nextText);
    setDraftHighlightsJson(nextHighlightsJson);
    setHasLocalDraft(nextText !== externalText || nextHighlightsJson !== externalHighlightsJson);
  };

  const commitDraft = (nextText, nextHighlightsJson) => {
    clearScheduledCommit();
    if (nextText !== externalText) {
      onTextChange(nextText);
    }
    if (nextHighlightsJson !== externalHighlightsJson) {
      onHighlightsJsonChange(nextHighlightsJson);
    }
  };

  const scheduleDraftCommit = (nextText, nextHighlightsJson) => {
    clearScheduledCommit();
    commitTimerRef.current = window.setTimeout(() => {
      commitDraft(nextText, nextHighlightsJson);
    }, EDITOR_LOCAL_DRAFT_COMMIT_DELAY_MS);
  };

  const syncSelection = () => {
    const nextSelection = readTextSelectionState(inputRef.current, selection, value);
    setSelection({ start: nextSelection.start, end: nextSelection.end });
  };

  const handleTextChange = (nextText) => {
    const prevText = value;
    const nextHighlightsJson = remapHighlightsJsonForTextChange(activeHighlightsJson, prevText, nextText);
    syncLocalDraft(nextText, nextHighlightsJson);
    scheduleDraftCommit(nextText, nextHighlightsJson);
    setSelection((prev) => ({
      start: Math.max(0, Math.min(nextText.length, prev.start)),
      end: Math.max(0, Math.min(nextText.length, prev.end)),
    }));
  };

  const applySwatch = (colorValue) => {
    const el = inputRef.current;
    if (!isInputFocused) {
      onLineClassNameChange(replaceHeroLineColorClass(normalizedLineClass, colorValue));
      setSelection({ start: 0, end: 0 });
      return;
    }

    if (el && document.activeElement !== el) {
      el.focus();
    }
    const currentSelection = (() => {
      const nextSelection = readTextSelectionState(el, selection, value);
      return { start: nextSelection.start, end: nextSelection.end };
    })();

    if (currentSelection.end > currentSelection.start) {
      const nextHighlightsJson = applySelectionColor(
        activeHighlightsJson,
        value,
        currentSelection.start,
        currentSelection.end,
        colorValue,
      );
      syncLocalDraft(value, nextHighlightsJson);
      commitDraft(value, nextHighlightsJson);
      setSelection(currentSelection);
      return;
    }

    onLineClassNameChange(replaceHeroLineColorClass(normalizedLineClass, colorValue));
  };

  const removeHighlightAtIndex = (index) => {
    const nextHighlightsJson = removeSelectionRange(activeHighlightsJson, value, index);
    syncLocalDraft(value, nextHighlightsJson);
    commitDraft(value, nextHighlightsJson);
  };

  const clearAllColorFormatting = () => {
    onLineClassNameChange(replaceHeroLineColorClass(normalizedLineClass, ''));
    syncLocalDraft(value, '');
    commitDraft(value, '');
    setShowSpanDetails(false);
  };

  const clearHighlights = () => {
    syncLocalDraft(value, '');
    commitDraft(value, '');
    setShowSpanDetails(false);
  };

  const activeValue = hasSelection ? selectedRangeColor : extractHeroLineColorToken(normalizedLineClass);
  const hasSpanDetails = highlights.length > 0;
  const spanDetailsVisible = showSpanDetailsInline || showSpanDetails;
  const previewContent = value
    ? renderPreviewHighlightedText(value, highlights)
    : (showPlaceholderInPreview ? <span className="admin-color-text-placeholder">{placeholder || 'Preview'}</span> : null);
  const resolvedSwatchOptions = useResetForClear
    ? (Array.isArray(swatchOptions) ? swatchOptions.filter((option) => option.value !== '') : [])
    : (Array.isArray(swatchOptions) ? swatchOptions : []);

  const textInput = (
    <textarea
      ref={inputRef}
      rows={rows}
      className="admin-color-text-input"
      value={value}
      placeholder={placeholder}
      onFocus={() => {
        setIsInputFocused(true);
        syncSelection();
      }}
      onBlur={() => {
        commitDraft(value, activeHighlightsJson);
        setIsInputFocused(false);
        setSelection({ start: 0, end: 0 });
      }}
      onClick={syncSelection}
      onSelect={syncSelection}
      onKeyUp={syncSelection}
      onMouseUp={syncSelection}
      onChange={(event) => handleTextChange(event.target.value)}
    />
  );

  const preview = (
    <div className={`admin-color-text-preview-wrap${previewWrapClassName ? ` ${previewWrapClassName}` : ''}${previewOverlay ? ' has-overlay' : ''}${useResetForClear ? ' has-reset-btn' : ''}`}>
      <p
        className={`admin-color-text-preview${mergedPreviewClassName ? ` ${mergedPreviewClassName}` : ''}`}
        style={previewStyle}
        aria-live="polite"
      >
        {previewContent}
      </p>
      {useResetForClear ? (
        <button
          type="button"
          className="admin-hero-inline-reset-btn admin-color-text-reset-btn"
          onClick={clearAllColorFormatting}
          title="Reset text color and spans"
          aria-label="Reset text color and spans"
        >
          ↺
        </button>
      ) : null}
      {previewOverlay ? (
        <div className="admin-color-text-preview-overlay">
          {previewOverlay}
        </div>
      ) : null}
    </div>
  );

  const unifiedPreview = (
    <div className={`admin-color-text-preview-wrap admin-color-text-unified-editor${previewWrapClassName ? ` ${previewWrapClassName}` : ''}${previewOverlay ? ' has-overlay' : ''}${useResetForClear ? ' has-reset-btn' : ''}`}>
      <p
        className={`admin-color-text-preview${mergedPreviewClassName ? ` ${mergedPreviewClassName}` : ''}`}
        style={previewStyle}
        aria-live="polite"
      >
        {previewContent}
      </p>
      <textarea
        ref={inputRef}
        rows={rows}
        className={`admin-color-text-inline-input${mergedPreviewClassName ? ` ${mergedPreviewClassName}` : ''}`}
        value={value}
        placeholder={placeholder}
        onFocus={() => {
          setIsInputFocused(true);
          syncSelection();
        }}
        onBlur={() => {
          commitDraft(value, activeHighlightsJson);
          setIsInputFocused(false);
          setSelection({ start: 0, end: 0 });
        }}
        onClick={syncSelection}
        onSelect={syncSelection}
        onKeyUp={syncSelection}
        onMouseUp={syncSelection}
        onChange={(event) => handleTextChange(event.target.value)}
        aria-label={`${label} text`}
        spellCheck="false"
      />
      {useResetForClear ? (
        <button
          type="button"
          className="admin-hero-inline-reset-btn admin-color-text-reset-btn"
          onClick={clearAllColorFormatting}
          title="Reset text color and spans"
          aria-label="Reset text color and spans"
        >
          ↺
        </button>
      ) : null}
      {previewOverlay ? (
        <div className="admin-color-text-preview-overlay">
          {previewOverlay}
        </div>
      ) : null}
    </div>
  );

  const spanDetails = (
    <div className="admin-color-text-spans">
      {hasSpanDetails ? (
        <div className="admin-hero-inline-span-chip-list">
          {highlights.map((range, index) => {
            const snippet = value.slice(range.start, range.end);
            const swatch = (Array.isArray(swatchOptions) ? swatchOptions : HERO_SWATCH_OPTIONS)
              .find((option) => option.value === range.className);
            return (
              <button
                key={`${label}-span-${range.start}-${range.end}-${range.className}`}
                type="button"
                className="admin-hero-inline-span-chip"
                onClick={() => removeHighlightAtIndex(index)}
                title="Remove span"
              >
                <span
                  className="admin-hero-inline-span-chip-color"
                  aria-hidden="true"
                  style={{ background: swatch?.swatch || '#ddd' }}
                />
                <span className="admin-hero-inline-span-chip-text">
                  “{snippet || ' '}” ({range.start}-{range.end})
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="admin-color-text-spans-empty">No colored spans yet.</p>
      )}
    </div>
  );

  return (
    <div className={`admin-color-text-editor${className ? ` ${className}` : ''}`}>
      <div className="admin-color-text-editor-top">
        <span className="admin-color-text-editor-label">{label}</span>
        {highlights.length && (!useResetForClear || showClearSpansButton) ? (
          <button type="button" className="admin-color-text-clear-spans" onClick={clearHighlights}>
            Clear spans
          </button>
        ) : null}
      </div>

      {unifiedPreviewEditor ? unifiedPreview : (
        <>
          {inputNearSwatches ? preview : textInput}
          {inputNearSwatches ? textInput : preview}
        </>
      )}

      <div className="admin-color-text-controls-row">
        <div className="admin-color-text-controls-topline">
          <div onMouseDownCapture={syncSelection}>
            <ColorPalette
              variant="admin"
              className="is-compact is-icon-only admin-color-text-swatch-list"
              ariaLabel={`${label} color controls`}
              options={resolvedSwatchOptions}
              value={activeValue}
              preventMouseDown
              onChange={(nextValue) => applySwatch(nextValue)}
              getOptionClassName={(option, state) => `${state.active ? ' is-active' : ''}${option.value === '' ? ' is-clear' : ''}`}
              getOptionShortLabel={(option) => option.shortLabel || option.label}
              hideSwatchForOption={(option) => Boolean(option.hideSwatch)}
            />
          </div>

          {!showSpanDetailsInline ? (
            <button
              type="button"
              className="admin-hero-inline-span-toggle admin-color-text-span-toggle"
              onClick={() => setShowSpanDetails((current) => !current)}
            >
              {showSpanDetails ? 'Hide span details ▴' : 'Show span details ▾'}
            </button>
          ) : null}
        </div>

        {spanDetailsUnderToggle && spanDetailsVisible ? (
          <div className="admin-color-text-span-details-under-toggle">
            {spanDetails}
          </div>
        ) : null}

        {afterSwatches ? (
          <div className="admin-color-text-after-swatches">
            {afterSwatches}
          </div>
        ) : null}
      </div>

      {!spanDetailsUnderToggle && spanDetailsVisible ? spanDetails : null}
    </div>
  );
}

export function HeroBlockEditor({ block, pathname = '', onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const heroInspection = useMemo(
    () => inspectDynamicHeroSettings(pathname, settings),
    [pathname, settings],
  );
  const inputRefs = useRef({});
  const pendingSwatchSelectionRef = useRef(null);
  const [activeLine, setActiveLine] = useState('line1');
  const [showSpanDetails, setShowSpanDetails] = useState(false);
  const [showOptionalLine3, setShowOptionalLine3] = useState(() => hasDisplayableHeroLineText(settings, 'line3'));
  const [selectionByLine, setSelectionByLine] = useState({
    line1: { start: 0, end: 0 },
    line2: { start: 0, end: 0 },
    line3: { start: 0, end: 0 },
  });

  const heroBgTone = (() => {
    const token = String(settings.bgTone || 'white').trim();
    return ['white', 'sand', 'blue', 'grey'].includes(token) ? token : 'white';
  })();
  const heroJustify = (() => {
    const token = String(settings.justify || 'center').trim();
    return ['left', 'center', 'right'].includes(token) ? token : 'center';
  })();
  const heroHeightMode = String(settings.heightMode || 'default') === 'custom' ? 'custom' : 'default';
  const heroHeightSvh = (() => {
    const numeric = Number(settings.heightSvh);
    if (!Number.isFinite(numeric)) {
      return 42;
    }
    return Math.max(20, Math.min(90, Math.round(numeric)));
  })();
  const heroTitleSizeRem = normalizeHeroTitleSizeRem(settings.titleSizeRem);
  const heroTitleSizeCss = heroTitleSizeRemToEditorCss(heroTitleSizeRem);
  const heroTitleLetterSpacingEm = normalizeHeroTitleLetterSpacingEm(settings.titleLetterSpacingEm);
  const heroLineHeight = (() => {
    const numeric = Number(settings.lineHeight);
    if (!Number.isFinite(numeric)) {
      return 0.9;
    }
    return Math.max(0.72, Math.min(1.2, Number(numeric.toFixed(2))));
  })();
  const editableFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(editableFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const heroBgToneOptions = Array.isArray(bgToneField?.options) && bgToneField.options.length
    ? bgToneField.options
    : HERO_BG_SWATCH_OPTIONS;
  const justifyField = fieldById.get('justify') || null;
  const actionJustifyField = fieldById.get('actionJustify') || null;
  const button1Fields = buildHeroActionFields(fieldById, settings, 1);
  const button2Fields = buildHeroActionFields(fieldById, settings, 2);
  const hasStoredLine3Content = hasDisplayableHeroLineText(settings, 'line3');
  useEffect(() => {
    if (hasStoredLine3Content) {
      setShowOptionalLine3(true);
    }
  }, [hasStoredLine3Content]);
  const resolvedLineNumbers = resolveVisibleHeroLineNumbers({
    fieldById,
    settings,
    includeOptionalLine3: showOptionalLine3,
  });
  const canShowOptionalLine3 = supportsOptionalHeroLine3({ fieldById, settings }) && !showOptionalLine3;
  const lineConfigs = resolvedLineNumbers.map((lineNumber) => {
    const lineKey = `line${lineNumber}`;
    const text = String(settings[`${lineKey}Text`] ?? '');
    const className = String(settings[`${lineKey}ClassName`] || '').trim();
    const highlights = parseHeroRangeHighlights(settings[`${lineKey}HighlightsJson`], text);
    return {
      key: lineKey,
      label: `Line ${lineNumber}`,
      placeholder: `Line ${lineNumber} text`,
      text,
      className,
      displayClassName: resolveHeroLineDisplayClassName(className, heroBgTone, lineKey),
      highlights,
    };
  });

  const lineByKey = {
    ...Object.fromEntries(lineConfigs.map((line) => [line.key, line])),
  };

  const activeConfig = lineByKey[activeLine] || lineByKey.line1;
  const activeSelection = selectionByLine[activeLine] || { start: 0, end: 0 };
  const hasSelection = activeSelection.end > activeSelection.start;
  const activeLineColor = extractHeroLineColorToken(activeConfig?.className || '');
  const selectedRangeColor = hasSelection
    ? resolveSelectionRangeColor(activeConfig.highlights, activeSelection.start, activeSelection.end)
    : '';
  const hasSpanDetails = lineConfigs.some((line) => line.highlights.length);
  const activeLineSpanCount = Array.isArray(activeConfig?.highlights) ? activeConfig.highlights.length : 0;
  const otherLinesWithSpans = lineConfigs.filter((line) => line.key !== activeConfig?.key && line.highlights.length);
  const canHideOptionalLine3 = showOptionalLine3 && !hasStoredLine3Content;
  const activeLineSummary = hasSelection
    ? `Selection ${activeSelection.start}-${activeSelection.end}`
    : activeLineSpanCount
      ? `${activeLineSpanCount} ${activeLineSpanCount === 1 ? 'color span' : 'color spans'}`
      : (String(activeConfig?.text || '').trim() ? 'Core color' : 'Start typing');

  const syncSelection = (lineKey) => {
    const nextSelection = readTextSelectionState(
      inputRefs.current[lineKey],
      selectionByLine[lineKey],
      settings?.[`${lineKey}Text`],
    );
    setSelectionByLine((prev) => ({
      ...prev,
      [lineKey]: { start: nextSelection.start, end: nextSelection.end },
    }));
    return nextSelection;
  };

  const updateLineText = (lineKey, nextText) => {
    const prevText = String(settings?.[`${lineKey}Text`] ?? '');
    onSettingChange(`${lineKey}Text`, nextText);
    onSettingChange(
      `${lineKey}HighlightsJson`,
      remapHighlightsJsonForTextChange(settings?.[`${lineKey}HighlightsJson`], prevText, nextText),
    );

    setSelectionByLine((prev) => {
      const current = prev[lineKey] || { start: 0, end: 0 };
      const max = nextText.length;
      return {
        ...prev,
        [lineKey]: {
          start: Math.max(0, Math.min(max, current.start)),
          end: Math.max(0, Math.min(max, current.end)),
        },
      };
    });
  };

  const activateLine = (lineKey, { focus = false } = {}) => {
    setActiveLine(lineKey);
    syncSelection(lineKey);
    if (!focus || typeof window === 'undefined') {
      return;
    }
    window.requestAnimationFrame(() => {
      inputRefs.current[lineKey]?.focus();
    });
  };

  const applySwatch = (colorValue) => {
    const targetLine = activeLine || 'line1';
    const line = lineByKey[targetLine] || lineByKey.line1;
    if (!line) return;

    const textLength = line.text.length;
    const normalizeRange = (rawRange) => {
      const rawStart = Number(rawRange?.start);
      const rawEnd = Number(rawRange?.end);
      const safeStart = Number.isFinite(rawStart) ? Math.max(0, Math.min(textLength, Math.floor(rawStart))) : 0;
      const safeEnd = Number.isFinite(rawEnd) ? Math.max(safeStart, Math.min(textLength, Math.floor(rawEnd))) : safeStart;
      return { start: safeStart, end: safeEnd };
    };

    const pendingSelection = pendingSwatchSelectionRef.current;
    const selectionSource = (
      pendingSelection
      && pendingSelection.lineKey === targetLine
      && Number.isInteger(pendingSelection.start)
      && Number.isInteger(pendingSelection.end)
    )
      ? pendingSelection
      : readTextSelectionState(inputRefs.current[targetLine], selectionByLine[targetLine], line.text);
    pendingSwatchSelectionRef.current = null;
    const currentSelection = normalizeRange(selectionSource);

    if (currentSelection.end > currentSelection.start) {
      onSettingChange(
        `${targetLine}HighlightsJson`,
        applySelectionColor(
          settings?.[`${targetLine}HighlightsJson`],
          line.text,
          currentSelection.start,
          currentSelection.end,
          colorValue,
        ),
      );
      setSelectionByLine((prev) => ({
        ...prev,
        [targetLine]: currentSelection,
      }));
      return;
    }

    onSettingChange(
      `${targetLine}ClassName`,
      replaceHeroLineColorClass(line.className, colorValue),
    );
  };

  const removeHighlightAtIndex = (lineKey, index) => {
    const line = lineByKey[lineKey];
    if (!line) return;
    onSettingChange(
      `${lineKey}HighlightsJson`,
      removeSelectionRange(settings?.[`${lineKey}HighlightsJson`], line.text, index),
    );
  };

  const resetAllLines = () => {
    lineConfigs.forEach((line) => {
      onSettingChange(`${line.key}ClassName`, replaceHeroLineColorClass(line.className, ''));
      onSettingChange(`${line.key}HighlightsJson`, '');
    });
  };

  const detailFieldIds = new Set([
    'animationPreset',
    'justify',
    'bgTone',
    'heightMode',
    'heightSvh',
    'titleSizeRem',
    'titleLetterSpacingEm',
    'lineHeight',
    'lineGap',
    ...[1, 2, 3].flatMap((lineNumber) => (
      [`line${lineNumber}Text`, `line${lineNumber}ClassName`, `line${lineNumber}HighlightsJson`]
    )),
  ]);
  const miscFields = editableFields
    .filter((field) => !detailFieldIds.has(field.id))
    .filter((field) => ![
      'actionJustify',
      'button1Label',
      'button1Url',
      'button1PageRef',
      'button1OpenInNewWindow',
      'button1Style',
      'button1Tone',
      'button2Label',
      'button2Url',
      'button2PageRef',
      'button2OpenInNewWindow',
      'button2Style',
      'button2Tone',
    ].includes(field.id))
    .filter(Boolean);

  return (
    <div className="admin-hero-editor">
      <HeroDriftNotice driftReport={heroInspection} />
      <div className="admin-hero-editor-main">
        <div className="admin-hero-editor-preview-pane">
          <div className="admin-hero-inline-stage-wrap">
            {bgToneField ? (
              <div className="admin-hero-bg-overlay">
                <ColorPalette
                  variant="admin"
                  className="is-compact admin-hero-inline-swatch-list is-icon-only"
                  ariaLabel="Hero background"
                  options={heroBgToneOptions}
                  value={String(settings.bgTone || '')}
                  onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
                  getOptionClassName={(option, state) => ` admin-bg-swatch-option${state.active ? ' is-active' : ''}`}
                />
              </div>
            ) : null}
            <button
              type="button"
              className="admin-hero-inline-reset-btn"
              onClick={resetAllLines}
              title="Reset hero line colors and highlights"
              aria-label="Reset hero line colors and highlights"
            >
              ↺
            </button>
            <div className={`admin-hero-inline-stage is-bg-${heroBgTone} is-justify-${heroJustify}`} aria-label="Hero editor preview surface">
              {lineConfigs.map((line, index) => (
                <div
                  key={line.key}
                  className={`admin-hero-inline-line-wrap${activeLine === line.key ? ' is-active' : ''}`}
                >
                  <div
                  className={`admin-hero-inline-line-stage${line.className ? ` ${line.className}` : ''}`}
                  >
                    <div
                      className={`admin-hero-inline-line-mirror${line.displayClassName ? ` ${line.displayClassName}` : ''}`}
                      aria-hidden="true"
                      style={{
                        lineHeight: heroLineHeight,
                        fontSize: heroTitleSizeCss,
                        letterSpacing: `${heroTitleLetterSpacingEm}em`,
                      }}
                    >
                      {line.text
                        ? renderPreviewHighlightedText(line.text, line.highlights)
                        : <span className="admin-hero-inline-line-placeholder">{line.placeholder}</span>}
                    </div>
                    <input
                      ref={(node) => {
                        inputRefs.current[line.key] = node;
                      }}
                      type="text"
                      className={`admin-hero-inline-line-input${line.displayClassName ? ` ${line.displayClassName}` : ''}`}
                      value={line.text}
                      style={{
                        lineHeight: heroLineHeight,
                        fontSize: heroTitleSizeCss,
                        letterSpacing: `${heroTitleLetterSpacingEm}em`,
                      }}
                      onFocus={() => {
                        setActiveLine(line.key);
                        syncSelection(line.key);
                      }}
                      onClick={() => {
                        setActiveLine(line.key);
                        syncSelection(line.key);
                      }}
                      onSelect={() => syncSelection(line.key)}
                      onKeyUp={() => syncSelection(line.key)}
                      onMouseUp={() => syncSelection(line.key)}
                      onChange={(event) => updateLineText(line.key, event.target.value)}
                      placeholder={line.placeholder}
                      aria-label={`${line.label} text`}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-hero-editor-controls-pane">
          <div className="admin-hero-inline-toolbar">
            <div className="admin-hero-inline-toolbar-head">
              <div className="admin-hero-inline-toolbar-head-copy">
                <p className="admin-hero-inline-toolbar-kicker">Editing</p>
                <p className="admin-hero-inline-toolbar-title">{activeConfig?.label || 'Line 1'}</p>
              </div>
              <p className="admin-hero-inline-toolbar-status">{activeLineSummary}</p>
            </div>

            <div className="admin-hero-inline-line-selector" role="toolbar" aria-label="Hero line controls">
              {lineConfigs.map((line) => (
                <button
                  key={`hero-line-tab-${line.key}`}
                  type="button"
                  className={`admin-hero-inline-line-tab${activeLine === line.key ? ' is-active' : ''}`}
                  aria-label={`${line.label}${line.highlights.length ? ` (${line.highlights.length} spans)` : ''}`}
                  aria-pressed={activeLine === line.key}
                  onClick={() => activateLine(line.key, { focus: true })}
                >
                  <span>{line.label}</span>
                  {line.highlights.length ? (
                    <span className="admin-hero-inline-line-tab-meta">{line.highlights.length}</span>
                  ) : null}
                </button>
              ))}
              {canShowOptionalLine3 ? (
                <button
                  type="button"
                  className="admin-hero-inline-span-toggle"
                  onClick={() => {
                    setShowOptionalLine3(true);
                    activateLine('line3', { focus: true });
                  }}
                >
                  Add Line 3
                </button>
              ) : null}
              {canHideOptionalLine3 ? (
                <button
                  type="button"
                  className="admin-hero-inline-span-toggle"
                  onClick={() => {
                    setShowOptionalLine3(false);
                    if (activeLine === 'line3') {
                      activateLine('line2', { focus: true });
                    }
                  }}
                >
                  Hide Line 3
                </button>
              ) : null}
            </div>

            <div className="admin-hero-inline-toolbar-main admin-hero-inline-toolbar-main--hero">
              <div
                onMouseDownCapture={() => {
                  const targetLine = activeLine || activeConfig?.key || 'line1';
                  const selection = syncSelection(targetLine);
                  pendingSwatchSelectionRef.current = {
                    lineKey: targetLine,
                    start: selection?.start,
                    end: selection?.end,
                  };
                }}
              >
                <ColorPalette
                  variant="admin"
                  className="is-compact admin-hero-inline-swatch-list is-icon-only"
                  ariaLabel="Hero color controls"
                  options={HERO_SWATCH_OPTIONS}
                  value={hasSelection ? selectedRangeColor : activeLineColor}
                  preventMouseDown
                  onChange={(nextValue) => applySwatch(nextValue)}
                  getOptionClassName={(option, state) => `${state.active ? ' is-active' : ''}${option.value === '' ? ' is-clear' : ''}`}
                  getOptionLabel={(option) => (
                    hasSelection
                      ? `${option.label} (apply to selection)`
                      : `${option.label} (apply to ${activeConfig.label})`
                  )}
                  getOptionShortLabel={(option) => option.shortLabel || option.label}
                  hideSwatchForOption={(option) => Boolean(option.hideSwatch)}
                />
              </div>
              {justifyField ? (
                <JustifyPillControl
                  label="Hero justify"
                  value={heroJustify}
                  options={Array.isArray(justifyField.options) ? justifyField.options : []}
                  onChange={(nextValue) => onSettingChange('justify', nextValue)}
                  className="admin-hero-inline-justify-control"
                />
              ) : null}
              <button
                type="button"
                className="admin-hero-inline-span-toggle"
                onClick={resetAllLines}
              >
                Clear
              </button>
              <button
                type="button"
                className="admin-hero-inline-span-toggle"
                onClick={() => setShowSpanDetails((current) => !current)}
              >
                {showSpanDetails ? 'Hide span details' : 'Show span details'}
              </button>
            </div>

            {showSpanDetails ? (
              <div className="admin-hero-inline-spans">
                <div className="admin-hero-inline-spans-row is-active-line">
                  <div className="admin-hero-inline-spans-row-head">
                    <p className="admin-hero-inline-spans-label">{activeConfig.label} spans</p>
                    {activeLineSpanCount ? (
                      <p className="admin-hero-inline-spans-count">{activeLineSpanCount}</p>
                    ) : null}
                  </div>
                  {activeConfig.highlights.length ? (
                    <div className="admin-hero-inline-span-chip-list">
                      {activeConfig.highlights.map((range, index) => {
                        const snippet = activeConfig.text.slice(range.start, range.end);
                        const swatch = HERO_SWATCH_OPTIONS.find((option) => option.value === range.className);
                        return (
                          <button
                            key={`${activeConfig.key}-span-${range.start}-${range.end}-${range.className}`}
                            type="button"
                            className="admin-hero-inline-span-chip"
                            onClick={() => removeHighlightAtIndex(activeConfig.key, index)}
                            title="Remove span"
                          >
                            <span
                              className="admin-hero-inline-span-chip-color"
                              aria-hidden="true"
                              style={{ background: swatch?.swatch || '#ddd' }}
                            />
                            <span className="admin-hero-inline-span-chip-text">
                              “{snippet || ' '}” ({range.start}-{range.end})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="admin-hero-inline-spans-empty">{hasSpanDetails ? 'No spans on this line.' : 'No colored spans yet.'}</p>
                  )}
                </div>

                {otherLinesWithSpans.length ? (
                  <div className="admin-hero-inline-spans-overview">
                    <p className="admin-hero-inline-spans-overview-label">Other lines with spans</p>
                    <div className="admin-hero-inline-spans-overview-actions">
                      {otherLinesWithSpans.map((line) => (
                        <button
                          key={`hero-other-span-line-${line.key}`}
                          type="button"
                          className="admin-hero-inline-line-tab is-secondary"
                          aria-label={`Go to ${line.label} spans (${line.highlights.length})`}
                          onClick={() => activateLine(line.key, { focus: true })}
                        >
                          <span>{line.label}</span>
                          <span className="admin-hero-inline-line-tab-meta">{line.highlights.length}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="admin-hero-inline-spacing-grid">
              <label className="admin-hero-inline-linegap-control">
                <div className="admin-line-spacing-control-head">
                  <div className="admin-line-spacing-control-copy">
                    <span className="admin-line-spacing-control-label">Headline Size</span>
                    <span className="admin-line-spacing-control-value">{heroTitleSizeRem.toFixed(1)}rem</span>
                  </div>
                  <button
                    type="button"
                    className="admin-line-spacing-reset-btn"
                    onClick={() => onSettingChange('titleSizeRem', DEFAULT_HERO_TITLE_SIZE_REM)}
                    title="Reset headline size"
                    aria-label="Reset headline size"
                  >
                    ↺
                  </button>
                </div>
                <div className="admin-hero-inline-height-row">
                  <input
                    type="range"
                    min="4.5"
                    max="9"
                    step="0.1"
                    value={heroTitleSizeRem}
                    onChange={(event) => onSettingChange('titleSizeRem', Number(event.target.value))}
                    aria-label="Hero headline size"
                  />
                  <AdminNumberInput
                    className="admin-hero-inline-height-number"
                    min="4.5"
                    max="9"
                    step="0.1"
                    value={heroTitleSizeRem}
                    onChange={(nextValue) => onSettingChange('titleSizeRem', nextValue)}
                    aria-label="Hero headline size number"
                  />
                  <span className="admin-hero-inline-height-unit">rem</span>
                </div>
              </label>
              <label className="admin-hero-inline-linegap-control">
                <div className="admin-line-spacing-control-head">
                  <div className="admin-line-spacing-control-copy">
                    <span className="admin-line-spacing-control-label">Headline Tracking</span>
                    <span className="admin-line-spacing-control-value">{heroTitleLetterSpacingEm.toFixed(3)}em</span>
                  </div>
                  <button
                    type="button"
                    className="admin-line-spacing-reset-btn"
                    onClick={() => onSettingChange('titleLetterSpacingEm', DEFAULT_HERO_TITLE_LETTER_SPACING_EM)}
                    title="Reset headline tracking"
                    aria-label="Reset headline tracking"
                  >
                    ↺
                  </button>
                </div>
                <div className="admin-hero-inline-height-row">
                  <input
                    type="range"
                    min="-0.08"
                    max="0.04"
                    step="0.005"
                    value={heroTitleLetterSpacingEm}
                    onChange={(event) => onSettingChange('titleLetterSpacingEm', Number(event.target.value))}
                    aria-label="Hero headline tracking"
                  />
                  <AdminNumberInput
                    className="admin-hero-inline-height-number"
                    min="-0.08"
                    max="0.04"
                    step="0.005"
                    value={heroTitleLetterSpacingEm}
                    onChange={(nextValue) => onSettingChange('titleLetterSpacingEm', nextValue)}
                    aria-label="Hero headline tracking number"
                  />
                  <span className="admin-hero-inline-height-unit">em</span>
                </div>
              </label>
              <label className="admin-hero-inline-linegap-control">
                <div className="admin-line-spacing-control-head">
                  <div className="admin-line-spacing-control-copy">
                    <span className="admin-line-spacing-control-label">Text Line Height</span>
                    <span className="admin-line-spacing-control-value">{heroLineHeight.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    className="admin-line-spacing-reset-btn"
                    onClick={() => onSettingChange('lineHeight', 0.9)}
                    title="Reset line height"
                    aria-label="Reset line height"
                  >
                    ↺
                  </button>
                </div>
                <div className="admin-hero-inline-height-row">
                  <input
                    type="range"
                    min="0.72"
                    max="1.2"
                    step="0.01"
                    value={heroLineHeight}
                    onChange={(event) => onSettingChange('lineHeight', Number(event.target.value))}
                    aria-label="Hero line height"
                  />
                  <AdminNumberInput
                    className="admin-hero-inline-height-number"
                    min="0.72"
                    max="1.2"
                    step="0.01"
                    value={heroLineHeight}
                    onChange={(nextValue) => onSettingChange('lineHeight', nextValue)}
                    aria-label="Hero line height number"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-hero-lower-groups">
        <section className="admin-hero-settings-group admin-hero-settings-group--hero" aria-label="Hero settings">
          <div className="admin-hero-settings-group-head">
            <p className="admin-hero-settings-group-kicker">Hero settings</p>
            <p className="admin-hero-settings-group-title">Overall motion, height, and action alignment</p>
          </div>
          <div className="admin-hero-settings-meta-grid">
            <label className="admin-hero-settings-control">
              <span>Hero animation</span>
              <select
                aria-label="Hero animation"
                value={String(settings.animationPreset || 'default')}
                onChange={(event) => onSettingChange('animationPreset', event.target.value)}
              >
                {HERO_ANIMATION_PRESET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            {actionJustifyField ? (
              <label className="admin-hero-settings-control">
                <span>{actionJustifyField.label}</span>
                {renderFieldControl(
                  actionJustifyField,
                  settings?.[actionJustifyField.id],
                  (nextValue) => onSettingChange(actionJustifyField.id, nextValue),
                  settings,
                  onSettingChange,
                  routeOptions,
                )}
              </label>
            ) : null}
          </div>

          <label className="admin-hero-settings-control admin-hero-settings-control--height">
            <span>Hero height</span>
            <select
              aria-label="Hero height"
              value={heroHeightMode}
              onChange={(event) => onSettingChange('heightMode', event.target.value)}
            >
              <option value="default">Default</option>
              <option value="custom">Custom (% viewport)</option>
            </select>
            {heroHeightMode === 'custom' ? (
              <div className="admin-hero-inline-height-row">
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="1"
                  value={heroHeightSvh}
                  onChange={(event) => onSettingChange('heightSvh', Number(event.target.value))}
                  aria-label="Hero height percent of viewport"
                />
                <AdminNumberInput
                  className="admin-hero-inline-height-number"
                  min="20"
                  max="90"
                  step="1"
                  value={heroHeightSvh}
                  onChange={(nextValue) => onSettingChange('heightSvh', nextValue)}
                  aria-label="Hero height percent"
                />
                <span className="admin-hero-inline-height-unit">svh</span>
              </div>
            ) : null}
          </label>
        </section>

        <section className="admin-hero-settings-group admin-hero-settings-group--button" aria-label="Button 1 settings">
          <div className="admin-hero-settings-group-head">
            <p className="admin-hero-settings-group-kicker">Button 1</p>
            <p className="admin-hero-settings-group-title">Primary label, destination, and style</p>
          </div>
          <DraftBackedFieldControlGrid
            fields={button1Fields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline admin-hero-action-fields"
            routeOptions={routeOptions}
            draftFieldIds={HERO_BUTTON_LOCAL_DRAFT_FIELD_IDS[1]}
          />
        </section>

        <section className="admin-hero-settings-group admin-hero-settings-group--button" aria-label="Button 2 settings">
          <div className="admin-hero-settings-group-head">
            <p className="admin-hero-settings-group-kicker">Button 2</p>
            <p className="admin-hero-settings-group-title">Secondary label, destination, and style</p>
          </div>
          <DraftBackedFieldControlGrid
            fields={button2Fields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline admin-hero-action-fields"
            routeOptions={routeOptions}
            draftFieldIds={HERO_BUTTON_LOCAL_DRAFT_FIELD_IDS[2]}
          />
        </section>

        {miscFields.length ? (
          <section className="admin-hero-settings-group admin-hero-settings-group--misc" aria-label="Additional Hero settings">
            <div className="admin-hero-settings-group-head">
              <p className="admin-hero-settings-group-kicker">Additional settings</p>
              <p className="admin-hero-settings-group-title">Remaining Hero controls</p>
            </div>
            <FieldControlGrid
              fields={miscFields}
              settings={settings}
              onSettingChange={onSettingChange}
              className="admin-content-field-list--inline admin-hero-action-fields"
              routeOptions={routeOptions}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function IntroBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const introDraftSettings = useMemo(() => ({
    ...settings,
    bodyHtml: toEditorHtml(settings.bodyHtml, settings.body),
    button1Url: String(settings.button1PageRef || settings.button1Url || ''),
    button2Url: String(settings.button2PageRef || settings.button2Url || ''),
  }), [settings]);
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const textToneField = fieldById.get('textTone') || null;
  const justifyField = fieldById.get('justify') || null;
  const appearanceFields = textToneField
    ? [{ ...textToneField, label: 'Core text' }]
    : [];
  const introJustifyOptions = Array.isArray(justifyField?.options) && justifyField.options.length
    ? justifyField.options
    : [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ];
  const introJustify = normalizeJustifySelection(settings.justify, introJustifyOptions);
  const introLineSpacing = normalizeIntroLineSpacing(settings.lineSpacing);
  const introBgTone = normalizePanelBgTone(settings.bgTone);
  const introTextTone = normalizePanelTextTone(settings.textTone, 'dark');
  const {
    draftValues,
    routeRefDraftValues,
    updateDraftField,
    commitDraftOnBlur,
    handleRouteRefChange,
  } = useBufferedStringFieldDrafts({
    settings: introDraftSettings,
    onSettingChange,
    fieldIds: INTRO_LOCAL_DRAFT_FIELD_IDS,
    routeFieldIdByFieldId: {
      button1Url: 'button1PageRef',
      button2Url: 'button2PageRef',
    },
    routeOptions,
  });
  const contentFields = allFields.filter((field) => (
    field.id !== 'heading'
    && field.id !== 'body'
    && field.id !== 'bodyHtml'
    && field.id !== 'bgTone'
    && field.id !== 'textTone'
    && field.id !== 'justify'
    && field.id !== 'lineSpacing'
  )).map((field) => {
    if (field.id === 'button1Url' && field.type === 'text') {
      return promoteRouteLinkDescriptor(field, 'button1PageRef');
    }
    if (field.id === 'button2Url' && field.type === 'text') {
      return promoteRouteLinkDescriptor(field, 'button2PageRef');
    }
    if (field.id === 'button1Tone' && field.type === 'swatch') {
      if (String(settings.button1Style || '').trim().toLowerCase() !== 'outline') {
        return null;
      }
      return getCompactToneField(fieldById, 'button1Tone', true);
    }
    if (field.id === 'button2Tone' && field.type === 'swatch') {
      if (String(settings.button2Style || '').trim().toLowerCase() !== 'outline') {
        return null;
      }
      return getCompactToneField(fieldById, 'button2Tone', true);
    }
    if (field.id !== 'extraLineTone' || field.type !== 'swatch') {
      return field;
    }
    return {
      ...field,
      compact: true,
      iconOnly: true,
      swatchClassName: 'admin-button-tone-swatch-list',
    };
  }).filter(Boolean);

  return (
    <div className="admin-intro-block-editor">
      <div className="admin-dynamic-panel-primary-grid admin-dynamic-panel-primary-grid--intro">
        <div className="admin-intro-editor-main admin-intro-editor-main--intro">
          <ColorTextSelectionEditor
            label="Heading"
            text={settings.heading ?? ''}
            lineClassName={settings.headingClassName ?? ''}
            highlightsJson={settings.headingHighlightsJson ?? ''}
            onTextChange={(nextValue) => onSettingChange('heading', nextValue)}
            onLineClassNameChange={(nextValue) => onSettingChange('headingClassName', nextValue)}
            onHighlightsJsonChange={(nextValue) => onSettingChange('headingHighlightsJson', nextValue)}
            placeholder="Intro heading"
            rows={2}
            className="is-intro-heading"
            unifiedPreviewEditor
            previewClassName={`is-justify-${introJustify} ${getPanelTextTonePreviewClassName(introTextTone, 'dark')}`}
            previewWrapClassName={`is-bg-${introBgTone}`}
            previewStyle={{ '--admin-intro-line-height': String(introLineSpacing) }}
            spanDetailsUnderToggle
            useResetForClear
            afterSwatches={(
              <div className="admin-intro-inline-text-controls">
                <JustifyPillControl
                  label="Intro justify"
                  value={introJustify}
                  options={introJustifyOptions}
                  onChange={(nextValue) => onSettingChange('justify', nextValue)}
                />
                <label className="admin-intro-line-spacing-control">
                  <div className="admin-line-spacing-control-head">
                    <span>{introLineSpacing.toFixed(2)}</span>
                    <button
                      type="button"
                      className="admin-line-spacing-reset-btn"
                      onClick={() => onSettingChange('lineSpacing', DEFAULT_INTRO_LINE_SPACING)}
                      title="Reset line spacing"
                      aria-label="Reset line spacing"
                    >
                      ↺
                    </button>
                  </div>
                  <div className="admin-hero-inline-height-row">
                    <input
                      type="range"
                      min="0.85"
                      max="1.4"
                      step="0.01"
                      value={introLineSpacing}
                      onChange={(event) => onSettingChange('lineSpacing', Number(event.target.value))}
                      aria-label="Intro heading line spacing"
                    />
                    <AdminNumberInput
                      className="admin-hero-inline-height-number"
                      min="0.85"
                      max="1.4"
                      step="0.01"
                      value={introLineSpacing}
                      onChange={(nextValue) => onSettingChange('lineSpacing', nextValue)}
                      aria-label="Intro heading line spacing number"
                    />
                  </div>
                </label>
              </div>
            )}
          />
          <AdminHtmlEditor
            value={String(draftValues.bodyHtml || '')}
            onChange={(nextValue) => {
              updateDraftField('bodyHtml', nextValue);
            }}
            onBlur={() => commitDraftOnBlur('bodyHtml')}
            placeholder="Intro body copy"
          />
        </div>

        <div className="admin-intro-appearance-stack">
          <PanelAppearanceControls
            fields={appearanceFields}
            settings={settings}
            onSettingChange={onSettingChange}
            compactSwatches={false}
            className="admin-panel-appearance--intro-text"
          />

          {bgToneField ? (
            <section className="admin-panel-appearance admin-panel-appearance--intro-text admin-panel-appearance--intro-bg">
              <div className="admin-content-field-list admin-content-field-list--inline admin-panel-appearance-grid">
                <label>
                  <span>{bgToneField.label || 'Background color'}</span>
                  <ColorPalette
                    variant="admin"
                    className="is-compact admin-hero-inline-swatch-list is-icon-only admin-intro-bg-palette-swatch-list"
                    ariaLabel={bgToneField.label || 'Intro background'}
                    options={Array.isArray(bgToneField.options) ? bgToneField.options : []}
                    value={String(settings.bgTone || '')}
                    preventMouseDown
                    onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
                    getOptionClassName={(option, state) => ` admin-bg-swatch-option${state.active ? ' is-active' : ''}`}
                  />
                </label>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <EditorButtonPreview
        buttons={[
          {
            label: draftValues.button1Label ?? settings.button1Label,
            style: settings.button1Style,
            tone: settings.button1Tone,
          },
          {
            label: draftValues.button2Label ?? settings.button2Label,
            style: settings.button2Style,
            tone: settings.button2Tone,
          },
        ]}
      />

      <div className="admin-content-field-list admin-content-field-list--inline">
        {contentFields.map((field) => {
          const fieldId = String(field?.id || '').trim();
          const isDrafted = INTRO_LOCAL_DRAFT_FIELD_IDS.includes(fieldId);
          return (
            <label key={field.id} className={field.layout === 'half' ? 'is-half' : undefined}>
              <span>{field.label}</span>
              {isDrafted ? (
                field.type === 'route_link' ? (
                  <RouteLinkField
                    value={draftValues[fieldId] ?? ''}
                    routeRefValue={field.routeRefFieldId ? routeRefDraftValues[fieldId] ?? '' : ''}
                    onChange={(nextValue) => updateDraftField(fieldId, nextValue)}
                    onRouteRefChange={field.routeRefFieldId ? (nextValue) => handleRouteRefChange(fieldId, nextValue) : undefined}
                    routeOptions={routeOptions}
                  />
                ) : (
                  <input
                    type="text"
                    value={draftValues[fieldId] ?? ''}
                    placeholder={field.placeholder || undefined}
                    onChange={(event) => updateDraftField(fieldId, event.target.value)}
                    onBlur={() => commitDraftOnBlur(fieldId)}
                  />
                )
              ) : renderFieldControl(
                field,
                settings?.[field.id],
                (nextValue) => onSettingChange(field.id, nextValue),
                settings,
                onSettingChange,
                routeOptions,
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function IntroHudBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'hud', block.editableFields);
  const introHeadingInputRef = useRef(null);
  const introExtraLineInputRef = useRef(null);
  const introBodyInputRef = useRef(null);
  const [introHeadingSelection, setIntroHeadingSelection] = useState({ start: 0, end: 0, text: '' });
  const [introBodyMiniEditorEnabled, setIntroBodyMiniEditorEnabled] = useState(true);
  const actionFields = allFields
    .filter((field) => field.id.startsWith('button1') || field.id.startsWith('button2'))
    .map((field) => {
      if (field.id === 'button1Url' && field.type === 'text') {
        return promoteRouteLinkDescriptor(field, 'button1PageRef');
      }
      if (field.id === 'button2Url' && field.type === 'text') {
        return promoteRouteLinkDescriptor(field, 'button2PageRef');
      }
      return field;
    });

  const captureGenericSelection = (inputRef, setter) => {
    const input = inputRef?.current;
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
    setter({
      start,
      end,
      text: source.slice(start, end),
    });
  };

  return (
    <IntroHudEditorPanel
      heading={String(settings.heading || '')}
      onHeadingChange={(nextValue) => {
        onSettingChange('heading', nextValue);
        setIntroHeadingSelection({ start: 0, end: 0, text: '' });
      }}
      headingInputRef={introHeadingInputRef}
      onHeadingSelectionCapture={() => captureGenericSelection(introHeadingInputRef, setIntroHeadingSelection)}
      headingSelection={introHeadingSelection}
      headingHighlightsJson={String(settings.headingHighlightsJson || '')}
      headingColor={extractHeroLineColorToken(settings.headingClassName)}
      onHeadingColorChange={(nextValue) => onSettingChange(
        'headingClassName',
        replaceHeroLineColorClass(String(settings.headingClassName || ''), nextValue),
      )}
      onHeadingSelectionColorChange={(nextValue) => {
        const sourceText = String(settings.heading || '');
        const safeStart = Math.max(0, Math.min(Number(introHeadingSelection.start) || 0, sourceText.length));
        const safeEnd = Math.max(safeStart, Math.min(Number(introHeadingSelection.end) || 0, sourceText.length));
        if (safeEnd <= safeStart) {
          return;
        }
        onSettingChange(
          'headingHighlightsJson',
          applySelectionColor(settings.headingHighlightsJson, sourceText, safeStart, safeEnd, nextValue),
        );
      }}
      onRemoveHeadingSpan={(index) => {
        onSettingChange(
          'headingHighlightsJson',
          removeSelectionRange(settings.headingHighlightsJson, settings.heading, index),
        );
      }}
      onClearHeadingSpans={() => {
        onSettingChange('headingHighlightsJson', '');
        setIntroHeadingSelection({ start: 0, end: 0, text: '' });
      }}
      extraLine={String(settings.extraLine || '')}
      onExtraLineChange={(nextValue) => onSettingChange('extraLine', nextValue)}
      extraLineInputRef={introExtraLineInputRef}
      extraLineTone={String(settings.extraLineTone || '')}
      onExtraLineToneChange={(nextValue) => onSettingChange('extraLineTone', nextValue)}
      bodyMiniEditorEnabled={introBodyMiniEditorEnabled}
      onToggleBodyMiniEditor={() => setIntroBodyMiniEditorEnabled((current) => !current)}
      bodyHtml={String(settings.bodyHtml || '')}
      onBodyHtmlChange={(nextValue) => onSettingChange('bodyHtml', nextValue)}
      bodyInputRef={introBodyInputRef}
      textTone={String(settings.textTone || 'dark')}
      onTextToneChange={(nextValue) => onSettingChange('textTone', nextValue)}
      bgTone={String(settings.bgTone || 'sand')}
      onBgToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
      justify={String(settings.justify || 'center')}
      onJustifyChange={(nextValue) => onSettingChange('justify', nextValue)}
      lineSpacing={Number.isFinite(Number(settings.lineSpacing)) ? Number(settings.lineSpacing) : 1.04}
      onLineSpacingChange={(nextValue) => onSettingChange('lineSpacing', Number(nextValue))}
      allowWhiteBackground={false}
      actionsSlot={actionFields.length ? (
        <section className="admin-front-hud-card admin-intro-hud-card admin-intro-hud-card--actions">
          <div className="admin-front-hud-card-head">
            <h4>Actions</h4>
            <p>Buttons and destinations</p>
          </div>
          <EditorButtonPreview
            buttons={[
              {
                label: settings.button1Label,
                style: settings.button1Style,
                tone: settings.button1Tone,
              },
              {
                label: settings.button2Label,
                style: settings.button2Style,
                tone: settings.button2Tone,
              },
            ]}
          />
          <FieldControlGrid
            fields={actionFields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            routeOptions={routeOptions}
          />
        </section>
      ) : null}
    />
  );
}

export function BillboardBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const billboardDraftSettings = useMemo(() => ({
    ...settings,
    buttonUrl: String(settings.buttonPageRef || settings.buttonUrl || ''),
    button2Url: String(settings.button2PageRef || settings.button2Url || ''),
  }), [settings]);
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const textToneField = fieldById.get('textTone') || null;
  const justifyField = fieldById.get('justify') || null;
  const buttonStyleField = fieldById.get('buttonStyle') || null;
  const buttonToneField = fieldById.get('buttonTone') || null;
  const button2StyleField = fieldById.get('button2Style') || null;
  const button2ToneField = fieldById.get('button2Tone') || null;
  const billboardBgTone = normalizePanelBgTone(settings.bgTone);
  const billboardJustifyOptions = Array.isArray(justifyField?.options) && justifyField.options.length
    ? justifyField.options
    : [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ];
  const billboardJustify = normalizeJustifySelection(settings.justify, billboardJustifyOptions);
  const billboardLineSpacing = normalizeBillboardLineSpacing(settings.lineSpacing);
  const billboardTitleFontFamily = normalizeBillboardTitleFontFamily(settings.titleFontFamily);
  const billboardTitleFontWeight = normalizeBillboardTitleFontWeight(
    settings.titleFontWeight,
    billboardTitleFontFamily,
  );
  const billboardTitleSizeRem = normalizeBillboardTitleSizeRem(settings.titleSizeRem);
  const billboardTitleLetterSpacingEm = normalizeBillboardTitleLetterSpacingEm(
    settings.titleLetterSpacingEm,
    billboardTitleFontFamily,
  );
  const billboardTextTone = normalizePanelTextTone(settings.textTone, 'white');
  const billboardTitleInputRef = useRef(null);
  const [billboardTitleSelection, setBillboardTitleSelection] = useState({
    start: 0,
    end: 0,
    text: '',
  });
  const {
    draftValues,
    updateDraftField,
    commitDraftOnBlur,
    syncRouteRefDraftField,
  } = useBufferedStringFieldDrafts({
    settings: billboardDraftSettings,
    onSettingChange,
    fieldIds: BILLBOARD_LOCAL_DRAFT_FIELD_IDS,
    routeFieldIdByFieldId: {
      buttonUrl: 'buttonPageRef',
      button2Url: 'button2PageRef',
    },
    routeOptions,
  });

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

  return (
    <BillboardHudEditorPanel
      title={String(draftValues.title || '')}
      onTitleChange={(nextValue) => {
        updateDraftField('title', nextValue);
        setBillboardTitleSelection({ start: 0, end: 0, text: '' });
      }}
      onTitleBlur={() => commitDraftOnBlur('title')}
      subtitle={String(draftValues.subtitle || '')}
      onSubtitleChange={(nextValue) => updateDraftField('subtitle', nextValue)}
      onSubtitleBlur={() => commitDraftOnBlur('subtitle')}
      body={String(draftValues.body || '')}
      onBodyChange={(nextValue) => updateDraftField('body', nextValue)}
      onBodyBlur={() => commitDraftOnBlur('body')}
      titleInputRef={billboardTitleInputRef}
      onTitleSelectionCapture={captureBillboardTitleSelection}
      titleSelection={billboardTitleSelection}
      titleColor={extractHeroLineColorToken(String(settings.titleClassName || '').trim())}
      onTitleColorChange={(nextValue) => onSettingChange(
        'titleClassName',
        replaceHeroLineColorClass(String(settings.titleClassName || '').trim(), nextValue),
      )}
      onTitleSelectionColorChange={(nextValue) => {
        const currentTitle = String(draftValues.title || '');
        const safeStart = Math.max(0, Math.min(Number(billboardTitleSelection.start) || 0, currentTitle.length));
        const safeEnd = Math.max(safeStart, Math.min(Number(billboardTitleSelection.end) || 0, currentTitle.length));
        if (safeEnd <= safeStart) {
          return;
        }
        onSettingChange(
          'titleHighlightsJson',
          applySelectionColor(
            settings.titleHighlightsJson,
            currentTitle,
            safeStart,
            safeEnd,
            nextValue,
          ),
        );
      }}
      titleColorOptions={HERO_SWATCH_OPTIONS}
      bodyHtml={String(draftValues.bodyHtml || '')}
      onBodyHtmlChange={(nextValue) => updateDraftField('bodyHtml', nextValue)}
      onBodyHtmlBlur={() => commitDraftOnBlur('bodyHtml')}
      textTone={billboardTextTone}
      onTextToneChange={(nextValue) => onSettingChange('textTone', nextValue)}
      textToneOptions={Array.isArray(textToneField?.options) && textToneField.options.length ? textToneField.options : BILLBOARD_TEXT_SWATCH_OPTIONS}
      bgTone={billboardBgTone}
      onBgToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
      bgToneOptions={Array.isArray(bgToneField?.options) && bgToneField.options.length ? bgToneField.options : BILLBOARD_BG_SWATCH_OPTIONS}
      justify={billboardJustify}
      onJustifyChange={(nextValue) => onSettingChange('justify', nextValue)}
      justifyOptions={billboardJustifyOptions}
      titleFontFamily={billboardTitleFontFamily}
      onTitleFontFamilyChange={(nextValue) => onSettingChange('titleFontFamily', nextValue)}
      titleFontOptions={[
        { value: 'heading', label: 'Avenir' },
        { value: 'helv', label: 'Helvetica Neue' },
      ]}
      titleFontWeight={billboardTitleFontWeight}
      onTitleFontWeightChange={(nextValue) => onSettingChange('titleFontWeight', nextValue)}
      titleWeightOptions={[600, 700, 800, 900]}
      lineSpacing={billboardLineSpacing}
      onLineSpacingChange={(nextValue) => onSettingChange('lineSpacing', Number(nextValue))}
      titleSizeRem={billboardTitleSizeRem}
      onTitleSizeRemChange={(nextValue) => onSettingChange('titleSizeRem', Number(nextValue))}
      titleLetterSpacingEm={billboardTitleLetterSpacingEm}
      onTitleLetterSpacingEmChange={(nextValue) => onSettingChange('titleLetterSpacingEm', Number(nextValue))}
      buttonLabel={String(draftValues.buttonLabel || '')}
      onButtonLabelChange={(nextValue) => updateDraftField('buttonLabel', nextValue)}
      onButtonLabelBlur={() => commitDraftOnBlur('buttonLabel')}
      buttonHref={String(draftValues.buttonUrl || '')}
      onButtonHrefChange={(nextValue) => {
        updateDraftField('buttonUrl', nextValue, { skipRouteRefSync: true });
        syncRouteRefDraftField('buttonUrl', nextValue);
      }}
      onButtonHrefBlur={() => commitDraftOnBlur('buttonUrl')}
      buttonHrefLabel="Button URL/path"
      buttonStyle={String(settings.buttonStyle || '').trim().toLowerCase() || 'blue'}
      onButtonStyleChange={(nextValue) => onSettingChange('buttonStyle', nextValue)}
      buttonStyleOptions={Array.isArray(buttonStyleField?.options) && buttonStyleField.options.length ? buttonStyleField.options : BILLBOARD_BUTTON_STYLE_OPTIONS}
      buttonTone={String(settings.buttonTone || '').trim().toLowerCase() || 'atlantean'}
      onButtonToneChange={(nextValue) => onSettingChange('buttonTone', nextValue)}
      buttonToneOptions={Array.isArray(buttonToneField?.options) && buttonToneField.options.length ? buttonToneField.options : BILLBOARD_BUTTON_TONE_OPTIONS}
      button2Label={String(draftValues.button2Label || '')}
      onButton2LabelChange={(nextValue) => updateDraftField('button2Label', nextValue)}
      onButton2LabelBlur={() => commitDraftOnBlur('button2Label')}
      button2Href={String(draftValues.button2Url || '')}
      onButton2HrefChange={(nextValue) => {
        updateDraftField('button2Url', nextValue, { skipRouteRefSync: true });
        syncRouteRefDraftField('button2Url', nextValue);
      }}
      onButton2HrefBlur={() => commitDraftOnBlur('button2Url')}
      button2HrefLabel="Button 2 URL/path"
      button2Style={String(settings.button2Style || '').trim().toLowerCase() || 'outline'}
      onButton2StyleChange={(nextValue) => onSettingChange('button2Style', nextValue)}
      button2StyleOptions={Array.isArray(button2StyleField?.options) && button2StyleField.options.length ? button2StyleField.options : BILLBOARD_BUTTON_STYLE_OPTIONS}
      button2Tone={String(settings.button2Tone || '').trim().toLowerCase() || 'white'}
      onButton2ToneChange={(nextValue) => onSettingChange('button2Tone', nextValue)}
      button2ToneOptions={Array.isArray(button2ToneField?.options) && button2ToneField.options.length ? button2ToneField.options : BILLBOARD_BUTTON_TONE_OPTIONS}
      contentMaxWidthPx={settings.contentMaxWidthPx ?? null}
      onContentMaxWidthPxChange={(nextValue) => onSettingChange('contentMaxWidthPx', nextValue == null || nextValue === '' ? '' : Number(nextValue))}
    />
  );
}

function resolvePresetFieldList(fieldById, presetFieldIds = [], fallbackFieldIds = [], routeRefFieldIds = {}) {
  const fieldIds = Array.isArray(presetFieldIds) && presetFieldIds.length ? presetFieldIds : fallbackFieldIds;
  return fieldIds.map((fieldId) => {
    const token = String(fieldId || '').trim();
    if (!token) {
      return null;
    }
    if (routeRefFieldIds[token]) {
      return getPromotedRouteLinkField(fieldById, token, routeRefFieldIds[token]);
    }
    return fieldById.get(token) || null;
  }).filter(Boolean);
}

function readEditorLocalDrafts(settings = {}, fieldIds = []) {
  return (Array.isArray(fieldIds) ? fieldIds : []).reduce((drafts, fieldId) => {
    drafts[fieldId] = String(settings?.[fieldId] || '');
    return drafts;
  }, {});
}

function readEditorRouteRefDrafts(settings = {}, routeFieldIdByFieldId = {}) {
  return Object.entries(routeFieldIdByFieldId || {}).reduce((drafts, [fieldId, routeRefFieldId]) => {
    drafts[fieldId] = String(settings?.[routeRefFieldId] || '');
    return drafts;
  }, {});
}

function areTokenListsEqual(left = [], right = []) {
  if (left === right) {
    return true;
  }
  if (left.length !== right.length) {
    return false;
  }
  return left.every((token, index) => token === right[index]);
}

function useBufferedStringFieldDrafts({
  settings = {},
  onSettingChange,
  fieldIds = [],
  routeFieldIdByFieldId = {},
  routeOptions = [],
}) {
  const normalizedFieldIds = useMemo(
    () => (Array.isArray(fieldIds) ? fieldIds.map((fieldId) => String(fieldId || '').trim()).filter(Boolean) : []),
    [fieldIds],
  );
  const normalizedRouteOptions = useMemo(
    () => sortPages(Array.isArray(routeOptions) ? routeOptions : []),
    [routeOptions],
  );
  const [draftValues, setDraftValues] = useState(() => readEditorLocalDrafts(settings, normalizedFieldIds));
  const [routeRefDraftValues, setRouteRefDraftValues] = useState(() => (
    readEditorRouteRefDrafts(settings, routeFieldIdByFieldId)
  ));
  const [dirtyFieldIds, setDirtyFieldIds] = useState([]);
  const commitTimersRef = useRef(new Map());
  const externalDraftValues = useMemo(
    () => readEditorLocalDrafts(settings, normalizedFieldIds),
    [normalizedFieldIds, settings],
  );
  const externalRouteRefValues = useMemo(
    () => readEditorRouteRefDrafts(settings, routeFieldIdByFieldId),
    [routeFieldIdByFieldId, settings],
  );

  useEffect(() => () => {
    commitTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    commitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    setDraftValues((current) => {
      let changed = false;
      const next = { ...current };
      normalizedFieldIds.forEach((fieldId) => {
        if (dirtyFieldIds.includes(fieldId)) {
          return;
        }
        const externalValue = externalDraftValues[fieldId];
        if (current[fieldId] === externalValue) {
          return;
        }
        next[fieldId] = externalValue;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [dirtyFieldIds, externalDraftValues, normalizedFieldIds]);

  useEffect(() => {
    setRouteRefDraftValues((current) => {
      let changed = false;
      const next = { ...current };
      normalizedFieldIds.forEach((fieldId) => {
        if (dirtyFieldIds.includes(fieldId)) {
          return;
        }
        const externalValue = externalRouteRefValues[fieldId] ?? '';
        if ((current[fieldId] ?? '') === externalValue) {
          return;
        }
        next[fieldId] = externalValue;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [dirtyFieldIds, externalRouteRefValues, normalizedFieldIds]);

  useEffect(() => {
    setDirtyFieldIds((current) => {
      const next = current.filter((fieldId) => draftValues[fieldId] !== externalDraftValues[fieldId]);
      return areTokenListsEqual(current, next) ? current : next;
    });
  }, [draftValues, externalDraftValues]);

  const commitDraftField = (fieldId, nextValue, { skipRouteRefSync = false } = {}) => {
    const timerId = commitTimersRef.current.get(fieldId);
    if (timerId) {
      window.clearTimeout(timerId);
      commitTimersRef.current.delete(fieldId);
    }

    onSettingChange(fieldId, nextValue);

    const routeRefFieldId = routeFieldIdByFieldId[fieldId];
    if (!routeRefFieldId || skipRouteRefSync) {
      return;
    }

    const exactPage = normalizedRouteOptions.find((page) => page.path === String(nextValue || '').trim());
    const nextRouteRefValue = exactPage ? toManagedPageLinkRef(exactPage) : '';
    setRouteRefDraftValues((current) => (
      current[fieldId] === nextRouteRefValue
        ? current
        : { ...current, [fieldId]: nextRouteRefValue }
    ));
    onSettingChange(routeRefFieldId, nextRouteRefValue);
  };

  const scheduleDraftCommit = (fieldId, nextValue, options = {}) => {
    const timerId = commitTimersRef.current.get(fieldId);
    if (timerId) {
      window.clearTimeout(timerId);
    }
    commitTimersRef.current.set(fieldId, window.setTimeout(() => {
      commitDraftField(fieldId, nextValue, options);
    }, EDITOR_LOCAL_DRAFT_COMMIT_DELAY_MS));
  };

  const updateDraftField = (fieldId, nextValue, { commitImmediately = false, skipRouteRefSync = false } = {}) => {
    setDraftValues((current) => (
      current[fieldId] === nextValue
        ? current
        : { ...current, [fieldId]: nextValue }
    ));
    setDirtyFieldIds((current) => (current.includes(fieldId) ? current : [...current, fieldId]));
    if (commitImmediately) {
      commitDraftField(fieldId, nextValue, { skipRouteRefSync });
      return;
    }
    scheduleDraftCommit(fieldId, nextValue, { skipRouteRefSync });
  };

  const commitDraftOnBlur = (fieldId) => {
    commitDraftField(fieldId, draftValues[fieldId] ?? '');
  };

  const syncRouteRefDraftField = (fieldId, nextValue) => {
    const routeRefFieldId = routeFieldIdByFieldId[fieldId];
    if (!routeRefFieldId) {
      return;
    }
    const exactPage = normalizedRouteOptions.find((page) => page.path === String(nextValue || '').trim());
    const nextRouteRefValue = exactPage ? toManagedPageLinkRef(exactPage) : '';
    setRouteRefDraftValues((current) => (
      current[fieldId] === nextRouteRefValue
        ? current
        : { ...current, [fieldId]: nextRouteRefValue }
    ));
    onSettingChange(routeRefFieldId, nextRouteRefValue);
  };

  const handleRouteRefChange = (fieldId, nextValue) => {
    const routeRefFieldId = routeFieldIdByFieldId[fieldId];
    if (!routeRefFieldId) {
      return;
    }
    setRouteRefDraftValues((current) => (
      current[fieldId] === nextValue
        ? current
        : { ...current, [fieldId]: nextValue }
    ));
    onSettingChange(routeRefFieldId, nextValue);
    const matchedPage = normalizedRouteOptions.find((page) => toManagedPageLinkRef(page) === String(nextValue || '').trim());
    if (matchedPage?.path) {
      setDraftValues((current) => (
        current[fieldId] === matchedPage.path
          ? current
          : { ...current, [fieldId]: matchedPage.path }
      ));
      setDirtyFieldIds((current) => (current.includes(fieldId) ? current : [...current, fieldId]));
      scheduleDraftCommit(fieldId, matchedPage.path, { skipRouteRefSync: true });
    }
  };

  return {
    draftValues,
    routeRefDraftValues,
    updateDraftField,
    commitDraftOnBlur,
    syncRouteRefDraftField,
    handleRouteRefChange,
  };
}

function DraftBackedFieldControlGrid({
  fields,
  settings,
  onSettingChange,
  className = '',
  routeOptions = [],
  draftFieldIds = [],
}) {
  const items = Array.isArray(fields) ? fields.filter(Boolean) : [];
  const explicitDraftFieldIds = new Set(
    (Array.isArray(draftFieldIds) ? draftFieldIds : [])
      .map((fieldId) => String(fieldId || '').trim())
      .filter(Boolean),
  );
  const draftedFields = items.filter((field) => (
    explicitDraftFieldIds.has(String(field?.id || '').trim())
    && ['text', 'textarea', 'route_link'].includes(String(field?.type || '').trim().toLowerCase())
  ));
  const draftedFieldIds = draftedFields.map((field) => String(field.id || '').trim());
  const routeFieldIdByFieldId = draftedFields.reduce((accumulator, field) => {
    if (field?.type === 'route_link' && field.routeRefFieldId) {
      accumulator[field.id] = String(field.routeRefFieldId || '').trim();
    }
    return accumulator;
  }, {});
  const {
    draftValues,
    routeRefDraftValues,
    updateDraftField,
    commitDraftOnBlur,
    handleRouteRefChange,
  } = useBufferedStringFieldDrafts({
    settings,
    onSettingChange,
    fieldIds: draftedFieldIds,
    routeFieldIdByFieldId,
    routeOptions,
  });
  const draftedFieldIdSet = new Set(draftedFieldIds);

  if (!items.length) {
    return null;
  }

  return (
    <div className={`admin-content-field-list${className ? ` ${className}` : ''}`}>
      {items.map((field) => {
        const fieldId = String(field?.id || '').trim();
        const isDrafted = draftedFieldIdSet.has(fieldId);
        return (
          <label key={field.id} className={field.layout === 'half' ? 'is-half' : undefined}>
            <span>{field.label}</span>
            {isDrafted ? (
              field.type === 'route_link' ? (
                <RouteLinkField
                  value={draftValues[fieldId] ?? ''}
                  routeRefValue={field.routeRefFieldId ? routeRefDraftValues[fieldId] ?? '' : ''}
                  onChange={(nextValue) => updateDraftField(fieldId, nextValue)}
                  onRouteRefChange={field.routeRefFieldId ? (nextValue) => handleRouteRefChange(fieldId, nextValue) : undefined}
                  routeOptions={routeOptions}
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  rows={field.rows || 4}
                  value={draftValues[fieldId] ?? ''}
                  placeholder={field.placeholder || undefined}
                  onChange={(event) => updateDraftField(fieldId, event.target.value)}
                  onBlur={() => commitDraftOnBlur(fieldId)}
                />
              ) : (
                <input
                  type="text"
                  value={draftValues[fieldId] ?? ''}
                  placeholder={field.placeholder || undefined}
                  onChange={(event) => updateDraftField(fieldId, event.target.value)}
                  onBlur={() => commitDraftOnBlur(fieldId)}
                />
              )
            ) : renderFieldControl(
              field,
              settings?.[field.id],
              (nextValue) => {
                onSettingChange(field.id, nextValue);
              },
              settings,
              onSettingChange,
              routeOptions,
            )}
          </label>
        );
      })}
    </div>
  );
}

function SiteFeatureDraftField({
  field,
  value,
  onChange,
  onBlur,
  routeRefValue = '',
  onRouteRefChange,
  routeOptions = [],
  fullWidth = false,
}) {
  if (!field) {
    return null;
  }

  let control = null;
  if (field.type === 'textarea') {
    control = (
      <textarea
        rows={field.rows || 4}
        value={value ?? ''}
        placeholder={field.placeholder || undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    );
  } else if (field.type === 'route_link') {
    control = (
      <RouteLinkField
        value={value}
        routeRefValue={routeRefValue}
        onChange={onChange}
        onRouteRefChange={onRouteRefChange}
        routeOptions={routeOptions}
      />
    );
  } else {
    control = (
      <input
        type="text"
        value={value ?? ''}
        placeholder={field.placeholder || undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    );
  }

  return (
    <label className={`admin-site-feature-field${fullWidth ? ' admin-site-feature-field--full' : ''}`}>
      <span>{field.label}</span>
      {control}
    </label>
  );
}

function SingleActionPromoBlockEditor({
  block,
  onSettingChange,
  routeOptions = [],
  presetHeading = 'Preset',
  contentHeading = 'Content',
  actionHeading = 'Action',
  fallbackContentFieldIds = [],
  fallbackActionFieldIds = [],
  routeRefFieldIds = {},
  draftFieldIds = [],
}) {
  const settings = block.settings || {};
  const presetDefinition = resolveBlockPresetDefinition(block);
  const presetDescription = String(presetDefinition?.description || '').trim();
  const presetEditor = presetDefinition?.editor || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const contentFields = resolvePresetFieldList(
    fieldById,
    presetEditor.contentFieldIds,
    fallbackContentFieldIds,
    routeRefFieldIds,
  );
  const actionFields = resolvePresetFieldList(
    fieldById,
    presetEditor.actionFieldIds,
    fallbackActionFieldIds,
    routeRefFieldIds,
  );

  return (
    <div className="admin-cta-field-slots">
      {presetDefinition ? (
        <section className="admin-cta-field-slot-card">
          <h4>{presetHeading}</h4>
          <p><strong>{presetDefinition.label}</strong></p>
          {presetDescription ? <p>{presetDescription}</p> : null}
        </section>
      ) : null}
      <section className="admin-cta-field-slot-card">
        <h4>{contentHeading}</h4>
        <DraftBackedFieldControlGrid
          fields={contentFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={draftFieldIds}
        />
      </section>
      <section className="admin-cta-field-slot-card">
        <h4>{actionHeading}</h4>
        <DraftBackedFieldControlGrid
          fields={actionFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={draftFieldIds}
        />
      </section>
    </div>
  );
}

export function FeaturePanelBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  return (
    <SingleActionPromoBlockEditor
      block={block}
      onSettingChange={onSettingChange}
      routeOptions={routeOptions}
      contentHeading="Feature panel"
      fallbackContentFieldIds={['title', 'bodyHtml', 'body']}
      fallbackActionFieldIds={['buttonLabel', 'buttonUrl', 'buttonOpenInNewWindow']}
      routeRefFieldIds={{ buttonUrl: 'buttonPageRef' }}
      draftFieldIds={['title', 'body', 'buttonLabel', 'buttonUrl']}
    />
  );
}

export function SiteFeatureBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const featureEntry = resolveSiteFeatureCatalogEntry(settings.featureId);
  const allowedFieldIds = new Set(getAllowedSiteFeatureEditableFieldIds(settings.featureId));
  const normalizedRouteOptions = useMemo(
    () => sortPages(Array.isArray(routeOptions) ? routeOptions : []),
    [routeOptions],
  );
  const featureIdField = fieldById.get('featureId');
  const headlineField = fieldById.get('headline');
  const bodyField = fieldById.get('body');
  const buttonLabelField = fieldById.get('buttonLabel');
  const buttonUrlField = getPromotedRouteLinkField(fieldById, 'buttonUrl', 'buttonPageRef');
  const buttonOpenInNewWindowField = fieldById.get('buttonOpenInNewWindow');
  const allowsActionOverrides = SITE_FEATURE_ACTION_FIELD_IDS.some((fieldId) => allowedFieldIds.has(fieldId));
  const [draftValues, setDraftValues] = useState(() => readEditorLocalDrafts(settings, SITE_FEATURE_LOCAL_DRAFT_FIELD_IDS));
  const [dirtyFieldIds, setDirtyFieldIds] = useState([]);
  const commitTimersRef = useRef(new Map());
  const externalDraftValues = useMemo(
    () => readEditorLocalDrafts(settings, SITE_FEATURE_LOCAL_DRAFT_FIELD_IDS),
    [settings],
  );

  useEffect(() => () => {
    commitTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    commitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    setDraftValues((current) => {
      let changed = false;
      const next = { ...current };
      SITE_FEATURE_LOCAL_DRAFT_FIELD_IDS.forEach((fieldId) => {
        if (dirtyFieldIds.includes(fieldId)) {
          return;
        }
        const externalValue = externalDraftValues[fieldId];
        if (current[fieldId] === externalValue) {
          return;
        }
        next[fieldId] = externalValue;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [dirtyFieldIds, externalDraftValues]);

  useEffect(() => {
    setDirtyFieldIds((current) => {
      const next = current.filter((fieldId) => draftValues[fieldId] !== externalDraftValues[fieldId]);
      return areTokenListsEqual(current, next) ? current : next;
    });
  }, [draftValues, externalDraftValues]);

  const commitDraftField = (fieldId, nextValue, { skipRouteRefSync = false } = {}) => {
    const timerId = commitTimersRef.current.get(fieldId);
    if (timerId) {
      window.clearTimeout(timerId);
      commitTimersRef.current.delete(fieldId);
    }

    onSettingChange(fieldId, nextValue);
    if (fieldId !== 'buttonUrl' || skipRouteRefSync) {
      return;
    }

    const exactPage = normalizedRouteOptions.find((page) => page.path === String(nextValue || '').trim());
    onSettingChange('buttonPageRef', exactPage ? toManagedPageLinkRef(exactPage) : '');
  };

  const scheduleDraftCommit = (fieldId, nextValue, options = {}) => {
    const timerId = commitTimersRef.current.get(fieldId);
    if (timerId) {
      window.clearTimeout(timerId);
    }
    commitTimersRef.current.set(fieldId, window.setTimeout(() => {
      commitDraftField(fieldId, nextValue, options);
    }, EDITOR_LOCAL_DRAFT_COMMIT_DELAY_MS));
  };

  const updateDraftField = (fieldId, nextValue, { commitImmediately = false, skipRouteRefSync = false } = {}) => {
    setDraftValues((current) => (
      current[fieldId] === nextValue
        ? current
        : { ...current, [fieldId]: nextValue }
    ));
    setDirtyFieldIds((current) => (current.includes(fieldId) ? current : [...current, fieldId]));
    if (commitImmediately) {
      commitDraftField(fieldId, nextValue, { skipRouteRefSync });
      return;
    }
    scheduleDraftCommit(fieldId, nextValue, { skipRouteRefSync });
  };

  const commitDraftOnBlur = (fieldId) => {
    commitDraftField(fieldId, draftValues[fieldId] ?? '');
  };

  return (
    <div className="admin-cta-field-slots">
      <section className="admin-cta-field-slot-card">
        <h4>Code-managed feature</h4>
        <p>{featureEntry?.description || 'Layout and animation are locked in code. This block only exposes a feature id plus optional copy and CTA overrides.'}</p>
      </section>
      <section className="admin-cta-field-slot-card">
        <h4>{featureEntry?.label ? `${featureEntry.label} overrides` : 'Feature overrides'}</h4>
        {featureIdField && allowedFieldIds.has('featureId') ? (
          <FieldControlGrid
            fields={[featureIdField]}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            routeOptions={routeOptions}
          />
        ) : null}
        <div className="admin-site-feature-field-stack">
          {headlineField && allowedFieldIds.has('headline') ? (
            <SiteFeatureDraftField
              field={headlineField}
              value={draftValues.headline}
              onChange={(nextValue) => updateDraftField('headline', nextValue)}
              onBlur={() => commitDraftOnBlur('headline')}
              fullWidth
            />
          ) : null}
          {bodyField && allowedFieldIds.has('body') ? (
            <SiteFeatureDraftField
              field={bodyField}
              value={draftValues.body}
              onChange={(nextValue) => updateDraftField('body', nextValue)}
              onBlur={() => commitDraftOnBlur('body')}
              fullWidth
            />
          ) : null}
        </div>
      </section>
      {allowsActionOverrides ? (
        <section className="admin-cta-field-slot-card">
          <h4>Optional CTA override</h4>
          <div className="admin-site-feature-field-stack">
            {buttonLabelField && allowedFieldIds.has('buttonLabel') ? (
              <SiteFeatureDraftField
                field={buttonLabelField}
                value={draftValues.buttonLabel}
                onChange={(nextValue) => updateDraftField('buttonLabel', nextValue)}
                onBlur={() => commitDraftOnBlur('buttonLabel')}
                fullWidth
              />
            ) : null}
            {buttonUrlField && (
              allowedFieldIds.has('buttonUrl')
              || allowedFieldIds.has('buttonPageRef')
            ) ? (
              <SiteFeatureDraftField
                field={buttonUrlField}
                value={draftValues.buttonUrl}
                routeRefValue={String(settings.buttonPageRef || '')}
                onChange={(nextValue) => updateDraftField('buttonUrl', nextValue)}
                onRouteRefChange={(nextValue) => {
                  onSettingChange('buttonPageRef', nextValue);
                  const matchedPage = normalizedRouteOptions.find((page) => toManagedPageLinkRef(page) === String(nextValue || '').trim());
                  if (matchedPage?.path) {
                    updateDraftField('buttonUrl', matchedPage.path, {
                      commitImmediately: true,
                      skipRouteRefSync: true,
                    });
                  }
                }}
                routeOptions={routeOptions}
                fullWidth
              />
            ) : null}
            {buttonOpenInNewWindowField && allowedFieldIds.has('buttonOpenInNewWindow') ? (
              <FieldControlGrid
                fields={[buttonOpenInNewWindowField]}
                settings={settings}
                onSettingChange={onSettingChange}
                className="admin-content-field-list--inline"
                routeOptions={routeOptions}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function SplitPanelBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const splitPanelDraftFieldIds = [
    'leftTitle',
    'leftBody',
    'leftButtonLabel',
    'leftButtonUrl',
    'rightTitle',
    'rightBody',
    'rightButtonLabel',
    'rightButtonUrl',
  ];
  const buildSideFields = (side) => {
    return [
      fieldById.get(`${side}Title`),
      fieldById.get(`${side}BodyHtml`),
      fieldById.get(`${side}Body`),
      ...buildInlineActionFields({
        fieldById,
        labelFieldId: `${side}ButtonLabel`,
        hrefFieldId: `${side}ButtonUrl`,
        routeRefFieldId: `${side}ButtonPageRef`,
        openInNewWindowFieldId: `${side}ButtonOpenInNewWindow`,
      }),
    ].filter(Boolean);
  };

  return (
    <div className="admin-cta-field-slots">
      {['left', 'right'].map((side) => (
        <section key={`split-panel-${side}`} className="admin-cta-field-slot-card">
          <h4>{side === 'left' ? 'Left panel' : 'Right panel'}</h4>
          <DraftBackedFieldControlGrid
            fields={buildSideFields(side)}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            routeOptions={routeOptions}
            draftFieldIds={splitPanelDraftFieldIds}
          />
        </section>
      ))}
    </div>
  );
}

export function ServicesGridBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const contentFields = [
    fieldById.get('heading'),
    fieldById.get('headingSizeRem'),
    fieldById.get('cardTitleSizeRem'),
    fieldById.get('cardPaddingRem'),
    fieldById.get('browseLabel'),
    getPromotedRouteLinkField(fieldById, 'browsePath', 'browsePageRef'),
  ].filter(Boolean);

  const buildCardFields = (slot) => {
    return [
      fieldById.get(`card${slot}Title`),
      getPromotedRouteLinkField(fieldById, `card${slot}Path`, `card${slot}PageRef`),
      fieldById.get(`card${slot}ImageUrl`),
      fieldById.get(`card${slot}ImageAlt`),
      fieldById.get(`card${slot}Action`),
      fieldById.get(`card${slot}Featured`),
    ].filter(Boolean);
  };

  const cardSlots = useMemo(() => (
    Array.from({ length: 6 }, (_, index) => index + 1).map((slot) => {
      const title = String(settings[`card${slot}Title`] || '').trim();
      const path = String(settings[`card${slot}Path`] || settings[`card${slot}PageRef`] || '').trim();
      const imageUrl = String(settings[`card${slot}ImageUrl`] || '').trim();
      const action = String(settings[`card${slot}Action`] || '').trim();
      const featured = Boolean(settings[`card${slot}Featured`]);
      const isExisting = Boolean(title || path || imageUrl || action || featured);
      return {
        slot,
        kicker: `Card ${slot}`,
        title,
        fallbackTitle: isExisting ? `Card ${slot}` : `New card ${slot}`,
        summary: summarizeProgressiveSlot([
          action,
          featured ? 'Featured' : '',
          path,
        ]),
        isExisting,
        fields: buildCardFields(slot),
      };
    })
  ), [fieldById, settings]);
  const availableCardSlots = cardSlots.map((item) => item.slot);
  const existingCardSlots = cardSlots.filter((item) => item.isExisting).map((item) => item.slot);
  const [revealedCardSlots, setRevealedCardSlots] = useState(existingCardSlots);
  const [expandedCardSlot, setExpandedCardSlot] = useState(existingCardSlots[0] || null);

  useEffect(() => {
    setRevealedCardSlots((current) => {
      const merged = mergeVisibleSlotList(current, existingCardSlots, availableCardSlots);
      return areSlotListsEqual(current, merged) ? current : merged;
    });
  }, [availableCardSlots, existingCardSlots]);

  const visibleCardSlots = mergeVisibleSlotList(revealedCardSlots, existingCardSlots, availableCardSlots);

  useEffect(() => {
    if (!visibleCardSlots.length) {
      if (expandedCardSlot !== null) {
        setExpandedCardSlot(null);
      }
      return;
    }
    if (expandedCardSlot === null || !visibleCardSlots.includes(expandedCardSlot)) {
      setExpandedCardSlot(visibleCardSlots[0]);
    }
  }, [expandedCardSlot, visibleCardSlots]);

  const nextHiddenCardSlot = availableCardSlots.find((slot) => !visibleCardSlots.includes(slot)) || null;

  return (
    <div className="admin-cta-field-slots">
      <section className="admin-cta-field-slot-card">
        <h4>Grid</h4>
        <DraftBackedFieldControlGrid
          fields={contentFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={SERVICES_GRID_LOCAL_DRAFT_FIELD_IDS}
        />
      </section>

      <ProgressiveCardEditorList
        heading="Cards"
        slots={cardSlots.filter((item) => visibleCardSlots.includes(item.slot))}
        expandedSlot={expandedCardSlot}
        onToggleSlot={(slot) => setExpandedCardSlot((current) => (current === slot ? null : slot))}
        onRevealNextSlot={nextHiddenCardSlot
          ? () => {
            setRevealedCardSlots((current) => mergeVisibleSlotList([...current, nextHiddenCardSlot], existingCardSlots, availableCardSlots));
            setExpandedCardSlot(nextHiddenCardSlot);
          }
          : null}
        revealLabel={nextHiddenCardSlot ? `Add card ${nextHiddenCardSlot}` : 'Add card'}
        renderSlotBody={(slotData) => (
          <DraftBackedFieldControlGrid
            fields={slotData.fields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            routeOptions={routeOptions}
            draftFieldIds={SERVICES_GRID_LOCAL_DRAFT_FIELD_IDS}
          />
        )}
      />
    </div>
  );
}

export function ImpactStatBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const contentFields = [
    fieldById.get('titlePrefix'),
    fieldById.get('highlight'),
    fieldById.get('body'),
    fieldById.get('countUp'),
  ].filter(Boolean);
  const actionFields = [
    fieldById.get('ctaLabel'),
    getPromotedRouteLinkField(fieldById, 'ctaPath', 'ctaPageRef'),
    fieldById.get('ctaOpenInNewWindow'),
  ].filter(Boolean);
  const buildStatFields = (slot) => ([
    fieldById.get(`stat${slot}Value`),
    fieldById.get(`stat${slot}Label`),
    fieldById.get(`stat${slot}Tone`),
  ].filter(Boolean));

  return (
    <div className="admin-cta-field-slots">
      <section className="admin-cta-field-slot-card">
        <h4>Impact</h4>
        <DraftBackedFieldControlGrid
          fields={contentFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={IMPACT_STAT_LOCAL_DRAFT_FIELD_IDS}
        />
      </section>
      <section className="admin-cta-field-slot-card">
        <h4>Action</h4>
        <DraftBackedFieldControlGrid
          fields={actionFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={IMPACT_STAT_LOCAL_DRAFT_FIELD_IDS}
        />
      </section>
      {Array.from({ length: 3 }, (_, index) => index + 1).map((slot) => (
        <section key={`impact-stat-${slot}`} className="admin-cta-field-slot-card">
          <h4>Stat {slot}</h4>
          <DraftBackedFieldControlGrid
            fields={buildStatFields(slot)}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            routeOptions={routeOptions}
            draftFieldIds={IMPACT_STAT_LOCAL_DRAFT_FIELD_IDS}
          />
        </section>
      ))}
    </div>
  );
}

export function CtaBandBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  return (
    <SingleActionPromoBlockEditor
      block={block}
      onSettingChange={onSettingChange}
      routeOptions={routeOptions}
      presetHeading="CTA band preset"
      contentHeading="Band"
      fallbackContentFieldIds={['title', 'body', 'bgTone']}
      fallbackActionFieldIds={['buttonLabel', 'buttonUrl', 'buttonOpenInNewWindow']}
      routeRefFieldIds={{ buttonUrl: 'buttonPageRef' }}
      draftFieldIds={CTA_BAND_LOCAL_DRAFT_FIELD_IDS}
    />
  );
}

export function CalculatorCtaBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const contentFields = [
    fieldById.get('title'),
    fieldById.get('subtitle'),
    fieldById.get('body'),
    fieldById.get('howItWorksTitle'),
    fieldById.get('step1'),
    fieldById.get('step2'),
    fieldById.get('step3'),
    fieldById.get('resultsTitle'),
  ].filter(Boolean);
  const calculatorFields = [
    fieldById.get('totalInvestmentLabel'),
    fieldById.get('ladderYearsLabel'),
    fieldById.get('ladderYearsHelper'),
    fieldById.get('maturityLabel'),
    fieldById.get('reinvestOptionLabel'),
    fieldById.get('cashOutOptionLabel'),
    fieldById.get('visualizeYearsLabel'),
    fieldById.get('visualizeYearsHelper'),
    fieldById.get('calculateLabel'),
    fieldById.get('note'),
    fieldById.get('disclaimer'),
    fieldById.get('customRatesNote'),
  ].filter(Boolean);
  const followupFields = [
    fieldById.get('downloadTitle'),
    fieldById.get('downloadBody'),
    fieldById.get('downloadButtonLabel'),
    fieldById.get('discussTitle'),
    fieldById.get('discussBody'),
    fieldById.get('discussButtonLabel'),
  ].filter(Boolean);

  return (
    <div className="admin-cta-field-slots">
      <section className="admin-cta-field-slot-card">
        <h4>Content</h4>
        <DraftBackedFieldControlGrid
          fields={contentFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          draftFieldIds={CALCULATOR_CTA_LOCAL_DRAFT_FIELD_IDS}
        />
      </section>
      <section className="admin-cta-field-slot-card">
        <h4>Calculator Labels</h4>
        <DraftBackedFieldControlGrid
          fields={calculatorFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          draftFieldIds={CALCULATOR_CTA_LOCAL_DRAFT_FIELD_IDS}
        />
      </section>
      <section className="admin-cta-field-slot-card">
        <h4>Follow-up</h4>
        <DraftBackedFieldControlGrid
          fields={followupFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          draftFieldIds={CALCULATOR_CTA_LOCAL_DRAFT_FIELD_IDS}
        />
      </section>
    </div>
  );
}

export function GridBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const documentsContext = useContext(DocumentsContext);
  const documents = Array.isArray(documentsContext?.documents) ? documentsContext.documents : [];
  const settings = block.settings || {};
  const presetDefinition = resolveBlockPresetDefinition(block);
  const presetEditor = presetDefinition?.editor || {};
  const presetCardFeatures = presetEditor?.cardFeatures || {};
  const presetDescription = String(presetDefinition?.description || '').trim();
  const introHtml = String(settings.bodyHtml || '').trim();
  const hasIntroContent = Boolean(
    String(settings.title || '').trim()
    || String(settings.body || '').trim()
    || (introHtml && introHtml !== '<p></p>' && introHtml !== '<p><br></p>'),
  );
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const titleToneFieldBase = fieldById.get('titleTone') || null;
  const bodyToneFieldBase = fieldById.get('bodyTone') || null;
  const dividerToneField = fieldById.get('dividerTone') || null;
  const cardStyleFieldBase = fieldById.get('cardStyle') || null;
  const gridBgTone = normalizeGridBgTone(settings.bgTone);
  const titleToneField = useMemo(() => {
    if (!titleToneFieldBase) {
      return null;
    }
    const compatibleOptions = getGridCompatibleToneOptions(titleToneFieldBase.options, gridBgTone);
    return {
      ...titleToneFieldBase,
      options: compatibleOptions.length ? compatibleOptions : (Array.isArray(titleToneFieldBase.options) ? titleToneFieldBase.options : []),
    };
  }, [gridBgTone, titleToneFieldBase]);
  const bodyToneField = useMemo(() => {
    if (!bodyToneFieldBase) {
      return null;
    }
    const compatibleOptions = getGridCompatibleToneOptions(bodyToneFieldBase.options, gridBgTone);
    return {
      ...bodyToneFieldBase,
      options: compatibleOptions.length ? compatibleOptions : (Array.isArray(bodyToneFieldBase.options) ? bodyToneFieldBase.options : []),
    };
  }, [bodyToneFieldBase, gridBgTone]);
  const cardStyleField = useMemo(() => {
    if (!cardStyleFieldBase) {
      return null;
    }
    const compatibleOptions = getGridCompatibleCardStyleOptions(cardStyleFieldBase.options, gridBgTone);
    return {
      ...cardStyleFieldBase,
      options: compatibleOptions.length ? compatibleOptions : (Array.isArray(cardStyleFieldBase.options) ? cardStyleFieldBase.options : []),
    };
  }, [cardStyleFieldBase, gridBgTone]);
  const showIntroFields = presetEditor.introFields !== false || hasIntroContent;
  const allowedLayoutFieldIds = new Set(
    Array.isArray(presetEditor.layoutFieldIds) && presetEditor.layoutFieldIds.length
      ? presetEditor.layoutFieldIds
      : ['contentWidth', 'columns', 'cardStyle', 'showTitleDivider'],
  );
  const showTypographyFields = presetEditor.typographyFields !== false;
  const presetMaxCards = Number.isInteger(presetEditor.maxCards)
    ? Math.max(1, Math.min(8, presetEditor.maxCards))
    : 8;
  const appearanceFields = [titleToneField, bodyToneField, dividerToneField]
    .filter(Boolean)
    .map((field) => ({
      ...field,
      label: field.id === 'dividerTone'
        ? 'Line color'
        : (field.id === 'titleTone' ? 'Card title color' : field.label),
      compact: true,
      iconOnly: true,
      swatchClassName: 'admin-button-tone-swatch-list',
    }));
  const cardDividerOptions = useMemo(() => (
    (Array.isArray(dividerToneField?.options) ? dividerToneField.options : [])
      .map((option) => ({
        ...option,
        token: String(option?.value || '').trim().toLowerCase(),
      }))
      .filter((option) => option.token && option.token !== 'auto')
  ), [dividerToneField]);

  const layoutFields = [
    fieldById.get('contentWidth'),
    fieldById.get('columns'),
    cardStyleField,
    fieldById.get('showTitleDivider'),
  ].filter((field) => field && allowedLayoutFieldIds.has(field.id));
  const cardTypographyFields = [
    fieldById.get('cardPaddingRem'),
    fieldById.get('cardTitleSizeRem'),
    fieldById.get('cardBodySizeRem'),
    fieldById.get('cardBodyLineHeight'),
  ].filter(Boolean);
  const normalizedRouteOptions = useMemo(
    () => (Array.isArray(routeOptions) ? routeOptions.map(normalizeRouteOption).filter(Boolean) : []),
    [routeOptions],
  );
  const documentOptions = useMemo(() => (
    (Array.isArray(documents) ? documents : [])
      .filter((doc) => doc?.active !== false && String(doc?.id || '').trim())
      .map((doc) => ({
        value: String(doc.id || '').trim(),
        label: [String(doc.title || '').trim(), String(doc.topic || '').trim()].filter(Boolean).join(' - ') || String(doc.id || '').trim(),
      }))
  ), [documents]);

  useEffect(() => {
    if (!cardStyleFieldBase) {
      return;
    }
    const normalizedCurrentStyle = normalizeGridCardStyleToken(settings.cardStyle);
    const nextStyle = getGridSafeCardStyleForBg(settings.cardStyle, gridBgTone, cardStyleFieldBase.options);
    if (nextStyle !== normalizedCurrentStyle) {
      onSettingChange('cardStyle', nextStyle);
    }
  }, [cardStyleFieldBase, gridBgTone, onSettingChange, settings.cardStyle]);

  useEffect(() => {
    if (!titleToneFieldBase) {
      return;
    }
    const nextTitleTone = getGridSafeToneForBg(settings.titleTone, gridBgTone, 'super-grey', titleToneFieldBase.options);
    if (nextTitleTone !== normalizeGridToneToken(settings.titleTone)) {
      onSettingChange('titleTone', nextTitleTone);
    }
  }, [gridBgTone, onSettingChange, settings.titleTone, titleToneFieldBase]);

  useEffect(() => {
    if (!bodyToneFieldBase) {
      return;
    }
    const nextBodyTone = getGridSafeToneForBg(settings.bodyTone, gridBgTone, 'super-grey', bodyToneFieldBase.options);
    if (nextBodyTone !== normalizeGridToneToken(settings.bodyTone)) {
      onSettingChange('bodyTone', nextBodyTone);
    }
  }, [bodyToneFieldBase, gridBgTone, onSettingChange, settings.bodyTone]);

  useEffect(() => {
    if (Object.prototype.hasOwnProperty.call(settings, 'dividerTone')) {
      return;
    }
    onSettingChange('dividerTone', 'auto');
  }, [onSettingChange, settings]);

  const handleGridBackgroundChange = (nextBgToneRaw) => {
    const nextBgTone = normalizeGridBgTone(nextBgToneRaw);
    onSettingChange('bgTone', nextBgTone);
    if (!cardStyleFieldBase) {
      if (titleToneFieldBase) {
        onSettingChange('titleTone', getGridSafeToneForBg(settings.titleTone, nextBgTone, 'super-grey', titleToneFieldBase.options));
      }
      if (bodyToneFieldBase) {
        onSettingChange('bodyTone', getGridSafeToneForBg(settings.bodyTone, nextBgTone, 'super-grey', bodyToneFieldBase.options));
      }
      return;
    }
    const normalizedCurrentStyle = normalizeGridCardStyleToken(settings.cardStyle);
    const nextStyle = getGridSafeCardStyleForBg(settings.cardStyle, nextBgTone, cardStyleFieldBase.options);
    if (nextStyle !== normalizedCurrentStyle) {
      onSettingChange('cardStyle', nextStyle);
    }
    if (titleToneFieldBase) {
      onSettingChange('titleTone', getGridSafeToneForBg(settings.titleTone, nextBgTone, 'super-grey', titleToneFieldBase.options));
    }
    if (bodyToneFieldBase) {
      onSettingChange('bodyTone', getGridSafeToneForBg(settings.bodyTone, nextBgTone, 'super-grey', bodyToneFieldBase.options));
    }
  };

  const cardSlots = useMemo(() => (
    Array.from({ length: 8 }, (_, index) => index + 1)
      .map((slot) => {
        const title = String(settings[`card${slot}Title`] || '').trim();
        const body = String(settings[`card${slot}Body`] || '').trim();
        const buttonLabel = String(settings[`card${slot}ButtonLabel`] || '').trim();
        const buttonUrl = String(settings[`card${slot}ButtonUrl`] || '').trim();
        const buttonPageRef = String(settings[`card${slot}ButtonPageRef`] || '').trim();
        const button2Label = String(settings[`card${slot}Button2Label`] || '').trim();
        const button2Url = String(settings[`card${slot}Button2Url`] || '').trim();
        const button2PageRef = String(settings[`card${slot}Button2PageRef`] || '').trim();
        const linksJson = String(settings[`card${slot}LinksJson`] || '').trim();
        const accordionsJson = String(settings[`card${slot}AccordionsJson`] || '').trim();
        const linkCount = parseGridResourceLinkItems(linksJson).length;
        const accordionCount = parseGridResourceAccordions(accordionsJson).length;
        const hasAction = Boolean(buttonLabel && (buttonUrl || buttonPageRef));
        const hasSecondaryAction = Boolean(button2Label && (button2Url || button2PageRef));
        const showPrimaryActionFields = presetCardFeatures.primaryAction !== false || hasAction;
        const showSecondaryActionFields = presetCardFeatures.secondaryAction !== false || hasSecondaryAction;
        const showDirectLinks = presetCardFeatures.directLinks !== false || linkCount > 0;
        const showAccordions = presetCardFeatures.accordions !== false || accordionCount > 0;
        return {
          slot,
          kicker: `Card ${slot}`,
          title,
          fallbackTitle: title || `New card ${slot}`,
          summary: summarizeProgressiveSlot([
            body.slice(0, 80),
            linkCount ? `${linkCount} direct links` : '',
            accordionCount ? `${accordionCount} accordion groups` : '',
          ]),
          isExisting: Boolean(title || body || hasAction || hasSecondaryAction || linkCount || accordionCount),
          dividerToneValue: String(settings[`card${slot}DividerTone`] || '').trim().toLowerCase(),
          fields: [
            fieldById.get(`card${slot}Title`),
            fieldById.get(`card${slot}Body`),
            ...(showPrimaryActionFields
              ? [
                fieldById.get(`card${slot}ButtonLabel`),
                getPromotedRouteLinkField(fieldById, `card${slot}ButtonUrl`, `card${slot}ButtonPageRef`),
              ]
              : []),
            ...(showSecondaryActionFields
              ? [
                fieldById.get(`card${slot}Button2Label`),
                getPromotedRouteLinkField(fieldById, `card${slot}Button2Url`, `card${slot}Button2PageRef`),
              ]
              : []),
          ].filter(Boolean),
          showDirectLinks,
          showAccordions,
        };
      })
      .filter((item) => item.fields.length)
  ), [fieldById, settings]);
  const availableCardSlots = cardSlots
    .filter((item) => item.slot <= presetMaxCards || item.isExisting)
    .map((item) => item.slot);
  const existingCardSlots = cardSlots.filter((item) => item.isExisting).map((item) => item.slot);
  const [revealedCardSlots, setRevealedCardSlots] = useState(existingCardSlots);
  const [expandedCardSlot, setExpandedCardSlot] = useState(existingCardSlots.length > 1 ? null : (existingCardSlots[0] || null));

  useEffect(() => {
    setRevealedCardSlots((current) => {
      const merged = mergeVisibleSlotList(current, existingCardSlots, availableCardSlots);
      return areSlotListsEqual(current, merged) ? current : merged;
    });
  }, [availableCardSlots, existingCardSlots]);

  const visibleCardSlots = mergeVisibleSlotList(revealedCardSlots, existingCardSlots, availableCardSlots);

  useEffect(() => {
    if (!visibleCardSlots.length) {
      if (expandedCardSlot !== null) {
        setExpandedCardSlot(null);
      }
      return;
    }
    if (expandedCardSlot === null) {
      if (visibleCardSlots.length === 1) {
        setExpandedCardSlot(visibleCardSlots[0]);
      }
      return;
    }
    if (!visibleCardSlots.includes(expandedCardSlot)) {
      setExpandedCardSlot(visibleCardSlots[0]);
    }
  }, [expandedCardSlot, visibleCardSlots]);

  const nextHiddenCardSlot = availableCardSlots.find((slot) => !visibleCardSlots.includes(slot)) || null;

  return (
    <div className="admin-intro-block-editor">
      {presetDefinition ? (
        <section className="admin-cta-field-slot-card">
          <h4>Card Grid Preset</h4>
          <p><strong>{presetDefinition.label}</strong></p>
          {presetDescription ? (
            <p>{presetDescription}</p>
          ) : null}
        </section>
      ) : null}

      <div className="admin-dynamic-panel-primary-grid admin-dynamic-panel-primary-grid--intro admin-grid-heading-row">
        {showIntroFields ? (
          <div className="admin-intro-editor-main admin-grid-heading-editor">
            <ColorTextSelectionEditor
              label="Grid intro heading"
              text={settings.title ?? ''}
              lineClassName={settings.titleClassName ?? ''}
              highlightsJson={settings.titleHighlightsJson ?? ''}
              onTextChange={(nextValue) => onSettingChange('title', nextValue)}
              onLineClassNameChange={(nextValue) => onSettingChange('titleClassName', nextValue)}
              onHighlightsJsonChange={(nextValue) => onSettingChange('titleHighlightsJson', nextValue)}
              placeholder="Grid heading"
              rows={2}
              className="is-intro-heading"
              unifiedPreviewEditor
              showPlaceholderInPreview={false}
              previewWrapClassName={`is-bg-${gridBgTone}`}
              showSpanDetailsInline
              showClearSpansButton
              useResetForClear
            />

            <div className="admin-grid-body-editor admin-grid-body-editor--inline">
              <AdminHtmlEditor
                compact
                value={toEditorHtml(settings.bodyHtml, settings.body)}
                onChange={(nextValue) => onSettingChange('bodyHtml', nextValue)}
                placeholder="Grid intro copy"
              />
            </div>
          </div>
        ) : (
          <section className="admin-cta-field-slot-card">
            <h4>Intro handled outside this preset</h4>
            <p>This preset uses the shared `card_grid` runtime, but keeps heading and intro copy in a paired block so the card grid stays focused on cards.</p>
          </section>
        )}

        <div className="admin-intro-appearance-stack admin-grid-appearance-stack">
          <PanelAppearanceControls
            fields={appearanceFields}
            settings={settings}
            onSettingChange={onSettingChange}
            compactSwatches={false}
            className="admin-panel-appearance--intro-text"
          />

          {bgToneField ? (
            <section className="admin-panel-appearance admin-panel-appearance--intro-text admin-panel-appearance--intro-bg">
              <div className="admin-content-field-list admin-content-field-list--inline admin-panel-appearance-grid">
                <label>
                  <span>{bgToneField.label || 'Background color'}</span>
                  <ColorPalette
                    variant="admin"
                    className="is-compact admin-hero-inline-swatch-list is-icon-only admin-intro-bg-palette-swatch-list"
                    ariaLabel={bgToneField.label || 'Grid background'}
                    options={Array.isArray(bgToneField.options) ? bgToneField.options : []}
                    value={String(settings.bgTone || '')}
                    preventMouseDown
                    onChange={(nextValue) => handleGridBackgroundChange(nextValue)}
                    getOptionClassName={(option, state) => ` admin-bg-swatch-option${state.active ? ' is-active' : ''}`}
                  />
                </label>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <FieldControlGrid
        fields={layoutFields}
        settings={settings}
        onSettingChange={(fieldId, nextValue) => {
          if (fieldId === 'cardStyle') {
            const nextStyle = getGridSafeCardStyleForBg(nextValue, gridBgTone, cardStyleFieldBase?.options);
            onSettingChange('cardStyle', nextStyle);
            return;
          }
          onSettingChange(fieldId, nextValue);
        }}
        className="admin-content-field-list--inline admin-grid-layout-fields"
      />
      {showTypographyFields ? (
        <FieldControlGrid
          fields={cardTypographyFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline admin-grid-layout-fields"
        />
      ) : null}

      <ProgressiveCardEditorList
        heading="Cards"
        className="admin-progressive-slot-list--grid-cards"
        slots={cardSlots.filter((item) => visibleCardSlots.includes(item.slot))}
        expandedSlot={expandedCardSlot}
        onToggleSlot={(slot) => setExpandedCardSlot((current) => (current === slot ? null : slot))}
        onRevealNextSlot={nextHiddenCardSlot
          ? () => {
            setRevealedCardSlots((current) => mergeVisibleSlotList([...current, nextHiddenCardSlot], existingCardSlots, availableCardSlots));
            setExpandedCardSlot(nextHiddenCardSlot);
          }
          : null}
        revealLabel={nextHiddenCardSlot ? `Add card ${nextHiddenCardSlot}` : 'Add card'}
        renderSlotBody={(slotData) => (
          <>
            <div className="admin-grid-card-divider-controls admin-grid-card-divider-controls--body">
              <ColorPalette
                variant="admin"
                className="is-compact is-icon-only admin-grid-card-divider-palette"
                ariaLabel={`Card ${slotData.slot} line color override`}
                options={cardDividerOptions}
                value={slotData.dividerToneValue}
                onChange={(nextValue, option) => {
                  const resolvedValue = option?.value ?? nextValue;
                  onSettingChange(`card${slotData.slot}DividerTone`, resolvedValue);
                }}
                isOptionActive={(option) => slotData.dividerToneValue === option.token}
                getOptionClassName={(option, state) => `admin-grid-card-divider-swatch${state.active ? ' is-active' : ''}`}
                getOptionLabel={(option) => option.label || option.value}
                getOptionShortLabel={(option) => option.shortLabel || option.label || option.value}
              />
              <button
                type="button"
                className={`admin-grid-card-divider-clear${slotData.dividerToneValue ? ' is-active' : ''}`}
                onClick={() => onSettingChange(`card${slotData.slot}DividerTone`, '')}
                title="Clear override (use global grid line color)"
                aria-label={`Clear Card ${slotData.slot} line color override`}
              >
                ×
              </button>
            </div>
            <DraftBackedFieldControlGrid
              fields={slotData.fields}
              settings={settings}
              onSettingChange={onSettingChange}
              className="admin-content-field-list--inline"
              routeOptions={routeOptions}
              draftFieldIds={GRID_LOCAL_DRAFT_FIELD_IDS}
            />
            {slotData.showDirectLinks ? (
              <GridResourceLinkListEditor
                label="Direct PDF / link list"
                items={parseGridResourceLinkItems(settings[`card${slotData.slot}LinksJson`])}
                onChange={(nextItems) => onSettingChange(`card${slotData.slot}LinksJson`, serializeGridResourceLinkItems(nextItems))}
                routeOptions={normalizedRouteOptions}
                documentOptions={documentOptions}
                addLabel="Add direct link"
              />
            ) : null}
            {slotData.showAccordions ? (
              <GridResourceAccordionEditor
                value={parseGridResourceAccordions(settings[`card${slotData.slot}AccordionsJson`])}
                onChange={(nextItems) => onSettingChange(`card${slotData.slot}AccordionsJson`, serializeGridResourceAccordions(nextItems))}
                routeOptions={normalizedRouteOptions}
                documentOptions={documentOptions}
              />
            ) : null}
          </>
        )}
      />
    </div>
  );
}

export function NewsletterBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const textToneField = fieldById.get('textTone') || null;
  const appearanceFields = textToneField
    ? [{ ...textToneField, label: 'Core text' }]
    : [];
  const newsletterBgTone = normalizePanelBgTone(settings.bgTone);
  const newsletterTextTone = normalizePanelTextTone(settings.textTone, 'white');
  const configFields = allFields.filter((field) => (
    field.id !== 'title'
    && field.id !== 'titleClassName'
    && field.id !== 'titleHighlightsJson'
    && field.id !== 'bodyHtml'
    && field.id !== 'bgTone'
    && field.id !== 'textTone'
  ));

  return (
    <div className="admin-intro-block-editor">
      <div className="admin-dynamic-panel-primary-grid admin-dynamic-panel-primary-grid--intro">
        <div className="admin-intro-editor-main">
          <ColorTextSelectionEditor
            label="Newsletter heading"
            text={settings.title ?? ''}
            lineClassName={settings.titleClassName ?? ''}
            highlightsJson={settings.titleHighlightsJson ?? ''}
            onTextChange={(nextValue) => onSettingChange('title', nextValue)}
            onLineClassNameChange={(nextValue) => onSettingChange('titleClassName', nextValue)}
            onHighlightsJsonChange={(nextValue) => onSettingChange('titleHighlightsJson', nextValue)}
            placeholder="Stay in the loop."
            rows={2}
            className="is-intro-heading"
            unifiedPreviewEditor
            previewClassName={getPanelTextTonePreviewClassName(newsletterTextTone, 'white')}
            previewWrapClassName={`is-bg-${newsletterBgTone}`}
            spanDetailsUnderToggle
            useResetForClear
          />
          <AdminHtmlEditor
            compact
            value={toEditorHtml(settings.bodyHtml)}
            onChange={(nextValue) => onSettingChange('bodyHtml', nextValue)}
            placeholder="Newsletter body copy"
          />
        </div>

        <div className="admin-intro-appearance-stack">
          <PanelAppearanceControls
            fields={appearanceFields}
            settings={settings}
            onSettingChange={onSettingChange}
            compactSwatches={false}
            className="admin-panel-appearance--intro-text"
          />

          {bgToneField ? (
            <section className="admin-panel-appearance admin-panel-appearance--intro-text admin-panel-appearance--intro-bg">
              <div className="admin-content-field-list admin-content-field-list--inline admin-panel-appearance-grid">
                <label>
                  <span>{bgToneField.label || 'Background color'}</span>
                  <ColorPalette
                    variant="admin"
                    className="is-compact admin-hero-inline-swatch-list is-icon-only admin-intro-bg-palette-swatch-list"
                    ariaLabel={bgToneField.label || 'Newsletter background'}
                    options={Array.isArray(bgToneField.options) ? bgToneField.options : []}
                    value={String(settings.bgTone || '')}
                    preventMouseDown
                    onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
                    getOptionClassName={(option, state) => ` admin-bg-swatch-option${state.active ? ' is-active' : ''}`}
                  />
                </label>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <FieldControlGrid
        fields={configFields}
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-content-field-list--inline"
      />
    </div>
  );
}

export function PageContentBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};

  return (
    <div className="admin-intro-block-editor admin-page-content-block-editor">
      <div className="admin-page-content-editor-main">
        <AdminHtmlEditor
          value={toEditorHtml(settings.html)}
          onChange={(nextValue) => onSettingChange('html', nextValue)}
          placeholder="Start page content..."
        />
      </div>

      <PageContentLayoutControls
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-page-content-layout-shell--admin"
      />
    </div>
  );
}

export function PageContentHudBlockEditor({ block, onSettingChange }) {
  return (
    <PageContentHudEditorPanel
      block={block}
      onSettingChange={onSettingChange}
    />
  );
}

export function TopStripBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));

  return (
    <TopStripHudEditorPanel
      settings={settings}
      onSettingChange={onSettingChange}
      bgOptions={Array.isArray(fieldById.get('bgTone')?.options) ? fieldById.get('bgTone').options : []}
      textOptions={Array.isArray(fieldById.get('textTone')?.options) ? fieldById.get('textTone').options : []}
      loginToneOptions={Array.isArray(fieldById.get('loginButtonTone')?.options) ? fieldById.get('loginButtonTone').options : []}
      ratesToneOptions={Array.isArray(fieldById.get('ratesButtonTone')?.options) ? fieldById.get('ratesButtonTone').options : []}
    />
  );
}

export function TopStripHudBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'hud', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));

  return (
    <TopStripHudEditorPanel
      settings={settings}
      onSettingChange={onSettingChange}
      bgOptions={Array.isArray(fieldById.get('bgTone')?.options) ? fieldById.get('bgTone').options : []}
      textOptions={Array.isArray(fieldById.get('textTone')?.options) ? fieldById.get('textTone').options : []}
      loginToneOptions={Array.isArray(fieldById.get('loginButtonTone')?.options) ? fieldById.get('loginButtonTone').options : []}
      ratesToneOptions={Array.isArray(fieldById.get('ratesButtonTone')?.options) ? fieldById.get('ratesButtonTone').options : []}
    />
  );
}

export function HeroPieBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);

  return (
    <FieldControlGrid
      fields={allFields}
      settings={settings}
      onSettingChange={onSettingChange}
    />
  );
}

export function RatesBlockEditor({ block, pathname = '', ratesContext = {} }) {
  const runtime = buildDynamicRatesFromBlock(block);
  void block;
  void pathname;
  void ratesContext;

  return (
    <div className="admin-intro-block-editor">
      <p className="admin-front-hud-note">
        Table rows and published rates are managed in the Rates admin screen.
      </p>
      <a
        className="admin-testimonials-library-link"
        href={runtime?.adminHref || '/admin/rates'}
        target="_blank"
        rel="noreferrer noopener"
      >
        Open rates admin ↗
      </a>
    </div>
  );
}

export function LegalCopyBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const certificateFields = [fieldById.get('certificatesHtml')].filter(Boolean);
  const iraFields = [fieldById.get('iraHtml')].filter(Boolean);

  return (
    <div className="admin-cta-field-slots">
      <section className="admin-cta-field-slot-card">
        <h4>Certificates copy</h4>
        <FieldControlGrid
          fields={certificateFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
        />
      </section>
      <section className="admin-cta-field-slot-card">
        <h4>IRA copy</h4>
        <FieldControlGrid
          fields={iraFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
        />
      </section>
    </div>
  );
}

function useTestimonialsEditorModel(block, pathname = '', testimonialsLibrary = []) {
  const settings = block?.settings || {};
  const selectionMode = normalizeTestimonialsSelectionMode(settings.selectionMode);
  const selectedIds = useMemo(
    () => parseTokenList(settings.selectedIdsCsv),
    [settings.selectedIdsCsv],
  );
  const filterTags = useMemo(
    () => parseTokenList(settings.filterTagsCsv),
    [settings.filterTagsCsv],
  );
  const libraryItems = useMemo(
    () => normalizeDisplayTestimonials(testimonialsLibrary),
    [testimonialsLibrary],
  );
  const availableTags = useMemo(() => {
    const tags = new Set();
    libraryItems.forEach((item) => {
      (Array.isArray(item?.tags) ? item.tags : []).forEach((tag) => {
        const token = parseTokenList(tag)[0];
        if (token) {
          tags.add(token);
        }
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [libraryItems]);
  const defaultTag = pathname === '/services/legacy-giving' ? 'legacy-giving' : '';
  const resolved = useMemo(
    () => resolveTestimonialsBlockData({
      block,
      library: libraryItems,
      fallbackItems: [],
      fallbackFineprint: '',
      defaultTag,
    }),
    [block, defaultTag, libraryItems],
  );
  const previewItems = Array.isArray(resolved?.items) ? resolved.items.slice(0, 4) : [];

  return {
    settings,
    selectionMode,
    selectedIds,
    filterTags,
    libraryItems,
    availableTags,
    defaultTag,
    previewItems,
  };
}

export function TestimonialsBlockEditor({
  block,
  pathname = '',
  selectedPath = '',
  onSettingChange,
  testimonialsLibrary = [],
}) {
  const activePath = String(pathname || selectedPath || '').trim();
  const {
    settings,
    selectionMode,
    selectedIds,
    filterTags,
    libraryItems,
    availableTags,
    defaultTag,
    previewItems,
  } = useTestimonialsEditorModel(block, activePath, testimonialsLibrary);
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));

  const setSelectedIds = (nextIds) => {
    const normalized = parseTokenList((Array.isArray(nextIds) ? nextIds : []).join(','));
    onSettingChange('selectedIdsCsv', normalized.join(','));
  };

  const toggleSelectedId = (id) => {
    const token = parseTokenList(id)[0];
    if (!token) {
      return;
    }
    const nextIds = selectedIds.includes(token)
      ? selectedIds.filter((entry) => entry !== token)
      : [...selectedIds, token];
    setSelectedIds(nextIds);
    if (selectionMode !== 'manual') {
      onSettingChange('selectionMode', 'manual');
    }
  };

  const setFilterTags = (nextTags) => {
    const normalized = parseTokenList((Array.isArray(nextTags) ? nextTags : []).join(','));
    onSettingChange('filterTagsCsv', normalized.join(','));
  };

  const toggleFilterTag = (tag) => {
    const token = parseTokenList(tag)[0];
    if (!token) {
      return;
    }
    const nextTags = filterTags.includes(token)
      ? filterTags.filter((entry) => entry !== token)
      : [...filterTags, token];
    setFilterTags(nextTags);
    if (selectionMode !== 'tag') {
      onSettingChange('selectionMode', 'tag');
    }
  };

  const advancedFields = [
    fieldById.get('targetSectionKey'),
    fieldById.get('targetFineprintSectionKey'),
    fieldById.get('targetSectionClassName'),
    fieldById.get('targetSectionIndex'),
  ].filter(Boolean);

  return (
    <div className="admin-intro-block-editor admin-testimonials-editor">
      <div className="admin-testimonials-editor-head">
        <p className="admin-testimonials-editor-note">
          Pick quotes from the shared library. IDs and tags are managed automatically.
        </p>
        <a
          className="admin-testimonials-library-link"
          href="/admin/testimonials"
          target="_blank"
          rel="noreferrer noopener"
        >
          Open library ↗
        </a>
      </div>

      <div className="admin-testimonials-layout">
        <div className="admin-testimonials-workbench">
          <div className="admin-testimonials-mode-toggle">
            <button
              type="button"
              className={`admin-testimonials-mode-btn${selectionMode === 'manual' ? ' is-active' : ''}`}
              onClick={() => onSettingChange('selectionMode', 'manual')}
            >
              Pick quotes
            </button>
            <button
              type="button"
              className={`admin-testimonials-mode-btn${selectionMode === 'tag' ? ' is-active' : ''}`}
              onClick={() => {
                onSettingChange('selectionMode', 'tag');
                if (!filterTags.length && defaultTag) {
                  onSettingChange('filterTagsCsv', defaultTag);
                }
              }}
            >
              Filter tags
            </button>
          </div>

          {selectionMode === 'manual' ? (
            <>
              <div className="admin-testimonials-toolbar">
                <button
                  type="button"
                  className="action-btn action-btn-outline"
                  onClick={() => setSelectedIds([])}
                >
                  Clear selected
                </button>
                <button
                  type="button"
                  className="action-btn action-btn-outline"
                  onClick={() => setSelectedIds(libraryItems.slice(0, 3).map((item) => item.id))}
                >
                  Use first 3
                </button>
                <span className="admin-testimonials-count">{selectedIds.length} selected</span>
              </div>
              <p className="admin-testimonials-picker-help">Click a quote card to select or deselect it.</p>
              <div className="admin-testimonials-picker-list" role="listbox" aria-label="Choose testimonials">
                {libraryItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <button
                      key={`admin-testimonial-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`admin-testimonial-picker-item${isSelected ? ' is-selected' : ''}`}
                      onClick={() => toggleSelectedId(item.id)}
                    >
                      <div className="admin-testimonial-picker-head">
                        <span className={`admin-testimonial-picker-check${isSelected ? ' is-selected' : ''}`} aria-hidden="true">
                          {isSelected ? '✓' : ''}
                        </span>
                        <span className={`admin-testimonial-picker-state${isSelected ? ' is-selected' : ''}`}>
                          {isSelected ? 'Selected' : 'Click to select'}
                        </span>
                      </div>
                      <span className="admin-testimonial-picker-quote">{item.quote}</span>
                      <span className="admin-testimonial-picker-author">{formatTestimonialAttribution(item)}</span>
                      {Array.isArray(item.tags) && item.tags.length ? (
                        <span className="admin-testimonial-picker-tags">{item.tags.join(' • ')}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="admin-testimonial-tag-picker">
              {availableTags.map((tag) => {
                const isSelected = filterTags.includes(tag);
                return (
                  <button
                    key={`admin-testimonial-tag-${tag}`}
                    type="button"
                    className={`admin-testimonial-tag-chip${isSelected ? ' is-active' : ''}`}
                    onClick={() => toggleFilterTag(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
              <p className="admin-testimonials-editor-note">
                {filterTags.length
                  ? `Active tags: ${filterTags.join(', ')}`
                  : 'No tags selected. All testimonials from the library will be used.'}
              </p>
            </div>
          )}
        </div>

        <div className="admin-testimonials-sidebar">
          <section className="admin-testimonials-settings-card">
            <div className="admin-content-field-list admin-content-field-list--inline admin-testimonials-settings-grid">
              <label className="is-half">
                <span>{fieldById.get('limit')?.label || 'Max testimonials (0 = all)'}</span>
                <input
                  type="number"
                  min={Number.isFinite(Number(fieldById.get('limit')?.min)) ? Number(fieldById.get('limit').min) : 0}
                  step={Number.isFinite(Number(fieldById.get('limit')?.step)) ? Number(fieldById.get('limit').step) : 1}
                  value={settings.limit ?? 0}
                  onChange={(event) => onSettingChange('limit', event.target.value === '' ? '' : Number(event.target.value))}
                />
              </label>
              <label className="is-half">
                <span>{fieldById.get('showFineprint')?.label || 'Show fineprint'}</span>
                <select
                  value={String(toBoolean(settings.showFineprint))}
                  onChange={(event) => onSettingChange('showFineprint', event.target.value === 'true')}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </label>
              <label>
                <span>{fieldById.get('fineprint')?.label || 'Fineprint text'}</span>
                <textarea
                  rows={Number(fieldById.get('fineprint')?.rows) || 3}
                  value={settings.fineprint ?? ''}
                  onChange={(event) => onSettingChange('fineprint', event.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="admin-testimonials-preview">
            <span className="admin-testimonials-preview-label">Preview</span>
            {previewItems.length ? previewItems.map((item, index) => (
              <div key={`admin-testimonial-preview-${item.id || index + 1}`} className="admin-testimonial-preview-item">
                <p>{item.quote}</p>
                <p>{formatTestimonialAttribution(item)}</p>
              </div>
            )) : (
              <p className="blank-state-note">No matching testimonials yet.</p>
            )}
          </div>

          {advancedFields.length ? (
            <details className="admin-testimonials-advanced">
              <summary>Advanced targeting</summary>
              <FieldControlGrid
                fields={advancedFields}
                settings={settings}
                onSettingChange={onSettingChange}
                className="admin-content-field-list--inline"
              />
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TestimonialsHudBlockEditor({ block, pathname = '', onSettingChange, testimonialsLibrary = [] }) {
  const {
    settings,
    selectionMode,
    selectedIds,
    filterTags,
    libraryItems,
    availableTags,
    previewItems,
  } = useTestimonialsEditorModel(block, pathname, testimonialsLibrary);

  const setSelectedIds = (nextIds) => {
    const normalized = parseTokenList((Array.isArray(nextIds) ? nextIds : []).join(','));
    onSettingChange('selectedIdsCsv', normalized.join(','));
  };

  const toggleSelectedId = (id) => {
    const token = parseTokenList(id)[0];
    if (!token) {
      return;
    }
    const nextIds = selectedIds.includes(token)
      ? selectedIds.filter((entry) => entry !== token)
      : [...selectedIds, token];
    setSelectedIds(nextIds);
    if (selectionMode !== 'manual') {
      onSettingChange('selectionMode', 'manual');
    }
  };

  const toggleFilterTag = (tag) => {
    const token = parseTokenList(tag)[0];
    if (!token) {
      return;
    }
    const nextTags = filterTags.includes(token)
      ? filterTags.filter((entry) => entry !== token)
      : [...filterTags, token];
    onSettingChange('filterTagsCsv', parseTokenList(nextTags.join(',')).join(','));
    if (selectionMode !== 'tag') {
      onSettingChange('selectionMode', 'tag');
    }
  };

  return (
    <TestimonialsHudEditorPanel
      limit={settings.limit}
      onLimitChange={(nextValue) => onSettingChange('limit', Number(nextValue))}
      library={libraryItems}
      selectedIds={selectedIds}
      onToggleSelectedId={toggleSelectedId}
      onSetSelectedIds={setSelectedIds}
      availableTags={availableTags}
      filterTags={filterTags}
      onToggleFilterTag={toggleFilterTag}
      previewItems={previewItems}
      formatAttribution={formatTestimonialAttribution}
    />
  );
}

export function ColumnsBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const presetDefinition = resolveBlockPresetDefinition(block);
  const presetDescription = String(presetDefinition?.description || '').trim();
  const presetEditor = presetDefinition?.editor || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const columnsStyleToken = String(settings.columnsStyle || '').trim().toLowerCase();
  const columnsStyle = ['retirement', 'legacy-highlight', 'loans-value'].includes(columnsStyleToken)
    ? columnsStyleToken
    : 'retirement';
  const columnsBgTone = columnsStyle === 'legacy-highlight'
    ? 'blue'
    : normalizePanelBgTone(settings.bgTone);
  const columnsPreviewTone = getGridSafeToneForBg('', columnsBgTone, 'super-grey');
  const columnsPreviewClassName = getPanelTextTonePreviewClassName(columnsPreviewTone, 'dark');
  const layoutFieldIds = Array.isArray(presetEditor.layoutFieldIds) && presetEditor.layoutFieldIds.length
    ? presetEditor.layoutFieldIds
    : (presetDefinition ? [] : ['columnsStyle', 'leadLine', 'followupLine', 'contentWidth']);
  const layoutFields = layoutFieldIds
    .map((fieldId) => fieldById.get(fieldId))
    .filter(Boolean);
  const maxColumns = Number.isInteger(presetEditor.maxColumns)
    ? Math.max(2, Math.min(4, presetEditor.maxColumns))
    : 4;
  const fixedColumns = Boolean(presetEditor.fixedColumns);
  const showBackgroundToneControl = presetDefinition
    ? presetEditor.allowBackgroundTone !== false
    : columnsStyle !== 'legacy-highlight';
  const allowPhotoColumnsByPreset = presetDefinition ? presetEditor.allowPhotoColumns !== false : true;
  const allowTextColumnImagesByPreset = presetDefinition ? presetEditor.allowTextColumnImages !== false : true;
  const allowColumnActionsByPreset = presetDefinition ? presetEditor.allowColumnActions !== false : true;
  const allowColumnWidthShareByPreset = presetDefinition ? presetEditor.allowColumnWidthShare !== false : true;
  const hasMeaningfulColumnContent = (slot) => (
    Boolean(String(settings[`col${slot}Title`] || '').trim())
    || Boolean(String(settings[`col${slot}Body`] || '').trim())
    || Boolean(String(settings[`col${slot}ImageUrl`] || '').trim())
    || Boolean(String(settings[`col${slot}ImageAlt`] || '').trim())
    || Boolean(String(settings[`col${slot}ButtonLabel`] || '').trim())
    || Boolean(String(settings[`col${slot}ButtonUrl`] || '').trim())
    || Boolean(String(settings[`col${slot}ButtonPageRef`] || '').trim())
    || (Number.isFinite(Number(settings[`col${slot}WidthShare`])) && Number(settings[`col${slot}WidthShare`]) !== 1)
  );
  const columnSlots = getVisibleDynamicColumnSlots(settings)
    .filter((slot) => slot <= maxColumns || hasMeaningfulColumnContent(slot));
  const canAddColumn = !fixedColumns && columnSlots.length < maxColumns;
  const canRemoveColumn = !fixedColumns && columnSlots.length > 2;

  const handleAddColumn = () => {
    const nextSlot = columnSlots.length + 1;
    if (nextSlot > maxColumns) {
      return;
    }
    onSettingChange('columns', nextSlot === 4 ? 'four' : 'three');
    onSettingChange(`col${nextSlot}Enabled`, true);
    if (!String(settings[`col${nextSlot}Type`] || '').trim()) {
      onSettingChange(`col${nextSlot}Type`, 'text');
    }
    if (!Number.isFinite(Number(settings[`col${nextSlot}WidthShare`]))) {
      onSettingChange(`col${nextSlot}WidthShare`, 1);
    }
  };

  const handleRemoveColumn = () => {
    const lastSlot = columnSlots[columnSlots.length - 1];
    if (!lastSlot || lastSlot <= 2) {
      return;
    }
    onSettingChange(`col${lastSlot}Enabled`, false);
    onSettingChange('columns', lastSlot === 4 ? 'three' : 'two');
  };

  return (
    <div className="admin-intro-block-editor">
      {presetDefinition ? (
        <section className="admin-cta-field-slot-card">
          <h4>Columns Preset</h4>
          <p><strong>{presetDefinition.label}</strong></p>
          {presetDescription ? <p>{presetDescription}</p> : null}
        </section>
      ) : null}

      <div className="admin-dynamic-panel-primary-grid admin-dynamic-panel-primary-grid--intro admin-grid-heading-row">
        <div className="admin-intro-editor-main admin-grid-heading-editor">
          <ColorTextSelectionEditor
            label="Columns heading"
            text={settings.title ?? ''}
            lineClassName={settings.titleClassName ?? ''}
            highlightsJson={settings.titleHighlightsJson ?? ''}
            onTextChange={(nextValue) => onSettingChange('title', nextValue)}
            onLineClassNameChange={(nextValue) => onSettingChange('titleClassName', nextValue)}
            onHighlightsJsonChange={(nextValue) => onSettingChange('titleHighlightsJson', nextValue)}
            placeholder="Columns heading"
            rows={2}
            className="is-intro-heading"
            unifiedPreviewEditor
            previewClassName={columnsPreviewClassName}
            previewWrapClassName={`is-bg-${columnsBgTone}`}
            spanDetailsUnderToggle
            useResetForClear
          />
        </div>

        <div className="admin-intro-appearance-stack admin-grid-appearance-stack">
          {bgToneField && showBackgroundToneControl ? (
            <section className="admin-panel-appearance admin-panel-appearance--intro-text admin-panel-appearance--intro-bg">
              <div className="admin-content-field-list admin-content-field-list--inline admin-panel-appearance-grid">
                <label>
                  <span>{bgToneField.label || 'Background color'}</span>
                  <ColorPalette
                    variant="admin"
                    className="is-compact admin-hero-inline-swatch-list is-icon-only admin-intro-bg-palette-swatch-list"
                    ariaLabel={bgToneField.label || 'Columns background'}
                    options={Array.isArray(bgToneField.options) ? bgToneField.options : []}
                    value={String(settings.bgTone || '')}
                    preventMouseDown
                    onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
                    getOptionClassName={(option, state) => ` admin-bg-swatch-option${state.active ? ' is-active' : ''}`}
                  />
                </label>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <div className="admin-grid-body-editor">
        <AdminHtmlEditor
          compact
          value={toEditorHtml(settings.bodyHtml)}
          onChange={(nextValue) => onSettingChange('bodyHtml', nextValue)}
          placeholder="Columns intro copy"
        />
      </div>

      {layoutFields.length ? (
        <FieldControlGrid
          fields={layoutFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline admin-grid-layout-fields"
        />
      ) : null}

      <div className="admin-columns-slot-actions">
        {canAddColumn ? (
          <button
            type="button"
            className="admin-front-hud-mini-action"
            onClick={handleAddColumn}
          >
            Add column
          </button>
        ) : null}
        {canRemoveColumn ? (
          <button
            type="button"
            className="admin-front-hud-mini-action"
            onClick={handleRemoveColumn}
          >
            Remove last column
          </button>
        ) : null}
      </div>

      <div className="admin-cta-field-slots">
        {columnSlots.map((slot) => {
          const slotType = String(settings[`col${slot}Type`] || '').trim().toLowerCase() || 'text';
          const isPhotoColumn = slotType === 'photo';
          const isOutlineButton = String(settings[`col${slot}ButtonStyle`] || '').trim().toLowerCase() === 'outline';
          const isLegacyHighlightStyle = columnsStyle === 'legacy-highlight';
          const hasImageData = Boolean(
            String(settings[`col${slot}ImageUrl`] || '').trim()
            || String(settings[`col${slot}ImageAlt`] || '').trim(),
          );
          const hasActionData = Boolean(
            String(settings[`col${slot}ButtonLabel`] || '').trim()
            && (
              String(settings[`col${slot}ButtonUrl`] || '').trim()
              || String(settings[`col${slot}ButtonPageRef`] || '').trim()
            ),
          );
          const hasCustomWidthShare = Number.isFinite(Number(settings[`col${slot}WidthShare`]))
            && Number(settings[`col${slot}WidthShare`]) !== 1;
          const showTypeField = !isLegacyHighlightStyle && (allowPhotoColumnsByPreset || isPhotoColumn);
          const showPhotoAssetFields = !isLegacyHighlightStyle && isPhotoColumn && (allowPhotoColumnsByPreset || hasImageData);
          const showTextImageFields = !isLegacyHighlightStyle && !isPhotoColumn && (allowTextColumnImagesByPreset || hasImageData);
          const showActionFields = !isLegacyHighlightStyle && (allowColumnActionsByPreset || hasActionData);
          const showWidthShareField = !isLegacyHighlightStyle && (allowColumnWidthShareByPreset || hasCustomWidthShare);
          const imageUrlField = fieldById.get(`col${slot}ImageUrl`);
          const imageAltField = fieldById.get(`col${slot}ImageAlt`);
          const titleField = fieldById.get(`col${slot}Title`);
          const bodyField = fieldById.get(`col${slot}Body`);
          const slotFields = [
            fieldById.get(`col${slot}Enabled`),
            showTypeField ? fieldById.get(`col${slot}Type`) : null,
            showPhotoAssetFields && imageUrlField ? {
              ...imageUrlField,
              label: `Column ${slot} photo URL`,
            } : null,
            showPhotoAssetFields && imageAltField ? {
              ...imageAltField,
              label: `Column ${slot} photo alt text`,
            } : null,
            titleField ? {
              ...titleField,
              label: isPhotoColumn ? `Column ${slot} photo label` : titleField.label,
            } : null,
            !isLegacyHighlightStyle && bodyField ? {
              ...bodyField,
              label: isPhotoColumn ? `Column ${slot} photo caption` : bodyField.label,
            } : null,
            showTextImageFields ? fieldById.get(`col${slot}ImageUrl`) : null,
            showTextImageFields ? fieldById.get(`col${slot}ImageAlt`) : null,
            showActionFields ? fieldById.get(`col${slot}ButtonLabel`) : null,
            showActionFields ? getPromotedRouteLinkField(fieldById, `col${slot}ButtonUrl`, `col${slot}ButtonPageRef`) : null,
            showActionFields ? fieldById.get(`col${slot}ButtonStyle`) : null,
            showActionFields ? getCompactToneField(fieldById, `col${slot}ButtonTone`, isOutlineButton) : null,
            showWidthShareField ? fieldById.get(`col${slot}WidthShare`) : null,
          ].filter(Boolean);

          if (!slotFields.length) {
            return null;
          }

          return (
            <section key={`columns-slot-${slot}`} className="admin-cta-field-slot-card">
              <h4>Column {slot}</h4>
              <DraftBackedFieldControlGrid
                fields={slotFields}
                settings={settings}
                onSettingChange={onSettingChange}
                className="admin-content-field-list--inline"
                routeOptions={routeOptions}
                draftFieldIds={COLUMNS_LOCAL_DRAFT_FIELD_IDS}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function PhotoColumnBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const isOutlineButton = String(settings.buttonStyle || '').trim().toLowerCase() === 'outline';
  const fields = [
    fieldById.get('title'),
    fieldById.get('body'),
    fieldById.get('imageUrl'),
    fieldById.get('imageAlt'),
    ...buildInlineActionFields({
      fieldById,
      labelFieldId: 'buttonLabel',
      hrefFieldId: 'buttonUrl',
      routeRefFieldId: 'buttonPageRef',
      styleFieldId: 'buttonStyle',
      toneFieldId: 'buttonTone',
      showTone: isOutlineButton,
    }),
    fieldById.get('widthShare'),
  ].filter(Boolean);

  return (
    <div className="admin-cta-field-slots">
      <section className="admin-cta-field-slot-card">
        <h4>Photo column</h4>
        <DraftBackedFieldControlGrid
          fields={fields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={PHOTO_COLUMN_LOCAL_DRAFT_FIELD_IDS}
        />
      </section>
    </div>
  );
}

export function getMigratedBlockEditorComponent(kind, surface = 'admin') {
  const token = String(kind || '').trim();
  const normalizedSurface = String(surface || 'admin').trim().toLowerCase();

  if (normalizedSurface === 'hud' && token === 'intro') {
    return IntroHudBlockEditor;
  }
  if (normalizedSurface === 'hud' && token === 'content') {
    return PageContentHudBlockEditor;
  }
  if (normalizedSurface === 'hud' && token === 'top_strip') {
    return TopStripHudBlockEditor;
  }
  if (normalizedSurface === 'hud' && token === 'testimonials') {
    return TestimonialsHudBlockEditor;
  }
  if (token === 'hero') {
    return HeroBlockEditor;
  }
  if (token === 'hero_pie') {
    return HeroPieBlockEditor;
  }
  if (token === 'calculator_cta') {
    return CalculatorCtaBlockEditor;
  }
  if (token === 'cta_band') {
    return CtaBandBlockEditor;
  }
  if (normalizedSurface === 'admin' && token === 'cta_form') {
    return CtaFormBlockEditor;
  }
  if (token === 'request_form') {
    return RequestFormBlockEditor;
  }
  if (token === 'impact_stat') {
    return ImpactStatBlockEditor;
  }
  if (token === 'rates') {
    return RatesBlockEditor;
  }
  if (token === 'legal_copy') {
    return LegalCopyBlockEditor;
  }
  if (token === 'intro') {
    return IntroBlockEditor;
  }
  if (token === 'billboard') {
    return BillboardBlockEditor;
  }
  if (token === 'feature_panel') {
    return FeaturePanelBlockEditor;
  }
  if (token === 'site_feature') {
    return SiteFeatureBlockEditor;
  }
  if (token === 'split_panel') {
    return SplitPanelBlockEditor;
  }
  if (token === 'services_grid') {
    return ServicesGridBlockEditor;
  }
  if (token === 'card_grid') {
    return GridBlockEditor;
  }
  if (token === 'newsletter') {
    return NewsletterBlockEditor;
  }
  if (token === 'content') {
    return PageContentBlockEditor;
  }
  if (token === 'top_strip') {
    return TopStripBlockEditor;
  }
  if (token === 'testimonials') {
    return TestimonialsBlockEditor;
  }
  if (token === 'columns') {
    return ColumnsBlockEditor;
  }
  if (token === 'photo_column') {
    return PhotoColumnBlockEditor;
  }
  return null;
}
