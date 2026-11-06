import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { LoginUserRequest, UserResponse } from "../types";

/** POST /api/users/login: the user with a new token; 422 on a wrong password, 404 on an unknown email. */
export class LoginUser extends ConduitApi {
  readonly path = "/api/users/login";
  readonly method = HTTPMethod.POST;
  readonly correctStatusCode = 200;

  login<T = UserResponse>(body: LoginUserRequest, expected?: number) {
    return this.send<T>({ data: body }, expected);
  }
}
