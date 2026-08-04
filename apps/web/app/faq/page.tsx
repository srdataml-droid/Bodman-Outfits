import type { Metadata } from "next";
import { StaggerText } from "../../components/stagger-text";
import Link from "next/link";
import { FaqList } from "../../components/faq-list";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { getFaqEntries } from "../../lib/faq-data";
import {
  categories,
  formatStartingPrice,
  priceUnitLabel,
  PRICING_QUALIFIER,
} from "../../lib/garments";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ordering, measurements, and timelines at Bodman Outfits.",
};

/**
 * Read from `lib/garments.ts` rather than restated here.
 *
 * An earlier version of this page kept its own hand-written copy of the five
 * figures, which immediately drifted: it marked only Casuals as a starting
 * price when in fact all five are. A second copy of a price list is a second
 * thing to forget to update, so there is now exactly one source and this page
 * sorts a view of it.
 *
 * Sorted cheapest first, unlike the catalogue's own order, so the list opens
 * on the most approachable figure rather than the largest.
 */
const priceList = [...categories].sort((a, b) => a.price.from - b.price.from);

export default async function FaqPage(): Promise<React.ReactElement> {
  const faqEntries = await getFaqEntries();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-20 pt-16 md:px-16 md:pb-28 md:pt-28">
          <div className="mx-auto max-w-2xl text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">FAQ</p>
            <StaggerText
              as="h1"
              text="Questions we hear often."
              className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl"
            />
            <p className="mt-7 text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              How we work, what it costs, and how to begin.
            </p>
          </div>

          <div
            className="mx-auto mt-12 max-w-2xl rounded-2xl bg-[#e8ebea] p-7 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both] md:p-8"
            style={{ animationDelay: "90ms" }}
          >
            <p className="text-center font-[Fraunces] text-sm font-medium tracking-[0.2em] text-[var(--copper)]">
              WHAT IT COSTS
            </p>

            {/* Lowest first, so the list opens with the most approachable
                number rather than the largest one. */}
            <dl className="mx-auto mt-6 max-w-md">
              {priceList.map((category) => (
                <div
                  key={category.slug}
                  className="flex items-baseline justify-between gap-4 border-b border-[rgb(27_62_45_/_10%)] py-3 last:border-b-0"
                >
                  <dt className="text-base text-[var(--everglade)]">
                    {category.name}
                    {/* Carries the outfit/item distinction into the one place
                        all five figures are listed together, which is exactly
                        where a bare number invites the wrong comparison. */}
                    <span className="ml-2 text-sm text-[var(--muted-ink)]">
                      {priceUnitLabel(category.price)}
                    </span>
                  </dt>
                  <dd className="whitespace-nowrap text-base font-medium tabular-nums text-[var(--muted-ink)]">
                    {formatStartingPrice(category.price)}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 text-center text-base leading-7 text-[var(--muted-ink)]">
              {PRICING_QUALIFIER} Tell us what you have in mind on{" "}
              <Link
                href="/contact"
                className="font-medium text-[var(--copper)] underline decoration-1 underline-offset-2 transition-colors duration-300 hover:text-[var(--everglade)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
              >
                the contact page
              </Link>{" "}
              and we will price it properly.
            </p>
          </div>

          <div
            className="mt-16 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both] md:mt-20"
            style={{ animationDelay: "150ms" }}
          >
            {faqEntries ? (
              <FaqList entries={faqEntries} />
            ) : (
              <p className="mx-auto max-w-xl text-center text-base leading-7 text-[var(--muted-ink)]">
                Our FAQs aren&apos;t loading right now. Please{" "}
                <Link
                  href="/contact"
                  className="font-medium text-[var(--copper)] underline decoration-1 underline-offset-2 transition-colors duration-300 hover:text-[var(--everglade)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
                >
                  get in touch
                </Link>{" "}
                directly and we&apos;ll answer your question.
              </p>
            )}
          </div>
        </section>

        <section className="bg-[#e8ebea] px-5 py-20 text-center md:px-16 md:py-28">
          <div className="mx-auto max-w-xl">
            <h2 className="font-[Fraunces] text-4xl font-medium leading-tight tracking-[-0.025em] text-[var(--everglade)] md:text-5xl">
              Still have a question?
            </h2>
            <p className="mt-6 text-lg leading-8 text-[var(--muted-ink)]">
              We&apos;d rather answer it directly than leave you guessing.
            </p>
            <Link
              href="/contact"
              className="mt-9 inline-flex min-h-11 items-center rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_14px_30px_rgb(200_118_58_/_24%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
            >
              GET IN TOUCH
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
