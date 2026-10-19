# Caffeinate 3.0 — Approval and Design Lock Record

**Record ID:** CFT-3.0-APPROVAL-2026-10-19  
**Effective date:** 2026-10-19  
**Status:** Originally design-only; the product owner **subsequently approved implementation** and the latest UI rework. The macOS beta is built locally, but **commit, push, release and publication are not authorized**. See [UI-REWORK-IMPLEMENTATION.md](UI-REWORK-IMPLEMENTATION.md).

## Explicit product-owner authorization

On 2026-10-19, the product owner stated:

> I approve Caffeinate 3.0 specification CFT-3.0-RC1, all 60 acceptance gates, the proposed operational policies, visual direction Stillwater, and icon concept Horizon. Lock the design direction and finalize the design specification. Do not implement application code until I give separate authorization.

This record memorializes that decision, without extending its scope.

## Frozen decisions

| Field | Locked value |
|---|---|
| Product | Caffeinate 3.0 |
| Functional specification | **CFT-3.0-RC1** ([PRD.md](PRD.md)) |
| Approved question set | **Q01–Q40**, all accepted |
| Acceptance gates | **G01–G60**, all accepted |
| Operational policies | PRD section 9, all accepted |
| Visual world | **Stillwater** |
| Impeccable design mode | **Operate** |
| Icon | **Horizon** (two horizontal lines and upper-center notch) |
| Canonical visual contract | [FINAL-DESIGN.md](FINAL-DESIGN.md) |
| Machine-readable lock | [LOCK.json](LOCK.json) |
| Frontend/runtime | Svelte 5, Tailwind 4, Rust, Tauri 2, Bun |
| Target | macOS only, native window plus menu bar |
| Prior option review | [DIRECTIONS.md](DIRECTIONS.md); Wayline/Concourse rejected as implementations |
| Prototype evidence | [PROTOTYPES.html](PROTOTYPES.html); [preview-stillwater.png](preview-stillwater.png) |

## Original implementation authorization boundary (historical, superseded by later explicit approval)

**ALLOWED under the current approval**
- Edit requirements, visual design documents and review notes.
- Define canonical palettes, typography, icon geometry, layout behavior, accessibility requirements and acceptance gates.
- Keep mock previews illustrating the locked design.
- Prepare plans/estimates/test matrices without modifying application behavior.

**NOT ALLOWED until a separate explicit implementation instruction**
- Change application code in `src/` or `src-tauri/`.
- Change Tauri capabilities, process lifecycle, plugins, Rust manifests, Svelte, build configuration, or install app dependencies on behalf of implementation.
- Replace any shipped application/tray icons or production design assets.
- Implement schedules, native tray functions, session editing, notifications, battery monitoring or new persistence.
- Change actual user settings, invoke a live wake session or create an installed application update.

**Separately prohibited until their own explicit authorization**
- Git commit, push, merge, publish, deploy, notarize as a release, or ship an update. Implementation approval itself does not imply release approval.

## Locked visual details

- Stillwater: chalk-paper light, deep sea-green dark, restrained sea-glass action color, calm numerical timing hierarchy.
- Horizon: two level strokes and centered vertical notch; no replacement with old Carbon + Volt power icon, mug, Route or Bars.
- Primary action: clear rectangular text button; duration segmented choices + Custom; System/Display/Both mode; accessible one-action experience.
- Session status and duration visible immediately; time horizon is bounded-session truthful progress, not decorative live data.
- Real standard native title bar and genuine Tauri/macOS menu-bar integration; never an HTML imitation in production.
- Strong accessibility including VoiceOver, keyboard, contrast, theme and reduced motion.

## Approved operational details

- Custom duration 1 minute–24 hours.
- Live duration change counts from confirmation time.
- Battery-warning threshold <=15% when on battery (without automatic stop).
- Thirty-item local recent-session history.
- Optional login launch, off by default; no automatic wake start.
- One-shot schedules run only while app process exists; no daemon, wake-from-sleep automation or late catch-up; conflicts skip.
- Explicit Quit releases application-owned assertions.
- No global shortcut registered until user configures one.
- Current fixed executable and app-PID fail-safe retained.
- All must be verified under G01–G60, not assumed implemented.

## Truthfulness / historical status

The current shipped code is still **v2.1.0 Carbon + Volt**. The v3 documents are **future authorized design requirements**, not a deployed application. Root `PRODUCT.md` and `DESIGN.md` retain legacy shipped descriptions with pointers to this locked specification. No source-code modifications, commits or releases are authorized by this record.

## Next gate

**WAITING FOR USER: "Implement Caffeinate 3.0 per CFT-3.0-RC1 and FINAL-DESIGN.md" or equivalent explicit instruction.** Until then, this lock is the final deliverable.
