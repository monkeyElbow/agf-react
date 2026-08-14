import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import AdminHtmlEditor from '../components/AdminHtmlEditor';
import BillboardHudEditorPanel from '../components/BillboardHudEditorPanel';
import AdminNumberInput from '../components/AdminNumberInput';
import SharedRouteLinkField from '../components/RouteLinkField';
import { getBlockOwnershipVisual } from '../components/BlockOwnershipOverlay';
import ColorPalette from '../components/ColorPalette';
import { HeroDriftNotice } from '../components/HeroHudEditorShared';
import {
  BillboardBlockEditor as MigratedBillboardBlockEditor,
  ColumnsBlockEditor as MigratedColumnsBlockEditor,
  CtaFormBlockEditor as MigratedCtaFormBlockEditor,
  getMigratedBlockEditorComponent,
  HeroBlockEditor as MigratedHeroBlockEditor,
  IntroBlockEditor as MigratedIntroBlockEditor,
  NewsletterBlockEditor as MigratedNewsletterBlockEditor,
  PageContentBlockEditor as MigratedPageContentBlockEditor,
  RequestFormBlockEditor as MigratedRequestFormBlockEditor,
} from '../components/block-editors/migratedBlockEditors';
import { inspectDynamicHeroSettings, useContentAdmin } from '../context/ContentAdminContext';
import { useTestimonials } from '../context/TestimonialsContext';
import { pageByPath } from '../data/siteMap';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import {
  applySelectionColor,
  extractHeroLineColorToken,
  parseHeroRangeHighlights,
  readTextSelectionState,
  remapHighlightsJsonForTextChange,
  removeSelectionRange,
  replaceHeroLineColorClass,
  resolveSelectionRangeColor,
} from '../lib/heroHudRanges';
import {
  BUTTON_TONE_OPTIONS,
  HERO_TEXT_COLOR_OPTIONS,
  PANEL_TEXT_TONE_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
  normalizeButtonTone,
  normalizePanelTextTone as normalizeSharedPanelTextTone,
  normalizeSemanticTextColorClass,
  normalizeSurfaceBgTone,
  resolvePanelTextToneClassName,
} from '../lib/colorSystem';
import { buildAdminBlockInsertChoices } from '../lib/adminBlockInsertChoices';
import { normalizeAdminBlockName } from '../lib/blockDisplayName';
import { PUBLISH_STATUS } from '../lib/contentAdminPublishing';
import { getBlockHudDefinition } from '../lib/blockHudRegistry';
import { getBlockTemplateIcon, toBlockKindMonogram } from '../lib/blockTemplatePresentation';
import { isBlocklessManagedPagePath } from '../lib/managedPageShells';
import { isPageContentKind, isPageContentTemplateId } from '../lib/pageContentIdentity';
import {
  coerceLinkValue,
  linkValueToEditableHref,
  linkValueToRouteRef,
  parseLinkValueJson,
  serializeLinkValue,
} from '../lib/linkValue';
export {
  MigratedBillboardBlockEditor as BillboardBlockEditor,
  MigratedColumnsBlockEditor as ColumnsBlockEditor,
  MigratedCtaFormBlockEditor as CtaFormBlockEditor,
  MigratedHeroBlockEditor as HeroBlockEditor,
  MigratedIntroBlockEditor as IntroBlockEditor,
  MigratedNewsletterBlockEditor as NewsletterBlockEditor,
  MigratedPageContentBlockEditor as PageContentBlockEditor,
  MigratedRequestFormBlockEditor as RequestFormBlockEditor,
};

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

function getRequestedAdminPagePath(search) {
  return String(new URLSearchParams(search).get('page') || '').trim();
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

function toAdminListSnippet(value, maxLength = 34) {
  const source = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!source) {
    return '';
  }
  if (source.length <= maxLength) {
    return source;
  }
  return `${source.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function getAdminBlockLabel(block) {
  return getBlockHudDefinition(block).label;
}

function stripHtmlToText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAdminBlockInspectSummary(block) {
  const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
  const candidates = [
    settings.heading,
    settings.title,
    settings.line1Text,
    settings.body,
    stripHtmlToText(settings.bodyHtml),
    settings.subtitle,
    settings.extraLine,
  ];
  const firstNonEmpty = candidates.find((value) => String(value || '').trim());
  return firstNonEmpty ? toAdminListSnippet(firstNonEmpty, 120) : '';
}

function formatRelativeTime(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '';
  }

  const deltaMs = Date.now() - timestamp;
  if (deltaMs < 45_000) {
    return 'just now';
  }

  const deltaMinutes = Math.round(deltaMs / 60_000);
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMs / 3_600_000);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.round(deltaMs / 86_400_000);
  if (deltaDays < 7) {
    return `${deltaDays}d ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}

function formatAdminTimestamp(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '';
  }
  return new Date(timestamp).toLocaleString();
}

function formatActorName(actor, fallback = 'Unknown') {
  return String(actor?.displayName || '').trim() || fallback;
}

function getActionFailureMessage(result, fallback) {
  return String(
    result?.details
    || result?.error
    || result?.reason
    || fallback
    || 'Action failed.',
  ).trim();
}

function canBlockOpenEditor(block, migratedEditor = null) {
  return Boolean(
    (String(block?.mode || '').trim().toLowerCase() === 'dynamic' && migratedEditor)
    || (Array.isArray(block?.editableFields) && block.editableFields.length)
  );
}

function summarizeSharedSaveResultForPath(saveResult, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!saveResult || !normalizedPath) {
    return null;
  }
  const blockedBlocks = (Array.isArray(saveResult.blockedBlocks) ? saveResult.blockedBlocks : [])
    .filter((entry) => String(entry?.pathname || '').trim() === normalizedPath);
  const savedBlockIds = Array.isArray(saveResult.savedBlockIdsByPath?.[normalizedPath])
    ? saveResult.savedBlockIdsByPath[normalizedPath]
    : [];
  const changedOnPath = Array.isArray(saveResult.changedPaths)
    ? saveResult.changedPaths.includes(normalizedPath)
    : false;
  if (!changedOnPath && !blockedBlocks.length && !savedBlockIds.length && !saveResult?.error) {
    return null;
  }
  return {
    error: String(saveResult?.error || '').trim(),
    status: String(saveResult?.status || '').trim(),
    updatedAt: Number(saveResult?.updatedAt) || 0,
    savedBlockIds,
    blockedBlocks,
  };
}

function summarizeSharedPublishResultForPath(publishResult, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!publishResult || !normalizedPath) {
    return null;
  }
  const blockedBlocks = (Array.isArray(publishResult.blockedBlocks) ? publishResult.blockedBlocks : [])
    .filter((entry) => String(entry?.pathname || '').trim() === normalizedPath);
  const publishedBlockIds = Array.isArray(publishResult.publishedBlockIdsByPath?.[normalizedPath])
    ? publishResult.publishedBlockIdsByPath[normalizedPath]
    : [];
  const changedOnPath = Array.isArray(publishResult.changedPaths)
    ? publishResult.changedPaths.includes(normalizedPath)
    : false;
  const publishedOnPath = Array.isArray(publishResult.publishedPaths)
    ? publishResult.publishedPaths.includes(normalizedPath)
    : false;
  if (!changedOnPath && !publishedOnPath && !blockedBlocks.length && !publishedBlockIds.length && !publishResult?.error) {
    return null;
  }
  return {
    error: String(publishResult?.error || '').trim(),
    status: String(publishResult?.status || '').trim(),
    updatedAt: Number(publishResult?.updatedAt) || 0,
    publishedBlockIds,
    blockedBlocks,
    receipt: publishResult.receipt || null,
    hasOrderChanges: Boolean(publishResult?.hasOrderChangesByPath?.[normalizedPath]),
    hasPageMetaChanges: Boolean(publishResult?.hasPageMetaChangesByPath?.[normalizedPath]),
  };
}

function formatWorkflowScopeLabel(prefix, summary, emptyLabel, changedBlockCountOverride = null) {
  if (!summary?.hasUnsavedChanges) {
    return emptyLabel;
  }

  const parts = [];
  const changedBlockCount = changedBlockCountOverride == null
    ? Number(summary.changedBlockCount) || 0
    : Number(changedBlockCountOverride) || 0;
  if (changedBlockCount) {
    parts.push(`${changedBlockCount} block${changedBlockCount === 1 ? '' : 's'}`);
  }
  if (summary.hasOrderChanges) {
    parts.push('order');
  }
  if (summary.hasPageMetaChanges) {
    parts.push('page details');
  }
  return `${prefix}: ${parts.join(', ')}`;
}

function summarizeRevisionBlocks(blocks) {
  const source = Array.isArray(blocks) ? blocks : [];
  if (!source.length) {
    return 'No block metadata';
  }
  if (source.length <= 3) {
    return source.map((block) => String(block?.label || block?.id || 'Block').trim()).filter(Boolean).join(' · ');
  }
  return `${source.length} blocks saved`;
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

const HERO_SWATCH_OPTIONS = HERO_TEXT_COLOR_OPTIONS;
const HERO_BG_SWATCH_OPTIONS = SURFACE_BG_TONE_OPTIONS;
const BILLBOARD_BG_SWATCH_OPTIONS = SURFACE_BG_TONE_OPTIONS;
const BILLBOARD_TEXT_SWATCH_OPTIONS = PANEL_TEXT_TONE_OPTIONS;

const BILLBOARD_BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
];

const BILLBOARD_BUTTON_TONE_OPTIONS = BUTTON_TONE_OPTIONS;

const HERO_ANIMATION_PRESET_OPTIONS = [
  { value: 'default', label: 'Default entrance' },
  { value: 'none', label: 'No line animation' },
  { value: 'loans-unblur', label: 'Unblur + slide' },
];

const DEFAULT_HERO_LINE_GAP = 0;
const JUSTIFY_ICON_ORDER = ['left', 'center', 'right'];
const ACTION_BUTTON_STYLE_SET = new Set(['blue', 'dark', 'outline']);

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

function normalizePanelTextTone(value, fallback = 'dark') {
  return normalizeSharedPanelTextTone(value, fallback);
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

function VisibilityIcon({ hidden }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M2.2 2.9a.7.7 0 0 1 1 0l10 10a.7.7 0 1 1-1 1l-10-10a.7.7 0 0 1 0-1z"
          fill="currentColor"
        />
        <path
          d="M8 3.2c3.2 0 5.8 2 7.1 4.8a.7.7 0 0 1 0 .6 8.6 8.6 0 0 1-3.5 3.7l-1-1A7.1 7.1 0 0 0 13.6 8c-1.1-2.1-3.1-3.5-5.6-3.5-1 0-2 .2-2.8.7l-1-1A8 8 0 0 1 8 3.2z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M8 3.2c3.2 0 5.8 2 7.1 4.8a.7.7 0 0 1 0 .6C13.8 11.4 11.2 13.4 8 13.4S2.2 11.4.9 8.6a.7.7 0 0 1 0-.6C2.2 5.2 4.8 3.2 8 3.2zm0 1.3c-2.5 0-4.5 1.4-5.6 3.5 1.1 2.1 3.1 3.5 5.6 3.5s4.5-1.4 5.6-3.5c-1.1-2.1-3.1-3.5-5.6-3.5z"
        fill="currentColor"
      />
      <circle cx="8" cy="8" r="1.9" fill="currentColor" />
    </svg>
  );
}

function AddBlockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M8 3.1a.8.8 0 0 1 .8.8v3.3h3.3a.8.8 0 1 1 0 1.6H8.8v3.3a.8.8 0 1 1-1.6 0V8.8H3.9a.8.8 0 1 1 0-1.6h3.3V3.9a.8.8 0 0 1 .8-.8z"
        fill="currentColor"
      />
    </svg>
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
  useResetForClear = false,
  swatchOptions = HERO_SWATCH_OPTIONS,
}) {
  const inputRef = useRef(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSpanDetails, setShowSpanDetails] = useState(false);
  const value = String(text ?? '');
  const normalizedLineClass = String(lineClassName || '').trim();
  const mergedPreviewClassName = mergePreviewClassNames(normalizedLineClass, previewClassName);
  const highlights = useMemo(() => parseHeroRangeHighlights(highlightsJson, value), [highlightsJson, value]);
  const hasSelection = selection.end > selection.start;
  const selectedRangeColor = hasSelection
    ? resolveSelectionRangeColor(highlights, selection.start, selection.end)
    : '';

  const syncSelection = () => {
    const nextSelection = readTextSelectionState(inputRef.current, selection, value);
    setSelection({ start: nextSelection.start, end: nextSelection.end });
  };

  const handleTextChange = (nextText) => {
    const prevText = value;
    onTextChange(nextText);
    onHighlightsJsonChange(remapHighlightsJsonForTextChange(highlightsJson, prevText, nextText));
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
      onHighlightsJsonChange(
        applySelectionColor(
          highlightsJson,
          value,
          currentSelection.start,
          currentSelection.end,
          colorValue,
        ),
      );
      setSelection(currentSelection);
      return;
    }

    onLineClassNameChange(replaceHeroLineColorClass(normalizedLineClass, colorValue));
  };

  const removeHighlightAtIndex = (index) => {
    onHighlightsJsonChange(removeSelectionRange(highlightsJson, value, index));
  };

  const clearAllColorFormatting = () => {
    onLineClassNameChange(replaceHeroLineColorClass(normalizedLineClass, ''));
    onHighlightsJsonChange('');
    setShowSpanDetails(false);
  };

  const clearHighlights = () => {
    onHighlightsJsonChange('');
    setShowSpanDetails(false);
  };

  const activeValue = hasSelection ? selectedRangeColor : extractHeroLineColorToken(normalizedLineClass);
  const hasSpanDetails = highlights.length > 0;
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
        {value
          ? renderPreviewHighlightedText(value, highlights)
          : <span className="admin-color-text-placeholder">{placeholder || 'Preview'}</span>}
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
        {value
          ? renderPreviewHighlightedText(value, highlights)
          : <span className="admin-color-text-placeholder">{placeholder || 'Preview'}</span>}
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
        {highlights.length && !useResetForClear ? (
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

          <button
            type="button"
            className="admin-hero-inline-span-toggle admin-color-text-span-toggle"
            onClick={() => setShowSpanDetails((current) => !current)}
          >
            {showSpanDetails ? 'Hide span details ▴' : 'Show span details ▾'}
          </button>
        </div>

        {spanDetailsUnderToggle && showSpanDetails ? (
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

      {!spanDetailsUnderToggle && showSpanDetails ? spanDetails : null}
    </div>
  );
}

export function FieldControlGrid({ fields, settings, onSettingChange, className = '', routeOptions = [] }) {
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

/* RouteLinkField is shared by HUD and backend editors. */
function LegacyRouteLinkField({ value, routeRefValue, onChange, onRouteRefChange, routeOptions = [] }) {
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
    const parsedLinkValue = parseLinkValueJson(value);
    const routeLinkValue = field.id?.endsWith('LinkJson')
      ? linkValueToEditableHref(parsedLinkValue)
      : value;
    const routeLinkRouteRefValue = field.id?.endsWith('LinkJson')
      ? linkValueToRouteRef(parsedLinkValue)
      : (routeRefFieldId ? settings?.[routeRefFieldId] : '');
    const commitRouteLink = (nextHrefValue, nextRouteRefValue = '') => {
      if (!field.id?.endsWith('LinkJson')) {
        onChange(nextHrefValue);
        if (routeRefFieldId) {
          onSettingChange(routeRefFieldId, nextRouteRefValue);
        }
        return;
      }
      const routeRef = String(nextRouteRefValue || '').trim();
      const linkValue = routeRef.startsWith('/')
        ? coerceLinkValue({ to: routeRef })
        : coerceLinkValue({ href: nextHrefValue });
      onChange(serializeLinkValue(linkValue));
    };
    return (
      <SharedRouteLinkField
        inputLabel={field.label || 'URL / Path'}
        value={routeLinkValue}
        routeRefValue={routeLinkRouteRefValue}
        onChange={(nextValue) => commitRouteLink(nextValue)}
        onRouteRefChange={(nextRouteRefValue) => commitRouteLink(routeLinkValue, nextRouteRefValue)}
        routeOptions={routeOptions}
      />
    );
  }

  return <input type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
}

export default function AdminContentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState(() => getRequestedAdminPagePath(location.search) || '/');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [insertAtIndex, setInsertAtIndex] = useState(null);
  const [insertChoiceId, setInsertChoiceId] = useState('');
  const [pendingRemoveBlockId, setPendingRemoveBlockId] = useState(null);
  const [breadcrumbEditMode, setBreadcrumbEditMode] = useState(null);
  const [pageSearch, setPageSearch] = useState('');
  const [isRouteEditMode, setIsRouteEditMode] = useState(false);
  const [routePathDraft, setRoutePathDraft] = useState('');
  const [routePathMessage, setRoutePathMessage] = useState('');
  const [routePathError, setRoutePathError] = useState(false);
  const [insertTemplateSearch, setInsertTemplateSearch] = useState('');
  const [draggingBlockId, setDraggingBlockId] = useState('');
  const [dragOverInsertIndex, setDragOverInsertIndex] = useState(-1);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [revisionEntries, setRevisionEntries] = useState([]);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [revisionError, setRevisionError] = useState('');
  const [revisionActionBusy, setRevisionActionBusy] = useState('');
  const [revisionBlockSelectionById, setRevisionBlockSelectionById] = useState({});
  const [draftSaveNote, setDraftSaveNote] = useState('');
  const [draftSaveConfirmation, setDraftSaveConfirmation] = useState(false);
  const [draftSaveBusy, setDraftSaveBusy] = useState(false);
  const [pagePublishBusy, setPagePublishBusy] = useState(false);
  const [activeEditorBlockId, setActiveEditorBlockId] = useState(null);
  const [sharedBackupEntries, setSharedBackupEntries] = useState([]);
  const [sharedBackupsLoading, setSharedBackupsLoading] = useState(false);
  const [sharedBackupMessage, setSharedBackupMessage] = useState('');
  const [sharedBackupError, setSharedBackupError] = useState('');
  const [sharedBackupActionBusy, setSharedBackupActionBusy] = useState('');
  const [draftDiscardBusy, setDraftDiscardBusy] = useState(false);
  const [draftDiscardMessage, setDraftDiscardMessage] = useState('');
  const [blockPublishBusyId, setBlockPublishBusyId] = useState('');
  const [blockPublishMessage, setBlockPublishMessage] = useState('');
  const [ownershipActionBusy, setOwnershipActionBusy] = useState(false);
  const [ownershipMessage, setOwnershipMessage] = useState('');
  const [blockAdminNameDrafts, setBlockAdminNameDrafts] = useState({});
  const routeEditorRef = useRef(null);

  const {
    devIdentity,
    pageHierarchy,
    blocksByPath,
    authoringPageHierarchy,
    authoringBlocksByPath,
    updatePageHierarchy,
    renamePagePath,
    updateBlock,
    addBlock,
    removeBlock,
    moveBlock,
    moveBlockToIndex,
    availableBlockTemplates,
    getBreadcrumbTrail,
    getBlockCollaboration,
    getPageHistory,
    lastSharedSaveResult,
    lastSharedPublishResult,
    sharedPublishStatus = '',
    sharedSyncStatus = null,
    sharedSnapshotUpdatedAt,
    sharedSeedBaseline,
    isPageDirty,
    getPageChangeSummary,
    getPagePublishSummary,
    getPageWorkflowActivity,
    hasPendingExternalDrafts = () => false,
    saveSharedDraftNow,
    discardSharedPageDraft = async () => ({ ok: false, reason: 'shared-authority-disabled' }),
    discardSharedBlockDraft = async () => ({ ok: false, reason: 'shared-authority-disabled' }),
    publishSharedPageNow,
    publishSharedBlockNow = async () => ({ ok: false, reason: 'shared-authority-disabled' }),
    getPageRevisionHistory,
    getSharedContentBackups = async () => [],
    promoteContentAdminToSeed = async () => ({ ok: false, reason: 'shared-authority-disabled' }),
    restorePageRevision,
    restoreBlockRevision,
    restoreLatestSharedContentBackup = async () => ({ ok: false, reason: 'shared-authority-disabled' }),
    setActiveBlockLock,
    clearActiveBlockLock = () => ({ ok: false }),
    releaseActiveBlockDraft = async () => ({ ok: false }),
    resetContentAdmin,
    claimBufferedBlockEdit = () => false,
    commitBlockSettingsPatch = () => false,
    registerExternalDraftFlushHandler = null,
    registerExternalDraftStatusHandler = null,
    getAuthoringBreadcrumbTrail = null,
  } = useContentAdmin();
  const clearActiveBlockLockRef = useRef(clearActiveBlockLock);

  useEffect(() => {
    clearActiveBlockLockRef.current = clearActiveBlockLock;
  }, [clearActiveBlockLock]);
  const adminPageHierarchy = authoringPageHierarchy || pageHierarchy;
  const adminBlocksByPath = authoringBlocksByPath || blocksByPath;
  const sharedContentSyncPending = Boolean(sharedSyncStatus?.isPending || sharedSyncStatus?.hasQueuedDraftSync);
  const sharedPublishBusy = sharedPublishStatus === PUBLISH_STATUS.SAVING_DRAFT
    || sharedPublishStatus === PUBLISH_STATUS.PUBLISHING
    || sharedPublishStatus === PUBLISH_STATUS.VERIFYING
    || sharedPublishStatus === PUBLISH_STATUS.STATUS_UNKNOWN;
  const { testimonials: testimonialsLibrary } = useTestimonials();
  const loadSharedBackups = useCallback(async () => {
    setSharedBackupsLoading(true);
    try {
      const backups = await getSharedContentBackups();
      setSharedBackupEntries(Array.isArray(backups) ? backups : []);
      setSharedBackupError('');
    } catch {
      setSharedBackupError('Unable to load shared content backups right now.');
    } finally {
      setSharedBackupsLoading(false);
    }
  }, [getSharedContentBackups]);

  const editablePages = useMemo(
    () => sortPages(
      Object.values(adminPageHierarchy || {})
        .filter((page) => (
          page
          && page.path
          && !page.path.startsWith('/admin/')
          && !isBlocklessManagedPagePath(page.path)
        )),
    ),
    [adminPageHierarchy],
  );
  const routeLinkOptions = useMemo(
    () => sortPages(
      Object.values(adminPageHierarchy || {})
        .filter((page) => page && page.path && !page.path.startsWith('/admin/') && page.path !== '/search'),
    ),
    [adminPageHierarchy],
  );

  const selectedPage = adminPageHierarchy[selectedPath] || null;
  const selectedBlocksSource = adminBlocksByPath[selectedPath] || [];
  const requestedAdminPagePath = useMemo(() => getRequestedAdminPagePath(location.search), [location.search]);
  const { blocks: selectedBlocks, stageLocalBlockSetting } = useLocalBlockDrafts({
    pathname: selectedPath,
    blocks: selectedBlocksSource,
    claimBufferedBlockEdit,
    commitBlockSettingsPatch,
    registerExternalDraftFlushHandler,
    registerExternalDraftStatusHandler,
  });
  const selectedBlock = selectedBlocks.find((block) => block.id === selectedBlockId) || null;
  const selectedBlockMeta = selectedBlock
    ? getBlockCollaboration(selectedPath, selectedBlock.id)
    : null;
  const recentPageHistory = getPageHistory(selectedPath).slice(0, 6);
  const MigratedSelectedBlockEditor = selectedBlock
    ? getMigratedBlockEditorComponent(selectedBlock.kind, 'admin')
    : null;
  const canEditSelectedBlock = canBlockOpenEditor(selectedBlock, MigratedSelectedBlockEditor);
  const selectedBlockIsEditing = Boolean(selectedBlock && selectedBlock.id === activeEditorBlockId);
  const breadcrumbTrail = typeof getAuthoringBreadcrumbTrail === 'function'
    ? getAuthoringBreadcrumbTrail(selectedPath)
    : getBreadcrumbTrail(selectedPath);
  const selectedPathChangeSummary = getPageChangeSummary(selectedPath);
  const selectedPathPublishSummary = getPagePublishSummary(selectedPath);
  const selectedPathWorkflowActivity = getPageWorkflowActivity(selectedPath);

  const parentOptions = editablePages.filter((page) => page.path !== selectedPath);
  const filteredEditablePages = useMemo(() => {
    const needle = pageSearch.trim().toLowerCase();
    if (!needle) {
      return editablePages;
    }

    return editablePages.filter((page) => {
      const haystack = `${page.title} ${page.path}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [editablePages, pageSearch]);
  const pageOptionsForSelect = useMemo(() => {
    const byPath = new Map();
    const selectedPageOption = editablePages.find((page) => page.path === selectedPath);
    if (selectedPageOption) {
      byPath.set(selectedPageOption.path, selectedPageOption);
    }
    filteredEditablePages.forEach((page) => {
      byPath.set(page.path, page);
    });
    return Array.from(byPath.values());
  }, [editablePages, filteredEditablePages, selectedPath]);
  const breadcrumbParentTrail = breadcrumbTrail.slice(0, -1);
  const breadcrumbCurrent = breadcrumbTrail[breadcrumbTrail.length - 1] || null;
  const filteredInsertChoices = useMemo(() => buildAdminBlockInsertChoices(availableBlockTemplates, {
    mode: 'dynamic',
    search: insertTemplateSearch,
    pathname: selectedPath,
  }), [availableBlockTemplates, insertTemplateSearch, selectedPath]);

  const applySelectedPath = useCallback((nextPath, options = {}) => {
    const normalizedPath = String(nextPath || '').trim();
    if (!normalizedPath) {
      return;
    }

    const { replace = false, syncUrl = true } = options;
    setSelectedPath(normalizedPath);
    setSelectedBlockId(null);
    setInsertAtIndex(null);
    setPendingRemoveBlockId(null);

    if (!syncUrl) {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('page') === normalizedPath) {
      return;
    }
    searchParams.set('page', normalizedPath);
    navigate(
      {
        pathname: location.pathname,
        search: `?${searchParams.toString()}`,
      },
      { replace },
    );
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    setBreadcrumbEditMode(null);
  }, [selectedPath]);

  useEffect(() => {
    setDraftSaveConfirmation(false);
  }, [selectedPath]);

  useEffect(() => {
    if (!editablePages.length) {
      if (sharedContentSyncPending || requestedAdminPagePath) {
        return;
      }
      setSelectedPath('/');
      setSelectedBlockId(null);
      return;
    }
    if (!editablePages.some((page) => page.path === selectedPath)) {
      if (
        selectedPath
        && (
          adminPageHierarchy[selectedPath]
          || adminBlocksByPath[selectedPath]
          || (sharedContentSyncPending && requestedAdminPagePath === selectedPath)
        )
      ) {
        return;
      }
      setSelectedPath(editablePages[0].path);
      setSelectedBlockId(null);
    }
  }, [
    adminBlocksByPath,
    adminPageHierarchy,
    editablePages,
    requestedAdminPagePath,
    selectedPath,
    sharedContentSyncPending,
  ]);

  useEffect(() => {
    if (!editablePages.length) {
      return;
    }
    const requestedPath = requestedAdminPagePath;
    if (!requestedPath || requestedPath === selectedPath) {
      return;
    }
    if (!editablePages.some((page) => page.path === requestedPath)) {
      return;
    }
    applySelectedPath(requestedPath, { syncUrl: false });
  }, [applySelectedPath, editablePages, requestedAdminPagePath, selectedPath]);

  useEffect(() => {
    setRoutePathDraft(selectedPath || '');
    setRoutePathMessage('');
    setRoutePathError(false);
    setIsRouteEditMode(false);
    setInsertAtIndex(null);
    setPendingRemoveBlockId(null);
    setDraggingBlockId('');
    setDragOverInsertIndex(-1);
    setActiveEditorBlockId(null);
  }, [selectedPath]);

  useEffect(() => {
    if (!selectedBlockId) {
      return;
    }
    if (selectedBlocks.some((block) => block.id === selectedBlockId)) {
      return;
    }
    setSelectedBlockId(null);
  }, [selectedBlockId, selectedBlocks]);

  useEffect(() => {
    if (!activeEditorBlockId) {
      return;
    }
    const activeEditorBlock = selectedBlocks.find((block) => block.id === activeEditorBlockId) || null;
    const activeEditor = activeEditorBlock
      ? getMigratedBlockEditorComponent(activeEditorBlock.kind, 'admin')
      : null;
    if (activeEditorBlock && canBlockOpenEditor(activeEditorBlock, activeEditor)) {
      return;
    }
    setActiveEditorBlockId(null);
  }, [activeEditorBlockId, selectedBlocks]);

  useEffect(() => () => {
    if (selectedPath && activeEditorBlockId) {
      clearActiveBlockLockRef.current(selectedPath, activeEditorBlockId);
    }
  }, [activeEditorBlockId, selectedPath]);

  useEffect(() => {
    if (insertChoiceId && filteredInsertChoices.some((choice) => choice.id === insertChoiceId)) {
      return;
    }
    if (!filteredInsertChoices.length) {
      setInsertChoiceId('');
      return;
    }
    setInsertChoiceId(filteredInsertChoices[0].id);
  }, [filteredInsertChoices, insertChoiceId]);

  useEffect(() => {
    setRevisionEntries([]);
    setRevisionError('');
    setRevisionBlockSelectionById({});
  }, [selectedPath]);

  useEffect(() => {
    if (!isRouteEditMode) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const container = routeEditorRef.current;
      if (!container) {
        return;
      }
      if (container.contains(event.target)) {
        return;
      }
      setIsRouteEditMode(false);
      setRoutePathDraft(selectedPath || '');
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isRouteEditMode, selectedPath]);

  useEffect(() => {
    let cancelled = false;
    const loadRevisionHistory = async () => {
      setRevisionLoading(true);
      setRevisionError('');
      try {
        const nextEntries = await getPageRevisionHistory(selectedPath);
        if (cancelled) {
          return;
        }
        setRevisionEntries(Array.isArray(nextEntries) ? nextEntries : []);
      } catch {
        if (cancelled) {
          return;
        }
        setRevisionError('Unable to load page revision history right now.');
      } finally {
        if (!cancelled) {
          setRevisionLoading(false);
        }
      }
    };

    loadRevisionHistory();
    return () => {
      cancelled = true;
    };
  }, [getPageRevisionHistory, selectedPath, lastSharedSaveResult?.updatedAt, sharedSnapshotUpdatedAt]);

  useEffect(() => {
    loadSharedBackups();
  }, [loadSharedBackups, sharedSnapshotUpdatedAt]);

  const clearBlockDragState = () => {
    setDraggingBlockId('');
    setDragOverInsertIndex(-1);
  };

  const handleBlockDragStart = (event, blockId) => {
    const normalizedId = String(blockId || '').trim();
    if (!normalizedId) {
      return;
    }

    setInsertAtIndex(null);
    setPendingRemoveBlockId(null);
    setDraggingBlockId(normalizedId);
    setDragOverInsertIndex(-1);
    setSelectedBlockId(normalizedId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', normalizedId);
  };

  const handleBlockDropAtInsertIndex = (event, insertIndex) => {
    event.preventDefault();
    const sourceBlockId = String(
      draggingBlockId
      || event.dataTransfer.getData('text/plain')
      || '',
    ).trim();
    if (!sourceBlockId) {
      clearBlockDragState();
      return;
    }

    const fromIndex = selectedBlocks.findIndex((block) => block.id === sourceBlockId);
    if (fromIndex < 0) {
      clearBlockDragState();
      return;
    }

    const requestedInsertIndex = Number(insertIndex);
    if (!Number.isFinite(requestedInsertIndex)) {
      clearBlockDragState();
      return;
    }

    const normalizedInsertIndex = Math.max(0, Math.min(selectedBlocks.length, Math.round(requestedInsertIndex)));
    const toIndex = normalizedInsertIndex > fromIndex
      ? normalizedInsertIndex - 1
      : normalizedInsertIndex;

    if (toIndex !== fromIndex) {
      moveBlockToIndex(selectedPath, sourceBlockId, toIndex);
    }
    setSelectedBlockId(sourceBlockId);
    clearBlockDragState();
  };

  const selectedPagePreviewHref = selectedPath || '/';
  const selectedPathDirty = isPageDirty(selectedPath);

  const getBlockAdminNameDraftKey = (blockId) => `${selectedPath}:${String(blockId || '').trim()}`;
  const getBlockAdminNameInputValue = (block) => {
    const key = getBlockAdminNameDraftKey(block?.id);
    return Object.prototype.hasOwnProperty.call(blockAdminNameDrafts, key)
      ? blockAdminNameDrafts[key]
      : String(block?.adminName || '');
  };
  const handleBlockAdminNameChange = (block, value) => {
    const key = getBlockAdminNameDraftKey(block?.id);
    setBlockAdminNameDrafts((previous) => ({ ...previous, [key]: value }));
  };
  const commitBlockAdminName = (block) => {
    const key = getBlockAdminNameDraftKey(block?.id);
    const nextName = normalizeAdminBlockName(blockAdminNameDrafts[key]);
    const currentName = normalizeAdminBlockName(block?.adminName);
    if (nextName !== currentName && block?.id) {
      updateBlock(selectedPath, block.id, { adminName: nextName });
    }
    setBlockAdminNameDrafts((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };
  const selectedBlockOwnership = getBlockOwnershipVisual(selectedBlockMeta, devIdentity?.userId);
  const selectedBlockLockedByCurrentUser = selectedBlockOwnership.state === 'editing-self';
  const selectedBlockLockedByOther = selectedBlockOwnership.state === 'editing-other';
  const selectedBlockDraftedByOther = selectedBlockOwnership.state === 'drafted-other';
  const selectedPathSaveResult = summarizeSharedSaveResultForPath(lastSharedSaveResult, selectedPath);
  const selectedPathPublishResult = summarizeSharedPublishResultForPath(lastSharedPublishResult, selectedPath);
  const selectedPathHasPendingLocalDraft = Boolean(hasPendingExternalDrafts(selectedPath));
  const selectedPathDraftSyncPending = sharedContentSyncPending;
  const hasUnpublishedPageChanges = Boolean(
    selectedPathDirty
    || selectedPathHasPendingLocalDraft
    || selectedPathDraftSyncPending
    || selectedPathPublishSummary?.hasUnsavedChanges,
  );
  const blockInventoryLoading = selectedPathDraftSyncPending && selectedBlocks.length === 0;
  const blockInventoryStatusText = blockInventoryLoading
    ? 'Loading blocks from shared draft...'
    : selectedPathDraftSyncPending
      ? 'Refreshing block inventory from shared draft...'
      : '';
  const selectedBlockSaveConflict = selectedBlock && selectedPathSaveResult
    ? selectedPathSaveResult.blockedBlocks.find((entry) => entry.blockId === selectedBlock.id) || null
    : null;
  const selectedBlockWasSaved = Boolean(
    selectedBlock
    && selectedPathSaveResult
    && selectedPathSaveResult.savedBlockIds.includes(selectedBlock.id)
  );
  const selectedBlockHasSaveFeedback = Boolean(
    selectedPathSaveResult
    && (selectedPathSaveResult.error || selectedBlockSaveConflict || selectedBlockWasSaved)
  );
  const sharedSyncFailure = sharedSyncStatus?.lastError;
  const sharedSyncFailureLabel = sharedSyncFailure
    ? `${sharedSyncFailure.operation || 'Shared content sync'} failed${sharedSyncFailure.status ? ` (${sharedSyncFailure.status})` : ''}: ${sharedSyncFailure.message}${sharedSyncFailure.endpoint ? ` [${sharedSyncFailure.endpoint}]` : ''}`
    : '';
  const latestRevisionEntry = revisionEntries[0] || null;
  const pageSaveFeedback = sharedSyncFailureLabel
    ? sharedSyncFailureLabel
    : selectedPathSaveResult?.error
    ? `Last save failed${selectedPathSaveResult.updatedAt ? ` ${formatRelativeTime(selectedPathSaveResult.updatedAt)}` : ''}`
    : selectedPathSaveResult?.status === 'failed'
      ? 'Draft save failed; local changes are still here'
    : selectedPathSaveResult?.status === 'partially-saved'
      ? `Saved ${selectedPathSaveResult.savedBlockIds.length} block${selectedPathSaveResult.savedBlockIds.length === 1 ? '' : 's'}; ${selectedPathSaveResult.blockedBlocks.length} conflicting block${selectedPathSaveResult.blockedBlocks.length === 1 ? '' : 's'} skipped`
    : selectedPathSaveResult?.status === 'blocked'
        ? 'Draft save blocked; resolve ownership to continue'
    : selectedPathHasPendingLocalDraft
      ? 'In browser memory; not saved as a system draft yet.'
    : selectedPathDraftSyncPending
      ? 'Saving draft to shared content...'
    : selectedPathDirty
      ? 'Draft changes ready to save.'
    : hasUnpublishedPageChanges && selectedPathSaveResult
      ? `Draft saved to shared content: ${selectedPathSaveResult.savedBlockIds.length} block${selectedPathSaveResult.savedBlockIds.length === 1 ? '' : 's'} saved${selectedPathSaveResult.blockedBlocks.length ? `, ${selectedPathSaveResult.blockedBlocks.length} conflicting block${selectedPathSaveResult.blockedBlocks.length === 1 ? '' : 's'} skipped` : ''}${selectedPathSaveResult.updatedAt ? ` ${formatRelativeTime(selectedPathSaveResult.updatedAt)}` : ''}`
      : hasUnpublishedPageChanges && sharedSyncStatus?.lastAppliedAt
        ? `Draft synced to shared content ${formatRelativeTime(sharedSyncStatus.lastAppliedAt)}`
        : 'Live content is current.';
  const pagePublishFeedback = selectedPathPublishResult?.error === 'publish-blocked-by-other-draft'
    ? `Last publish blocked${selectedPathPublishResult.updatedAt ? ` ${formatRelativeTime(selectedPathPublishResult.updatedAt)}` : ''}`
    : sharedPublishStatus === 'SAVING_DRAFT'
      ? 'Saving draft before live publish...'
    : sharedPublishStatus === 'STATUS_UNKNOWN'
      ? 'Publish status unknown; verify before retrying'
    : sharedPublishStatus === 'VERIFYING'
      ? 'Verifying live publish...'
    : sharedPublishStatus === 'PUBLISHING'
      ? `${formatWorkflowScopeLabel('Publishing', selectedPathPublishSummary, 'Publishing live content...')}`
    : selectedPathPublishResult?.status === 'failed'
      ? 'Live publish failed; draft content was preserved'
    : selectedPathPublishResult?.status === 'partially-published'
      ? `Published ${selectedPathPublishResult.publishedBlockIds.length} block${selectedPathPublishResult.publishedBlockIds.length === 1 ? '' : 's'}; ${selectedPathPublishResult.blockedBlocks.length} blocked`
      : selectedPathPublishResult?.status === 'blocked'
        ? 'Live publish blocked; resolve ownership to continue'
    : selectedPathPublishResult?.error === 'already-live'
      ? 'Already live'
      : selectedPathPublishResult?.error
        ? `Last publish failed${selectedPathPublishResult.updatedAt ? ` ${formatRelativeTime(selectedPathPublishResult.updatedAt)}` : ''}`
        : selectedPathPublishResult
          ? `Last live publish: ${selectedPathPublishResult.publishedBlockIds.length} block${selectedPathPublishResult.publishedBlockIds.length === 1 ? '' : 's'}${selectedPathPublishResult.hasOrderChanges ? ', order' : ''}${selectedPathPublishResult.hasPageMetaChanges ? ', page details' : ''}${selectedPathPublishResult.updatedAt ? ` ${formatRelativeTime(selectedPathPublishResult.updatedAt)}` : ''}`
          : '';
  const draftScopeLabel = formatWorkflowScopeLabel('Draft save', selectedPathChangeSummary, 'Draft save: clean');
  const publishBlockedByOtherDraft = Boolean(selectedPathWorkflowActivity?.hasOtherActorDraft);
  const foreignPublishBlockIds = new Set(
    (Array.isArray(selectedPathWorkflowActivity?.otherActorBlocks) ? selectedPathWorkflowActivity.otherActorBlocks : [])
      .map((entry) => String(entry?.blockId || '').trim())
      .filter(Boolean),
  );
  const publishOrderChangedBlockIds = selectedPathPublishSummary?.isDeletionOnlyOrderChange
    ? []
    : (Array.isArray(selectedPathPublishSummary?.orderChangedBlockIds)
      ? selectedPathPublishSummary.orderChangedBlockIds
      : []);
  const publishablePageBlockIds = (Array.isArray(selectedPathPublishSummary?.changedBlockIds) ? selectedPathPublishSummary.changedBlockIds : [])
    .concat(publishOrderChangedBlockIds)
    .filter((blockId, index, blockIds) => blockIds.indexOf(blockId) === index)
    .filter((blockId) => !foreignPublishBlockIds.has(String(blockId || '').trim()));
  const blockedOrderChange = publishOrderChangedBlockIds
    .some((blockId) => foreignPublishBlockIds.has(String(blockId || '').trim()));
  const canPartiallyPublishPage = Boolean(
    publishBlockedByOtherDraft
    && !blockedOrderChange
    && !selectedPathPublishSummary?.hasPageMetaChanges
    && publishablePageBlockIds.length,
  );
  const publishScopeLabel = formatWorkflowScopeLabel(
    'Make live',
    selectedPathPublishSummary,
    'Make live: already live',
    canPartiallyPublishPage ? publishablePageBlockIds.length : null,
  );
  const hasMakeLiveChanges = selectedPathDirty
    || Boolean(selectedPathPublishSummary?.hasUnsavedChanges)
    || selectedPathHasPendingLocalDraft;
  const canMakeLive = (!publishBlockedByOtherDraft || canPartiallyPublishPage)
    && !pagePublishBusy
    && !sharedPublishBusy
    && hasMakeLiveChanges;
  const canPreviewSavedDraft = !selectedPathDirty
    && !selectedPathHasPendingLocalDraft
    && !selectedPathDraftSyncPending;

  useEffect(() => {
    if (selectedPathDirty) {
      setDraftSaveConfirmation(false);
    }
  }, [selectedPathDirty]);
  const canDiscardPageDraft = !draftDiscardBusy
    && !pagePublishBusy
    && !sharedPublishBusy
    && (selectedPathDirty
      || Boolean(selectedPathPublishSummary?.hasUnsavedChanges)
      || hasPendingExternalDrafts(selectedPath));
  const canDiscardSelectedBlockDraft = Boolean(
    selectedBlock
    && !draftDiscardBusy
    && selectedPathPublishSummary?.changedBlockIds?.includes(selectedBlock.id),
  );
  const makeLiveTitle = publishBlockedByOtherDraft
    ? canPartiallyPublishPage
      ? `Make live will publish ${publishablePageBlockIds.length} eligible block${publishablePageBlockIds.length === 1 ? '' : 's'}; ${selectedPathWorkflowActivity?.otherActorBlockCount || 1} other-admin block${selectedPathWorkflowActivity?.otherActorBlockCount === 1 ? '' : 's'} will remain draft.`
      : `${selectedPathWorkflowActivity?.otherActorBlockCount || 1} other-admin block${selectedPathWorkflowActivity?.otherActorBlockCount === 1 ? '' : 's'} must be resolved before publishing live.`
    : hasMakeLiveChanges
      ? 'Save local edits if needed, then publish this page live.'
      : 'This page is already live.';
  const selectedBlockTakeoverLabel = selectedBlockOwnership.state === 'editing-other'
    ? 'Take over edit'
    : 'Take over draft';
  const changedBlockCount = Number(selectedPathChangeSummary?.changedBlockCount) || 0;
  const changedBlockLabel = changedBlockCount
    ? `${changedBlockCount} block${changedBlockCount === 1 ? '' : 's'} changed`
    : '';
  const pageStateLabel = selectedPathSaveResult?.status === 'partially-saved'
    || selectedPathSaveResult?.status === 'blocked'
    || selectedPathSaveResult?.status === 'failed'
    ? 'Needs attention'
    : pagePublishBusy || sharedPublishBusy
      ? 'In progress'
    : selectedPathDirty || selectedPathHasPendingLocalDraft || selectedPathDraftSyncPending
      ? 'In progress'
      : hasUnpublishedPageChanges
        ? 'Draft'
        : 'Live';
  const pageStateHeadline = selectedPathSaveResult?.status === 'partially-saved'
    ? 'Partially saved'
    : selectedPathSaveResult?.status === 'blocked'
      ? 'Unpublished changes'
      : selectedPathSaveResult?.status === 'failed'
        ? 'Save failed'
      : pagePublishBusy || sharedPublishBusy
        ? 'Publishing changes'
      : selectedPathDirty || selectedPathHasPendingLocalDraft || selectedPathDraftSyncPending
        ? 'Unsaved changes'
        : hasUnpublishedPageChanges
          ? 'Draft saved'
          : 'Live';
  const latestSharedBackupEntry = sharedBackupEntries[0] || null;

  const beginEditingBlock = (blockId, lockOptions = undefined) => {
    const normalizedBlockId = String(blockId || '').trim();
    if (!normalizedBlockId) {
      return;
    }
    const nextBlock = selectedBlocks.find((block) => block.id === normalizedBlockId) || null;
    const nextEditor = nextBlock ? getMigratedBlockEditorComponent(nextBlock.kind, 'admin') : null;
    setSelectedBlockId(normalizedBlockId);
    setInsertAtIndex(null);
    setPendingRemoveBlockId(null);
    if (!canBlockOpenEditor(nextBlock, nextEditor)) {
      setActiveEditorBlockId(null);
      return;
    }
    const lockResult = lockOptions
      ? setActiveBlockLock(selectedPath, normalizedBlockId, lockOptions)
      : setActiveBlockLock(selectedPath, normalizedBlockId);
    if (lockResult?.ok === false) {
      setActiveEditorBlockId((current) => (current === normalizedBlockId ? null : current));
      return;
    }
    setActiveEditorBlockId(normalizedBlockId);
  };

  const stopEditingSelectedBlock = () => {
    if (selectedPath && selectedBlock?.id) {
      clearActiveBlockLock(selectedPath, selectedBlock.id);
    }
    setActiveEditorBlockId((current) => (current === selectedBlock?.id ? null : current));
  };

  const toggleBlockVisibility = (block) => {
    if (!block?.id) {
      return;
    }
    updateBlock(selectedPath, block.id, { hidden: !toBoolean(block.hidden) });
  };

  const handleRemoveBlockAction = (block) => {
    const normalizedBlockId = String(block?.id || '').trim();
    if (!normalizedBlockId) {
      return;
    }
    if (pendingRemoveBlockId !== normalizedBlockId) {
      setPendingRemoveBlockId(normalizedBlockId);
      return;
    }
    clearActiveBlockLock(selectedPath, normalizedBlockId);
    removeBlock(selectedPath, normalizedBlockId);
    setPendingRemoveBlockId(null);
    setSelectedBlockId((current) => (current === normalizedBlockId ? null : current));
    setActiveEditorBlockId((current) => (current === normalizedBlockId ? null : current));
  };

  const handleSaveDraft = async () => {
    if (draftSaveBusy || pagePublishBusy || sharedPublishBusy) {
      return;
    }
    setDraftSaveBusy(true);
    try {
      const result = await saveSharedDraftNow(draftSaveNote);
      if (result?.ok) {
        setDraftSaveNote('');
        setDraftSaveConfirmation(true);
      } else {
        setDraftSaveConfirmation(false);
      }
    } finally {
      setDraftSaveBusy(false);
    }
  };

  const handleMakeLive = async () => {
    if (pagePublishBusy || sharedPublishBusy || !canMakeLive) {
      return;
    }
    const changedBlockIds = Array.isArray(selectedPathPublishSummary?.changedBlockIds)
      ? selectedPathPublishSummary.changedBlockIds
      : [];
    const changedLabels = changedBlockIds
      .map((blockId) => getAdminBlockLabel(selectedBlocks.find((block) => block.id === blockId) || { id: blockId }))
      .filter(Boolean);
    const scope = [
      changedLabels.length ? changedLabels.join(', ') : '',
      selectedPathPublishSummary?.hasOrderChanges ? 'block order' : '',
      selectedPathPublishSummary?.hasPageMetaChanges ? 'page details' : '',
    ].filter(Boolean).join('; ');
    if (typeof window !== 'undefined' && !window.confirm(
      `Make this page live? This publishes ${scope || 'the selected page changes'} for ${selectedPath}.`,
    )) {
      return;
    }
    setPagePublishBusy(true);
    try {
      const result = await publishSharedPageNow(selectedPath, draftSaveNote);
      if (result?.ok) {
        setDraftSaveNote('');
        setDraftSaveConfirmation(false);
        setActiveEditorBlockId(null);
      }
    } finally {
      setPagePublishBusy(false);
    }
  };

  const handleDiscardPageDraft = async () => {
    if (!selectedPath || !canDiscardPageDraft) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(
      `Discard unpublished changes for ${selectedPath}? This restores the page to its current published content and leaves live content unchanged.`,
    )) {
      return;
    }
    setDraftDiscardBusy(true);
    setDraftDiscardMessage('');
    try {
      const result = await discardSharedPageDraft(selectedPath, 'Page Admin draft discard');
      if (result?.ok === false) {
        setDraftDiscardMessage(result?.reason === 'discard-blocked-by-other-draft'
          ? 'Discard blocked by another admin draft. Take over that draft first.'
          : 'Draft discard failed. The current draft was preserved.');
        return;
      }
      setActiveEditorBlockId(null);
      setDraftSaveNote('');
      setDraftDiscardMessage(result?.discardResult?.status === 'no-op'
        ? 'No unpublished changes needed clearing.'
        : 'Unpublished changes discarded. Published content was not changed.');
    } finally {
      setDraftDiscardBusy(false);
    }
  };

  const handleDiscardSelectedBlockDraft = async () => {
    if (!selectedPath || !selectedBlock?.id || !canDiscardSelectedBlockDraft) {
      return;
    }
    const blockLabel = getAdminBlockLabel(selectedBlock);
    if (typeof window !== 'undefined' && !window.confirm(
      `Discard unpublished changes for ${blockLabel}? This restores only this block. Other drafts on ${selectedPath} remain unchanged.`,
    )) {
      return;
    }
    setDraftDiscardBusy(true);
    setDraftDiscardMessage('');
    try {
      const result = await discardSharedBlockDraft(
        selectedPath,
        selectedBlock.id,
        'Page Admin block draft discard',
      );
      if (result?.ok === false) {
        setDraftDiscardMessage(result?.reason === 'discard-blocked-by-other-draft'
          ? 'Block discard blocked by another admin draft. Take over that draft first.'
          : 'Block draft discard failed. The current block draft was preserved.');
        return;
      }
      setActiveEditorBlockId(null);
      setDraftDiscardMessage(result?.discardResult?.status === 'no-op'
        ? 'No unpublished changes needed clearing for this block.'
        : `${blockLabel} draft discarded. Other page drafts were not changed.`);
    } finally {
      setDraftDiscardBusy(false);
    }
  };

  const handlePreviewDraft = () => {
    if (!canPreviewSavedDraft) {
      return;
    }
    window.open(selectedPagePreviewHref, '_blank', 'noopener,noreferrer');
  };

  const handleMakeBlockLive = async (block) => {
    const normalizedBlockId = String(block?.id || '').trim();
    if (!selectedPath || !normalizedBlockId || blockPublishBusyId) {
      return;
    }
    setBlockPublishBusyId(normalizedBlockId);
    setBlockPublishMessage('');
    try {
      if (typeof window !== 'undefined' && !window.confirm(
        `Make only ${getAdminBlockLabel(block)} live on ${selectedPath}?`,
      )) {
        return;
      }
      const result = await publishSharedBlockNow(selectedPath, normalizedBlockId, 'Page Admin block publish');
      if (result?.ok) {
        setBlockPublishMessage(`${getAdminBlockLabel(block)} is live.`);
      } else {
        setBlockPublishMessage(getActionFailureMessage(result, `Unable to publish ${getAdminBlockLabel(block)}.`));
      }
    } finally {
      setBlockPublishBusyId('');
    }
  };

  const handleUndoLatestDraftChange = async () => {
    const previousRevision = revisionEntries[1] || null;
    if (!previousRevision || revisionActionBusy) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(
      `Revert this page to the previous saved draft from ${formatActorName(previousRevision.actor)}? It will remain a draft until published.`,
    )) {
      return;
    }
    setRevisionActionBusy(`undo:${previousRevision.id}`);
    setRevisionError('');
    try {
      const result = await restorePageRevision(selectedPath, previousRevision.id);
      if (result?.ok === false) {
        setRevisionError(getActionFailureMessage(result, 'Unable to revert the latest draft change right now.'));
      }
    } finally {
      setRevisionActionBusy('');
    }
  };

  const handleTakeOverOtherDrafts = async () => {
    const entries = Array.isArray(selectedPathWorkflowActivity?.otherActorBlocks)
      ? selectedPathWorkflowActivity.otherActorBlocks
      : [];
    if (!entries.length || ownershipActionBusy) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(
      `Take over ${entries.length} draft${entries.length === 1 ? '' : 's'} on this page? The current owners will remain in history.`,
    )) {
      return;
    }
    setOwnershipActionBusy(true);
    setOwnershipMessage('');
    try {
      for (const entry of entries) {
        const result = setActiveBlockLock(selectedPath, entry.blockId, { force: true });
        if (result?.ok === false) {
          setOwnershipMessage(`Could not take over ${entry.blockId}.`);
          return;
        }
      }
      setOwnershipMessage(`Took over ${entries.length} draft${entries.length === 1 ? '' : 's'}.`);
    } finally {
      setOwnershipActionBusy(false);
    }
  };

  const handleReleaseMyDrafts = async () => {
    const blockIds = Array.isArray(selectedPathWorkflowActivity?.currentActorBlockIds)
      ? selectedPathWorkflowActivity.currentActorBlockIds
      : [];
    if (!blockIds.length || ownershipActionBusy) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(
      `Release your draft ownership for ${blockIds.length} block${blockIds.length === 1 ? '' : 's'} on this page? Their current content will remain in the shared draft.`,
    )) {
      return;
    }
    setOwnershipActionBusy(true);
    setOwnershipMessage('');
    try {
      for (const blockId of blockIds) {
        const result = await releaseActiveBlockDraft(selectedPath, blockId);
        if (result?.ok === false) {
          setOwnershipMessage(`Could not release ${blockId}.`);
          return;
        }
      }
      setOwnershipMessage(`Released ${blockIds.length} draft${blockIds.length === 1 ? '' : 's'}.`);
    } finally {
      setOwnershipActionBusy(false);
    }
  };

  const handleRestorePageRevision = async (revisionId) => {
    if (typeof window !== 'undefined' && !window.confirm(
      'Restore this entire page revision into the active draft? It will not be live until you publish the page.',
    )) {
      return;
    }
    setRevisionActionBusy(`page:${revisionId}`);
    setRevisionError('');
    try {
      const result = await restorePageRevision(selectedPath, revisionId);
      if (result?.ok === false) {
        setRevisionError(getActionFailureMessage(result, 'Unable to restore that page revision right now.'));
      }
    } finally {
      setRevisionActionBusy('');
    }
  };

  const handleRestoreSelectedBlocks = async (revisionId) => {
    const selectedBlockIds = Array.isArray(revisionBlockSelectionById?.[revisionId])
      ? revisionBlockSelectionById[revisionId]
      : [];
    if (!selectedBlockIds.length) {
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(
      `Restore ${selectedBlockIds.length} selected block${selectedBlockIds.length === 1 ? '' : 's'} into the active draft?`,
    )) {
      return;
    }
    setRevisionActionBusy(`blocks:${revisionId}`);
    setRevisionError('');
    try {
      for (const blockId of selectedBlockIds) {
        // The shared authority copies revision data into the current draft one block at a time.
        // Sequential restore keeps later restores based on the latest current draft state.
        const result = await restoreBlockRevision(selectedPath, revisionId, blockId);
        if (result?.ok === false) {
          setRevisionError(getActionFailureMessage(result, 'Unable to restore the selected block right now.'));
          break;
        }
      }
    } finally {
      setRevisionActionBusy('');
    }
  };

  const handleResetContentAdmin = async () => {
    if (typeof window !== 'undefined' && !window.confirm(
      'Reset the active admin content from the seed baseline? A backup will be created first, but current draft content will be replaced.',
    )) {
      return;
    }
    setSharedBackupActionBusy('reset');
    setSharedBackupError('');
    setSharedBackupMessage('');
    try {
      const result = await resetContentAdmin();
      if (result?.ok === false) {
        setSharedBackupError(getActionFailureMessage(result, 'Reset from seed did not complete.'));
        return;
      }
      await loadSharedBackups();
      setSharedBackupMessage('Seed reset complete. A backup was created automatically before reset.');
    } finally {
      setSharedBackupActionBusy('');
    }
  };

  const handleRestoreLastBackup = async () => {
    if (typeof window !== 'undefined' && !window.confirm(
      'Restore the most recent shared content backup into the active admin content? This changes the current draft and published snapshot authority.',
    )) {
      return;
    }
    setSharedBackupActionBusy('restore-last-backup');
    setSharedBackupError('');
    setSharedBackupMessage('');
    try {
      const result = await restoreLatestSharedContentBackup();
      if (result?.ok === false) {
        setSharedBackupError(getActionFailureMessage(result, 'Backup restore did not complete.'));
        return;
      }
      await loadSharedBackups();
      const restoredBackup = result?.restoredBackup || latestSharedBackupEntry;
      const restoredAt = formatAdminTimestamp(restoredBackup?.createdAt);
      setSharedBackupMessage(
        restoredAt
          ? `Restored shared content from backup saved ${restoredAt}.`
          : 'Restored the most recent shared content backup.',
      );
    } finally {
      setSharedBackupActionBusy('');
    }
  };

  const handlePromoteContentToSeed = async () => {
    if (typeof window !== 'undefined' && !window.confirm(
      'Promote the current shared admin content to the seed baseline? Future resets will use this content.',
    )) {
      return;
    }
    setSharedBackupActionBusy('promote-seed');
    setSharedBackupError('');
    setSharedBackupMessage('');
    try {
      const result = await promoteContentAdminToSeed();
      if (result?.ok === false) {
        setSharedBackupError(getActionFailureMessage(result, 'Promoting content to seed did not complete.'));
        return;
      }
      const promotedSeedBaseline = result?.promotedSeedBaseline || sharedSeedBaseline;
      const promotedAt = formatAdminTimestamp(promotedSeedBaseline?.createdAt);
      setSharedBackupMessage(
        promotedAt
          ? `Promoted current shared content to the seed baseline saved ${promotedAt}. Future resets will use it.`
          : 'Promoted current shared content to the seed baseline. Future resets will use it.',
      );
    } finally {
      setSharedBackupActionBusy('');
    }
  };

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell
        title="Admin: Content Blocks"
        source={pageByPath['/admin/content']?.source ?? null}
        showBadge={false}
      >
        <section className="admin-content-section">
          <div className="admin-content-grid-two">
            <div>
              <label htmlFor="admin-content-page-select" className="search-page-label">Page route</label>
              <div className="admin-route-link-search" ref={routeEditorRef}>
                {isRouteEditMode ? (
                  <input
                    id="admin-content-page-route-edit"
                    className="search-page-input"
                    autoFocus
                    type="text"
                    value={routePathDraft}
                    onChange={(event) => {
                      setRoutePathDraft(event.target.value);
                      if (routePathMessage) {
                        setRoutePathMessage('');
                        setRoutePathError(false);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setIsRouteEditMode(false);
                        setRoutePathDraft(selectedPath || '');
                        return;
                      }
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        const result = renamePagePath(selectedPath, routePathDraft);
                        if (!result?.ok) {
                          setRoutePathError(true);
                          setRoutePathMessage(result?.error || 'Route update failed.');
                          return;
                        }
                        setRoutePathError(false);
                        setRoutePathMessage(`Updated route to ${result.path}`);
                        applySelectedPath(result.path);
                        setIsRouteEditMode(false);
                      }
                    }}
                    placeholder="/services/example"
                    aria-label="Rename selected page route"
                  />
                ) : (
                  <select
                    id="admin-content-page-select"
                    className="search-page-input"
                    value={selectedPath}
                    onChange={(event) => {
                      applySelectedPath(event.target.value);
                    }}
                  >
                    {pageOptionsForSelect.map((page) => (
                      <option key={page.path} value={page.path}>{page.path} — {page.title}</option>
                    ))}
                  </select>
                )}
                <div className="admin-route-link-actions">
                  <button
                    type="button"
                    className="action-btn action-btn-outline admin-route-edit-btn"
                    title={isRouteEditMode
                      ? 'Save route change'
                      : 'Editing route updates managed internal links sitewide.'}
                    onClick={() => {
                      if (!isRouteEditMode) {
                        setRoutePathDraft(selectedPath || '');
                        setRoutePathMessage('');
                        setRoutePathError(false);
                        setIsRouteEditMode(true);
                        return;
                      }
                      const result = renamePagePath(selectedPath, routePathDraft);
                      if (!result?.ok) {
                        setRoutePathError(true);
                        setRoutePathMessage(result?.error || 'Route update failed.');
                        return;
                      }
                      setRoutePathError(false);
                      setRoutePathMessage(`Updated route to ${result.path}`);
                      applySelectedPath(result.path);
                      setIsRouteEditMode(false);
                    }}
                  >
                    {isRouteEditMode ? 'Save' : 'Update route'}
                  </button>
                </div>
              </div>
              {routePathMessage ? (
                <small style={{ color: routePathError ? '#b42318' : '#006f7c', display: 'block', marginTop: '0.35rem' }}>
                  {routePathMessage}
                </small>
              ) : null}
            </div>

            <div>
              <label htmlFor="admin-content-page-search" className="search-page-label">Quick find page</label>
              <input
                id="admin-content-page-search"
                className="search-page-input"
                value={pageSearch}
                onChange={(event) => setPageSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') {
                    return;
                  }
                  const target = findSearchTargetPage(pageSearch, filteredEditablePages);
                  if (!target) {
                    return;
                  }
                  event.preventDefault();
                  applySelectedPath(target.path);
                }}
                placeholder="Start typing page name or route"
              />
            </div>
          </div>
        </section>

        <section className="admin-content-section">
          {selectedPage ? (
            <div className="admin-breadcrumb-preview admin-breadcrumb-editor">
              <div className="admin-breadcrumb-editor-row">
                {breadcrumbEditMode === 'parent' ? (
                  <select
                    autoFocus
                    className="admin-breadcrumb-inline-select"
                    value={selectedPage.parentPath || ''}
                    aria-label="Breadcrumb parent route"
                    onChange={(event) => {
                      updatePageHierarchy(selectedPath, { parentPath: event.target.value || null });
                      setBreadcrumbEditMode(null);
                    }}
                    onBlur={() => setBreadcrumbEditMode(null)}
                  >
                    <option value="">No parent</option>
                    {parentOptions.map((page) => (
                      <option key={page.path} value={page.path}>{page.path} — {page.title}</option>
                    ))}
                  </select>
                ) : (
                  <button
                    type="button"
                    className="admin-breadcrumb-chip"
                    onClick={() => setBreadcrumbEditMode('parent')}
                    title={`Parent route: ${selectedPage.parentPath || 'No parent'}`}
                  >
                    {breadcrumbParentTrail.length
                      ? breadcrumbParentTrail.map((item) => item.label).join(' >> ')
                      : 'No parent'}
                  </button>
                )}

                <span className="admin-breadcrumb-separator" aria-hidden="true">≫</span>

                {breadcrumbEditMode === 'label' ? (
                  <input
                    autoFocus
                    className="admin-breadcrumb-inline-input"
                    value={selectedPage.breadcrumbLabel}
                    aria-label="Breadcrumb page label"
                    onChange={(event) => updatePageHierarchy(selectedPath, { breadcrumbLabel: event.target.value })}
                    onBlur={() => setBreadcrumbEditMode(null)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === 'Escape') {
                        event.currentTarget.blur();
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="admin-breadcrumb-chip is-current"
                    onClick={() => setBreadcrumbEditMode('label')}
                    title="Click to edit breadcrumb page label"
                  >
                    {selectedPage.breadcrumbLabel || breadcrumbCurrent?.label || 'Untitled page'}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <section className="admin-content-section admin-page-save-bar-wrap">
          <div className="admin-page-save-bar">
            <div className="admin-page-save-bar-copy">
              <div className="admin-page-save-bar-context">
                <div className="admin-page-save-bar-kicker">Page draft workspace</div>
                <strong>{selectedPage?.title || 'Selected page'}</strong>
                <span>{selectedPath || '/'}</span>
              </div>
              <div className="admin-page-save-bar-head">
                <strong>{pageStateHeadline}</strong>
                <span className={`admin-page-save-bar-status${selectedPathDirty ? ' is-dirty' : ''}`}>
                  {pageStateLabel}
                </span>
              </div>
              <div className="admin-page-save-bar-meta">
                {changedBlockLabel ? (
                  <span>{changedBlockLabel}</span>
                ) : null}
                {hasUnpublishedPageChanges ? <span>{draftScopeLabel}</span> : null}
                <span>{publishScopeLabel}</span>
                {selectedPathChangeSummary?.hasOrderChanges ? (
                  <span>Order changed</span>
                ) : null}
                {selectedPathChangeSummary?.hasPageMetaChanges ? (
                  <span>Page details changed</span>
                ) : null}
                {selectedPathPublishSummary?.hasUnsavedChanges ? (
                  <details className="admin-page-save-bar-details admin-page-save-bar-review-details">
                    <summary>Review changes</summary>
                    <div className="admin-page-save-bar-details-copy">
                      {selectedPathPublishSummary.changedBlockIds?.map((blockId) => {
                        const changedBlock = selectedBlocks.find((block) => block.id === blockId);
                        return <span key={blockId}>Changed: {getAdminBlockLabel(changedBlock || { id: blockId })}</span>;
                      })}
                      {selectedPathPublishSummary.hasOrderChanges ? <span>Block order</span> : null}
                      {selectedPathPublishSummary.hasPageMetaChanges ? <span>Page details</span> : null}
                    </div>
                  </details>
                ) : null}
                {selectedPathWorkflowActivity?.otherActorBlockCount ? (
                  <span>{selectedPathWorkflowActivity.otherActorBlockCount} other-admin block{selectedPathWorkflowActivity.otherActorBlockCount === 1 ? '' : 's'}</span>
                ) : null}
                {selectedPathWorkflowActivity?.otherActorBlocks?.length
                  || selectedPathWorkflowActivity?.currentActorBlockIds?.length ? (
                  <details className="admin-page-save-bar-details admin-page-save-bar-ownership-details">
                    <summary>Ownership</summary>
                    <div className="admin-page-save-bar-details-copy">
                      {selectedPathWorkflowActivity.otherActorBlocks.map((entry) => {
                        const ownedBlock = selectedBlocks.find((block) => block.id === entry.blockId);
                        const ownerName = formatActorName(entry.owner, 'Another admin');
                        return (
                          <span key={`${entry.blockId}:${entry.state}`}>
                            {getAdminBlockLabel(ownedBlock || { id: entry.blockId })}: {ownerName}
                          </span>
                        );
                      })}
                    </div>
                    <div className="admin-page-save-bar-ownership-actions">
                      {selectedPathWorkflowActivity.otherActorBlocks.length ? (
                        <button
                          type="button"
                          className="action-btn action-btn-outline"
                          onClick={handleTakeOverOtherDrafts}
                          disabled={ownershipActionBusy}
                        >
                          {ownershipActionBusy ? 'Working...' : 'Take over all drafts'}
                        </button>
                      ) : null}
                      {selectedPathWorkflowActivity.currentActorBlockIds?.length ? (
                        <button
                          type="button"
                          className="action-btn action-btn-outline"
                          onClick={handleReleaseMyDrafts}
                          disabled={ownershipActionBusy}
                        >
                          {ownershipActionBusy ? 'Working...' : 'Release my drafts'}
                        </button>
                      ) : null}
                    </div>
                  </details>
                ) : null}
                {ownershipMessage ? <span role="status">{ownershipMessage}</span> : null}
                {selectedPathSaveResult?.blockedBlocks.length ? (
                  <span>{selectedPathSaveResult.blockedBlocks.length} conflict{selectedPathSaveResult.blockedBlocks.length === 1 ? '' : 's'}</span>
                ) : null}
                {selectedPathPublishResult?.blockedBlocks.length ? (
                  <span>{selectedPathPublishResult.blockedBlocks.length} publish block{selectedPathPublishResult.blockedBlocks.length === 1 ? '' : 's'}</span>
                ) : null}
                {pageSaveFeedback ? (
                  <span
                    className={`admin-page-save-feedback${selectedPathSaveResult?.error ? ' is-error' : ''}`}
                    role="status"
                    aria-live="polite"
                  >
                    {pageSaveFeedback}
                  </span>
                ) : null}
                {pagePublishFeedback ? (
                  <span role="status" aria-live="polite">{pagePublishFeedback}</span>
                ) : null}
                <details className="admin-page-save-bar-details">
                  <summary>Details</summary>
                  <div className="admin-page-save-bar-details-copy">
                    {latestRevisionEntry?.actor?.displayName ? (
                      <span>
                        Last saved by {formatActorName(latestRevisionEntry.actor)}
                        {latestRevisionEntry?.createdAt ? ` ${formatRelativeTime(latestRevisionEntry.createdAt)}` : ''}
                      </span>
                    ) : (
                      <span>No shared revision saved yet for this page.</span>
                    )}
                    {latestRevisionEntry?.summary ? (
                      <span>Note: {latestRevisionEntry.summary}</span>
                    ) : null}
                    {selectedPathPublishResult?.receipt ? (
                      <span>
                        Receipt: {selectedPathPublishResult.receipt.scope === 'block' ? 'block' : 'page'} publish
                        {selectedPathPublishResult.receipt.blockId
                          ? ` (${selectedPathPublishResult.receipt.blockId})`
                          : ''}
                        {selectedPathPublishResult.receipt.actor?.displayName
                          ? ` by ${formatActorName(selectedPathPublishResult.receipt.actor)}`
                          : ''}
                        {selectedPathPublishResult.receipt.timestamp
                          ? ` ${formatAdminTimestamp(selectedPathPublishResult.receipt.timestamp)}`
                          : ''}
                        {selectedPathPublishResult.receipt.verification?.baseSnapshotMatches
                          ? ' · base verified'
                          : ' · verification unavailable'}
                      </span>
                    ) : null}
                  </div>
                </details>
              </div>
            </div>
            <div className="admin-page-save-bar-actions">
              <div className="admin-page-save-bar-primary-actions">
                <label className="admin-page-save-note">
                  <span>Describe this draft (optional)</span>
                  <input
                    type="text"
                    className="search-page-input admin-page-save-note-input"
                    value={draftSaveNote}
                    onChange={(event) => setDraftSaveNote(event.target.value)}
                    placeholder="What changed in this draft?"
                    aria-label="Draft save note (optional)"
                  />
                </label>
                <button
                  type="button"
                  className={`action-btn${draftSaveConfirmation ? ' admin-page-save-confirmed' : ''}`}
                  onClick={handleSaveDraft}
                  disabled={!selectedPathDirty || draftSaveConfirmation || draftSaveBusy || pagePublishBusy || sharedPublishBusy}
                >
                  {draftSaveBusy ? 'Saving…' : draftSaveConfirmation ? 'Draft saved' : 'Save all page drafts'}
                </button>
              </div>
              <div className="admin-page-save-bar-secondary-actions">
                <button
                  type="button"
                  className="action-btn action-btn-outline"
                  onClick={handlePreviewDraft}
                  disabled={!canPreviewSavedDraft}
                  title={canPreviewSavedDraft
                    ? 'Open the current saved draft preview.'
                    : 'Save the draft before opening its preview.'}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="action-btn action-btn-outline"
                  onClick={() => setHistoryDrawerOpen((current) => !current)}
                  aria-expanded={historyDrawerOpen}
                >
                  {historyDrawerOpen ? 'Hide history' : 'History'}
                </button>
                <button
                  type="button"
                  className="action-btn action-btn-outline"
                  onClick={handleMakeLive}
                  disabled={!canMakeLive}
                  title={makeLiveTitle}
                >
                  Make live
                </button>
                <button
                  type="button"
                  className="action-btn action-btn-danger"
                  onClick={handleDiscardPageDraft}
                  disabled={!canDiscardPageDraft}
                  title="Discard all unpublished changes on this page; live content remains unchanged."
                >
                  {draftDiscardBusy ? 'Discarding…' : 'Discard all page drafts'}
                </button>
              </div>
            </div>
          </div>
          <details className="admin-page-save-bar-advanced">
            <summary>Advanced / recovery</summary>
            <div className="admin-page-save-bar-advanced-actions">
              <button
                type="button"
                className="action-btn action-btn-outline"
                onClick={handlePromoteContentToSeed}
                disabled={sharedBackupActionBusy !== ''}
                title="Save the current shared admin content as the reset baseline."
              >
                Promote content to seed
              </button>
              <button
                type="button"
                className="action-btn action-btn-outline"
                onClick={handleRestoreLastBackup}
                disabled={!latestSharedBackupEntry || sharedBackupActionBusy !== ''}
                title={latestSharedBackupEntry
                  ? `Restore backup from ${formatAdminTimestamp(latestSharedBackupEntry.createdAt) || 'the latest saved backup'}`
                  : 'No shared backup is available yet.'}
              >
                Restore last backup
              </button>
              <button
                type="button"
                onClick={handleResetContentAdmin}
                className="action-btn action-btn-danger"
                disabled={sharedBackupActionBusy !== ''}
              >
                Reset from seed
              </button>
            </div>
            <div className="admin-page-save-bar-warning">
              <p>
                Reset from seed replaces saved admin content with code defaults. A backup will be created automatically before reset.
              </p>
              <p>
                Promote content to seed updates that reset baseline to the current shared admin content after it has been approved.
              </p>
              <div className="admin-page-save-bar-warning-meta">
                {sharedBackupsLoading ? <span>Loading backups…</span> : null}
                {!sharedBackupsLoading && sharedSeedBaseline?.createdAt ? (
                  <span>
                    Current promoted seed: {formatAdminTimestamp(sharedSeedBaseline.createdAt) || sharedSeedBaseline.timestamp}
                  </span>
                ) : null}
                {!sharedBackupsLoading && latestSharedBackupEntry ? (
                  <span>
                    Latest backup: {formatAdminTimestamp(latestSharedBackupEntry.createdAt) || latestSharedBackupEntry.timestamp}
                  </span>
                ) : null}
                {sharedBackupMessage ? <span>{sharedBackupMessage}</span> : null}
                {sharedBackupError ? <span className="is-error">{sharedBackupError}</span> : null}
                {draftDiscardMessage ? <span>{draftDiscardMessage}</span> : null}
              </div>
            </div>
          </details>
          {historyDrawerOpen ? (
            <div className="admin-page-history-drawer">
              <div className="admin-page-history-drawer-head">
                <div>
                  <h3>Revision history</h3>
                  <p>
                    Restore a full page or selected blocks into the active draft. Nothing is published automatically,
                    and the current draft is backed up before a restore.
                  </p>
                </div>
                {revisionEntries.length > 1 ? (
                  <button
                    type="button"
                    className="action-btn action-btn-outline"
                    onClick={handleUndoLatestDraftChange}
                    disabled={Boolean(revisionActionBusy)}
                  >
                    {revisionActionBusy?.startsWith('undo:') ? 'Reverting…' : 'Undo latest draft change'}
                  </button>
                ) : null}
              </div>
              {revisionLoading ? (
                <p className="blank-state-note">Loading revision history…</p>
              ) : revisionError ? (
                <p className="blank-state-note">{revisionError}</p>
              ) : revisionEntries.length ? (
                <div className="admin-page-history-list">
                  {revisionEntries.map((revision) => {
                    const selectedRevisionBlocks = Array.isArray(revisionBlockSelectionById?.[revision.id])
                      ? revisionBlockSelectionById[revision.id]
                      : [];
                    const revisionBlocks = Array.isArray(revision.blocks) ? revision.blocks : [];
                    return (
                      <article key={revision.id} className="admin-page-history-card">
                        <div className="admin-page-history-card-head">
                          <div className="admin-page-history-card-copy">
                            <strong>{formatActorName(revision.actor)}</strong>
                            <span>
                              Saved {revision.createdAt ? formatRelativeTime(revision.createdAt) : 'recently'}
                              {revision.summary ? ` · ${revision.summary}` : ''}
                            </span>
                            <span>{summarizeRevisionBlocks(revisionBlocks)}</span>
                          </div>
                          <div className="admin-page-history-card-actions">
                            <button
                              type="button"
                              className="action-btn action-btn-outline"
                              onClick={() => handleRestorePageRevision(revision.id)}
                              disabled={Boolean(revisionActionBusy)}
                            >
                              {revisionActionBusy === `page:${revision.id}` ? 'Restoring…' : 'Restore page to draft'}
                            </button>
                          </div>
                        </div>
                        {revisionBlocks.length ? (
                          <div className="admin-page-history-block-picker">
                            <div className="admin-page-history-block-list">
                              {revisionBlocks.map((block) => {
                                const checked = selectedRevisionBlocks.includes(block.id);
                                return (
                                  <label key={`${revision.id}-${block.id}`} className="admin-page-history-block-option">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(event) => {
                                        setRevisionBlockSelectionById((previous) => {
                                          const current = Array.isArray(previous?.[revision.id]) ? previous[revision.id] : [];
                                          const next = event.target.checked
                                            ? [...new Set([...current, block.id])]
                                            : current.filter((value) => value !== block.id);
                                          return {
                                            ...previous,
                                            [revision.id]: next,
                                          };
                                        });
                                      }}
                                    />
                                    <span>{block.label}</span>
                                    <small>{block.kind}</small>
                                  </label>
                                );
                              })}
                            </div>
                            <div className="admin-page-history-block-actions">
                              <button
                                type="button"
                                className="action-btn action-btn-outline"
                                onClick={() => handleRestoreSelectedBlocks(revision.id)}
                                disabled={!selectedRevisionBlocks.length || Boolean(revisionActionBusy)}
                              >
                                {revisionActionBusy === `blocks:${revision.id}`
                                  ? 'Restoring blocks…'
                                  : `Restore selected blocks${selectedRevisionBlocks.length ? ` (${selectedRevisionBlocks.length})` : ''}`}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="blank-state-note">No revisions saved yet for this page.</p>
              )}
            </div>
          ) : null}
        </section>

        <section className="admin-content-section">
          <h3>Blocks</h3>
          {blockInventoryStatusText ? (
            <p className="admin-block-inventory-status" role="status" aria-live="polite">
              <span className="admin-block-inventory-spinner" aria-hidden="true" />
              {blockInventoryStatusText}
            </p>
          ) : null}
          <div className="table-scroll">
            <table className="data-table data-table--inputs">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Type</th>
                  <th>Visible</th>
                  <th>Layer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {blockInventoryLoading ? (
                  Array.from({ length: 3 }, (_, index) => (
                    <tr key={`block-inventory-loading-${index + 1}`} className="admin-block-loading-row">
                      <td colSpan={5}>
                        <span className="admin-block-loading-line" />
                      </td>
                    </tr>
                  ))
                ) : null}
                {Array.from({ length: selectedBlocks.length + 1 }, (_, insertIndex) => (
                  <Fragment key={`insert-slot-${insertIndex}`}>
                    <tr
                      className={`admin-block-insert-row${insertAtIndex === insertIndex ? ' is-open' : ''}${draggingBlockId && dragOverInsertIndex === insertIndex ? ' is-drag-target' : ''}`}
                      onDragOver={(event) => {
                        if (!draggingBlockId || insertAtIndex !== null) {
                          return;
                        }
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        if (dragOverInsertIndex !== insertIndex) {
                          setDragOverInsertIndex(insertIndex);
                        }
                      }}
                      onDrop={(event) => {
                        if (!draggingBlockId || insertAtIndex !== null) {
                          return;
                        }
                        handleBlockDropAtInsertIndex(event, insertIndex);
                      }}
                    >
                      <td colSpan={5}>
                        {insertAtIndex === insertIndex ? (
                          <div className="admin-block-insert-editor">
                            <div className="admin-block-insert-picker" role="radiogroup" aria-label="Select block family or preset to insert">
                              <input
                                type="search"
                                className="admin-block-template-search"
                                value={insertTemplateSearch}
                                onChange={(event) => setInsertTemplateSearch(event.target.value)}
                                placeholder="Filter block families and presets..."
                                aria-label="Filter block families and presets"
                              />
                              <div className="admin-block-template-grid">
                                {filteredInsertChoices.map((choice) => {
                                  const isSelected = insertChoiceId === choice.id;
                                  const iconSrc = getBlockTemplateIcon({ templateId: choice.templateId, kind: choice.kind });
                                  return (
                                    <button
                                      key={choice.id}
                                      type="button"
                                      role="radio"
                                      aria-checked={isSelected}
                                      className={`admin-block-template-tile${isSelected ? ' is-active' : ''}`}
                                      onClick={() => setInsertChoiceId(choice.id)}
                                      title={`${choice.name} (${choice.kind}${choice.templateId ? ` · ${choice.templateId}` : ''})`}
                                    >
                                      <span className="admin-block-template-icon-wrap" aria-hidden="true">
                                        {iconSrc ? (
                                          <img src={iconSrc} alt="" className="admin-block-template-icon" />
                                        ) : (
                                          <span className="admin-block-kind-icon">
                                            {toBlockKindMonogram(choice.kind)}
                                          </span>
                                        )}
                                      </span>
                                      <span className="admin-block-template-name">{choice.name}</span>
                                      <span className="admin-block-template-kind">
                                        {choice.description}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              {!filteredInsertChoices.length ? (
                                <p className="admin-block-template-empty">No blocks match that filter.</p>
                              ) : null}
                            </div>
                            <div className="admin-block-template-actions">
                              <button
                                type="button"
                                className="action-btn"
                                onClick={() => {
                                  const selectedInsertChoice = filteredInsertChoices.find((choice) => choice.id === insertChoiceId);
                                  if (!selectedInsertChoice?.createTemplateId) {
                                    return;
                                  }
                                  addBlock(selectedPath, selectedInsertChoice.createTemplateId, insertIndex);
                                  setInsertAtIndex(null);
                                  setInsertTemplateSearch('');
                                  setPendingRemoveBlockId(null);
                                  setSelectedBlockId(null);
                                }}
                              >
                                Add block
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn-outline"
                                onClick={() => {
                                  setInsertAtIndex(null);
                                  setInsertTemplateSearch('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="admin-block-insert-btn"
                            onClick={() => {
                              setInsertAtIndex(insertIndex);
                              setInsertTemplateSearch('');
                              setPendingRemoveBlockId(null);
                            }}
                            aria-label={`Insert block at position ${insertIndex + 1}`}
                            title="Insert block"
                          >
                            <AddBlockIcon />
                          </button>
                        )}
                      </td>
                    </tr>
                    {insertIndex < selectedBlocks.length ? (() => {
                      const block = selectedBlocks[insertIndex];
                      const blockIndex = insertIndex;
                      const blockLabel = getAdminBlockLabel(block);
                      return (
                        <tr
                          key={block.id}
                          onClick={() => {
                            setSelectedBlockId(block.id);
                            setInsertAtIndex(null);
                            setPendingRemoveBlockId(null);
                          }}
                          className={`admin-block-row${selectedBlock?.id === block.id ? ' admin-block-selected-row' : ''}${toBoolean(block.hidden) ? ' admin-block-hidden-row' : ''}${draggingBlockId === block.id ? ' is-dragging' : ''}`}
                        >
                          <td>
                            <div className="admin-block-name-cell">
                              {getBlockTemplateIcon({ templateId: block.id, kind: block.kind }) ? (
                                <span className="admin-block-kind-icon is-svg" aria-hidden="true">
                                  <img
                                    src={getBlockTemplateIcon({ templateId: block.id, kind: block.kind })}
                                    alt=""
                                    className="admin-block-kind-icon-image"
                                  />
                                </span>
                              ) : (
                                <span className="admin-block-kind-icon" aria-hidden="true">{toBlockKindMonogram(block.kind)}</span>
                              )}
                              <span className="admin-block-name-copy">
                                <span>{blockLabel}</span>
                                <input
                                  type="text"
                                  className="admin-block-admin-name-input"
                                  value={getBlockAdminNameInputValue(block)}
                                  maxLength={40}
                                  placeholder="Add admin name"
                                  aria-label={`Admin name for ${blockLabel}`}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) => handleBlockAdminNameChange(block, event.target.value)}
                                  onBlur={() => commitBlockAdminName(block)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      event.currentTarget.blur();
                                    }
                                  }}
                                />
                              </span>
                            </div>
                          </td>
                          <td>{block.kind}</td>
                          <td>
                            <button
                              type="button"
                              className={`admin-block-visibility-btn${toBoolean(block.hidden) ? ' is-hidden' : ''}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleBlockVisibility(block);
                              }}
                              aria-label={`${toBoolean(block.hidden) ? 'Show' : 'Hide'} ${blockLabel}`}
                              title={toBoolean(block.hidden) ? 'Currently hidden - click to show' : 'Currently visible - click to hide'}
                            >
                              <VisibilityIcon hidden={toBoolean(block.hidden)} />
                            </button>
                          </td>
                          <td>
                            <div className="admin-layer-order-controls" role="group" aria-label={`Reorder ${blockLabel}`}>
                              <span
                                role="button"
                                tabIndex={0}
                                className={`admin-layer-drag-handle${draggingBlockId === block.id ? ' is-active' : ''}`}
                                draggable
                                onClick={(event) => event.stopPropagation()}
                                onDragStart={(event) => {
                                  event.stopPropagation();
                                  handleBlockDragStart(event, block.id);
                                }}
                                onDragEnd={(event) => {
                                  event.stopPropagation();
                                  clearBlockDragState();
                                }}
                                aria-label={`Drag to reorder ${blockLabel}`}
                                title="Drag to reorder"
                                onKeyDown={(event) => {
                                  if (event.key !== 'Enter' && event.key !== ' ') {
                                    return;
                                  }
                                  event.preventDefault();
                                }}
                              >
                                ≡
                              </span>
                              <button
                                type="button"
                                className="admin-layer-order-btn"
                                disabled={blockIndex === 0}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveBlock(selectedPath, block.id, 'up');
                                }}
                                aria-label={`Move ${blockLabel} up`}
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="admin-layer-order-btn"
                                disabled={blockIndex === selectedBlocks.length - 1}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveBlock(selectedPath, block.id, 'down');
                                }}
                                aria-label={`Move ${blockLabel} down`}
                                title="Move down"
                              >
                                ↓
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="admin-block-row-actions">
                              <button
                                type="button"
                                className="action-btn action-btn-outline admin-block-edit-entry-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  beginEditingBlock(block.id);
                                }}
                                disabled={!canBlockOpenEditor(block, getMigratedBlockEditorComponent(block.kind, 'admin'))}
                                aria-label={`Edit ${blockLabel}`}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })() : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-content-section">
          {selectedBlock ? (
            <>
              <div className="admin-selected-block-head">
                <p>
                  Selected block
                  {' '}
                  <strong>{getAdminBlockLabel(selectedBlock)}</strong>
                </p>
                <div className="admin-selected-block-meta">
                  {!selectedBlockIsEditing && canEditSelectedBlock ? (
                    <span>Inspecting only until you click Edit.</span>
                  ) : null}
                </div>
                {selectedBlockHasSaveFeedback ? (
                  <div className={`admin-selected-block-save-banner${selectedPathSaveResult.error ? ' is-error' : selectedBlockSaveConflict ? ' is-conflict' : ' is-success'}`}>
                    <div className="admin-selected-block-save-copy">
                      {selectedPathSaveResult.error ? (
                        <span>Shared save failed. Local changes were not confirmed on the host authority.</span>
                      ) : selectedBlockWasSaved ? (
                        <span>
                          This block is saved.
                          {!selectedBlockLockedByCurrentUser ? ' No active edit lock remains.' : ''}
                          {selectedPathSaveResult.updatedAt ? ` ${formatRelativeTime(selectedPathSaveResult.updatedAt)}.` : ''}
                        </span>
                      ) : (
                        <span>
                          No safe changes for this block were saved.
                          {selectedPathSaveResult.updatedAt ? ` ${formatRelativeTime(selectedPathSaveResult.updatedAt)}.` : ''}
                        </span>
                      )}
                      {selectedBlockSaveConflict ? (
                        <span>
                          This block was not included in the last save.
                        </span>
                      ) : null}
                    </div>
                    {selectedBlockSaveConflict ? (
                      <button
                        type="button"
                        className="action-btn action-btn-outline"
                        onClick={() => setActiveBlockLock(selectedPath, selectedBlock.id, { force: true })}
                      >
                        {selectedBlockTakeoverLabel}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {selectedBlockIsEditing ? (
                <div className="admin-selected-block-edit-toolbar" aria-label="Block edit toolbar">
                  <button
                    type="button"
                    className="action-btn action-btn-outline"
                    onClick={stopEditingSelectedBlock}
                  >
                    Done editing
                  </button>
                  <button
                    type="button"
                    className="action-btn action-btn-outline"
                    onClick={() => handleMakeBlockLive(selectedBlock)}
                    disabled={selectedBlockLockedByOther
                      || selectedBlockDraftedByOther
                      || !selectedPathPublishSummary?.changedBlockIds?.includes(selectedBlock.id)
                      || Boolean(blockPublishBusyId)}
                    title="Publish only this block without publishing the rest of the page."
                  >
                    {blockPublishBusyId === selectedBlock.id ? 'Publishing...' : 'Make block live'}
                  </button>
                  <button
                    type="button"
                    className="action-btn action-btn-danger"
                    onClick={handleDiscardSelectedBlockDraft}
                    disabled={!canDiscardSelectedBlockDraft}
                    title="Discard this block's unpublished changes only."
                  >
                    {draftDiscardBusy ? 'Discarding…' : 'Discard block draft'}
                  </button>
                  <button
                    type="button"
                    className={`action-btn action-btn-danger admin-selected-block-remove-btn${pendingRemoveBlockId === selectedBlock.id ? ' is-confirm' : ''}`}
                    onClick={() => handleRemoveBlockAction(selectedBlock)}
                  >
                    {pendingRemoveBlockId === selectedBlock.id ? 'Confirm delete block' : 'Delete block'}
                  </button>
                </div>
              ) : null}
              {blockPublishMessage ? (
                <p className="admin-selected-block-action-message" role="status">{blockPublishMessage}</p>
              ) : null}
              {selectedBlockIsEditing && canEditSelectedBlock ? (
                <div className="admin-block-fields-editor">
                  {selectedBlock.mode === 'dynamic' && MigratedSelectedBlockEditor ? (
                    <MigratedSelectedBlockEditor
                      key={selectedBlock.id}
                      block={selectedBlock}
                      pathname={selectedPath}
                      routeOptions={routeLinkOptions}
                      testimonialsLibrary={testimonialsLibrary}
                      sourceRevision={sharedSnapshotUpdatedAt || 0}
                      onSettingChange={(settingKey, nextValue) => stageLocalBlockSetting(selectedBlock.id, settingKey, nextValue)}
                    />
                  ) : (
                    <FieldControlGrid
                      fields={selectedBlock.editableFields}
                      settings={selectedBlock.settings}
                      className={selectedBlock.kind === 'top_strip' ? 'admin-top-strip-grid' : ''}
                      routeOptions={routeLinkOptions}
                      sourceRevision={sharedSnapshotUpdatedAt || 0}
                      onSettingChange={(settingKey, nextValue) => {
                        stageLocalBlockSetting(selectedBlock.id, settingKey, nextValue);
                      }}
                    />
                  )}
                </div>
              ) : canEditSelectedBlock ? (
                <div className="admin-selected-block-inspect-card">
                  <div className="admin-selected-block-inspect-head">
                    <span className="admin-selected-block-inspect-type">
                      {selectedBlock.mode === 'dynamic' ? 'Dynamic block' : 'Static block'}
                    </span>
                    <span className="admin-selected-block-inspect-kind">{selectedBlock.kind}</span>
                  </div>
                  {getAdminBlockInspectSummary(selectedBlock) ? (
                    <p className="admin-selected-block-inspect-summary">{getAdminBlockInspectSummary(selectedBlock)}</p>
                  ) : (
                    <p className="admin-selected-block-inspect-summary">Review the block, then click Edit when you want live controls and collaboration ownership to begin.</p>
                  )}
                  <div className="admin-selected-block-inspect-actions">
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => beginEditingBlock(selectedBlock.id)}
                    >
                      Edit block
                    </button>
                    {selectedBlockLockedByOther || selectedBlockDraftedByOther ? (
                      <button
                        type="button"
                        className="action-btn action-btn-outline"
                        onClick={() => beginEditingBlock(selectedBlock.id, { force: true })}
                      >
                        {selectedBlockTakeoverLabel}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="action-btn action-btn-outline"
                      onClick={() => toggleBlockVisibility(selectedBlock)}
                    >
                      {toBoolean(selectedBlock.hidden) ? 'Show block' : 'Hide block'}
                    </button>
                    <button
                      type="button"
                      className={`action-btn action-btn-outline admin-selected-block-remove-btn${pendingRemoveBlockId === selectedBlock.id ? ' is-confirm' : ''}`}
                      onClick={() => handleRemoveBlockAction(selectedBlock)}
                    >
                      {pendingRemoveBlockId === selectedBlock.id ? 'Confirm delete block' : 'Delete block'}
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn-outline"
                      onClick={() => setHistoryDrawerOpen(true)}
                    >
                      History
                    </button>
                    <button
                      type="button"
                      className="action-btn action-btn-danger"
                      onClick={handleDiscardSelectedBlockDraft}
                      disabled={!canDiscardSelectedBlockDraft}
                      title="Discard this block's unpublished changes only."
                    >
                      {draftDiscardBusy ? 'Discarding…' : 'Discard block draft'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-selected-block-inspect-card">
                  <p className="blank-state-note">
                    {selectedBlock.mode === 'static'
                      ? 'This legacy snapshot block is not currently editable.'
                      : 'This dynamic block does not have custom fields yet.'}
                  </p>
                </div>
              )}
              {recentPageHistory.length ? (
                <div className="admin-block-history">
                  <h4>Recent page activity</h4>
                  <ul className="admin-block-history-list">
                    {recentPageHistory.map((entry) => (
                      <li key={entry.id} className="admin-block-history-item">
                        <strong>{formatActorName(entry.actor)}</strong>
                        {' '}
                        <span>{entry.action.replace(/-/g, ' ')}</span>
                        {entry.blockId ? <span> · {entry.blockId}</span> : null}
                        {entry.previousActor ? <span> · from {formatActorName(entry.previousActor)}</span> : null}
                        {entry.details ? <span> · {entry.details}</span> : null}
                        <time>{formatRelativeTime(entry.createdAt)}</time>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <p className="blank-state-note">
              {blockInventoryLoading
                ? 'Blocks are loading from the shared draft.'
                : selectedBlocks.length
                ? 'Select a block to inspect it. Editing starts only after you click Edit.'
                : 'No blocks found for this page yet.'}
            </p>
          )}
        </section>
      </PageShell>
    </div>
  );
}
