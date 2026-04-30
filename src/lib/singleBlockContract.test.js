import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getBlockDefinition } from '../blocks/registry';
import { getAllBlockTemplateBlueprints } from '../data/contentBlockBlueprints';
import { buildAdminBlockInsertChoices } from './adminBlockInsertChoices';
import { getBlockHudDefinition } from './blockHudRegistry';
import { getEditorParityContract } from './editorParityContract';
import {
  CANONICAL_SINGLE_BLOCK_CONTRACT,
  CANONICAL_SINGLE_BLOCK_EDITOR_TYPES,
  CANONICAL_SINGLE_BLOCK_KINDS,
  getCanonicalSingleBlockContract,
} from './singleBlockContract';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('canonical single-block contract', () => {
  it('keeps the target non-family dynamic blocks on one canonical identity contract', () => {
    expect(CANONICAL_SINGLE_BLOCK_KINDS).toEqual([
      'hero',
      'intro',
      'content',
      'billboard',
      'testimonials',
      'newsletter',
    ]);
    expect(CANONICAL_SINGLE_BLOCK_EDITOR_TYPES).toEqual([
      'hero',
      'intro',
      'page_content',
      'billboard',
      'testimonials',
      'newsletter',
    ]);

    CANONICAL_SINGLE_BLOCK_KINDS.forEach((kind) => {
      const contract = CANONICAL_SINGLE_BLOCK_CONTRACT[kind];
      const definition = getBlockDefinition(kind);

      expect(definition).toBeTruthy();
      expect(definition?.kind).toBe(kind);
      expect(definition?.label).toBe(contract.label);
      expect(definition?.editorType).toBe(contract.editorType);
      expect(definition?.styleScope?.cssNamespace).toBe(contract.cssNamespace);
      expect(definition?.styleScope?.rootClassName).toBe(contract.rootClassName);
      expect(getCanonicalSingleBlockContract(kind)).toBe(contract);
      expect(getCanonicalSingleBlockContract(contract.editorType)).toBe(contract);
      expect(getEditorParityContract(kind)?.label).toBe(contract.label);
      expect(getEditorParityContract(contract.editorType)?.label).toBe(contract.label);
    });
  });

  it('keeps picker and HUD identity secondary to canonical single-block ownership', () => {
    const choices = buildAdminBlockInsertChoices(getAllBlockTemplateBlueprints(), { mode: 'dynamic' });

    CANONICAL_SINGLE_BLOCK_KINDS.forEach((kind) => {
      const contract = CANONICAL_SINGLE_BLOCK_CONTRACT[kind];
      const choice = choices.find((candidate) => (
        candidate?.kind === kind
        && candidate?.createTemplateId === contract.sampleTemplateId
        && candidate?.isCompatibility === false
      ));

      expect(choice).toBeTruthy();
      expect(choice?.editorType).toBe(contract.editorType);
      expect(choice?.canonicalLabel).toBe(contract.label);
      expect(choice?.familyKind).toBe('');
      expect(choice?.presetId).toBe('');

      const sampleBlock = {
        id: contract.sampleTemplateId,
        kind,
        mode: 'dynamic',
        templateId: contract.sampleTemplateId,
      };
      const hudDefinition = getBlockHudDefinition(sampleBlock);

      expect(hudDefinition.label).toBe(contract.label);
      expect(hudDefinition.editorType).toBe(contract.editorType);
    });
  });

  it('keeps runtime ownership on explicit canonical class hooks for the target single blocks', () => {
    const source = readSource('../components/NativeContentPage.jsx');

    CANONICAL_SINGLE_BLOCK_KINDS.forEach((kind) => {
      const contract = CANONICAL_SINGLE_BLOCK_CONTRACT[kind];
      expect(source).toContain(contract.rootClassName);
    });

    expect(source).toContain('buildDynamicHeroFromBlock,');
    expect(source).toContain('buildDynamicIntroFromBlock,');
    expect(source).toContain('buildDynamicPageContentFromBlock,');
    expect(source).toContain('buildDynamicBillboardFromBlock,');
    expect(source).toContain('buildDynamicTestimonialsFromBlock,');
    expect(source).toContain('buildDynamicNewsletterFromBlock,');
  });
});
