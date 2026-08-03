import Link from "next/link";
import { getShopName } from "../lib/shop-settings";

const navigationItems = [
  { href: "/about", label: "Heritage" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/faq", label: "FAQ" },
];

export async function SiteHeader(): Promise<React.ReactElement> {
  const shopName = await getShopName();
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--outline)] bg-[#f9f9f9]/90 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-20 max-w-[1280px] items-center justify-between gap-4 px-5 md:min-h-24 md:px-16"
      >
        <Link
          href="/"
          className="font-[Fraunces] text-xl font-medium uppercase tracking-[0.12em] text-[var(--everglade)] transition-colors duration-300 hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
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
        <Link
          href="/appointment"
          className="flex min-h-11 items-center rounded-xl bg-[var(--everglade)] px-4 py-2.5 text-sm font-medium tracking-[0.08em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_12px_28px_rgb(200_118_58_/_22%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)] md:px-6 md:py-3"
        >
          BOOK A CONSULTATION
        </Link>
      </nav>
    </header>
  );
}
