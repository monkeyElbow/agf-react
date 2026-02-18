const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const wpDir = path.join(projectRoot, 'public', 'wp-content');
const manifestPath = path.join(wpDir, 'manifest.json');
const outputPath = path.join(wpDir, 'search-index.json');

function decodeEntities(value) {
  return value
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlToText(html) {
  if (!html) {
    return '';
  }

  return decodeEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function inferSection(routePath) {
  if (routePath.startsWith('/services/')) {
    return 'Services';
  }
  if (routePath.startsWith('/about-us')) {
    return 'Company';
  }
  if (routePath.startsWith('/resources') || routePath.startsWith('/calculators')) {
    return 'Resources';
  }
  if (routePath.startsWith('/terms') || routePath.startsWith('/privacy') || routePath.startsWith('/accessibility')) {
    return 'Legal';
  }
  return 'Core';
}

const nativeEntries = [
  {
    path: '/',
    title: 'Home',
    section: 'Core',
    text: 'Today investment tomorrow church. Browse loans, retirement, investments, legacy giving, insurance, rates, and contact options. Includes stay in the loop and contact form.',
  },
  {
    path: '/services',
    title: 'Services',
    section: 'Services',
    text: 'Overview of loans, investments, retirement, legacy giving, and insurance. Includes complete financial strategy, what you do matters, service links, and testimonials.',
  },
  {
    path: '/services/loans',
    title: 'Loans',
    section: 'Services',
    text: 'Church loans including permanent, first permanent location, construction, facelift, vision, campus startup, and credit line options. Includes consultant path and calculators.',
  },
  {
    path: '/services/investments',
    title: 'Investments',
    section: 'Services',
    text: 'Demand certificates and term certificates, AGFinancial investment rates, laddering strategy, investor login, testimonials, and church cash reserves resources.',
  },
  {
    path: '/services/retirement',
    title: 'Retirement',
    section: 'Services',
    text: 'AGFinancial 403b retirement plan, IRA options, 409A deferred compensation, rollovers, consultant support, and minister housing allowance resources.',
  },
  {
    path: '/rates',
    title: 'Rates',
    section: 'Core',
    text: 'AGFinancial investment certificate rates and APY table with disclosures and legal disclaimers.',
  },
  {
    path: '/search',
    title: 'Search',
    section: 'Core',
    text: 'Search all pages across services, resources, legal, and company content.',
  },
];

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const byPath = new Map();

  Object.entries(manifest).forEach(([routePath, key]) => {
    const filePath = path.join(wpDir, `${key}.json`);
    if (!fs.existsSync(filePath)) {
      return;
    }

    try {
      const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const text = htmlToText(payload.html || '').slice(0, 12000);
      const title = payload.title || routePath.split('/').filter(Boolean).join(' ') || 'Home';
      const entry = {
        path: routePath,
        title,
        section: inferSection(routePath),
        source: 'wp',
        text,
        excerpt: text.slice(0, 220),
      };
      byPath.set(routePath, entry);
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error.message);
    }
  });

  nativeEntries.forEach((entry) => {
    byPath.set(entry.path, {
      ...entry,
      source: 'native',
      excerpt: entry.text.slice(0, 220),
    });
  });

  const index = {
    generatedAt: new Date().toISOString(),
    entries: Array.from(byPath.values()).sort((a, b) => a.path.localeCompare(b.path)),
  };

  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`Wrote ${index.entries.length} entries to ${path.relative(projectRoot, outputPath)}`);
}

main();
