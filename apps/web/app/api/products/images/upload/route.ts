import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/admin-auth";
import { verifyAppsScriptAdminSecret } from "../../../../../lib/google-sheets";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ message: "Image storage is not connected yet." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getAdminSession();
        if (!session || !(await verifyAppsScriptAdminSecret(session.secret))) {
          throw new Error("Your admin session has expired. Sign in again before uploading.");
        }
        if (!/^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$/.test(pathname)) {
          throw new Error("Invalid product image path.");
        }
        return {
          allowedContentTypes: ["image/webp", "image/jpeg"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload could not start.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
