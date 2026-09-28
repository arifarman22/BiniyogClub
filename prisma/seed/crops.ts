import type { PrismaClient } from "@prisma/client";

const CROPS = [
  // Grains
  { name: "Boro Rice",      localName: "বোরো ধান",    category: "GRAIN",     growthDays: 140, description: "High-yield irrigated rice variety" },
  { name: "Aman Rice",      localName: "আমন ধান",     category: "GRAIN",     growthDays: 120, description: "Monsoon season rice" },
  { name: "Wheat",          localName: "গম",           category: "GRAIN",     growthDays: 110, description: "Winter wheat" },
  { name: "Maize",          localName: "ভুট্টা",       category: "GRAIN",     growthDays: 90,  description: "Hybrid maize" },
  // Vegetables
  { name: "Potato",         localName: "আলু",          category: "VEGETABLE", growthDays: 75,  description: "Winter potato" },
  { name: "Tomato",         localName: "টমেটো",        category: "VEGETABLE", growthDays: 70,  description: "Hybrid tomato" },
  { name: "Brinjal",        localName: "বেগুন",        category: "VEGETABLE", growthDays: 60,  description: "Eggplant / brinjal" },
  { name: "Bitter Gourd",   localName: "করলা",         category: "VEGETABLE", growthDays: 55,  description: "Bitter melon" },
  { name: "Cabbage",        localName: "বাঁধাকপি",     category: "VEGETABLE", growthDays: 65,  description: "Winter cabbage" },
  // Fruits
  { name: "Mango",          localName: "আম",           category: "FRUIT",     growthDays: 120, description: "Seasonal mango" },
  { name: "Banana",         localName: "কলা",          category: "FRUIT",     growthDays: 300, description: "Year-round banana" },
  { name: "Watermelon",     localName: "তরমুজ",        category: "FRUIT",     growthDays: 80,  description: "Summer watermelon" },
  // Legumes
  { name: "Lentil",         localName: "মসুর ডাল",    category: "LEGUME",    growthDays: 100, description: "Red lentil" },
  { name: "Chickpea",       localName: "ছোলা",         category: "LEGUME",    growthDays: 95,  description: "Bengal gram" },
  { name: "Mung Bean",      localName: "মুগ ডাল",     category: "LEGUME",    growthDays: 65,  description: "Green gram" },
  // Oilseeds
  { name: "Mustard",        localName: "সরিষা",        category: "OILSEED",   growthDays: 85,  description: "Rapeseed mustard" },
  { name: "Sunflower",      localName: "সূর্যমুখী",   category: "OILSEED",   growthDays: 90,  description: "Hybrid sunflower" },
  // Spices
  { name: "Onion",          localName: "পেঁয়াজ",      category: "SPICE",     growthDays: 120, description: "Rabi onion" },
  { name: "Garlic",         localName: "রসুন",         category: "SPICE",     growthDays: 130, description: "Winter garlic" },
  { name: "Chili",          localName: "মরিচ",         category: "SPICE",     growthDays: 75,  description: "Hot chili pepper" },
  // Fiber
  { name: "Jute",           localName: "পাট",          category: "FIBER",     growthDays: 120, description: "Golden fiber of Bangladesh" },
] as const;

export async function seedCrops(db: PrismaClient) {
  console.log("  → Seeding crops...");

  for (const crop of CROPS) {
    await db.crop.upsert({
      where: { name: crop.name },
      update: { localName: crop.localName, growthDays: crop.growthDays, description: crop.description },
      create: crop,
    });
  }

  console.log(`  ✓ ${CROPS.length} crops seeded`);
}
