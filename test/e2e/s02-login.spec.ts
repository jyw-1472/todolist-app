import { test, expect } from '@playwright/test'

/**
 * S-02: 로그인
 * POST /api/auth/login
 */

const TS = Date.now()
const USER = { email: `s02_${TS}@example.com`, password: 'Test1234!', name: 'S02유저' }

test.describe('S-02: 로그인', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto('/signup')
    await page.getByLabel('이름').fill(USER.name)
    await page.getByLabel('이메일').fill(USER.email)
    await page.getByLabel('비밀번호').fill(USER.password)
    await page.getByRole('button', { name: '가입하기' }).click()
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await ctx.close()
  })

  test('기본 흐름: 올바른 자격증명 → 할일 목록 화면 이동', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USER.email)
    await page.getByLabel('비밀번호').fill(USER.password)
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  test('대안 흐름: 이메일 미입력 → 클라이언트 에러', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('비밀번호').fill(USER.password)
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '이메일을 입력해주세요.' })).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('대안 흐름: 비밀번호 미입력 → 클라이언트 에러', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USER.email)
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '비밀번호를 입력해주세요.' })).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('대안 흐름: 잘못된 비밀번호 → 401 에러 메시지', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USER.email)
    await page.getByLabel('비밀번호').fill('WrongPass999!')
    await page.getByRole('button', { name: '로그인' }).click()

    // 서버 에러 메시지 (ErrorMessage 컴포넌트)
    await expect(page.locator('text=이메일 또는 비밀번호').or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('대안 흐름: 존재하지 않는 이메일 → 401 에러 메시지', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill('nobody@nowhere.com')
    await page.getByLabel('비밀번호').fill(USER.password)
    await page.getByRole('button', { name: '로그인' }).click()

    await expect(page.locator('text=이메일 또는 비밀번호').or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })
})
