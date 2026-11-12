import { expect, type Page } from "@playwright/test";

import { BasePage } from "@e2e/pages/base.page";
import { PROFILE_SELECTORS as S } from "@e2e/selectors/profile.selectors";

/** A profile: the run's user's own and the articles it lists, found by title, or another author's to follow. */
export class ProfilePage extends BasePage {
  constructor(
    page: Page,
    private readonly username: string,
  ) {
    super(page);
  }

  async openOwn() {
    await this.openOf(this.username);
  }

  /** Waits for the user's name: a hash change keeps the previous screen, its headings included, until the profile renders. */
  async openOf(username: string) {
    await this.goto(S.PATHS.profile(username));
    await this.step(`Wait for the profile of ${username}`, async () => {
      await expect(S.USER_INFO.name(this.page, username)).toBeVisible();
    });
  }

  /** Waits for the button to turn into Unfollow: the follow is saved before the next screen reads it. */
  async follow(username: string) {
    await this.step(`Follow ${username}`, async () => {
      await S.USER_INFO.follow(this.page, username).click();
      await expect(S.USER_INFO.unfollow(this.page, username)).toBeVisible();
    });
  }

  async assertArticleListed(title: string) {
    await this.step(`Assert the profile lists "${title}"`, async () => {
      await expect(S.ARTICLES.articleTitle(this.page, title)).toBeVisible();
    });
  }

  /** Waits for the list to load first: an empty match before that would prove nothing. */
  async assertArticleNotListed(title: string) {
    await this.step(`Assert the profile does not list "${title}"`, async () => {
      await expect(S.ARTICLES.loaded(this.page)).toBeVisible();
      await expect(S.ARTICLES.articleTitle(this.page, title)).toHaveCount(0);
    });
  }
}
