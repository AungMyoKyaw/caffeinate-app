# Caffeinate 3.0 — Product Requirements & Acceptance Specification

**Spec:** CFT-3.0-RC1 | **Date:** 2026-10-19 | **Status:** **APPROVED & LOCKED** (Q01–Q40, operational policies, G01–G60, Stillwater / Horizon); **application implementation NOT authorized**. See [FINAL-DESIGN.md](FINAL-DESIGN.md) and [APPROVAL.md](APPROVAL.md).
**Platform:** macOS only. **Stack:** Rust + Tauri 2, Svelte 5, Tailwind 4, Bun. **Mode:** Impeccable Operate.

## 1. Product intent and user

Caffeinate keeps a Mac awake with macOS's built-in /usr/bin/caffeinate. The redesign combines a normal window and a native menu-bar item, retaining one unmistakable start/stop action while supporting professional controls without becoming a dashboard. Target: everyone using a Mac, from casual downloads/presentations to developer builds. English copy must be precise, literal, and useful.

**Primary outcomes:** User instantly sees whether the app currently owns a wake assertion, knows its scope and remaining time, can change or end the session, and can continue operation with the main window hidden. No account, cloud sync, analytics, remote network dependency, arbitrary subprocess commands, or unapproved cross-platform work.

**Product owner decisions Q01–Q40 (approved):**
- Q01 C UI/UX plus features; Q02 C all Mac users; Q03 D speed/quality/control balanced; Q04 A keep Caffeinate.
- Q05 C menu bar plus window; Q06 B continue in menu bar after window close; Q07 B optional login launch; Q08 A macOS only.
- Q09 B state and duration readily visible; Q10 D Impeccable selects primary control; Q11 D selects duration UI; Q12 B preset plus custom.
- Q13 C remember duration; Q14 D clear status/countdown/elapsed/end; Q15 C edit duration and mode live; Q16 B remember settings.
- Q17 C System/Display/Both; Q18 B expandable command info; Q19 C icon and remaining time in menu bar; Q20 C global configurable shortcuts.
- Q21 B completion notification; Q22 C low battery warning; Q23 B recent history; Q24 B simple schedules; Q25 C custom profiles.
- Q26 D present Impeccable worlds; Q27 C replace Carbon + Volt; Q28 D new palette; Q29 B Light/Dark/System; Q30 B balanced density.
- Q31 A standard Mac title bar; Q32 B subtle motion; Q33 C multiple icons; Q34 D creative references; Q35 A precise English.
- Q36 A preserve stack; Q37 C balance performance and visuals; Q38 C highest practical a11y; Q39 C PRD + prototypes + plan; Q40 C full QA and release preparation.

The existing repository product/design documentation describes the currently implemented v2.1.0. This **approved v3 design specification** supersedes the prior desktop-only, non-menu-bar and no-scheduling restrictions **as future requirements**, while current app functionality remains v2.1.0 until separately authorized implementation. Root documents contain navigation notices, retaining historical shipped details.

## 2. Information architecture and experience

### Main window
One primary session surface, not an admin dashboard. Standard macOS title bar. First view must show system status, remaining/elapsed time if active, selected duration, wake mode, and one clear primary Start/Stop action. Secondary utility navigation reaches Profiles, Schedules, Recent sessions and Preferences; an expandable Technical details row displays the exact command. State must not depend on color alone.

The primary action is labeled by its outcome (Keep Mac Awake / Stop Session). Use real time and command values, not simulated system metrics. The main window should fit its existing 600 x 520 default unless design approval changes the window dimensions. Layout is adaptable to a reasonable minimum size.

### Native menu bar
Status icon and concise remaining time when bounded; for indefinite sessions show active icon and accessible indefinite label. The menu exposes state, Open Caffeinate, Start/Stop, last-used preset/profile, next schedule when relevant, Preferences and Quit. Menu operations must work without the window or webview being visible. A constrained menu bar may truncate the duration label, but detailed time must remain accessible via menu and VoiceOver.

### Preferences
Theme Light/Dark/System; launch at login toggle (off initially); global shortcuts capture/editor (none active by default); end-of-session notification and battery-warning preferences; clear recent history and reset settings. No onboarding wizard required.

## 3. Runtime functional contract

