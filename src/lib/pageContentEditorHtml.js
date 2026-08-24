function hasMeaningfulPageContentHtml(value) {
  const html = String(value || '').trim();
  return Boolean(html) && html !== '<p></p>' && html !== '<p><br></p>';
}

function escapePageContentHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pageContentLinesToHtml(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapePageContentHtml(line)}</p>`)
    .join('');
}

export function getPageContentEditorHtml(settings = {}) {
  if (hasMeaningfulPageContentHtml(settings.html)) {
    return settings.html;
  }
  if (hasMeaningfulPageContentHtml(settings.bodyHtml)) {
    return settings.bodyHtml;
  }

  const bodyHtml = pageContentLinesToHtml(settings.body);
  if (bodyHtml) {
    return bodyHtml;
  }

  const addressTitle = String(settings.addressTitle || '').trim();
  const addressLines = pageContentLinesToHtml(settings.addressLines);
  return [
    addressTitle ? `<p>${escapePageContentHtml(addressTitle)}</p>` : '',
    addressLines,
  ].filter(Boolean).join('');
}

export function getPageContentEditorField(settings = {}) {
  if (hasMeaningfulPageContentHtml(settings.html)) {
    return 'html';
  }
  if (hasMeaningfulPageContentHtml(settings.bodyHtml)) {
    return 'bodyHtml';
  }
  return 'html';
}

export function hasLegacyPageContentSource(settings = {}) {
  return !hasMeaningfulPageContentHtml(settings.html)
    && !hasMeaningfulPageContentHtml(settings.bodyHtml)
    && (String(settings.body || '').trim() || String(settings.addressTitle || '').trim() || String(settings.addressLines || '').trim());
}
