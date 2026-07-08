const DEFAULT_FOLLOW_UP_SUBMIT_LABEL = 'Follow up with me';
const LEGACY_FOLLOW_UP_SUBMIT_LABEL = 'Follow-up with me';
const HOME_MINISTRY_ALLIES_BLOCK_ID = 'home_ministry_allies';
const HOME_DO_THE_MATH_BLOCK_ID = 'home_do_the_math';
const HOME_BILLBOARD_FALLBACK_FIELDS = Object.freeze([
  'title',
  'titleClassName',
  'titleHighlightsJson',
  'subtitle',
  'bodyHtml',
  'body',
  'bgTone',
  'textTone',
  'justify',
  'lineSpacing',
  'titleFontFamily',
  'titleFontWeight',
  'titleSizeRem',
  'titleLetterSpacingEm',
  'contentMaxWidthPx',
  'buttonLabel',
  'buttonUrl',
  'buttonPageRef',
  'buttonStyle',
  'buttonTone',
  'buttonOpenInNewWindow',
  'scrollReveal',
]);
const HOME_COLUMNS_MATH_BILLBOARD_DEFAULTS = Object.freeze({
  title: '(let us) Do the math.',
  titleClassName: '',
  titleHighlightsJson: '[{"text":"(let us)","className":"is-atlantean"}]',
  subtitle: '',
  bodyHtml: '',
  body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
  bgTone: 'white',
  textTone: 'dark',
  justify: 'center',
  lineSpacing: 0.94,
  titleFontFamily: 'helv',
  titleFontWeight: 700,
  titleSizeRem: 6.15,
  titleLetterSpacingEm: -0.03,
  contentMaxWidthPx: 1216,
  buttonLabel: 'Use the calculators',
  buttonUrl: '/calculators',
  buttonPageRef: '',
  buttonStyle: 'blue',
  buttonTone: 'atlantean',
  buttonOpenInNewWindow: false,
  scrollReveal: 'scale-up',
});
const HOME_EXTRA_RENDERABLE_DYNAMIC_KINDS = new Set(['site_feature']);

function toBooleanSetting(value, fallback = true) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const token = value.trim().toLowerCase();
    if (token === 'true') {
      return true;
    }
    if (token === 'false') {
      return false;
    }
  }
  if (value == null) {
    return fallback;
  }
  return Boolean(value);
}

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

  const priorityOrder = ['top_strip', 'home_impact_story', 'home_services_feature_animation', 'hero'];
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

function hasReadableHtmlContent(value) {
  const html = String(value || '').trim();
  if (!html) {
    return false;
  }
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Boolean(text);
}

function normalizeFollowUpSubmitLabel(value) {
  const label = String(value || '').trim();
  if (!label) {
    return DEFAULT_FOLLOW_UP_SUBMIT_LABEL;
  }
  return label === LEGACY_FOLLOW_UP_SUBMIT_LABEL ? DEFAULT_FOLLOW_UP_SUBMIT_LABEL : label;
}

