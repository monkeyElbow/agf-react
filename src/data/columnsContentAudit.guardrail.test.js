import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildCanonicalBlockRuntime, getEditableFieldsForKind } from '../blocks/registry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sharedContent = JSON.parse(readFileSync(
  path.resolve(__dirname, '../../dev-data/content-admin-shared.json'),
  'utf8',
));

function collectColumns(blocksByPath = {}) {
  return Object.entries(blocksByPath).flatMap(([pathname, blocks]) => (
    (Array.isArray(blocks) ? blocks : [])
      .filter((block) => (
        block?.kind === 'columns'
        && block?.mode === 'dynamic'
        && block?.hidden !== true
        && block?.hidden !== 'true'
      ))
      .map((block) => ({ pathname, block }))
  ));
}

describe('Columns content convergence guardrail', () => {
  it('keeps every active Columns instance uniquely identified and runtime-buildable', () => {
    const columns = collectColumns(sharedContent.state?.blocksByPath);
    const signatures = new Set(columns.map(({ pathname, block }) => `${pathname}:${block.id}`));

    expect(columns.length).toBeGreaterThan(0);
    expect(signatures.size).toBe(columns.length);

    columns.forEach(({ pathname, block }) => {
      expect(String(block.id || '').trim(), pathname).not.toBe('');
      expect(buildCanonicalBlockRuntime(block), `${pathname}:${block.id}`).not.toBeNull();
    });
  });

  it('keeps column HTML and legacy body fields on one source-precedence contract', () => {
    const columns = collectColumns(sharedContent.state?.blocksByPath);

    columns.forEach(({ pathname, block }) => {
      const runtime = buildCanonicalBlockRuntime(block);
      const settings = block.settings || {};

      (runtime?.items || []).forEach((item) => {
        const html = String(settings[`col${item.slot}BodyHtml`] || '').trim();
        if (html && !/^<(p|div)\b[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/\1>$/i.test(html)) {
          expect(item.body, `${pathname}:${block.id}:col${item.slot}`).toBe('');
        }
      });
    });
  });

  it('keeps every persisted column body source editable on both editor surfaces', () => {
    const fieldIds = new Set(getEditableFieldsForKind('columns').map((field) => field.id));
    const editorSource = readFileSync(path.resolve(__dirname, '../components/block-editors/migratedBlockEditors.jsx'), 'utf8');
    const hudSource = readFileSync(path.resolve(__dirname, '../components/ColumnsHudEditorPanel.jsx'), 'utf8');
    const columnsRendererSource = readFileSync(path.resolve(__dirname, '../components/blocks/PageBlocksRenderer.jsx'), 'utf8');

    [1, 2, 3, 4].forEach((slot) => {
      expect(fieldIds.has(`col${slot}BodyHtml`)).toBe(true);
    });
    expect(editorSource).toContain('bodyHtmlField = fieldById.get(`col${slot}BodyHtml`)');
    expect(hudSource).toContain('const bodyHtmlFieldId = `col${slot}BodyHtml`');
    expect(columnsRendererSource).toContain('buildCanonicalBlockRuntime(canonicalDynamicBlock)');
  });
});
