### TODO – Minimal Alt-based keybindings to enable basic functionality

Scope: Keep current single working layout. Wire up only essential keybinds using Alt. Make the smallest possible code and schema changes.

- [x] Define/confirm Alt keybindings in GSettings
  - [x] Ensure focus keys exist and use Alt: `focus-left/right/up/down`.
  - [x] Add Alt-based swap keys for moving windows: `swap-left/right/up/down`.
  - [x] Add Alt-based workspace keys (limited scope): `workspace-prev`, `workspace-next`, `move-to-workspace-prev`, `move-to-workspace-next`.
  - [x] Recompile schemas via Taskfile.

- [x] Bind keys in InteractionHandler with minimal edits
  - [x] Map focus handlers to `focus-*` keys (already present).
  - [x] Wire swap handlers for moving windows to `swap-*` keys (already present in handler map).
  - [x] Add workspace focus and move handlers using GNOME workspace API in `InteractionHandler`.

- [x] Disable conflicting GNOME WM shortcuts
  - [x] Extend `_prepareWmShortcuts()` to disable GNOME defaults that clash with Alt arrows (switch/move workspace arrows).

- [x] Test basic flows end-to-end
  - [x] Build and install with `task install`.
  - [x] Verify: Alt+h/j/k/l and Alt+Left/Right to focus (confirmed); Alt+Shift+arrows swap; workspace next/prev and move next/prev.
  - [x] Check no regressions in tiling of the single layout.

- [x] Document and commit
  - [x] Add `docs/keybindings.md` describing the issue and fix.
  - [x] Commit referencing this TODO number.

Discovered During Work
- If numbers (Alt+1..9) conflict with GNOME or apps, prefer next/prev only for now to stay minimal.

### Next – Fixed, named workspaces and keybindings

#### Notes

Refer to docs/workspaces.md for implementation instructions

- [x] Implement fixed workspaces (disable dynamic workspaces, ensure count at session start)
  - [x] Set `org.gnome.mutter dynamic-workspaces=false` and ensure required count via `global.workspace_manager`.
- [x] Add extension setting for workspace names (string-array)
  - [x] Default to: `['1','2','3','4','5','6','T','B','S','A','M']`.
- [x] Register switch-to-workspace keybindings for each fixed workspace
  - [x] Define GSettings keys (type `as`) and bind via `Main.wm.addKeybinding`.
  - [x] Support both numbered (Alt+1-6) and letter (Alt+T/B/S/A/M) workspaces.
- [ ] Optional: display names in any UI/OSD we provide.
- [x] Document behavior, caveats (Wayland vs Xorg), and conflicts in README.

### Next – Remove workspace navigation keybindings and implement specific named workspace switching

#### Remove workspace navigation functionality
- [x] Remove workspace navigation keybindings from schema
  - [x] Remove `workspace-prev` keybinding (Alt+Ctrl+Left)
  - [x] Remove `workspace-next` keybinding (Alt+Ctrl+Right) 
  - [x] Remove `move-to-workspace-prev` keybinding (Alt+Shift+Ctrl+Left)
  - [x] Remove `move-to-workspace-next` keybinding (Alt+Shift+Ctrl+Right)
- [x] Remove workspace navigation handlers from extension.js
  - [x] Remove `workspace-prev` handler from InteractionHandler
  - [x] Remove `workspace-next` handler from InteractionHandler
  - [x] Remove `move-to-workspace-prev` handler from InteractionHandler
  - [x] Remove `move-to-workspace-next` handler from InteractionHandler
- [x] Recompile schemas and test removal

#### Implement move window to specific workspaces
- [x] Add move-to-workspace keybindings to schema
  - [x] Add `hypr-move-to-workspace-1` through `hypr-move-to-workspace-6` keys (Alt+Shift+1-6)
  - [x] Add `hypr-move-to-workspace-t`, `hypr-move-to-workspace-b`, `hypr-move-to-workspace-s`, `hypr-move-to-workspace-a`, `hypr-move-to-workspace-m`, `hypr-move-to-workspace-d` keys (Alt+Shift+T/B/S/A/M/D)
- [x] Implement move-to-workspace handlers in extension.js
  - [x] Wire up numbered workspace move handlers (Alt+Shift+1-6)
  - [x] Wire up letter workspace move handlers (Alt+Shift+T/B/S/A/M/D)
  - [x] Use `window.change_workspace_by_index()` to move focused window
  - [x] Map letter keys to workspace indices (T=6, B=7, S=8, A=9, M=10, D=11)
- [x] Test window movement to all workspaces
- [x] Update documentation
  - [x] Update `docs/keybindings.md` with new workspace switching behavior
  - [x] Remove references to workspace navigation keybindings
  - [x] Document specific workspace switching functionality

### Next – Standardize keybinding naming convention

#### Apply hypr- prefix to all keybindings
- [x] Add hypr- prefix to all keybinding names in schema to avoid Mutter collisions
  - [x] Rename all focus keys: `focus-*` → `hypr-focus-*`
  - [x] Rename all swap keys: `swap-*` → `hypr-swap-*`
  - [x] Rename all workspace keys: `workspace-*` → `hypr-workspace-*`
  - [x] Rename all move-to-workspace keys: `hypr-move-to-workspace-*` (already prefixed)
- [x] Update extension.js KEYBINDINGS map to use hypr- prefix
- [x] Test all keybindings with new naming convention
- [x] Update documentation to reflect new naming convention
