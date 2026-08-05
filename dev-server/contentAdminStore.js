import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { normalizePresetBearingBlocks } from '../src/lib/blockPresetIdentity.js';
import { defaultAnnouncement, normalizeAnnouncement } from '../src/lib/announcementConfig.js';
import { normalizeCalculatorIntroBlock, normalizeCalculatorWidgetBlock } from '../src/lib/calculatorWidgetIdentity.js';
import { normalizeBlockPresentation } from '../src/lib/blockPresentationContracts.js';
import {
  normalizeContentAdminBlock,
  normalizeContentAdminState,
  normalizeContentAdminRecord,
} from '../src/lib/contentAdminNormalization.js';
import { normalizeSharedOperationStatus } from '../src/lib/contentAdminCollaboration.js';
import { validateContentAdminStateSchema } from '../src/lib/contentAdminSnapshotSchema.js';
import {
  compareSeedRouteSlices,
  formatSeedRouteSliceDiffReport,
} from './seedRouteSliceComparison.js';
import {
  GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID,
  GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
  migrateGenerosityFundSnapshot,
  stripRetiredTargetBridgeSettingsFromBlock,
  stripRetiredTargetBridgeSettingsFromBlocks,
  stripRetiredTargetBridgeSettingsFromState,
} from '../src/lib/contentAdminSnapshotMigrations.js';
import {
  DEFAULT_CONTENT_ADMIN_RETENTION_POLICY,
  isAutomaticRetentionDeletionAllowed,
  normalizeContentAdminRetentionPolicy,
} from '../src/lib/contentAdminRetentionPolicy.js';

const DEFAULT_MAX_REVISIONS_PER_PAGE = 40;
const DEFAULT_MAX_AUTOMATIC_BACKUPS = 100;
const LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH = '/services/planned-giving/charitable-gift-annuities';
const LEGACY_GIVING_CHARITABLE_TRUSTS_PATH = '/services/planned-giving/charitable-trusts';
const LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH = '/services/planned-giving/ministry-impact-fund';
const LEGACY_GIVING_GENEROSITY_FUND_PATH = '/services/planned-giving/donor-advised-fund';
const RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH = '/services/planned-giving/generosity-fund';
const PLANNED_GIVING_GENEROSITY_FUND_LEGACY_PATH = '/services/legacy-giving/generosity-fund';
const GENEROSITY_FUND_DONOR_ADVISED_FUND_TITLE = 'Donor Advised Fund';
const RETIRED_CHARITABLE_TRUSTS_BLOCK_IDS = Object.freeze([
  'remainder_trust_how_it_works',
  'cta_trigger',
  'cta_form',
]);
const SHARED_CONTENT_BACKUP_FILE_PREFIX = 'content-admin-shared-';
const SHARED_CONTENT_BACKUP_FILE_SUFFIX = '.json';
const SHARED_CONTENT_SEED_BASELINE_FILE_NAME = 'content-admin-seed-baseline.json';

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function padTimestampSegment(value) {
  return String(value).padStart(2, '0');
}

function formatBackupTimestampToken(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = padTimestampSegment(date.getMonth() + 1);
  const day = padTimestampSegment(date.getDate());
  const hours = padTimestampSegment(date.getHours());
  const minutes = padTimestampSegment(date.getMinutes());
  const seconds = padTimestampSegment(date.getSeconds());
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function safeBackupMetadata(rawMetadata) {
  const source = rawMetadata && typeof rawMetadata === 'object' ? rawMetadata : {};
  return cloneJson(source) || {};
}

function defaultGitCommitHashResolver() {
  try {
    return String(
      execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    ).trim();
  } catch {
    return '';
  }
}

function normalizeActor(rawActor) {
  const source = rawActor && typeof rawActor === 'object' ? rawActor : null;
  if (!source) {
    return null;
  }
  const userId = String(source.userId || '').trim();
  const displayName = String(source.displayName || '').trim();
  if (!userId || !displayName) {
    return null;
  }
  return {
    userId,
    displayName,
    initials: String(source.initials || '').trim() || displayName.slice(0, 2).toUpperCase(),
    accentColor: String(source.accentColor || '').trim() || '#00adbb',
  };
}

function normalizeBlockMeta(rawMeta) {
  const source = rawMeta && typeof rawMeta === 'object' ? rawMeta : {};
  const normalizeTimestamp = (value) => (
    value == null || value === ''
      ? null
      : Number.isFinite(Number(value))
        ? Number(value)
        : null
  );
  return {
    draftedBy: normalizeActor(source.draftedBy),
    draftedAt: normalizeTimestamp(source.draftedAt),
    savedBy: normalizeActor(source.savedBy),
    savedAt: normalizeTimestamp(source.savedAt),
    lockedBy: normalizeActor(source.lockedBy),
    lockedAt: normalizeTimestamp(source.lockedAt),
  };
}

function normalizeHistoryEntry(rawEntry) {
  const source = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  const action = String(source.action || '').trim();
  const actor = normalizeActor(source.actor || source.createdBy);
  const createdAt = Number.isFinite(Number(source.createdAt)) ? Number(source.createdAt) : null;
  if (!action || !actor || !createdAt) {
    return null;
  }
  return {
    id: String(source.id || `${createdAt}-${action}`).trim() || `${createdAt}-${action}`,
    action,
    blockId: String(source.blockId || '').trim(),
    details: String(source.details || '').trim(),
    actor,
    previousActor: normalizeActor(source.previousActor),
    createdAt,
  };
}

function normalizeCollaborationByPath(rawState) {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const next = {};
  Object.entries(source).forEach(([pathname, rawEntry]) => {
    const entry = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
    const blocks = {};
    Object.entries(entry.blocks || {}).forEach(([blockId, rawMeta]) => {
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedBlockId) {
        return;
      }
      blocks[normalizedBlockId] = normalizeBlockMeta(rawMeta);
    });
    next[pathname] = {
      blocks,
      history: (Array.isArray(entry.history) ? entry.history : [])
        .map(normalizeHistoryEntry)
        .filter(Boolean),
    };
  });
  return next;
}

export function normalizeSharedState(rawState) {
  const normalized = normalizeContentAdminState(rawState);
  return {
    pageHierarchy: normalized.pageHierarchy,
    blocksByPath: Object.fromEntries(
      Object.entries(normalized.blocksByPath || {}).map(([pathname, blocks]) => [
        pathname,
        normalizePageBlocksState(pathname, blocks),
      ]),
    ),
    pathAliases: normalized.pathAliases,
    collaborationByPath: normalized.collaborationByPath,
  };
}

function normalizeStoredRecord(rawRecord, maxRevisionsPerPage) {
  const parsed = normalizeContentAdminRecord(rawRecord);
  const state = normalizeSharedState(parsed?.state);
  const baseSnapshot = normalizeSharedState(parsed?.baseSnapshot);
  const snapshotMigrations = parsed?.snapshotMigrations && typeof parsed.snapshotMigrations === 'object'
    ? cloneJson(parsed.snapshotMigrations)
    : null;
  return {
    initialized: Boolean(parsed?.initialized),
    version: 1,
    updatedAt: Number.isFinite(Number(parsed?.updatedAt)) ? Number(parsed.updatedAt) : 0,
    announcementUpdatedAt: Number.isFinite(Number(parsed?.announcementUpdatedAt))
      ? Number(parsed.announcementUpdatedAt)
      : 0,
    announcement: normalizeAnnouncement(parsed?.announcement),
    // Preserve persisted ownership metadata on load. The browser derives stale
    // draft presentation from active/base equivalence; loading must not rewrite
    // an otherwise valid record or silently erase its audit trail.
    state,
    baseSnapshot,
    revisionsByPath: Object.fromEntries(
      Object.entries(parsed?.revisionsByPath || {}).map(([pathname, revisions]) => [
        pathname,
        (Array.isArray(revisions) ? revisions : [])
          .map(normalizeRevisionRecord)
          .filter(Boolean)
          .slice(0, maxRevisionsPerPage),
      ]),
    ),
    ...(snapshotMigrations ? { snapshotMigrations } : {}),
  };
}

function summarizeDestructiveSharedStateChanges(currentState, incomingState) {
  const current = normalizeSharedState(currentState);
  const incoming = normalizeSharedState(incomingState);
  const removedPagePaths = Object.keys(current.pageHierarchy || {}).filter((pathname) => !incoming.pageHierarchy?.[pathname]);
  const removedBlocksByPath = {};

  Object.keys(current.blocksByPath || {}).forEach((pathname) => {
    const currentBlockIds = new Set(
      (Array.isArray(current.blocksByPath?.[pathname]) ? current.blocksByPath[pathname] : [])
        .map((block) => String(block?.id || '').trim())
        .filter(Boolean),
    );
    const incomingBlockIds = new Set(
      (Array.isArray(incoming.blocksByPath?.[pathname]) ? incoming.blocksByPath[pathname] : [])
        .map((block) => String(block?.id || '').trim())
        .filter(Boolean),
    );
    const removedBlockIds = Array.from(currentBlockIds).filter((blockId) => !incomingBlockIds.has(blockId));
    if (removedBlockIds.length) {
      removedBlocksByPath[pathname] = removedBlockIds;
    }
  });

  return {
    hasDestructiveChanges: Boolean(removedPagePaths.length || Object.keys(removedBlocksByPath).length),
    removedPagePaths,
    removedBlocksByPath,
  };
}

function buildHistoryEntry({ action, blockId = '', actor, details = '', previousActor = null, now = Date.now(), createId }) {
  const normalizedActor = normalizeActor(actor);
  if (!normalizedActor) {
    return null;
  }
  return {
    id: createId(now),
    action: String(action || '').trim(),
    blockId: String(blockId || '').trim(),
    details: String(details || '').trim(),
    actor: normalizedActor,
    previousActor: normalizeActor(previousActor),
    createdAt: now,
  };
}

function appendHistoryEntry(history, entry) {
  const current = Array.isArray(history) ? history : [];
  const normalizedEntry = normalizeHistoryEntry(entry);
  if (!normalizedEntry) {
    return current;
  }
  return [normalizedEntry, ...current];
}

function ensureCollaborationEntry(collaborationByPath, pathname) {
  const normalizedPath = String(pathname || '').trim();
  return collaborationByPath[normalizedPath] || { blocks: {}, history: [] };
}

function indexBlocksById(blocks) {
  const source = Array.isArray(blocks) ? blocks : [];
  return new Map(
    source
      .map((block) => [String(block?.id || '').trim(), cloneJson(block)])
      .filter(([blockId]) => blockId),
  );
}

