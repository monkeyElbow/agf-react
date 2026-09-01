import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { resourceArticleFeatureCatalog } from '../data/resourceArticleFeatureCatalog';

const STORAGE_KEY = 'agf-resources-admin-v1';
export const ResourcesContext = createContext(null);

function normalizeArticle(article) {
  const normalized = normalizeArticleFields(article);
  const hasPublishedSnapshot = Object.prototype.hasOwnProperty.call(article || {}, 'publishedSnapshot');
  const publishedSnapshot = hasPublishedSnapshot && article?.publishedSnapshot
    ? normalizeArticleFields(article.publishedSnapshot, { isPublished: true })
    : (hasPublishedSnapshot ? null : (normalized.isPublished ? { ...normalized } : null));

  return {
    ...normalized,
    publishedSnapshot,
    scheduledPublishAt: String(article?.scheduledPublishAt || ''),
    draftSavedAt: String(article?.draftSavedAt || ''),
  };
}

function normalizeArticleFields(article, { isPublished = true } = {}) {
  const rawCategory = String(article?.category || 'Article').trim();
  const category = /^Legacy\s+Giving$/i.test(rawCategory) ? 'Planned Giving' : rawCategory;
  const slug = String(article?.slug || '')
    .trim()
    .toLowerCase();

  return {
    id: String(article?.id || `article-${slug}`),
    slug,
    type: String(article?.type || 'article'),
    title: String(article?.title || ''),
    category,
    mediaUrl: String(article?.mediaUrl || article?.imageUrl || ''),
    imageUrl: String(article?.imageUrl || article?.mediaUrl || ''),
    sourceUrl: String(article?.sourceUrl || ''),
    publishedAt: String(article?.publishedAt || ''),
    excerpt: String(article?.excerpt || ''),
    bodyHtml: String(article?.bodyHtml || ''),
    socialImageUrl: String(article?.socialImageUrl || article?.socialMediaUrl || ''),
    socialTitle: String(article?.socialTitle || ''),
    socialDescription: String(article?.socialDescription || ''),
    socialImageAlt: String(article?.socialImageAlt || ''),
    isPublished: article?.isPublished !== false && isPublished,
  };
}

function cloneArticleFields(article, options) {
  return normalizeArticleFields(article, options);
}

function getArticleFields(article) {
  return normalizeArticleFields(article, { isPublished: article?.isPublished !== false });
}

function hasDraftChanges(article) {
  if (!article?.publishedSnapshot) {
    return true;
  }
  return JSON.stringify(getArticleFields(article)) !== JSON.stringify(
    cloneArticleFields(article.publishedSnapshot, { isPublished: true }),
  );
}

function getArticleStatus(article) {
  if (article?.scheduledPublishAt) {
    return 'scheduled';
  }
  if (!article?.publishedSnapshot || hasDraftChanges(article)) {
    return 'draft';
  }
  return 'live';
}

function sortArticles(items) {
  return [...items].sort((a, b) => {
    const aDate = Date.parse(a.publishedAt || '1970-01-01');
    const bDate = Date.parse(b.publishedAt || '1970-01-01');
    return bDate - aDate;
  });
}

function buildDefaultState() {
  return sortArticles((Array.isArray(resourceArticleFeatureCatalog) ? resourceArticleFeatureCatalog : []).map((article) => {
    const fields = normalizeArticleFields(article);
    return normalizeArticle({
      ...fields,
      publishedSnapshot: fields,
      isPublished: true,
    });
  }));
}

function hasStoredState() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

