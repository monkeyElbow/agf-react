import { describe, expect, it } from 'vitest';
import {
  createDefaultBackgroundLight,
  getBackgroundLightMotion,
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
        expect.objectContaining({ tone: 'mango', strength: 100, x: 0, y: 72.56, size: 220, motion: true, positionModel: 'edge-v1' }),
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
      lights: [expect.objectContaining({ id: 'light-1', tone: 'blue', positionModel: 'edge-v1', x: 22, y: 28 })],
    });
  });

  it('migrates old center-relative positions once and preserves new edge positions', () => {
    expect(normalizeBackgroundEffects({ enabled: true, lights: [{ x: -46, y: -86 }] }).lights[0])
      .toEqual(expect.objectContaining({ positionModel: 'edge-v1', x: 4, y: 0 }));
    expect(normalizeBackgroundEffects({ enabled: true, lights: [{ positionModel: 'edge-v1', x: 4, y: 8 }] }).lights[0])
      .toEqual(expect.objectContaining({ positionModel: 'edge-v1', x: 4, y: 8 }));
    expect(normalizeBackgroundEffects({ enabled: true, lights: [{ positionModel: 'edge-v1', enabled: false, x: -25, y: 125 }] }).lights[0])
      .toEqual(expect.objectContaining({ enabled: false, positionModel: 'edge-v1', x: -25, y: 125 }));
  });

  it('uses predictable scroll transforms for directional and drift modes', () => {
    const directional = getBackgroundLightMotion({
      motion: true,
      motionMode: 'directional',
      motionX: 24,
      motionY: -18,
      motionSpeed: 100,
    }, 1);
    expect(directional).toEqual({ x: 24, y: -18, scale: 1.06 });

    const driftAtStart = getBackgroundLightMotion({
      motion: true,
      motionMode: 'drift',
      motionDistance: 40,
      motionSpeed: 100,
    }, 0, 1);
    const driftAtMidpoint = getBackgroundLightMotion({
      motion: true,
      motionMode: 'drift',
      motionDistance: 40,
      motionSpeed: 100,
    }, 0.5, 1);
    expect(driftAtStart).toEqual({ x: 0, y: 0, scale: 1 });
    expect(driftAtMidpoint).not.toEqual(driftAtStart);
    expect(getBackgroundLightMotion({ motion: true, motionMode: 'ambient' }, 0.5)).toEqual({ x: 0, y: 0, scale: 1 });
  });
});
