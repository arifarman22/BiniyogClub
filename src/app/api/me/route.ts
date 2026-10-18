import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.id, deletedAt: null },
    select: {
      id: true, name: true, email: true, phone: true, avatarUrl: true,
      emailVerified: true, phoneVerified: true, createdAt: true,
      investorProfile: {
        select: {
          city: true, country: true, occupation: true,
          annualIncomeRange: true, investmentExperience: true,
          riskTolerance: true, address: true,
          nationalId: true, dateOfBirth: true, nomineeName: true, nomineeNationalId: true,
        },
      },
      kyc: {
        select: {
          status: true,
          presentAddress: true, presentDivision: true, presentDistrict: true, presentUpazila: true, presentPostalCode: true,
          permanentAddress: true, permanentDivision: true, permanentDistrict: true, permanentUpazila: true, permanentPostalCode: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
