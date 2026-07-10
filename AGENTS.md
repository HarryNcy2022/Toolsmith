# AGENTS.md

Current operating rules for this repository. Keep this file concise and factual.

## Project

Offline developer toolbox built with Electron 31, electron-vite, React 18, TypeScript, Vite 5, Tailwind 3, CodeMirror 6, and Zustand.

TypeScript projects:

- `tsconfig.node.json`: Electron main process, preload, and configuration.
- `tsconfig.web.json`: sandboxed renderer under `src/`.

## Renderer boundary

Renderer code is a browser context: `nodeIntegration: false`, `contextIsolation: true`.

Never use `Buffer`, `fs`, `path`, `process`, `require`, or direct Electron imports in `src/`. Use browser APIs:

| Need | Use |
|------|-----|
| UTF-8 | `TextEncoder` / `TextDecoder` |
| Base64 | `btoa` / `atob` with byte conversion |
| Random bytes | `crypto.getRandomValues` |
| UUID | `crypto.randomUUID()` |
| Clipboard text | `window.devutils.readClipboard()` or `navigator.clipboard` |

Native or filesystem functionality must use this path:

1. Add an `ipcMain.handle(...)` handler in `electron/main.ts`.
2. Expose it through `electron/preload.ts`.
3. Type it in `src/global.d.ts`.
4. Call `window.devutils.<method>()` from the renderer.

## Tool architecture

Each tool is a self-registering module:

```ts
registerTool({
  meta: { id, name, category, keywords },
  component: Component
});
```

- IDs are unique kebab-case values.
- Categories must match `ToolCategory` in `src/types.ts`.
- Add a tool by creating `src/tools/<id>.tsx` and importing it from `src/tools/index.ts`.
- Do not edit `registry.ts`, `App.tsx`, or sidebar code merely to register a tool.
- Keep small transforms as named exported functions. Move substantial pure parsing/conversion logic into `src/lib/`.
- Prefer local modules over new abstraction layers when logic has one consumer.

Common UI shapes:

- Bidirectional: follow `src/tools/url-encode.tsx`.
- Plain input→output: use `TransformTool`.
- Beautify/minify: use `BeautifyTool`.
- Async transform: follow `src/tools/json-to-code.tsx`.

## UI conventions

- Use existing dark Tailwind palette and nearby component patterns.
- Use `IOPanel` for code/text input and output surfaces.
- Use `CodeEditor` with the matching CodeMirror language extension.
- Use `SplitPane` for two-pane layouts.
- Input history is automatically associated through `ActiveToolContext`.
- Keep transform logic outside JSX closures so it remains testable.

## Heavy dependencies

These must remain dynamically imported inside their tools:

| Dependency | Tool |
|------------|------|
| `curlconverter` | cURL→Code |
| `quicktype-core` / `web-tree-sitter` | JSON→Code |
| `sass` | SCSS Formatter |
| `terser` | JavaScript minify |
| Prettier standalone/plugins | JavaScript beautify |
| `html-minifier-terser` | HTML minify |
| `clean-css` | CSS minify |

Cache lazy imports at module scope. Do not move them to static top-level imports.

## Current compatibility notes

- Renderer build target is `esnext` because `curlconverter` uses top-level `await` for WASM.
- `sass` must use `import * as sass from 'sass'`.
- `html-minifier-terser.minify` is async; `terser.minify` rejects on parse errors.
- `quicktype-core` target parameters may require the existing narrow `as any` casts.
- Do not add the obsolete `htmltojsx` package; HTML↔JSX conversion is local.
- `cron-parser` v5 uses `CronExpressionParser.parse()`.
- Type shims for packages without declarations live in `src/module-shims.d.ts`.
- CSP is defined in `index.html`; add only the specific `blob:` source required by a new feature.
- Package output must remain `../dev-utils-release/` to avoid file-watcher locks.

## Project map

```text
electron/        Main process, preload, IPC
src/
  tools/         Tool components and registration
  components/    Shared UI and layouts
  lib/           Registry, pure transforms, detection, shared state
  types.ts       Tool metadata and categories
  global.d.ts    Preload bridge typing
  App.tsx        Application shell
```

## Documentation hygiene

- Markdown files describe current behavior and active decisions only.
- Do not store completed-item history, implementation diaries, dated status logs, or old plans in Markdown.
- When work is completed, remove it from backlog documents instead of marking it done permanently.
- Git history is the source for historical review.
- Do not duplicate roadmap details across `README.md`, `AGENTS.md`, `IMPROVEMENTS.md`, and `TOOL_PRIORITY.md`.
- `README.md` is user-facing; `AGENTS.md` contains operating rules; `IMPROVEMENTS.md` contains active improvements; `TOOL_PRIORITY.md` contains pending tools.

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run dist
npm run dist:win
npm run dist:mac
npm run dist:linux
```

Do not run builds, tests, formatters, or linters unless requested.

## Backlog

- Existing-tool and global work: [`IMPROVEMENTS.md`](./IMPROVEMENTS.md)
- New tools under consideration: [`TOOL_PRIORITY.md`](./TOOL_PRIORITY.md)
