import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('root HTML stale-module recovery guardrail', () => {
  it('keeps the bootstrap recovery script for stale optimized deps and back-forward restores', () => {
    const source = readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

    expect(source).toContain("const RECOVERY_STATE_KEY = 'agf:module-load-recovery';");
    expect(source).toContain('Outdated Optimize Dep');
    expect(source).toContain('window.addEventListener(\'unhandledrejection\'');
    expect(source).toContain('window.addEventListener(\'pageshow\'');
    expect(source).toContain("window.location.port === '5173'");
  });
});
