import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

import PageBlocksRenderer, { ColumnsBlock } from './PageBlocksRenderer';

function renderColumnsBlock(block) {
  return render(
    createElement(
      MemoryRouter,
      null,
      createElement(PageBlocksRenderer, { blocks: [block] }),
    ),
  );
}

function renderColumnsSection(props) {
  return render(
    createElement(
      MemoryRouter,
      null,
      createElement(ColumnsBlock, props),
    ),
  );
}

describe('PageBlocksRenderer columns', () => {
  it('renders dynamic columns with HUD-managed intro copy and action button styling', () => {
    renderColumnsBlock({
      id: 'columns_math',
      type: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      title: 'Compare your next move',
      titleClassName: 'is-atlantean',
      titleHighlightsJson: JSON.stringify([{ text: 'next', className: 'is-mango' }]),
      leadLine: 'Plan with confidence',
      followupLine: 'Then move when you are ready',
      bodyHtml: '<p>Use the HUD to tune the full section layout.</p>',
      columnsStyle: 'loans-value',
      justify: 'right',
      contentWidth: 'browser',
      columns: 'three',
      col1Enabled: true,
      col1Type: 'text',
      col1Title: 'Run the numbers',
      col1Body: 'See how savings, growth, and payments change over time.',
      col1ButtonLabel: 'Open calculator',
      col1ButtonUrl: '/calculators',
      col1ButtonStyle: 'outline',
      col1ButtonTone: 'melon',
      col2Enabled: true,
      col2Type: 'text',
      col2Title: 'Compare paths',
      col2Body: 'Stack scenarios and stress test your assumptions.',
      col3Enabled: true,
      col3Type: 'text',
      col3Title: 'Make a plan',
      col3Body: 'Turn the numbers into the next conversation.',
      col4Enabled: false,
    });

    expect(screen.getByRole('heading', { name: /compare your\s*next\s*move/i })).toBeTruthy();
    expect(screen.getByText('Plan with confidence')).toBeTruthy();
    expect(screen.getByText('Then move when you are ready')).toBeTruthy();

    const section = screen.getByRole('heading', { name: /compare your\s*next\s*move/i }).closest('section');
    expect(section?.className).toContain('native-dynamic-columns');
    expect(section?.className).toContain('is-columns-style-loans-value');
    expect(section?.className).toContain('is-width-browser');

    const introCopy = screen.getByRole('heading', { name: /compare your\s*next\s*move/i }).closest('.native-info-section-copy');
    expect(introCopy?.className).toContain('is-justify-right');

    const action = screen.getByRole('link', { name: 'Open calculator' });
    expect(action.className).toContain('service-native-btn');
    expect(action.className).toContain('is-outline');
    expect(action.className).toContain('is-tone-melon');
  });

  it('forces external document column actions onto the shared outline contract even when authored as solid buttons', () => {
    renderColumnsBlock({
      id: 'columns_docs',
      type: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      title: 'Reference documents',
      columnsStyle: 'loans-value',
      columns: 'one',
      col1Enabled: true,
      col1Type: 'text',
      col1Title: 'Read the packet',
      col1Body: 'Open the PDF in a new tab.',
      col1ButtonLabel: 'Open PDF',
      col1ButtonUrl: 'https://files.example.com/reference-packet.pdf',
      col1ButtonStyle: 'blue',
      col1ButtonTone: 'mango',
    });

    const action = screen.getByRole('link', { name: 'Open PDF' });
    expect(action.className).toContain('service-native-btn');
    expect(action.className).toContain('is-outline');
    expect(action.className).toContain('is-tone-mango');
    expect(action.className).not.toContain('is-ghost');
    expect(action.className).not.toContain('is-dark');
  });

  it('renders column title core and span colors', () => {
    renderColumnsBlock({
      id: 'columns_math',
      type: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      columnsStyle: 'loans-value',
      columns: 'two',
      col1Enabled: true,
      col1Type: 'text',
      col1Title: 'Housing allowance',
      col1TitleClassName: 'is-atlantean',
      col1TitleHighlightsJson: JSON.stringify([{ text: 'allowance', className: 'is-mango' }]),
      col1Body: 'Primary content stays here.',
      col2Enabled: true,
      col2Type: 'text',
      col2Title: 'Second column',
      col2Body: 'Secondary content stays here.',
    });

    const title = screen.getByText('allowance').closest('h3');
    expect(title.className).toContain('is-atlantean');
    const highlight = screen.getByText('allowance');
    expect(highlight.tagName).toBe('MARK');
    expect(highlight.className).toContain('is-mango');
  });

  it('only renders active column slots and applies width-share layout variables', () => {
    renderColumnsBlock({
      id: 'columns_math',
      type: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      title: 'Compare your options',
      columnsStyle: 'loans-value',
      columns: 'two',
      col1Enabled: true,
      col1Type: 'text',
      col1Title: 'Wider first column',
      col1Body: 'Primary content stays here.',
      col1WidthShare: 1.4,
      col2Enabled: true,
      col2Type: 'text',
      col2Title: 'Narrow second column',
      col2Body: 'Secondary content stays here.',
      col2WidthShare: 0.6,
      col3Enabled: true,
      col3Type: 'text',
      col3Title: 'Hidden third column',
      col3Body: 'This should not render until added.',
    });

    expect(screen.getByText('Wider first column')).toBeTruthy();
    expect(screen.getByText('Narrow second column')).toBeTruthy();
    expect(screen.queryByText('Hidden third column')).toBeNull();

    const grid = screen.getByText('Wider first column').closest('.native-columns-grid');
    expect(grid?.style.getPropertyValue('--dynamic-columns-grid-template')).toBe(
      'minmax(0, 1.4fr) minmax(0, 0.6fr)',
    );
  });

  it('renders photo-column text as label and caption classes', () => {
    renderColumnsBlock({
      id: 'columns_math',
      type: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      title: 'Meet the team',
      columnsStyle: 'loans-value',
      columns: 'two',
      col1Enabled: true,
      col1Type: 'photo',
      col1ImageUrl: 'advisor.jpg',
      col1ImageAlt: 'Advisor portrait',
      col1Title: 'Lead advisor',
      col1Body: 'Serving churches and ministries.',
      col2Enabled: true,
      col2Type: 'text',
      col2Title: 'Support',
      col2Body: 'Planning and strategy.',
    });

    expect(screen.getByText('Lead advisor').className).toContain('native-columns-photo-label');
    expect(screen.getByText('Serving churches and ministries.').className).toContain('native-columns-photo-caption');
  });

  it('supports managed-block settings shape for the value-cards preset and keeps the canonical columns shell', () => {
    renderColumnsSection({
      block: {
        id: 'value_cards',
        kind: 'columns',
        type: 'columns',
        mode: 'dynamic',
        templateId: 'value_cards',
        presetId: 'value-cards',
        settings: {
          title: "There's more to every loan.",
          columnsStyle: 'loans-value',
          bgTone: 'white',
          contentWidth: 'browser',
          columns: 'three',
          col1Enabled: true,
          col1Type: 'text',
          col1Title: 'Smart consulting.',
          col1Body: 'Reduce expensive surprises before they hit the project.',
          col2Enabled: true,
          col2Type: 'text',
          col2Title: 'Teamwork.',
          col2Body: 'Your consultant stays with you throughout the process.',
          col3Enabled: true,
          col3Type: 'text',
          col3Title: 'Roots with values.',
          col3Body: 'The partnership stays aligned with your ministry.',
          col4Enabled: false,
        },
      },
      resolveTo: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
      ownership: { className: ' is-owned-by-me' },
      hudAnchor: {
        label: 'Value Cards',
        isActive: false,
        onClick: vi.fn(),
        style: { '--ag-admin-front-hud-opacity': '0.15' },
      },
      sectionId: 'theresmore',
      extraSectionClassName: 'loans-native-more is-hud-dimmed',
    });

    const section = screen.getByRole('heading', { name: /there's more to every loan/i }).closest('section');
    expect(section?.id).toBe('theresmore');
    expect(section?.className).toContain('native-dynamic-columns');
    expect(section?.className).toContain('is-columns-style-loans-value');
    expect(section?.className).toContain('is-columns-preset-value-cards');
    expect(section?.className).toContain('loans-native-more');
    expect(section?.className).toContain('is-hud-dimmed');
    expect(section?.className).toContain('is-owned-by-me');
    expect(screen.getByRole('heading', { name: /there's more to every loan/i }).className).toContain('investments-growth-scroll-reveal-title');
    expect(screen.getByRole('heading', { name: /there's more to every loan/i }).getAttribute('data-investments-growth-reveal')).toBe('title');
    expect(section?.querySelector('.investments-native-growth-surface')).toBeTruthy();
    expect(section?.querySelector('.investments-native-growth-surface-layer.is-sand')).toBeTruthy();
    expect(section?.querySelector('.native-columns-grid')?.className).toContain('investments-native-growth-grid');

    const firstItem = screen.getByText('Smart consulting.').closest('.native-columns-item');
    const secondItem = screen.getByText('Teamwork.').closest('.native-columns-item');
    const thirdItem = screen.getByText('Roots with values.').closest('.native-columns-item');
    expect(firstItem?.className).toContain('investments-native-growth-card');
    expect(firstItem?.className).toContain('investments-growth-scroll-reveal');
    expect(firstItem?.getAttribute('data-investments-growth-reveal')).toBe('card');
    expect(firstItem?.getAttribute('data-investments-growth-background-panel')).toBe('blue');
    expect(secondItem?.getAttribute('data-investments-growth-background-panel')).toBe('mango');
    expect(thirdItem?.getAttribute('data-investments-growth-background-panel')).toBe('sand');
    expect(screen.getByText('Reduce expensive surprises before they hit the project.')).toBeTruthy();
  });

  it('keeps static home columns on the legacy home feature layout', () => {
    renderColumnsBlock({
      id: 'columns_mha',
      type: 'columns',
      bgTone: 'sand',
      columns: 'two',
      contentWidth: 'content',
      col1Type: 'photo',
      col1ImageUrl: 'mha-photo.jpg',
      col1ImageAlt: 'Retired couple reviewing financial paperwork',
      col2Type: 'text',
      col2Title: 'Ministers Housing Allowance',
      col2Body: 'This significant tax-saving benefit is available to retired ministers.',
      col2ButtonLabel: 'See the details',
      col2ButtonUrl: '/services/retirement/403b#housing',
    });

    const section = screen.getByText('Ministers Housing Allowance').closest('section');
    expect(section?.className).toContain('home-native-feature');
    expect(section?.className).not.toContain('native-dynamic-columns');
  });

  it('renders static home column title highlight spans for do the math', () => {
    renderColumnsBlock({
      id: 'columns_math',
      type: 'columns',
      bgTone: 'white',
      columns: 'two',
      contentWidth: 'content',
      col1Type: 'text',
      col1Title: '(let us) Do the math.',
      col1TitleHighlightsJson: JSON.stringify([{ text: '(let us)', className: 'is-atlantean' }]),
      col1Body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
      col1ButtonLabel: 'Use the calculators',
      col1ButtonUrl: '/calculators',
      col2Type: 'photo',
      col2ImageUrl: 'math-photo.jpg',
      col2ImageAlt: 'Calculator and notebook',
    });

    const title = screen.getByRole('heading', { name: /\(let us\)\s*Do the math\./i });
    const section = title.closest('section');
    expect(section?.className).toContain('home-native-feature');

    const highlight = screen.getByText('(let us)');
    expect(highlight.tagName).toBe('MARK');
    expect(highlight.className).toContain('is-atlantean');
  });

  it('keeps sandstone core and span classes on static home column titles', () => {
    renderColumnsBlock({
      id: 'columns_math',
      type: 'columns',
      bgTone: 'white',
      columns: 'two',
      contentWidth: 'content',
      col1Type: 'text',
      col1Title: 'Steady sandstone guidance',
      col1TitleClassName: 'is-sandstone',
      col1TitleHighlightsJson: JSON.stringify([{ text: 'sandstone', className: 'is-sandstone' }]),
      col1Body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
      col2Type: 'photo',
      col2ImageUrl: 'math-photo.jpg',
      col2ImageAlt: 'Calculator and notebook',
    });

    const title = screen.getByText('sandstone').closest('h3');
    expect(title.className).toContain('is-sandstone');

    const highlight = screen.getByText('sandstone');
    expect(highlight.tagName).toBe('MARK');
    expect(highlight.className).toContain('is-sandstone');
  });

  it('lets dynamic home retirement columns keep separate intro copy and home CTA styling', () => {
    renderColumnsBlock({
      id: 'columns_math',
      type: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      templateId: 'columns',
      presetId: 'do-the-math',
      title: 'Retirement starts with a plan',
      bodyHtml: '<p>Intro copy should stay above the columns.</p>',
      columnsStyle: 'retirement',
      photoAspect: 'portrait',
      photoMaxWidthPx: 404,
      photoCornerRadiusPx: 31,
      columnTitleSizeRem: 3.05,
      col1Enabled: true,
      col1Type: 'text',
      col1Title: 'Do the math.',
      col1Body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
      col1ButtonLabel: 'Use the calculators',
      col1ButtonUrl: '/calculators',
      col2Enabled: true,
      col2Type: 'photo',
      col2ImageUrl: 'math-photo.jpg',
      col2ImageAlt: 'Calculator and notebook',
    });

    expect(screen.getByRole('heading', { name: 'Retirement starts with a plan' })).toBeTruthy();
    expect(screen.getByText('Intro copy should stay above the columns.')).toBeTruthy();
    const section = screen.getByText('Do the math.').closest('section');
    expect(section?.className).toContain('native-dynamic-columns');
    expect(section?.className).toContain('is-columns-style-retirement');
    expect(section?.className).toContain('is-columns-preset-do-the-math');
    expect(section?.style.getPropertyValue('--dynamic-columns-photo-aspect')).toBe('4 / 5');
    expect(section?.style.getPropertyValue('--dynamic-columns-photo-max-width')).toBe('404px');
    expect(section?.style.getPropertyValue('--dynamic-columns-photo-radius')).toBe('31px');
    expect(section?.style.getPropertyValue('--dynamic-columns-column-title-size')).toBe('3.05rem');

    const action = screen.getByRole('link', { name: 'Use the calculators' });
    expect(action.className).toContain('home-native-cta');
    expect(action.className).not.toContain('service-native-btn');
  });

  it('keeps home retirement photo-label color classes on the rendered heading', () => {
    renderColumnsBlock({
      id: 'columns_mha',
      type: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      templateId: 'columns',
      presetId: 'housing-allowance',
      columnsStyle: 'retirement',
      col1Enabled: true,
      col1Type: 'photo',
      col1ImageUrl: 'housing-photo.jpg',
      col1ImageAlt: 'Retired couple reviewing financial paperwork',
      col1Title: 'Housing benefit',
      col1TitleClassName: 'is-atlantean',
      col2Enabled: true,
      col2Type: 'text',
      col2Title: 'Ministers Housing Allowance',
      col2Body: 'This significant tax-saving benefit is available to retired ministers.',
    });

    expect(screen.getByText('Housing benefit').className).toContain('is-atlantean');
    expect(screen.getByText('Housing benefit').closest('section')?.className).toContain('is-columns-preset-housing-allowance');
  });
});
