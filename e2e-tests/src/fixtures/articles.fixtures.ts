import type { Fixtures, TestInfo } from "@playwright/test";

import type { Session } from "@e2e/api";
import { reportLeftovers } from "@shared/cleanup/leftovers";

import { ArticlesFactory } from "./articles.factory";
import type { ApiUser } from "./auth.fixtures";

/** What a spec can ask for: the article factory of the run's user, and track to name a title the UI creates. */
export type ArticlesFixtures = { articles: ArticlesFactory; track: (title: string) => void };

/** Hands the factory to the test, then reports what the teardown left. */
const withCleanup = async (
  factory: ArticlesFactory,
  use: (f: ArticlesFactory) => Promise<void>,
  info: TestInfo,
) => {
  await use(factory);
  await reportLeftovers(info, await factory.teardown());
};

/** Every test seeds as the run's user; a UI-created article is found by its tracked title. */
export const articlesFixtures: Fixtures<
  ArticlesFixtures,
  object,
  { session: Session; apiUser: ApiUser }
> = {
  articles: ({ session, apiUser }, use, info) =>
    withCleanup(new ArticlesFactory(session, apiUser.username), use, info),
  track: ({ articles }, use) => use((title) => articles.track(title)),
};
