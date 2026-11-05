import { expect, test, type APIRequestContext } from "@playwright/test";

import { validate } from "./contract";
import type { HTTPMethod } from "./http-method";
import type { Query } from "./types";

/** Who sends the request: a Playwright request context and the company it acts as; an empty id sends no header. */
export type Company = { request: APIRequestContext; id: string };
/** What one request needs: path values, query values, a JSON body. */
export type RequestOptions = { pathParams?: Record<string, string>; query?: Query; data?: unknown };
type Received = { status: number; headers: Record<string, string>; body: unknown };

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

/** One endpoint of the spec: path, method, success status; a subclass adds the typed call. An instance holds its last response, so use one per concurrent call. */
export abstract class JobOfferApi {
  abstract readonly path: string;
  abstract readonly method: HTTPMethod;
  abstract readonly correctStatusCode: number;
  private received?: Received;

  constructor(protected readonly company: Company) {}

  /** Sends the request as a named step, nothing checked; the path goes relative to baseURL, so without its leading slash. */
  async request({ pathParams = {}, query = {}, data }: RequestOptions = {}): Promise<void> {
    const url = this.path.replace(/\{(\w+)\}/g, (_, name: string) => {
      if (pathParams[name] === undefined) throw new Error(`${this.path}: ${name} is required`);
      return pathParams[name];
    });
    const headers: Record<string, string> = this.company.id
      ? { "X-Company-Id": this.company.id }
      : {};
    const options = { method: this.method, headers, data, params: search(query) };
    this.received = await test.step(`${this.method} ${url}`, async () => {
      const response = await this.company.request.fetch(url.slice(1), options);
      return {
        status: response.status(),
        headers: response.headers(),
        body: parsed(await response.text()),
      };
    });
  }

  getStatusCode(): number {
    return this.response().status;
  }

  /** Fails naming the endpoint, the expected and the received status, and the body. */
  checkStatusCode(code: number = this.correctStatusCode): void {
    const { status, body } = this.response();
    const message = `${this.method} ${this.path}: expected ${code}, received ${status} ${JSON.stringify(body)}`;
    expect(status, message).toBe(code);
  }

  /** Validates the body and the documented headers against the spec, for the status received. */
  async checkSchema(): Promise<void> {
    const { status, body, headers } = this.response();
    await validate(this.method, this.path, status, body, headers);
  }

  /** The body as received, as the type the caller names. */
  getResponseBody<T>(): T {
    return this.response().body as T;
  }

  /** The whole call: request, status check, schema check, body. Every endpoint method ends here. */
  protected async send<T>(
    options: RequestOptions,
    expected: number = this.correctStatusCode,
  ): Promise<T> {
    await this.request(options);
    this.checkStatusCode(expected);
    await this.checkSchema();
    return this.getResponseBody<T>();
  }

  private response(): Received {
    if (!this.received) throw new Error(`${this.method} ${this.path}: request() was not called`);
    return this.received;
  }
}
