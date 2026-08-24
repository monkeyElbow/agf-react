import { useEffect, useMemo, useRef, useState } from 'react';
import ColorPalette from './ColorPalette';
import TextHighlightColorControls from './TextHighlightColorControls';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import {
  BUTTON_TONE_OPTIONS as SHARED_BUTTON_TONE_OPTIONS,
  SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT,
  SURFACE_BG_TONE_OPTIONS,
} from '../lib/colorSystem';
import {
  getDynamicColumnWidthShare,
  getVisibleDynamicColumnSlots,
} from '../lib/dynamicColumns';
import {
  coerceLinkValue,
  coerceLinkValueFromFields,
  getCanonicalLinkJsonFieldId,
  resolveEditableHrefFromLinkFields,
  serializeLinkValue,
} from '../lib/linkValue';
import {
  extractHeroLineColorToken,
  parseHeroRangeHighlights,
  remapHighlightsJsonForTextChange,
  removeSelectionRange,
  resolveSelectionRangeColor,
} from '../lib/heroHudRanges';
import { applyTextColorSelection, readColorSelection } from '../lib/textColorSelection';
import useBufferedFieldDrafts from '../hooks/useBufferedFieldDrafts';
import PlannedGivingStepsHudEditorPanel from './PlannedGivingStepsHudEditorPanel';

export const COLUMNS_HUD_BG_OPTIONS = SURFACE_BG_TONE_OPTIONS;

export const COLUMNS_HUD_JUSTIFY_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

export const COLUMNS_HUD_TEXT_COLOR_OPTIONS = SEMANTIC_TEXT_COLOR_OPTIONS_WITH_DEFAULT;

const COLUMN_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'photo', label: 'Photo' },
];

const BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
];

const BUTTON_TONE_OPTIONS = SHARED_BUTTON_TONE_OPTIONS;
const PHOTO_ASPECT_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'landscape', label: 'Wide' },
  { value: 'portrait', label: 'Tall' },
];

function getColumnButtonHrefDraftFieldId(slot) {
  return `col${slot}ButtonHrefDraft`;
}

function captureSelection(inputRef, setter) {
  const input = inputRef.current;
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
  setter({
    start,
    end,
    text: String(input.value || '').slice(start, end),
  });
}

function readSelection(fallbackSelection, textValue = '') {
  const sourceText = String(textValue || '');
  const fallbackStart = Number(fallbackSelection?.start);
  const fallbackEnd = Number(fallbackSelection?.end);
  if (Number.isInteger(fallbackStart) && Number.isInteger(fallbackEnd)) {
    const start = Math.max(0, Math.min(fallbackStart, fallbackEnd));
    const end = Math.max(start, Math.max(fallbackStart, fallbackEnd));
    if (end > start) {
      return {
        start,
        end,
        text: sourceText.slice(start, end),
      };
    }
  }

  return { start: 0, end: 0, text: '' };
}

