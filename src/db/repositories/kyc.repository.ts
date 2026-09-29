import { db } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

// ─── Select shapes ────────────────────────────────────────────────────────────

export const kycSelect = {
  id: true,
  userId: true,
  status: true,
  fullName: true,
  dateOfBirth: true,
  nationality: true,
  addressLine: true,
  city: true,
  district: true,
  division: true,
  postalCode: true,
  documentType: true,
  documentNumber: true,
  bankName: true,
  bankAccountNumber: true,
  mobileProvider: true,
  mobileNumber: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  reviewNote: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.KycSelect;

export const kycDocumentSelect = {
  id: true,
  kycId: true,
  documentType: true,
  storageKey: true,
  mimeType: true,
  sizeBytes: true,
  verifiedAt: true,
  createdAt: true,
} as const satisfies Prisma.KycDocumentSelect;

export type KycRecord = Prisma.KycGetPayload<{ select: typeof kycSelect }>;
export type KycDocumentRecord = Prisma.KycDocumentGetPayload<{ select: typeof kycDocumentSelect }>;

// ─── Repository ───────────────────────────────────────────────────────────────

export const kycRepository = {
  async findByUserId(userId: string): Promise<KycRecord | null> {
    return db.kyc.findUnique({ where: { userId }, select: kycSelect });
  },

  async findById(id: string): Promise<KycRecord | null> {
    return db.kyc.findUnique({ where: { id }, select: kycSelect });
  },

  async findByIdWithDocuments(id: string) {
    return db.kyc.findUnique({
      where: { id },
      select: {
        ...kycSelect,
        documents: { select: kycDocumentSelect, orderBy: { createdAt: "asc" } },
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
    });
  },

  async findByUserIdWithDocuments(userId: string) {
    return db.kyc.findUnique({
      where: { userId },
      select: {
        ...kycSelect,
        documents: { select: kycDocumentSelect, orderBy: { createdAt: "asc" } },
      },
    });
  },

  async upsertDraft(
    userId: string,
    data: Partial<Omit<KycRecord, "id" | "userId" | "status" | "submittedAt" | "reviewedAt" | "reviewedBy" | "reviewNote" | "expiresAt" | "createdAt" | "updatedAt">>,
  ): Promise<KycRecord> {
    return db.kyc.upsert({
      where: { userId },
      create: { userId, status: "NOT_STARTED", ...data },
      update: data,
      select: kycSelect,
    });
  },

  async submit(userId: string): Promise<KycRecord> {
    return db.kyc.update({
      where: { userId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
      select: kycSelect,
    });
  },

  async setUnderReview(id: string): Promise<KycRecord> {
    return db.kyc.update({
      where: { id },
      data: { status: "UNDER_REVIEW" },
      select: kycSelect,
    });
  },

  async verify(id: string, reviewedBy: string): Promise<KycRecord> {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2); // 2-year validity
    return db.kyc.update({
      where: { id },
      data: {
        status: "VERIFIED",
        reviewedAt: new Date(),
        reviewedBy,
        reviewNote: null,
        expiresAt,
      },
      select: kycSelect,
    });
  },

  async reject(id: string, reviewedBy: string, reviewNote: string): Promise<KycRecord> {
    return db.kyc.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy, reviewNote },
      select: kycSelect,
    });
  },

  async requestResubmission(id: string, reviewedBy: string, reviewNote: string): Promise<KycRecord> {
    return db.kyc.update({
      where: { id },
      data: { status: "RESUBMISSION_REQUIRED", reviewedAt: new Date(), reviewedBy, reviewNote },
      select: kycSelect,
    });
  },

  async addDocument(data: {
    kycId: string;
    documentType: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<KycDocumentRecord> {
    return db.kycDocument.create({ data: data as Parameters<typeof db.kycDocument.create>[0]["data"], select: kycDocumentSelect });
  },

  async deleteDocument(id: string): Promise<void> {
    await db.kycDocument.delete({ where: { id } });
  },

  async findDocumentById(id: string): Promise<KycDocumentRecord | null> {
    return db.kycDocument.findUnique({ where: { id }, select: kycDocumentSelect });
  },

  // ─── Admin queries ────────────────────────────────────────────────────────

  async findMany(opts: {
    status?: string[];
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = opts;
    const where: Prisma.KycWhereInput = status?.length ? { status: { in: status as never[] } } : {};
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.kyc.findMany({
        where,
        select: {
          ...kycSelect,
          user: { select: { id: true, name: true, email: true, phone: true } },
          _count: { select: { documents: true } },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      db.kyc.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async countByStatus() {
    const rows = await db.kyc.groupBy({ by: ["status"], _count: { _all: true } });
    return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
  },
};
