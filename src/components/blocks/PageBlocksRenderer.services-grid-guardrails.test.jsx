import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { serializeLinkValue } from '../../lib/linkValue';

vi.mock('../../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../../context/ContentAdminContextCore');
  return {
    ...actual,
    useContentAdmin: () => ({
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    }),
  };
});

import PageBlocksRenderer from './PageBlocksRenderer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home services grid renderer guardrail', () => {
  it('preserves services grid rendering on the shared runtime path', () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(PageBlocksRenderer, {
          blocks: [{
            type: 'services_grid',
            id: 'services_grid',
            kind: 'services_grid',
            mode: 'dynamic',
            settings: {
              heading: 'Bold, smart steps.',
              browseLabel: 'Browse all services',
              browseLinkJson: serializeLinkValue({
                kind: 'internal',
                to: '/services',
              }),
              card1Title: 'Loans',
              card1LinkJson: serializeLinkValue({
                kind: 'internal',
                to: '/services/loans',
              }),
              card1ImageUrl: '/icons/loans.png',
              card1ImageAlt: 'Loans icon',
              card1Action: 'Options',
              card2Title: 'View Rates',
              card2LinkJson: serializeLinkValue({
                kind: 'internal',
                to: '/rates',
              }),
              card2ImageUrl: '/icons/rates.png',
              card2ImageAlt: 'Rates icon',
              card2Action: 'View Rates',
              card2Featured: true,
            },
          }],
        }),
      ),
    );

    const section = document.querySelector('[data-block-id="services_grid"]');
    expect(section).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Bold, smart steps.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Loans' }).getAttribute('href')).toBe('/services/loans');
    expect(screen.getByRole('link', { name: 'Browse all services' }).getAttribute('href')).toBe('/services');
  });

  it('keeps the shared dynamic services grid builder in the home page block renderer', () => {
    const source = readSource('./PageBlocksRenderer.jsx');

    expect(source).toContain('buildDynamicServicesGridFromBlock,');
    expect(source).toContain("from '../../lib/dynamicPageBlocks';");
    expect(source).toContain('const runtime = buildDynamicServicesGridFromBlock(block);');
    expect(source).not.toContain("kind: 'services_grid',");
    expect(source).toContain('function ServicesGridBlock({ block, resolveTo, ownership, hudAnchor }) {');
    expect(source).toContain("className={`home-native-services${ownership?.className || ''}`}");
    expect(source).toContain('<BlockOwnershipOverlay ownership={ownership} />');
    expect(source).toContain("const Renderer = blockRenderers[blockKind];");
  });

  it('keeps the home services grid heading locked to a single line in shared styles', () => {
    const cssSource = readSource('../../styles/home-native.css');

    expect(cssSource).toContain('.home-native-services h2 {');
    expect(cssSource).toContain('white-space: nowrap;');
    expect(cssSource).toContain('text-wrap: nowrap;');
  });
});
