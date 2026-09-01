import billboardHudIcon from '../assets/admin-block-icons/billboard.svg';
import columnsHudIcon from '../assets/admin-block-icons/columns.svg';
import pageContentHudIcon from '../assets/admin-block-icons/page-content.svg';
import { getBlockDefinition, isSingletonBlockKind, resolveBlockPresetDefinition } from '../blocks/registry';
import { resolveSiteFeatureCatalogEntry } from '../data/siteFeatureCatalog';
import { getVisibleDynamicBlocks } from './pageBlockRuntime';
import { formatBlockDisplayName } from './blockDisplayName';

const HUD_ID_OVERRIDES = {
  jobs: {
    label: 'Career Open Positions',
  },
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
  retirement_plan_feature: {
    label: 'Smart benefits, strong advantages',
  },
};

function humanizeToken(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeHudTitle(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveSiteFeatureTitle(block, featureEntry, fallbackTitle = '') {
  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : {};
  const allowedFieldIds = new Set(
    Array.isArray(featureEntry?.allowedEditableFieldIds) ? featureEntry.allowedEditableFieldIds : [],
  );
  const headlineOverride = allowedFieldIds.has('headline')
    ? normalizeHudTitle(settings.headline)
    : '';
  if (headlineOverride) {
    return headlineOverride;
  }

  const runtime = typeof featureEntry?.buildRuntime === 'function'
    ? featureEntry.buildRuntime({ settings }) || {}
    : {};
  return normalizeHudTitle(runtime.title)
    || normalizeHudTitle(fallbackTitle)
    || normalizeHudTitle(featureEntry?.label);
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
  const siteFeatureEntry = blockKind === 'site_feature'
    ? resolveSiteFeatureCatalogEntry(block?.settings?.featureId || block?.featureId)
    : null;
  const siteFeatureTitle = blockKind === 'site_feature'
    ? resolveSiteFeatureTitle(block, siteFeatureEntry, override?.label)
    : '';
  const ratesDisplayName = blockKind === 'rates'
    ? normalizeHudTitle(block?.settings?.displayName)
    : '';
  const baseLabel = blockKind === 'rates' && ratesDisplayName
    ? `Rates - ${ratesDisplayName}`
    : blockKind === 'site_feature'
    ? `Feature${siteFeatureTitle ? ` - ${siteFeatureTitle}` : ''}`
    : override?.label
    || (kindDefinition?.label && presetLabel && kindDefinition.label !== presetLabel
      ? `${kindDefinition.label} · ${presetLabel}`
      : '')
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
    const explicitPanelId = String(block?.settings?.panelId || '').trim();
    const panelId = panelIdById[blockId]
      || explicitPanelId
      || (usesSingletonPanelId ? panelIdByKind[blockKind] : '')
      || `block:${blockId}`;
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
