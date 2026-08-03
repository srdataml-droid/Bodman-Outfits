import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "../../components/admin/admin-shell";

// AGENTS.md requires the dashboard to be absent from public navigation and
// marked noindex. It is not linked from any public page; this adds the
// crawler half.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
