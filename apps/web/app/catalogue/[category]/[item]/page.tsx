import type { Metadata } from "next";
import { StaggerText } from "../../../../components/stagger-text";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GarmentFigure } from "../../../../components/garment-figure";
import { SiteFooter } from "../../../../components/site-footer";
import { SiteHeader } from "../../../../components/site-header";
import {
  formatStartingPrice,
  garments,
  getCategory,
  getGarment,
  PRICING_QUALIFIER,
} from "../../../../lib/garments";

interface ItemPageProps {
  params: Promise<{ category: string; item: string }>;
}

export function generateStaticParams(): Array<{ category: string; item: string }> {
  return garments.map((garment) => ({ category: garment.category, item: garment.slug }));
}

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { category: categorySlug, item: itemSlug } = await params;
  const garment = getGarment(categorySlug, itemSlug);
  if (!garment) return {};
  return {
    title: garment.name,
    description: garment.description,
  };
}

export default async function ItemPage({ params }: ItemPageProps): Promise<React.ReactElement> {
  const { category: categorySlug, item: itemSlug } = await params;
  const category = getCategory(categorySlug);
  const garment = getGarment(categorySlug, itemSlug);
  if (!category || !garment) notFound();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <Link
            href={`/catalogue/${category.slug}`}
            className="text-sm font-medium tracking-[0.14em] text-[var(--copper)] transition-colors duration-300 hover:text-[var(--everglade)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
          >
            ← {category.name.toUpperCase()}
          </Link>

          <div className="mt-8 grid gap-10 md:mt-12 md:grid-cols-2 md:gap-16 md:items-start">
            {/* The detail page is the one place the pair is shown as a pair
                rather than a hover: someone who has navigated this far wants
                to see both states, and on touch there is no hover to reveal
                the second one. */}
            <div className="group animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
              <GarmentFigure
                images={garment.images}
                sizes="(min-width: 768px) 50vw, 100vw"
                priority
                className="aspect-[4/5]"
              />
              <p className="mt-3 text-sm leading-6 text-[var(--muted-ink)]">
                Hover or focus the image to see the piece on the form.
              </p>
            </div>

            <div
              className="animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both] md:pt-4"
              style={{ animationDelay: "90ms" }}
            >
              <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">
                {garment.detail.toUpperCase()}
              </p>
              <StaggerText
                as="h1"
                text={garment.name}
                className="mt-5 font-[Fraunces] text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-[var(--everglade)] md:text-6xl"
              />
              <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--muted-ink)]">
                {garment.description}
              </p>

              {/* The single most misleading page if this were omitted: a
                  customer is looking at ONE piece, so an outfit price shown
                  here without its qualifier would read as the price of that
                  piece alone. Item-priced lines get the plain figure. */}
              <div className="mt-8 border-l-2 border-[var(--copper)] pl-5">
                <p className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">
                  {formatStartingPrice(category.price)}
                </p>
                <p className="mt-2 max-w-lg text-base leading-7 text-[var(--muted-ink)]">
                  {category.price.unit === "outfit"
                    ? `${category.name} is priced as a complete outfit, shirt and trousers together. This piece is part of that outfit rather than priced on its own.`
                    : `Starting price for this piece.`}
                </p>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted-ink)]">
                  {PRICING_QUALIFIER}
                </p>
              </div>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href={`/customize/${garment.slug}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_14px_30px_rgb(200_118_58_/_24%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
                >
                  CUSTOMIZE THIS PIECE
                </Link>
                <Link
                  href="/appointment"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-[var(--everglade)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--copper)] hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
                >
                  BOOK A FITTING
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
