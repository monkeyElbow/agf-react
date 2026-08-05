import { coerceLinkValue, coerceLinkValueFromFields, linkValueToLinkProps } from './linkValue';
import { CALCULATOR_INTRO_KIND, CALCULATOR_WIDGET_KIND } from './calculatorWidgetIdentity';
import { resolveTestimonialsBlockData } from './testimonials';
import {
  createCtaContactPreferenceField,
  extractCtaFormFields,
  normalizeFormSubmissionConfig,
  normalizeRequestFormFieldType,
} from '../blocks/foundation/forms';
import {
  getGridSafeCardStyleForBg,
  getGridSafeToneForBg,
  normalizeDynamicGridCardBodyLineHeight,
  normalizeDynamicGridCardBodySizeRem,
  normalizeDynamicGridCardDividerTone,
  normalizeDynamicGridCardPaddingRem,
  normalizeDynamicGridCardTitleSizeRem,
  normalizeDynamicGridColumns,
  normalizeDynamicGridDividerTone,
  normalizeDynamicGridWidth,
  normalizeGridBgTone,
} from './dynamicGrid';
import { resolveCtaBandPresetId } from './ctaBandPresets';
import { resolveCardGridPresetId } from './cardGridPresets';
import {
  normalizeButtonTone,
  normalizePanelTextTone as normalizeSharedPanelTextTone,
  normalizeSemanticTextColorClass,
  normalizeSurfaceBgTone,
  resolveIntroAccentColor,
} from './colorSystem';
import {
  normalizeHeroTitleLetterSpacingEm,
  normalizeHeroTitleSizeRem,
} from './heroTitleSize';
import {
  buildBillboardSubtitleStyle,
  buildBillboardTitleStyle,
  normalizeBillboardSubtitleDisplay,
  normalizeBillboardSubtitleSizeRem,
  normalizeBillboardTitleFontFamily,
  normalizeBillboardTitleFontWeight,
  normalizeBillboardTitleLetterSpacingEm,
  normalizeBillboardTitleSizeRem,
} from './dynamicSectionTypography';
import { DEFAULT_RATES_LEGAL_COPY_SETTINGS } from './ratesLegalCopyDefaults';
import {
  normalizeBlockForRender,
} from './blockPresentationContracts';
import { resolveSiteFeatureCatalogEntry } from '../data/siteFeatureCatalog';

export { DEFAULT_RATES_LEGAL_COPY_SETTINGS } from './ratesLegalCopyDefaults';

function sanitizeClassName(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter((token) => /^[a-zA-Z0-9_-]+$/.test(token))
    .join(' ');
}