function areBlocksEquivalent(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function mergeHistoryLists(currentHistory, incomingHistory) {
  const byId = new Map();
  [...(Array.isArray(currentHistory) ? currentHistory : []), ...(Array.isArray(incomingHistory) ? incomingHistory : [])]
    .map(normalizeHistoryEntry)
    .filter(Boolean)
    .forEach((entry) => {
      byId.set(entry.id, entry);
    });
  return Array.from(byId.values()).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function getOtherActorConflict(meta, actor) {
  const normalizedMeta = normalizeBlockMeta(meta);
  const normalizedActor = normalizeActor(actor);
  const lockedBy = normalizedMeta.lockedBy;
  if (lockedBy?.userId && lockedBy.userId !== normalizedActor?.userId) {
    return {
      reason: 'locked-by-other',
      owner: lockedBy,
      state: 'editing-other',
    };
  }
  if (lockedBy?.userId && lockedBy.userId === normalizedActor?.userId) {
    return null;
  }
  const draftedBy = normalizedMeta.draftedBy;
  if (draftedBy?.userId && draftedBy.userId !== normalizedActor?.userId) {
    return {
      reason: 'drafted-by-other',
      owner: draftedBy,
      state: 'drafted-other',
    };
  }
  return null;
}

function buildSavedBlockMeta(currentMeta, actor, timestamp) {
  const normalizedCurrent = normalizeBlockMeta(currentMeta);
  const normalizedActor = normalizeActor(actor);
  if (!normalizedActor) {
    return normalizedCurrent;
  }
  return {
    draftedBy: normalizedActor,
    draftedAt: timestamp,
    savedBy: normalizedActor,
    savedAt: timestamp,
    lockedBy: null,
    lockedAt: null,
  };
}

function buildSyncedDraftBlockMeta(currentMeta, actor, timestamp) {
  const normalizedCurrent = normalizeBlockMeta(currentMeta);
  const normalizedActor = normalizeActor(actor);
  if (!normalizedActor) {
    return normalizedCurrent;
  }
  const keepsOwnLock = normalizedCurrent.lockedBy?.userId === normalizedActor.userId;
  return {
    draftedBy: normalizedActor,
    draftedAt: timestamp,
    savedBy: normalizedCurrent.savedBy,
    savedAt: normalizedCurrent.savedAt,
    lockedBy: keepsOwnLock ? normalizedCurrent.lockedBy || normalizedActor : null,
    lockedAt: keepsOwnLock ? timestamp : null,
  };
}

function getForeignOwnershipMeta(meta, actor) {
  const normalizedMeta = normalizeBlockMeta(meta);
  const normalizedActor = normalizeActor(actor);
  const lockedByOther = normalizedMeta.lockedBy?.userId && normalizedMeta.lockedBy.userId !== normalizedActor?.userId
    ? normalizedMeta.lockedBy
    : null;
  const draftedByOther = normalizedMeta.draftedBy?.userId && normalizedMeta.draftedBy.userId !== normalizedActor?.userId
    ? normalizedMeta.draftedBy
    : null;
  return {
    lockedByOther,
    draftedByOther,
  };
}

function mergePageDraftForSafeSave(pathname, currentState, incomingState, actor, { now: getNow, createId }) {
  const timestamp = getNow();
  const currentBlocks = Array.isArray(currentState?.blocksByPath?.[pathname]) ? currentState.blocksByPath[pathname] : [];
  const incomingBlocks = Array.isArray(incomingState?.blocksByPath?.[pathname]) ? incomingState.blocksByPath[pathname] : [];
  const currentById = indexBlocksById(currentBlocks);
  const incomingById = indexBlocksById(incomingBlocks);
  const currentEntry = ensureCollaborationEntry(currentState?.collaborationByPath || {}, pathname);
  const incomingEntry = ensureCollaborationEntry(incomingState?.collaborationByPath || {}, pathname);

  const allBlockIds = new Set([
    ...currentById.keys(),
    ...incomingById.keys(),
  ]);
  const changedBlockIds = [...allBlockIds].filter((blockId) => (
    !areBlocksEquivalent(currentById.get(blockId), incomingById.get(blockId))
  ));

  const blockedBlocks = [];
  const blockedBlockIdSet = new Set();
  changedBlockIds.forEach((blockId) => {
    const conflict = getOtherActorConflict(currentEntry.blocks?.[blockId], actor);
    if (!conflict) {
      return;
    }
    blockedBlockIdSet.add(blockId);
    blockedBlocks.push({
      pathname,
      blockId,
      reason: conflict.reason,
      owner: cloneJson(conflict.owner),
      state: conflict.state,
    });
  });

  const currentOrder = currentBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  const incomingOrder = incomingBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  const hasStructuralDiff = JSON.stringify(currentOrder) !== JSON.stringify(incomingOrder);
  const hasBlockedStructuralConflict = hasStructuralDiff && blockedBlockIdSet.size > 0;

  let mergedBlocks;
  if (hasBlockedStructuralConflict) {
    const next = [];
    currentBlocks.forEach((block) => {
      const blockId = String(block?.id || '').trim();
      if (!blockId) {
        return;
      }
      if (blockedBlockIdSet.has(blockId)) {
        next.push(cloneJson(block));
        return;
      }
      if (incomingById.has(blockId)) {
        next.push(cloneJson(incomingById.get(blockId)));
      }
    });
    incomingBlocks.forEach((block) => {
      const blockId = String(block?.id || '').trim();
      if (!blockId || currentById.has(blockId)) {
        return;
      }
      next.push(cloneJson(block));
    });
    mergedBlocks = next;
  } else {
    mergedBlocks = incomingBlocks.map((block) => {
      const blockId = String(block?.id || '').trim();
      if (blockId && blockedBlockIdSet.has(blockId) && currentById.has(blockId)) {
        return cloneJson(currentById.get(blockId));
      }
      return cloneJson(block);
    });
  }

  const savedBlockIds = [];
  const nextBlocksMeta = {};
  const mergedBlockIds = mergedBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  mergedBlockIds.forEach((blockId) => {
    const incomingBlock = incomingById.get(blockId);
    const currentBlock = currentById.get(blockId);
    const currentMeta = currentEntry.blocks?.[blockId];
    if (blockedBlockIdSet.has(blockId)) {
      nextBlocksMeta[blockId] = normalizeBlockMeta(currentMeta);
      return;
    }
    if (!areBlocksEquivalent(currentBlock, incomingBlock)) {
      savedBlockIds.push(blockId);
      nextBlocksMeta[blockId] = buildSavedBlockMeta(currentMeta, actor, timestamp);
      return;
    }
    nextBlocksMeta[blockId] = normalizeBlockMeta(currentMeta || incomingEntry.blocks?.[blockId]);
  });

  const mergedHistory = mergeHistoryLists(currentEntry.history, incomingEntry.history);
  let nextHistory = mergedHistory;
  savedBlockIds.forEach((blockId) => {
    nextHistory = appendHistoryEntry(nextHistory, buildHistoryEntry({
      action: 'block-draft-saved',
      blockId,
      actor,
      now: timestamp,
      createId,
    }));
  });
  blockedBlocks.forEach((entry) => {
    nextHistory = appendHistoryEntry(nextHistory, buildHistoryEntry({
      action: 'block-save-blocked',
      blockId: entry.blockId,
      actor,
      previousActor: entry.owner,
      details: entry.reason,
      now: timestamp,
      createId,
    }));
  });

  return {
    blocks: mergedBlocks,
    collaborationEntry: {
      ...currentEntry,
      blocks: nextBlocksMeta,
      history: nextHistory,
    },
    blockedBlocks,
    blockedBlockIds: blockedBlocks.map((entry) => entry.blockId),
    savedBlockIds,
  };
}

function releaseUserLocks(collaborationByPath, userId, { keepPath = '', keepBlockId = '' } = {}) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return collaborationByPath;
  }
  let changed = false;
  const next = {};
  Object.entries(collaborationByPath || {}).forEach(([pathname, entry]) => {
    const blocks = entry?.blocks || {};
    let blockChanged = false;
    const nextBlocks = {};
    Object.entries(blocks).forEach(([blockId, rawMeta]) => {
      const meta = normalizeBlockMeta(rawMeta);
      const keep = pathname === keepPath && blockId === keepBlockId;
      if (!keep && meta.lockedBy?.userId === normalizedUserId) {
        blockChanged = true;
        nextBlocks[blockId] = { ...meta, lockedBy: null, lockedAt: null };
        return;
      }
      nextBlocks[blockId] = meta;
    });
    next[pathname] = blockChanged ? { ...entry, blocks: nextBlocks } : entry;
    changed = changed || blockChanged;
  });
  return changed ? next : collaborationByPath;
}

function aliasesForPath(pathAliases, pathname) {
  const normalizedPath = String(pathname || '').trim();
  const entries = {};
  Object.entries(pathAliases || {}).forEach(([fromPath, toPath]) => {
    if (String(toPath || '').trim() === normalizedPath) {
      entries[fromPath] = toPath;
    }
  });
  return entries;
}

function normalizeGenerosityFundHeroSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  return {
    ...settings,
    button1Label: 'Open a traditional DAF',
    button1LinkJson: '{"kind":"anchor","openInNewWindow":false,"href":"#traditional-daf-form"}',
    button1Style: 'outline',
    button1Tone: 'super-grey',
    button1Action: '',
    button1TargetAnchorId: '',
    button1TargetBlockId: '',
    button2Label: 'Open a Generosity Fund®',
    button2LinkJson: '{"kind":"external","openInNewWindow":false,"href":"https://secure.agfinancial.org/generosityfund/signup"}',
    button2Style: 'blue',
    button2Tone: 'atlantean',
    button2Action: '',
    button2TargetAnchorId: '',
    button2TargetBlockId: '',
  };
}

function normalizeGenerosityFundJoyfulGivingBillboardSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const next = { ...settings };
  next.titleFontFamily = 'helv';
  next.titleFontWeight = 700;
  next.titleSizeRem = 5.6;
  next.titleLetterSpacingEm = -0.03;
  const button2Label = String(next.button2Label || '').trim();
  const button2DocumentId = String(next.button2DocumentId || '').trim();
  const button2Style = String(next.button2Style || '').trim().toLowerCase();
  const button2Tone = String(next.button2Tone || '').trim().toLowerCase();
  const hasStaleTermsButtonStyle = (
    button2Label === 'Terms and Conditions'
    && button2DocumentId === 'document-planned-giving-terms-and-conditions'
    && (!button2Style || button2Style === 'blue')
    && (!button2Tone || button2Tone === 'atlantean')
  );

  if (hasStaleTermsButtonStyle) {
    next.button2Style = 'ghost';
    next.button2Tone = 'super-grey';
  }

  return next;
}

function normalizeGenerosityFundHowItWorksSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  return {
    ...settings,
    buttonLabel: 'Open a traditional DAF',
    buttonLinkJson: '{"kind":"anchor","openInNewWindow":false,"href":"#traditional-daf-form"}',
    buttonStyle: 'outline',
    buttonTone: 'super-grey',
  };
}

function normalizeGenerosityFundGiftAssetsSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  return {
    ...settings,
    card1Button2Label: 'Open a traditional DAF',
    card1Button2LinkJson: '{"kind":"anchor","openInNewWindow":false,"href":"#traditional-daf-form"}',
  };
}

function normalizeGenerosityFundRouteLabelInJsonString(value) {
  const source = String(value || '').trim();
  const retiredRouteRefs = [
    RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH,
    PLANNED_GIVING_GENEROSITY_FUND_LEGACY_PATH,
  ];
  if (
    !source
    || (
      !source.includes(LEGACY_GIVING_GENEROSITY_FUND_PATH)
      && !retiredRouteRefs.some((routeRef) => source.includes(routeRef))
    )
  ) {
    return value;
  }

  try {
    const parsed = JSON.parse(source);
    let changed = false;
    const visit = (node) => {
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      if (!node || typeof node !== 'object') {
        return;
      }
      ['path', 'to', 'href'].forEach((key) => {
        const pathValue = String(node[key] || '').trim();
        if (retiredRouteRefs.includes(pathValue)) {
          node[key] = LEGACY_GIVING_GENEROSITY_FUND_PATH;
          changed = true;
        }
        if (
          node[key] === LEGACY_GIVING_GENEROSITY_FUND_PATH
          && typeof node.label === 'string'
          && node.label !== GENEROSITY_FUND_DONOR_ADVISED_FUND_TITLE
        ) {
          node.label = GENEROSITY_FUND_DONOR_ADVISED_FUND_TITLE;
          changed = true;
        }
      });
      Object.values(node).forEach(visit);
    };

    visit(parsed);
    return changed ? JSON.stringify(parsed, null, 2) : value;
  } catch {
    return value;
  }
}

function normalizeGenerosityFundRouteLabelsInSettings(rawSettings) {
  if (!rawSettings || typeof rawSettings !== 'object') {
    return rawSettings;
  }

  let changed = false;
  const next = { ...rawSettings };
  Object.entries(next).forEach(([key, value]) => {
    const retiredRouteRefs = [
      RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH,
      PLANNED_GIVING_GENEROSITY_FUND_LEGACY_PATH,
    ];
    if (
      typeof value !== 'string'
      || (
        !value.includes(LEGACY_GIVING_GENEROSITY_FUND_PATH)
        && !retiredRouteRefs.some((routeRef) => value.includes(routeRef))
      )
    ) {
      return;
    }
    const normalizedValue = normalizeGenerosityFundRouteLabelInJsonString(value);
    if (normalizedValue !== value) {
      next[key] = normalizedValue;
      changed = true;
    }
  });

  return changed ? next : rawSettings;
}

function canonicalizeRouteLinkEditableFields(editableFields) {
  if (!Array.isArray(editableFields)) {
    return editableFields;
  }
  const canonicalFields = editableFields.map((field) => {
    const fieldId = String(field?.id || '').trim();
    if (!field || typeof field !== 'object' || field.type !== 'route_link') {
      return field;
    }
    const routeRefFieldId = String(field.routeRefFieldId || '').trim();
    const legacyHrefFieldId = String(field.legacyHrefFieldId || (fieldId.endsWith('LinkJson') ? '' : fieldId) || '').trim();
    const baseFieldId = String(routeRefFieldId || legacyHrefFieldId || fieldId).replace(/(?:PageRef|Url|Path|Href|LinkJson)$/, '');
    const linkJsonFieldId = String(field.linkJsonFieldId || (fieldId.endsWith('LinkJson') ? fieldId : '') || (baseFieldId ? `${baseFieldId}LinkJson` : '')).trim();
    const {
      legacyHrefFieldId: _legacyHrefFieldId,
      routeRefFieldId: _routeRefFieldId,
      linkJsonFieldId: _linkJsonFieldId,
      openInNewWindowFieldId: _openInNewWindowFieldId,
      ...fieldWithoutLegacyMetadata
    } = field;
    return {
      ...fieldWithoutLegacyMetadata,
      id: linkJsonFieldId || fieldId,
    };
  });
  return canonicalFields.filter((field) => {
    const fieldId = String(field?.id || '').trim();
    return !fieldId.endsWith('PageRef') && !fieldId.endsWith('OpenInNewWindow');
  });
}

function normalizeLegacyPageBlockState(pathname, block) {
  const nextBlock = normalizeContentAdminBlock(block);
  if (
    pathname === LEGACY_GIVING_GENEROSITY_FUND_PATH
    && String(nextBlock?.id || '').trim() === 'hero'
    && String(nextBlock?.kind || '').trim().toLowerCase() === 'hero'
    && String(nextBlock?.mode || '').trim().toLowerCase() === 'dynamic'
  ) {
    nextBlock.settings = normalizeGenerosityFundHeroSettings(nextBlock?.settings);
  }
  if (
    pathname === LEGACY_GIVING_GENEROSITY_FUND_PATH
    && String(nextBlock?.id || '').trim() === 'joyful_giving_billboard'
    && String(nextBlock?.kind || '').trim().toLowerCase() === 'billboard'
    && String(nextBlock?.mode || '').trim().toLowerCase() === 'dynamic'
  ) {
    nextBlock.settings = normalizeGenerosityFundJoyfulGivingBillboardSettings(nextBlock?.settings);
  }
  if (
    pathname === LEGACY_GIVING_GENEROSITY_FUND_PATH
    && String(nextBlock?.id || '').trim() === 'how_it_works'
    && String(nextBlock?.kind || '').trim().toLowerCase() === 'columns'
    && String(nextBlock?.mode || '').trim().toLowerCase() === 'dynamic'
  ) {
    nextBlock.settings = normalizeGenerosityFundHowItWorksSettings(nextBlock?.settings);
  }
  if (
    pathname === LEGACY_GIVING_GENEROSITY_FUND_PATH
    && String(nextBlock?.id || '').trim() === 'gift_assets'
    && String(nextBlock?.kind || '').trim().toLowerCase() === 'card_grid'
    && String(nextBlock?.mode || '').trim().toLowerCase() === 'dynamic'
  ) {
    nextBlock.settings = normalizeGenerosityFundGiftAssetsSettings(nextBlock?.settings);
  }
  if (nextBlock?.settings && typeof nextBlock.settings === 'object') {
    nextBlock.settings = normalizeGenerosityFundRouteLabelsInSettings(nextBlock.settings);
  }
  return normalizeBlockPresentation(nextBlock);
}

