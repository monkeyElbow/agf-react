import resourcesArticlesSeed from './resourcesArticlesSeed.json';

// Full article metadata is only needed by the admin picker. Keep the public
// feature resolver on the small catalog so public routes do not pay for it.
export const resourceArticleFeatureAdminCatalog = Object.freeze(
  (Array.isArray(resourcesArticlesSeed) ? resourcesArticlesSeed : [])
    .map((article) => ({
      slug: String(article?.slug || '').trim(),
      title: String(article?.title || '').trim(),
      excerpt: String(article?.excerpt || '').trim(),
      imageUrl: String(article?.imageUrl || article?.mediaUrl || '').trim(),
      category: String(article?.category || '').trim(),
    }))
    .filter((article) => article.slug && article.title),
);
