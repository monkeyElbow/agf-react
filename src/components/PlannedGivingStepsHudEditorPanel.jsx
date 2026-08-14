import { useMemo, useState } from 'react';
import ColorPalette from './ColorPalette';
import PlannedGivingStepIcon, { PLANNED_GIVING_STEP_ART_OPTIONS } from './PlannedGivingStepIcon';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import { BUTTON_TONE_OPTIONS, INTRO_ACCENT_TONE_OPTIONS, SURFACE_BG_TONE_OPTIONS } from '../lib/colorSystem';
import { coerceLinkValueFromFields, serializeLinkValue, resolveEditableHrefFromLinkFields } from '../lib/linkValue';
import useBufferedFieldDrafts from '../hooks/useBufferedFieldDrafts';

const BUTTON_STYLE_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'outline', label: 'Outline' },
];

const STEP_FIELD_SUFFIXES = [
  'Enabled', 'Type', 'Title', 'TitleClassName', 'TitleHighlightsJson', 'Body', 'BodyHtml',
  'IconKey', 'IconTone', 'ImageUrl', 'ImageAlt', 'WidthShare', 'ButtonLabel', 'ButtonUrl',
  'ButtonPageRef', 'ButtonLinkJson', 'ButtonOpenInNewWindow', 'ButtonStyle', 'ButtonTone',
];

function countToken(count) {
  return count === 4 ? 'four' : count === 3 ? 'three' : 'two';
}

function getEnabledSlots(settings) {
  const slots = [];
  for (let slot = 1; slot <= 4; slot += 1) {
    const enabled = settings[`col${slot}Enabled`];
    const disabled = enabled === false || String(enabled || '').trim().toLowerCase() === 'false';
    if (enabled === undefined ? slot <= 2 : !disabled) {
      slots.push(slot);
    }
  }
  return slots;
}

function stepValue(settings, draftValues, slot, suffix, fallback = '') {
  const fieldId = `col${slot}${suffix}`;
  return draftValues[fieldId] ?? settings[fieldId] ?? fallback;
}

function StepTextField({ label, value, onChange, onBlur, multiline = false }) {
  const Field = multiline ? 'textarea' : 'input';
  return (
    <label className="admin-front-hud-field">
      <span>{label}</span>
      <Field
        rows={multiline ? 6 : undefined}
        value={String(value || '')}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </label>
  );
}

