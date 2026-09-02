import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ContentAdminContext,
} from './ContentAdminContextCore';
export { ContentAdminContext, useContentAdmin, useOptionalContentAdmin } from './ContentAdminContextCore';
import { sitePages } from '../data/siteMap';
import {
  contentBlockBlueprintsByPath,
  genericPageFallbackBlueprint,
  genericPageBlockBlueprint,
  getAllBlockTemplateBlueprints,
} from '../data/contentBlockBlueprints';
import { getSingletonBlockKinds } from '../blocks/registry';
import {
  parseCtaFormFieldsJson,
  serializeCtaFormFields,
} from '../blocks/foundation/forms';
import {
  DEV_ADMIN_PROFILES_STORAGE_KEY,
  DEV_IDENTITY_STORAGE_KEY,
  getOrCreateDevIdentity,
  normalizeDevIdentity,
  readStoredDevAdminProfiles,
  renameStoredDevIdentity,
  selectStoredDevAdminProfile,
  setStoredDevIdentityAccentColor,
  updateStoredDevAdminProfile,
} from '../lib/devIdentity';
import { getHeroSeedContract } from '../lib/heroSeedContracts';
import {
  BLOCK_ONLY_MANAGED_PAGE_PATHS,
  isBlockOnlyManagedPagePath,
  isBlocklessManagedPagePath,
} from '../lib/managedPageShells';
import {
  DEFAULT_HERO_TITLE_LETTER_SPACING_EM,
  DEFAULT_HERO_TITLE_SIZE_REM,
  normalizeHeroTitleLetterSpacingEm,
  normalizeHeroTitleSizeRem,
} from '../lib/heroTitleSize';
import {
  normalizeSplitLinkFieldSettings,
  resolveEditableHrefFromLinkFields,
} from '../lib/linkValue';
import { normalizePresetBearingBlocks } from '../lib/blockPresetIdentity';
import { normalizeCalculatorWidgetBlocks } from '../lib/calculatorWidgetIdentity';
import { normalizeBlockPresentation } from '../lib/blockPresentationContracts';
import {
  isRetiredNonDynamicContentAdminBlock,
  normalizeContentAdminBlock,
  normalizeContentAdminState,
  normalizeIraContributionLimitsChart,
  normalize403bContributionLimitsChart,
  normalizeRetirementIraRatesBlock,
  normalizeRetirement403bRatesBlock,
} from '../lib/contentAdminNormalization';
import { normalizeContentAdminAuthorityState } from '../lib/contentAdminStateBoundary';
import {
  DEFAULT_MANAGED_PATH_ALIASES,
  buildBreadcrumbTrail,
  buildDefaultPageHierarchy,
  isValidParent,
  normalizeManagedPathInput,
  normalizePathAliases,
  resolveAliasPath,
  toUniqueBlockId,
} from '../lib/contentAdminPathUtilities';
import {
  buildFastInitialContentAdminState as buildFastInitialState,
  hasContentAdminSnapshotStateContent,
  parseInitialContentAdminBootstrapState,
} from '../lib/contentAdminBootstrapState';
import {
  collectDirtyComparableAuthoringPaths,
  collectDirtyAuthoringPaths,
  compareComparableAuthoringPageSnapshot,
  compareAuthoringPageSnapshot,
  normalizeContentAdminPageBlocks as normalizePageBlocksState,
  summarizeAuthoringPageChanges,
  summarizeComparableAuthoringPageChanges,
  toComparableAuthoringState,
} from '../lib/contentAdminPageComparison';
import {
  getSharedBlockDraftSyncDelay,
  SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS,
  SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS,
  shouldBufferLocalBlockSetting,
} from '../lib/contentAdminDraftBufferPolicy';
export {
  getSharedBlockDraftSyncDelay,
  shouldBufferLocalBlockSetting,
} from '../lib/contentAdminDraftBufferPolicy';
import { CONTENT_ADMIN_MIGRATION_ADAPTERS } from '../lib/contentAdminMigrationInventory';
export { getContentAdminMigrationAdapterInventory } from '../lib/contentAdminMigrationInventory';
import {
  buildContentAdminDisplayState,
  buildContentAdminTemplateIndex,
} from '../lib/contentAdminDisplayState';
import { isPageContentBlock } from '../lib/pageContentIdentity';
import { normalizeTestimonialRecord } from '../lib/testimonials';
import {
  EDITOR_DRAFT_FLUSH_EVENT,
  EDITOR_DRAFT_PUBLISHED_EVENT,
  EDITOR_DRAFT_RESET_EVENT,
  LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS,
} from '../lib/contentAdminTiming';
import {
  appendHistoryEntry,
  blockSnapshotEquals,
  buildEditingBlockMeta,
  buildHistoryEntry,
  collectChangedCollaborationPaths,
  getForeignOwnershipMeta,
  getSharedContentPollDelayForActivity,
  hasActiveSharedEditing,
  mergeSharedAuthoringSnapshot,
  mergeSharedCollaborationSnapshot,
  normalizeCollaborationState,
  normalizeContentActor,
  normalizeContentBlockMeta,
  normalizeContentHistoryEntry,
  normalizeSharedPublishResult,
  normalizeSharedSaveResult,
  releaseUserLocks,
} from '../lib/contentAdminCollaboration';
import {
  classifyPublishVerification,
  createPublishOperationId,
  isPublishOperationResponseCurrent,
  PUBLISH_STATUS,
  validatePublishResponse,
} from '../lib/contentAdminPublishing';
import {
  preserveBlockedDraftContent,
  summarizePageWorkflowActivity,
} from '../lib/contentAdminDraftMerge';
import {
  acquireSharedBlockLock,
  discardSharedBlockDraft,
  discardSharedPageDraft,
  fetchSharedContentBackups,
  fetchSharedContentSnapshot,
  fetchSharedContentRouteSnapshot,
  fetchSharedPublishStatus,
  fetchSharedPageRevisionHistory,
  initializeSharedContentFromSeed,
  isDevContentAuthorityCircuitOpen,
  isDevContentAuthorityEnabled,
  publishSharedBlock,
  publishSharedPage,
  promoteSharedContentToSeed as promoteSharedContentToSeedRequest,
  releaseSharedBlockDraft,
  releaseSharedBlockLock,
  resetSharedContentFromSeed,
  restoreLatestSharedContentBackup as restoreLatestSharedContentBackupRequest,
  restoreSharedBlockRevision,
  restoreSharedPageRevision,
  saveSharedBlockDraft,
  saveSharedPageDraft,
  saveSharedRouteDraft,
  syncSharedBlockDraft,
} from '../lib/devContentAuthorityClient';

export {
  getSharedContentPollDelay,
  getSharedContentPollDelayForActivity,
  mergeSharedAuthoringSnapshot,
  mergeSharedCollaborationSnapshot,
} from '../lib/contentAdminCollaboration';

function describeAuthorityFailure(error, fallbackError) {
  return {
    error: error?.payload?.error || error?.code || fallbackError,
    details: error?.payload?.details || error?.message || fallbackError,
    statusCode: Number(error?.status) || null,
    endpoint: error?.endpoint || '',
    owner: error?.payload?.owner || null,
    state: error?.payload?.state || '',
  };
}

function isSharedAuthorityCircuitOpen() {
  return typeof isDevContentAuthorityCircuitOpen === 'function'
    && isDevContentAuthorityCircuitOpen();
}

const STORAGE_KEY = 'agf-content-admin-v1';
const LOCAL_BUFFERED_BLOCK_SETTING_COMMIT_DELAY_MS = 1600;
const SHARED_PENDING_BLOCK_DRAFT_WAIT_TIMEOUT_MS = 2500;
const LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH = '/services/planned-giving/charitable-gift-annuities';
const LEGACY_GIVING_CHARITABLE_TRUSTS_PATH = '/services/planned-giving/charitable-trusts';
const LEGACY_GIVING_ENDOWMENTS_PATH = '/services/planned-giving/endowments';
const LEGACY_GIVING_GENEROSITY_FUND_PATH = '/services/planned-giving/donor-advised-fund';
const RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH = '/services/planned-giving/generosity-fund';
const LEGACY_GIVING_MINISTRY_IMPACT_FUND_PATH = '/services/planned-giving/ministry-impact-fund';
const PLANNED_GIVING_OVERVIEW_PATH = '/services/planned-giving';
const RETIRED_CHARITABLE_TRUSTS_BLOCK_IDS = Object.freeze([
  'remainder_trust_how_it_works',
  'cta_trigger',
  'cta_form',
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
const EMPTY_PAGE_CONTENT_SEED_DISABLED_PATHS = new Set([
  '/services/investments/invest-by-mail',
  '/services/loans/loan-consultants',
  '/calculators/emergency-fund',
  '/calculators/increased-contribution',
  '/calculators/ministers-housing-allowance-quick-check',
  '/calculators/net-worth',
  '/contact-us',
]);
const BLOCK_ONLY_RETIRED_SHELL_BLOCK_KINDS = new Set(['hero', 'intro']);

function isBlankSettingsObject(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return true;
  }
  return Object.keys(settings).length === 0;
}

function stripSimpleHtmlToText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function appendClassNameTokens(value, requiredValue) {
  const currentTokens = String(value || '').trim().split(/\s+/).filter(Boolean);
  const currentTokenSet = new Set(currentTokens);
  String(requiredValue || '').trim().split(/\s+/).filter(Boolean).forEach((token) => {
    if (!currentTokenSet.has(token)) {
      currentTokens.push(token);
      currentTokenSet.add(token);
    }
  });
  return currentTokens.join(' ');
}

function normalizeRetirement403bSectionClassSettings(pathname, settings, defaultSettings) {
  const path = String(pathname || '').trim();
  if (
    path !== RETIREMENT_403B_PATH
    && path !== RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_PATH
    && path !== RETIREMENT_403B_GROUP_ENROLLMENT_PATH
  ) {
    return settings;
  }

  const defaultSectionClassName = String(defaultSettings?.sectionClassName || '').trim();
  const requiredTokens = defaultSectionClassName
    .split(/\s+/)
    .filter((token) => (
      token.startsWith('retirement-403b-native-')
      || token.startsWith('ret403b-')
      || token === 'retirement-everyday'
      || token === 'retirement-rollover-billboard'
    ))
    .join(' ');
  if (!requiredTokens) {
    return settings;
  }

  const nextSectionClassName = appendClassNameTokens(settings?.sectionClassName || '', requiredTokens);
  if (nextSectionClassName === String(settings?.sectionClassName || '').trim()) {
    return settings;
  }

  return {
    ...(settings && typeof settings === 'object' ? settings : {}),
    sectionClassName: nextSectionClassName,
  };
}

function normalizeRetirementLandingCtaSettings(settings, defaultSettings = {}) {
  const nextSettings = {
    ...(defaultSettings && typeof defaultSettings === 'object' ? defaultSettings : {}),
    ...(settings && typeof settings === 'object' ? settings : {}),
  };
  const fields = parseCtaFormFieldsJson(nextSettings.fieldsJson);
  const defaultFields = parseCtaFormFieldsJson(defaultSettings?.fieldsJson);
  const defaultStateField = defaultFields.find((field) => (
    String(field.id || '').trim().toLowerCase() === 'state'
    || (
      String(field.type || '').trim().toLowerCase() === 'select'
      && String(field.label || '').trim().toLowerCase() === 'state'
    )
  ));
  const messageIndex = fields.findIndex((field) => (
    String(field.id || '').trim().toLowerCase() === 'message'
    || String(field.label || '').trim().toLowerCase() === 'message'
    || String(field.type || '').trim().toLowerCase() === 'textarea'
  ));
  const hasStateField = fields.some((field) => (
    String(field.id || '').trim().toLowerCase() === 'state'
    || (
      String(field.type || '').trim().toLowerCase() === 'select'
      && String(field.label || '').trim().toLowerCase() === 'state'
    )
  ));

  nextSettings.bodyHtml = '';

  if (!hasStateField && messageIndex >= 0 && defaultStateField) {
    const messageField = {
      ...fields[messageIndex],
      id: 'message',
      label: 'Message',
      type: 'textarea',
      placeholder: fields[messageIndex]?.placeholder || 'What would you like to discuss?',
    };
    nextSettings.fieldsJson = serializeCtaFormFields([
      ...fields.filter((_, index) => index !== messageIndex),
      defaultStateField,
      messageField,
    ]);
  }

  return nextSettings;
}

function upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock, options = {}) {
  return {
    ...storedBlock,
    kind: defaultBlock.kind || storedBlock.kind,
    mode: 'dynamic',
    hidden: Object.prototype.hasOwnProperty.call(options, 'hidden')
      ? options.hidden
      : (Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
          ? defaultBlock.hidden
          : storedBlock.hidden),
    settings: isBlankSettingsObject(storedBlock?.settings)
      ? { ...(defaultBlock?.settings || {}) }
      : {
          ...(defaultBlock?.settings || {}),
          ...(storedBlock?.settings || {}),
        },
    editableFields: Array.isArray(defaultBlock?.editableFields)
      ? [...defaultBlock.editableFields]
      : (Array.isArray(storedBlock?.editableFields) ? [...storedBlock.editableFields] : []),
  };
}

function shouldRetireBlockOnlyShellBlock(pathname, storedBlock, defaultById) {
  if (!isBlockOnlyManagedPagePath(pathname)) {
    return false;
  }

  const storedBlockId = String(storedBlock?.id || '').trim();
  const storedKind = String(storedBlock?.kind || '').trim().toLowerCase();
  if (!storedBlockId) {
    return false;
  }

  const defaultBlock = defaultById.get(storedBlockId);
  const defaultKind = String(defaultBlock?.kind || '').trim().toLowerCase();
  if (!BLOCK_ONLY_RETIRED_SHELL_BLOCK_KINDS.has(storedKind)) {
    return false;
  }

  return !defaultBlock || (storedKind && defaultKind && storedKind !== defaultKind);
}

