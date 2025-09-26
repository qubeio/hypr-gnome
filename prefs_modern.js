///////////////////////////////////////////////////////////////
//     Simple-Tiling – MODERN MENU (GNOME Shell 45+)         //
//                   © 2025 domoel – MIT                     //
///////////////////////////////////////////////////////////////

// ── GLOBAL IMPORTS ────────────────────────────────────────
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class SimpleTilingPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        window.add(page);

        // ── WINDOW GAPS ────────────────────────────────────────────
        const groupGaps = new Adw.PreferencesGroup({
            title: 'Window Gaps',
            description: 'Adjust spacing between windows and screen edges.'
        });
        page.add(groupGaps);

        const rowInnerGap = new Adw.SpinRow({
            title: 'Inner Gap',
            subtitle: 'Space between tiled windows (pixels)',
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
        });
        groupGaps.add(rowInnerGap);
        settings.bind('inner-gap', rowInnerGap, 'value', Gio.SettingsBindFlags.DEFAULT);

        const rowOuterH = new Adw.SpinRow({
            title: 'Outer Gap (horizontal)',
            subtitle: 'Left / right screen edges (pixels)',
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
        });
        groupGaps.add(rowOuterH);
        settings.bind('outer-gap-horizontal', rowOuterH, 'value', Gio.SettingsBindFlags.DEFAULT);

        const rowOuterV = new Adw.SpinRow({
            title: 'Outer Gap (vertical)',
            subtitle: 'Top / bottom screen edges (pixels)',
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
        });
        groupGaps.add(rowOuterV);
        settings.bind('outer-gap-vertical', rowOuterV, 'value', Gio.SettingsBindFlags.DEFAULT);

        // ── WINDOW BEHAVIOR ────────────────────────────────────────────
        const groupBehavior = new Adw.PreferencesGroup({ title: 'Window Behavior' });
        page.add(groupBehavior);

        const rowNewWindow = new Adw.ComboRow({
            title: 'Open new windows as',
            subtitle: 'Whether a new window starts as Master or Stack',
            model: new Gtk.StringList({
                strings: ['Stack Window (Default)', 'Master Window'],
            }),
        });
        groupBehavior.add(rowNewWindow);

        const currentBehavior = settings.get_string('new-window-behavior');
        rowNewWindow.selected = currentBehavior === 'master' ? 1 : 0;

        rowNewWindow.connect('notify::selected', () => {
            const newVal = rowNewWindow.selected === 1 ? 'master' : 'stack';
            settings.set_string('new-window-behavior', newVal);
        });

        // ── WINDOW HIGHLIGHTING ────────────────────────────────────────────
        const groupHighlighting = new Adw.PreferencesGroup({
            title: 'Window Highlighting',
            description: 'Configure visual highlighting for focused windows.'
        });
        page.add(groupHighlighting);

        // Enable highlighting toggle
        const rowEnableHighlighting = new Adw.SwitchRow({
            title: 'Enable Window Highlighting',
            subtitle: 'Show a visual border around the currently focused window'
        });
        groupHighlighting.add(rowEnableHighlighting);
        settings.bind('enable-window-highlighting', rowEnableHighlighting, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Highlight thickness
        const rowHighlightThickness = new Adw.SpinRow({
            title: 'Border Thickness',
            subtitle: 'Thickness of the highlight border in pixels',
            adjustment: new Gtk.Adjustment({ lower: 1, upper: 20, step_increment: 1 }),
        });
        groupHighlighting.add(rowHighlightThickness);
        settings.bind('highlight-border-thickness', rowHighlightThickness, 'value', Gio.SettingsBindFlags.DEFAULT);


        // Catppuccin color scheme selection
        const rowCatppuccinScheme = new Adw.ComboRow({
            title: 'Catppuccin Color Scheme',
            subtitle: 'Choose the Catppuccin color scheme variant',
            model: new Gtk.StringList({
                strings: ['Frappe', 'Latte', 'Macchiato', 'Mocha'],
            }),
        });
        groupHighlighting.add(rowCatppuccinScheme);

        const currentScheme = settings.get_string('catppuccin-color-scheme');
        const schemeMap = { 'frappe': 0, 'latte': 1, 'macchiato': 2, 'mocha': 3 };
        rowCatppuccinScheme.selected = schemeMap[currentScheme] || 0;

        rowCatppuccinScheme.connect('notify::selected', () => {
            const schemeNames = ['frappe', 'latte', 'macchiato', 'mocha'];
            const newScheme = schemeNames[rowCatppuccinScheme.selected];
            settings.set_string('catppuccin-color-scheme', newScheme);
        });

        // Catppuccin accent color selection
        const rowCatppuccinAccent = new Adw.ComboRow({
            title: 'Accent Color',
            subtitle: 'Choose the accent color from the Catppuccin palette',
            model: new Gtk.StringList({
                strings: ['Lavender', 'Blue', 'Rosewater', 'Flamingo', 'Pink', 'Mauve', 'Red', 'Maroon', 'Green', 'Teal', 'Yellow', 'Peach'],
            }),
        });
        groupHighlighting.add(rowCatppuccinAccent);

        const currentAccent = settings.get_string('catppuccin-accent-color');
        const accentMap = { 
            'lavender': 0, 'blue': 1, 'rosewater': 2, 'flamingo': 3, 
            'pink': 4, 'mauve': 5, 'red': 6, 'maroon': 7, 
            'green': 8, 'teal': 9, 'yellow': 10, 'peach': 11 
        };
        rowCatppuccinAccent.selected = accentMap[currentAccent] || 0;

        rowCatppuccinAccent.connect('notify::selected', () => {
            const accentNames = ['lavender', 'blue', 'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'green', 'teal', 'yellow', 'peach'];
            const newAccent = accentNames[rowCatppuccinAccent.selected];
            settings.set_string('catppuccin-accent-color', newAccent);
        });


        // ── KEYBINDINGS ────────────────────────────────────────────
        const groupKeys = new Adw.PreferencesGroup({ title: 'Keybindings' });
        page.add(groupKeys);

        const rowKeys = new Adw.ActionRow({
            title: 'Configure Shortcuts',
            subtitle: 'Adjust all shortcuts in GNOME Keyboard settings.',
        });
        groupKeys.add(rowKeys);

        const btnOpenKeyboard = new Gtk.Button({ label: 'Open Keyboard Settings' });
        btnOpenKeyboard.connect('clicked', () => {
            const appInfo = Gio.AppInfo.create_from_commandline(
                'gnome-control-center keyboard', null, Gio.AppInfoCreateFlags.NONE
            );
            appInfo.launch([], null);
        });
        rowKeys.add_suffix(btnOpenKeyboard);
        rowKeys.set_activatable_widget(btnOpenKeyboard);
    }
}
