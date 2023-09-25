//    Window Title Is Back
//    GNOME Shell extension
//    @fthx 2023
//    Puts the title of the focused window in the GNOME Shell top panel

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';


var WindowTitleIndicator = GObject.registerClass(
class WindowTitleIndicator extends PanelMenu.Button {
    _init() {
        super._init();

        this._indicator = new St.BoxLayout({style_class: 'panel-button'});
        this._icon = new St.Icon({icon_name: 'focus-top-bar-symbolic'});
        this._indicator.add_child(this._icon);
        this._title = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        this._indicator.add_child(this._title);

        this.add_child(this._indicator);
    }
});

export default class WindowTitleIsBackExtension {
    _on_focused_window_changed() {
        if (this._focused_window && this._focused_window_title_changed) {
            this._focused_window.disconnect(this._focused_window_title_changed);
        }

        this._focused_window = global.display.get_focus_window();
        this._on_focused_window_title_changed();

        if (this._focused_window) {
            this._focused_window_title_changed = this._focused_window.connect("notify::title", this._on_focused_window_title_changed.bind(this));
        }
    }

    _on_focused_window_title_changed() {
        if (this._focused_window && this._focused_window.get_title()) {
            this._focused_window_button._title.set_text(this._focused_window.get_title());
        } else {
            this._focused_window_button._title.set_text("");
        }
    }

    _minimize_focused_window() {
        if (this._focused_window && this._focused_window.can_minimize() && !Main.overview.visible) {
            this._focused_window.minimize();
        }
    }

    enable() {
        this._focused_window_button = new WindowTitleIndicator();
        this._on_focused_window_changed();
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
    }
}
