import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getBlockDefinition } from '../blocks/registry';
import {
  CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS,
  CONTENT_ADMIN_PAGE_CONTENT_ALLOWED_CLASSIFICATIONS,
  CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION,
  getContentAdminStateRootKeys,
  validateContentAdminRecordSchema,
  validateContentAdminStateSchema,
} from './contentAdminSnapshotSchema';
import { getManagedPageRouteClassification } from './managedPageShells';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(repoRoot, relativePath), 'utf8'));
}

function collectBlocks(blocksByPath = {}) {
  return Object.entries(blocksByPath).flatMap(([pathname, blocks]) => (
    (Array.isArray(blocks) ? blocks : []).map((block, index) => ({
      pathname,
      block,
      index,
    }))
  ));
}

function shouldSkipRuntimeValidators(pathname, block) {
  const classification = getManagedPageRouteClassification(pathname);
  return (
    classification.type === 'special'
    && (
      CONTENT_ADMIN_PAGE_CONTENT_ALLOWED_CLASSIFICATIONS.includes(classification.id)
      || classification.id === 'development-sandbox'
      || classification.id === 'functional-rates-admin'
    )
  ) || (
    (block?.id === 'page_content' || block?.kind === 'page_content')
    && classification.type === 'special'
    && CONTENT_ADMIN_PAGE_CONTENT_ALLOWED_CLASSIFICATIONS.includes(classification.id)
  );
}

describe('content admin snapshot schema', () => {
  it('defines the current content admin snapshot schema version', () => {
    expect(CONTENT_ADMIN_SNAPSHOT_SCHEMA_VERSION).toBe(1);
    expect(getContentAdminStateRootKeys()).toEqual([
      'pageHierarchy',
      'blocksByPath',
      'pathAliases',
      'collaborationByPath',
    ]);
  });

  it('keeps every active content admin source on the schema contract', () => {
    CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, recordType, rootKey }) => {
      const record = readJson(relativePath);
      const findings = [
        ...validateContentAdminRecordSchema(record, { label, recordType }),
        ...validateContentAdminStateSchema(record?.[rootKey], { label: `${label}#${rootKey}` }),
      ];

      expect(findings, `${label} schema findings`).toEqual([]);
    });
  });

  it('keeps active snapshot blocks tied to registered dynamic block definitions and validators', () => {
    CONTENT_ADMIN_ACTIVE_SNAPSHOT_ROOTS.forEach(({ label, relativePath, rootKey }) => {
      const record = readJson(relativePath);
      const blocks = collectBlocks(record?.[rootKey]?.blocksByPath || {});

      blocks.forEach(({ pathname, block, index }) => {
        const blockId = String(block?.id || '').trim();
        const blockKind = String(block?.kind || '').trim();
        const definition = getBlockDefinition(blockKind);
        const location = `${label} ${pathname}[${index}] ${blockId || '(missing id)'}/${blockKind || '(missing kind)'}`;

        expect(definition, `${location} must have a block definition`).toBeTruthy();
        expect(definition?.supportedModes, `${location} must support its mode`).toContain('dynamic');
        expect(block?.mode, `${location} must be dynamic`).toBe('dynamic');
        expect(block?.settings && typeof block.settings === 'object' && !Array.isArray(block.settings), `${location} settings must be an object`).toBe(true);
        if (!shouldSkipRuntimeValidators(pathname, block)) {
          (definition?.validators || []).forEach((validator, validatorIndex) => {
            expect(validator(block), `${location} validator ${validatorIndex} failed`).toBe(true);
          });
        }
      });
    });
  });

  it('reports useful findings for schema drift before source data is normalized', () => {
    const findings = validateContentAdminStateSchema({
      pageHierarchy: {
        '/services/loans': {
          path: '/services/loans',
          title: 'Loans',
        },
      },
      blocksByPath: {
        '/forms': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'static',
            settings: {},
          },
        ],
      },
      pathAliases: {},
      collaborationByPath: {},
    }, { label: 'fixture' });

    expect(findings.map((finding) => finding.code)).toEqual([
      'blockless-route-has-blocks',
      'block-mode-unsupported',
      'page-content-route-not-allowed',
    ]);
  });
});
