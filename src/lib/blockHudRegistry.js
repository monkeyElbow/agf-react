import billboardHudIcon from '../assets/admin-block-icons/billboard.svg';
import columnsHudIcon from '../assets/admin-block-icons/columns.svg';
import pageContentHudIcon from '../assets/admin-block-icons/page-content.svg';
import { getBlockDefinition, isSingletonBlockKind, resolveBlockPresetDefinition } from '../blocks/registry';
import { resolveSiteFeatureCatalogEntry } from '../data/siteFeatureCatalog';
import { getVisibleDynamicBlocks } from './pageBlockRuntime';

const HUD_ID_OVERRIDES = {
  value_cards: {
    label: 'Value Cards',
    icon: columnsHudIcon,
    editorType: 'columns',
  },
  vision_fuel: {
    label: 'Billboard',
    icon: billboardHudIcon,
    editorType: 'billboard',
  },
  columns_mha: {
    label: 'Housing',
    icon: columnsHudIcon,
    editorType: 'columns',
  },
  columns_math: {
    label: 'Do the Math',
    icon: columnsHudIcon,
    editorType: 'columns',
  },
};

function humanizeToken(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getBlockHudDefinition(block) {
  const blockId = String(block?.id || '').trim();
  const blockKind = String(block?.kind || '').trim();
  const canonicalDefinition = getBlockDefinition(blockKind);
  const presetDefinition = resolveBlockPresetDefinition(block);
  const override = HUD_ID_OVERRIDES[blockId] || null;
  const kindDefinition = canonicalDefinition
    ? {
      label: canonicalDefinition.label,
      icon: canonicalDefinition.icon,
      editorType: canonicalDefinition.editorType,
    }
    : null;
  const presetLabel = String(presetDefinition?.label || '').trim();
  const siteFeatureLabel = blockKind === 'site_feature'
    ? String(resolveSiteFeatureCatalogEntry(block?.settings?.featureId || block?.featureId)?.label || '').trim()
    : '';
  const label = override?.label
    || (kindDefinition?.label && presetLabel ? `${kindDefinition.label} · ${presetLabel}` : '')
    || (kindDefinition?.label && siteFeatureLabel ? `${kindDefinition.label} · ${siteFeatureLabel}` : '')
    || kindDefinition?.label
    || humanizeToken(block?.label || block?.name || blockId || blockKind || 'content');

  return {
    label,
    icon: override?.icon || kindDefinition?.icon || pageContentHudIcon,
    editorType: override?.editorType || kindDefinition?.editorType || 'fields',
  };
}

export function buildHudPanelsFromBlocks(
  blocks,
  {
    anchorSelectorById = {},
    anchorSelectorByKind = {},
    panelIdById = {},
    panelIdByKind = {},
  } = {},
) {
  const seenBlockIds = new Set();
  const seenPanelIds = new Set();

  return getVisibleDynamicBlocks(blocks).reduce((panels, block) => {
    const blockId = String(block?.id || '').trim();
    const blockKind = String(block?.kind || '').trim();
    const definition = getBlockHudDefinition(block);
    const usesSingletonPanelId = isSingletonBlockKind(blockKind) && Boolean(panelIdByKind[blockKind]);
    const panelId = panelIdById[blockId] || (usesSingletonPanelId ? panelIdByKind[blockKind] : '') || `block:${blockId}`;
    const anchorSelector = anchorSelectorById[blockId]
      || (isSingletonBlockKind(blockKind) ? (anchorSelectorByKind[blockKind] || '') : '')
      || '';

    if (!blockId || seenBlockIds.has(blockId) || seenPanelIds.has(panelId)) {
      return panels;
    }

    seenBlockIds.add(blockId);
    seenPanelIds.add(panelId);

    panels.push({
      id: panelId,
      block,
      blockId,
      blockKind,
      label: definition.label,
      icon: definition.icon,
      editorType: definition.editorType,
      anchorSelector,
    });

    return panels;
  }, []);
}
