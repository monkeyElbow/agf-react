import { DEFAULT_TESTIMONIAL_FINEPRINT } from '../data/testimonialsLibrarySeed';

function toSlugToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toBool(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  const token = String(value || '').trim().toLowerCase();
  if (!token) {
    return fallback;
  }
  return !['false', '0', 'no', 'off'].includes(token);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
}

export function parseTokenList(value) {
  return Array.from(
    new Set(
      String(value || '')
        .split(/[\n,]/)
        .map((item) => toSlugToken(item))
        .filter(Boolean),
    ),
  );
}

export function normalizeTestimonialTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return Array.from(
    new Set(
      value
        .map((item) => toSlugToken(item))
        .filter(Boolean),
    ),
  );
}

export function normalizeTestimonialRecord(item, fallbackId = '') {
  const source = item && typeof item === 'object' ? item : {};
  const id = toSlugToken(source.id || fallbackId || `${source.author || 'testimonial'}-${source.quote || ''}`) || `testimonial-${Date.now()}`;
  const quote = String(source.quote || '').trim();
  const author = String(source.author || source.authorName || '').trim();
  const authorTitle = String(source.authorTitle || '').trim();
  const tags = normalizeTestimonialTags(source.tags);
  return {
    id,
    quote,
    author,
    authorTitle,
    tags,
  };
}

export function normalizeDisplayTestimonials(items) {
  return (Array.isArray(items) ? items : [])
    .map((item, index) => normalizeTestimonialRecord(item, `fallback-${index + 1}`))
    .filter((item) => item.quote && item.author);
}

export function normalizeTestimonialsSelectionMode(value) {
  const token = String(value || '').trim().toLowerCase();
  return token === 'tag' ? 'tag' : 'manual';
}

export function formatTestimonialAttribution(item) {
  const author = String(item?.author || item?.authorName || '').trim();
  const authorTitle = String(item?.authorTitle || '').trim();
  if (!author && !authorTitle) {
    return 'Unknown';
  }
  if (!authorTitle) {
    return author;
  }
  if (!author) {
    return authorTitle;
  }
  return `${author}, ${authorTitle}`;
}

function sortBySelectedIdsOrder(itemsById, selectedIds) {
  const ordered = [];
  selectedIds.forEach((id) => {
    const match = itemsById.get(id);
    if (match) {
      ordered.push(match);
    }
  });
  return ordered;
}

export function resolveTestimonialsBlockData({
  block,
  library,
  fallbackItems = [],
  fallbackFineprint = DEFAULT_TESTIMONIAL_FINEPRINT,
  defaultTag = '',
}) {
  const normalizedLibrary = normalizeDisplayTestimonials(library);
  const fallback = normalizeDisplayTestimonials(fallbackItems);

  if (!block || block.mode !== 'dynamic') {
    return {
      items: fallback.length ? fallback : normalizedLibrary,
      fineprint: String(fallbackFineprint || DEFAULT_TESTIMONIAL_FINEPRINT).trim(),
      showFineprint: true,
    };
  }

  const settings = block.settings || {};
  const selectionMode = String(settings.selectionMode || 'manual').trim().toLowerCase();
  const hasSelectedIdsSetting = Object.prototype.hasOwnProperty.call(settings, 'selectedIdsCsv');
  const selectedIds = parseTokenList(settings.selectedIdsCsv);
  const tagList = parseTokenList(settings.filterTagsCsv);
  const normalizedDefaultTag = toSlugToken(defaultTag);

  if (!tagList.length && normalizedDefaultTag) {
    tagList.push(normalizedDefaultTag);
  }

  const libraryById = new Map(normalizedLibrary.map((item) => [item.id, item]));
  let selected = [];

  if (selectionMode === 'manual') {
    selected = selectedIds.length ? sortBySelectedIdsOrder(libraryById, selectedIds) : [];
    if (!selected.length && selectedIds.length && tagList.length) {
      selected = normalizedLibrary.filter((item) => {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        return tags.some((tag) => tagList.includes(toSlugToken(tag)));
      });
    }
  } else if (tagList.length) {
    selected = normalizedLibrary.filter((item) => {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      return tags.some((tag) => tagList.includes(toSlugToken(tag)));
    });
  } else if (selectedIds.length) {
    selected = sortBySelectedIdsOrder(libraryById, selectedIds);
  } else {
    selected = normalizedLibrary;
  }

  const isManualEmptySelection = selectionMode === 'manual' && hasSelectedIdsSetting && !selectedIds.length;
  if (!selected.length && fallback.length && !isManualEmptySelection) {
    selected = fallback;
  }

  const limit = Math.max(0, toNumber(settings.limit, 0));
  const limited = limit > 0 ? selected.slice(0, limit) : selected;

  const fineprint = String(settings.fineprint || fallbackFineprint || DEFAULT_TESTIMONIAL_FINEPRINT).trim();
  const showFineprint = toBool(settings.showFineprint, Boolean(fineprint));

  return {
    items: limited,
    fineprint,
    showFineprint,
  };
}
