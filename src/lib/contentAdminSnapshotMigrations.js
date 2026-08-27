// Explicit snapshot migrations only. This module is not part of normal
// browser/server normalization or renderer composition.
import { resolveSiteFeatureCatalogEntry } from '../data/siteFeatureCatalog.js';

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

export const PLANNED_GIVING_STEPS_MIGRATION_ID = 'planned-giving-steps-preset';
export const PLANNED_GIVING_STEPS_MIGRATION_VERSION = 1;
export const PLANNED_GIVING_STEPS_PATH = '/services/planned-giving/qualified-charitable-distribution';

export const QCD_CENTERED_CARD_GRID_MIGRATION_ID = 'qcd-centered-card-grid';
export const QCD_CENTERED_CARD_GRID_MIGRATION_VERSION = 1;

export const CGA_SECURE_ACT_CARD_MIGRATION_ID = 'cga-secure-act-card';
export const CGA_SECURE_ACT_CARD_MIGRATION_VERSION = 4;
export const CGA_PATH = '/services/planned-giving/charitable-gift-annuities';

export const INSURANCE_COVERAGE_CTA_MIGRATION_ID = 'insurance-coverage-cta-fields';
export const INSURANCE_COVERAGE_CTA_MIGRATION_VERSION = 1;
export const INSURANCE_PATH = '/services/insurance';

export const INSURANCE_FEATURE_COLUMNS_MIGRATION_ID = 'insurance-features-to-columns';
export const INSURANCE_FEATURE_COLUMNS_MIGRATION_VERSION = 1;

export const INSURANCE_PC_RESOURCES_MIGRATION_ID = 'insurance-pc-resource-card-lists';
export const INSURANCE_PC_RESOURCES_MIGRATION_VERSION = 1;
export const INSURANCE_PC_RESOURCES_PATH = '/services/insurance/property-casualty-insurance';

export const ONLINE_CONTRIBUTIONS_STEPS_MIGRATION_ID = 'online-contributions-step-cards';
export const ONLINE_CONTRIBUTIONS_STEPS_MIGRATION_VERSION = 1;
export const ONLINE_CONTRIBUTIONS_PATH = '/online-contributions';

export const NUMBERED_STEP_CARDS_MIGRATION_ID = 'numbered-step-cards-preset-metadata';
export const NUMBERED_STEP_CARDS_MIGRATION_VERSION = 1;

export const SITE_FEATURE_COLLECTIONS_MIGRATION_ID = 'site-feature-repeatable-content-fields';
export const SITE_FEATURE_COLLECTIONS_MIGRATION_VERSION = 1;

export const SUPPORT_LIBRARY_BLOCK_MIGRATION_ID = 'support-library-block-kind';
export const SUPPORT_LIBRARY_BLOCK_MIGRATION_VERSION = 1;
export const SUPPORT_LIBRARY_PATH = '/services/insurance/ministers-group-life-plan';

export const ENDOWMENTS_PRESENTATION_MIGRATION_ID = 'endowments-billboard-and-contact-headline';
export const ENDOWMENTS_PRESENTATION_MIGRATION_VERSION = 1;
export const ENDOWMENTS_PRESENTATION_PATH = '/services/planned-giving/endowments';

export const MIF_REQUEST_HEADLINE_COLOR_MIGRATION_ID = 'mif-request-headline-highlight-colors';
export const MIF_REQUEST_HEADLINE_COLOR_MIGRATION_VERSION = 1;
export const MIF_REQUEST_HEADLINE_COLOR_PATH = '/services/planned-giving/ministry-impact-fund';

export const QCD_REQUEST_HEADLINE_COLOR_MIGRATION_ID = 'qcd-request-headline-highlight-colors';
export const QCD_REQUEST_HEADLINE_COLOR_MIGRATION_VERSION = 1;
export const QCD_REQUEST_HEADLINE_COLOR_PATH = '/services/planned-giving/qualified-charitable-distribution';

const NUMBERED_STEP_CARD_SECTION_TOKENS = new Set([
  'ministers-group-life-native-enroll',
  'online-contrib-native-steps',
  'retirement-403b-group-enrollment-steps',
  'retirement-403b-native-loan-apply',
  'retirement-individual-enrollment-steps',
]);

export function migrateSupportLibraryBlock(pathname, block) {
  if (String(pathname || '').trim() !== SUPPORT_LIBRARY_PATH || !block || typeof block !== 'object') {
    return block;
  }
  if (String(block.id || '').trim() !== 'support' || String(block.kind || '').trim() !== 'content') {
    return block;
  }
  const supportGroupsJson = String(block.settings?.supportGroupsJson || '').trim();
  if (!supportGroupsJson) {
    return block;
  }
  return { ...cloneJson(block), kind: 'support_library' };
}

