import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { UserResponse } from "../types";

/** GET /api/user: the user the token belongs to; 401 without a token. */
export class GetCurrentUser extends ConduitApi {
  readonly path = "/api/user";
  readonly method = HTTPMethod.GET;
  readonly correctStatusCode = 200;

  get<T = UserResponse>(expected?: number) {
    return this.send<T>({}, expected);
  }
}
