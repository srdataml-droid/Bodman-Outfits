import Link from "next/link";
import { getShopSettings, SHOP_NAME_FALLBACK } from "../lib/shop-settings";

export async function SiteFooter(): Promise<React.ReactElement> {
  const settings = await getShopSettings();
  const shopName = settings?.shopName?.trim() || SHOP_NAME_FALLBACK;
  // Tagline is also Admin-editable. Omitted rather than substituted if the
  // API is unreachable, since an invented tagline is worse than none.
  const tagline = settings?.tagline?.trim() ?? "";
  return (
    <footer className="border-t border-[var(--outline)] bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-16 md:grid-cols-[1.1fr_auto] md:items-end md:px-16 md:py-24">
        <div>
          <p className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">
            {shopName}
          </p>
          {tagline ? (
            <p className="mt-3 max-w-xs text-base leading-7 text-[var(--muted-ink)]">{tagline}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm leading-6 text-[var(--muted-ink)]">
          <Link className="inline-flex min-h-11 min-w-11 items-center justify-center transition-colors hover:text-[var(--copper)]" href="/contact">
            Enquiry
          </Link>
          <Link className="inline-flex min-h-11 min-w-11 items-center justify-center transition-colors hover:text-[var(--copper)]" href="/faq">
            FAQ
          </Link>
          <span className="inline-flex min-h-11 items-center">© 2026 {shopName}</span>
        </div>
      </div>
    </footer>
  );
}
