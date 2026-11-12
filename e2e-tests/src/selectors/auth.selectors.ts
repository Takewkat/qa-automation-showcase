import type { Page } from "@playwright/test";

/** The sign-up and login screens: fields by placeholder, the app gives them no label; buttons by name; the error list has no name, scoped by its class. */
export const AUTH_SELECTORS = {
  PATHS: { signUp: "/#/register", login: "/#/login" },
  FORM: {
    username: (page: Page) => page.getByPlaceholder("Your Name"),
    email: (page: Page) => page.getByPlaceholder("Email"),
    password: (page: Page) => page.getByPlaceholder("Password"),
    signUp: (page: Page) => page.getByRole("button", { name: "Sign up" }),
    login: (page: Page) => page.getByRole("button", { name: "Login" }),
  },
  ERRORS: { item: (page: Page) => page.locator(".error-messages").getByRole("listitem") },
} as const;
