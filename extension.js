/////////////////////////////////////////////////////////////
//           Hypr‑GNOME – MODERN (GNOME Shell 45+)        //
//               © 2025 qubeio – MIT                       //
/////////////////////////////////////////////////////////////


// ── GLOBAL IMPORTS ────────────────────────────────────────
import { Extension }  from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main       from 'resource:///org/gnome/shell/ui/main.js';
import Meta            from 'gi://Meta';
import Shell           from 'gi://Shell';
import Gio             from 'gi://Gio';
import GLib            from 'gi://GLib';
import Clutter         from 'gi://Clutter';

// ── CORE MANAGERS ────────────────────────────────────────
// TODO: Import managers when they're properly implemented
// For now, we'll use the legacy Tiler class

// ── CONST ────────────────────────────────────────────
const WM_SCHEMA          = 'org.gnome.desktop.wm.keybindings';

const TILING_DELAY_MS    = 20;   // Change Tiling Window Delay
const CENTERING_DELAY_MS = 5;    // Change Centered Window Delay

const KEYBINDINGS = {
    'hypr-swap-master': (self) => self._swapWithMaster(),
    'hypr-swap-left':   (self) => self._swapInDirection('left'),
    'hypr-swap-right':  (self) => self._swapInDirection('right'),
    'hypr-swap-up':     (self) => self._swapInDirection('up'),
    'hypr-swap-down':   (self) => self._swapInDirection('down'),
    'hypr-focus-left':         (self) => self._focusInDirection('left'),
    'hypr-focus-right':        (self) => self._focusInDirection('right'),
    'hypr-focus-up':           (self) => self._focusInDirection('up'),
    'hypr-focus-down':         (self) => self._focusInDirection('down'),
    'hypr-test-keybinding': (self) => {
      log(`[Hypr-GNOME] TEST KEYBINDING TRIGGERED! This proves the system works.`);
    },
    // Workspace switching keybindings
    'hypr-workspace-1': (self) => self._switchToWorkspace(0),
    'hypr-workspace-2': (self) => self._switchToWorkspace(1),
    'hypr-workspace-3': (self) => self._switchToWorkspace(2),
    'hypr-workspace-4': (self) => self._switchToWorkspace(3),
    'hypr-workspace-5': (self) => self._switchToWorkspace(4),
    'hypr-workspace-6': (self) => self._switchToWorkspace(5),
    'hypr-workspace-t': (self) => self._switchToWorkspace(6),
    'hypr-workspace-b': (self) => self._switchToWorkspace(7),
    'hypr-workspace-s': (self) => self._switchToWorkspace(8),
    'hypr-workspace-a': (self) => self._switchToWorkspace(9),
    'hypr-workspace-m': (self) => self._switchToWorkspace(10),
    'hypr-workspace-d': (self) => self._switchToWorkspace(11),
    // Move window to workspace keybindings (use hypr-* names to avoid Mutter collisions)
    'hypr-move-to-workspace-1': (self) => self._moveToWorkspace(0),
    'hypr-move-to-workspace-2': (self) => self._moveToWorkspace(1),
    'hypr-move-to-workspace-3': (self) => self._moveToWorkspace(2),
    'hypr-move-to-workspace-4': (self) => self._moveToWorkspace(3),
    'hypr-move-to-workspace-5': (self) => self._moveToWorkspace(4),
    'hypr-move-to-workspace-6': (self) => self._moveToWorkspace(5),
    'hypr-move-to-workspace-t': (self) => self._moveToWorkspace(6),
    'hypr-move-to-workspace-b': (self) => self._moveToWorkspace(7),
    'hypr-move-to-workspace-s': (self) => self._moveToWorkspace(8),
    'hypr-move-to-workspace-a': (self) => self._moveToWorkspace(9),
    'hypr-move-to-workspace-m': (self) => self._moveToWorkspace(10),
    'hypr-move-to-workspace-d': (self) => self._moveToWorkspace(11),
    'hypr-test-move-workspace': (self) => self._moveToWorkspace(0)
};

// ── HELPER‑FUNCTION ────────────────────────────────────────
function getPointerXY() {
    if (global.get_pointer) {
        const [x, y] = global.get_pointer();
        return [x, y];
    }

    const ev = Clutter.get_current_event();
    if (ev) {
        const coords = ev.get_coords();
        if (Array.isArray(coords)) 
            return coords;
    }

    const device = Clutter.get_default_backend()
                          .get_default_seat()
                          .get_pointer();
    return device ? device.get_position() : [0, 0];
}

