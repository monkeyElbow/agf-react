#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sharedFile = path.resolve(repoRoot, 'dev-data/content-admin-shared.json');
const seedFile = path.resolve(repoRoot, 'dev-data/content-admin-seed-baseline.json');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function stableSerialized(value) {
  return JSON.stringify(value);
}

function assert(condition, message, context = {}) {
  if (condition) {
    return;
  }
  const error = new Error(message);
  error.context = context;
  throw error;
}

function assertValidValidation(label, validation) {
  assert(validation?.ok, `${label} failed storage adapter validation.`, {
    findings: validation?.findings || [],
  });
  assert(Array.isArray(validation.findings) && validation.findings.length === 0, `${label} returned validation findings.`, {
    findings: validation.findings,
  });
}

function assertStateRoundTrip(label, store, validation) {
  const serializedFirstPass = stableSerialized(validation.state);
  const secondValidation = store.validateSnapshot(JSON.parse(serializedFirstPass), {
    label: `${label} second pass`,
  });
  assertValidValidation(`${label} second pass`, secondValidation);
  const serializedSecondPass = stableSerialized(secondValidation.state);
  assert(serializedSecondPass === serializedFirstPass, `${label} did not round-trip to the same supported state shape.`, {
    firstPassLength: serializedFirstPass.length,
    secondPassLength: serializedSecondPass.length,
  });
}

async function loadJsonContentStoreFactory() {
  const server = await createServer({
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    customLogger: {
      info() {},
      warn() {},
      warnOnce() {},
      error() {},
      clearScreen() {},
      hasErrorLogged() {
        return false;
      },
      hasWarned: false,
    },
    optimizeDeps: {
      noDiscovery: true,
      entries: [],
    },
    server: {
      middlewareMode: true,
      hmr: false,
      watch: null,
    },
  });
  try {
    const module = await server.ssrLoadModule('/dev-server/jsonContentStore.js');
    return {
      createJsonContentStore: module.createJsonContentStore,
      close: () => server.close(),
    };
  } catch (error) {
    await server.close();
    throw error;
  }
}

async function main() {
  const { createJsonContentStore, close } = await loadJsonContentStoreFactory();
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'agf-content-admin-roundtrip-'));
  try {
    const tempSharedFile = path.join(tempRoot, 'content-admin-shared.json');
    const sourceSharedText = readFileSync(sharedFile, 'utf8');
    writeFileSync(tempSharedFile, sourceSharedText);

    const store = createJsonContentStore({
      persistenceFile: tempSharedFile,
      backupDir: path.join(tempRoot, 'backups'),
      seedBaselineFile: path.join(tempRoot, 'content-admin-seed-baseline.json'),
    });

    const currentState = store.readCurrentState();
    const publishedState = store.readPublishedSnapshot();
    const currentValidation = store.validateSnapshot(currentState, {
      label: 'shared current state',
    });
    const publishedValidation = store.validateSnapshot(publishedState, {
      label: 'shared published snapshot',
    });

    assertValidValidation('shared current state', currentValidation);
    assertValidValidation('shared published snapshot', publishedValidation);
    assertStateRoundTrip('shared current state', store, currentValidation);
    assertStateRoundTrip('shared published snapshot', store, publishedValidation);

    const seedRecord = readJson(seedFile);
    const seedValidation = store.validateSnapshot(seedRecord.seedState, {
      label: 'seed baseline state',
    });
    assertValidValidation('seed baseline state', seedValidation);
    assertStateRoundTrip('seed baseline state', store, seedValidation);

    const malformedValidation = store.validateSnapshot({
      pageHierarchy: {
        '/broken': {
          path: '/broken',
          title: 'Broken',
        },
      },
      blocksByPath: {
        '/broken': [
          {
            kind: 'content',
            mode: 'dynamic',
            settings: {},
          },
          {
            id: 'bad_settings',
            kind: 'content',
            mode: 'dynamic',
            settings: 'not an object',
          },
        ],
      },
      pathAliases: {},
      collaborationByPath: {},
    }, {
      label: 'malformed dry-run state',
    });
    const malformedCodes = new Set((malformedValidation.findings || []).map((finding) => finding.code));
    assert(!malformedValidation.ok, 'Malformed blocks unexpectedly passed validation.');
    assert(malformedCodes.has('block-id-missing'), 'Malformed block without an id did not return block-id-missing.', {
      findings: malformedValidation.findings,
    });
    assert(malformedCodes.has('block-settings-not-object'), 'Malformed block settings did not return block-settings-not-object.', {
      findings: malformedValidation.findings,
    });

    const afterReadText = readFileSync(tempSharedFile, 'utf8');
    assert(afterReadText === sourceSharedText, 'Dry-run storage validation rewrote the shared JSON file.', {
      beforeLength: sourceSharedText.length,
      afterLength: afterReadText.length,
    });

    console.log('Content admin storage round-trip validation passed.');
    console.log('- shared current state: valid');
    console.log('- shared published snapshot: valid');
    console.log('- seed baseline state: valid');
    console.log('- malformed block validation: failed with clear findings');
    console.log('- dry-run read/validation: no rewrite');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
    await close();
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : 'content-admin-storage-roundtrip-failed');
  if (error?.context) {
    console.error(JSON.stringify(error.context, null, 2));
  }
  process.exitCode = 1;
}
