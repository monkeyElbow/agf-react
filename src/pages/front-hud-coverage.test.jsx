import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contentBlockBlueprintsByPath } from '../data/contentBlockBlueprints';
import { buildHudPanelsFromBlocks } from '../lib/blockHudRegistry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getVisibleDynamicBlockCount(pathname) {
  const seen = new Set();
  return (contentBlockBlueprintsByPath[pathname] || [])
    .filter((block) => (
      block?.mode === 'dynamic'
      && block?.hidden !== true
      && block?.hidden !== 'true'
    ))
    .filter((block) => {
      const blockId = String(block?.id || '').trim();
      if (!blockId || seen.has(blockId)) {
        return false;
      }
      seen.add(blockId);
      return true;
    })
    .length;
}

function readPageSource(relativePagePath) {
  const absolutePath = path.resolve(__dirname, relativePagePath);
  return readFileSync(absolutePath, 'utf8');
}

function readHudPanelsSection(relativePagePath) {
  const source = readPageSource(relativePagePath);
  const startMarker = 'const hudPanels = useMemo(() => {';
  const endMarker = 'const showFrontHud';
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker, startIndex);

  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    throw new Error(`Could not locate hudPanels block in ${relativePagePath}`);
  }

  return source.slice(startIndex, endIndex);
}

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function getSharedHudPanels(pathname) {
  return buildHudPanelsFromBlocks(contentBlockBlueprintsByPath[pathname] || []);
}

describe('custom page front HUD coverage audit', () => {
  [
    { label: 'home', pathname: '/', file: './HomePage.jsx' },
    { label: 'services', pathname: '/services', file: './ServicesPage.jsx' },
    { label: 'investments', pathname: '/services/investments', file: './InvestmentsPage.jsx' },
    { label: 'retirement', pathname: '/services/retirement', file: './RetirementPage.jsx' },
    { label: 'loans', pathname: '/services/loans', file: './LoansPage.jsx' },
  ].forEach(({ label, pathname, file }) => {
    it(`keeps HUD panel declarations aligned with visible dynamic blocks on ${label}`, () => {
      const pageSource = readPageSource(file);
      const expectedBlockCount = getVisibleDynamicBlockCount(pathname);
      const usesSharedHudBuilder = pageSource.includes('buildHudPanelsFromBlocks(');
      const hudPanelsSection = usesSharedHudBuilder ? '' : readHudPanelsSection(file);
      const sharedPanels = usesSharedHudBuilder ? getSharedHudPanels(pathname) : [];
      const declaredPanelCount = usesSharedHudBuilder
        ? sharedPanels.length
        : countMatches(hudPanelsSection, /next\.push\(\{/g);
      const declaredIconCount = usesSharedHudBuilder
        ? sharedPanels.length
        : countMatches(hudPanelsSection, /icon:\s*[A-Za-z0-9_]+/g);
      const uniqueSharedBlockIdCount = usesSharedHudBuilder
        ? new Set(sharedPanels.map((panel) => String(panel?.blockId || '').trim()).filter(Boolean)).size
        : declaredPanelCount;
      const uniqueSharedPanelIdCount = usesSharedHudBuilder
        ? new Set(sharedPanels.map((panel) => String(panel?.id || '').trim()).filter(Boolean)).size
        : declaredPanelCount;

      expect(expectedBlockCount).toBeGreaterThan(0);
      expect(declaredPanelCount).toBe(expectedBlockCount);
      expect(declaredIconCount).toBe(expectedBlockCount);
      expect(uniqueSharedBlockIdCount).toBe(declaredPanelCount);
      expect(uniqueSharedPanelIdCount).toBe(declaredPanelCount);
    });
  });

  it('keeps the Home workflow bar mounted only behind the front HUD toggle', () => {
    const homeSource = readPageSource('./HomePage.jsx');

    expect(homeSource).toContain('const showFrontHud = frontHudEnabled && hudPanels.length > 0;');
    expect(homeSource).toContain('{showFrontHud ? (');
    expect(homeSource).toContain('<FrontHudPageWorkflow pathname="/" reviewHref="/admin/content?page=%2F" placement="bar" />');
  });
});
