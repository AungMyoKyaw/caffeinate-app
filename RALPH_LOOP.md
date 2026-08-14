# Project Ralph Loop — Svelte Rewrite

## Goal

Replace the React frontend with a professional, accessible, lightweight Svelte 5 control surface without changing the safe Rust ownership model for `/usr/bin/caffeinate`.

## Current state

- Tauri 2 + Rust backend already owns a fixed `/usr/bin/caffeinate` child safely.
- React 19 frontend provides start/stop, duration, display-awake, command preview, polling, and Command-Return.
- Current visual language is calm but has weak state hierarchy.
- Baseline production dependency count: 3 (`@tauri-apps/api`, React, React DOM).
- Baseline selected frontend source bytes: 17,479 bytes.
- Local sandbox lacks Bun and Rust toolchains, so dependency/native build gates begin as environment blockers until proven otherwise.

## Acceptance criteria

- Svelte 5 replaces React fully.
- Existing user-observable wake-session behavior remains.
- Ready/active/busy/error states are clear without relying on color alone.
- No new production dependency beyond Svelte.
- No network, shell plugin, tray/menu-bar behavior, or arbitrary command execution.
- Formatter, lint, type/Svelte check, tests, 100% coverage, build, Rust checks, visual verification, docs, CI, and Git bundle are verified or assigned an evidence-backed blocker.

## Fast inner Ralph loop

For each coherent slice:

1. **R — Research:** inspect affected source/tests and current official docs already gathered for Svelte 5, Tauri 2, Bun, and macOS HIG.
2. **A — Architect:** make the smallest change; keep Tauri command and process boundaries stable.
3. **L — Lay down:** implement only that slice with focused files and no production dependency creep.
4. **P — Prove:** run the smallest available checks: Node contract/static scripts always; formatter/lint/type/test/build when dependencies are installed; Chromium fixture for visual slices.
5. **H — Harden:** inspect accessibility, local-only security, keyboard behavior, cleanup, errors, overflow, reduced motion, and dependency impact.

Targeted commands once dependencies are available:

```bash
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run coverage
bun run build
node scripts/verify-contract.mjs
```

Rust slice commands when Rust is available:

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
```

## Full release Ralph loop

```bash
bun install --frozen-lockfile
bun run verify
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
bun run tauri:build
node scripts/verify-contract.mjs
git diff --check
git bundle create Caffeinate-macOS-svelte.bundle --all
git bundle verify Caffeinate-macOS-svelte.bundle
```

Then clone the bundle, inspect history/files, and rerun environment-supported verification from that clone.

## Known risks

- Svelte/quality-tool dependency migration requires regenerating `bun.lock`; this sandbox may block it because Bun/network tooling is unavailable.
- Native macOS `.app`/DMG packaging cannot run on the current Linux sandbox.
- Rust verification is blocked if the Rust toolchain cannot be installed.
- Native Tauri visual verification is unavailable on Linux; Chromium visual fixture verification is the fallback for frontend appearance only.

## Exit conditions

The loop exits only when every required gate is `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE` with direct evidence, the source rewrite is committed, and the generated Git bundle verifies and clone-tests successfully. No unexecuted gate may be described as passed.
