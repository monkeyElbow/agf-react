const TEXT_LIKE_BLOCK_SETTING_PATTERN = /(text|title|heading|body|html|subtitle|label|message|copy|lead|followup|caption|alt|placeholder|options|url|ref|note|summary|json)/i;
const CONTINUOUS_NUMERIC_BLOCK_SETTING_PATTERN = /(spacing|size|width|height|padding|space|opacity|offset|share|radius|scale|letter|line|maxwidth|contentmaxwidth|ms)/i;
const IMMEDIATE_BLOCK_SETTING_PATTERN = /^(bgTone|textTone|justify|buttonStyle|buttonTone|mode|hidden|openInNewWindow|selectionMode|autoplay|enabled|required|type|fontFamily|fontWeight|animationPreset|actionJustify|heightMode)$/i;

export const SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS = 140;
export const SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS = 90;

export function shouldBufferLocalBlockSetting(settingKey = '', settingValue = undefined) {
  const normalizedSettingKey = String(settingKey || '').trim();
  if (normalizedSettingKey && IMMEDIATE_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return false;
  }
  if (normalizedSettingKey && TEXT_LIKE_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return true;
  }
  if (normalizedSettingKey && CONTINUOUS_NUMERIC_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return true;
  }
  if (typeof settingValue === 'string') {
    return true;
  }
  return false;
}

export function getSharedBlockDraftSyncDelay(settingKey = '', settingValue = undefined, patch = null) {
  const normalizedSettingKey = String(settingKey || '').trim();
  if (normalizedSettingKey && IMMEDIATE_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS;
  }
  if (normalizedSettingKey && TEXT_LIKE_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  if (normalizedSettingKey && CONTINUOUS_NUMERIC_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  if (typeof settingValue === 'string' || typeof settingValue === 'number') {
    return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  if (typeof settingValue === 'boolean') {
    return SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS;
  }
  if (patch && typeof patch === 'object') {
    const patchKeys = Object.keys(patch);
    const hasOnlyImmediateFields = patchKeys.length > 0
      && patchKeys.every((key) => IMMEDIATE_BLOCK_SETTING_PATTERN.test(key));
    return hasOnlyImmediateFields
      ? SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS
      : SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
}

