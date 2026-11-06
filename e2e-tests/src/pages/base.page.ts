import { test, type Page } from "@playwright/test";

import { log } from "@shared/log";

/** What every page object shares: the page, a step that logs itself, one navigation step, the confirm dialogs of a delete; a method that checks is named assert... */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** One named step of a page object, on the console too: every method is one of these. */
  protected async step(title: string, body: () => Promise<void>) {
    await test.step(title, async () => {
      log("ui", title);
      await body();
    });
  }

  /** Opens a hash route against baseURL as one step: a first call loads the app, the next ones change the hash. */
  protected async goto(path: string) {
    await this.step(`Open ${path}`, async () => {
      await this.page.goto(path);
    });
  }

  /** Accepts the next dialog the page raises; registered before the click that raises it. */
  protected acceptNextDialog() {
    this.page.once("dialog", (dialog) => dialog.accept());
  }
}
