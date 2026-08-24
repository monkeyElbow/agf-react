import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function hasCssRuleContaining(source, selector, expectedText) {
  let searchFrom = 0;
  const needle = `${selector} {`;
  while (searchFrom < source.length) {
    const start = source.indexOf(needle, searchFrom);
    if (start < 0) {
      return false;
    }
    const end = source.indexOf('\n}', start);
    const rule = end >= 0 ? source.slice(start, end + 2) : '';
    if (rule.includes(expectedText)) {
      return true;
    }
    searchFrom = start + needle.length;
  }
  return false;
}

function readCssRuleListBlock(source, selector) {
  const start = source.lastIndexOf(selector);
  if (start < 0) {
    return '';
  }
  const end = source.indexOf('\n}', start);
  return end >= 0 ? source.slice(start, end + 2) : '';
}

describe('page article feature link guardrails', () => {
  it('keeps the investments cash reserves feature tied to the seeded article helper', () => {
    const source = readSource('./InvestmentsPage.jsx');

    expect(source).toContain("slug: 'church-cash-reserves'");
    expect(source).toContain('CHURCH_CASH_RESERVES_ARTICLE_FEATURE.to');
    expect(source).toContain('featurePanelRuntime.imageUrl');
  });

  it('keeps the loans tariffs feature tied to the seeded article helper', () => {
    const source = readSource('./LoansPage.jsx');

    expect(source).toContain("slug: 'tariffs-timing-truth-keep-building-through-the-chaos'");
    expect(source).toContain('LOANS_TARIFFS_ARTICLE_FEATURE.to');
    expect(source).toContain('LOANS_TARIFFS_ARTICLE_FEATURE.image');
  });

  it('keeps the retirement top-3 feature tied to the seeded article helper', () => {
    const source = readSource('./RetirementPage.jsx');

    expect(source).toContain("slug: 'top-3-investing-mistakes-to-avoid'");
    expect(source).toContain('RETIREMENT_TOP_3_ARTICLE_FEATURE.to');
    expect(source).toContain('RETIREMENT_TOP_3_ARTICLE_FEATURE.image');
  });

  it('keeps bottom article teaser copy vertically centered inside the full teaser height', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.service-native-article-teaser .service-native-dark-feature-inner,');
    expect(cssSource).toContain('min-height: clamp(340px, 52vh, 620px);');
    expect(cssSource).toContain('align-items: stretch;');
    expect(cssSource).toContain('.service-native-article-teaser .service-native-dark-feature-copy,');
    expect(cssSource).toContain('display: flex;');
    expect(cssSource).toContain('flex-direction: column;');
    expect(cssSource).toContain('justify-content: center;');
    expect(cssSource).toContain('align-self: stretch;');
  });

  it('keeps dynamic article feature panels vertically centering their copy, not just bottom teasers', () => {
    const cssSource = readSource('../styles/service-native.css');

    [
      '.native-info-page--insurance .insurance-native-fraud',
      '.native-info-page--legacy-giving .legacy-giving-opportunity',
      '.native-info-page--mission-assure .mission-assure-native-camp-safety',
    ].forEach((sectionSelector) => {
      expect(hasCssRuleContaining(cssSource, `${sectionSelector} .service-native-dark-feature-inner`, 'align-items: stretch;')).toBe(true);
      expect(hasCssRuleContaining(cssSource, `${sectionSelector} .service-native-dark-feature-media`, 'align-self: stretch;')).toBe(true);
      expect(hasCssRuleContaining(cssSource, `${sectionSelector} .service-native-dark-feature-copy`, 'align-content: center;')).toBe(true);
      expect(hasCssRuleContaining(cssSource, `${sectionSelector} .service-native-dark-feature-copy`, 'align-self: stretch;')).toBe(true);
    });
  });

  it('stacks article feature panels on mobile, including route-specific article sections', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('@media (max-width: 760px) {');
    [
      '.service-native-section:is(.service-native-article-teaser, .service-native-feature-panel)',
      '.native-info-page--insurance .insurance-native-fraud',
      '.native-info-page--legacy-giving .legacy-giving-opportunity',
      '.native-info-page--mission-assure .mission-assure-native-camp-safety',
    ].forEach((sectionSelector) => {
      expect(readCssRuleListBlock(cssSource, `${sectionSelector} .service-native-dark-feature-inner`)).toContain('grid-template-columns: minmax(0, 1fr);');
      expect(readCssRuleListBlock(cssSource, `${sectionSelector} .service-native-dark-feature-copy`)).toContain('min-height: auto;');
    });
  });
});
