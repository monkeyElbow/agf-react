import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  READABILITY_LARGE_FILE_LINE_THRESHOLD,
  SYSTEM_2_0_READINESS_TARGETS,
  SYSTEM_READABILITY_BOUNDARIES,
  SYSTEM_VISUAL_ACCESSIBILITY_GATES,
  getReadabilityBoundaryForFile,
  getSystemReadinessInventory,
} from './systemReadinessInventory';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

function walkFiles(relativeDir, extensions) {
  const root = path.resolve(repoRoot, relativeDir);
  const files = [];

  function visit(absolutePath) {
    const relativePath = path.relative(repoRoot, absolutePath).split(path.sep).join('/');
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      if (['node_modules', 'dist', 'coverage'].includes(path.basename(absolutePath))) {
        return;
      }
      readdirSync(absolutePath).forEach((name) => visit(path.join(absolutePath, name)));
      return;
    }
    if (!stats.isFile() || !extensions.has(path.extname(relativePath))) {
      return;
    }
    if (relativePath.includes('.test.') || relativePath.includes('.guardrail.')) {
      return;
    }
    files.push(relativePath);
  }

  visit(root);
  return files.sort();
}

function countLines(relativePath) {
  return readFileSync(path.resolve(repoRoot, relativePath), 'utf8').split(/\r?\n/).length;
}

describe('system readiness inventory', () => {
  it('keeps every large mixed-ownership source file documented with a next split boundary', () => {
    const largeFiles = walkFiles('src', new Set(['.css', '.js', '.jsx']))
      .map((file) => ({ file, lines: countLines(file) }))
      .filter((entry) => entry.lines >= READABILITY_LARGE_FILE_LINE_THRESHOLD);

    expect(largeFiles.length).toBeGreaterThan(0);
    largeFiles.forEach(({ file }) => {
      const boundary = getReadabilityBoundaryForFile(file);
      expect(boundary, `${file} needs a readability boundary inventory entry`).toBeTruthy();
      expect(boundary.owner, `${file} needs an owner`).toBeTruthy();
      expect(boundary.currentBoundary, `${file} needs a current boundary`).toBeTruthy();
      expect(boundary.nextSplit, `${file} needs a next split`).toBeTruthy();
    });
  });

  it('keeps readiness inventory entries complete and queryable', () => {
    const inventory = getSystemReadinessInventory();

    expect(inventory.largeFileLineThreshold).toBe(READABILITY_LARGE_FILE_LINE_THRESHOLD);
    expect(inventory.readabilityBoundaries).toBe(SYSTEM_READABILITY_BOUNDARIES);
    expect(inventory.visualAccessibilityGates).toBe(SYSTEM_VISUAL_ACCESSIBILITY_GATES);
    expect(inventory.readinessTargets2_0).toBe(SYSTEM_2_0_READINESS_TARGETS);

    SYSTEM_READABILITY_BOUNDARIES.forEach((entry) => {
      expect(() => statSync(path.resolve(repoRoot, entry.file))).not.toThrow();
      expect(entry.pass).toBe('Pass 5');
    });
  });

  it('keeps visual and accessibility gaps explicit until browser tooling exists', () => {
    const gateIds = SYSTEM_VISUAL_ACCESSIBILITY_GATES.map((gate) => gate.id);

    expect(gateIds).toEqual([
      'static-native-content-accessibility',
      'browser-admin-smoke',
      'visual-regression',
      'keyboard-and-a11y-smoke',
    ]);
    expect(SYSTEM_VISUAL_ACCESSIBILITY_GATES.some((gate) => gate.status === 'covered')).toBe(true);
    expect(SYSTEM_VISUAL_ACCESSIBILITY_GATES.filter((gate) => gate.status === 'tooling-needed').length).toBe(3);
    SYSTEM_VISUAL_ACCESSIBILITY_GATES.forEach((gate) => {
      expect(gate.scope, `${gate.id} needs scope`).toBeTruthy();
      if (gate.status === 'covered') {
        expect(gate.command, `${gate.id} needs a command`).toBeTruthy();
      }
    });
  });

  it('keeps 2.0 cleanup targets classified with retirement criteria', () => {
    const targetIds = SYSTEM_2_0_READINESS_TARGETS.map((target) => target.id);

    expect(targetIds).toContain('forms-canonical-array-schema');
    expect(targetIds).toContain('links-canonical-object');
    expect(targetIds).toContain('admin-blocks-diagnostics');
    expect(targetIds).toContain('root-product-page-fallbacks');
    ['/brand', '/taxguide', '/rates', '/test'].forEach((route) => {
      expect(SYSTEM_2_0_READINESS_TARGETS.some((target) => target.route === route)).toBe(true);
    });
    SYSTEM_2_0_READINESS_TARGETS.forEach((target) => {
      expect(target.currentAdapter, `${target.id} needs current adapter`).toBeTruthy();
      expect(target.retireWhen, `${target.id} needs retirement criteria`).toBeTruthy();
      expect(target.pass).toBe('Pass 7');
    });
  });
});
