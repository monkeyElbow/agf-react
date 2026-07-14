import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { sitePages } from '../data/siteMap';
import { getNativePageContent } from '../data/nativePageContent';
import {
  contentBlockBlueprintsByPath,
  genericPageFallbackBlueprint,
  genericPageBlockBlueprint,
  getAllBlockTemplateBlueprints,
} from '../data/contentBlockBlueprints';
import { getSingletonBlockKinds } from '../blocks/registry';
import {
  CTA_FORM_MAX_FIELDS,
  buildCtaFormSettingsPatch,
  formatFormChoiceOptionsText,
  normalizeCtaFormFieldType,
  normalizeLegacyCtaSubmitLabel,
  normalizeRequestFormFieldType,
} from '../blocks/foundation/forms';
import {
  DEV_IDENTITY_STORAGE_KEY,
  getOrCreateDevIdentity,
  normalizeDevIdentity,
  renameStoredDevIdentity,
  toDevIdentitySummary,
} from '../lib/devIdentity';
import { getHeroSeedContract } from '../lib/heroSeedContracts';
import {
  DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
  DEFAULT_HERO_TITLE_SIZE_REM,
  normalizeHeroTitleLetterSpacingEm,
  normalizeHeroTitleSizeRem,
} from '../lib/heroTitleSize';
import { normalizePresetBearingBlocks } from '../lib/blockPresetIdentity';
import { buildBlockTemplateCreateId } from '../lib/blockTemplateIdentity';
import { isPageContentBlock } from '../lib/pageContentIdentity';
import { normalizeTestimonialRecord } from '../lib/testimonials';
import {
  acquireSharedBlockLock,
  fetchSharedContentBackups,
  fetchSharedContentSnapshot,
  fetchSharedPageRevisionHistory,
  initializeSharedContentFromSeed,
  isDevContentAuthorityEnabled,
  publishSharedPage,
  promoteSharedContentToSeed as promoteSharedContentToSeedRequest,
  releaseSharedBlockLock,
  resetSharedContentFromSeed,
  restoreLatestSharedContentBackup as restoreLatestSharedContentBackupRequest,
  restoreSharedBlockRevision,
  restoreSharedPageRevision,
  saveSharedPageDraft,
  syncSharedBlockDraft,
} from '../lib/devContentAuthorityClient';

const STORAGE_KEY = 'agf-content-admin-v1';
const ContentAdminContext = createContext(null);
const MAX_CONTENT_HISTORY_ENTRIES = 40;
const LOCAL_BUFFERED_BLOCK_SETTING_COMMIT_DELAY_MS = 1600;
export const LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS = 1200;
const SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS = 140;
const SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS = 90;
const SHARED_ACTIVE_CONTENT_POLL_DELAY_MS = 650;
const SHARED_VISIBLE_CONTENT_POLL_DELAY_MS = 1800;
const LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH = '/services/planned-giving/charitable-gift-annuities';
const LEGACY_GIVING_ENDOWMENTS_PATH = '/services/planned-giving/endowments';
const LEGACY_GIVING_GENEROSITY_FUND_PATH = '/services/planned-giving/generosity-fund';
const LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH = '/services/planned-giving/ministry-impact-fund';
const REQUEST_FORM_DYNAMIC_PATHS = new Set([
  '/calculators',
  '/contact-us',
  '/services/loans',
  '/services/insurance/certificate-request',
  '/services/insurance/group-term-life-insurance',
  '/services/insurance/life-insurance-quote',
  '/services/insurance/property-casualty-insurance',
  LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH,
  LEGACY_GIVING_ENDOWMENTS_PATH,
  LEGACY_GIVING_GENEROSITY_FUND_PATH,
  LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH,
  '/services/loans/loan-consultants',
  '/services/retirement/retirement-consultants',
]);
const INTRO_ACTION_LOCKED_PATHS = new Set([
  '/services/insurance/group-term-life-insurance',
]);
const RETIREMENT_403B_PATH = '/services/retirement/403b';
const RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_PATH = '/services/retirement/403b/403b-individual-enrollment';
const RETIREMENT_403B_GROUP_ENROLLMENT_PATH = '/services/retirement/403b/403b-group-enrollment';
const RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH = '/services/retirement/403b-for-groups/403b-group-enrollment';
const RETIREMENT_403B_GROUP_OVERVIEW_LEGACY_PATH = '/services/retirement/403b-for-groups';
const PLANNED_GIVING_OVERVIEW_LEGACY_PATH = '/services/legacy-giving';
const PLANNED_GIVING_CHARITABLE_GIFT_ANNUITIES_LEGACY_PATH = '/services/legacy-giving/charitable-gift-annuities';
const PLANNED_GIVING_CHARITABLE_TRUSTS_LEGACY_PATH = '/services/legacy-giving/charitable-trusts';
const PLANNED_GIVING_ENDOWMENTS_LEGACY_PATH = '/services/legacy-giving/endowments';
const PLANNED_GIVING_GENEROSITY_FUND_LEGACY_PATH = '/services/legacy-giving/generosity-fund';
const PLANNED_GIVING_MINISTRY_IMPACT_FUND_LEGACY_PATH = '/services/legacy-giving/ministry-impact-fund';
const DEFAULT_MANAGED_PATH_ALIASES = {
  [RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH]: RETIREMENT_403B_GROUP_ENROLLMENT_PATH,
  [RETIREMENT_403B_GROUP_OVERVIEW_LEGACY_PATH]: RETIREMENT_403B_GROUP_ENROLLMENT_PATH,
  [PLANNED_GIVING_OVERVIEW_LEGACY_PATH]: '/services/planned-giving',
  [PLANNED_GIVING_CHARITABLE_GIFT_ANNUITIES_LEGACY_PATH]: LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH,
  [PLANNED_GIVING_CHARITABLE_TRUSTS_LEGACY_PATH]: '/services/planned-giving/charitable-trusts',
  [PLANNED_GIVING_ENDOWMENTS_LEGACY_PATH]: LEGACY_GIVING_ENDOWMENTS_PATH,
  [PLANNED_GIVING_GENEROSITY_FUND_LEGACY_PATH]: LEGACY_GIVING_GENEROSITY_FUND_PATH,
  [PLANNED_GIVING_MINISTRY_IMPACT_FUND_LEGACY_PATH]: LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH,
};
const REQUEST_FORM_MODE_LOCKED_PATHS = new Set([
  '/services/insurance/group-term-life-insurance',
  LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH,
  LEGACY_GIVING_ENDOWMENTS_PATH,
  LEGACY_GIVING_GENEROSITY_FUND_PATH,
  LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH,
]);
const REQUEST_FORM_SINGLETON_IDS_BY_PATH = Object.freeze({
  [LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH]: new Set(['request_form']),
  [LEGACY_GIVING_ENDOWMENTS_PATH]: new Set(['request_form']),
  [LEGACY_GIVING_GENEROSITY_FUND_PATH]: new Set(['request_form']),
  [LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH]: new Set(['request_form']),
});
const LOANS_LEGACY_DYNAMIC_BLOCK_IDS = new Set([
  'request_form',
  'value_cards',
  'vision_fuel',
  'cta_form',
  'testimonials',
]);
const LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_REQUEST_TARGETS = new Set([
  'class:legacy-child-native-cga-request',
  'legacy-child-native-cga-request',
]);
const LEGACY_GIVING_ENDOWMENTS_REQUEST_TARGETS = new Set([
  'class:legacy-child-native-endowments-legacy-form',
  'legacy-child-native-endowments-legacy-form',
]);
const LEGACY_GIVING_GENEROSITY_FUND_REQUEST_TARGETS = new Set([
  'class:legacy-child-native-generosity-request',
  'legacy-child-native-generosity-request',
]);
const LEGACY_GIVING_MINISTRY_IMPACT_FUND_REQUEST_TARGETS = new Set([
  'class:legacy-child-native-request',
  'legacy-child-native-request',
]);
const LIFE_INSURANCE_QUOTE_REQUEST_TARGETS = new Set([
  'class:insurance-native-life-quote',
  'insurance-native-life-quote',
]);
const EMPTY_PAGE_CONTENT_SEED_DISABLED_PATHS = new Set([
  '/services/investments/invest-by-mail',
  '/services/loans/loan-consultants',
  '/services/retirement/403b/403b-terms-definitions',
  '/services/retirement/403b/403b-group-enrollment',
  '/services/retirement/409a',
  '/services/retirement/iras/fund-an-ira',
  '/services/retirement/rollovers',
  '/services/insurance/life-insurance-quote',
  '/services/insurance/ministers-group-life-plan',
  '/services/insurance/mission-assure',
  '/services/insurance/mission-assure/report-a-claim',
  '/services/insurance/property-casualty-insurance',
  '/about-us',
  '/about-us/careers',
  '/resources',
  '/forms',
  '/calculators/emergency-fund',
  '/calculators/increased-contribution',
  '/calculators/net-worth',
  '/contact-us',
  '/online-contributions',
  '/prospectus',
  '/subscribe',
  '/search',
  '/sitemap',
  '/terms-of-service',
  '/privacy-policy',
  '/accessibility',
  '/vineyard',
  '/yourplan',
]);

function isBlankSettingsObject(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return true;
  }
  return Object.keys(settings).length === 0;
}

function isStaleLegacyRequestTarget(settings, expectedTargets, expectedClassName) {
  const targetKey = String(settings?.targetSectionKey || '').trim();
  const targetClassName = String(settings?.targetSectionClassName || '').trim();

  if (!targetKey && !targetClassName) {
    return true;
  }

  if (targetKey && !expectedTargets.has(targetKey)) {
    return true;
  }

  if (targetClassName && targetClassName !== expectedClassName) {
    return true;
  }

  return false;
}

function isStaleLegacyCharitableGiftAnnuitiesRequestTarget(settings) {
  return isStaleLegacyRequestTarget(
    settings,
    LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_REQUEST_TARGETS,
    'legacy-child-native-cga-request',
  );
}

function isStaleLegacyGenerosityFundRequestTarget(settings) {
  return isStaleLegacyRequestTarget(
    settings,
    LEGACY_GIVING_GENEROSITY_FUND_REQUEST_TARGETS,
    'legacy-child-native-generosity-request',
  );
}

function isStaleLegacyMinistryImpactFundRequestTarget(settings) {
  return isStaleLegacyRequestTarget(
    settings,
    LEGACY_GIVING_MINISTRY_IMPACT_FUND_REQUEST_TARGETS,
    'legacy-child-native-request',
  );
}

function isStaleLifeInsuranceQuoteRequestTarget(settings) {
  const targetKey = String(settings?.targetSectionKey || '').trim();
  const targetClassName = String(settings?.targetSectionClassName || '').trim();
  return LIFE_INSURANCE_QUOTE_REQUEST_TARGETS.has(targetKey)
    || LIFE_INSURANCE_QUOTE_REQUEST_TARGETS.has(targetClassName);
}

function isStalePropertyCasualtyRequestContent(settings) {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  const title = String(settings.title || '').trim();
  const subtitle = String(settings.subtitle || '').trim();
  const body = String(settings.body || '').trim();
  const step1NextLabel = String(settings.step1NextLabel || '').trim();

  return (
    title.includes('Property & Casualty Insurance Quote')
    || subtitle.includes('We’re passionate about protecting your ministry.')
    || body.includes('We’re passionate about protecting your ministry.')
    || body.includes('Share a few details and we’ll help you explore broader coverage')
    || step1NextLabel === 'Go to next step'
  );
}

function isLegacyRetirement403bLoanApplySettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  const card1Title = String(settings.card1Title || '').trim().toLowerCase();
  const card2Title = String(settings.card2Title || '').trim().toLowerCase();
  const card3Title = String(settings.card3Title || '').trim().toLowerCase();
  const card3Body = String(settings.card3Body || '').trim().toLowerCase();
  const card4Title = String(settings.card4Title || '').trim();
  const card5Title = String(settings.card5Title || '').trim();
  const card6Title = String(settings.card6Title || '').trim();

  const hasLegacyTitles = (
    card1Title.includes('review and understand the loan rules')
    || card2Title.includes('log in to your profile')
    || card3Title.includes('submit your application')
    || /^1\)\s+/.test(card1Title)
    || /^2\)\s+/.test(card2Title)
    || /^3\)\s+/.test(card3Title)
  );
  const hasLegacyApplicationBody = (
    card3Body.includes('manage my retirement')
    || card3Body.includes('loan services')
    || card3Body.includes('loan modeling/request')
  );
  const hasLegacyThreeStepShape = !card4Title && !card5Title && !card6Title;

  return hasLegacyThreeStepShape && (hasLegacyTitles || hasLegacyApplicationBody);
}

function normalizeRetirementLandingCtaSettings(settings, defaultSettings = {}) {
  const nextSettings = {
    ...(defaultSettings && typeof defaultSettings === 'object' ? defaultSettings : {}),
    ...(settings && typeof settings === 'object' ? settings : {}),
  };
  const field4Label = String(nextSettings.field4Label || '').trim().toLowerCase();
  const field4Type = String(nextSettings.field4Type || '').trim().toLowerCase();
  const hasStateField = field4Type === 'select' && field4Label === 'state';
  const hasLegacyMessageField = field4Label === 'message' || field4Type === 'textarea';
  const defaultField4Options = defaultSettings?.field4Options;
  const serializedStateOptions = Array.isArray(defaultField4Options)
    ? formatFormChoiceOptionsText(defaultField4Options)
    : String(defaultField4Options || '').trim();

  nextSettings.bodyHtml = '';

  if (!hasStateField && hasLegacyMessageField) {
    nextSettings.field4Enabled = true;
    nextSettings.field4Type = 'select';
    nextSettings.field4Label = 'State';
    nextSettings.field4Placeholder = 'Select a State';
    nextSettings.field4Options = serializedStateOptions;
    nextSettings.field4Required = true;
    nextSettings.field5Enabled = true;
    nextSettings.field5Type = 'textarea';
    nextSettings.field5Label = 'Message';
    nextSettings.field5Placeholder = 'What would you like to discuss?';
    nextSettings.field5Options = '';
    nextSettings.field5Required = false;
  }

  return nextSettings;
}

function isStaleLegacyEndowmentsRequestTarget(settings) {
  return isStaleLegacyRequestTarget(
    settings,
    LEGACY_GIVING_ENDOWMENTS_REQUEST_TARGETS,
    'legacy-child-native-endowments-legacy-form',
  );
}

function cloneCanonicalRequestFormBlock(defaultBlock, storedBlock) {
  return {
    ...cloneTemplateVariant(defaultBlock),
    id: defaultBlock.id || storedBlock.id,
    name: defaultBlock.name || storedBlock.name,
    kind: defaultBlock.kind || storedBlock.kind,
    mode: 'dynamic',
    hidden: false,
    settings: {
      ...(defaultBlock?.settings || {}),
    },
    editableFields: Array.isArray(defaultBlock?.editableFields)
      ? [...defaultBlock.editableFields]
      : [],
  };
}

function normalizeContentActor(rawActor) {
  const source = rawActor && typeof rawActor === 'object' ? rawActor : null;
  if (!source) {
    return null;
  }
  return toDevIdentitySummary(source);
}

function normalizeContentBlockMeta(rawMeta) {
  const source = rawMeta && typeof rawMeta === 'object' ? rawMeta : {};
  return {
    draftedBy: normalizeContentActor(source.draftedBy),
    draftedAt: Number.isFinite(Number(source.draftedAt)) ? Number(source.draftedAt) : null,
    savedBy: normalizeContentActor(source.savedBy),
    savedAt: Number.isFinite(Number(source.savedAt)) ? Number(source.savedAt) : null,
    lockedBy: normalizeContentActor(source.lockedBy),
    lockedAt: Number.isFinite(Number(source.lockedAt)) ? Number(source.lockedAt) : null,
  };
}

function normalizeContentHistoryEntry(rawEntry) {
  const source = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  const action = String(source.action || '').trim();
  const actor = normalizeContentActor(source.actor || source.createdBy);
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
    previousActor: normalizeContentActor(source.previousActor),
    createdAt,
  };
}

function normalizeCollaborationState(rawState) {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const next = {};

  Object.entries(source).forEach(([pathname, rawEntry]) => {
    const entry = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
    const normalizedBlocks = {};

    Object.entries(entry.blocks || {}).forEach(([blockId, blockMeta]) => {
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedBlockId) {
        return;
      }
      normalizedBlocks[normalizedBlockId] = normalizeContentBlockMeta(blockMeta);
    });

    const history = (Array.isArray(entry.history) ? entry.history : [])
      .map(normalizeContentHistoryEntry)
      .filter(Boolean)
      .slice(0, MAX_CONTENT_HISTORY_ENTRIES);

    next[pathname] = {
      blocks: normalizedBlocks,
      history,
    };
  });

  return next;
}

function normalizeSharedSaveResult(rawResult) {
  const source = rawResult && typeof rawResult === 'object' ? rawResult : {};
  return {
    error: String(source.error || '').trim(),
    didSave: Boolean(source.didSave),
    hasConflicts: Boolean(source.hasConflicts),
    changedPaths: Array.isArray(source.changedPaths) ? source.changedPaths.map((value) => String(value || '').trim()).filter(Boolean) : [],
    savedPaths: Array.isArray(source.savedPaths) ? source.savedPaths.map((value) => String(value || '').trim()).filter(Boolean) : [],
    savedBlockIdsByPath: Object.fromEntries(
      Object.entries(source.savedBlockIdsByPath || {}).map(([pathname, blockIds]) => [
        String(pathname || '').trim(),
        (Array.isArray(blockIds) ? blockIds : []).map((value) => String(value || '').trim()).filter(Boolean),
      ]),
    ),
    blockedBlockIdsByPath: Object.fromEntries(
      Object.entries(source.blockedBlockIdsByPath || {}).map(([pathname, blockIds]) => [
        String(pathname || '').trim(),
        (Array.isArray(blockIds) ? blockIds : []).map((value) => String(value || '').trim()).filter(Boolean),
      ]),
    ),
    blockedBlocks: (Array.isArray(source.blockedBlocks) ? source.blockedBlocks : [])
      .map((entry) => ({
        pathname: String(entry?.pathname || '').trim(),
        blockId: String(entry?.blockId || '').trim(),
        reason: String(entry?.reason || '').trim(),
        state: String(entry?.state || '').trim(),
        owner: normalizeContentActor(entry?.owner),
      }))
      .filter((entry) => entry.pathname && entry.blockId),
    updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now(),
  };
}

function normalizeSharedPublishResult(rawResult) {
  const source = rawResult && typeof rawResult === 'object' ? rawResult : {};
  return {
    error: String(source.error || '').trim(),
    didPublish: Boolean(source.didPublish),
    hasConflicts: Boolean(source.hasConflicts),
    changedPaths: Array.isArray(source.changedPaths) ? source.changedPaths.map((value) => String(value || '').trim()).filter(Boolean) : [],
    publishedPaths: Array.isArray(source.publishedPaths) ? source.publishedPaths.map((value) => String(value || '').trim()).filter(Boolean) : [],
    publishedBlockIdsByPath: Object.fromEntries(
      Object.entries(source.publishedBlockIdsByPath || {}).map(([pathname, blockIds]) => [
        String(pathname || '').trim(),
        (Array.isArray(blockIds) ? blockIds : []).map((value) => String(value || '').trim()).filter(Boolean),
      ]),
    ),
    blockedBlockIdsByPath: Object.fromEntries(
      Object.entries(source.blockedBlockIdsByPath || {}).map(([pathname, blockIds]) => [
        String(pathname || '').trim(),
        (Array.isArray(blockIds) ? blockIds : []).map((value) => String(value || '').trim()).filter(Boolean),
      ]),
    ),
    blockedBlocks: (Array.isArray(source.blockedBlocks) ? source.blockedBlocks : [])
      .map((entry) => ({
        pathname: String(entry?.pathname || '').trim(),
        blockId: String(entry?.blockId || '').trim(),
        reason: String(entry?.reason || '').trim(),
        state: String(entry?.state || '').trim(),
        owner: normalizeContentActor(entry?.owner),
      }))
      .filter((entry) => entry.pathname && entry.blockId),
    hasOrderChangesByPath: Object.fromEntries(
      Object.entries(source.hasOrderChangesByPath || {}).map(([pathname, hasChanges]) => [
        String(pathname || '').trim(),
        Boolean(hasChanges),
      ]),
    ),
    hasPageMetaChangesByPath: Object.fromEntries(
      Object.entries(source.hasPageMetaChangesByPath || {}).map(([pathname, hasChanges]) => [
        String(pathname || '').trim(),
        Boolean(hasChanges),
      ]),
    ),
    updatedAt: Number.isFinite(Number(source.updatedAt)) ? Number(source.updatedAt) : Date.now(),
  };
}

export function getSharedContentPollDelay(isDocumentHidden) {
  return getSharedContentPollDelayForActivity(isDocumentHidden, false);
}

export function getSharedContentPollDelayForActivity(isDocumentHidden, hasActiveEditing) {
  if (isDocumentHidden) {
    return 10000;
  }
  return hasActiveEditing ? SHARED_ACTIVE_CONTENT_POLL_DELAY_MS : SHARED_VISIBLE_CONTENT_POLL_DELAY_MS;
}

export function mergeSharedCollaborationSnapshot(currentState, snapshotState) {
  if (JSON.stringify(currentState?.collaborationByPath || {}) === JSON.stringify(snapshotState?.collaborationByPath || {})) {
    return currentState;
  }
  return {
    ...currentState,
    collaborationByPath: snapshotState?.collaborationByPath || {},
  };
}

function blockSettingsValueEquals(left, right) {
  if (Object.is(left, right)) {
    return true;
  }
  if (
    left == null
    || right == null
    || typeof left !== 'object'
    || typeof right !== 'object'
  ) {
    return false;
  }
  return JSON.stringify(left) === JSON.stringify(right);
}

