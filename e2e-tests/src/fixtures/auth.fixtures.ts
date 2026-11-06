import type { APIRequestContext, Browser, Fixtures, Page } from "@playwright/test";

import type { Session, User } from "@e2e/api";
import { AUTH_FILE, readCachedUser } from "@e2e/setup/auth-file";

/** The run's user as the setup project cached it. */
export type ApiUser = Pick<User, "username" | "email" | "token">;

/** What a spec can ask for: the run's user, the sessions to call the API as, a page logged in as that user. */
export type AuthFixtures = {
  apiUser: ApiUser;
  session: Session;
  anonymous: Session;
  authenticatedPage: Page;
};

/** The user cached for the target, or a failure naming the project that writes it. */
const cachedUser = (baseURL: string | undefined): ApiUser => {
  const user = readCachedUser(baseURL);
  if (!user)
    throw new Error(`${AUTH_FILE} has no user for ${baseURL}: the setup project writes it`);
  return { username: user.username, email: user.email, token: user.token };
};

/** One user per run, registered by the setup project and shared by every test: the demo allows 5 register or login calls per hour per IP. */
export const authFixtures: Fixtures<
  AuthFixtures,
  object,
  { request: APIRequestContext; baseURL?: string },
  { browser: Browser }
> = {
  apiUser: ({ baseURL }, use) => use(cachedUser(baseURL)),
  session: ({ request, apiUser }, use) => use({ request, token: apiUser.token }),
  anonymous: ({ request }, use) => use({ request }),
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_FILE });
    await use(await context.newPage());
    await context.close();
  },
};
