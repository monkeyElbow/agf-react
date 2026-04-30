import { useState } from 'react';
import ColorPalette from './ColorPalette';
import { getTokenSwatch } from '../lib/colorSystem';
import { actionButtonClassName } from '../lib/dynamicPageBlocks';

const BILLBOARD_WIDTH_PRESETS = Object.freeze([
  { id: 'narrow', label: 'Narrow', maxWidthPx: 760 },
  { id: 'default', label: 'Default', maxWidthPx: null },
  { id: 'wide', label: 'Wide', maxWidthPx: 1120 },
]);

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

export default function BillboardHudEditorPanel({
  title,
  onTitleChange,
  onTitleBlur,
  subtitle,
  onSubtitleChange,
  onSubtitleBlur,
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
  bodyInputRef,
  textTone,
  onTextToneChange,
  textToneOptions = [],
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
  onButtonHrefChange,
  onButtonHrefBlur,
  buttonHrefLabel = 'Button URL/path',
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
  onButton2HrefChange,
  onButton2HrefBlur,
  button2HrefLabel = 'Button 2 URL/path',
  button2Style,
  onButton2StyleChange,
  button2StyleOptions = [],
  button2Tone,
  onButton2ToneChange,
  button2ToneOptions = [],
  contentMaxWidthPx,
  onContentMaxWidthPxChange,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasSelection = Boolean(String(titleSelection?.text || '').trim());
  const resolvedButtonPreviewLabel = String(buttonLabel || '').trim() || 'Preview button';
  const resolvedButton2PreviewLabel = String(button2Label || '').trim() || 'Secondary button';
  const normalizedContentWidth = Number.isFinite(Number(contentMaxWidthPx))
    ? Math.round(Number(contentMaxWidthPx))
    : null;
  const widthPresetId = BILLBOARD_WIDTH_PRESETS.find((preset) => preset.maxWidthPx === normalizedContentWidth)?.id
    || (normalizedContentWidth == null ? 'default' : '');

  return (
    <div className="admin-billboard-hud-editor">
      <section className="admin-front-hud-card admin-billboard-hud-card admin-billboard-hud-card--title">
        <div className="admin-front-hud-card-head">
          <h4>Title</h4>
          <p>Copy, color, and type</p>
        </div>
        <div className="admin-billboard-hud-title-layout">
          <div className="admin-billboard-hud-title-column">
            <label className="admin-front-hud-field admin-billboard-hud-field is-tight">
              <span>Title</span>
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
            </label>
            <div className="admin-front-hud-field-group">
              <span className="admin-front-hud-hero-line-label">{formatSelectionLabel(titleSelection?.text)}</span>
              <ColorPalette
                variant="hud"
                className="is-compact is-icon-only is-field-linked"
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
          </div>
          <div className="admin-billboard-hud-title-column">
            <div className="admin-billboard-hud-title-control-grid">
              <div className="admin-front-hud-row">
                <span>Font</span>
                <div className="admin-front-hud-segment">
                  {titleFontOptions.map((option) => (
                    <button
                      key={`billboard-title-font-${option.value}`}
                      type="button"
                      className={`admin-front-hud-segment-btn${titleFontFamily === option.value ? ' is-active' : ''}`}
                      onClick={() => onTitleFontFamilyChange?.(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-front-hud-row">
                <span>Weight</span>
                <div className="admin-front-hud-segment">
                  {titleWeightOptions.map((weight) => (
                    <button
                      key={`billboard-title-weight-${weight}`}
                      type="button"
                      className={`admin-front-hud-segment-btn${titleFontWeight === weight ? ' is-active' : ''}`}
                      onClick={() => onTitleFontWeightChange?.(weight)}
                    >
                      {weight}
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-front-hud-row">
                <span>Justify</span>
                <div className="admin-front-hud-segment">
                  {justifyOptions.map((option) => (
                    <button
                      key={`billboard-justify-${option.value}`}
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
          <div className="admin-billboard-hud-title-column">
            <div className="admin-billboard-hud-range-grid">
              <label className="admin-front-hud-range">
                <span>Line Height {Number(lineSpacing || 0).toFixed(2)}</span>
                <input
                  type="range"
                  min="0.85"
                  max="1.25"
                  step="0.01"
                  value={Number(lineSpacing || 1)}
                  onChange={(event) => onLineSpacingChange?.(Number(event.target.value))}
                />
              </label>
              <label className="admin-front-hud-range">
                <span>Title Size {Number(titleSizeRem || 0).toFixed(2)}rem</span>
                <input
                  type="range"
                  min="2.4"
                  max="8"
                  step="0.05"
                  value={Number(titleSizeRem || 3.4)}
                  onChange={(event) => onTitleSizeRemChange?.(Number(event.target.value))}
                />
              </label>
              <label className="admin-front-hud-range">
                <span>Letter Spacing {Number(titleLetterSpacingEm || 0).toFixed(3)}em</span>
                <input
                  type="range"
                  min="-0.08"
                  max="0.04"
                  step="0.005"
                  value={Number(titleLetterSpacingEm || 0)}
                  onChange={(event) => onTitleLetterSpacingEmChange?.(Number(event.target.value))}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-front-hud-card admin-billboard-hud-card admin-billboard-hud-card--body">
        <div className="admin-front-hud-card-head">
          <h4>Body</h4>
          <p>Copy and section color</p>
        </div>
        <label className="admin-front-hud-field admin-billboard-hud-field is-tight">
          <span>Subtitle</span>
          <input
            type="text"
            value={String(subtitle || '')}
            onChange={(event) => onSubtitleChange?.(event.target.value)}
            onBlur={() => onSubtitleBlur?.()}
          />
        </label>
        <label className="admin-front-hud-field admin-billboard-hud-field is-tight">
          <span>Lead Copy</span>
          <textarea
            value={String(body || '')}
            onChange={(event) => onBodyChange?.(event.target.value)}
            onBlur={() => onBodyBlur?.()}
            rows={3}
          />
        </label>
        <label className="admin-front-hud-field admin-billboard-hud-field">
          <span>Body HTML (optional rich copy)</span>
          <textarea
            ref={bodyInputRef}
            value={String(bodyHtml || '')}
            onChange={(event) => onBodyHtmlChange?.(event.target.value)}
            onBlur={() => onBodyHtmlBlur?.()}
          />
        </label>
        <div className="admin-billboard-hud-compact-grid">
          <div className="admin-front-hud-row">
            <span>Text Color</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Billboard text color"
              options={textToneOptions}
              value={textTone}
              onChange={(nextValue) => onTextToneChange?.(nextValue)}
            />
          </div>
          <div className="admin-front-hud-row">
            <span>Background</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Billboard background"
              options={bgToneOptions}
              value={bgTone}
              onChange={(nextValue) => onBgToneChange?.(nextValue)}
            />
          </div>
        </div>
      </section>

      <section className="admin-front-hud-card admin-billboard-hud-card admin-billboard-hud-card--button">
        <div className="admin-front-hud-card-head">
          <h4>Buttons</h4>
          <p>Labels, links, and styles</p>
        </div>
        <div className="admin-billboard-hud-button-grid">
          <div className="admin-billboard-hud-button-fields">
            <span className="admin-front-hud-hero-line-label">Button 1</span>
            <label className="admin-front-hud-field admin-billboard-hud-field is-tight">
              <span>Button 1 Label</span>
              <input
                type="text"
                value={String(buttonLabel || '')}
                onChange={(event) => onButtonLabelChange?.(event.target.value)}
                onBlur={() => onButtonLabelBlur?.()}
              />
            </label>
            <label className="admin-front-hud-field admin-billboard-hud-field is-tight">
              <span>{buttonHrefLabel}</span>
              <input
                type="text"
                value={String(buttonHref || '')}
                onChange={(event) => onButtonHrefChange?.(event.target.value)}
                onBlur={() => onButtonHrefBlur?.()}
              />
            </label>
          </div>
          <div className="admin-billboard-hud-button-fields">
            <span className="admin-front-hud-hero-line-label">Button 2</span>
            <label className="admin-front-hud-field admin-billboard-hud-field is-tight">
              <span>Button 2 Label</span>
              <input
                type="text"
                value={String(button2Label || '')}
                onChange={(event) => onButton2LabelChange?.(event.target.value)}
                onBlur={() => onButton2LabelBlur?.()}
              />
            </label>
            <label className="admin-front-hud-field admin-billboard-hud-field is-tight">
              <span>{button2HrefLabel}</span>
              <input
                type="text"
                value={String(button2Href || '')}
                onChange={(event) => onButton2HrefChange?.(event.target.value)}
                onBlur={() => onButton2HrefBlur?.()}
              />
            </label>
          </div>
          <div className="admin-billboard-hud-button-preview">
            <span className="admin-front-hud-hero-line-label">Preview</span>
            <div className="admin-billboard-hud-button-preview-row">
              <span className={actionButtonClassName(buttonStyle, buttonTone)} aria-hidden="true">
                {resolvedButtonPreviewLabel}
              </span>
              <span className={actionButtonClassName(button2Style, button2Tone)} aria-hidden="true">
                {resolvedButton2PreviewLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="admin-billboard-hud-compact-grid">
          <div className="admin-front-hud-row">
            <span>Button 1 Style</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Billboard button style"
              options={buttonStyleOptions.map((option) => ({
                ...option,
                swatch: option.swatch || buildButtonStyleSwatch(option.value),
              }))}
              value={buttonStyle}
              onChange={(nextValue) => onButtonStyleChange?.(nextValue)}
            />
          </div>
          <div className="admin-front-hud-row">
            <span>Button 1 Color</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Billboard button color"
              options={buttonToneOptions}
              value={buttonTone}
              onChange={(nextValue) => onButtonToneChange?.(nextValue)}
            />
          </div>
          <div className="admin-front-hud-row">
            <span>Button 2 Style</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Billboard button 2 style"
              options={button2StyleOptions.map((option) => ({
                ...option,
                swatch: option.swatch || buildButtonStyleSwatch(option.value),
              }))}
              value={button2Style}
              onChange={(nextValue) => onButton2StyleChange?.(nextValue)}
            />
          </div>
          <div className="admin-front-hud-row">
            <span>Button 2 Color</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Billboard button 2 color"
              options={button2ToneOptions}
              value={button2Tone}
              onChange={(nextValue) => onButton2ToneChange?.(nextValue)}
            />
          </div>
        </div>
      </section>

      <section className="admin-front-hud-card admin-billboard-hud-card admin-billboard-hud-card--layout">
        <div className="admin-front-hud-card-head">
          <h4>Layout</h4>
          <p>Widen or tighten the billboard rail without changing the block type.</p>
        </div>
        <div className="admin-page-content-layout-meta">
          <p className="admin-page-content-layout-hint">
            Default keeps the page-native billboard width. Advanced exposes width presets and a raw override when the copy needs more or less room.
          </p>
          <button
            type="button"
            className="admin-front-hud-mini-action admin-page-content-advanced-toggle"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((current) => !current)}
          >
            {advancedOpen ? 'Hide advanced layout' : 'Advanced layout'}
          </button>
        </div>
        {advancedOpen ? (
          <div className="admin-page-content-layout-shell admin-billboard-layout-shell">
            <section className="admin-page-content-layout-card">
              <span className="admin-front-hud-control-label">Width</span>
              <div className="admin-page-content-preset-row" role="group" aria-label="Billboard width presets">
                {BILLBOARD_WIDTH_PRESETS.map((preset) => (
                  <button
                    key={`billboard-width-${preset.id}`}
                    type="button"
                    className={`admin-front-hud-segment-btn${widthPresetId === preset.id ? ' is-active' : ''}`}
                    aria-pressed={widthPresetId === preset.id}
                    onClick={() => onContentMaxWidthPxChange?.(preset.maxWidthPx)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="admin-page-content-preset-status">
                {normalizedContentWidth == null ? 'Default page width' : `Custom width: ${normalizedContentWidth}px`}
              </p>
            </section>
            <div className="admin-page-content-advanced-grid admin-billboard-layout-advanced-grid">
              <label className="admin-front-hud-field">
                <span>Content max width (px)</span>
                <input
                  type="number"
                  min="560"
                  max="1440"
                  step="10"
                  value={normalizedContentWidth ?? ''}
                  placeholder="Default"
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    onContentMaxWidthPxChange?.(nextValue === '' ? null : Number(nextValue));
                  }}
                />
              </label>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
