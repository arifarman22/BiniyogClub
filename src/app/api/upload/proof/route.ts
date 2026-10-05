import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `wallet/proofs/${session.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60)}`;
  const resourceType = file.type.startsWith("image/") ? "image" : "raw";

  const url = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: key, resource_type: resourceType, type: "upload", overwrite: true },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });

  return NextResponse.json({ url });
}
