#!/usr/bin/env python3
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
missing: list[str] = []

class LinkParser(HTMLParser):
    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for name in ("src", "href"):
            value = values.get(name)
            if not value or value.startswith(("#", "mailto:", "tel:", "data:")):
                continue
            parsed = urlparse(value)
            if parsed.scheme or parsed.netloc:
                continue
            target = parsed.path.removeprefix("./")
            if target == "downloads/Caffeinate.dmg":
                continue
            path = ROOT / target
            if not path.exists():
                missing.append(value)

parser = LinkParser()
parser.feed(HTML.read_text(encoding="utf-8"))

if missing:
    print("Missing local references:")
    for item in sorted(set(missing)):
        print(f"- {item}")
    sys.exit(1)

print("Local asset references: PASS")