function ColumnsTextSpanEditor({
  label,
  value,
  inputRef,
  selection,
  setSelection,
  lineColor,
  highlights,
  classNameKey,
  textKey,
  highlightsKey,
  onSettingChange,
  textColorOptions,
}) {
  const activeSelectionColorValue = selection.text
    ? resolveSelectionRangeColor(highlights, selection.start, selection.end)
    : lineColor;
  const applyLineColor = (colorValue) => {
    const result = applyTextColorSelection({
      text: String(value?.text || ''),
      lineClassName: String(value?.className || '').trim(),
      highlightsJson: value?.highlightsJson,
      selection: { start: 0, end: 0 },
      colorValue,
    });
    onSettingChange(classNameKey, result.lineClassName);
  };

  const handleTextChange = (nextTextValue) => {
    const previousText = String(value.text || '');
    onSettingChange(textKey, nextTextValue);
    onSettingChange(highlightsKey, remapHighlightsJsonForTextChange(value.highlightsJson, previousText, nextTextValue));
    setSelection({ start: 0, end: 0, text: '' });
  };

  const applySelectedTextColor = (colorValue) => {
    const currentText = String(value.text || '');
    const result = applyTextColorSelection({
      text: currentText,
      lineClassName: String(value?.className || '').trim(),
      highlightsJson: value.highlightsJson,
      selection: readColorSelection(null, selection, currentText),
      colorValue,
    });
    if (result.target !== 'selection') {
      return;
    }
    onSettingChange(highlightsKey, result.highlightsJson);
  };

  return (
    <details className="admin-front-hud-columns-disclosure">
      <summary>{label}</summary>
      <div className="admin-front-hud-columns-disclosure-body">
        <label className="admin-front-hud-field">
          <span>{label}</span>
          <input
            ref={inputRef}
            type="text"
            value={String(value.text || '')}
            onChange={(event) => handleTextChange(event.target.value)}
            onSelect={() => captureSelection(inputRef, setSelection)}
            onMouseUp={() => captureSelection(inputRef, setSelection)}
            onKeyUp={() => captureSelection(inputRef, setSelection)}
          />
        </label>
        <div className="admin-front-hud-row">
          <span>{label} Color</span>
          <ColorPalette
            variant="hud"
            className="is-compact is-icon-only"
            ariaLabel={`${label} color`}
            options={textColorOptions}
            value={activeSelectionColorValue}
            onOptionMouseDown={() => captureSelection(inputRef, setSelection)}
            onChange={applyLineColor}
          />
        </div>
        <div className={`admin-front-hud-row${selection.text ? '' : ' is-disabled'}`}>
          <span>Selection {selection.text ? `"${selection.text}"` : '(select text above)'}</span>
          <ColorPalette
            variant="hud"
            className="is-compact is-icon-only"
            ariaLabel={`${label} selection color`}
            options={textColorOptions.filter((option) => option.value)}
            value={activeSelectionColorValue}
            preventMouseDown
            onOptionMouseDown={() => captureSelection(inputRef, setSelection)}
            onChange={applySelectedTextColor}
            isOptionDisabled={() => !selection.text}
            getOptionClassName={() => (selection.text ? '' : 'is-disabled')}
          />
        </div>
        {highlights.length ? (
          <div className="admin-front-hud-hero-span-chip-list">
            {highlights.map((range, index) => {
              const chipText = String(value.text || '').slice(range.start, range.end);
              const swatch = textColorOptions.find((option) => option.value === range.className);
              return (
                <button
                  key={`${textKey}-span-${range.start}-${range.end}-${range.className}`}
                  type="button"
                  className="admin-hero-inline-span-chip"
                  onClick={() => onSettingChange(
                    highlightsKey,
                    removeSelectionRange(value.highlightsJson, String(value.text || ''), index),
                  )}
                  title="Remove span"
                >
                  <span
                    className="admin-hero-inline-span-chip-color"
                    aria-hidden="true"
                    style={{ background: swatch?.swatch || '#ddd' }}
                  />
                  <span className="admin-hero-inline-span-chip-text">“{chipText || ' '}”</span>
                </button>
              );
            })}
          </div>
        ) : null}
        <button
          type="button"
          className="admin-front-hud-mini-action"
          onClick={() => {
            onSettingChange(highlightsKey, '');
            setSelection({ start: 0, end: 0, text: '' });
          }}
        >
          Clear spans
        </button>
      </div>
    </details>
  );
}

