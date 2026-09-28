import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function requireSeedEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required seed environment variable: ${key}`);
  }
  return value;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function upsertUser(
  db: PrismaClient,
  data: {
    email: string;
    password: string;
    name: string;
    role: "INVESTOR" | "FARMER" | "FIELD_OFFICER" | "ADMIN" | "SUPER_ADMIN" | "FINANCE_OFFICER" | "PROJECT_MANAGER" | "KYC_OFFICER" | "SUPPORT";
  },
) {
  const passwordHash = await hashPassword(data.password);
  return db.user.upsert({
    where: { email: data.email },
    update: { passwordHash, name: data.name, role: data.role, emailVerified: true, status: "ACTIVE" },
    create: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      emailVerified: true,
      status: "ACTIVE",
    },
  });
}
