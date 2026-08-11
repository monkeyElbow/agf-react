import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getAllBlockDefinitions } from '../blocks/registry';
import { getMigratedBlockEditorComponent } from './block-editors/migratedBlockEditors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('editor routing guardrails', () => {
  it('keeps every registered block connected to an admin editor and an explicit HUD editor path', () => {
    const hostSource = readFileSync(path.resolve(__dirname, './BlockHudPanelHost.jsx'), 'utf8');
    const hudSpecialCases = new Set(['cta_form']);

    getAllBlockDefinitions().forEach((definition) => {
      const kind = definition.kind;
      expect(getMigratedBlockEditorComponent(kind, 'admin'), `${kind} admin editor`).toEqual(expect.any(Function));

      const hudEditor = getMigratedBlockEditorComponent(kind, 'hud');
      if (hudSpecialCases.has(kind)) {
        expect(hudEditor, `${kind} HUD special case`).toBeNull();
        expect(hostSource).toContain("case 'cta_form':");
        return;
      }

      expect(hudEditor, `${kind} HUD editor`).toEqual(expect.any(Function));
    });
  });
});
