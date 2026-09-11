import { useCallback, useState, useSyncExternalStore } from 'react';
import {
  formatHudDiagnosticValue,
  getHudInputDiagnostic,
  HUD_INPUT_DIAGNOSTICS_ENABLED,
  subscribeHudInputDiagnostics,
} from '../lib/hudInputDiagnostics';

function yesNo(value) {
  return value ? 'yes' : 'no';
}

function displayActor(actor) {
  if (!actor) {
    return 'none';
  }
  const userId = String(actor.userId || '').trim() || 'unknown';
  const displayName = String(actor.displayName || '').trim();
  return displayName ? `${userId} (${displayName})` : userId;
}

function buildDiagnosticText({
  route,
  block,
  activePanelId,
  currentClient,
  collaboration,
  ownership,
  canEdit,
  isReadOnly,
  isOwnedByMe,
  callbackMode,
  capturedState,
}) {
  const lastControlEvent = capturedState.lastControlEvent;
  const lastEditorCallback = capturedState.lastEditorCallback;
  const lastPagePatch = capturedState.lastPagePatch;
  const lastLocalDraftUpdate = capturedState.lastLocalDraftUpdate;
  return [
    'DEV HUD INPUT DIAGNOSTICS',
    `Route: ${route || '—'}`,
    `Block ID: ${block?.id || '—'}`,
    `Block kind: ${block?.kind || '—'}`,
    `Current client: ${displayActor(currentClient)}`,
    `Locked by: ${displayActor(collaboration?.lockedBy)}`,
    `Locked by display name: ${collaboration?.lockedBy?.displayName || '—'}`,
    `Ownership: ${ownership?.state || 'none'}`,
    `canEdit: ${yesNo(canEdit)}`,
    `isReadOnly: ${yesNo(isReadOnly)}`,
    `isOwnedByMe: ${yesNo(isOwnedByMe)}`,
    `Controls visual: ${isReadOnly ? 'disabled' : 'enabled'}`,
    `Host callback: ${callbackMode}`,
    `Active panel ID: ${activePanelId || '—'}`,
    `Active block ID: ${block?.id || '—'}`,
    `Last control event: ${lastControlEvent ? `${lastControlEvent.settingKey} = ${lastControlEvent.incomingValue} @ ${lastControlEvent.timestamp}` : 'none'}`,
    `Last editor callback: ${lastEditorCallback ? `${yesNo(lastEditorCallback.fired)} / ${lastEditorCallback.outcome}${lastEditorCallback.reason ? ` (${lastEditorCallback.reason})` : ''}` : 'no'}`,
    `Last page patch: ${lastPagePatch ? `${yesNo(lastPagePatch.received)} / ${lastPagePatch.settingKey} = ${lastPagePatch.value}` : 'no'}`,
    `Last local draft update: ${lastLocalDraftUpdate ? `block changed ${yesNo(lastLocalDraftUpdate.blockChanged)}` : 'no'}`,
  ].join('\n');
}

async function copyDiagnosticText(textToCopy) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      return true;
    } catch {
      // Plain HTTP LAN pages may not expose navigator.clipboard.
    }
  }
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false;
  }
  const fallbackInput = document.createElement('textarea');
  fallbackInput.value = textToCopy;
  fallbackInput.setAttribute('readonly', '');
  fallbackInput.style.position = 'fixed';
  fallbackInput.style.opacity = '0';
  document.body.appendChild(fallbackInput);
  fallbackInput.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  fallbackInput.remove();
  return copied;
}

