import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { seedPermissions } from "./permissions";

const db = new PrismaClient();

async function main() {
  console.log("🔐 Seeding permissions...");
  await seedPermissions(db);
  console.log("✅ Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
