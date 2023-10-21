import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class WindowTitleIsBackExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'Window Title Is Back extension',
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group_items = new Adw.PreferencesGroup({
            title: 'Items',
        });
        page.add(group_items);

        const row_icon = new Adw.SwitchRow({
            title: 'Show icon',
        });
        group_items.add(row_icon);
        window._settings.bind('show-icon', row_icon, 'active', Gio.SettingsBindFlags.DEFAULT);

        const row_app = new Adw.SwitchRow({
            title: 'Show window app',
        });
        group_items.add(row_app);
        window._settings.bind('show-app', row_app, 'active', Gio.SettingsBindFlags.DEFAULT);

        const row_title = new Adw.SwitchRow({
            title: 'Show window title',
        });
        group_items.add(row_title);
        window._settings.bind('show-title', row_title, 'active', Gio.SettingsBindFlags.DEFAULT);

        const group_settings = new Adw.PreferencesGroup({
            title: 'Settings',
        });
        page.add(group_settings);

        const adjustment = new Gtk.Adjustment({
            lower: 12,
            upper: 26,
            step_increment: 1,
        });

        const row_size = new Adw.SpinRow({
            title: 'Icon size',
            adjustment,
        });
        group_settings.add(row_size);
        window._settings.bind('icon-size', row_size, 'value', Gio.SettingsBindFlags.DEFAULT);

        const row_minimize = new Adw.SwitchRow({
            title: 'Click to minimize',
        });
        group_settings.add(row_minimize);
        window._settings.bind('click-to-minimize', row_minimize, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}
