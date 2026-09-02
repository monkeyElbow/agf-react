import { describe, expect, it } from 'vitest';
import {
  serializeCtaFormFields,
} from '../blocks/foundation/forms';
import {
  buildDynamicCalculatorCtaFromBlock,
  buildDynamicCardChartFromBlock,
  buildDynamicBillboardFromBlock,
  buildDynamicColumnsFromBlock,
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
  isPdfLinkHref,
  normalizeUniversalOutlineButtonClassName,
  normalizeBillboardBodyMaxWidthPx,
  shouldUseUniversalOutlineButtonLink,
} from './dynamicPageBlocks';
import { serializeLinkValue } from './linkValue';

const ctaFieldsJson = (fields) => serializeCtaFormFields(fields);

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

describe('shared external button link helpers', () => {
  it('detects pdf targets and external-or-pdf button links', () => {
    expect(isPdfLinkHref('https://files.example.com/offering-circular.pdf')).toBe(true);
    expect(isPdfLinkHref('/docs/reference-packet.pdf?download=1')).toBe(true);
    expect(isPdfLinkHref('/services/loans')).toBe(false);
    expect(shouldUseUniversalOutlineButtonLink({ href: 'https://www.example.com' })).toBe(true);
    expect(shouldUseUniversalOutlineButtonLink({ to: '/docs/reference-packet.pdf' })).toBe(true);
    expect(shouldUseUniversalOutlineButtonLink({ to: '/services/loans' })).toBe(false);
    expect(shouldUseUniversalOutlineButtonLink({ href: 'https://www.example.com', buttonStyle: 'blue' })).toBe(false);
    expect(shouldUseUniversalOutlineButtonLink({ to: '#traditional-daf-form', buttonStyle: 'outline' })).toBe(false);
  });

  it('normalizes forced external button links onto the shared outline classes without losing tone', () => {
    expect(normalizeUniversalOutlineButtonClassName('service-native-btn is-ghost is-tone-mango extra-class', 'mango')).toBe(
      'service-native-btn extra-class is-outline is-tone-mango',
    );
    expect(normalizeUniversalOutlineButtonClassName('', 'super-grey')).toBe(
      'service-native-btn is-outline is-tone-super-grey',
    );
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
        buttonLabel: 'Open a traditional DAF',
        buttonLinkJson: serializeLinkValue({
          kind: 'anchor',
          href: '#traditional-daf-form',
        }),
        buttonStyle: 'outline',
        buttonTone: 'super-grey',
        col1Enabled: true,
        col1Type: 'text',
        col1Title: 'Option one',
        col1Body: 'Primary copy',
        col1IconKey: 'daf-step-1',
        col1IconTone: 'sandstone',
        col1ButtonLabel: 'Learn more',
        col1ButtonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/services/retirement',
        }),
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
    expect(runtime.actions).toEqual([
      expect.objectContaining({
        label: 'Open a traditional DAF',
        href: '#traditional-daf-form',
        style: 'outline',
        tone: 'super-grey',
      }),
    ]);
    expect(runtime.items).toHaveLength(2);
    expect(runtime.items[0]).toMatchObject({
      slot: 1,
      type: 'text',
      title: 'Option one',
      body: 'Primary copy',
      iconKey: 'daf-step-1',
      iconTone: 'sandstone',
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
        fieldsJson: ctaFieldsJson([
          { id: 'name', label: 'Name', type: 'text', required: true },
          {
            id: 'topics',
            label: 'Topics',
            type: 'multiselect',
            options: [
              { value: 'investments', label: 'Investments' },
              { value: 'loans', label: 'Loans' },
            ],
          },
        ]),
      },
    });

    expect(runtime).toMatchObject({
      id: 'cta_form',
      title: 'Ready to connect your faith & finances?',
      titleClassName: 'is-atlantean',
      bodyHtml: '<p>It starts with a conversation.</p>',
      subtitle: 'And we are eager to help.',
      bgTone: 'sand',
      submitLabel: 'Follow up with me',
      successMessage: 'Thanks. We will reach out soon.',
      submitStyle: 'outline',
      submitTone: 'mango',
    });
    expect(runtime?.targetSectionKey).toBeUndefined();
    expect(runtime?.titleHighlights).toEqual([{ text: 'faith', className: 'is-mango' }]);
    expect(runtime?.fields).toEqual([
      expect.objectContaining({
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
      }),
      expect.objectContaining({
        id: 'topics',
        label: 'Topics',
        type: 'multiselect',
        options: [
          { value: 'investments', label: 'Investments' },
          { value: 'loans', label: 'Loans' },
        ],
      }),
    ]);
  });

  it('keeps legacy published CTA snapshots visible until the explicit field migration runs', () => {
    const runtime = buildDynamicCtaFormFromBlock({
      id: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        title: 'What coverage is best for your ministry?',
        sectionClassName: 'insurance-native-cta',
        step1FieldsJson: ctaFieldsJson([
          { id: 'name', label: 'Name', type: 'text', required: true },
          { id: 'email', label: 'Email', type: 'email', required: true },
        ]),
      },
    });

    expect(runtime?.fields).toEqual([
      expect.objectContaining({ id: 'name', type: 'text', required: true }),
      expect.objectContaining({ id: 'email', type: 'email', required: true }),
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
          fieldsJson: ctaFieldsJson([
            { id: 'email', label: 'Email', type: 'email', required: true },
          ]),
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
        id: 'email',
        label: 'Email',
        type: 'email',
        required: true,
      }),
    ]);
  });

  it('keeps intentionally empty canonical CTA fields from inheriting fallback copy', () => {
    const runtime = buildDynamicCtaFormFromBlock(
      {
        id: 'cta_form',
        kind: 'cta_form',
        mode: 'dynamic',
        settings: {
          title: '',
          fieldsJson: '',
        },
      },
      {
        fallbackSettings: {
          title: 'Blueprint title',
          fieldsJson: ctaFieldsJson([
            { id: 'email', label: 'Email', type: 'email' },
          ]),
        },
      },
    );

    expect(runtime?.title).toBe('');
    expect(runtime?.fields).toEqual([
      expect.objectContaining({ id: 'email', label: 'Email' }),
    ]);
  });

  it('treats CTA slot fields as compatibility rescue behind canonical defaults', () => {
    const runtime = buildDynamicCtaFormFromBlock(
      {
        id: 'cta_form',
        kind: 'cta_form',
        mode: 'dynamic',
        settings: {
          title: 'Managed CTA',
          field1Enabled: true,
          field1Label: 'Stale slot name',
          field1Type: 'text',
          field1Required: true,
        },
      },
      {
        fallbackSettings: {
          fieldsJson: ctaFieldsJson([
            { id: 'email', label: 'Email', type: 'email', required: true },
          ]),
        },
      },
    );

    expect(runtime?.fields).toEqual([
      expect.objectContaining({
        id: 'email',
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

  it('repairs stale planned-giving CTA drafts missing required fields and choices', () => {
    const runtime = buildDynamicCtaFormFromBlock({
      id: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        title: 'We help every step of the way. Always.',
        sectionClassName: 'legacy-giving-cta',
        fieldsJson: ctaFieldsJson([
          { id: 'name', label: 'Name', type: 'text' },
          { id: 'phone', label: 'Phone', type: 'tel' },
          {
            id: 'legacyProduct',
            label: 'Planned giving product of interest*',
            type: 'select',
            required: true,
            options: [
              { value: 'donor-advised-fund', label: 'Donor Advised Fund' },
              { value: 'ministry-impact-fund', label: 'Ministry Impact Fund' },
            ],
          },
        ]),
      },
    });

    expect(runtime?.fineprint).toBe('* fields required');
    expect(runtime?.fields?.find((field) => field.id === 'name')).toMatchObject({ label: 'Name*', required: true });
    expect(runtime?.fields?.find((field) => field.id === 'phone')).toMatchObject({ label: 'Phone*', required: true });
    expect(runtime?.fields?.find((field) => field.id === 'contact_preference')).toMatchObject({
      label: 'Contact preference',
      type: 'select',
      options: [
        { value: 'phone', label: 'Phone' },
        { value: 'email', label: 'Email' },
      ],
    });
    const productField = runtime?.fields?.find((field) => field.id === 'legacyproduct');

    expect(productField?.options).toContainEqual({ value: 'not-sure', label: "I'm not sure." });
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
      submitLabel: 'Submit request',
      successMessage: 'Thanks. We received your request.',
      transitionalAdapter: 'step-fields-json',
    });
    expect(runtime?.targetSectionKey).toBeUndefined();
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

  it('keeps certificate request styling on block-owned settings', () => {
    const runtime = buildDynamicRequestFormFromBlock({
      id: 'request_form',
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'certificate-request-native-section',
        formClassName: 'certificate-request-form',
        step1FieldsJson: JSON.stringify([
          { id: 'contactFirstName', label: 'First name', type: 'text', required: true },
        ]),
      },
    });

    expect(runtime?.formClassName).toBe('certificate-request-form');
    expect(runtime?.presetId).toBe('certificate-request');
    expect(runtime?.sectionClassName).toContain('certificate-request-native-section');
    expect(runtime?.sectionClassName).toContain('is-request-form-preset-certificate-request');
    expect(runtime?.transitionalAdapter).toBe('step-fields-json');
  });

  it('uses explicit request-form preset ids for block-owned visual variants', () => {
    const runtime = buildDynamicRequestFormFromBlock({
      id: 'request_form',
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'contact-us-request',
        presetId: 'contact',
        step1FieldsJson: JSON.stringify([
          { id: 'firstName', label: 'First name', type: 'text', required: true },
        ]),
      },
    });

    expect(runtime?.presetId).toBe('contact');
    expect(runtime?.sectionClassName).toContain('contact-us-request');
    expect(runtime?.sectionClassName).toContain('is-request-form-preset-contact');
  });

  it('preserves an explicit base heading color on legacy generosity requests', () => {
    const runtime = buildDynamicRequestFormFromBlock({
      id: 'request_form',
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        presetId: 'legacy-generosity',
        sectionClassName: 'legacy-child-native-generosity-request',
        title: 'Your IRA. Their gain.',
        titleClassName: 'is-mango',
        titleHighlightsJson: '[]',
        step1FieldsJson: JSON.stringify([
          { id: 'firstName', label: 'First name', type: 'text', required: true },
        ]),
      },
    });

    expect(runtime?.titleClassName).toBe('is-mango');
    expect(runtime?.sectionClassName).toContain('is-request-form-preset-legacy-generosity');
  });

  it('locks legacy-impact request forms to the shared preset presentation contract', () => {
    const runtime = buildDynamicRequestFormFromBlock({
      id: 'request_form',
      kind: 'request_form',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-request',
        presetId: 'legacy-impact',
        title: 'A legacy of giving.',
        titleClassName: 'is-atlantean',
        titleHighlightsJson: '',
        bgTone: 'blue',
        textTone: 'white',
        spaceBeforeRem: 0,
        spaceAfterRem: 0,
        step1Title: 'Talk with planned giving',
        step1Note: 'Let’s map out the best next step.',
        step1FieldsJson: JSON.stringify([
          { id: 'firstName', label: 'First Name*', type: 'text', required: true },
        ]),
      },
    });

    expect(runtime).toMatchObject({
      titleClassName: '',
      titleHighlightsJson: '',
      bgTone: 'blue',
      textTone: 'white',
      spaceBeforeRem: 3.6,
      spaceAfterRem: 4.2,
      hideStepTitles: true,
    });
    expect(runtime?.sectionClassName).toContain('is-text-white');
    expect(runtime?.steps?.[0]).toMatchObject({
      title: '',
      note: '',
      alert: '',
    });
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
        bodyColorClassName: 'white',
        extraLine: 'A little more confidence.',
        extraLineTone: 'white',
        extraLineSizeRem: 2.25,
        extraLineSpaceBeforeRem: 1.75,
        extraLineLineHeight: 1.1,
        bgTone: 'sand',
        textTone: 'dark',
        justify: 'left',
        lineSpacing: 1.1,
        backgroundEffectsJson: '{"enabled":true,"clip":true,"lights":[{"tone":"mango","strength":55,"x":-24,"y":18,"size":88,"motion":true}]}',
        button1Label: 'Learn more',
        button1LinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/services/retirement',
        }),
        button1Style: 'outline',
      },
    });

    expect(runtime).toMatchObject({
      heading: 'Plan with clarity.',
      headingClassName: 'is-atlantean',
      headingHighlights: [{ text: 'clarity', className: 'is-mango' }],
      bodyHtml: '<p>Shared intro body.</p>',
      bodyColorClassName: 'is-white',
      extraLine: 'A little more confidence.',
      extraLineClassName: 'is-white',
      extraLineStyle: {
        color: 'var(--ag-color-white)',
        '--service-native-intro-emphasis-size': '2.25rem',
        '--service-native-intro-emphasis-space-before': '1.75rem',
        '--service-native-intro-emphasis-line-height': '1.1',
      },
      bgTone: 'sand',
      textTone: 'dark',
      justify: 'left',
      lineSpacing: 1.1,
      backgroundEffects: {
        enabled: true,
        clip: true,
        lights: [expect.objectContaining({ tone: 'mango', strength: 55, x: 26, y: 68, size: 88, motion: true, positionModel: 'edge-v1' })],
      },
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
        logoKey: 'mission-assure',
        title: 'Ready to move?',
        titleClassName: 'blue',
        titleHighlightsJson: '[{"text":"move","className":"mango"}]',
        subtitle: 'Let us help.',
        subtitleClassName: 'mango',
        subtitleDisplay: 'headline',
        subtitleSizeRem: 3.4,
        bodyHtml: '<p>Shared billboard body.</p>',
        body: 'Fallback body line.',
        bgTone: 'blue',
        textTone: 'white',
        justify: 'right',
        lineSpacing: 1.05,
        backgroundEffectsJson: '{"enabled":true,"clip":false,"lights":[{"tone":"blue","strength":42,"x":-30,"y":-20,"size":82}]}',
        titleFontFamily: 'helv',
        titleFontWeight: 700,
        titleSizeRem: 3.4,
        titleLetterSpacingEm: -0.015,
        headlineMaxWidthPx: 980,
        contentMaxWidthPx: 1100,
        paddingBottomRem: 7.5,
        actionsBeforeCards: true,
        buttonLabel: 'Take the next step',
        buttonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/contact-us',
        }),
        buttonStyle: 'outline',
        buttonTone: 'mango',
        button2Label: 'Email us',
        button2LinkJson: serializeLinkValue({
          kind: 'email',
          href: 'mailto:info@example.com',
        }),
        button2Style: 'outline',
        button2Tone: 'white',
      },
    });

    expect(runtime).toMatchObject({
      logoKey: 'mission-assure',
      title: 'Ready to move?',
      titleClassName: 'blue',
      titleHighlights: [{ text: 'move', className: 'is-mango' }],
      subtitle: 'Let us help.',
      subtitleClassName: 'is-mango',
      bodyHtml: '<p>Shared billboard body.</p>',
      body: 'Fallback body line.',
      bgTone: 'blue',
      textTone: 'white',
      justify: 'right',
      bodyJustify: 'right',
      backgroundEffects: {
        enabled: true,
        clip: false,
        lights: [expect.objectContaining({ tone: 'blue', strength: 42, x: 20, y: 30, size: 82, positionModel: 'edge-v1' })],
      },
      copyClassName: '',
      copyFadeRootMargin: '',
      copyStyle: { '--dynamic-billboard-copy-max-width': '1100px' },
      contentMaxWidthPx: 1100,
      paddingBottomRem: 7.5,
      actionsBeforeCards: true,
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
    expect(runtime?.targetSectionKey).toBeUndefined();
    expect(runtime?.titleStyle).toEqual(expect.objectContaining({
      lineHeight: 1.05,
      fontFamily: 'var(--ag-font-helv)',
    }));
    expect(runtime?.copyStyle).toEqual({
      '--dynamic-billboard-copy-max-width': '1100px',
    });
    expect(runtime?.subtitleStyle).toEqual(expect.objectContaining({
      color: 'var(--ag-color-mango)',
      fontFamily: 'var(--ag-font-helv)',
      fontWeight: 700,
      fontSize: 'clamp(calc(3.4rem * 0.58), 8vw, 3.4rem)',
      lineHeight: 1.05,
      letterSpacing: '-0.015em',
    }));
  });

  it('uses the content rail as the billboard title boundary for legacy narrow settings', () => {
    const runtime = buildDynamicBillboardFromBlock({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Plenty of options.',
        headlineMaxWidthPx: 560,
        contentMaxWidthPx: 1216,
      },
    });

    expect(runtime?.contentMaxWidthPx).toBe(1216);
    expect(runtime?.copyStyle).toEqual({
      '--dynamic-billboard-copy-max-width': '1216px',
    });
  });

  it('keeps body alignment and body width independent from the title alignment', () => {
    expect(normalizeBillboardBodyMaxWidthPx(315)).toBe(320);
    expect(normalizeBillboardBodyMaxWidthPx(645)).toBe(650);
    expect(normalizeBillboardBodyMaxWidthPx(1210)).toBe(1200);

    const runtime = buildDynamicBillboardFromBlock({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Centered title',
        bodyHtml: '<p>Left aligned body.</p>',
        justify: 'center',
        bodyJustify: 'left',
        bodyMaxWidthPx: 645,
        headerGapRem: 1.17,
      },
    });

    expect(runtime).toMatchObject({
      justify: 'center',
      bodyJustify: 'left',
      bodyMaxWidthPx: 650,
      copyStyle: {
        '--dynamic-billboard-body-max-width': '650px',
        '--dynamic-billboard-header-gap': '1.17rem',
      },
      headerGapRem: 1.17,
    });
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
      copyFadeRootMargin: '0px 0px -20% 0px',
    });
  });

  it('prefers canonical billboard link JSON over stale split link fields', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Choose a current path.',
        buttonLabel: 'Current link',
        buttonLinkJson: '{"kind":"internal","openInNewWindow":false,"to":"/services/loans"}',
        buttonUrl: '/old-path',
        buttonPageRef: '/old-path',
      },
    });

    expect(runtime?.action).toEqual(expect.objectContaining({
      label: 'Current link',
      to: '/services/loans',
    }));
    expect(runtime?.action?.href).toBeUndefined();
  });

  it('keeps a labeled billboard button visible before its destination is entered', () => {
    const runtime = buildDynamicBillboardFromBlock({
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Choose your next step.',
        buttonLabel: 'Start here',
        buttonLinkJson: '',
      },
    });

    expect(runtime?.actions).toEqual([
      expect.objectContaining({ label: 'Start here' }),
    ]);
  });

  it('defaults the planned giving joy billboard heading to Helv for older saved blocks', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'joy_billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'More joy in giving.',
        sectionClassName: 'legacy-giving-joy fade-out',
      },
    });

    expect(runtime?.titleStyle).toEqual(expect.objectContaining({
      fontFamily: 'var(--ag-font-helv)',
      fontWeight: 700,
      letterSpacing: '-0.038em',
    }));
  });

  it('locks the charitable gift annuities outro billboard to centered Helv presentation', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'outro',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Plenty of options.',
        justify: 'right',
        titleFontFamily: 'avenir',
        titleFontWeight: 400,
        actionsBeforeCards: false,
        sectionClassName: 'legacy-child-native-cga-outro',
      },
    });

    expect(runtime).toMatchObject({
      justify: 'center',
      actionsBeforeCards: true,
    });
    expect(runtime?.titleStyle).toEqual(expect.objectContaining({
      fontFamily: 'var(--ag-font-helv)',
      fontWeight: 700,
    }));
  });

  it('keeps supporting subtitle size overrides on the shared billboard subtitle sizing path', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'subtitle_size_billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Make room for the subtitle control',
        subtitle: 'Support copy',
        subtitleDisplay: 'supporting',
        subtitleSizeRem: 1.42,
      },
    });

    expect(runtime?.subtitleStyle).toEqual(expect.objectContaining({
      fontSize: 'clamp(calc(1.42rem * 0.68), 5vw, 1.42rem)',
    }));
  });

  it('routes the lead-copy size setting to the rendered rich body', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'lead_copy_size_billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Already have an IRA? Simplify.',
        bodyHtml: '<p>Rolling over your other retirement savings is simple.</p>',
        leadCopySizeRem: 1.85,
      },
    });

    expect(runtime?.leadCopySizeRem).toBe(1.85);
    expect(runtime?.bodyHtmlStyle).toEqual({
      '--dynamic-billboard-lead-copy-size': 'clamp(calc(1.85rem * 0.68), 2.1vw, 1.85rem)',
    });
    expect(runtime?.copyStyle).toEqual({
      '--dynamic-billboard-lead-copy-size': 'clamp(calc(1.85rem * 0.68), 2.1vw, 1.85rem)',
    });
  });

  it('ignores stale target-section wiring for native billboards', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'daily_billboard',
      kind: 'billboard',
      mode: 'dynamic',
      settings: {
        title: 'Retire a little every day.',
        targetSectionKey: 'class:retirement-child-native-rollover',
      },
    });

    expect(runtime?.targetSectionKey).toBeUndefined();
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
        paddingTopRem: 3.25,
        paddingBottomRem: 4.5,
        button1Label: 'Talk with us',
        button1LinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/contact-us',
        }),
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
      paddingTopRem: 3.25,
      paddingBottomRem: 4.5,
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
        buttonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/services/insurance/mission-assure',
        }),
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
        ctaLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/about-us/impact',
        }),
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

