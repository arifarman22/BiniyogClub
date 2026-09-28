import { db } from "@/lib/db/prisma";
import type { UserRole, UserStatus, User } from "@/types/prisma";

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  role: UserRole;
};

export type SafeUser = Omit<User, "passwordHash">;

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  avatarUrl: true,
  emailVerified: true,
  phoneVerified: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userRepository = {
  findById(id: string): Promise<SafeUser | null> {
    return db.user.findUnique({
      where: { id, deletedAt: null },
      select: safeUserSelect,
    });
  },

  findByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({ where: { email } });
  },

  findByEmailSafe(email: string): Promise<SafeUser | null> {
    return db.user.findUnique({
      where: { email, deletedAt: null },
      select: safeUserSelect,
    });
  },

  findByPhone(phone: string): Promise<SafeUser | null> {
    return db.user.findUnique({
      where: { phone, deletedAt: null },
      select: safeUserSelect,
    });
  },

  create(data: CreateUserInput): Promise<SafeUser> {
    return db.user.create({ data, select: safeUserSelect });
  },

  update(
    id: string,
    data: Partial<Pick<User, "name" | "phone" | "emailVerified" | "avatarUrl" | "status">>,
  ): Promise<SafeUser> {
    return db.user.update({ where: { id }, data, select: safeUserSelect });
  },

  updatePassword(id: string, passwordHash: string): Promise<SafeUser> {
    return db.user.update({
      where: { id },
      data: { passwordHash },
      select: safeUserSelect,
    });
  },

  verifyEmail(id: string): Promise<SafeUser> {
    return db.user.update({
      where: { id },
      data: { emailVerified: true },
      select: safeUserSelect,
    });
  },

  softDelete(id: string): Promise<SafeUser> {
    return db.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DEACTIVATED" as UserStatus },
      select: safeUserSelect,
    });
  },
};
