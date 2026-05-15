import { test, expect } from '@playwright/test'

/**
 * S-11: 로그아웃 시나리오
 * UC-11 / POST /api/auth/logout
 */

const TS = Date.now()
const USER = {
  email: `test_s11_${TS}@example.com`,
  password: 'Test1234!',
  name: 'S11유저',
}

test.describe('S-11: 로그아웃', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/signup')
    await page.getByLabel(/이름|name/i).fill(USER.name)
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
    await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await page.close()
  })

  test('기본 흐름: 로그아웃 후 로그인 화면으로 이동', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).fill(USER.password)
    await page.getByRole('button', { name: /로그인|login/i }).click()
    await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })

    const logoutBtn = page.getByRole('button', { name: /로그아웃|logout/i }).first()
    await expect(logoutBtn).toBeVisible({ timeout: 5000 })
    await logoutBtn.click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('사후 조건: 로그아웃 후 보호된 페이지 접근 시 로그인 화면으로 리다이렉트', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).fill(USER.password)
    await page.getByRole('button', { name: /로그인|login/i }).click()
    await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })

    const logoutBtn = page.getByRole('button', { name: /로그아웃|logout/i }).first()
    await logoutBtn.click()
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // 로그아웃 후 / 접근 시 로그인 화면으로 리다이렉트되어야 함
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})
