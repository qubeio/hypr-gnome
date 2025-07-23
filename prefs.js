// prefs.js - Finale Version nach dem Vorbild von Focus-Switcher

'use strict';

const { Gtk, GObject } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

// Definiere die Spalten für unser Datenmodell
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

    // 1. Das Datenmodell (ListStore) erstellen
    let store = new Gtk.ListStore();
    store.set_column_types([
        GObject.TYPE_STRING, // COLUMN_ID
        GObject.TYPE_STRING, // COLUMN_DESC
        GObject.TYPE_INT,    // COLUMN_KEY
        GObject.TYPE_INT,    // COLUMN_MODS
    ]);

    // Fülle das Datenmodell mit unseren Einstellungen
    addKeybinding(store, settings, 'swap-master-window', 'Master-Fenster tauschen');
    addKeybinding(store, settings, 'swap-left-window', 'Fenster nach links tauschen');
    addKeybinding(store, settings, 'swap-right-window', 'Fenster nach rechts tauschen');
    addKeybinding(store, settings, 'swap-up-window', 'Fenster nach oben tauschen');
    addKeybinding(store, settings, 'swap-down-window', 'Fenster nach unten tauschen');
    
    // 2. Die Ansicht (TreeView) erstellen, die das Modell anzeigt
    let treeView = new Gtk.TreeView({
        model: store,
        headers_visible: false,
        hexpand: true,
        visible: true
    });

    // Erstelle die Spalte für die Beschreibung
    let descRenderer = new Gtk.CellRendererText();
    let descColumn = new Gtk.TreeViewColumn({ expand: true });
    descColumn.pack_start(descRenderer, true);
    descColumn.add_attribute(descRenderer, 'text', COLUMN_DESC);
    treeView.append_column(descColumn);

    // 3. Erstelle die Spalte für das Tastenkürzel mit dem Spezialisten Gtk.CellRendererAccel
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

    // Verbinde die Events, die ausgelöst werden, wenn der Nutzer ein Kürzel ändert
    accelRenderer.connect('accel-edited', (renderer, path_string, key, mods, hw_code) => {
        let [ok, iter] = store.get_iter_from_string(path_string);
        if (!ok) return;

        // Aktualisiere das Datenmodell...
        store.set(iter, [COLUMN_KEY, COLUMN_MODS], [key, mods]);

        // ...und speichere die Änderung in den GSettings
        let id = store.get_value(iter, COLUMN_ID);
        let accelString = Gtk.accelerator_name(key, mods);
        settings.set_strv(id, [accelString]);
    });

    // Event für das Löschen eines Kürzels (z.B. mit Backspace)
    accelRenderer.connect('accel-cleared', (renderer, path_string) => {
        let [ok, iter] = store.get_iter_from_string(path_string);
        if (!ok) return;

        store.set(iter, [COLUMN_KEY, COLUMN_MODS], [0, 0]);
        let id = store.get_value(iter, COLUMN_ID);
        settings.set_strv(id, []);
    });

    return prefsWidget;
}

// Hilfsfunktion zum Befüllen des Datenmodells
function addKeybinding(model, settings, id, description) {
    let [key, mods] = [0, 0];
    
    // KORREKTUR: Leerzeichen zwischen const und strv eingefügt
    const strv = settings.get_strv(id);
    if (strv && strv.length > 0 && strv[0]) {
        [key, mods] = Gtk.accelerator_parse(strv[0]);
    }

    // Füge eine neue Zeile zum Datenmodell hinzu
    let iter = model.append();
    model.set(iter, 
        [COLUMN_ID, COLUMN_DESC, COLUMN_KEY, COLUMN_MODS], 
        [id, description, key, mods]
    );
}
