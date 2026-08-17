import Link from "next/link";
import { getShopName } from "../lib/shop-settings";
import { MobileMenu } from "./mobile-menu";

const navigationItems = [
  { href: "/about", label: "Heritage" },
  { href: "/catalogue", label: "Catalogue" },
  // Added 2026-08-18. With no pieces in the catalogue, commissioning IS the
  // product: it is the only way a customer can say "make me this". It was
  // reachable from one link on /catalogue and nowhere else - not the nav, not
  // the footer - and the "Customize this piece" buttons that used to point at
  // it lived on garment pages that no longer exist.
  { href: "/custom-request", label: "Commission" },
  { href: "/saved", label: "Saved" },
  { href: "/faq", label: "FAQ" },
];

export async function SiteHeader(): Promise<React.ReactElement> {
  const shopName = await getShopName();
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--outline)] bg-[#f9f9f9]/90 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-20 max-w-[1280px] items-center justify-between gap-3 px-5 md:min-h-24 md:gap-4 md:px-16"
      >
        <Link
          href="/"
          className="font-[Fraunces] min-w-0 text-base font-medium uppercase tracking-[0.08em] text-[var(--everglade)] sm:whitespace-nowrap sm:text-lg sm:tracking-[0.12em] md:text-xl transition-colors duration-300 hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
        >
          {shopName}
        </Link>
        <div className="hidden items-center gap-9 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b-2 py-1 text-sm font-medium tracking-[0.1em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)] ${
                item.href === "/catalogue"
                  ? "border-[var(--copper)] text-[var(--copper)]"
                  : "border-transparent text-[var(--everglade)] hover:text-[var(--copper)]"
              }`}
            >
              {item.label.toUpperCase()}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/appointment"
            className="flex min-h-11 items-center rounded-xl bg-[var(--everglade)] px-4 py-2.5 text-sm font-medium tracking-[0.08em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_12px_28px_rgb(200_118_58_/_22%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)] md:px-6 md:py-3"
          >
            <span className="sm:hidden">BOOK</span>
            <span className="hidden sm:inline">BOOK A CONSULTATION</span>
          </Link>

          <MobileMenu items={navigationItems} />
        </div>
      </nav>
    </header>
  );
}