function StepArtPicker({ value, tone, onArtChange, onToneChange, stepNumber }) {
  return (
    <div className="admin-front-hud-planned-steps-art-picker">
      <div className="admin-front-hud-card-head">
        <strong>Artwork</strong>
        <span>Approved art only</span>
      </div>
      <div className="admin-front-hud-planned-steps-art-grid" role="radiogroup" aria-label={`Step ${stepNumber} artwork`}>
        {PLANNED_GIVING_STEP_ART_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={`admin-front-hud-planned-steps-art-option${value === option.value ? ' is-selected' : ''}`}
            onClick={() => onArtChange(option.value)}
            title={option.label}
          >
            <PlannedGivingStepIcon iconKey={option.value} tone={tone} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      <div className="admin-front-hud-row">
        <span>Art color</span>
        <ColorPalette
          variant="hud"
          className="is-compact is-icon-only is-circular"
          ariaLabel={`Step ${stepNumber} art color`}
          options={INTRO_ACCENT_TONE_OPTIONS}
          value={String(tone || 'atlantean')}
          onChange={onToneChange}
        />
      </div>
    </div>
  );
}

function StepCard({ slot, stepNumber, settings, draftValues, updateDraftValue, commitDraftValue, onSettingChange, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const titleId = `col${slot}Title`;
  const bodyId = `col${slot}Body`;
  const labelId = `col${slot}ButtonLabel`;
  const hrefId = `col${slot}ButtonHref`;
  const artKey = String(settings[`col${slot}IconKey`] || PLANNED_GIVING_STEP_ART_OPTIONS[0].value);
  const artTone = String(settings[`col${slot}IconTone`] || 'atlantean');
  const buttonLabel = stepValue(settings, draftValues, slot, 'ButtonLabel');
  const buttonHref = draftValues[hrefId] ?? resolveEditableHrefFromLinkFields(settings, {
    hrefKeys: [`col${slot}ButtonUrl`],
    toKeys: [`col${slot}ButtonPageRef`],
    openInNewWindowKeys: [`col${slot}ButtonOpenInNewWindow`],
  });

  const commitHref = (nextValue) => {
    const link = coerceLinkValueFromFields(settings, {
      linkJsonKeys: [`col${slot}ButtonLinkJson`],
      hrefKeys: [`col${slot}ButtonUrl`],
      toKeys: [`col${slot}ButtonPageRef`],
      openInNewWindowKeys: [`col${slot}ButtonOpenInNewWindow`],
    });
    const nextHref = String(nextValue || '').trim();
    const nextLink = nextHref.startsWith('/')
      ? { to: nextHref, openInNewWindow: link?.openInNewWindow }
      : { href: nextHref, openInNewWindow: link?.openInNewWindow };
    onSettingChange(`col${slot}ButtonUrl`, nextHref);
    onSettingChange(`col${slot}ButtonPageRef`, nextHref.startsWith('/') ? nextHref : '');
    onSettingChange(`col${slot}ButtonLinkJson`, serializeLinkValue(nextLink));
  };

  return (
    <article className="admin-front-hud-planned-steps-card">
      <header className="admin-front-hud-planned-steps-card-head">
        <span className="admin-front-hud-planned-steps-number">{String(stepNumber).padStart(2, '0')}</span>
        <strong>Step {stepNumber}</strong>
        <span className="admin-front-hud-planned-steps-reorder" aria-label={`Reorder step ${stepNumber}`}>
          <button type="button" className="admin-front-hud-mini-action" onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move step ${stepNumber} up`}>↑</button>
          <button type="button" className="admin-front-hud-mini-action" onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Move step ${stepNumber} down`}>↓</button>
        </span>
      </header>
      <StepArtPicker
        value={artKey}
        tone={artTone}
        stepNumber={stepNumber}
        onArtChange={(nextValue) => onSettingChange(`col${slot}IconKey`, nextValue)}
        onToneChange={(nextValue) => onSettingChange(`col${slot}IconTone`, nextValue)}
      />
      <div className="admin-front-hud-planned-steps-copy-grid">
        <StepTextField
          label="Title"
          value={stepValue(settings, draftValues, slot, 'Title')}
          onChange={(nextValue) => updateDraftValue(titleId, nextValue)}
          onBlur={() => commitDraftValue(titleId)}
        />
        <StepTextField
          label="Body"
          multiline
          value={stepValue(settings, draftValues, slot, 'Body')}
          onChange={(nextValue) => updateDraftValue(bodyId, nextValue)}
          onBlur={() => commitDraftValue(bodyId)}
        />
      </div>
      <div className="admin-front-hud-planned-steps-button-grid">
        <StepTextField
          label="Button label (optional)"
          value={buttonLabel}
          onChange={(nextValue) => updateDraftValue(labelId, nextValue)}
          onBlur={() => commitDraftValue(labelId)}
        />
        <StepTextField
          label="Button path / URL"
          value={buttonHref}
          onChange={(nextValue) => updateDraftValue(hrefId, nextValue)}
          onBlur={() => {
            const nextValue = draftValues[hrefId] ?? buttonHref;
            commitDraftValue(hrefId, nextValue);
            commitHref(nextValue);
          }}
        />
        <div className="admin-front-hud-row">
          <span>Button style</span>
          <div className="admin-front-hud-segmented-control" role="group" aria-label={`Step ${stepNumber} button style`}>
            {BUTTON_STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={String(settings[`col${slot}ButtonStyle`] || 'blue') === option.value ? 'is-active' : ''}
                onClick={() => onSettingChange(`col${slot}ButtonStyle`, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {String(settings[`col${slot}ButtonStyle`] || 'blue').trim().toLowerCase() === 'outline' ? (
          <div className="admin-front-hud-row">
            <span>Button color</span>
            <ColorPalette
              variant="hud"
              className="is-compact is-icon-only is-circular"
              ariaLabel={`Step ${stepNumber} button color`}
              options={BUTTON_TONE_OPTIONS}
              value={String(settings[`col${slot}ButtonTone`] || 'atlantean')}
              onChange={(nextValue) => onSettingChange(`col${slot}ButtonTone`, nextValue)}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function PlannedGivingStepsHudEditorPanel({
  settings = {},
  onSettingChange,
  sourceRevision = 0,
  blockOptions = null,
}) {
  const [activeSection, setActiveSection] = useState('steps');
  const slots = useMemo(() => getEnabledSlots(settings), [settings]);
  const bufferedFields = useMemo(() => {
    const fields = [{
      id: 'title',
      value: String(settings.title || ''),
      mode: 'blur',
      commit: (nextValue) => onSettingChange('title', nextValue),
    }];
    for (let slot = 1; slot <= 4; slot += 1) {
      ['Title', 'Body', 'ButtonLabel'].forEach((suffix) => fields.push({
        id: `col${slot}${suffix}`,
        value: String(settings[`col${slot}${suffix}`] || ''),
        mode: 'blur',
        commit: (nextValue) => onSettingChange(`col${slot}${suffix}`, nextValue),
      }));
      fields.push({
        id: `col${slot}ButtonHref`,
        value: resolveEditableHrefFromLinkFields(settings, {
          hrefKeys: [`col${slot}ButtonUrl`],
          toKeys: [`col${slot}ButtonPageRef`],
          openInNewWindowKeys: [`col${slot}ButtonOpenInNewWindow`],
        }),
        mode: 'blur',
        commit: () => {},
      });
    }
    return fields;
  }, [onSettingChange, settings]);
  const { draftValues, updateDraftValue, commitDraftValue } = useBufferedFieldDrafts({
    fields: bufferedFields,
    sourceRevision,
  });

  const commitAllText = () => {
    commitDraftValue('title');
    for (let slot = 1; slot <= 4; slot += 1) {
      ['Title', 'Body', 'ButtonLabel', 'ButtonHref'].forEach((suffix) => commitDraftValue(`col${slot}${suffix}`));
    }
  };

  const writeStep = (slot, values) => {
    Object.entries(values).forEach(([suffix, value]) => onSettingChange(`col${slot}${suffix}`, value));
  };

  const reorder = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= slots.length || fromIndex === toIndex) return;
    commitAllText();
    const fromSlot = slots[fromIndex];
    const toSlot = slots[toIndex];
    const fromValues = {};
    const toValues = {};
    STEP_FIELD_SUFFIXES.forEach((suffix) => {
      fromValues[suffix] = settings[`col${fromSlot}${suffix}`];
      toValues[suffix] = settings[`col${toSlot}${suffix}`];
    });
    ['Title', 'Body', 'ButtonLabel'].forEach((suffix) => {
      fromValues[suffix] = draftValues[`col${fromSlot}${suffix}`] ?? fromValues[suffix];
      toValues[suffix] = draftValues[`col${toSlot}${suffix}`] ?? toValues[suffix];
    });
    writeStep(fromSlot, toValues);
    writeStep(toSlot, fromValues);
    ['Title', 'Body', 'ButtonLabel'].forEach((suffix) => {
      updateDraftValue(`col${fromSlot}${suffix}`, fromValues[suffix], { commitImmediately: true });
      updateDraftValue(`col${toSlot}${suffix}`, toValues[suffix], { commitImmediately: true });
    });
    updateDraftValue(
      `col${fromSlot}ButtonHref`,
      String(fromValues.ButtonPageRef || fromValues.ButtonUrl || ''),
      { commitImmediately: true },
    );
    updateDraftValue(
      `col${toSlot}ButtonHref`,
      String(toValues.ButtonPageRef || toValues.ButtonUrl || ''),
      { commitImmediately: true },
    );
  };

  const addStep = () => {
    if (slots.length >= 4) return;
    const slot = slots.length + 1;
    onSettingChange('columns', countToken(slots.length + 1));
    writeStep(slot, {
      Enabled: true,
      Type: 'flow-step',
      IconKey: PLANNED_GIVING_STEP_ART_OPTIONS[0].value,
      IconTone: 'atlantean',
      WidthShare: 1,
    });
  };

  const removeStep = () => {
    if (slots.length <= 2) return;
    const slot = slots[slots.length - 1];
    onSettingChange(`col${slot}Enabled`, false);
    onSettingChange('columns', countToken(slots.length - 1));
  };

  const editorSections = appendHudBlockOptionsSection([
    { id: 'content', label: 'Content', icon: 'Aa' },
    { id: 'steps', label: 'Steps', icon: '01' },
  ], blockOptions);

  return (
    <HudEditorModelLayout
      className="admin-front-hud-columns-editor admin-front-hud-planned-steps-editor"
      sections={editorSections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      label="Planned giving steps editor sections"
    >
      <section className="admin-front-hud-card admin-front-hud-planned-steps-content-card">
        <div className="admin-front-hud-card-head"><strong>Content</strong></div>
        <StepTextField
          label="Heading"
          value={draftValues.title ?? settings.title}
          onChange={(nextValue) => updateDraftValue('title', nextValue)}
          onBlur={() => commitDraftValue('title')}
        />
        <div className="admin-front-hud-row">
          <span>Background</span>
          <ColorPalette
            variant="hud"
            className="is-compact is-icon-only is-circular"
            ariaLabel="Planned giving steps background"
            options={SURFACE_BG_TONE_OPTIONS}
            value={String(settings.bgTone || 'white')}
            onChange={(nextValue) => onSettingChange('bgTone', nextValue)}
          />
        </div>
      </section>
      <section className="admin-front-hud-card admin-front-hud-planned-steps-list-card">
        <div className="admin-front-hud-card-head">
          <strong>Steps</strong>
          <span>Numbers follow order automatically.</span>
        </div>
        <div className="admin-front-hud-planned-steps-actions">
          <button type="button" className="admin-front-hud-mini-action" onClick={addStep} disabled={slots.length >= 4}>Add step</button>
          <button type="button" className="admin-front-hud-mini-action" onClick={removeStep} disabled={slots.length <= 2}>Remove last step</button>
        </div>
        <div className="admin-front-hud-planned-steps-list">
          {slots.map((slot, index) => (
            <StepCard
              key={slot}
              slot={slot}
              stepNumber={index + 1}
              settings={settings}
              draftValues={draftValues}
              updateDraftValue={updateDraftValue}
              commitDraftValue={commitDraftValue}
              onSettingChange={onSettingChange}
              onMoveUp={() => reorder(index, index - 1)}
              onMoveDown={() => reorder(index, index + 1)}
              canMoveUp={index > 0}
              canMoveDown={index < slots.length - 1}
            />
          ))}
        </div>
      </section>
      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}
