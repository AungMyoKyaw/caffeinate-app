# Lightweight Measurements

## Baseline

Measured before the rewrite from the bundled repository:

- Direct production dependencies: **3** — `@tauri-apps/api`, `react`, `react-dom`.
- Selected frontend source (`App.tsx`, `main.tsx`, `styles.css`, and frontend library modules): **17,479 bytes**.
- Production bundle/package size: **not measurable in this sandbox** because the dependency toolchain is unavailable.

## Svelte rewrite

Measured from the rewritten source:

- Direct production dependencies: **2** — `@tauri-apps/api`, `svelte`.
- Direct production dependency count: **1 fewer (33.3% reduction)**.
- Selected frontend source (`App.svelte`, `main.ts`, `styles.css`, and frontend library modules): **21,345 bytes**.
- Source-text increase: **3,866 bytes**. This is primarily the more complete state-driven UI and CSS design system; source bytes are not a runtime bundle measurement.
- New runtime UI-kit/router/state/icon/font/animation dependencies: **0**.
- Generated verification screenshots: documentation-only; they are not referenced by the Tauri frontend and do not ship in `dist`.

## Runtime/package measurements

The following required measurements are blocked in the current Linux sandbox:

- Vite production JavaScript/CSS asset sizes — requires a valid Svelte dependency install.
- Universal macOS binary size — requires the Rust/Tauri toolchain and macOS target.
- `.app` size and DMG size — requires macOS packaging.
- Native launch time, idle CPU, and idle memory — requires a runnable macOS application.

These are intentionally not estimated or fabricated.
