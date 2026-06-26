import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('SiteLayout footer spacing guardrail', () => {
  it('uses a flex layout shell instead of stretching main with viewport min-height', () => {
    const layoutSource = readSource('./SiteLayout.jsx');
    const cssSource = readSource('../styles.css');

    expect(layoutSource).toContain('<div className="site-layout">');
    expect(cssSource).toContain('.site-layout {');
    expect(cssSource).toContain('display: flex;');
    expect(cssSource).toContain('flex-direction: column;');
    expect(cssSource).toContain('.app-main {');
    expect(cssSource).toContain('flex: 1 0 auto;');
    expect(cssSource).not.toContain('min-height: calc(100vh - 72px);');
    expect(cssSource).not.toContain('padding-bottom: var(--site-chatbot-mobile-reserved-space, 0px);');
  });
});
