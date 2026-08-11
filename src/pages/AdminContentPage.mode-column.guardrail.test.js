import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(process.cwd());

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function getBlocks(snapshot, rootKey) {
  return Object.values(snapshot?.[rootKey]?.blocksByPath || {}).flat();
}

function getBlockModes(snapshot, rootKey) {
  return getBlocks(snapshot, rootKey)
    .map((block) => String(block?.mode || '').trim().toLowerCase());
}

describe('admin block mode retirement', () => {
  it('keeps active shared and seed snapshots free of static blocks', () => {
    const snapshots = [
      ['dev-data/content-admin-shared.json', ['state', 'baseSnapshot']],
      ['dev-data/content-admin-seed-baseline.json', ['seedState']],
    ];

    snapshots.forEach(([relativePath, rootKeys]) => {
      const snapshot = readJson(relativePath);
      rootKeys.forEach((rootKey) => {
        const modes = getBlockModes(snapshot, rootKey);
        expect(modes.length, `${relativePath} ${rootKey}`).toBeGreaterThan(0);
        expect(modes.every((mode) => mode === 'dynamic'), `${relativePath} ${rootKey}`).toBe(true);
      });
    });
  });

  it('does not render the retired mode column in the main block editor table', () => {
    const source = readFileSync(path.join(repoRoot, 'src/pages/AdminContentPage.jsx'), 'utf8');

    expect(source).not.toContain('<th>Mode</th>');
    expect(source).not.toContain('admin-block-mode-pill');
  });
});
