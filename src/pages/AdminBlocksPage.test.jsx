import { describe, expect, it } from 'vitest';
import { collectBlockIssues } from './AdminBlocksPage';

describe('collectBlockIssues', () => {
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
