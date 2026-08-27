import { useCallback, useState } from 'react';
import AdminHtmlEditor from './AdminHtmlEditor';
import ColorPalette from './ColorPalette';
import RouteLinkField from './RouteLinkField';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import { getTokenSwatch } from '../lib/colorSystem';
import { normalizeBillboardLeadCopySizeRem } from '../lib/dynamicSectionTypography';

export const BILLBOARD_WIDTH_MIN_PX = 560;
export const BILLBOARD_WIDTH_MAX_PX = 1440;
export const BILLBOARD_WIDTH_STEP_PX = 10;
export const BILLBOARD_PADDING_MIN_REM = 0;
export const BILLBOARD_PADDING_MAX_REM = 8;
export const BILLBOARD_PADDING_STEP_REM = 0.25;

export const BILLBOARD_EDITOR_SECTIONS = Object.freeze([
  { id: 'heading', label: 'Heading', icon: 'Aa' },
  { id: 'copy', label: 'Copy', icon: '¶' },
  { id: 'buttons', label: 'Buttons', icon: '↗' },
  { id: 'layout', label: 'Layout', icon: '▦' },
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
  return `Selection Color "${value.length > 28 ? `${value.slice(0, 25)}...` : value}"`;
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

export function BillboardSlider({ label, value, min, max, step, displayValue, onChange, ariaLabel = label }) {
  const safeValue = normalizeSliderValue(value, min, min, max, step);
  return (
    <label className="admin-front-hud-range admin-billboard-editor-slider">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        aria-label={ariaLabel}
        onChange={(event) => onChange?.(normalizeSliderValue(event.target.value, safeValue, min, max, step))}
      />
      <strong>{displayValue ?? safeValue}</strong>
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

function BillboardWidthControl({ label, value, onChange, autoLabel }) {
  const normalizedValue = normalizeBillboardWidth(value);
  const isAuto = normalizedValue == null;
  const handleSliderChange = useCallback((nextValue) => {
    const nextWidth = normalizeBillboardWidth(nextValue);
    if (nextWidth == null || nextWidth === normalizedValue) {
      return;
    }
    onChange?.(nextWidth);
  }, [normalizedValue, onChange]);

  return (
    <div className="admin-billboard-editor-width-control">
      <div className="admin-billboard-editor-width-head">
        <span>{label}</span>
        <strong>{isAuto ? autoLabel : `${normalizedValue}px`}</strong>
      </div>
      <div className="admin-billboard-editor-width-row">
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
          min={BILLBOARD_WIDTH_MIN_PX}
          max={BILLBOARD_WIDTH_MAX_PX}
          step={BILLBOARD_WIDTH_STEP_PX}
          value={normalizedValue ?? BILLBOARD_WIDTH_MIN_PX}
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
  subtitleColor,
  onSubtitleColorChange,
  subtitleColorOptions = [],
  subtitleSizeRem,
  onSubtitleSizeRemChange,
  body,
  onBodyChange,
  onBodyBlur,
  titleInputRef,
  onTitleSelectionCapture,
  titleSelection,
  titleColor,
  onTitleColorChange,
  onTitleSelectionColorChange,
  titleColorOptions = [],
  bodyHtml,
  onBodyHtmlChange,
  onBodyHtmlBlur,
  leadCopySizeRem,
  onLeadCopySizeRemChange,
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
  lineSpacing,
  onLineSpacingChange,
  titleSizeRem,
  onTitleSizeRemChange,
  titleLetterSpacingEm,
  onTitleLetterSpacingEmChange,
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
  contentMaxWidthPx,
  onContentMaxWidthPxChange,
  paddingTopRem,
  onPaddingTopRemChange,
  paddingBottomRem,
  onPaddingBottomRemChange,
  blockOptions = null,
}) {
  const [activeSection, setActiveSection] = useState('heading');
  const editorSections = appendHudBlockOptionsSection(BILLBOARD_EDITOR_SECTIONS, blockOptions);
  const hasSelection = Boolean(String(titleSelection?.text || '').trim());
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
              headerContent={(
                <div className="admin-billboard-hud-heading-bar-colors">
                  <BillboardColors
                    ariaLabel="Billboard background color"
                    options={bgToneOptions}
                    value={bgTone}
                    onChange={onBgToneChange}
                  />
                </div>
              )}
            >
            <div className="admin-billboard-hud-heading-copy-box">
              <div className="admin-billboard-hud-heading-row">
                <BillboardField label="Title">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={String(title || '')}
                    onChange={(event) => onTitleChange?.(event.target.value)}
                    onBlur={() => onTitleBlur?.()}
                    onSelect={() => onTitleSelectionCapture?.()}
                    onMouseUp={() => onTitleSelectionCapture?.()}
                    onKeyUp={() => onTitleSelectionCapture?.()}
                  />
                </BillboardField>
                <div className="admin-hud-editor-inline-control">
                  <span>{formatSelectionLabel(titleSelection?.text)}</span>
                  <BillboardColors
                    ariaLabel="Billboard title color"
                    options={titleColorOptions}
                    value={titleColor}
                    preventMouseDown
                    onChange={(nextValue) => {
                      if (hasSelection) {
                        onTitleSelectionColorChange?.(nextValue);
                        return;
                      }
                      onTitleColorChange?.(nextValue);
                    }}
                  />
                </div>
                <BillboardSlider
                  label="Title size"
                  ariaLabel="Title size"
                  value={titleSizeRem}
                  min={2.4}
                  max={8}
                  step={0.05}
                  displayValue={`${Number(titleSizeRem || 3.4).toFixed(2)}rem`}
                  onChange={onTitleSizeRemChange}
                />
              </div>
              <div className="admin-billboard-hud-heading-row">
                <BillboardField label="Subtitle">
                  <input type="text" value={String(subtitle || '')} onChange={(event) => onSubtitleChange?.(event.target.value)} onBlur={() => onSubtitleBlur?.()} />
                </BillboardField>
                <div className="admin-hud-editor-inline-control">
                  <span>Subtitle color</span>
                  <BillboardColors ariaLabel="Billboard subtitle color" options={subtitleColorOptions} value={subtitleColor} onChange={onSubtitleColorChange} />
                </div>
                <BillboardSlider
                  label="Subtitle size"
                  ariaLabel="Subtitle size"
                  value={subtitleSizeRem}
                  min={1}
                  max={8}
                  step={0.05}
                  displayValue={`${Number(subtitleSizeRem || 1.18).toFixed(2)}rem`}
                  onChange={onSubtitleSizeRemChange}
                />
              </div>
            </div>
            <div className="admin-billboard-hud-heading-settings">
              <div className="admin-billboard-hud-heading-settings-box">
                <BillboardSegment label="Title font" options={titleFontOptions} value={titleFontFamily} onChange={onTitleFontFamilyChange} />
                <BillboardSegment label="Alignment" options={justifyOptions} value={justify} onChange={onJustifyChange} />
                <BillboardSegment
                  label="Title weight"
                  options={titleWeightOptions.map((weight) => ({ value: Number(weight), label: String(weight) }))}
                  value={titleFontWeight}
                  onChange={(nextValue) => onTitleFontWeightChange?.(Number(nextValue))}
                />
              </div>
              <div className="admin-billboard-hud-heading-settings-box">
                <BillboardSlider label="Leading" ariaLabel="Title line height" value={lineSpacing} min={0.85} max={1.25} step={0.01} displayValue={Number(lineSpacing || 1).toFixed(2)} onChange={onLineSpacingChange} />
                <BillboardSlider label="Tracking" ariaLabel="Title tracking" value={titleLetterSpacingEm} min={-0.12} max={0.04} step={0.005} displayValue={`${Number(titleLetterSpacingEm || 0).toFixed(3)}em`} onChange={onTitleLetterSpacingEmChange} />
              </div>
            </div>
          </BillboardPanel>
        ) : null}

        {activeSection === 'copy' ? (
          <BillboardPanel id="02" title="Copy" showHeader={false}>
            <div className="admin-billboard-editor-copy-grid">
              <BillboardField label="Lead copy">
                <textarea aria-label="Lead copy" value={String(body || '')} onChange={(event) => onBodyChange?.(event.target.value)} onBlur={() => onBodyBlur?.()} rows={5} />
                <small>Plain text shown before the rich body.</small>
              </BillboardField>
              <BillboardSlider
                label="Lead copy size"
                ariaLabel="Lead copy size"
                value={normalizeBillboardLeadCopySizeRem(leadCopySizeRem)}
                min={1}
                max={4}
                step={0.05}
                displayValue={`${normalizeBillboardLeadCopySizeRem(leadCopySizeRem).toFixed(2)}rem`}
                onChange={onLeadCopySizeRemChange}
              />
              <BillboardControlField label="Body HTML">
                <div className={`admin-billboard-hud-copy-editor is-bg-${String(bgTone || 'white').trim() || 'white'} ${String(bodyColorClassName || '').trim()}`}>
                  <AdminHtmlEditor
                    ariaLabel="Body HTML"
                    value={String(bodyHtml || '')}
                    onChange={(nextValue) => onBodyHtmlChange?.(nextValue)}
                    onBlur={() => onBodyHtmlBlur?.()}
                    baseColorClassName={bodyColorClassName}
                    onBaseColorChange={onBodyColorChange}
                    compact
                    showFooterToggle
                    paletteVariant="hud"
                  />
                </div>
                <small>Rich content rendered after the lead copy.</small>
              </BillboardControlField>
            </div>
          </BillboardPanel>
        ) : null}

        {activeSection === 'buttons' ? (
          <section className="admin-billboard-hud-button-section" aria-label="Buttons settings">
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
          <BillboardPanel id="04" title="Layout" description="Bounded width and surface">
            <div className="admin-billboard-editor-width-grid">
              <BillboardWidthControl label="Content width" autoLabel="Page default" value={contentMaxWidthPx} onChange={onContentMaxWidthPxChange} />
              <BillboardSlider
                label="Top padding"
                ariaLabel="Billboard top padding"
                value={normalizeBillboardPadding(paddingTopRem) ?? 4}
                min={BILLBOARD_PADDING_MIN_REM}
                max={BILLBOARD_PADDING_MAX_REM}
                step={BILLBOARD_PADDING_STEP_REM}
                displayValue={`${normalizeBillboardPadding(paddingTopRem) ?? 4}rem`}
                onChange={onPaddingTopRemChange}
              />
              <BillboardSlider
                label="Bottom padding"
                ariaLabel="Billboard bottom padding"
                value={normalizeBillboardPadding(paddingBottomRem) ?? 4}
                min={BILLBOARD_PADDING_MIN_REM}
                max={BILLBOARD_PADDING_MAX_REM}
                step={BILLBOARD_PADDING_STEP_REM}
                displayValue={`${normalizeBillboardPadding(paddingBottomRem) ?? 4}rem`}
                onChange={onPaddingBottomRemChange}
              />
            </div>
            <p className="admin-page-content-layout-hint">The heading follows this same content width before it wraps. Top and bottom padding control the space around the billboard copy and actions.</p>
          </BillboardPanel>
        ) : null}

        {activeSection === 'block' ? (
          <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
        ) : null}
    </HudEditorModelLayout>
  );
}
