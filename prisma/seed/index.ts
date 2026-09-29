import * as dotenv from "dotenv";
dotenv.config();

import { db } from "./helpers";
import { seedUsers } from "./users";
import { seedCrops } from "./crops";
import { seedPermissions } from "./permissions";
import { seedProjects } from "./projects";
import { seedBusinessGroups } from "./business-groups.seed";

async function main() {
  console.log("🌱 Starting database seed...\n");

  const { farmer } = await seedUsers(db);
  await seedCrops(db);
  await seedPermissions(db);
  await seedProjects(db, farmer);
  await seedBusinessGroups();

  console.log("\n✅ Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
