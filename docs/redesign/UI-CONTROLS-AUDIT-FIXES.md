# Caffeinate 3.0 — Shared Controls UI Audit and Fixes

**Date:** 2026-10-19
**Change scope:** User-approved fixes to the existing Stillwater implementation, including other screens with the same class of control issues. No release or publication approval implied.

## Confirmed issues fixed

| Severity | Screen | Original issue | Implemented resolution |
|---|---|---|---|
| P2 | Settings | Appearance native select showed inconsistent macOS double up/down arrows relative to the understated Stillwater controls | Native `<select>` preserved, CSS `appearance:none`, one decorative SVG downward chevron, consistent padding/border/focus/hover across themes |
| P2 | Schedules | Action select reused inconsistent native styling | Shared `.select-shell` control matching Appearance; retained keyboard and native popup semantics |
| P1 | Settings | “Save preferences” cut off at the bottom of 600×520 macOS default window | Dedicated scroll region with permanently visible bottom Save action; measured visibility at both supported window sizes |
| P2 | Settings | Global Shortcut / Show Window Shortcut looked like plain “Not set” text instead of editable fields | Explicit `type="text"`, visible field border, consistent dimensions and padding; the original native save handler remains |
| P2 | Quick actions | Bright white HTML quick-action menu in dark Stillwater mode | Menu now uses the application's actual semantic light/dark background, foreground and border tokens |
| P3 | Quick actions | Popup could remain open after clicking elsewhere or pressing Escape | Escape closes and returns keyboard focus to the trigger; clicking outside closes |
| P3 | Session custom duration | Native number-input spinner arrows differed from the simple duration interface | Hide decorative spinner controls, retaining native numeric keyboard input and validation |

## Playwright CLI evidence

The actual Svelte application was rendered with a **test-only, read-only Tauri IPC shim**. No real wake assertions, application preferences or installed Caffeinate runtime were modified for browser inspection. Tested in Chromium at:
- **600×520 native-equivalent window** (600×481 embedded webview).
- **540×480 minimum native-equivalent window** (540×441 embedded webview).
- Light and dark appearance.
- Navigation through Session, Profiles, Schedules, History and Settings; controls present and no horizontal overflow.
- Appearance selection and Schedules Action native select keyboard semantics, visibility of shortcut input borders.
- Save preferences remaining inside visible webview after scrolling, including minimum-size window.
- Quick-action menu appearance in dark mode, Escape dismissal, focus restoration and outside-click dismissal.

Screenshots:
- [Before Settings](audit-before-settings.png), [before Schedules](audit-before-schedules.png), [before dark quick actions](audit-before-dark-quickmenu.png).
- [After Settings 600 light](audit-after-settings-600-light.png), [After Settings 600 dark](audit-after-settings-600-dark.png).
- [After Settings 540 light](audit-after-settings-540-light.png), [After Settings 540 dark](audit-after-settings-540-dark.png).
- [After Schedules 600 light](audit-after-schedules-600-light.png), [After Schedules 540 dark](audit-after-schedules-540-dark.png).
- [After dark quick actions](audit-after-dark-quickmenu.png).

## Verification results

- **63 / 63** frontend Vitest tests passed, including two new targeted UI regressions.
- **17 / 17** Rust tests passed (Rust implementation unchanged by this UI pass).
- Svelte typecheck: **0 errors, 0 warnings**.
- ESLint, Prettier and v3 contract check passed.
- Playwright final review had no console or page errors.
- **Apple Silicon application bundle** built, ad-hoc signature verified.
- **Apple Silicon DMG** built, checksum verified. First DMG bundling attempt was blocked by a resource-busy **temporary build-owned** mount; the volume was positively identified and normally detached without force; retry succeeded.

### Open acceptance items unrelated to this UI fix

- The repository's strict frontend coverage threshold remains 100% and currently fails: 97.24% statements, 91.38% branches, 97.14% functions and 98.14% lines. The threshold was not weakened.
- Actual native macOS VoiceOver, live system-sleep/lid-close behavior, system menu, permission prompts, device batteries and notarization are **not** proven by browser-shim tests and remain separate acceptance gates.
- The existing installed `/Applications/Caffeinate.app` and its running process were **not** replaced, terminated or reset.
- No Git commit, push, deployment or publication was performed.

## Local rebuilt artifacts

- `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Caffeinate.app`
- `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/Caffeinate_3.0.0-beta.0_aarch64.dmg`

To view the new app, quit any already-running older Caffeinate process normally, then open the rebuilt application above. The existing installed version is not automatically replaced.
