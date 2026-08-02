import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "../../components/faq-list";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { getFaqEntries } from "../../lib/faq-data";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ordering, measurements, and timelines at Atelier Haute.",
};

export default async function FaqPage(): Promise<React.ReactElement> {
  const faqEntries = await getFaqEntries();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-20 pt-16 md:px-16 md:pb-28 md:pt-28">
          <div className="mx-auto max-w-2xl text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">FAQ</p>
            <h1 className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl">
              Questions we hear often.
            </h1>
            <p className="mt-7 text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              Straight answers about how we work — and where we&apos;re still finalizing policy.
            </p>
          </div>

          <div
            className="mx-auto mt-12 max-w-2xl rounded-2xl bg-[#e8ebea] p-6 text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ animationDelay: "90ms" }}
          >
            <p className="text-base leading-7 text-[var(--muted-ink)]">
              Some answers below are marked pending — final pricing, turnaround, and alteration policy are still
              being confirmed. Ask us directly on{" "}
              <Link
                href="/contact"
                className="font-medium text-[var(--copper)] underline decoration-1 underline-offset-2 transition-colors duration-300 hover:text-[var(--everglade)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
              >
                the contact page
              </Link>{" "}
              for specifics.
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