function normalizePageBlockState(_pathname, block) {
  return normalizeContentAdminBlock(block);
}

function normalizePageBlocksState(pathname, blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => normalizePageBlockState(pathname, block));
}

function normalizeBlocksWithoutInventoryRepair(pathname, blocks) {
  return normalizePageBlocksState(pathname, blocks);
}

function normalizeCollaborationForExistingBlocks(pathname, collaboration, pageBlocks) {
  const existingBlockIds = new Set(
    normalizePageBlocksState(pathname, pageBlocks)
      .map((block) => String(block?.id || '').trim())
      .filter(Boolean),
  );
  const source = collaboration && typeof collaboration === 'object'
    ? collaboration
    : { blocks: {}, history: [] };
  const blockMetaById = {};

  Object.entries(source.blocks || {}).forEach(([blockId, meta]) => {
    if (existingBlockIds.has(String(blockId || '').trim())) {
      blockMetaById[blockId] = cloneJson(meta);
    }
  });

  return {
    ...cloneJson(source),
    blocks: blockMetaById,
    history: (Array.isArray(source.history) ? source.history : [])
      .filter((entry) => {
        const blockId = String(entry?.blockId || '').trim();
        return !blockId || existingBlockIds.has(blockId);
      })
      .map(cloneJson),
  };
}

function normalizeSharedStateWithoutInventoryRepair(state) {
  const source = normalizeSharedState(state);
  const collaborationByPath = { ...(source.collaborationByPath || {}) };

  Object.entries(source.blocksByPath || {}).forEach(([pathname, blocks]) => {
    collaborationByPath[pathname] = normalizeCollaborationForExistingBlocks(
      pathname,
      source.collaborationByPath?.[pathname],
      blocks,
    );
  });

  return {
    ...source,
    collaborationByPath,
  };
}

function normalizeRecordWithoutInventoryRepair(recordToReconcile, maxRevisionsPerPage = DEFAULT_MAX_REVISIONS_PER_PAGE) {
  const source = normalizeStoredRecord(recordToReconcile, maxRevisionsPerPage);
  const nextRevisionsByPath = {};

  Object.entries(source.revisionsByPath || {}).forEach(([pathname, revisions]) => {
    nextRevisionsByPath[pathname] = (Array.isArray(revisions) ? revisions : []).map((revision) => ({
      ...revision,
      snapshot: {
        ...(revision.snapshot || {}),
        blocks: normalizeBlocksWithoutInventoryRepair(
          pathname,
          revision.snapshot?.blocks,
        ),
        collaboration: normalizeCollaborationForExistingBlocks(
          pathname,
          revision.snapshot?.collaboration,
          revision.snapshot?.blocks,
        ),
      },
    }));
  });

  return {
    ...source,
    state: normalizeSharedStateWithoutInventoryRepair(source.state),
    baseSnapshot: normalizeSharedStateWithoutInventoryRepair(source.baseSnapshot),
    revisionsByPath: nextRevisionsByPath,
  };
}

