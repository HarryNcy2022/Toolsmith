import { css_beautify as beautifyCss } from 'js-beautify';
import { defineBeautifyTool, type BeautifyCtx } from '../components/BeautifyTool';
import { css as cssLang } from '@codemirror/lang-css';

// clean-css lazy-loaded — it references Node fs/url for file rebasing which we
// never use, but bundling it eagerly pulls those externalizations into the
// initial chunk.
// Note: clean-css v5 is CJS where `module.exports = function CleanCSS(...)`.
// Under Vite's ESM interop `(await import('clean-css')).default` is undefined,
// so unwrap with `mod.default ?? mod` to get the constructor.
//
// clean-css also reads Node's `process` global in places that are NOT guarded
// by the rebasing code path:
//   - lib/options/rebase-to.js: `process.cwd()` — called unconditionally in the
//     CleanCSS constructor (lib/clean.js), so every `new CleanCSS(...)` hits it
//     regardless of the `rebase` option.
//   - lib/reader/rewrite-url.js & lib/writer/source-maps.js: `process.platform`
//     at module top-level (runs on first import).
// The renderer sandbox has no real `process` (only `process.env` is shimmed via
// `define` in electron.vite.config.ts), so `process.cwd` is undefined and the
// constructor throws "process.cwd is not a function". Install a minimal polyfill
// before the first import. Idempotent — a real `process` is left untouched.
let minifierMod: any = null;
function ensureProcessShim() {
  const g = globalThis as any;
  const existing = g.process || {};
  if (typeof existing.cwd === 'function' && typeof existing.nextTick === 'function') {
    return;
  }
  g.process = {
    ...existing,
    env: existing.env ?? {},
    platform: existing.platform ?? 'browser',
    cwd: typeof existing.cwd === 'function' ? existing.cwd : () => '/',
    nextTick:
      typeof existing.nextTick === 'function'
        ? existing.nextTick
        : (fn: (...a: unknown[]) => void, ...args: unknown[]) =>
            queueMicrotask(() => fn(...args))
  };
}
async function loadMinifier() {
  if (!minifierMod) {
    ensureProcessShim();
    const mod = await import('clean-css');
    minifierMod = (mod as any).default ?? mod;
  }
  return minifierMod;
}

defineBeautifyTool(
  {
    id: 'css-format',
    name: 'CSS Beautify/Minify',
    category: 'Format',
    keywords: ['css', 'format', 'beautify', 'minify']
  },
  {
    beautify: (s, ctx: BeautifyCtx) =>
      beautifyCss(s, {
        indent_size: ctx.indent === 0 ? 1 : ctx.indent,
        indent_with_tabs: ctx.indent === 0
      }),
    minify: async (s) => {
      const CleanCSS = await loadMinifier();
      const out = await new CleanCSS({ returnPromise: true, level: 2 }).minify(s);
      if (out.errors.length) throw new Error(out.errors.join('; '));
      return out.styles;
    }
  },
  {
    inputPlaceholder: 'body{margin:0;padding:0}',
    extensions: [cssLang()]
  }
);
