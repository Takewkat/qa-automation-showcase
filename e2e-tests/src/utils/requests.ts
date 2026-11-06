import type { BrowserContext, Request, Route, TestInfo } from "@playwright/test";

type Cached = { status: number; contentType: string; body: Buffer };
/** What reached the server from one context: calls under /api/ and loads of the app itself. */
export type Sent = { api: number; app: number };

const TOO_MANY_REQUESTS = 429;
/** The document and the built bundles, as the server sent them, once per worker. */
const SHELL = new Map<string, Cached>();
/** The requests a route answered without the server. */
const local = new WeakSet<Request>();

/** The app shell: the document and the hashed bundles under /assets/, which do not change during a run. */
const isShell = ({ pathname }: URL): boolean => pathname === "/" || pathname.startsWith("/assets/");

/** What no flow asserts: the favicon and the tag cloud of the home page. */
const isNoise = ({ pathname }: URL): boolean =>
  pathname.includes("favicon") || pathname.startsWith("/api/tags");

/** Serves the worker's copy; the first request of a worker fetches it from the server. */
async function serveShell(route: Route): Promise<void> {
  const request = route.request();
  let cached = SHELL.get(request.url());
  if (cached) local.add(request);
  else {
    const response = await route.fetch();
    const contentType = response.headers()["content-type"] ?? "";
    cached = { status: response.status(), contentType, body: await response.body() };
    SHELL.set(request.url(), cached);
  }
  const headers = { "content-type": cached.contentType };
  await route.fulfill({ status: cached.status, headers, body: cached.body });
}

/** Answers an empty tag cloud, or nothing, without the server. */
async function serveNoise(route: Route): Promise<void> {
  local.add(route.request());
  if (new URL(route.request().url()).pathname.startsWith("/api/tags"))
    await route.fulfill({ json: { tags: [] } });
  else await route.fulfill({ status: 204 });
}

/** Where a request went, for the count: the API or the app. */
const bucket = (request: Request): keyof Sent =>
  new URL(request.url()).pathname.startsWith("/api/") ? "api" : "app";

/** Routes a context so the shared demo sees as little as possible, and counts what it still sees: attached to the test as "server requests", a 429 as an annotation. */
export async function budget(
  context: BrowserContext,
  info: TestInfo,
): Promise<() => Promise<void>> {
  const sent: Sent = { api: 0, app: 0 };
  const limited: string[] = [];
  await context.route(isShell, serveShell);
  await context.route(isNoise, serveNoise);
  context.on("requestfinished", (request) => {
    if (!local.has(request)) sent[bucket(request)] += 1;
  });
  context.on("response", (response) => {
    if (response.status() !== TOO_MANY_REQUESTS) return;
    const { method } = response.request();
    const { pathname } = new URL(response.url());
    limited.push(`${method()} ${pathname}, retry-after ${response.headers()["retry-after"]}`);
  });
  return async () => {
    await info.attach("server requests", { body: `api ${sent.api}, app ${sent.app}` });
    for (const hit of limited) info.annotations.push({ type: "rate-limited", description: hit });
  };
}
