//    Window Title Is Back
//    GNOME Shell extension
//    @fthx 2023


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

        this._menu = new AppMenu(this);
        this.setMenu(this._menu);
        this._menu.setSourceAlignment(0.2);
        Main.panel.menuManager.addMenu(this._menu);

        this._desaturate_effect = new Clutter.DesaturateEffect();

        this._box = new St.BoxLayout({style_class: 'panel-button'});

        this._icon = new St.Icon({});
        this._icon.set_fallback_gicon(null);
        this._box.add_child(this._icon);

        this._icon_padding = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._box.add_child(this._icon_padding);

        this._app = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._box.add_child(this._app);

        this._app_padding = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._box.add_child(this._app_padding);

        this._title = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._box.add_child(this._title);

        this.add_actor(this._box);
    }
});

export default class WindowTitleIsBackExtension extends Extension {
    _on_focused_window_changed() {
        if (Main.sessionMode.isLocked) {
            return;
        }

        if (this._focused_window) {
            this._focused_window.disconnectObject(this);
        }
        this._focused_window = global.display.get_focus_window();

        if (this._focused_window && (this._focused_window.get_window_type() == Meta.WindowType.MODAL_DIALOG)) {
            return;
        }

        if (this._focused_window && !this._focused_window.skip_taskbar) {
            this._set_window_app();
            this._set_window_title();

            this._indicator.show();

            this._focused_window.connectObject('notify::title', this._set_window_title.bind(this), this);
        } else {
            if ((!this._focused_window && !this._indicator._menu.isOpen) || (this._focused_window && this._focused_window.skip_taskbar)) {
                this._indicator.hide();
            }
        }
    }

    _set_window_app() {
        this._focused_app = Shell.WindowTracker.get_default().get_window_app(this._focused_window);

        if (this._focused_app) {
            this._indicator._icon.set_gicon(this._focused_app.get_icon());
            this._indicator._app.set_text(this._focused_app.get_name());

            this._indicator.menu.setApp(this._focused_app);
        }
    }

    _set_window_title() {
        if (this._focused_window) {
            this._indicator._title.set_text(this._focused_window.get_title());
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
        this._settings.connectObject('changed', this._on_settings_changed.bind(this), this);

        Main.panel.addToStatusArea('focused-window-indicator', this._indicator, -1, 'left');

        global.display.connectObject('notify::focus-window', this._on_focused_window_changed.bind(this), this);
        St.TextureCache.get_default().connectObject('icon-theme-changed', this._on_focused_window_changed.bind(this), this);
    }

    disable() {
        this._settings.disconnectObject(this);
        this._settings_changed = null;
        this._settings = null;

        if (this._focused_window) {
            this._focused_window.disconnectObject(this);
        }
        global.display.disconnectObject(this);
        St.TextureCache.get_default().disconnectObject(this);

        Main.panel.menuManager.removeMenu(this._indicator.menu);
        this._indicator.menu = null;
        this._indicator.destroy();
        this._indicator = null;
    }
}
