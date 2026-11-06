import { z, type ZodType } from "zod";

import * as schema from "../domain/schemas.ts";
import * as domain from "../domain/state-machine.ts";
import * as store from "../store/memory.ts";
import { badRequest, describe, httpError, missingOf, unprocessable } from "./errors.ts";
import type { Request } from "./router.ts";

/** The spec's format: uuid, as lenient as the contract validator: any 8-4-4-4-12 hex. */
const isUuid = (value: string): boolean => z.guid().safeParse(value).success;

/** The JSON object the text holds, or undefined for malformed JSON and non-objects. */
const jsonObject = (text: string): object | undefined => {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

/** The JSON object the text holds; malformed JSON or a non-object is a 400. */
function parseJson(text: string): object {
  const body = jsonObject(text);
  if (!body) throw badRequest("Request body must be a JSON object");
  return body;
}

/** The parsed body; missing is a 400, a schema violation a 422, or a 400 where the spec has no 422. */
export function parseBody<T>(text: string, shape: ZodType<T>, violation = 422): T {
  if (!text) throw badRequest("Request body is required");
  const result = shape.safeParse(parseJson(text), { reportInput: true });
  if (result.success) return result.data;
  if (violation === 400) throw badRequest(`Invalid body: ${describe(result.error)}`);
  throw unprocessable(result.error);
}

/** The transition body: a missing field gives the Error shape, an invalid one a ValidationError. */
export function parseTransition(text: string, action: domain.Action) {
  const body = text ? parseJson(text) : {};
  const result = schema.transitionRequest(action).safeParse(body, { reportInput: true });
  if (result.success) return result.data;
  const missingFields = missingOf(result.error);
  if (missingFields.length === 0) throw unprocessable(result.error);
  throw httpError(422, "VALIDATION_ERROR", "Transition requirements not met", { missingFields });
}

/** The list query as the schema reads it (status repeats, the other keys do not), or a 400 naming the bad parameter. */
export function parseListQuery(query: URLSearchParams): schema.ListQuery {
  const status = query.getAll("status");
  const scalars = Object.fromEntries(Array.from(query.keys(), (key) => [key, query.get(key)]));
  const result = schema.LIST_QUERY.safeParse({
    ...scalars,
    status: status.length ? status : undefined,
  });
  if (!result.success) throw badRequest(`Invalid query parameters: ${describe(result.error)}`);
  return result.data;
}

/** The header every /api/v1 call needs: missing is a 401, malformed a 400. */
export function tenant(request: Request): string {
  const header = request.headers["x-company-id"];
  if (!header) throw httpError(401, "UNAUTHORIZED", "Missing required header: X-Company-Id");
  if (!isUuid(header)) throw badRequest(`Invalid X-Company-Id header: '${header}'`);
  return header;
}

/** The company's offer the path names: a malformed id is a 400, an unknown or another company's a 404. */
export function offerOf(request: Request, companyId: string): domain.Offer {
  const id = request.params.jobOfferId ?? "";
  if (!isUuid(id)) throw badRequest(`Invalid job offer id: '${id}'`);
  const offer = store.findOffer(companyId, id);
  if (!offer) throw httpError(404, "NOT_FOUND", `Job offer not found: ${id}`);
  return offer;
}

/** The transition action the path names, or a 400. */
export function actionOf(request: Request): domain.Action {
  const action = schema.ACTION.safeParse(request.params.action);
  if (!action.success) throw badRequest(`Unknown transition action: '${request.params.action}'`);
  return action.data;
}

/** The path's company, which must be the header's: anything else is a 403 before any lookup. */
export function companyOf(request: Request, companyId: string): string {
  const id = request.params.companyId ?? "";
  if (id !== companyId) throw httpError(403, "FORBIDDEN", `Not your company: ${id}`);
  return id;
}
