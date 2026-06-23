import { describe, expect, it } from 'vitest';
import {
  buildDynamicCalculatorCtaFromBlock,
  buildDynamicBillboardFromBlock,
  buildDynamicColumnsFromBlock,
  buildDynamicCtaBandFromBlock,
  buildDynamicCtaFormFromBlock,
  buildDynamicFeaturePanelFromBlock,
  buildDynamicGridFromBlock,
  buildDynamicHeroFromBlock,
  buildDynamicHeroPieFromBlock,
  buildDynamicIntroFromBlock,
  buildDynamicImpactStatFromBlock,
  buildDynamicLegalCopyFromBlock,
  buildDynamicNewsletterFromBlock,
  buildDynamicPageContentFromBlock,
  buildDynamicPhotoColumnFromBlock,
  buildDynamicRatesFromBlock,
  buildDynamicRequestFormFromBlock,
  buildDynamicServicesGridFromBlock,
  buildDynamicSiteFeatureFromBlock,
  buildDynamicSplitPanelFromBlock,
  buildDynamicTopStripFromBlock,
  buildDynamicTestimonialsFromBlock,
  heroAnimationClassForLine,
} from './dynamicPageBlocks';

describe('heroAnimationClassForLine', () => {
  it('keeps loans hero lines in ordered sequence when a third line exists', () => {
    expect(heroAnimationClassForLine('loans-unblur', 1)).toBe('hero-anim-loans-unblur');
    expect(heroAnimationClassForLine('loans-unblur', 2)).toBe('hero-anim-loans-slide');
    expect(heroAnimationClassForLine('loans-unblur', 3)).toBe('hero-anim-loans-slide-followup');
  });

  it('still resolves none to a non-animated class', () => {
    expect(heroAnimationClassForLine('none', 1)).toBe('hero-anim-none');
    expect(heroAnimationClassForLine('none', 3)).toBe('hero-anim-none');
  });
});

describe('buildDynamicColumnsFromBlock', () => {
  it('normalizes service-page dynamic columns into one canonical runtime shape', () => {
    const runtime = buildDynamicColumnsFromBlock({
      id: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      settings: {
        title: 'Compare options',
        titleClassName: 'blue',
        titleHighlightsJson: '[{"text":"options","className":"mango"}]',
        leadLine: 'Start here',
        leadLineClassName: 'grey',
        leadLineHighlightsJson: '[{"text":"Start","className":"blue"}]',
        followupLine: 'Then choose',
        followupLineClassName: 'white',
        followupLineHighlightsJson: '[{"text":"choose","className":"melon"}]',
        bodyHtml: '<p>Review each path.</p>',
        justify: 'right',
        columnsStyle: 'loans-value',
        bgTone: 'sand',
        contentWidth: 'browser',
        columns: 'three',
        col1Enabled: true,
        col1Type: 'text',
        col1Title: 'Option one',
        col1Body: 'Primary copy',
        col1ButtonLabel: 'Learn more',
        col1ButtonPageRef: '/services/retirement',
        col1ButtonStyle: 'outline',
        col1ButtonTone: 'mango',
        col2Enabled: true,
        col2Type: 'photo',
        col2Title: 'Photo option',
        col2Body: 'Caption copy',
        col2ImageUrl: '/team.jpg',
        col2ImageAlt: 'Team photo',
      },
    });

    expect(runtime).toMatchObject({
      title: 'Compare options',
      titleClassName: 'is-atlantean',
      leadLine: 'Start here',
      leadLineClassName: 'is-super-grey',
      followupLine: 'Then choose',
      followupLineClassName: 'is-white',
      justify: 'right',
      bgTone: 'sand',
      contentWidth: 'browser',
      columns: 'three',
      columnsStyle: 'loans-value',
    });
    expect(runtime.titleHighlights).toEqual([{ text: 'options', className: 'is-mango' }]);
    expect(runtime.leadLineHighlights).toEqual([{ text: 'Start', className: 'is-atlantean' }]);
    expect(runtime.followupLineHighlights).toEqual([{ text: 'choose', className: 'is-melon' }]);
    expect(runtime.items).toHaveLength(2);
    expect(runtime.items[0]).toMatchObject({
      slot: 1,
      type: 'text',
      title: 'Option one',
      body: 'Primary copy',
      action: {
        label: 'Learn more',
        to: '/services/retirement',
        style: 'outline',
        tone: 'mango',
      },
    });
    expect(runtime.items[0]?.action?.link).toEqual({
      kind: 'internal',
      to: '/services/retirement',
      openInNewWindow: false,
    });
    expect(runtime.items[1]).toMatchObject({
      slot: 2,
      type: 'photo',
      title: 'Photo option',
      body: 'Caption copy',
      imageUrl: '/team.jpg',
      imageAlt: 'Team photo',
    });
  });

  it('keeps legacy-highlight columns blue and title-only', () => {
    const runtime = buildDynamicColumnsFromBlock({
      id: 'columns',
      kind: 'columns',
      mode: 'dynamic',
      settings: {
        columnsStyle: 'legacy-highlight',
        bgTone: 'white',
        col1Enabled: true,
        col1Title: 'Keep this',
        col1Body: 'Ignored in legacy highlight',
        col2Enabled: true,
        col2Title: '',
        col2Body: 'Drop this without a title',
      },
    });

    expect(runtime?.bgTone).toBe('blue');
    expect(runtime?.items).toEqual([
      expect.objectContaining({
        slot: 1,
        type: 'text',
        title: 'Keep this',
        body: 'Ignored in legacy highlight',
      }),
    ]);
  });
});

