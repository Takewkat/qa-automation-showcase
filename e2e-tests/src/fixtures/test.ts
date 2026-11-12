import { test as base } from "@playwright/test";

import { type ArticlesFixtures, articlesFixtures } from "./articles.fixtures";
import { type AuthFixtures, authFixtures } from "./auth.fixtures";
import { type CommentsFixtures, commentsFixtures } from "./comments.fixtures";
import { type SocialFixtures, socialFixtures } from "./social.fixtures";

/** The test every spec imports; chain the next domain's fixtures here. */
export const test = base
  .extend<AuthFixtures>(authFixtures)
  .extend<ArticlesFixtures>(articlesFixtures)
  .extend<CommentsFixtures>(commentsFixtures)
  .extend<SocialFixtures>(socialFixtures);
export type Fixtures = AuthFixtures & ArticlesFixtures & CommentsFixtures & SocialFixtures;
export { expect } from "@playwright/test";
