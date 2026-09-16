import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('rich HTML renderer security boundary', () => {
  it('routes dynamic/admin HTML bodies through SafeRichText', () => {
    const renderer = readRepoFile('src/components/blocks/PageBlocksRenderer.jsx');
    const cta = readRepoFile('src/components/DynamicCtaSection.jsx');
    const request = readRepoFile('src/components/DynamicRequestFormSection.jsx');
    const article = readRepoFile('src/pages/ResourceArticlePage.jsx');

    [renderer, cta, request, article].forEach((source) => {
      expect(source).toContain('SafeRichText');
      expect(source).not.toMatch(/dangerouslySetInnerHTML=\{\{\s*__html:\s*(?:bodyHtml|runtime\.bodyHtml|article\.bodyHtml)/);
    });
  });

  it('carries saved semantic body colors through every direct rich-body renderer', () => {
    const renderer = readRepoFile('src/components/blocks/PageBlocksRenderer.jsx');
    const request = readRepoFile('src/components/DynamicRequestFormSection.jsx');
    const css = readRepoFile('src/styles/service-native.css');

    expect(renderer).toContain('runtime.bodyColorClassName || \'\'');
    expect(request).toContain('config.bodyColorClassName');
    expect(css).toContain('.service-native-page .native-info-rich-html .is-mango');
    expect(css).toContain('.service-native-page .native-info-rich-html.is-mango');
    expect(css).toContain('native-info-rich-html.is-mango :is(h1, h2, h3, h4, h5, h6, p, li, blockquote)');
    expect(css).not.toContain('.service-native-page .native-info-rich-html.is-mango :is(span, strong, em, a)');
    expect(css).toContain('.home-native-newsletter-copy .is-mango');
  });
});