function reconcileBlockOnlyManagedBlockInventory(pathname, defaultBlocks, blocks) {
  if (!isBlockOnlyManagedPagePath(pathname) || !Array.isArray(defaultBlocks) || defaultBlocks.length === 0) {
    return blocks;
  }

  const normalizedBlocks = Array.isArray(blocks) ? blocks : [];
  const storedById = new Map(
    normalizedBlocks
      .map((block) => [String(block?.id || '').trim(), block])
      .filter(([blockId]) => blockId),
  );
  const defaultIds = new Set(
    defaultBlocks
      .map((block) => String(block?.id || '').trim())
      .filter(Boolean),
  );
  const canonicalBlocks = defaultBlocks
    .map((defaultBlock) => {
      const blockId = String(defaultBlock?.id || '').trim();
      if (!blockId) {
        return null;
      }

      const storedBlock = storedById.get(blockId);
      const storedKind = String(storedBlock?.kind || '').trim().toLowerCase();
      const defaultKind = String(defaultBlock?.kind || '').trim().toLowerCase();
      if (!storedBlock || (storedKind && defaultKind && storedKind !== defaultKind)) {
        return cloneTemplateVariant(defaultBlock);
      }
      return storedBlock;
    })
    .filter(Boolean);
  const adminAddedBlocks = normalizedBlocks.filter((block) => {
    const blockId = String(block?.id || '').trim();
    return blockId && !defaultIds.has(blockId);
  });

  return [...canonicalBlocks, ...adminAddedBlocks];
}

function restoreMissingDefaultBlocksById(defaultBlocks, blocks, blockIds) {
  if (!Array.isArray(defaultBlocks) || !Array.isArray(blocks) || !(blockIds instanceof Set) || blockIds.size === 0) {
    return blocks;
  }

  const existingIds = new Set(
    blocks
      .map((block) => String(block?.id || '').trim())
      .filter(Boolean),
  );
  const missingDefaults = defaultBlocks.filter((block) => {
    const blockId = String(block?.id || '').trim();
    return blockId && blockIds.has(blockId) && !existingIds.has(blockId);
  });
  if (!missingDefaults.length) {
    return blocks;
  }

  const defaultOrderById = new Map(
    defaultBlocks
      .map((block, index) => [String(block?.id || '').trim(), index])
      .filter(([blockId]) => blockId),
  );
  return [...blocks, ...missingDefaults.map((block) => cloneTemplateVariant(block))]
    .sort((left, right) => {
      const leftOrder = defaultOrderById.get(String(left?.id || '').trim());
      const rightOrder = defaultOrderById.get(String(right?.id || '').trim());
      const normalizedLeftOrder = Number.isFinite(leftOrder) ? leftOrder : Number.MAX_SAFE_INTEGER;
      const normalizedRightOrder = Number.isFinite(rightOrder) ? rightOrder : Number.MAX_SAFE_INTEGER;
      return normalizedLeftOrder - normalizedRightOrder;
    });
}

function shouldUpgradeRetiredPageContentImageBridge(storedBlock, defaultBlock) {
  const storedKind = String(storedBlock?.kind || '').trim().toLowerCase();
  const defaultKind = String(defaultBlock?.kind || '').trim().toLowerCase();
  const defaultMode = String(defaultBlock?.mode || '').trim().toLowerCase();
  const storedSettings = storedBlock?.settings && typeof storedBlock.settings === 'object'
    ? storedBlock.settings
    : {};

  return (
    storedKind === 'columns'
    && defaultKind === 'content'
    && defaultMode === 'dynamic'
    && (
      String(storedSettings.logoImage || '').trim()
      || String(storedSettings.col1ImageUrl || '').trim()
      || String(storedSettings.logoText || '').trim()
    )
  );
}

function upgradeRetiredPageContentImageBridge(defaultBlock, storedBlock) {
  const defaultSettings = defaultBlock?.settings && typeof defaultBlock.settings === 'object'
    ? defaultBlock.settings
    : {};
  const storedSettings = storedBlock?.settings && typeof storedBlock.settings === 'object'
    ? storedBlock.settings
    : {};
  const nextSettings = {
    ...defaultSettings,
    logoImage: String(storedSettings.logoImage || storedSettings.col1ImageUrl || defaultSettings.logoImage || '').trim(),
    logoAlt: String(storedSettings.logoAlt || storedSettings.col1ImageAlt || defaultSettings.logoAlt || '').trim(),
    logoText: String(storedSettings.logoText || defaultSettings.logoText || '').trim(),
    sectionClassName: String(storedSettings.sectionClassName || defaultSettings.sectionClassName || '').trim(),
    railClassName: String(storedSettings.railClassName || defaultSettings.railClassName || '').trim(),
  };

  return {
    ...cloneTemplateVariant(defaultBlock),
    id: defaultBlock.id || storedBlock.id,
    name: defaultBlock.name || storedBlock.name,
    kind: defaultBlock.kind || 'content',
    mode: 'dynamic',
    hidden: Object.prototype.hasOwnProperty.call(defaultBlock || {}, 'hidden')
      ? defaultBlock.hidden
      : storedBlock.hidden,
    settings: nextSettings,
    editableFields: Array.isArray(defaultBlock?.editableFields)
      ? [...defaultBlock.editableFields]
      : [],
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
      return normalizeContentAdminBlock(nextBlock);
    });

    if (!didChangePath) {
      return;
    }
    if (nextBlocksByPath === blocksByPath) {
      nextBlocksByPath = {
        ...(blocksByPath || {}),
      };
    }
    nextBlocksByPath[pathname] = nextBlocks;
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

function normalizeManagedLinkRef(value) {
  return String(value || '').trim();
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

const PLANNED_GIVING_CTA_FINEPRINT = '* fields required';
const PLANNED_GIVING_CTA_UNSURE_OPTION = Object.freeze({ value: 'not-sure', label: "I'm not sure." });
const PLANNED_GIVING_CTA_CONTACT_PREFERENCE_FIELD = Object.freeze({
  id: 'contact_preference',
  label: 'Contact preference',
  type: 'select',
  required: false,
  placeholder: 'Select one',
  options: Object.freeze([
    Object.freeze({ value: 'phone', label: 'Phone' }),
    Object.freeze({ value: 'email', label: 'Email' }),
  ]),
  optionsText: 'phone|Phone\nemail|Email',
});

function isPlannedGivingCtaSettings(settings) {
  const sectionClassName = String(settings?.sectionClassName || '').trim();
  return sectionClassName.split(/\s+/).includes('legacy-giving-cta');
}

function withRequiredAsterisk(label, fallbackLabel) {
  const source = String(label || fallbackLabel || '').trim();
  if (!source) {
    return '';
  }
  return source.includes('*') ? source : `${source}*`;
}

function isPlannedGivingCtaContactPreferenceField(field) {
  const fieldId = String(field?.id || '').trim().toLowerCase();
  const fieldLabel = String(field?.label || '').trim().toLowerCase();
  return fieldId === 'contact_preference'
    || fieldId === 'contactpreference'
    || fieldLabel.includes('contact preference')
    || fieldLabel.includes('preferred contact');
}

function ensurePlannedGivingCtaSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }
  if (!isPlannedGivingCtaSettings(settings)) {
    return settings;
  }

  const fields = parseCtaFormFieldsJson(settings.fieldsJson);
  if (!fields.length) {
    return String(settings.fineprint || '').trim()
      ? settings
      : { ...settings, fineprint: PLANNED_GIVING_CTA_FINEPRINT };
  }

  let changed = false;
  let hasContactPreference = false;
  const nextFields = fields.map((field) => {
    const fieldId = String(field?.id || '').trim().toLowerCase();
    const fieldLabel = String(field?.label || '').trim().toLowerCase();
    const fieldPatch = {};

    if (fieldId === 'name' || fieldLabel.replace(/\*/g, '').trim() === 'name') {
      const nextLabel = withRequiredAsterisk(field?.label, 'Name');
      if (field?.label !== nextLabel) {
        fieldPatch.label = nextLabel;
      }
      if (field?.required !== true) {
        fieldPatch.required = true;
      }
    }
    if (field?.type === 'tel' || fieldId === 'phone' || fieldLabel.replace(/\*/g, '').trim() === 'phone') {
      const nextLabel = withRequiredAsterisk(field?.label, 'Phone');
      if (field?.label !== nextLabel) {
        fieldPatch.label = nextLabel;
      }
      if (field?.required !== true) {
        fieldPatch.required = true;
      }
    }
    if (field?.type === 'email' || fieldId === 'email' || fieldLabel.replace(/\*/g, '').trim() === 'email') {
      const nextLabel = withRequiredAsterisk(field?.label, 'Email');
      if (field?.label !== nextLabel) {
        fieldPatch.label = nextLabel;
      }
      if (field?.required !== true) {
        fieldPatch.required = true;
      }
    }

    if (isPlannedGivingCtaContactPreferenceField(field)) {
      hasContactPreference = true;
      const nextField = {
        ...field,
        ...PLANNED_GIVING_CTA_CONTACT_PREFERENCE_FIELD,
        options: PLANNED_GIVING_CTA_CONTACT_PREFERENCE_FIELD.options.map((option) => ({ ...option })),
      };
      if (JSON.stringify(nextField) !== JSON.stringify(field)) {
        changed = true;
      }
      return nextField;
    }

    if (
      field?.type === 'select'
      && (fieldId === 'legacyproduct' || fieldLabel.includes('planned giving product'))
    ) {
      const options = Array.isArray(field.options) ? field.options : [];
      if (!options.some((option) => (
        option?.value === PLANNED_GIVING_CTA_UNSURE_OPTION.value
        || option?.label === PLANNED_GIVING_CTA_UNSURE_OPTION.label
      ))) {
        fieldPatch.options = [...options, PLANNED_GIVING_CTA_UNSURE_OPTION];
      }
    }

    if (!Object.keys(fieldPatch).length) {
      return field;
    }

    changed = true;
    return { ...field, ...fieldPatch };
  });

  if (!hasContactPreference) {
    const insertAfterIndex = nextFields.reduce((lastMatch, field, index) => {
      const fieldId = String(field?.id || '').trim().toLowerCase();
      const fieldLabel = String(field?.label || '').trim().toLowerCase();
      return fieldId === 'phone' || fieldLabel.replace(/\*/g, '').trim() === 'phone' ? index : lastMatch;
    }, -1);
    const contactField = {
      ...PLANNED_GIVING_CTA_CONTACT_PREFERENCE_FIELD,
      options: PLANNED_GIVING_CTA_CONTACT_PREFERENCE_FIELD.options.map((option) => ({ ...option })),
    };
    changed = true;
    if (insertAfterIndex < 0) {
      nextFields.push(contactField);
    } else {
      nextFields.splice(insertAfterIndex + 1, 0, contactField);
    }
  }

  const needsFineprint = !String(settings.fineprint || '').trim();
  return (changed || needsFineprint)
    ? {
      ...settings,
      fieldsJson: serializeCtaFormFields(nextFields),
      fineprint: needsFineprint ? PLANNED_GIVING_CTA_FINEPRINT : settings.fineprint,
    }
    : settings;
}

function normalizeCtaFormCanonicalFieldSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  return ensurePlannedGivingCtaSettings(settings);
}

function normalizeCtaFormCanonicalFieldsInBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => {
    if (
      String(block?.kind || '').trim().toLowerCase() !== 'cta_form'
    ) {
      return block;
    }

    const settings = block.settings && typeof block.settings === 'object'
      ? normalizeCtaFormCanonicalFieldSettings(block.settings)
      : block.settings;
    const changedSettings = settings !== block.settings;

    return !changedSettings
      ? block
      : { ...block, settings };
  });
}

function canonicalizeRouteLinkEditableFieldsInBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => {
    if (!Array.isArray(block?.editableFields)) {
      return block;
    }

    const canonicalFields = block.editableFields.map((field) => {
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
    const editableFields = canonicalFields.filter((field) => {
      const fieldId = String(field?.id || '').trim();
      return !fieldId.endsWith('PageRef') && !fieldId.endsWith('OpenInNewWindow');
    });
    return JSON.stringify(editableFields) === JSON.stringify(block.editableFields)
      ? block
      : { ...block, editableFields };
  });
}

function normalizeSplitLinkFieldsInBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : []).map((block) => {
    const settings = block?.settings && typeof block.settings === 'object'
      ? normalizeSplitLinkFieldSettings(block.settings, { stripSplitFields: true })
      : block?.settings;

    return settings === block?.settings
      ? block
      : { ...block, settings };
  });
}

function normalizeManagedBlockList(blocks) {
  const dynamicBlocks = (Array.isArray(blocks) ? blocks : [])
    .filter((block) => !isRetiredNonDynamicContentAdminBlock(block));
  const dedupedBlocks = dedupeBlocksByIdPreferLatest(dynamicBlocks);
  const singletonBlocks = normalizeSingletonKindBlocks(dedupedBlocks);
  const ctaBlocks = normalizeCtaFormCanonicalFieldsInBlocks(singletonBlocks);
  const calculatorBlocks = normalizeCalculatorWidgetBlocks(ctaBlocks);
  const splitBlocks = normalizeSplitLinkFieldsInBlocks(calculatorBlocks);
  const presetBlocks = normalizePresetBearingBlocks(splitBlocks);
  const canonicalBlocks = canonicalizeRouteLinkEditableFieldsInBlocks(
    normalizeSplitLinkFieldsInBlocks(presetBlocks),
  );
  // Seed and local bootstrap paths use this helper before the shared-state
  // normalizer runs. Apply the same non-destructive family normalization here
  // so legacy records enter the editor with canonical identity from the first
  // render.
  return canonicalBlocks.map(normalizeContentAdminBlock);
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
    .filter(Boolean)
    .filter((token) => !HERO_COLOR_CLASS_TOKENS.has(token.toLowerCase()));
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
  const requiredColorToken = extractHeroColorClassTokenFromClassName(requiredClassName);
  const resolvedColorToken = colorToken || requiredColorToken;
  if (resolvedColorToken && !nextTokens.some((token) => token.toLowerCase() === resolvedColorToken)) {
    nextTokens.push(resolvedColorToken);
  }
  return nextTokens.join(' ').trim();
}

function enforceHeroClassNameField(settings, field, requiredClassName, options = {}) {
  if (
    Object.prototype.hasOwnProperty.call(settings, field)
    && !String(settings[field] || '').trim()
  ) {
    return;
  }
  settings[field] = enforceHeroBaseClassName(settings[field], requiredClassName, options);
}

