#!/usr/bin/env node

const DEFAULT_AUTHORITY_URL = 'http://localhost:5173/__dev/content-admin';

function usage() {
  return [
    'Usage:',
    '  npm run content:update -- --route <path> --block <id> --mode <draft|publish|promote-default>',
    '    --set <field=value> [--set <field=value>] --reason <reason>',
    '',
    'Optional:',
    '  --actor <userId:displayName>',
    '  --authority-url <url>',
  ].join('\n');
}

export function parseArgs(argv = []) {
  const options = {
    set: [],
    authorityUrl: process.env.CONTENT_ADMIN_AUTHORITY_URL || DEFAULT_AUTHORITY_URL,
    actor: {
      userId: process.env.CONTENT_ADMIN_ACTOR_ID || 'content-update-cli',
      displayName: process.env.CONTENT_ADMIN_ACTOR_NAME || 'Content update CLI',
      initials: 'CU',
    },
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = () => argv[++index];
    switch (argument) {
      case '--route': options.route = next(); break;
      case '--block': options.block = next(); break;
      case '--mode': options.mode = next(); break;
      case '--set': options.set.push(next()); break;
      case '--reason': options.reason = next(); break;
      case '--actor': {
        const value = String(next() || '');
        const separator = value.indexOf(':');
        options.actor = {
          ...options.actor,
          userId: separator >= 0 ? value.slice(0, separator) : value,
          displayName: separator >= 0 ? value.slice(separator + 1) : value,
        };
        break;
      }
      case '--authority-url': options.authorityUrl = next(); break;
      case '--help': options.help = true; break;
      default: throw new Error(`Unknown option: ${argument}`);
    }
  }

  if (options.help) {
    return options;
  }
  if (!String(options.route || '').trim() || !String(options.block || '').trim()) {
    throw new Error(`Route and block are required.\n\n${usage()}`);
  }
  if (!['draft', 'publish', 'promote-default'].includes(options.mode)) {
    throw new Error(`Mode must be draft, publish, or promote-default.\n\n${usage()}`);
  }
  if (!options.set.length) {
    throw new Error(`At least one --set field=value is required.\n\n${usage()}`);
  }
  if (!String(options.reason || '').trim()) {
    throw new Error(`A non-empty --reason is required.\n\n${usage()}`);
  }
  return options;
}

function parseValue(rawValue) {
  const value = String(rawValue ?? '');
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function parseFieldChanges(entries = []) {
  const changes = {};
  entries.forEach((entry) => {
    const separator = String(entry || '').indexOf('=');
    if (separator <= 0) {
      throw new Error(`Each --set value must use field=value: ${entry}`);
    }
    const field = String(entry).slice(0, separator).trim();
    if (!field) {
      throw new Error(`Field name cannot be empty: ${entry}`);
    }
    changes[field] = parseValue(String(entry).slice(separator + 1));
  });
  return changes;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function buildNextState(snapshot, route, blockId, fieldChanges) {
  const nextState = clone(snapshot?.state || {});
  const blocks = Array.isArray(nextState.blocksByPath?.[route]) ? nextState.blocksByPath[route] : [];
  const block = blocks.find((entry) => String(entry?.id || '').trim() === blockId);
  if (!block) {
    throw new Error(`Block not found: ${route}#${blockId}`);
  }
  block.settings = { ...(block.settings || {}), ...clone(fieldChanges) };
  return nextState;
}

function assertField(snapshot, route, blockId, field, expected, layer) {
  const block = snapshot?.[layer]?.blocksByPath?.[route]
    ?.find((entry) => String(entry?.id || '').trim() === blockId);
  const actual = block?.settings?.[field];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Verification failed for ${layer} ${route}#${blockId}.${field}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

export async function runMutation(options, fetchImpl = fetch) {
  const authorityUrl = String(options.authorityUrl || DEFAULT_AUTHORITY_URL).replace(/\/$/, '');
  const request = (path, requestOptions = {}) => requestJsonWith(fetchImpl, `${authorityUrl}${path}`, requestOptions);
  const route = String(options.route).trim();
  const blockId = String(options.block).trim();
  const changes = parseFieldChanges(options.set);
  const initial = await request('/state');
  const nextState = buildNextState(initial, route, blockId, changes);
  const actor = clone(options.actor);
  const summary = String(options.reason).trim();

  await request('/save-draft', {
    method: 'POST',
    body: JSON.stringify({ state: nextState, actor, summary }),
  });
  const afterDraft = await request('/state');
  Object.entries(changes).forEach(([field, value]) => assertField(afterDraft, route, blockId, field, value, 'state'));

  let finalSnapshot = afterDraft;
  if (options.mode === 'publish' || options.mode === 'promote-default') {
    await request('/publish-page', {
      method: 'POST',
      body: JSON.stringify({ pathname: route, actor, summary }),
    });
    finalSnapshot = await request('/state');
    Object.entries(changes).forEach(([field, value]) => assertField(finalSnapshot, route, blockId, field, value, 'baseSnapshot'));
  }

  if (options.mode === 'promote-default') {
    await request('/promote-seed', {
      method: 'POST',
      body: JSON.stringify({ actor }),
    });
    finalSnapshot = await request('/state');
  }

  return {
    mode: options.mode,
    route,
    blockId,
    fields: Object.keys(changes),
    snapshot: finalSnapshot,
  };
}

function requestJsonWith(fetchImpl, url, options = {}) {
  return fetchImpl(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  }).then(async (response) => {
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.error || `Authority request failed (${response.status})`);
      error.payload = payload;
      throw error;
    }
    return payload;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      process.exit(0);
    }
    const result = await runMutation(options);
    console.log(JSON.stringify({
      ok: true,
      mode: result.mode,
      route: result.route,
      blockId: result.blockId,
      fields: result.fields,
      authority: result.snapshot.authority,
    }, null, 2));
  } catch (error) {
    console.error(`Content update failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
