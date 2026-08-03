export interface ProcessStage {
  slug: string;
  /** Displayed as the stage marker, e.g. "01". */
  ordinal: string;
  title: string;
  /** One line. Evocative, and true of bespoke tailoring generally. */
  line: string;
  image: string;
  alt: string;
  /**
   * Clip for this stage. Poster is `image` above. Lazy-loaded: no request is
   * made until the stage reaches the viewport. Files live in
   * public/videos/process/ and are absent until dropped in, in which case the
   * poster simply remains. See components/process-stage-video.tsx.
   */
  video: string;
}

/**
 * The house process, told as a sequence rather than a feature list.
 *
 * COPY CONSTRAINT, deliberate and load-bearing: not one line here states a
 * timeline, a material, a technique, or a guarantee. Everything said is true
 * of bespoke tailoring as a craft, so none of it is a claim about this
 * specific atelier that the owner has not confirmed. If real detail arrives
 * (actual cloth sourcing, actual named techniques, actual turnaround) this
 * copy can get more specific. Until then it stays evocative rather than
 * specific, per docs/business-requirements.md.
 *
 * IMAGE CONSTRAINT: `image` paths point at design-system placeholders, not
 * photography. These are the HIGHEST-PRIORITY reshoot target on the entire
 * site. A process narrative is a direct claim about how *this* workshop
 * works, so a stock or generic image here misrepresents the business in a
 * way that a placeholder on, say, a category card does not. Swapping in real
 * photography is a change to this file only, never to a component.
 */
export const processStages: ProcessStage[] = [
  {
    slug: "measuring",
    ordinal: "01",
    title: "Measuring",
    line: "It begins with the person, not the pattern. Everything that follows rests on getting this part right.",
    image: "/images/process/01-measuring.png",
    video: "/videos/process/01-measuring.mp4",
    alt: "Placeholder for photography of the measuring stage",
  },
  {
    slug: "cutting",
    ordinal: "02",
    title: "Cutting",
    line: "Cloth is marked, then cut. There is no undoing this stage, so it is never the one to hurry.",
    image: "/images/process/02-cutting.png",
    video: "/videos/process/02-cutting.mp4",
    alt: "Placeholder for photography of the cutting stage",
  },
  {
    slug: "sewing",
    ordinal: "03",
    title: "Sewing",
    line: "Piece joined to piece. Somewhere in here, a stack of flat panels starts behaving like a garment.",
    image: "/images/process/03-sewing.png",
    video: "/videos/process/03-sewing.mp4",
    alt: "Placeholder for photography of the sewing stage",
  },
  {
    slug: "fitting",
    ordinal: "04",
    title: "Fitting",
    line: "Worn, studied, marked again. This is where close becomes correct.",
    image: "/images/process/04-fitting.png",
    video: "/videos/process/04-fitting.mp4",
    alt: "Placeholder for photography of the fitting stage",
  },
  {
    slug: "pressing",
    ordinal: "05",
    title: "Pressing",
    line: "Heat, weight, and patience. Pressing is most of the distance between sewn and finished.",
    image: "/images/process/05-pressing.png",
    video: "/videos/process/05-pressing.mp4",
    alt: "Placeholder for photography of the pressing stage",
  },
  {
    slug: "finished",
    ordinal: "06",
    title: "On the form",
    line: "It waits on the form for the person it was measured for.",
    image: "/images/process/06-finished.png",
    video: "/videos/process/06-finished.mp4",
    alt: "Placeholder for photography of a finished garment on the form",
  },
];
