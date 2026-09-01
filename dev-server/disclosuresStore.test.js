import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createSharedDisclosuresStore } from './disclosuresStore';

const tempRoots = [];

function createTempFile() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agf-disclosures-store-'));
  tempRoots.push(root);
  return path.join(root, 'disclosures-shared.json');
}

afterEach(() => {
  while (tempRoots.length) {
    fs.rmSync(tempRoots.pop(), { recursive: true, force: true });
  }
});

describe('createSharedDisclosuresStore', () => {
  it('saves the whole disclosure patch live in one transaction', () => {
    const persistenceFile = createTempFile();
    const store = createSharedDisclosuresStore({ persistenceFile });

    const result = store.saveLivePatch({
      disclosures: [
        {
          id: 'loans-calculator-disclosure',
          value: 'Saved disclosure copy',
        },
      ],
      legalCopy: {
        certificatesHtml: 'Saved certificates copy',
      },
    }, {
      userId: 'dev-1',
      displayName: 'Taylor QA',
    });

    expect(result.hasUnpublishedChanges).toBe(false);
    expect(result.publishedBy.displayName).toBe('Taylor QA');
    expect(result.published.disclosures.find((entry) => entry.id === 'loans-calculator-disclosure')?.value).toBe('Saved disclosure copy');
    expect(result.published.legalCopy.certificatesHtml).toBe('Saved certificates copy');
  });

  it('persists shared draft disclosure updates without changing the live snapshot', () => {
    const persistenceFile = createTempFile();
    const store = createSharedDisclosuresStore({ persistenceFile });

    const result = store.saveDraftPatch({
      disclosures: [
        {
          id: 'loans-calculator-disclosure',
          value: 'Shared disclosure update',
        },
      ],
    }, {
      userId: 'dev-1',
      displayName: 'Taylor QA',
    });

    expect(result.draftUpdatedBy.displayName).toBe('Taylor QA');
    expect(result.hasUnpublishedChanges).toBe(true);
    expect(result.draft.disclosures.find((entry) => entry.id === 'loans-calculator-disclosure')?.value).toBe('Shared disclosure update');
    expect(result.published.disclosures.find((entry) => entry.id === 'loans-calculator-disclosure')?.value).not.toBe('Shared disclosure update');

    const raw = JSON.parse(fs.readFileSync(persistenceFile, 'utf8'));
    expect(raw.draft.disclosures.find((entry) => entry.id === 'loans-calculator-disclosure')?.value).toBe('Shared disclosure update');
    expect(raw.published.disclosures.find((entry) => entry.id === 'loans-calculator-disclosure')?.value).not.toBe('Shared disclosure update');
  });

  it('publishes the current draft to live', () => {
    const persistenceFile = createTempFile();
    const store = createSharedDisclosuresStore({ persistenceFile });

    store.saveDraftPatch({
      disclosures: [
        {
          id: 'loans-calculator-disclosure',
          value: 'Shared disclosure update',
        },
      ],
      legalCopy: {
        certificatesHtml: 'Changed certificates copy',
      },
    }, {
      userId: 'dev-1',
      displayName: 'Taylor QA',
    });

    const published = store.publishDraft({
      userId: 'dev-2',
      displayName: 'Morgan PM',
    });

    expect(published.publishedBy.displayName).toBe('Morgan PM');
    expect(published.hasUnpublishedChanges).toBe(false);
    expect(published.published.disclosures.find((entry) => entry.id === 'loans-calculator-disclosure')?.value).toBe('Shared disclosure update');
    expect(published.published.legalCopy.certificatesHtml).toBe('Changed certificates copy');
  });

  it('restores the draft from live and can reset the draft back to defaults', () => {
    const persistenceFile = createTempFile();
    const store = createSharedDisclosuresStore({ persistenceFile });

    store.saveDraftPatch({
      legalCopy: {
        certificatesHtml: 'Changed certificates copy',
      },
    }, {
      userId: 'dev-1',
      displayName: 'Taylor QA',
    });

    const restored = store.restoreDraftFromPublished({
      userId: 'dev-2',
      displayName: 'Morgan PM',
    });

    expect(restored.draftUpdatedBy.displayName).toBe('Morgan PM');
    expect(restored.hasUnpublishedChanges).toBe(false);
    expect(restored.draft.legalCopy.certificatesHtml).not.toBe('Changed certificates copy');

    store.saveDraftPatch({
      legalCopy: {
        certificatesHtml: 'Changed again',
      },
    }, {
      userId: 'dev-3',
      displayName: 'Casey Ops',
    });

    const reset = store.resetDraftToDefaults({
      userId: 'dev-4',
      displayName: 'Avery Admin',
    });

    expect(reset.draftUpdatedBy.displayName).toBe('Avery Admin');
    expect(reset.hasUnpublishedChanges).toBe(false);
    expect(reset.draft.legalCopy.certificatesHtml).not.toBe('Changed again');
    expect(reset.draft.disclosures.find((entry) => entry.id === 'loans-calculator-disclosure')?.value).toContain('official quote or recommendation');
  });
});
