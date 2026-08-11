import {
  normalizeFollowUpSubmitLabel,
} from '../blocks/foundation/forms';

const HOME_MINISTRY_ALLIES_BLOCK_ID = 'home_ministry_allies';
const HOME_DO_THE_MATH_BLOCK_ID = 'home_do_the_math';

export function isManagedBlockVisible(block) {
  return block?.hidden !== true && block?.hidden !== 'true';
}

function getHomeBlockRenderKey(block) {
  return String(block?.id || block?.type || block?.kind || '').trim();
}

function reorderHomeTopBlocks(blocks = []) {
  if (!Array.isArray(blocks) || !blocks.length) {
    return [];
  }

  const priorityOrder = ['top_strip', 'impact_stat', 'home_impact_story', 'home_services_feature_animation', 'hero'];
  const priorityIndexByKey = new Map(priorityOrder.map((key, index) => [key, index]));
  const prioritized = new Array(priorityOrder.length).fill(null);
  const remainder = [];

  blocks.forEach((block) => {
    const blockKey = getHomeBlockRenderKey(block);
    const priorityIndex = priorityIndexByKey.get(blockKey);
    if (priorityIndex === undefined) {
      remainder.push(block);
      return;
    }
    prioritized[priorityIndex] = block;
  });

  return prioritized.filter(Boolean).concat(remainder);
}

function hasRenderableHomeColumnsLayout(block) {
  const columnsStyle = String(block?.columnsStyle || '').trim().toLowerCase() || 'retirement';
  const columns = Array.isArray(block?.columnsData) && block.columnsData.length
    ? block.columnsData
    : Array.from({ length: 4 }, (_, index) => {
        const slot = index + 1;
        const enabledValue = block?.[`col${slot}Enabled`];
        const isEnabled = enabledValue === undefined ? slot <= 2 : Boolean(enabledValue);
        if (!isEnabled) {
          return null;
        }
        return {
          type: block?.[`col${slot}Type`] || (slot === 1 ? 'photo' : 'text'),
          imageUrl: block?.[`col${slot}ImageUrl`],
          title: block?.[`col${slot}Title`],
          body: block?.[`col${slot}Body`],
          buttonLabel: block?.[`col${slot}ButtonLabel`],
        };
      }).filter(Boolean);

  if (columnsStyle === 'legacy-highlight') {
    return columns.some((column) => String(column?.title || '').trim());
  }

  if (columnsStyle === 'loans-value') {
    return columns.some((column) => [
      column?.title,
      column?.body,
      column?.buttonLabel,
      String(column?.type || '').trim().toLowerCase() === 'photo' ? column?.imageUrl : '',
    ].some((entry) => String(entry || '').trim()));
  }

  const hasPhotoColumn = columns.some((column) => (
    String(column?.type || '').trim().toLowerCase() === 'photo'
    && String(column?.imageUrl || '').trim()
  ));
  const hasTextColumn = columns.some((column) => (
    String(column?.type || '').trim().toLowerCase() !== 'photo'
    && [column?.title, column?.body, column?.buttonLabel].some((entry) => String(entry || '').trim())
  ));

  return hasPhotoColumn && hasTextColumn;
}

function resolveHomeColumnsMathBlock(managedBlock) {
  const activeManagedBlock = String(managedBlock?.mode || '').trim().toLowerCase() === 'dynamic'
    ? managedBlock
    : null;
  if (!activeManagedBlock) {
    return null;
  }
  const settings = activeManagedBlock.settings && typeof activeManagedBlock.settings === 'object'
    ? activeManagedBlock.settings
    : {};

  return {
    ...activeManagedBlock,
    id: String(activeManagedBlock.id || HOME_DO_THE_MATH_BLOCK_ID).trim() || HOME_DO_THE_MATH_BLOCK_ID,
    type: 'billboard',
    kind: 'billboard',
    mode: 'dynamic',
    settings,
    hidden: activeManagedBlock?.hidden,
  };
}

function resolveHomeColumnsMhaBlock(managedBlock) {
  const activeManagedBlock = String(managedBlock?.mode || '').trim().toLowerCase() === 'dynamic'
    ? managedBlock
    : null;
  if (!activeManagedBlock) {
    return null;
  }
  const settings = activeManagedBlock.settings && typeof activeManagedBlock.settings === 'object'
    ? activeManagedBlock.settings
    : {};

  return {
    ...activeManagedBlock,
    id: String(activeManagedBlock.id || HOME_MINISTRY_ALLIES_BLOCK_ID).trim() || HOME_MINISTRY_ALLIES_BLOCK_ID,
    type: 'billboard',
    kind: 'billboard',
    mode: 'dynamic',
    settings,
    hidden: activeManagedBlock?.hidden,
  };
}

