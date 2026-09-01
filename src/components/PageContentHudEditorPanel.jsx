import { useMemo, useState } from 'react';
import AdminHtmlEditor from './AdminHtmlEditor';
import ColorPalette from './ColorPalette';
import useBufferedFieldDrafts from '../hooks/useBufferedFieldDrafts';
import {
  getPageContentEditorField,
  getPageContentEditorHtml,
  hasLegacyPageContentSource,
} from '../lib/pageContentEditorHtml';
import {
  PANEL_TEXT_TONE_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
} from '../lib/colorSystem';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';

export const PAGE_CONTENT_WIDTH_PRESETS = Object.freeze([
  { id: 'narrow', label: 'Narrow', maxWidthPx: 720 },
  { id: 'standard', label: 'Standard', maxWidthPx: 980 },
  { id: 'wide', label: 'Wide', maxWidthPx: 1200 },
]);

export const PAGE_CONTENT_SPACING_PRESETS = Object.freeze([
  {
    id: 'tight',
    label: 'Tight',
    values: {
      spaceBeforeRem: 0.25,
      spaceAfterRem: 0.25,
      paddingTopRem: 1.5,
      paddingBottomRem: 1.5,
    },
  },
  {
    id: 'standard',
    label: 'Standard',
    values: {
      spaceBeforeRem: 0.5,
      spaceAfterRem: 0.5,
      paddingTopRem: 2.4,
      paddingBottomRem: 2.4,
    },
  },
  {
    id: 'relaxed',
    label: 'Relaxed',
    values: {
      spaceBeforeRem: 1,
      spaceAfterRem: 1,
      paddingTopRem: 3.25,
      paddingBottomRem: 3.25,
    },
  },
]);

function toPageContentNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roughlyMatches(left, right) {
  return Math.abs(Number(left) - Number(right)) < 0.01;
}

function getPageContentWidthValue(settings = {}) {
  return toPageContentNumber(settings.contentMaxWidthPx, 980);
}

function getPageContentSpacingValues(settings = {}) {
  return {
    spaceBeforeRem: toPageContentNumber(settings.spaceBeforeRem, 0.5),
    spaceAfterRem: toPageContentNumber(settings.spaceAfterRem, 0.5),
    paddingTopRem: toPageContentNumber(settings.paddingTopRem, 2.4),
    paddingBottomRem: toPageContentNumber(settings.paddingBottomRem, 2.4),
  };
}

