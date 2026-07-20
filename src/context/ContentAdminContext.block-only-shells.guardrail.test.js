import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('ContentAdminContext block-only shell guardrail', () => {
  it('keeps block-only page seeding behind the managed-page shell contract', () => {
    const source = readSource('./ContentAdminContext.jsx');

    expect(source).toContain('shouldSeedBlocksFromNativePageContent,');
    expect(source).toContain('const seedFromNativePageContent = shouldSeedBlocksFromNativePageContent(page.path);');
    expect(source).toContain('const nativeContent = seedFromNativePageContent');
    expect(source).toContain('? getNativePageContent(page.path, page.title)');
    expect(source).toContain('const dynamicCtaBlocks = seedFromNativePageContent');
    expect(source).toContain('const dynamicRequestBlocks = seedFromNativePageContent');
    expect(source).toContain('const dynamicTestimonialsBlocks = seedFromNativePageContent');
    expect(source).toContain("      && seedFromNativePageContent");
    expect(source).toContain('isBlockOnlyManagedPagePath(path)');
    expect(source).toContain('isBlocklessManagedPagePath(page.path)');
    expect(source).toContain('isBlocklessManagedPagePath(path)');
    expect(source).not.toContain('path === RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_PATH\n        && isPageContentBlock(storedBlock)');
    expect(source).not.toContain('path === RETIREMENT_403B_GROUP_ENROLLMENT_PATH\n        && isPageContentBlock(storedBlock)');
    expect(source).not.toContain('path === RETIREMENT_403B_PATH\n        && isPageContentBlock(storedBlock)\n        && !isRetirement403bLoanDetailsBlock(storedBlock)');
  });

  it('keeps managed non-fallback routes out of empty fallback page-content suppression', () => {
    const source = readSource('./ContentAdminContext.jsx');
    const suppressionSetSource = source.match(/const EMPTY_PAGE_CONTENT_SEED_DISABLED_PATHS = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';

    const escapedRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    [
      '/services/retirement/403b',
      '/services/retirement/403b/403b-group-enrollment',
      '/services/retirement/403b/403b-individual-enrollment',
      '/services/retirement/403b/403b-terms-definitions',
      '/online-contributions',
      '/services/retirement/409a',
      '/services/retirement/iras',
      '/services/retirement/iras/fund-an-ira',
      '/services/retirement/rollovers',
      '/services/retirement/retirement-consultants',
      '/resources',
      '/services/insurance',
      '/services/insurance/certificate-request',
      '/services/insurance/group-term-life-insurance',
      '/services/insurance/life-insurance-quote',
      '/services/insurance/ministers-group-life-plan',
      '/services/insurance/mission-assure',
      '/services/insurance/mission-assure/report-a-claim',
      '/services/insurance/property-casualty-insurance',
      '/accessibility',
      '/about-us',
      '/privacy-policy',
      '/subscribe',
      '/terms-of-service',
      '/vineyard',
      '/yourplan',
      '/about-us/careers',
      '/forms',
      '/prospectus',
      '/search',
      '/sitemap',
    ].forEach((pathname) => {
      expect(suppressionSetSource, `${pathname} should not rely on empty page-content suppression`).not.toMatch(
        new RegExp(`['"]${escapedRegExp(pathname)}['"]`),
      );
    });
  });
});
