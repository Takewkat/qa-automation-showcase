import type { Page } from "@playwright/test";

/** The navbar, the navigation landmark: the Login link of a visitor; the user menu of a logged-in user, a div with a click handler and no role, found by its class or by the username it shows, Logout a link inside it. */
export const NAVBAR_SELECTORS = {
  PATHS: { home: "/#/", homeUrl: /\/#\/$/ },
  LINKS: {
    login: (page: Page) => page.getByRole("navigation").getByRole("link", { name: "Login" }),
  },
  USER_MENU: {
    toggle: (page: Page) => page.getByRole("navigation").locator(".dropdown-toggle"),
    toggleByName: (page: Page, username: string) =>
      page.getByRole("navigation").getByText(username, { exact: true }),
    logout: (page: Page) => page.getByRole("navigation").getByRole("link", { name: "Logout" }),
  },
} as const;
