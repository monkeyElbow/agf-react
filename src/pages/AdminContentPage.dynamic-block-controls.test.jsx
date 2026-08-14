import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import {
  contentBlockBlueprintsByPath,
  defaultInvestmentsIntroSettings,
  getAllBlockTemplateBlueprints,
  genericPageBlockBlueprint,
} from '../data/contentBlockBlueprints';
import { getNativePageContent } from '../data/nativePageContent';
import { defaultTestimonialsLibrary } from '../data/testimonialsLibrarySeed';
import {
  FieldControlGrid,
} from './AdminContentPage';
import {
  BillboardBlockEditor,
  CalculatorCtaBlockEditor,
  CtaFormBlockEditor,
  ColumnsBlockEditor,
  FeaturePanelBlockEditor,
  GridBlockEditor,
  HeroBlockEditor,
  HeroPieBlockEditor,
  ImpactStatBlockEditor,
  IntroBlockEditor,
  LegalCopyBlockEditor,
  NewsletterBlockEditor,
  PageContentBlockEditor,
  PhotoColumnBlockEditor,
  RatesBlockEditor,
  RequestFormBlockEditor,
  ServicesGridBlockEditor,
  SplitPanelBlockEditor,
  TestimonialsBlockEditor,
  TopStripBlockEditor,
} from '../components/block-editors/migratedBlockEditors';
import { getEditableFieldsForKind } from '../blocks/registry';
import { remapHighlightsJsonForTextChange } from '../lib/heroHudRanges';

void [
  BillboardBlockEditor,
  CalculatorCtaBlockEditor,
  ColumnsBlockEditor,
  FeaturePanelBlockEditor,
  CtaFormBlockEditor,
  FieldControlGrid,
  GridBlockEditor,
  HeroBlockEditor,
  HeroPieBlockEditor,
  ImpactStatBlockEditor,
  IntroBlockEditor,
  LegalCopyBlockEditor,
  NewsletterBlockEditor,
  PageContentBlockEditor,
  PhotoColumnBlockEditor,
  RatesBlockEditor,
  ServicesGridBlockEditor,
  SplitPanelBlockEditor,
  RequestFormBlockEditor,
  TestimonialsBlockEditor,
  TopStripBlockEditor,
];

const allBlueprintBlocks = [
  ...genericPageBlockBlueprint(),
  ...Object.values(contentBlockBlueprintsByPath).flat(),
  ...getAllBlockTemplateBlueprints(),
];

function cloneBlock(block) {
  return structuredClone(block);
}

