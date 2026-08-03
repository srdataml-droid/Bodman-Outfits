"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type Faq } from "../../../lib/admin-api";
import { useSessionAwareError } from "../../../components/admin/admin-shell";
import { Button, Field, inputClass, Notice, PageTitle, Panel } from "../../../components/admin/admin-ui";

const BLANK = { question: "", answer: "", category: "", sortOrder: 0 };

export default function FaqsPage(): React.ReactElement {
  const handleAuthError = useSessionAwareError();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Faq, "id">>(BLANK);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await adminApi.faqs();
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      setFaqs([]);
      return;
    }
    setError(null);
    setFaqs(result.data);
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate(): void {
    setEditingId("new");
    // Default to the end of the list so a new entry never silently displaces
    // an existing one.
    setDraft({ ...BLANK, sortOrder: (faqs?.reduce((m, f) => Math.max(m, f.sortOrder), 0) ?? 0) + 1 });
  }

  function startEdit(faq: Faq): void {
    setEditingId(faq.id);
    setDraft({
      question: faq.question,
      answer: faq.answer,
      category: faq.category ?? "",
      sortOrder: faq.sortOrder,
    });
  }

  async function handleResult(result: Awaited<ReturnType<typeof adminApi.faqs>> | { ok: boolean; status?: number; message?: string }): Promise<boolean> {
    if (!result.ok) {
      const r = result as { status: number; message: string };
      if (handleAuthError(r.status)) return false;
      setError(r.message);
      return false;
    }
    setError(null);
    await load();
    return true;
  }

  async function save(): Promise<void> {
    setBusy(true);
    const payload = { ...draft, category: draft.category?.trim() ? draft.category : null };
    const result =
      editingId === "new"
        ? await adminApi.createFaq(payload)
        : await adminApi.updateFaq(editingId!, payload);
    setBusy(false);
    if (await handleResult(result)) setEditingId(null);
  }

  async function remove(id: string): Promise<void> {
    setBusy(true);
    const result = await adminApi.deleteFaq(id);
    setBusy(false);
    setConfirmingDelete(null);
    await handleResult(result);
  }

  // Reordering swaps sortOrder with the neighbour rather than renumbering the
  // whole list, so a move is two writes regardless of list length and cannot
  // leave the list half-renumbered if the second write fails.
  async function move(faq: Faq, direction: -1 | 1): Promise<void> {
    if (!faqs) return;
    const ordered = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((f) => f.id === faq.id);
    const neighbour = ordered[index + direction];
    if (!neighbour) return;
    setBusy(true);
    const a = await adminApi.updateFaq(faq.id, { sortOrder: neighbour.sortOrder });
    const b = await adminApi.updateFaq(neighbour.id, { sortOrder: faq.sortOrder });
    setBusy(false);
    if (!a.ok) {
      await handleResult(a);
      return;
    }
    await handleResult(b);
  }

  const ordered = faqs ? [...faqs].sort((a, b) => a.sortOrder - b.sortOrder) : null;

  return (
    <>
      <PageTitle
        title="FAQs"
        description="These publish straight to the public FAQ page. Keep answers honest about what is still unconfirmed rather than filling gaps with plausible policy."
      />

      {error ? (
        <Panel className="mb-4">
          <Notice tone="error">{error}</Notice>
        </Panel>
      ) : null}

      <div className="mb-4">
        <Button onClick={startCreate} disabled={editingId === "new"}>
          Add FAQ
        </Button>
      </div>

      {editingId !== null ? (
        <Panel className="mb-5 p-5">
          <h2 className="font-[Fraunces] text-lg font-medium text-[var(--everglade)]">
            {editingId === "new" ? "New FAQ" : "Edit FAQ"}
          </h2>
          <div className="mt-4 grid gap-4">
            <Field label="Question">
              <input
                className={inputClass}
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              />
            </Field>
            <Field label="Answer">
              <textarea
                rows={5}
                className={`${inputClass} resize-y`}
                value={draft.answer}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category" hint="Optional. Groups the entry on the public page.">
                <input
                  className={inputClass}
                  value={draft.category ?? ""}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                />
              </Field>
              <Field label="Sort order" hint="Lower numbers appear first.">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.sortOrder}
                  onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
                />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => void save()} disabled={busy || !draft.question.trim() || !draft.answer.trim()}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="secondary" onClick={() => setEditingId(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </Panel>
      ) : null}

      <Panel>
        {ordered === null ? (
          <Notice>Loading…</Notice>
        ) : ordered.length === 0 ? (
          <Notice>No FAQs yet.</Notice>
        ) : (
          <ul className="divide-y divide-[rgb(27_62_45_/_10%)]">
            {ordered.map((faq, i) => (
              <li key={faq.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-[0.06em] text-[var(--copper)]">
                      {faq.sortOrder}. {faq.category ?? "Uncategorised"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--ink)]">{faq.question}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-ink)]">{faq.answer}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Button variant="secondary" onClick={() => void move(faq, -1)} disabled={busy || i === 0} title="Move up">
                      ↑
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void move(faq, 1)}
                      disabled={busy || i === ordered.length - 1}
                      title="Move down"
                    >
                      ↓
                    </Button>
                    <Button variant="secondary" onClick={() => startEdit(faq)} disabled={busy}>
                      Edit
                    </Button>
                    {confirmingDelete === faq.id ? (
                      <>
                        <Button variant="danger" onClick={() => void remove(faq.id)} disabled={busy}>
                          Confirm delete
                        </Button>
                        <Button variant="secondary" onClick={() => setConfirmingDelete(null)} disabled={busy}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      // Two-step rather than a browser confirm(): a native
                      // dialog blocks the page and is easy to dismiss by
                      // reflex on a destructive action.
                      <Button variant="danger" onClick={() => setConfirmingDelete(faq.id)} disabled={busy}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
