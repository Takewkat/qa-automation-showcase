import type { Page } from "@playwright/test";

/** The home page of a logged-in user: the Your Feed tab, an article of the open feed by its title heading. */
export const HOME_SELECTORS = {
  FEED: {
    yourFeed: (page: Page) => page.getByRole("button", { name: "Your Feed" }),
    articleTitle: (page: Page, title: string) =>
      page.getByRole("heading", { name: title, exact: true }),
  },
} as const;
