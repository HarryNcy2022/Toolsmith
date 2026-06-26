# DevUtils

Cross-platform offline developer toolbox. Electron + React + TypeScript + Vite + Tailwind.

Re-implements the daily-driver subset of [DevUtils.app](https://devutils.com/) as a free, local-first, cross-platform desktop app. No accounts, no telemetry, no network calls — everything runs on your machine.

## Quick start

```bash
npm install
npm run dev        # launch Electron app (hot reload)
```

### Other scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start Electron + Vite dev server with HMR |
| `npm run build` | Production build → `out/` (main + preload + renderer) |
| `npm run preview` | Run the production build |
| `npm run typecheck` | TypeScript check (node + web configs) |

> Requires Node 18+ and a desktop environment to render the Electron window. (Headless/CI can `npm run build` but `dev` needs a display.)

## Included tools (v1 — 19 tools)

| Category | Tools |
|----------|-------|
| Format | JSON Format/Validate · SQL Formatter |
| Encode | Base64 · URL Encode/Decode · HTML Entity |
| Decode | JWT Debugger |
| Convert | YAML↔JSON · JSON↔CSV · Number Base · String Case · Color |
| Generate | UUID/ULID (v4·v7·ULID) · Hash (MD5→SHA512·SHA3·RIPEMD160) · Random String |
| Inspect | URL Parser · RegExp Tester · Text Diff · Line Sort/Dedupe |
| Time | Unix Time Converter |

See [`TOOL_PRIORITY.md`](./TOOL_PRIORITY.md) for the full roadmap (47 DevUtils tools ranked by usefulness × ease).

## Architecture

```
dev-utils/
├─ electron/              # main process + preload (sandboxed, context-isolated)
│  ├─ main.ts             # window lifecycle
│  └─ preload.ts          # contextBridge surface (currently empty)
├─ src/                   # renderer (browser context, no Node)
│  ├─ tools/              # one self-registering module per tool
│  │  └─ <id>.tsx         # UI + logic; calls registerTool() at import
│  ├─ components/         # IOPanel, CodeEditor (CodeMirror), Sidebar, etc.
│  ├─ lib/registry.ts     # collects all tools, groups by category
│  ├─ App.tsx             # shell: sidebar + active tool
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

- **Main** (`electron/main.ts`) — creates the `BrowserWindow`, sets security flags (`contextIsolation: true`, `nodeIntegration: false`), loads renderer.
- **Preload** — isolated bridge; currently a no-op, reserved for exposing safe Node APIs to the renderer later (file access, native notifications).
- **Renderer** — pure browser context. Uses Web APIs (`crypto`, `TextEncoder`, `btoa`/`atob`, `URL`, `navigator.clipboard`) instead of Node globals. **Do not use `Buffer`, `fs`, `path`, etc. in `src/`** — they will build but crash at runtime.

### Shared UI

- [`IOPanel`](src/components/IOPanel.tsx) — input/output pane with header, copy button, optional error footer. Most tools are two of these side by side.
- [`CodeEditor`](src/components/CodeEditor.tsx) — CodeMirror 6 wrapper with a dark theme and language extensions.
- [`TransformTool`](src/components/TransformTool.tsx) — helper for the common "single input → single output" shape; pass a pure transform function.

## Tech stack

| Layer | Choice |
|-------|--------|
| Shell | Electron 31 + electron-vite |
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Editor | CodeMirror 6 (`@uiw/react-codemirror`) |
| State | React hooks (Zustand available, unused so far) |
| Crypto/encoding | `crypto-js`, Web Crypto, `jwt-decode` |
| Format/convert | `prettier`, `sql-formatter`, `js-yaml`, `papaparse`, `change-case`, `tinycolor2`, `diff` |

## Security

- `contextIsolation: true`, `nodeIntegration: false`, sandboxed renderer.
- Content-Security-Policy set in `index.html` (no remote scripts/styles).
- All processing is local — no outbound network traffic.

## License

MIT (your project — set as you like).
