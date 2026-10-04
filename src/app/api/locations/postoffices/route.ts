import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const upazilaId = searchParams.get("upazilaId");
  if (!upazilaId) return NextResponse.json({ error: "upazilaId required" }, { status: 400 });
  try {
    const res = await fetch(`https://bdapi.vercel.app/api/v.1/union/${upazilaId}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("upstream error");
    const json = await res.json();
    const data = (json.data ?? []).map((u: { id: string; name: string }) => ({
      id: u.id,
      name: u.name,
    }));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load post offices" }, { status: 502 });
  }
}
