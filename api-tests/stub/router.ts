import type { IncomingMessage, ServerResponse } from "node:http";

/** What a handler sees: the path values, the query, the headers (lower-case), the raw body, the absolute URL. */
export type Request = {
  params: Record<string, string>;
  query: URLSearchParams;
  headers: Record<string, string>;
  text: string;
  url: URL;
};
/** What a handler answers: a status, a JSON body unless there is none, extra headers. */
export type Reply = { status: number; body?: unknown; headers?: Record<string, string> };
export type Handler = (request: Request) => Reply;
type Route = { method: string; pattern: RegExp; keys: string[]; handler: Handler };

/** An answer with an error body, thrown from anywhere under a handler. */
export class HttpError extends Error {
  readonly status: number;
  readonly body: object;

  constructor(status: number, body: object) {
    super(`${status} ${JSON.stringify(body)}`);
    this.status = status;
    this.body = body;
  }
}

/** `:name` segments become captures; the rest of the path is literal. */
const compile = (path: string): Pick<Route, "pattern" | "keys"> => {
  const keys: string[] = [];
  const literal = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const source = literal.replace(/:(\w+)/g, (_, key: string) => {
    keys.push(key);
    return "([^/]+)";
  });
  return { pattern: new RegExp(`^${source}$`), keys };
};

/** A path value as sent; a malformed escape stays as it is, for the handler to refuse. */
const decode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/** The whole request body as text. */
const read = async (incoming: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of incoming) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
};

/** Writes a reply: JSON unless the body is undefined; serialized before any header goes out. */
const write = (response: ServerResponse, { status, body, headers = {} }: Reply): void => {
  if (body === undefined) {
    response.writeHead(status, headers).end();
    return;
  }
  const payload = JSON.stringify(body);
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(payload);
};

/** The reply an error stands for: its own for an HttpError, a 500 for anything else. */
const replyFor = (error: unknown): Reply =>
  error instanceof HttpError
    ? { status: error.status, body: error.body }
    : { status: 500, body: { code: "INTERNAL_ERROR", message: String(error) } };

/** Routes by method and path pattern; no route is a 404, a thrown error its reply. */
export class Router {
  private readonly routes: Route[] = [];

  on(method: string, path: string, handler: Handler): this {
    this.routes.push({ method, ...compile(path), handler });
    return this;
  }

  /** The node:http request listener. */
  listener() {
    return async (incoming: IncomingMessage, response: ServerResponse): Promise<void> => {
      const url = new URL(incoming.url ?? "/", `http://${incoming.headers.host ?? "localhost"}`);
      try {
        write(response, await this.dispatch(incoming, url));
      } catch (error) {
        if (!response.headersSent) write(response, replyFor(error));
        else response.destroy();
      }
    };
  }

  private async dispatch(incoming: IncomingMessage, url: URL): Promise<Reply> {
    for (const route of this.routes) {
      const match = route.method === incoming.method && route.pattern.exec(url.pathname);
      if (!match) continue;
      const params = Object.fromEntries(
        route.keys.map((key, index) => [key, decode(match[index + 1])]),
      );
      const headers = Object.fromEntries(
        Object.entries(incoming.headers).map(([name, value]) => [name, String(value)]),
      );
      return route.handler({
        params,
        query: url.searchParams,
        headers,
        text: await read(incoming),
        url,
      });
    }
    return { status: 404, body: { code: "NOT_FOUND", message: `No route: ${url.pathname}` } };
  }
}
