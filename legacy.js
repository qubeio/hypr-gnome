///////////////////////////////////////////////////////////////
//   Simple‑Tiling – LEGACY (GNOME Shell 3.38 ‑ 44)           //
//                © 2025 domoel – MIT                        //
/////////////////////////////////////////////////////////////

'use strict';

// ── GLOBAL IMPORTS ────────────────────────────────────────
const Main          = imports.ui.main;
const Meta          = imports.gi.Meta;
const Shell         = imports.gi.Shell;
const Gio           = imports.gi.Gio;
const GLib          = imports.gi.GLib;
const ExtensionUtils= imports.misc.extensionUtils;
const ByteArray     = imports.byteArray;

const Me            = ExtensionUtils.getCurrentExtension();

// ── CONST ────────────────────────────────────────────
const SCHEMA_NAME   = 'org.gnome.shell.extensions.simple-tiling.domoel';
const WM_SCHEMA     = 'org.gnome.desktop.wm.keybindings';

const TILING_DELAY_MS     = 20;   // Change Tiling Window Delay
const CENTERING_DELAY_MS  = 5;    // Change Centered Window Delay

const KEYBINDINGS = {
    'swap-master-window': (self) => self._swapWithMaster(),
    'swap-left-window':   (self) => self._swapInDirection('left'),
    'swap-right-window':  (self) => self._swapInDirection('right'),
    'swap-up-window':     (self) => self._swapInDirection('up'),
    'swap-down-window':   (self) => self._swapInDirection('down'),
    'focus-left':         (self) => self._focusInDirection('left'),
    'focus-right':        (self) => self._focusInDirection('right'),
    'focus-up':           (self) => self._focusInDirection('up'),
    'focus-down':         (self) => self._focusInDirection('down'),
};

// ── HELPER‑FUNCTION ────────────────────────────────────────
function addKeybinding(name, settings, flags, mode, handler) {
    if (Main.wm?.addKeybinding)
        Main.wm.addKeybinding(name, settings, flags, mode, handler);
    else
        global.display.add_keybinding(name, settings, flags, mode, handler);
}
function removeKeybinding(name) {
    if (Main.wm?.removeKeybinding)
        Main.wm.removeKeybinding(name);
    else
        global.display.remove_keybinding(name);
}

function getWorkAreaForMonitor(monitorIndex) {
    if (Main.layoutManager?.getWorkAreaForMonitor)
        return Main.layoutManager.getWorkAreaForMonitor(monitorIndex);

    return global.workspace_manager
                 .get_active_workspace()
                 .get_work_area_for_monitor(monitorIndex);
}

function decodeUtf8(bytes) {
    if (typeof ByteArray !== 'undefined')
        return ByteArray.toString(bytes);
    return new TextDecoder('utf-8').decode(bytes);
}

function getPointer() {
    return global.get_pointer ? global.get_pointer()
                              : global.display.get_pointer();
}

// ── INTERACTIONHANDLER ───────────────────────────────────
class InteractionHandler {
    constructor(tiler) {
        this.tiler            = tiler;
        this._settings        = ExtensionUtils.getSettings(SCHEMA_NAME);
        this._wmSettings      = new Gio.Settings({ schema: WM_SCHEMA });
        this._wmKeysToDisable = [];
        this._savedWmShortcuts= {};
        this._grabOpIds       = [];
        this._settingsChangedId = null;

        this._onSettingsChanged = this._onSettingsChanged.bind(this);

        this._prepareWmShortcuts();
    }