// ── INTERACTIONHANDLER ───────────────────────────────────
class InteractionHandler {
    constructor(tiler) {
        this.tiler              = tiler;
        this._settings          = this.tiler.settings;
        this._wmSettings        = new Gio.Settings({ schema: WM_SCHEMA });

        this._wmKeysToDisable   = [];
        this._savedWmShortcuts  = {};
        this._grabOpIds         = [];
        this._settingsChangedId = null;
    }

    enable() {
        log(`[Hypr-GNOME] Extension enabling...`);
        this._prepareWmShortcuts();

        if (this._wmKeysToDisable.length)
            this._wmKeysToDisable.forEach(k =>
                this._wmSettings.set_value(k, new GLib.Variant('as', [])));

        // Debug: Check GSettings values
        this._debugSettings();

        this._bindAllShortcuts();
        this._settingsChangedId =
            this._settings.connect('changed', () => this._onSettingsChanged());
        
        log(`[Hypr-GNOME] Extension enabled successfully`);

        this._grabOpIds.push(
            global.display.connect('grab-op-begin',
                (_, __, win) => { if (this.tiler.windows.includes(win))
                                      this.tiler.grabbedWindow = win; })
        );
        this._grabOpIds.push(
            global.display.connect('grab-op-end', () => this._onGrabEnd())
        );
    }

    disable() {
        if (this._wmKeysToDisable.length)
            this._wmKeysToDisable.forEach(k =>
                this._wmSettings.set_value(k, this._savedWmShortcuts[k]));

        this._unbindAllShortcuts();

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        this._grabOpIds.forEach(id => global.display.disconnect(id));
        this._grabOpIds = [];
    }

    _bind(key, handler) {
        log(`[Hypr-GNOME] Registering keybinding: ${key}`);
        try {
            Main.wm.addKeybinding(
                key,
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                () => {
                    log(`[Hypr-GNOME] Keybinding triggered: ${key}`);
                    handler(this);
                }
            );
            log(`[Hypr-GNOME] Successfully registered keybinding: ${key}`);
        } catch (e) {
            log(`[Hypr-GNOME] Error registering keybinding ${key}: ${e.message}`);
        }
    }

    _bindAllShortcuts()  { 
        log(`[Hypr-GNOME] Binding all shortcuts. Available keybindings: ${Object.keys(KEYBINDINGS).join(', ')}`);
        for (const [k,h] of Object.entries(KEYBINDINGS)) this._bind(k, h); 
    }
    _unbindAllShortcuts(){ for (const k in KEYBINDINGS) Main.wm.removeKeybinding(k); }

    _debugSettings() {
        log(`[Hypr-GNOME] Debug: Checking GSettings values`);
        const focusKeys = ['focus-left', 'focus-right', 'focus-up', 'focus-down'];
        focusKeys.forEach(key => {
            try {
                const value = this._settings.get_value(key);
                log(`[Hypr-GNOME] ${key}: ${value.deep_unpack()}`);
            } catch (e) {
                log(`[Hypr-GNOME] Error reading ${key}: ${e.message}`);
            }
        });
    }

    _onSettingsChanged() {
        this._unbindAllShortcuts();
        this._bindAllShortcuts();
    }

    _prepareWmShortcuts() {
        const schema = this._wmSettings.settings_schema;
        if (!schema) return;

        const keys = [];

        const add = key => { if (schema.has_key(key)) keys.push(key); };

        if (schema.has_key('toggle-tiled-left'))
            keys.push('toggle-tiled-left', 'toggle-tiled-right');
        else {
            add('tile-left');  add('tile-right');
        }

        if (schema.has_key('toggle-maximized'))
            keys.push('toggle-maximized');
        else {
            add('maximize');   add('unmaximize');
        }

        // Disable conflicting workspace keybindings that use Alt+arrows
        add('switch-to-workspace-left');
        add('switch-to-workspace-right');
        add('switch-to-workspace-up');
        add('switch-to-workspace-down');
        add('move-to-workspace-left');
        add('move-to-workspace-right');
        add('move-to-workspace-up');
        add('move-to-workspace-down');

        if (keys.length) {
            this._wmKeysToDisable = keys;
            keys.forEach(k => this._savedWmShortcuts[k] =
                             this._wmSettings.get_value(k));
        }
    }

    _focusInDirection(direction) {
        log(`[Hypr-GNOME] _focusInDirection called with direction: ${direction}`);
        const src = global.display.get_focus_window();
        log(`[Hypr-GNOME] Focused window: ${src ? src.get_title() : 'none'}`);
        if (!src || !this.tiler.windows.includes(src)) {
            log(`[Hypr-GNOME] No valid source window or not in tiler windows`);
            return;
        }
        const tgt = this._findTargetInDirection(src, direction);
        log(`[Hypr-GNOME] Target window: ${tgt ? tgt.get_title() : 'none'}`);
        if (tgt) {
            log(`[Hypr-GNOME] Activating target window`);
            tgt.activate(global.get_current_time());
        } else {
            log(`[Hypr-GNOME] No target window found in direction: ${direction}`);
        }
    }

