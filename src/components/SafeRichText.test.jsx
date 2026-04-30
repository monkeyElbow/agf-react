import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SafeRichText from './SafeRichText';
import { sanitizeRichTextHtml } from '../lib/safeHtml';

describe('SafeRichText', () => {
  it('sanitizes unsafe markup through the shared boundary', () => {
    const html = `
      <p onclick="alert('x')">Trusted <strong>copy</strong></p>
      <script>alert('bad')</script>
      <a href="javascript:alert('x')" target="_blank">Bad link</a>
      <a href="https://example.com" target="_blank">Good link</a>
    `;

    const { container } = render(<SafeRichText html={html} className="native-info-rich-html" />);
    const root = container.querySelector('.native-info-rich-html');
    const links = root.querySelectorAll('a');

    expect(root.innerHTML).toBe(sanitizeRichTextHtml(html));
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('p')?.getAttribute('onclick')).toBeNull();
    expect(links[0]?.getAttribute('href')).toBeNull();
    expect(links[1]?.getAttribute('href')).toBe('https://example.com');
    expect(links[1]?.getAttribute('rel')).toContain('noopener');
    expect(links[1]?.getAttribute('rel')).toContain('noreferrer');
  });
});
