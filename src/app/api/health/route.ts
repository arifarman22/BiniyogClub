import { ok, withErrorHandler } from "@/lib/api/response";
import { db } from "@/lib/db/prisma";

export const GET = withErrorHandler(async () => {
  await db.$queryRaw`SELECT 1`;
  return ok({ status: "ok", timestamp: new Date().toISOString() });
});
