import { useCallback, useState } from 'react';
import AdminHtmlEditor from './AdminHtmlEditor';
import AdminNumberInput from './AdminNumberInput';
import BackgroundEditorPage from './BackgroundEditorPage';
import ColorPalette from './ColorPalette';
import RouteLinkField from './RouteLinkField';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import { getTokenSwatch } from '../lib/colorSystem';
import {
  normalizeBillboardLeadCopyLineHeight,
  normalizeBillboardLeadCopySizeRem,
} from '../lib/dynamicSectionTypography';
import {
  parseHeroRangeHighlights,
  readTextSelectionState,
} from '../lib/heroHudRanges';

export const BILLBOARD_WIDTH_MIN_PX = 560;
export const BILLBOARD_WIDTH_MAX_PX = 1440;
export const BILLBOARD_WIDTH_STEP_PX = 10;
export const BILLBOARD_BODY_WIDTH_MIN_PX = 320;
export const BILLBOARD_BODY_WIDTH_MAX_PX = 1200;
export const BILLBOARD_BODY_WIDTH_STEP_PX = 10;
export const BILLBOARD_HEADER_GAP_MIN_REM = 0;
export const BILLBOARD_HEADER_GAP_MAX_REM = 4;
export const BILLBOARD_HEADER_GAP_STEP_REM = 0.05;
export const BILLBOARD_PADDING_MIN_REM = 0;
export const BILLBOARD_PADDING_MAX_REM = 8;
export const BILLBOARD_PADDING_STEP_REM = 0.25;
export const BILLBOARD_ACTION_GAP_MIN_REM = 0;
export const BILLBOARD_ACTION_GAP_MAX_REM = 8;
export const BILLBOARD_ACTION_GAP_STEP_REM = 0.05;

export const BILLBOARD_EDITOR_SECTIONS = Object.freeze([
  { id: 'heading', label: 'Heading', icon: 'Aa' },
  { id: 'copy', label: 'Copy', icon: '¶' },
  { id: 'buttons', label: 'Buttons', icon: '↗' },
  { id: 'layout', label: 'Layout', icon: '▦' },
  { id: 'background', label: 'Background', icon: '◌' },
]);

function billboardPreviewButtonClassName(style, tone) {
  const normalizedStyle = String(style || '').trim().toLowerCase();
  const normalizedTone = String(tone || '').trim().toLowerCase();
  const previewTone = normalizedStyle === 'dark'
    ? 'super-grey'
    : normalizedStyle === 'outline'
      ? (normalizedTone || 'atlantean')
      : 'atlantean';
  return [
    'service-native-btn',
    'admin-billboard-editor-preview-button',
    normalizedStyle === 'dark' ? 'is-dark' : normalizedStyle === 'outline' ? 'is-outline' : '',
    `is-tone-${previewTone}`,
  ].filter(Boolean).join(' ');
}

function buildButtonStyleSwatch(style) {
  const token = String(style || '').trim().toLowerCase();
  if (token === 'dark') {
    return 'linear-gradient(145deg, #414042 0%, #5f5e61 100%)';
  }
  if (token === 'outline') {
    return 'linear-gradient(145deg, #ffffff 0%, #edf4f7 100%)';
  }
  return getTokenSwatch('blue');
}

function formatSelectionLabel(text) {
  const value = String(text || '').trim();
  if (!value) {
    return 'Core Color';
  }
  return `Selected Color "${value.length > 28 ? `${value.slice(0, 25)}...` : value}"`;
}

function isOutlineButtonStyle(style) {
  return String(style || '').trim().toLowerCase() === 'outline';
}

function normalizeSliderValue(value, fallback, min, max, step) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : fallback;
  const clamped = Math.min(max, Math.max(min, safeValue));
  const stepped = Math.round((clamped - min) / step) * step + min;
  return Number(stepped.toFixed(4));
}

