import { useEffect, useMemo, useState } from 'react';
import AdminHtmlEditor from './AdminHtmlEditor';
import ColorPalette from './ColorPalette';
import BackgroundEditorPage from './BackgroundEditorPage';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import { HeroInlineLiveEditor, renderHeroRangesAsNodes } from './HeroHudEditorShared';
import {
  BUTTON_TONE_OPTIONS,
  SEMANTIC_TEXT_COLOR_OPTIONS,
  SURFACE_BG_TONE_OPTIONS,
} from '../lib/colorSystem';
import { parseHeroRangeHighlights, resolveSelectionRangeColor } from '../lib/heroHudRanges';
import { normalizeCtaHudSubmitStyle, normalizeCtaHudSubmitTone } from '../lib/ctaHudSettings';
import { CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS, CTA_FORM_MAX_FIELDS } from '../blocks/foundation/forms';
import useBufferedFieldDrafts from '../hooks/useBufferedFieldDrafts';

const CTA_HUD_SUBMIT_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
];
const CTA_FIELD_TYPE_LABELS = new Map(
  CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);
const CTA_EDITOR_SECTIONS = Object.freeze([
  { id: 'heading', label: 'Heading', icon: 'Aa' },
  { id: 'message', label: 'Message + Submit', icon: '↗' },
  { id: 'fields', label: 'Form Fields', icon: '☷' },
]);

export { normalizeCtaHudSubmitStyle, normalizeCtaHudSubmitTone } from '../lib/ctaHudSettings';

function toPreviewButtonClassName(submitStyle, submitTone) {
  const classes = ['service-native-btn', `is-tone-${normalizeCtaHudSubmitTone(submitTone, submitStyle)}`];
  const normalizedStyle = normalizeCtaHudSubmitStyle(submitStyle);
  if (normalizedStyle === 'dark') {
    classes.push('is-dark');
  }
  if (normalizedStyle === 'outline') {
    classes.push('is-outline');
  }
  return classes.join(' ');
}

function resolveCtaHeadingAutoColor(bgTone) {
  const normalizedBgTone = String(bgTone || '').trim().toLowerCase();
  return normalizedBgTone === 'blue' || normalizedBgTone === 'grey'
    ? 'is-white'
    : 'is-super-grey';
}

function normalizeCtaHudBgTone(value) {
  const token = String(value || '').trim().toLowerCase();
  return ['white', 'sand', 'blue', 'grey'].includes(token) ? token : 'white';
}

