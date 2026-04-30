export const ALL_DYNAMIC_COLUMN_SLOTS = [1, 2, 3, 4];

const DYNAMIC_COLUMNS_COUNT_TOKEN_BY_VALUE = {
  2: 'two',
  3: 'three',
  4: 'four',
};

export function normalizeDynamicColumnsCountValue(value) {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'four' || token === '4') {
    return 4;
  }
  if (token === 'three' || token === '3') {
    return 3;
  }
  return 2;
}

export function toDynamicColumnsCountToken(value) {
  const count = normalizeDynamicColumnsCountValue(value);
  return DYNAMIC_COLUMNS_COUNT_TOKEN_BY_VALUE[count] || 'two';
}

export function getVisibleDynamicColumnSlots(settings = {}) {
  return ALL_DYNAMIC_COLUMN_SLOTS.slice(0, normalizeDynamicColumnsCountValue(settings.columns));
}

export function isDynamicColumnEnabled(settings = {}, slot) {
  return settings?.[`col${slot}Enabled`] !== false;
}

export function hasReadableDynamicColumnCopy(settings = {}, slot) {
  return [
    settings?.[`col${slot}Title`],
    settings?.[`col${slot}Body`],
    settings?.[`col${slot}ButtonLabel`],
  ].some((value) => String(value || '').trim());
}

export function getPreferredDynamicColumnSlot(settings = {}, slots = getVisibleDynamicColumnSlots(settings)) {
  const textSlotWithCopy = slots.find((slot) => (
    String(settings?.[`col${slot}Type`] || 'text').trim().toLowerCase() !== 'photo'
    && hasReadableDynamicColumnCopy(settings, slot)
  ));
  if (textSlotWithCopy) {
    return textSlotWithCopy;
  }

  const slotWithAnyCopy = slots.find((slot) => hasReadableDynamicColumnCopy(settings, slot));
  if (slotWithAnyCopy) {
    return slotWithAnyCopy;
  }

  return slots[0] || 1;
}

export function getDynamicColumnWidthShare(settings = {}, slot, fallback = 1) {
  const parsed = Number(settings?.[`col${slot}WidthShare`]);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0.5, Math.min(2.5, parsed));
}
