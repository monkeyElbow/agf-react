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

  it('expands AGF abbreviations into matching pages', () => {
    const items = buildSiteSearchIndex();

    expect(searchSiteIndex(items, 'CGA')[0]).toMatchObject({
      title: 'Charitable Gift Annuities',
      path: '/services/planned-giving/charitable-gift-annuities',
    });
    expect(searchSiteIndex(items, 'DAF')[0]).toMatchObject({
      title: 'Donor Advised Fund',
      path: '/services/planned-giving/donor-advised-fund',
    });
    expect(searchSiteIndex(items, 'QCD')[0]).toMatchObject({
      title: 'Qualified Charitable Distribution',
      path: '/services/planned-giving/qualified-charitable-distribution',
    });
    expect(searchSiteIndex(items, 'P&C')[0]).toMatchObject({
      title: 'Property & Casualty Insurance',
      path: '/services/insurance/property-casualty-insurance',
    });
    expect(searchSiteIndex(items, '403b')[0]).toMatchObject({
      title: '403(b)',
      path: '/services/retirement/403b',
    });
  });

  it('indexes block-owned page content and hidden search metadata', () => {
    const items = buildSiteSearchIndex({
      blocksByPath: {
        '/services/planned-giving/donor-advised-fund': [
          {
            id: 'intro',
            settings: {
              heading: 'Quiet stewardship portal',
              bodyHtml: '<p>Block-only phrase for a giving workflow.</p>',
              searchKeywords: ['user language phrase'],
              searchAliases: ['hidden-daf-term'],
            },
          },
        ],
      },
    });

    expect(searchSiteIndex(items, 'block-only phrase')[0]).toMatchObject({
      path: '/services/planned-giving/donor-advised-fund',
    });
    expect(searchSiteIndex(items, 'user language phrase')[0]).toMatchObject({
      path: '/services/planned-giving/donor-advised-fund',
    });
    expect(searchSiteIndex(items, 'hidden-daf-term')[0]).toMatchObject({
      path: '/services/planned-giving/donor-advised-fund',
    });
  });

  it('ranks exact alias and title matches above loose body matches', () => {
    const items = buildSiteSearchIndex({
      blocksByPath: {
        '/services/planned-giving/donor-advised-fund': [
          {
            id: 'overview',
            settings: {
              heading: 'Giving account',
              body: 'A Donor Advised Fund can simplify generosity.',
            },
          },
        ],
        '/services': [
          {
            id: 'body_match',
            settings: {
              body: 'This paragraph mentions donor advised fund as a loose reference.',
            },
          },
        ],
      },
    });

    const dafMatches = searchSiteIndex(items, 'DAF');
    expect(dafMatches[0]).toMatchObject({
      title: 'Donor Advised Fund',
      path: '/services/planned-giving/donor-advised-fund',
    });

    const titleMatches = searchSiteIndex(items, 'donor advised fund');
    expect(titleMatches[0]).toMatchObject({
      title: 'Donor Advised Fund',
      path: '/services/planned-giving/donor-advised-fund',
    });
  });

  it('uses lightweight fuzzy matching for common misspellings', () => {
    const items = buildSiteSearchIndex();

    expect(searchSiteIndex(items, 'charitible')[0]).toMatchObject({
      title: 'Charitable Gift Annuities',
    });
    expect(searchSiteIndex(items, 'retirment')[0]).toMatchObject({
      title: 'Retirement',
    });
    expect(searchSiteIndex(items, 'insurence')[0]).toMatchObject({
      title: 'Insurance',
    });
  });
});
