import { isPageHiddenFromSearch, sitePages } from '../data/siteMap';

export function normalizeSiteSearchText(text) {
  return String(text || '').toLowerCase().trim();
}

export function kindToSearchExcerpt(kind) {
  if (kind === 'web-form') return 'Web form';
  if (kind === 'zip') return 'ZIP file';
  if (kind === 'external-page') return 'Web page';
  if (kind === 'pdf') return 'PDF document';
  return 'Document';
}

export function resultGroupLabel(group) {
  if (group === 'article') return 'Resource Articles';
  if (group === 'document') return 'Documents';
  return 'Site Pages';
}

export function resultTypeLabel(type) {
  if (type === 'article') return 'Resource Article';
  if (type === 'document') return 'Document';
  return 'Site Page';
}

export function scoreSiteSearchMatch(item, needle) {
  const title = normalizeSiteSearchText(item.title);
  const path = normalizeSiteSearchText(item.path);
  const section = normalizeSiteSearchText(item.section);
  const excerpt = normalizeSiteSearchText(item.excerpt);

  let score = 0;
  if (title.startsWith(needle)) score += 60;
  if (title.includes(needle)) score += 30;
  if (path.includes(needle)) score += 18;
  if (section.includes(needle)) score += 10;
  if (excerpt.includes(needle)) score += 8;
  if (item.group === 'page') score += 2;
  return score;
}

export function buildSearchableSitePages() {
  return sitePages
    .filter((page) => !page.path.startsWith('/admin/') && page.path !== '/search' && !isPageHiddenFromSearch(page))
    .map((page) => ({
      title: page.title,
      path: page.path,
      key: `page:${page.path}`,
      section: page.section || 'Site',
      excerpt: `${page.section || 'Site'} page`,
      resultType: 'page',
      group: 'page',
    }));
}

export function buildSearchableResourceArticles(articles = []) {
  return (Array.isArray(articles) ? articles : [])
    .filter((article) => (
      article
      && article.type === 'article'
      && article.isPublished
      && String(article.slug || '').trim()
    ))
    .map((article) => ({
      title: article.title,
      path: `/resources/article/${encodeURIComponent(article.slug)}`,
      key: `resource-article:${article.id}`,
      section: article.category || 'Resources',
      excerpt: article.excerpt || 'Resource article',
      resultType: 'article',
      group: 'article',
    }));
}

export function buildSearchableDocuments(documents = []) {
  return (Array.isArray(documents) ? documents : [])
    .filter((doc) => doc && doc.active && doc.url)
    .map((doc) => ({
      title: doc.title,
      href: doc.url,
      key: `document:${doc.id}`,
      path: doc.category ? `/${doc.category}` : '/documents',
      section: doc.category ? `${doc.category} Documents` : 'Documents',
      excerpt: kindToSearchExcerpt(doc.kind),
      resultType: 'document',
      group: 'document',
      documentId: doc.id,
    }));
}

export function buildSiteSearchIndex({ documents = [], articles = [] } = {}) {
  return [
    ...buildSearchableSitePages(),
    ...buildSearchableResourceArticles(articles),
    ...buildSearchableDocuments(documents),
  ];
}

export function searchSiteIndex(items = [], query = '') {
  const needle = normalizeSiteSearchText(query);
  if (!needle) {
    return [];
  }

  return (Array.isArray(items) ? items : [])
    .filter((item) => {
      const haystack = `${item.title} ${item.path} ${item.section} ${item.excerpt || ''}`.toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => {
      const scoreDiff = scoreSiteSearchMatch(b, needle) - scoreSiteSearchMatch(a, needle);
      if (scoreDiff) {
        return scoreDiff;
      }
      return a.title.localeCompare(b.title);
    });
}

export function groupSiteSearchMatches(matches = []) {
  return ['page', 'article', 'document']
    .map((group) => ({
      group,
      label: resultGroupLabel(group),
      items: (Array.isArray(matches) ? matches : []).filter((item) => item.group === group),
    }))
    .filter((group) => group.items.length);
}
