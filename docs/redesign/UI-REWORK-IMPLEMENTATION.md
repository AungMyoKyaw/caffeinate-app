# Caffeinate 3.0 — Approved UI Rework Implementation

**Date:** 2026-10-19
**Status:** **Implemented locally**, not released
**Approval:** The product owner expressly approved implementing the fresh `PROTOTYPE-REWORK.html` exactly into the Caffeinate application.
**Reference:** [PROTOTYPE-REWORK.html](PROTOTYPE-REWORK.html)
**Replaces for UI layout:** The earlier CFT-3.0 Stillwater top-tab layout and older `PROTOTYPES.html` design comparisons. Product behaviors and G01–G60 acceptance gates remain in force.

## Implemented parity

- Native macOS title bar retained (the prototype's 39px fake macOS title bar is *not* drawn inside the app).
- 148px sidebar at normal window width; 131px sidebar for 540px compact width.
- Horizon brand icon, five vertically arranged destinations: Session, Profiles, Schedules, History, Settings.
- Quiet sidebar footer with live menu-bar status and working quick actions; native menu-bar Rust integration remains intact.
- Main heading, Awake/Ready state pill, 165px Stillwater status hero, accurate timer/end-time horizon.
- Visible System/Display/Both modes and Until/30m/1h/2h/4h/Custom duration controls.
- Rust-authoritative Start/Stop, staged active-session edits with Apply/Discard, real technical command display.
- Profile creation/editing/applying/deletion, schedule creation/editing/enable/disable/deletion, local recent history and preferences.
- Matching prototype-derived light/dark semantic CSS, native form controls, keyboard navigation, focus indicators and reduced-motion behavior.
- Custom duration or pending edits at 540x480: only the changing session fields scroll; Stop Session and its companion actions stay visible in a separate footer.
- No app-specific or user data reset. No mock-only runtime logic was copied into production.

## Visual verification

Playwright CLI rendered the real Svelte app on local Vite with an **injected test-only Tauri IPC shim**, not a live wake assertion. Reference was compared against the approved prototype:

| Evidence | Screenshot |
|---|---|
| Real UI at 600px wide, light and active | [implemented-light-active.png](implemented-light-active.png) |
| Real UI at 600px wide, dark and active | [implemented-dark-active.png](implemented-dark-active.png) |
| Real UI at 540px wide, dark and active | [implemented-dark-compact.png](implemented-dark-compact.png) |
| Real Schedule view | [implemented-schedules.png](implemented-schedules.png) |
| Real expanded custom-duration active state at 540px | [implemented-dark-custom-compact.png](implemented-dark-custom-compact.png) |

Computed layout for the real UI (600px browser content width, 481px body height following the native title bar): sidebar 148px, main header 64px, hero 408x165px, status/action content visible. At 540x441px browser content viewport (corresponding to the app's 540x480 minimum window), no horizontal overflow. With custom duration selected, Playwright measured **Stop Session at y=350.5–388.5**, inside the 441px visible area; custom minutes at y=253–291. Console error inspection reported 0 errors.

## Automated verification

- **61/61** frontend unit tests passed.
- **17/17** Rust unit tests passed.
- Svelte/typecheck, ESLint, formatting, v3 architectural contract passed.
- Native macOS `aarch64-apple-darwin` release compiled and both .app and .dmg were created.
- Frontend coverage: **96.71% statements, 90.76% branches, 96.35% functions, 97.6% lines**. The repository's strict **100%** global coverage gate remains **FAILED**; do not downgrade or suppress it.

## Release boundaries

This completes the user-authorized implementation of the approved visual rework but does **not** assert that all G01–G60 have been manually verified. Native VoiceOver, low-battery notification, sleep/wake, login-at-start, real menu bar and Apple notarization remain separate acceptance work. Developer signing is ad hoc and the build has **not** been published, pushed, tagged or released.

Do not alter the approved sidebar or primary layout without fresh UI approval. Preserve the existing PRD's product behavior and local-only safety rules.
