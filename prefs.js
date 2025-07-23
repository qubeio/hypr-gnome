// Settings Menu for Simple-Tiling

'use strict';

const { Gtk, GObject } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const COLUMN_ID = 0;       // z.B. 'swap-master-window'
const COLUMN_DESC = 1;     // z.B. 'Master-Fenster tauschen'
const COLUMN_KEY = 2;      // Der Key-Code (eine Zahl)
const COLUMN_MODS = 3;     // Die Modifier-Maske (eine Zahl)

function init() {}

function buildPrefsWidget() {
    const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.simple-tiling.domoel');

    const prefsWidget = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin: 20,
        spacing: 12,
        visible: true
    });

    const title = new Gtk.Label({
        label: '<b>Tastenkürzel für Simple-Tiling</b>',
        use_markup: true,
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.add(title);

    let store = new Gtk.ListStore();
    store.set_column_types([
        GObject.TYPE_STRING, // COLUMN_ID
        GObject.TYPE_STRING, // COLUMN_DESC
        GObject.TYPE_INT,    // COLUMN_KEY
        GObject.TYPE_INT,    // COLUMN_MODS
    ]);

    addKeybinding(store, settings, 'swap-master-window', 'Master-Fenster tauschen');
    addKeybinding(store, settings, 'swap-left-window', 'Fenster nach links tauschen');
    addKeybinding(store, settings, 'swap-right-window', 'Fenster nach rechts tauschen');
    addKeybinding(store, settings, 'swap-up-window', 'Fenster nach oben tauschen');
    addKeybinding(store, settings, 'swap-down-window', 'Fenster nach unten tauschen');
    
    let treeView = new Gtk.TreeView({
        model: store,
        headers_visible: false,
        hexpand: true,
        visible: true
    });

    let descRenderer = new Gtk.CellRendererText();
    let descColumn = new Gtk.TreeViewColumn({ expand: true });
    descColumn.pack_start(descRenderer, true);
    descColumn.add_attribute(descRenderer, 'text', COLUMN_DESC);
    treeView.append_column(descColumn);

    let accelRenderer = new Gtk.CellRendererAccel({
        'accel-mode': Gtk.CellRendererAccelMode.GTK,
        'editable': true
    });
    let accelColumn = new Gtk.TreeViewColumn();
    accelColumn.pack_end(accelRenderer, false);
    accelColumn.add_attribute(accelRenderer, 'accel-key', COLUMN_KEY);
    accelColumn.add_attribute(accelRenderer, 'accel-mods', COLUMN_MODS);
    treeView.append_column(accelColumn);
    
    prefsWidget.add(treeView);

    accelRenderer.connect('accel-edited', (renderer, path_string, key, mods, hw_code) => {
        let [ok, iter] = store.get_iter_from_string(path_string);
        if (!ok) return;

        store.set(iter, [COLUMN_KEY, COLUMN_MODS], [key, mods]);

        let id = store.get_value(iter, COLUMN_ID);
        let accelString = Gtk.accelerator_name(key, mods);
        settings.set_strv(id, [accelString]);
    });

    accelRenderer.connect('accel-cleared', (renderer, path_string) => {
        let [ok, iter] = store.get_iter_from_string(path_string);
        if (!ok) return;

        store.set(iter, [COLUMN_KEY, COLUMN_MODS], [0, 0]);
        let id = store.get_value(iter, COLUMN_ID);
        settings.set_strv(id, []);
    });

    return prefsWidget;
}

function addKeybinding(model, settings, id, description) {
    let [key, mods] = [0, 0];
    
    const strv = settings.get_strv(id);
    if (strv && strv.length > 0 && strv[0]) {
        [key, mods] = Gtk.accelerator_parse(strv[0]);
    }

    let iter = model.append();
    model.set(iter, 
        [COLUMN_ID, COLUMN_DESC, COLUMN_KEY, COLUMN_MODS], 
        [id, description, key, mods]
    );
}
