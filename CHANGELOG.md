# Changelog

## Unreleased — Svelte rewrite

- Replaced the React frontend with Svelte 5 and the official Svelte Vite plugin.
- Introduced the Carbon + Volt control surface with stronger ready/awake state hierarchy, a visible duration rail, light/dark appearance, and compact-window handling.
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
