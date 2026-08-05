import Link from "next/link";
import { ProcessStageVideo } from "./process-stage-video";
import { processStages } from "../lib/process";
import { ScrollReveal } from "./scroll-reveal";
import { StaggerText } from "./stagger-text";

/**
 * The home page's primary storytelling section: how a garment is made,
 * stage by stage, ending by handing off into the catalogue.
 *
 * Layout intent, and why it is not a card grid:
 *
 * A grid of six equal cards would read as a feature list, which is the
 * generic e-commerce shape this project is explicitly trying not to look
 * like. Instead the stages alternate side to side down a single centre rule,
 * so the eye travels down one continuous line. That is closer to how a
 * printed lookbook paces a sequence, and it makes the order feel like a
 * process rather than a menu of options.
 *
 * The centre rule is a real element rather than decoration: it is the thing
 * that carries the reader from Measuring through to the finished garment,
 * and it continues into the catalogue hand-off at the end so the story
 * visibly leads somewhere.
 *
 * On mobile the alternation collapses to a single column with the rule moved
 * to the left edge, because alternating sides in a narrow viewport just
 * produces two cramped columns and loses the line entirely.
 */
export function ProcessNarrative(): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-[var(--canvas)] px-5 py-24 md:px-16 md:py-[140px]">
      <div className="mx-auto max-w-[1080px]">
        <ScrollReveal className="max-w-2xl">
          <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">THE MAKING</p>
          {/* The one heading here that earns the stagger. The six stage
              titles below deliberately do not use it: repeating the effect
              six times down a single column would turn a considered detail
              into a tic. */}
          <StaggerText
            text="Six stages, one garment, one person."
            className="mt-5 font-[Fraunces] text-4xl font-medium leading-[1.08] tracking-[-0.025em] text-[var(--everglade)] md:text-[56px]"
          />
          <p className="mt-6 text-lg leading-8 text-[var(--muted-ink)]">
            Nothing here is rushed and nothing is skipped. This is the order the work happens in.
          </p>
        </ScrollReveal>

        <ol className="relative mt-20 md:mt-28">
          {/* The line the whole sequence hangs from. Sits at the left edge on
              mobile and down the centre from md up. Purely decorative, so it
              is hidden from assistive technology. */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-[7px] top-2 w-px bg-[rgb(27_62_45_/_14%)] md:left-1/2 md:-translate-x-1/2"
          />

          {processStages.map((stage, index) => {
            const flipped = index % 2 === 1;
            return (
              <ScrollReveal
                as="li"
                key={stage.slug}
                // Small stagger only. A long chain would make the reader wait
                // on the page rather than read it.
                delayMs={index === 0 ? 0 : 60}
                className="relative mb-20 pl-9 last:mb-0 md:mb-32 md:pl-0"
              >
                <div
                  className={`md:flex md:items-center md:gap-16 ${flipped ? "md:flex-row-reverse" : ""}`}
                >
                  {/* Node on the rule. */}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-2 h-[15px] w-[15px] rounded-full border border-[rgb(27_62_45_/_28%)] bg-[var(--canvas)] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
                  >
                    <span className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--copper)]" />
                  </span>

                  <div className="md:w-1/2">
                    <ProcessStageVideo
                      videoSrc={stage.video}
                      poster={stage.image}
                      posterAlt={stage.alt}
                    />
                  </div>

                  <div className={`mt-7 md:mt-0 md:w-1/2 ${flipped ? "md:text-right" : ""}`}>
                    <p className="font-[Fraunces] text-sm font-medium tracking-[0.2em] text-[var(--copper)]">
                      {stage.ordinal}
                    </p>
                    <h3 className="mt-3 font-[Fraunces] text-3xl font-medium leading-tight text-[var(--everglade)] md:text-4xl">
                      {stage.title}
                    </h3>
                    <p className="mt-4 max-w-md text-base leading-7 text-[var(--muted-ink)] md:text-lg md:leading-8">
                      {stage.line}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </ol>

        {/* The hand-off. The rule has carried the reader to a finished
            garment, so the only thing left to offer is the catalogue. */}
        <ScrollReveal className="relative pl-9 text-left md:pl-0 md:text-center">
          <span
            aria-hidden="true"
            className="absolute left-0 top-1 h-[15px] w-[15px] rounded-full border border-[var(--copper)] bg-[var(--copper)] md:left-1/2 md:-top-4 md:-translate-x-1/2"
          />
          <p className="font-[Fraunces] text-2xl font-medium leading-snug text-[var(--everglade)] md:mt-6 md:text-3xl">
            And then it belongs to you.
          </p>
          <Link
            href="/catalogue"
            className="group mt-6 inline-flex min-h-11 items-center gap-3 rounded-xl border border-[var(--everglade)] px-6 py-3 text-sm font-medium tracking-[0.1em] text-[var(--everglade)] transition duration-200 ease-out hover:bg-[var(--everglade)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
          >
            SEE THE CATALOGUE
            <span aria-hidden="true" className="transition-transform duration-200 ease-out group-hover:translate-x-1">
              →
            </span>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
