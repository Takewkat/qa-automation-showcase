import type { APIRequestContext, Browser, BrowserContext, Fixtures, Page } from "@playwright/test";

import type { Session, User } from "@e2e/api";
import { AuthPage } from "@e2e/pages/auth.page";
import { NavbarPage } from "@e2e/pages/navbar.page";
import { AUTH_FILE, readCachedUser } from "@e2e/setup/auth-file";
import { budget } from "@e2e/utils/requests";

/** The run's user as the setup project cached it. */
export type ApiUser = Pick<User, "username" | "email" | "token">;

/** What a spec can ask for: the run's user, the sessions to call the API as, a page logged in as that user, and the two page objects of a clean browser. */
export type AuthFixtures = {
  apiUser: ApiUser;
  session: Session;
  anonymous: Session;
  authenticatedPage: Page;
  authPage: AuthPage;
  navbar: NavbarPage;
};

/** The user cached for the target, or a failure naming the project that writes it. */
const cachedUser = (baseURL: string | undefined): ApiUser => {
  const user = readCachedUser(baseURL);
  if (!user)
    throw new Error(`${AUTH_FILE} has no user for ${baseURL}: the setup project writes it`);
  return { username: user.username, email: user.email, token: user.token };
};

/** One user per run, registered by the setup project and shared by every test: the demo allows 5 register or login calls per hour per IP. authPage and navbar sit on the plain page, logged out. Every context is budgeted: see utils/requests. */
export const authFixtures: Fixtures<
  AuthFixtures,
  object,
  { request: APIRequestContext; baseURL?: string; page: Page; context: BrowserContext },
  { browser: Browser }
> = {
  apiUser: ({ baseURL }, use) => use(cachedUser(baseURL)),
  session: ({ request, apiUser }, use) => use({ request, token: apiUser.token }),
  anonymous: ({ request }, use) => use({ request }),
  context: async ({ context }, use, info) => {
    const report = await budget(context, info);
    await use(context);
    await report();
  },
  authenticatedPage: async ({ browser }, use, info) => {
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const report = await budget(context, info);
    await use(await context.newPage());
    await report();
    await context.close();
  },
  authPage: ({ page }, use) => use(new AuthPage(page)),
  navbar: ({ page }, use) => use(new NavbarPage(page)),
};