function normalizeHighlightClassName(value) {
  const sanitized = sanitizeClassName(value);
  if (!sanitized) {
    return '';
  }

  return sanitized
    .split(/\s+/)
    .map((token) => normalizeSemanticTextColorClass(token) || token)
    .join(' ');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function parseTextHighlights(rawValue) {
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue || '[]') : rawValue;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => {
        const className = normalizeHighlightClassName(item?.className || '');
        const hasRange = Number.isFinite(Number(item?.start)) && Number.isFinite(Number(item?.end));
        const start = hasRange ? Math.max(0, Math.floor(Number(item.start))) : null;
        const end = hasRange ? Math.max(0, Math.floor(Number(item.end))) : null;
        const text = String(item?.text || '').trim();
        if (className && Number.isInteger(start) && Number.isInteger(end) && end > start) {
          return {
            start,
            end,
            className,
            text,
          };
        }
        if (className && text) {
          return { text, className };
        }
        return null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function buildSimpleHeroHighlight(textValue, colorValue) {
  const text = String(textValue || '').trim();
  const className = normalizeHighlightClassName(colorValue || '');
  if (!text || !className) {
    return [];
  }
  return [{ text, className }];
}

function resolveDynamicHeroLineHighlights(settings, lineNumber) {
  const highlightsKey = `line${lineNumber}HighlightsJson`;
  const legacyTextKey = `line${lineNumber}HighlightText`;
  const legacyColorKey = `line${lineNumber}HighlightColor`;
  const rawHighlightsValue = String(settings?.[highlightsKey] ?? '').trim();
  const advanced = parseTextHighlights(settings?.[highlightsKey]);
  if (rawHighlightsValue) {
    return advanced;
  }
  return buildSimpleHeroHighlight(settings?.[legacyTextKey], settings?.[legacyColorKey]);
}

export function renderTextWithHighlights(text, highlights) {
  const source = String(text || '');
  const safeText = escapeHtml(source);
  if (!source || !Array.isArray(highlights) || !highlights.length) {
    return safeText.replace(/\n/g, '<br />');
  }

  const rangeHighlights = highlights
    .map((highlight) => ({
      start: Number.isFinite(Number(highlight?.start)) ? Math.max(0, Math.floor(Number(highlight.start))) : null,
      end: Number.isFinite(Number(highlight?.end)) ? Math.max(0, Math.floor(Number(highlight.end))) : null,
      className: normalizeHighlightClassName(highlight?.className || ''),
    }))
    .filter((highlight) => (
      Number.isInteger(highlight.start)
      && Number.isInteger(highlight.end)
      && highlight.end > highlight.start
      && highlight.className
    ))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (rangeHighlights.length) {
    let cursor = 0;
    let html = '';
    rangeHighlights.forEach((highlight) => {
      const start = Math.max(cursor, Math.min(source.length, highlight.start));
      const end = Math.max(start, Math.min(source.length, highlight.end));
      if (start > cursor) {
        html += escapeHtml(source.slice(cursor, start));
      }
      if (end > start) {
        html += `<mark class="${highlight.className}">${escapeHtml(source.slice(start, end))}</mark>`;
        cursor = end;
      }
    });
    if (cursor < source.length) {
      html += escapeHtml(source.slice(cursor));
    }
    return html.replace(/\n/g, '<br />');
  }

  let html = safeText;
  highlights.forEach((highlight) => {
    const token = String(highlight?.text || '').trim();
    if (!token) {
      return;
    }
    const escapedToken = escapeHtml(token);
    const className = normalizeHighlightClassName(highlight?.className || '');
    const marked = `<mark${className ? ` class="${className}"` : ''}>${escapedToken}</mark>`;
    html = html.replace(escapedToken, marked);
  });

  return html.replace(/\n/g, '<br />');
}

export function isExternalLinkHref(href) {
  return /^(https?:|mailto:|tel:)/i.test(String(href || '').trim());
}

export function isPdfLinkHref(href) {
  return /\.pdf(?:[?#].*)?$/i.test(String(href || '').trim());
}

/**
 * Legacy compatibility for native action records that predate explicit button styles.
 * Retire this path when every native action descriptor carries a canonical style field.
 */
export function shouldUseUniversalOutlineButtonLink({ href, to, external, documentUrl, buttonStyle } = {}) {
  if (String(buttonStyle || '').trim()) {
    return false;
  }
  const target = String(href || documentUrl || to || '').trim();
  if (!target) {
    return false;
  }
  return Boolean(external) || isExternalLinkHref(target) || isPdfLinkHref(target);
}

export function splitCertificateCardBody(body) {
  const normalized = String(body || '').trim().replace(/\s+/g, ' ');
  const minimumMatch = normalized.match(/(?:\*\*)?\bMinimum (?:investment|requirements):?\b(?:\*\*)?.*$/i);
  if (!minimumMatch) {
    return {
      description: normalized,
      minimum: '',
    };
  }

  return {
    description: normalized.slice(0, minimumMatch.index).trim(),
    minimum: minimumMatch[0]
      .replace(/\*\*(Minimum (?:investment|requirements):?)\*\*/i, '$1')
      .trim(),
  };
}

export function normalizeUniversalOutlineButtonClassName(className, fallbackTone = 'atlantean') {
  const source = String(className || '').trim();
  if (!source) {
    return `service-native-btn is-outline is-tone-${normalizeButtonTone(fallbackTone)}`;
  }

  const rawTokens = source.split(/\s+/).filter(Boolean);
  if (rawTokens.includes('service-native-card-stretched-link')) {
    return source;
  }

  const hasExplicitOutline = rawTokens.includes('is-outline');
  const explicitToneToken = rawTokens.find((token) => token.startsWith('is-tone-'));
  const toneToken = hasExplicitOutline && explicitToneToken
    ? explicitToneToken
    : `is-tone-${normalizeButtonTone(fallbackTone)}`;
  const normalizedTokens = rawTokens.filter((token) => (
    token !== 'is-dark'
    && token !== 'is-ghost'
    && token !== 'is-outline'
    && !token.startsWith('is-tone-')
  ));

  if (!normalizedTokens.includes('service-native-btn')) {
    normalizedTokens.unshift('service-native-btn');
  }

  normalizedTokens.push('is-outline', toneToken);
  return Array.from(new Set(normalizedTokens)).join(' ');
}

function readFirstStringValue(source, keys = []) {
  const fieldKeys = Array.isArray(keys) ? keys : [keys];
  const record = source && typeof source === 'object' ? source : {};
  for (const key of fieldKeys.filter(Boolean)) {
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
      continue;
    }
    if (value !== undefined && value !== null) {
      const normalized = String(value).trim();
      if (normalized) {
        return normalized;
      }
    }
  }
  return '';
}

// Canonical fields win even when an editor intentionally clears them. Legacy
// aliases are consulted only when the canonical field is absent.
function readCanonicalStringValue(source, keys = []) {
  const fieldKeys = Array.isArray(keys) ? keys : [keys];
  const record = source && typeof source === 'object' ? source : {};
  const presentKey = fieldKeys.find((key) => key && Object.prototype.hasOwnProperty.call(record, key));
  if (presentKey) {
    const value = record[presentKey];
    return value === undefined || value === null ? '' : String(value).trim();
  }
  return readFirstStringValue(record, fieldKeys);
}

function buildCanonicalActionLinkFromFields(source, {
  labelKeys = ['label'],
  linkJsonKeys = [],
  hrefKeys = ['href', 'url'],
  toKeys = ['to', 'pageRef'],
  documentIdKeys = ['documentId'],
  styleKeys = ['style'],
  toneKeys = ['tone'],
  classNameKeys = [],
  openInNewWindowKeys = ['openInNewWindow'],
  actionKeys = ['action'],
  targetAnchorIdKeys = ['targetAnchorId'],
  targetBlockIdKeys = ['targetBlockId'],
} = {}) {
  const label = readCanonicalStringValue(source, labelKeys);
  const action = readCanonicalStringValue(source, actionKeys);
  const targetAnchorId = readCanonicalStringValue(source, targetAnchorIdKeys);
  const targetBlockId = readCanonicalStringValue(source, targetBlockIdKeys);
  const linkValue = coerceLinkValueFromFields(source, {
    linkJsonKeys,
    hrefKeys,
    toKeys,
    documentIdKeys,
    openInNewWindowKeys,
  });

  if (!label) {
    return null;
  }

  if (action && (targetAnchorId || targetBlockId)) {
    return {
      label,
      action,
      targetAnchorId,
      targetBlockId,
      style: readCanonicalStringValue(source, styleKeys),
      tone: readCanonicalStringValue(source, toneKeys),
      ...(readCanonicalStringValue(source, classNameKeys)
        ? { className: readCanonicalStringValue(source, classNameKeys) }
        : {}),
      openInNewWindow: false,
    };
  }

  if (!linkValue) {
    return null;
  }

  return {
    label,
    link: linkValue,
    style: readCanonicalStringValue(source, styleKeys),
    tone: readCanonicalStringValue(source, toneKeys),
    ...(readCanonicalStringValue(source, classNameKeys)
      ? { className: readCanonicalStringValue(source, classNameKeys) }
      : {}),
    openInNewWindow: Boolean(linkValue.openInNewWindow),
    ...linkValueToLinkProps(linkValue),
  };
}

function normalizeOptionalHtmlContent(value) {
  const html = String(value || '').trim();
  return (!html || html === '<p></p>' || html === '<p><br></p>') ? '' : html;
}

function parsePageContentTextLines(value) {
  if (Array.isArray(value)) {
    return value
      .map((line) => String(line || '').trim())
      .filter(Boolean);
  }

  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePageContentTableHeaders(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parsePageContentTableRows(value) {
  if (Array.isArray(value)) {
    return value
      .map((row) => (Array.isArray(row)
        ? row.map((cell) => String(cell || '').trim())
        : null))
      .filter((row) => Array.isArray(row) && row.length);
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((row) => (Array.isArray(row)
        ? row.map((cell) => String(cell || '').trim())
        : null))
      .filter((row) => Array.isArray(row) && row.length);
  } catch {
    return [];
  }
}

function normalizePageContentSupportLink(link) {
  if (!link || typeof link !== 'object') {
    return null;
  }
  const label = String(link.label || '').trim();
  const href = String(link.href || '').trim();
  const to = String(link.to || '').trim();
  const documentId = String(link.documentId || '').trim();
  if (!label || (!href && !to && !documentId)) {
    return null;
  }
  return {
    label,
    ...(href ? { href } : {}),
    ...(to ? { to } : {}),
    ...(documentId ? { documentId } : {}),
    ...(toBoolean(link.openInNewWindow) ? { openInNewWindow: true } : {}),
  };
}

function parsePageContentSupportGroups(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((group) => {
        const title = String(group?.title || '').trim();
        const description = String(group?.description || '').trim();
        const links = Array.isArray(group?.links)
          ? group.links.map(normalizePageContentSupportLink).filter(Boolean)
          : [];
        const items = Array.isArray(group?.items)
          ? group.items.map((item) => {
            const question = String(item?.question || '').trim();
            const answer = String(item?.answer || '').trim();
            const itemLinks = Array.isArray(item?.links)
              ? item.links.map(normalizePageContentSupportLink).filter(Boolean)
              : [];
            return question || answer || itemLinks.length
              ? { question, answer, links: itemLinks }
              : null;
          }).filter(Boolean)
          : [];

        return title && (description || links.length || items.length)
          ? { title, ...(description ? { description } : {}), links, items }
          : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parseMissionAssurePricingEntries(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => ({
        trip: String(entry?.trip || '').trim(),
        rate: String(entry?.rate || '').trim(),
        note: String(entry?.note || '').trim(),
      }))
      .filter((entry) => entry.trip || entry.rate || entry.note);
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  try {
    return parseMissionAssurePricingEntries(JSON.parse(raw));
  } catch {
    return [];
  }
}

function buildSingleActionPromoRuntime(source, {
  includeBodyHtml = false,
  includeBgTone = false,
  bgToneDefault = 'white',
  includeImage = false,
  countImageAsContent = false,
} = {}) {
  const settings = source && typeof source === 'object' ? source : {};
  const title = String(settings.title || '').trim();
  const body = String(settings.body || '').trim();
  const bodyHtml = includeBodyHtml ? normalizeOptionalHtmlContent(settings.bodyHtml) : '';
  const action = buildCanonicalActionLinkFromFields(settings, {
    labelKeys: ['buttonLabel'],
    linkJsonKeys: ['buttonLinkJson'],
    hrefKeys: [],
    toKeys: [],
    openInNewWindowKeys: [],
  });
  const imageUrl = includeImage ? String(settings.imageUrl || '').trim() : '';
  const imageAlt = includeImage ? String(settings.imageAlt || '').trim() : '';
  const bgTone = includeBgTone
    ? normalizePanelBgTone(settings.bgTone ?? settings.background, bgToneDefault)
    : '';

  if (!title && !body && !bodyHtml && !action && (!countImageAsContent || !imageUrl)) {
    return null;
  }

  return {
    title,
    titleHighlights: parseTextHighlights(settings.titleHighlightsJson),
    body,
    ...(includeBodyHtml ? { bodyHtml } : {}),
    ...(includeImage ? { imageUrl, imageAlt } : {}),
    ...(includeBgTone ? { bgTone } : {}),
    action,
  };
}

function normalizeCardGridLinkItem(item) {
  const source = item && typeof item === 'object' ? item : {};
  const label = readFirstStringValue(source, ['label', 'title', 'text']);
  const linkValue = coerceLinkValue(source.link) || coerceLinkValue(source);

  if (!label || !linkValue) {
    return null;
  }

  return {
    label,
    link: linkValue,
    openInNewWindow: Boolean(linkValue.openInNewWindow),
    ...linkValueToLinkProps(linkValue),
  };
}

function parseCardGridLinkItemsJson(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => normalizeCardGridLinkItem(item)).filter(Boolean);
  } catch {
    return [];
  }
}

function parseCardGridAccordionsJson(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        const source = item && typeof item === 'object' ? item : {};
        const title = readFirstStringValue(source, ['title', 'label']);
        const links = parseCardGridLinkItemsJson(source.links || source.items);

        if (!title || !links.length) {
          return null;
        }

        return {
          title,
          links,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parseCardGridListJson(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function parseSiteFeatureIntroJson(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '{}') : value;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const heading = String(parsed.heading || '').trim();
    const body = String(parsed.body || '').trim();
    const emphasis = String(parsed.emphasis || '').trim();
    if (!heading && !body && !emphasis) {
      return null;
    }
    return { heading, body, emphasis };
  } catch {
    return null;
  }
}

const ACTION_BUTTON_STYLE_SET = new Set(['blue', 'dark', 'outline', 'ghost']);
const IMPACT_STAT_TONE_SET = new Set(['atlantean', 'mango', 'melon', 'sandstone', 'super-grey', 'white']);
const DYNAMIC_COLUMNS_STYLE_SET = new Set(['retirement', 'legacy-highlight', 'loans-value']);
const DYNAMIC_COLUMNS_TYPE_SET = new Set(['text', 'photo', 'flow-step', 'support']);
const DYNAMIC_COLUMNS_WIDTH_SET = new Set(['content', 'browser']);
const DYNAMIC_COLUMNS_COUNT_SET = new Set(['two', 'three', 'four']);
const TOP_STRIP_BG_TONE_SET = new Set(['white', 'sand', 'blue', 'grey']);
const TOP_STRIP_TEXT_TONE_SET = new Set(['dark', 'white', 'blue', 'atlantean', 'super-grey', 'mango', 'melon']);
const TOP_STRIP_BUTTON_TONE_SET = new Set(['atlantean', 'super-grey', 'mango', 'melon', 'white']);

export const DEFAULT_SERVICE_HERO_PIE_SLICES = Object.freeze([
  Object.freeze({
    title: 'Loans',
    path: '/services/loans',
    color: '#00adbb',
    description: '100% customized. Every loan, from construction to lines of credit.',
    links: Object.freeze([
      Object.freeze({ label: 'Loan options', path: '/services/loans' }),
      Object.freeze({ label: 'Inquiry form', path: '/services/loans#form' }),
    ]),
  }),
  Object.freeze({
    title: 'Investments',
    path: '/services/investments',
    color: '#f26660',
    description: 'Growth for you, growth for Kingdom.',
    links: Object.freeze([
      Object.freeze({ label: 'Rates', path: '/services/investments#rates' }),
      Object.freeze({ label: 'Demand Certificates', path: '/services/investments#certificates' }),
      Object.freeze({ label: 'Term Certificates', path: '/services/investments#certificates' }),
    ]),
  }),
  Object.freeze({
    title: 'Retirement',
    path: '/services/retirement',
    color: '#76787b',
    description: 'Plan, contribute, and build for tomorrow.',
    links: Object.freeze([
      Object.freeze({ label: 'IRAs', path: '/services/retirement/iras' }),
      Object.freeze({ label: 'AGFinancial 403(b)', path: '/services/retirement/403b' }),
      Object.freeze({ label: '409A', path: '/services/retirement/409a' }),
    ]),
  }),
  Object.freeze({
    title: 'Planned Giving',
    path: '/services/planned-giving',
    color: '#c4beb6',
    description: 'Manage your giving with tax benefits and income generation.',
    links: Object.freeze([
      Object.freeze({ label: 'Charitable Gift Annuities', path: '/services/planned-giving/charitable-gift-annuities' }),
      Object.freeze({ label: 'Charitable Trusts', path: '/services/planned-giving/charitable-trusts' }),
      Object.freeze({ label: 'Donor Advised Fund', path: '/services/planned-giving/donor-advised-fund' }),
    ]),
  }),
  Object.freeze({
    title: 'Insurance',
    path: '/services/insurance',
    color: '#ffa400',
    description: 'Coverage built for churches, ministries and individuals to protect what’s most important.',
    links: Object.freeze([
      Object.freeze({ label: 'Property & Casualty', path: '/services/insurance/property-casualty-insurance' }),
      Object.freeze({ label: 'Group Life', path: '/services/insurance/group-term-life-insurance' }),
      Object.freeze({ label: 'Mission Assure', path: '/services/insurance/mission-assure' }),
    ]),
  }),
]);

function normalizeActionButtonStyle(style) {
  const token = String(style || '').trim().toLowerCase();
  return ACTION_BUTTON_STYLE_SET.has(token) ? token : 'blue';
}

function normalizeActionButtonTone(tone, fallback = 'atlantean') {
  return normalizeButtonTone(tone, fallback);
}

function normalizeImpactStatTone(value, fallback = 'mango') {
  const token = String(value || '').trim().toLowerCase();
  return IMPACT_STAT_TONE_SET.has(token) ? token : fallback;
}

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}

function normalizeColumnsBgTone(value, fallback = 'white') {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'sand' || token === 'blue' || token === 'grey' || token === 'white') {
    return token;
  }
  return fallback;
}

function normalizePanelBgTone(value, fallback = 'white') {
  return normalizeSurfaceBgTone(value, fallback);
}

function normalizePanelTextTone(value, fallback = 'dark') {
  return normalizeSharedPanelTextTone(value, fallback);
}

function normalizeTopStripBgTone(value, fallback = 'grey') {
  const token = String(value || '').trim().toLowerCase();
  return TOP_STRIP_BG_TONE_SET.has(token) ? token : fallback;
}

function normalizeTopStripTextTone(value, fallback = 'white') {
  const token = String(value || '').trim().toLowerCase();
  return TOP_STRIP_TEXT_TONE_SET.has(token) ? token : fallback;
}

function normalizeTopStripButtonTone(value, fallback = 'atlantean') {
  const token = String(value || '').trim().toLowerCase();
  return TOP_STRIP_BUTTON_TONE_SET.has(token) ? token : fallback;
}

function normalizeTopStripButtonStyle(value, fallback = 'solid') {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'solid' || token === 'outline') {
    return token;
  }
  if (token === 'blue') {
    return 'solid';
  }
  return fallback;
}

function normalizeTopStripRatesStyle(value, fallback = 'link') {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'link' || token === 'solid' || token === 'outline') {
    return token;
  }
  if (token === 'blue') {
    return 'solid';
  }
  return fallback;
}

function normalizePositiveRem(value, fallback) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  return Number(fallback) || 1;
}

function describeHeroPieWedgePath(cx, cy, radius, startAngle, endAngle) {
  const polar = (angle) => ({
    x: cx + (radius * Math.cos(angle)),
    y: cy + (radius * Math.sin(angle)),
  });
  const start = polar(startAngle);
  const end = polar(endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function normalizeHeroPieSliceColor(value, fallbackColor) {
  const token = String(value || '').trim();
  if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(token)) {
    return token;
  }
  return fallbackColor;
}

function parseHeroPieSlices(rawValue) {
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue || '[]') : rawValue;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item, index) => {
        const fallback = DEFAULT_SERVICE_HERO_PIE_SLICES[index % DEFAULT_SERVICE_HERO_PIE_SLICES.length]
          || DEFAULT_SERVICE_HERO_PIE_SLICES[0];
        const title = String(item?.title || '').trim();
        const path = String(item?.path || '').trim();
        if (!title || !path) {
          return null;
        }
        const links = Array.isArray(item?.links)
          ? item.links
            .map((link) => ({
              label: String(link?.label || '').trim(),
              path: String(link?.path || '').trim(),
            }))
            .filter((link) => link.label && link.path)
          : [];
        return {
          title,
          path,
          color: normalizeHeroPieSliceColor(item?.color, fallback.color),
          description: String(item?.description || fallback.description || '').trim(),
          links: links.length ? links : fallback.links.map((link) => ({ ...link })),
        };
      })
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}


