import { useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import AdminNumberInput from '../AdminNumberInput';
import AdminHtmlEditor from '../AdminHtmlEditor';
import BackgroundEditorPage from '../BackgroundEditorPage';
import PageContentEditorPreview from '../PageContentEditorPreview';
import SharedRouteLinkField from '../RouteLinkField';
import BillboardHudEditorPanel, {
  BillboardSlider,
  normalizeBillboardBodyWidth,
  normalizeBillboardHeaderGap,
  normalizeBillboardPadding,
  normalizeBillboardWidth,
} from '../BillboardHudEditorPanel';
import ColorPalette from '../ColorPalette';
import { HeroHudEditorPanel } from '../HeroHudEditorShared';
import IntroHudEditorPanel from '../IntroHudEditorShared';
import PageContentHudEditorPanel, { PageContentLayoutControls } from '../PageContentHudEditorPanel';
import TestimonialsHudEditorPanel from '../TestimonialsHudEditorPanel';
import TopStripHudEditorPanel from '../TopStripHudEditorPanel';
import ColumnsHudEditorPanel from '../ColumnsHudEditorPanel';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from '../HudEditorShell';
import { inspectDynamicHeroSettings } from '../../context/ContentAdminContext';
import { useOptionalContentAdmin } from '../../context/ContentAdminContextCore';
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
import { applyTextColorSelection, readColorSelection } from '../../lib/textColorSelection';
import {
  hasDisplayableHeroLineText,
  resolveVisibleHeroLineNumbers,
  supportsOptionalHeroLine3,
} from '../../lib/heroEditorLines';
import { normalizeHeroLineGapEm } from '../../lib/heroLineStyle';
import { normalizeHeroPaddingRem } from '../../lib/heroPadding';
import {
  DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
  DEFAULT_HERO_TITLE_SIZE_REM,
  normalizeHeroTitleLetterSpacingEm,
  normalizeHeroTitleSizeRem,
} from '../../lib/heroTitleSize';
import {
  normalizeBillboardLeadCopySizeRem,
  normalizeBillboardLineSpacing,
  normalizeBillboardSubtitleSizeRem,
  normalizeBillboardTitleFontFamily,
  normalizeBillboardTitleFontWeight,
  normalizeBillboardTitleLetterSpacingEm,
  normalizeBillboardTitleSizeRem,
  getIntroExtraLineDefaults,
  normalizeIntroLineSpacing,
} from '../../lib/dynamicSectionTypography';
import {
  coerceLinkValue,
  coerceLinkValueFromFields,
  getCanonicalLinkJsonFieldId,
  linkValueToEditableHref,
  linkValueToRouteRef,
  serializeLinkValue,
} from '../../lib/linkValue';
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
  getGridSafeCardStyleForBg,
  getGridSafeToneForBg,
  DEFAULT_DYNAMIC_GRID_CARD_BULLET_LINE_HEIGHT,
  DEFAULT_DYNAMIC_GRID_CARD_BULLET_SIZE_REM,
  normalizeGridBgTone,
  normalizeGridCardStyleToken,
  normalizeGridToneToken,
} from '../../lib/dynamicGrid';
import { buildCardGridIntroHtml } from '../../lib/cardGridIntro';
import {
  BUTTON_TONE_OPTIONS as SHARED_BUTTON_TONE_OPTIONS,
  HERO_TEXT_COLOR_OPTIONS,
  PANEL_TEXT_TONE_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
  normalizeButtonTone,
  normalizePanelTextTone,
  normalizeSemanticTextColorClass,
  normalizeSemanticTextColorClasses,
  normalizeSurfaceBgTone,
  resolvePanelTextToneClassName,
  getTokenSwatch,
} from '../../lib/colorSystem';
import {
  getAllowedSiteFeatureEditableFieldIds,
  resolveSiteFeatureCatalogEntry,
  SITE_FEATURE_ACTION_FIELD_IDS,
} from '../../data/siteFeatureCatalog';
import {
  getSiteFeatureCollectionItems,
  getSiteFeatureCollectionModel,
  SiteFeatureCollectionEditor,
} from './SiteFeatureCollectionEditor';
import { buildDynamicRatesFromBlock } from '../../lib/dynamicPageBlocks';
import { RatesBlockPreview } from '../RatesBlock';
import { EDITOR_DRAFT_FLUSH_EVENT } from '../../lib/contentAdminTiming';
import {
  getSupportLibraryUnresolvedDocumentIds,
  parseSupportLibraryGroups,
  serializeSupportLibraryGroups,
} from '../../lib/supportLibrary';
import {
  getPageContentEditorField,
  getPageContentEditorHtml,
  hasLegacyPageContentSource,
} from '../../lib/pageContentEditorHtml';
import {
  createProtectedEditorDraft,
  isOlderEditorDraftRevision,
  normalizeEditorDraftRevision,
  shouldKeepProtectedEditorDraft,
} from '../../lib/editorDraftProtection';

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
const EDITOR_LOCAL_DRAFT_COMMIT_DELAY_MS = 320;
const SITE_FEATURE_LOCAL_DRAFT_FIELD_IDS = Object.freeze([
  'headline',
  'body',
  'buttonLabel',
  'buttonUrl',
  'panelsJson',
  'metricsJson',
  'cardsJson',
  'beatsJson',
  'introHeading',
  'introBody',
  'introEmphasis',
]);
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
  'subtitle',
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
const ACTION_BUTTON_STYLE_SET = new Set(['blue', 'dark', 'white', 'outline', 'ghost']);
const HERO_SWATCH_OPTIONS = HERO_TEXT_COLOR_OPTIONS;
const BILLBOARD_BG_SWATCH_OPTIONS = SURFACE_BG_TONE_OPTIONS;
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

function hasGridCardSettings(settings, slot) {
  const prefix = `card${slot}`;
  return Object.entries(settings || {}).some(([key, value]) => (
    key.startsWith(prefix) && String(value ?? '').trim()
  ));
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
      text: String(item?.text ?? ''),
      className: String(item?.className || '').trim(),
    }))
    .filter((item) => item.text.trim() && item.className);

  return normalized.length ? JSON.stringify(normalized) : '';
}

function normalizeGridResourceLinkItem(item) {
  const source = item && typeof item === 'object' ? item : {};
  // Keep the raw label while an admin is typing. Trimming here makes the
  // controlled input erase a trailing space before the next word is entered.
  // Serializer validation trims only at the persistence boundary.
  const label = String(source.label ?? source.title ?? '');
  const documentId = String(source.documentId || '').trim();
  const to = String(source.to || source.pageRef || '').trim();
  const href = String(source.href || source.url || '').trim();
  const openInNewWindow = toBoolean(source.openInNewWindow);
  const declaredKind = String(source.kind || '').trim();

  // Keep an unsaved local row's selected type. Without this, an empty row
  // falls through to `external` on the next render and the internal page
  // picker can never open until a destination already exists.
  if (declaredKind === 'document' || declaredKind === 'internal' || declaredKind === 'external') {
    return {
      label,
      kind: declaredKind,
      documentId,
      to,
      href,
      openInNewWindow,
    };
  }

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
      const label = String(item.label ?? '');
      const hasLabel = label.trim();
      if (item.kind === 'document') {
        if (!hasLabel || !item.documentId) {
          return {
            label,
            kind: 'document',
            documentId: item.documentId || '',
          };
        }
        return {
          label,
          documentId: item.documentId,
          ...(item.openInNewWindow ? { openInNewWindow: true } : {}),
        };
      }
      if (item.kind === 'internal') {
        if (!hasLabel || !item.to) {
          return {
            label,
            kind: 'internal',
            to: item.to || '',
          };
        }
        return {
          label,
          to: item.to,
          ...(item.openInNewWindow ? { openInNewWindow: true } : {}),
        };
      }
      if (!hasLabel || !item.href) {
        return {
          label,
          kind: 'external',
          href: item.href || '',
        };
      }
      return {
        label,
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
        title: String(item.title ?? ''),
        links: parseGridResourceLinkItems(JSON.stringify(Array.isArray(item.links) ? item.links : [])),
      }));
  } catch {
    return [];
  }
}

function serializeGridResourceAccordions(items) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => ({
      title: String(item?.title ?? ''),
      links: JSON.parse(serializeGridResourceLinkItems(item?.links) || '[]'),
    }));

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

function parseGridBulletList(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const normalized = parsed.map((item) => String(item || '').trim());
    return normalized.some(Boolean) ? normalized : [];
  } catch {
    return [];
  }
}

function serializeGridBulletList(items) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => String(item || '').trim());
  return normalized.some(Boolean) ? JSON.stringify(normalized) : '';
}

function parseGridBulletEditorList(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item ?? ''))
      : [];
  } catch {
    return [];
  }
}

function serializeGridBulletEditorList(items) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => String(item ?? ''));
  return normalized.length ? JSON.stringify(normalized) : '';
}

