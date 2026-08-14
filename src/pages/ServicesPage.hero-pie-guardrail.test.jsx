import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('services hero pie renderer guardrail', () => {
  it('keeps the shared dynamic hero pie builder in the services page path', () => {
    const source = readSource('./ServicesPage.jsx');

    expect(source).toContain("import '../styles/home-native.css';");
    expect(source).toContain("import '../styles/service-native.css';");
    expect(source).toContain('buildDynamicHeroPieFromBlock,');
    expect(source).toContain('DEFAULT_SERVICE_HERO_PIE_SLICES,');
    expect(source).toContain("buildDynamicHeroPieFromBlock(heroPieBlock || {");
    expect(source).toContain("kind: 'hero_pie',");
    expect(source).toContain('const heroPieSlices = heroPieRuntime?.slices || [];');
  });

  it('keeps the services wheel selection model card-driven instead of direct slice navigation', () => {
    const source = readSource('./ServicesPage.jsx');
    const cssSource = readSource('../styles/home-native.css');

    expect(source).toContain('const [heroPieUserInteracted, setHeroPieUserInteracted] = useState(false);');
    expect(source).toContain("const wheelButtonClassName = actionButtonClassName('blue');");
    expect(source).toContain("'--services-pie-active-color': activeSlice.color,");
    expect(source).toContain('data-service-wheel-slice={slice.title}');
    expect(source).toContain('data-service-wheel-card={activeSlice.title}');
    expect(source).toContain('className="services-pie-interactive-shell fade-up"');
    expect(source).not.toContain('className="services-pie-center-copy"');
    expect(source).toContain('<Link to={activeSlice.path} className={wheelButtonClassName} style={activeSliceButtonStyle}>');
    expect(source).toContain('Explore {activeSlice.title}');
    expect(source).toContain('id="services-pie-active-shadow"');
    expect(source).toContain('filterUnits="userSpaceOnUse"');
    expect(source).toContain('className={`services-pie-wedge-shadow');
    expect(source).toContain('filter="url(#services-pie-active-shadow)"');
    expect(cssSource).toContain('.services-pie-wedge-shadow {');
    expect(cssSource).not.toMatch(/\.services-pie-wedge\.is-active\s*\{[^}]*filter:/s);
    expect(cssSource).not.toMatch(/\.services-pie-slice-control\.is-active\s+\.services-pie-wedge\s*\{[^}]*filter:/s);
  });

  it('renders the services overview billboard block through the existing intro shell', () => {
    const source = readSource('./ServicesPage.jsx');

    expect(source).toContain('buildDynamicBillboardFromBlock,');
    expect(source).toContain("block?.id === 'intro'");
    expect(source).toContain("block?.kind === 'billboard'");
    expect(source).toContain('mapServicesBillboardToIntroRuntime');
    expect(source).toContain('className={`services-native-intro');
    expect(source).toContain('className={`service-native-intro-copy');
  });

  it('keeps the services overview bleed container mobile-safe without dropping the desktop full-bleed treatment', () => {
    const cssSource = readSource('../styles/home-native.css');

    expect(cssSource).toContain('.services-native-grid-bleed {');
    expect(cssSource).toContain('width: 100vw;');
    expect(cssSource).toContain('margin-left: calc(50% - 50vw);');
    expect(cssSource).toContain('box-sizing: border-box;');
    expect(cssSource).toContain('@media (max-width: 980px) {');
    expect(cssSource).toContain('.services-native-grid-bleed {\n    width: 100%;');
    expect(cssSource).toContain('max-width: 100%;');
    expect(cssSource).toContain('margin-left: 0;');
    expect(cssSource).toContain('margin-right: 0;');
  });
});
