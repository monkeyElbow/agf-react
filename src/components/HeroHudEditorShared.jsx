import { useEffect, useMemo, useRef, useState } from 'react';
import ColorPalette from './ColorPalette';
import BackgroundEditorPage from './BackgroundEditorPage';
import TextHighlightColorControls from './TextHighlightColorControls';
import { BillboardSlider } from './BillboardHudEditorPanel';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import {
  SEMANTIC_TEXT_COLOR_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
} from '../lib/colorSystem';
import {
  extractHeroLineColorToken,
  parseHeroRangeHighlights,
  resolveHeroLineDisplayClassName,
  resolveSelectionRangeColor,
} from '../lib/heroHudRanges';
import { resolveVisibleHeroLineKeys } from '../lib/heroEditorLines';
import { normalizeHeroTitleLetterSpacingEm } from '../lib/heroTitleSize';
import {
  HERO_PADDING_DEFAULT_REM,
  HERO_PADDING_MAX_REM,
  HERO_PADDING_MIN_REM,
  HERO_PADDING_STEP_REM,
  normalizeHeroPaddingRem,
} from '../lib/heroPadding';
import { EDITOR_DRAFT_FLUSH_EVENT } from '../lib/contentAdminTiming';
import { useOptionalContentAdmin } from '../context/ContentAdminContextCore';
import {
  createProtectedEditorDraft,
  isOlderEditorDraftRevision,
  normalizeEditorDraftRevision,
  shouldKeepProtectedEditorDraft,
} from '../lib/editorDraftProtection';

const HERO_JUSTIFY_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];
const HERO_BG_TONE_OPTIONS = Object.freeze([
  Object.freeze({ ...SURFACE_BG_TONE_OPTIONS[0], label: 'White' }),
  Object.freeze({ ...SURFACE_BG_TONE_OPTIONS[1], label: 'Sand Gradient' }),
  Object.freeze({ ...SURFACE_BG_TONE_OPTIONS[2], label: 'Blue Gradient' }),
  Object.freeze({ ...SURFACE_BG_TONE_OPTIONS[3], label: 'Super Grey Gradient' }),
]);
const HERO_LINE_TEXT_DRAFT_COMMIT_DELAY_MS = 320;
const HERO_INTERACTION_KEYUP_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

function readHeroLineDraftTexts(lines) {
  return (Array.isArray(lines) ? lines : []).reduce((next, line) => {
    const key = String(line?.key || '').trim();
    if (!key) {
      return next;
    }
    next[key] = String(line?.text || '');
    return next;
  }, {});
}

