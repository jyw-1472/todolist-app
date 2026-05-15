import { test, expect } from '@playwright/test'

/**
 * S-05: 할일 수정
 * GET /api/todos/:id · PATCH /api/todos/:id
 *
 * TodoItem 수정 버튼: aria-label="수정: {todo.title}", button text="Edit"
 * 수정 모달: label "제목 *", "저장" 버튼
 */

const TS = Date.now()
const USER = { email: `s05_${TS}@example.com`, password: 'Test1234!', name: 'S05유저' }
const TODO_TITLE = '수정될할일_S05'

async function login(page: any) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(USER.email)
  await page.getByLabel('비밀번호').fill(USER.password)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('/', { timeout: 10000 })
}

test.describe('S-05: 할일 수정', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

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

    // 빠른 추가로 할일 생성
    await page.getByPlaceholder('할일 제목 입력').fill(TODO_TITLE)
    await page.getByRole('button', { name: '저장' }).click()
    await expect(page.locator(`text=${TODO_TITLE}`)).toBeVisible({ timeout: 10000 })

    await ctx.close()
  })

  test('기본 흐름: 할일 제목 수정 후 저장 성공', async ({ page }) => {
    await login(page)

    await expect(page.locator(`text=${TODO_TITLE}`)).toBeVisible({ timeout: 10000 })

    // 수정 버튼 (aria-label="수정: {title}", 텍스트는 "Edit")
    const editBtn = page.getByRole('button', { name: `수정: ${TODO_TITLE}` })
    await editBtn.click()

    await page.waitForTimeout(500)
    const titleInput = page.getByLabel('제목 *')
    await titleInput.clear()
    await titleInput.fill('수정된할일_S05')

    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.locator('text=수정된할일_S05')).toBeVisible({ timeout: 10000 })
  })

  test('대안 흐름: 제목을 빈 값으로 저장 시도 시 에러', async ({ page }) => {
    await login(page)

    const todoText = page.locator('text=수정된할일_S05').or(page.locator(`text=${TODO_TITLE}`)).first()
    await expect(todoText).toBeVisible({ timeout: 10000 })

    const titleText = await todoText.textContent()
    const editBtn = page.getByRole('button', { name: new RegExp(`수정:.*${titleText?.substring(0, 5)}`) }).first()
    await editBtn.click()

    await page.waitForTimeout(500)
    const titleInput = page.getByLabel('제목 *')
    await titleInput.clear()

    await page.getByRole('button', { name: '저장' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '제목은 필수입니다.' })).toBeVisible({ timeout: 5000 })
  })

  test('대안 흐름: 종료 예정일 수정', async ({ page }) => {
    await login(page)

    const todoText = page.locator('text=수정된할일_S05').or(page.locator(`text=${TODO_TITLE}`)).first()
    await expect(todoText).toBeVisible({ timeout: 10000 })

    const titleText = await todoText.textContent()
    const editBtn = page.getByRole('button', { name: new RegExp(`수정:.*${titleText?.substring(0, 5)}`) }).first()
    await editBtn.click()

    await page.waitForTimeout(500)
    const dueDateInput = page.locator('input[type="date"][aria-label="종료일"]')
    await dueDateInput.fill('2026-05-22')

    await page.getByRole('button', { name: '저장' }).click()

    // 수정 성공 → 모달 닫힘
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
  })
})