function buildHydratedState(seedArticles, currentArticles = []) {
  const currentById = new Map(currentArticles.map((article) => [article.id, article]));
  return sortArticles((Array.isArray(seedArticles) ? seedArticles : []).map((article) => {
    const current = currentById.get(String(article?.id || `article-${article?.slug || ''}`));
    if (current) {
      return normalizeArticle({ ...article, ...current });
    }
    const fields = normalizeArticleFields(article);
    return normalizeArticle({
      ...fields,
      publishedSnapshot: fields,
      isPublished: true,
    });
  }));
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
  const [isHydrating, setIsHydrating] = useState(() => !hasStoredState());

  useEffect(() => {
    if (!isHydrating) {
      return undefined;
    }

    let active = true;
    import('../data/resourcesArticlesSeed.json')
      .then((module) => {
        if (!active) {
          return;
        }
        setArticlesState((current) => buildHydratedState(
          module.default,
          hasStoredState() ? current : [],
        ));
        setIsHydrating(false);
      })
      .catch(() => {
        if (active) {
          setIsHydrating(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isHydrating]);

  useEffect(() => {
    const promoteDueArticles = () => {
      const now = Date.now();
      setArticlesState((current) => {
        const dueArticles = current.filter((article) => (
          article.scheduledPublishAt
          && Number.isFinite(Date.parse(article.scheduledPublishAt))
          && Date.parse(article.scheduledPublishAt) <= now
        ));
        if (!dueArticles.length) {
          return current;
        }

        const dueIds = new Set(dueArticles.map((article) => article.id));
        const next = current.map((article) => {
          if (!dueIds.has(article.id)) {
            return article;
          }
          const fields = getArticleFields(article);
          return normalizeArticle({
            ...fields,
            isPublished: true,
            publishedSnapshot: fields,
            scheduledPublishAt: '',
            draftSavedAt: article.draftSavedAt,
          });
        });
        const normalized = sortArticles(next.map(normalizeArticle));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch {
          // Keep the in-memory live transition if storage is unavailable.
        }
        return normalized;
      });
    };

    promoteDueArticles();
    const intervalId = window.setInterval(promoteDueArticles, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) {
          setArticlesState(sortArticles(parsed.map(normalizeArticle)));
        }
      } catch {
        // Ignore malformed external browser state.
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => {
    const save = (nextOrUpdater) => {
      setArticlesState((current) => {
        const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(current) : nextOrUpdater;
        const normalized = sortArticles(next.map(normalizeArticle));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch {
          // Ignore storage failures and keep in-memory state.
        }
        return normalized;
      });
    };

    const updateArticle = (id, patch) => {
      if (!id) {
        return null;
      }

      save((current) => current.map((article) => {
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
      }));
      return id;
    };

    const saveArticle = (id) => {
      if (!id || !articlesState.some((article) => article.id === id)) {
        return false;
      }
      const savedAt = new Date().toISOString();
      const next = sortArticles(articlesState.map((article) => (
        article.id === id
          ? normalizeArticle({ ...article, draftSavedAt: savedAt })
          : normalizeArticle(article)
      )));
      setArticlesState(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return true;
      } catch {
        return false;
      }
    };

    const publishArticle = (id) => {
      if (!id || !articlesState.some((article) => article.id === id)) {
        return false;
      }
      const next = sortArticles(articlesState.map((article) => {
        if (article.id !== id) {
          return article;
        }
        const fields = getArticleFields(article);
        return normalizeArticle({
          ...fields,
          isPublished: true,
          publishedSnapshot: fields,
          scheduledPublishAt: '',
          draftSavedAt: article.draftSavedAt || new Date().toISOString(),
        });
      }));
      setArticlesState(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return true;
      } catch {
        return false;
      }
    };

    const discardArticleDraft = (id) => {
      if (!id || !articlesState.some((article) => article.id === id)) {
        return false;
      }
      const next = sortArticles(articlesState.map((article) => {
        if (article.id !== id || !article.publishedSnapshot) {
          return article;
        }
        const fields = cloneArticleFields(article.publishedSnapshot, { isPublished: true });
        return normalizeArticle({
          ...fields,
          isPublished: true,
          publishedSnapshot: fields,
          scheduledPublishAt: '',
          draftSavedAt: article.draftSavedAt,
        });
      }));
      setArticlesState(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return true;
      } catch {
        return false;
      }
    };

    const scheduleArticle = (id, isoDate) => {
      const timestamp = Date.parse(isoDate || '');
      if (!id || !Number.isFinite(timestamp) || timestamp <= Date.now()) {
        return false;
      }
      const next = sortArticles(articlesState.map((article) => (
        article.id === id
          ? normalizeArticle({ ...article, scheduledPublishAt: new Date(timestamp).toISOString() })
          : article
      )));
      setArticlesState(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return true;
      } catch {
        return false;
      }
    };

    const cancelScheduledArticle = (id) => {
      if (!id || !articlesState.some((article) => article.id === id)) {
        return false;
      }
      const next = sortArticles(articlesState.map((article) => (
        article.id === id
          ? normalizeArticle({ ...article, scheduledPublishAt: '' })
          : article
      )));
      setArticlesState(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return true;
      } catch {
        return false;
      }
    };

    const createArticle = () => {
      const timestamp = Date.now();
      const id = `article-${timestamp}`;
      const created = {
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
        socialImageUrl: '',
        socialTitle: '',
        socialDescription: '',
        socialImageAlt: '',
        isPublished: false,
        publishedSnapshot: null,
        scheduledPublishAt: '',
        draftSavedAt: '',
      };
      save((current) => [
        created,
        ...current,
      ]);
      return id;
    };

    const deleteArticle = (id) => {
      if (!id) {
        return;
      }
      save((current) => current.filter((article) => article.id !== id));
    };

    const resetArticles = () => {
      const defaults = buildDefaultState();
      setIsHydrating(true);
      setArticlesState(defaults);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage failures.
      }
    };

    return {
      articles: articlesState,
      publishedArticles: sortArticles(articlesState
        .filter((article) => article.publishedSnapshot && article.publishedSnapshot.isPublished !== false)
        .map((article) => normalizeArticle({
          ...article.publishedSnapshot,
          id: article.id,
          isPublished: true,
        }))),
      isLoading: isHydrating,
      updateArticle,
      saveArticle,
      publishArticle,
      discardArticleDraft,
      scheduleArticle,
      cancelScheduledArticle,
      getArticleStatus,
      hasDraftChanges,
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
