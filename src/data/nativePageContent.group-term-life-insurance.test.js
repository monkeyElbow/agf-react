import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('group term life insurance native page content', () => {
  it('keeps the request heading on dark core copy with only "group life" highlighted white', () => {
    const content = getNativePageContent('/services/insurance/group-term-life-insurance', '');
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    const requestSection = sections.find((section) => section?.className === 'group-life-native-quote');

    expect(requestSection?.title).toBe('Request a quote for group life.');
    expect(requestSection?.titleHighlights).toEqual([
      { start: 20, end: 30, className: 'is-white' },
    ]);
  });
});
