"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, ORDER_STATUSES, type Order, type OrderStatus } from "../../../lib/admin-api";
import { useSessionAwareError } from "../../../components/admin/admin-shell";
import { formatDateTime } from "../../../components/admin/record-screen";
import { ADMIN_FONT, Button, Field, inputClass, Notice, PageTitle, Panel, StatusPill } from "../../../components/admin/admin-ui";

/**
 * Orders are created from an existing request, never from scratch here: an
 * order that is not traceable to something a customer actually asked for has
 * no provenance. Creation lives on the custom requests screen (and would sit
 * alongside appointments and enquiries when that flow is wanted there too).
 *
 * Pricing inputs are present but empty, and stay empty until someone types a
 * number. No currency is pre-filled and no deposit is calculated, because no
 * pricing or deposit policy has been confirmed.
 */
export default function OrdersPage(): React.ReactElement {
  const handleAuthError = useSessionAwareError();
  const [rows, setRows] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ totalAmount: "", depositAmount: "", currency: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(async () => {
    const r = await adminApi.orders();
    if (!r.ok) {
      if (handleAuthError(r.status)) return;
      setError(r.message);
      setRows([]);
      return;
    }
    setError(null);
    setRows(r.data);
  }, [handleAuthError]);

  useEffect(() => { void refresh(); }, [refresh]);

  const selected = rows?.find((r) => r.id === selectedId) ?? null;

  function select(o: Order): void {
    setSelectedId(o.id);
    setSaved(false);
    setDraft({
      totalAmount: o.totalAmount ?? "",
      depositAmount: o.depositAmount ?? "",
      currency: o.currency ?? "",
      notes: o.notes ?? "",
    });
  }

  async function save(patch: Parameters<typeof adminApi.updateOrder>[1]): Promise<void> {
    if (!selected) return;
    setBusy(true);
    setSaved(false);
    const r = await adminApi.updateOrder(selected.id, patch);
    setBusy(false);
    if (!r.ok) {
      if (handleAuthError(r.status)) return;
      setError(r.message);
      return;
    }
    setError(null);
    setSaved(true);
    await refresh();
  }

  return (
    <>
      <PageTitle
        title="Orders"
        description="Created from an accepted request, then tracked through to completion. There is no customer checkout and no payment integration; anything recorded here is a note of what was agreed offline."
      />

      {error ? <Panel className="mb-4"><Notice tone="error">{error}</Notice></Panel> : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Panel className="overflow-hidden">
          {rows === null ? (
            <Notice>Loading…</Notice>
          ) : rows.length === 0 ? (
            <Notice>No orders yet. Accept a custom request to create one.</Notice>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ fontFamily: ADMIN_FONT }}>
                <thead>
                  <tr className="border-b border-[rgb(27_62_45_/_12%)] text-left">
                    {["Customer", "From", "Total", "Created", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => select(o)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(o); } }}
                      className={`cursor-pointer border-b border-[rgb(27_62_45_/_8%)] transition-colors duration-150 last:border-b-0 ${o.id === selectedId ? "bg-[rgb(27_62_45_/_7%)]" : "hover:bg-[rgb(27_62_45_/_4%)]"}`}
                    >
                      <td className="px-4 py-3 align-top font-medium">{o.customerName}</td>
                      <td className="px-4 py-3 align-top text-[var(--muted-ink)]">{o.source ? o.source.replace("customRequest", "custom request") : "—"}</td>
                      <td className="px-4 py-3 align-top text-[var(--muted-ink)]">
                        {o.totalAmount ? `${o.currency ?? ""} ${o.totalAmount}`.trim() : <span className="text-[rgb(65_72_67_/_55%)]">Not set</span>}
                      </td>
                      <td className="px-4 py-3 align-top text-[var(--muted-ink)]">{formatDateTime(o.createdAt)}</td>
                      <td className="px-4 py-3 align-top"><StatusPill status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          {!selected ? (
            <Notice>{rows && rows.length > 0 ? "Select an order to manage it." : "Nothing to show yet."}</Notice>
          ) : (
            <div style={{ fontFamily: ADMIN_FONT }}>
              <dl className="flex flex-col gap-3.5">
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Customer</dt><dd className="mt-1 text-sm">{selected.customerName}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Phone</dt><dd className="mt-1 text-sm"><a className="underline" href={`tel:${selected.customerPhone}`}>{selected.customerPhone}</a></dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Originated from</dt><dd className="mt-1 text-sm">{selected.source ? `${selected.source.replace("customRequest", "custom request")} · ${selected.sourceId?.slice(0, 12)}…` : "Source record deleted"}</dd></div>
              </dl>

              <div className="mt-6 border-t border-[rgb(27_62_45_/_12%)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Status</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => (
                    <Button key={s} variant={s === selected.status ? "primary" : s === "cancelled" ? "danger" : "secondary"} disabled={busy || s === selected.status} onClick={() => void save({ status: s as OrderStatus })}>
                      <span className="capitalize">{s.replace(/_/g, " ")}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-[rgb(27_62_45_/_12%)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Agreed amounts</p>
                <p className="mt-1.5 text-xs leading-5 text-[rgb(65_72_67_/_70%)]">
                  Optional, and blank by default. No pricing or deposit policy has been set, so nothing is
                  calculated or pre-filled here. Leave these empty until an amount is actually agreed.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label="Total"><input className={inputClass} inputMode="decimal" placeholder="e.g. 125000" value={draft.totalAmount} onChange={(e) => setDraft({ ...draft, totalAmount: e.target.value })} /></Field>
                  <Field label="Deposit"><input className={inputClass} inputMode="decimal" placeholder="e.g. 50000" value={draft.depositAmount} onChange={(e) => setDraft({ ...draft, depositAmount: e.target.value })} /></Field>
                  <Field label="Currency"><input className={inputClass} placeholder="e.g. NGN" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} /></Field>
                </div>
                <div className="mt-3">
                  <Field label="Notes"><textarea rows={3} className={`${inputClass} resize-y`} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></Field>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button disabled={busy} onClick={() => void save(draft)}>{busy ? "Saving…" : "Save details"}</Button>
                  {saved ? <span className="text-sm text-[var(--everglade)]">Saved.</span> : null}
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
