import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { ArticleResponse, CreateArticleRequest } from "../types";

/** POST /api/articles: an article of the session's user; a title in use is a 422. */
export class CreateArticle extends ConduitApi {
  readonly path = "/api/articles";
  readonly method = HTTPMethod.POST;
  readonly correctStatusCode = 201;

  create<T = ArticleResponse>(body: CreateArticleRequest, expected?: number) {
    return this.send<T>({ data: body }, expected);
  }
}
