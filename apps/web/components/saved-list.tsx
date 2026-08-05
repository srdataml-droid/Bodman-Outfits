"use client";

import Link from "next/link";
import { GarmentFigure } from "./garment-figure";
import { FavoriteButton } from "./favorite-button";
import { FAVORITES_SCOPE_NOTE, parseFavoriteId, useFavorites } from "../lib/favorites";
import { formatStartingPrice, getCategory, getGarment } from "../lib/garments";

/**
 * The saved list.
 *
 * Resolves stored ids against the catalogue rather than storing garment data
 * in localStorage. Two reasons: a name or price edited in the catalogue is
 * immediately correct here, and a garment that no longer exists resolves to
 * nothing and is skipped instead of rendering a stale card for something the
 * atelier has withdrawn.
 *
 * Rendered entirely client-side because the server cannot know what is in
 * this browser. The first paint is therefore the empty state; that is honest
 * rather than a flash of wrong content, and the list appears on hydration.
 */
export function SavedList(): React.ReactElement {
  const ids = useFavorites();

  const items = ids.flatMap((id) => {
    const parsed = parseFavoriteId(id);
    if (!parsed) return [];
    const garment = getGarment(parsed.category, parsed.slug);
    const category = getCategory(parsed.category);
    if (!garment || !category) return [];
    return [{ id, garment, category }];
  });

  if (items.length === 0) {
    return (
      <div className="mt-12 max-w-xl">
        <p className="text-lg leading-8 text-[var(--muted-ink)]">
          Nothing saved yet. Tap the heart on any garment and it will wait for you here.
        </p>
        <p className="mt-4 text-sm leading-6 text-[var(--muted-ink)]">{FAVORITES_SCOPE_NOTE}</p>
        <Link
          href="/catalogue"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
        >
          BROWSE THE CATALOGUE
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <p className="max-w-xl text-sm leading-6 text-[var(--muted-ink)]">{FAVORITES_SCOPE_NOTE}</p>

      <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ id, garment, category }) => (
          <article key={id} className="group">
            <div className="relative">
              <FavoriteButton
                category={category.slug}
                slug={garment.slug}
                name={garment.name}
                className="absolute right-3 top-3 z-10"
              />
              <Link
                href={`/catalogue/${category.slug}/${garment.slug}`}
                className="block focus-visible:outline-none"
              >
                <GarmentFigure
                  images={garment.images}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-[4/5]"
                />
                <div className="mt-5">
                  <h2 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">
                    {garment.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted-ink)]">{garment.detail}</p>
                  <p className="mt-2 text-base text-[var(--muted-ink)]">
                    {formatStartingPrice(category.price)}
                  </p>
                </div>
              </Link>
            </div>

            {/* Carries the garment into the booking form. Same query shape as
                the price links on the catalogue, so there is one way a
                garment reaches the appointment page, not two. */}
            <Link
              href={`/appointment?category=${category.slug}&garment=${garment.slug}`}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--everglade)] px-5 py-3 text-sm font-medium tracking-[0.1em] text-[var(--everglade)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--copper)] hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
            >
              BOOK A FITTING
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
