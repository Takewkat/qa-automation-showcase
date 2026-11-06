import type { JobOfferStatus, TransitionAction } from "@job-offer/api";
import { JOB_OFFER_STATUSES, type WorkflowFlags } from "@job-offer/enum/job-offer.enum";

/** The workflow of a company that never configured one. */
export const NO_FLAGS: WorkflowFlags = {
  approvalRequired: false,
  partialSaveEnabled: false,
  manualPostingRequired: false,
};

/** The workflow with every optional step on. */
export const ALL_FLAGS: WorkflowFlags = {
  approvalRequired: true,
  partialSaveEnabled: true,
  manualPostingRequired: true,
};

/** The actions the spec allows from each status. */
export const VALID_ACTIONS: Record<JobOfferStatus, TransitionAction[]> = {
  DRAFT: ["submit"],
  TO_FINALIZE: ["finalize", "withdraw"],
  TO_APPROVE: ["approve", "reject", "withdraw"],
  TO_POST: ["post", "withdraw"],
  PUBLISHED: ["close"],
  CLOSED: ["reopen"],
};

/** The statuses the spec lets an offer be updated in. */
export const EDITABLE: JobOfferStatus[] = ["DRAFT", "TO_FINALIZE"];

/** The statuses the spec lets an offer be deleted in. */
export const DELETABLE: JobOfferStatus[] = ["DRAFT"];

/** The statuses an offer can be withdrawn from, back to DRAFT. */
export const WITHDRAWABLE = JOB_OFFER_STATUSES.filter((status) =>
  VALID_ACTIONS[status].includes("withdraw"),
);

const FORWARD: Partial<Record<JobOfferStatus, TransitionAction>> = {
  DRAFT: "submit",
  TO_FINALIZE: "finalize",
  TO_APPROVE: "approve",
  TO_POST: "post",
  PUBLISHED: "close",
};

/** The action that moves an offer forward from the status; throws at the end of the workflow. */
export function forward(status: JobOfferStatus): TransitionAction {
  const action = FORWARD[status];
  if (!action) throw new Error(`no forward action from ${status}`);
  return action;
}

/** The flag that makes each optional status reachable. */
export const REACHED_WITH: Partial<Record<JobOfferStatus, Partial<WorkflowFlags>>> = {
  TO_FINALIZE: { partialSaveEnabled: true },
  TO_APPROVE: { approvalRequired: true },
  TO_POST: { manualPostingRequired: true },
};

/** One row per flag combination: the flags on, and the statuses a complete offer passes to PUBLISHED. */
export const HAPPY_PATHS: { on: (keyof WorkflowFlags)[]; path: JobOfferStatus[] }[] = [
  { on: [], path: ["PUBLISHED"] },
  { on: ["manualPostingRequired"], path: ["TO_POST", "PUBLISHED"] },
  { on: ["partialSaveEnabled"], path: ["TO_FINALIZE", "PUBLISHED"] },
  {
    on: ["partialSaveEnabled", "manualPostingRequired"],
    path: ["TO_FINALIZE", "TO_POST", "PUBLISHED"],
  },
  { on: ["approvalRequired"], path: ["TO_APPROVE", "PUBLISHED"] },
  {
    on: ["approvalRequired", "manualPostingRequired"],
    path: ["TO_APPROVE", "TO_POST", "PUBLISHED"],
  },
  {
    on: ["approvalRequired", "partialSaveEnabled"],
    path: ["TO_FINALIZE", "TO_APPROVE", "PUBLISHED"],
  },
  {
    on: ["approvalRequired", "partialSaveEnabled", "manualPostingRequired"],
    path: ["TO_FINALIZE", "TO_APPROVE", "TO_POST", "PUBLISHED"],
  },
];

/** The flags of a happy-path row: the named ones on, the rest off. */
export const flagsOf = (row: { on: (keyof WorkflowFlags)[] }): WorkflowFlags => ({
  ...NO_FLAGS,
  ...Object.fromEntries(row.on.map((flag) => [flag, true])),
});

/** Pairs the spec refuses with 400 INVALID_TRANSITION. */
export const INVALID_TRANSITIONS: { status: JobOfferStatus; action: TransitionAction }[] = [
  { status: "DRAFT", action: "approve" },
  { status: "DRAFT", action: "finalize" },
  { status: "DRAFT", action: "close" },
  { status: "TO_APPROVE", action: "post" },
  { status: "TO_POST", action: "approve" },
  { status: "PUBLISHED", action: "submit" },
  { status: "PUBLISHED", action: "withdraw" },
  { status: "CLOSED", action: "close" },
  { status: "CLOSED", action: "withdraw" },
];
