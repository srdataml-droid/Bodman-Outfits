import type { Metadata } from "next";
import { AppointmentForm } from "../../components/appointment-form";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { WhatsAppIcon } from "../../components/whatsapp-icon";
import { getWhatsAppLink } from "../../lib/shop-settings";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Request a fitting or consultation appointment with Atelier Haute.",
};

export default async function AppointmentPage(): Promise<React.ReactElement> {
  const whatsappLink = await getWhatsAppLink("Hello Atelier Haute, I'd like to book a fitting appointment.");

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <header className="mx-auto max-w-2xl text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">BOOK AN APPOINTMENT</p>
            <h1 className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl">
              Let&apos;s find a time that works.
            </h1>
            <p className="mt-7 text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              Tell us a little about what you&apos;re looking for and a preferred time. We&apos;ll confirm the
              details with you personally.
            </p>
          </header>

          <div className="mt-20 grid grid-cols-1 items-start gap-10 md:mt-28 lg:grid-cols-12 lg:gap-8">
            <section
              aria-labelledby="appointment-form-heading"
              className="lg:col-span-7 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: "90ms" }}
            >
              <h2 id="appointment-form-heading" className="sr-only">
                Request an appointment
              </h2>
              <AppointmentForm />
            </section>

            <aside
              className="space-y-8 lg:col-span-5 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: "150ms" }}
            >
              {whatsappLink ? (
                <div className="rounded-2xl bg-[#e8ebea] p-8">
                  <h3 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">
                    Prefer to talk it through?
                  </h3>
                  <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">
                    Skip the form and message us directly on WhatsApp, and we can sort a time together in the
                    conversation.
                  </p>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-[var(--everglade)] bg-white px-6 py-3.5 text-sm font-medium tracking-[0.1em] text-[var(--everglade)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--copper)] hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
                  >
                    <WhatsAppIcon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    MESSAGE VIA WHATSAPP
                  </a>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[var(--outline)] p-8">
                <h3 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">What happens next</h3>
                <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">
                  This form sends a request, not a confirmed booking. We don&apos;t yet run a live calendar, so a
                  member of the house will get back to you to confirm the time, or suggest another that works.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