function hasRenderableHomeColumnsLayout(block) {
  const columnsStyle = String(block?.columnsStyle || '').trim().toLowerCase() || 'retirement';
  const columns = Array.isArray(block?.columnsData) && block.columnsData.length
    ? block.columnsData
    : Array.from({ length: 4 }, (_, index) => {
        const slot = index + 1;
        const enabledValue = block?.[`col${slot}Enabled`];
        const isEnabled = enabledValue === undefined ? slot <= 2 : toBooleanSetting(enabledValue);
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

function mergeHomeColumnsWithFallback(baseBlock, dynamicSettings) {
  const settings = dynamicSettings && typeof dynamicSettings === 'object' ? dynamicSettings : {};
  const merged = { ...baseBlock, ...settings };
  const columnsData = Array.isArray(merged.columnsData) ? merged.columnsData : null;
  if (columnsData) {
    const hasMeaningfulColumnsData = columnsData.some((column) => {
      if (!column || typeof column !== 'object') {
        return false;
      }
      return [
        column.title,
        column.body,
        column.imageUrl,
        column.imageAlt,
        column.buttonLabel,
        column.buttonUrl,
      ].some((entry) => String(entry || '').trim());
    });
    if (!hasMeaningfulColumnsData) {
      delete merged.columnsData;
    }
  }

  [
    'bgTone',
    'columns',
    'contentWidth',
    'col1Type',
    'col1ImageUrl',
    'col1ImageAlt',
    'col1Title',
    'col1TitleClassName',
    'col1TitleHighlightsJson',
    'col1Body',
    'col1ButtonLabel',
    'col1ButtonUrl',
    'col2Type',
    'col2ImageUrl',
    'col2ImageAlt',
    'col2Title',
    'col2TitleClassName',
    'col2TitleHighlightsJson',
    'col2Body',
    'col2ButtonLabel',
    'col2ButtonUrl',
  ].forEach((field) => {
    const current = merged[field];
    if (current == null) {
      merged[field] = baseBlock[field];
      return;
    }
    if (typeof current === 'string' && !current.trim()) {
      merged[field] = baseBlock[field];
    }
  });

  if (!hasRenderableHomeColumnsLayout(merged)) {
    return { ...baseBlock };
  }

  return merged;
}

function mergeHomeBillboardSettingsWithFallback(baseSettings, nextSettings) {
  const settings = nextSettings && typeof nextSettings === 'object' ? nextSettings : {};
  const merged = { ...(baseSettings || {}), ...settings };

  HOME_BILLBOARD_FALLBACK_FIELDS.forEach((field) => {
    const current = merged[field];
    if (current == null) {
      merged[field] = baseSettings?.[field];
      return;
    }
    if (typeof current === 'string' && !current.trim()) {
      merged[field] = baseSettings?.[field];
    }
  });

  return merged;
}

function resolveHomeColumnsMathBlock(staticBlock, managedBlock) {
  const activeManagedBlock = String(managedBlock?.mode || '').trim().toLowerCase() === 'dynamic'
    ? managedBlock
    : null;
  const managedSettings = activeManagedBlock?.settings && typeof activeManagedBlock.settings === 'object'
    ? activeManagedBlock.settings
    : null;
  const baseSettings = mergeHomeBillboardSettingsWithFallback(
    HOME_COLUMNS_MATH_BILLBOARD_DEFAULTS,
    staticBlock?.settings && typeof staticBlock.settings === 'object' ? staticBlock.settings : {},
  );
  const settings = managedSettings
    ? mergeHomeBillboardSettingsWithFallback(baseSettings, managedSettings)
    : baseSettings;

  return {
    id: String(staticBlock?.id || HOME_DO_THE_MATH_BLOCK_ID).trim() || HOME_DO_THE_MATH_BLOCK_ID,
    kind: 'billboard',
    mode: 'dynamic',
    settings,
    hidden: activeManagedBlock?.hidden,
  };
}

function resolveHomeColumnsMhaBlock(staticBlock, managedBlock) {
  const activeManagedBlock = String(managedBlock?.mode || '').trim().toLowerCase() === 'dynamic'
    ? managedBlock
    : null;
  const baseSettings = staticBlock?.settings && typeof staticBlock.settings === 'object'
    ? staticBlock.settings
    : {};
  const managedSettings = activeManagedBlock?.settings && typeof activeManagedBlock.settings === 'object'
    ? activeManagedBlock.settings
    : null;
  const managedKind = String(activeManagedBlock?.kind || '').trim().toLowerCase();
  const settings = managedKind === 'billboard' && managedSettings
    ? mergeHomeBillboardSettingsWithFallback(baseSettings, managedSettings)
    : baseSettings;

  return {
    ...staticBlock,
    id: String(activeManagedBlock?.id || staticBlock?.id || HOME_MINISTRY_ALLIES_BLOCK_ID).trim() || HOME_MINISTRY_ALLIES_BLOCK_ID,
    kind: 'billboard',
    mode: 'dynamic',
    settings,
    hidden: activeManagedBlock?.hidden,
  };
}

function resolveHomeBlock(block, context) {
  const blockId = String(block?.id || '').trim();
  const managedBlock = blockId ? (context.managedBlocksById.get(blockId) || null) : null;

  if (block.type === 'site_feature' && block.id === 'home_services_feature_animation') {
    return {
      ...block,
      id: context.managedHomeServicesFeatureBlock?.id || block.id || 'home_services_feature_animation',
      kind: context.managedHomeServicesFeatureBlock?.kind || block.kind || 'site_feature',
      mode: context.homeServicesFeatureIsActive ? 'dynamic' : (context.managedHomeServicesFeatureBlock?.mode || block.mode || 'static'),
      settings: context.homeServicesFeatureSettings
        ? {
            featureId: String(context.homeServicesFeatureSettings.featureId || block.featureId || 'home_services_feature_animation').trim() || 'home_services_feature_animation',
            headline: String(context.homeServicesFeatureSettings.headline ?? block.headline ?? '').trim(),
          }
        : {
            featureId: String(block.featureId || 'home_services_feature_animation').trim() || 'home_services_feature_animation',
            headline: String(block.headline || '').trim(),
          },
    };
  }

  if (block.type === 'newsletter' && context.newsletterSettings) {
    const fallbackTitle = String(
      block.title || [block.headingPrefix, block.headingHighlight].filter(Boolean).join(' '),
    ).trim();
    const fallbackBodyHtml = hasReadableHtmlContent(block.bodyHtml)
      ? String(block.bodyHtml || '').trim()
      : (block.body ? `<p>${block.body}</p>` : '');
    const nextTitle = String(context.newsletterSettings.title || '').trim() || fallbackTitle;
    const nextBodyText = String(context.newsletterSettings.body || block.body || '').trim();
    const rawBodyHtml = String(context.newsletterSettings.bodyHtml || '').trim();
    const nextBodyHtml = hasReadableHtmlContent(rawBodyHtml)
      ? rawBodyHtml
      : (nextBodyText ? `<p>${nextBodyText}</p>` : fallbackBodyHtml);
    return {
      ...block,
      id: context.newsletterManagedBlock?.id || block.id || 'newsletter',
      kind: context.newsletterManagedBlock?.kind || block.kind || 'newsletter',
      mode: context.newsletterManagedBlock?.mode || block.mode || 'static',
      title: nextTitle,
      titleClassName: String(context.newsletterSettings.titleClassName || block.titleClassName || '').trim(),
      titleHighlightsJson: String(context.newsletterSettings.titleHighlightsJson || block.titleHighlightsJson || '').trim(),
      bodyHtml: nextBodyHtml,
      body: nextBodyText || String(block.body || '').trim(),
      bgTone: String(context.newsletterSettings.bgTone || block.bgTone || 'grey').trim() || 'grey',
      textTone: String(context.newsletterSettings.textTone || block.textTone || 'white').trim() || 'white',
      formId: String(context.newsletterSettings.formId || block.formId || context.defaultNewsletterFormId).trim() || context.defaultNewsletterFormId,
      accountId: String(context.newsletterSettings.accountId || block.accountId || '').trim(),
      sourceId: String(context.newsletterSettings.sourceId || block.sourceId || '').trim(),
    };
  }

  if (block.type === 'top_strip' && context.topStripSettings) {
    return {
      ...block,
      id: context.topStripManagedBlock?.id || block.id || 'top_strip',
      kind: context.topStripManagedBlock?.kind || block.kind || 'top_strip',
      mode: context.topStripManagedBlock?.mode || block.mode || 'static',
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
      mode: context.servicesGridManagedBlock?.mode || block.mode || 'static',
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
      mode: context.impactStatManagedBlock?.mode || block.mode || 'static',
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
            buttonUrl: String(context.homeImpactStorySettings.buttonUrl ?? block.buttonUrl ?? '').trim(),
            buttonPageRef: String(context.homeImpactStorySettings.buttonPageRef ?? block.buttonPageRef ?? '').trim(),
            buttonOpenInNewWindow: Boolean(context.homeImpactStorySettings.buttonOpenInNewWindow ?? false),
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
    const fallbackLegacyTitle = [
      String(block.headingPrefix || '').trim(),
      String(block.headingHighlight || '').trim(),
      String(block.headingSuffix || '').trim(),
    ].filter(Boolean).join(' ').trim();
    const fallbackLegacyHighlight = String(block.headingHighlight || '').trim();
    const fallbackLegacyHighlightsJson = fallbackLegacyHighlight
      ? JSON.stringify([{ text: fallbackLegacyHighlight, className: 'is-atlantean' }])
      : '';
    const noteText = String(context.ctaSettings.note || block.note || '').trim();
    const fallbackBodyHtml = noteText ? `<p>${noteText}</p>` : '';

    return {
      ...block,
      id: context.ctaManagedBlock?.id || block.id || 'cta_form',
      kind: context.ctaManagedBlock?.kind || block.kind || 'cta_form',
      mode: context.ctaManagedBlock?.mode || block.mode || 'static',
      title: String(readCtaSetting('title') ?? block.title ?? fallbackLegacyTitle).trim(),
      titleClassName: String(readCtaSetting('titleClassName') ?? block.titleClassName ?? '').trim(),
      titleHighlightsJson: String(readCtaSetting('titleHighlightsJson') ?? block.titleHighlightsJson ?? fallbackLegacyHighlightsJson).trim(),
      subtitle: String(readCtaSetting('subtitle') ?? block.subtitle ?? '').trim(),
      bodyHtml: String(readCtaSetting('bodyHtml') ?? block.bodyHtml ?? fallbackBodyHtml).trim(),
      bgTone: 'white',
      submitStyle: String(
        readCtaSetting('submitStyle')
        || block.submitStyle
        || 'blue'
      ).trim().toLowerCase() || 'blue',
      submitTone: String(readCtaSetting('submitTone') ?? block.submitTone ?? '').trim().toLowerCase(),
      submitLabel: normalizeFollowUpSubmitLabel(
        readCtaSetting('submitLabel', 'buttonLabel')
        || block.submitLabel
        || block.buttonLabel
        || DEFAULT_FOLLOW_UP_SUBMIT_LABEL,
      ),
      salesforceUrl: String(readCtaSetting('salesforceUrl') ?? block.salesforceUrl ?? '').trim(),
      successMessage: String(readCtaSetting('successMessage') ?? block.successMessage ?? '').trim() || block.successMessage,
      field1Enabled: context.ctaSettings.field1Enabled ?? block.field1Enabled,
      field1Type: String(readCtaSetting('field1Type') ?? block.field1Type ?? '').trim() || block.field1Type,
      field1Label: String(readCtaSetting('field1Label') ?? block.field1Label ?? '').trim() || block.field1Label,
      field1Placeholder: String(readCtaSetting('field1Placeholder') || block.field1Placeholder || '').trim(),
      field1Options: String(readCtaSetting('field1Options') ?? block.field1Options ?? '').trim(),
      field1Required: context.ctaSettings.field1Required ?? block.field1Required,
      field2Enabled: context.ctaSettings.field2Enabled ?? block.field2Enabled,
      field2Type: String(readCtaSetting('field2Type') ?? block.field2Type ?? '').trim() || block.field2Type,
      field2Label: String(readCtaSetting('field2Label') ?? block.field2Label ?? '').trim() || block.field2Label,
      field2Placeholder: String(readCtaSetting('field2Placeholder') || block.field2Placeholder || '').trim(),
      field2Options: String(readCtaSetting('field2Options') ?? block.field2Options ?? '').trim(),
      field2Required: context.ctaSettings.field2Required ?? block.field2Required,
      field3Enabled: context.ctaSettings.field3Enabled ?? block.field3Enabled,
      field3Type: String(readCtaSetting('field3Type') ?? block.field3Type ?? '').trim() || block.field3Type,
      field3Label: String(readCtaSetting('field3Label') ?? block.field3Label ?? '').trim() || block.field3Label,
      field3Placeholder: String(
        readCtaSetting('field3Placeholder', 'phonePlaceholder')
        || block.field3Placeholder
        || block.phonePlaceholder
        || '(555) 555-5555'
      ).trim(),
      field3Options: String(readCtaSetting('field3Options') ?? block.field3Options ?? '').trim(),
      field3Required: context.ctaSettings.field3Required ?? block.field3Required,
      field4Enabled: context.ctaSettings.field4Enabled ?? block.field4Enabled,
      field4Type: String(readCtaSetting('field4Type') ?? block.field4Type ?? '').trim() || block.field4Type,
      field4Label: String(readCtaSetting('field4Label') ?? block.field4Label ?? '').trim() || block.field4Label,
      field4Placeholder: String(
        readCtaSetting('field4Placeholder', 'messagePlaceholder')
        || block.field4Placeholder
        || block.messagePlaceholder
        || 'What would you like to discuss?'
      ).trim(),
      field4Options: String(readCtaSetting('field4Options') ?? block.field4Options ?? '').trim(),
      field4Required: context.ctaSettings.field4Required ?? block.field4Required,
    };
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
    return resolveHomeColumnsMhaBlock(block, managedBlock);
  }

  if (blockId === HOME_DO_THE_MATH_BLOCK_ID) {
    return resolveHomeColumnsMathBlock(block, managedBlock);
  }

  return block;
}

export function buildResolvedHomeBlocks(staticBlocks, context) {
  const resolvedBlocks = staticBlocks.map((block) => resolveHomeBlock(block, context)).filter(Boolean);
  const resolvedBlockIds = new Set(
    resolvedBlocks
      .map((block) => String(block?.id || '').trim())
      .filter(Boolean),
  );
  const extraRenderableManagedBlocks = context.managedBlocks.filter((block) => {
    if (!isManagedBlockVisible(block)) {
      return false;
    }
    if (String(block?.mode || '').trim().toLowerCase() !== 'dynamic') {
      return false;
    }
    const kind = String(block?.kind || block?.type || '').trim().toLowerCase();
    if (!HOME_EXTRA_RENDERABLE_DYNAMIC_KINDS.has(kind)) {
      return false;
    }
    const blockId = String(block?.id || '').trim();
    return !blockId || !resolvedBlockIds.has(blockId);
  });

  return reorderHomeTopBlocks(resolvedBlocks.concat(extraRenderableManagedBlocks));
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
