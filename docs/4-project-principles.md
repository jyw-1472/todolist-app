# TodoListApp 아키텍처 설계 원칙

**버전:** 1.0
**작성일:** 2026-05-13
**작성자:** Software Architect
**참조 문서:** `1-domain-definition.md`, `2-prd.md`, `3-user-scenario.md`

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.3 | 2026-05-14 | jung young woo | 디렉토리 구조 실제 구현 반영 (validate.js·routes/index.js 제거, pgErrorHandler.js 추가), CORS 체크리스트 수정 |
| 1.2 | 2026-05-13 | jung young woo | 백엔드 언어 변경: TypeScript → JavaScript |
| 1.1 | 2026-05-13 | Software Architect | 인증 방식 변경: Refresh Token HttpOnly Cookie → Zustand 메모리 반영 (JWT 원칙, CORS, 인터셉터 코드) |
| 1.0 | 2026-05-13 | Software Architect | 최초 작성 |

---

## 1. 공통 최상위 원칙

> 이 프로젝트는 3일 MVP 일정과 300명 동시 접속 규모에 최적화된 실용적 원칙을 우선한다.
> 과도한 추상화보다 명확성과 일관성을 더 높은 가치로 둔다.

### P-01. 관심사 분리 (Separation of Concerns)

**왜:** 레이어마다 역할이 명확해야 버그 위치 추적과 테스트 작성이 쉬워진다.

각 파일·함수는 하나의 책임만 가진다. 데이터 접근 로직이 Controller에 있거나, 비즈니스 로직이 Repository에 있으면 안 된다.

```javascript
// ✅ 준수 — Controller는 요청/응답만, 로직은 Service에 위임
async function createTodo(req, res) {
  const todo = await todoService.create(req.user.userId, req.body);
  res.status(201).json({ data: todo });
}

// ❌ 위반 — Controller에서 직접 DB 쿼리
async function createTodo(req, res) {
  const result = await pool.query(
    'INSERT INTO todos (user_id, title) VALUES ($1, $2) RETURNING *',
    [req.user.userId, req.body.title]
  );
  res.status(201).json({ data: result.rows[0] });
}
```

### P-02. 단일 책임 원칙 (Single Responsibility)

**왜:** 하나의 파일·함수가 여러 책임을 가지면 변경 시 예상치 못한 사이드 이펙트가 발생한다.

파일 하나는 하나의 도메인 개념을 다룬다. `todo.service.js`는 Todo 비즈니스 로직만, `auth.middleware.js`는 인증 검증만 담당한다.

### P-03. 명시적 입력 검증 (Explicit Input Validation)

**왜:** JavaScript로 작성하더라도 외부 입력에 대한 검증을 강제해야 잘못된 데이터가 데이터베이스에 저장되는 것을 방지할 수 있다.

외부 입력(req.body, req.params)에는 반드시 유효성 검증 미들웨어를 통해 검증한다. JSDoc으로 함수 시그니처를 문서화한다.

```javascript
// ✅ 준수 — 유효성 검증 미들웨어 통해 입력 검증
function createTodo(req, res) {
  const { title, category_id, description, due_date } = req.body;
  // validate 미들웨어에서 이미 검증 완료
  todoService.create(req.user.userId, req.body).then(todo =>
    res.status(201).json({ data: todo })
  );
}

// ❌ 위반 — 검증 없이 req.body를 직접 사용
function createTodo(req, res) {
  pool.query('INSERT INTO todos ...', [req.body.title]);
}
```

### P-04. 일관된 에러 처리 (Consistent Error Handling)

**왜:** 에러 응답 형식이 통일되어야 프론트엔드에서 단일 인터셉터로 모든 에러를 처리할 수 있다.

모든 에러는 중앙 에러 핸들러를 통해 처리된다. Service/Repository에서는 에러를 throw하고, Controller는 try-catch 없이 `next(error)` 또는 `asyncHandler` 래퍼를 활용한다.

### P-05. 실용적 단순성 (Pragmatic Simplicity)

**왜:** 3일 MVP 일정에서 과도한 추상화는 개발 속도를 저해하고 복잡성만 증가시킨다.

MVP 범위에서 DI 컨테이너, CQRS, Event Sourcing 등 복잡한 패턴은 적용하지 않는다. 함수형 모듈 구성으로 충분하다.

---

## 2. 의존성/레이어 원칙

### 2-1. 백엔드 레이어 구조

