import * as schema from "../domain/schemas.ts";
import * as domain from "../domain/state-machine.ts";
import * as store from "../store/memory.ts";
import { httpError, invalidState, invalidTransition } from "./errors.ts";
import {
  actionOf,
  companyOf,
  offerOf,
  parseBody,
  parseListQuery,
  parseTransition,
  tenant,
} from "./request.ts";
import { type Reply, type Request, Router } from "./router.ts";

const now = (): string => new Date().toISOString();
const ok = (body: unknown, status = 200): Reply => ({ status, body });

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

/** The stub: /health for the webServer probe, the spec's routes under /api/v1, each as a company. */
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

/** The listener server.ts and the Playwright webServer start. */
export const app = router.listener();
