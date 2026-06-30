import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import { type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// curlconverter's browser build (dist/src/shell/webParser.js, selected via the
// package `browser` field) hardcodes WASM fetch paths at the server root:
//   locateFile(scriptName) { return "/" + scriptName; }
//   Parser.Language.load("/tree-sitter-bash.wasm");
// In dev this misses `public/` (Vite SPA fallback returns index.html → bad MIME
// / wrong magic word); in the packaged app `base: './'` means absolute `/`
// resolves to the filesystem root under file://. Rewrite both to be rooted at
// `import.meta.env.BASE_URL` so the wasm in `public/` resolves in dev and the
// copied assets resolve relative to index.html in prod.
function curlconverterWasmBase(): Plugin {
  return {
    name: 'curlconverter-wasm-base',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('curlconverter') || !id.includes('webParser')) return null;
      const rewritten = code
        .replace(/"\/"\s*\+\s*scriptName/g, 'import.meta.env.BASE_URL + scriptName')
        .replace(/"\/tree-sitter-bash\.wasm"/g, 'import.meta.env.BASE_URL + "tree-sitter-bash.wasm"');
      return rewritten === code ? null : { code: rewritten, map: null };
    }
  };
}

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'electron/main.ts') }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'electron/preload.ts') }
      }
    }
  },
    renderer: {
    root: '.',
    base: './',
    // html-minifier-terser (via terser/clean-css) references `process.env` which
    // doesn't exist in the renderer sandbox. Replace with an empty object.
    define: {
      'process.env': '{}'
    },
    // Electron 31 = Chromium 126, supports top-level await + ES2022+.
    // Raised from default because curlconverter uses top-level await for its WASM parser.
    esbuild: {
      target: 'esnext'
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext'
      }
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        input: { index: resolve(__dirname, 'index.html') }
      }
    },
    resolve: {
      alias: [
        {
          find: '@renderer',
          replacement: resolve(__dirname, 'src')
        },
        {
          // clean-css v5 is CJS and `require('path')` reaches Vite's externalized
          // Node-builtin stub, which has no `resolve`/`dirname`/`join`/etc. — the
          // CleanCSS constructor + reader call `path.resolve('')` unconditionally
          // for every minify, throwing "path.resolve is not a function" in the
          // renderer sandbox. Point `path` at the browser polyfill instead.
          // (sass / terser / html-minifier-terser bundle their own `path` copy,
          // so this alias effectively only touches clean-css.)
          find: /^path$/,
          replacement: 'path-browserify'
        }
      ]
    },
    plugins: [react(), curlconverterWasmBase()]
  }
});