function normalizePageContentSpaceRem(value, fallback = 0.5, min = 0, max = 8) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Number(numeric.toFixed(2))));
}

function normalizePageContentMaxWidthPx(value, fallback = 980) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(560, Math.min(1440, Math.round(numeric)));
}

function normalizeColumnsStyle(value) {
  const token = String(value || '').trim().toLowerCase();
  return DYNAMIC_COLUMNS_STYLE_SET.has(token) ? token : 'retirement';
}

function normalizeColumnsType(value) {
  const token = String(value || '').trim().toLowerCase();
  return DYNAMIC_COLUMNS_TYPE_SET.has(token) ? token : 'text';
}

function normalizeColumnsWidth(value) {
  const token = String(value || '').trim().toLowerCase();
  return DYNAMIC_COLUMNS_WIDTH_SET.has(token) ? token : 'content';
}

function normalizeColumnsCount(value) {
  const token = String(value || '').trim().toLowerCase();
  if (token === '2') {
    return 'two';
  }
  if (token === '3') {
    return 'three';
  }
  if (token === '4') {
    return 'four';
  }
  return DYNAMIC_COLUMNS_COUNT_SET.has(token) ? token : 'two';
}

function resolveBillboardSubtitleColor(value) {
  return resolveIntroAccentColor(value);
}

export function actionButtonClassName(style, tone) {
  const token = normalizeActionButtonStyle(style);
  if (token === 'dark') {
    return 'service-native-btn is-dark';
  }
  if (token === 'outline') {
    return `service-native-btn is-outline is-tone-${normalizeActionButtonTone(tone)}`;
  }
  return 'service-native-btn';
}

function toIntroEmphasisClassName(value) {
  return normalizeSemanticTextColorClass(value);
}

function toIntroEmphasisStyle(value) {
  const color = resolveIntroAccentColor(value);
  return color ? { color } : undefined;
}

export function buildDynamicIntroFromBlock(block) {
  if (!block || block.mode !== 'dynamic' || block.kind !== 'intro') {
    return null;
  }
  const settings = block.settings || {};
  const heading = String(settings.heading || '').trim();
  const headingClassName = normalizeHighlightClassName(settings.headingClassName || '');
  const headingHighlights = parseTextHighlights(settings.headingHighlightsJson);
  const bodyHtml = String(settings.bodyHtml || '').trim();
  const body = String(settings.body || '').trim();
  const extraLine = String(settings.extraLine || '').trim();
  const extraLineClassName = toIntroEmphasisClassName(settings.extraLineTone);
  const extraLineStyle = toIntroEmphasisStyle(settings.extraLineTone);
  const bgTone = normalizeSurfaceBgTone(settings.bgTone, 'sand');
  const textTone = normalizeSharedPanelTextTone(settings.textTone, 'dark');
  const justify = String(settings.justify || 'center').trim().toLowerCase();
  const lineSpacing = Number.isFinite(Number(settings.lineSpacing)) ? Number(settings.lineSpacing) : 1.04;
  const sectionClassName = sanitizeClassName(settings.sectionClassName || '');

  const actions = [
    buildCanonicalActionLinkFromFields(settings, {
      labelKeys: ['button1Label'],
      linkJsonKeys: ['button1LinkJson'],
      hrefKeys: [],
      toKeys: [],
      styleKeys: ['button1Style'],
      openInNewWindowKeys: [],
    }),
    buildCanonicalActionLinkFromFields(settings, {
      labelKeys: ['button2Label'],
      linkJsonKeys: ['button2LinkJson'],
      hrefKeys: [],
      toKeys: [],
      styleKeys: ['button2Style'],
      openInNewWindowKeys: [],
    }),
  ].filter(Boolean);

  const hasContent = heading || bodyHtml || body || extraLine || actions.length;
  if (!hasContent) {
    return null;
  }

  const isPlaceholder = bodyHtml.includes('saved-page copy restoration');
  if (isPlaceholder) {
    return null;
  }

  return {
    heading,
    headingClassName,
    headingHighlights,
    bodyHtml,
    body,
    extraLine,
    extraLineClassName,
    extraLineStyle,
    bgTone,
    textTone,
    justify: justify || 'center',
    lineSpacing,
    sectionClassName,
    actions,
  };
}

export function buildDynamicBillboardFromBlock(block) {
  if (!block || block.mode !== 'dynamic' || block.kind !== 'billboard') {
    return null;
  }

  const normalizedBlock = normalizeBlockForRender(block);
  const settings = normalizedBlock?.settings || {};
  const title = String(settings.title || '').trim();
  const titleClassName = sanitizeClassName(settings.titleClassName || '');
  const titleHighlights = parseTextHighlights(settings.titleHighlightsJson);
  const subtitle = String(settings.subtitle || '').trim();
  const subtitleClassName = normalizeHighlightClassName(settings.subtitleClassName || '');
  const sectionClassName = sanitizeClassName(settings.sectionClassName || '');
  const bodyHtml = String(settings.bodyHtml || '').trim();
  const body = String(settings.body || '').trim();
  const fineprint = parsePageContentTextLines(settings.fineprint);
  const bgTone = String(settings.bgTone || 'blue').trim().toLowerCase() || 'blue';
  const textTone = String(settings.textTone || 'white').trim().toLowerCase() || 'white';
  const justify = String(settings.justify || 'center').trim().toLowerCase() || 'center';
  const lineSpacing = Number.isFinite(Number(settings.lineSpacing)) ? Number(settings.lineSpacing) : 1;
  const scrollReveal = normalizeBillboardScrollReveal(settings.scrollReveal);
  const titleFontFamily = normalizeBillboardTitleFontFamily(settings.titleFontFamily);
  const titleFontWeight = normalizeBillboardTitleFontWeight(
    settings.titleFontWeight,
    titleFontFamily,
  );
  const titleSizeRem = normalizeBillboardTitleSizeRem(settings.titleSizeRem);
  const titleLetterSpacingEm = normalizeBillboardTitleLetterSpacingEm(settings.titleLetterSpacingEm, titleFontFamily);
  const subtitleDisplay = normalizeBillboardSubtitleDisplay(settings.subtitleDisplay);
  const subtitleHasExplicitSize = String(settings.subtitleSizeRem ?? '').trim() !== ''
    && Number.isFinite(Number(settings.subtitleSizeRem));
  const subtitleSizeRem = subtitleHasExplicitSize
    ? normalizeBillboardSubtitleSizeRem(settings.subtitleSizeRem)
    : null;
  const subtitleResolvedColor = resolveBillboardSubtitleColor(subtitleClassName);
  const hasHeadlineWidthOverride = String(settings.headlineMaxWidthPx ?? '').trim() !== ''
    && Number.isFinite(Number(settings.headlineMaxWidthPx));
  const headlineMaxWidthPx = hasHeadlineWidthOverride
    ? normalizePageContentMaxWidthPx(settings.headlineMaxWidthPx, 920)
    : null;
  const hasContentWidthOverride = String(settings.contentMaxWidthPx ?? '').trim() !== ''
    && Number.isFinite(Number(settings.contentMaxWidthPx));
  const actions = [
    buildCanonicalActionLinkFromFields(settings, {
      labelKeys: ['buttonLabel'],
      linkJsonKeys: ['buttonLinkJson'],
      hrefKeys: [],
      toKeys: [],
      documentIdKeys: ['buttonDocumentId'],
      styleKeys: ['buttonStyle'],
      toneKeys: ['buttonTone'],
      openInNewWindowKeys: [],
      actionKeys: ['buttonAction'],
      targetAnchorIdKeys: ['buttonTargetAnchorId'],
      targetBlockIdKeys: ['buttonTargetBlockId'],
    }),
    buildCanonicalActionLinkFromFields(settings, {
      labelKeys: ['button2Label'],
      linkJsonKeys: ['button2LinkJson'],
      hrefKeys: [],
      toKeys: [],
      documentIdKeys: ['button2DocumentId'],
      styleKeys: ['button2Style'],
      toneKeys: ['button2Tone'],
      openInNewWindowKeys: [],
    }),
  ]
    .filter(Boolean)
    .map((action) => ({
      ...action,
      style: normalizeActionButtonStyle(action.style),
      tone: normalizeActionButtonTone(
        action.tone,
        action.style === 'dark' ? 'super-grey' : 'atlantean',
      ),
    }));

  if (!title && !subtitle && !bodyHtml && !body && !fineprint.length && !actions.length) {
    return null;
  }

  return {
    title,
    titleClassName,
    titleHighlights,
    anchorId: String(settings.anchorId || '').trim(),
    sectionClassName,
    subtitle,
    subtitleClassName,
    subtitleDisplay,
    subtitleStyle: buildBillboardSubtitleStyle({
      resolvedColor: subtitleResolvedColor,
      subtitleDisplay,
      subtitleSizeRem,
      titleFontFamily,
      titleFontWeight,
      titleSizeRem,
      titleLetterSpacingEm,
    }),
    titleStyle: buildBillboardTitleStyle({
      lineSpacing,
      titleFontFamily,
      titleFontWeight,
      titleSizeRem,
      titleLetterSpacingEm,
    }),
    bodyHtml,
    body,
    fineprint: fineprint.length ? fineprint : null,
    fineprintDisclosureId: String(settings.fineprintDisclosureId || '').trim(),
    bgTone,
    textTone,
    justify,
    lineSpacing,
    scrollReveal,
    copyStyle: headlineMaxWidthPx
      ? { '--dynamic-billboard-copy-max-width': `${headlineMaxWidthPx}px` }
      : undefined,
    copyClassName: sanitizeClassName(settings.copyClassName || '')
      || (scrollReveal === 'scale-up' ? 'fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up' : ''),
    copyFadeRootMargin: scrollReveal === 'scale-up' ? '0px 0px -20% 0px' : '',
    contentMaxWidthPx: hasContentWidthOverride
      ? normalizePageContentMaxWidthPx(settings.contentMaxWidthPx, 920)
      : null,
    action: actions[0] || null,
    actions,
    actionsBeforeCards: toBoolean(settings.actionsBeforeCards),
  };
}

