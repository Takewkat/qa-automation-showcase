import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { ProfileResponse } from "../types";

/** DELETE /api/profiles/{username}/follow: the caller stops following; 200 with the profile, followed or not. */
export class UnfollowProfile extends ConduitApi {
  readonly path = "/api/profiles/{username}/follow";
  readonly method = HTTPMethod.DELETE;
  readonly correctStatusCode = 200;

  unfollow<T = ProfileResponse>(username: string, expected?: number) {
    return this.send<T>({ pathParams: { username } }, expected);
  }
}