describe('buildDynamicCtaFormFromBlock', () => {
  it('normalizes dynamic CTA blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicCtaFormFromBlock({
      id: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        title: 'Ready to connect your faith & finances?',
        titleClassName: 'blue',
        titleHighlightsJson: '[{"text":"faith","className":"mango"}]',
        bodyHtml: '<p>It starts with a conversation.</p>',
        subtitle: 'And we are eager to help.',
        bgTone: 'sand',
        targetSectionKey: 'id:cta-target',
        submitLabel: 'Follow-up with me',
        successMessage: 'Thanks. We will reach out soon.',
        submitStyle: 'outline',
        submitTone: 'mango',
        field1Enabled: true,
        field1Type: 'text',
        field1Label: 'Name',
        field1Required: true,
        field2Enabled: true,
        field2Type: 'multiselect',
        field2Label: 'Topics',
        field2Options: 'investments|Investments,loans|Loans',
        field2Required: false,
        field3Enabled: false,
        field4Enabled: false,
        field5Enabled: false,
      },
    });

    expect(runtime).toMatchObject({
      id: 'cta_form',
      title: 'Ready to connect your faith & finances?',
      titleClassName: 'is-atlantean',
      bodyHtml: '<p>It starts with a conversation.</p>',
      subtitle: 'And we are eager to help.',
      bgTone: 'sand',
      targetSectionKey: 'id:cta-target',
      submitLabel: 'Follow-up with me',
      successMessage: 'Thanks. We will reach out soon.',
      submitStyle: 'outline',
      submitTone: 'mango',
    });
    expect(runtime?.titleHighlights).toEqual([{ text: 'faith', className: 'is-mango' }]);
    expect(runtime?.fields).toEqual([
      expect.objectContaining({
        id: 'field1',
        label: 'Name',
        type: 'text',
        required: true,
      }),
      expect.objectContaining({
        id: 'field2',
        label: 'Topics',
        type: 'multiselect',
        options: [
          { value: 'investments', label: 'Investments' },
          { value: 'loans', label: 'Loans' },
        ],
      }),
    ]);
  });

  it('falls back to provided CTA defaults when a managed CTA leaves heading and fields blank', () => {
    const runtime = buildDynamicCtaFormFromBlock(
      {
        id: 'cta_form',
        kind: 'cta_form',
        mode: 'dynamic',
        settings: {
          submitStyle: 'dark',
          field1Enabled: false,
          field2Enabled: false,
          field3Enabled: false,
          field4Enabled: false,
        },
      },
      {
        fallbackSettings: {
          title: 'Default CTA',
          field1Enabled: true,
          field1Type: 'email',
          field1Label: 'Email',
          field1Required: true,
        },
      },
    );

    expect(runtime).toMatchObject({
      title: 'Default CTA',
      submitStyle: 'dark',
      submitTone: 'super-grey',
    });
    expect(runtime?.fields).toEqual([
      expect.objectContaining({
        id: 'field1',
        label: 'Email',
        type: 'email',
        required: true,
      }),
    ]);
  });

  it('prefers structured CTA field definitions and can append contact preference', () => {
    const runtime = buildDynamicCtaFormFromBlock({
      id: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        title: 'Let us connect.',
        fieldsJson: JSON.stringify([
          { id: 'full_name', label: 'Full name', type: 'text', required: true },
          { id: 'consent', label: 'Text me updates', type: 'checkbox' },
        ]),
        includeContactPreference: true,
        field1Label: 'Legacy Name',
        field1Type: 'text',
        field1Required: true,
      },
    });

    expect(runtime?.fields).toEqual([
      expect.objectContaining({
        id: 'full_name',
        label: 'Full name',
        type: 'text',
      }),
      expect.objectContaining({
        id: 'contact_preference',
        label: 'Preferred contact method',
        type: 'select',
      }),
      expect.objectContaining({
        id: 'consent',
        label: 'Text me updates',
        type: 'checkbox',
      }),
    ]);
  });
});

describe('buildDynamicRequestFormFromBlock', () => {
  it('normalizes dynamic request blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicRequestFormFromBlock({
      id: 'request_form',
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        title: 'Request a quote',
        titleClassName: 'blue',
        titleHighlightsJson: '[{"text":"quote","className":"mango"}]',
        subtitle: 'Tell us what you need.',
        bodyHtml: '<p>We will respond quickly.</p>',
        bgTone: 'sand',
        textTone: 'dark',
        targetSectionKey: 'class:request-target',
        submitLabel: 'Submit request',
        successMessage: 'Thanks. We received your request.',
        step1Title: 'Contact info',
        step1FieldsJson: JSON.stringify([
          { id: 'contactFirstName', label: 'First name', type: 'text', required: true },
          { id: 'contactEmail', label: 'Email', type: 'email', required: true },
        ]),
        step2Title: 'Organization details',
        step2FieldsJson: JSON.stringify([
          { id: 'organization', label: 'Organization', type: 'text', required: true },
          {
            id: 'coverageType',
            label: 'Coverage type',
            type: 'select',
            options: [{ value: 'life', label: 'Life' }],
          },
        ]),
        step3FieldsJson: '[]',
        step4FieldsJson: '[]',
        step5FieldsJson: '[]',
      },
    });

    expect(runtime).toMatchObject({
      id: 'request_form',
      title: 'Request a quote',
      titleClassName: 'is-atlantean',
      subtitle: 'Tell us what you need.',
      bodyHtml: '<p>We will respond quickly.</p>',
      bgTone: 'sand',
      textTone: 'dark',
      targetSectionKey: 'class:request-target',
      submitLabel: 'Submit request',
      successMessage: 'Thanks. We received your request.',
      transitionalAdapter: 'step-fields-json',
    });
    expect(runtime?.steps).toEqual([
      expect.objectContaining({
        id: 'step1',
        title: 'Contact info',
        fields: [
          expect.objectContaining({ id: 'contactFirstName', label: 'First name', type: 'text', required: true }),
          expect.objectContaining({ id: 'contactEmail', label: 'Email', type: 'email', required: true }),
        ],
      }),
      expect.objectContaining({
        id: 'step2',
        title: 'Organization details',
        fields: [
          expect.objectContaining({ id: 'organization', label: 'Organization', type: 'text', required: true }),
          expect.objectContaining({
            id: 'coverageType',
            label: 'Coverage type',
            type: 'select',
            options: [{ value: 'life', label: 'Life' }],
          }),
        ],
      }),
    ]);
  });

  it('keeps certificate request route-specific styling in the transitional adapter', () => {
    const runtime = buildDynamicRequestFormFromBlock(
      {
        id: 'request_form',
        kind: 'request_form',
        mode: 'dynamic',
        settings: {
          step1FieldsJson: JSON.stringify([
            { id: 'contactFirstName', label: 'First name', type: 'text', required: true },
          ]),
        },
      },
      { pathname: '/services/insurance/certificate-request' },
    );

    expect(runtime?.formClassName).toBe('certificate-request-form');
    expect(runtime?.sectionClassName).toContain('certificate-request-native-section');
    expect(runtime?.transitionalAdapter).toBe('step-fields-json');
  });
});

