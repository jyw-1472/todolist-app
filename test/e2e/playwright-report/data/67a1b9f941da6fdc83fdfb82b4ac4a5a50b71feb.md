# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow-integration.spec.ts >> 연계 흐름 1: 신규 사용자의 첫 할일 등록까지 >> S-01→S-02→S-09→S-04 전체 흐름
- Location: flow-integration.spec.ts:19:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder(/제목|title|할일/i)

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
> 52  |       await page.getByPlaceholder(/제목|title|할일/i).fill('팀 미팅 자료 준비')
      |                                                   ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
  79  |   test.beforeAll(async ({ browser }) => {
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
```