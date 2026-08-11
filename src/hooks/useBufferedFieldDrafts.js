import { useEffect, useMemo, useRef, useState } from 'react';
import { useOptionalContentAdmin } from '../context/ContentAdminContextCore';
import {
  createProtectedEditorDraft,
  isOlderEditorDraftRevision,
  normalizeEditorDraftRevision,
  shouldKeepProtectedEditorDraft,
} from '../lib/editorDraftProtection';

export const BUFFERED_FIELD_DRAFT_COMMIT_DELAY_MS = 320;

function normalizeFieldDefinitions(fields = []) {
  return (Array.isArray(fields) ? fields : [])
    .map((field) => ({
      id: String(field?.id || '').trim(),
      value: String(field?.value || ''),
      commit: typeof field?.commit === 'function' ? field.commit : null,
      mode: String(field?.mode || 'debounce').trim().toLowerCase() === 'blur' ? 'blur' : 'debounce',
    }))
    .filter((field) => field.id && field.commit);
}

function readExternalDraftValues(fieldDefinitions = []) {
  return fieldDefinitions.reduce((drafts, field) => {
    drafts[field.id] = String(field.value || '');
    return drafts;
  }, {});
}

function areTokenListsEqual(left = [], right = []) {
  if (left === right) {
    return true;
  }
  if (left.length !== right.length) {
    return false;
  }
  return left.every((token, index) => token === right[index]);
}