export function useBufferedHeroLineTextDrafts({
  lines,
  onCommitLineText,
  onDraftTextChange,
  commitDelayMs = HERO_LINE_TEXT_DRAFT_COMMIT_DELAY_MS,
  commitOnBlurOnly = false,
  sourceRevision = 0,
}) {
  const contentAdmin = useOptionalContentAdmin();
  const effectiveSourceRevision = sourceRevision || contentAdmin?.sharedSnapshotUpdatedAt || 0;
  const resolvedCommitDelayMs = Number.isFinite(Number(commitDelayMs))
    ? Number(commitDelayMs)
    : HERO_LINE_TEXT_DRAFT_COMMIT_DELAY_MS;
  const safeLines = Array.isArray(lines) ? lines : [];
  const lineKeys = useMemo(
    () => safeLines.map((line) => String(line?.key || '').trim()).filter(Boolean),
    [safeLines],
  );
  const externalDraftTexts = useMemo(
    () => readHeroLineDraftTexts(safeLines),
    [safeLines],
  );
  const [draftTexts, setDraftTexts] = useState(() => externalDraftTexts);
  const [dirtyLineKeys, setDirtyLineKeys] = useState([]);
  const draftTextsRef = useRef(draftTexts);
  const commitTimersRef = useRef(new Map());
  const protectedDraftTextsRef = useRef(new Map());
  const latestSourceRevisionRef = useRef(normalizeEditorDraftRevision(effectiveSourceRevision));

  useEffect(() => {
    draftTextsRef.current = draftTexts;
  }, [draftTexts]);

  useEffect(() => {
    latestSourceRevisionRef.current = Math.max(
      latestSourceRevisionRef.current,
      normalizeEditorDraftRevision(effectiveSourceRevision),
    );
  }, [effectiveSourceRevision]);

  useEffect(() => () => {
    commitTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    commitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    const normalizedSourceRevision = normalizeEditorDraftRevision(effectiveSourceRevision);
    if (isOlderEditorDraftRevision(normalizedSourceRevision, latestSourceRevisionRef.current)) {
      return;
    }
    setDraftTexts((current) => {
      let changed = false;
      const next = { ...current };
      lineKeys.forEach((lineKey) => {
        if (dirtyLineKeys.includes(lineKey)) {
          return;
        }
        const externalValue = externalDraftTexts[lineKey] ?? '';
        const protectedDraft = protectedDraftTextsRef.current.get(lineKey);
        if (protectedDraft) {
          if (shouldKeepProtectedEditorDraft(protectedDraft, normalizedSourceRevision)) {
            return;
          }
          protectedDraftTextsRef.current.delete(lineKey);
        }
        if ((current[lineKey] ?? '') === externalValue) {
          return;
        }
        next[lineKey] = externalValue;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [dirtyLineKeys, externalDraftTexts, lineKeys, effectiveSourceRevision]);

  useEffect(() => {
    setDirtyLineKeys((current) => {
      const next = current.filter((lineKey) => (
        (draftTexts[lineKey] ?? '') !== (externalDraftTexts[lineKey] ?? '')
      ));
      return current.length === next.length && current.every((lineKey, index) => lineKey === next[index])
        ? current
        : next;
    });
  }, [draftTexts, externalDraftTexts]);

  const commitLineDraft = (lineKey, explicitValue) => {
    const normalizedLineKey = String(lineKey || '').trim();
    if (!normalizedLineKey) {
      return;
    }
    const timerId = commitTimersRef.current.get(normalizedLineKey);
    if (timerId) {
      window.clearTimeout(timerId);
      commitTimersRef.current.delete(normalizedLineKey);
    }
    const nextValue = String(explicitValue ?? draftTextsRef.current[normalizedLineKey] ?? '');
    protectedDraftTextsRef.current.set(
      normalizedLineKey,
      createProtectedEditorDraft(nextValue, effectiveSourceRevision),
    );
    onCommitLineText?.(normalizedLineKey, nextValue);
    onDraftTextChange?.(normalizedLineKey, nextValue);
  };

  const scheduleLineDraftCommit = (lineKey, nextValue) => {
    const normalizedLineKey = String(lineKey || '').trim();
    if (!normalizedLineKey) {
      return;
    }
    const timerId = commitTimersRef.current.get(normalizedLineKey);
    if (timerId) {
      window.clearTimeout(timerId);
    }
    commitTimersRef.current.set(normalizedLineKey, window.setTimeout(() => {
      commitLineDraft(normalizedLineKey, nextValue);
    }, resolvedCommitDelayMs));
  };

  const updateLineDraft = (lineKey, nextValue, { commitImmediately = false } = {}) => {
    const normalizedLineKey = String(lineKey || '').trim();
    if (!normalizedLineKey) {
      return;
    }
    const normalizedValue = String(nextValue ?? '');
    protectedDraftTextsRef.current.set(
      normalizedLineKey,
      createProtectedEditorDraft(normalizedValue, effectiveSourceRevision),
    );
    setDraftTexts((current) => (
      (current[normalizedLineKey] ?? '') === normalizedValue
        ? current
        : { ...current, [normalizedLineKey]: normalizedValue }
    ));
    setDirtyLineKeys((current) => (
      current.includes(normalizedLineKey) ? current : [...current, normalizedLineKey]
    ));
    onDraftTextChange?.(normalizedLineKey, normalizedValue);
    if (commitImmediately) {
      commitLineDraft(normalizedLineKey, normalizedValue);
      return;
    }
    if (commitOnBlurOnly) {
      return;
    }
    scheduleLineDraftCommit(normalizedLineKey, normalizedValue);
  };

  const commitLineDraftOnBlur = (lineKey) => {
    commitLineDraft(lineKey, draftTextsRef.current[String(lineKey || '').trim()] ?? '');
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const flushDrafts = () => {
      dirtyLineKeys.forEach((lineKey) => {
        commitLineDraft(lineKey, draftTextsRef.current[lineKey] ?? '');
      });
    };
    window.addEventListener(EDITOR_DRAFT_FLUSH_EVENT, flushDrafts);
    return () => window.removeEventListener(EDITOR_DRAFT_FLUSH_EVENT, flushDrafts);
  }, [dirtyLineKeys]);

  return {
    draftTexts,
    updateLineDraft,
    commitLineDraft,
    commitLineDraftOnBlur,
    isLineDirty: (lineKey) => dirtyLineKeys.includes(String(lineKey || '').trim()),
  };
}

function renderTextWithBreaks(source, keyPrefix) {
  const text = String(source || '');
  const parts = text.split('\n');
  const nodes = [];
  parts.forEach((part, index) => {
    nodes.push(<span key={`${keyPrefix}-text-${index + 1}`}>{part}</span>);
    if (index < parts.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${index + 1}`} />);
    }
  });
  return nodes;
}

export function renderHeroRangesAsNodes(source, ranges) {
  const text = String(source || '');
  const entries = Array.isArray(ranges) ? ranges : [];
  if (!text || !entries.length) {
    return renderTextWithBreaks(text, 'plain');
  }

  let normalized = entries
    .filter((range) => Number.isInteger(range?.start) && Number.isInteger(range?.end) && range.end > range.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  if (!normalized.length) {
    const lower = text.toLowerCase();
    let searchCursor = 0;
    normalized = entries
      .map((range) => {
        const tokenText = String(range?.text || '');
        const className = String(range?.className || '').trim();
        if (!tokenText || !className) {
          return null;
        }
        const index = lower.indexOf(tokenText.toLowerCase(), searchCursor);
        if (index < 0) {
          return null;
        }
        searchCursor = index + tokenText.length;
        return {
          start: index,
          end: index + tokenText.length,
          className,
        };
      })
      .filter(Boolean);
  }
  if (!normalized.length) {
    return renderTextWithBreaks(text, 'plain');
  }

  const pieces = [];
  let cursor = 0;
  let key = 0;
  const nextKey = (prefix) => {
    key += 1;
    return `${prefix}-${key}`;
  };

  normalized.forEach((range) => {
    const start = Math.max(0, Math.min(text.length, range.start));
    const end = Math.max(start, Math.min(text.length, range.end));
    if (start > cursor) {
      pieces.push(...renderTextWithBreaks(text.slice(cursor, start), nextKey('t')));
    }
    if (end > start) {
      pieces.push(
        <mark key={nextKey('m')} className={String(range.className || '').trim() || undefined}>
          {renderTextWithBreaks(text.slice(start, end), nextKey('mk'))}
        </mark>,
      );
      cursor = end;
    }
  });

  if (cursor < text.length) {
    pieces.push(...renderTextWithBreaks(text.slice(cursor), nextKey('t')));
  }
  return pieces;
}

export function buildHeroInlineLinesFromBlock(
  editableHeroBlock,
  { lineKeys = ['line1', 'line2', 'line3'], includeOptionalLine3 = false } = {},
) {
  const settings = editableHeroBlock?.settings && typeof editableHeroBlock.settings === 'object'
    ? editableHeroBlock.settings
    : null;
  if (!settings) {
    return [];
  }

  return resolveVisibleHeroLineKeys({ settings, lineKeys, includeOptionalLine3 })
    .map((lineKey, index) => {
      const text = String(settings[`${lineKey}Text`] || '');
      const className = String(settings[`${lineKey}ClassName`] || '').trim() || `line${index + 1}`;
      return {
        key: lineKey,
        label: `Line ${index + 1}`,
        placeholder: `Line ${index + 1} text`,
        text,
        className,
        lineColor: extractHeroLineColorToken(className),
        displayClassName: resolveHeroLineDisplayClassName(className, settings.bgTone, lineKey),
        highlights: parseHeroRangeHighlights(
          settings[`${lineKey}HighlightsJson`],
          text,
        ),
      };
    });
}

export function HeroInlineLiveEditor({
  lines,
  editableHeroBlock = null,
  lineKeys,
  includeOptionalLine3 = false,
  activeLineKey = '',
  fontSize,
  lineHeight,
  lineGap = 0,
  letterSpacing,
  placeholder = 'Type hero line text...',
  showPlaceholders = false,
  onLineTextChange,
  onLineDraftChange,
  onLineTextBlur,
  onLineInteract,
  setLineInputRef,
  renderLineContent,
  resolveLineClassName,
  resolveLineTagName,
  interactionOnly = false,
  commitOnBlurOnly = false,
  readOnly = false,
}) {
  const normalizedLetterSpacing = normalizeHeroTitleLetterSpacingEm(letterSpacing);
  const normalizedLineGap = Math.max(-0.18, Math.min(0.4, Number(Number(lineGap || 0).toFixed(2)) || 0));
  const safeLines = editableHeroBlock
    ? buildHeroInlineLinesFromBlock(editableHeroBlock, { lineKeys, includeOptionalLine3 })
    : (Array.isArray(lines) ? lines : []);
  const {
    draftTexts,
    updateLineDraft,
    commitLineDraftOnBlur,
  } = useBufferedHeroLineTextDrafts({
    lines: safeLines,
    onCommitLineText: onLineTextChange,
    onDraftTextChange: onLineDraftChange,
    commitOnBlurOnly,
  });
  const mergedLines = useMemo(() => (
    safeLines.map((line) => {
      const lineKey = String(line?.key || '').trim();
      return {
        ...line,
        text: lineKey ? String(draftTexts[lineKey] ?? line?.text ?? '') : String(line?.text || ''),
      };
    })
  ), [draftTexts, safeLines]);
  const nonEmptyLines = mergedLines.filter((line) => String(line?.text || '').trim());
  const activeLine = String(activeLineKey || '').trim()
    ? mergedLines.find((line) => String(line?.key || '').trim() === String(activeLineKey || '').trim())
    : null;
  const lineOrder = new Map(mergedLines.map((line, index) => [String(line?.key || `line-${index + 1}`), index]));
  const visibleLines = (() => {
    if (!mergedLines.length) {
      return [];
    }

    const base = nonEmptyLines.length ? [...nonEmptyLines] : [mergedLines[0]];
    if (activeLine && !base.some((line) => String(line?.key || '').trim() === String(activeLine?.key || '').trim())) {
      base.push(activeLine);
      base.sort((a, b) => (
        (lineOrder.get(String(a?.key || '')) ?? 0) - (lineOrder.get(String(b?.key || '')) ?? 0)
      ));
    }
    return base;
  })();

  const buildSelectionMeta = (target) => {
    const node = target && typeof target === 'object' ? target : null;
    const rawStart = Number(node?.selectionStart);
    const rawEnd = Number(node?.selectionEnd);
    const value = String(node?.value || '');
    if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
      return { value };
    }
    return {
      value,
      selectionStart: rawStart,
      selectionEnd: rawEnd,
    };
  };

  const notifyLineInteract = (lineKey, options = {}) => {
    const meta = buildSelectionMeta(options.target);
    if (options.clearCollapsed) {
      meta.clearCollapsed = true;
    }
    if (options.defer) {
      window.requestAnimationFrame(() => {
        onLineInteract?.(lineKey, meta);
      });
      return;
    }
    onLineInteract?.(lineKey, meta);
  };

  const shouldSyncInteractionOnKeyUp = (event) => {
    const key = String(event?.key || '');
    if (HERO_INTERACTION_KEYUP_KEYS.has(key)) {
      return true;
    }
    const lowerKey = key.toLowerCase();
    return lowerKey === 'a' && (event?.metaKey || event?.ctrlKey);
  };

  return (
    <div className={`admin-front-hud-hero-live-editor${interactionOnly ? ' is-interaction-layer' : ''}`}>
      {visibleLines.map((line, index) => (
        <div
          key={`hero-inline-${line.key || index + 1}`}
          className={`admin-front-hud-hero-live-line${index > 0 ? ' is-offset' : ''}`}
          style={{ marginTop: index > 0 && normalizedLineGap !== 0 ? `${normalizedLineGap}em` : undefined }}
        >
          {!interactionOnly ? (() => {
            const LineTag = typeof resolveLineTagName === 'function'
              ? (resolveLineTagName(line, index) || 'h1')
              : 'h1';
            const resolvedFontSize = typeof line?.fontSize === 'string' && line.fontSize.trim()
              ? line.fontSize.trim()
              : fontSize;
            const resolvedDisplayClassName = String(
              line.displayClassName || line.lineColor || line.className || '',
            ).trim();
            return (
              <LineTag
                className={typeof resolveLineClassName === 'function'
                  ? resolveLineClassName(line, index)
                  : (resolvedDisplayClassName || `line${index + 1}`)}
                style={{ lineHeight, fontSize: resolvedFontSize, letterSpacing: `${normalizedLetterSpacing}em` }}
              >
                {String(line.text || '').length
                  ? (typeof renderLineContent === 'function'
                    ? renderLineContent(line, index)
                    : renderHeroRangesAsNodes(line.text, line.highlights))
                  : (
                    showPlaceholders
                      ? <span className="admin-front-hud-hero-live-placeholder">{placeholder}</span>
                      : <span className="admin-front-hud-hero-live-placeholder is-empty" aria-hidden="true">&nbsp;</span>
                  )}
              </LineTag>
            );
          })() : null}
          <textarea
            ref={(node) => {
              if (typeof setLineInputRef === 'function') {
                setLineInputRef(line.key, node);
              }
            }}
            data-hero-line-key={line.key || undefined}
            rows={1}
            className="admin-front-hud-hero-live-input"
            value={String(line.text || '')}
            style={{
              lineHeight,
              fontSize: typeof line?.fontSize === 'string' && line.fontSize.trim()
                ? line.fontSize.trim()
                : fontSize,
              letterSpacing: `${normalizedLetterSpacing}em`,
            }}
            readOnly={readOnly}
            aria-readonly={readOnly}
            onFocus={(event) => notifyLineInteract(line.key, { target: event.currentTarget })}
            onSelect={(event) => notifyLineInteract(line.key, { target: event.currentTarget })}
            onMouseUp={(event) => notifyLineInteract(line.key, { defer: true, target: event.currentTarget })}
            onClick={(event) => notifyLineInteract(line.key, {
              target: event.currentTarget,
              clearCollapsed: true,
            })}
            onKeyUp={(event) => {
              if (!shouldSyncInteractionOnKeyUp(event)) {
                return;
              }
              notifyLineInteract(line.key, { defer: true, target: event.currentTarget });
            }}
            onChange={readOnly ? undefined : (event) => updateLineDraft(line.key, event.target.value)}
            onBlur={readOnly ? undefined : () => {
              commitLineDraftOnBlur(line.key);
              onLineTextBlur?.(line.key);
            }}
            spellCheck="false"
            aria-label={line.label || `Line ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

export function HeroHudEditorPanel({
  lines,
  editableHeroBlock = null,
  lineKeys,
  includeOptionalLine3 = false,
  activeLineKey,
  selection,
  driftReport,
  bgTone,
  justify,
  titleSizeRem,
  titleLetterSpacingEm,
  lineHeight,
  lineGap = 0,
  paddingTopRem = HERO_PADDING_DEFAULT_REM,
  paddingBottomRem = HERO_PADDING_DEFAULT_REM,
  lineColorOptions = SEMANTIC_TEXT_COLOR_OPTIONS,
  bgToneOptions = HERO_BG_TONE_OPTIONS,
  onLineTextChange,
  onLineTextBlur,
  onActivateLine,
  onApplyLineColor,
  onApplySelectionColor,
  onRemoveSpan,
  onClearLineSpans,
  onBgToneChange,
  backgroundEffectsJson,
  onBackgroundEffectsChange,
  onJustifyChange,
  onTitleSizeChange,
  onTitleLetterSpacingChange,
  onLineHeightChange,
  onPaddingTopRemChange,
  onPaddingBottomRemChange,
  canAddOptionalLine = false,
  onAddOptionalLine,
  canRemoveOptionalLine = false,
  onRemoveOptionalLine,
  blockOptions = null,
  children,
}) {
  const safeLines = editableHeroBlock
    ? buildHeroInlineLinesFromBlock(editableHeroBlock, { lineKeys, includeOptionalLine3 })
    : (Array.isArray(lines) ? lines : []);
  const lineInputRefs = useRef({});
  const [editorSelection, setEditorSelection] = useState({ line: '', start: 0, end: 0, text: '' });
  const editorSelectionRef = useRef({ line: '', start: 0, end: 0, text: '' });
  const paletteSelectionRef = useRef(null);
  const selectionTransactionRef = useRef(null);
  const [selectionInvalidated, setSelectionInvalidated] = useState(false);
  const hasExtraControls = Boolean(children);
  const [activeEditorSection, setActiveEditorSection] = useState('content');
  const editorSections = appendHudBlockOptionsSection([
    { id: 'content', label: 'Content', icon: 'Aa' },
    { id: 'background', label: 'Background', icon: '◌' },
    ...(hasExtraControls ? [{ id: 'actions', label: 'Actions', icon: '↗' }] : []),
    ], blockOptions);
  const hasSelectionRange = (candidate, lineKey = candidate?.line) => (
    candidate?.line === lineKey
    && Number.isInteger(candidate?.start)
    && Number.isInteger(candidate?.end)
    && candidate.end > candidate.start
    && Boolean(candidate.text)
  );
  const clearSelectionState = (lineKey = '') => {
    const currentLineKey = String(lineKey || editorSelectionRef.current?.line || activeLineKey || '').trim();
    const nextSelection = { line: currentLineKey, start: 0, end: 0, text: '' };
    selectionTransactionRef.current = null;
    paletteSelectionRef.current = null;
    editorSelectionRef.current = nextSelection;
    setSelectionInvalidated(true);
    setEditorSelection(nextSelection);
  };
  const recordSelection = (nextSelection) => {
    if (!hasSelectionRange(nextSelection)) {
      editorSelectionRef.current = nextSelection;
      setEditorSelection(nextSelection);
      return;
    }
    const normalized = { ...nextSelection };
    selectionTransactionRef.current = normalized;
    editorSelectionRef.current = normalized;
    setSelectionInvalidated(false);
    setEditorSelection(normalized);
  };
  const resolvedSelection = selectionInvalidated
    ? null
    : (hasSelectionRange(editorSelection, activeLineKey)
      ? editorSelection
      : (hasSelectionRange(selection, activeLineKey) ? selection : null));
  useEffect(() => {
    if (hasSelectionRange(selection)) {
      const normalized = { ...selection };
      selectionTransactionRef.current = normalized;
      editorSelectionRef.current = normalized;
      setSelectionInvalidated(false);
      setEditorSelection(normalized);
      return;
    }
    if (selection?.line) {
      clearSelectionState(selection.line);
    }
  }, [selection?.line, selection?.start, selection?.end, selection?.text]);
  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event?.target;
      if (!target || typeof target.closest !== 'function') {
        return;
      }
      if (target.closest('button[aria-label*="apply to selection"]')) {
        return;
      }
      const lineInput = target.closest('textarea[data-hero-line-key]');
      if (lineInput) {
        const lineKey = String(lineInput.getAttribute('data-hero-line-key') || '').trim();
        if (selectionTransactionRef.current?.line && selectionTransactionRef.current.line !== lineKey) {
          clearSelectionState(lineKey);
        }
        return;
      }
      clearSelectionState();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [activeLineKey]);
  const syncEditorSelection = (lineKey, { clearCollapsed = false } = {}) => {
    const input = lineInputRefs.current[lineKey];
    if (!input) {
      return;
    }
    const start = Number(input.selectionStart);
    const end = Number(input.selectionEnd);
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      return;
    }
    const nextSelection = {
      line: lineKey,
      start: Math.min(start, end),
      end: Math.max(start, end),
      text: String(input.value || '').slice(Math.min(start, end), Math.max(start, end)),
    };
    if (nextSelection.end <= nextSelection.start) {
      if (!clearCollapsed && hasSelectionRange(selectionTransactionRef.current, lineKey)) {
        editorSelectionRef.current = selectionTransactionRef.current;
        setEditorSelection(selectionTransactionRef.current);
        return;
      }
      clearSelectionState(lineKey);
      return;
    }
    recordSelection(nextSelection);
  };
  const readLiveEditorSelection = (lineKey) => {
    const input = lineInputRefs.current[lineKey];
    if (!input) {
      return editorSelectionRef.current;
    }
    const start = Number(input.selectionStart);
    const end = Number(input.selectionEnd);
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      return editorSelectionRef.current;
    }
    const normalizedStart = Math.min(start, end);
    const normalizedEnd = Math.max(start, end);
    const nextSelection = {
      line: lineKey,
      start: normalizedStart,
      end: normalizedEnd,
      text: String(input.value || '').slice(normalizedStart, normalizedEnd),
    };
    if (nextSelection.end > nextSelection.start) {
      recordSelection(nextSelection);
    }
    return nextSelection;
  };
  const resolvePaletteSelection = (lineKey) => {
    const liveSelection = readLiveEditorSelection(lineKey);
    if (hasSelectionRange(liveSelection, lineKey)) {
      return liveSelection;
    }
    return hasSelectionRange(selectionTransactionRef.current, lineKey)
      ? selectionTransactionRef.current
      : (hasSelectionRange(selection, lineKey) ? selection : liveSelection);
  };
  const renderLineColorControls = (line) => {
    const lineKey = String(line?.key || '').trim();
    const lineHighlights = Array.isArray(line?.highlights) ? line.highlights : [];
    const lineSelection = resolvedSelection?.line === lineKey ? resolvedSelection : null;
    const selectedText = String(lineSelection?.text || '');
    const hasLineSelection = Number.isInteger(lineSelection?.start)
      && Number.isInteger(lineSelection?.end)
      && lineSelection.end > lineSelection.start
      && Boolean(selectedText);
    const selectedTextPreview = selectedText.length > 28 ? `${selectedText.slice(0, 25)}...` : selectedText;
    const activeTextColorValue = hasLineSelection
      ? resolveSelectionRangeColor(lineHighlights, lineSelection.start, lineSelection.end)
      : String(line?.lineColor || '');

    return (
      <>
        <TextHighlightColorControls
          label={hasLineSelection
            ? `Selected Color "${selectedTextPreview}"`
            : `Core Color (${line.label || lineKey})`}
          ariaLabel={lineKey === safeLines[0]?.key
            ? 'Hero color controls'
            : `${line.label || lineKey} color controls`}
          options={lineColorOptions}
          value={activeTextColorValue}
          getOptionLabel={(option) => (
            `${option?.label || 'Color'} (${hasLineSelection ? 'apply to selection' : `apply to ${line.label || lineKey}`})`
          )}
          onPaletteMouseDown={(option, optionIndex, event) => {
            const paletteLabel = String(event?.currentTarget?.getAttribute?.('aria-label') || '');
            const nextSelection = paletteLabel.includes('apply to selection')
              ? resolvePaletteSelection(lineKey)
              : null;
            paletteSelectionRef.current = nextSelection;
          }}
          spanDetailsLabel=""
          onChange={(nextValue) => {
            onActivateLine?.(lineKey);
            const paletteSelection = paletteSelectionRef.current;
            const liveSelection = hasLineSelection
              ? (hasSelectionRange(paletteSelection, lineKey)
                ? paletteSelection
                : resolvePaletteSelection(lineKey))
              : null;
            paletteSelectionRef.current = null;
            const canApplyLiveSelection = liveSelection?.line === lineKey
              && Number.isInteger(liveSelection?.start)
              && Number.isInteger(liveSelection?.end)
              && liveSelection.end > liveSelection.start
              && liveSelection.text;
            const liveInput = lineInputRefs.current[lineKey];
            const liveText = liveInput ? String(liveInput.value || '') : String(line.text || '');
            if (canApplyLiveSelection) {
              onApplySelectionColor?.(lineKey, nextValue, {
                ...liveSelection,
                sourceText: liveText,
              });
              clearSelectionState(lineKey);
              return;
            }
            if (liveText !== String(line.text || '')) {
              onLineTextChange?.(lineKey, liveText);
            }
            onApplyLineColor?.(lineKey, nextValue);
            clearSelectionState(lineKey);
          }}
          sourceText={line.text}
          highlightRanges={lineHighlights}
          onRemoveSpan={(rangeIndex) => onRemoveSpan?.(lineKey, rangeIndex)}
          onClearSpans={() => onClearLineSpans?.(lineKey)}
        />
      </>
    );
  };
  return (
    <>
      <HeroDriftNotice driftReport={driftReport} />
      <HudEditorModelLayout
        className="admin-hero-hud-editor"
        sections={editorSections}
        activeSection={activeEditorSection}
        onSectionChange={(nextSection) => {
          clearSelectionState();
          setActiveEditorSection(nextSection);
        }}
        label="Hero editor sections"
      >
        <div className="admin-hero-hud-content-grid">
          <div
            className={`admin-front-hud-card admin-hero-hud-card admin-hero-hud-card--controls is-bg-${String(bgTone || 'white').trim() || 'white'}`}
            aria-label="Hero editor preview surface"
          >
            <div className="admin-front-hud-hero-top-controls">
              <div className="admin-hero-hud-line-inputs">
                {safeLines.map((line) => (
                  <div key={`hero-line-row-${line.key}`} className="admin-hero-hud-line-row">
                    <div className="admin-hero-hud-line-preview" aria-label={`${line.label || line.key} preview`}>
                      <span className="admin-front-hud-line-label">{line.label || line.key}</span>
                      <HeroInlineLiveEditor
                        lines={[{ ...line, label: `${line.label || line.key} text` }]}
                        activeLineKey={line.key}
                        lineHeight={lineHeight}
                        lineGap={lineGap}
                        letterSpacing={titleLetterSpacingEm}
                        placeholder={line.placeholder || `${line.label || line.key} text`}
                        showPlaceholders
                        onLineDraftChange={(lineKey) => clearSelectionState(lineKey)}
                        onLineTextChange={(lineKey, nextValue) => {
                          clearSelectionState(lineKey);
                          onLineTextChange?.(lineKey, nextValue);
                        }}
                        onLineTextBlur={(lineKey) => onLineTextBlur?.(lineKey)}
                        onLineInteract={(lineKey, interactionMeta) => {
                          if (editorSelectionRef.current?.line && editorSelectionRef.current.line !== lineKey) {
                            clearSelectionState(lineKey);
                          }
                          onActivateLine?.(lineKey);
                          const selectionStart = Number(interactionMeta?.selectionStart);
                          const selectionEnd = Number(interactionMeta?.selectionEnd);
                          const value = String(interactionMeta?.value || '');
                          const hasInteractionSelection = Number.isInteger(selectionStart) && Number.isInteger(selectionEnd);
                          if (hasInteractionSelection && selectionEnd > selectionStart) {
                            const nextSelection = {
                              line: lineKey,
                              start: Math.min(selectionStart, selectionEnd),
                              end: Math.max(selectionStart, selectionEnd),
                              text: value.slice(Math.min(selectionStart, selectionEnd), Math.max(selectionStart, selectionEnd)),
                            };
                            recordSelection(nextSelection);
                          }
                          if (!hasInteractionSelection || selectionEnd <= selectionStart) {
                            syncEditorSelection(lineKey, {
                              clearCollapsed: Boolean(interactionMeta?.clearCollapsed),
                            });
                          }
                        }}
                        setLineInputRef={(lineKey, node) => {
                          lineInputRefs.current[lineKey] = node;
                        }}
                        renderLineContent={(previewLine) => renderHeroRangesAsNodes(previewLine.text, previewLine.highlights)}
                        resolveLineTagName={() => 'h2'}
                        resolveLineClassName={(previewLine) => (
                          `admin-hero-hud-live-heading ${previewLine.displayClassName || previewLine.lineColor || previewLine.className || ''}`.trim()
                        )}
                      />
                    </div>
                    <div className="admin-hero-hud-line-color">
                      <div className="admin-hero-hud-line-color-controls">
                        {renderLineColorControls(line)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-hero-hud-heading-tools">
                {canAddOptionalLine ? (
                  <button
                    type="button"
                    className="admin-front-hud-mini-action"
                    onClick={() => onAddOptionalLine?.()}
                  >
                    Add Line 3
                  </button>
                ) : null}
                {canRemoveOptionalLine ? (
                  <button
                    type="button"
                    className="admin-front-hud-mini-action"
                    onClick={() => onRemoveOptionalLine?.()}
                  >
                    Hide Line 3
                  </button>
                ) : null}
                <div className="admin-front-hud-row is-inline-compact">
                  <span>Align</span>
                  <div className="admin-front-hud-segment">
                    {HERO_JUSTIFY_OPTIONS.map((option) => (
                      <button
                        key={`hero-justify-${option.value}`}
                        type="button"
                        className={`admin-front-hud-segment-btn${justify === option.value ? ' is-active' : ''}`}
                        onClick={() => onJustifyChange?.(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="admin-front-hud-card admin-hero-hud-card admin-hero-hud-card--type">
            <BillboardSlider
              label="Headline Size"
              ariaLabel="Hero headline size"
              value={titleSizeRem}
              min={4.5}
              max={9}
              step={0.1}
              displayValue={`${Number(titleSizeRem || 0).toFixed(1)}rem`}
              onChange={onTitleSizeChange}
            />
            <BillboardSlider
              label="Text Line Height"
              ariaLabel="Hero text line height"
              value={lineHeight}
              min={0.72}
              max={1.2}
              step={0.01}
              displayValue={`${Number(lineHeight || 0).toFixed(2)}em`}
              onChange={onLineHeightChange}
            />
            <BillboardSlider
              label="Headline Tracking"
              ariaLabel="Hero headline tracking"
              value={normalizeHeroTitleLetterSpacingEm(titleLetterSpacingEm)}
              min={-0.08}
              max={0.04}
              step={0.005}
              displayValue={`${normalizeHeroTitleLetterSpacingEm(titleLetterSpacingEm).toFixed(3)}em`}
              onChange={onTitleLetterSpacingChange}
            />
            <BillboardSlider
              label="Top Padding"
              ariaLabel="Hero top padding"
              value={normalizeHeroPaddingRem(paddingTopRem)}
              min={HERO_PADDING_MIN_REM}
              max={HERO_PADDING_MAX_REM}
              step={HERO_PADDING_STEP_REM}
              displayValue={`${normalizeHeroPaddingRem(paddingTopRem).toFixed(2)}rem`}
              onChange={onPaddingTopRemChange}
            />
            <BillboardSlider
              label="Bottom Padding"
              ariaLabel="Hero bottom padding"
              value={normalizeHeroPaddingRem(paddingBottomRem)}
              min={HERO_PADDING_MIN_REM}
              max={HERO_PADDING_MAX_REM}
              step={HERO_PADDING_STEP_REM}
              displayValue={`${normalizeHeroPaddingRem(paddingBottomRem).toFixed(2)}rem`}
              onChange={onPaddingBottomRemChange}
            />
          </div>
        </div>
        {activeEditorSection === 'background' ? (
          <div className="admin-hero-hud-background-page admin-hero-hud-card admin-hero-hud-card--background">
            <BackgroundEditorPage
              backgroundTone={bgTone}
              backgroundToneOptions={bgToneOptions}
              backgroundToneLabel="Hero background"
              onBackgroundToneChange={onBgToneChange}
              backgroundEffectsJson={backgroundEffectsJson}
              onBackgroundEffectsChange={onBackgroundEffectsChange}
              paletteVariant="hud"
            />
          </div>
        ) : null}
        {hasExtraControls ? (
          <div className="admin-front-hud-card admin-hero-hud-card admin-hero-hud-card--actions">
            <div className="admin-hero-hud-button-fields">
              {children}
            </div>
          </div>
        ) : null}
        <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
      </HudEditorModelLayout>
    </>
  );
}

export function HeroDriftNotice({ driftReport }) {
  return (
    null
  );
}
