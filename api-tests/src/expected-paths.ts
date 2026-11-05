import type { Schema } from "@api/client";

/** A status of the spec. */
export type Status = Schema<"JobOfferStatus">;
/** A transition action of the spec. */
export type Action = Schema<"TransitionAction">;
/** The three workflow flags of a company. */
export type Flags = Required<Schema<"UpdateCompanyConfigurationRequest">>;

/** Every status, in workflow order. */
export const STATUSES: Status[] = [
  "DRAFT",
  "TO_FINALIZE",
  "TO_APPROVE",
  "TO_POST",
  "PUBLISHED",
  "CLOSED",
];

/** The statuses the spec lets an offer be updated in. */
export const EDITABLE: Status[] = ["DRAFT", "TO_FINALIZE"];

/** The statuses the spec lets an offer be deleted in. */
export const DELETABLE: Status[] = ["DRAFT"];

/** The workflow of a company that never configured one. */
export const NO_FLAGS: Flags = {
  approvalRequired: false,
  partialSaveEnabled: false,
  manualPostingRequired: false,
};

/** The actions the spec allows from each status. */
export const VALID_ACTIONS: Record<Status, Action[]> = {
  DRAFT: ["submit"],
  TO_FINALIZE: ["finalize", "withdraw"],
  TO_APPROVE: ["approve", "reject", "withdraw"],
  TO_POST: ["post", "withdraw"],
  PUBLISHED: ["close"],
  CLOSED: ["reopen"],
};

/** The action that moves an offer forward from each status; CLOSED is the end. */
export const FORWARD: Partial<Record<Status, Action>> = {
  DRAFT: "submit",
  TO_FINALIZE: "finalize",
  TO_APPROVE: "approve",
  TO_POST: "post",
  PUBLISHED: "close",
};

/** The flag that makes each optional status reachable. */
export const REACHED_WITH: Partial<Record<Status, Partial<Flags>>> = {
  TO_FINALIZE: { partialSaveEnabled: true },
  TO_APPROVE: { approvalRequired: true },
  TO_POST: { manualPostingRequired: true },
};

/** Flags from a truth-table row: approvalRequired, partialSaveEnabled, manualPostingRequired. */
export const flags = ([
  approvalRequired,
  partialSaveEnabled,
  manualPostingRequired,
]: Row): Flags => ({
  approvalRequired,
  partialSaveEnabled,
  manualPostingRequired,
});
type Row = readonly [boolean, boolean, boolean];

/** For each flag combination, the statuses a complete offer passes after submit, up to PUBLISHED. */
export const HAPPY_PATHS: { flags: Row; path: Status[] }[] = [
  { flags: [false, false, false], path: ["PUBLISHED"] },
  { flags: [false, false, true], path: ["TO_POST", "PUBLISHED"] },
  { flags: [false, true, false], path: ["TO_FINALIZE", "PUBLISHED"] },
  { flags: [false, true, true], path: ["TO_FINALIZE", "TO_POST", "PUBLISHED"] },
  { flags: [true, false, false], path: ["TO_APPROVE", "PUBLISHED"] },
  { flags: [true, false, true], path: ["TO_APPROVE", "TO_POST", "PUBLISHED"] },
  { flags: [true, true, false], path: ["TO_FINALIZE", "TO_APPROVE", "PUBLISHED"] },
  { flags: [true, true, true], path: ["TO_FINALIZE", "TO_APPROVE", "TO_POST", "PUBLISHED"] },
];

/** Pairs the spec refuses with 400 INVALID_TRANSITION. */
export const INVALID_TRANSITIONS: { status: Status; action: Action }[] = [
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
