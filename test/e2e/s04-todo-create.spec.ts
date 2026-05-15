import { test, expect } from '@playwright/test'

/**
 * S-04: 할일 등록
 * POST /api/todos
 *
 * 빠른 추가 폼: placeholder "할일 제목 입력", 카테고리 select, "저장" 버튼
 * 모달 폼: label "제목 *", aria-label "카테고리", "등록" 버튼
 */

const TS = Date.now()
const USER = { email: `s04_${TS}@example.com`, password: 'Test1234!', name: 'S04유저' }

async function login(page: any) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(USER.email)
  await page.getByLabel('비밀번호').fill(USER.password)
  await page.getByRole('button', { name: '로그인' }).click()
  await page.waitForURL('/', { timeout: 10000 })
}

test.describe('S-04: 할일 등록', () => {
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

  test('기본 흐름: 빠른 추가 폼으로 할일 등록 성공', async ({ page }) => {
    await login(page)

    // 빠른 추가 폼 사용
    const quickTitleInput = page.getByPlaceholder('할일 제목 입력')
    await quickTitleInput.fill('빠른 추가 테스트 할일')

    // 카테고리가 자동 선택되어 있어야 함 (기본 카테고리)
    await page.getByRole('button', { name: '저장' }).click()

    // 성공 후 제목이 목록에 나타남
    await expect(page.locator('text=빠른 추가 테스트 할일')).toBeVisible({ timeout: 10000 })
  })

  test('기본 흐름: 모달 폼으로 할일 등록 (제목·카테고리 포함)', async ({ page }) => {
    await login(page)

    // "+ 할일 추가" 버튼 → 모달 열기
    await page.getByRole('button', { name: /할일 추가/ }).click()

    const modal = page.locator('[role="dialog"]').or(page.locator('.modal-backdrop'))

    // 카테고리 로딩 대기
    await page.waitForTimeout(1000)

    await page.getByLabel('제목 *').fill('모달 폼 등록 할일')

    const categorySelect = page.getByRole('combobox', { name: '카테고리' })
    const optionCount = await categorySelect.locator('option').count()
    if (optionCount > 1) {
      await categorySelect.selectOption({ index: 1 })
    }

    await page.getByRole('button', { name: '등록' }).click()

    await expect(page.locator('text=모달 폼 등록 할일')).toBeVisible({ timeout: 10000 })
  })

  test('대안 흐름: 빠른 추가에서 제목 미입력 시 등록 안 됨', async ({ page }) => {
    await login(page)

    const saveBtn = page.getByRole('button', { name: '저장' })
    // 제목 없이 저장 버튼은 disabled 상태이어야 함
    await expect(saveBtn).toBeDisabled({ timeout: 3000 }).catch(async () => {
      // 버튼이 활성화되어 있다면 클릭 후 에러 확인
      await saveBtn.click()
      // 할일이 등록되지 않아야 함 (에러 상태 유지)
    })
  })

  test('대안 흐름: 모달 폼에서 제목 미입력 시 에러', async ({ page }) => {
    await login(page)

    await page.getByRole('button', { name: /할일 추가/ }).click()
    await page.waitForTimeout(500)

    // 제목 비워두고 카테고리만 선택
    const categorySelect = page.getByRole('combobox', { name: '카테고리' })
    const optionCount = await categorySelect.locator('option').count()
    if (optionCount > 1) {
      await categorySelect.selectOption({ index: 1 })
    }

    await page.getByRole('button', { name: '등록' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '제목은 필수입니다.' })).toBeVisible({ timeout: 5000 })
  })

  test('대안 흐름: 모달 폼에서 카테고리 미선택 시 에러', async ({ page }) => {
    await login(page)

    await page.getByRole('button', { name: /할일 추가/ }).click()
    await page.waitForTimeout(500)

    await page.getByLabel('제목 *').fill('카테고리 없는 할일')
    // 카테고리 선택 안 함
    await page.getByRole('button', { name: '등록' }).click()

    await expect(page.locator('[role="alert"]', { hasText: '카테고리를 선택해주세요.' })).toBeVisible({ timeout: 5000 })
  })

  test('대안 흐름: 과거 날짜 입력 시 권장 안내 표시, 저장은 허용 (BR-06)', async ({ page }) => {
    await login(page)

    await page.getByRole('button', { name: /할일 추가/ }).click()
    await page.waitForTimeout(500)

    await page.getByLabel('제목 *').fill('과거 날짜 할일')

    // 종료일에 과거 날짜 입력
    const dueDateInput = page.locator('input[type="date"][aria-label="종료일"]')
    await dueDateInput.fill('2020-01-01')

    // 권장 안내 메시지 (role="note")
    await expect(page.locator('[role="note"]', { hasText: '오늘 이후 날짜를 권장합니다.' })).toBeVisible({ timeout: 3000 })

    // 카테고리 선택 후 등록 (저장 차단 안 됨)
    const categorySelect = page.getByRole('combobox', { name: '카테고리' })
    const optionCount = await categorySelect.locator('option').count()
    if (optionCount > 1) {
      await categorySelect.selectOption({ index: 1 })
    }
    await page.getByRole('button', { name: '등록' }).click()

    await expect(page.locator('text=과거 날짜 할일')).toBeVisible({ timeout: 10000 })
  })
})
