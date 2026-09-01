import { normalizePresetBearingBlockIdentity } from './blockPresetIdentity.js';
import { normalizeBlockPresentation } from './blockPresentationContracts.js';
import { normalizeAdminBlockName } from './blockDisplayName.js';
import { normalizeSplitLinkFieldSettings } from './linkValue.js';
import { normalizeCollaborationState } from './contentAdminCollaboration.js';

// This version describes the record transformations below, not the renderer schema.
// Increment it when a new, non-destructive stored-record migration is introduced.
export const CONTENT_ADMIN_NORMALIZATION_VERSION = 7;

// Migrated editors resolve their field catalog from the block registry. Keeping
// the same catalog on every stored block makes the shared snapshot needlessly
// large, so only legacy/unknown kinds retain an inline fallback catalog.
const REGISTRY_BACKED_DYNAMIC_BLOCK_KINDS = new Set([
  'content',
  'support_library',
  'calculator_cta',
  'calculator_intro',
  'calculator_widget',
  'card_chart',
  'cta_form',
  'request_form',
  'hero',
  'hero_pie',
  'impact_stat',
  'intro',
  'legal_copy',
  'billboard',
  'columns',
  'feature_panel',
  'photo_column',
  'card_grid',
  'newsletter',
  'rates',
  'services_grid',
  'site_feature',
  'split_panel',
  'testimonials',
  'top_strip',
]);

const RETIRED_DAF_PATH = '/services/planned-giving/generosity-fund';
const DAF_PATH = '/services/planned-giving/donor-advised-fund';
const LEGACY_DAF_PATH = '/services/legacy-giving/generosity-fund';
const PLANNED_GIVING_PATH = '/services/planned-giving';
const CHARITABLE_TRUSTS_PATH = '/services/planned-giving/charitable-trusts';
function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function normalizeManagedContentPath(value) {
  const source = String(value || '').trim();
  if (!source) {
    return '';
  }
  const withLeadingSlash = source.startsWith('/') ? source : `/${source}`;
  const compact = withLeadingSlash.replace(/\/{2,}/g, '/');
  return compact.length > 1 && compact.endsWith('/') ? compact.slice(0, -1) : compact;
}

function resolveAliasPath(pathname, aliases) {
  let current = normalizeManagedContentPath(pathname);
  const seen = new Set();
  let guard = 0;
  while (current && aliases?.[current] && !seen.has(current) && guard < 40) {
    seen.add(current);
    current = normalizeManagedContentPath(aliases[current]);
    guard += 1;
  }
  return current;
}

function normalizePathAliases(rawAliases, pageHierarchy) {
  const knownPaths = new Set(Object.keys(pageHierarchy || {}));
  const source = isObject(rawAliases) ? rawAliases : {};
  const aliases = {};

  Object.entries(source).forEach(([fromValue, toValue]) => {
    const from = normalizeManagedContentPath(fromValue);
    const to = normalizeManagedContentPath(toValue);
    if (!from || !to || from === to || knownPaths.has(from)) {
      return;
    }
    aliases[from] = to;
  });

  return Object.fromEntries(
    Object.entries(aliases)
      .map(([from, to]) => [from, resolveAliasPath(to, aliases)])
      .filter(([from, to]) => from && to && from !== to),
  );
}

function normalizePageHierarchy(rawHierarchy) {
  const source = isObject(rawHierarchy) ? rawHierarchy : {};
  const next = {};
  Object.entries(source).forEach(([key, rawPage]) => {
    if (!isObject(rawPage)) {
      return;
    }
    const pathname = normalizeManagedContentPath(rawPage.path || key);
    if (!pathname || pathname.startsWith('/admin/')) {
      return;
    }
    next[pathname] = {
      ...cloneJson(rawPage),
      path: pathname,
    };
  });
  return next;
}

