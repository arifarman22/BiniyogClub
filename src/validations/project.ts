import { z } from "zod";

const ProjectCategoryEnum = z.enum([
  "REAL_ESTATE", "TRADE_FINANCE", "SME", "TECHNOLOGY", "INFRASTRUCTURE", "OTHER",
]);

const ReturnTypeEnum = z.enum(["FIXED_RETURN", "PROFIT_SHARE", "HYBRID"]);

const bdtPositive = z.coerce.number({ error: "Must be a number" }).positive("Must be greater than 0");

export const projectSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters").max(200),
    category: ProjectCategoryEnum,
    description: z.string().min(50, "Description must be at least 50 characters").max(5000),
    location: z.string().min(2, "Location is required").max(200),
    managerId: z.string().uuid("Invalid manager").optional().nullable(),
    fundingGoalBdt: bdtPositive,
    fundingMinBdt: bdtPositive,
    minInvestmentBdt: bdtPositive,
    maxInvestmentBdt: z.coerce.number().positive().optional().nullable(),
    returnType: ReturnTypeEnum,
    expectedReturnPct: z.coerce.number().min(0.01, "Return must be > 0").max(100, "Return cannot exceed 100%"),
    durationDays: z.coerce.number().int().min(1).max(3650),
    fundingDeadline: z.coerce.date({ error: "Invalid date" }),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    riskInfo: z.string().max(2000).optional().nullable(),
    coverImageUrl: z.string().url("Invalid URL").optional().nullable(),
    imageUrls: z.array(z.string().url()).max(10).optional().default([]),
    groupId: z.string().uuid("Invalid group").optional().nullable(),
  })
  .refine((d) => d.fundingMinBdt <= d.fundingGoalBdt, {
    message: "Minimum funding cannot exceed goal",
    path: ["fundingMinBdt"],
  })
  .refine((d) => d.minInvestmentBdt <= d.fundingGoalBdt, {
    message: "Min investment cannot exceed funding goal",
    path: ["minInvestmentBdt"],
  })
  .refine((d) => !d.maxInvestmentBdt || d.maxInvestmentBdt >= d.minInvestmentBdt, {
    message: "Max investment must be ≥ min investment",
    path: ["maxInvestmentBdt"],
  })
  .refine((d) => d.fundingDeadline > new Date(), {
    message: "Funding deadline must be in the future",
    path: ["fundingDeadline"],
  });

export const projectUpdateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  category: ProjectCategoryEnum.optional(),
  description: z.string().min(50).max(5000).optional(),
  location: z.string().min(2).max(200).optional(),
  managerId: z.string().uuid().optional().nullable(),
  fundingGoalBdt: bdtPositive.optional(),
  fundingMinBdt: bdtPositive.optional(),
  minInvestmentBdt: bdtPositive.optional(),
  maxInvestmentBdt: z.coerce.number().positive().optional().nullable(),
  returnType: ReturnTypeEnum.optional(),
  expectedReturnPct: z.coerce.number().min(0.01).max(100).optional(),
  durationDays: z.coerce.number().int().min(1).max(3650).optional(),
  fundingDeadline: z.coerce.date().optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  riskInfo: z.string().max(2000).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  groupId: z.string().uuid().optional().nullable(),
});

export const statusTransitionSchema = z.object({
  projectId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
