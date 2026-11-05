import { expect, type APIRequestContext } from "@playwright/test";

import { validate } from "@api/contract";
import type { components, operations } from "@api/generated/schema";

/** An operationId of the spec. */
export type Operation = keyof operations;
/** A component schema of the spec, by name. */
export type Schema<N extends keyof components["schemas"]> = components["schemas"][N];
type Responses<O extends Operation> = operations[O]["responses"];
/** A status the spec documents for the operation. */
export type Status<O extends Operation> = Extract<keyof Responses<O>, number>;
/** The body the spec documents for the operation and status; void when it documents none. */
export type Body<O extends Operation, S extends Status<O>> = Responses<O>[S] extends {
  content: { "application/json": infer B };
}
  ? B
  : void;
/** The request body of the operation. */
export type Request<O extends Operation> = NonNullable<
  operations[O]["requestBody"]
>["content"]["application/json"];
type Success<O extends Operation> = Extract<Status<O>, (typeof OPERATIONS)[O][2]>;
/** A facade method: its arguments, then an optional expected status that types the returned body. */
type Call<O extends Operation, Args extends unknown[]> = <S extends Status<O> = Success<O>>(
  ...args: [...Args, options?: { expect?: S }]
) => Promise<Body<O, S>>;
type Params = { jobOfferId?: string; action?: string; companyId?: string };
/** Query values of a list call; an array repeats the key. */
export type Query = Record<string, string | number | readonly (string | number)[]>;
type Init = { data?: unknown; params?: URLSearchParams };

/** One row per operationId of the spec: method, path template, documented success status. */
export const OPERATIONS = {
  listJobOffers: ["GET", "/job-offers", 200],
  createJobOffer: ["POST", "/job-offers", 201],
  getJobOffer: ["GET", "/job-offers/{jobOfferId}", 200],
  updateJobOffer: ["PUT", "/job-offers/{jobOfferId}", 200],
  deleteJobOffer: ["DELETE", "/job-offers/{jobOfferId}", 204],
  getAvailableTransitions: ["GET", "/job-offers/{jobOfferId}/transitions", 200],
  transitionJobOffer: ["POST", "/job-offers/{jobOfferId}/transitions/{action}", 200],
  getJobOfferHistory: ["GET", "/job-offers/{jobOfferId}/history", 200],
  getCompanyConfiguration: ["GET", "/companies/{companyId}/configuration", 200],
  updateCompanyConfiguration: ["PUT", "/companies/{companyId}/configuration", 200],
} as const satisfies Record<Operation, readonly [string, string, number]>;

/** The JSON body, the raw text when it is not JSON, undefined when empty. */
const parsed = (text: string): unknown => {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return text;
  }
};

/** Query values as the wire expects them; an array repeats the key. */
const search = (query: Query) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    for (const item of [value].flat()) params.append(key, String(item));
  return params;
};

/** One method per operation of the spec; every call asserts the status and validates the body. */
export class JobOfferApi {
  private readonly headers: Record<string, string>;

  constructor(
    private readonly request: APIRequestContext,
    readonly companyId?: string,
  ) {
    this.headers = companyId === undefined ? {} : { "X-Company-Id": companyId };
  }

  readonly listJobOffers: Call<"listJobOffers", [query?: Query]> = (query = {}, options) =>
    this.call("listJobOffers", {}, { params: search(query) }, options);

  readonly createJobOffer: Call<"createJobOffer", [body: Request<"createJobOffer">]> = (
    body,
    options,
  ) => this.call("createJobOffer", {}, { data: body }, options);

  readonly getJobOffer: Call<"getJobOffer", [jobOfferId: string]> = (jobOfferId, options) =>
    this.call("getJobOffer", { jobOfferId }, {}, options);

  readonly updateJobOffer: Call<"updateJobOffer", [id: string, body: Request<"updateJobOffer">]> = (
    jobOfferId,
    body,
    options,
  ) => this.call("updateJobOffer", { jobOfferId }, { data: body }, options);

  readonly deleteJobOffer: Call<"deleteJobOffer", [jobOfferId: string]> = (jobOfferId, options) =>
    this.call("deleteJobOffer", { jobOfferId }, {}, options);

  readonly getAvailableTransitions: Call<"getAvailableTransitions", [jobOfferId: string]> = (
    jobOfferId,
    options,
  ) => this.call("getAvailableTransitions", { jobOfferId }, {}, options);

  readonly transitionJobOffer: Call<
    "transitionJobOffer",
    [jobOfferId: string, action: Schema<"TransitionAction">, body?: Request<"transitionJobOffer">]
  > = (jobOfferId, action, body = {}, options) =>
    this.call("transitionJobOffer", { jobOfferId, action }, { data: body }, options);

  readonly getJobOfferHistory: Call<"getJobOfferHistory", [jobOfferId: string]> = (
    jobOfferId,
    options,
  ) => this.call("getJobOfferHistory", { jobOfferId }, {}, options);

  readonly getCompanyConfiguration: Call<"getCompanyConfiguration", [companyId?: string]> = (
    companyId = this.companyId,
    options,
  ) => this.call("getCompanyConfiguration", { companyId }, {}, options);

  readonly updateCompanyConfiguration: Call<
    "updateCompanyConfiguration",
    [body: Request<"updateCompanyConfiguration">, companyId?: string]
  > = (body, companyId = this.companyId, options) =>
    this.call("updateCompanyConfiguration", { companyId }, { data: body }, options);

  /** Sends one operation without any check, path relative to the base URL; for teardown probes. */
  async send<O extends Operation>(operation: O, params: Params, init: Init = {}) {
    const [method, path] = OPERATIONS[operation];
    const url = path.replace(/\{(\w+)\}/g, (_, name: keyof Params) => {
      if (params[name] === undefined) throw new Error(`${operation}: ${name} is required`);
      return params[name];
    });
    const response = await this.request.fetch(url.slice(1), {
      ...init,
      method,
      headers: this.headers,
    });
    const body = parsed(await response.text());
    return { method, path, status: response.status(), headers: response.headers(), body };
  }

  private async call<O extends Operation, S extends Status<O>>(
    operation: O,
    params: Params,
    init: Init,
    options: { expect?: S } = {},
  ): Promise<Body<O, S>> {
    const expected = options.expect ?? OPERATIONS[operation][2];
    const { method, path, status, headers, body } = await this.send(operation, params, init);
    const received = `${method} ${path}: expected ${expected}, received ${status} ${JSON.stringify(body)}`;
    expect(status, received).toBe(expected);
    await validate(method, path, status, body, headers);
    return body as Body<O, S>;
  }
}
