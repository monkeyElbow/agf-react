import AdminHtmlEditor from './AdminHtmlEditor';
import ColorPalette from './ColorPalette';
import { HudEditorMain, HudEditorSection, HudEditorSettingsRail, HudEditorShell } from './HudEditorShell';
import { HeroInlineLiveEditor, renderHeroRangesAsNodes } from './HeroHudEditorShared';
import TextHighlightColorControls from './TextHighlightColorControls';
import {
  INTRO_ACCENT_TONE_OPTIONS,
  PANEL_TEXT_TONE_OPTIONS,
  SEMANTIC_TEXT_COLOR_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
  resolvePanelTextToneClassName,
} from '../lib/colorSystem';
import { parseHeroRangeHighlights, resolveSelectionRangeColor } from '../lib/heroHudRanges';

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
  bodyMiniEditorEnabled,
  onToggleBodyMiniEditor,
  bodyHtml,
  onBodyHtmlChange,
  bodyInputRef,
  textTone,
  onTextToneChange,
  bgTone,
  onBgToneChange,
  justify,
  onJustifyChange,
  lineSpacing,
  onLineSpacingChange,
  allowWhiteBackground = false,
  actionsSlot = null,
}) {
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
    ? `Selection Color "${selectedHeadingPreview}"`
    : 'Core Color';
  const backgroundOptions = allowWhiteBackground
    ? SURFACE_BG_TONE_OPTIONS
    : SURFACE_BG_TONE_OPTIONS.filter((option) => option.value !== 'white');
  const headingHighlights = parseHeroRangeHighlights(headingHighlightsJson, heading);
  const activeHeadingColorValue = hasHeadingSelection
    ? resolveSelectionRangeColor(headingHighlights, headingSelectionStart, headingSelectionEnd)
    : String(headingColor || '');
  const previewHeadingClassName = resolveIntroPreviewHeadingClassName(headingColor, textTone);

  return (
    <HudEditorShell className="admin-hud-editor-shell--intro">
      <HudEditorMain className="admin-intro-hud-main-stack">
        <HudEditorSection className="admin-front-hud-card admin-intro-hud-card admin-intro-hud-card--layout" label="Layout settings">
          <div className="admin-intro-hud-layout-control-grid is-stacked">
            <div className="admin-front-hud-row">
              <span>Background Color</span>
              <ColorPalette
                variant="hud"
                className="is-compact is-icon-only"
                ariaLabel="Intro background"
                options={backgroundOptions}
                value={bgTone}
                onChange={(nextValue) => onBgToneChange?.(nextValue)}
              />
            </div>
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
                onLineInteract={() => onHeadingSelectionCapture?.()}
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
          <TextHighlightColorControls
            label={headingColorLabel}
            ariaLabel={headingColorLabel}
            options={SEMANTIC_TEXT_COLOR_OPTIONS}
            value={activeHeadingColorValue}
            onChange={(nextValue) => {
              if (hasHeadingSelection) {
                onHeadingSelectionColorChange?.(nextValue);
                return;
              }
              onHeadingColorChange?.(nextValue);
            }}
            note="Highlight text first for span color. With no selection, color applies to full heading."
            sourceText={heading}
            highlightRanges={headingHighlights}
            onRemoveSpan={onRemoveHeadingSpan}
            onClearSpans={onClearHeadingSpans}
            swatchClassName="is-compact is-icon-only"
            notePlacement="inline"
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
            <div className={`admin-front-hud-intro-body-editor is-bg-${String(bgTone || 'white').trim() || 'white'} is-text-${String(textTone || 'dark').trim() || 'dark'}`}>
              {bodyMiniEditorEnabled ? (
                <div className="admin-front-hud-mini-html-wrap">
                  <AdminHtmlEditor
                    compact
                    value={String(bodyHtml || '')}
                    onChange={(nextValue) => onBodyHtmlChange?.(nextValue)}
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
          <div className="admin-front-hud-row admin-front-hud-intro-body-tone">
            <span>Base Body Tone</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only"
              ariaLabel="Intro body text color"
              options={PANEL_TEXT_TONE_OPTIONS}
              value={textTone}
              onChange={(nextValue) => onTextToneChange?.(nextValue)}
            />
          </div>
        </HudEditorSection>
      </HudEditorMain>

      <HudEditorSettingsRail>
        {actionsSlot}
      </HudEditorSettingsRail>
    </HudEditorShell>
  );
}
