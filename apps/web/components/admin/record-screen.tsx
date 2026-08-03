"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSessionAwareError } from "./admin-shell";
import { ADMIN_FONT, Button, Notice, Panel, PageTitle, StatusPill } from "./admin-ui";
import type { AdminResult } from "../../lib/admin-api";

/**
 * Shared list + detail screen for appointments and enquiries.
 *
 * Both are the same shape of job: scan a list newest-first, open one, read
 * the details, change its status. Building them twice would have meant two
 * places to fix every future bug in selection, refresh-after-mutation or
 * 401 handling, so the differences (columns, fields, statuses) are passed in
 * and the behaviour is shared.
 *
 * Layout is a two-pane list/detail rather than a modal: an admin working
 * through a day's requests should be able to move down the list without a
 * dialog opening and closing on every row.
 */
export interface RecordColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  /** Hidden on narrow viewports to keep the table readable on a phone. */
  secondary?: boolean;
}

export interface RecordField<T> {
  label: string;
  render: (row: T) => ReactNode;
}

interface RecordScreenProps<T extends { id: string; status: string; createdAt: string }> {
  title: string;
  description: string;
  emptyMessage: string;
  columns: Array<RecordColumn<T>>;
  fields: Array<RecordField<T>>;
  statuses: readonly string[];
  load: () => Promise<AdminResult<T[]>>;
  setStatus: (id: string, status: string) => Promise<AdminResult<T>>;
}

export function RecordScreen<T extends { id: string; status: string; createdAt: string }>({
  title,
  description,
  emptyMessage,
  columns,
  fields,
  statuses,
  load,
  setStatus,
}: RecordScreenProps<T>): React.ReactElement {
  const handleAuthError = useSessionAwareError();
  const [rows, setRows] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const result = await load();
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      setRows([]);
      return;
    }
    setError(null);
    setRows(result.data);
  }, [load, handleAuthError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected = rows?.find((r) => r.id === selectedId) ?? null;

  async function changeStatus(next: string): Promise<void> {
    if (!selected) return;
    setSaving(true);
    const result = await setStatus(selected.id, next);
    setSaving(false);
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      return;
    }
    // Re-read from the server rather than patching local state, so what is
    // displayed is what was actually persisted.
    await refresh();
  }

  return (
    <>
      <PageTitle title={title} description={description} />

      {error ? (
        <Panel className="mb-4">
          <Notice tone="error">{error}</Notice>
        </Panel>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <Panel className="overflow-hidden">
          {rows === null ? (
            <Notice>Loading…</Notice>
          ) : rows.length === 0 ? (
            <Notice>{emptyMessage}</Notice>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm" style={{ fontFamily: ADMIN_FONT }}>
                <thead>
                  <tr className="border-b border-[rgb(27_62_45_/_12%)] text-left">
                    {columns.map((c) => (
                      <th
                        key={c.header}
                        className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)] ${c.secondary ? "hidden md:table-cell" : ""}`}
                      >
                        {c.header}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const active = row.id === selectedId;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(row.id);
                          }
                        }}
                        aria-selected={active}
                        className={`cursor-pointer border-b border-[rgb(27_62_45_/_8%)] transition-colors duration-150 last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--copper)] ${
                          active ? "bg-[rgb(27_62_45_/_7%)]" : "hover:bg-[rgb(27_62_45_/_4%)]"
                        }`}
                      >
                        {columns.map((c) => (
                          <td
                            key={c.header}
                            className={`px-4 py-3 align-top text-[var(--ink)] ${c.secondary ? "hidden md:table-cell" : ""}`}
                          >
                            {c.render(row)}
                          </td>
                        ))}
                        <td className="px-4 py-3 align-top">
                          <StatusPill status={row.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          {!selected ? (
            <Notice>
              {rows && rows.length > 0 ? "Select a row to see the full record." : "Nothing to show yet."}
            </Notice>
          ) : (
            <div style={{ fontFamily: ADMIN_FONT }}>
              <dl className="flex flex-col gap-3.5">
                {fields.map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">
                      {f.label}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--ink)]">
                      {f.render(selected)}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 border-t border-[rgb(27_62_45_/_12%)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted-ink)]">
                  Status
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <Button
                      key={s}
                      variant={s === selected.status ? "primary" : "secondary"}
                      disabled={saving || s === selected.status}
                      title={s === selected.status ? "Current status" : `Mark as ${s}`}
                      onClick={() => {
                        void changeStatus(s);
                      }}
                    >
                      <span className="capitalize">{s}</span>
                    </Button>
                  ))}
                </div>
                <p className="mt-2.5 text-xs leading-5 text-[rgb(65_72_67_/_65%)]">
                  {saving ? "Saving…" : "Changes save immediately."}
                </p>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
