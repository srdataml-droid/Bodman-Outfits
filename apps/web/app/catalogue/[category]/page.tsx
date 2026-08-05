import type { Metadata } from "next";
import { ScrollReveal } from "../../../components/scroll-reveal";
import { StaggerText } from "../../../components/stagger-text";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { garmentImages, getGarmentsByCategory } from "../../../lib/garments-data";
import { FavoriteButton } from "../../../components/favorite-button";
import { GarmentFigure } from "../../../components/garment-figure";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import {
  categories,
  formatStartingPrice,
  getCategory,
  priceUnitDetail,
  PRICING_QUALIFIER,
} from "../../../lib/garments";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams(): Array<{ category: string }> {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategory(categorySlug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps): Promise<React.ReactElement> {
  const { category: categorySlug } = await params;
  const category = getCategory(categorySlug);
  if (!category) notFound();

  const garments = await getGarmentsByCategory(categorySlug);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <header className="max-w-2xl animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <Link
              href="/catalogue"
              className="inline-flex min-h-11 items-center text-sm font-medium tracking-[0.14em] text-[var(--copper)] transition-colors duration-300 hover:text-[var(--everglade)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
            >
              ← THE CATALOGUE
            </Link>
            <StaggerText
              as="h1"
              text={category.name}
              className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl"
            />
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              {category.description}
            </p>

            {/* The price block. On casuals and corporate this is the one place
                a customer can be told, in full, that the figure buys shirt AND
                trousers together. `priceUnitDetail` spells that out rather
                than relying on the word "outfit" carrying it. */}
            <div className="mt-8 border-l-2 border-[var(--copper)] pl-5">
              {/* The price is a booking entry point, NOT a checkout. Nothing
                  is payable at this stage: the real figure is only settled
                  after a fitting. The link therefore goes to the appointment
                  form and says so in its accessible name, so nobody taps a
                  naira figure expecting a payment screen. */}
              <Link
                href={`/appointment?category=${category.slug}`}
                aria-label={`${formatStartingPrice(category.price)} for ${category.name}. Book a fitting to discuss it.`}
                className="group/price inline-flex min-h-11 items-center font-[Fraunces] text-2xl font-medium text-[var(--everglade)] transition-colors duration-200 ease-out hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)] md:text-3xl"
              >
                {formatStartingPrice(category.price)}
                <span
                  aria-hidden="true"
                  className="ml-3 text-sm tracking-[0.1em] text-[var(--copper)] opacity-0 transition-opacity duration-200 ease-out group-hover/price:opacity-100 group-focus-visible/price:opacity-100"
                >
                  BOOK A FITTING →
                </span>
              </Link>
              <p className="mt-2 max-w-md text-base leading-7 text-[var(--muted-ink)]">
                {priceUnitDetail(category.price)}.
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted-ink)]">
                {PRICING_QUALIFIER}
              </p>
            </div>
          </header>

          <section aria-labelledby="category-garments" className="mt-20 md:mt-28">
            <h2 id="category-garments" className="sr-only">
              {category.name} garments
            </h2>
            {garments.length === 0 ? (
              // Agbada and kaftan carry no individual pieces. Rather than
              // announce that as a gap in the catalogue, this frames it as
              // what it actually is: these lines are cut to the person from
              // the start, so the conversation IS the entry point. No
              // invented garment names, and no apology either.
              <p className="max-w-xl text-lg leading-8 text-[var(--muted-ink)]">
                This line is cut to the person from the first measurement, so it begins with a
                conversation rather than a rail. Book a fitting or send us a note, and we&apos;ll
                talk through exactly what you have in mind.
              </p>
            ) : null}

            {/* Kept, but for a different reason than it was written for.
                It once contradicted a list that split an outfit-priced line
                into "Casual Shirt" and "Casual Trousers"; that split was
                reversed on 2026-08-05 and each line is now a single outfit.
                What still needs saying is what the one figure buys, and that
                a single piece is orderable even though it is not listed. */}
            {category.price.unit === "outfit" && garments.length > 0 ? (
              <p className="mb-10 max-w-xl rounded-xl bg-[#e8ebea] px-5 py-4 text-base leading-7 text-[var(--everglade)]">
                {category.name} is priced as a complete outfit:{" "}
                <span className="font-medium">{formatStartingPrice(category.price)}</span> covers the
                shirt and the trousers together, not either one on its own. We can still make a
                single piece for you, so ask if that is what you want.
              </p>
            ) : null}

            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {garments.map((garment, index) => (
                // Staggered across the row rather than across the whole
                // list: the delay resets every three cards so a long line
                // never ends with a card that waits most of a second.
                <ScrollReveal
                  as="article"
                  key={garment.slug}
                  delayMs={(index % 3) * 70}
                  className="group"
                >
                  {/* The heart sits outside the Link, layered over the
                      figure, so it is a sibling of the anchor rather than a
                      button nested inside one. Nesting interactive elements
                      is invalid HTML and makes keyboard order unpredictable. */}
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
                        images={garmentImages(garment)}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="aspect-[4/5]"
                      />
                      <div className="mt-5">
                        <h3 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">{garment.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted-ink)]">{garment.detail}</p>
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[var(--copper)] transition-[gap] duration-300 group-hover:gap-4">
                          VIEW GARMENT <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </Link>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