describe('buildDynamicBillboardFromBlock', () => {
  it('normalizes migrated CTA content into the shared Billboard runtime shape', () => {
    const runtime = buildDynamicBillboardFromBlock({
      id: 'dashboard_login_cta',
      kind: 'billboard',
      mode: 'dynamic',
      templateId: 'dashboard_login_cta',
      presetId: 'dashboard-login',
      settings: {
        title: 'Already an investor?',
        body: '',
        bgTone: 'white',
        buttonLabel: 'Log in to manage',
        buttonLinkJson: serializeLinkValue({
          kind: 'external',
          href: 'https://secure.agfinancial.org/',
          openInNewWindow: true,
        }),
      },
    });

    expect(runtime).toMatchObject({
      title: 'Already an investor?',
      body: '',
      bgTone: 'white',
      actions: [{
        label: 'Log in to manage',
        href: 'https://secure.agfinancial.org/',
        openInNewWindow: true,
      }],
    });
    expect(runtime?.actions?.[0]?.link).toEqual({
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
        titleClassName: 'is-mango',
        bodyHtml: '<p>Build a practical reserve strategy.</p>',
        buttonLabel: 'Explore',
        buttonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/resources',
        }),
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

  it('does not merge legacy card inventory into a canonical settings record', () => {
    const runtime = buildDynamicServicesGridFromBlock({
      id: 'services_grid',
      kind: 'services_grid',
      mode: 'dynamic',
      heading: 'Legacy heading',
      cards: [{ title: 'Legacy card', linkJson: serializeLinkValue({ kind: 'internal', to: '/legacy' }) }],
      settings: {
        heading: '',
        card1Title: '',
        card1LinkJson: '',
        browseLabel: '',
        browseLinkJson: '',
      },
    });

    expect(runtime).toBeNull();
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
        titleClassName: 'is-mango',
        bodyHtml: '<p>Build a practical reserve strategy.</p>',
        imageUrl: 'https://media.agfinancial.org/church-cash-reserves.jpg',
        imageAlt: 'Church Cash Reserves',
        buttonLabel: 'Ready for the unexpected?',
        buttonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/resources',
        }),
        targetSectionKey: 'class:cash-reserves',
      },
    });

    expect(runtime).toMatchObject({
      title: 'Church Cash Reserves',
      titleClassName: 'is-mango',
      bodyHtml: '<p>Build a practical reserve strategy.</p>',
      imageUrl: 'https://media.agfinancial.org/church-cash-reserves.jpg',
      imageAlt: 'Church Cash Reserves',
      action: {
        label: 'Ready for the unexpected?',
        to: '/resources',
      },
    });
    expect(runtime?.targetSectionKey).toBeUndefined();
    expect(runtime?.action?.link).toEqual({
      kind: 'internal',
      to: '/resources',
      openInNewWindow: false,
    });
  });

});

