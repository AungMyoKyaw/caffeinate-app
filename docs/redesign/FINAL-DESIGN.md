# Caffeinate 3.0 — Final Impeccable Design Contract

> **Approved UI update (2026-10-19):** The product owner subsequently approved [PROTOTYPE-REWORK.html](PROTOTYPE-REWORK.html) for implementation. Its sidebar, visual proportions, palette and screen hierarchy supersede conflicting **layout and visual** directions in this older design contract. [UI-REWORK-IMPLEMENTATION.md](UI-REWORK-IMPLEMENTATION.md) records the completed implementation and verification. The product requirements, Rust-owned safety invariants, and G01–G60 are unchanged; release readiness is not implied.

**Document ID:** CFT-3.0-DESIGN-LOCK-1  
**Date:** 2026-10-19  
**Decision:** **STILLWATER** visual identity and **HORIZON** icon concept — both explicitly approved.
**Product specification:** [PRD.md](PRD.md), **CFT-3.0-RC1**, including Q01–Q40, G01–G60 and all operational defaults.
**Approval scope:** Design specification only. **No application implementation has been authorized.**
**Target:** macOS desktop window + native menu bar, Tauri 2 / Rust / Svelte 5 / Tailwind 4 / Bun.
**Impeccable mode:** Operate — utility behavior and access to the primary action lead the visual world.

## 1. Design authority and boundaries

This document is the **source of truth for the planned Caffeinate 3.0 visual implementation**, replacing Carbon + Volt for v3. It is not evidence that any v3 functionality is already implemented. Existing repository `PRODUCT.md` and `DESIGN.md` continue to describe the currently implemented v2.1.0 until the v3 release is built; their legacy restrictions are superseded **as future requirements**, not as current capabilities. If this design contract disagrees with `PRD.md` on functionality, the approved PRD governs product behavior; this document governs v3 layout, copy, tokens, icon and interaction presentation.

**Fixed decisions**
- Product remains **Caffeinate**; macOS only; one logical owned wake session at a time.
- Preserve Tauri 2, Rust, Svelte 5, Tailwind 4 and Bun.
- Native standard macOS title bar; main window **and** menu bar. Hiding the window is not Quitting.
- Primary action: a high-contrast **rectangular text button**, not a giant ornamental power icon. It says **Keep Mac Awake** or **Stop Session**.
- Duration: readily visible **segmented presets with a Custom duration affordance**; current selection and live remaining/end time remain clear.
- Modes: **System / Display / Both**, visible in main window; no misleading promises about closed lids.
- Expandable **Technical details** for the actual command, not a persistent code footer.
- Light / Dark / System theme preferences; deliberate light/dark semantic tokens.
- Controlled, subtle transitions; reduced-motion behavior; accessible focus, keyboard and VoiceOver semantics.
- **Selected identity:** Stillwater; **selected app icon concept:** Horizon. Wayline and Concourse are retained only as rejected/review alternatives.

### What Stillwater is

A quiet, dependable way to hold a Mac awake during a real task. The identity borrows the restraint of a coastal time almanac: chalk-paper ground, deep blue-green typography, sea-green active meaning, precise time notation, and one slim **remaining-time horizon**. It **does not** recreate sea/wave imagery or make the utility a nautical dashboard.

One purposeful signature element: the **time horizon** communicates relative remaining duration for bounded sessions. It is always accompanied by exact remaining time, elapsed and expected end. It is not a live data chart. No animation loops, decorative gradients, glitter, glassmorphism, cards-inside-cards, or fake telemetry.

## 2. Canonical Stillwater design tokens

These are **approved starting design tokens**, captured from the Stillwater prototype and reconciled into semantic names. Implementations may adjust a token **only when needed to meet contrast, macOS appearance, legibility or implementation fidelity**, documenting the before/after; the world must not change. Separate dark tokens are intentional. Colors remain under Tailwind v4 `@theme` + semantic CSS custom properties and respect the application-selected appearance.

### Light appearance

