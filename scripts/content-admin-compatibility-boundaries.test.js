import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_ADMIN_MIGRATION_ADAPTERS,
  runContentAdminMigrationInventory,
} from './content-admin-migration-inventory.mjs';
import { runSnapshotAudit } from './content-admin-snapshot-audit.mjs';

const splitSource = readFileSync('src/lib/linkValue.js', 'utf8');
const formsSource = readFileSync('src/blocks/foundation/forms.js', 'utf8');
const rendererSource = readFileSync('src/components/blocks/PageBlocksRenderer.jsx', 'utf8');
const editorSource = readFileSync('src/components/block-editors/migratedBlockEditors.jsx', 'utf8');

function adapter(id) {
  return CONTENT_ADMIN_MIGRATION_ADAPTERS.find((entry) => entry.id === id);
}

describe('content-admin compatibility boundaries', () => {
  it('keeps split-link compatibility active while canonical render and editor paths remain reachable', () => {
    const entry = adapter('split-link-compatibility');

    expect(entry?.status).toBe('active');
    expect(splitSource).toContain('export function normalizeSplitLinkFieldSettings');
    expect(splitSource).toContain('export function coerceLinkValueFromFields');
    expect(rendererSource).toContain('coerceLinkValueFromFields');
    expect(editorSource).toContain('coerceLinkValueFromFields');
  });

  it('records CTA slot compatibility as retired while canonical form fields remain the editor contract', () => {
    const entry = adapter('cta-form-slot-compatibility');

    expect(entry).toEqual(expect.objectContaining({
      status: 'retired',
      helpers: [],
      retirementReceipt: 'docs/content-admin-adapter-retirements/cta-form-slot-compatibility.json',
    }));
    expect(formsSource).not.toContain('buildCtaFormSlotFields');
    expect(formsSource).not.toContain('stripCtaFormSlotFieldSettings');
    expect(formsSource).toContain('export function parseCtaFormFieldsJson');
    expect(formsSource).toContain('export function serializeCtaFormFields');
    expect(editorSource).toContain('extractCtaFormFields');
  });

  it('records CGA SECURE Act compatibility as retired while canonical blocks remain the content contract', () => {
    const entry = adapter('cga-secure-act-content-compatibility');

    expect(entry).toEqual(expect.objectContaining({
      status: 'retired',
      helpers: [],
      retirementReceipt: 'docs/content-admin-adapter-retirements/cga-secure-act-content-compatibility.json',
    }));
    expect(readFileSync('src/context/ContentAdminContext.jsx', 'utf8')).not.toContain('normalizeCgaSecureActBlocks');
    expect(readFileSync('dev-server/contentAdminStore.js', 'utf8')).not.toContain('normalizeCgaSecureActBlocks');
  });

  it('records IRA block-shape repair as retired while canonical IRA blocks remain supported', () => {
    const entry = adapter('retirement-ira-block-shape');

    expect(entry).toEqual(expect.objectContaining({
      status: 'retired',
      helpers: [],
      retirementReceipt: 'docs/content-admin-adapter-retirements/retirement-ira-block-shape.json',
    }));
    expect(readFileSync('src/context/ContentAdminContext.jsx', 'utf8')).not.toContain('normalizeRetirementIraBlockSet');
    expect(readFileSync('dev-server/contentAdminStore.js', 'utf8')).not.toContain('normalizeRetirementIraComparisonTableSettings');
  });

  it('records 403(b) snapshot repairs as retired while current route contracts remain supported', () => {
    const entry = adapter('retirement-403b-snapshot-repairs');
    const contextSource = readFileSync('src/context/ContentAdminContext.jsx', 'utf8');

    expect(entry).toEqual(expect.objectContaining({
      status: 'retired',
      helpers: [],
      retirementReceipt: 'docs/content-admin-adapter-retirements/retirement-403b-snapshot-repairs.json',
    }));
    expect(contextSource).not.toContain('normalizeRetirement403bBlockSet');
    expect(contextSource).not.toContain('isRetiredRetirement403b');
    expect(contextSource).toContain('normalizeRetirement403bSectionClassSettings');
  });

  it('proves current persisted layers contain no compatibility findings without mutating them', () => {
    const before = runContentAdminMigrationInventory({ includeBackups: true });
    const after = runContentAdminMigrationInventory({ includeBackups: true });
    const snapshotAudit = runSnapshotAudit({ includeBackups: true });
    const reportFor = (id) => after.reports.find((report) => report.adapter === id);

    expect(reportFor('split-link-compatibility')).toMatchObject({ totalFindings: 0 });
    expect(reportFor('cta-form-slot-compatibility')).toMatchObject({ totalFindings: 0 });
    expect(snapshotAudit.findings.filter((finding) => (
      finding.code === 'cta-form-slot-settings'
      || finding.code === 'cta-form-slot-editable-fields'
    ))).toEqual([]);
    expect(after).toEqual(before);
  }, 60000);
});
