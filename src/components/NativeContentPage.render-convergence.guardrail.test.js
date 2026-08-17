import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = readFileSync(path.resolve(__dirname, 'NativeContentPage.jsx'), 'utf8');

describe('NativeContentPage rendered convergence guardrail', () => {
  it('exposes the authoritative block contract in the DOM', () => {
    expect(source).toContain('buildRenderConvergenceBlockContract({');
    expect(source).toContain('renderPresetId: section.presetId || renderBlock.presetId');
    expect(source).toContain('data-render-contract-version={renderContract.version || undefined}');
    expect(source).toContain('data-render-preset-id={renderContract.presetId || undefined}');
    expect(source).toContain('data-render-runtime-class={renderContract.runtimeClassName || undefined}');
  });

  it('exposes both snapshot revision and Vite runtime identity for browser proof', () => {
    expect(source).toContain('data-content-revision={sharedSnapshotUpdatedAt ? String(sharedSnapshotUpdatedAt) : undefined}');
    expect(source).toContain('data-runtime-build-id={RUNTIME_BUILD_ID}');
  });
});
