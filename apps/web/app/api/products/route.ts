import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/admin-auth";
import { getProducts, upsertProduct } from "../../../lib/google-sheets";
import { validateProductInput } from "../../../lib/product-validation";

export async function GET(request: Request) {
  try {
    const admin = new URL(request.url).searchParams.get("admin") === "1";
    if (admin && !(await getAdminSession())) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const products = await getProducts();
    return NextResponse.json(
      admin ? products : products.filter((product) => product.active),
    );
  } catch {
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const data = (await request.json()) as Record<string, unknown>;
    const validationError = validateProductInput(data);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const product = await upsertProduct(data);
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Products are temporarily unavailable." }, { status: 503 });
  }
}
