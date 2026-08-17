import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

export type SubmissionKind = "appointment" | "enquiry" | "custom-request";

/**
 * Everything the email needs, assembled by the caller.
 *
 * Deliberately built from the submitted DTO rather than re-read from the
 * database. The three create paths all write through `publicDb`, whose role
 * holds a column-level SELECT grant on `id` and `status` only, so the created
 * row genuinely cannot tell us the customer's name. Re-reading it would mean
 * a second query on the elevated `adminDb` connection purely to populate a
 * notification, which is a privilege escalation for no gain: the caller
 * already holds the exact values the customer submitted.
 */
export interface SubmissionNotification {
  kind: SubmissionKind;
  /** The new row's id. Used to build the deep link. */
  recordId: string;
  customerName: string;
  /**
   * The customer's own address, when they gave one.
   *
   * Optional because the schema makes it optional: `email` is nullable on all
   * three request models and `phone` is not. Most customers here arrive from
   * WhatsApp and leave a number. So a confirmation sent by email reaches a
   * subset by design, and the absence of an address is an ordinary case to be
   * skipped quietly, never an error.
   */
  customerEmail?: string | null;
  /** Ordered label/value pairs, rendered as-is. Keep it to what an admin needs to triage. */
  details: Array<[label: string, value: string]>;
}

const KIND_LABEL: Record<SubmissionKind, string> = {
  appointment: "appointment request",
  enquiry: "enquiry",
  "custom-request": "custom design request",
};

/**
 * How each kind is described back to the customer. Deliberately not the same
 * strings as KIND_LABEL: "appointment request" is how the shop triages it,
 * "fitting appointment" is what the customer thinks they booked.
 */
const CUSTOMER_LABEL: Record<SubmissionKind, string> = {
  appointment: "fitting appointment",
  enquiry: "enquiry",
  "custom-request": "custom design request",
};

/**
 * Which admin list a given kind deep-links into. The `?focus=` parameter is
 * read by the admin pages, which scroll to and highlight that row.
 */
const KIND_PATH: Record<SubmissionKind, string> = {
  appointment: "/admin/appointments",
  enquiry: "/admin/enquiries",
  "custom-request": "/admin/custom-requests",
};

