import { createContext, useContext, useEffect, useState } from 'react';
import * as ContentAdminContextModule from '../context/ContentAdminContext';
import { getBlockOwnershipVisual, isForeignOwnedBlockOwnership } from './BlockOwnershipOverlay';
import HudBlockOptions from './HudBlockOptions';
import BackgroundEditorPage from './BackgroundEditorPage';
import {
  HudEditorBlockOptionsPage,
  HudEditorModelLayout,
  appendHudBlockOptionsSection,
} from './HudEditorShell';
import {
  FieldControlGrid,
  getMigratedBlockEditorComponent,
} from './block-editors/migratedBlockEditors';
import { getBlockHudDefinition } from '../lib/blockHudRegistry';
import { getCanonicalEditorModel } from '../lib/editorControlContract';
import { SURFACE_BG_TONE_OPTIONS } from '../lib/colorSystem';
import HudInputDiagnostics from './HudInputDiagnostics';
import {
  formatHudDiagnosticValue,
  getHudInputDiagnosticKey,
  updateHudInputDiagnostic,
} from '../lib/hudInputDiagnostics';

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
  'card_grid',
  'card_chart',
  'columns',
  'request_form',
  'support_library',
  'cta_form',
]);

const HUD_BLOCKS_WITH_INLINE_BACKGROUND = new Set([
  'hero',
  'intro',
  // Page Content owns this surface in PageContentHudEditorPanel. Keeping it
  // here prevents the host from appending a second generic Background page.
  'content',
  'billboard',
  'request_form',
  'card_grid',
  'card_chart',
  'cta_form',
  'top_strip',
]);

function HudBlockBackgroundPage({ block, onSettingChange }) {
  const settings = block?.settings || {};
  const fields = getCanonicalEditorModel(block?.kind, 'hud', block).fields;
  const backgroundToneField = fields.find((field) => field?.id === 'bgTone');
  const backgroundToneOptions = Array.isArray(backgroundToneField?.options) && backgroundToneField.options.length
    ? backgroundToneField.options
    : SURFACE_BG_TONE_OPTIONS;

  return (
    <section className="admin-hud-shared-background-page" aria-label="Background">
      <BackgroundEditorPage
        backgroundTone={settings.bgTone || backgroundToneField?.defaultValue || 'white'}
        backgroundToneOptions={backgroundToneOptions}
        backgroundToneLabel={backgroundToneField?.label || 'Background color'}
        onBackgroundToneChange={(nextValue) => onSettingChange?.('bgTone', nextValue)}
        backgroundEffectsJson={settings.backgroundEffectsJson}
        onBackgroundEffectsChange={(nextValue) => onSettingChange?.('backgroundEffectsJson', nextValue)}
        paletteVariant="hud"
      />
    </section>
  );
}

