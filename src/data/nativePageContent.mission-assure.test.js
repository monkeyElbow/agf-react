import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

describe('mission assure native page content', () => {
  it('keeps Mission Assure native content shell-only with visible sections owned by blocks', () => {
    const content = getNativePageContent('/services/insurance/mission-assure', '');
    const blocks = contentBlockBlueprintsByPath['/services/insurance/mission-assure'] || [];
    const introBillboard = blocks.find((block) => block?.id === 'intro_billboard');
    const introBody = blocks.find((block) => block?.id === 'intro_body');
    const pricingColumns = blocks.find((block) => block?.id === 'pricing_columns');
    const medicalBlock = blocks.find((block) => block?.id === 'medical_included');

    expect(content?.pageClass).toBe('native-info-page--mission-assure');
    expect(content?.hero).toBeUndefined();
    expect(content?.sections).toBeUndefined();
    expect(introBillboard).toMatchObject({ kind: 'billboard', mode: 'dynamic' });
    expect(introBillboard?.settings?.logoKey).toBe('mission-assure');
    expect(introBillboard?.settings?.subtitle).toBe('As low as **$1.25/day**');
    expect(introBody?.settings?.body).toContain('Mission Assure® helps take the “what if” out of church trips and events.');
    expect(pricingColumns).toMatchObject({ kind: 'columns', mode: 'dynamic' });
    expect(pricingColumns?.settings?.col1Title).toBe('Domestic');
    expect(pricingColumns?.settings?.col2Title).toBe('International');
    expect(pricingColumns?.settings?.col1BodyHtml).toContain('$1.25/day');
    expect(medicalBlock?.settings?.html).toContain('mission-assure-medical-badge');
  });
});