describe('buildDynamicIntroFromBlock', () => {
  it('normalizes intro blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicIntroFromBlock({
      id: 'intro',
      kind: 'intro',
      mode: 'dynamic',
      settings: {
        heading: 'Plan with clarity.',
        headingClassName: 'blue',
        headingHighlightsJson: '[{"text":"clarity","className":"mango"}]',
        bodyHtml: '<p>Shared intro body.</p>',
        extraLine: 'A little more confidence.',
        extraLineTone: 'white',
        bgTone: 'sand',
        textTone: 'dark',
        justify: 'left',
        lineSpacing: 1.1,
        button1Label: 'Learn more',
        button1PageRef: '/services/retirement',
        button1Style: 'outline',
        button1OpenInNewWindow: false,
      },
    });

    expect(runtime).toMatchObject({
      heading: 'Plan with clarity.',
      headingClassName: 'is-atlantean',
      headingHighlights: [{ text: 'clarity', className: 'is-mango' }],
      bodyHtml: '<p>Shared intro body.</p>',
      extraLine: 'A little more confidence.',
      extraLineClassName: 'is-white',
      bgTone: 'sand',
      textTone: 'dark',
      justify: 'left',
      lineSpacing: 1.1,
      actions: [
        expect.objectContaining({
          label: 'Learn more',
          to: '/services/retirement',
          style: 'outline',
        }),
      ],
    });
  });
});

describe('buildDynamicBillboardFromBlock', () => {
  it('normalizes billboard blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Ready to move?',
        titleClassName: 'blue',
        titleHighlightsJson: '[{"text":"move","className":"mango"}]',
        subtitle: 'Let us help.',
        bodyHtml: '<p>Shared billboard body.</p>',
        body: 'Fallback body line.',
        bgTone: 'blue',
        textTone: 'white',
        justify: 'right',
        lineSpacing: 1.05,
        titleFontFamily: 'helv',
        titleFontWeight: 700,
        titleSizeRem: 3.4,
        titleLetterSpacingEm: -0.015,
        contentMaxWidthPx: 1100,
        buttonLabel: 'Take the next step',
        buttonPageRef: '/contact-us',
        buttonStyle: 'outline',
        buttonTone: 'mango',
        button2Label: 'Email us',
        button2Url: 'mailto:info@example.com',
        button2Style: 'outline',
        button2Tone: 'white',
      },
    });

    expect(runtime).toMatchObject({
      title: 'Ready to move?',
      titleClassName: 'blue',
      titleHighlights: [{ text: 'move', className: 'is-mango' }],
      targetSectionKey: '',
      subtitle: 'Let us help.',
      bodyHtml: '<p>Shared billboard body.</p>',
      body: 'Fallback body line.',
      bgTone: 'blue',
      textTone: 'white',
      justify: 'right',
      copyClassName: '',
      copyFadeRootMargin: '',
      contentMaxWidthPx: 1100,
      action: expect.objectContaining({
        label: 'Take the next step',
        to: '/contact-us',
        style: 'outline',
        tone: 'mango',
      }),
      actions: [
        expect.objectContaining({
          label: 'Take the next step',
          to: '/contact-us',
          style: 'outline',
          tone: 'mango',
        }),
        expect.objectContaining({
          label: 'Email us',
          href: 'mailto:info@example.com',
          style: 'outline',
          tone: 'white',
        }),
      ],
    });
    expect(runtime?.titleStyle).toEqual(expect.objectContaining({
      lineHeight: 1.05,
      fontFamily: 'var(--ag-font-helv)',
    }));
  });

  it('marks scale-up billboards as repeat-observe fade reveals', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'repeat_billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Already an investor?',
        bodyHtml: '<p>Replay this reveal.</p>',
        scrollReveal: 'scale-up',
      },
    });

    expect(runtime).toMatchObject({
      copyClassName: 'fade-up fade-up-force-observe fade-up-repeat-observe billboard-scroll-reveal-scale-up',
      copyFadeRootMargin: '0px 0px -40% 0px',
    });
  });

  it('preserves normalized target-section wiring for native targeted billboards', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'daily_billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Retire a little every day.',
        targetSectionKey: 'class:retirement-ira-native-cta',
      },
    });

    expect(runtime?.targetSectionKey).toBe('class:retirement-ira-native-cta');
  });

  it('preserves document-link billboard actions', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'joyful_giving_billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Simple, joyful giving.',
        buttonLabel: 'Terms and Conditions',
        buttonDocumentId: 'document-planned-giving-terms-and-conditions',
        buttonStyle: 'outline',
        buttonTone: 'super-grey',
      },
    });

    expect(runtime?.action).toEqual(expect.objectContaining({
      label: 'Terms and Conditions',
      documentId: 'document-planned-giving-terms-and-conditions',
      style: 'outline',
      tone: 'super-grey',
    }));
  });
});

describe('buildDynamicHeroFromBlock', () => {
  it('normalizes hero blocks into one canonical runtime shape and restores legacy highlight fallbacks when advanced highlights are absent', () => {
    const runtime = buildDynamicHeroFromBlock({
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        line1Text: 'Faith and finance',
        line1ClassName: 'hero-line',
        line1HighlightText: 'Faith',
        line1HighlightColor: 'blue',
        line2Text: 'Plan ahead',
        line2HighlightsJson: '[{"text":"ahead","className":"mango"}]',
        animationPreset: 'loans-unblur',
        bgTone: 'sand',
        justify: 'left',
        actionJustify: 'right',
        titleSizeRem: 7.6,
        titleLetterSpacingEm: -0.11,
        lineHeight: 1.02,
        button1Label: 'Talk with us',
        button1PageRef: '/contact-us',
        button1Style: 'outline',
        button1Tone: 'mango',
      },
    });

    expect(runtime).toMatchObject({
      animationPreset: 'loans-unblur',
      bgTone: 'sand',
      justify: 'left',
      actionJustify: 'right',
      titleSizeRem: 7.6,
      titleLetterSpacingEm: -0.08,
      lineGap: 0,
      lineHeight: 1.02,
      actions: [
        expect.objectContaining({
          label: 'Talk with us',
          to: '/contact-us',
          style: 'outline',
          tone: 'mango',
        }),
      ],
    });
    expect(runtime?.lines).toEqual([
      expect.objectContaining({
        id: 1,
        text: 'Faith and finance',
        className: 'hero-line',
        highlights: [{ text: 'Faith', className: 'is-atlantean' }],
      }),
      expect.objectContaining({
        id: 2,
        text: 'Plan ahead',
        highlights: [{ text: 'ahead', className: 'is-mango' }],
      }),
    ]);
  });

  it('restores the shared default headline size when hero title size is missing', () => {
    const runtime = buildDynamicHeroFromBlock({
      id: 'hero',
      kind: 'hero',
      mode: 'dynamic',
      settings: {
        line1Text: 'AG Financial',
      },
    });

    expect(runtime?.titleSizeRem).toBe(7);
  });
});

