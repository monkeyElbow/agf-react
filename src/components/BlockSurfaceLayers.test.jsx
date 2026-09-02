import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import BlockSurfaceLayers from './BlockSurfaceLayers';

const pageBlocksRendererSource = readFileSync(
  path.resolve(__dirname, './blocks/PageBlocksRenderer.jsx'),
  'utf8',
);
const nativeContentPageSource = readFileSync(
  path.resolve(__dirname, './NativeContentPage.jsx'),
  'utf8',
);
const specialRouteSurfaceSources = [
  '../pages/LoansPage.jsx',
  '../pages/RetirementPage.jsx',
  '../pages/ServicesPage.jsx',
  '../pages/InvestmentsPage.jsx',
  './DynamicCtaSection.jsx',
  './InvestmentsGrowthFeature.jsx',
].map((relativePath) => readFileSync(path.resolve(__dirname, relativePath), 'utf8'));

describe('BlockSurfaceLayers', () => {
  it('keeps background effects below ownership context and the HUD anchor', () => {
    const { container } = render(
      <BlockSurfaceLayers
        backgroundEffects={<div data-testid="background-effects" />}
        ownership={{
          state: 'drafted-other',
          overlayLabel: 'Lisa has a draft',
          overlayDetail: 'Draft saved just now',
        }}
        hudAnchor={{
          label: 'Intro',
          onClick: vi.fn(),
        }}
      />,
    );

    const children = Array.from(container.children);
    expect(children.map((node) => node.getAttribute('data-testid') || node.className)).toEqual([
      'background-effects',
      'admin-block-ownership-overlay is-drafted-other',
      'admin-front-hud-layer',
    ]);
    expect(screen.getByRole('button', { name: 'Open Intro HUD panel' })).toBeTruthy();
  });

  it('accepts a route-specific HUD anchor element without creating another anchor implementation', () => {
    render(<BlockSurfaceLayers hudAnchor={<button type="button">Route-specific HUD</button>} />);

    expect(screen.getByRole('button', { name: 'Route-specific HUD' })).toBeTruthy();
  });

  it('does not render collaboration or HUD chrome without their inputs', () => {
    const { container } = render(<BlockSurfaceLayers />);

    expect(container.innerHTML).toBe('');
  });

  it('is the shared layer entry point for canonical and native block renderers', () => {
    expect(pageBlocksRendererSource).toContain("import BlockSurfaceLayers from '../BlockSurfaceLayers';");
    expect(pageBlocksRendererSource).toContain('<BlockSurfaceLayers\n          ownership={ownership}\n          hudAnchor={hudAnchor}\n          backgroundEffects={(');
    expect(pageBlocksRendererSource).not.toContain('<BlockOwnershipOverlay ownership={ownership} />');
    expect(nativeContentPageSource).toContain("import BlockSurfaceLayers from './BlockSurfaceLayers';");
    expect(nativeContentPageSource).toContain('backgroundEffects={<BlockBackgroundEffects effects={resolveBlockBackgroundEffects(dynamicHeroBlock, renderedHero?.backgroundEffects)} />}');
    expect(nativeContentPageSource).toContain('backgroundEffects={<BlockBackgroundEffects effects={resolveBlockBackgroundEffects(dynamicSectionBlock, sectionHero?.backgroundEffects)} />}');
    expect(nativeContentPageSource).not.toContain('<BlockOwnershipOverlay ownership={sectionOwnership} />');
    specialRouteSurfaceSources.forEach((source) => {
      expect(source).toContain('BlockSurfaceLayers');
      expect(source).not.toContain('<BlockOwnershipOverlay');
    });
  });
});
