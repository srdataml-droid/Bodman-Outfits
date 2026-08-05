"use client";

import { favoriteId, toggleFavorite, useIsFavorite } from "../lib/favorites";

interface FavoriteButtonProps {
  category: string;
  slug: string;
  /** The garment's display name, used for the accessible label. */
  name: string;
  className?: string;
}

/**
 * The heart on a garment card.
 *
 * Sits INSIDE a card that is itself a link, so the click must be stopped from
 * bubbling or tapping the heart would navigate to the garment instead of
 * saving it. `preventDefault` handles the anchor, `stopPropagation` the card.
 *
 * The button carries the state in its accessible name ("Save the Navy
 * Two-Piece" / "Saved: Navy Two-Piece") rather than relying on the fill
 * colour alone, and `aria-pressed` gives assistive tech the toggle semantics.
 * Before hydration the store reports empty, so this renders unsaved and
 * corrects itself once React takes over; that is a frame of visual catch-up,
 * not a wrong answer being announced.
 */
export function FavoriteButton({
  category,
  slug,
  name,
  className = "",
}: FavoriteButtonProps): React.ReactElement {
  const id = favoriteId(category, slug);
  const saved = useIsFavorite(id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Saved: ${name}. Tap to remove.` : `Save ${name} to your list`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(id);
      }}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(27_62_45_/_12%)] bg-white/90 backdrop-blur transition duration-200 ease-out hover:scale-105 hover:border-[var(--copper)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--copper)] ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5 transition-colors duration-200 ease-out"
        fill={saved ? "var(--copper)" : "none"}
        stroke={saved ? "var(--copper)" : "var(--everglade)"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20.3 4.8 13.1a4.6 4.6 0 0 1 0-6.5 4.6 4.6 0 0 1 6.5 0l.7.7.7-.7a4.6 4.6 0 0 1 6.5 0 4.6 4.6 0 0 1 0 6.5Z" />
      </svg>
    </button>
  );
}
