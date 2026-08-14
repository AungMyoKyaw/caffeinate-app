# Caffeinate Svelte Rewrite — Ralph Run Log

Run date: 2026-08-14 (Asia/Bangkok)
Branch: `rewrite/svelte-carbon-volt`

## Research — PASS

Scoped research was completed before source modification:

- Context7: Svelte 5 runes/Vite patterns, Tauri 2 Vite/IPC configuration, Bun coverage behavior.
- Design.md: generated dark and light Carbon + Volt color schemes; icon semantics were reviewed without adding an icon package.
- Firecrawl: current Svelte/Vite plugin, Svelte checker, formatter, lint, Vitest, and TypeScript compatibility metadata; Apple macOS HIG accessibility/layout guidance.
- GitHub release metadata: current checkout/setup-bun action releases were checked before CI edits.

Implementation-impacting decision: current Svelte checker/typescript-eslint peer ranges support TypeScript 6, not TypeScript 7, so the rewrite pins TypeScript 6.0.3 for supported static-analysis tooling.

## Design — PASS

Created `DESIGN.md` and the dated design specification before implementation. Direction: **Carbon + Volt** — a single macOS wake control with much stronger ready/active state geometry, a visible duration rail, explicit local-only assurance, no remote font, no UI kit, and no decorative dashboard patterns.

The Rust `CaffeinateController` was deliberately retained. It already owns the safety-critical fixed-path process contract correctly, so rewriting it would add risk without serving the requested UI rewrite.

## Baseline — PARTIAL EVIDENCE

Recorded before modification:

- production dependencies: 3;
- selected frontend source: 17,479 bytes;
- repository clean after clone;
- input Git bundle verified as complete and cloneable.

Baseline frontend tests/build and Rust tests could not run because Bun and Rust are not installed in this sandbox.

## Fast inner loop — frontend architecture

Implemented:

- React/React DOM removal from source and manifest;
- Svelte 5 composition root and Svelte Vite plugin configuration;
- injectable typed Tauri client;
- pure duration/presentation helpers;
- Vitest unit/component/bootstrap tests;
- 100% statements/branches/functions/lines thresholds in Vitest configuration;
- focused/skipped-test guard;
- Prettier, ESLint/Svelte, and Svelte Check commands;
- no new production dependency beyond Svelte.

Environment-supported proof:

```text
node scripts/check-focused-tests.mjs
Test focus check passed: zero skipped, disabled, todo, or focused tests found.

node scripts/verify-contract.mjs
Contract passed: Svelte frontend, fixed-process safety, local-only scope, coverage policy, and lightweight dependency boundary are intact.

git diff --check
(no output; exit 0)
```

Dependency-aware formatter/linter/type/test/coverage/build execution remains blocked by unavailable Bun/packages.

## Fast inner loop — UI and bug protocol

### Visual fixture hidden-error defect

1. **Reproduce:** first Chromium render showed the error banner in the ready state.
2. **Expected:** no error region when no error exists.
3. **Actual:** CSS `.error-banner { display: flex }` overrode the fixture's `hidden` attribute.
4. **Root cause:** preview fixture used `hidden`, while the real Svelte component conditionally omits the node.
5. **Fix:** added a global `[hidden] { display: none !important; }` rule for deterministic fixture behavior.
6. **Regression proof:** ready Chromium render no longer contains the banner.

### Shared-selector regression introduced during error-state tuning

1. **Reproduce:** error-state Chromium screenshot showed an approximately 270 px header.
2. **Expected:** normal 64 px header.
3. **Actual:** brand lockup inherited the error-state minimum height.
4. **Root cause:** `.error .state-stage` was accidentally inserted into the existing shared flex selector group.
5. **Fix:** restored the flex group and moved `.error .state-stage` to its own selector.
6. **Regression proof:** re-rendered ready, active, error, busy, and compact states; header geometry returned to normal.

### Compact-window overflow

