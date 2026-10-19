#!/usr/bin/env python3
"""Organize Caffeinate 3.0 native screenshots and export lightweight website images.

Requires Pillow for asset authoring only (not for the app or website runtime).
The full, unaltered user captures are archived; the exported images crop only
the uniform black recording background, never the macOS window itself.
Idempotent: running again regenerates derived assets without moving originals.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "untitled folder"
OUTPUT = ROOT / "docs/screenshots/v3"
ORIGINALS = OUTPUT / "originals"
WEB = ROOT / "website/assets/screenshots"

SCREENS = ("session", "profiles", "schedules", "history", "settings")


def main() -> None:
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    WEB.mkdir(parents=True, exist_ok=True)
    inbox = sorted(INBOX.glob("Screenshot *.png")) if INBOX.exists() else []
    if inbox and len(inbox) != len(SCREENS):
        raise RuntimeError(f"Expected {len(SCREENS)} captures, found {len(inbox)}. Preserve unknown files.")
    if inbox and any((ORIGINALS / f"{name}.png").exists() for name in SCREENS):
        raise RuntimeError("Refusing to overwrite already archived originals.")
    if inbox:
        for name, source in zip(SCREENS, inbox):
            source.rename(ORIGINALS / f"{name}.png")
            print(f"Archived {source.name} -> originals/{name}.png")
    for name in SCREENS:
        path = ORIGINALS / f"{name}.png"
        if not path.exists():
            raise FileNotFoundError(path)
        with Image.open(path) as image:
            image.load()
            rgb = image.convert("RGB")
            box = rgb.getbbox()
            if not box:
                raise RuntimeError(f"Screenshot {name} is all black.")
            left, top, right, bottom = box
            # Retain a small protective margin around the round window corners.
            box = (
                max(0, left - 10),
                max(0, top - 10),
                min(rgb.width, right + 10),
                min(rgb.height, bottom + 10),
            )
            cropped = rgb.crop(box)
            cropped.save(OUTPUT / f"{name}.png", format="PNG", optimize=True)
            cropped.save(
                WEB / f"{name}.webp",
                format="WEBP",
                quality=88,
                method=6,
            )
            print(f"{name}: {rgb.size} -> {cropped.size}, {WEB / (name + '.webp')}")
    headers = ("Screen", "Cropped PNG", "WebP asset")
    rows = [
        (
            name.title(),
            f"[{name}.png]({name}.png)",
            f"[\x60{name}.webp\x60](../../../website/assets/screenshots/{name}.webp)",
        )
        for name in SCREENS
    ]
    widths = [max(len(row[i]) for row in [headers, *rows]) for i in range(3)]
    def render_row(cells):
        return "| " + " | ".join(cell.ljust(widths[i]) for i, cell in enumerate(cells)) + " |\n"
    table = render_row(headers) + render_row(tuple("-" * w for w in widths))
    table += "".join(render_row(row) for row in rows)
    readme = OUTPUT / "README.md"
    readme.write_text(
        "# Caffeinate 3.0 — real macOS screenshots\n\n"
        "Taken from the running macOS beta on 19 October 2026. These are actual "
        "app captures, not HTML prototypes. Unaltered captures are archived in "
        "`originals/`; the top-level PNGs remove the black screen-recording "
        "background, with a 10px safety margin. Website-sized WebP copies are "
        "in `website/assets/screenshots/`.\n\n"
        + table
        + "\nRun `python3 scripts/organize-v3-screenshots.py` to re-create the derived files. "
        "Pillow is needed only while authoring assets.\n",
        encoding="utf-8",
    )
    if INBOX.exists() and not any(INBOX.iterdir()):
        INBOX.rmdir()


if __name__ == "__main__":
    main()
