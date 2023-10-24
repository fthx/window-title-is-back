//    Window Title Is Back
//    GNOME Shell extension
//    @fthx 2023
//    Puts the app/icon/title of the focused window in the GNOME Shell top panel


import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {AppMenu} from 'resource:///org/gnome/shell/ui/appMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';


const WindowTitleIndicator = GObject.registerClass(
class WindowTitleIndicator extends PanelMenu.Button {
    _init() {
        super._init();

        this._menu_manager = Main.panel.menuManager;
        this._menu = new AppMenu(this);
        this.setMenu(this._menu);
        this._menu_manager.addMenu(this._menu);

        this._desaturate_effect = new Clutter.DesaturateEffect();

        this._indicator = new St.BoxLayout({style_class: 'panel-button'});

        this._icon = new St.Icon({});
        this._icon.set_fallback_gicon(null);
        this._indicator.add_child(this._icon);

        this._icon_padding = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._indicator.add_child(this._icon_padding);

        this._app = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._indicator.add_child(this._app);

        this._app_padding = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._indicator.add_child(this._app_padding);

        this._title = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._indicator.add_child(this._title);

        this.add_child(this._indicator);
    }
});

export default class WindowTitleIsBackExtension extends Extension {
    _on_focused_window_changed() {
        if (Main.sessionMode.isLocked) {
            return;
        }

        if (this._focused_window && this._focused_window_title_changed) {
            this._focused_window.disconnect(this._focused_window_title_changed);
        }

        this._focused_window = global.display.get_focus_window();

        if (this._focused_window && (this._focused_window.get_window_type() == Meta.WindowType.MODAL_DIALOG)) {
            return;
        }

        if (this._focused_window && !this._focused_window.skip_taskbar) {
            this._focused_app = Shell.WindowTracker.get_default().get_window_app(this._focused_window);
            if (this._focused_app) {
                this._indicator._icon.set_gicon(this._focused_app.get_icon());
                this._indicator._app.set_text(this._focused_app.get_name());

                if (this._settings.get_boolean('show-app') && this._settings.get_boolean('show-title')) {
                    this._indicator._app_padding.set_text('   —   ');
                } else {
                    this._indicator._app_padding.set_text('');
                }

                this._indicator.menu.setApp(this._focused_app);
            } else {
                this._indicator._icon.set_icon_name('applications-system-symbolic');
                this._indicator._app.set_text('');
                this._indicator._app_padding.set_text('');
            }
        } else {
            this._indicator._icon.set_gicon(null);
            this._indicator._app.set_text('');
            this._indicator._app_padding.set_text('');
        }

        this._on_focused_window_title_changed();

        if (this._focused_window) {
            this._focused_window_title_changed = this._focused_window.connect("notify::title", this._on_focused_window_title_changed.bind(this));
        }
    }

    _on_focused_window_title_changed() {
        if (this._focused_window && !this._focused_window.skip_taskbar && this._focused_window.get_title()) {
            this._indicator._title.set_text(this._focused_window.get_title());
        } else {
            this._indicator._title.set_text('');
        }
    }

    _on_settings_changed() {
        this._indicator._icon.visible = this._settings.get_boolean('show-icon');
        this._indicator._app.visible = this._settings.get_boolean('show-app');
        this._indicator._title.visible = this._settings.get_boolean('show-title');

        if (this._settings.get_boolean('show-icon')) {
            this._indicator._icon_padding.set_text('   ');
        } else {
            this._indicator._icon_padding.set_text('');
        }

        if (this._settings.get_boolean('show-app') && this._settings.get_boolean('show-title')) {
            this._indicator._app_padding.set_text('   —   ');
        } else {
            this._indicator._app_padding.set_text('');
        }

        if (this._settings.get_boolean('colored-icon')) {
            this._indicator._icon.set_style_class_name('');
            this._indicator.remove_effect(this._indicator._desaturate_effect);
        } else {
            this._indicator._icon.set_style_class_name('app-menu-icon');
            this._indicator.add_effect(this._indicator._desaturate_effect);
        }

        this._indicator._icon.set_icon_size(this._settings.get_int('icon-size'));

        this._on_focused_window_changed();
    }

    enable() {
        this._indicator = new WindowTitleIndicator();

        this._settings = this.getSettings();
        this._on_settings_changed();
        this._settings_changed = this._settings.connect('changed', this._on_settings_changed.bind(this));

        Main.panel.addToStatusArea('focused-window-indicator', this._indicator, -1, 'left');

        this._focused_window_changed = global.display.connect('notify::focus-window', this._on_focused_window_changed.bind(this));

        this._overview_showing = Main.overview.connect('showing', this._on_focused_window_changed.bind(this));
        this._overview_hiding = Main.overview.connect('hiding', this._on_focused_window_changed.bind(this));

        this._icon_theme_changed = St.TextureCache.get_default().connect('icon-theme-changed', this._on_focused_window_changed.bind(this));
    }

    disable() {
        if (this._focused_window && this._focused_window_title_changed) {
            this._focused_window.disconnect(this._focused_window_title_changed);
        }
        this._focused_window_title_changed = null;

        if (this._focused_window_changed) {
            global.display.disconnect(this._focused_window_changed);
        }
        this._focused_window_changed = null;

        if (this._overview_showing) {
            Main.overview.disconnect(this._overview_showing);
        }
        this._overview_showing = null;

        if (this._overview_hiding) {
            Main.overview.disconnect(this._overview_hiding);
        }
        this._overview_hiding = null;

        if (this._icon_theme_changed) {
            St.TextureCache.get_default().disconnect(this._icon_theme_changed);
        }
        this._icon_theme_changed =  null;

        this._indicator.destroy();
        this._indicator = null;

        if (this._settings_changed) {
            this._settings.disconnect(this._settings_changed);
        }
        this._settings_changed = null;
        this._settings = null;
    }
}
