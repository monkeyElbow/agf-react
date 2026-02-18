import fs from 'node:fs/promises';
import path from 'node:path';
import { wpContentByPath } from '../src/data/wpContent.js';

const outDir = path.resolve('public/wp-content');

function keyForPath(routePath) {
  if (routePath === '/') {
    return 'home';
  }
  return routePath.replace(/^\//, '').replace(/\//g, '__');
}

await fs.mkdir(outDir, { recursive: true });

const manifest = {};
for (const [routePath, payload] of Object.entries(wpContentByPath)) {
  const key = keyForPath(routePath);
  manifest[routePath] = key;
  const outFile = path.join(outDir, `${key}.json`);
  await fs.writeFile(outFile, JSON.stringify(payload));
}

await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Wrote ${Object.keys(manifest).length} wp-content files to ${outDir}`);
