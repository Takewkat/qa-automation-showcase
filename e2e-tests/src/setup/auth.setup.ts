import { test as setup, type APIRequestContext } from "@playwright/test";

import { GetCurrentUser, RegisterUser, type Session } from "@e2e/api";
import {
  AUTH_FILE,
  AUTHOR_FILE,
  cachedSince,
  labelOf,
  originOf,
  readCachedUser,
  writeCachedUser,
} from "@e2e/setup/auth-file";
import { uniqueUser } from "@e2e/test-data/factories";
import { TOO_MANY_REQUESTS } from "@e2e/utils/requests";
import { log } from "@shared/log";

/** Whether the token still answers GET /api/user; a 429 stops the run here, naming it, instead of spending a register call on it. */
const loggedIn = async (session: Session): Promise<boolean> => {
  const get = new GetCurrentUser(session);
  await get.request();
  if (get.getStatusCode() === TOO_MANY_REQUESTS) get.checkStatusCode();
  return get.getStatusCode() === get.correctStatusCode;
};

/** The user cached in that file while its token answers, else one registered and cached there. */
const cachedOrRegistered = async (
  request: APIRequestContext,
  baseURL: string | undefined,
  file: string,
): Promise<void> => {
  const origin = originOf(baseURL);
  const cached = readCachedUser(baseURL, file);
  if (cached && (await loggedIn({ request, token: cached.token }))) {
    const since = cachedSince(file);
    log("setup", `${cached.username} reused on ${origin}: ${labelOf(file)}, cached ${since}`);
    return;
  }
  const { user } = await new RegisterUser({ request }).register({ user: uniqueUser() });
  writeCachedUser(baseURL, user, file);
  const where = `registered on ${origin}, session cached in ${labelOf(file)}`;
  log("setup", `${user.username} (${user.email}) ${where}`);
};

/** One user per run, reused by the next ones: the demo allows 5 register or login calls per hour per IP, and a token never expires. */
setup("the run's user is cached, or registered once", ({ request, baseURL }) =>
  cachedOrRegistered(request, baseURL, AUTH_FILE),
);

/** The author the run's user follows in SOC-001: a second user, cached the same way. */
setup("the author is cached, or registered once", ({ request, baseURL }) =>
  cachedOrRegistered(request, baseURL, AUTHOR_FILE),
);