function normalizeLoansHeroSettings(rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const contract = getHeroSeedContract('/services/loans');
  let next = {
    ...settings,
    animationPreset: String(settings.animationPreset || '').trim() || contract?.animationPreset || 'loans-unblur',
    bgTone: String(settings.bgTone || '').trim() || contract?.bgTone || 'white',
    justify: String(settings.justify || '').trim() || contract?.justify || 'center',
    actionJustify: String(settings.actionJustify || '').trim() || contract?.actionJustify || 'center',
    heightMode: String(settings.heightMode || '').trim() || 'default',
    lineHeight: Number.isFinite(Number(settings.lineHeight)) ? Number(settings.lineHeight) : contract?.lineHeight || 0.9,
    lineGap: Number.isFinite(Number(settings.lineGap)) ? Number(settings.lineGap) : contract?.lineGap || 0,
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
  enforceHeroClassNameField(
    next,
    'line1ClassName',
    contract?.lines?.[0]?.className || 'loans-native-hero-line is-vision',
    { dropTokens: ['lineblur'] },
  );
  enforceHeroClassNameField(
    next,
    'line2ClassName',
    contract?.lines?.[1]?.className || 'loans-native-hero-line is-purpose',
    { dropTokens: ['lineb'] },
  );

  return next;
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

    if (!Object.prototype.hasOwnProperty.call(next, labelKey)) {
      next[labelKey] = action.label;
    }
    if (
      !Object.prototype.hasOwnProperty.call(next, pageRefKey)
      && !Object.prototype.hasOwnProperty.call(next, urlKey)
    ) {
      if (action.pageRef) {
        next[pageRefKey] = action.pageRef;
      } else if (action.url) {
        next[urlKey] = action.url;
      }
    }
    if (!Object.prototype.hasOwnProperty.call(next, actionKey) && action.action) {
      next[actionKey] = action.action;
    }
    if (!Object.prototype.hasOwnProperty.call(next, targetAnchorIdKey) && action.targetAnchorId) {
      next[targetAnchorIdKey] = action.targetAnchorId;
    }
    if (!Object.prototype.hasOwnProperty.call(next, targetBlockIdKey) && action.targetBlockId) {
      next[targetBlockIdKey] = action.targetBlockId;
    }
    if (!Object.prototype.hasOwnProperty.call(next, styleKey) && action.style) {
      next[styleKey] = action.style;
    }
    if (!Object.prototype.hasOwnProperty.call(next, toneKey) && action.tone) {
      next[toneKey] = action.tone;
    }
    if (!Object.prototype.hasOwnProperty.call(next, openKey) || next[openKey] == null) {
      next[openKey] = Boolean(action.openInNewWindow);
    }
  });

  return next;
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

function withDefaultHeroLine(settings, config) {
  const next = { ...settings };
  const textKey = `line${config.line}Text`;
  const classKey = `line${config.line}ClassName`;
  const highlightsKey = `line${config.line}HighlightsJson`;

  const hasText = Object.prototype.hasOwnProperty.call(next, textKey);
  const hasClassName = Object.prototype.hasOwnProperty.call(next, classKey);

  if (!hasText) {
    next[textKey] = config.defaultText;
  }
  if (!hasClassName && config.defaultClassName) {
    next[classKey] = config.defaultClassName;
  }
  if (!Object.prototype.hasOwnProperty.call(next, highlightsKey) && config.defaultHighlightsJson) {
    next[highlightsKey] = config.defaultHighlightsJson;
  } else if (!String(config.defaultHighlightsJson || '').trim() && !Object.prototype.hasOwnProperty.call(next, highlightsKey)) {
    next[highlightsKey] = '';
  }

  return next;
}

const GENEROSITY_FUND_DONOR_ADVISED_FUND_TITLE = 'Donor Advised Fund';
const GENEROSITY_FUND_RETIRED_ROUTE_REFS = Object.freeze([
  RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH,
  PLANNED_GIVING_GENEROSITY_FUND_LEGACY_PATH,
]);

function normalizeGenerosityFundPageHierarchyEntry(pathname, rawPage) {
  if (pathname !== LEGACY_GIVING_GENEROSITY_FUND_PATH || !rawPage || typeof rawPage !== 'object') {
    return rawPage;
  }

  return {
    ...rawPage,
    path: LEGACY_GIVING_GENEROSITY_FUND_PATH,
    routeKey: LEGACY_GIVING_GENEROSITY_FUND_PATH,
    linkRef: LEGACY_GIVING_GENEROSITY_FUND_PATH,
    title: GENEROSITY_FUND_DONOR_ADVISED_FUND_TITLE,
    breadcrumbLabel: GENEROSITY_FUND_DONOR_ADVISED_FUND_TITLE,
  };
}

function normalizeGenerosityFundRouteLabelInJsonString(value) {
  const source = String(value || '').trim();
  if (
    !source
    || (
      !source.includes(LEGACY_GIVING_GENEROSITY_FUND_PATH)
      && !GENEROSITY_FUND_RETIRED_ROUTE_REFS.some((routeRef) => source.includes(routeRef))
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
        const path = String(node[key] || '').trim();
        if (GENEROSITY_FUND_RETIRED_ROUTE_REFS.includes(path)) {
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
    if (
      typeof value !== 'string'
      || (
        !value.includes(LEGACY_GIVING_GENEROSITY_FUND_PATH)
        && !GENEROSITY_FUND_RETIRED_ROUTE_REFS.some((routeRef) => value.includes(routeRef))
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

function normalizeHeroSettingsByPath(pathname, rawSettings) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};

  if (pathname === '/') {
    const contract = getHeroSeedContract(pathname);
    let next = { ...settings };
    if (!String(next.animationPreset || '').trim()) {
      next.animationPreset = contract?.animationPreset || 'default';
    }
    if (!String(next.bgTone || '').trim()) {
      next.bgTone = contract?.bgTone || 'white';
    }
    if (!String(next.justify || '').trim()) {
      next.justify = contract?.justify || 'left';
    }
    if (!Number.isFinite(Number(next.titleSizeRem)) && Number.isFinite(Number(contract?.titleSizeRem))) {
      next.titleSizeRem = Number(contract.titleSizeRem);
    }
    if (!Number.isFinite(Number(next.lineHeight))) {
      next.lineHeight = contract?.lineHeight || 0.9;
    }
    if (!Number.isFinite(Number(next.lineGap))) {
      next.lineGap = contract?.lineGap || 0;
    }
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
    enforceHeroClassNameField(next, 'line1ClassName', contract?.lines?.[0]?.className || 'home-native-eyebrow');
    enforceHeroClassNameField(next, 'line2ClassName', contract?.lines?.[1]?.className || 'home-native-title line1 line2');
    enforceHeroClassNameField(next, 'line3ClassName', contract?.lines?.[2]?.className || 'home-native-title line3');
    if (!String(next.actionJustify || '').trim()) {
      next.actionJustify = contract?.actionJustify || 'left';
    }
    next = withDefaultHeroActions(next, contract);
    return next;
  }

  if (pathname === '/services/investments') {
    const contract = getHeroSeedContract(pathname);
    let next = { ...settings };
    if (!String(next.animationPreset || '').trim()) {
      next.animationPreset = contract?.animationPreset || 'default';
    }
    if (!String(next.bgTone || '').trim()) {
      next.bgTone = contract?.bgTone || 'white';
    }
    if (!String(next.justify || '').trim()) {
      next.justify = contract?.justify || 'left';
    }
    if (!Number.isFinite(Number(next.lineHeight))) {
      next.lineHeight = contract?.lineHeight || 0.9;
    }
    if (!Number.isFinite(Number(next.lineGap))) {
      next.lineGap = contract?.lineGap || 0;
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
    enforceHeroClassNameField(next, 'line1ClassName', contract?.lines?.[0]?.className || 'line1');
    enforceHeroClassNameField(next, 'line2ClassName', contract?.lines?.[1]?.className || 'line2');
    enforceHeroClassNameField(next, 'line3ClassName', contract?.lines?.[2]?.className || 'line3');
    if (!String(next.actionJustify || '').trim()) {
      next.actionJustify = contract?.actionJustify || 'left';
    }
    return next;
  }

  if (pathname === '/services/retirement') {
    const contract = getHeroSeedContract(pathname);
    let next = { ...settings };
    if (!String(next.animationPreset || '').trim()) {
      next.animationPreset = contract?.animationPreset || 'default';
    }
    if (!String(next.bgTone || '').trim()) {
      next.bgTone = contract?.bgTone || 'white';
    }
    if (!String(next.justify || '').trim()) {
      next.justify = contract?.justify || 'center';
    }
    if (!Number.isFinite(Number(next.lineHeight))) {
      next.lineHeight = contract?.lineHeight || 0.9;
    }
    if (!Number.isFinite(Number(next.lineGap))) {
      next.lineGap = contract?.lineGap || 0;
    }
    next = withDefaultHeroLine(next, {
      line: 1,
      defaultText: contract?.lines?.[0]?.text || 'Invest in tomorrow.',
      defaultClassName: contract?.lines?.[0]?.className || 'retirement-native-hero-line line1',
      defaultHighlightsJson: contract?.lines?.[0]?.highlightsJson || '[{"text":"tomorrow","className":"is-atlantean"}]',
    });
    next = withDefaultHeroLine(next, {
      line: 2,
      defaultText: contract?.lines?.[1]?.text || 'Start today.',
      defaultClassName: contract?.lines?.[1]?.className || 'retirement-native-hero-line line2',
      defaultHighlightsJson: contract?.lines?.[1]?.highlightsJson || '[{"text":"today","className":"is-mango"}]',
    });
    enforceHeroClassNameField(next, 'line1ClassName', contract?.lines?.[0]?.className || 'retirement-native-hero-line line1');
    enforceHeroClassNameField(next, 'line2ClassName', contract?.lines?.[1]?.className || 'retirement-native-hero-line line2');
    if (!String(next.actionJustify || '').trim()) {
      next.actionJustify = contract?.actionJustify || 'center';
    }
    return next;
  }

  if (pathname === '/services/loans') {
    return settings;
  }

  return settings;
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

export function inspectDynamicHeroSettings(pathname, rawSettings) {
  const sourceSettings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const normalizedSettings = normalizeDynamicHeroSettings(pathname, sourceSettings);
  // This inspection is intentionally read-only. Missing optional defaults are
  // resolved for rendering, but saved admin settings are never reported as
  // drift and never repaired toward a route contract here.
  const repairedFields = [];

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
  if (bodyHtml.includes('native React with saved-page copy restoration')) {
    return true;
  }
  return false;
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

function buildDefaultBlocks() {
  const blocksByPath = {};

  sitePages.forEach((page) => {
    if (page.path.startsWith('/admin/')) {
      return;
    }
    if (isBlocklessManagedPagePath(page.path)) {
      return;
    }

    const orderedBlueprint = contentBlockBlueprintsByPath[page.path] || genericPageFallbackBlueprint();
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
    let nextBlocks = [...seededBlocks];

    if (EMPTY_PAGE_CONTENT_SEED_DISABLED_PATHS.has(page.path)) {
      nextBlocks = nextBlocks.filter((block) => {
        if (!isPageContentBlock(block)) {
          return true;
        }
        const html = String(block?.settings?.html || '').trim();
        return Boolean(html && html !== '<p></p>' && html !== '<p><br></p>');
      });
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
  const hasStoredStateShape = Boolean(
    payload
    && typeof payload === 'object'
    && payload.pageHierarchy
    && payload.blocksByPath
    && payload.pathAliases
    && payload.collaborationByPath,
  );
  if (hasStoredStateShape) {
    return normalizeContentAdminState(payload);
  }
  const defaultHierarchy = buildDefaultPageHierarchy();
  const defaultBlocks = Object.fromEntries(
    Object.entries(buildDefaultBlocks()).map(([path, blocks]) => [path, normalizeManagedBlockList(blocks)]),
  );

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
    rawPageHierarchy[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH]
    && !rawPageHierarchy[LEGACY_GIVING_GENEROSITY_FUND_PATH]
  ) {
    rawPageHierarchy[LEGACY_GIVING_GENEROSITY_FUND_PATH] = {
      ...rawPageHierarchy[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH],
      path: LEGACY_GIVING_GENEROSITY_FUND_PATH,
      routeKey: LEGACY_GIVING_GENEROSITY_FUND_PATH,
      linkRef: LEGACY_GIVING_GENEROSITY_FUND_PATH,
      parentPath: PLANNED_GIVING_OVERVIEW_PATH,
    };
  }
  delete rawPageHierarchy[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH];
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
    pageHierarchy[path] = normalizeGenerosityFundPageHierarchyEntry(path, {
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
    });
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
    Array.isArray(storedBlocksByPathSource[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH])
    && !Array.isArray(storedBlocksByPathSource[LEGACY_GIVING_GENEROSITY_FUND_PATH])
  ) {
    storedBlocksByPathSource[LEGACY_GIVING_GENEROSITY_FUND_PATH] = storedBlocksByPathSource[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH];
  }
  delete storedBlocksByPathSource[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH];
  if (
    Array.isArray(storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH])
    && !Array.isArray(storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_PATH])
  ) {
    storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_PATH] = storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  }
  delete storedBlocksByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  delete storedBlocksByPathSource[RETIREMENT_403B_GROUP_OVERVIEW_LEGACY_PATH];

  const storedBlocksByPath = storedBlocksByPathSource;
  const hasAuthoritativeStoredBlocks = (
    payload.blocksByPath
    && typeof payload.blocksByPath === 'object'
  );
  const blocksByPath = hasAuthoritativeStoredBlocks ? {} : { ...defaultBlocks };

  Object.entries(storedBlocksByPath).forEach(([path, storedBlocks]) => {
    if (!Array.isArray(storedBlocks)) {
      return;
    }
    if (isBlocklessManagedPagePath(path)) {
      return;
    }

    const defaultForPath = Array.isArray(defaultBlocks[path]) ? defaultBlocks[path] : [];
    const defaultById = new Map(defaultForPath.map((block) => [block.id, block]));
    const normalizedStoredBlocks = dedupeBlocksByIdPreferLatest(storedBlocks)
      .map((block) => normalizeIraContributionLimitsChart(path, block))
      .map((block) => normalize403bContributionLimitsChart(path, block))
      .map((block) => normalizeRetirementIraRatesBlock(path, block))
      .map((block) => normalizeRetirement403bRatesBlock(path, block));
    const canonicalFormOwner = inferCanonicalFormOwner(defaultForPath);
    let retiredBlockOnlyShellBlock = false;
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
        path === LEGACY_GIVING_GENEROSITY_FUND_PATH
        && storedBlockId === 'traditional_daf_cta'
      ) {
        return;
      }
      if (
        path === LEGACY_GIVING_CHARITABLE_TRUSTS_PATH
        && RETIRED_CHARITABLE_TRUSTS_BLOCK_IDS.includes(storedBlockId)
      ) {
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
        isBlockOnlyManagedPagePath(path)
        && isPageContentBlock(storedBlock)
      ) {
        return;
      }
      if (shouldRetireBlockOnlyShellBlock(path, storedBlock, defaultById)) {
        retiredBlockOnlyShellBlock = true;
        return;
      }
      if (path === '/rates' && storedBlock.id === 'disclaimer' && storedKind === 'legal_copy') {
        return;
      }
      seenIds.add(effectiveStoredBlockId);
      const matchingDefaultBlock = defaultById.get(effectiveStoredBlockId);
      const matchingDefaultKind = String(matchingDefaultBlock?.kind || '').trim().toLowerCase();
      const isRetiredPageContentImageBridgeMigration = shouldUpgradeRetiredPageContentImageBridge(
        storedBlock,
        matchingDefaultBlock,
      );
      const defaultBlock = (
        matchingDefaultBlock
        && (
          !storedKind
          || !matchingDefaultKind
          || storedKind === matchingDefaultKind
          || isRetiredPageContentImageBridgeMigration
        )
      )
        ? matchingDefaultBlock
        : null;
      if (!defaultBlock) {
        mergedInStoredOrder.push(storedBlock);
        return;
      }

      let storedMode = String(storedBlock.mode || defaultBlock.mode || '').trim().toLowerCase() || defaultBlock.mode;
      let nextStoredBlock = effectiveStoredBlockId !== storedBlockId
        ? {
            ...storedBlock,
            id: effectiveStoredBlockId,
            name: defaultBlock?.name || storedBlock?.name || 'Loan Details',
          }
        : storedBlock;
      if (isRetiredPageContentImageBridgeMigration) {
        storedMode = 'dynamic';
        nextStoredBlock = upgradeRetiredPageContentImageBridge(defaultBlock, storedBlock);
      }
      if (
        isBlockOnlyManagedPagePath(path)
        && defaultBlock
        && String(defaultBlock?.mode || '').trim().toLowerCase() === 'dynamic'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock);
      }
      if (
        REQUEST_FORM_MODE_LOCKED_PATHS.has(path)
        && storedBlock.id === 'request_form'
        && storedKind === 'request_form'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock, { hidden: false });
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
      if (nextStoredBlock?.settings && typeof nextStoredBlock.settings === 'object') {
        nextStoredBlock = {
          ...nextStoredBlock,
          settings: normalizeGenerosityFundRouteLabelsInSettings(nextStoredBlock.settings),
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
        nextStoredBlock = upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock);
      }
      if (
        path === '/services/investments'
        && storedBlock.id === 'cash_reserves'
        && storedKind === 'feature_panel'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock);
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
        nextStoredBlock = upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock);
      }
      if (
        path === '/'
        && storedBlock.id === 'impact_stat'
        && storedKind === 'impact_stat'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock);
      }
      if (
        path === '/'
        && HOME_LOCKED_DYNAMIC_BLOCK_IDS.has(storedBlock.id)
        && storedMode !== 'dynamic'
        && defaultBlock?.mode === 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock);
      }
      if (
        path === '/'
        && storedBlock.id === 'services_grid'
        && storedKind === 'services_grid'
        && storedMode !== 'dynamic'
      ) {
        storedMode = 'dynamic';
        nextStoredBlock = upgradeStoredBlockToDynamicBlueprint(defaultBlock, storedBlock);
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
      const mergedSettings = storedBlock.id === 'intro' && storedMode === 'dynamic'
        ? normalizeIntroBodyMirror({
          ...(modeVariant.settings || {}),
          ...(nextStoredBlock.settings || {}),
        })
        : {
            ...(modeVariant.settings || {}),
            ...(nextStoredBlock.settings || {}),
          };
      const mergedBlock = {
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
        settings: normalizeRetirement403bSectionClassSettings(path, mergedSettings, modeVariant.settings),
        // Field schema should come from the current mode variant blueprint so admin UI upgrades appear automatically.
        editableFields: Array.isArray(modeVariant.editableFields) ? modeVariant.editableFields : [],
      };
      mergedInStoredOrder.push(normalizeBlockPresentation(mergedBlock));
    });

    const normalizedMergedBlocksBase = mergedInStoredOrder;
    const normalizedMergedBlocks = path === LEGACY_GIVING_CHARITABLE_GIFT_ANNUITIES_PATH
      ? restoreMissingDefaultBlocksById(defaultForPath, normalizedMergedBlocksBase, new Set(['state_notices']))
      : normalizedMergedBlocksBase;
    const reconciledBlocks = (
      retiredBlockOnlyShellBlock
      || path === LEGACY_GIVING_GENEROSITY_FUND_PATH
    )
      ? reconcileBlockOnlyManagedBlockInventory(path, defaultForPath, normalizedMergedBlocks)
      : normalizedMergedBlocks;
    blocksByPath[path] = normalizeManagedBlockList(reconciledBlocks);
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
    collaborationByPathSource[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH]
    && !collaborationByPathSource[LEGACY_GIVING_GENEROSITY_FUND_PATH]
  ) {
    collaborationByPathSource[LEGACY_GIVING_GENEROSITY_FUND_PATH] = collaborationByPathSource[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH];
  }
  delete collaborationByPathSource[RETIRED_PLANNED_GIVING_GENEROSITY_FUND_PATH];
  if (
    collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH]
    && !collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_PATH]
  ) {
    collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_PATH] = collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  }
  delete collaborationByPathSource[RETIREMENT_403B_GROUP_ENROLLMENT_LEGACY_PATH];
  delete collaborationByPathSource[RETIREMENT_403B_GROUP_OVERVIEW_LEGACY_PATH];
  const normalizedCollaborationByPathSource = { ...collaborationByPathSource };
  const collaborationByPath = normalizeCollaborationState(normalizedCollaborationByPathSource);

  return { pageHierarchy, blocksByPath, pathAliases, collaborationByPath };
}

