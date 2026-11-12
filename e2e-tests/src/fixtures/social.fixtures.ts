import type { APIRequestContext, Fixtures, Page } from "@playwright/test";

import type { Session } from "@e2e/api";
import { cleanupFollow } from "@e2e/cleanup/follows.cleanup";
import { HomePage } from "@e2e/pages/home.page";
import { AUTHOR_FILE } from "@e2e/setup/auth-file";
import { reportLeftovers, withCleanup } from "@shared/cleanup/leftovers";

import { ArticlesFactory } from "./articles.factory";
import { type ApiUser, cachedUser } from "./auth.fixtures";

/** What a spec can ask for: the author the run's user follows, the articles seeded as that author, and the home page with its feed on the authenticated page. */
export type SocialFixtures = {
  author: ApiUser;
  authorArticles: ArticlesFactory;
  homePage: HomePage;
};

/** The author is cached by the setup project like the run's user; the run's user unfollows it after the test, whatever the test did. */
export const socialFixtures: Fixtures<
  SocialFixtures,
  object,
  { request: APIRequestContext; baseURL?: string; session: Session; authenticatedPage: Page }
> = {
  author: async ({ baseURL, session }, use, info) => {
    const author = cachedUser(baseURL, AUTHOR_FILE);
    await use(author);
    await reportLeftovers(info, await cleanupFollow(session, author.username));
  },
  authorArticles: ({ request, author }, use, info) =>
    withCleanup(new ArticlesFactory({ request, token: author.token }, author.username), use, info),
  homePage: ({ authenticatedPage }, use) => use(new HomePage(authenticatedPage)),
};