function canonicalizeRouteLinkEditableFields(editableFields) {
  if (!Array.isArray(editableFields)) {
    return editableFields;
  }

  return editableFields
    .map((field) => {
      if (!isObject(field) || field.type !== 'route_link') {
        return field;
      }
      const fieldId = String(field.id || '').trim();
      const routeRefFieldId = String(field.routeRefFieldId || '').trim();
      const legacyHrefFieldId = String(field.legacyHrefFieldId || (fieldId.endsWith('LinkJson') ? '' : fieldId)).trim();
      const baseFieldId = String(routeRefFieldId || legacyHrefFieldId || fieldId)
        .replace(/(?:PageRef|Url|Path|Href|LinkJson)$/, '');
      const linkJsonFieldId = String(
        field.linkJsonFieldId
        || (fieldId.endsWith('LinkJson') ? fieldId : '')
        || (baseFieldId ? `${baseFieldId}LinkJson` : ''),
      ).trim();
      const {
        legacyHrefFieldId: _legacyHrefFieldId,
        routeRefFieldId: _routeRefFieldId,
        linkJsonFieldId: _linkJsonFieldId,
        openInNewWindowFieldId: _openInNewWindowFieldId,
        ...withoutLegacyMetadata
      } = field;
      return { ...withoutLegacyMetadata, id: linkJsonFieldId || fieldId };
    })
    .filter((field) => {
      const fieldId = String(field?.id || '').trim();
      return !fieldId.endsWith('PageRef') && !fieldId.endsWith('OpenInNewWindow');
    });
}

function normalizeBlockSettings(settings) {
  if (!isObject(settings)) {
    return {};
  }
  let next = normalizeSplitLinkFieldSettings(cloneJson(settings), { stripSplitFields: true });
  next = { ...next };
  return next;
}

export function normalizeRetirement403bRatesBlock(pathname, rawBlock) {
  if (normalizeManagedContentPath(pathname) !== '/services/retirement/403b' || !isObject(rawBlock)) {
    return rawBlock;
  }
  if (String(rawBlock.id || '').trim() !== 'rate_table') {
    return rawBlock;
  }

  const kind = String(rawBlock.kind || '').trim().toLowerCase();
  const settings = isObject(rawBlock.settings) ? rawBlock.settings : {};
  if (kind === 'rates' && String(settings.dataset || '').trim().toLowerCase() === '403b') {
    return rawBlock;
  }

  return {
    ...cloneJson(rawBlock),
    name: '403(b) Investment Rate',
    kind: 'rates',
    variant: 'inline',
    settings: {
      ...settings,
      dataset: '403b',
      panelId: String(settings.panelId || '').trim() || 'rates-403b-investment-rate',
      anchorId: String(settings.anchorId || '').trim() || '403b-investment-rate',
      displayName: '403(b) Investment Rate',
      titleClassName: 'is-atlantean',
      sectionClassName: String(settings.sectionClassName || '').trim() || 'retirement-403b-native-rate-table',
    },
  };
}

export function normalizeRetirementIraRatesBlock(pathname, rawBlock) {
  if (normalizeManagedContentPath(pathname) !== '/services/retirement/iras' || !isObject(rawBlock)) {
    return rawBlock;
  }
  if (String(rawBlock.id || '').trim() !== 'rate_table') {
    return rawBlock;
  }

  const kind = String(rawBlock.kind || '').trim().toLowerCase();
  const settings = isObject(rawBlock.settings) ? rawBlock.settings : {};
  if (kind === 'rates' && String(settings.dataset || '').trim().toLowerCase() === 'ira') {
    return rawBlock;
  }

  return {
    ...cloneJson(rawBlock),
    name: 'IRA Investment Rates',
    kind: 'rates',
    variant: 'inline',
    settings: {
      ...settings,
      dataset: 'ira',
      panelId: String(settings.panelId || '').trim() || 'rates-ira',
      anchorId: String(settings.anchorId || '').trim() || 'ira-rates',
      displayName: 'IRA Investment Rates',
      sectionClassName: String(settings.sectionClassName || '').trim() || 'retirement-ira-native-rates',
      paddingTopRem: Number.isFinite(Number(settings.paddingTopRem)) ? Number(settings.paddingTopRem) : 5.8,
      paddingBottomRem: Number.isFinite(Number(settings.paddingBottomRem)) ? Number(settings.paddingBottomRem) : 2.4,
    },
  };
}

