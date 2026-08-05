"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { categories, formatStartingPrice, priceUnitLabel } from "../lib/garments";

/**
 * How long each slide is held before advancing.
 *
 * Named rather than inlined because this is the number most likely to need
 * tuning by feel. Five seconds is long enough to read a label and decide
 * whether to click; anything near a second reads as a flicker rather than a
 * slide and is unusable for navigation, which is what this is.
 */
export const CAROUSEL_INTERVAL_MS = 5000;

/** How long autoplay stays paused after a manual advance. */
const RESUME_AFTER_MANUAL_MS = 10000;

/**
 * The home page hero carousel: five garment lines, each a link into its
 * catalogue page.
 *
 * This is navigation, not decoration, which drives most of the decisions
 * here. Every slide is a real anchor so it works with a keyboard, opens in a
 * new tab on middle-click, and is announced as a link. Labels are always
 * visible rather than revealed on hover, because a control you cannot read
 * until you touch it is not a control.
 *
 * Autoplay pauses on hover and on focus, so it cannot advance out from under
 * someone who is reading a label or tabbing through. It also pauses after a
 * manual advance and resumes later, rather than being disabled permanently:
 * the point is not to fight the user, but a carousel that stops forever after
 * one click stops being a carousel.
 */
export function CategoryCarousel(): React.ReactElement {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const resumeTimer = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const goTo = useCallback((next: number) => {
    setIndex(((next % categories.length) + categories.length) % categories.length);
  }, []);

  // Manual advance. Pauses autoplay, then schedules it to resume rather than
  // leaving it off for good.
  const advanceManually = useCallback(
    (direction: 1 | -1) => {
      setPaused(true);
      setIndex((current) => {
        const next = current + direction;
        return ((next % categories.length) + categories.length) % categories.length;
      });
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_AFTER_MANUAL_MS);
    },
    [],
  );

  useEffect(
    () => () => {
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    },
    [],
  );

  // Autoplay. Skipped entirely under reduced motion: the requirement is a
  // static first slide with manual navigation only, not a slower carousel.
  useEffect(() => {
    if (reducedMotion || paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % categories.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, paused]);

  const active = categories[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Garment lines"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        // Only resume once focus has genuinely left the carousel, not while
        // moving between the slide link and the next button.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          advanceManually(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          advanceManually(-1);
        }
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[rgb(210_180_140_/_45%)] bg-white sm:aspect-[3/2] lg:aspect-[4/5]">
        {categories.map((category, i) => {
          const isActive = i === index;
          return (
            <Link
              key={category.slug}
              href={`/catalogue/${category.slug}`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              // The price is in the accessible name too. A sighted user reads
              // it off the slide, so a screen reader user must get it from the
              // link rather than have to open the page to find out.
              aria-label={`${category.name}. ${category.tagline}. ${formatStartingPrice(category.price)} ${priceUnitLabel(category.price)}. View the ${category.name} line.`}
              className={`absolute inset-0 block transition-opacity duration-500 ease-out focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--copper)] ${
                isActive ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <Image
                src={category.images.onForm}
                alt={category.images.altOnForm}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
              {/* Scrim so the label stays legible whatever the photograph
                  underneath turns out to be. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgb(21_49_36_/_78%)] to-transparent"
              />
              <span className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                <span className="block font-[Fraunces] text-3xl font-medium leading-tight text-white md:text-4xl">
                  {category.name}
                </span>
                <span className="mt-1.5 block text-sm text-[rgb(255_255_255_/_82%)]">
                  {category.tagline}
                </span>
                {/* Unit qualifier travels with the figure, never without it.
                    Casuals and corporate are outfit-priced and sit in the same
                    rotation as the item-priced lines. */}
                <span className="mt-3 block text-sm font-medium text-white">
                  {formatStartingPrice(category.price)}{" "}
                  <span className="font-normal text-[rgb(255_255_255_/_72%)]">
                    {priceUnitLabel(category.price)}
                  </span>
                </span>
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => advanceManually(1)}
          aria-label={`Next line (currently showing ${active.name})`}
          className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[rgb(255_255_255_/_45%)] bg-[rgb(21_49_36_/_55%)] text-lg text-white transition-colors duration-150 hover:bg-[rgb(21_49_36_/_80%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--copper)]"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      {/* Slide indicators, also clickable. Each is a real button with an
          accessible name rather than a bare dot. */}
      {/*
        The BUTTON is 44x44; the dot inside it is the 10px visual. Measured on
        a real 375px viewport these were 10x10 tappable, a quarter of the
        44x44 minimum the project requires, on the home page's primary
        navigation. Growing the visible dot would have wrecked the design, so
        the hit area grows instead and the dot is an inert span.

        `-mx-1.5` claws back the padding so the row still reads as tightly
        spaced dots rather than five wide gaps.
      */}
      <div className="mt-1 flex items-center justify-center">
        {categories.map((category, i) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => {
              setPaused(true);
              goTo(i);
              if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
              resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_AFTER_MANUAL_MS);
            }}
            aria-label={`Show ${category.name}`}
            aria-current={i === index ? "true" : undefined}
            className="-mx-1.5 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--copper)]"
          >
            <span
              aria-hidden="true"
              className={`h-2.5 rounded-full transition-all duration-200 ease-out ${
                i === index ? "w-7 bg-[var(--everglade)]" : "w-2.5 bg-[rgb(27_62_45_/_25%)]"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Announced to screen readers on change without moving focus. */}
      <p aria-live="polite" className="sr-only">
        {`Slide ${index + 1} of ${categories.length}: ${active.name}`}
      </p>
    </section>
  );
}
