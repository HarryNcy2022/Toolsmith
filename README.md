# Toolsmith

Cross-platform, offline developer toolbox built with Electron, React, TypeScript, Vite, and Tailwind.

All processing runs locally. No accounts, telemetry, or remote services.

## Quick start

```bash
npm install
npm run dev
```

Requires Node.js 18+ and a desktop environment.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Electron with Vite HMR |
| `npm run build` | Build main, preload, and renderer into `out/` |
| `npm run typecheck` | Check both TypeScript projects |
| `npm run dist` | Package for the current OS |
| `npm run dist:win` | Build Windows NSIS installer |
| `npm run dist:mac` | Build macOS `.dmg` and `.zip` |
| `npm run dist:linux` | Build Linux `.AppImage` and `.deb` |
| `npm run dist:dir` | Build an unpacked application directory |

Packaging output goes to `../dev-utils-release/` to avoid editor file-locking issues.

## Tools

Toolsmith ships 35 tools:

| Category | Tools |
|----------|-------|
| Format | JSON, SQL, HTML, CSS, JavaScript, XML, SCSS |
| Preview | HTML, Markdown |
| Encode | Base64, URL, HTML Entity, Backslash Escape, Base64 Image |
| Decode | JWT Debugger |
| Convert | YAML↔JSON, JSON↔CSV, Number Base, String Case, Color, cURL→Code, JSON→Code, Hex↔ASCII, HTML↔JSX, QR Code |
| Generate | UUID/ULID, Hash, Random String, Lorem Ipsum |
| Inspect | URL Parser, RegExp Tester, Text Diff, Line Sort/Dedupe, Cron Parser |
| Time | Unix Time Converter |

## Global features

- Cross-tool text search: `⌘F` / `Ctrl+F` — search within any tool's content
- Command palette with clipboard content detection: `⌘K` / `Ctrl+K`
- Global show/hide hotkey: `Cmd/Ctrl+Shift+D`
- Resizable tool panes and sidebar
- Per-tool input history stored locally
- URL-hash navigation for the active tool

## Architecture

```text
electron/        Main process, preload bridge, native IPC
src/
  tools/         Self-registering tool components
  components/    Shared UI and layouts
  lib/           Registry, pure transforms, detection, shared state
  App.tsx        Application shell
```

Renderer code runs with `nodeIntegration: false` and `contextIsolation: true`. Native functionality must pass through IPC and the preload bridge; renderer tools use browser APIs.

Large dependencies such as `curlconverter`, `quicktype-core`, `sass`, `terser`, and Prettier are lazy-loaded by their tools.

## Adding a tool

1. Create `src/tools/<id>.tsx` and call `registerTool(...)` at module scope.
2. Import it from `src/tools/index.ts`.
3. Put substantial pure transformation logic in `src/lib/`.

If the tool renders content into the DOM (e.g. markdown preview, HTML preview),
register a `SearchSource` so `⌘F` search can index the rendered text. See
`src/tools/markdown-preview.tsx` for the pattern. Tools using `IOPanel` for
input/output panes are auto-registered.

No routing or sidebar edits are required.

## Roadmap

- [Improvement backlog](./IMPROVEMENTS.md)
- [Pending tools](./TOOL_PRIORITY.md)
