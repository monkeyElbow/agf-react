import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('numbered step-card vertical alignment guardrail', () => {
  it('gives body-only cards a centered vertical field without disturbing action cards', () => {
    const source = readFileSync(path.resolve(__dirname, './service-native-numbered-cards.css'), 'utf8');

    expect(source).toContain(
      '.is-numbered-step-cards .service-native-card:not(:has(.service-native-action-row, .service-native-card-link-list, .service-native-card-bullet-list, .service-native-card-accordions)) {',
    );
    expect(source).toContain('min-height: clamp(6.8rem, 9vw, 8rem);');
    expect(source).toContain(
      '.is-numbered-step-cards .service-native-card:not(:has(.service-native-action-row, .service-native-card-link-list, .service-native-card-bullet-list, .service-native-card-accordions)) p {',
    );
    expect(source).toContain('grid-row: 1 / span 2;');
    expect(source).toContain('align-self: center;');
    expect(source).toContain(
      '.is-numbered-step-cards .service-native-card:not(:has(.service-native-action-row, .service-native-card-link-list, .service-native-card-bullet-list, .service-native-card-accordions)) .service-native-card-rich-body {',
    );
    expect(source).not.toContain('translateY(0.42em)');
  });

  it('lets explicit card title colors beat alternating step accents', () => {
    const source = readFileSync(path.resolve(__dirname, './service-native-numbered-cards.css'), 'utf8');

    expect(source).toContain(
      '.is-numbered-step-cards:is(.is-title-alternating, .is-title-super-grey, .is-title-atlantean, .is-title-mango, .is-title-melon, .is-title-white) .service-native-card h3.is-white {',
    );
    expect(source).toContain('color: #ffffff !important;');
  });

  it('stacks the dynamic step-card preset through the shared mobile contract', () => {
    const source = readFileSync(path.resolve(__dirname, './service-native-numbered-cards.css'), 'utf8');

    expect(source).toContain(
      '.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-numbered-step-cards .service-native-card:not(.investments-native-cert-card):not(.retirement-account-card--certificate) {\n    grid-template-columns: minmax(0, 1fr);',
    );
    expect(source).toContain(
      '.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-numbered-step-cards .service-native-card:not(.investments-native-cert-card):not(.retirement-account-card--certificate) :is(h3, p, .service-native-action-row, .service-native-card-rich-body, .service-native-card-bullet-list, .service-native-card-link-list, .service-native-card-accordions) {\n    grid-column: 1;\n    grid-row: auto;',
    );
    expect(source).toContain('grid-template-columns: minmax(var(--numbered-step-card-column), 18%) minmax(0, 1fr);');

    const mobileContract = source.slice(source.lastIndexOf('@media (max-width: 720px)'));
    expect(mobileContract).not.toMatch(/\n\s+(?:min-)?height\s*:/);
  });
});
