import { serializeLinkValue } from './linkValue';

const BILLBOARD_PRESET_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'default',
    label: 'Billboard',
    description: 'Flexible billboard copy with optional supporting actions.',
    templateIds: Object.freeze(['billboard', 'billboard_default']),
    defaults: Object.freeze({
      title: 'Add a headline.',
      titleClassName: '',
      titleHighlightsJson: '',
      subtitle: '',
      bodyHtml: '<p>Add supporting copy here.</p>',
      body: '',
      bgTone: 'blue',
      textTone: 'white',
      justify: 'center',
      lineSpacing: 1,
      titleFontFamily: 'helv',
      titleFontWeight: 700,
      titleSizeRem: 3.4,
      titleLetterSpacingEm: -0.038,
      buttonLabel: '',
      buttonUrl: '',
      buttonPageRef: '',
      buttonOpenInNewWindow: false,
    }),
    editor: Object.freeze({
      contentFieldIds: Object.freeze(['title', 'subtitle', 'bodyHtml', 'bgTone', 'textTone']),
      actionFieldIds: Object.freeze(['buttonLabel', 'buttonPageRef', 'buttonOpenInNewWindow']),
    }),
  }),
  Object.freeze({
    id: 'dashboard-login',
    label: 'Dashboard login',
    description: 'Investor login prompt with one primary external action.',
    templateIds: Object.freeze(['dashboard_login_cta']),
    defaults: Object.freeze({
      title: 'Already an investor?',
      subtitle: '',
      bodyHtml: '',
      body: '',
      bgTone: 'white',
      textTone: 'dark',
      justify: 'center',
      buttonLabel: 'Log in to manage',
      buttonLinkJson: serializeLinkValue({
        kind: 'external',
        href: 'https://secure.agfinancial.org/',
        openInNewWindow: true,
      }),
    }),
    editor: Object.freeze({
      contentFieldIds: Object.freeze(['title', 'body', 'bgTone']),
      actionFieldIds: Object.freeze(['buttonLabel', 'buttonLinkJson']),
    }),
  }),
]);

function clonePresetForDefinition(preset) {
  return Object.freeze({
    id: preset.id,
    label: preset.label,
    description: preset.description,
    templateIds: Object.freeze([...(preset.templateIds || [])]),
    defaults: Object.freeze({ ...(preset.defaults || {}) }),
    editor: Object.freeze({
      ...(preset.editor || {}),
      contentFieldIds: Object.freeze([...(preset.editor?.contentFieldIds || [])]),
      actionFieldIds: Object.freeze([...(preset.editor?.actionFieldIds || [])]),
    }),
  });
}

export function getBillboardPresetDefinitions() {
  return BILLBOARD_PRESET_DEFINITIONS.map(clonePresetForDefinition);
}

export function getBillboardPresetDefinition(presetId) {
  const token = String(presetId || '').trim().toLowerCase();
  return BILLBOARD_PRESET_DEFINITIONS.find((preset) => preset.id === token)
    || BILLBOARD_PRESET_DEFINITIONS[0];
}

export function resolveBillboardPresetId(block) {
  const explicitPresetId = String(block?.presetId || '').trim().toLowerCase();
  if (BILLBOARD_PRESET_DEFINITIONS.some((preset) => preset.id === explicitPresetId)) {
    return explicitPresetId;
  }

  const templateId = String(block?.templateId || '').trim().toLowerCase();
  const matchedPreset = BILLBOARD_PRESET_DEFINITIONS.find((preset) => preset.templateIds.includes(templateId));
  return matchedPreset?.id || 'default';
}

export function resolveBillboardPresetDefinition(block) {
  return getBillboardPresetDefinition(resolveBillboardPresetId(block));
}

export function buildBillboardPresetSettings(presetId, overrides = {}) {
  return {
    ...getBillboardPresetDefinition(presetId).defaults,
    ...(overrides && typeof overrides === 'object' ? overrides : {}),
  };
}
