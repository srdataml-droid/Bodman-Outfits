"use client";

import type { ReactNode } from "react";

/**
 * Shared primitives for the admin dashboard.
 *
 * Design intent: this is a tool, not the shop window. It uses the same
 * palette and typefaces as the public site so it reads as the same product,
 * but none of its pacing. No scroll reveals, no hover crossfades, no
 * decorative motion. Transitions are limited to 150ms colour changes on
 * interactive elements, which is feedback rather than atmosphere.
 *
 * Fraunces is used only for page titles. Body text, tables and form fields
 * all use the system UI stack rather than Spectral: a serif set at 14px in a
 * dense table is markedly harder to scan, and scanning is the whole job here.
 */

export const ADMIN_FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

export function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-[Fraunces] text-3xl font-medium tracking-[-0.02em] text-[var(--everglade)]">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-ink)]" style={{ fontFamily: ADMIN_FONT }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[rgb(27_62_45_/_14%)] bg-white ${className}`}
      style={{ fontFamily: ADMIN_FONT }}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  title?: string;
}) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--copper)] disabled:pointer-events-none disabled:opacity-50";
  const styles = {
    primary: "bg-[var(--everglade)] text-white hover:bg-[var(--everglade-dark)]",
    secondary:
      "border border-[rgb(27_62_45_/_22%)] bg-white text-[var(--everglade)] hover:border-[var(--everglade)]",
    danger: "border border-[rgb(180_40_40_/_35%)] bg-white text-[#a12b2b] hover:bg-[rgb(180_40_40_/_6%)]",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${styles}`}
      style={{ fontFamily: ADMIN_FONT }}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5" style={{ fontFamily: ADMIN_FONT }}>
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted-ink)]">
        {label}
      </span>
      {children}
      {hint ? <span className="text-xs leading-5 text-[rgb(65_72_67_/_70%)]">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-lg border border-[rgb(27_62_45_/_20%)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] transition-colors duration-150 placeholder:text-[rgb(65_72_67_/_40%)] focus:border-[var(--copper)] focus:outline-none";

/**
 * Status pill.
 *
 * Colour alone never carries the meaning: the label is always present. That
 * matters for colour-blind users and it matters at a glance in a long list,
 * where "confirmed" and "declined" would otherwise be two similar dots.
 */
export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: "border-[rgb(200_118_58_/_40%)] bg-[rgb(200_118_58_/_10%)] text-[#8a4d1d]",
    unread: "border-[rgb(200_118_58_/_40%)] bg-[rgb(200_118_58_/_10%)] text-[#8a4d1d]",
    confirmed: "border-[rgb(27_62_45_/_30%)] bg-[rgb(27_62_45_/_8%)] text-[var(--everglade)]",
    replied: "border-[rgb(27_62_45_/_30%)] bg-[rgb(27_62_45_/_8%)] text-[var(--everglade)]",
    declined: "border-[rgb(120_120_120_/_35%)] bg-[rgb(120_120_120_/_8%)] text-[#5a5a5a]",
    pending_review: "border-[rgb(200_118_58_/_40%)] bg-[rgb(200_118_58_/_10%)] text-[#8a4d1d]",
    accepted: "border-[rgb(27_62_45_/_30%)] bg-[rgb(27_62_45_/_8%)] text-[var(--everglade)]",
    draft: "border-[rgb(120_120_120_/_35%)] bg-[rgb(120_120_120_/_8%)] text-[#5a5a5a]",
    in_production: "border-[rgb(200_118_58_/_40%)] bg-[rgb(200_118_58_/_10%)] text-[#8a4d1d]",
    ready: "border-[rgb(27_62_45_/_30%)] bg-[rgb(27_62_45_/_8%)] text-[var(--everglade)]",
    completed: "border-[rgb(27_62_45_/_30%)] bg-[rgb(27_62_45_/_8%)] text-[var(--everglade)]",
    cancelled: "border-[rgb(120_120_120_/_35%)] bg-[rgb(120_120_120_/_8%)] text-[#5a5a5a]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${tone[status] ?? "border-[rgb(27_62_45_/_20%)] text-[var(--muted-ink)]"}`}
      style={{ fontFamily: ADMIN_FONT }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/** Consistent empty / loading / error states so no screen renders blank. */
export function Notice({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) {
  return (
    <p
      className={`px-4 py-8 text-center text-sm ${tone === "error" ? "text-[#a12b2b]" : "text-[var(--muted-ink)]"}`}
      style={{ fontFamily: ADMIN_FONT }}
    >
      {children}
    </p>
  );
}
