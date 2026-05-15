import { test, expect } from '@playwright/test'

/**
 * S-09: 카테고리 추가 시나리오
 * UC-09 / POST /api/categories
 */

const TS = Date.now()
const USER = {
  email: `test_s09_${TS}@example.com`,
  password: 'Test1234!',
  name: 'S09유저',
}

test.describe('S-09: 카테고리 추가', () => {
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

  async function loginAndGoCategories(page: any) {
    await page.goto('/login')
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).fill(USER.password)
    await page.getByRole('button', { name: /로그인|login/i }).click()
    await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
    await page.goto('/categories')
  }

  test('기본 흐름: 카테고리 이름 입력 후 추가 성공', async ({ page }) => {
    await loginAndGoCategories(page)

    const nameInput = page.getByLabel(/카테고리 이름|category name/i).first()
      || page.getByPlaceholder(/카테고리|category/i).first()

    await nameInput.fill('업무')
    await page.getByRole('button', { name: /추가|add/i }).click()

    await expect(page.locator('text=업무')).toBeVisible({ timeout: 10000 })
  })

  test('대안 흐름: 카테고리 이름 미입력 시 에러', async ({ page }) => {
    await loginAndGoCategories(page)

    await page.getByRole('button', { name: /추가|add/i }).click()

    const errorMsg = page.locator('text=/이름|name|필수|required|입력하세요/i').first()
    await expect(errorMsg).toBeVisible({ timeout: 5000 })
  })

  test('대안 흐름: 중복 카테고리 이름 입력 시 409 에러 표시', async ({ page }) => {
    await loginAndGoCategories(page)

    // 첫 번째 추가
    const nameInput = page.getByPlaceholder(/카테고리|category/i).first()
      || page.getByLabel(/카테고리 이름|category name/i).first()
    await nameInput.fill('개인')
    await page.getByRole('button', { name: /추가|add/i }).click()
    await expect(page.locator('text=개인')).toBeVisible({ timeout: 10000 })

    // 중복 추가
    const nameInput2 = page.getByPlaceholder(/카테고리|category/i).first()
      || page.getByLabel(/카테고리 이름|category name/i).first()
    await nameInput2.fill('개인')
    await page.getByRole('button', { name: /추가|add/i }).click()

    const errorMsg = page.locator('text=/이미 사용|중복|duplicate/i').first()
    await expect(errorMsg).toBeVisible({ timeout: 5000 })
  })
})
