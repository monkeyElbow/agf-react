import resourcesArticlesSeed from './resourcesArticlesSeed.json';

export const RESOURCE_ARTICLE_ROUTE_PREFIX = '/resources/article/';
export const resourceArticles = Array.isArray(resourcesArticlesSeed) ? resourcesArticlesSeed : [];

export function toResourceArticlePath(article) {
  const slug = String(article?.slug || '').trim();
  if (!slug) {
    return '';
  }
  return `${RESOURCE_ARTICLE_ROUTE_PREFIX}${encodeURIComponent(slug)}`;
}

export function findResourceArticle({ slug = '', title = '' } = {}) {
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  const normalizedTitle = String(title || '').trim().toLowerCase();

  if (normalizedSlug) {
    const slugMatch = resourceArticles.find((article) => (
      String(article?.slug || '').trim().toLowerCase() === normalizedSlug
    ));
    if (slugMatch) {
      return slugMatch;
    }
  }

  if (normalizedTitle) {
    return resourceArticles.find((article) => (
      String(article?.title || '').trim().toLowerCase() === normalizedTitle
    )) || null;
  }

  return null;
}

export function getResourceArticleFeatureConfig({
  slug = '',
  title = '',
  fallbackImage = '',
  fallbackImageAlt = '',
} = {}) {
  const article = findResourceArticle({ slug, title });
  return {
    article,
    image: String(article?.imageUrl || article?.mediaUrl || fallbackImage || '').trim(),
    imageAlt: String(fallbackImageAlt || article?.title || title || '').trim(),
    to: toResourceArticlePath(article) || '/resources',
    title: String(article?.title || title || '').trim(),
  };
}
