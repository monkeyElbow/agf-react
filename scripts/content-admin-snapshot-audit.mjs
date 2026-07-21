#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCtaFormSlotFields,
  parseCtaFormFieldsJson,
} from '../src/blocks/foundation/forms.js';
import {
  coerceLinkValueFromFields,
  getCanonicalLinkJsonFieldId,
  parseLinkValueJson,
  serializeLinkValue,
  validateLinkValue,
} from '../src/lib/linkValue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const ACTIVE_RECORDS = Object.freeze([
  {
    label: 'shared',
    relativePath: 'dev-data/content-admin-shared.json',
    type: 'shared',
  },
  {
    label: 'seed-baseline',
    relativePath: 'dev-data/content-admin-seed-baseline.json',
    type: 'seed',
  },
]);

const ALLOWED_PAGE_CONTENT_PATHS = new Set(['/brand', '/taxguide']);
const RETIRED_CONTENT_PATHS = new Set([
  '/services/legacy-giving',
  '/services/legacy-giving/charitable-gift-annuities',
  '/services/legacy-giving/charitable-trusts',
  '/services/legacy-giving/endowments',
  '/services/legacy-giving/generosity-fund',
  '/services/legacy-giving/ministry-impact-fund',
  '/services/retirement/403b-for-groups',
  '/services/retirement/403b-for-groups/403b-group-enrollment',
]);
const TARGET_BRIDGE_KEYS = new Set([
  'targetSectionKey',
  'targetFineprintSectionKey',
  'targetSectionClassName',
  'targetSectionIndex',
]);
const SPLIT_LINK_HREF_SUFFIXES = Object.freeze(['Url', 'Path', 'Href']);
const CTA_FORM_SLOT_FIELD_PATTERN = /^field[1-5](?:Enabled|Type|Label|Placeholder|Options|Required|Key)$/;
const CANONICAL_LINK_JSON_PATTERN = /LinkJson$/;

function trimSettingValue(value) {
  return String(value || '').trim();
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function listBackupRecords() {
  const backupRoot = path.resolve(repoRoot, 'dev-data/backups');
  if (!existsSync(backupRoot)) {
    return [];
  }

  return readdirSync(backupRoot)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => ({
      label: `backup:${fileName}`,
      relativePath: `dev-data/backups/${fileName}`,
      type: 'backup',
    }));
}

function normalizeRecordPayload(rawRecord) {
  if (rawRecord?.record && typeof rawRecord.record === 'object') {
    return rawRecord.record;
  }
  return rawRecord && typeof rawRecord === 'object' ? rawRecord : {};
}

function getStateRoots(record, recordType) {
  if (recordType === 'seed') {
    return [
      ['seedState', record.seedState],
    ];
  }

  return [
    ['state', record.state],
    ['baseSnapshot', record.baseSnapshot],
  ];
}

function blockSignature(block) {
  return {
    id: String(block?.id || ''),
    kind: String(block?.kind || ''),
    mode: String(block?.mode || ''),
    hidden: Boolean(block?.hidden),
  };
}

function hasTargetBridgeSettings(block) {
  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : {};
  return Object.keys(settings).some((key) => TARGET_BRIDGE_KEYS.has(key));
}

function isPageContentBlock(block) {
  return block?.id === 'page_content' || block?.kind === 'page_content';
}

function getSplitLinkHrefKeys(settings, baseKey) {
  return SPLIT_LINK_HREF_SUFFIXES
    .map((suffix) => `${baseKey}${suffix}`)
    .filter((key) => Object.prototype.hasOwnProperty.call(settings, key));
}

function isRetiredBlock(pathname, block) {
  const blockId = String(block?.id || '').trim();
  const kind = String(block?.kind || '').trim();
  const widget = String(block?.settings?.widget || '').trim();
  const sectionClassName = String(block?.settings?.sectionClassName || '').trim();

  if (pathname === '/services/retirement/403b') {
    return blockId === 'strategy_enroll_cta'
      || blockId === 'page_content'
      || kind === 'page_content'
      || (blockId === 'investment_strategy_options' && kind === 'card_grid');
  }

  if (pathname === '/services/planned-giving') {
    return blockId === 'comparison_matrix'
      || widget === 'giving-comparison-matrix'
      || sectionClassName.split(/\s+/).includes('legacy-giving-comparison-matrix');
  }

  return false;
}

function createFinding(code, message, context = {}) {
  return {
    code,
    message,
    ...context,
  };
}