export function normalizeIraContributionLimitsChart(pathname, rawBlock) {
  if (normalizeManagedContentPath(pathname) !== '/services/retirement/iras' || !isObject(rawBlock)) {
    return rawBlock;
  }
  if (String(rawBlock.id || '').trim() !== 'contribution_limits') {
    return rawBlock;
  }
  if (String(rawBlock.kind || '').trim().toLowerCase() === 'card_chart') {
    return rawBlock;
  }

  const settings = isObject(rawBlock.settings) ? rawBlock.settings : {};
  const headers = Array.isArray(settings.tableHeadersJson)
    ? settings.tableHeadersJson.map((value) => String(value || '').trim())
    : [];
  const rows = Array.isArray(settings.tableRowsJson)
    ? settings.tableRowsJson.filter((row) => Array.isArray(row) && row.length >= 2)
    : [];
  const metricHeaders = headers.slice(1).filter(Boolean).slice(0, 6);
  if (metricHeaders.length < 2 || !rows.length) {
    return rawBlock;
  }

  const nextSettings = {
    title: String(settings.title || '').trim(),
    titleClassName: String(settings.titleClassName || '').trim(),
    titleHighlightsJson: settings.titleHighlightsJson || '',
    justify: 'center',
    cardCount: String(metricHeaders.length),
    fineprint: settings.fineprint || '',
    fineprintDisclosureId: String(settings.fineprintDisclosureId || '').trim(),
    fineprintJustify: 'center',
    fineprintSizeRem: 0.88,
    valueAlignment: String(settings.tableValueAlignment || '').trim(),
    fullBleed: Boolean(settings.fullBleed),
    spaceBeforeRem: Number.isFinite(Number(settings.spaceBeforeRem)) ? Number(settings.spaceBeforeRem) : 0,
    spaceAfterRem: Number.isFinite(Number(settings.spaceAfterRem)) ? Number(settings.spaceAfterRem) : 0,
    headerGapRem: Number.isFinite(Number(settings.headerGapRem)) ? Number(settings.headerGapRem) : 2.4,
    paddingTopRem: Number.isFinite(Number(settings.paddingTopRem)) ? Number(settings.paddingTopRem) : 2.4,
    paddingBottomRem: Number.isFinite(Number(settings.paddingBottomRem)) ? Number(settings.paddingBottomRem) : 2.4,
    cellPaddingRem: 0.9,
    cellTextSizeRem: 1.05,
    cellTextWeight: '650',
    contentMaxWidthPx: Number.isFinite(Number(settings.contentMaxWidthPx)) ? Number(settings.contentMaxWidthPx) : 980,
    anchorId: String(settings.anchorId || '').trim() || 'IRA-contribution-limits',
    sectionClassName: String(settings.sectionClassName || '').trim() || 'retirement-ira-native-limits',
  };

  metricHeaders.forEach((header, metricIndex) => {
    const slot = metricIndex + 1;
    nextSettings[`card${slot}Title`] = header;
    nextSettings[`card${slot}Color`] = ['atlantean', 'mango', 'melon', 'sandstone', 'super-grey', 'atlantean'][metricIndex];
    nextSettings[`card${slot}Bullets`] = rows
      .map((row) => {
        const label = String(row[0] || '').trim();
        const value = String(row[metricIndex + 1] || '').trim();
        return label && value ? `${label}: ${value}` : (label || value);
      })
      .filter(Boolean)
      .join('\n');
  });

  return {
    ...cloneJson(rawBlock),
    name: 'IRA Contribution Limits Chart',
    kind: 'card_chart',
    variant: 'default',
    settings: nextSettings,
  };
}

