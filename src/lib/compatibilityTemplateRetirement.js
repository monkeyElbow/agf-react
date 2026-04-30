import {
  getCentralRetiredInsertCompatibilityTemplateIds,
  isCentralRetiredInsertCompatibilityTemplateId,
} from './compatibilityBridgeInventory';

export function getRetiredInsertCompatibilityTemplateIds(mode) {
  return getCentralRetiredInsertCompatibilityTemplateIds(mode);
}

export function isRetiredInsertCompatibilityTemplateId(templateId, mode) {
  return isCentralRetiredInsertCompatibilityTemplateId(templateId, mode);
}
