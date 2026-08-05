"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminApi,
  GARMENT_CATEGORIES,
  type Garment,
} from "../../../lib/admin-api";
import { useSessionAwareError } from "../../../components/admin/admin-shell";
import { Button, Field, inputClass, Notice, PageTitle, Panel } from "../../../components/admin/admin-ui";

type Draft = Omit<Garment, "id">;

const BLANK: Draft = {
  slug: "",
  category: "suits",
  name: "",
  detail: "",
  description: "",
  imageFlat: "",
  imageOnForm: "",
  altFlat: "",
  altOnForm: "",
  startingPrice: null,
  active: true,
  sortOrder: 0,
};

export default function GarmentsPage(): React.ReactElement {
  const handleAuthError = useSessionAwareError();
  const [garments, setGarments] = useState<Garment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await adminApi.garments();
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      return;
    }
    setGarments(result.data);
    setError(null);
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate(): void {
    setCreating(true);
    setEditingId(null);
    setDraft(BLANK);
  }

  function startEdit(garment: Garment): void {
    const { id: _id, ...rest } = garment;
    setEditingId(garment.id);
    setCreating(false);
    setDraft(rest);
  }

  function cancel(): void {
    setCreating(false);
    setEditingId(null);
    setDraft(BLANK);
    setError(null);
  }

  async function save(): Promise<void> {
    setBusy(true);
    const result = editingId
      ? await adminApi.updateGarment(editingId, draft)
      : await adminApi.createGarment(draft);
    setBusy(false);

    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      return;
    }
    cancel();
    await load();
  }

  async function toggleActive(garment: Garment): Promise<void> {
    setBusy(true);
    const result = await adminApi.setGarmentActive(garment.id, !garment.active);
    setBusy(false);
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      return;
    }
    await load();
  }

  const editing = creating || editingId !== null;

  return (
    <>
      <PageTitle
        title="Garments"
        description="The catalogue pieces shown on the public site. Deactivating hides a piece from customers without deleting it, so its copy and images survive. Changes appear publicly within about five minutes."
      />

      {error ? (
        <Panel className="mb-4">
          <Notice tone="error">{error}</Notice>
        </Panel>
      ) : null}

      {!editing ? (
        <div className="mb-4">
          <Button onClick={startCreate}>Add a garment</Button>
        </div>
      ) : null}

      {editing ? (
        <Panel className="mb-6">
          <h2 className="mb-4 text-sm font-medium tracking-[0.08em] text-[var(--everglade)]">
            {editingId ? "Edit garment" : "New garment"}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                className={inputClass}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Slug (appears in the URL)">
              <input
                className={inputClass}
                placeholder="navy-two-piece"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {GARMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Detail label (shown under the name)">
              <input
                className={inputClass}
                placeholder="Suits"
                value={draft.detail}
                onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className={inputClass}
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Field>

          {/*
            There is no image upload yet, so these are typed paths. The API
            rejects anything that is not a site-relative /images/… path with a
            known extension, which is the only thing preventing a typo from
            becoming a broken catalogue card.
          */}
          <p className="mt-4 text-xs leading-5 text-[rgb(65_72_67_/_75%)]">
            Images are entered as paths to files already in{" "}
            <code>apps/web/public/images/catalogue/</code>. Upload is not built yet. Both images must
            be 512×640 (4:5) or the hover crossfade will jump.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Flat image path">
              <input
                className={inputClass}
                placeholder="/images/catalogue/navy-two-piece-flat.png"
                value={draft.imageFlat}
                onChange={(e) => setDraft({ ...draft, imageFlat: e.target.value })}
              />
            </Field>
            <Field label="On-form image path">
              <input
                className={inputClass}
                placeholder="/images/catalogue/navy-two-piece-on-form.png"
                value={draft.imageOnForm}
                onChange={(e) => setDraft({ ...draft, imageOnForm: e.target.value })}
              />
            </Field>
            <Field label="Flat image description (for screen readers)">
              <input
                className={inputClass}
                value={draft.altFlat}
                onChange={(e) => setDraft({ ...draft, altFlat: e.target.value })}
              />
            </Field>
            <Field label="On-form image description (for screen readers)">
              <input
                className={inputClass}
                value={draft.altOnForm}
                onChange={(e) => setDraft({ ...draft, altOnForm: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Starting price override (naira, optional)">
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="Leave blank to use the category price"
                value={draft.startingPrice === null ? "" : String(draft.startingPrice)}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  /*
                   * Blank means null, NOT 0. A garment priced at ₦0 on a real
                   * site is worse than one showing its line's price, so an
                   * empty field must never fall through to a number.
                   */
                  setDraft({
                    ...draft,
                    startingPrice: raw === "" ? null : Number.isNaN(Number(raw)) ? null : Number(raw),
                  });
                }}
              />
            </Field>
            <Field label="Sort order within the category">
              <input
                className={inputClass}
                inputMode="numeric"
                value={String(draft.sortOrder)}
                onChange={(e) =>
                  setDraft({ ...draft, sortOrder: Number(e.target.value.trim()) || 0 })
                }
              />
            </Field>
          </div>

          <div className="mt-5 flex gap-2">
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="secondary" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </Panel>
      ) : null}

      {garments === null ? (
        <Panel>
          <p className="text-sm text-[var(--muted-ink)]">Loading…</p>
        </Panel>
      ) : garments.length === 0 ? (
        <Panel>
          <p className="text-sm text-[var(--muted-ink)]">No garments yet.</p>
        </Panel>
      ) : (
        <Panel>
          <ul className="divide-y divide-[rgb(27_62_45_/_10%)]">
            {garments.map((garment) => (
              <li key={garment.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--everglade)]">
                    {garment.name}{" "}
                    {!garment.active ? (
                      <span className="ml-1 rounded border border-[rgb(65_72_67_/_30%)] px-1.5 py-0.5 text-xs font-normal text-[var(--muted-ink)]">
                        hidden
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-[var(--muted-ink)]">
                    {garment.category} / {garment.slug}
                    {garment.startingPrice !== null
                      ? ` · ₦${garment.startingPrice.toLocaleString("en-NG")}`
                      : " · category price"}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => startEdit(garment)} disabled={busy}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void toggleActive(garment)}
                  disabled={busy}
                >
                  {garment.active ? "Hide" : "Show"}
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
