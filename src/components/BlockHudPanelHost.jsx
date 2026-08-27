import { createContext, useContext, useRef, useState } from 'react';
import * as ContentAdminContextModule from '../context/ContentAdminContext';
import { isForeignOwnedBlockOwnership } from './BlockOwnershipOverlay';
import HudBlockOptions from './HudBlockOptions';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import {
  FieldControlGrid,
  getMigratedBlockEditorComponent,
} from './block-editors/migratedBlockEditors';
import CtaHudEditorPanel from './CtaHudEditorPanel';
import { normalizeCtaHudSubmitStyle, normalizeCtaHudSubmitTone } from '../lib/ctaHudSettings';
import { getBlockHudDefinition } from '../lib/blockHudRegistry';
import { getBlockEditorSections } from '../blocks/registry';
import {
  extractHeroLineColorToken,
  removeSelectionRange,
} from '../lib/heroHudRanges';
import { applyTextColorSelection } from '../lib/textColorSelection';
import {
  buildCtaFormSettingsPatch,
  extractCtaFormFields,
} from '../blocks/foundation/forms';

const EmptyContentAdminContext = createContext(null);

function getCompatibilitySectionIcon(section, index) {
  const iconById = {
    content: '✦',
    cards: '▦',
    actions: '↗',
    action: '↗',
    placement: '⌗',
    layout: '◫',
    presentation: '◈',
    behavior: '◌',
    calculator: '∑',
    followup: '→',
    columns: '▥',
    selection: '✓',
    display: '◫',
    integration: '↔',
    media: '▧',
    support: '?',
    fineprint: 'i',
  };
  const sectionId = String(section?.id || '').trim().toLowerCase();
  if (iconById[sectionId]) {
    return iconById[sectionId];
  }
  const label = String(section?.title || section?.label || '').trim();
  const firstLetter = label.match(/[A-Za-z0-9]/)?.[0] || String(index + 1);
  return firstLetter.toUpperCase();
}

const HUD_EDITORS_WITH_SECTION_RAIL = new Set([
  'hero',
  'intro',
  'content',
  'top_strip',
  'testimonials',
  'billboard',
  'card_chart',
  'request_form',
  'support_library',
]);

function HudEditorCompatibilityShell({ blockKind, blockLabel, children, blockOptions = null }) {
  const label = String(blockLabel || 'Block').trim() || 'Block';
  const definitionSections = getBlockEditorSections(blockKind, 'hud');
  const cardGridSections = blockKind === 'card_grid'
    ? [
      { id: 'header', label: 'Header', icon: 'H' },
      { id: 'appearance', label: 'Appearance', icon: '◉' },
      { id: 'cards', label: 'Cards', icon: '▦' },
    ]
    : null;
  const modelSections = cardGridSections || (definitionSections.length
    ? definitionSections.map((section, index) => ({
      id: String(section.id || `section-${index + 1}`),
      label: String(section.title || section.label || `Section ${index + 1}`),
      icon: getCompatibilitySectionIcon(section, index),
    }))
    : [{ id: 'controls', label: 'Controls', icon: 'C' }]);
  const sections = appendHudBlockOptionsSection(modelSections, blockOptions);
  const [activeSection, setActiveSection] = useState(sections[0]?.id || 'controls');

  return (
    <HudEditorModelLayout
      className={`admin-hud-editor-compatibility-layout admin-hud-editor-compatibility-layout--${String(blockKind || 'generic').replace(/[^a-z0-9_-]/gi, '-')}`}
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      label={`${label} editor sections`}
      hideRailLabels
    >
      <div className="admin-hud-editor-compatibility-content" data-hud-editor-kind={blockKind || undefined}>
        {children}
      </div>
      <HudEditorBlockOptionsPage>{blockOptions}</HudEditorBlockOptionsPage>
    </HudEditorModelLayout>
  );
}

function readOptionalModuleExport(module, exportName) {
  try {
    return module?.[exportName] || null;
  } catch {
    return null;
  }
}

