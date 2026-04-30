import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home native color truth guardrail', () => {
  it('keeps semantic heading and span color hooks on the legacy home feature columns path', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-native-feature-copy h3.is-atlantean,');
    expect(cssSource).toContain('.home-native-feature-copy h3 mark.is-atlantean');
    expect(cssSource).toContain('.home-native-feature-copy h3.is-sandstone,');
    expect(cssSource).toContain('.home-native-feature-copy h3 mark.is-sandstone');
    expect(cssSource).toContain('.home-native-feature-copy h3.is-white,');
    expect(cssSource).toContain('.home-native-feature-copy h3 mark.is-white');
  });

  it('keeps sandstone wired in the legacy home newsletter heading path', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-native-newsletter > .ag-panel-rail > h2.is-sandstone,');
    expect(cssSource).toContain('.home-native-newsletter > .ag-panel-rail > h2 mark.is-sandstone');
  });
});