function scanSplitLinkSettings({ settings, findings, location }) {
  Object.entries(settings).forEach(([key, value]) => {
    if (/OpenInNewWindow$/.test(key) && value !== true && value !== false) {
      findings.push(createFinding('split-link-new-window-not-boolean', 'Split link open-in-new-window flag must be boolean.', {
        ...location,
        field: key,
      }));
    }

    if (!/PageRef$/.test(key)) {
      return;
    }

    findings.push(createFinding('split-link-page-ref-persisted', 'Split link PageRef compatibility fields must not persist after canonical LinkJson migration.', {
      ...location,
      field: key,
    }));

    const pageRef = trimSettingValue(value);
    const baseKey = key.replace(/PageRef$/, '');
    const hrefKeys = getSplitLinkHrefKeys(settings, baseKey);

    if (pageRef && !pageRef.startsWith('/')) {
      findings.push(createFinding('split-link-page-ref-not-internal', 'Split link PageRef fields must only contain internal paths.', {
        ...location,
        field: key,
      }));
    }

    hrefKeys.forEach((hrefKey) => {
      const href = trimSettingValue(settings[hrefKey]);
      if (pageRef && href && !href.startsWith('/')) {
        findings.push(createFinding('split-link-target-conflict', 'Split link URL/path must not conflict with an internal PageRef companion.', {
          ...location,
          field: hrefKey,
          companionField: key,
        }));
        return;
      }

      if (!href.startsWith('/')) {
        return;
      }

      if (!pageRef) {
        findings.push(createFinding('split-link-page-ref-missing', 'Internal split link URL/path is missing its PageRef companion.', {
          ...location,
          field: hrefKey,
          companionField: key,
        }));
        return;
      }

      if (href !== pageRef) {
        findings.push(createFinding('split-link-internal-target-drift', 'Internal split link URL/path and PageRef fields point to different paths.', {
          ...location,
          field: hrefKey,
          companionField: key,
        }));
      }
    });

    const linkValue = coerceLinkValueFromFields(settings, {
      hrefKeys,
      toKeys: [key],
      openInNewWindowKeys: [`${baseKey}OpenInNewWindow`],
      preferLinkJson: false,
    });
    const expectedLinkJson = serializeLinkValue(linkValue);
    if (!expectedLinkJson) {
      return;
    }

    const linkJsonKey = getCanonicalLinkJsonFieldId(baseKey);
    const actualLinkJson = trimSettingValue(settings[linkJsonKey]);
    if (!actualLinkJson) {
      findings.push(createFinding('canonical-link-json-missing', 'Split link fields must also be represented by canonical link JSON.', {
        ...location,
        field: linkJsonKey,
        companionField: key,
      }));
      return;
    }

    if (actualLinkJson !== expectedLinkJson) {
      findings.push(createFinding('canonical-link-json-mismatch', 'Canonical link JSON must match its split compatibility fields.', {
        ...location,
        field: linkJsonKey,
        companionField: key,
      }));
    }
  });
}

function scanCanonicalLinkJsonSettings({ settings, findings, location }) {
  Object.entries(settings).forEach(([key, value]) => {
    if (!CANONICAL_LINK_JSON_PATTERN.test(key)) {
      return;
    }

    const rawValue = typeof value === 'string' ? value.trim() : value;
    if (!rawValue) {
      findings.push(createFinding('canonical-link-json-empty', 'Canonical link JSON fields must be removed instead of persisted empty.', {
        ...location,
        field: key,
      }));
      return;
    }

    const linkValue = parseLinkValueJson(rawValue);
    if (!linkValue || !validateLinkValue(linkValue).valid) {
      findings.push(createFinding('canonical-link-json-invalid', 'Canonical link JSON must be parseable and valid.', {
        ...location,
        field: key,
      }));
    }
  });
}

function scanCanonicalFormSettings({ block, settings, findings, location }) {
  if (String(block?.kind || '').trim() !== 'cta_form') {
    return;
  }

  const slotEditableFields = (Array.isArray(block.editableFields) ? block.editableFields : [])
    .map((field) => String(field?.id || '').trim())
    .filter((fieldId) => CTA_FORM_SLOT_FIELD_PATTERN.test(fieldId));
  const rawFieldsJson = trimSettingValue(settings.fieldsJson);
  const canonicalFields = parseCtaFormFieldsJson(rawFieldsJson);
  const slotFields = buildCtaFormSlotFields(settings);
  const slotSettingKeys = Object.keys(settings)
    .filter((fieldId) => CTA_FORM_SLOT_FIELD_PATTERN.test(fieldId));

  if (slotEditableFields.length) {
    findings.push(createFinding('cta-form-slot-editable-fields', 'CTA form slot compatibility fields must not be exposed as editableFields.', {
      ...location,
      field: slotEditableFields[0],
    }));
  }

  if (slotSettingKeys.length) {
    findings.push(createFinding('cta-form-slot-settings', 'CTA form slot compatibility fields must not be persisted in active settings.', {
      ...location,
      field: slotSettingKeys[0],
    }));
  }

  if (rawFieldsJson && !canonicalFields.length) {
    findings.push(createFinding('cta-form-fields-json-invalid', 'CTA form fieldsJson must be a parseable canonical field array.', location));
    return;
  }

  if (slotFields.length && !canonicalFields.length) {
    findings.push(createFinding('cta-form-fields-json-missing', 'CTA form slot fields must also be represented in canonical fieldsJson.', location));
  }
}

