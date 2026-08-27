import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildHeroInlineLinesFromBlock,
  HeroHudEditorPanel,
  HeroInlineLiveEditor,
} from './HeroHudEditorShared';

const createHeroBlock = () => ({
  id: 'hero',
  kind: 'hero',
  settings: {
    bgTone: 'grey',
    line1Text: "Don't be a hero.",
    line1ClassName: 'is-super-grey',
    line1HighlightsJson: JSON.stringify([
      { start: 2, end: 6, className: 'is-mango', text: "n't " },
    ]),
    line2Text: 'Do not go.',
    line2ClassName: 'is-white',
    line2HighlightsJson: JSON.stringify([
      { start: 3, end: 5, className: 'is-melon', text: 'ot' },
    ]),
  },
});

function HeroAuthorityHarness() {
  const [block, setBlock] = useState(createHeroBlock);
  const updateSetting = (key, value) => {
    setBlock((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: value,
      },
    }));
  };

  return (
    <>
      <button type="button" onClick={() => updateSetting('line1ClassName', 'is-atlantean')}>Change Line 1 core</button>
      <button
        type="button"
        onClick={() => updateSetting('line2HighlightsJson', JSON.stringify([
          { start: 0, end: 2, className: 'is-atlantean', text: 'Do' },
        ]))}
      >
        Change Line 2 span
      </button>
      <div data-testid="page-hero">
        <HeroInlineLiveEditor editableHeroBlock={block} lineKeys={['line1', 'line2']} />
      </div>
      <div data-testid="editor-preview">
        <HeroHudEditorPanel
          editableHeroBlock={block}
          lineKeys={['line1', 'line2']}
          onApplyLineColor={() => {}}
          onApplySelectionColor={() => {}}
          onRemoveSpan={() => {}}
          onClearLineSpans={() => {}}
          onBgToneChange={() => {}}
          onJustifyChange={() => {}}
          onTitleSizeChange={() => {}}
          onTitleLetterSpacingChange={() => {}}
          onLineHeightChange={() => {}}
          onPaddingTopRemChange={() => {}}
          onPaddingBottomRemChange={() => {}}
          onLineTextChange={() => {}}
        />
      </div>
    </>
  );
}

function readMarks(container) {
  return [...container.querySelectorAll('mark')].map((node) => ({
    text: node.textContent,
    className: node.className,
  }));
}

describe('Hero editable single-authority renderer', () => {
  it('derives page and editor preview lines from the same normalized block settings', () => {
    const block = createHeroBlock();
    const lines = buildHeroInlineLinesFromBlock(block, { lineKeys: ['line1', 'line2'] });

    expect(lines.map((line) => ({ text: line.text, className: line.className, highlights: line.highlights }))).toEqual([
      {
        text: "Don't be a hero.",
        className: 'is-super-grey',
        highlights: [{ start: 2, end: 6, className: 'is-mango' }],
      },
      {
        text: 'Do not go.',
        className: 'is-white',
        highlights: [{ start: 3, end: 5, className: 'is-melon' }],
      },
    ]);
  });

  it('updates page Hero and editor preview immediately for core and span settings', () => {
    render(<HeroAuthorityHarness />);

    const page = screen.getByTestId('page-hero');
    const editor = screen.getByTestId('editor-preview');
    expect(readMarks(page)).toEqual(readMarks(editor));
    expect(page.querySelector('h1')?.className).toContain('is-super-grey');

    fireEvent.click(screen.getByRole('button', { name: 'Change Line 1 core' }));
    expect(page.querySelector('h1')?.className).toContain('is-atlantean');
    expect(readMarks(page)).toEqual(readMarks(editor));
    expect(readMarks(page)).toContainEqual({ text: "n't ", className: 'is-mango' });

    fireEvent.click(screen.getByRole('button', { name: 'Change Line 2 span' }));
    expect(readMarks(page)).toEqual(readMarks(editor));
    expect(readMarks(page)).toContainEqual({ text: 'Do', className: 'is-atlantean' });
  });
});