**왜:** 단방향 의존성을 강제해야 하위 레이어가 상위 레이어를 알지 못하게 되어 교체와 테스트가 용이하다.

```
HTTP 요청
    │
    ▼
[Router]          — URL 매핑, 미들웨어 체인 구성
    │
    ▼
[Middleware]      — 인증(authenticate), 유효성 검사(validate)
    │
    ▼
[Controller]      — req/res 파싱, 응답 직렬화, next(error) 위임
    │
    ▼
[Service]         — 비즈니스 규칙, 트랜잭션 조율, 도메인 검증
    │
    ▼
[Repository]      — pg Pool을 통한 SQL 실행, 순수 데이터 접근
    │
    ▼
[PostgreSQL DB]
```

**레이어 간 의존성 규칙:**
- Router → Controller → Service → Repository 순서로만 의존한다.
- Repository는 Service를 import하지 않는다.
- Service는 Controller를 import하지 않는다.
- 공유 타입(`types/`)은 모든 레이어에서 import 가능하다.

```javascript
// ✅ 준수 — Service가 Repository를 호출하고 비즈니스 규칙 적용
// todo.service.js
const { todoRepository } = require('../repositories/todo.repository');

async function getTodoById(todoId, userId) {
  const todo = await todoRepository.findById(todoId);
  if (!todo) throw new AppError('RESOURCE_NOT_FOUND', 404);
  if (todo.user_id !== userId) throw new AppError('FORBIDDEN', 403); // BR-03
  return todo;
}

// ❌ 위반 — Repository에 비즈니스 규칙 포함
// todo.repository.js
async function findAndValidate(todoId, userId) {
  const todo = await pool.query(...);
  if (todo.user_id !== userId) throw new Error('forbidden'); // 비즈니스 로직이 Repository에
}
```

### 2-2. Repository 패턴 (pg 직접 SQL)

**왜:** ORM 없이 직접 SQL을 쓰더라도 Repository로 격리하면 SQL 변경이 Service에 영향을 주지 않고, 단위 테스트 시 Repository를 mock할 수 있다.

```javascript
// ✅ 준수 예시 — todo.repository.js
const { pool } = require('../config/database');

const todoRepository = {
  async findById(todoId) {
    const result = await pool.query(
      'SELECT * FROM todos WHERE todo_id = $1',
      [todoId]
    );
    return result.rows[0] ?? null;
  },

  async create(input) {
    const { user_id, category_id, title, description, due_date } = input;
    const result = await pool.query(
      `INSERT INTO todos (user_id, category_id, title, description, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, category_id, title, description, due_date]
    );
    return result.rows[0];
  },
};
```

### 2-3. 프론트엔드 레이어 구조

**왜:** UI 렌더링, 서버 상태, 클라이언트 상태, API 호출을 분리해야 각 레이어를 독립적으로 테스트하고 교체할 수 있다.

```
[Page]              — 라우트 단위 최상위 컴포넌트, 레이아웃 조합
    │
    ▼
[Feature Component] — 도메인 특화 UI (TodoList, TodoForm 등)
    │
    ▼
[Common Component]  — 재사용 UI (Button, Input, Modal 등)
    │
    ▼
[Custom Hook]       — 서버 상태(TanStack Query) + 클라이언트 상태(Zustand) 조율
    │
    ├──▶ [Store]    — Zustand: 클라이언트 전역 상태 (authUser, UI 상태)
    │
    └──▶ [API]      — axios 인스턴스 + TanStack Query queryFn
```

**레이어 간 의존성 규칙:**
- Page는 Feature/Common Component를 사용한다.
- Component는 Hook을 사용하고, Hook은 Store/API를 사용한다.
- Component가 직접 axios를 호출하지 않는다.
- Store(Zustand)는 서버 상태를 저장하지 않는다. 서버 상태는 TanStack Query가 관리한다.

```typescript
// ✅ 준수 — Component가 Hook을 통해 데이터 접근
function TodoList() {
  const { todos, isLoading } = useTodoList();
  return <ul>{todos.map(t => <TodoItem key={t.todo_id} todo={t} />)}</ul>;
}

