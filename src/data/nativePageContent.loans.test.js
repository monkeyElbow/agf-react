import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('loans native page content', () => {
  it('keeps only the shared native hero and intro seed now that the custom loans route owns the page body', () => {
    const content = getNativePageContent('/services/loans', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];

    expect(content?.pageClass).toBe('loans-native-page native-info-page--loans');
    expect(content?.intro?.heading).toBe('The right loan can change everything.');
    expect(content?.intro?.actions?.[0]).toMatchObject({ label: 'Get started', to: '/services/loans#form' });
    expect(sections).toEqual([]);
  });
});
