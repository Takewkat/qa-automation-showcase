import type { Fixtures, Page } from "@playwright/test";

import { CommentsPage } from "@e2e/pages/comments.page";

/** What a spec can ask for: the comments of the open article, on the authenticated page; seeding is articles.comment(slug). */
export type CommentsFixtures = { commentsPage: CommentsPage };

/** The comments page object over the authenticated page; the article under it is opened by articlePage. */
export const commentsFixtures: Fixtures<CommentsFixtures, object, { authenticatedPage: Page }> = {
  commentsPage: ({ authenticatedPage }, use) => use(new CommentsPage(authenticatedPage)),
};
