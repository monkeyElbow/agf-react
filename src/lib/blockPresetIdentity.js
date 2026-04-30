import {
  getCardGridPresetDefinitions,
  resolveCardGridPresetDefinition,
} from './cardGridPresets';
import {
  getCtaBandPresetDefinitions,
  resolveCtaBandPresetDefinition,
} from './ctaBandPresets';
import {
  getColumnsPresetDefinitions,
  resolveColumnsPresetDefinition,
} from './columnsPresets';

function findPresetDefinitionByTemplateOrLegacyId(block, definitions) {
  const templateId = String(block?.templateId || '').trim().toLowerCase();
  if (templateId) {
    const byTemplateId = definitions.find((preset) => (
      Array.isArray(preset?.templateIds)
      && preset.templateIds.some((candidate) => String(candidate || '').trim().toLowerCase() === templateId)
    ));
    if (byTemplateId) {
      return byTemplateId;
    }
  }

  const blockId = String(block?.id || '').trim().toLowerCase();
  if (!blockId) {
    return null;
  }

  return definitions.find((preset) => (
    Array.isArray(preset?.legacyBlockIds)
    && preset.legacyBlockIds.some((candidate) => String(candidate || '').trim().toLowerCase() === blockId)
  )) || null;
}

function resolvePresetDefinition(block) {
  const kind = String(block?.kind || '').trim().toLowerCase();
  if (kind === 'card_grid') {
    return findPresetDefinitionByTemplateOrLegacyId(block, getCardGridPresetDefinitions())
      || resolveCardGridPresetDefinition(block);
  }
  if (kind === 'cta_band') {
    return findPresetDefinitionByTemplateOrLegacyId(block, getCtaBandPresetDefinitions())
      || resolveCtaBandPresetDefinition(block);
  }
  if (kind === 'columns') {
    return findPresetDefinitionByTemplateOrLegacyId(block, getColumnsPresetDefinitions())
      || resolveColumnsPresetDefinition(block);
  }
  return null;
}

export function normalizePresetBearingBlockIdentity(block) {
  if (!block || typeof block !== 'object') {
    return block;
  }

  const presetDefinition = resolvePresetDefinition(block);
  const canonicalPresetId = String(presetDefinition?.id || '').trim();
  if (!canonicalPresetId) {
    return block;
  }

  return String(block.presetId || '').trim() === canonicalPresetId
    ? block
    : {
        ...block,
        presetId: canonicalPresetId,
      };
}

export function normalizePresetBearingBlocks(blocks) {
  const source = Array.isArray(blocks) ? blocks : [];
  let changed = false;

  const normalized = source.map((block) => {
    const nextBlock = normalizePresetBearingBlockIdentity(block);
    if (nextBlock !== block) {
      changed = true;
    }
    return nextBlock;
  });

  return changed ? normalized : source;
}
