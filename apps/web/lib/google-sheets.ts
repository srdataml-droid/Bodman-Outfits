const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

export type SheetKind = "commission" | "fitting";

type ScriptResponse = {
  success?: boolean;
  error?: string;
  id?: string;
  products?: unknown[];
  requests?: unknown[];
  faqs?: unknown[];
};

function endpoint(): string {
  const url = APPS_SCRIPT_URL?.trim();
  if (!url) throw new Error("Google Apps Script is not configured.");
  return url;
}

async function readJson(response: Response): Promise<ScriptResponse> {
  const text = await response.text();
  let body: ScriptResponse;
  try {
    body = JSON.parse(text) as ScriptResponse;
  } catch {
    throw new Error("Google Apps Script returned an invalid response.");
  }
  if (!response.ok || body.success === false) {
    throw new Error(body.error || `Google Apps Script request failed (${response.status}).`);
  }
  return body;
}

async function scriptGet(action: string): Promise<ScriptResponse> {
  const url = new URL(endpoint());
  url.searchParams.set("action", action);
  const response = await fetch(url, { cache: "no-store", redirect: "follow" });
  return readJson(response);
}

async function scriptPost(payload: Record<string, unknown>): Promise<ScriptResponse> {
  const response = await fetch(endpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    redirect: "follow",
  });
  return readJson(response);
}

function text(value: unknown): string {
  return value == null ? "" : String(value);
}

function numberOrNull(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function appendToOperationsSheet(
  kind: SheetKind,
  data: Record<string, unknown>,
): Promise<string> {
  const body = await scriptPost({ action: kind, ...data });
  if (!body.id) throw new Error("Google Apps Script returned no request ID.");
  return body.id;
}

export async function getRequests() {
  const body = await scriptGet("requests");
  if (!Array.isArray(body.requests)) {
    throw new Error("The Apps Script deployment does not expose requests yet.");
  }

  return body.requests
    .map((raw) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      const type = row.type === "fitting" ? "fitting" : "commission";
      return {
        type,
        createdAt: text(row.createdAt),
        id: text(row.id),
        name: text(row.name),
        email: text(row.email),
        phone: text(row.phone),
        category: text(row.category),
        occasion: text(row.occasion),
        neededBy: text(row.neededBy),
        description: text(row.description),
        preferredDate: text(row.preferredDate),
        preferredTime: text(row.preferredTime),
        notes: text(row.notes),
        status: text(row.status),
      };
    })
    .filter((row) => row.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setRequestStatus(
  type: "commission" | "fitting",
  id: string,
  status: string,
): Promise<void> {
  await scriptPost({ action: "requestStatus", type, id, status });
}

export async function getProducts() {
  const body = await scriptGet("products");
  if (!Array.isArray(body.products)) {
    throw new Error("Google Apps Script returned no products list.");
  }

  return body.products
    .map((raw) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      return {
        id: text(row.id),
        slug: text(row.slug),
        category: text(row.category),
        name: text(row.name),
        detail: text(row.detail),
        description: text(row.description),
        imageFlat: text(row.imageFlat),
        imageOnForm: text(row.imageOnForm),
        altFlat: text(row.altFlat),
        altOnForm: text(row.altOnForm),
        startingPrice: numberOrNull(row.startingPrice),
        active: row.active !== false && text(row.active).toLowerCase() !== "false",
        sortOrder: Number(row.sortOrder) || 0,
      };
    })
    .filter((product) => product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertProduct(data: Record<string, unknown>) {
  const body = await scriptPost({ action: "product", ...data });
  if (!body.id) throw new Error("Google Apps Script returned no product ID.");
  return { ...data, id: body.id };
}

export async function getFaqs() {
  const body = await scriptGet("faqs");
  if (!Array.isArray(body.faqs)) {
    throw new Error("Google Apps Script returned no FAQ list.");
  }

  return body.faqs
    .map((raw) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      return {
        id: text(row.id),
        category: text(row.category) || null,
        question: text(row.question),
        answer: text(row.answer),
        sortOrder: Number(row.sortOrder) || 0,
      };
    })
    .filter((faq) => faq.id && faq.question && faq.answer)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
