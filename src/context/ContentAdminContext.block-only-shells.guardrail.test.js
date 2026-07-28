import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BLOCK_ONLY_MANAGED_PAGE_PATHS } from '../lib/managedPageShells';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readSource(relativePath));
}

describe('ContentAdminContext block-only shell guardrail', () => {
  it('keeps native-section seeding out of the block-only admin contract', () => {
    const contextSource = readSource('./ContentAdminContext.jsx');
    const shellSource = readSource('../lib/managedPageShells.js');
    const retiredNativeSeedingNames = [
      'shouldSeedBlocksFromNativePageContent',
      'seedFromNativePageContent',
      'buildDynamicCtaDefaultBlocksForPath',
      'buildDynamicRequestDefaultBlocksForPath',
      'buildDynamicTestimonialsDefaultBlocksForPath',
      'normalizeDynamicRequestFormSettings',
      'findStaticRequestFormSection',
      'targetSectionKey',
      'targetFineprintSectionKey',
      'targetSectionClassName',
      'targetSectionIndex',
    ];

    retiredNativeSeedingNames.forEach((name) => {
      expect(contextSource, `${name} should not re-enter ContentAdminContext`).not.toContain(name);
      expect(shellSource, `${name} should not re-enter managedPageShells`).not.toContain(name);
    });

    expect(contextSource).toContain('isBlockOnlyManagedPagePath(path)');
    expect(contextSource).toContain('isBlocklessManagedPagePath(page.path)');
    expect(contextSource).toContain('isBlocklessManagedPagePath(path)');
    expect(contextSource).not.toContain('path === RETIREMENT_403B_INDIVIDUAL_ENROLLMENT_PATH\n        && isPageContentBlock(storedBlock)');
    expect(contextSource).not.toContain('path === RETIREMENT_403B_GROUP_ENROLLMENT_PATH\n        && isPageContentBlock(storedBlock)');
    expect(contextSource).not.toContain('path === RETIREMENT_403B_PATH\n        && isPageContentBlock(storedBlock)\n        && !isRetirement403bLoanDetailsBlock(storedBlock)');
  });

  it('keeps the native page renderer free of targeted-section replacement adapters', () => {
    const source = readSource('../components/NativeContentPage.jsx');
    const retiredAdapterNames = [
      'mappedSection',
      'targetedDynamic',
      'consumedDynamic',
      'targetSectionKey',
      'targetFineprintSectionKey',
      'getSectionTargetKeys',
      'allowTargetedDynamicSections',
    ];

    retiredAdapterNames.forEach((name) => {
      expect(source, `${name} should not re-enter NativeContentPage`).not.toContain(name);
    });

    expect(source).toContain('const dynamicSections = visibleBlocks.reduce');
    expect(source).toContain('isBlockOnlyManagedPagePath(activePath || templatePath)');
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

  it('keeps block-only snapshots free of static block placeholders', () => {
    [
      '../../dev-data/content-admin-shared.json',
      '../../dev-data/content-admin-seed-baseline.json',
    ].forEach((relativePath) => {
      const snapshot = readJson(relativePath);

      ['state', 'baseSnapshot', 'seedState'].forEach((rootKey) => {
        const blocksByPath = snapshot?.[rootKey]?.blocksByPath || {};

        Array.from(BLOCK_ONLY_MANAGED_PAGE_PATHS).forEach((pathname) => {
          const staticBlockIds = (blocksByPath[pathname] || [])
            .filter((block) => block?.mode === 'static')
            .map((block) => block?.id);

          expect(
            staticBlockIds,
            `${relativePath} ${rootKey} ${pathname} should not carry static block placeholders`,
          ).toEqual([]);
        });
      });
    });
  });

  it('keeps block-only snapshots free of target bridge fields', () => {
    const targetBridgeSettingKeys = [
      'targetSectionKey',
      'targetFineprintSectionKey',
      'targetSectionClassName',
      'targetSectionIndex',
    ];

    [
      '../../dev-data/content-admin-shared.json',
      '../../dev-data/content-admin-seed-baseline.json',
    ].forEach((relativePath) => {
      const snapshot = readJson(relativePath);

      ['state', 'baseSnapshot', 'seedState'].forEach((rootKey) => {
        const blocksByPath = snapshot?.[rootKey]?.blocksByPath || {};

        Array.from(BLOCK_ONLY_MANAGED_PAGE_PATHS).forEach((pathname) => {
          const blocksWithTargetFields = (blocksByPath[pathname] || [])
            .map((block) => ({
              id: block?.id,
              keys: targetBridgeSettingKeys.filter((key) => (
                Object.prototype.hasOwnProperty.call(block?.settings || {}, key)
              )),
            }))
            .filter((entry) => entry.keys.length);

          expect(
            blocksWithTargetFields,
            `${relativePath} ${rootKey} ${pathname} should not carry target bridge fields`,
          ).toEqual([]);
        });
      });
    });
  });

  it('keeps planned-giving saved snapshots on the flow-step How It Works block model', () => {
    const expectedBlocksByPath = {
      '/services/planned-giving/charitable-gift-annuities': {
        id: 'how_it_works',
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-cga-steps',
        icons: ['daf-step-1', 'cga-step-2', 'cga-step-3'],
      },
      '/services/planned-giving/ministry-impact-fund': {
        id: 'how_it_works',
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-ministry-impact-steps',
        icons: ['daf-step-1', 'mif-step-2', 'mif-step-3'],
      },
      '/services/planned-giving/generosity-fund': {
        id: 'how_it_works',
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-generosity-steps',
        icons: ['daf-step-1', 'daf-step-2', 'daf-step-3'],
      },
      '/services/planned-giving/charitable-trusts': {
        id: 'remainder_trust_how_it_works',
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-trusts-crt-steps',
        icons: ['daf-step-1', 'daf-step-3', 'crt-step-2'],
      },
      '/services/planned-giving/qualified-charitable-distribution': {
        id: 'how_it_works',
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-qcd-steps',
        icons: ['endowments-step-1', 'daf-step-3', 'qcd-step-3'],
      },
      '/services/planned-giving/endowments': {
        id: 'how_it_works',
        sectionClassName: 'legacy-child-native-flow-steps legacy-child-native-endowments-duo',
        icons: ['daf-step-1', 'mif-step-3', 'endowments-step-3'],
      },
    };

    [
      '../../dev-data/content-admin-shared.json',
      '../../dev-data/content-admin-seed-baseline.json',
    ].forEach((relativePath) => {
      const snapshot = readJson(relativePath);

      ['state', 'baseSnapshot', 'seedState'].forEach((rootKey) => {
        if (!snapshot?.[rootKey]) {
          return;
        }
        const blocksByPath = snapshot?.[rootKey]?.blocksByPath || {};

        Object.entries(expectedBlocksByPath).forEach(([pathname, expected]) => {
          const block = (blocksByPath[pathname] || []).find((candidate) => candidate?.id === expected.id);

          expect(block, `${relativePath} ${rootKey} ${pathname} should have ${expected.id}`).toMatchObject({
            kind: 'columns',
            mode: 'dynamic',
            settings: {
              columns: 'three',
              sectionClassName: expected.sectionClassName,
              col1Type: 'flow-step',
              col2Type: 'flow-step',
              col3Type: 'flow-step',
              col1IconKey: expected.icons[0],
              col2IconKey: expected.icons[1],
              col3IconKey: expected.icons[2],
            },
          });
        });
      });
    });
  });
});