    _swapWithMaster() {
        const w = this.tiler.windows;
        if (w.length < 2) return;
        const foc = global.display.get_focus_window();
        if (!foc || !w.includes(foc)) return;
        const idx = w.indexOf(foc);
        if (idx > 0) [w[0], w[idx]] = [w[idx], w[0]];
        else         [w[0], w[1]]   = [w[1], w[0]];
        this.tiler.tileNow();
        w[0]?.activate(global.get_current_time());
    }

    _swapInDirection(direction) {
        const src = global.display.get_focus_window();
        if (!src || !this.tiler.windows.includes(src)) return;
        let tgt = null;
        const idx = this.tiler.windows.indexOf(src);
        if (idx === 0 && direction==='right' && this.tiler.windows.length>1)
            tgt = this.tiler.windows[1];
        else
            tgt = this._findTargetInDirection(src, direction);
        if (!tgt) return;
        const tidx = this.tiler.windows.indexOf(tgt);
        [this.tiler.windows[idx], this.tiler.windows[tidx]] =
            [this.tiler.windows[tidx], this.tiler.windows[idx]];
        this.tiler.tileNow();
        src.activate(global.get_current_time());
    }

    _findTargetInDirection(src, dir) {
        const sRect = src.get_frame_rect(), cand=[];
        for (const win of this.tiler.windows) {
            if (win===src) continue;
            const r=win.get_frame_rect();
            if (dir==='left' && r.x<sRect.x)  cand.push(win);
            if (dir==='right'&& r.x>sRect.x)  cand.push(win);
            if (dir==='up'   && r.y<sRect.y)  cand.push(win);
            if (dir==='down' && r.y>sRect.y)  cand.push(win);
        }
        if (!cand.length) return null;
        let best=null, min=Infinity;
        for (const w of cand) {
            const r=w.get_frame_rect();
            const dev = (dir==='left'||dir==='right')
                       ? Math.abs(sRect.y - r.y)
                       : Math.abs(sRect.x - r.x);
            if (dev<min){min=dev; best=w;}
        }
        return best;
    }

    _onGrabEnd() {
        const grabbed = this.tiler.grabbedWindow;
        if (!grabbed) return;
        const tgt = this._findTargetUnderPointer(grabbed);
        if (tgt) {
            const a = this.tiler.windows.indexOf(grabbed);
            const b = this.tiler.windows.indexOf(tgt);
            [this.tiler.windows[a], this.tiler.windows[b]] =
                [this.tiler.windows[b], this.tiler.windows[a]];
        }
        this.tiler.queueTile();
        this.tiler.grabbedWindow = null;
    }

    _findTargetUnderPointer(exclude) {
        const [x,y] = getPointerXY();
        const wins = global.get_window_actors()
                           .map(a=>a.meta_window)
                           .filter(w=>w && w!==exclude &&
                                      this.tiler.windows.includes(w) && (()=>{const f=w.get_frame_rect();
                                           return x>=f.x && x<f.x+f.width &&
                                                  y>=f.y && y<f.y+f.height;})());
        if (wins.length) return wins[wins.length-1];

        let best=null, max=0, sRect=exclude.get_frame_rect();
        for (const w of this.tiler.windows) {
            if (w===exclude) continue;
            const r=w.get_frame_rect();
            const ovX=Math.max(0, Math.min(sRect.x+sRect.width, r.x+r.width)-Math.max(sRect.x,r.x));
            const ovY=Math.max(0, Math.min(sRect.y+sRect.height,r.y+r.height)-Math.max(sRect.y,r.y));
            const area=ovX*ovY;
            if (area>max){max=area; best=w;}
        }
        return best;
    }

    _switchToWorkspace(workspaceIndex) {
        const wm = global.workspace_manager;
        const totalWorkspaces = wm.get_n_workspaces();
        
        // Ensure the workspace index is valid
        if (workspaceIndex < 0 || workspaceIndex >= totalWorkspaces) {
            log(`[Hypr-GNOME] Invalid workspace index: ${workspaceIndex} (total: ${totalWorkspaces})`);
            return;
        }
        
        log(`[Hypr-GNOME] Switching to workspace ${workspaceIndex + 1} (index ${workspaceIndex})`);
        
        try {
            // GNOME 46+ API: Use workspace.activate() instead of wm.activate_workspace()
            const workspace = wm.get_workspace_by_index(workspaceIndex);
            if (workspace) {
                workspace.activate(global.get_current_time());
                log(`[Hypr-GNOME] Successfully switched to workspace ${workspaceIndex + 1}`);
            } else {
                log(`[Hypr-GNOME] Could not get workspace at index ${workspaceIndex}`);
            }
        } catch (e) {
            log(`[Hypr-GNOME] Error switching to workspace ${workspaceIndex + 1}: ${e.message}`);
        }
    }

