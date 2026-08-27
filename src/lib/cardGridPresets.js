import {
  DEFAULT_DYNAMIC_GRID_CARD_BULLET_LINE_HEIGHT,
  DEFAULT_DYNAMIC_GRID_CARD_BULLET_SIZE_REM,
} from './dynamicGrid';

const CARD_GRID_PRESET_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'default',
    label: 'Flexible cards',
    description: 'General-purpose card grid for mixed card content.',
    templateIds: Object.freeze(['card_grid']),
    defaults: Object.freeze({
      bgTone: 'white',
      contentWidth: 'content',
      columns: 'three',
      cardStyle: 'card2',
      titleTone: 'super-grey',
      bodyTone: 'super-grey',
      cardPaddingRem: 1.35,
      cardTitleSizeRem: 1.14,
      cardBodySizeRem: 1,
      cardBulletSize: 'daf',
      cardBulletSizeRem: DEFAULT_DYNAMIC_GRID_CARD_BULLET_SIZE_REM,
      cardBulletLineHeight: DEFAULT_DYNAMIC_GRID_CARD_BULLET_LINE_HEIGHT,
      cardBodyLineHeight: 1.58,
    }),
    editor: Object.freeze({
      introFields: true,
      layoutFieldIds: Object.freeze(['contentWidth', 'columns', 'cardStyle']),
      typographyFields: true,
      maxCards: 8,
      cardFeatures: Object.freeze({
        primaryAction: true,
        secondaryAction: true,
        directLinks: true,
        accordions: true,
      }),
    }),
  }),
  Object.freeze({
    id: 'investment-options',
    label: 'Investment options',
    description: 'Stacked investment rows with title, body, and action columns paired with a separate billboard heading.',
    templateIds: Object.freeze([]),
    defaults: Object.freeze({
      bgTone: 'white',
      contentWidth: 'browser',
      columns: 'one',
      cardStyle: 'card2',
      titleTone: 'super-grey',
      bodyTone: 'super-grey',
      cardPaddingRem: 2.6,
      cardTitleSizeRem: 1.45,
      cardBodySizeRem: 1.02,
      cardBulletSize: 'daf',
      cardBulletSizeRem: DEFAULT_DYNAMIC_GRID_CARD_BULLET_SIZE_REM,
      cardBulletLineHeight: DEFAULT_DYNAMIC_GRID_CARD_BULLET_LINE_HEIGHT,
      cardBodyLineHeight: 1.56,
    }),
    editor: Object.freeze({
      introFields: false,
      layoutFieldIds: Object.freeze(['cardStyle']),
      typographyFields: true,
      maxCards: 4,
      cardFeatures: Object.freeze({
        primaryAction: true,
        secondaryAction: true,
        directLinks: true,
        accordions: true,
      }),
    }),
  }),
  Object.freeze({
    id: 'eligibility-cards',
    label: 'Eligibility cards',
    description: 'Qualification cards with plain text only and no card-level actions or resources.',
    templateIds: Object.freeze([]),
    defaults: Object.freeze({
      bgTone: 'white',
      contentWidth: 'browser',
      columns: 'three',
      cardStyle: 'none',
      titleTone: 'super-grey',
      bodyTone: 'super-grey',
      cardPaddingRem: 0.75,
      cardTitleSizeRem: 1.5,
      cardBodySizeRem: 1.08,
      cardBulletSize: 'daf',
      cardBulletSizeRem: DEFAULT_DYNAMIC_GRID_CARD_BULLET_SIZE_REM,
      cardBulletLineHeight: DEFAULT_DYNAMIC_GRID_CARD_BULLET_LINE_HEIGHT,
      cardBodyLineHeight: 1.45,
    }),
    editor: Object.freeze({
      introFields: true,
      layoutFieldIds: Object.freeze([]),
      typographyFields: true,
      maxCards: 3,
      cardFeatures: Object.freeze({
        primaryAction: false,
        secondaryAction: false,
        directLinks: false,
        accordions: false,
      }),
    }),
  }),
  Object.freeze({
    id: 'step-cards',
    label: 'Step-by-step cards',
    description: 'Process cards with a primary action only and no secondary resource stacks.',
    templateIds: Object.freeze([]),
    defaults: Object.freeze({
      bgTone: 'white',
      contentWidth: 'content',
      columns: 'two',
      cardStyle: 'card2',
      titleTone: 'alternating',
      bodyTone: 'super-grey',
      cardPaddingRem: 1.75,
      cardTitleSizeRem: 1.22,
      cardBodySizeRem: 1.08,
      cardBulletSize: 'daf',
      cardBulletSizeRem: DEFAULT_DYNAMIC_GRID_CARD_BULLET_SIZE_REM,
      cardBulletLineHeight: DEFAULT_DYNAMIC_GRID_CARD_BULLET_LINE_HEIGHT,
      cardBodyLineHeight: 1.55,
    }),
    editor: Object.freeze({
      introFields: true,
      layoutFieldIds: Object.freeze([]),
      typographyFields: true,
      maxCards: 3,
      cardFeatures: Object.freeze({
        primaryAction: true,
        secondaryAction: false,
        directLinks: false,
        accordions: false,
      }),
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
      layoutFieldIds: Object.freeze([...(preset?.editor?.layoutFieldIds || [])]),
      cardFeatures: Object.freeze({ ...(preset?.editor?.cardFeatures || {}) }),
    }),
  });
}

export function getCardGridPresetDefinitions() {
  return CARD_GRID_PRESET_DEFINITIONS.map(clonePresetForDefinition);
}

export function getCardGridPresetDefinition(presetId) {
  const token = String(presetId || '').trim().toLowerCase();
  return CARD_GRID_PRESET_DEFINITIONS.find((preset) => preset.id === token) || CARD_GRID_PRESET_DEFINITIONS[0];
}

export function resolveCardGridPresetId(block) {
  const explicitPresetId = String(block?.presetId || '').trim().toLowerCase();
  if (explicitPresetId) {
    const byExplicitPresetId = CARD_GRID_PRESET_DEFINITIONS.find((preset) => preset.id === explicitPresetId);
    if (byExplicitPresetId) {
      return byExplicitPresetId.id;
    }
  }

  const templateId = String(block?.templateId || '').trim().toLowerCase();
  if (templateId) {
    const byTemplate = CARD_GRID_PRESET_DEFINITIONS.find((preset) => preset.templateIds.includes(templateId));
    if (byTemplate) {
      return byTemplate.id;
    }
  }

  return 'default';
}

export function resolveCardGridPresetDefinition(block) {
  return getCardGridPresetDefinition(resolveCardGridPresetId(block));
}

export function buildCardGridPresetSettings(presetId, overrides = {}) {
  return {
    ...getCardGridPresetDefinition(presetId).defaults,
    ...(overrides && typeof overrides === 'object' ? overrides : {}),
  };
}
