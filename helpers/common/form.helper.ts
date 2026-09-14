import { Page } from '@playwright/test'

export type Role = Parameters<Page['getByRole']>[0]

export class FormHelper {
  protected readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async checkForError(errorTexts: string[]): Promise<boolean> {
    for (const errorText of errorTexts) {
      console.log(`errorText: ${errorText}`)

      const isVisible = await this.page
        .getByText(errorText)
        .isVisible()
        .catch(() => false)

      if (isVisible) {
        return true
      }
    }

    return false
  }

  async checkIfEmpty(role: Role, fieldName: string): Promise<boolean> {
    try {
      const field = this.page.getByRole(role, { name: fieldName })

      return (await field.inputValue()) === ''
    } catch {
      return false
    }
  }
}