describe('buildDynamicSiteFeatureFromBlock', () => {
  it('carries History Gallery typography and color settings into the shared runtime', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      id: 'history',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'about_history_feature',
        cardTitleSizeRem: 4.2,
        cardTitleLineHeight: 1.1,
        cardBodySizeRem: 1.3,
        cardBodyLineHeight: 1.9,
        titleTone: 'mango',
        bodyTone: 'atlantean',
      },
    });

    expect(runtime).toMatchObject({
      catalogLabel: 'History Gallery',
      cardTitleSizeRem: 4.2,
      cardTitleLineHeight: 1.1,
      cardBodySizeRem: 1.3,
      cardBodyLineHeight: 1.9,
      titleTone: 'mango',
      bodyTone: 'atlantean',
    });
  });

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
        buttonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/contact',
        }),
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
        buttonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/about-us/impact',
        }),
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
        { value: '29,000+', label: 'retirements planned', tone: 'sandstone' },
        { value: '$450 million', label: 'distributed to ministries through AG Foundation', tone: 'sandstone' },
      ],
    });
  });

  it('uses repeatable home feature panels when the block supplies them', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'home_services_feature_animation',
        panelsJson: JSON.stringify([
          {
            title: 'Custom service',
            body: 'A custom service story.',
            buttonLabel: 'Learn more',
            buttonPath: '/services/custom',
          },
        ]),
      },
    });

    expect(runtime?.panels).toHaveLength(1);
    expect(runtime?.panels?.[0]).toMatchObject({
      title: 'Custom service',
      body: 'A custom service story.',
      action: { label: 'Learn more', to: '/services/custom' },
    });
  });

  it('uses repeatable impact proof cards and direct intro fields without changing legacy fallbacks', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'impact_proof_story',
        metricsJson: JSON.stringify([
          {
            value: '$450 million',
            eyebrow: 'Planned Giving',
            label: 'custom impact label.',
            body: 'Custom impact copy.',
            buttonLabel: 'Plan with us',
            buttonPath: '/services/planned-giving',
          },
        ]),
        introHeading: 'Custom intro',
        introBody: 'Custom intro body.',
        introEmphasis: 'Custom emphasis.',
      },
    });

    expect(runtime?.metrics).toHaveLength(1);
    expect(runtime?.metrics?.[0]).toMatchObject({
      value: '$450 million',
      label: 'custom impact label.',
      body: 'Custom impact copy.',
      action: { label: 'Plan with us', to: '/services/planned-giving' },
    });
    expect(runtime?.featureIntro).toEqual({
      heading: 'Custom intro',
      body: 'Custom intro body.',
      emphasis: 'Custom emphasis.',
    });
  });

  it('maps the planned giving stewardship story to its reviewed runtime without native-section targeting', () => {
    const runtime = buildDynamicSiteFeatureFromBlock({
      id: 'stewardship_story',
      kind: 'site_feature',
      mode: 'dynamic',
      settings: {
        featureId: 'legacy_giving_stewardship_story',
        targetSectionKey: 'id:legacy-giving-stewardship-story',
        buttonLabel: 'Compare charitable giving ideas',
        buttonLinkJson: '{"kind":"internal","to":"#charitable-giving-plan-comparison","openInNewWindow":false}',
      },
    });

    expect(runtime).toMatchObject({
      type: 'site_feature',
      featureId: 'legacy_giving_stewardship_story',
      runtimeKey: 'legacy_giving_stewardship_story',
      title: 'Smart stewardship for today and tomorrow.',
      beats: [
        'Transition out of appreciated assets.',
        'Receive payments for life.',
        'Leave a legacy for family and ministry.',
        'Smart stewardship for today and tomorrow.',
      ],
      action: null,
    });
    expect(runtime?.targetSectionKey).toBeUndefined();
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
      title: '',
      metrics: [
        {
          value: '4,100+',
          eyebrow: 'Loans',
          label: 'loans fueling ministry growth.',
          tone: 'atlantean',
          valueTone: 'atlantean',
          action: {
            label: 'Explore loans',
            to: '/services/loans',
          },
        },
        {
          value: '$450 million',
          eyebrow: 'Planned Giving',
          label: 'distributed to ministries through AG Foundation.',
          tone: 'mango',
          action: {
            label: 'Plan with us',
            to: '/services/planned-giving',
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
        presentation: 'certificate_cards',
        leftTone: 'atlantean',
        leftTitle: 'Individual Retirement Accounts (IRAs)',
        leftBodyHtml: '<p>Traditional and Roth IRAs.</p>',
        leftButtonLabel: 'Explore IRAs',
        leftButtonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/services/retirement/iras',
        }),
        rightTone: 'mango',
        rightTitle: 'Deferred Compensation Plan (409A)',
        rightBodyHtml: '<p>Contribution limits beyond standard retirement options.</p>',
        rightButtonLabel: 'Explore 409A',
        rightButtonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/services/retirement/409a',
        }),
      },
    });

    expect(runtime?.presentation).toBe('certificate_cards');
    expect(runtime?.items).toEqual([
      expect.objectContaining({
        side: 'left',
        tone: 'atlantean',
        title: 'Individual Retirement Accounts (IRAs)',
        bodyHtml: '<p>Traditional and Roth IRAs.</p>',
        action: expect.objectContaining({
          label: 'Explore IRAs',
          to: '/services/retirement/iras',
        }),
      }),
      expect.objectContaining({
        side: 'right',
        tone: 'mango',
        title: 'Deferred Compensation Plan (409A)',
        bodyHtml: '<p>Contribution limits beyond standard retirement options.</p>',
        action: expect.objectContaining({
          label: 'Explore 409A',
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
    expect(runtime?.targetSectionKey).toBeUndefined();
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
      dataset: 'certificates',
      tableKey: 'certificates',
      sectionKey: 'certificates',
      panelId: 'rates-certificates',
      anchorId: 'certificates-rates',
      displayName: 'Certificates Rates',
      label: 'Certificates Rates',
      adminHref: '/admin/rates',
    });
    expect(iraRuntime).toMatchObject({
      dataset: 'ira',
      tableKey: 'ira',
      sectionKey: 'ira',
      panelId: 'rates-ira',
      anchorId: 'ira-rates',
      displayName: 'IRA Rates',
      label: 'IRA Rates',
      adminHref: '/admin/rates',
    });
  });

  it('keeps the 403(b) dataset identity explicit instead of inferring it from a page-content widget', () => {
    expect(buildDynamicRatesFromBlock({
      id: 'rate_table',
      kind: 'rates',
      mode: 'dynamic',
      variant: 'inline',
      settings: {
        dataset: '403b',
        panelId: 'rates-403b-investment-rate',
        anchorId: '403b-investment-rate',
        displayName: '403(b) Investment Rate',
      },
    })).toMatchObject({
      dataset: '403b',
      panelId: 'rates-403b-investment-rate',
      anchorId: '403b-investment-rate',
      displayName: '403(b) Investment Rate',
      label: '403(b) Investment Rate',
    });
  });

  it('rejects non-rates blocks for the shared rates runtime builder', () => {
    const runtime = buildDynamicRatesFromBlock({
      id: 'certificates_table',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {},
    });

    expect(runtime).toBeNull();
  });
});