    _moveToWorkspace(workspaceIndex) {
        log(`[Hypr-GNOME] _moveToWorkspace called with index: ${workspaceIndex}`);
        const wm = global.workspace_manager;
        const totalWorkspaces = wm.get_n_workspaces();
        const window = global.display.focus_window;
        
        // Ensure the workspace index is valid
        if (workspaceIndex < 0 || workspaceIndex >= totalWorkspaces) {
            log(`[Hypr-GNOME] Invalid workspace index: ${workspaceIndex} (total: ${totalWorkspaces})`);
            return;
        }
        
        // Check if there's a focused window
        if (!window) {
            log(`[Hypr-GNOME] No focused window to move`);
            return;
        }
        
        log(`[Hypr-GNOME] Moving window to workspace ${workspaceIndex + 1} (index ${workspaceIndex})`);
        
        try {
            const targetWorkspace = wm.get_workspace_by_index(workspaceIndex);
            if (targetWorkspace) {
                window.change_workspace_by_index(workspaceIndex, global.get_current_time());
                log(`[Hypr-GNOME] Successfully moved window to workspace ${workspaceIndex + 1}`);
            } else {
                log(`[Hypr-GNOME] Could not get workspace at index ${workspaceIndex}`);
            }
        } catch (e) {
            log(`[Hypr-GNOME] Error moving window to workspace ${workspaceIndex + 1}: ${e.message}`);
        }
    }
}

// ── TILER ────────────────────────────────────────────────
class Tiler {
    constructor(extension) {
        this._extension       = extension;
        this.settings         = this._extension.getSettings();

        this.windows          = [];
        this.grabbedWindow    = null;
        this._signalIds       = new Map();
        this._tileInProgress  = false;

        this._innerGap        = this.settings.get_int('inner-gap');
        this._outerGapVertical= this.settings.get_int('outer-gap-vertical');
        this._outerGapHorizontal = this.settings.get_int('outer-gap-horizontal');
        this._windowPadding   = this.settings.get_int('window-padding');
        
        // Window highlighting settings
        this._enableHighlighting = this.settings.get_boolean('enable-window-highlighting');
        this._highlightColor = this.settings.get_string('highlight-border-color');
        this._highlightThickness = this.settings.get_int('highlight-border-thickness');
        this._highlightRadius = this.settings.get_int('highlight-border-radius');
        this._highlightShadow = this.settings.get_boolean('highlight-shadow-enabled');
        
        // Catppuccin color settings
        this._useCatppuccinColors = this.settings.get_boolean('use-catppuccin-colors');
        this._catppuccinScheme = this.settings.get_string('catppuccin-color-scheme');
        this._catppuccinAccent = this.settings.get_string('catppuccin-accent-color');
        
        // Catppuccin color palettes
        this._catppuccinPalettes = {
            frappe: {
                lavender: '#babbf1',
                blue: '#8caaee',
                rosewater: '#f2d5cf',
                flamingo: '#eebebe',
                pink: '#f4b8e4',
                mauve: '#ca9ee6',
                red: '#e78284',
                maroon: '#ea999c',
                green: '#a6d189',
                teal: '#81c8be',
                yellow: '#e5c890',
                peach: '#ef9f76'
            },
            latte: {
                lavender: '#7287fd',
                blue: '#1e66f5',
                rosewater: '#dc8a78',
                flamingo: '#dd7878',
                pink: '#ea76cb',
                mauve: '#8839ef',
                red: '#d20f39',
                maroon: '#e64553',
                green: '#40a02b',
                teal: '#179299',
                yellow: '#df8e1d',
                peach: '#fe8019'
            },
            macchiato: {
                lavender: '#b7bdf8',
                blue: '#8aadf4',
                rosewater: '#f4dbd6',
                flamingo: '#f0c6c6',
                pink: '#f5bde6',
                mauve: '#c6a0f6',
                red: '#ed8796',
                maroon: '#ee99a0',
                green: '#a6da95',
                teal: '#8bd5ca',
                yellow: '#eed49f',
                peach: '#f5a97f'
            },
            mocha: {
                lavender: '#b4befe',
                blue: '#89b4fa',
                rosewater: '#f5e0dc',
                flamingo: '#f2cdcd',
                pink: '#f5c2e7',
                mauve: '#cba6f7',
                red: '#f38ba8',
                maroon: '#eba0ac',
                green: '#a6e3a1',
                teal: '#94e2d5',
                yellow: '#f9e2af',
                peach: '#fab387'
            }
        };
        
        // Highlighting state
        this._currentHighlight = null;
        
        log(`[Hypr-GNOME] Highlighting settings: enabled=${this._enableHighlighting}, color=${this._highlightColor}, thickness=${this._highlightThickness}`);

        this._tilingDelay     = TILING_DELAY_MS;
        this._centeringDelay  = CENTERING_DELAY_MS;

        this._exceptions      = [];
        this._interactionHandler = new InteractionHandler(this);

        this._tileTimeoutId   = null;
        this._centerTimeoutIds= [];
    }

