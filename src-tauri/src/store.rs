use crate::caffeinate::{CaffeinateController, HistoryEntry, SessionOptions, WakeMode};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    sync::{Mutex, MutexGuard},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, State};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Preferences {
    pub theme: String,
    pub wake_mode: WakeMode,
    pub timeout_seconds: Option<u64>,
    pub launch_at_login: bool,
    pub notifications: bool,
    pub battery_warning: bool,
    pub toggle_shortcut: String,
    pub show_shortcut: String,
}
impl Default for Preferences {
    fn default() -> Self {
        Self {
            theme: "system".into(),
            wake_mode: WakeMode::System,
            timeout_seconds: None,
            launch_at_login: false,
            notifications: true,
            battery_warning: true,
            toggle_shortcut: String::new(),
            show_shortcut: String::new(),
        }
    }
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: u64,
    pub name: String,
    pub wake_mode: WakeMode,
    pub timeout_seconds: Option<u64>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub id: u64,
    pub label: String,
    pub kind: String,
    pub trigger_at_unix_ms: u64,
    pub wake_mode: WakeMode,
    pub timeout_seconds: Option<u64>,
    pub outcome: String,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppData {
    pub schema_version: u32,
    pub preferences: Preferences,
    pub profiles: Vec<Profile>,
    pub schedules: Vec<Schedule>,
    pub history: Vec<HistoryEntry>,
    pub scheduled_session_id: Option<u64>,
}
impl Default for AppData {
    fn default() -> Self {
        Self {
            schema_version: 1,
            preferences: Preferences::default(),
            profiles: Vec::new(),
            schedules: Vec::new(),
            history: Vec::new(),
            scheduled_session_id: None,
        }
    }
}
pub struct AppStore {
    data: Mutex<AppData>,
    path: PathBuf,
}
fn current_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
pub fn valid_timeout(s: Option<u64>) -> bool {
    match s {
        None => true,
        Some(seconds) => (60..=86_400).contains(&seconds),
    }
}
impl AppStore {
    pub fn load(app: &AppHandle) -> Result<Self, String> {
        let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Cannot create app settings directory: {e}"))?;
        let path = dir.join("caffeinate-v3.json");
        let data = if path.exists() {
            match fs::read_to_string(&path)
                .ok()
                .and_then(|t| serde_json::from_str::<AppData>(&t).ok())
            {
                Some(data) if data.schema_version == 1 => data,
                _ => {
                    let backup = dir.join(format!("caffeinate-corrupt-{}.json", current_ms()));
                    fs::rename(&path, &backup)
                        .map_err(|e| format!("Cannot preserve invalid configuration: {e}"))?;
                    AppData::default()
                }
            }
        } else {
            AppData::default()
        };
        // An app-owned wake assertion cannot outlive the app-PID guard.
        // A persisted scheduled-session link must not be trusted after restart.
        let mut data = data;
        data.scheduled_session_id = None;
        Ok(Self {
            data: Mutex::new(data),
            path,
        })
    }
    fn lock(&self) -> Result<MutexGuard<'_, AppData>, String> {
        self.data
            .lock()
            .map_err(|_| "Settings state lock poisoned.".to_string())
    }
    fn save(&self, data: &AppData) -> Result<(), String> {
        let raw = serde_json::to_vec_pretty(data).map_err(|e| e.to_string())?;
        let temp = self.path.with_extension("json.tmp");
        fs::write(&temp, raw).map_err(|e| format!("Cannot save settings: {e}"))?;
        fs::rename(&temp, &self.path).map_err(|e| format!("Cannot commit settings: {e}"))
    }
    pub fn snapshot(&self) -> Result<AppData, String> {
        Ok(self.lock()?.clone())
    }
    pub fn change_preferences(&self, pref: Preferences) -> Result<AppData, String> {
        if !matches!(pref.theme.as_str(), "light" | "dark" | "system")
            || !valid_timeout(pref.timeout_seconds)
        {
            return Err("Invalid theme or session duration.".into());
        }
        let mut data = self.lock()?;
        let mut draft = data.clone();
        draft.preferences = pref;
        self.save(&draft)?;
        *data = draft.clone();
        Ok(draft)
    }
    pub fn save_profile(&self, mut profile: Profile) -> Result<AppData, String> {
        profile.name = profile.name.trim().to_string();
        if profile.name.chars().count() < 1
            || profile.name.chars().count() > 32
            || !valid_timeout(profile.timeout_seconds)
        {
            return Err(
                "Profile name must be 1–32 characters and duration 1 minute–24 hours.".into(),
            );
        }
        let mut data = self.lock()?;
        if data
            .profiles
            .iter()
            .any(|p| p.name.eq_ignore_ascii_case(&profile.name) && p.id != profile.id)
        {
            return Err("A profile already uses this name.".into());
        }
        let mut draft = data.clone();
        if profile.id == 0 {
            profile.id = current_ms().max(
                draft
                    .profiles
                    .iter()
                    .map(|p| p.id)
                    .max()
                    .unwrap_or(0)
                    .saturating_add(1),
            );
        }
        if let Some(old) = draft.profiles.iter_mut().find(|p| p.id == profile.id) {
            *old = profile;
        } else {
            draft.profiles.push(profile);
        }
        self.save(&draft)?;
        *data = draft.clone();
        Ok(draft)
    }
    pub fn delete_profile(&self, id: u64) -> Result<AppData, String> {
        let mut data = self.lock()?;
        let mut draft = data.clone();
        draft.profiles.retain(|p| p.id != id);
        self.save(&draft)?;
        *data = draft.clone();
        Ok(draft)
    }
    pub fn create_schedule(&self, mut schedule: Schedule) -> Result<AppData, String> {
        if !matches!(schedule.kind.as_str(), "start" | "stop")
            || schedule.trigger_at_unix_ms <= current_ms()
            || !valid_timeout(schedule.timeout_seconds)
        {
            return Err("Schedule must have a future trigger, a valid kind and duration.".into());
        }
        schedule.label = schedule.label.trim().chars().take(50).collect();
        if schedule.label.is_empty() {
            return Err("Schedule name is required.".into());
        }
        let mut data = self.lock()?;
        let mut draft = data.clone();
        if schedule.id == 0 {
            schedule.id = current_ms().max(
                draft
                    .schedules
                    .iter()
                    .map(|s| s.id)
                    .max()
                    .unwrap_or(0)
                    .saturating_add(1),
            );
        }
        schedule.outcome = "pending".into();
        if let Some(old) = draft.schedules.iter_mut().find(|s| s.id == schedule.id) {
            *old = schedule;
        } else {
            draft.schedules.push(schedule);
        }
        self.save(&draft)?;
        *data = draft.clone();
        Ok(draft)
    }
    pub fn delete_schedule(&self, id: u64) -> Result<AppData, String> {
        let mut data = self.lock()?;
        let mut draft = data.clone();
        draft.schedules.retain(|s| s.id != id);
        self.save(&draft)?;
        *data = draft.clone();
        Ok(draft)
    }
    pub fn set_schedule_enabled(&self, id: u64, enabled: bool) -> Result<AppData, String> {
        let mut data = self.lock()?;
        let mut draft = data.clone();
        let Some(entry) = draft.schedules.iter_mut().find(|s| s.id == id) else {
            return Err("Schedule not found".into());
        };
        if !matches!(entry.outcome.as_str(), "pending" | "disabled") {
            return Err("Only upcoming schedules can be enabled or disabled".into());
        }
        if enabled && entry.trigger_at_unix_ms <= current_ms() {
            return Err("Cannot enable a missed schedule".into());
        }
        entry.outcome = if enabled { "pending" } else { "disabled" }.into();
        self.save(&draft)?;
        *data = draft.clone();
        Ok(draft)
    }
    pub fn clear_history(&self) -> Result<AppData, String> {
        let mut data = self.lock()?;
        let mut draft = data.clone();
        draft.history.clear();
        self.save(&draft)?;
        *data = draft.clone();
        Ok(draft)
    }
    pub fn sync_history(
        &self,
        controller: &CaffeinateController,
    ) -> Result<Vec<HistoryEntry>, String> {
        let events = controller.pending_history()?;
        if events.is_empty() {
            return Ok(vec![]);
        }
        let mut data = self.lock()?;
        let mut draft = data.clone();
        let mut new_events = Vec::new();
        for h in &events {
            if !draft.history.iter().any(|v| v.id == h.id) {
                draft.history.insert(0, h.clone());
                new_events.push(h.clone());
            }
        }
        draft.history.truncate(30);
        if draft
            .scheduled_session_id
            .is_some_and(|id| events.iter().any(|e| e.id == id))
        {
            draft.scheduled_session_id = None;
        }
        self.save(&draft)?;
        *data = draft;
        controller.acknowledge_history(&events.iter().map(|e| e.id).collect::<Vec<_>>())?;
        Ok(new_events)
    }
    pub fn schedule_tick(&self, controller: &CaffeinateController) -> Result<(), String> {
        let now = current_ms();
        // Never hold the settings lock while waiting for the process controller.
        // The history writer uses controller -> store, and reversing that order
        // here would deadlock concurrent menu-bar commands.
        let mut draft = self.snapshot()?;
        if !draft
            .schedules
            .iter()
            .any(|s| s.outcome == "pending" && s.trigger_at_unix_ms <= now)
        {
            return Ok(());
        }
        for i in 0..draft.schedules.len() {
            let s = &draft.schedules[i];
            if s.outcome != "pending" || s.trigger_at_unix_ms > now {
                continue;
            }
            let outcome = if now.saturating_sub(s.trigger_at_unix_ms) > 5_000 {
                "missed"
            } else if s.kind == "start" {
                if controller.status()?.active {
                    "skipped"
                } else {
                    match controller.start_session(SessionOptions {
                        wake_mode: s.wake_mode,
                        timeout_seconds: s.timeout_seconds,
                    }) {
                        Ok(st) => {
                            draft.scheduled_session_id = st.session_id;
                            "completed"
                        }
                        Err(_) => "failed",
                    }
                }
            } else {
                let st = controller.status()?;
                if st.active && draft.scheduled_session_id == st.session_id {
                    match controller.stop_with_reason("scheduled") {
                        Ok(_) => {
                            draft.scheduled_session_id = None;
                            "completed"
                        }
                        Err(_) => "failed",
                    }
                } else {
                    "skipped"
                }
            };
            draft.schedules[i].outcome = outcome.into();
        }
        let mut data = self.lock()?;
        let mut merged = data.clone();
        for resolved in &draft.schedules {
            if let Some(pending) = merged
                .schedules
                .iter_mut()
                .find(|s| s.id == resolved.id && s.outcome == "pending")
            {
                pending.outcome = resolved.outcome.clone();
            }
        }
        merged.scheduled_session_id = draft.scheduled_session_id;
        self.save(&merged)?;
        *data = merged;
        Ok(())
    }
}

