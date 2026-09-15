import { SEMANTIC_TEXT_COLOR_HEX_VALUES } from './colorSystem';

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'em',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'li',
  'mark',
  'ol',
  'p',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'u',
  'ul',
]);

const BLOCKED_TAGS = new Set([
  'embed',
  'iframe',
  'link',
  'meta',
  'object',
  'script',
  'style',
]);

const GLOBAL_ALLOWED_ATTRIBUTES = new Set([
  'class',
  'title',
]);

const TAG_ALLOWED_ATTRIBUTES = {
  a: new Set(['href', 'target', 'rel']),
};

function normalizeCssColorValue(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    return '';
  }
  if (raw === 'white') {
    return '#ffffff';
  }
  const shortHexMatch = raw.match(/^#([0-9a-f]{3})$/i);
  if (shortHexMatch) {
    return `#${shortHexMatch[1].split('').map((token) => `${token}${token}`).join('')}`;
  }
  const longHexMatch = raw.match(/^#([0-9a-f]{6})$/i);
  if (longHexMatch) {
    return `#${longHexMatch[1]}`;
  }
  const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch) {
    return raw.replace(/\s+/g, '');
  }
  const channels = rgbMatch[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Math.max(0, Math.min(255, Number.parseInt(part, 10))));
  if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
    return raw.replace(/\s+/g, '');
  }
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

const SEMANTIC_COLOR_CLASS_BY_CSS_VALUE = new Map(
  Object.entries(SEMANTIC_TEXT_COLOR_HEX_VALUES)
    .map(([className, color]) => [normalizeCssColorValue(color), className]),
);

function extractColorDeclaration(styleValue) {
  const declaration = String(styleValue || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('color:'));
  return declaration ? declaration.slice(declaration.indexOf(':') + 1).trim() : '';
}

function applySemanticColorClass(node, className) {
  if (!className) {
    return;
  }
  const classes = String(node.getAttribute('class') || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !Object.prototype.hasOwnProperty.call(SEMANTIC_TEXT_COLOR_HEX_VALUES, token));
  node.setAttribute('class', Array.from(new Set([...classes, className])).join(' '));
}

function semanticColorClassForValue(value) {
  return SEMANTIC_COLOR_CLASS_BY_CSS_VALUE.get(normalizeCssColorValue(value)) || '';
}

function sanitizeClassName(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter((token) => /^[a-zA-Z0-9_-]+$/.test(token))
    .join(' ');
}

function sanitizeHref(value) {
  const href = String(value || '').trim();
  if (!href) {
    return '';
  }
  if (/^(?:\\|\/\/)/.test(href)) {
    return '';
  }
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(href)) {
    return href;
  }
  return '';
}

function sanitizeElement(node, document) {
  if (node.nodeType !== document.ELEMENT_NODE) {
    return;
  }

  const tagName = String(node.tagName || '').toLowerCase();

  if (BLOCKED_TAGS.has(tagName)) {
    node.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    const parent = node.parentNode;
    if (!parent) {
      node.remove();
      return;
    }
    const legacyColorClassName = tagName === 'font'
      ? semanticColorClassForValue(node.getAttribute('color') || extractColorDeclaration(node.getAttribute('style')))
      : '';
    if (legacyColorClassName) {
      const replacement = document.createElement('span');
      applySemanticColorClass(replacement, legacyColorClassName);
      while (node.firstChild) {
        replacement.appendChild(node.firstChild);
      }
      parent.replaceChild(replacement, node);
      sanitizeElement(replacement, document);
      return;
    }
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
    return;
  }

  let semanticColorClassName = '';
  Array.from(node.attributes).forEach((attribute) => {
    const name = String(attribute.name || '').toLowerCase();
    if (name.startsWith('on')) {
      node.removeAttribute(attribute.name);
      return;
    }

    if (name === 'style') {
      semanticColorClassName = semanticColorClassForValue(extractColorDeclaration(attribute.value)) || semanticColorClassName;
      node.removeAttribute(attribute.name);
      return;
    }

    if (name === 'color') {
      semanticColorClassName = semanticColorClassForValue(attribute.value) || semanticColorClassName;
      node.removeAttribute(attribute.name);
      return;
    }

    const tagAllowedAttributes = TAG_ALLOWED_ATTRIBUTES[tagName] || new Set();
    if (!GLOBAL_ALLOWED_ATTRIBUTES.has(name) && !tagAllowedAttributes.has(name)) {
      node.removeAttribute(attribute.name);
      return;
    }

    if (name === 'class') {
      const className = sanitizeClassName(attribute.value);
      if (!className) {
        node.removeAttribute(attribute.name);
      } else {
        node.setAttribute('class', className);
      }
      return;
    }

    if (name === 'href') {
      const href = sanitizeHref(attribute.value);
      if (!href) {
        node.removeAttribute('href');
      } else {
        node.setAttribute('href', href);
      }
      return;
    }

    if (name === 'target') {
      if (String(attribute.value || '').trim() !== '_blank') {
        node.removeAttribute('target');
      }
      return;
    }

    if (name === 'rel') {
      const rel = String(attribute.value || '').trim();
      if (!rel) {
        node.removeAttribute('rel');
      }
    }
  });
  applySemanticColorClass(node, semanticColorClassName);

  if (tagName === 'a') {
    const href = node.getAttribute('href');
    if (!href) {
      node.removeAttribute('target');
      node.removeAttribute('rel');
      return;
    }
    if (node.getAttribute('target') === '_blank') {
      const relTokens = new Set(String(node.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      relTokens.add('noopener');
      relTokens.add('noreferrer');
      node.setAttribute('rel', Array.from(relTokens).join(' '));
    }
  }

  Array.from(node.childNodes).forEach((child) => sanitizeElement(child, document));
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeRichTextHtml(html) {
  const source = String(html || '').trim();
  if (!source) {
    return '';
  }

  if (typeof DOMParser === 'undefined') {
    return escapeHtml(source);
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${source}</div>`, 'text/html');
  const root = document.body.firstElementChild;

  if (!root) {
    return '';
  }

  Array.from(root.childNodes).forEach((node) => sanitizeElement(node, document));
  return root.innerHTML.trim();
}

export function createSanitizedHtmlMarkup(html) {
  return {
    __html: sanitizeRichTextHtml(html),
  };
}
