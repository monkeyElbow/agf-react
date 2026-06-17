import { describe, expect, it } from 'vitest';
import { getNativePageContent } from './nativePageContent';

describe('accessibility native page content', () => {
  it('uses the full live-site accessibility statement instead of the old truncated fallback copy', () => {
    const content = getNativePageContent('/accessibility', 'Accessibility');
    const sections = Array.isArray(content?.sections) ? content.sections : [];

    expect(content?.pageClass).toBe('native-info-page--accessibility');
    expect(content?.hideHero).toBe(true);
    expect(content?.intro?.heading).toBe("We're committed to accessibility.");
    expect(content?.intro?.body).toEqual([
      'AGFinancial is committed to ensuring visitors with disabilities have the same quality of access to all the information on our website as non-disabled visitors. We are continually improving the user experience for everyone and applying updates to meet or exceed accessibility standards.',
    ]);
    expect(sections.map((section) => section?.title)).toEqual([
      'Conformance Status',
      'Limitations',
      'Give Feedback',
    ]);
    expect(sections[0]?.html).toContain('https://www.w3.org/WAI/standards-guidelines/wcag/');
    expect(sections[1]?.html).toContain('https://osxdaily.com/2014/10/22/increase-contrast-mac-os-x-yosemite/');
    expect(sections[1]?.html).toContain('https://support.microsoft.com/en-us/help/13862/windows-10-use-high-contrast-mode');
    expect(sections[2]?.actions).toEqual([{ label: 'Contact Us', to: '/contact-us' }]);
    expect(content?.actions).toEqual([]);
  });
});