export function migrateSupportLibraryState(rawState) {
  const source = rawState && typeof rawState === 'object' ? cloneJson(rawState) : {};
  const blocksByPath = source.blocksByPath && typeof source.blocksByPath === 'object'
    ? source.blocksByPath
    : {};
  const currentBlocks = Array.isArray(blocksByPath[SUPPORT_LIBRARY_PATH])
    ? blocksByPath[SUPPORT_LIBRARY_PATH]
    : [];
  const migratedBlocks = currentBlocks.map((block) => migrateSupportLibraryBlock(SUPPORT_LIBRARY_PATH, block));
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(currentBlocks);
  return {
    state: changed
      ? { ...source, blocksByPath: { ...blocksByPath, [SUPPORT_LIBRARY_PATH]: migratedBlocks } }
      : source,
    changed,
  };
}

function migrateEndowmentsPresentationBlock(block) {
  if (!block || typeof block !== 'object') {
    return block;
  }

  const blockId = String(block.id || '').trim();
  const settings = block.settings && typeof block.settings === 'object' ? block.settings : null;
  if (!settings || !['give_forever', 'request_form'].includes(blockId)) {
    return block;
  }

  const nextSettings = { ...settings };
  let changed = false;

  // Match the DAF billboard's measured Helv tracking without changing an
  // administrator's later typography choice.
  if (blockId === 'give_forever' && Number(settings.titleLetterSpacingEm) === -0.035) {
    nextSettings.titleLetterSpacingEm = -0.03;
    changed = true;
  }

  // This is a punctuation-only repair for the legacy seeded headline. Keep
  // custom administrator copy untouched.
  if (blockId === 'request_form' && String(settings.title || '').trim() === "Let's get started") {
    nextSettings.title = "Let's get started.";
    changed = true;
  }

  return changed ? { ...cloneJson(block), settings: nextSettings } : block;
}

export function migrateEndowmentsPresentationState(rawState) {
  const source = rawState && typeof rawState === 'object' ? cloneJson(rawState) : {};
  const blocksByPath = source.blocksByPath && typeof source.blocksByPath === 'object'
    ? source.blocksByPath
    : {};
  const currentBlocks = Array.isArray(blocksByPath[ENDOWMENTS_PRESENTATION_PATH])
    ? blocksByPath[ENDOWMENTS_PRESENTATION_PATH]
    : [];
  const migratedBlocks = currentBlocks.map(migrateEndowmentsPresentationBlock);
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(currentBlocks);
  return {
    state: changed
      ? { ...source, blocksByPath: { ...blocksByPath, [ENDOWMENTS_PRESENTATION_PATH]: migratedBlocks } }
      : source,
    changed,
  };
}

function migrateMifRequestHeadlineBlock(block) {
  if (!block || typeof block !== 'object' || String(block.id || '').trim() !== 'request_form') {
    return block;
  }
  const settings = block.settings && typeof block.settings === 'object' ? block.settings : null;
  if (!settings || String(settings.title || '').trim() !== 'Ministry support. Unlocked and expanded.') {
    return block;
  }
  if (String(settings.titleHighlightsJson || '').trim()) {
    return block;
  }
  return {
    ...cloneJson(block),
    settings: {
      ...settings,
      titleHighlightsJson: '[{"text":"Unlocked","className":"is-white"},{"text":"expanded","className":"is-white"}]',
    },
  };
}

export function migrateMifRequestHeadlineColorState(rawState) {
  const source = rawState && typeof rawState === 'object' ? cloneJson(rawState) : {};
  const blocksByPath = source.blocksByPath && typeof source.blocksByPath === 'object'
    ? source.blocksByPath
    : {};
  const currentBlocks = Array.isArray(blocksByPath[MIF_REQUEST_HEADLINE_COLOR_PATH])
    ? blocksByPath[MIF_REQUEST_HEADLINE_COLOR_PATH]
    : [];
  const migratedBlocks = currentBlocks.map(migrateMifRequestHeadlineBlock);
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(currentBlocks);
  return {
    state: changed
      ? { ...source, blocksByPath: { ...blocksByPath, [MIF_REQUEST_HEADLINE_COLOR_PATH]: migratedBlocks } }
      : source,
    changed,
  };
}

function migrateQcdRequestHeadlineBlock(block) {
  if (!block || typeof block !== 'object' || String(block.id || '').trim() !== 'request_form') {
    return block;
  }
  const settings = block.settings && typeof block.settings === 'object' ? block.settings : null;
  if (!settings || String(settings.title || '').trim() !== 'Your IRA. Their gain.') {
    return block;
  }
  if (String(settings.titleHighlightsJson || '').trim()) {
    return block;
  }
  return {
    ...cloneJson(block),
    settings: {
      ...settings,
      titleHighlightsJson: '[{"text":"gain","className":"is-white"}]',
    },
  };
}

