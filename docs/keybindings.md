## Keybindings on GNOME 46 (X11)

Summary of the issue we hit and the fix, for future maintainers and LLMs.

### Symptom
- Alt-based focus shortcuts (e.g., Alt+H/L or Alt+Left/Right) did not trigger.
- No "Keybinding triggered" logs appeared in `journalctl` when pressing keys.

### Root causes
- Used Mutter internal API `global.display.add_keybinding` without an action mode.
- Workspace-related GNOME WM shortcuts conflicted with our Alt+Arrow defaults.
- Schema changes were not always followed by a schema recompile and shell reload.

### Correct approach (GNOME 46 on X11)
- Register via GNOME Shell API: `Main.wm.addKeybinding(...)` and specify an action mode.
- Unregister via `Main.wm.removeKeybinding(name)`.
- Import: `Main` (Shell UI), `Meta` (flags), `Shell` (action modes).
- GSettings key type must be `as` (string-array) with accelerator strings like `'<Alt>h'`.

Example (GJS ESM style):
```js
Main.wm.addKeybinding(
  'focus-right',                // key name in our schema
  settings,                     // Gio.Settings bound to our schema
  Meta.KeyBindingFlags.NONE,    // typical default
  Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW, // where it works
  () => handler()
);
// ... later ...
Main.wm.removeKeybinding('focus-right');
```

### Conflicts to disable
- GNOME WM bindings using Alt+Arrows can preempt ours. Disable at runtime via
  `org.gnome.desktop.wm.keybindings` for:
  - `switch-to-workspace-left/right/up/down`
  - `move-to-workspace-left/right/up/down`

### Schema details
- Keys are `type="as"` and defaults are Alt-based for focus and Shift+Alt for swap.
- After editing the schema XML, you must recompile schemas where GNOME reads them
  and reload the shell:
  - During local dev: `task install` (runs `glib-compile-schemas` in the build
    and installs under `~/.local/share/gnome-shell/extensions`).
  - If installing system-wide (not recommended for dev): copy XML to
    `/usr/share/glib-2.0/schemas/` and run `sudo glib-compile-schemas /usr/share/glib-2.0/schemas`.
- Defaults only apply when no user value exists. To test new defaults:
  `gsettings reset-recursively org.gnome.shell.extensions.hypr-gnome`.

### Test checklist
1) Ensure you are on Xorg: `echo $XDG_SESSION_TYPE` should print `x11`.
2) Install: `task install`.
3) Restart Shell (Xorg): Alt+F2, `r`, Enter.
4) Reset extension keys to pick up defaults:
   `gsettings reset-recursively org.gnome.shell.extensions.hypr-gnome`.
5) Verify bindings exist:
   - `gsettings get org.gnome.shell.extensions.hypr-gnome focus-left`
   - `gsettings get org.gnome.shell.extensions.hypr-gnome focus-right`
6) Press Alt+H/L and Alt+Left/Right with a normal window focused.
7) Watch logs live:
   `journalctl --user -f | grep -i hypr-gnome`.

### Wayland caveat
- `Main.wm.addKeybinding` works for Xorg sessions. Under Wayland, extensions
  cannot register global shortcuts in the same way; behavior is limited.

### Workspace Keybindings
- **Numbered workspaces**: Alt+1 through Alt+6 switch to workspaces 1-6
- **Letter workspaces**: Alt+T, Alt+B, Alt+S, Alt+A, Alt+M, Alt+D switch to named workspaces
- **Workspace navigation**: Alt+Ctrl+Left/Right for previous/next workspace
- **Window movement**: Alt+Shift+Ctrl+Left/Right to move window to previous/next workspace

### Troubleshooting: Alt+Shift+number and move-to-workspace
- **Symptom**: Some combos (e.g., Alt+Shift+1, Alt+Ctrl+R) did not trigger our handlers.
- **Root cause**: We originally used key names that collide with Mutter’s built‑in bindings (e.g., `move-to-workspace-1`). GNOME warned: “Trying to re-add keybinding \"move-to-workspace-1\"”, so grabs/dispatch were unreliable.
- **Fix**:
  - Use unique schema key names prefixed with `hypr-`, e.g., `hypr-move-to-workspace-1`, `hypr-move-to-workspace-t`.
  - For shifted digits, bind to the digit form (e.g., `'<Alt><Shift>1'`) — do not use symbol names like `exclam`.
  - Continue disabling conflicting WM arrow bindings under `org.gnome.desktop.wm.keybindings`.
- **Verification checklist**:
  - Build/install schemas, restart shell, then reset defaults:
    - `task install`
    - Alt+F2 → `r` → Enter (Xorg)
    - `gsettings reset-recursively org.gnome.shell.extensions.hypr-gnome`
  - Confirm: `journalctl --user -f | grep -i hypr-gnome` shows “Successfully registered …” and keypresses log as “Keybinding triggered: …”.
- **FYI**: Alt+Shift is not reserved for layout switching unless `org.gnome.desktop.input-sources xkb-options` includes `grp:alt_shift_toggle`.

### References
- Mutter keybinding flags (`Meta.KeyBindingFlags`):
  [meta-keybinding.h](https://gitlab.gnome.org/GNOME/mutter/-/blob/main/src/meta/meta-keybinding.h)
- GNOME Shell action modes (`Shell.ActionMode`).
- Common extension pattern: `Main.wm.addKeybinding` with `Shell.ActionMode`.