function blockSnapshotEquals(left, right) {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeBlocksPreservingReferences(currentBlocks, nextBlocks) {
  const currentList = Array.isArray(currentBlocks) ? currentBlocks : [];
  const nextList = Array.isArray(nextBlocks) ? nextBlocks : [];
  const currentById = new Map(currentList.map((block) => [String(block?.id || '').trim(), block]));
  let changed = currentList.length !== nextList.length;
  const merged = nextList.map((nextBlock, index) => {
    const nextId = String(nextBlock?.id || '').trim();
    const currentBlock = currentById.get(nextId);
    if (currentBlock && blockSnapshotEquals(currentBlock, nextBlock)) {
      if (currentList[index] !== currentBlock) {
        changed = true;
      }
      return currentBlock;
    }
    changed = true;
    return nextBlock;
  });
  return changed ? merged : currentList;
}

function getComparablePageAliases(pathAliases, pathname) {
  const normalizedPath = String(pathname || '').trim();
  return Object.fromEntries(
    Object.entries(pathAliases || {}).filter(([fromPath, toPath]) => (
      String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath
    )),
  );
}

function collectChangedCollaborationPaths(currentState, snapshotState) {
  const allPaths = new Set([
    ...Object.keys(currentState?.collaborationByPath || {}),
    ...Object.keys(snapshotState?.collaborationByPath || {}),
  ]);
  return [...allPaths].filter((pathname) => (
    JSON.stringify(currentState?.collaborationByPath?.[pathname] || null)
    !== JSON.stringify(snapshotState?.collaborationByPath?.[pathname] || null)
  ));
}

export function mergeSharedAuthoringSnapshot(currentState, snapshotState, options = {}) {
  const authoringPaths = new Set(Array.isArray(options.authoringPaths) ? options.authoringPaths : []);
  const collaborationPaths = new Set(Array.isArray(options.collaborationPaths) ? options.collaborationPaths : []);
  if (!authoringPaths.size && !collaborationPaths.size) {
    return currentState;
  }

  let blocksByPath = currentState.blocksByPath || {};
  let pageHierarchy = currentState.pageHierarchy || {};
  let pathAliases = currentState.pathAliases || {};
  let collaborationByPath = currentState.collaborationByPath || {};

  authoringPaths.forEach((pathname) => {
    const nextBlocks = mergeBlocksPreservingReferences(
      currentState.blocksByPath?.[pathname] || [],
      snapshotState.blocksByPath?.[pathname] || [],
    );
    if (nextBlocks !== (currentState.blocksByPath?.[pathname] || [])) {
      if (blocksByPath === currentState.blocksByPath) {
        blocksByPath = {
          ...(currentState.blocksByPath || {}),
        };
      }
      blocksByPath[pathname] = nextBlocks;
    }

    const currentPage = currentState.pageHierarchy?.[pathname] || null;
    const nextPage = snapshotState.pageHierarchy?.[pathname] || null;
    if (JSON.stringify(currentPage) !== JSON.stringify(nextPage)) {
      if (pageHierarchy === currentState.pageHierarchy) {
        pageHierarchy = {
          ...(currentState.pageHierarchy || {}),
        };
      }
      pageHierarchy[pathname] = nextPage;
    }

    const currentAliases = getComparablePageAliases(currentState.pathAliases, pathname);
    const nextAliases = getComparablePageAliases(snapshotState.pathAliases, pathname);
    if (JSON.stringify(currentAliases) !== JSON.stringify(nextAliases)) {
      if (pathAliases === currentState.pathAliases) {
        pathAliases = { ...(currentState.pathAliases || {}) };
      }
      Object.keys(pathAliases).forEach((fromPath) => {
        const toPath = pathAliases[fromPath];
        if (String(fromPath || '').trim() === pathname || String(toPath || '').trim() === pathname) {
          delete pathAliases[fromPath];
        }
      });
      Object.assign(pathAliases, nextAliases);
    }
  });

  collaborationPaths.forEach((pathname) => {
    const currentEntry = currentState.collaborationByPath?.[pathname] || null;
    const nextEntry = snapshotState.collaborationByPath?.[pathname] || null;
    if (JSON.stringify(currentEntry) === JSON.stringify(nextEntry)) {
      return;
    }
    if (collaborationByPath === currentState.collaborationByPath) {
      collaborationByPath = {
        ...(currentState.collaborationByPath || {}),
      };
    }
    collaborationByPath[pathname] = nextEntry;
  });

  if (
    blocksByPath === currentState.blocksByPath
    && pageHierarchy === currentState.pageHierarchy
    && pathAliases === currentState.pathAliases
    && collaborationByPath === currentState.collaborationByPath
  ) {
    return currentState;
  }

  return {
    ...currentState,
    blocksByPath,
    pageHierarchy,
    pathAliases,
    collaborationByPath,
  };
}

function hasActiveSharedEditing(state, currentActor = null) {
  const currentUserId = String(currentActor?.userId || '').trim();
  return Object.values(state?.collaborationByPath || {}).some((entry) => (
    Object.values(entry?.blocks || {}).some((meta) => {
      const lockedById = String(meta?.lockedBy?.userId || '').trim();
      return Boolean(lockedById && lockedById !== currentUserId);
    })
  ));
}

const TEXT_LIKE_BLOCK_SETTING_PATTERN = /(text|title|heading|body|html|subtitle|label|message|copy|lead|followup|caption|alt|placeholder|options|url|ref|note|summary|json)/i;
const CONTINUOUS_NUMERIC_BLOCK_SETTING_PATTERN = /(spacing|size|width|height|padding|space|opacity|offset|share|radius|scale|letter|line|maxwidth|contentmaxwidth|ms)/i;
const IMMEDIATE_BLOCK_SETTING_PATTERN = /^(bgTone|textTone|justify|buttonStyle|buttonTone|mode|hidden|openInNewWindow|selectionMode|autoplay|enabled|required|type|fontFamily|fontWeight|animationPreset|actionJustify|heightMode)$/i;

export function shouldBufferLocalBlockSetting(settingKey = '', settingValue = undefined) {
  const normalizedSettingKey = String(settingKey || '').trim();
  if (normalizedSettingKey && IMMEDIATE_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return false;
  }
  if (normalizedSettingKey && TEXT_LIKE_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return true;
  }
  if (normalizedSettingKey && CONTINUOUS_NUMERIC_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return true;
  }
  if (typeof settingValue === 'string') {
    return true;
  }
  return false;
}

export function getSharedBlockDraftSyncDelay(settingKey = '', settingValue = undefined, patch = null) {
  const normalizedSettingKey = String(settingKey || '').trim();
  if (normalizedSettingKey && IMMEDIATE_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS;
  }
  if (normalizedSettingKey && TEXT_LIKE_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  if (normalizedSettingKey && CONTINUOUS_NUMERIC_BLOCK_SETTING_PATTERN.test(normalizedSettingKey)) {
    return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  if (typeof settingValue === 'string') {
    return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  if (typeof settingValue === 'number') {
    return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  if (typeof settingValue === 'boolean') {
    return SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS;
  }
  if (patch && typeof patch === 'object') {
    const patchKeys = Object.keys(patch);
    const hasOnlyImmediateFields = patchKeys.length > 0 && patchKeys.every((key) => IMMEDIATE_BLOCK_SETTING_PATTERN.test(key));
    return hasOnlyImmediateFields
      ? SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS
      : SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
  }
  return SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS;
}

export function applyBufferedBlockSettingEditsToBlocksByPath(blocksByPath, bufferedEdits) {
  if (!bufferedEdits || typeof bufferedEdits !== 'object') {
    return blocksByPath;
  }

  let nextBlocksByPath = blocksByPath || {};
  let changed = false;

  Object.entries(bufferedEdits).forEach(([pathname, blockEdits]) => {
    if (!blockEdits || typeof blockEdits !== 'object') {
      return;
    }
    const currentBlocks = Array.isArray(nextBlocksByPath?.[pathname]) ? nextBlocksByPath[pathname] : [];
    if (!currentBlocks.length) {
      return;
    }

    let didChangePath = false;
    const nextBlocks = currentBlocks.map((block) => {
      const blockPatch = blockEdits[String(block?.id || '').trim()];
      if (!blockPatch || typeof blockPatch !== 'object') {
        return block;
      }
      const patchEntries = Object.entries(blockPatch);
      if (!patchEntries.length) {
        return block;
      }

      let nextSettings = block.settings || {};
      let didChangeBlock = false;
      patchEntries.forEach(([settingKey, settingValue]) => {
        if (blockSettingsValueEquals(nextSettings?.[settingKey], settingValue)) {
          return;
        }
        if (!didChangeBlock) {
          nextSettings = {
            ...(block.settings || {}),
          };
          didChangeBlock = true;
        }
        nextSettings[settingKey] = settingValue;
      });

      if (!didChangeBlock) {
        return block;
      }

      didChangePath = true;
      const nextBlock = {
        ...block,
        settings: nextSettings,
      };
      if (
        String(nextBlock.id || '').trim() === 'hero'
        && String(nextBlock.mode || '').trim().toLowerCase() === 'dynamic'
      ) {
        return {
          ...nextBlock,
          settings: normalizeDynamicHeroSettings(pathname, nextBlock.settings),
        };
      }
      return nextBlock;
    });

    if (!didChangePath) {
      return;
    }
    if (nextBlocksByPath === blocksByPath) {
      nextBlocksByPath = {
        ...(blocksByPath || {}),
      };
    }
    nextBlocksByPath[pathname] = normalizePageBlocksState(nextBlocks);
    changed = true;
  });

  return changed ? nextBlocksByPath : blocksByPath;
}

function applyBufferedBlockSettingEditsToState(currentState, bufferedEdits) {
  const nextBlocksByPath = applyBufferedBlockSettingEditsToBlocksByPath(currentState?.blocksByPath || {}, bufferedEdits);
  if (nextBlocksByPath === (currentState?.blocksByPath || {})) {
    return currentState;
  }
  return {
    ...currentState,
    blocksByPath: nextBlocksByPath,
  };
}

function readInitialDevIdentity() {
  return getOrCreateDevIdentity();
}

function buildHistoryEntry({ action, blockId = '', actor, details = '', previousActor = null, now = Date.now() }) {
  const normalizedActor = normalizeContentActor(actor);
  if (!normalizedActor) {
    return null;
  }
  const normalizedPreviousActor = normalizeContentActor(previousActor);
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    action: String(action || '').trim(),
    blockId: String(blockId || '').trim(),
    details: String(details || '').trim(),
    actor: normalizedActor,
    previousActor: normalizedPreviousActor,
    createdAt: now,
  };
}

function appendHistoryEntry(history, nextEntry) {
  const entry = normalizeContentHistoryEntry(nextEntry);
  const current = Array.isArray(history) ? history : [];
  if (!entry) {
    return current;
  }
  return [entry, ...current].slice(0, MAX_CONTENT_HISTORY_ENTRIES);
}

function buildEditingBlockMeta(previousMeta, actor, now = Date.now()) {
  const current = normalizeContentBlockMeta(previousMeta);
  const normalizedActor = normalizeContentActor(actor);
  if (!normalizedActor) {
    return current;
  }

  return {
    draftedBy: current.draftedBy,
    draftedAt: current.draftedAt,
    savedBy: current.savedBy,
    savedAt: current.savedAt,
    lockedBy: normalizedActor,
    lockedAt: now,
  };
}

function getForeignOwnershipMeta(meta, actor) {
  const normalizedMeta = normalizeContentBlockMeta(meta);
  const normalizedActor = normalizeContentActor(actor);
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

function releaseUserLocks(collaborationByPath, userId, { keepPath = '', keepBlockId = '' } = {}) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return collaborationByPath && typeof collaborationByPath === 'object' ? collaborationByPath : {};
  }

  const source = collaborationByPath && typeof collaborationByPath === 'object' ? collaborationByPath : {};
  let changed = false;
  const next = {};

  Object.entries(source).forEach(([pathname, entry]) => {
    const blocks = entry?.blocks || {};
    let blockChanged = false;
    const nextBlocks = {};

    Object.entries(blocks).forEach(([blockId, rawMeta]) => {
      const meta = normalizeContentBlockMeta(rawMeta);
      const shouldKeep = pathname === keepPath && blockId === keepBlockId;
      if (!shouldKeep && meta.lockedBy?.userId === normalizedUserId) {
        blockChanged = true;
        nextBlocks[blockId] = {
          ...meta,
          lockedBy: null,
          lockedAt: null,
        };
        return;
      }
      nextBlocks[blockId] = meta;
    });

    next[pathname] = blockChanged
      ? { ...entry, blocks: nextBlocks }
      : entry;
    changed = changed || blockChanged;
  });

  return changed ? next : source;
}

function shouldUpgradeLegacyLoansDynamicBlock(pathname, storedBlock, defaultBlock) {
  if (pathname !== '/services/loans') {
    return false;
  }

  const blockId = String(storedBlock?.id || '').trim();
  if (!LOANS_LEGACY_DYNAMIC_BLOCK_IDS.has(blockId)) {
    return false;
  }

  const defaultMode = String(defaultBlock?.mode || '').trim().toLowerCase();
  const storedMode = String(storedBlock?.mode || '').trim().toLowerCase();
  if (defaultMode !== 'dynamic' || storedMode === 'dynamic') {
    return false;
  }

  const hasEditableFields = Array.isArray(storedBlock?.editableFields) && storedBlock.editableFields.length > 0;
  const hasSettings = !isBlankSettingsObject(storedBlock?.settings);
  const storedKind = String(storedBlock?.kind || '').trim().toLowerCase();
  const defaultKind = String(defaultBlock?.kind || '').trim().toLowerCase();

  return !hasEditableFields && (!hasSettings || storedKind !== defaultKind);
}

function normalizeManagedPathInput(value) {
  const source = String(value || '').trim();
  if (!source) {
    return '';
  }

  const withLeading = source.startsWith('/') ? source : `/${source}`;
  const compact = withLeading.replace(/\/{2,}/g, '/');
  if (compact.length > 1 && compact.endsWith('/')) {
    return compact.slice(0, -1);
  }
  return compact;
}

function resolveAliasPath(pathname, aliases) {
  const start = normalizeManagedPathInput(pathname);
  if (!start) {
    return '';
  }
  const map = aliases && typeof aliases === 'object' ? aliases : {};
  let current = start;
  const seen = new Set();
  let guard = 0;

  while (map[current] && !seen.has(current) && guard < 40) {
    seen.add(current);
    current = normalizeManagedPathInput(map[current]);
    guard += 1;
  }

  return current || start;
}

function normalizePathAliases(rawAliases, pageHierarchy) {
  const source = rawAliases && typeof rawAliases === 'object' ? rawAliases : {};
  const knownPaths = new Set(Object.keys(pageHierarchy || {}));
  const next = {};

  Object.entries(source).forEach(([fromRaw, toRaw]) => {
    const from = normalizeManagedPathInput(fromRaw);
    const to = normalizeManagedPathInput(toRaw);
    if (!from || !to || from === to) {
      return;
    }
    if (knownPaths.has(from)) {
      return;
    }
    next[from] = to;
  });

  const collapsed = {};
  Object.keys(next).forEach((from) => {
    const target = resolveAliasPath(next[from], next);
    if (!target || from === target) {
      return;
    }
    collapsed[from] = target;
  });

  return collapsed;
}

function normalizeManagedLinkRef(value) {
  return String(value || '').trim();
}

function inferParentPath(pathname, pathSet) {
  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 1) {
    segments.pop();
    const candidate = `/${segments.join('/')}`;
    if (pathSet.has(candidate)) {
      return candidate;
    }
  }

  if (pathSet.has('/')) {
    return '/';
  }

  return null;
}

function buildDefaultPageHierarchy() {
  const pathSet = new Set(sitePages.map((page) => page.path));
  const byPath = {};

  sitePages.forEach((page) => {
    if (page.path.startsWith('/admin/')) {
      return;
    }

    byPath[page.path] = {
      path: page.path,
      routeKey: page.path,
      linkRef: String(page.linkRef || page.path),
      title: page.title,
      breadcrumbLabel: page.title,
      parentPath: inferParentPath(page.path, pathSet),
      section: page.section,
      source: page.source,
      hideFromSitemap: Boolean(page.hideFromSitemap),
    };
  });

  return byPath;
}

function orderDefaultBlocksForPath(pathname, blueprintBlocks) {
  const blocks = Array.isArray(blueprintBlocks) ? [...blueprintBlocks] : [];
  if (pathname !== '/test') {
    return blocks;
  }

  const ctaBlocks = [];
  const nonCtaBlocks = [];

  blocks.forEach((block) => {
    const blockId = String(block?.id || '').trim().toLowerCase();
    const blockKind = String(block?.kind || '').trim().toLowerCase();
    if (blockId === 'cta_form' || blockKind === 'cta_form') {
      ctaBlocks.push(block);
      return;
    }
    nonCtaBlocks.push(block);
  });

  return [...nonCtaBlocks, ...ctaBlocks];
}

function dedupeBlocksById(blocks) {
  const seenIds = new Set();
  const deduped = [];
  (Array.isArray(blocks) ? blocks : []).forEach((block) => {
    const blockId = String(block?.id || '').trim();
    if (!blockId || seenIds.has(blockId)) {
      return;
    }
    seenIds.add(blockId);
    deduped.push(block);
  });
  return deduped;
}

function dedupeBlocksByIdPreferLatest(blocks) {
  const source = Array.isArray(blocks) ? blocks : [];
  const seenIds = new Set();
  const deduped = [];

  for (let index = source.length - 1; index >= 0; index -= 1) {
    const block = source[index];
    const blockId = String(block?.id || '').trim();
    if (!blockId || seenIds.has(blockId)) {
      continue;
    }
    seenIds.add(blockId);
    deduped.unshift(block);
  }

  return deduped;
}

const HOME_MINISTRY_ALLIES_BLOCK_ID = 'home_ministry_allies';
const HOME_DO_THE_MATH_BLOCK_ID = 'home_do_the_math';
const HOME_LOCKED_DYNAMIC_BLOCK_IDS = new Set([HOME_MINISTRY_ALLIES_BLOCK_ID, HOME_DO_THE_MATH_BLOCK_ID]);

const SINGLETON_BLOCK_KINDS = getSingletonBlockKinds();

function normalizeSingletonKindBlocks(blocks) {
  const list = Array.isArray(blocks) ? [...blocks] : [];
  SINGLETON_BLOCK_KINDS.forEach((kind) => {
    const matches = [];
    list.forEach((block, index) => {
      if (String(block?.kind || '').trim().toLowerCase() === kind) {
        matches.push({ block, index });
      }
    });
    if (matches.length <= 1) {
      return;
    }

    const preferredMatch = matches.find((entry) => String(entry?.block?.id || '').trim() === kind);
    if (!preferredMatch) {
      return;
    }
    const keepIndex = preferredMatch.index;

    for (let idx = list.length - 1; idx >= 0; idx -= 1) {
      if (idx === keepIndex) {
        continue;
      }
      if (String(list[idx]?.kind || '').trim().toLowerCase() === kind) {
        list.splice(idx, 1);
      }
    }
  });
  return list;
}

function normalizePageBlocksState(blocks) {
  return normalizePresetBearingBlocks(
    normalizeSingletonKindBlocks(dedupeBlocksByIdPreferLatest(blocks)),
  );
}

function normalizeBlockDisplayName(name, mode, fallbackName = '', blockKind = '') {
  const modeValue = String(mode || '').trim().toLowerCase();
  const preferredFallback = String(fallbackName || '').trim();
  const source = String(name || '').trim() || preferredFallback;
  const normalizedKind = String(blockKind || '').trim().toLowerCase();
  if (!source) {
    return normalizedKind === 'billboard' ? 'Billboard' : '';
  }
  if (normalizedKind === 'billboard') {
    return 'Billboard';
  }
  if (modeValue !== 'dynamic') {
    return source;
  }

  return source
    .replace(/^dynamic\s+/i, '')
    .replace(/\s*\(dynamic\)\s*$/i, '')
    .trim() || preferredFallback;
}

const HERO_COLOR_CLASS_TOKENS = new Set([
  'is-atlantean',
  'is-mango',
  'is-melon',
  'is-super-grey',
  'is-sandstone',
  'is-white',
]);

function normalizeHeroColorClassToken(value, fallback = '') {
  const source = String(value || '').trim().toLowerCase();
  const stripped = source.startsWith('is-') ? source.slice(3) : source;
  const aliasMap = {
    blue: 'is-atlantean',
    atlantean: 'is-atlantean',
    mango: 'is-mango',
    melon: 'is-melon',
    grey: 'is-super-grey',
    supergrey: 'is-super-grey',
    'super-grey': 'is-super-grey',
    sandstone: 'is-sandstone',
    sand: 'is-sandstone',
    white: 'is-white',
  };

  const normalized = HERO_COLOR_CLASS_TOKENS.has(source)
    ? source
    : aliasMap[stripped] || '';
  if (normalized) {
    return normalized;
  }
  const fallbackToken = String(fallback || '').trim().toLowerCase();
  if (HERO_COLOR_CLASS_TOKENS.has(fallbackToken)) {
    return fallbackToken;
  }
  const fallbackStripped = fallbackToken.startsWith('is-') ? fallbackToken.slice(3) : fallbackToken;
  return aliasMap[fallbackStripped] || '';
}

function extractHeroColorClassTokenFromClassName(value) {
  const tokens = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let matched = '';
  tokens.forEach((token) => {
    const normalized = normalizeHeroColorClassToken(token);
    if (normalized) {
      matched = normalized;
    }
  });
  return matched;
}

function enforceHeroBaseClassName(value, requiredClassName, options = {}) {
  const requiredTokens = String(requiredClassName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!requiredTokens.length) {
    return String(value || '').trim();
  }

  const dropTokens = new Set(
    (Array.isArray(options?.dropTokens) ? options.dropTokens : [])
      .map((token) => String(token || '').trim().toLowerCase())
      .filter(Boolean),
  );
  const preserveCustomTokens = options?.preserveCustomTokens !== false;

  const sourceTokens = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const requiredTokenSet = new Set(requiredTokens.map((token) => token.toLowerCase()));
  const colorToken = extractHeroColorClassTokenFromClassName(sourceTokens.join(' '));
  const extraTokens = preserveCustomTokens ? sourceTokens.filter((token) => {
    const normalized = token.toLowerCase();
    if (requiredTokenSet.has(normalized)) {
      return false;
    }
    if (dropTokens.has(normalized)) {
      return false;
    }
    if (HERO_COLOR_CLASS_TOKENS.has(normalized)) {
      return false;
    }
    return true;
  }) : [];

  const nextTokens = [...requiredTokens, ...extraTokens];
  if (colorToken && !nextTokens.some((token) => token.toLowerCase() === colorToken)) {
    nextTokens.push(colorToken);
  }
  return nextTokens.join(' ').trim();
}

function normalizeLoansHeroSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const contract = getHeroSeedContract('/services/loans');
  const animationPresetToken = String(settings.animationPreset || '').trim().toLowerCase();
  const line1Raw = String(settings.line1ClassName || '').trim().toLowerCase();
  const line2Raw = String(settings.line2ClassName || '').trim().toLowerCase();
  const hasLegacyAnimationTokens = line1Raw.includes('lineblur')
    || line2Raw.includes('lineb')
    || line1Raw.includes('loans-native-hero-line')
    || line2Raw.includes('loans-native-hero-line');
  const animationPreset = hasLegacyAnimationTokens && (!animationPresetToken || animationPresetToken === 'none')
    ? (contract?.animationPreset || 'loans-unblur')
    : (String(settings.animationPreset || '').trim() || contract?.animationPreset || 'loans-unblur');

  let next = {
    ...settings,
    animationPreset,
    bgTone: String(settings.bgTone || '').trim() || contract?.bgTone || 'white',
    justify: String(settings.justify || '').trim() || contract?.justify || 'center',
    actionJustify: String(settings.actionJustify || '').trim() || contract?.actionJustify || 'center',
    heightMode: String(settings.heightMode || '').trim() || 'default',
    lineHeight: Number.isFinite(Number(settings.lineHeight)) ? Number(settings.lineHeight) : contract?.lineHeight || 0.9,
    lineGap: 0,
  };

  next = withDefaultHeroLine(next, {
    line: 1,
    defaultText: contract?.lines?.[0]?.text || 'Your vision.',
    defaultClassName: contract?.lines?.[0]?.className || 'loans-native-hero-line is-vision',
    defaultHighlightsJson: contract?.lines?.[0]?.highlightsJson || '[{"text":"Your","className":"is-super-grey"},{"text":".","className":"is-super-grey"}]',
  });
  next = withDefaultHeroLine(next, {
    line: 2,
    defaultText: contract?.lines?.[1]?.text || 'Our purpose.',
    defaultClassName: contract?.lines?.[1]?.className || 'loans-native-hero-line is-purpose',
    defaultHighlightsJson: contract?.lines?.[1]?.highlightsJson || '[{"text":"Our","className":"is-super-grey"},{"text":".","className":"is-super-grey"}]',
  });
  next.line1ClassName = enforceHeroBaseClassName(
    next.line1ClassName,
    contract?.lines?.[0]?.className || 'loans-native-hero-line is-vision',
    { dropTokens: ['lineblur'], preserveCustomTokens: false },
  );
  next.line2ClassName = enforceHeroBaseClassName(
    next.line2ClassName,
    contract?.lines?.[1]?.className || 'loans-native-hero-line is-purpose',
    { dropTokens: ['lineb'], preserveCustomTokens: false },
  );

  return next;
}

function hasNonEmptyHeroHighlights(value, lineText = '') {
  const raw = String(value || '').trim();
  if (!raw) {
    return false;
  }
  const sourceText = String(lineText || '');
  const sourceLower = sourceText.toLowerCase();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return false;
    }
    return parsed.some((item) => {
      const className = normalizeHeroColorClassToken(item?.className);
      if (!className) {
        return false;
      }
      const hasRange = Number.isFinite(Number(item?.start))
        && Number.isFinite(Number(item?.end))
        && Number(item.end) > Number(item.start);
      if (hasRange) {
        if (!sourceText) {
          return true;
        }
        const safeStart = Math.max(0, Math.min(sourceText.length, Math.floor(Number(item.start))));
        const safeEnd = Math.max(0, Math.min(sourceText.length, Math.floor(Number(item.end))));
        return safeEnd > safeStart;
      }
      const text = String(item?.text || '').trim();
      if (!text) {
        return false;
      }
      if (!sourceLower) {
        return true;
      }
      return sourceLower.includes(text.toLowerCase());
    });
  } catch {
    return false;
  }
}

function canApplyDefaultHeroHighlights(textValue, defaultTextValue, defaultHighlightsJson) {
  const text = String(textValue || '').trim().toLowerCase();
  const defaultText = String(defaultTextValue || '').trim().toLowerCase();
  if (!text) {
    return false;
  }
  if (text === defaultText) {
    return true;
  }
  try {
    const parsed = JSON.parse(String(defaultHighlightsJson || '[]'));
    const tokens = Array.isArray(parsed)
      ? parsed
        .map((item) => String(item?.text || '').trim().toLowerCase())
        .filter(Boolean)
      : [];
    return tokens.length > 0 && tokens.every((token) => text.includes(token));
  } catch {
    return false;
  }
}

function shouldRestoreDefaultHeroHighlights(currentValue, textValue, defaultTextValue, defaultHighlightsJson) {
  const raw = String(currentValue || '').trim();
  const defaultRaw = String(defaultHighlightsJson || '').trim();
  if (!defaultRaw) {
    return false;
  }
  if (!canApplyDefaultHeroHighlights(textValue, defaultTextValue, defaultHighlightsJson)) {
    return false;
  }
  if (!raw || raw === '[]') {
    return true;
  }

  try {
    const currentParsed = JSON.parse(raw);
    const expectedParsed = JSON.parse(defaultRaw);
    if (!Array.isArray(currentParsed) || !Array.isArray(expectedParsed) || !expectedParsed.length) {
      return false;
    }

    const currentTokens = currentParsed.map((item) => ({
      text: String(item?.text || '').trim().toLowerCase(),
      className: normalizeHeroColorClassToken(item?.className),
    }));
    const expectedTokens = expectedParsed.map((item) => ({
      text: String(item?.text || '').trim().toLowerCase(),
      className: normalizeHeroColorClassToken(item?.className),
    })).filter((item) => item.text && item.className);

    if (!expectedTokens.length) {
      return false;
    }

    const currentTextSet = new Set(currentTokens.map((item) => item.text).filter(Boolean));
    const expectedTextSet = new Set(expectedTokens.map((item) => item.text));
    const hasUnexpectedTexts = Array.from(currentTextSet).some((token) => !expectedTextSet.has(token));
    if (hasUnexpectedTexts) {
      return false;
    }

    return expectedTokens.some((expectedToken) => {
      const currentToken = currentTokens.find((item) => item.text === expectedToken.text);
      return !currentToken || !currentToken.className;
    });
  } catch {
    return false;
  }
}

function toHeroDefaultHighlightsJson(highlights) {
  const source = Array.isArray(highlights) ? highlights : [];
  const normalized = source
    .map((item) => {
      const className = String(item?.className || '').trim();
      const text = String(item?.text || '').trim();
      const hasRange = Number.isFinite(Number(item?.start)) && Number.isFinite(Number(item?.end));
      const start = hasRange ? Math.max(0, Math.floor(Number(item.start))) : null;
      const end = hasRange ? Math.max(0, Math.floor(Number(item.end))) : null;

      if (className && Number.isInteger(start) && Number.isInteger(end) && end > start) {
        return {
          start,
          end,
          className,
        };
      }
      if (className && text) {
        return {
          text,
          className,
        };
      }
      return null;
    })
    .filter(Boolean);
  if (!normalized.length) {
    return '';
  }
  return JSON.stringify(normalized);
}

function getStaticHeroDefaultsForPath(pathname) {
  try {
    const content = getNativePageContent(pathname);
    const hero = content?.hero && typeof content.hero === 'object' ? content.hero : null;
    if (!hero) {
      return null;
    }
    const lines = Array.isArray(hero.lines)
      ? hero.lines
        .slice(0, 3)
        .map((line) => ({
          text: String(line?.title || '').trim(),
          className: String(line?.className || '').trim(),
          highlightsJson: toHeroDefaultHighlightsJson(line?.highlights),
        }))
      : [];
    if (!lines.some((line) => line.text || line.className || line.highlightsJson)) {
      return null;
    }
    return {
      animationPreset: String(hero.animationPreset || '').trim(),
      bgTone: String(hero.bgTone || '').trim(),
      justify: String(hero.justify || '').trim(),
      actionJustify: String(hero.actionJustify || '').trim(),
      titleSizeRem: Number.isFinite(Number(hero.titleSizeRem)) ? Number(hero.titleSizeRem) : undefined,
      titleLetterSpacingEm: Number.isFinite(Number(hero.titleLetterSpacingEm))
        ? Number(hero.titleLetterSpacingEm)
        : undefined,
      lineGap: 0,
      lineHeight: Number.isFinite(Number(hero.lineHeight)) ? Number(hero.lineHeight) : undefined,
      heightMode: String(hero.heightMode || '').trim(),
      heightSvh: Number.isFinite(Number(hero.heightSvh)) ? Number(hero.heightSvh) : undefined,
      actions: (Array.isArray(hero.actions) ? hero.actions : [])
        .slice(0, 2)
        .map((action) => ({
          label: String(action?.label || '').trim(),
          action: String(action?.action || '').trim(),
          targetAnchorId: String(action?.targetAnchorId || '').trim(),
          targetBlockId: String(action?.targetBlockId || '').trim(),
          pageRef: String(action?.to || '').trim(),
          url: String(action?.href || '').trim(),
          style: String(action?.style || (action?.ghost ? 'outline' : '') || '').trim(),
          tone: String(action?.tone || '').trim(),
          openInNewWindow: Boolean(action?.openInNewWindow),
        }))
        .filter((action) => action.label && (
          action.pageRef
          || action.url
          || (action.action && (action.targetAnchorId || action.targetBlockId))
        )),
      lines,
    };
  } catch {
    return null;
  }
}

function withDefaultHeroActions(settings, defaults) {
  const next = { ...settings };
  const defaultActions = Array.isArray(defaults?.actions) ? defaults.actions : [];

  defaultActions.forEach((action, index) => {
    const buttonNumber = index + 1;
    const labelKey = `button${buttonNumber}Label`;
    const actionKey = `button${buttonNumber}Action`;
    const targetAnchorIdKey = `button${buttonNumber}TargetAnchorId`;
    const targetBlockIdKey = `button${buttonNumber}TargetBlockId`;
    const pageRefKey = `button${buttonNumber}PageRef`;
    const urlKey = `button${buttonNumber}Url`;
    const styleKey = `button${buttonNumber}Style`;
    const toneKey = `button${buttonNumber}Tone`;
    const openKey = `button${buttonNumber}OpenInNewWindow`;

    if (!String(next[labelKey] || '').trim()) {
      next[labelKey] = action.label;
    }
    if (!String(next[pageRefKey] || '').trim() && !String(next[urlKey] || '').trim()) {
      if (action.pageRef) {
        next[pageRefKey] = action.pageRef;
      } else if (action.url) {
        next[urlKey] = action.url;
      }
    }
    if (!String(next[actionKey] || '').trim() && action.action) {
      next[actionKey] = action.action;
    }
    if (!String(next[targetAnchorIdKey] || '').trim() && action.targetAnchorId) {
      next[targetAnchorIdKey] = action.targetAnchorId;
    }
    if (!String(next[targetBlockIdKey] || '').trim() && action.targetBlockId) {
      next[targetBlockIdKey] = action.targetBlockId;
    }
    if (!String(next[styleKey] || '').trim() && action.style) {
      next[styleKey] = action.style;
    }
    if (!String(next[toneKey] || '').trim() && action.tone) {
      next[toneKey] = action.tone;
    }
    if (!Object.prototype.hasOwnProperty.call(next, openKey) || next[openKey] == null) {
      next[openKey] = Boolean(action.openInNewWindow);
    }
  });

  return next;
}

function normalizeGenerosityFundHeroSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  return { ...settings };
}

function normalizeGenerosityFundJoyfulGivingBillboardSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const next = { ...settings };
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

function withDefaultHeroLine(settings, config) {
  const next = { ...settings };
  const textKey = `line${config.line}Text`;
  const classKey = `line${config.line}ClassName`;
  const highlightsKey = `line${config.line}HighlightsJson`;

  const currentText = String(next[textKey] || '').trim();
  const currentClassName = String(next[classKey] || '').trim();
  const currentHighlights = next[highlightsKey];

  if (!currentText) {
    next[textKey] = config.defaultText;
  }
  if (!currentClassName && config.defaultClassName) {
    next[classKey] = config.defaultClassName;
  }
  if (shouldRestoreDefaultHeroHighlights(currentHighlights, next[textKey], config.defaultText, config.defaultHighlightsJson)) {
    next[highlightsKey] = config.defaultHighlightsJson;
  } else if (
    !hasNonEmptyHeroHighlights(currentHighlights, next[textKey])
    && !String(config.defaultHighlightsJson || '').trim()
  ) {
    next[highlightsKey] = '';
  }

  return next;
}

function normalizeHeroSettingsByPath(pathname, rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const hasLegacyNoneAnimationPreset = String(settings.animationPreset || '').trim() === 'none';
  const hasLegacyInvestmentsSingleLineHero = (
    pathname === '/services/investments'
    && String(settings.line1Text || '').trim() === 'Your investments. Your faith. Better together.'
    && !String(settings.line2Text || '').trim()
    && !String(settings.line3Text || '').trim()
  );

  if (pathname === '/') {
    const contract = getHeroSeedContract(pathname);
    let next = { ...settings };
    if (!String(next.animationPreset || '').trim() || hasLegacyNoneAnimationPreset) {
      next.animationPreset = contract?.animationPreset || 'default';
    }
    if (!String(next.bgTone || '').trim()) {
      next.bgTone = contract?.bgTone || 'white';
    }
    next.justify = contract?.justify || 'left';
    if (!Number.isFinite(Number(next.titleSizeRem)) && Number.isFinite(Number(contract?.titleSizeRem))) {
      next.titleSizeRem = Number(contract.titleSizeRem);
    }
    if (!Number.isFinite(Number(next.lineHeight))) {
      next.lineHeight = contract?.lineHeight || 0.9;
    }
    next.lineGap = 0;
    if (!String(next.line3ClassName || '').trim()) {
      next.line3ClassName = contract?.lines?.[2]?.className || 'home-native-title line3';
    }
    next = withDefaultHeroLine(next, {
      line: 1,
      defaultText: contract?.lines?.[0]?.text || "Today's investment.",
      defaultClassName: contract?.lines?.[0]?.className || 'home-native-eyebrow',
      defaultHighlightsJson: contract?.lines?.[0]?.highlightsJson ?? '[{"text":"investment","className":"is-atlantean"}]',
    });
    next = withDefaultHeroLine(next, {
      line: 2,
      defaultText: contract?.lines?.[1]?.text || "Tomorrow's church.",
      defaultClassName: contract?.lines?.[1]?.className || 'home-native-title line1 line2',
      defaultHighlightsJson: contract?.lines?.[1]?.highlightsJson ?? '[{"text":"church","className":"is-mango"}]',
    });
    next = withDefaultHeroLine(next, {
      line: 3,
      defaultText: contract?.lines?.[2]?.text || '',
      defaultClassName: contract?.lines?.[2]?.className || 'home-native-title line3',
      defaultHighlightsJson: contract?.lines?.[2]?.highlightsJson ?? '',
    });
    next.line1ClassName = enforceHeroBaseClassName(next.line1ClassName, contract?.lines?.[0]?.className || 'home-native-eyebrow', { preserveCustomTokens: false });
    next.line2ClassName = enforceHeroBaseClassName(next.line2ClassName, contract?.lines?.[1]?.className || 'home-native-title line1 line2', { preserveCustomTokens: false });
    next.line3ClassName = enforceHeroBaseClassName(next.line3ClassName, contract?.lines?.[2]?.className || 'home-native-title line3', { preserveCustomTokens: false });
    if (!String(next.actionJustify || '').trim()) {
      next.actionJustify = contract?.actionJustify || 'left';
    }
    next = withDefaultHeroActions(next, contract);
    return next;
  }

  if (pathname === '/services/investments') {
    const contract = getHeroSeedContract(pathname);
    let next = { ...settings };
    if (!String(next.animationPreset || '').trim() || hasLegacyNoneAnimationPreset) {
      next.animationPreset = contract?.animationPreset || 'default';
    }
    if (!String(next.bgTone || '').trim()) {
      next.bgTone = contract?.bgTone || 'white';
    }
    next.justify = contract?.justify || 'left';
    if (!Number.isFinite(Number(next.lineHeight))) {
      next.lineHeight = contract?.lineHeight || 0.9;
    }
    next.lineGap = 0;
    if (hasLegacyInvestmentsSingleLineHero) {
      next.line1Text = contract?.lines?.[0]?.text || 'Your investments.';
      next.line1ClassName = contract?.lines?.[0]?.className || 'line1';
      next.line1HighlightsJson = contract?.lines?.[0]?.highlightsJson || '[{"text":"investments","className":"is-atlantean"}]';
      next.line2Text = contract?.lines?.[1]?.text || 'Your faith.';
      next.line2ClassName = contract?.lines?.[1]?.className || 'line2';
      next.line2HighlightsJson = contract?.lines?.[1]?.highlightsJson || '[{"text":"faith","className":"is-mango"}]';
      next.line3Text = contract?.lines?.[2]?.text || 'Better together.';
      next.line3ClassName = contract?.lines?.[2]?.className || 'line3';
      next.line3HighlightsJson = contract?.lines?.[2]?.highlightsJson || '[{"text":"together","className":"is-sandstone"}]';
    }
    next = withDefaultHeroLine(next, {
      line: 1,
      defaultText: contract?.lines?.[0]?.text || 'Your investments.',
      defaultClassName: contract?.lines?.[0]?.className || 'line1',
      defaultHighlightsJson: contract?.lines?.[0]?.highlightsJson || '[{"text":"investments","className":"is-atlantean"}]',
    });
    next = withDefaultHeroLine(next, {
      line: 2,
      defaultText: contract?.lines?.[1]?.text || 'Your faith.',
      defaultClassName: contract?.lines?.[1]?.className || 'line2',
      defaultHighlightsJson: contract?.lines?.[1]?.highlightsJson || '[{"text":"faith","className":"is-mango"}]',
    });
    next = withDefaultHeroLine(next, {
      line: 3,
      defaultText: contract?.lines?.[2]?.text || 'Better together.',
      defaultClassName: contract?.lines?.[2]?.className || 'line3',
      defaultHighlightsJson: contract?.lines?.[2]?.highlightsJson || '[{"text":"together","className":"is-sandstone"}]',
    });
    next.line1ClassName = enforceHeroBaseClassName(next.line1ClassName, contract?.lines?.[0]?.className || 'line1', { preserveCustomTokens: false });
    next.line2ClassName = enforceHeroBaseClassName(next.line2ClassName, contract?.lines?.[1]?.className || 'line2', { preserveCustomTokens: false });
    next.line3ClassName = enforceHeroBaseClassName(next.line3ClassName, contract?.lines?.[2]?.className || 'line3', { preserveCustomTokens: false });
    if (!String(next.actionJustify || '').trim()) {
      next.actionJustify = contract?.actionJustify || 'left';
    }
    return next;
  }

  if (pathname === '/services/retirement') {
    const contract = getHeroSeedContract(pathname);
    let next = { ...settings };
    if (!String(next.animationPreset || '').trim() || hasLegacyNoneAnimationPreset) {
      next.animationPreset = contract?.animationPreset || 'default';
    }
    if (!String(next.bgTone || '').trim()) {
      next.bgTone = contract?.bgTone || 'white';
    }
    next.justify = contract?.justify || 'center';
    if (!Number.isFinite(Number(next.lineHeight))) {
      next.lineHeight = contract?.lineHeight || 0.9;
    }
    next.lineGap = 0;
    next = withDefaultHeroLine(next, {
      line: 1,
      defaultText: contract?.lines?.[0]?.text || 'Your future.',
      defaultClassName: contract?.lines?.[0]?.className || 'retirement-native-hero-line line1',
      defaultHighlightsJson: contract?.lines?.[0]?.highlightsJson || '[{"text":"future","className":"is-atlantean"}]',
    });
    next = withDefaultHeroLine(next, {
      line: 2,
      defaultText: contract?.lines?.[1]?.text || 'Your plan.',
      defaultClassName: contract?.lines?.[1]?.className || 'retirement-native-hero-line line2',
      defaultHighlightsJson: contract?.lines?.[1]?.highlightsJson || '[{"text":"plan","className":"is-mango"}]',
    });
    next.line1ClassName = enforceHeroBaseClassName(next.line1ClassName, contract?.lines?.[0]?.className || 'retirement-native-hero-line line1', { preserveCustomTokens: false });
    next.line2ClassName = enforceHeroBaseClassName(next.line2ClassName, contract?.lines?.[1]?.className || 'retirement-native-hero-line line2', { preserveCustomTokens: false });
    if (!String(next.actionJustify || '').trim()) {
      next.actionJustify = contract?.actionJustify || 'center';
    }
    return next;
  }

  if (pathname === '/services/loans') {
    return settings;
  }

  const staticHeroDefaults = getStaticHeroDefaultsForPath(pathname);
  if (!staticHeroDefaults) {
    return settings;
  }

  // Default dynamic hero values come from each route's static hero until DB-backed content is live.
  let next = { ...settings };
  if (!String(next.animationPreset || '').trim() && staticHeroDefaults.animationPreset) {
    next.animationPreset = staticHeroDefaults.animationPreset;
  }
  if (!String(next.bgTone || '').trim() && staticHeroDefaults.bgTone) {
    next.bgTone = staticHeroDefaults.bgTone;
  }
  if (!String(next.justify || '').trim() && staticHeroDefaults.justify) {
    next.justify = staticHeroDefaults.justify;
  }
  if (!String(next.actionJustify || '').trim()) {
    next.actionJustify = staticHeroDefaults.actionJustify || staticHeroDefaults.justify || 'left';
  }
  if (!String(next.heightMode || '').trim() && staticHeroDefaults.heightMode) {
    next.heightMode = staticHeroDefaults.heightMode;
  }
  if (!Number.isFinite(Number(next.heightSvh)) && Number.isFinite(Number(staticHeroDefaults.heightSvh))) {
    next.heightSvh = Number(staticHeroDefaults.heightSvh);
  }
  if (!Number.isFinite(Number(next.lineHeight))) {
    next.lineHeight = Number.isFinite(Number(staticHeroDefaults.lineHeight))
      ? Number(staticHeroDefaults.lineHeight)
      : 0.9;
  }
  next.lineGap = 0;

  staticHeroDefaults.lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (!line.text && !line.className && !line.highlightsJson) {
      return;
    }
    next = withDefaultHeroLine(next, {
      line: lineNumber,
      defaultText: line.text,
      defaultClassName: line.className,
      defaultHighlightsJson: line.highlightsJson,
    });
    if (line.className) {
      next[`line${lineNumber}ClassName`] = enforceHeroBaseClassName(
        next[`line${lineNumber}ClassName`],
        line.className,
        { preserveCustomTokens: false },
      );
    }
  });

  next = withDefaultHeroActions(next, staticHeroDefaults);

  if (pathname === '/services/planned-giving/generosity-fund') {
    next = normalizeGenerosityFundHeroSettings(next);
  }

  return next;
}

export function normalizeDynamicHeroSettings(pathname, rawSettings) {
  const normalized = pathname === '/services/loans'
    ? normalizeLoansHeroSettings(rawSettings)
    : normalizeHeroSettingsByPath(pathname, rawSettings);
  return {
    ...normalized,
    titleSizeRem: normalizeHeroTitleSizeRem(normalized?.titleSizeRem, DEFAULT_HERO_TITLE_SIZE_REM),
    titleLetterSpacingEm: normalizeHeroTitleLetterSpacingEm(
      normalized?.titleLetterSpacingEm,
      DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
    ),
  };
}

function isBlankHeroString(value) {
  return !String(value || '').trim();
}

function recordHeroRepair(repairs, field, label, reason = 'restored') {
  repairs.push({ field, label, reason });
}

function recordHeroStringRepair(repairs, normalizedSettings, rawSettings, field, label) {
  if (!isBlankHeroString(rawSettings?.[field])) {
    return;
  }
  if (isBlankHeroString(normalizedSettings?.[field])) {
    return;
  }
  recordHeroRepair(repairs, field, label, 'restored');
}

function recordHeroNumberRepair(repairs, normalizedSettings, rawSettings, field, label) {
  if (Number.isFinite(Number(rawSettings?.[field]))) {
    return;
  }
  if (!Number.isFinite(Number(normalizedSettings?.[field]))) {
    return;
  }
  recordHeroRepair(repairs, field, label, 'restored');
}

function recordHeroClassRepair(repairs, normalizedSettings, rawSettings, field, label) {
  const rawValue = String(rawSettings?.[field] || '').trim();
  const normalizedValue = String(normalizedSettings?.[field] || '').trim();
  if (!normalizedValue || rawValue === normalizedValue) {
    return;
  }
  recordHeroRepair(repairs, field, label, 'standardized');
}

function recordHeroHighlightsRepair(repairs, normalizedSettings, rawSettings, field, textField, label) {
  const rawValue = String(rawSettings?.[field] || '').trim();
  const normalizedValue = String(normalizedSettings?.[field] || '').trim();
  if (rawValue === normalizedValue) {
    return;
  }
  recordHeroRepair(repairs, field, label, normalizedValue ? 'restored' : 'cleaned');
}

export function inspectDynamicHeroSettings(pathname, rawSettings) {
  const sourceSettings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const normalizedSettings = normalizeDynamicHeroSettings(pathname, sourceSettings);
  const repairedFields = [];

  recordHeroStringRepair(repairedFields, normalizedSettings, sourceSettings, 'animationPreset', 'Animation preset');
  recordHeroStringRepair(repairedFields, normalizedSettings, sourceSettings, 'bgTone', 'Background tone');
  recordHeroStringRepair(repairedFields, normalizedSettings, sourceSettings, 'actionJustify', 'Button alignment');
  recordHeroNumberRepair(repairedFields, normalizedSettings, sourceSettings, 'titleSizeRem', 'Headline size');
  recordHeroNumberRepair(repairedFields, normalizedSettings, sourceSettings, 'titleLetterSpacingEm', 'Headline tracking');
  recordHeroNumberRepair(repairedFields, normalizedSettings, sourceSettings, 'lineHeight', 'Line height');
  recordHeroStringRepair(repairedFields, normalizedSettings, sourceSettings, 'heightMode', 'Height mode');
  recordHeroNumberRepair(repairedFields, normalizedSettings, sourceSettings, 'heightSvh', 'Custom height');

  [1, 2, 3].forEach((lineNumber) => {
    const lineKey = `line${lineNumber}`;
    recordHeroStringRepair(
      repairedFields,
      normalizedSettings,
      sourceSettings,
      `${lineKey}Text`,
      `Line ${lineNumber} text`,
    );
    recordHeroClassRepair(
      repairedFields,
      normalizedSettings,
      sourceSettings,
      `${lineKey}ClassName`,
      `Line ${lineNumber} classes`,
    );
    recordHeroHighlightsRepair(
      repairedFields,
      normalizedSettings,
      sourceSettings,
      `${lineKey}HighlightsJson`,
      `${lineKey}Text`,
      `Line ${lineNumber} highlights`,
    );
  });

  [1, 2].forEach((buttonNumber) => {
    recordHeroStringRepair(
      repairedFields,
      normalizedSettings,
      sourceSettings,
      `button${buttonNumber}Label`,
      `Button ${buttonNumber} label`,
    );
    recordHeroStringRepair(
      repairedFields,
      normalizedSettings,
      sourceSettings,
      `button${buttonNumber}PageRef`,
      `Button ${buttonNumber} page`,
    );
    recordHeroStringRepair(
      repairedFields,
      normalizedSettings,
      sourceSettings,
      `button${buttonNumber}Url`,
      `Button ${buttonNumber} URL`,
    );
    recordHeroStringRepair(
      repairedFields,
      normalizedSettings,
      sourceSettings,
      `button${buttonNumber}Style`,
      `Button ${buttonNumber} style`,
    );
    recordHeroStringRepair(
      repairedFields,
      normalizedSettings,
      sourceSettings,
      `button${buttonNumber}Tone`,
      `Button ${buttonNumber} tone`,
    );
  });

  return {
    pathname,
    normalizedSettings,
    repairedFields,
    hasDrift: repairedFields.length > 0,
    signature: repairedFields.map((entry) => `${entry.field}:${entry.reason}`).join('|'),
  };
}

function normalizeTopStripSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const next = { ...settings };
  const ratesLabel = String(next.ratesLabel || '').trim().toLowerCase();
  const ratesStyle = String(next.ratesButtonStyle || '').trim().toLowerCase();
  const ratesPath = String(next.ratesPath || '').trim().toLowerCase();
  const ratesTone = String(next.ratesButtonTone || '').trim().toLowerCase();

  if (!ratesTone) {
    next.ratesButtonTone = 'mango';
    return next;
  }

  const looksLikeLegacyDefault = (
    ratesTone === 'atlantean'
    && (ratesStyle === '' || ratesStyle === 'link')
    && (ratesPath === '' || ratesPath === '/rates')
    && (ratesLabel === '' || ratesLabel === 'ask about our rates!' || ratesLabel === 'ask about rates!')
  );
  if (looksLikeLegacyDefault) {
    next.ratesButtonTone = 'mango';
  }
  return next;
}

function toSlugToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function escapeHtmlText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paragraphizeText(value) {
  const text = String(value || '').trim();
  return text ? `<p>${escapeHtmlText(text)}</p>` : '';
}

function decodeIntroHtmlTextEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&#8212;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&#8211;/gi, '–')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, '\'')
    .replace(/&apos;/gi, '\'')
    .replace(/&rsquo;/gi, '’')
    .replace(/&#8217;/gi, '’')
    .replace(/&lsquo;/gi, '‘')
    .replace(/&#8216;/gi, '‘')
    .replace(/&ldquo;/gi, '“')
    .replace(/&#8220;/gi, '“')
    .replace(/&rdquo;/gi, '”')
    .replace(/&#8221;/gi, '”')
    .replace(/&reg;/gi, '®')
    .replace(/&#174;/gi, '®');
}

function stripIntroHtmlToText(value) {
  const source = String(value || '').trim();
  if (!source) {
    return '';
  }

  return decodeIntroHtmlTextEntities(
    source
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|section|article|h[1-6]|ul|ol)>/gi, '\n\n')
      .replace(/<li\b[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, ''),
  )
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

function normalizeIntroBodyMirror(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const nextSettings = { ...settings };
  const body = String(nextSettings.body || '').trim();
  const bodyHtml = String(nextSettings.bodyHtml || '').trim();
  if (!body && bodyHtml) {
    nextSettings.body = stripIntroHtmlToText(bodyHtml);
  }
  return nextSettings;
}

function isPlaceholderIntroSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return true;
  }
  const heading = String(settings.heading || '').trim();
  const bodyHtml = String(settings.bodyHtml || '').trim();
  const body = String(settings.body || '').trim();
  if (!heading && !body && !bodyHtml) {
    return true;
  }
  if (heading.includes('Test the panel system')) {
    return true;
  }
  if (bodyHtml.includes('native React with saved-page copy restoration')) {
    return true;
  }
  return false;
}

function clearIntroActionSettings(settings) {
  const nextSettings = settings && typeof settings === 'object' ? { ...settings } : {};
  nextSettings.button1Label = '';
  nextSettings.button1Url = '';
  nextSettings.button1PageRef = '';
  nextSettings.button1OpenInNewWindow = false;
  nextSettings.button2Label = '';
  nextSettings.button2Url = '';
  nextSettings.button2PageRef = '';
  nextSettings.button2OpenInNewWindow = false;
  return nextSettings;
}

function shouldRefreshStoredIntroFromNative(pathname, settings) {
  const path = String(pathname || '').trim();
  if (
    path !== RETIREMENT_403B_PATH
    && path !== RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_PATH
    && path !== RETIREMENT_403B_GROUP_ENROLLMENT_PATH
    && path !== '/services/insurance/property-casualty-insurance'
  ) {
    return false;
  }
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  const heading = String(settings.heading || '').trim();
  const body = String(settings.body || '').trim();
  const bodyHtml = String(settings.bodyHtml || '').trim();
  const button1Label = String(settings.button1Label || '').trim();
  const bgTone = String(settings.bgTone || '').trim();
  const textTone = String(settings.textTone || '').trim();

  if (path === '/services/insurance/property-casualty-insurance') {
    const matchesCanonicalPropertyCasualtyIntro = (
      body.includes('You focus on people. We\'ll handle the protection-powered confidence')
      || bodyHtml.includes('You focus on people. We\'ll handle the protection-powered confidence')
    );
    return matchesCanonicalPropertyCasualtyIntro
      && (
        bgTone !== 'grey'
        || textTone !== 'white'
        || button1Label === 'Jump to the AG program'
      );
  }

  if (path === RETIREMENT_403B_PATH) {
    const looksLikeLegacy403bIntro = heading === 'Ministry-powered retirement.'
      && (
        body.includes('The AGFinancial 403(b) offers higher contribution limits')
        || bodyHtml.includes('The AGFinancial 403(b) offers higher contribution limits')
      );
    if (!looksLikeLegacy403bIntro) {
      return false;
    }
    return bgTone !== 'sand' || textTone !== 'dark';
  }

  if (heading === 'The right loan can change everything.') {
    return true;
  }

  if (path === RETIREMENT_403B_GROUP_ENROLLMENT_PATH) {
    if (
      button1Label === ''
      && (
        body.includes('What’s one gotta do to get AGFinancial 403(b)?')
        || bodyHtml.includes('What’s one gotta do to get AGFinancial 403(b)?')
        || body.includes('You’re in luck. We guide you through the process')
        || bodyHtml.includes('You’re in luck. We guide you through the process')
      )
    ) {
      return true;
    }
    return false;
  }

  if (heading === 'What’s one gotta do to get AGFinancial 403(b)?') {
    return true;
  }

  if (
    button1Label === ''
    && (
      body.includes('What’s one gotta do to get AGFinancial 403(b)?')
      || bodyHtml.includes('What’s one gotta do to get AGFinancial 403(b)?')
    )
  ) {
    return true;
  }

  if (!heading && !body && !bodyHtml && button1Label === 'Download Plan Summary') {
    return true;
  }

  if (heading === 'Start with the 403(b) plan summary.' && button1Label === 'Download Plan Summary') {
    return true;
  }

  return false;
}

function toBodyHtmlFromSection(section, form) {
  const html = String(section?.html || '').trim();
  if (html) {
    return html;
  }
  const parts = [];
  const bodyList = Array.isArray(section?.body) ? section.body : (section?.body ? [section.body] : []);
  bodyList.forEach((line) => {
    const next = paragraphizeText(line);
    if (next) {
      parts.push(next);
    }
  });

  const subtitle = paragraphizeText(form?.subtitle || section?.subtitle || '');
  if (subtitle && !parts.length) {
    parts.push(subtitle);
  }

  return parts.join('');
}

function toCtaFieldOptionsText(options) {
  return formatFormChoiceOptionsText(options);
}

function isBasicContactField(field) {
  const idLabel = `${field?.id || ''} ${field?.label || ''}`.toLowerCase();
  return (
    idLabel.includes('first name')
    || idLabel.includes('last name')
    || idLabel === 'name'
    || idLabel.includes(' email')
    || idLabel.includes('phone')
    || idLabel.includes('contact first')
    || idLabel.includes('contact last')
    || idLabel.includes('contact email')
    || idLabel.includes('contact phone')
  );
}

function collectNativeFormFields(form) {
  if (!form || typeof form !== 'object') {
    return [];
  }
  if (Array.isArray(form.steps) && form.steps.length) {
    return form.steps
      .flatMap((step) => (Array.isArray(step?.fields) ? step.fields : []))
      .filter(Boolean);
  }
  return (Array.isArray(form.fields) ? form.fields : []).filter(Boolean);
}

function pickCtaFields(form) {
  const candidates = collectNativeFormFields(form)
    .filter((field) => field?.id && field?.label)
    .filter((field) => String(field.type || '').trim().toLowerCase() !== 'file')
    .map((field) => ({
      id: String(field.id || '').trim(),
      label: String(field.label || '').trim(),
      type: normalizeCtaFormFieldType(field.type),
      placeholder: String(field.placeholder || '').trim(),
      required: Boolean(field.required),
      optionsText: toCtaFieldOptionsText(field.options),
    }));

  if (!candidates.length) {
    return [];
  }

  const selected = candidates.slice(0, CTA_FORM_MAX_FIELDS);

  const requiredSpecial = candidates.find((field) => field.required && !isBasicContactField(field));
  if (requiredSpecial && !selected.some((field) => field.id === requiredSpecial.id)) {
    const replaceIndex = selected.findIndex((field) => !field.required && isBasicContactField(field));
    const targetIndex = replaceIndex >= 0 ? replaceIndex : Math.max(0, selected.length - 1);
    selected[targetIndex] = requiredSpecial;
  }

  const deduped = [];
  const seenIds = new Set();
  selected.forEach((field) => {
    if (!field?.id || seenIds.has(field.id)) {
      return;
    }
    seenIds.add(field.id);
    deduped.push(field);
  });

  return deduped.slice(0, CTA_FORM_MAX_FIELDS);
}

function isRequestDynamicPath(pathname) {
  return REQUEST_FORM_DYNAMIC_PATHS.has(String(pathname || '').trim());
}

function inferCanonicalFormOwner(defaultBlocks) {
  const blocks = Array.isArray(defaultBlocks) ? defaultBlocks : [];
  const hasCtaForm = blocks.some((block) => String(block?.kind || '').trim().toLowerCase() === 'cta_form');
  const hasRequestForm = blocks.some((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

  if (hasCtaForm && !hasRequestForm) {
    return 'cta_form';
  }
  if (hasRequestForm && !hasCtaForm) {
    return 'request_form';
  }
  return '';
}

function toRequestFieldConfig(field) {
  const id = String(field?.id || '').trim();
  const label = String(field?.label || '').trim();
  const type = normalizeRequestFormFieldType(field?.type);
  if (!id || !label || !type) {
    return null;
  }
  const config = {
    id,
    label,
    type,
    required: Boolean(field?.required),
    placeholder: String(field?.placeholder || '').trim(),
    full: Boolean(field?.full),
    help: String(field?.help || '').trim(),
    format: String(field?.format || '').trim(),
    errorMessage: String(field?.errorMessage || '').trim(),
  };
  const maxLength = Number(field?.maxLength);
  if (Number.isFinite(maxLength) && maxLength > 0) {
    config.maxLength = maxLength;
  }
  if (type === 'textarea') {
    const rows = Number(field?.rows);
    if (Number.isFinite(rows) && rows > 0) {
      config.rows = rows;
    }
  }
  if (Array.isArray(field?.options) && field.options.length) {
    config.options = field.options
      .map((option) => ({
        value: String(option?.value || '').trim(),
        label: String(option?.label || '').trim(),
      }))
      .filter((option) => option.value || option.label);
  }
  return config;
}

function toRequestStepConfigs(form) {
  if (!form || typeof form !== 'object') {
    return [];
  }

  if (Array.isArray(form.steps) && form.steps.length) {
    return form.steps
      .map((step, index) => ({
        title: String(step?.title || `Step ${index + 1}`).trim(),
        note: String(step?.note || '').trim(),
        alert: String(step?.alert || '').trim(),
        nextLabel: String(step?.nextLabel || '').trim(),
        backLabel: String(step?.backLabel || '').trim(),
        fields: (Array.isArray(step?.fields) ? step.fields : [])
          .map(toRequestFieldConfig)
          .filter(Boolean),
      }))
      .filter((step) => step.fields.length)
      .slice(0, 5);
  }

  const singleFields = (Array.isArray(form.fields) ? form.fields : [])
    .map(toRequestFieldConfig)
    .filter(Boolean);
  if (!singleFields.length) {
    return [];
  }

  return [{
    title: String(form.title || '').trim(),
    note: String(form.subtitle || '').trim(),
    alert: '',
    nextLabel: String(form.nextLabel || '').trim(),
    backLabel: String(form.backLabel || '').trim(),
    fields: singleFields,
  }];
}

function inferRequestTextTone(section, bgTone) {
  if (bgTone === 'blue' || bgTone === 'grey') {
    return 'white';
  }
  const hasWhiteHighlight = Array.isArray(section?.titleHighlights)
    && section.titleHighlights.some((entry) => String(entry?.className || '').trim().toLowerCase() === 'is-white');
  if (hasWhiteHighlight) {
    return 'white';
  }
  return 'dark';
}

function inferCtaBgTone(section) {
  const classToken = String(section?.className || '').toLowerCase();
  if (classToken.includes('loans-consultant-native-contact')) {
    return 'blue';
  }
  if (classToken.includes('legacy-giving-joy')) {
    return 'white';
  }
  if (classToken.includes('calculators-native-contact')) {
    return 'white';
  }
  if (classToken.includes('grey') || classToken.includes('gray') || classToken.includes('dark')) {
    return 'grey';
  }
  if (classToken.includes('blue')) {
    return 'blue';
  }
  if (classToken.includes('sand')) {
    return 'sand';
  }
  if (classToken.includes('white')) {
    return 'white';
  }
  const hasWhiteHighlight = Array.isArray(section?.titleHighlights)
    && section.titleHighlights.some((entry) => String(entry?.className || '').trim().toLowerCase() === 'is-white');
  if (hasWhiteHighlight) {
    return 'blue';
  }
  return 'sand';
}

function findStaticRequestFormSection(pathname, rawSettings) {
  const nativeContent = getNativePageContent(pathname);
  const sections = Array.isArray(nativeContent?.sections) ? nativeContent.sections : [];
  if (!sections.length) {
    return null;
  }

  const targetKey = String(rawSettings?.targetSectionKey || '').trim();
  const targetClassName = String(rawSettings?.targetSectionClassName || '').trim().toLowerCase();

  if (targetKey) {
    const exact = sections.find((section, index) => toSectionTargetKey(section, index) === targetKey);
    if (exact?.form && !isInlineRevealRequestInferenceSection(exact)) {
      return exact;
    }
  }

  if (targetClassName) {
    const exact = sections.find((section) => String(section?.className || '').trim().toLowerCase() === targetClassName);
    if (exact?.form && !isInlineRevealRequestInferenceSection(exact)) {
      return exact;
    }
  }

  return sections.find((section) => (
    section?.form
    && typeof section.form === 'object'
    && !isInlineRevealRequestInferenceSection(section)
  )) || null;
}

function isInlineRevealRequestInferenceSection(section) {
  const form = section?.form && typeof section.form === 'object' ? section.form : null;
  if (!form) {
    return false;
  }

  const displayMode = String(form.displayMode || '').trim().toLowerCase();
  const triggerMode = String(form.triggerMode || '').trim().toLowerCase();
  return displayMode === 'inline_reveal' || triggerMode === 'external';
}

function getDynamicRequestTemplateSettings() {
  const template = genericPageBlockBlueprint().find((block) => (
    String(block?.kind || '').trim().toLowerCase() === 'request_form'
    && String(block?.mode || '').trim().toLowerCase() === 'dynamic'
  ));
  return template?.settings && typeof template.settings === 'object' ? template.settings : {};
}

function shouldRestoreRequestSetting(currentValue, templateValue, expectedValue) {
  const current = String(currentValue || '').trim();
  const template = String(templateValue || '').trim();
  const expected = String(expectedValue || '').trim();

  if (!expected) {
    return false;
  }
  if (!current) {
    return true;
  }
  return current === template && current !== expected;
}

function shouldRestoreRequestHighlights(currentValue, templateValue, expectedValue) {
  const current = String(currentValue || '').trim();
  const template = String(templateValue || '').trim();
  const expected = String(expectedValue || '').trim();

  if (!expected) {
    return false;
  }
  if (!current || current === '[]') {
    return true;
  }
  return current === template && current !== expected;
}

function shouldRestoreRequestFields(currentValue, templateValue, expectedValue) {
  const current = String(currentValue || '').trim();
  const template = String(templateValue || '').trim();
  const expected = String(expectedValue || '').trim();

  if (!expected || expected === '[]') {
    return false;
  }
  if (!current || current === '[]') {
    return true;
  }
  if (current === template && current !== expected) {
    return true;
  }

  try {
    const currentFields = JSON.parse(current);
    const expectedFields = JSON.parse(expected);
    if (!Array.isArray(currentFields) || !Array.isArray(expectedFields)) {
      return false;
    }
    const currentIds = new Set(currentFields.map((field) => String(field?.id || '').trim()).filter(Boolean));
    const expectedIds = expectedFields.map((field) => String(field?.id || '').trim()).filter(Boolean);
    return expectedIds.some((fieldId) => !currentIds.has(fieldId));
  } catch {
    return false;
  }
}

function shouldRestoreRequestStepTitle(currentValue, templateValue, expectedValue) {
  const current = String(currentValue || '').trim();
  const template = String(templateValue || '').trim();
  const expected = String(expectedValue || '').trim();

  if (!expected) {
    return false;
  }
  if (!current) {
    return true;
  }
  if (current === template && current !== expected) {
    return true;
  }

  const genericTitles = new Set(['contact', 'contact info', 'contact details']);
  return genericTitles.has(current.toLowerCase()) && current !== expected;
}

function requestFormSettingsTargetMatchesSection(settings, section, sectionIndex) {
  if (!section || typeof section !== 'object') {
    return false;
  }
  const targetKey = String(settings?.targetSectionKey || '').trim();
  const targetClassName = String(settings?.targetSectionClassName || '').trim().toLowerCase();
  const normalizedIndex = Number.isFinite(Number(settings?.targetSectionIndex))
    ? Number(settings.targetSectionIndex)
    : NaN;
  const expectedTargetKey = section?.id
    ? `id:${section.id}`
    : (section?.className ? `class:${section.className}` : (sectionIndex >= 0 ? `index:${sectionIndex}` : ''));
  const expectedTargetClassName = String(section?.className || '').trim().toLowerCase();

  return (
    (targetKey && targetKey === expectedTargetKey)
    || (targetClassName && targetClassName === expectedTargetClassName)
    || (Number.isFinite(normalizedIndex) && normalizedIndex === sectionIndex)
  );
}

export function normalizeDynamicRequestFormSettings(pathname, rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const section = findStaticRequestFormSection(pathname, settings);
  if (!section) {
    return settings;
  }

  const form = section?.form && typeof section.form === 'object' ? section.form : {};
  const bgTone = inferCtaBgTone(section);
  const bodyList = Array.isArray(section?.body) ? section.body : (section?.body ? [section.body] : []);
  const expectedBody = bodyList
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .join('\n\n');
  const templateDefaults = getDynamicRequestTemplateSettings();
  const sectionIndex = Array.isArray(getNativePageContent(pathname)?.sections)
    ? getNativePageContent(pathname).sections.findIndex((candidate) => candidate === section)
    : -1;
  const next = { ...settings };
  const expectedTitle = String(section?.title || form?.title || '').trim();
  const expectedTitleClassName = String(section?.titleClassName || '').trim();
  const expectedTitleHighlightsJson = toHeroDefaultHighlightsJson(section?.titleHighlights);
  const expectedSubtitle = String(section?.subtitle || bodyList[0] || form?.subtitle || '').trim();
  const expectedSubtitleOnly = String(section?.subtitle || form?.subtitle || '').trim();
  const expectedTextTone = inferRequestTextTone(section, bgTone);
  const expectedTargetSectionKey = section?.id
    ? `id:${section.id}`
    : (section?.className ? `class:${section.className}` : (sectionIndex >= 0 ? `index:${sectionIndex}` : ''));
  const expectedTargetSectionClassName = String(section?.className || '').trim();
  const hasValidTarget = requestFormSettingsTargetMatchesSection(settings, section, sectionIndex);
  const expectedSteps = toRequestStepConfigs(form);
  const suppressGenericSingleStepHeading = (
    pathname === LEGACY_GIVING_ENDOWMENTS_PATH
    && expectedSteps.length === 1
    && String(expectedSteps[0]?.title || '').trim().toLowerCase() === 'contact details'
  );

  if ((!hasValidTarget && expectedTitle) || shouldRestoreRequestSetting(next.title, templateDefaults.title, expectedTitle)) {
    next.title = expectedTitle;
  }
  if (
    (!hasValidTarget && String(next.titleClassName || '').trim() !== expectedTitleClassName)
    || shouldRestoreRequestSetting(next.titleClassName, templateDefaults.titleClassName, expectedTitleClassName)
  ) {
    next.titleClassName = expectedTitleClassName;
  }
  if (
    pathname === '/services/insurance/group-term-life-insurance'
    && expectedTitleClassName
    && String(next.titleClassName || '').trim() === 'is-white'
  ) {
    next.titleClassName = expectedTitleClassName;
  }
  if (
    (!hasValidTarget && String(next.titleHighlightsJson || '').trim() !== expectedTitleHighlightsJson)
    || shouldRestoreRequestHighlights(next.titleHighlightsJson, templateDefaults.titleHighlightsJson, expectedTitleHighlightsJson)
  ) {
    next.titleHighlightsJson = expectedTitleHighlightsJson;
  }
  if (
    pathname === '/services/insurance/group-term-life-insurance'
    && String(next.titleHighlightsJson || '').trim() === '[{"text":"group life","className":"is-white"}]'
  ) {
    next.titleHighlightsJson = expectedTitleHighlightsJson;
  }
  if (!expectedSubtitleOnly && String(next.subtitle || '').trim() === String(templateDefaults.subtitle || '').trim()) {
    next.subtitle = '';
  } else if (
    (!hasValidTarget && String(next.subtitle || '').trim() !== expectedSubtitleOnly)
    || shouldRestoreRequestSetting(next.subtitle, templateDefaults.subtitle, expectedSubtitleOnly)
  ) {
    next.subtitle = expectedSubtitleOnly;
  }
  if (
    (!hasValidTarget && String(next.body || '').trim() !== expectedBody)
    || shouldRestoreRequestSetting(next.body, templateDefaults.body, expectedBody)
  ) {
    next.body = expectedBody;
  }
  if (
    (!hasValidTarget && String(next.bgTone || '').trim() !== bgTone)
    || shouldRestoreRequestSetting(next.bgTone, templateDefaults.bgTone, bgTone)
  ) {
    next.bgTone = bgTone;
  }
  if (
    (!hasValidTarget && String(next.textTone || '').trim() !== expectedTextTone)
    || shouldRestoreRequestSetting(next.textTone, templateDefaults.textTone, expectedTextTone)
  ) {
    next.textTone = expectedTextTone;
  }
  const shouldCanonicalizeTargetKeyToSectionId = Boolean(section?.id)
    && String(next.targetSectionKey || '').trim() !== expectedTargetSectionKey;
  if (
    shouldCanonicalizeTargetKeyToSectionId
    || !hasValidTarget
    || shouldRestoreRequestSetting(next.targetSectionKey, '', expectedTargetSectionKey)
  ) {
    next.targetSectionKey = expectedTargetSectionKey;
  }
  if (!hasValidTarget || shouldRestoreRequestSetting(next.targetSectionClassName, '', expectedTargetSectionClassName)) {
    next.targetSectionClassName = expectedTargetSectionClassName;
  }
  if ((!hasValidTarget || !Number.isFinite(Number(next.targetSectionIndex))) && sectionIndex >= 0) {
    next.targetSectionIndex = sectionIndex;
  }

  for (let slot = 1; slot <= 5; slot += 1) {
    const expectedStep = expectedSteps[slot - 1] || null;
    const titleKey = `step${slot}Title`;
    const noteKey = `step${slot}Note`;
    const alertKey = `step${slot}Alert`;
    const fieldsKey = `step${slot}FieldsJson`;
    const nextLabelKey = `step${slot}NextLabel`;
    const backLabelKey = `step${slot}BackLabel`;
    const expectedStepTitle = suppressGenericSingleStepHeading && slot === 1
      ? ''
      : String(expectedStep?.title || '').trim();
    const expectedStepNote = String(expectedStep?.note || '').trim();
    const expectedStepFieldsJson = expectedStep?.fields?.length ? JSON.stringify(expectedStep.fields) : '[]';
    const expectedStepNextLabel = String(expectedStep?.nextLabel || '').trim();
    const expectedStepBackLabel = String(expectedStep?.backLabel || '').trim();

    if (
      expectedStepTitle
      && (
        (!hasValidTarget && String(next[titleKey] || '').trim() !== expectedStepTitle)
        || shouldRestoreRequestStepTitle(next[titleKey], templateDefaults[titleKey], expectedStepTitle)
      )
    ) {
      next[titleKey] = expectedStepTitle;
    }
    if (
      (!hasValidTarget && String(next[noteKey] || '').trim() !== expectedStepNote)
      || shouldRestoreRequestSetting(next[noteKey], templateDefaults[noteKey], expectedStepNote)
    ) {
      next[noteKey] = expectedStepNote;
    }
    if (
      expectedStep
      && (
        (!hasValidTarget && String(next[fieldsKey] || '').trim() !== expectedStepFieldsJson)
        || shouldRestoreRequestFields(next[fieldsKey], templateDefaults[fieldsKey], expectedStepFieldsJson)
      )
    ) {
      next[fieldsKey] = expectedStepFieldsJson;
    }
    if (
      expectedStep
      && (
        (!hasValidTarget && String(next[nextLabelKey] || '').trim() !== expectedStepNextLabel)
        || shouldRestoreRequestSetting(next[nextLabelKey], templateDefaults[nextLabelKey], expectedStepNextLabel)
      )
    ) {
      next[nextLabelKey] = expectedStepNextLabel;
    }
    if (
      expectedStep
      && (
        (!hasValidTarget && String(next[backLabelKey] || '').trim() !== expectedStepBackLabel)
        || shouldRestoreRequestSetting(next[backLabelKey], templateDefaults[backLabelKey], expectedStepBackLabel)
      )
    ) {
      next[backLabelKey] = expectedStepBackLabel;
    }
    if (!expectedStep && String(next[fieldsKey] || '').trim() === String(templateDefaults[fieldsKey] || '').trim()) {
      next[titleKey] = '';
      next[noteKey] = '';
      next[alertKey] = '';
      next[fieldsKey] = '[]';
      next[nextLabelKey] = '';
      next[backLabelKey] = '';
    }
  }

  return next;
}

function inferCtaTitleClassName(section, bgTone) {
  const explicit = String(section?.titleClassName || '').trim();
  if (explicit) {
    return explicit;
  }

  const classToken = String(section?.className || '').toLowerCase();
  if (classToken.includes('calculators-native-contact') || classToken.includes('about-native-cta-form')) {
    return 'is-atlantean';
  }
  if (bgTone === 'blue' || bgTone === 'grey') {
    return 'is-white';
  }
  return '';
}

export function buildDynamicRequestDefaultBlocksForPath(pathname, pageTitle, currentBlocks, requestTemplate) {
  if (!requestTemplate || pathname === '/test' || !isRequestDynamicPath(pathname)) {
    return [];
  }
  const hasExplicitDynamicRequestSeed = Array.isArray(currentBlocks) && currentBlocks.some((block) => (
    String(block?.kind || '').trim().toLowerCase() === 'request_form'
    && String(block?.mode || '').trim().toLowerCase() === 'dynamic'
  ));
  if (hasExplicitDynamicRequestSeed) {
    // Explicit request-form seeds should stay authoritative instead of being inferred again from native sections.
    return [];
  }

  const nativeContent = getNativePageContent(pathname, pageTitle);
  const sections = Array.isArray(nativeContent?.sections) ? nativeContent.sections : [];
  if (!sections.length) {
    return [];
  }

  const existingIds = new Set((Array.isArray(currentBlocks) ? currentBlocks : []).map((block) => String(block?.id || '').trim()));
  const nextBlocks = [];

  sections.forEach((section, sectionIndex) => {
    const form = section?.form;
    if (!form || typeof form !== 'object') {
      return;
    }
    if (isInlineRevealRequestInferenceSection(section)) {
      return;
    }
    if (String(form.variant || '').trim().toLowerCase() === 'certificate-request') {
      return;
    }

    const steps = toRequestStepConfigs(form);
    if (!steps.length) {
      return;
    }

    const clone = cloneTemplateVariant(requestTemplate);
    const sectionLabel = String(
      section?.title
      || form?.title
      || section?.className
      || `Request ${sectionIndex + 1}`,
    ).trim();
    const idTokenSource = String(section?.id || section?.className || sectionLabel || `request_${sectionIndex + 1}`).trim();
    const blockId = nextBlocks.length === 0
      ? 'request_form'
      : toUniqueIdFromBase(`request_form_${idTokenSource}`, existingIds);
    existingIds.add(blockId);

    const bgTone = inferCtaBgTone(section);
    const bodyList = Array.isArray(section?.body) ? section.body : (section?.body ? [section.body] : []);
    const subtitleFallback = String(section?.subtitle || form?.subtitle || '').trim();
    const bodyValue = bodyList
      .map((line) => String(line || '').trim())
      .filter(Boolean)
      .join('\n\n');
    const settings = {
      ...(clone.settings || {}),
      title: String(section?.title || form?.title || clone.settings?.title || '').trim(),
      titleClassName: String(section?.titleClassName || clone.settings?.titleClassName || '').trim(),
      titleHighlightsJson: toHeroDefaultHighlightsJson(section?.titleHighlights),
      subtitle: subtitleFallback,
      body: bodyValue || String(clone.settings?.body || '').trim(),
      bgTone,
      textTone: inferRequestTextTone(section, bgTone),
      submitLabel: String(form.submitLabel || clone.settings?.submitLabel || 'Submit request').trim(),
      successMessage: String(form.successMessage || clone.settings?.successMessage || 'Thanks. We received your request.').trim(),
      targetSectionKey: section?.id
        ? `id:${section.id}`
        : (section?.className ? `class:${section.className}` : `index:${sectionIndex}`),
      targetSectionClassName: String(section?.className || '').trim(),
      targetSectionIndex: sectionIndex,
    };

    for (let slot = 1; slot <= 5; slot += 1) {
      settings[`step${slot}Title`] = '';
      settings[`step${slot}Note`] = '';
      settings[`step${slot}Alert`] = '';
      settings[`step${slot}FieldsJson`] = '[]';
    }

    steps.forEach((step, index) => {
      const slot = index + 1;
      settings[`step${slot}Title`] = String(step.title || '').trim() || `Step ${slot}`;
      settings[`step${slot}Note`] = String(step.note || '').trim();
      settings[`step${slot}Alert`] = String(step.alert || '').trim();
      settings[`step${slot}FieldsJson`] = JSON.stringify(step.fields);
    });

    nextBlocks.push({
      ...clone,
      id: blockId,
      name: sectionLabel ? `Request Form · ${sectionLabel}` : `Request Form ${sectionIndex + 1}`,
      kind: 'request_form',
      mode: 'dynamic',
      hidden: false,
      settings,
    });
  });

  return nextBlocks;
}

function inferTestimonialTagFromPath(pathname) {
  const path = String(pathname || '').trim().toLowerCase();
  if (path.includes('/legacy-giving')) {
    return 'legacy-giving';
  }
  if (path.includes('/retirement')) {
    return 'retirement';
  }
  if (path.includes('/investments')) {
    return 'investments';
  }
  if (path.includes('/loans')) {
    return 'loans';
  }
  if (path === '/services') {
    return 'services';
  }
  return '';
}

function toSectionTargetKey(section, sectionIndex) {
  if (section?.id) {
    return `id:${section.id}`;
  }
  if (section?.className) {
    return `class:${section.className}`;
  }
  return `index:${sectionIndex}`;
}

function buildDynamicTestimonialsDefaultBlocksForPath(pathname, pageTitle, currentBlocks, testimonialsTemplate) {
  if (!testimonialsTemplate || pathname === '/test') {
    return [];
  }

  const existingBlocks = Array.isArray(currentBlocks) ? currentBlocks : [];
  if (existingBlocks.some((block) => String(block?.kind || '').trim().toLowerCase() === 'testimonials')) {
    return [];
  }

  const nativeContent = getNativePageContent(pathname, pageTitle);
  const sections = Array.isArray(nativeContent?.sections) ? nativeContent.sections : [];
  if (!sections.length) {
    return [];
  }

  const existingIds = new Set(existingBlocks.map((block) => String(block?.id || '').trim()));
  const nextBlocks = [];
  const pageTag = inferTestimonialTagFromPath(pathname);

  sections.forEach((section, sectionIndex) => {
    const testimonials = Array.isArray(section?.testimonials) ? section.testimonials : [];
    if (!testimonials.length) {
      return;
    }

    const clone = cloneTemplateVariant(testimonialsTemplate);
    const sectionLabel = String(section?.title || section?.className || `Testimonials ${sectionIndex + 1}`).trim();
    const idBase = nextBlocks.length === 0 ? 'testimonials' : `testimonials_${section?.id || section?.className || sectionIndex + 1}`;
    const blockId = toUniqueIdFromBase(idBase, existingIds);
    existingIds.add(blockId);

    const selectedIdsCsv = testimonials
      .map((item, index) => normalizeTestimonialRecord(item, `testimonial-${sectionIndex + 1}-${index + 1}`).id)
      .join('\n');
    const sectionFineprint = String(section?.fineprint || '').trim();

    const nextSection = sections[sectionIndex + 1];
    const nextSectionFineprint = String(nextSection?.fineprint || '').trim();
    const nextIsFineprintSection = Boolean(
      nextSectionFineprint
      && String(nextSection?.className || '').toLowerCase().includes('fineprint'),
    );
    const fineprintText = sectionFineprint || nextSectionFineprint;

    const settings = {
      ...(clone.settings || {}),
      selectionMode: 'manual',
      selectedIdsCsv,
      filterTagsCsv: pageTag,
      limit: testimonials.length,
      showFineprint: Boolean(fineprintText) && !nextIsFineprintSection,
      fineprint: fineprintText || String(clone.settings?.fineprint || '').trim(),
      targetSectionKey: toSectionTargetKey(section, sectionIndex),
      targetFineprintSectionKey: nextIsFineprintSection ? toSectionTargetKey(nextSection, sectionIndex + 1) : '',
      targetSectionClassName: String(section?.className || '').trim(),
      targetSectionIndex: sectionIndex,
    };

    nextBlocks.push({
      ...clone,
      id: blockId,
      name: sectionLabel ? `Testimonials · ${sectionLabel}` : `Testimonials ${sectionIndex + 1}`,
      kind: 'testimonials',
      mode: 'dynamic',
      settings,
    });
  });

  return nextBlocks;
}

function normalizeToneFromClassName(className) {
  const token = String(className || '')
    .trim()
    .toLowerCase()
    .replace(/^is-/, '')
    .replace(/[^a-z-]+/g, '');
  const allowed = new Set(['atlantean', 'mango', 'melon', 'super-grey', 'white', 'blue']);
  return allowed.has(token) ? token : '';
}

function toUniqueIdFromBase(baseId, existingIds) {
  const normalizedBase = toSlugToken(baseId) || 'cta_form';
  if (!existingIds.has(normalizedBase)) {
    return normalizedBase;
  }
  let suffix = 2;
  let candidate = `${normalizedBase}_${suffix}`;
  while (existingIds.has(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase}_${suffix}`;
  }
  return candidate;
}

function buildDynamicIntroSettingsFromNative(intro, pageTitle, templateDefaults = {}) {
  if (!intro) {
    return null;
  }

  const defaults = templateDefaults && typeof templateDefaults === 'object' ? templateDefaults : {};
  const settings = clearIntroActionSettings(defaults);
  settings.heading = '';
  settings.headingClassName = '';
  settings.headingHighlightsJson = '';
  settings.body = '';
  settings.bodyHtml = '';
  settings.extraLine = '';
  settings.extraLineTone = '';

  const normalizedIntro = typeof intro === 'string' ? { body: intro, centered: true } : intro;
  const bodyList = Array.isArray(normalizedIntro.body)
    ? normalizedIntro.body
    : (normalizedIntro.body ? [normalizedIntro.body] : []);
  const headingHighlightsJson = normalizedIntro.headingHighlights
    ? JSON.stringify(normalizedIntro.headingHighlights)
    : '';

  if (normalizedIntro.heading) {
    settings.heading = normalizedIntro.heading;
  } else if (!normalizedIntro.body && !settings.heading && pageTitle) {
    settings.heading = pageTitle;
  }

  if (headingHighlightsJson) {
    settings.headingHighlightsJson = headingHighlightsJson;
  }

  if (normalizedIntro.headingClassName) {
    settings.headingClassName = normalizedIntro.headingClassName;
  }

  settings.bgTone = String(normalizedIntro.bgTone || settings.bgTone || 'white').trim() || 'white';
  settings.textTone = String(normalizedIntro.textTone || settings.textTone || 'dark').trim() || 'dark';

  if (normalizedIntro.bodyHtml) {
    settings.bodyHtml = normalizedIntro.bodyHtml;
  } else if (bodyList.length) {
    const parts = bodyList
      .map((line) => String(line || '').trim())
      .filter(Boolean)
      .map((line) => paragraphizeText(line))
      .join('');
    settings.body = bodyList.join('\n\n');
    settings.bodyHtml = parts;
  }

  if (normalizedIntro.emphasis) {
    settings.extraLine = normalizedIntro.emphasis;
  }
  if (normalizedIntro.emphasisClassName) {
    settings.extraLineTone = normalizeToneFromClassName(normalizedIntro.emphasisClassName);
  }

  if (normalizedIntro.justify) {
    settings.justify = normalizedIntro.justify;
  } else if (normalizedIntro.centered) {
    settings.justify = 'center';
  }

  if (normalizedIntro.lineSpacing) {
    settings.lineSpacing = normalizedIntro.lineSpacing;
  }

  const actions = Array.isArray(normalizedIntro.actions) ? normalizedIntro.actions : [];
  if (actions[0]) {
    settings.button1Label = actions[0].label || settings.button1Label;
    settings.button1Url = actions[0].href || actions[0].to || settings.button1Url;
    settings.button1PageRef = actions[0].to || settings.button1PageRef;
    settings.button1Style = actions[0].style
      || (actions[0].ghost ? 'outline' : settings.button1Style);
    settings.button1Tone = actions[0].tone || settings.button1Tone;
    settings.button1OpenInNewWindow = Boolean(actions[0].openInNewWindow);
  }
  if (actions[1]) {
    settings.button2Label = actions[1].label || settings.button2Label;
    settings.button2Url = actions[1].href || actions[1].to || settings.button2Url;
    settings.button2PageRef = actions[1].to || settings.button2PageRef;
    settings.button2Style = actions[1].style
      || (actions[1].ghost ? 'outline' : settings.button2Style);
    settings.button2Tone = actions[1].tone || settings.button2Tone;
    settings.button2OpenInNewWindow = Boolean(actions[1].openInNewWindow);
  }

  return normalizeIntroBodyMirror(settings);
}

function buildDynamicCtaDefaultBlocksForPath(pathname, pageTitle, currentBlocks, ctaTemplate) {
  if (!ctaTemplate || pathname === '/test' || isRequestDynamicPath(pathname)) {
    return [];
  }

  const nativeContent = getNativePageContent(pathname, pageTitle);
  const sections = Array.isArray(nativeContent?.sections) ? nativeContent.sections : [];
  if (!sections.length) {
    return [];
  }

  const existingIds = new Set((Array.isArray(currentBlocks) ? currentBlocks : []).map((block) => String(block?.id || '').trim()));
  const nextBlocks = [];

  sections.forEach((section, sectionIndex) => {
    const form = section?.form;
    if (!form || typeof form !== 'object') {
      return;
    }

    if (String(form.variant || '').trim().toLowerCase() === 'certificate-request') {
      return;
    }

    const fieldList = pickCtaFields(form);
    if (!fieldList.length) {
      return;
    }

    const clone = cloneTemplateVariant(ctaTemplate);
    const sectionLabel = String(
      section?.title
      || form?.title
      || section?.className
      || `Form ${sectionIndex + 1}`,
    ).trim();
    const idTokenSource = String(section?.id || section?.className || sectionLabel || `form_${sectionIndex + 1}`).trim();
    const baseId = nextBlocks.length === 0 ? 'cta_form' : `cta_form_${idTokenSource}`;
    const blockId = toUniqueIdFromBase(baseId, existingIds);
    existingIds.add(blockId);

    const inferredBgTone = inferCtaBgTone(section);
    const displayMode = String(form?.displayMode || '').trim();
    const triggerMode = String(form?.triggerMode || '').trim();
    const settings = {
      ...(clone.settings || {}),
      title: String(section?.title || form?.title || clone.settings?.title || '').trim() || clone.settings?.title || '',
      titleClassName: inferCtaTitleClassName(section, inferredBgTone) || String(clone.settings?.titleClassName || '').trim(),
      titleHighlightsJson: JSON.stringify(Array.isArray(section?.titleHighlights) ? section.titleHighlights : []),
      bodyHtml: toBodyHtmlFromSection(section, form) || String(clone.settings?.bodyHtml || '').trim(),
      bgTone: inferredBgTone,
      submitLabel: normalizeLegacyCtaSubmitLabel(form.submitLabel, clone.settings?.submitLabel) || 'Submit',
      successMessage: String(form.successMessage || clone.settings?.successMessage || 'Thanks. We received your request.').trim(),
      targetSectionKey: section?.id
        ? `id:${section.id}`
        : (section?.className ? `class:${section.className}` : `index:${sectionIndex}`),
      targetSectionClassName: String(section?.className || '').trim(),
      targetSectionIndex: sectionIndex,
    };

    if (displayMode) {
      settings.displayMode = displayMode;
    }
    if (triggerMode) {
      settings.triggerMode = triggerMode;
    }

    Object.assign(settings, buildCtaFormSettingsPatch({ fields: fieldList }));

    nextBlocks.push({
      ...clone,
      id: blockId,
      name: sectionLabel ? `CTA Form · ${sectionLabel}` : `CTA Form ${sectionIndex + 1}`,
      kind: 'cta_form',
      mode: 'dynamic',
      settings,
    });
  });

  return nextBlocks;
}

function buildDefaultBlocks() {
  const blocksByPath = {};
  const ctaTemplate = getAllBlockTemplateBlueprints().find((template) => (
    String(template?.kind || '').trim().toLowerCase() === 'cta_form'
    && String(template?.mode || '').trim().toLowerCase() === 'dynamic'
  ));
  const introTemplate = getAllBlockTemplateBlueprints().find((template) => (
    String(template?.kind || '').trim().toLowerCase() === 'intro'
    && String(template?.mode || '').trim().toLowerCase() === 'dynamic'
  ));
  const requestTemplate = getAllBlockTemplateBlueprints().find((template) => (
    String(template?.kind || '').trim().toLowerCase() === 'request_form'
    && String(template?.mode || '').trim().toLowerCase() === 'dynamic'
  ));
  const testimonialsTemplate = getAllBlockTemplateBlueprints().find((template) => (
    String(template?.kind || '').trim().toLowerCase() === 'testimonials'
    && String(template?.mode || '').trim().toLowerCase() === 'dynamic'
  ));

  sitePages.forEach((page) => {
    if (page.path.startsWith('/admin/')) {
      return;
    }

    const nativeContent = getNativePageContent(page.path, page.title);

    const orderedBlueprint = orderDefaultBlocksForPath(
      page.path,
      contentBlockBlueprintsByPath[page.path] || genericPageFallbackBlueprint(),
    );
    const blueprint = dedupeBlocksById(orderedBlueprint);

    const seededBlocks = blueprint.map((block) => {
      const blockId = String(block?.id || '').trim();
      if (
        page.path === '/'
        && HOME_LOCKED_DYNAMIC_BLOCK_IDS.has(blockId)
        && String(block?.mode || '').trim().toLowerCase() !== 'dynamic'
      ) {
        const dynamicVariant = getModeTemplateVariant({
          pathname: page.path,
          blockId,
          blockKind: block?.kind,
          mode: 'dynamic',
        });
        if (dynamicVariant) {
          return cloneTemplateVariant(dynamicVariant);
        }
      }

      const nextBlock = {
        ...block,
        settings: { ...(block.settings || {}) },
        editableFields: [...(block.editableFields || [])],
      };

      if (nextBlock?.id === 'intro' && nextBlock?.kind === 'intro' && nextBlock?.mode === 'dynamic') {
        nextBlock.settings = normalizeIntroBodyMirror(nextBlock.settings);
      }

      return nextBlock;
    });

    const dynamicCtaBlocks = buildDynamicCtaDefaultBlocksForPath(
      page.path,
      page.title,
      seededBlocks,
      ctaTemplate,
    );
    const dynamicRequestBlocks = buildDynamicRequestDefaultBlocksForPath(
      page.path,
      page.title,
      seededBlocks,
      requestTemplate,
    );
    const dynamicTestimonialsBlocks = buildDynamicTestimonialsDefaultBlocksForPath(
      page.path,
      page.title,
      seededBlocks,
      testimonialsTemplate,
    );

    let nextBlocks = [...seededBlocks, ...dynamicCtaBlocks];
    if (dynamicRequestBlocks.length) {
      dynamicRequestBlocks.forEach((requestBlock, index) => {
        if (index === 0) {
          const existingIndex = nextBlocks.findIndex((block) => block?.id === 'request_form');
          if (existingIndex >= 0) {
            nextBlocks.splice(existingIndex, 1, requestBlock);
            return;
          }
        }
        nextBlocks.push(requestBlock);
      });
    }
    if (dynamicTestimonialsBlocks.length) {
      nextBlocks = [...nextBlocks, ...dynamicTestimonialsBlocks];
    }

    if (EMPTY_PAGE_CONTENT_SEED_DISABLED_PATHS.has(page.path)) {
      nextBlocks = nextBlocks.filter((block) => {
        if (!isPageContentBlock(block)) {
          return true;
        }
        const html = String(block?.settings?.html || '').trim();
        return Boolean(html && html !== '<p></p>' && html !== '<p><br></p>');
      });
    }

    const introSettingsRaw = (
      introTemplate
      && page.path !== '/'
      && !nativeContent?.hideIntro
    )
      ? buildDynamicIntroSettingsFromNative(
        nativeContent?.intro,
        page.title,
        introTemplate.settings,
      )
      : null;
    const introSettings = introSettingsRaw && !isPlaceholderIntroSettings(introSettingsRaw)
      ? introSettingsRaw
      : null;

    if (introSettings) {
      const introClone = cloneTemplateVariant(introTemplate);
      const introBlock = {
        ...introClone,
        settings: { ...(introClone.settings || {}), ...introSettings },
      };
      const existingIntroIndex = nextBlocks.findIndex((block) => block?.id === 'intro');
      if (existingIntroIndex >= 0) {
        nextBlocks.splice(existingIntroIndex, 1, introBlock);
      } else {
        const heroIndex = nextBlocks.findIndex((block) => block?.id === 'hero');
        const insertIndex = heroIndex >= 0 ? heroIndex + 1 : 0;
        nextBlocks.splice(insertIndex, 0, introBlock);
      }
    }

    blocksByPath[page.path] = nextBlocks;
  });

  return blocksByPath;
}

function scoreTemplateVariant(block) {
  const editableCount = Array.isArray(block?.editableFields) ? block.editableFields.length : 0;
  const settingsCount = block?.settings && typeof block.settings === 'object'
    ? Object.keys(block.settings).length
    : 0;
  const dynamicBoost = String(block?.mode || '').trim().toLowerCase() === 'dynamic' ? 3 : 0;
  return (editableCount * 10) + settingsCount + dynamicBoost;
}

function cloneTemplateVariant(block) {
  return {
    ...block,
    settings: JSON.parse(JSON.stringify(block?.settings || {})),
    editableFields: JSON.parse(JSON.stringify(Array.isArray(block?.editableFields) ? block.editableFields : [])),
  };
}

function getModeTemplateVariant({ pathname, blockId, blockKind, mode }) {
  const targetMode = String(mode || '').trim().toLowerCase();
  const targetId = String(blockId || '').trim();
  const targetKind = String(blockKind || '').trim().toLowerCase();
  if (!targetMode || (!targetId && !targetKind)) {
    return null;
  }

  const orderedSources = [];
  if (pathname && Array.isArray(contentBlockBlueprintsByPath[pathname])) {
    orderedSources.push({ path: pathname, blocks: contentBlockBlueprintsByPath[pathname] });
  }
  Object.entries(contentBlockBlueprintsByPath || {}).forEach(([path, blocks]) => {
    if (path === pathname) {
      return;
    }
    orderedSources.push({ path, blocks });
  });
  orderedSources.push({ path: '__generic__', blocks: genericPageBlockBlueprint() });

  let winner = null;
  let winnerRank = Number.NEGATIVE_INFINITY;

  orderedSources.forEach(({ path, blocks }) => {
    (Array.isArray(blocks) ? blocks : []).forEach((candidate) => {
      const candidateMode = String(candidate?.mode || '').trim().toLowerCase();
      if (candidateMode !== targetMode) {
        return;
      }

      const candidateId = String(candidate?.id || '').trim();
      const candidateKind = String(candidate?.kind || '').trim().toLowerCase();
      const idMatch = Boolean(targetId) && candidateId === targetId;
      const kindMatch = Boolean(targetKind) && candidateKind === targetKind;
      if (!idMatch && !kindMatch) {
        return;
      }

      const rank = (
        (idMatch ? 1000 : 0)
        + (kindMatch ? 200 : 0)
        + (path === pathname ? 5000 : 0)
        + scoreTemplateVariant(candidate)
      );

      if (rank > winnerRank) {
        winnerRank = rank;
        winner = candidate;
      }
    });
  });

  return winner ? cloneTemplateVariant(winner) : null;
}

export function normalizeStoredConfig(payload) {
  const defaultHierarchy = buildDefaultPageHierarchy();
  const defaultBlocks = buildDefaultBlocks();

  if (!payload || typeof payload !== 'object') {
    return {
      pageHierarchy: defaultHierarchy,
      blocksByPath: defaultBlocks,
      pathAliases: { ...DEFAULT_MANAGED_PATH_ALIASES },
      collaborationByPath: {},
    };
  }

  const rawPageHierarchy = payload.pageHierarchy && typeof payload.pageHierarchy === 'object'
    ? { ...payload.pageHierarchy }
    : {};
  if (
    rawPageHierarchy[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH]
    && !rawPageHierarchy[RETIREMENT_403B_GROUP_ENROLLMENT_PATH]
  ) {
    rawPageHierarchy[RETIREMENT_403B_GROUP_ENROLLMENT_PATH] = {
      ...rawPageHierarchy[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH],
      path: RETIREMENT_403B_GROUP_ENROLLMENT_PATH,
      routeKey: RETIREMENT_403B_GROUP_ENROLLMENT_PATH,
      parentPath: '/services/retirement/403b',
    };
  }
  delete rawPageHierarchy[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  delete rawPageHierarchy[RETIREMENT_403B_GROUP_OVERVIEW_LEGACY_PATH];

  const mergedHierarchy = { ...defaultHierarchy, ...rawPageHierarchy };
  const pageHierarchy = {};
  Object.entries(mergedHierarchy).forEach(([key, page]) => {
    if (!page || typeof page !== 'object') {
      return;
    }
    const path = normalizeManagedPathInput(page.path || key);
    if (
      !path
      || path.startsWith('/admin/')
      || path === RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH
      || path === RETIREMENT_403B_GROUP_OVERVIEW_LEGACY_PATH
    ) {
      return;
    }
    const fallback = defaultHierarchy[path] || {};
    pageHierarchy[path] = {
      ...fallback,
      ...page,
      path,
      routeKey: String(page.routeKey || fallback.routeKey || key || path),
      linkRef: String(page.linkRef || fallback.linkRef || path),
      breadcrumbLabel: String(page.breadcrumbLabel || fallback.breadcrumbLabel || page.title || fallback.title || ''),
      parentPath: page.parentPath || null,
      hideFromSitemap: Object.prototype.hasOwnProperty.call(page, 'hideFromSitemap')
        ? Boolean(page.hideFromSitemap)
        : Boolean(fallback.hideFromSitemap),
    };
  });

  Object.values(pageHierarchy).forEach((page) => {
    if (page.parentPath && !pageHierarchy[page.parentPath]) {
      page.parentPath = null;
    }
  });

  const storedBlocksByPathSource = payload.blocksByPath && typeof payload.blocksByPath === 'object'
    ? { ...payload.blocksByPath }
    : {};
  if (
    Array.isArray(storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH])
    && !Array.isArray(storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_PATH])
  ) {
    storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_PATH] = storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  }
  delete storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  delete storedBlocksByPathSource[RETIREMENT_403B_GROUP_OVERVIEW_LEGACY_PATH];

  const storedBlocksByPath = storedBlocksByPathSource;
  const blocksByPath = { ...defaultBlocks };

  Object.entries(storedBlocksByPath).forEach(([path, storedBlocks]) => {
    if (!Array.isArray(storedBlocks)) {
      return;
    }

    const defaultForPath = Array.isArray(defaultBlocks[path]) ? defaultBlocks[path] : [];
    const defaultById = new Map(defaultForPath.map((block) => [block.id, block]));
    const normalizedStoredBlocks = dedupeBlocksByIdPreferLatest(storedBlocks);
    const canonicalFormOwner = inferCanonicalFormOwner(defaultForPath);
    const seenIds = new Set();
    const mergedInStoredOrder = [];

    normalizedStoredBlocks.forEach((storedBlock) => {
      const storedBlockId = String(storedBlock?.id || '').trim();
      const storedKind = String(storedBlock?.kind || '').trim().toLowerCase();
      const effectiveStoredBlockId = storedBlockId;

      if (!storedBlock || typeof storedBlock !== 'object' || !effectiveStoredBlockId || seenIds.has(effectiveStoredBlockId)) {
        return;
      }
      const storedSettings = storedBlock?.settings && typeof storedBlock.settings === 'object'
        ? storedBlock.settings
        : {};
      const singletonRequestIds = REQUEST_FORM_SINGLETON_IDS_BY_PATH[path];
      if (
        singletonRequestIds
        && storedKind === 'request_form'
        && !singletonRequestIds.has(String(storedBlock.id || '').trim())
      ) {
        return;
      }
      if (canonicalFormOwner === 'cta_form' && storedKind === 'request_form') {
        return;
      }
      if (canonicalFormOwner === 'request_form' && storedKind === 'cta_form') {
        return;
      }
      if (
        path === '/about-us/impact'
        && isPageContentBlock(storedBlock)
        && String(storedSettings.html || '').trim() === ''
        && String(storedSettings.body || '').trim() === ''
      ) {
        return;
      }
      if (
        path === '/services/investments/invest-by-mail'
        && isPageContentBlock(storedBlock)
        && String(storedSettings.html || '').trim() === ''
        && String(storedSettings.body || '').trim() === ''
      ) {
        return;
      }
      if (
        path === LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH
        && isPageContentBlock(storedBlock)
      ) {
        return;
      }
      if (
        path === LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH
        && isPageContentBlock(storedBlock)
      ) {
        return;
      }
      if (
        path === RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_PATH
        && isPageContentBlock(storedBlock)
      ) {
        return;
      }
      if (
        path === RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_PATH
        && storedBlock.id === 'billboard'
        && storedKind === 'billboard'
      ) {
        return;
      }
      if (
        (path === RETIREMENT_403B_PATH || path === RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_PATH)
        && storedBlock.id === 'intro'
        && storedKind === 'intro'
      ) {
        return;
      }
      if (
        path === '/services/insurance/group-term-life-insurance'
        && storedBlock.id === 'intro'
        && storedKind === 'intro'
      ) {
        return;
      }
      if (path === '/rates' && storedBlock.id === 'disclaimer' && storedKind === 'legal_copy') {
        return;
      }
      seenIds.add(effectiveStoredBlockId);
      const defaultBlock = defaultById.get(effectiveStoredBlockId);
      if (!defaultBlock) {
        mergedInStoredOrder.push(storedBlock);
        return;
      }

      let storedMode = String(storedBlock.mode || defaultBlock.mode || '').trim().toLowerCase() || defaultBlock.mode;
      let nextStoredBlock = storedBlock;
      if (
        REQUEST_FORM_MODE_LOCKED_PATHS.has(path)
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...storedBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: false,
          settings: isBlankSettingsObject(storedBlock?.settings)
            ? { ...(defaultBlock?.settings || {}) }
            : {
                ...(defaultBlock?.settings || {}),
                ...(storedBlock?.settings || {}),
              },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        path === LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH
        && storedBlock.id === 'hero'
        && storedKind === 'hero'
        && defaultBlock
        && Boolean(storedBlock?.hidden)
      ) {
        nextStoredBlock = {
          ...storedBlock,
          hidden: false,
        };
      }
      if (
        path === LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH
        && storedBlock.id === 'hero'
        && storedKind === 'hero'
        && defaultBlock
      ) {
        nextStoredBlock = {
          ...storedBlock,
          hidden: false,
          settings: {
            ...(nextStoredBlock?.settings || storedBlock?.settings || {}),
            button1Label: '',
            button1Url: '',
            button1PageRef: '',
            button2Label: '',
            button2Url: '',
            button2PageRef: '',
          },
        };
      }
      if (
        path === LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && defaultBlock
        && isStaleLegacyCharitableGiftAnnuitiesRequestTarget(storedSettings)
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = cloneCanonicalRequestFormBlock(defaultBlock, storedBlock);
      }
      if (
        path === LEGACY_GIVING_ENDOWMENTS_PATH
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && defaultBlock
        && isStaleLegacyEndowmentsRequestTarget(storedSettings)
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = cloneCanonicalRequestFormBlock(defaultBlock, storedBlock);
      }
      if (
        path === LEGACY_GIVING_GENEROSITY_FUND_PATH
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && defaultBlock
        && isStaleLegacyGenerosityFundRequestTarget(storedSettings)
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = cloneCanonicalRequestFormBlock(defaultBlock, storedBlock);
      }
      if (
        path === LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && defaultBlock
        && isStaleLegacyMinistryImpactFundRequestTarget(storedSettings)
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = cloneCanonicalRequestFormBlock(defaultBlock, storedBlock);
      }
      if (
        path === '/services/insurance/life-insurance-quote'
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && defaultBlock
        && isStaleLifeInsuranceQuoteRequestTarget(storedSettings)
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = cloneCanonicalRequestFormBlock(defaultBlock, storedBlock);
      }
      if (
        path === '/services/insurance/property-casualty-insurance'
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && defaultBlock
        && isStalePropertyCasualtyRequestContent(storedSettings)
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = cloneCanonicalRequestFormBlock(defaultBlock, storedBlock);
      }
      if (
        path === '/services/retirement/retirement-consultants'
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && defaultBlock
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...cloneTemplateVariant(defaultBlock),
          id: defaultBlock.id || storedBlock.id,
          name: defaultBlock.name || storedBlock.name,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: false,
          settings: {
            ...(defaultBlock?.settings || {}),
          },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? [...defaultBlock.editableFields]
            : [],
        };
      }
      if (shouldUpgradeLegacyLoansDynamicBlock(path, storedBlock, defaultBlock)) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...storedBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
            ? defaultBlock.hidden
            : storedBlock.hidden,
          settings: isBlankSettingsObject(storedBlock?.settings)
            ? { ...(defaultBlock?.settings || {}) }
            : {
                ...(defaultBlock?.settings || {}),
                ...(storedBlock?.settings || {}),
              },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        path === RETIREMENT_403B_GROUP_ENROLLMENT_PATH
        && storedBlock.id === 'billboard'
        && storedKind === 'billboard'
        && storedMode === 'dynamic'
      ) {
        const billboardSettings = nextStoredBlock?.settings || {};
        const buttonUrl = String(billboardSettings.buttonUrl || '').trim();
        const buttonPageRef = String(billboardSettings.buttonPageRef || '').trim();
        const button2Url = String(billboardSettings.button2Url || '').trim();
        const button2PageRef = String(billboardSettings.button2PageRef || '').trim();
        nextStoredBlock = {
          ...nextStoredBlock,
          settings: {
            ...billboardSettings,
            bgTone: 'white',
            textTone: 'dark',
            buttonPageRef: /^https?:\/\/files\.agfinancial\.org\/.+\.pdf$/i.test(buttonUrl) && buttonPageRef === buttonUrl
              ? ''
              : buttonPageRef,
            button2PageRef: /^https?:\/\/files\.agfinancial\.org\/.+\.pdf$/i.test(button2Url) && button2PageRef === button2Url
              ? ''
              : button2PageRef,
          },
        };
      }
      if (
        path === '/services/retirement/403b'
        && storedBlock.id === 'cta_form'
        && storedKind === 'cta_form'
        && storedMode === 'dynamic'
      ) {
        const ctaSettings = nextStoredBlock?.settings || {};
        const targetSectionClassName = String(ctaSettings.targetSectionClassName || '').trim();
        const targetSectionKey = String(ctaSettings.targetSectionKey || '').trim();
        const bodyHtml = String(ctaSettings.bodyHtml || '').trim();
        const subtitle = String(ctaSettings.subtitle || '').trim();
        const isLegacyTargeted403bCta = targetSectionClassName === 'retirement-child-native-cta retirement-403b-native-cta'
          || targetSectionKey === 'class:retirement-child-native-cta retirement-403b-native-cta'
          || bodyHtml === '<p>And we’re eager to help.</p>';

        if (isLegacyTargeted403bCta) {
          nextStoredBlock = {
            ...nextStoredBlock,
            settings: {
              ...ctaSettings,
              bodyHtml: '',
              subtitle: subtitle || 'And we’re eager to help.',
              bgTone: 'white',
              targetSectionKey: '',
              targetSectionClassName: '',
              targetSectionIndex: 0,
            },
          };
        }
      }
      if (
        storedKind === 'cta_form'
        && storedMode === 'dynamic'
        && defaultBlock
      ) {
        const defaultDisplayMode = String(defaultBlock?.settings?.displayMode || '').trim();
        const defaultTriggerMode = String(defaultBlock?.settings?.triggerMode || '').trim();
        const storedDisplayMode = String(nextStoredBlock?.settings?.displayMode || '').trim();
        const storedTriggerMode = String(nextStoredBlock?.settings?.triggerMode || '').trim();
        const needsDisplayMode = !storedDisplayMode && defaultDisplayMode;
        const needsTriggerMode = !storedTriggerMode && defaultTriggerMode;

        if (needsDisplayMode || needsTriggerMode) {
          nextStoredBlock = {
            ...nextStoredBlock,
            settings: {
              ...(nextStoredBlock?.settings || {}),
              ...(needsDisplayMode ? { displayMode: defaultDisplayMode } : {}),
              ...(needsTriggerMode ? { triggerMode: defaultTriggerMode } : {}),
            },
          };
        }
      }
      if (
        path === '/services/retirement/403b'
        && isPageContentBlock(storedBlock)
        && defaultBlock
      ) {
        const storedHtml = String(nextStoredBlock?.settings?.html || '').trim();
        const looksLikeLegacy403bLoanHtml = storedHtml.includes('403(b) Plan Loans')
          || storedHtml.includes('A 403(b) loan allows you to borrow money from your own retirement savings')
          || storedHtml.includes('The requested 403(b) loan amount cannot be less than $1,500');
        const isCanonical403bLoanHtml = storedHtml.includes('retirement-403b-loan-copy');
        if (
          !storedHtml
          || storedHtml === '<p></p>'
          || storedHtml === '<p><br></p>'
          || (looksLikeLegacy403bLoanHtml && !isCanonical403bLoanHtml)
        ) {
          nextStoredBlock = {
            ...cloneTemplateVariant(defaultBlock),
            id: defaultBlock.id || storedBlock.id,
            name: defaultBlock.name || storedBlock.name,
            kind: defaultBlock.kind || storedBlock.kind,
            mode: 'dynamic',
            hidden: false,
            settings: {
              ...(defaultBlock?.settings || {}),
            },
            editableFields: Array.isArray(defaultBlock?.editableFields)
              ? [...defaultBlock.editableFields]
              : [],
          };
        }
      }
      if (
        path === '/services/retirement/403b'
        && storedBlock.id === 'loan_apply'
        && storedKind === 'card_grid'
        && storedMode === 'dynamic'
        && defaultBlock
        && isLegacyRetirement403bLoanApplySettings(nextStoredBlock?.settings)
      ) {
        nextStoredBlock = {
          ...nextStoredBlock,
          templateId: defaultBlock.templateId || nextStoredBlock.templateId || 'card_grid',
          presetId: defaultBlock.presetId || nextStoredBlock.presetId || 'step-cards',
          settings: {
            ...(defaultBlock?.settings || {}),
          },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? [...defaultBlock.editableFields]
            : (Array.isArray(nextStoredBlock?.editableFields) ? [...nextStoredBlock.editableFields] : []),
        };
      }
      if (path === '/services/loans' && storedBlock.id === 'hero' && storedMode === 'dynamic') {
        nextStoredBlock = {
          ...nextStoredBlock,
          settings: normalizeLoansHeroSettings(nextStoredBlock?.settings),
        };
      }
      if (storedBlock.id === 'hero' && storedMode === 'dynamic') {
        nextStoredBlock = {
          ...nextStoredBlock,
          settings: normalizeHeroSettingsByPath(path, nextStoredBlock?.settings),
        };
      }
      if (
        path === LEGACY_GIVING_GENEROSITY_FUND_PATH
        && storedBlock.id === 'joyful_giving_billboard'
        && storedKind === 'billboard'
        && storedMode === 'dynamic'
      ) {
        nextStoredBlock = {
          ...nextStoredBlock,
          settings: normalizeGenerosityFundJoyfulGivingBillboardSettings(nextStoredBlock?.settings),
        };
      }
      if (path === '/' && storedBlock.id === 'top_strip' && storedMode === 'dynamic') {
        nextStoredBlock = {
          ...nextStoredBlock,
          settings: normalizeTopStripSettings(nextStoredBlock?.settings),
        };
      }
      if (
        path === '/services/investments'
        && storedBlock.id === 'laddering'
        && storedKind === 'calculator_cta'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...storedBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
            ? defaultBlock.hidden
            : storedBlock.hidden,
          settings: isBlankSettingsObject(storedBlock?.settings)
            ? { ...(defaultBlock?.settings || {}) }
            : {
                ...(defaultBlock?.settings || {}),
                ...(storedBlock?.settings || {}),
              },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        path === '/services/investments'
        && storedBlock.id === 'cash_reserves'
        && storedKind === 'feature_panel'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...storedBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
            ? defaultBlock.hidden
            : storedBlock.hidden,
          settings: isBlankSettingsObject(storedBlock?.settings)
            ? { ...(defaultBlock?.settings || {}) }
            : {
                ...(defaultBlock?.settings || {}),
                ...(storedBlock?.settings || {}),
              },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        path === '/services/retirement'
        && storedBlock.id === 'cta_form'
        && storedKind === 'cta_form'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...nextStoredBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
            ? defaultBlock.hidden
            : storedBlock.hidden,
          settings: normalizeRetirementLandingCtaSettings(
            isBlankSettingsObject(nextStoredBlock?.settings)
              ? { ...(defaultBlock?.settings || {}) }
              : {
                  ...(defaultBlock?.settings || {}),
                  ...(nextStoredBlock?.settings || {}),
                },
            defaultBlock?.settings || {},
          ),
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        path === '/services/retirement'
        && storedBlock.id === 'split_options'
        && storedKind === 'split_panel'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...storedBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
            ? defaultBlock.hidden
            : storedBlock.hidden,
          settings: isBlankSettingsObject(storedBlock?.settings)
            ? { ...(defaultBlock?.settings || {}) }
            : {
                ...(defaultBlock?.settings || {}),
                ...(storedBlock?.settings || {}),
              },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        path === '/'
        && storedBlock.id === 'impact_stat'
        && storedKind === 'impact_stat'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...storedBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
            ? defaultBlock.hidden
            : storedBlock.hidden,
          settings: isBlankSettingsObject(storedBlock?.settings)
            ? { ...(defaultBlock?.settings || {}) }
            : {
                ...(defaultBlock?.settings || {}),
                ...(storedBlock?.settings || {}),
              },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        path === '/'
        && HOME_LOCKED_DYNAMIC_BLOCK_IDS.has(storedBlock.id)
        && storedMode !== 'dynamic'
        && defaultBlock?.mode === 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...storedBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
            ? defaultBlock.hidden
            : storedBlock.hidden,
          settings: isBlankSettingsObject(storedBlock?.settings)
            ? { ...(defaultBlock?.settings || {}) }
            : {
                ...(defaultBlock?.settings || {}),
                ...(storedBlock?.settings || {}),
              },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        path === '/'
        && storedBlock.id === 'services_grid'
        && storedKind === 'services_grid'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = {
          ...storedBlock,
          kind: defaultBlock.kind || storedBlock.kind,
          mode: 'dynamic',
          hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
            ? defaultBlock.hidden
            : storedBlock.hidden,
          settings: isBlankSettingsObject(storedBlock?.settings)
            ? { ...(defaultBlock?.settings || {}) }
            : {
                ...(defaultBlock?.settings || {}),
                ...(storedBlock?.settings || {}),
              },
          editableFields: Array.isArray(defaultBlock?.editableFields)
            ? defaultBlock.editableFields
            : (Array.isArray(storedBlock?.editableFields) ? storedBlock.editableFields : []),
        };
      }
      if (
        isRequestDynamicPath(path)
        && storedKind === 'request_form'
        && storedMode === 'dynamic'
      ) {
        nextStoredBlock = {
          ...nextStoredBlock,
          hidden: false,
          settings: normalizeDynamicRequestFormSettings(path, nextStoredBlock?.settings),
        };
      }
      const modeVariant = getModeTemplateVariant({
        pathname: path,
        blockId: storedBlock.id,
        blockKind: storedBlock.kind || defaultBlock.kind,
        mode: storedMode,
      }) || cloneTemplateVariant(defaultBlock);
      if (storedBlock.id === 'intro' && storedMode === 'dynamic' && isPlaceholderIntroSettings(storedBlock.settings)) {
        nextStoredBlock = {
          ...storedBlock,
          settings: { ...(defaultBlock?.settings || {}) },
        };
      }
      if (storedBlock.id === 'intro' && storedMode === 'dynamic' && shouldRefreshStoredIntroFromNative(path, nextStoredBlock?.settings)) {
        nextStoredBlock = {
          ...nextStoredBlock,
          settings: { ...(defaultBlock?.settings || {}) },
        };
      }
      if (INTRO_ACTION_LOCKED_PATHS.has(path) && storedBlock.id === 'intro' && storedMode === 'dynamic') {
        nextStoredBlock = {
          ...nextStoredBlock,
          settings: clearIntroActionSettings(nextStoredBlock?.settings),
        };
      }
      mergedInStoredOrder.push({
        ...modeVariant,
        ...nextStoredBlock,
        name: normalizeBlockDisplayName(
          nextStoredBlock.name,
          storedMode,
          modeVariant.name,
          nextStoredBlock.kind || modeVariant.kind,
        ),
        mode: storedMode,
        kind: nextStoredBlock.kind || modeVariant.kind,
        settings: (
          storedBlock.id === 'intro' && storedMode === 'dynamic'
            ? normalizeIntroBodyMirror({
              ...(modeVariant.settings || {}),
              ...(nextStoredBlock.settings || {}),
            })
            : {
                ...(modeVariant.settings || {}),
                ...(nextStoredBlock.settings || {}),
              }
        ),
        // Field schema should come from the current mode variant blueprint so admin UI upgrades appear automatically.
        editableFields: Array.isArray(modeVariant.editableFields) ? modeVariant.editableFields : [],
      });
    });

    // Insert newly introduced blueprint blocks at their blueprint positions.
    const missingDefaults = defaultForPath.filter((defaultBlock) => !seenIds.has(defaultBlock.id));
    const mergedWithMissingDefaults = [...mergedInStoredOrder];
    missingDefaults.forEach((missingBlock) => {
      const missingIndex = defaultForPath.findIndex((defaultBlock) => defaultBlock.id === missingBlock.id);
      const laterDefaultIds = defaultForPath
        .slice(missingIndex + 1)
        .map((defaultBlock) => defaultBlock.id);
      const insertBeforeIndex = mergedWithMissingDefaults.findIndex((candidateBlock) => (
        laterDefaultIds.includes(candidateBlock?.id)
      ));

      if (insertBeforeIndex === -1) {
        mergedWithMissingDefaults.push(
          missingBlock?.id === 'intro' && missingBlock?.kind === 'intro' && missingBlock?.mode === 'dynamic'
            ? { ...missingBlock, settings: normalizeIntroBodyMirror(missingBlock.settings) }
            : missingBlock,
        );
      } else {
        mergedWithMissingDefaults.splice(
          insertBeforeIndex,
          0,
          missingBlock?.id === 'intro' && missingBlock?.kind === 'intro' && missingBlock?.mode === 'dynamic'
            ? { ...missingBlock, settings: normalizeIntroBodyMirror(missingBlock.settings) }
            : missingBlock,
        );
      }
    });
    blocksByPath[path] = normalizePageBlocksState(mergedWithMissingDefaults);
  });

  const pathAliases = normalizePathAliases(
    {
      ...((payload.pathAliases && typeof payload.pathAliases === 'object') ? payload.pathAliases : {}),
      ...DEFAULT_MANAGED_PATH_ALIASES,
    },
    pageHierarchy,
  );
  const collaborationByPathSource = payload.collaborationByPath && typeof payload.collaborationByPath === 'object'
    ? { ...payload.collaborationByPath }
    : {};
  if (
    collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH]
    && !collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_PATH]
  ) {
    collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_PATH] = collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  }
  delete collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  delete collaborationByPathSource[RETIREMENT_403B_GROUP_OVERVIEW_LEGACY_PATH];
  const collaborationByPath = normalizeCollaborationState(collaborationByPathSource);

  return { pageHierarchy, blocksByPath, pathAliases, collaborationByPath };
}

function readInitialState() {
  if (isDevContentAuthorityEnabled()) {
    return normalizeStoredConfig(null);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeStoredConfig(null);
    }
    return normalizeStoredConfig(JSON.parse(raw));
  } catch {
    return normalizeStoredConfig(null);
  }
}

export async function bootstrapSharedContentAdminState() {
  if (!isDevContentAuthorityEnabled()) {
    return null;
  }

  const seedState = normalizeStoredConfig(null);

  try {
    let snapshot = await fetchSharedContentSnapshot();
    if (!snapshot?.initialized) {
      snapshot = await initializeSharedContentFromSeed(seedState, null);
    }
    const nextState = snapshot?.state || snapshot?.payload?.state;
    if (!nextState) {
      return seedState;
    }
    const normalizedAuthoringState = normalizeStoredConfig(nextState);
    const normalizedPublishedState = normalizeStoredConfig(
      snapshot?.baseSnapshot || snapshot?.payload?.baseSnapshot || nextState,
    );
    return {
      ...normalizedAuthoringState,
      __contentAdminBootstrap: {
        authoringState: normalizedAuthoringState,
        publishedState: normalizedPublishedState,
        updatedAt: Number(snapshot?.updatedAt) || 0,
        seedBaseline: snapshot?.seedBaseline || null,
      },
    };
  } catch {
    return seedState;
  }
}

function parseInitialContentAdminBootstrapState(initialState) {
  if (
    initialState
    && typeof initialState === 'object'
    && initialState.__contentAdminBootstrap
    && typeof initialState.__contentAdminBootstrap === 'object'
  ) {
    const bootstrap = initialState.__contentAdminBootstrap;
    const authoringState = normalizeStoredConfig(bootstrap.authoringState || initialState);
    const publishedState = normalizeStoredConfig(bootstrap.publishedState || bootstrap.authoringState || initialState);
    return {
      authoringState,
      publishedState,
      updatedAt: Number(bootstrap.updatedAt) || 0,
      seedBaseline: bootstrap.seedBaseline || null,
    };
  }

  const normalizedState = initialState ? normalizeStoredConfig(initialState) : readInitialState();
  return {
    authoringState: normalizedState,
    publishedState: normalizedState,
    updatedAt: 0,
    seedBaseline: null,
  };
}

function buildBreadcrumbTrail(pathname, pageHierarchy) {
  const trail = [];
  const visited = new Set();
  let currentPath = pathname;

  while (currentPath && pageHierarchy[currentPath] && !visited.has(currentPath)) {
    visited.add(currentPath);
    const item = pageHierarchy[currentPath];
    trail.unshift({ path: item.path, label: item.breadcrumbLabel || item.title || item.path });
    currentPath = item.parentPath || null;
  }

  return trail;
}

function isValidParent(pathname, parentPath, pageHierarchy) {
  if (!parentPath || parentPath === pathname) {
    return parentPath === null;
  }

  // prevent parent cycle by walking upward from candidate parent
  const seen = new Set();
  let cursor = parentPath;
  while (cursor && pageHierarchy[cursor] && !seen.has(cursor)) {
    if (cursor === pathname) {
      return false;
    }
    seen.add(cursor);
    cursor = pageHierarchy[cursor].parentPath;
  }

  return true;
}

function toUniqueBlockId(baseId, existingBlocks) {
  const normalizedBase = String(baseId || 'block')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'block';
  const existingIds = new Set((Array.isArray(existingBlocks) ? existingBlocks : []).map((block) => String(block?.id || '')));
  if (!existingIds.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  let candidate = `${normalizedBase}_${suffix}`;
  while (existingIds.has(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase}_${suffix}`;
  }
  return candidate;
}

function toComparableAuthoringState(rawState) {
  const normalizedState = normalizeStoredConfig(rawState);
  return {
    pageHierarchy: normalizedState.pageHierarchy || {},
    blocksByPath: normalizedState.blocksByPath || {},
    pathAliases: normalizedState.pathAliases || {},
  };
}

function buildComparableAuthoringPageSnapshot(state, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return null;
  }
  const comparableState = state && typeof state === 'object'
    ? state
    : toComparableAuthoringState(state);
  return {
    page: comparableState.pageHierarchy?.[normalizedPath] || null,
    blocks: comparableState.blocksByPath?.[normalizedPath] || [],
    aliases: Object.fromEntries(
      Object.entries(comparableState.pathAliases || {}).filter(([fromPath, toPath]) => (
        String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath
      )),
    ),
  };
}

function compareComparableAuthoringPageSnapshot(leftComparableState, rightComparableState, pathname) {
  const leftSnapshot = buildComparableAuthoringPageSnapshot(leftComparableState, pathname);
  const rightSnapshot = buildComparableAuthoringPageSnapshot(rightComparableState, pathname);
  if (!leftSnapshot && !rightSnapshot) {
    return true;
  }
  return JSON.stringify(leftSnapshot) === JSON.stringify(rightSnapshot);
}

function compareAuthoringPageSnapshot(leftState, rightState, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return true;
  }
  return compareComparableAuthoringPageSnapshot(
    toComparableAuthoringState(leftState),
    toComparableAuthoringState(rightState),
    normalizedPath,
  );
}

function summarizeComparableAuthoringPageChanges(current, persisted, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return {
      changedBlockIds: [],
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
  }

  const currentBlocks = Array.isArray(current.blocksByPath?.[normalizedPath])
    ? normalizePageBlocksState(current.blocksByPath[normalizedPath])
    : [];
  const persistedBlocks = Array.isArray(persisted.blocksByPath?.[normalizedPath])
    ? normalizePageBlocksState(persisted.blocksByPath[normalizedPath])
    : [];
  const currentBlockIds = currentBlocks
    .map((block) => String(block?.id || '').trim())
    .filter(Boolean);
  const persistedBlockIds = persistedBlocks
    .map((block) => String(block?.id || '').trim())
    .filter(Boolean);
  const orderedBlockIds = [...new Set([...currentBlockIds, ...persistedBlockIds])];
  const currentBlockById = new Map(currentBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const persistedBlockById = new Map(persistedBlocks.map((block) => [String(block?.id || '').trim(), block]));
  const hasOrderChanges = JSON.stringify(currentBlockIds) !== JSON.stringify(persistedBlockIds);
  const changedBlockIds = orderedBlockIds.filter((blockId) => (
    JSON.stringify(currentBlockById.get(blockId) || null) !== JSON.stringify(persistedBlockById.get(blockId) || null)
  ));
  const currentAliases = Object.fromEntries(
    Object.entries(current.pathAliases || {}).filter(([fromPath, toPath]) => (
      String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath
    )),
  );
  const persistedAliases = Object.fromEntries(
    Object.entries(persisted.pathAliases || {}).filter(([fromPath, toPath]) => (
      String(fromPath || '').trim() === normalizedPath || String(toPath || '').trim() === normalizedPath
    )),
  );
  const hasPageMetaChanges = JSON.stringify({
    page: current.pageHierarchy?.[normalizedPath] || null,
    aliases: currentAliases,
  }) !== JSON.stringify({
    page: persisted.pageHierarchy?.[normalizedPath] || null,
    aliases: persistedAliases,
  });

  return {
    changedBlockIds,
    changedBlockCount: changedBlockIds.length,
    hasOrderChanges,
    hasPageMetaChanges,
    hasUnsavedChanges: Boolean(changedBlockIds.length || hasOrderChanges || hasPageMetaChanges),
  };
}

function summarizeAuthoringPageChanges(currentState, persistedState, pathname) {
  const normalizedPath = String(pathname || '').trim();
  if (!normalizedPath) {
    return {
      changedBlockIds: [],
      changedBlockCount: 0,
      hasOrderChanges: false,
      hasPageMetaChanges: false,
      hasUnsavedChanges: false,
    };
  }

  return summarizeComparableAuthoringPageChanges(
    toComparableAuthoringState(currentState),
    toComparableAuthoringState(persistedState),
    normalizedPath,
  );
}

function collectDirtyComparableAuthoringPaths(current, persisted) {
  const allPaths = new Set([
    ...Object.keys(current.pageHierarchy || {}),
    ...Object.keys(current.blocksByPath || {}),
    ...Object.keys(persisted.pageHierarchy || {}),
    ...Object.keys(persisted.blocksByPath || {}),
  ]);
  return [...allPaths].filter((pathname) => !compareComparableAuthoringPageSnapshot(current, persisted, pathname));
}

function collectDirtyAuthoringPaths(currentState, persistedState) {
  const current = toComparableAuthoringState(currentState);
  const persisted = toComparableAuthoringState(persistedState);
  return collectDirtyComparableAuthoringPaths(current, persisted);
}

function summarizePageWorkflowActivity(collaborationByPath, pathname, actor) {
  const normalizedPath = String(pathname || '').trim();
  const currentUserId = String(actor?.userId || '').trim();
  if (!normalizedPath || !currentUserId) {
    return {
      currentActorBlockCount: 0,
      otherActorBlockCount: 0,
      hasCurrentActorDraft: false,
      hasOtherActorDraft: false,
    };
  }

  const blocks = collaborationByPath?.[normalizedPath]?.blocks || {};
  let currentActorBlockCount = 0;
  let otherActorBlockCount = 0;

  Object.values(blocks).forEach((meta) => {
    const normalizedMeta = normalizeContentBlockMeta(meta);
    const currentActorOwnsBlock = (
      normalizedMeta.lockedBy?.userId === currentUserId
      || normalizedMeta.draftedBy?.userId === currentUserId
    );
    const otherActorOwnsBlock = (
      (normalizedMeta.lockedBy?.userId && normalizedMeta.lockedBy.userId !== currentUserId)
      || (normalizedMeta.draftedBy?.userId && normalizedMeta.draftedBy.userId !== currentUserId)
    );

    if (currentActorOwnsBlock) {
      currentActorBlockCount += 1;
    } else if (otherActorOwnsBlock) {
      otherActorBlockCount += 1;
    }
  });

  return {
    currentActorBlockCount,
    otherActorBlockCount,
    hasCurrentActorDraft: currentActorBlockCount > 0,
    hasOtherActorDraft: otherActorBlockCount > 0,
  };
}

export function ContentAdminProvider({ children, initialState = null }) {
  const initialBootstrapState = parseInitialContentAdminBootstrapState(initialState);
  const sharedAuthorityEnabled = isDevContentAuthorityEnabled();
  const [state, setState] = useState(initialBootstrapState.authoringState);
  const [publishedState, setPublishedState] = useState(initialBootstrapState.publishedState);
  const [devIdentity, setDevIdentity] = useState(readInitialDevIdentity);
  const [lastSharedSaveResult, setLastSharedSaveResult] = useState(null);
  const [lastSharedPublishResult, setLastSharedPublishResult] = useState(null);
  const [bufferedBlockSettingEdits, setBufferedBlockSettingEdits] = useState({});
  const [sharedSnapshotUpdatedAt, setSharedSnapshotUpdatedAt] = useState(initialBootstrapState.updatedAt);
  const [sharedSeedBaseline, setSharedSeedBaseline] = useState(initialBootstrapState.seedBaseline);
  const [sharedSyncState, setSharedSyncState] = useState({
    pendingMutationCount: 0,
    hasQueuedDraftSync: false,
    lastQueuedAt: 0,
    lastSettledAt: 0,
    lastAppliedAt: 0,
  });
  const stateRef = useRef(state);
  const hasPersistedNormalizedInitialStateRef = useRef(false);
  const bufferedBlockSettingEditsRef = useRef(bufferedBlockSettingEdits);
  const persistedSharedAuthoringStateRef = useRef(toComparableAuthoringState(initialBootstrapState.authoringState));
  const publishedSharedAuthoringStateRef = useRef(toComparableAuthoringState(initialBootstrapState.publishedState));
  const pendingSharedMutationCountRef = useRef(0);
  const pendingBlockDraftSyncEntriesRef = useRef(new Map());
  const bufferedBlockSettingCommitTimersRef = useRef(new Map());
  const externalDraftFlushHandlersRef = useRef(new Map());
  const externalDraftStatusHandlersRef = useRef(new Map());
  const latestSharedMutationIdRef = useRef(0);
  const latestSharedUpdatedAtRef = useRef(0);

  useEffect(() => {
    if (sharedAuthorityEnabled || hasPersistedNormalizedInitialStateRef.current) {
      return;
    }
    hasPersistedNormalizedInitialStateRef.current = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
    } catch {
      // ignore storage failures
    }
  }, [sharedAuthorityEnabled]);

  const refreshSharedSyncState = (patch = {}) => {
    setSharedSyncState((previous) => ({
      ...previous,
      pendingMutationCount: pendingSharedMutationCountRef.current,
      hasQueuedDraftSync: pendingBlockDraftSyncEntriesRef.current.size > 0 || bufferedBlockSettingCommitTimersRef.current.size > 0,
      ...patch,
    }));
  };

  const bumpPendingSharedMutationCount = (delta, patch = {}) => {
    pendingSharedMutationCountRef.current = Math.max(0, pendingSharedMutationCountRef.current + delta);
    refreshSharedSyncState(patch);
  };

  const updatePublishedSharedAuthoringState = (snapshot) => {
    const nextPublishedState = snapshot?.baseSnapshot || snapshot?.payload?.baseSnapshot || snapshot?.state || snapshot?.payload?.state;
    if (!nextPublishedState) {
      return false;
    }
    const normalizedPublishedState = normalizeStoredConfig(nextPublishedState);
    const nextComparablePublishedState = toComparableAuthoringState(normalizedPublishedState);
    const currentComparablePublishedState = publishedSharedAuthoringStateRef.current;
    const didChange = (
      collectDirtyComparableAuthoringPaths(currentComparablePublishedState, nextComparablePublishedState).length > 0
      || JSON.stringify(currentComparablePublishedState.pathAliases || {}) !== JSON.stringify(nextComparablePublishedState.pathAliases || {})
    );
    publishedSharedAuthoringStateRef.current = nextComparablePublishedState;
    if (didChange) {
      setPublishedState(normalizedPublishedState);
    }
    return didChange;
  };

  const applySharedSeedBaseline = (snapshot) => {
    if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, 'seedBaseline')) {
      return;
    }
    setSharedSeedBaseline(snapshot.seedBaseline || null);
  };

  const applySharedSnapshotState = (snapshot, options = {}) => {
    const mergeCollaborationOnlyWhenDirty = Boolean(options?.mergeCollaborationOnlyWhenDirty);
    applySharedSeedBaseline(snapshot);
    const nextState = snapshot?.state || snapshot?.payload?.state;
    if (!nextState) {
      return false;
    }
    updatePublishedSharedAuthoringState(snapshot);
    const nextUpdatedAt = Number(snapshot.updatedAt) || 0;
    latestSharedUpdatedAtRef.current = nextUpdatedAt;
    if (nextUpdatedAt) {
      setSharedSnapshotUpdatedAt(nextUpdatedAt);
      refreshSharedSyncState({ lastAppliedAt: nextUpdatedAt });
    }
    const normalizedSnapshotState = normalizeStoredConfig(nextState);
    const currentComparableAuthoringState = toComparableAuthoringState(stateRef.current);
    const persistedComparableAuthoringState = persistedSharedAuthoringStateRef.current;
    const hasDirtyAuthoringState = collectDirtyComparableAuthoringPaths(
      currentComparableAuthoringState,
      persistedComparableAuthoringState,
    ).length > 0;
    if (mergeCollaborationOnlyWhenDirty && hasDirtyAuthoringState) {
      const mergedState = mergeSharedCollaborationSnapshot(stateRef.current, normalizedSnapshotState);
      if (mergedState === stateRef.current) {
        return false;
      }
      stateRef.current = mergedState;
      setState(mergedState);
      return true;
    }
    const normalizedSnapshotComparableAuthoringState = toComparableAuthoringState(normalizedSnapshotState);
    const changedAuthoringPaths = collectDirtyComparableAuthoringPaths(
      currentComparableAuthoringState,
      normalizedSnapshotComparableAuthoringState,
    );
    const changedCollaborationPaths = collectChangedCollaborationPaths(stateRef.current, normalizedSnapshotState);
    persistedSharedAuthoringStateRef.current = normalizedSnapshotComparableAuthoringState;
    if (!changedAuthoringPaths.length && !changedCollaborationPaths.length) {
      return false;
    }
    const mergedState = mergeSharedAuthoringSnapshot(stateRef.current, normalizedSnapshotState, {
      authoringPaths: changedAuthoringPaths,
      collaborationPaths: changedCollaborationPaths,
    });
    if (mergedState === stateRef.current) {
      return false;
    }
    stateRef.current = mergedState;
    setState(mergedState);
    return true;
  };

  const clearPendingBlockDraftSyncTimers = () => {
    const pendingEntries = pendingBlockDraftSyncEntriesRef.current;
    pendingEntries.forEach((entry) => {
      if (typeof window !== 'undefined' && entry?.timeoutId) {
        window.clearTimeout(entry.timeoutId);
      }
    });
    pendingEntries.clear();
    refreshSharedSyncState(
      pendingSharedMutationCountRef.current > 0
        ? {}
        : { lastSettledAt: Date.now() },
    );
  };

  const updateBufferedBlockSettingDrafts = (updater) => {
    setBufferedBlockSettingEdits((previous) => {
      const nextValue = typeof updater === 'function' ? updater(previous) : updater;
      bufferedBlockSettingEditsRef.current = nextValue;
      return nextValue;
    });
  };

  const clearBufferedBlockSettingCommitTimer = (pathname, blockId) => {
    const timerKey = `${String(pathname || '').trim()}::${String(blockId || '').trim()}`;
    const timers = bufferedBlockSettingCommitTimersRef.current;
    const existingTimerId = timers.get(timerKey);
    if (typeof window !== 'undefined' && existingTimerId) {
      window.clearTimeout(existingTimerId);
    }
    timers.delete(timerKey);
  };

  const clearBufferedBlockSettingCommitTimers = () => {
    const timers = bufferedBlockSettingCommitTimersRef.current;
    timers.forEach((timerId) => {
      if (typeof window !== 'undefined' && timerId) {
        window.clearTimeout(timerId);
      }
    });
    timers.clear();
    refreshSharedSyncState(
      pendingSharedMutationCountRef.current > 0 || pendingBlockDraftSyncEntriesRef.current.size > 0
        ? {}
        : { lastSettledAt: Date.now() },
    );
  };

  const flushExternalDraftBuffers = () => {
    let didFlushAny = false;
    externalDraftFlushHandlersRef.current.forEach((flushHandler) => {
      if (typeof flushHandler !== 'function') {
        return;
      }
      try {
        if (flushHandler()) {
          didFlushAny = true;
        }
      } catch {
        // ignore local buffer flush failures so draft saves can still continue
      }
    });
    return didFlushAny;
  };

  const applySharedBlockDraftSnapshot = (snapshot, pathname) => {
    const nextState = snapshot?.state || snapshot?.payload?.state;
    const normalizedPath = String(pathname || '').trim();
    if (!nextState || !normalizedPath) {
      return false;
    }
    updatePublishedSharedAuthoringState(snapshot);

    const nextUpdatedAt = Number(snapshot.updatedAt) || 0;
    latestSharedUpdatedAtRef.current = nextUpdatedAt;
    if (nextUpdatedAt) {
      setSharedSnapshotUpdatedAt(nextUpdatedAt);
      refreshSharedSyncState({ lastAppliedAt: nextUpdatedAt });
    }

    const normalizedSnapshotState = normalizeStoredConfig(nextState);
    const currentComparableAuthoringState = toComparableAuthoringState(stateRef.current);
    const normalizedSnapshotComparableAuthoringState = toComparableAuthoringState(normalizedSnapshotState);
    persistedSharedAuthoringStateRef.current = {
      ...persistedSharedAuthoringStateRef.current,
      pageHierarchy: {
        ...persistedSharedAuthoringStateRef.current.pageHierarchy,
        [normalizedPath]: normalizedSnapshotComparableAuthoringState.pageHierarchy?.[normalizedPath] || null,
      },
      blocksByPath: {
        ...persistedSharedAuthoringStateRef.current.blocksByPath,
        [normalizedPath]: normalizedSnapshotComparableAuthoringState.blocksByPath?.[normalizedPath] || [],
      },
      pathAliases: {
        ...persistedSharedAuthoringStateRef.current.pathAliases,
        ...normalizedSnapshotComparableAuthoringState.pathAliases,
      },
    };
    const shouldApplyAuthoringPath = !compareComparableAuthoringPageSnapshot(
      currentComparableAuthoringState,
      normalizedSnapshotComparableAuthoringState,
      normalizedPath,
    );
    const shouldApplyCollaborationPath = collectChangedCollaborationPaths(stateRef.current, normalizedSnapshotState)
      .includes(normalizedPath);
    if (!shouldApplyAuthoringPath && !shouldApplyCollaborationPath) {
      return false;
    }
    const mergedState = mergeSharedAuthoringSnapshot(stateRef.current, normalizedSnapshotState, {
      authoringPaths: shouldApplyAuthoringPath ? [normalizedPath] : [],
      collaborationPaths: shouldApplyCollaborationPath ? [normalizedPath] : [],
    });
    if (mergedState === stateRef.current) {
      return false;
    }
    stateRef.current = mergedState;
    setState(mergedState);
    return true;
  };

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    bufferedBlockSettingEditsRef.current = bufferedBlockSettingEdits;
  }, [bufferedBlockSettingEdits]);

  useEffect(() => () => {
    clearPendingBlockDraftSyncTimers();
    clearBufferedBlockSettingCommitTimers();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event) => {
      if (!sharedAuthorityEnabled && event.key === STORAGE_KEY) {
        if (!event.newValue) {
          setState(normalizeStoredConfig(null));
          return;
        }

        try {
          setState(normalizeStoredConfig(JSON.parse(event.newValue)));
        } catch {
          setState(normalizeStoredConfig(null));
        }
        return;
      }

      if (event.key === DEV_IDENTITY_STORAGE_KEY) {
        if (!event.newValue) {
          setDevIdentity(readInitialDevIdentity());
          return;
        }

        try {
          setDevIdentity(normalizeDevIdentity(JSON.parse(event.newValue)) || readInitialDevIdentity());
        } catch {
          setDevIdentity(readInitialDevIdentity());
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [sharedAuthorityEnabled]);

  useEffect(() => {
    if (!sharedAuthorityEnabled) {
      return undefined;
    }

    const shouldSchedulePolling = import.meta.env.MODE !== 'test';
    let cancelled = false;
    let timeoutId = null;
    const seedState = normalizeStoredConfig(null);
    const currentActor = toDevIdentitySummary(devIdentity);
    const getPollingDelay = () => {
      if (typeof document === 'undefined') {
        return getSharedContentPollDelayForActivity(false, hasActiveSharedEditing(stateRef.current, currentActor));
      }
      return getSharedContentPollDelayForActivity(
        document.hidden,
        hasActiveSharedEditing(stateRef.current, currentActor),
      );
    };

    const syncSharedState = async ({ allowBootstrap = false, mergeCollaborationWhenDirty = true } = {}) => {
      if (pendingSharedMutationCountRef.current > 0 && !allowBootstrap) {
        return;
      }

      try {
        let snapshot = await fetchSharedContentSnapshot();
        if (!snapshot?.initialized && allowBootstrap) {
          snapshot = await initializeSharedContentFromSeed(seedState, currentActor);
        }
        if (!snapshot?.state || cancelled) {
          return;
        }
        const nextUpdatedAt = Number(snapshot.updatedAt) || 0;
        if (!allowBootstrap && latestSharedUpdatedAtRef.current && nextUpdatedAt <= latestSharedUpdatedAtRef.current) {
          return;
        }
        applySharedSnapshotState(snapshot, {
          mergeCollaborationOnlyWhenDirty: mergeCollaborationWhenDirty,
        });
      } catch {
        // Keep the local seed/optimistic state if the dev authority is unavailable.
      }
    };

    const scheduleNextSync = () => {
      if (cancelled) {
        return;
      }
      timeoutId = window.setTimeout(async () => {
        await syncSharedState();
        scheduleNextSync();
      }, getPollingDelay());
    };

    const handleVisibilityChange = () => {
      if (cancelled) {
        return;
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (typeof document === 'undefined' || !document.hidden) {
        syncSharedState();
      }
      scheduleNextSync();
    };

    if (!shouldSchedulePolling) {
      syncSharedState({ allowBootstrap: true });
      return () => {
        cancelled = true;
      };
    }

    syncSharedState({ allowBootstrap: true }).finally(scheduleNextSync);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [sharedAuthorityEnabled, devIdentity]);

  const value = useMemo(() => {
    const authoringDisplayState = sharedAuthorityEnabled
      ? applyBufferedBlockSettingEditsToState(state, bufferedBlockSettingEdits)
      : state;
    const {
      pageHierarchy: authoringPageHierarchy,
      blocksByPath: authoringBlocksByPath,
      pathAliases: authoringPathAliases,
      collaborationByPath,
    } = authoringDisplayState;
    const {
      pageHierarchy,
      blocksByPath,
      pathAliases,
    } = publishedState;
    const availableBlockTemplates = getAllBlockTemplateBlueprints();
    const blockTemplateById = new Map(
      availableBlockTemplates.map((template) => [buildBlockTemplateCreateId(template), template]),
    );
    const currentActor = toDevIdentitySummary(devIdentity);
    const authoringStateForDirtyChecks = sharedAuthorityEnabled
      ? applyBufferedBlockSettingEditsToState(stateRef.current, bufferedBlockSettingEditsRef.current)
      : stateRef.current;
    const currentComparableAuthoringState = toComparableAuthoringState(authoringStateForDirtyChecks);
    const persistedComparableAuthoringState = persistedSharedAuthoringStateRef.current;
    const publishedComparableAuthoringState = publishedSharedAuthoringStateRef.current;
    const dirtyPaths = sharedAuthorityEnabled
      ? collectDirtyComparableAuthoringPaths(currentComparableAuthoringState, persistedComparableAuthoringState)
      : [];
    const dirtyPathSet = new Set(dirtyPaths);

    const updateCollaborationForPath = (prevState, pathname, updater) => {
      const prevCollaborationByPath = prevState.collaborationByPath || {};
      const previousEntry = prevCollaborationByPath[pathname] || { blocks: {}, history: [] };
      const nextEntry = updater(previousEntry);
      if (!nextEntry || nextEntry === previousEntry) {
        return prevCollaborationByPath;
      }
      return {
        ...prevCollaborationByPath,
        [pathname]: nextEntry,
      };
    };

    const claimEditingEntry = (prevState, pathname, blockId) => {
      const prevCollaborationByPath = prevState.collaborationByPath || {};
      const releasedLocks = releaseUserLocks(prevCollaborationByPath, currentActor?.userId, {
        keepPath: pathname,
        keepBlockId: blockId,
      });
      const nextEntry = (releasedLocks[pathname] && typeof releasedLocks[pathname] === 'object')
        ? releasedLocks[pathname]
        : (prevCollaborationByPath[pathname] || { blocks: {}, history: [] });
      return {
        releasedLocks,
        nextEntry,
        nextBlocks: {
          ...(nextEntry.blocks || {}),
          [blockId]: buildEditingBlockMeta(nextEntry.blocks?.[blockId], currentActor),
        },
      };
    };

    const buildEditingCollaborationByPath = (prevState, pathname, blockId, historyEntry) => {
      const { releasedLocks, nextEntry, nextBlocks } = claimEditingEntry(prevState, pathname, blockId);
      return {
        ...releasedLocks,
        [pathname]: {
          ...nextEntry,
          blocks: nextBlocks,
          history: appendHistoryEntry(nextEntry.history, historyEntry),
        },
      };
    };

    const saveState = (nextStateOrUpdater) => {
      const previousState = stateRef.current;
      const computedState = typeof nextStateOrUpdater === 'function'
        ? nextStateOrUpdater(previousState)
        : nextStateOrUpdater;
      stateRef.current = computedState;
      setState(computedState);

      if (!computedState) {
        return;
      }
      if (!sharedAuthorityEnabled) {
        publishedSharedAuthoringStateRef.current = toComparableAuthoringState(computedState);
        setPublishedState(computedState);
      }
      if (!sharedAuthorityEnabled) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(computedState));
        } catch {
          // ignore storage failures
        }
      }
    };

    const setOptimisticState = (nextStateOrUpdater) => {
    const nextState = typeof nextStateOrUpdater === 'function'
      ? nextStateOrUpdater(stateRef.current)
      : nextStateOrUpdater;
    stateRef.current = nextState;
    setState(nextState);
    if (!sharedAuthorityEnabled && nextState) {
      publishedSharedAuthoringStateRef.current = toComparableAuthoringState(nextState);
      setPublishedState(nextState);
    }
  };

    const applyBlockSettingsPatchToState = (prevState, pathname, blockId, settingsPatch) => {
      let didUpdate = false;
      const prevBlocksByPath = prevState.blocksByPath || {};
      const pageBlocks = prevBlocksByPath[pathname] || [];
      const nextBlocks = pageBlocks.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        const patchEntries = Object.entries(settingsPatch || {});
        if (!patchEntries.length) {
          return block;
        }

        let nextSettings = block.settings || {};
        let didChangeBlock = false;
        patchEntries.forEach(([settingKey, settingValue]) => {
          if (blockSettingsValueEquals(nextSettings?.[settingKey], settingValue)) {
            return;
          }
          if (!didChangeBlock) {
            nextSettings = {
              ...(block.settings || {}),
            };
            didChangeBlock = true;
          }
          nextSettings[settingKey] = settingValue;
        });

        if (!didChangeBlock) {
          return block;
        }

        didUpdate = true;
        const nextBlock = {
          ...block,
          settings: nextSettings,
        };
        if (
          String(nextBlock.id || '').trim() === 'hero'
          && String(nextBlock.mode || '').trim().toLowerCase() === 'dynamic'
        ) {
          return {
            ...nextBlock,
            settings: normalizeDynamicHeroSettings(pathname, nextBlock.settings),
          };
        }
        return nextBlock;
      });

      if (!didUpdate) {
        return {
          didUpdate: false,
          nextState: prevState,
        };
      }

      const nextCollaborationByPath = buildEditingCollaborationByPath(
        prevState,
        pathname,
        blockId,
        buildHistoryEntry({
          action: 'block-setting-updated',
          blockId,
          actor: currentActor,
          details: Object.keys(settingsPatch || {}).join(', '),
        }),
      );

      return {
        didUpdate: true,
        nextState: {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [pathname]: normalizePageBlocksState(nextBlocks),
          },
          collaborationByPath: nextCollaborationByPath,
        },
      };
    };

    const commitBlockSettingsPatch = (pathname, blockId, settingsPatch) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId || !settingsPatch || typeof settingsPatch !== 'object') {
        return false;
      }

      let didUpdate = false;
      const shouldSyncLock = Boolean(
        sharedAuthorityEnabled
        && currentActor
        && getBlockCollaboration(normalizedPath, normalizedBlockId).lockedBy?.userId !== currentActor.userId
      );

      saveState((prevState) => {
        const applied = applyBlockSettingsPatchToState(prevState, normalizedPath, normalizedBlockId, settingsPatch);
        didUpdate = applied.didUpdate;
        return applied.nextState;
      });

      if (!didUpdate) {
        return false;
      }
      if (shouldSyncLock) {
        syncSharedSnapshot(
          () => acquireSharedBlockLock(normalizedPath, normalizedBlockId, currentActor),
          { mergeCollaborationOnlyWhenDirty: true },
        );
      }
      scheduleSharedBlockDraftSync(normalizedPath, normalizedBlockId, {
        delayMs: getSharedBlockDraftSyncDelay('', undefined, settingsPatch),
      });
      return true;
    };

    const claimBufferedBlockEdit = (pathname, blockId) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId) {
        return false;
      }
      const didClaimLock = ensureLocalEditingLock(normalizedPath, normalizedBlockId);
      if (
        didClaimLock
        && sharedAuthorityEnabled
        && currentActor
        && getBlockCollaboration(normalizedPath, normalizedBlockId).lockedBy?.userId !== currentActor.userId
      ) {
        syncSharedSnapshot(
          () => acquireSharedBlockLock(normalizedPath, normalizedBlockId, currentActor),
          { mergeCollaborationOnlyWhenDirty: true },
        );
      }
      return didClaimLock;
    };

    const ensureLocalEditingLock = (pathname, blockId) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!sharedAuthorityEnabled || !currentActor || !normalizedPath || !normalizedBlockId) {
        return false;
      }

      let didClaimLock = false;
      setOptimisticState((prevState) => {
        const currentLockOwnerId = String(
          prevState?.collaborationByPath?.[normalizedPath]?.blocks?.[normalizedBlockId]?.lockedBy?.userId || '',
        ).trim();
        if (currentLockOwnerId === currentActor.userId) {
          return prevState;
        }
        didClaimLock = true;
        return {
          ...prevState,
          collaborationByPath: buildEditingCollaborationByPath(prevState, normalizedPath, normalizedBlockId, null),
        };
      });
      return didClaimLock;
    };

    const flushBufferedBlockSettings = (pathname, blockId) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId) {
        return false;
      }

      const pendingPatch = bufferedBlockSettingEditsRef.current?.[normalizedPath]?.[normalizedBlockId];
      if (!pendingPatch || typeof pendingPatch !== 'object' || !Object.keys(pendingPatch).length) {
        clearBufferedBlockSettingCommitTimer(normalizedPath, normalizedBlockId);
        return false;
      }

      clearBufferedBlockSettingCommitTimer(normalizedPath, normalizedBlockId);
      const didCommit = commitBlockSettingsPatch(normalizedPath, normalizedBlockId, pendingPatch);

      updateBufferedBlockSettingDrafts((previous) => {
        const previousPathEntry = previous?.[normalizedPath];
        if (!previousPathEntry || !previousPathEntry[normalizedBlockId]) {
          return previous;
        }
        const nextPathEntry = {
          ...previousPathEntry,
        };
        delete nextPathEntry[normalizedBlockId];
        if (!Object.keys(nextPathEntry).length) {
          const nextValue = {
            ...previous,
          };
          delete nextValue[normalizedPath];
          return nextValue;
        }
        return {
          ...previous,
          [normalizedPath]: nextPathEntry,
        };
      });

      refreshSharedSyncState({ lastSettledAt: Date.now() });
      return didCommit;
    };

    const flushAllBufferedBlockSettings = () => {
      const pendingEntries = bufferedBlockSettingEditsRef.current;
      if (!pendingEntries || typeof pendingEntries !== 'object') {
        return false;
      }
      let didCommitAny = false;
      Object.entries(pendingEntries).forEach(([pathname, blockEntries]) => {
        Object.keys(blockEntries || {}).forEach((blockId) => {
          if (flushBufferedBlockSettings(pathname, blockId)) {
            didCommitAny = true;
          }
        });
      });
      return didCommitAny;
    };

    const queueBufferedBlockSettingCommit = (pathname, blockId, settingKey, settingValue) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId || typeof window === 'undefined') {
        return;
      }

      updateBufferedBlockSettingDrafts((previous) => {
        const previousPathEntry = previous?.[normalizedPath] || {};
        const previousBlockEntry = previousPathEntry?.[normalizedBlockId] || {};
        return {
          ...previous,
          [normalizedPath]: {
            ...previousPathEntry,
            [normalizedBlockId]: {
              ...previousBlockEntry,
              [settingKey]: settingValue,
            },
          },
        };
      });

      clearBufferedBlockSettingCommitTimer(normalizedPath, normalizedBlockId);
      const timerKey = `${normalizedPath}::${normalizedBlockId}`;
      const timerId = window.setTimeout(() => {
        flushBufferedBlockSettings(normalizedPath, normalizedBlockId);
      }, LOCAL_BUFFERED_BLOCK_SETTING_COMMIT_DELAY_MS);
      bufferedBlockSettingCommitTimersRef.current.set(timerKey, timerId);
      refreshSharedSyncState({ lastQueuedAt: Date.now() });
    };

    const syncSharedSnapshot = (operation, options = {}) => {
      const mergeCollaborationOnlyWhenDirty = Boolean(options?.mergeCollaborationOnlyWhenDirty);
      if (!sharedAuthorityEnabled) {
        return;
      }
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      Promise.resolve()
        .then(operation)
        .then((snapshot) => {
          const nextState = snapshot?.state || snapshot?.payload?.state;
          if (!nextState || latestSharedMutationIdRef.current !== mutationId) {
            return;
          }
          applySharedSnapshotState(snapshot, { mergeCollaborationOnlyWhenDirty });
        })
        .catch(async () => {
          try {
            const snapshot = await fetchSharedContentSnapshot();
            if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
              applySharedSnapshotState(snapshot, { mergeCollaborationOnlyWhenDirty });
            }
          } catch {
            // ignore follow-up sync failures
          }
        })
        .finally(() => {
          bumpPendingSharedMutationCount(
            -1,
            pendingBlockDraftSyncEntriesRef.current.size > 0
              ? {}
              : { lastSettledAt: Date.now() },
          );
        });
    };

    const flushSharedBlockDraftSync = (syncKey, normalizedPath, normalizedBlockId) => {
      const pendingEntries = pendingBlockDraftSyncEntriesRef.current;
      const pendingEntry = pendingEntries.get(syncKey);
      if (!pendingEntry || pendingEntry.inFlight || !pendingEntry.queued) {
        return;
      }

      const latestBlocks = Array.isArray(stateRef.current.blocksByPath?.[normalizedPath])
        ? stateRef.current.blocksByPath[normalizedPath]
        : [];
      const latestBlock = latestBlocks.find((block) => String(block?.id || '').trim() === normalizedBlockId) || null;
      if (!latestBlock) {
        pendingEntries.delete(syncKey);
        refreshSharedSyncState(
          pendingSharedMutationCountRef.current > 0
            ? {}
            : { lastSettledAt: Date.now() },
        );
        return;
      }

      const latestSerializedBlock = JSON.stringify(latestBlock);
      if (latestSerializedBlock === pendingEntry.lastSyncedSerializedBlock) {
        pendingEntry.queued = false;
        if (!pendingEntry.timeoutId && !pendingEntry.inFlight) {
          pendingEntries.delete(syncKey);
        }
        refreshSharedSyncState(
          pendingSharedMutationCountRef.current > 0
            ? {}
            : { lastSettledAt: Date.now() },
        );
        return;
      }

      pendingEntry.timeoutId = null;
      pendingEntry.queued = false;
      pendingEntry.inFlight = true;
      pendingEntry.lastQueuedSerializedBlock = latestSerializedBlock;
      pendingEntries.set(syncKey, pendingEntry);

      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });

      Promise.resolve()
        .then(() => syncSharedBlockDraft(normalizedPath, normalizedBlockId, latestBlock, currentActor))
        .then((snapshot) => {
          if (snapshot?.state) {
            pendingEntry.lastSyncedSerializedBlock = latestSerializedBlock;
            if (latestSharedMutationIdRef.current === mutationId) {
              applySharedBlockDraftSnapshot(snapshot, normalizedPath);
            }
          }
        })
        .catch(async () => {
          try {
            const snapshot = await fetchSharedContentSnapshot();
            if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
              applySharedSnapshotState(snapshot, { mergeCollaborationOnlyWhenDirty: true });
            }
          } catch {
            // ignore follow-up sync failures
          }
        })
        .finally(() => {
          pendingEntry.inFlight = false;
          bumpPendingSharedMutationCount(-1);
          const currentBlocks = Array.isArray(stateRef.current.blocksByPath?.[normalizedPath])
            ? stateRef.current.blocksByPath[normalizedPath]
            : [];
          const currentBlock = currentBlocks.find((block) => String(block?.id || '').trim() === normalizedBlockId) || null;
          const currentSerializedBlock = currentBlock ? JSON.stringify(currentBlock) : '';
          if (
            pendingEntry.queued
            || (currentSerializedBlock && currentSerializedBlock !== pendingEntry.lastSyncedSerializedBlock)
          ) {
            pendingEntry.queued = true;
            if (typeof window !== 'undefined') {
              pendingEntry.timeoutId = window.setTimeout(() => {
                flushSharedBlockDraftSync(syncKey, normalizedPath, normalizedBlockId);
              }, pendingEntry.delayMs);
            }
            pendingEntries.set(syncKey, pendingEntry);
            refreshSharedSyncState();
            return;
          }
          pendingEntries.delete(syncKey);
          refreshSharedSyncState({ lastSettledAt: Date.now() });
        });
    };

    const scheduleSharedBlockDraftSync = (pathname, blockId, options = {}) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!sharedAuthorityEnabled || !currentActor || !normalizedPath || !normalizedBlockId || typeof window === 'undefined') {
        return;
      }

      const syncKey = `${normalizedPath}::${normalizedBlockId}`;
      const delayMs = Math.max(
        SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS,
        Number(options?.delayMs) || SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS,
      );
      const pendingEntries = pendingBlockDraftSyncEntriesRef.current;
      const pendingEntry = pendingEntries.get(syncKey) || {
        timeoutId: null,
        inFlight: false,
        queued: false,
        delayMs,
        lastSyncedSerializedBlock: '',
        lastQueuedSerializedBlock: '',
      };
      pendingEntry.delayMs = delayMs;
      pendingEntry.queued = true;

      if (pendingEntry.timeoutId) {
        window.clearTimeout(pendingEntry.timeoutId);
        pendingEntry.timeoutId = null;
      }

      pendingEntry.timeoutId = window.setTimeout(() => {
        flushSharedBlockDraftSync(syncKey, normalizedPath, normalizedBlockId);
      }, delayMs);
      pendingEntries.set(syncKey, pendingEntry);
      refreshSharedSyncState({ lastQueuedAt: Date.now() });
    };

    const updatePageHierarchy = (pathname, patch) => {
      saveState((prevState) => {
        const prevHierarchy = prevState.pageHierarchy || {};
        if (!prevHierarchy[pathname]) {
          return prevState;
        }

        const nextPage = {
          ...prevHierarchy[pathname],
          ...patch,
        };

        const requestedParent = Object.prototype.hasOwnProperty.call(patch, 'parentPath')
          ? patch.parentPath
          : nextPage.parentPath;
        const normalizedParent = requestedParent || null;

        if (!isValidParent(pathname, normalizedParent, prevHierarchy)) {
          return prevState;
        }

        nextPage.parentPath = normalizedParent;
        const nextCollaborationByPath = updateCollaborationForPath(prevState, pathname, (entry) => ({
          ...entry,
          history: appendHistoryEntry(entry.history, buildHistoryEntry({
            action: 'page-updated',
            actor: currentActor,
            details: Object.keys(patch || {}).join(', '),
          })),
        }));

        return {
          ...prevState,
          pageHierarchy: {
            ...prevHierarchy,
            [pathname]: nextPage,
          },
          collaborationByPath: nextCollaborationByPath,
        };
      });
    };

    const renamePagePath = (pathname, nextPathRaw) => {
      const currentPath = normalizeManagedPathInput(pathname);
      const nextPath = normalizeManagedPathInput(nextPathRaw);
      if (!currentPath || !pageHierarchy[currentPath]) {
        return { ok: false, error: 'Selected page was not found.' };
      }
      if (!nextPath) {
        return { ok: false, error: 'Route cannot be empty.' };
      }
      if (nextPath === currentPath) {
        return { ok: true, path: currentPath };
      }
      if (nextPath.startsWith('/admin/')) {
        return { ok: false, error: 'Admin routes are reserved.' };
      }
      if (nextPath === '/search') {
        return { ok: false, error: 'Search route is reserved.' };
      }
      if (nextPath === '/') {
        return { ok: false, error: 'Home route cannot be reassigned here.' };
      }
      if (pageHierarchy[nextPath]) {
        return { ok: false, error: 'That route already exists.' };
      }

      saveState((prevState) => {
        const prevHierarchy = prevState.pageHierarchy || {};
        const prevBlocks = prevState.blocksByPath || {};
        const prevAliases = prevState.pathAliases || {};
        const prevCollaboration = prevState.collaborationByPath || {};
        const movingPage = prevHierarchy[currentPath];
        if (!movingPage || prevHierarchy[nextPath]) {
          return prevState;
        }

        const nextHierarchy = { ...prevHierarchy };
        delete nextHierarchy[currentPath];
        nextHierarchy[nextPath] = {
          ...movingPage,
          path: nextPath,
          routeKey: String(movingPage.routeKey || currentPath),
          linkRef: String(movingPage.linkRef || currentPath),
        };

        Object.keys(nextHierarchy).forEach((pathKey) => {
          if (nextHierarchy[pathKey]?.parentPath === currentPath) {
            nextHierarchy[pathKey] = {
              ...nextHierarchy[pathKey],
              parentPath: nextPath,
            };
          }
        });

        const nextBlocks = { ...prevBlocks };
        if (Object.prototype.hasOwnProperty.call(nextBlocks, currentPath)) {
          nextBlocks[nextPath] = nextBlocks[currentPath];
          delete nextBlocks[currentPath];
        }

        const nextAliasesDraft = { ...prevAliases };
        Object.keys(nextAliasesDraft).forEach((from) => {
          if (normalizeManagedPathInput(nextAliasesDraft[from]) === currentPath) {
            nextAliasesDraft[from] = nextPath;
          }
        });
        nextAliasesDraft[currentPath] = nextPath;
        delete nextAliasesDraft[nextPath];
        const nextAliases = normalizePathAliases(nextAliasesDraft, nextHierarchy);
        const nextCollaboration = { ...prevCollaboration };
        const movingCollaboration = nextCollaboration[currentPath];
        if (movingCollaboration) {
          delete nextCollaboration[currentPath];
          nextCollaboration[nextPath] = {
            ...movingCollaboration,
            history: appendHistoryEntry(movingCollaboration.history, buildHistoryEntry({
              action: 'page-renamed',
              actor: currentActor,
              details: `${currentPath} -> ${nextPath}`,
            })),
          };
        } else {
          nextCollaboration[nextPath] = {
            blocks: {},
            history: appendHistoryEntry([], buildHistoryEntry({
              action: 'page-renamed',
              actor: currentActor,
              details: `${currentPath} -> ${nextPath}`,
            })),
          };
        }

        return {
          ...prevState,
          pageHierarchy: nextHierarchy,
          blocksByPath: nextBlocks,
          pathAliases: nextAliases,
          collaborationByPath: nextCollaboration,
        };
      });

      return { ok: true, path: nextPath };
    };

    const updateBlock = (pathname, blockId, patch) => {
      let didUpdate = false;
      const shouldSyncLock = Boolean(
        sharedAuthorityEnabled
        && currentActor
        && getBlockCollaboration(pathname, blockId).lockedBy?.userId !== currentActor.userId
      );
      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[pathname] || [];
        const nextBlocks = pageBlocks.map((block) => {
          if (block.id !== blockId) {
            return block;
          }

          const nextMode = Object.prototype.hasOwnProperty.call(patch || {}, 'mode')
            ? String(patch.mode || '').trim().toLowerCase()
            : '';
          const currentMode = String(block.mode || '').trim().toLowerCase();
          const wantsModeSwitch = Boolean(nextMode) && nextMode !== currentMode;

          if (!wantsModeSwitch) {
            const nextBlock = { ...block, ...patch };
            if (blockSnapshotEquals(block, nextBlock)) {
              return block;
            }
            didUpdate = true;
            if (
              String(nextBlock.id || '').trim() === 'hero'
              && String(nextBlock.mode || '').trim().toLowerCase() === 'dynamic'
            ) {
              return {
                ...nextBlock,
                settings: normalizeDynamicHeroSettings(pathname, nextBlock.settings),
              };
            }
            return nextBlock;
          }

          const modeVariant = getModeTemplateVariant({
            pathname,
            blockId: block.id,
            blockKind: block.kind,
            mode: nextMode,
          });

          if (!modeVariant) {
            return { ...block, ...patch, mode: nextMode };
          }

          const nextBlock = {
            ...modeVariant,
            ...block,
            ...patch,
            id: block.id,
            mode: nextMode,
            kind: modeVariant.kind || block.kind,
            settings: {
              ...(modeVariant.settings || {}),
              ...(block.settings || {}),
              ...(patch?.settings || {}),
            },
            editableFields: Array.isArray(modeVariant.editableFields) ? modeVariant.editableFields : [],
          };
          if (blockSnapshotEquals(block, nextBlock)) {
            return block;
          }
          didUpdate = true;
          if (
            String(nextBlock.id || '').trim() === 'hero'
            && String(nextBlock.mode || '').trim().toLowerCase() === 'dynamic'
          ) {
            return {
              ...nextBlock,
              settings: normalizeDynamicHeroSettings(pathname, nextBlock.settings),
            };
          }
          return nextBlock;
        });
        if (!didUpdate) {
          return prevState;
        }
        const nextCollaborationByPath = buildEditingCollaborationByPath(
          prevState,
          pathname,
          blockId,
          buildHistoryEntry({
            action: 'block-updated',
            blockId,
            actor: currentActor,
            details: Object.keys(patch || {}).join(', '),
          }),
        );

        return {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [pathname]: normalizePageBlocksState(nextBlocks),
          },
          collaborationByPath: nextCollaborationByPath,
        };
      });
      if (!didUpdate) {
        return;
      }
      if (shouldSyncLock) {
        syncSharedSnapshot(
          () => acquireSharedBlockLock(pathname, blockId, currentActor),
          { mergeCollaborationOnlyWhenDirty: true },
        );
      }
      scheduleSharedBlockDraftSync(pathname, blockId, {
        delayMs: getSharedBlockDraftSyncDelay('', undefined, patch),
      });
    };

    const updateBlockSetting = (pathname, blockId, settingKey, settingValue) => {
      if (sharedAuthorityEnabled && shouldBufferLocalBlockSetting(settingKey, settingValue)) {
        const shouldSyncLock = Boolean(
          currentActor
          && getBlockCollaboration(pathname, blockId).lockedBy?.userId !== currentActor.userId
        );
        ensureLocalEditingLock(pathname, blockId);
        if (shouldSyncLock) {
          syncSharedSnapshot(
            () => acquireSharedBlockLock(pathname, blockId, currentActor),
            { mergeCollaborationOnlyWhenDirty: true },
          );
        }
        queueBufferedBlockSettingCommit(pathname, blockId, settingKey, settingValue);
        return;
      }

      commitBlockSettingsPatch(pathname, blockId, {
        [settingKey]: settingValue,
      });
    };

    const moveBlock = (pathname, blockId, direction) => {
      const shouldSyncLock = Boolean(
        sharedAuthorityEnabled
        && currentActor
        && getBlockCollaboration(pathname, blockId).lockedBy?.userId !== currentActor.userId
      );
      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[pathname] || [];
        const fromIndex = pageBlocks.findIndex((block) => block.id === blockId);
        if (fromIndex < 0) {
          return prevState;
        }

        const offset = direction === 'up' ? -1 : 1;
        const toIndex = fromIndex + offset;
        if (toIndex < 0 || toIndex >= pageBlocks.length) {
          return prevState;
        }

        const nextBlocks = [...pageBlocks];
        const [moved] = nextBlocks.splice(fromIndex, 1);
        nextBlocks.splice(toIndex, 0, moved);
        const nextCollaborationByPath = buildEditingCollaborationByPath(
          prevState,
          pathname,
          blockId,
          buildHistoryEntry({
            action: 'block-moved',
            blockId,
            actor: currentActor,
            details: direction,
          }),
        );

        return {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [pathname]: normalizePageBlocksState(nextBlocks),
          },
          collaborationByPath: nextCollaborationByPath,
        };
      });
      if (shouldSyncLock) {
        syncSharedSnapshot(
          () => acquireSharedBlockLock(pathname, blockId, currentActor),
          { mergeCollaborationOnlyWhenDirty: true },
        );
      }
    };

    const moveBlockToIndex = (pathname, blockId, toIndexRaw) => {
      const shouldSyncLock = Boolean(
        sharedAuthorityEnabled
        && currentActor
        && getBlockCollaboration(pathname, blockId).lockedBy?.userId !== currentActor.userId
      );
      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[pathname] || [];
        const fromIndex = pageBlocks.findIndex((block) => block.id === blockId);
        if (fromIndex < 0) {
          return prevState;
        }

        const toIndexParsed = Number(toIndexRaw);
        if (!Number.isFinite(toIndexParsed)) {
          return prevState;
        }
        const toIndex = Math.max(0, Math.min(pageBlocks.length - 1, Math.round(toIndexParsed)));
        if (toIndex === fromIndex) {
          return prevState;
        }

        const nextBlocks = [...pageBlocks];
        const [moved] = nextBlocks.splice(fromIndex, 1);
        nextBlocks.splice(toIndex, 0, moved);
        const nextCollaborationByPath = buildEditingCollaborationByPath(
          prevState,
          pathname,
          blockId,
          buildHistoryEntry({
            action: 'block-moved',
            blockId,
            actor: currentActor,
            details: `index:${toIndex}`,
          }),
        );

        return {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [pathname]: normalizePageBlocksState(nextBlocks),
          },
          collaborationByPath: nextCollaborationByPath,
        };
      });
      if (shouldSyncLock) {
        syncSharedSnapshot(
          () => acquireSharedBlockLock(pathname, blockId, currentActor),
          { mergeCollaborationOnlyWhenDirty: true },
        );
      }
    };

    const addBlock = (pathname, templateId, insertIndex) => {
      const template = blockTemplateById.get(String(templateId || '').trim());
      if (!template) {
        return;
      }

      let createdBlockId = '';
      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[pathname] || [];
        const nextBlock = {
          ...template,
          id: toUniqueBlockId(template.templateId || template.id, pageBlocks),
          name: normalizeBlockDisplayName(template.name, template.mode, template.name, template.kind),
          settings: JSON.parse(JSON.stringify(template.settings || {})),
          editableFields: JSON.parse(JSON.stringify(Array.isArray(template.editableFields) ? template.editableFields : [])),
        };
        createdBlockId = nextBlock.id;
        const nextBlocks = [...pageBlocks];
        const targetIndex = Number.isInteger(insertIndex)
          ? Math.max(0, Math.min(pageBlocks.length, insertIndex))
          : pageBlocks.length;
        nextBlocks.splice(targetIndex, 0, nextBlock);
        const nextCollaborationByPath = buildEditingCollaborationByPath(
          prevState,
          pathname,
          nextBlock.id,
          buildHistoryEntry({
            action: 'block-added',
            blockId: nextBlock.id,
            actor: currentActor,
            details: nextBlock.kind,
          }),
        );

        return {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [pathname]: normalizePageBlocksState(nextBlocks),
          },
          collaborationByPath: nextCollaborationByPath,
        };
      });
      if (sharedAuthorityEnabled && currentActor && createdBlockId) {
        syncSharedSnapshot(
          () => acquireSharedBlockLock(pathname, createdBlockId, currentActor),
          { mergeCollaborationOnlyWhenDirty: true },
        );
      }
    };

    const removeBlock = (pathname, blockId) => {
      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[pathname] || [];
        const nextBlocks = pageBlocks.filter((block) => block.id !== blockId);
        if (nextBlocks.length === pageBlocks.length) {
          return prevState;
        }
        const nextCollaborationByPath = updateCollaborationForPath(prevState, pathname, (entry) => {
          const nextBlocksMeta = { ...(entry.blocks || {}) };
          delete nextBlocksMeta[blockId];
          return {
            ...entry,
            blocks: nextBlocksMeta,
            history: appendHistoryEntry(entry.history, buildHistoryEntry({
              action: 'block-removed',
              blockId,
              actor: currentActor,
            })),
          };
        });

        return {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [pathname]: normalizePageBlocksState(nextBlocks),
          },
          collaborationByPath: nextCollaborationByPath,
        };
      });
    };

    const renameDevIdentity = (nextDisplayName) => {
      const nextIdentity = renameStoredDevIdentity(nextDisplayName);
      if (nextIdentity) {
        setDevIdentity(nextIdentity);
      }
      return nextIdentity;
    };

    const getBlockCollaboration = (pathname, blockId) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId) {
        return normalizeContentBlockMeta(null);
      }
      return normalizeContentBlockMeta(collaborationByPath?.[normalizedPath]?.blocks?.[normalizedBlockId]);
    };

    const getPageHistory = (pathname) => {
      const normalizedPath = String(pathname || '').trim();
      if (!normalizedPath) {
        return [];
      }
      return (collaborationByPath?.[normalizedPath]?.history || [])
        .map(normalizeContentHistoryEntry)
        .filter(Boolean);
    };

    const setActiveBlockLock = (pathname, blockId, options = {}) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const force = Boolean(options?.force);
      if (!normalizedPath || !normalizedBlockId || !currentActor) {
        return { ok: false, reason: 'missing-target' };
      }

      const currentMeta = getBlockCollaboration(normalizedPath, normalizedBlockId);
      const { lockedByOther, draftedByOther } = getForeignOwnershipMeta(currentMeta, currentActor);
      if (!force && lockedByOther) {
        return { ok: false, reason: 'locked-by-other', lockedBy: lockedByOther };
      }
      if (!force && draftedByOther) {
        return { ok: false, reason: 'drafted-by-other', draftedBy: draftedByOther };
      }

      const applyLockLocally = (prevState) => {
        const prevCollaborationByPath = prevState.collaborationByPath || {};
        const existingMeta = normalizeContentBlockMeta(prevCollaborationByPath?.[normalizedPath]?.blocks?.[normalizedBlockId]);
        const {
          lockedByOther: existingLockedByOther,
          draftedByOther: existingDraftedByOther,
        } = getForeignOwnershipMeta(existingMeta, currentActor);
        if (
          !force
          && (existingLockedByOther || existingDraftedByOther)
        ) {
          return prevState;
        }
        const now = Date.now();
        const releasedLocks = releaseUserLocks(prevCollaborationByPath, currentActor.userId, {
          keepPath: normalizedPath,
          keepBlockId: normalizedBlockId,
        });
        const previousActor = existingLockedByOther || (force ? existingDraftedByOther : null);
        const action = existingLockedByOther
          ? 'block-edit-taken-over'
          : (force && existingDraftedByOther ? 'block-draft-claimed' : 'block-locked');
        const nextEntry = (releasedLocks[normalizedPath] && typeof releasedLocks[normalizedPath] === 'object')
          ? releasedLocks[normalizedPath]
          : { blocks: {}, history: [] };
        const nextBlocks = {
          ...(nextEntry.blocks || {}),
          [normalizedBlockId]: {
            ...existingMeta,
            lockedBy: currentActor,
            lockedAt: now,
            draftedBy: existingMeta.draftedBy,
            draftedAt: existingMeta.draftedAt,
            savedBy: existingMeta.savedBy,
            savedAt: existingMeta.savedAt,
          },
        };

        return {
          ...prevState,
          collaborationByPath: {
            ...releasedLocks,
            [normalizedPath]: {
              ...nextEntry,
              blocks: nextBlocks,
              history: appendHistoryEntry(nextEntry.history, buildHistoryEntry({
                action,
                blockId: normalizedBlockId,
                actor: currentActor,
                previousActor,
                details: force ? 'forced' : '',
                now,
              })),
            },
          },
        };
      };

      if (sharedAuthorityEnabled) {
        setOptimisticState(applyLockLocally);
        syncSharedSnapshot(
          () => acquireSharedBlockLock(normalizedPath, normalizedBlockId, currentActor, { force }),
          { mergeCollaborationOnlyWhenDirty: true },
        );
      } else {
        saveState(applyLockLocally);
      }

      return { ok: true };
    };

    const clearActiveBlockLock = (pathname, blockId) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId || !currentActor) {
        return { ok: false, reason: 'missing-target' };
      }

      const currentMeta = getBlockCollaboration(normalizedPath, normalizedBlockId);
      if (currentMeta.lockedBy?.userId !== currentActor.userId) {
        return { ok: false, reason: 'not-lock-owner' };
      }

      const clearLockLocally = (prevState) => {
        const previousEntry = prevState.collaborationByPath?.[normalizedPath];
        const existingMeta = normalizeContentBlockMeta(previousEntry?.blocks?.[normalizedBlockId]);
        if (existingMeta.lockedBy?.userId !== currentActor.userId) {
          return prevState;
        }
        const now = Date.now();
        const nextBlocks = {
          ...(previousEntry?.blocks || {}),
          [normalizedBlockId]: {
            ...existingMeta,
            lockedBy: null,
            lockedAt: null,
          },
        };
        return {
          ...prevState,
          collaborationByPath: {
            ...(prevState.collaborationByPath || {}),
            [normalizedPath]: {
              ...(previousEntry || { blocks: {}, history: [] }),
              blocks: nextBlocks,
              history: appendHistoryEntry(previousEntry?.history, buildHistoryEntry({
                action: 'block-unlocked',
                blockId: normalizedBlockId,
                actor: currentActor,
                now,
              })),
            },
          },
        };
      };

      if (sharedAuthorityEnabled) {
        setOptimisticState(clearLockLocally);
        syncSharedSnapshot(
          () => releaseSharedBlockLock(normalizedPath, normalizedBlockId, currentActor),
          { mergeCollaborationOnlyWhenDirty: true },
        );
      } else {
        saveState(clearLockLocally);
      }

      return { ok: true };
    };

    const saveSharedDraftNow = async (summary = '') => {
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      flushExternalDraftBuffers();
      flushAllBufferedBlockSettings();
      clearPendingBlockDraftSyncTimers();
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      try {
        const snapshot = await saveSharedPageDraft(stateRef.current, currentActor, summary);
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        const normalizedSaveResult = normalizeSharedSaveResult({
          ...(snapshot?.saveResult || {}),
          updatedAt: snapshot?.updatedAt,
        });
        setLastSharedSaveResult(normalizedSaveResult);
        return {
          ok: true,
          snapshot,
          saveResult: normalizedSaveResult,
        };
      } catch {
        const failed = {
          error: 'save-failed',
          didSave: false,
          hasConflicts: false,
          changedPaths: [],
          savedPaths: [],
          savedBlockIdsByPath: {},
          blockedBlockIdsByPath: {},
          blockedBlocks: [],
          updatedAt: Date.now(),
        };
        setLastSharedSaveResult(failed);
        return {
          ok: false,
          reason: 'save-failed',
          saveResult: failed,
        };
      } finally {
        bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
      }
    };

    const publishSharedPageNow = async (pathname, summary = '') => {
      const normalizedPath = String(pathname || '').trim();
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      if (!normalizedPath) {
        return { ok: false, reason: 'invalid-path' };
      }

      const currentAuthoringState = applyBufferedBlockSettingEditsToState(stateRef.current, bufferedBlockSettingEditsRef.current);
      const pageSaveSummary = summarizeAuthoringPageChanges(
        currentAuthoringState,
        persistedSharedAuthoringStateRef.current,
        normalizedPath,
      );
      if (pageSaveSummary.hasUnsavedChanges) {
        const saveResult = await saveSharedDraftNow(summary);
        if (!saveResult?.ok) {
          return {
            ok: false,
            reason: 'save-before-publish-failed',
            saveResult: saveResult?.saveResult || null,
          };
        }
      }

      flushExternalDraftBuffers();
      flushAllBufferedBlockSettings();
      clearPendingBlockDraftSyncTimers();
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      try {
        const snapshot = await publishSharedPage(normalizedPath, currentActor, summary);
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        const normalizedPublishResult = normalizeSharedPublishResult({
          ...(snapshot?.publishResult || {}),
          error: snapshot?.ok === false ? snapshot?.error : '',
          updatedAt: snapshot?.updatedAt,
        });
        setLastSharedPublishResult(normalizedPublishResult);
        return {
          ok: snapshot?.ok !== false,
          snapshot,
          publishResult: normalizedPublishResult,
        };
      } catch (error) {
        const snapshot = error?.payload || null;
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        if (snapshot?.publishResult || snapshot?.error) {
          const normalizedPublishResult = normalizeSharedPublishResult({
            ...(snapshot?.publishResult || {}),
            error: snapshot?.error || '',
            updatedAt: snapshot?.updatedAt,
          });
          setLastSharedPublishResult(normalizedPublishResult);
          return {
            ok: false,
            reason: snapshot?.error || 'publish-failed',
            snapshot,
            publishResult: normalizedPublishResult,
          };
        }
        const failed = {
          error: 'publish-failed',
          didPublish: false,
          hasConflicts: false,
          changedPaths: [],
          publishedPaths: [],
          publishedBlockIdsByPath: {},
          blockedBlockIdsByPath: {},
          blockedBlocks: [],
          hasOrderChangesByPath: {},
          hasPageMetaChangesByPath: {},
          updatedAt: Date.now(),
        };
        setLastSharedPublishResult(failed);
        return {
          ok: false,
          reason: 'publish-failed',
          publishResult: failed,
        };
      } finally {
        bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
      }
    };

    const getSharedContentBackups = async () => {
      if (!sharedAuthorityEnabled) {
        return [];
      }
      const snapshot = await fetchSharedContentBackups();
      return Array.isArray(snapshot?.backups) ? snapshot.backups : [];
    };

    const promoteContentAdminToSeed = async () => {
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      flushExternalDraftBuffers();
      flushAllBufferedBlockSettings();
      clearPendingBlockDraftSyncTimers();
      const currentComparableAuthoringState = toComparableAuthoringState(stateRef.current);
      const hasUnsavedChanges = collectDirtyComparableAuthoringPaths(
        currentComparableAuthoringState,
        persistedSharedAuthoringStateRef.current,
      ).length > 0;
      if (hasUnsavedChanges) {
        const saveResult = await saveSharedDraftNow('Prepare seed promotion');
        if (!saveResult?.ok) {
          return {
            ok: false,
            reason: 'save-before-promote-failed',
            details: 'Save draft before promoting the current content to seed.',
            saveResult: saveResult?.saveResult || null,
          };
        }
      }
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      try {
        const snapshot = await promoteSharedContentToSeedRequest(currentActor);
        applySharedSeedBaseline(snapshot);
        if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
          applySharedSnapshotState(snapshot);
        }
        return {
          ok: snapshot?.ok !== false,
          snapshot,
          promotedSeedBaseline: snapshot?.promotedSeedBaseline || snapshot?.seedBaseline || null,
        };
      } catch (error) {
        const snapshot = error?.payload || null;
        applySharedSeedBaseline(snapshot);
        if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
          applySharedSnapshotState(snapshot);
        }
        return {
          ok: false,
          reason: snapshot?.error || 'promote-seed-failed',
          details: snapshot?.details || (error instanceof Error ? error.message : 'promote-seed-failed'),
          snapshot,
        };
      } finally {
        bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
      }
    };

    const resetContentAdmin = async () => {
      const next = normalizeStoredConfig(null);
      clearBufferedBlockSettingCommitTimers();
      updateBufferedBlockSettingDrafts({});
      clearPendingBlockDraftSyncTimers();
      if (sharedAuthorityEnabled) {
        const mutationId = latestSharedMutationIdRef.current + 1;
        latestSharedMutationIdRef.current = mutationId;
        bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
        try {
          const snapshot = await resetSharedContentFromSeed(next, currentActor);
          if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
            applySharedSnapshotState(snapshot);
          }
          return {
            ok: snapshot?.ok !== false,
            snapshot,
          };
        } catch (error) {
          const snapshot = error?.payload || null;
          if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
            applySharedSnapshotState(snapshot);
          }
          return {
            ok: false,
            reason: snapshot?.error || 'reset-failed',
            details: snapshot?.details || (error instanceof Error ? error.message : 'reset-failed'),
            snapshot,
          };
        } finally {
          bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
        }
      }
      saveState(next);
      return { ok: true, snapshot: { state: next } };
    };

    const getPageRevisionHistory = async (pathname) => {
      if (!sharedAuthorityEnabled) {
        return [];
      }
      const snapshot = await fetchSharedPageRevisionHistory(pathname);
      return Array.isArray(snapshot?.revisions) ? snapshot.revisions : [];
    };

    const restorePageRevision = async (pathname, revisionId) => {
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      clearBufferedBlockSettingCommitTimers();
      updateBufferedBlockSettingDrafts({});
      try {
        const snapshot = await restoreSharedPageRevision(pathname, revisionId, currentActor);
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        return snapshot;
      } catch (error) {
        const snapshot = error?.payload || null;
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        return {
          ok: false,
          reason: snapshot?.error || 'restore-page-revision-failed',
          details: snapshot?.details || (error instanceof Error ? error.message : 'restore-page-revision-failed'),
          snapshot,
        };
      }
    };

    const restoreBlockRevision = async (pathname, revisionId, blockId) => {
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      clearBufferedBlockSettingCommitTimers();
      updateBufferedBlockSettingDrafts({});
      try {
        const snapshot = await restoreSharedBlockRevision(pathname, revisionId, blockId, currentActor);
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        return snapshot;
      } catch (error) {
        const snapshot = error?.payload || null;
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        return {
          ok: false,
          reason: snapshot?.error || 'restore-block-revision-failed',
          details: snapshot?.details || (error instanceof Error ? error.message : 'restore-block-revision-failed'),
          snapshot,
        };
      }
    };

    const restoreLatestSharedContentBackup = async () => {
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      clearBufferedBlockSettingCommitTimers();
      updateBufferedBlockSettingDrafts({});
      clearPendingBlockDraftSyncTimers();
      try {
        const snapshot = await restoreLatestSharedContentBackupRequest(currentActor);
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        return snapshot;
      } catch (error) {
        const snapshot = error?.payload || null;
        if (snapshot?.state) {
          applySharedSnapshotState(snapshot);
        }
        return {
          ok: false,
          reason: snapshot?.error || 'restore-backup-failed',
          details: snapshot?.details || (error instanceof Error ? error.message : 'restore-backup-failed'),
          snapshot,
        };
      }
    };

    const resolveManagedPath = (pathname) => resolveAliasPath(pathname, pathAliases);

    const registerExternalDraftFlushHandler = (handlerId, flushHandler) => {
      const normalizedHandlerId = String(handlerId || '').trim();
      if (!normalizedHandlerId || typeof flushHandler !== 'function') {
        return () => {};
      }
      externalDraftFlushHandlersRef.current.set(normalizedHandlerId, flushHandler);
      return () => {
        externalDraftFlushHandlersRef.current.delete(normalizedHandlerId);
      };
    };

    const registerExternalDraftStatusHandler = (handlerId, getStatus) => {
      const normalizedHandlerId = String(handlerId || '').trim();
      if (!normalizedHandlerId || typeof getStatus !== 'function') {
        return () => {};
      }
      externalDraftStatusHandlersRef.current.set(normalizedHandlerId, getStatus);
      return () => {
        externalDraftStatusHandlersRef.current.delete(normalizedHandlerId);
      };
    };

    const hasPendingExternalDrafts = (pathname) => {
      const normalizedPath = String(pathname || '').trim();
      if (!normalizedPath) {
        return false;
      }
      for (const getStatus of externalDraftStatusHandlersRef.current.values()) {
        try {
          const status = getStatus();
          if (
            String(status?.pathname || '').trim() === normalizedPath
            && Boolean(status?.hasPendingDrafts)
          ) {
            return true;
          }
        } catch {
          // ignore transient external draft status errors
        }
      }
      return false;
    };

    const resolveManagedPathFromRef = (pageRef, fallbackPath = '') => {
      const ref = normalizeManagedLinkRef(pageRef);
      if (ref) {
        const byRef = Object.values(pageHierarchy).find((page) => (
          normalizeManagedLinkRef(page.linkRef) === ref
          || normalizeManagedLinkRef(page.routeKey) === ref
        ));
        if (byRef?.path) {
          return byRef.path;
        }

        const maybePath = normalizeManagedPathInput(ref);
        if (maybePath) {
          if (pageHierarchy[maybePath]) {
            return maybePath;
          }
          const resolvedAlias = resolveAliasPath(maybePath, pathAliases);
          if (resolvedAlias && pageHierarchy[resolvedAlias]) {
            return resolvedAlias;
          }
        }
      }

      const fallback = normalizeManagedPathInput(fallbackPath);
      if (!fallback) {
        return '';
      }
      if (pageHierarchy[fallback]) {
        return fallback;
      }
      const resolvedFallbackAlias = resolveAliasPath(fallback, pathAliases);
      if (resolvedFallbackAlias && pageHierarchy[resolvedFallbackAlias]) {
        return resolvedFallbackAlias;
      }
      return fallback;
    };

    const resolveAuthoringManagedPathFromRef = (pageRef, fallbackPath = '') => {
      const ref = normalizeManagedLinkRef(pageRef);
      if (ref) {
        const byRef = Object.values(authoringPageHierarchy).find((page) => (
          normalizeManagedLinkRef(page.linkRef) === ref
          || normalizeManagedLinkRef(page.routeKey) === ref
        ));
        if (byRef?.path) {
          return byRef.path;
        }

        const maybePath = normalizeManagedPathInput(ref);
        if (maybePath) {
          if (authoringPageHierarchy[maybePath]) {
            return maybePath;
          }
          const resolvedAlias = resolveAliasPath(maybePath, authoringPathAliases);
          if (resolvedAlias && authoringPageHierarchy[resolvedAlias]) {
            return resolvedAlias;
          }
        }
      }

      const fallback = normalizeManagedPathInput(fallbackPath);
      if (!fallback) {
        return '';
      }
      if (authoringPageHierarchy[fallback]) {
        return fallback;
      }
      const resolvedFallbackAlias = resolveAliasPath(fallback, authoringPathAliases);
      if (resolvedFallbackAlias && authoringPageHierarchy[resolvedFallbackAlias]) {
        return resolvedFallbackAlias;
      }
      return fallback;
    };

    return {
      devIdentity,
      pageHierarchy,
      blocksByPath,
      pathAliases,
      authoringPageHierarchy,
      authoringBlocksByPath,
      authoringPathAliases,
      updatePageHierarchy,
      renamePagePath,
      updateBlock,
      updateBlockSetting,
      claimBufferedBlockEdit,
      commitBlockSettingsPatch,
      moveBlock,
      moveBlockToIndex,
      addBlock,
      removeBlock,
      availableBlockTemplates,
      renameDevIdentity,
      getBlockCollaboration,
      getPageHistory,
      lastSharedSaveResult,
      lastSharedPublishResult,
      sharedSnapshotUpdatedAt,
      sharedSeedBaseline,
      sharedSyncStatus: {
        isPending: sharedSyncState.pendingMutationCount > 0 || sharedSyncState.hasQueuedDraftSync,
        pendingMutationCount: sharedSyncState.pendingMutationCount,
        hasQueuedDraftSync: sharedSyncState.hasQueuedDraftSync,
        lastQueuedAt: sharedSyncState.lastQueuedAt,
        lastSettledAt: sharedSyncState.lastSettledAt,
        lastAppliedAt: sharedSyncState.lastAppliedAt,
      },
      dirtyPaths,
      isPageDirty: (pathname) => dirtyPathSet.has(String(pathname || '').trim()),
      getPageChangeSummary: (pathname) => summarizeComparableAuthoringPageChanges(
        currentComparableAuthoringState,
        persistedComparableAuthoringState,
        pathname,
      ),
      getPagePublishSummary: (pathname) => summarizeComparableAuthoringPageChanges(
        currentComparableAuthoringState,
        publishedComparableAuthoringState,
        pathname,
      ),
      getPageWorkflowActivity: (pathname) => summarizePageWorkflowActivity(
        collaborationByPath,
        pathname,
        currentActor,
      ),
      saveSharedDraftNow,
      publishSharedPageNow,
      registerExternalDraftFlushHandler,
      registerExternalDraftStatusHandler,
      hasPendingExternalDrafts,
      getPageRevisionHistory,
      getSharedContentBackups,
      promoteContentAdminToSeed,
      setActiveBlockLock,
      clearActiveBlockLock,
      restorePageRevision,
      restoreBlockRevision,
      restoreLatestSharedContentBackup,
      resetContentAdmin,
      resolveManagedPath,
      resolveManagedPathFromRef,
      resolveAuthoringManagedPathFromRef,
      getBreadcrumbTrail: (pathname) => buildBreadcrumbTrail(pathname, pageHierarchy),
      getAuthoringBreadcrumbTrail: (pathname) => buildBreadcrumbTrail(pathname, authoringPageHierarchy),
    };
  }, [
    state,
    publishedState,
    devIdentity,
    sharedAuthorityEnabled,
    lastSharedSaveResult,
    lastSharedPublishResult,
    sharedSnapshotUpdatedAt,
    sharedSeedBaseline,
    sharedSyncState,
    bufferedBlockSettingEdits,
  ]);

  return <ContentAdminContext.Provider value={value}>{children}</ContentAdminContext.Provider>;
}

export function useContentAdmin() {
  const context = useContext(ContentAdminContext);
  if (!context) {
    throw new Error('useContentAdmin must be used within ContentAdminProvider');
  }
  return context;
}
