# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s09-category-create.spec.ts >> S-09: 카테고리 추가 >> 기본 흐름: 카테고리 이름 입력 후 추가 성공
- Location: s09-category-create.spec.ts:36:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/카테고리 이름|category name/i).first()

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
  4  |  * S-09: 카테고리 추가 시나리오
  5  |  * UC-09 / POST /api/categories
  6  |  */
  7  | 
  8  | const TS = Date.now()
  9  | const USER = {
  10 |   email: `test_s09_${TS}@example.com`,
  11 |   password: 'Test1234!',
  12 |   name: 'S09유저',
  13 | }
  14 | 
  15 | test.describe('S-09: 카테고리 추가', () => {
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
  27 |   async function loginAndGoCategories(page: any) {
  28 |     await page.goto('/login')
  29 |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  30 |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  31 |     await page.getByRole('button', { name: /로그인|login/i }).click()
  32 |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  33 |     await page.goto('/categories')
  34 |   }
  35 | 
  36 |   test('기본 흐름: 카테고리 이름 입력 후 추가 성공', async ({ page }) => {
  37 |     await loginAndGoCategories(page)
  38 | 
  39 |     const nameInput = page.getByLabel(/카테고리 이름|category name/i).first()
  40 |       || page.getByPlaceholder(/카테고리|category/i).first()
  41 | 
> 42 |     await nameInput.fill('업무')
     |                     ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  43 |     await page.getByRole('button', { name: /추가|add/i }).click()
  44 | 
  45 |     await expect(page.locator('text=업무')).toBeVisible({ timeout: 10000 })
  46 |   })
  47 | 
  48 |   test('대안 흐름: 카테고리 이름 미입력 시 에러', async ({ page }) => {
  49 |     await loginAndGoCategories(page)
  50 | 
  51 |     await page.getByRole('button', { name: /추가|add/i }).click()
  52 | 
  53 |     const errorMsg = page.locator('text=/이름|name|필수|required|입력하세요/i').first()
  54 |     await expect(errorMsg).toBeVisible({ timeout: 5000 })
  55 |   })
  56 | 
  57 |   test('대안 흐름: 중복 카테고리 이름 입력 시 409 에러 표시', async ({ page }) => {
  58 |     await loginAndGoCategories(page)
  59 | 
  60 |     // 첫 번째 추가
  61 |     const nameInput = page.getByPlaceholder(/카테고리|category/i).first()
  62 |       || page.getByLabel(/카테고리 이름|category name/i).first()
  63 |     await nameInput.fill('개인')
  64 |     await page.getByRole('button', { name: /추가|add/i }).click()
  65 |     await expect(page.locator('text=개인')).toBeVisible({ timeout: 10000 })
  66 | 
  67 |     // 중복 추가
  68 |     const nameInput2 = page.getByPlaceholder(/카테고리|category/i).first()
  69 |       || page.getByLabel(/카테고리 이름|category name/i).first()
  70 |     await nameInput2.fill('개인')
  71 |     await page.getByRole('button', { name: /추가|add/i }).click()
  72 | 
  73 |     const errorMsg = page.locator('text=/이미 사용|중복|duplicate/i').first()
  74 |     await expect(errorMsg).toBeVisible({ timeout: 5000 })
  75 |   })
  76 | })
  77 | 
```