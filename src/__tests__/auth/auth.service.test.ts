import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictError, UnauthorizedError, InvalidTokenError, ForbiddenError } from "@/lib/errors";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUserRepo = {
  findByEmail: vi.fn(),
  findByPhone: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  updatePassword: vi.fn(),
  verifyEmail: vi.fn(),
};

const mockTokenRepo = {
  create: vi.fn(),
  findByToken: vi.fn(),
  markUsed: vi.fn(),
  deleteByUserAndType: vi.fn(),
};

const mockSessionRepo = {
  create: vi.fn(),
  deleteByToken: vi.fn(),
  deleteByUserId: vi.fn(),
};

vi.mock("@/db/repositories", () => ({
  userRepository: mockUserRepo,
  tokenRepository: mockTokenRepo,
  sessionRepository: mockSessionRepo,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    investorProfile: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/auth/cookies", () => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  getSessionCookie: vi.fn().mockResolvedValue("existing-token"),
}));

vi.mock("@/lib/email/mailer", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  buildVerificationEmail: vi.fn().mockReturnValue("<html>verify</html>"),
  buildPasswordResetEmail: vi.fn().mockReturnValue("<html>reset</html>"),
  buildOtpEmail: vi.fn().mockReturnValue("<html>otp</html>"),
  buildPasswordChangedEmail: vi.fn().mockReturnValue("<html>changed</html>"),
}));

