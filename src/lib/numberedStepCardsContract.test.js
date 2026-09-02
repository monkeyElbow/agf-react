import { describe, expect, it } from 'vitest';
import {
  NUMBERED_STEP_CARDS_CLASS_NAME,
  isNumberedStepCardsSection,
  resolveNumberedStepCardsClassName,
} from './numberedStepCardsContract';

describe('numbered step-card renderer contract', () => {
  it('uses the explicit step-cards preset as the durable authority', () => {
    expect(isNumberedStepCardsSection({ presetId: 'step-cards' })).toBe(true);
    expect(resolveNumberedStepCardsClassName({ presetId: 'step-cards' }))
      .toBe(NUMBERED_STEP_CARDS_CLASS_NAME);
  });

  it('recognizes legacy numbered routes while their snapshots converge', () => {
    expect(resolveNumberedStepCardsClassName({
      presetId: 'default',
      sectionClassName: 'ministers-group-life-native-enroll',
    })).toBe(NUMBERED_STEP_CARDS_CLASS_NAME);
    expect(resolveNumberedStepCardsClassName({
      sectionClassName: 'retirement-rollovers-native-process',
    })).toBe('');
    expect(resolveNumberedStepCardsClassName({
      sectionClassName: 'ordinary-card-grid',
    })).toBe('');
  });

  it('routes every numbered variant through the shared renderer hook', () => {
    const numberedVariants = [
      { presetId: 'step-cards' },
      { sectionClassName: 'ministers-group-life-native-enroll' },
      { sectionClassName: 'online-contrib-native-steps' },
      { sectionClassName: 'retirement-403b-group-enrollment-steps' },
      { sectionClassName: 'retirement-403b-native-loan-apply' },
      { sectionClassName: 'retirement-individual-enrollment-steps' },
    ];

    numberedVariants.forEach((variant) => {
      expect(resolveNumberedStepCardsClassName(variant)).toBe(NUMBERED_STEP_CARDS_CLASS_NAME);
    });
  });
});
