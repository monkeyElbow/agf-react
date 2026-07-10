import { describe, expect, it } from 'vitest';
import { replaceDisclosureTokens } from './disclosures';

describe('replaceDisclosureTokens', () => {
  it('fills known disclosure template tokens and leaves unknown tokens alone', () => {
    expect(replaceDisclosureTokens(
      '<p>Effective {{certificatesEffectiveDate}}. <a href="{{prospectusHref}}">Read</a> {{unknown}}</p>',
      {
        certificatesEffectiveDate: 'January 1, 2026',
        prospectusHref: 'https://example.com/prospectus?x=1&y=2',
      },
    )).toBe('<p>Effective January 1, 2026. <a href="https://example.com/prospectus?x=1&amp;y=2">Read</a> {{unknown}}</p>');
  });
});