export function buildDynamicColumnsFromBlock(block) {
  if (!block || block.mode !== 'dynamic' || block.kind !== 'columns') {
    return null;
  }

  const settings = block.settings || {};
  const title = String(settings.title || '').trim();
  const leadLine = String(settings.leadLine || '').trim();
  const followupLine = String(settings.followupLine || '').trim();
  const bodyHtml = String(settings.bodyHtml || '').trim();
  const columnsStyle = normalizeColumnsStyle(settings.columnsStyle);
  const isLegacyHighlightStyle = columnsStyle === 'legacy-highlight';
  const bgTone = isLegacyHighlightStyle
    ? 'blue'
    : normalizeColumnsBgTone(settings.bgTone, 'white');
  const contentWidth = normalizeColumnsWidth(settings.contentWidth);
  const columns = normalizeColumnsCount(settings.columns);
  const justifyToken = String(settings.justify || 'center').trim().toLowerCase();
  const justify = justifyToken === 'left' || justifyToken === 'right' ? justifyToken : 'center';
  const normalizedBodyHtml = (!bodyHtml || bodyHtml === '<p></p>' || bodyHtml === '<p><br></p>') ? '' : bodyHtml;
  const action = buildCanonicalActionLinkFromFields(settings, {
    labelKeys: ['buttonLabel'],
    linkJsonKeys: ['buttonLinkJson'],
    hrefKeys: [],
    toKeys: [],
    styleKeys: ['buttonStyle'],
    toneKeys: ['buttonTone'],
    openInNewWindowKeys: [],
  });
  const actions = action ? [action] : [];

  const items = Array.from({ length: 4 }, (_, index) => index + 1)
    .map((slot) => {
      const enabledValue = settings[`col${slot}Enabled`];
      const isEnabled = enabledValue === undefined ? slot <= 2 : toBoolean(enabledValue);
      if (!isEnabled) {
        return null;
      }

      const type = isLegacyHighlightStyle ? 'text' : normalizeColumnsType(settings[`col${slot}Type`]);
      const item = {
        slot,
        type,
        title: String(settings[`col${slot}Title`] || '').trim(),
        titleClassName: normalizeHighlightClassName(settings[`col${slot}TitleClassName`] || ''),
        titleHighlights: parseTextHighlights(settings[`col${slot}TitleHighlightsJson`]),
        body: String(settings[`col${slot}Body`] || '').trim(),
        bodyHtml: normalizeOptionalHtmlContent(settings[`col${slot}BodyHtml`]),
        imageUrl: String(settings[`col${slot}ImageUrl`] || '').trim(),
        imageAlt: String(settings[`col${slot}ImageAlt`] || '').trim(),
        iconKey: String(settings[`col${slot}IconKey`] || '').trim(),
        iconTone: sanitizeClassName(settings[`col${slot}IconTone`] || ''),
        widthShare: Number.isFinite(Number(settings[`col${slot}WidthShare`]))
          ? Number(settings[`col${slot}WidthShare`])
          : 1,
        action: isLegacyHighlightStyle
          ? null
          : buildCanonicalActionLinkFromFields(settings, {
            labelKeys: [`col${slot}ButtonLabel`],
            linkJsonKeys: [`col${slot}ButtonLinkJson`],
            hrefKeys: [],
            toKeys: [],
            styleKeys: [`col${slot}ButtonStyle`],
            toneKeys: [`col${slot}ButtonTone`],
            openInNewWindowKeys: [],
          }),
      };

      if (isLegacyHighlightStyle) {
        return item.title ? item : null;
      }

      return (item.title || item.body || item.bodyHtml || item.imageUrl || item.action) ? item : null;
    })
    .filter(Boolean);

  if (!title && !leadLine && !followupLine && !bodyHtml && !items.length && !actions.length) {
    return null;
  }

  return {
    title,
    titleClassName: normalizeHighlightClassName(settings.titleClassName || ''),
    titleHighlights: parseTextHighlights(settings.titleHighlightsJson),
    leadLine,
    leadLineClassName: normalizeHighlightClassName(settings.leadLineClassName || ''),
    leadLineHighlights: parseTextHighlights(settings.leadLineHighlightsJson),
    followupLine,
    followupLineClassName: normalizeHighlightClassName(settings.followupLineClassName || ''),
    followupLineHighlights: parseTextHighlights(settings.followupLineHighlightsJson),
    bodyHtml: normalizedBodyHtml,
    justify,
    bgTone,
    contentWidth,
    columns,
    columnsStyle,
    sectionClassName: sanitizeClassName(settings.sectionClassName || ''),
    items,
    action: action || null,
    actions,
  };
}

export function buildDynamicFeaturePanelFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'feature_panel' || mode !== 'dynamic') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const runtime = buildSingleActionPromoRuntime(settings, {
    includeBodyHtml: true,
    includeImage: true,
  });
  if (!runtime) {
    return null;
  }
  return {
    ...runtime,
    anchorId: String(settings.anchorId || '').trim(),
    sectionClassName: sanitizeClassName(settings.sectionClassName || ''),
    fullBleed: toBoolean(settings.fullBleed),
  };
}

export function buildDynamicSiteFeatureFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'site_feature' || mode !== 'dynamic') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const requestedFeatureId = readFirstStringValue(settings, ['featureId']);
  const featureEntry = resolveSiteFeatureCatalogEntry(requestedFeatureId);
  if (!featureEntry || typeof featureEntry.buildRuntime !== 'function') {
    return null;
  }
  const featureId = String(featureEntry.featureId || '').trim();
  const allowedFieldIds = new Set(Array.isArray(featureEntry.allowedEditableFieldIds) ? featureEntry.allowedEditableFieldIds : []);
  const featureDefinition = featureEntry.buildRuntime({ settings });
  const featureRuntime = featureDefinition && typeof featureDefinition === 'object'
    ? featureDefinition
    : {};
  const defaultTitle = String(featureRuntime.title || '').trim();
  const defaultBody = String(featureRuntime.body || '').trim();
  const defaultImageUrl = String(featureRuntime.imageUrl || '').trim();
  const defaultImageAlt = String(featureRuntime.imageAlt || '').trim();
  const featureIntro = parseSiteFeatureIntroJson(
    Object.prototype.hasOwnProperty.call(settings, 'featureIntroJson')
      ? settings.featureIntroJson
      : featureRuntime.featureIntro,
  );

  // Catalog defaults are code-managed feature structure. Declared editable
  // fields still own the visible value, including an intentional empty value.
  const headline = allowedFieldIds.has('headline') && Object.prototype.hasOwnProperty.call(settings, 'headline')
    ? String(settings.headline || '').trim()
    : defaultTitle;
  const body = allowedFieldIds.has('body') && Object.prototype.hasOwnProperty.call(settings, 'body')
    ? String(settings.body || '').trim()
    : defaultBody;
  const allowsAction = ['buttonLabel', 'buttonUrl', 'buttonPageRef', 'buttonLinkJson']
    .some((fieldId) => allowedFieldIds.has(fieldId));
  const overrideAction = allowsAction
    ? buildCanonicalActionLinkFromFields(settings, {
      labelKeys: ['buttonLabel'],
      linkJsonKeys: ['buttonLinkJson'],
      hrefKeys: [],
      toKeys: [],
      openInNewWindowKeys: [],
    })
    : null;
  const action = overrideAction || featureRuntime.action || null;
  const metrics = Array.isArray(featureRuntime.metrics)
    ? featureRuntime.metrics
      .filter((metric) => metric && typeof metric === 'object')
      .map((metric) => {
        const metricAction = metric.action && typeof metric.action === 'object'
          ? {
            label: String(metric.action.label || '').trim(),
            href: String(metric.action.href || '').trim(),
            to: String(metric.action.to || '').trim(),
            openInNewWindow: Boolean(metric.action.openInNewWindow),
          }
          : null;
        const hasMetricAction = Boolean(metricAction?.label && (metricAction?.href || metricAction?.to));
        return {
          value: String(metric.value || '').trim(),
          label: String(metric.label || '').trim(),
          tone: String(metric.tone || '').trim() || 'mango',
          valueTone: String(metric.valueTone || '').trim(),
          labelBreak: String(metric.labelBreak || '').trim(),
          body: String(metric.body || '').trim(),
          eyebrow: String(metric.eyebrow || '').trim(),
          action: hasMetricAction ? metricAction : null,
        };
      })
      .filter((metric) => metric.value && metric.label)
    : [];
  const beats = Array.isArray(featureRuntime.beats)
    ? featureRuntime.beats
      .map((beat) => String(beat || '').trim())
      .filter(Boolean)
    : [];

  if (!headline && !body && !action && !metrics.length && !beats.length) {
    return null;
  }

  return {
    ...Object.fromEntries(
      Object.entries(featureRuntime).filter(([key]) => ![
        'title',
        'body',
        'action',
        'imageUrl',
        'imageAlt',
        'metrics',
      ].includes(key)),
    ),
    type: 'site_feature',
    featureId,
    runtimeKey: String(featureEntry.runtimeKey || featureId).trim() || featureId,
    catalogLabel: String(featureEntry.label || '').trim() || featureId,
    isCodeManaged: true,
    sectionClassName: sanitizeClassName(settings.sectionClassName || ''),
    featureIntro,
    title: headline,
    body,
    imageUrl: defaultImageUrl,
    imageAlt: defaultImageAlt,
    action,
    metrics,
    beats,
  };
}

export function buildDynamicPhotoColumnFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'photo_column' || mode !== 'dynamic') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const title = String(settings?.title || '').trim();
  const body = String(settings?.body || '').trim();
  const imageUrl = String(settings?.imageUrl || '').trim();
  const imageAlt = String(settings?.imageAlt || '').trim();
  const widthShare = Number.isFinite(Number(settings?.widthShare))
    ? Number(settings.widthShare)
    : 1;
  const action = buildCanonicalActionLinkFromFields(settings, {
    labelKeys: ['buttonLabel'],
    linkJsonKeys: ['buttonLinkJson'],
    hrefKeys: [],
    toKeys: [],
    styleKeys: ['buttonStyle'],
    toneKeys: ['buttonTone'],
    openInNewWindowKeys: [],
  });

  if (!title && !body && !imageUrl && !action) {
    return null;
  }

  return {
    type: 'photo',
    title,
    body,
    imageUrl,
    imageAlt,
    widthShare,
    action,
  };
}

export function buildDynamicSplitPanelFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'split_panel' || mode !== 'dynamic') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const presentation = String(settings?.presentation || '').trim().toLowerCase() === 'certificate_cards'
    ? 'certificate_cards'
    : 'default';
  const items = ['left', 'right']
    .map((side, index) => {
      const bodyHtml = String(settings?.[`${side}BodyHtml`] || '').trim();
      const normalizedBodyHtml = (!bodyHtml || bodyHtml === '<p></p>' || bodyHtml === '<p><br></p>') ? '' : bodyHtml;
      const tone = String(settings?.[`${side}Tone`] || '').trim().toLowerCase();
      const item = {
        slot: index + 1,
        side,
        tone: tone || (side === 'right' ? 'mango' : 'atlantean'),
        title: String(settings?.[`${side}Title`] || '').trim(),
        bodyHtml: normalizedBodyHtml,
        body: String(settings?.[`${side}Body`] || '').trim(),
        action: buildCanonicalActionLinkFromFields(settings, {
          labelKeys: [`${side}ButtonLabel`],
          linkJsonKeys: [`${side}ButtonLinkJson`],
          hrefKeys: [],
          toKeys: [],
          openInNewWindowKeys: [],
        }),
      };

      return (item.title || item.bodyHtml || item.body || item.action) ? item : null;
    })
    .filter(Boolean);

  return items.length ? { presentation, items } : null;
}

function resolveCanonicalLinkTarget(source, linkJsonKeys) {
  const link = coerceLinkValueFromFields(
    source,
    {
      linkJsonKeys,
      hrefKeys: [],
      toKeys: [],
      openInNewWindowKeys: [],
    },
  );

  return String(link?.to || link?.href || '').trim();
}

export function buildDynamicServicesGridFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'services_grid' && kind !== '' && block?.type !== 'services_grid') {
    return null;
  }
  if (kind === 'services_grid' && mode !== 'dynamic' && block?.type !== 'services_grid') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const hasCanonicalSettings = Boolean(block?.settings && typeof block.settings === 'object');
  const fallbackCards = hasCanonicalSettings || !Array.isArray(block?.cards) ? [] : block.cards;
  const cards = Array.from({ length: 6 }, (_, index) => index + 1)
    .map((slot, index) => {
      const fallbackCard = fallbackCards[index] || {};
      const path = resolveCanonicalLinkTarget({
        ...settings,
        ...(hasCanonicalSettings ? {} : { [`__fallbackCard${slot}LinkJson`]: fallbackCard.linkJson }),
      }, [`card${slot}LinkJson`, ...(hasCanonicalSettings ? [] : [`__fallbackCard${slot}LinkJson`])]);
      const card = {
        slot,
        title: String(settings?.[`card${slot}Title`] ?? fallbackCard.title ?? '').trim(),
        path,
        image: String(settings?.[`card${slot}ImageUrl`] ?? fallbackCard.image ?? '').trim(),
        imageAlt: String(settings?.[`card${slot}ImageAlt`] ?? fallbackCard.imageAlt ?? '').trim(),
        action: String(settings?.[`card${slot}Action`] ?? fallbackCard.action ?? '').trim(),
        featured: toBoolean(settings?.[`card${slot}Featured`] ?? fallbackCard.featured),
      };

      return (card.title || card.path || card.image || card.action) ? card : null;
    })
    .filter(Boolean);

  const heading = String(settings?.heading ?? '').trim();
  const headingSizeRem = normalizePositiveRem(settings?.headingSizeRem, 4.5625);
  const cardTitleSizeRem = normalizePositiveRem(settings?.cardTitleSizeRem, 2.1875);
  const cardPaddingRem = normalizePositiveRem(settings?.cardPaddingRem, 1.85);
  const browseLabel = String(settings?.browseLabel ?? '').trim();
  const browsePath = resolveCanonicalLinkTarget({
    ...settings,
    ...(hasCanonicalSettings ? {} : { __fallbackBrowseLinkJson: block?.browseLinkJson }),
  }, ['browseLinkJson', ...(hasCanonicalSettings ? [] : ['__fallbackBrowseLinkJson'])]);

  if (!heading && !cards.length && !browseLabel && !browsePath) {
    return null;
  }

  return {
    heading,
    headingSizeRem,
    cardTitleSizeRem,
    cardPaddingRem,
    cards,
    browseLabel,
    browsePath,
  };
}

