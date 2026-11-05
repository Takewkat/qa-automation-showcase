import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodType } from "zod";

import * as domain from "./state-machine";
import * as store from "./store";
import * as schema from "./validation";

type Env = { Variables: { companyId: string } };

const now = (): string => new Date().toISOString();
const fail = (status: ContentfulStatusCode, body: object): HTTPException =>
  new HTTPException(status, { res: Response.json(body, { status }) });
const httpError = (status: ContentfulStatusCode, code: string, message: string, details?: object) =>
  fail(status, { code, message, details });
const badRequest = (message: string): HTTPException => httpError(400, "BAD_REQUEST", message);
const invalidState = (verb: string, offer: domain.Offer, allowedStatuses: domain.Status[]) =>
  httpError(409, "INVALID_STATE", `Cannot ${verb} job offer in ${offer.status} status`, {
    currentStatus: offer.status,
    allowedStatuses,
  });
const invalidTransition = (offer: domain.Offer, action: domain.Action): HTTPException =>
  httpError(400, "INVALID_TRANSITION", `Cannot perform '${action}' from ${offer.status} status`, {
    currentStatus: offer.status,
    requestedAction: action,
    validActions: domain.validActions(offer.status),
  });

/** The JSON object the text holds; malformed JSON or a non-object is a 400. */
function parseJson(text: string): object {
  const body = schema.jsonObject(text);
  if (!body) throw badRequest("Request body must be a JSON object");
  return body;
}

/** The body the schema accepts: a 400 when missing, a 422 when it violates the schema. */
async function parseBody<T>(c: Context<Env>, shape: ZodType<T>): Promise<T> {
  const text = await c.req.text();
  if (!text) throw badRequest("Request body is required");
  const result = shape.safeParse(parseJson(text), { reportInput: true });
  if (!result.success) throw fail(422, schema.validationError(result.error));
  return result.data;
}

/** The transition body; a field not sent is the Error shape every transition 422 has, an invalid one a ValidationError. */
async function parseTransition(c: Context<Env>, action: domain.Action) {
  const body = await c.req.text().then((text) => (text ? parseJson(text) : {}));
  const result = schema.transitionRequest(action).safeParse(body, { reportInput: true });
  if (result.success) return result.data;
  const missingFields = schema.missingOf(result.error);
  if (missingFields.length === 0) throw fail(422, schema.validationError(result.error));
  throw httpError(422, "VALIDATION_ERROR", "Transition requirements not met", { missingFields });
}

/** The company's offer the path names: a malformed id is a 400, an unknown or another company's a 404. */
function offerOf(c: Context<Env>): domain.Offer {
  const id = c.req.param("jobOfferId") ?? "";
  if (!schema.isUuid(id)) throw badRequest(`Invalid job offer id: '${id}'`);
  const offer = store.findOffer(c.get("companyId"), id);
  if (!offer) throw httpError(404, "NOT_FOUND", `Job offer not found: ${id}`);
  return offer;
}

/** The transition action the path names, or a 400. */
function actionOf(c: Context<Env>): domain.Action {
  const action = schema.ACTION.safeParse(c.req.param("action"));
  if (!action.success) throw badRequest(`Unknown transition action: '${c.req.param("action")}'`);
  return action.data;
}

/** The path's company, which must be the header's: anything else is a 403 before any lookup. */
function companyOf(c: Context<Env>): string {
  const id = c.req.param("companyId") ?? "";
  if (id !== c.get("companyId")) throw httpError(403, "FORBIDDEN", `Not your company: ${id}`);
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

/** The reference stub: /health for the webServer probe, the spec's routes under /api/v1. */
export const app = new Hono<Env>();
app.get("/health", (c) => c.json({ status: "ok" }));
app.notFound((c) => c.json({ code: "NOT_FOUND", message: `No route: ${c.req.path}` }, 404));
app.onError((error, c) =>
  error instanceof HTTPException
    ? error.getResponse()
    : c.json({ code: "INTERNAL_ERROR", message: error.message }, 500),
);

const api = app.basePath("/api/v1");

api.use(async (c, next) => {
  const header = c.req.header("X-Company-Id");
  if (!header) throw httpError(401, "UNAUTHORIZED", "Missing required header: X-Company-Id");
  if (!schema.isUuid(header)) throw badRequest(`Invalid X-Company-Id header: '${header}'`);
  c.set("companyId", header);
  await next();
});

api.get("/job-offers", (c) => {
  const query = schema.LIST_QUERY.safeParse({ ...c.req.query(), status: c.req.queries("status") });
  if (!query.success) throw badRequest(`Invalid query parameters: ${schema.describe(query.error)}`);
  const { page, size } = query.data;
  const { content, total } = store.listOffers(c.get("companyId"), query.data);
  const body = { content: content.map(summary), page, size, totalElements: total };
  return c.json({ ...body, totalPages: Math.ceil(total / size) });
});

api.post("/job-offers", async (c) => {
  const body = await parseBody(c, schema.CREATE_JOB_OFFER);
  const companyId = c.get("companyId");
  const at = now();
  const flags = store.getConfiguration(companyId, at);
  const offer = store.createOffer(domain.draft(companyId, body, at), flags);
  c.header("Location", new URL(`/api/v1/job-offers/${offer.id}`, c.req.url).href);
  return c.json(present(offer), 201);
});

api.get("/job-offers/:jobOfferId", (c) => c.json(present(offerOf(c))));

api.put("/job-offers/:jobOfferId", async (c) => {
  const offer = offerOf(c);
  if (!domain.EDITABLE.includes(offer.status)) throw invalidState("update", offer, domain.EDITABLE);
  const body = await parseBody(c, schema.UPDATE_JOB_OFFER);
  return c.json(present(store.saveOffer({ ...offer, ...body, updatedAt: now() })));
});

api.delete("/job-offers/:jobOfferId", (c) => {
  const offer = offerOf(c);
  if (offer.status !== "DRAFT") throw invalidState("delete", offer, ["DRAFT"]);
  store.deleteOffer(offer.id);
  return c.body(null, 204);
});

api.get("/job-offers/:jobOfferId/transitions", (c) => {
  const offer = offerOf(c);
  const transitions = domain.availableTransitions(offer.status, store.flagsOf(offer.id));
  return c.json({ currentStatus: offer.status, transitions });
});

api.post("/job-offers/:jobOfferId/transitions/:action", async (c) => {
  const action = actionOf(c);
  const offer = offerOf(c);
  const flags = store.flagsOf(offer.id);
  if (!domain.validActions(offer.status).includes(action)) throw invalidTransition(offer, action);
  const body = await parseTransition(c, action);
  const missingFields = domain.blockers(offer, action, flags);
  if (missingFields.length > 0) {
    throw httpError(422, "INCOMPLETE_OFFER", `Cannot ${action} incomplete job offer`, {
      missingFields,
    });
  }
  const next = store.saveOffer(domain.transition(offer, flags, action, now()));
  store.appendHistory(offer.id, domain.historyEntry(offer, next, action, c.get("companyId"), body));
  return c.json(present(next));
});

api.get("/job-offers/:jobOfferId/history", (c) => c.json(store.getHistory(offerOf(c).id)));

api.get("/companies/:companyId/configuration", (c) =>
  c.json(store.getConfiguration(companyOf(c), now())),
);

api.put("/companies/:companyId/configuration", async (c) => {
  const companyId = companyOf(c);
  const body = await parseBody(c, schema.UPDATE_CONFIGURATION);
  const configuration = { ...domain.DEFAULT_FLAGS, ...body, companyId, updatedAt: now() };
  return c.json(store.saveConfiguration(configuration));
});
