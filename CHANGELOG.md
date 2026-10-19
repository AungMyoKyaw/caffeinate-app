# Changelog

## 3.0.0-beta.0 — 2026-10-19 (unreleased)

- Replaced Carbon + Volt with the approved Stillwater visual identity and Horizon app/menu-bar icons.
- Added native Tauri menu bar, window-close-to-hide lifecycle and cleanup on explicit Quit.
- Added System, Display and Both wake modes; custom duration and safe live-session edits with Rust revision checks.
- Introduced local persisted preferences, user profiles, bounded recent-session history and one-shot schedules.
- Added optional login launch, configurable global shortcuts, completion notifications and low-battery warnings.
- Added Light/Dark/System themes and accessible first-screen session controls.
- Expanded Rust process/persistence/schedule and frontend UI/IPC tests and v3 contract checks.
- Prepared Apple Silicon app/DMG packaging; no publication, notarization, signing credentials or final QA approval implied.
- Outstanding release gates and evidence are documented in [Implementation Status](docs/redesign/IMPLEMENTATION_STATUS.md).

## 2.1.0 — 2026-08-16

- Removed the text label under the power control (`Keep Mac Awake` / `Allow Sleep`), which read as a status and clashed with the adjacent awake-state copy. The control keeps the action name as its accessible label, and state stays conveyed by the status text and Volt styling.
- Reformatted Tauri regenerated schema files.

## 2.0.0 — 2026-08-15

- Replaced the React frontend with Svelte 5 and the official Svelte Vite plugin.
- Introduced the Carbon + Volt control surface with stronger ready/awake state hierarchy, a visible duration rail, light/dark appearance, and compact-window handling.
- Added Tailwind CSS v4 build-time styling with the Carbon + Volt design tokens defined in the `@theme` block.
- Rebalanced the normal window interface with appropriate sizing and normalized Dock icon optical size.
- Added injectable Tauri client boundaries and expanded frontend unit/component/bootstrap tests.
- Added Prettier, ESLint/Svelte, Svelte Check, Vitest V8 coverage thresholds, and focused-test protection.
- Added architecture diagrams, dependency and lightweight measurement notes, open-source contributor/security documents, and updated CI verification flow.
- Preserved the existing fixed-path Rust `/usr/bin/caffeinate` process controller and lifecycle safety model.

## 1.0.0 — 2026-08-01

- Added a macOS-only Tauri 2 application for controlling `/usr/bin/caffeinate`.
- Added optional display-awake and duration controls.
- Added app-PID ownership guard, stale-process reconciliation, and exit cleanup.
- Added Operate-mode design, dark appearance, keyboard action, and accessibility states.
- Added Bun-first development scripts, macOS CI, deterministic repository contract, and visual fixtures.
