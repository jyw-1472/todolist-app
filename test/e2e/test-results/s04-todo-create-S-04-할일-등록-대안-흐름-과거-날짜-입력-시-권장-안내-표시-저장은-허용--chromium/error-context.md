# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s04-todo-create.spec.ts >> S-04: 할일 등록 >> 대안 흐름: 과거 날짜 입력 시 권장 안내 표시 (저장은 허용)
- Location: s04-todo-create.spec.ts:86:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=과거 날짜 테스트')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=과거 날짜 테스트')

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
- dialog "할일 추가":
  - text: 할일 추가
  - button "Close": x
  - text: 제목 *
  - textbox "제목 *":
    - /placeholder: 제목
  - text: 내용 (선택)
  - textbox "내용"
  - text: 시작일 (선택)
  - textbox "시작일": 2026-05-15
  - text: 종료일 (선택)
  - textbox "종료일": 2026-05-15
  - text: 카테고리 *
  - combobox "카테고리":
    - option "선택" [selected]
    - option "전체"
    - option "업무"
    - option "개인"
    - option "쇼핑"
    - option "기타"
  - button "취소"
  - button "등록"
```

# Test source

```ts
  12  |   name: 'S04유저',
  13  | }
  14  | 
  15  | test.describe('S-04: 할일 등록', () => {
  16  |   test.beforeAll(async ({ browser }) => {
  17  |     const page = await browser.newPage()
  18  |     await page.goto('/signup')
  19  |     await page.getByLabel(/이름|name/i).fill(USER.name)
  20  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  21  |     await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
  22  |     await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
  23  |     await page.waitForURL(/\/login/, { timeout: 10000 })
  24  |     await page.close()
  25  |   })
  26  | 
  27  |   async function loginAndGoTodoForm(page: any) {
  28  |     await page.goto('/login')
  29  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  30  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  31  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  32  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  33  | 
  34  |     // 할일 등록 버튼 클릭 (모달이나 페이지 이동)
  35  |     const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
  36  |     if (await addBtn.isVisible()) {
  37  |       await addBtn.click()
  38  |     }
  39  |   }
  40  | 
  41  |   test('기본 흐름: 제목·카테고리 입력 후 할일 등록 성공', async ({ page }) => {
  42  |     await loginAndGoTodoForm(page)
  43  | 
  44  |     const titleInput = page.getByLabel(/제목|title/i)
  45  |     if (await titleInput.isVisible({ timeout: 3000 })) {
  46  |       await titleInput.fill('팀 미팅 자료 준비')
  47  |     } else {
  48  |       // 인라인 입력 폼인 경우
  49  |       const inlineInput = page.getByPlaceholder(/제목|title|할일/i)
  50  |       await inlineInput.fill('팀 미팅 자료 준비')
  51  |     }
  52  | 
  53  |     // 카테고리 선택
  54  |     const categorySelect = page.getByLabel(/카테고리|category/i)
  55  |     if (await categorySelect.isVisible({ timeout: 2000 })) {
  56  |       const options = await categorySelect.locator('option').all()
  57  |       if (options.length > 1) {
  58  |         await categorySelect.selectOption({ index: 1 })
  59  |       }
  60  |     }
  61  | 
  62  |     await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  63  | 
  64  |     // 성공 후 목록에 새 항목이 나타나야 함
  65  |     await expect(page.locator('text=팀 미팅 자료 준비')).toBeVisible({ timeout: 10000 })
  66  |   })
  67  | 
  68  |   test('대안 흐름: 제목 미입력 시 에러 표시', async ({ page }) => {
  69  |     await loginAndGoTodoForm(page)
  70  | 
  71  |     // 카테고리만 선택하고 제목은 입력하지 않음
  72  |     const categorySelect = page.getByLabel(/카테고리|category/i)
  73  |     if (await categorySelect.isVisible({ timeout: 2000 })) {
  74  |       const options = await categorySelect.locator('option').all()
  75  |       if (options.length > 1) {
  76  |         await categorySelect.selectOption({ index: 1 })
  77  |       }
  78  |     }
  79  | 
  80  |     await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  81  | 
  82  |     const errorMsg = page.locator('text=/제목|title|필수|required/i').first()
  83  |     await expect(errorMsg).toBeVisible({ timeout: 5000 })
  84  |   })
  85  | 
  86  |   test('대안 흐름: 과거 날짜 입력 시 권장 안내 표시 (저장은 허용)', async ({ page }) => {
  87  |     await loginAndGoTodoForm(page)
  88  | 
  89  |     const titleInput = page.getByLabel(/제목|title/i)
  90  |     if (await titleInput.isVisible({ timeout: 3000 })) {
  91  |       await titleInput.fill('과거 날짜 테스트')
  92  |     }
  93  | 
  94  |     const dueDateInput = page.getByLabel(/종료|마감|due/i)
  95  |     if (await dueDateInput.isVisible({ timeout: 2000 })) {
  96  |       await dueDateInput.fill('2020-01-01')
  97  |     }
  98  | 
  99  |     const categorySelect = page.getByLabel(/카테고리|category/i)
  100 |     if (await categorySelect.isVisible({ timeout: 2000 })) {
  101 |       const options = await categorySelect.locator('option').all()
  102 |       if (options.length > 1) {
  103 |         await categorySelect.selectOption({ index: 1 })
  104 |       }
  105 |     }
  106 | 
  107 |     // 권장 안내 메시지 확인 (BR-06: 저장은 차단하지 않음)
  108 |     const warningMsg = page.locator('text=/권장|오늘 이후|recommend/i').first()
  109 |     const isWarningVisible = await warningMsg.isVisible({ timeout: 2000 }).catch(() => false)
  110 |     // 경고가 있든 없든 등록 버튼 클릭 후 저장되어야 함
  111 |     await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
> 112 |     await expect(page.locator('text=과거 날짜 테스트')).toBeVisible({ timeout: 10000 })
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  113 |   })
  114 | })
  115 | 
```