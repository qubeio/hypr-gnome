## Fixed, Named Workspaces (GNOME 46)

Brief reference for implementing fixed-count workspaces with custom names. Works on Xorg and Wayland.

### GSettings keys
- org.gnome.mutter `dynamic-workspaces` (Boolean)
  - false: static/fixed workspaces
  - true: dynamic workspaces
- org.gnome.desktop.wm.preferences `num-workspaces` (Int)
- org.gnome.desktop.wm.preferences `workspace-names` (String array)

### One-time test (CLI)
```bash
gsettings set org.gnome.mutter dynamic-workspaces false
gsettings set org.gnome.desktop.wm.preferences num-workspaces 12
gsettings set org.gnome.desktop.wm.preferences workspace-names "['1','2','3','4','5','6','T','B','S','A','M','D']"
# Restart GNOME Shell (Xorg): Alt+F2, r, Enter
```

### From an extension (GJS)
```js
import Gio from 'gi://Gio';

const mutter = new Gio.Settings({ schema: 'org.gnome.mutter' });
const wm = new Gio.Settings({ schema: 'org.gnome.desktop.wm.preferences' });

mutter.set_boolean('dynamic-workspaces', false);
wm.set_int('num-workspaces', 12);
wm.set_strv('workspace-names', ['1','2','3','4','5','6','T','B','S','A','M','D']);
```

### Notes
- Restart GNOME Shell after changing count or names for full effect.
- Provide at least as many names as workspaces; extras are ignored.
- Keep keybinding conflicts in mind if using numbers or arrows.

### Typical keybindings (extension)
- Register switch-to-workspace-N with `Main.wm.addKeybinding(...)` using
  `Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW`.
- Store accelerators in extension schema keys (`type="as"`) and bind at enable().

### GNOME 46+ Workspace API Changes
**Important**: In GNOME 46+, the workspace switching API changed. Use the new API:

```js
// OLD (deprecated/removed in GNOME 46+):
wm.activate_workspace(index, global.get_current_time());

// NEW (GNOME 46+):
const workspace = global.workspace_manager.get_workspace_by_index(index);
if (workspace) {
    workspace.activate(global.get_current_time());
}
```

**References**: [workspace-switcher-manager extension](https://github.com/G-dH/workspace-switcher-manager) supports GNOME 3.36–48 and uses the new API approach.

### Verification
```bash
gsettings get org.gnome.mutter dynamic-workspaces
gsettings get org.gnome.desktop.wm.preferences num-workspaces
gsettings get org.gnome.desktop.wm.preferences workspace-names
```


