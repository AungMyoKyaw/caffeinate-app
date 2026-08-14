# Caffeinate Normal-Window UI Redesign

## Objective

Redesign Caffeinate as a focused, ordinary macOS desktop application. Keep the standard decorated window, Dock presence, traffic-light controls, and existing application lifecycle. Do not add a menu-bar item, tray-only mode, popover, hidden Dock icon, or utility-panel behavior.

The redesign fixes the current interface's excessive scale, dead space, weak alignment, repeated information, and illegible disabled controls without changing its process-management behavior.

## Window

- Default size: 600 × 520 points.
- Minimum size: 540 × 480 points.
- Standard resizable, decorated Tauri window with the title `Caffeinate`.
- The layout remains composed and readable when enlarged, but does not stretch controls across the available width.
- The content uses one centered column with a maximum width of approximately 520 points.

## Application icon

The Dock icon remains the existing orange power-mark design, but its optical scale is corrected. The current SVG draws its orange rounded rectangle across the full 1024 × 1024 canvas, so macOS displays it substantially larger than neighboring icons.

- Keep a square 1024 × 1024 transparent source canvas.
- Inset the complete rounded-square artwork to approximately 824 × 824, centered with 100 points of transparent space on every side.
- Scale the internal power mark together with the orange container so their current proportions do not change.
- Keep the orange, dark glyph, corner shape, and overall identity unchanged.
- Regenerate all packaged icon assets from the corrected source with Tauri's current `tauri icon` workflow, including `icon.icns`, `32x32.png`, `128x128.png`, and `128x128@2x.png`.
- Inspect the installed/running icon beside other ordinary macOS applications in the Dock. Adjust the inset only if optical comparison shows that the 824-point target is still visibly mismatched.

This follows the current Tauri 2 documentation: `tauri icon` accepts a square PNG or SVG with transparency and generates the platform assets referenced by `bundle.icon`. Tauri does not define macOS optical padding, so the transparent inset is an application artwork decision rather than a configuration workaround.

## Information hierarchy

The window has four visually connected regions:

1. A compact application header with the icon and product name on the left and `Local only` on the right.
2. A status/action region that pairs concise status copy with the primary power control.
3. A settings group containing duration and display-awake controls.
4. A quiet command footer.

Borders and spacing establish grouping without making each region look like a separate page. The status/action region is no longer a large marketing-style hero.

## Status and primary action

- Present the status copy and action as one compact composition rather than a tall centered stack.
- Use `Awake` or `Ready` as the small state label.
- Reduce the headline from 38–46 points to approximately 28–32 points.
- Keep the existing explicit titles: `Mac stays awake.` and `Mac can sleep.`
- Keep one short explanatory sentence beneath the title.
- Reduce the circular power control from 124 points to approximately 92 points.
- Retain the visible text action below the control and the Command–Return shortcut.
- Active state uses Volt green, but the accent is contained to the state indicator and control rather than dominating the entire window.
- Busy, focus, hover, and reduced-motion behavior remain accessible.

## Settings

- Duration appears once as the row label and once in the segmented control; remove the redundant selected-duration pill.
- Keep the presets `Until stopped`, `30m`, `1h`, `2h`, and `4h`.
- Give the first segment enough width to show its label without crowding.
- Keep `Keep display on` as a separate row with a native-looking switch aligned to the trailing edge.
- While a wake session is active, settings remain readable at normal text contrast. Disabled state is communicated through control treatment and cursor behavior, not by fading the entire rows to near illegibility.
- Settings remain noninteractive during initial checking, busy transitions, and active sessions.

## Command footer

- Keep the exact command preview because it makes the local behavior transparent.
- Render it in a compact, low-emphasis footer with a monospace value.
- Truncate safely if the window is narrow and expose the complete command through the element's title text.

## Responsive behavior

- The normal layout uses a two-column status/action composition and two-column setting rows.
- Near the 540-point minimum width, spacing tightens while labels and controls remain aligned.
- The app does not turn into a popover or menu-bar layout at any width.
- Vertical scrolling should not be necessary at the configured minimum size in ordinary states. An error alert may increase the content height without obscuring controls.

## Behavior and architecture

The redesign is frontend presentation work plus window sizing:

- `src/App.svelte` retains the current typed client, state machine, polling, keyboard shortcut, and semantic controls.
- `src/styles.css` retains the Carbon + Volt tokens, dark/light appearance, high-contrast support, and reduced-motion support, with adjusted layout and state styling.
- `src-tauri/tauri.conf.json` changes only the main window's default and minimum dimensions. Decorations, resizability, title, and normal app behavior remain enabled.
- Rust process ownership and the Tauri command contract do not change.

## Errors and state transitions

- Initial reconciliation keeps the primary action unavailable and preserves layout.
- Busy state replaces the power glyph with the existing progress indicator.
- Errors appear inline between the status/action region and settings with `role="alert"`.
- A naturally expired session returns to the ready state through existing polling.
- No state change depends on color alone.

## Verification

- Update component tests only where markup or accessible presentation changes; retain behavior coverage for start, stop, duration, display-awake, keyboard shortcut, polling, and errors.
- Add assertions preventing redundant selected-duration copy if practical.
- Run frontend tests, type checking, production build, and Rust tests.
- Launch the macOS application and inspect idle, active, busy, error, dark, and light appearances at default and minimum window sizes.
- Rebuild the icon set from the corrected source and compare the Dock icon's optical size with adjacent standard macOS app icons.

## Acceptance criteria

- The product remains a normal macOS windowed application with a Dock icon and standard window chrome.
- No menu-bar, tray, popover, accessory-only, or hidden-Dock behavior is introduced.
- The Dock icon retains its design but no longer appears oversized beside neighboring applications.
- Default window size is 600 × 520 and minimum size is 540 × 480.
- The interface no longer reads as an oversized dashboard or marketing hero.
- The status/action area, settings, and footer share a consistent alignment system.
- The primary action is visually clear without overwhelming all secondary information.
- Duration selection is not redundantly repeated.
- Disabled settings remain legible while clearly noninteractive.
- Existing Caffeinate behavior and accessibility semantics continue to work.
