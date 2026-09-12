import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.resolve(__dirname, './editor-control-browser-audit.mjs'), 'utf8');

describe('editor browser audit guardrails', () => {
  it('does not treat inline editor variables as proof that a descendant rendered', () => {
    expect(source).toContain('const getRenderedControlProof = (root, fieldId) =>');
    expect(source).toContain("{ selector: '.service-native-card', property: 'padding' }");
    expect(source).toContain('rendered ${fieldId} proof did not change');
    expect(source).not.toContain("style: node.getAttribute('style') || ''");
    expect(source).not.toContain('const cssVars = {}');
  });
});