export default function HudInputDiagnostics({
  diagnosticKey,
  route,
  block,
  activePanelId = '',
  currentClient = null,
  collaboration = null,
  ownership = null,
  canEdit = false,
  isReadOnly = false,
  isOwnedByMe = false,
  callbackMode = 'unknown',
  defaultOpen = false,
}) {
  const readDiagnosticSnapshot = useCallback(
    () => getHudInputDiagnostic(diagnosticKey),
    [diagnosticKey],
  );
  const eventState = useSyncExternalStore(
    subscribeHudInputDiagnostics,
    readDiagnosticSnapshot,
    readDiagnosticSnapshot,
  );
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
  const [copyStatus, setCopyStatus] = useState('');
  if (!HUD_INPUT_DIAGNOSTICS_ENABLED) {
    return null;
  }
  const capturedState = eventState || getHudInputDiagnostic(diagnosticKey) || {};
  const lastControlEvent = capturedState.lastControlEvent;
  const lastEditorCallback = capturedState.lastEditorCallback;
  const lastPagePatch = capturedState.lastPagePatch;
  const lastLocalDraftUpdate = capturedState.lastLocalDraftUpdate;
  const handleCopy = async () => {
    const didCopy = await copyDiagnosticText(buildDiagnosticText({
      route,
      block,
      activePanelId,
      currentClient,
      collaboration,
      ownership,
      canEdit,
      isReadOnly,
      isOwnedByMe,
      callbackMode,
      capturedState,
    }));
    setCopyStatus(didCopy ? 'Copied' : 'Copy failed');
    if (didCopy && typeof window !== 'undefined') {
      window.setTimeout(() => setCopyStatus(''), 1800);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="admin-hud-input-diagnostics-toggle"
        onClick={() => setIsOpen(true)}
        aria-expanded="false"
      >
        DEV · HUD diagnostics
      </button>
    );
  }

  return (
    <aside className="admin-hud-input-diagnostics" aria-label="HUD input diagnostics" data-testid="hud-input-diagnostics">
      <div className="admin-hud-input-diagnostics-title">
        <span>DEV HUD INPUT DIAGNOSTICS</span>
        <span className="admin-hud-input-diagnostics-actions">
          {copyStatus ? <span role="status">{copyStatus}</span> : null}
          <button
            type="button"
            className="admin-hud-input-diagnostics-copy"
            onClick={() => { void handleCopy(); }}
            aria-label="Copy HUD input diagnostics"
            title="Copy redacted diagnostics"
          >
            ⧉
          </button>
          <button
            type="button"
            className="admin-hud-input-diagnostics-close"
            onClick={() => setIsOpen(false)}
            aria-label="Hide HUD input diagnostics"
          >
            ×
          </button>
        </span>
      </div>
      <div className="admin-hud-input-diagnostics-grid">
        <span>Route</span><strong>{route || '—'}</strong>
        <span>Block</span><strong>{block?.id || '—'}</strong>
        <span>Kind</span><strong>{block?.kind || '—'}</strong>

        <span>Client</span><strong>{displayActor(currentClient)}</strong>
        <span>Locked by</span><strong>{displayActor(collaboration?.lockedBy)}</strong>
        <span>Lock name</span><strong>{collaboration?.lockedBy?.displayName || '—'}</strong>
        <span>Ownership</span><strong>{ownership?.state || 'none'}</strong>

        <span>canEdit</span><strong>{yesNo(canEdit)}</strong>
        <span>isReadOnly</span><strong>{yesNo(isReadOnly)}</strong>
        <span>isOwnedByMe</span><strong>{yesNo(isOwnedByMe)}</strong>
        <span>Controls visual</span><strong>{isReadOnly ? 'disabled' : 'enabled'}</strong>
        <span>Host callback</span><strong>{callbackMode}</strong>

        <span>Active panel</span><strong>{activePanelId || '—'}</strong>
        <span>Active block</span><strong>{block?.id || '—'}</strong>

        <span>Control event</span>
        <strong>{lastControlEvent ? `${lastControlEvent.settingKey} = ${lastControlEvent.incomingValue} @ ${lastControlEvent.timestamp}` : 'none'}</strong>
        <span>Editor callback</span>
        <strong>{lastEditorCallback ? `${yesNo(lastEditorCallback.fired)} / ${lastEditorCallback.outcome}${lastEditorCallback.reason ? ` (${lastEditorCallback.reason})` : ''}` : 'no'}</strong>
        <span>Page patch</span>
        <strong>{lastPagePatch ? `${yesNo(lastPagePatch.received)} / ${lastPagePatch.settingKey} = ${lastPagePatch.value}` : 'no'}</strong>
        <span>Local draft</span>
        <strong>{lastLocalDraftUpdate ? `block changed ${yesNo(lastLocalDraftUpdate.blockChanged)}` : 'no'}</strong>
      </div>
    </aside>
  );
}

export { formatHudDiagnosticValue };