describe('buildDynamicGridFromBlock', () => {
  it('restores Insurance coverage hover motion while allowing the editor to turn it off', () => {
    const legacyRuntime = buildDynamicGridFromBlock({
      id: 'insurance-coverage',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-coverage',
        cardStyle: 'none',
        card1Title: 'Property & Casualty',
      },
    });
    const disabledRuntime = buildDynamicGridFromBlock({
      id: 'insurance-coverage',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'insurance-native-coverage',
        cardStyle: 'none',
        cardHoverScale: false,
        card1Title: 'Property & Casualty',
      },
    });

    expect(legacyRuntime.cardHoverScale).toBe(true);
    expect(disabledRuntime.cardHoverScale).toBe(false);
  });

  it('keeps card data intact when the configured visible count is reduced', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        cardCount: '2',
        card1Title: 'First card',
        card2Title: 'Second card',
        card3Title: 'Third card that must come back',
        card3Body: 'Preserve this content.',
      },
    });

    expect(runtime.cardCount).toBe(2);
    expect(runtime.cards).toEqual([
      expect.objectContaining({ slot: 1, title: 'First card' }),
      expect.objectContaining({ slot: 2, title: 'Second card' }),
      expect.objectContaining({
        slot: 3,
        title: 'Third card that must come back',
        body: 'Preserve this content.',
      }),
    ]);
  });

  it('preserves the sandstone surface for card grids', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'loan-apply',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        title: 'How to apply',
        bgTone: 'sandstone',
        card1Title: '1',
        card1Body: 'Review the loan rules.',
      },
    });

    expect(runtime).toEqual(expect.objectContaining({
      bgTone: 'sandstone',
    }));
  });

  it('keeps legacy subhead and body fields rendering separately until the merged field is edited', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'legacy-step-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        title: 'How to enroll',
        subtitle: 'Easy steps.',
        bodyHtml: '<p>Follow the path below.</p>',
        card1Title: '1',
      },
    });

    expect(runtime).toEqual(expect.objectContaining({
      subtitle: 'Easy steps.',
      bodyHtml: '<p>Follow the path below.</p>',
      hasMergedIntro: false,
    }));
  });

  it('renders canonical merged intro HTML as one rich content stream', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'merged-step-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        title: 'How to enroll',
        introHtml: '<h3>Easy steps.</h3><p>Follow the path below.</p>',
        subtitle: 'Stale legacy value',
        bodyHtml: '<p>Stale legacy body.</p>',
        card1Title: '1',
      },
    });

    expect(runtime).toEqual(expect.objectContaining({
      subtitle: '',
      bodyHtml: '<h3>Easy steps.</h3><p>Follow the path below.</p>',
      hasMergedIntro: true,
    }));
  });

  it('keeps step-card defaults, authored colors, and header spacing in the shared runtime', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'step-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'step-cards',
      settings: {
        title: 'Three clear steps',
        introHtml: '<h3><span class="is-text-large">Start here.</span></h3>',
        bgTone: 'sandstone',
        titleTone: 'melon',
        bodyTone: 'mango',
        headerSizeRem: 3.1,
        subheadSizeRem: 1.6,
        headerSubheadSpaceRem: 4,
        headerCardsSpaceRem: 2.25,
        headerWidthPercent: 72,
        card1Title: 'First step',
        card1TitleClassName: 'is-atlantean',
        card1Body: 'Follow the first instruction.',
      },
    });

    expect(runtime).toEqual(expect.objectContaining({
      bgTone: 'sandstone',
      titleTone: 'melon',
      bodyTone: 'mango',
      headerSizeRem: 3.1,
      subheadSizeRem: 1.6,
      headerSubheadSpaceRem: 4,
      headerCardsSpaceRem: 2.25,
      headerWidthPercent: 72,
      bodyHtml: '<h3><span class="is-text-large">Start here.</span></h3>',
      subheadTone: 'super-grey',
    }));
    expect(runtime.cards[0]).toEqual(expect.objectContaining({
      titleClassName: 'is-atlantean',
    }));
  });

  it('normalizes Card Grid header colors to the same single token used by preview CSS', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'colored-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        title: 'How to apply',
        titleClassName: 'is-sandstone is-white',
        introHtml: '<h3 class="is-sandstone is-white">Start here.</h3><p>Follow the steps.</p>',
      },
    });

    expect(runtime.titleClassName).toBe('is-white');
    expect(runtime.bodyHtml).toBe('<h3 class="is-white">Start here.</h3><p>Follow the steps.</p>');
  });

  it('uses alternating title colors as the step-card default without overriding an explicit choice', () => {
    const defaultRuntime = buildDynamicGridFromBlock({
      id: 'default-step-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'step-cards',
      settings: { card1Title: 'First step' },
    });
    const explicitRuntime = buildDynamicGridFromBlock({
      id: 'explicit-step-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'step-cards',
      settings: { titleTone: 'super-grey', card1Title: 'First step' },
    });

    expect(defaultRuntime.titleTone).toBe('alternating');
    expect(explicitRuntime.titleTone).toBe('super-grey');
  });

  it('does not replace an authored card title color when the grid background changes', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'dark-step-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      presetId: 'step-cards',
      settings: {
        bgTone: 'grey',
        titleTone: 'super-grey',
        card1Title: 'First step',
        card2Title: 'Second step',
      },
    });

    expect(runtime).toEqual(expect.objectContaining({
      bgTone: 'grey',
      titleTone: 'super-grey',
    }));
  });

  it('keeps legacy cards visible when no explicit count was saved', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'legacy-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        card1Title: 'First card',
        card2Title: 'Second card',
      },
    });

    expect(runtime.cardCount).toBeNull();
    expect(runtime.cards).toEqual([
      expect.objectContaining({ slot: 1, title: 'First card' }),
      expect.objectContaining({ slot: 2, title: 'Second card' }),
    ]);
  });

  it('keeps an untitled card untitled instead of inventing a Card label', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'cga-assets',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        cardStyle: 'planned-giving-centered',
        card1ListJson: JSON.stringify(['Cash', 'Securities']),
      },
    });

    expect(runtime.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: '',
        list: ['Cash', 'Securities'],
      }),
    ]);
  });

  it('preserves card fineprint justification', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'fineprint-justify-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        card1ListJson: JSON.stringify(['First bullet']),
        card1Fineprint: 'Additional note',
        card1FineprintJustify: 'right',
        card1FineprintSpaceBeforeRem: 1.2,
        card1FineprintLineHeight: 1.7,
        card1FineprintSpaceAfterRem: 0.4,
      },
    });

    expect(runtime.cards[0]).toEqual(expect.objectContaining({
      fineprint: ['Additional note'],
      fineprintJustify: 'right',
      fineprintSpaceBeforeRem: 1.2,
      fineprintLineHeight: 1.7,
      fineprintSpaceAfterRem: 0.4,
    }));
  });

  it('preserves flexible card-grid header controls and spacing overrides', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'flexible-header-grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        title: 'Every loan, 100% customized.',
        titleClassName: 'is-super-grey loans-native-options-title',
        subtitle: "You won't find this at a bank.",
        subtitleClassName: 'is-mango',
        subtitleHighlightsJson: JSON.stringify([{ start: 4, end: 8, className: 'is-atlantean' }]),
        bodyHtml: '<p>We are part of your ministry.</p>',
        paddingTopRem: 3.25,
        paddingBottomRem: 1.25,
        headerSubheadSpaceRem: 0.7,
        card1Title: 'Permanent',
      },
    });

    expect(runtime).toEqual(expect.objectContaining({
      title: 'Every loan, 100% customized.',
      titleClassName: 'is-super-grey loans-native-options-title',
      subtitle: "You won't find this at a bank.",
      subtitleClassName: 'is-mango',
      subtitleHighlights: [{ start: 4, end: 8, className: 'is-atlantean', text: '' }],
      paddingTopRem: 3.25,
      paddingBottomRem: 1.25,
      headerSubheadSpaceRem: 0.7,
    }));
  });

  it('uses readable shared bullet defaults for legacy flexible-card settings', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'gift-assets',
      templateId: 'card_grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-assets',
        card1Title: 'Assets you may give',
        card1ListJson: '["Cash", "Securities"]',
        cardBulletSizeRem: null,
        cardBulletLineHeight: null,
      },
    });

    expect(runtime.cardBulletSizeRem).toBe(1.55);
    expect(runtime.cardBulletLineHeight).toBe(1.5);
  });

  it('upgrades legacy placeholder line height without changing bullet content', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'gift-assets',
      templateId: 'card_grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-assets',
        card1ListJson: '["Cash"]',
        cardBulletSize: 1.85,
        cardBulletLineHeight: 1,
      },
    });

    expect(runtime.cardBulletSizeRem).toBe(1.85);
    expect(runtime.cardBulletLineHeight).toBe(1.5);
    expect(runtime.cards[0].list).toEqual(['Cash']);
  });

  it('does not let blank HUD rich-text placeholders change bullet spacing', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'gift-types',
      templateId: 'card_grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        sectionClassName: 'legacy-child-native-assets',
        card1Title: 'Gift types',
        card1Body: '<br><p></p>',
        card1ListJson: '["Stock", "Real estate"]',
      },
    });

    expect(runtime.cards[0].body).toBe('');
    expect(runtime.cards[0].bodyHtml).toBe('');
    expect(runtime.cards[0].list).toEqual(['Stock', 'Real estate']);
  });

  it('keeps a trailing editor space from becoming a literal nbsp in plain card copy', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'grid',
      templateId: 'card_grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        card1Title: 'Card copy',
        card1Body: 'Alpha&nbsp;',
      },
    });

    expect(runtime.cards[0].body).toBe('Alpha ');
    expect(runtime.cards[0].body).not.toContain('&nbsp;');
  });

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
        cardPaddingRem: 2.2,
        cardTitleSizeRem: 1.5,
        cardTitleLineHeight: 1.1,
        cardBodySizeRem: 1.2,
        cardBulletSize: 'large',
        cardBulletSizeRem: 1.72,
        cardBulletLineHeight: 1.7,
        cardBodyLineHeight: 1.8,
        card1Title: 'First option',
        card1Body: '<ul><li>Rich bullet</li></ul>',
        card1IconKey: 'daf-step-1',
        card1IconTone: 'atlantean',
        card1ListJson: '["First bullet","Second bullet"]',
        card1ButtonLabel: 'Learn more',
        card1ButtonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/services/retirement',
        }),
        card1ButtonClassName: 'custom-grid-action',
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
      cardPaddingRem: 2.2,
      cardTitleSizeRem: 1.5,
      cardTitleLineHeight: 1.1,
      cardBodySizeRem: 1.2,
      cardBulletSize: 'large',
      cardBulletSizeRem: 1.72,
      cardBulletLineHeight: 1.7,
      cardBodyLineHeight: 1.8,
    });
    expect(runtime.titleHighlights).toEqual([{ text: 'options', className: 'is-mango' }]);
    expect(runtime.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: 'First option',
        body: '',
        bodyHtml: '<ul><li>Rich bullet</li></ul>',
        list: ['First bullet', 'Second bullet'],
        iconKey: 'daf-step-1',
        iconTone: 'atlantean',
        cardClass: 'card1',
        action: expect.objectContaining({
          label: 'Learn more',
          to: '/services/retirement',
          style: 'blue',
          tone: 'atlantean',
          className: 'custom-grid-action',
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
              { label: 'Annual report', href: 'https://example.com/annual-report.pdf' },
            ],
          },
        ]),
      },
    });

    expect(runtime).toMatchObject({
      presetId: 'investment-options',
      columns: 'one',
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

  it('keeps canonical preset identity on card-grid runtime blocks', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'who_qualifies',
      kind: 'card_grid',
      mode: 'dynamic',
      templateId: 'card_grid',
      presetId: 'eligibility-cards',
      settings: {
        card1Title: 'Eligible ministers',
      },
    });

    expect(runtime?.presetId).toBe('eligibility-cards');
  });

  it('restores the About values block to the animated value-card presentation from its section class', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'values',
      kind: 'card_grid',
      mode: 'dynamic',
      templateId: 'card_grid',
      presetId: 'default',
      settings: {
        sectionClassName: 'about-native-values',
        cardStyle: 'none',
        card1Title: 'Focus',
        card1Body: 'Focused copy.',
        card1PanelTone: 'blue',
        card2Title: 'Responsibility',
        card2Body: 'Responsible copy.',
        card2PanelTone: 'mango',
        card3Title: 'Guidance',
        card3Body: 'Guidance copy.',
        card3PanelTone: 'sand',
      },
    });

    expect(runtime).toMatchObject({
      presetId: 'default',
      cardsPreset: 'value-cards',
      sectionClassName: 'about-native-values',
      cards: [
        expect.objectContaining({ title: 'Focus', panelTone: 'blue' }),
        expect.objectContaining({ title: 'Responsibility', panelTone: 'mango' }),
        expect.objectContaining({ title: 'Guidance', panelTone: 'sand' }),
      ],
    });
  });

  it('preserves authored tones while still keeping the card style compatible', () => {
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

    expect(runtime?.titleTone).toBe('white');
    expect(runtime?.bodyTone).toBe('white');
    expect(runtime?.cardStyle).toBe('card2');
    expect(runtime?.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: 'Coverage',
        cardClass: 'card2',
      }),
    ]);
  });

  it('preserves independently authored card outline and shadow choices', () => {
    const runtime = buildDynamicGridFromBlock({
      id: 'grid',
      kind: 'card_grid',
      mode: 'dynamic',
      settings: {
        bgTone: 'white',
        cardStyle: 'card2',
        cardOutline: true,
        cardShadow: false,
        card1Title: 'Coverage',
      },
    });

    expect(runtime?.cardStyle).toBe('card2');
    expect(runtime?.cardOutline).toBe(true);
    expect(runtime?.cardShadow).toBe(false);
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
        card1ButtonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/services/retirement',
        }),
      },
    });

    expect(runtime?.cards).toEqual([
      expect.objectContaining({
        slot: 1,
        title: '',
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
              { label: 'Annual report', href: 'https://example.com/annual-report.pdf' },
            ],
          },
        ]),
        card1ButtonLabel: 'Enroll now',
        card1ButtonLinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/services/retirement/403b/403b-individual-enrollment',
        }),
        card1Button2Label: 'Prospectus',
        card1Button2LinkJson: serializeLinkValue({
          kind: 'internal',
          to: '/prospectus',
        }),
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
              expect.objectContaining({
                label: 'Annual report',
                href: 'https://example.com/annual-report.pdf',
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

  it('preserves authored card title and body colors when the grid background is dark', () => {
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

    expect(runtime?.titleTone).toBe('super-grey');
    expect(runtime?.bodyTone).toBe('super-grey');
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
        bodyColorClassName: 'is-melon',
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
      bodyColorClassName: 'is-melon',
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
    });
    expect(runtime?.targetSectionKey).toBeUndefined();
    expect(runtime?.targetFineprintSectionKey).toBeUndefined();
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
      library: [],
    });

    expect(runtime).toBeNull();
  });

  it('falls back to the default testimonial tag when manual ids are stale', () => {
    const runtime = buildDynamicTestimonialsFromBlock(
      {
        id: 'testimonials',
        kind: 'testimonials',
        mode: 'dynamic',
        settings: {
          selectionMode: 'manual',
          selectedIdsCsv: 'testimonial-8-1\ntestimonial-8-2\ntestimonial-8-3',
          defaultTag: 'legacy-giving',
          limit: 2,
        },
      },
      {
        library: [
          {
            id: 'mike-daf-corporate-client',
            quote: 'Legacy quote one',
            author: 'Mike',
            tags: ['legacy-giving'],
          },
          {
            id: 'bryan-jarrett-northplace-legacy',
            quote: 'Legacy quote two',
            author: 'Bryan',
            tags: ['legacy-giving'],
          },
          {
            id: 'loan-match',
            quote: 'Loan quote',
            author: 'Loan Author',
            tags: ['loans'],
          },
        ],
      },
    );

    expect(runtime?.items.map((item) => item.id)).toEqual([
      'mike-daf-corporate-client',
      'bryan-jarrett-northplace-legacy',
    ]);
  });

  it('uses a block-owned default testimonial tag instead of inferring one from the route', () => {
    const runtime = buildDynamicTestimonialsFromBlock(
      {
        id: 'testimonials',
        kind: 'testimonials',
        mode: 'dynamic',
        settings: {
          selectionMode: 'tag',
          filterTagsCsv: '',
          defaultTag: 'legacy-giving',
          limit: 1,
        },
      },
      {
        library: [
          {
            id: 'legacy-match',
            quote: 'Legacy quote',
            author: 'Legacy Author',
            tags: ['legacy-giving'],
          },
          {
            id: 'loan-match',
            quote: 'Loan quote',
            author: 'Loan Author',
            tags: ['loans'],
          },
        ],
      },
    );

    expect(runtime?.items).toEqual([
      expect.objectContaining({
        id: 'legacy-match',
        quote: 'Legacy quote',
      }),
    ]);
  });
});

