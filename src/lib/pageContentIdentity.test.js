import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getBlockDefinition } from '../blocks/registry';
import {
  genericPageBlockBlueprint,
  genericPageFallbackBlueprint,
  getAllBlockTemplateBlueprints,
} from '../data/contentBlockBlueprints';
import { buildAdminBlockInsertChoices } from './adminBlockInsertChoices';
import { getBlockHudDefinition } from './blockHudRegistry';
import {
  PAGE_CONTENT_IDENTITY,
  PAGE_CONTENT_IDENTITY_SURFACES,
  isPageContentBlock,
  isPageContentBlockId,
  isPageContentEditorType,
  isPageContentKind,
  isPageContentTemplateId,
} from './pageContentIdentity';
import { CANONICAL_SINGLE_BLOCK_CONTRACT } from './singleBlockContract';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('page content identity contract', () => {
  it('codifies content/page_content as one explicit permanent split', () => {
    expect(PAGE_CONTENT_IDENTITY.decision).toBe('permanent-explicit-split');
    expect(PAGE_CONTENT_IDENTITY.kind).toBe('content');
    expect(PAGE_CONTENT_IDENTITY.editorType).toBe('page_content');
    expect(PAGE_CONTENT_IDENTITY.templateId).toBe('page_content');
    expect(PAGE_CONTENT_IDENTITY.blockId).toBe('page_content');
    expect(PAGE_CONTENT_IDENTITY_SURFACES).toMatchObject({
      definitionKind: 'content',
      registryKind: 'content',
      runtimeKind: 'content',
      editorType: 'page_content',
      hudEditorType: 'page_content',
      pickerEditorType: 'page_content',
      seedTemplateId: 'page_content',
      sampleTemplateId: 'page_content',
      persistedBlockId: 'page_content',
      persistedBridge: 'page_content',
    });

    expect(isPageContentKind('content')).toBe(true);
    expect(isPageContentEditorType('page_content')).toBe(true);
    expect(isPageContentTemplateId('page_content')).toBe(true);
    expect(isPageContentBlockId('page_content')).toBe(true);

    const definition = getBlockDefinition(PAGE_CONTENT_IDENTITY.kind);
    expect(definition?.kind).toBe(PAGE_CONTENT_IDENTITY.kind);
    expect(definition?.editorType).toBe(PAGE_CONTENT_IDENTITY.editorType);
    expect(getBlockDefinition(PAGE_CONTENT_IDENTITY.editorType)).toBeNull();
    expect(CANONICAL_SINGLE_BLOCK_CONTRACT.content).toMatchObject({
      kind: PAGE_CONTENT_IDENTITY.kind,
      editorType: PAGE_CONTENT_IDENTITY.editorType,
      sampleTemplateId: PAGE_CONTENT_IDENTITY.templateId,
    });
  });

  it('keeps seed, picker, HUD, and persisted block identity aligned to the explicit split', () => {
    const seededContentBlock = genericPageBlockBlueprint().find((block) => isPageContentBlock(block));
    const fallbackContentBlock = genericPageFallbackBlueprint().find((block) => isPageContentBlock(block));
    expect(seededContentBlock).toMatchObject({
      id: PAGE_CONTENT_IDENTITY.blockId,
      kind: PAGE_CONTENT_IDENTITY.kind,
      mode: 'dynamic',
    });
    expect(fallbackContentBlock).toMatchObject({
      id: PAGE_CONTENT_IDENTITY.blockId,
      kind: PAGE_CONTENT_IDENTITY.kind,
      mode: 'dynamic',
    });

    const templates = getAllBlockTemplateBlueprints();
    const template = templates.find((candidate) => (
      candidate?.templateLookupId === PAGE_CONTENT_IDENTITY.templateId
      && candidate?.kind === PAGE_CONTENT_IDENTITY.kind
    ));
    expect(template).toMatchObject({
      templateLookupId: PAGE_CONTENT_IDENTITY.templateId,
      templateId: PAGE_CONTENT_IDENTITY.templateId,
      kind: PAGE_CONTENT_IDENTITY.kind,
      mode: 'dynamic',
    });

    const choice = buildAdminBlockInsertChoices(templates, { mode: 'dynamic' }).find((candidate) => (
      candidate?.kind === PAGE_CONTENT_IDENTITY.kind
      && candidate?.createTemplateId === PAGE_CONTENT_IDENTITY.templateId
      && candidate?.templateId === PAGE_CONTENT_IDENTITY.templateId
    ));
    expect(choice).toMatchObject({
      kind: PAGE_CONTENT_IDENTITY.kind,
      editorType: PAGE_CONTENT_IDENTITY.editorType,
      canonicalLabel: PAGE_CONTENT_IDENTITY.label,
      createTemplateId: PAGE_CONTENT_IDENTITY.templateId,
      templateId: PAGE_CONTENT_IDENTITY.templateId,
      isCompatibility: false,
    });

    const hudDefinition = getBlockHudDefinition({
      id: PAGE_CONTENT_IDENTITY.blockId,
      kind: PAGE_CONTENT_IDENTITY.kind,
      mode: 'dynamic',
      templateId: PAGE_CONTENT_IDENTITY.templateId,
    });
    expect(hudDefinition.label).toBe(PAGE_CONTENT_IDENTITY.label);
    expect(hudDefinition.editorType).toBe(PAGE_CONTENT_IDENTITY.editorType);
  });

  it('keeps runtime ownership on content kind instead of promoting page_content into a runtime kind', () => {
    const dynamicPageBlocksSource = readSource('./dynamicPageBlocks.js');
    const nativeContentPageSource = readSource('../components/NativeContentPage.jsx');

    expect(dynamicPageBlocksSource).toContain("kind !== 'content' && kind !== CALCULATOR_WIDGET_KIND");
    expect(dynamicPageBlocksSource).not.toContain("block.kind !== 'page_content'");
    expect(nativeContentPageSource).toContain("block.kind === 'content' || block.kind === CALCULATOR_WIDGET_KIND");
    expect(nativeContentPageSource).not.toContain("block.kind === 'page_content'");
  });
});