    enable() {
        if (this._wmKeysToDisable.length)
            this._wmKeysToDisable.forEach(k =>
                this._wmSettings.set_value(k, new GLib.Variant('as', [])));

        this._bindAllShortcuts();
        this._settingsChangedId =
            this._settings.connect('changed', this._onSettingsChanged);

        this._grabOpIds.push(
            global.display.connect('grab-op-begin',
                (display, screen, win) => {
                    if (this.tiler.windows.includes(win))
                        this.tiler.grabbedWindow = win;
                }));
        this._grabOpIds.push(
            global.display.connect('grab-op-end', this._onGrabEnd.bind(this)));
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

    _bind(key, callback) {
        addKeybinding(key, this._settings,
                      Meta.KeyBindingFlags.NONE,
                      Shell.ActionMode.NORMAL,
                      () => callback(this));
    }
    _bindAllShortcuts()  { for (const [k,h] of Object.entries(KEYBINDINGS)) this._bind(k,h); }
    _unbindAllShortcuts(){ for (const k in KEYBINDINGS) removeKeybinding(k); }

    _onSettingsChanged() {
        this._unbindAllShortcuts();
        this._bindAllShortcuts();
    }

    _prepareWmShortcuts() {
        const schema = this._wmSettings.settings_schema;
        const keys   = [];

        if (schema.has_key('toggle-tiled-left'))
            keys.push('toggle-tiled-left','toggle-tiled-right');
        else if (schema.has_key('tile-left'))
            keys.push('tile-left','tile-right');

        if (schema.has_key('toggle-maximized'))
            keys.push('toggle-maximized');
        else {
            if (schema.has_key('maximize'))   keys.push('maximize');
            if (schema.has_key('unmaximize')) keys.push('unmaximize');
        }

        if (keys.length) {
            this._wmKeysToDisable = keys;
            keys.forEach(k => this._savedWmShortcuts[k] =
                             this._wmSettings.get_value(k));
        }
    }

    _focusInDirection(direction) {
        const src = global.display.get_focus_window();
        if (!src || !this.tiler.windows.includes(src)) return;
        const tgt = this._findTargetInDirection(src, direction);
        if (tgt) tgt.activate(global.get_current_time());
    }

    _swapWithMaster() {
        const w = this.tiler.windows;
        if (w.length < 2) return;
        const foc = global.display.get_focus_window();
        if (!foc || !w.includes(foc)) return;
        const idx = w.indexOf(foc);
        if (idx > 0)
            [w[0], w[idx]] = [w[idx], w[0]];
        else
            [w[0], w[1]] = [w[1], w[0]];
        this.tiler.tileNow();
        w[0]?.activate(global.get_current_time());
    }
    _swapInDirection(direction) {
        const src = global.display.get_focus_window();
        if (!src || !this.tiler.windows.includes(src)) return;

        let tgt = null;
        const srcIdx = this.tiler.windows.indexOf(src);
        if (srcIdx === 0 && direction === 'right' && this.tiler.windows.length>1)
            tgt = this.tiler.windows[1];
        else
            tgt = this._findTargetInDirection(src, direction);

        if (!tgt) return;
        const tgtIdx = this.tiler.windows.indexOf(tgt);
        [this.tiler.windows[srcIdx], this.tiler.windows[tgtIdx]] =
            [this.tiler.windows[tgtIdx], this.tiler.windows[srcIdx]];

        this.tiler.tileNow();
        src.activate(global.get_current_time());
    }

    _findTargetInDirection(src, direction) {
        const sRect = src.get_frame_rect();
        const cands = [];

        for (const win of this.tiler.windows) {
            if (win === src) continue;
            const tRect = win.get_frame_rect();
            switch (direction) {
                case 'left':  if (tRect.x < sRect.x) cands.push(win); break;
                case 'right': if (tRect.x > sRect.x) cands.push(win); break;
                case 'up':    if (tRect.y < sRect.y) cands.push(win); break;
                case 'down':  if (tRect.y > sRect.y) cands.push(win); break;
            }
        }
        if (!cands.length) return null;

        let best=null, min=Infinity;
        for (const win of cands) {
            const tRect = win.get_frame_rect();
            const dev = (direction==='left'||direction==='right')
                       ? Math.abs(sRect.y - tRect.y)
                       : Math.abs(sRect.x - tRect.x);
            if (dev < min) { min=dev; best=win; }
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
        const [x,y] = getPointer();
        const wins = global.get_window_actors()
                           .map(a => a.meta_window)
                           .filter(w => w && w!==exclude &&
                                        this.tiler.windows.includes(w) &&
                                        ((()=>{ const f=w.get_frame_rect();
                                            return x>=f.x && x<f.x+f.width &&
                                                   y>=f.y && y<f.y+f.height;})()));
        if (wins.length) return wins[wins.length-1];

        let best=null, max=0, sRect=exclude.get_frame_rect();
        for (const w of this.tiler.windows) {
            if (w===exclude) continue;
            const tRect=w.get_frame_rect();
            const ovX = Math.max(0, Math.min(sRect.x+sRect.width,
                                             tRect.x+tRect.width) -
                                     Math.max(sRect.x, tRect.x));
            const ovY = Math.max(0, Math.min(sRect.y+sRect.height,
                                             tRect.y+tRect.height) -
                                     Math.max(sRect.y, tRect.y));
            const area = ovX*ovY;
            if (area>max){ max=area; best=w; }
        }
        return best;
    }
}

// ── TILER ────────────────────────────────────────────────
class Tiler {
    constructor() {
        this.windows          = [];
        this.grabbedWindow    = null;
        this._settings        = ExtensionUtils.getSettings(SCHEMA_NAME);

        this._signalIds       = new Map();
        this._tileTimeoutId   = null;
        this._centerTimeoutIds= [];
        this._tileInProgress  = false;

        this._innerGap        = this._settings.get_int('inner-gap');
        this._outerGapVertical= this._settings.get_int('outer-gap-vertical');
        this._outerGapHorizontal = this._settings.get_int('outer-gap-horizontal');

        this._tilingDelay   = TILING_DELAY_MS;
        this._centeringDelay= CENTERING_DELAY_MS;

        this._exceptions      = [];
        this._interactionHandler = new InteractionHandler(this);

        this._onWindowAdded  = this._onWindowAdded.bind(this);
        this._onWindowRemoved= this._onWindowRemoved.bind(this);
        this._onActiveWorkspaceChanged =
            this._onActiveWorkspaceChanged.bind(this);
        this._onWindowMinimizedStateChanged =
            this._onWindowMinimizedStateChanged.bind(this);
        this._onSettingsChanged = this._onSettingsChanged.bind(this);
    }

    enable() {
        this._loadExceptions();

        const wm = global.workspace_manager;
        this._signalIds.set('workspace-changed', {
            object: wm,
            id: wm.connect('active-workspace-changed',
                           this._onActiveWorkspaceChanged),
        });

        this._connectToWorkspace();

        this._interactionHandler.enable();

        this._signalIds.set('settings-changed', {
            object: this._settings,
            id: this._settings.connect('changed', this._onSettingsChanged),
        });
    }

    disable() {
        if (this._tileTimeoutId) {
            GLib.source_remove(this._tileTimeoutId);
            this._tileTimeoutId = null;
        }
        this._centerTimeoutIds.forEach(id => GLib.source_remove(id));
        this._centerTimeoutIds = [];

        this._interactionHandler.disable();
        this._disconnectFromWorkspace();

        for (const [,sig] of this._signalIds) {
            try { sig.object.disconnect(sig.id); } catch {}
        }
        this._signalIds.clear();
        this.windows = [];
    }

    _onSettingsChanged() {
        this._innerGap          = this._settings.get_int('inner-gap');
        this._outerGapVertical  = this._settings.get_int('outer-gap-vertical');
        this._outerGapHorizontal= this._settings.get_int('outer-gap-horizontal');
        this.queueTile();
    }

    _loadExceptions() {
        const file = Gio.File.new_for_path(Me.path + '/exceptions.txt');
        if (!file.query_exists(null)) { this._exceptions=[]; return; }

        const [ok, data] = file.load_contents(null);
        this._exceptions = ok ? decodeUtf8(data)
                                  .split('\n')
                                  .map(l => l.trim())
                                  .filter(l => l && !l.startsWith('#'))
                                  .map(l => l.toLowerCase())
                              : [];
    }

    _isException(win) {
        if (!win) return false;
        const wmClass = (win.get_wm_class() || '').toLowerCase();
        const appId   = (win.get_gtk_application_id() || '').toLowerCase();
        return this._exceptions.includes(wmClass) || this._exceptions.includes(appId);
    }
    _isTileable(win) {
        return win && !win.minimized && !this._isException(win) &&
               win.get_window_type() === Meta.WindowType.NORMAL;
    }

    _centerWindow(win) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT,
                                    this._centeringDelay, () => {
            const idx = this._centerTimeoutIds.indexOf(id);
            if (idx>-1) this._centerTimeoutIds.splice(idx,1);

            if (!win || !win.get_display()) return GLib.SOURCE_REMOVE;
            if (win.get_maximized())
                win.unmaximize(Meta.MaximizeFlags.BOTH);

            const monitorIndex = win.get_monitor();
            const workArea     = getWorkAreaForMonitor(monitorIndex);
            const frame        = win.get_frame_rect();
            win.move_frame(true,
                workArea.x + Math.floor((workArea.width  - frame.width )/2),
                workArea.y + Math.floor((workArea.height - frame.height)/2));

            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                if (win.get_display()) {
                    if (typeof win.set_keep_above === 'function')
                        win.set_keep_above(true);
                    else if (typeof win.make_above === 'function')
                        win.make_above();
                }
                return GLib.SOURCE_REMOVE;
            });
            return GLib.SOURCE_REMOVE;
        });
        this._centerTimeoutIds.push(id);
    }

    _onWindowMinimizedStateChanged(){ this.queueTile(); }

    _onWindowAdded(workspace, win) {
        if (this.windows.includes(win)) return;

        if (this._isException(win)) { this._centerWindow(win); return; }

        if (this._isTileable(win)) {
            if (this._settings.get_string('new-window-behavior') === 'master')
                this.windows.unshift(win);
            else
                this.windows.push(win);

            const id = win.get_id();
            this._signalIds.set(`unmanaged-${id}`, {
                object: win, id: win.connect('unmanaged',
                             ()=>this._onWindowRemoved(null, win))});
            this._signalIds.set(`size-${id}`, {
                object: win, id: win.connect('size-changed',
                             ()=>{ if (!this.grabbedWindow) this.queueTile(); })});
            this._signalIds.set(`min-${id}`, {
                object: win, id: win.connect('notify::minimized',
                             this._onWindowMinimizedStateChanged)});
            this.queueTile();
        }
    }

    _onWindowRemoved(workspace, win) {
        const idx = this.windows.indexOf(win);
        if (idx>-1) this.windows.splice(idx,1);

        ['unmanaged','size','min'].forEach(pref=>{
            const key = `${pref}-${win.get_id()}`;
            if (this._signalIds.has(key)) {
                const {object,id} = this._signalIds.get(key);
                try{ object.disconnect(id);}catch{}
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
        const ws = global.workspace_manager.get_active_workspace();
        ws.list_windows().forEach(w=>this._onWindowAdded(ws,w));
        this._signalIds.set('win-add', {
            object: ws, id: ws.connect('window-added',   this._onWindowAdded)});
        this._signalIds.set('win-rem', {
            object: ws, id: ws.connect('window-removed', this._onWindowRemoved)});
        this.queueTile();
    }
    _disconnectFromWorkspace() {
        this.windows.slice().forEach(w=>this._onWindowRemoved(null,w));
        ['win-add','win-rem'].forEach(k=>{
            if (this._signalIds.has(k)) {
                const {object,id}=this._signalIds.get(k);
                try{ object.disconnect(id);}catch{}
                this._signalIds.delete(k);
            }
        });
    }

    queueTile() {
        if (this._tileInProgress || this._tileTimeoutId) return;
        this._tileInProgress = true;
        this._tileTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT,
                                               this._tilingDelay, () => {
            this._tileWindows();
            this._tileInProgress = false;
            this._tileTimeoutId  = null;
            return GLib.SOURCE_REMOVE;
        });
    }
    tileNow() { if (!this._tileInProgress) this._tileWindows(); }

    _splitLayout(windows, area) {
        if (!windows.length) return;
        if (windows.length === 1) {
            windows[0].move_resize_frame(true,
                area.x, area.y, area.width, area.height);
            return;
        }

        const gap = Math.floor(this._innerGap/2);
        const prim = [windows[0]];
        const sec  = windows.slice(1);

        let primArea, secArea;
        if (area.width > area.height) {
            const pW = Math.floor(area.width/2) - gap;
            primArea = {x: area.x, y: area.y,
                        width: pW, height: area.height};
            secArea  = {x: area.x+pW+this._innerGap, y: area.y,
                        width: area.width-pW-this._innerGap,
                        height: area.height};
        } else {
            const pH = Math.floor(area.height/2) - gap;
            primArea = {x: area.x, y: area.y,
                        width: area.width, height: pH};
            secArea  = {x: area.x, y: area.y+pH+this._innerGap,
                        width: area.width,
                        height: area.height-pH-this._innerGap};
        }
        this._splitLayout(prim, primArea);
        this._splitLayout(sec,  secArea);
    }

    _tileWindows() {
        const wins = this.windows.filter(w=>!w.minimized);
        if (!wins.length) return;

        const monitor = Main.layoutManager.primaryMonitor;
        const work    = getWorkAreaForMonitor(monitor.index);
        const inner   = { x: work.x + this._outerGapHorizontal,
                          y: work.y + this._outerGapVertical,
                          width:  work.width  - 2*this._outerGapHorizontal,
                          height: work.height - 2*this._outerGapVertical };

        wins.forEach(w=>{ if (w.get_maximized())
                             w.unmaximize(Meta.MaximizeFlags.BOTH); });

        if (wins.length===1) {
            wins[0].move_resize_frame(true,
                inner.x, inner.y, inner.width, inner.height);
            return;
        }

        const gap = Math.floor(this._innerGap/2);
        const masterW = Math.floor(inner.width/2) - gap;
        const master  = wins[0];
        master.move_resize_frame(true,
            inner.x, inner.y, masterW, inner.height);

        const stack = { x: inner.x + masterW + this._innerGap,
                        y: inner.y,
                        width:  inner.width - masterW - this._innerGap,
                        height: inner.height };
        this._splitLayout(wins.slice(1), stack);
    }
}

// ── EXTENSION‑WRAPPER ───────────────────────────────────
class SimpleTilingExtension {
    enable()  { this.tiler = new Tiler(); this.tiler.enable(); }
    disable() { this.tiler?.disable(); this.tiler = null; }
}

function init() {
    return new SimpleTilingExtension();
}
