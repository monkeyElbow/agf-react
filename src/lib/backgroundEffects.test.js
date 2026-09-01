import { describe, expect, it } from 'vitest';
import {
  createDefaultBackgroundLight,
  normalizeBackgroundEffects,
  serializeBackgroundEffects,
} from './backgroundEffects';

describe('background effects contract', () => {
  it('normalizes a bounded, safe set of independently placed lights', () => {
    const effects = normalizeBackgroundEffects({
      enabled: true,
      clip: false,
      lights: [
        { tone: 'mango', strength: 140, x: -140, y: 22.555, size: 500, motion: true },
        { tone: 'not-a-color' },
        {},
        {},
      ],
    });

    expect(effects).toEqual({
      enabled: true,
      clip: false,
      lights: [
        expect.objectContaining({ tone: 'mango', strength: 100, x: -100, y: 22.56, size: 220, motion: true }),
        expect.objectContaining({ tone: 'blue' }),
        expect.objectContaining({ tone: 'blue' }),
      ],
    });
  });

  it('keeps disabled or malformed persisted values harmless', () => {
    expect(normalizeBackgroundEffects('not json')).toEqual({ enabled: false, clip: true, lights: [] });
    expect(normalizeBackgroundEffects({ enabled: true, lights: [] }).enabled).toBe(false);
    expect(JSON.parse(serializeBackgroundEffects({ enabled: true, lights: [createDefaultBackgroundLight()] }))).toMatchObject({
      enabled: true,
      clip: true,
      lights: [expect.objectContaining({ id: 'light-1', tone: 'blue' })],
    });
  });
});
