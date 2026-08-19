import { describe, expect, it } from 'vitest';
import {
  buildComputedStyleProof,
  validateBrowserAuthorityExpectation,
} from './browserProofContract';

describe('browser proof contract', () => {
  it('fails clearly when the browser reports the wrong renderer or source', () => {
    const failures = validateBrowserAuthorityExpectation({
      blockId: 'gift-types',
      actualAuthority: { renderer: 'LoansPage local block builder', source: 'draft' },
      expectedRenderer: 'PageBlocksRenderer',
      expectedSource: 'published',
    });

    expect(failures).toEqual([
      expect.stringContaining('wrong renderer'),
      expect.stringContaining('wrong source'),
    ]);
    expect(failures.join('\n')).toContain('Repair may be targeting the wrong implementation.');
  });

  it('records computed style, variables, inline values, and matched rule evidence', () => {
    expect(buildComputedStyleProof({
      elementExists: true,
      selector: 'li',
      computedStyles: { 'font-size': '29.6px', 'line-height': '1.5' },
      cssVariables: { '--planned-giving-bullet-size': '1.85rem' },
      inlineStyles: { 'font-size': '' },
      matchedRules: [{ selector: '.card li', source: 'service-native.css', values: { 'font-size': 'var(--planned-giving-bullet-size)' } }],
    })).toMatchObject({
      elementExists: true,
      computedStyles: { 'font-size': '29.6px' },
      cssVariables: { '--planned-giving-bullet-size': '1.85rem' },
      matchedRules: [expect.objectContaining({ source: 'service-native.css' })],
    });
  });
});
