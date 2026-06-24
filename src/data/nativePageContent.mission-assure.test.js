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
    expect(introSection?.logoAlt).toBe('Mission Assure®');
    expect(introSection?.body?.[0]).toBe('As low as **$1.25/day**');
    expect(introSection?.body?.[1]).toContain('Mission Assure® helps take the “what if” out of church trips and events.');
    expect(introSection?.widget).toBe('mission-assure-pricing');
    expect(introSection?.pricing?.entries).toEqual([
      expect.objectContaining({ trip: 'Domestic', rate: '$1.25/day', note: 'Limited medical coverage included' }),
      expect.objectContaining({ trip: 'International', rate: '$4.95/day', note: 'Medical coverage included' }),
    ]);
    expect(typeof medicalSection?.logoImage).toBe('string');
  });
});
