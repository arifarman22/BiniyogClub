import { userRepository, tokenRepository, sessionRepository } from "@/db/repositories";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateOtp,
} from "@/lib/auth/crypto";
import { setSessionCookie, clearSessionCookie, getSessionCookie } from "@/lib/auth/cookies";
import {
  sendEmail,
  buildVerificationEmail,
  buildPasswordResetEmail,
  buildOtpEmail,
  buildPasswordChangedEmail,
} from "@/lib/email/mailer";
import {
  ConflictError,
  UnauthorizedError,
  InvalidTokenError,
  EmailNotVerifiedError,
  ForbiddenError,
} from "@/lib/errors";
import { env } from "@/config/env";
import type { UserRole } from "@/types/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  nidNumber: string;
  nomineeNidNumber: string;
  nomineeRelation: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SessionMeta = {
  userAgent?: string;
  ipAddress?: string;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  // ── Registration ────────────────────────────────────────────────────────────

  async register(input: RegisterInput) {
    const { name, email, phone, password, role, nidNumber, nomineeNidNumber, nomineeRelation } = input;

    const [existingEmail, existingPhone] = await Promise.all([
      userRepository.findByEmail(email),
      userRepository.findByPhone(phone),
    ]);

    if (existingEmail) throw new ConflictError("An account with this email already exists");
    if (existingPhone) throw new ConflictError("An account with this phone number already exists");

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({ email, passwordHash, name, phone, role });
    await userRepository.verifyEmail(user.id);

    if (role === "INVESTOR") {
      await import("@/lib/db/prisma").then(({ db }) =>
        db.investorProfile.create({
          data: {
            userId: user.id,
            nationalId: nidNumber,
            nomineeNationalId: nomineeNidNumber,
            nomineeRelation,
            country: "BD",
          },
        })
      );
    }

    return user;
  },

  // ── Login ────────────────────────────────────────────────────────────────────

  async login(input: LoginInput, meta?: SessionMeta) {
    const { email, password } = input;

    const user = await userRepository.findByEmail(email);

    // Always run bcrypt even on miss — prevents timing-based user enumeration
    const dummyHash = "$2b$12$invalidhashfortimingprotection000000000000000000000000";
    const passwordHash = user?.passwordHash ?? dummyHash;
    const valid = await verifyPassword(password, passwordHash);

    if (!user || !valid) throw new UnauthorizedError("Invalid email or password");
    if (user.deletedAt) throw new UnauthorizedError("Invalid email or password");
    if (user.status === "SUSPENDED") throw new ForbiddenError("Your account has been suspended. Contact support.");

    const token = generateSecureToken();
    await sessionRepository.create(user.id, token, meta);
    await setSessionCookie(token);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  },

  // ── Logout ───────────────────────────────────────────────────────────────────

  async logout() {
    const token = await getSessionCookie();
    if (token) {
      await sessionRepository.deleteByToken(token).catch(() => {});
    }
    await clearSessionCookie();
  },

  // ── Logout all sessions ──────────────────────────────────────────────────────

  async logoutAll(userId: string) {
    await sessionRepository.deleteByUserId(userId);
    await clearSessionCookie();
  },

  // ── Email Verification ───────────────────────────────────────────────────────

  async sendVerificationEmail(userId: string, email: string, name: string) {
    await tokenRepository.deleteByUserAndType(userId, "EMAIL_VERIFICATION");

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await tokenRepository.create({ userId, token, type: "EMAIL_VERIFICATION", expiresAt });

    const url = `${env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Verify your Biniyog Club account",
      html: buildVerificationEmail(name, url),
    });
  },

  async verifyEmail(token: string) {
    const record = await tokenRepository.findByToken(token);

    if (
      !record ||
      record.type !== "EMAIL_VERIFICATION" ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new InvalidTokenError();
    }

    await Promise.all([
      userRepository.verifyEmail(record.userId),
      tokenRepository.markUsed(record.id),
    ]);
  },

  // ── Password Reset ───────────────────────────────────────────────────────────

  async sendPasswordReset(email: string) {
    const user = await userRepository.findByEmail(email);
    // Always return success — prevents email enumeration
    if (!user || user.deletedAt) return;

    await tokenRepository.deleteByUserAndType(user.id, "PASSWORD_RESET");

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await tokenRepository.create({ userId: user.id, token, type: "PASSWORD_RESET", expiresAt });

    const url = `${env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Reset your Biniyog Club password",
      html: buildPasswordResetEmail(user.name, url),
    });
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await tokenRepository.findByToken(token);

    if (
      !record ||
      record.type !== "PASSWORD_RESET" ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new InvalidTokenError();
    }

    const passwordHash = await hashPassword(newPassword);

    await Promise.all([
      userRepository.updatePassword(record.userId, passwordHash),
      tokenRepository.markUsed(record.id),
      // Invalidate all existing sessions after password reset
      sessionRepository.deleteByUserId(record.userId),
    ]);
  },

  // ── Change Password (authenticated) ─────────────────────────────────────────

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId))?.email ?? "",
    );

    if (!user) throw new UnauthorizedError();

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Current password is incorrect");

    const passwordHash = await hashPassword(newPassword);

    await Promise.all([
      userRepository.updatePassword(userId, passwordHash),
      // Invalidate all other sessions — keep current session active
      sessionRepository.deleteByUserId(userId),
    ]);

    // Re-create session for current user
    const token = generateSecureToken();
    await sessionRepository.create(userId, token);
    await setSessionCookie(token);

    // Notify user
    sendEmail({
      to: user.email,
      subject: "Your Biniyog Club password was changed",
      html: buildPasswordChangedEmail(user.name),
    }).catch((err) => console.error("[auth] password changed email failed:", err));
  },

  // ── OTP ──────────────────────────────────────────────────────────────────────

  async sendOtp(userId: string, email: string, name: string) {
    await tokenRepository.deleteByUserAndType(userId, "OTP");

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await tokenRepository.create({ userId, token: otp, type: "OTP", expiresAt });

    await sendEmail({
      to: email,
      subject: "Your Biniyog Club verification code",
      html: buildOtpEmail(name, otp),
    });
  },

  async verifyOtp(userId: string, otp: string) {
    const record = await tokenRepository.findByToken(otp);

    if (
      !record ||
      record.userId !== userId ||
      record.type !== "OTP" ||
      record.usedAt ||
      record.expiresAt < new Date()
    ) {
      throw new InvalidTokenError();
    }

    await tokenRepository.markUsed(record.id);
  },
};
