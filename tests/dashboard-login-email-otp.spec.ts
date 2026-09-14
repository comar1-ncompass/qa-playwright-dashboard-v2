import { test, expect } from '../fixtures/autho.fixture'

/**
 * Dashboard login via Auth0 + emailed one-time verification code.
 *
 * The full login flow (Auth0 credentials + reading the emailed OTP from
 * webmail) lives in the `dashboardPage` fixture (`fixtures/oauth.fixture.ts`).
 * This test only asserts that, once logged in, the dashboard actually loaded.
 */
test('dashboard login with emailed verification code', async ({ dashboardPage }) => {
  await test.step('Assert the dashboard loaded', async () => {
    await expect(dashboardPage.getByRole('img', { name: 'N-Compass TV' })).toBeVisible()
    await expect(dashboardPage.locator('app-sub-navbar')).toContainText('Dashboard')
  })
})