describe('buildDynamicCardChartFromBlock', () => {
  it('passes each card color setting through to the shared chart columns', () => {
    const runtime = buildDynamicCardChartFromBlock({
      id: 'comparison_table',
      kind: 'card_chart',
      mode: 'dynamic',
      settings: {
        cardCount: '2',
        bgTone: 'blue',
        card1Title: 'First option',
        card1Color: 'melon',
        card1Bullets: 'First point',
        card2Title: 'Second option',
        card2Color: 'sandstone',
        card2Bullets: 'Second point',
      },
    });

    expect(runtime.bgTone).toBe('blue');
    expect(runtime.table.columnTones).toEqual(['melon', 'sandstone']);
  });

  it('normalizes reusable card titles and newline bullets into the shared chart runtime', () => {
    const runtime = buildDynamicCardChartFromBlock({
      id: 'comparison_table',
      kind: 'card_chart',
      mode: 'dynamic',
      settings: {
        title: 'The differences. At a glance.',
        cardCount: '2',
        card1Title: 'Traditional IRA',
        card1Bullets: 'Must have earned income\nContributions may be tax-deductible',
        card2Title: 'Roth IRA',
        card2Bullets: 'Income limits must be met\nNo age limit to contribute',
        fineprint: 'Contact your tax advisor.',
        fineprintDisclosureId: 'ira-comparison-disclosure',
        valueAlignment: 'left',
        sectionClassName: 'retirement-child-native-comparison',
      },
    });

    expect(runtime).toMatchObject({
      title: 'The differences. At a glance.',
      table: {
        headers: ['Traditional IRA', 'Roth IRA'],
        rows: [['Must have earned income\nContributions may be tax-deductible', 'Income limits must be met\nNo age limit to contribute']],
        firstColumnHeader: false,
      },
      fineprint: ['Contact your tax advisor.'],
      fineprintDisclosureId: 'ira-comparison-disclosure',
      sectionClassName: 'retirement-child-native-comparison',
    });
    expect(runtime.table.valueAlignment).toBe('left');
  });

  it('defaults and normalizes chart spacing and content width in the shared runtime', () => {
    const baseBlock = {
      id: 'contribution_limits',
      kind: 'card_chart',
      mode: 'dynamic',
      settings: {
        title: 'Annual Contribution Limits',
        cardCount: '2',
        card1Title: '2026',
        card1Bullets: 'Under 50: $24,500',
        card2Title: '2025',
        card2Bullets: 'Under 50: $23,500',
      },
    };

    expect(buildDynamicCardChartFromBlock(baseBlock)).toMatchObject({
      headerGapRem: 2.4,
      paddingTopRem: 2.4,
      paddingBottomRem: 2.4,
      cellTextSizeRem: 1.05,
      cellTextWeight: 650,
      contentMaxWidthPx: 1180,
    });
    expect(buildDynamicCardChartFromBlock({
      ...baseBlock,
      settings: {
        ...baseBlock.settings,
        headerGapRem: 4.25,
        paddingTopRem: 1.5,
        paddingBottomRem: 3.75,
        cellTextSizeRem: 1.3,
        cellTextWeight: 780,
        contentMaxWidthPx: 1320,
      },
    })).toMatchObject({
      headerGapRem: 4.25,
      paddingTopRem: 1.5,
      paddingBottomRem: 3.75,
      cellTextSizeRem: 1.3,
      cellTextWeight: 780,
      contentMaxWidthPx: 1320,
    });
  });
});

