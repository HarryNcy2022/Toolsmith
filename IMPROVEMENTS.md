# Improvement Backlog

Only active or explicitly deferred work belongs here. Completed-item history lives in Git.

| Improvement | Status | Value | Scope |
|-------------|--------|-------|-------|
| History/settings UI | Pending | Medium | Expose small app preferences (global hotkey is already configurable; clear-all input history is already wired in Settings). |
| Tool pins | Proposed | Medium | Let users pin frequently-used tools; pinned tools surface first when searching/filtering the palette. |
| Configurable palette hotkey | Proposed | Medium | Rename the ⌘K / Ctrl+K command-palette shortcut to a generic "menu" action and make that hotkey user-configurable, like the global show/hide hotkey. |
| Per-tool history panel | Proposed | Medium | Per-tool input-history panel opened by a hotkey; configurable hotkey; supports clear-one (× per row) and clear-all (button). |
| Clear preserved state | Proposed | Medium | Add a "Clear preserved state" action in Settings that wipes the per-tool preserved input+options store (`devutils:tool-state`), alongside the existing clear-history. |
| Opt out of state preservation | Proposed | Low | Preference to disable tool-state preservation globally (or per tool) so tools start empty and never persist input/options. |
| Release pipeline, icon, signing | Pending when distributing | High for public releases | Add app assets, GitHub release automation, macOS notarization, and Windows signing. |
| Panel orientation toggle | Deferred | Medium/low | Support left/right and top/bottom pane layouts through shared layout components and persisted preference. |

## Current priority

1. Add history/settings UI preferences when requested.
2. Complete release work before public distribution.
3. Keep panel orientation deferred until there is clear demand.

Do not add per-tool enhancements without a concrete use case.

## Per-tool history panel (spec)

Open a per-tool input-history panel with these requirements:

1. **Open via hotkey** — a dedicated hotkey toggles the history panel for the currently active tool (separate from the global show/hide and the command-palette hotkeys).
2. **Configurable hotkey** — this history-panel hotkey is added to Settings (same configurable/validated pattern as the global hotkey and the palette hotkey), persisted in `config.json`.
3. **Clear history from the panel** —
   - (a) **One by one**: each history row has a `×` control on its right that removes that single entry for the active tool.
   - (b) **Clear all**: a "Clear all" button at the top-right of the panel that clears every entry for the active tool (mirrors the existing Settings "Clear all input history", but scoped to the panel).

The panel reads/writes the existing `devutils:history` store (`useHistoryStore`): `getAll(toolId)` for the list, `removeOne`/`clearAll(toolId)` for deletion. Note: `removeOne` does not exist yet and must be added before this item can be implemented.

## Bug fixes

- **Unix-time tool errors on empty input (default input).** The unix-time converter throws / shows an error when the input is empty (e.g. on first open with the now-empty default). Should treat empty input as "nothing to convert" (show a neutral placeholder) instead of an error state. Likely in `src/tools/unix-time.tsx` conversion path.