export function buildDynamicImpactStatFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'impact_stat' && kind !== '' && block?.type !== 'impact_stat') {
    return null;
  }
  if (kind === 'impact_stat' && mode !== 'dynamic' && block?.type !== 'impact_stat') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const hasCanonicalSettings = Boolean(block?.settings && typeof block.settings === 'object');
  const fallbackStats = hasCanonicalSettings || !Array.isArray(block?.stats) ? [] : block.stats;
  const stats = Array.from({ length: 3 }, (_, index) => index + 1)
    .map((slot, index) => {
      const fallbackStat = fallbackStats[index] || {};
      const value = String(settings?.[`stat${slot}Value`] ?? fallbackStat.value ?? '').trim();
      const label = String(settings?.[`stat${slot}Label`] ?? fallbackStat.label ?? '').trim();
      return (value || label) ? {
        slot,
        value,
        label,
        tone: normalizeImpactStatTone(settings?.[`stat${slot}Tone`] ?? fallbackStat.tone, slot === 1 ? 'mango' : 'atlantean'),
      } : null;
    })
    .filter(Boolean);
  const action = buildCanonicalActionLinkFromFields(hasCanonicalSettings ? settings : {
    ctaLabel: settings?.ctaLabel ?? block?.ctaLabel,
    ctaLinkJson: settings?.ctaLinkJson ?? block?.ctaLinkJson,
  }, {
    labelKeys: ['ctaLabel'],
    linkJsonKeys: ['ctaLinkJson'],
    hrefKeys: [],
    toKeys: [],
    openInNewWindowKeys: [],
  });
  const titlePrefix = String(settings?.titlePrefix ?? '').trim();
  const highlight = String(settings?.highlight ?? '').trim();
  const body = String(settings?.body ?? '').trim();
  const countUp = toBoolean(settings?.countUp ?? true);

  if (!titlePrefix && !highlight && !body && !action && !stats.length) {
    return null;
  }

  return {
    titlePrefix,
    highlight,
    body,
    action,
    stats,
    countUp,
  };
}

export function buildDynamicCtaBandFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'cta_band' && kind !== '' && block?.type !== 'cta_band') {
    return null;
  }
  if (kind === 'cta_band' && mode !== 'dynamic' && block?.type !== 'cta_band') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const runtime = buildSingleActionPromoRuntime({
    ...block,
    ...settings,
  }, {
    includeBgTone: true,
    bgToneDefault: 'blue',
  });

  if (!runtime) {
    return null;
  }

  return {
    presetId: resolveCtaBandPresetId(block),
    ...runtime,
  };
}

export function buildDynamicCalculatorCtaFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'calculator_cta' && kind !== '' && block?.type !== 'calculator_cta') {
    return null;
  }
  if (kind === 'calculator_cta' && mode !== 'dynamic' && block?.type !== 'calculator_cta') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const runtime = {
    title: String(settings?.title ?? block?.title ?? '').trim(),
    subtitle: String(settings?.subtitle ?? block?.subtitle ?? '').trim(),
    body: String(settings?.body ?? block?.body ?? '').trim(),
    howItWorksTitle: String(settings?.howItWorksTitle ?? block?.howItWorksTitle ?? '').trim(),
    step1: String(settings?.step1 ?? block?.step1 ?? '').trim(),
    step2: String(settings?.step2 ?? block?.step2 ?? '').trim(),
    step3: String(settings?.step3 ?? block?.step3 ?? '').trim(),
    totalInvestmentLabel: String(settings?.totalInvestmentLabel ?? block?.totalInvestmentLabel ?? '').trim(),
    ladderYearsLabel: String(settings?.ladderYearsLabel ?? block?.ladderYearsLabel ?? '').trim(),
    ladderYearsHelper: String(settings?.ladderYearsHelper ?? block?.ladderYearsHelper ?? '').trim(),
    maturityLabel: String(settings?.maturityLabel ?? block?.maturityLabel ?? '').trim(),
    reinvestOptionLabel: String(settings?.reinvestOptionLabel ?? block?.reinvestOptionLabel ?? '').trim(),
    cashOutOptionLabel: String(settings?.cashOutOptionLabel ?? block?.cashOutOptionLabel ?? '').trim(),
    visualizeYearsLabel: String(settings?.visualizeYearsLabel ?? block?.visualizeYearsLabel ?? '').trim(),
    visualizeYearsHelper: String(settings?.visualizeYearsHelper ?? block?.visualizeYearsHelper ?? '').trim(),
    calculateLabel: String(settings?.calculateLabel ?? block?.calculateLabel ?? '').trim(),
    note: String(settings?.note ?? block?.note ?? '').trim(),
    disclaimer: String(settings?.disclaimer ?? block?.disclaimer ?? '').trim(),
    customRatesNote: String(settings?.customRatesNote ?? block?.customRatesNote ?? '').trim(),
    resultsTitle: String(settings?.resultsTitle ?? block?.resultsTitle ?? '').trim(),
    downloadTitle: String(settings?.downloadTitle ?? block?.downloadTitle ?? '').trim(),
    downloadBody: String(settings?.downloadBody ?? block?.downloadBody ?? '').trim(),
    downloadButtonLabel: String(settings?.downloadButtonLabel ?? block?.downloadButtonLabel ?? '').trim(),
    discussTitle: String(settings?.discussTitle ?? block?.discussTitle ?? '').trim(),
    discussBody: String(settings?.discussBody ?? block?.discussBody ?? '').trim(),
    discussButtonLabel: String(settings?.discussButtonLabel ?? block?.discussButtonLabel ?? '').trim(),
  };

  if (!Object.values(runtime).some(Boolean)) {
    return null;
  }

  return runtime;
}

function normalizeHtmlContent(value) {
  const html = String(value || '').trim();
  return (!html || html === '<p></p>' || html === '<p><br></p>') ? '' : html;
}

function normalizeBillboardScrollReveal(value) {
  const token = String(value || '').trim().toLowerCase();
  return token === 'scale-up' ? 'scale-up' : 'none';
}

function resolveCtaFormSource(block) {
  if (!block || typeof block !== 'object') {
    return null;
  }
  const kind = String(block.kind || block.type || '').trim();
  const mode = String(block.mode || '').trim();
  if (kind !== 'cta_form') {
    return null;
  }
  if (mode && mode !== 'dynamic') {
    return null;
  }
  return block.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
}

function resolveCtaFormSetting(primarySource, fallbackSource, key) {
  if (primarySource && Object.prototype.hasOwnProperty.call(primarySource, key)) {
    const primaryValue = primarySource[key];
    if (typeof primaryValue === 'string') {
      return primaryValue.trim();
    }
    return primaryValue;
  }

  const fallbackValue = fallbackSource?.[key];
  if (typeof fallbackValue === 'string') {
    return fallbackValue.trim();
  }
  return fallbackValue;
}

const REQUEST_FORM_PRESET_CLASS_BY_SECTION_CLASS = Object.freeze({
  'certificate-request-native-section': 'certificate-request',
  'contact-us-request': 'contact',
  'group-life-native-quote': 'group-life-quote',
  'insurance-pc-native-quote': 'insurance-quote',
  'legacy-child-native-cga-request': 'legacy-cga',
  'legacy-child-native-endowments-legacy-form': 'legacy-endowment',
  'legacy-child-native-generosity-request': 'legacy-generosity',
  'legacy-child-native-trusts-request': 'legacy-trusts',
  'legacy-child-native-request': 'legacy-impact',
  'loans-consultant-native-contact': 'consultant-contact',
  'loans-native-inquiry': 'loans-inquiry',
  'retirement-rollovers-native-request': 'retirement-rollover',
});

function normalizeRequestFormPresetId(value, sectionClassName = '') {
  const explicitToken = String(value || '').trim().toLowerCase();
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(explicitToken)) {
    return explicitToken;
  }

  const sectionClasses = String(sectionClassName || '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const inferredPreset = sectionClasses
    .map((className) => REQUEST_FORM_PRESET_CLASS_BY_SECTION_CLASS[className])
    .find(Boolean);

  return inferredPreset || 'default';
}

function insertCtaContactPreferenceField(fields) {
  const baseFields = Array.isArray(fields) ? fields.filter(Boolean) : [];
  if (baseFields.some((field) => field?.id === 'contact_preference')) {
    return baseFields;
  }

  const insertAfterIndex = baseFields.reduce((lastMatch, field, index) => {
    const type = String(field?.type || '').trim().toLowerCase();
    const id = String(field?.id || '').trim().toLowerCase();
    const label = String(field?.label || '').trim().toLowerCase();
    if (
      type === 'email'
      || type === 'tel'
      || id.includes('name')
      || id.includes('email')
      || id.includes('phone')
      || label.includes('name')
      || label.includes('email')
      || label.includes('phone')
    ) {
      return index;
    }
    return lastMatch;
  }, -1);

  const contactPreferenceField = createCtaContactPreferenceField();
  if (insertAfterIndex < 0) {
    return [...baseFields, contactPreferenceField];
  }
  return [
    ...baseFields.slice(0, insertAfterIndex + 1),
    contactPreferenceField,
    ...baseFields.slice(insertAfterIndex + 1),
  ];
}

const PLANNED_GIVING_CTA_FINEPRINT = '* fields required';
const PLANNED_GIVING_UNSURE_OPTION = Object.freeze({ value: 'not-sure', label: "I'm not sure." });
const PLANNED_GIVING_CONTACT_PREFERENCE_FIELD = Object.freeze({
  id: 'contact_preference',
  label: 'Contact preference',
  type: 'select',
  required: false,
  placeholder: 'Select one',
  options: Object.freeze([
    Object.freeze({ value: 'phone', label: 'Phone' }),
    Object.freeze({ value: 'email', label: 'Email' }),
  ]),
  optionsText: 'phone|Phone\nemail|Email',
});

function isPlannedGivingCtaSource(source = {}) {
  const sectionClassName = String(source?.sectionClassName || '').trim();
  return sectionClassName.split(/\s+/).includes('legacy-giving-cta');
}

function withRequiredAsterisk(label, fallbackLabel) {
  const source = String(label || fallbackLabel || '').trim();
  if (!source) {
    return '';
  }
  return source.includes('*') ? source : `${source}*`;
}

function isPlannedGivingContactPreferenceField(field) {
  const fieldId = String(field?.id || '').trim().toLowerCase();
  const fieldLabel = String(field?.label || '').trim().toLowerCase();
  return fieldId === 'contact_preference'
    || fieldId === 'contactpreference'
    || fieldLabel.includes('contact preference')
    || fieldLabel.includes('preferred contact');
}

