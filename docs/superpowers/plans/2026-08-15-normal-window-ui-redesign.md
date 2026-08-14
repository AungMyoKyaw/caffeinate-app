# Normal-Window UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized dashboard-like interface with a balanced 600 × 520 normal macOS window and correct the Dock icon's optical size without changing wake-session behavior.

**Architecture:** Keep the existing Svelte state machine and Rust/Tauri command boundary intact. Reshape only the Svelte presentation, Carbon + Volt CSS tokens, Tauri window dimensions, and source icon geometry; regenerate packaged icons through the official Tauri 2 icon command. Existing uncommitted work must be preserved, and commits must contain only files intentionally changed for each task.

**Tech Stack:** Svelte 5, Tailwind CSS 4, TypeScript 6, Vitest/jsdom, Tauri 2, Rust, SVG/ICNS/PNG assets

---

## File map

- `src/App.svelte` — application state wiring and semantic UI markup; retain behavior and replace the oversized layout.
- `src/styles.css` — shared Carbon + Volt tokens, global sizing, appearance modes, motion, and accessibility media queries.
- `src/App.test.ts` — component behavior and structural regression coverage.
- `src-tauri/tauri.conf.json` — normal main-window default/minimum dimensions and bundle icon paths.
- `src-tauri/icons/app-icon.svg` — canonical transparent 1024-point source artwork.
- `src-tauri/icons/32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns`, and generated platform assets — outputs from `tauri icon`.

### Task 1: Protect the compact information hierarchy with tests

**Files:**

- Modify: `src/App.test.ts`
- Test: `src/App.test.ts`

- [ ] **Step 1: Add a failing regression test for nonredundant duration presentation**

Add this test inside `describe("App", ...)`:

```ts
it("presents duration once without a redundant selected-value pill", async () => {
  const { client } = makeClient();
  const target = await render(client);

  expect(target.querySelector('[data-testid="selected-duration-pill"]')).toBeNull();
  expect(target.querySelector('[aria-label="Wake session duration"]')).not.toBeNull();
  expect(target.querySelectorAll('input[name="duration"]')).toHaveLength(5);
});
```

- [ ] **Step 2: Add a failing regression test for the unified status/action region**

Add:

```ts
it("groups state copy and the primary action in one compact region", async () => {
  const { client } = makeClient();
  const target = await render(client);
  const region = target.querySelector('[data-testid="status-action"]');

  expect(region).not.toBeNull();
  expect(region?.textContent).toContain("Mac can sleep.");
  expect(region?.querySelector(".power-control")).not.toBeNull();
});
```

- [ ] **Step 3: Run the focused component tests and confirm the new structural assertions fail**

Run:

```bash
bun run test -- src/App.test.ts
```

Expected: the existing behavior tests pass, while the new duration-label/status-action tests fail because the new accessible label and region marker do not exist yet.

- [ ] **Step 4: Commit only the test change**

```bash
git add src/App.test.ts
git commit -m "test: define compact window UI structure"
```

Before committing, inspect `git diff --cached` and confirm no unrelated pre-existing edits are staged.

### Task 2: Implement the balanced normal-window layout

**Files:**

- Modify: `src/App.svelte`
- Modify: `src/styles.css`
- Test: `src/App.test.ts`

- [ ] **Step 1: Remove the redundant selected-duration derived value**

Delete `selectedPresetLabel` and remove its pill from the Duration label. Keep `DURATION_PRESETS`, `timeoutSeconds`, and the native radio group unchanged.

- [ ] **Step 2: Replace the tall hero with one status/action composition**

Reshape the top of `<main>` to use this semantic structure while retaining the existing Svelte copy and event handlers:

```svelte
<section
  data-testid="status-action"
  class="status-action"
  aria-live="polite"
  aria-atomic="true"
>
  <div class="status-copy">
    <div class="status-label">
      <!-- retain the current active lightning / ready dot conditional -->
      <span>{copy.statusLabel}</span>
    </div>
    <h1>{copy.title}</h1>
    <p>{copy.detail}</p>
  </div>

  <div class="action-stack">
    <!-- retain the existing button behavior, busy indicator, power SVG, and active ring -->
    <div class="action-label">
      <strong>{copy.actionLabel}</strong>
      <span>⌘ Return</span>
    </div>
  </div>
</section>
```

The resulting layout must use a roughly 2:1 text/action split, a 92-point circular button, a 28–32-point headline, and no fixed 314-point hero height.

- [ ] **Step 3: Rebuild the settings group around readable rows**

Apply `aria-label="Wake session duration"` to the duration rail. Keep the first segment wider than the four abbreviated segments. Do not apply opacity to the entire rail or switch label when `settingsDisabled`; instead, style disabled controls with subdued borders/backgrounds while keeping all explanatory text at its normal token color.

- [ ] **Step 4: Tighten the shared layout and command footer**

Set the page to a centered content column with a maximum width near 520 points, consistent 24-point horizontal padding, and connected separators. Add `title={command}` to the footer `<code>` so truncation does not hide the complete command.

- [ ] **Step 5: Adjust global minimum sizing and compact-state styles**

In `src/styles.css`, change the body minimums to match the Tauri window contract:

```css
body {
  min-width: 540px;
  min-height: 480px;
}
```

Retain the current light/dark tokens, focus visibility, `prefers-reduced-motion`, and `prefers-contrast`. Add only the focused component classes required by the new markup; do not introduce another UI library or animation dependency.

