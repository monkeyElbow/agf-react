import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

describe('accessibility native page content', () => {
  it('keeps the native route shell while blocks own the live-site accessibility statement', () => {
    const content = getNativePageContent('/accessibility', 'Accessibility');
    const blocks = contentBlockBlueprintsByPath['/accessibility'] || [];
    const introBlock = blocks.find((block) => block?.id === 'intro');
    const conformanceBlock = blocks.find((block) => block?.id === 'conformance_status');
    const limitationsBlock = blocks.find((block) => block?.id === 'limitations');
    const feedbackBlock = blocks.find((block) => block?.id === 'feedback');

    expect(content?.pageClass).toBe('native-info-page--accessibility');
    expect(content?.hideHero).toBe(true);
    expect(content?.hero).toBeUndefined();
    expect(content?.intro).toBeUndefined();
    expect(Array.isArray(content?.sections) ? content.sections : []).toEqual([]);

    expect(introBlock?.settings?.heading).toBe("We're committed to accessibility.");
    expect(introBlock?.settings?.bodyHtml).toContain('ensuring visitors with disabilities have the same quality of access');
    expect(conformanceBlock?.settings?.html).toContain('https://www.w3.org/WAI/standards-guidelines/wcag/');
    expect(limitationsBlock?.settings?.html).toContain('https://osxdaily.com/2014/10/22/increase-contrast-mac-os-x-yosemite/');
    expect(limitationsBlock?.settings?.html).toContain('https://support.microsoft.com/en-us/help/13862/windows-10-use-high-contrast-mode');
    expect(feedbackBlock?.settings?.buttonLabel).toBe('Contact Us');
    expect(feedbackBlock?.settings?.buttonPageRef).toBe('/contact-us');
  });
});
