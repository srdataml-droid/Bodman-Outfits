import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/admin-auth";
import { getProducts, upsertProduct } from "../../../lib/google-sheets";
import { validateProductInput } from "../../../lib/product-validation";

function adminErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Products are temporarily unavailable.";
}

export async function GET(request: Request) {
  const admin = new URL(request.url).searchParams.get("admin") === "1";

  try {
    if (admin) {
      const session = await getAdminSession();
      if (!session) {
        return NextResponse.json(
          { message: "Unauthorized." },
          { status: 401 },
        );
      }

      return NextResponse.json(
        await getProducts(true, session.secret),
      );
    }

    const products = await getProducts(false);
    return NextResponse.json(
      products.filter((product) => product.active),
    );
  } catch (error) {
    if (admin) {
      return NextResponse.json(
        { message: adminErrorMessage(error) },
        { status: 503 },
      );
    }

    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const data = (await request.json()) as Record<string, unknown>;
    const validationError = validateProductInput(data);

    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 },
      );
    }

    const product = await upsertProduct(data, session.secret);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: adminErrorMessage(error) },
      { status: 503 },
    );
  }
}
