import { test as setup } from "@playwright/test";

import { GetCurrentUser, RegisterUser, type Session } from "@e2e/api";
import { readCachedUser, writeCachedUser } from "@e2e/setup/auth-file";
import { uniqueUser } from "@e2e/test-data/factories";
import { TOO_MANY_REQUESTS } from "@e2e/utils/requests";

/** Whether the token still answers GET /api/user; a 429 stops the run here, naming it, instead of spending a register call on it. */
const loggedIn = async (session: Session): Promise<boolean> => {
  const get = new GetCurrentUser(session);
  await get.request();
  if (get.getStatusCode() === TOO_MANY_REQUESTS) get.checkStatusCode();
  return get.getStatusCode() === get.correctStatusCode;
};

/** One user per run, reused by the next ones: the demo allows 5 register or login calls per hour per IP, and a token never expires. */
setup("the run's user is cached, or registered once", async ({ request, baseURL }) => {
  const cached = readCachedUser(baseURL);
  if (cached && (await loggedIn({ request, token: cached.token }))) return;
  const { user } = await new RegisterUser({ request }).register({ user: uniqueUser() });
  writeCachedUser(baseURL, user);
});
