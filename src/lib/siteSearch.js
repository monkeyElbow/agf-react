import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { isPageHiddenFromSearch, sitePages } from '../data/siteMap';

const SEARCH_ALIAS_RULES = Object.freeze([
  {
    label: 'Charitable Gift Annuities',
    triggers: ['cga'],
    terms: ['charitable gift annuity', 'charitable gift annuities', 'gift annuity', 'income gift'],
  },
  {
    label: 'Donor Advised Fund',
    triggers: ['daf'],
    terms: ['donor advised fund', 'donor-advised fund', 'generosity fund'],
  },
  {
    label: 'Qualified Charitable Distribution',
    triggers: ['qcd'],
    terms: ['qualified charitable distribution', 'ira charitable distribution'],
  },
  {
    label: 'Retired Ministers Housing Allowance',
    triggers: ['rmha'],
    terms: [
      "retired ministers' housing allowance",
      'retired ministers housing allowance',
      "ministers' housing allowance",
      'ministers housing allowance',
      'minister housing',
    ],
  },
  {
    label: 'Property & Casualty',
    triggers: ['p&c', 'pc'],
    terms: ['property & casualty', 'property and casualty', 'property casualty', 'church insurance'],
  },
  {
    label: '403(b)',
    triggers: ['403b', '403(b)'],
    terms: ['403(b)', '403b', 'retirement plan', '403 b'],
  },
  {
    label: '409(a)',
    triggers: ['409a', '409(a)'],
    terms: ['409(a)', '409a', 'nonqualified retirement plan', 'deferred compensation'],
  },
  {
    label: 'IRAs',
    triggers: ['ira', 'iras'],
    terms: ['ira', 'iras', 'individual retirement account', 'traditional ira', 'roth ira'],
  },
  {
    label: 'Planned Giving',
    triggers: ['planned giving', 'legacy giving', 'charitable giving'],
    terms: ['planned giving', 'legacy giving', 'charitable giving', 'leave money to church'],
  },
]);

const SEARCH_TEXT_SKIP_KEYS = Object.freeze([
  /^aria/i,
  /className$/i,
  /color/i,
  /documentId$/i,
  /editableFields$/i,
  /^fields$/i,
  /highlightsJson$/i,
  /href$/i,
  /^id$/i,
  /image/i,
  /^kind$/i,
  /openInNewWindow$/i,
  /^options$/i,
  /pageRef$/i,
  /^steps$/i,
  /^style$/i,
  /tone$/i,
  /url$/i,
]);

const SEARCH_HEADING_KEYS = /(?:^|[^a-z])(?:title|heading|headline|question|label|line\d+Text|card\d+Title)(?:$|[^a-z])/i;
const HTML_ENTITY_MAP = Object.freeze({
  amp: '&',
  apos: "'",
  lsquo: "'",
  rsquo: "'",
  ldquo: '"',
  rdquo: '"',
  nbsp: ' ',
  quot: '"',
});

export function normalizeSiteSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompactSearchText(text) {
  return normalizeSiteSearchText(text).replace(/[^a-z0-9]/g, '');
}

