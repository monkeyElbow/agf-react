const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const WP_ROOT = path.join(ROOT, 'dev-notes', 'WP-pages');
const PUBLIC_WP_CONTENT = path.join(ROOT, 'public', 'wp-content');

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
  if (!normalized) return '/';

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
  };

  return manualMap[normalized] || normalized;
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

  output = output.replace(/(href|src)=(['"])([^'"]+)\2/gi, (full, attr, quote, value) => {
    let next = value;

    if (value.startsWith('./')) {
      const rel = `${relDir}/${value.slice(2)}`;
      next = `/wp-pages/${encodePathSegments(rel)}`;
    } else if (value.startsWith('http://newpublic.agfinancial.org/wordpress/index.php/')) {
      next = mapWpUrlToRoute(value);
    } else if (value === 'http://newpublic.agfinancial.org/wordpress/' || value === 'http://newpublic.agfinancial.org/wordpress') {
      next = '/';
    } else if (value.startsWith('http://newpublic.agfinancial.org/wordpress')) {
      next = '/';
    }

    return `${attr}=${quote}${next}${quote}`;
  });

  output = output.replace(/srcset=(['"])([^'"]+)\1/gi, (full, quote, value) => {
    const entries = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    const rewritten = entries.map((entry) => {
      const [url, descriptor] = entry.split(/\s+/, 2);
      let nextUrl = url;
      if (url && url.startsWith('./')) {
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
    return `<section class="single-page-article agf-content-shell">${blogLayoutMatch[0]}</section>`;
  }

  const fallbackMatch = fileContent.match(/<div class="single-page-content[\s\S]*?<\/div>\s*<\/article>/i);
  return fallbackMatch ? fallbackMatch[0] : null;
}

function extractInlineCss(fileContent) {
  const styleIds = [
    'core-block-supports-inline-css',
    'block-style-variation-styles-inline-css',
    'wp-block-library-inline-css',
  ];

  const chunks = [];
  for (const id of styleIds) {
    const re = new RegExp(`<style[^>]*id=['\"]${id}['\"][^>]*>([\\s\\S]*?)<\\/style>`, 'i');
    const match = fileContent.match(re);
    if (match && match[1]) {
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

function refreshRoute(routePath) {
  const manifestPath = path.join(PUBLIC_WP_CONTENT, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const key = manifest[routePath];

  if (!key) {
    throw new Error(`Route ${routePath} not found in manifest`);
  }

  const jsonPath = path.join(PUBLIC_WP_CONTENT, `${key}.json`);
  const current = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const sourceFile = path.join(ROOT, current.source);

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }

  const raw = fs.readFileSync(sourceFile, 'utf8');
  const extractedHtml = extractMainContent(raw);

  if (!extractedHtml) {
    throw new Error(`No extractable content from source: ${sourceFile}`);
  }

  const next = {
    title: extractTitle(raw, current.title || routePath),
    source: current.source,
    html: rewriteContentLinks(extractedHtml, sourceFile),
    css: extractInlineCss(raw),
  };

  fs.writeFileSync(jsonPath, JSON.stringify(next));
  console.log(`Updated ${jsonPath}`);
  console.log(`Title: ${next.title}`);
  console.log(`HTML length: ${next.html.length}`);
  console.log(`CSS length: ${next.css.length}`);
}

const routePath = process.argv[2];
if (!routePath) {
  console.error('Usage: node scripts/refresh-wp-route.cjs <route-path>');
  process.exit(1);
}

refreshRoute(routePath);
