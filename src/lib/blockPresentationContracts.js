function sanitizeClassTokens(value) {
  return String(value || '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasClassName(settings, className) {
  return sanitizeClassTokens(settings?.sectionClassName).includes(className);
}

function normalizeBlockKind(block) {
  return String(block?.kind || block?.type || '').trim().toLowerCase();
}

function normalizePresetToken(value) {
  return String(value || '').trim().toLowerCase();
}

function getRequestFormPresetId(settings = {}) {
  const explicitPresetId = normalizePresetToken(settings.presetId || settings.requestFormPresetId);
  if (explicitPresetId) {
    return explicitPresetId;
  }
  if (hasClassName(settings, 'legacy-child-native-request')) {
    return 'legacy-impact';
  }
  return '';
}

function normalizeLockedFieldIds(fieldIds) {
  return new Set((Array.isArray(fieldIds) ? fieldIds : []).map((fieldId) => String(fieldId || '').trim()).filter(Boolean));
}

function filterEditableFields(editableFields, lockedFieldIds) {
  if (!Array.isArray(editableFields) || !lockedFieldIds?.size) {
    return editableFields;
  }

  return editableFields.filter((field) => !lockedFieldIds.has(String(field?.id || '').trim()));
}

const REQUEST_FORM_STEP_META_FIELD_IDS = Object.freeze(
  [1, 2, 3, 4, 5].flatMap((slot) => [
    `step${slot}Title`,
    `step${slot}Note`,
    `step${slot}Alert`,
  ]),
);

const REQUEST_FORM_PRESET_PRESENTATION_CONTRACTS = Object.freeze({
  'legacy-impact': Object.freeze({
    settings: Object.freeze({
      bgTone: 'blue',
      textTone: 'white',
      titleClassName: '',
      titleHighlightsJson: '[{"text":"legacy","className":"is-white"}]',
      spaceBeforeRem: 3.6,
      spaceAfterRem: 4.2,
      hideStepTitles: true,
    }),
    clearStepMeta: true,
    lockedFieldIds: Object.freeze([
      'bgTone',
      'textTone',
      'titleClassName',
      'titleHighlightsJson',
      'spaceBeforeRem',
      'spaceAfterRem',
      'hideStepTitles',
      'presetId',
      'requestFormPresetId',
      'sectionClassName',
      ...REQUEST_FORM_STEP_META_FIELD_IDS,
    ]),
  }),
});

const BILLBOARD_PRESENTATION_CONTRACTS = Object.freeze([
  Object.freeze({
    id: 'planned-giving-joy-billboard',
    matches: (settings) => hasClassName(settings, 'legacy-giving-joy'),
    settings: Object.freeze({
      titleFontFamily: 'helv',
    }),
    lockedFieldIds: Object.freeze(['titleFontFamily']),
  }),
  Object.freeze({
    id: 'legacy-cga-outro',
    matches: (settings) => hasClassName(settings, 'legacy-child-native-cga-outro'),
    settings: Object.freeze({
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      justify: 'center',
      actionsBeforeCards: true,
      fineprint: undefined,
      fineprintDisclosureId: undefined,
    }),
    lockedFieldIds: Object.freeze([
      'titleFontFamily',
      'titleFontWeight',
      'justify',
      'actionsBeforeCards',
      'fineprint',
      'fineprintDisclosureId',
    ]),
  }),
  Object.freeze({
    id: 'legacy-ministry-impact-outro',
    matches: (settings) => (
      hasClassName(settings, 'legacy-child-native-billboard')
    ),
    settings: Object.freeze({
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      titleSizeRem: 4.59375,
    }),
    lockedFieldIds: Object.freeze([
      'titleFontFamily',
      'titleFontWeight',
      'titleSizeRem',
    ]),
  }),
]);

export function getRequestFormPresetPresentationContract(presetId) {
  const token = normalizePresetToken(presetId);
  return REQUEST_FORM_PRESET_PRESENTATION_CONTRACTS[token] || null;
}

export function normalizeRequestFormPresetSettings(settings, presetId) {
  const source = settings && typeof settings === 'object' ? settings : {};
  const contract = getRequestFormPresetPresentationContract(presetId || getRequestFormPresetId(source));
  if (!contract) {
    return source;
  }

  const nextSettings = {
    ...source,
    ...contract.settings,
  };

  if (contract.clearStepMeta) {
    [1, 2, 3, 4, 5].forEach((slot) => {
      nextSettings[`step${slot}Title`] = '';
      nextSettings[`step${slot}Note`] = '';
      nextSettings[`step${slot}Alert`] = '';
    });
  }

  return nextSettings;
}

export function getBillboardPresentationContract(settings) {
  const source = settings && typeof settings === 'object' ? settings : {};
  return BILLBOARD_PRESENTATION_CONTRACTS.find((contract) => contract.matches(source)) || null;
}

export function normalizeBillboardPresentationSettings(settings) {
  const source = settings && typeof settings === 'object' ? settings : {};
  const contract = getBillboardPresentationContract(source);
  return contract ? { ...source, ...contract.settings } : source;
}

export function getBlockPresentationLockedFieldIds(block) {
  const source = block && typeof block === 'object' ? block : {};
  const settings = source.settings && typeof source.settings === 'object' ? source.settings : {};
  const kind = normalizeBlockKind(source);

  if (kind === 'request_form') {
    const contract = getRequestFormPresetPresentationContract(getRequestFormPresetId(settings));
    return normalizeLockedFieldIds(contract?.lockedFieldIds);
  }

  if (kind === 'billboard') {
    const contract = getBillboardPresentationContract(settings);
    return normalizeLockedFieldIds(contract?.lockedFieldIds);
  }

  return new Set();
}

export function normalizeBlockPresentation(block) {
  if (!block || typeof block !== 'object') {
    return block;
  }

  const kind = normalizeBlockKind(block);
  const currentSettings = block.settings && typeof block.settings === 'object' ? block.settings : {};
  let nextSettings = currentSettings;

  if (kind === 'request_form') {
    nextSettings = normalizeRequestFormPresetSettings(currentSettings);
  } else if (kind === 'billboard') {
    nextSettings = normalizeBillboardPresentationSettings(currentSettings);
  }

  const lockedFieldIds = getBlockPresentationLockedFieldIds({ ...block, settings: nextSettings });
  const nextEditableFields = filterEditableFields(block.editableFields, lockedFieldIds);
  const settingsChanged = JSON.stringify(nextSettings) !== JSON.stringify(currentSettings);
  const editableFieldsChanged = nextEditableFields !== block.editableFields;

  return settingsChanged || editableFieldsChanged
    ? { ...block, settings: nextSettings, editableFields: nextEditableFields }
    : block;
}

export function normalizeBlockForRender(block) {
  return normalizeBlockPresentation(block);
}