function normalizePlannedGivingCtaFields(fields, source = {}) {
  if (!isPlannedGivingCtaSource(source)) {
    return fields;
  }

  let changed = false;
  let hasContactPreference = false;
  const nextFields = (Array.isArray(fields) ? fields : []).map((field) => {
    const fieldId = String(field?.id || '').trim().toLowerCase();
    const fieldLabel = String(field?.label || '').trim().toLowerCase();
    const fieldPatch = {};
    if (fieldId === 'name' || fieldLabel.replace(/\*/g, '').trim() === 'name') {
      const nextLabel = withRequiredAsterisk(field?.label, 'Name');
      if (field?.label !== nextLabel) {
        fieldPatch.label = nextLabel;
      }
      if (field?.required !== true) {
        fieldPatch.required = true;
      }
    }
    if (field?.type === 'tel' || fieldId === 'phone' || fieldLabel.replace(/\*/g, '').trim() === 'phone') {
      const nextLabel = withRequiredAsterisk(field?.label, 'Phone');
      if (field?.label !== nextLabel) {
        fieldPatch.label = nextLabel;
      }
      if (field?.required !== true) {
        fieldPatch.required = true;
      }
    }
    if (field?.type === 'email' || fieldId === 'email' || fieldLabel.replace(/\*/g, '').trim() === 'email') {
      const nextLabel = withRequiredAsterisk(field?.label, 'Email');
      if (field?.label !== nextLabel) {
        fieldPatch.label = nextLabel;
      }
      if (field?.required !== true) {
        fieldPatch.required = true;
      }
    }

    if (isPlannedGivingContactPreferenceField(field)) {
      hasContactPreference = true;
      const nextField = {
        ...field,
        ...PLANNED_GIVING_CONTACT_PREFERENCE_FIELD,
        options: PLANNED_GIVING_CONTACT_PREFERENCE_FIELD.options.map((option) => ({ ...option })),
      };
      if (JSON.stringify(nextField) !== JSON.stringify(field)) {
        changed = true;
      }
      return nextField;
    }

    if (
      field?.type === 'select'
      && (fieldId === 'legacyproduct' || fieldLabel.includes('planned giving product'))
    ) {
      const options = Array.isArray(field.options) ? field.options : [];
      if (!options.some((option) => (
        option?.value === PLANNED_GIVING_UNSURE_OPTION.value
        || option?.label === PLANNED_GIVING_UNSURE_OPTION.label
      ))) {
        fieldPatch.options = [...options, PLANNED_GIVING_UNSURE_OPTION];
      }
    }

    if (!Object.keys(fieldPatch).length) {
      return field;
    }

    changed = true;
    return { ...field, ...fieldPatch };
  });

  if (!hasContactPreference) {
    const insertAfterIndex = nextFields.reduce((lastMatch, field, index) => {
      const fieldId = String(field?.id || '').trim().toLowerCase();
      const fieldLabel = String(field?.label || '').trim().toLowerCase();
      return fieldId === 'phone' || fieldLabel.replace(/\*/g, '').trim() === 'phone' ? index : lastMatch;
    }, -1);
    const contactField = {
      ...PLANNED_GIVING_CONTACT_PREFERENCE_FIELD,
      options: PLANNED_GIVING_CONTACT_PREFERENCE_FIELD.options.map((option) => ({ ...option })),
    };
    changed = true;
    if (insertAfterIndex < 0) {
      nextFields.push(contactField);
    } else {
      nextFields.splice(insertAfterIndex + 1, 0, contactField);
    }
  }

  return changed ? nextFields : fields;
}

function buildDynamicCtaFieldsFromSource(primarySource, fallbackSource = null) {
  const baseFields = extractCtaFormFields(primarySource, fallbackSource, {
    allowSlotCompatibility: false,
    preferFallbackSourceBeforeSlotCompatibility: true,
  }).map((field) => ({
    id: String(field.id || '').trim(),
    label: String(field.label || '').trim(),
    type: String(field.type || 'text').trim().toLowerCase() || 'text',
    placeholder: String(field.placeholder || '').trim(),
    required: toBoolean(field.required),
    options: Array.isArray(field.options) ? field.options : [],
  }));
  const includeContactPreference = toBoolean(
    resolveCtaFormSetting(primarySource, fallbackSource, 'includeContactPreference'),
  );
  const variantFields = normalizePlannedGivingCtaFields(baseFields, primarySource);

  return includeContactPreference
    ? insertCtaContactPreferenceField(variantFields)
    : variantFields;
}

const CTA_DISPLAY_MODE_SET = new Set(['default', 'inline_reveal']);
const CTA_TRIGGER_MODE_SET = new Set(['default', 'external']);

export function normalizeDynamicCtaDisplayMode(value) {
  const token = String(value || '').trim().toLowerCase();
  return CTA_DISPLAY_MODE_SET.has(token) ? token : 'default';
}

export function normalizeDynamicCtaTriggerMode(value) {
  const token = String(value || '').trim().toLowerCase();
  return CTA_TRIGGER_MODE_SET.has(token) ? token : 'default';
}

export function buildDynamicCtaPresentationClassName(source = {}) {
  const displayMode = normalizeDynamicCtaDisplayMode(source?.displayMode);
  const triggerMode = normalizeDynamicCtaTriggerMode(source?.triggerMode);
  const classNames = [];

  if (displayMode === 'inline_reveal') {
    classNames.push('is-display-inline-reveal');
  }
  if (triggerMode === 'external') {
    classNames.push('is-trigger-external');
  }
  if (displayMode === 'inline_reveal' && triggerMode === 'external') {
    classNames.push('is-external-inline-reveal');
  }

  return classNames.join(' ');
}

export function buildDynamicCtaFormFromBlock(block, { fallbackSettings = null, fallbackFields = [] } = {}) {
  const settings = resolveCtaFormSource(block);
  if (!settings) {
    return null;
  }

  const title = String(resolveCtaFormSetting(settings, fallbackSettings, 'title') || '').trim();
  const titleClassName = normalizeHighlightClassName(resolveCtaFormSetting(settings, fallbackSettings, 'titleClassName') || '');
  const titleHighlights = parseTextHighlights(
    resolveCtaFormSetting(settings, fallbackSettings, 'titleHighlightsJson') || '',
  );
  const bodyHtml = normalizeHtmlContent(resolveCtaFormSetting(settings, fallbackSettings, 'bodyHtml'));
  const fineprint = String(resolveCtaFormSetting(settings, fallbackSettings, 'fineprint') || '').trim()
    || (isPlannedGivingCtaSource(settings) ? PLANNED_GIVING_CTA_FINEPRINT : '');
  const subtitle = String(resolveCtaFormSetting(settings, fallbackSettings, 'subtitle') || '').trim();
  const bgTone = normalizePanelBgTone(resolveCtaFormSetting(settings, fallbackSettings, 'bgTone') || 'white', 'white');
  const submissionSource = {
    submitLabel: resolveCtaFormSetting(settings, fallbackSettings, 'submitLabel'),
    successMessage: resolveCtaFormSetting(settings, fallbackSettings, 'successMessage'),
    salesforceUrl: resolveCtaFormSetting(settings, fallbackSettings, 'salesforceUrl'),
  };
  const { submitLabel, successMessage, salesforceUrl } = normalizeFormSubmissionConfig(submissionSource, {
    submitLabel: 'Follow up with me',
    successMessage: 'Thanks. We will reach out soon.',
  });
  const submitStyle = normalizeActionButtonStyle(resolveCtaFormSetting(settings, fallbackSettings, 'submitStyle'));
  const submitTone = normalizeActionButtonTone(
    resolveCtaFormSetting(settings, fallbackSettings, 'submitTone'),
    submitStyle === 'dark' ? 'super-grey' : 'atlantean',
  );
  const configuredFields = buildDynamicCtaFieldsFromSource(settings, fallbackSettings);
  const fields = configuredFields.length
    ? configuredFields
    : (Array.isArray(fallbackFields) ? fallbackFields : []).filter(Boolean);
  const displayMode = normalizeDynamicCtaDisplayMode(
    resolveCtaFormSetting(settings, fallbackSettings, 'displayMode'),
  );
  const triggerMode = normalizeDynamicCtaTriggerMode(
    resolveCtaFormSetting(settings, fallbackSettings, 'triggerMode'),
  );

  if (!title && !bodyHtml && !fields.length) {
    return null;
  }

  return {
    id: String(block?.id || 'cta_form').trim() || 'cta_form',
    title,
    titleClassName,
    titleHighlights,
    anchorId: String(settings.anchorId || '').trim(),
    sectionClassName: sanitizeClassName(settings.sectionClassName || ''),
    displayMode,
    triggerMode,
    bodyHtml,
    fineprint,
    subtitle,
    bgTone,
    submitLabel,
    successMessage,
    salesforceUrl,
    submitStyle,
    submitTone,
    fields,
  };
}

function resolveRequestFormSource(block) {
  if (!block || typeof block !== 'object') {
    return null;
  }
  const kind = String(block.kind || block.type || '').trim();
  const mode = String(block.mode || '').trim();
  if (kind !== 'request_form') {
    return null;
  }
  if (mode && mode !== 'dynamic') {
    return null;
  }
  return block.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
}

function parseRequestFormStepFieldsJson(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((field) => {
        const type = normalizeRequestFormFieldType(field?.type);
        return {
          id: String(field?.id || '').trim(),
          label: String(field?.label || '').trim(),
          type,
          required: Boolean(field?.required),
          placeholder: String(field?.placeholder || '').trim(),
          rows: Number(field?.rows) || undefined,
          full: Boolean(field?.full),
          help: String(field?.help || '').trim(),
          format: String(field?.format || '').trim(),
          maxLength: Number(field?.maxLength) || undefined,
          errorMessage: String(field?.errorMessage || '').trim(),
          options: Array.isArray(field?.options) ? field.options : undefined,
        };
      })
      .filter((field) => field.id && field.label);
  } catch {
    return [];
  }
}

export function buildDynamicRequestFormFromBlock(block) {
  const normalizedBlock = normalizeBlockForRender(block);
  const rawSettings = resolveRequestFormSource(normalizedBlock);
  if (!rawSettings) {
    return null;
  }

  const baseSectionClassName = sanitizeClassName(rawSettings.sectionClassName || '');
  const presetId = normalizeRequestFormPresetId(
    rawSettings.presetId || rawSettings.requestFormPresetId,
    baseSectionClassName,
  );
  const settings = rawSettings;
  const title = String(settings.title || '').trim();
  const titleClassName = normalizeHighlightClassName(settings.titleClassName || '');
  const titleHighlightsJson = String(settings.titleHighlightsJson || '').trim();
  const subtitle = String(settings.subtitle || '').trim();
  const bodyHtml = normalizeHtmlContent(settings.bodyHtml);
  const body = String(settings.body || '').trim();
  const bgTone = normalizePanelBgTone(settings.bgTone || 'sand', 'sand');
  const textTone = normalizePanelTextTone(settings.textTone || 'dark', 'dark');
  const spaceBeforeRem = normalizePageContentSpaceRem(settings.spaceBeforeRem, 0, 0, 8);
  const spaceAfterRem = normalizePageContentSpaceRem(settings.spaceAfterRem, 0, 0, 8);
  const hideStepTitles = toBoolean(settings.hideStepTitles);
  const { submitLabel, successMessage, salesforceUrl } = normalizeFormSubmissionConfig(settings, {
    submitLabel: 'Submit request',
    successMessage: 'Thanks. We received your request.',
  });
  const steps = [1, 2, 3, 4, 5]
    .map((slot) => ({
      id: `step${slot}`,
      title: String(settings[`step${slot}Title`] || '').trim(),
      note: String(settings[`step${slot}Note`] || '').trim(),
      alert: String(settings[`step${slot}Alert`] || '').trim(),
      nextLabel: String(settings[`step${slot}NextLabel`] || '').trim(),
      backLabel: String(settings[`step${slot}BackLabel`] || '').trim(),
      fields: parseRequestFormStepFieldsJson(settings[`step${slot}FieldsJson`]),
    }))
    .filter((step) => Array.isArray(step.fields) && step.fields.length);

  if (!steps.length && !title && !subtitle && !bodyHtml && !body) {
    return null;
  }

  const sectionClassName = Array.from(new Set([
    baseSectionClassName,
    'native-dynamic-request',
    `is-request-form-preset-${presetId}`,
    `is-bg-${bgTone}`,
    `is-text-${textTone}`,
  ].filter(Boolean))).join(' ');

  return {
    id: String(block?.id || 'request_form').trim() || 'request_form',
    title,
    titleClassName,
    titleHighlightsJson,
    anchorId: String(settings.anchorId || '').trim(),
    subtitle,
    bodyHtml,
    body,
    presetId,
    bgTone,
    textTone,
    spaceBeforeRem,
    spaceAfterRem,
    hideStepTitles,
    submitLabel,
    successMessage,
    salesforceUrl,
    steps,
    sectionClassName,
    sectionStyle: {
      '--dynamic-request-space-before': `${spaceBeforeRem}rem`,
      '--dynamic-request-space-after': `${spaceAfterRem}rem`,
    },
    formClassName: sanitizeClassName(settings.formClassName || ''),
    transitionalAdapter: 'step-fields-json',
  };
}

