import billboardHudIcon from '../assets/admin-block-icons/billboard.svg';
import columnsHudIcon from '../assets/admin-block-icons/columns.svg';
import pageContentHudIcon from '../assets/admin-block-icons/page-content.svg';
import { getBlockDefinition, isSingletonBlockKind, resolveBlockPresetDefinition } from '../blocks/registry';
import { resolveSiteFeatureCatalogEntry } from '../data/siteFeatureCatalog';
import { getVisibleDynamicBlocks } from './pageBlockRuntime';
import { formatBlockDisplayName } from './blockDisplayName';

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
  home_ministry_allies: {
    label: 'Housing',
  },
  columns_math: {
    label: 'Do the Math',
  },
  home_do_the_math: {
    label: 'Do the Math',
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
  const baseLabel = override?.label
    || (kindDefinition?.label && presetLabel && kindDefinition.label !== presetLabel
      ? `${kindDefinition.label} · ${presetLabel}`
      : '')
    || (kindDefinition?.label && siteFeatureLabel ? `${kindDefinition.label} · ${siteFeatureLabel}` : '')
    || kindDefinition?.label
    || humanizeToken(block?.label || block?.name || blockId || blockKind || 'content');
  const label = formatBlockDisplayName(baseLabel, block);

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
    includeHidden = false,
  } = {},
) {
  const seenBlockIds = new Set();
  const seenPanelIds = new Set();
  const sourceBlocks = includeHidden
    ? (Array.isArray(blocks) ? blocks : []).filter((block) => (
      String(block?.mode || '').trim().toLowerCase() === 'dynamic'
    ))
    : getVisibleDynamicBlocks(blocks);

  return sourceBlocks.reduce((panels, block) => {
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
      isHidden: block?.hidden === true || String(block?.hidden || '').trim().toLowerCase() === 'true',
    });

    return panels;
  }, []);
}
