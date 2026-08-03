"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../../lib/admin-api";
import { useSessionAwareError } from "../../../components/admin/admin-shell";
import { Button, Field, inputClass, Notice, PageTitle, Panel } from "../../../components/admin/admin-ui";

export default function AccountPage(): React.ReactElement {
  const handleAuthError = useSessionAwareError();
  const [email, setEmail] = useState<string | null>(null);
  const [pwMessage, setPwMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [emailMessage, setEmailMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await adminApi.me();
    if (!result.ok) {
      if (handleAuthError(result.status)) return;
      return;
    }
    setEmail(result.data.email);
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  // Both handlers treat a 401 from these two endpoints as a WRONG CURRENT
  // PASSWORD, not an expired session, and deliberately do not bounce to
  // login. The API returns 401 for both cases, but the request only got this
  // far because AdminAuthGuard already accepted the session, so the session
  // is valid by definition and the password must be what was wrong.
  async function changePassword(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const next = String(data.get("newPassword") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");
    setPwMessage(null);

    if (next !== confirm) {
      setPwMessage({ tone: "error", text: "The two new passwords do not match." });
      return;
    }

    setBusy(true);
    const result = await adminApi.changePassword(String(data.get("currentPassword") ?? ""), next);
    setBusy(false);

    if (result.ok) {
      form.reset();
      // The API keeps THIS session alive and revokes the others, so there is
      // nothing to do here but say so. Redirecting to login would be wrong
      // and would look like the change had failed.
      setPwMessage({
        tone: "ok",
        text: "Password changed. You are still signed in here; any other signed-in devices have been signed out.",
      });
      return;
    }
    if (result.status === 429) {
      setPwMessage({ tone: "error", text: "Too many attempts. Wait a minute, then try again." });
    } else if (result.status === 401) {
      setPwMessage({ tone: "error", text: "Current password is incorrect." });
    } else {
      setPwMessage({ tone: "error", text: result.message });
    }
  }

  async function changeEmail(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setEmailMessage(null);
    setBusy(true);
    const result = await adminApi.changeEmail(
      String(data.get("currentPasswordForEmail") ?? ""),
      String(data.get("newEmail") ?? ""),
    );
    setBusy(false);

    if (result.ok) {
      form.reset();
      setEmail(result.data.email);
      setEmailMessage({ tone: "ok", text: `Email changed to ${result.data.email}. Sign in with it next time.` });
      return;
    }
    if (result.status === 429) {
      setEmailMessage({ tone: "error", text: "Too many attempts. Wait a minute, then try again." });
    } else if (result.status === 401) {
      setEmailMessage({ tone: "error", text: "Current password is incorrect." });
    } else if (result.status === 409) {
      setEmailMessage({ tone: "error", text: "That email address is already in use." });
    } else {
      setEmailMessage({ tone: "error", text: result.message });
    }
  }

  function messageBlock(m: { tone: "ok" | "error"; text: string } | null) {
    if (!m) return null;
    return (
      <p
        role="alert"
        className={`rounded-lg border px-3 py-2 text-sm leading-6 ${
          m.tone === "ok"
            ? "border-[rgb(27_62_45_/_25%)] bg-[rgb(27_62_45_/_6%)] text-[var(--everglade)]"
            : "border-[rgb(180_40_40_/_30%)] bg-[rgb(180_40_40_/_6%)] text-[#a12b2b]"
        }`}
      >
        {m.text}
      </p>
    );
  }

  return (
    <>
      <PageTitle
        title="Account"
        description="There is only one admin account. Changing the password signs out every other device but keeps you signed in here."
      />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Panel className="p-5">
          <h2 className="font-[Fraunces] text-lg font-medium text-[var(--everglade)]">Change password</h2>
          <form onSubmit={(e) => void changePassword(e)} className="mt-4 flex flex-col gap-4">
            {messageBlock(pwMessage)}
            <Field label="Current password">
              <input name="currentPassword" type="password" required autoComplete="current-password" className={inputClass} />
            </Field>
            <Field label="New password" hint="At least 12 characters, and different from the current one.">
              <input name="newPassword" type="password" required minLength={12} autoComplete="new-password" className={inputClass} />
            </Field>
            <Field label="Confirm new password">
              <input name="confirmPassword" type="password" required minLength={12} autoComplete="new-password" className={inputClass} />
            </Field>
            <div>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Change password"}
              </Button>
            </div>
          </form>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-[Fraunces] text-lg font-medium text-[var(--everglade)]">Change email</h2>
          <p className="mt-1.5 text-xs leading-5 text-[rgb(65_72_67_/_70%)]">
            {email ? `Currently ${email}.` : ""} This is the address you sign in with. It is not shown
            anywhere on the public site.
          </p>
          <form onSubmit={(e) => void changeEmail(e)} className="mt-4 flex flex-col gap-4">
            {messageBlock(emailMessage)}
            <Field label="New email">
              <input name="newEmail" type="email" required autoComplete="email" className={inputClass} />
            </Field>
            <Field label="Current password">
              <input name="currentPasswordForEmail" type="password" required autoComplete="current-password" className={inputClass} />
            </Field>
            <div>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Change email"}
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      <Panel className="mt-5 p-5">
        <Notice>
          There is no password reset by email yet, and no second admin account. Both need decisions
          that have not been made: a mail provider for the first, and whether more than one person
          should have access for the second.
        </Notice>
      </Panel>
    </>
  );
}
