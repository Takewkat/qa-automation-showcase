import type { JobOfferStatus, UpdateCompanyConfigurationRequest } from "@job-offer/api";

/** The three workflow flags of a company. */
export type WorkflowFlags = Required<UpdateCompanyConfigurationRequest>;

/** Every status, in workflow order. */
export const JOB_OFFER_STATUSES: JobOfferStatus[] = [
  "DRAFT",
  "TO_FINALIZE",
  "TO_APPROVE",
  "TO_POST",
  "PUBLISHED",
  "CLOSED",
];

/** The error codes the suite asserts on; the others are implementation-defined. */
export const ERROR_CODES = {
  invalidState: "INVALID_STATE",
  invalidTransition: "INVALID_TRANSITION",
  incompleteOffer: "INCOMPLETE_OFFER",
  validation: "VALIDATION_ERROR",
} as const;
