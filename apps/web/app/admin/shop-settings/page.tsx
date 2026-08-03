"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type ShopSettings } from "../../../lib/admin-api";
import { useSessionAwareError } from "../../../components/admin/admin-shell";
import { Button, Field, inputClass, Notice, PageTitle, Panel } from "../../../components/admin/admin-ui";

// Grouped the way someone actually thinks about them, not in schema order.
// The `pending` flag marks the fields that are deliberately empty in the
// database because the business has not confirmed them. The inputs exist so
// they can be filled in the moment a decision is made; they are NOT
// pre-filled with plausible-looking guesses, because an invented address or
// deposit percentage published to a real site is worse than a blank one.
const GROUPS: Array<{
  heading: string;
  note?: string;
  fields: Array<{ key: keyof ShopSettings; label: string; multiline?: boolean; numeric?: boolean; pending?: boolean }>;
}> = [
  {
    heading: "Identity",
    fields: [
      { key: "shopName", label: "Shop name" },
      { key: "tagline", label: "Tagline", multiline: true },
      { key: "cityCountry", label: "City and country" },
    ],
  },
  {
    heading: "Contact",
    note: "The WhatsApp number drives the floating button and the contact page link. Phone and email are still blank on the live site.",
    fields: [
      { key: "whatsappNumber", label: "WhatsApp number" },
      { key: "phone", label: "Phone", pending: true },
      { key: "email", label: "Email", pending: true },
      { key: "address", label: "Address", multiline: true, pending: true },
    ],
  },
  {
    heading: "Opening hours",
    note: "All three are blank on the live site. The contact page omits the hours section entirely until they are filled in.",
    fields: [
      { key: "hoursWeekday", label: "Weekdays", pending: true },
      { key: "hoursSaturday", label: "Saturday", pending: true },
      { key: "hoursSunday", label: "Sunday", pending: true },
    ],
  },
  {
    heading: "Pricing",
    note: "Both are unconfirmed business policy. A deposit percentage of 0 is a placeholder, not a statement that no deposit is required.",
    fields: [
      { key: "pricingNote", label: "Pricing note", multiline: true, pending: true },
      { key: "depositPercentage", label: "Deposit percentage", numeric: true, pending: true },
    ],
  },
];

export default function ShopSettingsPage(): React.ReactElement {
  const handleAuthError = useSessionAwareError();
  const [values, setValues] = useState<ShopSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const result = await adminApi.shopSettings();
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      return;
    }
    setValues(result.data);
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(): Promise<void> {
    if (!values) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await adminApi.saveShopSettings(values);
    setSaving(false);
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      setError(result.message);
      return;
    }
    // Show what the server stored, not what was typed.
    setValues(result.data);
    setSaved(true);
  }

  return (
    <>
      <PageTitle
        title="Shop settings"
        description="These values feed the public site directly. Fields marked pending are intentionally blank because the business has not confirmed them yet; the site is written to omit them rather than show a placeholder."
      />

      {error ? (
        <Panel className="mb-4">
          <Notice tone="error">{error}</Notice>
        </Panel>
      ) : null}

      {values === null ? (
        <Panel>
          <Notice>Loading…</Notice>
        </Panel>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="flex flex-col gap-5">
            {GROUPS.map((group) => (
              <Panel key={group.heading} className="p-5">
                <h2 className="font-[Fraunces] text-lg font-medium text-[var(--everglade)]">
                  {group.heading}
                </h2>
                {group.note ? (
                  <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[rgb(65_72_67_/_70%)]">
                    {group.note}
                  </p>
                ) : null}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {group.fields.map((f) => {
                    const raw = values[f.key];
                    return (
                      <div key={String(f.key)} className={f.multiline ? "md:col-span-2" : ""}>
                        <Field
                          label={f.label}
                          hint={f.pending ? "Not yet confirmed — blank on the live site" : undefined}
                        >
                          {f.multiline ? (
                            <textarea
                              rows={2}
                              className={`${inputClass} resize-y`}
                              value={String(raw)}
                              onChange={(e) =>
                                setValues({ ...values, [f.key]: e.target.value })
                              }
                            />
                          ) : (
                            <input
                              type={f.numeric ? "number" : "text"}
                              step={f.numeric ? "0.1" : undefined}
                              min={f.numeric ? 0 : undefined}
                              className={inputClass}
                              value={String(raw)}
                              onChange={(e) =>
                                setValues({
                                  ...values,
                                  [f.key]: f.numeric ? Number(e.target.value) : e.target.value,
                                })
                              }
                            />
                          )}
                        </Field>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved ? (
              <span className="text-sm text-[var(--everglade)]">Saved.</span>
            ) : null}
          </div>
        </form>
      )}
    </>
  );
}
