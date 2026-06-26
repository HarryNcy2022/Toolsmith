# AGENTS.md

Operating manual for AI agents (and humans) working on this codebase. Read before editing.

## What this is

A cross-platform Electron rewrite of [DevUtils.app](https://devutils.com/) — an offline developer toolbox. v1 ships 19 high-priority tools. Roadmap and priorities live in [`TOOL_PRIORITY.md`](./TOOL_PRIORITY.md).

## Tech stack (quick)

Electron 31 · electron-vite · React 18 · TypeScript · Vite 5 · Tailwind 3 · CodeMirror 6. Two TypeScript projects: `tsconfig.node.json` (main+preload+config) and `tsconfig.web.json` (renderer). `npm run typecheck` runs both.

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
| File I/O | `fs` | expose via preload `contextBridge` (not yet wired) |

### 2. Every tool is a self-registering module

A tool file must, at module top-level, call:

```ts
registerTool({
  meta: { id, name, category, keywords },
  component: Component
});
```

`id` must be kebab-case and unique. `category` must be one of the `ToolCategory` union values in [`src/types.ts`](src/types.ts) — the sidebar groups and orders by these.

### 3. Adding a tool = two files, no routing

1. Create `src/tools/<id>.tsx`. Copy [`src/tools/url-encode.tsx`](src/tools/url-encode.tsx) for bidirectional tools, or [`src/tools/hash.tsx`](src/tools/hash.tsx) for single-input-multi-output. For plain input→output, use the [`TransformTool`](src/components/TransformTool.tsx) helper.
2. Add `import './<id>';` to [`src/tools/index.ts`](src/tools/index.ts).

Do **not** edit `registry.ts`, `App.tsx`, or the sidebar to add a tool.

### 4. Keep logic pure and unit-testable

Tool logic should be plain functions (e.g. `enc(s)`, `hash(input, algo)`), not inline JSX closures. The UI calls them inside `useMemo`. This keeps transforms testable in isolation. When adding a tool, extract the transform into a named export.

### 5. UI conventions

- Dark theme, Tailwind classes throughout. Palette: `neutral-*` background, `blue-600` accent, `emerald`/`red` for diff/add/remove, `yellow-300` for matches.
- Every input/output surface uses [`IOPanel`](src/components/IOPanel.tsx) — it gives you the header, copy button, paste/clear actions, and error footer for free.
- Bidirectional tools (encode/decode, yaml↔json): a toggle button pair at top, label the two panels based on direction.
- Code/text I/O: use [`CodeEditor`](src/components/CodeEditor.tsx) with the right language extension (`json()`, `sql()`, `yaml()`, `html()`).

## Project layout

```
electron/        main process + preload
src/
  tools/         one .tsx per tool, self-registers
  components/    IOPanel, CodeEditor, CopyButton, Sidebar, TransformTool
  lib/registry.ts
  types.ts       ToolCategory union, ToolMeta, Tool
  App.tsx        shell
  main.tsx       entry
```

## Build commands

```bash
npm install
npm run dev          # Electron + Vite HMR (needs a display)
npm run build        # production → out/ (main + preload + renderer)
npm run typecheck    # both tsconfigs
```

Known: `npm run dev` logs `network_service` / `gpu_process` errors in headless/CI sandboxes — harmless on a real desktop.

## Roadmap & priorities

Priority ordering of all 47 DevUtils tools (and which are done) is in [`TOOL_PRIORITY.md`](./TOOL_PRIORITY.md). When asked to add tools, consult that file's UF/EZ ratings and the tier derivation rules before picking. Don't re-derive priorities yourself — edit the file.

## Open follow-ups (not yet implemented)

- [ ] Clipboard smart-detect: auto-pick a tool from clipboard content type
- [ ] Global hotkey to show/hide window
- [ ] Per-tool input history (Zustand is a dependency, currently unused)
- [ ] Command palette (⌘K / Ctrl+K) to jump to tools
- [ ] T2 tools: cURL→Code (`curlconverter`), JSON→Code (`quicktype-core`)
- [ ] Code-split / lazy-load tools — current renderer bundle is ~2.3MB (CodeMirror + crypto + sql-formatter). Split per-tool when more land.
- [ ] electron-builder packaging for installers (.dmg / .exe / .AppImage)
- [ ] Expose safe Node APIs (file open/save) via preload `contextBridge`

## Dependency notes (gotchas hit during v1)

- `json2csv` v6 never published stable — use `papaparse`'s `unparse` instead.
- `change-case` v5 dropped `lowerCase`/`upperCase`/`titleCase` — use `noCase().toLower/Upper()` and `capitalCase`/`sentenceCase`.
- `uuidv7` exports `uuidv7` (not `ulid`); the `ulid` package is separate.
- `sql-formatter` has no `dense` minify option — lightweight minify is hand-rolled in [`sql-format.tsx`](src/tools/sql-format.tsx).
- `dayjs` needs explicit `extend()` for `relativeTime`, `weekOfYear`, `timezone`, `utc`.