describe('buildDynamicPhotoColumnFromBlock', () => {
  it('normalizes standalone photo column blocks into the shared runtime shape', () => {
    const runtime = buildDynamicPhotoColumnFromBlock({
      id: 'photo-column-sample',
      kind: 'photo_column',
      mode: 'dynamic',
      settings: {
        title: 'Mission team',
        body: 'Coverage that travels with you.',
        imageUrl: '/mission-team.jpg',
        imageAlt: 'Mission team',
        buttonLabel: 'Learn more',
        buttonPageRef: '/services/insurance/mission-assure',
        buttonStyle: 'outline',
        buttonTone: 'mango',
        widthShare: 1.25,
      },
    });

    expect(runtime).toMatchObject({
      type: 'photo',
      title: 'Mission team',
      body: 'Coverage that travels with you.',
      imageUrl: '/mission-team.jpg',
      imageAlt: 'Mission team',
      widthShare: 1.25,
      action: {
        label: 'Learn more',
        to: '/services/insurance/mission-assure',
        style: 'outline',
        tone: 'mango',
      },
    });
  });
});

describe('buildDynamicImpactStatFromBlock', () => {
  it('normalizes home impact stat blocks into the shared runtime shape', () => {
    const runtime = buildDynamicImpactStatFromBlock({
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
        stat2Value: '1,583',
        stat2Label: 'ministries supported',
        stat2Tone: 'atlantean',
      },
    });

    expect(runtime).toMatchObject({
      titlePrefix: 'What you do here',
      highlight: 'matters',
      body: 'Kingdom growth and support.',
      countUp: true,
      action: {
        label: 'Tell me more',
        to: '/about-us/impact',
      },
    });
    expect(runtime?.stats).toEqual([
      expect.objectContaining({
        slot: 1,
        value: '$11 billion',
        label: 'assets under management',
        tone: 'mango',
      }),
      expect.objectContaining({
        slot: 2,
        value: '1,583',
        label: 'ministries supported',
        tone: 'atlantean',
      }),
    ]);
  });
});

describe('buildDynamicLegalCopyFromBlock', () => {
  it('normalizes legal copy blocks into sanitized certificate and IRA HTML', () => {
    const runtime = buildDynamicLegalCopyFromBlock({
      id: 'disclaimer',
      kind: 'legal_copy',
      mode: 'dynamic',
      settings: {
        certificatesHtml: '<p>Effective {{certificatesEffectiveDate}}.</p>',
        iraHtml: '<p>Effective {{iraEffectiveDate}}.</p>',
      },
    }, {
      certificatesEffectiveDate: 'March 27, 2026',
      iraEffectiveDate: 'April 2, 2026',
    });

    expect(runtime).toEqual({
      certificatesHtml: '<p>Effective March 27, 2026.</p>',
      iraHtml: '<p>Effective April 2, 2026.</p>',
    });
  });
});

describe('buildDynamicCtaBandFromBlock', () => {
  it('normalizes CTA band blocks into the shared runtime shape', () => {
    const runtime = buildDynamicCtaBandFromBlock({
      id: 'investor_cta',
      kind: 'cta_band',
      mode: 'dynamic',
      settings: {
        title: 'Already an investor?',
        body: 'Log in to manage.',
        bgTone: 'white',
        buttonLabel: 'Go to my dashboard',
        buttonUrl: 'https://secure.agfinancial.org/',
        buttonOpenInNewWindow: true,
      },
    });

    expect(runtime).toMatchObject({
      presetId: 'dashboard-login',
      title: 'Already an investor?',
      body: 'Log in to manage.',
      bgTone: 'white',
      action: {
        label: 'Go to my dashboard',
        href: 'https://secure.agfinancial.org/',
        openInNewWindow: true,
      },
    });
    expect(runtime?.action?.link).toEqual({
      kind: 'external',
      href: 'https://secure.agfinancial.org/',
      openInNewWindow: true,
    });
  });

  it('keeps feature-panel and calculator CTA runtimes out of the cta-band preset path', () => {
    expect(buildDynamicFeaturePanelFromBlock({
      id: 'cash_reserves',
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        title: 'Church Cash Reserves',
        bodyHtml: '<p>Build a practical reserve strategy.</p>',
        buttonLabel: 'Explore',
        buttonPageRef: '/resources',
      },
    })?.presetId).toBeUndefined();

    expect(buildDynamicCalculatorCtaFromBlock({
      id: 'laddering',
      kind: 'calculator_cta',
      mode: 'dynamic',
      settings: {
        title: 'Laddering',
        calculateLabel: 'Calculate',
      },
    })?.presetId).toBeUndefined();
  });
});

describe('buildDynamicCalculatorCtaFromBlock', () => {
  it('normalizes calculator CTA blocks into the shared runtime shape', () => {
    const runtime = buildDynamicCalculatorCtaFromBlock({
      id: 'laddering',
      kind: 'calculator_cta',
      mode: 'dynamic',
      settings: {
        title: 'Investment Laddering Strategy',
        subtitle: 'Longer term rates with shorter term access',
        body: 'Laddering splits your savings into multiple certificates that mature at different times.',
        calculateLabel: 'Calculate',
        disclaimer: 'This tool illustrates ladder mechanics. APY values can change. Results are estimates.',
        downloadTitle: 'Download your laddering sample.',
        discussTitle: 'Ready to discuss your investment possibilities?',
      },
    });

    expect(runtime).toMatchObject({
      title: 'Investment Laddering Strategy',
      subtitle: 'Longer term rates with shorter term access',
      body: 'Laddering splits your savings into multiple certificates that mature at different times.',
      calculateLabel: 'Calculate',
      disclaimer: 'This tool illustrates ladder mechanics. APY values can change. Results are estimates.',
      downloadTitle: 'Download your laddering sample.',
      discussTitle: 'Ready to discuss your investment possibilities?',
    });
  });
});

