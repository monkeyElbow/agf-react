import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_BLOCKS_AUDIT_SURFACE,
  collectBlockIssues,
} from './AdminBlocksPage';

describe('collectBlockIssues', () => {
  it('does not render the retired mode column in the block audit table', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'src/pages/AdminBlocksPage.jsx'), 'utf8');

    expect(source).not.toContain('<th>Mode</th>');
    expect(source).not.toContain('admin-block-audit-mode-pill');
  });

  it('classifies the admin blocks page as a snapshot health diagnostic surface', () => {
    expect(ADMIN_BLOCKS_AUDIT_SURFACE).toMatchObject({
      id: 'admin-blocks-snapshot-health',
      purpose: 'snapshot-health-diagnostics',
    });
    expect(ADMIN_BLOCKS_AUDIT_SURFACE.retireWhen).toMatch(/permanent admin health dashboard|remove/);
  });

  it('does not flag the loans hero styling hook as a legacy class token', () => {
    const issues = collectBlockIssues({
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        line1Text: 'Your vision.',
        line1ClassName: 'loans-native-hero-line is-vision',
        line2Text: 'Our purpose.',
        line2ClassName: 'loans-native-hero-line is-purpose',
      },
    }, 'dynamic');

    expect(issues.some((issue) => issue.code === 'hero_legacy_class')).toBe(false);
  });

  it('still flags stale hero animation helper classes when they leak into block settings', () => {
    const issues = collectBlockIssues({
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        line1Text: 'Your vision.',
        line1ClassName: 'loans-native-hero-line is-vision lineblur',
        line2Text: 'Our purpose.',
        line2ClassName: 'loans-native-hero-line is-purpose lineB',
      },
    }, 'dynamic');

    expect(issues.some((issue) => issue.code === 'hero_legacy_class')).toBe(true);
  });
});
