import { test as base } from "@playwright/test";

import { type ArticlesFixtures, articlesFixtures } from "./articles.fixtures";
import { type AuthFixtures, authFixtures } from "./auth.fixtures";

/** The test every spec imports; chain the next domain's fixtures here. */
export const test = base
  .extend<AuthFixtures>(authFixtures)
  .extend<ArticlesFixtures>(articlesFixtures);
export type Fixtures = AuthFixtures & ArticlesFixtures;
export { expect } from "@playwright/test";