describe('buildDynamicServicesGridFromBlock', () => {
  it('normalizes home services grid blocks into the shared runtime shape', () => {
    const runtime = buildDynamicServicesGridFromBlock({
      id: 'services_grid',
      kind: 'services_grid',
      mode: 'dynamic',
      settings: {
        heading: 'Bold, smart steps.',
        headingSizeRem: 4.5625,
        cardTitleSizeRem: 2.1875,
        cardPaddingRem: 1.85,
        browseLabel: 'Browse all services',
        browsePath: '/services',
        browsePageRef: '/services',
        card1Title: 'Loans',
        card1Path: '/services/loans',
        card1PageRef: '/services/loans',
        card1ImageUrl: '/icons/loans.png',
        card1ImageAlt: 'Loans icon',
        card1Action: 'Options',
        card2Title: 'View Rates',
        card2Path: '/rates',
        card2PageRef: '/rates',
        card2ImageUrl: '/icons/rates.png',
        card2ImageAlt: 'Rates icon',
        card2Action: 'View rates',
        card2Featured: true,
      },
    });

    expect(runtime).toMatchObject({
      heading: 'Bold, smart steps.',
      headingSizeRem: 4.5625,
      cardTitleSizeRem: 2.1875,
      cardPaddingRem: 1.85,
      browseLabel: 'Browse all services',
      browsePath: '/services',
    });
    expect(runtime?.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: 'Loans',
        path: '/services/loans',
        image: '/icons/loans.png',
        imageAlt: 'Loans icon',
        action: 'Options',
        featured: false,
      }),
      expect.objectContaining({
        slot: 2,
        title: 'View Rates',
        path: '/rates',
        image: '/icons/rates.png',
        imageAlt: 'Rates icon',
        action: 'View rates',
        featured: true,
      }),
    ]);
  });
});

describe('buildDynamicFeaturePanelFromBlock', () => {
  it('normalizes feature panel blocks into the shared runtime shape', () => {
    const runtime = buildDynamicFeaturePanelFromBlock({
      id: 'cash_reserves',
      kind: 'feature_panel',
      mode: 'dynamic',
      settings: {
        title: 'Church Cash Reserves',
        bodyHtml: '<p>Build a practical reserve strategy.</p>',
        imageUrl: 'https://media.agfinancial.org/church-cash-reserves.jpg',
        imageAlt: 'Church Cash Reserves',
        buttonLabel: 'Ready for the unexpected?',
        buttonPageRef: '/resources',
        buttonOpenInNewWindow: false,
        targetSectionKey: 'class:cash-reserves',
      },
    });

    expect(runtime).toMatchObject({
      title: 'Church Cash Reserves',
      bodyHtml: '<p>Build a practical reserve strategy.</p>',
      imageUrl: 'https://media.agfinancial.org/church-cash-reserves.jpg',
      imageAlt: 'Church Cash Reserves',
      action: {
        label: 'Ready for the unexpected?',
        to: '/resources',
      },
      targetSectionKey: 'class:cash-reserves',
    });
    expect(runtime?.action?.link).toEqual({
      kind: 'internal',
      to: '/resources',
      openInNewWindow: false,
    });
  });
});

describe('buildDynamicSiteFeatureFromBlock', () => {
  it('normalizes site features into a code-owned runtime with limited overrides', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      id: 'story_shell',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'editorial_spotlight',
        headline: 'Built for long-form moments',
        body: 'Keep layout and motion in code while allowing a small copy override.',
        buttonLabel: 'Contact AGFinancial',
        buttonPageRef: '/contact',
      },
    });

    expect(runtime).toMatchObject({
      type: 'site_feature',
      featureId: 'editorial_spotlight',
      runtimeKey: 'editorial_spotlight',
      catalogLabel: 'Editorial spotlight',
      isCodeManaged: true,
      title: 'Built for long-form moments',
      body: 'Keep layout and motion in code while allowing a small copy override.',
      imageAlt: 'AGFinancial editorial feature placeholder',
      action: {
        label: 'Contact AGFinancial',
        to: '/contact',
      },
    });
    expect(runtime?.action?.link).toEqual({
      kind: 'internal',
      to: '/contact',
      openInNewWindow: false,
    });
  });

  it('falls back to the code-owned catalog copy when overrides are empty', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      id: 'story_shell',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'editorial_spotlight',
      },
    });

    expect(runtime?.title).toBe('Steady stories deserve careful presentation.');
    expect(runtime?.body).toContain('Layout and motion stay in code');
    expect(runtime?.action).toBeNull();
  });

  it('keeps home impact story metrics and defaults code-owned while allowing headline/body/cta overrides', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      id: 'home_impact_story',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'home_impact_story',
        headline: 'What you do here matters.',
        body: 'Together, we improve financial health while fueling Kingdom growth and support.',
        buttonLabel: 'Tell me more',
        buttonPageRef: '/about-us/impact',
      },
    });

    expect(runtime).toMatchObject({
      type: 'site_feature',
      featureId: 'home_impact_story',
      runtimeKey: 'home_impact_story',
      title: 'What you do here matters.',
      body: 'Together, we improve financial health while fueling Kingdom growth and support.',
      action: {
        label: 'Tell me more',
        to: '/about-us/impact',
      },
      metrics: [
        { value: '1,400+', label: 'ministries served by loans', tone: 'sandstone' },
        { value: '29,000+', label: 'of minister retirements planned', tone: 'sandstone' },
        { value: '$450 million', label: 'distributed to ministries through AG Foundation', tone: 'sandstone' },
      ],
    });
  });

  it('maps the legacy giving stewardship story to its reviewed runtime and preserves the targeted native section key', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      id: 'stewardship_story',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'legacy_giving_stewardship_story',
        targetSectionKey: 'id:legacy-giving-stewardship-story',
      },
    });

    expect(runtime).toMatchObject({
      type: 'site_feature',
      featureId: 'legacy_giving_stewardship_story',
      runtimeKey: 'legacy_giving_stewardship_story',
      targetSectionKey: 'id:legacy-giving-stewardship-story',
      title: 'Smart stewardship—for today and tomorrow.',
      beats: [
        'Receive payments for life.',
        'Transition out of appreciated assets',
        'Leave a legacy for family and ministry',
        'Smart stewardship—for today and tomorrow.',
      ],
      action: {
        label: 'Learn more',
        to: '#charitable-giving-plan-comparison',
      },
    });
  });

  it('maps the impact proof story to its reviewed runtime and keeps the editorial proof layout code-owned', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      id: 'impact_proof_story',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'impact_proof_story',
        headline: 'Impact highlights',
        targetSectionKey: 'class:impact-native-stats',
      },
    });

    expect(runtime).toMatchObject({
      type: 'site_feature',
      featureId: 'impact_proof_story',
      runtimeKey: 'impact_proof_story',
      targetSectionKey: 'class:impact-native-stats',
      title: '',
      metrics: [
        {
          value: '1,400',
          eyebrow: 'Loans',
          label: 'ministries supported by loans.',
          tone: 'atlantean',
          valueTone: 'atlantean',
          action: {
            label: 'Explore loans',
            to: '/services/loans',
          },
        },
        {
          value: '$450 million',
          eyebrow: 'Legacy Giving',
          label: 'distributed to ministries through AG Foundation.',
          tone: 'mango',
          action: {
            label: 'Plan with us',
            to: '/services/legacy-giving',
          },
        },
        {
          value: '5,117',
          eyebrow: 'Insurance',
          label: 'mission trips covered and protected.',
          tone: 'super-grey',
          valueTone: 'atlantean',
          action: {
            label: 'Cover your ministry',
            to: '/services/insurance',
          },
        },
        {
          value: '29,000+',
          eyebrow: 'Retirement',
          label: 'retirements planned.',
          tone: 'atlantean-dark',
          valueTone: 'mango',
          labelBreak: 'block',
          action: {
            label: 'Start your tomorrow',
            to: '/services/retirement',
          },
        },
      ],
    });
    expect(runtime?.metrics).toHaveLength(4);
    expect(runtime?.metrics?.[2]?.body).toContain('Peace of mind');
    expect(runtime?.metrics?.[3]?.action?.to).toBe('/services/retirement');
  });
});