function SegmentField({ label, value, options, onChange }) {
  return (
    <div className="admin-front-hud-row">
      <span>{label}</span>
      <div className="admin-front-hud-segment" role="group" aria-label={label}>
        {options.map((option) => {
          const active = String(value || '') === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`admin-front-hud-segment-btn${active ? ' is-active' : ''}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColumnSlotEditor({
  slot,
  settings,
  onSettingChange,
  draftValues,
  updateDraftValue,
  commitDraftValue,
  textColorOptions = COLUMNS_HUD_TEXT_COLOR_OPTIONS,
  className = 'admin-front-hud-card admin-front-hud-columns-slot-card',
}) {
  const titleInputRef = useRef(null);
  const [titleSelection, setTitleSelection] = useState({ start: 0, end: 0, text: '' });
  const enabled = settings[`col${slot}Enabled`] !== false;
  const type = String(settings[`col${slot}Type`] || 'text').trim().toLowerCase() || 'text';
  const buttonStyle = String(settings[`col${slot}ButtonStyle`] || 'blue').trim().toLowerCase() || 'blue';
  const widthShare = getDynamicColumnWidthShare(settings, slot);
  const isPhotoColumn = type === 'photo';
  const textSummary = isPhotoColumn ? 'Caption' : 'Text';
  const titleLabel = isPhotoColumn ? 'Photo Label' : 'Title';
  const bodyLabel = isPhotoColumn ? 'Photo Caption' : 'Body';
  const photoMaxWidthPx = Number.isFinite(Number(settings.photoMaxWidthPx))
    ? Number(settings.photoMaxWidthPx)
    : 372;
  const photoCornerRadiusPx = Number.isFinite(Number(settings.photoCornerRadiusPx))
    ? Number(settings.photoCornerRadiusPx)
    : 29;
  const photoAspect = String(settings.photoAspect || 'square').trim().toLowerCase() || 'square';
  const titleFieldId = `col${slot}Title`;
  const titleHighlightsFieldId = `col${slot}TitleHighlightsJson`;
  const bodyFieldId = `col${slot}Body`;
  const imageUrlFieldId = `col${slot}ImageUrl`;
  const imageAltFieldId = `col${slot}ImageAlt`;
  const buttonLabelFieldId = `col${slot}ButtonLabel`;
  const buttonHrefFieldId = getColumnButtonHrefDraftFieldId(slot);
  const externalTitleValue = String(settings[titleFieldId] || '');
  const titleValue = String(draftValues[titleFieldId] ?? externalTitleValue);
  const titleClassName = String(settings[`col${slot}TitleClassName`] || '').trim();
  const titleColor = extractHeroLineColorToken(titleClassName);
  const titleHighlightsJson = titleValue === externalTitleValue
    ? settings[titleHighlightsFieldId]
    : remapHighlightsJsonForTextChange(settings[titleHighlightsFieldId], externalTitleValue, titleValue);
  const titleHighlights = useMemo(
    () => parseHeroRangeHighlights(titleHighlightsJson, titleValue),
    [titleHighlightsJson, titleValue],
  );
  const resolvedTitleSelection = readSelection(titleSelection, titleValue);
  const selectedTitleText = String(resolvedTitleSelection.text || '').trim();
  const hasTitleSelection = Boolean(selectedTitleText);
  const activeTitleColorValue = hasTitleSelection
    ? resolveSelectionRangeColor(titleHighlights, resolvedTitleSelection.start, resolvedTitleSelection.end)
    : titleColor;
  const selectedTitlePreview = selectedTitleText.length > 28
    ? `${selectedTitleText.slice(0, 25)}...`
    : selectedTitleText;
  const titleColorLabel = hasTitleSelection
    ? `${titleLabel} Selection Color ("${selectedTitlePreview}")`
    : `${titleLabel} Color`;
  const bodyValue = String(draftValues[bodyFieldId] ?? settings[bodyFieldId] ?? '');
  const imageUrlValue = String(draftValues[imageUrlFieldId] ?? settings[imageUrlFieldId] ?? '');
  const imageAltValue = String(draftValues[imageAltFieldId] ?? settings[imageAltFieldId] ?? '');
  const buttonLabelValue = String(draftValues[buttonLabelFieldId] ?? settings[buttonLabelFieldId] ?? '');
  const buttonHrefValue = String(
    draftValues[buttonHrefFieldId]
    ?? resolveEditableHrefFromLinkFields(settings, {
      hrefKeys: [`col${slot}ButtonUrl`],
      toKeys: [`col${slot}ButtonPageRef`],
      openInNewWindowKeys: [`col${slot}ButtonOpenInNewWindow`],
    })
    ?? '',
  );

  const handleTitleChange = (nextTitleValue) => {
    updateDraftValue(titleFieldId, nextTitleValue);
    setTitleSelection({ start: 0, end: 0, text: '' });
  };

  return (
    <section className={className}>
      <div className="admin-front-hud-card-head">
        <strong>Column {slot}</strong>
      </div>
      <SegmentField
        label="Enabled"
        value={enabled ? 'on' : 'off'}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
        onChange={(nextValue) => onSettingChange(`col${slot}Enabled`, nextValue === 'on')}
      />
      <SegmentField
        label="Type"
        value={type}
        options={COLUMN_TYPE_OPTIONS}
        onChange={(nextValue) => onSettingChange(`col${slot}Type`, nextValue)}
      />
      <label className="admin-front-hud-range">
        <span>Width Share {widthShare.toFixed(2)}x</span>
        <div className="admin-front-hud-range-controls">
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={String(widthShare)}
            onChange={(event) => onSettingChange(`col${slot}WidthShare`, Number(event.target.value))}
          />
          <input
            type="number"
            min="0.5"
            max="2.5"
            step="0.05"
            value={String(widthShare)}
            onChange={(event) => onSettingChange(`col${slot}WidthShare`, Number(event.target.value))}
          />
        </div>
      </label>
      {isPhotoColumn ? (
        <section className="admin-front-hud-columns-inline-section">
          <div className="admin-front-hud-card-head">
            <strong>Photo</strong>
          </div>
          <label className="admin-front-hud-field">
            <span>Photo URL</span>
            <input
              type="text"
              value={imageUrlValue}
              onChange={(event) => updateDraftValue(imageUrlFieldId, event.target.value)}
              onBlur={() => commitDraftValue(imageUrlFieldId)}
            />
          </label>
          <label className="admin-front-hud-field">
            <span>Alt text</span>
            <input
              type="text"
              value={imageAltValue}
              onChange={(event) => updateDraftValue(imageAltFieldId, event.target.value)}
              onBlur={() => commitDraftValue(imageAltFieldId)}
            />
          </label>
          <label className="admin-front-hud-range">
            <span>Photo Width {Math.round(photoMaxWidthPx)}px</span>
            <div className="admin-front-hud-range-controls">
              <input
                type="range"
                min="220"
                max="480"
                step="2"
                value={String(photoMaxWidthPx)}
                onChange={(event) => onSettingChange('photoMaxWidthPx', Number(event.target.value))}
              />
              <input
                type="number"
                min="220"
                max="480"
                step="2"
                value={String(photoMaxWidthPx)}
                onChange={(event) => onSettingChange('photoMaxWidthPx', Number(event.target.value))}
              />
            </div>
          </label>
          <label className="admin-front-hud-range">
            <span>Photo Radius {Math.round(photoCornerRadiusPx)}px</span>
            <div className="admin-front-hud-range-controls">
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={String(photoCornerRadiusPx)}
                onChange={(event) => onSettingChange('photoCornerRadiusPx', Number(event.target.value))}
              />
              <input
                type="number"
                min="0"
                max="40"
                step="1"
                value={String(photoCornerRadiusPx)}
                onChange={(event) => onSettingChange('photoCornerRadiusPx', Number(event.target.value))}
              />
            </div>
          </label>
          <SegmentField
            label="Photo Shape"
            value={photoAspect}
            options={PHOTO_ASPECT_OPTIONS}
            onChange={(nextValue) => onSettingChange('photoAspect', nextValue)}
          />
        </section>
      ) : null}
      <section className="admin-front-hud-columns-inline-section">
        <div className="admin-front-hud-card-head">
          <strong>{textSummary}</strong>
        </div>
        <label className="admin-front-hud-field">
          <span>{titleLabel}</span>
          <input
            ref={titleInputRef}
            type="text"
            value={titleValue}
            onChange={(event) => handleTitleChange(event.target.value)}
            onBlur={() => commitDraftValue(titleFieldId)}
            onSelect={() => captureSelection(titleInputRef, setTitleSelection)}
            onMouseUp={() => captureSelection(titleInputRef, setTitleSelection)}
            onKeyUp={() => captureSelection(titleInputRef, setTitleSelection)}
          />
        </label>
        <TextHighlightColorControls
          label={titleColorLabel}
          ariaLabel={`Column ${slot} title color`}
          options={textColorOptions}
          value={activeTitleColorValue}
          onPaletteMouseDown={() => captureSelection(titleInputRef, setTitleSelection)}
          onChange={(nextValue) => {
            const currentSelection = readColorSelection(titleInputRef.current, titleSelection, titleValue);
            commitDraftValue(titleFieldId);
            const result = applyTextColorSelection({
              text: titleValue,
              lineClassName: titleClassName,
              highlightsJson: titleHighlightsJson,
              selection: currentSelection,
              colorValue: nextValue,
            });
            if (result.target === 'selection') {
              onSettingChange(titleHighlightsFieldId, result.highlightsJson);
              return;
            }
            onSettingChange(`col${slot}TitleClassName`, result.lineClassName);
          }}
          sourceText={titleValue}
          highlightRanges={titleHighlights}
          onRemoveSpan={(index) => {
            commitDraftValue(titleFieldId);
            onSettingChange(
              titleHighlightsFieldId,
              removeSelectionRange(titleHighlightsJson, titleValue, index),
            );
          }}
          onClearSpans={() => {
            commitDraftValue(titleFieldId);
            onSettingChange(titleHighlightsFieldId, '');
            setTitleSelection({ start: 0, end: 0, text: '' });
          }}
          layout="row"
          paletteClassName="is-field-linked"
          swatchClassName="is-compact is-icon-only"
        />
        <label className="admin-front-hud-field admin-front-hud-columns-body-field">
          <span>{bodyLabel}</span>
          <textarea
            rows={6}
            value={bodyValue}
            onChange={(event) => updateDraftValue(bodyFieldId, event.target.value)}
            onBlur={() => commitDraftValue(bodyFieldId)}
          />
        </label>
      </section>
      {!isPhotoColumn ? (
        <details className="admin-front-hud-columns-disclosure">
          <summary>Image</summary>
          <div className="admin-front-hud-columns-disclosure-body">
            <label className="admin-front-hud-field">
              <span>Photo URL</span>
              <input
                type="text"
                value={imageUrlValue}
                onChange={(event) => updateDraftValue(imageUrlFieldId, event.target.value)}
                onBlur={() => commitDraftValue(imageUrlFieldId)}
              />
            </label>
            <label className="admin-front-hud-field">
              <span>Alt text</span>
              <input
                type="text"
                value={imageAltValue}
                onChange={(event) => updateDraftValue(imageAltFieldId, event.target.value)}
                onBlur={() => commitDraftValue(imageAltFieldId)}
              />
            </label>
          </div>
        </details>
      ) : null}
      <details className="admin-front-hud-columns-disclosure">
        <summary>Button</summary>
        <div className="admin-front-hud-columns-disclosure-body">
          <label className="admin-front-hud-field">
            <span>Label</span>
            <input
              type="text"
              value={buttonLabelValue}
              onChange={(event) => updateDraftValue(buttonLabelFieldId, event.target.value)}
              onBlur={() => commitDraftValue(buttonLabelFieldId)}
            />
          </label>
          <label className="admin-front-hud-field">
            <span>URL / path</span>
            <input
              type="text"
              value={buttonHrefValue}
              onChange={(event) => updateDraftValue(buttonHrefFieldId, event.target.value)}
              onBlur={() => commitDraftValue(buttonHrefFieldId)}
            />
          </label>
          <SegmentField
            label="Style"
            value={buttonStyle}
            options={BUTTON_STYLE_OPTIONS}
            onChange={(nextValue) => onSettingChange(`col${slot}ButtonStyle`, nextValue)}
          />
          {buttonStyle === 'outline' ? (
            <div className="admin-front-hud-row">
              <span>Color</span>
              <ColorPalette
                variant="hud"
                className="is-compact is-icon-only"
                ariaLabel={`Column ${slot} button color`}
                options={BUTTON_TONE_OPTIONS}
                value={String(settings[`col${slot}ButtonTone`] || 'atlantean')}
                onChange={(nextValue) => onSettingChange(`col${slot}ButtonTone`, nextValue)}
              />
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}

function GenericColumnsHudEditorPanel({
  settings = {},
  onSettingChange,
  sourceRevision = 0,
  bgOptions = COLUMNS_HUD_BG_OPTIONS,
  justifyOptions = COLUMNS_HUD_JUSTIFY_OPTIONS,
  textColorOptions = COLUMNS_HUD_TEXT_COLOR_OPTIONS,
  blockOptions = null,
}) {
  const titleInputRef = useRef(null);
  const [titleSelection, setTitleSelection] = useState({ start: 0, end: 0, text: '' });
  const visibleColumnSlots = useMemo(() => getVisibleDynamicColumnSlots(settings), [settings]);
  const columnSlotOptions = useMemo(
    () => visibleColumnSlots.map((slot) => ({ value: String(slot), label: `Col ${slot}` })),
    [visibleColumnSlots],
  );
  const [activeColumnSlot, setActiveColumnSlot] = useState(() => visibleColumnSlots[0] || 1);
  const headingClassName = String(settings.titleClassName || '').trim();
  const headingHighlightsJson = settings.titleHighlightsJson;
  const externalTitleValue = String(settings.title || '');
  const titleColor = extractHeroLineColorToken(headingClassName);
  const activeColumnType = String(settings[`col${activeColumnSlot}Type`] || 'text').trim().toLowerCase() || 'text';
  const activeColumnEnabled = settings[`col${activeColumnSlot}Enabled`] !== false;
  const columnTitleSizeRem = Number.isFinite(Number(settings.columnTitleSizeRem))
    ? Number(settings.columnTitleSizeRem)
    : 2.4;
  const canAddColumn = visibleColumnSlots.length < 4;
  const canRemoveColumn = visibleColumnSlots.length > 2;
  const bufferedFields = useMemo(() => {
    const fields = [
      {
        id: 'title',
        value: String(settings.title || ''),
        mode: 'blur',
        commit: (nextValue, { previousValue }) => {
          onSettingChange('title', nextValue);
          onSettingChange(
            'titleHighlightsJson',
            remapHighlightsJsonForTextChange(
              settings.titleHighlightsJson,
              String(previousValue || ''),
              nextValue,
            ),
          );
        },
      },
      {
        id: 'bodyHtml',
        value: String(settings.bodyHtml || ''),
        mode: 'blur',
        commit: (nextValue) => onSettingChange('bodyHtml', nextValue),
      },
    ];

    for (let slot = 1; slot <= 4; slot += 1) {
      const titleFieldId = `col${slot}Title`;
      const titleHighlightsFieldId = `col${slot}TitleHighlightsJson`;
      const bodyFieldId = `col${slot}Body`;
      const imageUrlFieldId = `col${slot}ImageUrl`;
      const imageAltFieldId = `col${slot}ImageAlt`;
      const buttonLabelFieldId = `col${slot}ButtonLabel`;
      const buttonUrlFieldId = `col${slot}ButtonUrl`;
      const buttonPageRefFieldId = `col${slot}ButtonPageRef`;

      fields.push(
        {
          id: titleFieldId,
          value: String(settings[titleFieldId] || ''),
          mode: 'blur',
          commit: (nextValue, { previousValue }) => {
            onSettingChange(titleFieldId, nextValue);
            onSettingChange(
              titleHighlightsFieldId,
              remapHighlightsJsonForTextChange(
                settings[titleHighlightsFieldId],
                String(previousValue || ''),
                nextValue,
              ),
            );
          },
        },
        {
          id: bodyFieldId,
          value: String(settings[bodyFieldId] || ''),
          mode: 'blur',
          commit: (nextValue) => onSettingChange(bodyFieldId, nextValue),
        },
        {
          id: imageUrlFieldId,
          value: String(settings[imageUrlFieldId] || ''),
          mode: 'blur',
          commit: (nextValue) => onSettingChange(imageUrlFieldId, nextValue),
        },
        {
          id: imageAltFieldId,
          value: String(settings[imageAltFieldId] || ''),
          mode: 'blur',
          commit: (nextValue) => onSettingChange(imageAltFieldId, nextValue),
        },
        {
          id: buttonLabelFieldId,
          value: String(settings[buttonLabelFieldId] || ''),
          mode: 'blur',
          commit: (nextValue) => onSettingChange(buttonLabelFieldId, nextValue),
        },
        {
          id: getColumnButtonHrefDraftFieldId(slot),
          value: resolveEditableHrefFromLinkFields(settings, {
            hrefKeys: [buttonUrlFieldId],
            toKeys: [buttonPageRefFieldId],
            openInNewWindowKeys: [`col${slot}ButtonOpenInNewWindow`],
          }),
          mode: 'blur',
          commit: (nextValue) => {
            const routeRefValue = String(nextValue || '').trim().startsWith('/') ? nextValue : '';
            const buttonLinkJsonFieldId = getCanonicalLinkJsonFieldId(`col${slot}Button`);
            const currentButtonLinkValue = coerceLinkValueFromFields(settings, {
              linkJsonKeys: [buttonLinkJsonFieldId],
              hrefKeys: [buttonUrlFieldId],
              toKeys: [buttonPageRefFieldId],
              openInNewWindowKeys: [`col${slot}ButtonOpenInNewWindow`],
            });
            const buttonLinkValue = routeRefValue
              ? coerceLinkValue({ to: routeRefValue, openInNewWindow: currentButtonLinkValue?.openInNewWindow })
              : coerceLinkValue({ href: nextValue, openInNewWindow: currentButtonLinkValue?.openInNewWindow });
            onSettingChange(buttonLinkJsonFieldId, serializeLinkValue(buttonLinkValue));
          },
        },
      );
    }

    return fields;
  }, [onSettingChange, settings]);
  const {
    draftValues,
    updateDraftValue,
    commitDraftValue,
  } = useBufferedFieldDrafts({
    fields: bufferedFields,
    sourceRevision,
  });

  useEffect(() => {
    if (visibleColumnSlots.includes(activeColumnSlot)) {
      return;
    }
    setActiveColumnSlot(visibleColumnSlots[0] || 1);
  }, [activeColumnSlot, visibleColumnSlots]);

  const handleTitleChange = (nextTitleValue) => {
    updateDraftValue('title', nextTitleValue);
    setTitleSelection({ start: 0, end: 0, text: '' });
  };
  const titleValue = String(draftValues.title ?? externalTitleValue);
  const headingDraftHighlightsJson = titleValue === externalTitleValue
    ? headingHighlightsJson
    : remapHighlightsJsonForTextChange(headingHighlightsJson, externalTitleValue, titleValue);
  const titleHighlights = useMemo(
    () => parseHeroRangeHighlights(headingDraftHighlightsJson, titleValue),
    [headingDraftHighlightsJson, titleValue],
  );
  const resolvedTitleSelection = readSelection(titleSelection, titleValue);
  const selectedTitleText = String(resolvedTitleSelection.text || '').trim();
  const hasTitleSelection = Boolean(selectedTitleText);
  const activeHeadingColorValue = hasTitleSelection
    ? resolveSelectionRangeColor(titleHighlights, resolvedTitleSelection.start, resolvedTitleSelection.end)
    : titleColor;
  const selectedTitlePreview = selectedTitleText.length > 28
    ? `${selectedTitleText.slice(0, 25)}...`
    : selectedTitleText;
  const headingColorLabel = hasTitleSelection
    ? `Heading Selection Color ("${selectedTitlePreview}")`
    : 'Heading Color';

  const handleAddColumn = () => {
    const nextSlot = visibleColumnSlots.length + 1;
    if (nextSlot > 4) {
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
    setActiveColumnSlot(nextSlot);
  };

  const handleRemoveColumn = () => {
    const nextSlot = visibleColumnSlots[visibleColumnSlots.length - 1];
    if (!nextSlot || nextSlot <= 2) {
      return;
    }
    onSettingChange(`col${nextSlot}Enabled`, false);
    onSettingChange('columns', nextSlot === 4 ? 'three' : 'two');
    setActiveColumnSlot(Math.max(1, nextSlot - 1));
  };

  const [activeEditorSection, setActiveEditorSection] = useState('content');

  const editorSections = appendHudBlockOptionsSection([
    { id: 'content', label: 'Content', icon: 'Aa' },
    { id: 'columns', label: 'Columns', icon: '▦' },
  ], blockOptions);

  return (
    <HudEditorModelLayout
      className="admin-front-hud-columns-editor"
      sections={editorSections}
      activeSection={activeEditorSection}
      onSectionChange={setActiveEditorSection}
      label="Columns editor sections"
    >
      <section className="admin-front-hud-card admin-front-hud-columns-main-card">
        <div className="admin-front-hud-card-head">
          <strong>Header + Body</strong>
        </div>
        <section className="admin-front-hud-columns-inline-section admin-front-hud-columns-main-inline">
          <label className="admin-front-hud-field">
            <span>Heading</span>
            <input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={(event) => handleTitleChange(event.target.value)}
              onBlur={() => commitDraftValue('title')}
              onSelect={() => captureSelection(titleInputRef, setTitleSelection)}
              onMouseUp={() => captureSelection(titleInputRef, setTitleSelection)}
              onKeyUp={() => captureSelection(titleInputRef, setTitleSelection)}
            />
          </label>
          <TextHighlightColorControls
            label={headingColorLabel}
            ariaLabel="Columns heading color"
            options={textColorOptions}
            value={activeHeadingColorValue}
            onPaletteMouseDown={() => captureSelection(titleInputRef, setTitleSelection)}
            onChange={(nextValue) => {
              const currentSelection = readColorSelection(titleInputRef.current, titleSelection, titleValue);
              commitDraftValue('title');
              const result = applyTextColorSelection({
                text: titleValue,
                lineClassName: headingClassName,
                highlightsJson: headingDraftHighlightsJson,
                selection: currentSelection,
                colorValue: nextValue,
              });
              if (result.target === 'selection') {
                onSettingChange('titleHighlightsJson', result.highlightsJson);
                return;
              }
              onSettingChange('titleClassName', result.lineClassName);
            }}
            sourceText={titleValue}
            highlightRanges={titleHighlights}
            onRemoveSpan={(index) => {
              commitDraftValue('title');
              onSettingChange(
                'titleHighlightsJson',
                removeSelectionRange(headingDraftHighlightsJson, titleValue, index),
              );
            }}
            onClearSpans={() => {
              commitDraftValue('title');
              onSettingChange('titleHighlightsJson', '');
              setTitleSelection({ start: 0, end: 0, text: '' });
            }}
            layout="row"
            swatchClassName="is-compact is-icon-only"
          />
          <label className="admin-front-hud-field">
            <span>Body HTML</span>
            <textarea
              rows={5}
              value={String(draftValues.bodyHtml ?? settings.bodyHtml ?? '')}
              onChange={(event) => updateDraftValue('bodyHtml', event.target.value)}
              onBlur={() => commitDraftValue('bodyHtml')}
            />
          </label>
        </section>
        <section className="admin-front-hud-columns-inline-section">
          <div className="admin-front-hud-card-head">
            <strong>Style</strong>
          </div>
          <div className="admin-front-hud-row">
            <span>Background</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Columns background"
              options={bgOptions}
              value={String(settings.bgTone || 'sand').trim().toLowerCase() || 'sand'}
              onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
            />
          </div>
          <SegmentField
            label="Justify"
            value={String(settings.justify || 'center').trim().toLowerCase() || 'center'}
            options={justifyOptions}
            onChange={(nextValue) => onSettingChange('justify', nextValue)}
          />
          <label className="admin-front-hud-range">
            <span>Column Title Size {columnTitleSizeRem.toFixed(2)}rem</span>
            <div className="admin-front-hud-range-controls">
              <input
                type="range"
                min="1.25"
                max="3.5"
                step="0.05"
                value={String(columnTitleSizeRem)}
                onChange={(event) => onSettingChange('columnTitleSizeRem', Number(event.target.value))}
              />
              <input
                type="number"
                min="1.25"
                max="3.5"
                step="0.05"
                value={String(columnTitleSizeRem)}
                onChange={(event) => onSettingChange('columnTitleSizeRem', Number(event.target.value))}
              />
            </div>
          </label>
        </section>
      </section>

      <section className="admin-front-hud-card admin-front-hud-columns-slot-wrap">
        <div className="admin-front-hud-card-head">
          <strong>Columns</strong>
          <p>{`Editing Column ${activeColumnSlot} · ${activeColumnType}${activeColumnEnabled ? '' : ' · off'}`}</p>
        </div>
        <div className="admin-front-hud-columns-slot-switcher">
          <SegmentField
            label="Active Column"
            value={String(activeColumnSlot)}
            options={columnSlotOptions}
            onChange={(nextValue) => setActiveColumnSlot(Number(nextValue) || 1)}
          />
          <div className="admin-front-hud-columns-slot-actions">
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
        </div>
        <ColumnSlotEditor
          key={`column-slot-${activeColumnSlot}`}
          slot={activeColumnSlot}
          settings={settings}
          onSettingChange={onSettingChange}
          draftValues={draftValues}
          updateDraftValue={updateDraftValue}
          commitDraftValue={commitDraftValue}
          textColorOptions={textColorOptions}
          className="admin-front-hud-columns-slot-card"
        />
      </section>
      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}

export default function ColumnsHudEditorPanel(props) {
  const presetId = String(props?.presetId || '').trim().toLowerCase();
  if (presetId === 'planned-giving-steps') {
    // Kept as a small dispatcher so existing generic columns consumers keep
    // their current editor while the named preset gets its own contract.
    return <PlannedGivingStepsHudEditorPanel {...props} />;
  }
  return <GenericColumnsHudEditorPanel {...props} />;
}