export function normalize403bContributionLimitsChart(pathname, rawBlock) {
  if (normalizeManagedContentPath(pathname) !== '/services/retirement/403b' || !isObject(rawBlock)) {
    return rawBlock;
  }
  if (String(rawBlock.id || '').trim() !== 'contribution_limits') {
    return rawBlock;
  }
  if (String(rawBlock.kind || '').trim().toLowerCase() === 'card_chart') {
    return rawBlock;
  }

  const settings = isObject(rawBlock.settings) ? rawBlock.settings : {};
  const headers = Array.isArray(settings.tableHeadersJson)
    ? settings.tableHeadersJson.map((value) => String(value || '').trim())
    : [];
  const rows = Array.isArray(settings.tableRowsJson)
    ? settings.tableRowsJson.filter((row) => Array.isArray(row) && row.length >= 2)
    : [];
  const metricHeaders = headers.slice(1).filter(Boolean).slice(0, 6);
  if (metricHeaders.length < 2 || !rows.length) {
    return rawBlock;
  }

  const nextSettings = {
    title: String(settings.title || '').trim(),
    titleClassName: String(settings.titleClassName || '').trim(),
    titleHighlightsJson: settings.titleHighlightsJson || '',
    justify: 'center',
    cardCount: String(metricHeaders.length),
    fineprint: settings.fineprint || '',
    fineprintDisclosureId: String(settings.fineprintDisclosureId || '').trim(),
    fineprintJustify: 'center',
    fineprintSizeRem: 0.88,
    valueAlignment: String(settings.tableValueAlignment || '').trim(),
    fullBleed: Boolean(settings.fullBleed),
    spaceBeforeRem: Number.isFinite(Number(settings.spaceBeforeRem)) ? Number(settings.spaceBeforeRem) : 0,
    spaceAfterRem: Number.isFinite(Number(settings.spaceAfterRem)) ? Number(settings.spaceAfterRem) : 0,
    headerGapRem: Number.isFinite(Number(settings.headerGapRem)) ? Number(settings.headerGapRem) : 2.4,
    paddingTopRem: Number.isFinite(Number(settings.paddingTopRem)) ? Number(settings.paddingTopRem) : 0,
    paddingBottomRem: Number.isFinite(Number(settings.paddingBottomRem)) ? Number(settings.paddingBottomRem) : 0,
    cellPaddingRem: 0.9,
    contentMaxWidthPx: Number.isFinite(Number(settings.contentMaxWidthPx)) ? Number(settings.contentMaxWidthPx) : 980,
    anchorId: String(settings.anchorId || '').trim(),
    sectionClassName: [
      String(settings.sectionClassName || '').trim(),
      'retirement-403b-native-contribution-limits',
    ].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(' '),
  };

  metricHeaders.forEach((header, metricIndex) => {
    const slot = metricIndex + 1;
    nextSettings[`card${slot}Title`] = header;
    nextSettings[`card${slot}Color`] = ['atlantean', 'mango', 'melon', 'sandstone', 'super-grey', 'atlantean'][metricIndex];
    nextSettings[`card${slot}Bullets`] = rows
      .map((row) => {
        const label = String(row[0] || '').trim();
        const value = String(row[metricIndex + 1] || '').trim();
        return label && value ? `${label}: ${value}` : (label || value);
      })
      .filter(Boolean)
      .join('\n');
  });

  return {
    ...cloneJson(rawBlock),
    name: 'Annual Contribution Limits Chart',
    kind: 'card_chart',
    settings: nextSettings,
  };
}

