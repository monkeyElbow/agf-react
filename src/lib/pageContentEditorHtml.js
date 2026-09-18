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

function isCareersFineprintBlock(settings = {}) {
  return String(settings.sectionClassName || '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .includes('careers-native-fineprint');
}

export function hasLegacyPageContentFineprintSource(settings = {}) {
  return isCareersFineprintBlock(settings)
    && Boolean(String(settings.fineprint || '').trim());
}

export function getPageContentEditorHtml(settings = {}) {
  if (hasMeaningfulPageContentHtml(settings.html)) {
    return settings.html;
  }
  if (hasMeaningfulPageContentHtml(settings.bodyHtml)) {
    return settings.bodyHtml;
  }

  // Careers' fixed fineprint block predates the shared HTML body field. Keep
  // its semantic source recoverable and visible in the one body editor until
  // an explicit edit migrates it to html.
  if (hasLegacyPageContentFineprintSource(settings)) {
    return pageContentLinesToHtml(settings.fineprint);
  }

  return pageContentLinesToHtml(settings.body);
}

// Page Content has auxiliary presentation fields that must remain independent
// from the editable body: fineprint/notes and the copyable address block. The
// HUD used to flatten those fields into the HTML editor, which made the same
// text appear in two places and made the auxiliary controls look disconnected.
export function getPageContentBodyEditorHtml(settings = {}) {
  return getPageContentEditorHtml(settings);
}

export function hasLegacyPageContentBodySource(settings = {}) {
  return !hasMeaningfulPageContentHtml(settings.html)
    && !hasMeaningfulPageContentHtml(settings.bodyHtml)
    && (Boolean(String(settings.body || '').trim()) || hasLegacyPageContentFineprintSource(settings));
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
    && (Boolean(String(settings.body || '').trim()) || hasLegacyPageContentFineprintSource(settings));
}
