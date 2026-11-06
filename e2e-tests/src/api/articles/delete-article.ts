import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { MessageResponse } from "../types";

/** DELETE /api/articles/{slug}: the author's own, comments included; 200 with a message. */
export class DeleteArticle extends ConduitApi {
  readonly path = "/api/articles/{slug}";
  readonly method = HTTPMethod.DELETE;
  readonly correctStatusCode = 200;

  delete<T = MessageResponse>(slug: string, expected?: number) {
    return this.send<T>({ pathParams: { slug } }, expected);
  }
}
