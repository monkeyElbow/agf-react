import { describe, expect, it } from 'vitest';
import {
  ADMIN_BLOCK_NAME_MAX_LENGTH,
  formatBlockDisplayName,
  normalizeAdminBlockName,
} from './blockDisplayName';

describe('block display names', () => {
  it('keeps the canonical kind label first and appends an optional admin name', () => {
    expect(formatBlockDisplayName('Billboard', { adminName: 'Pricing' })).toBe('Billboard - Pricing');
    expect(formatBlockDisplayName('Billboard', { adminName: '' })).toBe('Billboard');
  });

  it('normalizes whitespace and caps admin names without changing block identity', () => {
    const source = `  Pricing   ${'x'.repeat(ADMIN_BLOCK_NAME_MAX_LENGTH)}  `;
    expect(normalizeAdminBlockName(source)).toHaveLength(ADMIN_BLOCK_NAME_MAX_LENGTH);
    expect(normalizeAdminBlockName(source)).toMatch(/^Pricing x/);
  });
});
