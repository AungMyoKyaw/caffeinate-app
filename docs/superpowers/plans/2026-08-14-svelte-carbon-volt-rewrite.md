# Svelte Carbon Volt Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the React frontend with a lightweight Svelte 5 control surface that preserves Caffeinate's local-only macOS process behavior while materially improving state clarity and visual quality.

**Architecture:** Keep the existing Tauri 2/Rust process controller as the authoritative backend. Replace React with one Svelte composition root plus focused presentation/state helpers and a typed injectable Tauri client so UI behavior is testable. Keep styling dependency-free and tokenized in CSS.

**Tech Stack:** Svelte 5.56.9, `@sveltejs/vite-plugin-svelte` 7.3.0, Vite 8.1.5, Tauri 2, Rust, Bun package management, Vitest + jsdom for UI/logic tests, Prettier, ESLint + eslint-plugin-svelte, Svelte Check.

## Global Constraints

- macOS only; normal desktop window; never convert to a menu-bar app.
- Fixed executable `/usr/bin/caffeinate`; no shell plugin or arbitrary command execution.
- Local only: no network, telemetry, accounts, or remote services.
- No new production dependency other than Svelte; no UI kit, router, icon package, font package, or state library.
- 100% statements, branches, functions, and lines for project-owned frontend executable code.
- Preserve exact Tauri command names and Rust-owned lifecycle behavior.

---

### Task 1: Tooling and Svelte entry point

**Files:**

- Modify: `package.json`
- Modify: `index.html`
- Modify: `vite.config.ts`
- Create: `svelte.config.js`
- Create: `src/main.ts`
- Delete: `src/main.tsx`

**Interfaces:**

- Produces: Vite compiles `src/App.svelte` and Tauri still serves port 1420 / `dist`.

- [ ] Replace React/React DOM and the React Vite plugin with Svelte and the official Svelte Vite plugin.
- [ ] Add development-only formatter, linter, Svelte checker, Vitest, coverage, and jsdom tooling with exact compatible versions.
- [ ] Point `index.html` at `src/main.ts` and update theme color.
- [ ] Configure the official Svelte Vite plugin with Tauri's fixed-port/host behavior.
- [ ] Add Svelte compiler configuration.
- [ ] Mount `App.svelte` with Svelte's `mount` API.
- [ ] Run dependency install/build checks when the environment supports the pinned package manager.

### Task 2: Testable frontend domain and bridge

**Files:**

- Modify: `src/lib/caffeinate.ts`
- Rewrite: `src/lib/format.ts`
- Create: `src/lib/presentation.ts`
- Rewrite: `src/lib/format.test.ts`
- Create: `src/lib/caffeinate.test.ts`
- Create: `src/lib/presentation.test.ts`

**Interfaces:**

- Produces: `createCaffeinateClient(invoke)`, `caffeinateClient`, duration helpers, command preview helpers, and pure presentation helpers.

- [ ] Define a minimal `InvokeLike` boundary and inject it into `createCaffeinateClient` so all bridge calls are testable without Tauri.
- [ ] Keep exact command names: `start_caffeinate`, `stop_caffeinate`, `get_caffeinate_status`.
- [ ] Add concise duration labels for the rail while retaining full accessible labels.
- [ ] Add pure state title/detail/action/status helpers.
- [ ] Write behavior tests for every branch and error-independent code path.
- [ ] Run targeted tests and coverage when tooling is available.

### Task 3: Carbon + Volt Svelte control surface

**Files:**

- Create: `src/App.svelte`
- Rewrite: `src/styles.css`
- Delete: `src/App.tsx`
- Create: `src/App.test.ts`

**Interfaces:**

- Consumes: typed client and pure helpers from Task 2.
- Produces: ready, checking, busy, active, timed-active, and error UI states.

- [ ] Implement initial status reconciliation and active-session polling.
- [ ] Implement start/stop actions and Command-Return shortcut.
- [ ] Implement the 124 px circular primary wake control and explicit state copy.
- [ ] Implement five-option duration radio rail and keep-display-awake switch.
- [ ] Disable mutable settings during active/busy states.
- [ ] Render exact command in the technical footer.
- [ ] Add semantic structure, `aria-live`, `role="alert"`, literal labels, focus-visible styling, high-contrast behavior, and reduced-motion behavior.
- [ ] Add jsdom component tests using an injected fake client for ready/start/stop/error/keyboard/timed status paths.
- [ ] Run focused UI tests and coverage when tooling is available.

### Task 4: Contract, documentation, diagrams, and CI

**Files:**

- Modify: `scripts/verify-contract.mjs`
- Rewrite: `DESIGN.md`
- Rewrite: `RALPH_LOOP.md`
- Update: `README.md`
- Update: `.github/workflows/ci.yml`
- Update: `.github/workflows/release.yml`
- Create: `docs/architecture/system-context.md`
- Create: `docs/architecture/module-flow.md`
- Create: `docs/architecture/release-flow.md`
- Create: `docs/performance.md`
- Rewrite: `docs/preview.html`

**Interfaces:**

- Produces: repository contract checks aligned to Svelte, contributor diagrams, reproducible CI, and a no-build visual fixture matching the production CSS.

- [ ] Update repository contract from `App.tsx` to `App.svelte`, assert Svelte and forbid React/runtime bloat.
- [ ] Document architecture and the Carbon + Volt design tokens.
- [ ] Add Mermaid system, module/data-flow, sequence, and release diagrams.
- [ ] Update CI to run format check, lint, Svelte/type check, tests, 100% coverage, contract, build, Rust format/test/clippy, and skip/focus checks.
- [ ] Pin Bun rather than using canary in CI/release workflows.
- [ ] Update README commands and Svelte architecture.
- [ ] Build a static visual fixture that uses the same CSS and state anatomy for browser verification when native Tauri execution is unavailable.

### Task 5: Release Ralph loop and bundle

**Files:**

- Update: `RALPH_RUN_LOG.md`
- Generate: `coverage/` when tooling is available
- Generate: `docs/screenshots/svelte-ready.png`
- Generate: `docs/screenshots/svelte-active.png`
- Generate: `Caffeinate-macOS-svelte.bundle`

**Interfaces:**

- Produces: evidence-backed final repository and complete Git bundle.

- [ ] Run formatter check, linter, Svelte/type checker, full tests, skipped/focused-test scan, coverage, production build, contract, Rust fmt/test/clippy, dependency audit, and docs checks where the environment supports them.
- [ ] Serve the static visual fixture and inspect ready + active states in real Chromium at primary and compact viewport sizes.
- [ ] Capture screenshots and inspect them for clipping, hierarchy, contrast, focus/state treatment, and layout stability.
- [ ] Record source/dependency/build size measurements that can actually be obtained.
- [ ] Commit the rewrite with meaningful commits.
- [ ] Create a complete Git bundle with `git bundle create ... --all`.
- [ ] Run `git bundle verify` and clone the bundle into a temporary directory.
- [ ] Rerun environment-supported contract/static checks in the clone.
