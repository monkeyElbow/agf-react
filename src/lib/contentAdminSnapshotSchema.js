import { getManagedPageRouteClassification } from './managedPageShells.js';

export const CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION = 1;

export const CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS = Object.freeze([
  {
    label: 'shared state',
    relativePath: 'dev-data/content-admin-shared.json',
    recordType: 'shared',
    rootKey: 'state',
  },
  {
    label: 'shared baseSnapshot',
    relativePath: 'dev-data/content-admin-shared.json',
    recordType: 'shared',
    rootKey: 'baseSnapshot',
  },
  {
    label: 'seed seedState',
    relativePath: 'dev-data/content-admin-seed-baseline.json',
    recordType: 'seed-baseline',
    rootKey: 'seedState',
  },
]);

export const CONTENT_ADMIN_PAGE_CONTENT_ALLOWED_CLASSIFICATIONS = Object.freeze([
  'functional-brand-kit',
  'legacy-page-content',
]);

const REQUIRED_CONTENT_ADMIN_STATE_KEYS = Object.freeze([
  'pageHierarchy',
  'blocksByPath',
  'pathAliases',
  'collaborationByPath',
]);

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function createFinding(code, message, context = {}) {
  return {
    code,
    message,
    ...context,
  };
}

function isPageContentBlock(block) {
  return block?.id === 'page_content' || block?.kind === 'page_content';
}

export function getContentAdminStateRootKeys() {
  return REQUIRED_CONTENT_ADMIN_STATE_KEYS;
}

export function validateContentAdminRecordSchema(record, options = {}) {
  const label = String(options?.label || 'content admin record');
  const recordType = String(options?.recordType || '').trim();
  const findings = [];

  if (!isPlainObject(record)) {
    return [createFinding('record-not-object', `${label} must be an object.`)];
  }

  if (recordType === 'shared') {
    if (record.version !== CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION) {
      findings.push(createFinding(
        'shared-version-mismatch',
        `${label} must use content admin schema version ${CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION}.`,
        { expected: CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION, actual: record.version },
      ));
    }
    ['initialized', 'updatedAt', 'state', 'baseSnapshot'].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(record, key)) {
        findings.push(createFinding('shared-record-missing-key', `${label} is missing ${key}.`, { key }));
      }
    });
  }

  if (recordType === 'seed-baseline') {
    if (!isPlainObject(record.meta)) {
      findings.push(createFinding('seed-meta-missing', `${label} is missing meta.`));
    }
    if (!isPlainObject(record.seedState)) {
      findings.push(createFinding('seed-state-missing', `${label} is missing seedState.`));
    }
  }

  return findings;
}

export function validateContentAdminStateSchema(stateRoot, options = {}) {
  const label = String(options?.label || 'content admin state');
  const findings = [];

  if (!isPlainObject(stateRoot)) {
    return [createFinding('state-not-object', `${label} must be an object.`)];
  }

  REQUIRED_CONTENT_ADMIN_STATE_KEYS.forEach((key) => {
    if (!isPlainObject(stateRoot[key])) {
      findings.push(createFinding('state-key-not-object', `${label}.${key} must be an object.`, { key }));
    }
  });

  if (findings.length) {
    return findings;
  }

  Object.entries(stateRoot.pageHierarchy).forEach(([pathname, page]) => {
    if (!isPlainObject(page)) {
      findings.push(createFinding('page-not-object', `${label}.pageHierarchy[${pathname}] must be an object.`, { pathname }));
      return;
    }

    const pagePath = String(page.path || '').trim();
    if (!pagePath) {
      findings.push(createFinding('page-path-missing', `${label}.pageHierarchy[${pathname}] is missing path.`, { pathname }));
    } else if (pagePath !== pathname) {
      findings.push(createFinding('page-path-mismatch', `${label}.pageHierarchy[${pathname}] path must match its key.`, { pathname, pagePath }));
    }

    if (!String(page.title || '').trim()) {
      findings.push(createFinding('page-title-missing', `${label}.pageHierarchy[${pathname}] is missing title.`, { pathname }));
    }
  });

  Object.entries(stateRoot.blocksByPath).forEach(([pathname, blocks]) => {
    const classification = getManagedPageRouteClassification(pathname);
    if (!Array.isArray(blocks)) {
      findings.push(createFinding('blocks-not-array', `${label}.blocksByPath[${pathname}] must be an array.`, { pathname }));
      return;
    }

    if (classification.type === 'blockless' && blocks.length > 0) {
      findings.push(createFinding('blockless-route-has-blocks', `${label}.blocksByPath[${pathname}] has blocks on a blockless route.`, { pathname }));
    }

    if (blocks.length > 0 && classification.type === 'unclassified') {
      findings.push(createFinding('blocks-route-unclassified', `${label}.blocksByPath[${pathname}] has blocks without a managed route classification.`, { pathname }));
    }

    const seenBlockIds = new Set();
    blocks.forEach((block, index) => {
      const blockId = String(block?.id || '').trim();
      const blockKind = String(block?.kind || '').trim();
      const blockMode = String(block?.mode || '').trim();
      const location = `${label}.blocksByPath[${pathname}][${index}]`;

      if (!isPlainObject(block)) {
        findings.push(createFinding('block-not-object', `${location} must be an object.`, { pathname, index }));
        return;
      }
      if (!blockId) {
        findings.push(createFinding('block-id-missing', `${location} is missing id.`, { pathname, index }));
      } else if (seenBlockIds.has(blockId)) {
        findings.push(createFinding('block-id-duplicate', `${location} duplicates block id ${blockId}.`, { pathname, blockId }));
      } else {
        seenBlockIds.add(blockId);
      }
      if (!blockKind) {
        findings.push(createFinding('block-kind-missing', `${location} is missing kind.`, { pathname, blockId }));
      }
      if (blockMode !== 'dynamic') {
        findings.push(createFinding('block-mode-unsupported', `${location} must use dynamic mode.`, { pathname, blockId, mode: blockMode }));
      }
      if (!isPlainObject(block.settings)) {
        findings.push(createFinding('block-settings-not-object', `${location}.settings must be an object.`, { pathname, blockId }));
      }
      if (isPageContentBlock(block)) {
        const allowed = (
          classification.type === 'special'
          && CONTENT_ADMIN_PAGE_CONTENT_ALLOWED_CLASSIFICATIONS.includes(classification.id)
        );
        if (!allowed) {
          findings.push(createFinding(
            'page-content-route-not-allowed',
            `${location} uses page_content outside an allowed special route.`,
            { pathname, blockId, classification },
          ));
        }
      }
    });
  });

  return findings;
}

export function assertContentAdminSchemaValid(record, options = {}) {
  const recordFindings = validateContentAdminRecordSchema(record, options);
  const rootKey = String(options?.rootKey || '').trim();
  const stateFindings = rootKey
    ? validateContentAdminStateSchema(record?.[rootKey], {
        label: `${options?.label || 'content admin record'}#${rootKey}`,
      })
    : [];
  const findings = [...recordFindings, ...stateFindings];
  if (findings.length) {
    const error = new Error(findings.map((finding) => finding.message).join('\n'));
    error.findings = findings;
    throw error;
  }
}
