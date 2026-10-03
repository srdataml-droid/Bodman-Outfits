const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzD4gM2YHv7fnnmq7b0TSdLTe6gccJ5uqyVkzU3_LhvZr86wNwQJ2eDR5uY36My_u1l/exec";

const APPS_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL?.trim() || DEFAULT_APPS_SCRIPT_URL;

const APPS_SCRIPT_ADMIN_SECRET =
  process.env.GOOGLE_APPS_SCRIPT_ADMIN_SECRET?.trim() || "";

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
  return APPS_SCRIPT_URL;
}

async function readJson(response: Response): Promise<ScriptResponse> {
  const textBody = await response.text();
  let body: ScriptResponse;
  try {
    body = JSON.parse(textBody) as ScriptResponse;
  } catch {
    throw new Error("Google Apps Script returned an invalid response.");
  }

  if (!response.ok || body.success === false) {
    throw new Error(
      body.error || `Google Apps Script request failed (${response.status}).`,
    );
  }

  return body;
}

function resolveAdminSecret(secret?: string): string {
  const value = secret?.trim() || APPS_SCRIPT_ADMIN_SECRET;
  if (!value) throw new Error("Admin secret is required.");
  return value;
}

async function scriptGet(action: string, secret?: string): Promise<ScriptResponse> {
  const url = new URL(endpoint());
  url.searchParams.set("action", action);
  if (secret) url.searchParams.set("secret", resolveAdminSecret(secret));

  const response = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
  });

  return readJson(response);
}

async function scriptPost(
  payload: Record<string, unknown>,
  secret?: string,
): Promise<ScriptResponse> {
  const body = secret
    ? { ...payload, secret: resolveAdminSecret(secret) }
    : payload;

  const response = await fetch(endpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

export async function verifyAppsScriptAdminSecret(secret: string): Promise<boolean> {
  try {
    await scriptGet("requests", secret);
    return true;
  } catch {
    try {
      const body = await scriptPost({ action: "requests" }, secret);
      return Array.isArray(body.requests) || body.success !== false;
    } catch {
      return false;
    }
  }
}

export async function appendToOperationsSheet(
  kind: SheetKind,
  data: Record<string, unknown>,
): Promise<string> {
  const body = await scriptPost({ action: kind, ...data });
  if (!body.id) throw new Error("Google Apps Script returned no request ID.");
  return body.id;
}

export async function getRequests(secret?: string) {
  const adminSecret = resolveAdminSecret(secret);
  let body: ScriptResponse;

  try {
    body = await scriptGet("requests", adminSecret);
  } catch {
    body = await scriptPost({ action: "requests" }, adminSecret);
  }

  if (!Array.isArray(body.requests)) {
    throw new Error("The Apps Script deployment does not expose requests.");
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
  secret?: string,
): Promise<void> {
  const adminSecret = resolveAdminSecret(secret);

  try {
    await scriptPost(
      { action: "requestStatus", type, id, status },
      adminSecret,
    );
  } catch {
    await scriptPost(
      { action: "setRequestStatus", type, id, status },
      adminSecret,
    );
  }
}

export async function getProducts(
  includeInactive = false,
  secret?: string,
) {
  let body: ScriptResponse;

  if (!includeInactive) {
    body = await scriptGet("products");
  } else {
    const adminSecret = resolveAdminSecret(secret);
    // Some older deployments answer unknown actions with a successful
    // health-check object. A valid list, including [], is the only signal
    // that an action is supported.
    try {
      const response = await scriptGet("productsAdmin", adminSecret);
      if (!Array.isArray(response.products)) throw new Error("No products list");
      body = response;
    } catch {
      try {
        const response = await scriptPost({ action: "adminProducts" }, adminSecret);
        if (!Array.isArray(response.products)) throw new Error("No products list");
        body = response;
      } catch {
        // Older deployments can still show active products while their
        // admin-specific action is unavailable.
        body = await scriptGet("products");
      }
    }
  }

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
        active:
          row.active !== false &&
          text(row.active).toLowerCase() !== "false",
        sortOrder: Number(row.sortOrder) || 0,
      };
    })
    .filter((product) => product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertProduct(
  data: Record<string, unknown>,
  secret?: string,
) {
  const adminSecret = resolveAdminSecret(secret);
  let body: ScriptResponse;

  try {
    body = await scriptPost(
      { action: "product", ...data },
      adminSecret,
    );
  } catch {
    body = await scriptPost(
      { action: "upsertProduct", ...data },
      adminSecret,
    );
  }

  if (!body.id) {
    throw new Error("Google Apps Script returned no product ID.");
  }

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