function PageContentAdvancedSlider({
  label,
  value,
  fallback,
  min,
  max,
  step,
  unit,
  onChange,
}) {
  const numericValue = Math.min(max, Math.max(min, toPageContentNumber(value, fallback)));
  const labelText = `${label} (${unit})`;

  return (
    <div className="admin-front-hud-range admin-page-content-advanced-slider">
      <span id={`page-content-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{labelText}</span>
      <div className="admin-range-number-control">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericValue}
          aria-label={labelText}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? fallback}
          aria-label={`${labelText} value`}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue === '' ? '' : Number(nextValue));
          }}
        />
        <span aria-hidden="true">{unit}</span>
      </div>
    </div>
  );
}

function PageContentSurfaceToneControls({ settings = {}, onSettingChange }) {
  if (typeof onSettingChange !== 'function') {
    return null;
  }

  return (
    <section className="admin-page-content-layout-card admin-page-content-surface-tone-card">
      <span className="admin-front-hud-control-label">Surface</span>
      <div className="admin-page-content-surface-tone-grid">
        <label>
          <span>Section background</span>
          <ColorPalette
            variant="admin"
            className="is-compact admin-hero-inline-swatch-list is-icon-only"
            ariaLabel="Section background"
            options={SURFACE_BG_TONE_OPTIONS}
            value={String(settings.bgTone || 'white')}
            preventMouseDown
            onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
          />
        </label>
        <label>
          <span>Section text color</span>
          <ColorPalette
            variant="admin"
            className="is-compact admin-hero-inline-swatch-list is-icon-only"
            ariaLabel="Section text color"
            options={PANEL_TEXT_TONE_OPTIONS}
            value={String(settings.textTone || 'dark')}
            preventMouseDown
            onChange={(nextValue) => onSettingChange('textTone', nextValue)}
          />
        </label>
      </div>
    </section>
  );
}

export function resolvePageContentWidthPreset(settings = {}) {
  const width = getPageContentWidthValue(settings);
  return PAGE_CONTENT_WIDTH_PRESETS.find((preset) => preset.maxWidthPx === width)?.id || '';
}

export function resolvePageContentSpacingPreset(settings = {}) {
  const current = getPageContentSpacingValues(settings);
  return PAGE_CONTENT_SPACING_PRESETS.find((preset) => (
    roughlyMatches(current.spaceBeforeRem, preset.values.spaceBeforeRem)
    && roughlyMatches(current.spaceAfterRem, preset.values.spaceAfterRem)
    && roughlyMatches(current.paddingTopRem, preset.values.paddingTopRem)
    && roughlyMatches(current.paddingBottomRem, preset.values.paddingBottomRem)
  ))?.id || '';
}

export function PageContentLayoutControls({
  settings = {},
  onSettingChange,
  className = '',
}) {
  if (typeof onSettingChange !== 'function') {
    return null;
  }

  return (
    <div className={`admin-page-content-layout-shell${className ? ` ${className}` : ''}`}>
      <section className="admin-page-content-layout-card">
        <span className="admin-front-hud-control-label">Typography</span>
        <PageContentAdvancedSlider
          label="Body font size"
          value={settings.bodyFontSizeRem}
          fallback={1.1}
          min={0.8}
          max={2.4}
          step={0.05}
          unit="rem"
          onChange={(nextValue) => onSettingChange('bodyFontSizeRem', nextValue)}
        />
      </section>

      <section className="admin-page-content-layout-card">
        <span className="admin-front-hud-control-label">Width</span>
        <PageContentAdvancedSlider
          label="Content max width"
          value={settings.contentMaxWidthPx}
          fallback={980}
          min={560}
          max={1440}
          step={10}
          unit="px"
          onChange={(nextValue) => onSettingChange('contentMaxWidthPx', nextValue)}
        />
      </section>

      <section className="admin-page-content-layout-card">
        <span className="admin-front-hud-control-label">Spacing</span>
        <div className="admin-page-content-advanced-grid">
          <PageContentAdvancedSlider
            label="Space before"
            value={settings.spaceBeforeRem}
            fallback={0.5}
            min={0}
            max={8}
            step={0.05}
            unit="rem"
            onChange={(nextValue) => onSettingChange('spaceBeforeRem', nextValue)}
          />
          <PageContentAdvancedSlider
            label="Space after"
            value={settings.spaceAfterRem}
            fallback={0.5}
            min={0}
            max={8}
            step={0.05}
            unit="rem"
            onChange={(nextValue) => onSettingChange('spaceAfterRem', nextValue)}
          />
          <PageContentAdvancedSlider
            label="Padding top"
            value={settings.paddingTopRem}
            fallback={2.4}
            min={0}
            max={8}
            step={0.05}
            unit="rem"
            onChange={(nextValue) => onSettingChange('paddingTopRem', nextValue)}
          />
          <PageContentAdvancedSlider
            label="Padding bottom"
            value={settings.paddingBottomRem}
            fallback={2.4}
            min={0}
            max={8}
            step={0.05}
            unit="rem"
            onChange={(nextValue) => onSettingChange('paddingBottomRem', nextValue)}
          />
        </div>
      </section>
    </div>
  );
}

export default function PageContentHudEditorPanel({
  block,
  onSettingChange,
  blockOptions = null,
  sourceRevision = 0,
}) {
  const [miniEditorEnabled, setMiniEditorEnabled] = useState(true);
  const [activeEditorSection, setActiveEditorSection] = useState('content');
  const settings = block?.settings || {};
  const editorField = getPageContentEditorField(settings);
  const usesLegacySource = hasLegacyPageContentSource(settings);
  const htmlDraftFields = useMemo(() => ([
    {
      id: editorField,
      value: getPageContentEditorHtml(settings),
      commit: (nextValue) => {
        onSettingChange?.(editorField, nextValue);
        if (usesLegacySource) {
          onSettingChange?.('body', '');
          onSettingChange?.('fineprint', '');
          onSettingChange?.('addressTitle', '');
          onSettingChange?.('addressLines', '');
        }
      },
    },
  ]), [editorField, onSettingChange, settings, usesLegacySource]);
  const {
    draftValues,
    updateDraftValue,
    commitDraftValue,
  } = useBufferedFieldDrafts({ fields: htmlDraftFields, sourceRevision });
  const editorSections = appendHudBlockOptionsSection([
    { id: 'content', label: 'Content', icon: 'Aa' },
    { id: 'layout', label: 'Layout', icon: '▦' },
  ], blockOptions);

  if (!block || typeof onSettingChange !== 'function') {
    return null;
  }

  return (
    <HudEditorModelLayout
      className="admin-front-hud-page-content-editor"
      sections={editorSections}
      activeSection={activeEditorSection}
      onSectionChange={setActiveEditorSection}
      label="Page content editor sections"
    >
      <section className="admin-hud-editor-panel admin-front-hud-page-content-content-panel">
      <div className="admin-front-hud-field-group admin-front-hud-page-content-mode-group">
        <span className="admin-front-hud-control-label">Editor Type</span>
        <div className="admin-front-hud-page-content-mode-toggle" role="group" aria-label="Page content editor type">
          <button
            type="button"
            className={`admin-front-hud-segment-btn${miniEditorEnabled ? ' is-active' : ''}`}
            aria-pressed={miniEditorEnabled}
            onClick={() => setMiniEditorEnabled(true)}
          >
            Visual
          </button>
          <button
            type="button"
            className={`admin-front-hud-segment-btn${!miniEditorEnabled ? ' is-active' : ''}`}
            aria-pressed={!miniEditorEnabled}
            onClick={() => setMiniEditorEnabled(false)}
          >
            HTML
          </button>
        </div>
      </div>

      <div className="admin-front-hud-page-content-editor-main">
        {miniEditorEnabled ? (
          <div className="admin-front-hud-mini-html-wrap admin-front-hud-page-content-mini-html-wrap">
            <AdminHtmlEditor
              compact
              showFooterToggle={false}
              paletteVariant="hud"
              value={draftValues[editorField] ?? getPageContentEditorHtml(settings)}
              onChange={(nextValue) => updateDraftValue(editorField, nextValue)}
              onBlur={() => commitDraftValue(editorField)}
              baseColorClassName={String(settings.bodyColorClassName || 'is-super-grey')}
              onBaseColorChange={(nextValue) => onSettingChange('bodyColorClassName', nextValue)}
              placeholder="Start page content..."
            />
          </div>
        ) : (
          <div className="admin-front-hud-field admin-front-hud-page-content-html-field">
            <span>Body HTML</span>
            <textarea
              aria-label="Body HTML"
              value={draftValues[editorField] ?? getPageContentEditorHtml(settings)}
              onChange={(event) => updateDraftValue(editorField, event.target.value)}
              onBlur={() => commitDraftValue(editorField)}
            />
          </div>
        )}
      </div>
      </section>

      <section className="admin-hud-editor-panel admin-front-hud-page-content-layout-panel">
        <PageContentSurfaceToneControls
          settings={settings}
          onSettingChange={onSettingChange}
        />
        <PageContentLayoutControls
          settings={settings}
          onSettingChange={onSettingChange}
          className="admin-front-hud-page-content-settings"
        />
      </section>
      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}
