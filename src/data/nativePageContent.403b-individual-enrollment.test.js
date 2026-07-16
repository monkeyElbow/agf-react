import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('403(b) individual enrollment native page content', () => {
  it('keeps only the route shell after the individual enrollment page is migrated to blocks', () => {
    const content = getNativePageContent('/services/retirement/403b/403b-individual-enrollment', '');

    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-child');
    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(content?.hero || null).toBeNull();
    expect(content?.intro || null).toBeNull();
    expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);
  });
});
