import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = readFileSync(path.resolve(__dirname, './service-native.css'), 'utf8');

describe('background effects layering', () => {
  it('keeps an uncropped light behind the next authored block surface', () => {
    expect(source).toContain('.block-background-effects {\n  position: absolute;\n  inset: 0;\n  z-index: 0;');
    expect(source).toContain(':is(.service-native-section, .service-native-intro, .service-native-hero):not(.has-block-background-effects) {\n  position: relative;\n  z-index: 1;');
    expect(source).toContain('.has-block-background-effects > :is(.ag-panel-rail, .ag-panel-rail-wide) {\n  position: relative;\n  z-index: 1;');
  });
});
