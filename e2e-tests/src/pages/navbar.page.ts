import { expect, type Page } from "@playwright/test";

import { BasePage } from "@e2e/pages/base.page";
import { NAVBAR_SELECTORS as S } from "@e2e/selectors/navbar.selectors";

/** The navbar on every screen: the session it shows and the user menu. */
export class NavbarPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async logout() {
    await this.step("Log out from the user menu", async () => {
      await this.page.click(S.USER_MENU.toggle);
      await this.page.click(S.USER_MENU.logout);
    });
  }

  async assertLoggedInAs(username: string) {
    await this.step(`Assert the navbar shows "${username}"`, async () => {
      await expect(this.page.locator(S.USER_MENU.toggleByName(username))).toBeVisible();
    });
  }

  async assertLoggedOut() {
    await this.step("Assert the navbar offers Login", async () => {
      await expect(this.page.locator(S.LINKS.login)).toBeVisible();
      await expect(this.page.locator(S.USER_MENU.toggle)).toHaveCount(0);
    });
  }
}
