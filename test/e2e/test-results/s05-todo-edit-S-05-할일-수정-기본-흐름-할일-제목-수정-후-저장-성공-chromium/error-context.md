# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s05-todo-edit.spec.ts >> S-05: 할일 수정 >> 기본 흐름: 할일 제목 수정 후 저장 성공
- Location: s05-todo-edit.spec.ts:63:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=수정될 할일').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=수정될 할일').first()

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
  4   |  * S-05: 할일 수정 시나리오
  5   |  * UC-05 / GET /api/todos/:id · PATCH /api/todos/:id
  6   |  */
  7   | 
  8   | const TS = Date.now()
  9   | const USER = {
  10  |   email: `test_s05_${TS}@example.com`,
  11  |   password: 'Test1234!',
  12  |   name: 'S05유저',
  13  | }
  14  | 
  15  | test.describe('S-05: 할일 수정', () => {
  16  |   test.beforeAll(async ({ browser }) => {
  17  |     const page = await browser.newPage()
  18  |     // 회원가입
  19  |     await page.goto('/signup')
  20  |     await page.getByLabel(/이름|name/i).fill(USER.name)
  21  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  22  |     await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
  23  |     await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
  24  |     await page.waitForURL(/\/login/, { timeout: 10000 })
  25  | 
  26  |     // 로그인
  27  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  28  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  29  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  30  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  31  | 
  32  |     // 할일 등록
  33  |     const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
  34  |     if (await addBtn.isVisible()) await addBtn.click()
  35  | 
  36  |     const titleInput = page.getByLabel(/제목|title/i)
  37  |     if (await titleInput.isVisible({ timeout: 3000 })) {
  38  |       await titleInput.fill('수정될 할일')
  39  |     } else {
  40  |       const inlineInput = page.getByPlaceholder(/제목|title|할일/i)
  41  |       await inlineInput.fill('수정될 할일')
  42  |     }
  43  | 
  44  |     const categorySelect = page.getByLabel(/카테고리|category/i)
  45  |     if (await categorySelect.isVisible({ timeout: 2000 })) {
  46  |       const options = await categorySelect.locator('option').all()
  47  |       if (options.length > 1) await categorySelect.selectOption({ index: 1 })
  48  |     }
  49  | 
  50  |     await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  51  |     await page.waitForTimeout(1000)
  52  |     await page.close()
  53  |   })
  54  | 
  55  |   async function login(page: any) {
  56  |     await page.goto('/login')
  57  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  58  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  59  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  60  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  61  |   }
  62  | 
  63  |   test('기본 흐름: 할일 제목 수정 후 저장 성공', async ({ page }) => {
  64  |     await login(page)
  65  | 
  66  |     // 기존 할일 카드의 수정 버튼 클릭
  67  |     const todoItem = page.locator('text=수정될 할일').first()
> 68  |     await expect(todoItem).toBeVisible({ timeout: 5000 })
      |                            ^ Error: expect(locator).toBeVisible() failed
  69  | 
  70  |     const editBtn = todoItem.locator('..').locator('..').getByRole('button', { name: /수정|편집|edit/i }).first()
  71  |     if (await editBtn.isVisible({ timeout: 2000 })) {
  72  |       await editBtn.click()
  73  |     } else {
  74  |       // 카드 클릭으로 수정 모드 진입
  75  |       await todoItem.click()
  76  |     }
  77  | 
  78  |     const titleInput = page.getByLabel(/제목|title/i)
  79  |     if (await titleInput.isVisible({ timeout: 3000 })) {
  80  |       await titleInput.clear()
  81  |       await titleInput.fill('수정된 할일')
  82  |     }
  83  | 
  84  |     await page.getByRole('button', { name: /저장|save|수정|update/i }).last().click()
  85  | 
  86  |     await expect(page.locator('text=수정된 할일')).toBeVisible({ timeout: 10000 })
  87  |   })
  88  | 
  89  |   test('대안 흐름: 제목을 빈 값으로 저장 시도 시 에러', async ({ page }) => {
  90  |     await login(page)
  91  | 
  92  |     const todoItem = page.locator('text=/수정된 할일|수정될 할일/').first()
  93  |     if (!(await todoItem.isVisible({ timeout: 3000 }))) {
  94  |       test.skip(true, '수정할 할일 항목이 없음')
  95  |       return
  96  |     }
  97  | 
  98  |     const editBtn = todoItem.locator('..').locator('..').getByRole('button', { name: /수정|편집|edit/i }).first()
  99  |     if (await editBtn.isVisible({ timeout: 2000 })) {
  100 |       await editBtn.click()
  101 |     } else {
  102 |       await todoItem.click()
  103 |     }
  104 | 
  105 |     const titleInput = page.getByLabel(/제목|title/i)
  106 |     if (await titleInput.isVisible({ timeout: 3000 })) {
  107 |       await titleInput.clear()
  108 |     }
  109 | 
  110 |     await page.getByRole('button', { name: /저장|save|수정|update/i }).last().click()
  111 | 
  112 |     const errorMsg = page.locator('text=/제목|title|필수|required/i').first()
  113 |     await expect(errorMsg).toBeVisible({ timeout: 5000 })
  114 |   })
  115 | })
  116 | 
```