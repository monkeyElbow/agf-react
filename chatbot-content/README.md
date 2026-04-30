# AGFinancial Chatbot Content Staging

This folder is a local staging area for public-facing AGFinancial website content that may later be approved for retrieval-grounded chatbot use.

## What this folder is

- A reviewable export of public site content already present in this repo.
- A human-approval layer before any retrieval, embeddings, or chatbot grounding work.
- A topic-based package with source traceability back to the current React site files and routes.
- A navigation layer the chatbot can consult first for "where do I find..." questions.

## What this folder is not

- Not the final CMS.
- Not a database.
- Not a retrieval pipeline.
- Not a guarantee that every exported file is approved for chatbot use yet.

## Source selection rules used in this pass

- Preferred structured public content sources over repeated presentation-layer copy.
- Excluded admin-only, dev-only, test-only, commented, and layout boilerplate content.
- Excluded most repeated CTA-only text unless it added meaningful public information.
- Preserved legal, disclosure, and compliance copy when it carried public-facing meaning.
- Added `REVIEW NOTE:` markers where content looks stale, incomplete, or time-sensitive.

## Current canonical sources used

- `src/data/nativePageContent.js`
- `src/data/pageBlocks/homeBlocks.js`
- `src/data/contentBlockBlueprints.js`
- `src/data/siteMap.js`
- `src/pages/RatesPage.jsx`
- `src/data/ratesDefault.js`
- `src/lib/dynamicPageBlocks.js`
- `src/data/formsLibraryLinks.js`

## Navigation layer

- `site-navigation.json` is the chatbot-first route lookup file for public page-finding questions.
- It is sourced from `src/data/siteMap.js`.
- Prefer visible public routes first.
- Use hidden support routes only when the user is clearly asking for an exact calculator, specialty route, or known alias.

## Known limits in this first staging pass

- Full article bodies from `src/data/resourcesArticlesSeed.json` were not fully exported yet. This pass captures the public resources hub, calculator directory, and selected featured summaries first.
- Time-sensitive rates are included as current local defaults with explicit review flags.
- Prospectus and forms pages are represented as public document-library content, but the linked PDFs themselves are not ingested into this folder yet.
- Some deeper service child routes still need a dedicated follow-up extraction pass.

## Review before retrieval use

Reviewers should confirm:

- rates and effective dates
- disclosures and compliance wording
- stale or placeholder copy called out with `REVIEW NOTE:`
- document-library inclusion policy
- whether deeper child-route content should be added before retrieval v1
