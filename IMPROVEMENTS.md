# IMPROVEMENTS.md

Roadmap for **improving existing tools** (and the shell/global layer), reviewed against the actual code.
This is the companion to [`TOOL_PRIORITY.md`](./TOOL_PRIORITY.md), which covers *adding new* tools. This file covers *making the ones we already have better*.

Every item below was traced to a real file and line. Where the suggestion is already satisfied, wrong, or needs a new dependency, I say so honestly rather than rubber-stamping it.

> **Status — 2026-07-09:** All **P0** and **P1** items are implemented. The **P2** sweep delivered: G5 (resizable splitter via `react-resizable-panels` + `SplitPane`), G6 (multi-suggest clipboard with ranking + `pendingInput` handoff), QC2 (Swift per-language options JSON→Code), BI1 (output modes), color extras (RGBA/HSLA/HWB/CMYK), UT2 (ISO/RFC input), SC1 (line-by-line mode), HJ2 (JSX→HTML reverse), NB3/NB4 (enter-any-field + custom base), RS1 (advanced per-class char counts), LI2 (more generate types — names/email/url/tweets via faker). **New items added this round:** G7 (command palette arrow key bug), BI2 (paste image from clipboard), UT3 (now button + format samples), SC2 (multi-line input + display layout), plus refinements to G3 (sidebar resizable splitter, thinner), G5 (splitter margin), G6 (clipboard detect redesigned into Ctrl+K). Next focus: **bug fixes + high-value UX tweaks** in priority order below.

---

## How to read this doc

**Priority legend**

| Tag | Meaning | Roughly |
|-----|---------|---------|
| **P0** | Trivial bug fix / quick win | minutes–1 hr, often one line |
| **P1** | High value, small/medium | a few hours; do soon |
| **P2** | Medium feature, clear scope | half-day to a day |
| **P3** | Architectural, large, or needs a new dep | design first |

**Effort** is separate from priority: `S` (small), `M` (medium), `L` (large).

**"My take"** lines use: `agree` / `already done` / `needs dep` / `defer` / `bug`.

---

## Priority summary (all items at a glance)

Sorted by priority, then area.

| # | Area | Item | Effort | Priority | One-line plan |
|---|------|------|--------|----------|----------------|
| 1 | UUID/ULID | Stale-state error on UUID→ULID switch | S | ✅ **P0 done** | `useEffect` on `kind` → `regen()`; `uuid-ulid.tsx` |
| 2 | Number Base | Empty-input false error | S | ✅ **P0 done** | Guard `!valid && !empty`; show placeholder when empty; `number-base.tsx` |
| 3 | Number Base | **>32-bit hex truncation bug** | S | ✅ **P0 done** | `BigInt('0x'+s)` (also fixed octal `0o`); rewrote `parseAny` |
| 4 | Markdown | White-bg/gray-text theme | S | ✅ **P0 done** | Added `.markdown-body` dark CSS in `styles.css`; swapped `bg-white`→`bg-neutral-900` |
| 5 | Markdown | Remove default sample text | S | ✅ **P0 done** | `useState('')`; removed unused `SAMPLE` const |
| 6 | HTML→JSX | Remove default sample text | S | ✅ **P0 done** | `useState('')` |
| 7 | Color | Rename HSV → HSB (HSV) | S | ✅ **P0 done** | Relabeled `Row` |
| 8 | Unix Time | Default to user's local timezone | S | ✅ **P0 done** | `dayjs.tz.guess()` + inject local zone into options |
| 9 | RegExp | Tooltip for flags `g i m s u y` | S | ✅ **P0 done** | `FLAG_HELP` map + `title=` per button |
| 10 | RegExp | Replace-pattern → Output panel (VS Code-style `$1` substitution) | S | ✅ **P0 done** | Writable "Replace" input + full-width Output panel; forces `g` so all highlighted matches are replaced |
| 11 | QR Code | Read QR from clipboard image (+ image preview) | S | ✅ **P0 done** | `navigator.clipboard.read()` → `loadImage`; added "Paste" button; widened `decodeFile` to `Blob` |
| 12 | SQL Format | Indent selector | S/M | ✅ **P1 done** | `tabWidth`+`useTabs` state; Indent select; `sql-format.tsx` |
| 13 | **Formatters ×5** | **Adjustable indent** (central change) | M | ✅ **P1 done** | `BeautifyFns` → `(input, ctx:{indent})`; built-in Indent select in `BeautifyTool` |
| 14 | JSON↔CSV | Adjustable indent (csv→json) | S | ✅ **P1 done** | `indent` state + select into `JSON.stringify`; `json-csv.tsx` |
| 15 | YAML↔JSON | Adjustable indent (both dirs) | S | ✅ **P1 done** | `indent` into `JSON.stringify` + `yaml.dump({indent})`; 2/4 spaces; `yaml-json.tsx` |
| 16 | JSON Format | Sort keys in output | S | ✅ **P1 done** | "Sort keys" checkbox + recursive `sortKeys()`; `json-formatter.tsx` |
| 17 | JSON Format | Auto-repair invalid JSON | M | ✅ **P1 done** | "Auto-repair" checkbox + regex pass; `json-formatter.tsx` |
| 18 | JSON↔CSV | Nested JSON shows `[object Object]` | S/M | ✅ **P1 done** | Recursive dotted-key flattener + checkbox; `json-csv.tsx` |
| 19 | Base64 + URL | Input/output swap button | S | ✅ **P1 done** | Shared `SwapButton` (⇄); `base64.tsx`, `url-encode.tsx` |
| 20 | JWT | Verify HS* signature (incl. missing-sig flag) | M | ✅ **P1 done** | Secret + crypto-js HMAC-SHA; ✅/❌/unsigned badges; `jwt-debugger.tsx` |
| 21 | Lorem | Move copy button out of text area | S | ✅ **P1 done** | CopyButton to "Output" header; `lorem-ipsum.tsx` |
| 22 | JSON→Code | Rename base class | S | ✅ **P1 done** | `topName` state; threaded into `convert`; `json-to-code.tsx` |
| 23 | SQL Format | Full-red error panel | S/M | ✅ **P1 done** | `IOPanel` renders red error body on `readOnly && error` |
| 24 | SQL Format | Auto lower/upper case keywords + identifiers | S | ✅ **P1 done** | `keywordCase` + `identifierCase` selects; `sql-format.tsx` |
| — | — | — | — | — | — |
| **25** | **Global/UX** | **G7 — Command palette arrow keys don't navigate** | **S** | **P0** | Debug + fix keyboard event handling in `CommandPalette.tsx`; candidates: move handler to input prop, use ref for idx |
| **26** | **Global/UX** | **G5 — SplitPane: more margin on left/right of separator** | **S** | **P1** | Add `mx-1` (8px) to the `<Separator>` in `SplitPane.tsx:78-90` for wider grab hit area; keep visual bar slim |
| **27** | **Base64 Image** | **BI2 — Paste image from clipboard** | **S** | **P1** | Replicate QR1 pattern: `navigator.clipboard.read()` → image Blob → `fileToDataUrl()`; add "Paste" button |
| **28** | **Unix Time** | **UT3 — "Now" button + format samples** | **S** | **P1** | Add "Now" button to set input to current epoch; show label always in epoch; add format-sample previews per row |
| 29 | **Global/UX** | G5 — Resizable splitter: migrate remaining ~13 inline tools + 8 grid tools to `&lt;SplitPane&gt;` | M | **P2** | Per-tool migration: swap hardcoded `grid`/`flex` for `&lt;SplitPane orientation="row"&gt;` |
| **30** | **Global** | **G3 — Resizable sidebar with thin splitter** | **M** | **P2** | `&lt;PanelGroup&gt;` + `&lt;PanelResizeHandle&gt;` in `App.tsx`; thinner handle `w-px` → hover `w-1`; collapse button; persisted width |
| **31** | **Global/UX** | **G6 — Clipboard detect redesigned: integrated into Ctrl+K** | **M** | **P2** | Remove header Detect button; on palette open + empty query, read clipboard and show "Detect as &lt;type&gt;" as first row |
| **32** | **String Case** | **SC2 — Multi-line input (&lt;textarea&gt;) + display layout redesign** | **M** | **P2** | Replace `&lt;input&gt;` with `&lt;textarea&gt;`; redesign results from flat list to card grid/accordion for multi-line outputs |
| 33 | JSON→Code | QC2 — Per-language options (Swift init/coding-keys) | M | **P3** | Currently Swift-only with working UI; extend only if users request other languages |
| 34 | **Global** | G2 — Preserve contents when switching tabs | L | **P3** | Per-tool Zustand store or `&lt;KeepAlive&gt;` mounting; design first |
| 35 | **Global** | G1 — Panel orientation toggle (L/R vs U/D) | M/L | **P3** | `orientation` prop across `IOPanel`/`TransformTool`/`BeautifyTool` + ~20 tools |
| 36 | **Global** | G4 — GitHub hosting + CI release + signing | L | **P3** | `repository`/`publish` config, GH Actions, codesign; macOS target configured |
| 37 | JWT | W2 — RS*/ES* verification + alg selector | M/L | **P3** | **Needs dep**: `jose` for asymmetric algorithms |
| 38 | Hash | H1 — MD2 / MD4 outputs | M | **P3** | **Needs dep**: crypto-js 4.x dropped both; add `js-md4` + vendor MD2 |
| 39 | Color | C-color-4 — Enter-any-field bidirectional | M/L | **P2** | Each `Row` editable; `lastEdited` ref prevents loops |
| 40 | Number Base | NB3 — Enter-any-field bidirectional | M/L | **P2** | Each base row editable; same loop-avoidance pattern |
| 41 | Number Base | NB4 — Selectable/custom base (2–36) | S/M | **P2** | "Custom" option + radix input; generalize `parseAny` |
| 42 | Color | C-color-1 — RGBA / HSLA / HWB / CMYK outputs | M | **P2** | RGBA/HSLA via tinycolor; HWB/CMYK hand-rolled |
| 43 | Unix Time | UT2 — Convert from other formats (ISO/RFC) | M | **P2** | Detect non-numeric → `dayjs(str).valueOf()`; customParseFormat |
| 44 | String Case | SC1 — Multi-row (line-by-line) mode | S/M | **P2** | Toggle: `input.split('\n').map(fn).join('\n')`; `string-case.tsx` |
| 45 | HTML↔JSX | HJ2 — Reverse direction (JSX→HTML) | M | **P2** | Direction toggle + `jsxToHtml()` reusing inverted `ATTR_RENAMES` |
| 46 | Random String | RS1 — Advanced per-class character counts | M | **P2** | "Advanced" toggle reveals per-class count inputs |
| 47 | Lorem | LI2 — Extra types (names/email/url/tweets) | M | **P2** | Needs wordlists or `@faker-js/faker`; `lorem-ipsum` lib can't do it |
| 48 | Base64 Image | BI1 — Output modes (raw/data-url/css) | S/M | **P2** | `mode` state transforming `dataUrl`; `base64-image.tsx` |

