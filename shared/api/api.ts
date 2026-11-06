import { expect, test, type APIRequestContext } from "@playwright/test";

import type { Contract } from "./contract";

/** The methods the specs use. */
export enum HTTPMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

/** Query values of a call; an array repeats the key. */
export type Query = Record<string, string | number | readonly (string | number)[]>;
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
const searchParams = (query: Query) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    for (const item of [value].flat()) params.append(key, String(item));
  return params;
};

/** One endpoint: path, method, success status, the typed call in the subclass. The service class sets the headers and the contract. Holds its last response. */
export abstract class Api {
  abstract readonly path: string;
  abstract readonly method: HTTPMethod;
  abstract readonly correctStatusCode: number;
  /** The spec the service answers to, or undefined for a service that checks the status only. */
  protected abstract readonly contract: Contract | undefined;
  private received?: Received;

  constructor(
    protected readonly context: APIRequestContext,
    protected readonly headers: Record<string, string> = {},
  ) {}

  /** The path with its parameters filled in; throws naming a missing one. */
  getUrl(pathParams: Record<string, string> = {}): string {
    return this.path.replace(/\{(\w+)\}/g, (_, name: string) => {
      if (pathParams[name] === undefined) throw new Error(`${this.path}: ${name} is required`);
      return pathParams[name];
    });
  }

  /** Sends the request as a named step, unchecked; the url is relative to baseURL, so no leading slash. */
  async request({ pathParams, query = {}, data }: RequestOptions = {}): Promise<void> {
    const url = this.getUrl(pathParams);
    const options = {
      method: this.method,
      headers: this.headers,
      data,
      params: searchParams(query),
    };
    this.received = await test.step(`${this.method} ${url}`, async () => {
      const response = await this.context.fetch(url.slice(1), options);
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

  /** Validates the body and the documented headers against the contract, for the status received; nothing without a contract. */
  checkSchema(): void {
    if (!this.contract) return;
    const { status, body, headers } = this.response();
    this.contract.validate(this.method, this.path, status, body, headers);
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
    this.checkSchema();
    return this.getResponseBody<T>();
  }

  private response(): Received {
    if (!this.received) throw new Error(`${this.method} ${this.path}: request() was not called`);
    return this.received;
  }
}
