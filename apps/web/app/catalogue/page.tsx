import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GarmentFigure } from "../../components/garment-figure";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { categories } from "../../lib/garments";

export const metadata: Metadata = {
  title: "The Catalogue",
  description: "A curated collection of Bodman Outfits signature silhouettes.",
};

export default function CataloguePage(): React.ReactElement {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <header className="max-w-2xl animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">
              THE HOUSE EDIT
            </p>
            <h1 className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl">
              The Catalogue
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              A curated collection of our signature silhouettes, where heritage meets the modern wardrobe. Explore the depth of our craftsmanship across every category.
            </p>
          </header>

          <section aria-labelledby="catalogue-categories" className="mt-24 md:mt-[120px]">
            <h2 id="catalogue-categories" className="sr-only">
              Garment categories
            </h2>
            <div className="grid gap-x-12 gap-y-16 md:grid-cols-2 md:gap-y-24">
              {categories.map((category, index) => (
                <article
                  key={category.slug}
                  className={`group animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both] ${index % 2 === 1 ? "md:mt-24" : ""}`}
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <Link
                    href={`/catalogue/${category.slug}`}
                    className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
                  >
                    <GarmentFigure
                      images={category.images}
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="aspect-[4/5]"
                    />
                    <div className="mt-8 border-l border-[rgb(27_62_45_/_22%)] pl-6">
                      <h3 className="font-[Fraunces] text-3xl font-medium leading-tight text-[var(--everglade)]">
                        {category.name}
                      </h3>
                      <p className="mt-2 text-base leading-7 text-[var(--muted-ink)]">
                        {category.description}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[var(--copper)] transition-[gap] duration-300 group-hover:gap-4">
                        VIEW COLLECTION <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-28 border-t border-[var(--outline)] px-4 py-24 text-center md:mt-[120px] md:py-[120px]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">
              THE HOUSE EXPERIENCE
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-[Fraunces] text-4xl font-medium leading-tight tracking-[-0.02em] text-[var(--everglade)] md:text-5xl">
              Each piece is a dialogue between tailor and client.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted-ink)]">
              Have something in mind that isn&apos;t here yet? Start from your own idea instead.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_14px_30px_rgb(200_118_58_/_24%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
              >
                START YOUR BESPOKE JOURNEY
              </Link>
              <Link
                href="/custom-request"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-[var(--everglade)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--copper)] hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
              >
                SUBMIT A CUSTOM DESIGN
              </Link>
            </div>
          </section>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
