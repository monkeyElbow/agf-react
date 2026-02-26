import { useEffect, useMemo, useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import { useContentAdmin } from '../context/ContentAdminContext';
import { pageByPath, sitePages } from '../data/siteMap';

function sortPages(pages) {
  return [...pages].sort((a, b) => a.path.localeCompare(b.path));
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

const HERO_SWATCH_OPTIONS = [
  { value: 'is-atlantean', label: 'Blue', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
  { value: 'is-mango', label: 'Mango', swatch: 'linear-gradient(145deg, #f6b146 0%, #e8991f 100%)' },
  { value: 'is-melon', label: 'Melon', swatch: 'linear-gradient(145deg, #f48f7a 0%, #e56f58 100%)' },
  { value: 'is-super-grey', label: 'Super Grey', swatch: 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)' },
  { value: 'is-white', label: 'White', swatch: 'linear-gradient(145deg, #ffffff 0%, #ededed 100%)' },
  { value: '', label: 'Clear', shortLabel: 'Clear', hideSwatch: true },
];

const HERO_ANIMATION_PRESET_OPTIONS = [
  { value: 'default', label: 'Default entrance' },
  { value: 'none', label: 'No line animation' },
  { value: 'loans-unblur', label: 'Unblur + slide' },
];

const HERO_COLOR_CLASS_SET = new Set(HERO_SWATCH_OPTIONS.map((option) => option.value).filter(Boolean));

function normalizeHeroColorClass(value) {
  const token = String(value || '').trim();
  return HERO_COLOR_CLASS_SET.has(token) ? token : '';
}

function normalizeHeroRangeHighlights(items, text) {
  const sourceText = String(text || '');
  const max = sourceText.length;
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => ({
      start: Number.isFinite(Number(item?.start)) ? Math.max(0, Math.min(max, Number(item.start))) : null,
      end: Number.isFinite(Number(item?.end)) ? Math.max(0, Math.min(max, Number(item.end))) : null,
      className: normalizeHeroColorClass(item?.className),
    }))
    .filter((item) => Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start && item.className)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged = [];
  normalized.forEach((item) => {
    const prev = merged[merged.length - 1];
    if (!prev) {
      merged.push({ ...item });
      return;
    }
    if (item.start <= prev.end) {
      if (item.className === prev.className) {
        prev.end = Math.max(prev.end, item.end);
      } else if (item.end > prev.end) {
        merged.push({ ...item, start: prev.end });
      }
      return;
    }
    if (item.start === prev.end && item.className === prev.className) {
      prev.end = item.end;
      return;
    }
    merged.push({ ...item });
  });

  return merged.filter((item) => item.end > item.start);
}

function parseHeroRangeHighlights(value, lineText) {
  const source = typeof value === 'string' ? value.trim() : '';
  const text = String(lineText || '');
  if (!source) {
    return [];
  }

  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const hasRangeEntries = parsed.some((item) => (
      item
      && typeof item === 'object'
      && Number.isFinite(Number(item.start))
      && Number.isFinite(Number(item.end))
    ));

    if (hasRangeEntries) {
      return normalizeHeroRangeHighlights(parsed, text);
    }

    const lower = text.toLowerCase();
    let searchCursor = 0;
    const ranges = [];
    parsed.forEach((item) => {
      const needle = String(item?.text || '');
      const className = normalizeHeroColorClass(item?.className);
      if (!needle || !className) return;
      const idx = lower.indexOf(needle.toLowerCase(), searchCursor);
      if (idx < 0) return;
      ranges.push({ start: idx, end: idx + needle.length, className });
      searchCursor = idx + needle.length;
    });
    return normalizeHeroRangeHighlights(ranges, text);
  } catch {
    return [];
  }
}

function serializeHeroRangeHighlights(items, lineText) {
  const normalized = normalizeHeroRangeHighlights(items, lineText);
  if (!normalized.length) {
    return '';
  }
  const text = String(lineText || '');
  return JSON.stringify(normalized.map((item) => ({
    start: item.start,
    end: item.end,
    className: item.className,
    text: text.slice(item.start, item.end),
  })));
}

function remapHeroRangesForTextChange(ranges, prevText, nextText) {
  const from = String(prevText || '');
  const to = String(nextText || '');
  if (from === to) {
    return normalizeHeroRangeHighlights(ranges, to);
  }

  let prefix = 0;
  const maxPrefix = Math.min(from.length, to.length);
  while (prefix < maxPrefix && from[prefix] === to[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  const maxSuffix = Math.min(from.length - prefix, to.length - prefix);
  while (
    suffix < maxSuffix
    && from[from.length - 1 - suffix] === to[to.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const oldChangedStart = prefix;
  const oldChangedEnd = from.length - suffix;
  const delta = to.length - from.length;

  const remapped = [];
  (Array.isArray(ranges) ? ranges : []).forEach((range) => {
    if (!Number.isInteger(range?.start) || !Number.isInteger(range?.end) || range.end <= range.start) {
      return;
    }

    if (range.end <= oldChangedStart) {
      remapped.push({ ...range });
      return;
    }

    if (range.start >= oldChangedEnd) {
      remapped.push({
        ...range,
        start: range.start + delta,
        end: range.end + delta,
      });
      return;
    }

    // Range intersects the edited segment. Drop it instead of guessing.
  });

  return normalizeHeroRangeHighlights(remapped, to);
}

function replaceHeroRangeColor(ranges, start, end, className, lineText) {
  const text = String(lineText || '');
  const nextStart = Math.max(0, Math.min(text.length, Number(start) || 0));
  const nextEnd = Math.max(0, Math.min(text.length, Number(end) || 0));
  if (nextEnd <= nextStart) {
    return normalizeHeroRangeHighlights(ranges, text);
  }

  const remaining = [];
  (Array.isArray(ranges) ? ranges : []).forEach((range) => {
    if (!Number.isInteger(range?.start) || !Number.isInteger(range?.end) || range.end <= range.start) {
      return;
    }
    if (range.end <= nextStart || range.start >= nextEnd) {
      remaining.push({ ...range });
      return;
    }
    if (range.start < nextStart) {
      remaining.push({ ...range, end: nextStart });
    }
    if (range.end > nextEnd) {
      remaining.push({ ...range, start: nextEnd });
    }
  });

  const normalizedClass = normalizeHeroColorClass(className);
  if (normalizedClass) {
    remaining.push({ start: nextStart, end: nextEnd, className: normalizedClass });
  }

  return normalizeHeroRangeHighlights(remaining, text);
}

function HeroBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const inputRefs = useRef({});
  const [activeLine, setActiveLine] = useState('line1');
  const [selectionByLine, setSelectionByLine] = useState({
    line1: { start: 0, end: 0 },
    line2: { start: 0, end: 0 },
  });

  const line1Text = String(settings.line1Text ?? '');
  const line2Text = String(settings.line2Text ?? '');
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
  const heroLineGap = (() => {
    const numeric = Number(settings.lineGap);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.max(-0.2, Math.min(0.7, Number(numeric.toFixed(2))));
  })();
  const line1ClassName = String(settings.line1ClassName || '').trim();
  const line2ClassName = String(settings.line2ClassName || '').trim();
  const line1Highlights = useMemo(() => parseHeroRangeHighlights(settings.line1HighlightsJson, line1Text), [settings.line1HighlightsJson, line1Text]);
  const line2Highlights = useMemo(() => parseHeroRangeHighlights(settings.line2HighlightsJson, line2Text), [settings.line2HighlightsJson, line2Text]);
  const editableFields = Array.isArray(block.editableFields) ? block.editableFields : [];
  const heroAppearanceFields = editableFields.filter((field) => field.id === 'bgTone');

  const lineConfigs = [
    {
      key: 'line1',
      label: 'Line 1',
      placeholder: 'Line 1 text',
      text: line1Text,
      className: line1ClassName,
      highlights: line1Highlights,
    },
    {
      key: 'line2',
      label: 'Line 2',
      placeholder: 'Line 2 text',
      text: line2Text,
      className: line2ClassName,
      highlights: line2Highlights,
    },
  ];

  const lineByKey = {
    line1: lineConfigs[0],
    line2: lineConfigs[1],
  };

  const activeConfig = lineByKey[activeLine] || lineByKey.line1;
  const activeSelection = selectionByLine[activeLine] || { start: 0, end: 0 };
  const hasSelection = activeSelection.end > activeSelection.start;
  const selectedRangeColor = hasSelection
    ? (activeConfig.highlights.find((item) => item.start <= activeSelection.start && item.end >= activeSelection.end)?.className || '')
    : '';

  const syncSelection = (lineKey) => {
    const el = inputRefs.current[lineKey];
    if (!el) return;
    const start = Number.isFinite(el.selectionStart) ? el.selectionStart : 0;
    const end = Number.isFinite(el.selectionEnd) ? el.selectionEnd : start;
    setSelectionByLine((prev) => ({
      ...prev,
      [lineKey]: { start, end },
    }));
  };

  const updateLineText = (lineKey, nextText) => {
    const prevText = String(settings?.[`${lineKey}Text`] ?? '');
    const prevRanges = parseHeroRangeHighlights(settings?.[`${lineKey}HighlightsJson`], prevText);
    const remappedRanges = remapHeroRangesForTextChange(prevRanges, prevText, nextText);
    onSettingChange(`${lineKey}Text`, nextText);
    onSettingChange(`${lineKey}HighlightsJson`, serializeHeroRangeHighlights(remappedRanges, nextText));

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

  const applySwatch = (colorValue) => {
    const targetLine = activeLine || 'line1';
    const line = lineByKey[targetLine] || lineByKey.line1;
    if (!line) return;

    const el = inputRefs.current[targetLine];
    if (el) {
      el.focus();
      syncSelection(targetLine);
    }

    const currentSelection = (() => {
      if (!el) return selectionByLine[targetLine] || { start: 0, end: 0 };
      const start = Number.isFinite(el.selectionStart) ? el.selectionStart : 0;
      const end = Number.isFinite(el.selectionEnd) ? el.selectionEnd : start;
      return { start, end };
    })();

    if (currentSelection.end > currentSelection.start) {
      const nextRanges = replaceHeroRangeColor(
        line.highlights,
        currentSelection.start,
        currentSelection.end,
        colorValue,
        line.text,
      );
      onSettingChange(`${targetLine}HighlightsJson`, serializeHeroRangeHighlights(nextRanges, line.text));
      return;
    }

    onSettingChange(`${targetLine}ClassName`, colorValue);
  };

  const clearLineHighlights = (lineKey) => {
    onSettingChange(`${lineKey}HighlightsJson`, '');
  };

  const removeHighlightAtIndex = (lineKey, index) => {
    const line = lineByKey[lineKey];
    if (!line) return;
    const nextRanges = line.highlights.filter((_, itemIndex) => itemIndex !== index);
    onSettingChange(`${lineKey}HighlightsJson`, serializeHeroRangeHighlights(nextRanges, line.text));
  };

  return (
    <div className="admin-hero-editor">
      <div className="admin-hero-inline-controls">
        <label>
          <span>Hero animation</span>
          <select
            value={String(settings.animationPreset || 'default')}
            onChange={(event) => onSettingChange('animationPreset', event.target.value)}
          >
            {HERO_ANIMATION_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Hero justify</span>
          <select
            value={heroJustify}
            onChange={(event) => onSettingChange('justify', event.target.value)}
          >
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label>
          <span>Hero height</span>
          <select
            value={heroHeightMode}
            onChange={(event) => onSettingChange('heightMode', event.target.value)}
          >
            <option value="default">Default</option>
            <option value="custom">Custom (% viewport)</option>
          </select>
        </label>
        {heroHeightMode === 'custom' ? (
          <label className="admin-hero-inline-height-control">
            <span>Viewport height ({heroHeightSvh}%)</span>
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
              <input
                className="admin-hero-inline-height-number"
                type="number"
                min="20"
                max="90"
                step="1"
                value={heroHeightSvh}
                onChange={(event) => {
                  const nextRaw = event.target.value;
                  if (nextRaw === '') {
                    onSettingChange('heightSvh', '');
                    return;
                  }
                  onSettingChange('heightSvh', Number(nextRaw));
                }}
                aria-label="Hero height percent"
              />
              <span className="admin-hero-inline-height-unit">svh</span>
            </div>
          </label>
        ) : null}
        <label className="admin-hero-inline-height-control">
          <span>Line spacing (between lines) ({heroLineGap.toFixed(2)}em)</span>
          <div className="admin-hero-inline-height-row">
            <input
              type="range"
              min="-0.2"
              max="0.7"
              step="0.01"
              value={heroLineGap}
              onChange={(event) => onSettingChange('lineGap', Number(event.target.value))}
              aria-label="Hero line spacing between line 1 and line 2"
            />
            <input
              className="admin-hero-inline-height-number"
              type="number"
              min="-0.2"
              max="0.7"
              step="0.01"
              value={heroLineGap}
              onChange={(event) => {
                const nextRaw = event.target.value;
                if (nextRaw === '') {
                  onSettingChange('lineGap', '');
                  return;
                }
                onSettingChange('lineGap', Number(nextRaw));
              }}
              aria-label="Hero line spacing number"
            />
            <span className="admin-hero-inline-height-unit">em</span>
          </div>
        </label>
      </div>

      <PanelAppearanceControls
        fields={heroAppearanceFields}
        settings={settings}
        onSettingChange={onSettingChange}
        title="Hero appearance"
      />

      <div className="admin-hero-inline-line-control-row">
        {lineConfigs.map((line) => (
          <div key={`${line.key}-controls`} className="admin-hero-inline-line-control-item">
            <button
              type="button"
              className={`admin-hero-inline-line-tag${activeLine === line.key ? ' is-active' : ''}`}
              onClick={() => {
                setActiveLine(line.key);
                inputRefs.current[line.key]?.focus();
              }}
            >
              {line.label}
            </button>
            {line.highlights.length ? (
              <button
                type="button"
                className="admin-hero-inline-clear-highlights"
                onClick={() => clearLineHighlights(line.key)}
              >
                Clear spans
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className={`admin-hero-inline-stage is-bg-${heroBgTone} is-justify-${heroJustify}`} aria-label="Hero editor preview surface">
        {lineConfigs.map((line, index) => (
          <div
            key={line.key}
            className={`admin-hero-inline-line-wrap${activeLine === line.key ? ' is-active' : ''}`}
          >
            <div
              className={`admin-hero-inline-line-stage${line.className ? ` ${line.className}` : ''}`}
              style={index > 0 ? { marginTop: `${heroLineGap}em` } : undefined}
            >
              <div
                className={`admin-hero-inline-line-mirror${line.className ? ` ${line.className}` : ''}`}
                aria-hidden="true"
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
                className={`admin-hero-inline-line-input${line.className ? ` ${line.className}` : ''}`}
                value={line.text}
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

      <div className="admin-hero-inline-toolbar">
        <div className="admin-swatch-list is-compact admin-hero-inline-swatch-list" role="radiogroup" aria-label="Hero color controls">
          {HERO_SWATCH_OPTIONS.map((option) => {
            const activeValue = hasSelection ? selectedRangeColor : (activeConfig.className || '');
            const isActive = activeValue === option.value;
            return (
              <button
                key={`hero-inline-swatch-${option.value || 'clear'}`}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`admin-swatch-option${isActive ? ' is-active' : ''}${option.value === '' ? ' is-clear' : ''}`}
                onMouseDown={(event) => event.preventDefault()}
                title={hasSelection
                  ? `${option.label} (apply to selection)`
                  : `${option.label} (apply to ${activeConfig.label})`}
                onClick={() => applySwatch(option.value)}
              >
                {!option.hideSwatch ? (
                  <span className="admin-swatch-chip" aria-hidden="true" style={{ background: option.swatch || '#ddd' }} />
                ) : null}
                <span>{option.shortLabel || option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="admin-hero-inline-spans">
        {lineConfigs.map((line) => (
          <div key={`${line.key}-spans`} className="admin-hero-inline-spans-row">
            <p className="admin-hero-inline-spans-label">{line.label} spans</p>
            {line.highlights.length ? (
              <div className="admin-hero-inline-span-chip-list">
                {line.highlights.map((range, index) => {
                  const snippet = line.text.slice(range.start, range.end);
                  const swatch = HERO_SWATCH_OPTIONS.find((option) => option.value === range.className);
                  return (
                    <button
                      key={`${line.key}-span-${range.start}-${range.end}-${range.className}`}
                      type="button"
                      className="admin-hero-inline-span-chip"
                      onClick={() => removeHighlightAtIndex(line.key, index)}
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
              <p className="admin-hero-inline-spans-empty">No colored spans yet.</p>
            )}
          </div>
        ))}
      </div>
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
}) {
  const inputRef = useRef(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const value = String(text ?? '');
  const normalizedLineClass = String(lineClassName || '').trim();
  const highlights = useMemo(() => parseHeroRangeHighlights(highlightsJson, value), [highlightsJson, value]);
  const hasSelection = selection.end > selection.start;
  const selectedRangeColor = hasSelection
    ? (highlights.find((item) => item.start <= selection.start && item.end >= selection.end)?.className || '')
    : '';

  const syncSelection = () => {
    const el = inputRef.current;
    if (!el) return;
    const start = Number.isFinite(el.selectionStart) ? el.selectionStart : 0;
    const end = Number.isFinite(el.selectionEnd) ? el.selectionEnd : start;
    setSelection({ start, end });
  };

  const handleTextChange = (nextText) => {
    const prevText = value;
    const nextRanges = remapHeroRangesForTextChange(highlights, prevText, nextText);
    onTextChange(nextText);
    onHighlightsJsonChange(serializeHeroRangeHighlights(nextRanges, nextText));
    setSelection((prev) => ({
      start: Math.max(0, Math.min(nextText.length, prev.start)),
      end: Math.max(0, Math.min(nextText.length, prev.end)),
    }));
  };

  const applySwatch = (colorValue) => {
    const el = inputRef.current;
    if (el) {
      el.focus();
    }
    const currentSelection = (() => {
      if (!el) {
        return selection;
      }
      const start = Number.isFinite(el.selectionStart) ? el.selectionStart : 0;
      const end = Number.isFinite(el.selectionEnd) ? el.selectionEnd : start;
      return { start, end };
    })();

    if (currentSelection.end > currentSelection.start) {
      const nextRanges = replaceHeroRangeColor(
        highlights,
        currentSelection.start,
        currentSelection.end,
        colorValue,
        value,
      );
      onHighlightsJsonChange(serializeHeroRangeHighlights(nextRanges, value));
      setSelection(currentSelection);
      return;
    }

    onLineClassNameChange(colorValue);
  };

  const removeHighlightAtIndex = (index) => {
    const nextRanges = highlights.filter((_, itemIndex) => itemIndex !== index);
    onHighlightsJsonChange(serializeHeroRangeHighlights(nextRanges, value));
  };

  const clearHighlights = () => {
    onHighlightsJsonChange('');
  };

  const activeValue = hasSelection ? selectedRangeColor : normalizedLineClass;

  return (
    <div className={`admin-color-text-editor${className ? ` ${className}` : ''}`}>
      <div className="admin-color-text-editor-top">
        <span className="admin-color-text-editor-label">{label}</span>
        {highlights.length ? (
          <button type="button" className="admin-color-text-clear-spans" onClick={clearHighlights}>
            Clear spans
          </button>
        ) : null}
      </div>

      <textarea
        ref={inputRef}
        rows={rows}
        className="admin-color-text-input"
        value={value}
        placeholder={placeholder}
        onFocus={syncSelection}
        onClick={syncSelection}
        onSelect={syncSelection}
        onKeyUp={syncSelection}
        onMouseUp={syncSelection}
        onChange={(event) => handleTextChange(event.target.value)}
      />

      <div className="admin-color-text-preview-wrap">
        <p className={`admin-color-text-preview${normalizedLineClass ? ` ${normalizedLineClass}` : ''}`} aria-live="polite">
          {value
            ? renderPreviewHighlightedText(value, highlights)
            : <span className="admin-color-text-placeholder">{placeholder || 'Preview'}</span>}
        </p>
      </div>

      <div className="admin-swatch-list is-compact admin-color-text-swatch-list" role="radiogroup" aria-label={`${label} color controls`}>
        {HERO_SWATCH_OPTIONS.map((option) => {
          const isActive = activeValue === option.value;
          return (
            <button
              key={`${label}-${option.value || 'clear'}`}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`admin-swatch-option${isActive ? ' is-active' : ''}${option.value === '' ? ' is-clear' : ''}`}
              title={option.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applySwatch(option.value)}
            >
              {!option.hideSwatch ? (
                <span className="admin-swatch-chip" aria-hidden="true" style={{ background: option.swatch || '#ddd' }} />
              ) : null}
              <span>{option.shortLabel || option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="admin-color-text-spans">
        {highlights.length ? (
          <div className="admin-hero-inline-span-chip-list">
            {highlights.map((range, index) => {
              const snippet = value.slice(range.start, range.end);
              const swatch = HERO_SWATCH_OPTIONS.find((option) => option.value === range.className);
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
    </div>
  );
}

function FieldControlGrid({ fields, settings, onSettingChange, className = '' }) {
  const items = Array.isArray(fields) ? fields.filter(Boolean) : [];
  if (!items.length) {
    return null;
  }

  return (
    <div className={`admin-content-field-list${className ? ` ${className}` : ''}`}>
      {items.map((field) => (
        <label key={field.id} className={field.layout === 'half' ? 'is-half' : undefined}>
          <span>{field.label}</span>
          {renderFieldControl(field, settings?.[field.id], (nextValue) => {
            onSettingChange(field.id, nextValue);
          })}
        </label>
      ))}
    </div>
  );
}

function PanelAppearanceControls({ fields, settings, onSettingChange, title = 'Panel appearance' }) {
  const items = (Array.isArray(fields) ? fields : [])
    .filter(Boolean)
    .map((field) => (
      field.type === 'swatch'
        ? { ...field, compact: true }
        : field
    ));
  if (!items.length) {
    return null;
  }

  return (
    <section className="admin-panel-appearance">
      <div className="admin-panel-appearance-head">
        <h4>{title}</h4>
        <p>Reusable panel-level presentation controls.</p>
      </div>
      <FieldControlGrid
        fields={items}
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-content-field-list--inline admin-panel-appearance-grid"
      />
    </section>
  );
}

function IntroBlockEditor({ block, onSettingChange }) {
  const settings = block.settings || {};
  const allFields = Array.isArray(block.editableFields) ? block.editableFields : [];
  const fieldById = new Map(allFields.map((field) => [field.id, field]));
  const appearanceFields = ['bgTone', 'textTone']
    .map((id) => fieldById.get(id))
    .filter(Boolean);
  const contentFields = allFields.filter((field) => (
    field.id !== 'heading'
    && field.id !== 'bgTone'
    && field.id !== 'textTone'
  ));

  return (
    <div className="admin-intro-block-editor">
      <div className="admin-dynamic-panel-primary-grid">
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
        />

        <PanelAppearanceControls
          fields={appearanceFields}
          settings={settings}
          onSettingChange={onSettingChange}
        />
      </div>

      <FieldControlGrid
        fields={contentFields}
        settings={settings}
        onSettingChange={onSettingChange}
        className="admin-content-field-list--inline"
      />
    </div>
  );
}

function renderFieldControl(field, value, onChange) {
  if (field.type === 'boolean') {
    return (
      <select value={String(toBoolean(value))} onChange={(event) => onChange(event.target.value === 'true')}>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
      />
    );
  }

  if (field.type === 'select') {
    const options = Array.isArray(field.options) ? field.options : [];
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
    return (
      <div className={`admin-swatch-list${field.compact ? ' is-compact' : ''}`} role="radiogroup" aria-label={field.label}>
        {options.map((option) => {
          const active = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`admin-swatch-option${active ? ' is-active' : ''}`}
              title={option.label}
              onClick={() => onChange(option.value)}
            >
              <span className="admin-swatch-chip" aria-hidden="true" style={{ background: option.swatch || '#ddd' }} />
              <span>{field.compact ? (option.shortLabel || option.label) : option.label}</span>
            </button>
          );
        })}
      </div>
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
            <div className="admin-highlight-color-swatches" role="radiogroup" aria-label={`${field.label} color ${index + 1}`}>
              {options.map((option) => {
                const active = item.className === option.value;
                return (
                  <button
                    key={`${field.id}-${index}-${option.value}`}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`admin-highlight-swatch-btn${active ? ' is-active' : ''}`}
                    title={option.label}
                    onClick={() => {
                      const nextItems = [...items];
                      nextItems[index] = { ...nextItems[index], className: option.value };
                      updateItems(nextItems);
                    }}
                  >
                    <span className="admin-highlight-swatch-chip" aria-hidden="true" style={{ background: option.swatch || '#ddd' }} />
                    <span className="admin-highlight-swatch-label">{option.label}</span>
                  </button>
                );
              })}
            </div>
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
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return <input type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />;
}

export default function AdminContentPage() {
  const editablePages = useMemo(
    () => sortPages(sitePages.filter((page) => !page.path.startsWith('/admin/') && page.path !== '/search')),
    [],
  );

  const [selectedPath, setSelectedPath] = useState(editablePages[0]?.path || '/');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [breadcrumbEditMode, setBreadcrumbEditMode] = useState(null);
  const [pageSearch, setPageSearch] = useState('');

  const {
    pageHierarchy,
    blocksByPath,
    updatePageHierarchy,
    updateBlock,
    updateBlockSetting,
    getBreadcrumbTrail,
    resetContentAdmin,
  } = useContentAdmin();

  const selectedPage = pageHierarchy[selectedPath] || null;
  const selectedBlocks = blocksByPath[selectedPath] || [];
  const selectedBlock = selectedBlocks.find((block) => block.id === selectedBlockId) || selectedBlocks[0] || null;
  const breadcrumbTrail = getBreadcrumbTrail(selectedPath);

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

  useEffect(() => {
    setBreadcrumbEditMode(null);
  }, [selectedPath]);

  return (
    <div className="page-wrap admin-content-page-wrap">
      <PageShell
        title="Admin: Content Blocks"
        source={pageByPath['/admin/content']?.source ?? null}
        showBadge={false}
        headerActions={(
          <button type="button" onClick={resetContentAdmin} className="action-btn action-btn-danger">
            Reset content admin state
          </button>
        )}
      >
        <div className="admin-info-note">
          Static-to-dynamic migration control center. Keep blocks `static` by default, then switch each block to
          `dynamic` when its admin editor is ready.
        </div>

        <section className="admin-content-section">
          <h3>1. Select Page</h3>
          <div className="admin-content-grid-two">
            <div>
              <label htmlFor="admin-content-page-select" className="search-page-label">Page route</label>
              <select
                id="admin-content-page-select"
                className="search-page-input"
                value={selectedPath}
                onChange={(event) => {
                  setSelectedPath(event.target.value);
                  setSelectedBlockId(null);
                }}
              >
                {pageOptionsForSelect.map((page) => (
                  <option key={page.path} value={page.path}>{page.path} — {page.title}</option>
                ))}
              </select>
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
                  setSelectedPath(target.path);
                  setSelectedBlockId(null);
                }}
                placeholder="Start typing page name or route"
              />
            </div>
          </div>
          <p className="blank-state-note">
            Type in Quick find to filter by title or route. Press Enter to jump to an exact / first matching page.
          </p>
        </section>

        <section className="admin-content-section">
          <h3>2. Breadcrumb Hierarchy</h3>
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

              <div className="admin-breadcrumb-editor-note">
                Click the path to change parent route, or click the page name to edit the label.
              </div>
            </div>
          ) : null}
        </section>

        <section className="admin-content-section">
          <h3>3. Blocks (Static / Dynamic)</h3>
          <div className="table-scroll">
            <table className="ag-table ag-table-inputs">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedBlocks.map((block) => (
                  <tr key={block.id} onClick={() => setSelectedBlockId(block.id)} className={selectedBlock?.id === block.id ? 'admin-block-selected-row' : ''}>
                    <td>{block.name}</td>
                    <td>{block.kind}</td>
                    <td>
                      <select
                        value={block.mode}
                        onChange={(event) => updateBlock(selectedPath, block.id, { mode: event.target.value })}
                      >
                        <option value="static">static</option>
                        <option value="dynamic">dynamic</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-content-section">
          <h3>4. Block-Specific Fields</h3>
          {selectedBlock ? (
            <>
              <p>
                Editing block:
                {' '}
                <strong>{selectedBlock.name}</strong>
                {' '}
                (`{selectedBlock.mode}`)
              </p>
              {(selectedBlock.editableFields || []).length ? (
                <div className="admin-block-fields-editor">
                  {selectedPath === '/test' && selectedBlock.id === 'hero' ? (
                    <HeroBlockEditor
                      block={selectedBlock}
                      onSettingChange={(settingKey, nextValue) => updateBlockSetting(selectedPath, selectedBlock.id, settingKey, nextValue)}
                    />
                  ) : selectedPath === '/test' && selectedBlock.id === 'intro' ? (
                    <IntroBlockEditor
                      block={selectedBlock}
                      onSettingChange={(settingKey, nextValue) => updateBlockSetting(selectedPath, selectedBlock.id, settingKey, nextValue)}
                    />
                  ) : (
                    <FieldControlGrid
                      fields={selectedBlock.editableFields}
                      settings={selectedBlock.settings}
                      onSettingChange={(settingKey, nextValue) => {
                        updateBlockSetting(selectedPath, selectedBlock.id, settingKey, nextValue);
                      }}
                    />
                  )}
                </div>
              ) : (
                <p className="blank-state-note">
                  This block does not have custom fields yet. Keep it `static` until its editor schema is defined.
                </p>
              )}
            </>
          ) : (
            <p className="blank-state-note">No blocks found for this page yet.</p>
          )}
        </section>
      </PageShell>
    </div>
  );
}
