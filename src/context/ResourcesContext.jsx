import { createContext, useContext, useMemo, useState } from 'react';
import seedArticles from '../data/resourcesArticlesSeed.json';

const STORAGE_KEY = 'agf-resources-admin-v1';
const ResourcesContext = createContext(null);

function normalizeArticle(article) {
  const slug = String(article?.slug || '')
    .trim()
    .toLowerCase();

  return {
    id: String(article?.id || `article-${slug}`),
    slug,
    type: String(article?.type || 'article'),
    title: String(article?.title || ''),
    category: String(article?.category || 'Article'),
    mediaUrl: String(article?.mediaUrl || article?.imageUrl || ''),
    imageUrl: String(article?.imageUrl || article?.mediaUrl || ''),
    sourceUrl: String(article?.sourceUrl || ''),
    publishedAt: String(article?.publishedAt || ''),
    excerpt: String(article?.excerpt || ''),
    bodyHtml: String(article?.bodyHtml || ''),
    isPublished: article?.isPublished !== false,
  };
}

function sortArticles(items) {
  return [...items].sort((a, b) => {
    const aDate = Date.parse(a.publishedAt || '1970-01-01');
    const bDate = Date.parse(b.publishedAt || '1970-01-01');
    return bDate - aDate;
  });
}

function buildDefaultState() {
  return sortArticles((Array.isArray(seedArticles) ? seedArticles : []).map(normalizeArticle));
}

function readInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return buildDefaultState();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return buildDefaultState();
    }

    return sortArticles(parsed.map(normalizeArticle));
  } catch {
    return buildDefaultState();
  }
}

function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ResourcesProvider({ children }) {
  const [articlesState, setArticlesState] = useState(readInitialState);

  const value = useMemo(() => {
    const save = (next) => {
      const normalized = sortArticles(next.map(normalizeArticle));
      setArticlesState(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // Ignore storage failures and keep in-memory state.
      }
      return normalized;
    };

    const updateArticle = (id, patch) => {
      if (!id) {
        return null;
      }

      const next = articlesState.map((article) => {
        if (article.id !== id) {
          return article;
        }

        const merged = {
          ...article,
          ...patch,
        };

        if (Object.prototype.hasOwnProperty.call(patch || {}, 'slug')) {
          merged.slug = normalizeSlug(patch.slug);
        }

        if (
          Object.prototype.hasOwnProperty.call(patch || {}, 'mediaUrl')
          && !Object.prototype.hasOwnProperty.call(patch || {}, 'imageUrl')
        ) {
          merged.imageUrl = patch.mediaUrl;
        }

        if (
          Object.prototype.hasOwnProperty.call(patch || {}, 'imageUrl')
          && !Object.prototype.hasOwnProperty.call(patch || {}, 'mediaUrl')
        ) {
          merged.mediaUrl = patch.imageUrl;
        }

        return normalizeArticle(merged);
      });

      save(next);
      return id;
    };

    const createArticle = () => {
      const timestamp = Date.now();
      const id = `article-${timestamp}`;
      const next = [
        {
          id,
          slug: `new-article-${timestamp}`,
          type: 'article',
          title: 'New Article',
          category: 'Article',
          mediaUrl: '',
          imageUrl: '',
          sourceUrl: '',
          publishedAt: new Date().toISOString(),
          excerpt: '',
          bodyHtml: '<p></p>',
          isPublished: false,
        },
        ...articlesState,
      ];
      save(next);
      return id;
    };

    const deleteArticle = (id) => {
      if (!id) {
        return;
      }
      save(articlesState.filter((article) => article.id !== id));
    };

    const resetArticles = () => {
      const defaults = buildDefaultState();
      setArticlesState(defaults);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage failures.
      }
    };

    return {
      articles: articlesState,
      updateArticle,
      createArticle,
      deleteArticle,
      resetArticles,
    };
  }, [articlesState]);

  return (
    <ResourcesContext.Provider value={value}>
      {children}
    </ResourcesContext.Provider>
  );
}

export function useResources() {
  const context = useContext(ResourcesContext);
  if (!context) {
    throw new Error('useResources must be used within ResourcesProvider');
  }
  return context;
}

