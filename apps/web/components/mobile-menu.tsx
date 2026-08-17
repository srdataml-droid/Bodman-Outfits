"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface NavigationItem {
  href: string;
  label: string;
}

/**
 * The navigation on a phone, where the desktop row is hidden.
 *
 * Before this existed, `HERITAGE`, `CATALOGUE`, `SAVED` and `FAQ` were inside a
 * `hidden md:flex` container with nothing standing in for them below 768px, so
 * a phone could reach exactly two destinations: the logo and the booking page.
 * Everything else on the site was unreachable without knowing the URL.
 *
 * Built on `<details>` rather than React state, for the reason already written
 * down in `garment-figure.tsx`: state does not exist before hydration, and a
 * menu that cannot open until JavaScript arrives is a menu that does not open
 * on a slow connection. `<details>` toggles natively - with no JavaScript at
 * all, on the very first paint, and with keyboard and screen-reader support
 * the browser supplies for free.
 *
 * The one thing JavaScript adds is closing it again. Next.js navigates on the
 * client and this header lives in the layout, so it survives the navigation
 * and would otherwise stay open over the page the reader just asked for. That
 * is an enhancement on top of something that already works, not a requirement
 * for it to work at all.
 */
export function MobileMenu({
  items,
}: {
  items: readonly NavigationItem[];
}): React.ReactElement {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <details ref={menu} className="group relative md:hidden">
      <summary
        // `list-none` and the WebKit rule remove the default disclosure
        // triangle; min-h/min-w keep the tap target at 44px, which is the
        // smallest a fingertip reliably hits.
        className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-xl text-[var(--everglade)] transition-colors duration-300 marker:content-none hover:text-[var(--copper)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)] [&::-webkit-details-marker]:hidden"
        aria-label="Menu"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {/* Three bars closing into a cross, so the control says which state
              it is in rather than only what it does. */}
          <path
            d="M4 7h16"
            className="origin-center transition-transform duration-300 group-open:translate-y-[5px] group-open:rotate-45"
          />
          <path
            d="M4 12h16"
            className="transition-opacity duration-200 group-open:opacity-0"
          />
          <path
            d="M4 17h16"
            className="origin-center transition-transform duration-300 group-open:-translate-y-[5px] group-open:-rotate-45"
          />
        </svg>
      </summary>

      <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 min-w-52 rounded-2xl border border-[var(--outline)] bg-[#f9f9f9] p-2 shadow-[0_18px_40px_rgb(20_49_37_/_14%)]">
        <ul className="flex flex-col">
          {items.map((item) => {
            const current = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-xl px-4 text-sm font-medium tracking-[0.1em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--copper)] ${
                    current
                      ? "text-[var(--copper)]"
                      : "text-[var(--everglade)] hover:bg-[rgb(210_180_140_/_18%)] hover:text-[var(--copper)]"
                  }`}
                >
                  {item.label.toUpperCase()}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