    enable() {
        this._loadExceptions();
        this._workspaceManager = global.workspace_manager;

        this._signalIds.set('workspace-changed', {
            object: this._workspaceManager,
            id: this._workspaceManager.connect('active-workspace-changed',
                                               ()=>this._onActiveWorkspaceChanged())
        });

        this._connectToWorkspace();
        this._interactionHandler.enable();

        this._signalIds.set('settings-changed', {
            object: this.settings,
            id: this.settings.connect('changed', ()=>this._onSettingsChanged())
        });
        
        // Track focus changes for highlighting
        this._signalIds.set('focus-window', {
            object: global.display,
            id: global.display.connect('notify::focus-window', ()=>{
                log(`[Hypr-GNOME] Focus changed, updating highlight`);
                this._updateHighlight();
            })
        });
    }

    disable() {
        if (this._tileTimeoutId) {
            GLib.source_remove(this._tileTimeoutId);
            this._tileTimeoutId = null;
        }
        this._centerTimeoutIds.forEach(id=>GLib.source_remove(id));
        this._centerTimeoutIds = [];

        this._interactionHandler.disable();
        this._disconnectFromWorkspace();
        
        // Clean up highlighting
        this._removeHighlight();

        for (const [,sig] of this._signalIds) {
            try { sig.object.disconnect(sig.id); } catch {}
        }
        this._signalIds.clear();
        this.windows = [];
    }

    _onSettingsChanged() {
        this._innerGap          = this.settings.get_int('inner-gap');
        this._outerGapVertical  = this.settings.get_int('outer-gap-vertical');
        this._outerGapHorizontal= this.settings.get_int('outer-gap-horizontal');
        this._windowPadding     = this.settings.get_int('window-padding');
        
        // Update highlighting settings
        this._enableHighlighting = this.settings.get_boolean('enable-window-highlighting');
        this._highlightColor = this.settings.get_string('highlight-border-color');
        this._highlightThickness = this.settings.get_int('highlight-border-thickness');
        this._highlightRadius = this.settings.get_int('highlight-border-radius');
        this._highlightShadow = this.settings.get_boolean('highlight-shadow-enabled');
        
        // Update Catppuccin settings
        this._useCatppuccinColors = this.settings.get_boolean('use-catppuccin-colors');
        this._catppuccinScheme = this.settings.get_string('catppuccin-color-scheme');
        this._catppuccinAccent = this.settings.get_string('catppuccin-accent-color');
        
        this.queueTile();
        this._updateHighlight();
    }

    _loadExceptions() {
        const file = Gio.File.new_for_path(this._extension.path + '/exceptions.txt');
        if (!file.query_exists(null)) { this._exceptions=[]; return; }

        const [ok,data] = file.load_contents(null);
        if (!ok) { this._exceptions=[]; return; }

        const txt = new TextDecoder('utf-8').decode(data);
        this._exceptions = txt.split('\n')
                              .map(l=>l.trim())
                              .filter(l=>l && !l.startsWith('#'))
                              .map(l=>l.toLowerCase());
    }

    _isException(win) {
        if (!win) return false;
        const wmClass = (win.get_wm_class() || "").toLowerCase();
        const appId = (win.get_gtk_application_id() || "").toLowerCase();
        return this._exceptions.includes(wmClass) || this._exceptions.includes(appId);
    }

    _isTileable(win) {
        return (
            win &&
            !win.minimized &&
            !this._isException(win) &&
            win.get_window_type() === Meta.WindowType.NORMAL
        );
    }

