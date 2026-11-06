import type { BrowserContext, Request, Route, TestInfo } from "@playwright/test";

import { log } from "@shared/log";

type Cached = { status: number; contentType: string; body: Buffer };
/** What reached the server from one context: calls under /api/ and loads of the app itself. */
export type Sent = { api: string[]; app: string[] };

/** The demo's answer past its limit; the setup project reads it too. */
export const TOO_MANY_REQUESTS = 429;
const NO_CONTENT = 204;
/** The document and the built bundles, as the server sent them, once per worker. */
const SHELL = new Map<string, Cached>();
/** The requests a route answered without the server. */
const LOCAL = new WeakSet<Request>();

/** The app shell: the document and the hashed bundles under /assets/, which do not change during a run. */
const isShell = ({ pathname }: URL): boolean => pathname === "/" || pathname.startsWith("/assets/");

/** What no flow asserts: the icons, the manifest and the tag cloud of the home page. */
const isNoise = ({ pathname }: URL): boolean =>
  /favicon|apple-touch-icon|manifest\.json/.test(pathname) || pathname.startsWith("/api/tags");

/** Serves the worker's copy; the first request of a worker fetches it from the server, and only a good answer is kept. */
async function serveShell(route: Route): Promise<void> {
  const request = route.request();
  const cached = SHELL.get(request.url());
  if (cached) {
    LOCAL.add(request);
    const headers = { "content-type": cached.contentType };
    await route.fulfill({ status: cached.status, headers, body: cached.body });
    return;
  }
  const response = await route.fetch();
  if (response.ok()) {
    const contentType = response.headers()["content-type"] ?? "";
    SHELL.set(request.url(), {
      status: response.status(),
      contentType,
      body: await response.body(),
    });
  }
  await route.fulfill({ response });
}

/** Answers an empty tag cloud, or nothing, without the server. */
async function serveNoise(route: Route): Promise<void> {
  LOCAL.add(route.request());
  if (new URL(route.request().url()).pathname.startsWith("/api/tags"))
    await route.fulfill({ json: { tags: [] } });
  else await route.fulfill({ status: NO_CONTENT });
}

/** One line of the attachment: method and path. */
const line = (request: Request): string => `${request.method()} ${new URL(request.url()).pathname}`;

/** Routes a context so the shared demo sees as little as possible, and counts what it still sees on the target's origin: attached to the test as "server requests", a 429 as an annotation. */
export async function budget(
  context: BrowserContext,
  info: TestInfo,
  baseURL: string | undefined,
): Promise<() => Promise<void>> {
  const { origin } = new URL(String(baseURL));
  const sent: Sent = { api: [], app: [] };
  const limited: string[] = [];
  await context.route(isShell, serveShell);
  await context.route(isNoise, serveNoise);
  context.on("requestfinished", (request) => {
    const url = new URL(request.url());
    if (LOCAL.has(request) || url.origin !== origin) return;
    sent[url.pathname.startsWith("/api/") ? "api" : "app"].push(line(request));
  });
  context.on("response", (response) => {
    if (response.status() !== TOO_MANY_REQUESTS) return;
    limited.push(`${line(response.request())}, retry-after ${response.headers()["retry-after"]}`);
  });
  return async () => {
    const summary = `api ${sent.api.length}, app ${sent.app.length}`;
    log("budget", `server requests: ${summary}`);
    await info.attach("server requests", { body: [summary, ...sent.api, ...sent.app].join("\n") });
    for (const hit of limited) info.annotations.push({ type: "rate-limited", description: hit });
  };
}
