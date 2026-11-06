import { expect, type Page } from "@playwright/test";

import type { NewArticle } from "@e2e/api";
import { BasePage } from "@e2e/pages/base.page";
import { ARTICLE_SELECTORS } from "@e2e/selectors/article.selectors";
import { EDITOR_SELECTORS as S } from "@e2e/selectors/editor.selectors";

/** The editor, new or of a slug; a submit lands on the article page. */
export class EditorPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openNew() {
    await this.goto(S.PATHS.new);
  }

  /** The edit form fetches the article and fills itself: a fill before that would be overwritten. */
  async openEdit(slug: string) {
    await this.goto(S.PATHS.edit(slug));
    await this.step("Wait for the form to be prefilled", async () => {
      await expect(this.page.locator(S.FORM.title)).not.toHaveValue("");
    });
  }

  async write({ title, description, body }: NewArticle) {
    await this.step(`Write "${title}" in the editor`, async () => {
      await this.page.fill(S.FORM.title, title);
      await this.page.fill(S.FORM.description, description);
      await this.page.fill(S.FORM.body, body);
    });
  }

  async publish() {
    await this.step("Publish the article", async () => {
      await this.page.click(S.FORM.publish);
    });
  }

  async update() {
    await this.step("Update the article", async () => {
      await this.page.click(S.FORM.update);
    });
  }

  async assertOnArticlePage() {
    await this.step("Assert the article page opened", async () => {
      await expect(this.page).toHaveURL(ARTICLE_SELECTORS.PATHS.articleUrl);
    });
  }
}
