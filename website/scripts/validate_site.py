#!/usr/bin/env python3
"""Validate Caffeinate 3.0 website claims, structure and local resources."""
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ("session", "profiles", "schedules", "history", "settings")

class Structure(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.images = []
        self.tabs = []
        self.ids = set()
        self.errors = []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        self.tags.append(tag)
        if d.get("id"):
            if d["id"] in self.ids:
                self.errors.append("duplicate element id: " + d["id"])
            self.ids.add(d["id"])
        if tag == "img":
            self.images.append(d)
            if "alt" not in d:
                self.errors.append("image missing alt: " + str(d.get("src")))
            if "width" not in d or "height" not in d:
                self.errors.append("image missing intrinsic dimensions: " + str(d.get("src")))
        if d.get("role") == "tab":
            self.tabs.append(d)

def check():
    errors = []
    required = ["index.html", "styles.css", "script.js", "site-config.js",
                "assets/app-icon.svg", "README.md", "DESIGN.md", "PRODUCT.md"]
    required.extend("assets/screenshots/" + name + ".webp" for name in SCREENSHOTS)
    for name in required:
        if not (ROOT / name).is_file():
            errors.append("missing " + name)
    if errors:
        return errors, {}
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    js = (ROOT / "script.js").read_text(encoding="utf-8")
    config = (ROOT / "site-config.js").read_text(encoding="utf-8")
    parser = Structure()
    parser.feed(html)
    errors.extend(parser.errors)
    if parser.tags.count("h1") != 1:
        errors.append("expected exactly one h1")
    for marker in ['id="main"', 'class="skip-link"', 'id="top"', 'id="why"',
                   'id="gallery"', 'id="details"', 'id="get"', 'id="faq"',
                   'role="tablist"', 'role="tabpanel"', 'id="image-dialog"',
                   'data-stable-link', 'data-copy-brew']:
        if marker not in html:
            errors.append("missing HTML contract: " + marker)
    actual_tabs = [t.get("data-gallery-tab") for t in parser.tabs]
    if actual_tabs != list(SCREENSHOTS):
        errors.append("gallery tabs do not match screenshot inventory")
    for name in SCREENSHOTS:
        path = ROOT / "assets/screenshots" / (name + ".webp")
        raw = path.read_bytes()
        if len(raw) < 5_000 or raw[:4] != b"RIFF" or raw[8:12] != b"WEBP":
            errors.append("invalid screenshot WebP: " + name)
        if "assets/screenshots/" + name + ".webp" not in (html + js):
            # Assets beyond the initial session are chosen by the JS gallery code.
            if 'screen.id + ".webp"' not in js:
                errors.append("missing gallery binding: " + name)
    for rule in (":focus-visible", "prefers-reduced-motion", "@media (max-width: 620px)",
                 ".gallery-tabs", ".hero-grid", ".site-nav", ".image-dialog"):
        if rule not in css:
            errors.append("missing CSS contract: " + rule)
    for key in ("activateGallery", "ArrowRight", "Home", "End",
                "showModal", "navigator.clipboard.writeText", "aria-selected"):
        if key not in js:
            errors.append("missing browser behavior: " + key)
    for key in ('previewVersion: "3.0.0-beta.0"', "previewIsPublished: false", "/releases"):
        if key not in config:
            errors.append("release claim inconsistent: " + key)
    if not re.search(r'publishedVersion:\s*"[^\"]+"', config):
        errors.append("missing published release version")
    if re.search(r'href=["\'](?:./)?downloads/[^"\']+\.dmg', html):
        errors.append("unpublished beta DMG link")
    for forbidden in ("fonts.googleapis.com", "cdn.jsdelivr.net", "unpkg.com",
                      "google-analytics", "googletagmanager", "gtag("):
        if forbidden in (html + css + js + config).lower():
            errors.append("unexpected external runtime dependency: " + forbidden)
    return errors, {
        "heading_count": parser.tags.count("h1"),
        "gallery_tabs": actual_tabs,
        "image_count": len(parser.images),
        "files_checked": len(required),
        "preview_unpublished": True,
    }

def main():
    errors, details = check()
    print(json.dumps({"site": str(ROOT), "passed": not errors, "details": details,
                      "errors": errors}, indent=2))
    if errors:
        sys.exit(1)

if __name__ == "__main__":
    main()
