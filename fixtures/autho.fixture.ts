// fixtures/autho.fixture.ts
import { test as base, expect, type Page } from '@playwright/test'

/**
 * Fixture: dashboard login via Auth0 + emailed one-time verification code.
 *
 * Flow:
 * 1. Visit the dashboard while unauthenticated. The app itself redirects
 *    /dashboard -> /login -> Auth0 Universal Login. We deliberately do NOT
 *    hardcode that Auth0 authorize URL (state/nonce/code_challenge are
 *    single-use, generated per session) - replaying a recorded one always
 *    fails, so we just navigate to /dashboard and let the app redirect.
 * 2. Submit email/password on the Auth0 hosted login page. This triggers a
 *    one-time verification code sent by email.
 * 3. Open a second tab, log into Tutanota webmail, open the email and read
 *    the code.
 * 4. Switch back to the first tab, enter the code, and let Auth0 redirect
 *    back to the dashboard on its own (again, no hardcoded /auth?code=...
 *    callback - authorization codes are single-use).
 *
 * Requires these environment variables to be set in `.env`:
 *  - DASHBOARD_BASE_URL, DASHBOARD_EMAIL, DASHBOARD_PASSWORD
 *  - WEBMAIL_BASE_URL, WEBMAIL_EMAIL, WEBMAIL_PASSWORD
 */

const dashboardBaseUrl =
  process.env.DASHBOARD_BASE_URL || 'https://dashboard-v2-dev.n-compass.online'
const dashboardEmail = process.env.DASHBOARD_EMAIL || 'francisc@n-compass.biz'
const dashboardPassword = process.env.DASHBOARD_PASSWORD

const webmailBaseUrl =
  process.env.WEBMAIL_BASE_URL || 'https://mail.tutanota.com/login?noAutoLogin=true'
const webmailEmail = process.env.WEBMAIL_EMAIL || dashboardEmail
const webmailPassword = process.env.WEBMAIL_PASSWORD

/**
 * Opens the "Dashboard V2 MFA code" email in the Tutanota inbox and returns
 * the verification code inside it.
 *
 * The recorded session navigated straight to one specific message URL
 * (`/mail/OrlEAXO-2--9`) and searched for the literal code text ("009707").
 * Both are one-time/session-specific - a later run gets a different message
 * id and a different code - so instead this waits for the inbox to show an
 * email matching the subject, opens it, and pulls whatever digits are in
 * the message body rather than assuming a fixed value.
 *
 * NOTE: `table` filtered by subject and `section:mail-area` are carried
 * over from the recorded session. Adjust if the inbox markup differs.
 */
async function getVerificationCodeFromWebmail(webmailPage: Page): Promise<string> {
  // Selecting the email in the list is what renders its content (including
  // the table matched below) into the reading pane - it doesn't exist until
  // this click happens. Assumes the MFA email is the newest/first item in
  // this inbox; `.click()` auto-waits for it to appear, which also covers
  // delivery lag.
  const loadMoreButton = webmailPage.getByTestId('btn:loadMore_action')
  if (await loadMoreButton.isVisible()) {
    await loadMoreButton.click()
  }
  await webmailPage.locator('li.list-row').first().click({ timeout: 90_000 })

  const mfaEmailRow = webmailPage
    .locator('table')
    .filter({ hasText: /Dashboard V2 MFA code/i })
    .first()

  await expect(mfaEmailRow).toBeVisible({ timeout: 90_000 })
  await mfaEmailRow.click()

  const mailArea = webmailPage.getByTestId('section:mail-area')
  await expect(mailArea).toBeVisible({ timeout: 30_000 })

  const code = await webmailPage.locator('code').innerText()

  if (!code) {
    throw new Error('Could not find a 6-digit verification code in the MFA email.')
  }

  return code
}

type OAuthFixtures = {
  /** A `page` already logged into the dashboard via Auth0 + emailed OTP. */
  dashboardPage: Page
}

export const test = base.extend<OAuthFixtures>({
  dashboardPage: async ({ page, context }, use, testInfo) => {
    testInfo.skip(
      !dashboardPassword || !webmailPassword,
      'Set DASHBOARD_PASSWORD and WEBMAIL_PASSWORD in .env to run this test.',
    )

    await test.step('Navigate to the dashboard and get redirected to Auth0 login', async () => {
      await page.goto(`${dashboardBaseUrl}/dashboard`)
      await page.waitForURL(/auth0\.n-compass\.online/)
    })

    await test.step('Submit Auth0 credentials', async () => {
      await page.getByRole('textbox', { name: 'Email Address' }).click()
      await page.getByRole('textbox', { name: 'Email Address' }).fill(dashboardEmail)
      await page.getByRole('textbox', { name: 'Email Address' }).press('Tab')
      await page.getByRole('textbox', { name: 'Password' }).fill(dashboardPassword as string)
      await page.getByRole('button', { name: 'Log In' }).click()
    })

    // Open a new tab (not a popup triggered by the app - a separate tab we
    // navigate ourselves) to check the inbox for the verification email.
    const webmailPage = await test.step('Open a new tab for webmail', async () => {
      return context.newPage()
    })

    const code = await test.step('Log into webmail and read the verification code', async () => {
      await webmailPage.goto(webmailBaseUrl)
      await webmailPage.getByTestId('tfi:mailAddress_label').click()
      await webmailPage.getByTestId('tfi:mailAddress_label').fill(webmailEmail)
      await webmailPage.getByRole('main', { name: 'Login' }).click()
      await webmailPage.getByTestId('tfi:password_label').fill(webmailPassword as string)
      await webmailPage.getByTestId('btn:login_action').click()

      // Post-login dialogs (e.g. "what's new") are expected to auto-dismiss.
      // Bounded + swallowed so a dialog that instead needs an explicit close
      // click can't hang this step for the full test timeout - if the code
      // below can't find the email, check whether a dialog is actually
      // blocking the inbox and needs a real dismiss action here instead.
      await webmailPage
        .getByRole('dialog')
        .waitFor({ state: 'hidden', timeout: 15_000 })
        .catch(() => {})

      return getVerificationCodeFromWebmail(webmailPage)
    })

    // Done with the webmail tab - switch back to the original dashboard/Auth0
    // tab (`page`) to finish the login.
    await test.step('Switch back to the dashboard tab and close webmail', async () => {
      await webmailPage.close()
    })

    await test.step('Enter the verification code and land on the dashboard', async () => {
      await page.getByRole('textbox', { name: 'Enter the code' }).click()
      await page.getByRole('textbox', { name: 'Enter the code' }).fill(code)
      await page.getByRole('button', { name: 'Continue' }).click()

      await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
    })

    await use(page)
  },
})

export { expect }