function replaceTemplateTokens(html, replacements = {}) {
  return String(html || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, token) => {
    if (!Object.prototype.hasOwnProperty.call(replacements, token)) {
      return match;
    }
    return escapeHtml(replacements[token]);
  });
}

export function buildDynamicLegalCopyFromBlock(block, context = {}) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'legal_copy' && kind !== '' && block?.type !== 'legal_copy') {
    return null;
  }
  if (kind === 'legal_copy' && mode !== 'dynamic' && block?.type !== 'legal_copy') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;
  const replacements = {
    certificatesEffectiveDate: String(context?.certificatesEffectiveDate || 'January 1, 2026').trim() || 'January 1, 2026',
    iraEffectiveDate: String(context?.iraEffectiveDate || 'January 1, 2026').trim() || 'January 1, 2026',
  };
  const certificatesHtml = replaceTemplateTokens(
    normalizeHtmlContent(settings?.certificatesHtml ?? block?.certificatesHtml ?? DEFAULT_RATES_LEGAL_COPY_SETTINGS.certificatesHtml),
    replacements,
  );
  const iraHtml = replaceTemplateTokens(
    normalizeHtmlContent(settings?.iraHtml ?? block?.iraHtml ?? DEFAULT_RATES_LEGAL_COPY_SETTINGS.iraHtml),
    replacements,
  );

  if (!certificatesHtml && !iraHtml) {
    return null;
  }

  return {
    certificatesHtml,
    iraHtml,
  };
}

export function buildDynamicTopStripFromBlock(block) {
  const kind = String(block?.kind || block?.type || '').trim();
  const mode = String(block?.mode || 'dynamic').trim();
  if (kind !== 'top_strip' || mode !== 'dynamic') {
    return null;
  }

  const settings = block?.settings && typeof block.settings === 'object'
    ? block.settings
    : block;

  const loginHref = String(settings?.loginHref || '').trim() || '#';
  const ratesPath = String(settings?.ratesPath || '').trim() || '/rates';

  return {
    bgTone: normalizeTopStripBgTone(settings?.bgTone, 'grey'),
    textTone: normalizeTopStripTextTone(settings?.textTone, 'white'),
    loginTone: normalizeTopStripButtonTone(settings?.loginButtonTone, 'atlantean'),
    loginStyle: normalizeTopStripButtonStyle(settings?.loginButtonStyle, 'solid'),
    ratesTone: normalizeTopStripButtonTone(settings?.ratesButtonTone, 'mango'),
    ratesStyle: normalizeTopStripRatesStyle(settings?.ratesButtonStyle, 'link'),
    sectionFontSizeRem: normalizePositiveRem(settings?.sectionFontSizeRem, 0.95),
    itemGapRem: normalizePositiveRem(settings?.itemGapRem, 0.95),
    showLogin: toBoolean(settings?.showLogin ?? true),
    showPhone: toBoolean(settings?.showPhone ?? true),
    showRates: toBoolean(settings?.showRates ?? true),
    loginLabel: String(settings?.loginLabel || '').trim() || 'Secure Login',
    loginHref,
    loginOpenInNewWindow: toBoolean(settings?.loginOpenInNewWindow ?? true),
    phone: String(settings?.phone || '').trim(),
    phoneHref: `tel:${String(settings?.phone || '').replace(/[^\d+]/g, '')}`,
    ratesLabel: String(settings?.ratesLabel || '').trim() || 'Ask about our rates!',
    ratesPath,
    ratesIsExternal: isExternalLinkHref(ratesPath),
    ratesOpenInNewWindow: toBoolean(settings?.ratesOpenInNewWindow),
  };
}

export function buildDynamicHeroPieFromBlock(block) {
  if (!block || block.mode !== 'dynamic' || block.kind !== 'hero_pie') {
    return null;
  }

  const settings = block.settings || {};
  const parsedSlices = parseHeroPieSlices(settings.slicesJson);
  const slices = parsedSlices.length
    ? parsedSlices
    : DEFAULT_SERVICE_HERO_PIE_SLICES.map((slice) => ({
      ...slice,
      links: slice.links.map((link) => ({ ...link })),
    }));
  const autoplay = toBoolean(settings.autoplay ?? true);
  const rawAutoplayMs = Number(settings.autoplayMs);
  const autoplayMs = Number.isFinite(rawAutoplayMs)
    ? Math.max(1200, Math.min(10000, Math.round(rawAutoplayMs)))
    : 2400;
  const cx = 540;
  const cy = 540;
  const radius = 430;
  const sliceAngle = (2 * Math.PI) / Math.max(1, slices.length);

  return {
    autoplay,
    autoplayMs,
    slices: slices.map((slice, index) => {
      const start = index * sliceAngle;
      const end = start + sliceAngle;
      return {
        ...slice,
        d: describeHeroPieWedgePath(cx, cy, radius, start, end),
      };
    }),
  };
}

export function buildDynamicRatesFromBlock(block) {
  if (!block || block.mode !== 'dynamic') {
    return null;
  }

  const kind = String(block.kind || '').trim();
  if (kind !== 'rates') {
    return null;
  }

  const blockId = String(block.id || '').trim();
  const isIra = blockId === 'ira_table';

  return {
    tableKey: isIra ? 'ira' : 'certificates',
    sectionKey: isIra ? 'ira' : 'certificates',
    label: isIra ? 'IRA table' : 'Certificates table',
    adminHref: '/admin/rates',
  };
}

export function buildDynamicGridFromBlock(block) {
  if (!block || block.mode !== 'dynamic' || block.kind !== 'card_grid') {
    return null;
  }

  const settings = block.settings || {};
  const presetId = resolveCardGridPresetId(block);
  const sectionClassName = sanitizeClassName(settings.sectionClassName || '');
  const presetToken = String(block?.presetId || settings.cardsPreset || '').trim().toLowerCase();
  const cardsPreset = presetToken === 'value-cards' || sectionClassName.split(/\s+/).includes('about-native-values')
    ? 'value-cards'
    : '';
  const title = String(settings.title || '').trim();
  const titleClassName = normalizeHighlightClassName(settings.titleClassName || '');
  const titleHighlights = parseTextHighlights(settings.titleHighlightsJson);
  const subtitle = String(settings.subtitle || '').trim();
  const body = String(settings.body || '').trim();
  const bodyHtmlSource = String(settings.bodyHtml || '').trim();
  const bodyHtml = (!bodyHtmlSource || bodyHtmlSource === '<p></p>' || bodyHtmlSource === '<p><br></p>')
    ? ''
    : bodyHtmlSource;
  const bgTone = normalizeGridBgTone(settings.bgTone || 'white');
  const contentWidth = normalizeDynamicGridWidth(settings.contentWidth);
  const columns = normalizeDynamicGridColumns(settings.columns);
  const fullBleed = toBoolean(settings.fullBleed);
  const sand = toBoolean(settings.sand);
  const consultantService = String(settings.consultantService || '').trim().toLowerCase();
  const locationFilter = toBoolean(settings.locationFilterEnabled)
    ? {
        type: 'state',
        label: String(settings.locationFilterLabel || '').trim(),
        ariaLabel: String(settings.locationFilterAriaLabel || '').trim(),
        placeholder: String(settings.locationFilterPlaceholder || '').trim(),
        requireSelection: toBoolean(settings.locationFilterRequireSelection),
        messageLayout: 'toggle',
        focusMessageCard: toBoolean(settings.locationFilterFocusMessageCard),
      }
    : null;
  const cardStyle = getGridSafeCardStyleForBg(settings.cardStyle, bgTone);
  const titleTone = getGridSafeToneForBg(settings.titleTone, bgTone, 'super-grey');
  const bodyTone = getGridSafeToneForBg(settings.bodyTone, bgTone, 'super-grey');
  const dividerTone = normalizeDynamicGridDividerTone(settings.dividerTone);
  const cardPaddingRem = normalizeDynamicGridCardPaddingRem(settings.cardPaddingRem);
  const cardTitleSizeRem = normalizeDynamicGridCardTitleSizeRem(settings.cardTitleSizeRem);
  const cardBodySizeRem = normalizeDynamicGridCardBodySizeRem(settings.cardBodySizeRem);
  const cardBodyLineHeight = normalizeDynamicGridCardBodyLineHeight(settings.cardBodyLineHeight);
  const showTitleDivider = !Object.prototype.hasOwnProperty.call(settings, 'showTitleDivider')
    ? true
    : toBoolean(settings.showTitleDivider);
  const resolvedCardClass = cardStyle === 'none' ? 'card-none' : cardStyle;
  const sectionAction = buildCanonicalActionLinkFromFields(settings, {
    labelKeys: ['buttonLabel'],
    linkJsonKeys: ['buttonLinkJson'],
    hrefKeys: [],
    toKeys: [],
    documentIdKeys: ['buttonDocumentId'],
    openInNewWindowKeys: [],
    styleKeys: ['buttonStyle'],
    toneKeys: ['buttonTone'],
  });

  const cards = Array.from({ length: 8 }, (_, index) => index + 1)
    .map((slot) => {
      const cardTitle = String(settings[`card${slot}Title`] || '').trim();
      const cardTitleClassName = normalizeHighlightClassName(settings[`card${slot}TitleClassName`] || '');
      const cardTitleHighlights = parseTextHighlights(settings[`card${slot}TitleHighlightsJson`]);
      const cardBody = String(settings[`card${slot}Body`] || '').trim();
      const cardClassName = sanitizeClassName(settings[`card${slot}ClassName`] || '');
      const cardIconKey = String(settings[`card${slot}IconKey`] || '').trim();
      const cardIconTone = sanitizeClassName(settings[`card${slot}IconTone`] || '');
      const cardPrimaryAction = buildCanonicalActionLinkFromFields({
        ...settings,
        [`__card${slot}PrimaryStyle`]: String(settings[`card${slot}ButtonStyle`] || 'blue').trim() || 'blue',
        [`__card${slot}PrimaryTone`]: String(settings[`card${slot}ButtonTone`] || 'atlantean').trim() || 'atlantean',
      }, {
        labelKeys: [`card${slot}ButtonLabel`],
        linkJsonKeys: [`card${slot}ButtonLinkJson`],
        hrefKeys: [],
        toKeys: [],
        documentIdKeys: [`card${slot}ButtonDocumentId`],
        openInNewWindowKeys: [],
        styleKeys: [`__card${slot}PrimaryStyle`],
        toneKeys: [`__card${slot}PrimaryTone`],
        classNameKeys: [`card${slot}ButtonClassName`],
      });
      const cardSecondaryAction = buildCanonicalActionLinkFromFields({
        ...settings,
        [`__card${slot}SecondaryStyle`]: String(settings[`card${slot}Button2Style`] || 'outline').trim() || 'outline',
        [`__card${slot}SecondaryTone`]: String(settings[`card${slot}Button2Tone`] || 'super-grey').trim() || 'super-grey',
      }, {
        labelKeys: [`card${slot}Button2Label`],
        linkJsonKeys: [`card${slot}Button2LinkJson`],
        hrefKeys: [],
        toKeys: [],
        documentIdKeys: [`card${slot}Button2DocumentId`],
        openInNewWindowKeys: [],
        styleKeys: [`__card${slot}SecondaryStyle`],
        toneKeys: [`__card${slot}SecondaryTone`],
        classNameKeys: [`card${slot}Button2ClassName`],
      });
      const cardDividerTone = normalizeDynamicGridCardDividerTone(settings[`card${slot}DividerTone`]);
      const cardList = parseCardGridListJson(settings[`card${slot}ListJson`]);
      const cardFineprint = parsePageContentTextLines(settings[`card${slot}Fineprint`]);
      const cardLinks = parseCardGridLinkItemsJson(settings[`card${slot}LinksJson`]);
      const cardAccordions = parseCardGridAccordionsJson(settings[`card${slot}AccordionsJson`]);
      const cardActions = [cardPrimaryAction, cardSecondaryAction].filter(Boolean);
      if (!cardTitle && !cardBody && !cardList.length && !cardFineprint.length && !cardActions.length && !cardLinks.length && !cardAccordions.length) {
        return null;
      }

      return {
        slot,
        title: cardTitle || `Card ${slot}`,
        titleClassName: cardTitleClassName,
        titleHighlights: cardTitleHighlights,
        body: cardBody,
        bodySegments: splitCertificateCardBody(cardBody),
        list: cardList,
        fineprint: cardFineprint.length ? cardFineprint : null,
        iconKey: cardIconKey,
        iconTone: cardIconTone,
        cardClass: [resolvedCardClass, cardClassName].filter(Boolean).join(' '),
        panelTone: String(settings[`card${slot}PanelTone`] || '').trim(),
        dividerTone: cardDividerTone || undefined,
        action: cardActions[0] || null,
        actions: cardActions,
        links: cardLinks,
        accordions: cardAccordions,
      };
    })
    .filter(Boolean);

  if (!title && !subtitle && !body && !bodyHtml && !cards.length && !consultantService && !sectionAction) {
    return null;
  }

  return {
    presetId,
    cardsPreset,
    title,
    titleClassName,
    titleHighlights,
    subtitle,
    body,
    bodyHtml,
    anchorId: String(settings.anchorId || '').trim(),
    bgTone,
    contentWidth,
    columns,
    sectionClassName,
    fullBleed,
    sand,
    consultantService,
    locationFilter,
    cardStyle,
    titleTone,
    bodyTone,
    dividerTone,
    showTitleDivider,
    cardPaddingRem,
    cardTitleSizeRem,
    cardBodySizeRem,
    cardBodyLineHeight,
    actions: sectionAction ? [sectionAction] : [],
    cards,
  };
}

