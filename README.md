# DevUtils

Cross-platform offline developer toolbox. Electron + React + TypeScript + Vite + Tailwind.

Re-implements the daily-driver subset of [DevUtils.app](https://devutils.com/) as a free, local-first, cross-platform desktop app. No accounts, no telemetry, no network calls — everything runs on your machine.

## Quick start

```bash
npm install
npm run dev        # launch Electron app (hot reload)
```

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start Electron + Vite dev server with HMR |
| `npm run build` | Production build → `out/` (main + preload + renderer) |
| `npm run typecheck` | TypeScript check (node + web configs) |
| `npm run dist` | Build + package installer for current OS |
| `npm run dist:win` | Build + package Windows NSIS installer |
| `npm run dist:mac` | Build + package macOS `.dmg` + `.zip` |
| `npm run dist:linux` | Build + package Linux `.AppImage` + `.deb` |
| `npm run dist:dir` | Build + unpacked dir (no installer, fast) |

> Requires Node 18+ and a desktop environment to render the Electron window.

### Packaging output

electron-builder outputs to `../dev-utils-release/` (a **sibling directory**, not inside the project). This avoids file-locking conflicts with editor/IDE file watchers (VS Code, etc.) that lock newly-created files during packaging and break the build with `EBUSY`/`EPERM` errors.

```bash
npm run dist:win    # → ../dev-utils-release/DevUtils-0.1.0-x64.exe
```

## Features

### 35 tools

| Category | Tools |
|----------|-------|
| Format | JSON Format/Validate · SQL Formatter · **HTML/CSS/JS/XML/SCSS Beautify+Minify** · **HTML Preview** · **Markdown Preview** |
| Encode | Base64 · URL Encode/Decode · HTML Entity · **Backslash Escape** · **Base64 Image** |
| Decode | JWT Debugger |
| Convert | YAML↔JSON · JSON↔CSV · Number Base · String Case · Color · cURL→Code · JSON→Code · **Hex↔ASCII** · **HTML→JSX** · **QR Code** |
| Generate | UUID/ULID (v4·v7·ULID) · Hash (MD5→SHA512·SHA3·RIPEMD160) · Random String · **Lorem Ipsum** |
| Inspect | URL Parser · RegExp Tester · Text Diff · Line Sort/Dedupe · **Cron Parser** |
| Time | Unix Time Converter |

**Bold** = added in v3 (T3 tools). See the sidebar for the live grouped list.

### Global features

- **⌘K / Ctrl+K command palette** — fuzzy-search and jump to any tool without touching the mouse.
- **Clipboard smart-detect** — click the **Detect** button in the header (or paste into any tool) and the app guesses the right tool from clipboard contents (JWT, URL, JSON, cURL, UUID, epoch, hex color, etc.). See [`src/lib/smart-detect.ts`](src/lib/smart-detect.ts).
- **Global hotkey** — `Cmd/Ctrl+Shift+D` shows/hides the window from anywhere on your desktop. Implemented in the main process via `globalShortcut`.
- **Input history** — every tool remembers its last inputs. Click **History** in any input panel header to recall them. Persisted to `localStorage`, managed via a Zustand store.
- **URL hash routing** — active tool persists in the URL (`#/<tool-id>`), so reload/back works.

See [`TOOL_PRIORITY.md`](./TOOL_PRIORITY.md) for the full roadmap (47 DevUtils tools ranked by usefulness × ease).

## Architecture

```
dev-utils/
├─ electron/              # main process + preload (sandboxed, context-isolated)
│  ├─ main.ts             # window lifecycle, global hotkey, IPC handlers
│  └─ preload.ts          # contextBridge surface (clipboard read, window toggle)
├─ src/                   # renderer (browser context, no Node)
│  ├─ tools/              # one self-registering module per tool
│  │  └─ <id>.tsx         # UI + logic; calls registerTool() at import
│  ├─ components/         # IOPanel, CodeEditor, Sidebar, CommandPalette, etc.
│  ├─ lib/                # registry, smart-detect, history store, active-tool context
│  ├─ App.tsx             # shell: sidebar + active tool + palette
│  └─ main.tsx            # React entry
├─ index.html
└─ electron.vite.config.ts
```

### How a tool is wired in

Every tool is a self-contained module that calls `registerTool({ meta, component })` at import time. The registry groups tools by category and feeds the sidebar. To add a tool you only touch two files:

1. Create `src/tools/<id>.tsx` (copy any existing tool as a template).
2. Add one import line to `src/tools/index.ts`.

No routing changes, no central list edits.

### Process model

- **Main** (`electron/main.ts`) — creates the `BrowserWindow`, sets security flags (`contextIsolation: true`, `nodeIntegration: false`), registers the global hotkey, and handles IPC (`app:toggle-window`, `app:read-clipboard`).
- **Preload** (`electron/preload.ts`) — isolated bridge exposing a typed `window.devutils` API via `contextBridge`.
- **Renderer** — pure browser context. Uses Web APIs (`crypto`, `TextEncoder`, `btoa`/`atob`, `URL`, `navigator.clipboard`) instead of Node globals. **Do not use `Buffer`, `fs`, `path`, etc. in `src/`** — they will build but crash at runtime. To call Node APIs, add an IPC handler in `main.ts` and expose it via `preload.ts`.

### Shared UI

- [`IOPanel`](src/components/IOPanel.tsx) — input/output pane with header, copy button, paste/clear actions, input-history dropdown, and error footer. Most tools are two of these side by side.
- [`CodeEditor`](src/components/CodeEditor.tsx) — CodeMirror 6 wrapper with a dark theme and language extensions.
- [`CommandPalette`](src/components/CommandPalette.tsx) — ⌘K overlay for tool navigation.
- [`TransformTool`](src/components/TransformTool.tsx) — helper for the common "single input → single output" shape; pass a pure transform function.

## Tech stack

| Layer | Choice |
|-------|--------|
| Shell | Electron 31 + electron-vite |
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Editor | CodeMirror 6 (`@uiw/react-codemirror`) |
| State | Zustand (history store, localStorage-persisted) |
| Crypto/encoding | `crypto-js`, Web Crypto, `jwt-decode` |
| Format/convert | `prettier`, `sql-formatter`, `js-yaml`, `papaparse`, `change-case`, `tinycolor2`, `diff`, `curlconverter`, `quicktype-core` |
| Packaging | electron-builder 26 |

### Bundle notes

- Initial renderer bundle ≈ **920KB**. All heavy libs are **lazy-loaded** as separate chunks — only fetched when their tool is opened:
  - `curlconverter` ~7MB (WASM bash parser) — cURL→Code
  - `sass` ~5.8MB (native bindings) — SCSS Formatter
  - `terser`, `prettier/standalone` + babel/estree plugins — JS Formatter
  - `html-minifier-terser`, `clean-css` — HTML/CSS minify
  - `quicktype-core` + `web-tree-sitter` — JSON→Code
- The renderer build target is `esnext` because `curlconverter` uses top-level `await` to load its WASM grammar. Electron 31's Chromium supports this.
- Build warnings about `fs`/`url`/`path` "externalized for browser compatibility" (from `clean-css`, `sass`, `web-tree-sitter`) are **harmless** — those code paths only run for file-based operations we never invoke.

## Security

- `contextIsolation: true`, `nodeIntegration: false`, sandboxed renderer.
- Content-Security-Policy set in `index.html` (no remote scripts/styles).
- All processing is local — no outbound network traffic.

## License

MIT (your project — set as you like).
