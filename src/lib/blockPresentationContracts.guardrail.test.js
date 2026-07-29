import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function readSource(relativeUrl) {
  return readFileSync(new URL(relativeUrl, import.meta.url), 'utf8');
}

describe('block presentation contract guardrails', () => {
  it('keeps presentation-specific block rules out of route-specific normalizers', () => {
    const clientAdminSource = readSource('../context/ContentAdminContext.jsx');
    const devServerSource = readSource('../../dev-server/contentAdminStore.js');

    [
      clientAdminSource,
      devServerSource,
    ].forEach((source) => {
      expect(source).not.toContain('function normalizeCharitableGiftAnnuitiesOutroSettings');
      expect(source).not.toContain('function normalizeMinistryImpactOutroSettings');
      expect(source).not.toContain("storedBlock.id === 'outro'\n        && storedKind === 'billboard'");
      expect(source).not.toContain("String(nextBlock?.id || '').trim() === 'outro'\n    && String(nextBlock?.kind || '').trim().toLowerCase() === 'billboard'");
    });
  });

  it('normalizes block presentation before rendering and before saving admin state', () => {
    const nativePageSource = readSource('../components/NativeContentPage.jsx');
    const blockRendererSource = readSource('../components/blocks/PageBlocksRenderer.jsx');
    const dynamicBlocksSource = readSource('./dynamicPageBlocks.js');
    const clientAdminSource = readSource('../context/ContentAdminContext.jsx');
    const devServerSource = readSource('../../dev-server/contentAdminStore.js');

    expect(nativePageSource).toContain('const renderBlock = normalizeBlockForRender(block);');
    expect(blockRendererSource).toContain('const renderBlock = normalizeBlockForRender(block);');
    expect(dynamicBlocksSource).toContain('const normalizedBlock = normalizeBlockForRender(block);');
    expect(clientAdminSource).toContain('normalizeBlockPresentation(mergedBlock)');
    expect(devServerSource).toContain('return normalizeBlockPresentation(nextBlock);');
  });
});
