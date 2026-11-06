import type { Fixtures, Page } from "@playwright/test";

import type { Session } from "@e2e/api";
import { ArticlePage } from "@e2e/pages/article.page";
import { EditorPage } from "@e2e/pages/editor.page";
import { ProfilePage } from "@e2e/pages/profile.page";
import { withCleanup } from "@shared/cleanup/leftovers";

import { ArticlesFactory } from "./articles.factory";
import type { ApiUser } from "./auth.fixtures";

/** What a spec can ask for: the article factory of the run's user, track to name a title the UI creates, and the three pages of an article's life on the authenticated page. */
export type ArticlesFixtures = {
  articles: ArticlesFactory;
  track: (title: string) => void;
  editorPage: EditorPage;
  articlePage: ArticlePage;
  profilePage: ProfilePage;
};

/** Every test seeds as the run's user; a UI-created article is found by its tracked title. */
export const articlesFixtures: Fixtures<
  ArticlesFixtures,
  object,
  { session: Session; apiUser: ApiUser; authenticatedPage: Page }
> = {
  articles: ({ session, apiUser }, use, info) =>
    withCleanup(new ArticlesFactory(session, apiUser.username), use, info),
  track: ({ articles }, use) => use((title) => articles.track(title)),
  editorPage: ({ authenticatedPage }, use) => use(new EditorPage(authenticatedPage)),
  articlePage: ({ authenticatedPage }, use) => use(new ArticlePage(authenticatedPage)),
  profilePage: ({ authenticatedPage, apiUser }, use) =>
    use(new ProfilePage(authenticatedPage, apiUser.username)),
};
