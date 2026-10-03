"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
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

type ImageField = "imageFlat" | "imageOnForm";

async function prepareImage(file: File): Promise<File> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Choose a photo smaller than 20 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = objectUrl;
    await image.decode();

    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    if (!canvas.width || !canvas.height) throw new Error("This photo could not be read.");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the photo.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob || blob.size > 5 * 1024 * 1024) throw new Error("This photo is too large to upload.");
    return new File([blob], "product-photo.jpg", { type: "image/jpeg" });
  } catch (error) {
    if (error instanceof Error && /too large|smaller than|could not prepare|could not be read/i.test(error.message)) {
      throw error;
    }
    throw new Error("This phone photo could not be opened. Try a JPEG or PNG copy.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function GarmentsPage(): React.ReactElement {
  const handleAuthError = useSessionAwareError();
  const [garments, setGarments] = useState<Garment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    setUploadError(null);
  }

  async function uploadImage(field: ImageField, file: File): Promise<void> {
    setUploadingField(field);
    setUploadError(null);
    try {
      const prepared = await prepareImage(file);
      const blob = await upload(`products/${crypto.randomUUID()}.jpg`, prepared, {
        access: "public",
        handleUploadUrl: "/api/products/images/upload",
      });
      setDraft((current) => ({ ...current, [field]: blob.url }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Photo upload failed. Try again.");
    } finally {
      setUploadingField(null);
    }
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
        title="Products"
        description="Products shown in the public catalogue. Hiding a product removes it from the customer site without deleting its details."
      />

      {error ? (
        <Panel className="mb-4">
          <Notice tone="error">{error}</Notice>
        </Panel>
      ) : null}

      {!editing ? (
        <div className="mb-4">
          <Button onClick={startCreate}>Add a product</Button>
        </div>
      ) : null}

      {editing ? (
        <Panel className="mb-6 space-y-6 p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-medium tracking-[0.08em] text-[var(--everglade)]">
            {editingId ? "Edit product" : "New product"}
          </h2>

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
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

          <p className="mt-4 text-sm leading-6 text-[var(--muted-ink)]">
            Choose photos from your phone or computer. One photo is enough; a second can show the garment on a form. Save the product afterward to publish it.
          </p>
          {uploadError ? <Notice tone="error">{uploadError}</Notice> : null}
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted-ink)]">Product photo</span>
              <input
                type="file"
                accept="image/*"
                aria-label="Upload product photo"
                disabled={busy || uploadingField !== null}
                className="mb-3 block w-full text-sm text-[var(--muted-ink)] file:mr-3 file:rounded-lg file:border file:border-[var(--outline)] file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--everglade)]"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void uploadImage("imageFlat", file);
                }}
              />
              {uploadingField === "imageFlat" ? <p className="mb-2 text-sm">Uploading photo…</p> : null}
              {draft.imageFlat ? (
                <Image src={draft.imageFlat} alt="Product photo preview" width={120} height={150} className="mb-3 h-[150px] w-[120px] rounded-lg object-cover" />
              ) : null}
              <details className="text-sm text-[var(--muted-ink)]">
                <summary className="cursor-pointer">Use an existing image URL instead</summary>
                <input
                  aria-label="Product image URL"
                  className={`${inputClass} mt-2`}
                  placeholder="/images/catalogue/navy-two-piece-flat.png"
                  value={draft.imageFlat}
                  onChange={(e) => setDraft({ ...draft, imageFlat: e.target.value })}
                />
              </details>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted-ink)]">Second photo (optional)</span>
              <input
                type="file"
                accept="image/*"
                aria-label="Upload second product photo"
                disabled={busy || uploadingField !== null}
                className="mb-3 block w-full text-sm text-[var(--muted-ink)] file:mr-3 file:rounded-lg file:border file:border-[var(--outline)] file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--everglade)]"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void uploadImage("imageOnForm", file);
                }}
              />
              {uploadingField === "imageOnForm" ? <p className="mb-2 text-sm">Uploading photo…</p> : null}
              {draft.imageOnForm ? (
                <Image src={draft.imageOnForm} alt="Second product photo preview" width={120} height={150} className="mb-3 h-[150px] w-[120px] rounded-lg object-cover" />
              ) : null}
              <details className="text-sm text-[var(--muted-ink)]">
                <summary className="cursor-pointer">Use an existing image URL instead</summary>
                <input
                  aria-label="Second product image URL"
                  className={`${inputClass} mt-2`}
                  placeholder="/images/catalogue/navy-two-piece-on-form.png"
                  value={draft.imageOnForm}
                  onChange={(e) => setDraft({ ...draft, imageOnForm: e.target.value })}
                />
              </details>
            </div>
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

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
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

          <div className="flex flex-wrap gap-3 border-t border-[var(--outline)] pt-5">
            <Button onClick={() => void save()} disabled={busy || uploadingField !== null}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="secondary" onClick={cancel} disabled={busy || uploadingField !== null}>
              Cancel
            </Button>
          </div>
        </Panel>
      ) : null}

      {garments === null ? (
        <Panel>
          <Notice>Loading…</Notice>
        </Panel>
      ) : garments.length === 0 ? (
        <Panel>
          <Notice>No products yet.</Notice>
        </Panel>
      ) : (
        <Panel>
          <ul className="divide-y divide-[rgb(27_62_45_/_10%)]">
            {garments.map((garment) => (
              <li key={garment.id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
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
