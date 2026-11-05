import type { Compensation, Location } from "./validation";

/** The spec's JobOfferStatus values, in workflow order. */
export const STATUSES = [
  "DRAFT",
  "TO_FINALIZE",
  "TO_APPROVE",
  "TO_POST",
  "PUBLISHED",
  "CLOSED",
] as const;

/** The spec's TransitionAction values. */
export const ACTIONS = [
  "submit",
  "finalize",
  "approve",
  "reject",
  "post",
  "close",
  "reopen",
  "withdraw",
] as const;

/** A status of the spec. */
export type Status = (typeof STATUSES)[number];
/** A transition action of the spec. */
export type Action = (typeof ACTIONS)[number];
/** The three workflow flags of a company. */
export type Flags = {
  approvalRequired: boolean;
  partialSaveEnabled: boolean;
  manualPostingRequired: boolean;
};
/** A stored offer; the computed fields are added on the way out. */
export type Offer = {
  id: string;
  companyId: string;
  title: string;
  status: Status;
  location: Location;
  compensation?: Compensation;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  closedAt: string | null;
};
/** One open transition, as GET /transitions lists it. */
export type Transition = { action: Action; targetStatus: Status; requiresReason: boolean };
/** One audit entry of an offer. */
export type HistoryEntry = {
  id: string;
  fromStatus: Status;
  toStatus: Status;
  action: Action;
  performedAt: string;
  performedBy: string;
  reason: string | null;
  comment: string | null;
};
type Body = Pick<Offer, "title" | "location" | "compensation">;
type Note = { reason?: string; comment?: string };

/** The workflow of a company that never configured one: every optional step off. */
export const DEFAULT_FLAGS: Flags = {
  approvalRequired: false,
  partialSaveEnabled: false,
  manualPostingRequired: false,
};

/** The statuses an offer can still be edited in. */
export const EDITABLE: Status[] = ["DRAFT", "TO_FINALIZE"];

const VALID_ACTIONS: Record<Status, Action[]> = {
  DRAFT: ["submit"],
  TO_FINALIZE: ["finalize", "withdraw"],
  TO_APPROVE: ["approve", "reject", "withdraw"],
  TO_POST: ["post", "withdraw"],
  PUBLISHED: ["close"],
  CLOSED: ["reopen"],
};

const TARGET: Record<Action, (flags: Flags) => Status> = {
  submit: (flags) => (flags.partialSaveEnabled ? "TO_FINALIZE" : TARGET.finalize(flags)),
  finalize: (flags) => (flags.approvalRequired ? "TO_APPROVE" : TARGET.approve(flags)),
  approve: (flags) => (flags.manualPostingRequired ? "TO_POST" : "PUBLISHED"),
  post: () => "PUBLISHED",
  reject: () => "DRAFT",
  withdraw: () => "DRAFT",
  close: () => "CLOSED",
  reopen: () => "PUBLISHED",
};

/** The actions the status accepts, in the order the spec lists them. */
export const validActions = (status: Status): Action[] => VALID_ACTIONS[status];

/** Where the action lands under the flags snapshotted at creation; a step whose flag is off is skipped. */
export const targetStatus = (action: Action, flags: Flags): Status => TARGET[action](flags);

/** What a complete offer still lacks: at least one salary entry; a bonus-only offer stays incomplete. */
export const missingFields = (compensation?: Compensation): string[] =>
  compensation?.salaryEntries?.length ? [] : ["compensation.salaryEntries"];

/** Whether the offer can go through the workflow as it stands. */
export const isComplete = (compensation?: Compensation): boolean =>
  missingFields(compensation).length === 0;

/** Leaving the editable statuses for the rest of the workflow needs a complete offer. */
export const requiresComplete = (from: Status, action: Action, flags: Flags): boolean =>
  EDITABLE.includes(from) && !EDITABLE.includes(targetStatus(action, flags));

/** What the action still needs before the offer may leave the editable statuses; empty when it may proceed. */
export const blockers = (offer: Offer, action: Action, flags: Flags): string[] =>
  requiresComplete(offer.status, action, flags) ? missingFields(offer.compensation) : [];

/** The city of a custom location; the company address has none. */
export const cityOf = (location: Location): string | null =>
  location.type === "CUSTOM" ? location.address.city : null;

/** The transitions open from the status under the flags; only reject needs a reason. */
export const availableTransitions = (status: Status, flags: Flags): Transition[] =>
  validActions(status).map((action) => ({
    action,
    targetStatus: targetStatus(action, flags),
    requiresReason: action === "reject",
  }));

/** A fresh DRAFT of the body as sent, never published nor closed; completeness is not checked here. */
export const draft = (companyId: string, body: Body, now: string): Omit<Offer, "id"> => ({
  companyId,
  ...body,
  status: "DRAFT",
  createdAt: now,
  updatedAt: now,
  publishedAt: null,
  closedAt: null,
});

/** The offer after the action: publishedAt on first publication, closedAt set on close and cleared on reopen. */
export function transition(offer: Offer, flags: Flags, action: Action, now: string): Offer {
  const status = targetStatus(action, flags);
  return {
    ...offer,
    status,
    updatedAt: now,
    publishedAt: status === "PUBLISHED" ? (offer.publishedAt ?? now) : offer.publishedAt,
    closedAt: status === "CLOSED" ? now : status === "PUBLISHED" ? null : offer.closedAt,
  };
}

/** The audit entry of the transition that took the offer from one state to the next. */
export function historyEntry(
  from: Offer,
  to: Offer,
  action: Action,
  performedBy: string,
  note: Note,
): Omit<HistoryEntry, "id"> {
  return {
    fromStatus: from.status,
    toStatus: to.status,
    action,
    performedAt: to.updatedAt,
    performedBy,
    reason: note.reason ?? null,
    comment: note.comment ?? null,
  };
}
