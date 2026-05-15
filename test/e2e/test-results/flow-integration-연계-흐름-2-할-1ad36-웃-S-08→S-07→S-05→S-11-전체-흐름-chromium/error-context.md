# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow-integration.spec.ts >> 연계 흐름 2: 할일 관리 일상 흐름 (조회→완료→수정→로그아웃) >> S-08→S-07→S-05→S-11 전체 흐름
- Location: flow-integration.spec.ts:117:7

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
                - textbox "할일 제목 입력" [ref=e199]: 논문 초안 작성
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
  4   |  * 시나리오 간 연계 흐름 통합 테스트
  5   |  * - 연계 흐름 1: 신규 사용자의 첫 할일 등록까지
  6   |  * - 연계 흐름 2: 할일 관리 일상 흐름 (조회→완료→수정)
  7   |  * - 연계 흐름 3: 계정 관리 흐름 (카테고리 정리→탈퇴)
  8   |  */
  9   | 
  10  | const TS = Date.now()
  11  | 
  12  | test.describe('연계 흐름 1: 신규 사용자의 첫 할일 등록까지', () => {
  13  |   const USER = {
  14  |     email: `flow1_${TS}@example.com`,
  15  |     password: 'Flow1234!',
  16  |     name: '흐름1유저',
  17  |   }
  18  | 
  19  |   test('S-01→S-02→S-09→S-04 전체 흐름', async ({ page }) => {
  20  |     // S-01: 회원가입
  21  |     await page.goto('/signup')
  22  |     await page.getByLabel(/이름|name/i).fill(USER.name)
  23  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  24  |     await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
  25  |     await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
  26  |     await page.waitForURL(/\/login/, { timeout: 10000 })
  27  | 
  28  |     // S-02: 로그인
  29  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  30  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  31  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  32  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  33  | 
  34  |     // S-09: 카테고리 추가 (선택)
  35  |     await page.goto('/categories')
  36  |     const nameInput = page.getByPlaceholder(/카테고리|category/i).first()
  37  |     if (await nameInput.isVisible({ timeout: 3000 })) {
  38  |       await nameInput.fill('업무')
  39  |       await page.getByRole('button', { name: /추가|add/i }).click()
  40  |       await expect(page.locator('text=업무')).toBeVisible({ timeout: 10000 })
  41  |     }
  42  | 
  43  |     // S-04: 할일 등록
  44  |     await page.goto('/')
  45  |     const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
  46  |     if (await addBtn.isVisible()) await addBtn.click()
  47  | 
  48  |     const titleInput = page.getByLabel(/제목|title/i)
  49  |     if (await titleInput.isVisible({ timeout: 3000 })) {
  50  |       await titleInput.fill('팀 미팅 자료 준비')
  51  |     } else {
  52  |       await page.getByPlaceholder(/제목|title|할일/i).fill('팀 미팅 자료 준비')
  53  |     }
  54  | 
  55  |     const categorySelect = page.getByLabel(/카테고리|category/i)
  56  |     if (await categorySelect.isVisible({ timeout: 2000 })) {
  57  |       const options = await categorySelect.locator('option').all()
  58  |       if (options.length > 1) await categorySelect.selectOption({ index: 1 })
  59  |     }
  60  | 
  61  |     const dueDateInput = page.getByLabel(/종료|마감|due/i)
  62  |     if (await dueDateInput.isVisible({ timeout: 2000 })) {
  63  |       await dueDateInput.fill('2026-05-15')
  64  |     }
  65  | 
  66  |     await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  67  | 
  68  |     await expect(page.locator('text=팀 미팅 자료 준비')).toBeVisible({ timeout: 10000 })
  69  |   })
  70  | })
  71  | 
  72  | test.describe('연계 흐름 2: 할일 관리 일상 흐름 (조회→완료→수정→로그아웃)', () => {
  73  |   const USER = {
  74  |     email: `flow2_${TS}@example.com`,
  75  |     password: 'Flow1234!',
  76  |     name: '흐름2유저',
  77  |   }
  78  | 
> 79  |   test.beforeAll(async ({ browser }) => {
      |        ^ "beforeAll" hook timeout of 30000ms exceeded.
  80  |     const page = await browser.newPage()
  81  |     // 회원가입 + 로그인 + 할일 등록
  82  |     await page.goto('/signup')
  83  |     await page.getByLabel(/이름|name/i).fill(USER.name)
  84  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  85  |     await page.getByLabel(/비밀번호|password/i).first().fill(USER.password)
  86  |     await page.getByRole('button', { name: /가입|signup|회원가입/i }).click()
  87  |     await page.waitForURL(/\/login/, { timeout: 10000 })
  88  | 
  89  |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  90  |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  91  |     await page.getByRole('button', { name: /로그인|login/i }).click()
  92  |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  93  | 
  94  |     for (const title of ['논문 초안 작성', '발표 준비']) {
  95  |       const addBtn = page.getByRole('button', { name: /추가|등록|add|new|새/i }).first()
  96  |       if (await addBtn.isVisible()) await addBtn.click()
  97  | 
  98  |       const titleInput = page.getByLabel(/제목|title/i)
  99  |       if (await titleInput.isVisible({ timeout: 3000 })) {
  100 |         await titleInput.fill(title)
  101 |       } else {
  102 |         await page.getByPlaceholder(/제목|title|할일/i).fill(title)
  103 |       }
  104 | 
  105 |       const categorySelect = page.getByLabel(/카테고리|category/i)
  106 |       if (await categorySelect.isVisible({ timeout: 2000 })) {
  107 |         const options = await categorySelect.locator('option').all()
  108 |         if (options.length > 1) await categorySelect.selectOption({ index: 1 })
  109 |       }
  110 | 
  111 |       await page.getByRole('button', { name: /등록|저장|추가|submit|add/i }).last().click()
  112 |       await page.waitForTimeout(500)
  113 |     }
  114 |     await page.close()
  115 |   })
  116 | 
  117 |   test('S-08→S-07→S-05→S-11 전체 흐름', async ({ page }) => {
  118 |     // S-02: 로그인
  119 |     await page.goto('/login')
  120 |     await page.getByLabel(/이메일|email/i).fill(USER.email)
  121 |     await page.getByLabel(/비밀번호|password/i).fill(USER.password)
  122 |     await page.getByRole('button', { name: /로그인|login/i }).click()
  123 |     await page.waitForURL(/\/$|\/todos|\/home/, { timeout: 10000 })
  124 | 
  125 |     // S-08: 할일 목록 조회
  126 |     await expect(page.locator('text=논문 초안 작성')).toBeVisible({ timeout: 10000 })
  127 | 
  128 |     // S-07: 완료 처리
  129 |     const todoItem = page.locator('text=논문 초안 작성').first()
  130 |     const card = todoItem.locator('..').locator('..')
  131 |     const checkbox = card.locator('input[type="checkbox"]').first()
  132 |     const completeBtn = card.getByRole('button', { name: /완료|complete|done/i }).first()
  133 | 
  134 |     if (await checkbox.isVisible({ timeout: 2000 })) {
  135 |       await checkbox.click()
  136 |     } else if (await completeBtn.isVisible({ timeout: 2000 })) {
  137 |       await completeBtn.click()
  138 |     }
  139 |     await page.waitForTimeout(1000)
  140 | 
  141 |     // S-05: 할일 수정 (발표 준비 종료일 변경)
  142 |     const todoItem2 = page.locator('text=발표 준비').first()
  143 |     await expect(todoItem2).toBeVisible({ timeout: 5000 })
  144 | 
  145 |     const card2 = todoItem2.locator('..').locator('..')
  146 |     const editBtn = card2.getByRole('button', { name: /수정|편집|edit/i }).first()
  147 |     if (await editBtn.isVisible({ timeout: 2000 })) {
  148 |       await editBtn.click()
  149 |       const dueDateInput = page.getByLabel(/종료|마감|due/i)
  150 |       if (await dueDateInput.isVisible({ timeout: 2000 })) {
  151 |         await dueDateInput.fill('2026-05-22')
  152 |       }
  153 |       await page.getByRole('button', { name: /저장|save|수정|update/i }).last().click()
  154 |       await page.waitForTimeout(500)
  155 |     }
  156 | 
  157 |     // S-11: 로그아웃
  158 |     const logoutBtn = page.getByRole('button', { name: /로그아웃|logout/i }).first()
  159 |     await expect(logoutBtn).toBeVisible({ timeout: 5000 })
  160 |     await logoutBtn.click()
  161 |     await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  162 |   })
  163 | })
  164 | 
```