export default function BlockHudPanelHost({
  block,
  pathname = '',
  routeOptions = [],
  testimonialsLibrary = [],
  ratesContext = null,
  ownership = null,
  onOwnershipAction = null,
  onReleaseDraft = null,
  onPublishBlock = null,
  onBlockDeleted = null,
  showWorkflowActions = true,
  showPublishAction = true,
  heroSelection = null,
  onHeroSelectionClear = null,
  onSettingChange,
}) {
  const ctaTitleInputRef = useRef(null);
  const [ctaTitleSelection, setCtaTitleSelection] = useState({ start: 0, end: 0, text: '' });
  const contentAdmin = useContext(
    readOptionalModuleExport(ContentAdminContextModule, 'ContentAdminContext') || EmptyContentAdminContext,
  );

  if (!block || typeof onSettingChange !== 'function') {
    return null;
  }

  const definition = getBlockHudDefinition(block);
  const MigratedHudEditor = getMigratedBlockEditorComponent(block.kind, 'hud');
  const editableFields = Array.isArray(block.editableFields) ? block.editableFields : [];
  const settings = block.settings || {};
  const ctaFields = extractCtaFormFields(settings, null, {
    allowLegacyStepFields: String(settings.sectionClassName || '')
      .split(/\s+/)
      .includes('insurance-native-cta'),
  });
  const isForeignOwned = isForeignOwnedBlockOwnership(ownership);
  const releaseDraft = onReleaseDraft || (
    typeof contentAdmin?.releaseActiveBlockDraft === 'function'
      ? (force = false) => contentAdmin.releaseActiveBlockDraft(pathname, block.id, { force })
      : null
  );
  const publishBlock = onPublishBlock || (
    typeof contentAdmin?.publishSharedBlockNow === 'function'
      ? () => contentAdmin.publishSharedBlockNow(pathname, block.id, 'HUD block publish')
      : null
  );
  const blockedOnSettingChange = isForeignOwned
    ? () => {}
    : onSettingChange;
  const hudOwnershipNotice = ownership?.state === 'drafted-other'
    ? {
      state: ownership.state,
      label: ownership.overlayLabel || 'Unpublished draft by another admin',
      detail: `${ownership.overlayDetail ? `${ownership.overlayDetail}. ` : ''}This draft is not live yet.`,
      secondaryLabel: ownership.overlaySecondaryLabel || '',
      secondaryDetail: ownership.overlaySecondaryDetail || '',
      actionLabel: typeof onOwnershipAction === 'function' ? 'Take over draft' : '',
    }
    : ownership?.state === 'editing-other'
      ? {
      state: ownership.state,
      label: ownership.overlayLabel || 'Another admin is editing this block',
      detail: `${ownership.overlayDetail ? `${ownership.overlayDetail}. ` : ''}Another admin still holds the active edit lock.`,
      secondaryLabel: '',
      secondaryDetail: '',
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
        {hudOwnershipNotice.secondaryLabel ? (
          <span>
            {hudOwnershipNotice.secondaryLabel}
            {hudOwnershipNotice.secondaryDetail ? `. ${hudOwnershipNotice.secondaryDetail}` : ''}
          </span>
        ) : null}
      </div>
    </div>
  ) : null;

  const blockOptionsMarkup = (
    <HudBlockOptions
      block={block}
      pathname={pathname}
      ownership={ownership}
      contentAdmin={contentAdmin}
      showWorkflowActions={showWorkflowActions}
      showPublishAction={showPublishAction}
      onOwnershipAction={onOwnershipAction}
      onReleaseDraft={releaseDraft}
      onPublishBlock={publishBlock}
      onBlockDeleted={onBlockDeleted}
    />
  );

  const renderMigratedHudEditor = () => {
    const editor = (
      <MigratedHudEditor
        key={block.id}
        block={block}
        pathname={pathname}
        routeOptions={routeOptions}
        testimonialsLibrary={testimonialsLibrary}
        hudMode
        sourceRevision={contentAdmin?.sharedSnapshotUpdatedAt || 0}
        ratesContext={ratesContext}
        selection={block.kind === 'hero' ? heroSelection : null}
        onSelectionClear={block.kind === 'hero' ? onHeroSelectionClear : null}
        onSettingChange={blockedOnSettingChange}
        blockOptions={blockOptionsMarkup}
      />
    );

    if (HUD_EDITORS_WITH_SECTION_RAIL.has(String(block.kind || '').trim())) {
      return editor;
    }

    return (
      <HudEditorCompatibilityShell blockKind={block.kind} blockLabel={definition.label || block.kind} blockOptions={blockOptionsMarkup}>
        {editor}
      </HudEditorCompatibilityShell>
    );
  };

  const renderReadOnlyShell = (content) => (
    <fieldset
      disabled={isForeignOwned}
      aria-disabled={isForeignOwned}
      style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}
    >
      <div
        className={`admin-hud-editor-shared-surface${isForeignOwned ? ' is-admin-front-hud-readonly' : ''}`}
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
          renderMigratedHudEditor(),
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
              sourceRevision={contentAdmin?.sharedSnapshotUpdatedAt || 0}
              settings={settings}
              bgTone={String(settings.bgTone || 'white')}
              submitStyle={normalizeCtaHudSubmitStyle(settings.submitStyle)}
              submitTone={normalizeCtaHudSubmitTone(settings.submitTone, settings.submitStyle)}
              bodyHtml={String(settings.bodyHtml || '')}
              subtitle={String(settings.subtitle || '')}
              bodyColorClassName={String(settings.bodyColorClassName || 'is-super-grey')}
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
              onSubtitleChange={(nextValue) => blockedOnSettingChange('subtitle', nextValue)}
              onBodyColorChange={(nextValue) => blockedOnSettingChange('bodyColorClassName', nextValue)}
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
              onApplySelectionColor={(colorValue, selectedTitle = ctaTitleSelection) => {
                const sourceText = String(settings.title || '');
                const result = applyTextColorSelection({
                  text: sourceText,
                  lineClassName: String(settings.titleClassName || ''),
                  highlightsJson: settings.titleHighlightsJson,
                  selection: selectedTitle,
                  colorValue,
                });
                if (result.target !== 'selection') {
                  return;
                }
                blockedOnSettingChange(
                  'titleHighlightsJson',
                  result.highlightsJson,
                );
              }}
              onTitleColorChange={(colorValue) => {
                blockedOnSettingChange('titleClassName', applyTextColorSelection({
                  text: String(settings.title || ''),
                  lineClassName: String(settings.titleClassName || ''),
                  highlightsJson: settings.titleHighlightsJson,
                  selection: { start: 0, end: 0 },
                  colorValue,
                }).lineClassName);
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
              blockOptions={blockOptionsMarkup}
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
            {blockOptionsMarkup}
          </>
        );
      }
      return (
        <>
          {ownershipNoticeMarkup}
          {renderReadOnlyShell(
            <HudEditorCompatibilityShell blockKind={block.kind} blockLabel={definition.label || block.kind} blockOptions={blockOptionsMarkup}>
              <FieldControlGrid
                fields={editableFields}
                settings={block.settings}
                onSettingChange={blockedOnSettingChange}
                routeOptions={routeOptions}
                paletteVariant="hud"
              />
            </HudEditorCompatibilityShell>,
          )}
        </>
      );
  }
}
