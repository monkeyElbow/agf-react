import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DynamicRequestFormSection from './DynamicRequestFormSection';

void DynamicRequestFormSection;

function renderSection(config = {}) {
  return render(
    <DynamicRequestFormSection
      config={{
        title: 'How can we help?',
        subtitle: 'Share some information and our team will follow up.',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            note: 'We reply within one business day.',
            fields: [
              { id: 'firstName', label: 'First Name', type: 'text', required: true },
            ],
          },
          {
            id: 'step2',
            title: 'Details',
            fields: [
              { id: 'message', label: 'Message', type: 'textarea' },
            ],
          },
        ],
        ...config,
      }}
    />,
  );
}

describe('DynamicRequestFormSection', () => {
  it('hides generic step-number headings', () => {
    renderSection();

    expect(screen.queryByRole('heading', { name: 'Step 1' })).toBeNull();
    expect(screen.queryByText('Step 1')).toBeNull();
    expect(screen.getByText('We reply within one business day.')).toBeTruthy();
  });

  it('shows a meaningful step heading and advances through steps', () => {
    renderSection({
      steps: [
        {
          id: 'step1',
          title: 'Contact info',
          nextLabel: 'Next',
          fields: [
            { id: 'firstName', label: 'First Name', type: 'text', required: true },
          ],
        },
        {
          id: 'step2',
          title: 'Details',
          backLabel: 'Previous',
          fields: [
            { id: 'message', label: 'Message', type: 'textarea' },
          ],
        },
      ],
    });

    expect(screen.getByRole('heading', { name: 'Contact info' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('heading', { name: 'Details' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeTruthy();
  });

  it('keeps the stabilized request shell structure, alert group, and progress dots', () => {
    const { container } = renderSection({
      steps: [
        {
          id: 'step1',
          title: 'Contact info',
          note: 'We reply within one business day.',
          alert: 'Have your policy number ready.',
          fields: [
            { id: 'firstName', label: 'First Name', type: 'text', required: true },
          ],
        },
        {
          id: 'step2',
          title: 'Details',
          fields: [
            { id: 'message', label: 'Message', type: 'textarea' },
          ],
        },
      ],
    });

    expect(container.querySelector('.dynamic-request-shell')).toBeTruthy();
    expect(container.querySelector('.dynamic-request-panel')).toBeTruthy();
    expect(container.querySelector('.dynamic-request-copy-shell')).toBeTruthy();
    expect(container.querySelectorAll('.fade-up')).toHaveLength(2);
    expect(container.querySelector('.dynamic-request-step-meta')).toBeTruthy();
    expect(screen.getByText('Have your policy number ready.')).toBeTruthy();
    expect(container.querySelectorAll('.dynamic-request-progress-dot')).toHaveLength(2);
  });
});
