# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s03-profile.spec.ts >> S-03: 개인정보 수정 >> 기본 흐름: 이름 변경 후 저장 성공
- Location: s03-profile.spec.ts:36:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.clear: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/이름|name/i)

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - region "TodoList overview" [ref=e5]:
    - generic [ref=e6]: TodoList Workspace
    - heading "일정과 오늘 할일을 한 화면에서 관리하세요." [level=1] [ref=e7]
    - paragraph [ref=e8]: 캘린더, 빠른 추가, 진행률, 카테고리 통계를 연결해 매일의 업무 흐름을 더 명확하게 정리합니다.
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Today
        - generic [ref=e12]: "08"
      - generic [ref=e13]:
        - generic [ref=e14]: Progress
        - generic [ref=e15]: 72%
      - generic [ref=e16]:
        - generic [ref=e17]: Calendar
        - generic [ref=e18]: May
  - region "Login form" [ref=e19]:
    - generic [ref=e20]:
      - heading "TodoList 로그인" [level=2] [ref=e21]
      - paragraph [ref=e22]: 캘린더, 오늘 할일, 일정 관리를 한 화면에서 관리하세요.
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: 이메일
          - textbox "이메일" [ref=e26]:
            - /placeholder: you@example.com
        - generic [ref=e27]:
          - generic [ref=e28]: 비밀번호
          - textbox "비밀번호" [ref=e29]:
            - /placeholder: 비밀번호 입력
        - button "로그인" [ref=e30] [cursor=pointer]
        - paragraph [ref=e31]:
          - text: 계정이 없으신가요?
          - link "회원가입" [ref=e32] [cursor=pointer]:
            - /url: /signup
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * S-03: 개인정보 수정 시나리오
  5  |  * UC-03 / GET /api/users/me · PATCH /api/users/me
  6  |  */
  7  | 
  8  | const TS = Date.now()
  9  | const USER = {
  10 |   email: `test_s03_${TS}@example.com`,
  11 |   password: 'Test1234!',
  12 |   name: 'S03유저',
  13 | }
  14 | 
  15 | test.describe('S-03: 개인정보 수정', () => {
  16 |   test.beforeAll(async ({ browser }) => {
  17 |     const page = await browser.newPage()
  18 |     await page.goto('/signup')
  19 |     await page.getByLabel(/이름|name/i).fill(USER.name)
  20 |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  21 |     await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
  22 |     await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
  23 |     await page.waitForURL(/\/login/, { timeout: 10000 })
  24 |     await page.close()
  25 |   })
  26 | 
  27 |   async function loginAndGoProfile(page: any) {
  28 |     await page.goto('/login')
  29 |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  30 |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  31 |     await page.getByRole('button', { name: /로그인|login/i }).click()
  32 |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  33 |     await page.goto('/profile')
  34 |   }
  35 | 
  36 |   test('기본 흐름: 이름 변경 후 저장 성공', async ({ page }) => {
  37 |     await loginAndGoProfile(page)
  38 | 
  39 |     const nameInput = page.getByLabel(/이름|name/i)
> 40 |     await nameInput.clear()
     |                     ^ Error: locator.clear: Test timeout of 30000ms exceeded.
  41 |     await nameInput.fill('변경된이름')
  42 | 
  43 |     await page.getByRole('button', { name: /저장|save/i }).click()
  44 | 
  45 |     const successMsg = page.locator('text=/성공|저장|수정|updated/i').first()
  46 |     await expect(successMsg).toBeVisible({ timeout: 5000 })
  47 |   })
  48 | 
  49 |   test('기본 흐름: 비밀번호 변경 성공', async ({ page }) => {
  50 |     await loginAndGoProfile(page)
  51 | 
  52 |     const currentPwInput = page.getByLabel(/현재 비밀번호|current password/i)
  53 |     if (await currentPwInput.isVisible()) {
  54 |       await currentPwInput.fill(USER.password)
  55 |     }
  56 | 
  57 |     const newPwInput = page.getByLabel(/새 비밀번호|new password/i).first()
  58 |     const confirmPwInput = page.getByLabel(/비밀번호 확인|confirm/i)
  59 | 
  60 |     if (await newPwInput.isVisible()) {
  61 |       await newPwInput.fill('NewPass5678!')
  62 |       if (await confirmPwInput.isVisible()) {
  63 |         await confirmPwInput.fill('NewPass5678!')
  64 |       }
  65 |       await page.getByRole('button', { name: /저장|save/i }).click()
  66 |       const successMsg = page.locator('text=/성공|저장|수정|updated/i').first()
  67 |       await expect(successMsg).toBeVisible({ timeout: 5000 })
  68 |     } else {
  69 |       test.skip(true, '비밀번호 변경 UI가 현재 화면에 없음')
  70 |     }
  71 |   })
  72 | 
  73 |   test('대안 흐름: 현재 비밀번호 불일치 시 401 에러 표시', async ({ page }) => {
  74 |     await loginAndGoProfile(page)
  75 | 
  76 |     const currentPwInput = page.getByLabel(/현재 비밀번호|current password/i)
  77 |     if (!(await currentPwInput.isVisible())) {
  78 |       test.skip(true, '비밀번호 변경 UI 없음')
  79 |       return
  80 |     }
  81 | 
  82 |     await currentPwInput.fill('WrongCurrentPw!')
  83 |     const newPwInput = page.getByLabel(/새 비밀번호|new password/i).first()
  84 |     await newPwInput.fill('NewPass5678!')
  85 |     const confirmPwInput = page.getByLabel(/비밀번호 확인|confirm/i)
  86 |     if (await confirmPwInput.isVisible()) {
  87 |       await confirmPwInput.fill('NewPass5678!')
  88 |     }
  89 | 
  90 |     await page.getByRole('button', { name: /저장|save/i }).click()
  91 | 
  92 |     const errorMsg = page.locator('text=/올바르지|incorrect|현재 비밀번호|unauthorized/i').first()
  93 |     await expect(errorMsg).toBeVisible({ timeout: 5000 })
  94 |   })
  95 | })
  96 | 
```