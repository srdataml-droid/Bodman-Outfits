import Link from "next/link";
import { StaggerText } from "../components/stagger-text";
import { CategoryCarousel } from "../components/category-carousel";
import { GarmentFigure } from "../components/garment-figure";
import { ProcessNarrative } from "../components/process-narrative";
import { ScrollReveal } from "../components/scroll-reveal";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { categories } from "../lib/garments";

export default function HomePage(): React.ReactElement {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <div className="max-w-2xl animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">
              BESPOKE TAILORING · LAGOS
            </p>
            <StaggerText
              as="h1"
              text="Cloth cut for the person, not the market."
              className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.02] tracking-[-0.035em] text-[var(--everglade)] md:text-7xl"
            />
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              Bespoke tailoring from Lagos. We measure once, cut once, and build garments that fit your life.
            </p>
            <Link
              href="/appointment"
              className="mt-9 inline-flex rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_14px_30px_rgb(200_118_58_/_24%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
            >
              BOOK A FITTING
            </Link>
          </div>

          {/* Hero carousel replaces the former static process-image grid.
              The process narrative further down the page is untouched. */}
          <div className="mt-14 md:mt-20 lg:grid lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-16">
            <div className="hidden lg:block">
              <p className="max-w-md text-lg leading-8 text-[var(--muted-ink)]">
                Five lines, each cut to measure. Choose where to start.
              </p>
            </div>
            <CategoryCarousel />
          </div>
        </section>

        <section className="bg-[#e8ebea] px-5 py-24 md:px-16 md:py-[120px]">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">SIGNATURE GARMENTS</p>
              <StaggerText
                text="A selection from the house, cut for a single person."
                className="mt-5 font-[Fraunces] text-4xl font-medium leading-tight tracking-[-0.025em] text-[var(--everglade)] md:text-5xl"
              />
            </div>
            <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <ScrollReveal as="article" key={category.slug} delayMs={index * 70} className="group">
                  <Link
                    href={`/catalogue/${category.slug}`}
                    className="block focus-visible:outline-none"
                  >
                    <GarmentFigure
                      images={category.images}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="aspect-[4/5]"
                    />
                    <div className="mt-5 text-center">
                      <h3 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">{category.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-ink)]">{category.tagline}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[var(--copper)] transition-[gap] duration-200 ease-out group-hover:gap-4">
                        VIEW CATALOGUE <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <ProcessNarrative />

        <section className="bg-[#e8ebea] px-5 py-24 text-center md:px-16 md:py-[120px]">
          <ScrollReveal className="mx-auto max-w-xl">
            <StaggerText
              text="Ready for a perfect fit?"
              className="font-[Fraunces] text-4xl font-medium leading-tight tracking-[-0.025em] text-[var(--everglade)] md:text-5xl"
            />
            <p className="mt-6 text-lg leading-8 text-[var(--muted-ink)]">
              A person&apos;s clothes should never be a compromise. Come to the house and let us build something true.
            </p>
            <Link
              href="/appointment"
              className="mt-9 inline-flex rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_14px_30px_rgb(200_118_58_/_24%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
            >
              BOOK AN APPOINTMENT
            </Link>
          </ScrollReveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
