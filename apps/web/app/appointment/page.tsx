import type { Metadata } from "next";
import { StaggerText } from "../../components/stagger-text";
import { AppointmentForm } from "../../components/appointment-form";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { WhatsAppIcon } from "../../components/whatsapp-icon";
import { getCategory } from "../../lib/garments";
import { getGarment } from "../../lib/garments-data";
import { getWhatsAppLink } from "../../lib/shop-settings";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Request a fitting or consultation appointment with Bodman Outfits.",
};

/*
 * Prefill arrives as query parameters from the catalogue, a garment price, or
 * the saved list: /appointment?category=suits&garment=navy-two-piece
 *
 * Resolved HERE, on the server, rather than with useSearchParams in the form.
 * The form stays a plain client component with no Suspense boundary to get
 * wrong, and an unknown or hand-edited slug resolves to nothing rather than
 * echoing a stranger's text back into the form.
 */
interface AppointmentPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AppointmentPage({
  searchParams,
}: AppointmentPageProps): Promise<React.ReactElement> {
  const [whatsappLink, params] = await Promise.all([
    getWhatsAppLink("Hello Bodman Outfits, I'd like to book a fitting appointment."),
    searchParams,
  ]);

  const categorySlug = firstValue(params.category);
  const garmentSlug = firstValue(params.garment);

  // Validated against the catalogue, never trusted as given.
  const category = categorySlug ? getCategory(categorySlug) : undefined;
  const garment =
    categorySlug && garmentSlug ? await getGarment(categorySlug, garmentSlug) : null;

  const initialCategory = category?.slug;
  const interestedIn = garment?.name ?? category?.name;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <header className="mx-auto max-w-2xl text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">BOOK AN APPOINTMENT</p>
            <StaggerText
              as="h1"
              text="Let’s find a time that works."
              className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl"
            />
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
              <AppointmentForm initialCategory={initialCategory} interestedIn={interestedIn} />
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
