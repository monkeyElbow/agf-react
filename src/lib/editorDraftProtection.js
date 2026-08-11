export function normalizeEditorDraftRevision(value) {
  const revision = Number(value);
  return Number.isFinite(revision) && revision > 0 ? revision : 0;
}

export function createProtectedEditorDraft(value, revision) {
  return {
    value: String(value ?? ''),
    revision: normalizeEditorDraftRevision(revision),
  };
}

export function shouldKeepProtectedEditorDraft(protectedDraft, sourceRevision) {
  if (!protectedDraft) {
    return false;
  }
  return normalizeEditorDraftRevision(sourceRevision) <= protectedDraft.revision;
}

export function isOlderEditorDraftRevision(sourceRevision, latestRevision) {
  return normalizeEditorDraftRevision(sourceRevision) < normalizeEditorDraftRevision(latestRevision);
}
