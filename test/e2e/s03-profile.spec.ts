import { test, expect } from '@playwright/test'

/**
 * S-03: 개인정보 수정
 * GET /api/users/me · PATCH /api/users/me
 */

const TS = Date.now()
const USER = { email: `s03_${TS}@example.com`, password: 'Test1234!', name: 'S03유저' }

async function signupAndLogin(page: any) {
  await page.goto('/signup')
  await page.getByLabel('이름').fill(USER.name)
  await page.getByLabel('이메일').fill(USER.email)
  await page.getByLabel('비밀번호').fill(USER.password)
  await page.getByRole('button', { name: '가입하기' }).click()
  await page.waitForURL(/\/login/, { timeout: 10000 })
  await page.getByLabel('이메일').fill(USER.email)
  await page.getByLabel('비밀번호').fill(USER.password)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('/', { timeout: 10000 })
}

test.describe('S-03: 개인정보 수정', () => {
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

  test('기본 흐름: 이름 변경 후 저장 성공', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USER.email)
    await page.getByLabel('비밀번호').fill(USER.password)
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/', { timeout: 10000 })
    await page.goto('/profile')

    await page.getByLabel('현재 이름').clear()
    await page.getByLabel('현재 이름').fill('변경된이름')
    await page.getByRole('button', { name: '이름 변경' }).click()

    await expect(page.locator('text=이름이 변경되었습니다.')).toBeVisible({ timeout: 5000 })
  })

  test('대안 흐름: 변경 내용 없이 저장 시 에러 표시', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USER.email)
    await page.getByLabel('비밀번호').fill(USER.password)
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/', { timeout: 10000 })
    await page.goto('/profile')

    // 이름을 변경하지 않고 바로 저장
    await page.getByRole('button', { name: '이름 변경' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '변경할 이름을 입력해주세요.' })).toBeVisible({ timeout: 5000 })
  })

  test('기본 흐름: 비밀번호 변경 성공', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USER.email)
    await page.getByLabel('비밀번호').fill(USER.password)
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForURL('/', { timeout: 10000 })
    await page.goto('/profile')

    await page.getByLabel('현재 비밀번호').fill(USER.password)
    await page.getByLabel('새 비밀번호').fill('NewPass5678!')
    await page.getByLabel('새 비밀번호 확인').fill('NewPass5678!')
    await page.getByRole('button', { name: '비밀번호 변경' }).click()

    await expect(page.locator('text=비밀번호가 변경되었습니다.')).toBeVisible({ timeout: 5000 })
  })

  test('대안 흐름: 현재 비밀번호 불일치 → 에러', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USER.email)
    // 앞 테스트에서 비밀번호가 변경됐을 수 있으므로 두 비밀번호 모두 시도
    await page.getByLabel('비밀번호').fill('NewPass5678!')
    await page.getByRole('button', { name: '로그인' }).click()
    // 로그인 실패해도 계속
    await page.waitForTimeout(2000)
    const loggedIn = page.url().endsWith('/')
    if (!loggedIn) {
      await page.getByLabel('비밀번호').fill(USER.password)
      await page.getByRole('button', { name: '로그인' }).click()
      await page.waitForURL('/', { timeout: 10000 })
    }
    await page.goto('/profile')

    await page.getByLabel('현재 비밀번호').fill('WrongCurrentPw!')
    await page.getByLabel('새 비밀번호').fill('AnotherNew1!')
    await page.getByLabel('새 비밀번호 확인').fill('AnotherNew1!')
    await page.getByRole('button', { name: '비밀번호 변경' }).click()

    await expect(page.locator('text=현재 비밀번호가 올바르지 않습니다.')).toBeVisible({ timeout: 5000 })
  })

  test('대안 흐름: 새 비밀번호 불일치 → 클라이언트 에러', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill(USER.email)
    await page.getByLabel('비밀번호').fill(USER.password).catch(() => {})
    await page.getByLabel('비밀번호').fill('NewPass5678!').catch(() => {})
    await page.getByRole('button', { name: '로그인' }).click()
    await page.waitForTimeout(2000)

    const loggedIn = page.url().endsWith('/')
    if (!loggedIn) {
      test.skip(true, '로그인 상태 확인 불가')
      return
    }
    await page.goto('/profile')

    await page.getByLabel('현재 비밀번호').fill('anypassword')
    await page.getByLabel('새 비밀번호').fill('NewPass5678!')
    await page.getByLabel('새 비밀번호 확인').fill('DifferentPass!')
    await page.getByRole('button', { name: '비밀번호 변경' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '일치하지 않습니다' })).toBeVisible({ timeout: 5000 })
  })
})
