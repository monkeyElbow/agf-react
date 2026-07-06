import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';
import { buildImpactProofNativeCards, buildImpactProofStoryMetrics } from './impactProofStorySeed';
import { getSiteFeatureCatalogEntry } from './siteFeatureCatalog';

describe('impact proof story seed guardrail', () => {
  it('keeps the native fallback and managed site-feature runtime aligned to one shared content seed', () => {
    const nativeImpactPage = getNativePageContent('/about-us/impact', 'Impact');
    const nativeSection = nativeImpactPage.sections.find((section) => section?.className === 'impact-native-stats');
    const featureRuntime = getSiteFeatureCatalogEntry('impact_proof_story')?.buildRuntime?.({ settings: {} });

    expect(nativeSection?.cards).toEqual(buildImpactProofNativeCards());
    expect(featureRuntime?.metrics).toEqual(buildImpactProofStoryMetrics());

    expect(nativeSection?.cards).toHaveLength(featureRuntime?.metrics?.length || 0);

    nativeSection.cards.forEach((card, index) => {
      const metric = featureRuntime.metrics[index];

      expect(card.title).toBe(metric.value);
      expect(card.subtitle).toBe(metric.label);
      expect(card.body).toBe(metric.body);
      expect(card.cta).toBe(metric.action.label);
      expect(card.to).toBe(metric.action.to);
    });
  });
});
