import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const readSource = (relativePath) => fs.readFileSync(path.resolve(here, relativePath), 'utf8');

describe('retirement IRA card typography guardrails', () => {
  it('keeps Traditional and Roth card titles at the restored display scale', () => {
    const source = readSource('../styles/service-native.css');

    expect(source).toContain(
      'font-size: clamp(2rem, 3.4vw, 3rem);\n  line-height: 1;'
    );
    expect(source).toContain(
      'font-size: clamp(1.2rem, 1.8vw, 1.38rem);\n  line-height: 1.54;'
    );
  });
});