function normalizeLegacyIraComparisonChart(pathname, rawBlock) {
  if (normalizeManagedContentPath(pathname) !== '/services/retirement/iras' || !isObject(rawBlock)) {
    return rawBlock;
  }
  if (String(rawBlock.id || '').trim() !== 'comparison_table' || String(rawBlock.kind || '').trim() !== 'content') {
    return rawBlock;
  }

  const settings = isObject(rawBlock.settings) ? rawBlock.settings : {};
  const headers = Array.isArray(settings.tableHeadersJson) ? settings.tableHeadersJson : [];
  const rows = Array.isArray(settings.tableRowsJson) ? settings.tableRowsJson : [];
  const values = Array.isArray(rows[0]) ? rows[0] : [];
  if (headers.length < 2 || values.length < 2) {
    return rawBlock;
  }

  const nextSettings = { ...settings, cardCount: String(Math.min(6, headers.length)) };
  headers.slice(0, 6).forEach((header, index) => {
    nextSettings[`card${index + 1}Title`] = String(header || '').trim();
    nextSettings[`card${index + 1}Bullets`] = String(values[index] || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');
  });
  ['tableHeadersJson', 'tableRowsJson', 'tableValueAlignment', 'tableFirstColumnHeader', 'tableChartId'].forEach((key) => {
    delete nextSettings[key];
  });

  return {
    ...rawBlock,
    name: 'IRA Card Chart',
    kind: 'card_chart',
    settings: nextSettings,
  };
}

function parseLegacyCardGridPoints(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  const source = String(value || '').trim();
  if (!source) {
    return [];
  }
  try {
    const parsed = JSON.parse(source);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    }
  } catch {
    // Preserve hand-edited legacy values as newline-delimited points below.
  }
  return source.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function normalizeLegacyCharitableTrustTypeChart(pathname, rawBlock) {
  if (normalizeManagedContentPath(pathname) !== CHARITABLE_TRUSTS_PATH || !isObject(rawBlock)) {
    return rawBlock;
  }
  const blockId = String(rawBlock.id || '').trim();
  const chartMeta = {
    remainder_trust_type_cards: {
      name: 'Remainder Trust Type Chart',
      sectionClassName: 'legacy-child-native-trusts-crt-types',
    },
    lead_trust_type_cards: {
      name: 'Lead Trust Type Chart',
      sectionClassName: 'legacy-child-native-trusts-clt-types',
    },
  }[blockId];
  if (!chartMeta || String(rawBlock.kind || '').trim() !== 'card_grid') {
    return rawBlock;
  }

  const settings = isObject(rawBlock.settings) ? rawBlock.settings : {};
  const nextSettings = {
    title: String(settings.title || '').trim(),
    titleClassName: String(settings.titleClassName || '').trim(),
    titleHighlightsJson: String(settings.titleHighlightsJson || '').trim(),
    justify: 'center',
    cardCount: '2',
    card1Title: String(settings.card1Title || '').trim(),
    card1Color: 'atlantean',
    card1Bullets: parseLegacyCardGridPoints(settings.card1ListJson).join('\n'),
    card2Title: String(settings.card2Title || '').trim(),
    card2Color: 'mango',
    card2Bullets: parseLegacyCardGridPoints(settings.card2ListJson).join('\n'),
    fineprint: '',
    fineprintJustify: 'center',
    fineprintSizeRem: 0.88,
    fullBleed: false,
    spaceBeforeRem: 0,
    spaceAfterRem: 0,
    paddingTopRem: 2.4,
    paddingBottomRem: 2.4,
    cellPaddingRem: 0.9,
    contentMaxWidthPx: 1180,
    anchorId: String(settings.anchorId || '').trim(),
    sectionClassName: String(settings.sectionClassName || chartMeta.sectionClassName).trim(),
  };

  return {
    ...rawBlock,
    name: chartMeta.name,
    kind: 'card_chart',
    settings: nextSettings,
  };
}

function normalizeLegacyBlockFamily(rawBlock) {
  const kind = String(rawBlock?.kind || rawBlock?.type || '').trim().toLowerCase();
  const presetId = String(rawBlock?.presetId || '').trim().toLowerCase();
  const templateId = String(rawBlock?.templateId || '').trim().toLowerCase();
  const isLegacyCtaBand = kind === 'cta_band' || (kind === 'billboard' && presetId === 'cta-band');
  if (!isLegacyCtaBand) {
    return rawBlock;
  }

  const nextPresetId = presetId === 'dashboard-login' || templateId === 'dashboard_login_cta'
    ? 'dashboard-login'
    : 'default';
  return {
    ...rawBlock,
    kind: 'billboard',
    templateId: 'billboard',
    presetId: nextPresetId,
  };
}

export function isRetiredNonDynamicContentAdminBlock(block) {
  return isObject(block)
    && String(block.mode || '').trim().toLowerCase() === 'static';
}

/** Schema normalization plus declared presentation contracts. Inventory is untouched. */
export function normalizeContentAdminBlock(rawBlock) {
  if (!isObject(rawBlock)) {
    return cloneJson(rawBlock);
  }

  let nextBlock = normalizeLegacyBlockFamily(cloneJson(rawBlock));
  if (Object.prototype.hasOwnProperty.call(nextBlock, 'adminName')) {
    nextBlock.adminName = normalizeAdminBlockName(nextBlock.adminName);
  }
  if (!isObject(nextBlock.settings)) {
    return nextBlock;
  }
  nextBlock.settings = normalizeBlockSettings(nextBlock.settings);
  nextBlock = normalizePresetBearingBlockIdentity(nextBlock);
  nextBlock = normalizeBlockPresentation(nextBlock);

  if (Array.isArray(nextBlock.editableFields)) {
    nextBlock.editableFields = canonicalizeRouteLinkEditableFields(nextBlock.editableFields);
  }
  return nextBlock;
}

function migrateLegacyRouteAliases(state) {
  const source = state && typeof state === 'object' ? state : {};
  const pageHierarchy = cloneJson(source.pageHierarchy || {});
  const blocksByPath = cloneJson(source.blocksByPath || {});
  const collaborationByPath = cloneJson(source.collaborationByPath || {});
  const pathAliases = cloneJson(source.pathAliases || {});

  if (pageHierarchy[RETIRED_DAF_PATH] && !pageHierarchy[DAF_PATH]) {
    pageHierarchy[DAF_PATH] = {
      ...pageHierarchy[RETIRED_DAF_PATH],
      path: DAF_PATH,
      routeKey: DAF_PATH,
      linkRef: DAF_PATH,
      parentPath: PLANNED_GIVING_PATH,
    };
  }
  if (Array.isArray(blocksByPath[RETIRED_DAF_PATH]) && !Array.isArray(blocksByPath[DAF_PATH])) {
    blocksByPath[DAF_PATH] = blocksByPath[RETIRED_DAF_PATH];
  }
  if (collaborationByPath[RETIRED_DAF_PATH] && !collaborationByPath[DAF_PATH]) {
    collaborationByPath[DAF_PATH] = collaborationByPath[RETIRED_DAF_PATH];
  }
  delete pageHierarchy[RETIRED_DAF_PATH];
  delete blocksByPath[RETIRED_DAF_PATH];
  delete collaborationByPath[RETIRED_DAF_PATH];
  pathAliases[RETIRED_DAF_PATH] = DAF_PATH;
  pathAliases[LEGACY_DAF_PATH] = DAF_PATH;

  return { pageHierarchy, blocksByPath, pathAliases, collaborationByPath };
}

/** Versioned, non-inventory content migration. */
export function migrateContentAdminState(rawState, { fromVersion = 0 } = {}) {
  const source = isObject(rawState) ? rawState : {};
  const migrated = fromVersion < CONTENT_ADMIN_NORMALIZATION_VERSION
    ? migrateLegacyRouteAliases(source)
    : cloneJson(source);
  return migrated;
}

/**
 * Shared normal load/save normalizer. It never consults blueprints and never
 * changes block membership or order.
 */
export function normalizeContentAdminState(rawState, options = {}) {
  const source = isObject(rawState) ? rawState : {};
  const migrated = options.applyMigrations === false
    ? cloneJson(source)
    : migrateContentAdminState(source, options);
  const pageHierarchy = normalizePageHierarchy(migrated.pageHierarchy);
  const blocksByPathSource = isObject(migrated.blocksByPath) ? migrated.blocksByPath : {};
  const blocksByPath = Object.fromEntries(
    Object.entries(blocksByPathSource).map(([rawPath, rawBlocks]) => {
      const pathname = normalizeManagedContentPath(rawPath);
      return [pathname || rawPath, (Array.isArray(rawBlocks) ? rawBlocks : [])
        .filter((block) => !isRetiredNonDynamicContentAdminBlock(block))
        .map((block) => normalizeContentAdminBlock(
          normalizeRetirement403bRatesBlock(
            pathname,
            normalizeRetirementIraRatesBlock(
              pathname,
              normalizeIraContributionLimitsChart(
                pathname,
                normalize403bContributionLimitsChart(
                  pathname,
                  normalizeLegacyCharitableTrustTypeChart(
                    pathname,
                    normalizeLegacyIraComparisonChart(pathname, block),
                  ),
                ),
              ),
            ),
          ),
        ))];
    }),
  );

  return {
    pageHierarchy,
    blocksByPath,
    pathAliases: normalizePathAliases(migrated.pathAliases, pageHierarchy),
    collaborationByPath: normalizeCollaborationState(migrated.collaborationByPath, { maxHistoryEntries: Infinity }),
  };
}

export function normalizeContentAdminRecord(rawRecord) {
  const source = isObject(rawRecord) ? rawRecord : {};
  return {
    ...cloneJson(source),
    state: normalizeContentAdminState(source.state),
    baseSnapshot: normalizeContentAdminState(source.baseSnapshot),
  };
}

export function compactContentAdminBlock(rawBlock) {
  if (!isObject(rawBlock)) {
    return cloneJson(rawBlock);
  }
  const nextBlock = cloneJson(rawBlock);
  const kind = String(nextBlock.kind || '').trim();
  const mode = String(nextBlock.mode || '').trim().toLowerCase();
  if (mode !== 'static' && REGISTRY_BACKED_DYNAMIC_BLOCK_KINDS.has(kind)) {
    delete nextBlock.editableFields;
  }
  return nextBlock;
}

export function compactContentAdminState(rawState) {
  if (!isObject(rawState)) {
    return cloneJson(rawState);
  }
  const nextState = cloneJson(rawState);
  nextState.blocksByPath = Object.fromEntries(
    Object.entries(nextState.blocksByPath || {}).map(([pathname, blocks]) => [
      pathname,
      (Array.isArray(blocks) ? blocks : []).map(compactContentAdminBlock),
    ]),
  );
  return nextState;
}

export function compactContentAdminRecord(rawRecord) {
  if (!isObject(rawRecord)) {
    return cloneJson(rawRecord);
  }
  const nextRecord = cloneJson(rawRecord);
  nextRecord.state = compactContentAdminState(nextRecord.state);
  nextRecord.baseSnapshot = compactContentAdminState(nextRecord.baseSnapshot);
  nextRecord.revisionsByPath = Object.fromEntries(
    Object.entries(nextRecord.revisionsByPath || {}).map(([pathname, revisions]) => [
      pathname,
      (Array.isArray(revisions) ? revisions : []).map((revision) => ({
        ...revision,
        snapshot: revision?.snapshot
          ? {
            ...revision.snapshot,
            page: revision.snapshot.page,
            blocks: (Array.isArray(revision.snapshot.blocks) ? revision.snapshot.blocks : [])
              .map(compactContentAdminBlock),
          }
          : revision?.snapshot,
      })),
    ]),
  );
  return nextRecord;
}

/** Starter/reset initialization is explicit and only normalizes supplied starter data. */
export function initializeContentAdminStarterState(starterState) {
  return normalizeContentAdminState(starterState, { applyMigrations: false });
}

/** Explicit repair hook. Normalization itself never invokes this operation. */
export function applyExplicitContentAdminRepair(state, repair) {
  if (typeof repair !== 'function') {
    throw new TypeError('An explicit content-admin repair function is required.');
  }
  return repair(cloneJson(state));
}