/**
 * Operational alerts to the shop owner when a customer submits something.
 *
 * THE CENTRAL GUARANTEE: `notifyNewSubmission` never rejects and never
 * throws. A customer's appointment must not fail because an email provider
 * is down, a key expired, or a sender domain lost its verification. Every
 * failure path here ends in a log line and a resolved promise, which is what
 * makes it safe for callers to invoke it with `void` and move on.
 *
 * The cost of that guarantee, stated plainly: a dropped notification is
 * silent to the customer and visible only in the API logs. The submission is
 * safely in the database either way, so the worst case is that the owner
 * learns about it by opening the admin dashboard instead of by email. That
 * is the correct trade, but it does mean the logs are the only alarm.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly to: string | undefined;
  private readonly from: string;
  private readonly adminOrigin: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    /*
     * Recipient resolution, and why it is two variables rather than one.
     *
     * ADMIN_BOOTSTRAP_EMAIL is the login identity of the first admin account.
     * Reusing it as the notification address works today because they are the
     * same person, but they are different things: rotating who receives
     * operational mail should not mean touching the credential that names an
     * account. NOTIFICATION_EMAIL therefore wins when set, and the bootstrap
     * address is the fallback so this works with no new configuration.
     */
    this.to = process.env.NOTIFICATION_EMAIL ?? process.env.ADMIN_BOOTSTRAP_EMAIL;

    /*
     * Resend will only accept a `from` on a domain verified in the account.
     * `onboarding@resend.dev` is Resend's shared test sender, which is
     * allowed without verification but will ONLY deliver to the email address
     * that owns the Resend account. It is a working default for testing and
     * the wrong thing for production, so it is overridable and its use is
     * warned about at startup.
     */
    this.from = process.env.NOTIFICATION_FROM ?? "onboarding@resend.dev";

    this.adminOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

    this.resend = apiKey ? new Resend(apiKey) : null;

    if (!apiKey) {
      this.logger.warn("RESEND_API_KEY is not set. Submission notifications are disabled.");
    }
    if (!this.to) {
      this.logger.warn(
        "Neither NOTIFICATION_EMAIL nor ADMIN_BOOTSTRAP_EMAIL is set. Submission notifications are disabled.",
      );
    }
    if (!process.env.NOTIFICATION_FROM) {
      this.logger.warn(
        `NOTIFICATION_FROM is not set, falling back to ${this.from}. Resend's shared test sender only delivers to the address that owns the Resend account; set NOTIFICATION_FROM to an address on a verified domain before relying on this.`,
      );
    }
  }

  /**
   * Sends the alert. Resolves in every case, including every failure.
   *
   * Callers invoke this as `void notifications.notifyNewSubmission(...)`
   * immediately after the row is committed. Not awaited: the customer's
   * response should not wait on a third-party HTTP call.
   */
  async notifyNewSubmission(notification: SubmissionNotification): Promise<void> {
    try {
      if (this.resend === null || this.to === undefined) {
        // Already warned at startup. Logging every submission at warn level
        // would turn a known configuration state into recurring noise.
        this.logger.debug(
          `Notification skipped (not configured): ${notification.kind} ${notification.recordId}`,
        );
        return;
      }

      const label = KIND_LABEL[notification.kind];
      const link = `${this.adminOrigin}${KIND_PATH[notification.kind]}?focus=${encodeURIComponent(notification.recordId)}`;

      const result = await this.resend.emails.send({
        from: this.from,
        to: this.to,
        subject: `New ${label} from ${notification.customerName}`,
        text: this.renderText(notification, label, link),
      });

      /*
       * The SDK reports API-level failures in `result.error` rather than by
       * throwing, so a try/catch alone would treat a rejected send as a
       * success. This is the branch that catches an expired key or an
       * unverified sender domain.
       */
      if (result.error) {
        this.logger.error(
          `Failed to send ${notification.kind} notification for ${notification.recordId}: ${result.error.name}: ${result.error.message}`,
        );
      } else {
        this.logger.log(
          `Sent ${notification.kind} notification for ${notification.recordId} (message ${result.data?.id ?? "unknown"})`,
        );
      }

      /*
       * The customer's receipt goes out whether or not the owner's alert did,
       * and the `else` above exists for that reason - an early `return` here
       * coupled the two, so a misconfigured NOTIFICATION_EMAIL would have
       * silently denied every customer their confirmation as well. The two
       * addresses fail independently, so they are attempted independently.
       *
       * The owner's alert is still sent first: if the provider dies between
       * the two, the shop knowing about the job matters more than the
       * customer's receipt.
       */
      await this.confirmToCustomer(notification);
    } catch (error) {
      // The outermost net. Network failure, DNS, a malformed payload, an SDK
      // bug: whatever it is, it stops here and never reaches the caller.
      this.logger.error(
        `Unexpected error sending ${notification.kind} notification for ${notification.recordId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * The customer's receipt: we have it, here is what you told us, here is
   * what happens next.
   *
   * Three rules this follows, each of which is easy to get wrong:
   *
   * 1. **It never promises a time the shop has not committed to.** A booking
   *    is created with `status: pending` precisely because the customer
   *    cannot self-confirm, so this says the request was received - not that
   *    the appointment is confirmed. Saying otherwise would have people
   *    turning up to a fitting nobody scheduled.
   * 2. **It contains no admin link.** `KIND_PATH` builds a deep link into the
   *    dashboard; that belongs only in the owner's copy.
   * 3. **No address is not a failure.** Email is optional on every model, so
   *    this returns quietly rather than logging noise on the majority path.
   */
  private async confirmToCustomer(notification: SubmissionNotification): Promise<void> {
    const to = notification.customerEmail?.trim();
    if (!to || this.resend === null) return;

    const label = CUSTOMER_LABEL[notification.kind];
    const result = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `We have your ${label}`,
      text: [
        `Hello ${notification.customerName},`,
        "",
        `Thank you - we have received your ${label} and it is with us now.`,
        "",
        "This is what you sent:",
        ...notification.details.map(([key, value]) => `  ${key}: ${value}`),
        "",
        "Someone from the shop will be in touch to confirm the details with",
        "you. If anything above is wrong, simply reply to this message.",
        "",
        "Bodman Outfits",
      ].join("\n"),
    });

    if (result.error) {
      this.logger.error(
        `Failed to send customer confirmation for ${notification.recordId}: ${result.error.name}: ${result.error.message}`,
      );
      return;
    }
    this.logger.log(
      `Sent customer confirmation for ${notification.recordId} (message ${result.data?.id ?? "unknown"})`,
    );
  }

  /**
   * Plain text only. This is an operational alert read on a phone between
   * jobs, not marketing: no HTML, no layout, no images to fail to load. The
   * link is a bare URL so every mail client makes it tappable.
   */
  private renderText(notification: SubmissionNotification, label: string, link: string): string {
    const lines = [
      `New ${label} from ${notification.customerName}.`,
      "",
      ...notification.details.map(([key, value]) => `${key}: ${value}`),
      "",
      "Open it in the dashboard:",
      link,
    ];
    return lines.join("\n");
  }
}
