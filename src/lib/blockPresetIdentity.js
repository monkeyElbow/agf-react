import {
  getBillboardPresetDefinitions,
  resolveBillboardPresetDefinition,
} from './billboardPresets';
import {
  getCardGridPresetDefinitions,
  resolveCardGridPresetDefinition,
} from './cardGridPresets';
import {
  getColumnsPresetDefinitions,
  resolveColumnsPresetDefinition,
} from './columnsPresets';

const CANONICAL_TEMPLATE_ID_BY_KIND = Object.freeze({
  card_grid: 'card_grid',
  billboard: 'billboard',
  columns: 'columns',
});

function findPresetDefinition(block, definitions) {
  const explicitPresetId = String(block?.presetId || '').trim().toLowerCase();
  const hasLegacyGivingJoyClass = String(block?.settings?.sectionClassName || '')
    .split(/\s+/)
    .includes('legacy-giving-joy');
  if (explicitPresetId) {
    const byExplicitPresetId = definitions.find((preset) => String(preset?.id || '').trim().toLowerCase() === explicitPresetId) || null;
    if (byExplicitPresetId && !(explicitPresetId === 'default' && hasLegacyGivingJoyClass)) {
      return byExplicitPresetId;
    }
  }

  if (hasLegacyGivingJoyClass) {
    const plannedGivingJoyPreset = definitions.find((preset) => String(preset?.id || '').trim().toLowerCase() === 'planned-giving-joy');
    if (plannedGivingJoyPreset) {
      return plannedGivingJoyPreset;
    }
  }

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

  if (explicitPresetId === 'default') {
    return definitions.find((preset) => String(preset?.id || '').trim().toLowerCase() === 'default') || null;
  }

  return null;
}

function resolvePresetDefinition(block) {
  const kind = String(block?.kind || '').trim().toLowerCase();
  if (kind === 'card_grid') {
    return findPresetDefinition(block, getCardGridPresetDefinitions())
      || resolveCardGridPresetDefinition(block);
  }
  if (kind === 'billboard') {
    return findPresetDefinition(block, getBillboardPresetDefinitions())
      || resolveBillboardPresetDefinition(block);
  }
  if (kind === 'columns') {
    return findPresetDefinition(block, getColumnsPresetDefinitions())
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

  const kind = String(block?.kind || '').trim().toLowerCase();
  const canonicalTemplateId = CANONICAL_TEMPLATE_ID_BY_KIND[kind] || '';
  const currentTemplateId = String(block?.templateId || '').trim();
  const nextTemplateId = canonicalTemplateId || currentTemplateId;

  return String(block.presetId || '').trim() === canonicalPresetId
    && currentTemplateId === nextTemplateId
    ? block
    : {
        ...block,
        presetId: canonicalPresetId,
        ...(nextTemplateId ? { templateId: nextTemplateId } : {}),
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
