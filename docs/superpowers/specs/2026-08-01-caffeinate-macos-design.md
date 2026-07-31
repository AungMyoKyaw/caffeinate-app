# Caffeinate macOS Application Design

## Summary

Build a macOS-only Tauri 2 desktop application that starts and owns `/usr/bin/caffeinate`. The product is intentionally narrow: one normal application window lets the user block idle sleep, optionally keep the display awake, choose a duration, inspect status, and stop the assertion. Closing the application must release the assertion.

The user delegated secondary feature choices and explicitly requested immediate execution. Version 1 therefore adopts safe, reversible defaults instead of adding setup questions.

## Approaches considered

### 1. Rust-owned child process — selected

The Tauri Rust backend spawns `/usr/bin/caffeinate` directly with `std::process::Command`, stores the child handle in managed state, polls it through typed commands, and kills it during stop or application exit.

Advantages:
- Smallest command surface.
- No arbitrary shell execution.
- Reliable ownership and cleanup.
- Easy to test argument construction independently.

Trade-off:
- macOS-specific backend code.

### 2. Tauri shell plugin

The frontend or backend uses `tauri-plugin-shell` with a permission allowlist.

Rejected because the app needs one fixed system binary. The plugin adds configuration and permission surface without product benefit.

### 3. Native power assertion APIs

Use IOKit power management APIs directly.

Rejected for version 1 because `/usr/bin/caffeinate` is already present, documented, inspectable, and sufficient. Native FFI would add unsafe code and maintenance cost.

## Architecture

### Frontend

React 19 + TypeScript + Vite 8. The frontend owns only presentation and user intent. It calls three Tauri commands:

```ts
start_caffeinate(options: StartOptions): Promise<CaffeinateStatus>
stop_caffeinate(): Promise<CaffeinateStatus>
get_caffeinate_status(): Promise<CaffeinateStatus>
```

It polls status once per second while active so a timed process can transition back to ready without stale UI.

### Backend

A `CaffeinateController` stored through `tauri::Builder::manage` owns `Mutex<Option<CaffeinateSession>>`.

`CaffeinateSession` contains:
- `std::process::Child`
- start timestamp
- optional timeout in seconds
- whether display-awake was enabled

The backend never passes user text to a shell. It builds a fixed argument list:
- always `-i`
- optional `-d`
- optional `-t <seconds>`
- always `-w <app-pid>` as a crash-safe ownership guard

Timeouts must be between 60 seconds and 24 hours. The application presets stay within this bound.

### Lifecycle

- Starting while already active is idempotent and returns current status.
- Stopping kills and waits for the child if it is still running.
- Status calls use `try_wait` to clear completed timed sessions.
- `RunEvent::Exit` invokes controller cleanup.
- The process receives `-w <app-pid>`, so its assertion is released even if normal exit cleanup does not run.
- The process does not survive application exit.

## Data contracts

```ts
interface StartOptions {
  keepDisplayAwake: boolean;
  timeoutSeconds: number | null;
}

interface CaffeinateStatus {
  active: boolean;
  keepDisplayAwake: boolean;
  startedAtUnixMs: number | null;
  timeoutSeconds: number | null;
  remainingSeconds: number | null;
  command: string;
}
```

Rust serializes fields in camelCase.

## Error handling

- Missing `/usr/bin/caffeinate`: return a literal launch error.
- Invalid timeout: reject before spawning.
- Poisoned lock: return an internal state error instead of panicking.
- Kill/wait failure: clear ownership only after best-effort cleanup and return a useful message.
- Frontend errors use a single alert region and keep the last confirmed state.

## UI design

Use the Impeccable Operate mode. The window is one continuous task surface, not a dashboard. A large state statement and one primary action dominate. Duration and display behavior are secondary rows. The exact command appears in a technical footer for trust.

No menu bar, tray, sidebar, onboarding, accounts, cards grid, gradient, glassmorphism, telemetry, or network access.

## Testing

- Rust unit tests cover argument construction and timeout validation.
- Bun unit tests cover duration labels, remaining-time formatting, and command fallback.
- A repository contract script verifies macOS-only configuration, direct fixed-binary execution, exit cleanup, Bun usage, no tray/menu-bar implementation, and core accessibility markers.
- A deterministic static preview is rendered at desktop and minimum-window sizes for one Impeccable audit, one repair batch, and one confirmation render.

## Distribution

Tauri bundle targets: `app` and `dmg` on macOS. The source archive is build-ready but this Linux execution environment cannot produce a signed macOS `.app` or `.dmg`.
