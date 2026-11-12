import type { Page } from "@playwright/test";

/** The article editor, new or by slug: fields by placeholder, the app gives them no label; the submit button reads Publish Article or Update Article. */
export const EDITOR_SELECTORS = {
  PATHS: { new: "/#/editor", edit: (slug: string) => `/#/editor/${slug}` },
  FORM: {
    title: (page: Page) => page.getByPlaceholder("Article Title"),
    description: (page: Page) => page.getByPlaceholder("What's this article about?"),
    body: (page: Page) => page.getByPlaceholder("Write your article (in markdown)"),
    publish: (page: Page) => page.getByRole("button", { name: "Publish Article" }),
    update: (page: Page) => page.getByRole("button", { name: "Update Article" }),
  },
} as const;
