// Explicit snapshot migrations only. This module is not part of normal
// browser/server normalization or renderer composition.
export const RETIRED_TARGET_BRIDGE_SETTING_KEYS = Object.freeze([
  'targetSectionKey',
  'targetFineprintSectionKey',
  'targetSectionClassName',
  'targetSectionIndex',
]);

export const GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID = 'generosity-fund-daf-refresh';
export const GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION = 1;
export const GENEROSITY_FUND_PATH = '/services/planned-giving/donor-advised-fund';
export const GENEROSITY_FUND_CANONICAL_BLOCK_IDS = Object.freeze([
  'hero',
  'how_it_works',
  'generosity_fund_online',
  'gift_assets',
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

function cloneTemplateVariant(template) {
  return template && typeof template === 'object'
    ? JSON.parse(JSON.stringify(template))
    : null;
}

function replaceGenerosityFundManagedBlock(storedBlock, defaultBlock) {
  const blockId = String(storedBlock?.id || '').trim();
  if (!GENEROSITY_FUND_CANONICAL_BLOCK_IDS.includes(blockId) || !defaultBlock) {
    return cloneTemplateVariant(storedBlock);
  }

  const canonicalBlock = cloneTemplateVariant(defaultBlock);
  return {
    ...cloneTemplateVariant(storedBlock),
    templateId: canonicalBlock.templateId || storedBlock?.templateId,
    presetId: canonicalBlock.presetId || storedBlock?.presetId,
    name: canonicalBlock.name || storedBlock?.name,
    kind: canonicalBlock.kind || storedBlock?.kind,
    mode: canonicalBlock.mode || storedBlock?.mode,
    hidden: Object.prototype.hasOwnProperty.call(canonicalBlock, 'hidden')
      ? canonicalBlock.hidden
      : storedBlock?.hidden,
    settings: {
      ...(canonicalBlock.settings || {}),
    },
    editableFields: Array.isArray(canonicalBlock.editableFields)
      ? [...canonicalBlock.editableFields]
      : (Array.isArray(storedBlock?.editableFields) ? [...storedBlock.editableFields] : []),
  };
}

/**
 * Explicit migration for the retired Generosity Fund block shapes.
 * This function deliberately does not normalize the input and is never
 * called by ordinary browser/server load or save code.
 */
export function migrateGenerosityFundSnapshot(rawState, {
  defaultState,
  fromVersion = 0,
} = {}) {
  const source = rawState && typeof rawState === 'object' ? cloneTemplateVariant(rawState) : {};
  const numericVersion = Number.isFinite(Number(fromVersion)) ? Number(fromVersion) : 0;
  if (numericVersion >= GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION) {
    return {
      state: source,
      changed: false,
      migration: {
        id: GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID,
        version: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
        applied: false,
        alreadyApplied: true,
      },
    };
  }

  const currentBlocks = Array.isArray(source?.blocksByPath?.[GENEROSITY_FUND_PATH])
    ? source.blocksByPath[GENEROSITY_FUND_PATH]
    : null;
  const defaultBlocks = Array.isArray(defaultState?.blocksByPath?.[GENEROSITY_FUND_PATH])
    ? defaultState.blocksByPath[GENEROSITY_FUND_PATH]
    : [];
  if (!currentBlocks || !defaultBlocks.length) {
    return {
      state: source,
      changed: false,
      migration: {
        id: GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID,
        version: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
        applied: false,
        alreadyApplied: false,
        skipped: 'reference-state-missing',
      },
    };
  }

  const defaultBlocksById = new Map(
    defaultBlocks.map((block) => [String(block?.id || '').trim(), block]),
  );
  const migratedBlocks = currentBlocks.map((block) => replaceGenerosityFundManagedBlock(
    block,
    defaultBlocksById.get(String(block?.id || '').trim()),
  ));
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(currentBlocks);

  return {
    state: changed
      ? {
          ...source,
          blocksByPath: {
            ...(source.blocksByPath || {}),
            [GENEROSITY_FUND_PATH]: migratedBlocks,
          },
        }
      : source,
    changed,
    migration: {
      id: GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID,
      version: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
      applied: true,
      alreadyApplied: false,
    },
  };
}