function scanBlocks({ recordLabel, rootName, pathname, blocks, findings }) {
  (Array.isArray(blocks) ? blocks : []).forEach((block, index) => {
    const blockId = String(block?.id || '').trim();
    const settings = block?.settings && typeof block.settings === 'object'
      ? block.settings
      : {};
    const location = {
      record: recordLabel,
      root: rootName,
      pathname,
      blockIndex: index,
      blockId,
    };

    if (block?.mode === 'static') {
      findings.push(createFinding('static-block-mode', 'Block uses retired static mode.', location));
    }

    if (hasTargetBridgeSettings(block)) {
      findings.push(createFinding('target-bridge-settings', 'Block carries retired target-section bridge settings.', location));
    }

    if (isPageContentBlock(block) && !ALLOWED_PAGE_CONTENT_PATHS.has(pathname)) {
      findings.push(createFinding('page-content-route-not-allowed', 'page_content is only allowed on classified special routes.', location));
    }

    if (isRetiredBlock(pathname, block)) {
      findings.push(createFinding('retired-block', 'Block is a retired 403(b) or planned-giving structure.', location));
    }

    scanSplitLinkSettings({ settings, findings, location });
    scanCanonicalLinkJsonSettings({ settings, findings, location });
    scanCanonicalFormSettings({ block, settings, findings, location });
  });
}

function scanStateRoot({ recordLabel, rootName, stateRoot, findings }) {
  [
    ['pageHierarchy', stateRoot?.pageHierarchy],
    ['blocksByPath', stateRoot?.blocksByPath],
    ['collaborationByPath', stateRoot?.collaborationByPath],
  ].forEach(([source, value]) => {
    Object.keys(value || {}).forEach((pathname) => {
      if (RETIRED_CONTENT_PATHS.has(pathname)) {
        findings.push(createFinding('retired-content-path', 'Retired path appears as a content-bearing state key.', {
          record: recordLabel,
          root: rootName,
          source,
          pathname,
        }));
      }
    });
  });

  Object.entries(stateRoot?.blocksByPath || {}).forEach(([pathname, blocks]) => {
    scanBlocks({
      recordLabel,
      rootName,
      pathname,
      blocks,
      findings,
    });
  });
}

function scanRevisionInventories({ recordLabel, record, findings }) {
  const currentBlocksByPath = record?.state?.blocksByPath || {};
  Object.entries(record?.revisionsByPath || {}).forEach(([pathname, revisions]) => {
    if (RETIRED_CONTENT_PATHS.has(pathname)) {
      findings.push(createFinding('retired-revision-path', 'Retired path appears as a revision key.', {
        record: recordLabel,
        root: 'revisionsByPath',
        pathname,
      }));
      return;
    }

    const currentInventory = (Array.isArray(currentBlocksByPath[pathname]) ? currentBlocksByPath[pathname] : [])
      .map(blockSignature);
    if (!currentInventory.length) {
      return;
    }

    (Array.isArray(revisions) ? revisions : []).forEach((revision, revisionIndex) => {
      const revisionBlocks = Array.isArray(revision?.snapshot?.blocks) ? revision.snapshot.blocks : [];
      const revisionInventory = revisionBlocks.map(blockSignature);
      if (JSON.stringify(revisionInventory) !== JSON.stringify(currentInventory)) {
        findings.push(createFinding('revision-inventory-drift', 'Revision restore inventory differs from current state inventory.', {
          record: recordLabel,
          root: 'revisionsByPath',
          pathname,
          revisionIndex,
          revisionId: String(revision?.id || ''),
        }));
      }

      scanBlocks({
        recordLabel,
        rootName: `revisionsByPath[${revisionIndex}]`,
        pathname,
        blocks: revisionBlocks,
        findings,
      });
    });
  });
}

function scanRecord(recordDescriptor) {
  const rawRecord = readJson(recordDescriptor.relativePath);
  const record = normalizeRecordPayload(rawRecord);
  const findings = [];

  getStateRoots(record, recordDescriptor.type).forEach(([rootName, stateRoot]) => {
    scanStateRoot({
      recordLabel: recordDescriptor.label,
      rootName,
      stateRoot,
      findings,
    });
  });

  if (recordDescriptor.type !== 'seed') {
    scanRevisionInventories({
      recordLabel: recordDescriptor.label,
      record,
      findings,
    });
  }

  return findings;
}

function summarize(findings) {
  return findings.reduce((summary, finding) => {
    summary[finding.code] = (summary[finding.code] || 0) + 1;
    return summary;
  }, {});
}

const outputJson = process.argv.includes('--json');
const includeBackups = process.argv.includes('--include-backups');
const records = [
  ...ACTIVE_RECORDS,
  ...(includeBackups ? listBackupRecords() : []),
];
const findings = records.flatMap(scanRecord);

if (outputJson) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  console.log('Content admin snapshot audit');
  console.log(`Records scanned: ${records.length}`);
  console.log(`Findings: ${findings.length}`);
  Object.entries(summarize(findings)).forEach(([code, count]) => {
    console.log(`- ${code}: ${count}`);
  });
  findings.slice(0, 80).forEach((finding) => {
    console.log(`- ${finding.record}:${finding.root}:${finding.pathname || '(n/a)'} ${finding.code} ${finding.blockId || ''}`.trim());
  });
  if (findings.length > 80) {
    console.log(`- ... ${findings.length - 80} more`);
  }
}

if (findings.length) {
  process.exitCode = 1;
}
