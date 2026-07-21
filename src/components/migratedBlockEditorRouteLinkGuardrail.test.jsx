import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('migrated block editor route-link guardrail', () => {
  it('keeps route-link promotion on shared local helpers in migrated block editors', () => {
    const source = readSource('./block-editors/migratedBlockEditors.jsx');

    expect(source).toContain('function promoteRouteLinkDescriptor(field, routeRefFieldId) {');
    expect(source).toContain('function getPromotedRouteLinkField(fieldById, fieldId, routeRefFieldId) {');
    expect(source).toContain('function commitCanonicalRouteLinkWithSplitMirror(onSettingChange, hrefFieldId, routeRefFieldId, nextHrefValue, nextRouteRefValue) {');
    expect(source).toContain('getCanonicalLinkJsonFieldId');
    expect(source).toContain('serializeLinkValue');
    expect(source).toContain('onRouteLinkChange');
    expect(source).toContain('function buildInlineActionFields({');
    expect(source).toContain("getPromotedRouteLinkField(fieldById, 'browsePath', 'browsePageRef')");
    expect(source).toContain("getPromotedRouteLinkField(fieldById, 'ctaPath', 'ctaPageRef')");
    expect(source).toContain("...buildInlineActionFields({");
    expect(source).not.toContain('syncRouteRefDraftField');
    expect(source).not.toContain('commitSplitRouteLinkSettings');
    expect(source).not.toContain("buttonUrlField ? {");
    expect(source).not.toContain("pathField ? {");
  });
});
