import { describe, expect, it } from 'vitest';
import {
  NUMBERED_STEP_CARDS_CLASS_NAME,
  isNumberedStepCardsSection,
  resolveNumberedStepCardsClassName,
  splitNumberedStepCardTitle,
} from './numberedStepCardsContract';

describe('numbered step-card renderer contract', () => {
  it('uses the explicit step-cards preset as the durable authority', () => {
    expect(isNumberedStepCardsSection({ presetId: 'step-cards' })).toBe(true);
    expect(resolveNumberedStepCardsClassName({ presetId: 'step-cards' }))
      .toBe(NUMBERED_STEP_CARDS_CLASS_NAME);
  });

  it('separates compact step numbers from authored card titles', () => {
    expect(splitNumberedStepCardTitle('1. Complete the enrollment form', 1))
      .toEqual({ number: '01', title: 'Complete the enrollment form' });
    expect(splitNumberedStepCardTitle('02', 2))
      .toEqual({ number: '02', title: '' });
    expect(splitNumberedStepCardTitle('Return your enrollment form', 2))
      .toEqual({ number: '02', title: 'Return your enrollment form' });
  });

  it('recognizes legacy numbered routes while their snapshots converge', () => {
    expect(resolveNumberedStepCardsClassName({
      presetId: 'default',
      sectionClassName: 'ministers-group-life-native-enroll',
    })).toBe(NUMBERED_STEP_CARDS_CLASS_NAME);
    expect(resolveNumberedStepCardsClassName({
      sectionClassName: 'retirement-rollovers-native-process',
    })).toBe(NUMBERED_STEP_CARDS_CLASS_NAME);
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
      { sectionClassName: 'retirement-rollovers-native-process' },
    ];

    numberedVariants.forEach((variant) => {
      expect(resolveNumberedStepCardsClassName(variant)).toBe(NUMBERED_STEP_CARDS_CLASS_NAME);
    });
  });
});
