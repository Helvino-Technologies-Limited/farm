import "server-only";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";

export type LogoFormat = "PNG" | "JPEG" | "WEBP";

function mimeToFormat(mime: string): LogoFormat {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "JPEG";
  if (mime.includes("webp")) return "WEBP";
  return "PNG";
}

let cachedDefault: { dataUrl: string; format: LogoFormat } | null | undefined;

function defaultLogo(): { dataUrl: string; format: LogoFormat } | null {
  if (cachedDefault !== undefined) return cachedDefault;
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "brand", "avepo-logo.png"));
    cachedDefault = { dataUrl: `data:image/png;base64,${buf.toString("base64")}`, format: "PNG" };
  } catch {
    cachedDefault = null;
  }
  return cachedDefault;
}

/**
 * Resolves the farm's current logo — the one uploaded via Settings if set, otherwise the
 * bundled default — as a base64 data URI with its real format detected from Content-Type.
 * Used anywhere a logo gets embedded into generated output (PDFs, OG image, app icons) since
 * those renderers need actual image bytes, not a remote blob URL.
 */
export async function getFarmLogo(): Promise<{ dataUrl: string; format: LogoFormat } | null> {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 }, select: { logoUrl: true } });
  const url = settings?.logoUrl;
  if (url && /^https?:\/\//.test(url)) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const mime = res.headers.get("content-type") ?? "image/png";
        const buf = Buffer.from(await res.arrayBuffer());
        return { dataUrl: `data:${mime};base64,${buf.toString("base64")}`, format: mimeToFormat(mime) };
      }
    } catch {
      // fall through to default
    }
  }
  if (url && url.startsWith("data:")) {
    return { dataUrl: url, format: mimeToFormat(url.slice(5, url.indexOf(";"))) };
  }
  return defaultLogo();
}

/** Just the raw URL (for <img>/<Image> tags, which can load remote blob URLs directly). */
export async function getFarmLogoUrl(): Promise<string | null> {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 }, select: { logoUrl: true } });
  return settings?.logoUrl ?? null;
}

/** Logo URL + display name, for headers that need both. */
export async function getFarmBranding(): Promise<{ logoUrl: string | null; farmName: string }> {
  const settings = await db.systemSetting.findUnique({ where: { id: 1 }, select: { logoUrl: true, farmName: true } });
  return { logoUrl: settings?.logoUrl ?? null, farmName: settings?.farmName ?? "Avepo Smart Farm" };
}
