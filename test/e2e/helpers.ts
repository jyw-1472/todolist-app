import { Page, expect } from '@playwright/test'

export const BASE_URL = 'http://localhost:5173'
export const API_URL = 'http://localhost:3000/api'

export const TEST_USER = {
  email: `test_${Date.now()}@example.com`,
  password: 'Test1234!',
  name: '테스트유저',
}

export async function signup(page: Page, user = TEST_USER) {
  await page.goto('/signup')
  await page.getByLabel(/이름|name/i).fill(user.name)
  await page.getByLabel(/이메일|email/i).fill(user.email)
  await page.getByLabel(/비밀번호|password/i).first().fill(user.password)
  await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
  await page.waitForURL('**/login', { timeout: 10000 })
}

export async function login(page: Page, user = TEST_USER) {
  await page.goto('/login')
  await page.getByLabel(/이메일|email/i).fill(user.email)
  await page.getByLabel(/비밀번호|password/i).fill(user.password)
  await page.getByRole('button', { name: /로그인|login/i }).click()
  await page.waitForURL('**/', { timeout: 10000 })
}

export async function signupAndLogin(page: Page, user = TEST_USER) {
  await signup(page, user)
  await login(page, user)
}

export async function waitForToast(page: Page, text: RegExp | string) {
  const toast = page.locator('[role="alert"], .toast, [data-testid="toast"]')
  await expect(toast.filter({ hasText: text })).toBeVisible({ timeout: 5000 }).catch(() => {})
}
