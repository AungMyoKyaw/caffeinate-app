#!/usr/bin/env python3
"""Generate approved Stillwater/Horizon app and native menu-bar assets."""
from pathlib import Path
from PIL import Image, ImageDraw
import subprocess

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "src-tauri" / "icons"
TARGET.mkdir(parents=True, exist_ok=True)
SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
 <rect width="32" height="32" rx="7" fill="#E8F2ED"/>
 <path d="M4 16h24 M4 21h24 M16 7v6" fill="none" stroke="#1B5C57" stroke-width="2.2" stroke-linecap="round"/>
</svg>
"""
(TARGET / "horizon.svg").write_text(SVG)

def paint(size: int, background: bool) -> Image.Image:
    scale = 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0,0,0,0))
    draw = ImageDraw.Draw(image)
    def pos(v): return round(v / 32 * canvas_size)
    if background:
        draw.rounded_rectangle((0, 0, canvas_size - 1, canvas_size - 1), radius=pos(7), fill=(232,242,237,255))
        color = (27,92,87,255)
    else:
        color = (0,0,0,255)  # macOS template image is tinted by the OS.
    stroke = pos(2.2)
    for x1,y1,x2,y2 in [(4,16,28,16),(4,21,28,21),(16,7,16,13)]:
        draw.line((pos(x1),pos(y1),pos(x2),pos(y2)), fill=color, width=stroke)
        radius=stroke//2
        for x,y in [(x1,y1),(x2,y2)]:
            draw.ellipse((pos(x)-radius,pos(y)-radius,pos(x)+radius,pos(y)+radius),fill=color)
    return image.resize((size,size), Image.Resampling.LANCZOS)

master = paint(1024, True)
master.save(TARGET / "icon-1024.png")
for name,n in [("32x32.png",32),("128x128.png",128),("128x128@2x.png",256)]:
    master.resize((n,n),Image.Resampling.LANCZOS).save(TARGET / name)
paint(44,False).save(TARGET/"horizon-tray@2x.png")
paint(22,False).save(TARGET/"horizon-tray.png")
iconset = TARGET / "Horizon.iconset"
iconset.mkdir(exist_ok=True)
for nominal in [16,32,128,256,512]:
    master.resize((nominal,nominal),Image.Resampling.LANCZOS).save(iconset/f"icon_{nominal}x{nominal}.png")
    master.resize((nominal*2,nominal*2),Image.Resampling.LANCZOS).save(iconset/f"icon_{nominal}x{nominal}@2x.png")
subprocess.run(["iconutil","-c","icns",str(iconset),"-o",str(TARGET/"icon.icns")],check=True)
for f in iconset.iterdir(): f.unlink()
iconset.rmdir()
print("Horizon: vector master, 1024px raster, icon.icns, app icons and template tray icon generated")
