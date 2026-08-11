import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { serializeCtaFormFields } from '../../blocks/foundation/forms';

vi.mock('../../context/ContentAdminContextCore', async () => {
  const actual = await vi.importActual('../../context/ContentAdminContextCore');
  return {
    ...actual,
    useContentAdmin: () => ({
      resolveManagedPathFromRef: (pathRef, fallback = '/') => String(pathRef || '').trim() || fallback,
    }),
  };
});

import PageBlocksRenderer from './PageBlocksRenderer';

const ctaFieldsJson = (fields) => serializeCtaFormFields(fields);

function renderCtaBlock(block) {
  return render(
    createElement(
      MemoryRouter,
      null,
      createElement(PageBlocksRenderer, { blocks: [block] }),
    ),
  );
}

describe('PageBlocksRenderer CTA form', () => {
  it('applies dark submit styling to CTA form blocks', () => {
    renderCtaBlock({
      id: 'cta_form',
      type: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      title: 'Imagine the possibilities.',
      submitLabel: 'Follow up with me',
      submitStyle: 'dark',
      submitTone: 'super-grey',
      fieldsJson: ctaFieldsJson([
        { id: 'name', label: 'Name', type: 'text', required: true },
      ]),
    });

    const button = screen.getByRole('button', { name: 'Follow up with me' });
    expect(button.className).toContain('is-dark');
    expect(button.className).toContain('is-tone-super-grey');
  });

  it('keeps filled blue CTA buttons on the default blue tone', () => {
    renderCtaBlock({
      id: 'cta_form',
      type: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      title: 'Imagine the possibilities.',
      submitLabel: 'Follow up with me',
      submitStyle: 'blue',
      submitTone: 'melon',
      fieldsJson: ctaFieldsJson([
        { id: 'name', label: 'Name', type: 'text', required: true },
      ]),
    });

    const button = screen.getByRole('button', { name: 'Follow up with me' });
    expect(button.className).not.toContain('is-outline');
    expect(button.className).toContain('is-tone-atlantean');
  });

  it('renders CTA bodyHtml as the form callout above the submit button, not under the heading', () => {
    const { container } = renderCtaBlock({
      id: 'cta_form',
      type: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      title: 'Ready to talk?',
      bodyHtml: '<p>It starts with a conversation. We’re happy to reach out.</p>',
      submitLabel: 'Follow up with me',
      fieldsJson: ctaFieldsJson([
        { id: 'name', label: 'Name', type: 'text', required: true },
      ]),
    });

    const copy = container.querySelector('.native-info-section-copy');
    const form = container.querySelector('.dynamic-cta-form form');
    const callout = container.querySelector('.dynamic-cta-form-callout');

    expect(form?.contains(callout)).toBe(true);
    expect(copy?.textContent).not.toContain('It starts with a conversation. We’re happy to reach out.');
    expect(screen.getByRole('button', { name: 'Follow up with me' })).toBeTruthy();
  });

  it('preserves the planned-giving CTA copy and bordered form contract', () => {
    const { container } = renderCtaBlock({
      id: 'cta_form',
      type: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      settings: {
        title: 'We help every step of the way. Always.',
        bodyHtml: '<p>Let’s map out the best strategy together.</p>',
        fineprint: '* fields required',
        subtitle: '',
        sectionClassName: 'legacy-giving-cta',
        submitLabel: 'Follow-up with me',
        fieldsJson: ctaFieldsJson([
          { id: 'name', label: 'Name*', type: 'text', required: true },
          { id: 'message', label: 'Message', type: 'textarea' },
        ]),
      },
    });

    const section = container.querySelector('section.native-dynamic-cta');
    const copy = container.querySelector('.native-info-section-copy');
    const form = container.querySelector('.dynamic-cta-form form');
    const callout = container.querySelector('.dynamic-cta-form-callout');

    expect(section?.className).toContain('legacy-giving-cta');
    expect(copy?.contains(callout)).toBe(true);
    expect(form?.contains(callout)).toBe(false);
    expect(form?.querySelector('.dynamic-cta-form-fineprint')?.textContent).toBe('* fields required');
    expect(copy?.textContent).not.toContain('And we’re eager to help.');
  });

  it('renders CTA subtitle in the section copy above the form', () => {
    const { container } = renderCtaBlock({
      id: 'cta_form',
      type: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      title: 'Ready to talk?',
      subtitle: 'It starts with a conversation. We’re happy to reach out.',
      submitLabel: 'Follow up with me',
      fieldsJson: ctaFieldsJson([
        { id: 'name', label: 'Name', type: 'text', required: true },
      ]),
    });

    const copy = container.querySelector('.native-info-section-copy');
    const form = container.querySelector('.dynamic-cta-form form');
    const subtitle = screen.getByText('It starts with a conversation. We’re happy to reach out.');

    expect(copy?.contains(subtitle)).toBe(true);
    expect(form?.contains(subtitle)).toBe(false);
  });

  it('applies external inline-reveal presentation classes to CTA form blocks', () => {
    const { container } = renderCtaBlock({
      id: 'cta_form',
      type: 'cta_form',
      kind: 'cta_form',
      mode: 'dynamic',
      title: 'Ready to talk?',
      displayMode: 'inline_reveal',
      triggerMode: 'external',
      submitLabel: 'Follow up with me',
      fieldsJson: ctaFieldsJson([
        { id: 'name', label: 'Name', type: 'text', required: true },
      ]),
    });

    const section = container.querySelector('section.native-dynamic-cta');
    const formShell = container.querySelector('.dynamic-cta-form');

    expect(section?.className).toContain('is-display-inline-reveal');
    expect(section?.className).toContain('is-trigger-external');
    expect(section?.className).toContain('is-external-inline-reveal');
    expect(formShell?.getAttribute('data-cta-display-mode')).toBe('inline_reveal');
    expect(formShell?.getAttribute('data-cta-trigger-mode')).toBe('external');
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Follow up with me']);
  });
});
