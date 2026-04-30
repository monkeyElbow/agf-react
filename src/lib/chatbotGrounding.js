import siteNavigationEntries from '../data/site-navigation.json';
import { chatbotContentItems } from '../data/chatbotContent';

const DEFAULT_NAVIGATION_URLS = ['/contact-us', '/services'];
const DEFAULT_CONTENT_URLS = ['/contact-us', '/services'];
const NAVIGATION_INTENT_PATTERN = /\b(where can i find|where do i go|where is|show me|looking for|find\b|go to|which page)\b/i;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/403\s*\(\s*b\s*\)|403\s*b/g, '403b')
    .replace(/[^a-z0-9/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasPhrase(text, phrases) {
  return phrases.some((phrase) => text.includes(normalizeText(phrase)));
}

function scoreNavigationEntry(entry, normalizedPrompt) {
  let score = 0;
  let matched = false;
  const title = normalizeText(entry?.title);
  const url = normalizeText(entry?.url);
  const summary = normalizeText(entry?.summary);
  const keywords = Array.isArray(entry?.keywords) ? entry.keywords : [];
  const audience = normalizeText(entry?.audience);

  if (title && normalizedPrompt.includes(title)) {
    score += 12;
    matched = true;
  }

  if (url && normalizedPrompt.includes(url)) {
    score += 10;
    matched = true;
  }

  keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      return;
    }
    if (normalizedPrompt.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(' ') ? 8 : 5;
      matched = true;
    }
  });

  if (audience && normalizedPrompt.includes(audience)) {
    score += 3;
    matched = true;
  }

  if (summary && hasPhrase(normalizedPrompt, [summary])) {
    score += 4;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['contact', 'phone', 'email', 'hours', 'call']) && entry?.url === '/contact-us') {
    score += 15;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['rates', 'apy', 'certificate', 'ira rates']) && entry?.url === '/rates') {
    score += 15;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['403b', '403(b)', 'retirement plan']) && entry?.url === '/services/retirement/403b') {
    score += 12;
    matched = true;
  }

  if (
    normalizedPrompt.includes('403b')
    && normalizedPrompt.includes('individual')
    && entry?.url === '/services/retirement/403b/403b-individual-enrollment'
  ) {
    score += 30;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['403b individual', '403(b) individual', 'individual enrollment']) && entry?.url === '/services/retirement/403b/403b-individual-enrollment') {
    score += 24;
    matched = true;
  }

  if (
    normalizedPrompt.includes('403b')
    && normalizedPrompt.includes('employer')
    && entry?.url === '/online-contributions'
  ) {
    score += 18;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['online contributions', 'employer code', '403b employer']) && entry?.url === '/online-contributions') {
    score += 18;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['forms', 'form', 'documents']) && entry?.url === '/forms') {
    score += 10;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['prospectus', 'offering circular']) && entry?.url === '/prospectus') {
    score += 12;
    matched = true;
  }

  if (!matched) {
    return 0;
  }

  score += Number(entry?.priority || 0) / 10;
  return score;
}

function scoreContentEntry(entry, normalizedPrompt) {
  let score = 0;
  let matched = false;
  const title = normalizeText(entry?.title);
  const url = normalizeText(entry?.url);
  const content = normalizeText(entry?.content);
  const keywords = Array.isArray(entry?.keywords) ? entry.keywords : [];
  const audience = normalizeText(entry?.audience);

  if (title && normalizedPrompt.includes(title)) {
    score += 12;
    matched = true;
  }

  if (url && normalizedPrompt.includes(url)) {
    score += 8;
    matched = true;
  }

  keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      return;
    }
    if (normalizedPrompt.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(' ') ? 8 : 5;
      matched = true;
    }
  });

  if (audience && normalizedPrompt.includes(audience)) {
    score += 3;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['contact', 'phone', 'email', 'hours', 'call']) && entry?.url === '/contact-us') {
    score += 12;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['rates', 'apy', 'certificate', 'ira rates']) && entry?.url === '/rates') {
    score += 14;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['retirement', '403b', '403(b)', 'housing allowance']) && entry?.url === '/services/retirement/403b') {
    score += 12;
    matched = true;
  }

  if (
    normalizedPrompt.includes('403b')
    && normalizedPrompt.includes('employer')
    && entry?.url === '/online-contributions'
  ) {
    score += 14;
    matched = true;
  }

  if (hasPhrase(normalizedPrompt, ['employer code', 'online contributions', '403b employer']) && entry?.url === '/online-contributions') {
    score += 14;
    matched = true;
  }

  if (content && hasPhrase(normalizedPrompt, [content.slice(0, 120)])) {
    score += 3;
    matched = true;
  }

  if (!matched) {
    return 0;
  }

  return score;
}

