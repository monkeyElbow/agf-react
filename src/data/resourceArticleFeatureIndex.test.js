import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getResourceArticleFeatureConfig, resourceArticleFeatureIndex } from './resourceArticleFeatureIndex';

const articles = JSON.parse(readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'resourcesArticlesSeed.json'),
  'utf8',
));

describe('resource article feature index', () => {
  it('matches the canonical article metadata used by public feature cards', () => {
    resourceArticleFeatureIndex.forEach((feature) => {
      const source = articles.find((article) => article.slug === feature.slug);
      expect(source).toBeTruthy();
      expect(feature.title).toBe(source.title);
      expect(feature.imageUrl).toBe(source.imageUrl || source.mediaUrl);
    });
  });

  it('preserves public feature card links without loading article bodies', () => {
    const feature = getResourceArticleFeatureConfig({ slug: 'church-cash-reserves' });
    expect(feature).toMatchObject({
      title: 'Church Cash Reserves',
      image: 'https://media.agfinancial.org/2019_AGF-Blog-Header-CashReserves.jpg?v=1591166907',
      to: '/resources/article/church-cash-reserves',
    });
  });
});
