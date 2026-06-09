import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('insurance Mission Assure mobile layout guardrail', () => {
  it('keeps the Mission Assure feature stacked with visible copy and centered media on mobile', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-inner {');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-copy {');
    expect(cssSource).toContain('width: 100%;');
    expect(cssSource).toContain('min-width: 0;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .service-native-dark-feature-media {');
    expect(cssSource).toContain('width: min(220px, 100%);');
    expect(cssSource).toContain('min-height: clamp(220px, 62vw, 280px);');
    expect(cssSource).toContain('justify-self: center;');
    expect(cssSource).toContain('.native-info-page--insurance .insurance-native-mission-assure .native-info-feature-logo {');
    expect(cssSource).toContain('width: min(250px, 84%);');
  });
});
