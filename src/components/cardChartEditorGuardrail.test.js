import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('Card Chart editor contracts', () => {
  it('keeps the visible heading preview and transparent input on one typography and padding contract', () => {
    const source = readSource('../styles/admin.css');

    expect(source).toContain('.admin-color-text-editor.is-card-chart-heading');
    expect(source).toContain('font-size: 1.5rem;');
    expect(source).toContain('line-height: 1.75;');
    expect(source).toContain('padding: 1rem 0.65rem 0.55rem;');
  });

  it('keeps Card Chart selected heading ranges mapped to their semantic render colors', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain('> h2 mark.is-atlantean');
    expect(source).toContain('> h2 mark.is-mango');
    expect(source).toContain('> h2 mark.is-melon');
    expect(source).toContain('color: var(--ag-color-melon);');
  });

  it('keeps Card Chart background swatches on the Page 1 right-side controls', () => {
    const definition = readSource('../blocks/definitions/cardChart.definition.js');
    const editor = readSource('./block-editors/migratedBlockEditors.jsx');
    const renderer = readSource('./NativeContentPage.jsx');

    expect(definition).toContain("id: 'bgTone'");
    expect(definition).toContain('options: SURFACE_BG_TONE_OPTIONS');
    expect(editor).toContain('admin-card-chart-header-editor-controls');
    expect(editor).toContain('admin-card-chart-background-control');
    expect(editor).toContain("onSettingChange('bgTone', normalizePanelBgTone(nextValue))");
    expect(renderer).toContain('is-bg-${runtime.bgTone}');
  });

  it('keeps Card Chart surface background variants owned by the shared block style', () => {
    const source = readSource('../styles/service-native.css');

    ['white', 'sand', 'blue', 'grey'].forEach((tone) => {
      expect(source).toContain(
        `.service-native-section:is(.native-dynamic-card-chart, .test-dynamic-card-chart).is-bg-${tone}`,
      );
    });
  });

  it('keeps selected card tones stronger than the shared comparison-table defaults', () => {
    const source = readSource('../styles/service-native.css');

    [
      'atlantean',
      'mango',
      'melon',
      'sandstone',
      'super-grey',
    ].forEach((tone) => {
      expect(source).toContain(
        `.info-table-sheet[data-info-table-first-column-header="false"] .info-table-sheet__table thead th.is-tone-${tone}`,
      );
    });
  });

  it('derives Card Chart cell fills from the selected tone instead of fixed column colors', () => {
    const source = readSource('../styles/service-native.css');

    [
      ['atlantean', '6%', '94%'],
      ['mango', '8%', '92%'],
      ['melon', '10%', '90%'],
      ['sandstone', '24%', '76%'],
      ['super-grey', '7%', '93%'],
    ].forEach(([tone, toneWeight, whiteWeight]) => {
      expect(source).toContain(
        `background: color-mix(in srgb, var(--ag-color-${tone}) ${toneWeight}, #fff ${whiteWeight});`,
      );
      expect(source).toContain(
        `.info-table-sheet[data-info-table-first-column-header="false"] .info-table-sheet__table tbody td[data-info-table-column-tone="${tone}"]`,
      );
    });
  });

  it('keeps Card Chart spacing sliders in two columns until the mobile breakpoint', () => {
    const adminSource = readSource('../styles/admin.css');
    const hudSource = readSource('../styles/front-hud.css');

    expect(adminSource).toContain(
      '.admin-card-chart-spacing-controls .admin-content-field-list {\n  display: grid;\n  width: 100%;\n  max-width: none;\n  grid-template-columns: repeat(2, minmax(0, 1fr));',
    );
    expect(adminSource).toContain(
      '.admin-card-chart-spacing-controls .admin-content-field-list > label {\n  grid-column: span 1;',
    );
    expect(hudSource).toContain(
      '.admin-hud-editor-shared-surface .admin-card-chart-spacing-controls .admin-content-field-list {\n  display: grid;\n  width: 100%;\n  max-width: none;\n  grid-template-columns: repeat(2, minmax(0, 1fr));',
    );
    expect(hudSource).toContain(
      '.admin-hud-editor-shared-surface .admin-card-chart-spacing-controls .admin-content-field-list > label {\n  grid-column: span 1;',
    );
    expect(adminSource).toContain(
      '.admin-card-chart-spacing-controls .admin-content-field-list {\n    grid-template-columns: minmax(0, 1fr);',
    );
    expect(hudSource).toContain(
      '.admin-hud-editor-shared-surface .admin-card-chart-spacing-controls .admin-content-field-list {\n    grid-template-columns: minmax(0, 1fr);',
    );
  });
});
