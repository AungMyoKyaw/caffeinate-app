# Caffeinate Product Website

A dependency-free static website for the Caffeinate macOS application.

## Preview

From this directory:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Release configuration

Edit `site-config.js`:

```js
window.CAFFEINATE_SITE = Object.freeze({
  version: "1.0.0",
  minimumMacOS: "macOS 12 or later",
  dmgUrl: "./downloads/Caffeinate.dmg",
  brew: Object.freeze({
    available: false,
    command: "brew install --cask caffeinate"
  })
});
```

For the DMG route, either place the release at `downloads/Caffeinate.dmg` or use an absolute release URL in `dmgUrl`.

When the Homebrew cask is live, change `brew.available` to `true`. The website will update the badge, explanatory copy, and copy-command button automatically.

## Validate

```bash
python3 scripts/validate_site.py
node --check script.js
node --check site-config.js
```

## Deploy

Upload the directory to any static host. No build command is required.

## Included documentation

- `PRODUCT.md` — product truth and voice
- `DESIGN.md` — visual system
- `RALPH_LOOP.md` — bounded quality loop
- `RALPH_RUN_LOG.md` — verification evidence
