import { describe, expect, it } from 'vitest';
import {
  getBufferedStringDraftBlockKinds,
  getColorTextSelectionDraftBlockKinds,
  resolveRequestFormLeadCopyFieldId,
} from './block-editors/migratedBlockEditors';

describe('migrated block editor buffered draft coverage', () => {
  it('keeps the current buffered string-draft editor set explicit', () => {
    expect(getBufferedStringDraftBlockKinds()).toEqual([
      'site_feature',
      'feature_panel',
      'split_panel',
      'impact_stat',
      'services_grid',
      'card_grid',
      'calculator_cta',
      'billboard',
      'intro',
      'cta_form',
      'request_form',
      'columns',
      'photo_column',
    ]);
  });

  it('keeps the shared heading editor draft-coverage set explicit', () => {
    expect(getColorTextSelectionDraftBlockKinds()).toEqual([
      'cta_form',
      'request_form',
      'intro',
      'card_grid',
      'newsletter',
      'columns',
    ]);
  });

  it('uses bodyHtml as the canonical request-form lead-copy storage', () => {
    expect(resolveRequestFormLeadCopyFieldId({ subtitle: 'Legacy lead copy', body: 'Fallback copy' })).toBe('bodyHtml');
    expect(resolveRequestFormLeadCopyFieldId({ bodyHtml: '<p>Rich lead copy</p>' })).toBe('bodyHtml');
    expect(resolveRequestFormLeadCopyFieldId({ subtitle: '', body: '' })).toBe('bodyHtml');
  });
});
