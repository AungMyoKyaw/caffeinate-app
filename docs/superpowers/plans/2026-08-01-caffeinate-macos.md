# Caffeinate macOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a macOS-only Tauri desktop app that safely starts, reports, and stops the built-in `caffeinate` utility from a normal application window.

**Architecture:** React renders a single Operate-mode control surface and invokes three typed Tauri commands. Rust directly owns the fixed `/usr/bin/caffeinate` child process in managed state and releases it on stop or `RunEvent::Exit`.

**Tech Stack:** Bun 1.3.14, React 19.2.8, Vite 8.1.5, Tauri CLI 2.11.4, Tauri API 2.11.1, Rust/Tauri 2.

## Global Constraints

- macOS only.
- Normal desktop window; no menu bar or tray application.
- Bun is the only JavaScript package manager and script runner.
- No arbitrary shell execution or Tauri shell plugin.
- No network requests, telemetry, accounts, or personal data storage.
- `/usr/bin/caffeinate` must stop when the application exits.
- Impeccable Operate-mode UI; no card grid, gradient, glassmorphism, or excessive pills.

---

### Task 1: Repository and product contract

**Files:**
- Create: `package.json`, `bunfig.toml`, TypeScript/Vite configuration
- Create: `PRODUCT.md`, `DESIGN.md`, `RALPH_LOOP.md`
- Create: `scripts/verify-contract.mjs`

**Interfaces:**
- Produces: deterministic repository constraints consumed by all later tasks.

- [ ] Write a failing contract validator for required Tauri, Bun, lifecycle, and UI markers.
- [ ] Run `node scripts/verify-contract.mjs` and confirm it fails before implementation.
- [ ] Add project configuration and documentation.
- [ ] Commit the setup and failing contract.

### Task 2: Rust caffeinate controller

**Files:**
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/caffeinate.rs`
- Create: `src-tauri/capabilities/default.json`

**Interfaces:**
- Produces commands `start_caffeinate`, `stop_caffeinate`, `get_caffeinate_status`.
- Produces camelCase `CaffeinateStatus` matching the frontend contract.

- [ ] Write Rust unit tests for arguments and timeout validation.
- [ ] Implement process ownership, reconciliation, stop, and cleanup.
- [ ] Register commands and `RunEvent::Exit` cleanup.
- [ ] Configure a macOS app/dmg bundle and minimal capabilities.
- [ ] Commit the backend.

### Task 3: Frontend control surface

**Files:**
- Create: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `src/lib/caffeinate.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`

**Interfaces:**
- Consumes: the three Tauri commands and shared data contracts.
- Produces: keyboard-accessible single-window UI.

- [ ] Write Bun tests for duration and status formatting.
- [ ] Implement the typed Tauri adapter.
- [ ] Implement status polling and `⌘ Return` action.
- [ ] Implement Impeccable visual tokens and responsive minimum-window layout.
- [ ] Commit the frontend.

### Task 4: Icons, preview, and documentation

**Files:**
- Create: `src-tauri/icons/*`, `docs/preview.html`, `docs/screenshots/*`
- Create: `README.md`, `CHANGELOG.md`, `LICENSE`

**Interfaces:**
- Produces: build instructions, app assets, and deterministic visual fixtures.

- [ ] Generate a source icon and macOS bundle icons.
- [ ] Create a static preview matching the React UI.
- [ ] Render desktop and compact screenshots.
- [ ] Run one Impeccable audit, one repair batch, and one confirmation render.
- [ ] Commit documentation and visual evidence.

### Task 5: Ralph verification and release source archive

**Files:**
- Update: `RALPH_RUN_LOG.md`
- Create: release ZIP and SHA-256 file outside the repository.

**Interfaces:**
- Produces: a clean, user-downloadable source package.

- [ ] Run the repository contract validator.
- [ ] Run available syntax/static checks.
- [ ] Record unavailable macOS/Bun/Rust checks explicitly.
- [ ] Commit the verified implementation.
- [ ] Create a Git archive, inspect it, and calculate SHA-256.
