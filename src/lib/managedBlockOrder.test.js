import { describe, expect, it } from 'vitest';
import {
  getManagedBlockRenderKey,
  mergePublishedManagedBlocks,
  placeManagedBlockAtDraftPosition,
} from './managedBlockOrder';

const block = (id) => ({ id });

describe('managed block order', () => {
  it('places a block at its draft position without reordering unrelated live blocks', () => {
    const draft = ['hero', 'intro_2', 'request_form', 'intro'].map(block);
    const live = ['hero', 'request_form', 'intro', 'intro_2'].map(block);

    expect(placeManagedBlockAtDraftPosition(live, draft, 'intro_2').map((entry) => entry.id))
      .toEqual(['hero', 'intro_2', 'request_form', 'intro']);
  });

  it('merges eligible page publishes using the draft-relative position', () => {
    const draft = ['hero', 'new-intro', 'request_form'].map(block);
    const live = ['hero', 'request_form'].map(block);

    expect(mergePublishedManagedBlocks(live, draft, ['new-intro']).map((entry) => entry.id))
      .toEqual(['hero', 'new-intro', 'request_form']);
  });

  it('uses stable block identity for renderer keys', () => {
    expect(getManagedBlockRenderKey({ id: 'intro_2', kind: 'intro' }, 4)).toBe('managed-block-intro_2');
    expect(getManagedBlockRenderKey({ kind: 'intro' }, 4)).toBe('managed-block-legacy-intro-4');
  });
});

