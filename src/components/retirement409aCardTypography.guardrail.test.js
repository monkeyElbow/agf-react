import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const readSource = (relativePath) => fs.readFileSync(path.resolve(here, relativePath), 'utf8');

describe('retirement 409a card typography guardrails', () => {
  it('keeps Considerations card titles at a readable display scale', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain(
      'font-size: clamp(2rem, 3.4vw, 2.8rem);\n  line-height: 0.98;'
    );
  });
});