function selectEntries(entries, scoreEntry, normalizedPrompt, { maxItems = 3, minimumScore = 1, fallbackUrls = [] } = {}) {
  const rankedEntries = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, normalizedPrompt) }))
    .filter(({ score }) => score >= minimumScore)
    .sort((left, right) => right.score - left.score);

  const selected = rankedEntries.slice(0, maxItems).map(({ entry }) => entry);
  if (selected.length > 0) {
    return selected;
  }

  return entries.filter((entry) => fallbackUrls.includes(entry?.url)).slice(0, maxItems);
}

function formatNavigationEntry(entry) {
  return [
    `- ${entry.title} — ${entry.url}`,
    `  Summary: ${entry.summary}`,
    `  Keywords: ${(entry.keywords || []).join(', ')}`,
    `  Audience: ${entry.audience || 'general'}`,
  ].join('\n');
}

function formatContentEntry(entry) {
  return [
    `- ${entry.title} — ${entry.url}`,
    `  Content: ${entry.content}`,
    `  Keywords: ${(entry.keywords || []).join(', ')}`,
  ].join('\n');
}

export function isLikelyNavigationQuestion(prompt) {
  return NAVIGATION_INTENT_PATTERN.test(String(prompt || ''));
}

export function selectSiteChatbotGrounding(prompt) {
  const normalizedPrompt = normalizeText(prompt);
  const navigationQuestion = isLikelyNavigationQuestion(prompt);

  const navigationEntries = selectEntries(
    siteNavigationEntries,
    scoreNavigationEntry,
    normalizedPrompt,
    {
      maxItems: navigationQuestion ? 4 : 3,
      minimumScore: navigationQuestion ? 6 : 4,
      fallbackUrls: DEFAULT_NAVIGATION_URLS,
    },
  );

  const contentEntries = selectEntries(
    chatbotContentItems,
    scoreContentEntry,
    normalizedPrompt,
    {
      maxItems: navigationQuestion ? 2 : 3,
      minimumScore: navigationQuestion ? 6 : 4,
      fallbackUrls: DEFAULT_CONTENT_URLS,
    },
  );

  const prioritizeUrl = (entries, preferredUrl) => {
    const preferredEntry = entries.find((entry) => entry?.url === preferredUrl);
    if (!preferredEntry) {
      return entries;
    }

    return [
      preferredEntry,
      ...entries.filter((entry) => entry?.url !== preferredUrl),
    ];
  };

  const prioritizedNavigationEntries = normalizedPrompt.includes('403b') && normalizedPrompt.includes('individual')
    ? prioritizeUrl(navigationEntries, '/services/retirement/403b/403b-individual-enrollment')
    : normalizedPrompt.includes('403b') && normalizedPrompt.includes('employer')
      ? prioritizeUrl(navigationEntries, '/online-contributions')
      : navigationEntries;

  return {
    navigationQuestion,
    navigationEntries: prioritizedNavigationEntries,
    contentEntries,
  };
}

export function buildSiteChatbotGroundingContext(prompt) {
  const grounding = selectSiteChatbotGrounding(prompt);
  const lines = [
    'Local AGFinancial grounding context:',
    'This is a temporary local prototype grounding layer and can later be replaced by retrieval or vector search.',
    `Question type: ${grounding.navigationQuestion ? 'navigation-first' : 'content-first'}`,
    '',
    'Site navigation data:',
    ...grounding.navigationEntries.map(formatNavigationEntry),
    '',
    'Approved content excerpts:',
    ...grounding.contentEntries.map(formatContentEntry),
  ];

  return lines.join('\n');
}

export function buildSiteChatbotFallbackReply(prompt) {
  const { navigationQuestion, navigationEntries, contentEntries } = selectSiteChatbotGrounding(prompt);
  const bestNavigationMatch = navigationEntries[0] || null;
  const secondNavigationMatch = navigationEntries[1] || null;
  const bestContentMatch = contentEntries[0] || null;

  if (navigationQuestion && bestNavigationMatch) {
    const lines = [
      `Best match: ${bestNavigationMatch.title} — ${bestNavigationMatch.url}`,
      `Why: ${bestNavigationMatch.summary}`,
    ];

    if (
      secondNavigationMatch
      && secondNavigationMatch.url !== bestNavigationMatch.url
      && !['/services', '/contact-us'].includes(secondNavigationMatch.url)
    ) {
      lines.push(`Second match: ${secondNavigationMatch.title} — ${secondNavigationMatch.url}`);
      lines.push(`Why: ${secondNavigationMatch.summary}`);
    }

    return lines.join('\n');
  }

  if (bestContentMatch) {
    return [
      `Answer: ${bestContentMatch.content}`,
      `Source page: ${bestContentMatch.title} — ${bestContentMatch.url}`,
    ].join('\n');
  }

  if (bestNavigationMatch) {
    return [
      'I do not have enough approved information to answer that directly.',
      `Best next page: ${bestNavigationMatch.title} — ${bestNavigationMatch.url}`,
      `Why: ${bestNavigationMatch.summary}`,
    ].join('\n');
  }

  return [
    'I do not have enough approved information to answer that directly.',
    'Best next page: Contact Us — /contact-us',
    'Why: The contact page is the safest next step when a page match is unclear.',
  ].join('\n');
}
