import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('careers route review polish guardrail', () => {
  it('keeps negative tracking on the Ready and Work Matters section titles only on the careers route', () => {
    const cssSource = readSource('../styles/service-native.css');

    expect(cssSource).toContain('.native-info-page--careers .careers-native-ready .native-info-section-copy > h2 {');
    expect(cssSource).toContain('.native-info-page--careers .careers-native-matters .native-info-section-copy > h2 {');
    expect(cssSource).toContain('letter-spacing: -0.03em;');
  });

  it('keeps the careers hero emphasis scoped to the shared native hero path with a larger final line', () => {
    const cssSource = readSource('../styles/service-native.css');
    const contentSource = readSource('../data/nativePageContent.js');

    expect(contentSource).toContain("{ title: 'Be part of', className: 'careers-hero-line is-mango' }");
    expect(contentSource).toContain("{ title: 'something', className: 'careers-hero-line is-mango' }");
    expect(contentSource).toContain("className: 'careers-hero-line careers-hero-line--major is-mango'");
    expect(contentSource).toContain("bgTone: 'white'");
    expect(cssSource).toContain('.native-info-page--careers .service-native-hero h1.careers-hero-line--major {');
    expect(cssSource).toContain('transform: scale(1.2);');
  });

  it('keeps the ADP apply link scoped to the careers jobs list action row rather than turning the whole card into a stretched link', () => {
    const rendererSource = readSource('./nativeFunctionalRouteRenderers.jsx');

    expect(rendererSource).toContain('<article key={job.id || job.title} className="careers-native-job">');
    expect(rendererSource).toContain('<div className="service-native-action-row is-centered">');
    expect(rendererSource).toContain('className="service-native-btn is-outline is-tone-atlantean"');
    expect(rendererSource).not.toContain('careers-native-job service-native-card has-stretched-link');
  });
});
