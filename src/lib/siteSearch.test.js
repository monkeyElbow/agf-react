import { describe, expect, it } from 'vitest';
import {
  buildSiteSearchIndex,
  groupSiteSearchMatches,
  normalizeSiteSearchText,
  searchSiteIndex,
} from './siteSearch';
import { pageByPath } from '../data/siteMap';

describe('site search helpers', () => {
  it('normalizes search text consistently', () => {
    expect(normalizeSiteSearchText('  Retirement Plans ')).toBe('retirement plans');
  });

  it('builds shared search items across pages, articles, and documents', () => {
    const items = buildSiteSearchIndex({
      articles: [{
        id: 'article-1',
        slug: 'church-cash-reserves',
        type: 'article',
        title: 'Church Cash Reserves',
        category: 'Resources',
        excerpt: 'How much is enough?',
        isPublished: true,
      }],
      documents: [{
        id: 'doc-1',
        title: 'Rates PDF',
        url: 'https://example.com/rates.pdf',
        category: 'rates',
        kind: 'pdf',
        active: true,
      }],
    });

    expect(items.some((item) => item.path === '/resources/article/church-cash-reserves')).toBe(true);
    expect(items.some((item) => item.href === 'https://example.com/rates.pdf')).toBe(true);
    expect(items.some((item) => item.path === '/services')).toBe(true);
  });

  it('respects explicit and fallback page search visibility flags', () => {
    const items = buildSiteSearchIndex();

    expect(pageByPath['/brand']?.hideFromSitemap).toBe(true);
    expect(pageByPath['/brand']?.hideFromSearch).toBe(true);
    expect(items.some((item) => item.path === '/brand')).toBe(false);
    expect(items.some((item) => item.path === '/vineyard')).toBe(false);
    expect(items.some((item) => item.path === '/services')).toBe(true);
  });

  it('uses shared scoring and groups results in canonical order', () => {
    const items = [
      { title: 'Rates', path: '/rates', section: 'Rates', excerpt: 'Current rates', group: 'page', resultType: 'page', key: 'page:rates' },
      { title: 'Rates PDF', path: '/rates', section: 'Rates Documents', excerpt: 'PDF document', group: 'document', resultType: 'document', key: 'doc:rates', href: 'https://example.com/rates.pdf' },
      { title: 'Rates outlook', path: '/resources/article/rates-outlook', section: 'Resources', excerpt: 'Resource article', group: 'article', resultType: 'article', key: 'article:rates' },
    ];

    const matches = searchSiteIndex(items, 'rates');
    const grouped = groupSiteSearchMatches(matches);

    expect(matches[0].title).toBe('Rates');
    expect(grouped.map((group) => group.group)).toEqual(['page', 'article', 'document']);
  });
});
