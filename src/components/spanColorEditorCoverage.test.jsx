import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  BillboardBlockEditor,
  CtaFormBlockEditor,
  ColumnsBlockEditor,
  GridBlockEditor,
  HeroBlockEditor,
  IntroBlockEditor,
  NewsletterBlockEditor,
  RequestFormBlockEditor,
} from './block-editors/migratedBlockEditors';
import BlockHudPanelHost from './BlockHudPanelHost';
import {
  contentBlockBlueprintsByPath,
  genericPageBlockBlueprint,
} from '../data/contentBlockBlueprints';
import { getBlockHudDefinition } from '../lib/blockHudRegistry';
import { SPAN_COLOR_EDITOR_CONTRACT, SPAN_COLOR_EDITOR_KINDS } from '../lib/spanColorEditorContract';

const allBlueprintBlocks = [
  ...genericPageBlockBlueprint(),
  ...Object.values(contentBlockBlueprintsByPath).flat(),
];

const ADMIN_RENDERERS_BY_KIND = {
  hero: HeroBlockEditor,
  intro: IntroBlockEditor,
  billboard: BillboardBlockEditor,
  cta_form: CtaFormBlockEditor,
  request_form: RequestFormBlockEditor,
  columns: ColumnsBlockEditor,
  newsletter: NewsletterBlockEditor,
  card_grid: GridBlockEditor,
};

const ASSERT_PREVIEW_BY_KIND = {
  hero: () => {
    expect(screen.getByLabelText('Hero editor preview surface')).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: /Hero color controls/i })).toBeTruthy();
  },
  intro: () => {
    expect(screen.getByRole('radiogroup', { name: /Intro background/i })).toBeTruthy();
    expect(screen.getByText('Core Color')).toBeTruthy();
  },
  billboard: () => {
    expect(screen.getByRole('radiogroup', { name: /Billboard title color/i })).toBeTruthy();
    const backgroundButton = screen.queryByRole('button', { name: 'Background' });
    if (backgroundButton) {
      fireEvent.click(backgroundButton);
    }
    expect(screen.getByRole('radiogroup', { name: /Billboard background/i })).toBeTruthy();
  },
  cta_form: () => {
    expect(screen.getByRole('radiogroup', { name: /CTA form heading color|CTA heading color/i })).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
  },
  request_form: () => {
    expect(screen.getByLabelText('Form heading text')).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: /Form heading color controls/i })).toBeTruthy();
  },
  columns: () => {
    expect(screen.getByRole('radiogroup', { name: /Columns heading color/i })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: /Columns background/i })).toBeTruthy();
  },
  newsletter: () => {
    expect(screen.getByRole('radiogroup', { name: /Newsletter background/i })).toBeTruthy();
    expect(screen.getByText('Newsletter heading')).toBeTruthy();
  },
  card_grid: () => {
    expect(screen.getByRole('radiogroup', { name: /Grid background/i })).toBeTruthy();
    expect(screen.getByText(/Grid header|Grid intro heading|Intro handled outside this preset/i)).toBeTruthy();
    expect(screen.getByText('Core Color')).toBeTruthy();
  },
};

function cloneBlock(block) {
  return structuredClone(block);
}

function getDynamicBlock(kind) {
  const matches = allBlueprintBlocks
    .filter((block) => block?.mode === 'dynamic' && block?.kind === kind)
    .sort((a, b) => {
      const aCount = Array.isArray(a?.editableFields) ? a.editableFields.length : 0;
      const bCount = Array.isArray(b?.editableFields) ? b.editableFields.length : 0;
      return bCount - aCount;
    });

  if (!matches.length) {
    throw new Error(`No dynamic block found for kind "${kind}".`);
  }

  return cloneBlock(matches.find((block) => block?.id === kind) || matches[0]);
}

describe('span-color editor coverage', () => {
  it('keeps the HUD registry aligned with the span-color contract', () => {
    SPAN_COLOR_EDITOR_KINDS.forEach((kind) => {
      const block = getDynamicBlock(kind);
      const contract = SPAN_COLOR_EDITOR_CONTRACT[kind];
      expect(getBlockHudDefinition(block).editorType).toBe(contract.hudEditorType);
    });
  });

  it('keeps preview/editor coverage in admin for every span-color block', () => {
    SPAN_COLOR_EDITOR_KINDS.forEach((kind) => {
      const Component = ADMIN_RENDERERS_BY_KIND[kind];
      const block = getDynamicBlock(kind);
      const onSettingChange = vi.fn();

      render(createElement(Component, { block, onSettingChange, routeOptions: [] }));
      ASSERT_PREVIEW_BY_KIND[kind]();
      cleanup();
    });
  });

  it('keeps preview/editor coverage in HUD for every span-color block', () => {
    SPAN_COLOR_EDITOR_KINDS.forEach((kind) => {
      const block = getDynamicBlock(kind);

      render(createElement(BlockHudPanelHost, {
        block,
        pathname: '/services/loans',
        routeOptions: [],
        onSettingChange: vi.fn(),
      }));

      ASSERT_PREVIEW_BY_KIND[kind]();
      cleanup();
    });
  });
});
