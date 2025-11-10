import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


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
            title: 'Show app',
        });
        group_items.add(row_app);
        window._settings.bind('show-app', row_app, 'active', Gio.SettingsBindFlags.DEFAULT);

        const row_title = new Adw.SwitchRow({
            title: 'Show title',
        });
        group_items.add(row_title);
        window._settings.bind('show-title', row_title, 'active', Gio.SettingsBindFlags.DEFAULT);

        const group_settings = new Adw.PreferencesGroup({
            title: 'Settings',
        });
        page.add(group_settings);

        const row_color = new Adw.SwitchRow({
            title: 'Colored indicator',
        });
        group_settings.add(row_color);
        window._settings.bind('colored-icon', row_color, 'active', Gio.SettingsBindFlags.DEFAULT);

        const row_fixed = new Adw.SwitchRow({
            title: 'Fixed width',
        });
        group_settings.add(row_fixed);
        window._settings.bind('fixed-width', row_fixed, 'active', Gio.SettingsBindFlags.DEFAULT);

        const adjustment_width = new Gtk.Adjustment({
            lower: 5,
            upper: 50,
            step_increment: 5,
        });

        const row_width = new Adw.SpinRow({
            title: 'Indicator width (% of top panel)',
            adjustment: adjustment_width,
        });
        group_settings.add(row_width);
        window._settings.bind('width', row_width, 'value', Gio.SettingsBindFlags.DEFAULT);

        const adjustment_size = new Gtk.Adjustment({
            lower: 12,
            upper: 26,
            step_increment: 1,
        });

        const row_size = new Adw.SpinRow({
            title: 'Icon size (px)',
            adjustment: adjustment_size,
        });
        group_settings.add(row_size);
        window._settings.bind('icon-size', row_size, 'value', Gio.SettingsBindFlags.DEFAULT);

        const adjustment_time = new Gtk.Adjustment({
            lower: 0,
            upper: 300,
            step_increment: 10,
        });

        const row_time = new Adw.SpinRow({
            title: 'Fade in/out time (ms)',
            adjustment: adjustment_time,
        });
        group_settings.add(row_time);
        window._settings.bind('ease-time', row_time, 'value', Gio.SettingsBindFlags.DEFAULT);
    }
}
