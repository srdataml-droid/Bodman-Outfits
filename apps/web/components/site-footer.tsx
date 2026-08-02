import Link from "next/link";

export function SiteFooter(): React.ReactElement {
  return (
    <footer className="border-t border-[var(--outline)] bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-16 md:grid-cols-[1.1fr_auto] md:items-end md:px-16 md:py-24">
        <div>
          <p className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">
            Atelier Haute
          </p>
          <p className="mt-3 max-w-xs text-base leading-7 text-[var(--muted-ink)]">
            Redefining modern sartorial heritage from the heart of Lagos.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm leading-6 text-[var(--muted-ink)]">
          <Link className="transition-colors hover:text-[var(--copper)]" href="/contact">
            Enquiry
          </Link>
          <Link className="transition-colors hover:text-[var(--copper)]" href="/faq">
            FAQ
          </Link>
          <span>© 2026 Atelier Haute</span>
        </div>
      </div>
    </footer>
  );
}
