import { db } from "@/lib/db/prisma";
import { SESSION_DURATION_SECONDS } from "@/lib/auth/cookies";

export const sessionRepository = {
  create(userId: string, token: string, meta?: { userAgent?: string; ipAddress?: string }) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
    return db.session.create({
      data: {
        userId,
        token,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    });
  },

  findByToken(token: string) {
    return db.session.findUnique({ where: { token } });
  },

  deleteByToken(token: string) {
    return db.session.deleteMany({ where: { token } });
  },

  deleteByUserId(userId: string) {
    return db.session.deleteMany({ where: { userId } });
  },

  deleteExpired() {
    return db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },

  countByUserId(userId: string) {
    return db.session.count({ where: { userId } });
  },
};