function readInitialState() {
  if (isDevContentAuthorityEnabled()) {
    return buildFastInitialContentAdminState();
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

// The public renderer can use native page content while the shared admin state
// hydrates. Keep first paint independent of the multi-megabyte admin snapshot.
export function buildFastInitialContentAdminState() {
  return buildFastInitialState({
    sitePages,
    defaultPathAliases: DEFAULT_MANAGED_PATH_ALIASES,
  });
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
    if (!snapshot?.initialized || !hasContentAdminSnapshotStateContent(snapshot)) {
      return seedState;
    }
    const nextState = snapshot?.state || snapshot?.payload?.state;
    if (!nextState) {
      return seedState;
    }
    const normalizedAuthoringState = normalizeContentAdminAuthorityState(nextState);
    const normalizedPublishedState = normalizeContentAdminAuthorityState(
      snapshot?.baseSnapshot || snapshot?.payload?.baseSnapshot || nextState,
    );
    return {
      ...normalizedAuthoringState,
      __contentAdminBootstrap: {
        authoringState: normalizedAuthoringState,
        publishedState: normalizedPublishedState,
        updatedAt: Number(snapshot?.updatedAt) || 0,
        seedBaseline: snapshot?.seedBaseline || null,
        publishedRevisionsByPath: snapshot?.publishedRevisionsByPath || {},
      },
    };
  } catch {
    return seedState;
  }
}

export function ContentAdminProvider({ children, initialState = null }) {
  const initialBootstrapState = parseInitialContentAdminBootstrapState({
    initialState,
    normalizeStoredConfig,
    readInitialState,
    normalizeAuthorityState: normalizeContentAdminAuthorityState,
  });
  const sharedAuthorityEnabled = isDevContentAuthorityEnabled();
  const [state, setState] = useState(initialBootstrapState.authoringState);
  const [publishedState, setPublishedState] = useState(initialBootstrapState.publishedState);
  const [devIdentity, setDevIdentity] = useState(readInitialDevIdentity);
  const [devAdminProfiles, setDevAdminProfiles] = useState(readStoredDevAdminProfiles);
  const [lastSharedSaveResult, setLastSharedSaveResult] = useState(null);
  const [lastSharedPublishResult, setLastSharedPublishResult] = useState(null);
  const [sharedPublishStatus, setSharedPublishStatus] = useState(PUBLISH_STATUS.DRAFT_SYNCED);
  const [bufferedBlockSettingEdits, setBufferedBlockSettingEdits] = useState({});
  const [sharedSnapshotUpdatedAt, setSharedSnapshotUpdatedAt] = useState(initialBootstrapState.updatedAt);
  const [sharedSeedBaseline, setSharedSeedBaseline] = useState(initialBootstrapState.seedBaseline);
  const [sharedSyncState, setSharedSyncState] = useState({
    pendingMutationCount: 0,
    hasQueuedDraftSync: false,
    lastQueuedAt: 0,
    lastSettledAt: 0,
    lastAppliedAt: 0,
    lastError: null,
  });
  const stateRef = useRef(state);
  const hasPersistedNormalizedInitialStateRef = useRef(false);
  const bufferedBlockSettingEditsRef = useRef(bufferedBlockSettingEdits);
  const persistedSharedAuthoringStateRef = useRef(toComparableAuthoringState(initialBootstrapState.authoringState));
  const publishedSharedAuthoringStateRef = useRef(toComparableAuthoringState(initialBootstrapState.publishedState));
  const publishedStateRef = useRef(initialBootstrapState.publishedState);
  const publishedRouteRevisionsRef = useRef(new Map(
    Object.entries(initialBootstrapState.publishedRevisionsByPath || {})
      .map(([pathname, revision]) => [String(pathname || '').trim(), String(revision || '').trim()])
      .filter(([pathname, revision]) => pathname && revision),
  ));
  const pendingSharedMutationCountRef = useRef(0);
  const pendingBlockDraftSyncEntriesRef = useRef(new Map());
  const routeDraftSaveChainRef = useRef(Promise.resolve());
  const bufferedBlockSettingCommitTimersRef = useRef(new Map());
  const externalDraftFlushHandlersRef = useRef(new Map());
  const externalDraftStatusHandlersRef = useRef(new Map());
  const latestSharedMutationIdRef = useRef(0);
  const latestSharedUpdatedAtRef = useRef(0);
  const latestPublishOperationByTargetRef = useRef(new Map());

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

  const rememberPublishedRouteRevisions = (snapshot, scopedPath = '') => {
    const revisionsByPath = snapshot?.publishedRevisionsByPath
      || snapshot?.payload?.publishedRevisionsByPath
      || {};
    Object.entries(revisionsByPath).forEach(([pathname, revision]) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedRevision = String(revision || '').trim();
      if (normalizedPath && normalizedRevision) {
        publishedRouteRevisionsRef.current.set(normalizedPath, normalizedRevision);
      }
    });
    const normalizedScopedPath = String(scopedPath || '').trim();
    const scopedRevision = String(
      snapshot?.publishedRevision
      || snapshot?.authority?.publishedRevision
      || snapshot?.payload?.publishedRevision
      || '',
    ).trim();
    if (normalizedScopedPath && scopedRevision) {
      publishedRouteRevisionsRef.current.set(normalizedScopedPath, scopedRevision);
    }
  };

  const updatePublishedSharedAuthoringState = (snapshot, scopedPath = '') => {
    rememberPublishedRouteRevisions(snapshot, scopedPath);
    const nextPublishedState = snapshot?.baseSnapshot || snapshot?.payload?.baseSnapshot;
    if (!nextPublishedState) {
      return false;
    }
    const normalizedPublishedState = normalizeContentAdminAuthorityState(nextPublishedState);
    const normalizedScopedPath = String(scopedPath || '').trim();
    const currentComparablePublishedState = publishedSharedAuthoringStateRef.current;
    const currentPublishedState = publishedStateRef.current;
    const mergedPublishedState = normalizedScopedPath
      ? {
        ...currentPublishedState,
        pageHierarchy: Object.prototype.hasOwnProperty.call(normalizedPublishedState.pageHierarchy || {}, normalizedScopedPath)
          ? {
            ...currentPublishedState.pageHierarchy,
            [normalizedScopedPath]: normalizedPublishedState.pageHierarchy[normalizedScopedPath],
          }
          : currentPublishedState.pageHierarchy,
        blocksByPath: Object.prototype.hasOwnProperty.call(normalizedPublishedState.blocksByPath || {}, normalizedScopedPath)
          ? {
            ...currentPublishedState.blocksByPath,
            [normalizedScopedPath]: normalizedPublishedState.blocksByPath[normalizedScopedPath],
          }
          : currentPublishedState.blocksByPath,
        pathAliases: {
          ...currentPublishedState.pathAliases,
          ...normalizedPublishedState.pathAliases,
        },
      }
      : normalizedPublishedState;
    const nextComparablePublishedState = toComparableAuthoringState(mergedPublishedState);
    const didChange = (
      collectDirtyComparableAuthoringPaths(currentComparablePublishedState, nextComparablePublishedState).length > 0
      || JSON.stringify(currentComparablePublishedState.pathAliases || {}) !== JSON.stringify(nextComparablePublishedState.pathAliases || {})
    );
    publishedSharedAuthoringStateRef.current = nextComparablePublishedState;
    publishedStateRef.current = mergedPublishedState;
    if (didChange) {
      setPublishedState(mergedPublishedState);
    }
    return didChange;
  };

  const reconcilePublishedPublishResponse = (response, request) => {
    const validation = validatePublishResponse(response, request);
    if (!validation.ok) {
      return validation;
    }
    const targetKey = request.scope === 'block'
      ? `${request.pathname}::${request.blockId}`
      : request.pathname;
    const latestOperationId = latestPublishOperationByTargetRef.current.get(targetKey);
    if (!isPublishOperationResponseCurrent(response, latestOperationId)) {
      return { ok: false, reason: 'stale-publish-response', stale: true };
    }
    updatePublishedSharedAuthoringState(response, request.pathname);
    return { ok: true };
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
    if (!nextState || !hasContentAdminSnapshotStateContent(snapshot)) {
      return false;
    }
    updatePublishedSharedAuthoringState(snapshot);
    const nextUpdatedAt = Number(snapshot.updatedAt) || 0;
    latestSharedUpdatedAtRef.current = nextUpdatedAt;
    if (nextUpdatedAt) {
      setSharedSnapshotUpdatedAt(nextUpdatedAt);
      refreshSharedSyncState({ lastAppliedAt: nextUpdatedAt });
    }
    const normalizedSnapshotState = normalizeContentAdminAuthorityState(nextState);
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

  const stopPendingBlockDraftSyncsAfterAuthorityLoss = () => {
    const pendingEntries = pendingBlockDraftSyncEntriesRef.current;
    pendingEntries.forEach((entry, syncKey) => {
      if (typeof window !== 'undefined' && entry?.timeoutId) {
        window.clearTimeout(entry.timeoutId);
      }
      entry.timeoutId = null;
      entry.queued = false;
      if (entry.inFlight) {
        // Let the active request settle, but never let its finally handler
        // queue another write after the authority circuit opens.
        entry.discardAfterFailure = true;
        pendingEntries.set(syncKey, entry);
      } else {
        pendingEntries.delete(syncKey);
      }
    });
    refreshSharedSyncState({ lastSettledAt: Date.now() });
  };

  const awaitPendingBlockDraftSyncs = async () => {
    const pendingPromises = [...pendingBlockDraftSyncEntriesRef.current.values()]
      .map((entry) => entry?.inFlightPromise)
      .filter((promise) => promise && typeof promise.then === 'function');
    if (pendingPromises.length) {
      let timeoutId = null;
      try {
        await Promise.race([
          Promise.allSettled(pendingPromises),
          new Promise((resolve) => {
            timeoutId = setTimeout(resolve, SHARED_PENDING_BLOCK_DRAFT_WAIT_TIMEOUT_MS);
          }),
        ]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }
  };

  const clearPendingBlockDraftSyncTimer = (pathname, blockId) => {
    const normalizedPath = String(pathname || '').trim();
    const normalizedBlockId = String(blockId || '').trim();
    const syncKey = `${normalizedPath}::${normalizedBlockId}`;
    const pendingEntries = pendingBlockDraftSyncEntriesRef.current;
    const pendingEntry = pendingEntries.get(syncKey);
    if (typeof window !== 'undefined' && pendingEntry?.timeoutId) {
      window.clearTimeout(pendingEntry.timeoutId);
    }
    pendingEntries.delete(syncKey);
    refreshSharedSyncState(
      pendingSharedMutationCountRef.current > 0
        ? {}
        : { lastSettledAt: Date.now() },
    );
  };

  const cancelPendingBlockDraftSync = (pathname, blockId) => {
    const normalizedPath = String(pathname || '').trim();
    const normalizedBlockId = String(blockId || '').trim();
    const syncKey = `${normalizedPath}::${normalizedBlockId}`;
    const pendingEntries = pendingBlockDraftSyncEntriesRef.current;
    const pendingEntry = pendingEntries.get(syncKey);
    if (!pendingEntry) {
      return { inFlight: false };
    }
    if (typeof window !== 'undefined' && pendingEntry.timeoutId) {
      window.clearTimeout(pendingEntry.timeoutId);
    }
    pendingEntry.timeoutId = null;
    pendingEntry.queued = false;
    if (pendingEntry.inFlight) {
      // Keep the entry until the request settles, but prevent its finally
      // handler from re-queuing the stale pre-reset block.
      pendingEntry.discardAfterFailure = true;
      pendingEntries.set(syncKey, pendingEntry);
      refreshSharedSyncState();
      return { inFlight: true };
    } else {
      pendingEntries.delete(syncKey);
    }
    refreshSharedSyncState(
      pendingSharedMutationCountRef.current > 0
        ? {}
        : { lastSettledAt: Date.now() },
    );
    return { inFlight: false };
  };

  const updateBufferedBlockSettingDrafts = (updater) => {
    // Keep the imperative buffer current before the next React render. Save and
    // publish actions flush this buffer synchronously after an editor blur/change.
    // Waiting for the state updater to run can otherwise make those actions read
    // the previous setting value and race the delayed draft sync.
    const previousValue = bufferedBlockSettingEditsRef.current;
    const nextValue = typeof updater === 'function' ? updater(previousValue) : updater;
    bufferedBlockSettingEditsRef.current = nextValue;
    setBufferedBlockSettingEdits((currentValue) => (
      currentValue === nextValue ? currentValue : nextValue
    ));
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

  const applySharedBlockDraftSnapshot = (snapshot, pathname, options = {}) => {
    const mergeCollaborationOnlyWhenDirty = Boolean(options?.mergeCollaborationOnlyWhenDirty);
    const nextState = snapshot?.state || snapshot?.payload?.state;
    const normalizedPath = String(pathname || '').trim();
    if (!nextState || !normalizedPath) {
      return false;
    }
    updatePublishedSharedAuthoringState(snapshot, normalizedPath);

    const nextUpdatedAt = Number(snapshot.updatedAt) || 0;
    latestSharedUpdatedAtRef.current = nextUpdatedAt;
    if (nextUpdatedAt) {
      setSharedSnapshotUpdatedAt(nextUpdatedAt);
      refreshSharedSyncState({ lastAppliedAt: nextUpdatedAt });
    }

    const normalizedSnapshotState = normalizeContentAdminAuthorityState(nextState);
    const currentComparableAuthoringState = toComparableAuthoringState(stateRef.current);
    const persistedComparableAuthoringState = persistedSharedAuthoringStateRef.current;
    const normalizedSnapshotComparableAuthoringState = toComparableAuthoringState(normalizedSnapshotState);
    const shouldApplyCollaborationPath = collectChangedCollaborationPaths(stateRef.current, normalizedSnapshotState)
      .includes(normalizedPath);
    const hasDirtyAuthoringPath = !compareComparableAuthoringPageSnapshot(
      currentComparableAuthoringState,
      persistedComparableAuthoringState,
      normalizedPath,
    );
    if (mergeCollaborationOnlyWhenDirty && hasDirtyAuthoringPath) {
      if (!shouldApplyCollaborationPath) {
        return false;
      }
      const mergedState = mergeSharedAuthoringSnapshot(stateRef.current, normalizedSnapshotState, {
        authoringPaths: [],
        collaborationPaths: [normalizedPath],
      });
      if (mergedState === stateRef.current) {
        return false;
      }
      stateRef.current = mergedState;
      setState(mergedState);
      return true;
    }
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

      if (event.key === DEV_ADMIN_PROFILES_STORAGE_KEY) {
        setDevAdminProfiles(readStoredDevAdminProfiles());
        setDevIdentity(readInitialDevIdentity());
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
    const currentActor = normalizeContentActor(devIdentity);
    const isAdminContentRoute = typeof window !== 'undefined'
      && window.location.pathname === '/admin/content';
    const getFrontHudPath = () => {
      if (typeof window === 'undefined' || String(window.location.pathname || '').startsWith('/admin/')) {
        return '';
      }
      return String(window.location.pathname || '/').trim() || '/';
    };
    const getAdminContentPath = () => {
      if (!isAdminContentRoute || typeof window === 'undefined') {
        return '';
      }
      return String(new URLSearchParams(window.location.search).get('page') || '/').trim() || '/';
    };
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
        const scopedPath = isAdminContentRoute && allowBootstrap
          ? getAdminContentPath()
          : getFrontHudPath();
        if (scopedPath && typeof fetchSharedContentRouteSnapshot === 'function') {
          try {
            const routeSnapshot = await fetchSharedContentRouteSnapshot(scopedPath);
            if (
              routeSnapshot?.initialized
              && hasContentAdminSnapshotStateContent(routeSnapshot)
              && !cancelled
            ) {
              applySharedBlockDraftSnapshot(routeSnapshot, scopedPath, {
                mergeCollaborationOnlyWhenDirty: allowBootstrap ? false : mergeCollaborationWhenDirty,
              });
              if (!isAdminContentRoute) {
                return;
              }
              // Give React a paint opportunity before loading the full shared snapshot.
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          } catch {
            // The full snapshot remains the fallback for admin-page hydration.
          }
        }
        let snapshot = await fetchSharedContentSnapshot();
        if (!snapshot?.initialized && allowBootstrap) {
          snapshot = await initializeSharedContentFromSeed(normalizeStoredConfig(null), currentActor);
        }
        if (!snapshot?.initialized || !hasContentAdminSnapshotStateContent(snapshot) || cancelled) {
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
    const {
      authoringPageHierarchy,
      authoringBlocksByPath,
      authoringPathAliases,
      collaborationByPath,
      pageHierarchy,
      blocksByPath,
      pathAliases,
    } = buildContentAdminDisplayState({
      sharedAuthorityEnabled,
      state,
      publishedState,
      bufferedBlockSettingEdits,
      applyBufferedBlockSettingEdits: applyBufferedBlockSettingEditsToState,
    });
    const availableBlockTemplates = getAllBlockTemplateBlueprints();
    const blockTemplateById = buildContentAdminTemplateIndex(availableBlockTemplates);
    const currentActor = normalizeContentActor(devIdentity);
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
        publishedStateRef.current = computedState;
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
      publishedStateRef.current = nextState;
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
          settings: normalizeSplitLinkFieldSettings(nextSettings, { stripSplitFields: true }),
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
          { mergeCollaborationOnlyWhenDirty: true, scopedPath: normalizedPath },
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
          { mergeCollaborationOnlyWhenDirty: true, scopedPath: normalizedPath },
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
      const scopedPath = String(options?.scopedPath || '').trim();
      const operationLabel = String(options?.operationLabel || 'shared content sync');
      const reportSyncError = (error) => {
        refreshSharedSyncState({
          lastError: {
            operation: operationLabel,
            status: Number(error?.status) || null,
            message: error?.payload?.details || error?.payload?.error || error?.message || 'The shared content request failed.',
            endpoint: error?.endpoint || '',
            owner: error?.payload?.owner || null,
            state: error?.payload?.state || '',
            updatedAt: Date.now(),
          },
        });
      };
      if (!sharedAuthorityEnabled) {
        return Promise.resolve(null);
      }
      if (isSharedAuthorityCircuitOpen()) {
        return Promise.resolve(null);
      }
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      return Promise.resolve()
        .then(operation)
        .then((snapshot) => {
          refreshSharedSyncState({ lastError: null });
          const nextState = snapshot?.state || snapshot?.payload?.state;
          if (!nextState || latestSharedMutationIdRef.current !== mutationId) {
            return snapshot;
          }
          if (scopedPath) {
            applySharedBlockDraftSnapshot(snapshot, scopedPath, { mergeCollaborationOnlyWhenDirty });
          } else {
            applySharedSnapshotState(snapshot, { mergeCollaborationOnlyWhenDirty });
          }
          return snapshot;
        })
        .catch(async (operationError) => {
          reportSyncError(operationError);
          if (operationError?.code === 'content-admin-authority-lost') {
            stopPendingBlockDraftSyncsAfterAuthorityLoss();
            return null;
          }
          try {
            let snapshot;
            try {
              snapshot = scopedPath
                ? await fetchSharedContentRouteSnapshot(scopedPath)
                : await fetchSharedContentSnapshot();
            } catch (routeError) {
              if (!scopedPath || !String(routeError?.message || '').includes('No "fetchSharedContentRouteSnapshot" export')) {
                throw routeError;
              }
              snapshot = await fetchSharedContentSnapshot();
            }
            if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
              if (scopedPath) {
                applySharedBlockDraftSnapshot(snapshot, scopedPath, { mergeCollaborationOnlyWhenDirty });
              } else {
                applySharedSnapshotState(snapshot, { mergeCollaborationOnlyWhenDirty });
              }
            }
            return snapshot;
          } catch (followUpError) {
            reportSyncError(followUpError);
            return null;
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

      const syncPromise = Promise.resolve()
        .then(() => syncSharedBlockDraft(normalizedPath, normalizedBlockId, latestBlock, currentActor, {
          expectedPublishedRevision: pendingEntry.expectedPublishedRevision,
        }))
        .then((snapshot) => {
          if (snapshot?.state) {
            pendingEntry.lastSyncedSerializedBlock = latestSerializedBlock;
            if (latestSharedMutationIdRef.current === mutationId) {
              applySharedBlockDraftSnapshot(snapshot, normalizedPath);
            }
          }
        })
        .catch(async (error) => {
          if (error?.code === 'content-admin-authority-lost') {
            pendingEntry.discardAfterFailure = true;
            stopPendingBlockDraftSyncsAfterAuthorityLoss();
            return;
          }
          const stalePublishedRevision = error?.payload?.error === 'block-draft-sync-stale-published-revision';
          if (stalePublishedRevision) {
            pendingEntry.discardAfterFailure = true;
          }
          try {
            let snapshot;
            try {
              snapshot = await fetchSharedContentRouteSnapshot(normalizedPath);
            } catch (routeError) {
              if (!String(routeError?.message || '').includes('No "fetchSharedContentRouteSnapshot" export')) {
                throw routeError;
              }
              snapshot = await fetchSharedContentSnapshot();
            }
            if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
              applySharedBlockDraftSnapshot(snapshot, normalizedPath, {
                mergeCollaborationOnlyWhenDirty: !stalePublishedRevision,
              });
              if (stalePublishedRevision && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent(EDITOR_DRAFT_PUBLISHED_EVENT, {
                  detail: {
                    pathname: normalizedPath,
                    blockIds: [normalizedBlockId],
                  },
                }));
              }
            }
          } catch {
            // ignore follow-up sync failures
          }
        })
        .finally(() => {
          pendingEntry.inFlight = false;
          bumpPendingSharedMutationCount(-1);
          if (pendingEntry.discardAfterFailure) {
            pendingEntries.delete(syncKey);
            refreshSharedSyncState({ lastSettledAt: Date.now() });
            return;
          }
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
      pendingEntry.inFlightPromise = syncPromise;
      pendingEntries.set(syncKey, pendingEntry);
    };

    const scheduleSharedBlockDraftSync = (pathname, blockId, options = {}) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!sharedAuthorityEnabled || isSharedAuthorityCircuitOpen() || !currentActor || !normalizedPath || !normalizedBlockId || typeof window === 'undefined') {
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
        expectedPublishedRevision: publishedRouteRevisionsRef.current.get(normalizedPath) || '',
        discardAfterFailure: false,
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
          { mergeCollaborationOnlyWhenDirty: true, scopedPath: pathname },
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
            { mergeCollaborationOnlyWhenDirty: true, scopedPath: pathname },
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
          { mergeCollaborationOnlyWhenDirty: true, scopedPath: pathname },
        );
      }
      // Structural changes use the same explicit page-draft workflow as the
      // rest of the editor. Saving here raced the ownership-lock request and
      // could persist a new order without a usable saved-draft record.
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
          { mergeCollaborationOnlyWhenDirty: true, scopedPath: pathname },
        );
      }
      // See moveBlock: keep the reorder local until the admin saves the page
      // draft, rather than racing an automatic route save against its lock.
    };

  const addBlock = (pathname, templateId, insertIndex) => {
      const template = blockTemplateById.get(String(templateId || '').trim());
      if (!template) {
        return;
      }

      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[pathname] || [];
        const templateContent = Object.fromEntries(
          Object.entries(template).filter(([key]) => ![
            'templateLookupId',
            'createTemplateId',
            'isReusableTemplate',
            'isAddBlockDefault',
            'excludeFromInsertCatalog',
          ].includes(key)),
        );
        const nextBlock = {
          ...templateContent,
          id: toUniqueBlockId(templateContent.templateId || templateContent.id, pageBlocks),
          name: normalizeBlockDisplayName(templateContent.name, templateContent.mode, templateContent.name, templateContent.kind),
          settings: JSON.parse(JSON.stringify(templateContent.settings || {})),
          editableFields: JSON.parse(JSON.stringify(Array.isArray(templateContent.editableFields) ? templateContent.editableFields : [])),
        };
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
      if (sharedAuthorityEnabled && currentActor) {
        void queueSharedRouteDraftSave('Add block to page draft', pathname);
      }
    };

    const removeBlock = (pathname, blockId) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId) {
        return;
      }
      let didRemoveBlock = false;
      clearBufferedBlockSettingCommitTimer(normalizedPath, normalizedBlockId);
      clearPendingBlockDraftSyncTimer(normalizedPath, normalizedBlockId);
      updateBufferedBlockSettingDrafts((previous) => {
        const previousPathEntry = previous?.[normalizedPath];
        if (!previousPathEntry?.[normalizedBlockId]) {
          return previous;
        }
        const nextPathEntry = { ...previousPathEntry };
        delete nextPathEntry[normalizedBlockId];
        if (!Object.keys(nextPathEntry).length) {
          const nextValue = { ...previous };
          delete nextValue[normalizedPath];
          return nextValue;
        }
        return { ...previous, [normalizedPath]: nextPathEntry };
      });
      saveState((prevState) => {
        const prevBlocksByPath = prevState.blocksByPath || {};
        const pageBlocks = prevBlocksByPath[normalizedPath] || [];
        const nextBlocks = pageBlocks.filter((block) => String(block?.id || '').trim() !== normalizedBlockId);
        if (nextBlocks.length === pageBlocks.length) {
          return prevState;
        }
        didRemoveBlock = true;
        const nextCollaborationByPath = updateCollaborationForPath(prevState, normalizedPath, (entry) => {
          const nextBlocksMeta = { ...(entry.blocks || {}) };
          delete nextBlocksMeta[normalizedBlockId];
          return {
            ...entry,
            blocks: nextBlocksMeta,
            history: appendHistoryEntry(entry.history, buildHistoryEntry({
              action: 'block-removed',
              blockId: normalizedBlockId,
              actor: currentActor,
            })),
          };
        });

        return {
          ...prevState,
          blocksByPath: {
            ...prevBlocksByPath,
            [normalizedPath]: normalizePageBlocksState(nextBlocks),
          },
          collaborationByPath: nextCollaborationByPath,
        };
      });
      if (didRemoveBlock && sharedAuthorityEnabled && currentActor) {
        void queueSharedRouteDraftSave('Remove block from page draft', normalizedPath);
      }
    };

    const renameDevIdentity = (nextDisplayName) => {
      const nextIdentity = devIdentity?.userId
        ? (updateStoredDevAdminProfile(devIdentity.userId, {
            fullName: devIdentity.fullName || nextDisplayName,
            nickname: nextDisplayName,
          }) || renameStoredDevIdentity(nextDisplayName))
        : renameStoredDevIdentity(nextDisplayName);
      if (nextIdentity) {
        setDevIdentity(getOrCreateDevIdentity());
        setDevAdminProfiles(readStoredDevAdminProfiles());
      }
      return getOrCreateDevIdentity();
    };

    const setDevIdentityAccentColor = (nextAccentColor) => {
      const nextIdentity = devIdentity?.userId
        ? (updateStoredDevAdminProfile(devIdentity.userId, { accentColor: nextAccentColor })
          || setStoredDevIdentityAccentColor(nextAccentColor))
        : setStoredDevIdentityAccentColor(nextAccentColor);
      if (nextIdentity) {
        setDevIdentity(getOrCreateDevIdentity());
        setDevAdminProfiles(readStoredDevAdminProfiles());
      }
      return getOrCreateDevIdentity();
    };

    const selectDevAdminProfile = (userId) => {
      const nextIdentity = selectStoredDevAdminProfile(userId);
      if (nextIdentity) {
        setDevIdentity(nextIdentity);
      }
      return nextIdentity;
    };

    const updateDevAdminProfile = (userId, patch = {}) => {
      const nextProfile = updateStoredDevAdminProfile(userId, patch);
      if (nextProfile) {
        setDevAdminProfiles(readStoredDevAdminProfiles());
        if (nextProfile.userId === devIdentity?.userId) {
          setDevIdentity(getOrCreateDevIdentity());
        }
      }
      return nextProfile;
    };

    const getBlockCollaboration = (pathname, blockId) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId) {
        return normalizeContentBlockMeta(null);
      }
      const meta = normalizeContentBlockMeta(collaborationByPath?.[normalizedPath]?.blocks?.[normalizedBlockId]);
      const authoringBlock = authoringBlocksByPath?.[normalizedPath]
        ?.find((block) => String(block?.id || '').trim() === normalizedBlockId);
      const publishedBlock = publishedState.blocksByPath?.[normalizedPath]
        ?.find((block) => String(block?.id || '').trim() === normalizedBlockId);
      if (
        authoringBlock
        && publishedBlock
        && JSON.stringify(authoringBlock) === JSON.stringify(publishedBlock)
      ) {
        return {
          ...meta,
          isPublishedEquivalent: true,
        };
      }
      return {
        ...meta,
        isNewBlock: Boolean(authoringBlock && !publishedBlock),
      };
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
            draftedBy: force && existingDraftedByOther ? currentActor : existingMeta.draftedBy,
            draftedAt: force && existingDraftedByOther ? now : existingMeta.draftedAt,
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
        const pending = syncSharedSnapshot(
          () => acquireSharedBlockLock(normalizedPath, normalizedBlockId, currentActor, { force }),
          { mergeCollaborationOnlyWhenDirty: true, scopedPath: normalizedPath },
        );
        return { ok: true, pending };
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
          {
            mergeCollaborationOnlyWhenDirty: true,
            scopedPath: normalizedPath,
            operationLabel: 'block lock release',
          },
        );
      } else {
        saveState(clearLockLocally);
      }

      return { ok: true };
    };

    const releaseActiveBlockDraft = async (pathname, blockId, options = {}) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      const force = Boolean(options?.force);
      if (!normalizedPath || !normalizedBlockId || !currentActor) {
        return { ok: false, reason: 'missing-target' };
      }

      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }

      try {
        const snapshot = await releaseSharedBlockDraft(
          normalizedPath,
          normalizedBlockId,
          currentActor,
          { force },
        );
        if (snapshot?.state) {
          applySharedBlockDraftSnapshot(snapshot, normalizedPath);
        }
        return snapshot;
      } catch (error) {
        return error?.payload || { ok: false, reason: 'draft-release-failed' };
      }
    };

    const refreshSharedStateAfterFailedMutation = async ({
      scopedPath = '',
      mutationId,
      mergeCollaborationOnlyWhenDirty = true,
    } = {}) => {
      const normalizedPath = String(scopedPath || '').trim();
      let authoritativeSnapshot = null;
      try {
        if (normalizedPath && typeof fetchSharedContentRouteSnapshot === 'function') {
          try {
            authoritativeSnapshot = await fetchSharedContentRouteSnapshot(normalizedPath);
          } catch (routeError) {
            if (!String(routeError?.message || '').includes('No "fetchSharedContentRouteSnapshot" export')) {
              throw routeError;
            }
          }
        }
        if (!authoritativeSnapshot) {
          authoritativeSnapshot = await fetchSharedContentSnapshot();
        }
        if (authoritativeSnapshot?.state && latestSharedMutationIdRef.current === mutationId) {
          if (normalizedPath) {
            applySharedBlockDraftSnapshot(authoritativeSnapshot, normalizedPath, {
              mergeCollaborationOnlyWhenDirty,
            });
          } else {
            applySharedSnapshotState(authoritativeSnapshot, { mergeCollaborationOnlyWhenDirty });
          }
        }
        return authoritativeSnapshot;
      } catch {
        return null;
      }
    };

    const saveSharedDraftNow = async (summary = '', scopedPathname = '') => {
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      setSharedPublishStatus(PUBLISH_STATUS.SAVING_DRAFT);
      flushExternalDraftBuffers();
      flushAllBufferedBlockSettings();
      await awaitPendingBlockDraftSyncs();
      clearPendingBlockDraftSyncTimers();
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      let failedScopedPath = String(scopedPathname || '').trim();
      try {
        const draftState = applyBufferedBlockSettingEditsToState(
          stateRef.current,
          bufferedBlockSettingEditsRef.current,
        );
        const normalizedScopedPath = String(scopedPathname || '').trim()
          || (() => {
            const dirtyPaths = collectDirtyAuthoringPaths(
              draftState,
              persistedSharedAuthoringStateRef.current,
            );
            const ownedCollaborationPaths = Object.entries(draftState.collaborationByPath || {})
              .filter(([, entry]) => Object.values(entry?.blocks || {}).some((meta) => (
                [meta?.draftedBy, meta?.savedBy, meta?.lockedBy]
                  .some((owner) => owner?.userId && owner.userId === currentActor?.userId)
              )))
              .map(([pathname]) => pathname);
            const scopedCandidates = [...new Set([...dirtyPaths, ...ownedCollaborationPaths])];
            return scopedCandidates.length === 1 ? scopedCandidates[0] : '';
          })();
        failedScopedPath = normalizedScopedPath;
        const routeState = normalizedScopedPath
          ? {
            pageHierarchy: {
              ...(draftState.pageHierarchy?.[normalizedScopedPath]
                ? { [normalizedScopedPath]: draftState.pageHierarchy[normalizedScopedPath] }
                : {}),
            },
            blocksByPath: {
              ...(Object.prototype.hasOwnProperty.call(draftState.blocksByPath || {}, normalizedScopedPath)
                ? { [normalizedScopedPath]: draftState.blocksByPath[normalizedScopedPath] }
                : {}),
            },
            collaborationByPath: {
              ...(Object.prototype.hasOwnProperty.call(draftState.collaborationByPath || {}, normalizedScopedPath)
                ? { [normalizedScopedPath]: draftState.collaborationByPath[normalizedScopedPath] }
                : {}),
            },
            pathAliases: draftState.pathAliases || {},
          }
          : null;
        let snapshot = null;
        if (normalizedScopedPath) {
          try {
            snapshot = await saveSharedRouteDraft(normalizedScopedPath, routeState, currentActor, summary);
          } catch (routeError) {
            if (!String(routeError?.message || '').includes('No "saveSharedRouteDraft" export')) {
              throw routeError;
            }
          }
        }
        if (!snapshot) {
          snapshot = await saveSharedPageDraft(draftState, currentActor, summary);
        }
        const shouldApplyReturnedSnapshot = !normalizedScopedPath
          || compareAuthoringPageSnapshot(stateRef.current, draftState, normalizedScopedPath);
        const normalizedSaveResult = normalizeSharedSaveResult({
          ...(snapshot?.saveResult || {}),
          error: snapshot?.error || snapshot?.saveResult?.error,
          updatedAt: snapshot?.updatedAt,
        });
        if (snapshot?.state && shouldApplyReturnedSnapshot) {
          if (normalizedScopedPath) {
            applySharedBlockDraftSnapshot(snapshot, normalizedScopedPath);
          } else {
            applySharedSnapshotState(snapshot);
          }
          if (normalizedSaveResult.status === 'partially-saved' || normalizedSaveResult.status === 'blocked') {
            const preservedState = preserveBlockedDraftContent(
              normalizeContentAdminAuthorityState(snapshot.state),
              draftState,
              normalizedSaveResult.blockedBlocks,
            );
            if (normalizedScopedPath) {
              const mergedPreservedState = mergeSharedAuthoringSnapshot(
                stateRef.current,
                preservedState,
                { authoringPaths: [normalizedScopedPath], collaborationPaths: [normalizedScopedPath] },
              );
              stateRef.current = mergedPreservedState;
              setState(mergedPreservedState);
            } else {
              stateRef.current = preservedState;
              setState(preservedState);
            }
          }
        }
        const saveCompleted = normalizedSaveResult.status === 'saved'
          || normalizedSaveResult.status === 'no-op';
        setLastSharedSaveResult(normalizedSaveResult);
        setSharedPublishStatus(saveCompleted ? PUBLISH_STATUS.DRAFT_SYNCED : PUBLISH_STATUS.PUBLISH_FAILED);
        return {
          ok: saveCompleted,
          reason: saveCompleted ? '' : normalizedSaveResult.status,
          snapshot,
          saveResult: normalizedSaveResult,
        };
      } catch (error) {
        const authorityFailure = describeAuthorityFailure(error, 'save-failed');
        const reason = authorityFailure.error;
        // A request can fail locally after the authority has committed it (for
        // example, a timeout). Re-read collaboration metadata before returning
        // failure so one browser cannot keep optimistic ownership badges that
        // other browsers will never see. Keep the local authoring content here;
        // the save still reports failure until the original request is known to
        // have completed.
        await refreshSharedStateAfterFailedMutation({
          scopedPath: failedScopedPath,
          mutationId,
          mergeCollaborationOnlyWhenDirty: true,
        });
        const failed = {
          ...authorityFailure,
          status: 'failed',
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
        refreshSharedSyncState({
          lastError: {
            operation: 'draft save',
            ...authorityFailure,
            message: authorityFailure.details,
            updatedAt: Date.now(),
          },
        });
        setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
        return {
          ok: false,
          reason,
          saveResult: failed,
        };
      } finally {
        bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
      }
    };

    const queueSharedRouteDraftSave = (summary = '', scopedPathname = '') => {
      const nextSave = routeDraftSaveChainRef.current
        .catch(() => null)
        .then(() => saveSharedDraftNow(summary, scopedPathname));
      routeDraftSaveChainRef.current = nextSave.catch(() => null);
      return nextSave;
    };

    const saveSharedBlockDraftNow = async (pathname, blockId, summary = '') => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      if (!normalizedPath || !normalizedBlockId) {
        return { ok: false, reason: 'invalid-block-target' };
      }

      setSharedPublishStatus(PUBLISH_STATUS.SAVING_DRAFT);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(EDITOR_DRAFT_FLUSH_EVENT));
      }
      flushExternalDraftBuffers();
      flushBufferedBlockSettings(normalizedPath, normalizedBlockId);
      clearPendingBlockDraftSyncTimer(normalizedPath, normalizedBlockId);
      await awaitPendingBlockDraftSyncs();
      await awaitQueuedRouteDraftSaves();

      const currentState = applyBufferedBlockSettingEditsToState(
        stateRef.current,
        bufferedBlockSettingEditsRef.current,
      );
      const currentBlock = currentState.blocksByPath?.[normalizedPath]
        ?.find((block) => String(block?.id || '').trim() === normalizedBlockId) || null;
      if (!currentBlock) {
        return { ok: false, reason: 'block-not-found' };
      }

      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      try {
        const snapshot = await saveSharedBlockDraft(
          normalizedPath,
          normalizedBlockId,
          currentBlock,
          currentActor,
          summary,
        );
        const normalizedSaveResult = normalizeSharedSaveResult({
          ...(snapshot?.saveResult || {}),
          error: snapshot?.error || snapshot?.saveResult?.error,
          updatedAt: snapshot?.updatedAt,
        });
        if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
          applySharedBlockDraftSnapshot(snapshot, normalizedPath);
        }
        const saveCompleted = normalizedSaveResult.status === 'saved'
          || normalizedSaveResult.status === 'no-op';
        setLastSharedSaveResult(normalizedSaveResult);
        setSharedPublishStatus(saveCompleted ? PUBLISH_STATUS.DRAFT_SYNCED : PUBLISH_STATUS.PUBLISH_FAILED);
        return {
          ok: saveCompleted,
          reason: saveCompleted ? '' : normalizedSaveResult.status,
          snapshot,
          saveResult: normalizedSaveResult,
        };
      } catch (error) {
        const authorityFailure = describeAuthorityFailure(error, 'block-save-failed');
        const reason = authorityFailure.error;
        // A request can fail locally after the authority has committed it (for
        // example, a timeout). Re-read collaboration metadata before returning
        // failure so one browser cannot keep an optimistic saved-by badge that
        // other browsers will never see. Keep the local authoring content here;
        // the save still reports failure until the original request is known to
        // have completed.
        await refreshSharedStateAfterFailedMutation({
          scopedPath: normalizedPath,
          mutationId,
          mergeCollaborationOnlyWhenDirty: true,
        });
        const failed = {
          ...authorityFailure,
          status: 'failed',
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
        refreshSharedSyncState({
          lastError: {
            operation: 'block draft save',
            ...authorityFailure,
            message: authorityFailure.details,
            updatedAt: Date.now(),
          },
        });
        setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
        return { ok: false, reason, saveResult: failed };
      } finally {
        bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
      }
    };

    const awaitQueuedRouteDraftSaves = async () => {
      const pendingRouteSave = routeDraftSaveChainRef.current;
      if (pendingRouteSave && typeof pendingRouteSave.then === 'function') {
        await pendingRouteSave.catch(() => null);
      }
    };

    const resetBlockToSavedDraft = (pathname, blockId) => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath || !normalizedBlockId) {
        return { ok: false, reason: 'invalid-block-target' };
      }

      const pendingSync = cancelPendingBlockDraftSync(normalizedPath, normalizedBlockId);
      if (pendingSync?.inFlight) {
        return {
          ok: false,
          reason: 'draft-save-pending',
          details: 'Wait for the current block draft save to finish before resetting local edits.',
        };
      }

      clearBufferedBlockSettingCommitTimer(normalizedPath, normalizedBlockId);
      updateBufferedBlockSettingDrafts((previous) => {
        const previousPathEntry = previous?.[normalizedPath];
        if (!previousPathEntry?.[normalizedBlockId]) {
          return previous;
        }
        const nextPathEntry = { ...previousPathEntry };
        delete nextPathEntry[normalizedBlockId];
        if (Object.keys(nextPathEntry).length) {
          return { ...previous, [normalizedPath]: nextPathEntry };
        }
        const nextValue = { ...previous };
        delete nextValue[normalizedPath];
        return nextValue;
      });
      clearPendingBlockDraftSyncTimer(normalizedPath, normalizedBlockId);
      latestSharedMutationIdRef.current += 1;

      const savedBlocks = Array.isArray(
        persistedSharedAuthoringStateRef.current.blocksByPath?.[normalizedPath],
      )
        ? persistedSharedAuthoringStateRef.current.blocksByPath[normalizedPath]
        : [];
      const savedBlock = savedBlocks.find((entry) => String(entry?.id || '').trim() === normalizedBlockId) || null;
      let didReset = false;

      saveState((previousState) => {
        const currentBlocks = Array.isArray(previousState.blocksByPath?.[normalizedPath])
          ? previousState.blocksByPath[normalizedPath]
          : [];
        const currentIndex = currentBlocks.findIndex((entry) => String(entry?.id || '').trim() === normalizedBlockId);
        if (currentIndex < 0 && !savedBlock) {
          return previousState;
        }

        const nextBlocks = currentBlocks.filter((entry) => String(entry?.id || '').trim() !== normalizedBlockId);
        if (savedBlock) {
          const savedIndex = savedBlocks.findIndex((entry) => String(entry?.id || '').trim() === normalizedBlockId);
          const insertIndex = Math.min(
            Math.max(currentIndex >= 0 ? currentIndex : savedIndex, 0),
            nextBlocks.length,
          );
          nextBlocks.splice(insertIndex, 0, savedBlock);
        }
        didReset = true;
        return {
          ...previousState,
          blocksByPath: {
            ...(previousState.blocksByPath || {}),
            [normalizedPath]: nextBlocks,
          },
        };
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EDITOR_DRAFT_RESET_EVENT, {
          detail: {
            pathname: normalizedPath,
            blockId: normalizedBlockId,
          },
        }));
      }

      return {
        ok: true,
        didReset,
        scope: 'block',
        pathname: normalizedPath,
        blockId: normalizedBlockId,
      };
    };

    const discardSharedPageDraftNow = async (pathname, summary = '') => {
      const normalizedPath = String(pathname || '').trim();
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      if (!normalizedPath) {
        return { ok: false, reason: 'invalid-path' };
      }

      clearBufferedBlockSettingCommitTimers();
      updateBufferedBlockSettingDrafts({});
      clearPendingBlockDraftSyncTimers();
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      try {
        const snapshot = await discardSharedPageDraft(normalizedPath, currentActor, summary);
        if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
          applySharedSnapshotState(snapshot);
        }
        setLastSharedSaveResult(normalizeSharedSaveResult({
          status: snapshot?.discardResult?.status === 'discarded' ? 'discarded' : 'no-op',
          didSave: false,
          changedPaths: snapshot?.discardResult?.changedPaths || [],
          updatedAt: snapshot?.discardResult?.updatedAt || snapshot?.updatedAt,
        }));
        return {
          ok: snapshot?.ok !== false,
          snapshot,
          discardResult: snapshot?.discardResult || null,
        };
      } catch (error) {
        const snapshot = error?.payload || null;
        if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
          applySharedSnapshotState(snapshot);
        }
        return {
          ok: false,
          reason: snapshot?.error || 'discard-draft-failed',
          details: snapshot?.details || (error instanceof Error ? error.message : 'discard-draft-failed'),
          snapshot,
        };
      } finally {
        bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
      }
    };

    const discardSharedBlockDraftNow = async (pathname, blockId, summary = '') => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      if (!normalizedPath || !normalizedBlockId) {
        return { ok: false, reason: 'invalid-block-target' };
      }

      clearBufferedBlockSettingCommitTimer(normalizedPath, normalizedBlockId);
      clearPendingBlockDraftSyncTimer(normalizedPath, normalizedBlockId);
      updateBufferedBlockSettingDrafts((previous) => {
        const previousPathEntry = previous?.[normalizedPath];
        if (!previousPathEntry?.[normalizedBlockId]) {
          return previous;
        }
        const nextPathEntry = { ...previousPathEntry };
        delete nextPathEntry[normalizedBlockId];
        if (!Object.keys(nextPathEntry).length) {
          const nextValue = { ...previous };
          delete nextValue[normalizedPath];
          return nextValue;
        }
        return { ...previous, [normalizedPath]: nextPathEntry };
      });
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      try {
        const snapshot = await discardSharedBlockDraft(
          normalizedPath,
          normalizedBlockId,
          currentActor,
          summary,
        );
        if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
          applySharedSnapshotState(snapshot);
        }
        setLastSharedSaveResult(normalizeSharedSaveResult({
          status: snapshot?.discardResult?.status === 'discarded' ? 'discarded' : 'no-op',
          didSave: false,
          changedPaths: snapshot?.discardResult?.changedPaths || [],
          savedBlockIdsByPath: {},
          updatedAt: snapshot?.discardResult?.updatedAt || snapshot?.updatedAt,
        }));
        return {
          ok: snapshot?.ok !== false,
          snapshot,
          discardResult: snapshot?.discardResult || null,
        };
      } catch (error) {
        const snapshot = error?.payload || null;
        if (snapshot?.state && latestSharedMutationIdRef.current === mutationId) {
          applySharedSnapshotState(snapshot);
        }
        return {
          ok: false,
          reason: snapshot?.error || 'discard-block-draft-failed',
          details: snapshot?.details || (error instanceof Error ? error.message : 'discard-block-draft-failed'),
          snapshot,
        };
      } finally {
        bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
      }
    };

    const notifyPublishedEditorDrafts = (pathname, blockIds = []) => {
      if (typeof window === 'undefined') {
        return;
      }
      window.dispatchEvent(new CustomEvent(EDITOR_DRAFT_PUBLISHED_EVENT, {
        detail: {
          pathname: String(pathname || '').trim(),
          blockIds: Array.isArray(blockIds) ? blockIds : [],
        },
      }));
    };

    const publishSharedPageNow = async (pathname, summary = '') => {
      const normalizedPath = String(pathname || '').trim();
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      if (!normalizedPath) {
        return { ok: false, reason: 'invalid-path' };
      }

      // Publish may first flush a local editor buffer, wait for its queued
      // route save, and then publish. Keep the UI honest during that work.
      setSharedPublishStatus(PUBLISH_STATUS.SAVING_DRAFT);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(EDITOR_DRAFT_FLUSH_EVENT));
      }
      flushExternalDraftBuffers();
      flushAllBufferedBlockSettings();
      await awaitPendingBlockDraftSyncs();
      clearPendingBlockDraftSyncTimers();
      await awaitQueuedRouteDraftSaves();
      const currentAuthoringState = applyBufferedBlockSettingEditsToState(stateRef.current, bufferedBlockSettingEditsRef.current);
      const pageSaveSummary = summarizeAuthoringPageChanges(
        currentAuthoringState,
        persistedSharedAuthoringStateRef.current,
        normalizedPath,
      );
      let expectedDraftRevision = '';
      if (pageSaveSummary.hasUnsavedChanges || hasPendingExternalDrafts(normalizedPath)) {
        setSharedPublishStatus(PUBLISH_STATUS.SAVING_DRAFT);
        const saveResult = await saveSharedDraftNow(summary, normalizedPath);
        const partialSaveCanContinue = saveResult?.reason === 'partially-saved'
          && !pageSaveSummary.hasOrderChanges
          && !pageSaveSummary.hasPageMetaChanges
          && Boolean(
            saveResult?.saveResult?.savedBlockIdsByPath?.[normalizedPath]?.length,
          );
        if (!saveResult?.ok && !partialSaveCanContinue) {
          return {
            ok: false,
            reason: saveResult?.reason || 'save-before-publish-failed',
            saveResult: saveResult?.saveResult || null,
          };
        }
        expectedDraftRevision = String(saveResult.snapshot?.draftRevision || '').trim();
      }

      const operationId = createPublishOperationId('page');
      const publishRequest = {
        operationId,
        pathname: normalizedPath,
        scope: 'page',
        expectedDraftRevision,
      };
      latestPublishOperationByTargetRef.current.set(normalizedPath, operationId);
      setSharedPublishStatus(PUBLISH_STATUS.PUBLISHING);
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      try {
        const snapshot = await publishSharedPage(normalizedPath, currentActor, summary, {
          operationId,
          expectedDraftRevision,
        });
        const reconciliation = reconcilePublishedPublishResponse(snapshot, publishRequest);
        if (reconciliation.stale) {
          return { ok: false, reason: 'stale-publish-response', snapshot, stale: true };
        }
        if (!reconciliation.ok && !reconciliation.stale) {
          setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
          throw Object.assign(new Error(reconciliation.reason), { code: reconciliation.reason, payload: snapshot });
        }
        if (snapshot?.state) {
          applySharedBlockDraftSnapshot(snapshot, normalizedPath);
        }
        const normalizedPublishResult = normalizeSharedPublishResult({
          ...(snapshot?.publishResult || {}),
          error: snapshot?.ok === false ? snapshot?.error : '',
          updatedAt: snapshot?.updatedAt,
        });
        if (snapshot?.ok !== false && normalizedPublishResult.didPublish) {
          notifyPublishedEditorDrafts(
            normalizedPath,
            normalizedPublishResult.publishedBlockIdsByPath?.[normalizedPath] || [],
          );
        }
        setLastSharedPublishResult(normalizedPublishResult);
        setSharedPublishStatus(snapshot?.ok === false
          ? PUBLISH_STATUS.PUBLISH_FAILED
          : PUBLISH_STATUS.LIVE_CONFIRMED);
        return {
          ok: snapshot?.ok !== false,
          snapshot,
          publishResult: normalizedPublishResult,
        };
      } catch (error) {
        const snapshot = error?.payload || null;
        const isTimeout = error?.code === 'content-admin-request-timeout';
        if (isTimeout) {
          setSharedPublishStatus(PUBLISH_STATUS.STATUS_UNKNOWN);
          setSharedPublishStatus(PUBLISH_STATUS.VERIFYING);
          try {
            const verification = await fetchSharedPublishStatus(operationId);
            const verificationState = classifyPublishVerification(verification);
            if (verificationState === 'COMMITTED') {
              const reconciliation = reconcilePublishedPublishResponse(verification, publishRequest);
              if (reconciliation.stale) {
                return { ok: false, reason: 'stale-publish-response', snapshot: verification, stale: true };
              }
              setSharedPublishStatus(PUBLISH_STATUS.LIVE_CONFIRMED);
              const normalizedPublishResult = normalizeSharedPublishResult(verification.publishResult || {
                status: 'published',
                didPublish: true,
                updatedAt: verification.publishedAt,
              });
              notifyPublishedEditorDrafts(
                normalizedPath,
                normalizedPublishResult.publishedBlockIdsByPath?.[normalizedPath] || [],
              );
              setLastSharedPublishResult(normalizedPublishResult);
              return { ok: true, snapshot: verification, publishResult: normalizedPublishResult };
            }
            if (verificationState === 'NOT_COMMITTED') {
              setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
              return { ok: false, reason: 'publish-not-committed', snapshot: verification };
            }
            setSharedPublishStatus(PUBLISH_STATUS.STATUS_UNKNOWN);
            return {
              ok: false,
              reason: 'publish-status-unknown',
              status: PUBLISH_STATUS.STATUS_UNKNOWN,
              operationId,
            };
          } catch {
            setSharedPublishStatus(PUBLISH_STATUS.STATUS_UNKNOWN);
            return {
              ok: false,
              reason: 'publish-status-unknown',
              status: PUBLISH_STATUS.STATUS_UNKNOWN,
              operationId,
            };
          }
        }
        if (snapshot?.publishResult || snapshot?.error) {
          const normalizedPublishResult = normalizeSharedPublishResult({
            ...(snapshot?.publishResult || {}),
            error: snapshot?.error || '',
            updatedAt: snapshot?.updatedAt,
          });
          setLastSharedPublishResult(normalizedPublishResult);
          setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
          return {
            ok: false,
            reason: snapshot?.error || 'publish-failed',
            snapshot,
            publishResult: normalizedPublishResult,
          };
        }
        const authorityFailure = describeAuthorityFailure(error, 'publish-failed');
        const failed = {
          ...authorityFailure,
          status: 'failed',
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
        refreshSharedSyncState({
          lastError: {
            operation: 'live publish',
            ...authorityFailure,
            message: authorityFailure.details,
            updatedAt: Date.now(),
          },
        });
        setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
        return {
          ok: false,
          reason: error?.code || 'publish-failed',
          publishResult: failed,
        };
      } finally {
        bumpPendingSharedMutationCount(-1, { lastSettledAt: Date.now() });
      }
    };

    const publishSharedBlockNow = async (pathname, blockId, summary = '') => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!sharedAuthorityEnabled) {
        return { ok: false, reason: 'shared-authority-disabled' };
      }
      if (!normalizedPath || !normalizedBlockId) {
        return { ok: false, reason: 'invalid-block-target' };
      }

      setSharedPublishStatus(PUBLISH_STATUS.SAVING_DRAFT);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(EDITOR_DRAFT_FLUSH_EVENT));
      }
      flushExternalDraftBuffers();
      flushBufferedBlockSettings(normalizedPath, normalizedBlockId);
      await awaitPendingBlockDraftSyncs();
      clearPendingBlockDraftSyncTimer(normalizedPath, normalizedBlockId);
      await awaitQueuedRouteDraftSaves();
      let currentAuthoringState = applyBufferedBlockSettingEditsToState(
        stateRef.current,
        bufferedBlockSettingEditsRef.current,
      );
      const currentComparableAuthoringState = toComparableAuthoringState(currentAuthoringState);
      const publishPageSummary = summarizeComparableAuthoringPageChanges(
        currentComparableAuthoringState,
        publishedSharedAuthoringStateRef.current,
        normalizedPath,
      );
      // Block content and page order have different ownership boundaries. If
      // the selected block is part of an order change, publish the route so
      // the order can go live without attempting to overwrite another
      // admin's content draft through the block endpoint.
      if (publishPageSummary.hasOrderChanges) {
        return publishSharedPageNow(normalizedPath, summary);
      }
      let expectedBlock = currentAuthoringState.blocksByPath?.[normalizedPath]
        ?.find((block) => String(block?.id || '').trim() === normalizedBlockId) || null;
      let expectedDraftRevision = '';
      const persistedBlock = persistedSharedAuthoringStateRef.current.blocksByPath?.[normalizedPath]
        ?.find((block) => String(block?.id || '').trim() === normalizedBlockId) || null;
      const blockHasUnsavedChanges = JSON.stringify(expectedBlock) !== JSON.stringify(persistedBlock)
        || hasPendingExternalDrafts(normalizedPath, normalizedBlockId);
      if (blockHasUnsavedChanges) {
        setSharedPublishStatus(PUBLISH_STATUS.SAVING_DRAFT);
        const saveResult = await saveSharedBlockDraftNow(normalizedPath, normalizedBlockId, summary);
        if (!saveResult?.ok) {
          return {
            ok: false,
            reason: saveResult?.reason || 'save-before-block-publish-failed',
            saveResult: saveResult?.saveResult || null,
          };
        }
        expectedDraftRevision = String(saveResult.snapshot?.draftRevision || '').trim();
        currentAuthoringState = applyBufferedBlockSettingEditsToState(
          stateRef.current,
          bufferedBlockSettingEditsRef.current,
        );
        expectedBlock = saveResult.snapshot?.state?.blocksByPath?.[normalizedPath]
          ?.find((block) => String(block?.id || '').trim() === normalizedBlockId) || expectedBlock;
        if (!expectedBlock || JSON.stringify(expectedBlock) !== JSON.stringify(
          currentAuthoringState.blocksByPath?.[normalizedPath]
            ?.find((block) => String(block?.id || '').trim() === normalizedBlockId) || null,
        )) {
          return {
            ok: false,
            reason: 'block-draft-not-saved',
            saveResult: saveResult?.saveResult || null,
          };
        }
      }
      const operationId = createPublishOperationId('block');
      const publishRequest = {
        operationId,
        pathname: normalizedPath,
        scope: 'block',
        blockId: normalizedBlockId,
        expectedDraftRevision,
      };
      latestPublishOperationByTargetRef.current.set(`${normalizedPath}::${normalizedBlockId}`, operationId);
      setSharedPublishStatus(PUBLISH_STATUS.PUBLISHING);
      const mutationId = latestSharedMutationIdRef.current + 1;
      latestSharedMutationIdRef.current = mutationId;
      bumpPendingSharedMutationCount(1, { lastQueuedAt: Date.now() });
      try {
        const snapshot = await publishSharedBlock(
          normalizedPath,
          normalizedBlockId,
          currentActor,
          summary,
          expectedBlock,
          {
            operationId,
            expectedDraftRevision,
          },
        );
        const publishedBlock = snapshot?.publishedBlock
          || snapshot?.baseSnapshot?.blocksByPath?.[normalizedPath]
            ?.find((block) => String(block?.id || '').trim() === normalizedBlockId)
          || null;
        if (snapshot?.ok !== false && expectedBlock && publishedBlock
          && JSON.stringify(publishedBlock) !== JSON.stringify(normalizeContentAdminBlock(expectedBlock))) {
          const verificationFailure = normalizeSharedPublishResult({
            ...(snapshot?.publishResult || {}),
            error: 'block-publish-verification-failed',
            didPublish: false,
            updatedAt: snapshot?.updatedAt,
          });
          setLastSharedPublishResult(verificationFailure);
          return {
            ok: false,
            reason: 'block-publish-verification-failed',
            snapshot,
            publishResult: verificationFailure,
          };
        }
        const reconciliation = reconcilePublishedPublishResponse(snapshot, publishRequest);
        if (reconciliation.stale) {
          return { ok: false, reason: 'stale-publish-response', snapshot, stale: true };
        }
        if (!reconciliation.ok && !reconciliation.stale) {
          setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
          throw Object.assign(new Error(reconciliation.reason), { code: reconciliation.reason, payload: snapshot });
        }
        if (snapshot?.state) {
          applySharedBlockDraftSnapshot(snapshot, normalizedPath);
        }
        const normalizedPublishResult = normalizeSharedPublishResult({
          ...(snapshot?.publishResult || {}),
          error: snapshot?.ok === false ? snapshot?.error : '',
          updatedAt: snapshot?.updatedAt,
        });
        if (snapshot?.ok !== false && normalizedPublishResult.didPublish) {
          notifyPublishedEditorDrafts(normalizedPath, [normalizedBlockId]);
        }
        setLastSharedPublishResult(normalizedPublishResult);
        setSharedPublishStatus(snapshot?.ok === false
          ? PUBLISH_STATUS.PUBLISH_FAILED
          : PUBLISH_STATUS.LIVE_CONFIRMED);
        return {
          ok: snapshot?.ok !== false,
          snapshot,
          publishResult: normalizedPublishResult,
        };
      } catch (error) {
        const snapshot = error?.payload || null;
        const isTimeout = error?.code === 'content-admin-request-timeout';
        if (isTimeout) {
          setSharedPublishStatus(PUBLISH_STATUS.STATUS_UNKNOWN);
          setSharedPublishStatus(PUBLISH_STATUS.VERIFYING);
          try {
            const verification = await fetchSharedPublishStatus(operationId);
            const verificationState = classifyPublishVerification(verification);
            if (verificationState === 'COMMITTED') {
              const reconciliation = reconcilePublishedPublishResponse(verification, publishRequest);
              if (reconciliation.stale) {
                return { ok: false, reason: 'stale-publish-response', snapshot: verification, stale: true };
              }
              setSharedPublishStatus(PUBLISH_STATUS.LIVE_CONFIRMED);
              const normalizedPublishResult = normalizeSharedPublishResult(verification.publishResult || {
                status: 'published',
                didPublish: true,
                updatedAt: verification.publishedAt,
              });
              notifyPublishedEditorDrafts(normalizedPath, [normalizedBlockId]);
              setLastSharedPublishResult(normalizedPublishResult);
              return { ok: true, snapshot: verification, publishResult: normalizedPublishResult };
            }
            if (verificationState === 'NOT_COMMITTED') {
              setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
              return { ok: false, reason: 'publish-not-committed', snapshot: verification };
            }
            setSharedPublishStatus(PUBLISH_STATUS.STATUS_UNKNOWN);
            return {
              ok: false,
              reason: 'publish-status-unknown',
              status: PUBLISH_STATUS.STATUS_UNKNOWN,
              operationId,
            };
          } catch {
            setSharedPublishStatus(PUBLISH_STATUS.STATUS_UNKNOWN);
            return {
              ok: false,
              reason: 'publish-status-unknown',
              status: PUBLISH_STATUS.STATUS_UNKNOWN,
              operationId,
            };
          }
        }
        if (snapshot?.publishResult || snapshot?.error) {
          const normalizedPublishResult = normalizeSharedPublishResult({
            ...(snapshot?.publishResult || {}),
            error: snapshot?.error || '',
            updatedAt: snapshot?.updatedAt,
          });
          setLastSharedPublishResult(normalizedPublishResult);
          setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
          return {
            ok: false,
            reason: snapshot?.error || 'block-publish-failed',
            snapshot,
            publishResult: normalizedPublishResult,
          };
        }
        const authorityFailure = describeAuthorityFailure(error, 'block-publish-failed');
        const reason = authorityFailure.error;
        const failed = normalizeSharedPublishResult({
          ...authorityFailure,
          status: 'failed',
          didPublish: false,
          updatedAt: Date.now(),
        });
        setLastSharedPublishResult(failed);
        refreshSharedSyncState({
          lastError: {
            operation: 'block live publish',
            ...authorityFailure,
            message: authorityFailure.details,
            updatedAt: Date.now(),
          },
        });
        setSharedPublishStatus(PUBLISH_STATUS.PUBLISH_FAILED);
        return { ok: false, reason, publishResult: failed };
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
      await awaitPendingBlockDraftSyncs();
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

    const hasPendingExternalDrafts = (pathname, blockId = '') => {
      const normalizedPath = String(pathname || '').trim();
      const normalizedBlockId = String(blockId || '').trim();
      if (!normalizedPath) {
        return false;
      }
      for (const getStatus of externalDraftStatusHandlersRef.current.values()) {
        try {
          const status = getStatus();
          if (
            String(status?.pathname || '').trim() === normalizedPath
            && Boolean(normalizedBlockId
              ? status?.pendingBlockIds?.includes(normalizedBlockId)
              : status?.hasPendingDrafts)
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
      devAdminProfiles,
      pageHierarchy,
      blocksByPath,
      publishedPageHierarchy: publishedState.pageHierarchy,
      publishedBlocksByPath: publishedState.blocksByPath,
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
      setDevIdentityAccentColor,
      selectDevAdminProfile,
      updateDevAdminProfile,
      getBlockCollaboration,
      getPageHistory,
      lastSharedSaveResult,
      lastSharedPublishResult,
      sharedPublishStatus,
      sharedSnapshotUpdatedAt,
      sharedSeedBaseline,
      getPublishedRevisionForPath: (pathname) => publishedRouteRevisionsRef.current.get(String(pathname || '').trim()) || '',
      sharedSyncStatus: {
        isPending: sharedSyncState.pendingMutationCount > 0 || sharedSyncState.hasQueuedDraftSync,
        pendingMutationCount: sharedSyncState.pendingMutationCount,
        hasQueuedDraftSync: sharedSyncState.hasQueuedDraftSync,
        lastQueuedAt: sharedSyncState.lastQueuedAt,
        lastSettledAt: sharedSyncState.lastSettledAt,
        lastAppliedAt: sharedSyncState.lastAppliedAt,
        lastError: sharedSyncState.lastError,
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
        state,
        publishedState,
      ),
      saveSharedDraftNow,
      saveSharedBlockDraftNow,
      resetBlockToSavedDraft,
      discardSharedPageDraft: discardSharedPageDraftNow,
      discardSharedBlockDraft: discardSharedBlockDraftNow,
      publishSharedPageNow,
      publishSharedBlockNow,
      registerExternalDraftFlushHandler,
      registerExternalDraftStatusHandler,
      hasPendingExternalDrafts,
      getPageRevisionHistory,
      getSharedContentBackups,
      promoteContentAdminToSeed,
      setActiveBlockLock,
      clearActiveBlockLock,
      releaseActiveBlockDraft,
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
    devAdminProfiles,
    sharedAuthorityEnabled,
    lastSharedSaveResult,
    lastSharedPublishResult,
    sharedPublishStatus,
    sharedSnapshotUpdatedAt,
    sharedSeedBaseline,
    sharedSyncState,
    bufferedBlockSettingEdits,
  ]);

  return <ContentAdminContext.Provider value={value}>{children}</ContentAdminContext.Provider>;
}
