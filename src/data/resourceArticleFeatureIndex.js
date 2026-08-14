const RESOURCE_ARTICLE_ROUTE_PREFIX = '/resources/article/';

// Public page feature cards need only this metadata. Full article bodies stay
// behind the Resources route/admin boundary.
export const resourceArticleFeatureIndex = Object.freeze([
  {
    slug: 'tariffs-timing-truth-keep-building-through-the-chaos',
    title: 'Tariffs, Timing & Truth: Keep Building Through the Chaos',
    imageUrl: 'https://media.agfinancial.org/2025_AGF-Web-HERO-Tariffs1_2025-07-18-175200_nycg.jpg?v=1752861120',
  },
  {
    slug: 'top-3-investing-mistakes-to-avoid',
    title: 'Top 3 investing mistakes to avoid...',
    imageUrl: 'https://media.agfinancial.org/matt-bowden-GZc4fnQsaWQ-unsplash_2025-04-30-172133_jwis.jpg?v=1746033694',
  },
  {
    slug: 'church-cash-reserves',
    title: 'Church Cash Reserves',
    imageUrl: 'https://media.agfinancial.org/2019_AGF-Blog-Header-CashReserves.jpg?v=1591166907',
  },
  {
    slug: 'opportunity',
    title: 'Opportunity is Knocking',
    imageUrl: 'https://media.agfinancial.org/2023_AGF-Web-HERO_SECURE1_2023-02-21-192319_xrvv.jpg?v=1677007400',
  },
  {
    slug: 'summer-camp-safety-tips',
    title: 'Summer Camp Safety Tips',
    imageUrl: 'https://media.agfinancial.org/2019_AGF-Blog-Header-CampSafety-1.jpg?v=1591166911',
  },
  {
    slug: 'defend-yourself-against-fraud',
    title: 'Defend Yourself Against Fraud',
    imageUrl: 'https://media.agfinancial.org/2019_AGF-Blog-Header-FraudSecurity.jpg?v=1591166912',
  },
]);

function findFeatureArticle({ slug = '', title = '' } = {}) {
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  const normalizedTitle = String(title || '').trim().toLowerCase();
  return resourceArticleFeatureIndex.find((article) => (
    (normalizedSlug && article.slug === normalizedSlug)
      || (normalizedTitle && article.title.toLowerCase() === normalizedTitle)
  )) || null;
}

export function getResourceArticleFeatureConfig({
  slug = '',
  title = '',
  fallbackImage = '',
  fallbackImageAlt = '',
} = {}) {
  const article = findFeatureArticle({ slug, title });
  return {
    article,
    image: String(article?.imageUrl || fallbackImage || '').trim(),
    imageAlt: String(fallbackImageAlt || article?.title || title || '').trim(),
    to: article?.slug
      ? `${RESOURCE_ARTICLE_ROUTE_PREFIX}${encodeURIComponent(article.slug)}`
      : '/resources',
    title: String(article?.title || title || '').trim(),
  };
}
