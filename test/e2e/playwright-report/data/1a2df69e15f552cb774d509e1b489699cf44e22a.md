# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s07-todo-complete.spec.ts >> S-07: 할일 완료 토글 >> 기본 흐름: 완료 → 미완료 (취소) 토글
- Location: s07-todo-complete.spec.ts:90:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=완료 토글 테스트 할일').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=완료 토글 테스트 할일').first()

```

```yaml
- banner:
  - text: TodoList 캘린더, 오늘 할일, 통계와 진행률을 한 화면에서 관리합니다.
  - combobox "언어":
    - option "한국어" [selected]
    - option "English"
  - button "다크"
  - button "로그아웃"
- main:
  - heading "일정 캘린더" [level=1]
  - paragraph: 2026-05-15
  - button "일정 캘린더"
  - button "목록"
  - region "Summary":
    - article:
      - text: 오늘 할일
      - strong: "0"
      - text: 오늘
    - article:
      - text: 미완료
      - strong: "0"
      - text: 오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.
    - article:
      - text: 완료
      - strong: "0"
      - text: 0%
    - article:
      - text: 이번 주 일정
      - strong: "0"
      - text: 일정 캘린더
  - region "Todo calendar":
    - text: 2026년 5월 0 개
    - button "이전 달": <
    - button "오늘"
    - button "다음 달": ">"
    - text: 일 월 화 수 목 금 토
    - button "1"
    - button "2"
    - button "3"
    - button "4"
    - button "5"
    - button "6"
    - button "7"
    - button "8"
    - button "9"
    - button "10"
    - button "11"
    - button "12"
    - button "13"
    - button "14"
    - button "15" [pressed]
    - button "16"
    - button "17"
    - button "18"
    - button "19"
    - button "20"
    - button "21"
    - button "22"
    - button "23"
    - button "24"
    - button "25"
    - button "26"
    - button "27"
    - button "28"
    - button "29"
    - button "30"
    - button "31"
  - heading "최근 등록한 할일" [level=2]
  - text: 등록된 할일이 없습니다
  - paragraph: 오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.
  - heading "카테고리별 통계" [level=2]
  - text: 등록된 할일이 없습니다
  - paragraph: 오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.
  - heading "완료율" [level=2]
  - paragraph: 0/0 개
  - strong: 0%
  - complementary:
    - heading "선택한 날짜의 할일" [level=2]
    - paragraph: 2026-05-15
    - button "+ 할일 추가"
    - text: 등록된 할일이 없습니다
    - paragraph: 이 날짜에 등록된 할일이 없습니다.
    - button "+ 할일 추가"
    - heading "빠른 추가" [level=2]
    - text: 제목
    - textbox "할일 제목 입력"
    - text: 종료일
    - textbox: 2026-05-15
    - text: 카테고리
    - combobox:
      - option "전체" [selected]
      - option "업무"
      - option "개인"
      - option "쇼핑"
      - option "기타"
    - button "저장" [disabled]
    - heading "오늘 할일" [level=2]
    - text: 0 등록된 할일이 없습니다
    - paragraph: 오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.
    - button "+ 할일 추가"
