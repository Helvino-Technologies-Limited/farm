import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB — entrance/hero videos can be larger

function canManageBranding(role: Role | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/** Issues short-lived client upload tokens for Vercel Blob, so photos/videos go straight from the
 * admin's browser to Blob storage without passing through a Server Action (which has a small body
 * limit) — this route only ever sees metadata, never the file bytes. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getSession();
        const kind =
          clientPayload === "video" ? "video" :
          clientPayload === "logo" || clientPayload === "hero-video" || clientPayload === "gallery" ? "branding" :
          "image";

        const allowed =
          kind === "branding" ? canManageBranding(user?.role) : canWrite(user?.role ?? "MANAGEMENT", "products");
        if (!user || !allowed) {
          throw new Error("You do not have permission to upload media.");
        }

        const isVideo = clientPayload === "video" || clientPayload === "hero-video";
        return {
          allowedContentTypes: isVideo
            ? ["video/mp4", "video/webm", "video/quicktime"]
            : ["image/png", "image/jpeg", "image/webp", "image/gif"],
          maximumSizeInBytes: isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async () => {
        // No DB write needed here — the client saves the returned blob URL via its own
        // server action immediately after upload completes.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 }
    );
  }
}
