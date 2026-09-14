/**
 * Login Page Object Model
 *
 * Encapsulates all interactions with the login page.
 * Follows the Page Object Model (POM) design pattern to provide
 * a clean interface for login page operations.
 *
 * @module pages/login-page/login
 *
 * Usage:
 * ```typescript
 * const loginPage = new LoginPage(page)
 * await loginPage.goto()
 * await loginPage.login('user@example.com', 'password')
 * await loginPage.handlePostLogin()
 * ```
 */

import { Locator, Page } from '@playwright/test'
import { BasePage } from '../common/base-page'

/**
 * Login Page Object
 *
 * Provides methods for interacting with the login page including
 * form filling, submission, and post-login handling.
 *
 * @extends BasePage
 */
export class LoginPage extends BasePage {
  // Locators for login page elements
  readonly emailInput: Locator
  readonly missingEmailMessage: Locator
  readonly passwordInput: Locator
  readonly missingPasswordMessage: Locator
  readonly loginButton: Locator
  readonly welcomeMessage: Locator
  readonly closeButton: Locator

  constructor(page: Page) {
    // Creates a new LoginPage instance
    super(page)

    // Initializing page elements with their value
    this.emailInput = page.getByRole('textbox', { name: 'Email ' })
    this.missingEmailMessage = page.locator('text=Email is required')
    this.passwordInput = page.getByRole('textbox', { name: 'Password' })
    this.missingPasswordMessage = page.locator('text=Password is required')
    this.loginButton = page.getByRole('button', { name: 'LOGIN' })
    this.welcomeMessage = page.locator('text=Welcome!')
    this.closeButton = page.getByRole('button', { name: 'Close' })
  }

  // Navigate to the login page
  async goto() {
    await super.goto('/login')
    await super.waitForPageLoad()
  }

  // Fill email
  async fillEmail(email: string) {
    await super.fill(this.emailInput, email)
  }

  // Fill password
  async fillPassword(password: string) {
    await super.fill(this.passwordInput, password)
  }

  // Click the login button and wait for navigation or network idle
  async submit() {
    await Promise.all([super.waitForPageLoad(), super.click(this.loginButton)])
  }

  // Centralized method: navigate -> fill -> submit
  async login(email: string, password: string) {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.submit()
  }

  // Checking email error message
  async getEmailErrorText() {
    if ((await this.missingEmailMessage.count()) > 0) {
      return await this.missingEmailMessage.first().innerText()
    }
    return ''
  }

  // Checking password error message
  async getPasswordErrorText() {
    if ((await this.missingPasswordMessage.count()) > 0) {
      return await this.missingPasswordMessage.first().innerText()
    }
    return ''
  }

  /**
   * Handles post-login operations including modal dismissal and navigation wait
   *
   * This method waits for:
   * 1. A specific element to appear (welcome message by default)
   * 2. URL to change from /login
   * 3. Page to finish loading
   *
   * If login fails or times out, captures a debug screenshot
   *
   * @param {Object} options - Configuration options
   * @param {string | Locator} [options.waitForSelectorAfter] - Element to wait for after login
   *
   * @throws {Error} If login completion times out (unless DEBUG_LOGINS=true)
   *
   * @example
   * ```typescript
   * await loginPage.login(email, password)
   * await loginPage.handlePostLogin({
   *   waitForSelectorAfter: '.dashboard-header'
   * })
   * ```
   */
  async handlePostLogin({
    waitForSelectorAfter,
  }: { waitForSelectorAfter?: string | Locator } = {}) {
    const target = waitForSelectorAfter ?? this.welcomeMessage

    try {
      if (typeof target === 'string') {
        await this.page.waitForSelector(target, { timeout: 30_000 })
      } else {
        await target.waitFor({ state: 'visible', timeout: 30_000 })
      }

      await Promise.race([
        this.page.waitForURL((url) => !url.href.includes('/login'), { timeout: 30_000 }),
        super.waitForPageLoad(),
      ])
    } catch (e) {
      console.warn(
        `[handlePostLogin] Login completion timed out or page did not navigate as expected.`,
      )
      console.warn(`Error: ${(e as Error).message}`)

      try {
        await this.page.screenshot({ path: `login-debug-${Date.now()}.png`, fullPage: true })
        console.warn(`Screenshot captured for failed login state.`)
      } catch (screenshotError) {
        console.warn(`Failed to capture screenshot: ${(screenshotError as Error).message}`)
      }

      if (process.env.DEBUG_LOGINS !== 'true') throw e
    }
  }
}
