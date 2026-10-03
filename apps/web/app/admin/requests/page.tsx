"use client";

import { useCallback, useEffect, useState } from "react";
import { useSessionAwareError } from "../../../components/admin/admin-shell";
import { inputClass, Notice, PageTitle, Panel } from "../../../components/admin/admin-ui";
import { adminFetch } from "../../../lib/admin-api";

type RequestRow = {
  id: string;
  type: "commission" | "fitting";
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  category?: string;
  status: string;
  description?: string;
  preferredDate?: string;
  preferredTime?: string;
  neededBy?: string;
  notes?: string;
};

export default function RequestsPage() {
  const handleAuthError = useSessionAwareError();
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await adminFetch<RequestRow[]>("/api/requests");
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setRows([]);
      setError(result.message);
      return;
    }
    setRows(result.data);
    setError(null);
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(row: RequestRow, status: string) {
    setBusy(row.id);
    const result = await adminFetch<{ ok: true }>(
      `/api/requests/${row.type}/${row.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
    setBusy(null);

    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      return;
    }

    await load();
  }

  return (
    <>
      <PageTitle
        title="Requests"
        description="Fittings and commission enquiries from the website, newest first."
      />

      {error ? (
        <Panel className="mb-4">
          <Notice tone="error">{error}</Notice>
        </Panel>
      ) : null}

      <Panel className="overflow-hidden">
        {rows === null ? (
          <Notice>Loading…</Notice>
        ) : rows.length === 0 ? (
          <Notice>No requests yet.</Notice>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm max-md:block">
              <thead className="max-md:sr-only">
                <tr className="border-b text-left">
                  {["Type", "Customer", "Contact", "Details", "Received", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="max-md:block max-md:divide-y max-md:divide-[var(--outline)]">
                {rows.map((row) => (
                  <tr key={row.type + row.id} className="border-b align-top max-md:block max-md:px-4 max-md:py-5">
                    <td className="px-4 py-3 capitalize max-md:block max-md:px-0 max-md:py-0 max-md:text-xs max-md:font-semibold max-md:uppercase max-md:tracking-wider max-md:text-[var(--copper)]">{row.type}</td>
                    <td className="px-4 py-3 font-medium max-md:block max-md:px-0 max-md:py-1 max-md:text-base">{row.name}</td>
                    <td className="break-words px-4 py-3 max-md:block max-md:px-0 max-md:py-1">
                      <a className="underline" href={`mailto:${row.email}`}>
                        {row.email}
                      </a>
                      {row.phone ? <div>{row.phone}</div> : null}
                    </td>
                    <td className="max-w-sm break-words px-4 py-3 max-md:block max-md:px-0 max-md:py-2">
                      {row.type === "commission"
                        ? row.description || "—"
                        : `${row.preferredDate || "—"} · ${row.preferredTime || "—"}`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 max-md:block max-md:px-0 max-md:py-1 max-md:text-xs max-md:text-[var(--muted-ink)]">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 max-md:block max-md:px-0 max-md:pb-0 max-md:pt-3">
                      <select
                        disabled={busy === row.id}
                        value={row.status}
                        onChange={(event) => void changeStatus(row, event.target.value)}
                        aria-label={`Status for ${row.name}`}
                        className={`${inputClass} md:min-w-32`}
                      >
                        {(row.type === "commission"
                          ? ["pending_review", "accepted", "declined"]
                          : ["pending", "confirmed", "declined"]
                        ).map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
