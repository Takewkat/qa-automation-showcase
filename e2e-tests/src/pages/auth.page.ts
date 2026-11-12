import { expect, type Page } from "@playwright/test";

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
    await this.step(`Sign up as "${username}"`, async () => {
      await S.FORM.username(this.page).fill(username);
      await S.FORM.email(this.page).fill(email);
      await S.FORM.password(this.page).fill(password);
      await S.FORM.signUp(this.page).click();
    });
  }

  async login({ email, password }: Credentials) {
    await this.step(`Log in as "${email}"`, async () => {
      await S.FORM.email(this.page).fill(email);
      await S.FORM.password(this.page).fill(password);
      await S.FORM.login(this.page).click();
    });
  }

  async assertError(text: string) {
    await this.step(`Assert the error "${text}"`, async () => {
      await expect(S.ERRORS.item(this.page)).toHaveText(text);
    });
  }
}
