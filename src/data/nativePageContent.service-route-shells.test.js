import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('service root native page content shells', () => {
  it('keeps custom-owned root service pages on shell-only native seeds without dormant fallback widgets', () => {
    const loansContent = getNativePageContent('/services/loans', '');
    const investmentsContent = getNativePageContent('/services/investments', '');
    const retirementContent = getNativePageContent('/services/retirement', '');

    expect(Array.isArray(loansContent?.sections) ? loansContent.sections : []).toEqual([]);
    expect(Array.isArray(investmentsContent?.sections) ? investmentsContent.sections : []).toEqual([]);
    expect(Array.isArray(retirementContent?.sections) ? retirementContent.sections : []).toEqual([]);

    expect(loansContent?.hero).toBeUndefined();
    expect(loansContent?.intro).toBeUndefined();
    expect(investmentsContent?.hero).toBeUndefined();
    expect(investmentsContent?.intro).toBeUndefined();
    expect(retirementContent?.hero).toBeUndefined();
    expect(retirementContent?.intro).toBeUndefined();
  });

  it('keeps migrated retirement child pages on shell-only native seeds once blocks own the route', () => {
    const retirement403bContent = getNativePageContent('/services/retirement/403b', '');
    const groupEnrollmentContent = getNativePageContent('/services/retirement/403b/403b-group-enrollment', '');
    const termsDefinitionsContent = getNativePageContent('/services/retirement/403b/403b-terms-definitions', '');
    const deferredCompContent = getNativePageContent('/services/retirement/409a', '');
    const retirementIrasContent = getNativePageContent('/services/retirement/iras', '');
    const fundAnIraContent = getNativePageContent('/services/retirement/iras/fund-an-ira', '');
    const retirementConsultantsContent = getNativePageContent('/services/retirement/retirement-consultants', '');
    const retirementRolloversContent = getNativePageContent('/services/retirement/rollovers', '');

    expect(String(retirement403bContent?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(Array.isArray(retirement403bContent?.sections) ? retirement403bContent.sections : []).toEqual([]);
    expect(retirement403bContent?.hero).toBeUndefined();
    expect(retirement403bContent?.intro).toBeUndefined();

    expect(String(groupEnrollmentContent?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(Array.isArray(groupEnrollmentContent?.sections) ? groupEnrollmentContent.sections : []).toEqual([]);
    expect(groupEnrollmentContent?.hero).toBeUndefined();
    expect(groupEnrollmentContent?.intro).toBeUndefined();

    expect(String(termsDefinitionsContent?.pageClass || '')).toContain('native-info-page--retirement-403b');
    expect(Array.isArray(termsDefinitionsContent?.sections) ? termsDefinitionsContent.sections : []).toEqual([]);
    expect(termsDefinitionsContent?.hero).toBeUndefined();
    expect(termsDefinitionsContent?.intro).toBeUndefined();

    expect(String(deferredCompContent?.pageClass || '')).toContain('native-info-page--retirement-409a');
    expect(Array.isArray(deferredCompContent?.sections) ? deferredCompContent.sections : []).toEqual([]);
    expect(deferredCompContent?.hero).toBeUndefined();
    expect(deferredCompContent?.intro).toBeUndefined();

    expect(String(retirementIrasContent?.pageClass || '')).toContain('native-info-page--retirement-iras');
    expect(Array.isArray(retirementIrasContent?.sections) ? retirementIrasContent.sections : []).toEqual([]);
    expect(retirementIrasContent?.hero).toBeUndefined();
    expect(retirementIrasContent?.intro).toBeUndefined();

    expect(String(fundAnIraContent?.pageClass || '')).toContain('native-info-page--retirement-fund-ira');
    expect(Array.isArray(fundAnIraContent?.sections) ? fundAnIraContent.sections : []).toEqual([]);
    expect(fundAnIraContent?.hero).toBeUndefined();
    expect(fundAnIraContent?.intro).toBeUndefined();

    expect(String(retirementConsultantsContent?.pageClass || '')).toContain('native-info-page--retirement-consultants');
    expect(Array.isArray(retirementConsultantsContent?.sections) ? retirementConsultantsContent.sections : []).toEqual([]);
    expect(retirementConsultantsContent?.hero).toBeUndefined();
    expect(retirementConsultantsContent?.intro).toBeUndefined();

    expect(String(retirementRolloversContent?.pageClass || '')).toContain('native-info-page--retirement-rollovers');
    expect(Array.isArray(retirementRolloversContent?.sections) ? retirementRolloversContent.sections : []).toEqual([]);
    expect(retirementRolloversContent?.hero).toBeUndefined();
    expect(retirementRolloversContent?.intro).toBeUndefined();
  });

  it('keeps migrated utility pages on shell-only native seeds once blocks own the route', () => {
    const accessibilityContent = getNativePageContent('/accessibility', '');
    const claimContent = getNativePageContent('/services/insurance/mission-assure/report-a-claim', '');
    const onlineContributionsContent = getNativePageContent('/online-contributions', '');
    const privacyContent = getNativePageContent('/privacy-policy', '');
    const resourcesContent = getNativePageContent('/resources', '');
    const subscribeContent = getNativePageContent('/subscribe', '');
    const termsContent = getNativePageContent('/terms-of-service', '');
    const vineyardContent = getNativePageContent('/vineyard', '');
    const yourPlanContent = getNativePageContent('/yourplan', '');

    expect(accessibilityContent?.compact).toBe(true);
    expect(accessibilityContent?.hideHero).toBe(true);
    expect(String(accessibilityContent?.pageClass || '')).toContain('native-info-page--accessibility');
    expect(Array.isArray(accessibilityContent?.sections) ? accessibilityContent.sections : []).toEqual([]);
    expect(accessibilityContent?.hero).toBeUndefined();
    expect(accessibilityContent?.intro).toBeUndefined();
    expect(Array.isArray(accessibilityContent?.actions) ? accessibilityContent.actions : []).toEqual([]);

    expect(claimContent?.compact).toBe(true);
    expect(Array.isArray(claimContent?.sections) ? claimContent.sections : []).toEqual([]);
    expect(claimContent?.hero).toBeUndefined();
    expect(claimContent?.intro).toBeUndefined();
    expect(Array.isArray(claimContent?.actions) ? claimContent.actions : []).toEqual([]);

    expect(onlineContributionsContent?.compact).toBe(true);
    expect(String(onlineContributionsContent?.pageClass || '')).toContain('native-info-page--online-contributions');
    expect(Array.isArray(onlineContributionsContent?.sections) ? onlineContributionsContent.sections : []).toEqual([]);
    expect(onlineContributionsContent?.hero).toBeUndefined();
    expect(onlineContributionsContent?.intro).toBeUndefined();
    expect(Array.isArray(onlineContributionsContent?.actions) ? onlineContributionsContent.actions : []).toEqual([]);

    expect(privacyContent?.compact).toBe(true);
    expect(Array.isArray(privacyContent?.sections) ? privacyContent.sections : []).toEqual([]);
    expect(privacyContent?.hero).toBeUndefined();
    expect(privacyContent?.intro).toBeUndefined();
    expect(Array.isArray(privacyContent?.actions) ? privacyContent.actions : []).toEqual([]);

    expect(resourcesContent?.compact).toBe(true);
    expect(Array.isArray(resourcesContent?.sections) ? resourcesContent.sections : []).toEqual([]);
    expect(resourcesContent?.hero).toBeUndefined();
    expect(resourcesContent?.intro).toBeUndefined();
    expect(Array.isArray(resourcesContent?.actions) ? resourcesContent.actions : []).toEqual([]);

    expect(subscribeContent?.compact).toBe(true);
    expect(Array.isArray(subscribeContent?.sections) ? subscribeContent.sections : []).toEqual([]);
    expect(subscribeContent?.hero).toBeUndefined();
    expect(subscribeContent?.intro).toBeUndefined();
    expect(Array.isArray(subscribeContent?.actions) ? subscribeContent.actions : []).toEqual([]);

    expect(termsContent?.compact).toBe(true);
    expect(Array.isArray(termsContent?.sections) ? termsContent.sections : []).toEqual([]);
    expect(termsContent?.hero).toBeUndefined();
    expect(termsContent?.intro).toBeUndefined();
    expect(Array.isArray(termsContent?.actions) ? termsContent.actions : []).toEqual([]);

    expect(vineyardContent?.compact).toBe(true);
    expect(Array.isArray(vineyardContent?.sections) ? vineyardContent.sections : []).toEqual([]);
    expect(vineyardContent?.hero).toBeUndefined();
    expect(vineyardContent?.intro).toBeUndefined();
    expect(Array.isArray(vineyardContent?.actions) ? vineyardContent.actions : []).toEqual([]);

    expect(yourPlanContent?.compact).toBe(true);
    expect(Array.isArray(yourPlanContent?.sections) ? yourPlanContent.sections : []).toEqual([]);
    expect(yourPlanContent?.hero).toBeUndefined();
    expect(yourPlanContent?.intro).toBeUndefined();
    expect(Array.isArray(yourPlanContent?.actions) ? yourPlanContent.actions : []).toEqual([]);
  });
});
