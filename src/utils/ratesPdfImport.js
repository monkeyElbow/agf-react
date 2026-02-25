import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  applyParsedRowsToImportReport,
  extractSpecialRateMetaFromParsedRows,
  finalizeImportReportMissingRows,
} from './ratesPdfImportCore';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const EFFECTIVE_DATE_RE = /Rates\s*-\s*Effective\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i;
const VALUE_TOKEN_RE = /(?:\d+\.\d{1,3}%|N\/A)/g;

// Tuning knobs for this PDF family
const Y_LINE_TOLERANCE = 2.5;      // groups text items into the same visual row
const Y_PAIR_TOLERANCE = 8;        // pairs label rows to numeric rows by vertical closeness
const MIN_VALUE_X = 280;           // first numeric rate column in current PDF family starts around x=288
const MAX_LABEL_X = 340;           // labels usually live left of this (with some overlap tolerance)

export function normalizeRateProductName(text = '') {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[–—]/g, '-')              // normalize dash variants
    .replace(/\s*-\s*/g, '-')           // "2 -Year" -> "2-Year"
    .replace(/#\s+/g, '#')              // "# 1" -> "#1"
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isLikelyHeaderOrNoise(text = '') {
  const s = normalizeRateProductName(text);
  if (!s) return true;
  return [
    'certificate rates',
    'non ira certificates',
    'ira certificates',
    'rates-effective',
    'minister’s benefit association',
    'ministers benefit association',
    'effective date',
    'standard',
    'premium',
    'apy',
    'rate',
    'establish',
    'minimum',
    'to establish',
    'minimum to establish',
  ].some((k) => s.includes(k));
}

function groupItemsIntoRows(items, tolerance = Y_LINE_TOLERANCE) {
  // PDF y-axis often goes bottom->top; we just group by proximity first
  const sorted = [...items].sort((a, b) => {
    const dy = b.y - a.y; // top to bottom visually (higher y first in many PDFs)
    if (Math.abs(dy) > tolerance) return dy;
    return a.x - b.x;
  });

  const rows = [];
  for (const item of sorted) {
    let row = rows.find((r) => Math.abs(r.y - item.y) <= tolerance);
    if (!row) {
      row = { y: item.y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }

  return rows
    .map((r) => ({
      y: r.y,
      items: r.items.sort((a, b) => a.x - b.x),
    }))
    .sort((a, b) => b.y - a.y); // visual top -> bottom
}

function rowText(items) {
  return items.map((i) => i.text).join(' ').replace(/\s+/g, ' ').trim();
}

function extractRowsFromPage(textContentItems) {
  const items = (textContentItems || [])
    .map((it) => {
      const t = (it.str || '').trim();
      if (!t) return null;
      const tf = it.transform || [];
      const x = Number(tf[4] || 0);
      const y = Number(tf[5] || 0);
      return { text: t, x, y };
    })
    .filter(Boolean);

  const rows = groupItemsIntoRows(items);

  // Build candidates:
  // - label rows: product-like text on left
  // - value rows: %/N/A tokens on right
  const labelRows = [];
  const valueRows = [];
  const combinedRows = []; // sometimes label+values are actually on same visual row

  for (const r of rows) {
    const leftItems = r.items.filter((i) => i.x <= MAX_LABEL_X);
    const rightItems = r.items.filter((i) => i.x >= MIN_VALUE_X);

    const leftText = rowText(leftItems);
    const rightText = rowText(rightItems);
    const allText = rowText(r.items);

    const allVals = allText.match(VALUE_TOKEN_RE) || [];
    const rightVals = rightText.match(VALUE_TOKEN_RE) || [];

    const cleanedLeft = leftText.replace(VALUE_TOKEN_RE, '').replace(/\s+/g, ' ').trim();
    const cleanedAllBeforeFirstValue = (() => {
      if (!allVals.length) return '';
      const idx = allText.indexOf(allVals[0]);
      return idx > 0 ? allText.slice(0, idx).trim() : '';
    })();

    // Case 1: same row visually contains label + values
    if (allVals.length >= 2 && cleanedAllBeforeFirstValue && !isLikelyHeaderOrNoise(cleanedAllBeforeFirstValue)) {
      combinedRows.push({
        y: r.y,
        label: cleanedAllBeforeFirstValue,
        values: allVals,
        raw: allText,
        source: 'combined',
      });
      continue;
    }

    // Case 2: split rows (label-only and value-only)
    if (cleanedLeft && !isLikelyHeaderOrNoise(cleanedLeft)) {
      // Product-ish label rows are often long-ish and contain words
      if (/[a-zA-Z]/.test(cleanedLeft)) {
        labelRows.push({
          y: r.y,
          label: cleanedLeft,
          raw: allText,
          source: 'label',
        });
      }
    }

    if (rightVals.length >= 2) {
      valueRows.push({
        y: r.y,
        values: rightVals,
        raw: allText,
        source: 'values',
      });
    }
  }

  return { labelRows, valueRows, combinedRows, rows };
}

function nearestValueRow(labelRow, valueRows, usedValueIndexes, tolerance = Y_PAIR_TOLERANCE) {
  let best = null;
  let bestIdx = -1;
  let bestDy = Infinity;

  for (let i = 0; i < valueRows.length; i += 1) {
    if (usedValueIndexes.has(i)) continue;
    const v = valueRows[i];
    const dy = Math.abs(labelRow.y - v.y);
    if (dy <= tolerance && dy < bestDy) {
      best = v;
      bestIdx = i;
      bestDy = dy;
    }
  }

  return best ? { row: best, index: bestIdx, dy: bestDy } : null;
}

function normalizeParsedRowsFromPage(pageData, report) {
  const parsedRows = [];

  // 1) Combined rows (best quality, already paired)
  for (const r of pageData.combinedRows) {
    parsedRows.push({
      y: r.y,
      label: r.label,
      values: r.values,
      raw: r.raw,
      source: r.source,
    });
  }

  // 2) Pair label rows with value rows by nearest y
  const usedValueIndexes = new Set();
  for (const lr of pageData.labelRows) {
    const pair = nearestValueRow(lr, pageData.valueRows, usedValueIndexes);
    if (!pair) continue;

    usedValueIndexes.add(pair.index);
    parsedRows.push({
      y: lr.y,
      label: lr.label,
      values: pair.row.values,
      raw: `${lr.raw} | ${pair.row.raw}`,
      source: 'paired',
      pairDy: pair.dy,
    });
  }

  // 3) Remaining value-only rows become unmatched diagnostics
  pageData.valueRows.forEach((vr, i) => {
    if (!usedValueIndexes.has(i)) {
      report.unmatchedPdfRows.push({
        section: 'unknown',
        label: '',
        values: vr.values,
        raw: vr.raw,
        reason: 'value row had no nearby label row',
      });
    }
  });

  return parsedRows;
}

function parseEffectiveDateFromPage(items) {
  const fullText = (items || []).map((it) => (it.str || '').trim()).join(' ');
  const match = fullText.match(EFFECTIVE_DATE_RE);
  return match ? match[1] : '';
}

export async function parseRatesPdf(file, draft) {
  if (!file) throw new Error('No file provided.');
  if (!draft) throw new Error('Draft state is required for row matching.');

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const report = {
    effectiveDate: '',
    certificates: [],
    ira: [],
    retirement403bMbaRate: '',
    retirement403bMbaApy: '',
    retirement403bMbaLabel: '',
    warnings: [],
    unmatchedPdfRows: [],
    missingCertificateRows: [],
    missingIraRows: [],
  };

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    if (!report.effectiveDate) {
      report.effectiveDate = parseEffectiveDateFromPage(textContent.items) || report.effectiveDate;
    }

    const pageData = extractRowsFromPage(textContent.items);
    const parsedRows = normalizeParsedRowsFromPage(pageData, report);
    const specialMeta = extractSpecialRateMetaFromParsedRows(parsedRows, report);
    if (specialMeta.retirement403bMbaRate) report.retirement403bMbaRate = specialMeta.retirement403bMbaRate;
    if (specialMeta.retirement403bMbaApy) report.retirement403bMbaApy = specialMeta.retirement403bMbaApy;
    if (specialMeta.retirement403bMbaLabel) report.retirement403bMbaLabel = specialMeta.retirement403bMbaLabel;
    applyParsedRowsToImportReport(parsedRows, draft, report);
  }

  finalizeImportReportMissingRows(draft, report);

  if (!report.effectiveDate) {
    report.warnings.push('Effective date not found in PDF.');
  }

  return report;
}