#[tauri::command]
pub fn get_app_data(store: State<'_, AppStore>) -> Result<AppData, String> {
    store.snapshot()
}
#[tauri::command]
pub fn save_profile(profile: Profile, store: State<'_, AppStore>) -> Result<AppData, String> {
    store.save_profile(profile)
}
#[tauri::command]
pub fn delete_profile(id: u64, store: State<'_, AppStore>) -> Result<AppData, String> {
    store.delete_profile(id)
}
#[tauri::command]
pub fn create_schedule(schedule: Schedule, store: State<'_, AppStore>) -> Result<AppData, String> {
    store.create_schedule(schedule)
}
#[tauri::command]
pub fn delete_schedule(id: u64, store: State<'_, AppStore>) -> Result<AppData, String> {
    store.delete_schedule(id)
}
#[tauri::command]
pub fn set_schedule_enabled(
    id: u64,
    enabled: bool,
    store: State<'_, AppStore>,
) -> Result<AppData, String> {
    store.set_schedule_enabled(id, enabled)
}
#[tauri::command]
pub fn clear_history(store: State<'_, AppStore>) -> Result<AppData, String> {
    store.clear_history()
}

#[cfg(test)]
mod tests {
    use super::*;
    static NEXT_TEST_ID: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    fn scratch_store() -> AppStore {
        let seq = NEXT_TEST_ID.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let root = std::env::temp_dir().join(format!(
            "caffeinate-v3-test-{}-{}-{}",
            std::process::id(),
            current_ms(),
            seq
        ));
        std::fs::create_dir_all(&root).unwrap();
        AppStore {
            data: Mutex::new(AppData::default()),
            path: root.join("prefs.json"),
        }
    }
    #[test]
    fn local_preferences_are_atomically_persisted_and_validated() {
        let store = scratch_store();
        let mut prefs = Preferences {
            theme: "dark".into(),
            wake_mode: WakeMode::Both,
            timeout_seconds: Some(3600),
            ..Preferences::default()
        };
        let result = store.change_preferences(prefs.clone()).unwrap();
        assert_eq!(result.preferences.theme, "dark");
        let raw = std::fs::read_to_string(&store.path).unwrap();
        let stored: AppData = serde_json::from_str(&raw).unwrap();
        assert_eq!(stored.preferences.wake_mode, WakeMode::Both);
        prefs.timeout_seconds = Some(59);
        assert!(store.change_preferences(prefs).is_err());
        assert_eq!(
            store.snapshot().unwrap().preferences.timeout_seconds,
            Some(3600)
        );
    }
    #[test]
    fn profile_create_rename_duplicate_and_delete() {
        let store = scratch_store();
        let profile = Profile {
            id: 0,
            name: "  Build  ".into(),
            wake_mode: WakeMode::System,
            timeout_seconds: Some(1800),
        };
        let a = store.save_profile(profile).unwrap();
        assert_eq!(a.profiles[0].name, "Build");
        let id = a.profiles[0].id;
        let b = store
            .save_profile(Profile {
                id,
                name: "Compile".into(),
                wake_mode: WakeMode::Both,
                timeout_seconds: None,
            })
            .unwrap();
        assert_eq!(b.profiles.len(), 1);
        assert_eq!(b.profiles[0].wake_mode, WakeMode::Both);
        assert!(store
            .save_profile(Profile {
                id: 0,
                name: "Compile".into(),
                wake_mode: WakeMode::System,
                timeout_seconds: None
            })
            .is_err());
        assert!(store
            .save_profile(Profile {
                id: 0,
                name: "  ".into(),
                wake_mode: WakeMode::System,
                timeout_seconds: None
            })
            .is_err());
        assert!(store.delete_profile(id).unwrap().profiles.is_empty());
    }
    #[test]
    fn schedule_validation_edit_cancel_and_missed_status() {
        let store = scratch_store();
        let trigger = current_ms() + 120_000;
        let first = store
            .create_schedule(Schedule {
                id: 0,
                label: "    Download   ".into(),
                kind: "start".into(),
                trigger_at_unix_ms: trigger,
                wake_mode: WakeMode::System,
                timeout_seconds: Some(60),
                outcome: "pending".into(),
            })
            .unwrap();
        assert_eq!(first.schedules[0].label, "Download");
        let id = first.schedules[0].id;
        assert!(store
            .create_schedule(Schedule {
                id: 0,
                label: "Invalid".into(),
                kind: "repeat".into(),
                trigger_at_unix_ms: trigger,
                wake_mode: WakeMode::System,
                timeout_seconds: None,
                outcome: "pending".into()
            })
            .is_err());
        assert!(store
            .create_schedule(Schedule {
                id: 0,
                label: "Invalid".into(),
                kind: "start".into(),
                trigger_at_unix_ms: 1,
                wake_mode: WakeMode::System,
                timeout_seconds: None,
                outcome: "pending".into()
            })
            .is_err());
        let updated = store
            .create_schedule(Schedule {
                id,
                label: "Updated".into(),
                kind: "stop".into(),
                trigger_at_unix_ms: trigger,
                wake_mode: WakeMode::System,
                timeout_seconds: None,
                outcome: "pending".into(),
            })
            .unwrap();
        assert_eq!(updated.schedules.len(), 1);
        assert_eq!(updated.schedules[0].kind, "stop");
        assert_eq!(
            store.set_schedule_enabled(id, false).unwrap().schedules[0].outcome,
            "disabled"
        );
        assert_eq!(
            store.set_schedule_enabled(id, true).unwrap().schedules[0].outcome,
            "pending"
        );
        assert!(store.set_schedule_enabled(999, false).is_err());
        assert!(store.delete_schedule(id).unwrap().schedules.is_empty());
        {
            let mut data = store.lock().unwrap();
            data.schedules.push(Schedule {
                id: 33,
                label: "Missed".into(),
                kind: "start".into(),
                trigger_at_unix_ms: current_ms() - 30_000,
                wake_mode: WakeMode::System,
                timeout_seconds: None,
                outcome: "pending".into(),
            });
        }
        let ctrl = CaffeinateController::default();
        store.schedule_tick(&ctrl).unwrap();
        assert_eq!(store.snapshot().unwrap().schedules[0].outcome, "missed");
        assert!(!ctrl.status().unwrap().active);
    }
    #[test]
    fn history_sync_is_idempotent_and_bounded() {
        let store = scratch_store();
        let controller = CaffeinateController::default();
        controller
            .start_session(SessionOptions {
                wake_mode: WakeMode::Both,
                timeout_seconds: None,
            })
            .unwrap();
        controller.stop_with_reason("manual").unwrap();
        let events = store.sync_history(&controller).unwrap();
        assert_eq!(events.len(), 1);
        assert_eq!(store.snapshot().unwrap().history.len(), 1);
        assert!(store.sync_history(&controller).unwrap().is_empty());
        assert!(store.clear_history().unwrap().history.is_empty());
    }
    #[test]
    fn due_start_and_linked_stop_execute_once_while_running() {
        let store = scratch_store();
        let controller = CaffeinateController::default();
        {
            let mut data = store.lock().unwrap();
            data.schedules.push(Schedule {
                id: 444,
                label: "Start".into(),
                kind: "start".into(),
                trigger_at_unix_ms: current_ms() - 100,
                wake_mode: WakeMode::System,
                timeout_seconds: Some(60),
                outcome: "pending".into(),
            });
        }
        store.schedule_tick(&controller).unwrap();
        let first = controller.status().unwrap();
        assert!(first.active);
        assert_eq!(
            store.snapshot().unwrap().scheduled_session_id,
            first.session_id
        );
        assert_eq!(store.snapshot().unwrap().schedules[0].outcome, "completed");
        store.schedule_tick(&controller).unwrap();
        assert_eq!(controller.status().unwrap().session_id, first.session_id);
        {
            let mut data = store.lock().unwrap();
            data.schedules.push(Schedule {
                id: 445,
                label: "Stop".into(),
                kind: "stop".into(),
                trigger_at_unix_ms: current_ms() - 100,
                wake_mode: WakeMode::System,
                timeout_seconds: None,
                outcome: "pending".into(),
            });
        }
        store.schedule_tick(&controller).unwrap();
        assert!(!controller.status().unwrap().active);
        assert!(store.snapshot().unwrap().scheduled_session_id.is_none());
        assert_eq!(store.snapshot().unwrap().schedules[1].outcome, "completed");
        assert_eq!(
            store.sync_history(&controller).unwrap()[0].end_reason,
            "scheduled"
        );
    }
    #[test]
    fn due_start_skips_manual_session_without_interrupting() {
        let store = scratch_store();
        let controller = CaffeinateController::default();
        let manual = controller
            .start_session(SessionOptions {
                wake_mode: WakeMode::Display,
                timeout_seconds: None,
            })
            .unwrap();
        {
            store.lock().unwrap().schedules.push(Schedule {
                id: 446,
                label: "Conflict".into(),
                kind: "start".into(),
                trigger_at_unix_ms: current_ms() - 100,
                wake_mode: WakeMode::System,
                timeout_seconds: Some(60),
                outcome: "pending".into(),
            });
        }
        store.schedule_tick(&controller).unwrap();
        assert_eq!(store.snapshot().unwrap().schedules[0].outcome, "skipped");
        assert_eq!(controller.status().unwrap().session_id, manual.session_id);
        assert_eq!(controller.status().unwrap().wake_mode, WakeMode::Display);
        controller.cleanup().unwrap();
    }
    #[test]
    fn defaults_do_not_auto_start() {
        let p = Preferences::default();
        assert!(!p.launch_at_login);
        assert_eq!(p.theme, "system");
        assert_eq!(p.wake_mode, WakeMode::System);
        assert!(p.timeout_seconds.is_none());
        assert!(p.toggle_shortcut.is_empty());
    }
    #[test]
    fn duration_range_and_schema_roundtrip() {
        for invalid in [Some(0), Some(59), Some(86_401)] {
            assert!(!valid_timeout(invalid));
        }
        for valid in [None, Some(60), Some(86400)] {
            assert!(valid_timeout(valid));
        }
        let d = AppData::default();
        let decoded: AppData = serde_json::from_str(&serde_json::to_string(&d).unwrap()).unwrap();
        assert_eq!(decoded.schema_version, 1);
        assert!(decoded.schedules.is_empty());
    }
}
