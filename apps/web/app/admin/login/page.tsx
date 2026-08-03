"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "../../../lib/admin-api";
import { ADMIN_FONT, Button, Field, inputClass, Panel } from "../../../components/admin/admin-ui";

type State = "idle" | "submitting";

export default function AdminLoginPage(): React.ReactElement {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState("submitting");
    setError(null);

    const result = await adminApi.login(
      String(data.get("email") ?? ""),
      String(data.get("password") ?? ""),
    );

    if (result.ok) {
      // The session cookie is httpOnly, so there is nothing to store here.
      // The browser holds it and adminFetch sends it via credentials:
      // "include" on every subsequent call.
      router.replace("/admin/appointments");
      return;
    }

    setState("idle");
    if (result.status === 429) {
      // Distinct from a wrong password on purpose. Telling someone their
      // password is wrong when they have actually been rate-limited sends
      // them off resetting credentials that were fine.
      setError("Too many attempts. Wait a minute, then try again.");
    } else if (result.status === 401) {
      // Deliberately identical whether the email exists or not, matching the
      // API, which returns the same message and the same timing for both.
      setError("Invalid email or password.");
    } else if (result.status === 0) {
      setError("Could not reach the server. Check that the API is running.");
    } else {
      setError(result.message);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#f4f5f4] px-5 py-12"
      style={{ fontFamily: ADMIN_FONT }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <p className="font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">Bodman Outfits</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--copper)]">Admin</p>
        </div>

        <Panel className="p-6">
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="flex flex-col gap-4"
          >
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-[rgb(180_40_40_/_30%)] bg-[rgb(180_40_40_/_6%)] px-3 py-2 text-sm leading-6 text-[#a12b2b]"
              >
                {error}
              </p>
            ) : null}

            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                autoFocus
                className={inputClass}
              />
            </Field>

            <Field label="Password">
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </Field>

            <div className="mt-1">
              <Button type="submit" disabled={state === "submitting"}>
                {state === "submitting" ? "Signing in…" : "Sign in"}
              </Button>
            </div>
          </form>
        </Panel>

        <p className="mt-4 text-center text-xs leading-5 text-[rgb(65_72_67_/_65%)]">
          There is no password reset yet. If you are locked out, the password can be reset from the
          server with the bootstrap script.
        </p>
      </div>
    </div>
  );
}
