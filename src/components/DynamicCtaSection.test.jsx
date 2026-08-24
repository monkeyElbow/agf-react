import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { serializeCtaFormFields } from '../blocks/foundation/forms';
import DynamicCtaSection from './DynamicCtaSection';

const ctaFieldsJson = (fields) => serializeCtaFormFields(fields);

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
              fieldsJson: ctaFieldsJson([
                { id: 'name', label: 'Name', type: 'text', required: true },
              ]),
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

  it('can suppress default CTA rendering when a managed page is missing its CTA block', () => {
    const { container } = render(
      <DynamicCtaSection
        managedBlocks={[]}
        defaultSettings={{
          title: 'Default CTA',
          fieldsJson: ctaFieldsJson([
            { id: 'email', label: 'Email', type: 'email', required: true },
          ]),
        }}
        renderDefaultWhenMissing={false}
      />,
    );

    expect(container.querySelector('.native-dynamic-cta')).toBeNull();
    expect(screen.queryByText('Default CTA')).toBeNull();
  });

  it('keeps default CTA rendering available for unmanaged fallback callers', () => {
    render(
      <DynamicCtaSection
        managedBlocks={[]}
        defaultSettings={{
          title: 'Default CTA',
          fieldsJson: ctaFieldsJson([
            { id: 'email', label: 'Email', type: 'email', required: true },
          ]),
        }}
        renderDefaultWhenMissing
      />,
    );

    expect(screen.getByText('Default CTA')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
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
              submitLabel: 'Follow up',
              submitStyle: 'dark',
              fieldsJson: ctaFieldsJson([
                { id: 'email', label: 'Email', type: 'email', required: true },
              ]),
            },
          },
        ]}
        defaultSettings={{}}
      />,
    );

    const button = screen.getByRole('button', { name: 'Follow up' });
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
              submitLabel: 'Follow up',
              fieldsJson: ctaFieldsJson([
                { id: 'email', label: 'Email', type: 'email', required: true },
              ]),
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
              submitLabel: 'Follow up with me',
              fieldsJson: ctaFieldsJson([
                { id: 'name', label: 'Name', type: 'text', required: true },
              ]),
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
    expect(screen.getByRole('button', { name: 'Follow up with me' })).toBeTruthy();
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
              submitLabel: 'Follow up with me',
              fieldsJson: ctaFieldsJson([
                { id: 'name', label: 'Name', type: 'text', required: true },
                { id: 'email', label: 'Email', type: 'email', required: true },
                { id: 'phone', label: 'Phone', type: 'tel' },
                {
                  id: 'planned_giving_product_of_interest',
                  label: 'Planned giving product of interest*',
                  type: 'select',
                  required: true,
                  options: [{ value: 'donor-advised-fund', label: 'Donor Advised Fund' }],
                },
                { id: 'message', label: 'Message', type: 'textarea' },
              ]),
            },
          },
        ]}
        defaultSettings={{}}
      />,
    );

    expect(screen.getByLabelText('Planned giving product of interest*')).toBeTruthy();
    expect(screen.getByLabelText('Message')).toBeTruthy();
  });

  it('renders CTA form fineprint when configured', () => {
    render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'We help every step of the way. Always.',
              fineprint: '* fields required',
              fieldsJson: ctaFieldsJson([
                { id: 'name', label: 'Name*', type: 'text', required: true },
              ]),
            },
          },
        ]}
        defaultSettings={{}}
      />,
    );

    expect(screen.getByText('* fields required')).toBeTruthy();
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
              submitLabel: 'Follow up with me',
              fieldsJson: ctaFieldsJson([
                { id: 'name', label: 'Name', type: 'text', required: true },
              ]),
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
    expect(container.querySelector('.dynamic-cta-form-title')).not.toBeNull();
    expect(screen.getByText('Imagine the possibilities.')).toBeTruthy();
  });

  it('keeps an explicitly selected title color on the inside-form renderer path', () => {
    const { container } = render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Color follows the saved setting.',
              titleClassName: 'is-mango',
              fieldsJson: ctaFieldsJson([
                { id: 'name', label: 'Name', type: 'text', required: true },
              ]),
            },
          },
        ]}
        defaultSettings={{}}
        titlePlacement="inside"
      />,
    );

    expect(container.querySelector('.dynamic-cta-form-title.is-mango')).not.toBeNull();
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

  it('applies external inline-reveal presentation classes without rendering an extra trigger button', () => {
    const { container } = render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Start here.',
              displayMode: 'inline_reveal',
              triggerMode: 'external',
              submitLabel: 'Send',
              fieldsJson: ctaFieldsJson([
                { id: 'email', label: 'Email', type: 'email', required: true },
              ]),
            },
          },
        ]}
        defaultSettings={{}}
      />,
    );

    const section = container.querySelector('section.native-dynamic-cta');
    const formShell = container.querySelector('.dynamic-cta-form');

    expect(section?.className).toContain('is-display-inline-reveal');
    expect(section?.className).toContain('is-trigger-external');
    expect(section?.className).toContain('is-external-inline-reveal');
    expect(formShell?.getAttribute('data-cta-display-mode')).toBe('inline_reveal');
    expect(formShell?.getAttribute('data-cta-trigger-mode')).toBe('external');
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Send']);
  });

  it('marks the CTA shell as success after submit', () => {
    const { container } = render(
      <DynamicCtaSection
        managedBlocks={[
          {
            id: 'cta_form',
            kind: 'cta_form',
            mode: 'dynamic',
            settings: {
              title: 'Start here.',
              submitLabel: 'Send',
              fieldsJson: ctaFieldsJson([
                { id: 'email', label: 'Email', type: 'email', required: true },
              ]),
            },
          },
        ]}
        defaultSettings={{}}
      />,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'hello@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(container.querySelector('.dynamic-cta-form')?.getAttribute('data-cta-state')).toBe('success');
    expect(screen.getByRole('status').textContent).toContain('Thank you.');
  });
});
