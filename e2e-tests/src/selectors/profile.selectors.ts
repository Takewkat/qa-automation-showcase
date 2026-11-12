import type { Page } from "@playwright/test";

/** The profile page: its user's name is an h4; the button of an author reads Follow or Unfollow, then the username and a count, a case-sensitive word tells them apart; an own article by its title heading; a preview has no role, the list is loaded once one stops reading Loading. */
export const PROFILE_SELECTORS = {
  PATHS: { profile: (username: string) => `/#/profile/${username}` },
  USER_INFO: {
    name: (page: Page, username: string) =>
      page.getByRole("heading", { level: 4, name: username, exact: true }),
    follow: (page: Page, username: string) =>
      page.getByRole("button", { name: new RegExp(`\\bFollow ${username}\\b`) }),
    unfollow: (page: Page, username: string) =>
      page.getByRole("button", { name: new RegExp(`\\bUnfollow ${username}\\b`) }),
  },
  ARTICLES: {
    loaded: (page: Page) =>
      page.locator(".article-preview").filter({ hasNotText: "Loading" }).first(),
    articleTitle: (page: Page, title: string) =>
      page.getByRole("heading", { name: title, exact: true }),
  },
} as const;