export default function useBufferedFieldDrafts({
  fields = [],
  commitDelayMs = BUFFERED_FIELD_DRAFT_COMMIT_DELAY_MS,
  sourceRevision = 0,
}) {
  const contentAdmin = useOptionalContentAdmin();
  const effectiveSourceRevision = sourceRevision || contentAdmin?.sharedSnapshotUpdatedAt || 0;
  const normalizedFields = useMemo(() => normalizeFieldDefinitions(fields), [fields]);
  const externalDraftValues = useMemo(
    () => readExternalDraftValues(normalizedFields),
    [normalizedFields],
  );
  const fieldDefinitionsById = useMemo(
    () => new Map(normalizedFields.map((field) => [field.id, field])),
    [normalizedFields],
  );
  const [draftValues, setDraftValues] = useState(() => externalDraftValues);
  const [dirtyFieldIds, setDirtyFieldIds] = useState([]);
  const draftValuesRef = useRef(draftValues);
  const externalDraftValuesRef = useRef(externalDraftValues);
  const fieldDefinitionsByIdRef = useRef(fieldDefinitionsById);
  const committedValuesRef = useRef(externalDraftValues);
  const commitTimersRef = useRef(new Map());
  const protectedDraftValuesRef = useRef(new Map());
  const latestSourceRevisionRef = useRef(normalizeEditorDraftRevision(effectiveSourceRevision));

  useEffect(() => {
    draftValuesRef.current = draftValues;
  }, [draftValues]);

  useEffect(() => {
    externalDraftValuesRef.current = externalDraftValues;
    fieldDefinitionsByIdRef.current = fieldDefinitionsById;
  }, [externalDraftValues, fieldDefinitionsById]);

  useEffect(() => {
    latestSourceRevisionRef.current = Math.max(
      latestSourceRevisionRef.current,
      normalizeEditorDraftRevision(effectiveSourceRevision),
    );
  }, [effectiveSourceRevision]);

  useEffect(() => () => {
    commitTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    commitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    const normalizedSourceRevision = normalizeEditorDraftRevision(effectiveSourceRevision);
    if (isOlderEditorDraftRevision(normalizedSourceRevision, latestSourceRevisionRef.current)) {
      return;
    }
    setDraftValues((current) => {
      let changed = false;
      const next = { ...current };
      normalizedFields.forEach((field) => {
        if (dirtyFieldIds.includes(field.id)) {
          return;
        }
        const externalValue = externalDraftValues[field.id] ?? '';
        const protectedDraft = protectedDraftValuesRef.current.get(field.id);
        if (protectedDraft) {
          if (shouldKeepProtectedEditorDraft(protectedDraft, normalizedSourceRevision)) {
            return;
          }
          protectedDraftValuesRef.current.delete(field.id);
        }
        committedValuesRef.current[field.id] = externalValue;
        if ((current[field.id] ?? '') === externalValue) {
          return;
        }
        next[field.id] = externalValue;
        changed = true;
      });
      return changed ? next : current;
    });
  }, [dirtyFieldIds, externalDraftValues, normalizedFields, effectiveSourceRevision]);

  useEffect(() => {
    setDirtyFieldIds((current) => {
      const next = current.filter((fieldId) => (
        (draftValues[fieldId] ?? '') !== (externalDraftValues[fieldId] ?? '')
      ));
      return areTokenListsEqual(current, next) ? current : next;
    });
  }, [draftValues, externalDraftValues]);

  const commitDraftValue = (fieldId, explicitValue) => {
    const normalizedFieldId = String(fieldId || '').trim();
    if (!normalizedFieldId) {
      return;
    }
    const timerId = commitTimersRef.current.get(normalizedFieldId);
    if (timerId) {
      window.clearTimeout(timerId);
      commitTimersRef.current.delete(normalizedFieldId);
    }

    const definition = fieldDefinitionsByIdRef.current.get(normalizedFieldId);
    if (!definition?.commit) {
      return;
    }

    const nextValue = String(
      explicitValue ?? draftValuesRef.current?.[normalizedFieldId] ?? externalDraftValuesRef.current?.[normalizedFieldId] ?? '',
    );
    protectedDraftValuesRef.current.set(
      normalizedFieldId,
      createProtectedEditorDraft(nextValue, effectiveSourceRevision),
    );
    const previousValue = String(
      committedValuesRef.current?.[normalizedFieldId] ?? externalDraftValuesRef.current?.[normalizedFieldId] ?? '',
    );
    if (nextValue === previousValue) {
      return;
    }
    committedValuesRef.current[normalizedFieldId] = nextValue;
    definition.commit(nextValue, { previousValue });
  };

  const scheduleCommit = (fieldId, nextValue) => {
    const normalizedFieldId = String(fieldId || '').trim();
    if (!normalizedFieldId) {
      return;
    }
    const existingTimerId = commitTimersRef.current.get(normalizedFieldId);
    if (existingTimerId) {
      window.clearTimeout(existingTimerId);
    }
    commitTimersRef.current.set(normalizedFieldId, window.setTimeout(() => {
      commitDraftValue(normalizedFieldId, nextValue);
    }, commitDelayMs));
  };

  const updateDraftValue = (fieldId, nextValue, { commitImmediately = false } = {}) => {
    const normalizedFieldId = String(fieldId || '').trim();
    if (!normalizedFieldId) {
      return;
    }
    const safeNextValue = String(nextValue || '');
    protectedDraftValuesRef.current.set(
      normalizedFieldId,
      createProtectedEditorDraft(safeNextValue, effectiveSourceRevision),
    );
    draftValuesRef.current = {
      ...draftValuesRef.current,
      [normalizedFieldId]: safeNextValue,
    };
    setDraftValues((current) => (
      current[normalizedFieldId] === safeNextValue
        ? current
        : { ...current, [normalizedFieldId]: safeNextValue }
    ));
    setDirtyFieldIds((current) => (
      current.includes(normalizedFieldId)
        ? current
        : [...current, normalizedFieldId]
    ));
    if (commitImmediately) {
      commitDraftValue(normalizedFieldId, safeNextValue);
      return;
    }
    if ((fieldDefinitionsByIdRef.current.get(normalizedFieldId)?.mode || 'debounce') === 'debounce') {
      scheduleCommit(normalizedFieldId, safeNextValue);
    }
  };

  return {
    draftValues,
    updateDraftValue,
    commitDraftValue,
  };
}