function resolveHomeBlock(block, context) {
  const blockId = String(block?.id || '').trim();
  const managedBlock = blockId ? (context.managedBlocksById.get(blockId) || null) : null;
  if (String(managedBlock?.mode || '').trim().toLowerCase() !== 'dynamic') {
    return null;
  }

  if (block.type === 'site_feature' && block.id === 'home_services_feature_animation') {
    return {
      ...block,
      id: context.managedHomeServicesFeatureBlock?.id || block.id || 'home_services_feature_animation',
      kind: context.managedHomeServicesFeatureBlock?.kind || block.kind || 'site_feature',
      mode: context.homeServicesFeatureIsActive ? 'dynamic' : (context.managedHomeServicesFeatureBlock?.mode || block.mode || 'dynamic'),
      settings: context.homeServicesFeatureSettings
        ? {
            featureId: String(context.homeServicesFeatureSettings.featureId || block.featureId || 'home_services_feature_animation').trim() || 'home_services_feature_animation',
            headline: String(context.homeServicesFeatureSettings.headline ?? block.headline ?? '').trim(),
          }
        : undefined,
    };
  }

  if (block.type === 'newsletter' && context.newsletterSettings) {
    const settings = context.newsletterSettings;
    return {
      ...block,
      id: context.newsletterManagedBlock?.id || block.id || 'newsletter',
      kind: context.newsletterManagedBlock?.kind || block.kind || 'newsletter',
      mode: context.newsletterManagedBlock?.mode || block.mode || 'dynamic',
      ...settings,
      title: String(settings.title ?? '').trim(),
      titleClassName: String(settings.titleClassName ?? '').trim(),
      titleHighlightsJson: String(settings.titleHighlightsJson ?? '').trim(),
      bodyHtml: String(settings.bodyHtml ?? '').trim(),
      body: String(settings.body ?? '').trim(),
      bgTone: String(settings.bgTone ?? '').trim(),
      textTone: String(settings.textTone ?? '').trim(),
      formId: String(settings.formId ?? context.defaultNewsletterFormId ?? '').trim(),
      accountId: String(settings.accountId ?? '').trim(),
      sourceId: String(settings.sourceId ?? '').trim(),
    };
  }

  if (block.type === 'top_strip' && context.topStripSettings) {
    return {
      ...block,
      id: context.topStripManagedBlock?.id || block.id || 'top_strip',
      kind: context.topStripManagedBlock?.kind || block.kind || 'top_strip',
      mode: context.topStripManagedBlock?.mode || block.mode || 'dynamic',
      ...context.topStripSettings,
      __hudAnchorId: 'home-top-strip',
      ratesButtonTone: String(context.topStripSettings.ratesButtonTone || '').trim() || 'mango',
    };
  }

  if (block.type === 'services_grid' && context.servicesGridSettings) {
    if (context.homeServicesFeatureIsActive) {
      return null;
    }
    return {
      ...block,
      id: context.servicesGridManagedBlock?.id || block.id || 'services_grid',
      kind: context.servicesGridManagedBlock?.kind || block.kind || 'services_grid',
      mode: context.servicesGridManagedBlock?.mode || block.mode || 'dynamic',
      settings: context.servicesGridSettings,
    };
  }

  if (block.type === 'services_grid' && context.homeServicesFeatureIsActive) {
    return null;
  }

  if (block.type === 'impact_stat' && context.impactStatSettings) {
    return {
      ...block,
      id: context.impactStatManagedBlock?.id || block.id || 'impact_stat',
      kind: context.impactStatManagedBlock?.kind || block.kind || 'impact_stat',
      mode: context.impactStatManagedBlock?.mode || block.mode || 'dynamic',
      settings: context.impactStatSettings,
    };
  }

  if (block.type === 'site_feature' && block.id === 'home_impact_story') {
    return {
      ...block,
      id: context.homeImpactStoryManagedBlock?.id || block.id || 'home_impact_story',
      kind: context.homeImpactStoryManagedBlock?.kind || block.kind || 'site_feature',
      mode: context.homeImpactStoryManagedBlock?.mode || block.mode || 'dynamic',
      settings: context.homeImpactStorySettings
        ? {
            featureId: String(context.homeImpactStorySettings.featureId || block.featureId || 'home_impact_story').trim() || 'home_impact_story',
            headline: String(context.homeImpactStorySettings.headline ?? block.headline ?? '').trim(),
            body: String(context.homeImpactStorySettings.body ?? block.body ?? '').trim(),
            buttonLabel: String(context.homeImpactStorySettings.buttonLabel ?? block.buttonLabel ?? '').trim(),
            buttonLinkJson: String(context.homeImpactStorySettings.buttonLinkJson ?? block.buttonLinkJson ?? '').trim(),
          }
        : undefined,
    };
  }

  if (block.type === 'cta_form' && context.ctaSettings) {
    const readCtaSetting = (...keys) => {
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (Object.prototype.hasOwnProperty.call(context.ctaSettings, key)) {
          return context.ctaSettings[key];
        }
      }
      return undefined;
    };
    const resolvedCtaBlock = {
      ...block,
      id: context.ctaManagedBlock?.id || block.id || 'cta_form',
      kind: context.ctaManagedBlock?.kind || block.kind || 'cta_form',
      mode: context.ctaManagedBlock?.mode || block.mode || 'dynamic',
      title: String(readCtaSetting('title') ?? '').trim(),
      titleClassName: String(readCtaSetting('titleClassName') ?? '').trim(),
      titleHighlightsJson: String(readCtaSetting('titleHighlightsJson') ?? '').trim(),
      subtitle: String(readCtaSetting('subtitle') ?? '').trim(),
      bodyHtml: String(readCtaSetting('bodyHtml') ?? '').trim(),
      bgTone: String(readCtaSetting('bgTone') ?? '').trim(),
      submitStyle: String(
        readCtaSetting('submitStyle') ?? ''
      ).trim().toLowerCase(),
      submitTone: String(readCtaSetting('submitTone') ?? '').trim().toLowerCase(),
      submitLabel: normalizeFollowUpSubmitLabel(
        readCtaSetting('submitLabel', 'buttonLabel') ?? '',
      ),
      salesforceUrl: String(readCtaSetting('salesforceUrl') ?? '').trim(),
      successMessage: String(readCtaSetting('successMessage') ?? '').trim(),
      fieldsJson: String(readCtaSetting('fieldsJson') ?? '').trim(),
    };
    return resolvedCtaBlock;
  }

  if (block.type === 'hero') {
    return {
      ...block,
      ...(context.heroSettings || {}),
      id: 'hero',
      kind: 'hero',
      mode: context.heroManagedBlock?.mode || block.mode || 'dynamic',
    };
  }

  if (blockId === HOME_MINISTRY_ALLIES_BLOCK_ID) {
    return resolveHomeColumnsMhaBlock(managedBlock);
  }

  if (blockId === HOME_DO_THE_MATH_BLOCK_ID) {
    return resolveHomeColumnsMathBlock(managedBlock);
  }

  return block;
}

