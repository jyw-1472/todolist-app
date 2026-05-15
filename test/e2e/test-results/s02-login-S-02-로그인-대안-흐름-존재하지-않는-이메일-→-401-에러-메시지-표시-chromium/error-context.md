# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s02-login.spec.ts >> S-02: 로그인 >> 대안 흐름: 존재하지 않는 이메일 → 401 에러 메시지 표시
- Location: s02-login.spec.ts:58:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/올바르지|incorrect|잘못|unauthorized/i').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=/올바르지|incorrect|잘못|unauthorized/i').first()

```

```yaml
- region "TodoList overview":
  - text: TodoList Workspace
  - heading "일정과 오늘 할일을 한 화면에서 관리하세요." [level=1]
  - paragraph: 캘린더, 빠른 추가, 진행률, 카테고리 통계를 연결해 매일의 업무 흐름을 더 명확하게 정리합니다.
- region "Login form":
  - heading "TodoList 로그인" [level=2]
  - paragraph: 캘린더, 오늘 할일, 일정 관리를 한 화면에서 관리하세요.
  - text: 이메일
  - textbox "이메일":
    - /placeholder: you@example.com
  - text: 비밀번호
  - textbox "비밀번호":
    - /placeholder: 비밀번호 입력
  - button "로그인"
  - paragraph:
    - text: 계정이 없으신가요?
    - link "회원가입":
      - /url: /signup
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * S-02: 로그인 시나리오
  5  |  * UC-02 / POST /api/auth/login
  6  |  */
  7  | 
  8  | const TS = Date.now()
  9  | const USER = {
  10 |   email: `test_s02_${TS}@example.com`,
  11 |   password: 'Test1234!',
  12 |   name: 'S02유저',
  13 | }
  14 | 
  15 | test.describe('S-02: 로그인', () => {
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
  27 |   test('기본 흐름: 올바른 이메일·비밀번호 입력 → 할일 목록 화면 이동', async ({ page }) => {
  28 |     await page.goto('/login')
  29 | 
  30 |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  31 |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  32 |     await page.getByRole('button', { name: /로그인|login/i }).click()
  33 | 
  34 |     await expect(page).toHaveURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  35 |   })
  36 | 
  37 |   test('대안 흐름: 이메일 미입력 시 클라이언트 유효성 오류', async ({ page }) => {
  38 |     await page.goto('/login')
  39 | 
  40 |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  41 |     await page.getByRole('button', { name: /로그인|login/i }).click()
  42 | 
  43 |     await expect(page).not.toHaveURL(/\/$|\/todos|\/home/)
  44 |   })
  45 | 
  46 |   test('대안 흐름: 잘못된 비밀번호 → 401 에러 메시지 표시', async ({ page }) => {
  47 |     await page.goto('/login')
  48 | 
  49 |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  50 |     await page.getByLabel(/비밀번호|password/i).fill('WrongPassword!')
  51 |     await page.getByRole('button', { name: /로그인|login/i }).click()
  52 | 
  53 |     const errorMsg = page.locator('text=/올바르지|incorrect|잘못|unauthorized/i').first()
  54 |     await expect(errorMsg).toBeVisible({ timeout: 5000 })
  55 |     await expect(page).toHaveURL(/\/login/)
  56 |   })
  57 | 
  58 |   test('대안 흐름: 존재하지 않는 이메일 → 401 에러 메시지 표시', async ({ page }) => {
  59 |     await page.goto('/login')
  60 | 
  61 |     await page.getByLabel(/이메일|email/i).fill('nonexistent@example.com')
  62 |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  63 |     await page.getByRole('button', { name: /로그인|login/i }).click()
  64 | 
  65 |     const errorMsg = page.locator('text=/올바르지|incorrect|잘못|unauthorized/i').first()
> 66 |     await expect(errorMsg).toBeVisible({ timeout: 5000 })
     |                            ^ Error: expect(locator).toBeVisible() failed
  67 |   })
  68 | })
  69 | 
```