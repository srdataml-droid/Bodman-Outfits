"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ProcessStageVideoProps {
  /** e.g. /videos/process/01-measuring.mp4 */
  videoSrc: string;
  /** Still frame shown immediately and left in place if the clip is absent. */
  poster: string;
  posterAlt: string;
  priority?: boolean;
}

/**
 * A single process clip, loaded only when its own stage reaches the viewport.
 *
 * THE LOAD GUARANTEE, which is the whole point of this component:
 *
 * The `<source>` element is not rendered at all until the observer fires.
 * `preload="none"` on its own is a *hint*: browsers may still fetch metadata,
 * and some ignore it entirely for a video that has a resolvable source. A
 * `<video>` with no source has nothing to fetch, so the guarantee holds
 * regardless of how any given browser treats the hint. `preload="none"` is
 * kept as well, for the moment after the source appears.
 *
 * Consequence worth stating: six clips means six requests spread across the
 * scroll, and zero on page load. Nothing is prefetched for the *next* stage
 * either, which is deliberate rather than an oversight. On a slow connection
 * that costs a beat before a clip starts, and the poster covers that beat.
 *
 * DELIBERATELY NO FAILSAFE TIMER, unlike ScrollReveal in this same codebase.
 * ScrollReveal reveals text and must never leave content unreadable, so it
 * gives up waiting and shows itself. Here the opposite is true: a timer that
 * loaded the video anyway would defeat the entire requirement. If the
 * observer never fires, the correct outcome is that the clip never loads and
 * the poster remains, which is a complete and honest rendering of the stage.
 *
 * REDUCED MOTION: no `<video>` element is rendered at all, so there is no
 * playback attempt and no request. The poster is the whole experience, which
 * is what "static poster only" has to mean if it is to mean anything.
 */
export function ProcessStageVideo({
  videoSrc,
  poster,
  posterAlt,
  priority = false,
}: ProcessStageVideoProps): React.ReactElement {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  // Resolved on the client. Starts null so the first render never assumes an
  // answer and never mounts a video element it might have to tear down.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (): void => setReducedMotion(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion !== false) return;
    const node = wrapperRef.current;
    if (node === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // First crossing is what triggers the download.
            setShouldLoad(true);
            const video = videoRef.current;
            // play() rejects if the browser blocks autoplay. Muted playback is
            // normally allowed, but a rejection must not become an unhandled
            // rejection in the console, and it is not worth surfacing: the
            // poster is already showing.
            if (video) void video.play().catch(() => undefined);
          } else {
            videoRef.current?.pause();
          }
        }
      },
      // Same trigger geometry as ScrollReveal, so a stage's clip starts
      // loading on the same crossing that reveals its text rather than at
      // some other moment.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // Adding a <source> child to a already-mounted <video> does not by itself
  // start a load; the element has to be told to re-evaluate its sources.
  useEffect(() => {
    if (!shouldLoad) return;
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play().catch(() => undefined);
  }, [shouldLoad]);

  return (
    <div
      ref={wrapperRef}
      className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-[rgb(210_180_140_/_45%)] bg-[#e8ebea]"
    >
      {/* Always rendered, and never removed. It is the poster, the fallback
          for a missing file, and the entire reduced-motion experience. Served
          through next/image so it is optimised, unlike a raw `poster`
          attribute which would ship the full-size original. */}
      <Image
        src={poster}
        alt={posterAlt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes="(min-width: 768px) 45vw, 100vw"
        className="object-cover"
      />

      {reducedMotion === false ? (
        <video
          ref={videoRef}
          preload="none"
          muted
          loop
          playsInline
          aria-hidden="true"
          onCanPlay={() => setCanPlay(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            canPlay ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Rendered only after the observer fires. Until then the element
              has no source and therefore nothing to request. */}
          {shouldLoad ? <source src={videoSrc} type="video/mp4" /> : null}
        </video>
      ) : null}
    </div>
  );
}