### Modes
- **System**: /usr/bin/caffeinate -i; prevent idle system sleep; display may still turn off.
- **Display**: /usr/bin/caffeinate -d; prevent display idle sleep.
- **Both**: -i -d.
- Retain -w <app-PID> owner fail-safe. Exact arguments are produced in Rust from typed validated options, never user-supplied shell text. Never promise lid-close wake behavior.

### Time
Presets remain Until stopped, 30m, 1h, 2h, 4h. Add custom duration 1m–24h inclusive (existing Rust 60–86400 seconds). First run defaults System + Until stopped. Subsequently last-used mode and duration survive restarts. A last-used setting does NOT automatically restart a wake assertion after app restart.

Running bounded sessions show remaining, elapsed, local expected end; indefinite sessions explicitly say Until stopped plus elapsed. Timer updates must derive from Rust-owned timing/deadlines, not an independent JavaScript counter. **Proposed edit policy**: changing duration while active resets deadline from the edit-confirmation time, clearly previewed to user. Manual Stop immediately ends the assertion.

### Live edits, races, lifecycle
Rust owns a single serialized logical session, with Idle → Starting → Active ↔ Updating → Stopping → Idle plus real error/reconciliation states. Change of mode or duration uses a safe replace/reconcile operation: validate first; acquire replacement if needed before releasing the prior assertion; track and recover failures; do not falsely report success. Multiple calls from menu bar, shortcuts, schedule and main window must be serialized/idempotent. Child process ownership must be verified; never terminate an arbitrary caffeinate process.

Window close Hides, does not Quit, does not stop the assertion. Open from menu bar returns the same window. Explicit Quit and OS process termination release owned assertions; the -w PID guard covers unexpected app process exit. Reopening after failure reconciles truth. Optional login launch does not start wake sessions by itself.

### Configurable global shortcuts
Keep Command-Return inside the focused main window. Let user configure global Toggle Session and Show Window shortcuts, with conflict detection, opt-in registration, reversible binding, and clear failure messages. Do not seize default global shortcuts without consent.

### Notifications and power
Completion notification once per session if permitted; denied permissions do not break core behavior. Low battery warning only when a session is active and Mac is on battery: proposed default threshold <=15%, once per threshold episode; never silently stop session. Observe via local macOS power API abstraction with bounded polling or OS updates.

### Recent history
Retain up to 30 recent completed sessions locally (proposed): start time, end time, mode, selected duration, actual elapsed, end reason (stop, timeout, quit, interrupted, error). One entry per logical session. No fabricated successful history for failed starts; clear history independently of active session. Crash/interrupted records must be reconciled and marked accurately.

### Profiles
User-created named mode + duration combinations; create/rename/update/delete/apply from window, launch/apply from menu. Trim duplicate/blank names and enforce 1–32 Unicode characters. Deleting a profile does not alter an already-running session. No arbitrary shell args.

### Simple schedules
One-shot start/stop actions using local wall-clock date/time and saved mode/duration/profile. Show upcoming, edit, disable and cancel. Persist future scheduled actions. **Execution boundary:** only when Caffeinate app process is running (window may be hidden); no daemon after Quit and no ability to wake a sleeping Mac. After missed trigger caused by sleep, quit or clock change, mark Missed rather than firing late. Overlap with manually active session: skip and explain, never silently replace. A scheduled Stop may stop only its linked scheduled session. Handle time zones, DST and clock changes explicitly.

### Persistence and privacy
Schema-versioned local app-specific config for preferences, profiles and schedules; atomic writes and recoverable corruption behavior; optionally separate bounded history store. No telemetry, analytics, accounts, remote fonts or network request. Keep existing bundle identifier without explicit migration approval.

## 4. Design requirements

**Approved design resolution:** **Stillwater** (tide-almanac-derived quiet time horizon), **Horizon** icon. Impeccable has selected a rectangular text-labeled primary action, segmented duration controls with accessible Custom input, Stillwater semantic light/dark tokens, and an actual native menu-bar treatment. [FINAL-DESIGN.md](FINAL-DESIGN.md) is the authoritative token, icon geometry, component and layout specification. All other directions are alternatives retained only for historical comparison.

Replace Carbon + Volt visually rather than iterating the colors. Impeccable provides one coherent visual world across desktop, menu bar, settings and app icon. Tool remains usable first: the visual world contributes typography, palette, density and one meaningful signature move, not a decorative device interface. Avoid cards-inside-cards, faux terminal, fake activity metrics, glow/gradient clichés and marketing copy.

