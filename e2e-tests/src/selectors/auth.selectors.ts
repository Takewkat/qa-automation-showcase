/** The sign-up and login screens: unnamed forms, fields found by name, buttons by text, one error list. */
export const AUTH_SELECTORS = {
  PATHS: { signUp: "/#/register", login: "/#/login" },
  FORM: {
    username: '.auth-page input[name="username"]',
    email: '.auth-page input[name="email"]',
    password: '.auth-page input[name="password"]',
    signUp: '.auth-page form button:has-text("Sign up")',
    login: '.auth-page form button:has-text("Login")',
  },
  ERRORS: { item: ".auth-page ul.error-messages > li" },
} as const;
