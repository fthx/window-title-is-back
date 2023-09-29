import Gio from 'gi://Gio';
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

        const group = new Adw.PreferencesGroup({
            title: 'Settings',
        });
        page.add(group);

        const row_icon = new Adw.SwitchRow({
            title: 'Show icon',
        });
        group.add(row_icon);
        window._settings.bind('show-icon', row_icon, 'active', Gio.SettingsBindFlags.DEFAULT);

        const row_app = new Adw.SwitchRow({
            title: 'Show window app',
        });
        group.add(row_app);
        window._settings.bind('show-app', row_app, 'active', Gio.SettingsBindFlags.DEFAULT);

        const row_title = new Adw.SwitchRow({
            title: 'Show window title',
        });
        group.add(row_title);
        window._settings.bind('show-title', row_title, 'active', Gio.SettingsBindFlags.DEFAULT);

        const row_minimize = new Adw.SwitchRow({
            title: 'Click to minimize',
        });
        group.add(row_minimize);
        window._settings.bind('click-to-minimize', row_minimize, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}
