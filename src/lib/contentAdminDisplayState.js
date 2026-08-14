import { buildBlockTemplateCreateId } from './blockTemplateIdentity';

export function buildContentAdminDisplayState({
  sharedAuthorityEnabled = false,
  state,
  publishedState,
  bufferedBlockSettingEdits,
  applyBufferedBlockSettingEdits,
} = {}) {
  const authoringDisplayState = sharedAuthorityEnabled
    ? applyBufferedBlockSettingEdits(state, bufferedBlockSettingEdits)
    : state;
  const safeAuthoringState = authoringDisplayState && typeof authoringDisplayState === 'object'
    ? authoringDisplayState
    : {};
  const safePublishedState = publishedState && typeof publishedState === 'object'
    ? publishedState
    : {};

  return {
    authoringDisplayState: safeAuthoringState,
    authoringPageHierarchy: safeAuthoringState.pageHierarchy || {},
    authoringBlocksByPath: safeAuthoringState.blocksByPath || {},
    authoringPathAliases: safeAuthoringState.pathAliases || {},
    collaborationByPath: safeAuthoringState.collaborationByPath || {},
    pageHierarchy: safePublishedState.pageHierarchy || {},
    blocksByPath: safePublishedState.blocksByPath || {},
    pathAliases: safePublishedState.pathAliases || {},
  };
}

export function buildContentAdminTemplateIndex(templates = []) {
  const templateById = new Map();
  (Array.isArray(templates) ? templates : []).forEach((template) => {
    const createId = buildBlockTemplateCreateId(template);
    const existing = templateById.get(createId);
    if (!existing || template?.isAddBlockDefault) {
      templateById.set(createId, template);
    }
  });
  return templateById;
}