function getDynamicBlock(kind) {
  if (kind === 'photo_column') {
    return {
      id: 'photo-column-sample',
      kind: 'photo_column',
      mode: 'dynamic',
      editableFields: getEditableFieldsForKind('photo_column'),
      settings: {
        title: 'Mission team',
        body: 'Coverage that travels with you.',
        imageUrl: '/mission-team.jpg',
        imageAlt: 'Mission team',
        buttonLabel: 'Learn more',
        buttonUrl: '/services/insurance/mission-assure',
        buttonPageRef: '/services/insurance/mission-assure',
        buttonStyle: 'outline',
        buttonTone: 'mango',
        widthShare: 1,
      },
    };
  }

  if (kind === 'legal_copy') {
    return {
      id: 'legal-copy-sample',
      kind: 'legal_copy',
      mode: 'dynamic',
      editableFields: getEditableFieldsForKind('legal_copy'),
      settings: {
        certificatesHtml: '<p>Certificates disclosure copy.</p>',
        iraHtml: '<p>IRA disclosure copy.</p>',
      },
    };
  }

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

function getField(block, fieldId) {
  const field = (Array.isArray(block?.editableFields) ? block.editableFields : [])
    .find((entry) => entry?.id === fieldId);

  if (!field) {
    throw new Error(`Missing field "${fieldId}" on block "${block?.kind || block?.id}".`);
  }

  return field;
}

function getRouteLinkTextInput(label) {
  const labelNode = screen.getByText(label).closest('label');
  const input = labelNode?.querySelector('input[type="text"]');
  if (!input) {
    throw new Error(`Missing route-link text input for "${label}".`);
  }
  return input;
}

describe('dynamic block control wiring', () => {
  it('keeps blueprint and insert-template pools free of static blocks', () => {
    const staticBlocks = allBlueprintBlocks.filter((block) => block?.mode === 'static');

    expect(staticBlocks).toEqual([]);
  });

  it('keeps promoted overview hero templates dynamic-only', () => {
    ['/', '/services/loans', '/services/investments', '/services/retirement'].forEach((pathname) => {
      const blocks = contentBlockBlueprintsByPath[pathname] || [];
      const dynamicHero = blocks.find((block) => block?.id === 'hero' && block?.mode === 'dynamic');
      const staticHero = blocks.find((block) => block?.id === 'hero' && block?.mode === 'static');

      expect(dynamicHero).toBeTruthy();
      expect(Array.isArray(dynamicHero?.editableFields) ? dynamicHero.editableFields.length : 0).toBeGreaterThan(0);
      expect(staticHero).toBeUndefined();
    });
  });

  it('keeps home managed billboards wired as dynamic blocks', () => {
    [
      { id: 'home_ministry_allies', kind: 'billboard' },
      { id: 'home_do_the_math', kind: 'billboard' },
    ].forEach(({ id, kind }) => {
      const blocks = contentBlockBlueprintsByPath['/'] || [];
      const dynamicBlock = blocks.find((block) => block?.id === id && block?.mode === 'dynamic');
      const staticBlock = blocks.find((block) => block?.id === id && block?.mode === 'static');

      expect(dynamicBlock).toBeTruthy();
      expect(dynamicBlock?.kind).toBe(kind);
      expect(Array.isArray(dynamicBlock?.editableFields) ? dynamicBlock.editableFields.length : 0).toBeGreaterThan(0);
      expect(staticBlock).toBeUndefined();
    });
  });

  it('keeps root service intro seeds in dynamic blueprints after native shells are cleared', () => {
    const loansIntro = (contentBlockBlueprintsByPath['/services/loans'] || [])
      .find((block) => block?.id === 'intro' && block?.mode === 'dynamic');
    const investmentsIntro = (contentBlockBlueprintsByPath['/services/investments'] || [])
      .find((block) => block?.id === 'intro' && block?.mode === 'dynamic');
    const loansNativeIntro = getNativePageContent('/services/loans', 'Loans')?.intro;
    const investmentsNativeIntro = getNativePageContent('/services/investments', 'Investments')?.intro;

    expect(loansIntro?.settings?.bgTone).toBe('blue');
    expect(loansIntro?.settings?.textTone).toBe('white');
    expect(loansIntro?.settings?.button1Label).toBe('Get started');
    expect(loansNativeIntro).toBeUndefined();
    expect(investmentsIntro?.settings?.bgTone).toBe(defaultInvestmentsIntroSettings.bgTone);
    expect(investmentsIntro?.settings?.textTone).toBe(defaultInvestmentsIntroSettings.textTone);
    expect(investmentsIntro?.settings?.heading).toBe(defaultInvestmentsIntroSettings.heading);
    expect(investmentsNativeIntro).toBeUndefined();
  });

  it('wires top strip controls through the migrated top strip editor', () => {
    const block = getDynamicBlock('top_strip');
    const onSettingChange = vi.fn();

    render(
      <TopStripBlockEditor
        block={block}
        onSettingChange={onSettingChange}
      />,
    );

    const toggle = screen.getByRole('group', { name: 'Show Login' });
    fireEvent.click(within(toggle).getByRole('button', { name: 'Off' }));

    expect(onSettingChange).toHaveBeenCalledWith('showLogin', false);
  });

  it('shows the full login button color palette in admin when top strip outline style is selected', () => {
    const block = getDynamicBlock('top_strip');
    const onSettingChange = vi.fn();
    block.settings.loginButtonStyle = 'outline';

    render(
      <TopStripBlockEditor
        block={block}
        onSettingChange={onSettingChange}
      />,
    );

    const palette = screen.getByRole('radiogroup', { name: 'Top strip login button color' });
    expect(within(palette).getAllByRole('radio')).toHaveLength(5);
    expect(within(palette).getByRole('radio', { name: 'Mango' })).toBeTruthy();
    expect(within(palette).getByRole('radio', { name: 'Melon' })).toBeTruthy();
    expect(within(palette).getByRole('radio', { name: 'White' })).toBeTruthy();
  });

  it('renders legal copy controls through the migrated editor', () => {
    const block = getDynamicBlock('legal_copy');

    render(<LegalCopyBlockEditor block={block} onSettingChange={vi.fn()} />);

    expect(screen.getByText('Certificates copy')).toBeTruthy();
    expect(screen.getByText('IRA copy')).toBeTruthy();
    expect(screen.getAllByRole('toolbar', { name: 'Article body formatting' }).length).toBeGreaterThan(0);
  });

  it('wires hero block controls', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.change(screen.getByLabelText('Hero animation'), {
      target: { value: 'loans-unblur' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('animationPreset', 'loans-unblur');
  });

  it('shows only shared headline size and text line height controls for hero spacing', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.getByText('Headline Size')).toBeTruthy();
    expect(screen.getByText('Text Line Height')).toBeTruthy();
    expect(screen.queryByText('Gap Between Lines')).toBeNull();

    fireEvent.change(screen.getByLabelText('Hero headline size'), {
      target: { value: '7.8' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('titleSizeRem', 7.8);
  });

  it('groups lower hero settings by hero controls and button tasks', () => {
    const block = getDynamicBlock('hero');

    render(<HeroBlockEditor block={block} onSettingChange={vi.fn()} />);

    const heroSettingsGroup = screen.getByLabelText('Hero settings');
    const button1Group = screen.getByLabelText('Button 1 settings');
    const button2Group = screen.getByLabelText('Button 2 settings');

    expect(within(heroSettingsGroup).getByLabelText('Hero animation')).toBeTruthy();
    expect(within(heroSettingsGroup).getByText('Button row justify')).toBeTruthy();

    expect(within(button1Group).getByLabelText('Label')).toBeTruthy();
    expect(within(button1Group).getByText('Destination')).toBeTruthy();
    expect(within(button1Group).getByText('New window')).toBeTruthy();

    expect(within(button2Group).getByLabelText('Label')).toBeTruthy();
    expect(within(button2Group).getByText('Destination')).toBeTruthy();
  });

  it('keeps hero button label drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(
        <HeroBlockEditor
          block={getDynamicBlock('hero')}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      const button1Group = screen.getByLabelText('Button 1 settings');
      const labelInput = within(button1Group).getByLabelText('Label');
      fireEvent.change(labelInput, {
        target: { value: 'Draft hero button label' },
      });

      expect(labelInput.value).toBe('Draft hero button label');
      expect(onSettingChange).not.toHaveBeenCalledWith('button1Label', 'Draft hero button label');

      rerender(
        <HeroBlockEditor
          block={getDynamicBlock('hero')}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      expect(within(screen.getByLabelText('Button 1 settings')).getByLabelText('Label').value).toBe('Draft hero button label');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('button1Label', 'Draft hero button label');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps hero button links on the buffered route-sync path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();

    try {
      render(
        <HeroBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      const button1Group = screen.getByLabelText('Button 1 settings');
      const button2Group = screen.getByLabelText('Button 2 settings');
      fireEvent.change(within(button1Group).getByLabelText('Destination'), {
        target: { value: '/contact-us' },
      });
      fireEvent.change(within(button2Group).getByLabelText('Destination'), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('button1LinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');
      expect(onSettingChange).toHaveBeenCalledWith('button2LinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('button1PageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('button2PageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('button1Url', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('button2Url', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps hero line text drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(
        <HeroBlockEditor
          block={getDynamicBlock('hero')}
          onSettingChange={onSettingChange}
        />,
      );

      const lineInput = screen.getByLabelText('Line 1 text');
      fireEvent.change(lineInput, {
        target: { value: 'Draft hero line text' },
      });

      expect(lineInput.value).toBe('Draft hero line text');
      expect(onSettingChange).not.toHaveBeenCalledWith('line1Text', 'Draft hero line text');

      rerender(
        <HeroBlockEditor
          block={getDynamicBlock('hero')}
          onSettingChange={onSettingChange}
        />,
      );

      expect(screen.getByLabelText('Line 1 text').value).toBe('Draft hero line text');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('line1Text', 'Draft hero line text');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('commits hero line text on blur and preserves highlight remapping', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      line1Text: 'Today',
      line1HighlightsJson: '[{"start":0,"end":5,"className":"is-mango","text":"Today"}]',
    };

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    const lineInput = screen.getByLabelText('Line 1 text');
    fireEvent.change(lineInput, {
      target: { value: 'Tomorrow' },
    });

    expect(onSettingChange).not.toHaveBeenCalledWith('line1Text', 'Tomorrow');

    fireEvent.blur(lineInput);

    expect(onSettingChange).toHaveBeenCalledWith('line1Text', 'Tomorrow');
    expect(onSettingChange).toHaveBeenCalledWith(
      'line1HighlightsJson',
      remapHighlightsJsonForTextChange(block.settings.line1HighlightsJson, 'Today', 'Tomorrow'),
    );
  });

  it('commits dirty hero line drafts immediately when applying a selection highlight color', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      line1Text: 'Today',
      line1HighlightsJson: '',
    };

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    const lineInput = screen.getByLabelText('Line 1 text');
    fireEvent.change(lineInput, {
      target: { value: 'Tomorrow' },
    });

    expect(onSettingChange).not.toHaveBeenCalledWith('line1Text', 'Tomorrow');

    lineInput.focus();
    lineInput.setSelectionRange(0, 3);
    fireEvent.select(lineInput);
    fireEvent.click(screen.getByRole('radio', { name: 'Mango (apply to selection)' }));

    expect(onSettingChange).toHaveBeenCalledWith('line1Text', 'Tomorrow');
    expect(onSettingChange).toHaveBeenCalledWith(
      'line1HighlightsJson',
      expect.stringContaining('"start":0,"end":3,"className":"is-mango","text":"Tom"'),
    );
  });

  it('keeps hero background swatches visible even when field options are missing', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();

    block.editableFields = block.editableFields.map((field) => (
      field.id === 'bgTone'
        ? { ...field, options: [] }
        : field
    ));

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.getByRole('radio', { name: 'White' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Sand Gradient' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Blue Gradient' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Super Grey Gradient' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'White' }).style.getPropertyValue('--admin-bg-swatch')).toContain('linear-gradient');
  });

  it('keeps hero line 3 hidden until the editor explicitly adds it', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      line3Text: '',
      line3ClassName: '',
      line3HighlightsJson: '',
    };

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.queryByLabelText('Line 3 text')).toBeNull();
    expect(screen.queryByText('Line 3 text')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add Line 3' }));

    expect(screen.getByLabelText('Line 3 text')).toBeTruthy();
  });

  it('lets the editor hide an empty optional hero line 3 after adding it', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      line3Text: '',
      line3ClassName: '',
      line3HighlightsJson: '',
    };

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Line 3' }));
    expect(screen.getByLabelText('Line 3 text')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Hide Line 3' }));
    expect(screen.queryByLabelText('Line 3 text')).toBeNull();
  });

  it('adds white preview contrast for hero core text on dark backgrounds when no explicit line color exists', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      bgTone: 'blue',
      line1ClassName: 'home-native-eyebrow',
    };

    const { container } = render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);
    const previewLine = container.querySelector('.admin-hero-inline-line-mirror');

    expect(previewLine?.className).toContain('is-white');
    expect(previewLine?.className).toContain('home-native-eyebrow');
  });

  it('keeps explicit hero line colors on dark backgrounds instead of auto-layering white', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      bgTone: 'blue',
      line1ClassName: 'line1 is-super-grey',
    };

    const { container } = render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);
    const previewLine = container.querySelector('.admin-hero-inline-line-mirror');

    expect(previewLine?.className).toContain('is-super-grey');
    expect(previewLine?.className).not.toContain('is-white');
  });

  it('keeps hero span details focused on the active line while letting other span lines stay reachable', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      line1Text: 'Primary headline',
      line1HighlightsJson: '[{"start":0,"end":7,"className":"is-mango","text":"Primary"}]',
      line2Text: 'Secondary headline',
      line2HighlightsJson: '[{"start":0,"end":9,"className":"is-melon","text":"Secondary"}]',
    };

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Show span details' }));
    expect(screen.getByText('Line 1 spans')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to Line 2 spans (1)' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Line 2 (1 spans)', pressed: false }));
    expect(screen.getByRole('button', { name: 'Line 2 (1 spans)', pressed: true })).toBeTruthy();
    expect(screen.getByText('Line 2 spans')).toBeTruthy();
  });

  it('keeps hero line 3 hidden when only styling metadata exists', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      line3Text: '',
      line3ClassName: 'line3 is-atlantean',
      line3HighlightsJson: '[{"text":"ghost","className":"is-mango"}]',
    };

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.queryByLabelText('Line 3 text')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add Line 3' }));

    expect(screen.getByLabelText('Line 3 text')).toBeTruthy();
  });

  it('keeps line 3 color editing available once real line 3 text exists', () => {
    const block = getDynamicBlock('hero');
    const onSettingChange = vi.fn();
    block.settings = {
      ...block.settings,
      line3Text: 'Optional third line',
      line3ClassName: 'line3',
      line3HighlightsJson: '',
    };

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.focus(screen.getByLabelText('Line 3 text'));
    fireEvent.click(screen.getByRole('radio', { name: 'Blue (apply to Line 3)' }));

    expect(onSettingChange).toHaveBeenCalledWith('line3ClassName', 'line3 is-atlantean');
  });

  it('preserves hero base classes when applying a full-line swatch without clearing span highlights', () => {
    const block = cloneBlock(
      contentBlockBlueprintsByPath['/'].find((entry) => entry?.id === 'hero' && entry?.mode === 'dynamic'),
    );
    const onSettingChange = vi.fn();

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Blue (apply to Line 1)' }));

    expect(onSettingChange).toHaveBeenCalledWith('line1ClassName', 'home-native-eyebrow is-atlantean');
    expect(onSettingChange).not.toHaveBeenCalledWith('line1HighlightsJson', '');
  });

  it('does not recolor a stale hero selection when the live selection is collapsed', () => {
    const block = cloneBlock(
      contentBlockBlueprintsByPath['/'].find((entry) => entry?.id === 'hero' && entry?.mode === 'dynamic'),
    );
    const onSettingChange = vi.fn();

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    const lineInput = screen.getByLabelText('Line 1 text');
    lineInput.focus();
    lineInput.setSelectionRange(0, 5);
    fireEvent.select(lineInput);

    lineInput.setSelectionRange(0, 0);
    fireEvent.click(screen.getByRole('radio', { name: 'Mango (apply to selection)' }));

    expect(onSettingChange).toHaveBeenCalledWith('line1ClassName', 'home-native-eyebrow is-mango');
    expect(onSettingChange).not.toHaveBeenCalledWith(
      'line1HighlightsJson',
      expect.stringContaining('"className":"is-mango"'),
    );
  });

  it('refreshes hero swatch targeting from the live selection state before applying color', () => {
    const block = cloneBlock(
      contentBlockBlueprintsByPath['/'].find((entry) => entry?.id === 'hero' && entry?.mode === 'dynamic'),
    );
    const onSettingChange = vi.fn();

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    const lineInput = screen.getByLabelText('Line 1 text');
    lineInput.focus();
    lineInput.setSelectionRange(0, 5);
    fireEvent.select(lineInput);

    lineInput.setSelectionRange(0, 0);
    fireEvent.mouseDown(screen.getByRole('radio', { name: 'Mango (apply to selection)' }));

    expect(screen.getByRole('radio', { name: 'Mango (apply to Line 1)' })).toBeTruthy();
  });

  it('applies hero span color only to the current selected range', () => {
    const block = cloneBlock(
      contentBlockBlueprintsByPath['/'].find((entry) => entry?.id === 'hero' && entry?.mode === 'dynamic'),
    );
    const onSettingChange = vi.fn();
    const expectedSelectedText = String(block?.settings?.line1Text || '').slice(0, 5);

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    const lineInput = screen.getByLabelText('Line 1 text');
    lineInput.focus();
    lineInput.setSelectionRange(0, 5);
    fireEvent.select(lineInput);
    fireEvent.click(screen.getByRole('radio', { name: 'Melon (apply to selection)' }));

    expect(onSettingChange).toHaveBeenCalledWith(
      'line1HighlightsJson',
      expect.stringContaining(`"start":0,"end":5,"className":"is-melon","text":"${expectedSelectedText}"`),
    );
  });

  it('keeps line 1 swatch application on the selected range even if the browser collapses focus before click', () => {
    const block = cloneBlock(
      contentBlockBlueprintsByPath['/'].find((entry) => entry?.id === 'hero' && entry?.mode === 'dynamic'),
    );
    const onSettingChange = vi.fn();
    const expectedSelectedText = String(block?.settings?.line1Text || '').slice(0, 5);

    render(<HeroBlockEditor block={block} onSettingChange={onSettingChange} />);

    const lineInput = screen.getByLabelText('Line 1 text');
    const swatch = screen.getByRole('radio', { name: 'Mango (apply to Line 1)' });
    lineInput.focus();
    lineInput.setSelectionRange(0, 5);
    fireEvent.select(lineInput);

    fireEvent.mouseDown(swatch);
    lineInput.setSelectionRange(0, 0);
    fireEvent.click(swatch);

    expect(onSettingChange).toHaveBeenCalledWith(
      'line1HighlightsJson',
      expect.stringContaining(`"start":0,"end":5,"className":"is-mango","text":"${expectedSelectedText}"`),
    );
    expect(onSettingChange).not.toHaveBeenCalledWith('line1ClassName', 'home-native-eyebrow is-mango');
  });

  it('wires hero pie controls through the migrated hero pie editor', () => {
    const block = getDynamicBlock('hero_pie');
    const autoplayField = getField(block, 'autoplay');
    const onSettingChange = vi.fn();

    render(
      <HeroPieBlockEditor
        block={block}
        onSettingChange={onSettingChange}
      />,
    );

    const toggle = screen.getByRole('group', { name: autoplayField.label });
    fireEvent.click(within(toggle).getByRole('button', { name: 'Off' }));

    expect(onSettingChange).toHaveBeenCalledWith('autoplay', false);
  });

  it('wires impact stat controls through the migrated impact stat editor', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('impact_stat');
    const onSettingChange = vi.fn();

    try {
      render(
        <ImpactStatBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ label: 'Impact', value: '/about-us/impact' }]}
        />,
      );

      fireEvent.change(screen.getByLabelText('Impact title prefix'), {
        target: { value: 'What happens here' },
      });
      fireEvent.change(screen.getByLabelText('Stat 1 value'), {
        target: { value: '$12 billion' },
      });
      fireEvent.change(screen.getByLabelText('CTA label'), {
        target: { value: 'Read more' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('titlePrefix', 'What happens here');
      expect(onSettingChange).not.toHaveBeenCalledWith('stat1Value', '$12 billion');
      expect(onSettingChange).not.toHaveBeenCalledWith('ctaLabel', 'Read more');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('titlePrefix', 'What happens here');
      expect(onSettingChange).toHaveBeenCalledWith('stat1Value', '$12 billion');
      expect(onSettingChange).toHaveBeenCalledWith('ctaLabel', 'Read more');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps migrated feature panel action links on the route-link editor control path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('feature_panel');
    const onSettingChange = vi.fn();

    try {
      render(
        <FeaturePanelBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ path: '/contact-us', title: 'Contact us' }]}
        />,
      );

      fireEvent.change(screen.getByLabelText('Select internal page'), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('buttonLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('buttonPageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('buttonUrl', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps impact-stat text drafts stable through stale upstream rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();
    const routeOptions = [{ title: 'Impact', path: '/about-us/impact' }];
    const { rerender } = render(
      <ImpactStatBlockEditor
        block={getDynamicBlock('impact_stat')}
        onSettingChange={onSettingChange}
        routeOptions={routeOptions}
      />,
    );

    try {
      const titlePrefixInput = screen.getByLabelText('Impact title prefix');
      fireEvent.change(titlePrefixInput, {
        target: { value: 'Draft impact lead-in' },
      });

      expect(titlePrefixInput.value).toBe('Draft impact lead-in');
      expect(onSettingChange).not.toHaveBeenCalledWith('titlePrefix', 'Draft impact lead-in');

      rerender(
        <ImpactStatBlockEditor
          block={getDynamicBlock('impact_stat')}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
        />,
      );

      expect(screen.getByLabelText('Impact title prefix').value).toBe('Draft impact lead-in');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('titlePrefix', 'Draft impact lead-in');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps impact-stat action links on the route-link editor control path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('impact_stat');
    const onSettingChange = vi.fn();
    const ctaPathField = getField(block, 'ctaLinkJson');

    try {
      render(
        <ImpactStatBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ path: '/contact-us', title: 'Contact us' }]}
        />,
      );

      fireEvent.change(getRouteLinkTextInput(ctaPathField.label), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('ctaLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('ctaPageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('ctaPath', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires calculator cta controls through the migrated calculator cta editor', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('calculator_cta');
    const onSettingChange = vi.fn();

    try {
      render(
        <CalculatorCtaBlockEditor
          block={block}
          onSettingChange={onSettingChange}
        />,
      );

      fireEvent.change(screen.getByLabelText('Calculator title'), {
        target: { value: 'Laddering Calculator' },
      });
      fireEvent.change(screen.getByLabelText('Calculate button label'), {
        target: { value: 'Run calculation' },
      });
      fireEvent.change(screen.getByLabelText('Discuss title'), {
        target: { value: 'Want to talk through your options?' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Laddering Calculator');
      expect(onSettingChange).not.toHaveBeenCalledWith('calculateLabel', 'Run calculation');
      expect(onSettingChange).not.toHaveBeenCalledWith('discussTitle', 'Want to talk through your options?');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Laddering Calculator');
      expect(onSettingChange).toHaveBeenCalledWith('calculateLabel', 'Run calculation');
      expect(onSettingChange).toHaveBeenCalledWith('discussTitle', 'Want to talk through your options?');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps calculator-cta drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(
        <CalculatorCtaBlockEditor
          block={getDynamicBlock('calculator_cta')}
          onSettingChange={onSettingChange}
        />,
      );

      const titleInput = screen.getByLabelText('Calculator title');
      fireEvent.change(titleInput, {
        target: { value: 'Draft calculator title' },
      });

      expect(titleInput.value).toBe('Draft calculator title');
      expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Draft calculator title');

      rerender(
        <CalculatorCtaBlockEditor
          block={getDynamicBlock('calculator_cta')}
          onSettingChange={onSettingChange}
        />,
      );

      expect(screen.getByLabelText('Calculator title').value).toBe('Draft calculator title');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Draft calculator title');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('commits calculator-cta text drafts on blur without waiting for debounce', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      render(
        <CalculatorCtaBlockEditor
          block={getDynamicBlock('calculator_cta')}
          onSettingChange={onSettingChange}
        />,
      );

      const bodyInput = screen.getByLabelText('Calculator body');
      fireEvent.change(bodyInput, {
        target: { value: 'Draft calculator body copy' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('body', 'Draft calculator body copy');

      fireEvent.blur(bodyInput);

      expect(onSettingChange).toHaveBeenCalledWith('body', 'Draft calculator body copy');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('renders the migrated rates editor note instead of the generic field grid blank state', () => {
    const block = getDynamicBlock('rates');

    render(
      <RatesBlockEditor
        block={block}
        pathname="/rates"
      />,
    );

    expect(screen.getByText('Table rows and published rates are managed in the Rates admin screen.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open rates admin ↗' })).toBeTruthy();
  });

  it('wires intro block controls', () => {
    const block = getDynamicBlock('intro');
    const onSettingChange = vi.fn();

    render(<IntroBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.change(screen.getByLabelText('Intro heading line spacing number'), {
      target: { value: '1.22' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('lineSpacing', 1.22);
  });

  it('keeps intro drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(
        <IntroBlockEditor
          block={getDynamicBlock('intro')}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      const extraLineInput = screen.getByLabelText('Accent line (optional)');
      fireEvent.change(extraLineInput, {
        target: { value: 'Draft accent line' },
      });

      expect(extraLineInput.value).toBe('Draft accent line');
      expect(onSettingChange).not.toHaveBeenCalledWith('extraLine', 'Draft accent line');

      rerender(
        <IntroBlockEditor
          block={getDynamicBlock('intro')}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      expect(screen.getByLabelText('Accent line (optional)').value).toBe('Draft accent line');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('extraLine', 'Draft accent line');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps intro heading drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(
        <IntroBlockEditor
          block={getDynamicBlock('intro')}
          onSettingChange={onSettingChange}
        />,
      );

      const headingInput = screen.getByLabelText('Heading text');
      fireEvent.change(headingInput, {
        target: { value: 'Draft intro heading' },
      });

      expect(headingInput.value).toBe('Draft intro heading');
      expect(onSettingChange).not.toHaveBeenCalledWith('heading', 'Draft intro heading');

      rerender(
        <IntroBlockEditor
          block={getDynamicBlock('intro')}
          onSettingChange={onSettingChange}
        />,
      );

      expect(screen.getByLabelText('Heading text').value).toBe('Draft intro heading');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('heading', 'Draft intro heading');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('commits intro body html drafts on blur without waiting for debounce', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { container } = render(
        <IntroBlockEditor
          block={getDynamicBlock('intro')}
          onSettingChange={onSettingChange}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'View HTML (advanced)' }));

      const sourceInput = container.querySelector('.admin-html-editor-source');
      if (!sourceInput) {
        throw new Error('Missing intro HTML source editor.');
      }

      fireEvent.change(sourceInput, {
        target: { value: '<p>Draft intro body copy</p>' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('bodyHtml', '<p>Draft intro body copy</p>');

      fireEvent.blur(sourceInput);

      expect(onSettingChange).toHaveBeenCalledWith('bodyHtml', '<p>Draft intro body copy</p>');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires the intro body palette to the base body color', () => {
    const block = getDynamicBlock('intro');
    const onSettingChange = vi.fn();

    render(<IntroBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Text color' }))
        .getByRole('radio', { name: 'Mango' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith('bodyColorClassName', 'is-mango');
  });

  it('keeps intro button links on the buffered route-sync path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('intro');
    const onSettingChange = vi.fn();
    const button1UrlField = getField(block, 'button1LinkJson');
    const button2UrlField = getField(block, 'button2LinkJson');

    try {
      render(
        <IntroBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      fireEvent.change(getRouteLinkTextInput(button1UrlField.label), {
        target: { value: '/contact-us' },
      });
      fireEvent.change(getRouteLinkTextInput(button2UrlField.label), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('button1LinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');
      expect(onSettingChange).toHaveBeenCalledWith('button2LinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('button1PageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('button2PageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('button1Url', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('button2Url', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires billboard block controls', () => {
    const block = getDynamicBlock('billboard');
    const onSettingChange = vi.fn();

    render(<BillboardBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.change(screen.getByLabelText(/Line Height/i), { target: { value: '1.15' } });

    expect(onSettingChange).toHaveBeenCalledWith('lineSpacing', 1.15);

    fireEvent.click(screen.getByRole('button', { name: 'Layout' }));
    fireEvent.change(screen.getByLabelText('Content width'), {
      target: { value: '1040' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('contentMaxWidthPx', 1040);
  });

  it('keeps billboard text drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(
        <BillboardBlockEditor
          block={getDynamicBlock('billboard')}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      const titleInput = screen.getByLabelText('Title');
      fireEvent.change(titleInput, {
        target: { value: 'Draft billboard title' },
      });

      expect(titleInput.value).toBe('Draft billboard title');
      expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Draft billboard title');

      rerender(
        <BillboardBlockEditor
          block={getDynamicBlock('billboard')}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      expect(screen.getByLabelText('Title').value).toBe('Draft billboard title');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Draft billboard title');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps the billboard rich body draft stable when the committed snapshot catches up', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();
    const initialBlock = getDynamicBlock('billboard');
    initialBlock.settings.bodyHtml = '<p>Alpha bravo</p>';

    try {
      const { rerender } = render(
        <BillboardBlockEditor
          block={initialBlock}
          onSettingChange={onSettingChange}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
      const bodyInput = screen.getByRole('textbox', { name: 'Body HTML' });
      bodyInput.innerHTML = '<p>Alpha ravo</p>';
      fireEvent.input(bodyInput);

      expect(bodyInput.innerHTML).toBe('<p>Alpha ravo</p>');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      const committedBlock = structuredClone(initialBlock);
      committedBlock.settings.bodyHtml = '<p>Alpha ravo</p>';
      rerender(
        <BillboardBlockEditor
          block={committedBlock}
          onSettingChange={onSettingChange}
        />,
      );

      expect(screen.getByRole('textbox', { name: 'Body HTML' }).innerHTML).toBe('<p>Alpha ravo</p>');

      rerender(
        <BillboardBlockEditor
          block={initialBlock}
          onSettingChange={onSettingChange}
        />,
      );

      expect(screen.getByRole('textbox', { name: 'Body HTML' }).innerHTML).toBe('<p>Alpha ravo</p>');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('edits billboard body HTML through the rich editor surface', () => {
    const onSettingChange = vi.fn();
    const block = getDynamicBlock('billboard');
    block.settings.bodyHtml = '<p>Alpha bravo</p>';

    render(<BillboardBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    const bodyInput = screen.getByRole('textbox', { name: 'Body HTML' });
    bodyInput.innerHTML = '<p>Alph bravo</p>';
    fireEvent.input(bodyInput);
    fireEvent.blur(bodyInput);

    expect(bodyInput.innerHTML).toBe('<p>Alph bravo</p>');
    expect(onSettingChange).toHaveBeenCalledWith('bodyHtml', '<p>Alph bravo</p>');
  });

  it('commits billboard body drafts on blur without waiting for debounce', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      render(<BillboardBlockEditor block={getDynamicBlock('billboard')} onSettingChange={onSettingChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
      const bodyInput = screen.getByLabelText('Lead copy');
      fireEvent.change(bodyInput, {
        target: { value: 'Draft billboard lead copy' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('body', 'Draft billboard lead copy');

      fireEvent.blur(bodyInput);

      expect(onSettingChange).toHaveBeenCalledWith('body', 'Draft billboard lead copy');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires billboard title and body color swatches to the expected settings', () => {
    const block = getDynamicBlock('billboard');
    const onSettingChange = vi.fn();

    render(<BillboardBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Billboard title color' }))
        .getByRole('radio', { name: 'Super Grey' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Text color' }))
        .getByRole('radio', { name: 'Super Grey' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith('titleClassName', 'is-super-grey');
    expect(onSettingChange).toHaveBeenCalledWith('bodyColorClassName', 'is-super-grey');
  });

  it('treats the billboard title swatch row as a selection color control when title text is selected', () => {
    const block = getDynamicBlock('billboard');
    block.settings.title = 'Vision fuel';
    const onSettingChange = vi.fn();

    render(<BillboardBlockEditor block={block} onSettingChange={onSettingChange} />);

    const titleInput = screen.getByLabelText('Title');
    titleInput.focus();
    titleInput.setSelectionRange(7, 11);
    fireEvent.select(titleInput);

    fireEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Billboard title color' }))
        .getByRole('radio', { name: 'Super Grey' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith(
      'titleHighlightsJson',
      '[{"start":7,"end":11,"className":"is-super-grey","text":"fuel"}]',
    );
    expect(onSettingChange).not.toHaveBeenCalledWith('titleClassName', 'is-super-grey');
  });

  it('keeps billboard button links on the buffered route-sync path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('billboard');
    const onSettingChange = vi.fn();

    try {
      render(
        <BillboardBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
      fireEvent.change(screen.getByLabelText('Button URL/path'), {
        target: { value: '/contact-us' },
      });
      fireEvent.change(screen.getByLabelText('Button 2 URL/path'), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('buttonLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');
      expect(onSettingChange).toHaveBeenCalledWith('button2LinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('buttonPageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('button2PageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('buttonUrl', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('button2Url', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires CTA form controls', () => {
    const block = getDynamicBlock('cta_form');
    const onSettingChange = vi.fn();

    render(<CtaFormBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.change(screen.getByLabelText('Field 1 type'), {
      target: { value: 'checkbox' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('fieldsJson', expect.stringContaining('"type":"checkbox"'));
    expect(onSettingChange).not.toHaveBeenCalledWith('field1Type', 'checkbox');
  });

  it('keeps CTA form editable fields canonical while slot controls stay generated mirrors', () => {
    const block = getDynamicBlock('cta_form');
    const editableFieldIds = (Array.isArray(block.editableFields) ? block.editableFields : []).map((field) => field.id);

    expect(editableFieldIds).toContain('fieldsJson');
    expect(editableFieldIds).not.toContain('field5Label');
    expect(editableFieldIds).not.toContain('step1FieldsJson');
    expect(editableFieldIds).not.toContain('step2FieldsJson');
    expect(editableFieldIds).not.toContain('step3FieldsJson');
  });

  it('keeps CTA form slot drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('cta_form');
    const onSettingChange = vi.fn();
    const fieldLabel = 'Field 1 label';

    try {
      const { rerender } = render(<CtaFormBlockEditor block={block} onSettingChange={onSettingChange} />);

      const labelInput = screen.getByLabelText(fieldLabel);
      fireEvent.change(labelInput, {
        target: { value: 'Preferred contact method' },
      });

      expect(labelInput.value).toBe('Preferred contact method');
      expect(onSettingChange).not.toHaveBeenCalledWith('field1Label', 'Preferred contact method');

      rerender(<CtaFormBlockEditor block={getDynamicBlock('cta_form')} onSettingChange={onSettingChange} />);

      expect(screen.getByLabelText(fieldLabel).value).toBe('Preferred contact method');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('fieldsJson', expect.stringContaining('"label":"Preferred contact method"'));
      expect(onSettingChange).not.toHaveBeenCalledWith('field1Label', 'Preferred contact method');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('lets admins add CTA fields and enable contact preference', () => {
    const onSettingChange = vi.fn();
    const block = getDynamicBlock('cta_form');
    block.settings = {
      ...block.settings,
      fieldsJson: '',
    };

    render(<CtaFormBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add field' }));
    expect(onSettingChange).toHaveBeenCalledWith('fieldsJson', expect.stringContaining('"label":"Field 1"'));
    expect(onSettingChange).not.toHaveBeenCalledWith('field4Enabled', true);

    fireEvent.click(screen.getByLabelText('Ask for contact preference'));
    expect(onSettingChange).toHaveBeenCalledWith('includeContactPreference', true);
  });

  it('commits CTA form lead copy drafts on blur without waiting for debounce', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { container } = render(<CtaFormBlockEditor block={getDynamicBlock('cta_form')} onSettingChange={onSettingChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'View HTML (advanced)' }));

      const sourceInput = container.querySelector('.admin-html-editor-source');
      if (!sourceInput) {
        throw new Error('Missing CTA form HTML source editor.');
      }

      fireEvent.change(sourceInput, {
        target: { value: '<p>Draft CTA form lead copy</p>' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('bodyHtml', '<p>Draft CTA form lead copy</p>');

      fireEvent.blur(sourceInput);

      expect(onSettingChange).toHaveBeenCalledWith('bodyHtml', '<p>Draft CTA form lead copy</p>');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires newsletter controls', () => {
    const block = getDynamicBlock('newsletter');
    const formIdField = getField(block, 'formId');
    const onSettingChange = vi.fn();

    render(<NewsletterBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.change(screen.getByLabelText(formIdField.label), {
      target: { value: 'test-form-id' },
    });

    expect(onSettingChange).toHaveBeenLastCalledWith('formId', 'test-form-id');
  });

  it('matches newsletter heading preview text tone to the block settings', () => {
    const block = getDynamicBlock('newsletter');
    const onSettingChange = vi.fn();

    render(<NewsletterBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.getByText(block.settings.title).className).toContain('is-white');
  });

  it('lets explicit newsletter heading swatch color override the text tone in preview', () => {
    const block = getDynamicBlock('newsletter');
    const onSettingChange = vi.fn();
    block.settings.textTone = 'white';
    block.settings.titleClassName = 'is-atlantean';

    render(<NewsletterBlockEditor block={block} onSettingChange={onSettingChange} />);

    const previewHeading = screen.getByText(block.settings.title);
    expect(previewHeading.className).toContain('is-atlantean');
    expect(previewHeading.className).not.toContain('is-white');
  });

  it('uses the compact html editor for newsletter body copy', () => {
    const block = getDynamicBlock('newsletter');
    const onSettingChange = vi.fn();

    const { container } = render(<NewsletterBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(container.querySelector('.admin-html-editor.is-compact')).toBeTruthy();
  });

  it('wires testimonials controls', () => {
    const block = getDynamicBlock('testimonials');
    const onSettingChange = vi.fn();
    const expectedIds = defaultTestimonialsLibrary.slice(0, 3).map((item) => item.id).join(',');

    render(
      <TestimonialsBlockEditor
        block={block}
        selectedPath="/services/loans"
        onSettingChange={onSettingChange}
        testimonialsLibrary={defaultTestimonialsLibrary}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Use first 3' }));

    expect(onSettingChange).toHaveBeenCalledWith('selectedIdsCsv', expectedIds);
  });

  it('wires grid block controls', () => {
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();

    render(<GridBlockEditor block={block} onSettingChange={onSettingChange} />);
    onSettingChange.mockClear();

    fireEvent.click(screen.getByText('Card 1').closest('button'));
    expect(screen.queryByRole('button', { name: 'Clear Card 1 line color override' })).toBeNull();
    expect(screen.getByLabelText('Card 1 title')).toBeTruthy();
  });

  it('shows grid heading spans inline with a clear-spans action and keeps intro body under the heading editor', () => {
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();
    block.settings.title = 'Grid intro heading';
    block.settings.titleHighlightsJson = '[{"start":5,"end":10,"className":"is-mango","text":"intro"}]';

    const { container } = render(<GridBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.queryByRole('button', { name: /show span details/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear spans' })).toBeTruthy();
    expect(container.querySelector('.admin-grid-heading-editor .admin-hero-inline-span-chip-list')).toBeTruthy();
    expect(container.querySelector('.admin-grid-heading-editor .admin-grid-body-editor .admin-html-editor')).toBeTruthy();
  });

  it('does not render placeholder heading text in the grid preview when the intro heading is empty', () => {
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();
    block.settings.title = '';
    block.settings.titleHighlightsJson = '';

    const { container } = render(<GridBlockEditor block={block} onSettingChange={onSettingChange} />);
    const preview = container.querySelector('.admin-grid-heading-editor .admin-color-text-preview');

    expect(preview).toBeTruthy();
    expect(preview.textContent).toBe('');
    expect(screen.queryByText('Grid heading')).toBeNull();
  });

  it('keeps shared heading highlight actions aligned with the local grid heading draft', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();
    block.settings.title = 'Grid intro heading';
    block.settings.titleHighlightsJson = '';

    try {
      const { container } = render(<GridBlockEditor block={block} onSettingChange={onSettingChange} />);
      const headingEditor = container.querySelector('.admin-grid-heading-editor');
      const headingInput = screen.getByLabelText('Grid intro heading text');
      if (!headingEditor) {
        throw new Error('Missing grid heading editor.');
      }

      fireEvent.change(headingInput, {
        target: { value: 'Grid heading draft' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Grid heading draft');

      headingInput.focus();
      headingInput.setSelectionRange(5, 12);
      fireEvent.select(headingInput);
      fireEvent.click(within(headingEditor).getByRole('radio', { name: 'Sandstone' }));

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Grid heading draft');
      expect(onSettingChange).toHaveBeenCalledWith(
        'titleHighlightsJson',
        expect.stringContaining('"text":"heading"'),
      );
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires services grid controls through the migrated services grid editor', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('services_grid');
    const onSettingChange = vi.fn();

    try {
      render(
        <ServicesGridBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ label: 'Services', value: '/services' }]}
        />,
      );

      fireEvent.change(screen.getByLabelText('Services grid heading'), {
        target: { value: 'Guided next steps.' },
      });
      fireEvent.change(screen.getByLabelText('Card title size (rem)'), {
        target: { value: '2.3' },
      });
      expect(onSettingChange).toHaveBeenCalledWith('cardTitleSizeRem', 2.3);
      fireEvent.click(screen.getByText('Card 1').closest('button'));
      fireEvent.change(screen.getByLabelText('Card 1 title'), {
        target: { value: 'Church Loans' },
      });
      fireEvent.change(screen.getByLabelText('Browse label'), {
        target: { value: 'See every service' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('heading', 'Guided next steps.');
      expect(onSettingChange).not.toHaveBeenCalledWith('card1Title', 'Church Loans');
      expect(onSettingChange).not.toHaveBeenCalledWith('browseLabel', 'See every service');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('heading', 'Guided next steps.');
      expect(onSettingChange).toHaveBeenCalledWith('card1Title', 'Church Loans');
      expect(onSettingChange).toHaveBeenCalledWith('browseLabel', 'See every service');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps services-grid drafts stable through stale upstream rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();
    const routeOptions = [{ title: 'Services', path: '/services' }];
    const { rerender } = render(
      <ServicesGridBlockEditor
        block={getDynamicBlock('services_grid')}
        onSettingChange={onSettingChange}
        routeOptions={routeOptions}
      />,
    );

    try {
      const headingInput = screen.getByLabelText('Services grid heading');
      fireEvent.change(headingInput, {
        target: { value: 'Draft services heading' },
      });

      expect(headingInput.value).toBe('Draft services heading');
      expect(onSettingChange).not.toHaveBeenCalledWith('heading', 'Draft services heading');

      rerender(
        <ServicesGridBlockEditor
          block={getDynamicBlock('services_grid')}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
        />,
      );

      expect(screen.getByLabelText('Services grid heading').value).toBe('Draft services heading');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('heading', 'Draft services heading');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps services-grid browse links on the route-link editor control path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('services_grid');
    const onSettingChange = vi.fn();
    const browsePathField = getField(block, 'browseLinkJson');

    try {
      render(
        <ServicesGridBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ path: '/services/insurance', title: 'Insurance' }]}
        />,
      );

      fireEvent.change(getRouteLinkTextInput(browsePathField.label), {
        target: { value: '/services/insurance' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('browseLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/services/insurance"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('browsePageRef', '/services/insurance');
      expect(onSettingChange).not.toHaveBeenCalledWith('browsePath', '/services/insurance');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('shows only existing services-grid cards until the next one is explicitly added', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('services_grid');
    const onSettingChange = vi.fn();
    block.settings.card3Title = '';
    block.settings.card3Path = '';
    block.settings.card3PageRef = '';
    block.settings.card3ImageUrl = '';
    block.settings.card3Action = '';
    block.settings.card3Featured = false;
    block.settings.card4Title = '';
    block.settings.card4Path = '';
    block.settings.card4PageRef = '';
    block.settings.card4ImageUrl = '';
    block.settings.card4Action = '';
    block.settings.card4Featured = false;
    block.settings.card5Title = '';
    block.settings.card5Path = '';
    block.settings.card5PageRef = '';
    block.settings.card5ImageUrl = '';
    block.settings.card5Action = '';
    block.settings.card5Featured = false;
    block.settings.card6Title = '';
    block.settings.card6Path = '';
    block.settings.card6PageRef = '';
    block.settings.card6ImageUrl = '';
    block.settings.card6Action = '';
    block.settings.card6Featured = false;

    try {
      const { container } = render(<ServicesGridBlockEditor block={block} onSettingChange={onSettingChange} routeOptions={[]} />);

      const progressiveLabels = Array.from(container.querySelectorAll('.admin-progressive-slot-kicker')).map((node) => node.textContent);
      expect(progressiveLabels).toContain('Card 1');
      expect(progressiveLabels).toContain('Card 2');
      expect(progressiveLabels).not.toContain('Card 3');

      fireEvent.click(screen.getByRole('button', { name: 'Add card 3' }));

      expect(Array.from(container.querySelectorAll('.admin-progressive-slot-kicker')).map((node) => node.textContent)).toContain('Card 3');

      fireEvent.change(screen.getByLabelText('Card 3 title'), {
        target: { value: 'Insurance' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('card3Title', 'Insurance');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('card3Title', 'Insurance');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps grid title/body tone palettes safe on light backgrounds', () => {
    const block = getDynamicBlock('card_grid');
    block.settings.bgTone = 'white';
    block.settings.titleTone = 'white';
    block.settings.bodyTone = 'white';
    const onSettingChange = vi.fn();

    render(<GridBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.getByText('Grid intro heading')).toBeTruthy();

    const titlePalette = screen.getByRole('radiogroup', { name: 'Card title color' });
    const bodyPalette = screen.getByRole('radiogroup', { name: 'Body color' });

    expect(within(titlePalette).queryByRole('radio', { name: 'White' })).toBeNull();
    expect(within(bodyPalette).queryByRole('radio', { name: 'White' })).toBeNull();
    expect(onSettingChange).toHaveBeenCalledWith('titleTone', 'super-grey');
    expect(onSettingChange).toHaveBeenCalledWith('bodyTone', 'super-grey');
  });

  it('keeps grid title/body tone palettes on white contrast defaults for dark backgrounds', () => {
    const block = getDynamicBlock('card_grid');
    block.settings.bgTone = 'blue';
    block.settings.titleTone = 'super-grey';
    block.settings.bodyTone = 'super-grey';
    const onSettingChange = vi.fn();

    render(<GridBlockEditor block={block} onSettingChange={onSettingChange} />);

    const titlePalette = screen.getByRole('radiogroup', { name: 'Card title color' });
    const bodyPalette = screen.getByRole('radiogroup', { name: 'Body color' });

    expect(within(titlePalette).queryByRole('radio', { name: 'Super Grey' })).toBeNull();
    expect(within(bodyPalette).queryByRole('radio', { name: 'Super Grey' })).toBeNull();
    expect(within(titlePalette).getByRole('radio', { name: 'White' })).toBeTruthy();
    expect(within(bodyPalette).getByRole('radio', { name: 'White' })).toBeTruthy();
    expect(onSettingChange).toHaveBeenCalledWith('titleTone', 'white');
    expect(onSettingChange).toHaveBeenCalledWith('bodyTone', 'white');
  });

  it('shows only existing grid cards until the next one is explicitly added', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();
    block.settings.card3Title = '';
    block.settings.card3Body = '';
    block.settings.card4Title = '';
    block.settings.card4Body = '';
    block.settings.card5Title = '';
    block.settings.card5Body = '';
    block.settings.card6Title = '';
    block.settings.card6Body = '';
    block.settings.card7Title = '';
    block.settings.card7Body = '';
    block.settings.card8Title = '';
    block.settings.card8Body = '';

    try {
      const { container } = render(<GridBlockEditor block={block} onSettingChange={onSettingChange} />);

      const progressiveLabels = Array.from(container.querySelectorAll('.admin-progressive-slot-kicker')).map((node) => node.textContent);
      expect(progressiveLabels).toContain('Card 1');
      expect(progressiveLabels).toContain('Card 2');
      expect(progressiveLabels).not.toContain('Card 3');

      fireEvent.click(screen.getByRole('button', { name: 'Add card 3' }));

      expect(Array.from(container.querySelectorAll('.admin-progressive-slot-kicker')).map((node) => node.textContent)).toContain('Card 3');

      fireEvent.change(screen.getByLabelText('Card 3 title'), {
        target: { value: 'Card title three' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('card3Title', 'Card title three');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('card3Title', 'Card title three');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps grid card drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();
    const routeOptions = [{ title: 'Contact us', path: '/contact-us' }];

    try {
      const { rerender } = render(
        <GridBlockEditor
          block={getDynamicBlock('card_grid')}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
        />,
      );

      fireEvent.click(screen.getByText('Card 1').closest('button'));

      const titleInput = screen.getByLabelText('Card 1 title');
      fireEvent.change(titleInput, {
        target: { value: 'Drafted grid card title' },
      });

      expect(titleInput.value).toBe('Drafted grid card title');
      expect(onSettingChange).not.toHaveBeenCalledWith('card1Title', 'Drafted grid card title');

      rerender(
        <GridBlockEditor
          block={getDynamicBlock('card_grid')}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
        />,
      );

      expect(screen.getByLabelText('Card 1 title').value).toBe('Drafted grid card title');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('card1Title', 'Drafted grid card title');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('commits grid card text drafts on blur without waiting for debounce', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      render(<GridBlockEditor block={getDynamicBlock('card_grid')} onSettingChange={onSettingChange} routeOptions={[]} />);

      fireEvent.click(screen.getByText('Card 1').closest('button'));

      const bodyInput = screen.getByLabelText('Card 1 body');
      fireEvent.change(bodyInput, {
        target: { value: 'Drafted grid card body' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('card1Body', 'Drafted grid card body');

      fireEvent.blur(bodyInput);

      expect(onSettingChange).toHaveBeenCalledWith('card1Body', 'Drafted grid card body');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps grid card action links on the route-link editor control path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();
    const buttonUrlField = getField(block, 'card1ButtonLinkJson');

    try {
      render(
        <GridBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      fireEvent.click(screen.getByText('Card 1').closest('button'));
      fireEvent.change(getRouteLinkTextInput(buttonUrlField.label), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('card1ButtonLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('card1ButtonPageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('card1ButtonUrl', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('packs visible grid cards into the three-up progressive card layout without auto-expanding the first one', () => {
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();
    block.settings.card3Title = 'Third card';
    block.settings.card3Body = 'Third body';
    block.settings.card4Title = '';
    block.settings.card4Body = '';
    block.settings.card5Title = '';
    block.settings.card5Body = '';
    block.settings.card6Title = '';
    block.settings.card6Body = '';
    block.settings.card7Title = '';
    block.settings.card7Body = '';
    block.settings.card8Title = '';
    block.settings.card8Body = '';

    const { container } = render(<GridBlockEditor block={block} onSettingChange={onSettingChange} />);
    const gridCardToggles = Array.from(container.querySelectorAll('.admin-progressive-slot-toggle'));

    expect(container.querySelector('.admin-progressive-slot-list--grid-cards')).toBeTruthy();
    expect(container.querySelector('.admin-progressive-slot-card.is-expanded')).toBeNull();
    expect(gridCardToggles.length).toBeGreaterThanOrEqual(2);

    fireEvent.click(gridCardToggles[1]);

    expect(screen.getByLabelText('Card 2 title')).toBeTruthy();
  });

  it('keeps a grid card visible in the editor when it still has a configured action', () => {
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();
    block.settings.card2Title = '';
    block.settings.card2Body = '';
    block.settings.card2ButtonLabel = 'Learn more';
    block.settings.card2ButtonPageRef = '/services';
    block.settings.card3Title = '';
    block.settings.card3Body = '';
    block.settings.card3ButtonLabel = '';
    block.settings.card3ButtonPageRef = '';
    block.settings.card3ButtonUrl = '';
    block.settings.card4Title = '';
    block.settings.card4Body = '';
    block.settings.card5Title = '';
    block.settings.card5Body = '';
    block.settings.card6Title = '';
    block.settings.card6Body = '';
    block.settings.card7Title = '';
    block.settings.card7Body = '';
    block.settings.card8Title = '';
    block.settings.card8Body = '';

    const { container } = render(<GridBlockEditor block={block} onSettingChange={onSettingChange} routeOptions={[]} />);

    const progressiveLabels = Array.from(container.querySelectorAll('.admin-progressive-slot-kicker')).map((node) => node.textContent);
    expect(progressiveLabels).toContain('Card 2');
  });

  it('keeps a grid card visible in the editor when it still has configured resource links', () => {
    const block = getDynamicBlock('card_grid');
    const onSettingChange = vi.fn();
    block.settings.card2Title = '';
    block.settings.card2Body = '';
    block.settings.card2ButtonLabel = '';
    block.settings.card2ButtonPageRef = '';
    block.settings.card2ButtonUrl = '';
    block.settings.card2Button2Label = '';
    block.settings.card2Button2PageRef = '';
    block.settings.card2Button2Url = '';
    block.settings.card2LinksJson = JSON.stringify([
      { label: 'Fund overview', kind: 'external', href: 'https://example.com/fund-overview.pdf', openInNewWindow: true },
    ]);
    block.settings.card3Title = '';
    block.settings.card3Body = '';
    block.settings.card3LinksJson = '';
    block.settings.card3AccordionsJson = '';
    block.settings.card4Title = '';
    block.settings.card4Body = '';
    block.settings.card5Title = '';
    block.settings.card5Body = '';
    block.settings.card6Title = '';
    block.settings.card6Body = '';
    block.settings.card7Title = '';
    block.settings.card7Body = '';
    block.settings.card8Title = '';
    block.settings.card8Body = '';

    const { container } = render(<GridBlockEditor block={block} onSettingChange={onSettingChange} routeOptions={[]} />);

    const progressiveLabels = Array.from(container.querySelectorAll('.admin-progressive-slot-kicker')).map((node) => node.textContent);
    expect(progressiveLabels).toContain('Card 2');
    expect(container.textContent).toContain('1 direct links');
  });

  it('keeps the migrated investment options section on the page content editor', () => {
    const block = cloneBlock(
      (contentBlockBlueprintsByPath['/services/retirement/403b'] || [])
        .find((entry) => entry?.id === 'investment_strategy_options'),
    );
    const onSettingChange = vi.fn();

    render(<PageContentBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(block?.kind).toBe('content');
    expect(block?.settings?.sectionClassName).toBe('retirement-403b-native-strategy-feature');
    expect(screen.queryByText('Card Grid Preset')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Advanced layout' }));
    fireEvent.change(screen.getByLabelText('Content max width (px)'), {
      target: { value: '1200' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('contentMaxWidthPx', 1200);
  });

  it('bounds the eligibility preset to plain-text cards without card-level actions or resource stacks', () => {
    const block = cloneBlock(
      (contentBlockBlueprintsByPath['/services/retirement/403b'] || [])
        .find((entry) => entry?.id === 'who_qualifies'),
    );
    const onSettingChange = vi.fn();

    render(<GridBlockEditor block={block} onSettingChange={onSettingChange} routeOptions={[]} />);

    expect(screen.queryByRole('button', { name: 'Add card 4' })).toBeNull();

    fireEvent.click(screen.getByText('Card 1').closest('button'));

    expect(screen.queryByLabelText('Card 1 button label')).toBeNull();
    expect(screen.queryByLabelText('Card 1 button 2 label')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add direct link' })).toBeNull();
  });

  it('bounds the step-card preset to primary actions only', () => {
    const block = cloneBlock(
      (contentBlockBlueprintsByPath['/services/retirement/403b'] || [])
        .find((entry) => entry?.id === 'loan_apply'),
    );
    const onSettingChange = vi.fn();

    render(<GridBlockEditor block={block} onSettingChange={onSettingChange} routeOptions={[]} />);

    expect(screen.queryByRole('button', { name: 'Add card 4' })).toBeNull();

    fireEvent.click(screen.getByText('Card 1').closest('button'));

    expect(screen.getByLabelText('Card 1 button label')).toBeTruthy();
    expect(screen.queryByLabelText('Card 1 button 2 label')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add direct link' })).toBeNull();
  });

  it('keeps columns layout controls wired without a preset banner', () => {
    const block = getDynamicBlock('columns');
    const widthField = getField(block, 'contentWidth');
    const nextOption = widthField.options.find((option) => option.value !== block.settings.contentWidth);
    const onSettingChange = vi.fn();

    render(<ColumnsBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.queryByText('Columns Preset')).toBeNull();
    expect(screen.queryByText('Flexible columns')).toBeNull();
    expect(screen.queryByText('General-purpose columns block for text and photo layouts.')).toBeNull();
    expect(screen.queryByLabelText('Columns style')).toBeNull();
    expect(screen.getByLabelText('Column 1 body').getAttribute('rows')).toBe('6');

    fireEvent.change(screen.getByLabelText(widthField.label), {
      target: { value: nextOption.value },
    });

    expect(onSettingChange).toHaveBeenCalledWith('contentWidth', nextOption.value);
  });

  it('matches columns heading preview contrast to dark background defaults', () => {
    const block = getDynamicBlock('columns');
    const onSettingChange = vi.fn();
    block.settings.bgTone = 'blue';
    block.settings.titleClassName = '';

    const { container } = render(<ColumnsBlockEditor block={block} onSettingChange={onSettingChange} />);

    const previewHeading = container.querySelector('.admin-color-text-preview');
    expect(previewHeading.className).toContain('is-white');
  });

  it('keeps explicit columns heading swatch color over dark background preview defaults', () => {
    const block = getDynamicBlock('columns');
    const onSettingChange = vi.fn();
    block.settings.bgTone = 'blue';
    block.settings.titleClassName = 'is-super-grey';

    const { container } = render(<ColumnsBlockEditor block={block} onSettingChange={onSettingChange} />);

    const previewHeading = container.querySelector('.admin-color-text-preview');
    expect(previewHeading.className).toContain('is-super-grey');
    expect(previewHeading.className).not.toContain('is-white');
  });

  it('renders sandstone as an explicit columns heading preview color and highlight color', () => {
    const block = getDynamicBlock('columns');
    const onSettingChange = vi.fn();
    block.settings.title = 'Housing allowance';
    block.settings.titleClassName = 'is-sandstone';
    block.settings.titleHighlightsJson = '[{"start":8,"end":17,"className":"is-sandstone","text":"allowance"}]';

    const { container } = render(<ColumnsBlockEditor block={block} onSettingChange={onSettingChange} />);

    const previewHeading = container.querySelector('.admin-color-text-preview');
    const previewHighlight = container.querySelector('.admin-color-text-preview mark.is-sandstone');
    expect(previewHeading.className).toContain('is-sandstone');
    expect(previewHighlight?.textContent).toBe('allowance');
  });

  it('only shows active column editors and adds the next one explicitly', () => {
    const block = getDynamicBlock('columns');
    block.settings.columns = 'two';
    const onSettingChange = vi.fn();

    render(<ColumnsBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.getByRole('heading', { name: 'Column 1' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Column 2' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Column 3' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add column' }));

    expect(onSettingChange).toHaveBeenCalledWith('columns', 'three');
    expect(onSettingChange).toHaveBeenCalledWith('col3Enabled', true);
  });

  it('renames photo-column text fields to photo label and caption', () => {
    const block = getDynamicBlock('columns');
    block.settings.col1Type = 'photo';
    const onSettingChange = vi.fn();

    render(<ColumnsBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.getByLabelText('Column 1 photo label')).toBeTruthy();
    expect(screen.getByLabelText('Column 1 photo caption')).toBeTruthy();
  });

  it('keeps columns slot drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('columns');
    const onSettingChange = vi.fn();
    const routeOptions = [{ title: 'Contact us', path: '/contact-us' }];

    try {
      const { rerender } = render(
        <ColumnsBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
        />,
      );

      const titleInput = screen.getByLabelText('Column 1 title');
      fireEvent.change(titleInput, {
        target: { value: 'Draft column title' },
      });

      expect(titleInput.value).toBe('Draft column title');
      expect(onSettingChange).not.toHaveBeenCalledWith('col1Title', 'Draft column title');

      rerender(
        <ColumnsBlockEditor
          block={getDynamicBlock('columns')}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
        />,
      );

      expect(screen.getByLabelText('Column 1 title').value).toBe('Draft column title');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('col1Title', 'Draft column title');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('commits columns heading drafts on blur without waiting for debounce', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('columns');
    const onSettingChange = vi.fn();

    try {
      render(<ColumnsBlockEditor block={block} onSettingChange={onSettingChange} />);

      const headingInput = screen.getByLabelText('Columns heading text');
      fireEvent.change(headingInput, {
        target: { value: 'Draft columns heading' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Draft columns heading');

      fireEvent.blur(headingInput);

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Draft columns heading');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps columns action links on the route-link editor control path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('columns');
    const onSettingChange = vi.fn();
    const buttonUrlField = getField(block, 'col1ButtonLinkJson');

    try {
      render(
        <ColumnsBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      fireEvent.change(getRouteLinkTextInput(buttonUrlField.label), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('col1ButtonLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('col1ButtonPageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('col1ButtonUrl', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('bounds the value-cards columns preset to a fixed text-only three-column layout', () => {
    const block = cloneBlock(
      (contentBlockBlueprintsByPath['/services/loans'] || [])
        .find((entry) => entry?.id === 'value_cards'),
    );
    const onSettingChange = vi.fn();

    render(<ColumnsBlockEditor block={block} onSettingChange={onSettingChange} />);

    expect(screen.queryByText('Value cards')).toBeNull();
    expect(screen.queryByLabelText('Columns style')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add column' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove last column' })).toBeNull();
    expect(screen.queryByLabelText('Column 1 type')).toBeNull();
    expect(screen.queryByLabelText('Column 1 photo URL')).toBeNull();
    expect(screen.queryByLabelText('Column 1 button label')).toBeNull();
    expect(screen.getByLabelText('Column 1 title')).toBeTruthy();
    expect(screen.getByLabelText('Column 1 body')).toBeTruthy();
  });

  it('wires feature panel controls through the migrated feature panel editor', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('feature_panel');
    const onSettingChange = vi.fn();

    try {
      render(<FeaturePanelBlockEditor block={block} onSettingChange={onSettingChange} routeOptions={[]} />);

      fireEvent.change(screen.getByLabelText('Feature panel title'), {
        target: { value: 'Updated reserves title' },
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Updated reserves title');
      expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires split panel controls through the migrated split panel editor', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('split_panel');
    const onSettingChange = vi.fn();

    try {
      render(<SplitPanelBlockEditor block={block} onSettingChange={onSettingChange} routeOptions={[]} />);

      fireEvent.change(screen.getByLabelText('Left title'), {
        target: { value: 'Updated IRA title' },
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('leftTitle', 'Updated IRA title');
      expect(screen.getAllByRole('toolbar', { name: 'Article body formatting' }).length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Right title')).toBeTruthy();
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps feature panel text drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('feature_panel');
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(
        <FeaturePanelBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact Us', path: '/contact-us' }]}
        />,
      );

      const titleInput = screen.getByLabelText('Feature panel title');
      fireEvent.change(titleInput, {
        target: { value: 'Drafted feature title' },
      });

      expect(titleInput.value).toBe('Drafted feature title');
      expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Drafted feature title');

      rerender(
        <FeaturePanelBlockEditor
          block={getDynamicBlock('feature_panel')}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact Us', path: '/contact-us' }]}
        />,
      );

      expect(screen.getByLabelText('Feature panel title').value).toBe('Drafted feature title');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Drafted feature title');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps split panel action drafts buffered and preserves route ref sync', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('split_panel');
    const onSettingChange = vi.fn();

    try {
      render(
        <SplitPanelBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[
            { title: 'IRAs', path: '/services/retirement/iras' },
            { title: 'Contact Us', path: '/contact-us' },
          ]}
        />,
      );

      fireEvent.change(screen.getByLabelText('Left button URL / Path'), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('leftButtonLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');
      expect(onSettingChange).not.toHaveBeenCalledWith('leftButtonUrl', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('leftButtonPageRef', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires photo column controls through the migrated photo column editor', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('photo_column');
    const onSettingChange = vi.fn();

    try {
      render(<PhotoColumnBlockEditor block={block} onSettingChange={onSettingChange} routeOptions={[]} />);

      const titleInput = screen.getByLabelText('Photo label');
      fireEvent.change(titleInput, {
        target: { value: 'Updated mission team' },
      });
      expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Updated mission team');

      fireEvent.blur(titleInput);

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Updated mission team');
      expect(screen.getByLabelText('Photo caption')).toBeTruthy();
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps photo-column drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();
    const routeOptions = [{ title: 'Contact us', path: '/contact-us' }];

    try {
      const { rerender } = render(
        <PhotoColumnBlockEditor
          block={getDynamicBlock('photo_column')}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
        />,
      );

      const titleInput = screen.getByLabelText('Photo label');
      fireEvent.change(titleInput, {
        target: { value: 'Draft mission team label' },
      });

      expect(titleInput.value).toBe('Draft mission team label');
      expect(onSettingChange).not.toHaveBeenCalledWith('title', 'Draft mission team label');

      rerender(
        <PhotoColumnBlockEditor
          block={getDynamicBlock('photo_column')}
          onSettingChange={onSettingChange}
          routeOptions={routeOptions}
        />,
      );

      expect(screen.getByLabelText('Photo label').value).toBe('Draft mission team label');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('title', 'Draft mission team label');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps photo-column action links on the route-link editor control path', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('photo_column');
    const onSettingChange = vi.fn();
    const buttonUrlField = getField(block, 'buttonLinkJson');

    try {
      render(
        <PhotoColumnBlockEditor
          block={block}
          onSettingChange={onSettingChange}
          routeOptions={[{ title: 'Contact us', path: '/contact-us' }]}
        />,
      );

      fireEvent.change(getRouteLinkTextInput(buttonUrlField.label), {
        target: { value: '/contact-us' },
      });

      expect(onSettingChange).toHaveBeenCalledWith('buttonLinkJson', '{"kind":"internal","openInNewWindow":false,"to":"/contact-us"}');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).not.toHaveBeenCalledWith('buttonPageRef', '/contact-us');
      expect(onSettingChange).not.toHaveBeenCalledWith('buttonUrl', '/contact-us');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires request form controls through the dedicated request form editor', () => {
    vi.useFakeTimers();
    const block = getDynamicBlock('request_form');
    const onSettingChange = vi.fn();

    try {
      render(<RequestFormBlockEditor block={block} onSettingChange={onSettingChange} />);

      expect(screen.queryByText('Body HTML')).toBeNull();
      expect(screen.getByRole('button', { name: /step 1/i }).getAttribute('aria-expanded')).toBe('true');
      expect(screen.getByRole('button', { name: /step 2/i }).getAttribute('aria-expanded')).toBe('false');
      expect(screen.getByRole('button', { name: /step 3/i }).getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByRole('button', { name: /^step 4$/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /^step 5$/i })).toBeNull();
      expect(screen.getByRole('button', { name: 'Add step 4' })).toBeTruthy();
      expect(screen.getByLabelText('Step 1 title')).toBeTruthy();
      expect(screen.getByLabelText('Step 1 note')).toBeTruthy();
      expect(screen.getByLabelText('Step 1 alert')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /step 2/i }));
      expect(screen.getByLabelText('Step 2 field 1 label')).toBeTruthy();

      fireEvent.change(screen.getByLabelText('Step 1 field 1 label'), {
        target: { value: 'Primary contact first name' },
      });

      expect(onSettingChange).not.toHaveBeenCalledWith(
        'step1FieldsJson',
        expect.stringContaining('Primary contact first name'),
      );

      fireEvent.blur(screen.getByLabelText('Step 1 field 1 label'));

      expect(onSettingChange).toHaveBeenCalledWith(
        'step1FieldsJson',
        expect.stringContaining('Primary contact first name'),
      );

      fireEvent.click(screen.getByRole('button', { name: /step 2/i }));

      expect(screen.getByRole('button', { name: /step 2/i }).getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByLabelText('Step 2 field 1 label')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Add step 4' }));

      expect(onSettingChange).toHaveBeenCalledWith(
        'step4FieldsJson',
        expect.stringContaining('"id":"field1"'),
      );
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps request form lead-copy drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(<RequestFormBlockEditor block={getDynamicBlock('request_form')} onSettingChange={onSettingChange} />);

      const leadCopyInput = screen.getByLabelText('Lead Copy');
      fireEvent.change(leadCopyInput, {
        target: { value: 'Draft request form lead copy' },
      });

      expect(leadCopyInput.value).toBe('Draft request form lead copy');
      expect(onSettingChange).not.toHaveBeenCalledWith('subtitle', 'Draft request form lead copy');

      rerender(<RequestFormBlockEditor block={getDynamicBlock('request_form')} onSettingChange={onSettingChange} />);

      expect(screen.getByLabelText('Lead Copy').value).toBe('Draft request form lead copy');

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onSettingChange).toHaveBeenCalledWith('subtitle', 'Draft request form lead copy');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps request form step-field drafts stable through stale shared rerenders', () => {
    vi.useFakeTimers();
    const onSettingChange = vi.fn();

    try {
      const { rerender } = render(<RequestFormBlockEditor block={getDynamicBlock('request_form')} onSettingChange={onSettingChange} />);

      const fieldLabelInput = screen.getByLabelText('Step 1 field 1 label');
      fireEvent.change(fieldLabelInput, {
        target: { value: 'Primary contact first name' },
      });

      expect(fieldLabelInput.value).toBe('Primary contact first name');
      expect(onSettingChange).not.toHaveBeenCalledWith(
        'step1FieldsJson',
        expect.stringContaining('Primary contact first name'),
      );

      rerender(<RequestFormBlockEditor block={getDynamicBlock('request_form')} onSettingChange={onSettingChange} />);

      expect(screen.getByLabelText('Step 1 field 1 label').value).toBe('Primary contact first name');

      fireEvent.blur(screen.getByLabelText('Step 1 field 1 label'));

      expect(onSettingChange).toHaveBeenCalledWith(
        'step1FieldsJson',
        expect.stringContaining('Primary contact first name'),
      );
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('wires page content controls through the migrated page content editor', () => {
    const block = getDynamicBlock('content');
    const onSettingChange = vi.fn();

    render(<PageContentBlockEditor block={block} onSettingChange={onSettingChange} />);

    fireEvent.click(
      within(screen.getByRole('group', { name: 'Page content width presets' }))
        .getByRole('button', { name: 'Wide' }),
    );

    expect(onSettingChange).toHaveBeenCalledWith('contentMaxWidthPx', 1200);

    fireEvent.click(screen.getByRole('button', { name: 'Advanced layout' }));
    fireEvent.change(screen.getByLabelText('Content max width (px)'), {
      target: { value: '1140' },
    });

    expect(onSettingChange).toHaveBeenCalledWith('contentMaxWidthPx', 1140);
  });
});
