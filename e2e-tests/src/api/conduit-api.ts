import type { APIRequestContext } from "@playwright/test";

import { Api } from "@shared/api/api";

/** The caller: a request context and the JWT it acts with; no token sends no header. */
export type Session = { request: APIRequestContext; token?: string };

/** One endpoint of the Conduit API, under /api/ on the web base URL: same origin on every target, the Vite dev server proxies it locally. No contract: a precondition call checks its status only. */
export abstract class ConduitApi extends Api {
  protected override readonly contract = undefined;

  constructor({ request, token }: Session) {
    super(request, token ? { Authorization: `Token ${token}` } : {});
  }
}