describe('buildDynamicSplitPanelFromBlock', () => {
  it('normalizes split panel blocks into the shared runtime shape', () => {
    const runtime = buildDynamicSplitPanelFromBlock({
      id: 'split_options',
      kind: 'split_panel',
      mode: 'dynamic',
      settings: {
        leftTitle: 'Individual Retirement Accounts (IRAs)',
        leftBodyHtml: '<p>Traditional and Roth IRAs.</p>',
        leftButtonLabel: 'Explore IRAs',
        leftButtonPageRef: '/services/retirement/iras',
        rightTitle: 'Deferred Compensation Plan (409A)',
        rightBodyHtml: '<p>Contribution limits beyond standard retirement options.</p>',
        rightButtonLabel: 'Learn more',
        rightButtonPageRef: '/services/retirement/409a',
      },
    });

    expect(runtime?.items).toEqual([
      expect.objectContaining({
        side: 'left',
        title: 'Individual Retirement Accounts (IRAs)',
        bodyHtml: '<p>Traditional and Roth IRAs.</p>',
        action: expect.objectContaining({
          label: 'Explore IRAs',
          to: '/services/retirement/iras',
        }),
      }),
      expect.objectContaining({
        side: 'right',
        title: 'Deferred Compensation Plan (409A)',
        bodyHtml: '<p>Contribution limits beyond standard retirement options.</p>',
        action: expect.objectContaining({
          label: 'Learn more',
          to: '/services/retirement/409a',
        }),
      }),
    ]);
  });
});

describe('buildDynamicHeroPieFromBlock', () => {
  it('normalizes services hero pie blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicHeroPieFromBlock({
      id: 'hero_pie',
      kind: 'hero_pie',
      mode: 'dynamic',
      settings: {
        autoplay: true,
        autoplayMs: 2800,
        slicesJson: JSON.stringify([
          {
            title: 'Loans',
            path: '/services/loans',
            color: '#00adbb',
            description: 'Custom lending.',
            links: [{ label: 'Loan options', path: '/services/loans' }],
          },
          {
            title: 'Insurance',
            path: '/services/insurance',
            color: '#ffa400',
            description: 'Protection coverage.',
            links: [{ label: 'Group Life', path: '/services/insurance/group-term-life-insurance' }],
          },
        ]),
      },
    });

    expect(runtime).toMatchObject({
      autoplay: true,
      autoplayMs: 2800,
    });
    expect(runtime.slices).toHaveLength(2);
    expect(runtime.slices[0]).toMatchObject({
      title: 'Loans',
      path: '/services/loans',
      color: '#00adbb',
      description: 'Custom lending.',
      links: [{ label: 'Loan options', path: '/services/loans' }],
    });
    expect(runtime.slices[0].d).toContain('M 540 540 L');
  });

  it('falls back to seeded slices and safe autoplay defaults', () => {
    const runtime = buildDynamicHeroPieFromBlock({
      id: 'hero_pie',
      kind: 'hero_pie',
      mode: 'dynamic',
      settings: {
        autoplay: 'false',
        autoplayMs: 50,
        slicesJson: 'not-json',
      },
    });

    expect(runtime).toMatchObject({
      autoplay: false,
      autoplayMs: 1200,
    });
    expect(runtime.slices.length).toBeGreaterThan(0);
    expect(runtime.slices[0]).toMatchObject({
      title: 'Loans',
      path: '/services/loans',
    });
    expect(runtime.slices[0].d).toContain('A 430 430');
  });
});

describe('buildDynamicTopStripFromBlock', () => {
  it('normalizes top strip blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicTopStripFromBlock({
      id: 'top_strip',
      kind: 'top_strip',
      mode: 'dynamic',
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
        sectionFontSizeRem: 1.1,
        itemGapRem: 1.2,
        loginButtonStyle: 'blue',
        loginButtonTone: 'atlantean',
        loginOpenInNewWindow: true,
        ratesButtonStyle: 'blue',
        ratesButtonTone: 'mango',
        ratesOpenInNewWindow: false,
      },
    });

    expect(runtime).toMatchObject({
      bgTone: 'grey',
      textTone: 'white',
      loginStyle: 'solid',
      loginTone: 'atlantean',
      ratesStyle: 'solid',
      ratesTone: 'mango',
      sectionFontSizeRem: 1.1,
      itemGapRem: 1.2,
      showLogin: true,
      showPhone: true,
      showRates: true,
      loginLabel: 'Secure Login',
      loginHref: 'https://secure.agfinancial.org/',
      loginOpenInNewWindow: true,
      phone: '866.621.1787',
      phoneHref: 'tel:8666211787',
      ratesLabel: 'Ask about our rates!',
      ratesPath: '/rates',
      ratesIsExternal: false,
      ratesOpenInNewWindow: false,
    });
  });

  it('accepts flattened home block data and preserves safe defaults', () => {
    const runtime = buildDynamicTopStripFromBlock({
      type: 'top_strip',
      mode: 'dynamic',
      loginLabel: '',
      loginHref: '',
      phone: '',
      ratesLabel: '',
      ratesPath: 'https://example.com/rates',
      bgTone: 'unknown',
      textTone: 'unknown',
      loginButtonStyle: 'unknown',
      loginButtonTone: 'unknown',
      ratesButtonStyle: 'unknown',
      ratesButtonTone: 'unknown',
      sectionFontSizeRem: '',
      itemGapRem: '',
    });

    expect(runtime).toMatchObject({
      bgTone: 'grey',
      textTone: 'white',
      loginStyle: 'solid',
      loginTone: 'atlantean',
      ratesStyle: 'link',
      ratesTone: 'mango',
      sectionFontSizeRem: 0.95,
      itemGapRem: 0.95,
      loginLabel: 'Secure Login',
      loginHref: '#',
      ratesLabel: 'Ask about our rates!',
      ratesPath: 'https://example.com/rates',
      ratesIsExternal: true,
    });
  });
});

