# Caffeinate 3.0 — Impeccable Design Directions

**Review:** CFT-3.0-DIR-RC1 · 2026-10-19 · **DECISION LOCKED: Stillwater / Horizon**. Historical alternative comparison retained.
**Scope:** A new visual world for the macOS operation surface, tray menu, preferences and app icons.
**Method:** Impeccable v4.6.0, Operate mode. Existing product truth was inspected. Direction seed 61b9a4cef1967c3ff31e8b002c265668 assigned the sixth candidate below. User selected **Stillwater** and **Horizon**. The binding design contract is [FINAL-DESIGN.md](FINAL-DESIGN.md). **No production code is authorized.**

## The seven grounded candidates

The audience is every Mac user who wants their machine awake during a task. Cultural sources are the everyday visual environments Mac users recognize, not representations of technical controls.

| # | Visual material | How it transfers to this Mac utility |
|---|---|---|
| 1 | **City wayfinding** — calm public transit signage and precise appointment times | Large readable state, strong color-coded location of action, punctual numeric rhythm |
| 2 | **Morning light** — architectural daylight hitting neutral interiors | Soft directional color change that distinguishes idle and awake; calm hierarchy |
| 3 | **Swiss pocket stationery** — ruled work diaries and spare typography | Precise spacing, one big time datum and minimal labels |
| 4 | **Modern field guide** — careful natural history reference pages | Secondary information revealed by taxonomy instead of cards |
| 5 | **Museum ticket** — identity and validity expressed in one compact object | Distinct state marker, factual technical details and trusted provenance |
| 6 | **Tide almanac** — coastal time and horizon notation | A clear remaining-time rail, confident sea/stone palette, status transition without decoration |
| 7 | **Ceramic everyday object packaging** — tactile utility and durable form | One modest color gesture that distinguishes a useful daily object |

The category rut is a tiny power-button panel, charcoal background and neon status ring. These seven intentionally reach beyond that without making a Mac app look like a poster, clock, terminal, control panel, or map.

## Direction A — STILLWATER (APPROVED AND LOCKED; icon: HORIZON)

**World:** Tide almanac, not a nautical control-panel costume. Sea-glass hue, deep blue-green, washed limestone ground, sunlit warm alert. System typography with tabular numerals.

**Narrative:** Time keeps passing, but the Mac can be held steady. A slim **remaining-time horizon** (the signature move) crosses the main status area; when awake, the horizon fills proportionally for bounded sessions. Idle shows a quiet line, not a fake countdown. When indefinite it shows a label, not invented progress.

**First viewport:** native title bar; narrow header Caffeinate and an accurate Awake/Ready dot+text; central tall status number (1h 23m) paired with a real Stop Session button; directly beneath, remaining-time horizon with started-at and ends-at labels; lower bounded settings section has segmented System/Display/Both and preset/custom duration; technical details collapsed and quiet. The menu-bar item is the same state in miniature. Extra features use small secondary navigation, not full dashboard cards.

**Original direction-study palette (superseded by locked tokens):** deep #153A3D, ink #142F33, sea #43B69C, mist #EAF3EF, warm #EAB475, paper #F5F7F2. These exploratory candidate values are not the implementation contract; use the tested prototype-derived **canonical semantic light/dark tokens** in [FINAL-DESIGN.md](FINAL-DESIGN.md).

**Density:** balanced; roomy status region, close enough controls for a fast action.

**Signature interaction:** awake mode animates the horizon marker over 180ms and updates status text simultaneously; no perpetual animated pulse; respects reduced motion.

**Strength:** clearly expresses time/status in a non-generic visual language across menu, settings and recent activity. **Risk:** “tide” metaphor can become decorative if the horizon is made into a real chart or wave animation; prohibit that.

**Icon ideas:** A1 two distinct parallel horizon lines with small daylight notch (app icon); A2 open concentric arc with a clear held point; A3 filled semicircle rising over a strict baseline. Provide monochrome outline/template versions at menu size.

**Raises donated by declined challengers:**
- *Jet-age ticket wallet*: stronger transactional certainty, expressed by a completed-end label, not a coupon/stamp.
- *Vertical video*: unwavering first-screen focus, not feed controls or scroll.
- *Star atlas*: more disciplined numeric prominence, not actual star dots.
- *Botanical folio*: stable geometry between idle/active states, not literal botanical plates.
- *Metro typographic tiles*: typographic confidence, not a tile dashboard.

## Direction B — WAYLINE (Impeccable’s pick)

**World:** Modern public wayfinding for city life, with trustworthy typography and decisive location of state.