export function migrateQcdRequestHeadlineColorState(rawState) {
  const source = rawState && typeof rawState === 'object' ? cloneJson(rawState) : {};
  const blocksByPath = source.blocksByPath && typeof source.blocksByPath === 'object'
    ? source.blocksByPath
    : {};
  const currentBlocks = Array.isArray(blocksByPath[QCD_REQUEST_HEADLINE_COLOR_PATH])
    ? blocksByPath[QCD_REQUEST_HEADLINE_COLOR_PATH]
    : [];
  const migratedBlocks = currentBlocks.map(migrateQcdRequestHeadlineBlock);
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(currentBlocks);
  return {
    state: changed
      ? { ...source, blocksByPath: { ...blocksByPath, [QCD_REQUEST_HEADLINE_COLOR_PATH]: migratedBlocks } }
      : source,
    changed,
  };
}

const CGA_SECURE_ACT_BODY_HTML = '<p><strong><span class="is-atlantean">The SECURE 2.0 Act of 2022</span></strong> allows you to fund a Charitable Gift Annuity with funds distributed from your IRA—up to $50,000* of your annual Qualified Charitable Distribution limit (QCD). This charitable distribution amount is both retirement income for you, and a gift of support to a ministry you choose. Even better, this distribution can count toward your IRA’s annual Required Minimum Distribution (RMD). <strong>You’re permitted to take advantage of this unique opportunity only once.</strong></p>';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCgaBulletHtml(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  const markdownMatch = text.match(/^\*\*(.+?)\*\*(.*)$/);
  const knownLabelMatch = text.match(/^(Cash|Appreciated securities|\$10,000 minimum)(.*)$/);
  const label = markdownMatch?.[1] || knownLabelMatch?.[1] || '';
  const rest = markdownMatch?.[2] || knownLabelMatch?.[2] || text;
  const labelMarkup = label
    ? `<strong><span class="is-atlantean">${escapeHtml(label)}</span></strong>`
    : '';
  return `<li>${labelMarkup}${escapeHtml(rest)}</li>`;
}

function parseCgaBulletItems(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    }
  } catch {
    // Fall through to line-separated legacy content.
  }
  return parseLegacyCardLines(value);
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function migrateFeaturePanelActionLink(settings) {
  const source = settings && typeof settings === 'object' ? settings : {};
  const canonicalLinkJson = String(source.buttonLinkJson || '').trim();
  if (canonicalLinkJson) {
    return canonicalLinkJson;
  }

  const href = String(source.buttonUrl || '').trim();
  const to = String(source.buttonPageRef || '').trim();
  const internalTarget = to || (href.startsWith('/') ? href : '');
  if (!href && !internalTarget) {
    return '';
  }

  return JSON.stringify({
    kind: internalTarget ? 'internal' : 'external',
    ...(internalTarget ? { to: internalTarget } : { href }),
    openInNewWindow: Boolean(source.buttonOpenInNewWindow),
  });
}

