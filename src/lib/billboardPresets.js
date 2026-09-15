import { serializeLinkValue } from './linkValue';

export const BILLBOARD_BODY_PLACEHOLDER_TEXT = 'Add supporting copy here.';
export const BILLBOARD_BODY_SOURCE_HTML = 'html';
export const BILLBOARD_BODY_SOURCE_LEGACY = 'legacy';
const BILLBOARD_BODY_PLACEHOLDER_HTML = `<p>${BILLBOARD_BODY_PLACEHOLDER_TEXT}</p>`
  .replace(/\s+/g, '')
  .toLowerCase();

export function isBillboardBodyPlaceholderHtml(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase() === BILLBOARD_BODY_PLACEHOLDER_HTML;
}

export function isBillboardBodyHtmlEmpty(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, '')
    .toLowerCase();
  return !normalized || [
    '<p></p>',
    '<p><br></p>',
    '<p><br/></p>',
    '<p><br /></p>',
    '<p>&nbsp;</p>',
  ].includes(normalized);
}

/**
 * Existing Billboard blocks may have plain copy in `body` and no HTML body.
 * Resolve that legacy shape without writing a migration during render.
 */
export function resolveBillboardBodySource(settings = {}) {
  const explicitSource = String(settings.bodySource || '').trim().toLowerCase();
  if (explicitSource === BILLBOARD_BODY_SOURCE_HTML) {
    return BILLBOARD_BODY_SOURCE_HTML;
  }
  if (explicitSource === BILLBOARD_BODY_SOURCE_LEGACY) {
    return BILLBOARD_BODY_SOURCE_LEGACY;
  }
  return isBillboardBodyHtmlEmpty(settings.bodyHtml)
    ? BILLBOARD_BODY_SOURCE_LEGACY
    : BILLBOARD_BODY_SOURCE_HTML;
}

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
      subtitleHighlightsJson: '',
      bodyHtml: '',
      body: '',
      bgTone: 'blue',
      textTone: 'white',
      justify: 'center',
      bodyJustify: 'center',
      bodyMaxWidthPx: '',
      lineSpacing: 1,
      headerGapRem: '',
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
  Object.freeze({
    id: 'planned-giving-joy',
    label: 'Planned Giving · More joy',
    description: 'Centered planned-giving billboard presentation.',
    templateIds: Object.freeze([]),
    defaults: Object.freeze({
      titleFontFamily: 'helv',
    }),
    editor: Object.freeze({
      contentFieldIds: Object.freeze(['title', 'subtitle', 'body', 'bgTone', 'textTone']),
      actionFieldIds: Object.freeze(['buttonLabel', 'buttonPageRef', 'buttonOpenInNewWindow']),
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
  const hasLegacyGivingJoyClass = String(block?.settings?.sectionClassName || '')
    .split(/\s+/)
    .includes('legacy-giving-joy');
  if (explicitPresetId === 'default' && hasLegacyGivingJoyClass) {
    return 'planned-giving-joy';
  }
  if (BILLBOARD_PRESET_DEFINITIONS.some((preset) => preset.id === explicitPresetId)) {
    return explicitPresetId;
  }

  const templateId = String(block?.templateId || '').trim().toLowerCase();
  const matchedPreset = BILLBOARD_PRESET_DEFINITIONS.find((preset) => preset.templateIds.includes(templateId));
  if (hasLegacyGivingJoyClass) {
    return 'planned-giving-joy';
  }
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
