import { describe, expect, it } from 'vitest';
import { getResourceArticleFeatureConfig } from './resourceArticles';

describe('resource article feature config', () => {
  it('resolves the church cash reserves article route and media', () => {
    const feature = getResourceArticleFeatureConfig({
      slug: 'church-cash-reserves',
      title: 'Church Cash Reserves',
      fallbackImageAlt: 'Church Cash Reserves',
    });

    expect(feature.title).toBe('Church Cash Reserves');
    expect(feature.image).toContain('media.agfinancial.org');
    expect(feature.to).toBe('/resources/article/church-cash-reserves');
  });

  it('resolves the loans tariffs article route and media', () => {
    const feature = getResourceArticleFeatureConfig({
      slug: 'tariffs-timing-truth-keep-building-through-the-chaos',
      title: 'Tariffs, Timing & Truth: Keep Building Through the Chaos',
      fallbackImageAlt: 'Tariffs, Timing & Truth',
    });

    expect(feature.title).toBe('Tariffs, Timing & Truth: Keep Building Through the Chaos');
    expect(feature.image).toContain('media.agfinancial.org');
    expect(feature.to).toBe('/resources/article/tariffs-timing-truth-keep-building-through-the-chaos');
  });

  it('resolves the retirement top-3 article route and media', () => {
    const feature = getResourceArticleFeatureConfig({
      slug: 'top-3-investing-mistakes-to-avoid',
      title: 'Top 3 investing mistakes to avoid...',
      fallbackImageAlt: 'Top 3 investing mistakes to avoid',
    });

    expect(feature.title).toBe('Top 3 investing mistakes to avoid...');
    expect(feature.image).toContain('media.agfinancial.org');
    expect(feature.to).toBe('/resources/article/top-3-investing-mistakes-to-avoid');
  });
});
