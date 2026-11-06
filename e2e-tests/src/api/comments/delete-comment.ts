import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { MessageResponse } from "../types";

/** DELETE /api/articles/{slug}/comments/{id}: the author's own; 200 with a message, 404 once gone. */
export class DeleteComment extends ConduitApi {
  readonly path = "/api/articles/{slug}/comments/{id}";
  readonly method = HTTPMethod.DELETE;
  readonly correctStatusCode = 200;

  delete<T = MessageResponse>(slug: string, id: number, expected?: number) {
    return this.send<T>({ pathParams: { slug, id: String(id) } }, expected);
  }
}
