import { expect, type Page } from "@playwright/test";

import { BasePage } from "@e2e/pages/base.page";
import { PROFILE_SELECTORS as S } from "@e2e/selectors/profile.selectors";

/** The profile of the run's user: the articles it lists, found by title. */
export class ProfilePage extends BasePage {
  constructor(
    page: Page,
    private readonly username: string,
  ) {
    super(page);
  }

  async openOwn() {
    await this.goto(S.PATHS.profile(this.username));
  }

  async assertArticleListed(title: string) {
    await this.step(`Assert the profile lists "${title}"`, async () => {
      await expect(this.page.locator(S.ARTICLES.previewByTitle(title))).toBeVisible();
    });
  }

  /** Waits for the list to load first: an empty match before that would prove nothing. */
  async assertArticleNotListed(title: string) {
    await this.step(`Assert the profile does not list "${title}"`, async () => {
      await expect(this.page.locator(S.ARTICLES.loaded).first()).toBeVisible();
      await expect(this.page.locator(S.ARTICLES.previewByTitle(title))).toHaveCount(0);
    });
  }
}