**Visual thesis:** The app should be readable at a glance from across the desk and remain quiet when not operating. Warm chalk background, midnight ink, deep cobalt blue, a restrained coral alert accent. The signature move is a **single time route line**, with Now and End as readable endpoints, never a map illustration.

**First viewport:** compact left-aligned state label and very large Awake/Ready headline; narrow mode and duration controls under the headline; high-contrast Start/Stop to the right; a slim running-time rail under them; secondary sections as regular list rows. This is the most conventional and most quickly learnable for general Mac users.

**Prototype palette:** deep #1D3652, ink #182432, blue #315FC6, offwhite #F4F5F0, muted #C6D1D9, alert #DE7956.

**Strength:** excellent scanability and accessibility for every Mac user. **Risk:** familiarity: with too little typography discipline it could become indistinguishable from standard system utilities.

**Icon concepts:** B1 square route corner + small point; B2 two clean horizontal lines and a held middle segment; B3 “open path” glyph with neutral monochrome menu alternative.

## Direction C — CONCOURSE (competitive catalog challenger)

**Source:** Impeccable's split-flap departure-concourse world, SOURCE ID signals-instruments-split-flap-concourse. Full rail station parody is rejected; only the world grammar of disciplined time columns, strong typographic numerals and clear status colors survives into Mac-native controls.

**Visual thesis:** A utility can be extremely efficient at dense glanceable information without becoming an administration dashboard. Deep indigo, chalk numerals, warm yellow active highlights, thin systematic row dividers. The signature move is the **deadline strip**: a locked-width tabular time readout with a subtle one-time crossfade on value change.

**First viewport:** bold numeric time left dominates the top half; one unmistakable Stop/Start action; mode, duration and session events in orderly rows; secondary navigation minimal. Menu bar inherits compact tabular numerals, not literal train-station flip animations.

**Prototype palette:** midnight #161D32, soft white #F2F0E9, ink #17213C, active #E5EF7A, warning #E8A96B. Active needs explicit text, not yellow only.

**Strength:** fast glanceable time under dense activity, clear tray countdown. **Risk:** less calm for occasional users; avoid condensed type at small sizes, flicker, and faux metal/gloss.

**Icon concepts:** C1 single split timing mark; C2 paired equal bars and a dot; C3 precise small hour segment; use single-stroke template at small sizes.

## Challenger decision ledger

Evaluate against A / Stillwater on (1) audience identification and (2) product clarity. This is a design-selection rubric, not a claim of user research.

| Rolled source | Verdict | Audience identification | Product clarity | Decision / donation |
|---|---|---|---|---|
| Jet-age ticket wallet | Declined | Too specific | Paper metaphors obscure editing | Keep completed/cancelled state clarity |
| Vertical-video feed surface | Declined | Not an operation tool | Destroys visible controls | Keep one dominant focal point |
| Star atlas | Declined | Beautiful but specialist | Coordinates unnecessary | Keep disciplined number hierarchy |
| Botanical folio | Declined | Too specialist | Lifecycle stages over-literal | Keep fixed geometry across states |
| Metro typographic tiles | Declined | Familiar but dated | Tiles distort one-action UX | Keep typographic audacity |
| Split-flap concourse | Competitive | Widely recognizable timing system | Supports status/time, but risks mechanical costume | Alternate C carries type/rhythm only |

B / Wayline is the independent, best-ranked grounded candidate. It stays a full alternate by user choice, not an automatic override of the assigned world.

## Prototype contract

**PROTOTYPES.html** is a standalone, design-only comparative preview with A/B/C tabs. All visible controls are mock UI, not Tauri invocations. It shows a plausible active session, state, remaining time, controls and menu affordance in each visual world and contains proposed icon shapes. It must not spawn caffeinate, persist preferences, register shortcuts, schedule anything or claim live status. It may include a preview-only idle/active switch to compare states. This is not an application implementation.

**Selection completed:** A **Stillwater**, icon **Horizon**, approved 2026-10-19. Wayline and Concourse remain evidence of explored alternatives, not implementation options. Final tokens, content/state treatment, menu semantics, icon geometry and implementation boundaries now live in [FINAL-DESIGN.md](FINAL-DESIGN.md). Implementation still requires a separate instruction.

## Verification of design direction

- Name covered: does it still read as a functional Mac sleep-prevention utility?
- Title bar and controls remain genuinely macOS-native in feel.
- Distinct light/dark palettes are complete; a monochrome tray icon stays recognizable.
- Status, remaining and Stop are dominant without making profiles/history the focal point.
- Running/idle and bounded/indefinite states differ in text and hierarchy, not merely color.
- Enlarged text, keyboard operation, focus, reduced-motion, increased contrast and VoiceOver all have a coherent implementation path.
- No fake system process, fabricated battery reading, or invented running state in the actual delivered app.
