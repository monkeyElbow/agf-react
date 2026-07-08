import { createElement } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BlockHudPanelHost from './BlockHudPanelHost';

describe('BlockHudPanelHost', () => {
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

  it('surfaces passive foreign drafts inside the HUD with handoff language', () => {
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
        state: 'drafted-other',
        overlayLabel: 'Unpublished draft by Sarah MacBook',
        overlayDetail: 'Draft saved 2 min ago',
      },
      onOwnershipAction,
      onSettingChange: vi.fn(),
    }));

    expect(screen.getByText('Unpublished draft by Sarah MacBook')).toBeTruthy();
    expect(screen.getByText('Draft saved 2 min ago. This draft is not live yet.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Continue draft' }));
    expect(onOwnershipAction).toHaveBeenCalledTimes(1);
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
    expect(screen.getByRole('radiogroup', { name: 'Text color' })).toBeTruthy();
    expect(screen.getByLabelText('Step 1 field 1 label')).toBeTruthy();
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

  it('renders cta band blocks with the migrated cta band editor', () => {
    render(createElement(BlockHudPanelHost, {
      block: {
        id: 'dashboard_login_cta',
        kind: 'cta_band',
        mode: 'dynamic',
        settings: {
          title: 'Already an investor?',
          body: 'Log in to manage.',
          bgTone: 'white',
          buttonLabel: 'Go to my dashboard',
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

    expect(screen.getByLabelText('CTA band title')).toBeTruthy();
    expect(screen.getByLabelText('CTA band body')).toBeTruthy();
    expect(screen.getByLabelText('Button label')).toBeTruthy();
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
    expect(screen.getAllByRole('option', { name: '/services — Services' }).length).toBeGreaterThan(0);
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
          leftButtonLabel: 'Explore IRAs',
          leftButtonUrl: '/services/retirement/iras',
          leftButtonPageRef: '/services/retirement/iras',
          rightTitle: 'Deferred Compensation Plan (409A)',
          rightBodyHtml: '<p>Contribution limits beyond standard retirement options.</p>',
          rightButtonLabel: 'Explore 409A',
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
