"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger within a group. Kept small; long chains read as a loading page. */
  delayMs?: number;
  as?: "div" | "li" | "section" | "article";
}

/**
 * Reveals its children once, when they first enter the viewport.
 *
 * Deliberately hand-rolled on IntersectionObserver rather than pulled from a
 * motion library. The project's frontend skill nominates GSAP for
 * scroll-triggered reveals, but the entire requirement here is "fade and rise
 * slightly, once" which is a few lines of observer plus two CSS properties.
 * See decisions.md for the full reasoning and the flag raised about it.
 *
 * Reveals are one-way on purpose. Re-hiding content when it scrolls back out
 * makes a page feel busy and costs the reader their place, which is the
 * opposite of the restraint this design is going for.
 */
export function ScrollReveal({
  children,
  className,
  delayMs = 0,
  as = "div",
}: ScrollRevealProps): React.ReactElement {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (node === null || revealed) return;

    // If the user prefers reduced motion the CSS never hides anything, so
    // there is nothing to reveal and no observer worth creating.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    // Already on screen at mount (above the fold, a restored scroll position,
    // a #hash landing). Reveal straight away rather than waiting on an
    // observer callback that may be a frame away, which would otherwise show
    // a brief flash of hidden content on first paint.
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
      // Fires slightly before the element is fully on screen so the motion
      // completes as the reader arrives, rather than starting once they are
      // already looking at it.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);

    // Failsafe. Content must never be permanently invisible because an
    // observer did not deliver. This is not hypothetical: during verification
    // IntersectionObserver was observed never firing at all in one Chrome
    // context, including on a freshly created, plainly visible element, while
    // requestAnimationFrame kept running normally. Whatever the cause, the
    // correct behaviour for a page whose text is hidden pending a callback is
    // to give up waiting and show it. The cost of this firing spuriously is a
    // skipped animation; the cost of not having it is unreadable content.
    const failsafe = window.setTimeout(() => {
      setRevealed(true);
      observer.disconnect();
    }, 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [revealed]);

  const Tag = as;
  return (
    <Tag
      ref={ref as React.RefObject<never>}
      data-reveal={revealed ? "shown" : "hidden"}
      style={revealed && delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
