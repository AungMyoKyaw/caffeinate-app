# Stillwater on the web — Design Specification

## Visual authority

The actual Caffeinate 3.0 Stillwater interface is the identity. The website inherits its **Horizon icon**, jade/evergreen palette, quiet borders, macOS system typography, and deliberate hierarchy. It replaces the historical orange/espresso Caffeinate 2.1 landing-page look.

## Composition

- Quiet sticky navigation with one action and responsive mobile menu.
- Editorial hero: oversized clear type, one real app screenshot against a restrained mint mounting surface.
- Plain-spoken trust strip and large product proposition.
- Ruled three-row feature explanation; no SaaS card grid.
- Evergreen screenshot gallery with **five actual native screens** and accessible roving-tabindex navigation.
- Two-column technical details with the exact native command.
- Distinct preview-vs-published-version section with no fabricated beta download.
- Native `<details>` FAQ, compact footer, optional screenshot lightbox.

## Tokens

- Paper `#f6f8f3`, white `#fffefb`, muted paper `#eff3eb`.
- Ink `#18352e`, primary green `#20594c`, dark green `#15372f`.
- Mint `#dceae0`, mint highlight `#a8ddbd`.
- Secondary text `#5d776e`, rule `#d5dfd5`.

Use semantic variables in `styles.css`. Keep contrast legible in the dark gallery and allow the real screenshots to dominate.

## Type and shape

System font stack; no remote fonts. Oversized fluid headlines with limited classic italic serif emphasis. Base copy 14–19px, measured line lengths. Rounded corners mainly 6–15px and restrained shadows. No gradients, glassmorphism, glowing shapes or fake product metrics.

## Motion and accessibility

Reduced-motion preference honored, visible keyboard focus, one semantic H1, alt text for all real screenshots, keyboard tablist arrows/Home/End, focus-safe native dialog, skip link, mobile menu `aria-expanded`, and clear interactive states. Full-color screenshots are not substitutes for descriptive copy.

## Image integrity

No fake windows or composited app UI on the site: every screen is sourced from the user's 2026-10-19 native capture. Cropping removes only black recording margins. Do not silently substitute prototype renderings for genuine captures.

## Release integrity

Feature copy and images describe the 3.0 beta. The installation action is explicitly for the separately published version, configured in `site-config.js`. No 3.0 download is asserted until release authorization and a verified asset exist.
