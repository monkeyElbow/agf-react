import { useEffect, useMemo, useRef, useState } from 'react';
import ColorPalette from './ColorPalette';
import TextHighlightColorControls from './TextHighlightColorControls';
import AdminNumberInput from './AdminNumberInput';
import {
  SEMANTIC_TEXT_COLOR_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
} from '../lib/colorSystem';
import { resolveSelectionRangeColor } from '../lib/heroHudRanges';
import { normalizeHeroTitleLetterSpacingEm } from '../lib/heroTitleSize';

const HERO_JUSTIFY_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];
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
}) {
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

  useEffect(() => {
    draftTextsRef.current = draftTexts;
  }, [draftTexts]);

  useEffect(() => () => {
    commitTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    commitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    setDraftTexts((current) => {
      let changed = false;
      const next = { ...current };
      lineKeys.forEach((lineKey) => {
        if (dirtyLineKeys.includes(lineKey)) {
          return;
        }
        const externalValue = externalDraftTexts[lineKey] ?? '';
        if ((current[lineKey] ?? '') === externalValue) {
          return;
        }
        next[lineKey] = externalValue;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [dirtyLineKeys, externalDraftTexts, lineKeys]);

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

export function HeroInlineLiveEditor({
  lines,
  activeLineKey = '',
  fontSize,
  lineHeight,
  letterSpacing,
  placeholder = 'Type hero line text...',
  showPlaceholders = false,
  onLineTextChange,
  onLineDraftChange,
  onLineInteract,
  setLineInputRef,
  renderLineContent,
  resolveLineClassName,
  resolveLineTagName,
  commitOnBlurOnly = false,
  readOnly = false,
}) {
  const normalizedLetterSpacing = normalizeHeroTitleLetterSpacingEm(letterSpacing);
  const safeLines = Array.isArray(lines) ? lines : [];
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
    <div className="admin-front-hud-hero-live-editor">
      {visibleLines.map((line, index) => (
        <div
          key={`hero-inline-${line.key || index + 1}`}
          className={`admin-front-hud-hero-live-line${index > 0 ? ' is-offset' : ''}`}
        >
          {(() => {
            const LineTag = typeof resolveLineTagName === 'function'
              ? (resolveLineTagName(line, index) || 'h1')
              : 'h1';
            const resolvedFontSize = typeof line?.fontSize === 'string' && line.fontSize.trim()
              ? line.fontSize.trim()
              : fontSize;
            return (
              <LineTag
                className={typeof resolveLineClassName === 'function'
                  ? resolveLineClassName(line, index)
                  : (String(line.className || `line${index + 1}`).trim() || undefined)}
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
          })()}
          <textarea
            ref={(node) => {
              if (typeof setLineInputRef === 'function') {
                setLineInputRef(line.key, node);
              }
            }}
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
            onSelect={(event) => notifyLineInteract(line.key, { defer: true, target: event.currentTarget })}
            onMouseUp={(event) => notifyLineInteract(line.key, { defer: true, target: event.currentTarget })}
            onKeyUp={(event) => {
              if (!shouldSyncInteractionOnKeyUp(event)) {
                return;
              }
              notifyLineInteract(line.key, { defer: true, target: event.currentTarget });
            }}
            onChange={readOnly ? undefined : (event) => updateLineDraft(line.key, event.target.value)}
            onBlur={readOnly ? undefined : () => commitLineDraftOnBlur(line.key)}
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
  activeLineKey,
  selection,
  driftReport,
  bgTone,
  justify,
  titleSizeRem,
  titleLetterSpacingEm,
  lineHeight,
  onActivateLine,
  onApplyLineColor,
  onApplySelectionColor,
  onRemoveSpan,
  onClearLineSpans,
  onBgToneChange,
  onJustifyChange,
  onTitleSizeChange,
  onTitleLetterSpacingChange,
  onLineHeightChange,
  canAddOptionalLine = false,
  onAddOptionalLine,
  children,
}) {
  const safeLines = Array.isArray(lines) ? lines : [];
  const selectedLine = safeLines.find((line) => line.key === activeLineKey) || safeLines[0] || null;
  const selectedLineKey = selectedLine?.key || '';
  const selectedLineHighlights = Array.isArray(selectedLine?.highlights) ? selectedLine.highlights : [];
  const selectedText = String(selection?.text || '');
  const hasSelection = Number.isInteger(selection?.start)
    && Number.isInteger(selection?.end)
    && selection.end > selection.start
    && selectedText
    && selection?.line === selectedLineKey;
  const selectedTextPreview = selectedText.length > 28 ? `${selectedText.slice(0, 25)}...` : selectedText;
  const activeTextColorValue = hasSelection
    ? resolveSelectionRangeColor(selectedLineHighlights, selection.start, selection.end)
    : String(selectedLine?.lineColor || '');
  const hasExtraControls = Boolean(children);
  return (
    <>
      <HeroDriftNotice driftReport={driftReport} />
      <div className="admin-hero-hud-editor">
        <div className="admin-front-hud-card admin-hero-hud-card admin-hero-hud-card--controls">
          <div className="admin-front-hud-card-head">
            <h4>Lines</h4>
          </div>
          <div className="admin-front-hud-hero-top-controls">
            {safeLines.length > 1 ? (
              <div className="admin-front-hud-row is-inline-compact">
                <div className="admin-front-hud-segment">
                  {safeLines.map((line, index) => (
                    <button
                      key={`hero-active-line-${line.key}`}
                      type="button"
                      className={`admin-front-hud-segment-btn${selectedLineKey === line.key ? ' is-active' : ''}`}
                      onClick={() => onActivateLine?.(line.key)}
                    >
                      {line.label || `Line ${index + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {canAddOptionalLine ? (
              <button
                type="button"
                className="admin-front-hud-mini-action"
                onClick={() => onAddOptionalLine?.()}
              >
                Add Line 3
              </button>
            ) : null}
            <div className="admin-front-hud-row is-inline-compact">
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
          {selectedLine ? (
            <div className="admin-front-hud-field-group">
              <TextHighlightColorControls
                label={hasSelection
                  ? `Selection Color "${selectedTextPreview}"`
                  : `Core Color${selectedLine.label ? ` (${selectedLine.label})` : ''}`}
                ariaLabel={`Hero core color ${selectedLine.label || selectedLine.key || ''}`}
                options={SEMANTIC_TEXT_COLOR_OPTIONS}
                value={activeTextColorValue}
                onChange={(nextValue) => {
                  onActivateLine?.(selectedLine.key);
                  if (hasSelection) {
                    onApplySelectionColor?.(selectedLine.key, nextValue);
                    return;
                  }
                  onApplyLineColor?.(selectedLine.key, nextValue);
                }}
                sourceText={selectedLine.text}
                highlightRanges={selectedLineHighlights}
                onRemoveSpan={(rangeIndex) => onRemoveSpan?.(selectedLine.key, rangeIndex)}
                onClearSpans={() => onClearLineSpans?.(selectedLine.key)}
              />
            </div>
          ) : null}
        </div>
        <div className="admin-front-hud-card admin-hero-hud-card admin-hero-hud-card--type">
          <div className="admin-front-hud-card-head">
            <h4>Appearance</h4>
          </div>
          <div className="admin-front-hud-row">
            <span>Background</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Hero background"
              options={SURFACE_BG_TONE_OPTIONS}
              value={bgTone}
              onChange={onBgToneChange}
            />
          </div>
          <label className="admin-front-hud-range">
            <span>Headline Size {Number(titleSizeRem || 0).toFixed(1)}rem</span>
            <div className="admin-front-hud-range-controls">
              <input
                type="range"
                min="4.5"
                max="9"
                step="0.1"
                value={String(titleSizeRem ?? 7)}
                onChange={(event) => onTitleSizeChange?.(Number(event.target.value))}
              />
              <AdminNumberInput
                min="4.5"
                max="9"
                step="0.1"
                value={String(titleSizeRem ?? 7)}
                onChange={(nextValue) => onTitleSizeChange?.(nextValue)}
              />
            </div>
          </label>
          <label className="admin-front-hud-range">
            <span>Text Line Height {Number(lineHeight || 0).toFixed(2)}em</span>
            <div className="admin-front-hud-range-controls">
              <input
                type="range"
                min="0.72"
                max="1.2"
                step="0.01"
                value={String(lineHeight ?? 0.9)}
                onChange={(event) => onLineHeightChange?.(Number(event.target.value))}
              />
              <AdminNumberInput
                min="0.72"
                max="1.2"
                step="0.01"
                value={String(lineHeight ?? 0.9)}
                onChange={(nextValue) => onLineHeightChange?.(nextValue)}
              />
            </div>
          </label>
          <label className="admin-front-hud-range">
            <span>Headline Tracking {normalizeHeroTitleLetterSpacingEm(titleLetterSpacingEm).toFixed(3)}em</span>
            <div className="admin-front-hud-range-controls">
              <input
                type="range"
                min="-0.08"
                max="0.04"
                step="0.005"
                value={String(normalizeHeroTitleLetterSpacingEm(titleLetterSpacingEm))}
                onChange={(event) => onTitleLetterSpacingChange?.(Number(event.target.value))}
              />
              <AdminNumberInput
                min="-0.08"
                max="0.04"
                step="0.005"
                value={String(normalizeHeroTitleLetterSpacingEm(titleLetterSpacingEm))}
                onChange={(nextValue) => onTitleLetterSpacingChange?.(nextValue)}
              />
            </div>
          </label>
        </div>
        {hasExtraControls ? (
          <div className="admin-front-hud-card admin-hero-hud-card admin-hero-hud-card--actions">
            <div className="admin-front-hud-card-head">
              <h4>Button</h4>
            </div>
            <div className="admin-hero-hud-button-fields">
              {children}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export function HeroDriftNotice({ driftReport }) {
  return (
    null
  );
}
