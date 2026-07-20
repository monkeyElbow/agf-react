import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('403(b) group enrollment native page content', () => {
  it('stays shell-only after block-first migration', () => {
    const content = getNativePageContent('/services/retirement/403b/403b-group-enrollment', '');

    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-child');
    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(content?.hero).toBeUndefined();
    expect(content?.intro).toBeUndefined();
    expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);
  });
});
