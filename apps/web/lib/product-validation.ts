export const PRODUCT_CATEGORIES = ["suits", "agbada", "kaftan", "casuals", "corporate"] as const;

const CATEGORY_SET = new Set<string>(PRODUCT_CATEGORIES);

function validImage(value: unknown): boolean {
  const text = String(value ?? "").trim();
  if (!text) return true;
  return text.startsWith("/images/") || /^https?:\/\//i.test(text);
}

export function validateProductInput(data: Record<string, unknown>): string | null {
  const name = String(data.name ?? "").trim();
  const slug = String(data.slug ?? "").trim();
  const category = String(data.category ?? "").trim();

  if (!name) return "Product name is required.";
  if (name.length > 120) return "Product name is too long.";
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Slug must use lowercase letters, numbers and hyphens only.";
  }
  if (!CATEGORY_SET.has(category)) return "Invalid product category.";
  if (!validImage(data.imageFlat) || !validImage(data.imageOnForm)) {
    return "Image paths must use /images/... or an http(s) URL.";
  }

  if (data.startingPrice !== null && data.startingPrice !== "" && data.startingPrice !== undefined) {
    const price = Number(data.startingPrice);
    if (!Number.isFinite(price) || price < 0) return "Starting price must be a non-negative number.";
  }

  const sortOrder = Number(data.sortOrder ?? 0);
  if (!Number.isFinite(sortOrder)) return "Sort order must be a number.";

  if (data.active !== undefined && typeof data.active !== "boolean") {
    return "Active must be true or false.";
  }

  return null;
}
