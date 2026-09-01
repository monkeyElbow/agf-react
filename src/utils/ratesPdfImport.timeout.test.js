import { describe, expect, it, vi } from 'vitest';

const pdfMocks = vi.hoisted(() => ({
  getDocument: vi.fn(),
  globalWorkerOptions: {},
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  GlobalWorkerOptions: pdfMocks.globalWorkerOptions,
  getDocument: pdfMocks.getDocument,
}));

vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url', () => ({ default: 'mock-worker.js' }));

import {
  parseRatesPdf,
  resolveRatesPdfWorkerUrl,
} from './ratesPdfImport';

describe('parseRatesPdf timeout', () => {
  it('returns the timeout error even when PDF.js cleanup never resolves', async () => {
    pdfMocks.getDocument.mockReturnValue({
      promise: new Promise(() => {}),
      destroy: () => new Promise(() => {}),
    });

    const stages = [];
    await expect(parseRatesPdf(
      { arrayBuffer: async () => new ArrayBuffer(8) },
      { rates: [], iraRates: [], ratesMeta: {} },
      { timeoutMs: 5, onStage: (entry) => stages.push(entry.stage) },
    )).rejects.toThrow('Rates PDF parsing timed out after 1 seconds while initializing PDF.js');
    expect(stages).toEqual(expect.arrayContaining([
      'FILE_ARRAY_BUFFER_COMPLETE',
      'PDFJS_GET_DOCUMENT_STARTED',
      'IMPORT_TIMEOUT',
      'IMPORT_FAILED',
    ]));
  });

  it('reports the complete PDF.js document and page-extraction path', async () => {
    pdfMocks.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({ items: [] }),
        }),
        destroy: () => Promise.resolve(),
      }),
      destroy: () => Promise.resolve(),
    });

    const stages = [];
    await parseRatesPdf(
      { arrayBuffer: async () => new ArrayBuffer(8) },
      { rates: [], iraRates: [], ratesMeta: {} },
      { onStage: (entry) => stages.push(entry.stage) },
    );

    expect(stages).toEqual(expect.arrayContaining([
      'FILE_ARRAY_BUFFER_COMPLETE',
      'PDFJS_GET_DOCUMENT_STARTED',
      'PDFJS_DOCUMENT_LOADED',
      'PAGE_EXTRACTION_STARTED',
      'PAGE_EXTRACTION_COMPLETE',
      'IMPORT_COMPLETE',
    ]));
  });

  it('resolves Vite root-relative worker assets against the browser origin', () => {
    expect(pdfMocks.globalWorkerOptions.workerSrc).toBe('mock-worker.js');
    expect(resolveRatesPdfWorkerUrl({
      assetUrl: '/node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      baseUrl: 'http://localhost:5173/rates',
    })).toBe('http://localhost:5173/node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');
    expect(resolveRatesPdfWorkerUrl({
      assetUrl: '/node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      baseUrl: 'http://10.100.85.112:5173/rates',
    })).toBe('http://10.100.85.112:5173/node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');
  });
});
