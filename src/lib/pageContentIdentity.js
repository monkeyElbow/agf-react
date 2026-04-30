const PAGE_CONTENT_KIND = 'content';
const PAGE_CONTENT_EDITOR_TYPE = 'page_content';
const PAGE_CONTENT_BLOCK_ID = 'page_content';

export const PAGE_CONTENT_IDENTITY = Object.freeze({
  decision: 'permanent-explicit-split',
  label: 'Page Content',
  kind: PAGE_CONTENT_KIND,
  editorType: PAGE_CONTENT_EDITOR_TYPE,
  templateId: PAGE_CONTENT_EDITOR_TYPE,
  blockId: PAGE_CONTENT_BLOCK_ID,
  cssNamespace: 'page-content',
  rootClassName: 'native-dynamic-page-content',
});

export const PAGE_CONTENT_IDENTITY_SURFACES = Object.freeze({
  definitionKind: PAGE_CONTENT_IDENTITY.kind,
  registryKind: PAGE_CONTENT_IDENTITY.kind,
  runtimeKind: PAGE_CONTENT_IDENTITY.kind,
  editorType: PAGE_CONTENT_IDENTITY.editorType,
  hudEditorType: PAGE_CONTENT_IDENTITY.editorType,
  pickerEditorType: PAGE_CONTENT_IDENTITY.editorType,
  seedTemplateId: PAGE_CONTENT_IDENTITY.templateId,
  sampleTemplateId: PAGE_CONTENT_IDENTITY.templateId,
  persistedBlockId: PAGE_CONTENT_IDENTITY.blockId,
  persistedBridge: PAGE_CONTENT_IDENTITY.editorType,
});

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

export function isPageContentKind(value) {
  return normalizeToken(value) === PAGE_CONTENT_IDENTITY.kind;
}

export function isPageContentEditorType(value) {
  return normalizeToken(value) === PAGE_CONTENT_IDENTITY.editorType;
}

export function isPageContentTemplateId(value) {
  return normalizeToken(value) === PAGE_CONTENT_IDENTITY.templateId;
}

export function isPageContentBlockId(value) {
  return normalizeToken(value) === PAGE_CONTENT_IDENTITY.blockId;
}

export function isPageContentBlock(block) {
  return isPageContentKind(block?.kind) && isPageContentBlockId(block?.id);
}