    _centerWindow(win) {
        const timeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            this._centeringDelay,
            () => {
                const index = this._centerTimeoutIds.indexOf(timeoutId);
                if (index > -1) this._centerTimeoutIds.splice(index, 1);

                if (!win || !win.get_display()) return GLib.SOURCE_REMOVE;
                if (win.get_maximized())
                    win.unmaximize(Meta.MaximizeFlags.BOTH);

                const monitorIndex = win.get_monitor();
                const workspace = this._workspaceManager.get_active_workspace();
                const workArea = workspace.get_work_area_for_monitor(
                    monitorIndex
                );

                const frame = win.get_frame_rect();
                win.move_frame(
                    true,
                    workArea.x + Math.floor((workArea.width - frame.width) / 2),
                    workArea.y +
                        Math.floor((workArea.height - frame.height) / 2)
                );

                GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                    if (win.get_display()) {
                        if (typeof win.set_keep_above === "function")
                            win.set_keep_above(true);
                        else if (typeof win.make_above === "function")
                            win.make_above();
                    }
                    return GLib.SOURCE_REMOVE;
                });
                return GLib.SOURCE_REMOVE;
            }
        );
        this._centerTimeoutIds.push(timeoutId);
    }

    _onWindowMinimizedStateChanged() {
        this.queueTile();
    }

    _onWindowAdded(workspace, win) {
        if (this.windows.includes(win)) return;
        if (this._isException(win)) {
            this._centerWindow(win);
            return;
        }
        if (this._isTileable(win)) {
            if (this.settings.get_string("new-window-behavior") === "master") {
                this.windows.unshift(win);
            } else {
                this.windows.push(win);
            }
            const id = win.get_id();
            this._signalIds.set(`unmanaged-${id}`, {
                object: win,
                id: win.connect("unmanaged", () =>
                    this._onWindowRemoved(null, win)
                ),
            });
            this._signalIds.set(`size-changed-${id}`, {
                object: win,
                id: win.connect("size-changed", () => {
                    if (!this.grabbedWindow) this.queueTile();
                }),
            });
            this._signalIds.set(`minimized-${id}`, {
                object: win,
                id: win.connect("notify::minimized", () =>
                    this._onWindowMinimizedStateChanged()
                ),
            });
            this.queueTile();
        }
    }

    _onWindowRemoved(workspace, win) {
        const index = this.windows.indexOf(win);
        if (index > -1) this.windows.splice(index, 1);

        ["unmanaged", "size-changed", "minimized"].forEach((prefix) => {
            const key = `${prefix}-${win.get_id()}`;
            if (this._signalIds.has(key)) {
                const { object, id } = this._signalIds.get(key);
                try {
                    object.disconnect(id);
                } catch (e) {}
                this._signalIds.delete(key);
            }
        });
        this.queueTile();
    }

    _onActiveWorkspaceChanged() {
        this._disconnectFromWorkspace();
        this._connectToWorkspace();
    }

    _connectToWorkspace() {
        const workspace = this._workspaceManager.get_active_workspace();
        workspace
            .list_windows()
            .forEach((win) => this._onWindowAdded(workspace, win));
        this._signalIds.set("window-added", {
            object: workspace,
            id: workspace.connect("window-added", (ws, win) =>
                this._onWindowAdded(ws, win)
            ),
        });
        this._signalIds.set("window-removed", {
            object: workspace,
            id: workspace.connect("window-removed", (ws, win) =>
                this._onWindowRemoved(ws, win)
            ),
        });
        this.queueTile();
    }

    _disconnectFromWorkspace() {
        this.windows.slice().forEach((win) => this._onWindowRemoved(null, win));
        ["window-added", "window-removed"].forEach((key) => {
            if (this._signalIds.has(key)) {
                const { object, id } = this._signalIds.get(key);
                try {
                    object.disconnect(id);
                } catch (e) {}
                this._signalIds.delete(key);
            }
        });
    }

    queueTile() {
        if (this._tileInProgress || this._tileTimeoutId) return;
        this._tileInProgress = true;
        this._tileTimeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            this._tilingDelay,
            () => {
                this._tileWindows();
                this._tileInProgress = false;
                this._tileTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            }
        );
    }

    tileNow() {
        if (!this._tileInProgress) {
            this._tileWindows();
        }
    }

    _splitLayout(windows, area) {
        if (windows.length === 0) return;
        if (windows.length === 1) {
            // Apply window padding to single window in split layout
            windows[0].move_resize_frame(
                true,
                area.x + this._windowPadding,
                area.y + this._windowPadding,
                area.width - 2 * this._windowPadding,
                area.height - 2 * this._windowPadding
            );
            return;
        }
        const gap = Math.floor(this._innerGap / 2);
        const primaryWindows = [windows[0]];
        const secondaryWindows = windows.slice(1);
        let primaryArea, secondaryArea;
        if (area.width > area.height) {
            const primaryWidth = Math.floor(area.width / 2) - gap;
            primaryArea = {
                x: area.x,
                y: area.y,
                width: primaryWidth,
                height: area.height,
            };
            secondaryArea = {
                x: area.x + primaryWidth + this._innerGap,
                y: area.y,
                width: area.width - primaryWidth - this._innerGap,
                height: area.height,
            };
        } else {
            const primaryHeight = Math.floor(area.height / 2) - gap;
            primaryArea = {
                x: area.x,
                y: area.y,
                width: area.width,
                height: primaryHeight,
            };
            secondaryArea = {
                x: area.x,
                y: area.y + primaryHeight + this._innerGap,
                width: area.width,
                height: area.height - primaryHeight - this._innerGap,
            };
        }
        this._splitLayout(primaryWindows, primaryArea);
        this._splitLayout(secondaryWindows, secondaryArea);
    }

    _tileWindows() {
        const windowsToTile = this.windows.filter((win) => !win.minimized);
        if (windowsToTile.length === 0) return;

        const monitor = Main.layoutManager.primaryMonitor;
        const workspace = this._workspaceManager.get_active_workspace();
        const workArea = workspace.get_work_area_for_monitor(monitor.index);

        const innerArea = {
            x: workArea.x + this._outerGapHorizontal,
            y: workArea.y + this._outerGapVertical,
            width: workArea.width - 2 * this._outerGapHorizontal,
            height: workArea.height - 2 * this._outerGapVertical,
        };
        windowsToTile.forEach((win) => {
            if (win.get_maximized()) win.unmaximize(Meta.MaximizeFlags.BOTH);
        });
        if (windowsToTile.length === 1) {
            // Apply window padding to single window
            windowsToTile[0].move_resize_frame(
                true,
                innerArea.x + this._windowPadding,
                innerArea.y + this._windowPadding,
                innerArea.width - 2 * this._windowPadding,
                innerArea.height - 2 * this._windowPadding
            );
            return;
        }
        const gap = Math.floor(this._innerGap / 2);
        const masterWidth = Math.floor(innerArea.width / 2) - gap;
        const master = windowsToTile[0];
        // Apply window padding to master window
        master.move_resize_frame(
            true,
            innerArea.x + this._windowPadding,
            innerArea.y + this._windowPadding,
            masterWidth - 2 * this._windowPadding,
            innerArea.height - 2 * this._windowPadding
        );
        const stackArea = {
            x: innerArea.x + masterWidth + this._innerGap,
            y: innerArea.y,
            width: innerArea.width - masterWidth - this._innerGap,
            height: innerArea.height,
        };
        this._splitLayout(windowsToTile.slice(1), stackArea);
        
        // Update highlight after tiling
        this._updateHighlight();
    }
    
    _updateHighlight() {
        if (!this._enableHighlighting) {
            this._removeHighlight();
            return;
        }
        
        const focusedWindow = global.display.get_focus_window();
        if (!focusedWindow) {
            this._removeHighlight();
            return;
        }
        
        // Only highlight tiled windows (windows managed by this extension)
        if (!this.windows.includes(focusedWindow)) {
            this._removeHighlight();
            return;
        }
        
        const windowActor = focusedWindow.get_compositor_private();
        if (!windowActor) {
            log(`[Hypr-GNOME] No window actor for focused window: ${focusedWindow.get_title()}`);
            return;
        }
        
        log(`[Hypr-GNOME] Adding highlight to window: ${focusedWindow.get_title()}`);
        this._removeHighlight();
        this._addHighlight(windowActor);
    }
    
    _addHighlight(windowActor) {
        if (!this._enableHighlighting) return;
        
        const currentColor = this._getHighlightColor();
        log(`[Hypr-GNOME] Creating border highlight with settings: color=${currentColor}, thickness=${this._highlightThickness}`);
        
        // Create a container for the border
        this._currentHighlight = new Clutter.Actor({
            reactive: false
        });
        
        // Set size to match window
        const rect = windowActor.get_allocation_box();
        this._currentHighlight.set_size(rect.get_width(), rect.get_height());
        
        // Create border actors for each side
        const borderColor = new Clutter.Color({
            red: this._parseColor(currentColor, 'red'),
            green: this._parseColor(currentColor, 'green'),
            blue: this._parseColor(currentColor, 'blue'),
            alpha: 255
        });
        
        // Top border
        const topBorder = new Clutter.Actor({
            reactive: false
        });
        topBorder.set_position(0, 0);
        topBorder.set_size(rect.get_width(), this._highlightThickness);
        topBorder.set_background_color(borderColor);
        this._currentHighlight.add_child(topBorder);
        
        // Bottom border
        const bottomBorder = new Clutter.Actor({
            reactive: false
        });
        bottomBorder.set_position(0, rect.get_height() - this._highlightThickness);
        bottomBorder.set_size(rect.get_width(), this._highlightThickness);
        bottomBorder.set_background_color(borderColor);
        this._currentHighlight.add_child(bottomBorder);
        
        // Left border
        const leftBorder = new Clutter.Actor({
            reactive: false
        });
        leftBorder.set_position(0, 0);
        leftBorder.set_size(this._highlightThickness, rect.get_height());
        leftBorder.set_background_color(borderColor);
        this._currentHighlight.add_child(leftBorder);
        
        // Right border
        const rightBorder = new Clutter.Actor({
            reactive: false
        });
        rightBorder.set_position(rect.get_width() - this._highlightThickness, 0);
        rightBorder.set_size(this._highlightThickness, rect.get_height());
        rightBorder.set_background_color(borderColor);
        this._currentHighlight.add_child(rightBorder);
        
        // Add to window actor
        windowActor.add_child(this._currentHighlight);
        
        log(`[Hypr-GNOME] Border highlight added to window`);
    }
    
    _removeHighlight() {
        if (this._currentHighlight && this._currentHighlight.get_parent()) {
            this._currentHighlight.get_parent().remove_child(this._currentHighlight);
        }
        this._currentHighlight = null;
    }
    
    
    _getHighlightColor() {
        // Return the appropriate highlight color based on settings
        log(`[Hypr-GNOME] _getHighlightColor: useCatppuccin=${this._useCatppuccinColors}, scheme=${this._catppuccinScheme}, accent=${this._catppuccinAccent}`);
        
        if (this._useCatppuccinColors) {
            const palette = this._catppuccinPalettes[this._catppuccinScheme];
            if (palette && palette[this._catppuccinAccent]) {
                const color = palette[this._catppuccinAccent];
                log(`[Hypr-GNOME] Using Catppuccin color: ${color}`);
                return color;
            }
            // Fallback to lavender if accent not found
            const fallbackColor = palette?.lavender || '#babbf1';
            log(`[Hypr-GNOME] Using Catppuccin fallback color: ${fallbackColor}`);
            return fallbackColor;
        }
        log(`[Hypr-GNOME] Using custom color: ${this._highlightColor}`);
        return this._highlightColor;
    }
    
    _parseColor(colorStr, component) {
        // Parse hex color string like #ffd700
        const hex = colorStr.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        switch(component) {
            case 'red': return r;
            case 'green': return g;
            case 'blue': return b;
            default: return 0;
        }
    }
}

