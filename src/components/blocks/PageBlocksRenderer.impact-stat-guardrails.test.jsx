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

describe('home impact stat renderer guardrail', () => {
  it('preserves impact stat rendering on the shared runtime path', () => {
    render(
      createElement(
        MemoryRouter,
        null,
      createElement(PageBlocksRenderer, {
          blocks: [{
            type: 'impact_stat',
            id: 'impact_stat',
            kind: 'impact_stat',
            mode: 'dynamic',
            settings: {
              titlePrefix: 'What you do here',
              highlight: 'matters',
              body: 'Kingdom growth and support.',
              countUp: true,
              stat1Value: '$11 billion',
              stat1Label: 'assets under management',
              stat1Tone: 'mango',
              stat2Value: '1,583',
              stat2Label: 'ministries supported',
              stat2Tone: 'atlantean',
            },
          }],
        }),
      ),
    );

    const section = document.querySelector('[data-block-id="impact_stat"]');
    expect(section).toBeTruthy();
    expect(screen.getByRole('heading', { name: /What you do here/i })).toBeTruthy();
    expect(screen.getByText('$11 billion')).toBeTruthy();
    expect(screen.getByText('Kingdom growth and support.')).toBeTruthy();
  });

  it('keeps the shared dynamic impact stat builder in the home page block renderer', () => {
    const source = readSource('./PageBlocksRenderer.jsx');

    expect(source).toContain('buildDynamicImpactStatFromBlock,');
    expect(source).toContain("from '../../lib/dynamicPageBlocks';");
    expect(source).toContain('const runtime = buildDynamicImpactStatFromBlock(block);');
    expect(source).not.toContain("kind: 'impact_stat',");
    expect(source).toContain('function ImpactStatBlock({ block, resolveTo, ownership, hudAnchor }) {');
    expect(source).toContain("className={`home-native-impact${ownership?.className || ''}`}");
    expect(source).toContain('<BlockOwnershipOverlay ownership={ownership} />');
    expect(source).not.toContain('feature_split: FeatureSplitBlock,');
  });
});
