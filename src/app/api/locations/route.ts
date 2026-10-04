import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://bdapi.vercel.app/api/v.1/division", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("upstream error");
    const json = await res.json();
    const data = (json.data ?? []).map((d: { id: string; name: string }) => ({
      id: d.id,
      name: d.name,
    }));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load divisions" }, { status: 502 });
  }
}