// ── EXTENSION‑WRAPPER ───────────────────────────────────
export default class HyprGnomeExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._managers = new Map();
        this._settings = null;
    }
    
    _configureFixedWorkspaces() {
        try {
            // Configure mutter settings for fixed workspaces
            const mutterSettings = new Gio.Settings({ schema: 'org.gnome.mutter' });
            const wmSettings = new Gio.Settings({ schema: 'org.gnome.desktop.wm.preferences' });
            
            // Disable dynamic workspaces
            mutterSettings.set_boolean('dynamic-workspaces', false);
            
            // Set workspace count and names
            const workspaceNames = ['1', '2', '3', '4', '5', '6', 'T', 'B', 'S', 'A', 'M', 'D'];
            wmSettings.set_int('num-workspaces', workspaceNames.length);
            wmSettings.set_strv('workspace-names', workspaceNames);
            
            log(`[Hypr-GNOME] Configured fixed workspaces: ${workspaceNames.length} workspaces with names ${workspaceNames.join(', ')}`);
        } catch (error) {
            log(`[Hypr-GNOME] Error configuring fixed workspaces: ${error.message}`);
        }
    }
    
    enable() {
        // Initialize GSettings
        this._settings = this.getSettings();
        
        // Configure fixed workspaces
        this._configureFixedWorkspaces();
        
        // Initialize core managers (TODO: Enable when managers are properly implemented)
        // this._managers.set('tiling', new TilingManager());
        // this._managers.set('keybindings', new KeybindingManager());
        // this._managers.set('workspaces', new WorkspaceManager());
        // this._managers.set('rules', new WindowRules());
        // this._managers.set('animations', new AnimationEngine());
        
        // TODO: Initialize manager dependencies and connections
        // TODO: Register keybindings and event handlers
        // TODO: Apply initial window rules and layout
        
        // Legacy compatibility - keep existing Tiler for now
        this.tiler = new Tiler(this);
        this.tiler.enable();
    }
    
    disable() {
        // Cleanup managers in reverse order
        this._managers.forEach(manager => {
            if (manager && typeof manager.destroy === 'function') {
                manager.destroy();
            }
        });
        this._managers.clear();
        
        // Legacy cleanup
        this.tiler?.disable();
        this.tiler = null;
        
        this._settings = null;
    }
    
    getManager(name) {
        return this._managers.get(name);
    }
}