export default function CtaHudEditorPanel({
  sourceRevision = 0,
  settings = {},
  fields = [],
  includeContactPreference = false,
  bgTone = 'white',
  submitStyle = 'blue',
  submitTone = 'atlantean',
  bodyHtml = '',
  subtitle = '',
  bodyColorClassName = '',
  titleColor = '',
  titleSelection = { text: '' },
  setTitleInputRef,
  onBodyHtmlChange,
  onSubtitleChange,
  onBodyColorChange,
  onTitleChange,
  onTitleSelectionCapture,
  onFieldsChange,
  onIncludeContactPreferenceChange,
  onSubmitLabelChange,
  onSubmitStyleChange,
  onSubmitToneChange,
  onBgToneChange,
  backgroundEffectsJson = '',
  onBackgroundEffectsChange,
  onApplySelectionColor,
  onTitleColorChange,
  onRemoveTitleSpan,
  onClearTitleSpans,
  blockOptions = null,
}) {
  const titleText = String(settings.title || '');
  const titleHighlights = parseHeroRangeHighlights(settings.titleHighlightsJson, titleText);
  const selectedTitleText = String(titleSelection?.text || '').trim();
  const hasTitleSelection = Boolean(selectedTitleText);
  const titleSelectionStart = Number(titleSelection?.start);
  const titleSelectionEnd = Number(titleSelection?.end);
  const selectedTitlePreview = selectedTitleText.length > 28
    ? `${selectedTitleText.slice(0, 25)}...`
    : selectedTitleText;
  const externalBgTone = normalizeCtaHudBgTone(bgTone);
  const [draftBgTone, setDraftBgTone] = useState(externalBgTone);
  const [hasLocalBgToneDraft, setHasLocalBgToneDraft] = useState(false);
  const resolvedBgTone = hasLocalBgToneDraft ? draftBgTone : externalBgTone;
  const headingColorLabel = hasTitleSelection
    ? `Selected Color "${selectedTitlePreview}"`
    : 'Core Color';
  const autoTitleColorValue = resolveCtaHeadingAutoColor(resolvedBgTone);
  const previewTitleColorValue = String(titleColor || autoTitleColorValue);
  const activeTitleColorValue = hasTitleSelection
    ? resolveSelectionRangeColor(titleHighlights, titleSelectionStart, titleSelectionEnd)
    : String(titleColor || autoTitleColorValue);
  const fieldList = useMemo(() => (Array.isArray(fields) ? fields : []).filter(Boolean), [fields]);
  const submitLabelDraftFields = useMemo(() => ([
    {
      id: 'submitLabel',
      value: settings.submitLabel,
      commit: onSubmitLabelChange,
    },
  ]), [onSubmitLabelChange, settings.submitLabel]);
  const subtitleDraftFields = useMemo(() => ([
    {
      id: 'subtitle',
      value: subtitle,
      commit: onSubtitleChange,
    },
  ]), [onSubtitleChange, subtitle]);
  const {
    draftValues: submitLabelDraftValues,
    updateDraftValue: updateSubmitLabelDraft,
    commitDraftValue: commitSubmitLabelDraft,
  } = useBufferedFieldDrafts({ fields: submitLabelDraftFields, sourceRevision });
  const {
    draftValues: subtitleDraftValues,
    updateDraftValue: updateSubtitleDraft,
    commitDraftValue: commitSubtitleDraft,
  } = useBufferedFieldDrafts({ fields: subtitleDraftFields, sourceRevision });
  const [activeFieldIndex, setActiveFieldIndex] = useState(fieldList.length ? 0 : -1);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('heading');
  const editorSections = appendHudBlockOptionsSection(CTA_EDITOR_SECTIONS, blockOptions);
  const activeField = fieldList[activeFieldIndex] || null;
  const canAddField = fieldList.length < CTA_FORM_MAX_FIELDS;

  useEffect(() => {
    if (!hasLocalBgToneDraft) {
      setDraftBgTone(externalBgTone);
      return;
    }
    if (draftBgTone === externalBgTone) {
      setHasLocalBgToneDraft(false);
    }
  }, [draftBgTone, externalBgTone, hasLocalBgToneDraft]);

  useEffect(() => {
    setActiveFieldIndex((current) => {
      if (!fieldList.length) {
        return -1;
      }
      if (current < 0) {
        return 0;
      }
      return Math.min(current, fieldList.length - 1);
    });
    if (!fieldList.length) {
      setIsFieldEditorOpen(false);
    }
  }, [fieldList]);

  const commitFields = (nextFields, nextActiveIndex = activeFieldIndex, { openEditor = isFieldEditorOpen } = {}) => {
    const normalizedFields = (Array.isArray(nextFields) ? nextFields : []).filter(Boolean);
    onFieldsChange?.(normalizedFields);
    if (!normalizedFields.length) {
      setActiveFieldIndex(-1);
      setIsFieldEditorOpen(false);
      return;
    }
    const boundedIndex = Math.max(0, Math.min(nextActiveIndex, normalizedFields.length - 1));
    setActiveFieldIndex(boundedIndex);
    setIsFieldEditorOpen(Boolean(openEditor));
  };

  const updateField = (index, patch) => {
    commitFields(fieldList.map((field, fieldIndex) => (
      fieldIndex === index ? { ...field, ...patch } : field
    )), index, { openEditor: true });
  };

  const moveField = (index, offset) => {
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= fieldList.length) {
      return;
    }
    const nextFields = [...fieldList];
    const [movedField] = nextFields.splice(index, 1);
    nextFields.splice(targetIndex, 0, movedField);
    commitFields(nextFields, targetIndex, { openEditor: true });
  };

  const removeField = (index) => {
    const nextFields = fieldList.filter((_, fieldIndex) => fieldIndex !== index);
    commitFields(nextFields, Math.max(0, index - 1), { openEditor: nextFields.length > 0 });
  };

  const addField = () => {
    if (!canAddField) {
      return;
    }
    const nextFieldNumber = fieldList.length + 1;
    commitFields([
      ...fieldList,
      {
        id: `field_${nextFieldNumber}`,
        label: `Field ${nextFieldNumber}`,
        type: 'text',
        required: false,
        placeholder: '',
        optionsText: '',
      },
    ], fieldList.length, { openEditor: true });
  };

  const openFieldEditor = (index) => {
    if (index < 0 || index >= fieldList.length) {
      return;
    }
    setActiveFieldIndex(index);
    setIsFieldEditorOpen(true);
  };

  const closeFieldEditor = () => {
    setIsFieldEditorOpen(false);
  };

  const handleBgToneChange = (nextValue) => {
    const normalizedValue = normalizeCtaHudBgTone(nextValue);
    setDraftBgTone(normalizedValue);
    setHasLocalBgToneDraft(normalizedValue !== externalBgTone);
    onBgToneChange?.(normalizedValue);
  };

  return (
    <HudEditorModelLayout
      className="admin-cta-hud-editor admin-cta-hud-editor--reference"
      sections={editorSections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      label="CTA editor sections"
      panelClassName="admin-cta-hud-editor-panels"
    >
      <section className="admin-front-hud-card admin-cta-hud-card admin-cta-hud-card--heading">
        <div className="admin-cta-hud-editor-box admin-cta-hud-editor-box--heading">
          <div className="admin-front-hud-field-group">
            <span className="admin-front-hud-control-label">Form Heading</span>
            <div className={`admin-cta-hud-heading-preview is-bg-${resolvedBgTone}`}>
              <div className="admin-cta-hud-heading-editor">
                <HeroInlineLiveEditor
                  lines={[
                    {
                      key: 'cta-title',
                      label: 'CTA form heading',
                      text: titleText,
                      className: previewTitleColorValue,
                      highlights: titleHighlights,
                    },
                  ]}
                  activeLineKey="cta-title"
                  lineHeight={1.02}
                  placeholder="CTA form heading"
                  showPlaceholders
                  onLineTextChange={(_lineKey, nextValue) => onTitleChange?.(nextValue)}
                  onLineInteract={() => onTitleSelectionCapture?.()}
                  setLineInputRef={(_lineKey, node) => setTitleInputRef?.(node)}
                  renderLineContent={(line) => renderHeroRangesAsNodes(line.text, line.highlights)}
                  resolveLineClassName={(line) => `admin-cta-hud-live-heading${line.className ? ` ${line.className}` : ''}`}
                  resolveLineTagName={() => 'h2'}
                />
              </div>
            </div>
          </div>
          <div className="admin-cta-hud-heading-controls">
            <div className="admin-front-hud-field-group admin-cta-hud-heading-control">
              <span className="admin-front-hud-control-label">{headingColorLabel}</span>
              <ColorPalette
                variant="hud"
                className="is-compact is-icon-only"
                ariaLabel="CTA heading color"
                options={SEMANTIC_TEXT_COLOR_OPTIONS}
                value={activeTitleColorValue}
                preventMouseDown
                onChange={(nextValue) => {
                  if (hasTitleSelection) {
                    onApplySelectionColor?.(nextValue, titleSelection);
                    return;
                  }
                  onTitleColorChange?.(nextValue === autoTitleColorValue ? '' : nextValue);
                }}
              />
            </div>
            {titleHighlights.length ? (
              <div className="admin-front-hud-field-group admin-cta-hud-heading-control admin-cta-hud-heading-control--spans">
                <span className="admin-front-hud-control-label">Span Colors</span>
                <div className="admin-cta-hud-span-tools">
                  <div className="admin-front-hud-hero-span-chip-list">
                    {titleHighlights.map((range, rangeIndex) => {
                      const chipText = String(titleText || '').slice(range.start, range.end);
                      const swatch = SEMANTIC_TEXT_COLOR_OPTIONS.find((option) => option.value === range.className);

                      return (
                        <button
                          key={`cta-title-span-${range.start}-${range.end}-${range.className}-${rangeIndex + 1}`}
                          type="button"
                          className="admin-hero-inline-span-chip"
                          onClick={() => onRemoveTitleSpan?.(rangeIndex)}
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
                  <button
                    type="button"
                    className="admin-front-hud-mini-action"
                    onClick={() => onClearTitleSpans?.()}
                  >
                    Clear spans
                  </button>
                </div>
              </div>
            ) : null}
            <BackgroundEditorPage
              backgroundTone={resolvedBgTone}
              backgroundToneOptions={SURFACE_BG_TONE_OPTIONS}
              backgroundToneLabel="CTA background"
              onBackgroundToneChange={handleBgToneChange}
              backgroundEffectsJson={backgroundEffectsJson}
              onBackgroundEffectsChange={onBackgroundEffectsChange}
              paletteVariant="hud"
              className="admin-cta-hud-background-page"
            />
          </div>
          <p className="admin-front-hud-note admin-cta-hud-heading-note">
            Highlight heading text first for span color. With no selection, color applies to the full heading.
          </p>
        </div>
      </section>

      <section className="admin-front-hud-card admin-cta-hud-card--message">
        <div className="admin-front-hud-card-head">
          <h4>Message + Submit</h4>
        </div>
        <div className="admin-cta-hud-message-submit-grid">
          <div className="admin-front-hud-field-group admin-cta-hud-message-submit-section">
            <label className="admin-front-hud-field">
              <span>Supporting Copy</span>
              <textarea
                rows={2}
                value={subtitleDraftValues.subtitle ?? String(subtitle || '')}
                onChange={(event) => updateSubtitleDraft('subtitle', event.target.value)}
                onBlur={() => commitSubtitleDraft('subtitle')}
                placeholder="Optional supporting copy above the form"
              />
            </label>
            <span className="admin-front-hud-control-label">Lead Copy</span>
            <div className="admin-cta-hud-body-editor">
              <AdminHtmlEditor
                compact
                showFooterToggle={false}
                paletteVariant="hud"
                value={String(bodyHtml || '')}
                onChange={(nextValue) => onBodyHtmlChange?.(nextValue)}
                baseColorClassName={bodyColorClassName}
                onBaseColorChange={onBodyColorChange}
                placeholder="Optional lead copy above the form"
              />
            </div>
          </div>
          <div className="admin-cta-hud-submit-stack admin-cta-hud-message-submit-section">
            <label className="admin-front-hud-field">
              <span>Submit Label</span>
              <input
                type="text"
                value={submitLabelDraftValues.submitLabel ?? String(settings.submitLabel || '')}
                onChange={(event) => updateSubmitLabelDraft('submitLabel', event.target.value)}
                onBlur={() => commitSubmitLabelDraft('submitLabel')}
              />
            </label>
            <div className="admin-front-hud-row admin-cta-hud-submit-row">
              <span>Submit Style</span>
              <div className="admin-cta-hud-style-grid" role="group" aria-label="CTA submit style">
                {CTA_HUD_SUBMIT_STYLE_OPTIONS.map((option) => (
                  <button
                    key={`cta-submit-style-${option.value}`}
                    type="button"
                    className={`admin-cta-hud-style-chip${submitStyle === option.value ? ' is-active' : ''}`}
                    aria-label={option.label}
                    aria-pressed={submitStyle === option.value}
                    onClick={() => onSubmitStyleChange?.(option.value)}
                  >
                    <span
                      className={`${toPreviewButtonClassName(option.value, submitTone)} admin-cta-hud-style-chip-preview`}
                      aria-hidden="true"
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {submitStyle === 'outline' ? (
              <div className="admin-front-hud-row admin-cta-hud-submit-row">
                <span>Submit Color</span>
                <ColorPalette
                  variant="hud"
                  className="is-compact is-icon-only"
                  ariaLabel="CTA submit color"
                  options={BUTTON_TONE_OPTIONS}
                  value={submitTone}
                  onChange={onSubmitToneChange}
                />
              </div>
            ) : null}
            <div className="admin-front-hud-row admin-cta-hud-submit-row">
              <span>Button Preview</span>
              <div className="admin-billboard-hud-button-preview-row admin-button-preview-surface admin-cta-hud-button-preview">
                <button
                  type="button"
                  className={`${toPreviewButtonClassName(submitStyle, submitTone)} admin-button-preview-button`}
                  onClick={(event) => event.preventDefault()}
                >
                  {String((submitLabelDraftValues.submitLabel ?? settings.submitLabel) || '').trim() || 'Follow up with me'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-front-hud-card admin-cta-hud-card--fields">
        <div className="admin-front-hud-card-head">
          <h4>Form Fields</h4>
          <button
            type="button"
            className="admin-front-hud-mini-action"
            onClick={addField}
            disabled={!canAddField}
          >
            Add field
          </button>
        </div>
        <div className="admin-cta-hud-fields-body">
          <label className="admin-cta-hud-check-row">
            <input
              type="checkbox"
              checked={Boolean(includeContactPreference)}
              onChange={(event) => onIncludeContactPreferenceChange?.(event.target.checked)}
            />
            <span>Ask for contact preference</span>
          </label>
          {includeContactPreference ? (
            <p className="admin-front-hud-note">
              Adds the standard “Preferred contact method” dropdown.
            </p>
          ) : null}
          {isFieldEditorOpen && activeField ? (
            <section
              className="admin-cta-hud-field-sheet"
              role="dialog"
              aria-modal="false"
              aria-label={`Edit field ${String(activeField.label || `Field ${activeFieldIndex + 1}`).trim() || `Field ${activeFieldIndex + 1}`}`}
            >
              <div className="admin-cta-hud-field-sheet-head">
                <div>
                  <strong>{String(activeField.label || `Field ${activeFieldIndex + 1}`).trim() || `Field ${activeFieldIndex + 1}`}</strong>
                  <p>{`Field ${activeFieldIndex + 1} of ${fieldList.length}`}</p>
                </div>
                <div className="admin-cta-hud-field-editor-actions">
                  <button type="button" className="admin-front-hud-mini-action" onClick={() => moveField(activeFieldIndex, -1)} disabled={activeFieldIndex === 0}>Up</button>
                  <button type="button" className="admin-front-hud-mini-action" onClick={() => moveField(activeFieldIndex, 1)} disabled={activeFieldIndex === fieldList.length - 1}>Down</button>
                  <button type="button" className="admin-front-hud-mini-action" onClick={() => removeField(activeFieldIndex)}>Remove</button>
                  <button type="button" className="admin-front-hud-mini-action" onClick={closeFieldEditor}>Done</button>
                </div>
              </div>
              <div className="admin-cta-hud-form-grid">
                <label className="admin-front-hud-field">
                  <span>Field Label</span>
                  <input
                    type="text"
                    value={String(activeField.label || '')}
                    onChange={(event) => updateField(activeFieldIndex, { label: event.target.value })}
                  />
                </label>
                <label className="admin-front-hud-field">
                  <span>Field Key</span>
                  <input
                    type="text"
                    value={String(activeField.id || '')}
                    onChange={(event) => updateField(activeFieldIndex, { id: event.target.value })}
                  />
                </label>
                <label className="admin-front-hud-field">
                  <span>Field Type</span>
                  <select
                    aria-label="Field Type"
                    value={String(activeField.type || 'text')}
                    onChange={(event) => updateField(activeFieldIndex, {
                      type: event.target.value,
                      optionsText: event.target.value === 'select' ? String(activeField.optionsText || '') : '',
                    })}
                  >
                    {CTA_FORM_DYNAMIC_FIELD_TYPE_OPTIONS.map((option) => (
                      <option key={`cta-hud-type-${option.value}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-front-hud-field">
                  <span>Placeholder</span>
                  <input
                    type="text"
                    value={String(activeField.placeholder || '')}
                    onChange={(event) => updateField(activeFieldIndex, { placeholder: event.target.value })}
                    disabled={activeField.type === 'checkbox'}
                  />
                </label>
                <label className="admin-cta-hud-check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(activeField.required)}
                    onChange={(event) => updateField(activeFieldIndex, { required: event.target.checked })}
                  />
                  <span>Required</span>
                </label>
                {activeField.type === 'select' ? (
                  <label className="admin-front-hud-field admin-front-hud-field--full">
                    <span>Options</span>
                    <textarea
                      rows={4}
                      value={String(activeField.optionsText || '')}
                      onChange={(event) => updateField(activeFieldIndex, { optionsText: event.target.value })}
                      placeholder={'option-value|Option label\noption-two|Option two'}
                    />
                  </label>
                ) : null}
              </div>
            </section>
          ) : null}
          <div className="admin-cta-hud-field-list" role="list" aria-label="CTA fields">
            {fieldList.map((field, index) => {
              const isActive = isFieldEditorOpen && index === activeFieldIndex;
              const summaryLabel = String(field.label || `Field ${index + 1}`).trim() || `Field ${index + 1}`;
              const summaryKey = String(field.id || '').trim();
              const fieldTypeLabel = CTA_FIELD_TYPE_LABELS.get(String(field.type || 'text')) || 'Text';
              return (
                <button
                  key={`cta-hud-field-${field.id || index + 1}`}
                  type="button"
                  className={`admin-cta-hud-field-row${isActive ? ' is-active' : ''}`}
                  aria-haspopup="dialog"
                  aria-expanded={isActive}
                  onClick={() => openFieldEditor(index)}
                >
                  <span className="admin-cta-hud-field-row-main">
                    <span className="admin-cta-hud-field-row-title">{summaryLabel}</span>
                    {summaryKey ? <span className="admin-cta-hud-field-row-key">{`Key: ${summaryKey}`}</span> : null}
                  </span>
                  <span className="admin-cta-hud-field-row-meta">
                    <span className="admin-cta-hud-field-badge">{fieldTypeLabel}</span>
                    {field.required ? <span className="admin-cta-hud-field-badge is-required">Required</span> : null}
                    <span className="admin-cta-hud-field-edit-affordance">{isActive ? 'Editing' : 'Edit'}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {!fieldList.length ? (
            <p className="admin-front-hud-note">Add at least one field to configure this CTA form.</p>
          ) : null}
          {fieldList.length && !isFieldEditorOpen ? (
            <p className="admin-front-hud-note">Tap a field row to edit it in the sheet.</p>
          ) : null}
        </div>
      </section>
      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}
