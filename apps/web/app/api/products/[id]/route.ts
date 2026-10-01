import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";
import { getProducts, upsertProduct } from "../../../../lib/google-sheets";
import { validateProductInput } from "../../../../lib/product-validation";

async function writeProduct(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const products = await getProducts(true);
    const current = products.find((product) => product.id === id);
    if (!current) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const patch = (await request.json()) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...current, ...patch, id };
    const validationError = validateProductInput(merged);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const product = await upsertProduct(merged);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { message: "Products are temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return writeProduct(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return writeProduct(request, context);
}
