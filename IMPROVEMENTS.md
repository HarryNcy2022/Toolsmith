# Improvement Backlog

Only active or explicitly deferred work belongs here. Completed-item history lives in Git.

| Improvement | Status | Value | Scope |
|-------------|--------|-------|-------|
| Preserve tool state when switching tools | Pending | High | Persist input and selected options per tool without retaining heavy mounted components. |
| Configurable global hotkey | Pending | Medium | Replace hardcoded `CmdOrCtrl+Shift+D` with a persisted setting and safe re-registration. |
| History/settings UI | Pending | Medium | Clear input history and expose small app preferences. |
| Release pipeline, icon, signing | Pending when distributing | High for public releases | Add app assets, GitHub release automation, macOS notarization, and Windows signing. |
| Panel orientation toggle | Deferred | Medium/low | Support left/right and top/bottom pane layouts through shared layout components and persisted preference. |

## Current priority

1. Preserve tool state.
2. Add history/settings UI and configurable hotkey when requested.
3. Complete release work before public distribution.
4. Keep panel orientation deferred until there is clear demand.

Do not add per-tool enhancements without a concrete use case.