function convertInsuranceFeaturePanelToColumnsBlock(pathname, block) {
  const source = cloneJson(block);
  if (
    String(pathname || '').trim() !== INSURANCE_PATH
    || !['risk_management', 'mission_assure'].includes(String(source?.id || '').trim())
    || String(source?.kind || '').trim() !== 'feature_panel'
    || String(source?.mode || '').trim() !== 'dynamic'
  ) {
    return source;
  }

  const settings = source.settings && typeof source.settings === 'object' ? source.settings : {};
  const isRisk = String(source.id || '').trim() === 'risk_management';
  const buttonFields = {
    buttonLabel: String(settings.buttonLabel || '').trim(),
    buttonLinkJson: migrateFeaturePanelActionLink(settings),
    buttonUrl: String(settings.buttonUrl || '').trim(),
    buttonPageRef: String(settings.buttonPageRef || '').trim(),
    buttonStyle: String(settings.buttonStyle || 'blue').trim() || 'blue',
    buttonTone: String(settings.buttonTone || 'atlantean').trim() || 'atlantean',
    buttonOpenInNewWindow: Boolean(settings.buttonOpenInNewWindow),
  };
  const baseColumnSettings = {
    title: '',
    leadLine: '',
    followupLine: '',
    titleClassName: '',
    titleHighlightsJson: '',
    bodyHtml: '',
    columnsStyle: 'retirement',
    bgTone: isRisk ? 'white' : 'sand',
    contentWidth: 'content',
    columns: 'two',
    sectionClassName: '',
    col1Enabled: true,
    col1Type: isRisk ? 'text' : 'photo',
    col1Title: isRisk ? String(settings.title || '') : '',
    col1TitleClassName: isRisk ? String(settings.titleClassName || '') : '',
    col1TitleHighlightsJson: isRisk ? String(settings.titleHighlightsJson || '') : '',
    col1Body: isRisk ? String(settings.body || '') : '',
    col1BodyHtml: isRisk ? String(settings.bodyHtml || '') : '',
    col1ImageUrl: isRisk ? '' : String(settings.imageUrl || ''),
    col1ImageAlt: isRisk ? '' : String(settings.imageAlt || ''),
    col1ButtonLabel: isRisk ? buttonFields.buttonLabel : '',
    col1ButtonLinkJson: isRisk ? buttonFields.buttonLinkJson : '',
    col1ButtonUrl: isRisk ? buttonFields.buttonUrl : '',
    col1ButtonPageRef: isRisk ? buttonFields.buttonPageRef : '',
    col1ButtonStyle: isRisk ? buttonFields.buttonStyle : 'blue',
    col1ButtonTone: isRisk ? buttonFields.buttonTone : 'atlantean',
    col1ButtonOpenInNewWindow: isRisk ? buttonFields.buttonOpenInNewWindow : false,
    col2Enabled: true,
    col2Type: isRisk ? 'photo' : 'text',
    col2Title: isRisk ? '' : String(settings.title || ''),
    col2TitleClassName: isRisk ? '' : String(settings.titleClassName || ''),
    col2TitleHighlightsJson: isRisk ? '' : String(settings.titleHighlightsJson || ''),
    col2Body: isRisk ? '' : String(settings.body || ''),
    col2BodyHtml: isRisk ? '' : String(settings.bodyHtml || ''),
    col2ImageUrl: isRisk ? String(settings.imageUrl || '') : '',
    col2ImageAlt: isRisk ? String(settings.imageAlt || '') : '',
    col2ButtonLabel: isRisk ? '' : buttonFields.buttonLabel,
    col2ButtonLinkJson: isRisk ? '' : buttonFields.buttonLinkJson,
    col2ButtonUrl: isRisk ? '' : buttonFields.buttonUrl,
    col2ButtonPageRef: isRisk ? '' : buttonFields.buttonPageRef,
    col2ButtonStyle: isRisk ? 'blue' : buttonFields.buttonStyle,
    col2ButtonTone: isRisk ? 'atlantean' : buttonFields.buttonTone,
    col2ButtonOpenInNewWindow: isRisk ? false : buttonFields.buttonOpenInNewWindow,
    col3Enabled: false,
    col3Type: 'text',
    col3Title: '',
    col3Body: '',
    col3BodyHtml: '',
    col3ImageUrl: '',
    col3ImageAlt: '',
    col4Enabled: false,
    col4Type: 'text',
    col4Title: '',
    col4Body: '',
    col4BodyHtml: '',
    col4ImageUrl: '',
    col4ImageAlt: '',
  };

  return {
    ...source,
    kind: 'columns',
    templateId: 'columns',
    presetId: isRisk ? 'do-the-math' : 'housing-allowance',
    settings: baseColumnSettings,
  };
}

export function migrateInsuranceFeaturePanelToColumnsBlock(pathname, block) {
  return convertInsuranceFeaturePanelToColumnsBlock(pathname, block);
}

export function migrateInsuranceFeatureColumnsState(rawState) {
  const source = cloneJson(rawState) || {};
  const blocks = source?.blocksByPath?.[INSURANCE_PATH];
  if (!Array.isArray(blocks)) {
    return { state: source, changed: false };
  }
  const migratedBlocks = blocks.map((block) => convertInsuranceFeaturePanelToColumnsBlock(INSURANCE_PATH, block));
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(blocks);
  return {
    state: changed
      ? {
          ...source,
          blocksByPath: {
            ...(source.blocksByPath || {}),
            [INSURANCE_PATH]: migratedBlocks,
          },
        }
      : source,
    changed,
  };
}

const SITE_FEATURE_COLLECTION_FIELD_BY_ID = Object.freeze({
  home_services_feature_animation: 'panelsJson',
  home_impact_story: 'metricsJson',
  impact_proof_story: 'metricsJson',
  about_history_feature: 'cardsJson',
  legacy_giving_stewardship_story: 'beatsJson',
  retirement_plan_feature: 'panelsJson',
  investments_growth_feature: 'panelsJson',
});

function editableActionPath(action) {
  return String(action?.to || action?.href || '').trim();
}