- [ ] **Step 6: Run formatting, type checking, and focused tests**

Run:

```bash
bunx prettier --write src/App.svelte src/styles.css src/App.test.ts
bun run typecheck
bun run test -- src/App.test.ts
```

Expected: Svelte reports zero errors and all `src/App.test.ts` tests pass, including the two new structural regressions.

- [ ] **Step 7: Inspect and commit the presentation change**

```bash
git diff -- src/App.svelte src/styles.css src/App.test.ts
git add src/App.svelte src/styles.css src/App.test.ts
git diff --cached
git commit -m "feat: rebalance normal window interface"
```

Because `src/App.svelte` and `src/styles.css` already contain uncommitted work, verify the staged diff carefully and preserve every existing behavior rather than reverting or rewriting unrelated portions.

### Task 3: Set normal macOS window dimensions

**Files:**

- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Change only the main-window dimensions**

Replace the four sizing fields with:

```json
"width": 600,
"height": 520,
"minWidth": 540,
"minHeight": 480
```

Keep `decorations: true`, `resizable: true`, `fullscreen: false`, title, label, and all normal application behavior unchanged.

- [ ] **Step 2: Validate the Tauri configuration through a production build**

Run:

```bash
bun run build
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: Vite completes a production build and Cargo finishes without errors.

- [ ] **Step 3: Commit the window configuration**

```bash
git add src-tauri/tauri.conf.json
git commit -m "fix: size the normal app window appropriately"
```

### Task 4: Correct and regenerate the Dock icon

**Files:**

- Modify: `src-tauri/icons/app-icon.svg`
- Regenerate: `src-tauri/icons/32x32.png`
- Regenerate: `src-tauri/icons/128x128.png`
- Regenerate: `src-tauri/icons/128x128@2x.png`
- Regenerate: `src-tauri/icons/icon.icns`
- Regenerate: other icon files emitted by the configured Tauri 2 CLI

- [ ] **Step 1: Inset the complete source artwork on its transparent canvas**

Wrap the existing rounded rectangle and power paths in a group that maps the original 1024-point design to a centered 824-point visual area:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <g transform="translate(100 100) scale(0.8046875)">
    <rect width="1024" height="1024" rx="224" fill="#D58A2A"/>
    <path d="M512 238v278" fill="none" stroke="#2B201A" stroke-width="78" stroke-linecap="round"/>
    <path d="M348 314a292 292 0 1 0 328 0" fill="none" stroke="#2B201A" stroke-width="78" stroke-linecap="round"/>
    <circle cx="512" cy="548" r="42" fill="#2B201A"/>
  </g>
</svg>
```

This keeps the existing design proportions and creates 100 transparent points on each edge.

- [ ] **Step 2: Regenerate platform assets using the current Tauri 2 workflow verified through Context7**

Run:

```bash
bun run tauri icon src-tauri/icons/app-icon.svg -o src-tauri/icons
```

Expected: the CLI regenerates `icon.icns` and PNG assets from the square transparent SVG without errors.

- [ ] **Step 3: Verify dimensions, alpha, and Tauri bundle references**

Run:

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha src-tauri/icons/icon-1024.png src-tauri/icons/128x128@2x.png
file src-tauri/icons/icon.icns
rg -n 'icons/(32x32|128x128|128x128@2x|icon\.icns)' src-tauri/tauri.conf.json
```

Expected: the source output is 1024 × 1024 with alpha, the retina PNG is 256 × 256 with alpha, `icon.icns` is recognized as a macOS icon, and all four bundle paths remain configured.

- [ ] **Step 4: Inspect the regenerated 1024 PNG**

Open `src-tauri/icons/icon-1024.png` and confirm the orange rounded square is centered, has approximately 100 transparent pixels on each edge, and the power mark retains its proportions.

- [ ] **Step 5: Commit the canonical source and generated assets**

```bash
git add src-tauri/icons
git diff --cached --stat
git commit -m "fix: normalize Dock icon optical size"
```

### Task 5: Full verification and native visual check

**Files:**

- Modify only if a verification failure exposes a defect in an already listed file.

- [ ] **Step 1: Run the complete frontend verification pipeline**

Run:

```bash
bun run verify
```

Expected: formatting, lint, Svelte type checking, focused-test detection, coverage, production build, and contract verification all pass.

- [ ] **Step 2: Run the Rust test suite**

Run:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: all Rust unit tests pass.

- [ ] **Step 3: Launch the normal desktop application**

Run:

```bash
bun run tauri:dev
```

Verify the standard decorated window opens at 600 × 520 with a Dock icon and no menu-bar/tray behavior. Check ready and active states, duration selection, display toggle, Command–Return, dark/light appearances, and the 540 × 480 minimum size.

- [ ] **Step 4: Compare the Dock icon optically**

Place Caffeinate beside several ordinary macOS application icons. Confirm its visible orange tile is comparable in scale rather than filling the full Dock slot. If it is still visibly oversized, adjust only the inset in `app-icon.svg`, regenerate, and repeat the dimension/visual checks.

- [ ] **Step 5: Review the final diff and repository state**

Run:

```bash
git status --short
git diff --check
git log -5 --oneline
```

Expected: no whitespace errors; all task commits are present; any unrelated pre-existing user changes remain preserved and identifiable.

