import { z } from "zod";

import { ACTIONS, STATUSES, type Action } from "./state-machine.ts";

const SALARY_TYPES = ["HOURLY", "DAILY", "MONTHLY", "YEARLY"] as const;
const BONUS_TYPES = ["SIGNING", "PERFORMANCE", "ANNUAL", "OTHER"] as const;
const SORTS = [
  "createdAt",
  "-createdAt",
  "updatedAt",
  "-updatedAt",
  "title",
  "-title",
  "publishedAt",
  "-publishedAt",
] as const;

const ADDRESS = z.object({
  lines: z.array(z.string().max(100)).max(3).optional(),
  postalCode: z.string().max(20).optional(),
  city: z.string().max(100),
  region: z.string().max(100).optional(),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
});
const LOCATION = z.discriminatedUnion("type", [
  z.object({ type: z.literal("COMPANY_ADDRESS") }),
  z.object({ type: z.literal("CUSTOM"), address: ADDRESS }),
]);
const MONEY = { amount: z.number().min(0), currency: z.string().regex(/^[A-Z]{3}$/) };
const SALARY_ENTRY = z.object({ type: z.enum(SALARY_TYPES), ...MONEY });
const BONUS_ENTRY = z.object({
  type: z.enum(BONUS_TYPES),
  ...MONEY,
  description: z.string().max(200).optional(),
});
const COMPENSATION = z.object({
  salaryEntries: z.array(SALARY_ENTRY).optional(),
  bonusEntries: z.array(BONUS_ENTRY).optional(),
});
const REASON = z.string().max(500);
const REQUIRED_REASON = z
  .string({ error: (issue) => (issue.input === undefined ? "is required for reject" : undefined) })
  .max(500);
const INTEGER = z.string().min(1).transform(Number);

/** The transition action a path can name. */
export const ACTION = z.enum(ACTIONS);

/** CreateJobOfferRequest; completeness is not checked here, a valid body always makes a DRAFT. */
export const CREATE_JOB_OFFER = z.object({
  title: z.string().min(1).max(200),
  location: LOCATION,
  compensation: COMPENSATION.optional(),
});

/** UpdateJobOfferRequest: every field optional, a present field replaces the stored one. */
export const UPDATE_JOB_OFFER = CREATE_JOB_OFFER.partial();

/** UpdateCompanyConfigurationRequest: three optional flags. */
export const UPDATE_CONFIGURATION = z.object({
  approvalRequired: z.boolean().optional(),
  partialSaveEnabled: z.boolean().optional(),
  manualPostingRequired: z.boolean().optional(),
});

/** The listJobOffers query with the spec's defaults; status is the repeated parameter form. */
export const LIST_QUERY = z.object({
  page: INTEGER.pipe(z.number().int().min(0)).default(0),
  size: INTEGER.pipe(z.number().int().min(1).max(100)).default(20),
  status: z.array(z.enum(STATUSES)).optional(),
  titleContains: z.string().max(100).optional(),
  locationCity: z.string().max(100).optional(),
  createdAfter: z.iso.datetime({ offset: true }).optional(),
  createdBefore: z.iso.datetime({ offset: true }).optional(),
  sort: z.enum(SORTS).default("-createdAt"),
});

/** TransitionRequest; the reason is required for reject only. */
export const transitionRequest = (action: Action) =>
  z.object({
    reason: action === "reject" ? REQUIRED_REASON : REASON.optional(),
    comment: z.string().max(1000).optional(),
  });

/** A validated location. */
export type Location = z.infer<typeof LOCATION>;
/** A validated compensation. */
export type Compensation = z.infer<typeof COMPENSATION>;
/** A validated list query, defaults applied. */
export type ListQuery = z.infer<typeof LIST_QUERY>;
