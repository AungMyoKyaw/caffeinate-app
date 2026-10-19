mod caffeinate;
mod store;

use caffeinate::{
    get_caffeinate_status, start_caffeinate, start_wake_session, stop_caffeinate,
    update_wake_session, CaffeinateController, CaffeinateStatus, SessionOptions,
};
use std::{
    str::FromStr,
    sync::atomic::{AtomicBool, Ordering},
    thread,
    time::Duration,
};
use store::{
    clear_history, create_schedule, delete_profile, delete_schedule, get_app_data, save_profile,
    set_schedule_enabled, AppStore, Preferences,
};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, RunEvent, WindowEvent,
};
use tauri_plugin_autostart::ManagerExt as AutostartExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_notification::NotificationExt;

static QUITTING: AtomicBool = AtomicBool::new(false);

struct TrayToggleItem {
    item: tauri::menu::MenuItem<tauri::Wry>,
}

fn change_session_option(
    app: &AppHandle,
    selected_mode: Option<caffeinate::WakeMode>,
    selected_timeout: Option<u64>,
) -> Result<(), String> {
    let controller = app.state::<CaffeinateController>();
    let store = app.state::<AppStore>();
    let status = controller.status()?;
    let snapshot = store.snapshot()?;
    let mode = selected_mode.unwrap_or({
        if status.active {
            status.wake_mode
        } else {
            snapshot.preferences.wake_mode
        }
    });
    let duration = if selected_mode.is_some() {
        if status.active {
            status.timeout_seconds
        } else {
            snapshot.preferences.timeout_seconds
        }
    } else {
        selected_timeout
    };
    let options = SessionOptions {
        wake_mode: mode,
        timeout_seconds: duration,
    };
    if status.active {
        controller.update(options, status.revision.into())?;
    }
    let mut pref = snapshot.preferences;
    pref.wake_mode = mode;
    pref.timeout_seconds = duration;
    store.change_preferences(pref)?;
    let _ = app.emit("preferences-changed", ());
    sync_app(app);
    Ok(())
}

fn open_window(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}
fn stop_now(app: &AppHandle, reason: &str) {
    let ctrl = app.state::<CaffeinateController>();
    let _ = ctrl.stop_with_reason(reason);
    sync_app(app);
}
fn start_default(app: &AppHandle) {
    let options = app.state::<AppStore>().snapshot().map(|d| SessionOptions {
        wake_mode: d.preferences.wake_mode,
        timeout_seconds: d.preferences.timeout_seconds,
    });
    if let Ok(options) = options {
        let _ = app.state::<CaffeinateController>().start_session(options);
    }
    sync_app(app);
}
fn toggle_now(app: &AppHandle) {
    let active = app
        .state::<CaffeinateController>()
        .status()
        .map(|s| s.active)
        .unwrap_or(false);
    if active {
        stop_now(app, "manual");
    } else {
        start_default(app);
    }
}
fn label_for(s: &CaffeinateStatus) -> String {
    if !s.active {
        "Ready".to_string()
    } else if let Some(seconds) = s.remaining_seconds {
        let minutes = seconds.div_ceil(60);
        if minutes >= 60 {
            format!("{}h {:02}m", minutes / 60, minutes % 60)
        } else {
            format!("{minutes}m")
        }
    } else {
        "Awake".to_string()
    }
}
fn sync_app(app: &AppHandle) {
    let ctrl = app.state::<CaffeinateController>();
    let status = match ctrl.status() {
        Ok(status) => status,
        Err(_) => return,
    };
    if let Some(tray) = app.tray_by_id("caffeinate") {
        let _ = tray.set_title(Some(&label_for(&status)));
    }
    if let Some(toggle) = app.try_state::<TrayToggleItem>() {
        let _ = toggle.item.set_text(if status.active {
            "Stop Session"
        } else {
            "Keep Mac Awake"
        });
    }
    // Event also wakes any open Svelte view; webview may be hidden.
    let _ = app.emit("wake-status", status);
}
fn monitor_loop(app: AppHandle) {
    let mut warned_battery = false;
    let mut battery_check_tick = 0u8;
    loop {
        if QUITTING.load(Ordering::Relaxed) {
            break;
        }
        let ctrl = app.state::<CaffeinateController>();
        let store = app.state::<AppStore>();
        let _ = store.schedule_tick(&ctrl);
        if let Ok(events) = store.sync_history(&ctrl) {
            if !events.is_empty() {
                if let Ok(data) = store.snapshot() {
                    if data.preferences.notifications {
                        for entry in &events {
                            if entry.end_reason == "timeout" {
                                let _ = app
                                    .notification()
                                    .builder()
                                    .title("Caffeinate")
                                    .body("Wake session ended.")
                                    .show();
                            }
                        }
                    }
                }
            }
        }
        if let Ok(status) = ctrl.status() {
            if !status.active {
                warned_battery = false;
                battery_check_tick = 0;
            } else if battery_check_tick == 0 {
                if let Ok(data) = store.snapshot() {
                    if data.preferences.battery_warning {
                        let low = battery_low();
                        if low && !warned_battery {
                            warned_battery = true;
                            let _ = app.notification().builder().title("Caffeinate")
                                .body("Battery is at or below 15% while your Mac is being kept awake.")
                                .show();
                            let _ = app.emit(
                                "battery-warning",
                                "Battery is low. The wake session is still active.",
                            );
                        } else if !low {
                            warned_battery = false;
                        }
                    }
                }
            }
            if status.active {
                battery_check_tick = (battery_check_tick + 1) % 60;
            }
        }
        sync_app(&app);
        thread::sleep(Duration::from_secs(1));
    }
}
// Fixed local macOS utility, no shell or user-provided executable arguments.
fn battery_low() -> bool {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let Ok(result) = Command::new("/usr/bin/pmset").args(["-g", "batt"]).output() else {
            return false;
        };
        let output = String::from_utf8_lossy(&result.stdout);
        if !output.contains("Battery Power") {
            return false;
        }
        for chunk in output.split_whitespace() {
            if let Some(value) = chunk
                .trim_matches(|c: char| !c.is_ascii_digit() && c != '%')
                .strip_suffix('%')
                .and_then(|p| p.parse::<u8>().ok())
            {
                if value <= 15 {
                    return true;
                }
            }
        }
        false
    }
    #[cfg(not(target_os = "macos"))]
    {
        false
    }
}

