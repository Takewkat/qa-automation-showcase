import { HTTPMethod } from "@shared/api/api";
import { ConduitApi } from "../conduit-api";
import type { RegisterUserRequest, UserResponse } from "../types";

/** POST /api/users: a new user, logged in; the email must be new, the username is not checked. */
export class RegisterUser extends ConduitApi {
  readonly path = "/api/users";
  readonly method = HTTPMethod.POST;
  readonly correctStatusCode = 201;

  register<T = UserResponse>(body: RegisterUserRequest, expected?: number) {
    return this.send<T>({ data: body }, expected);
  }
}
