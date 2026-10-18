import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadPaymentProof } from "@/lib/storage/payment-proof";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `wallet/proofs/${session.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60)}`;
  // Private on Cloudinary; viewable only via /api/payment-proofs.
  const url = await uploadPaymentProof(buffer, key, file.type);

  return NextResponse.json({ url });
}