function mapRuntimeCollectionItem(featureId, item) {
  const source = item && typeof item === 'object' ? item : {};
  if (featureId === 'legacy_giving_stewardship_story') {
    return { copy: String(typeof item === 'string' ? item : source.copy || '').trim() };
  }
  if (featureId === 'home_services_feature_animation') {
    return {
      title: String(source.title || '').trim(),
      body: String(source.body || '').trim(),
      tone: String(source.tone || '').trim(),
      buttonLabel: String(source.action?.label || '').trim(),
      buttonPath: editableActionPath(source.action),
      buttonOpenInNewWindow: Boolean(source.action?.openInNewWindow),
    };
  }
  if (featureId === 'home_impact_story') {
    return {
      value: String(source.value || '').trim(),
      label: String(source.label || '').trim(),
      valueTone: String(source.valueTone || '').trim(),
      labelBreak: String(source.labelBreak || '').trim(),
      tone: String(source.tone || '').trim(),
      buttonLabel: String(source.action?.label || '').trim(),
      buttonPath: editableActionPath(source.action),
    };
  }
  if (featureId === 'impact_proof_story') {
    return {
      value: String(source.value || '').trim(),
      eyebrow: String(source.eyebrow || '').trim(),
      label: String(source.label || '').trim(),
      body: String(source.body || '').trim(),
      valueTone: String(source.valueTone || '').trim(),
      labelBreak: String(source.labelBreak || '').trim(),
      tone: String(source.tone || '').trim(),
      nativeCardClass: String(source.nativeCardClass || '').trim(),
      buttonLabel: String(source.action?.label || '').trim(),
      buttonPath: editableActionPath(source.action),
    };
  }
  if (featureId === 'about_history_feature') {
    return {
      title: String(source.title || '').trim(),
      body: String(source.body || '').trim(),
      titleClassName: String(source.titleClassName || '').trim(),
      panelTone: String(source.panelTone || '').trim(),
      cardClass: String(source.cardClass || '').trim(),
    };
  }
  return {
    kind: String(source.kind || '').trim(),
    title: String(source.title || '').trim(),
    body: String(source.body || '').trim(),
    tone: String(source.tone || '').trim(),
    surfaceTone: String(source.surfaceTone || '').trim(),
  };
}

function parseFeatureIntro(rawValue) {
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue || '{}') : rawValue;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Seeds repeatable site-feature content into explicit settings fields.
 * Existing fields always win. This is intentionally a migration, never a
 * renderer repair, so adding/removing/reordering items remains normal editor
 * data after the one-time conversion.
 */
export function migrateSiteFeatureCollectionsBlock(block) {
  const source = cloneJson(block);
  if (
    String(source?.kind || '').trim() !== 'site_feature'
    || String(source?.mode || '').trim() !== 'dynamic'
  ) {
    return source;
  }
  const settings = source.settings && typeof source.settings === 'object'
    ? { ...source.settings }
    : {};
  const featureId = String(settings.featureId || '').trim();
  const collectionField = SITE_FEATURE_COLLECTION_FIELD_BY_ID[featureId];
  if (!collectionField) {
    return source;
  }
  const runtime = resolveSiteFeatureCatalogEntry(featureId)?.buildRuntime?.({ settings }) || {};
  let changed = false;
  if (!Object.prototype.hasOwnProperty.call(settings, collectionField)) {
    const runtimeItems = Array.isArray(runtime[collectionField === 'beatsJson' ? 'beats' : collectionField.replace(/Json$/, '')])
      ? runtime[collectionField === 'beatsJson' ? 'beats' : collectionField.replace(/Json$/, '')]
      : [];
    settings[collectionField] = JSON.stringify(runtimeItems.map((item) => mapRuntimeCollectionItem(featureId, item)));
    changed = true;
  }
  if (featureId === 'impact_proof_story') {
    const intro = parseFeatureIntro(settings.featureIntroJson);
    [['introHeading', 'heading'], ['introBody', 'body'], ['introEmphasis', 'emphasis']].forEach(([fieldId, introKey]) => {
      if (!Object.prototype.hasOwnProperty.call(settings, fieldId) && Object.prototype.hasOwnProperty.call(intro, introKey)) {
        settings[fieldId] = String(intro[introKey] || '').trim();
        changed = true;
      }
    });
  }
  return changed ? { ...source, settings } : source;
}

export function migrateSiteFeatureCollectionsState(rawState) {
  const source = cloneJson(rawState) || {};
  let changed = false;
  const blocksByPath = Object.fromEntries(
    Object.entries(source.blocksByPath || {}).map(([pathname, blocks]) => {
      const migratedBlocks = (Array.isArray(blocks) ? blocks : []).map(migrateSiteFeatureCollectionsBlock);
      if (JSON.stringify(migratedBlocks) !== JSON.stringify(blocks)) {
        changed = true;
      }
      return [pathname, migratedBlocks];
    }),
  );
  return {
    state: changed ? { ...source, blocksByPath } : source,
    changed,
  };
}

export function migratePlannedGivingStepsBlock(pathname, block) {
  const source = cloneJson(block);
  if (
    String(pathname || '').trim() !== PLANNED_GIVING_STEPS_PATH
    || String(source?.id || '').trim() !== 'how_it_works'
    || String(source?.kind || '').trim() !== 'columns'
    || String(source?.mode || '').trim() !== 'dynamic'
  ) {
    return source;
  }

  const settings = source.settings && typeof source.settings === 'object'
    ? source.settings
    : {};
  const sectionClassName = String(settings.sectionClassName || '')
    .split(/\s+/)
    .filter((token) => token && token !== 'legacy-child-native-flow-steps' && token !== 'legacy-child-native-qcd-steps')
    .join(' ');
  return {
    ...source,
    presetId: 'planned-giving-steps',
    settings: {
      ...settings,
      sectionClassName,
    },
  };
}

function parseLegacyCardLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPlaceholderCard(settings, slot) {
  const title = String(settings?.[`card${slot}Title`] || '').trim().toLowerCase();
  const body = String(settings?.[`card${slot}Body`] || '').trim().toLowerCase();
  const bodyHtml = String(settings?.[`card${slot}BodyHtml`] || '').trim();
  const list = String(settings?.[`card${slot}ListJson`] || '').trim();
  const links = String(settings?.[`card${slot}LinksJson`] || '').trim();
  const accordions = String(settings?.[`card${slot}AccordionsJson`] || '').trim();
  const button = String(settings?.[`card${slot}ButtonLabel`] || '').trim();
  const button2 = String(settings?.[`card${slot}Button2Label`] || '').trim();
  return (title === 'card title' || title === `new card ${slot}`)
    && (body === 'add card description here.' || !body)
    && !bodyHtml
    && !list
    && !links
    && !accordions
    && !button
    && !button2;
}

/**
 * Explicit content migration for the QCD card grid that was authored as the
 * generic three-card template. It moves the existing line-separated copy into
 * the shared bullet-list field and removes only untouched placeholder cards.
 * Rendering never calls this function.
 */
export function migrateQcdCenteredCardGridBlock(pathname, block) {
  const source = cloneJson(block);
  if (
    String(pathname || '').trim() !== PLANNED_GIVING_STEPS_PATH
    || String(source?.id || '').trim() !== 'card_grid'
    || String(source?.kind || '').trim() !== 'card_grid'
    || String(source?.mode || '').trim() !== 'dynamic'
  ) {
    return source;
  }

  const settings = source.settings && typeof source.settings === 'object'
    ? { ...source.settings }
    : {};
  const legacyLines = parseLegacyCardLines(settings.card1Body);
  const existingList = String(settings.card1ListJson || '').trim();
  let changed = false;

  if (String(settings.cardStyle || '').trim() !== 'planned-giving-centered') {
    settings.cardStyle = 'planned-giving-centered';
    changed = true;
  }
  if (String(settings.columns || '').trim() !== 'one') {
    settings.columns = 'one';
    changed = true;
  }
  if (!existingList && legacyLines.length) {
    settings.card1ListJson = JSON.stringify(legacyLines);
    settings.card1Body = '';
    changed = true;
  }

  [2, 3].forEach((slot) => {
    if (!isPlaceholderCard(settings, slot)) {
      return;
    }
    [`card${slot}Title`, `card${slot}Body`].forEach((key) => {
      if (settings[key]) {
        settings[key] = '';
        changed = true;
      }
    });
  });

  return changed ? { ...source, settings } : source;
}

export function migrateQcdCenteredCardGridState(rawState) {
  const source = cloneJson(rawState) || {};
  const blocks = source?.blocksByPath?.[PLANNED_GIVING_STEPS_PATH];
  if (!Array.isArray(blocks)) {
    return { state: source, changed: false };
  }
  const migratedBlocks = blocks.map((block) => migrateQcdCenteredCardGridBlock(PLANNED_GIVING_STEPS_PATH, block));
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(blocks);
  return {
    state: changed
      ? {
          ...source,
          blocksByPath: {
            ...(source.blocksByPath || {}),
            [PLANNED_GIVING_STEPS_PATH]: migratedBlocks,
          },
        }
      : source,
    changed,
  };
}

/**
 * Moves the Online Contributions setup cards onto the shared numbered-step
 * preset. The old step sentences are retained at the start of each body so
 * this migration changes presentation structure without dropping authored
 * copy.
 */
export function migrateOnlineContributionsStepsBlock(pathname, block) {
  const source = cloneJson(block);
  if (
    String(pathname || '').trim() !== ONLINE_CONTRIBUTIONS_PATH
    || String(source?.id || '').trim() !== 'setup_steps'
    || String(source?.kind || '').trim() !== 'card_grid'
    || String(source?.mode || '').trim() !== 'dynamic'
  ) {
    return source;
  }

  const settings = source.settings && typeof source.settings === 'object'
    ? { ...source.settings }
    : {};
  const oldPreset = String(source.presetId || '').trim();
  const oldColumns = String(settings.columns || '').trim();
  const alreadyNumbered = [1, 2, 3].every((slot) => (
    String(settings[`card${slot}Title`] || '').trim() === String(slot).padStart(2, '0')
  ));
  if (oldPreset === 'step-cards' && oldColumns === 'one' && alreadyNumbered) {
    return source;
  }

  let changed = false;
  settings.columns = 'one';
  if (oldColumns !== 'one') {
    changed = true;
  }

  [1, 2, 3].forEach((slot) => {
    const titleKey = `card${slot}Title`;
    const bodyKey = `card${slot}Body`;
    const legacyTitle = String(settings[titleKey] || '').trim();
    const legacyBody = String(settings[bodyKey] || '').trim();
    const titleWithoutNumber = legacyTitle.replace(/^\d+\)\s*/, '').trim();
    const preservedLead = titleWithoutNumber || legacyTitle;
    const nextBody = preservedLead && !legacyBody.startsWith(preservedLead)
      ? [preservedLead, legacyBody].filter(Boolean).join(' ')
      : legacyBody;
    const nextTitle = String(slot).padStart(2, '0');
    if (settings[titleKey] !== nextTitle || settings[bodyKey] !== nextBody) {
      settings[titleKey] = nextTitle;
      settings[bodyKey] = nextBody;
      changed = true;
    }
  });

  if (oldPreset !== 'step-cards') {
    changed = true;
  }
  return changed ? { ...source, presetId: 'step-cards', settings } : source;
}

