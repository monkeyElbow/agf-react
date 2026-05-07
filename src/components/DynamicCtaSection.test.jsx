import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DynamicCtaSection from './DynamicCtaSection';

describe('DynamicCtaSection', () => {
  it('applies outline submit button styling from dynamic CTA settings', () => {
    render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Imagine the possibilities.',
              submitLabel: 'Send it',
              submitStyle: 'outline',
              submitTone: 'mango',
              field1Label: 'Name',
              field1Type: 'text',
              field1Required: true,
              field2Enabled: false,
              field3Enabled: false,
              field4Enabled: false,
            },
          },
        ]}
        defaultSettings={{}}
        submitButtonClassName="service-native-btn retirement-btn-reset"
      />,
    );

    const button = screen.getByRole('button', { name: 'Send it' });
    expect(button.className).toContain('service-native-btn');
    expect(button.className).toContain('retirement-btn-reset');
    expect(button.className).toContain('is-outline');
    expect(button.className).toContain('is-tone-mango');
  });

  it('falls back to dark submit tone when dark style is selected', () => {
    render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Imagine the possibilities.',
              submitLabel: 'Follow-up',
              submitStyle: 'dark',
              field1Label: 'Email',
              field1Type: 'email',
              field1Required: true,
              field2Enabled: false,
              field3Enabled: false,
              field4Enabled: false,
            },
          },
        ]}
        defaultSettings={{}}
      />,
    );

    const button = screen.getByRole('button', { name: 'Follow-up' });
    expect(button.className).toContain('service-native-btn');
    expect(button.className).toContain('is-dark');
    expect(button.className).toContain('is-tone-super-grey');
  });

  it('applies HUD focus classes to the CTA section wrapper', () => {
    const { container } = render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Imagine the possibilities.',
              submitLabel: 'Follow-up',
              field1Label: 'Email',
              field1Type: 'email',
              field1Required: true,
              field2Enabled: false,
              field3Enabled: false,
              field4Enabled: false,
            },
          },
        ]}
        defaultSettings={{}}
        sectionHudClassName="is-hud-focus-target"
      />,
    );

    const section = container.querySelector('section.native-dynamic-cta');
    expect(section).not.toBeNull();
    expect(section.className).toContain('is-hud-focus-target');
  });

  it('renders the CTA callout inside the form area above the submit button', () => {
    const { container } = render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Ready to build your retirement plan?',
              bodyHtml: '<p>Let&apos;s explore together.</p>',
              submitLabel: 'Follow-up with me',
              field1Label: 'Name',
              field1Type: 'text',
              field1Required: true,
              field2Enabled: false,
              field3Enabled: false,
              field4Enabled: false,
            },
          },
        ]}
        defaultSettings={{}}
        formWrapperClassName="retirement-addon-box"
      />,
    );

    const form = container.querySelector('.dynamic-cta-form form');
    const callout = container.querySelector('.dynamic-cta-form-callout');
    const copy = container.querySelector('.native-info-section-copy');

    expect(form?.contains(callout)).toBe(true);
    expect(copy?.textContent).not.toContain("Let's explore together.");
    expect(screen.getByRole('button', { name: 'Follow-up with me' })).toBeTruthy();
  });

  it('renders a configured fifth CTA field for legacy-giving style forms', () => {
    render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'We help every step of the way. Always.',
              submitLabel: 'Follow-up with me',
              field1Label: 'Name',
              field1Type: 'text',
              field1Required: true,
              field2Label: 'Email',
              field2Type: 'email',
              field2Required: true,
              field3Label: 'Phone',
              field3Type: 'tel',
              field4Label: 'Legacy giving product of interest*',
              field4Type: 'select',
              field4Options: 'donor-advised-fund|Donor Advised Fund',
              field4Required: true,
              field5Enabled: true,
              field5Label: 'Message',
              field5Type: 'textarea',
            },
          },
        ]}
        defaultSettings={{}}
      />,
    );

    expect(screen.getByLabelText('Legacy giving product of interest*')).toBeTruthy();
    expect(screen.getByLabelText('Message')).toBeTruthy();
  });

  it('can render the CTA title inside the form shell when requested', () => {
    const { container } = render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Imagine the possibilities.',
              bodyHtml: '<p>Let&apos;s explore together.</p>',
              submitLabel: 'Follow-up with me',
              field1Label: 'Name',
              field1Type: 'text',
              field1Required: true,
              field2Enabled: false,
              field3Enabled: false,
              field4Enabled: false,
            },
          },
        ]}
        defaultSettings={{}}
        formWrapperClassName="retirement-addon-box"
        titlePlacement="inside"
      />,
    );

    expect(container.querySelector('.native-info-section-copy')).toBeNull();
    expect(container.querySelector('.dynamic-cta-form-heading')).not.toBeNull();
    expect(screen.getByText('Imagine the possibilities.')).toBeTruthy();
  });

  it('renders structured CTA fields with checkbox support and built-in contact preference', () => {
    render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Tell us how to reach you.',
              fieldsJson: JSON.stringify([
                { id: 'full_name', label: 'Full name', type: 'text', required: true },
                { id: 'consent', label: 'Text me updates', type: 'checkbox' },
              ]),
              includeContactPreference: true,
            },
          },
        ]}
        defaultSettings={{}}
      />,
    );

    expect(screen.getByLabelText('Full name')).toBeTruthy();
    expect(screen.getByLabelText('Preferred contact method')).toBeTruthy();
    expect(screen.getByLabelText('Text me updates')).toBeTruthy();
  });
});