| Token | Hex | Meaning |
|---|---|---|
| `--sw-canvas` | `#F5F7F2` | Window ground: chalk-paper |
| `--sw-ink` | `#15363A` | Primary labels and high-emphasis readout |
| `--sw-secondary` | `#506D6B` | Secondary copy, selected state detail |
| `--sw-rule` | `#CBDED5` | Hairline separators, inactive horizon track |
| `--sw-selected` | `#E6F0E9` | Segmented-control selected surface |
| `--sw-action` | `#267E72` | Active indicator, action surface, horizon fill |
| `--sw-on-action` | `#FFFFFF` | Text on action surface |
| `--sw-annotation` | `#153A3D` | Compact status and technical emphasis |
| `--sw-attention` | `#9A581C` | Accessible warning foreground (verify contrast) |
| `--sw-error` | `#972E35` | Accessible error foreground (verify contrast) |
| `--sw-focus` | `#1F7368` | Visible focus ring (verify adjacent contrast) |

### Dark appearance

| Token | Hex | Meaning |
|---|---|---|
| `--sw-canvas` | `#102C2F` | Deep blue-green window ground |
| `--sw-ink` | `#EEF9F4` | Primary content |
| `--sw-secondary` | `#B0C8BF` | Secondary copy |
| `--sw-rule` | `#42615C` | Borders / inactive track |
| `--sw-selected` | `#1E4543` | Selected controls |
| `--sw-action` | `#70D2B6` | Action and awake signal |
| `--sw-on-action` | `#0A2626` | Text over active surface |
| `--sw-annotation` | `#C9E4DD` | Technical/status detail |
| `--sw-attention` | `#EAB475` | Warning foreground |
| `--sw-error` | `#FFA1A6` | Error foreground |
| `--sw-focus` | `#A8EAD8` | Visible focus ring |

### Context and state colors

- **Ready:** primary text + a labeled neutral dot; do not use green to imply activity.
- **Active:** sea-green indicator, visible **Awake / Mac stays awake** text and action-horizon change.
- **Starting / Updating / Stopping:** informative progress copy and stable layout; not a fictitious percentage.
- **Finished:** stable ready state plus actual completion event; single notification if configured.
- **Battery attention:** amber text and symbol; warning must be understandable without color.
- **Failure:** red/error role plus an actionable message and recovery affordance.
- Colors must be checked in situ for WCAG 2.2 AA-equivalent contrast (normal text 4.5:1, large text 3:1, active controls/focus usable against adjacent surfaces). High-contrast mode strengthens boundaries without changing semantics.
- Tauri/macOS native menu backgrounds and label colors are OS-managed where possible; app CSS tokens should **not** attempt to paint a fake native tray popover.

**Token contrast verification (planning check):** text-on-surface contrast ratios for the selected pairs are light primary 12.01:1, secondary 5.20:1, action 4.87:1, warning 5.14:1, error 7.06:1; dark primary 13.69:1, secondary 8.33:1, action 8.79:1, warning 7.93:1, error 7.66:1. These calculated pairs exceed 4.5:1, but do **not** replace real interface, control-border, focus-ring, VoiceOver, or operating-system theme accessibility tests under G36–G40.

### Typography

- Primary UI font: macOS system sans stack, using SF Pro where the OS provides it; no remote font dependency.
- Numeric timer: system tabular figures (`font-variant-numeric: tabular-nums`). Monospace reserved for exact command/technical data.
- Headline: **32–38 px**, bold ~700, line-height 1.05–1.15, natural sentence case, tracking no tighter than `-0.03em`.
- Remaining time: **40–46 px**, 650–700, tabular figures; adapt down when window constrained.
- Product header: **13–15 px**, 650.
- Button: **13–15 px**, 650–700.
- Labels: **12–13 px**, 600–700.
- Helper/body: **12–14 px**, 450–550; do not squeeze explanatory copy below a legible size to preserve decorative margins.
- Technical details: **11–12 px** mono; must permit copy/selection and horizontal overflow strategies.
- The layout must accommodate macOS text scaling and translated-looking longer English labels without truncating *primary* meaning.

### Spacing, shape, depth

