/* eslint-disable react-hooks/static-components */
import { useRef, useState } from 'react';
import { isForeignOwnedBlockOwnership } from './BlockOwnershipOverlay';
import {
  FieldControlGrid,
} from '../pages/AdminContentPage';
import { getMigratedBlockEditorComponent } from './block-editors/migratedBlockEditors';
import CtaHudEditorPanel, { normalizeCtaHudSubmitStyle, normalizeCtaHudSubmitTone } from './CtaHudEditorPanel';
import { getBlockHudDefinition } from '../lib/blockHudRegistry';
import {
  applySelectionColor,
  extractHeroLineColorToken,
  removeSelectionRange,
  replaceHeroLineColorClass,
} from '../lib/heroHudRanges';
import {
  buildCtaFormSettingsPatch,
  extractCtaFormFields,
} from '../blocks/foundation/forms';

export default function BlockHudPanelHost({
  block,
  pathname = '',
  routeOptions = [],
  testimonialsLibrary = [],
  ratesContext = null,
  ownership = null,
  onOwnershipAction = null,
  onSettingChange,
}) {
  const ctaTitleInputRef = useRef(null);
  const [ctaTitleSelection, setCtaTitleSelection] = useState({ start: 0, end: 0, text: '' });

  if (!block || typeof onSettingChange !== 'function') {
    return null;
  }

  const definition = getBlockHudDefinition(block);
  const MigratedHudEditor = getMigratedBlockEditorComponent(block.kind, 'hud');
  const editableFields = Array.isArray(block.editableFields) ? block.editableFields : [];
  const settings = block.settings || {};
  const ctaFields = extractCtaFormFields(settings);
  const isForeignOwned = isForeignOwnedBlockOwnership(ownership);
  const blockedOnSettingChange = isForeignOwned
    ? () => {}
    : onSettingChange;
  const hudOwnershipNotice = ownership?.state === 'drafted-other'
    ? {
      state: ownership.state,
      label: ownership.overlayLabel || 'Unpublished draft by another admin',
      detail: `${ownership.overlayDetail ? `${ownership.overlayDetail}. ` : ''}This draft is not live yet.`,
      actionLabel: typeof onOwnershipAction === 'function' ? 'Continue draft' : '',
    }
    : ownership?.state === 'editing-other'
      ? {
        state: ownership.state,
        label: ownership.overlayLabel || 'Another admin is editing this block',
        detail: `${ownership.overlayDetail ? `${ownership.overlayDetail}. ` : ''}Another admin still holds the active edit lock.`,
        actionLabel: typeof onOwnershipAction === 'function' ? 'Take over edit' : '',
      }
      : null;

  const captureGenericSelection = (inputRef, setter) => {
    const input = inputRef?.current;
    if (!input) {
      return;
    }
    const rawStart = Number(input.selectionStart);
    const rawEnd = Number(input.selectionEnd);
    if (!Number.isInteger(rawStart) || !Number.isInteger(rawEnd)) {
      return;
    }
    const start = Math.max(0, Math.min(rawStart, rawEnd));
    const end = Math.max(start, rawStart, rawEnd);
    const source = String(input.value || '');
    setter({
      start,
      end,
      text: source.slice(start, end),
    });
  };

  const ownershipNoticeMarkup = hudOwnershipNotice ? (
    <div className={`admin-front-hud-ownership-note is-${hudOwnershipNotice.state}`} role="status">
      <div className="admin-front-hud-ownership-copy">
        <strong>{hudOwnershipNotice.label}</strong>
        <span>{hudOwnershipNotice.detail}</span>
      </div>
      {hudOwnershipNotice.actionLabel ? (
        <button
          type="button"
          className="action-btn action-btn-outline"
          onClick={onOwnershipAction}
        >
          {hudOwnershipNotice.actionLabel}
        </button>
      ) : null}
    </div>
  ) : null;

  const renderReadOnlyShell = (content) => (
    <fieldset
      disabled={isForeignOwned}
      aria-disabled={isForeignOwned}
      style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}
    >
      <div
        className={isForeignOwned ? 'is-admin-front-hud-readonly' : undefined}
        style={isForeignOwned ? { pointerEvents: 'none', opacity: 0.68 } : undefined}
      >
        {content}
      </div>
    </fieldset>
  );

  if (MigratedHudEditor && String(block.mode || 'dynamic').trim() === 'dynamic') {
    return (
      <>
        {ownershipNoticeMarkup}
        {renderReadOnlyShell(
          <MigratedHudEditor
            block={block}
            pathname={pathname}
            routeOptions={routeOptions}
            testimonialsLibrary={testimonialsLibrary}
            ratesContext={ratesContext}
            onSettingChange={blockedOnSettingChange}
          />,
        )}
      </>
    );
  }

  switch (definition.editorType) {
    case 'cta_form':
      return (
        <>
          {ownershipNoticeMarkup}
          {renderReadOnlyShell(
            <CtaHudEditorPanel
              settings={settings}
              bgTone={String(settings.bgTone || 'white')}
              submitStyle={normalizeCtaHudSubmitStyle(settings.submitStyle)}
              submitTone={normalizeCtaHudSubmitTone(settings.submitTone, settings.submitStyle)}
              bodyHtml={String(settings.bodyHtml || '')}
              titleColor={extractHeroLineColorToken(settings.titleClassName)}
              titleSelection={ctaTitleSelection}
              setTitleInputRef={(node) => {
                ctaTitleInputRef.current = node;
              }}
              onTitleSelectionCapture={() => captureGenericSelection(ctaTitleInputRef, setCtaTitleSelection)}
              onTitleChange={(nextValue) => {
                blockedOnSettingChange('title', nextValue);
                setCtaTitleSelection({ start: 0, end: 0, text: '' });
              }}
              onBodyHtmlChange={(nextValue) => blockedOnSettingChange('bodyHtml', nextValue)}
              fields={ctaFields}
              includeContactPreference={Boolean(settings.includeContactPreference)}
              onFieldsChange={(nextFields) => {
                Object.entries(buildCtaFormSettingsPatch({
                  fields: nextFields,
                  includeContactPreference: settings.includeContactPreference,
                })).forEach(([fieldId, nextValue]) => {
                  blockedOnSettingChange(fieldId, nextValue);
                });
              }}
              onIncludeContactPreferenceChange={(nextValue) => {
                blockedOnSettingChange('includeContactPreference', nextValue);
              }}
              onSubmitLabelChange={(nextValue) => blockedOnSettingChange('submitLabel', nextValue)}
              onSubmitStyleChange={(nextValue) => blockedOnSettingChange('submitStyle', nextValue)}
              onSubmitToneChange={(nextValue) => blockedOnSettingChange('submitTone', nextValue)}
              onBgToneChange={(nextValue) => blockedOnSettingChange('bgTone', nextValue)}
              onApplySelectionColor={(colorValue) => {
                const sourceText = String(settings.title || '');
                const safeStart = Math.max(0, Math.min(Number(ctaTitleSelection.start) || 0, sourceText.length));
                const safeEnd = Math.max(safeStart, Math.min(Number(ctaTitleSelection.end) || 0, sourceText.length));
                if (safeEnd <= safeStart) {
                  return;
                }
                blockedOnSettingChange(
                  'titleHighlightsJson',
                  applySelectionColor(settings.titleHighlightsJson, sourceText, safeStart, safeEnd, colorValue),
                );
              }}
              onTitleColorChange={(colorValue) => {
                blockedOnSettingChange('titleClassName', replaceHeroLineColorClass(String(settings.titleClassName || ''), colorValue));
              }}
              onRemoveTitleSpan={(index) => {
                blockedOnSettingChange(
                  'titleHighlightsJson',
                  removeSelectionRange(settings.titleHighlightsJson, settings.title, index),
                );
              }}
              onClearTitleSpans={() => {
                blockedOnSettingChange('titleHighlightsJson', '');
                setCtaTitleSelection({ start: 0, end: 0, text: '' });
              }}
            />,
          )}
        </>
      );
    default:
      if (!editableFields.length) {
        return (
          <>
            {ownershipNoticeMarkup}
            <p className="admin-front-hud-note">This dynamic block does not have HUD-editable fields yet.</p>
          </>
        );
      }
      return (
        <>
          {ownershipNoticeMarkup}
          {renderReadOnlyShell(
            <FieldControlGrid
              fields={editableFields}
              settings={block.settings}
              onSettingChange={blockedOnSettingChange}
              routeOptions={routeOptions}
            />,
          )}
        </>
      );
  }
}