function HudEditorCompatibilityShell({ block, blockKind, blockLabel, children, blockOptions = null, onSettingChange }) {
  const label = String(blockLabel || 'Block').trim() || 'Block';
  const definitionSections = getCanonicalEditorModel(blockKind, 'hud').sections;
  const modelSections = definitionSections.length
    ? definitionSections.map((section, index) => ({
      id: String(section.id || `section-${index + 1}`),
      label: String(section.title || section.label || `Section ${index + 1}`),
      icon: getCompatibilitySectionIcon(section, index),
    }))
    : [{ id: 'controls', label: 'Controls', icon: 'C' }];
  const sections = appendHudBlockOptionsSection(modelSections, blockOptions);
  const [activeSection, setActiveSection] = useState(sections[0]?.id || 'controls');
  const settings = block?.settings || {};
  const backgroundToneField = getCanonicalEditorModel(block?.kind, 'hud', block).fields
    .find((field) => field?.id === 'bgTone');
  const backgroundToneOptions = Array.isArray(backgroundToneField?.options) && backgroundToneField.options.length
    ? backgroundToneField.options
    : SURFACE_BG_TONE_OPTIONS;
  const backgroundPage = activeSection === 'background' ? (
    <BackgroundEditorPage
      backgroundTone={settings.bgTone || backgroundToneField?.defaultValue || 'white'}
      backgroundToneOptions={backgroundToneOptions}
      backgroundToneLabel={backgroundToneField?.label || 'Background color'}
      onBackgroundToneChange={(nextValue) => onSettingChange?.('bgTone', nextValue)}
      backgroundEffectsJson={settings.backgroundEffectsJson}
      onBackgroundEffectsChange={(nextValue) => onSettingChange?.('backgroundEffectsJson', nextValue)}
      paletteVariant="hud"
    />
  ) : null;

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
        {backgroundPage || children}
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
  activePanelId = '',
  onSettingChange,
}) {
  const contentAdmin = useContext(
    readOptionalModuleExport(ContentAdminContextModule, 'ContentAdminContext') || EmptyContentAdminContext,
  );
  const diagnosticKey = getHudInputDiagnosticKey(pathname, block?.id);
  const currentClient = contentAdmin?.devIdentity || null;
  const collaboration = block?.id && typeof contentAdmin?.getBlockCollaboration === 'function'
    ? contentAdmin.getBlockCollaboration(pathname, block.id)
    : null;
  // Collaboration metadata is authoritative. The page-level ownership prop
  // can lag one render behind a shared poll/takeover, which used to leave the
  // controls looking enabled while callbacks were being rejected—or leave a
  // newly claimed block dimmed.
  const contextOwnership = block?.id
    ? getBlockOwnershipVisual(collaboration, currentClient?.userId)
    : null;
  const resolvedOwnership = collaboration
    ? contextOwnership
    : (ownership || contextOwnership);
  const isForeignOwned = isForeignOwnedBlockOwnership(resolvedOwnership);
  const isOwnedByMe = Boolean(
    currentClient?.userId
    && resolvedOwnership?.owner?.userId === currentClient.userId,
  );
  const canEdit = !isForeignOwned;
  const isReadOnly = isForeignOwned;
  const callbackMode = isForeignOwned ? 'NO-OP callback' : 'REAL callback';

  useEffect(() => {
    if (!block?.id) {
      return;
    }
    updateHudInputDiagnostic(diagnosticKey, {
      route: pathname,
      blockId: block.id,
      blockKind: block.kind,
      currentClientUserId: currentClient?.userId || '',
      currentClientDisplayName: currentClient?.displayName || '',
      lockedBy: collaboration?.lockedBy || null,
      draftedBy: collaboration?.draftedBy || null,
      ownershipStatus: resolvedOwnership?.state || 'none',
      canEdit,
      isReadOnly,
      isOwnedByMe,
      callbackMode,
      activePanelId,
    });
  }, [
    activePanelId,
    block?.id,
    block?.kind,
    callbackMode,
    canEdit,
    collaboration?.draftedBy,
    collaboration?.lockedBy,
    currentClient?.displayName,
    currentClient?.userId,
    diagnosticKey,
    isOwnedByMe,
    isReadOnly,
    resolvedOwnership?.state,
    pathname,
  ]);

  if (!block || typeof onSettingChange !== 'function') {
    return null;
  }

  const definition = getBlockHudDefinition(block);
  const MigratedHudEditor = getMigratedBlockEditorComponent(block.kind, 'hud');
  const editableFields = getCanonicalEditorModel(block.kind, 'hud', block).fields;
  const settings = block.settings || {};
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
  const rawBlockedOnSettingChange = isForeignOwned
    ? () => {}
    : onSettingChange;
  const blockedOnSettingChange = (settingKey, nextValue) => {
    const timestamp = new Date().toISOString();
    updateHudInputDiagnostic(diagnosticKey, {
      lastControlEvent: {
        settingKey: String(settingKey || '').trim() || 'unknown',
        incomingValue: formatHudDiagnosticValue(nextValue, settingKey),
        timestamp,
      },
      lastEditorCallback: {
        fired: true,
        outcome: isForeignOwned ? 'blocked' : 'accepted',
        reason: isForeignOwned
          ? `BlockHudPanelHost ${resolvedOwnership?.state || 'foreign-owned'}`
          : '',
        timestamp,
      },
    });
    return rawBlockedOnSettingChange(settingKey, nextValue);
  };
  const hudOwnershipNotice = resolvedOwnership?.state === 'drafted-other'
    ? {
      state: resolvedOwnership.state,
      label: resolvedOwnership.overlayLabel || 'Unpublished draft by another admin',
      detail: `${resolvedOwnership.overlayDetail ? `${resolvedOwnership.overlayDetail}. ` : ''}This draft is not live yet.`,
      secondaryLabel: resolvedOwnership.overlaySecondaryLabel || '',
      secondaryDetail: resolvedOwnership.overlaySecondaryDetail || '',
      actionLabel: typeof onOwnershipAction === 'function' ? 'Take over draft' : '',
    }
    : resolvedOwnership?.state === 'editing-other'
      ? {
      state: resolvedOwnership.state,
      label: resolvedOwnership.overlayLabel || 'Another admin is editing this block',
      detail: `${resolvedOwnership.overlayDetail ? `${resolvedOwnership.overlayDetail}. ` : ''}Another admin still holds the active edit lock.`,
      secondaryLabel: '',
      secondaryDetail: '',
      actionLabel: typeof onOwnershipAction === 'function' ? 'Take over edit' : '',
      }
      : null;

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

  const diagnosticsMarkup = (
    <HudInputDiagnostics
      diagnosticKey={diagnosticKey}
      route={pathname}
      block={block}
      activePanelId={activePanelId}
      currentClient={currentClient}
      collaboration={collaboration}
      ownership={resolvedOwnership}
      canEdit={canEdit}
      isReadOnly={isReadOnly}
      isOwnedByMe={isOwnedByMe}
      callbackMode={callbackMode}
    />
  );

  const blockOptionsMarkup = (
    <div className="admin-hud-editor-block-options-page">
      {diagnosticsMarkup}
      <HudBlockOptions
        block={block}
        pathname={pathname}
        ownership={resolvedOwnership}
        contentAdmin={contentAdmin}
        showWorkflowActions={showWorkflowActions}
        showPublishAction={showPublishAction}
        onOwnershipAction={onOwnershipAction}
        onReleaseDraft={releaseDraft}
        onPublishBlock={publishBlock}
        onBlockDeleted={onBlockDeleted}
      />
    </div>
  );
  const isDynamicMigratedHudEditor = Boolean(
    MigratedHudEditor && String(block.mode || '').trim() === 'dynamic',
  );
  const usesInlineBackgroundPage = HUD_BLOCKS_WITH_INLINE_BACKGROUND.has(String(block.kind || '').trim());
  const usesCompatibilityBackgroundPage = isDynamicMigratedHudEditor
    && !HUD_EDITORS_WITH_SECTION_RAIL.has(String(block.kind || '').trim());
  const sharedBackgroundPage = usesInlineBackgroundPage || usesCompatibilityBackgroundPage
    ? null
    : <HudBlockBackgroundPage block={block} onSettingChange={blockedOnSettingChange} />;

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
      <HudEditorCompatibilityShell block={block} blockKind={block.kind} blockLabel={definition.label || block.kind} blockOptions={blockOptionsMarkup} onSettingChange={blockedOnSettingChange}>
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
          <>
            {renderMigratedHudEditor()}
            {sharedBackgroundPage}
          </>,
        )}
      </>
    );
  }

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
            <HudEditorCompatibilityShell block={block} blockKind={block.kind} blockLabel={definition.label || block.kind} blockOptions={blockOptionsMarkup} onSettingChange={blockedOnSettingChange}>
              <FieldControlGrid
                fields={editableFields.filter((field) => !['bgTone', 'backgroundEffectsJson'].includes(String(field?.id || '').trim()))}
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
