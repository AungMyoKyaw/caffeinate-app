# Caffeinate 3.0 — real macOS screenshots

Taken from the running macOS beta on 19 October 2026. These are actual app captures, not HTML prototypes. Unaltered captures are archived in `originals/`; the top-level PNGs remove the black screen-recording background, with a 10px safety margin. Website-sized WebP copies are in `website/assets/screenshots/`.

| Screen    | Cropped PNG                    | WebP asset                                                             |
| --------- | ------------------------------ | ---------------------------------------------------------------------- |
| Session   | [session.png](session.png)     | [`session.webp`](../../../website/assets/screenshots/session.webp)     |
| Profiles  | [profiles.png](profiles.png)   | [`profiles.webp`](../../../website/assets/screenshots/profiles.webp)   |
| Schedules | [schedules.png](schedules.png) | [`schedules.webp`](../../../website/assets/screenshots/schedules.webp) |
| History   | [history.png](history.png)     | [`history.webp`](../../../website/assets/screenshots/history.webp)     |
| Settings  | [settings.png](settings.png)   | [`settings.webp`](../../../website/assets/screenshots/settings.webp)   |

Run `python3 scripts/organize-v3-screenshots.py` to re-create the derived files. Pillow is needed only while authoring assets.
