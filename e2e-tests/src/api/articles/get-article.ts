import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { ArticleResponse } from "../types";

/** GET /api/articles/{slug}: one article; 404 once deleted or renamed. */
export class GetArticle extends ConduitApi {
  readonly path = "/api/articles/{slug}";
  readonly method = HTTPMethod.GET;
  readonly correctStatusCode = 200;

  get<T = ArticleResponse>(slug: string, expected?: number) {
    return this.send<T>({ pathParams: { slug } }, expected);
  }
}
