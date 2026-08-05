import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createJsonContentStore } from '../dev-server/contentAdminStore.js';
import {
  DEFAULT_CONTENT_ADMIN_RETENTION_POLICY,
} from '../src/lib/contentAdminRetentionPolicy.js';
import {
  buildArchivePlan,
  buildRetentionManifest,
  executeDeletePlan,
  executeArchivePlan,
} from './content-admin-retention.mjs';

const tempDirectories = [];

function actor() {
  return { userId: 'retention-test', displayName: 'Retention Test', initials: 'RT' };
}

function state() {
  return {
    pageHierarchy: { '/services/loans': { path: '/services/loans', title: 'Loans' } },
    blocksByPath: { '/services/loans': [{ id: 'hero', kind: 'content', mode: 'dynamic', settings: {} }] },
    pathAliases: {},
    collaborationByPath: { '/services/loans': { blocks: {}, history: [] } },
  };
}

function backupPayload(createdAt, marker) {
  return {
    meta: {
      createdAt,
      timestamp: new Date(createdAt).toISOString(),
      reason: `backup-${marker}`,
      actor: actor(),
      schemaVersion: 1,
      routeScope: ['/services/loans'],
    },
    record: {
      initialized: true,
      version: 1,
      updatedAt: createdAt,
      state: state(),
      baseSnapshot: state(),
      revisionsByPath: {},
    },
  };
}

function makeDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-retention-'));
  tempDirectories.push(directory);
  fs.mkdirSync(path.join(directory, 'backups'));
  return directory;
}

function approvedPolicy(overrides = {}) {
  return {
    ...DEFAULT_CONTENT_ADMIN_RETENTION_POLICY,
    retentionPolicyStatus: 'approved',
    policyVersion: 'retention-test-v1',
    backupRetentionDays: 1,
    revisionRetentionDays: 1,
    protectedReleaseCount: 1,
    archiveMode: 'evidence-only',
    evidenceArchiveDirectory: 'evidence',
    policyOwner: 'policy-owner',
    approvingAuthority: 'approving-authority',
    complianceReviewer: 'compliance-reviewer',
    decisionDate: '2026-08-05',
    effectiveDate: '2026-08-06',
    approvalEvidenceLocation: 'records/retention-test-v1',
    retentionClockOrigin: 'backup-created-at',
    archiveAccessControls: 'records-operators',
    checksumVerificationOwner: 'integrity-owner',
    holdAuthority: 'records-authority',
    secondPersonReviewRequired: true,
    recoveryTestRequired: true,
    deletionPolicyDecision: 'prohibited',
    ...overrides,
  };
}

afterEach(() => {
  tempDirectories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true, force: true }));
});

