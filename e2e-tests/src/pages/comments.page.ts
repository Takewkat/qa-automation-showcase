import { expect, test, type Page } from "@playwright/test";

import { BasePage } from "@e2e/pages/base.page";
import { ARTICLE_SELECTORS } from "@e2e/selectors/article.selectors";

const S = ARTICLE_SELECTORS.COMMENTS;

/** The comments under an open article: the form and the list, a card found by its text. */
export class CommentsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async post(text: string) {
    await test.step(`Post the comment "${text}"`, async () => {
      await this.page.fill(S.FORM.body, text);
      await this.page.click(S.FORM.post);
    });
  }

  /** Accepts the confirm dialog and clicks the trash button of the card with that text. */
  async delete(text: string) {
    await test.step(`Delete the comment "${text}"`, async () => {
      this.acceptNextDialog();
      await this.page.locator(S.LIST.cardByText(text)).locator(S.LIST.delete).click();
    });
  }

  async assertCommentVisible(text: string, author: string) {
    await test.step(`Assert the comment "${text}" by "${author}"`, async () => {
      const card = this.page.locator(S.LIST.cardByText(text));
      await expect(card).toBeVisible();
      await expect(card.locator(S.LIST.authorByName(author))).toBeVisible();
    });
  }

  async assertNoComment(text: string) {
    await test.step(`Assert no comment "${text}"`, async () => {
      await expect(this.page.locator(S.LIST.cardByText(text))).toHaveCount(0);
    });
  }
}