#[tauri::command]
fn save_settings(preferences: Preferences, app: AppHandle) -> Result<store::AppData, String> {
    if !matches!(preferences.theme.as_str(), "light" | "dark" | "system")
        || !store::valid_timeout(preferences.timeout_seconds)
    {
        return Err("Invalid preferences.".into());
    }
    // Try all native registrations first; rollback old shortcuts on failure.
    let old = app.state::<AppStore>().snapshot()?.preferences;
    let shortcut = app.global_shortcut();
    let parse = |s: &str| -> Result<Option<Shortcut>, String> {
        if s.trim().is_empty() {
            Ok(None)
        } else {
            Shortcut::from_str(s)
                .map(Some)
                .map_err(|e| format!("Invalid shortcut: {e}"))
        }
    };
    let bindings = [
        parse(&preferences.toggle_shortcut)?,
        parse(&preferences.show_shortcut)?,
    ];
    if bindings[0].is_some() && bindings[0] == bindings[1] {
        return Err("Choose two different global shortcuts.".into());
    }
    shortcut.unregister_all().map_err(|e| e.to_string())?;
    let result = (|| -> Result<(), String> {
        for s in bindings.iter().flatten() {
            shortcut.register(*s).map_err(|e| e.to_string())?;
        }
        Ok(())
    })();
    if let Err(e) = result {
        let _ = shortcut.unregister_all();
        for s in [&old.toggle_shortcut, &old.show_shortcut] {
            if let Ok(Some(v)) = parse(s) {
                let _ = shortcut.register(v);
            }
        }
        return Err(format!(
            "Could not register shortcut; previous shortcuts restored: {e}"
        ));
    }
    let auto = app.autolaunch();
    let auto_result = if preferences.launch_at_login == old.launch_at_login {
        Ok(())
    } else if preferences.launch_at_login {
        auto.enable()
    } else {
        auto.disable()
    };
    if let Err(e) = auto_result {
        // Login registration is not guaranteed in all dev/unbundled environments.
        let _ = shortcut.unregister_all();
        for s in [&old.toggle_shortcut, &old.show_shortcut] {
            if let Ok(Some(v)) = parse(s) {
                let _ = shortcut.register(v);
            }
        }
        return Err(format!("Could not apply launch-at-login preference: {e}"));
    }
    app.state::<AppStore>().change_preferences(preferences)
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItemBuilder::with_id("open", "Open Caffeinate").build(app)?;
    let toggle = MenuItemBuilder::with_id("toggle", "Keep Mac Awake").build(app)?;
    let preferences = MenuItemBuilder::with_id("prefs", "Preferences…").build(app)?;
    let profiles = MenuItemBuilder::with_id("profiles", "Profiles…").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit Caffeinate").build(app)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let mode_menu = SubmenuBuilder::new(app, "Wake mode")
        .text("mode-system", "System")
        .text("mode-display", "Display")
        .text("mode-both", "Both")
        .build()?;
    let duration_menu = SubmenuBuilder::new(app, "Duration")
        .text("preset-indefinite", "Until stopped")
        .text("preset-1800", "30 minutes")
        .text("preset-3600", "1 hour")
        .text("preset-7200", "2 hours")
        .text("preset-14400", "4 hours")
        .build()?;
    let menu = MenuBuilder::new(app)
        .item(&open)
        .item(&toggle)
        .item(&separator)
        .item(&mode_menu)
        .item(&duration_menu)
        .item(&profiles)
        .item(&preferences)
        .item(&quit)
        .build()?;
    app.manage(TrayToggleItem { item: toggle });
    let _tray = TrayIconBuilder::with_id("caffeinate")
        .icon(Image::from_bytes(include_bytes!(
            "../icons/horizon-tray@2x.png"
        ))?)
        .icon_as_template(true)
        .title("Ready")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, e| match e.id().as_ref() {
            "open" | "prefs" => {
                open_window(app);
                if e.id().as_ref() == "prefs" {
                    let _ = app.emit("show-view", "preferences");
                }
            }
            "toggle" => toggle_now(app),
            "profiles" => {
                open_window(app);
                let _ = app.emit("show-view", "profiles");
            }
            id if id.starts_with("preset-") => {
                let timeout_seconds = id
                    .strip_prefix("preset-")
                    .and_then(|v| v.parse::<u64>().ok());
                let _ = change_session_option(app, None, timeout_seconds);
            }
            id if id.starts_with("mode-") => {
                let mode = match id {
                    "mode-system" => Some(caffeinate::WakeMode::System),
                    "mode-display" => Some(caffeinate::WakeMode::Display),
                    "mode-both" => Some(caffeinate::WakeMode::Both),
                    _ => None,
                };
                if let Some(mode) = mode {
                    let _ = change_session_option(app, Some(mode), None);
                }
            }
            "quit" => {
                QUITTING.store(true, Ordering::Relaxed);
                stop_now(app, "quit");
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                open_window(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    if let Ok(d) = app.state::<AppStore>().snapshot() {
                        if Shortcut::from_str(&d.preferences.toggle_shortcut)
                            .is_ok_and(|v| &v == shortcut)
                        {
                            toggle_now(app);
                        } else if Shortcut::from_str(&d.preferences.show_shortcut)
                            .is_ok_and(|v| &v == shortcut)
                        {
                            open_window(app);
                        }
                    }
                })
                .build(),
        )
        .manage(CaffeinateController::default())
        .invoke_handler(tauri::generate_handler![
            start_caffeinate,
            stop_caffeinate,
            get_caffeinate_status,
            start_wake_session,
            update_wake_session,
            save_settings,
            get_app_data,
            save_profile,
            delete_profile,
            create_schedule,
            delete_schedule,
            set_schedule_enabled,
            clear_history
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let store = AppStore::load(&handle).map_err(std::io::Error::other)?;
            app.manage(store);
            setup_tray(&handle)?;
            if let Ok(d) = handle.state::<AppStore>().snapshot() {
                if d.preferences.launch_at_login {
                    let _ = handle.autolaunch().enable();
                }
                for key in [&d.preferences.toggle_shortcut, &d.preferences.show_shortcut] {
                    if let Ok(s) = Shortcut::from_str(key) {
                        let _ = handle.global_shortcut().register(s);
                    }
                }
            }
            thread::spawn(move || monitor_loop(handle));
            Ok(())
        })
        .on_window_event(|w, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = w.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building Caffeinate");
    app.run(|app_handle, event| {
        if let RunEvent::Exit = event {
            QUITTING.store(true, Ordering::Relaxed);
            let ctrl = app_handle.state::<CaffeinateController>();
            if let Err(e) = ctrl.cleanup() {
                eprintln!("Caffeinate cleanup failed: {e}");
            }
            let _ = app_handle.state::<AppStore>().sync_history(&ctrl);
        }
    });
}
