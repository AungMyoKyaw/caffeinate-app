#!/usr/bin/env python3
"""Check first-party HTML href, src, and fragment targets without network access."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for attr in ("href", "src"):
            if attrs.get(attr):
                self.refs.append((tag, attr, attrs[attr]))

def main():
    parser = Links()
    parser.feed(HTML.read_text(encoding="utf-8"))
    missing = []
    for tag, attribute, value in parser.refs:
        if value.startswith(("mailto:", "tel:", "data:", "javascript:")):
            continue
        u = urlparse(value)
        if u.scheme or u.netloc:
            continue
        if u.fragment and u.fragment not in parser.ids:
            missing.append("missing fragment #" + u.fragment + " at " + value)
        if not u.path:
            continue
        p = (ROOT / unquote(u.path.lstrip("/"))).resolve()
        if not p.is_relative_to(ROOT.resolve()) or not p.is_file():
            missing.append("missing local " + attribute + ": " + value)
    if missing:
        print("\n".join(missing))
        sys.exit(1)
    print("Website references OK:", len(parser.refs), "references,", len(parser.ids), "ids")

if __name__ == "__main__":
    main()