export function migrateOnlineContributionsStepsState(rawState) {
  const source = cloneJson(rawState) || {};
  const blocks = source?.blocksByPath?.[ONLINE_CONTRIBUTIONS_PATH];
  if (!Array.isArray(blocks)) {
    return { state: source, changed: false };
  }
  const migratedBlocks = blocks.map((block) => migrateOnlineContributionsStepsBlock(ONLINE_CONTRIBUTIONS_PATH, block));
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(blocks);
  return {
    state: changed
      ? {
          ...source,
          blocksByPath: {
            ...(source.blocksByPath || {}),
            [ONLINE_CONTRIBUTIONS_PATH]: migratedBlocks,
          },
        }
      : source,
    changed,
  };
}

/**
 * Adds only the missing preset identity needed by the shared numbered-card
 * renderer. Content, order, and all settings remain byte-for-byte unchanged.
 * Rendering never calls this function; the dev migration endpoint creates a
 * backup before applying it to authoring and published snapshots.
 */
export function migrateNumberedStepCardsBlock(pathname, block) {
  void pathname;
  const source = cloneJson(block);
  if (
    String(source?.kind || '').trim() !== 'card_grid'
    || String(source?.mode || '').trim() !== 'dynamic'
  ) {
    return source;
  }

  const presetId = String(source?.presetId || '').trim().toLowerCase();
  if (presetId && presetId !== 'default') {
    return source;
  }

  const sectionTokens = String(source?.settings?.sectionClassName || '')
    .split(/\s+/)
    .filter(Boolean);
  if (!sectionTokens.some((token) => NUMBERED_STEP_CARD_SECTION_TOKENS.has(token))) {
    return source;
  }

  return { ...source, presetId: 'step-cards' };
}

export function migrateNumberedStepCardsState(rawState) {
  const source = cloneJson(rawState) || {};
  let changed = false;
  const blocksByPath = Object.fromEntries(
    Object.entries(source.blocksByPath || {}).map(([pathname, blocks]) => {
      const migratedBlocks = (Array.isArray(blocks) ? blocks : [])
        .map((block) => migrateNumberedStepCardsBlock(pathname, block));
      if (JSON.stringify(migratedBlocks) !== JSON.stringify(blocks)) {
        changed = true;
      }
      return [pathname, migratedBlocks];
    }),
  );

  return {
    state: changed ? { ...source, blocksByPath } : source,
    changed,
  };
}

export function migrateInsurancePcResourceCardsBlock(pathname, block) {
  const source = cloneJson(block);
  if (
    String(pathname || '').trim() !== INSURANCE_PC_RESOURCES_PATH
    || String(source?.id || '').trim() !== 'resources'
    || String(source?.kind || '').trim() !== 'card_grid'
    || String(source?.mode || '').trim() !== 'dynamic'
  ) {
    return source;
  }

  const settings = source.settings && typeof source.settings === 'object'
    ? { ...source.settings }
    : {};
  let changed = false;
  [1, 2].forEach((slot) => {
    const bodyKey = `card${slot}Body`;
    const listKey = `card${slot}ListJson`;
    if (String(settings[listKey] || '').trim()) {
      return;
    }
    const lines = parseLegacyCardLines(settings[bodyKey]);
    if (!lines.length || !lines.every((line) => /^›\s*/.test(line))) {
      return;
    }
    settings[listKey] = JSON.stringify(lines.map((line) => line.replace(/^›\s*/, '').trim()).filter(Boolean));
    settings[bodyKey] = '';
    changed = true;
  });

  return changed ? { ...source, settings } : source;
}

export function migrateInsurancePcResourceCardsState(rawState) {
  const source = cloneJson(rawState) || {};
  const blocks = source?.blocksByPath?.[INSURANCE_PC_RESOURCES_PATH];
  if (!Array.isArray(blocks)) {
    return { state: source, changed: false };
  }
  const migratedBlocks = blocks.map((block) => migrateInsurancePcResourceCardsBlock(INSURANCE_PC_RESOURCES_PATH, block));
  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(blocks);
  return {
    state: changed
      ? {
          ...source,
          blocksByPath: {
            ...(source.blocksByPath || {}),
            [INSURANCE_PC_RESOURCES_PATH]: migratedBlocks,
          },
        }
      : source,
    changed,
  };
}

