import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('mission assure native page content', () => {
  it('uses the reusable Mission Assure logo component for the main wordmark and keeps the medical badge asset', () => {
    const content = getNativePageContent('/services/insurance/mission-assure', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const introSection = sections.find((section) => section?.className === 'mission-assure-native-intro');
    const medicalSection = sections.find((section) => section?.className === 'mission-assure-native-medical');

    expect(content?.pageClass).toBe('native-info-page--mission-assure');
    expect(typeof introSection?.logoComponent).toBe('function');
    expect(introSection?.logoImage).toBeUndefined();
    expect(introSection?.logoAlt).toBe('Mission Assure');
    expect(typeof medicalSection?.logoImage).toBe('string');
  });
});
