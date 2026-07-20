import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { buildDynamicSiteFeatureFromBlock } from '../lib/dynamicPageBlocks';
import { buildImpactProofStoryMetrics } from './impactProofStorySeed';
import { getSiteFeatureCatalogEntry } from './siteFeatureCatalog';

describe('impact proof story seed guardrail', () => {
  it('keeps the managed site-feature runtime aligned to one shared content seed', () => {
    const impactBlock = (contentBlockBlueprintsByPath['/about-us/impact'] || [])
      .find((block) => block?.id === 'impact_proof_story');
    const managedRuntime = buildDynamicSiteFeatureFromBlock(impactBlock);
    const featureRuntime = getSiteFeatureCatalogEntry('impact_proof_story')?.buildRuntime?.({ settings: {} });

    expect(featureRuntime?.metrics).toEqual(buildImpactProofStoryMetrics());
    expect(managedRuntime?.featureIntro).toMatchObject({
      heading: 'Serving you, alongside you.',
      emphasis: 'We’re ministry allies.',
    });
    expect(managedRuntime?.metrics).toHaveLength(featureRuntime?.metrics?.length || 0);

    managedRuntime.metrics.forEach((managedMetric, index) => {
      const catalogMetric = featureRuntime.metrics[index];

      expect(managedMetric.value).toBe(catalogMetric.value);
      expect(managedMetric.label).toBe(catalogMetric.label);
      expect(managedMetric.body).toBe(catalogMetric.body);
      expect(managedMetric.action.label).toBe(catalogMetric.action.label);
      expect(managedMetric.action.to).toBe(catalogMetric.action.to);
    });
  });
});
