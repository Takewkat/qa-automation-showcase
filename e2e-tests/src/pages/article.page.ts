import { expect, type Page } from "@playwright/test";

import { BasePage } from "@e2e/pages/base.page";
import { ARTICLE_SELECTORS as S } from "@e2e/selectors/article.selectors";
import { NAVBAR_SELECTORS } from "@e2e/selectors/navbar.selectors";

/** One article: what it shows and what its author can do to it; comments are CommentsPage. */
export class ArticlePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open(slug: string) {
    await this.goto(S.PATHS.article(slug));
  }

  /** Accepts the confirm dialog and clicks the banner's Delete Article; the app then returns home. */
  async delete() {
    await this.step("Delete the article", async () => {
      this.acceptNextDialog();
      await S.META.delete(this.page).click();
    });
  }

  async assertOnHome() {
    await this.step("Assert the home page opened", async () => {
      await expect(this.page).toHaveURL(NAVBAR_SELECTORS.PATHS.homeUrl);
    });
  }

  async assertTitle(title: string) {
    await this.step(`Assert the title "${title}"`, async () => {
      await expect(S.BANNER.title(this.page)).toHaveText(title);
    });
  }

  async assertBody(body: string) {
    await this.step("Assert the body", async () => {
      await expect(S.BODY.content(this.page)).toContainText(body);
    });
  }

  async assertAuthor(username: string) {
    await this.step(`Assert the author "${username}"`, async () => {
      await expect(S.META.author(this.page, username)).toBeVisible();
    });
  }
}
