# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s06-todo-delete.spec.ts >> S-06: 할일 삭제 >> 기본 흐름: 할일 삭제 버튼 → 확인 다이얼로그 → 삭제 완료
- Location: s06-todo-delete.spec.ts:60:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=삭제될 할일').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=삭제될 할일').first()

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
  4   |  * S-06: 할일 삭제 시나리오
  5   |  * UC-06 / DELETE /api/todos/:id
  6   |  */
  7   | 
  8   | const TS = Date.now()
  9   | const USER = {
  10  |   email: `test_s06_${TS}@example.com`,
  11  |   password: 'Test1234!',
  12  |   name: 'S06유저',
  13  | }
  14  | 
  15  | test.describe('S-06: 할일 삭제', () => {
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
  30  |     // 할일 등록
  31  |     const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
  32  |     if (await addBtn.isVisible()) await addBtn.click()
  33  | 
  34  |     const titleInput = page.getByLabel(/제목|title/i)
  35  |     if (await titleInput.isVisible({ timeout: 3000 })) {
  36  |       await titleInput.fill('삭제될 할일')
  37  |     } else {
  38  |       await page.getByPlaceholder(/제목|title|할일/i).fill('삭제될 할일')
  39  |     }
  40  | 
  41  |     const categorySelect = page.getByLabel(/카테고리|category/i)
  42  |     if (await categorySelect.isVisible({ timeout: 2000 })) {
  43  |       const options = await categorySelect.locator('option').all()
  44  |       if (options.length > 1) await categorySelect.selectOption({ index: 1 })
  45  |     }
  46  | 
  47  |     await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  48  |     await page.waitForTimeout(1000)
  49  |     await page.close()
  50  |   })
  51  | 
  52  |   async function login(page: any) {
  53  |     await page.goto('/login')
  54  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  55  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  56  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  57  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  58  |   }
  59  | 
  60  |   test('기본 흐름: 할일 삭제 버튼 → 확인 다이얼로그 → 삭제 완료', async ({ page }) => {
  61  |     await login(page)
  62  | 
  63  |     const todoItem = page.locator('text=삭제될 할일').first()
> 64  |     await expect(todoItem).toBeVisible({ timeout: 5000 })
      |                            ^ Error: expect(locator).toBeVisible() failed
  65  | 
  66  |     // 삭제 버튼 클릭
  67  |     const deleteBtn = todoItem.locator('..').locator('..').getByRole('button', { name: /삭제|delete|remove/i }).first()
  68  |     await deleteBtn.click()
  69  | 
  70  |     // 확인 다이얼로그 처리
  71  |     const dialog = page.locator('[role="dialog"], .modal, [data-testid="confirm-dialog"]').first()
  72  |     const confirmBtn = dialog.getByRole('button', { name: /확인|ok|삭제|yes/i })
  73  |     if (await confirmBtn.isVisible({ timeout: 3000 })) {
  74  |       await confirmBtn.click()
  75  |     } else {
  76  |       // 브라우저 기본 confirm 처리
  77  |       page.on('dialog', dialog => dialog.accept())
  78  |     }
  79  | 
  80  |     await expect(page.locator('text=삭제될 할일')).not.toBeVisible({ timeout: 10000 })
  81  |   })
  82  | 
  83  |   test('대안 흐름: 확인 다이얼로그에서 취소 클릭 시 삭제되지 않음', async ({ page }) => {
  84  |     await login(page)
  85  | 
  86  |     // 새 할일 등록
  87  |     const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
  88  |     if (await addBtn.isVisible()) await addBtn.click()
  89  | 
  90  |     const titleInput = page.getByLabel(/제목|title/i)
  91  |     if (await titleInput.isVisible({ timeout: 3000 })) {
  92  |       await titleInput.fill('취소 테스트 할일')
  93  |     } else {
  94  |       await page.getByPlaceholder(/제목|title|할일/i).fill('취소 테스트 할일')
  95  |     }
  96  | 
  97  |     const categorySelect = page.getByLabel(/카테고리|category/i)
  98  |     if (await categorySelect.isVisible({ timeout: 2000 })) {
  99  |       const options = await categorySelect.locator('option').all()
  100 |       if (options.length > 1) await categorySelect.selectOption({ index: 1 })
  101 |     }
  102 |     await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  103 |     await expect(page.locator('text=취소 테스트 할일')).toBeVisible({ timeout: 10000 })
  104 | 
  105 |     // 삭제 버튼 클릭 후 취소
  106 |     const todoItem = page.locator('text=취소 테스트 할일').first()
  107 |     const deleteBtn = todoItem.locator('..').locator('..').getByRole('button', { name: /삭제|delete|remove/i }).first()
  108 |     await deleteBtn.click()
  109 | 
  110 |     const dialog = page.locator('[role="dialog"], .modal').first()
  111 |     const cancelBtn = dialog.getByRole('button', { name: /취소|cancel|no/i })
  112 |     if (await cancelBtn.isVisible({ timeout: 3000 })) {
  113 |       await cancelBtn.click()
  114 |     }
  115 | 
  116 |     // 항목이 여전히 존재해야 함
  117 |     await expect(page.locator('text=취소 테스트 할일')).toBeVisible({ timeout: 5000 })
  118 |   })
  119 | })
  120 | 
```