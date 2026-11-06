import type { z } from "zod";

import { type Action, type Offer, type Status, validActions } from "../domain/state-machine.ts";
import { HttpError } from "./router.ts";

/** One entry of the spec's ValidationError.fieldErrors. */
export type FieldError = { field: string; message: string; rejectedValue?: unknown };
/** The spec's ValidationError body. */
export type ValidationErrorBody = {
  code: "VALIDATION_ERROR";
  message: string;
  fieldErrors: FieldError[];
};

/** An Error body of the spec, with the status it is sent with. */
export const httpError = (status: number, code: string, message: string, details?: object) =>
  new HttpError(status, { code, message, details });

/** A 400 BAD_REQUEST: malformed input, refused before any rule runs. */
export const badRequest = (message: string): HttpError => httpError(400, "BAD_REQUEST", message);

/** A 409 INVALID_STATE: the offer's status allows no such edit. */
export const invalidState = (verb: string, offer: Offer, allowedStatuses: Status[]): HttpError =>
  httpError(409, "INVALID_STATE", `Cannot ${verb} job offer in ${offer.status} status`, {
    currentStatus: offer.status,
    allowedStatuses,
  });

/** A 400 INVALID_TRANSITION: the action is not valid from the offer's status. */
export const invalidTransition = (offer: Offer, action: Action): HttpError =>
  httpError(400, "INVALID_TRANSITION", `Cannot perform '${action}' from ${offer.status} status`, {
    currentStatus: offer.status,
    requestedAction: action,
    validActions: validActions(offer.status),
  });

/** The spec's path form of a zod issue path: compensation.salaryEntries[0].amount. */
const fieldPath = (path: PropertyKey[]): string =>
  path.reduce<string>((acc, key) => {
    if (typeof key === "number") return `${acc}[${key}]`;
    return acc ? `${acc}.${String(key)}` : String(key);
  }, "");

/** A 422 with the spec's ValidationError body: one field error per zod issue, with the rejected value. */
export function unprocessable(error: z.ZodError): HttpError {
  const fieldErrors = error.issues.map((issue) => ({
    field: fieldPath(issue.path),
    message: issue.message,
    rejectedValue: issue.input,
  }));
  const body: ValidationErrorBody = {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    fieldErrors,
  };
  return new HttpError(422, body);
}

/** The dotted paths of the fields the request did not send at all. */
export const missingOf = (error: z.ZodError): string[] =>
  error.issues.filter((issue) => issue.input === undefined).map((issue) => fieldPath(issue.path));

/** One line naming each invalid value, for a BAD_REQUEST message. */
export const describe = (error: z.ZodError): string =>
  error.issues.map((issue) => `${fieldPath(issue.path)}: ${issue.message}`).join("; ");
