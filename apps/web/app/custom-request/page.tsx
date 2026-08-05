import type { Metadata } from "next";
import { CustomRequestForm } from "../../components/custom-request-form";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export const metadata: Metadata = {
  title: "Custom Design Request",
  description: "Commission a piece of your own design, made to your measurements.",
};

export default function CustomRequestPage(): React.ReactElement {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <div className="max-w-2xl animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">
              START FROM YOUR OWN IDEA
            </p>
            <h1 className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-6xl">
              A custom design request
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted-ink)]">
              For a piece that is not in the catalogue. Tell us what you are imagining and we will
              tell you honestly whether we can make it, and what it would involve, before you commit
              to anything.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: "90ms" }}>
              <CustomRequestForm />
            </div>
            <aside className="animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both] lg:pt-4" style={{ animationDelay: "160ms" }}>
              <h2 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">
                What happens next
              </h2>
              <ol className="mt-5 space-y-5 text-base leading-7 text-[var(--muted-ink)]">
                <li>
                  <span className="font-medium text-[var(--everglade)]">We read it.</span> Every
                  request is reviewed by hand, in the order it arrives.
                </li>
                <li>
                  <span className="font-medium text-[var(--everglade)]">We answer honestly.</span> If
                  it is not something we can make well, we would rather say so than take the work.
                </li>
                <li>
                  <span className="font-medium text-[var(--everglade)]">Nothing is committed.</span>{" "}
                  Submitting this places no order and costs nothing.
                </li>
              </ol>
              <p className="mt-8 text-sm leading-6 text-[rgb(65_72_67_/_70%)]">
                Have a reference picture? Mention it in your description and we will ask you for it
                directly, so it reaches the person who will actually cut the piece.
              </p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
