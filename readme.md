# QA Playwright Dashboard v2 — Quick Reference

## 1. How to Run

1. Install dependencies: `npm install`
2. Contact admin for copy of `.env` and fill in the required values (see below), then run:

| Command                 | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm run tests:chrome`  | Run all tests headless on Chromium            |
| `npm run tests:firefox` | Run all tests headed on Firefox               |
| `npm run tests:webkit`  | Run all tests on Webkit                       |
| `npm run tests:e2e`     | Run e2e tests headed via `e2e.config.ts`      |
| `npm run tests:ui`      | Open Playwright's interactive UI mode         |
| `npm run tests:debug`   | Debug tests step-by-step on Firefox           |
| `npm run tests:report`  | Open the last HTML report                     |
| `npm run tests:codegen` | Launch Playwright codegen to record new tests |

`ENV` variable in `.env` selects which base URL is used (`dev` / `stg` / `amplify`), resolved in `playwright.config.ts`.

```
npx playwright test tests/dashboard-login-email-otp.spec.ts
```

## 2. Tools Used

- **Playwright** (`@playwright/test`) — test runner/browser automation
- **TypeScript** — test/helper source language (`tsconfig.json`)
- **dotenv** — loads `.env` into `process.env`
- **@faker-js/faker** — generates fake test data
- **Prettier** — code formatting (`.prettierrc`)

## 3. Folder / File Reference

- **fixtures/** — Playwright fixtures (custom `test` extensions)
  - `auth.fixtures.ts` — authenticated session/browser context setup
  - `oauth.fixture.ts` — OAuth-based login flow fixture
- **helpers/** — reusable test logic, not fixtures
  - **common/** — shared utilities
    - `base-page.ts` — base Page Object class other pages extend
    - `form.helper.ts` — generic form-filling helpers
  - **login/** — `login.ts` handles the login flow logic (used by tests/fixtures)
- **playwright-report/** — auto-generated HTML report output (from `tests:report`); safe to delete/regenerate
- **test-data/** — static/generated test data
  - **common/** — `index.ts` shared data constants/generators
- **test-results/** — auto-generated raw run artifacts (traces, screenshots, videos on failure); safe to delete/regenerate
- **tests/** — actual `*.spec.ts` test files (e.g. `dashboard-login-email-otp.spec.ts`)
- **.env** — environment config (base URLs, credentials, debug flags). Keys currently expected:
  - `ENV`, `APP_DEV_URL`, `APP_STG_URL`, `APP_AMPLIFY_URL`, `DEBUG_LOGINS`
  - `DASHBOARD_BASE_URL`, `DASHBOARD_EMAIL`, `DASHBOARD_PASSWORD`
  - `WEBMAIL_BASE_URL`, `WEBMAIL_EMAIL`, `WEBMAIL_PASSWORD`
- **playwright.config.ts** — main Playwright config: test dir, timeouts, retries, reporter (`html`), browser projects (currently only `chromium` enabled), base URL resolution via `ENV`