describe('buildDynamicRatesFromBlock', () => {
  it('normalizes canonical rates blocks into one shared runtime shape', () => {
    const certificatesRuntime = buildDynamicRatesFromBlock({
      id: 'certificates_table',
      kind: 'rates',
      mode: 'dynamic',
      settings: {},
    });
    const iraRuntime = buildDynamicRatesFromBlock({
      id: 'ira_table',
      kind: 'rates',
      mode: 'dynamic',
      settings: {},
    });

    expect(certificatesRuntime).toMatchObject({
      tableKey: 'certificates',
      sectionKey: 'certificates',
      label: 'Certificates table',
      adminHref: '/admin/rates',
    });
    expect(iraRuntime).toMatchObject({
      tableKey: 'ira',
      sectionKey: 'ira',
      label: 'IRA table',
      adminHref: '/admin/rates',
    });
  });

  it('rejects legacy rates_table blocks after /rates normalization', () => {
    const runtime = buildDynamicRatesFromBlock({
      id: 'certificates_table',
      kind: 'rates_table',
      mode: 'dynamic',
      settings: {},
    });

    expect(runtime).toBeNull();
  });
});

describe('buildDynamicGridFromBlock', () => {
  it('normalizes service-page dynamic grids into one canonical runtime shape', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'grid',
      templateId: 'card_grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        title: 'Explore options',
        titleClassName: 'blue',
        titleHighlightsJson: '[{"text":"options","className":"mango"}]',
        bodyHtml: '<p>Compare the paths.</p>',
        bgTone: 'blue',
        contentWidth: 'browser',
        columns: '4',
        cardStyle: 'card2',
        titleTone: 'white',
        bodyTone: 'white',
        dividerTone: 'mango',
        cardPaddingRem: 2.2,
        cardTitleSizeRem: 1.5,
        cardBodySizeRem: 1.2,
        cardBodyLineHeight: 1.8,
        card1Title: 'First option',
        card1Body: 'Primary copy',
        card1ListJson: '["First bullet","Second bullet"]',
        card1DividerTone: 'melon',
        card1ButtonLabel: 'Learn more',
        card1ButtonPageRef: '/services/retirement',
      },
    });

    expect(runtime).toMatchObject({
      presetId: 'default',
      title: 'Explore options',
      titleClassName: 'is-atlantean',
      bodyHtml: '<p>Compare the paths.</p>',
      bgTone: 'blue',
      contentWidth: 'browser',
      columns: 'four',
      cardStyle: 'card1',
      titleTone: 'white',
      bodyTone: 'white',
      dividerTone: 'mango',
      showTitleDivider: true,
      cardPaddingRem: 2.2,
      cardTitleSizeRem: 1.5,
      cardBodySizeRem: 1.2,
      cardBodyLineHeight: 1.8,
    });
    expect(runtime.titleHighlights).toEqual([{ text: 'options', className: 'is-mango' }]);
    expect(runtime.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: 'First option',
        body: 'Primary copy',
        list: ['First bullet', 'Second bullet'],
        cardClass: 'card1',
        dividerTone: 'melon',
        action: expect.objectContaining({
          label: 'Learn more',
          to: '/services/retirement',
          style: 'blue',
          tone: 'atlantean',
        }),
      }),
    ]);
  });

  it('keeps overlapping investment-option grids on the canonical card-grid runtime with an explicit preset id', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'investment_strategy_options',
      presetId: 'investment-options',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        columns: 'two',
        card1Title: 'MBA Income Fund',
        card1AccordionsJson: JSON.stringify([
          {
            title: 'Fund PDFs',
            links: [
              { label: 'Prospectus', to: '/prospectus' },
            ],
          },
        ]),
      },
    });

    expect(runtime).toMatchObject({
      presetId: 'investment-options',
      columns: 'two',
      cards: [
        expect.objectContaining({
          title: 'MBA Income Fund',
          accordions: [
            expect.objectContaining({
              title: 'Fund PDFs',
            }),
          ],
        }),
      ],
    });
  });

  it('keeps legacy block-id preset fallback narrow for existing card-grid seeds', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'who_qualifies',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        card1Title: 'Eligible ministers',
      },
    });

    expect(runtime?.presetId).toBe('eligibility-cards');
  });

  it('keeps light backgrounds on safe tones and card styles', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        bgTone: 'white',
        titleTone: 'white',
        bodyTone: 'white',
        cardStyle: 'card1',
        card1Title: 'Coverage',
      },
    });

    expect(runtime?.titleTone).toBe('super-grey');
    expect(runtime?.bodyTone).toBe('super-grey');
    expect(runtime?.cardStyle).toBe('card2');
    expect(runtime?.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: 'Coverage',
        cardClass: 'card2',
      }),
    ]);
  });

  it('keeps a grid card mounted when it still has an action during title edits', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        card1Title: '',
        card1Body: '',
        card1ButtonLabel: 'Learn more',
        card1ButtonPageRef: '/services/retirement',
      },
    });

    expect(runtime?.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: 'Card 1',
        action: expect.objectContaining({
          label: 'Learn more',
          to: '/services/retirement',
        }),
      }),
    ]);
  });

  it('keeps rich card link lists, accordion groups, and a second action button in the shared runtime shape', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        card1Title: 'Investment option',
        card1LinksJson: JSON.stringify([
          { label: 'Download PDF', documentId: 'fund-descriptor-retirement-mba-income-fund' },
        ]),
        card1AccordionsJson: JSON.stringify([
          {
            title: 'Fund PDFs',
            links: [
              { label: 'Prospectus', to: '/prospectus' },
            ],
          },
        ]),
        card1ButtonLabel: 'Enroll now',
        card1ButtonPageRef: '/services/retirement/403b/403b-individual-enrollment',
        card1Button2Label: 'Prospectus',
        card1Button2PageRef: '/prospectus',
      },
    });

    expect(runtime?.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: 'Investment option',
        links: [
          expect.objectContaining({
            label: 'Download PDF',
            documentId: 'fund-descriptor-retirement-mba-income-fund',
          }),
        ],
        accordions: [
          expect.objectContaining({
            title: 'Fund PDFs',
            links: [
              expect.objectContaining({
                label: 'Prospectus',
                to: '/prospectus',
              }),
            ],
          }),
        ],
        actions: [
          expect.objectContaining({
            label: 'Enroll now',
            to: '/services/retirement/403b/403b-individual-enrollment',
            style: 'blue',
          }),
          expect.objectContaining({
            label: 'Prospectus',
            to: '/prospectus',
            style: 'outline',
            tone: 'super-grey',
          }),
        ],
      }),
    ]);
  });

  it('forces dark-background grid title and body tones onto the shared white contrast default', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        bgTone: 'blue',
        titleTone: 'super-grey',
        bodyTone: 'super-grey',
        card1Title: 'Coverage',
      },
    });

    expect(runtime?.titleTone).toBe('white');
    expect(runtime?.bodyTone).toBe('white');
    expect(runtime?.cardStyle).toBe('card1');
  });
});

