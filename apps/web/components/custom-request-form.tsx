"use client";

import { useState } from "react";
import {
  submitCustomRequest,
  type CustomRequestSubmission,
  type SubmitOutcome,
} from "../lib/custom-requests";

const categoryOptions = [
  { value: "", label: "Not sure yet" },
  { value: "suits", label: "Suits" },
  { value: "corporate", label: "Corporate" },
  { value: "casual", label: "Casual" },
] as const;

type SubmitState = "idle" | "submitting" | "sent";
type FailureReason = Extract<SubmitOutcome, { ok: false }>["reason"];

// Same standard as the appointment and enquiry forms: each failure says
// something specific, and none of them clears the form.
const failureMessages: Record<FailureReason, string> = {
  invalid: "Please check the details above and try again.",
  "rate-limited": "That's a few requests in quick succession. Please wait a moment, then try again.",
  unavailable:
    "We couldn't send that just now, so it has not reached us. Please try again, or reach us on WhatsApp.",
};

export function CustomRequestForm(): React.ReactElement {
  const [status, setStatus] = useState<SubmitState>("idle");
  const [error, setError] = useState<FailureReason | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const request: CustomRequestSubmission = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      description: String(data.get("description") ?? ""),
      category: String(data.get("category") ?? "") as CustomRequestSubmission["category"],
    };
    setStatus("submitting");
    setError(null);
    const outcome = await submitCustomRequest(request);
    if (outcome.ok) {
      setStatus("sent");
      form.reset();
      return;
    }
    setStatus("idle");
    setError(outcome.reason);
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[rgb(210_180_140_/_40%)] bg-white p-8 text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
        <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">REQUEST RECEIVED</p>
        <h3 className="mt-4 font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">
          Thank you. We&apos;ll read this properly and come back to you.
        </h3>
        <p className="mt-3 max-w-sm text-base leading-7 text-[var(--muted-ink)]">
          Every custom request is reviewed by hand. If it is something we can make, we will tell you
          what it involves before you commit to anything.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-medium tracking-[0.1em] text-[var(--copper)] transition-colors duration-300 hover:text-[var(--everglade)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
        >
          SUBMIT ANOTHER REQUEST
        </button>
      </div>
    );
  }

  const inputCls =
    "mt-2 min-h-11 border-0 border-b border-[var(--outline)] bg-transparent py-3 text-base text-[var(--ink)] placeholder:text-[rgb(65_72_67_/_45%)] focus:border-[var(--copper)] focus:outline-none";
  const labelCls = "text-sm font-medium tracking-[0.1em] text-[var(--muted-ink)]";

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-8 rounded-2xl border border-[rgb(210_180_140_/_40%)] bg-white p-6 md:p-10"
    >
      {error !== null ? (
        <p
          role="alert"
          className="rounded-xl border border-[rgb(200_118_58_/_35%)] bg-[rgb(200_118_58_/_6%)] px-4 py-3 text-base leading-7 text-[var(--ink)]"
        >
          {failureMessages[error]}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="cr-name" className={labelCls}>NAME</label>
          <input id="cr-name" name="name" type="text" required placeholder="Your full name" className={inputCls} />
        </div>
        <div className="flex flex-col">
          <label htmlFor="cr-email" className={labelCls}>EMAIL</label>
          <input id="cr-email" name="email" type="email" required placeholder="email@example.com" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="cr-phone" className={labelCls}>
            PHONE <span className="normal-case text-[rgb(65_72_67_/_60%)]">(optional)</span>
          </label>
          <input id="cr-phone" name="phone" type="tel" placeholder="+234 ..." className={inputCls} />
        </div>
        <div className="flex flex-col">
          <label htmlFor="cr-category" className={labelCls}>CLOSEST CATEGORY</label>
          <select
            id="cr-category"
            name="category"
            defaultValue=""
            className={`${inputCls} appearance-none rounded-none`}
          >
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col">
        <label htmlFor="cr-description" className={labelCls}>WHAT DO YOU HAVE IN MIND?</label>
        <textarea
          id="cr-description"
          name="description"
          required
          rows={6}
          placeholder="Describe the piece. Cut, cloth, occasion, anything you have seen that comes close."
          className={`${inputCls} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_14px_30px_rgb(200_118_58_/_24%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)] disabled:pointer-events-none disabled:opacity-70 md:w-auto"
      >
        {status === "submitting" ? "SENDING…" : "SUBMIT REQUEST"}
      </button>
    </form>
  );
}