describe('content-admin retention framework', () => {
  it('distinguishes layers, emits checksums, and holds incomplete metadata', () => {
    const rootDir = makeDirectory();
    fs.writeFileSync(path.join(rootDir, 'backups', 'content-admin-shared-old.json'), JSON.stringify({ record: state() }));
    const manifest = buildRetentionManifest({
      rootDir,
      sharedFile: 'missing-shared.json',
      seedFile: 'missing-seed.json',
      backupDirectory: 'backups',
    });

    expect(manifest.items).toHaveLength(1);
    expect(manifest.items[0]).toMatchObject({
      kind: 'backup',
      metadataStatus: 'unknown',
      restoreEligibility: 'ineligible',
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(manifest.archivePlan[0].action).toBe('unknown/hold');
  });

  it('retains only current-schema recovery and makes obsolete shapes deletion candidates', () => {
    const policy = approvedPolicy();
    const now = 1710000000000 + 10 * 86400000;
    const items = [
      { id: 'backup:new', kind: 'backup', metadataStatus: 'complete', restoreEligibility: 'eligible', createdAt: now - 2 * 86400000, schemaVersion: 1, metadata: {} },
      { id: 'backup:old', kind: 'backup', metadataStatus: 'complete', restoreEligibility: 'eligible', createdAt: now - 5 * 86400000, schemaVersion: 1, metadata: {} },
      { id: 'backup:other-schema', kind: 'backup', metadataStatus: 'complete', restoreEligibility: 'eligible', createdAt: now - 5 * 86400000, schemaVersion: 2, metadata: {} },
    ];

    const plan = buildArchivePlan(items, policy, now);
    expect(plan.find((item) => item.id === 'backup:new').action).toBe('retain-protected-current-release');
    expect(plan.find((item) => item.id === 'backup:other-schema').action).toBe('delete-obsolete-shape-record');
    expect(plan.find((item) => item.id === 'backup:old').action).toBe('delete-expired-current-shape-duplicate');
    expect(plan.find((item) => item.id === 'backup:old').canDelete).toBe(false);
  });

  it('requires explicit archive authorization and leaves an unapproved policy untouched', () => {
    const rootDir = makeDirectory();
    const fileName = 'content-admin-shared-old.json';
    fs.writeFileSync(path.join(rootDir, 'backups', fileName), JSON.stringify(backupPayload(1710000000000, 'old')));
    const manifest = buildRetentionManifest({ rootDir, sharedFile: 'missing.json', seedFile: 'missing.json', backupDirectory: 'backups' });
    const reviewPath = path.join(rootDir, 'review.json');
    const beforePath = path.join(rootDir, 'before.json');
    fs.writeFileSync(reviewPath, JSON.stringify({ archivePlan: manifest.archivePlan }));
    fs.writeFileSync(beforePath, JSON.stringify(manifest));

    expect(() => executeArchivePlan({
      manifest,
      rootDir,
      actor: 'operator',
      reason: 'test archive',
      policyVersion: 1,
      reviewArtifactPath: reviewPath,
      beforeManifestPath: beforePath,
      afterManifestPath: path.join(rootDir, 'after.json'),
      confirmation: 'ARCHIVE',
    })).toThrow(/approved, complete retention policy/);
    expect(fs.existsSync(path.join(rootDir, 'backups', fileName))).toBe(true);
  });

  it('keeps an incomplete approved policy fail-closed', () => {
    const policy = approvedPolicy({ approvalEvidenceLocation: null });
    const manifest = buildRetentionManifest({
      rootDir: makeDirectory(),
      sharedFile: 'missing-shared.json',
      seedFile: 'missing-seed.json',
      backupDirectory: 'backups',
      policy,
    });

    expect(manifest.policy.retentionPolicyStatus).toBe('approved');
    expect(manifest.policyIssues).toContain('approval-evidence-location-required');
    expect(manifest.archivePlan.every((item) => item.action !== 'archive-to-evidence')).toBe(true);
  });

  it('does not archive obsolete shapes during current-schema cleanup planning', () => {
    const rootDir = makeDirectory();
    const oldName = 'content-admin-shared-old.json';
    const newName = 'content-admin-shared-new.json';
    const currentPayload = backupPayload(1710000000000 + 2 * 86400000, 'new');
    const oldPayload = JSON.parse(JSON.stringify(currentPayload));
    oldPayload.meta.createdAt = 1710000000000;
    oldPayload.meta.timestamp = new Date(oldPayload.meta.createdAt).toISOString();
    fs.writeFileSync(path.join(rootDir, 'backups', oldName), JSON.stringify(oldPayload));
    fs.writeFileSync(path.join(rootDir, 'backups', newName), JSON.stringify(currentPayload));
    const policy = approvedPolicy();
    const manifest = buildRetentionManifest({
      rootDir,
      sharedFile: 'missing.json',
      seedFile: 'missing.json',
      backupDirectory: 'backups',
      policy,
      migrationScanByRecord: { [`backup:${oldName}`]: 1 },
      migrationEvidenceByRecord: {
        [`backup:${oldName}`]: { adapters: ['retired-test-shape'], findings: [{}] },
      },
      now: 1710000000000 + 10 * 86400000,
    });
    expect(manifest.restoreSamples).toMatchObject({ status: 'passed', samples: [expect.objectContaining({ schemaVersion: '1' })] });
    const reviewPath = path.join(rootDir, 'review.json');
    const beforePath = path.join(rootDir, 'before.json');
    const afterPath = path.join(rootDir, 'after.json');
    fs.writeFileSync(reviewPath, JSON.stringify(manifest));
    fs.writeFileSync(beforePath, JSON.stringify(manifest));

    expect(manifest.cleanupPlan.find((item) => item.id.endsWith(oldName)).action)
      .toBe('delete obsolete-shape record');
    expect(manifest.cleanupPlan.every((item) => item.canDelete === false)).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'backups', oldName))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'backups', newName))).toBe(true);
    expect(fs.existsSync(reviewPath)).toBe(true);
    expect(fs.existsSync(afterPath)).toBe(false);
  });

  it('deletes only reviewed file-backed candidates after explicit authorization', () => {
    const rootDir = makeDirectory();
    const oldName = 'content-admin-shared-old.json';
    const newName = 'content-admin-shared-new.json';
    const currentPayload = backupPayload(1710000000000 + 2 * 86400000, 'new');
    const oldPayload = JSON.parse(JSON.stringify(currentPayload));
    oldPayload.meta.createdAt = 1710000000000;
    oldPayload.meta.timestamp = new Date(oldPayload.meta.createdAt).toISOString();
    fs.writeFileSync(path.join(rootDir, 'backups', oldName), JSON.stringify(oldPayload));
    fs.writeFileSync(path.join(rootDir, 'backups', newName), JSON.stringify(currentPayload));
    const policy = approvedPolicy({ deletionPolicyDecision: 'allowed' });
    const manifest = buildRetentionManifest({
      rootDir,
      sharedFile: 'missing.json',
      seedFile: 'missing.json',
      backupDirectory: 'backups',
      policy,
      migrationScanByRecord: { [`backup:${oldName}`]: 1 },
      migrationEvidenceByRecord: {
        [`backup:${oldName}`]: { adapters: ['retired-test-shape'], findings: [{}] },
      },
      now: 1710000000000 + 10 * 86400000,
    });
    const reviewPath = path.join(rootDir, 'review.json');
    const beforePath = path.join(rootDir, 'before.json');
    const afterPath = path.join(rootDir, 'after.json');
    fs.writeFileSync(reviewPath, JSON.stringify({ cleanupPlan: manifest.cleanupPlan }));
    fs.writeFileSync(beforePath, JSON.stringify(manifest));

    const result = executeDeletePlan({
      manifest,
      rootDir,
      actor: 'operator',
      reason: 'approved cleanup test',
      policyVersion: 'retention-test-v1',
      reviewArtifactPath: reviewPath,
      beforeManifestPath: beforePath,
      afterManifestPath: afterPath,
      confirmation: 'DELETE',
    });

    expect(result.deleted).toHaveLength(1);
    expect(fs.existsSync(path.join(rootDir, 'backups', oldName))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, 'backups', newName))).toBe(true);
    expect(fs.existsSync(afterPath)).toBe(true);
  });

  it('does not prune backups when maxAutomaticBackups is set but policy is unapproved', () => {
    const rootDir = makeDirectory();
    const persistenceFile = path.join(rootDir, 'content-admin-shared.json');
    const backupDir = path.join(rootDir, 'backups');
    const diagnostics = [];
    let now = 1710000000000;
    const store = createJsonContentStore({
      persistenceFile,
      backupDir,
      maxAutomaticBackups: 1,
      now: () => (now += 1000),
      onDiagnostic: (entry) => diagnostics.push(entry),
    });

    const first = store.createBackup('first', { actor: actor() });
    store.createBackup('second', { actor: actor() });
    store.createBackup('third', { actor: actor() });

    expect(store.listBackups()).toHaveLength(3);
    expect(first.pruneResult).toMatchObject({ skipped: 'retention-policy-unapproved', deleted: [] });
    expect(diagnostics.some((entry) => entry.operation === 'backup-prune-skipped')).toBe(true);
  });
});
