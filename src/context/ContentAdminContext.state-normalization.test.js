import { describe, expect, it } from 'vitest';
import { normalizeStoredConfig } from './ContentAdminContext';

describe('ContentAdminContext state normalization', () => {
  it('keeps the latest duplicate home columns block by id', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'columns_math',
            kind: 'columns',
            mode: 'static',
            settings: {
              col1Type: 'photo',
              col1ImageUrl: 'bad-photo.jpg',
              col2Type: 'photo',
              col2ImageUrl: 'bad-photo-2.jpg',
            },
          },
          {
            id: 'columns_math',
            kind: 'columns',
            mode: 'dynamic',
            settings: {
              col1Type: 'text',
              col1Title: '(let us) Do the math.',
              col1Body: 'Retirement savings, compound interest, loan payments, net worth, and more.',
              col2Type: 'photo',
              col2ImageUrl: 'math-photo.jpg',
            },
          },
        ],
      },
    });

    const homeBlocks = normalized.blocksByPath['/'] || [];
    const mathBlocks = homeBlocks.filter((block) => block?.id === 'columns_math');

    expect(mathBlocks).toHaveLength(1);
    expect(mathBlocks[0]?.mode).toBe('dynamic');
    expect(mathBlocks[0]?.settings?.col1Type).toBe('text');
    expect(mathBlocks[0]?.settings?.col1Title).toBe('(let us) Do the math.');
  });

  it('seeds the home columns blocks on the dynamic canonical path by default', () => {
    const normalized = normalizeStoredConfig({});
    const homeBlocks = normalized.blocksByPath['/'] || [];
    const columnsMhaBlock = homeBlocks.find((block) => block?.id === 'columns_mha');
    const columnsMathBlock = homeBlocks.find((block) => block?.id === 'columns_math');

    expect(columnsMhaBlock).toBeTruthy();
    expect(columnsMhaBlock?.mode).toBe('dynamic');
    expect(columnsMhaBlock?.kind).toBe('columns');
    expect(Array.isArray(columnsMhaBlock?.editableFields) ? columnsMhaBlock.editableFields.length : 0).toBeGreaterThan(0);

    expect(columnsMathBlock).toBeTruthy();
    expect(columnsMathBlock?.mode).toBe('dynamic');
    expect(columnsMathBlock?.kind).toBe('columns');
    expect(Array.isArray(columnsMathBlock?.editableFields) ? columnsMathBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('upgrades legacy loans placeholder blocks to dynamic defaults', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/loans': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            settings: {
              line1Text: 'Your vision.',
              line2Text: 'Our purpose.',
            },
            editableFields: [{ id: 'line1Text', label: 'Line 1', type: 'text' }],
          },
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'The right loan can change everything.',
            },
            editableFields: [{ id: 'heading', label: 'Heading', type: 'text' }],
          },
          { id: 'request_form', kind: 'request_form', mode: 'static', settings: {}, editableFields: [] },
          { id: 'value_cards', kind: 'columns', mode: 'static', settings: {}, editableFields: [] },
          { id: 'vision_fuel', kind: 'billboard', mode: 'static', settings: {}, editableFields: [] },
          { id: 'cta_form', kind: 'cta_form', mode: 'static', settings: {}, editableFields: [] },
          { id: 'testimonials', kind: 'testimonials', mode: 'static', settings: {}, editableFields: [] },
        ],
      },
    });

    const loansBlocks = normalized.blocksByPath['/services/loans'] || [];
    const modeById = new Map(loansBlocks.map((block) => [block?.id, block?.mode]));

    expect(modeById.get('hero')).toBe('dynamic');
    expect(modeById.get('intro')).toBe('dynamic');
    expect(modeById.get('request_form')).toBe('dynamic');
    expect(modeById.get('value_cards')).toBe('dynamic');
    expect(modeById.get('vision_fuel')).toBe('dynamic');
    expect(modeById.get('cta_form')).toBe('dynamic');
    expect(modeById.get('testimonials')).toBe('dynamic');
  });

  it('seeds legacy giving with a CTA block instead of a request-form block', () => {
    const normalized = normalizeStoredConfig({});
    const legacyGivingBlocks = normalized.blocksByPath['/services/legacy-giving'] || [];
    const requestBlock = legacyGivingBlocks.find((block) => block?.kind === 'request_form');
    const ctaBlock = legacyGivingBlocks.find((block) => block?.kind === 'cta_form');

    expect(requestBlock).toBeUndefined();
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock.mode).toBe('dynamic');
    expect(ctaBlock.settings.targetSectionClassName).toBe('legacy-giving-cta');
    expect(ctaBlock.settings.field4Label).toBe('Legacy giving product of interest*');
    expect(ctaBlock.settings.field4Type).toBe('select');
    expect(ctaBlock.settings.field4Required).toBe(true);
    expect(ctaBlock.settings.field5Label).toBe('Message');
    expect(ctaBlock.settings.field5Type).toBe('textarea');
  });

  it('drops stale legacy-giving request-form blocks from stored config and keeps the CTA block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/legacy-giving': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old request block',
            },
          },
        ],
      },
    });

    const legacyGivingBlocks = normalized.blocksByPath['/services/legacy-giving'] || [];
    expect(legacyGivingBlocks.some((block) => block?.kind === 'request_form')).toBe(false);
    expect(legacyGivingBlocks.some((block) => block?.kind === 'cta_form')).toBe(true);
  });

  it('drops duplicate endowments request-form blocks and keeps the canonical legacy-form target', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/legacy-giving/endowments': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Maybe this is an interest or inquiry form.',
              targetSectionKey: 'class:legacy-child-native-endowments-inquiry',
              targetSectionClassName: 'legacy-child-native-endowments-inquiry',
            },
          },
          {
            id: 'request_form_legacy_child_native_endowments_legacy_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'A legacy of giving.',
              targetSectionKey: 'class:legacy-child-native-endowments-legacy-form',
              targetSectionClassName: 'legacy-child-native-endowments-legacy-form',
            },
          },
        ],
      },
    });

    const requestBlocks = (normalized.blocksByPath['/services/legacy-giving/endowments'] || [])
      .filter((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlocks).toHaveLength(1);
    expect(requestBlocks[0]?.id).toBe('request_form');
    expect(requestBlocks[0]?.settings?.title).toBe('Begin the Endowment sign up process');
    expect(requestBlocks[0]?.settings?.targetSectionKey).toBe('class:legacy-child-native-endowments-legacy-form');
    expect(requestBlocks[0]?.settings?.targetSectionClassName).toBe('legacy-child-native-endowments-legacy-form');
    expect(String(requestBlocks[0]?.settings?.step1Title || '')).toBe('');
  });

  it('drops duplicate generosity-fund request-form blocks and keeps the canonical request target', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/legacy-giving/generosity-fund': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old generosity request block',
              targetSectionKey: '',
              targetSectionClassName: '',
            },
          },
          {
            id: 'request_form_legacy_child_native_generosity_request',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Make the most of your giving.',
              targetSectionKey: 'class:legacy-child-native-generosity-request',
              targetSectionClassName: 'legacy-child-native-generosity-request',
            },
          },
        ],
      },
    });

    const requestBlocks = (normalized.blocksByPath['/services/legacy-giving/generosity-fund'] || [])
      .filter((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlocks).toHaveLength(1);
    expect(requestBlocks[0]?.id).toBe('request_form');
    expect(requestBlocks[0]?.settings?.title).toBe('Make the most of your giving.');
    expect(requestBlocks[0]?.settings?.targetSectionKey).toBe('class:legacy-child-native-generosity-request');
    expect(requestBlocks[0]?.settings?.targetSectionClassName).toBe('legacy-child-native-generosity-request');
  });

  it('drops duplicate charitable-gift-annuities request-form blocks and restores the canonical dynamic request target', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/legacy-giving/charitable-gift-annuities': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'static',
            settings: {
              title: 'Legacy request block',
              targetSectionKey: '',
              targetSectionClassName: '',
            },
          },
          {
            id: 'request_form_legacy_child_native_cga_request',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Another legacy request block',
              targetSectionKey: 'class:legacy-child-native-cga-request',
              targetSectionClassName: 'legacy-child-native-cga-request',
            },
          },
        ],
      },
    });

    const requestBlocks = (normalized.blocksByPath['/services/legacy-giving/charitable-gift-annuities'] || [])
      .filter((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlocks).toHaveLength(1);
    expect(requestBlocks[0]?.id).toBe('request_form');
    expect(requestBlocks[0]?.mode).toBe('dynamic');
    expect(requestBlocks[0]?.settings?.title).toBe('Your gifts are more powerful than you think.');
    expect(requestBlocks[0]?.settings?.targetSectionKey).toBe('class:legacy-child-native-cga-request');
    expect(requestBlocks[0]?.settings?.targetSectionClassName).toBe('legacy-child-native-cga-request');
  });

  it('drops duplicate ministry-impact-fund request-form blocks and restores the canonical dynamic request target', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/legacy-giving/ministry-impact-fund': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'static',
            settings: {
              title: 'Legacy request block',
              targetSectionKey: '',
              targetSectionClassName: '',
            },
          },
          {
            id: 'request_form_legacy_child_native_request',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Another legacy request block',
              targetSectionKey: 'class:legacy-child-native-request',
              targetSectionClassName: 'legacy-child-native-request',
            },
          },
        ],
      },
    });

    const requestBlocks = (normalized.blocksByPath['/services/legacy-giving/ministry-impact-fund'] || [])
      .filter((block) => String(block?.kind || '').trim().toLowerCase() === 'request_form');

    expect(requestBlocks).toHaveLength(1);
    expect(requestBlocks[0]?.id).toBe('request_form');
    expect(requestBlocks[0]?.mode).toBe('dynamic');
    expect(requestBlocks[0]?.settings?.title).toBe('A legacy of giving.');
    expect(requestBlocks[0]?.settings?.targetSectionKey).toBe('class:legacy-child-native-request');
    expect(requestBlocks[0]?.settings?.targetSectionClassName).toBe('legacy-child-native-request');
  });

  it('seeds 403(b) with a CTA block instead of a request-form block', () => {
    const normalized = normalizeStoredConfig({});
    const retirement403bBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    const heroBlock = retirement403bBlocks.find((block) => block?.id === 'hero' && block?.kind === 'hero');
    const introBlock = retirement403bBlocks.find((block) => block?.id === 'intro' && block?.kind === 'intro');
    const requestBlock = retirement403bBlocks.find((block) => block?.kind === 'request_form');
    const ctaBlock = retirement403bBlocks.find((block) => block?.kind === 'cta_form');

    expect(heroBlock).toBeTruthy();
    expect(heroBlock?.mode).toBe('dynamic');
    expect(heroBlock?.settings?.justify).toBe('right');
    expect(introBlock?.settings?.bgTone).toBe('sand');
    expect(introBlock?.settings?.textTone).toBe('dark');
    expect(requestBlock).toBeUndefined();
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock.mode).toBe('dynamic');
    expect(ctaBlock.settings.targetSectionClassName).toBe('');
    expect(ctaBlock.settings.bodyHtml).toBe('');
    expect(ctaBlock.settings.subtitle).toBe('And we’re eager to help.');
    expect(ctaBlock.settings.bgTone).toBe('white');
    expect(ctaBlock.settings.submitLabel).toBe('Follow-up with me');
    expect(ctaBlock.settings.field1Label).toBe('Name*');
    expect(ctaBlock.settings.field2Label).toBe('Email*');
    expect(ctaBlock.settings.field3Label).toBe('Phone*');
  });

  it('drops stale 403(b) request-form blocks from stored config and keeps the CTA block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old retirement request block',
            },
          },
        ],
      },
    });

    const retirement403bBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    expect(retirement403bBlocks.some((block) => block?.kind === 'request_form')).toBe(false);
    expect(retirement403bBlocks.some((block) => block?.kind === 'cta_form')).toBe(true);
  });

  it('seeds calculators with a CTA block instead of a request-form block', () => {
    const normalized = normalizeStoredConfig({});
    const calculatorBlocks = normalized.blocksByPath['/calculators'] || [];
    const requestBlock = calculatorBlocks.find((block) => block?.kind === 'request_form');
    const ctaBlock = calculatorBlocks.find((block) => block?.kind === 'cta_form');

    expect(requestBlock).toBeUndefined();
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.mode).toBe('dynamic');
    expect(ctaBlock?.settings?.targetSectionClassName).toBe('calculators-native-contact');
    expect(ctaBlock?.settings?.bgTone).toBe('white');
    expect(ctaBlock?.settings?.titleClassName).toBe('is-atlantean');
    expect(ctaBlock?.settings?.field1Label).toBe('First Name*');
    expect(ctaBlock?.settings?.field5Label).toBe('What would you like help calculating?');
  });

  it('drops stale calculators request-form blocks from stored config and keeps the CTA block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/calculators': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old calculator request block',
            },
          },
        ],
      },
    });

    const calculatorBlocks = normalized.blocksByPath['/calculators'] || [];
    const ctaBlock = calculatorBlocks.find((block) => block?.kind === 'cta_form');

    expect(calculatorBlocks.some((block) => block?.kind === 'request_form')).toBe(false);
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.settings?.targetSectionClassName).toBe('calculators-native-contact');
    expect(ctaBlock?.settings?.bgTone).toBe('white');
  });

  it('seeds about us with a CTA block instead of a request-form block', () => {
    const normalized = normalizeStoredConfig({});
    const aboutBlocks = normalized.blocksByPath['/about-us'] || [];
    const requestBlock = aboutBlocks.find((block) => block?.kind === 'request_form');
    const ctaBlock = aboutBlocks.find((block) => block?.kind === 'cta_form');

    expect(requestBlock).toBeUndefined();
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.mode).toBe('dynamic');
    expect(ctaBlock?.settings?.targetSectionClassName).toBe('about-native-cta-form');
    expect(ctaBlock?.settings?.title).toBe('What can we do for you?');
    expect(ctaBlock?.settings?.titleClassName).toBe('is-atlantean');
    expect(ctaBlock?.settings?.field4Label).toBe('What would you like to discuss?');
  });

  it('drops stale about-us request-form blocks from stored config and keeps the CTA block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/about-us': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            settings: {
              title: 'Old about-us request block',
            },
          },
        ],
      },
    });

    const aboutBlocks = normalized.blocksByPath['/about-us'] || [];
    const ctaBlock = aboutBlocks.find((block) => block?.kind === 'cta_form');

    expect(aboutBlocks.some((block) => block?.kind === 'request_form')).toBe(false);
    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.settings?.targetSectionClassName).toBe('about-native-cta-form');
  });

  it('seeds the other audited CTA-owned form routes with CTA blocks instead of request-form blocks', () => {
    const normalized = normalizeStoredConfig({});
    const auditedRoutes = [
      ['/services/insurance', 'insurance-native-cta'],
      ['/services/retirement/409a', 'retirement-child-native-cta'],
      ['/services/retirement/rollovers', 'retirement-rollovers-native-cta retirement-child-native-cta'],
    ];

    auditedRoutes.forEach(([pathname, targetSectionClassName]) => {
      const blocks = normalized.blocksByPath[pathname] || [];
      const requestBlock = blocks.find((block) => block?.kind === 'request_form');
      const ctaBlock = blocks.find((block) => block?.kind === 'cta_form');

      expect(requestBlock, pathname).toBeUndefined();
      expect(ctaBlock, pathname).toBeTruthy();
      expect(ctaBlock?.mode, pathname).toBe('dynamic');
      expect(ctaBlock?.settings?.targetSectionClassName, pathname).toBe(targetSectionClassName);
    });
  });

  it('keeps the charitable-trusts CTA seed fields and presentation settings aligned through the shared CTA max-field cap', () => {
    const normalized = normalizeStoredConfig({});
    const charitableTrustsBlocks = (normalized.blocksByPath['/services/legacy-giving/charitable-trusts'] || [])
      .filter((block) => block?.kind === 'cta_form');
    const inlineCtaBlock = charitableTrustsBlocks.find((block) => (
      block?.settings?.targetSectionClassName === 'legacy-child-native-cta legacy-child-native-trusts-cta legacy-child-native-trusts-cta-inline'
    ));
    const fallbackCtaBlock = charitableTrustsBlocks.find((block) => (
      block?.settings?.targetSectionClassName === 'legacy-child-native-cta legacy-child-native-trusts-cta'
    ));
    const fields = JSON.parse(String(inlineCtaBlock?.settings?.fieldsJson || '[]'));

    expect(charitableTrustsBlocks).toHaveLength(2);
    expect(inlineCtaBlock?.settings?.displayMode).toBe('inline_reveal');
    expect(inlineCtaBlock?.settings?.triggerMode).toBe('external');
    expect(fallbackCtaBlock?.settings?.displayMode).toBeUndefined();
    expect(fallbackCtaBlock?.settings?.triggerMode).toBeUndefined();
    expect(fields.map((field) => field.id)).toEqual([
      'firstname',
      'lastname',
      'phone',
      'email',
      'trustproduct',
      'message',
    ]);
  });

  it('repairs stored charitable-trusts CTA blocks by restoring inline reveal presentation settings from the native seed', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/legacy-giving/charitable-trusts': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              targetSectionKey: 'class:legacy-child-native-cta legacy-child-native-trusts-cta legacy-child-native-trusts-cta-inline',
              targetSectionClassName: 'legacy-child-native-cta legacy-child-native-trusts-cta legacy-child-native-trusts-cta-inline',
              title: 'Income and impact.',
            },
          },
          {
            id: 'cta_form_legacy_child_native_cta_legacy_child_native_trusts_cta',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              targetSectionKey: 'class:legacy-child-native-cta legacy-child-native-trusts-cta',
              targetSectionClassName: 'legacy-child-native-cta legacy-child-native-trusts-cta',
              title: 'Income and impact.',
            },
          },
        ],
      },
    });

    const charitableTrustsBlocks = (normalized.blocksByPath['/services/legacy-giving/charitable-trusts'] || [])
      .filter((block) => block?.kind === 'cta_form');
    const inlineCtaBlock = charitableTrustsBlocks.find((block) => block?.id === 'cta_form');
    const fallbackCtaBlock = charitableTrustsBlocks.find((block) => (
      block?.id === 'cta_form_legacy_child_native_cta_legacy_child_native_trusts_cta'
    ));

    expect(inlineCtaBlock?.settings?.displayMode).toBe('inline_reveal');
    expect(inlineCtaBlock?.settings?.triggerMode).toBe('external');
    expect(fallbackCtaBlock?.settings?.displayMode).toBeUndefined();
    expect(fallbackCtaBlock?.settings?.triggerMode).toBeUndefined();
  });

  it('drops stale request-form blocks from the other audited CTA-owned form routes and restores the CTA block', () => {
    const auditedRoutes = [
      ['/services/insurance', 'insurance-native-cta'],
      ['/services/retirement/409a', 'retirement-child-native-cta'],
      ['/services/retirement/rollovers', 'retirement-rollovers-native-cta retirement-child-native-cta'],
    ];

    auditedRoutes.forEach(([pathname, targetSectionClassName]) => {
      const normalized = normalizeStoredConfig({
        blocksByPath: {
          [pathname]: [
            {
              id: 'request_form',
              kind: 'request_form',
              mode: 'dynamic',
              settings: {
                title: `Old request block for ${pathname}`,
              },
            },
          ],
        },
      });

      const blocks = normalized.blocksByPath[pathname] || [];
      const ctaBlock = blocks.find((block) => block?.kind === 'cta_form');

      expect(blocks.some((block) => block?.kind === 'request_form'), pathname).toBe(false);
      expect(ctaBlock, pathname).toBeTruthy();
      expect(ctaBlock?.settings?.targetSectionClassName, pathname).toBe(targetSectionClassName);
    });
  });

  it('drops stale contact-us CTA blocks from stored config and keeps the request form', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/contact-us': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Old contact CTA block',
            },
          },
        ],
      },
    });

    const contactBlocks = normalized.blocksByPath['/contact-us'] || [];
    const requestBlock = contactBlocks.find((block) => block?.kind === 'request_form');

    expect(contactBlocks.some((block) => block?.kind === 'cta_form')).toBe(false);
    expect(requestBlock).toBeTruthy();
    expect(requestBlock?.settings?.targetSectionClassName).toBe('contact-us-request');
    expect(requestBlock?.settings?.bgTone).toBe('sand');
  });

  it('repairs the legacy targeted 403(b) CTA seed into the standalone white CTA block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Questions about the 403(b)? We’re ready.',
              bodyHtml: '<p>And we’re eager to help.</p>',
              bgTone: 'sand',
              targetSectionKey: 'class:retirement-child-native-cta retirement-403b-native-cta',
              targetSectionClassName: 'retirement-child-native-cta retirement-403b-native-cta',
              submitLabel: 'Follow-up with me',
            },
          },
        ],
      },
    });

    const ctaBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.kind === 'cta_form');

    expect(ctaBlock).toBeTruthy();
    expect(ctaBlock?.settings?.bodyHtml).toBe('');
    expect(ctaBlock?.settings?.subtitle).toBe('And we’re eager to help.');
    expect(ctaBlock?.settings?.bgTone).toBe('white');
    expect(ctaBlock?.settings?.targetSectionKey).toBe('');
    expect(ctaBlock?.settings?.targetSectionClassName).toBe('');
    expect(ctaBlock?.settings?.targetSectionIndex).toBe(0);
  });

  it('replaces the stale blank 403(b) page-content fallback with the seeded loan content block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
              contentMaxWidthPx: 980,
            },
          },
        ],
      },
    });

    const pageContentBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'page_content' && block?.kind === 'content');

    expect(pageContentBlock).toBeTruthy();
    expect(String(pageContentBlock?.settings?.html || '')).toContain('403(b) Plan Loans');
    expect(String(pageContentBlock?.settings?.html || '')).toContain('The requested 403(b) loan amount cannot be less than $1,500');
  });

  it('replaces stale legacy 403(b) loan HTML with the canonical wrapped loan content block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: `
                <h2>403(b) Plan Loans</h2>
                <p>A 403(b) loan allows you to borrow money from your own retirement savings without incurring early withdrawal tax penalties.</p>
                <h3>Details</h3>
                <p>The requested 403(b) loan amount cannot be less than $1,500. In addition, the amount borrowed cannot exceed the lesser of:</p>
                <ul>
                  <li>100% of the total vested account balance if less than $10,000</li>
                </ul>
              `,
            },
          },
        ],
      },
    });

    const pageContentBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'page_content' && block?.kind === 'content');

    expect(pageContentBlock).toBeTruthy();
    expect(String(pageContentBlock?.settings?.html || '')).toContain('retirement-403b-loan-copy');
    expect(String(pageContentBlock?.settings?.html || '')).toContain('403(b) Plan Loans');
  });

  it('refreshes the stored 403(b) intro block to the sand treatment from native defaults', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'Ministry-powered retirement.',
              bodyHtml: '<p>The AGFinancial 403(b) offers higher contribution limits and potential employer matching—advantages you won’t find with an IRA. Designed specifically for ministers and ministry employees, it’s a powerful way to save while you serve.</p>',
              bgTone: 'white',
              textTone: 'dark',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b'] || [])
      .find((block) => block?.id === 'intro' && block?.kind === 'intro');

    expect(introBlock?.settings?.bgTone).toBe('sand');
    expect(introBlock?.settings?.textTone).toBe('dark');
  });

  it('strips stale stored intro buttons from group term life insurance', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/group-term-life-insurance': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'Take care of the team.',
              bodyHtml: '<p>Protect the people who power your ministry.</p>',
              button1Label: 'Get started',
              button1Url: '/contact-us',
              button1PageRef: 'contact-us',
              button1OpenInNewWindow: true,
              button2Label: 'Learn more',
              button2Url: '/services/insurance',
              button2PageRef: 'insurance',
              button2OpenInNewWindow: true,
            },
          },
        ],
      },
    });

    const groupLifeBlocks = normalized.blocksByPath['/services/insurance/group-term-life-insurance'] || [];
    const introBlock = groupLifeBlocks.find((block) => block?.id === 'intro');

    expect(introBlock).toBeTruthy();
    expect(introBlock?.settings?.button1Label).toBe('');
    expect(introBlock?.settings?.button1Url).toBe('');
    expect(introBlock?.settings?.button1PageRef).toBe('');
    expect(introBlock?.settings?.button1OpenInNewWindow).toBe(false);
    expect(introBlock?.settings?.button2Label).toBe('');
    expect(introBlock?.settings?.button2Url).toBe('');
    expect(introBlock?.settings?.button2PageRef).toBe('');
    expect(introBlock?.settings?.button2OpenInNewWindow).toBe(false);
  });

  it('refreshes stale 403(b) individual enrollment intro blocks from the current native summary callout', () => {
    const defaultIntroBlock = (normalizeStoredConfig({}).blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'What’s one gotta do to get AGFinancial 403(b)?',
              bodyHtml: '<p>You’re in luck. We guide you through the process in four simple, easy-to-follow steps so you can open your account and start contributing with confidence.</p>',
              button1Label: 'Download Plan Summary',
              button1Url: 'https://files.agfinancial.org/Retirement/Plansummary.pdf',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    expect(introBlock?.settings?.heading).toBe(defaultIntroBlock?.settings?.heading);
    expect(introBlock?.settings?.bodyHtml).toBe(defaultIntroBlock?.settings?.bodyHtml);
    expect(introBlock?.settings?.button1Label).toBe(defaultIntroBlock?.settings?.button1Label);
    expect(introBlock?.settings?.button1Url).toBe(defaultIntroBlock?.settings?.button1Url);
  });

  it('replaces the leaked loans intro seed on 403(b) individual enrollment with the route-native summary intro', () => {
    const defaultIntroBlock = (normalizeStoredConfig({}).blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'The right loan can change everything.',
              bodyHtml: '<p>What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in super simple, easy-to-follow steps.</p>',
              body: 'What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in super simple, easy-to-follow steps.',
              button1Label: '',
              button1Url: '',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    expect(introBlock?.settings?.heading).toBe(defaultIntroBlock?.settings?.heading);
    expect(introBlock?.settings?.bodyHtml).toBe(defaultIntroBlock?.settings?.bodyHtml);
    expect(introBlock?.settings?.button1Label).toBe(defaultIntroBlock?.settings?.button1Label);
    expect(introBlock?.settings?.button1Url).toBe(defaultIntroBlock?.settings?.button1Url);
  });

  it('drops stale generic page-content blocks from 403(b) individual enrollment', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: 'asdfsdfasdfsdfsdafsadfsadfsdf<p></p>',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [];
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(false);
    expect(blocks.some((block) => block?.id === 'intro' && block?.kind === 'intro')).toBe(true);
  });

  it('drops the stale enrollment-help billboard from 403(b) individual enrollment and restores the request form block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-individual-enrollment': [
          {
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: 'Need help with enrollment?',
              body: 'Old billboard copy',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-individual-enrollment'] || [];
    const requestBlock = blocks.find((block) => block?.id === 'request_form');

    expect(blocks.some((block) => block?.id === 'billboard')).toBe(false);
    expect(requestBlock?.kind).toBe('request_form');
    expect(requestBlock?.settings?.title).toBe('Need help with enrollment?');
    expect(requestBlock?.settings?.titleHighlightsJson).toBe('[{"text":"help","className":"is-melon"}]');
    expect(requestBlock?.settings?.subtitle).toBe('For assistance, contact 800.622.7526.');
    expect(requestBlock?.settings?.bgTone).toBe('grey');
    expect(requestBlock?.settings?.salesforceUrl).toBe('403bregs@agfinancial.org');
  });

  it('appends the seeded hero block to stored 403(b) group enrollment drafts', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b-for-groups/403b-group-enrollment': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [];
    const heroBlock = blocks.find((block) => block?.id === 'hero');

    expect(heroBlock).toBeTruthy();
    expect(heroBlock?.kind).toBe('hero');
    expect(heroBlock?.mode).toBe('dynamic');
    expect(heroBlock?.settings?.line1Text).toBe('AGFinancial 403(b)');
    expect(heroBlock?.settings?.line2Text).toBe('Group Enrollment');
    expect(blocks.some((block) => block?.id === 'page_content')).toBe(true);
    expect(normalized.blocksByPath['/services/retirement/403b-for-groups/403b-group-enrollment']).toBeUndefined();
    expect(normalized.pathAliases['/services/retirement/403b-for-groups/403b-group-enrollment']).toBe('/services/retirement/403b/403b-group-enrollment');
    expect(normalized.pathAliases['/services/retirement/403b-for-groups']).toBe('/services/retirement/403b/403b-group-enrollment');
    expect(normalized.pageHierarchy['/services/retirement/403b/403b-group-enrollment']?.parentPath).toBe('/services/retirement/403b');
    expect(normalized.pageHierarchy['/services/retirement/403b-for-groups']).toBeUndefined();
  });

  it('replaces the leaked loans intro seed on 403(b) group enrollment with the route-native intro', () => {
    const defaultIntroBlock = (normalizeStoredConfig({}).blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b-for-groups/403b-group-enrollment': [
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'The right loan can change everything.',
              bodyHtml: '<p>What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in these super simple easy-to-follow steps.</p>',
              body: 'What’s one gotta do to get AGFinancial 403(b)? You’re in luck. We guide you through the process in these super simple easy-to-follow steps.',
              button1Label: '',
              button1Url: '',
              button2Label: '',
              button2Url: '',
            },
          },
        ],
      },
    });

    const introBlock = (normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [])
      .find((block) => block?.id === 'intro');

    expect(introBlock?.settings?.heading).toBe(defaultIntroBlock?.settings?.heading);
    expect(introBlock?.settings?.bodyHtml).toBe(defaultIntroBlock?.settings?.bodyHtml);
    expect(introBlock?.settings?.button1Label).toBe(defaultIntroBlock?.settings?.button1Label);
    expect(introBlock?.settings?.button1Url).toBe(defaultIntroBlock?.settings?.button1Url);
    expect(introBlock?.settings?.button2Label).toBe(defaultIntroBlock?.settings?.button2Label);
    expect(introBlock?.settings?.button2Url).toBe(defaultIntroBlock?.settings?.button2Url);
  });

  it('appends the seeded request form block to stored 403(b) group enrollment drafts', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b-for-groups/403b-group-enrollment': [
          {
            id: 'hero',
            kind: 'hero',
            mode: 'dynamic',
            settings: {
              line1Text: 'AGFinancial 403(b)',
              line2Text: 'Group Enrollment',
            },
          },
          {
            id: 'intro',
            kind: 'intro',
            mode: 'dynamic',
            settings: {
              heading: 'What’s one gotta do to get AGFinancial 403(b)?',
            },
          },
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
            },
          },
        ],
      },
    });

    const blocks = normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [];
    const requestBlock = blocks.find((block) => block?.id === 'request_form');

    expect(requestBlock).toBeTruthy();
    expect(requestBlock?.kind).toBe('request_form');
    expect(requestBlock?.mode).toBe('dynamic');
    expect(requestBlock?.settings?.title).toBe('Need help with enrollment?');
    expect(requestBlock?.settings?.subtitle).toBe('For assistance, contact 800.622.7526.');
    expect(requestBlock?.settings?.salesforceUrl).toBe('403bregs@agfinancial.org');
  });

  it('refreshes the stored 403(b) group enrollment compliance billboard to the white treatment', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-group-enrollment': [
          {
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: '403(b) Compliance Regulations',
              bgTone: 'grey',
              textTone: 'white',
            },
          },
        ],
      },
    });

    const complianceBlock = (normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [])
          .find((block) => block?.id === 'billboard');

    expect(complianceBlock?.settings?.bgTone).toBe('white');
    expect(complianceBlock?.settings?.textTone).toBe('dark');
  });

  it('repairs stored 403(b) group enrollment compliance buttons that saved PDF URLs as page refs', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b/403b-group-enrollment': [
          {
            id: 'billboard',
            kind: 'billboard',
            mode: 'dynamic',
            settings: {
              title: '403(b) Compliance Regulations',
              buttonLabel: 'QCCO Guidelines',
              buttonUrl: 'https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf',
              buttonPageRef: 'https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf',
              button2Label: 'NQCCO Guidelines',
              button2Url: 'https://files.agfinancial.org/retirement/NQCCO-Guidelines.pdf',
              button2PageRef: 'https://files.agfinancial.org/retirement/NQCCO-Guidelines.pdf',
            },
          },
        ],
      },
    });

    const complianceBlock = (normalized.blocksByPath['/services/retirement/403b/403b-group-enrollment'] || [])
      .find((block) => block?.id === 'billboard');

    expect(complianceBlock?.settings?.buttonUrl).toBe('https://files.agfinancial.org/retirement/QCCO-Guidelines.pdf');
    expect(complianceBlock?.settings?.buttonPageRef).toBe('');
    expect(complianceBlock?.settings?.button2Url).toBe('https://files.agfinancial.org/retirement/NQCCO-Guidelines.pdf');
    expect(complianceBlock?.settings?.button2PageRef).toBe('');
  });

  it('upgrades stale group term life request blocks back onto the dynamic targeted renderer path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/group-term-life-insurance': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'static',
            hidden: true,
            settings: {
              title: 'Request a quote for group life.',
              body: 'Provide a few specifics, and we’ll contact you about a policy customized specifically for your team.',
            },
          },
        ],
      },
    });

    const groupLifeBlocks = normalized.blocksByPath['/services/insurance/group-term-life-insurance'] || [];
    const requestBlock = groupLifeBlocks.find((block) => block?.id === 'request_form');

    expect(requestBlock).toBeTruthy();
    expect(requestBlock?.mode).toBe('dynamic');
    expect(requestBlock?.kind).toBe('request_form');
    expect(requestBlock?.hidden).toBe(false);
    expect(requestBlock?.settings?.targetSectionKey).toBe('class:group-life-native-quote');
    expect(requestBlock?.settings?.targetSectionClassName).toBe('group-life-native-quote');
    expect(requestBlock?.settings?.targetSectionIndex).toBe(1);
    expect(requestBlock?.settings?.bgTone).toBe('blue');
    expect(requestBlock?.settings?.textTone).toBe('white');
    expect(requestBlock?.settings?.titleClassName).toBe('is-super-grey');
    expect(requestBlock?.settings?.titleHighlightsJson).toBe('[{"start":20,"end":30,"className":"is-white"}]');
  });

  it('corrects stale white group term life request heading classes back to dark core copy', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/insurance/group-term-life-insurance': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            hidden: false,
            settings: {
              title: 'Request a quote for group life.',
              titleClassName: 'is-white',
              titleHighlightsJson: '[{"text":"group life","className":"is-white"}]',
              targetSectionKey: 'class:group-life-native-quote',
              targetSectionClassName: 'group-life-native-quote',
              bgTone: 'blue',
              textTone: 'white',
              step1Title: 'Contact info',
              step1FieldsJson: '[{"id":"contactFirstName","label":"Contact First Name","type":"text","required":true}]',
            },
          },
        ],
      },
    });

    const groupLifeBlocks = normalized.blocksByPath['/services/insurance/group-term-life-insurance'] || [];
    const requestBlock = groupLifeBlocks.find((block) => block?.id === 'request_form');

    expect(requestBlock?.settings?.titleClassName).toBe('is-super-grey');
    expect(requestBlock?.settings?.titleHighlightsJson).toBe('[{"start":20,"end":30,"className":"is-white"}]');
  });

  it('upgrades stale investments feature-panel blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/investments': [
          {
            id: 'cash_reserves',
            kind: 'feature_panel',
            mode: 'static',
            settings: {
              title: 'Old reserves block',
            },
          },
        ],
      },
    });

    const investmentsBlocks = normalized.blocksByPath['/services/investments'] || [];
    const featurePanelBlock = investmentsBlocks.find((block) => block?.id === 'cash_reserves');

    expect(featurePanelBlock).toBeTruthy();
    expect(featurePanelBlock?.mode).toBe('dynamic');
    expect(featurePanelBlock?.kind).toBe('feature_panel');
    expect(featurePanelBlock?.settings?.title).toBe('Old reserves block');
    expect(featurePanelBlock?.settings?.buttonLabel).toBe('Ready for the unexpected?');
    expect(featurePanelBlock?.settings?.buttonPageRef).toBe('/resources/article/church-cash-reserves');
    expect(Array.isArray(featurePanelBlock?.editableFields) ? featurePanelBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('replaces the retirement consultants request form with the canonical seeded block', () => {
    const defaultRequestBlock = (normalizeStoredConfig({}).blocksByPath['/services/retirement/retirement-consultants'] || [])
      .find((block) => block?.id === 'request_form');

    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/retirement-consultants': [
          {
            id: 'request_form',
            kind: 'request_form',
            mode: 'dynamic',
            hidden: true,
            settings: {
              title: 'Request a quote',
              subtitle: 'Tell us what you need and we will respond quickly.',
              step1Title: 'Contact info',
              step1FieldsJson: '[{"id":"contactFirstName","label":"Contact First Name","type":"text","required":true}]',
              step2Title: 'Organization details',
              step2FieldsJson: '[{"id":"organization","label":"Organization","type":"text","required":true}]',
            },
          },
        ],
      },
    });

    const requestBlock = (normalized.blocksByPath['/services/retirement/retirement-consultants'] || [])
      .find((block) => block?.id === 'request_form');

    expect(requestBlock?.mode).toBe('dynamic');
    expect(requestBlock?.hidden).toBe(false);
    expect(requestBlock?.settings).toEqual(defaultRequestBlock?.settings);
    expect(requestBlock?.settings?.bgTone).toBe('blue');
    expect(requestBlock?.settings?.textTone).toBe('white');
    expect(requestBlock?.settings?.spaceBeforeRem).toBe(1.6);
    expect(requestBlock?.settings?.spaceAfterRem).toBe(1.6);
    expect(requestBlock?.settings?.targetSectionClassName).toBe('loans-consultant-native-contact');
  });

  it('drops stale rates legal-copy blocks because disclosures are owned by Rates admin', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/rates': [
          {
            id: 'disclaimer',
            kind: 'legal_copy',
            mode: 'static',
            settings: {
              certificatesHtml: '<p>Custom certificates disclosure.</p>',
            },
          },
        ],
      },
    });

    const ratesBlocks = normalized.blocksByPath['/rates'] || [];
    const legalCopyBlock = ratesBlocks.find((block) => block?.id === 'disclaimer');

    expect(legalCopyBlock).toBeUndefined();
  });

  it('upgrades stale investments cta-band blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/investments': [
          {
            id: 'investor_cta',
            kind: 'cta_band',
            mode: 'static',
            settings: {
              title: 'Already connected?',
              buttonLabel: 'Open dashboard',
            },
          },
        ],
      },
    });

    const investmentsBlocks = normalized.blocksByPath['/services/investments'] || [];
    const ctaBandBlock = investmentsBlocks.find((block) => block?.id === 'investor_cta');

    expect(ctaBandBlock).toBeTruthy();
    expect(ctaBandBlock?.mode).toBe('dynamic');
    expect(ctaBandBlock?.kind).toBe('cta_band');
    expect(ctaBandBlock?.templateId).toBe('investor_cta');
    expect(ctaBandBlock?.presetId).toBe('dashboard-login');
    expect(ctaBandBlock?.settings?.title).toBe('Already connected?');
    expect(ctaBandBlock?.settings?.buttonLabel).toBe('Open dashboard');
    expect(ctaBandBlock?.settings?.buttonUrl).toBe('https://secure.agfinancial.org/');
    expect(Array.isArray(ctaBandBlock?.editableFields) ? ctaBandBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('normalizes stale card-grid preset identity onto the canonical preset id', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement/403b': [
          {
            id: 'loan_apply',
            kind: 'card_grid',
            mode: 'dynamic',
            presetId: 'default',
            settings: {
              card1Title: 'Check your eligibility',
            },
          },
        ],
      },
    });

    const retirementBlocks = normalized.blocksByPath['/services/retirement/403b'] || [];
    const loanApplyBlock = retirementBlocks.find((block) => block?.id === 'loan_apply');

    expect(loanApplyBlock).toBeTruthy();
    expect(loanApplyBlock?.kind).toBe('card_grid');
    expect(loanApplyBlock?.templateId).toBe('loan_apply');
    expect(loanApplyBlock?.presetId).toBe('step-cards');
    expect(loanApplyBlock?.settings?.card1Title).toBe('Check your eligibility');
    expect(loanApplyBlock?.settings?.columns).toBe('two');
  });

  it('normalizes stale columns preset identity onto the canonical value-cards preset id', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/loans': [
          {
            id: 'value_cards',
            kind: 'columns',
            mode: 'dynamic',
            presetId: 'default',
            settings: {
              title: "There's more to every loan.",
              col1Title: 'Smart consulting.',
            },
          },
        ],
      },
    });

    const loansBlocks = normalized.blocksByPath['/services/loans'] || [];
    const valueCardsBlock = loansBlocks.find((block) => block?.id === 'value_cards');

    expect(valueCardsBlock).toBeTruthy();
    expect(valueCardsBlock?.kind).toBe('columns');
    expect(valueCardsBlock?.templateId).toBe('value_cards');
    expect(valueCardsBlock?.presetId).toBe('value-cards');
    expect(valueCardsBlock?.settings?.title).toBe("There's more to every loan.");
    expect(valueCardsBlock?.settings?.columnsStyle).toBe('loans-value');
  });

  it('upgrades stale investments calculator-cta blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/investments': [
          {
            id: 'laddering',
            kind: 'calculator_cta',
            mode: 'static',
            settings: {
              title: 'Laddering Calculator',
              calculateLabel: 'Run calculation',
            },
          },
        ],
      },
    });

    const investmentsBlocks = normalized.blocksByPath['/services/investments'] || [];
    const calculatorCtaBlock = investmentsBlocks.find((block) => block?.id === 'laddering');

    expect(calculatorCtaBlock).toBeTruthy();
    expect(calculatorCtaBlock?.mode).toBe('dynamic');
    expect(calculatorCtaBlock?.kind).toBe('calculator_cta');
    expect(calculatorCtaBlock?.settings?.title).toBe('Laddering Calculator');
    expect(calculatorCtaBlock?.settings?.calculateLabel).toBe('Run calculation');
    expect(calculatorCtaBlock?.settings?.discussButtonLabel).toBe('Send');
    expect(Array.isArray(calculatorCtaBlock?.editableFields) ? calculatorCtaBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('drops the retired investments rates_table placeholder from stored admin state', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/investments': [
          {
            id: 'rates_table',
            kind: 'rates_table',
            mode: 'static',
            settings: {
              note: 'Legacy rates placeholder',
            },
          },
        ],
      },
    });

    const investmentsBlocks = normalized.blocksByPath['/services/investments'] || [];

    expect(investmentsBlocks.some((block) => block?.id === 'rates_table')).toBe(false);
  });

  it('upgrades stale retirement split-panel blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement': [
          {
            id: 'split_options',
            kind: 'split_panel',
            mode: 'static',
            settings: {
              leftTitle: 'Updated IRA heading',
            },
          },
        ],
      },
    });

    const retirementBlocks = normalized.blocksByPath['/services/retirement'] || [];
    const splitPanelBlock = retirementBlocks.find((block) => block?.id === 'split_options');

    expect(splitPanelBlock).toBeTruthy();
    expect(splitPanelBlock?.mode).toBe('dynamic');
    expect(splitPanelBlock?.kind).toBe('split_panel');
    expect(splitPanelBlock?.settings?.leftTitle).toBe('Updated IRA heading');
    expect(splitPanelBlock?.settings?.rightButtonPageRef).toBe('/services/retirement/409a');
    expect(Array.isArray(splitPanelBlock?.editableFields) ? splitPanelBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('upgrades stale retirement landing CTA settings to state plus one message field', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/services/retirement': [
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Imagine the possibilities.',
              bodyHtml: "<p>Let's explore together.</p>",
              field1Label: 'Name',
              field1Type: 'text',
              field2Label: 'Email',
              field2Type: 'email',
              field3Label: 'Phone',
              field3Type: 'tel',
              field4Enabled: true,
              field4Label: 'Message',
              field4Type: 'textarea',
              field4Placeholder: 'What would you like to discuss?',
            },
          },
        ],
      },
    });

    const retirementBlocks = normalized.blocksByPath['/services/retirement'] || [];
    const ctaBlock = retirementBlocks.find((block) => block?.id === 'cta_form');

    expect(ctaBlock?.mode).toBe('dynamic');
    expect(ctaBlock?.settings?.bodyHtml).toBe('');
    expect(ctaBlock?.settings?.field4Type).toBe('select');
    expect(ctaBlock?.settings?.field4Label).toBe('State');
    expect(String(ctaBlock?.settings?.field4Options || '')).toContain('TX|Texas');
    expect(ctaBlock?.settings?.field5Enabled).toBe(true);
    expect(ctaBlock?.settings?.field5Type).toBe('textarea');
    expect(ctaBlock?.settings?.field5Label).toBe('Message');
  });

  it('upgrades stale home services-grid blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'services_grid',
            kind: 'services_grid',
            mode: 'static',
            settings: {
              heading: 'Updated home services heading',
              card1Title: 'Church Loans',
            },
          },
        ],
      },
    });

    const homeBlocks = normalized.blocksByPath['/'] || [];
    const servicesGridBlock = homeBlocks.find((block) => block?.id === 'services_grid');

    expect(servicesGridBlock).toBeTruthy();
    expect(servicesGridBlock?.mode).toBe('dynamic');
    expect(servicesGridBlock?.kind).toBe('services_grid');
    expect(servicesGridBlock?.settings?.heading).toBe('Updated home services heading');
    expect(servicesGridBlock?.settings?.card1Title).toBe('Church Loans');
    expect(servicesGridBlock?.settings?.browsePageRef).toBe('/services');
    expect(Array.isArray(servicesGridBlock?.editableFields) ? servicesGridBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('upgrades stale home impact-stat blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'impact_stat',
            kind: 'impact_stat',
            mode: 'static',
            settings: {
              titlePrefix: 'What happens here',
              stat1Value: '$12 billion',
            },
          },
        ],
      },
    });

    const homeBlocks = normalized.blocksByPath['/'] || [];
    const impactStatBlock = homeBlocks.find((block) => block?.id === 'impact_stat');

    expect(impactStatBlock).toBeTruthy();
    expect(impactStatBlock?.mode).toBe('dynamic');
    expect(impactStatBlock?.kind).toBe('impact_stat');
    expect(impactStatBlock?.settings?.titlePrefix).toBe('What happens here');
    expect(impactStatBlock?.settings?.stat1Value).toBe('$12 billion');
    expect(impactStatBlock?.settings?.ctaPageRef).toBe('/about-us/impact');
    expect(Array.isArray(impactStatBlock?.editableFields) ? impactStatBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('upgrades stale home columns blocks back onto the dynamic canonical path', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/': [
          {
            id: 'columns_mha',
            kind: 'columns',
            mode: 'static',
            settings: {
              col1Type: 'photo',
              col1ImageUrl: 'mha-photo.jpg',
              col2Type: 'text',
              col2Title: 'Updated housing title',
            },
          },
          {
            id: 'columns_math',
            kind: 'columns',
            mode: 'static',
            settings: {
              col1Type: 'text',
              col1Title: 'Updated math title',
              col2Type: 'photo',
              col2ImageUrl: 'math-photo.jpg',
            },
          },
        ],
      },
    });

    const homeBlocks = normalized.blocksByPath['/'] || [];
    const columnsMhaBlock = homeBlocks.find((block) => block?.id === 'columns_mha');
    const columnsMathBlock = homeBlocks.find((block) => block?.id === 'columns_math');

    expect(columnsMhaBlock).toBeTruthy();
    expect(columnsMhaBlock?.mode).toBe('dynamic');
    expect(columnsMhaBlock?.settings?.col1ImageUrl).toBe('mha-photo.jpg');
    expect(columnsMhaBlock?.settings?.col2Title).toBe('Updated housing title');
    expect(Array.isArray(columnsMhaBlock?.editableFields) ? columnsMhaBlock.editableFields.length : 0).toBeGreaterThan(0);

    expect(columnsMathBlock).toBeTruthy();
    expect(columnsMathBlock?.mode).toBe('dynamic');
    expect(columnsMathBlock?.settings?.col1Title).toBe('Updated math title');
    expect(columnsMathBlock?.settings?.col2ImageUrl).toBe('math-photo.jpg');
    expect(Array.isArray(columnsMathBlock?.editableFields) ? columnsMathBlock.editableFields.length : 0).toBeGreaterThan(0);
  });

  it('seeds impact hero and intro blocks while dropping an empty stale page-content block', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/about-us/impact': [
          {
            id: 'page_content',
            kind: 'content',
            mode: 'dynamic',
            settings: {
              html: '',
              body: '',
            },
          },
        ],
      },
    });

    const impactBlocks = normalized.blocksByPath['/about-us/impact'] || [];

    expect(impactBlocks.some((block) => block?.id === 'hero' && block?.kind === 'hero' && block?.mode === 'dynamic')).toBe(true);
    expect(impactBlocks.some((block) => block?.id === 'intro' && block?.kind === 'intro' && block?.mode === 'dynamic')).toBe(true);
    expect(impactBlocks.some((block) => block?.id === 'page_content' && block?.kind === 'content')).toBe(false);
  });

  it('migrates stale /rates legacy rates_table blocks onto canonical rates kind before runtime consumption', () => {
    const normalized = normalizeStoredConfig({
      blocksByPath: {
        '/rates': [
          {
            id: 'certificates_table',
            kind: 'rates_table',
            mode: 'dynamic',
            settings: {},
          },
          {
            id: 'ira_table',
            kind: 'rates_table',
            mode: 'dynamic',
            settings: {},
          },
        ],
      },
    });

    const ratesBlocks = normalized.blocksByPath['/rates'] || [];

    expect(ratesBlocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'certificates_table', kind: 'rates', mode: 'dynamic' }),
      expect.objectContaining({ id: 'ira_table', kind: 'rates', mode: 'dynamic' }),
    ]));
    expect(ratesBlocks.some((block) => block?.kind === 'rates_table')).toBe(false);
  });
});
