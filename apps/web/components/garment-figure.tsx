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
 *    hover at all, so they default to the on-form image. From the md breakpoint
 *    upward the flat image is the resting state and hover/focus reveals the
 *    on-form image.
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
        className="object-cover object-top opacity-0 transition-opacity duration-300 motion-reduce:transition-none md:opacity-100 md:group-hover:opacity-0 md:group-focus-visible:opacity-0"
      />
      <Image
        src={images.onForm}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        className="scale-100 object-cover object-top opacity-100 transition-[opacity,transform] duration-300 motion-reduce:transition-none md:scale-[1.02] md:opacity-0 md:group-hover:scale-100 md:group-hover:opacity-100 md:group-focus-visible:scale-100 md:group-focus-visible:opacity-100"
      />
    </div>
  );
}
