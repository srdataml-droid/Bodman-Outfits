# Process clips

Drop the six process videos here, named exactly:

```
01-measuring.mp4
02-cutting.mp4
03-sewing.mp4
04-fitting.mp4
05-pressing.mp4
06-finished.mp4
```

## Why this path

It mirrors `public/images/<section>/`, which already holds `catalogue/`,
`home/` and `process/`. Videos therefore live at
`public/videos/<section>/`, not `public/videos/` directly, so a second kind
of video later (a hero clip, say) has an obvious home instead of forcing a
reorganisation.

Public URL: `/videos/process/01-measuring.mp4`

## Requirements

- **Format:** MP4, H.264 video, AAC audio. Widest browser support.
- **Aspect ratio:** 3:4 portrait, matching `images/process/*.png`, which are
  the poster frames. A mismatch will letterbox against the poster.
- **Audio:** none needed. The player is muted and has no controls, so any
  audio track is dead weight; strip it if the export allows.
- **Length:** short enough to loop without the seam being obvious. These
  play on loop with no controls.
- **Size:** keep each well under a few MB. They are lazy-loaded one at a
  time (see below), but the process section is on the home page and a large
  clip is still a large clip on mobile data.

## Poster frames

Each clip's poster is the matching still in `public/images/process/`. Those
are currently generated placeholders and are the highest-priority reshoot
target; see `logs/decisions.md`.

The poster renders immediately and the video fades in over it once it can
play. **If a video file is missing, the poster simply stays**, so the page
degrades to exactly what it looked like before the videos existed.

## Loading behaviour

These are **not** preloaded. No network request is made for any clip until
its own stage scrolls near the viewport. See
`apps/web/components/process-stage-video.tsx` for the mechanism and the
reasoning.
