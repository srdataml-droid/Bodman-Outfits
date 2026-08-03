import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GarmentFigure } from "../../../components/garment-figure";
import { SiteFooter } from "../../../components/site-footer";
import { SiteHeader } from "../../../components/site-header";
import { categories, getCategory, getGarmentsByCategory } from "../../../lib/garments";

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

  const garments = getGarmentsByCategory(categorySlug);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <header className="max-w-2xl animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <Link
              href="/catalogue"
              className="text-sm font-medium tracking-[0.14em] text-[var(--copper)] transition-colors duration-300 hover:text-[var(--everglade)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
            >
              ← THE CATALOGUE
            </Link>
            <h1 className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl">
              {category.name}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              {category.description}
            </p>
          </header>

          <section aria-labelledby="category-garments" className="mt-20 md:mt-28">
            <h2 id="category-garments" className="sr-only">
              {category.name} garments
            </h2>
            {garments.length === 0 ? (
              // Agbada and kaftan have no individual pieces listed yet.
              // Saying so plainly beats inventing garment names for lines
              // nobody has described, and matches how the rest of the site
              // handles unconfirmed content.
              <p className="max-w-xl text-lg leading-8 text-[var(--muted-ink)]">
                Individual pieces from this line aren&apos;t listed here yet. Everything is cut to
                measure, so the best place to start is a conversation. Book a fitting or send us a
                note and we&apos;ll talk through what you have in mind.
              </p>
            ) : null}
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {garments.map((garment, index) => (
                <article
                  key={garment.slug}
                  className="group animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <Link
                    href={`/catalogue/${category.slug}/${garment.slug}`}
                    className="block focus-visible:outline-none"
                  >
                    <GarmentFigure
                      images={garment.images}
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
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
