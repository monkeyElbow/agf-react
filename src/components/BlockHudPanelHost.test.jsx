import { createElement } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContentAdminContext } from '../context/ContentAdminContext';
import useLocalBlockDrafts from '../hooks/useLocalBlockDrafts';
import { LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS } from '../lib/contentAdminTiming';
import { getEditableFieldsForKind } from '../blocks/registry';
import BlockHudPanelHost from './BlockHudPanelHost';

function IntroHudLocalDraftProbe({
  blocks,
  commitBlockSettingsPatch = () => true,
}) {
  const { blocks: managedBlocks, stageLocalBlockSetting } = useLocalBlockDrafts({
    pathname: '/test',
    blocks,
    commitBlockSettingsPatch,
  });
  const block = managedBlocks.find((candidate) => candidate?.id === 'intro') || managedBlocks[0];

  return (
    <BlockHudPanelHost
      block={block}
      pathname="/test"
      onSettingChange={(settingKey, nextValue) => {
        stageLocalBlockSetting(block.id, settingKey, nextValue);
      }}
    />
  );
}

describe('BlockHudPanelHost', () => {
  it('routes CTA form HUD blocks through the reference CTA editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'cta_form',
        kind: 'cta_form',
        mode: 'dynamic',
        settings: {
          title: 'Let us help',
          bodyHtml: '<p>Lead copy</p>',
          fieldsJson: JSON.stringify([
            { id: 'name', label: 'Name', type: 'text', required: true },
          ]),
        },
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByRole('navigation', { name: 'CTA editor sections' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Heading' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Message + Submit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Form Fields' })).toBeTruthy();
  });

  it('routes card grid HUD blocks through the shared model rail and block options page', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'card-grid-flexible-cards',
        kind: 'card_grid',
        mode: 'dynamic',
        settings: {
          title: 'Flexible cards',
          bodyHtml: '<p>Starter copy</p>',
          bgTone: 'white',
          columns: 'three',
          cardStyle: 'none',
          card1Title: 'Starter card',
          card1Body: 'Starter card copy',
        },
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByRole('navigation', { name: 'Card Grid · Flexible cards editor sections' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cards' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Block options' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Block options' }).className).toContain('is-block-options');
    expect(screen.queryByRole('button', { name: 'Content' })).toBeNull();
    expect(screen.getAllByRole('region', { name: 'Block options' })).toHaveLength(1);
    expect(document.querySelector('.admin-card-grid-hud-group--heading')).toBeNull();
    expect(document.querySelector('.admin-card-grid-hud-group--appearance')).toBeTruthy();
    expect(document.querySelector('.admin-card-grid-hud-group--layout')).toBeTruthy();
    expect(document.querySelector('.admin-card-grid-hud-group--typography')).toBeTruthy();
    expect(document.querySelector('.admin-card-grid-hud-reference .admin-front-hud-swatch-row')).toBeTruthy();
    expect(screen.getByText('Card 1 body')).toBeTruthy();
    expect(document.querySelector('.admin-card-grid-hud-reference .admin-swatch-list')).toBeTruthy();
  });

  it('shows editable bullets inside each flexible card', () => {
    const onSettingChange = vi.fn();
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'qcd-card-grid',
        kind: 'card_grid',
        mode: 'dynamic',
        settings: {
          title: 'It starts here.',
          bgTone: 'white',
          columns: 'one',
          cardStyle: 'planned-giving-centered',
          card1Title: 'A few things to know',
          card1ListJson: JSON.stringify(['First requirement', 'Second requirement']),
        },
      },
      onSettingChange,
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Cards' }));

    const firstBullet = screen.getByLabelText('Card 1 bullets 1');
    expect(firstBullet.value).toBe('First requirement');
    fireEvent.change(firstBullet, { target: { value: 'Updated requirement' } });
    expect(onSettingChange).toHaveBeenCalledWith(
      'card1ListJson',
      JSON.stringify(['Updated requirement', 'Second requirement']),
    );
  });

  it('renders intro blocks with the HUD intro editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'intro',
        kind: 'intro',
        settings: {
          heading: 'Intro heading',
          bgTone: 'sand',
          textTone: 'dark',
        },
      },
      onSettingChange: vi.fn(),
    }));

    const backgroundPalette = screen.getByRole('radiogroup', { name: 'Intro background' });
    expect(backgroundPalette).toBeTruthy();
    expect(within(backgroundPalette).getByRole('radio', { name: 'Sand' })).toBeTruthy();
    expect(screen.getByText('Core Color')).toBeTruthy();
  });

  it('keeps intro accent line caret stable through stale HUD snapshots', () => {
    vi.useFakeTimers();
    const commitBlockSettingsPatch = vi.fn(() => true);
    const initialBlocks = [{
      id: 'intro',
      kind: 'intro',
      mode: 'dynamic',
      editableFields: getEditableFieldsForKind('intro', 'hud'),
      settings: {
        heading: 'Intro heading',
        extraLine: 'Start line',
        bgTone: 'sand',
        textTone: 'dark',
      },
    }];
    const firstCommitBlocks = [{
      ...initialBlocks[0],
      editableFields: initialBlocks[0].editableFields,
      settings: {
        ...initialBlocks[0].settings,
        extraLine: 'Vision fuel',
      },
    }];
    const secondCommitBlocks = [{
      ...initialBlocks[0],
      editableFields: initialBlocks[0].editableFields,
      settings: {
        ...initialBlocks[0].settings,
        extraLine: 'Vision fuel today',
      },
    }];

    const { rerender } = render(
      <IntroHudLocalDraftProbe
        blocks={initialBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    fireEvent.change(screen.getByLabelText('Accent Line'), {
      target: { value: 'Vision fuel' },
    });
    act(() => {
      vi.advanceTimersByTime(LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
    });

    rerender(
      <IntroHudLocalDraftProbe
        blocks={firstCommitBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    fireEvent.change(screen.getByLabelText('Accent Line'), {
      target: { value: 'Vision fuel today' },
    });
    act(() => {
      vi.advanceTimersByTime(LOCAL_BLOCK_DRAFT_IDLE_COMMIT_DELAY_MS);
    });

    rerender(
      <IntroHudLocalDraftProbe
        blocks={secondCommitBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    const accentInput = screen.getByLabelText('Accent Line');
    accentInput.focus();
    accentInput.setSelectionRange(7, 7);

    rerender(
      <IntroHudLocalDraftProbe
        blocks={firstCommitBlocks}
        commitBlockSettingsPatch={commitBlockSettingsPatch}
      />,
    );

    expect(screen.getByLabelText('Accent Line').value).toBe('Vision fuel today');
    expect(screen.getByLabelText('Accent Line').selectionStart).toBe(7);
    expect(screen.getByLabelText('Accent Line').selectionEnd).toBe(7);

    vi.useRealTimers();
  });

  it('surfaces passive foreign drafts inside the HUD with handoff language', () => {
    const onOwnershipAction = vi.fn();
    const onReleaseDraft = vi.fn();

    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'hero',
        kind: 'custom_notice',
        mode: 'dynamic',
        editableFields: [
          {
            id: 'line1Text',
            label: 'Line 1',
            type: 'text',
          },
        ],
        settings: {
          line1Text: 'Build tomorrow faithfully',
        },
      },
      ownership: {
        state: 'drafted-other',
        overlayLabel: 'Unpublished draft by Sarah MacBook',
        overlayDetail: 'Draft saved 2 min ago',
      },
      onOwnershipAction,
      onReleaseDraft,
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByText('Unpublished draft by Sarah MacBook')).toBeTruthy();
    expect(screen.getByText('Draft saved 2 min ago. This draft is not live yet.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Take over draft' }));
    expect(onOwnershipAction).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('button', { name: 'Release draft' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Release draft' }));
    expect(onReleaseDraft).toHaveBeenCalledWith(true);
  });

  it('provides explicit block release and publish actions for an owned draft', () => {
    const onReleaseDraft = vi.fn();
    const onPublishBlock = vi.fn();

    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'hero',
        kind: 'custom_notice',
        mode: 'dynamic',
        editableFields: [],
        settings: { line1Text: 'Owned draft' },
      },
      pathname: '/services/loans',
      ownership: { state: 'owned-self' },
      onReleaseDraft,
      onPublishBlock,
      onSettingChange: vi.fn(),
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Release draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Make block live' }));

    expect(onReleaseDraft).toHaveBeenCalledWith(false);
    expect(onPublishBlock).toHaveBeenCalledTimes(1);
  });

  it('shows the earlier save and newer draft saver together in the editor notice', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'intro',
        kind: 'intro',
        mode: 'dynamic',
        settings: { heading: 'Shared intro' },
      },
      ownership: {
        state: 'drafted-other',
        overlayLabel: 'Last saved by Admin 1',
        overlayDetail: 'Saved 4 min ago',
        overlaySecondaryLabel: 'Draft saved by Admin 3',
        overlaySecondaryDetail: 'Draft saved 1 min ago',
      },
      onOwnershipAction: vi.fn(),
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByText('Last saved by Admin 1')).toBeTruthy();
    expect(screen.getByText('Saved 4 min ago. This draft is not live yet.')).toBeTruthy();
    expect(screen.getByText('Draft saved by Admin 3. Draft saved 1 min ago')).toBeTruthy();
  });

  it('keeps takeover available when another admin is the last saver but no active lock is present', async () => {
    const onOwnershipAction = vi.fn().mockResolvedValue({ ok: true });

    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'intro',
        kind: 'intro',
        mode: 'dynamic',
        settings: { heading: 'Endowments' },
      },
      ownership: {
        state: 'saved-other',
        isOwnedByOther: true,
        overlayLabel: 'Last saved by another admin',
      },
      onOwnershipAction,
      onSettingChange: vi.fn(),
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Take over edit' }));

    expect(onOwnershipAction).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Draft takeover complete.')).toBeTruthy();
  });

  it('provides discard and delete actions inside block options without an add-block control', async () => {
    const removeBlock = vi.fn();
    const onBlockDeleted = vi.fn();
    const block = {
      id: 'hero',
      kind: 'custom_notice',
      mode: 'dynamic',
      editableFields: [],
      settings: { line1Text: 'Owned draft' },
    };

    render(
      <ContentAdminContext.Provider value={{
        getPageChangeSummary: () => ({ changedBlockIds: ['hero'] }),
        getPagePublishSummary: () => ({ changedBlockIds: ['hero'] }),
        removeBlock,
      }}>
        <BlockHudPanelHost
          block={block}
          pathname="/services/loans"
          onBlockDeleted={onBlockDeleted}
          onSettingChange={vi.fn()}
        />
      </ContentAdminContext.Provider>,
    );

    const options = screen.getByRole('region', { name: 'Block options' });
    expect(within(options).queryByRole('button', { name: 'Add block' })).toBeNull();
    expect(within(options).getByRole('button', { name: 'Delete block' })).toBeTruthy();

    fireEvent.click(within(options).getByRole('button', { name: 'Delete block' }));
    fireEvent.click(within(options).getByRole('button', { name: 'Confirm delete block' }));
    expect(removeBlock).toHaveBeenCalledWith('/services/loans', 'hero');
    expect(onBlockDeleted).toHaveBeenCalledWith('hero');
  });

  it('keeps Billboard delete controls on the final HUD editor page', () => {
    const removeBlock = vi.fn();
    const updateBlock = vi.fn();
    const onBlockDeleted = vi.fn();

    render(
      <ContentAdminContext.Provider value={{
        getPageChangeSummary: () => ({ changedBlockIds: ['billboard'] }),
        getPagePublishSummary: () => ({ changedBlockIds: ['billboard'] }),
        removeBlock,
        updateBlock,
      }}>
        <BlockHudPanelHost
          block={{
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Vision fuel',
              bgTone: 'white',
              textTone: 'dark',
            },
          }}
          pathname="/test"
          onBlockDeleted={onBlockDeleted}
          onSettingChange={vi.fn()}
        />
      </ContentAdminContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Block options' }));
    const options = screen.getByRole('region', { name: 'Block options' });
    expect(options.tagName).toBe('SECTION');
    expect(options.classList.contains('admin-hud-editor-block-options-page')).toBe(true);
    expect(options.querySelector('.admin-front-hud-block-options')).toBeNull();
    const nicknameInput = within(options).getByRole('textbox', { name: 'Block nickname' });

    fireEvent.change(nicknameInput, { target: { value: 'Vision intro' } });
    fireEvent.blur(nicknameInput);

    expect(updateBlock).toHaveBeenCalledWith('/test', 'billboard', { adminName: 'Vision intro' });
    expect(within(options).getByRole('button', { name: 'Delete block' })).toBeTruthy();

    fireEvent.click(within(options).getByRole('button', { name: 'Delete block' }));
    fireEvent.click(within(options).getByRole('button', { name: 'Confirm delete block' }));

    expect(removeBlock).toHaveBeenCalledWith('/test', 'billboard');
    expect(onBlockDeleted).toHaveBeenCalledWith('billboard');
  });

  it('blocks HUD field edits while another admin owns the block', () => {
    const onSettingChange = vi.fn();

    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'hero',
        kind: 'custom_notice',
        mode: 'dynamic',
        editableFields: [
          {
            id: 'line1Text',
            label: 'Line 1',
            type: 'text',
          },
        ],
        settings: {
          line1Text: 'Build tomorrow faithfully',
        },
      },
      ownership: {
        state: 'editing-other',
        overlayLabel: 'Sarah MacBook is editing this block',
        overlayDetail: 'Saved 5 min ago',
      },
      onOwnershipAction: vi.fn(),
      onSettingChange,
    }));

    const input = screen.getByLabelText('Line 1');
    expect(input.closest('fieldset')?.disabled).toBe(true);

    fireEvent.change(input, { target: { value: 'Blocked overwrite' } });

    expect(onSettingChange).not.toHaveBeenCalled();
  });

  it('uses stronger takeover language for active foreign edits in the HUD', () => {
    const onOwnershipAction = vi.fn();

    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'hero',
        kind: 'custom_notice',
        mode: 'dynamic',
        editableFields: [
          {
            id: 'line1Text',
            label: 'Line 1',
            type: 'text',
          },
        ],
        settings: {
          line1Text: 'Build tomorrow faithfully',
        },
      },
      ownership: {
        state: 'editing-other',
        overlayLabel: 'Sarah MacBook is editing this block',
        overlayDetail: 'Saved 5 min ago',
      },
      onOwnershipAction,
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByText('Sarah MacBook is editing this block')).toBeTruthy();
    expect(screen.getByText('Saved 5 min ago. Another admin still holds the active edit lock.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Take over edit' }));
    expect(onOwnershipAction).toHaveBeenCalledTimes(1);
  });

  it('keeps HUD field edits active when the current admin owns the block', () => {
    const onSettingChange = vi.fn();

    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'hero',
        kind: 'custom_notice',
        mode: 'dynamic',
        editableFields: [
          {
            id: 'line1Text',
            label: 'Line 1',
            type: 'text',
          },
        ],
        settings: {
          line1Text: 'Build tomorrow faithfully',
        },
      },
      ownership: {
        state: 'editing-self',
        overlayLabel: '',
        overlayDetail: '',
      },
      onSettingChange,
    }));

    const input = screen.getByLabelText('Line 1');
    expect(input.closest('fieldset')?.disabled).toBe(false);

    fireEvent.change(input, { target: { value: 'Owned draft' } });

    expect(onSettingChange).toHaveBeenCalledWith('line1Text', 'Owned draft');
  });

  it('renders request form blocks with the dedicated request form editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'request_form',
        kind: 'request_form',
        editableFields: [
          {
            id: 'titleClassName',
            label: 'Form heading color',
            type: 'swatch',
            options: [
              { value: 'is-blue', label: 'Blue', swatch: 'linear-gradient(145deg, #00adbb 0%, #008aab 100%)' },
            ],
          },
          {
            id: 'bgTone',
            label: 'Background tone',
            type: 'swatch',
            options: [
              { value: 'sand', label: 'Sand', swatch: 'linear-gradient(145deg, #f5efe9 0%, #ded5cb 100%)' },
            ],
          },
          {
            id: 'textTone',
            label: 'Text color',
            type: 'swatch',
            options: [
              { value: 'dark', label: 'Dark', swatch: 'linear-gradient(145deg, #414042 0%, #5c5b5d 100%)' },
            ],
          },
        ],
        settings: {
          title: 'Request a quote',
          subtitle: 'Tell us what you need.',
          bodyHtml: '<p>We will respond quickly.</p>',
          bgTone: 'sand',
          textTone: 'dark',
          step1FieldsJson: '[{"id":"contactFirstName","label":"First Name","type":"text","required":true}]',
          step2FieldsJson: '[]',
          step3FieldsJson: '[]',
          step4FieldsJson: '[]',
          step5FieldsJson: '[]',
        },
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByLabelText('Form heading text')).toBeTruthy();
    expect(screen.getByLabelText('Lead Copy')).toBeTruthy();
    const contentPage = document.querySelector('.admin-request-form-hud-page--content');
    expect(contentPage?.querySelector('.admin-request-form-lead-row')).toBeTruthy();
    expect(contentPage?.querySelector('.admin-request-form-lead-field')).toBeTruthy();
    expect(contentPage?.querySelector('.admin-request-form-lead-text-color')).toBeTruthy();
    expect(screen.queryByText('Set the heading and supporting copy shown beside the form.')).toBeNull();
    expect(screen.getByRole('radiogroup', { name: 'Text color' })).toBeTruthy();
    expect(document.querySelector('.admin-color-text-swatch-list.hud-standard-swatch-palette')).toBeTruthy();
    expect(screen.getByLabelText('Step 1 field 1 label')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Request form editor sections' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Content' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Appearance' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Form options' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Form steps' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Block options' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Form options' }));
    const submitButtonPreview = screen.getByRole('button', { name: 'Submit request' });
    expect(submitButtonPreview.tagName).toBe('BUTTON');
    expect(submitButtonPreview.getAttribute('type')).toBe('button');
    expect(submitButtonPreview.className).toContain('service-native-btn');

    fireEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(screen.getByRole('button', { name: 'Appearance' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('.admin-request-form-hud-editor.is-section-appearance')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Form steps' }));
    expect(screen.getByRole('button', { name: /step 1/i }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /step 1/i }).textContent).toContain('Close');
  });

  it('renders page content blocks with the dedicated page content editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'page_content',
        kind: 'content',
        settings: {
          html: '<p>Page content body.</p>',
          spaceBeforeRem: 0.5,
          spaceAfterRem: 0.5,
          paddingTopRem: 2.4,
          paddingBottomRem: 2.4,
          contentMaxWidthPx: 980,
        },
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByRole('group', { name: 'Page content editor type' })).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Page content width presets' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Advanced layout' })).toBeTruthy();
  });

  it('renders top strip blocks with the dedicated top strip HUD editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'top_strip',
        kind: 'top_strip',
        settings: {
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
          ratesButtonTone: 'mango',
        },
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByRole('radiogroup', { name: 'Top strip background color' })).toBeTruthy();
    expect(screen.getByLabelText('Login Label')).toBeTruthy();
    expect(screen.getByLabelText('Rates URL / Path')).toBeTruthy();
  });

  it('renders hero pie blocks with the migrated hero pie editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'hero_pie',
        kind: 'hero_pie',
        settings: {
          autoplay: true,
          autoplayMs: 2400,
          slicesJson: '[]',
        },
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByRole('group', { name: 'Autoplay wedges' })).toBeTruthy();
    expect(screen.getByLabelText('Autoplay interval (ms)')).toBeTruthy();
    expect(screen.getByLabelText('Service slices (JSON)')).toBeTruthy();
  });

  it('renders legacy CTA content through the Billboard editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'dashboard_login_cta',
        kind: 'billboard',
        mode: 'dynamic',
        settings: {
          title: 'Already an investor?',
          body: '',
          bgTone: 'white',
          buttonLabel: 'Log in to manage',
          buttonUrl: 'https://secure.agfinancial.org/',
          buttonPageRef: '',
          buttonOpenInNewWindow: true,
        },
      },
      routeOptions: [
        { label: 'Impact', value: '/about-us/impact' },
      ],
      onSettingChange: vi.fn(),
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByLabelText('Body HTML')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Heading' }));
    expect(screen.getByLabelText('Title')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Buttons' }));
    expect(screen.getByLabelText('Button 1 Label')).toBeTruthy();
  });

  it('renders calculator cta blocks with the migrated calculator cta editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'laddering',
        kind: 'calculator_cta',
        mode: 'dynamic',
        settings: {
          title: 'Investment Laddering Strategy',
          subtitle: 'Longer term rates with shorter term access',
          body: 'Laddering splits your savings into multiple certificates that mature at different times.',
          calculateLabel: 'Calculate',
          discussTitle: 'Ready to discuss your investment possibilities?',
        },
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByLabelText('Calculator title')).toBeTruthy();
    expect(screen.getByLabelText('Calculate button label')).toBeTruthy();
    expect(screen.getByLabelText('Discuss title')).toBeTruthy();
  });

  it('renders impact stat blocks with the migrated impact stat editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'impact_stat',
        kind: 'impact_stat',
        mode: 'dynamic',
        settings: {
          titlePrefix: 'What you do here',
          highlight: 'matters',
          body: 'Kingdom growth and support.',
          countUp: true,
          ctaLabel: 'Tell me more',
          ctaPath: '/about-us/impact',
          ctaPageRef: '/about-us/impact',
          stat1Value: '$11 billion',
          stat1Label: 'assets under management',
          stat1Tone: 'mango',
        },
      },
      routeOptions: [
        { label: 'Impact', value: '/about-us/impact' },
      ],
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByLabelText('Impact title prefix')).toBeTruthy();
    expect(screen.getByLabelText('Stat 1 value')).toBeTruthy();
    expect(screen.getByLabelText('CTA label')).toBeTruthy();
    expect(document.querySelectorAll('.admin-impact-stat-hud-page')).toHaveLength(5);
    expect(document.querySelector('.admin-impact-stat-hud-page--stat-2')).toBeTruthy();
  });

  it('renders legal copy blocks with the migrated legal copy editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'disclaimer',
        kind: 'legal_copy',
        mode: 'dynamic',
        settings: {
          certificatesHtml: '<p>Certificates disclosure copy.</p>',
          iraHtml: '<p>IRA disclosure copy.</p>',
        },
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByText('Certificates copy')).toBeTruthy();
    expect(screen.getByText('IRA copy')).toBeTruthy();
    expect(screen.getAllByRole('toolbar', { name: 'Article body formatting' }).length).toBeGreaterThan(0);
  });

  it('renders rates blocks with the migrated rates editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'certificates_table',
        kind: 'rates',
        mode: 'dynamic',
        settings: {},
      },
      pathname: '/rates',
      ratesContext: {
        scrollToCertificates: vi.fn(),
        scrollToIra: vi.fn(),
      },
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByText('Table rows and published rates are managed in the Rates admin screen.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open rates admin ↗' })).toBeTruthy();
  });

  it('renders grid HUD panels with normalized route options', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'grid',
        kind: 'card_grid',
        editableFields: [
          { id: 'title', label: 'Grid heading', type: 'textarea', rows: 2 },
          { id: 'card1Action', label: 'Card 1 action', type: 'text' },
          { id: 'card1Path', label: 'Card 1 path', type: 'text' },
          { id: 'card1PageRef', label: 'Card 1 page ref', type: 'text' },
        ],
        settings: {
          title: 'Grid heading',
          card1Action: 'Learn more',
          card1Path: '/contact-us',
          card1PageRef: '/contact-us',
        },
      },
      routeOptions: [
        { label: 'Contact Us', value: '/contact-us' },
        { label: 'Services', value: '/services' },
      ],
      onSettingChange: vi.fn(),
    }));

    fireEvent.click(screen.getByRole('button', { name: /card 1/i }));
    expect(screen.getAllByRole('option', { name: '/contact-us — Contact Us' }).length).toBeGreaterThan(0);
  });

  it('renders columns HUD panels with normalized route options', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'columns',
        kind: 'columns',
        editableFields: [
          { id: 'title', label: 'Columns heading', type: 'textarea', rows: 2 },
          { id: 'col1ButtonLabel', label: 'Column 1 button label', type: 'text' },
          { id: 'col1ButtonUrl', label: 'Column 1 button URL', type: 'text' },
          { id: 'col1ButtonPageRef', label: 'Column 1 button page ref', type: 'text' },
        ],
        settings: {
          title: 'Columns heading',
          columns: 'two',
          col1Enabled: true,
          col1Title: 'Column one',
          col1ButtonLabel: 'Learn more',
          col1ButtonUrl: '/services',
          col1ButtonPageRef: '/services',
        },
      },
      routeOptions: [
        { label: 'Contact Us', value: '/contact-us' },
        { label: 'Services', value: '/services' },
      ],
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByDisplayValue('/services')).toBeTruthy();
  });

  it('renders photo column blocks with the migrated photo column editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'photo-column-sample',
        kind: 'photo_column',
        mode: 'dynamic',
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
      },
      routeOptions: [
        { label: 'Mission Assure', value: '/services/insurance/mission-assure' },
      ],
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByLabelText('Photo label')).toBeTruthy();
    expect(screen.getByLabelText('Photo caption')).toBeTruthy();
    expect(screen.getByLabelText('Photo URL')).toBeTruthy();
  });

  it('renders feature panel blocks with the migrated feature panel editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'cash_reserves',
        kind: 'feature_panel',
        mode: 'dynamic',
        settings: {
          title: 'Church Cash Reserves',
          bodyHtml: '<p>Build a practical reserve strategy.</p>',
          body: '',
          buttonLabel: 'Ready for the unexpected?',
          buttonUrl: '/resources',
          buttonPageRef: '/resources',
          buttonOpenInNewWindow: false,
        },
      },
      routeOptions: [
        { label: 'Resources', value: '/resources' },
      ],
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByLabelText('Feature panel title')).toBeTruthy();
    expect(screen.getByRole('toolbar', { name: 'Article body formatting' })).toBeTruthy();
    expect(screen.getByLabelText('Button label')).toBeTruthy();
  });

  it('renders services grid blocks with the migrated services grid editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'services_grid',
        kind: 'services_grid',
        mode: 'dynamic',
        settings: {
          heading: 'Bold, smart steps.',
          browseLabel: 'Browse all services',
          browsePath: '/services',
          browsePageRef: '/services',
          card1Title: 'Loans',
          card1Path: '/services/loans',
          card1PageRef: '/services/loans',
          card1ImageUrl: '/icons/loans.png',
          card1ImageAlt: '',
          card1Action: 'Options',
          card1Featured: false,
        },
      },
      routeOptions: [
        { label: 'Services', value: '/services' },
        { label: 'Loans', value: '/services/loans' },
      ],
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByLabelText('Services grid heading')).toBeTruthy();
    expect(screen.getByLabelText('Section heading size (rem)')).toBeTruthy();
    expect(screen.getByLabelText('Card title size (rem)')).toBeTruthy();
    expect(screen.getByLabelText('Card vertical padding (rem)')).toBeTruthy();
    expect(screen.getByLabelText('Card 1 title')).toBeTruthy();
    expect(screen.getByLabelText('Browse label')).toBeTruthy();
  });

  it('renders split panel blocks with the migrated split panel editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'split_options',
        kind: 'split_panel',
        mode: 'dynamic',
        settings: {
          leftTitle: 'Individual Retirement Accounts (IRAs)',
          leftBodyHtml: '<p>Traditional and Roth IRAs.</p>',
          leftButtonLabel: 'See IRA options',
          leftButtonUrl: '/services/retirement/iras',
          leftButtonPageRef: '/services/retirement/iras',
          rightTitle: 'Deferred Compensation Plan (409A)',
          rightBodyHtml: '<p>Contribution limits beyond standard retirement options.</p>',
          rightButtonLabel: 'Learn more',
          rightButtonUrl: '/services/retirement/409a',
          rightButtonPageRef: '/services/retirement/409a',
        },
      },
      routeOptions: [
        { label: 'IRAs', value: '/services/retirement/iras' },
        { label: '409A', value: '/services/retirement/409a' },
      ],
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByLabelText('Left title')).toBeTruthy();
    expect(screen.getAllByRole('toolbar', { name: 'Article body formatting' }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Right title')).toBeTruthy();
  });
});
