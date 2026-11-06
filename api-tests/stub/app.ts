import type { ZodType } from "zod";

import { badRequest, httpError, invalidState, invalidTransition } from "./errors.ts";
import { HttpError, type Reply, type Request, Router } from "./router.ts";
import * as domain from "./state-machine.ts";
import * as store from "./store.ts";
import * as schema from "./validation.ts";

const now = (): string => new Date().toISOString();
const ok = (body: unknown, status = 200): Reply => ({ status, body });

/** The JSON object the text holds; malformed JSON or a non-object is a 400. */
function parseJson(text: string): object {
  const body = schema.jsonObject(text);
  if (!body) throw badRequest("Request body must be a JSON object");
  return body;
}

/** The body the schema accepts: missing is a 400; a violation is a 422 ValidationError, or a 400 where the spec documents no 422. */
function parseBody<T>(text: string, shape: ZodType<T>, violation = 422): T {
  if (!text) throw badRequest("Request body is required");
  const result = shape.safeParse(parseJson(text), { reportInput: true });
  if (result.success) return result.data;
  if (violation === 400) throw badRequest(`Invalid body: ${schema.describe(result.error)}`);
  throw new HttpError(422, schema.validationError(result.error));
}

/** The transition body; a field not sent is the Error shape every transition 422 has, an invalid one a ValidationError. */
function parseTransition(text: string, action: domain.Action) {
  const body = text ? parseJson(text) : {};
  const result = schema.transitionRequest(action).safeParse(body, { reportInput: true });
  if (result.success) return result.data;
  const missingFields = schema.missingOf(result.error);
  if (missingFields.length === 0) throw new HttpError(422, schema.validationError(result.error));
  throw httpError(422, "VALIDATION_ERROR", "Transition requirements not met", { missingFields });
}

/** The list query, or a 400 naming the bad parameter. */
function parseListQuery(query: URLSearchParams): schema.ListQuery {
  const result = schema.listQuery(query);
  if (!result.success)
    throw badRequest(`Invalid query parameters: ${schema.describe(result.error)}`);
  return result.data;
}

/** The header every /api/v1 call needs: missing is a 401, malformed a 400. */
function tenant(request: Request): string {
  const header = request.headers["x-company-id"];
  if (!header) throw httpError(401, "UNAUTHORIZED", "Missing required header: X-Company-Id");
  if (!schema.isUuid(header)) throw badRequest(`Invalid X-Company-Id header: '${header}'`);
  return header;
}

/** The company's offer the path names: a malformed id is a 400, an unknown or another company's a 404. */
function offerOf(request: Request, companyId: string): domain.Offer {
  const id = request.params.jobOfferId ?? "";
  if (!schema.isUuid(id)) throw badRequest(`Invalid job offer id: '${id}'`);
  const offer = store.findOffer(companyId, id);
  if (!offer) throw httpError(404, "NOT_FOUND", `Job offer not found: ${id}`);
  return offer;
}

/** The transition action the path names, or a 400. */
function actionOf(request: Request): domain.Action {
  const action = schema.ACTION.safeParse(request.params.action);
  if (!action.success) throw badRequest(`Unknown transition action: '${request.params.action}'`);
  return action.data;
}

/** The path's company, which must be the header's: anything else is a 403 before any lookup. */
function companyOf(request: Request, companyId: string): string {
  const id = request.params.companyId ?? "";
  if (id !== companyId) throw httpError(403, "FORBIDDEN", `Not your company: ${id}`);
  return id;
}

/** The JobOffer response: the stored fields plus the computed ones. */
const present = (offer: domain.Offer) => ({
  ...offer,
  availableTransitions: domain.validActions(offer.status),
  isComplete: domain.isComplete(offer.compensation),
});

