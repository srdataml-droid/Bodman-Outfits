import type { Metadata } from "next";
import { StaggerText } from "../../components/stagger-text";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Heritage",
  description: "How Bodman Outfits approaches menswear tailoring in Lagos.",
};

const craftPrinciples = [
  {
    title: "Fabric",
    description:
      "We work in premium wool, cotton, and linen, chosen for how they hold a line and move with the body rather than for how they photograph.",
  },
  {
    title: "Construction",
    description:
      "Every pattern is cut once, by hand, and adjusted to the person in front of us. Nothing is pulled straight from a size chart.",
  },
  {
    title: "Finishing",
    description:
      "Buttons, seams, the set of a collar. The last details are where a garment holds up or it doesn't, so we take our time over them.",
  },
] as const;

export default function AboutPage(): React.ReactElement {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-20 pt-16 md:px-16 md:pb-28 md:pt-28">
          <div className="mx-auto max-w-2xl text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">THE HOUSE</p>
            <StaggerText
              as="h1"
              text="Built on patience, not shortcuts."
              className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl"
            />
            <p className="mt-7 text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              A Lagos house working in menswear. Suits, agbada, kaftans, casuals and corporate pieces, all cut
              for the person wearing them rather than assembled for the market.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-5 py-20 md:px-16 md:py-28">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-8">
            <div
              className="md:col-span-5 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: "90ms" }}
            >
              <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">OUR APPROACH</p>
              <h2 className="mt-5 font-[Fraunces] text-4xl font-medium leading-tight tracking-[-0.025em] text-[var(--everglade)] md:text-5xl">
                Measure once. Cut once.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[var(--muted-ink)]">
                Bodman Outfits exists because good tailoring shouldn&apos;t be rushed. We take the time to understand
                the person in front of us: how they stand, how they move, what they need the garment to do for
                them. All of that happens before a single cut is made.
              </p>
              <p className="mt-6 text-lg leading-8 text-[var(--muted-ink)]">
                We would rather be known for how we work than for how we talk about ourselves: patiently,
                precisely, one client at a time. Come in for a fitting and you will see the whole of it.
              </p>
            </div>
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[rgb(210_180_140_/_40%)] md:col-span-6 md:col-start-7 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: "150ms" }}
            >
              <Image
                src="/images/catalogue/category-suits-on-form.png"
                alt="Placeholder for a photograph of the house's suiting"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#e8ebea] px-5 py-20 md:px-16 md:py-28">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-2xl text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
              <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">THE CRAFT</p>
              <h2 className="mt-5 font-[Fraunces] text-4xl font-medium leading-tight tracking-[-0.025em] text-[var(--everglade)] md:text-5xl">
                Cloth chosen for how it wears.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[var(--muted-ink)]">
                Every garment we make passes through the same disciplined process, regardless of category.
              </p>
            </div>
            <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
              {craftPrinciples.map((principle, index) => (
                <div
                  key={principle.title}
                  className="rounded-2xl border border-[rgb(210_180_140_/_40%)] bg-white p-8 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <h3 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">{principle.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">{principle.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 text-center md:py-28">
          <div className="mx-auto max-w-xl">
            <h2 className="font-[Fraunces] text-4xl font-medium leading-tight tracking-[-0.025em] text-[var(--everglade)] md:text-5xl">
              Ready to begin?
            </h2>
            <p className="mt-6 text-lg leading-8 text-[var(--muted-ink)]">
              Come to the house and let us build something true, or start the conversation from wherever you are.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/appointment"
                className="inline-flex min-h-11 items-center rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_14px_30px_rgb(200_118_58_/_24%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
              >
                BOOK A FITTING
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-[var(--everglade)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--copper)] hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
              >
                GET IN TOUCH
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
