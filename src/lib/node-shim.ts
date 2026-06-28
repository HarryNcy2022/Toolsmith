// Minimal `process` global for the renderer sandbox.
//
// Some lazy-loaded libs (clean-css, terser, html-minifier-terser) reference
// `process.cwd()`, `process.platform`, `process.env` even when their Node-only
// features (file rebasing, source-map writing) are never exercised. The
// renderer has no `process` (nodeIntegration: false), so any reference throws.
//
// This shim is imported once at app entry (before any tool runs) and installs
// a benign stand-in. The matching `define: { 'process.env': '{}' }` in
// electron.vite.config.ts handles static build-time references; this handles
// runtime ones.
if (typeof (globalThis as unknown as { process?: unknown }).process === 'undefined') {
  (globalThis as unknown as { process: Record<string, unknown> }).process = {
    env: {},
    cwd: () => '/',
    platform: 'browser',
    version: '',
    nextTick: (fn: () => void) => setTimeout(fn, 0)
  };
}
