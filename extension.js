//    Window Title Is Back
//    GNOME Shell extension
//    @fthx 2025


import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import { AppMenu } from 'resource:///org/gnome/shell/ui/appMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';


const WindowTitleIndicator = GObject.registerClass(
    class WindowTitleIndicator extends PanelMenu.Button {
        _init(settings) {
            super._init();

            this._settings = settings;

            this._menu = new AppMenu(this);
            this.setMenu(this._menu);
            this._menu.setSourceAlignment(0.3);
            Main.panel.menuManager.addMenu(this._menu);

            this._desaturate_effect = new Clutter.DesaturateEffect();

            this._box = new St.BoxLayout({ style_class: 'panel-button' });

            this._icon = new St.Icon({});
            this._icon.set_fallback_gicon(null);
            this._box.add_child(this._icon);

            this._icon_padding = new St.Label({ y_align: Clutter.ActorAlign.CENTER });
            this._box.add_child(this._icon_padding);

            this._app = new St.Label({ y_align: Clutter.ActorAlign.CENTER });
            this._box.add_child(this._app);

            this._app_padding = new St.Label({ y_align: Clutter.ActorAlign.CENTER });
            this._box.add_child(this._app_padding);

            this._title = new St.Label({ y_align: Clutter.ActorAlign.CENTER });
            this._box.add_child(this._title);

            this.add_child(this._box);

            global.display.connectObject('notify::focus-window', this._on_focused_window_changed.bind(this), this);
            St.TextureCache.get_default().connectObject('icon-theme-changed', this._on_focused_window_changed.bind(this), this);
        }

        _fade_in() {
            this.remove_all_transitions();

            this.ease({
                opacity: 255,
                duration: this._ease_time,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => this.show(),
            });
        }

        _fade_out() {
            this.remove_all_transitions();

            this.ease({
                opacity: 0,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                duration: this._ease_time,
                onComplete: () => this.hide(),
            });
        }

        _sync() {
            this.remove_all_transitions();

            this.ease({
                opacity: 0,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                duration: this._ease_time,
                onComplete: () => {
                    this._set_window_app();
                    this._set_window_title();
                    this._fade_in();
                },
            });
        }

        _on_focused_window_changed() {
            if (Main.sessionMode.isLocked)
                return;

            if (this._focused_window)
                this._focused_window.disconnectObject(this);
            this._focused_window = global.display.get_focus_window();

            if (this._focused_window &&
                (!this._focused_window.skip_taskbar ||
                    (this._focused_window.get_window_type() == Meta.WindowType.MODAL_DIALOG))) {
                this._sync();

                if (this._settings.get_boolean('show-title'))
                    this._focused_window.connectObject('notify::title', this._sync.bind(this), this);
            }

            if ((!this._focused_window && !this._menu.isOpen) ||
                (this._focused_window && this._focused_window.skip_taskbar &&
                    this._focused_window.get_window_type() != Meta.WindowType.MODAL_DIALOG))
                this._fade_out();
        }

        _set_window_app() {
            this._focused_app = Shell.WindowTracker.get_default().get_window_app(this._focused_window);

            if (this._focused_app) {
                this._icon.set_gicon(this._focused_app.get_icon());
                this._app.set_text(this._focused_app.get_name());

                this.menu.setApp(this._focused_app);
            }
        }

        _set_window_title() {
            if (this._focused_window)
                this._title.set_text(this._focused_window.get_title());
        }

        _destroy() {
            global.display.disconnectObject(this);
            St.TextureCache.get_default().disconnectObject(this);

            if (this._focused_window)
                this._focused_window.disconnectObject(this);
            this._focused_window = null;
            this._focused_app = null;

            Main.panel.menuManager.removeMenu(this.menu);
            this.menu = null;

            super.destroy();
        }
    });

export default class WindowTitleIsBackExtension extends Extension {
    _on_settings_changed() {
        this._indicator._icon.visible = this._settings.get_boolean('show-icon');
        this._indicator._app.visible = this._settings.get_boolean('show-app');
        this._indicator._title.visible = this._settings.get_boolean('show-title');
        this._indicator._ease_time = this._settings.get_int('ease-time');

        if (this._settings.get_boolean('show-icon'))
            this._indicator._icon_padding.set_text('   ');
        else
            this._indicator._icon_padding.set_text('');

        if (this._settings.get_boolean('show-app') && this._settings.get_boolean('show-title'))
            this._indicator._app_padding.set_text('   —   ');
        else
            this._indicator._app_padding.set_text('');

        if (this._settings.get_boolean('colored-icon')) {
            this._indicator._icon.set_style_class_name('');
            this._indicator.remove_effect(this._indicator._desaturate_effect);
        } else {
            this._indicator._icon.set_style_class_name('app-menu-icon');
            this._indicator.add_effect(this._indicator._desaturate_effect);
        }

        this._indicator._icon.set_icon_size(this._settings.get_int('icon-size'));

        if (this._settings.get_boolean('fixed-width'))
            this._indicator.set_width(Main.panel.width * this._settings.get_int('width') / 100);
        else
            this._indicator.set_width(-1);

        this._indicator._on_focused_window_changed();
    }

    enable() {
        this._settings = this.getSettings();

        this._indicator = new WindowTitleIndicator(this._settings);

        this._on_settings_changed();
        this._settings.connectObject('changed', this._on_settings_changed.bind(this), this);

        Main.panel.addToStatusArea('focused-window-indicator', this._indicator, -1, 'left');
    }

    disable() {
        this._settings.disconnectObject(this);
        this._settings = null;

        this._indicator._destroy();
        this._indicator = null;
    }
}
