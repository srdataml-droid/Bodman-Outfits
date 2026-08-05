import type { Metadata } from "next";
import { SavedList } from "../../components/saved-list";
import { getGarments } from "../../lib/garments-data";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { StaggerText } from "../../components/stagger-text";

export const metadata: Metadata = {
  title: "Saved",
  description: "The garments you have saved on this device at Bodman Outfits.",
};

export default async function SavedPage(): Promise<React.ReactElement> {
  const garments = await getGarments();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1280px] px-5 pb-28 pt-16 md:px-16 md:pb-32 md:pt-28">
          <header className="max-w-2xl animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
            <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">YOUR LIST</p>
            <StaggerText
              as="h1"
              text="The pieces you kept."
              className="mt-5 font-[Fraunces] text-5xl font-medium leading-[1.04] tracking-[-0.03em] text-[var(--everglade)] md:text-7xl"
            />
          </header>

          <SavedList garments={garments} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