export function buildResolvedHomeBlocks(context = {}) {
  const managedBlocks = Array.isArray(context.managedBlocks) ? context.managedBlocks : [];
  const managedBlocksById = context.managedBlocksById instanceof Map
    ? context.managedBlocksById
    : new Map(managedBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const resolvedBlocks = managedBlocks
    .filter((block) => String(block?.mode || '').trim().toLowerCase() === 'dynamic')
    .filter((block) => !(String(block?.kind || '').trim() === 'services_grid' && context.homeServicesFeatureIsActive))
    .map((block) => {
      const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
      return resolveHomeBlock(
        { ...block, type: String(block?.kind || block?.type || '').trim(), ...settings, settings },
        { ...context, managedBlocksById },
      );
    })
    .filter(Boolean);

  return reorderHomeTopBlocks(resolvedBlocks);
}

export function summarizeHomeColumnsBlock(block) {
  if (!block) {
    return null;
  }
  const kind = String(block.kind || '').trim();
  if (kind && kind !== 'columns') {
    return {
      id: String(block.id || '').trim(),
      mode: String(block.mode || '').trim(),
      hidden: block.hidden,
      kind,
      hasRenderableLayout: true,
    };
  }
  const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
  return {
    id: String(block.id || '').trim(),
    mode: String(block.mode || '').trim(),
    hidden: block.hidden,
    kind,
    col1Type: String(settings.col1Type || '').trim(),
    col1Title: String(settings.col1Title || '').trim(),
    col1ImageUrl: String(settings.col1ImageUrl || '').trim(),
    col2Type: String(settings.col2Type || '').trim(),
    col2Title: String(settings.col2Title || '').trim(),
    col2ImageUrl: String(settings.col2ImageUrl || '').trim(),
    hasRenderableLayout: hasRenderableHomeColumnsLayout(settings),
  };
}
