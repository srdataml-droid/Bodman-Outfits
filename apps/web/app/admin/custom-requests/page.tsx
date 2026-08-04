"use client";

import { useCallback, useEffect, useState } from "react";
import { useFocusParam } from "../../../components/admin/use-focus-param";
import { adminApi, CUSTOM_REQUEST_STATUSES, type CustomRequest, type CustomRequestStatus } from "../../../lib/admin-api";
import { useSessionAwareError } from "../../../components/admin/admin-shell";
import { formatDateTime } from "../../../components/admin/record-screen";
import { ADMIN_FONT, Button, Field, inputClass, Notice, PageTitle, Panel, StatusPill } from "../../../components/admin/admin-ui";

/**
 * Not built on the shared RecordScreen, unlike appointments and enquiries.
 *
 * This is a review queue rather than a status list: it is ordered oldest
 * first, declining requires a typed reason before the action can be taken,
 * and an accepted request can be turned into an order. Bending RecordScreen
 * around those three differences would have made it worse for the two
 * screens it already serves.
 */
export default function CustomRequestsPage(): React.ReactElement {
  const handleAuthError = useSessionAwareError();
  const [rows, setRows] = useState<CustomRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [orderMsg, setOrderMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await adminApi.customRequests();
    if (!r.ok) {
      if (handleAuthError(r.status)) return;
      setError(r.message);
      setRows([]);
      return;
    }
    setError(null);
    setRows(r.data);
  }, [handleAuthError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // `?focus=<id>` deep link from the submission notification emails.
  const { rowRefs, focusMissing } = useFocusParam(rows, setSelectedId);

  const selected = rows?.find((r) => r.id === selectedId) ?? null;

  async function review(status: CustomRequestStatus): Promise<void> {
    if (!selected) return;
    if (status === "declined" && declineReason.trim() === "") {
      setShowDecline(true);
      return;
    }
    setBusy(true);
    const r = await adminApi.reviewCustomRequest(selected.id, status, status === "declined" ? declineReason : undefined);
    setBusy(false);
    if (!r.ok) {
      if (handleAuthError(r.status)) return;
      setError(r.message);
      return;
    }
    setShowDecline(false);
    setDeclineReason("");
    await refresh();
  }

  async function createOrder(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    setOrderMsg(null);
    const r = await adminApi.createOrder({
      source: "customRequest",
      sourceId: selected.id,
      customerName: selected.name,
      customerPhone: selected.phone ?? selected.email,
      notes: `From custom request: ${selected.description.slice(0, 200)}`,
    });
    setBusy(false);
    if (!r.ok) {
      if (handleAuthError(r.status)) return;
      setOrderMsg(r.message);
      return;
    }
    setOrderMsg(`Order created as a draft. Open the Orders screen to add pricing and move it on.`);
  }

  return (
    <>
      <PageTitle
        title="Custom requests"
        description="Design ideas customers have sent in, oldest first so the queue is worked from the front. Accepting or declining records your decision; nothing is sent to the customer automatically."
      />

      {error ? <Panel className="mb-4"><Notice tone="error">{error}</Notice></Panel> : null}

      {focusMissing ? (
        <Panel className="mb-4">
          <Notice>The record from that link is not in this list. It may be older than the most recent 200.</Notice>
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <Panel className="overflow-hidden">
          {rows === null ? (
            <Notice>Loading…</Notice>
          ) : rows.length === 0 ? (
            <Notice>No custom requests yet.</Notice>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ fontFamily: ADMIN_FONT }}>
                <thead>
                  <tr className="border-b border-[rgb(27_62_45_/_12%)] text-left">
                    {["Name", "Idea", "Received", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      ref={(node) => {
                        if (node) rowRefs.current.set(row.id, node);
                        else rowRefs.current.delete(row.id);
                      }}
                      onClick={() => { setSelectedId(row.id); setShowDecline(false); setOrderMsg(null); }}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(row.id); } }}
                      className={`cursor-pointer border-b border-[rgb(27_62_45_/_8%)] transition-colors duration-150 last:border-b-0 ${row.id === selectedId ? "bg-[rgb(27_62_45_/_7%)]" : "hover:bg-[rgb(27_62_45_/_4%)]"}`}
                    >
                      <td className="px-4 py-3 align-top font-medium">{row.name}</td>
                      <td className="px-4 py-3 align-top text-[var(--muted-ink)]">{row.description.slice(0, 60)}{row.description.length > 60 ? "…" : ""}</td>
                      <td className="px-4 py-3 align-top text-[var(--muted-ink)]">{formatDateTime(row.createdAt)}</td>
                      <td className="px-4 py-3 align-top"><StatusPill status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          {!selected ? (
            <Notice>{rows && rows.length > 0 ? "Select a request to review it." : "Nothing to show yet."}</Notice>
          ) : (
            <div style={{ fontFamily: ADMIN_FONT }}>
              <dl className="flex flex-col gap-3.5">
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Name</dt><dd className="mt-1 text-sm">{selected.name}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Email</dt><dd className="mt-1 text-sm"><a className="underline" href={`mailto:${selected.email}`}>{selected.email}</a></dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Phone</dt><dd className="mt-1 text-sm">{selected.phone ? <a className="underline" href={`tel:${selected.phone}`}>{selected.phone}</a> : "Not provided"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Closest category</dt><dd className="mt-1 text-sm capitalize">{selected.category ?? "Not sure"}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">The idea</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{selected.description}</dd></div>
                {selected.declineReason ? (
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Decline reason</dt><dd className="mt-1 text-sm leading-6">{selected.declineReason}</dd></div>
                ) : null}
                <div><dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Received</dt><dd className="mt-1 text-sm">{formatDateTime(selected.createdAt)}</dd></div>
              </dl>

              <div className="mt-6 border-t border-[rgb(27_62_45_/_12%)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Decision</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {CUSTOM_REQUEST_STATUSES.map((s) => (
                    <Button
                      key={s}
                      variant={s === selected.status ? "primary" : s === "declined" ? "danger" : "secondary"}
                      disabled={busy || s === selected.status}
                      onClick={() => { if (s === "declined") { setShowDecline(true); } else { void review(s); } }}
                    >
                      <span className="capitalize">{s.replace(/_/g, " ")}</span>
                    </Button>
                  ))}
                </div>

                {showDecline ? (
                  <div className="mt-4">
                    <Field label="Reason for declining" hint="Required. This is recorded against the request so you can tell the customer why.">
                      <textarea rows={3} className={`${inputClass} resize-y`} value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
                    </Field>
                    <div className="mt-2.5 flex gap-2">
                      <Button variant="danger" disabled={busy || declineReason.trim() === ""} onClick={() => void review("declined")}>Confirm decline</Button>
                      <Button variant="secondary" disabled={busy} onClick={() => { setShowDecline(false); setDeclineReason(""); }}>Cancel</Button>
                    </div>
                  </div>
                ) : null}

                {selected.status === "accepted" ? (
                  <div className="mt-5 border-t border-[rgb(27_62_45_/_12%)] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">Next step</p>
                    <div className="mt-2.5">
                      <Button disabled={busy} onClick={() => void createOrder()}>Create a draft order</Button>
                    </div>
                    {orderMsg ? <p className="mt-2.5 text-xs leading-5 text-[var(--everglade)]">{orderMsg}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
