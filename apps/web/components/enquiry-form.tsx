"use client";

import { useState } from "react";
import { submitEnquiry, type EnquiryRequest, type SubmitOutcome } from "../lib/enquiries";

const subjectOptions = [
  { value: "bespoke", label: "Bespoke Suit / Corporate Order" },
  { value: "fitting", label: "Booking a Fitting" },
  { value: "custom-request", label: "Custom Design Request" },
  { value: "general", label: "General Enquiry" },
] as const;

type SubmitState = "idle" | "submitting" | "sent";

type FailureReason = Extract<SubmitOutcome, { ok: false }>["reason"];

// Distinct wording per failure. A single generic message would leave the
// customer unsure whether the atelier actually received their message, which
// is the only thing they need to know.
const failureMessages: Record<FailureReason, string> = {
  invalid: "Please check the details above and try again.",
  "rate-limited": "That's a few messages in quick succession. Please wait a moment, then try again.",
  unavailable:
    "We couldn't send that just now, so it has not reached us. Please try again, or reach us on WhatsApp.",
};

export function EnquiryForm(): React.ReactElement {
  const [status, setStatus] = useState<SubmitState>("idle");
  const [error, setError] = useState<FailureReason | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const request: EnquiryRequest = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      subject: data.get("subject") as EnquiryRequest["subject"],
      message: String(data.get("message") ?? ""),
    };

    setStatus("submitting");
    setError(null);
    const outcome = await submitEnquiry(request);

    if (outcome.ok) {
      setStatus("sent");
      form.reset();
      return;
    }
    // Stay on the filled-in form so nothing the customer typed is lost.
    setStatus("idle");
    setError(outcome.reason);
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[rgb(210_180_140_/_40%)] bg-white p-8 text-center animate-[catalogue-enter_700ms_cubic-bezier(0.16,1,0.3,1)_both]">
        <p className="text-sm font-medium tracking-[0.14em] text-[var(--copper)]">MESSAGE SENT</p>
        <h3 className="mt-4 font-[Fraunces] text-2xl font-medium text-[var(--everglade)]">
          Thank you — we&apos;ll be in touch personally.
        </h3>
        <p className="mt-3 max-w-sm text-base leading-7 text-[var(--muted-ink)]">
          A member of the house reads every enquiry. Expect a reply from us shortly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-medium tracking-[0.1em] text-[var(--copper)] transition-colors duration-300 hover:text-[var(--everglade)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
        >
          SEND ANOTHER MESSAGE
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
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
          <label htmlFor="name" className="text-sm font-medium tracking-[0.1em] text-[var(--muted-ink)]">
            NAME
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Your full name"
            className="mt-2 min-h-11 border-0 border-b border-[var(--outline)] bg-transparent py-3 text-base text-[var(--ink)] placeholder:text-[rgb(65_72_67_/_45%)] focus:border-[var(--copper)] focus:outline-none"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="email" className="text-sm font-medium tracking-[0.1em] text-[var(--muted-ink)]">
            EMAIL
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="email@example.com"
            className="mt-2 min-h-11 border-0 border-b border-[var(--outline)] bg-transparent py-3 text-base text-[var(--ink)] placeholder:text-[rgb(65_72_67_/_45%)] focus:border-[var(--copper)] focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="phone" className="text-sm font-medium tracking-[0.1em] text-[var(--muted-ink)]">
            PHONE
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+234 ..."
            className="mt-2 min-h-11 border-0 border-b border-[var(--outline)] bg-transparent py-3 text-base text-[var(--ink)] placeholder:text-[rgb(65_72_67_/_45%)] focus:border-[var(--copper)] focus:outline-none"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="subject" className="text-sm font-medium tracking-[0.1em] text-[var(--muted-ink)]">
            SUBJECT
          </label>
          <select
            id="subject"
            name="subject"
            defaultValue={subjectOptions[0].value}
            className="mt-2 min-h-11 appearance-none rounded-none border-0 border-b border-[var(--outline)] bg-transparent py-3 text-base text-[var(--ink)] focus:border-[var(--copper)] focus:outline-none"
          >
            {subjectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col">
        <label htmlFor="message" className="text-sm font-medium tracking-[0.1em] text-[var(--muted-ink)]">
          MESSAGE
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder="How can we assist you today?"
          className="mt-2 resize-none border-0 border-b border-[var(--outline)] bg-transparent py-3 text-base text-[var(--ink)] placeholder:text-[rgb(65_72_67_/_45%)] focus:border-[var(--copper)] focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--everglade)] px-7 py-4 text-sm font-medium tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_14px_30px_rgb(200_118_58_/_24%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)] disabled:pointer-events-none disabled:opacity-70 md:w-auto"
      >
        {status === "submitting" ? "SENDING…" : "SEND MESSAGE"}
      </button>
    </form>
  );
}
