function stripMarkerSection(cssText, startMarker, endMarker) {
  const start = cssText.indexOf(startMarker);
  if (start === -1) {
    return cssText;
  }

  if (!endMarker) {
    return `${cssText.slice(0, start)}${cssText.slice(start + startMarker.length)}`;
  }

  const end = cssText.indexOf(endMarker, start + startMarker.length);
  if (end === -1) {
    return cssText.slice(0, start);
  }

  return `${cssText.slice(0, start)}${cssText.slice(end)}`;
}

function stripHashedWpRules(cssText) {
  return cssText
    .replace(/\.wp-elements-[a-f0-9]+[^{}]*\{[^{}]*\}/gi, '')
    .replace(/\.wp-container-core-[a-z-]+-is-layout-[a-f0-9]+[^{}]*\{[^{}]*\}/gi, '')
    .replace(/\.wp-block-gallery\.wp-block-gallery-\d+[^{}]*\{[^{}]*\}/gi, '');
}

export function sanitizeWpCss(cssText) {
  if (!cssText) {
    return '';
  }

  let normalized = cssText;

  // Drop duplicated theme customizer payload in each page blob.
  normalized = stripMarkerSection(normalized, '/*COLOR PALETTE*/', '/*TYPOGRAPHY*/');
  normalized = stripMarkerSection(normalized, '/*TYPOGRAPHY*/', '/*CUSTOMIZER STYLING*/');
  normalized = normalized.replace(
    /\/\*CUSTOMIZER STYLING\*[\s\S]*?(?=\.wp-elements-|\.wp-container-core-|:root\s*:where\(\.wp-block-button|$)/i,
    '',
  );

  // Drop generated hash selectors that are tightly coupled to exported WP classes.
  normalized = stripHashedWpRules(normalized);

  // Drop the giant wp-block-library-inline-css payload that is duplicated in every page blob.
  normalized = normalized.replace(/:root\{--wp-block-synced-color[\s\S]*$/i, '');

  // Drop injected source-map markers from exported WP styles.
  normalized = normalized.replace(/\/\*#\s*sourceURL=[^*]*\*\//gi, '');

  // Collapse repeated whitespace produced by section stripping.
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  return normalized.trim();
}

function shouldDropClassName(className) {
  return (
    className === 'wpex-clr' ||
    /^wp-elements-[a-f0-9]+$/i.test(className) ||
    /^wp-container-core-[a-z-]+-is-layout-[a-f0-9]+$/i.test(className) ||
    /^wp-image-\d+$/i.test(className)
  );
}

function sanitizeClassList(el) {
  if (!el.classList?.length) {
    return;
  }

  const toRemove = Array.from(el.classList).filter(shouldDropClassName);
  if (toRemove.length) {
    el.classList.remove(...toRemove);
  }

  if (!el.classList.length) {
    el.removeAttribute('class');
  }
}

function sanitizeInlineStyles(el) {
  if (!el.getAttribute('style')) {
    return;
  }

  // Remove WP inline stat-number tracking so site CSS controls spacing consistently.
  if (el.classList?.contains('stat-number')) {
    el.style.removeProperty('letter-spacing');
    el.style.removeProperty('word-spacing');
  }

  if (!el.getAttribute('style') || !el.getAttribute('style').trim()) {
    el.removeAttribute('style');
  }
}

function trimTrailingWhitespaceFromElement(el) {
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let lastTextNode = null;
  while (walker.nextNode()) {
    lastTextNode = walker.currentNode;
  }
  if (!lastTextNode) {
    return;
  }

  const nextValue = lastTextNode.nodeValue?.replace(/\s+$/u, '');
  if (nextValue !== undefined) {
    lastTextNode.nodeValue = nextValue;
  }
}

function normalizePunctuationSpacing(root) {
  const textWalker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (textWalker.nextNode()) {
    textNodes.push(textWalker.currentNode);
  }

  textNodes.forEach((node) => {
    const parentEl = node.parentElement;
    if (!parentEl || parentEl.closest('style,script')) {
      return;
    }
    const original = node.nodeValue || '';
    const normalized = original.replace(/\u00a0+(?=[.,;:!?])/gu, '').replace(/[ \t]+(?=[.,;:!?])/gu, '');
    if (normalized !== original) {
      node.nodeValue = normalized;
    }
  });

  root.querySelectorAll('mark,span,strong,em,b,i,a,sup,sub').forEach((el) => {
    const next = el.nextSibling;
    if (!(next instanceof Text) || !/^\s*[.,;:!?]/u.test(next.nodeValue || '')) {
      return;
    }
    trimTrailingWhitespaceFromElement(el);
  });
}

export function extractWpContentHtml(htmlText) {
  if (!htmlText) {
    return '';
  }

  if (typeof DOMParser === 'undefined') {
    return htmlText;
  }

  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  const preferredRoot =
    doc.querySelector('.single-page-content') ??
    doc.querySelector('#content') ??
    doc.querySelector('main') ??
    doc.body;

  if (!preferredRoot) {
    return htmlText;
  }

  preferredRoot.querySelectorAll('*').forEach((el) => {
    sanitizeClassList(el);
    sanitizeInlineStyles(el);
  });

  normalizePunctuationSpacing(preferredRoot);

  return preferredRoot.innerHTML?.trim() || htmlText;
}
