import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const editorSource = readFileSync(path.resolve(__dirname, './block-editors/migratedBlockEditors.jsx'), 'utf8');
const definitionSource = readFileSync(path.resolve(__dirname, '../blocks/definitions/cardGrid.definition.js'), 'utf8');

describe('card-grid editor wiring', () => {
  it('keeps subtitle swatches in subtitle editor and body tone in appearance', () => {
    const headerStart = editorSource.indexOf('function CardGridHeaderEditor');
    const headerEnd = editorSource.indexOf('function CardGridButtonEditor', headerStart);
    const headerSource = editorSource.slice(headerStart, headerEnd);
    const gridStart = editorSource.indexOf('export function GridBlockEditor');
    const gridEnd = editorSource.indexOf('export function', gridStart + 1);
    const gridSource = editorSource.slice(gridStart, gridEnd > gridStart ? gridEnd : undefined);

    expect(headerSource).not.toContain("label: 'Subtitle color'");
    expect(headerSource).not.toContain('subtitleColorField: subtitleColorFieldProp');
    expect(headerSource).toContain('admin-card-grid-header-editor-columns');
    expect(headerSource).toContain('headerControlFields');
    expect(headerSource).toContain('baseColorClassName={normalizeSemanticTextColorClass(settings.subtitleClassName)}');
    expect(headerSource).toContain("onBaseColorChange={(nextValue) => onSettingChange('subtitleClassName', nextValue)}");
    expect(headerSource).toContain('previewWrapClassName={`is-bg-${gridBgTone}`}');
    expect(headerSource).toContain("className={`is-bg-${gridBgTone}${subheadSizeRem !== null ? ' is-subhead-sized' : ''}`}");
    expect(gridSource).toContain('const appearanceFields = [titleToneField, bodyToneField, bgToneField]');
    expect(gridSource).toContain('const headerControlFields = [headerSizeField, subheadSizeField, ...spacingFields].filter(Boolean);');
    expect(gridSource).not.toContain('admin-card-grid-hud-group--spacing');
    expect(readFileSync(path.resolve(__dirname, '../styles/admin.css'), 'utf8')).toContain(
      '.admin-card-grid-header-editor .admin-color-text-preview.is-sandstone',
    );
  });

  it('exposes block-level subhead sizing with a representable range step', () => {
    expect(definitionSource).toContain("id: 'subheadSizeRem'");
    expect(definitionSource).toContain("label: 'Grid subhead size (rem)'");
    expect(definitionSource).toContain('step: 0.05');
    expect(definitionSource).toContain("id: 'headerSizeRem'");
    expect(definitionSource).toContain("label: 'Header size (rem)'");
  });

  it('exposes an alternating body-color option for card copy', () => {
    expect(definitionSource).toContain("id: 'bodyTone'");
    expect(definitionSource).toContain('options: GRID_CARD_BODY_TONE_OPTIONS');
    expect(definitionSource).toContain("value: 'alternating'");
  });
});
