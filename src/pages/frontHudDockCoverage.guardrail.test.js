import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('Front HUD dock ownership', () => {
  it('keeps one shared desktop dock across every page owner', () => {
    const owners = [
      './HomePage.jsx',
      './ServicesPage.jsx',
      './InvestmentsPage.jsx',
      './LoansPage.jsx',
      './RetirementPage.jsx',
      './RatesPage.jsx',
      '../components/NativeContentPage.jsx',
    ];

    owners.forEach((relativePath) => {
      const source = readSource(relativePath);
      expect(source, relativePath).toContain('<FrontHudDock');
      expect(source, relativePath).not.toContain('className={`admin-front-hud-dock');
      expect(source, relativePath).not.toContain('admin-front-hud-dock-collapse-toggle');
    });
  });

  it('keeps dock chrome and route behavior separated', () => {
    const dockSource = readSource('../components/FrontHudDock.jsx');
    const nativeSource = readSource('../components/NativeContentPage.jsx');

    expect(dockSource).toContain('onPanelOpen?.(panel)');
    expect(dockSource).toContain('onPanelClose?.(panel)');
    expect(dockSource).toContain('admin-front-hud-dock-collapse-toggle');
    expect(dockSource).toContain('admin-front-hud-dock-collapse');
    expect(nativeSource).toContain('showFrontHud && !isMobileFrontHud');
    expect(nativeSource).toContain('closeMobileHudPanel');
  });
});