describe('buildDynamicPageContentFromBlock', () => {
  it('normalizes page content blocks into one canonical runtime shape', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'page_content',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Annual Contribution Limits',
        titleClassName: 'is-atlantean',
        titleHighlightsJson: '[{"text":"Limits","className":"is-mango"}]',
        subtitle: 'Updated for 2026',
        body: ['Line one.', 'Line two.'],
        html: '<p>Body copy.</p>',
        bodyFontSizeRem: 1.35,
        widget: 'retirement-403b-rate-table',
        logoImage: '/logo.png',
        logoAlt: 'Partner logo',
        logoText: '',
        spaceBeforeRem: 1.25,
        spaceAfterRem: 0.75,
        paddingTopRem: 3,
        paddingBottomRem: 2,
        contentMaxWidthPx: 1140,
        anchorId: 'section-anchor',
        sectionClassName: 'custom-shell',
        railClassName: 'native-info-viewport-bleed',
        copyWrap: true,
        buttonLabel: 'Download form',
        buttonDocumentId: 'document-example',
        tableHeadersJson: ['Limit', '2026'],
        tableRowsJson: [['Under 50', '$24,500']],
        tableValueAlignment: 'left',
        tableChartId: 'managed-chart',
        fineprint: ['Rates subject to change.', 'Contact your advisor.'],
        fineprintDisclosureId: 'managed-disclosure',
        addressClassName: 'custom-address',
        addressTitle: 'AGFinancial',
        addressLines: 'PO Box 2515\nSpringfield MO 65801',
      },
    });

    expect(runtime).toEqual({
      title: 'Annual Contribution Limits',
      titleHtml: '',
      titleClassName: 'is-atlantean',
      titleHighlights: [{ text: 'Limits', className: 'is-mango' }],
      headingLevel: 'h2',
      subtitle: 'Updated for 2026',
      body: ['Line one.', 'Line two.'],
      html: '<p>Body copy.</p>',
      bodyFontSizeRem: 1.35,
      widget: 'retirement-403b-rate-table',
      logoImage: '/logo.png',
      logoAlt: 'Partner logo',
      logoText: '',
      bgTone: 'white',
      textTone: 'dark',
      table: {
        headers: ['Limit', '2026'],
        rows: [['Under 50', '$24,500']],
        valueAlignment: 'left',
        firstColumnHeader: true,
      },
      tableChartId: 'managed-chart',
      supportGroups: [],
      supportGroupsExpanded: false,
      supportGroupsCollapsible: true,
      fineprint: ['Rates subject to change.', 'Contact your advisor.'],
      fineprintDisclosureId: 'managed-disclosure',
      fullBleed: false,
      spaceBeforeRem: 1.25,
      spaceAfterRem: 0.75,
      paddingTopRem: 3,
      paddingBottomRem: 2,
      contentMaxWidthPx: 1140,
      anchorId: 'section-anchor',
      sectionClassName: 'custom-shell',
      railClassName: 'native-info-viewport-bleed',
      copyWrap: true,
      justify: 'center',
      actions: [
        {
          label: 'Download form',
          link: {
            kind: 'document',
            documentId: 'document-example',
            openInNewWindow: false,
          },
          style: '',
          tone: '',
          openInNewWindow: false,
          documentId: 'document-example',
          href: undefined,
          to: undefined,
        },
      ],
      addressBlock: {
        className: 'custom-address',
        title: 'AGFinancial',
        lines: ['PO Box 2515', 'Springfield MO 65801'],
      },
    });
  });

  it('carries admin-selected surface and text tones into the shared page-content runtime', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'loan_details',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        html: '<div class="retirement-403b-loan-copy"><h2>403(b) Plan Loans</h2></div>',
        bgTone: 'grey',
        textTone: 'white',
      },
    });

    expect(runtime).toMatchObject({
      bgTone: 'grey',
      textTone: 'white',
    });
  });

  it('allows managed page content to render as a page-level heading when requested', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'page_header',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Loan Consultants',
        headingLevel: 'h1',
      },
    });

    expect(runtime?.headingLevel).toBe('h1');
  });

  it('preserves approved page-content logo keys for route renderers', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'mission-assure-intro',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        title: 'Every trip is a step of faith.',
        logoKey: 'mission-assure',
      },
    });

    expect(runtime?.logoKey).toBe('mission-assure');
  });

  it('preserves page content table settings when the first visible column is not a row header', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'page_content',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        tableHeadersJson: ['Traditional IRA', 'Roth IRA'],
        tableRowsJson: [
          ['Eligibility\nMust have earned income.', 'Eligibility\nMust meet Roth IRA income eligibility limits.'],
        ],
        tableFirstColumnHeader: false,
      },
    });

    expect(runtime?.table).toEqual({
      headers: ['Traditional IRA', 'Roth IRA'],
      rows: [['Eligibility\nMust have earned income.', 'Eligibility\nMust meet Roth IRA income eligibility limits.']],
      valueAlignment: undefined,
      firstColumnHeader: false,
    });
  });

  it('parses page content support groups with document links', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'support',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        supportGroupsExpanded: true,
        supportGroupsCollapsible: false,
        supportGroupsJson: JSON.stringify([
          {
            title: 'Plan details',
            links: [
              {
                label: 'Ministers enrolled after March 1, 2005 (PDF)',
                documentId: 'policy-insurance-group-life-credentialed-ministers-after-2005',
              },
              {
                label: 'External packet',
                href: 'https://example.com/packet.pdf',
                openInNewWindow: true,
              },
            ],
          },
        ]),
      },
    });

    expect(runtime?.supportGroups).toEqual([
      {
        title: 'Plan details',
        links: [
          {
            label: 'Ministers enrolled after March 1, 2005 (PDF)',
            documentId: 'policy-insurance-group-life-credentialed-ministers-after-2005',
          },
          {
            label: 'External packet',
            href: 'https://example.com/packet.pdf',
            openInNewWindow: true,
          },
        ],
        items: [],
      },
    ]);
    expect(runtime?.supportGroupsExpanded).toBe(true);
    expect(runtime?.supportGroupsCollapsible).toBe(false);
  });

  it('renders the first-class support library kind through the same public runtime', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'support',
      kind: 'support_library',
      mode: 'dynamic',
      settings: {
        title: 'Support for current clients',
        supportGroupsJson: JSON.stringify([{ title: 'Forms', links: [{ label: 'Enrollment form', to: '/forms' }] }]),
      },
    });

    expect(runtime).toMatchObject({
      title: 'Support for current clients',
      supportGroups: [{ title: 'Forms', links: [{ label: 'Enrollment form', to: '/forms' }] }],
    });
  });

  it('returns null when page content payload is blank', () => {
    const runtime = buildDynamicPageContentFromBlock({
      id: 'page_content',
      kind: 'content',
      mode: 'dynamic',
      settings: {
        html: '   ',
        body: '   ',
        fineprint: '   ',
      },
    });

    expect(runtime).toBeNull();
  });
});
