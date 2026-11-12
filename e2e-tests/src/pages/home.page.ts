import { expect, type Page } from "@playwright/test";

import { BasePage } from "@e2e/pages/base.page";
import { HOME_SELECTORS as S } from "@e2e/selectors/home.selectors";
import { NAVBAR_SELECTORS } from "@e2e/selectors/navbar.selectors";

/** The home page of a logged-in user: Your Feed, the articles of the authors it follows, found by title. */
export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openYourFeed() {
    await this.goto(NAVBAR_SELECTORS.PATHS.home);
    await this.step("Open Your Feed", async () => {
      await S.FEED.yourFeed(this.page).click();
    });
  }

  async assertArticleListed(title: string) {
    await this.step(`Assert Your Feed lists "${title}"`, async () => {
      await expect(S.FEED.articleTitle(this.page, title)).toBeVisible();
    });
  }
}
