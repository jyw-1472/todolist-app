import { test, expect } from '@playwright/test'

/**
 * S-06: 할일 삭제
 * DELETE /api/todos/:id
 *
 * 삭제 버튼: aria-label="삭제: {todo.title}", button text="Del"
 * 확인 다이얼로그: "정말 삭제하시겠습니까?", 버튼 "삭제" / "취소"
 */

const TS = Date.now()
const USER = { email: `s06_${TS}@example.com`, password: 'Test1234!', name: 'S06유저' }

async function login(page: any) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(USER.email)
  await page.getByLabel('비밀번호').fill(USER.password)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('/', { timeout: 10000 })
}

async function addTodo(page: any, title: string) {
  await page.getByPlaceholder('할일 제목 입력').fill(title)
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 10000 })
}

test.describe('S-06: 할일 삭제', () => {
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

  test('기본 흐름: 삭제 버튼 → 확인 다이얼로그 → 삭제 완료', async ({ page }) => {
    await login(page)
    await addTodo(page, '삭제될할일_S06A')

    // 삭제 버튼 클릭 (aria-label="삭제: 삭제될할일_S06A")
    await page.getByRole('button', { name: '삭제: 삭제될할일_S06A' }).click()

    // 확인 다이얼로그 확인
    await expect(page.locator('text=정말 삭제하시겠습니까?')).toBeVisible({ timeout: 3000 })

    // "삭제" 버튼 클릭 (danger variant)
    const dialog = page.locator('[role="dialog"]')
    await dialog.getByRole('button', { name: '삭제' }).click()

    // 목록에서 사라져야 함
    await expect(page.locator('text=삭제될할일_S06A')).not.toBeVisible({ timeout: 10000 })
  })

  test('대안 흐름: 확인 다이얼로그에서 취소 → 삭제되지 않음', async ({ page }) => {
    await login(page)
    await addTodo(page, '취소테스트할일_S06B')

    await page.getByRole('button', { name: '삭제: 취소테스트할일_S06B' }).click()

    await expect(page.locator('text=정말 삭제하시겠습니까?')).toBeVisible({ timeout: 3000 })

    const dialog = page.locator('[role="dialog"]')
    await dialog.getByRole('button', { name: '취소' }).click()

    // 여전히 존재해야 함
    await expect(page.locator('text=취소테스트할일_S06B')).toBeVisible({ timeout: 5000 })
  })
})
