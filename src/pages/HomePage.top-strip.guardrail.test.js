import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('home page top strip guardrail', () => {
  it('keeps the home utility strip in compact utility chrome scale instead of oversized CTA sizing', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.home-native-strip-fluid {');
    expect(cssSource).toContain('min-height: 46px;');
    expect(cssSource).toContain('padding: 0.22rem clamp(0.75rem, 2.2vw, var(--ag-nav-inline));');
    expect(cssSource).toContain('.home-native-strip-login-btn {');
    expect(cssSource).toContain('--home-strip-btn-padding-block: 0.34rem;');
    expect(cssSource).toContain('--home-strip-btn-padding-inline: 0.92rem;');
    expect(cssSource).toContain('min-height: 32px;');
    expect(cssSource).toContain('font-size: 0.8rem;');
    expect(cssSource).toContain('line-height: 1;');
    expect(cssSource).toContain('.home-native-strip-rates {');
    expect(cssSource).toContain('font-size: clamp(1.08rem, 1vw, 1.16rem);');
    expect(cssSource).toContain('font-weight: 650;');
    expect(cssSource).toContain('.home-native-strip-phone {');
    expect(cssSource).toContain('font-size: clamp(1.08rem, 1vw, 1.16rem);');
    expect(cssSource).toContain('font-weight: 600;');
    expect(cssSource).toContain('@media (max-width: 640px) {');
    expect(cssSource).toContain('padding: 0.56rem 0.75rem;');
    expect(cssSource).toContain('row-gap: 0.24rem;');
    expect(cssSource).not.toContain('min-height: 58px;');
    expect(cssSource).not.toContain('font-size: clamp(1.19rem, 1.9vw, 1.54rem);');
    expect(cssSource).not.toContain('min-height: 48px;');
  });
});