describe('buildDynamicNewsletterFromBlock', () => {
  it('normalizes newsletter blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicNewsletterFromBlock({
      id: 'newsletter',
      kind: 'newsletter',
      mode: 'dynamic',
      settings: {
        title: 'Stay in the loop.',
        titleClassName: 'blue',
        titleHighlightsJson: '[{"text":"loop","className":"mango"}]',
        bodyHtml: '<p>Practical updates.</p>',
        bgTone: 'sand',
        textTone: 'blue',
        formId: 'abc-123',
        accountId: 'acct-1',
        sourceId: 'src-9',
      },
    });

    expect(runtime).toMatchObject({
      title: 'Stay in the loop.',
      titleClassName: 'is-atlantean',
      titleHighlights: [{ text: 'loop', className: 'is-mango' }],
      bodyHtml: '<p>Practical updates.</p>',
      bgTone: 'sand',
      textTone: 'blue',
      formId: 'abc-123',
      accountId: 'acct-1',
      sourceId: 'src-9',
    });
  });

  it('keeps newsletter text tone safe for light and dark backgrounds', () => {
    const lightRuntime = buildDynamicNewsletterFromBlock({
      id: 'newsletter',
      kind: 'newsletter',
      mode: 'dynamic',
      settings: {
        bgTone: 'white',
        textTone: '',
        formId: 'light-form',
      },
    });
    const darkRuntime = buildDynamicNewsletterFromBlock({
      id: 'newsletter',
      kind: 'newsletter',
      mode: 'dynamic',
      settings: {
        bgTone: 'grey',
        textTone: '',
        formId: 'dark-form',
      },
    });

    expect(lightRuntime?.textTone).toBe('dark');
    expect(darkRuntime?.textTone).toBe('white');
  });
});

describe('buildDynamicTestimonialsFromBlock', () => {
  it('normalizes testimonials blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicTestimonialsFromBlock(
      {
        id: 'testimonials',
        kind: 'testimonials',
        mode: 'dynamic',
        settings: {
          selectionMode: 'manual',
          selectedIdsCsv: 'mike-daf-corporate-client,bryan-jarrett-northplace-legacy',
          showFineprint: true,
          fineprint: 'Custom fineprint',
          targetSectionKey: 'id:testimonials-target',
          targetFineprintSectionKey: 'id:legacy-fineprint',
        },
      },
      {
        pathname: '/services/legacy-giving',
        library: [
          {
            id: 'mike-daf-corporate-client',
            quote: 'Quote one',
            author: 'Mike',
            authorTitle: 'Client',
            tags: ['legacy-giving'],
          },
          {
            id: 'bryan-jarrett-northplace-legacy',
            quote: 'Quote two',
            author: 'Bryan Jarrett',
            authorTitle: 'Pastor',
            tags: ['legacy-giving'],
          },
        ],
      },
    );

    expect(runtime).toMatchObject({
      fineprint: 'Custom fineprint',
      targetSectionKey: 'id:testimonials-target',
      targetFineprintSectionKey: 'id:legacy-fineprint',
    });
    expect(runtime?.items).toEqual([
      expect.objectContaining({
        id: 'mike-daf-corporate-client',
        quote: 'Quote one',
        author: 'Mike',
        authorTitle: 'Client',
      }),
      expect.objectContaining({
        id: 'bryan-jarrett-northplace-legacy',
        quote: 'Quote two',
        author: 'Bryan Jarrett',
        authorTitle: 'Pastor',
      }),
    ]);
  });

  it('returns null when no testimonials resolve for the block', () => {
    const runtime = buildDynamicTestimonialsFromBlock({
      id: 'testimonials',
      kind: 'testimonials',
      mode: 'dynamic',
      settings: {
        selectionMode: 'manual',
        selectedIdsCsv: '',
      },
    }, {
      pathname: '/services/loans',
      library: [],
    });

    expect(runtime).toBeNull();
  });
});

describe('buildDynamicPageContentFromBlock', () => {
  it('normalizes page content blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'page_content',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        html: '<p>Body copy.</p>',
        spaceBeforeRem: 1.25,
        spaceAfterRem: 0.75,
        paddingTopRem: 3,
        paddingBottomRem: 2,
        contentMaxWidthPx: 1140,
      },
    });

    expect(runtime).toEqual({
      html: '<p>Body copy.</p>',
      spaceBeforeRem: 1.25,
      spaceAfterRem: 0.75,
      paddingTopRem: 3,
      paddingBottomRem: 2,
      contentMaxWidthPx: 1140,
    });
  });

  it('returns null when page content html is blank', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'page_content',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        html: '   ',
      },
    });

    expect(runtime).toBeNull();
  });
});
