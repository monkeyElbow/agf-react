import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from './contentBlockBlueprints';
import { getNativePageContent } from './nativePageContent';

describe('group term life insurance native page content', () => {
  it('keeps native content shell-only and owns the request heading in blocks', () => {
    const content = getNativePageContent('/services/insurance/group-term-life-insurance', '');
    const blocks = contentBlockBlueprintsByPath['/services/insurance/group-term-life-insurance'] || [];
    const requestBlock = blocks.find((block) => block?.id === 'request_form');

    expect(content?.sections).toBeUndefined();
    expect(requestBlock?.settings?.title).toBe('Request a quote for group life.');
    expect(requestBlock?.settings?.titleClassName).toBe('is-super-grey');
    expect(requestBlock?.settings?.titleHighlightsJson).toBe('[{"start":20,"end":30,"className":"is-white"}]');
    expect(requestBlock?.settings?.sectionClassName).toBe('group-life-native-quote');
    expect(requestBlock?.settings?.targetSectionKey).toBe('');
  });
});
