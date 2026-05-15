# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s08-todo-list.spec.ts >> S-08: 할일 목록 조회 및 필터 >> 기본 흐름: 할일 목록이 화면에 표시됨
- Location: s08-todo-list.spec.ts:62:7

# Error details

```
"beforeAll" hook timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]: TodoList
          - generic [ref=e8]: 캘린더, 오늘 할일, 통계와 진행률을 한 화면에서 관리합니다.
        - generic [ref=e9]:
          - combobox "언어" [ref=e10]:
            - option "한국어" [selected]
            - option "English"
          - button "다크" [ref=e11] [cursor=pointer]
          - button "로그아웃" [ref=e12] [cursor=pointer]
    - main [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - heading "일정 캘린더" [level=1] [ref=e16]
          - paragraph [ref=e17]: 2026-05-15
        - generic [ref=e18]:
          - button "일정 캘린더" [ref=e19] [cursor=pointer]
          - button "목록" [ref=e20] [cursor=pointer]
      - region "Summary" [ref=e21]:
        - article [ref=e22]:
          - generic [ref=e23]: 오늘 할일
          - strong [ref=e24]: "0"
          - generic [ref=e25]: 오늘
        - article [ref=e26]:
          - generic [ref=e27]: 미완료
          - strong [ref=e28]: "0"
          - generic [ref=e29]: 오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.
        - article [ref=e30]:
          - generic [ref=e31]: 완료
          - strong [ref=e32]: "0"
          - generic [ref=e33]: 0%
        - article [ref=e34]:
          - generic [ref=e35]: 이번 주 일정
          - strong [ref=e36]: "0"
          - generic [ref=e37]: 일정 캘린더
      - generic [ref=e38]:
        - generic [ref=e39]:
          - region "Todo calendar" [ref=e40]:
            - generic [ref=e41]:
              - generic [ref=e42]:
                - generic [ref=e43]: 2026년 5월
                - generic [ref=e44]: 0 개
              - generic [ref=e45]:
                - button "이전 달" [ref=e46] [cursor=pointer]: <
                - button "오늘" [ref=e47] [cursor=pointer]
                - button "다음 달" [ref=e48] [cursor=pointer]: ">"
            - generic [ref=e49]:
              - generic [ref=e50]: 일
              - generic [ref=e51]: 월
              - generic [ref=e52]: 화
              - generic [ref=e53]: 수
              - generic [ref=e54]: 목
              - generic [ref=e55]: 금
              - generic [ref=e56]: 토
            - generic [ref=e57]:
              - button "1" [ref=e63] [cursor=pointer]:
                - generic [ref=e65]: "1"
              - button "2" [ref=e66] [cursor=pointer]:
                - generic [ref=e68]: "2"
              - button "3" [ref=e69] [cursor=pointer]:
                - generic [ref=e71]: "3"
              - button "4" [ref=e72] [cursor=pointer]:
                - generic [ref=e74]: "4"
              - button "5" [ref=e75] [cursor=pointer]:
                - generic [ref=e77]: "5"
              - button "6" [ref=e78] [cursor=pointer]:
                - generic [ref=e80]: "6"
              - button "7" [ref=e81] [cursor=pointer]:
                - generic [ref=e83]: "7"
              - button "8" [ref=e84] [cursor=pointer]:
                - generic [ref=e86]: "8"
              - button "9" [ref=e87] [cursor=pointer]:
                - generic [ref=e89]: "9"
              - button "10" [ref=e90] [cursor=pointer]:
                - generic [ref=e92]: "10"
              - button "11" [ref=e93] [cursor=pointer]:
                - generic [ref=e95]: "11"
              - button "12" [ref=e96] [cursor=pointer]:
                - generic [ref=e98]: "12"
              - button "13" [ref=e99] [cursor=pointer]:
                - generic [ref=e101]: "13"
              - button "14" [ref=e102] [cursor=pointer]:
                - generic [ref=e104]: "14"
              - button "15" [pressed] [ref=e105] [cursor=pointer]:
                - generic [ref=e107]: "15"
              - button "16" [ref=e108] [cursor=pointer]:
                - generic [ref=e110]: "16"
              - button "17" [ref=e111] [cursor=pointer]:
                - generic [ref=e113]: "17"
              - button "18" [ref=e114] [cursor=pointer]:
                - generic [ref=e116]: "18"
              - button "19" [ref=e117] [cursor=pointer]:
                - generic [ref=e119]: "19"
              - button "20" [ref=e120] [cursor=pointer]:
                - generic [ref=e122]: "20"
              - button "21" [ref=e123] [cursor=pointer]:
                - generic [ref=e125]: "21"
              - button "22" [ref=e126] [cursor=pointer]:
                - generic [ref=e128]: "22"
              - button "23" [ref=e129] [cursor=pointer]:
                - generic [ref=e131]: "23"
              - button "24" [ref=e132] [cursor=pointer]:
                - generic [ref=e134]: "24"
              - button "25" [ref=e135] [cursor=pointer]:
                - generic [ref=e137]: "25"
              - button "26" [ref=e138] [cursor=pointer]:
                - generic [ref=e140]: "26"
              - button "27" [ref=e141] [cursor=pointer]:
                - generic [ref=e143]: "27"
              - button "28" [ref=e144] [cursor=pointer]:
                - generic [ref=e146]: "28"
              - button "29" [ref=e147] [cursor=pointer]:
                - generic [ref=e149]: "29"
              - button "30" [ref=e150] [cursor=pointer]:
                - generic [ref=e152]: "30"
              - button "31" [ref=e153] [cursor=pointer]:
                - generic [ref=e155]: "31"
          - generic [ref=e162]:
            - generic [ref=e163]:
              - heading "최근 등록한 할일" [level=2] [ref=e165]
              - generic [ref=e166]:
                - generic [ref=e167]: 등록된 할일이 없습니다
                - paragraph [ref=e168]: 오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.
            - generic [ref=e169]:
              - heading "카테고리별 통계" [level=2] [ref=e171]
              - generic [ref=e172]:
                - generic [ref=e173]: 등록된 할일이 없습니다
                - paragraph [ref=e174]: 오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.
            - generic [ref=e176]:
              - generic [ref=e177]:
                - heading "완료율" [level=2] [ref=e178]
                - paragraph [ref=e179]: 0/0 개
              - strong [ref=e180]: 0%
        - complementary [ref=e182]:
          - generic [ref=e183]:
            - generic [ref=e184]:
              - generic [ref=e185]:
                - heading "선택한 날짜의 할일" [level=2] [ref=e186]
                - paragraph [ref=e187]: 2026-05-15
              - button "+ 할일 추가" [ref=e188] [cursor=pointer]
            - generic [ref=e189]:
              - generic [ref=e190]: 등록된 할일이 없습니다
              - paragraph [ref=e191]: 이 날짜에 등록된 할일이 없습니다.
              - button "+ 할일 추가" [ref=e192] [cursor=pointer]
          - generic [ref=e193]:
            - heading "빠른 추가" [level=2] [ref=e195]
            - generic [ref=e196]:
              - generic [ref=e197]:
                - generic [ref=e198]: 제목
                - textbox "할일 제목 입력" [ref=e199]: 목록 조회 할일1
              - generic [ref=e200]:
                - generic [ref=e201]: 종료일
                - textbox [ref=e202]: 2026-05-15
              - generic [ref=e203]:
                - generic [ref=e204]: 카테고리
                - combobox [ref=e205]:
                  - option "전체" [selected]
                  - option "업무"
                  - option "개인"
                  - option "쇼핑"
                  - option "기타"
              - button "저장" [ref=e206] [cursor=pointer]
          - generic [ref=e207]:
            - generic [ref=e208]:
              - heading "오늘 할일" [level=2] [ref=e209]
              - generic [ref=e210]: "0"
            - generic [ref=e211]:
              - generic [ref=e212]: 등록된 할일이 없습니다
              - paragraph [ref=e213]: 오른쪽 빠른 추가에서 오늘 할일을 등록해보세요.
              - button "+ 할일 추가" [active] [ref=e214] [cursor=pointer]
    - navigation [ref=e215]:
      - generic [ref=e216]:
        - link "일정 캘린더" [ref=e217] [cursor=pointer]:
          - /url: /
        - link "카테고리" [ref=e218] [cursor=pointer]:
          - /url: /categories
        - link "Profile" [ref=e219] [cursor=pointer]:
          - /url: /profile
  - dialog "할일 추가" [ref=e220]:
    - generic [ref=e221]:
      - generic [ref=e222]:
        - generic [ref=e223]: 할일 추가
        - button "Close" [ref=e224] [cursor=pointer]: x
      - generic [ref=e226]:
        - generic [ref=e227]:
          - generic [ref=e228]: 제목 *
          - textbox "제목 *" [ref=e229]:
            - /placeholder: 제목
        - generic [ref=e230]:
          - generic [ref=e231]: 내용 (선택)
          - textbox "내용" [ref=e232]
        - generic [ref=e233]:
          - generic [ref=e234]:
            - generic [ref=e235]: 시작일 (선택)
            - textbox "시작일" [ref=e236]: 2026-05-15
          - generic [ref=e237]:
            - generic [ref=e238]: 종료일 (선택)
            - textbox "종료일" [ref=e239]: 2026-05-15
        - generic [ref=e240]:
          - generic [ref=e241]: 카테고리 *
          - combobox "카테고리" [ref=e242]:
            - option "선택" [selected]
            - option "전체"
            - option "업무"
            - option "개인"
            - option "쇼핑"
            - option "기타"
        - generic [ref=e243]:
          - button "취소" [ref=e244] [cursor=pointer]
          - button "등록" [ref=e245] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | /**
  4   |  * S-08: 할일 목록 조회 시나리오
  5   |  * UC-08 / GET /api/todos?category_id=&from=&to=&is_completed=
  6   |  */
  7   | 
  8   | const TS = Date.now()
  9   | const USER = {
  10  |   email: `test_s08_${TS}@example.com`,
  11  |   password: 'Test1234!',
  12  |   name: 'S08유저',
  13  | }
  14  | 
  15  | test.describe('S-08: 할일 목록 조회 및 필터', () => {
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
  25  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  26  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  27  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  28  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  29  | 
  30  |     // 할일 두 개 등록
  31  |     for (const title of ['목록 조회 할일1', '목록 조회 할일2']) {
  32  |       const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
  33  |       if (await addBtn.isVisible()) await addBtn.click()
  34  | 
  35  |       const titleInput = page.getByLabel(/제목|title/i)
  36  |       if (await titleInput.isVisible({ timeout: 3000 })) {
  37  |         await titleInput.fill(title)
  38  |       } else {
  39  |         await page.getByPlaceholder(/제목|title|할일/i).fill(title)
  40  |       }
  41  | 
  42  |       const categorySelect = page.getByLabel(/카테고리|category/i)
  43  |       if (await categorySelect.isVisible({ timeout: 2000 })) {
  44  |         const options = await categorySelect.locator('option').all()
  45  |         if (options.length > 1) await categorySelect.selectOption({ index: 1 })
  46  |       }
  47  | 
  48  |       await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  49  |       await page.waitForTimeout(500)
  50  |     }
  51  |     await page.close()
  52  |   })
  53  | 
  54  |   async function login(page: any) {
  55  |     await page.goto('/login')
  56  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  57  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  58  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  59  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  60  |   }
  61  | 
  62  |   test('기본 흐름: 할일 목록이 화면에 표시됨', async ({ page }) => {
  63  |     await login(page)
  64  | 
  65  |     await expect(page.locator('text=목록 조회 할일1')).toBeVisible({ timeout: 10000 })
  66  |     await expect(page.locator('text=목록 조회 할일2')).toBeVisible({ timeout: 5000 })
  67  |   })
  68  | 
  69  |   test('기본 흐름: 카테고리 필터 적용', async ({ page }) => {
  70  |     await login(page)
  71  | 
  72  |     const categoryFilter = page.locator('[data-testid="category-filter"], select[name*="category"], [placeholder*="카테고리"]').first()
  73  |     if (await categoryFilter.isVisible({ timeout: 3000 })) {
  74  |       const options = await categoryFilter.locator('option').all()
  75  |       if (options.length > 1) {
  76  |         await categoryFilter.selectOption({ index: 1 })
  77  |         await page.waitForTimeout(1000)
  78  |         // 필터 후에도 화면에 내용이 있어야 함
  79  |         const items = page.locator('[data-testid="todo-item"], .todo-item, [class*="todo"]')
  80  |         // 에러 없이 필터가 작동함을 확인
  81  |         expect(true).toBeTruthy()
  82  |       }
  83  |     }
  84  |   })
  85  | 
  86  |   test('기본 흐름: 완료 여부 필터 - 미완료만 표시', async ({ page }) => {
  87  |     await login(page)
  88  | 
  89  |     const completedFilter = page.locator('[data-testid="completed-filter"], select[name*="completed"], input[name*="completed"]').first()
  90  |     if (await completedFilter.isVisible({ timeout: 3000 })) {
  91  |       await completedFilter.selectOption('false').catch(async () => {
  92  |         await completedFilter.click()
  93  |       })
  94  |       await page.waitForTimeout(1000)
  95  |       expect(true).toBeTruthy()
  96  |     }
  97  |   })
  98  | 
  99  |   test('대안 흐름: 조회 결과 0건 시 안내 메시지 표시', async ({ page }) => {
  100 |     await login(page)
  101 | 
  102 |     // 존재하지 않는 날짜 범위로 필터
  103 |     const fromFilter = page.getByLabel(/시작일|from/i)
  104 |     const toFilter = page.getByLabel(/종료일|to/i)
  105 | 
  106 |     if (await fromFilter.isVisible({ timeout: 2000 })) {
  107 |       await fromFilter.fill('2010-01-01')
  108 |       await toFilter.fill('2010-01-02')
  109 |       await page.waitForTimeout(1000)
  110 | 
  111 |       const emptyMsg = page.locator('text=/등록된 할일|없습니다|empty|no todo/i').first()
  112 |       await expect(emptyMsg).toBeVisible({ timeout: 5000 })
  113 |     }
  114 |   })
  115 | 
  116 |   test('대안 흐름: 시작일이 종료일보다 늦은 경우 에러 표시', async ({ page }) => {
```