import { describe, expect, it } from 'vitest';
import {
  buildCardGridIntroHtml,
  hasCardGridIntroHtml,
  normalizeCardGridIntroMarkup,
} from './cardGridIntro';

describe('card grid merged intro content', () => {
  it('combines legacy subhead and HTML body content for the unified editor', () => {
    expect(buildCardGridIntroHtml({
      subtitle: 'Easy steps.',
      subtitleClassName: 'is-mango',
      bodyHtml: '<p>Follow the path below.</p>',
    })).toBe('<h3 class="is-mango">Easy steps.</h3><p>Follow the path below.</p>');
  });

  it('preserves legacy subtitle highlights while composing the merged value', () => {
    expect(buildCardGridIntroHtml({
      subtitle: 'Three steps. One clear path.',
      subtitleHighlightsJson: JSON.stringify([
        { start: 0, end: 11, className: 'is-atlantean' },
      ]),
    })).toContain('<mark class="is-atlantean">Three steps</mark>');
  });

  it('treats an explicitly cleared canonical field as intentional', () => {
    const settings = {
      introHtml: '<p></p>',
      subtitle: 'Legacy subhead that must not return',
    };
    expect(hasCardGridIntroHtml(settings)).toBe(true);
    expect(buildCardGridIntroHtml(settings)).toBe('');
  });

  it('uses the canonical intro HTML unchanged after an admin edit', () => {
    const introHtml = '<h3>Easy steps.</h3><p><strong>Start here.</strong></p>';
    expect(buildCardGridIntroHtml({ introHtml, subtitle: 'Old value' })).toBe(introHtml);
  });

  it('wraps a bare leading editor text run so block-level sizing can reach it', () => {
    expect(normalizeCardGridIntroMarkup("Because that's the worst.<p></p>")).toBe(
      "<h3>Because that's the worst.</h3><p></p>",
    );
  });

  it('keeps inline text formatting inside the normalized subhead', () => {
    expect(normalizeCardGridIntroMarkup('<span class="is-text-lead">Easy</span> steps.<p>Follow.</p>'))
      .toBe('<h3><span class="is-text-lead">Easy</span> steps.</h3><p>Follow.</p>');
  });

  it('keeps one semantic color when legacy markup contains conflicting colors', () => {
    expect(buildCardGridIntroHtml({
      introHtml: '<h3 class="is-sandstone is-white">Easy steps.</h3><p>Follow.</p>',
    })).toBe('<h3 class="is-white">Easy steps.</h3><p>Follow.</p>');
  });
});
