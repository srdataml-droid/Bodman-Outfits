"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type ShopSettings } from "../../../lib/admin-api";
import { useSessionAwareError } from "../../../components/admin/admin-shell";
import { Button, Field, inputClass, Notice, PageTitle, Panel } from "../../../components/admin/admin-ui";

// Grouped the way someone actually thinks about them, not in schema order.
//
// The `pending` flag marks a field the business has NOT confirmed, so it is
// deliberately blank rather than pre-filled with a plausible-looking guess:
// an invented address or deposit percentage published to a real site is
// worse than a blank one.
//
// As of 2026-08-04 no field carries it. The owner confirmed contact details,
// opening hours, the pricing note and the deposit percentage, and all of them
// are now filled and live. The flag is kept because the next field added may
// well need it, not because anything is outstanding today.
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
    note: "The WhatsApp number drives the floating button and the contact page link. Phone, email and address are shown on the contact page; clearing any of them removes that line from the page rather than leaving a blank.",
    fields: [
      { key: "whatsappNumber", label: "WhatsApp number" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "address", label: "Address", multiline: true },
    ],
  },
  {
    heading: "Opening hours",
    note: "Shown on the contact page. Each line appears only if it has a value, so a blank day is omitted rather than shown as empty.",
    fields: [
      { key: "hoursWeekday", label: "Weekdays" },
      { key: "hoursSaturday", label: "Saturday" },
      { key: "hoursSunday", label: "Sunday" },
    ],
  },
  {
    heading: "Pricing",
    note: "The pricing note appears under the price list on the FAQ page. The deposit percentage is not displayed anywhere yet; the FAQ answer states it in prose instead.",
    fields: [
      { key: "pricingNote", label: "Pricing note", multiline: true },
      { key: "depositPercentage", label: "Deposit percentage", numeric: true },
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
        description="These values feed the public site directly. A field left blank is omitted from the page rather than shown as a placeholder. Saved changes can take up to 5 minutes to appear on the public site, which is normal and not a failed save."
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
                          hint={f.pending ? "Not yet confirmed, blank on the live site" : undefined}
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