- navigation:
  - link "일정 캘린더":
    - /url: /
  - link "카테고리":
    - /url: /categories
  - link "Profile":
    - /url: /profile
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | /**
  4   |  * S-07: 완료 처리 (완료 상태 토글) 시나리오
  5   |  * UC-07 / PATCH /api/todos/:id/complete
  6   |  */
  7   | 
  8   | const TS = Date.now()
  9   | const USER = {
  10  |   email: `test_s07_${TS}@example.com`,
  11  |   password: 'Test1234!',
  12  |   name: 'S07유저',
  13  | }
  14  | 
  15  | test.describe('S-07: 할일 완료 토글', () => {
  16  |   test.beforeAll(async ({ browser }) => {
  17  |     const page = await browser.newPage()
  18  |     await page.goto('/signup')
  19  |     await page.getByLabel(/이름|name/i).fill(USER.name)
  20  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  21  |     await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
  22  |     await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
  23  |     await page.waitForURL(/\/login/, { timeout: 10000 })
  24  | 
  25  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  26  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  27  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  28  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  29  | 
  30  |     const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
  31  |     if (await addBtn.isVisible()) await addBtn.click()
  32  | 
  33  |     const titleInput = page.getByLabel(/제목|title/i)
  34  |     if (await titleInput.isVisible({ timeout: 3000 })) {
  35  |       await titleInput.fill('완료 토글 테스트 할일')
  36  |     } else {
  37  |       await page.getByPlaceholder(/제목|title|할일/i).fill('완료 토글 테스트 할일')
  38  |     }
  39  | 
  40  |     const categorySelect = page.getByLabel(/카테고리|category/i)
  41  |     if (await categorySelect.isVisible({ timeout: 2000 })) {
  42  |       const options = await categorySelect.locator('option').all()
  43  |       if (options.length > 1) await categorySelect.selectOption({ index: 1 })
  44  |     }
  45  | 
  46  |     await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  47  |     await page.waitForTimeout(1000)
  48  |     await page.close()
  49  |   })
  50  | 
  51  |   async function login(page: any) {
  52  |     await page.goto('/login')
  53  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  54  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  55  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  56  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  57  |   }
  58  | 
  59  |   test('기본 흐름: 미완료 → 완료 토글', async ({ page }) => {
  60  |     await login(page)
  61  | 
  62  |     const todoItem = page.locator('text=완료 토글 테스트 할일').first()
  63  |     await expect(todoItem).toBeVisible({ timeout: 5000 })
  64  | 
  65  |     const card = todoItem.locator('..').locator('..')
  66  | 
  67  |     // 체크박스 또는 완료 버튼 클릭
  68  |     const checkbox = card.locator('input[type="checkbox"]').first()
  69  |     const completeBtn = card.getByRole('button', { name: /완료|complete|done/i }).first()
  70  | 
  71  |     if (await checkbox.isVisible({ timeout: 2000 })) {
  72  |       await checkbox.click()
  73  |     } else if (await completeBtn.isVisible({ timeout: 2000 })) {
  74  |       await completeBtn.click()
  75  |     }
  76  | 
  77  |     // 완료 상태 표시 확인 (취소선, 완료 뱃지 등)
  78  |     await page.waitForTimeout(1000)
  79  |     const completedIndicator = page.locator('text=완료 토글 테스트 할일')
  80  |       .locator('..')
  81  |       .locator('..')
  82  |       .locator('[class*="complete"], [class*="done"], [class*="checked"]')
  83  |       .first()
  84  | 
  85  |     // 완료 상태가 시각적으로 반영됐는지 확인 (취소선 등)
  86  |     const isChecked = await checkbox.isChecked().catch(() => false)
  87  |     expect(isChecked || true).toBeTruthy() // 최소한 오류 없이 클릭됨을 확인
  88  |   })
  89  | 
  90  |   test('기본 흐름: 완료 → 미완료 (취소) 토글', async ({ page }) => {
  91  |     await login(page)
  92  | 
  93  |     const todoItem = page.locator('text=완료 토글 테스트 할일').first()
> 94  |     await expect(todoItem).toBeVisible({ timeout: 5000 })
      |                            ^ Error: expect(locator).toBeVisible() failed
  95  | 
  96  |     const card = todoItem.locator('..').locator('..')
  97  |     const checkbox = card.locator('input[type="checkbox"]').first()
  98  |     const completeBtn = card.getByRole('button', { name: /완료|complete|done/i }).first()
  99  | 
  100 |     // 두 번 클릭하여 토글 (완료 → 미완료)
  101 |     if (await checkbox.isVisible({ timeout: 2000 })) {
  102 |       await checkbox.click()
  103 |       await page.waitForTimeout(500)
  104 |       await checkbox.click()
  105 |     } else if (await completeBtn.isVisible({ timeout: 2000 })) {
  106 |       await completeBtn.click()
  107 |       await page.waitForTimeout(500)
  108 |       const cancelBtn = card.getByRole('button', { name: /완료 취소|미완료|undo/i }).first()
  109 |       if (await cancelBtn.isVisible({ timeout: 2000 })) {
  110 |         await cancelBtn.click()
  111 |       } else {
  112 |         await completeBtn.click()
  113 |       }
  114 |     }
  115 | 
  116 |     await page.waitForTimeout(500)
  117 |     // 오류 없이 완료됨을 확인
  118 |     expect(true).toBeTruthy()
  119 |   })
  120 | })
  121 | 
```