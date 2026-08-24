/**
 * Shared visual identity for authored numbered-step content.
 *
 * The content model must be a card-grid preset (step-cards) or an explicitly
 * classified legacy card-grid snapshot. Rich HTML and legacy pseudo-number
 * renderers stay outside this contract until their markup is normalized.
 */
export const NUMBERED_STEP_CARDS_CLASS_NAME = 'is-numbered-step-cards';

const NUMBERED_STEP_SECTION_TOKENS = new Set([
  'ministers-group-life-native-enroll',
  'online-contrib-native-steps',
  'retirement-403b-group-enrollment-steps',
  'retirement-403b-native-loan-apply',
  'retirement-individual-enrollment-steps',
]);

function sectionTokens(value) {
  return String(value || '').split(/\s+/).filter(Boolean);
}

export function isNumberedStepCardsSection({ presetId = '', sectionClassName = '' } = {}) {
  const normalizedPresetId = String(presetId || '').trim().toLowerCase();
  return normalizedPresetId === 'step-cards'
    || sectionTokens(sectionClassName).some((token) => NUMBERED_STEP_SECTION_TOKENS.has(token));
}

export function resolveNumberedStepCardsClassName(options = {}) {
  return isNumberedStepCardsSection(options) ? NUMBERED_STEP_CARDS_CLASS_NAME : '';
}
