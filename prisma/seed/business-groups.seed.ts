import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

export async function seedBusinessGroups() {
  console.log("  → Seeding business groups...");

  // ── Mariners Group ────────────────────────────────────────────────────────
  const mariners = await db.businessGroup.upsert({
    where: { slug: "MARINERS" },
    create: {
      slug: "MARINERS",
      name: "Mariners Group",
      tagline: "Navigating Growth Together",
      description: "Mariners Group is a diversified conglomerate offering structured investment opportunities across three tiers — Investor, Shareholder, and Directorship — giving every participant a meaningful stake in the group's growth.",
      isActive: true,
    },
    update: {},
  });

  const marinersEntity = await db.groupEntity.upsert({
    where: { slug: "mariners-group-main" },
    create: {
      groupId: mariners.id,
      name: "Mariners Group",
      slug: "mariners-group-main",
      description: "The core investment vehicle of Mariners Group, offering three structured participation tiers.",
      isActive: true,
    },
    update: {},
  });

  await db.groupTier.createMany({
    skipDuplicates: true,
    data: [
      {
        entityId: marinersEntity.id,
        type: "INVESTOR",
        name: "Investor Tier",
        description: "Entry-level participation. Invest in Mariners Group products and earn fixed or profit-share returns. Ideal for individuals looking to grow their capital with a trusted group.",
        benefits: [
          "Invest in Mariners Group products",
          "Fixed or profit-share returns",
          "Quarterly performance reports",
          "Dedicated investor support",
          "Priority access to new product launches",
        ],
        minAmountBdt: 10000,
        expectedReturnPct: 15,
        durationMonths: 12,
        sortOrder: 1,
      },
      {
        entityId: marinersEntity.id,
        type: "SHAREHOLDER",
        name: "Shareholder Tier",
        description: "Own a share of Mariners Group. Shareholders receive dividends from group profits and have voting rights on key business decisions.",
        benefits: [
          "Equity ownership in Mariners Group",
          "Annual dividend distribution",
          "Voting rights on major decisions",
          "Shareholder annual general meeting access",
          "Share certificate issued",
          "Priority in future share offerings",
        ],
        minAmountBdt: 100000,
        expectedReturnPct: 20,
        durationMonths: 24,
        sortOrder: 2,
      },
      {
        entityId: marinersEntity.id,
        type: "DIRECTORSHIP",
        name: "Directorship Tier",
        description: "Become a Director of Mariners Group. The highest tier of participation, offering board-level influence, premium returns, and exclusive business privileges.",
        benefits: [
          "Board directorship position",
          "Highest return on investment",
          "Strategic decision-making authority",
          "Exclusive director networking events",
          "Company car and office privileges",
          "Director certificate and title",
          "First right of refusal on new ventures",
        ],
        minAmountBdt: 1000000,
        expectedReturnPct: 30,
        durationMonths: 36,
        sortOrder: 3,
      },
    ],
  });

  // ── MOHS Group ────────────────────────────────────────────────────────────
  const mohs = await db.businessGroup.upsert({
    where: { slug: "MOHS" },
    create: {
      slug: "MOHS",
      name: "MOHS Group",
      tagline: "Building the Future",
      description: "MOHS Group operates across real estate and corporate sectors. Investors can join at the Directorship level or participate in MOHS Venice City — a premium real estate development offering plot booking and land sharing.",
      isActive: true,
    },
    update: {},
  });

  const mohsMain = await db.groupEntity.upsert({
    where: { slug: "mohs-group-main" },
    create: {
      groupId: mohs.id,
      name: "MOHS Group",
      slug: "mohs-group-main",
      description: "Corporate directorship participation in MOHS Group.",
      isActive: true,
    },
    update: {},
  });

  await db.groupTier.createMany({
    skipDuplicates: true,
    data: [
      {
        entityId: mohsMain.id,
        type: "DIRECTORSHIP",
        name: "MOHS Directorship",
        description: "Join MOHS Group as a Director. Gain board-level authority, premium profit sharing, and exclusive access to all MOHS Group ventures including real estate and corporate projects.",
        benefits: [
          "Board directorship in MOHS Group",
          "Profit sharing from all group ventures",
          "Access to MOHS Venice City at director pricing",
          "Strategic voting rights",
          "Director certificate and title",
          "Exclusive director events and networking",
          "Priority allocation in new projects",
        ],
        minAmountBdt: 2000000,
        expectedReturnPct: 35,
        durationMonths: 60,
        sortOrder: 1,
      },
    ],
  });

  const mohsVenice = await db.groupEntity.upsert({
    where: { slug: "mohs-venice-city" },
    create: {
      groupId: mohs.id,
      name: "MOHS Venice City",
      slug: "mohs-venice-city",
      description: "MOHS Venice City is a premium real estate development project. Investors can book residential or commercial plots, or participate through land sharing — co-owning land with proportional returns.",
      isActive: true,
    },
    update: {},
  });

  await db.groupTier.createMany({
    skipDuplicates: true,
    data: [
      {
        entityId: mohsVenice.id,
        type: "PLOT_BOOKING",
        name: "Plot Booking",
        description: "Book your own plot in MOHS Venice City. Choose from residential or commercial plots. Pay in installments and receive your registered deed upon full payment.",
        benefits: [
          "Registered land deed on full payment",
          "Flexible installment payment plan",
          "Choice of residential or commercial plots",
          "Prime location in MOHS Venice City",
          "Gated community with full amenities",
          "Capital appreciation potential",
          "Dedicated plot management support",
        ],
        minAmountBdt: 500000,
        plotSizeSqft: 3,
        pricePerSqftBdt: 5000,
        totalUnits: 200,
        availableUnits: 200,
        sortOrder: 1,
      },
      {
        entityId: mohsVenice.id,
        type: "LAND_SHARE",
        name: "Land Sharing",
        description: "Co-own land in MOHS Venice City through our land sharing program. Pool resources with other investors to own a proportional share of premium land, with returns from appreciation and rental income.",
        benefits: [
          "Proportional land ownership certificate",
          "Rental income distribution",
          "Capital appreciation on land value",
          "Lower entry point than full plot booking",
          "Professional land management",
          "Quarterly valuation reports",
          "Exit option after lock-in period",
        ],
        minAmountBdt: 100000,
        expectedReturnPct: 18,
        durationMonths: 36,
        sortOrder: 2,
      },
    ],
  });

  // ── Marinozz Group ────────────────────────────────────────────────────────
  const marinozz = await db.businessGroup.upsert({
    where: { slug: "MARINOZZ" },
    create: {
      slug: "MARINOZZ",
      name: "Marinozz Group",
      tagline: "Ownership. Growth. Legacy.",
      description: "Marinozz Group operates through Marinozz PLC, offering investors the opportunity to become Shareholders or Directors — building long-term wealth through equity ownership in a growing public limited company.",
      isActive: true,
    },
    update: {},
  });

  const marinozzPlc = await db.groupEntity.upsert({
    where: { slug: "marinozz-plc" },
    create: {
      groupId: marinozz.id,
      name: "Marinozz PLC",
      slug: "marinozz-plc",
      description: "Marinozz PLC is the flagship public limited company of Marinozz Group. Investors can own shares or take up directorship positions.",
      isActive: true,
    },
    update: {},
  });

  await db.groupTier.createMany({
    skipDuplicates: true,
    data: [
      {
        entityId: marinozzPlc.id,
        type: "SHAREHOLDER",
        name: "Shareholder",
        description: "Own shares in Marinozz PLC. As a shareholder you receive annual dividends, have voting rights at AGMs, and benefit from share price appreciation as the company grows.",
        benefits: [
          "Equity shares in Marinozz PLC",
          "Annual dividend payments",
          "AGM voting rights",
          "Share certificate issued",
          "Access to company financial reports",
          "Priority in future share offerings",
          "Transferable shares",
        ],
        minAmountBdt: 50000,
        expectedReturnPct: 18,
        durationMonths: 12,
        sortOrder: 1,
      },
      {
        entityId: marinozzPlc.id,
        type: "DIRECTORSHIP",
        name: "Director",
        description: "Join the board of Marinozz PLC as a Director. Directors hold significant equity, shape company strategy, and receive the highest returns alongside exclusive corporate privileges.",
        benefits: [
          "Board directorship in Marinozz PLC",
          "Significant equity stake",
          "Strategic decision-making authority",
          "Highest dividend tier",
          "Director certificate and official title",
          "Executive networking access",
          "Company representation rights",
          "First right on new share issuances",
        ],
        minAmountBdt: 500000,
        expectedReturnPct: 28,
        durationMonths: 36,
        sortOrder: 2,
      },
    ],
  });

  console.log("  ✓ Business groups seeded: Mariners, MOHS (+ Venice City), Marinozz PLC");
}