- Base rhythm: 4 px increments; recommended units **4/8/12/16/24/30 px**.
- Window contents: **24–30 px** horizontal padding at full width; compact smoothly to 16–20 px at minimum width.
- Main window target **600×520** starting point, native title bar; preserve existing **540×480 minimum** unless implementation evidence demands an explicitly documented change.
- Group labels near the controls they name; primary status area has more breathing room than options.
- Separators: 1px semantic rule; normal controls use ~8–10px corners; window corners are OS/native.
- Shadows are minimal and purposeful. No glow behind active button or oversized power-ring.
- No fixed-width numeric fields that cause label clipping in the minimum window; tabular timer values maintain stable width.

## 3. Locked main-window composition

The approved prototype `preview-stillwater.png` defines hierarchy and overall character, not byte-perfect geometry. Structure must remain understandable without the Stillwater color:

```text
┌─────────────────────────────────────────────────┐
│ macOS native title bar · Caffeinate             │
├─────────────────────────────────────────────────┤
│ Caffeinate                      Local wake session│
│                                                  │
│ ● SESSION ACTIVE                                 │
│ Your Mac stays                      1h 23m       │
│ awake.                              REMAINING     │
│ System sleep prevention is active.               │
│ ━━━━━━━━━━━──────────  time horizon              │
│ Started 10:12                       Ends 12:35    │
│                             [ Stop Session ]     │
├─────────────────────────────────────────────────┤
│ Wake mode  [ System ] [ Display ] [ Both ]       │
│ Duration   [ Until ] [ 30m ] [ 2h ] [ Custom ]    │
├─────────────────────────────────────────────────┤
│ Technical details ▾                   ⌘ Return   │
└─────────────────────────────────────────────────┘
```

**Window regions**
1. Native title bar, not a custom-drawn imitation.
2. Compact utility header; name and honest local-operation note.
3. **Session status and hero readout**: clear text description, bounded countdown with units or indefinite elapsed state. Status label updates independently of action feedback.
4. **Time horizon**: slim track with fill proportional to elapsed/total (a linear timeline); endpoints explicitly labeled started/ends when bounded. For a two-hour session with 83 minutes remaining, elapsed proportion is **37/120**; do not equate fill with remaining proportion. On duration change, recalculate against the new deadline and actual elapsed window. Idle, indefinite and clock-edge variants use a quiet unfilled or static line without fabricated progress.
5. High-contrast rectangular primary action in a consistent location. When update is in flight, disable only conflicting actions, not the entire UI or quit.
6. Immediately visible segmented wake mode and duration controls. Show all core preset choices; narrow window may use wrapping or a dropdown if equivalent accessibility is preserved.
7. Collapsed Technical details: expandable literal `/usr/bin/caffeinate …` output from Rust, Copy command, app-PID ownership and informative error if unavailable.
8. Secondary navigation (not depicted in the first concept mock): lightweight utility access to **Profiles / Schedules / Recent / Preferences** through one small, stable control, not a permanent side dashboard. Preserve main session dominance. This navigation must be designed during implementation before feature parity testing; it cannot be omitted just because the early concept only illustrates the session surface.

### Active editor interaction

- Tapping a duration preset changes a **draft** selection; while active, an **Apply duration** affordance appears that previews the new expected local end time. The update counts from confirmation time. UI does not prematurely declare the new deadline.
- Mode selection while active likewise stages **Apply mode**. Rust safely swaps/reconciles assertions. While updating, show **Updating wake session…**; on failure, keep actual prior mode in the status readout and display recovery explanation.
- On idle, selected mode/duration persist and the next Start uses the latest selection.
- Custom duration uses an accessible inline hours/minutes input, bounded 1 minute to 24 hours; do not present invalid times as valid.
- A Stop command always remains clear, including while editing, unless currently resolving a race; backend priority handles conflicting writes.

## 4. Native menu-bar design and behavior

**Horizon template icon** left of a concise title:
- Bounded active: icon + localized readable **`1h 23m`** (shorter fallback if constrained).
- Indefinite active: icon with clear menu item description **Awake — Until stopped**; no bogus countdown.
- Idle: icon; menu conveys **Ready** without pretending the Mac's entire power state is known.
- Updating: no fake completion, if necessary reduce title to icon only and display **Updating…** in menu.
- Icon is a **template image** automatically tinted by macOS. It must work on light/dark and high-contrast menu bars.

