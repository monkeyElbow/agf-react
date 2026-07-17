import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('403(b) overview native page content', () => {
  it('keeps only the route shell after the 403(b) overview is migrated to blocks', () => {
    const content = getNativePageContent('/services/retirement/403b', '');

    expect(String(content?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(content?.compact).toBe(true);
    expect(content?.hero).toBeUndefined();
    expect(content?.intro).toBeUndefined();
    expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);
  });
});
