import Image from "next/image";
import type { GarmentImagePair } from "../lib/garments";

interface GarmentFigureProps {
  images: GarmentImagePair;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * The garment hover mechanic: flat cloth resolving into the garment on a form.
 *
 * Both images are rendered and stacked; hover/focus crossfades between them.
 * Two things worth knowing about the approach:
 *
 * 1. It is driven entirely by CSS `group-hover` / `group-focus-visible`, with
 *    no React state. State would re-render on every pointer enter and leave,
 *    and would not work at all before hydration. CSS works immediately and
 *    costs nothing.
 * 2. It is bound to `group-focus-visible` as well as hover, so the second
 *    image is reachable by keyboard and not hover-only. Touch devices have no
 *    hover at all, so the flat image is the one that must stand on its own,
 *    which is why it is the resting state rather than the reverse.
 *
 * The `onForm` image is marked aria-hidden: both images show the same
 * garment, so announcing the second adds noise for a screen reader without
 * adding information.
 */
export function GarmentFigure({
  images,
  sizes,
  priority = false,
  className = "",
}: GarmentFigureProps): React.ReactElement {
  return (
    <div
      className={`garment-figure relative overflow-hidden rounded-2xl border border-[rgb(210_180_140_/_45%)] bg-white ${className}`}
    >
      <Image
        src={images.flat}
        alt={images.altFlat}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover opacity-100 group-hover:opacity-0 group-focus-visible:opacity-0"
      />
      <Image
        src={images.onForm}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        // Starts a hair larger and settles to rest, so the garment reads as
        // stepping forward rather than simply appearing. 1.03 is small enough
        // to register as weight rather than as a zoom effect.
        className="scale-[1.03] object-cover opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      />
    </div>
  );
}
