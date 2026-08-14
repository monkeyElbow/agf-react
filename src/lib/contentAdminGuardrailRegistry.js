export const CONTENT_ADMIN_GUARDRAILS = Object.freeze([
  {
    id: 'one-running-authority',
    durableRule: 'Only one content-admin authority may own the shared project state.',
    legitimateAdminAction: 'Admins can edit, save, and publish normally when one authority is running.',
    verification: 'authority acquisition and conflict response tests',
  },
  {
    id: 'save-truth',
    durableRule: 'A rejected, partial, timed-out, or blocked save never reports success.',
    legitimateAdminAction: 'The admin keeps local changes and can retry the save.',
    verification: 'draft coordinator, shared freshness, and operator smoke tests',
  },
  {
    id: 'publish-sequencing',
    durableRule: 'Publish flushes local edits, saves the draft, reads the saved revision, publishes that revision, and verifies baseSnapshot.',
    legitimateAdminAction: 'The admin can publish the latest intended block or page edit from either control surface.',
    verification: 'content-admin store and operator publish-flow tests',
  },
  {
    id: 'publish-receipt',
    durableRule: 'Every publish returns route, block scope when applicable, draft revision, published revision, actor, timestamp, and verification result.',
    legitimateAdminAction: 'The admin receives a clear success or failure reason tied to the action taken.',
    verification: 'publish receipt contract tests',
  },
  {
    id: 'no-restart-dependency',
    durableRule: 'Ordinary edits remain correct across saves, publishes, failures, and polling without restarting Vite.',
    legitimateAdminAction: 'The admin can continue working after recoverable authority or network failures.',
    verification: 'shared polling, stale-snapshot, and operator recovery tests',
  },
  {
    id: 'browser-proof',
    durableRule: 'A publish is incomplete until the exact new content appears on the rendered route.',
    legitimateAdminAction: 'The admin can verify the live result from the public-facing route.',
    verification: 'browser smoke gate; tooling remains required in the local environment',
  },
]);

export function getContentAdminGuardrail(id) {
  return CONTENT_ADMIN_GUARDRAILS.find((guardrail) => guardrail.id === id) || null;
}
