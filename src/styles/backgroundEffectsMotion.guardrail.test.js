import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = readFileSync(path.resolve(__dirname, './service-native.css'), 'utf8');

describe('background effects motion contract', () => {
  it('preserves off-canvas light centers and gives ambient motion a visible slow path', () => {
    expect(source).toContain("left: clamp(-50%, calc(var(--block-background-light-x) + var(--block-background-light-motion-x)), 150%);");
    expect(source).toContain("top: clamp(-50%, calc(var(--block-background-light-y) + var(--block-background-light-motion-y)), 150%);");
    expect(source).toContain('animation: block-background-light-drift 18s ease-in-out');
    expect(source).toContain('will-change: transform;');
    expect(source).toContain('transform: translate(-43%, -57%) scale(1.08);');
  });
});