// ❌ 위반 — Component에서 직접 API 호출
function TodoList() {
  const [todos, setTodos] = useState([]);
  useEffect(() => {
    axios.get('/api/todos').then(res => setTodos(res.data.data));
  }, []);
}
```

---

## 3. 코드/네이밍 원칙

### 3-1. 파일명 규칙

**왜:** 일관된 파일명 규칙이 있어야 파일 위치를 예측할 수 있어 탐색 비용이 줄어든다.

| 영역 | 규칙 | 예시 |
|------|------|------|
| 백엔드 전체 | kebab-case | `todo.service.js`, `auth.middleware.js`, `todo.repository.js` |
| 프론트엔드 컴포넌트 | PascalCase | `TodoList.tsx`, `CategoryBadge.tsx`, `Button.tsx` |
| 프론트엔드 훅 | camelCase, `use` 접두사 | `useTodoList.ts`, `useAuth.ts` |
| 프론트엔드 스토어 | camelCase, `Store` 접미사 | `authStore.ts`, `uiStore.ts` |
| 프론트엔드 API | camelCase, `.api.ts` 접미사 | `todo.api.ts`, `auth.api.ts` |
| 타입 정의 | camelCase, `.types.ts` 접미사 | `todo.types.ts`, `auth.types.ts` |

### 3-2. 함수·변수 네이밍 컨벤션

**왜:** 명확한 동사+명사 패턴이 코드의 의도를 즉시 전달한다.

| 종류 | 규칙 | 예시 |
|------|------|------|
| 함수 | 동사+명사 camelCase | `createTodo`, `findTodoById`, `validateOwnership` |
| 변수/상수 | camelCase | `todoList`, `userId`, `accessToken` |
| 환경변수 | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `DB_HOST`, `PORT` |
| DB 컬럼 참조 | snake_case (DB 스키마 일치) | `todo_id`, `user_id`, `is_completed` |
| React 컴포넌트 | PascalCase | `TodoListPage`, `CategorySelector` |
| 불리언 변수 | `is`/`has`/`can` 접두사 | `isLoading`, `hasError`, `isCompleted` |
| Repository 함수 | `find`/`create`/`update`/`remove` | `findAll`, `create`, `updateById`, `removeById` |

### 3-3. API 응답 구조 표준화

**왜:** 응답 형식이 일관되어야 프론트엔드에서 단일 axios 인터셉터로 모든 응답을 처리할 수 있다.

**성공 응답 (단건 / 생성 / 수정):**
```json
{ "data": { "todo_id": 1, "title": "보고서 작성", "is_completed": false } }
```

**성공 응답 (목록):**
```json
{ "data": [ { "todo_id": 1, "title": "보고서 작성" } ] }
```

**삭제 성공:** `204 No Content` (body 없음)

**실패 응답:**
```json
{ "error": { "code": "RESOURCE_NOT_FOUND", "message": "요청한 리소스를 찾을 수 없습니다." } }
```

```javascript
// ✅ 준수 — 표준 응답 헬퍼 함수
function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({ data });
}
```

### 3-4. 백엔드 코드 품질 원칙 (JavaScript)

**왜:** JavaScript로 작성하더라도 명확한 네이밍, JSDoc 문서화, 입력 유효성 검증으로 유지보수성을 확보한다.

- 외부 입력(req.body, req.params)은 반드시 Controller 진입부에서 필수값 존재 여부를 검증 후 사용한다 (AppError VALIDATION_ERROR 400)
- 함수는 JSDoc으로 파라미터와 반환값을 문서화한다
- `AppError` 클래스로 에러를 표준화한다 (`utils/error.js`)
- 에러 코드 상수는 `constants/errorCodes.js`에 정의한다

```javascript
// ✅ 준수 — JSDoc으로 함수 시그니처 문서화
/**
 * @param {number} todoId
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findTodoById(todoId, userId) {
  const result = await pool.query(
    'SELECT * FROM todos WHERE todo_id = $1',
    [todoId]
  );
  return result.rows[0] ?? null;
}
```

---

## 4. 테스트/품질 원칙

### 4-1. 테스트 전략

**왜:** 3일 MVP 일정에서 모든 코드를 테스트할 수 없다. 버그 발생 시 영향이 큰 핵심 경로에 집중한다.

| 레이어 | 테스트 종류 | 우선순위 | 대상 |
|--------|------------|---------|------|
| Backend Service | 단위 테스트 | 높음 | 비즈니스 규칙 (BR-02, 03, 05, 08) |
| Backend Repository | 단위 테스트 | 높음 | SQL 쿼리 결과 정합성 |
| Backend API | 통합 테스트 | 높음 | 인증, 소유권 검증, 에러 코드 |
| Frontend Hook | 단위 테스트 | 중간 | useTodoList, useAuth 등 |
| Frontend Component | 스냅샷/렌더링 | 낮음 | MVP에서는 생략 가능 |

### 4-2. 백엔드 테스트 원칙

**왜:** Service 비즈니스 규칙을 단위 테스트하면 BR 위반을 빠르게 감지하고, API 통합 테스트는 인증/권한 로직의 회귀를 방지한다.

```javascript
// ✅ 준수 — Service 비즈니스 규칙 단위 테스트
describe('todoService.deleteTodo', () => {
  it('본인 소유가 아닌 할일 삭제 시 FORBIDDEN 에러를 던진다', async () => {
    jest.spyOn(todoRepository, 'findById').mockResolvedValue({
      todo_id: 1, user_id: 99, title: 'test', is_completed: false,
    });

    await expect(todoService.deleteTodo(1, 1)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
```

**통합 테스트 필수 대상 (supertest):**
- `POST /api/auth/signup` — 중복 이메일 시 `DUPLICATE_EMAIL` (409)
- `POST /api/auth/login` — 잘못된 비밀번호 시 `UNAUTHORIZED` (401)
- `GET /api/todos` — 인증 헤더 없을 시 `UNAUTHORIZED` (401)
- `DELETE /api/categories/:id` — 할일이 있는 카테고리 삭제 시 `CATEGORY_HAS_TODOS` (409)
- `DELETE /api/categories/:id` — 기본 카테고리 삭제 시 `DEFAULT_CATEGORY_IMMUTABLE` (403)

### 4-3. 프론트엔드 테스트 원칙

**왜:** 커스텀 훅은 UI와 분리되어 있어 테스트하기 쉽고, 서버 상태 관리 로직의 정확성을 검증하는 데 효과적이다.

```typescript
// ✅ 준수 — useAuth 훅 단위 테스트
describe('useAuth', () => {
  it('로그아웃 시 authStore의 user가 null이 된다', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.logout(); });
    expect(result.current.user).toBeNull();
  });
});
```

### 4-4. 코드 품질 도구

**왜:** 자동화된 포맷·린팅 도구 없이는 코드 스타일 불일치로 diff 노이즈가 커진다.

**ESLint 주요 규칙:**
- `no-console`: warn (프로덕션 빌드에서 error로 격상)
- `import/order`: 내장 → 외부 라이브러리 → 내부 모듈 순서 강제

**백엔드 ESLint 설정 (JavaScript):**
```json
{ "env": { "node": true, "es2022": true }, "parserOptions": { "ecmaVersion": 2022, "sourceType": "module" } }
```

**Prettier 설정:**
```json
{ "semi": true, "singleQuote": true, "printWidth": 100, "trailingComma": "es5" }
```

---

## 5. 설정/보안/운영 원칙

### 5-1. 환경변수 관리

**왜:** 시크릿(비밀키, DB 비밀번호)이 소스 코드에 포함되면 보안 사고로 이어진다.

`.env` 파일은 `.gitignore`에 반드시 포함하고, `.env.example`을 커밋하여 필요한 변수를 명시한다.

**백엔드 필수 환경변수 (`.env.example`):**
```ini
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000

JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

**프론트엔드 필수 환경변수 (`.env.example`, Vite 기준):**
```ini
VITE_API_BASE_URL=http://localhost:3000/api
```

### 5-2. JWT 보안 원칙

**왜:** Access Token과 Refresh Token을 localStorage에 저장하면 XSS 공격에 취약하다. 두 토큰 모두 Zustand 메모리에 저장하면 페이지 새로고침 시 소멸하여 재로그인이 필요하다(의도된 보안 동작).

| 토큰 종류 | 만료 시간 | 저장 위치 | 전달 방식 |
|----------|----------|----------|---------|
| Access Token | 15분 | 메모리 (Zustand 상태) | `Authorization: Bearer` 헤더 |
| Refresh Token | 7일 | 메모리 (Zustand 상태) | `Authorization: Bearer` 헤더 |

**갱신 흐름:**
1. API 요청 → 서버로부터 401 응답 (Access Token 만료)
2. axios 인터셉터 → `POST /api/auth/refresh` 자동 호출 (Zustand의 Refresh Token을 `Authorization: Bearer` 헤더에 포함)
3. 새 Access Token 발급 → Zustand 상태 갱신 → 원래 요청 재시도
4. Refresh Token도 만료 → 상태 초기화 → 로그인 페이지로 리다이렉트

```typescript
// ✅ 준수 — axios 인터셉터로 토큰 자동 갱신
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      const { data } = await axiosInstance.post('/auth/refresh', null, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });
      useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
      error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return axiosInstance(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 5-3. SQL 인젝션 방지

**왜:** 사용자 입력을 SQL 문자열에 직접 삽입하면 데이터베이스 전체가 노출·훼손될 수 있다.

pg 라이브러리의 파라미터 바인딩($1, $2, ...)을 항상 사용한다. 문자열 템플릿 리터럴로 SQL을 조합하는 것을 금지한다.

```typescript
// ✅ 준수
const result = await pool.query(
  'SELECT * FROM todos WHERE user_id = $1 AND title ILIKE $2',
  [userId, `%${keyword}%`]
);

// ❌ 위반 — SQL 인젝션 취약
const result = await pool.query(
  `SELECT * FROM todos WHERE user_id = ${userId} AND title ILIKE '%${keyword}%'`
);
```

### 5-4. pg Pool 설정 원칙

**왜:** 동시 접속 300명 규모에서 커넥션 풀을 적절히 설정해야 DB 커넥션 고갈 없이 안정적인 응답을 보장한다.

```javascript
// ✅ 준수 — config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: Number(process.env.DB_POOL_MAX) || 10,            // 최대 커넥션 수
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000, // 유휴 커넥션 30초 후 반환
  connectionTimeoutMillis: 2000,                          // 커넥션 획득 대기 최대 2초
});

module.exports = { pool };
```

| 설정 | 값 | 근거 |
|------|---|------|
| `max` | 10 | PostgreSQL 기본 max_connections(100)의 10% 수준. 소규모 서버 기준 적정값 |
| `idleTimeoutMillis` | 30000 | 사용하지 않는 커넥션 30초 후 반환하여 DB 부하 감소 |
| `connectionTimeoutMillis` | 2000 | 2초 내 커넥션 획득 실패 시 에러 반환으로 요청 지연 방지 |

### 5-5. CORS 설정 원칙

**왜:** 와일드카드(`*`) CORS는 보안 위협이 된다. 허용 오리진을 명시적으로 설정한다.

```javascript
// ✅ 준수
app.use(cors({
  origin: process.env.CORS_ORIGIN,   // 명시적 오리진 (예: http://localhost:5173)
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ❌ 위반
app.use(cors()); // 와일드카드 허용
```

---

## 6. 프론트엔드 디렉토리 구조

```
frontend/
└── src/
    ├── api/                            # axios 인스턴스 및 API 호출 함수
    │   ├── axiosInstance.ts            # axios 기본 설정, 토큰 갱신 인터셉터
    │   ├── auth.api.ts                 # 회원가입, 로그인, 로그아웃, 토큰갱신 호출
    │   ├── todo.api.ts                 # 할일 CRUD API 호출 함수
    │   └── category.api.ts             # 카테고리 API 호출 함수
    │
    ├── components/                     # 도메인 무관 공통 재사용 UI 컴포넌트
    │   ├── Button.tsx                  # 기본 버튼 (variant: primary, secondary, danger)
    │   ├── Input.tsx                   # 텍스트 입력 필드
    │   ├── Modal.tsx                   # 모달 레이아웃 (확인 다이얼로그 등)
    │   ├── Spinner.tsx                 # 로딩 스피너
    │   ├── ErrorMessage.tsx            # 에러 메시지 표시 컴포넌트
    │   └── Badge.tsx                   # 상태 배지 (완료/미완료)
    │
    ├── features/                       # 도메인별 기능 모듈 (응집도 높은 단위)
    │   ├── auth/
    │   │   ├── components/
    │   │   │   ├── LoginForm.tsx       # 로그인 폼 (UC-02)
    │   │   │   └── SignupForm.tsx      # 회원가입 폼 (UC-01)
    │   │   ├── hooks/
    │   │   │   └── useAuth.ts          # 로그인, 로그아웃, 회원가입, 탈퇴 (UC-02, 11, 01, 13)
    │   │   └── types/
    │   │       └── auth.types.ts       # LoginRequest, SignupRequest, AuthUser
    │   │
    │   ├── todo/
    │   │   ├── components/
    │   │   │   ├── TodoList.tsx        # 할일 목록 렌더링 (UC-08)
    │   │   │   ├── TodoItem.tsx        # 할일 단건 카드 (UC-07)
    │   │   │   ├── TodoForm.tsx        # 할일 등록/수정 폼 (UC-04, UC-05)
    │   │   │   └── TodoFilter.tsx      # 필터 UI (category_id, from, to, is_completed)
    │   │   ├── hooks/
    │   │   │   ├── useTodoList.ts      # 목록 조회 (TanStack Query useQuery)
    │   │   │   ├── useTodoMutations.ts # 생성, 수정, 삭제, 완료 토글 (useMutation)
    │   │   │   └── useTodoFilter.ts    # 필터 상태 관리 (Zustand 또는 로컬 상태)
    │   │   └── types/
    │   │       └── todo.types.ts       # Todo, CreateTodoInput, UpdateTodoInput, TodoFilter
    │   │
    │   └── category/
    │       ├── components/
    │       │   ├── CategoryList.tsx    # 카테고리 목록 (UC-10)
    │       │   └── CategoryForm.tsx    # 카테고리 추가 폼 (UC-09)
    │       ├── hooks/
    │       │   ├── useCategoryList.ts  # 카테고리 목록 조회
    │       │   └── useCategoryMutations.ts # 카테고리 생성, 삭제
    │       └── types/
    │           └── category.types.ts   # Category, CreateCategoryInput
    │
    ├── hooks/                          # 도메인 무관 공통 커스텀 훅
    │   ├── useToast.ts                 # 토스트 알림 훅
    │   └── useMediaQuery.ts            # 반응형 브레이크포인트 훅
    │
    ├── pages/                          # 라우트 단위 최상위 페이지 컴포넌트
    │   ├── LoginPage.tsx               # /login
    │   ├── SignupPage.tsx              # /signup
    │   ├── TodoListPage.tsx            # / (인증 필요)
    │   ├── CategoryPage.tsx            # /categories (인증 필요)
    │   └── ProfilePage.tsx             # /profile (인증 필요)
    │
    ├── store/                          # Zustand 클라이언트 전역 상태
    │   ├── authStore.ts                # 인증 사용자 정보 (user, accessToken 설정·파기)
    │   └── uiStore.ts                  # UI 상태 (모달 open/close, 토스트 큐)
    │
    ├── types/                          # 프론트엔드 전역 공유 타입
    │   ├── api.types.ts                # ApiResponse<T>, ApiError 공통 응답 타입
    │   └── common.types.ts             # 공통 유틸 타입
    │
    ├── utils/                          # 순수 유틸리티 함수
    │   ├── date.ts                     # 날짜 포맷팅 (formatDate, isOverdue 등)
    │   └── errorMessage.ts             # API 에러 코드 → 사용자 메시지 변환
    │
    ├── router.tsx                      # React Router 라우팅 정의, 보호 라우트(ProtectedRoute)
    ├── App.tsx                         # 최상위 앱, QueryClientProvider, 토스트 컨테이너
    └── main.tsx                        # 진입점
```

**핵심 규칙:**
- `features/` 내 각 도메인은 자신의 `types/`를 갖는다. 도메인 간 타입 공유가 필요하면 `types/`에 올린다.
- `components/`는 어떤 도메인 타입도 import하지 않는다. props로만 데이터를 받는다.
- `pages/`는 라우팅 레이아웃만 담당하고, 실제 로직은 `features/` 컴포넌트와 훅에 위임한다.
- `store/`는 서버에서 가져온 데이터를 저장하지 않는다. TanStack Query 캐시가 서버 상태를 담당한다.

---

## 7. 백엔드 디렉토리 구조

```
backend/
└── src/
    ├── config/                         # 설정 및 초기화
    │   ├── database.js                 # pg Pool 인스턴스 생성 및 export
    │   └── env.js                      # 환경변수 로드 및 필수값 유효성 검증
    │
    ├── middleware/                     # Express 미들웨어
    │   ├── authenticate.js             # JWT Access Token 검증, req.user 주입
    │   └── errorHandler.js             # 중앙 에러 핸들러 (AppError → 표준 응답), asyncHandler 래퍼
    │
    ├── routes/                         # Express 라우터 (URL 매핑만)
    │   ├── auth.routes.js              # /api/auth/* 라우트 정의
    │   ├── user.routes.js              # /api/users/* 라우트 정의
    │   ├── todo.routes.js              # /api/todos/* 라우트 정의
    │   └── category.routes.js          # /api/categories/* 라우트 정의
    │
    ├── controllers/                    # 요청/응답 처리 (req 파싱 → service 호출 → res 반환)
    │   ├── auth.controller.js          # signup, login, logout, refresh 핸들러
    │   ├── user.controller.js          # getMe, updateMe, deleteMe 핸들러
    │   ├── todo.controller.js          # getTodos, getTodoById, createTodo, updateTodo, deleteTodo, toggleComplete 핸들러
    │   └── category.controller.js      # getCategories, createCategory, deleteCategory 핸들러
    │
    ├── services/                       # 비즈니스 로직 및 도메인 규칙 검증
    │   ├── auth.service.js             # 회원가입(해싱), 로그인(검증), 토큰 발급·검증
    │   ├── user.service.js             # 프로필 조회·수정, 탈퇴(cascade 처리)
    │   ├── todo.service.js             # Todo CRUD + 소유권 검증 (BR-02, BR-03)
    │   └── category.service.js         # 카테고리 생성·삭제, BR-05·BR-08 규칙 검증
    │
    ├── repositories/                   # pg Pool을 통한 직접 SQL 실행 (데이터 접근만)
    │   ├── user.repository.js          # findByEmail, findById, create, update, remove
    │   ├── todo.repository.js          # findAll(필터), findById, create, update, remove, toggleComplete
    │   └── category.repository.js      # findAllByUser, findById, create, remove, hasTodos
    │
    ├── constants/                      # 공통 상수
    │   └── errorCodes.js               # AppError 에러 코드 상수 9개
    │
    ├── utils/                          # 순수 유틸리티 함수
    │   ├── error.js                    # AppError 클래스 정의
    │   ├── jwt.js                      # generateAccessToken, generateRefreshToken, verifyToken
    │   ├── password.js                 # hashPassword, comparePassword (bcrypt 래퍼)
    │   ├── response.js                 # sendSuccess 응답 헬퍼
    │   └── pgErrorHandler.js           # pg 에러코드 → AppError 변환 유틸 (23505, 23503)
    │
    ├── app.js                          # Express 앱 설정 (미들웨어, 라우터 직접 마운트, 에러핸들러, Swagger UI /api-docs)
    └── server.js                       # HTTP 서버 시작, pg Pool 연결 확인
```

**핵심 규칙:**
- `routes/`는 Controller 함수를 import하고 미들웨어 체인을 구성하는 것 외의 로직을 갖지 않는다. 라우터 마운트(`app.use('/api/...')`)는 `app.js`에서 직접 처리한다.
- `controllers/`는 `req.body`, `req.params`, `req.user`를 읽고 `res.json()`으로 응답한다. `asyncHandler` 래퍼로 try-catch를 제거하고 `next(error)`를 자동 위임한다.
- `services/`는 `pg`를 import하지 않는다. 모든 DB 접근은 Repository를 통해서만 한다.
- `repositories/`는 비즈니스 규칙을 포함하지 않는다. 데이터를 읽고 쓰는 것만 담당한다.

---

## 부록: 핵심 원칙 체크리스트

MVP 개발 시 매 파일 작성 전 아래 항목을 확인한다.

| # | 확인 항목 | 위반 시 결과 |
|---|-----------|------------|
| 1 | 이 파일의 레이어 역할이 명확한가? | 책임 혼재로 테스트 불가 |
| 2 | 상위 레이어에 의존하지 않는가? | 순환 참조 빌드 오류 |
| 3 | SQL에 파라미터 바인딩($1, $2)을 사용하는가? | SQL 인젝션 취약 |
| 4 | 외부 입력(req.body)에 유효성 검증을 적용했는가? | 잘못된 데이터 DB 저장 |
| 5 | API 응답이 표준 구조(`{ data }` / `{ error }`)를 따르는가? | 프론트엔드 파싱 오류 |
| 6 | 시크릿·비밀번호를 환경변수로 관리하는가? | 보안 사고 위험 |
| 7 | 비즈니스 규칙(BR-*)은 Service에만 있는가? | BR 검증 누락 가능 |
| 8 | CORS에 명시적 오리진을 설정했는가? (`credentials`는 Bearer 토큰 방식이므로 불필요) | 와일드카드 CORS 허용으로 보안 취약 |
