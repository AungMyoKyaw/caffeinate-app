# Caffeinate Website — Visual System

## Direction

A warm editorial product page shaped by the application itself: ivory paper, espresso ink, amber state signals, large disciplined typography, and the real macOS screenshots. The page should feel like a carefully made utility, not a generic SaaS landing page.

## Composition

- Sticky but quiet navigation.
- Asymmetric hero: product argument on the left, app screenshot on a dark stage to the right.
- One proof strip with literal product facts.
- A dark demonstration section with a Ready/Awake screenshot switcher.
- Feature explanation as ruled editorial rows, not a card grid.
- Installation section with DMG as primary and Homebrew visibly marked as publishing in progress.
- Compact FAQ and footer.

## Tokens

- Paper: `#f4f0e7`
- Paper high: `#fbf8f1`
- Ink: `#171411`
- Espresso: `#241c17`
- Espresso high: `#30251e`
- Amber: `#d58a2a`
- Amber bright: `#efa84d`
- Muted: `#746b62`
- Rule: `#d8d0c4`
- Dark rule: `#463a31`

## Typography

Use the macOS system stack and SFMono fallback. No remote fonts.

- Hero: fluid 56–92 px, bold, tight tracking.
- Section title: fluid 40–68 px.
- Body: 17–20 px, restrained line length.
- Eyebrow: 12–13 px uppercase with deliberate tracking.

## Shape

- Moderate 16–24 px radii for authored surfaces.
- No pill-shaped content containers.
- No stacked card grid.
- No gradients, glassmorphism, glowing blobs, or decorative charts.

## Motion

- Short state transitions for navigation and screenshot switching.
- No autoplay carousel.
- Respect `prefers-reduced-motion`.

## Accessibility

- Semantic landmarks and headings.
- Skip link and visible focus.
- Minimum 44 px interactive targets.
- Keyboard-operable screenshot tabs and mobile navigation.
- Clear disabled state for the unpublished Homebrew method.
- Descriptive screenshot alternative text.
