import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('ContentAdminContext block-only shell guardrail', () => {
  it('keeps block-only page seeding behind the managed-page shell contract', () => {
    const source = readSource('./ContentAdminContext.jsx');

    expect(source).toContain("import { shouldSeedBlocksFromNativePageContent } from '../lib/managedPageShells';");
    expect(source).toContain('const seedFromNativePageContent = shouldSeedBlocksFromNativePageContent(page.path);');
    expect(source).toContain('const nativeContent = seedFromNativePageContent');
    expect(source).toContain('? getNativePageContent(page.path, page.title)');
    expect(source).toContain('const dynamicCtaBlocks = seedFromNativePageContent');
    expect(source).toContain('const dynamicRequestBlocks = seedFromNativePageContent');
    expect(source).toContain('const dynamicTestimonialsBlocks = seedFromNativePageContent');
    expect(source).toContain("      && seedFromNativePageContent");
  });
});
