import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { photoPrefix } from "@/lib/photos";

/** Issues client-upload tokens for Vercel Blob. Photos are uploaded straight from the browser. */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession();
        if (!session) throw new Error("Nicht angemeldet");
        if (!pathname.startsWith(photoPrefix("blob", session.user.id))) throw new Error("Ungültiger Pfad");
        return {
          allowedContentTypes: ["image/webp", "image/jpeg", "image/png"],
          maximumSizeInBytes: 3 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
