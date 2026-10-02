import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { setRequestStatus } from "../../../../../lib/google-sheets";

const COMMISSION_STATUSES = new Set([
  "pending_review",
  "accepted",
  "declined",
]);

const FITTING_STATUSES = new Set([
  "pending",
  "confirmed",
  "declined",
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ type: string; id: string }> },
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const { type, id } = await context.params;

    if (type !== "commission" && type !== "fitting") {
      return NextResponse.json(
        { message: "Invalid request type." },
        { status: 400 },
      );
    }

    const { status } = (await request.json()) as {
      status?: string;
    };

    const allowed =
      type === "commission"
        ? COMMISSION_STATUSES
        : FITTING_STATUSES;

    if (!status || !allowed.has(status)) {
      return NextResponse.json(
        { message: "Invalid request status." },
        { status: 400 },
      );
    }

    await setRequestStatus(
      type,
      id,
      status,
      session.secret,
    );

    return NextResponse.json({
      ok: true,
      id,
      status,
    });
  } catch {
    return NextResponse.json(
      { message: "Request status could not be updated." },
      { status: 503 },
    );
  }
}