**Menu order:** state/remaining; **Open Caffeinate**; **Keep Mac Awake / Stop Session**; divider; Duration; Mode; Profiles; next schedule summary (if any); divider; Preferences…; Quit Caffeinate. Menu items can be native nested menus. When main window is hidden, all menu commands still route to Rust and operate. Closing window hides but leaves tray; Quit stops all app-owned assertions and ends app process.

The sample tray shown in `PROTOTYPES.html` is a visual illustration, not a mandate to implement a styled HTML popover.

## 5. Horizon icon lock — vector geometry and assets

**Chosen icon:** **HORIZON** (not the Route or Bars alternatives).

**Semantics:** a clear straight horizon held over time, represented by **two parallel horizontal strokes** and one **short upper-center vertical notch**. Consistent with the approved Stillwater preview; no sun face, cup of coffee, moon or stylized power-button substitute.

**Master geometry (normalised viewBox `0 0 32 32`):**
- Line 1: from `(4,16)` to `(28,16)`.
- Line 2: from `(4,21)` to `(28,21)`.
- Notch: `(16,7)` to `(16,13)`.
- Stroke width initially 2.2 relative to 32 viewBox; round caps/joins, no fill.
- Master foreground: deep sea-green ink on the lighter sea-glass surface; icon is contained in a square macOS-app-icon-friendly design and preserves enough shape/space at 16px.

**Icon asset variants REQUIRED before release:** app 1024×1024 master and macOS .icns/downsamples; adaptive artwork only if applicable; SVG source/master under project assets; monochrome macOS template menu icon at standard points and @2x scales; legibility tests against native menu bars, Dock and Finder. Final app asset vectors / exported images are **not produced by this planning approval**.

**Prohibited substitutions:** the previous orange power glyph, a generic coffee mug, the alternate Route or Bars designs, and arbitrary glyph from icon packages. Retaining a distinctive Horizon silhouette across app and menu is mandatory.

## 6. Component and content contract

**Core controls**
- `SessionStatus`: Ready/Awake/Starting/Updating/Stopping/Error with text and appropriate icon.
- `SessionClock`: remaining, elapsed and local expected end. Fixed alignment and sensible rounding.
- `TimeHorizon`: truthful bounded progress only, accessibility summary (not redundant screen-reader noise).
- `PrimaryAction`: Keep Mac Awake / Stop Session, visible loading/disabled semantics.
- `WakeModeSelector`: System / Display / Both, native radio semantics.
- `DurationSelector`: Until stopped / 30m / 1h / 2h / 4h / Custom, keyboard usable, with edit confirmation when active.
- `TechnicalDetails`: expandable actual command + copy.
- `UtilityNavigation`: Profiles / Schedules / Recent / Preferences, keyboard/VoiceOver accessible.
- `TrayMenu`: genuine native menu, not Svelte HTML pretending to be one.

**Secondary surfaces inherit Stillwater**
- Profiles: short editable list, name, mode and duration; clear Create, Apply and Delete; empty state teaches the first profile without upsell.
- Schedules: one-shot local Start/Stop configuration, clear next trigger, conflict/missed semantics and edit/cancel; never suggest daemon-like behavior after Quit.
- Recent: chronological compact list of last 30 actual sessions, mode/time/end reason, empty state and Clear History.
- Preferences: Light/Dark/System, Launch at login toggle, global shortcuts, notification/battery settings and reset. Keep informational explanations concise.

**Preferred copy**
| State | Status / message | Primary action |
|---|---|---|
| Ready | `Mac can sleep.` — `Start a wake session when you need one.` | `Keep Mac Awake` |
| Starting | `Starting wake session…` | Disabled while starting |
| Active | `Mac stays awake.` — `System sleep is prevented.` (mode-accurate variants) | `Stop Session` |
| Bounded | `1h 23m remaining` and `Ends 12:35 PM` | `Stop Session` |
| Indefinite | `Until stopped` and real elapsed time | `Stop Session` |
| Updating | `Updating wake session…` | Keep Stop discoverable where safe |
| Completed | `Wake session ended.` / `Ready` | `Keep Mac Awake` |
| Error | `Could not update the wake session. Previous settings remain active.` if verified true; otherwise describe unknown state and recheck | `Retry` or `Stop Session` as evidence allows |

