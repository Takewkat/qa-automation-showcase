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

/** The spec's format: uuid, as lenient as the contract validator: any 8-4-4-4-12 hex. */
export const isUuid = (value: string): boolean => z.guid().safeParse(value).success;

/** The JSON object the text holds, or undefined for malformed JSON and non-objects. */
export const jsonObject = (text: string): object | undefined => {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

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

/** A query integer: a non-empty string of digits; anything else fails downstream. */
const INTEGER = z.string().min(1).transform(Number);

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

/** The list query as the schema reads it: `status` repeats, the other keys do not. */
export const listQuery = (query: URLSearchParams) => {
  const status = query.getAll("status");
  const scalars = Object.fromEntries(Array.from(query.keys(), (key) => [key, query.get(key)]));
  return LIST_QUERY.safeParse({ ...scalars, status: status.length ? status : undefined });
};

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
/** One entry of the spec's ValidationError.fieldErrors. */
export type FieldError = { field: string; message: string; rejectedValue?: unknown };
/** The spec's ValidationError body. */
export type ValidationErrorBody = {
  code: "VALIDATION_ERROR";
  message: string;
  fieldErrors: FieldError[];
};

/** The spec's path form of a zod issue path: compensation.salaryEntries[0].amount. */
const fieldPath = (path: PropertyKey[]): string =>
  path.reduce<string>((acc, key) => {
    if (typeof key === "number") return `${acc}[${key}]`;
    return acc ? `${acc}.${String(key)}` : String(key);
  }, "");

/** The spec's ValidationError body: one field error per zod issue, with the rejected value when there is one. */
export function validationError(error: z.ZodError): ValidationErrorBody {
  const fieldErrors = error.issues.map((issue) => ({
    field: fieldPath(issue.path),
    message: issue.message,
    rejectedValue: issue.input,
  }));
  return { code: "VALIDATION_ERROR", message: "Request validation failed", fieldErrors };
}

/** The dotted paths of the fields the request did not send at all. */
export const missingOf = (error: z.ZodError): string[] =>
  error.issues.filter((issue) => issue.input === undefined).map((issue) => fieldPath(issue.path));

/** One line naming each invalid value, for a BAD_REQUEST message. */
export const describe = (error: z.ZodError): string =>
  error.issues.map((issue) => `${fieldPath(issue.path)}: ${issue.message}`).join("; ");
