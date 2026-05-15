# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s10-category-delete.spec.ts >> S-10: 카테고리 삭제 >> 기본 흐름: 사용자 정의 카테고리 삭제 성공
- Location: s10-category-delete.spec.ts:48:7

# Error details

```
"beforeAll" hook timeout of 30000ms exceeded.
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
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | /**
  4   |  * S-10: 카테고리 삭제 시나리오
  5   |  * UC-10 / DELETE /api/categories/:id
  6   |  */
  7   | 
  8   | const TS = Date.now()
  9   | const USER = {
  10  |   email: `test_s10_${TS}@example.com`,
  11  |   password: 'Test1234!',
  12  |   name: 'S10유저',
  13  | }
  14  | 
  15  | test.describe('S-10: 카테고리 삭제', () => {
> 16  |   test.beforeAll(async ({ browser }) => {
      |        ^ "beforeAll" hook timeout of 30000ms exceeded.
  17  |     const page = await browser.newPage()
  18  |     await page.goto('/signup')
  19  |     await page.getByLabel(/이름|name/i).fill(USER.name)
  20  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  21  |     await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
  22  |     await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
  23  |     await page.waitForURL(/\/login/, { timeout: 10000 })
  24  | 
  25  |     // 로그인 후 카테고리 추가
  26  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  27  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  28  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  29  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  30  |     await page.goto('/categories')
  31  | 
  32  |     const nameInput = page.getByPlaceholder(/카테고리|category/i).first()
  33  |     await nameInput.fill('삭제될카테고리')
  34  |     await page.getByRole('button', { name: /추가|add/i }).click()
  35  |     await page.waitForTimeout(1000)
  36  |     await page.close()
  37  |   })
  38  | 
  39  |   async function loginAndGoCategories(page: any) {
  40  |     await page.goto('/login')
  41  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  42  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  43  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  44  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  45  |     await page.goto('/categories')
  46  |   }
  47  | 
  48  |   test('기본 흐름: 사용자 정의 카테고리 삭제 성공', async ({ page }) => {
  49  |     await loginAndGoCategories(page)
  50  | 
  51  |     const categoryItem = page.locator('text=삭제될카테고리').first()
  52  |     await expect(categoryItem).toBeVisible({ timeout: 5000 })
  53  | 
  54  |     const deleteBtn = categoryItem.locator('..').locator('..').getByRole('button', { name: /삭제|delete|remove/i }).first()
  55  |     await deleteBtn.click()
  56  | 
  57  |     // 확인 다이얼로그
  58  |     const dialog = page.locator('[role="dialog"], .modal').first()
  59  |     const confirmBtn = dialog.getByRole('button', { name: /확인|ok|삭제|yes/i })
  60  |     if (await confirmBtn.isVisible({ timeout: 3000 })) {
  61  |       await confirmBtn.click()
  62  |     }
  63  | 
  64  |     await expect(page.locator('text=삭제될카테고리')).not.toBeVisible({ timeout: 10000 })
  65  |   })
  66  | 
  67  |   test('대안 흐름: 기본 카테고리 삭제 시도 시 403 에러 (DEFAULT_CATEGORY_IMMUTABLE)', async ({ page }) => {
  68  |     await loginAndGoCategories(page)
  69  | 
  70  |     // 기본 카테고리는 삭제 버튼이 없거나 비활성화되어야 함 (BR-05)
  71  |     const defaultCategories = page.locator('[data-default="true"], [class*="default"], text=/기본|default/i')
  72  |     if (await defaultCategories.count() > 0) {
  73  |       const defaultCategory = defaultCategories.first()
  74  |       const deleteBtn = defaultCategory.locator('..').locator('..').getByRole('button', { name: /삭제|delete/i }).first()
  75  | 
  76  |       if (await deleteBtn.isVisible({ timeout: 2000 })) {
  77  |         await deleteBtn.click()
  78  |         const errorMsg = page.locator('text=/기본 카테고리|삭제할 수 없|immutable/i').first()
  79  |         await expect(errorMsg).toBeVisible({ timeout: 5000 })
  80  |       } else {
  81  |         // 삭제 버튼 자체가 없음 → 기본 카테고리 보호 UI 구현됨
  82  |         expect(true).toBeTruthy()
  83  |       }
  84  |     }
  85  |   })
  86  | 
  87  |   test('대안 흐름: 취소 클릭 시 카테고리 삭제되지 않음', async ({ page }) => {
  88  |     await loginAndGoCategories(page)
  89  | 
  90  |     // 새 카테고리 추가
  91  |     const nameInput = page.getByPlaceholder(/카테고리|category/i).first()
  92  |     await nameInput.fill('취소테스트카테고리')
  93  |     await page.getByRole('button', { name: /추가|add/i }).click()
  94  |     await expect(page.locator('text=취소테스트카테고리')).toBeVisible({ timeout: 10000 })
  95  | 
  96  |     const categoryItem = page.locator('text=취소테스트카테고리').first()
  97  |     const deleteBtn = categoryItem.locator('..').locator('..').getByRole('button', { name: /삭제|delete/i }).first()
  98  |     await deleteBtn.click()
  99  | 
  100 |     const dialog = page.locator('[role="dialog"], .modal').first()
  101 |     const cancelBtn = dialog.getByRole('button', { name: /취소|cancel|no/i })
  102 |     if (await cancelBtn.isVisible({ timeout: 3000 })) {
  103 |       await cancelBtn.click()
  104 |     }
  105 | 
  106 |     await expect(page.locator('text=취소테스트카테고리')).toBeVisible({ timeout: 5000 })
  107 |   })
  108 | })
  109 | 
```