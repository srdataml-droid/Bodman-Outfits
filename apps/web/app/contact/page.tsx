import type { Metadata } from "next";
import { StaggerText } from "../../components/stagger-text";
import { EnquiryForm } from "../../components/enquiry-form";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { WhatsAppIcon } from "../../components/whatsapp-icon";
import { getShopSettings, getWhatsAppLink } from "../../lib/shop-settings";

export const metadata: Metadata = {
  title: "Get in Touch",
  description: "Start a conversation with Bodman Outfits. Send an enquiry or reach us directly on WhatsApp.",
};

export default async function ContactPage(): Promise<React.ReactElement> {
  const [whatsappLink, settings] = await Promise.all([
    getWhatsAppLink("Hello Bodman Outfits, I'd like to know more about your bespoke tailoring."),
    getShopSettings(),
  ]);

  /*
   * Studio details come from ShopSettings and are Admin-editable, so every
   * one of them can legitimately be empty. Each is trimmed and then rendered
   * only if it survives: an empty column must produce no line at all, never
   * a stranded label, a blank value, or an invented one. If the whole set is
   * empty (or the API is unreachable, in which case `settings` is null) the
   * card falls back to prose instead of rendering an empty shell.
   */
  const address = settings?.address?.trim() ?? "";
  const phone = settings?.phone?.trim() ?? "";
  const email = settings?.email?.trim() ?? "";

  const hours = (
    [
      ["Monday – Friday", settings?.hoursWeekday],
      ["Saturday", settings?.hoursSaturday],
      ["Sunday", settings?.hoursSunday],
    ] as const
  ).flatMap(([label, value]) => {
    const trimmed = value?.trim();
    return trimmed ? [{ label, value: trimmed }] : [];
  });

  const hasStudioDetails = Boolean(address || phone || email || hours.length);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <header className="mx-auto max-w-2xl text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">GET IN TOUCH</p>
            <StaggerText
              as="h1"
              text="Every garment starts with a conversation."
              className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl"
            />
            <p className="mt-7 text-lg leading-8 text-[var(--muted-ink)] md:text-[22px] md:leading-9">
              Whether you&apos;re ready to begin a bespoke commission or simply have a question, we&apos;d love to hear from you.
            </p>
          </header>

          <div className="mt-20 grid grid-cols-1 items-start gap-10 md:mt-28 lg:grid-cols-12 lg:gap-8">
            <section
              aria-labelledby="enquiry-form-heading"
              className="lg:col-span-7 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: "90ms" }}
            >
              <h2 id="enquiry-form-heading" className="sr-only">
                Send an enquiry
              </h2>
              <EnquiryForm />
            </section>

            <aside
              className="space-y-8 lg:col-span-5 animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: "150ms" }}
            >
              {whatsappLink ? (
                <div className="rounded-2xl bg-[#e8ebea] p-8">
                  <h3 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">Instant Connection</h3>
                  <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">
                    For the fastest response on fittings, fabric, and timelines, message us directly.
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
                <h3 className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">Visit the Studio</h3>
                {hasStudioDetails ? (
                  <div className="mt-6 space-y-7">
                    {address ? (
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--copper)]">Address</h4>
                        <p className="mt-2 text-base leading-7 text-[var(--muted-ink)]">{address}</p>
                      </div>
                    ) : null}

                    {hours.length ? (
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--copper)]">
                          Opening hours
                        </h4>
                        <dl className="mt-2 space-y-1">
                          {hours.map((entry) => (
                            <div
                              key={entry.label}
                              className="flex items-baseline justify-between gap-5 text-base leading-7 text-[var(--muted-ink)]"
                            >
                              <dt>{entry.label}</dt>
                              <dd className="text-right">{entry.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ) : null}

                    {phone || email ? (
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--copper)]">Direct</h4>
                        <div className="mt-1 flex flex-col items-start">
                          {phone ? (
                            <a
                              href={`tel:${phone.replace(/\s/g, "")}`}
                              className="inline-flex min-h-11 items-center text-base leading-7 text-[var(--muted-ink)] transition-colors duration-200 ease-out hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
                            >
                              {phone}
                            </a>
                          ) : null}
                          {email ? (
                            <a
                              href={`mailto:${email}`}
                              className="inline-flex min-h-11 items-center break-all text-base leading-7 text-[var(--muted-ink)] transition-colors duration-200 ease-out hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
                            >
                              {email}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">
                    Reach us on WhatsApp above and we&apos;ll help directly and personally.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
