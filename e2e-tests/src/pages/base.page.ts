import { test, type Page } from "@playwright/test";

/** What every page object shares: the page, one navigation step, the confirm dialogs of a delete; a method that checks is named assert... */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Opens a hash route against baseURL as one step: a first call loads the app, the next ones change the hash. */
  protected async goto(path: string) {
    await test.step(`Open ${path}`, async () => {
      await this.page.goto(path);
    });
  }

  /** Accepts the next dialog the page raises; registered before the click that raises it. */
  protected acceptNextDialog() {
    this.page.once("dialog", (dialog) => dialog.accept());
  }
}
