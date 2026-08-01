use serde::{Deserialize, Serialize};
use std::{
    process::{id as process_id, Child, Command, Stdio},
    sync::{Mutex, MutexGuard},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::State;

const CAFFEINATE_PATH: &str = "/usr/bin/caffeinate";
const MIN_TIMEOUT_SECONDS: u64 = 60;
const MAX_TIMEOUT_SECONDS: u64 = 86_400;

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartOptions {
    pub keep_display_awake: bool,
    pub timeout_seconds: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaffeinateStatus {
    pub active: bool,
    pub keep_display_awake: bool,
    pub started_at_unix_ms: Option<u64>,
    pub timeout_seconds: Option<u64>,
    pub remaining_seconds: Option<u64>,
    pub command: String,
}

struct CaffeinateSession {
    child: Child,
    keep_display_awake: bool,
    started_at: SystemTime,
    started_at_unix_ms: u64,
    timeout_seconds: Option<u64>,
    command: String,
}

#[derive(Default)]
pub struct CaffeinateController {
    session: Mutex<Option<CaffeinateSession>>,
}

impl CaffeinateController {
    pub fn start(&self, options: StartOptions) -> Result<CaffeinateStatus, String> {
        validate_timeout(options.timeout_seconds)?;

        let mut session = self.lock_session()?;
        reconcile_session(&mut session)?;

        if session.is_some() {
            return status_from_session(session.as_ref());
        }

        let args = build_caffeinate_args(options, process_id());
        let command = format_command(&args);
        let child = spawn_caffeinate(&args)?;
        let started_at = SystemTime::now();
        let started_at_unix_ms = started_at
            .duration_since(UNIX_EPOCH)
            .map_err(|error| format!("System clock is before the Unix epoch: {error}"))?
            .as_millis() as u64;

        *session = Some(CaffeinateSession {
            child,
            keep_display_awake: options.keep_display_awake,
            started_at,
            started_at_unix_ms,
            timeout_seconds: options.timeout_seconds,
            command,
        });

        status_from_session(session.as_ref())
    }

    pub fn stop(&self) -> Result<CaffeinateStatus, String> {
        let mut session = self.lock_session()?;
        reconcile_session(&mut session)?;

        if let Some(mut active_session) = session.take() {
            match active_session.child.try_wait() {
                Ok(Some(_)) => {}
                Ok(None) => {
                    active_session
                        .child
                        .kill()
                        .map_err(|error| format!("Could not stop caffeinate: {error}"))?;
                    active_session
                        .child
                        .wait()
                        .map_err(|error| format!("Could not finish caffeinate cleanup: {error}"))?;
                }
                Err(error) => {
                    return Err(format!(
                        "Could not inspect caffeinate before stopping: {error}"
                    ));
                }
            }
        }

        Ok(inactive_status())
    }

    pub fn status(&self) -> Result<CaffeinateStatus, String> {
        let mut session = self.lock_session()?;
        reconcile_session(&mut session)?;
        status_from_session(session.as_ref())
    }

    pub fn cleanup(&self) -> Result<(), String> {
        self.stop().map(|_| ())
    }

    fn lock_session(&self) -> Result<MutexGuard<'_, Option<CaffeinateSession>>, String> {
        self.session
            .lock()
            .map_err(|_| "Caffeinate state lock was poisoned.".to_string())
    }
}

fn validate_timeout(timeout_seconds: Option<u64>) -> Result<(), String> {
    if let Some(seconds) = timeout_seconds {
        if !(MIN_TIMEOUT_SECONDS..=MAX_TIMEOUT_SECONDS).contains(&seconds) {
            return Err(format!(
                "Duration must be between {MIN_TIMEOUT_SECONDS} and {MAX_TIMEOUT_SECONDS} seconds."
            ));
        }
    }

    Ok(())
}

fn build_caffeinate_args(options: StartOptions, owner_pid: u32) -> Vec<String> {
    let mut args = vec!["-i".to_string()];

    if options.keep_display_awake {
        args.push("-d".to_string());
    }

    if let Some(seconds) = options.timeout_seconds {
        args.push("-t".to_string());
        args.push(seconds.to_string());
    }

    args.push("-w".to_string());
    args.push(owner_pid.to_string());
    args
}

fn format_command(args: &[String]) -> String {
    std::iter::once(CAFFEINATE_PATH.to_string())
        .chain(args.iter().cloned())
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(target_os = "macos")]
fn spawn_caffeinate(args: &[String]) -> Result<Child, String> {
    Command::new(CAFFEINATE_PATH)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| format!("Could not start {CAFFEINATE_PATH}: {error}"))
}

#[cfg(not(target_os = "macos"))]
fn spawn_caffeinate(_args: &[String]) -> Result<Child, String> {
    Err("Caffeinate is available only on macOS.".to_string())
}

fn reconcile_session(session: &mut Option<CaffeinateSession>) -> Result<(), String> {
    let has_exited = if let Some(active_session) = session.as_mut() {
        active_session
            .child
            .try_wait()
            .map_err(|error| format!("Could not inspect caffeinate: {error}"))?
            .is_some()
    } else {
        false
    };

    if has_exited {
        *session = None;
    }

    Ok(())
}

fn status_from_session(session: Option<&CaffeinateSession>) -> Result<CaffeinateStatus, String> {
    let Some(session) = session else {
        return Ok(inactive_status());
    };

    let elapsed_seconds = session
        .started_at
        .elapsed()
        .map_err(|error| format!("System clock moved backwards: {error}"))?
        .as_secs();

    let remaining_seconds = session
        .timeout_seconds
        .map(|timeout| timeout.saturating_sub(elapsed_seconds));

    Ok(CaffeinateStatus {
        active: true,
        keep_display_awake: session.keep_display_awake,
        started_at_unix_ms: Some(session.started_at_unix_ms),
        timeout_seconds: session.timeout_seconds,
        remaining_seconds,
        command: session.command.clone(),
    })
}

fn inactive_status() -> CaffeinateStatus {
    CaffeinateStatus {
        active: false,
        keep_display_awake: false,
        started_at_unix_ms: None,
        timeout_seconds: None,
        remaining_seconds: None,
        command: String::new(),
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_args_prevent_idle_system_sleep() {
        let args = build_caffeinate_args(
            StartOptions {
                keep_display_awake: false,
                timeout_seconds: None,
            },
            42,
        );

        assert_eq!(args, vec!["-i", "-w", "42"]);
    }

    #[test]
    fn display_and_timeout_args_are_explicit() {
        let args = build_caffeinate_args(
            StartOptions {
                keep_display_awake: true,
                timeout_seconds: Some(3_600),
            },
            99,
        );

        assert_eq!(args, vec!["-i", "-d", "-t", "3600", "-w", "99"]);
    }

    #[test]
    fn timeout_validation_rejects_short_and_long_values() {
        assert!(validate_timeout(Some(59)).is_err());
        assert!(validate_timeout(Some(86_401)).is_err());
        assert!(validate_timeout(Some(60)).is_ok());
        assert!(validate_timeout(Some(86_400)).is_ok());
        assert!(validate_timeout(None).is_ok());
    }
}
