import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

describe('mission assure native page content', () => {
  it('keeps Mission Assure native content shell-only with visible sections owned by blocks', () => {
    const content = getNativePageContent('/services/insurance/mission-assure', '');
    const blocks = contentBlockBlueprintsByPath['/services/insurance/mission-assure'] || [];
    const introBlock = blocks.find((block) => block?.id === 'intro_pricing');
    const medicalBlock = blocks.find((block) => block?.id === 'medical_included');

    expect(content?.pageClass).toBe('native-info-page--mission-assure');
    expect(content?.hero).toBeUndefined();
    expect(content?.sections).toBeUndefined();
    expect(introBlock?.settings?.subtitle).toBe('As low as **$1.25/day**');
    expect(introBlock?.settings?.body).toContain('Mission Assure® helps take the “what if” out of church trips and events.');
    expect(introBlock?.settings?.widget).toBe('mission-assure-pricing');
    expect(JSON.parse(introBlock?.settings?.pricingEntriesJson || '[]')).toEqual([
      expect.objectContaining({ trip: 'Domestic', rate: '$1.25/day', note: 'Limited medical coverage included' }),
      expect.objectContaining({ trip: 'International', rate: '$4.95/day', note: 'Medical coverage included' }),
    ]);
    expect(medicalBlock?.settings?.html).toContain('mission-assure-medical-badge');
  });
});
