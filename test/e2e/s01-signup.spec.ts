import { test, expect } from '@playwright/test'

/**
 * S-01: 회원가입
 * POST /api/auth/signup
 */

const uniqueEmail = () => `s01_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`

test.describe('S-01: 회원가입', () => {
  test('기본 흐름: 이름·이메일·비밀번호 입력 후 가입 성공 → 로그인 페이지', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel('이름').fill('테스트유저')
    await page.getByLabel('이메일').fill(uniqueEmail())
    await page.getByLabel('비밀번호').fill('Test1234!')
    await page.getByRole('button', { name: '가입하기' }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('대안 흐름: 이름 미입력 시 클라이언트 에러 표시', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel('이메일').fill(uniqueEmail())
    await page.getByLabel('비밀번호').fill('Test1234!')
    await page.getByRole('button', { name: '가입하기' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '이름을 입력해주세요.' })).toBeVisible({ timeout: 5000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('대안 흐름: 이메일 미입력 시 클라이언트 에러 표시', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel('이름').fill('테스트유저')
    await page.getByLabel('비밀번호').fill('Test1234!')
    await page.getByRole('button', { name: '가입하기' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '이메일을 입력해주세요.' })).toBeVisible({ timeout: 5000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('대안 흐름: 비밀번호 8자 미만 시 에러 표시', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel('이름').fill('테스트유저')
    await page.getByLabel('이메일').fill(uniqueEmail())
    await page.getByLabel('비밀번호').fill('short')
    await page.getByRole('button', { name: '가입하기' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '8자 이상' })).toBeVisible({ timeout: 5000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('대안 흐름: 중복 이메일 → 409 에러 메시지 표시', async ({ page }) => {
    const email = uniqueEmail()

    // 첫 번째 가입
    await page.goto('/signup')
    await page.getByLabel('이름').fill('유저A')
    await page.getByLabel('이메일').fill(email)
    await page.getByLabel('비밀번호').fill('Test1234!')
    await page.getByRole('button', { name: '가입하기' }).click()
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // 동일 이메일 재가입
    await page.goto('/signup')
    await page.getByLabel('이름').fill('유저B')
    await page.getByLabel('이메일').fill(email)
    await page.getByLabel('비밀번호').fill('Test1234!')
    await page.getByRole('button', { name: '가입하기' }).click()

    await expect(page.locator('text=이미 사용 중인 이메일').or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 })
    await expect(page).not.toHaveURL(/\/login/)
  })
})
