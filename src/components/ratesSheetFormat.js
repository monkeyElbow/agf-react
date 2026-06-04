export function formatRateProductLabel(product) {
  const normalized = String(product || '').trim().toLowerCase();
  if (!normalized) {
    return '';
  }

  return normalized
    .split('-')
    .map((segment) => segment
      .split(/\s+/)
      .map((word) => {
        if (!word) {
          return '';
        }
        if (/^\d+$/.test(word)) {
          return word;
        }
        return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
      })
      .join(' '))
    .join('-');
}
