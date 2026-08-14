# Caffeinate Svelte + Carbon Volt Design

## Product intent

Caffeinate is a macOS-only, local-only control surface for `/usr/bin/caffeinate`. Its job is to let a person start one wake session, understand exactly what is being prevented, optionally keep the display awake, choose a bounded duration, and stop the session cleanly. It is not a dashboard, scheduler, account product, or menu-bar utility.

## Rewrite boundary

The frontend is replaced from React with Svelte 5. The Rust process controller is retained because it already owns the safety-critical behavior correctly: fixed executable path, typed options, process ownership, stale-child reconciliation, timeout validation, `-w <app-pid>` fail-safe, and exit cleanup. Rewriting that controller would add risk without improving the requested UI/UX goal.

## Current research decisions

- Svelte 5 with the official Vite plugin, plain Vite rather than SvelteKit. There is one window and no routing or server rendering requirement.
- Tauri 2 remains the desktop shell and typed Rust bridge.
- Bun remains the package manager, pinned to the current official stable release used by the project tooling research.
- Vite remains on its existing major because the current Svelte Vite plugin supports Vite 8.
- The app uses the macOS system font stack and inline SVG glyphs. No web fonts, icon packages, UI kits, router, global state package, animation package, or analytics package.
- Accessibility follows current macOS HIG guidance: strong text contrast, state conveyed with text and shape rather than color alone, visible keyboard focus, reduced-motion support, and controls that remain usable at compact sizes.

## Visual direction: Carbon + Volt

The old UI was calm but visually flat. The new interface keeps macOS restraint while making the awake state unmistakable.

### Palette

Dark appearance uses the Design.md-generated roles as the source of truth:

- App background: `#11130f`
- Primary surface: `#181a16`
- Elevated surface: `#1e201c`
- Primary text: `#ffffff`
- Secondary text: `#b2b3ac`
- Border: `#61635d`
- Awake accent: `#93d500`
- Warm attention accent: `#ff9d3d`
- Error: `#ff837a`

Light appearance uses the Design.md-generated light counterpart:

- App background: `#f4f6ef`
- Primary surface: `#edefe8`
- Primary text: `#292c28`
- Secondary text: `#4d504b`
- Border: `#8e918b`
- Awake accent: `#558100`
- Warm attention accent: `#b45d03`
- Error: `#952524`

### Typography

Use only `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif` and `ui-monospace, "SFMono-Regular", Menlo, monospace`. This avoids a font payload and matches the macOS environment.

Type hierarchy:

- State headline: 40–46 px, 680–720 weight, compact leading.
- Product title: 15 px, 650 weight.
- Primary action label: 15 px, 650 weight.
- Body/status detail: 13–14 px.
- Technical command: 11–12 px mono.

### Layout

A single vertical control surface with four zones:

1. Compact header with product name and local-only assurance.
2. Open state stage containing the status signal, headline, detail, and one circular wake control.
3. Two settings rows: visible duration rail and display toggle.
4. Technical command footer.

No navigation, cards grid, sidebar, decorative hero, or marketing content.

### Signature interaction

The primary action is a 124 px circular control. Ready state uses a restrained carbon ring and a power glyph. Active state becomes a solid Volt control with a second state ring and explicit text. The visual change is paired with copy (`Mac can sleep.` → `Mac stays awake.`), status text (`Ready` → `Awake`), and the action label (`Keep Mac Awake` → `Allow Sleep`) so state is never color-only.

The duration selector becomes a five-segment radio rail: `Until stopped`, `30m`, `1h`, `2h`, `4h`. It is faster to scan than a select and remains a single lightweight native form group.

### Motion

Only state transitions use motion: 160–220 ms transform/opacity/border transitions and a subtle active-ring pulse. Under `prefers-reduced-motion: reduce`, all nonessential animation is disabled.

## Behavior and data flow

1. Svelte mounts and asks the Tauri bridge for current status.
2. UI reconciles with the Rust-owned process state.
3. User chooses duration/display options while idle.
4. Primary action calls `start_caffeinate` or `stop_caffeinate` through a typed client.
5. While active, the UI polls status every second to show remaining time and detect natural timeout.
6. Rust remains authoritative for process lifetime and exact command.
7. Command-Return triggers the same primary action.

## Error and loading states

- Initial state: primary control disabled until first status reconciliation completes; status copy indicates checking state without layout shift.
- Busy state: primary control is disabled and uses a compact in-control progress mark.
- Error state: one inline `role="alert"` region appears between state and settings, with no modal and no hidden failure.
- If an active process naturally exits, the next poll returns idle and UI restores editable settings.

## Accessibility

- Semantic `main`, `header`, `fieldset`, `legend`, `button`, and native form inputs.
- `aria-live="polite"` for status changes and `role="alert"` for errors.
- Primary action has a literal accessible name in both states.
- Strong `:focus-visible` treatment on every interactive control.
- Minimum interactive geometry stays above macOS HIG minimums.
- Active state is communicated through text, geometry, and color.
- High-contrast and reduced-motion media queries avoid relying on subtle effects.

## Lightweight budget

Production dependencies should drop from three (`@tauri-apps/api`, React, React DOM) to two (`@tauri-apps/api`, Svelte). No new production dependency beyond Svelte is allowed. Development-only quality tooling may be added because it does not ship in the application bundle.

Measure before/after:

- Production dependency count.
- Frontend source bytes.
- Vite production asset bytes when dependency installation is available.
- macOS `.app`/DMG size when macOS packaging is available.

## Acceptance criteria

- React is completely removed from app source/configuration.
- Svelte 5 is the only frontend UI framework.
- Core behavior and Tauri command contract remain intact.
- Ready, busy, active, and error states are visually distinct and accessible.
- Duration rail and display toggle work only when idle.
- Command-Return continues to trigger the primary action.
- Light/dark appearance and reduced-motion behavior are implemented.
- No network requests, telemetry, accounts, tray/menu-bar mode, shell plugin, or arbitrary command execution is introduced.
- No new production dependency besides Svelte.
