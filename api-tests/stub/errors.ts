import { HttpError } from "./router.ts";
import { type Action, type Offer, type Status, validActions } from "./state-machine.ts";

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
