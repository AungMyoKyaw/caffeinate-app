# Caffeinate — Motion Product Demo

**A continuous, interactive product walkthrough, not a screenshot slideshow.** The film records the real production Svelte 5 UI with Playwright and composites the motion capture using Remotion.

## Rendered deliverables

- `out/caffeinate-product-1080p.mp4`: 1920×1080, 30 FPS, 36 seconds, H.264 + AAC.
- `out/preview.png`: poster frame.
- The finished video is also copied to `~/Downloads/Caffeinate-3.0-Product-Video-1080p.mp4`.

## How to reproduce

First run the app frontend in a separate terminal from the Caffeinate repository root:

    bun run dev

Then, from this `marketing/remotion` directory:

    bun install
    bun run capture
    bun run typecheck
    bun run still
    bun run render
    bun run studio

## What is real and what is simulated

- `recording/demo.html` and `recording/demo.ts` mount the **production** `src/App.svelte` with `src/styles.css` against an **isolated mock-only CaffeinateClient**. The recording doesn't start system caffeinate processes, change system sleep assertions or modify the installed app.
- `recording/capture.mjs` drives real clickable UI elements: Ready → Both → 30 minutes → Keep Mac Awake → Profiles → Schedules → History → Settings → Session → Stop. It records a continuous browser video and a JSON timestamped pointer track.
- `public/footage/live-ui.webm` is the recorded ~35-second UI video, generated locally and excluded from Git.
- `src/cursor-events.json` stores the mouse movement and click timestamps captured during the demo.
- `src/video.tsx` uses a **single continuous video track** within a macOS-window composition, with an animated cursor, click feedback, subtle motion effects, product identity and soundtrack.
- `public/audio/caffeinate-chorus.mp3` is a 36-second trim from the user's Sai Sai Kham Leng live MP3, starting at 02:51 and ending at 03:27. The original Downloads MP3 remains untouched.

## Audio trim

    SRC=$(find "$HOME/Downloads" -maxdepth 1 -type f -name '*j1eQpx2KqoY*.mp3' -print -quit)
    ffmpeg -y -ss 171 -i "$SRC" -t 36 \
      -af 'loudnorm=I=-15:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.65,afade=t=out:st=34.5:d=1.5' \
      -ac 2 -ar 48000 -c:a libmp3lame -b:a 192k public/audio/caffeinate-chorus.mp3

The audio master and rendered outputs are Git-ignored. Third-party music requires suitable rights for public/commercial distribution.
