// Explicit snapshot migrations only. This module is not part of normal
// browser/server normalization or renderer composition.
export const RETIRED_TARGET_BRIDGE_SETTING_KEYS = Object.freeze([
  'targetSectionKey',
  'targetFineprintSectionKey',
  'targetSectionClassName',
  'targetSectionIndex',
]);

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function stripRetiredTargetBridgeSettingsFromBlock(block) {
  if (!block || typeof block !== 'object' || !block.settings || typeof block.settings !== 'object') {
    return cloneJson(block);
  }

  const settings = { ...block.settings };
  let changed = false;
  RETIRED_TARGET_BRIDGE_SETTING_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      delete settings[key];
      changed = true;
    }
  });

  return changed ? { ...cloneJson(block), settings } : cloneJson(block);
}

export function stripRetiredTargetBridgeSettingsFromBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .map(stripRetiredTargetBridgeSettingsFromBlock);
}

export function stripRetiredTargetBridgeSettingsFromState(state) {
  const source = state && typeof state === 'object' ? cloneJson(state) : {};
  return {
    ...source,
    blocksByPath: Object.fromEntries(
      Object.entries(source.blocksByPath || {}).map(([pathname, blocks]) => [
        pathname,
        stripRetiredTargetBridgeSettingsFromBlocks(blocks),
      ]),
    ),
  };
}
