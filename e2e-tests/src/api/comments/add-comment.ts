import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { AddCommentRequest, CommentResponse } from "../types";

/** POST /api/articles/{slug}/comments: a comment of the session's user. */
export class AddComment extends ConduitApi {
  readonly path = "/api/articles/{slug}/comments";
  readonly method = HTTPMethod.POST;
  readonly correctStatusCode = 201;

  add<T = CommentResponse>(slug: string, body: AddCommentRequest, expected?: number) {
    return this.send<T>({ pathParams: { slug }, data: body }, expected);
  }
}
