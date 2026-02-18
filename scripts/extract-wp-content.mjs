import fs from 'node:fs';
import path from 'node:path';
import { sitePages } from '../src/data/siteMap.js';

const ROOT = process.cwd();
const WP_ROOT = path.join(ROOT, 'dev-notes', 'WP-pages');
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'wpContent.js');

const pathSet = new Set(sitePages.map((p) => p.path));

function normalizeWpPath(input) {
  if (!input) return null;
  let pathname = input;
  try {
    const asUrl = new URL(input);
    pathname = asUrl.pathname;
  } catch {
    pathname = input;
  }

  pathname = pathname
    .replace(/^\/wordpress\/index\.php/, '')
    .replace(/^\/+/, '/')
    .replace(/\/+$/, '');

  if (!pathname) return '/';
  return pathname;
}

function mapWpUrlToRoute(url) {
  const normalized = normalizeWpPath(url);
  if (!normalized) return null;

  const manualMap = {
    '/category/resources': '/resources',
    '/category/resources/church-finance-basics': '/resources',
    '/category/resources/church-loans': '/resources',
    '/category/resources/church-risk-management': '/resources',
    '/category/resources/insurance': '/resources',
    '/category/resources/investments': '/resources',
    '/category/resources/personal-finance': '/resources',
    '/category/resources/planned-giving': '/resources',
    '/category/resources/retirement': '/resources',
    '/category/resources/tax-end-of-year': '/resources',
    '/services/retirement/403b/403b-individual-enrollment': '/services/retirement/403b/403b-individual-enrollment',
    '/services/retirement/403b-for-groups/403b-group-enrollment': '/services/retirement/403b-for-groups/403b-group-enrollment',
    '/services/insurance/mission-assure/report-a-claim': '/services/insurance/mission-assure/report-a-claim',
  };

  if (manualMap[normalized]) return manualMap[normalized];
  if (pathSet.has(normalized)) return normalized;
  return null;
}

function encodePathSegments(relPath) {
  return relPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function rewriteContentLinks(html, sourceFile) {
  const relDir = path
    .relative(WP_ROOT, path.dirname(sourceFile))
    .split(path.sep)
    .join('/');

  let output = html;

  output = output.replace(/(href|src)=(["'])([^"']+)\2/gi, (full, attr, quote, value) => {
    let next = value;

    if (value.startsWith('./')) {
      const rel = `${relDir}/${value.slice(2)}`;
      next = `/wp-pages/${encodePathSegments(rel)}`;
    } else if (value.startsWith('http://newpublic.agfinancial.org/wordpress/index.php/')) {
      const mapped = mapWpUrlToRoute(value);
      if (mapped) {
        next = mapped;
      } else {
        next = '/';
      }
    } else if (value === 'http://newpublic.agfinancial.org/wordpress/' || value === 'http://newpublic.agfinancial.org/wordpress') {
      next = '/';
    } else if (value.startsWith('http://newpublic.agfinancial.org/wordpress')) {
      next = '/';
    }

    return `${attr}=${quote}${next}${quote}`;
  });

  output = output.replace(/srcset=(["'])([^"']+)\1/gi, (full, quote, value) => {
    const entries = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    const rewritten = entries.map((entry) => {
      const [url, descriptor] = entry.split(/\s+/, 2);
      let nextUrl = url;
      if (url?.startsWith('./')) {
        const rel = `${relDir}/${url.slice(2)}`;
        nextUrl = `/wp-pages/${encodePathSegments(rel)}`;
      }
      return descriptor ? `${nextUrl} ${descriptor}` : nextUrl;
    });
    return `srcset=${quote}${rewritten.join(', ')}${quote}`;
  });

  output = output.replace(/url\((['"]?)\.\/([^'"\)]+)\1\)/gi, (full, quote, relAsset) => {
    const rel = `${relDir}/${relAsset}`;
    return `url('/wp-pages/${encodePathSegments(rel)}')`;
  });

  output = output.replace(/<script[\s\S]*?<\/script>/gi, '');

  return output;
}

function extractMainContent(fileContent) {
  const breadcrumb = fileContent.match(/<nav class="site-breadcrumbs[\s\S]*?<\/nav>/i)?.[0] ?? '';
  const mainMatch = fileContent.match(/<main id="main"[\s\S]*?<\/main>/i);
  if (mainMatch) {
    const merged = `${breadcrumb}${mainMatch[0]}`.replace(/<div class="post-edit[\s\S]*?<\/div>/gi, '');
    return `<section class="wp-main-extract">${merged}</section>`;
  }

  const blogLayoutMatch = fileContent.match(/<div id="content-wrap"[\s\S]*?<\/aside>\s*<\/div>/i);
  if (blogLayoutMatch) {
    return `<section class="single-page-article wpex-clr">${blogLayoutMatch[0]}</section>`;
  }

  const fallbackMatch = fileContent.match(/<div class="single-page-content[\s\S]*?<\/div>\s*<\/article>/i);
  return fallbackMatch ? fallbackMatch[0] : null;
}

function extractInlineCss(fileContent) {
  const styleIds = [
    'wpex-css',
    'core-block-supports-inline-css',
    'block-style-variation-styles-inline-css',
    'wp-block-library-inline-css',
  ];

  const chunks = [];
  for (const id of styleIds) {
    const re = new RegExp(`<style[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/style>`, 'i');
    const match = fileContent.match(re);
    if (match?.[1]) {
      chunks.push(match[1].trim());
    }
  }

  return chunks.join('\n\n');
}

function extractTitle(fileContent, fallback) {
  const h1 = fileContent.match(/<h1 class="page-header-title[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/h1>/i);
  if (h1) {
    return h1[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  const titleTag = fileContent.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleTag) {
    return titleTag[1].replace(/\s*[-–]\s*AGFinancial\s*$/i, '').trim();
  }

  return fallback;
}

const byPath = {};
const missingSources = [];
const noContent = [];

for (const page of sitePages) {
  if (!page.source) continue;

  const sourceFile = path.join(ROOT, page.source);
  if (!fs.existsSync(sourceFile)) {
    missingSources.push({ path: page.path, source: page.source });
    continue;
  }

  const raw = fs.readFileSync(sourceFile, 'utf8');
  const extracted = extractMainContent(raw);
  if (!extracted) {
    noContent.push({ path: page.path, source: page.source });
    continue;
  }

  byPath[page.path] = {
    title: extractTitle(raw, page.title),
    source: page.source,
    html: rewriteContentLinks(extracted, sourceFile),
    css: extractInlineCss(raw),
  };
}

const output = `export const wpContentByPath = ${JSON.stringify(byPath, null, 2)};\n`;
fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

console.log(`Generated ${Object.keys(byPath).length} WP content entries.`);
if (missingSources.length) {
  console.log('Missing source files:');
  missingSources.forEach((m) => console.log(`  ${m.path} -> ${m.source}`));
}
if (noContent.length) {
  console.log('No extractable content for:');
  noContent.forEach((n) => console.log(`  ${n.path} -> ${n.source}`));
}
