import { expect, test, type Page } from "@playwright/test";

import type { Credentials, NewUser } from "@e2e/api";
import { BasePage } from "@e2e/pages/base.page";
import { AUTH_SELECTORS as S } from "@e2e/selectors/auth.selectors";

/** The sign-up and login screens; a success lands on home, an error stays on the form. */
export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openSignUp() {
    await this.goto(S.PATHS.signUp);
  }

  async openLogin() {
    await this.goto(S.PATHS.login);
  }

  async signUp({ username, email, password }: NewUser) {
    await test.step(`Sign up as "${username}"`, async () => {
      await this.page.fill(S.FORM.username, username);
      await this.page.fill(S.FORM.email, email);
      await this.page.fill(S.FORM.password, password);
      await this.page.click(S.FORM.signUp);
    });
  }

  async login({ email, password }: Credentials) {
    await test.step(`Log in as "${email}"`, async () => {
      await this.page.fill(S.FORM.email, email);
      await this.page.fill(S.FORM.password, password);
      await this.page.click(S.FORM.login);
    });
  }

  async assertError(text: string) {
    await test.step(`Assert the error "${text}"`, async () => {
      await expect(this.page.locator(S.ERRORS.item)).toHaveText(text);
    });
  }
}
