import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('planned giving stewardship story layout guardrail', () => {
  it('keeps the premium light-leak background and the centered responsive stewardship layout scoped to the legacy feature', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.legacy-stewardship-story {');
    expect(cssSource).toContain('--legacy-stewardship-final-cta-gap: clamp(1rem, 2vw, 1.45rem);');
    expect(cssSource).toContain('rgba(0, 56, 81, 0.98)');
    expect(cssSource).toContain('linear-gradient(146deg, #036c93 0%, #0899b5 52%, #17b3c7 100%)');
    expect(cssSource).toContain('padding-top: 0;');
    expect(cssSource).toContain('background: var(--legacy-stewardship-surface);');
    expect(cssSource).toContain('.legacy-stewardship-story-frame {');
    expect(cssSource).toContain('width: 100vw;');
    expect(cssSource).toContain('margin-left: calc(50% - 50vw);');
    expect(cssSource).toContain('.legacy-stewardship-story-frame::before,');
    expect(cssSource).toContain('radial-gradient(ellipse 112% 98% at 12% 8%, rgba(0, 56, 81, 0.98) 0%, rgba(0, 56, 81, 0.86) 24%, rgba(0, 56, 81, 0.3) 60%, rgba(0, 56, 81, 0) 86%)');
    expect(cssSource).toContain('radial-gradient(ellipse 72% 62% at 74% 26%, rgba(190, 243, 247, 0.12) 0%, rgba(190, 243, 247, 0.05) 34%, rgba(190, 243, 247, 0) 80%)');
    expect(cssSource).toContain('.legacy-stewardship-story-light-leaks {');
    expect(cssSource).toContain('inset: -8% -8% -4%;');
    expect(cssSource).toContain('.legacy-stewardship-story-light-leak.is-a {');
    expect(cssSource).toContain('.legacy-stewardship-story-light-leak.is-b {');
    expect(cssSource).toContain('.legacy-stewardship-story-light-leak.is-c {');
    expect(cssSource).toContain('.legacy-stewardship-story-first-cue {');
    expect(cssSource).toContain('color: rgba(244, 251, 252, 0.88);');
    expect(cssSource).toContain('.legacy-stewardship-story-first-cue-mark {');
    expect(cssSource).toContain('.legacy-stewardship-story-final-secondary {');
    expect(cssSource).toContain('color: rgba(255, 255, 255, 0.94);');
    expect(cssSource).toContain('rgba(0, 173, 187, 0.24)');
    expect(cssSource).toContain('rgba(23, 179, 199, 0.2)');
    expect(cssSource).toContain('.legacy-stewardship-story-static-beats li {');
    expect(cssSource).toContain('border-top: 0;');
    expect(cssSource).toContain('font-size: clamp(1.55rem, 2.8vw, 2.35rem);');
    expect(cssSource).toContain('align-items: stretch;');
    expect(cssSource).toContain('min-height: 100vh;');
    expect(cssSource).toContain('justify-content: center;');
    expect(cssSource).toContain('gap: clamp(0.7rem, 1.3vw, 1rem);');
    expect(cssSource).toContain('min-height: clamp(14.5rem, 24vw, 18rem);');
    expect(cssSource).toContain('margin-top: clamp(2.8rem, 5.8vw, 4.35rem);');
    expect(cssSource).toContain('@media (max-width: 1099px) {');
    expect(cssSource).toContain('radial-gradient(circle at 16% 14%, rgba(36, 201, 217, 0.22), transparent 34%)');
    expect(cssSource).toContain('gap: clamp(2.15rem, 4.8vw, 3rem);');
    expect(cssSource).toContain('gap: clamp(1.55rem, 3.4vw, 2.2rem);');
    expect(cssSource).toContain('padding: clamp(0.6rem, 1.4vw, 0.95rem) 0;');
    expect(cssSource).toContain('font-size: clamp(1.85rem, 4.6vw, 2.65rem);');
    expect(cssSource).toContain('gap: clamp(1.85rem, 7vw, 2.55rem);');
    expect(cssSource).toContain('gap: clamp(1.35rem, 6vw, 1.95rem);');
    expect(cssSource).toContain('padding: clamp(0.7rem, 2.6vw, 1rem) 0;');
    expect(cssSource).toContain('font-size: clamp(1.75rem, 8.4vw, 2.35rem);');
    expect(cssSource).toContain('font-size: clamp(2.3rem, 11vw, 3.1rem);');
    expect(cssSource).toContain('.legacy-stewardship-story .legacy-stewardship-story-cta.service-native-btn.is-outline {');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-wills {');
    expect(cssSource).toContain('padding-bottom: clamp(3.1rem, 6.2vw, 5.4rem);');
    expect(cssSource).toContain('.native-info-page--legacy-giving .legacy-giving-joy > .ag-panel-rail > h2,');
    expect(cssSource).toContain('letter-spacing: -0.048em;');
  });
});
