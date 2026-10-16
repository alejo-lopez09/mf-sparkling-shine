import { promises as fs } from "node:fs";
import path from "node:path";
import { getEvidenceAccess } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

const imageTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const user = await getCurrentUser();
  const { filename } = await params;
  const extension = path.extname(filename).toLowerCase();
  if (!user || !/^[\da-f-]+\.(jpg|png|webp)$/i.test(filename) || !imageTypes[extension]) {
    return new Response(null, { status: 404 });
  }
  if (!(await getEvidenceAccess(filename, user))) return new Response(null, { status: 404 });

  const evidenceDirectory = process.env.EVIDENCE_DIR ?? path.join(process.cwd(), "data", "evidence");
  let image: Buffer;
  try {
    image = await fs.readFile(path.join(/*turbopackIgnore: true*/ evidenceDirectory, filename));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return new Response(null, { status: 404 });
    }
    throw error;
  }

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": imageTypes[extension],
      "Content-Length": String(image.byteLength),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
