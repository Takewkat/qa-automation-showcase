import { expect, type Page } from "@playwright/test";

import { BasePage } from "@e2e/pages/base.page";
import { ARTICLE_SELECTORS } from "@e2e/selectors/article.selectors";

const S = ARTICLE_SELECTORS.COMMENTS;

/** The comments under an open article: the form and the list, a card found by its text. */
export class CommentsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async post(text: string) {
    await this.step(`Post the comment "${text}"`, async () => {
      await S.FORM.body(this.page).fill(text);
      await S.FORM.post(this.page).click();
    });
  }

  /** Accepts the confirm dialog and clicks the trash button of the card with that text. */
  async delete(text: string) {
    await this.step(`Delete the comment "${text}"`, async () => {
      this.acceptNextDialog();
      await S.LIST.delete(S.LIST.cardByText(this.page, text)).click();
    });
  }

  async assertCommentVisible(text: string, author: string) {
    await this.step(`Assert the comment "${text}" by "${author}"`, async () => {
      const card = S.LIST.cardByText(this.page, text);
      await expect(card).toBeVisible();
      await expect(S.LIST.author(card, author)).toBeVisible();
    });
  }

  async assertNoComment(text: string) {
    await this.step(`Assert no comment "${text}"`, async () => {
      await expect(S.LIST.cardByText(this.page, text)).toHaveCount(0);
    });
  }
}
