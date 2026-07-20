import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('loans native page content', () => {
  it('keeps the custom loans route on shell-only native metadata now that blocks own the page body', () => {
    const content = getNativePageContent('/services/loans', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];

    expect(content?.pageClass).toBe('loans-native-page native-info-page--loans');
    expect(content?.hero).toBeUndefined();
    expect(content?.intro).toBeUndefined();
    expect(sections).toEqual([]);
  });
});
