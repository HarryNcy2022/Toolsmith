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
| Image paste via Ctrl-V | Proposed | Medium | Support Ctrl-V / paste hotkey in image-annotator to paste clipboard image, alongside existing paste button. |
| Image annotator free drawing | Proposed | Medium | Add free-drawing (pencil/brush) mode to image annotator for arbitrary annotations beyond arrow and highlight. |
| Image annotator line smoothing | Proposed | Low | Snap near-straight free-drawn lines to straight lines; make wobbly lines smoother. |
| Image annotator crop-export | Proposed | Medium | Export annotated image cropped to content bounding box with transparent background instead of full canvas. |
| GIF tool (like ezgif.com, offline) | Proposed | Medium | Offline GIF manipulation tool: resize, crop, optimize, split, reverse, frame reorder, speed change. Pure client-side using wasm-gif or similar. |
| GIF tool operation chaining | Proposed | Low | Chain multiple GIF operations sequentially (e.g. resize → optimize → split) in a single workflow. |

## Current priority

1. Complete release work before public distribution.
2. Keep panel orientation deferred until there is clear demand.

Do not add per-tool enhancements without a concrete use case.