function stripSearchHtml(text) {
  return String(text || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&([a-z]+);/gi, (match, entity) => HTML_ENTITY_MAP[entity.toLowerCase()] || match)
    .replace(/&#(\d+);/g, (match, code) => {
      const value = Number(code);
      return Number.isFinite(value) ? String.fromCharCode(value) : match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueNormalized(values) {
  return Array.from(new Set(
    values
      .map((value) => normalizeSiteSearchText(value))
      .filter(Boolean),
  ));
}

function normalizeArrayInput(value) {
  if (Array.isArray(value)) {
    return value.flatMap(normalizeArrayInput);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function shouldSkipSearchKey(key) {
  return SEARCH_TEXT_SKIP_KEYS.some((pattern) => pattern.test(String(key || '')));
}

function collectSearchStrings(source, {
  key = '',
  text = [],
  headings = [],
  keywords = [],
  aliases = [],
} = {}) {
  if (source == null || typeof source === 'boolean' || typeof source === 'number') {
    return { text, headings, keywords, aliases };
  }

  if (typeof source === 'string') {
    const cleaned = stripSearchHtml(source);
    if (cleaned) {
      text.push(cleaned);
      if (SEARCH_HEADING_KEYS.test(key)) {
        headings.push(cleaned);
      }
    }
    return { text, headings, keywords, aliases };
  }

  if (Array.isArray(source)) {
    source.forEach((item) => {
      collectSearchStrings(item, { key, text, headings, keywords, aliases });
    });
    return { text, headings, keywords, aliases };
  }

  if (typeof source !== 'object') {
    return { text, headings, keywords, aliases };
  }

  Object.entries(source).forEach(([entryKey, entryValue]) => {
    if (entryKey === 'searchKeywords') {
      keywords.push(...normalizeArrayInput(entryValue));
      return;
    }
    if (entryKey === 'searchAliases') {
      aliases.push(...normalizeArrayInput(entryValue));
      return;
    }
    if (shouldSkipSearchKey(entryKey)) {
      return;
    }
    collectSearchStrings(entryValue, { key: entryKey, text, headings, keywords, aliases });
  });

  return { text, headings, keywords, aliases };
}

function collectBlocksSearchContent(blocks = []) {
  const collected = { text: [], headings: [], keywords: [], aliases: [] };
  (Array.isArray(blocks) ? blocks : []).forEach((block) => {
    if (!block || block.hidden || block.visible === false) {
      return;
    }
    collectSearchStrings(block.searchKeywords ? { searchKeywords: block.searchKeywords } : null, collected);
    collectSearchStrings(block.searchAliases ? { searchAliases: block.searchAliases } : null, collected);
    collectSearchStrings(block.settings || block, collected);
  });
  return {
    text: uniqueNormalized(collected.text),
    headings: uniqueNormalized(collected.headings),
    keywords: uniqueNormalized(collected.keywords),
    aliases: uniqueNormalized(collected.aliases),
  };
}

function deriveAliasesForText(text) {
  const normalized = normalizeSiteSearchText(text);
  const aliases = [];
  SEARCH_ALIAS_RULES.forEach((rule) => {
    const terms = [...rule.triggers, ...rule.terms];
    const hasTerm = terms.some((term) => {
      const normalizedTerm = normalizeSiteSearchText(term);
      return normalizedTerm && normalized.includes(normalizedTerm);
    });
    if (hasTerm) {
      aliases.push(...rule.triggers);
    }
  });
  return uniqueNormalized(aliases);
}

function buildSearchFields(item) {
  const titleText = normalizeSiteSearchText(item.title);
  const pathText = normalizeSiteSearchText(item.path);
  const sectionText = normalizeSiteSearchText(item.section);
  const excerptText = normalizeSiteSearchText(item.excerpt);
  const keywordText = uniqueNormalized(normalizeArrayInput(item.searchKeywords)).join(' ');
  const aliasText = uniqueNormalized(normalizeArrayInput(item.searchAliases)).join(' ');
  const headingText = uniqueNormalized(normalizeArrayInput(item.searchHeadings)).join(' ');
  const bodyText = uniqueNormalized(normalizeArrayInput(item.searchBody)).join(' ');
  const searchText = [
    titleText,
    pathText,
    sectionText,
    excerptText,
    keywordText,
    aliasText,
    headingText,
    bodyText,
  ].filter(Boolean).join(' ');

  return {
    titleText,
    pathText,
    sectionText,
    excerptText,
    keywordText,
    aliasText,
    headingText,
    bodyText,
    searchText,
  };
}

function withSearchFields(item) {
  const aliases = uniqueNormalized([
    ...normalizeArrayInput(item.searchAliases),
    ...deriveAliasesForText([
      item.title,
      item.section,
      item.excerpt,
      ...(Array.isArray(item.searchKeywords) ? item.searchKeywords : []),
      ...(Array.isArray(item.searchHeadings) ? item.searchHeadings : []),
      ...(Array.isArray(item.searchBody) ? item.searchBody : []),
    ].filter(Boolean).join(' ')),
  ]);
  const nextItem = { ...item, searchAliases: aliases };
  return {
    ...nextItem,
    searchFields: buildSearchFields(nextItem),
  };
}

function buildSearchQueryContext(query) {
  const original = normalizeSiteSearchText(query);
  const compact = normalizeCompactSearchText(original);
  const variants = [{ term: original, source: 'query' }];
  const aliasLabels = [];

  SEARCH_ALIAS_RULES.forEach((rule) => {
    const triggerMatched = rule.triggers.some((trigger) => (
      normalizeSiteSearchText(trigger) === original
      || normalizeCompactSearchText(trigger) === compact
    ));
    if (!triggerMatched) {
      return;
    }
    aliasLabels.push(rule.label);
    rule.terms.forEach((term) => variants.push({ term, source: 'alias', label: rule.label }));
    rule.triggers.forEach((term) => variants.push({ term, source: 'trigger', label: rule.label }));
  });

  return {
    original,
    compact,
    aliasLabels: uniqueNormalized(aliasLabels),
    variants: Array.from(
      new Map(
        variants
          .map((variant) => ({
            ...variant,
            term: normalizeSiteSearchText(variant.term),
            compact: normalizeCompactSearchText(variant.term),
          }))
          .filter((variant) => variant.term)
          .map((variant) => [variant.term, variant]),
      ).values(),
    ),
  };
}

function stemSearchToken(token) {
  const value = normalizeCompactSearchText(token);
  if (value.endsWith('ies') && value.length > 4) {
    return `${value.slice(0, -3)}y`;
  }
  if (value.endsWith('s') && value.length > 4) {
    return value.slice(0, -1);
  }
  return value;
}

function levenshteinDistance(a, b) {
  const left = normalizeCompactSearchText(a);
  const right = normalizeCompactSearchText(b);
  if (!left || !right) return Number.POSITIVE_INFINITY;
  if (left === right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function fuzzyTokenMatch(itemText, query) {
  const queryTokens = normalizeSiteSearchText(query).split(/\s+/).filter((token) => token.length >= 5);
  if (!queryTokens.length) {
    return false;
  }
  const itemTokens = normalizeSiteSearchText(itemText).split(/\s+/).filter((token) => token.length >= 5);
  return queryTokens.every((queryToken) => {
    const stemmedQuery = stemSearchToken(queryToken);
    return itemTokens.some((itemToken) => {
      if (stemSearchToken(itemToken) === stemmedQuery) {
        return true;
      }
      const compactQuery = normalizeCompactSearchText(queryToken);
      const maxDistance = compactQuery.length >= 8 ? 2 : 1;
      return levenshteinDistance(itemToken, queryToken) <= maxDistance;
    });
  });
}

function scoreField(fieldText, term, {
  exact = 0,
  starts = 0,
  includes = 0,
} = {}) {
  const normalized = normalizeSiteSearchText(fieldText);
  const normalizedTerm = normalizeSiteSearchText(term);
  if (!normalized || !normalizedTerm) {
    return 0;
  }
  const compact = normalizeCompactSearchText(normalized);
  const compactTerm = normalizeCompactSearchText(normalizedTerm);
  if (normalized === normalizedTerm) return exact;
  if (compact && compact === compactTerm) return exact;
  if (normalized.startsWith(normalizedTerm)) return starts;
  if (compact && compact.startsWith(compactTerm)) return starts;
  if (normalized.includes(normalizedTerm)) return includes;
  if (compact && compact.includes(compactTerm)) return includes;
  return 0;
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

export function scoreSiteSearchMatch(item, query) {
  const fields = item.searchFields || buildSearchFields(item);
  const queryContext = buildSearchQueryContext(query);
  if (!queryContext.original) {
    return 0;
  }

  let score = 0;
  queryContext.variants.forEach((variant) => {
    const aliasBoost = variant.source === 'alias' ? 1.45 : 1;
    const triggerBoost = variant.source === 'trigger' ? 1.7 : 1;
    if (
      normalizeCompactSearchText(fields.titleText)
      && normalizeCompactSearchText(fields.titleText) === variant.compact
    ) {
      score += variant.source === 'alias' ? 520 : 360;
    }
    score += Math.round(scoreField(fields.aliasText, variant.term, { exact: 140, starts: 105, includes: 90 }) * triggerBoost);
    score += Math.round(scoreField(fields.titleText, variant.term, { exact: 130, starts: 95, includes: 60 }) * aliasBoost);
    score += Math.round(scoreField(fields.keywordText, variant.term, { exact: 115, starts: 80, includes: 58 }) * aliasBoost);
    score += Math.round(scoreField(fields.headingText, variant.term, { exact: 85, starts: 62, includes: 42 }) * aliasBoost);
    score += Math.round(scoreField(fields.pathText, variant.term, { exact: 28, starts: 22, includes: 18 }) * aliasBoost);
    score += Math.round(scoreField(fields.sectionText, variant.term, { exact: 18, starts: 14, includes: 10 }) * aliasBoost);
    score += Math.round(scoreField(fields.excerptText, variant.term, { exact: 18, starts: 14, includes: 8 }) * aliasBoost);
    score += Math.round(scoreField(fields.bodyText, variant.term, { exact: 26, starts: 18, includes: 12 }) * aliasBoost);
  });

  if (!score) {
    if (levenshteinDistance(fields.titleText, queryContext.original) <= 2) {
      score += 32;
    } else if (fuzzyTokenMatch(fields.titleText, queryContext.original)) {
      score += 18;
    } else if (fuzzyTokenMatch(fields.keywordText, queryContext.original)) {
      score += 14;
    } else if (fuzzyTokenMatch(fields.headingText, queryContext.original)) {
      score += 12;
    } else if (fuzzyTokenMatch(fields.searchText, queryContext.original)) {
      score += 6;
    }
  }

  if (item.group === 'page' && score) {
    score += 2;
  }
  return score;
}

export function buildSearchableSitePages({ blocksByPath = contentBlockBlueprintsByPath } = {}) {
  const safeBlocksByPath = blocksByPath && typeof blocksByPath === 'object'
    ? blocksByPath
    : {};
  return sitePages
    .filter((page) => !page.path.startsWith('/admin/') && page.path !== '/search' && !isPageHiddenFromSearch(page))
    .map((page) => {
      const blockContent = collectBlocksSearchContent(safeBlocksByPath[page.path] || []);
      const searchKeywords = uniqueNormalized([
        ...normalizeArrayInput(page.searchKeywords),
        ...(Array.isArray(blockContent.keywords) ? blockContent.keywords : []),
      ]);
      const searchAliases = uniqueNormalized([
        ...normalizeArrayInput(page.searchAliases),
        ...(Array.isArray(page.linkRefAliases) ? page.linkRefAliases : []),
        ...(Array.isArray(blockContent.aliases) ? blockContent.aliases : []),
      ]);
      return withSearchFields({
        title: page.title,
        path: page.path,
        key: `page:${page.path}`,
        section: page.section || 'Site',
        excerpt: `${page.section || 'Site'} page`,
        resultType: 'page',
        group: 'page',
        searchKeywords,
        searchAliases,
        searchHeadings: blockContent.headings,
        searchBody: blockContent.text,
      });
    });
}

export function buildSearchableResourceArticles(articles = []) {
  return (Array.isArray(articles) ? articles : [])
    .filter((article) => (
      article
      && article.type === 'article'
      && article.isPublished
      && String(article.slug || '').trim()
    ))
    .map((article) => withSearchFields({
      title: article.title,
      path: `/resources/article/${encodeURIComponent(article.slug)}`,
      key: `resource-article:${article.id}`,
      section: article.category || 'Resources',
      excerpt: article.excerpt || 'Resource article',
      resultType: 'article',
      group: 'article',
      searchKeywords: article.searchKeywords || article.tags || [],
      searchAliases: article.searchAliases || [],
      searchBody: [article.body, article.bodyHtml, article.content, article.contentHtml].filter(Boolean),
    }));
}

export function buildSearchableDocuments(documents = []) {
  return (Array.isArray(documents) ? documents : [])
    .filter((doc) => doc && doc.active && doc.url)
    .map((doc) => withSearchFields({
      title: doc.title,
      href: doc.url,
      key: `document:${doc.id}`,
      path: doc.category ? `/${doc.category}` : '/documents',
      section: doc.category ? `${doc.category} Documents` : 'Documents',
      excerpt: kindToSearchExcerpt(doc.kind),
      resultType: 'document',
      group: 'document',
      documentId: doc.id,
      searchKeywords: doc.searchKeywords || doc.tags || [doc.topic, doc.notes].filter(Boolean),
      searchAliases: doc.searchAliases || [],
    }));
}

export function buildSiteSearchIndex({ documents = [], articles = [], blocksByPath = contentBlockBlueprintsByPath } = {}) {
  return [
    ...buildSearchableSitePages({ blocksByPath }),
    ...buildSearchableResourceArticles(articles),
    ...buildSearchableDocuments(documents),
  ];
}

export function searchSiteIndex(items = [], query = '') {
  const queryContext = buildSearchQueryContext(query);
  if (!queryContext.original) {
    return [];
  }

  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      item,
      score: scoreSiteSearchMatch(item, queryContext.original),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff) {
        return scoreDiff;
      }
      return a.item.title.localeCompare(b.item.title);
    })
    .map((entry) => entry.item);
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
