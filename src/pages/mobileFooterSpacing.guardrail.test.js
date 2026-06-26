import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('mobile footer spacing guardrail', () => {
  it('keeps the home newsletter block carrying the mobile chatbot reserved space', () => {
    const homeCss = readSource('../styles/home-native.css');

    expect(homeCss).toContain(`.home-native-newsletter {
  --home-newsletter-bg: var(--ag-color-super-grey);
  --home-newsletter-text: #f0eee8;
  --home-newsletter-heading: #ffffff;
  --home-newsletter-mark: var(--ag-color-mango);
  background: var(--home-newsletter-bg);
  color: var(--home-newsletter-text);
  padding:
    clamp(2.5rem, 6vw, 4rem)
    0
    max(clamp(2.5rem, 6vw, 4rem), var(--site-chatbot-mobile-reserved-space, 0px));
}`);
  });

  it('keeps the loans tariffs feature carrying the mobile chatbot reserved space', () => {
    const serviceCss = readSource('../styles/service-native.css');

    expect(serviceCss).toContain(`.loans-native-tariffs .service-native-dark-feature {
  border-radius: 0;
  padding-bottom: var(--site-chatbot-mobile-reserved-space, 0px);
}`);
  });
});