Use system fonts if possible; clean hierarchy; accurate status copy; differentiated idle/starting/active/updating/stopping/error states; Light/Dark/System palettes; reduced motion; increased contrast; keyboard/VoiceOver focus; no clipped control text at allowed window sizes. Show multiple icon concepts including menu-bar monochrome/template variant. Direction candidates and design-only previews: DIRECTIONS.md and PROTOTYPES.html.

## 5. Proposed implementation architecture

Retain Tauri 2 + Svelte 5 + Tailwind 4 + Rust/Bun. Move app-lifecycle truth into Rust:
- SessionManager: one serialized state machine, revisioned state/events, safe assertion replacement, cleanup.
- AssertionController: fixed /usr/bin/caffeinate command and child ownership; -i/-d/-w/-t, PID guard, reconciliation.
- PreferencesStore: schema-versioned durable local state, last-used values, theme, login setting, shortcuts.
- ScheduleManager: one-shot persistent triggers, wall-clock/DST policies, missed/conflict detection, tied session identity.
- HistoryStore: capped local completed-session journal with crash recovery.
- BatteryMonitor: native macOS battery adapter with stub for tests.
- TrayManager: native icon/menu/title updates, close/reopen/Quit.
- Commands + typed event bridge: shared, single source of truth for native and Svelte surfaces.

Integrate Tauri built-in TrayIconBuilder/window lifecycle and official global-shortcut, autostart and notification plugins only when their feature is implemented. Read-only snapshot/event subscriptions with reconnect reconciliation. Main window never owns schedule timers or wake assertion process.

**Current source-grounded constraints:** src-tauri/src/caffeinate.rs has a Mutex<Option<Child>>, start/stop/status, 60–86400-second validation and child cleanup; src-tauri/src/lib.rs cleans up at RunEvent::Exit; src/App.svelte polls every second while active and disables setting changes; src-tauri/tauri.conf.json has a 600x520 window with 540x480 minimum and no tray. These are not yet upgraded.

## 6. Design and behavior state coverage

Required states: Idle, Checking, Starting, Running bounded, Running indefinite, Updating, Stopping, Ended naturally, Completed by user, Failed start, Failed update and partial rollback, App hidden, Pending schedule, Schedule missed/conflicted, Battery low, Permission denied, Preferences corrupt, Empty recent history, Dark/Light, Increased contrast, Reduced motion. Controls in every state must remain semantically accessible, with recoverable errors and no stuck busy state.

## 7. Implementation phases and dependencies (NOT authorized yet)

| Phase | Deliverable | Depends on |
|---|---|---|
| P0 | Approve visual direction/icon and proposed behavioral policies; baseline metrics and frozen specs | This RC1 review |
| P1 | Rust session state machine, safe replacement, injectable process/clock, typed commands, core unit tests | P0 |
| P2 | Tray/lifecycle, shared state events, local settings, autostart and shortcut native plugins | P1 |
| P3 | Svelte desktop redesign, controls, details, profiles, themes, accessibility, visual state tests | P1, design lock; can overlap P2 |
| P4 | One-shot schedule runner, history, battery warning, notification completion, tray/UI integration | P2 and stable shared contracts |
| P5 | Full test matrix, real macOS menu/close/reopen/VoiceOver, performance, .app/DMG packaging, docs, release prep | P2–P4 |

Use independent file ownership to parallelize bounded tasks, but serialize changes to the Rust session state machine and shared schemas. Preserve existing user files and app data. Do not commit, push, publish or deploy without separate permission.

## 8. Acceptance gates (each requires real evidence)

**Core (G01–G10)**
- G01 typed System(-i), Display(-d), Both(-i -d) use fixed native binary and PID guard.
- G02 existing presets, custom 60–86400s and indefinite validation are correct.
- G03 default and last-used settings are correct without auto-start.
- G04 countdown, elapsed and end time reflect Rust-reconciled truth.
- G05 explicit Start/Stop and natural timeout are coherent, even when commands race.
- G06 active duration edit previews and applies a from-now deadline.
- G07 mode edit safely replaces assertion; failure rolls back/reconciles truth.
- G08 end cleanup stops only owned child and records one completion.
- G09 unexpected termination uses PID fail-safe; restart state is honest.
- G10 failed spawn/kill/status is actionable without hung or falsely green UI.

