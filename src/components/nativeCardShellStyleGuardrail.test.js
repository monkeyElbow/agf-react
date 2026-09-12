import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('native card shell style guardrail', () => {
  it('keeps shared migrated card-shell spacing tokens aligned between grid and columns families', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('.service-native-section.native-dynamic-grid,');
    expect(source).toContain('.service-native-section.native-dynamic-columns,');
    expect(source).toContain('--native-card-shell-radius: 14px;');
    expect(source).toContain('--native-card-shell-padding: clamp(1.05rem, 2.2vw, 1.45rem);');
    expect(source).toContain('--native-card-shell-title-gap: 0.62rem;');
    expect(source).toContain('--native-card-shell-action-gap: 1rem;');
    expect(source).toContain('padding: var(--dynamic-grid-card-padding, var(--native-card-shell-padding));');
    expect(source).toContain('border-radius: var(--native-card-shell-radius);');
    expect(source).toContain('margin: 0 0 var(--native-card-shell-title-gap);');
    expect(source).toContain('padding-bottom: var(--native-card-shell-title-padding);');
    expect(source).toContain('padding-top: var(--native-card-shell-action-gap);');
    expect(source).toContain('.native-columns-copy .service-native-action-row {');
    expect(source).toContain('margin-top: var(--native-card-shell-action-gap);');
  });

  it('keeps page-specific dynamic card shells connected to the shared padding control', () => {
    const source = readSource('../styles/service-native.css');
    const dynamicCardShellSelectors = [
      '.native-info-page--careers .careers-native-benefits .service-native-card',
      '.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-investment-options .service-native-card',
      '.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-eligibility-cards .service-native-card',
      '.service-native-section:is(.native-dynamic-grid, .test-dynamic-grid).is-card-grid-preset-step-cards .service-native-card:not(.investments-native-cert-card):not(.retirement-account-card--certificate)',
      '.native-info-page--retirement-rollovers .service-native-section.native-dynamic-grid.retirement-rollovers-native-options .service-native-card:not(.investments-native-cert-card)',
      '.legacy-child-native-trusts-funding .service-native-card',
    ];

    dynamicCardShellSelectors.forEach((selector) => {
      let searchStart = 0;
      let hasSharedPaddingDeclaration = false;
      let selectorStart = source.indexOf(`${selector} {`, searchStart);
      while (selectorStart >= 0) {
        const declarationEnd = source.indexOf('}', selectorStart);
        const declarationBlock = source.slice(selectorStart, declarationEnd);
        if (declarationBlock.includes('var(--dynamic-grid-card-padding')) {
          hasSharedPaddingDeclaration = true;
          break;
        }
        searchStart = declarationEnd + 1;
        selectorStart = source.indexOf(`${selector} {`, searchStart);
      }
      expect(selectorStart, `${selector} should exist`).toBeGreaterThanOrEqual(0);
      expect(hasSharedPaddingDeclaration, `${selector} should consume the shared card padding`).toBe(true);
    });
  });

  it('does not expose card-title color when a card-grid presentation intentionally hides card titles', () => {
    const editorSource = readSource('./block-editors/migratedBlockEditors.jsx');

    expect(editorSource).toContain('const cardTitlesAreHidden = normalizeGridCardStyleToken(settings.cardStyle) === \'planned-giving-centered\'');
    expect(editorSource).toContain('const titleToneField = cardTitlesAreHidden ? null : titleToneFieldBase;');
    expect(editorSource).toContain("sectionClassTokens.includes('legacy-child-native-assets')");
  });

  it('keeps page-specific card copy attached to the shared text-tone variables', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('color: var(--dynamic-grid-body-color, var(--ag-color-super-grey));');
    expect(source).toContain('color: var(--dynamic-grid-body-color, rgba(65, 64, 66, 0.84));');
    expect(source).toContain('color: var(--dynamic-grid-alt-title-one, var(--dynamic-grid-card-title-color, var(--ag-color-atlantean)));');
    expect(source).toContain('color: var(--dynamic-grid-card-title-color, #fff) !important;');
    expect(source).toContain('.is-title-tone-override .service-native-card h3');
  });

  it('activates the explicit outline contract when an admin changes its tone or width', () => {
    const editorSource = readSource('./block-editors/migratedBlockEditors.jsx');

    expect(editorSource).toContain("if (['cardOutlineTone', 'cardOutlineWidth'].includes(fieldId)) {");
    expect(editorSource).toContain("onSettingChange('cardOutline', true);");
  });
});
