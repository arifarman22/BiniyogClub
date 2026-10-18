/**
 * The six business segments of the Biniyog Club ecosystem. The first three are
 * business groups in the database (matched by groupSlug); the rest are new
 * segments without a page yet.
 */
export const SEGMENTS = [
  { key: "mariners", name: "Mariners Group", desc: "Manufacturing, industrial production, FMCG & agro ventures", groupSlug: "MARINERS" },
  { key: "mohs", name: "MOHS Group", desc: "Real estate, land development & property", groupSlug: "MOHS" },
  { key: "marinozz", name: "Marinozz Group", desc: "Food, restaurant, bakery & hospitality", groupSlug: "MARINOZZ" },
  { key: "community", name: "Community Ventures", desc: "Community-based business initiatives", groupSlug: null },
  { key: "alliance", name: "Venture Alliance", desc: "Strategic partnerships & joint ventures", groupSlug: null },
  { key: "systems", name: "Venture Systems", desc: "Technology, automation & governance", groupSlug: null },
] as const;

export type SegmentKey = (typeof SEGMENTS)[number]["key"];

export type EcosystemProject = {
  slug: string;
  title: string;
  status: string;
  minInvestmentBdt: number;
  returnLabel: string | null;
  coverImageUrl: string | null;
};

export type EcosystemSegment = {
  key: SegmentKey;
  name: string;
  desc: string;
  href: string | null;
  projects: EcosystemProject[];
};
