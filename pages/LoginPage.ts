import { expect, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('https://test.coursemill.com/nsui/login?route=/dashboard');
  }

  async enterUsername(username: string) {
    await this.page.fill('#username', username);
  }

  async enterPassword(password: string) {
    await this.page.fill('#password', password);
  }

  async clickLogin() {
    await this.page.click('#submitBtn');
  }

  async login(username: string, password: string) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  // ---- VALIDATIONS ----

  async validateLoginFieldsVisible() {
    await expect(this.page.locator('#username')).toBeVisible();
    await expect(this.page.locator('#password')).toBeVisible();
    await expect(this.page.locator('#submitBtn')).toBeVisible(); // FIXED
  }
  async validateLoginButtonDisabled() {
  await expect(this.page.locator('#submitBtn')).toBeDisabled();
}
//Forgot password
async clickForgotPassword() {
  await this.page.locator('text=Forgot Password').click();
}

async validateForgotPasswordPage() {
  await expect(this.page).toHaveURL(/forgot-password/);
}

  async validateErrorMessage(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }
}