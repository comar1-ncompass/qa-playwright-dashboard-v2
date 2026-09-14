import { Locator, Page, expect } from '@playwright/test'
import { FormHelper, type Role } from './form.helper'

export type FieldRole = 'textbox' | 'combobox' | 'checkbox' | 'radio' | 'spinbutton'
export type FieldHandlerType = 'input' | 'dropdown'

export interface fieldMapping {
  errorTexts: string[]
  role: FieldRole
  fieldName: string
  value?: string
  handler: FieldHandlerType
  optionName?: string
  [key: string]: unknown
}

export class BasePage extends FormHelper {
  protected readonly baseURL: string

  constructor(page: Page) {
    super(page)
    this.baseURL = process.env.APP_DEV_URL || ''
  }

  async goto(path: string) {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path}`

    await this.page.goto(url)
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded')
  }

  async waitForFullLoad() {
    await this.page.waitForLoadState('load')
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToModule(
    moduleName: string,
    options?: { role?: Role; timeout?: number },
  ): Promise<void> {
    const role = options?.role || 'link'
    const timeout = options?.timeout || 10_000

    const moduleLink = this.page.getByRole(role, { name: moduleName })

    await expect(moduleLink).toBeVisible({ timeout })
    await moduleLink.click()
    await this.page.waitForLoadState('networkidle')
  }

  async triggerSinglePageNav(locator: Locator) {
    await this.expectIsVisible(locator)
    await this.click(locator)
    await this.page.waitForLoadState('networkidle')
  }

  async handlePopup(triggerAction: () => Promise<void>): Promise<Page> {
    const popupPromise = this.page.waitForEvent('popup')

    await triggerAction()

    return await popupPromise
  }

  async click(locator: Locator | string, timeout = 30_000) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    await element.waitFor({ state: 'visible', timeout })
    await element.click()
  }

  async fillByRole(role: Role, name: string, text: string, exact = false) {
    const element = this.page.getByRole(role, { name, exact })

    await element.click()
    await element.fill(text)
  }

  async fill(locator: Locator | string, text: string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    await element.fill(text)
  }

  async enter(locator: Locator, text: string) {
    await this.fill(locator, text)
    await locator.press('Enter')
    await expect(locator).toHaveValue(text)
  }

  async selectFromDropdown(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    await element.first().click()
  }

  async getText(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    return (await element.textContent()) || ''
  }

  async clickGetText(text: string) {
    await this.page.getByText(text).click()
  }

  async clickButtonInModal(
    modalLocator: Locator,
    name: string,
    role: 'button' | 'link' = 'button',
  ): Promise<void> {
    const element = modalLocator.getByRole(role, { name })

    await expect(element).toBeVisible()
    await element.click()
  }

  async isVisible(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    return await element.isVisible()
  }

  async expectIsVisible(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    await expect(element).toBeVisible()
  }

  async waitForInvisibility(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    await element.waitFor({ state: 'hidden' })
  }

  async expectToBeHidden(locator: Locator | string, timeout = 30_000) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    await element.waitFor({ state: 'hidden', timeout })
    await expect(element).toBeHidden()
  }

  async isEnabled(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator

    return await element.isEnabled()
  }

  async waitForElement(locator: Locator | string, options?: { timeout?: number }): Promise<void> {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator
    const timeout = options?.timeout || 10_000

    await element.waitFor({ state: 'visible', timeout })
  }

  async checkLocatorVisible(locator: string): Promise<void> {
    await expect(this.page.locator(locator).first()).toBeVisible()
  }

  async checkRoleVisible(role: Role, name = ''): Promise<void> {
    await expect(this.page.getByRole(role, { name }).nth(0)).toBeVisible()
  }

  async checkByText(name = '') {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible()
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true })
  }

  async checkAndResolveErrors(
    mappings: fieldMapping[] | Record<string, fieldMapping[]>,
  ): Promise<void> {
    const steps = Array.isArray(mappings) ? { default: mappings } : mappings

    for (const fields of Object.values(steps)) {
      for (const mapping of fields) {
        const hasErrorMessage = await this.checkForError(mapping.errorTexts)
        const isEmptyField = await this.checkIfEmpty(mapping.role, mapping.fieldName)

        if (hasErrorMessage || isEmptyField) {
          await this.handleMappedField(mapping)
        }
      }
    }
  }

  async handleMappedField(mapping: fieldMapping): Promise<void> {
    if (mapping.handler === 'input') {
      await this.handleInputField(mapping)
      return
    }

    if (mapping.handler === 'dropdown') {
      await this.handleDropdownField(mapping)
      return
    }

    throw new Error(`Unsupported field handler: ${mapping.handler}`)
  }

  async handleInputField(mapping: fieldMapping): Promise<void> {
    const element = this.page.getByRole(mapping.role, {
      name: mapping.fieldName,
      exact: true,
    })

    await element.dblclick()
    await element.fill(mapping.value || '')
  }

  async handleDropdownField(mapping: fieldMapping): Promise<void> {
    const dropdown = this.page.getByRole(mapping.role, {
      name: mapping.fieldName,
      exact: true,
    })

    await dropdown.click()

    if (mapping.value) {
      await dropdown.fill(mapping.value)
    }

    if (mapping.optionName) {
      await this.page.getByRole('option', { name: mapping.optionName }).click()
    }
  }
}
