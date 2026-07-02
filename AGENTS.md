# AGENTS.md

Operating manual for AI agents (and humans) working on this codebase. Read before editing.

## What this is

A cross-platform Electron rewrite of [DevUtils.app](https://devutils.com/) — an offline developer toolbox. v3 ships 35 tools (19 T1 + 2 T2 + 14 T3) plus global features (command palette, clipboard smart-detect, global hotkey, input history) and installer packaging. Roadmap and priorities live in [`TOOL_PRIORITY.md`](./TOOL_PRIORITY.md).

## Tech stack (quick)

Electron 31 · electron-vite · React 18 · TypeScript · Vite 5 · Tailwind 3 · CodeMirror 6 · Zustand. Two TypeScript projects: `tsconfig.node.json` (main+preload+config) and `tsconfig.web.json` (renderer). `npm run typecheck` runs both.

## Critical rules

### 1. Renderer is a browser context — no Node globals

`nodeIntegration: false` + `contextIsolation: true`. Code in `src/**` runs in a sandboxed browser. **Never use `Buffer`, `fs`, `path`, `process`, `require`** in the renderer — Vite/TS will let it build (unresolved global typed via `@types/node`) but it throws at runtime.

Use Web APIs instead:

| Need | Don't | Do |
|------|-------|----|
| UTF-8 base64 | `Buffer.from(s).toString('base64')` | `btoa(String.fromCharCode(...new TextEncoder().encode(s)))` |
| Base64 decode | `Buffer.from(b64,'base64').toString()` | `new TextDecoder().decode(Uint8Array.from(atob(b64), c=>c.charCodeAt(0)))` |
| Random bytes | `crypto.randomBytes` | `crypto.getRandomValues` |
| UUID | `crypto.randomUUID()` ✓ | (already a Web API) |
| Read clipboard | Electron `clipboard` (Node) | `window.devutils.readClipboard()` via preload bridge, OR `navigator.clipboard.readText()` |
| File I/O | `fs` | add IPC handler in `main.ts`, expose via `preload.ts` |

### 2. Calling Node/Electron APIs from the renderer = IPC + preload bridge

The renderer cannot import Electron directly. The pattern (see existing `toggle-window`, `read-clipboard`):

1. **`electron/main.ts`** — register an `ipcMain.handle('namespace:action', handler)`.
2. **`electron/preload.ts`** — `contextBridge.exposeInMainWorld('devutils', { action: () => ipcRenderer.invoke('namespace:action') })`.
3. **`src/global.d.ts`** — declare the typed shape on `Window['devutils']`.
4. **Renderer** — call `window.devutils.action()`.

This is the **only** sanctioned way to reach Node/native APIs. Never add `require('electron')` to `src/`.

### 3. Every tool is a self-registering module

A tool file must, at module top-level, call:

```ts
registerTool({
  meta: { id, name, category, keywords },
  component: Component
});
```

`id` must be kebab-case and unique. `category` must be one of the `ToolCategory` union values in [`src/types.ts`](src/types.ts) — the sidebar groups and orders by these.

### 4. Adding a tool = two files, no routing

1. Create `src/tools/<id>.tsx`. Pick the right template for the tool's shape:
   - Bidirectional (encode↔decode, yaml↔json): copy [`src/tools/url-encode.tsx`](src/tools/url-encode.tsx).
   - Single-input-multi-output: copy [`src/tools/hash.tsx`](src/tools/hash.tsx).
   - Async transform (e.g. `quicktype`, `curlconverter`): copy [`src/tools/json-to-code.tsx`](src/tools/json-to-code.tsx) — `useEffect`-driven async flow with `busy`/`error` state.
   - **Beautify/minify with a toggle**: use the [`BeautifyTool`](src/components/BeautifyTool.tsx) helper — pass `beautify` + optional `minify` fns (sync or `Promise<string>`).
   - Plain input→output: use the [`TransformTool`](src/components/TransformTool.tsx) helper.
2. Add `import './<id>';` to [`src/tools/index.ts`](src/tools/index.ts).

Do **not** edit `registry.ts`, `App.tsx`, or the sidebar to add a tool.

### 5. Heavy libs must be lazy-loaded

These libs are large and must be imported via **dynamic `import()`** inside their tool components, never at module top-level:

| Lib | Size | Tool |
|-----|------|------|
| `curlconverter` | ~7MB + WASM | cURL→Code |
| `quicktype-core` + `web-tree-sitter` | ~5MB | JSON→Code |
| `sass` | ~5.8MB (native bindings) | SCSS Formatter |
| `terser` | ~1MB | JS Formatter (minify) |
| `prettier/standalone` + babel/estree | ~620KB | JS Formatter (beautify) |
| `html-minifier-terser` | ~160KB | HTML Formatter (minify) |
| `clean-css` | ~80KB | CSS Formatter (minify) |

Pattern: declare a module-level `let mod = null`, an `async function load()` that imports + caches it, and call `load()` inside the transform fn. See [`scss-format.tsx`](src/tools/scss-format.tsx) or [`css-format.tsx`](src/tools/css-format.tsx) for the canonical shape. This keeps the **initial bundle at ~920KB** and isolates libs that need a higher build target (top-level await, WASM, native bindings).

### 6. Keep tool logic pure and unit-testable

Tool logic should be plain functions (e.g. `enc(s)`, `hash(input, algo)`), not inline JSX closures. The UI calls them inside `useMemo` (sync) or `useEffect` (async). This keeps transforms testable in isolation. Extract the transform into a named export.

### 7. UI conventions

- Dark theme, Tailwind classes throughout. Palette: `neutral-*` background, `blue-600` accent, `emerald`/`red` for diff/add/remove, `yellow-300` for matches.
- Every input/output surface uses [`IOPanel`](src/components/IOPanel.tsx) — it gives you the header, copy button, paste/clear actions, **input-history dropdown** (auto-wired via [`ActiveToolContext`](src/lib/active-tool.tsx)), and error footer for free.
- Bidirectional tools (encode/decode, yaml↔json): a toggle button pair at top, label the two panels based on direction.
- Code/text I/O: use [`CodeEditor`](src/components/CodeEditor.tsx) with the right language extension (`json()`, `sql()`, `yaml()`, `html()`).
- New tool input is auto-tracked for history — no manual wiring needed. The active tool id is provided via `ActiveToolContext` set in `App.tsx`.

## Project layout

```
electron/        main process + preload + IPC handlers
src/
  tools/         one .tsx per tool, self-registers
  components/    IOPanel, CodeEditor, CopyButton, Sidebar,
                 CommandPalette, TransformTool, ToolList
  lib/           registry.ts, smart-detect.ts, history.ts,
                 active-tool.tsx
  types.ts       ToolCategory union, ToolMeta, Tool
  global.d.ts    Window['devutils'] typing
  App.tsx        shell (sidebar + palette + header)
  main.tsx       entry
```

## Global features (where things live)

| Feature | Location |
|---------|----------|
| Command palette (⌘K) | [`src/components/CommandPalette.tsx`](src/components/CommandPalette.tsx) + key handler in `App.tsx` |
| Clipboard smart-detect | [`src/lib/smart-detect.ts`](src/lib/smart-detect.ts) — pure `detectTool(text)` fn, rule list; called from header "Detect" button |
| Global hotkey (Cmd/Ctrl+Shift+D) | `electron/main.ts` via `globalShortcut`; toggles window show/hide |
| Input history | [`src/lib/history.ts`](src/lib/history.ts) — Zustand store, persisted to `localStorage`; surfaced in IOPanel header |
| Window/clipboard IPC | `electron/main.ts` (handlers) + `electron/preload.ts` (bridge) + `src/global.d.ts` (types) |

## Build commands

```bash
npm install
npm run dev          # Electron + Vite HMR (needs a display)
npm run build        # production → out/ (main + preload + renderer)
npm run typecheck    # both tsconfigs
npm run dist         # build + package installer for current OS
npm run dist:win     # Windows NSIS (.exe)
npm run dist:mac     # macOS (.dmg + .zip)
npm run dist:linux   # Linux (.AppImage + .deb)
```

Known: `npm run dev` logs `network_service` / `gpu_process` errors in headless/CI sandboxes — harmless on a real desktop.

### Packaging output location

electron-builder writes to **`../dev-utils-release/`** (sibling dir, configured in `package.json` `build.directories.output`). It is deliberately **outside** the project so editor/IDE file watchers (VS Code et al.) don't lock extracted files mid-build, which causes `EBUSY`/`EPERM` on the `default_app.asar` rename. Do not move it back inside the project tree.

## Roadmap & priorities

Priority ordering of all 47 DevUtils tools (and which are done) is in [`TOOL_PRIORITY.md`](./TOOL_PRIORITY.md). When asked to add tools, consult that file's UF/EZ ratings and the tier derivation rules before picking. Don't re-derive priorities yourself — edit the file.

## Open follow-ups (not yet implemented)

- [ ] Clipboard smart-detect on window focus (currently button-triggered only)
- [ ] Configurable global hotkey (hardcoded `CmdOrCtrl+Shift+D` for now)
- [ ] History clear / settings UI
- [x] T3 tools (formatters, previews, QR, cron) — **done in v3**
- [ ] T4 tools (PHP, cert, ERB…)
- [ ] App icon (`build/icon.png`) — currently uses default Electron icon
- [ ] Code signing for distribution (mac notarization, win authenticode)

## Dependency notes (gotchas hit during v1/v2/v3)

- `json2csv` v6 never published stable — use `papaparse`'s `unparse` instead.
- `change-case` v5 dropped `lowerCase`/`upperCase`/`titleCase` — use `noCase().toLower/Upper()` and `capitalCase`/`sentenceCase`.
- `uuidv7` exports `uuidv7` (not `ulid`); the `ulid` package is separate.
- `sql-formatter` has no `dense` minify option — lightweight minify is hand-rolled in [`sql-format.tsx`](src/tools/sql-format.tsx).
- `dayjs` needs explicit `extend()` for `relativeTime`, `weekOfYear`, `timezone`, `utc`.
- `curlconverter` uses **top-level `await`** to load a WASM bash parser. This breaks Vite's default esbuild target. The renderer target is set to `esnext` (`electron.vite.config.ts`) and the lib is **lazy-loaded** so it lands in its own chunk — don't change either without re-testing.
- `quicktype-core`'s `lang` / `jsonInputForTargetLanguage` params are wide string unions; passing a `string` needs `as any` cast (see [`json-to-code.tsx`](src/tools/json-to-code.tsx)). It also pulls `web-tree-sitter` which bundles `fs`/`path` references — these are externalized and harmless for our JSON-sample-only usage.
- `htmltojsx` (npm) is a **dead 2017 package** that imports `react-dom/lib/HTMLDOMPropertyConfig` (deleted in modern React) and breaks the build. We hand-rolled the converter instead in [`html-to-jsx.tsx`](src/tools/html-to-jsx.tsx) — do not re-add the npm dep.
- `sass` is a CJS module with no ESM default export. Use `import * as sass from 'sass'`, not `import sass from 'sass'`. Its native bindings work fine in Electron but bloat the bundle (~5.8MB) — it is lazy-loaded.
- `html-minifier-terser.minify` is **async** (returns `Promise<string>`). The `BeautifyTool` helper handles `string | Promise<string>` results; don't cast it to sync.
- `terser.minify` **rejects** on parse error (does not set `out.error`) — let the promise reject propagate to the helper.
- `cron-parser` v5 exports `CronExpressionParser` as default; the entry method is `.parse()` (not `.parseExpression()`). `.toISOString()` can return `null`.
- `lorem-ipsum`'s option is `units` (plural), not `unit`.
- `xml-formatter`, `html-minifier-terser` ship no `.d.ts` — type shims live in [`src/module-shims.d.ts`](src/module-shims.d.ts).
- electron-builder on Windows can fail with `EBUSY`/`EPERM` on `default_app.asar` if an editor file-watcher locks the output dir. Output is therefore outside the project tree.
- The renderer has a strict **Content Security Policy** set in [`index.html`](index.html) (`default-src 'self'; ... ; img-src 'self' data: blob:`). Any new feature using `blob:` URLs (e.g. `URL.createObjectURL` for image previews — see `qr-code.tsx` Read tab) needs the relevant directive allowlisted here, or the resource is silently blocked. Add `blob:` to the matching `*-src` (currently only `img-src` has it); do **not** loosen `default-src` or `script-src`.
