export function normalizeRateProductName(text = '') {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/#\s+/g, '#')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeSimple(text = '') {
  return text
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/[().]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeIraLabel(label) {
  return normalizeRateProductName(label).includes('ira');
}

function looksLikeCertificateLabel(label) {
  const s = normalizeRateProductName(label);
  if (!s) return false;
  if (s.includes('ira')) return false;

  return (
    s.includes('aglf')
    || s.includes('series')
    || s.includes('demand')
    || s.includes('fixed')
    || s.includes('year')
  );
}

function buildAdminMaps(draft) {
  const certMap = new Map();
  const iraMap = new Map();

  for (const row of draft?.rates || []) {
    certMap.set(normalizeSimple(row.product), row.id);
  }

  for (const row of draft?.iraRates || []) {
    iraMap.set(normalizeSimple(row.product), row.id);
  }

  return { certMap, iraMap };
}

function buildAliasMaps(draft) {
  const certAliasToId = new Map();
  const iraAliasToId = new Map();

  const addAliases = (map, row) => {
    const base = normalizeRateProductName(row.product);
    const variants = new Set([
      base,
      base.replace(/-/g, ' '),
      base.replace(/\bfixed ira\b/g, 'ira'),
      base.replace(/\bira\b/g, ' ira'),
      base.replace(/\bseries ([a-z])\b/g, 'series $1'),
    ]);

    [...variants].forEach((v) => {
      variants.add(v.replace(/(\d)-year/g, '$1 year'));
      variants.add(v.replace(/(\d) year/g, '$1-year'));
      variants.add(v.replace(/(\d+)-day/g, '$1 day'));
      variants.add(v.replace(/(\d+) day/g, '$1-day'));
    });

    for (const v of variants) {
      map.set(normalizeRateProductName(v), row.id);
    }
  };

  for (const row of draft?.rates || []) addAliases(certAliasToId, row);
  for (const row of draft?.iraRates || []) addAliases(iraAliasToId, row);

  return { certAliasToId, iraAliasToId };
}

function certificateLabelToAdminShort(label = '') {
  const s = normalizeSimple(label);

  if (s.includes('30-day') && s.includes('demand')) return 'demand';
  if (s.includes('3-month')) return '3-month';
  if (s.includes('6-month')) return '6-month';
  if (s.includes('1-year')) return '1-year';
  if (s.includes('2-year')) return '2-year';
  if (s.includes('3-year')) return '3-year';
  if (s.includes('4-year')) return '4-year';
  if (s.includes('5-year')) return '5-year';

  return null;
}

function iraLabelToAdminShort(label = '') {
  const s = normalizeSimple(label);

  if (s.includes('30-day') && s.includes('demand') && s.includes('ira')) return 'demand';
  if (s.includes('1-year') && s.includes('fixed') && s.includes('ira')) return '1-year fixed';
  if (s.includes('3-year') && s.includes('fixed') && s.includes('ira')) return '3-year fixed';
  if (s.includes('5-year') && s.includes('fixed') && s.includes('ira')) return '5-year fixed';
  if (s.includes('5-year') && (s.includes('adjustable') || s.includes('adj')) && s.includes('ira')) {
    return '5-year adj';
  }

  return null;
}

function classifySectionFromLabel(label) {
  if (looksLikeIraLabel(label)) return 'ira';
  if (looksLikeCertificateLabel(label)) return 'certificates';
  return null;
}

function matchLabelToAdminId(label, maps) {
  const normalizedLabel = normalizeRateProductName(label);

  if (looksLikeIraLabel(label)) {
    const shortKey = iraLabelToAdminShort(label);
    if (shortKey) {
      const direct = maps.iraMap.get(normalizeSimple(shortKey));
      if (direct) return direct;
    }
    return maps.iraAliasToId.get(normalizedLabel) || null;
  }

  if (looksLikeCertificateLabel(label)) {
    const shortKey = certificateLabelToAdminShort(label);
    if (shortKey) {
      const direct = maps.certMap.get(normalizeSimple(shortKey));
      if (direct) return direct;
    }
    return maps.certAliasToId.get(normalizedLabel) || null;
  }

  return null;
}

export function splitCertificateValues(values = []) {
  const tokens = values.filter(Boolean);

  if (tokens.length >= 4) {
    return {
      standardRate: tokens[0] ?? '',
      standardApy: tokens[1] ?? '',
      premiumRate: tokens[2] ?? '',
      premiumApy: tokens[3] ?? '',
      valueCount: tokens.length,
    };
  }

  if (tokens.length === 2) {
    return {
      standardRate: tokens[0] ?? '',
      standardApy: tokens[1] ?? '',
      premiumRate: 'N/A',
      premiumApy: 'N/A',
      valueCount: tokens.length,
    };
  }

  return {
    standardRate: '',
    standardApy: '',
    premiumRate: '',
    premiumApy: '',
    valueCount: tokens.length,
  };
}

export function applyParsedRowsToImportReport(parsedRows, draft, report) {
  const { certMap, iraMap } = buildAdminMaps(draft);
  const { certAliasToId, iraAliasToId } = buildAliasMaps(draft);
  const maps = { certMap, iraMap, certAliasToId, iraAliasToId };

  const matchedCertIds = new Set(report.certificates.map((r) => r.matchedId));
  const matchedIraIds = new Set(report.ira.map((r) => r.matchedId));

  for (const pr of parsedRows) {
    const label = pr.label?.trim();
    const values = pr.values || [];
    if (!label || values.length < 2) continue;

    const section = classifySectionFromLabel(label);
    if (!section) {
      report.unmatchedPdfRows.push({
        section: 'unknown',
        label,
        values,
        raw: pr.raw,
        reason: 'label did not match certificate/IRA patterns',
      });
      continue;
    }

    const matchedId = matchLabelToAdminId(label, maps);
    if (!matchedId) {
      report.unmatchedPdfRows.push({
        section,
        label,
        values,
        raw: pr.raw,
        reason: 'no matching admin row',
      });
      continue;
    }

    if (section === 'ira') {
      if (matchedIraIds.has(matchedId)) {
        report.warnings.push(`Duplicate IRA match for "${label}"`);
        continue;
      }

      const [rate, apy] = values;
      if (!rate || !apy) {
        report.warnings.push(`Incomplete IRA row for "${label}"`);
        continue;
      }

      report.ira.push({
        matchedId,
        parsedProduct: label,
        rate,
        apy,
        confidence: pr.source === 'combined' ? 1 : 0.95,
        source: pr.source,
      });
      matchedIraIds.add(matchedId);
      continue;
    }

    if (matchedCertIds.has(matchedId)) {
      report.warnings.push(`Duplicate certificate match for "${label}"`);
      continue;
    }

    const mapped = splitCertificateValues(values);
    if (!mapped.standardRate || !mapped.standardApy) {
      report.warnings.push(`Incomplete certificate row for "${label}"`);
      continue;
    }
    if (mapped.valueCount < 4) {
      report.warnings.push(`Certificate row "${label}" has ${mapped.valueCount} values (expected 4).`);
    }

    report.certificates.push({
      matchedId,
      parsedProduct: label,
      standardRate: mapped.standardRate,
      standardApy: mapped.standardApy,
      premiumRate: mapped.premiumRate,
      premiumApy: mapped.premiumApy,
      confidence: pr.source === 'combined' ? 1 : 0.95,
      source: pr.source,
    });
    matchedCertIds.add(matchedId);
  }

  return report;
}

export function finalizeImportReportMissingRows(draft, report) {
  report.missingCertificateRows = [];
  report.missingIraRows = [];

  const matchedCertIds = new Set((report.certificates || []).map((r) => r.matchedId));
  const matchedIraIds = new Set((report.ira || []).map((r) => r.matchedId));

  for (const row of draft?.rates || []) {
    if (!matchedCertIds.has(row.id)) report.missingCertificateRows.push(row.product);
  }
  for (const row of draft?.iraRates || []) {
    if (!matchedIraIds.has(row.id)) report.missingIraRows.push(row.product);
  }

  return report;
}

export function extractSpecialRateMetaFromParsedRows(parsedRows = [], report = null) {
  const meta = {};

  for (const row of parsedRows) {
    const label = String(row?.label || '');
    const normalized = normalizeRateProductName(label);
    if (!normalized) continue;

    const is403bMbaFund = normalized.includes('mba')
      && normalized.includes('income fund')
      && (normalized.includes('403b') || normalized.includes('select 403b'));

    if (!is403bMbaFund) continue;

    const values = Array.isArray(row.values) ? row.values.filter(Boolean) : [];
    if (values.length < 2) {
      if (report) report.warnings.push(`Incomplete 403(b) MBA Income Fund row for "${label}"`);
      continue;
    }

    meta.retirement403bMbaRate = values[0];
    meta.retirement403bMbaApy = values[1];
    meta.retirement403bMbaLabel = label;
  }

  return meta;
}
