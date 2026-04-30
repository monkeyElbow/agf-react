const CTA_BAND_PRESET_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'default',
    label: 'General CTA',
    description: 'Short non-form CTA band with concise copy and one action.',
    templateIds: Object.freeze(['cta_band', 'housing_allowance']),
    legacyBlockIds: Object.freeze(['housing_allowance']),
    defaults: Object.freeze({
      title: 'Take the next step.',
      body: 'Choose the action that moves you forward.',
      bgTone: 'white',
      buttonLabel: 'Contact us',
      buttonUrl: '/contact-us',
      buttonPageRef: '/contact-us',
      buttonOpenInNewWindow: false,
    }),
    editor: Object.freeze({
      contentFieldIds: Object.freeze(['title', 'body', 'bgTone']),
      actionFieldIds: Object.freeze(['buttonLabel', 'buttonUrl', 'buttonPageRef', 'buttonOpenInNewWindow']),
    }),
  }),
  Object.freeze({
    id: 'dashboard-login',
    label: 'Dashboard login',
    description: 'Investor login prompt with one primary external action.',
    templateIds: Object.freeze(['investor_cta']),
    legacyBlockIds: Object.freeze(['investor_cta']),
    defaults: Object.freeze({
      title: 'Already an investor?',
      body: 'Log in to manage.',
      bgTone: 'white',
      buttonLabel: 'Go to my dashboard',
      buttonUrl: 'https://secure.agfinancial.org/',
      buttonPageRef: '',
      buttonOpenInNewWindow: true,
    }),
    editor: Object.freeze({
      contentFieldIds: Object.freeze(['title', 'body', 'bgTone']),
      actionFieldIds: Object.freeze(['buttonLabel', 'buttonUrl', 'buttonPageRef', 'buttonOpenInNewWindow']),
    }),
  }),
]);

function clonePresetForDefinition(preset) {
  return Object.freeze({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    templateIds: Object.freeze([...(Array.isArray(preset.templateIds) ? preset.templateIds : [])]),
    legacyBlockIds: Object.freeze([...(Array.isArray(preset.legacyBlockIds) ? preset.legacyBlockIds : [])]),
    defaults: Object.freeze({ ...(preset.defaults || {}) }),
    editor: Object.freeze({
      ...(preset.editor || {}),
      contentFieldIds: Object.freeze([...(Array.isArray(preset?.editor?.contentFieldIds) ? preset.editor.contentFieldIds : [])]),
      actionFieldIds: Object.freeze([...(Array.isArray(preset?.editor?.actionFieldIds) ? preset.editor.actionFieldIds : [])]),
    }),
  });
}

export function getCtaBandPresetDefinitions() {
  return CTA_BAND_PRESET_DEFINITIONS.map(clonePresetForDefinition);
}

export function getCtaBandPresetDefinition(presetId) {
  const token = String(presetId || '').trim().toLowerCase();
  return CTA_BAND_PRESET_DEFINITIONS.find((preset) => preset.id === token) || CTA_BAND_PRESET_DEFINITIONS[0];
}

export function resolveCtaBandPresetId(block) {
  const explicitPresetId = String(block?.presetId || '').trim().toLowerCase();
  if (explicitPresetId) {
    const byExplicitPresetId = CTA_BAND_PRESET_DEFINITIONS.find((preset) => preset.id === explicitPresetId);
    if (byExplicitPresetId) {
      return byExplicitPresetId.id;
    }
  }

  const templateId = String(block?.templateId || '').trim().toLowerCase();
  if (templateId) {
    const byTemplate = CTA_BAND_PRESET_DEFINITIONS.find((preset) => preset.templateIds.includes(templateId));
    if (byTemplate) {
      return byTemplate.id;
    }
  }

  const blockId = String(block?.id || '').trim().toLowerCase();
  if (blockId) {
    const byBlockId = CTA_BAND_PRESET_DEFINITIONS.find((preset) => (
      Array.isArray(preset.legacyBlockIds) && preset.legacyBlockIds.includes(blockId)
    ));
    if (byBlockId) {
      return byBlockId.id;
    }
  }

  return 'default';
}

export function resolveCtaBandPresetDefinition(block) {
  return getCtaBandPresetDefinition(resolveCtaBandPresetId(block));
}

export function buildCtaBandPresetSettings(presetId, overrides = {}) {
  return {
    ...getCtaBandPresetDefinition(presetId).defaults,
    ...(overrides && typeof overrides === 'object' ? overrides : {}),
  };
}
