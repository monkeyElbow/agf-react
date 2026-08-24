import { describe, expect, it } from 'vitest';
import { applyTextColorSelection } from './textColorSelection';

describe('shared text color selection contract', () => {
  it('applies a color to the selected range without changing the base color', () => {
    const result = applyTextColorSelection({
      text: 'Every trip is a step of faith.',
      lineClassName: 'is-super-grey',
      selection: { start: 24, end: 29 },
      colorValue: 'is-atlantean',
    });

    expect(result.target).toBe('selection');
    expect(result.lineClassName).toBe('is-super-grey');
    expect(JSON.parse(result.highlightsJson)).toEqual([
      { start: 24, end: 29, className: 'is-atlantean', text: 'faith' },
    ]);
  });

  it('applies a color to the base field when there is no selection', () => {
    const result = applyTextColorSelection({
      text: 'Intro heading',
      lineClassName: 'is-super-grey',
      highlightsJson: '[{"start":0,"end":5,"className":"is-mango"}]',
      selection: { start: 0, end: 0 },
      colorValue: 'is-white',
    });

    expect(result.target).toBe('base');
    expect(result.lineClassName).toBe('is-white');
    expect(result.highlightsJson).toContain('is-mango');
  });
});
