import { describe, expect, it } from 'vitest';
import {
  getPageContentEditorHtml,
  hasLegacyPageContentSource,
} from './pageContentEditorHtml';

describe('page content editor HTML source resolution', () => {
  it('uses legacy body copy when the canonical editor fields are empty', () => {
    expect(getPageContentEditorHtml({
      html: '<p></p>',
      body: 'AGFinancial is an equal opportunity employer.',
    })).toBe('<p>AGFinancial is an equal opportunity employer.</p>');
    expect(hasLegacyPageContentSource({
      html: '<p></p>',
      body: 'AGFinancial is an equal opportunity employer.',
    })).toBeTruthy();
  });

  it('does not flatten fineprint or address fields into the body editor', () => {
    expect(getPageContentEditorHtml({
      html: '<p></p>',
      fineprint: 'Fax: 417.520.0406',
      addressTitle: 'Mail completed forms to:',
      addressLines: 'AGFinancial\nPO Box 2515',
    })).toBe('');
    expect(hasLegacyPageContentSource({
      html: '<p></p>',
      fineprint: 'Fax: 417.520.0406',
      addressTitle: 'Mail completed forms to:',
      addressLines: 'AGFinancial\nPO Box 2515',
    })).toBe(false);
  });

  it('keeps canonical HTML ahead of legacy page content sources', () => {
    expect(getPageContentEditorHtml({
      html: '<p>Canonical copy.</p>',
      fineprint: 'Legacy copy.',
    })).toBe('<p>Canonical copy.</p>');
    expect(hasLegacyPageContentSource({
      html: '<p>Canonical copy.</p>',
      fineprint: 'Legacy copy.',
    })).toBe(false);
  });
});
