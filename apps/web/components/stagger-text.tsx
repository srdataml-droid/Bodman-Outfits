"use client";

import { Fragment, useEffect, useRef, useState } from "react";

interface StaggerTextProps {
  /**
   * Plain text only, deliberately. Accepting children would let a caller pass
   * markup this component would then have to split without breaking, which is
   * how these things become fragile. A heading that needs inline markup is a
   * heading that should not use this.
   */
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  /**
   * Gap between words. Kept small on purpose: at 45ms a seven-word heading
   * finishes in about a third of a second, which reads as the line settling.
   * Past roughly 80ms it stops looking like typography and starts looking
   * like an intro sequence the reader has to sit through.
   */
  stepMs?: number;
  /** Offset for the whole line, when it follows something else that moves. */
  startMs?: number;
}

/**
 * A heading whose words fade and rise in sequence as it scrolls into view.
 *
 * Reserved for short, declarative headline text. Applying it to a paragraph
 * would mean a reader waiting on words they are already trying to read, which
 * is the opposite of the restraint the rest of this site holds to.
 *
 * SCREEN READERS, which is the part most implementations of this get wrong.
 * Splitting a sentence into per-word elements can make assistive tech
 * announce it word by word, or insert pauses that turn one sentence into
 * seven fragments. The guard here is explicit rather than hopeful: the
 * container carries `aria-label` with the whole original string and every
 * word span is `aria-hidden`. Assistive tech therefore reads exactly the
 * sentence that was passed in, and never sees the split at all.
 *
 * REDUCED MOTION: no splitting happens. The component returns the plain
 * string in a plain element, with no spans, no observer and no transition.
 * The static fallback is the real text, not a stilled version of the effect.
 *
 * Built on the same IntersectionObserver geometry as ScrollReveal, including
 * its failsafe, rather than a second scroll system. See that component for
 * why the failsafe exists: text must never stay invisible because a callback
 * did not arrive.
 */
export function StaggerText({
  text,
  className,
  as = "h2",
  stepMs = 45,
  startMs = 0,
}: StaggerTextProps): React.ReactElement {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Starts null so the first client render matches the server's, which
  // renders the split markup. Resolving to `true` swaps in the plain string.
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (): void => setReducedMotion(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion !== false || revealed) return;
    const node = ref.current;
    if (node === null) return;

    // Already on screen at mount: reveal without waiting on a callback that
    // is a frame away, which would otherwise flash hidden text on first paint.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    observer.observe(node);

    // Same failsafe as ScrollReveal, for the same reason: a heading must
    // never be permanently invisible because an observer never delivered.
    const failsafe = window.setTimeout(() => {
      setRevealed(true);
      observer.disconnect();
    }, 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [reducedMotion, revealed]);

  const Tag = as;

  if (reducedMotion === true) {
    return <Tag className={className}>{text}</Tag>;
  }

  const words = text.split(" ");

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      // The whole sentence, so assistive tech never encounters the split.
      aria-label={text}
      data-stagger={revealed ? "shown" : "hidden"}
      className={className}
    >
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            aria-hidden="true"
            data-stagger-word=""
            style={revealed ? { transitionDelay: `${startMs + i * stepMs}ms` } : undefined}
          >
            {word}
          </span>
          {/*
           * The space is a SIBLING of the word span, never a child of it.
           *
           * This is the whole reason the words previously ran together. The
           * span is `display: inline-block` so it can be transformed, and a
           * space at the end of an inline-block is trimmed rather than
           * rendered. Outside the box it is ordinary inline whitespace: it
           * renders at the font's natural space width and the line still
           * wraps between words, which `&nbsp;` would have prevented.
           */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