function summarizePageAuthoringDiff(currentState, baselineState, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return {
      changedBlockIds: [],
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasChanges: false,
    };
  }

  const current = normalizeSharedState(currentState);
  const baseline = normalizeSharedState(baselineState);
  const currentBlocks = normalizePageBlocksState(normalizedPath, current.blocksByPath?.[normalizedPath]);
  const baselineBlocks = normalizePageBlocksState(normalizedPath, baseline.blocksByPath?.[normalizedPath]);
  const currentBlockIds = currentBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  const baselineBlockIds = baselineBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean);
  const orderedBlockIds = [...new Set([...currentBlockIds, ...baselineBlockIds])];
  const currentBlockById = new Map(currentBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const baselineBlockById = new Map(baselineBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const hasOrderChanges = JSON.stringify(currentBlockIds) !== JSON.stringify(baselineBlockIds);
  const changedBlockIds = orderedBlockIds.filter((blockId) => (
    JSON.stringify(currentBlockById.get(blockId) || null) !== JSON.stringify(baselineBlockById.get(blockId) || null)
  ));
  const hasPageMetaChanges = JSON.stringify({
    page: current.pageHierarchy?.[normalizedPath] || null,
    aliases: aliasesForPath(current.pathAliases, normalizedPath),
  }) !== JSON.stringify({
    page: baseline.pageHierarchy?.[normalizedPath] || null,
    aliases: aliasesForPath(baseline.pathAliases, normalizedPath),
  });

  return {
    changedBlockIds,
    changedBlockCount: changedBlockIds.length,
    hasOrderChanges,
    hasPageMetaChanges,
    hasChanges: Boolean(changedBlockIds.length || hasOrderChanges || hasPageMetaChanges),
  };
}

function replacePageSlice(targetState, sourceState, pathname, collaborationEntryOverride = undefined) {
  const normalizedPath = String(pathname || '').trim();
  const nextState = normalizeSharedState(targetState);
  const normalizedSource = normalizeSharedState(sourceState);
  if (!normalizedPath) {
    return nextState;
  }

  const nextPage = normalizedSource.pageHierarchy?.[normalizedPath] || null;
  if (nextPage) {
    nextState.pageHierarchy[normalizedPath] = cloneJson(nextPage);
  } else {
    delete nextState.pageHierarchy[normalizedPath];
  }

  nextState.blocksByPath[normalizedPath] = cloneJson(normalizedSource.blocksByPath?.[normalizedPath] || []);

  Object.keys(nextState.pathAliases || {}).forEach((fromPath) => {
    const toPath = nextState.pathAliases[fromPath];
    if (String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath) {
      delete nextState.pathAliases[fromPath];
    }
  });
  Object.assign(nextState.pathAliases, aliasesForPath(normalizedSource.pathAliases, normalizedPath));

  nextState.collaborationByPath[normalizedPath] = cloneJson(
    collaborationEntryOverride || normalizedSource.collaborationByPath?.[normalizedPath] || { blocks: {}, history: [] },
  );
  return nextState;
}

function replaceBlockInPageSlice(targetState, sourceState, pathname, blockId, collaborationEntryOverride = undefined) {
  const normalizedPath = String(pathname || '').trim();
  const normalizedBlockId = String(blockId || '').trim();
  const nextState = normalizeSharedState(targetState);
  const normalizedSource = normalizeSharedState(sourceState);
  if (!normalizedPath || !normalizedBlockId) {
    return nextState;
  }

  const sourceBlocks = Array.isArray(normalizedSource.blocksByPath?.[normalizedPath])
    ? normalizedSource.blocksByPath[normalizedPath]
    : [];
  const sourceBlock = sourceBlocks.find((block) => String(block?.id || '').trim() === normalizedBlockId);
  const targetBlocks = Array.isArray(nextState.blocksByPath?.[normalizedPath])
    ? nextState.blocksByPath[normalizedPath]
    : [];
  const targetIndex = targetBlocks.findIndex((block) => String(block?.id || '').trim() === normalizedBlockId);
  if (sourceBlock && targetIndex >= 0) {
    targetBlocks.splice(targetIndex, 1, cloneJson(sourceBlock));
  } else if (sourceBlock) {
    targetBlocks.push(cloneJson(sourceBlock));
  } else if (targetIndex >= 0) {
    targetBlocks.splice(targetIndex, 1);
  }
  nextState.blocksByPath[normalizedPath] = targetBlocks;
  nextState.collaborationByPath[normalizedPath] = cloneJson(
    collaborationEntryOverride || normalizedSource.collaborationByPath?.[normalizedPath] || { blocks: {}, history: [] },
  );
  return nextState;
}

function mutableSharedStateShell(state) {
  const source = state && typeof state === 'object' ? cloneJson(state) : {};
  return {
    ...source,
    pageHierarchy: source.pageHierarchy && typeof source.pageHierarchy === 'object'
      ? source.pageHierarchy
      : {},
    blocksByPath: source.blocksByPath && typeof source.blocksByPath === 'object'
      ? source.blocksByPath
      : {},
    pathAliases: source.pathAliases && typeof source.pathAliases === 'object'
      ? source.pathAliases
      : {},
    collaborationByPath: source.collaborationByPath && typeof source.collaborationByPath === 'object'
      ? source.collaborationByPath
      : {},
  };
}

function copySeedRouteSlice(targetState, seedState, pathname, collaborationEntryOverride = undefined) {
  const normalizedPath = String(pathname || '').trim();
  const nextState = mutableSharedStateShell(targetState);
  const normalizedSeed = normalizeSharedState(seedState);
  if (!normalizedPath) {
    return nextState;
  }

  const seedPage = normalizedSeed.pageHierarchy?.[normalizedPath] || null;
  if (seedPage) {
    nextState.pageHierarchy[normalizedPath] = cloneJson(seedPage);
  } else {
    delete nextState.pageHierarchy[normalizedPath];
  }

  nextState.blocksByPath[normalizedPath] = normalizePageBlocksState(
    normalizedPath,
    normalizedSeed.blocksByPath?.[normalizedPath],
  );

  Object.keys(nextState.pathAliases || {}).forEach((fromPath) => {
    const toPath = nextState.pathAliases[fromPath];
    if (String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath) {
      delete nextState.pathAliases[fromPath];
    }
  });
  Object.assign(nextState.pathAliases, aliasesForPath(normalizedSeed.pathAliases, normalizedPath));

  nextState.collaborationByPath[normalizedPath] = cloneJson(
    collaborationEntryOverride || nextState.collaborationByPath?.[normalizedPath] || { blocks: {}, history: [] },
  );
  return nextState;
}

function buildRevisionSnapshot(state, pathname) {
  const normalizedState = normalizeSharedState(state);
  return {
    pathname,
    page: cloneJson(normalizedState.pageHierarchy?.[pathname] || null),
    blocks: cloneJson(normalizedState.blocksByPath?.[pathname] || []),
    collaboration: cloneJson(normalizedState.collaborationByPath?.[pathname] || { blocks: {}, history: [] }),
    pathAliases: aliasesForPath(normalizedState.pathAliases, pathname),
  };
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function resolveRevisionSnapshotPageSlice(snapshot, pathname) {
  const normalizedPath = String(pathname || snapshot?.pathname || '').trim();
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const hasPageSliceFields = (
    hasOwn(source, 'page')
    || hasOwn(source, 'blocks')
    || hasOwn(source, 'collaboration')
    || hasOwn(source, 'pathAliases')
  );
  if (hasPageSliceFields) {
    return {
      pathname: normalizedPath,
      page: cloneJson(source.page || null),
      blocks: cloneJson(normalizePageBlocksState(normalizedPath, Array.isArray(source.blocks) ? source.blocks : [])),
      collaboration: cloneJson(
        source.collaboration && typeof source.collaboration === 'object'
          ? source.collaboration
          : { blocks: {}, history: [] },
      ),
      pathAliases: cloneJson(
        source.pathAliases && typeof source.pathAliases === 'object'
          ? source.pathAliases
          : {},
      ),
    };
  }

  const normalizedState = normalizeSharedState(source.state);
  return {
    pathname: normalizedPath,
    page: cloneJson(normalizedState.pageHierarchy?.[normalizedPath] || null),
    blocks: cloneJson(normalizedState.blocksByPath?.[normalizedPath] || []),
    collaboration: cloneJson(
      normalizedState.collaborationByPath?.[normalizedPath] || { blocks: {}, history: [] },
    ),
    pathAliases: aliasesForPath(normalizedState.pathAliases, normalizedPath),
  };
}

function summarizeRevisionBlocksForHistory(snapshot) {
  const blocks = Array.isArray(snapshot?.blocks) ? snapshot.blocks : [];
  return blocks.map((block) => {
    const settings = block?.settings && typeof block.settings === 'object' ? block.settings : {};
    const title = String(
      settings.title
      || settings.heading
      || settings.line1Text
      || settings.leftTitle
      || settings.card1Title
      || ''
    ).trim();
    return {
      id: String(block?.id || '').trim(),
      kind: String(block?.kind || block?.type || '').trim(),
      label: String(block?.name || '').trim() || title || String(block?.kind || block?.type || 'Block').trim() || 'Block',
    };
  }).filter((block) => block.id);
}

function snapshotSignature(state, pathname) {
  return JSON.stringify(buildRevisionSnapshot(state, pathname));
}

function collectChangedPaths(prevState, nextState) {
  const prevPaths = new Set([
    ...Object.keys(prevState?.pageHierarchy || {}),
    ...Object.keys(prevState?.blocksByPath || {}),
    ...Object.keys(prevState?.collaborationByPath || {}),
  ]);
  const nextPaths = new Set([
    ...Object.keys(nextState?.pageHierarchy || {}),
    ...Object.keys(nextState?.blocksByPath || {}),
    ...Object.keys(nextState?.collaborationByPath || {}),
  ]);
  const allPaths = new Set([...prevPaths, ...nextPaths]);
  return [...allPaths].filter((pathname) => snapshotSignature(prevState, pathname) !== snapshotSignature(nextState, pathname));
}

function clearPublishedDraftOwnership(meta) {
  const normalizedMeta = normalizeBlockMeta(meta);
  return {
    draftedBy: null,
    draftedAt: null,
    savedBy: normalizedMeta.savedBy,
    savedAt: normalizedMeta.savedAt,
    lockedBy: null,
    lockedAt: null,
  };
}

function clearUnchangedBlockDraftOwnership(authoringState, baselineState) {
  const nextState = cloneJson(normalizeSharedState(authoringState));
  const baseline = normalizeSharedState(baselineState);

  Object.entries(nextState.collaborationByPath || {}).forEach(([pathname, entry]) => {
    const currentBlocksById = indexBlocksById(nextState.blocksByPath?.[pathname]);
    const baselineBlocksById = indexBlocksById(baseline.blocksByPath?.[pathname]);
    const nextBlocksMeta = {};

    Object.entries(entry?.blocks || {}).forEach(([blockId, rawMeta]) => {
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedBlockId) {
        return;
      }
      const currentBlock = currentBlocksById.get(normalizedBlockId);
      const baselineBlock = baselineBlocksById.get(normalizedBlockId);
      const meta = normalizeBlockMeta(rawMeta);
      if (areBlocksEquivalent(currentBlock, baselineBlock)) {
        const clearedMeta = clearPublishedDraftOwnership(meta);
        nextBlocksMeta[normalizedBlockId] = {
          ...clearedMeta,
          draftedAt: meta.draftedAt,
          lockedAt: meta.lockedAt,
        };
      } else {
        nextBlocksMeta[normalizedBlockId] = meta;
      }
    });

    nextState.collaborationByPath[pathname] = {
      ...(entry || {}),
      blocks: nextBlocksMeta,
    };
  });

  return nextState;
}

function normalizeRevisionRecord(rawRevision) {
  const source = rawRevision && typeof rawRevision === 'object' ? rawRevision : {};
  const pathname = String(source.pathname || '').trim();
  const id = String(source.id || '').trim();
  const createdAt = Number.isFinite(Number(source.createdAt)) ? Number(source.createdAt) : null;
  const actor = normalizeActor(source.actor);
  if (!pathname || !id || !createdAt) {
    return null;
  }
  return {
    id,
    pathname,
    createdAt,
    actor,
    reason: String(source.reason || '').trim(),
    summary: String(source.summary || '').trim(),
    snapshot: (() => {
      const rawSnapshot = source.snapshot && typeof source.snapshot === 'object'
        ? cloneJson(source.snapshot)
        : buildRevisionSnapshot({}, pathname);
      const pageSlice = resolveRevisionSnapshotPageSlice(rawSnapshot, pathname);
      return {
        ...rawSnapshot,
        pathname: pageSlice.pathname,
        page: pageSlice.page,
        blocks: pageSlice.blocks,
        collaboration: pageSlice.collaboration,
        pathAliases: pageSlice.pathAliases,
      };
    })(),
  };
}

function defaultRecord() {
  return {
    initialized: false,
    version: 1,
    updatedAt: 0,
    announcementUpdatedAt: 0,
    announcement: normalizeAnnouncement(defaultAnnouncement),
    state: normalizeSharedState(null),
    baseSnapshot: normalizeSharedState(null),
    revisionsByPath: {},
  };
}

function stringifyPersistedJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function createJsonContentStore({
  persistenceFile,
  now = () => Date.now(),
  createId = (ts) => `${ts}-${Math.random().toString(36).slice(2, 8)}`,
  maxRevisionsPerPage = DEFAULT_MAX_REVISIONS_PER_PAGE,
  backupDir = path.resolve(path.dirname(persistenceFile), 'backups'),
  revisionDirectory = '',
  seedBaselineFile = path.resolve(path.dirname(persistenceFile), SHARED_CONTENT_SEED_BASELINE_FILE_NAME),
  maxAutomaticBackups = DEFAULT_MAX_AUTOMATIC_BACKUPS,
  retentionPolicy = DEFAULT_CONTENT_ADMIN_RETENTION_POLICY,
  getGitCommitHash = defaultGitCommitHashResolver,
  authorityLease = null,
  onDiagnostic = null,
} = {}) {
  if (!persistenceFile) {
    throw new Error('persistenceFile is required');
  }

  let record = defaultRecord();
  let persistenceMtimeMs = null;
  let loadedAt = 0;
  let exposeLoadedStaleOwnership = false;
  let publishedRevisionSource = null;
  let publishedRevisionValue = '';
  let legacyRevisionsByPath = {};
  const externalRevisionStorageEnabled = Boolean(String(revisionDirectory || '').trim());
  const normalizedRetentionPolicy = normalizeContentAdminRetentionPolicy(retentionPolicy);

  const reportDiagnostic = (operation, startedAt, details = {}) => {
    if (typeof onDiagnostic !== 'function') {
      return;
    }
    onDiagnostic({
      operation,
      durationMs: performance.now() - startedAt,
      details,
    });
  };

  const revisionFilePath = (pathname) => path.resolve(
    revisionDirectory,
    `${encodeURIComponent(String(pathname || '').trim()) || 'root'}.json`,
  );

  const readExternalRevisions = (pathname) => {
    if (!externalRevisionStorageEnabled) {
      return [];
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(revisionFilePath(pathname), 'utf8'));
      return (Array.isArray(parsed) ? parsed : [])
        .map(normalizeRevisionRecord)
        .filter(Boolean)
        .slice(0, maxRevisionsPerPage);
    } catch {
      return [];
    }
  };

  const readAllExternalRevisions = () => {
    if (!externalRevisionStorageEnabled || !fs.existsSync(revisionDirectory)) {
      return {};
    }
    return Object.fromEntries(
      fs.readdirSync(revisionDirectory)
        .filter((fileName) => fileName.endsWith('.json'))
        .map((fileName) => {
          try {
            const pathname = decodeURIComponent(fileName.slice(0, -5));
            return [pathname, readExternalRevisions(pathname)];
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    );
  };

  const writeExternalRevisions = (pathname, revisions) => {
    if (!externalRevisionStorageEnabled) {
      return;
    }
    fs.mkdirSync(revisionDirectory, { recursive: true });
    fs.writeFileSync(
      revisionFilePath(pathname),
      stringifyPersistedJson((Array.isArray(revisions) ? revisions : []).slice(0, maxRevisionsPerPage)),
    );
  };

  const clearExternalRevisions = () => {
    if (externalRevisionStorageEnabled && fs.existsSync(revisionDirectory)) {
      fs.rmSync(revisionDirectory, { recursive: true, force: true });
    }
  };

  const getRevisionsForPath = (pathname) => (
    externalRevisionStorageEnabled
      ? (readExternalRevisions(pathname).length
        ? readExternalRevisions(pathname)
        : (Array.isArray(legacyRevisionsByPath?.[pathname]) ? legacyRevisionsByPath[pathname] : []))
      : (Array.isArray(record.revisionsByPath?.[pathname]) ? record.revisionsByPath[pathname] : [])
  );

  const readPersistenceMtimeMs = () => {
    try {
      return fs.statSync(persistenceFile).mtimeMs;
    } catch {
      return null;
    }
  };

  const persistRecord = (nextRecord = record) => {
    authorityLease?.assertOwned();
    const dir = path.dirname(persistenceFile);
    fs.mkdirSync(dir, { recursive: true });
    if (externalRevisionStorageEnabled) {
      Object.entries(nextRecord.revisionsByPath || {}).forEach(([pathname, revisions]) => {
        writeExternalRevisions(pathname, revisions);
      });
      const hotRecord = { ...nextRecord };
      delete hotRecord.revisionsByPath;
      fs.writeFileSync(persistenceFile, stringifyPersistedJson(hotRecord));
    } else {
      fs.writeFileSync(persistenceFile, stringifyPersistedJson(nextRecord));
    }
    persistenceMtimeMs = readPersistenceMtimeMs();
    exposeLoadedStaleOwnership = false;
  };

  const readSeedBaselinePayload = (filePath = seedBaselineFile) => {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const metadata = parsed?.meta && typeof parsed.meta === 'object'
      ? cloneJson(parsed.meta)
      : {};
    return {
      fileName: path.basename(filePath),
      filePath,
      meta: {
        createdAt: Number.isFinite(Number(metadata?.createdAt)) ? Number(metadata.createdAt) : 0,
        timestamp: String(metadata?.timestamp || '').trim(),
        reason: String(metadata?.reason || '').trim(),
        gitCommitHash: String(metadata?.gitCommitHash || '').trim(),
        actor: normalizeActor(metadata?.actor),
        ...safeBackupMetadata(metadata),
      },
      seedState: normalizeSharedState(parsed?.seedState || parsed?.state || null),
    };
  };

  const getSeedBaselineInfo = () => {
    if (!seedBaselineFile || !fs.existsSync(seedBaselineFile)) {
      return null;
    }
    try {
      const baseline = readSeedBaselinePayload(seedBaselineFile);
      return {
        fileName: baseline.fileName,
        createdAt: Number.isFinite(Number(baseline.meta?.createdAt)) ? Number(baseline.meta.createdAt) : 0,
        timestamp: String(baseline.meta?.timestamp || '').trim(),
        reason: String(baseline.meta?.reason || '').trim(),
        gitCommitHash: String(baseline.meta?.gitCommitHash || '').trim(),
        actor: normalizeActor(baseline.meta?.actor),
        metadata: safeBackupMetadata(baseline.meta),
      };
    } catch {
      return null;
    }
  };

  const writeSeedBaselinePayload = (seedState, { actor, reason = 'promote-to-seed-baseline' } = {}) => {
    authorityLease?.assertOwned();
    const createdAt = now();
    const dir = path.dirname(seedBaselineFile);
    const normalizedActor = normalizeActor(actor);
    const gitCommitHash = String(getGitCommitHash?.() || '').trim();
    const normalizedSeedState = normalizeSharedState(seedState);
    const payload = {
      meta: {
        createdAt,
        timestamp: new Date(createdAt).toISOString(),
        reason: String(reason || '').trim() || 'promote-to-seed-baseline',
        gitCommitHash,
        actor: normalizedActor,
        persistenceFile: path.basename(persistenceFile),
        seedBaselineFile: path.basename(seedBaselineFile),
        sourceRecordUpdatedAt: Number.isFinite(Number(record?.updatedAt)) ? Number(record.updatedAt) : 0,
      },
      seedState: cloneJson(normalizedSeedState),
    };
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(seedBaselineFile, stringifyPersistedJson(payload));
    return {
      fileName: path.basename(seedBaselineFile),
      createdAt,
      timestamp: payload.meta.timestamp,
      reason: payload.meta.reason,
      gitCommitHash,
      actor: normalizedActor,
      metadata: safeBackupMetadata(payload.meta),
    };
  };

  const resolveSeedResetTarget = (fallbackSeedState) => {
    const promotedBaseline = getSeedBaselineInfo();
    if (promotedBaseline) {
      try {
        const baselinePayload = readSeedBaselinePayload(seedBaselineFile);
        return {
          seedState: baselinePayload.seedState,
          resetSource: 'promoted-seed-baseline',
          seedBaseline: promotedBaseline,
        };
      } catch {
        // Fall back to the code-derived seed if the promoted baseline cannot be read.
      }
    }
    return {
      seedState: normalizeSharedState(fallbackSeedState),
      resetSource: 'code-default-seed',
      seedBaseline: null,
    };
  };

  const readBackupPayload = (filePath) => {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const normalizedRecord = normalizeStoredRecord(parsed?.record || parsed, maxRevisionsPerPage);
    const metadata = parsed?.meta && typeof parsed.meta === 'object'
      ? cloneJson(parsed.meta)
      : {};
    return {
      fileName: path.basename(filePath),
      filePath,
      meta: {
        createdAt: Number.isFinite(Number(metadata?.createdAt)) ? Number(metadata.createdAt) : 0,
        timestamp: String(metadata?.timestamp || '').trim(),
        reason: String(metadata?.reason || '').trim(),
        gitCommitHash: String(metadata?.gitCommitHash || '').trim(),
        ...safeBackupMetadata(metadata),
      },
      record: normalizedRecord,
    };
  };

  const listBackups = () => {
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    return fs.readdirSync(backupDir)
      .filter((fileName) => (
        fileName.startsWith(SHARED_CONTENT_BACKUP_FILE_PREFIX)
        && fileName.endsWith(SHARED_CONTENT_BACKUP_FILE_SUFFIX)
      ))
      .map((fileName) => path.resolve(backupDir, fileName))
      .map((filePath) => {
        try {
          const backup = readBackupPayload(filePath);
          return {
            fileName: backup.fileName,
            filePath: backup.filePath,
            createdAt: Number.isFinite(Number(backup.meta?.createdAt)) ? Number(backup.meta.createdAt) : 0,
            timestamp: String(backup.meta?.timestamp || '').trim(),
            reason: String(backup.meta?.reason || '').trim(),
            gitCommitHash: String(backup.meta?.gitCommitHash || '').trim(),
            metadata: safeBackupMetadata(backup.meta),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
  };

  const pruneBackups = () => {
    if (!isAutomaticRetentionDeletionAllowed(normalizedRetentionPolicy)) {
      reportDiagnostic('backup-prune-skipped', performance.now(), {
        reason: 'retention-policy-unapproved',
        retentionPolicyStatus: normalizedRetentionPolicy.retentionPolicyStatus,
        automaticDeletionEnabled: normalizedRetentionPolicy.automaticDeletionEnabled,
      });
      return { deleted: [], skipped: 'retention-policy-unapproved' };
    }
    const backups = listBackups();
    const protectedCount = normalizedRetentionPolicy.protectedReleaseCount || 1;
    const protectedFileNames = new Set(backups.slice(0, protectedCount).map((backup) => backup.fileName));
    const retentionCutoff = now() - (normalizedRetentionPolicy.backupRetentionDays * 86400000);
    const deleted = [];
    backups.slice(maxAutomaticBackups).filter((backup) => (
      !protectedFileNames.has(backup.fileName)
      && Number(backup.createdAt || 0) < retentionCutoff
      && !backup.metadata?.protectedRelease
      && Number(backup.metadata?.protectedUntil || 0) <= now()
    )).forEach((backup) => {
      try {
        fs.unlinkSync(backup.filePath);
        deleted.push(backup.fileName);
      } catch {
        // Ignore backup prune failures so current work can continue.
      }
    });
    return { deleted, skipped: null };
  };

  const createSharedContentBackup = (reason, metadata = {}) => {
    authorityLease?.assertOwned();
    const createdAt = now();
    fs.mkdirSync(backupDir, { recursive: true });
    const timestampToken = formatBackupTimestampToken(createdAt);
    const gitCommitHash = String(getGitCommitHash?.() || '').trim();
    const baseName = `${SHARED_CONTENT_BACKUP_FILE_PREFIX}${timestampToken}`;
    let fileName = `${baseName}${SHARED_CONTENT_BACKUP_FILE_SUFFIX}`;
    let filePath = path.resolve(backupDir, fileName);
    let suffix = 2;

    while (fs.existsSync(filePath)) {
      fileName = `${baseName}-${suffix}${SHARED_CONTENT_BACKUP_FILE_SUFFIX}`;
      filePath = path.resolve(backupDir, fileName);
      suffix += 1;
    }

    const backupMetadata = safeBackupMetadata(metadata);
    const payload = {
      meta: {
        createdAt,
        timestamp: new Date(createdAt).toISOString(),
        reason: String(reason || '').trim() || 'manual-backup',
        gitCommitHash,
        persistenceFile: path.basename(persistenceFile),
        initialized: Boolean(record?.initialized),
        updatedAt: Number.isFinite(Number(record?.updatedAt)) ? Number(record.updatedAt) : 0,
        ...backupMetadata,
        actor: normalizeActor(backupMetadata.actor),
        schemaVersion: Number(record?.version || 0) || null,
        migrationVersions: cloneJson(record?.snapshotMigrations || {}),
        routeScope: Array.isArray(backupMetadata.routeScope)
          ? [...backupMetadata.routeScope]
          : Object.keys(record?.state?.blocksByPath || {}).sort(),
        retentionClass: 'backup',
      },
      record: cloneJson(
        externalRevisionStorageEnabled
          ? { ...record, revisionsByPath: readAllExternalRevisions() }
          : record,
      ),
    };

    fs.writeFileSync(filePath, stringifyPersistedJson(payload));
    const pruneResult = pruneBackups();
    return {
      fileName,
      filePath,
      createdAt,
      timestamp: payload.meta.timestamp,
      reason: payload.meta.reason,
      gitCommitHash,
      metadata: safeBackupMetadata(payload.meta),
      pruneResult,
    };
  };

  const safelyReplaceRecord = (nextRecord, { backupReason = '', backupMetadata = null } = {}) => {
    authorityLease?.assertOwned();
    const createdBackup = backupReason
      ? createSharedContentBackup(backupReason, backupMetadata || {})
      : null;
    if (externalRevisionStorageEnabled) {
      clearExternalRevisions();
    }
    record = nextRecord;
    persistRecord(record);
    return createdBackup;
  };

  const load = () => {
    const startedAt = performance.now();
    if (!fs.existsSync(persistenceFile)) {
      record = defaultRecord();
      legacyRevisionsByPath = {};
      persistenceMtimeMs = null;
      loadedAt = now();
      reportDiagnostic('load', startedAt, { found: false, persistenceFile });
      return;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(persistenceFile, 'utf8'));
      const legacyRevisions = parsed?.revisionsByPath && typeof parsed.revisionsByPath === 'object'
        ? parsed.revisionsByPath
        : {};
      legacyRevisionsByPath = Object.fromEntries(Object.entries(legacyRevisions).map(([pathname, revisions]) => [
        pathname,
        (Array.isArray(revisions) ? revisions : []).map(normalizeRevisionRecord).filter(Boolean),
      ]));
      record = normalizeStoredRecord(
        externalRevisionStorageEnabled ? { ...parsed, revisionsByPath: {} } : parsed,
        maxRevisionsPerPage,
      );
      const parsedHotRecord = { ...parsed };
      if (externalRevisionStorageEnabled) {
        delete parsedHotRecord.revisionsByPath;
      }
      const normalizedHotRecord = { ...record };
      if (externalRevisionStorageEnabled) {
        delete normalizedHotRecord.revisionsByPath;
      } else if (!Object.prototype.hasOwnProperty.call(parsed, 'revisionsByPath')
        && Object.keys(normalizedHotRecord.revisionsByPath || {}).length === 0) {
        delete normalizedHotRecord.revisionsByPath;
      }
      const normalizationChanged = JSON.stringify(parsedHotRecord) !== JSON.stringify(normalizedHotRecord);
      if (normalizationChanged) {
        reportDiagnostic('load-normalization-pending', startedAt, {
          persistenceFile,
          writeSuppressed: true,
          reason: 'ordinary startup and reads are non-mutating',
        });
      }
      persistenceMtimeMs = readPersistenceMtimeMs();
    } catch {
      record = defaultRecord();
      legacyRevisionsByPath = {};
      persistenceMtimeMs = readPersistenceMtimeMs();
    }
    loadedAt = now();
    exposeLoadedStaleOwnership = true;
    reportDiagnostic('load', startedAt, {
      found: true,
      persistenceFile,
      externalRevisionStorageEnabled,
    });
  };

  const reloadIfPersistenceChanged = () => {
    const nextMtimeMs = readPersistenceMtimeMs();
    if (nextMtimeMs === null || nextMtimeMs === persistenceMtimeMs) {
      return false;
    }
    load();
    return true;
  };

  const publishedRevision = () => createHash('sha1')
    .update(JSON.stringify(record.baseSnapshot || {}))
    .digest('hex')
    .slice(0, 12);

  const getPublishedRevision = () => {
    if (publishedRevisionSource !== record.baseSnapshot) {
      publishedRevisionSource = record.baseSnapshot;
      publishedRevisionValue = publishedRevision();
    }
    return publishedRevisionValue;
  };

  const publishAuthoritySnapshot = () => ({
    persistenceFile: path.resolve(persistenceFile),
    persistenceMtimeMs,
    loadedAt,
    recordRevision: Number(record.updatedAt) || 0,
    draftRevision: Number(record.updatedAt) || 0,
    publishedRevision: getPublishedRevision(),
  });

  const publishSnapshot = () => ({
    initialized: record.initialized,
    updatedAt: record.updatedAt,
    announcementUpdatedAt: record.announcementUpdatedAt,
    announcement: cloneJson(record.announcement),
    // Stale ownership is a derived operational marker. Hide it from clients
    // when the active block is already equal to the published block, while
    // retaining the original audit metadata in the persisted record.
    state: cloneJson(
      exposeLoadedStaleOwnership
        ? clearUnchangedBlockDraftOwnership(record.state, record.baseSnapshot)
        : record.state,
    ),
    baseSnapshot: cloneJson(record.baseSnapshot),
    ...(record.snapshotMigrations
      ? { snapshotMigrations: cloneJson(record.snapshotMigrations) }
      : {}),
    seedBaseline: getSeedBaselineInfo(),
    authority: publishAuthoritySnapshot(),
  });

  const publishAnnouncementSnapshot = () => ({
    announcement: cloneJson(record.announcement),
    updatedAt: record.announcementUpdatedAt,
  });

  const addRevisionsForChangedPaths = (prevState, nextState, { actor, reason, summary = '' } = {}) => {
    const changedPaths = collectChangedPaths(prevState, nextState);
    if (!changedPaths.length) {
      return;
    }
    const normalizedActor = normalizeActor(actor);
    changedPaths.forEach((pathname) => {
      const nextRevision = {
        id: createId(now()),
        pathname,
        createdAt: now(),
        actor: normalizedActor,
        reason: String(reason || '').trim() || 'draft-saved',
        summary: String(summary || '').trim(),
        snapshot: buildRevisionSnapshot(nextState, pathname),
      };
      const previous = externalRevisionStorageEnabled
        ? readExternalRevisions(pathname)
        : (Array.isArray(record.revisionsByPath[pathname]) ? record.revisionsByPath[pathname] : []);
      record.revisionsByPath[pathname] = [nextRevision, ...previous].slice(0, maxRevisionsPerPage);
    });
  };

  const commitState = (nextState, { actor, reason, summary = '', trackRevisions = true } = {}) => {
    const normalizedNextState = normalizeSharedState(nextState);
    const previousState = record.state;
    if (trackRevisions) {
      addRevisionsForChangedPaths(previousState, normalizedNextState, { actor, reason, summary });
    }
    record = {
      ...record,
      initialized: true,
      updatedAt: now(),
      state: normalizedNextState,
    };
    persistRecord();
    return publishSnapshot();
  };

  const replacePageStateFromRevision = (pathname, revision) => {
    const nextState = normalizeSharedState(record.state);
    const pageSlice = resolveRevisionSnapshotPageSlice(revision?.snapshot, pathname);
    if (pageSlice.page) {
      nextState.pageHierarchy[pathname] = cloneJson(pageSlice.page);
    }
    nextState.blocksByPath[pathname] = normalizeBlocksWithoutInventoryRepair(
      pathname,
      stripRetiredTargetBridgeSettingsFromBlocks(pageSlice.blocks),
    );
    nextState.collaborationByPath[pathname] = normalizeCollaborationForExistingBlocks(
      pathname,
      pageSlice.collaboration || { blocks: {}, history: [] },
      pageSlice.blocks,
    );
    Object.entries(pageSlice.pathAliases || {}).forEach(([fromPath, toPath]) => {
      nextState.pathAliases[fromPath] = toPath;
    });
    return nextState;
  };

  load();

  return {
    readCurrentState() {
      reloadIfPersistenceChanged();
      return cloneJson(record.state);
    },

    readPublishedSnapshot() {
      reloadIfPersistenceChanged();
      return cloneJson(record.baseSnapshot);
    },

    validateSnapshot(snapshot, options = {}) {
      const normalizedState = normalizeSharedState(snapshot);
      const findings = validateContentAdminStateSchema(normalizedState, {
        label: String(options?.label || 'content admin state'),
      });
      return {
        ok: findings.length === 0,
        findings,
        state: cloneJson(normalizedState),
      };
    },

    getSnapshot() {
      reloadIfPersistenceChanged();
      return publishSnapshot();
    },

    getAuthoritySnapshot() {
      reloadIfPersistenceChanged();
      return publishAuthoritySnapshot();
    },

    refreshFromDisk() {
      reloadIfPersistenceChanged();
      return publishSnapshot();
    },

    getAnnouncementSnapshot() {
      return publishAnnouncementSnapshot();
    },

    saveAnnouncement(nextAnnouncement, { actor } = {}) {
      const normalizedAnnouncement = normalizeAnnouncement(nextAnnouncement);
      const timestamp = now();
      record = {
        ...record,
        announcement: normalizedAnnouncement,
        announcementUpdatedAt: timestamp,
      };
      persistRecord();
      return {
        ok: true,
        actor: normalizeActor(actor),
        ...publishAnnouncementSnapshot(),
      };
    },

    resetFromSeed(seedState, { actor, reason = 'seed-reset' } = {}) {
      const resetTarget = resolveSeedResetTarget(seedState);
      const normalizedSeedState = normalizeSharedState(resetTarget.seedState);
      const nextRecord = {
        initialized: true,
        version: 1,
        updatedAt: now(),
        announcementUpdatedAt: record.announcementUpdatedAt,
        announcement: cloneJson(record.announcement),
        state: normalizedSeedState,
        baseSnapshot: cloneJson(normalizedSeedState),
        revisionsByPath: {},
      };
      try {
        safelyReplaceRecord(nextRecord, {
          backupReason: record.initialized ? 'before-reset-from-seed' : '',
          backupMetadata: {
            action: String(reason || '').trim() || 'seed-reset',
            resetSource: resetTarget.resetSource,
          },
        });
      } catch (error) {
        return {
          ok: false,
          error: 'backup-failed',
          details: error instanceof Error ? error.message : 'backup-failed',
          ...publishSnapshot(),
        };
      }
      const next = publishSnapshot();
      addRevisionsForChangedPaths(normalizeSharedState(null), next.state, {
        actor,
        reason,
        summary: 'seed baseline',
      });
      persistRecord();
      return {
        ...publishSnapshot(),
        resetSource: resetTarget.resetSource,
      };
    },

    saveDraft(nextState, { actor, reason = 'draft-saved', summary = '' } = {}) {
      const normalizedIncomingState = normalizeSharedState(nextState);
      const currentState = exposeLoadedStaleOwnership
        ? clearUnchangedBlockDraftOwnership(record.state, record.baseSnapshot)
        : normalizeSharedState(record.state);
      const destructiveChangeSummary = summarizeDestructiveSharedStateChanges(currentState, normalizedIncomingState);
      const nextMergedState = {
        ...normalizeSharedState(currentState),
        pageHierarchy: cloneJson(normalizedIncomingState.pageHierarchy || {}),
        pathAliases: cloneJson(normalizedIncomingState.pathAliases || {}),
      };
      const pathnamesToMerge = new Set([
        ...Object.keys(currentState.blocksByPath || {}),
        ...Object.keys(normalizedIncomingState.blocksByPath || {}),
        ...Object.keys(currentState.collaborationByPath || {}),
        ...Object.keys(normalizedIncomingState.collaborationByPath || {}),
      ]);
      const saveResult = {
        didSave: false,
        hasConflicts: false,
        changedPaths: collectChangedPaths(currentState, normalizedIncomingState),
        savedPaths: [],
        savedBlockIdsByPath: {},
        blockedBlockIdsByPath: {},
        blockedBlocks: [],
      };

      pathnamesToMerge.forEach((pathname) => {
        const merged = mergePageDraftForSafeSave(pathname, currentState, normalizedIncomingState, actor, {
          now,
          createId,
        });
        nextMergedState.blocksByPath[pathname] = merged.blocks;
        nextMergedState.collaborationByPath[pathname] = merged.collaborationEntry;
        if (merged.savedBlockIds.length) {
          saveResult.savedBlockIdsByPath[pathname] = merged.savedBlockIds;
        }
        if (merged.blockedBlockIds.length) {
          saveResult.blockedBlockIdsByPath[pathname] = merged.blockedBlockIds;
          saveResult.blockedBlocks.push(...merged.blockedBlocks);
        }
      });

      const actualChangedPaths = collectChangedPaths(currentState, nextMergedState);
      saveResult.didSave = actualChangedPaths.length > 0;
      saveResult.savedPaths = actualChangedPaths;
      saveResult.hasConflicts = saveResult.blockedBlocks.length > 0;
      saveResult.status = normalizeSharedOperationStatus(saveResult.status, {
        kind: 'save',
        didChange: saveResult.didSave,
        hasConflicts: saveResult.hasConflicts,
        hasError: false,
      });

      if (destructiveChangeSummary.hasDestructiveChanges && actualChangedPaths.length > 0) {
        try {
          createSharedContentBackup('before-destructive-draft-save', {
            removedPagePaths: destructiveChangeSummary.removedPagePaths,
            removedBlocksByPath: destructiveChangeSummary.removedBlocksByPath,
            changedPaths: actualChangedPaths,
            summary: String(summary || '').trim(),
          });
        } catch (error) {
          return {
            ok: false,
            error: 'backup-failed',
            details: error instanceof Error ? error.message : 'backup-failed',
            ...publishSnapshot(),
          };
        }
      }

      const snapshot = commitState(nextMergedState, { actor, reason, summary });
      return {
        ok: true,
        ...snapshot,
        saveResult,
      };
    },

    savePageDraft(nextState, options = {}) {
      return this.saveDraft(nextState, options);
    },

    discardPageDraft(pathname, { actor, summary = '' } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedActor) {
        return { ok: false, error: 'invalid-discard-request', ...publishSnapshot() };
      }

      const currentState = exposeLoadedStaleOwnership
        ? clearUnchangedBlockDraftOwnership(record.state, record.baseSnapshot)
        : normalizeSharedState(record.state);
      const currentEntry = ensureCollaborationEntry(currentState.collaborationByPath || {}, normalizedPath);
      const discardSummary = summarizePageAuthoringDiff(currentState, record.baseSnapshot, normalizedPath);
      if (!discardSummary.hasChanges) {
        return {
          ok: true,
          ...publishSnapshot(),
          discardResult: {
            status: 'no-op',
            didDiscard: false,
            changedPaths: [],
            updatedAt: now(),
          },
        };
      }

      const discardConflictBlockIds = new Set(
        discardSummary.hasOrderChanges
          ? (currentState.blocksByPath?.[normalizedPath] || [])
            .map((block) => String(block?.id || '').trim())
            .filter(Boolean)
          : discardSummary.changedBlockIds,
      );
      const blockedBlocks = [];
      Object.entries(currentEntry.blocks || {}).forEach(([blockId, rawMeta]) => {
        if (!discardConflictBlockIds.has(String(blockId || '').trim())) {
          return;
        }
        const conflict = getOtherActorConflict(rawMeta, normalizedActor);
        if (!conflict) {
          return;
        }
        blockedBlocks.push({
          pathname: normalizedPath,
          blockId: String(blockId || '').trim(),
          reason: conflict.reason,
          owner: cloneJson(conflict.owner),
          state: conflict.state,
        });
      });

      if (blockedBlocks.length) {
        return {
          ok: false,
          error: 'discard-blocked-by-other-draft',
          ...publishSnapshot(),
          discardResult: {
            status: 'blocked',
            didDiscard: false,
            hasConflicts: true,
            changedPaths: [normalizedPath],
            blockedBlocks,
            updatedAt: now(),
          },
        };
      }

      const baselineBlocks = record.baseSnapshot.blocksByPath?.[normalizedPath] || [];
      const nextBlocksMeta = {};
      baselineBlocks.forEach((block) => {
        const blockId = String(block?.id || '').trim();
        if (blockId) {
          nextBlocksMeta[blockId] = clearPublishedDraftOwnership(currentEntry.blocks?.[blockId]);
        }
      });
      const timestamp = now();
      const nextCollaborationEntry = {
        ...currentEntry,
        blocks: nextBlocksMeta,
        history: appendHistoryEntry(currentEntry.history, buildHistoryEntry({
          action: 'page-draft-discarded',
          actor: normalizedActor,
          details: String(summary || '').trim(),
          now: timestamp,
          createId,
        })),
      };
      const nextState = replacePageSlice(
        currentState,
        record.baseSnapshot,
        normalizedPath,
        nextCollaborationEntry,
      );

      try {
        createSharedContentBackup('before-page-draft-discard', {
          pathname: normalizedPath,
          actor: normalizedActor,
          summary: String(summary || '').trim(),
        });
      } catch (error) {
        return {
          ok: false,
          error: 'backup-failed',
          details: error instanceof Error ? error.message : 'backup-failed',
          ...publishSnapshot(),
        };
      }

      const snapshot = commitState(nextState, {
        actor: normalizedActor,
        reason: 'draft-discarded',
        summary: String(summary || '').trim() || normalizedPath,
      });
      return {
        ok: true,
        ...snapshot,
        discardResult: {
          status: 'discarded',
          didDiscard: true,
          changedPaths: [normalizedPath],
          blockedBlocks: [],
          updatedAt: snapshot.updatedAt,
        },
      };
    },

    discardBlockDraft(pathname, blockId, { actor, summary = '' } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedBlockId || !normalizedActor) {
        return { ok: false, error: 'invalid-discard-block-request', ...publishSnapshot() };
      }

      const currentState = exposeLoadedStaleOwnership
        ? clearUnchangedBlockDraftOwnership(record.state, record.baseSnapshot)
        : normalizeSharedState(record.state);
      const currentEntry = ensureCollaborationEntry(currentState.collaborationByPath || {}, normalizedPath);
      const currentBlocks = Array.isArray(currentState.blocksByPath?.[normalizedPath])
        ? currentState.blocksByPath[normalizedPath]
        : [];
      const baselineBlocks = Array.isArray(record.baseSnapshot.blocksByPath?.[normalizedPath])
        ? record.baseSnapshot.blocksByPath[normalizedPath]
        : [];
      const currentIndex = currentBlocks.findIndex((block) => String(block?.id || '').trim() === normalizedBlockId);
      const baselineIndex = baselineBlocks.findIndex((block) => String(block?.id || '').trim() === normalizedBlockId);
      const currentBlock = currentIndex >= 0 ? currentBlocks[currentIndex] : null;
      const baselineBlock = baselineIndex >= 0 ? baselineBlocks[baselineIndex] : null;

      if (!currentBlock && !baselineBlock) {
        return { ok: false, error: 'block-not-found', ...publishSnapshot() };
      }
      if (JSON.stringify(currentBlock) === JSON.stringify(baselineBlock)) {
        return {
          ok: true,
          ...publishSnapshot(),
          discardResult: {
            status: 'no-op',
            didDiscard: false,
            scope: 'block',
            changedPaths: [],
            updatedAt: now(),
          },
        };
      }

      const currentMeta = normalizeBlockMeta(currentEntry.blocks?.[normalizedBlockId]);
      const conflict = getOtherActorConflict(currentMeta, normalizedActor);
      if (conflict) {
        return {
          ok: false,
          error: 'discard-blocked-by-other-draft',
          blockedBlocks: [{ pathname: normalizedPath, blockId: normalizedBlockId, ...conflict }],
          ...publishSnapshot(),
        };
      }

      const restoredBlocks = currentBlocks.filter((block) => String(block?.id || '').trim() !== normalizedBlockId);
      if (baselineBlock) {
        const insertIndex = currentIndex >= 0
          ? currentIndex
          : Math.min(Math.max(baselineIndex, 0), restoredBlocks.length);
        restoredBlocks.splice(insertIndex, 0, cloneJson(baselineBlock));
      }

      const timestamp = now();
      const nextCollaborationEntry = {
        ...currentEntry,
        blocks: {
          ...(currentEntry.blocks || {}),
          [normalizedBlockId]: clearPublishedDraftOwnership(currentMeta),
        },
        history: appendHistoryEntry(currentEntry.history, buildHistoryEntry({
          action: 'block-draft-discarded',
          blockId: normalizedBlockId,
          actor: normalizedActor,
          details: String(summary || '').trim(),
          now: timestamp,
          createId,
        })),
      };
      const nextState = normalizeSharedState(currentState);
      nextState.blocksByPath[normalizedPath] = restoredBlocks;
      nextState.collaborationByPath[normalizedPath] = nextCollaborationEntry;

      try {
        createSharedContentBackup('before-block-draft-discard', {
          pathname: normalizedPath,
          blockId: normalizedBlockId,
          actor: normalizedActor,
          summary: String(summary || '').trim(),
        });
      } catch (error) {
        return {
          ok: false,
          error: 'backup-failed',
          details: error instanceof Error ? error.message : 'backup-failed',
          ...publishSnapshot(),
        };
      }

      const snapshot = commitState(nextState, {
        actor: normalizedActor,
        reason: 'block-draft-discarded',
        summary: String(summary || '').trim() || `${normalizedPath}#${normalizedBlockId}`,
      });
      return {
        ok: true,
        ...snapshot,
        discardResult: {
          status: 'discarded',
          didDiscard: true,
          scope: 'block',
          changedPaths: [normalizedPath],
          changedBlockIds: [normalizedBlockId],
          blockedBlocks: [],
          updatedAt: snapshot.updatedAt,
        },
      };
    },

    syncBlockDraft(pathname, blockId, nextBlock, { actor, reason = 'block-draft-synced' } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      const normalizedIncomingBlockId = String(nextBlock?.id || normalizedBlockId).trim();
      if (!normalizedPath || !normalizedBlockId || !normalizedActor || !normalizedIncomingBlockId) {
        return { ok: false, error: 'invalid-block-sync-request', ...publishSnapshot() };
      }
      if (normalizedIncomingBlockId !== normalizedBlockId) {
        return { ok: false, error: 'block-id-mismatch', ...publishSnapshot() };
      }

      const nextState = normalizeSharedState(record.state);
      const currentBlocks = Array.isArray(nextState.blocksByPath[normalizedPath]) ? nextState.blocksByPath[normalizedPath] : [];
      const blockIndex = currentBlocks.findIndex((entry) => String(entry?.id || '').trim() === normalizedBlockId);
      if (blockIndex === -1) {
        return { ok: false, error: 'block-not-found', ...publishSnapshot() };
      }

      const currentCollaboration = normalizeCollaborationByPath(nextState.collaborationByPath);
      const entry = ensureCollaborationEntry(currentCollaboration, normalizedPath);
      const currentMeta = normalizeBlockMeta(entry.blocks?.[normalizedBlockId]);
      const conflict = getOtherActorConflict(currentMeta, normalizedActor);
      if (conflict) {
        return {
          ok: false,
          error: conflict.reason,
          owner: conflict.owner,
          state: conflict.state,
          ...publishSnapshot(),
        };
      }

      const timestamp = now();
      const updatedBlocks = [...currentBlocks];
      updatedBlocks.splice(blockIndex, 1, cloneJson({
        ...nextBlock,
        id: normalizedBlockId,
      }));
      nextState.blocksByPath[normalizedPath] = updatedBlocks;
      nextState.collaborationByPath = {
        ...currentCollaboration,
        [normalizedPath]: {
          ...entry,
          blocks: {
            ...(entry.blocks || {}),
            [normalizedBlockId]: buildSyncedDraftBlockMeta(currentMeta, normalizedActor, timestamp),
          },
          history: appendHistoryEntry(entry.history, buildHistoryEntry({
            action: 'block-draft-synced',
            blockId: normalizedBlockId,
            actor: normalizedActor,
            details: 'shared-draft-content',
            now: timestamp,
            createId,
          })),
        },
      };

      return {
        ok: true,
        ...commitState(nextState, {
          actor: normalizedActor,
          reason,
          summary: `${normalizedPath}:${normalizedBlockId}`,
          trackRevisions: false,
        }),
      };
    },

    saveBlockDraft(pathname, blockId, nextBlock, options = {}) {
      return this.syncBlockDraft(pathname, blockId, nextBlock, options);
    },

    publishPage(pathname, { actor, summary = '' } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedActor) {
        return { ok: false, error: 'invalid-publish-request', ...publishSnapshot() };
      }

      const currentState = exposeLoadedStaleOwnership
        ? clearUnchangedBlockDraftOwnership(record.state, record.baseSnapshot)
        : normalizeSharedState(record.state);
      const currentEntry = ensureCollaborationEntry(currentState.collaborationByPath || {}, normalizedPath);
      const currentBlocks = Array.isArray(currentState.blocksByPath?.[normalizedPath])
        ? currentState.blocksByPath[normalizedPath]
        : [];
      const publishSummary = summarizePageAuthoringDiff(currentState, record.baseSnapshot, normalizedPath);
      const publishConflictBlockIds = new Set(
        publishSummary.hasOrderChanges
          ? currentBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean)
          : publishSummary.changedBlockIds,
      );

      if (!publishSummary.hasChanges) {
        return {
          ok: false,
          error: 'already-live',
          ...publishSnapshot(),
          publishResult: {
            status: 'already-live',
            didPublish: false,
            hasConflicts: false,
            changedPaths: [],
            publishedPaths: [],
            publishedBlockIdsByPath: {},
            blockedBlockIdsByPath: {},
            blockedBlocks: [],
            hasOrderChangesByPath: {},
            hasPageMetaChangesByPath: {},
            updatedAt: now(),
          },
        };
      }

      const blockedBlocks = [];
      Object.entries(currentEntry.blocks || {}).forEach(([blockId, rawMeta]) => {
        if (!publishConflictBlockIds.has(String(blockId || '').trim())) {
          return;
        }
        const conflict = getOtherActorConflict(rawMeta, normalizedActor);
        if (!conflict) {
          return;
        }
        blockedBlocks.push({
          pathname: normalizedPath,
          blockId: String(blockId || '').trim(),
          reason: conflict.reason,
          owner: cloneJson(conflict.owner),
          state: conflict.state,
        });
      });

      if (blockedBlocks.length) {
        return {
          ok: false,
          error: 'publish-blocked-by-other-draft',
          ...publishSnapshot(),
          publishResult: {
            status: 'blocked',
            didPublish: false,
            hasConflicts: true,
            changedPaths: [normalizedPath],
            publishedPaths: [],
            publishedBlockIdsByPath: {},
            blockedBlockIdsByPath: {
              [normalizedPath]: blockedBlocks.map((entry) => entry.blockId),
            },
            blockedBlocks,
            hasOrderChangesByPath: {
              [normalizedPath]: publishSummary.hasOrderChanges,
            },
            hasPageMetaChangesByPath: {
              [normalizedPath]: publishSummary.hasPageMetaChanges,
            },
            updatedAt: now(),
          },
        };
      }

      const timestamp = now();
      const nextBlocksMeta = {};
      currentBlocks.forEach((block) => {
        const blockId = String(block?.id || '').trim();
        if (!blockId) {
          return;
        }
        nextBlocksMeta[blockId] = clearPublishedDraftOwnership(currentEntry.blocks?.[blockId]);
      });

      const nextCollaborationEntry = {
        ...currentEntry,
        blocks: nextBlocksMeta,
        history: appendHistoryEntry(currentEntry.history, buildHistoryEntry({
          action: 'page-published',
          actor: normalizedActor,
          details: String(summary || '').trim(),
          now: timestamp,
          createId,
        })),
      };
      const nextState = replacePageSlice(currentState, currentState, normalizedPath, nextCollaborationEntry);
      const nextBaseSnapshot = replacePageSlice(record.baseSnapshot, nextState, normalizedPath, nextCollaborationEntry);
      record = {
        ...record,
        initialized: true,
        updatedAt: timestamp,
        state: nextState,
        baseSnapshot: nextBaseSnapshot,
      };
      persistRecord();
      return {
        ok: true,
        ...publishSnapshot(),
        publishResult: {
          receipt: {
            route: normalizedPath,
            scope: 'page',
            actor: normalizedActor,
            publishedBlockIds: publishSummary.changedBlockIds,
          },
          status: 'published',
          didPublish: true,
          hasConflicts: false,
          changedPaths: [normalizedPath],
          publishedPaths: [normalizedPath],
          publishedBlockIdsByPath: {
            [normalizedPath]: publishSummary.changedBlockIds,
          },
          blockedBlockIdsByPath: {},
          blockedBlocks: [],
          hasOrderChangesByPath: {
            [normalizedPath]: publishSummary.hasOrderChanges,
          },
          hasPageMetaChangesByPath: {
            [normalizedPath]: publishSummary.hasPageMetaChanges,
          },
          updatedAt: timestamp,
        },
      };
    },

    publishBlock(pathname, blockId, { actor, summary = '', expectedBlock = null } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedBlockId || !normalizedActor) {
        return { ok: false, error: 'invalid-block-publish-request', ...publishSnapshot() };
      }

      const currentState = exposeLoadedStaleOwnership
        ? clearUnchangedBlockDraftOwnership(record.state, record.baseSnapshot)
        : normalizeSharedState(record.state);
      const currentEntry = ensureCollaborationEntry(currentState.collaborationByPath || {}, normalizedPath);
      const currentBlock = currentState.blocksByPath?.[normalizedPath]
        ?.find((block) => String(block?.id || '').trim() === normalizedBlockId);
      const publishedBlock = record.baseSnapshot.blocksByPath?.[normalizedPath]
        ?.find((block) => String(block?.id || '').trim() === normalizedBlockId);
      if (!currentBlock) {
        return { ok: false, error: 'block-not-found', ...publishSnapshot() };
      }
      if (expectedBlock && JSON.stringify(currentBlock) !== JSON.stringify(normalizeContentAdminBlock(expectedBlock))) {
        return { ok: false, error: 'block-publish-stale-draft', ...publishSnapshot() };
      }
      if (JSON.stringify(currentBlock) === JSON.stringify(publishedBlock || null)) {
        return { ok: false, error: 'already-live', ...publishSnapshot() };
      }

      const currentMeta = normalizeBlockMeta(currentEntry.blocks?.[normalizedBlockId]);
      const conflict = getOtherActorConflict(currentMeta, normalizedActor);
      if (conflict) {
        return {
          ok: false,
          error: 'publish-blocked-by-other-draft',
          blockedBlocks: [{ pathname: normalizedPath, blockId: normalizedBlockId, ...conflict }],
          ...publishSnapshot(),
        };
      }

      const timestamp = now();
      const nextEntry = {
        ...currentEntry,
        blocks: {
          ...(currentEntry.blocks || {}),
          [normalizedBlockId]: clearPublishedDraftOwnership(currentMeta),
        },
        history: appendHistoryEntry(currentEntry.history, buildHistoryEntry({
          action: 'block-published',
          blockId: normalizedBlockId,
          actor: normalizedActor,
          details: String(summary || '').trim(),
          now: timestamp,
          createId,
        })),
      };
      const nextState = replaceBlockInPageSlice(currentState, currentState, normalizedPath, normalizedBlockId, nextEntry);
      const nextBaseSnapshot = replaceBlockInPageSlice(record.baseSnapshot, nextState, normalizedPath, normalizedBlockId, nextEntry);
      record = {
        ...record,
        initialized: true,
        updatedAt: timestamp,
        state: nextState,
        baseSnapshot: nextBaseSnapshot,
      };
      persistRecord();
      const publishedBlockSnapshot = record.baseSnapshot.blocksByPath?.[normalizedPath]
        ?.find((block) => String(block?.id || '').trim() === normalizedBlockId) || null;
      return {
        ok: true,
        ...publishSnapshot(),
        publishedBlock: cloneJson(publishedBlockSnapshot),
        publishResult: {
          receipt: {
            route: normalizedPath,
            scope: 'block',
            actor: normalizedActor,
            publishedBlockIds: [normalizedBlockId],
          },
          status: 'published',
          didPublish: true,
          hasConflicts: false,
          changedPaths: [normalizedPath],
          publishedPaths: [normalizedPath],
          publishedBlockIdsByPath: { [normalizedPath]: [normalizedBlockId] },
          blockedBlockIdsByPath: {},
          blockedBlocks: [],
          updatedAt: timestamp,
        },
      };
    },

    publishPath(pathname, options = {}) {
      return this.publishPage(pathname, options);
    },

    publishSeedRouteSlices(
      seedState,
      pathnames,
      {
        actor,
        summary = '',
        forceOverwriteAdminEdits = false,
        reason = '',
        operation = 'seed-to-active',
      } = {},
    ) {
      const normalizedActor = normalizeActor(actor);
      const normalizedReason = String(reason || '').trim();
      const forceOverwrite = forceOverwriteAdminEdits === true;
      if (String(operation || '').trim() !== 'seed-to-active') {
        return { ok: false, error: 'conflicting-seed-route-publish-mode', ...publishSnapshot() };
      }
      const normalizedPaths = [...new Set((Array.isArray(pathnames) ? pathnames : [pathnames])
        .map((pathname) => String(pathname || '').trim())
        .filter(Boolean))];
      if (!normalizedActor || !normalizedPaths.length || !seedState?.blocksByPath) {
        return { ok: false, error: 'invalid-seed-route-publish-request', ...publishSnapshot() };
      }
      if (forceOverwrite && !normalizedReason) {
        return { ok: false, error: 'force-reason-required', ...publishSnapshot() };
      }
      if (normalizedReason && !forceOverwrite) {
        return { ok: false, error: 'reason-requires-force', ...publishSnapshot() };
      }

      const normalizedSeed = normalizeSharedState(seedState);
      const missingPaths = normalizedPaths.filter((pathname) => !Array.isArray(normalizedSeed.blocksByPath?.[pathname]));
      if (missingPaths.length) {
        return {
          ok: false,
          error: 'seed-route-not-found',
          missingPaths,
          ...publishSnapshot(),
        };
      }

      const comparison = compareSeedRouteSlices({
        activeState: record.state,
        baseSnapshot: record.baseSnapshot,
        seedState: normalizedSeed,
        pathnames: normalizedPaths,
      });
      const changedPaths = comparison.changedRoutes;

      if (!changedPaths.length) {
        return {
          ok: true,
          ...publishSnapshot(),
          publishResult: {
            didPublish: false,
            hasConflicts: false,
            changedPaths: [],
            publishedPaths: [],
            updatedAt: record.updatedAt,
          },
        };
      }

      if (!forceOverwrite) {
        return {
          ok: false,
          error: 'seed-route-publish-conflict',
          ...publishSnapshot(),
          publishResult: {
            didPublish: false,
            hasConflicts: true,
            changedPaths,
            publishedPaths: [],
            diffs: comparison.changes,
            diffReport: formatSeedRouteSliceDiffReport(comparison),
            updatedAt: record.updatedAt,
          },
        };
      }

      let backup;
      try {
        backup = createSharedContentBackup('before-forced-seed-route-overwrite', {
          action: 'seed-route-slice-overwrite',
          actor: normalizedActor,
          operationReason: normalizedReason,
          routes: changedPaths,
          diffCount: comparison.changes.length,
        });
      } catch (error) {
        return {
          ok: false,
          error: 'backup-failed',
          details: error instanceof Error ? error.message : 'backup-failed',
          ...publishSnapshot(),
        };
      }

      const timestamp = now();
      const previousState = record.state;
      let nextState = mutableSharedStateShell(record.state);
      let nextBaseSnapshot = mutableSharedStateShell(record.baseSnapshot);

      changedPaths.forEach((pathname) => {
        const currentEntry = ensureCollaborationEntry(nextState.collaborationByPath || {}, pathname);
        const seedBlocks = normalizePageBlocksState(pathname, normalizedSeed.blocksByPath?.[pathname]);
        const nextBlocksMeta = {};
        seedBlocks.forEach((block) => {
          const blockId = String(block?.id || '').trim();
          if (!blockId) {
            return;
          }
          nextBlocksMeta[blockId] = clearPublishedDraftOwnership(currentEntry.blocks?.[blockId]);
        });
        const nextCollaborationEntry = {
          ...currentEntry,
          blocks: nextBlocksMeta,
          history: appendHistoryEntry(currentEntry.history, buildHistoryEntry({
            action: 'seed-route-slice-published',
            actor: normalizedActor,
            details: `${normalizedReason}${String(summary || '').trim() ? `: ${String(summary).trim()}` : ''}`,
            now: timestamp,
            createId,
          })),
        };

        nextState = copySeedRouteSlice(nextState, normalizedSeed, pathname, nextCollaborationEntry);
        nextBaseSnapshot = copySeedRouteSlice(nextBaseSnapshot, normalizedSeed, pathname, nextCollaborationEntry);
      });

      record = {
        ...record,
        initialized: true,
        updatedAt: timestamp,
        state: nextState,
        baseSnapshot: nextBaseSnapshot,
      };
      addRevisionsForChangedPaths(previousState, nextState, {
        actor: normalizedActor,
        reason: normalizedReason,
        summary: String(summary || '').trim() || 'forced seed route overwrite',
      });
      persistRecord();
      return {
        ok: true,
        actor: normalizedActor,
        reason: normalizedReason,
        backup,
        ...publishSnapshot(),
        publishResult: {
          didPublish: true,
          forced: true,
          hasConflicts: true,
          changedPaths,
          publishedPaths: changedPaths,
          diffs: comparison.changes,
          updatedAt: timestamp,
        },
      };
    },

    migrateGenerosityFundSnapshot({ defaultState, actor, reason = '' } = {}) {
      const normalizedActor = normalizeActor(actor);
      const normalizedReason = String(reason || '').trim();
      if (!normalizedActor || !normalizedReason) {
        return { ok: false, error: 'migration-actor-and-reason-required', ...publishSnapshot() };
      }

      const currentVersion = Number(
        record.snapshotMigrations?.[GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID] || 0,
      );
      if (currentVersion >= GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION) {
        return {
          ok: true,
          ...publishSnapshot(),
          migration: {
            id: GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID,
            version: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
            didMigrate: false,
            alreadyApplied: true,
          },
        };
      }

      const referenceState = normalizeSharedState(defaultState);
      const stateMigration = migrateGenerosityFundSnapshot(record.state, {
        defaultState: referenceState,
        fromVersion: currentVersion,
      });
      const baseMigration = migrateGenerosityFundSnapshot(record.baseSnapshot, {
        defaultState: referenceState,
        fromVersion: currentVersion,
      });
      if (stateMigration.migration.skipped || baseMigration.migration.skipped) {
        return {
          ok: false,
          error: 'migration-reference-state-missing',
          ...publishSnapshot(),
        };
      }

      const changed = Boolean(stateMigration.changed || baseMigration.changed);
      let backup = null;
      if (changed) {
        try {
          backup = createSharedContentBackup('before-generosity-fund-snapshot-migration', {
            action: 'generosity-fund-snapshot-migration',
            migrationId: GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID,
            migrationVersion: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
            actor: normalizedActor,
            operationReason: normalizedReason,
          });
        } catch (error) {
          return {
            ok: false,
            error: 'backup-failed',
            details: error instanceof Error ? error.message : 'backup-failed',
            ...publishSnapshot(),
          };
        }
      }

      const timestamp = now();
      const previousState = record.state;
      record = {
        ...record,
        initialized: true,
        updatedAt: timestamp,
        state: normalizeSharedState(stateMigration.state),
        baseSnapshot: normalizeSharedState(baseMigration.state),
        snapshotMigrations: {
          ...(record.snapshotMigrations || {}),
          [GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID]: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
        },
      };
      if (changed) {
        addRevisionsForChangedPaths(previousState, record.state, {
          actor: normalizedActor,
          reason: normalizedReason,
          summary: 'Generosity Fund snapshot migration',
        });
      }
      persistRecord();
      return {
        ok: true,
        actor: normalizedActor,
        reason: normalizedReason,
        backup,
        ...publishSnapshot(),
        migration: {
          id: GENEROSITY_FUND_SNAPSHOT_MIGRATION_ID,
          version: GENEROSITY_FUND_SNAPSHOT_MIGRATION_VERSION,
          didMigrate: changed,
          alreadyApplied: false,
        },
      };
    },

    getRevisionHistory(pathname) {
      const normalizedPath = String(pathname || '').trim();
      const revisions = getRevisionsForPath(normalizedPath);
      return revisions.map((revision) => ({
        id: revision.id,
        pathname: revision.pathname,
        createdAt: revision.createdAt,
        actor: revision.actor,
        reason: revision.reason,
        summary: revision.summary,
        blocks: summarizeRevisionBlocksForHistory(revision.snapshot),
      }));
    },

    listRevisions(pathname) {
      return this.getRevisionHistory(pathname);
    },

    restorePageRevision(pathname, revisionId, { actor } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedRevisionId = String(revisionId || '').trim();
      const revisions = getRevisionsForPath(normalizedPath);
      const revision = revisions.find((entry) => entry.id === normalizedRevisionId);
      if (!revision) {
        return { ok: false, error: 'revision-not-found', snapshot: publishSnapshot() };
      }
      const nextState = replacePageStateFromRevision(normalizedPath, revision);
      try {
        createSharedContentBackup('before-page-revision-restore', {
          pathname: normalizedPath,
          revisionId: normalizedRevisionId,
        });
      } catch (error) {
        return {
          ok: false,
          error: 'backup-failed',
          details: error instanceof Error ? error.message : 'backup-failed',
          snapshot: publishSnapshot(),
        };
      }
      return {
        ok: true,
        ...commitState(nextState, {
          actor,
          reason: 'page-revision-restored',
          summary: `${normalizedPath}:${normalizedRevisionId}`,
        }),
      };
    },

    restoreBlockFromRevision(pathname, revisionId, blockId, { actor } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedRevisionId = String(revisionId || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const revisions = getRevisionsForPath(normalizedPath);
      const revision = revisions.find((entry) => entry.id === normalizedRevisionId);
      if (!revision) {
        return { ok: false, error: 'revision-not-found', snapshot: publishSnapshot() };
      }
      const pageSlice = resolveRevisionSnapshotPageSlice(revision?.snapshot, normalizedPath);
      const snapshotBlocks = Array.isArray(pageSlice.blocks) ? pageSlice.blocks : [];
      const snapshotBlock = snapshotBlocks.find((entry) => String(entry?.id || '').trim() === normalizedBlockId);
      if (!snapshotBlock) {
        return { ok: false, error: 'block-not-found', snapshot: publishSnapshot() };
      }
      const nextState = normalizeSharedState(record.state);
      const currentBlocks = Array.isArray(nextState.blocksByPath[normalizedPath]) ? nextState.blocksByPath[normalizedPath] : [];
      const existingIndex = currentBlocks.findIndex((entry) => String(entry?.id || '').trim() === normalizedBlockId);
      if (existingIndex === -1) {
        currentBlocks.push(stripRetiredTargetBridgeSettingsFromBlock(snapshotBlock));
      } else {
        currentBlocks.splice(existingIndex, 1, stripRetiredTargetBridgeSettingsFromBlock(snapshotBlock));
      }
      nextState.blocksByPath[normalizedPath] = currentBlocks;
      try {
        createSharedContentBackup('before-block-revision-restore', {
          pathname: normalizedPath,
          revisionId: normalizedRevisionId,
          blockId: normalizedBlockId,
        });
      } catch (error) {
        return {
          ok: false,
          error: 'backup-failed',
          details: error instanceof Error ? error.message : 'backup-failed',
          snapshot: publishSnapshot(),
        };
      }
      return {
        ok: true,
        ...commitState(nextState, {
          actor,
          reason: 'block-revision-restored',
          summary: `${normalizedPath}:${normalizedBlockId}:${normalizedRevisionId}`,
        }),
      };
    },

    restoreBlockRevision(pathname, revisionId, blockId, options = {}) {
      return this.restoreBlockFromRevision(pathname, revisionId, blockId, options);
    },

    acquireBlockLock(pathname, blockId, actor, { force = false } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedBlockId || !normalizedActor) {
        return { ok: false, error: 'invalid-lock-request', ...publishSnapshot() };
      }
      const nextState = normalizeSharedState(record.state);
      const currentCollaboration = normalizeCollaborationByPath(nextState.collaborationByPath);
      const entry = ensureCollaborationEntry(currentCollaboration, normalizedPath);
      const currentMeta = normalizeBlockMeta(entry.blocks?.[normalizedBlockId]);
      const { lockedByOther, draftedByOther } = getForeignOwnershipMeta(currentMeta, normalizedActor);
      if (!force && lockedByOther) {
        return {
          ok: false,
          error: 'locked-by-other',
          lockedBy: lockedByOther,
          ...publishSnapshot(),
        };
      }
      if (!force && draftedByOther) {
        return {
          ok: false,
          error: 'drafted-by-other',
          draftedBy: draftedByOther,
          ...publishSnapshot(),
        };
      }
      const timestamp = now();
      const claimsForeignDraft = Boolean(force && draftedByOther);
      const released = releaseUserLocks(currentCollaboration, normalizedActor.userId, {
        keepPath: normalizedPath,
        keepBlockId: normalizedBlockId,
      });
      const nextEntry = ensureCollaborationEntry(released, normalizedPath);
      const previousActor = lockedByOther || (force ? draftedByOther : null);
      const action = lockedByOther
        ? 'block-edit-taken-over'
        : (force && draftedByOther ? 'block-draft-claimed' : 'block-locked');
      nextState.collaborationByPath = {
        ...released,
        [normalizedPath]: {
          ...nextEntry,
          blocks: {
            ...(nextEntry.blocks || {}),
            [normalizedBlockId]: {
              ...currentMeta,
              draftedBy: claimsForeignDraft ? normalizedActor : currentMeta.draftedBy,
              draftedAt: claimsForeignDraft ? timestamp : currentMeta.draftedAt,
              savedBy: currentMeta.savedBy,
              savedAt: currentMeta.savedAt,
              lockedBy: normalizedActor,
              lockedAt: timestamp,
            },
          },
          history: appendHistoryEntry(nextEntry.history, buildHistoryEntry({
            action,
            blockId: normalizedBlockId,
            actor: normalizedActor,
            previousActor,
            details: force ? 'forced' : '',
            now: timestamp,
            createId,
          })),
        },
      };
      return {
        ok: true,
        ...commitState(nextState, {
          actor: normalizedActor,
          reason: 'block-lock-updated',
          summary: `${normalizedPath}:${normalizedBlockId}`,
          trackRevisions: false,
        }),
      };
    },

    refreshBlockLock(pathname, blockId, actor) {
      return this.acquireBlockLock(pathname, blockId, actor, { force: false });
    },

    releaseBlockLock(pathname, blockId, actor) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedBlockId || !normalizedActor) {
        return { ok: false, error: 'invalid-lock-request', ...publishSnapshot() };
      }
      const nextState = normalizeSharedState(record.state);
      const entry = ensureCollaborationEntry(nextState.collaborationByPath || {}, normalizedPath);
      const currentMeta = normalizeBlockMeta(entry.blocks?.[normalizedBlockId]);
      if (currentMeta.lockedBy?.userId !== normalizedActor.userId) {
        return { ok: false, error: 'not-lock-owner', ...publishSnapshot() };
      }
      const timestamp = now();
      nextState.collaborationByPath = {
        ...(nextState.collaborationByPath || {}),
        [normalizedPath]: {
          ...entry,
          blocks: {
            ...(entry.blocks || {}),
            [normalizedBlockId]: {
              ...currentMeta,
              lockedBy: null,
              lockedAt: null,
            },
          },
          history: appendHistoryEntry(entry.history, buildHistoryEntry({
            action: 'block-unlocked',
            blockId: normalizedBlockId,
            actor: normalizedActor,
            now: timestamp,
            createId,
          })),
        },
      };
      return {
        ok: true,
        ...commitState(nextState, {
          actor: normalizedActor,
          reason: 'block-lock-updated',
          summary: `${normalizedPath}:${normalizedBlockId}`,
          trackRevisions: false,
        }),
      };
    },

    releaseBlockDraft(pathname, blockId, actor, { force = false } = {}) {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const normalizedActor = normalizeActor(actor);
      if (!normalizedPath || !normalizedBlockId || !normalizedActor) {
        return { ok: false, error: 'invalid-draft-release-request', ...publishSnapshot() };
      }

      const nextState = normalizeSharedState(record.state);
      const entry = ensureCollaborationEntry(nextState.collaborationByPath || {}, normalizedPath);
      const currentMeta = normalizeBlockMeta(entry.blocks?.[normalizedBlockId]);
      const { lockedByOther, draftedByOther } = getForeignOwnershipMeta(currentMeta, normalizedActor);
      if (!force && (lockedByOther || draftedByOther)) {
        return {
          ok: false,
          error: lockedByOther ? 'locked-by-other' : 'drafted-by-other',
          lockedBy: lockedByOther,
          draftedBy: draftedByOther,
          ...publishSnapshot(),
        };
      }

      const timestamp = now();
      const shouldClearLock = force
        || currentMeta.lockedBy?.userId === normalizedActor.userId;
      nextState.collaborationByPath = {
        ...(nextState.collaborationByPath || {}),
        [normalizedPath]: {
          ...entry,
          blocks: {
            ...(entry.blocks || {}),
            [normalizedBlockId]: {
              ...currentMeta,
              draftedBy: null,
              draftedAt: null,
              lockedBy: shouldClearLock ? null : currentMeta.lockedBy,
              lockedAt: shouldClearLock ? null : currentMeta.lockedAt,
            },
          },
          history: appendHistoryEntry(entry.history, buildHistoryEntry({
            action: 'block-draft-released',
            blockId: normalizedBlockId,
            actor: normalizedActor,
            previousActor: currentMeta.draftedBy || currentMeta.lockedBy,
            details: force ? 'forced' : '',
            now: timestamp,
            createId,
          })),
        },
      };
      return {
        ok: true,
        ...commitState(nextState, {
          actor: normalizedActor,
          reason: 'block-draft-released',
          summary: `${normalizedPath}:${normalizedBlockId}`,
          trackRevisions: false,
        }),
      };
    },

    listBackups() {
      return listBackups().map((backup) => ({
        fileName: backup.fileName,
        createdAt: backup.createdAt,
        timestamp: backup.timestamp,
        reason: backup.reason,
        gitCommitHash: backup.gitCommitHash,
        metadata: safeBackupMetadata(backup.metadata),
      }));
    },

    createBackup(reason = 'manual-backup', metadata = {}) {
      return createSharedContentBackup(reason, metadata);
    },

    promoteCurrentStateToSeed({ actor } = {}) {
      try {
        createSharedContentBackup('before-promote-to-seed-baseline', {
          action: 'promote-to-seed-baseline',
        });
      } catch (error) {
        return {
          ok: false,
          error: 'backup-failed',
          details: error instanceof Error ? error.message : 'backup-failed',
          ...publishSnapshot(),
        };
      }

      try {
        const promotedSeedBaseline = writeSeedBaselinePayload(record.state, { actor });
        return {
          ok: true,
          promotedSeedBaseline,
          seedBaseline: promotedSeedBaseline,
          ...publishSnapshot(),
        };
      } catch (error) {
        return {
          ok: false,
          error: 'seed-promotion-failed',
          details: error instanceof Error ? error.message : 'seed-promotion-failed',
          ...publishSnapshot(),
        };
      }
    },

    restoreFromBackup(backupFileName = '', { actor } = {}) {
      const requestedFileName = String(backupFileName || '').trim();
      const backups = listBackups();
      const selectedBackup = requestedFileName
        ? backups.find((backup) => backup.fileName === requestedFileName)
        : (backups[0] || null);

      if (!selectedBackup) {
        return {
          ok: false,
          error: 'backup-not-found',
          details: 'No shared content backup is available to restore.',
          ...publishSnapshot(),
        };
      }

      try {
        createSharedContentBackup('before-backup-restore', {
          restoreFromBackupFile: selectedBackup.fileName,
        });
      } catch (error) {
        return {
          ok: false,
          error: 'backup-failed',
          details: error instanceof Error ? error.message : 'backup-failed',
          ...publishSnapshot(),
        };
      }

      try {
        const backupPayload = readBackupPayload(selectedBackup.filePath);
        record = normalizeRecordWithoutInventoryRepair(
          backupPayload.record,
          maxRevisionsPerPage,
        );
        record.state = stripRetiredTargetBridgeSettingsFromState(record.state);
        record.baseSnapshot = stripRetiredTargetBridgeSettingsFromState(record.baseSnapshot);
        if (externalRevisionStorageEnabled) {
          clearExternalRevisions();
        }
        persistRecord();
        return {
          ok: true,
          restoredBackup: {
            fileName: selectedBackup.fileName,
            createdAt: selectedBackup.createdAt,
            timestamp: selectedBackup.timestamp,
            reason: selectedBackup.reason,
            gitCommitHash: selectedBackup.gitCommitHash,
            metadata: safeBackupMetadata(selectedBackup.metadata),
          },
          backups: this.listBackups(),
          ...publishSnapshot(),
        };
      } catch (error) {
        return {
          ok: false,
          error: 'backup-restore-failed',
          details: error instanceof Error ? error.message : 'backup-restore-failed',
          ...publishSnapshot(),
        };
      }
    },

    restoreBackup(backupFileName = '', options = {}) {
      return this.restoreFromBackup(backupFileName, options);
    },
  };
}

export function createDevContentAuthorityStore(options = {}) {
  return createJsonContentStore(options);
}
