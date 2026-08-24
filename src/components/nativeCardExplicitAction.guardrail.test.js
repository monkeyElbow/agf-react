import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native card link contract', () => {
  it('keeps card surfaces non-clickable and exposes navigation through explicit actions only', () => {
    const rendererSource = readSource('./NativeContentPage.jsx');
    const nativeCss = readSource('../styles/service-native.css');
    const publicCss = readSource('../styles/home-service-public.css');
    const calculatorCss = readSource('../styles/service-native-calculators.css');

    // Durable rule: a card is a content surface, not a hidden full-card link.
    // Legitimate admin-authored navigation remains available through Action buttons.
    [rendererSource, nativeCss, publicCss, calculatorCss].forEach((source) => {
      expect(source).not.toContain('service-native-card-stretched-link');
      expect(source).not.toContain('has-stretched-link');
    });
    expect(nativeCss).not.toContain('.legacy-child-native-trust-choices--trusts .service-native-card:hover');
    expect(rendererSource).toContain('<Action item={certificateAction} />');
    expect(rendererSource).toContain('<Action\n                          item={{');
  });
});
