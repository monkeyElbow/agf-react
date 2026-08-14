const COLUMNS_PRESET_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'planned-giving-steps',
    label: 'Planned Giving Steps',
    description: 'Numbered, art-led steps for planned-giving explanations.',
    templateIds: Object.freeze([]),
    defaults: Object.freeze({
      columnsStyle: 'retirement',
      bgTone: 'white',
      contentWidth: 'browser',
      columns: 'three',
    }),
    editor: Object.freeze({
      layoutFieldIds: Object.freeze(['contentWidth']),
      maxColumns: 4,
      fixedColumns: false,
      allowBackgroundTone: true,
      allowPhotoColumns: false,
      allowTextColumnImages: false,
      allowColumnActions: true,
      allowColumnWidthShare: false,
      editorMode: 'planned-giving-steps',
    }),
  }),
  Object.freeze({
    id: 'default',
    label: 'Flexible columns',
    description: 'General-purpose columns block for text and photo layouts.',
    templateIds: Object.freeze(['columns']),
    defaults: Object.freeze({
      columnsStyle: 'retirement',
      bgTone: 'white',
      contentWidth: 'content',
      columns: 'two',
    }),
    editor: Object.freeze({
      layoutFieldIds: Object.freeze(['leadLine', 'followupLine', 'contentWidth']),
      maxColumns: 4,
      fixedColumns: false,
      allowBackgroundTone: true,
      allowPhotoColumns: true,
      allowTextColumnImages: true,
      allowColumnActions: true,
      allowColumnWidthShare: true,
    }),
  }),
  Object.freeze({
    id: 'housing-allowance',
    label: 'Housing allowance',
    description: 'Two-column retirement highlight used for the ministers housing allowance section.',
    templateIds: Object.freeze([]),
    defaults: Object.freeze({
      columnsStyle: 'retirement',
      bgTone: 'sand',
      contentWidth: 'content',
      columns: 'two',
    }),
    editor: Object.freeze({
      layoutFieldIds: Object.freeze(['contentWidth']),
      maxColumns: 2,
      fixedColumns: true,
      allowBackgroundTone: true,
      allowPhotoColumns: true,
      allowTextColumnImages: true,
      allowColumnActions: true,
      allowColumnWidthShare: false,
    }),
  }),
  Object.freeze({
    id: 'do-the-math',
    label: 'Do the math',
    description: 'Two-column calculator promo with one text column and one supporting image column.',
    templateIds: Object.freeze([]),
    defaults: Object.freeze({
      columnsStyle: 'retirement',
      bgTone: 'white',
      contentWidth: 'content',
      columns: 'two',
    }),
    editor: Object.freeze({
      layoutFieldIds: Object.freeze(['contentWidth']),
      maxColumns: 2,
      fixedColumns: true,
      allowBackgroundTone: true,
      allowPhotoColumns: true,
      allowTextColumnImages: true,
      allowColumnActions: true,
      allowColumnWidthShare: false,
    }),
  }),
  Object.freeze({
    id: 'value-cards',
    label: 'Value cards',
    description: 'Three-column text-only value section for the loans page.',
    templateIds: Object.freeze([]),
    defaults: Object.freeze({
      columnsStyle: 'loans-value',
      bgTone: 'white',
      contentWidth: 'browser',
      columns: 'three',
    }),
    editor: Object.freeze({
      layoutFieldIds: Object.freeze([]),
      maxColumns: 3,
      fixedColumns: true,
      allowBackgroundTone: false,
      allowPhotoColumns: false,
      allowTextColumnImages: false,
      allowColumnActions: false,
      allowColumnWidthShare: false,
    }),
  }),
]);

function clonePresetForDefinition(preset) {
  return Object.freeze({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    templateIds: Object.freeze([...(Array.isArray(preset.templateIds) ? preset.templateIds : [])]),
    defaults: Object.freeze({ ...(preset.defaults || {}) }),
    editor: Object.freeze({
      ...(preset.editor || {}),
      layoutFieldIds: Object.freeze([...(Array.isArray(preset?.editor?.layoutFieldIds) ? preset.editor.layoutFieldIds : [])]),
    }),
  });
}

export function getColumnsPresetDefinitions() {
  return COLUMNS_PRESET_DEFINITIONS.map(clonePresetForDefinition);
}

export function getColumnsPresetDefinition(presetId) {
  const token = String(presetId || '').trim().toLowerCase();
  return COLUMNS_PRESET_DEFINITIONS.find((preset) => preset.id === token) || COLUMNS_PRESET_DEFINITIONS[0];
}

export function resolveColumnsPresetId(block) {
  const explicitPresetId = String(block?.presetId || '').trim().toLowerCase();
  if (explicitPresetId) {
    const byExplicitPresetId = COLUMNS_PRESET_DEFINITIONS.find((preset) => preset.id === explicitPresetId);
    if (byExplicitPresetId) {
      return byExplicitPresetId.id;
    }
  }

  const templateId = String(block?.templateId || '').trim().toLowerCase();
  if (templateId) {
    const byTemplate = COLUMNS_PRESET_DEFINITIONS.find((preset) => preset.templateIds.includes(templateId));
    if (byTemplate) {
      return byTemplate.id;
    }
  }

  return 'default';
}

export function resolveColumnsPresetDefinition(block) {
  return getColumnsPresetDefinition(resolveColumnsPresetId(block));
}

export function buildColumnsPresetSettings(presetId, overrides = {}) {
  return {
    ...getColumnsPresetDefinition(presetId).defaults,
    ...(overrides && typeof overrides === 'object' ? overrides : {}),
  };
}
