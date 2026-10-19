use serde::{Deserialize, Serialize};
use std::{
    process::{id as process_id, Child, Command, Stdio},
    sync::{Mutex, MutexGuard},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::State;

const CAFFEINATE_PATH: &str = "/usr/bin/caffeinate";
pub const MIN_TIMEOUT_SECONDS: u64 = 60;
pub const MAX_TIMEOUT_SECONDS: u64 = 86_400;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum WakeMode {
    #[default]
    System,
    Display,
    Both,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartOptions {
    pub keep_display_awake: bool,
    pub timeout_seconds: Option<u64>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionOptions {
    pub wake_mode: WakeMode,
    pub timeout_seconds: Option<u64>,
}

impl From<StartOptions> for SessionOptions {
    fn from(value: StartOptions) -> Self {
        Self {
            wake_mode: if value.keep_display_awake {
                WakeMode::Both
            } else {
                WakeMode::System
            },
            timeout_seconds: value.timeout_seconds,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaffeinateStatus {
    pub active: bool,
    pub keep_display_awake: bool,
    pub wake_mode: WakeMode,
    pub started_at_unix_ms: Option<u64>,
    pub ends_at_unix_ms: Option<u64>,
    pub elapsed_seconds: Option<u64>,
    pub timeout_seconds: Option<u64>,
    pub remaining_seconds: Option<u64>,
    pub session_id: Option<u64>,
    pub revision: u64,
    pub command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: u64,
    pub started_at_unix_ms: u64,
    pub ended_at_unix_ms: u64,
    pub actual_seconds: u64,
    pub wake_mode: WakeMode,
    pub timeout_seconds: Option<u64>,
    pub end_reason: String,
}

struct CaffeinateSession {
    child: Child,
    id: u64,
    wake_mode: WakeMode,
    started_instant: Instant,
    started_at_unix_ms: u64,
    deadline: Option<Instant>,
    ends_at_unix_ms: Option<u64>,
    timeout_seconds: Option<u64>,
    command: String,
}
#[derive(Default)]
struct SessionState {
    active: Option<CaffeinateSession>,
    completed: Vec<HistoryEntry>,
    revision: u64,
}

#[derive(Default)]
pub struct CaffeinateController {
    state: Mutex<SessionState>,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_millis() as u64
}
fn validate_timeout(timeout: Option<u64>) -> Result<(), String> {
    if let Some(t) = timeout {
        if !(MIN_TIMEOUT_SECONDS..=MAX_TIMEOUT_SECONDS).contains(&t) {
            return Err(format!(
                "Duration must be between {MIN_TIMEOUT_SECONDS} and {MAX_TIMEOUT_SECONDS} seconds."
            ));
        }
    }
    Ok(())
}
fn build_args(options: SessionOptions, owner_pid: u32) -> Vec<String> {
    let mut args = Vec::with_capacity(6);
    if matches!(options.wake_mode, WakeMode::System | WakeMode::Both) {
        args.push("-i".to_string());
    }
    if matches!(options.wake_mode, WakeMode::Display | WakeMode::Both) {
        args.push("-d".to_string());
    }
    if let Some(t) = options.timeout_seconds {
        args.extend(["-t".to_string(), t.to_string()]);
    }
    args.extend(["-w".to_string(), owner_pid.to_string()]);
    args
}
#[cfg(test)]
fn build_caffeinate_args(options: StartOptions, pid: u32) -> Vec<String> {
    build_args(options.into(), pid)
}
fn spawn_assertion(args: &[String]) -> Result<Child, String> {
    // Unit tests exercise the real process ownership and replacement lifecycle
    // with a harmless child, never changing the Mac's power assertions.
    #[cfg(test)]
    {
        let _ = args;
        return Command::new("/bin/sleep")
            .arg("30")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Cannot spawn test child: {e}"));
    }
    #[cfg(all(not(test), target_os = "macos"))]
    {
        Command::new(CAFFEINATE_PATH)
            .args(args)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Could not start {CAFFEINATE_PATH}: {e}"))
    }
    #[cfg(all(not(test), not(target_os = "macos")))]
    {
        let _ = args;
        Err("Caffeinate is available only on macOS.".to_string())
    }
}
fn terminate_owned(child: &mut Child) -> Result<(), String> {
    match child
        .try_wait()
        .map_err(|e| format!("Could not check wake assertion: {e}"))?
    {
        Some(_) => Ok(()),
        None => {
            child
                .kill()
                .map_err(|e| format!("Could not stop owned wake assertion: {e}"))?;
            child
                .wait()
                .map_err(|e| format!("Could not reap owned wake assertion: {e}"))?;
            Ok(())
        }
    }
}
fn snapshot(state: &SessionState) -> CaffeinateStatus {
    if let Some(s) = &state.active {
        CaffeinateStatus {
            active: true,
            keep_display_awake: s.wake_mode != WakeMode::System,
            wake_mode: s.wake_mode,
            started_at_unix_ms: Some(s.started_at_unix_ms),
            ends_at_unix_ms: s.ends_at_unix_ms,
            elapsed_seconds: Some(s.started_instant.elapsed().as_secs()),
            timeout_seconds: s.timeout_seconds,
            remaining_seconds: s
                .deadline
                .map(|t| t.saturating_duration_since(Instant::now()).as_secs()),
            session_id: Some(s.id),
            revision: state.revision,
            command: s.command.clone(),
        }
    } else {
        CaffeinateStatus {
            active: false,
            keep_display_awake: false,
            wake_mode: WakeMode::System,
            started_at_unix_ms: None,
            ends_at_unix_ms: None,
            elapsed_seconds: None,
            timeout_seconds: None,
            remaining_seconds: None,
            session_id: None,
            revision: state.revision,
            command: String::new(),
        }
    }
}
fn push_history(state: &mut SessionState, session: CaffeinateSession, reason: &str) {
    state.completed.push(HistoryEntry {
        id: session.id,
        started_at_unix_ms: session.started_at_unix_ms,
        ended_at_unix_ms: now_ms(),
        actual_seconds: session.started_instant.elapsed().as_secs(),
        wake_mode: session.wake_mode,
        timeout_seconds: session.timeout_seconds,
        end_reason: reason.to_string(),
    });
    state.revision += 1;
}
fn reconcile(state: &mut SessionState) -> Result<(), String> {
    let ended = match state.active.as_mut() {
        Some(s) => s
            .child
            .try_wait()
            .map_err(|e| format!("Could not inspect wake assertion: {e}"))?
            .is_some(),
        None => false,
    };
    if ended {
        if let Some(old) = state.active.take() {
            push_history(state, old, "timeout");
        }
    }
    Ok(())
}

impl CaffeinateController {
    fn lock(&self) -> Result<MutexGuard<'_, SessionState>, String> {
        self.state
            .lock()
            .map_err(|_| "Wake session state lock poisoned.".to_string())
    }
    pub fn start(&self, options: StartOptions) -> Result<CaffeinateStatus, String> {
        self.start_session(options.into())
    }
    pub fn start_session(&self, options: SessionOptions) -> Result<CaffeinateStatus, String> {
        validate_timeout(options.timeout_seconds)?;
        let mut state = self.lock()?;
        reconcile(&mut state)?;
        if state.active.is_some() {
            return Ok(snapshot(&state));
        }
        let args = build_args(options, process_id());
        let child = spawn_assertion(&args)?;
        let time = now_ms();
        let started = Instant::now();
        let deadline = options
            .timeout_seconds
            .map(|t| started + Duration::from_secs(t));
        state.revision += 1;
        state.active = Some(CaffeinateSession {
            child,
            id: time,
            wake_mode: options.wake_mode,
            started_instant: started,
            started_at_unix_ms: time,
            deadline,
            ends_at_unix_ms: options.timeout_seconds.map(|t| time + t * 1_000),
            timeout_seconds: options.timeout_seconds,
            command: format!("{CAFFEINATE_PATH} {}", args.join(" ")),
        });
        Ok(snapshot(&state))
    }
    pub fn update(
        &self,
        options: SessionOptions,
        expected_revision: Option<u64>,
    ) -> Result<CaffeinateStatus, String> {
        validate_timeout(options.timeout_seconds)?;
        let mut state = self.lock()?;
        reconcile(&mut state)?;
        if expected_revision.is_some_and(|v| v != state.revision) {
            return Err("Session changed. Reload current state before applying edits.".to_string());
        }
        if state.active.is_none() {
            return Err("No active wake session to update.".to_string());
        }
        let args = build_args(options, process_id());
        let mut new_child = spawn_assertion(&args)?;
        // A new verified assertion is acquired before the old one is released.
        if let Err(err) = terminate_owned(&mut state.active.as_mut().unwrap().child) {
            let _ = terminate_owned(&mut new_child);
            return Err(format!("Could not replace prior wake assertion: {err}"));
        }
        let previous = state.active.take().unwrap();
        let t = now_ms();
        let begin = Instant::now();
        state.revision += 1;
        state.active = Some(CaffeinateSession {
            child: new_child,
            id: previous.id,
            wake_mode: options.wake_mode,
            started_instant: previous.started_instant,
            started_at_unix_ms: previous.started_at_unix_ms,
            deadline: options
                .timeout_seconds
                .map(|seconds| begin + Duration::from_secs(seconds)),
            ends_at_unix_ms: options.timeout_seconds.map(|seconds| t + seconds * 1_000),
            timeout_seconds: options.timeout_seconds,
            command: format!("{CAFFEINATE_PATH} {}", args.join(" ")),
        });
        Ok(snapshot(&state))
    }
    pub fn stop(&self) -> Result<CaffeinateStatus, String> {
        self.stop_with_reason("manual")
    }
    pub fn stop_with_reason(&self, reason: &str) -> Result<CaffeinateStatus, String> {
        let mut state = self.lock()?;
        reconcile(&mut state)?;
        if let Some(s) = state.active.as_mut() {
            terminate_owned(&mut s.child)?;
        }
        if let Some(s) = state.active.take() {
            push_history(&mut state, s, reason);
        }
        Ok(snapshot(&state))
    }
    pub fn status(&self) -> Result<CaffeinateStatus, String> {
        let mut state = self.lock()?;
        reconcile(&mut state)?;
        Ok(snapshot(&state))
    }
    pub fn pending_history(&self) -> Result<Vec<HistoryEntry>, String> {
        let mut state = self.lock()?;
        reconcile(&mut state)?;
        Ok(state.completed.clone())
    }
    pub fn acknowledge_history(&self, persisted_ids: &[u64]) -> Result<(), String> {
        self.lock()?
            .completed
            .retain(|e| !persisted_ids.contains(&e.id));
        Ok(())
    }
    #[cfg(test)]
    pub fn drain_history(&self) -> Result<Vec<HistoryEntry>, String> {
        let entries = self.pending_history()?;
        self.acknowledge_history(&entries.iter().map(|e| e.id).collect::<Vec<_>>())?;
        Ok(entries)
    }
    pub fn cleanup(&self) -> Result<(), String> {
        self.stop_with_reason("quit").map(|_| ())
    }
}

#[tauri::command]
pub fn start_caffeinate(
    options: StartOptions,
    controller: State<'_, CaffeinateController>,
) -> Result<CaffeinateStatus, String> {
    controller.start(options)
}
#[tauri::command]
pub fn stop_caffeinate(
    controller: State<'_, CaffeinateController>,
) -> Result<CaffeinateStatus, String> {
    controller.stop()
}
#[tauri::command]
pub fn get_caffeinate_status(
    controller: State<'_, CaffeinateController>,
) -> Result<CaffeinateStatus, String> {
    controller.status()
}
#[tauri::command]
pub fn start_wake_session(
    options: SessionOptions,
    controller: State<'_, CaffeinateController>,
) -> Result<CaffeinateStatus, String> {
    controller.start_session(options)
}
#[tauri::command]
pub fn update_wake_session(
    options: SessionOptions,
    expected_revision: Option<u64>,
    controller: State<'_, CaffeinateController>,
) -> Result<CaffeinateStatus, String> {
    controller.update(options, expected_revision)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn default_args_prevent_idle_system_sleep() {
        assert_eq!(
            build_caffeinate_args(
                StartOptions {
                    keep_display_awake: false,
                    timeout_seconds: None
                },
                42
            ),
            vec!["-i", "-w", "42"]
        );
    }
    #[test]
    fn both_mode_and_timeout() {
        assert_eq!(
            build_caffeinate_args(
                StartOptions {
                    keep_display_awake: true,
                    timeout_seconds: Some(3600)
                },
                99
            ),
            vec!["-i", "-d", "-t", "3600", "-w", "99"]
        );
    }
    #[test]
    fn explicit_display_only() {
        assert_eq!(
            build_args(
                SessionOptions {
                    wake_mode: WakeMode::Display,
                    timeout_seconds: Some(60)
                },
                9
            ),
            vec!["-d", "-t", "60", "-w", "9"]
        );
    }
    #[test]
    fn validates_bounds() {
        for n in [0, 59, 86401, u64::MAX] {
            assert!(validate_timeout(Some(n)).is_err());
        }
        for n in [60, 1800, 86400] {
            assert!(validate_timeout(Some(n)).is_ok());
        }
        assert!(validate_timeout(None).is_ok());
    }
    #[test]
    fn no_assertion_when_idle() {
        let c = CaffeinateController::default();
        let s = c.status().unwrap();
        assert!(!s.active);
        assert_eq!(s.revision, 0);
        assert!(c.drain_history().unwrap().is_empty());
    }
    #[test]
    fn owned_child_lifecycle_and_history() {
        let c = CaffeinateController::default();
        let first = c
            .start_session(SessionOptions {
                wake_mode: WakeMode::System,
                timeout_seconds: Some(3600),
            })
            .unwrap();
        assert!(first.active);
        assert_eq!(first.wake_mode, WakeMode::System);
        let same = c
            .start_session(SessionOptions {
                wake_mode: WakeMode::Both,
                timeout_seconds: Some(60),
            })
            .unwrap();
        assert_eq!(same.session_id, first.session_id);
        assert_eq!(same.revision, first.revision);
        let updated = c
            .update(
                SessionOptions {
                    wake_mode: WakeMode::Both,
                    timeout_seconds: Some(60),
                },
                Some(first.revision),
            )
            .unwrap();
        assert_eq!(updated.session_id, first.session_id);
        assert_eq!(updated.wake_mode, WakeMode::Both);
        assert!(updated.remaining_seconds.is_some_and(|v| v <= 60));
        assert!(c
            .update(
                SessionOptions {
                    wake_mode: WakeMode::Display,
                    timeout_seconds: None
                },
                Some(first.revision)
            )
            .is_err());
        let stopped = c.stop().unwrap();
        assert!(!stopped.active);
        let history = c.drain_history().unwrap();
        assert_eq!(history.len(), 1);
        assert_eq!(history[0].end_reason, "manual");
        assert_eq!(history[0].wake_mode, WakeMode::Both);
        assert!(c.drain_history().unwrap().is_empty());
    }
    #[test]
    fn duplicate_stops_are_idempotent() {
        let c = CaffeinateController::default();
        assert!(!c.stop().unwrap().active);
        assert!(!c.stop().unwrap().active);
        assert!(c.drain_history().unwrap().is_empty());
    }
    #[test]
    fn quitting_an_owned_session_records_quit_once() {
        let c = CaffeinateController::default();
        let s = c
            .start_session(SessionOptions {
                wake_mode: WakeMode::Display,
                timeout_seconds: None,
            })
            .unwrap();
        assert!(s.active);
        c.cleanup().unwrap();
        c.cleanup().unwrap();
        let entries = c.drain_history().unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].end_reason, "quit");
    }
    #[test]
    fn stale_revisions_reject_before_running_process_check() {
        let c = CaffeinateController::default();
        assert!(c
            .update(
                SessionOptions {
                    wake_mode: WakeMode::Both,
                    timeout_seconds: None
                },
                Some(100)
            )
            .is_err());
    }
}
