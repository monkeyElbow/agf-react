import { describe, expect, it } from 'vitest';
import {
  hasDisplayableHeroLineText,
  hasHeroLineContent,
  hasHeroLineStylingPayload,
  resolveVisibleHeroLineKeys,
  resolveVisibleHeroLineNumbers,
  supportsOptionalHeroLine3,
} from './heroEditorLines';

describe('heroEditorLines', () => {
  it('keeps optional line 3 hidden until it has content or is explicitly enabled', () => {
    const fieldById = new Map([
      ['line1Text', { id: 'line1Text' }],
      ['line2Text', { id: 'line2Text' }],
      ['line3Text', { id: 'line3Text' }],
    ]);

    expect(resolveVisibleHeroLineNumbers({ fieldById, settings: {} })).toEqual([1, 2]);
    expect(resolveVisibleHeroLineNumbers({ fieldById, settings: {}, includeOptionalLine3: true })).toEqual([1, 2, 3]);
  });

  it('does not treat styling metadata alone as displayable line 3 content', () => {
    const fieldById = new Map([
      ['line1Text', { id: 'line1Text' }],
      ['line2Text', { id: 'line2Text' }],
      ['line3Text', { id: 'line3Text' }],
      ['line3ClassName', { id: 'line3ClassName' }],
      ['line3HighlightsJson', { id: 'line3HighlightsJson' }],
    ]);
    const settings = {
      line3Text: '',
      line3ClassName: 'line3 is-atlantean',
      line3HighlightsJson: '[{"text":"ghost","className":"is-mango"}]',
    };

    expect(hasDisplayableHeroLineText(settings, 'line3')).toBe(false);
    expect(hasHeroLineContent(settings, 'line3')).toBe(false);
    expect(hasHeroLineStylingPayload(settings, 'line3')).toBe(true);
    expect(supportsOptionalHeroLine3({ fieldById, settings })).toBe(true);
    expect(resolveVisibleHeroLineNumbers({ fieldById, settings })).toEqual([1, 2]);
    expect(resolveVisibleHeroLineKeys({ settings })).toEqual(['line1', 'line2']);
    expect(resolveVisibleHeroLineKeys({ settings, includeOptionalLine3: true })).toEqual(['line1', 'line2', 'line3']);
  });

  it('surfaces line 3 when stored hero content already uses it', () => {
    const settings = {
      line3Text: 'Optional third line',
    };

    expect(hasDisplayableHeroLineText(settings, 'line3')).toBe(true);
    expect(hasHeroLineContent(settings, 'line3')).toBe(true);
    expect(resolveVisibleHeroLineKeys({ settings })).toEqual(['line1', 'line2', 'line3']);
  });
});
