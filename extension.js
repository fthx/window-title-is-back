//    Window Title Is Back
//    GNOME Shell extension
//    @fthx 2023
//    Puts the app/icon/title of the focused window in the GNOME Shell top panel


import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';


const WindowTitleIndicator = GObject.registerClass(
class WindowTitleIndicator extends PanelMenu.Button {
    _init() {
        super._init();

        this._indicator = new St.BoxLayout({style_class: 'panel-button'});

        this._icon = new St.Icon({});
        this._icon.set_fallback_gicon(null);
        this._indicator.add_child(this._icon);

        this._app = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._indicator.add_child(this._app);

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

        if (this._focused_window && !this._focused_window.skip_taskbar) {
            this._focused_app = Shell.WindowTracker.get_default().get_window_app(this._focused_window);
            if (this._focused_app) {
                this._focused_window_button._icon.set_gicon(this._focused_app.get_icon());
                this._focused_window_button._app.set_text(this._focused_app.get_name() + this._label_padding);
            } else {
                this._focused_window_button._icon.set_icon_name('applications-system-symbolic');
                this._focused_window_button._app.set_text('');
            }
        } else {
            this._focused_window_button._icon.set_gicon(null);
            this._focused_window_button._app.set_text('');
        }

        this._on_focused_window_title_changed();

        if (this._focused_window) {
            this._focused_window_title_changed = this._focused_window.connect("notify::title", this._on_focused_window_title_changed.bind(this));
        }
    }

    _on_focused_window_title_changed() {
        if (this._focused_window && !this._focused_window.skip_taskbar && this._focused_window.get_title()) {
            this._focused_window_button._title.set_text(this._focused_window.get_title());
        } else {
            this._focused_window_button._title.set_text("");
        }
    }

    _minimize_focused_window() {
        if (this._settings.get_boolean('click-to-minimize') && this._focused_window && this._focused_window.can_minimize() && !Main.overview.visible) {
            this._focused_window.minimize();
        }
    }

    _on_settings_changed() {
        this._focused_window_button._icon.visible = this._settings.get_boolean('show-icon');
        this._focused_window_button._app.visible = this._settings.get_boolean('show-app');
        this._focused_window_button._title.visible = this._settings.get_boolean('show-title');

        if (this._settings.get_boolean('show-title')) {
            this._label_padding = '  —  ';
        } else {
            this._label_padding = '';
        }

        this._on_focused_window_changed();
    }

    enable() {
        this._focused_window_button = new WindowTitleIndicator();

        this._settings = this.getSettings();
        this._on_settings_changed();
        this._settings_changed = this._settings.connect('changed', this._on_settings_changed.bind(this));

        Main.panel.addToStatusArea('focused-window-indicator', this._focused_window_button, -1, 'left');

        this._focused_window_changed = global.display.connect('notify::focus-window', this._on_focused_window_changed.bind(this));
        this._focused_window_button_pressed = this._focused_window_button.connect('button-release-event', this._minimize_focused_window.bind(this));
    }

    disable() {
        if (this._focused_window_button_pressed) {
            this._focused_window_button.disconnect(this._focused_window_button_pressed);
        }
        this._focused_window_button_pressed = null;

        if (this._focused_window && this._focused_window_title_changed) {
            this._focused_window.disconnect(this._focused_window_title_changed);
        }
        this._focused_window_title_changed = null;

        if (this._focused_window_changed) {
            global.display.disconnect(this._focused_window_changed);
        }
        this._focused_window_changed = null;

        this._focused_window_button.destroy();
        this._focused_window_button = null;

        if (this._settings_changed) {
            this._settings.disconnect(this._settings_changed);
        }
        this._settings_changed = null;
        this._settings = null;
    }
}