Avoid `Mac will never sleep`, `Always awake`, or suggestions that lid-close sleep is prevented. Dynamic copy must accurately distinguish System/Display/Both. All sample durations in design prototypes are **illustrative**, not product telemetry.

## 7. Interaction, responsive and accessibility requirements

- Motion: intentional one-time 160–220ms ease-out on status and horizon state changes; no periodic pulse, spinning halo or parallax. Initial static content visible. Under reduced motion, state text/geometry updates immediately; no inaccessible blink.
- Focus: visible focus ring on all interactive controls, not color-only; keyboard tab order follows rendered order; Return/Space work as expected. Retain local **⌘ Return** to toggle session, and add configurable global shortcuts per PRD only.
- Contrast: every token context meets strong readable contrast; interactive targets have at least practical macOS dimensions; VoiceOver hears state, duration and action with no redundant horizon narration.
- No fake macOS title bar. Use real platform decorations and native tray integration.
- At 600×520 and minimum 540×480, all essential status/control content must fit without clipped words. Secondary views can scroll. Text size scaling must preserve access to Stop.
- Native notifications and menus must follow system accessibility features and OS theming, not CSS approximations.
- System theme mode reacts when macOS appearance changes; explicit theme selection overrides it in the app window only, not the OS-managed menu.
- In dark appearance retain readable text and distinct selected/control states; verify actual macOS high contrast before claiming pass.

## 8. Approved operational defaults and nonvisual behavior

All previously *proposed* operational policies in CFT-3.0-RC1 are approved:
1. Custom duration min 60s, max 86,400s.
2. Active duration edits count from **edit confirmation time**.
3. Low-battery warning at or below **15%** while on battery, rate limited, never auto-stopping session solely for battery state.
4. Recent history capped at **30** completed sessions, local only.
5. Login launch **optional and default off**; it does not automatically start a wake session.
6. One-shot schedules execute only while the application process is running, including when the window is hidden; they do not install a daemon or wake sleeping Mac.
7. Missed schedules remain **Missed**; no late catch-up execution.
8. Conflicting schedule starts **skip** rather than replace a manual active session.
9. Explicit Quit releases owned wake assertions.
10. Global shortcuts have **no default global binding** and must be assigned by the user.
11. Settings/theme/mode/duration survive relaunch, but no automatic wake session restarts from history.
12. Process ownership, safety and lifecycle remain Rust authoritative; Svelte stays presentational.

The functional details, implementation packages P0–P5 and **G01–G60 acceptance gates** remain exactly as defined in `PRD.md`; no acceptance gate is removed by this design lock.

## 9. Visual evidence and review trace

- **Approved visual prototype:** [preview-stillwater.png](preview-stillwater.png)
- **Interactive comparative mockup:** [PROTOTYPES.html](PROTOTYPES.html)
- **Previous options for traceability:** [DIRECTIONS.md](DIRECTIONS.md), Wayline and Concourse screenshots.
- This is a **frozen direction with implementable token/layout rules**, not pixel-approved final production UI or an already finished asset kit.
- Every implementation surface needs its own screenshots and accessibility pass. If implementation reveals a material tension, raise a design-change request rather than silently switching to another identity.

## 10. Implementation handoff / change control

**Implementation status: NOT AUTHORIZED.** No application code, Rust controller, Svelte UI, Tauri configuration, dependencies, application icons, product binary, release bundle or live preferences may be changed on the basis of this document alone.

When separate authorization is given:
1. Snapshot current code and v2.1 performance/visual baselines; implement P1–P5 from PRD.
2. Apply Stillwater to shared components and all surfaces (not just `App.svelte`).
3. Generate real Horizon app+tray icon assets from the locked geometry and validate platform template behavior.
4. Test against all 60 evidence-based gates; never mark code-only implementation as a passed OS integration gate.
5. Respect existing data, app identifier, local-only operation; no commits/push/releases without further approval.

A future direction change, major token redesign, icon replacement, or removal of an acceptance gate requires explicit new approval. Mechanical contrast corrections and responsive adjustments consistent with Stillwater do not.
