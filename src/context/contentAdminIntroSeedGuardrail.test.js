import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

describe('content admin intro seed guardrail', () => {
  it('clears intro action fields before hydrating native intro actions', () => {
    const source = readSource('./ContentAdminContext.jsx');

    expect(source).toContain('function clearIntroActionSettings(settings) {');
    expect(source).toContain("nextSettings.button1Label = '';");
    expect(source).toContain("nextSettings.button1Url = '';");
    expect(source).toContain("nextSettings.button1PageRef = '';");
    expect(source).toContain('nextSettings.button1OpenInNewWindow = false;');
    expect(source).toContain("nextSettings.button2Label = '';");
    expect(source).toContain("nextSettings.button2Url = '';");
    expect(source).toContain("nextSettings.button2PageRef = '';");
    expect(source).toContain('nextSettings.button2OpenInNewWindow = false;');
    expect(source).toContain('const settings = clearIntroActionSettings(defaults);');
  });
});