/** The JobOfferSummary of a list row: these fields of the offer, plus the city of its location. */
const SUMMARY_KEYS = ["id", "companyId", "title", "status", "createdAt", "publishedAt"] as const;
const summary = (offer: domain.Offer) => ({
  ...Object.fromEntries(SUMMARY_KEYS.map((key) => [key, offer[key]])),
  locationCity: domain.cityOf(offer.location),
});

/** The reference stub: /health for the webServer probe, the spec's routes under /api/v1, each as a company. */
const router = new Router().on("GET", "/health", () => ok({ status: "ok" }));
const route = (
  method: string,
  path: string,
  handle: (request: Request, companyId: string) => Reply,
) => router.on(method, `/api/v1${path}`, (request) => handle(request, tenant(request)));

route("GET", "/job-offers", (request, companyId) => {
  const query = parseListQuery(request.query);
  const { content, total } = store.listOffers(companyId, query);
  const { page, size } = query;
  const body = { content: content.map(summary), page, size, totalElements: total };
  return ok({ ...body, totalPages: Math.ceil(total / size) });
});

route("POST", "/job-offers", (request, companyId) => {
  const body = parseBody(request.text, schema.CREATE_JOB_OFFER);
  const at = now();
  const flags = store.getConfiguration(companyId, at);
  const offer = store.createOffer(domain.draft(companyId, body, at), flags);
  const location = new URL(`/api/v1/job-offers/${offer.id}`, request.url).href;
  return { status: 201, body: present(offer), headers: { location } };
});

route("GET", "/job-offers/:jobOfferId", (request, companyId) =>
  ok(present(offerOf(request, companyId))),
);

route("PUT", "/job-offers/:jobOfferId", (request, companyId) => {
  const offer = offerOf(request, companyId);
  if (!domain.EDITABLE.includes(offer.status)) throw invalidState("update", offer, domain.EDITABLE);
  const body = parseBody(request.text, schema.UPDATE_JOB_OFFER);
  return ok(present(store.saveOffer({ ...offer, ...body, updatedAt: now() })));
});

route("DELETE", "/job-offers/:jobOfferId", (request, companyId) => {
  const offer = offerOf(request, companyId);
  if (offer.status !== "DRAFT") throw invalidState("delete", offer, ["DRAFT"]);
  store.deleteOffer(offer.id);
  return { status: 204 };
});

route("GET", "/job-offers/:jobOfferId/transitions", (request, companyId) => {
  const offer = offerOf(request, companyId);
  const transitions = domain.availableTransitions(offer.status, store.flagsOf(offer.id));
  return ok({ currentStatus: offer.status, transitions });
});

route("POST", "/job-offers/:jobOfferId/transitions/:action", (request, companyId) => {
  const action = actionOf(request);
  const offer = offerOf(request, companyId);
  const flags = store.flagsOf(offer.id);
  if (!domain.validActions(offer.status).includes(action)) throw invalidTransition(offer, action);
  const body = parseTransition(request.text, action);
  const missingFields = domain.blockers(offer, action, flags);
  if (missingFields.length > 0) {
    throw httpError(422, "INCOMPLETE_OFFER", `Cannot ${action} incomplete job offer`, {
      missingFields,
    });
  }
  const next = store.saveOffer(domain.transition(offer, flags, action, now()));
  store.appendHistory(offer.id, domain.historyEntry(offer, next, action, companyId, body));
  return ok(present(next));
});

route("GET", "/job-offers/:jobOfferId/history", (request, companyId) =>
  ok(store.getHistory(offerOf(request, companyId).id)),
);

route("GET", "/companies/:companyId/configuration", (request, companyId) =>
  ok(store.getConfiguration(companyOf(request, companyId), now())),
);

route("PUT", "/companies/:companyId/configuration", (request, companyId) => {
  const id = companyOf(request, companyId);
  const body = parseBody(request.text, schema.UPDATE_CONFIGURATION, 400);
  const configuration = { ...domain.DEFAULT_FLAGS, ...body, companyId: id, updatedAt: now() };
  return ok(store.saveConfiguration(configuration));
});

export const app = router.listener();
