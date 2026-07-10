export const defaultChartsLibrarySeed = Object.freeze([
  {
    id: 'retirement-403b-contribution-limits',
    title: '403(b) Annual Contribution Limits',
    group: 'Retirement',
    scope: 'product',
    usage: 'Shown on the public 403(b) page under Annual Contribution Limits.',
    valueAlignment: 'left',
    headers: ['403(b) Contribution Limit', '2026', '2025'],
    rows: [
      ['Under age 50 deferral limit (pre-tax and Roth after-tax)', 'The lesser of $24,500 or includible compensation.', 'The lesser of $23,500 or includible compensation.'],
      ['Age 50 and up deferral limit*', 'The lesser of $32,500 or includible compensation.', 'The lesser of $31,000 or includible compensation.'],
      ['Age 60-63 deferral limit**', 'The lesser of $35,750 or includible compensation.', 'The lesser of $34,750 or includible compensation.'],
      ['Overall limit under age 50***', '$72,000', '$70,000'],
      ['Overall limit age 50 and up†', '$80,000', '$77,500'],
      ['Overall limit age 60-63**', '$83,250', '$81,250'],
    ],
  },
]);

export function buildDefaultChartsLibrary() {
  return defaultChartsLibrarySeed.map((entry) => ({
    ...entry,
    headers: Array.isArray(entry.headers) ? [...entry.headers] : [],
    rows: Array.isArray(entry.rows) ? entry.rows.map((row) => (Array.isArray(row) ? [...row] : [])) : [],
  }));
}
