import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

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
    // Electron 31 = Chromium 126, supports top-level await + ES2022+.
    // Raised from default because curlconverter uses top-level await for its WASM parser.
    target: 'esnext',
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
      alias: {
        '@renderer': resolve(__dirname, 'src')
      }
    },
    plugins: [react()]
  }
});
