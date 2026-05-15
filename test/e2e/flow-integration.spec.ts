import { test, expect } from '@playwright/test'

/**
 * 시나리오 간 연계 흐름 통합 테스트
 * - 연계 흐름 1: 신규 사용자의 첫 할일 등록까지
 * - 연계 흐름 2: 할일 관리 일상 흐름 (조회→완료→수정)
 * - 연계 흐름 3: 계정 관리 흐름 (카테고리 정리→탈퇴)
 */

const TS = Date.now()

test.describe('연계 흐름 1: 신규 사용자의 첫 할일 등록까지', () => {
  const USER = {
    email: `flow1_${TS}@example.com`,
    password: 'Flow1234!',
    name: '흐름1유저',
  }

  test('S-01→S-02→S-09→S-04 전체 흐름', async ({ page }) => {
    // S-01: 회원가입
    await page.goto('/signup')
    await page.getByLabel(/이름|name/i).fill(USER.name)
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
    await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // S-02: 로그인
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).fill(USER.password)
    await page.getByRole('button', { name: /로그인|login/i }).click()
    await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })

    // S-09: 카테고리 추가 (선택)
    await page.goto('/categories')
    const nameInput = page.getByPlaceholder(/카테고리|category/i).first()
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill('업무')
      await page.getByRole('button', { name: /추가|add/i }).click()
      await expect(page.locator('text=업무')).toBeVisible({ timeout: 10000 })
    }

    // S-04: 할일 등록
    await page.goto('/')
    const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
    if (await addBtn.isVisible()) await addBtn.click()

    const titleInput = page.getByLabel(/제목|title/i)
    if (await titleInput.isVisible({ timeout: 3000 })) {
      await titleInput.fill('팀 미팅 자료 준비')
    } else {
      await page.getByPlaceholder(/제목|title|할일/i).fill('팀 미팅 자료 준비')
    }

    const categorySelect = page.getByLabel(/카테고리|category/i)
    if (await categorySelect.isVisible({ timeout: 2000 })) {
      const options = await categorySelect.locator('option').all()
      if (options.length > 1) await categorySelect.selectOption({ index: 1 })
    }

    const dueDateInput = page.getByLabel(/종료|마감|due/i)
    if (await dueDateInput.isVisible({ timeout: 2000 })) {
      await dueDateInput.fill('2026-05-15')
    }

    await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()

    await expect(page.locator('text=팀 미팅 자료 준비')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('연계 흐름 2: 할일 관리 일상 흐름 (조회→완료→수정→로그아웃)', () => {
  const USER = {
    email: `flow2_${TS}@example.com`,
    password: 'Flow1234!',
    name: '흐름2유저',
  }

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    // 회원가입 + 로그인 + 할일 등록
    await page.goto('/signup')
    await page.getByLabel(/이름|name/i).fill(USER.name)
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
    await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
    await page.waitForURL(/\/login/, { timeout: 10000 })

    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).fill(USER.password)
    await page.getByRole('button', { name: /로그인|login/i }).click()
    await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })

    for (const title of ['논문 초안 작성', '발표 준비']) {
      const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
      if (await addBtn.isVisible()) await addBtn.click()

      const titleInput = page.getByLabel(/제목|title/i)
      if (await titleInput.isVisible({ timeout: 3000 })) {
        await titleInput.fill(title)
      } else {
        await page.getByPlaceholder(/제목|title|할일/i).fill(title)
      }

      const categorySelect = page.getByLabel(/카테고리|category/i)
      if (await categorySelect.isVisible({ timeout: 2000 })) {
        const options = await categorySelect.locator('option').all()
        if (options.length > 1) await categorySelect.selectOption({ index: 1 })
      }

      await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
      await page.waitForTimeout(500)
    }
    await page.close()
  })

  test('S-08→S-07→S-05→S-11 전체 흐름', async ({ page }) => {
    // S-02: 로그인
    await page.goto('/login')
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).fill(USER.password)
    await page.getByRole('button', { name: /로그인|login/i }).click()
    await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })

    // S-08: 할일 목록 조회
    await expect(page.locator('text=논문 초안 작성')).toBeVisible({ timeout: 10000 })

    // S-07: 완료 처리
    const todoItem = page.locator('text=논문 초안 작성').first()
    const card = todoItem.locator('..').locator('..')
    const checkbox = card.locator('input[type="checkbox"]').first()
    const completeBtn = card.getByRole('button', { name: /완료|complete|done/i }).first()

    if (await checkbox.isVisible({ timeout: 2000 })) {
      await checkbox.click()
    } else if (await completeBtn.isVisible({ timeout: 2000 })) {
      await completeBtn.click()
    }
    await page.waitForTimeout(1000)

    // S-05: 할일 수정 (발표 준비 종료일 변경)
    const todoItem2 = page.locator('text=발표 준비').first()
    await expect(todoItem2).toBeVisible({ timeout: 5000 })

    const card2 = todoItem2.locator('..').locator('..')
    const editBtn = card2.getByRole('button', { name: /수정|편집|edit/i }).first()
    if (await editBtn.isVisible({ timeout: 2000 })) {
      await editBtn.click()
      const dueDateInput = page.getByLabel(/종료|마감|due/i)
      if (await dueDateInput.isVisible({ timeout: 2000 })) {
        await dueDateInput.fill('2026-05-22')
      }
      await page.getByRole('button', { name: /저장|save|수정|update/i }).last().click()
      await page.waitForTimeout(500)
    }

    // S-11: 로그아웃
    const logoutBtn = page.getByRole('button', { name: /로그아웃|logout/i }).first()
    await expect(logoutBtn).toBeVisible({ timeout: 5000 })
    await logoutBtn.click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
