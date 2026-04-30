import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SiteChatbotWindow from './SiteChatbotWindow';
import { OPEN_SITE_CHATBOT_EVENT } from '../lib/siteChatbotEvents';

const mockRequestSiteChatbotReply = vi.fn();
const mockIsOpenAIConfigured = vi.fn();

vi.mock('../lib/openai', () => ({
  OPENAI_CHATBOT_ENV_VAR: 'VITE_OPENAI_API_KEY',
  requestSiteChatbotReply: (...args) => mockRequestSiteChatbotReply(...args),
  isOpenAIConfigured: () => mockIsOpenAIConfigured(),
}));

void [MemoryRouter, SiteChatbotWindow];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
}

function renderChatbot() {
  return render(
    <MemoryRouter>
      <SiteChatbotWindow />
    </MemoryRouter>,
  );
}

describe('SiteChatbotWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(true);
    mockRequestSiteChatbotReply.mockReset();
    mockIsOpenAIConfigured.mockReset();
    mockIsOpenAIConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens from the launcher and appends a live OpenAI reply when configured', async () => {
    mockRequestSiteChatbotReply.mockResolvedValue(
      'AGFinancial retirement guidance can start with plan structure, rollover needs, and next-step contact options.',
    );

    renderChatbot();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AGFinancial' }));

    expect(screen.getByRole('dialog', { name: 'Ask AGFinancial' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'What retirement options do you offer?' }));

    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('What retirement options do you offer?')).toBeTruthy();
    expect(screen.getByText('Reviewing approved AGFinancial content…')).toBeTruthy();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/AGFinancial retirement guidance can start with plan structure/i)).toBeTruthy();
  });

  it('opens from the global open-chatbot event hook', () => {
    renderChatbot();

    act(() => {
      document.dispatchEvent(new CustomEvent(OPEN_SITE_CHATBOT_EVENT));
    });

    expect(screen.getByRole('dialog', { name: 'Ask AGFinancial' })).toBeTruthy();
  });

  it('renders navigation responses as clickable recommendation cards', async () => {
    mockRequestSiteChatbotReply.mockResolvedValue(
      [
        'Best match: 403b Individual Enrollment — /services/retirement/403b/403b-individual-enrollment',
        'Why: Specific route for users looking for individual 403(b) enrollment information.',
        'Second match: 403(b) — /services/retirement/403b',
        'Why: 403(b) retirement plan route with public support content, compliance guidance, and enrollment help context.',
      ].join('\n'),
    );

    renderChatbot();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AGFinancial' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Ask AGFinancial a question' }), {
      target: { value: 'Where can I find information about a 403(b) for an individual?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Best match')).toBeTruthy();
    expect(screen.getByRole('link', { name: '403b Individual Enrollment' }).getAttribute('href')).toBe(
      '/services/retirement/403b/403b-individual-enrollment',
    );
    expect(screen.getByText('Second match')).toBeTruthy();
    expect(screen.getByRole('link', { name: '403(b)' }).getAttribute('href')).toBe('/services/retirement/403b');
  });

  it('renders sourced answers with a clickable source page link', async () => {
    mockRequestSiteChatbotReply.mockResolvedValue(
      [
        'Answer: The contact page lists email, phone, hours, and inquiry routing for AGFinancial support.',
        'Source page: Contact Us — /contact-us',
      ].join('\n'),
    );

    renderChatbot();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AGFinancial' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Ask AGFinancial a question' }), {
      target: { value: 'How do I contact AGFinancial?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Answer')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Contact Us' }).getAttribute('href')).toBe('/contact-us');
  });

  it('falls back to the grounded local reply when no local API key is configured', async () => {
    mockIsOpenAIConfigured.mockReturnValue(false);

    renderChatbot();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AGFinancial' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Ask AGFinancial a question' }), {
      target: { value: 'Where can I find information about a 403(b) for an individual?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(screen.getByText('Best match')).toBeTruthy();
    expect(screen.getByRole('link', { name: '403b Individual Enrollment' }).getAttribute('href')).toBe(
      '/services/retirement/403b/403b-individual-enrollment',
    );
    expect(screen.getByText('Second match')).toBeTruthy();
    expect(screen.getByRole('link', { name: '403(b)' }).getAttribute('href')).toBe('/services/retirement/403b');
    expect(mockRequestSiteChatbotReply).not.toHaveBeenCalled();
  });

  it('keeps plain-text assistant replies readable', async () => {
    mockRequestSiteChatbotReply.mockResolvedValue(
      'AGFinancial retirement guidance can start with plan structure.\n\nYou can review retirement and 403(b) pages for public overview information.',
    );

    renderChatbot();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AGFinancial' }));
    fireEvent.click(screen.getByRole('button', { name: 'What retirement options do you offer?' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('AGFinancial retirement guidance can start with plan structure.')).toBeTruthy();
    expect(screen.getByText('You can review retirement and 403(b) pages for public overview information.')).toBeTruthy();
  });

  it('closes on escape in desktop mode', () => {
    renderChatbot();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AGFinancial' }));
    expect(screen.getByRole('dialog', { name: 'Ask AGFinancial' })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Ask AGFinancial' })).toBeNull();
  });

  it('closes on outside click in desktop mode', () => {
    renderChatbot();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AGFinancial' }));
    expect(screen.getByRole('dialog', { name: 'Ask AGFinancial' })).toBeTruthy();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('dialog', { name: 'Ask AGFinancial' })).toBeNull();
  });

  it('toggles closed when the launcher is clicked again', () => {
    renderChatbot();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AGFinancial' }));
    expect(screen.getByRole('dialog', { name: 'Ask AGFinancial' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Hide Ask AGFinancial' }));

    expect(screen.queryByRole('dialog', { name: 'Ask AGFinancial' })).toBeNull();
  });

  it('keeps the mobile chatbot shell layout-viewport safe instead of spanning both viewport edges', () => {
    const cssSource = readSource('../styles/site-chatbot.css');

    expect(cssSource).toContain('@media (max-width: 767px) {');
    expect(cssSource).toContain('left: 0.75rem;');
    expect(cssSource).toContain('right: 0.75rem;');
    expect(cssSource).toContain('width: auto;');
    expect(cssSource).toContain('max-width: none;');
    expect(cssSource).toContain('.site-chatbot-panel-shell {');
    expect(cssSource).toContain('max-width: 100%;');
    expect(cssSource).toContain('min-width: 0;');
  });
});
