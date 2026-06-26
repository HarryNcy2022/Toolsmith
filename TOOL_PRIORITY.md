# DevUtils Re-implementation — Tool Priority List

Source: [devutils.com/demo](https://devutils.com/demo/) · 47 tools total.
Target: Electron + React + TS + Vite + Tailwind app (cross-platform).

---

## How to read & edit

- **UF** = Usefulness (how often *you* reach for it). Scale **1 (rare) → 5 (daily)**.
- **EZ** = Ease to build in JS/Electron. Scale **1 (hard/native-heavy) → 5 (one-liner npm)**.
- **Tier** = my suggested batch order:
  - **T1** — high value **and** easy. Build first.
  - **T2** — high value but harder. Build after T1 core.
  - **T3** — medium value. Build when bored / by request.
  - **T4** — niche or low value. Skip or defer.
- **Reference** = the npm pkg / API to reuse. "native" = built-in JS/Electron.

### Editing rules
1. **Change any UF or EZ number** → I will re-sort & re-tier.
2. **Tier is derived, not fixed** — feel free to override it inline (e.g. write `T1!` to force).
3. **Mark tools to skip** with `❌` in Notes, or set UF/EZ to `0`.
4. **Add tools** DevUtils is missing (e.g. UUID v7, hash-all, diff for JSON). Append to bottom.
5. When done, tell me "reviewed" — I scaffold the project + start Tier-1.

Tier derivation (auto, unless you override):
`T1 = UF≥4 AND EZ≥4` · `T2 = UF≥4 AND EZ≤3` · `T3 = UF=3` · `T4 = UF≤2`

---

## Tier summary (auto-derived)

| Tier | Count | Meaning |
|------|-------|---------|
| T1 | 21 | Do first — high value, easy |
| T2 | 2 | High value, harder (cURL→Code, JSON→Code) |
| T3 | 15 | Medium value |
| T4 | 9 | Niche / defer (PHP, ERB, LESS, Cert, etc.) |

---

## Table 1 — sorted by Usefulness (desc), then Ease (desc)

| # | Tool | Category | UF | EZ | Tier | Reference | Notes |
|---|------|----------|----|----|------|-----------|-------|
| 1 | JSON Format/Validate | Format | 5 | 5 | T1 | `prettier` + `JSON.parse` | Most-used tool. Path/pointer nav a nice extra |
| 2 | Base64 String Encode/Decode | Encode | 5 | 5 | T1 | `Buffer` / `btoa` | UTF-8 safe |
| 3 | Unix Time Converter | Time | 5 | 5 | T1 | `dayjs` | +timezone |
| 4 | UUID/ULID Generate/Decode | Generate | 5 | 5 | T1 | `crypto.randomUUID`, `ulid` | add UUID v7? |
| 5 | URL Encode/Decode | Encode | 5 | 5 | T1 | `encodeURIComponent` | |
| 6 | RegExp Tester | Inspect | 5 | 4 | T1 | native `RegExp` | highlight matches + flags + group table |
| 7 | JWT Debugger | Decode | 5 | 4 | T1 | `jwt-decode` / `jose` | header/payload/signature, expiry highlight |
| 8 | URL Parser | Inspect | 4 | 5 | T1 | native `URL` API | query params editable table |
| 9 | HTML Entity Encode/Decode | Encode | 4 | 5 | T1 | `he` | named + numeric |
| 10 | YAML ↔ JSON (both) | Convert | 4 | 5 | T1 | `js-yaml` | merge the two DevUtils tools into one |
| 11 | Number Base Converter | Convert | 4 | 5 | T1 | `parseInt`/`toString` | bin/oct/dec/hex + custom |
| 12 | Text Diff Checker | Inspect | 4 | 4 | T1 | `diff` (jsdiff) | inline + side-by-side |
| 13 | JSON ↔ CSV (both) | Convert | 4 | 4 | T1 | `json2csv`, `papaparse` | merge |
| 14 | Hash Generator | Generate | 4 | 5 | T1 | `crypto-js` + `SubtleCrypto` | md5/sha1/2/3/keccak |
| 15 | SQL Formatter | Format | 4 | 5 | T1 | `sql-formatter` | multi-dialect |
| 16 | String Case Converter | Convert | 4 | 5 | T1 | `change-case` | camel/snake/kebab/... |
| 17 | Color Converter | Convert | 4 | 5 | T1 | `tinycolor2` | hex/rgb/hsl + picker |
| 18 | Random String Generator | Generate | 4 | 5 | T1 | `crypto.getRandomValues` | charset + length presets |
| 19 | Line Sort/Dedupe | Inspect | 4 | 5 | T1 | native | +trim/reverse/case-sort |
| 20 | cURL to Code | Convert | 4 | 2 | T2 | `curlconverter` | many lang targets; big lib |
| 21 | JSON to Code | Convert | 4 | 3 | T2 | `quicktype-core` | TS/Go/Rust/Java/etc. |
| 22 | Backslash Escape/Unescape | Encode | 3 | 5 | T3 | `JSON.stringify` trick | |
| 23 | Base64 Image Encode/Decode | Encode | 3 | 4 | T3 | canvas/`FileReader` | drag-drop image |
| 24 | HTML Preview | Preview | 3 | 4 | T3 | `iframe srcdoc` | sandbox |
| 25 | Lorem Ipsum Generator | Generate | 3 | 5 | T3 | `lorem-ipsum` | |
| 26 | Hex ↔ ASCII (both) | Convert | 3 | 5 | T3 | `Buffer` | merge |
| 27 | HTML Beautify/Minify | Format | 3 | 4 | T3 | `js-beautify`, `html-minifier-terser` | |
| 28 | CSS Beautify/Minify | Format | 3 | 4 | T3 | `js-beautify`, `clean-css` | |
| 29 | JS Beautify/Minify | Format | 3 | 4 | T3 | `prettier`, `terser` | |
| 30 | XML Beautify/Minify | Format | 3 | 4 | T3 | `xml-formatter` | |
| 31 | HTML to JSX | Convert | 3 | 4 | T3 | `htmltojsx` | |
| 32 | Markdown Preview | Preview | 3 | 4 | T3 | `marked` + `DOMPurify` | GFM |
| 33 | SCSS Beautify/Minify | Format | 3 | 3 | T3 | `sass` | compile then format |
| 34 | QR Code Reader/Generator | Convert | 3 | 3 | T3 | `qrcode` (gen) + `jsQR` (read) | |
| 35 | Cron Job Parser | Inspect | 3 | 3 | T3 | `cron-parser` | next-run table |
| 36 | String Inspector | Inspect | 2 | 4 | T4 | native `TextEncoder` | codepoints/bytes |
| 37 | LESS Beautify/Minify | Format | 2 | 3 | T4 | `less` | niche |
| 38 | SVG to CSS | Convert | 2 | 4 | T4 | `encodeURIComponent` data URI | |
| 39 | PHP to JSON | Convert | 1 | 3 | T4 | `php-parser` | PHP-specific |
| 40 | JSON to PHP | Convert | 1 | 3 | T4 | custom `var_export` | |
| 41 | PHP Serializer | Convert | 1 | 3 | T4 | `locutus` serialize | |
| 42 | PHP Unserializer | Convert | 1 | 3 | T4 | `locutus` unserialize | |
| 43 | Certificate Decoder (X.509) | Decode | 2 | 2 | T4 | `node-forge` | ASN.1 parse |
| 44 | ERB Beautify/Minify | Format | 1 | 2 | T4 | none-good-in-JS | Ruby-only; skip |

---

## Table 2 — sorted by Ease (desc), then Usefulness (desc)

Quick view of "cheap wins" to grab when scaffolding.

| # | Tool | UF | EZ | Tier | Reference |
|---|------|----|----|------|-----------|
| 1 | JSON Format/Validate | 5 | 5 | T1 | `prettier` |
| 2 | Base64 String Encode/Decode | 5 | 5 | T1 | `Buffer` |
| 3 | Unix Time Converter | 5 | 5 | T1 | `dayjs` |
| 4 | UUID/ULID Generate/Decode | 5 | 5 | T1 | `crypto`/`ulid` |
| 5 | URL Encode/Decode | 5 | 5 | T1 | `encodeURIComponent` |
| 6 | URL Parser | 4 | 5 | T1 | `URL` API |
| 7 | HTML Entity Encode/Decode | 4 | 5 | T1 | `he` |
| 8 | YAML ↔ JSON | 4 | 5 | T1 | `js-yaml` |
| 9 | Number Base Converter | 4 | 5 | T1 | `parseInt` |
| 10 | Hash Generator | 4 | 5 | T1 | `crypto-js` |
| 11 | SQL Formatter | 4 | 5 | T1 | `sql-formatter` |
| 12 | String Case Converter | 4 | 5 | T1 | `change-case` |
| 13 | Color Converter | 4 | 5 | T1 | `tinycolor2` |
| 14 | Random String Generator | 4 | 5 | T1 | `crypto` |
| 15 | Line Sort/Dedupe | 4 | 5 | T1 | native |
| 16 | Lorem Ipsum Generator | 3 | 5 | T3 | `lorem-ipsum` |
| 17 | Backslash Escape/Unescape | 3 | 5 | T3 | `JSON.stringify` |
| 18 | Hex ↔ ASCII | 3 | 5 | T3 | `Buffer` |
| 19 | JWT Debugger | 5 | 4 | T1 | `jwt-decode` |
| 20 | RegExp Tester | 5 | 4 | T1 | native |
| 21 | Text Diff Checker | 4 | 4 | T1 | `diff` |
| 22 | JSON ↔ CSV | 4 | 4 | T1 | `json2csv`/`papaparse` |
| 23 | Base64 Image Encode/Decode | 3 | 4 | T3 | canvas |
| 24 | HTML Preview | 3 | 4 | T3 | `iframe srcdoc` |
| 25 | HTML Beautify/Minify | 3 | 4 | T3 | `js-beautify` |
| 26 | CSS Beautify/Minify | 3 | 4 | T3 | `js-beautify` |
| 27 | JS Beautify/Minify | 3 | 4 | T3 | `prettier`/`terser` |
| 28 | XML Beautify/Minify | 3 | 4 | T3 | `xml-formatter` |
| 29 | HTML to JSX | 3 | 4 | T3 | `htmltojsx` |
| 30 | Markdown Preview | 3 | 4 | T3 | `marked` |
| 31 | String Inspector | 2 | 4 | T4 | `TextEncoder` |
| 32 | SVG to CSS | 2 | 4 | T4 | data URI |
| 33 | SCSS Beautify/Minify | 3 | 3 | T3 | `sass` |
| 34 | QR Code Reader/Generator | 3 | 3 | T3 | `qrcode`/`jsQR` |
| 35 | Cron Job Parser | 3 | 3 | T3 | `cron-parser` |
| 36 | JSON to Code | 4 | 3 | T2 | `quicktype-core` |
| 37 | LESS Beautify/Minify | 2 | 3 | T4 | `less` |
| 38 | PHP to JSON | 1 | 3 | T4 | `php-parser` |
| 39 | JSON to PHP | 1 | 3 | T4 | custom |
| 40 | PHP Serializer | 1 | 3 | T4 | `locutus` |
| 41 | PHP Unserializer | 1 | 3 | T4 | `locutus` |
| 42 | cURL to Code | 4 | 2 | T2 | `curlconverter` |
| 43 | Certificate Decoder | 2 | 2 | T4 | `node-forge` |
| 44 | ERB Beautify/Minify | 1 | 2 | T4 | none-good |

---

## Reference repos (algorithm reuse, not direct port)

| Source | Use for | Notes |
|--------|---------|-------|
| [DevUtilsApp org](https://github.com/orgs/DevUtilsApp/repositories) | hash/JWT/plist algorithms | mostly **Swift lib forks**, algo-only |
| [nadimtuhin/devutils](https://github.com/nadimtuhin/devutils) | UI structure | **React+TS+Vite** — same stack as ours |
| [DevToys-app/DevToys](https://github.com/DevToys-app/DevToys) | broadest tool overlap | .NET, per-tool algo refs |
| [DevToys](https://devtoys.app/) | UX patterns | smart-detect, sidebar layout |

---

## Open questions for you (answer inline here, or in chat)

1. **Merge pairs?** I merged YAML↔JSON, JSON↔CSV, Hex↔ASCII into single bidirectional tools. OK?
2. **Add tools DevUtils lacks?** e.g. UUID v7, JSON tree pointer-nav, hash-all-in-one, base64url, URL→cURL (reverse). Drop ideas in Notes column.
3. **PHP tools (4 of them, all T4):** keep for parity or cut entirely?
4. **Global features to prioritize:** clipboard smart-detect, global hotkey, dark mode, history, search/palette — rank these too?

<!-- EDIT ABOVE. When ready, say "reviewed" and I scaffold Electron + implement Tier-1. -->
