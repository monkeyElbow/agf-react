import { useRef, useState } from 'react';
import AdminHtmlEditor from './AdminHtmlEditor';
import BackgroundEditorPage from './BackgroundEditorPage';
import ColorPalette from './ColorPalette';
import {
  HudEditorBlockOptionsPage,
  HudEditorMain,
  HudEditorModelLayout,
  HudEditorSection,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import { HeroInlineLiveEditor, renderHeroRangesAsNodes } from './HeroHudEditorShared';
import TextHighlightColorControls from './TextHighlightColorControls';
import {
  INTRO_ACCENT_TONE_OPTIONS,
  SEMANTIC_TEXT_COLOR_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
  resolvePanelTextToneClassName,
} from '../lib/colorSystem';
import { parseHeroRangeHighlights, resolveSelectionRangeColor } from '../lib/heroHudRanges';
import { applyTextColorSelection, readColorSelection } from '../lib/textColorSelection';

const INTRO_JUSTIFY_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

function resolveIntroPreviewHeadingClassName(headingColor, textTone) {
  const explicitClassName = String(headingColor || '').trim();
  if (explicitClassName) {
    return explicitClassName;
  }
  return resolvePanelTextToneClassName(textTone, 'dark');
}

function IntroAccentSlider({ label, value, min, max, step, onChange }) {
  const numericValue = Number.isFinite(Number(value))
    ? Math.max(min, Math.min(max, Number(value)))
    : min;

  return (
    <label className="admin-front-hud-range">
      <span>{label}</span>
      <div className="admin-front-hud-range-controls">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericValue}
          aria-label={label}
          onChange={(event) => onChange?.(Number(event.target.value))}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={numericValue}
          aria-label={`${label} value`}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange?.(nextValue === '' ? '' : Number(nextValue));
          }}
        />
      </div>
    </label>
  );
}

