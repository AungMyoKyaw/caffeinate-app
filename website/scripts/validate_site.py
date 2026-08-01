#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

required_files = [
    "index.html",
    "styles.css",
    "script.js",
    "site-config.js",
    "assets/caffeinate-ready.png",
    "assets/caffeinate-active.png",
    "assets/app-icon.svg",
    "PRODUCT.md",
    "DESIGN.md",
    "RALPH_LOOP.md",
]

for relative in required_files:
    if not (ROOT / relative).is_file():
        errors.append(f"missing required file: {relative}")

html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")
js = (ROOT / "script.js").read_text(encoding="utf-8")
config = (ROOT / "site-config.js").read_text(encoding="utf-8")

markers = {
    "main landmark": '<main id="main">',
    "skip link": 'class="skip-link"',
    "hero section": 'id="top"',
    "demo section": 'id="demo"',
    "features section": 'id="features"',
    "install section": 'id="install"',
    "faq section": 'id="faq"',
    "ready screenshot": 'assets/caffeinate-ready.png',
    "active screenshot": 'assets/caffeinate-active.png',
    "DMG download": 'downloads/Caffeinate.dmg',
    "Homebrew pending copy": 'Publishing in progress',
    "tab semantics": 'role="tablist"',
    "live region": 'aria-live="polite"',
}

for name, marker in markers.items():
    if marker not in html:
        errors.append(f"missing HTML contract marker: {name}")

css_markers = {
    "visible focus": ":focus-visible",
    "reduced motion": "prefers-reduced-motion",
    "mobile breakpoint": "@media (max-width: 760px)",
    "hidden rule": "[hidden]",
    "system font": "-apple-system",
}
for name, marker in css_markers.items():
    if marker not in css:
        errors.append(f"missing CSS contract marker: {name}")

js_markers = {
    "demo activation": "activateDemo",
    "brew state": "config.brew.available",
    "DMG configuration": "config.dmgUrl",
    "clipboard handling": "navigator.clipboard.writeText",
}
for name, marker in js_markers.items():
    if marker not in js:
        errors.append(f"missing JavaScript contract marker: {name}")

if 'available: true' not in config:
    errors.append("Homebrew must be marked available once the cask is published")
if "AungMyoKyaw/homebrew-tap/caffeinate" not in config:
    errors.append("Homebrew install command must reference the published cask")

for forbidden in ["fonts.googleapis.com", "cdn.jsdelivr.net", "unpkg.com", "google-analytics", "gtag("]:
    if forbidden in (html + css + js).lower():
        errors.append(f"forbidden external/runtime dependency marker: {forbidden}")

for path in [ROOT / "assets/caffeinate-ready.png", ROOT / "assets/caffeinate-active.png"]:
    if path.exists() and path.stat().st_size < 100_000:
        errors.append(f"screenshot asset appears unexpectedly small: {path.name}")

heading_levels = [int(level) for level in re.findall(r"<h([1-6])\b", html)]
if heading_levels.count(1) != 1:
    errors.append("page must contain exactly one h1")

report = {
    "root": str(ROOT),
    "required_files": len(required_files),
    "heading_levels": heading_levels,
    "errors": errors,
}
print(json.dumps(report, indent=2))

if errors:
    sys.exit(1)
