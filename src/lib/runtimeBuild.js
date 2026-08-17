// Vite injects this at server startup. It lets the browser proof distinguish
// a current dev bundle from a tab still connected to an older server.
export const RUNTIME_BUILD_ID = String(
  import.meta.env.VITE_AG_RUNTIME_BUILD_ID || 'test-runtime',
);
