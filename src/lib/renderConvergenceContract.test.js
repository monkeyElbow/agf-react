import { describe, expect, it } from 'vitest';
import {
  buildRenderConvergenceBlockContract,
  buildRenderConvergenceRouteContract,
} from './renderConvergenceContract';

describe('render convergence contract', () => {
  it('derives the same runtime hook used by the dynamic renderer', () => {
    expect(buildRenderConvergenceBlockContract({
      id: 'setup_steps',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'step-cards',
    })).toEqual({
      version: 1,
      blockId: 'setup_steps',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'step-cards',
      rootClassName: 'native-dynamic-grid',
      runtimeClassName: 'is-card-grid-preset-step-cards',
    });
  });

  it('keeps route verification tied to the active route and revision', () => {
    expect(buildRenderConvergenceRouteContract({
      pathname: '/online-contributions',
      source: 'authoring',
      revision: 'draft-123',
      blocks: [{
        id: 'setup_steps',
        kind: 'card_grid',
        mode: 'dynamic',
        presetId: 'step-cards',
      }],
    })).toEqual({
      version: 1,
      pathname: '/online-contributions',
      source: 'authoring',
      revision: 'draft-123',
      blocks: [{
        version: 1,
        blockId: 'setup_steps',
        kind: 'card_grid',
        mode: 'dynamic',
        presetId: 'step-cards',
        rootClassName: 'native-dynamic-grid',
        runtimeClassName: 'is-card-grid-preset-step-cards',
      }],
    });
  });
});