vi.mock("@/config/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

const { authService } = await import("@/server/services/auth.service");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  phone: "01712345678",
  role: "INVESTOR" as const,
  status: "ACTIVE" as const,
  emailVerified: true,
  avatarUrl: null,
  phoneVerified: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseUserWithHash = {
  ...baseUser,
  passwordHash: ["mock", "hash"].join("-"),
};

// ─── register ─────────────────────────────────────────────────────────────────

describe("authService.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates user when email and phone are unique", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findByPhone.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(baseUser);
    mockTokenRepo.deleteByUserAndType.mockResolvedValue(undefined);
    mockTokenRepo.create.mockResolvedValue({});

    const result = await authService.register({
      name: "Test User",
      email: "test@example.com",
      phone: "01712345678",
      password: "SecurePass1",
      role: "INVESTOR",
      nidNumber: "1234567890",
      nomineeNidNumber: "0987654321",
      nomineeRelation: "Spouse",
    });

    expect(mockUserRepo.create).toHaveBeenCalledOnce();
    expect(result.email).toBe("test@example.com");
  });

  it("throws ConflictError when email already exists", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(baseUserWithHash);
    mockUserRepo.findByPhone.mockResolvedValue(null);

    await expect(
      authService.register({ name: "X", email: "test@example.com", phone: "01712345678", password: "Pass1234", role: "INVESTOR", nidNumber: "1234567890", nomineeNidNumber: "0987654321", nomineeRelation: "Spouse" }),
    ).rejects.toThrow(ConflictError);
  });

  it("throws ConflictError when phone already exists", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findByPhone.mockResolvedValue(baseUser);

    await expect(
      authService.register({ name: "X", email: "new@example.com", phone: "01712345678", password: "Pass1234", role: "INVESTOR", nidNumber: "1234567890", nomineeNidNumber: "0987654321", nomineeRelation: "Spouse" }),
    ).rejects.toThrow(ConflictError);
  });

  it("does not expose password hash in return value", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findByPhone.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(baseUser);
    mockTokenRepo.deleteByUserAndType.mockResolvedValue(undefined);
    mockTokenRepo.create.mockResolvedValue({});

    const result = await authService.register({
      name: "Test User", email: "test@example.com", phone: "01712345678",
      password: "SecurePass1", role: "INVESTOR",
      nidNumber: "1234567890", nomineeNidNumber: "0987654321", nomineeRelation: "Spouse",
    });

    expect(result).not.toHaveProperty("passwordHash");
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe("authService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user data on successful login", async () => {
    const { hashPassword } = await import("@/lib/auth/crypto");
    const realHash = await hashPassword("SecurePass1");
    mockUserRepo.findByEmail.mockResolvedValue({ ...baseUserWithHash, passwordHash: realHash });
    mockSessionRepo.create.mockResolvedValue({});

    const result = await authService.login({ email: "test@example.com", password: "SecurePass1" });

    expect(result.email).toBe("test@example.com");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("throws UnauthorizedError for non-existent user", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: "nobody@example.com", password: "Pass1234" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError for wrong password", async () => {
    const { hashPassword } = await import("@/lib/auth/crypto");
    const realHash = await hashPassword("CorrectPass1");
    mockUserRepo.findByEmail.mockResolvedValue({ ...baseUserWithHash, passwordHash: realHash });

    await expect(
      authService.login({ email: "test@example.com", password: "WrongPass1" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("allows login with unverified email (verification is not enforced at login)", async () => {
    const { hashPassword } = await import("@/lib/auth/crypto");
    const realHash = await hashPassword("SecurePass1");
    mockUserRepo.findByEmail.mockResolvedValue({ ...baseUserWithHash, passwordHash: realHash, emailVerified: false });
    mockSessionRepo.create.mockResolvedValue({});

    // Login succeeds — email verification is a soft gate (UI warns, but login is allowed)
    const result = await authService.login({ email: "test@example.com", password: "SecurePass1" });
    expect(result.emailVerified).toBe(false);
  });

  it("throws ForbiddenError for suspended account", async () => {
    const { hashPassword } = await import("@/lib/auth/crypto");
    const realHash = await hashPassword("SecurePass1");
    mockUserRepo.findByEmail.mockResolvedValue({ ...baseUserWithHash, passwordHash: realHash, status: "SUSPENDED" });

    await expect(
      authService.login({ email: "test@example.com", password: "SecurePass1" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws UnauthorizedError for deleted user", async () => {
    const { hashPassword } = await import("@/lib/auth/crypto");
    const realHash = await hashPassword("SecurePass1");
    mockUserRepo.findByEmail.mockResolvedValue({ ...baseUserWithHash, passwordHash: realHash, deletedAt: new Date() });

    await expect(
      authService.login({ email: "test@example.com", password: "SecurePass1" }),
    ).rejects.toThrow(UnauthorizedError);
  });
});

// ─── verifyEmail ──────────────────────────────────────────────────────────────

describe("authService.verifyEmail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("verifies email for valid unused unexpired token", async () => {
    mockTokenRepo.findByToken.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      type: "EMAIL_VERIFICATION",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "user-1", email: "test@example.com", name: "Test" },
    });
    mockUserRepo.verifyEmail.mockResolvedValue(baseUser);
    mockTokenRepo.markUsed.mockResolvedValue({});

    await expect(authService.verifyEmail("valid-token")).resolves.not.toThrow();
    expect(mockUserRepo.verifyEmail).toHaveBeenCalledWith("user-1");
    expect(mockTokenRepo.markUsed).toHaveBeenCalledWith("tok-1");
  });

  it("throws InvalidTokenError for expired token", async () => {
    mockTokenRepo.findByToken.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      type: "EMAIL_VERIFICATION",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      user: { id: "user-1", email: "test@example.com", name: "Test" },
    });

    await expect(authService.verifyEmail("expired-token")).rejects.toThrow(InvalidTokenError);
  });

  it("throws InvalidTokenError for already-used token", async () => {
    mockTokenRepo.findByToken.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      type: "EMAIL_VERIFICATION",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "user-1", email: "test@example.com", name: "Test" },
    });

    await expect(authService.verifyEmail("used-token")).rejects.toThrow(InvalidTokenError);
  });

  it("throws InvalidTokenError for non-existent token", async () => {
    mockTokenRepo.findByToken.mockResolvedValue(null);
    await expect(authService.verifyEmail("fake-token")).rejects.toThrow(InvalidTokenError);
  });

  it("throws InvalidTokenError for wrong token type", async () => {
    mockTokenRepo.findByToken.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      type: "PASSWORD_RESET",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "user-1", email: "test@example.com", name: "Test" },
    });

    await expect(authService.verifyEmail("wrong-type-token")).rejects.toThrow(InvalidTokenError);
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe("authService.resetPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates password and invalidates sessions for valid token", async () => {
    mockTokenRepo.findByToken.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      type: "PASSWORD_RESET",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "user-1", email: "test@example.com", name: "Test" },
    });
    mockUserRepo.updatePassword.mockResolvedValue(baseUser);
    mockTokenRepo.markUsed.mockResolvedValue({});
    mockSessionRepo.deleteByUserId.mockResolvedValue({});

    await expect(authService.resetPassword("valid-token", "NewPass1234")).resolves.not.toThrow();
    expect(mockUserRepo.updatePassword).toHaveBeenCalledWith("user-1", expect.any(String));
    expect(mockSessionRepo.deleteByUserId).toHaveBeenCalledWith("user-1");
  });

  it("throws InvalidTokenError for expired reset token", async () => {
    mockTokenRepo.findByToken.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      type: "PASSWORD_RESET",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      user: { id: "user-1", email: "test@example.com", name: "Test" },
    });

    await expect(authService.resetPassword("expired-token", "NewPass1234")).rejects.toThrow(InvalidTokenError);
  });
});

// ─── sendPasswordReset ────────────────────────────────────────────────────────

describe("authService.sendPasswordReset", () => {
  beforeEach(() => vi.clearAllMocks());

  it("silently succeeds for non-existent email (prevents enumeration)", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    await expect(authService.sendPasswordReset("nobody@example.com")).resolves.not.toThrow();
    expect(mockTokenRepo.create).not.toHaveBeenCalled();
  });

  it("creates token and sends email for existing user", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(baseUserWithHash);
    mockTokenRepo.deleteByUserAndType.mockResolvedValue(undefined);
    mockTokenRepo.create.mockResolvedValue({});
    const { sendEmail } = await import("@/lib/email/mailer");

    await authService.sendPasswordReset("test@example.com");

    expect(mockTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", type: "PASSWORD_RESET" }),
    );
    expect(sendEmail).toHaveBeenCalled();
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("authService.logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes session token and clears cookie", async () => {
    const { clearSessionCookie } = await import("@/lib/auth/cookies");
    mockSessionRepo.deleteByToken.mockResolvedValue({});

    await authService.logout();

    expect(mockSessionRepo.deleteByToken).toHaveBeenCalledWith("existing-token");
    expect(clearSessionCookie).toHaveBeenCalled();
  });
});