export function buildDynamicNewsletterFromBlock(block) {
  if (!block || block.mode !== 'dynamic' || block.kind !== 'newsletter') {
    return null;
  }

  const settings = block.settings || {};
  const title = String(settings.title || '').trim();
  const titleClassName = normalizeHighlightClassName(settings.titleClassName || '');
  const titleHighlights = parseTextHighlights(settings.titleHighlightsJson);
  const bodyHtmlSource = String(settings.bodyHtml || '').trim();
  const bodyHtml = (!bodyHtmlSource || bodyHtmlSource === '<p></p>' || bodyHtmlSource === '<p><br></p>')
    ? ''
    : bodyHtmlSource;
  const bgTone = normalizePanelBgTone(settings.bgTone || 'grey', 'grey');
  const textTone = normalizePanelTextTone(
    settings.textTone,
    bgTone === 'white' || bgTone === 'sand' ? 'dark' : 'white',
  );
  const formId = String(settings.formId || '').trim();
  const accountId = String(settings.accountId || '').trim();
  const sourceId = String(settings.sourceId || '').trim();

  if (!title && !bodyHtml && !formId) {
    return null;
  }

  return {
    title,
    titleClassName,
    titleHighlights,
    bodyHtml,
    bgTone,
    textTone,
    formId,
    accountId,
    sourceId,
  };
}

export function buildDynamicTestimonialsFromBlock(block, { library = [] } = {}) {
  if (!block || block.mode !== 'dynamic' || block.kind !== 'testimonials') {
    return null;
  }

  const settings = block.settings || {};
  const defaultTag = String(settings.defaultTag || '').trim();
  const resolved = resolveTestimonialsBlockData({
    block,
    library,
    fallbackItems: [],
    fallbackFineprint: '',
    defaultTag,
  });

  if (!Array.isArray(resolved.items) || !resolved.items.length) {
    return null;
  }

  return {
    items: resolved.items.map((item) => ({
      id: item.id,
      quote: item.quote,
      author: item.author,
      authorTitle: item.authorTitle,
    })),
    fineprint: resolved.showFineprint ? resolved.fineprint : '',
    sectionClassName: sanitizeClassName(settings.sectionClassName || ''),
  };
}

export function buildDynamicPageContentFromBlock(block) {
  const kind = String(block?.kind || '').trim();
  if (!block || block.mode !== 'dynamic' || (kind !== 'content' && kind !== CALCULATOR_INTRO_KIND && kind !== CALCULATOR_WIDGET_KIND)) {
    return null;
  }

  const settings = block.settings || {};
  const title = String(settings.title || '').trim();
  const titleHtml = String(settings.titleHtml || '').trim();
  const titleClassName = normalizeHighlightClassName(settings.titleClassName || '');
  const titleHighlights = parseTextHighlights(settings.titleHighlightsJson);
  const pageContentHeadingLevelToken = String(settings.headingLevel || '').trim().toLowerCase();
  const subtitle = String(settings.subtitle || '').trim();
  const body = parsePageContentTextLines(settings.body);
  const html = String(settings.html || '').trim();
  const widget = String(settings.widget || '').trim();
  const logoImage = String(settings.logoImage || '').trim();
  const logoAlt = String(settings.logoAlt || '').trim();
  const logoText = String(settings.logoText || '').trim();
  const pricingEntries = parseMissionAssurePricingEntries(settings.pricingEntriesJson);
  const supportGroups = parsePageContentSupportGroups(settings.supportGroupsJson);
  const fullBleed = toBoolean(settings.fullBleed);
  const railClassName = sanitizeClassName(settings.railClassName || '');
  const justifyToken = String(settings.justify || 'center').trim().toLowerCase();
  const justify = justifyToken === 'left' || justifyToken === 'right' ? justifyToken : 'center';
  const tableHeaders = parsePageContentTableHeaders(settings.tableHeadersJson);
  const tableRows = parsePageContentTableRows(settings.tableRowsJson);
  const table = tableHeaders.length && tableRows.length
    ? {
      headers: tableHeaders,
      rows: tableRows,
      valueAlignment: String(settings.tableValueAlignment || '').trim() || undefined,
      firstColumnHeader: settings.tableFirstColumnHeader === undefined
        ? true
        : toBoolean(settings.tableFirstColumnHeader),
    }
    : null;
  const fineprint = parsePageContentTextLines(settings.fineprint);
  const action = buildCanonicalActionLinkFromFields(settings, {
    labelKeys: ['buttonLabel'],
    linkJsonKeys: ['buttonLinkJson'],
    hrefKeys: [],
    toKeys: [],
    documentIdKeys: ['buttonDocumentId'],
    styleKeys: ['buttonStyle'],
    toneKeys: ['buttonTone'],
    openInNewWindowKeys: [],
  });
  const addressTitle = String(settings.addressTitle || '').trim();
  const addressLines = String(settings.addressLines || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const addressClassName = sanitizeClassName(settings.addressClassName || '');
  const addressBlock = addressTitle || addressLines.length
    ? {
        className: addressClassName || undefined,
        title: addressTitle,
        lines: addressLines,
      }
    : null;

  const normalizedHtml = (!html || html === '<p></p>' || html === '<p><br></p>') ? '' : html;

  if (
    !title
    && !titleHtml
    && !subtitle
    && !body.length
    && !normalizedHtml
    && !widget
    && !logoImage
    && !logoText
    && !table
    && !supportGroups.length
    && !fineprint.length
    && !action
    && !addressBlock
  ) {
    return null;
  }

  return {
    title,
    titleHtml,
    titleClassName,
    titleHighlights,
    headingLevel: pageContentHeadingLevelToken === 'h1' ? 'h1' : 'h2',
    subtitle,
    body,
    html: normalizedHtml,
    widget,
    logoImage,
    logoAlt,
    logoText,
    ...(pricingEntries.length ? { pricing: { entries: pricingEntries } } : {}),
    table,
    tableChartId: String(settings.tableChartId || '').trim(),
    supportGroups,
    supportGroupsExpanded: toBoolean(settings.supportGroupsExpanded),
    supportGroupsCollapsible: settings.supportGroupsCollapsible === undefined
      ? true
      : toBoolean(settings.supportGroupsCollapsible),
    fineprint: fineprint.length ? fineprint : null,
    fineprintDisclosureId: String(settings.fineprintDisclosureId || '').trim(),
    fullBleed,
    railClassName,
    spaceBeforeRem: normalizePageContentSpaceRem(settings.spaceBeforeRem, 0, 0, 8),
    spaceAfterRem: normalizePageContentSpaceRem(settings.spaceAfterRem, 0, 0, 8),
    paddingTopRem: normalizePageContentSpaceRem(settings.paddingTopRem, 2.4, 0, 8),
    paddingBottomRem: normalizePageContentSpaceRem(settings.paddingBottomRem, 2.4, 0, 8),
    contentMaxWidthPx: normalizePageContentMaxWidthPx(settings.contentMaxWidthPx, 980),
    anchorId: String(settings.anchorId || '').trim(),
    sectionClassName: sanitizeClassName(settings.sectionClassName || ''),
    copyWrap: toBoolean(settings.copyWrap),
    justify,
    actions: action ? [action] : [],
    addressBlock,
  };
}

export function heroAnimationClassForLine(preset, lineNumber) {
  const token = String(preset || '').trim().toLowerCase();
  if (token === 'none') {
    return 'hero-anim-none';
  }
  if (token === 'loans-unblur') {
    if (lineNumber === 1) {
      return 'hero-anim-loans-unblur';
    }
    if (lineNumber === 2) {
      return 'hero-anim-loans-slide';
    }
    return 'hero-anim-loans-slide-followup';
  }
  return '';
}

export function buildDynamicHeroFromBlock(block) {
  if (!block || block.mode !== 'dynamic' || block.kind !== 'hero') {
    return null;
  }

  const settings = block.settings || {};
  const lines = [1, 2, 3]
    .map((lineNumber) => {
      const text = String(settings[`line${lineNumber}Text`] || '').trim();
      if (!text) {
        return null;
      }
      return {
        id: lineNumber,
        text,
        className: sanitizeClassName(settings[`line${lineNumber}ClassName`] || ''),
        highlights: resolveDynamicHeroLineHighlights(settings, lineNumber),
      };
    })
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const actions = [1, 2]
    .map((buttonNumber) => {
      const explicitAction = readFirstStringValue(settings, [`button${buttonNumber}Action`]);
      const targetAnchorId = readFirstStringValue(settings, [`button${buttonNumber}TargetAnchorId`]);
      const targetBlockId = readFirstStringValue(settings, [`button${buttonNumber}TargetBlockId`]);
      const linkedAction = buildCanonicalActionLinkFromFields(settings, {
        labelKeys: [`button${buttonNumber}Label`],
        linkJsonKeys: [`button${buttonNumber}LinkJson`],
        hrefKeys: [],
        toKeys: [],
        styleKeys: [`button${buttonNumber}Style`],
        toneKeys: [`button${buttonNumber}Tone`],
        openInNewWindowKeys: [],
      });

      if (linkedAction) {
        return linkedAction;
      }

      const label = readFirstStringValue(settings, [`button${buttonNumber}Label`]);
      if (!label || !explicitAction || (!targetAnchorId && !targetBlockId)) {
        return null;
      }

      return {
        label,
        action: explicitAction,
        targetAnchorId,
        targetBlockId,
        style: readFirstStringValue(settings, [`button${buttonNumber}Style`]),
        tone: readFirstStringValue(settings, [`button${buttonNumber}Tone`]),
        openInNewWindow: false,
      };
    })
    .filter(Boolean);

  const justifyToken = String(settings.justify || 'center').trim().toLowerCase();
  const justify = justifyToken === 'left' || justifyToken === 'right' ? justifyToken : 'center';
  const titleSizeRem = normalizeHeroTitleSizeRem(settings.titleSizeRem);
  const titleLetterSpacingEm = normalizeHeroTitleLetterSpacingEm(settings.titleLetterSpacingEm);
  const lineHeight = Number.isFinite(Number(settings.lineHeight)) ? Number(settings.lineHeight) : 0.9;
  const actionJustifyToken = String(settings.actionJustify || justify || 'center').trim().toLowerCase();
  const actionJustify = actionJustifyToken === 'left' || actionJustifyToken === 'right' ? actionJustifyToken : 'center';

  return {
    lines,
    animationPreset: String(settings.animationPreset || 'default').trim(),
    bgTone: String(settings.bgTone || 'white').trim(),
    justify,
    titleSizeRem,
    titleLetterSpacingEm,
    lineGap: 0,
    lineHeight,
    actions,
    actionJustify,
  };
}
