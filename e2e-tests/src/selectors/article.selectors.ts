import type { Locator, Page } from "@playwright/test";

/** The article page: its title is its only h1; the banner holds the author, whose avatar is a link of the same name with no text; Delete Article comes twice, banner and bottom; the body has no role, scoped by its class; a comment card has no role, found by its text, its delete button is an icon with no name, the card's only button. */
export const ARTICLE_SELECTORS = {
  PATHS: { article: (slug: string) => `/#/article/${slug}`, articleUrl: /\/#\/article\/.+/ },
  BANNER: { title: (page: Page) => page.getByRole("heading", { level: 1 }) },
  META: {
    author: (page: Page, username: string) =>
      page
        .locator(".banner")
        .getByRole("link", { name: username, exact: true })
        .filter({ hasText: username }),
    delete: (page: Page) => page.getByRole("button", { name: "Delete Article" }).first(),
  },
  BODY: { content: (page: Page) => page.locator(".article-content") },
  COMMENTS: {
    FORM: {
      body: (page: Page) => page.getByPlaceholder("Write a comment..."),
      post: (page: Page) => page.getByRole("button", { name: "Post Comment" }),
    },
    LIST: {
      cardByText: (page: Page, text: string) =>
        page.locator(".card").filter({ has: page.getByText(text, { exact: true }) }),
      author: (card: Locator, username: string) => card.getByText(username, { exact: true }),
      delete: (card: Locator) => card.getByRole("button"),
    },
  },
} as const;
