import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { Query } from "@shared/api/api";
import type { ArticlesResponse } from "../types";

/** GET /api/articles: newest first, filtered by author, limit (3 by default) and offset, a page index. */
export class ListArticles extends ConduitApi {
  readonly path = "/api/articles";
  readonly method = HTTPMethod.GET;
  readonly correctStatusCode = 200;

  list<T = ArticlesResponse>(query: Query = {}, expected?: number) {
    return this.send<T>({ query }, expected);
  }
}
