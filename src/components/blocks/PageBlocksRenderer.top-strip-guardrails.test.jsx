import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../context/ContentAdminContext', async () => {
  const actual = await vi.importActual('../../context/ContentAdminContext.jsx');
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

describe('home top strip renderer guardrail', () => {
  it('preserves top strip rendering on the shared runtime path', () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(PageBlocksRenderer, {
          blocks: [{
            type: 'top_strip',
            id: 'top_strip',
            kind: 'top_strip',
            mode: 'dynamic',
            showLogin: true,
            loginLabel: 'Secure Login',
            loginHref: 'https://secure.agfinancial.org/',
            showPhone: true,
            phone: '866.621.1787',
            showRates: true,
            ratesLabel: 'Ask about our rates!',
            ratesPath: '/rates',
            bgTone: 'grey',
            textTone: 'white',
            loginButtonTone: 'atlantean',
            loginButtonStyle: 'solid',
            ratesButtonTone: 'mango',
            ratesButtonStyle: 'link',
          }],
        }),
      ),
    );

    const strip = document.querySelector('.home-native-strip.is-bg-grey.is-text-white');
    expect(strip).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Secure Login' }).getAttribute('href')).toBe('https://secure.agfinancial.org/');
    expect(screen.getByRole('link', { name: 'Ask about our rates!' }).getAttribute('href')).toBe('/rates');
  });

  it('keeps the shared dynamic top strip builder in the home page block renderer', () => {
    const source = readSource('./PageBlocksRenderer.jsx');

    expect(source).toContain('buildDynamicTopStripFromBlock,');
    expect(source).toContain("from '../../lib/dynamicPageBlocks';");
    expect(source).toContain('const runtime = buildDynamicTopStripFromBlock(block);');
    expect(source).not.toContain('const runtime = buildDynamicTopStripFromBlock(block) || buildDynamicTopStripFromBlock({');
    expect(source).toContain('const ratesTo = runtime.ratesIsExternal ? runtime.ratesPath : resolveTo(runtime.ratesPath, \'/rates\');');
    expect(source).toContain('const stripClassName = `home-native-strip is-bg-${runtime.bgTone} is-text-${runtime.textTone}`;');
    expect(source).toContain("heroHud={blockKind === 'hero' ? heroHud : null}");
  });
});
