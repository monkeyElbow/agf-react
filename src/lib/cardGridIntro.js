import { normalizeSemanticTextColorClasses } from './colorSystem';

const SEMANTIC_COLOR_CLASSES = new Set([
  'is-atlantean',
  'is-mango',
  'is-melon',
  'is-sandstone',
  'is-super-grey',
  'is-white',
]);

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeSemanticColorClass(value) {
  return normalizeSemanticTextColorClasses(
    String(value || '')
      .trim()
      .split(/\s+/)
      .filter((token) => SEMANTIC_COLOR_CLASSES.has(token))
      .join(' '),
  );
}

function parseHighlights(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    return (Array.isArray(parsed) ? parsed : [])
      .map((item) => ({
        start: Number.isFinite(Number(item?.start)) ? Math.max(0, Math.floor(Number(item.start))) : null,
        end: Number.isFinite(Number(item?.end)) ? Math.max(0, Math.floor(Number(item.end))) : null,
        text: String(item?.text || ''),
        className: normalizeSemanticColorClass(item?.className),
      }))
      .filter((item) => item.className && (
        (Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start)
        || item.text.trim()
      ));
  } catch {
    return [];
  }
}

function renderTextWithHighlights(text, highlights) {
  const source = String(text || '');
  const rangeHighlights = (Array.isArray(highlights) ? highlights : [])
    .filter((item) => Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  if (!rangeHighlights.length) {
    let html = escapeHtml(source);
    (Array.isArray(highlights) ? highlights : []).forEach((item) => {
      const token = item.text.trim();
      if (!token) {
        return;
      }
      const escapedToken = escapeHtml(token);
      html = html.replace(escapedToken, `<mark class="${item.className}">${escapedToken}</mark>`);
    });
    return html.replace(/\n/g, '<br />');
  }

  let html = '';
  let cursor = 0;
  rangeHighlights.forEach((item) => {
    const start = Math.max(cursor, Math.min(source.length, item.start));
    const end = Math.max(start, Math.min(source.length, item.end));
    if (start > cursor) {
      html += escapeHtml(source.slice(cursor, start));
    }
    if (end > start) {
      html += `<mark class="${item.className}">${escapeHtml(source.slice(start, end))}</mark>`;
      cursor = end;
    }
  });
  if (cursor < source.length) {
    html += escapeHtml(source.slice(cursor));
  }
  return html.replace(/\n/g, '<br />');
}

function normalizeHtml(value) {
  const html = String(value || '').trim();
  return !html || html === '<p></p>' || html === '<p><br></p>' ? '' : html;
}

const CARD_GRID_BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'div', 'dl', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr',
  'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul',
]);

/**
 * The merged editor treats the first content run as the subhead. Contenteditable
 * can save that run as a bare text/inline node, which gives the renderer no
 * element to size. Normalize only that leading run and semantic color class
 * conflicts; authored text and structure stay unchanged.
 */
export function normalizeCardGridIntroMarkup(value) {
  const source = normalizeHtml(value);
  if (!source || typeof DOMParser === 'undefined') {
    return source;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${source}</div>`, 'text/html');
  const root = document.body.firstElementChild;
  if (!root) {
    return source;
  }

  Array.from(root.querySelectorAll('[class]')).forEach((element) => {
    const nextClassName = normalizeSemanticTextColorClasses(element.getAttribute('class'));
    if (nextClassName) {
      element.setAttribute('class', nextClassName);
    } else {
      element.removeAttribute('class');
    }
  });

  const leadingNodes = [];
  let hasVisibleLeadingContent = false;
  while (root.firstChild) {
    const node = root.firstChild;
    const isElement = node.nodeType === document.ELEMENT_NODE;
    const tagName = isElement ? String(node.tagName || '').toLowerCase() : '';
    if (isElement && CARD_GRID_BLOCK_TAGS.has(tagName)) {
      break;
    }
    root.removeChild(node);
    leadingNodes.push(node);
    if (node.nodeType === document.TEXT_NODE && node.textContent.trim()) {
      hasVisibleLeadingContent = true;
    }
    if (isElement && node.textContent.trim()) {
      hasVisibleLeadingContent = true;
    }
  }

  if (!hasVisibleLeadingContent) {
    leadingNodes.reverse().forEach((node) => root.insertBefore(node, root.firstChild));
    return root.innerHTML.trim();
  }

  const subhead = document.createElement('h3');
  leadingNodes.forEach((node) => subhead.appendChild(node));
  root.insertBefore(subhead, root.firstChild);
  return root.innerHTML.trim();
}

export function hasCardGridIntroHtml(settings = {}) {
  return Object.prototype.hasOwnProperty.call(settings || {}, 'introHtml');
}

/** Resolve the merged editor value while preserving legacy stored fields. */
export function buildCardGridIntroHtml(settings = {}) {
  if (hasCardGridIntroHtml(settings)) {
    return normalizeCardGridIntroMarkup(settings.introHtml);
  }

  const subtitle = String(settings.subtitle || '').trim();
  const subtitleClassName = normalizeSemanticColorClass(settings.subtitleClassName);
  const subtitleHighlights = parseHighlights(settings.subtitleHighlightsJson);
  const legacySubtitle = subtitle
    ? `<h3${subtitleClassName ? ` class="${subtitleClassName}"` : ''}>${renderTextWithHighlights(subtitle, subtitleHighlights)}</h3>`
    : '';
  const legacyBodyHtml = normalizeHtml(settings.bodyHtml);
  const legacyBody = String(settings.body || '').trim();
  const fallbackBody = !legacyBodyHtml && legacyBody ? `<p>${escapeHtml(legacyBody)}</p>` : '';
  return [legacySubtitle, legacyBodyHtml || fallbackBody].filter(Boolean).join('');
}
