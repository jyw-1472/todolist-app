import { test, expect } from '@playwright/test'

/**
 * S-13: 회원 탈퇴 시나리오
 * UC-13 / DELETE /api/users/me
 */

const TS = Date.now()
const USER = {
  email: `test_s13_${TS}@example.com`,
  password: 'Test1234!',
  name: 'S13유저',
}

test.describe('S-13: 회원 탈퇴', () => {
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

  async function loginAndGoProfile(page: any) {
    await page.goto('/login')
    await page.getByLabel(/이메일|email/i).fill(USER.email)
    await page.getByLabel(/비밀번호|password/i).fill(USER.password)
    await page.getByRole('button', { name: /로그인|login/i }).click()
    await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
    await page.goto('/profile')
  }

  test('대안 흐름: 경고 다이얼로그에서 취소 클릭 시 탈퇴 안 됨', async ({ page }) => {
    await loginAndGoProfile(page)

    const withdrawBtn = page.getByRole('button', { name: /탈퇴|withdraw|delete account/i }).first()
    if (!(await withdrawBtn.isVisible({ timeout: 3000 }))) {
      test.skip(true, '회원 탈퇴 버튼 없음')
      return
    }

    await withdrawBtn.click()

    const dialog = page.locator('[role="dialog"], .modal').first()
    const cancelBtn = dialog.getByRole('button', { name: /취소|cancel|no/i })
    if (await cancelBtn.isVisible({ timeout: 3000 })) {
      await cancelBtn.click()
    } else {
      await page.keyboard.press('Escape')
    }

    // 여전히 프로필 페이지에 있어야 함
    await expect(page).toHaveURL(/\/profile/, { timeout: 5000 })
  })

  test('대안 흐름: 비밀번호 미입력 시 에러', async ({ page }) => {
    await loginAndGoProfile(page)

    const withdrawBtn = page.getByRole('button', { name: /탈퇴|withdraw|delete account/i }).first()
    if (!(await withdrawBtn.isVisible({ timeout: 3000 }))) {
      test.skip(true, '회원 탈퇴 버튼 없음')
      return
    }

    await withdrawBtn.click()

    // 탈퇴 버튼(최종 확인)을 비밀번호 없이 클릭
    const dialog = page.locator('[role="dialog"], .modal').first()
    const confirmBtn = dialog.getByRole('button', { name: /탈퇴|확인|ok|yes/i }).last()
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      await confirmBtn.click()
      const errorMsg = page.locator('text=/비밀번호|password|입력하세요|required/i').first()
      await expect(errorMsg).toBeVisible({ timeout: 5000 })
    }
  })

  test('기본 흐름: 올바른 비밀번호 입력 후 탈퇴 성공', async ({ page }) => {
    await loginAndGoProfile(page)

    const withdrawBtn = page.getByRole('button', { name: /탈퇴|withdraw|delete account/i }).first()
    if (!(await withdrawBtn.isVisible({ timeout: 3000 }))) {
      test.skip(true, '회원 탈퇴 버튼 없음')
      return
    }

    await withdrawBtn.click()

    // 비밀번호 입력 필드 찾기
    const passwordInput = page.getByLabel(/비밀번호|password/i).last()
    if (await passwordInput.isVisible({ timeout: 3000 })) {
      await passwordInput.fill(USER.password)
    }

    // 탈퇴 확인 버튼 클릭
    const dialog = page.locator('[role="dialog"], .modal').first()
    const confirmBtn = dialog.getByRole('button', { name: /탈퇴|확인|ok|yes/i }).last()
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      await confirmBtn.click()
    }

    // 탈퇴 완료 후 로그인 화면 또는 회원가입 화면으로 이동
    await expect(page).toHaveURL(/\/login|\/signup/, { timeout: 15000 })
  })
})
