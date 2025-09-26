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
- [ ] Register switch-to-workspace keybindings for each fixed workspace
  - [ ] Define GSettings keys (type `as`) and bind via `Main.wm.addKeybinding`.
- [ ] Optional: display names in any UI/OSD we provide.
- [ ] Document behavior, caveats (Wayland vs Xorg), and conflicts in README.