export default function IntroHudEditorPanel({
  heading,
  onHeadingChange,
  headingInputRef,
  onHeadingSelectionCapture,
  headingSelection,
  headingHighlightsJson = '',
  headingColor,
  onHeadingColorChange,
  onHeadingSelectionColorChange,
  onRemoveHeadingSpan,
  onClearHeadingSpans,
  extraLine,
  onExtraLineChange,
  extraLineInputRef,
  extraLineTone,
  onExtraLineToneChange,
  extraLineSizeRem,
  onExtraLineSizeChange,
  extraLineSpaceBeforeRem,
  onExtraLineSpaceBeforeChange,
  extraLineLineHeight,
  onExtraLineLineHeightChange,
  bodyMiniEditorEnabled,
  onToggleBodyMiniEditor,
  bodyHtml,
  onBodyHtmlChange,
  bodyColorClassName,
  onBodyColorChange,
  bodyInputRef,
  textTone,
  bgTone,
  onBgToneChange,
  backgroundEffectsJson,
  onBackgroundEffectsChange,
  justify,
  onJustifyChange,
  lineSpacing,
  onLineSpacingChange,
  allowWhiteBackground = false,
  actionsSlot = null,
  blockOptions = null,
}) {
  const paletteSelectionRef = useRef(null);
  const selectedHeadingText = String(headingSelection?.text || '');
  const headingSelectionStart = Number(headingSelection?.start);
  const headingSelectionEnd = Number(headingSelection?.end);
  const hasHeadingSelection = Number.isInteger(headingSelectionStart)
    && Number.isInteger(headingSelectionEnd)
    && headingSelectionEnd > headingSelectionStart
    && selectedHeadingText.length > 0;
  const selectedHeadingPreview = selectedHeadingText.length > 28
    ? `${selectedHeadingText.slice(0, 25)}...`
    : selectedHeadingText;
  const headingColorLabel = hasHeadingSelection
    ? `Selected Color "${selectedHeadingPreview}"`
    : 'Core Color';
  const backgroundOptions = allowWhiteBackground
    ? SURFACE_BG_TONE_OPTIONS
    : SURFACE_BG_TONE_OPTIONS.filter((option) => option.value !== 'white');
  const headingHighlights = parseHeroRangeHighlights(headingHighlightsJson, heading);
  const activeHeadingColorValue = hasHeadingSelection
    ? resolveSelectionRangeColor(headingHighlights, headingSelectionStart, headingSelectionEnd)
    : String(headingColor || '');
  const previewHeadingClassName = resolveIntroPreviewHeadingClassName(headingColor, textTone);
  const [activeEditorSection, setActiveEditorSection] = useState('heading');

  const readLiveHeadingSelection = () => {
    const input = headingInputRef?.current;
    if (!input) {
      return headingSelection;
    }
    return readColorSelection(input, headingSelection, heading);
  };

  const editorSections = appendHudBlockOptionsSection([
    { id: 'heading', label: 'Heading', icon: 'Aa' },
    { id: 'body', label: 'Body', icon: '¶' },
    { id: 'background', label: 'Background', icon: '◌' },
    ...(actionsSlot ? [{ id: 'actions', label: 'Actions', icon: '↗' }] : []),
  ], blockOptions);

  return (
    <HudEditorModelLayout
      className="admin-hud-editor-shell--intro"
      sections={editorSections}
      activeSection={activeEditorSection}
      onSectionChange={setActiveEditorSection}
      label="Intro editor sections"
    >
      <HudEditorMain className="admin-intro-hud-main-stack">
        <div className="admin-intro-hud-heading-page">
          <div className="admin-intro-hud-heading-preview-column">
            <div className="admin-front-hud-field-group admin-intro-hud-heading-group">
              <span className="admin-front-hud-control-label">Heading Text</span>
              <div className={`admin-intro-hud-heading-preview is-bg-${String(bgTone || 'white').trim() || 'white'} is-text-${String(textTone || 'dark').trim() || 'dark'} is-justify-${String(justify || 'center').trim() || 'center'}`}>
                <div className="admin-intro-hud-heading-editor">
                  <HeroInlineLiveEditor
                    lines={[{
                      key: 'heading',
                      label: 'Heading',
                      text: String(heading || ''),
                      className: previewHeadingClassName,
                      highlights: headingHighlights,
                    }]}
                    activeLineKey="heading"
                    lineHeight={Number(lineSpacing || 1.04)}
                    lineGap={0}
                    placeholder="Start intro heading..."
                    showPlaceholders
                    onLineTextChange={(_lineKey, nextValue) => onHeadingChange?.(nextValue)}
                    onLineInteract={(_lineKey, selectionMeta) => onHeadingSelectionCapture?.(selectionMeta)}
                    setLineInputRef={(_lineKey, node) => {
                      if (headingInputRef && typeof headingInputRef === 'object') {
                        headingInputRef.current = node;
                      }
                    }}
                    renderLineContent={(line) => renderHeroRangesAsNodes(line.text, line.highlights)}
                    resolveLineTagName={() => 'h2'}
                    resolveLineClassName={(line) => (
                      `admin-intro-hud-live-heading${line.className ? ` ${line.className}` : ''}`
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="admin-intro-hud-heading-controls">
            <HudEditorSection className="admin-front-hud-card admin-intro-hud-card admin-intro-hud-card--layout" label="Layout settings">
              <div className="admin-intro-hud-layout-control-grid is-stacked">
                <div className="admin-front-hud-row">
                  <span>Justify</span>
                  <div className="admin-front-hud-segment">
                    {INTRO_JUSTIFY_OPTIONS.map((option) => (
                      <button
                        key={`intro-justify-${option.value}`}
                        type="button"
                        className={`admin-front-hud-segment-btn${justify === option.value ? ' is-active' : ''}`}
                        onClick={() => onJustifyChange?.(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="admin-front-hud-range">
                  <span>Line Height {Number(lineSpacing || 0).toFixed(2)}</span>
                  <input
                    type="range"
                    min="0.85"
                    max="1.4"
                    step="0.01"
                    value={String(lineSpacing ?? 1.04)}
                    onChange={(event) => onLineSpacingChange?.(Number(event.target.value))}
                  />
                </label>
              </div>
            </HudEditorSection>
            <div className="admin-intro-hud-heading-color-controls">
              <TextHighlightColorControls
                label={headingColorLabel}
                ariaLabel={headingColorLabel}
                options={SEMANTIC_TEXT_COLOR_OPTIONS}
                value={activeHeadingColorValue}
                onPaletteMouseDown={() => {
                  const liveSelection = readLiveHeadingSelection();
                  paletteSelectionRef.current = liveSelection;
                  onHeadingSelectionCapture?.(liveSelection);
                }}
                onChange={(nextValue) => {
                  const liveSelection = paletteSelectionRef.current || readLiveHeadingSelection();
                  paletteSelectionRef.current = null;
                  const result = applyTextColorSelection({
                    text: heading,
                    lineClassName: headingColor,
                    highlightsJson: headingHighlightsJson,
                    selection: liveSelection,
                    colorValue: nextValue,
                  });
                  if (result.target === 'selection') {
                    onHeadingSelectionColorChange?.(nextValue, result.selection);
                    return;
                  }
                  onHeadingColorChange?.(nextValue);
                }}
                sourceText={heading}
                highlightRanges={headingHighlights}
                onRemoveSpan={onRemoveHeadingSpan}
                onClearSpans={onClearHeadingSpans}
                swatchClassName="is-compact is-icon-only"
              />
            </div>
            <div className="admin-front-hud-field-group admin-intro-hud-accent-group">
              <label className="admin-front-hud-field">
                <span>Accent Line</span>
                <input
                  ref={extraLineInputRef}
                  type="text"
                  value={String(extraLine || '')}
                  onChange={(event) => onExtraLineChange?.(event.target.value)}
                />
              </label>
              <ColorPalette
                variant="hud"
                className="is-compact is-icon-only is-field-linked"
                ariaLabel="Intro accent line color"
                options={INTRO_ACCENT_TONE_OPTIONS}
                value={extraLineTone}
                onChange={(nextValue) => onExtraLineToneChange?.(nextValue)}
              />
              <div className="admin-intro-hud-accent-controls">
                <IntroAccentSlider
                  label="Accent line size (rem)"
                  value={extraLineSizeRem}
                  min={1}
                  max={5}
                  step={0.05}
                  onChange={onExtraLineSizeChange}
                />
                <IntroAccentSlider
                  label="Accent line space above (rem)"
                  value={extraLineSpaceBeforeRem}
                  min={0}
                  max={4}
                  step={0.05}
                  onChange={onExtraLineSpaceBeforeChange}
                />
                <IntroAccentSlider
                  label="Accent line line height"
                  value={extraLineLineHeight}
                  min={0.8}
                  max={1.5}
                  step={0.01}
                  onChange={onExtraLineLineHeightChange}
                />
              </div>
            </div>
          </div>
        </div>

        <HudEditorSection className="admin-front-hud-card admin-intro-hud-card admin-intro-hud-card--body" label="Body settings">
          <div className="admin-front-hud-intro-body-group">
            <div className="admin-front-hud-intro-body-head">
              <span>Body HTML</span>
              <button
                type="button"
                className={`admin-front-hud-mode-toggle is-compact${bodyMiniEditorEnabled ? ' is-active' : ''}`}
                onClick={() => onToggleBodyMiniEditor?.()}
                aria-label={bodyMiniEditorEnabled ? 'Switch to plain textarea mode' : 'Switch to mini HTML mode'}
                title={bodyMiniEditorEnabled ? 'Mini HTML enabled' : 'Mini HTML disabled'}
              >
                {bodyMiniEditorEnabled ? 'HTML' : 'Text'}
              </button>
            </div>
            <div className={`admin-front-hud-intro-body-editor is-bg-${String(bgTone || 'white').trim() || 'white'} is-text-${String(textTone || 'dark').trim() || 'dark'}${bodyColorClassName ? ` ${bodyColorClassName}` : ''}`}>
              {bodyMiniEditorEnabled ? (
                <div className="admin-front-hud-mini-html-wrap">
                  <AdminHtmlEditor
                    compact
                    paletteVariant="hud"
                    value={String(bodyHtml || '')}
                    onChange={(nextValue) => onBodyHtmlChange?.(nextValue)}
                    baseColorClassName={bodyColorClassName}
                    onBaseColorChange={onBodyColorChange}
                    placeholder="Start intro body copy..."
                  />
                </div>
              ) : (
                <label className="admin-front-hud-field">
                  <textarea
                    ref={bodyInputRef}
                    value={String(bodyHtml || '')}
                    onChange={(event) => onBodyHtmlChange?.(event.target.value)}
                  />
                </label>
              )}
            </div>
          </div>
        </HudEditorSection>
      </HudEditorMain>

      <div className="admin-intro-hud-background-page">
        <HudEditorSection className="admin-front-hud-card admin-intro-hud-card" label="Background settings">
          <BackgroundEditorPage
            backgroundTone={bgTone}
            backgroundToneOptions={backgroundOptions}
            backgroundToneLabel="Intro background"
            onBackgroundToneChange={onBgToneChange}
            backgroundEffectsJson={backgroundEffectsJson}
            onBackgroundEffectsChange={onBackgroundEffectsChange}
            paletteVariant="hud"
          />
        </HudEditorSection>
      </div>

      {actionsSlot ? (
        <div className="admin-hud-editor-actions-page admin-hud-editor-settings-rail admin-intro-hud-actions-rail">
          {actionsSlot}
        </div>
      ) : null}
      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}
