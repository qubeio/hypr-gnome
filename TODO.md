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

- [ ] Disable conflicting GNOME WM shortcuts
  - [ ] Extend `_prepareWmShortcuts()` to disable GNOME defaults that clash with Alt arrows or numbers if needed.

- [ ] Test basic flows end-to-end
  - [ ] Build and install with `task install`.
  - [ ] Verify: Alt+h/j/k/l or Alt+arrows to focus; Alt+Shift+arrows to move (swap); workspace next/prev; moving windows to next/prev workspace.
  - [ ] Check no regressions in tiling of the single layout.

- [ ] Document and commit
  - [ ] Update README with the minimal Alt-based shortcuts added.
  - [ ] Commit referencing this TODO number.

Discovered During Work
- If numbers (Alt+1..9) conflict with GNOME or apps, prefer next/prev only for now to stay minimal.
