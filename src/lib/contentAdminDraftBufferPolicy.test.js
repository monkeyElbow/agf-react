import { describe, expect, it } from 'vitest';
import {
  getSharedBlockDraftSyncDelay,
  shouldBufferLocalBlockSetting,
  SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS,
  SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS,
} from './contentAdminDraftBufferPolicy';

describe('content admin draft buffer policy', () => {
  it('keeps text edits buffered and discrete presentation choices immediate', () => {
    expect(shouldBufferLocalBlockSetting('heading', 'New heading')).toBe(true);
    expect(shouldBufferLocalBlockSetting('bgTone', 'sand')).toBe(false);
    expect(getSharedBlockDraftSyncDelay('heading', 'New heading')).toBe(SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS);
    expect(getSharedBlockDraftSyncDelay('bgTone', 'sand')).toBe(SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS);
  });

  it('uses the slower text budget for mixed patches and the discrete budget for immediate-only patches', () => {
    expect(getSharedBlockDraftSyncDelay('', undefined, { bgTone: 'sand', textTone: 'dark' }))
      .toBe(SHARED_BLOCK_DRAFT_SYNC_DISCRETE_DELAY_MS);
    expect(getSharedBlockDraftSyncDelay('', undefined, { bgTone: 'sand', heading: 'New heading' }))
      .toBe(SHARED_BLOCK_DRAFT_SYNC_TEXT_DELAY_MS);
  });
});
