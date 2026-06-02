import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('legacy giving stewardship story layout guardrail', () => {
  it('keeps the premium light-leak background and the centered responsive stewardship layout scoped to the legacy feature', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-stewardship-story {');
    expect(cssSource).toContain('--legacy-stewardship-final-cta-gap: clamp(1rem, 2vw, 1.45rem);');
    expect(cssSource).toContain('padding-top: 0;');
    expect(cssSource).toContain('background: #ffffff;');
    expect(cssSource).toContain('.legacy-stewardship-story-frame {');
    expect(cssSource).toContain('width: 100vw;');
    expect(cssSource).toContain('margin-left: calc(50% - 50vw);');
    expect(cssSource).toContain('radial-gradient(circle at 18% 12%, rgba(0, 173, 187, 0.16), rgba(0, 173, 187, 0) 40%)');
    expect(cssSource).toContain('.legacy-stewardship-story-light-leaks {');
    expect(cssSource).toContain('inset: -8% -8% -4%;');
    expect(cssSource).toContain('.legacy-stewardship-story-light-leak.is-a {');
    expect(cssSource).toContain('.legacy-stewardship-story-light-leak.is-b {');
    expect(cssSource).toContain('.legacy-stewardship-story-light-leak.is-c {');
    expect(cssSource).toContain('.legacy-stewardship-story-first-cue {');
    expect(cssSource).toContain('.legacy-stewardship-story-first-cue-mark {');
    expect(cssSource).toContain('.legacy-stewardship-story-final-secondary {');
    expect(cssSource).toContain('color: var(--ag-color-super-grey);');
    expect(cssSource).toContain('rgba(0, 173, 187, 0.52)');
    expect(cssSource).toContain('rgba(246, 177, 70, 0.46)');
    expect(cssSource).toContain('.legacy-stewardship-story-static-beats li {');
    expect(cssSource).toContain('border-top: 0;');
    expect(cssSource).toContain('font-size: clamp(1.55rem, 2.8vw, 2.35rem);');
    expect(cssSource).toContain('align-items: stretch;');
    expect(cssSource).toContain('min-height: 100vh;');
    expect(cssSource).toContain('justify-content: center;');
    expect(cssSource).toContain('gap: clamp(0.45rem, 0.9vw, 0.7rem);');
    expect(cssSource).toContain('min-height: clamp(10.75rem, 18vw, 12.75rem);');
    expect(cssSource).toContain('margin-top: clamp(2.4rem, 5.1vw, 3.9rem);');
    expect(cssSource).toContain('@media (max-width: 1099px) {');
    expect(cssSource).toContain('font-size: clamp(1.85rem, 4.6vw, 2.65rem);');
    expect(cssSource).toContain('font-size: clamp(2.3rem, 11vw, 3.1rem);');
    expect(cssSource).toContain('.legacy-stewardship-story .legacy-stewardship-story-cta.service-native-btn.is-outline {');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-wills {');
    expect(cssSource).toContain('padding-bottom: clamp(3.1rem, 6.2vw, 5.4rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-joy > .ag-panel-rail > h2,');
    expect(cssSource).toContain('letter-spacing: clamp(-0.045em, -0.03vw, -0.02em);');
  });
});
