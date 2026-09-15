import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.resolve(__dirname, './editor-control-browser-audit.mjs'), 'utf8');

describe('editor browser audit guardrails', () => {
  it('does not treat inline editor variables as proof that a descendant rendered', () => {
    expect(source).toContain('const getRenderedControlProof = (root, fieldId) =>');
    expect(source).toContain("cardPaddingRem: [{ selector: '.service-native-card");
    expect(source).toContain('rendered ${fieldId} proof did not change');
    expect(source).not.toContain("style: node.getAttribute('style') || ''");
    expect(source).not.toContain('const cssVars = {}');
  });

  it('maps card appearance controls to computed properties on their intended targets', () => {
    expect(source).toContain("bgTone: [{ selector: '.service-native-section', property: 'background', includeRoot: true }]");
    expect(source).toContain("cardOutline: [{ selector: '.service-native-card', property: 'border' }]");
    expect(source).toContain("cardOutlineTone: [{ selector: '.service-native-card', property: 'border-color' }]");
    expect(source).toContain("cardOutlineWidth: [{ selector: '.service-native-card', property: 'border-width' }]");
    expect(source).toContain("cardShadow: [{ selector: '.service-native-card', property: 'box-shadow' }]");
    expect(source).toContain("cardShadowOpacity: [{ selector: '.service-native-card', property: 'box-shadow' }]");
    expect(source).toContain("titleTone: [{ selector: '.service-native-card h3', property: 'color' }]");
    expect(source).toContain("bodyTone: [{ selector: '.service-native-card :is(p, li)', property: 'color' }]");
    expect(source).toContain("backgroundEffectsJson: [{ selector: '.block-background-effects', property: 'display' }]");
    expect(source).toContain("'aria:Light 1 motion style#1': [{ selector: '.block-background-light', property: 'animation-name' }]");
  });
});
