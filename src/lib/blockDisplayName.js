export const ADMIN_BLOCK_NAME_MAX_LENGTH = 40;

export function normalizeAdminBlockName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, ADMIN_BLOCK_NAME_MAX_LENGTH);
}

export function formatBlockDisplayName(baseLabel, blockOrName = null) {
  const label = String(baseLabel || 'Block').trim() || 'Block';
  const adminName = normalizeAdminBlockName(
    typeof blockOrName === 'object' ? blockOrName?.adminName : blockOrName,
  );
  return adminName ? `${label} - ${adminName}` : label;
}
