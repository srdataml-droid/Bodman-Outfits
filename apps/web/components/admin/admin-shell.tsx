"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { adminApi } from "../../lib/admin-api";
import { ADMIN_FONT, Button } from "./admin-ui";

const NAV = [
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/custom-requests", label: "Custom requests" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/shop-settings", label: "Shop settings" },
  { href: "/admin/account", label: "Account" },
];

/**
 * The authenticated shell.
 *
 * Session handling lives here rather than in each screen so there is exactly
 * one place that decides "the session is gone, go to login". Screens only
 * have to report a 401 upwards; see `useAdminSession` below.
 *
 * The login page renders outside this shell entirely (it is excluded by
 * pathname) because wrapping it would create a redirect loop: the shell
 * checks the session, fails, and sends the user to the page it is currently
 * rendering.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await adminApi.me();
      if (cancelled) return;
      if (result.ok) {
        setEmail(result.data.email);
      } else if (result.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoginPage, pathname, router]);

  if (isLoginPage) return <>{children}</>;

  // Render nothing until the session check resolves. Showing the shell first
  // would flash an admin layout at someone who is about to be bounced to
  // login, which reads as though they had access for a moment.
  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ fontFamily: ADMIN_FONT }}>
        <p className="text-sm text-[var(--muted-ink)]">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f4]" style={{ fontFamily: ADMIN_FONT }}>
      <header className="border-b border-[rgb(27_62_45_/_14%)] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <Link
            href="/admin/appointments"
            className="font-[Fraunces] text-lg font-medium tracking-[0.02em] text-[var(--everglade)]"
          >
            Atelier Haute
            <span className="ml-2 align-middle text-xs font-normal uppercase tracking-[0.14em] text-[var(--copper)]">
              Admin
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 ${
                    active
                      ? "bg-[rgb(27_62_45_/_9%)] font-medium text-[var(--everglade)]"
                      : "text-[var(--muted-ink)] hover:bg-[rgb(27_62_45_/_5%)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {email ? <span className="text-xs text-[var(--muted-ink)]">{email}</span> : null}
            <Button
              variant="secondary"
              onClick={() => {
                void (async () => {
                  await adminApi.logout();
                  router.replace("/admin/login");
                })();
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 py-8">{children}</main>
    </div>
  );
}

/**
 * Screens call this to report a failed request. Any 401 is treated as "the
 * session ended" and routed to login rather than rendered as an error, which
 * is the difference between a clean re-login and a broken-looking screen.
 */
export function useSessionAwareError(): (status: number) => boolean {
  const router = useRouter();
  // MUST be memoised. Every screen puts this function in the dependency array
  // of the useCallback that loads its data, which is in turn a dependency of
  // the useEffect that runs it. Returning a fresh closure each render made
  // that effect re-run on every render, and since loading data sets state,
  // each run triggered another render: an unbounded fetch loop that exhausted
  // the API's rate limit within seconds. `router` is stable in the App
  // Router, so this closure is created once.
  return useCallback(
    (status: number) => {
      if (status === 401) {
        router.replace("/admin/login");
        return true;
      }
      return false;
    },
    [router],
  );
}
