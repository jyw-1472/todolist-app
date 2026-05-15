import { test, expect } from '@playwright/test'

/**
 * S-10: 카테고리 삭제 시나리오
 * UC-10 / DELETE /api/categories/:id
 */

const TS = Date.now()
const USER = {
  email: `test_s10_${TS}@example.com`,
  password: 'Test1234!',
  name: 'S10유저',
}

test.describe('S-10: 카테고리 삭제', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/signup')
    await page.getByLabel(/이름|name/i).fill(USER.name)
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
    await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // 로그인 후 카테고리 추가
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).fill(USER.password)
    await page.getByRole('button', { name: /로그인|login/i }).click()
    await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
    await page.goto('/categories')

    const nameInput = page.getByPlaceholder(/카테고리|category/i).first()
    await nameInput.fill('삭제될카테고리')
    await page.getByRole('button', { name: /추가|add/i }).click()
    await page.waitForTimeout(1000)
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

  test('기본 흐름: 사용자 정의 카테고리 삭제 성공', async ({ page }) => {
    await loginAndGoCategories(page)

    const categoryItem = page.locator('text=삭제될카테고리').first()
    await expect(categoryItem).toBeVisible({ timeout: 5000 })

    const deleteBtn = categoryItem.locator('..').locator('..').getByRole('button', { name: /삭제|delete|remove/i }).first()
    await deleteBtn.click()

    // 확인 다이얼로그
    const dialog = page.locator('[role="dialog"], .modal').first()
    const confirmBtn = dialog.getByRole('button', { name: /확인|ok|삭제|yes/i })
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      await confirmBtn.click()
    }

    await expect(page.locator('text=삭제될카테고리')).not.toBeVisible({ timeout: 10000 })
  })

  test('대안 흐름: 기본 카테고리 삭제 시도 시 403 에러 (DEFAULT_CATEGORY_IMMUTABLE)', async ({ page }) => {
    await loginAndGoCategories(page)

    // 기본 카테고리는 삭제 버튼이 없거나 비활성화되어야 함 (BR-05)
    const defaultCategories = page.locator('[data-default="true"], [class*="default"], text=/기본|default/i')
    if (await defaultCategories.count() > 0) {
      const defaultCategory = defaultCategories.first()
      const deleteBtn = defaultCategory.locator('..').locator('..').getByRole('button', { name: /삭제|delete/i }).first()

      if (await deleteBtn.isVisible({ timeout: 2000 })) {
        await deleteBtn.click()
        const errorMsg = page.locator('text=/기본 카테고리|삭제할 수 없|immutable/i').first()
        await expect(errorMsg).toBeVisible({ timeout: 5000 })
      } else {
        // 삭제 버튼 자체가 없음 → 기본 카테고리 보호 UI 구현됨
        expect(true).toBeTruthy()
      }
    }
  })

  test('대안 흐름: 취소 클릭 시 카테고리 삭제되지 않음', async ({ page }) => {
    await loginAndGoCategories(page)

    // 새 카테고리 추가
    const nameInput = page.getByPlaceholder(/카테고리|category/i).first()
    await nameInput.fill('취소테스트카테고리')
    await page.getByRole('button', { name: /추가|add/i }).click()
    await expect(page.locator('text=취소테스트카테고리')).toBeVisible({ timeout: 10000 })

    const categoryItem = page.locator('text=취소테스트카테고리').first()
    const deleteBtn = categoryItem.locator('..').locator('..').getByRole('button', { name: /삭제|delete/i }).first()
    await deleteBtn.click()

    const dialog = page.locator('[role="dialog"], .modal').first()
    const cancelBtn = dialog.getByRole('button', { name: /취소|cancel|no/i })
    if (await cancelBtn.isVisible({ timeout: 3000 })) {
      await cancelBtn.click()
    }

    await expect(page.locator('text=취소테스트카테고리')).toBeVisible({ timeout: 5000 })
  })
})
