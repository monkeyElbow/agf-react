import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildCanonicalBlockRuntime } from '../blocks/registry';
import { getBlockPresentationLockedFieldIds } from '../lib/blockPresentationContracts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sharedContent = JSON.parse(readFileSync(
  path.resolve(__dirname, '../../dev-data/content-admin-shared.json'),
  'utf8',
));

function collectBillboards(blocksByPath = {}) {
  return Object.entries(blocksByPath).flatMap(([pathname, blocks]) => (
    (Array.isArray(blocks) ? blocks : [])
      .filter((block) => block?.kind === 'billboard')
      .map((block) => ({ pathname, block }))
  ));
}

describe('Billboard content convergence guardrail', () => {
  it('keeps every active Billboard instance dynamic, identified, and buildable by the registered runtime', () => {
    const billboards = collectBillboards(sharedContent.state?.blocksByPath);
    const signatures = new Set();

    expect(billboards.length).toBeGreaterThan(0);

    billboards.forEach(({ pathname, block }) => {
      const id = String(block.id || '').trim();
      const signature = `${pathname}:${id}`;
      signatures.add(signature);

      expect(id, signature).not.toBe('');
      expect(block.mode, signature).toBe('dynamic');
      expect(buildCanonicalBlockRuntime(block), signature).not.toBeNull();
    });

    expect(signatures.size).toBe(billboards.length);
  });

  it('proves the canonical runtime owns the settings that previously drifted in custom routes', () => {
    const billboards = collectBillboards(sharedContent.state?.blocksByPath);

    billboards.forEach(({ pathname, block }) => {
      const runtime = buildCanonicalBlockRuntime({
        ...block,
        settings: {
          ...(block.settings || {}),
          justify: 'left',
          bodyJustify: 'right',
          titleSizeRem: 3.1,
          titleTrackingEm: -0.01,
          titleFontWeight: 600,
          leadCopySizeRem: 1.25,
          leadCopyLineHeight: 1.2,
          actionGapRem: 2.4,
        },
      });

      const lockedFieldIds = getBlockPresentationLockedFieldIds(block);
      expect(runtime, `${pathname}:${block.id}`).toMatchObject({
        leadCopySizeRem: 1.25,
        leadCopyLineHeight: 1.2,
        actionGapRem: 2.4,
      });
      if (!lockedFieldIds.has('justify')) {
        expect(runtime?.justify, `${pathname}:${block.id}`).toBe('left');
      }
      expect(runtime?.bodyJustify, `${pathname}:${block.id}`).toBe('right');
      expect(runtime?.titleStyle?.letterSpacing, `${pathname}:${block.id}`).toBe('-0.01em');
      if (!lockedFieldIds.has('titleSizeRem')) {
        expect(runtime?.titleStyle?.fontSize, `${pathname}:${block.id}`).toContain('3.1rem');
      }
    });
  });

  it('keeps custom route owners on the shared Billboard renderer', () => {
    const servicesSource = readFileSync(path.resolve(__dirname, '../pages/ServicesPage.jsx'), 'utf8');
    const loansSource = readFileSync(path.resolve(__dirname, '../pages/LoansPage.jsx'), 'utf8');
    const retirementSource = readFileSync(path.resolve(__dirname, '../pages/RetirementPage.jsx'), 'utf8');
    const nativeSource = readFileSync(path.resolve(__dirname, '../components/NativeContentPage.jsx'), 'utf8');

    [servicesSource, loansSource, retirementSource, nativeSource].forEach((source) => {
      expect(source).toContain('BillboardBlock');
    });
    expect(servicesSource).toContain('block={billboardIntroBlock}');
    expect(servicesSource).toContain('block={servicesMattersBlock}');
    expect(retirementSource).toContain('block={columnsMathBlock}');
    expect(nativeSource).toContain('if (isDynamicBillboardSection && dynamicSectionBlock)');
  });
});
