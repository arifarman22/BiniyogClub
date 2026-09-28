import { db } from "@/lib/db/prisma";
import type { VerificationTokenType } from "@/types/prisma";

export type CreateTokenInput = {
  userId: string;
  token: string;
  type: VerificationTokenType;
  expiresAt: Date;
};

export const tokenRepository = {
  create(data: CreateTokenInput) {
    return db.verificationToken.create({ data });
  },

  findByToken(token: string) {
    return db.verificationToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  },

  markUsed(id: string) {
    return db.verificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  deleteExpired() {
    return db.verificationToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },

  deleteByUserAndType(userId: string, type: VerificationTokenType) {
    return db.verificationToken.deleteMany({ where: { userId, type } });
  },
};
