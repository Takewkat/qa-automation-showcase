import { test } from "@e2e/fixtures/test";
import { uniqueUser } from "@e2e/test-data/factories";

/** The one UI-driven session, on a clean browser; on the demo it spends 2 of the 5 register or login calls per hour per IP. */
test(
  "AUTH-001 I can sign up, log out and log in again",
  { tag: ["@auth", "@happy-path", "@sanity"] },
  async ({ authPage, navbar }) => {
    const user = uniqueUser();
    await authPage.openSignUp();
    await authPage.signUp(user);
    await navbar.assertLoggedInAs(user.username);
    await navbar.logout();
    await navbar.assertLoggedOut();
    await authPage.openLogin();
    await authPage.login(user);
    await navbar.assertLoggedInAs(user.username);
  },
);