export function normalizeBillboardWidth(value) {
  if (value == null || String(value).trim() === '') {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  const clamped = Math.min(BILLBOARD_WIDTH_MAX_PX, Math.max(BILLBOARD_WIDTH_MIN_PX, numericValue));
  return Math.round(clamped / BILLBOARD_WIDTH_STEP_PX) * BILLBOARD_WIDTH_STEP_PX;
}

export function normalizeBillboardBodyWidth(value) {
  if (value == null || String(value).trim() === '') {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  const clamped = Math.min(BILLBOARD_BODY_WIDTH_MAX_PX, Math.max(BILLBOARD_BODY_WIDTH_MIN_PX, numericValue));
  return Math.round(clamped / BILLBOARD_BODY_WIDTH_STEP_PX) * BILLBOARD_BODY_WIDTH_STEP_PX;
}

export function normalizeBillboardHeaderGap(value) {
  if (value == null || String(value).trim() === '') {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  const clamped = Math.min(BILLBOARD_HEADER_GAP_MAX_REM, Math.max(BILLBOARD_HEADER_GAP_MIN_REM, numericValue));
  return Number((Math.round(clamped / BILLBOARD_HEADER_GAP_STEP_REM) * BILLBOARD_HEADER_GAP_STEP_REM).toFixed(2));
}

export function normalizeBillboardPadding(value) {
  if (value == null || String(value).trim() === '') {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  const clamped = Math.min(BILLBOARD_PADDING_MAX_REM, Math.max(BILLBOARD_PADDING_MIN_REM, numericValue));
  return Number((Math.round(clamped / BILLBOARD_PADDING_STEP_REM) * BILLBOARD_PADDING_STEP_REM).toFixed(2));
}

export function normalizeBillboardActionGap(value) {
  if (value == null || String(value).trim() === '') {
    return null;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  const clamped = Math.min(BILLBOARD_ACTION_GAP_MAX_REM, Math.max(BILLBOARD_ACTION_GAP_MIN_REM, numericValue));
  return Number((Math.round(clamped / BILLBOARD_ACTION_GAP_STEP_REM) * BILLBOARD_ACTION_GAP_STEP_REM).toFixed(2));
}

function BillboardField({ label, children, className = '' }) {
  return (
    <label className={`admin-front-hud-field admin-billboard-editor-field${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function BillboardControlField({ label, children, className = '' }) {
  return (
    <div className={`admin-front-hud-field admin-billboard-editor-field${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      {children}
    </div>
  );
}

function BillboardSegment({ label, options = [], value, onChange, className = '' }) {
  return (
    <div className={`admin-hud-editor-inline-control admin-billboard-editor-group${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <div className="admin-front-hud-segment" role="group" aria-label={label}>
        {options.map((option) => {
          const optionValue = option?.value ?? option;
          const optionLabel = option?.label ?? optionValue;
          return (
            <button
              key={`${label}-${optionValue}`}
              type="button"
              className={`admin-front-hud-segment-btn${String(value) === String(optionValue) ? ' is-active' : ''}`}
              aria-pressed={String(value) === String(optionValue)}
              onClick={() => onChange?.(optionValue)}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BillboardSlider({ label, value, min, max, step, onChange, ariaLabel = label, unit = '', className = '' }) {
  const safeValue = normalizeSliderValue(value, min, min, max, step);
  return (
    <label className={`admin-front-hud-range admin-billboard-editor-slider${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <div
        className={`admin-range-number-control${unit ? ' admin-range-number-control--unit-tooltip' : ''}`}
        data-measurement-unit={unit || undefined}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          aria-label={ariaLabel}
          onChange={(event) => onChange?.(normalizeSliderValue(event.target.value, safeValue, min, max, step))}
        />
        <AdminNumberInput
          value={safeValue}
          min={min}
          max={max}
          step={step}
          aria-label={`${ariaLabel} value`}
          title={unit || undefined}
          onChange={(nextValue) => onChange?.(normalizeSliderValue(nextValue, safeValue, min, max, step))}
        />
      </div>
    </label>
  );
}

function BillboardColors({ ariaLabel, options = [], value, onChange, preventMouseDown = false }) {
  return (
    <ColorPalette
      variant="hud"
      className="is-compact is-icon-only is-circular"
      ariaLabel={ariaLabel}
      options={options}
      value={value}
      preventMouseDown={preventMouseDown}
      onChange={onChange}
    />
  );
}

function BillboardHeadingMarkedSpans({ label, text, spans = [], colorOptions = [] }) {
  if (!spans.length) {
    return null;
  }

  return (
    <span className="admin-billboard-hud-heading-marked-spans" aria-label={`${label} marked spans`}>
      {spans.map((range) => {
        const markedText = String(text || '').slice(range.start, range.end);
        const colorOption = colorOptions.find((option) => option?.value === range.className);
        return (
          <span
            key={`${label}-${range.start}-${range.end}-${range.className}`}
            className="admin-billboard-hud-heading-marked-span"
            title={`${label} marked text: ${markedText}`}
          >
            <span
              className="admin-billboard-hud-heading-marked-span-swatch"
              aria-hidden="true"
              style={{ background: colorOption?.swatch || '#ddd' }}
            />
            <span>{markedText}</span>
          </span>
        );
      })}
    </span>
  );
}

function readBillboardHeadingSelection(inputRef, fallbackSelection, value) {
  const input = inputRef?.current;
  if (
    input
    && typeof document !== 'undefined'
    && document.activeElement !== input
  ) {
    return { start: 0, end: 0, text: '' };
  }
  return readTextSelectionState(input, fallbackSelection, String(value || ''));
}

function BillboardHeadingTextField({
  label,
  value,
  inputRef,
  selection,
  color,
  colorOptions,
  markedSpans,
  onChange,
  onBlur,
  onSelectionCapture,
  onSelectionColorChange,
  onCoreColorChange,
  onHighlightsChange,
}) {
  return (
    <div className="admin-billboard-hud-heading-row">
      <BillboardField label={label}>
        <input
          ref={inputRef}
          type="text"
          value={String(value || '')}
          onChange={(event) => onChange?.(event.target.value)}
          onBlur={() => onBlur?.()}
          onSelect={() => onSelectionCapture?.()}
          onMouseUp={() => onSelectionCapture?.()}
          onKeyUp={() => onSelectionCapture?.()}
        />
      </BillboardField>
      <div className="admin-hud-editor-inline-control">
        <div className="admin-billboard-hud-heading-color-meta">
          <span>{formatSelectionLabel(selection?.text)}</span>
          <BillboardHeadingMarkedSpans
            label={label}
            text={value}
            spans={markedSpans}
            colorOptions={colorOptions}
          />
        </div>
        <BillboardColors
          ariaLabel={`Billboard ${String(label).toLowerCase()} color`}
          options={colorOptions}
          value={color}
          preventMouseDown
          onChange={(nextValue, option) => {
            const currentSelection = readBillboardHeadingSelection(inputRef, selection, value);
            if (currentSelection.end > currentSelection.start) {
              onSelectionColorChange?.(nextValue, currentSelection);
              return;
            }
            if (option?.isClear === true) {
              onCoreColorChange?.('');
              onHighlightsChange?.('');
              return;
            }
            onCoreColorChange?.(nextValue);
          }}
        />
      </div>
    </div>
  );
}

function BillboardPanel({ id, title, description, children, className = '', headerContent = null, showHeader = true }) {
  return (
    <section className={`admin-billboard-hud-reference-panel${className ? ` ${className}` : ''}`} aria-label={`${title} settings`}>
      {showHeader ? (
        <div className="admin-billboard-hud-reference-head">
          {headerContent || (
            <>
              <div>
                <h3>{title}</h3>
                {description ? <span>{description}</span> : null}
              </div>
              <span className="admin-billboard-editor-panel-index">{id}</span>
            </>
          )}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function BillboardWidthControl({
  label,
  value,
  onChange,
  autoLabel,
  normalizeValue = normalizeBillboardWidth,
  min = BILLBOARD_WIDTH_MIN_PX,
  max = BILLBOARD_WIDTH_MAX_PX,
  step = BILLBOARD_WIDTH_STEP_PX,
}) {
  const normalizedValue = normalizeValue(value);
  const isAuto = normalizedValue == null;
  const handleSliderChange = useCallback((nextValue) => {
    const nextWidth = normalizeValue(nextValue);
    if (nextWidth == null || nextWidth === normalizedValue) {
      return;
    }
    onChange?.(nextWidth);
  }, [normalizedValue, normalizeValue, onChange]);

  return (
    <div className="admin-billboard-editor-width-control">
      <div className="admin-billboard-editor-width-head">
        <span>{label}</span>
        <strong>{isAuto ? autoLabel : `${normalizedValue}px`}</strong>
      </div>
      <div className="admin-billboard-editor-width-row admin-front-hud-range">
        <button
          type="button"
          className={`admin-front-hud-segment-btn admin-billboard-editor-auto${isAuto ? ' is-active' : ''}`}
          aria-pressed={isAuto}
          onClick={() => {
            if (!isAuto) {
              onChange?.('');
            }
          }}
        >
          Auto
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={normalizedValue ?? min}
          aria-label={label}
          onChange={(event) => handleSliderChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export default function BillboardHudEditorPanel({
  title,
  onTitleChange,
  onTitleBlur,
  subtitle,
  onSubtitleChange,
  onSubtitleBlur,
  subtitleInputRef,
  onSubtitleSelectionCapture,
  subtitleSelection,
  subtitleColor,
  onSubtitleColorChange,
  onSubtitleSelectionColorChange,
  subtitleHighlightsJson,
  onSubtitleHighlightsChange,
  subtitleColorOptions = [],
  subtitleSizeRem,
  onSubtitleSizeRemChange,
  titleInputRef,
  onTitleSelectionCapture,
  titleSelection,
  titleColor,
  onTitleColorChange,
  onTitleSelectionColorChange,
  titleHighlightsJson,
  onTitleHighlightsChange,
  titleColorOptions = [],
  bodyHtml,
  onBodyHtmlChange,
  onBodyHtmlBlur,
  bodyJustify,
  onBodyJustifyChange,
  bodyJustifyOptions = [],
  bodyMaxWidthPx,
  onBodyMaxWidthPxChange,
  headerGapRem,
  onHeaderGapRemChange,
  leadCopySizeRem,
  onLeadCopySizeRemChange,
  leadCopyLineHeight,
  onLeadCopyLineHeightChange,
  bodyColorClassName,
  onBodyColorChange,
  bgTone,
  onBgToneChange,
  bgToneOptions = [],
  justify,
  onJustifyChange,
  justifyOptions = [],
  titleFontFamily,
  onTitleFontFamilyChange,
  titleFontOptions = [],
  titleFontWeight,
  onTitleFontWeightChange,
  titleWeightOptions = [],
  showTitleSize = true,
  showTitleFont = true,
  showTitleAlignment = true,
  showTitleWeight = true,
  lineSpacing,
  onLineSpacingChange,
  titleSizeRem,
  onTitleSizeRemChange,
  titleTrackingEm,
  onTitleTrackingEmChange,
  subtitleTrackingEm,
  onSubtitleTrackingEmChange,
  buttonLabel,
  onButtonLabelChange,
  onButtonLabelBlur,
  buttonHref,
  buttonRouteRef,
  onButtonHrefChange,
  onButtonRouteLinkChange,
  buttonRouteOptions = [],
  buttonOpenInNewWindow = false,
  onButtonOpenInNewWindowChange,
  buttonStyle,
  onButtonStyleChange,
  buttonStyleOptions = [],
  buttonTone,
  onButtonToneChange,
  buttonToneOptions = [],
  button2Label,
  onButton2LabelChange,
  onButton2LabelBlur,
  button2Href,
  button2RouteRef,
  onButton2HrefChange,
  onButton2RouteLinkChange,
  button2RouteOptions = [],
  button2OpenInNewWindow = false,
  onButton2OpenInNewWindowChange,
  button2Style,
  onButton2StyleChange,
  button2StyleOptions = [],
  button2Tone,
  onButton2ToneChange,
  button2ToneOptions = [],
  actionGapRem,
  onActionGapRemChange,
  contentMaxWidthPx,
  onContentMaxWidthPxChange,
  paddingTopRem,
  onPaddingTopRemChange,
  paddingBottomRem,
  onPaddingBottomRemChange,
  backgroundEffectsJson,
  onBackgroundEffectsChange,
  blockOptions = null,
}) {
  const [activeSection, setActiveSection] = useState('heading');
  const editorSections = appendHudBlockOptionsSection(BILLBOARD_EDITOR_SECTIONS, blockOptions);
  const hasSelection = Boolean(String(titleSelection?.text || '').trim());
  const hasSubtitleSelection = Boolean(String(subtitleSelection?.text || '').trim());
  const titleHighlights = parseHeroRangeHighlights(titleHighlightsJson, String(title || ''));
  const subtitleHighlights = parseHeroRangeHighlights(subtitleHighlightsJson, String(subtitle || ''));
  const visibleTitleColorOptions = (Array.isArray(titleColorOptions) ? titleColorOptions : [])
    .filter((option) => option?.isClear !== true || titleHighlights.length > 0)
    .map((option) => option?.isClear === true && hasSelection
      ? { ...option, label: 'Clear selected span', shortLabel: 'Clear selected span' }
      : option?.isClear === true
        ? { ...option, label: 'Clear title color', shortLabel: 'Clear title color' }
        : option);
  const visibleSubtitleColorOptions = (Array.isArray(subtitleColorOptions) ? subtitleColorOptions : [])
    .filter((option) => option?.isClear !== true || subtitleHighlights.length > 0)
    .map((option) => option?.isClear === true && hasSubtitleSelection
      ? { ...option, label: 'Clear selected subtitle span', shortLabel: 'Clear selected subtitle span' }
      : option?.isClear === true
        ? { ...option, label: 'Clear subtitle color', shortLabel: 'Clear subtitle color' }
        : option);
  const previewButtons = [
    { label: buttonLabel, style: buttonStyle, tone: buttonTone },
    { label: button2Label, style: button2Style, tone: button2Tone },
  ].map((button) => ({
    ...button,
    label: String(button.label || '').trim(),
  })).filter((button) => button.label);
  const button1UsesTone = isOutlineButtonStyle(buttonStyle);
  const button2UsesTone = isOutlineButtonStyle(button2Style);
  const previewBackgroundTone = String(bgTone || 'white').trim().toLowerCase() || 'white';

  return (
    <HudEditorModelLayout
      className="admin-billboard-hud-editor admin-billboard-hud-editor--reference"
      sections={editorSections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      label="Billboard editor sections"
      panelClassName="admin-billboard-hud-editor-panels"
    >
        {activeSection === 'heading' ? (
            <BillboardPanel
              id="01"
              title="Heading"
              description="Title, subtitle, and typography"
              className="is-heading-panel"
              showHeader={false}
            >
              <div className="admin-billboard-hud-heading-workbench">
                <div className="admin-billboard-hud-heading-copy-box">
                  <BillboardHeadingTextField
                    label="Title"
                    value={title}
                    inputRef={titleInputRef}
                    selection={titleSelection}
                  color={titleColor}
                  colorOptions={visibleTitleColorOptions}
                  markedSpans={titleHighlights}
                    onChange={onTitleChange}
                    onBlur={onTitleBlur}
                    onSelectionCapture={onTitleSelectionCapture}
                    onSelectionColorChange={onTitleSelectionColorChange}
                    onCoreColorChange={onTitleColorChange}
                    onHighlightsChange={onTitleHighlightsChange}
                  />
                  <BillboardHeadingTextField
                    label="Subtitle"
                    value={subtitle}
                    inputRef={subtitleInputRef}
                    selection={subtitleSelection}
                  color={subtitleColor}
                  colorOptions={visibleSubtitleColorOptions}
                  markedSpans={subtitleHighlights}
                    onChange={onSubtitleChange}
                    onBlur={onSubtitleBlur}
                    onSelectionCapture={onSubtitleSelectionCapture}
                    onSelectionColorChange={onSubtitleSelectionColorChange}
                    onCoreColorChange={onSubtitleColorChange}
                    onHighlightsChange={onSubtitleHighlightsChange}
                  />
                </div>
                <div className="admin-billboard-hud-heading-controls-box">
                  <div className="admin-billboard-hud-heading-settings-box admin-billboard-hud-heading-type-panel">
                    {showTitleFont ? (
                      <BillboardSegment label="Title font" options={titleFontOptions} value={titleFontFamily} onChange={onTitleFontFamilyChange} />
                    ) : null}
                    {showTitleAlignment ? (
                      <BillboardSegment label="Title alignment" options={justifyOptions} value={justify} onChange={onJustifyChange} />
                    ) : null}
                    {showTitleWeight ? (
                      <BillboardSegment
                        label="Title weight"
                        options={titleWeightOptions.map((weight) => ({ value: Number(weight), label: String(weight) }))}
                        value={titleFontWeight}
                        onChange={(nextValue) => onTitleFontWeightChange?.(Number(nextValue))}
                      />
                    ) : null}
                  </div>
                  <div className="admin-billboard-hud-heading-slider-columns">
                    <div className="admin-billboard-hud-heading-settings-box admin-billboard-hud-heading-slider-panel admin-billboard-hud-heading-title-panel">
                      {showTitleSize ? (
                        <BillboardSlider
                          label="Title size"
                          ariaLabel="Title size"
                          value={titleSizeRem}
                          min={2.4}
                          max={8}
                          step={0.05}
                          unit="rem"
                          onChange={onTitleSizeRemChange}
                        />
                      ) : null}
                      <BillboardSlider label="Leading" ariaLabel="Title line height" value={lineSpacing} min={0.85} max={1.25} step={0.01} onChange={onLineSpacingChange} />
                      <BillboardSlider label="Title Tracking" ariaLabel="Title tracking" value={titleTrackingEm} min={-0.12} max={0.04} step={0.005} unit="em" onChange={onTitleTrackingEmChange} />
                    </div>
                    <div className="admin-billboard-hud-heading-settings-box admin-billboard-hud-heading-slider-panel admin-billboard-hud-heading-subtitle-panel">
                      <BillboardSlider
                        label="Subtitle size"
                        ariaLabel="Subtitle size"
                        value={subtitleSizeRem}
                        min={1}
                        max={8}
                        step={0.05}
                        unit="rem"
                        onChange={onSubtitleSizeRemChange}
                      />
                      <BillboardSlider
                        label="Header gap"
                        ariaLabel="Header gap"
                        value={normalizeBillboardHeaderGap(headerGapRem) ?? 1.15}
                        min={BILLBOARD_HEADER_GAP_MIN_REM}
                        max={BILLBOARD_HEADER_GAP_MAX_REM}
                        step={BILLBOARD_HEADER_GAP_STEP_REM}
                        unit="rem"
                        onChange={onHeaderGapRemChange}
                      />
                      <BillboardSlider label="Subtitle Tracking" ariaLabel="Subtitle tracking" value={subtitleTrackingEm} min={-0.12} max={0.04} step={0.005} unit="em" onChange={onSubtitleTrackingEmChange} />
                    </div>
                  </div>
                </div>
            </div>
          </BillboardPanel>
        ) : null}

        {activeSection === 'copy' ? (
          <BillboardPanel id="02" title="Copy" showHeader={false}>
            <div className="admin-billboard-editor-copy-grid">
              <div className="admin-billboard-editor-copy-fields">
                <BillboardControlField label="Body copy">
                  <div className={`admin-billboard-hud-copy-editor is-bg-${String(bgTone || 'white').trim() || 'white'} ${String(bodyColorClassName || '').trim()}`}>
                    <AdminHtmlEditor
                      ariaLabel="Billboard body copy"
                      value={String(bodyHtml || '')}
                      onChange={(nextValue) => onBodyHtmlChange?.(nextValue)}
                      onBlur={() => onBodyHtmlBlur?.()}
                      baseColorClassName={bodyColorClassName}
                      onBaseColorChange={onBodyColorChange}
                      compact
                      showModeTabs
                      showFooterToggle={false}
                      showAlignmentControls={false}
                      showBlockFormatControls={false}
                      toolbarPreset="inline-basic"
                      paletteVariant="hud"
                    />
                  </div>
                  <small>Edit this copy visually, or open HTML to edit the same content as source.</small>
                </BillboardControlField>
              </div>
              <div className="admin-billboard-editor-copy-controls">
                <BillboardSlider
                  label="Lead copy size"
                  ariaLabel="Lead copy size"
                  value={normalizeBillboardLeadCopySizeRem(leadCopySizeRem)}
                  min={1}
                  max={4}
                  step={0.05}
                  unit="rem"
                  onChange={onLeadCopySizeRemChange}
                />
                <BillboardSlider
                  label="Lead copy line height"
                  ariaLabel="Lead copy line height"
                  value={normalizeBillboardLeadCopyLineHeight(leadCopyLineHeight)}
                  min={0.9}
                  max={2.2}
                  step={0.05}
                  onChange={onLeadCopyLineHeightChange}
                />
                <BillboardSegment label="Body alignment" options={bodyJustifyOptions} value={bodyJustify} onChange={onBodyJustifyChange} />
                <BillboardWidthControl
                  label="Body width"
                  autoLabel="Page default"
                  value={bodyMaxWidthPx}
                  normalizeValue={normalizeBillboardBodyWidth}
                  min={BILLBOARD_BODY_WIDTH_MIN_PX}
                  max={BILLBOARD_BODY_WIDTH_MAX_PX}
                  step={BILLBOARD_BODY_WIDTH_STEP_PX}
                  onChange={onBodyMaxWidthPxChange}
                />
              </div>
            </div>
            <p className="admin-page-content-layout-hint">Body alignment changes the text inside its centered column. Body width controls that column; it does not move the billboard title.</p>
          </BillboardPanel>
        ) : null}

        {activeSection === 'buttons' ? (
          <section className="admin-billboard-hud-button-section" aria-label="Buttons settings">
            <BillboardSlider
              label="Space above buttons"
              ariaLabel="Billboard button gap"
              value={normalizeBillboardActionGap(actionGapRem) ?? 1}
              min={BILLBOARD_ACTION_GAP_MIN_REM}
              max={BILLBOARD_ACTION_GAP_MAX_REM}
              step={BILLBOARD_ACTION_GAP_STEP_REM}
              unit="rem"
              onChange={onActionGapRemChange}
            />
            <div className="admin-billboard-hud-reference-grid admin-billboard-hud-button-reference-grid">
              <section className="admin-billboard-hud-button-fields" aria-label="Button 1 controls">
                <span className="admin-billboard-hud-button-field-label">Button 1 Label</span>
                <input
                  className="admin-billboard-hud-button-input"
                  aria-label="Button 1 Label"
                  type="text"
                  value={String(buttonLabel || '')}
                  onChange={(event) => onButtonLabelChange?.(event.target.value)}
                  onBlur={() => onButtonLabelBlur?.()}
                />
                <RouteLinkField
                  inputLabel="Button URL/path"
                  value={String(buttonHref || '')}
                  routeRefValue={buttonRouteRef}
                  openInNewWindowValue={buttonOpenInNewWindow}
                  onChange={onButtonHrefChange}
                  onRouteLinkChange={onButtonRouteLinkChange}
                  onOpenInNewWindowChange={onButtonOpenInNewWindowChange}
                  routeOptions={buttonRouteOptions}
                />
                <div className="admin-billboard-hud-button-options-row">
                  <div className="admin-hud-editor-inline-control"><span>Button 1 style</span><BillboardColors ariaLabel="Billboard button style" options={buttonStyleOptions.map((option) => ({ ...option, swatch: option.swatch || buildButtonStyleSwatch(option.value) }))} value={buttonStyle} onChange={onButtonStyleChange} /></div>
                  {button1UsesTone ? (
                    <div className="admin-hud-editor-inline-control"><span>Button 1 color</span><BillboardColors ariaLabel="Billboard button color" options={buttonToneOptions} value={buttonTone} onChange={onButtonToneChange} /></div>
                  ) : null}
                </div>
              </section>
              <section className="admin-billboard-hud-button-fields" aria-label="Button 2 controls">
                <span className="admin-billboard-hud-button-field-label">Button 2 Label</span>
                <input
                  className="admin-billboard-hud-button-input"
                  aria-label="Button 2 Label"
                  type="text"
                  value={String(button2Label || '')}
                  onChange={(event) => onButton2LabelChange?.(event.target.value)}
                  onBlur={() => onButton2LabelBlur?.()}
                />
                <RouteLinkField
                  inputLabel="Button 2 URL/path"
                  value={String(button2Href || '')}
                  routeRefValue={button2RouteRef}
                  openInNewWindowValue={button2OpenInNewWindow}
                  onChange={onButton2HrefChange}
                  onRouteLinkChange={onButton2RouteLinkChange}
                  onOpenInNewWindowChange={onButton2OpenInNewWindowChange}
                  routeOptions={button2RouteOptions}
                />
                <div className="admin-billboard-hud-button-options-row">
                  <div className="admin-hud-editor-inline-control"><span>Button 2 style</span><BillboardColors ariaLabel="Billboard button 2 style" options={button2StyleOptions.map((option) => ({ ...option, swatch: option.swatch || buildButtonStyleSwatch(option.value) }))} value={button2Style} onChange={onButton2StyleChange} /></div>
                  {button2UsesTone ? (
                    <div className="admin-hud-editor-inline-control"><span>Button 2 color</span><BillboardColors ariaLabel="Billboard button 2 color" options={button2ToneOptions} value={button2Tone} onChange={onButton2ToneChange} /></div>
                  ) : null}
                </div>
              </section>
              <section className="admin-billboard-hud-button-preview-column" aria-label="Button preview">
                <span className="admin-front-hud-hero-line-label">Preview</span>
                <div className={`admin-billboard-hud-button-preview is-bg-${previewBackgroundTone}`}>
                  <div className="admin-billboard-hud-button-preview-row">
                    {previewButtons.length ? previewButtons.map((button, index) => (
                      <button
                        key={`billboard-button-preview-${index}`}
                        type="button"
                        className={billboardPreviewButtonClassName(button.style, button.tone)}
                        onClick={(event) => event.preventDefault()}
                      >
                        {button.label}
                      </button>
                    )) : <span className="admin-billboard-hud-button-preview-empty">No buttons added yet.</span>}
                  </div>
                </div>
              </section>
            </div>
          </section>
        ) : null}

        {activeSection === 'layout' ? (
          <BillboardPanel id="04" title="Layout">
            <div className="admin-billboard-editor-width-grid">
              <BillboardWidthControl label="Content width" autoLabel="Page default" value={contentMaxWidthPx} onChange={onContentMaxWidthPxChange} />
              <BillboardSlider
                label="Top padding"
                ariaLabel="Billboard top padding"
                value={normalizeBillboardPadding(paddingTopRem) ?? 4}
                min={BILLBOARD_PADDING_MIN_REM}
                max={BILLBOARD_PADDING_MAX_REM}
                step={BILLBOARD_PADDING_STEP_REM}
                unit="rem"
                onChange={onPaddingTopRemChange}
              />
              <BillboardSlider
                label="Bottom padding"
                className="admin-billboard-editor-bottom-padding"
                ariaLabel="Billboard bottom padding"
                value={normalizeBillboardPadding(paddingBottomRem) ?? 4}
                min={BILLBOARD_PADDING_MIN_REM}
                max={BILLBOARD_PADDING_MAX_REM}
                step={BILLBOARD_PADDING_STEP_REM}
                unit="rem"
                onChange={onPaddingBottomRemChange}
              />
            </div>
            <p className="admin-page-content-layout-hint">The heading follows this same content width before it wraps. Top and bottom padding control the space around the billboard copy and actions.</p>
          </BillboardPanel>
        ) : null}

        {activeSection === 'background' ? (
          <BillboardPanel id="05" title="Background">
            <BackgroundEditorPage
              backgroundTone={bgTone}
              backgroundToneOptions={bgToneOptions}
              backgroundToneLabel="Billboard background"
              onBackgroundToneChange={onBgToneChange}
              backgroundEffectsJson={backgroundEffectsJson}
              onBackgroundEffectsChange={onBackgroundEffectsChange}
              paletteVariant="hud"
            />
          </BillboardPanel>
        ) : null}

        {activeSection === 'block' ? (
          <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
        ) : null}
    </HudEditorModelLayout>
  );
}