**Window/menu/shortcuts (G11–G20)**
- G11 window close hides and retains active session and menu bar.
- G12 Open reuses, reveals and focuses one window.
- G13 explicit Quit releases assertions and exits.
- G14 tray icon and accurate bounded/indefinite remaining title update.
- G15 tray works without visible webview and offers start/stop, preset/profile, preferences and quit.
- G16 tray usable under constrained menu-bar width and VoiceOver.
- G17 Command-Return remains functional.
- G18 global shortcut capture/registry handles conflicts and unregister; no surprise defaults.
- G19 optional launch-at-login works and can be disabled.
- G20 Light/Dark/System and last selections survive relaunch.

**Extra features (G21–G31)**
- G21 completion notification exactly once per session and obeys permissions.
- G22 notification denial leaves wake control usable.
- G23 low-battery warning <=15% on battery is rate limited; does not auto-stop.
- G24 recent history actual elapsed/mode/reason accurate and capped.
- G25 history clearing does not disturb active session.
- G26 profile create/edit/delete/apply validates names and persists.
- G27 one-shot schedule persistence, list/edit/cancel, right local time and DST behavior.
- G28 scheduled action fires while app running without visible window.
- G29 scheduled action does not run after explicit Quit or wake sleeping Mac.
- G30 missed schedule is labeled Missed rather than triggered late.
- G31 conflict does not replace manual session or stop unrelated sessions.

**Design / accessibility (G32–G44)**
- G32 selected fresh identity cohesive across screens, icon, menu and native window.
- G33 session status, duration, wake mode and primary action visible without hunting.
- G34 command details expandable and match Rust actual command; copy works.
- G35 all busy/idle/active/error states visually differentiated without color-only coding.
- G36 Light/Dark/System colors/text tested for usable contrast.
- G37 540x480 minimum and typical window show no truncated critical interactions (or explicitly approved minimum change).
- G38 keyboard only and VoiceOver can operate entire app and native menu.
- G39 reduced motion and increased-contrast macOS settings work.
- G40 visible focus and logical focus restoration; no traps.
- G41 no fake progress/OS metrics or misleading sleep claims.
- G42 approved icon concept legible at app, Dock and 16–22px menu sizes.
- G43 UI copy precise English; errors say what failed and how to recover.
- G44 design screenshots accepted in idle/active/busy/error and theme variants.

**Engineering / packaging (G45–G60)**
- G45 Rust unit tests cover process args/time modes and state machine.
- G46 injected process/clock tests exercise replacement, exit, timing and conflicts.
- G47 Svelte component tests cover all user controls and states.
- G48 formatting, lint, typecheck, test, coverage and build complete without ignored failures.
- G49 permissions scoped minimally for tray, shortcut, autostart and notifications.
- G50 no network, shell plugin, telemetry, accounts or arbitrary binary path introduced.
- G51 preferences corruption/version migration recover safely, preserving data when possible.
- G52 native events and webview reconnect synchronize without stale state.
- G53 real macOS menu, close/reopen, multiple windows/monitor setups smoke tested.
- G54 notification allowed/denied, low-battery on/off-power smoke/fixtures tested.
- G55 sleep/wake, clock shifts, DST and missed schedule cases tested.
- G56 app CPU/memory/bundle/asset baseline from v2.1.0 and v3 delta recorded.
- G57 packaged .app and DMG install/uninstall/reopen verified on target macOS.
- G58 signing/notarization validated when available; missing credentials tracked explicitly.
- G59 changelog, docs, user migration and rollback instructions updated.
- G60 no Git commit/push, deployment, publication or release without separate approval.

A gate is Pass only with test or manual verification evidence, not simply because code exists. Build unit/integration fixtures for deterministic cases; use actual macOS app for OS-specific behavior.

## 9. Approved operational policies (locked 2026-10-19)

The product owner **explicitly approved** these implementation-level defaults: 24-hour custom maximum; active edit counts from edit-confirmation time; <=15% low-battery warning; 30 recent history entries; no wake auto-start at login; one-shot schedules only while the native app runs; skipped conflicts vs an active manual session; missed triggers do not catch up; Quit releases owned assertion; global shortcuts disabled until user assigns them. These defaults are **locked**; changes require new product-owner approval.

**Visual direction locked:** Stillwater / Horizon. Tokens, composition, component contracts and icon geometry are in [FINAL-DESIGN.md](FINAL-DESIGN.md); real production icon assets and per-state screen implementations will be created only when implementation is separately authorized. **Pending solely:** separate authorization to begin coding and, later, authorization to commit, push, publish or release. This document does not authorize any of those actions.
