# Improvement Backlog

Only active or explicitly deferred work belongs here. Completed-item history lives in Git.

| Improvement | Status | Value | Scope |
|-------------|--------|-------|-------|
| Tool pins | Proposed | Medium | Let users pin frequently-used tools; pinned tools surface first when searching/filtering the palette. |
| Recent tools | Proposed | Medium | Rank recently-used tools first when searching/filtering the command palette. |
| Configurable palette hotkey | Proposed | Medium | Rename the ⌘K / Ctrl+K command-palette shortcut to a generic "menu" action and make that hotkey user-configurable, like the global show/hide hotkey. |
| Clear preserved state | Proposed | Medium | Add a "Clear preserved state" action in Settings that wipes the per-tool preserved input+options store (`devutils:tool-state`), alongside the existing clear-history. |
| Opt out of state preservation | Proposed | Low | Preference to disable tool-state preservation globally (or per tool) so tools start empty and never persist input/options. |
| Release pipeline, icon, signing | Pending when distributing | High for public releases | Add app assets, GitHub release automation, macOS notarization, and Windows signing. |
| Panel orientation toggle | Deferred | Medium/low | Support left/right and top/bottom pane layouts through shared layout components and persisted preference. |

## Current priority

1. Complete release work before public distribution.
2. Keep panel orientation deferred until there is clear demand.

Do not add per-tool enhancements without a concrete use case.