---

## Global / shell

### G1 — Panel orientation toggle (left/right ↔ up/down)
- **Current state:** Every bidirectional/transform/beautify tool hardcodes a **horizontal** split: `<div className="flex gap-3 flex-1 min-h-0">` (`TransformTool.tsx:43`, `BeautifyTool.tsx:100`). The bare `flex` is `flex-direction:row`. No `orientation` prop exists anywhere. **~20 tool files** also replicate this layout inline rather than routing through the helpers.
- **My take:** `agree`, but it's a **P3** because doing it well touches the shared components *and* every custom-layout tool. Don't do it halfway.
- **Plan:**
  1. Add `orientation?: 'row'|'col'` to `IOPanel` pair wrappers, or — cleaner — a new `<IOGroup orientation>` wrapper component that the helpers use.
  2. Flip the inner `flex` to `flex flex-col` when `col`.
  3. Drive orientation from a global Zustand store (persisted) so it's one toggle for the whole app, not per-tool.
  4. Migrate the ~20 inline-layout tools to the shared wrapper (tech debt that pays off here).
- **Risks:** Vertical layout on short screens needs careful `min-h-0` handling or panels collapse; the bidirectional toggle row + panels need to reflow.
- **Effort:** L · **Priority:** P3

### G2 — Preserve contents when switching tabs
- **Current state:** `App.tsx:60-92` renders exactly one `ActiveComponent`; switching tools **unmounts** the old one and its `useState` (input/output/options) is discarded. The only persistence today is the **input-history** store (`lib/history.ts`, last 10 strings per tool) and the URL hash for active tool id. There is **no general per-tool state store**.
- **My take:** `agree`, high user value, but it's the **single largest architectural change** in this list. Design before coding.
- **Plan (two viable options):**
  - **Option A — Keep-alive mounting:** render every visited tool's component with `display:none` when inactive (React stays mounted, state retained). Pro: zero changes to tool code. Con: all heavy lazy-loaded libs (sass, terser, curlconverter, quicktype) can end up resident if the user browses into those tools; memory cost.
  - **Option B — Per-tool state store:** lift each tool's input/options into a Zustand store keyed by `toolId`, hydrate on mount, write on change. Pro: memory-cheap, survives reloads. Con: touches every tool (or a higher-order wrapper that injects `initialState`/`onChange`). Needs a convention for what counts as "state".
  - **Recommendation:** Option B, scoped to **input + selected options only** (not transient output — that's cheaply recomputed). Wrap the existing helpers (`TransformTool`, `BeautifyTool`) to read/write the store automatically so most tools get it for free; custom tools opt in.
- **Risks:** Tools with on-demand `regen()` (uuid, random-string, lorem) need their generated *results* treated as state too, or they regenerate on return. Decide policy: regenerate vs. restore.
- **Effort:** L · **Priority:** P3

### G3 — Resizable + collapsible sidebar (refined: thinner splitter + collapse)
- **Current state:** `Sidebar.tsx:37` hardcodes `w-60` (240px) with `shrink-0`. `App.tsx:101` lays sidebar + main in a plain `flex`. No resize/collapse/drag code. `react-resizable-panels` is already installed (used by G5's `SplitPane`). However, the `SplitPane` Separator is styled at `w-1.5` (6px) with centered grip dot — too wide/visible for a sidebar handle. The sidebar needs a **thinner, more subtle** separator that doesn't compete with the tool-pane splitter.
- **My take:** `agree` — now simpler since `react-resizable-panels` is already a dep. Use a dedicated **separator for sidebar** that is visually distinct from the main splitter: thinner (`w-1` or `w-px` hover→`w-1`), no grip dot, minimal hover highlight.
- **Plan:**
  1. In `App.tsx`, wrap `<Sidebar/>` and `<main/>` in `<PanelGroup direction="horizontal">` with a `<PanelResizeHandle>`.
  2. Style the sidebar separator: `w-px bg-neutral-800 hover:w-1 hover:bg-blue-600 transition-all` — starts near-invisible, widens on hover for grab affordance.
  3. Persist sidebar width to localStorage (the lib's `autoSaveId`).
  4. Add a collapse button (sets the sidebar panel to min-size or a slim icon rail with tool icons).
  5. The sidebar's `w-60` class becomes obsolete — Panel manages the width; remove the hardcoded width.
- **Risks:** Thinner handle may be hard to discover. The hover-widen animation mitigates this. Icon-rail collapse mode needs a separate `SidebarCollapsed` component.
- **Effort:** M · **Priority:** P2

### G4 — macOS build + GitHub hosting + signing
- **Current state:** macOS is **already configured** — `package.json:31-37` has `mac: { category, target: [dmg, zip] }` and `npm run dist:mac` exists. What's **missing**: no `repository`/`publish` config, no GitHub release workflow, no code signing (`hardenedRuntime`/`identity`/`notarize` all absent), no `build/icon.png` (uses default Electron icon). AGENTS.md `## Open follow-ups` already tracks icon + signing.
- **My take:** the config part of this ask is **already done** — reframe the task as *distribution/release engineering*, which is genuinely P3 effort and partly blocked on having an Apple Developer ID ($99/yr) for notarization and a Windows cert for Authenticode.
- **Plan:**
  1. Add `repository` + `publish: { provider: github, owner, repo }` to `package.json`.
  2. Add `.github/workflows/release.yml` building win+mac+linux on tag push (use `electron-builder`'s `--publish always`).
  3. Add `build/icon.png` (1024×1024) + `build/icon.icns`/`.ico`.
  4. Wire signing env vars (`CSC_LINK`, `APPLE_ID`, etc.) into the workflow; gate mac notarization behind secrets.
- **Risks:** CI signing secrets are the long pole; unsigned builds work but trip macOS Gatekeeper. Cross-compile from one OS has limits (mac builds must run on macOS runners).
- **Effort:** L · **Priority:** P3

### G5 — Resizable draggable splitter between panes
- **Current state:** `react-resizable-panels` is installed. `SplitPane.tsx` wraps `<Panel>` + `<Separator>` and is used by **markdown-preview** and **html-preview** (the first two adopters). The Separator is styled `w-1.5` (6px) with a centered grip dot (`w-0.5 h-8 rounded-full bg-neutral-600`) on `bg-neutral-800` background. The hit area is exactly `w-1.5` — no extra margin/padding outside the visible bar. Many tools still use the old fixed-1:1 patterns (grid or flex) and have not been migrated to `<SplitPane>`:
  - **`grid grid-cols-1 lg:grid-cols-2 gap-3 …`** — 8 visual-preview tools: `markdown-preview.tsx:23`, `html-preview.tsx`, `qr-code.tsx` (Generate:79 + Read:196), `base64-image.tsx:50`, `regexp-tester.tsx:117`, `jwt-debugger.tsx:107`, `text-diff.tsx:51`.
  - **`flex gap-3 flex-1 min-h-0`** — 2 shared components (`TransformTool.tsx:43`, `BeautifyTool.tsx:100`) plus ~13 tools that inline the same markup (`backslash-escape`, `base64`, `cron-parser`, `curl-to-code`, `hex-ascii`, `html-entity`, `json-csv`, `json-formatter`, `json-to-code`, `line-sort`, `sql-format`, `url-encode`, `yaml-json`). Plus 2 `flex gap-3 h-full` (`html-to-jsx`, `url-parser`).
  - All panes are **1:1**; no vertical (top/bottom) layout exists anywhere.
- **My take:** `agree` — real UX win for preview-heavy tools (markdown especially: long docs want a wider preview). Recommend a **shared `<SplitPane>` component** + the **`react-resizable-panels`** lib (~12KB, accessible, persisted sizes via `autoSaveId`). **This is the same lib recommended for the sidebar (G3)** — do both together to amortize the one dependency. Hand-rolling pointer-drag is possible (~80 lines) but you lose persistence + a11y.
- **Plan (phased):**
  1. ~~Add `react-resizable-panels`; introduce a thin `<SplitPane orientation="row|col">` wrapper; apply to **markdown** first (the canonical case). Preserve the responsive stacking below `lg` (the lib supports conditional/collapsed).~~ ✅ **done**
  2. ~~Roll into `TransformTool` + `BeautifyTool` — two edits unlock ~all code-conversion + format tools at once.~~ ✅ **done**
  3. **Separator margin fix:** The current Separator (`SplitPane.tsx:78-90`) has `w-1.5` (6px) with zero padding. Increase the grab area by adding `mx-1` (8px margin left+right) so the invisible hit zone is wider than the visible bar. The grip dot and background bar stay visually slim but the cursor + draggable region extends. Update hover transition accordingly.
  4. Migrate the ~13 inline-layout tools + 8 grid tools incrementally (tech debt; do per-tool as touched). Each migration swaps the fixed `grid`/`flex` layout for `<SplitPane orientation="row" id="tool-id">`.
- **Risks:** Margin on the separator reduces available space for the two panes (16px lost). For narrow tools this may be noticeable — consider `mx-0.5` (4px) as a compromise. `IOPanel`'s child `flex-1` and the grid's responsive `lg:grid-cols-1` stacking are the two behaviors the splitter must consciously replace/preserve — a naive swap breaks mobile and the existing 1:1 default. Vertical (top/bottom) orientation needs careful `min-h-0` handling or panes collapse.
- **Effort:** M · **Priority:** P2

### G6 — Clipboard detect redesigned: integrated into Command Palette  (re-scoped)
- **Current state:** Current G6 implementation is **functional but not what the user wants**:
  - `smart-detect.ts` has scored rules + `detectTools()` returning ranked array ✅
  - `App.tsx:47-64` reads clipboard, shows a suggestion popover when multiple tools match ✅
  - `usePendingInput` Zustand store seeds the chosen tool's input ✅
  - BUT the header "Detect" button + detached popover is a **separate UI from Command Palette** — the user has to click Detect first, then deal with the popover. The mental model is wrong.
  - What the user actually envisions: **the clipboard check happens when you open Ctrl+K**, and if nothing is in the search box, the first row shows a smart suggestion based on clipboard contents.
- **My take:** `agree` — the current implementation works technically but the UX flow is wrong. Redesign as follows.
- **Plan:**
  1. **Remove the standalone "Detect" button** from the header (`App.tsx:109-115`). The clipboard detection becomes a **Command Palette feature only**.
  2. In `CommandPalette.tsx`, when the palette opens (`open = true`):
     - Read clipboard via `window.devutils?.readClipboard()` or `navigator.clipboard.readText()`.
     - If clipboard has content AND the search query is empty (`query.trim() === ''`):
       - Call `detectTools(text)`.
       - If matches found: render a **"Detect clipboard as <type>"** row as the **first item** (before the tool list), styled as a special suggestion (e.g. `text-blue-400` or with a clipboard icon).
       - Below it, show the **top 3–5 matching tools** filtered to only those that accept text input (exclude uuid/random/lorem).
     - If query is non-empty, hide the detect row and show normal search results.
  3. Selecting the detect row → `usePendingInput` handoff + navigate to that tool, same as today.
  4. Selecting a suggested tool → same handoff behavior.
  5. The old suggestion popover in `App.tsx` (lines 127-167) can be removed since the palette replaces it.
- **Risks:** Reading clipboard on palette open adds latency — read async and show a brief "Checking clipboard…" state. Clipboard access may be denied (permission or no `window.devutils`) — silently skip the detect row. The empty-query state currently shows ALL tools; with the detect row, the list below should be filtered to **text-input tools only** (or show favorites/recent). This needs a design decision.
- **Effort:** M · **Priority:** P2

---

## Per-tool improvements

### JSON Format/Validate — `src/tools/json-formatter.tsx`
Custom layout (not `defineBeautifyTool`); local `prettify(input, indent)` / `minify(input)` fns; already has an indent `<select>` and beautify/minify toggle.

#### J1 — Sort keys in output  · S · **P1**
- **Plan:** add a "Sort keys" checkbox; when on, run a recursive `sortKeys(obj)` (sort object keys at every depth, leave arrays ordered) before `JSON.stringify`. Or use a sorted replacer.
- **My take:** `agree`. Standard feature, ~15 lines.

#### J2 — Auto-repair invalid JSON  · M · **P1**
- **Plan:** add an "Auto-repair" checkbox; when on, run a repair pass over `input` before `JSON.parse`: strip trailing commas `/,\s*([}\]])/g`, replace `\bTrue|False|None\b` → `true|false|null`, optionally quote unquoted keys. For robustness consider the `jsonrepair` npm package (~30KB), but regex covers the listed cases.
- **My take:** `agree`. Make it a **separate checkbox**, not always-on — strict validation still matters. Note `NaN`/`Infinity` and single quotes are out of scope unless you add `jsonrepair`.

---

### SQL Formatter — `src/tools/sql-format.tsx`
Custom layout; uses `sql-formatter@15.4.2`; `tabWidth: 2` and `keywordCase: 'upper'` are hardcoded.

#### S1 — Full-red error panel  · S/M · **P1**
- **Current state:** errors land in the `IOPanel` footer (`IOPanel.tsx:111-115` — a thin `text-red-400` on `bg-red-950/40`, one line; output just goes empty). The "right panel full red" the user wants isn't how the panel renders today.
- **Plan:** when `error` is set, render the error message into the Output panel's `value` (or add an `errorMode` to `IOPanel` that fills the body red). This is really a **shared-component** nicety that benefits every erroring tool.
- **My take:** `agree`. Do it in `IOPanel`, not just SQL, so all tools get a better error UX.

#### S2 — Indent selector  · S/M · **P1**
- **Plan:** add a `tabWidth` state + `<select>` (copy `json-formatter.tsx:52-63`'s pattern); feed it into `fmtSQL` options, replacing the hardcoded `tabWidth: 2`.
- **My take:** `agree`. Same shared-component story as the formatters (see **C1**).

#### S3 — Auto lower/upper case keywords + identifiers  · S · **P1**
- **Plan:** `sql-formatter` v15 supports `keywordCase: 'preserve'|'upper'|'lower'` and `identifierCase`. Add two `<select>`s; `keywordCase` is currently hardcoded `'upper'` — just make it variable and add `identifierCase`.
- **My take:** `agree`. Trivial.

---

### Base64 String — `src/tools/base64.tsx`  &  URL Encode/Decode — `src/tools/url-encode.tsx`
Both are custom bidirectional tools (dir state, two IOPanels). Neither has any swap button today.

#### B1 / U1 — Input/output swap  · S · **P1**
- **Current state:** the only way to reverse is the Encode/Decode direction toggle, which keeps the same text in the Input field. No swap/exchange UI exists.
- **Plan:** create one shared `SwapButton` component; on click `setInput(output)` (output is already computed via `useMemo`). Optionally also flip `dir`. Drop it into the Input panel's `actions` slot. `url-encode.tsx` is the canonical bidirectional template to mirror.
- **My take:** `agree`, and build the shared button once so future bidirectional tools reuse it.

---

### JWT Debugger — `src/tools/jwt-debugger.tsx`
Custom single-input→multi-output (Header/Payload/Signature). Uses `jwt-decode@4.0.0` which is **decode-only — it does not verify**. Has its own `b64urlDecode`/`prettyJson` helpers. A 2-part token currently shows `signature = '(unsigned)'`.

#### W1 — Verify signature (incl. missing-signature handling)  · M · **P1**
- **Current state:** no verification at all; missing signature is just labeled `(unsigned)`. HS* verification needs a **secret**, which must come from a user input.
- **Plan:** add a secret input field. For HS256/384/512: recompute HMAC over `header.payload` with `crypto-js` (already a dep — `hmac-sha256` is present) and compare to the decoded signature; show ✅/❌. For a missing/empty signature, clearly flag "unsigned token" and show what the expected signature *would* be given the secret.
- **My take:** `agree` for HS* (no new dep). **Read `alg` from the decoded header** to drive behavior.

#### W2 — Multiple algorithms (HS256 and beyond)  · M/L · **P3**
- **Current state:** `alg` is already decoded into the header JSON — easy to branch on. But `jwt-decode` is decode-only.
- **Plan:** HS* via crypto-js HMAC (now). **RS*/ES* need a public key + a real signature lib** → add `jose` (full alg coverage, well-maintained).
- **My take:** `needs dep`. Do HS* now (P1), defer RS*/ES* to P3 unless asymmetric verification is a real use case for you.

---

### Color Converter — `src/tools/color.tsx`
Custom: one input + read-only `Row` list, using `tinycolor2`. Has a color `<input type="color">` + text input. tinycolor's constructor already parses hex/rgb/hsl/named colors.

#### C-color-1 — RGBA / HSLA / HWB / CMYK outputs  · M · **P2**
- **Plan:** RGBA/HSLA are easy via tinycolor's `toRgb()` (`{r,g,b,a}`) and `toHsl()`, build the `rgba()`/`hsla()` strings. **HWB and CMYK are NOT in tinycolor2** — hand-roll: CMYK from RGB is ~6 lines, HWB ~5 lines.
- **My take:** `agree`, mostly hand-rolled, no dep.

#### C-color-2 — Rename HSV → HSB (HSV)  · S · **P0**
- **Plan:** relabel the `Row` from `"HSV"` to `"HSB (HSV)"`. HSV and HSB are the same color space; tinycolor's `toHsvString()` is correct as-is. **Label-only change.**
- **My take:** `agree`, one line.

#### C-color-3 — Convert from other formats  · (already done) · —
- **Current state:** tinycolor's constructor (`color.tsx` `tinycolor(input)`) already parses hex, rgb(), hsl(), and named CSS colors. The placeholder already advertises this.
- **My take:** `already done`. Only gap: it won't parse `hsv()`/`hwb()`/`cmyk()` *strings* — if that matters, add pre-detection. Low priority.

#### C-color-4 — Enter-any-field, others auto-update  · M/L · **P2**
- **Plan:** redesign each `Row` into an editable `<input>`; lift a canonical `tinycolor` state; on each edit, parse that field's text → tinycolor → re-derive all other fields. Use a `lastEditedField` ref to avoid feedback loops. Same pattern as number-base G.
- **My take:** `agree`, genuinely nicer UX, medium rewrite.

---

### JSON ↔ CSV — `src/tools/json-csv.tsx`
One bidirectional file using `papaparse@5.4.1`. csv→json hardcodes `JSON.stringify(res.data, null, 2)`.

#### JC1 — Nested JSON shows `[object Object]`  · S/M · **P1**
- **Root cause confirmed:** `json-csv.tsx:17` `Papa.unparse(arr)` flattens only top level; nested objects/arrays stringify to `[object Object]`.
- **Plan:** recursive dotted-key flattener before unparse — `{"a":{"b":1}}` → `{"a.b":1}`. ~15 lines. Optionally surface as a "Flatten nested" checkbox.
- **My take:** `agree` — this is a real bug, not just a nice-to-have.

#### JC2 — Adjustable indent (csv→json)  · S · **P1**
- **Plan:** add `indent` state + `<select>` (copy `json-formatter.tsx:52-63`); replace the hardcoded `2`.
- **My take:** `agree`, trivial.

---

### Number Base Converter — `src/tools/number-base.tsx`
Custom: single input + read-only `Row` list, uses `bigint`.

#### NB1 — Remove "Invalid number" error on empty input  · S · **P0**
- **Current state:** `parseAny` returns `null` for empty string (`number-base.tsx:7`), and `valid = n !== null`, so the empty case renders the red error (`number-base.tsx:62-63`).
- **Plan:** track `const empty = input.trim() === ''`; render the rows (or nothing) when empty, the error only when `!valid && !empty`. One guard.
- **My take:** `bug`/`agree`. False error on a fresh tool is a bad first impression.

#### NB2 — **>32-bit hex truncation bug**  · S · **P0**
- **Current state:** `number-base.tsx:13` is `BigInt(parseInt(s, 16))`. `parseInt` truncates to 32-bit *first*, then `BigInt` wraps the already-wrong value. Large hex silently misconverts.
- **Plan:** use `BigInt('0x' + s)` (with sign handling) directly. Verify with e.g. `0xDEADBEEFCAFE` and `0xFFFFFFFFFFFFFFFF`.
- **My take:** `bug` — fix while you're in there for NB1.

#### NB3 — Enter-any-field bidirectional  · M/L · **P2**
- **Plan:** make each base `Row` editable; track the edited field via ref; parse that field → bigint → re-derive the others. Avoid loops with `lastEdited`.
- **My take:** `agree`. Also fix NB2's bigint path properly during this rewrite.

#### NB4 — Selectable/custom base (2–36)  · S/M · **P2**
- **Plan:** add a "Custom" option to the base `<select>` revealing a radix number input; generalize `parseAny` for arbitrary radix (manual digit→value loop for bigint, since `BigInt` has no radix parse).
- **My take:** `agree`, niche but cheap.

---

### String Case — `src/tools/string-case.tsx`
Custom: single `<input>` + read-only `Row` list using `change-case@5.4.0`.

#### SC1 — Multi-row (line-by-line) mode  · S/M · **P2**
- **Plan:** add a "Line-by-line" checkbox; when on, `input.split('\n').map(c.fn).join('\n')` instead of `c.fn(input)`. Since change-case is word-based, behavior only changes when newlines are present, so it's safe behind a toggle.
- **My take:** `agree`. "Maybe one output at a time" from the request — I'd skip that; showing all cases at once is the point of the tool.

#### SC2 — Multi-line input + display layout redesign  · M · **P2**
- **Current state:** `string-case.tsx:47-52` uses a single-line `<input>` element, making it impossible to enter multi-line text directly (user must already have it in clipboard). The results display is a flat vertical list of 12 rows (`string-case.tsx:58-69`), each with label + output + copy. With multi-line inputs, each output row could contain multiple lines of text, making the list very tall and hard to scan.
- **Plan:**
  1. Replace `<input>` with a `<textarea>` (multi-line) at `string-case.tsx:47-52`. Adjust the placeholder.
  2. Redesign the results layout from a flat vertical list to a **compact grid or packed layout** — options:
     - **Option A — Accordion/groups:** group case outputs by category (lowercase group: camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case, dot.case, path.case; uppercase group: Capital Case, Sentence Case, no case, lower case, UPPER CASE) with collapsed/expand headers. Multi-line outputs get a scrollable `<pre>` in each cell.
     - **Option B — Card grid:** wrap results in a `grid grid-cols-2 lg:grid-cols-3 gap-2` where each card shows the label + truncated preview with a "Show all" expand. Multi-line overflow handled in each card.
     - **Option C — Tabbed by case:** one visible output at a time, selected by a row of case-name tabs/buttons. The current 12-row vertical list becomes a single output area. Loses at-a-glance comparison but is the most space-efficient.
  3. All options must keep the CopyButton per output accessible. The `line-by-line` checkbox (SC1) composes with the new layout naturally.
- **My take:** `agree` — the single-line `<input>` is a functional limitation for a string tool. Layout needs thought because 12 rows × multi-line content is unmanageable. **Option B (card grid)** preserves at-a-glance comparison while handling multi-line overflow. Start with the `<textarea>` swap (trivial) then iterate the layout.

---

### YAML ↔ JSON — `src/tools/yaml-json.tsx`
Bidirectional, `js-yaml@4.1.0`. Both directions hardcode indent 2 (`yaml-json.tsx:17,20`).

#### Y1 — Adjustable indent  · S · **P1**
- **Plan:** `indent` state + `<select>`; use it in both `JSON.stringify(obj, null, indent)` and `yaml.dump(obj, { indent, lineWidth: 100 })`.
- **My take:** `agree`, trivial — same pattern as the other indent asks.

---

### Hash Generator — `src/tools/hash.tsx`
Custom: `<textarea>` + read-only `Row` list, uses **`crypto-js@4.2.0`** (not `crypto.subtle`). `ALGOS = ['MD5','SHA1','SHA224','SHA256','SHA384','SHA512','SHA3','RIPEMD160']`.

#### H1 — Add MD2 / MD4  · M · **P3**
- **Important correction:** the tool does **not** use `crypto.subtle`, so the Web-Crypto limitation isn't the blocker. The real blocker: **crypto-js 4.x dropped MD2 and MD4** (they existed in 3.1.2). `CryptoJS.MD2`/`MD4` are undefined in 4.2.0; there's no `md2.js`/`md4.js` in `node_modules/crypto-js/`.
- **Plan options:**
  - (a) `js-md4` (npm, pure JS) for MD4 + **vendor a small pure-JS MD2** (~80 lines; no maintained npm package). Branch in the `hash` switch and extend `ALGOS`.
  - (b) Don't add them — MD2/MD4 are cryptographically broken and rarely needed.
- **My take:** `needs dep` / `defer`. MD2/MD4 are legacy/broken; unless you have a concrete legacy-compat reason, skip. If you do need them, MD4 via `js-md4` + a vendored MD2 is the path.

---

### Random String — `src/tools/random-string.tsx`
Custom, hand-rolled. `randomFrom(charset, len)` with `crypto.getRandomValues`. Settings: charset preset select, custom charset, length, count, Generate.

#### RS1 — Advanced per-class character counts  · M · **P2**
- **Plan:** add an "Advanced" checkbox (off by default) that reveals number inputs for uppercase/lowercase/digit/symbol counts. Extend `regen()` to draw N chars from each class subset then shuffle (Fisher-Yates). Presets already map to class subsets (`PRESETS`), so this composes cleanly.
- **My take:** `agree`. All-local JSX, no helper changes.

---

### UUID/ULID Generator — `src/tools/uuid-ulid.tsx`
Custom. `kind` state, on-demand `regen()`.

#### UU1 — Error when switching UUID → ULID  · S · **P0**
- **Root cause confirmed:** `uuid-ulid.tsx:55-56` computes `decodeInfo = kind === 'ulid' && ids[0] ? decodeUlid(ids[0]) : null`. Switching the `<select>` to ULID changes `kind` **but `ids` still holds the previously-generated UUID string** (no effect regenerates on `kind` change). So `decodeUlid` runs on a UUID, fails the `^[0-9A-HJKMNP-TV-Z]{26}$` regex (`uuid-ulid.tsx:22`) and returns `{error: …}` rendered red (`uuid-ulid.tsx:123-124`).
- **Plan:** add `useEffect(() => { regen(); }, [kind])` so switching kind regenerates. Or guard `decodeInfo` to only decode when the current `ids[0]` was actually produced by ULID mode (track a `lastKind`).
- **My take:** `bug`/`agree`. The `useEffect` fix is cleaner and also fixes the cosmetic "stale UUID shown after picking ULID".

---

### RegExp Tester — `src/tools/regexp-tester.tsx`
Custom, raw textarea (not IOPanel). `highlight()` returns `{html, matches, error}`. Flags are a `Set`, default `{g,i}`. `FLAGS = g i m s u y`.

#### RT1 — Replace-pattern → Output panel (VS Code-style)  · S · ✅ **P0 done**
- **Implemented (revised after feedback):** a writable **"Replace" input** (placeholder `$1, $2, $&, $<name>…`) in the control row, plus a full-width **Output panel** below the test-string/matches grid showing the substituted text. Forces `g` so every highlighted match is replaced (consistent with the Matches panel — replacing only the first when N are highlighted would be confusing). Empty replacement deletes matches (standard JS semantics). `$1`/`$2`/`$&`/`$<name>`/`$$` all work via native `String.replace`. CopyButton on the Output panel.
- **History:** an earlier (misread) P0 attempt added a read-only `/${pattern}/${flags}` *display* field — removed; the user wanted a replace/output feature like VS Code's pattern→replace, not a literal display.

#### RT2 — Tooltip for flags  · S · **P0**
- **Plan:** add a `FLAG_HELP` map (`g`=global, `i`=ignore case, `m`=multiline, `s`=dotAll, `u`=unicode, `y`=sticky) and put `title={FLAG_HELP[f]}` on each flag button (`regexp-tester.tsx:83-95`).
- **My take:** `agree`, one-line-per-button.

---

### Unix Time Converter — `src/tools/unix-time.tsx`
Custom, dayjs. `useState('UTC')` hardcoded; `TZS` is a fixed list. Input parsed purely as a number (`Number(epoch)`).

#### UT1 — Default to user's local timezone  · S · **P0**
- **Plan:** replace `useState('UTC')` (`unix-time.tsx:41`) with `dayjs.tz.guess()` (the timezone plugin is already extended). Optionally add the guessed zone to `TZS` if absent.
- **My take:** `agree`, one-liner.

#### UT2 — Convert from other formats (ISO/RFC)  · M · **P2**
- **Plan:** detect non-numeric input → `dayjs(epoch).valueOf()` → derive ms/s, then feed the existing render path. dayjs parses ISO 8601 by default; for more formats add the `customParseFormat` plugin. Add an input-mode toggle (epoch ↔ date string).
- **My take:** `agree`, localized change.

#### UT3 — "Now" button + format samples  · S · **P1**
- **Current state:** `unix-time.tsx:137` shows a static `"Now: {now}"` label (epoch seconds updated every 1 s via `setInterval`), but there is **no way to set the input to the current time** with one click. The user must manually type/paste the epoch number. `unix-time.tsx:62` initialises with `Math.floor(Date.now()/1000)` so a fresh open gives "now", but switching away and back loses it.
- **Plan:**
  1. Add a **"Now" button** next to the input that sets `setInput(String(now))` — the `now` state already refreshes every second via the `setInterval` at `unix-time.tsx:67-70`.
  2. Below each formatted Row (ISO 8601, UTC, local, etc.), show a **small sample line** previewing what that format looks like for the current "now" value — greyed-out, e.g. `"2024-01-15T10:30:00Z"` under the ISO row. Helps users unfamiliar with each format name see the shape at a glance.
  3. The `"Now: {now}"` label always displays in **epoch seconds format** regardless of the current input mode (epoch/ISO/RFC), so it stays a reliable reference.
- **My take:** `agree` — quick win, high discoverability. The label is already there; the button is ~2 lines of JSX. Sample lines are another ~5 lines of JSX each.

---

### JSON → Code — `src/tools/json-to-code.tsx`
Custom, uses `IOPanel` directly. `convert()` calls `quicktype` with hardcoded `rendererOptions: { 'just-types': 'true' }`. Base name hardcoded `'Root'`.

#### QC1 — Rename base class  · S · **P1**
- **Plan:** add a `topName` state (default `'Root'`); thread it into `convert(input, target, topName)` (`json-to-code.tsx:55`); add to effect deps.
- **My take:** `agree`, trivial.

#### QC2 — Per-language options (Swift initializers, coding-keys, …)  · M · **P3**
- **Confirmed by reading `node_modules/quicktype-core/dist/language/Swift/language.js`:** the Swift renderer defines `initializers` ("Generate initializers and mutators") and `coding-keys` ("Explicit CodingKey values in Codable types") as first-class BooleanOptions — exactly the two examples in the request. Other renderers (CSharp, Java, …) have their own option sets.
- **Plan:** build a per-language options panel (conditional on `target`); set `rendererOptions` accordingly. **Important conflict:** `just-types: true` suppresses initializers/coding-keys — must drop it when those are enabled.
- **My take:** `agree` but **low priority** — currently only Swift has renderer options exposed in the UI (`LANG_OPTIONS` at `json-to-code.tsx:21-26`). CSharp/Java etc. have their own but adding them without demand is over-investment. The Swift options are already implemented. Move to P3 — do only if users request other languages. **Current implementation works for Swift; no further work needed unless a specific language is requested.**

---

### Base64 Image — `src/tools/base64-image.tsx`
Custom, textarea + preview. `handleFile` reads → data URL; `decodeToImage` accepts bare base64 or `data:` URL.

#### BI1 — Output modes (raw / data-url / css)  · S/M · **P2**
- **Plan:** add a `mode` state transforming the data URL for display/copy: `raw` strips the `data:…;base64,` prefix, `data-url` is the full string, `css` wraps as `background-image: url("…")`. Consider separating "source" from "formatted output" so the preview still works.
- **My take:** `agree`.

#### BI2 — Paste image from clipboard  · S · **P1**
- **Current state:** `base64-image.tsx:82-99` has an "Upload" button + file input and drag-drop support (`onDragOver`/`onDrop`). But there is **no paste-from-clipboard** for actual image binary data. The QR Code Read tab (QR1, ✅ done) already has this via `navigator.clipboard.read()` → `image/*` ClipboardItem → Blob → `loadImage` — the exact pattern to replicate here.
- **Plan:** add a "Paste" button alongside "Upload" that calls `navigator.clipboard.read()` (not `readText()`), finds an `image/*` item, reads it as Blob, and feeds `fileToDataUrl()` (already exists at `base64-image.tsx:5-11`). Reuse the same `handleFile()` path since `File` extends `Blob`. The `navigator.clipboard.read()` call for images requires a focused document — same constraint as QR1, acceptable for a desktop Electron app.
- **My take:** `agree` — high user value, small change, proven pattern from QR1.

---

### Lorem Ipsum — `src/tools/lorem-ipsum.tsx`
Custom, on-demand `regen()` via the `lorem-ipsum` lib.

#### LI1 — Move copy button out of text area  · S · **P1**
- **Current state:** the `CopyButton` sits inside the output `<div>` next to the `<pre>` (`lorem-ipsum.tsx:62-67`), not technically a textarea.
- **Plan:** move it into a header bar above the output, mirroring the `IOPanel` actions pattern. Pure JSX restructure.
- **My take:** `agree`, trivial.

#### LI2 — More generate types (names/email/url/tweets)  · M · **P2**
- **Blocker:** the `lorem-ipsum` lib **only** does words/sentences/paragraphs — it cannot produce names/emails/urls/tweets.
- **Plan:** add a `type` select branching in `regen()`. For name/email/url/tweet types use small built-in generators or add `@faker-js/faker`. Names from a wordlist; `email = f.l@domain`; tweets = 1–2 vs 5+ sentences.
- **My take:** `needs dep` (or hand-rolled wordlists). `@faker-js/faker` is the obvious choice but it's a sizeable lib — verify it tree-shakes or lazy-load it.

---

### Beautify / Minify formatters — `html-format`, `css-format`, `js-format`, `scss-format`, `xml-format`
All five use `defineBeautifyTool`.

#### F1 — Adjustable indent (all five)  · M · **P1**
- **Blocker (shared):** `BeautifyTool.tsx` has **no `controls` slot** and passes **no options object** to its fns — `BeautifyFns.beautify: (input) => …` (`BeautifyTool.tsx:16`). The effect closure captures only `fn`/`mode` (deps `[input, mode]`, line 80). So indent can't reach the fns today.
- **Per-lib capability (all accept indent):**
  | Tool | Lib | Knob |
  |------|-----|------|
  | HTML | `js-beautify` `html_beautify` | `indent_size` (number) + `indent_with_tabs` |
  | CSS | `js-beautify` `css_beautify` | `indent_size` (clean-css minify ignores indent — fine) |
  | JS | `prettier` (+ `terser`) | `tabWidth` (number) + `useTabs` |
  | SCSS | `sass` then `css_beautify` | `indent_size` (sass also has `indentType`/`indentWidth`) |
  | XML | `xml-formatter` | `indentation` **as a string** (`'  '`, `'\t'`, `'    '`) — map count→string |
- **Plan (do this once, unlocks all 5 + SQL S2):**
  1. Extend `BeautifyTool` with `controls?: React.ReactNode` (mirror `TransformTool.tsx:12`).
  2. Change `BeautifyFns` to `beautify: (input, ctx: { indent: number }) => …`, add `indent` to the effect deps, read it inside each fn.
  3. Each format file swaps its hardcoded `2`/`'  '` for `ctx.indent` (XML maps number→spaces string).
  4. Add an indent `<select>` in each tool's `controls`.
- **Alternative (lower effort, worse):** hand-roll each tool (~100 lines ×5). Not recommended — loses shared layout.
- **My take:** `agree` — this is the **single highest-leverage change** in the whole doc. Do the shared-component edit first.

---

### HTML → JSX — `src/tools/html-to-jsx.tsx`
Custom, uses `IOPanel`. Hand-rolled one-directional `htmlToJsx()` with `ATTR_RENAMES`, `VOID_TAGS`, `parseStyle`, `convertAttr`.

#### HJ1 — Remove default sample text  · S · **P0**
- **Plan:** change `useState('<div class="card">…')` (`html-to-jsx.tsx:116-118`) to `useState('')`. The `useMemo` already returns `''` for empty input.
- **My take:** `agree`, one line. (Consistent with markdown MD1.)

#### HJ2 — Also create JSX → HTML  · M · **P2**
- **Plan:** add a direction toggle + a `jsxToHtml()` reusing `ATTR_RENAMES` (inverted: `className→class`, `style={{…}}→style="…"`, void tags back to HTML, `{/*…*/}→<!--…-->`). Swap IOPanel titles/extensions (`htmlLang()`↔`jsLang()`).
- **My take:** `agree`. The existing converter is clean and largely invertible for the cases it already handles. **Note:** AGENTS.md explicitly warns the npm `htmltojsx` package is dead — keep this hand-rolled.

---

### Markdown Preview — `src/tools/markdown-preview.tsx`
Custom, `marked` + `DOMPurify` + `CodeEditor`. Two-pane grid.

#### MD1 — Remove default sample text  · S · **P0**
- **Plan:** `useState(SAMPLE)` (`markdown-preview.tsx:25`) → `useState('')`.
- **My take:** `agree`, one line.

#### MD2 — Theme: white bg / gray text → dark  · S · **P0**
- **Root cause confirmed:** the preview container is `bg-white` (`markdown-preview.tsx:50`) and the inner div uses class `markdown-body` (line 52) — **but `.markdown-body` is defined nowhere** in the repo (`src/styles.css` has only Tailwind base + CodeMirror + scrollbar rules; no `@tailwindcss/typography`). So rendered HTML inherits default browser styling on a white box → the "white bg / unstyled gray text" appearance.
- **Plan:**
  1. Swap the container `bg-white` → `bg-neutral-900`.
  2. Either add `@tailwindcss/typography` + use `prose prose-invert`, or author a small `.markdown-body` dark stylesheet (black bg, `text-neutral-200`, styled headings/code/links) in `src/styles.css`. Align container to `bg-neutral-900`/`text-neutral-200` to match the app.
- **My take:** `bug`/`agree`. Purely additive CSS, no logic change. **This is the most visibly broken thing in the app** — fix early.

---

### QR Code — `src/tools/qr-code.tsx`
Custom, **already tabbed** (`generate` / `read`). Generate uses `qrcode`; Read uses `jsqr` via drag-drop/upload of a File.

#### QR1 — Read QR from clipboard image (+ image preview)  · S · ✅ **P0 done**
- **Implemented:** added a "Paste" button in the Read tab → `navigator.clipboard.read()` (not `readText()`, to access image items) → finds an `image/*` ClipboardItem → `getType()` → Blob → `loadImage`. Also: **paste/upload/drop all now preview the image** in the left panel via `URL.createObjectURL` (replaced the bare dropzone with an `<img>` preview once loaded; object URLs revoked on replace + unmount to avoid leaks). `decodeFile` param widened `File`→`Blob` (File extends Blob).
- **Note:** `navigator.clipboard.read()` for images requires a focused document and may need Electron clipboard permissions in some environments.

---

### G7 — Command palette: up/down arrow keys don't navigate  (new)
- **Current state:** `CommandPalette.tsx:43-73` registers a `window` keydown listener when `open=true` that handles ArrowUp/ArrowDown/Enter/Escape. The handler calls `e.preventDefault()` on arrow keys and updates `idx` state. Despite this, **arrow keys do not move the selection in practice** — the cursor stays in the search input field or nothing happens.
- **Root cause hypothesis:** The `useEffect` at line 44 registers a new listener every time `[open, filtered, idx, onClose, onSelect]` change. Since `idx` changes on every arrow press, the effect **tears down and re-registers the listener each time**, which causes a **captured-stale-closure** issue: the new listener captures the *updated* `idx` from the render that just ran the teardown/setup, so the next arrow press uses the correct idx... This should work. BUT there may be a timing issue with the `setTimeout(() => inputRef.current?.focus(), 50)` at line 39 — the input focus might steal/consume the arrow key events before the window handler fires, depending on event dispatch ordering in the browser. Another possibility: the `idx` setter and the listener registration produce a cycle: key press → setIdx → re-render → useEffect cleanup + re-register → next key press works. This should be fine, so the issue may be **event propagation** — the `<input>` element inside the palette might be calling `stopPropagation()` or the Electron environment may handle arrow keys differently.
- **Plan:**
  1. **Investigate first** — log the keydown event in the handler to see if ArrowUp/ArrowDown fire at all.
  2. **Fix candidate A:** Move the key handler from `window` to the `<input>` element's `onKeyDown` prop directly — avoids any propagation issues and ties navigation to the focused input. The arrow keys would move cursor in the input (can't prevent that on a text input), but the index update + visual highlight change would still work.
  3. **Fix candidate B:** If window handler fires but the visual doesn't update, check that `filtered.length` is > 0 and that `idx` state updates are being applied. The `setIdx` updater `(i) => Math.min(i + 1, filtered.length - 1)` looks correct.
  4. **Fix candidate C:** If the re-render from `setIdx` tears down the effect before the next ArrowDown arrives, use `useRef` for `idx` instead of `useState` for the key handler closure, syncing a visual state from the ref.
- **My take:** `bug`/`agree` — a core UX flow (keyboard navigation in the palette) is broken. Needs debugging first, then the simplest fix. Effort is likely **S** once root cause is identified.
- **Effort:** S · **Priority:** P0

---

## Cross-cutting technical notes (the changes that unlock multiple items)

These four shared-component edits each unblock several items above. Doing them first makes the rest cheap.

### C1 — `BeautifyTool` options plumbing  ✅ **done** (unlocked **F1**, helped **S2**)
Added `controls?: React.ReactNode` to `BeautifyOptions`, introduced `BeautifyCtx = { indent: IndentOption }` (2|4|0, 0=tab), changed `BeautifyFns` to `(input, ctx: BeautifyCtx) => …`, and added `indent` to the effect deps. The indent `<select>` is built into `BeautifyTool` so all 5 formatters inherit it with zero JSX changes; each lib maps `ctx.indent` to its own knob. See **F1** for the per-lib mapping.

### C2 — `<IOGroup orientation>` wrapper  (unlocks **G1**)
Introduce a layout wrapper with an `orientation: 'row'|'col'` prop; have `TransformTool`, `BeautifyTool`, and the ~20 inline-layout tools use it. Drive orientation from a persisted global store so it's one app-wide toggle. See **G1**.

### C3 — Per-tool state store  (unlocks **G2**)
A Zustand store keyed by `toolId` holding `{ input, options }`; helpers hydrate on mount and persist on change. Decide a policy for on-demand-generate tools (uuid/random/lorem): regenerate vs. restore last output. See **G2**.

### C4 — Shared `SwapButton`  ✅ **done** (unlocked **B1**, **U1**, future bidirectional tools)
`src/components/SwapButton.tsx` — presentational ⇄ button matching `PasteButton`/`ClearButton` styling. Calls `setInput(output)` and flips `dir` (encode↔decode), enabling the useful round-trip (encode → swap → decode). Dropped into the Input panel `actions` slot of base64 + url-encode; future bidirectional tools reuse it.

### C5 — `<SplitPane>` wrapper + `react-resizable-panels`  (unlocks **G5**, helps **G3**)
A thin shared component over `react-resizable-panels` with an `orientation` prop and persisted sizes (`autoSaveId`). Introduces the one dep that both the resizable splitter (G5) and the resizable sidebar (G3) need. Apply to markdown first, then the two shared layout components (`TransformTool`, `BeautifyTool`) to unlock the majority of tools in two edits.

### C6 — Per-tool `pendingInput` seed  (unlocks **G6**, helps **G2**)
A Zustand store keyed by `toolId` holding a one-shot `pendingInput` value. The clipboard detect action (currently header "Detect" button, to be moved into Command Palette per G6) writes the clipboard text + chosen tool; the tool's `useState` initializer reads and clears it. Wire into the unused `TransformTool.initialInput`, add the same to `BeautifyTool`, let custom tools opt in. Same store shape as the per-tool-state idea in G2 — building this for input-handoff also lays groundwork for tab-content preservation. **Refactoring note:** when G6 moves clipboard detection into the palette, the trigger for `setPendingInput` moves from `App.tsx`'s `handleDetectClipboard` to `CommandPalette.tsx`'s detect-row handler — the store itself stays unchanged.

---

## Dependency / packaging decisions

| Need | Options | My recommendation |
|------|---------|-------------------|
| **MD4** (Hash H1) | `js-md4` (pure JS) | Only if you genuinely need legacy MD4. Otherwise skip. |
| **MD2** (Hash H1) | No maintained npm pkg; vendor ~80-line impl | Skip unless concrete legacy reason. |
| **JWT RS*/ES*** (W2) | `jose` (full alg coverage) | Defer to P3 unless asymmetric verify is a real use case. |
| **Lorem names/email/url** (LI2) | `@faker-js/faker` vs hand-rolled wordlists | Try hand-rolled first (smaller bundle); faker only if scope grows. Lazy-load if added. |
| **Resizable sidebar** (G3) | `react-resizable-panels` (~12KB) vs hand-rolled | Use the lib — persisted layout + a11y for free. |
| **JSON auto-repair** (J2) | regex vs `jsonrepair` (~30KB) | Start with regex; add `jsonrepair` only if users hit edge cases. |
| **GitHub release** (G4) | GH Actions + electron-builder `--publish` | Standard; needs `repository`/`publish` config + signing secrets. |
| **macOS signing** (G4) | Apple Developer ID ($99/yr) | Required for notarization; unsigned builds trip Gatekeeper. |
| **App icon** (G4) | `build/icon.png` 1024² + `.icns`/`.ico` | Add before any public release. |

---

## Recommendation: should this go in README / AGENTS.md?

**Short answer: don't duplicate the list — point to it.**

- A full roadmap duplicated in README/AGENTS will **drift** from `IMPROVEMENTS.md` the moment an item is done. Two sources of truth = guaranteed staleness (the README already has a stale "35 tools" count).
- **Suggested edits (not done in this pass, per "doc only" scope):**
  - **AGENTS.md** `## Open follow-ups` — add one bullet: *"See [`IMPROVEMENTS.md`](./IMPROVEMENTS.md) for the in-place tool-improvement roadmap (P0–P3)."*
  - **README.md** — add a short `## Roadmap` section before `## License` pointing to both `IMPROVEMENTS.md` (improving existing tools) and `TOOL_PRIORITY.md` (adding new tools), with a one-line summary of current focus (e.g. "P0 bug-fix sweep in progress").
- Keep the *actionable detail* in `IMPROVEMENTS.md` only; README/AGENTS carry a pointer + status, nothing more. Update the pointer's status line as priorities shift, not the item list.

---

## Suggested execution order

If implementing, work top-down by priority:

1. ~~**P0 sweep (one PR):** UU1, NB1+NB2, MD1+MD2, HJ1, C-color-2, UT1, RT1+RT2, QR1.~~ **✅ DONE (2026-07-02)**
2. ~~**P1 shared-component work:** C1 → F1 → S2+JC2+Y1 → C4 → B1/U1 → J1/J2 → JC1 → W1 → QC1 → LI1 → S1/S3.~~ **✅ DONE (2026-07-05)**
3. **P0 bug fix — G7:** Debug and fix Command Palette arrow key navigation. Single-file change in `CommandPalette.tsx`. Do this first since it blocks keyboard-driven discovery of the whole app.
4. **P1 quick UX wins (parallel batch):**
   - G5 splitter margin: add `mx-1` to `<Separator>` in `SplitPane.tsx` — 1 file, 1 line.
   - BI2 paste image: add Paste button + clipboard read to `base64-image.tsx` — clear pattern from QR1.
   - UT3 now button: add "Now" button + format samples to `unix-time.tsx` — small JSX additions.
5. **P2 features (order by usefulness):**
   - G3 resizable sidebar: wrap Sidebar in PanelGroup + thin handle — higher user-facing value.
   - G6 clipboard detect into Ctrl+K: redesign palette integration — highest interaction value.
   - SC2 multi-line input + layout: String Case gotcha, moderate effort.
   - Migrate remaining tools to `<SplitPane>` (G5 step 4): tech debt, incremental per-tool.
   - Per-tool P2 features (SC1, HJ2, RS1, LI2, UT2, NB3/NB4, C-color-1, C-color-4, BI1) — standalone PRs.
6. **P3 architectural** items last, each with its own design doc (G1, G2, QC2, G4, W2, H1).