1. **Reproduce:** the 620×560 active preview had a 627 px scroll height and hid the command footer below the viewport.
2. **Expected:** primary UI and command evidence visible at the supported minimum window.
3. **Root cause:** the richer control stage requires more vertical space than the previous React layout.
4. **Fix:** set the native minimum window to 600×640 and default size to 760×680.
5. **Regression proof:** active compact render at 600×640 reports `scrollWidth=600`, `scrollHeight=640`, `clientWidth=600`, `clientHeight=640`.

### Tauri camelCase contract regression found in release audit

1. **Reproduce:** compared the rewritten TypeScript bridge with the retained Rust structs annotated `#[serde(rename_all = "camelCase")]` and the original working React bridge.
2. **Expected:** frontend payload/status fields use `keepDisplayAwake`, `timeoutSeconds`, `startedAtUnixMs`, and `remainingSeconds`.
3. **Actual:** the first Svelte bridge draft used snake_case names, which would break start-command deserialization and make display/remaining status fields undefined.
4. **Root cause:** the frontend rewrite translated Rust field identifiers instead of preserving Serde's JavaScript wire names.
5. **Regression guard:** client/unit fixtures now use the exact camelCase contract, and `scripts/verify-contract.mjs` rejects snake_case drift in the frontend bridge.
6. **Proof available in this sandbox:** `node scripts/verify-contract.mjs` passes after the correction. Native invoke execution remains part of the blocked macOS runtime gate.

## Chromium visual verification — PASS for frontend preview

Rendered the production CSS with a deterministic HTML fixture in real Chromium using the system browser and Playwright control. Direct localhost/file navigation is blocked by sandbox browser policy, so the fixture was loaded with `page.set_content`; rendering still occurred in the real Chromium engine.
State screenshots are captured after a 300 ms settle period so the 180 ms control transition reaches its steady visual state.

Verified screenshots:

- `docs/screenshots/svelte-ready.png` — dark ready, 760×680;
- `docs/screenshots/svelte-active.png` — dark active, 760×680;
- `docs/screenshots/svelte-ready-light.png` — light ready, 760×680;
- `docs/screenshots/svelte-active-compact.png` — dark active compact, 600×640;
- `docs/screenshots/svelte-error.png` — error, 760×680;
- `docs/screenshots/svelte-busy.png` — busy/starting, 760×680.

All default/error/busy renders report no horizontal or vertical overflow at 760×680. Compact active reports no overflow at 600×640. Focus verification on the primary action reported a 3 px solid Volt outline with a 3 px offset. Active controls are visibly disabled and state is communicated by headline/status/action text plus geometry, not only color.

Native Tauri/WebKit visual execution is unavailable in this Linux sandbox; that limitation is recorded separately rather than being folded into the browser-preview result.

## Lightweight evidence — PASS for measurable source/dependency metrics

- direct production dependencies: 3 → 2 (33.3% fewer);
- final selected frontend source: 21,345 bytes;
- runtime UI kit/router/state/icon/font/animation dependencies added: 0;
- production bundle, `.app`, DMG, launch-time, CPU, and memory measurements: blocked until dependency/native builds can run.

See `docs/performance.md`.

## Full release loop — current status

Environment-supported gates rerun after implementation:

- repository contract: PASS;
- focused/skipped-test static guard: PASS;
- Node syntax for repository scripts: PASS;
- whitespace diff check: PASS;
- Chromium preview visual verification: PASS;
- documentation/diagram presence: PASS by source inspection;
- Git repository/bundle verification: pending final commit/bundle step.

Blocked gates:

- `bun install --frozen-lockfile` and lockfile regeneration: Bun/package network unavailable;
- Prettier execution: dependencies unavailable;
- ESLint execution: dependencies unavailable;
- `svelte-check`: dependencies unavailable;
- Vitest suite: dependencies unavailable;
- actual coverage report: dependencies unavailable;
- Vite production build: dependencies unavailable;
- frontend dependency audit: dependencies unavailable;
- Rust format/test/Clippy: Rust toolchain unavailable;
- native macOS `.app`/DMG build: Linux host cannot package/verify the macOS application;
- native Tauri/WebKit runtime visual verification: macOS runtime unavailable.

No blocked gate is reported as passing.