function migrateCgaSecureActCardBlocks(blocks) {
  const sourceBlocks = Array.isArray(blocks) ? cloneJson(blocks) : [];
  const giftAssets = sourceBlocks.find((block) => block?.id === 'gift_assets' && block?.kind === 'card_grid');
  if (!giftAssets) {
    return { blocks: sourceBlocks, changed: false };
  }

  const settings = giftAssets.settings && typeof giftAssets.settings === 'object'
    ? { ...giftAssets.settings }
    : {};
  const isMeaningfulBody = (value) => {
    const text = String(value || '').trim()
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    return Boolean(text);
  };
  Object.keys(settings)
    .filter((key) => /^card\d+BodyHtml$/.test(key))
    .forEach((legacyKey) => {
      const bodyKey = legacyKey.replace(/BodyHtml$/, 'Body');
      const legacyBodyHtml = String(settings[legacyKey] || '').trim();
      if (!isMeaningfulBody(settings[bodyKey]) && isMeaningfulBody(legacyBodyHtml)) {
        settings[bodyKey] = legacyBodyHtml;
      }
      delete settings[legacyKey];
    });

  if (!isMeaningfulBody(settings.card1Body)) {
    settings.card1Body = CGA_SECURE_ACT_BODY_HTML;
  }
  Object.keys(settings)
    .filter((key) => /^card\d+ListJson$/.test(key))
    .forEach((listKey) => {
      const items = parseCgaBulletItems(settings[listKey]);
      const bodyKey = listKey.replace(/ListJson$/, 'Body');
      const listHtml = items.map(buildCgaBulletHtml).filter(Boolean).join('');
      const existingBody = String(settings[bodyKey] || '').trim();
      if (listHtml && !/<ul[\s>]/i.test(existingBody)) {
        const bodyMarkup = existingBody
          ? (/<[a-z][^>]*>/i.test(existingBody) ? existingBody : `<p>${escapeHtml(existingBody)}</p>`)
          : '';
        settings[bodyKey] = `<ul>${listHtml}</ul>${bodyMarkup}`;
      }
      delete settings[listKey];
    });

  const nextBlocks = sourceBlocks
    .filter((block) => block?.id !== 'secure_act')
    .map((block) => (block?.id === 'gift_assets' ? { ...block, settings } : block));
  return {
    blocks: nextBlocks,
    changed: JSON.stringify(nextBlocks) !== JSON.stringify(sourceBlocks),
  };
}

export function migrateCgaSecureActCardState(rawState) {
  const source = cloneJson(rawState) || {};
  const blocks = source?.blocksByPath?.[CGA_PATH];
  if (!Array.isArray(blocks)) {
    return { state: source, changed: false };
  }
  const migration = migrateCgaSecureActCardBlocks(blocks);
  return {
    state: migration.changed
      ? {
          ...source,
          blocksByPath: {
            ...(source.blocksByPath || {}),
            [CGA_PATH]: migration.blocks,
          },
        }
      : source,
    changed: migration.changed,
  };
}

/**
 * Repairs only the published field schema for the insurance coverage CTA.
 * The authoring snapshot is the source of truth for fields that already exist
 * there; no other draft setting or block is promoted by this migration.
 */
export function migrateInsuranceCoverageCtaState(rawState, { sourceState = rawState } = {}) {
  const source = cloneJson(rawState) || {};
  const blocks = source?.blocksByPath?.[INSURANCE_PATH];
  if (!Array.isArray(blocks)) {
    return { state: source, changed: false };
  }

  const sourceBlocks = sourceState?.blocksByPath?.[INSURANCE_PATH];
  const cta = (Array.isArray(sourceBlocks) ? sourceBlocks : blocks)
    .find((block) => block?.id === 'cta_form' && block?.kind === 'cta_form');
  const fieldsJson = String(cta?.settings?.fieldsJson || '').trim();
  if (!fieldsJson) {
    return { state: source, changed: false };
  }

  const migratedBlocks = blocks.map((block) => {
    if (block?.id !== 'cta_form' || block?.kind !== 'cta_form') {
      return block;
    }
    const settings = block.settings && typeof block.settings === 'object' ? block.settings : {};
    if (String(settings.fieldsJson || '').trim() === fieldsJson) {
      return block;
    }
    return {
      ...block,
      settings: {
        ...settings,
        fieldsJson,
      },
    };
  });

  const changed = JSON.stringify(migratedBlocks) !== JSON.stringify(blocks);
  return {
    state: changed
      ? {
          ...source,
          blocksByPath: {
            ...(source.blocksByPath || {}),
            [INSURANCE_PATH]: migratedBlocks,
          },
        }
      : source,
    changed,
  };
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
