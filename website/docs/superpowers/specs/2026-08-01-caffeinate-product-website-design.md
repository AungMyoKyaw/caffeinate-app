# Caffeinate Product Website Design

## Architecture

The website is a dependency-free static site. `index.html` owns semantic content, `styles.css` owns the visual system and responsive behavior, `site-config.js` owns release URLs and Homebrew publication state, and `script.js` owns progressive enhancement. The site remains useful when JavaScript is unavailable; only screenshot switching, copy feedback, and mobile navigation enhancements depend on JavaScript.

## Page sections

1. Header with product identity, section navigation, and DMG call to action.
2. Hero with literal product promise and the supplied Awake screenshot.
3. Product-fact strip.
4. Interactive screenshot demonstration using both supplied images.
5. Four ruled feature rows.
6. Technical command explanation.
7. Installation section with DMG available and Homebrew publishing status controlled from one config file.
8. FAQ and footer.

## Download behavior

The default DMG URL is `./downloads/Caffeinate.dmg`. Deployment requires placing the release file at that path or changing `dmgUrl` in `site-config.js`. Homebrew defaults to `available: false`; the UI must not claim the cask works until that value is changed to `true`.

## Accessibility and resilience

The page uses semantic landmarks, an early skip link, visible focus, keyboard tabs, reduced-motion behavior, proper button disabled states, and useful text without JavaScript. Image dimensions are declared to reduce layout movement.

## Success criteria

- The supplied Ready and Awake screenshots are present and switchable.
- DMG download is the dominant action.
- Homebrew is clearly marked as publishing in progress.
- The page works from static hosting with no build step or external dependency.
- Desktop and mobile renders have no high-severity clipping, contrast, or hierarchy defects.