function CardGridBulletListEditor({ label, value, onChange }) {
  const bullets = parseGridBulletEditorList(value);

  const updateBullets = (nextBullets) => {
    onChange(serializeGridBulletEditorList(nextBullets));
  };

  return (
    <div
      className="admin-grid-resource-editor admin-card-grid-bullet-editor"
      aria-label={label}
    >
      <div className="admin-grid-resource-editor-head">
        <button
          type="button"
          className="action-btn action-btn-outline"
          onClick={() => updateBullets([...bullets, ''])}
        >
          Add bullet
        </button>
      </div>
      {bullets.length ? (
        <div className="admin-card-grid-bullet-list">
          {bullets.map((bullet, index) => (
            <div className="admin-card-grid-bullet-row" key={`card-grid-bullet-${index}`}>
              <textarea
                rows={2}
                value={bullet}
                aria-label={`${label} ${index + 1}`}
                placeholder={`Bullet ${index + 1}`}
                onChange={(event) => {
                  const nextBullets = [...bullets];
                  nextBullets[index] = event.target.value;
                  onChange(serializeGridBulletEditorList(nextBullets));
                }}
              />
              <button
                type="button"
                className="admin-highlight-remove-btn"
                onClick={() => updateBullets(bullets.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="admin-grid-resource-empty">No bullets added.</p>
      )}
    </div>
  );
}

function CardGridRichBodyEditor({
  label,
  value,
  onChange,
}) {
  return (
    <div className="admin-grid-resource-editor admin-card-grid-rich-body-editor">
      <div className="admin-grid-resource-editor-head">
        <strong>{label}</strong>
        <span className="admin-grid-resource-editor-help">Rich text; appears below the bullets in the card.</span>
      </div>
      <AdminHtmlEditor
        compact
        value={toEditorHtml(value)}
        onChange={onChange}
        ariaLabel={label}
        placeholder="Optional card body copy"
      />
    </div>
  );
}

function buildLegacyCardListEditorHtml(value) {
  const items = parseGridBulletList(value);
  if (!items.length) {
    return '';
  }
  return `<ul>${items.map((item) => `<li>${String(item).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`).join('')}</ul>`;
}

function resolveCgaCardBodyEditorValue(settings, slot) {
  const body = String(settings?.[`card${slot}Body`] || '').trim();
  const legacyBodyHtml = String(settings?.[`card${slot}BodyHtml`] || '').trim();
  const bodyIsEmpty = !body || body === '<p></p>' || body === '<p><br></p>';
  const baseBody = bodyIsEmpty ? legacyBodyHtml : body;
  const legacyListHtml = buildLegacyCardListEditorHtml(settings?.[`card${slot}ListJson`]);
  if (!legacyListHtml) {
    return baseBody;
  }
  if (!baseBody || baseBody === '<p></p>' || baseBody === '<p><br></p>') {
    return legacyListHtml;
  }
  return /<ul[\s>]/i.test(baseBody) ? baseBody : `${legacyListHtml}${baseBody}`;
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
  workspace = false,
}) {
  const activeSlot = Number(expandedSlot) || Number(slots[0]?.slot) || null;
  const activeSlotData = slots.find((slotData) => Number(slotData?.slot) === activeSlot) || null;

  if (workspace) {
    return (
      <div className={`admin-card-grid-workspace${className ? ` ${className}` : ''}`}>
        <div className="admin-card-grid-workspace-head">
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
        <nav className="admin-card-grid-card-nav" aria-label="Cards">
          {slots.map((slotData) => {
            const slot = Number(slotData?.slot);
            const isActive = activeSlot === slot;
            return (
              <button
                key={`card-grid-nav-${slot}`}
                type="button"
                className={`admin-card-grid-card-nav-item admin-progressive-slot-toggle${isActive ? ' is-active' : ''}`}
                aria-label={`Card ${slot}${slotData?.title ? `: ${slotData.title}` : ''}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onToggleSlot?.(slot)}
              >
                <span className="admin-card-grid-card-nav-number">{String(slot).padStart(2, '0')}</span>
                <span className="admin-card-grid-card-nav-card-label admin-progressive-slot-kicker">Card {slot}</span>
                <span className="admin-card-grid-card-nav-title">
                  {slotData?.title || slotData?.fallbackTitle || `Card ${slot}`}
                </span>
                {slotData?.summary ? (
                  <span className="admin-card-grid-card-nav-summary">{slotData.summary}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="admin-card-grid-workspace-main">
          {activeSlotData ? (
            <div
              key={`card-grid-workspace-slot-${activeSlotData.slot}`}
              className="admin-card-grid-workspace-slot"
              data-card-slot={activeSlotData.slot}
            >
              {renderSlotBody?.(activeSlotData)}
            </div>
          ) : (
            <p className="admin-grid-resource-empty">Select a card to begin.</p>
          )}
        </div>
      </div>
    );
  }

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

function CardGridEditorDisclosure({
  label,
  summary,
  sectionId,
  openSection,
  onToggle,
  children,
}) {
  const isOpen = openSection === sectionId;
  return (
    <section className={`admin-card-grid-editor-disclosure${isOpen ? ' is-open' : ''}`}>
      <button
        type="button"
        className="admin-card-grid-editor-disclosure-toggle"
        aria-expanded={isOpen ? 'true' : 'false'}
        onClick={() => onToggle(sectionId)}
      >
        <span>
          <strong>{label}</strong>
          {summary ? <small>{summary}</small> : null}
        </span>
        <span className="admin-card-grid-editor-disclosure-chevron" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div
        className="admin-card-grid-editor-disclosure-body"
        aria-hidden={isOpen ? undefined : 'true'}
      >
        {children}
      </div>
    </section>
  );
}

function CardGridHeaderEditor({
  fieldById,
  headerControlFields = [],
  settings,
  onSettingChange,
  routeOptions,
  paletteVariant = 'admin',
}) {
  const titleField = fieldById.get('title');
  const titleColorField = fieldById.get('titleClassName');
  const introHtmlField = fieldById.get('introHtml');
  const subtitleField = fieldById.get('subtitle');
  const subtitleColorField = fieldById.get('subtitleClassName');
  const bodyHtmlField = fieldById.get('bodyHtml');
  const gridBgTone = normalizeGridBgTone(settings.bgTone);
  const subheadSizeRem = Number.isFinite(Number(settings.subheadSizeRem))
    ? Number(settings.subheadSizeRem)
    : null;
  const subheadPreviewStyle = subheadSizeRem !== null
    ? { '--dynamic-grid-subhead-size': `${subheadSizeRem}rem` }
    : undefined;
  const titleColorOptions = Array.isArray(titleColorField?.options) && titleColorField.options.length
    ? titleColorField.options
    : HERO_SWATCH_OPTIONS;
  const subtitleColorOptions = Array.isArray(subtitleColorField?.options) && subtitleColorField.options.length
    ? subtitleColorField.options
    : HERO_SWATCH_OPTIONS;

  return (
    <div className="admin-card-grid-header-editor">
      <div className="admin-card-grid-header-editor-columns">
        <div className="admin-card-grid-header-editor-copy">
          {titleField ? (
            <ColorTextSelectionEditor
              label="Grid header"
              text={settings.title ?? ''}
              lineClassName={settings.titleClassName ?? ''}
              highlightsJson={settings.titleHighlightsJson ?? ''}
              onTextChange={(nextValue) => onSettingChange('title', nextValue)}
              onLineClassNameChange={(nextValue) => onSettingChange('titleClassName', nextValue)}
              onHighlightsJsonChange={(nextValue) => onSettingChange('titleHighlightsJson', nextValue)}
              placeholder="Card Grid heading"
              rows={2}
              className="is-intro-heading"
              unifiedPreviewEditor
              previewTagName="h2"
              spanDetailsUnderToggle
              useResetForClear
              swatchOptions={titleColorOptions}
              swatchVariant={paletteVariant}
              previewWrapClassName={`is-bg-${gridBgTone}`}
            />
          ) : null}

          {introHtmlField ? (
            <>
              <label className="admin-card-grid-subtitle-label">Grid subhead</label>
              <AdminHtmlEditor
                compact
                value={buildCardGridIntroHtml(settings)}
                onChange={(nextValue) => onSettingChange('introHtml', nextValue)}
                placeholder="Grid subhead and intro copy"
                ariaLabel="Grid subhead and intro copy"
                className={`is-bg-${gridBgTone}${subheadSizeRem !== null ? ' is-subhead-sized' : ''}`}
                style={subheadPreviewStyle}
                baseColorClassName={normalizeSemanticTextColorClass(settings.subtitleClassName)}
                onBaseColorChange={(nextValue) => onSettingChange('subtitleClassName', nextValue)}
              />
            </>
          ) : subtitleField ? (
            <ColorTextSelectionEditor
              label="Grid subhead"
              text={settings.subtitle ?? ''}
              lineClassName={settings.subtitleClassName ?? ''}
              highlightsJson={settings.subtitleHighlightsJson ?? ''}
              onTextChange={(nextValue) => onSettingChange('subtitle', nextValue)}
              onLineClassNameChange={(nextValue) => onSettingChange('subtitleClassName', nextValue)}
              onHighlightsJsonChange={(nextValue) => onSettingChange('subtitleHighlightsJson', nextValue)}
              placeholder=""
              rows={2}
              unifiedPreviewEditor
              previewTagName="h3"
              spanDetailsUnderToggle
              useResetForClear
              swatchOptions={subtitleColorOptions}
              swatchVariant={paletteVariant}
              previewWrapClassName={`is-bg-${gridBgTone}`}
            />
          ) : null}

          {!introHtmlField && bodyHtmlField ? (
            <AdminHtmlEditor
              compact
              value={toEditorHtml(settings.bodyHtml, settings.body)}
              onChange={(nextValue) => onSettingChange('bodyHtml', nextValue)}
              placeholder="Grid intro copy"
            />
          ) : null}
        </div>
        {headerControlFields.length ? (
          <FieldControlGrid
            fields={headerControlFields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline admin-card-grid-header-editor-controls"
            paletteVariant={paletteVariant}
          />
        ) : null}
      </div>

    </div>
  );
}

function CardGridButtonEditor({
  buttonNumber,
  fieldById,
  settings,
  onSettingChange,
  routeOptions,
}) {
  const suffix = buttonNumber === 2 ? 'Button2' : 'Button';
  const prefix = `card${buttonNumber}${suffix}`;
  const labelField = fieldById.get(`${prefix}Label`);
  const destinationField = getPromotedRouteLinkField(
    fieldById,
    `${prefix}Url`,
    `${prefix}PageRef`,
  );

  if (!labelField && !destinationField) {
    return null;
  }

  const fields = [
    labelField ? { ...labelField, label: 'Button label' } : null,
    destinationField
      ? {
          ...destinationField,
          label: 'Destination',
          openInNewWindowLabel: 'Open button in new window',
        }
      : null,
  ].filter(Boolean);

  return (
    <section className="admin-card-grid-action-card">
      <div className="admin-card-grid-action-card-head">
        <strong>Button {buttonNumber}</strong>
        <span>Label, destination, and window behavior</span>
      </div>
      <DraftBackedFieldControlGrid
        fields={fields}
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-card-grid-action-fields"
        routeOptions={routeOptions}
        draftFieldIds={GRID_LOCAL_DRAFT_FIELD_IDS}
      />
    </section>
  );
}

function CardGridCardEditor({
  slotData,
  settings,
  onSettingChange,
  fieldById,
  routeOptions,
  documentOptions,
  isCgaAssetsGrid,
  showActions = true,
  showBullets = true,
  showTitleDestination = false,
  slotNoun = 'Card',
}) {
  const [openSection, setOpenSection] = useState(null);
  const slot = Number(slotData?.slot);
  const prefix = `card${slot}`;
  const titleField = fieldById.get(`${prefix}Title`);
  const titleDestinationField = getPromotedRouteLinkField(
    fieldById,
    `${prefix}TitleUrl`,
    `${prefix}TitlePageRef`,
  );
  const titleColorField = fieldById.get(`${prefix}TitleClassName`);
  const fineprintField = fieldById.get(`${prefix}Fineprint`);
  const fineprintJustifyField = fieldById.get(`${prefix}FineprintJustify`);
  const fineprintSpaceBeforeField = fieldById.get(`${prefix}FineprintSpaceBeforeRem`);
  const fineprintLineHeightField = fieldById.get(`${prefix}FineprintLineHeight`);
  const fineprintSpaceAfterField = fieldById.get(`${prefix}FineprintSpaceAfterRem`);
  const contentFields = [titleField, showTitleDestination ? titleDestinationField : null].filter(Boolean).map((field) => (
    field === titleDestinationField ? { ...field, label: 'Destination' } : field
  ));
  const bodyValue = isCgaAssetsGrid
    ? resolveCgaCardBodyEditorValue(settings, slot)
    : settings[`${prefix}Body`] || settings[`${prefix}BodyHtml`];
  const primaryLabel = String(settings[`${prefix}ButtonLabel`] || '').trim();
  const secondaryLabel = String(settings[`${prefix}Button2Label`] || '').trim();
  const bullets = parseGridBulletEditorList(settings[`${prefix}ListJson`]);
  const links = parseGridResourceLinkItems(settings[`${prefix}LinksJson`]);
  const accordions = parseGridResourceAccordions(settings[`${prefix}AccordionsJson`]);
  const titleColor = String(settings[`${prefix}TitleClassName`] || '').trim();

  useEffect(() => {
    setOpenSection(null);
  }, [slot]);

  const toggleSection = (sectionId) => {
    setOpenSection((current) => (current === sectionId ? null : sectionId));
  };

  const handleBodyChange = (nextValue) => {
    onSettingChange(`${prefix}Body`, nextValue);
    if (isCgaAssetsGrid && Object.prototype.hasOwnProperty.call(settings, `${prefix}ListJson`)) {
      onSettingChange(`${prefix}ListJson`, '');
    }
    if (Object.prototype.hasOwnProperty.call(settings, `${prefix}BodyHtml`)) {
      onSettingChange(`${prefix}BodyHtml`, '');
    }
  };

  return (
    <div className="admin-card-grid-focused-editor">
      <div className="admin-card-grid-editor-disclosures">
        <CardGridEditorDisclosure
          label="Title and body"
          summary="Edit the visible card content"
          sectionId="content"
          openSection={openSection}
          onToggle={toggleSection}
        >
          <DraftBackedFieldControlGrid
            fields={contentFields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            routeOptions={routeOptions}
            draftFieldIds={GRID_LOCAL_DRAFT_FIELD_IDS}
          />
          <CardGridRichBodyEditor
            label={`${slotNoun} ${slot} body`}
            value={bodyValue}
            onChange={handleBodyChange}
          />
          <DraftBackedFieldControlGrid
            fields={[
              fineprintField,
              fineprintJustifyField,
              fineprintSpaceBeforeField,
              fineprintLineHeightField,
              fineprintSpaceAfterField,
            ].filter(Boolean)}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline admin-card-grid-fineprint-editor"
            routeOptions={routeOptions}
            draftFieldIds={GRID_LOCAL_DRAFT_FIELD_IDS}
          />
        </CardGridEditorDisclosure>

        {showActions ? (
        <CardGridEditorDisclosure
          label="Buttons"
          summary={primaryLabel || secondaryLabel ? `${[primaryLabel, secondaryLabel].filter(Boolean).length} configured` : 'None added'}
          sectionId="actions"
          openSection={openSection}
          onToggle={toggleSection}
        >
          <div className="admin-card-grid-action-list">
            <CardGridButtonEditor
              buttonNumber={1}
              fieldById={fieldById}
              settings={settings}
              onSettingChange={onSettingChange}
              routeOptions={routeOptions}
            />
            <CardGridButtonEditor
              buttonNumber={2}
              fieldById={fieldById}
              settings={settings}
              onSettingChange={onSettingChange}
              routeOptions={routeOptions}
            />
          </div>
        </CardGridEditorDisclosure>
        ) : null}

        <CardGridEditorDisclosure
          label="Title color override"
          summary={titleColor ? 'Custom color selected' : 'Uses the grid color'}
          sectionId="color"
          openSection={openSection}
          onToggle={toggleSection}
        >
          <FieldControlGrid
            fields={[titleColorField].filter(Boolean)}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            paletteVariant="hud"
          />
        </CardGridEditorDisclosure>

        {!isCgaAssetsGrid && showBullets ? (
          <CardGridEditorDisclosure
            label="Bullets"
            summary={bullets.length ? `${bullets.length} added` : 'None added'}
            sectionId="bullets"
            openSection={openSection}
            onToggle={toggleSection}
          >
            <CardGridBulletListEditor
              label={`${slotNoun} ${slot} bullets`}
              value={settings[`${prefix}ListJson`]}
              onChange={(nextValue) => onSettingChange(`${prefix}ListJson`, nextValue)}
            />
          </CardGridEditorDisclosure>
        ) : null}

        {slotData?.showDirectLinks ? (
          <CardGridEditorDisclosure
            label="Links"
            summary={links.length ? `${links.length} added` : 'Optional'}
            sectionId="links"
            openSection={openSection}
            onToggle={toggleSection}
          >
            <GridResourceLinkListEditor
              label="Direct PDF / link list"
              items={links}
              onChange={(nextItems) => onSettingChange(`${prefix}LinksJson`, serializeGridResourceLinkItems(nextItems))}
              routeOptions={routeOptions}
              documentOptions={documentOptions}
              showDocumentFilter
              addLabel="Add link"
              className="admin-card-grid-links-editor"
            />
          </CardGridEditorDisclosure>
        ) : null}

        {slotData?.showAccordions ? (
          <CardGridEditorDisclosure
            label="More details"
            summary={accordions.length ? `${accordions.length} groups added` : 'Optional'}
            sectionId="accordions"
            openSection={openSection}
            onToggle={toggleSection}
          >
            <GridResourceAccordionEditor
              value={accordions}
              onChange={(nextItems) => onSettingChange(`${prefix}AccordionsJson`, serializeGridResourceAccordions(nextItems))}
              routeOptions={routeOptions}
              documentOptions={documentOptions}
              showDocumentFilter
            />
          </CardGridEditorDisclosure>
        ) : null}
      </div>
    </div>
  );
}

function parseCardChartComparisonPoints(value) {
  const points = Array.isArray(value)
    ? value.map((point) => String(point || '').trim())
    : String(value || '').split(/\r?\n/).map((point) => point.trim());
  return points.length ? points : [''];
}

function CardChartComparisonPointsEditor({ value, onChange }) {
  const points = parseCardChartComparisonPoints(value);
  const updatePoint = (index, nextValue) => {
    const nextPoints = [...points];
    nextPoints[index] = nextValue;
    onChange(nextPoints.join('\n'));
  };
  const removePoint = (index) => {
    const nextPoints = points.filter((_, pointIndex) => pointIndex !== index);
    onChange(nextPoints.join('\n'));
  };

  return (
    <div className="admin-card-chart-points-editor">
      <div className="admin-card-chart-points-editor__heading">
        <span>Comparison points</span>
        <span className="admin-card-chart-points-editor__hint">One point per row</span>
      </div>
      <div className="admin-card-chart-points-editor__list">
        {points.map((point, index) => (
          <div className="admin-card-chart-point-row" key={`card-chart-point-${index}`}>
            <span className="admin-card-chart-point-row__number" aria-hidden="true">{index + 1}</span>
            <input
              type="text"
              value={point}
              aria-label={`Comparison point ${index + 1}`}
              placeholder="Add a comparison point"
              onChange={(event) => updatePoint(index, event.target.value)}
            />
            <button
              type="button"
              className="admin-card-chart-point-row__remove"
              aria-label={`Remove comparison point ${index + 1}`}
              onClick={() => removePoint(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="admin-card-chart-points-editor__add"
        onClick={() => onChange([...points, ''].join('\n'))}
      >
        Add comparison point
      </button>
    </div>
  );
}

export function CardChartBlockEditor({
  block,
  onSettingChange,
  routeOptions = [],
  sourceRevision = 0,
  hudMode = false,
  blockOptions = null,
}) {
  const settings = block?.settings || {};
  const fields = resolveEditorFields('card_chart', hudMode ? 'hud' : 'admin', block?.editableFields);
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const titleField = fieldById.get('title');
  const titleColorField = fieldById.get('titleClassName');
  const bgToneField = fieldById.get('bgTone') || {
    id: 'bgTone',
    label: 'Chart background',
    type: 'swatch',
    options: SURFACE_BG_TONE_OPTIONS,
  };
  const cardChartBgTone = normalizePanelBgTone(settings.bgTone);
  const headerFields = ['justify']
    .map((fieldId) => fieldById.get(fieldId))
    .filter(Boolean);
  const countField = fieldById.get('cardCount');
  const fineprintFields = ['fineprint', 'fineprintJustify']
    .map((fieldId) => fieldById.get(fieldId))
    .filter(Boolean);
  const fineprintSizeField = fieldById.get('fineprintSizeRem');
  const spacingFields = ['headerGapRem', 'spaceBeforeRem', 'spaceAfterRem', 'paddingTopRem', 'paddingBottomRem', 'cellPaddingRem', 'cellTextSizeRem', 'cellTextWeight']
    .map((fieldId) => fieldById.get(fieldId))
    .filter(Boolean);
  const layoutFields = ['fullBleed', 'contentMaxWidthPx', 'anchorId']
    .map((fieldId) => fieldById.get(fieldId))
    .filter(Boolean);
  const requestedCount = Number(settings.cardCount);
  const cardCount = Number.isFinite(requestedCount)
    ? Math.max(2, Math.min(6, Math.round(requestedCount)))
    : 2;
  const cardGroups = Array.from({ length: cardCount }, (_, index) => {
    const slot = index + 1;
    return {
      slot,
      fields: [`card${slot}Title`, `card${slot}Color`, `card${slot}Bullets`]
        .map((fieldId) => fieldById.get(fieldId))
        .filter(Boolean),
    };
  });

  const handleCardCountChange = (nextValue) => {
    const nextCount = Math.max(2, Math.min(6, Number(nextValue) || 2));
    onSettingChange('cardCount', String(nextCount));
    for (let slot = 1; slot <= nextCount; slot += 1) {
      const titleKey = `card${slot}Title`;
      const bulletsKey = `card${slot}Bullets`;
      if (settings[titleKey] == null || String(settings[titleKey]).trim() === '') {
        onSettingChange(titleKey, `Card ${slot}`);
      }
      if (settings[bulletsKey] == null || String(settings[bulletsKey]).trim() === '') {
        onSettingChange(bulletsKey, 'Add a comparison point.\nAdd another comparison point.');
      }
    }
  };

  const cardControls = (
    <div className="admin-card-chart-card-list">
      {cardGroups.map((group) => (
        <section className="admin-card-chart-card-editor" key={`card-chart-card-${group.slot}`}>
          <h4>Card {group.slot}</h4>
          <FieldControlGrid
            fields={group.fields.filter((field) => field.id !== `card${group.slot}Bullets`)}
            settings={settings}
            onSettingChange={onSettingChange}
            routeOptions={routeOptions}
            sourceRevision={sourceRevision}
            className="admin-content-field-list--inline"
          />
          {group.fields.find((field) => field.id === `card${group.slot}Bullets`) ? (
            <CardChartComparisonPointsEditor
              value={settings[`card${group.slot}Bullets`]}
              onChange={(nextValue) => onSettingChange(`card${group.slot}Bullets`, nextValue)}
            />
          ) : null}
        </section>
      ))}
    </div>
  );

  const cardControlsPage = (
    <div className="admin-card-chart-chart-controls">
      {countField ? (
        <FieldControlGrid
          fields={[countField]}
          settings={settings}
          onSettingChange={(fieldId, nextValue) => handleCardCountChange(nextValue)}
          routeOptions={routeOptions}
          sourceRevision={sourceRevision}
          className="admin-content-field-list--inline"
        />
      ) : null}
      <p className="admin-card-chart-control-help">
        Sets the number of comparison columns. Increasing this adds another editable card and chart column.
      </p>
      {cardControls}
    </div>
  );

  const spacingControls = spacingFields.length ? (
    <div className="admin-card-chart-spacing-controls">
      <FieldControlGrid
        fields={spacingFields}
        settings={settings}
        onSettingChange={onSettingChange}
        routeOptions={routeOptions}
        sourceRevision={sourceRevision}
        className="admin-content-field-list--inline"
      />
    </div>
  ) : null;

  const fineprintControlsMarkup = fineprintFields.length || fineprintSizeField ? (
    <>
      <FieldControlGrid
        fields={fineprintFields}
        settings={settings}
        onSettingChange={onSettingChange}
        routeOptions={routeOptions}
        sourceRevision={sourceRevision}
        className="admin-content-field-list--inline admin-card-chart-fineprint-fields"
      />
      {fineprintSizeField ? (
        <FieldControlGrid
          fields={[fineprintSizeField]}
          settings={settings}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
          sourceRevision={sourceRevision}
          className="admin-content-field-list--inline admin-card-chart-fineprint-size-control"
        />
      ) : null}
    </>
  ) : null;

  const headerEditorMarkup = (
    <div className="admin-card-chart-header-editor-columns">
      <div className="admin-card-chart-header-editor-copy">
        {titleField ? (
          <ColorTextSelectionEditor
            label={titleField.label || 'Chart heading'}
            inputAriaLabel={titleField.label || 'Chart heading'}
            text={settings.title ?? ''}
            lineClassName={settings.titleClassName ?? ''}
            highlightsJson={settings.titleHighlightsJson ?? ''}
            onTextChange={(nextValue) => onSettingChange('title', nextValue)}
            onLineClassNameChange={(nextValue) => onSettingChange('titleClassName', nextValue)}
            onHighlightsJsonChange={(nextValue) => onSettingChange('titleHighlightsJson', nextValue)}
            placeholder="Card Chart heading"
            rows={titleField.rows || 2}
            className="is-card-chart-heading"
            unifiedPreviewEditor
            previewTagName="h2"
            previewClassName={`is-justify-${String(settings.justify || 'center').trim() || 'center'}`}
            previewWrapClassName={`is-bg-${cardChartBgTone}`}
            spanDetailsUnderToggle
            useResetForClear
            swatchOptions={Array.isArray(titleColorField?.options) && titleColorField.options.length
              ? titleColorField.options
              : HERO_SWATCH_OPTIONS}
            swatchVariant={hudMode ? 'hud' : 'admin'}
          />
        ) : null}
      </div>
      <div className="admin-card-chart-header-editor-controls">
        <FieldControlGrid
          fields={headerFields}
          settings={settings}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
          sourceRevision={sourceRevision}
          className="admin-content-field-list--inline admin-card-chart-header-fields"
        />
      </div>
    </div>
  );

  const editorSections = appendHudBlockOptionsSection([
    { id: 'header', label: 'Header', icon: 'H' },
    { id: 'background', label: 'Background', icon: '◌' },
    { id: 'spacing', label: 'Spacing', icon: '↕' },
    { id: 'cards', label: 'Cards', icon: '▦' },
    { id: 'fineprint', label: 'Fineprint', icon: '※' },
    { id: 'layout', label: 'Layout', icon: '⚙' },
  ], blockOptions);
  const [activeSection, setActiveSection] = useState(editorSections[0]?.id || 'header');

  if (hudMode) {
    return (
      <HudEditorModelLayout
        className="admin-card-chart-hud-editor"
        sections={editorSections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        label="Card Chart editor sections"
        panelClassName="admin-card-chart-hud-panels"
      >
        <section className="admin-card-chart-hud-page admin-card-chart-hud-page--header">
          {headerEditorMarkup}
        </section>
        <section className="admin-card-chart-hud-page admin-card-chart-hud-page--background">
          <BackgroundEditorPage
            backgroundTone={cardChartBgTone}
            backgroundToneOptions={Array.isArray(bgToneField.options) && bgToneField.options.length ? bgToneField.options : SURFACE_BG_TONE_OPTIONS}
            backgroundToneLabel={bgToneField.label || 'Chart background'}
            onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', normalizePanelBgTone(nextValue))}
            backgroundEffectsJson={settings.backgroundEffectsJson}
            onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
            paletteVariant="hud"
          />
        </section>
        <section className="admin-card-chart-hud-page admin-card-chart-hud-page--spacing">
          {spacingControls}
        </section>
        <section className="admin-card-chart-hud-page admin-card-chart-hud-page--cards">
          {cardControlsPage}
        </section>
        <section className="admin-card-chart-hud-page admin-card-chart-hud-page--fineprint">
          {fineprintControlsMarkup}
        </section>
        <section className="admin-card-chart-hud-page admin-card-chart-hud-page--layout">
          <FieldControlGrid
            fields={layoutFields}
            settings={settings}
            onSettingChange={onSettingChange}
            routeOptions={routeOptions}
            sourceRevision={sourceRevision}
            className="admin-content-field-list--inline"
          />
        </section>
        <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
      </HudEditorModelLayout>
    );
  }

  return (
    <div className="admin-card-chart-editor">
      <section className="admin-card-chart-editor-section admin-card-chart-editor-section--header">
        <h3>Header</h3>
        {headerEditorMarkup}
      </section>
      <section className="admin-card-chart-editor-section admin-card-chart-editor-section--background">
        <h3>Background</h3>
        <BackgroundEditorPage
          backgroundTone={cardChartBgTone}
          backgroundToneOptions={Array.isArray(bgToneField.options) && bgToneField.options.length ? bgToneField.options : SURFACE_BG_TONE_OPTIONS}
          backgroundToneLabel={bgToneField.label || 'Chart background'}
          onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', normalizePanelBgTone(nextValue))}
          backgroundEffectsJson={settings.backgroundEffectsJson}
          onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
          paletteVariant="admin"
        />
      </section>
      <section className="admin-card-chart-editor-section admin-card-chart-editor-section--spacing">
        <h3>Spacing</h3>
        {spacingControls}
      </section>
      <section className="admin-card-chart-editor-section admin-card-chart-editor-section--cards">
        <h3>Cards</h3>
        {cardControlsPage}
      </section>
      <section className="admin-card-chart-editor-section admin-card-chart-editor-section--fineprint">
        <h3>Fineprint</h3>
        {fineprintControlsMarkup}
      </section>
      <section className="admin-card-chart-editor-section admin-card-chart-editor-section--layout">
        <h3>Layout</h3>
        <FieldControlGrid
          fields={layoutFields}
          settings={settings}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
          sourceRevision={sourceRevision}
          className="admin-content-field-list--inline"
        />
      </section>
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

function resolveRouteLinkFieldMeta(fieldOrId, explicitRouteRefFieldId = '') {
  const field = fieldOrId && typeof fieldOrId === 'object' ? fieldOrId : null;
  const fieldId = String(field?.id || fieldOrId || '').trim();
  const routeRefFieldId = String(field?.routeRefFieldId || explicitRouteRefFieldId || '').trim();
  const legacyHrefFieldId = String(field?.legacyHrefFieldId || (fieldId.endsWith('LinkJson') ? '' : fieldId) || '').trim();
  const openInNewWindowFieldId = String(
    field?.openInNewWindowFieldId
    || (legacyHrefFieldId ? legacyHrefFieldId.replace(/(?:Url|Path|Href)$/, 'OpenInNewWindow') : '')
    || '',
  ).trim();
  const baseFieldId = String(routeRefFieldId || legacyHrefFieldId || fieldId || '').replace(/(?:PageRef|Url|Path|Href|LinkJson)$/, '');
  const linkJsonFieldId = String(field?.linkJsonFieldId || (fieldId.endsWith('LinkJson') ? fieldId : '') || getCanonicalLinkJsonFieldId(baseFieldId)).trim();
  const conventionHrefFieldIds = baseFieldId ? [`${baseFieldId}Url`, `${baseFieldId}Path`, `${baseFieldId}Href`] : [];
  const legacyHrefFieldIds = Array.from(new Set([
    legacyHrefFieldId,
    ...(fieldId.endsWith('LinkJson') ? conventionHrefFieldIds : []),
  ].filter(Boolean)));
  const routeRefFieldIds = Array.from(new Set([
    routeRefFieldId,
    ...(baseFieldId ? [`${baseFieldId}PageRef`] : []),
  ].filter(Boolean)));
  const openInNewWindowFieldIds = Array.from(new Set([
    openInNewWindowFieldId,
    ...(baseFieldId ? [`${baseFieldId}OpenInNewWindow`] : []),
  ].filter(Boolean)));

  return {
    fieldId,
    linkJsonFieldId,
    legacyHrefFieldId,
    legacyHrefFieldIds,
    routeRefFieldId,
    routeRefFieldIds,
    openInNewWindowFieldId,
    openInNewWindowFieldIds,
  };
}

function resolveCanonicalRouteLinkValue(settings, fieldOrId, explicitRouteRefFieldId = '') {
  const meta = resolveRouteLinkFieldMeta(fieldOrId, explicitRouteRefFieldId);
  return coerceLinkValueFromFields(settings, {
    linkJsonKeys: [meta.linkJsonFieldId],
    hrefKeys: meta.legacyHrefFieldIds,
    toKeys: meta.routeRefFieldIds,
    openInNewWindowKeys: meta.openInNewWindowFieldIds,
  });
}

function resolveCanonicalRouteLinkEditableHref(settings, fieldOrId, explicitRouteRefFieldId = '') {
  return linkValueToEditableHref(resolveCanonicalRouteLinkValue(settings, fieldOrId, explicitRouteRefFieldId));
}

function resolveCanonicalRouteLinkRouteRef(settings, fieldOrId, explicitRouteRefFieldId = '') {
  return linkValueToRouteRef(resolveCanonicalRouteLinkValue(settings, fieldOrId, explicitRouteRefFieldId));
}

function resolveCanonicalRouteLinkOpenInNewWindow(settings, fieldOrId, explicitRouteRefFieldId = '') {
  return Boolean(resolveCanonicalRouteLinkValue(settings, fieldOrId, explicitRouteRefFieldId)?.openInNewWindow);
}

function commitCanonicalRouteLink(
  onSettingChange,
  fieldOrId,
  routeRefFieldId,
  nextHrefValue,
  nextRouteRefValue,
  nextOpenInNewWindowValue = false,
) {
  const meta = resolveRouteLinkFieldMeta(fieldOrId, routeRefFieldId);
  const routeRef = String(nextRouteRefValue || '').trim();
  const linkValue = routeRef.startsWith('/')
    ? coerceLinkValue({ to: routeRef, openInNewWindow: nextOpenInNewWindowValue })
    : coerceLinkValue({ href: nextHrefValue, openInNewWindow: nextOpenInNewWindowValue });
  const linkJsonValue = serializeLinkValue(linkValue);

  if (meta.linkJsonFieldId) {
    onSettingChange(meta.linkJsonFieldId, linkJsonValue);
  }
}

function resolveSplitRouteLinkEditableHref(settings, hrefFieldId, routeRefFieldId) {
  return resolveCanonicalRouteLinkEditableHref(settings, hrefFieldId, routeRefFieldId);
}

function resolveSplitRouteLinkRouteRef(settings, hrefFieldId, routeRefFieldId) {
  return resolveCanonicalRouteLinkRouteRef(settings, hrefFieldId, routeRefFieldId);
}

function promoteRouteLinkDescriptor(field, routeRefFieldId) {
  if (!field) {
    return field || null;
  }
  const {
    legacyHrefFieldId: _legacyHrefFieldId,
    routeRefFieldId: _routeRefFieldId,
    linkJsonFieldId: _linkJsonFieldId,
    openInNewWindowFieldId: _openInNewWindowFieldId,
    ...fieldWithoutLegacyMetadata
  } = field;
  return {
    ...fieldWithoutLegacyMetadata,
    type: 'route_link',
  };
}

function getPromotedRouteLinkField(fieldById, fieldId, routeRefFieldId) {
  const baseFieldId = String(routeRefFieldId || fieldId || '').replace(/(?:PageRef|Url|Path|Href)$/, '');
  const linkJsonFieldId = getCanonicalLinkJsonFieldId(baseFieldId);
  return promoteRouteLinkDescriptor(fieldById?.get(linkJsonFieldId) || fieldById?.get(fieldId), routeRefFieldId);
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

function getIntroButtonStyleSwatch(style) {
  const token = String(style || '').trim().toLowerCase();
  if (token === 'dark') {
    return getTokenSwatch('super-grey');
  }
  if (token === 'outline') {
    return getTokenSwatch('white');
  }
  if (token === 'ghost') {
    return getTokenSwatch('white');
  }
  return getTokenSwatch('atlantean');
}

function getIntroButtonStyleField(field) {
  if (!field || !/^button[12]Style$/.test(String(field.id || '')) || field.type !== 'select') {
    return field;
  }
  return {
    ...field,
    type: 'swatch',
    options: (Array.isArray(field.options) ? field.options : []).map((option) => ({
      ...option,
      swatch: option.swatch || getIntroButtonStyleSwatch(option.value),
    })),
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
    if (fieldId === `button${buttonNumber}Url` || fieldId === `button${buttonNumber}LinkJson`) {
      return { ...field, label: 'Destination', openInNewWindowLabel: 'New window' };
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
  showDocumentFilter = false,
  addLabel = 'Add link',
  compact = false,
  allowReorder = false,
  className = '',
  linkCardClassName = '',
  showLabel = true,
}) {
  const rows = Array.isArray(items) ? items : [];
  const [localRows, setLocalRows] = useState(rows);
  const [documentFilters, setDocumentFilters] = useState({});

  useEffect(() => {
    const localSerialized = serializeGridResourceLinkItems(localRows);
    const incomingSerialized = serializeGridResourceLinkItems(rows);
    if (localSerialized !== incomingSerialized) {
      setLocalRows(rows);
    }
  }, [items]);

  const handleChange = (nextRows) => {
    setLocalRows(nextRows);
    onChange(nextRows);
  };

  const getDocumentOptions = (index, selectedDocumentId) => {
    const filter = String(documentFilters[index] || '').trim().toLowerCase();
    const filteredOptions = filter
      ? documentOptions.filter((option) => (
        `${option.label} ${option.value}`.toLowerCase().includes(filter)
      ))
      : documentOptions;
    const selectedOption = documentOptions.find((option) => option.value === selectedDocumentId);
    if (selectedOption && !filteredOptions.some((option) => option.value === selectedOption.value)) {
      return [selectedOption, ...filteredOptions];
    }
    return filteredOptions;
  };

  return (
    <div className={`admin-grid-resource-editor${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`}>
      <div className="admin-grid-resource-editor-head">
        {showLabel ? <strong>{label}</strong> : <span className="admin-sr-only">{label}</span>}
        <button
          type="button"
          className="action-btn action-btn-outline"
          aria-label={addLabel}
          onClick={() => handleChange([
            ...localRows,
            { label: '', kind: 'document', documentId: '', to: '', href: '', openInNewWindow: false },
          ])}
        >
          {addLabel}
        </button>
      </div>

      {localRows.length ? (
        <div className="admin-grid-resource-link-list">
          {localRows.map((item, index) => {
            const normalized = normalizeGridResourceLinkItem(item);
            const moveItem = (direction) => {
              const nextIndex = index + direction;
              if (nextIndex < 0 || nextIndex >= localRows.length) return;
              const next = [...localRows];
              [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
              handleChange(next);
            };
            return (
              <div key={`${label}-resource-${index}`} className={`admin-grid-resource-link-card${linkCardClassName ? ` ${linkCardClassName}` : ''}`}>
                <div className="admin-grid-resource-link-toprow">
                  <label className="admin-grid-resource-field">
                    <span>Link label</span>
                    <input
                      type="text"
                      value={normalized.label}
                      placeholder="Example: Read the article"
                      onChange={(event) => {
                        const next = [...localRows];
                        next[index] = { ...normalized, label: event.target.value };
                        handleChange(next);
                      }}
                    />
                  </label>
                  <label className="admin-grid-resource-field">
                    <span>Link type</span>
                    <select
                      aria-label="Link type"
                      value={normalized.kind}
                      onChange={(event) => {
                        const nextKind = event.target.value;
                        const next = [...localRows];
                        next[index] = {
                          label: normalized.label,
                          kind: nextKind,
                          documentId: '',
                          to: '',
                          href: '',
                          openInNewWindow: false,
                        };
                        handleChange(next);
                      }}
                    >
                      {GRID_RESOURCE_LINK_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  {allowReorder ? (
                    <>
                      <button type="button" className="action-btn action-btn-outline" onClick={() => moveItem(-1)} disabled={index === 0}>Up</button>
                      <button type="button" className="action-btn action-btn-outline" onClick={() => moveItem(1)} disabled={index === rows.length - 1}>Down</button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="admin-highlight-remove-btn"
                    onClick={() => handleChange(localRows.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    Remove
                  </button>
                </div>

                {normalized.kind === 'document' ? (
                  <div className="admin-grid-resource-document-fields">
                    <label className="admin-grid-resource-field admin-grid-resource-destination-field">
                      <span>PDF / document</span>
                      <select
                        value={normalized.documentId}
                        onChange={(event) => {
                          const next = [...localRows];
                          next[index] = { ...normalized, documentId: event.target.value };
                          handleChange(next);
                        }}
                      >
                        <option value="">Select document</option>
                        {getDocumentOptions(index, normalized.documentId).map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    {showDocumentFilter ? (
                      <label className="admin-grid-resource-field admin-grid-resource-document-filter-field">
                        <span>Filter documents</span>
                        <input
                          type="search"
                          aria-label={`Filter documents for link ${index + 1}`}
                          value={documentFilters[index] || ''}
                          placeholder="Search title, topic, or ID"
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setDocumentFilters((current) => ({ ...current, [index]: nextValue }));
                          }}
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}

                {normalized.kind === 'internal' ? (
                  <div className="admin-grid-resource-destination-field">
                    <SharedRouteLinkField
                      inputLabel="URL/path override"
                      value={normalized.to}
                      openInNewWindowValue={normalized.openInNewWindow}
                      showOpenInNewWindow={false}
                      onRouteLinkChange={(nextValue) => {
                        const next = [...localRows];
                        next[index] = { ...normalized, to: nextValue };
                        handleChange(next);
                      }}
                      routeOptions={routeOptions}
                    />
                  </div>
                ) : null}

                {normalized.kind === 'external' ? (
                  <label className="admin-grid-resource-field admin-grid-resource-destination-field">
                    <span>External URL</span>
                    <input
                      type="text"
                      value={normalized.href}
                      placeholder="https://..."
                      onChange={(event) => {
                        const next = [...localRows];
                        next[index] = { ...normalized, href: event.target.value };
                        handleChange(next);
                      }}
                    />
                  </label>
                ) : null}

                {normalized.kind !== 'internal' ? (
                  <label className="admin-grid-resource-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(normalized.openInNewWindow)}
                      onChange={(event) => {
                        const next = [...localRows];
                        next[index] = { ...normalized, openInNewWindow: event.target.checked };
                        handleChange(next);
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
  showDocumentFilter = false,
}) {
  const accordions = Array.isArray(value) ? value : [];

  return (
    <div className="admin-grid-resource-editor admin-card-grid-accordion-editor">
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
                showDocumentFilter={showDocumentFilter}
                addLabel="Add accordion link"
                compact
                showLabel={false}
                className="admin-card-grid-links-editor admin-card-grid-accordion-links-editor"
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

function SupportLibraryGroupsEditor({ value, onChange, routeOptions = [] }) {
  const documentsContext = useContext(DocumentsContext);
  const documents = Array.isArray(documentsContext?.documents) ? documentsContext.documents : [];
  const groups = parseSupportLibraryGroups(value);
  const documentOptions = useMemo(() => (
    documents
      .filter((document) => document?.active !== false && String(document?.id || '').trim())
      .map((document) => ({
        value: String(document.id).trim(),
        label: [String(document.title || '').trim(), String(document.topic || '').trim()]
          .filter(Boolean)
          .join(' - ') || String(document.id).trim(),
      }))
  ), [documents]);
  const unresolvedIds = getSupportLibraryUnresolvedDocumentIds(groups, documents);

  const updateGroups = (nextGroups) => onChange(serializeSupportLibraryGroups(nextGroups));
  const updateGroup = (index, patch) => {
    const next = [...groups];
    next[index] = { ...next[index], ...patch };
    updateGroups(next);
  };
  const moveGroup = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= groups.length) return;
    const next = [...groups];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateGroups(next);
  };

  return (
    <div className="admin-support-library-editor">
      <div className="admin-grid-resource-editor-head">
        <button
          type="button"
          className="action-btn action-btn-outline"
          onClick={() => updateGroups([...groups, { title: 'New group', links: [], items: [] }])}
        >
          Add group
        </button>
      </div>
      {unresolvedIds.length ? (
        <p className="admin-support-library-warning" role="status">
          {unresolvedIds.length} document{unresolvedIds.length === 1 ? '' : 's'} are not in the document library yet. Public links remain unchanged until the document is restored.
        </p>
      ) : null}
      {groups.length ? (
        <div className="admin-grid-accordion-list admin-support-library-group-list">
          {groups.map((group, groupIndex) => (
            <div key={`support-group-${groupIndex}`} className="admin-grid-accordion-card admin-support-library-group">
              <div className="admin-grid-resource-link-toprow">
                <input
                  type="text"
                  value={group.title || ''}
                  aria-label={`Support group ${groupIndex + 1} title`}
                  placeholder="Group title"
                  onChange={(event) => updateGroup(groupIndex, { title: event.target.value })}
                />
                <button type="button" className="action-btn action-btn-outline" onClick={() => moveGroup(groupIndex, -1)} disabled={groupIndex === 0}>Up</button>
                <button type="button" className="action-btn action-btn-outline" onClick={() => moveGroup(groupIndex, 1)} disabled={groupIndex === groups.length - 1}>Down</button>
                <button
                  type="button"
                  className="admin-highlight-remove-btn"
                  onClick={() => updateGroups(groups.filter((_, index) => index !== groupIndex))}
                >
                  Remove
                </button>
              </div>
              <textarea
                rows={2}
                value={group.description || ''}
                aria-label={`${group.title || `Support group ${groupIndex + 1}`} description`}
                placeholder="Optional group description"
                onChange={(event) => updateGroup(groupIndex, { description: event.target.value })}
              />
              <GridResourceLinkListEditor
                label="Group links"
                items={group.links}
                routeOptions={routeOptions}
                documentOptions={documentOptions}
                addLabel="Add link"
                allowReorder
                className="admin-support-library-links"
                linkCardClassName="admin-support-library-link"
                showLabel={false}
                onChange={(nextLinks) => updateGroup(groupIndex, {
                  links: nextLinks.map((link) => ({
                    label: link.label,
                    ...(link.documentId ? { documentId: link.documentId } : {}),
                    ...(link.to ? { to: link.to } : {}),
                    ...(link.href ? { href: link.href } : {}),
                    ...(link.openInNewWindow ? { openInNewWindow: true } : {}),
                  })),
                })}
              />
              {Array.isArray(group.items) && group.items.length ? (
                <p className="admin-support-library-help">This group contains {group.items.length} existing FAQ item{group.items.length === 1 ? '' : 's'}. FAQ editing will be added without changing these links.</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="admin-grid-resource-empty">No support groups added.</p>
      )}
    </div>
  );
}

function renderFieldControl(field, value, onChange, settings, onSettingChange, routeOptions = [], paletteVariant = 'admin') {
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

  if (field.type === 'range') {
    const min = Number.isFinite(Number(field.min)) ? Number(field.min) : 0;
    const max = Number.isFinite(Number(field.max)) ? Number(field.max) : 100;
    const step = Number.isFinite(Number(field.step)) ? Number(field.step) : 1;
    const numericValue = Number(value);
    const activeValue = Number.isFinite(numericValue)
      ? Math.max(min, Math.min(max, numericValue))
      : min;
    return (
      <div className="admin-range-number-control">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={activeValue}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={field.label || 'Range'}
        />
        <AdminNumberInput
          value={activeValue}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          aria-label={`${field.label || 'Range'} value`}
        />
        <span>{field.suffix === '' ? '' : (field.suffix || 'rem')}</span>
      </div>
    );
  }

  if (field.type === 'select') {
    const options = Array.isArray(field.options) ? field.options : [];
    const isFineprintJustify = /(?:FineprintJustify|fineprintJustify)$/.test(String(field.id || ''));
    if (field.id === 'justify' || isFineprintJustify) {
      return (
        <JustifyPillControl
          label={field.label}
          value={value ?? (field.id === 'fineprintJustify' ? 'center' : (isFineprintJustify ? 'left' : 'center'))}
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
        variant={paletteVariant}
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

  if (field.type === 'background_lights') {
    return (
      <BackgroundEditorPage
        backgroundTone={settings?.bgTone}
        backgroundToneOptions={Array.isArray(settings?.bgToneOptions) ? settings.bgToneOptions : undefined}
        backgroundEffectsJson={value}
        onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
        onBackgroundEffectsChange={onChange}
        paletteVariant={paletteVariant}
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
              variant={paletteVariant}
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
        compact={Boolean(field.compact)}
      />
    );
  }

  if (field.type === 'support_library_groups') {
    return (
      <SupportLibraryGroupsEditor
        value={value}
        onChange={onChange}
        routeOptions={routeOptions}
      />
    );
  }

  if (field.type === 'route_link') {
    const routeRefFieldId = String(field.routeRefFieldId || '').trim();
    const resolvedValue = resolveCanonicalRouteLinkEditableHref(settings, field);
    const resolvedRouteRefValue = resolveCanonicalRouteLinkRouteRef(settings, field);
    const resolvedOpenInNewWindowValue = resolveCanonicalRouteLinkOpenInNewWindow(settings, field);
    return (
      <SharedRouteLinkField
        inputLabel={field.label || 'URL / Path'}
        value={resolvedValue}
        routeRefValue={resolvedRouteRefValue}
        openInNewWindowValue={resolvedOpenInNewWindowValue}
        openInNewWindowLabel={field.openInNewWindowLabel || 'Open in new window'}
        onChange={onChange}
        onRouteLinkChange={(nextValue, nextRouteRefValue) => {
          commitCanonicalRouteLink(onSettingChange, field, routeRefFieldId, nextValue, nextRouteRefValue, resolvedOpenInNewWindowValue);
        }}
        onOpenInNewWindowChange={(nextOpenInNewWindowValue) => {
          commitCanonicalRouteLink(
            onSettingChange,
            field,
            routeRefFieldId,
            resolvedValue,
            resolvedRouteRefValue,
            nextOpenInNewWindowValue,
          );
        }}
        routeOptions={routeOptions}
      />
    );
  }

  return <input type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
}

export function FieldControlGrid({ fields, settings, onSettingChange, className = '', hideLabels = false, routeOptions = [], paletteVariant = 'admin', sourceRevision = 0 }) {
  const items = Array.isArray(fields) ? fields.filter(Boolean) : [];
  if (!items.length) {
    return null;
  }

  return (
    <DraftBackedFieldControlGrid
      fields={items}
      settings={settings}
      onSettingChange={onSettingChange}
      className={className}
      hideLabels={hideLabels}
      routeOptions={routeOptions}
      paletteVariant={paletteVariant}
      draftFieldIds={items
        .filter((field) => ['text', 'textarea', 'route_link'].includes(String(field?.type || '').trim().toLowerCase()))
        .map((field) => field.id)}
      commitImmediately
      sourceRevision={sourceRevision}
    />
  );
}

function PanelAppearanceControls({
  fields,
  settings,
  onSettingChange,
  className = '',
  compactSwatches = true,
  paletteVariant = 'admin',
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
        paletteVariant={paletteVariant}
      />
    </section>
  );
}

function toEditorHtml(value, fallbackText = '') {
  const source = String(value || '').trim();
  if (source) {
    if (/<[a-z][^>]*>/i.test(source)) {
      return source;
    }
    const escaped = source
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    return `<p>${escaped}</p>`;
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

export function EditorButtonPreview({ buttons, backgroundTone = 'white' }) {
  const items = Array.isArray(buttons) ? buttons : [];
  const visible = items
    .map((item, index) => {
      const label = String(item?.label || '').trim();
      if (!label) {
        return null;
      }
      const style = normalizeActionButtonStyleToken(item?.style);
      const defaultTone = style === 'white'
        ? 'white'
        : (style === 'dark' || style === 'ghost' ? 'super-grey' : 'atlantean');
      const tone = style === 'outline'
        ? normalizeActionButtonToneToken(item?.tone, defaultTone)
        : defaultTone;
      const className = [
        'service-native-btn',
        style === 'ghost' ? 'is-ghost' : '',
        style === 'outline' ? 'is-outline' : '',
        `is-tone-${tone}`,
      ].filter(Boolean).join(' ');
      return { label, className };
    })
    .filter(Boolean);

  if (!visible.length) {
    return null;
  }

  return (
    <section className={`admin-button-preview-wrap is-bg-${String(backgroundTone || 'white').trim().toLowerCase() || 'white'}`} aria-label="Button preview">
      <span className="admin-button-preview-label">Button preview</span>
      <div className="admin-button-preview-row">
        {visible.map((item, index) => (
          <button
            key={`btn-preview-${index}`}
            type="button"
            className={`${item.className} admin-button-preview-button`}
            onClick={(event) => event.preventDefault()}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function CtaFormBlockEditor({ block, onSettingChange, routeOptions = [], sourceRevision = 0 }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const subtitleField = fieldById.get('subtitle') || null;
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
    sourceRevision,
  });
  const ctaFormDraftSettings = useMemo(() => ({
    ...settings,
    ...ctaFormDraftValues,
  }), [ctaFormDraftValues, settings]);
  const externalCtaFields = useMemo(
    () => extractCtaFormFields(settings, null, {
      allowLegacyStepFields: String(settings.sectionClassName || '')
        .split(/\s+/)
        .includes('insurance-native-cta'),
    }),
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
          <BackgroundEditorPage
            backgroundTone={settings.bgTone}
            backgroundToneOptions={Array.isArray(bgToneField?.options) ? bgToneField.options : []}
            backgroundToneLabel={bgToneField?.label || 'CTA background'}
            onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
            backgroundEffectsJson={settings.backgroundEffectsJson}
            onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
            paletteVariant="admin"
          />
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

      <DraftBackedFieldControlGrid
        fields={subtitleField ? [subtitleField] : []}
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-content-field-list--inline"
        draftFieldIds={['subtitle']}
        sourceRevision={sourceRevision}
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

export function resolveRequestFormLeadCopyFieldId(settings = {}) {
  if (String(settings?.subtitle || '').trim()) {
    return 'subtitle';
  }
  if (String(settings?.body || '').trim()) {
    return 'body';
  }
  return 'subtitle';
}

function RequestFormStepEditor({ stepNumber, settings, onSettingChange, expanded, onToggle }) {
  const fieldsKey = `step${stepNumber}FieldsJson`;
  const titleKey = `step${stepNumber}Title`;
  const noteKey = `step${stepNumber}Note`;
  const alertKey = `step${stepNumber}Alert`;
  const {
    draftValues: stepTextDraftValues,
    updateDraftField: updateStepTextDraft,
    commitDraftOnBlur: commitStepTextDraft,
  } = useBufferedStringFieldDrafts({
    settings,
    onSettingChange,
    fieldIds: [titleKey, noteKey, alertKey],
  });
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
  const summaryTitle = String(stepTextDraftValues[titleKey] ?? settings?.[titleKey] ?? '').trim() || 'Untitled step';
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
        <span className="admin-request-form-step-toggle-indicator" aria-hidden="true">
          {expanded ? 'Close −' : 'Open +'}
        </span>
      </button>

      {expanded ? (
        <>
          <div className="admin-request-form-step-settings">
            <div className="admin-request-form-step-settings-head">
              <strong>Step settings</strong>
              <span>Name the step and give the admin-facing form guidance.</span>
            </div>
            <div className="admin-content-field-list admin-content-field-list--inline">
              <label>
                <span>{`Step ${stepNumber} title`}</span>
                <input
                  type="text"
                  value={String(stepTextDraftValues[titleKey] ?? settings?.[titleKey] ?? '')}
                  onChange={(event) => updateStepTextDraft(titleKey, event.target.value)}
                  onBlur={() => commitStepTextDraft(titleKey)}
                />
              </label>
              <label>
                <span>{`Step ${stepNumber} note`}</span>
                <input
                  type="text"
                  value={String(stepTextDraftValues[noteKey] ?? settings?.[noteKey] ?? '')}
                  onChange={(event) => updateStepTextDraft(noteKey, event.target.value)}
                  onBlur={() => commitStepTextDraft(noteKey)}
                />
              </label>
              <label>
                <span>{`Step ${stepNumber} alert`}</span>
                <input
                  type="text"
                  value={String(stepTextDraftValues[alertKey] ?? settings?.[alertKey] ?? '')}
                  onChange={(event) => updateStepTextDraft(alertKey, event.target.value)}
                  onBlur={() => commitStepTextDraft(alertKey)}
                />
              </label>
            </div>
          </div>
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

export function RequestFormBlockEditor({
  block,
  onSettingChange,
  sourceRevision = 0,
  hudMode = false,
  blockOptions = null,
}) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const titleColorField = fieldById.get('titleClassName') || null;
  const bgToneField = fieldById.get('bgTone') || null;
  const textToneField = fieldById.get('textTone') || null;
  const requestBgTone = normalizePanelBgTone(settings.bgTone);
  const requestTextTone = normalizePanelTextTone(settings.textTone, 'dark');
  const requestHeadingPreviewWrapClassName = [
    `is-bg-${requestBgTone}`,
    requestBgTone === 'white' && requestTextTone === 'white' ? 'is-editor-contrast' : '',
  ].filter(Boolean).join(' ');
  const spacingFields = ['spaceBeforeRem', 'spaceAfterRem']
    .map((id) => fieldById.get(id))
    .filter(Boolean);
  const configFields = pickFieldDescriptors(fieldById, getSharedFormConfigFieldIds());
  const requestTitleColorOptions = Array.isArray(titleColorField?.options) && titleColorField.options.length
    ? titleColorField.options
    : HERO_SWATCH_OPTIONS;
  const requestTextColorControl = textToneField ? (
    <label className="admin-request-form-swatch-group admin-request-form-lead-text-color">
      <span>{textToneField.label || 'Text color'}</span>
      <ColorPalette
        variant="hud"
        className="is-compact is-icon-only is-circular admin-request-form-hud-swatch-palette admin-request-form-swatch-palette"
        ariaLabel={textToneField.label || 'Request form text color'}
        options={Array.isArray(textToneField.options) ? textToneField.options : []}
        value={String(settings.textTone || '')}
        preventMouseDown
        onChange={(nextValue) => onSettingChange('textTone', nextValue)}
      />
    </label>
  ) : null;
  const leadCopyFieldId = resolveRequestFormLeadCopyFieldId(settings);
  const {
    draftValues: requestFormDraftValues,
    updateDraftField: updateRequestFormDraftField,
    commitDraftOnBlur: commitRequestFormDraftOnBlur,
  } = useBufferedStringFieldDrafts({
    settings,
    onSettingChange,
    fieldIds: [leadCopyFieldId],
    sourceRevision,
  });
  const requestFormDraftSettings = useMemo(() => ({
    ...settings,
    ...requestFormDraftValues,
  }), [requestFormDraftValues, settings]);
  const visibleStepNumbers = [1, 2, 3, 4, 5].filter((stepNumber) => (
    parseRequestFormStepFieldsJson(settings?.[`step${stepNumber}FieldsJson`]).length > 0
  ));
  const nextStepNumber = [1, 2, 3, 4, 5].find((stepNumber) => !visibleStepNumbers.includes(stepNumber)) || null;
  const [expandedSteps, setExpandedSteps] = useState(() => new Set(visibleStepNumbers.slice(0, 1)));

  useEffect(() => {
    setExpandedSteps((current) => {
      const next = new Set();
      visibleStepNumbers.forEach((stepNumber) => {
        if (current.has(stepNumber)) {
          next.add(stepNumber);
        }
      });
      if (!next.size && visibleStepNumbers.length) {
        next.add(visibleStepNumbers[0]);
      }
      return next;
    });
  }, [settings?.step1FieldsJson, settings?.step2FieldsJson, settings?.step3FieldsJson, settings?.step4FieldsJson, settings?.step5FieldsJson]);

  const headingAndLeadContent = (
    <>
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
        previewTagName="h2"
        previewClassName={getPanelTextTonePreviewClassName(requestTextTone, 'dark')}
        previewWrapClassName={requestHeadingPreviewWrapClassName}
        spanDetailsUnderToggle
        useResetForClear
        swatchOptions={requestTitleColorOptions}
        swatchVariant="hud"
      />
      <div className="admin-request-form-lead-row">
        <label className="admin-front-hud-field admin-request-form-lead-field">
          <span>Lead Copy</span>
          <textarea
            rows={3}
            value={String(requestFormDraftSettings[leadCopyFieldId] || '')}
            onChange={(event) => updateRequestFormDraftField(leadCopyFieldId, event.target.value)}
            onBlur={() => commitRequestFormDraftOnBlur(leadCopyFieldId)}
          />
        </label>
        {requestTextColorControl}
      </div>
    </>
  );

  const appearanceContent = (
    <div className="admin-request-form-appearance-content">
      <div className="admin-request-form-swatch-groups">
        <BackgroundEditorPage
          backgroundTone={settings.bgTone}
          backgroundToneOptions={Array.isArray(bgToneField?.options) ? bgToneField.options : []}
          backgroundToneLabel={bgToneField?.label || 'Request form background'}
          onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
          backgroundEffectsJson={settings.backgroundEffectsJson}
          onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
          paletteVariant="hud"
        />

      </div>

      {spacingFields.length ? (
        <div className="admin-request-form-spacing-controls" aria-label="Spacing controls">
          <div className="admin-request-form-spacing-head">
            <span>Spacing</span>
            <small>Adjust the space before and after the form.</small>
          </div>
          <div className="admin-request-form-spacing-grid">
            {spacingFields.map((field) => {
              const currentValue = Number.isFinite(Number(settings?.[field.id])) ? Number(settings[field.id]) : 0;
              return (
                <BillboardSlider
                  key={`request-form-spacing-${field.id}`}
                  label={field.label}
                  min={Number(field.min) || 0}
                  max={Number(field.max) || 8}
                  step={Number(field.step) || 0.25}
                  value={currentValue}
                  displayValue={`${currentValue.toFixed(2)}rem`}
                  ariaLabel={field.label}
                  onChange={(nextValue) => onSettingChange(field.id, nextValue)}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );

  const formOptionsContent = configFields.length ? (
    <div className="admin-request-form-options-layout">
      <div className="admin-request-form-options-fields">
        <div className="admin-request-form-page-heading">
          <h3>Form options</h3>
          <p>Control where submissions go and what the visitor sees after sending the form.</p>
        </div>
        <DraftBackedFieldControlGrid
          fields={configFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          draftFieldIds={REQUEST_FORM_CONFIG_LOCAL_DRAFT_FIELD_IDS}
          sourceRevision={sourceRevision}
        />
      </div>
      <div className="admin-request-form-button-management">
        <div className="admin-request-form-page-heading">
          <h3>Submit button</h3>
          <p>The button uses the shared form style. Change its label in the controls beside it.</p>
        </div>
        <div className={`admin-request-form-button-preview is-bg-${requestBgTone}`} aria-label="Submit button preview">
          <span className="admin-request-form-button-preview-label">Visitor sees</span>
          <button type="button" className="service-native-btn is-tone-atlantean">
            {String(settings.submitLabel || 'Submit request').trim() || 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const stepsContent = (
    <div className="admin-request-form-steps-content">
      <div className="admin-request-form-page-heading">
        <h3>Form steps</h3>
        <p>Choose a step to open it. Closed steps stay compact so the form structure is easy to scan.</p>
      </div>
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

  const hudSections = appendHudBlockOptionsSection([
    { id: 'content', label: 'Content', icon: '✦' },
    { id: 'appearance', label: 'Appearance', icon: '◉' },
    { id: 'integration', label: 'Form options', icon: '↔' },
    { id: 'steps', label: 'Form steps', icon: '☷' },
  ], blockOptions);
  const [activeHudSection, setActiveHudSection] = useState(hudSections[0]?.id || 'content');

  if (hudMode) {
    return (
      <HudEditorModelLayout
        className="admin-request-form-hud-editor"
        sections={hudSections}
        activeSection={activeHudSection}
        onSectionChange={setActiveHudSection}
        label="Request form editor sections"
        panelClassName="admin-request-form-hud-panels"
      >
        <section className="admin-request-form-hud-page admin-request-form-hud-page--content">
          {headingAndLeadContent}
        </section>
        <section className="admin-request-form-hud-page admin-request-form-hud-page--appearance">
          <div className="admin-request-form-page-heading">
            <h3>Appearance</h3>
            <p>Set the surface, text tone, and vertical spacing for this form.</p>
          </div>
          {appearanceContent}
        </section>
        <section className="admin-request-form-hud-page admin-request-form-hud-page--integration">
          {formOptionsContent}
        </section>
        <section className="admin-request-form-hud-page admin-request-form-hud-page--steps">
          {stepsContent}
        </section>
        <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
      </HudEditorModelLayout>
    );
  }

  return (
    <div className="admin-intro-block-editor admin-request-form-editor">
      <div className="admin-dynamic-panel-primary-grid admin-dynamic-panel-primary-grid--intro admin-request-form-primary-grid">
        <div className="admin-intro-editor-main admin-request-form-editor-main">{headingAndLeadContent}</div>
        <div className="admin-intro-appearance-stack admin-request-form-appearance-stack">
          <section className="admin-panel-appearance admin-panel-appearance--intro-text admin-request-form-appearance-panel">
            {appearanceContent}
          </section>
        </div>
      </div>
      {formOptionsContent ? (
        <details className="admin-request-form-config-details">
          <summary>Form behavior</summary>
          {formOptionsContent}
        </details>
      ) : null}
      {stepsContent}
    </div>
  );
}

function ColorTextSelectionEditor({
  label,
  inputAriaLabel = '',
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
  previewTagName = 'p',
  previewStyle = undefined,
  previewOverlay = null,
  afterSwatches = null,
  spanDetailsUnderToggle = false,
  showSpanDetailsInline = false,
  showClearSpansButton = false,
  useResetForClear = false,
  showPlaceholderInPreview = true,
  swatchOptions = HERO_SWATCH_OPTIONS,
  swatchVariant = 'admin',
}) {
  const inputRef = useRef(null);
  const commitTimerRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const isInputFocusedRef = useRef(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showSpanDetails, setShowSpanDetails] = useState(false);
  const externalText = String(text ?? '');
  const externalHighlightsJson = String(highlightsJson ?? '');
  const [draftText, setDraftText] = useState(externalText);
  const [draftHighlightsJson, setDraftHighlightsJson] = useState(externalHighlightsJson);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const value = draftText;
  const activeHighlightsJson = draftHighlightsJson;
  const normalizedLineClass = normalizeSemanticTextColorClasses(lineClassName);
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
    const nextSelection = readTextSelectionState(inputRef.current, selectionRef.current, value);
    selectionRef.current = nextSelection;
    setSelection({ start: nextSelection.start, end: nextSelection.end });
  };

  const handleTextChange = (nextText) => {
    const prevText = value;
    const nextHighlightsJson = remapHighlightsJsonForTextChange(activeHighlightsJson, prevText, nextText);
    syncLocalDraft(nextText, nextHighlightsJson);
    scheduleDraftCommit(nextText, nextHighlightsJson);
    setSelection((prev) => {
      const nextSelection = {
        start: Math.max(0, Math.min(nextText.length, prev.start)),
        end: Math.max(0, Math.min(nextText.length, prev.end)),
      };
      selectionRef.current = nextSelection;
      return nextSelection;
    });
  };

  const applySwatch = (colorValue) => {
    const el = inputRef.current;
    const inputIsFocused = isInputFocusedRef.current;
    if (!inputIsFocused) {
      const result = applyTextColorSelection({
        text: value,
        lineClassName: normalizedLineClass,
        highlightsJson: activeHighlightsJson,
        selection: { start: 0, end: 0 },
        colorValue,
      });
      onLineClassNameChange(result.lineClassName);
      selectionRef.current = { start: 0, end: 0 };
      setSelection({ start: 0, end: 0 });
      return;
    }

    if (el && document.activeElement !== el) {
      el.focus();
    }
    const currentSelection = readColorSelection(el, selectionRef.current, value);
    const result = applyTextColorSelection({
      text: value,
      lineClassName: normalizedLineClass,
      highlightsJson: activeHighlightsJson,
      selection: currentSelection,
      colorValue,
    });

    if (result.target === 'selection') {
      const nextHighlightsJson = result.highlightsJson;
      syncLocalDraft(value, nextHighlightsJson);
      commitDraft(value, nextHighlightsJson);
      selectionRef.current = result.selection;
      setSelection(result.selection);
      return;
    }

    selectionRef.current = { start: 0, end: 0 };
    setSelection({ start: 0, end: 0 });
    onLineClassNameChange(result.lineClassName);
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
  const selectedText = hasSelection ? value.slice(selection.start, selection.end) : '';
  const selectedTextPreview = selectedText.length > 28
    ? `${selectedText.slice(0, 25)}...`
    : selectedText;
  const colorControlLabel = hasSelection
    ? `Selected Color "${selectedTextPreview}"`
    : 'Core Color';
  const hasSpanDetails = highlights.length > 0;
  const spanDetailsVisible = showSpanDetailsInline || showSpanDetails;
  const previewContent = value
    ? renderPreviewHighlightedText(value, highlights)
    : (showPlaceholderInPreview ? <span className="admin-color-text-placeholder">{placeholder || 'Preview'}</span> : null);
  const resolvedSwatchOptions = useResetForClear
    ? (Array.isArray(swatchOptions) ? swatchOptions.filter((option) => option.value !== '') : [])
    : (Array.isArray(swatchOptions) ? swatchOptions : []);
  const PreviewTag = previewTagName;

  const textInput = (
    <textarea
      ref={inputRef}
      rows={rows}
        className="admin-color-text-input"
        value={value}
        placeholder={placeholder}
        onFocus={() => {
        isInputFocusedRef.current = true;
        syncSelection();
      }}
      onBlur={() => {
        commitDraft(value, activeHighlightsJson);
        isInputFocusedRef.current = false;
        selectionRef.current = { start: 0, end: 0 };
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
      <PreviewTag
        className={`admin-color-text-preview${mergedPreviewClassName ? ` ${mergedPreviewClassName}` : ''}`}
        style={previewStyle}
        aria-live="polite"
      >
        {previewContent}
      </PreviewTag>
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
      <PreviewTag
        className={`admin-color-text-preview${mergedPreviewClassName ? ` ${mergedPreviewClassName}` : ''}`}
        style={previewStyle}
        aria-live="polite"
      >
        {previewContent}
      </PreviewTag>
      <textarea
        ref={inputRef}
        rows={rows}
        className={`admin-color-text-inline-input${mergedPreviewClassName ? ` ${mergedPreviewClassName}` : ''}`}
        value={value}
        placeholder={placeholder}
        onFocus={() => {
          isInputFocusedRef.current = true;
          syncSelection();
        }}
        onBlur={() => {
          commitDraft(value, activeHighlightsJson);
          isInputFocusedRef.current = false;
          selectionRef.current = { start: 0, end: 0 };
          setSelection({ start: 0, end: 0 });
        }}
        onClick={syncSelection}
        onSelect={syncSelection}
        onKeyUp={syncSelection}
        onMouseUp={syncSelection}
        onChange={(event) => handleTextChange(event.target.value)}
        aria-label={inputAriaLabel || `${label} text`}
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
          <span className="admin-color-text-control-label">{colorControlLabel}</span>
          <div onMouseDownCapture={syncSelection}>
            <ColorPalette
              variant={swatchVariant}
              className={`is-compact is-icon-only${swatchVariant === 'hud' ? ' is-circular' : ''} admin-color-text-swatch-list`}
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

export function HeroBlockEditor({ block, pathname = '', onSettingChange, routeOptions = [], blockOptions = null, selection = null, onSelectionClear = null }) {
  const settings = block.settings || {};
  const heroInspection = useMemo(
    () => inspectDynamicHeroSettings(pathname, settings),
    [pathname, settings],
  );
  const [activeLine, setActiveLine] = useState('line1');
  const [showOptionalLine3, setShowOptionalLine3] = useState(() => hasDisplayableHeroLineText(settings, 'line3'));
  const heroLiveLineTextRef = useRef({});
  const [heroSpanDetailsOpen, setHeroSpanDetailsOpen] = useState(false);
  const [heroSpanDetailsLineKey, setHeroSpanDetailsLineKey] = useState('line1');

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
  const heroPaddingTopRem = normalizeHeroPaddingRem(settings.paddingTopRem);
  const heroPaddingBottomRem = normalizeHeroPaddingRem(settings.paddingBottomRem);
  const heroTitleSizeRem = normalizeHeroTitleSizeRem(settings.titleSizeRem);
  const heroTitleLetterSpacingEm = normalizeHeroTitleLetterSpacingEm(settings.titleLetterSpacingEm);
  const heroLineHeight = (() => {
    const numeric = Number(settings.lineHeight);
    if (!Number.isFinite(numeric)) {
      return 0.9;
    }
    return Math.max(0.72, Math.min(1.2, Number(numeric.toFixed(2))));
  })();
  const heroLineGap = normalizeHeroLineGapEm(settings.lineGap);
  const editableFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(editableFields.map((field) => [field.id, field]));
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
  useEffect(() => {
    const selectedLine = String(selection?.line || '').trim();
    if (selectedLine && resolvedLineNumbers.includes(Number(selectedLine.replace('line', '')))) {
      setActiveLine(selectedLine);
    }
  }, [selection?.line, resolvedLineNumbers]);
  const canShowOptionalLine3 = supportsOptionalHeroLine3({ fieldById, settings }) && !showOptionalLine3;
  const rawLineConfigs = resolvedLineNumbers.map((lineNumber) => {
    const lineKey = `line${lineNumber}`;
    const text = String(settings[`${lineKey}Text`] ?? '');
    const className = String(settings[`${lineKey}ClassName`] || '').trim();
    return {
      key: lineKey,
      label: `Line ${lineNumber}`,
      placeholder: `Line ${lineNumber} text`,
      text,
      className,
    };
  });
  const lineConfigs = rawLineConfigs.map((line) => {
    const text = line.text;
    const highlights = parseHeroRangeHighlights(settings?.[`${line.key}HighlightsJson`], text);
    return {
      ...line,
      text,
      lineColor: extractHeroLineColorToken(line.className),
      displayClassName: resolveHeroLineDisplayClassName(line.className, heroBgTone, line.key),
      highlights,
    };
  });

  const lineByKey = {
    ...Object.fromEntries(lineConfigs.map((line) => [line.key, line])),
  };

  const canHideOptionalLine3 = showOptionalLine3 && !hasStoredLine3Content;
  const heroSpanLines = lineConfigs.filter((line) => line.highlights.length > 0);
  const activeHeroSpanLine = heroSpanLines.find((line) => line.key === heroSpanDetailsLineKey)
    || heroSpanLines[0]
    || null;

  const detailFieldIds = new Set([
    'animationPreset',
    'justify',
    'bgTone',
    'heightMode',
    'heightSvh',
    'paddingTopRem',
    'paddingBottomRem',
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
    <HeroHudEditorPanel
      lines={lineConfigs}
      editableHeroBlock={block}
      lineKeys={resolvedLineNumbers.map((lineNumber) => `line${lineNumber}`)}
      includeOptionalLine3={showOptionalLine3}
      activeLineKey={activeLine}
      selection={selection}
      driftReport={heroInspection}
      bgTone={heroBgTone}
      justify={heroJustify}
      titleSizeRem={heroTitleSizeRem}
      titleLetterSpacingEm={heroTitleLetterSpacingEm}
      lineHeight={heroLineHeight}
      lineGap={heroLineGap}
      paddingTopRem={heroPaddingTopRem}
      paddingBottomRem={heroPaddingBottomRem}
      lineColorOptions={HERO_SWATCH_OPTIONS}
      bgToneOptions={HERO_BG_SWATCH_OPTIONS}
      onLineTextChange={(lineKey, nextValue) => {
        const previousText = String(settings?.[`${lineKey}Text`] ?? '');
        const nextText = String(nextValue ?? '');
        heroLiveLineTextRef.current[lineKey] = nextText;
        onSettingChange(`${lineKey}Text`, nextText);
        onSettingChange(
          `${lineKey}HighlightsJson`,
          remapHighlightsJsonForTextChange(settings?.[`${lineKey}HighlightsJson`], previousText, nextText),
        );
      }}
      onActivateLine={(lineKey) => setActiveLine(lineKey)}
      onApplyLineColor={(lineKey, colorValue) => {
        const line = lineByKey[lineKey] || lineByKey.line1;
        if (!line) {
          return;
        }
        const text = String(heroLiveLineTextRef.current[lineKey] ?? line.text);
        delete heroLiveLineTextRef.current[lineKey];
        const result = applyTextColorSelection({
          text,
          lineClassName: line.className,
          highlightsJson: settings?.[`${lineKey}HighlightsJson`],
          selection: { start: 0, end: 0 },
          colorValue,
        });
        onSettingChange(lineKey + 'ClassName', result.lineClassName);
        onSelectionClear?.();
      }}
      onApplySelectionColor={(lineKey, colorValue, selection) => {
        const line = lineByKey[lineKey] || lineByKey.line1;
        if (!line) {
          return;
        }
        const text = String(selection?.sourceText ?? line.text);
        const result = applyTextColorSelection({
          text,
          lineClassName: line.className,
          highlightsJson: settings?.[`${lineKey}HighlightsJson`],
          selection,
          colorValue,
        });
        if (result.target !== 'selection') {
          return;
        }
        onSettingChange(lineKey + 'Text', text);
        onSettingChange(lineKey + 'HighlightsJson', result.highlightsJson);
        onSelectionClear?.();
      }}
      onRemoveSpan={(lineKey, index) => {
        const line = lineByKey[lineKey] || lineByKey.line1;
        if (!line) {
          return;
        }
        onSettingChange(
          lineKey + 'HighlightsJson',
          removeSelectionRange(settings?.[`${lineKey}HighlightsJson`], line.text, index),
        );
        onSelectionClear?.();
      }}
      onClearLineSpans={(lineKey) => {
        onSettingChange(lineKey + 'HighlightsJson', '');
        onSelectionClear?.();
      }}
      onBgToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
      backgroundEffectsJson={settings.backgroundEffectsJson}
      onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
      onJustifyChange={(nextValue) => onSettingChange('justify', nextValue)}
      onTitleSizeChange={(nextValue) => onSettingChange('titleSizeRem', nextValue)}
      onTitleLetterSpacingChange={(nextValue) => onSettingChange('titleLetterSpacingEm', nextValue)}
      onLineHeightChange={(nextValue) => onSettingChange('lineHeight', nextValue)}
      onPaddingTopRemChange={(nextValue) => onSettingChange('paddingTopRem', nextValue)}
      onPaddingBottomRemChange={(nextValue) => onSettingChange('paddingBottomRem', nextValue)}
      canAddOptionalLine={canShowOptionalLine3}
      onAddOptionalLine={() => {
        setShowOptionalLine3(true);
        setActiveLine('line3');
      }}
      canRemoveOptionalLine={canHideOptionalLine3}
      onRemoveOptionalLine={() => {
        setShowOptionalLine3(false);
        if (activeLine === 'line3') {
          setActiveLine('line2');
        }
      }}
      blockOptions={blockOptions}
    >
      <div className="admin-hero-hud-extra-grid" aria-label="Hero settings">
        {heroSpanLines.length ? (
          <div className="admin-hero-hud-span-summary">
            <button
              type="button"
              className="admin-front-hud-mini-action"
              onClick={() => {
                setHeroSpanDetailsOpen((current) => !current);
                if (!heroSpanDetailsLineKey || !heroSpanLines.some((line) => line.key === heroSpanDetailsLineKey)) {
                  setHeroSpanDetailsLineKey(heroSpanLines[0].key);
                }
              }}
            >
              {heroSpanDetailsOpen ? 'Hide span details' : 'Show span details'}
            </button>
            {heroSpanDetailsOpen && activeHeroSpanLine ? (
              <div className="admin-hero-hud-span-summary-details">
                <span>{activeHeroSpanLine.label} spans</span>
                <div className="admin-hero-hud-span-line-nav" aria-label="Hero span lines">
                  {heroSpanLines.map((line) => (
                    <span key={`hero-span-summary-${line.key}`} className="admin-hero-hud-span-line-nav-item">
                      {line.key !== activeHeroSpanLine.key ? (
                        <button
                          type="button"
                          className="admin-front-hud-mini-action"
                          aria-label={`Go to ${line.label} spans (${line.highlights.length})`}
                          onClick={() => {
                            setActiveLine(line.key);
                            setHeroSpanDetailsLineKey(line.key);
                          }}
                        >
                          Go to
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="admin-front-hud-segment-btn"
                        aria-pressed={heroSpanDetailsLineKey === line.key}
                        onClick={() => {
                          setActiveLine(line.key);
                          setHeroSpanDetailsLineKey(line.key);
                        }}
                      >
                        {`${line.label} (${line.highlights.length} spans)`}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="admin-hero-hud-extra-row">
          <label className="admin-front-hud-field">
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
            <label className="admin-front-hud-field">
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

        <div className="admin-hero-hud-extra-group">
          <div className="admin-hero-hud-extra-group-head">
            <span>Hero height</span>
            <select
              aria-label="Hero height"
              value={heroHeightMode}
              onChange={(event) => onSettingChange('heightMode', event.target.value)}
            >
              <option value="default">Default</option>
              <option value="custom">Custom (% viewport)</option>
            </select>
          </div>
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
        </div>

        <div className="admin-hero-hud-action-grid">
          {button1Fields.length ? (
            <section className="admin-hero-hud-action-group" aria-label="Button 1 settings">
              <h5>Button 1</h5>
              <DraftBackedFieldControlGrid
                fields={button1Fields}
                settings={settings}
                onSettingChange={onSettingChange}
                className="admin-content-field-list--inline admin-hero-action-fields"
                routeOptions={routeOptions}
                draftFieldIds={HERO_BUTTON_LOCAL_DRAFT_FIELD_IDS[1]}
              />
            </section>
          ) : null}
          {button2Fields.length ? (
            <section className="admin-hero-hud-action-group" aria-label="Button 2 settings">
              <h5>Button 2</h5>
              <DraftBackedFieldControlGrid
                fields={button2Fields}
                settings={settings}
                onSettingChange={onSettingChange}
                className="admin-content-field-list--inline admin-hero-action-fields"
                routeOptions={routeOptions}
                draftFieldIds={HERO_BUTTON_LOCAL_DRAFT_FIELD_IDS[2]}
              />
            </section>
          ) : null}
        </div>

        {miscFields.length ? (
          <section className="admin-hero-hud-action-group" aria-label="Additional Hero settings">
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
    </HeroHudEditorPanel>
  );

}

export function IntroBlockEditor({ block, onSettingChange, routeOptions = [], sourceRevision = 0 }) {
  const settings = block.settings || {};
  const introDraftSettings = useMemo(() => ({
    ...settings,
    bodyHtml: toEditorHtml(settings.bodyHtml, settings.body),
    button1Url: resolveSplitRouteLinkEditableHref(settings, 'button1Url', 'button1PageRef'),
    button2Url: resolveSplitRouteLinkEditableHref(settings, 'button2Url', 'button2PageRef'),
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
  const introExtraLineDefaults = getIntroExtraLineDefaults(settings.sectionClassName);
  const introBgTone = normalizePanelBgTone(settings.bgTone);
  const introTextTone = normalizePanelTextTone(settings.textTone, 'dark');
  const {
    draftValues,
    routeRefDraftValues,
    updateDraftField,
    commitDraftOnBlur,
    commitRouteLinkField,
  } = useBufferedStringFieldDrafts({
    settings: introDraftSettings,
    onSettingChange,
    fieldIds: INTRO_LOCAL_DRAFT_FIELD_IDS,
    routeFieldIdByFieldId: {
      button1Url: 'button1PageRef',
      button2Url: 'button2PageRef',
    },
    routeOptions,
    sourceRevision,
  });
  const contentFields = allFields.filter((field) => (
    field.id !== 'heading'
    && field.id !== 'body'
    && field.id !== 'bodyHtml'
    && field.id !== 'bodyColorClassName'
    && field.id !== 'bgTone'
    && field.id !== 'backgroundEffectsJson'
    && field.id !== 'textTone'
    && field.id !== 'justify'
    && field.id !== 'lineSpacing'
    && field.id !== 'extraLineClassName'
  )).map((field) => {
    if (Object.prototype.hasOwnProperty.call(introExtraLineDefaults, field.id)) {
      return { ...field, defaultValue: introExtraLineDefaults[field.id] };
    }
    if (/^button[12]Style$/.test(String(field.id || ''))) {
      return getIntroButtonStyleField(field);
    }
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
            baseColorClassName={String(
              settings.bodyColorClassName || resolvePanelTextToneClassName(settings.textTone, 'dark'),
            )}
            onBaseColorChange={(nextValue) => onSettingChange('bodyColorClassName', nextValue)}
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

          <BackgroundEditorPage
            backgroundTone={settings.bgTone}
            backgroundToneOptions={Array.isArray(bgToneField?.options) ? bgToneField.options : []}
            backgroundToneLabel={bgToneField?.label || 'Intro background'}
            onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
            backgroundEffectsJson={settings.backgroundEffectsJson}
            onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
            paletteVariant="admin"
          />
        </div>
      </div>

      <EditorButtonPreview
        backgroundTone={settings.bgTone}
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
                  <SharedRouteLinkField
                    inputLabel={field.label || 'URL / Path'}
                    value={draftValues[fieldId] ?? ''}
                    routeRefValue={field.routeRefFieldId ? routeRefDraftValues[fieldId] ?? '' : ''}
                    openInNewWindowValue={resolveCanonicalRouteLinkOpenInNewWindow(settings, field)}
                    openInNewWindowLabel={field.openInNewWindowLabel || 'Open in new window'}
                    onChange={(nextValue) => updateDraftField(fieldId, nextValue)}
                    onRouteLinkChange={(nextValue, nextRouteRefValue) => {
                      commitRouteLinkField(fieldId, nextValue, nextRouteRefValue, resolveCanonicalRouteLinkOpenInNewWindow(settings, field));
                    }}
                    onOpenInNewWindowChange={(nextOpenInNewWindowValue) => {
                      commitRouteLinkField(
                        fieldId,
                        draftValues[fieldId] ?? '',
                        routeRefDraftValues[fieldId] ?? '',
                        nextOpenInNewWindowValue,
                      );
                    }}
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

function IntroHudBlockEditor({ block, onSettingChange, routeOptions = [], blockOptions = null }) {
  const settings = block.settings || {};
  const introExtraLineDefaults = getIntroExtraLineDefaults(settings.sectionClassName);
  const allFields = resolveEditorFields(block.kind, 'hud', block.editableFields);
  const actionSettings = {
    ...settings,
    button1Style: settings.button1Style || 'blue',
    button1Tone: settings.button1Tone || 'atlantean',
    button2Style: settings.button2Style || 'blue',
    button2Tone: settings.button2Tone || 'atlantean',
  };
  const introHeadingInputRef = useRef(null);
  const introExtraLineInputRef = useRef(null);
  const introBodyInputRef = useRef(null);
  const [introHeadingSelection, setIntroHeadingSelection] = useState({ start: 0, end: 0, text: '' });
  const [introBodyMiniEditorEnabled, setIntroBodyMiniEditorEnabled] = useState(true);
  const actionFieldGroups = [1, 2].map((buttonNumber) => ({
    buttonNumber,
    fields: allFields
    .filter((field) => field.id.startsWith(`button${buttonNumber}`))
    .map((field) => {
      if (field.id === 'button1Url' && field.type === 'text') {
        return promoteRouteLinkDescriptor(field, 'button1PageRef');
      }
      if (field.id === 'button2Url' && field.type === 'text') {
        return promoteRouteLinkDescriptor(field, 'button2PageRef');
      }
      if (field.id === `button${buttonNumber}Label`) {
        return { ...field, label: 'Label', layout: 'half' };
      }
      if (field.id === `button${buttonNumber}Style`) {
        return {
          ...getIntroButtonStyleField(field),
          label: 'Style',
          layout: 'half',
        };
      }
      if (field.id === `button${buttonNumber}Tone`) {
        if (String(settings[`button${buttonNumber}Style`] || '').trim().toLowerCase() !== 'outline') {
          return null;
        }
        return {
          ...field,
          label: 'Color',
          compact: true,
          iconOnly: true,
          layout: 'half',
          swatchClassName: 'admin-button-tone-swatch-list',
        };
      }
      return field;
    }).filter(Boolean),
  })).filter((group) => group.fields.length);
  const actionFields = actionFieldGroups.flatMap((group) => group.fields);

  const captureGenericSelection = (inputRef, setter, selectionMeta = null) => {
    if (selectionMeta && Number.isInteger(selectionMeta.start) && Number.isInteger(selectionMeta.end)) {
      const source = String(inputRef?.current?.value || selectionMeta.value || '');
      const start = Math.max(0, Math.min(selectionMeta.start, selectionMeta.end));
      const end = Math.max(start, Math.min(Math.max(selectionMeta.start, selectionMeta.end), source.length));
      setter({ start, end, text: source.slice(start, end) });
      return;
    }
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
      onHeadingSelectionCapture={(selectionMeta) => captureGenericSelection(
        introHeadingInputRef,
        setIntroHeadingSelection,
        selectionMeta,
      )}
      headingSelection={introHeadingSelection}
      headingHighlightsJson={String(settings.headingHighlightsJson || '')}
      headingColor={extractHeroLineColorToken(settings.headingClassName)}
      onHeadingColorChange={(nextValue) => {
        const result = applyTextColorSelection({
          text: String(settings.heading || ''),
          lineClassName: String(settings.headingClassName || ''),
          highlightsJson: settings.headingHighlightsJson,
          selection: { start: 0, end: 0 },
          colorValue: nextValue,
        });
        onSettingChange('headingClassName', result.lineClassName);
      }}
      onHeadingSelectionColorChange={(nextValue, selectedHeading = introHeadingSelection) => {
        const sourceText = String(settings.heading || '');
        const result = applyTextColorSelection({
          text: sourceText,
          lineClassName: String(settings.headingClassName || ''),
          highlightsJson: settings.headingHighlightsJson,
          selection: selectedHeading,
          colorValue: nextValue,
        });
        if (result.target !== 'selection') {
          return;
        }
        onSettingChange(
          'headingHighlightsJson',
          result.highlightsJson,
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
      extraLineSizeRem={settings.extraLineSizeRem ?? introExtraLineDefaults.extraLineSizeRem}
      onExtraLineSizeChange={(nextValue) => onSettingChange('extraLineSizeRem', nextValue)}
      extraLineSpaceBeforeRem={settings.extraLineSpaceBeforeRem ?? introExtraLineDefaults.extraLineSpaceBeforeRem}
      onExtraLineSpaceBeforeChange={(nextValue) => onSettingChange('extraLineSpaceBeforeRem', nextValue)}
      extraLineLineHeight={settings.extraLineLineHeight ?? introExtraLineDefaults.extraLineLineHeight}
      onExtraLineLineHeightChange={(nextValue) => onSettingChange('extraLineLineHeight', nextValue)}
      bodyMiniEditorEnabled={introBodyMiniEditorEnabled}
      onToggleBodyMiniEditor={() => setIntroBodyMiniEditorEnabled((current) => !current)}
      bodyHtml={String(settings.bodyHtml || '')}
      onBodyHtmlChange={(nextValue) => onSettingChange('bodyHtml', nextValue)}
      bodyColorClassName={String(settings.bodyColorClassName || resolvePanelTextToneClassName(settings.textTone, 'dark'))}
      onBodyColorChange={(nextValue) => onSettingChange('bodyColorClassName', nextValue)}
      bodyInputRef={introBodyInputRef}
      textTone={String(settings.textTone || 'dark')}
      onTextToneChange={(nextValue) => onSettingChange('textTone', nextValue)}
      bgTone={String(settings.bgTone || 'sand')}
      onBgToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
      backgroundEffectsJson={settings.backgroundEffectsJson}
      onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
      justify={String(settings.justify || 'center')}
      onJustifyChange={(nextValue) => onSettingChange('justify', nextValue)}
      lineSpacing={Number.isFinite(Number(settings.lineSpacing)) ? Number(settings.lineSpacing) : 1.04}
      onLineSpacingChange={(nextValue) => onSettingChange('lineSpacing', Number(nextValue))}
      allowWhiteBackground
      actionsSlot={actionFields.length ? (
        <>
          <div className="admin-intro-hud-action-groups">
            {actionFieldGroups.map((group) => (
              <section
                key={`intro-hud-button-${group.buttonNumber}`}
                className="admin-intro-hud-action-group"
                aria-label={`Button ${group.buttonNumber} settings`}
              >
                <h4>Button {group.buttonNumber}</h4>
                <FieldControlGrid
                  fields={group.fields}
                  settings={actionSettings}
                  onSettingChange={onSettingChange}
                  className="admin-content-field-list--inline admin-intro-hud-action-fields"
                  routeOptions={routeOptions}
                  paletteVariant="hud"
                />
              </section>
            ))}
            <EditorButtonPreview
              backgroundTone={actionSettings.bgTone}
              buttons={[
                {
                  label: actionSettings.button1Label,
                  style: actionSettings.button1Style,
                  tone: actionSettings.button1Tone,
                },
                {
                  label: actionSettings.button2Label,
                  style: actionSettings.button2Style,
                  tone: actionSettings.button2Tone,
                },
              ]}
            />
          </div>
        </>
      ) : null}
      blockOptions={blockOptions}
    />
  );
}

export function BillboardBlockEditor({ block, onSettingChange, routeOptions = [], blockOptions = null, sourceRevision = 0 }) {
  const settings = block.settings || {};
  const billboardDraftSettings = useMemo(() => ({
    ...settings,
    buttonUrl: resolveSplitRouteLinkEditableHref(settings, 'buttonUrl', 'buttonPageRef'),
    button2Url: resolveSplitRouteLinkEditableHref(settings, 'button2Url', 'button2PageRef'),
  }), [settings]);
  const effectiveBillboardSettings = billboardDraftSettings;
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const justifyField = fieldById.get('justify') || null;
  const bodyJustifyField = fieldById.get('bodyJustify') || null;
  const buttonStyleField = fieldById.get('buttonStyle') || null;
  const buttonToneField = fieldById.get('buttonTone') || null;
  const button2StyleField = fieldById.get('button2Style') || null;
  const button2ToneField = fieldById.get('button2Tone') || null;
  const billboardBgTone = normalizePanelBgTone(effectiveBillboardSettings.bgTone);
  const billboardJustifyOptions = Array.isArray(justifyField?.options) && justifyField.options.length
    ? justifyField.options
    : [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ];
  const billboardJustify = normalizeJustifySelection(effectiveBillboardSettings.justify, billboardJustifyOptions);
  const billboardBodyJustifyOptions = Array.isArray(bodyJustifyField?.options) && bodyJustifyField.options.length
    ? bodyJustifyField.options
    : billboardJustifyOptions;
  const billboardBodyJustify = normalizeJustifySelection(
    effectiveBillboardSettings.bodyJustify || effectiveBillboardSettings.justify || 'center',
    billboardBodyJustifyOptions,
  );
  const billboardLineSpacing = normalizeBillboardLineSpacing(effectiveBillboardSettings.lineSpacing);
  const billboardHeaderGapRem = normalizeBillboardHeaderGap(effectiveBillboardSettings.headerGapRem);
  const billboardTitleFontFamily = normalizeBillboardTitleFontFamily(effectiveBillboardSettings.titleFontFamily);
  const billboardTitleFontWeight = normalizeBillboardTitleFontWeight(
    effectiveBillboardSettings.titleFontWeight,
    billboardTitleFontFamily,
  );
  const billboardTitleSizeRem = normalizeBillboardTitleSizeRem(effectiveBillboardSettings.titleSizeRem);
  const billboardTitleLetterSpacingEm = normalizeBillboardTitleLetterSpacingEm(
    effectiveBillboardSettings.titleLetterSpacingEm,
    billboardTitleFontFamily,
  );
  const billboardSubtitleSizeRem = normalizeBillboardSubtitleSizeRem(effectiveBillboardSettings.subtitleSizeRem);
  const billboardLeadCopySizeRem = normalizeBillboardLeadCopySizeRem(effectiveBillboardSettings.leadCopySizeRem);
  const billboardTextTone = normalizePanelTextTone(effectiveBillboardSettings.textTone, 'white');
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
    commitRouteLinkField,
    commitRouteLinkHref,
  } = useBufferedStringFieldDrafts({
    settings: billboardDraftSettings,
    onSettingChange,
    fieldIds: BILLBOARD_LOCAL_DRAFT_FIELD_IDS,
    routeFieldIdByFieldId: {
      buttonUrl: 'buttonPageRef',
      button2Url: 'button2PageRef',
    },
    routeOptions,
    sourceRevision,
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
      subtitleColor={extractHeroLineColorToken(String(effectiveBillboardSettings.subtitleClassName || '').trim())}
      onSubtitleColorChange={(nextValue) => onSettingChange(
        'subtitleClassName',
        replaceHeroLineColorClass(String(effectiveBillboardSettings.subtitleClassName || '').trim(), nextValue),
      )}
      subtitleColorOptions={HERO_SWATCH_OPTIONS}
      subtitleSizeRem={billboardSubtitleSizeRem}
      onSubtitleSizeRemChange={(nextValue) => onSettingChange('subtitleSizeRem', Number(nextValue))}
      body={String(draftValues.body || '')}
      onBodyChange={(nextValue) => updateDraftField('body', nextValue)}
      onBodyBlur={() => commitDraftOnBlur('body')}
      titleInputRef={billboardTitleInputRef}
      onTitleSelectionCapture={captureBillboardTitleSelection}
      titleSelection={billboardTitleSelection}
      titleColor={extractHeroLineColorToken(String(effectiveBillboardSettings.titleClassName || '').trim())}
      onTitleColorChange={(nextValue) => onSettingChange(
        'titleClassName',
        applyTextColorSelection({
          text: String(draftValues.title || ''),
          lineClassName: String(effectiveBillboardSettings.titleClassName || '').trim(),
          highlightsJson: effectiveBillboardSettings.titleHighlightsJson,
          selection: { start: 0, end: 0 },
          colorValue: nextValue,
        }).lineClassName,
      )}
      onTitleSelectionColorChange={(nextValue, selectedTitle = billboardTitleSelection) => {
        const currentTitle = String(draftValues.title || '');
        const result = applyTextColorSelection({
          text: currentTitle,
          lineClassName: String(effectiveBillboardSettings.titleClassName || '').trim(),
          highlightsJson: effectiveBillboardSettings.titleHighlightsJson,
          selection: selectedTitle,
          colorValue: nextValue,
        });
        if (result.target !== 'selection') {
          return;
        }
        onSettingChange(
          'titleHighlightsJson',
          result.highlightsJson,
        );
      }}
      titleColorOptions={HERO_SWATCH_OPTIONS}
      bodyHtml={String(draftValues.bodyHtml || '')}
      onBodyHtmlChange={(nextValue) => updateDraftField('bodyHtml', nextValue)}
      onBodyHtmlBlur={() => commitDraftOnBlur('bodyHtml')}
      bodyJustify={billboardBodyJustify}
      onBodyJustifyChange={(nextValue) => onSettingChange('bodyJustify', nextValue)}
      bodyJustifyOptions={billboardBodyJustifyOptions}
      bodyMaxWidthPx={effectiveBillboardSettings.bodyMaxWidthPx ?? null}
      onBodyMaxWidthPxChange={(nextValue) => onSettingChange(
        'bodyMaxWidthPx',
        nextValue == null || nextValue === '' ? '' : normalizeBillboardBodyWidth(nextValue),
      )}
      leadCopySizeRem={billboardLeadCopySizeRem}
      onLeadCopySizeRemChange={(nextValue) => onSettingChange('leadCopySizeRem', Number(nextValue))}
      bodyColorClassName={String(effectiveBillboardSettings.bodyColorClassName || resolvePanelTextToneClassName(billboardTextTone, 'white'))}
      onBodyColorChange={(nextValue) => onSettingChange('bodyColorClassName', nextValue)}
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
      onTitleFontWeightChange={(nextValue) => onSettingChange('titleFontWeight', Number(nextValue))}
      titleWeightOptions={[600, 700, 800, 900]}
      lineSpacing={billboardLineSpacing}
      onLineSpacingChange={(nextValue) => onSettingChange('lineSpacing', Number(nextValue))}
      headerGapRem={billboardHeaderGapRem}
      onHeaderGapRemChange={(nextValue) => onSettingChange('headerGapRem', normalizeBillboardHeaderGap(nextValue))}
      titleSizeRem={billboardTitleSizeRem}
      onTitleSizeRemChange={(nextValue) => onSettingChange('titleSizeRem', Number(nextValue))}
      titleLetterSpacingEm={billboardTitleLetterSpacingEm}
      onTitleLetterSpacingEmChange={(nextValue) => onSettingChange('titleLetterSpacingEm', Number(nextValue))}
      buttonLabel={String(draftValues.buttonLabel || '')}
      onButtonLabelChange={(nextValue) => updateDraftField('buttonLabel', nextValue)}
      onButtonLabelBlur={() => commitDraftOnBlur('buttonLabel')}
      buttonHref={String(draftValues.buttonUrl || '')}
      buttonRouteRef={resolveCanonicalRouteLinkRouteRef(effectiveBillboardSettings, 'buttonUrl', 'buttonPageRef')}
      onButtonHrefChange={(nextValue) => {
        commitRouteLinkHref('buttonUrl', nextValue);
      }}
      onButtonRouteLinkChange={(nextValue, nextRouteRefValue) => commitRouteLinkField(
        'buttonUrl',
        nextValue,
        nextRouteRefValue,
        resolveCanonicalRouteLinkOpenInNewWindow(effectiveBillboardSettings, 'buttonUrl', 'buttonPageRef'),
      )}
      buttonRouteOptions={routeOptions}
      buttonOpenInNewWindow={resolveCanonicalRouteLinkOpenInNewWindow(effectiveBillboardSettings, 'buttonUrl', 'buttonPageRef')}
      onButtonOpenInNewWindowChange={(nextValue) => commitCanonicalRouteLink(
        onSettingChange,
        'buttonUrl',
        'buttonPageRef',
        String(draftValues.buttonUrl || ''),
        resolveCanonicalRouteLinkRouteRef(effectiveBillboardSettings, 'buttonUrl', 'buttonPageRef'),
        nextValue,
      )}
      buttonStyle={String(effectiveBillboardSettings.buttonStyle || '').trim().toLowerCase() || 'blue'}
      onButtonStyleChange={(nextValue) => onSettingChange('buttonStyle', nextValue)}
      buttonStyleOptions={Array.isArray(buttonStyleField?.options) && buttonStyleField.options.length ? buttonStyleField.options : BILLBOARD_BUTTON_STYLE_OPTIONS}
      buttonTone={String(effectiveBillboardSettings.buttonTone || '').trim().toLowerCase() || 'atlantean'}
      onButtonToneChange={(nextValue) => onSettingChange('buttonTone', nextValue)}
      buttonToneOptions={Array.isArray(buttonToneField?.options) && buttonToneField.options.length ? buttonToneField.options : BILLBOARD_BUTTON_TONE_OPTIONS}
      button2Label={String(draftValues.button2Label || '')}
      onButton2LabelChange={(nextValue) => updateDraftField('button2Label', nextValue)}
      onButton2LabelBlur={() => commitDraftOnBlur('button2Label')}
      button2Href={String(draftValues.button2Url || '')}
      button2RouteRef={resolveCanonicalRouteLinkRouteRef(effectiveBillboardSettings, 'button2Url', 'button2PageRef')}
      onButton2HrefChange={(nextValue) => {
        commitRouteLinkHref('button2Url', nextValue);
      }}
      onButton2RouteLinkChange={(nextValue, nextRouteRefValue) => commitRouteLinkField(
        'button2Url',
        nextValue,
        nextRouteRefValue,
        resolveCanonicalRouteLinkOpenInNewWindow(effectiveBillboardSettings, 'button2Url', 'button2PageRef'),
      )}
      button2RouteOptions={routeOptions}
      button2OpenInNewWindow={resolveCanonicalRouteLinkOpenInNewWindow(effectiveBillboardSettings, 'button2Url', 'button2PageRef')}
      onButton2OpenInNewWindowChange={(nextValue) => commitCanonicalRouteLink(
        onSettingChange,
        'button2Url',
        'button2PageRef',
        String(draftValues.button2Url || ''),
        resolveCanonicalRouteLinkRouteRef(effectiveBillboardSettings, 'button2Url', 'button2PageRef'),
        nextValue,
      )}
      button2Style={String(effectiveBillboardSettings.button2Style || '').trim().toLowerCase() || 'outline'}
      onButton2StyleChange={(nextValue) => onSettingChange('button2Style', nextValue)}
      button2StyleOptions={Array.isArray(button2StyleField?.options) && button2StyleField.options.length ? button2StyleField.options : BILLBOARD_BUTTON_STYLE_OPTIONS}
      button2Tone={String(effectiveBillboardSettings.button2Tone || '').trim().toLowerCase() || 'white'}
      onButton2ToneChange={(nextValue) => onSettingChange('button2Tone', nextValue)}
      button2ToneOptions={Array.isArray(button2ToneField?.options) && button2ToneField.options.length ? button2ToneField.options : BILLBOARD_BUTTON_TONE_OPTIONS}
      contentMaxWidthPx={effectiveBillboardSettings.contentMaxWidthPx ?? null}
      onContentMaxWidthPxChange={(nextValue) => onSettingChange('contentMaxWidthPx', nextValue == null || nextValue === '' ? '' : normalizeBillboardWidth(nextValue))}
      paddingTopRem={effectiveBillboardSettings.paddingTopRem ?? null}
      onPaddingTopRemChange={(nextValue) => onSettingChange('paddingTopRem', normalizeBillboardPadding(nextValue))}
      paddingBottomRem={effectiveBillboardSettings.paddingBottomRem ?? null}
      onPaddingBottomRemChange={(nextValue) => onSettingChange('paddingBottomRem', normalizeBillboardPadding(nextValue))}
      backgroundEffectsJson={effectiveBillboardSettings.backgroundEffectsJson}
      onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
      blockOptions={blockOptions}
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

function readEditorLocalDrafts(settings = {}, fieldIds = [], routeFieldIdByFieldId = {}, routeLinkFieldByFieldId = {}) {
  return (Array.isArray(fieldIds) ? fieldIds : []).reduce((drafts, fieldId) => {
    const routeRefFieldId = routeFieldIdByFieldId[fieldId];
    const routeLinkField = routeLinkFieldByFieldId[fieldId];
    drafts[fieldId] = routeLinkField
      ? resolveCanonicalRouteLinkEditableHref(settings, routeLinkField, routeRefFieldId)
      : String(settings?.[fieldId] || '');
    return drafts;
  }, {});
}

function readEditorRouteRefDrafts(settings = {}, routeFieldIdByFieldId = {}, routeLinkFieldByFieldId = {}) {
  return Object.entries(routeFieldIdByFieldId || {}).reduce((drafts, [fieldId, routeRefFieldId]) => {
    drafts[fieldId] = resolveCanonicalRouteLinkRouteRef(settings, routeLinkFieldByFieldId[fieldId] || fieldId, routeRefFieldId);
    return drafts;
  }, {});
}

function isBufferedDraftField(field, explicitDraftFieldIds) {
  const fieldId = String(field?.id || '').trim();
  if (!fieldId || explicitDraftFieldIds.has(fieldId)) {
    return Boolean(fieldId);
  }
  if (field?.type !== 'route_link') {
    return false;
  }
  const meta = resolveRouteLinkFieldMeta(field);
  return [...meta.legacyHrefFieldIds, ...meta.routeRefFieldIds]
    .some((aliasFieldId) => explicitDraftFieldIds.has(aliasFieldId));
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
  routeLinkFieldByFieldId = {},
  routeOptions = [],
  sourceRevision = 0,
}) {
  const contentAdmin = useOptionalContentAdmin();
  const effectiveSourceRevision = sourceRevision || contentAdmin?.sharedSnapshotUpdatedAt || 0;
  const normalizedFieldIds = useMemo(
    () => (Array.isArray(fieldIds) ? fieldIds.map((fieldId) => String(fieldId || '').trim()).filter(Boolean) : []),
    [fieldIds],
  );
  const normalizedRouteOptions = useMemo(
    () => sortPages(Array.isArray(routeOptions) ? routeOptions : []),
    [routeOptions],
  );
  const [draftValues, setDraftValues] = useState(() => readEditorLocalDrafts(settings, normalizedFieldIds, routeFieldIdByFieldId, routeLinkFieldByFieldId));
  const [routeRefDraftValues, setRouteRefDraftValues] = useState(() => (
    readEditorRouteRefDrafts(settings, routeFieldIdByFieldId, routeLinkFieldByFieldId)
  ));
  const [dirtyFieldIds, setDirtyFieldIds] = useState([]);
  const commitTimersRef = useRef(new Map());
  const protectedDraftValuesRef = useRef(new Map());
  const latestSourceRevisionRef = useRef(normalizeEditorDraftRevision(effectiveSourceRevision));
  const draftValuesRef = useRef(draftValues);
  const externalDraftValues = useMemo(
    () => readEditorLocalDrafts(settings, normalizedFieldIds, routeFieldIdByFieldId, routeLinkFieldByFieldId),
    [normalizedFieldIds, routeFieldIdByFieldId, routeLinkFieldByFieldId, settings],
  );
  const externalRouteRefValues = useMemo(
    () => readEditorRouteRefDrafts(settings, routeFieldIdByFieldId, routeLinkFieldByFieldId),
    [routeFieldIdByFieldId, routeLinkFieldByFieldId, settings],
  );

  useEffect(() => () => {
    commitTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    commitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    draftValuesRef.current = draftValues;
  }, [draftValues]);

  useEffect(() => {
    latestSourceRevisionRef.current = Math.max(
      latestSourceRevisionRef.current,
      normalizeEditorDraftRevision(effectiveSourceRevision),
    );
  }, [effectiveSourceRevision]);

  useEffect(() => {
    const activeFieldIds = new Set(normalizedFieldIds);
    protectedDraftValuesRef.current.forEach((_, fieldId) => {
      if (!activeFieldIds.has(fieldId)) {
        protectedDraftValuesRef.current.delete(fieldId);
      }
    });
  }, [normalizedFieldIds]);

  useEffect(() => {
    const normalizedSourceRevision = normalizeEditorDraftRevision(effectiveSourceRevision);
    if (isOlderEditorDraftRevision(normalizedSourceRevision, latestSourceRevisionRef.current)) {
      return;
    }
    setDraftValues((current) => {
      let changed = false;
      const next = { ...current };
      normalizedFieldIds.forEach((fieldId) => {
        const externalValue = externalDraftValues[fieldId];
        const protectedDraft = protectedDraftValuesRef.current.get(fieldId);
        if (protectedDraft) {
          if (shouldKeepProtectedEditorDraft(protectedDraft, normalizedSourceRevision)) {
            return;
          }
          protectedDraftValuesRef.current.delete(fieldId);
        }
        if (dirtyFieldIds.includes(fieldId)) {
          return;
        }
        if (current[fieldId] === externalValue) {
          return;
        }
        next[fieldId] = externalValue;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [dirtyFieldIds, externalDraftValues, normalizedFieldIds, effectiveSourceRevision]);

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

    protectedDraftValuesRef.current.set(
      fieldId,
      createProtectedEditorDraft(nextValue, effectiveSourceRevision),
    );
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
    protectedDraftValuesRef.current.set(
      fieldId,
      createProtectedEditorDraft(nextValue, effectiveSourceRevision),
    );
    draftValuesRef.current = {
      ...draftValuesRef.current,
      [fieldId]: nextValue,
    };
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
    commitDraftField(fieldId, draftValuesRef.current[fieldId] ?? '');
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const flushDrafts = () => {
      dirtyFieldIds.forEach((fieldId) => {
        commitDraftField(fieldId, draftValuesRef.current[fieldId] ?? '');
      });
    };
    window.addEventListener(EDITOR_DRAFT_FLUSH_EVENT, flushDrafts);
    return () => window.removeEventListener(EDITOR_DRAFT_FLUSH_EVENT, flushDrafts);
  }, [dirtyFieldIds]);

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
      protectedDraftValuesRef.current.set(
        fieldId,
        createProtectedEditorDraft(matchedPage.path, effectiveSourceRevision),
      );
      draftValuesRef.current = {
        ...draftValuesRef.current,
        [fieldId]: matchedPage.path,
      };
      setDraftValues((current) => (
        current[fieldId] === matchedPage.path
          ? current
          : { ...current, [fieldId]: matchedPage.path }
      ));
      setDirtyFieldIds((current) => (current.includes(fieldId) ? current : [...current, fieldId]));
      scheduleDraftCommit(fieldId, matchedPage.path, { skipRouteRefSync: true });
    }
  };

  const commitRouteLinkField = (fieldId, nextValue, nextRouteRefValue, nextOpenInNewWindowValue = false) => {
    const routeRefFieldId = routeFieldIdByFieldId[fieldId];
    const routeLinkField = routeLinkFieldByFieldId[fieldId] || fieldId;
    const timerId = commitTimersRef.current.get(fieldId);
    if (timerId) {
      window.clearTimeout(timerId);
      commitTimersRef.current.delete(fieldId);
    }

    protectedDraftValuesRef.current.set(
      fieldId,
      createProtectedEditorDraft(nextValue, effectiveSourceRevision),
    );
    draftValuesRef.current = {
      ...draftValuesRef.current,
      [fieldId]: nextValue,
    };
    setDraftValues((current) => (
      current[fieldId] === nextValue
        ? current
        : { ...current, [fieldId]: nextValue }
    ));
    setRouteRefDraftValues((current) => (
      current[fieldId] === nextRouteRefValue
        ? current
        : { ...current, [fieldId]: nextRouteRefValue }
    ));
    setDirtyFieldIds((current) => (current.includes(fieldId) ? current : [...current, fieldId]));
    commitCanonicalRouteLink(onSettingChange, routeLinkField, routeRefFieldId, nextValue, nextRouteRefValue, nextOpenInNewWindowValue);
  };

  const commitRouteLinkHref = (fieldId, nextValue) => {
    const exactPage = normalizedRouteOptions.find((page) => page.path === String(nextValue || '').trim());
    commitRouteLinkField(fieldId, nextValue, exactPage ? toManagedPageLinkRef(exactPage) : '');
  };

  return {
    draftValues,
    routeRefDraftValues,
    updateDraftField,
    commitDraftOnBlur,
    handleRouteRefChange,
    commitRouteLinkField,
    commitRouteLinkHref,
  };
}

function DraftBackedFieldControlGrid({
  fields,
  settings,
  onSettingChange,
  className = '',
  hideLabels = false,
  routeOptions = [],
  draftFieldIds = [],
  paletteVariant = 'admin',
  commitImmediately = false,
  sourceRevision = 0,
}) {
  const items = Array.isArray(fields) ? fields.filter(Boolean) : [];
  const explicitDraftFieldIds = new Set(
    (Array.isArray(draftFieldIds) ? draftFieldIds : [])
      .map((fieldId) => String(fieldId || '').trim())
      .filter(Boolean),
  );
  const draftedFields = items.filter((field) => (
    ['text', 'textarea', 'route_link'].includes(String(field?.type || '').trim().toLowerCase())
    && isBufferedDraftField(field, explicitDraftFieldIds)
  ));
  const draftedFieldIds = draftedFields.map((field) => String(field.id || '').trim());
  const routeFieldIdByFieldId = draftedFields.reduce((accumulator, field) => {
    if (field?.type === 'route_link' && field.routeRefFieldId) {
      accumulator[field.id] = String(field.routeRefFieldId || '').trim();
    }
    return accumulator;
  }, {});
  const routeLinkFieldByFieldId = draftedFields.reduce((accumulator, field) => {
    if (field?.type === 'route_link') {
      accumulator[field.id] = field;
    }
    return accumulator;
  }, {});
  const {
    draftValues,
    routeRefDraftValues,
    updateDraftField,
    commitDraftOnBlur,
    commitRouteLinkField,
  } = useBufferedStringFieldDrafts({
    settings,
    onSettingChange,
    fieldIds: draftedFieldIds,
    routeFieldIdByFieldId,
    routeLinkFieldByFieldId,
    routeOptions,
    sourceRevision,
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
          <label
            key={field.id}
            className={field.layout === 'half' ? 'is-half' : undefined}
            data-editor-field-id={field.id}
          >
            <span className={hideLabels ? 'admin-sr-only' : undefined}>{field.label}</span>
            {isDrafted ? (
              field.type === 'route_link' ? (
                <SharedRouteLinkField
                  inputLabel={field.label || 'URL / Path'}
                  value={draftValues[fieldId] ?? ''}
                  routeRefValue={field.routeRefFieldId ? routeRefDraftValues[fieldId] ?? '' : ''}
                  openInNewWindowValue={resolveCanonicalRouteLinkOpenInNewWindow(settings, field)}
                  openInNewWindowLabel={field.openInNewWindowLabel || 'Open in new window'}
                  onChange={(nextValue) => updateDraftField(fieldId, nextValue, { commitImmediately })}
                  onRouteLinkChange={(nextValue, nextRouteRefValue) => {
                    commitRouteLinkField(fieldId, nextValue, nextRouteRefValue, resolveCanonicalRouteLinkOpenInNewWindow(settings, field));
                  }}
                  onOpenInNewWindowChange={(nextOpenInNewWindowValue) => {
                    commitRouteLinkField(
                      fieldId,
                      draftValues[fieldId] ?? '',
                      routeRefDraftValues[fieldId] ?? '',
                      nextOpenInNewWindowValue,
                    );
                  }}
                  routeOptions={routeOptions}
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  rows={field.rows || 4}
                  value={draftValues[fieldId] ?? ''}
                  placeholder={field.placeholder || undefined}
                  onChange={(event) => updateDraftField(fieldId, event.target.value, { commitImmediately })}
                  onBlur={() => commitDraftOnBlur(fieldId)}
                />
              ) : (
                <input
                  type="text"
                  value={draftValues[fieldId] ?? ''}
                  placeholder={field.placeholder || undefined}
                  onChange={(event) => updateDraftField(fieldId, event.target.value, { commitImmediately })}
                  onBlur={() => commitDraftOnBlur(fieldId)}
                />
              )
            ) : renderFieldControl(
              field,
              field.id === 'cardBulletSizeRem' && settings?.[field.id] == null
                ? (Number.isFinite(Number(settings?.cardBulletSize))
                  ? Number(settings.cardBulletSize)
                  : DEFAULT_DYNAMIC_GRID_CARD_BULLET_SIZE_REM)
                : field.id === 'cardBulletLineHeight'
                  && (!Number.isFinite(Number(settings?.[field.id])) || Number(settings[field.id]) < 1.1)
                  ? DEFAULT_DYNAMIC_GRID_CARD_BULLET_LINE_HEIGHT
                  : (settings?.[field.id] ?? field.defaultValue),
              (nextValue) => {
                onSettingChange(field.id, nextValue);
              },
              settings,
              onSettingChange,
              routeOptions,
              paletteVariant,
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
  hideLabel = false,
  routeRefValue = '',
  openInNewWindowValue = false,
  showOpenInNewWindow = true,
  onRouteRefChange,
  onRouteLinkChange,
  onOpenInNewWindowChange,
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
      <SharedRouteLinkField
        inputLabel={field.label || 'URL / Path'}
        value={value}
        routeRefValue={routeRefValue}
        openInNewWindowValue={openInNewWindowValue}
        showOpenInNewWindow={showOpenInNewWindow}
        openInNewWindowLabel={field.openInNewWindowLabel || 'Open in new window'}
        onChange={onChange}
        onRouteRefChange={onRouteRefChange}
        onRouteLinkChange={onRouteLinkChange}
        onOpenInNewWindowChange={onOpenInNewWindowChange}
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
      <span className={hideLabel ? 'admin-sr-only' : undefined}>{field.label}</span>
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
  sourceRevision = 0,
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
          sourceRevision={sourceRevision}
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
          sourceRevision={sourceRevision}
        />
      </section>
    </div>
  );
}

export function FeaturePanelBlockEditor({ block, onSettingChange, routeOptions = [], sourceRevision = 0 }) {
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const contentFields = [
    fieldById.get('title'),
    fieldById.get('bodyHtml'),
    fieldById.get('body'),
  ].filter(Boolean);
  const actionFields = buildInlineActionFields({
    fieldById,
    labelFieldId: 'buttonLabel',
    hrefFieldId: 'buttonUrl',
    routeRefFieldId: 'buttonPageRef',
    openInNewWindowFieldId: 'buttonOpenInNewWindow',
  });
  const placementFields = [
    fieldById.get('anchorId'),
    fieldById.get('sectionClassName'),
    fieldById.get('fullBleed'),
  ].filter(Boolean);
  const draftFieldIds = ['title', 'bodyHtml', 'body', 'buttonLabel', 'buttonUrl', 'buttonPageRef', 'buttonOpenInNewWindow'];

  return (
    <div className="admin-cta-field-slots">
      <section className="admin-cta-field-slot-card">
        <h4>Content</h4>
        <DraftBackedFieldControlGrid
          fields={contentFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={draftFieldIds}
          sourceRevision={sourceRevision}
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
          draftFieldIds={draftFieldIds}
          sourceRevision={sourceRevision}
        />
      </section>
      <section className="admin-cta-field-slot-card">
        <h4>Placement</h4>
        <DraftBackedFieldControlGrid
          fields={placementFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={[]}
          sourceRevision={sourceRevision}
        />
      </section>
    </div>
  );
}

export function SiteFeatureBlockEditor({ block, onSettingChange, routeOptions = [], sourceRevision = 0 }) {
  const contentAdmin = useOptionalContentAdmin();
  const effectiveSourceRevision = sourceRevision || contentAdmin?.sharedSnapshotUpdatedAt || 0;
  const settings = block.settings || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const featureEntry = resolveSiteFeatureCatalogEntry(settings.featureId);
  const allowedFieldIds = new Set(getAllowedSiteFeatureEditableFieldIds(settings.featureId));
  const featureRuntime = typeof featureEntry?.buildRuntime === 'function'
    ? featureEntry.buildRuntime({ settings }) || {}
    : {};
  const collectionModel = getSiteFeatureCollectionModel(settings.featureId);
  const collectionFieldId = collectionModel?.fieldId || '';
  const collectionFallbackItems = collectionModel
    ? featureRuntime.panels || featureRuntime.metrics || featureRuntime.cards || featureRuntime.beats || []
    : [];
  const featureIntroDefaults = (() => {
    if (settings.featureId !== 'impact_proof_story') {
      return {};
    }
    try {
      const parsed = typeof settings.featureIntroJson === 'string'
        ? JSON.parse(settings.featureIntroJson)
        : settings.featureIntroJson;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  })();
  const featureIdField = fieldById.get('featureId');
  const headlineField = fieldById.get('headline');
  const bodyField = fieldById.get('body');
  const collectionField = fieldById.get(collectionFieldId);
  const introFields = [
    fieldById.get('introHeading'),
    fieldById.get('introBody'),
    fieldById.get('introEmphasis'),
  ].filter(Boolean);
  const buttonLabelField = fieldById.get('buttonLabel');
  const buttonUrlField = getPromotedRouteLinkField(fieldById, 'buttonUrl', 'buttonPageRef');
  const allowsActionOverrides = SITE_FEATURE_ACTION_FIELD_IDS.some((fieldId) => allowedFieldIds.has(fieldId));
  const historyGalleryFields = [
    fieldById.get('cardTitleSizeRem'),
    fieldById.get('cardTitleLineHeight'),
    fieldById.get('cardBodySizeRem'),
    fieldById.get('cardBodyLineHeight'),
    fieldById.get('titleTone'),
    fieldById.get('bodyTone'),
  ].filter((field) => field && allowedFieldIds.has(field.id));
  const [draftValues, setDraftValues] = useState(() => readEditorLocalDrafts(settings, SITE_FEATURE_LOCAL_DRAFT_FIELD_IDS));
  const [dirtyFieldIds, setDirtyFieldIds] = useState([]);
  const commitTimersRef = useRef(new Map());
  const protectedDraftValuesRef = useRef(new Map());
  const latestSourceRevisionRef = useRef(normalizeEditorDraftRevision(effectiveSourceRevision));
  const externalDraftValues = useMemo(
    () => readEditorLocalDrafts(settings, SITE_FEATURE_LOCAL_DRAFT_FIELD_IDS),
    [settings],
  );

  useEffect(() => () => {
    commitTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    commitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    latestSourceRevisionRef.current = Math.max(
      latestSourceRevisionRef.current,
      normalizeEditorDraftRevision(effectiveSourceRevision),
    );
  }, [effectiveSourceRevision]);

  useEffect(() => {
    const normalizedSourceRevision = normalizeEditorDraftRevision(effectiveSourceRevision);
    if (isOlderEditorDraftRevision(normalizedSourceRevision, latestSourceRevisionRef.current)) {
      return;
    }
    setDraftValues((current) => {
      let changed = false;
      const next = { ...current };
      SITE_FEATURE_LOCAL_DRAFT_FIELD_IDS.forEach((fieldId) => {
        if (dirtyFieldIds.includes(fieldId)) {
          return;
        }
        const externalValue = externalDraftValues[fieldId];
        const protectedDraft = protectedDraftValuesRef.current.get(fieldId);
        if (protectedDraft) {
          if (shouldKeepProtectedEditorDraft(protectedDraft, normalizedSourceRevision)) {
            return;
          }
          protectedDraftValuesRef.current.delete(fieldId);
        }
        if (current[fieldId] === externalValue) {
          return;
        }
        next[fieldId] = externalValue;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [dirtyFieldIds, externalDraftValues, effectiveSourceRevision]);

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

    protectedDraftValuesRef.current.set(
      fieldId,
      createProtectedEditorDraft(nextValue, effectiveSourceRevision),
    );
    onSettingChange(fieldId, nextValue);
  };

  const commitButtonRouteLink = (nextValue, nextRouteRefValue) => {
    const timerId = commitTimersRef.current.get('buttonUrl');
    if (timerId) {
      window.clearTimeout(timerId);
      commitTimersRef.current.delete('buttonUrl');
    }
    setDraftValues((current) => (
      current.buttonUrl === nextValue
        ? current
        : { ...current, buttonUrl: nextValue }
    ));
    setDirtyFieldIds((current) => (current.includes('buttonUrl') ? current : [...current, 'buttonUrl']));
    protectedDraftValuesRef.current.set(
      'buttonUrl',
      createProtectedEditorDraft(nextValue, effectiveSourceRevision),
    );
    commitCanonicalRouteLink(
      onSettingChange,
      buttonUrlField || 'buttonUrl',
      'buttonPageRef',
      nextValue,
      nextRouteRefValue,
      resolveCanonicalRouteLinkOpenInNewWindow(settings, buttonUrlField || 'buttonUrl', 'buttonPageRef'),
    );
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
    protectedDraftValuesRef.current.set(
      fieldId,
      createProtectedEditorDraft(nextValue, effectiveSourceRevision),
    );
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const flushDrafts = () => {
      dirtyFieldIds.forEach((fieldId) => {
        commitDraftField(fieldId, draftValues[fieldId] ?? '');
      });
    };
    window.addEventListener(EDITOR_DRAFT_FLUSH_EVENT, flushDrafts);
    return () => window.removeEventListener(EDITOR_DRAFT_FLUSH_EVENT, flushDrafts);
  }, [dirtyFieldIds, draftValues]);

  return (
    <div className="admin-cta-field-slots admin-site-feature-editor">
      <section className="admin-cta-field-slot-card admin-site-feature-editor-page admin-site-feature-editor-page--feature">
        <h4>{featureEntry?.label ? `${featureEntry.label} overrides` : 'Feature overrides'}</h4>
        {featureIdField && allowedFieldIds.has('featureId') ? (
          <FieldControlGrid
            fields={[featureIdField]}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            hideLabels
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
      {settings.featureId === 'about_history_feature' && historyGalleryFields.length ? (
        <section className="admin-cta-field-slot-card admin-site-feature-editor-page admin-site-feature-editor-page--gallery">
          <h4>History Gallery presentation</h4>
          <FieldControlGrid
            fields={historyGalleryFields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline"
            routeOptions={routeOptions}
          />
        </section>
      ) : null}
      {collectionField && allowedFieldIds.has(collectionFieldId) ? (
        <SiteFeatureCollectionEditor
          featureId={settings.featureId}
          value={draftValues[collectionFieldId] ?? ''}
          fallbackItems={collectionFallbackItems}
          onChange={(nextValue) => updateDraftField(collectionFieldId, nextValue)}
          className="admin-site-feature-editor-page admin-site-feature-editor-page--panels"
        />
      ) : null}
      {settings.featureId === 'impact_proof_story' && introFields.length ? (
        <section className="admin-cta-field-slot-card admin-site-feature-editor-page admin-site-feature-editor-page--feature">
          <h4>Impact story introduction</h4>
          <div className="admin-site-feature-field-stack">
            {introFields.map((field) => (
              <SiteFeatureDraftField
                key={field.id}
                field={field}
                value={draftValues[field.id] ?? featureIntroDefaults[{
                  introHeading: 'heading',
                  introBody: 'body',
                  introEmphasis: 'emphasis',
                }[field.id]] ?? ''}
                onChange={(nextValue) => updateDraftField(field.id, nextValue)}
                onBlur={() => commitDraftOnBlur(field.id)}
                fullWidth
              />
            ))}
          </div>
        </section>
      ) : null}
      {allowsActionOverrides ? (
        <section className="admin-cta-field-slot-card admin-site-feature-editor-page admin-site-feature-editor-page--action">
          <h4>Optional CTA override</h4>
          <div className="admin-site-feature-field-stack">
            {buttonLabelField && allowedFieldIds.has('buttonLabel') ? (
              <SiteFeatureDraftField
                field={buttonLabelField}
                value={draftValues.buttonLabel}
                onChange={(nextValue) => updateDraftField('buttonLabel', nextValue)}
                onBlur={() => commitDraftOnBlur('buttonLabel')}
                hideLabel
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
                routeRefValue={resolveCanonicalRouteLinkRouteRef(settings, buttonUrlField || 'buttonUrl', 'buttonPageRef')}
                openInNewWindowValue={resolveCanonicalRouteLinkOpenInNewWindow(settings, buttonUrlField || 'buttonUrl', 'buttonPageRef')}
                showOpenInNewWindow={allowedFieldIds.has('buttonOpenInNewWindow')}
                onChange={(nextValue) => updateDraftField('buttonUrl', nextValue)}
                onRouteLinkChange={commitButtonRouteLink}
                onOpenInNewWindowChange={(nextOpenInNewWindowValue) => {
                  commitCanonicalRouteLink(
                    onSettingChange,
                    buttonUrlField || 'buttonUrl',
                    'buttonPageRef',
                    draftValues.buttonUrl,
                    resolveCanonicalRouteLinkRouteRef(settings, buttonUrlField || 'buttonUrl', 'buttonPageRef'),
                    nextOpenInNewWindowValue,
                  );
                }}
                routeOptions={routeOptions}
                fullWidth
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
    'presentation',
    'leftTone',
    'rightTone',
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
      <section className="admin-cta-field-slot-card">
        <h4>Presentation</h4>
        <DraftBackedFieldControlGrid
          fields={[
            fieldById.get('presentation'),
            fieldById.get('leftTone'),
            fieldById.get('rightTone'),
          ].filter(Boolean)}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline"
          routeOptions={routeOptions}
          draftFieldIds={splitPanelDraftFieldIds}
        />
      </section>
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
    <div className="admin-cta-field-slots admin-impact-stat-hud-editor">
      <section className="admin-cta-field-slot-card admin-impact-stat-hud-page admin-impact-stat-hud-page--content">
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
      <section className="admin-cta-field-slot-card admin-impact-stat-hud-page admin-impact-stat-hud-page--action">
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
        <section key={`impact-stat-${slot}`} className={`admin-cta-field-slot-card admin-impact-stat-hud-page admin-impact-stat-hud-page--stat-${slot}`}>
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

export function GridBlockEditor({ block, onSettingChange, routeOptions = [], hudMode = false }) {
  const documentsContext = useContext(DocumentsContext);
  const documents = Array.isArray(documentsContext?.documents) ? documentsContext.documents : [];
  const settings = block.settings || {};
  const isCgaAssetsGrid = String(settings.sectionClassName || '')
    .split(/\s+/)
    .includes('legacy-child-native-cga-assets');
  const isInsuranceCoverageGrid = String(settings.sectionClassName || '')
    .split(/\s+/)
    .includes('insurance-native-coverage');
  const isPlannedGivingBulletGrid = isCgaAssetsGrid
    || String(settings.sectionClassName || '').split(/\s+/).includes('legacy-child-native-assets')
    || String(settings.sectionClassName || '').split(/\s+/).includes('legacy-giving-types')
    || String(settings.sectionClassName || '').split(/\s+/).includes('legacy-child-native-trusts-differences')
    || normalizeGridCardStyleToken(settings.cardStyle) === 'planned-giving-centered';
  const hasCardBulletContent = Array.from({ length: 8 }, (_, index) => index + 1).some((slot) => (
    parseGridBulletList(settings[`card${slot}ListJson`]).some(Boolean)
    || /<li\b/i.test(String(settings[`card${slot}Body`] || settings[`card${slot}BodyHtml`] || ''))
  ));
  const showBulletTypography = isPlannedGivingBulletGrid || hasCardBulletContent;
  const presetDefinition = resolveBlockPresetDefinition(block);
  const presetEditor = presetDefinition?.editor || {};
  const presetCardFeatures = presetEditor?.cardFeatures || {};
  const allFields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const bgToneField = fieldById.get('bgTone') || null;
  const headerSizeField = fieldById.get('headerSizeRem') || null;
  const headerWidthField = fieldById.get('headerWidthPercent') || null;
  const headerSubheadSpaceField = fieldById.get('headerSubheadSpaceRem') || null;
  const headerCardsSpaceField = fieldById.get('headerCardsSpaceRem') || null;
  const titleToneFieldBase = fieldById.get('titleTone') || null;
  const bodyToneFieldBase = fieldById.get('bodyTone') || null;
  const subheadSizeField = fieldById.get('subheadSizeRem') || null;
  const cardStyleFieldBase = fieldById.get('cardStyle') || null;
  const cardHoverScaleField = isInsuranceCoverageGrid
    ? (fieldById.get('cardHoverScale') || null)
    : null;
  const gridBgTone = normalizeGridBgTone(settings.bgTone);
  // Color controls are authored independently. Changing the section surface
  // must not hide or rewrite the title/body color choices.
  const titleToneField = titleToneFieldBase;
  const bodyToneField = bodyToneFieldBase;
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
  const hasExplicitCardCount = Number.isFinite(Number(settings.cardCount))
    && Number(settings.cardCount) >= 1;
  const inferredCardCount = Array.from({ length: 8 }, (_, index) => index + 1)
    .filter((slot) => hasGridCardSettings(settings, slot))
    .pop() || 1;
  const layoutSettings = {
    ...settings,
    ...(!hasExplicitCardCount ? { cardCount: String(inferredCardCount) } : {}),
    ...(!Object.prototype.hasOwnProperty.call(settings, 'cardOutline')
      ? {
          cardOutline: typeof presetDefinition?.defaults?.cardOutline === 'boolean'
            ? presetDefinition.defaults.cardOutline
            : !['none', 'borderless-shadow'].includes(normalizeGridCardStyleToken(settings.cardStyle)),
        }
      : {}),
    ...(!Object.prototype.hasOwnProperty.call(settings, 'cardShadow')
      ? {
          cardShadow: typeof presetDefinition?.defaults?.cardShadow === 'boolean'
            ? presetDefinition.defaults.cardShadow
            : ['card1', 'card3', 'card4', 'borderless-shadow'].includes(normalizeGridCardStyleToken(settings.cardStyle)),
        }
      : {}),
    ...(
      isInsuranceCoverageGrid
      && !Object.prototype.hasOwnProperty.call(settings, 'cardHoverScale')
        ? { cardHoverScale: true }
        : {}
    ),
  };
  const allowedLayoutFieldIds = new Set(
    Array.isArray(presetEditor.layoutFieldIds) && presetEditor.layoutFieldIds.length
      ? presetEditor.layoutFieldIds
      : ['contentWidth', 'columns', 'cardStyle'],
  );
  if (fieldById.has('cardCount')) {
    allowedLayoutFieldIds.add('cardCount');
  }
  if (fieldById.has('cardOutline')) {
    allowedLayoutFieldIds.add('cardOutline');
  }
  if (fieldById.has('cardShadow')) {
    allowedLayoutFieldIds.add('cardShadow');
  }
  if (isInsuranceCoverageGrid && fieldById.has('cardHoverScale')) {
    allowedLayoutFieldIds.add('cardHoverScale');
  }
  const showTypographyFields = presetEditor.typographyFields !== false;
  const presetMaxCards = Number.isInteger(presetEditor.maxCards)
    ? Math.max(1, Math.min(8, presetEditor.maxCards))
    : 8;
  const appearanceFields = [titleToneField, bodyToneField]
    .filter(Boolean)
    .map((field) => ({
      ...field,
      label: field.id === 'titleTone'
        ? 'Card title color'
        : field.id === 'bodyTone'
          ? 'Card body color'
          : 'Grid background',
      compact: true,
      iconOnly: true,
      swatchClassName: 'admin-button-tone-swatch-list',
    }));
  const layoutFields = [
    fieldById.get('contentWidth'),
    fieldById.get('columns'),
    cardStyleField,
    fieldById.get('cardOutline'),
    fieldById.get('cardShadow'),
    cardHoverScaleField,
    fieldById.get('cardCount'),
  ].filter((field) => field && allowedLayoutFieldIds.has(field.id));
  const introPreviewText = buildCardGridIntroHtml(settings)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  const hasHeaderSubhead = Boolean(String(settings.subtitle || '').trim() || introPreviewText);
  const headerSubheadSpacingField = hasHeaderSubhead && headerSubheadSpaceField
    ? headerSubheadSpaceField
    : null;
  const headerCardsSpacingField = headerCardsSpaceField
    ? {
        ...headerCardsSpaceField,
        label: hasHeaderSubhead ? 'Space below subhead' : 'Space below header',
      }
    : null;
  const spacingFields = [
    fieldById.get('paddingTopRem'),
    fieldById.get('paddingBottomRem'),
    headerSubheadSpacingField,
    headerCardsSpacingField,
  ].filter(Boolean);
  const headerControlFields = [headerSizeField, headerWidthField, subheadSizeField, ...spacingFields].filter(Boolean);
  const cardTypographyFields = [
    fieldById.get('cardPaddingRem'),
    fieldById.get('cardTitleSizeRem'),
    fieldById.get('cardTitleLineHeight'),
    fieldById.get('cardBodySizeRem')
      ? {
          ...fieldById.get('cardBodySizeRem'),
          label: isPlannedGivingBulletGrid ? 'Card copy size (rem)' : fieldById.get('cardBodySizeRem').label,
        }
      : null,
    fieldById.get('cardBodyLineHeight'),
  ].filter(Boolean);
  const bulletTypographyFields = [
    fieldById.get('cardBulletSizeRem'),
    fieldById.get('cardBulletLineHeight'),
  ].filter(Boolean);
  const allCardTypographyFields = [
    ...cardTypographyFields,
    ...(showBulletTypography ? bulletTypographyFields : []),
  ].map((field) => ({
    ...field,
    type: 'range',
    suffix: ['cardTitleLineHeight', 'cardBodyLineHeight', 'cardBulletLineHeight'].includes(field.id) ? '' : field.suffix,
  }));
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

  const handleGridBackgroundChange = (nextBgToneRaw) => {
    const nextBgTone = normalizeGridBgTone(nextBgToneRaw);
    onSettingChange('bgTone', nextBgTone);
  };

  const cardSlots = useMemo(() => (
    Array.from({ length: 8 }, (_, index) => index + 1)
      .map((slot) => {
        const title = String(settings[`card${slot}Title`] || '').trim();
        const body = String(settings[`card${slot}Body`] || '').trim();
        const fineprint = String(settings[`card${slot}Fineprint`] || '').trim();
        const bulletList = parseGridBulletList(settings[`card${slot}ListJson`]);
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
          kicker: presetId === 'services-directory' ? `Service ${slot}` : `Card ${slot}`,
          title,
          fallbackTitle: title || `${presetId === 'services-directory' ? 'New service' : 'New card'} ${slot}`,
          summary: summarizeProgressiveSlot([
            body ? 'Body' : '',
            fineprint ? 'Fineprint' : '',
            bulletList.filter(Boolean).length ? `${bulletList.filter(Boolean).length} bullets` : '',
            linkCount ? `${linkCount} direct links` : '',
            accordionCount ? `${accordionCount} accordion groups` : '',
          ]),
            isExisting: hasGridCardSettings(settings, slot),
          fields: [
            fieldById.get(`card${slot}Title`),
            fieldById.get(`card${slot}TitleClassName`),
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
          showActions: showPrimaryActionFields || showSecondaryActionFields,
          showBullets: presetCardFeatures.bullets !== false || bulletList.length > 0,
        };
      })
  ), [fieldById, presetCardFeatures, presetId, settings]);
  const requestedCardCount = hasExplicitCardCount
    ? Math.max(1, Math.min(8, Math.round(Number(settings.cardCount))))
    : null;
  const availableCardSlots = cardSlots
    .filter((item) => item.slot <= Math.max(presetMaxCards, requestedCardCount || 0) || item.isExisting)
    .map((item) => item.slot);
  const existingCardSlots = cardSlots.filter((item) => item.isExisting).map((item) => item.slot);
  const explicitVisibleCardCount = requestedCardCount;
  const [revealedCardSlots, setRevealedCardSlots] = useState(existingCardSlots);
  const [expandedCardSlot, setExpandedCardSlot] = useState(existingCardSlots.length > 1 ? null : (existingCardSlots[0] || null));

  useEffect(() => {
    setRevealedCardSlots((current) => {
      const merged = mergeVisibleSlotList(current, existingCardSlots, availableCardSlots);
      return areSlotListsEqual(current, merged) ? current : merged;
    });
  }, [availableCardSlots, existingCardSlots]);

  const progressiveVisibleCardSlots = mergeVisibleSlotList(revealedCardSlots, existingCardSlots, availableCardSlots);
  const visibleCardSlots = explicitVisibleCardCount
    ? cardSlots.slice(0, explicitVisibleCardCount).map((item) => item.slot)
    : progressiveVisibleCardSlots;

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

  const cardList = (
    <ProgressiveCardEditorList
      heading={presetId === 'services-directory' ? 'Services' : 'Cards'}
      className="admin-progressive-slot-list--grid-cards"
      workspace
      slots={cardSlots.filter((item) => visibleCardSlots.includes(item.slot))}
      expandedSlot={expandedCardSlot}
      onToggleSlot={(slot) => setExpandedCardSlot(slot)}
      onRevealNextSlot={nextHiddenCardSlot
        ? () => {
          setRevealedCardSlots((current) => mergeVisibleSlotList([...current, nextHiddenCardSlot], existingCardSlots, availableCardSlots));
          setExpandedCardSlot(nextHiddenCardSlot);
        }
        : null}
      revealLabel={nextHiddenCardSlot ? `Add card ${nextHiddenCardSlot}` : 'Add card'}
      renderSlotBody={(slotData) => (
        <CardGridCardEditor
          key={`card-grid-editor-${slotData.slot}`}
          slotData={slotData}
          settings={settings}
          onSettingChange={onSettingChange}
          fieldById={fieldById}
          routeOptions={normalizedRouteOptions}
          documentOptions={documentOptions}
          isCgaAssetsGrid={isCgaAssetsGrid}
          showActions={slotData.showActions}
          showBullets={slotData.showBullets}
          showTitleDestination={presetId === 'services-directory'}
          slotNoun={presetId === 'services-directory' ? 'Service' : 'Card'}
        />
      )}
    />
  );

  if (hudMode) {
    return (
      <div className="admin-card-grid-hud-reference">
        <div className="admin-card-grid-hud-page admin-card-grid-hud-page--header">
          <CardGridHeaderEditor
            fieldById={fieldById}
            headerControlFields={headerControlFields}
            settings={settings}
            onSettingChange={onSettingChange}
            routeOptions={normalizedRouteOptions}
            paletteVariant="hud"
          />
        </div>
        <div className="admin-card-grid-hud-page admin-card-grid-hud-page--appearance">
          <div className="admin-card-grid-hud-content-groups">
            <section className="admin-billboard-hud-reference-panel admin-card-grid-hud-group admin-card-grid-hud-group--appearance" aria-label="Card Grid appearance settings">
              <div className="admin-billboard-hud-reference-head">
                <div><h3>Appearance</h3></div>
                <span className="admin-billboard-editor-panel-index">01</span>
              </div>
              <PanelAppearanceControls
                fields={appearanceFields}
                settings={settings}
                onSettingChange={(fieldId, nextValue) => {
                  if (fieldId === 'bgTone') {
                    handleGridBackgroundChange(nextValue);
                    return;
                  }
                  onSettingChange(fieldId, nextValue);
                }}
                compactSwatches={false}
                paletteVariant="hud"
                className="admin-panel-appearance--intro-text"
              />
              <BackgroundEditorPage
                backgroundTone={gridBgTone}
                backgroundToneOptions={Array.isArray(bgToneField?.options) ? bgToneField.options : []}
                backgroundToneLabel="Grid background"
                onBackgroundToneChange={handleGridBackgroundChange}
                backgroundEffectsJson={settings.backgroundEffectsJson}
                onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
                paletteVariant="hud"
              />
            </section>

            <section className="admin-billboard-hud-reference-panel admin-card-grid-hud-group admin-card-grid-hud-group--layout" aria-label="Card Grid layout settings">
              <div className="admin-billboard-hud-reference-head">
                <div><h3>Layout</h3></div>
                <span className="admin-billboard-editor-panel-index">02</span>
              </div>
              <FieldControlGrid
                fields={layoutFields}
                settings={layoutSettings}
                onSettingChange={(fieldId, nextValue) => {
                  if (fieldId === 'cardStyle') {
                    const nextStyle = getGridSafeCardStyleForBg(nextValue, gridBgTone, cardStyleFieldBase?.options);
                    onSettingChange('cardStyle', nextStyle);
                    return;
                  }
                  onSettingChange(fieldId, nextValue);
                }}
                className="admin-content-field-list--inline admin-card-grid-hud-fields"
                paletteVariant="hud"
              />
            </section>

            {showTypographyFields ? (
            <section className="admin-billboard-hud-reference-panel admin-card-grid-hud-group admin-card-grid-hud-group--typography" aria-label="Card Grid typography settings">
              <div className="admin-billboard-hud-reference-head">
                <div><h3>Card typography</h3></div>
                <span className="admin-billboard-editor-panel-index">03</span>
              </div>
              <FieldControlGrid
                fields={allCardTypographyFields}
                settings={settings}
                onSettingChange={onSettingChange}
                className="admin-content-field-list--inline admin-card-grid-hud-fields"
                paletteVariant="hud"
              />
            </section>
            ) : null}
          </div>
        </div>
        <div className="admin-card-grid-hud-page admin-card-grid-hud-page--cards">
          <div className="admin-card-grid-hud-cards-group" aria-label="Card Grid cards settings">
          {cardList}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-intro-block-editor admin-card-grid-hud-editor">
      <section className="admin-card-grid-control-group admin-card-grid-header-control-group">
        <h4>Header</h4>
        <CardGridHeaderEditor
          fieldById={fieldById}
          headerControlFields={headerControlFields}
          settings={settings}
          onSettingChange={onSettingChange}
          routeOptions={normalizedRouteOptions}
        />
      </section>
      <div className="admin-card-grid-editor-settings">
        <div className="admin-intro-appearance-stack admin-grid-appearance-stack">
          <PanelAppearanceControls
            fields={appearanceFields}
            settings={settings}
            onSettingChange={(fieldId, nextValue) => {
              if (fieldId === 'bgTone') {
                handleGridBackgroundChange(nextValue);
                return;
              }
              onSettingChange(fieldId, nextValue);
            }}
            compactSwatches={false}
            className="admin-panel-appearance--intro-text"
          />
          <BackgroundEditorPage
            backgroundTone={gridBgTone}
            backgroundToneOptions={Array.isArray(bgToneField?.options) ? bgToneField.options : []}
            backgroundToneLabel="Grid background"
            onBackgroundToneChange={handleGridBackgroundChange}
            backgroundEffectsJson={settings.backgroundEffectsJson}
            onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
            paletteVariant="admin"
          />
        </div>
      </div>

      <section className="admin-card-grid-control-group">
        <h4>Layout</h4>
        <FieldControlGrid
          fields={layoutFields}
          settings={layoutSettings}
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
      </section>
      {showTypographyFields ? (
        <section className="admin-card-grid-control-group">
          <h4>Card typography</h4>
          <FieldControlGrid
            fields={allCardTypographyFields}
            settings={settings}
            onSettingChange={onSettingChange}
            className="admin-content-field-list--inline admin-grid-layout-fields"
          />
        </section>
      ) : null}

      {cardList}
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
    && field.id !== 'bodyColorClassName'
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
            baseColorClassName={String(
              settings.bodyColorClassName || resolvePanelTextToneClassName(newsletterTextTone, 'white'),
            )}
            onBaseColorChange={(nextValue) => onSettingChange('bodyColorClassName', nextValue)}
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

          <BackgroundEditorPage
            backgroundTone={newsletterBgTone}
            backgroundToneOptions={Array.isArray(bgToneField?.options) ? bgToneField.options : []}
            backgroundToneLabel={bgToneField?.label || 'Newsletter background'}
            onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
            backgroundEffectsJson={settings.backgroundEffectsJson}
            onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
            paletteVariant="admin"
          />
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
  const fields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const appearanceFields = fields.filter((field) => field.id === 'textTone');
  const backgroundToneField = fields.find((field) => field.id === 'bgTone') || null;
  const editorField = getPageContentEditorField(settings);
  const usesLegacySource = hasLegacyPageContentSource(settings);

  const handleHtmlChange = (nextValue) => {
    onSettingChange(editorField, nextValue);
    if (usesLegacySource) {
      onSettingChange('body', '');
      onSettingChange('fineprint', '');
      onSettingChange('addressTitle', '');
      onSettingChange('addressLines', '');
    }
  };

  return (
    <div className="admin-intro-block-editor admin-page-content-block-editor">
      <div className="admin-page-content-editor-main">
        <AdminHtmlEditor
          value={toEditorHtml(getPageContentEditorHtml(settings))}
          onChange={handleHtmlChange}
          placeholder="Start page content..."
        />
        <PageContentEditorPreview
          settings={settings}
          html={getPageContentEditorHtml(settings)}
        />
      </div>

      {appearanceFields.length ? (
        <FieldControlGrid
          fields={appearanceFields}
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-content-field-list--inline admin-page-content-appearance-fields"
        />
      ) : null}

      <BackgroundEditorPage
        backgroundTone={settings.bgTone}
        backgroundToneOptions={Array.isArray(backgroundToneField?.options) ? backgroundToneField.options : []}
        backgroundToneLabel={backgroundToneField?.label || 'Page content background'}
        onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
        backgroundEffectsJson={settings.backgroundEffectsJson}
        onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
        paletteVariant="admin"
      />

      <PageContentLayoutControls
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-page-content-layout-shell--admin"
      />
    </div>
  );
}

export function SupportLibraryBlockEditor({
  block,
  onSettingChange,
  routeOptions = [],
  blockOptions = null,
  sourceRevision = 0,
}) {
  const settings = block.settings || {};
  const fields = resolveEditorFields(block.kind, 'admin', block.editableFields);
  const contentFields = fields.filter((field) => ['title', 'subtitle', 'html'].includes(field.id));
  const supportFields = fields.filter((field) => ['supportGroupsExpanded', 'supportGroupsCollapsible'].includes(field.id));
  const layoutFields = fields.filter((field) => ['fullBleed', 'spaceBeforeRem', 'spaceAfterRem', 'paddingTopRem', 'paddingBottomRem', 'contentMaxWidthPx'].includes(field.id));
  const [activeEditorSection, setActiveEditorSection] = useState('content');
  const editorSections = appendHudBlockOptionsSection([
    { id: 'content', label: 'Content', icon: 'Aa' },
    { id: 'library', label: 'Library', icon: '▤' },
    { id: 'options', label: 'Options', icon: '⚙' },
  ], blockOptions);

  return (
    <HudEditorModelLayout
      className="admin-support-library-hud-editor"
      sections={editorSections}
      activeSection={activeEditorSection}
      onSectionChange={setActiveEditorSection}
      label="Support library editor sections"
      panelClassName="admin-support-library-hud-panels"
    >
      <section className="admin-support-library-hud-page admin-support-library-hud-page--content">
        <FieldControlGrid
          fields={contentFields}
          settings={settings}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
          sourceRevision={sourceRevision}
          className="admin-content-field-list--inline"
        />
      </section>
      <section className="admin-support-library-hud-page admin-support-library-hud-page--library">
        <SupportLibraryGroupsEditor
          value={settings.supportGroupsJson}
          onChange={(nextValue) => onSettingChange('supportGroupsJson', nextValue)}
          routeOptions={routeOptions}
        />
      </section>
      <section className="admin-support-library-hud-page admin-support-library-hud-page--options">
        <FieldControlGrid
          fields={[...supportFields, ...layoutFields]}
          settings={settings}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
          sourceRevision={sourceRevision}
          className="admin-content-field-list--inline"
        />
      </section>
      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}

export function PageContentHudBlockEditor({ block, onSettingChange, blockOptions = null, sourceRevision = 0 }) {
  return (
    <PageContentHudEditorPanel
      block={block}
      onSettingChange={onSettingChange}
      blockOptions={blockOptions}
      sourceRevision={sourceRevision}
    />
  );
}

export function CalculatorWidgetBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const fields = resolveEditorFields(block.kind, 'admin', block.editableFields);

  return (
    <div className="admin-intro-block-editor admin-calculator-widget-block-editor">
      <FieldControlGrid
        fields={fields}
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-content-field-list--inline"
      />
    </div>
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
      showBackgroundPage
      backgroundEffectsJson={settings.backgroundEffectsJson}
      onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
    />
  );
}

export function TopStripHudBlockEditor({ block, onSettingChange, blockOptions = null, sourceRevision = 0 }) {
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
      blockOptions={blockOptions}
      sourceRevision={sourceRevision}
      showBackgroundPage
      backgroundEffectsJson={settings.backgroundEffectsJson}
      onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
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

export function RatesBlockEditor({ block, onSettingChange, ratesContext = {}, sourceRevision = 0 }) {
  const runtime = buildDynamicRatesFromBlock(block);
  const settings = block?.settings || {};
  const allFields = resolveEditorFields(block.kind, 'hud', block.editableFields);
  const rates = Array.isArray(ratesContext?.rates) ? ratesContext.rates : [];
  const iraRates = Array.isArray(ratesContext?.iraRates) ? ratesContext.iraRates : [];
  const ratesMeta = ratesContext?.ratesMeta || {};

  return (
    <div className="admin-rates-editor" data-rates-editor-dataset={runtime?.dataset || undefined}>
      <div className="admin-rates-editor__controls">
        <FieldControlGrid
          fields={allFields}
          settings={settings}
          onSettingChange={onSettingChange}
          sourceRevision={sourceRevision}
        />
        <a
          className="admin-testimonials-library-link"
          href={runtime?.adminHref || '/admin/rates'}
          target="_blank"
          rel="noreferrer noopener"
        >
          Manage published rate rows ↗
        </a>
      </div>
      <div className="admin-rates-editor__preview-wrap">
        <RatesBlockPreview runtime={runtime} rates={rates} iraRates={iraRates} ratesMeta={ratesMeta} />
        <div className="admin-rates-editor__preview-note">
          This compact preview follows the selected dataset. Rate rows remain managed in Rates admin.
        </div>
      </div>
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

function useTestimonialsEditorModel(block, testimonialsLibrary = []) {
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
  const defaultTag = String(settings.defaultTag || '').trim();
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
  void pathname;
  void selectedPath;
  const {
    settings,
    selectionMode,
    selectedIds,
    filterTags,
    libraryItems,
    availableTags,
    defaultTag,
    previewItems,
  } = useTestimonialsEditorModel(block, testimonialsLibrary);
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

        </div>
      </div>
    </div>
  );
}

export function TestimonialsHudBlockEditor({ block, pathname = '', onSettingChange, testimonialsLibrary = [], blockOptions = null }) {
  void pathname;
  const {
    settings,
    selectionMode,
    selectedIds,
    filterTags,
    libraryItems,
    availableTags,
    previewItems,
  } = useTestimonialsEditorModel(block, testimonialsLibrary);

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
      blockOptions={blockOptions}
    />
  );
}

export function ColumnsBlockEditor({ block, onSettingChange, routeOptions = [] }) {
  const settings = block.settings || {};
  const presetDefinition = resolveBlockPresetDefinition(block);
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
    : true;
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
    <div className="admin-intro-block-editor admin-columns-block-editor">
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
        className="is-intro-heading admin-columns-heading-editor"
        unifiedPreviewEditor
        previewClassName={columnsPreviewClassName}
        previewWrapClassName={`is-bg-${columnsBgTone}`}
        spanDetailsUnderToggle
        useResetForClear
      />

      {showBackgroundToneControl ? (
        <BackgroundEditorPage
          backgroundTone={columnsBgTone}
          backgroundToneOptions={Array.isArray(bgToneField?.options) ? bgToneField.options : []}
          backgroundToneLabel={bgToneField?.label || 'Columns background'}
          onBackgroundToneChange={(nextValue) => onSettingChange('bgTone', nextValue)}
          backgroundEffectsJson={settings.backgroundEffectsJson}
          onBackgroundEffectsChange={(nextValue) => onSettingChange('backgroundEffectsJson', nextValue)}
          paletteVariant="admin"
        />
      ) : null}

      <AdminHtmlEditor
        compact
        className="admin-grid-body-editor admin-grid-body-editor--columns-content"
        value={toEditorHtml(settings.bodyHtml)}
        onChange={(nextValue) => onSettingChange('bodyHtml', nextValue)}
        baseColorClassName={String(
          settings.bodyColorClassName || resolvePanelTextToneClassName(columnsPreviewTone, 'dark'),
        )}
        onBaseColorChange={(nextValue) => onSettingChange('bodyColorClassName', nextValue)}
        placeholder="Columns intro copy"
      />

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
            !isPhotoColumn ? fieldById.get(`col${slot}TitleClassName`) : null,
            !isPhotoColumn ? fieldById.get(`col${slot}TitleHighlightsJson`) : null,
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

function ColumnsHudBlockEditor({ block, onSettingChange, sourceRevision = 0, blockOptions = null }) {
  return (
    <ColumnsHudEditorPanel
      presetId={String(block?.presetId || '')}
      settings={block?.settings || {}}
      onSettingChange={onSettingChange}
      sourceRevision={sourceRevision}
      blockOptions={blockOptions}
    />
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
  if (normalizedSurface === 'hud' && token === 'support_library') {
    return SupportLibraryBlockEditor;
  }
  if (normalizedSurface === 'hud' && token === 'top_strip') {
    return TopStripHudBlockEditor;
  }
  if (normalizedSurface === 'hud' && token === 'testimonials') {
    return TestimonialsHudBlockEditor;
  }
  if (normalizedSurface === 'hud' && token === 'columns') {
    return ColumnsHudBlockEditor;
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
  if (token === 'calculator_intro') {
    return CalculatorWidgetBlockEditor;
  }
  if (token === 'calculator_widget') {
    return CalculatorWidgetBlockEditor;
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
  if (token === 'card_chart') {
    return CardChartBlockEditor;
  }
  if (token === 'newsletter') {
    return NewsletterBlockEditor;
  }
  if (token === 'content') {
    return PageContentBlockEditor;
  }
  if (token === 'support_library') {
    return SupportLibraryBlockEditor;
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
