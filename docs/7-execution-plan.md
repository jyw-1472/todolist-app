# TodoListApp 실행계획

| 항목      | 내용                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| 버전      | v1.0                                                                               |
| 작성일    | 2026-05-13                                                                         |
| 참조 문서 | 2-prd.md, 3-user-scenario.md, 4-project-principles.md, 5-arch-diagram.md, 6-erd.md |

## 변경 이력

| 버전 | 날짜       | 작성자                              | 변경 내용                                                                     |
| ---- | ---------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| v1.0 | 2026-05-13 | Business Analyst (3-agent parallel) | 최초 작성 — DB·백엔드·프론트엔드 레이어 병렬 분석 후 통합                     |
| v1.1 | 2026-05-13 | jung young woo                      | DB-01 Docker → 로컬 설치 반영, DB-02/DB-07 연결 설정 업데이트                 |
| v1.2 | 2026-05-13 | jung young woo                      | 백엔드 언어 변경: TypeScript → JavaScript, BE Task 전체 반영                  |
| v1.3 | 2026-05-14 | jung young woo                      | BE-13~BE-17 완료 처리, swagger-ui-express 추가 반영, DB-08 파일명 오탈자 수정 |

---

## 개요

MVP 일정 3일, 동시 접속 300명을 목표로 데이터베이스(DB) · 백엔드(BE) · 프론트엔드(FE) 레이어를 독립적이고 관리 가능한 Task로 분해한다. 각 Task는 완료 조건(체크박스)과 의존성을 명시하여 진척 추적과 병렬 진행이 가능하도록 설계한다.

| 레이어            | Task 수  | 순차 기준 예상 시간 |
| ----------------- | -------- | ------------------- |
| 데이터베이스 (DB) | 8개      | 약 3시간            |
| 백엔드 (BE)       | 17개     | 약 9시간 30분       |
| 프론트엔드 (FE)   | 16개     | 약 15시간 30분      |
| **합계**          | **41개** | **약 28시간**       |

> 병렬 진행 시 실질 소요 시간은 약 15~18시간으로 단축 가능하다.

---

## 전체 의존성 개요

```
[DB-01] 로컬 DB 생성
    └─ [DB-02] 환경변수
          ├─ [DB-03] pg Pool 모듈 ──── [DB-08] Pool 에러핸들링
          └─ [DB-04] 마이그레이션 스크립트
                ├─ [DB-05] 시드 데이터 검증
                ├─ [DB-06] 인덱스·트리거 검증
                └─ [DB-07] 테스트 DB 격리

[BE-01] 프로젝트 초기화
    ├─ [BE-02] 환경변수 모듈
    │     ├─ [BE-04] 공통 유틸
    │     ├─ [BE-05] pg Pool
    │     │     └─ [BE-06] Express 서버 ── [BE-07] 에러핸들러
    │     │                                      └─ [BE-08] authenticate
    ├─ [BE-03] AppError 및 에러 코드 ───────────────────────────┤
    └─ [BE-09] 스키마 SQL(완료) ─ [BE-10] User Repository ─── [BE-11] Auth Service ── [BE-12] Auth Router
                                 [BE-14] Category Repository── [BE-15] Category Router
                                 [BE-16] Todo Repository ───── [BE-17] Todo Router
                                                               [BE-13] User Router

[FE-01] 프로젝트 초기화
    ├─ [FE-02] 전역 타입
    │     ├─ [FE-03] axios 인터셉터 ── [FE-09] Auth API ── [FE-10] Auth Feature ── [FE-11] Auth Page
    │     │                            [FE-12] Category API ── [FE-15] Category Page
    │     │                            [FE-13] Todo API ──────── [FE-14] Todo Page
    │     ├─ [FE-04] authStore ──── [FE-08] 라우팅
    │     └─ [FE-06] 유틸
    ├─ [FE-05] TanStack Query 설정
    └─ [FE-07] 공통 UI 컴포넌트 ────────────────────────── [FE-16] Profile Page
```

---

## 1. 데이터베이스 레이어 (DB)

> **현재 완료 항목**: `database/schema.sql` 생성 완료 (DDL 3개 테이블, 인덱스, 트리거, 시드 데이터 5건 포함)

---

### DB-01 로컬 PostgreSQL 17 데이터베이스 생성 ✅ 완료

**설명**

PostgreSQL 17이 로컬에 직접 설치되어 있다(`localhost:5432`, 연결 확인 완료). 개발용 데이터베이스(`todolist_db`)와 테스트용 데이터베이스(`todolist_test_db`)를 생성하고 프로젝트에서 사용할 사용자 권한을 설정한다.

실행 SQL:

```sql
CREATE DATABASE todolist_db;
CREATE DATABASE todolist_test_db;
-- 기본 postgres 사용자를 그대로 사용하거나 전용 사용자 생성
-- CREATE USER todolist_user WITH PASSWORD '...';
-- GRANT ALL PRIVILEGES ON DATABASE todolist_db TO todolist_user;
```

**완료 조건**

- [x] PostgreSQL 17이 `localhost:5432`에서 정상 응답한다 (확인 완료)
- [x] `todolist_db` 데이터베이스가 생성되어 있다
- [x] `todolist_test_db` 데이터베이스가 생성되어 있다
- [x] `psql -h localhost -U postgres -d todolist_db` 접속이 성공한다
- [x] `psql -h localhost -U postgres -d todolist_test_db` 접속이 성공한다

**의존성**: 없음 (시작점)
**예상 소요 시간**: 10분

---

### DB-02 백엔드 환경변수 파일(.env) 구성 ✅ 완료

**설명**

`backend/.env.example`(Git 커밋 대상)과 `backend/.env`(`.gitignore` 등록, 로컬 전용)를 구성한다. DB 연결 및 Pool 설정값을 환경변수로 관리한다.

포함 변수: `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=todolist_db`, `DB_USER=postgres`, `DB_PASSWORD`, `DB_POOL_MAX=10`, `DB_IDLE_TIMEOUT_MS=30000`

> 프로젝트 루트의 `.env`(`POSTGRES_CONNECTION_STRING`)는 MCP 도구용 연결 문자열이며, 백엔드 애플리케이션은 `backend/.env`의 개별 변수를 사용한다.

**완료 조건**

- [x] `backend/.env.example` 파일이 존재하고 DB 변수 7개가 모두 포함되어 있다
- [x] `backend/.env`가 `.gitignore`에 등록되어 Git 추적 대상에서 제외된다
- [x] `backend/.env` 내 DB 접속 값이 로컬 PostgreSQL 설치 정보와 일치한다
- [x] `DB_POOL_MAX=10`, `DB_IDLE_TIMEOUT_MS=30000` 값이 명시적으로 설정되어 있다

**의존성**: DB-01
**예상 소요 시간**: 15분

---

### DB-03 pg Pool 연결 모듈 구현 ✅ 완료

**설명**

`backend/src/config/database.js`에 PostgreSQL Pool 인스턴스를 생성하고 module.exports한다. Pool 설정(`max=10`, `idleTimeoutMillis=30000`, `connectionTimeoutMillis=2000`)과 연결 검증 함수 `connectDatabase()`를 구현한다. 연결 실패 시 `process.exit(1)` 호출.

**완료 조건**

- [x] `backend/src/config/database.js` 파일이 존재한다
- [x] `pool` 인스턴스가 `new Pool({...})`로 생성되고 named export로 제공된다
- [x] `max=10`, `idleTimeoutMillis=30000`, `connectionTimeoutMillis=2000`이 모두 설정된다
- [x] `connectDatabase()` 함수가 `pool.connect()` 후 즉시 release하는 방식으로 연결을 검증한다
- [x] 연결 실패 시 에러 메시지를 출력하고 `process.exit(1)`을 호출한다
- [x] JSDoc으로 파라미터와 반환값이 문서화되어 있다

**의존성**: DB-02
**예상 소요 시간**: 30분

---

### DB-04 스키마 마이그레이션 실행 스크립트 구현 ✅ 완료

**설명**

`database/migrate.js` 스크립트를 작성하여 `database/schema.sql`을 PostgreSQL에 적용한다. `package.json`에 `db:migrate`(개발 DB)와 `db:migrate:test`(테스트 DB) 스크립트를 등록한다.

**완료 조건**

- [x] `database/migrate.js` 파일이 존재한다
- [x] `npm run db:migrate` 실행 시 DDL, 트리거, 시드 데이터가 모두 적용된다
- [x] 스크립트 재실행 시 `DROP TABLE IF EXISTS` 구문으로 오류 없이 재적용된다
- [x] `npm run db:migrate:test` 실행 시 로컬 `todolist_test_db`에 동일 스키마가 적용된다
- [x] 실행 후 `\dt` 명령에서 `users`, `categories`, `todos` 3개 테이블이 확인된다

**의존성**: DB-01, DB-02
**예상 소요 시간**: 30분

---

### DB-05 시드 데이터 정합성 검증 ✅ 완료

**설명**

마이그레이션 후 기본 카테고리 5건(`user_id IS NULL`)이 올바르게 삽입되었는지 검증한다. `database/seed-verify.js` 스크립트로 자동화하고 `db:verify` npm 스크립트로 등록한다.

검증 SQL: `SELECT * FROM categories WHERE user_id IS NULL ORDER BY category_id;`
예상 결과: 5행, `is_default=TRUE`인 '전체' 1건 + `is_default=FALSE`인 '업무'·'개인'·'쇼핑'·'기타' 4건

**완료 조건**

- [x] 마이그레이션 후 `categories` 테이블에 `user_id IS NULL` 행이 정확히 5건이다
- [x] '전체' 카테고리의 `is_default` 값이 `TRUE`다
- [x] '업무', '개인', '쇼핑', '기타' 카테고리의 `is_default` 값이 모두 `FALSE`다
- [x] 5개 카테고리명이 정확히 '전체', '업무', '개인', '쇼핑', '기타'다 (공백·오탈자 없음)
- [x] `todos` 테이블과 `users` 테이블이 비어 있다

**의존성**: DB-04
**예상 소요 시간**: 20분

---

### DB-06 인덱스 및 트리거 적용 검증 ✅ 완료

**설명**

`schema.sql`에 정의된 인덱스 3개(`idx_categories_user_id`, `idx_todos_user_id`, `idx_todos_category_id`)와 트리거 1개(`trg_todos_updated_at`)가 정상 적용되었는지 검증한다.

검증 SQL: `SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('categories', 'todos');`
트리거 동작 검증: `todos` 행 UPDATE 후 `updated_at`이 `created_at`보다 최신인지 확인

**완료 조건**

- [x] `idx_categories_user_id`, `idx_todos_user_id`, `idx_todos_category_id` 인덱스가 `pg_indexes`에 존재한다
- [x] `trg_todos_updated_at` 트리거가 `pg_trigger`에 존재한다
- [x] `todos` 행을 UPDATE했을 때 `updated_at`이 자동 갱신된다
- [x] `set_updated_at()` 함수가 `pg_proc`에 존재한다

**의존성**: DB-04
**예상 소요 시간**: 20분

---

### DB-07 테스트 데이터베이스 격리 환경 구성 ✅ 완료

**설명**

통합 테스트(supertest)에서 사용할 테스트 DB 환경을 구성한다. 로컬 PostgreSQL에 `todolist_test_db` 데이터베이스(DB-01에서 생성)를 사용한다. Jest 글로벌 setup에서 `todolist_test_db`에 스키마를 자동 적용하고, 각 테스트 케이스 후 사용자 생성 데이터를 초기화한다(시스템 기본 카테고리 `user_id IS NULL`은 유지).

teardown SQL:

```sql
DELETE FROM todos;
DELETE FROM categories WHERE user_id IS NOT NULL;
DELETE FROM users;
```

테스트 연결 설정은 `backend/.env.test`에 별도 관리한다:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_test_db
DB_USER=postgres
```

**완료 조건**

- [x] `todolist_test_db` 데이터베이스가 로컬 PostgreSQL에 존재한다 (DB-01에서 생성)
- [x] `backend/.env.test` 파일에 테스트 DB 연결 정보가 설정되어 있다
- [x] `backend/jest.config.js`에 `globalSetup` 또는 `setupFiles` 설정이 있다
- [x] 테스트 실행 전 `todolist_test_db`에 스키마가 자동 적용된다 (`src/test/globalSetup.js`)
- [x] 각 테스트 케이스 종료 후 사용자 생성 데이터가 초기화된다 (`src/test/teardown.js`)
- [x] 초기화 후에도 시스템 기본 카테고리 5건이 유지된다
- [x] 개발 DB(`todolist_db`)와 테스트 DB(`todolist_test_db`)가 완전히 격리된다

**의존성**: DB-01, DB-03, DB-04
**예상 소요 시간**: 30분

---

### DB-08 pg Pool 에러 핸들링 통합 ✅ 완료

**설명**

`server.ts`에서 HTTP 서버 기동 전 DB 연결 상태를 확인한다. Pool 레벨 에러 이벤트 핸들러를 등록하고, pg 에러코드를 `AppError`로 변환하는 유틸 패턴을 정의한다.

변환 패턴:

- `23505` (unique_violation) → `DUPLICATE_EMAIL(409)` / `DUPLICATE_CATEGORY(409)`
- `23503` (foreign_key_violation) → `RESOURCE_NOT_FOUND(404)`

**완료 조건**

- [ ] `server.js`에서 `connectDatabase()`가 `app.listen()` 이전에 호출된다 (BE-06에서 완성)
- [x] DB 연결 성공 시 `[DB] Connected to PostgreSQL` 형태의 로그가 출력된다
- [x] DB 연결 실패 시 서버가 기동되지 않고 `process.exit(1)`이 호출된다
- [x] `pool.on('error', ...)` 핸들러가 등록되어 있다
- [x] pg 에러코드 `23505` / `23503` 변환 로직이 유틸 함수로 존재한다 (`src/utils/pgErrorHandler.ts`)

**의존성**: DB-03
**예상 소요 시간**: 30분

---

## 2. 백엔드 레이어 (BE)

> **현재 완료 항목**: `database/schema.sql` 존재로 BE-09는 작성 불필요. 마이그레이션 스크립트(DB-04) 완료 후 백엔드에서 참조하면 된다.

---

### BE-01 프로젝트 초기화 및 폴더 구조 생성 ✅ 완료

**설명**

`backend/` 루트에서 Node.js + Express 프로젝트를 부트스트랩한다.

설치 패키지(dependencies): `express`, `pg`, `bcrypt`, `jsonwebtoken`, `dotenv`, `cors`, `swagger-ui-express`
설치 패키지(devDependencies): `nodemon`, `jest`, `supertest`

생성할 디렉토리 골격:

```
backend/src/
  config/      middleware/   routes/
  controllers/ services/     repositories/
  constants/   utils/        test/
```

`package.json` scripts: `"dev": "nodemon src/server.js"`, `"start": "node src/server.js"`, `"test": "jest"`

**완료 조건**

- [x] `package.json`에 필수 의존성이 모두 명시되어 있다
- [x] `backend/src/` 하위 8개 디렉토리가 모두 생성되어 있다
- [x] `npm install` 실행 시 오류 없이 완료된다
- [x] `.gitignore`에 `.env`가 포함되어 있다
- [x] `package.json`의 `"type": "module"` 또는 CommonJS 방식이 일관되게 적용된다

**의존성**: 없음
**예상 소요 시간**: 30분

---

### BE-02 환경변수 관리 모듈 구현 ✅ 완료

**설명**

`backend/src/config/env.js`를 구현한다. `dotenv.config()` 호출 후 필수 환경변수 존재 여부를 검증하고 누락 시 `process.exit(1)`로 종료한다. 안전한 `env` 객체를 export한다.

관리할 환경변수: `PORT(3000)`, `NODE_ENV`, DB 관련 7개, `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN(15m)`, `JWT_REFRESH_EXPIRES_IN(7d)`, `CORS_ORIGIN`

export 형태:

```javascript
export const env = {
  port,
  nodeEnv,
  db: { host, port, name, user, password, poolMax, idleTimeoutMs },
  jwt: { secret, accessExpiresIn, refreshExpiresIn },
  corsOrigin,
};
```

**완료 조건**

- [x] `env.js`가 `dotenv.config()`를 호출하고 있다
- [x] 필수 환경변수 중 하나라도 누락 시 누락된 키 이름이 로그에 출력되고 프로세스가 종료된다
- [x] `JWT_SECRET`, `DB_PASSWORD` 등 시크릿이 소스 코드에 하드코딩되어 있지 않다
- [x] `.env.example`이 커밋되어 있으며 모든 필수 키가 명시되어 있다
- [x] `env` 객체를 require해 오류 없이 사용할 수 있다

**의존성**: BE-01
**예상 소요 시간**: 20분

---

### BE-03 AppError 클래스 및 에러 코드 상수 구현 ✅ 완료

**설명**

`backend/src/utils/error.js`에 AppError 클래스를 구현하고, `backend/src/constants/errorCodes.js`에 에러 코드 상수 9개를 정의한다.

AppError 클래스:

```javascript
class AppError extends Error {
  constructor(code, statusCode, message) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
```

에러 코드 상수:
VALIDATION_ERROR(400), UNAUTHORIZED(401), FORBIDDEN(403), RESOURCE_NOT_FOUND(404),
DUPLICATE_EMAIL(409), DUPLICATE_CATEGORY(409), CATEGORY_HAS_TODOS(409),
DEFAULT_CATEGORY_IMMUTABLE(403), INTERNAL_SERVER_ERROR(500)

**완료 조건**

- [x] `backend/src/utils/error.js` 파일이 존재한다
- [x] `AppError` 인스턴스에서 `code`, `statusCode`, `message` 프로퍼티에 접근 가능하다
- [x] `backend/src/constants/errorCodes.js`에 9개 에러 코드가 모두 정의되어 있다
- [x] `throw new AppError(CODES.RESOURCE_NOT_FOUND, 404, '...')`가 정상 동작한다

**의존성**: BE-01
**예상 소요 시간**: 20분

---

### BE-04 공통 유틸리티 함수 구현 ✅ 완료

**설명**

`backend/src/utils/` 디렉토리에 공통 헬퍼 함수를 구현한다.

- `jwt.js`: `generateAccessToken(payload)` (15분), `generateRefreshToken(payload)` (7일), `verifyToken(token)` — 만료·서명 오류 시 `AppError('UNAUTHORIZED', 401)` throw
- `password.js`: `hashPassword(plain)` — bcrypt salt rounds ≥ 10, `comparePassword(plain, hashed)`
- `response.js`: `sendSuccess(res, data, statusCode?)` — `{ data }` 구조 응답

**완료 조건**

- [x] `generateAccessToken` 결과를 `verifyToken`으로 복호화할 수 있다
- [x] `generateRefreshToken`의 만료 시간이 7일로 설정되어 있다
- [x] `hashPassword`의 bcrypt salt rounds가 10 이상이다
- [x] 만료된 토큰을 `verifyToken`에 전달 시 `AppError`가 throw된다
- [x] `sendSuccess`의 응답 바디가 `{ "data": ... }` 구조를 따른다
- [x] 모든 함수가 JSDoc으로 파라미터와 반환값이 문서화되어 있다

**의존성**: BE-02, BE-03
**예상 소요 시간**: 40분

---

### BE-05 pg 데이터베이스 연결 풀 모듈 구현 ✅ 완료

**설명**

`backend/src/config/database.js`에 pg `Pool` 인스턴스를 생성하고 export한다. `process.env.DB_*` 환경변수를 기반으로 Pool을 설정하고, `testConnection()` 함수로 연결 상태를 검증한다. 싱글톤으로 export하여 모든 Repository에서 동일 인스턴스를 공유한다.

**완료 조건**

- [x] `pool`이 `process.env.DB_*` 환경변수를 기반으로 생성된다
- [x] `connectionTimeoutMillis: 2000`이 설정되어 있다
- [x] DB 연결 실패 시 `server.js`가 시작을 중단하고 에러 메시지를 출력한다
- [x] `pool`이 싱글톤으로 export되어 여러 파일에서 동일 인스턴스를 공유한다

**의존성**: BE-02
**예상 소요 시간**: 20분

---

### BE-06 Express 앱 설정 및 서버 진입점 구현 ✅ 완료

**설명**

`backend/src/app.js`와 `backend/src/server.js`를 구현한다. CORS(`credentials` 없음), `express.json()`, 라우터 마운트 슬롯, 에러 핸들러 등록 슬롯을 설정한다.

```javascript
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

**완료 조건**

- [x] `node src/server.js` 실행 시 "Server running on port 3000" 로그가 출력된다
- [x] DB 연결 성공 후에만 서버가 listen을 시작한다
- [x] `cors` 미들웨어에 `*` 와일드카드가 아닌 명시적 `origin` 값이 설정되어 있다
- [x] `express.json()`이 등록되어 JSON 요청 바디를 파싱할 수 있다
- [x] 정의되지 않은 경로 요청 시 404가 반환된다
- [x] `swagger-ui-express`가 설치되어 `/api-docs`에서 Swagger UI가 제공된다

**의존성**: BE-02, BE-05
**예상 소요 시간**: 20분

---

### BE-07 공통 에러 처리 미들웨어 구현 ✅ 완료

**설명**

`backend/src/middleware/errorHandler.js`에 Express 4-인자 에러 핸들러를 구현한다. `AppError` → 표준 에러 응답(`{ "error": { "code": "...", "message": "..." } }`) 변환, 예상치 못한 에러 → `INTERNAL_SERVER_ERROR(500)` 처리. `asyncHandler` 래퍼로 Controller의 try-catch를 제거한다.

**완료 조건**

- [x] `AppError('RESOURCE_NOT_FOUND', 404)` throw 시 응답이 `{ "error": { "code": "RESOURCE_NOT_FOUND", ... } }`이다
- [x] 예상치 못한 `Error` throw 시 500 응답이 반환되고 서버가 다운되지 않는다
- [x] `asyncHandler` 래퍼가 async Controller의 rejected Promise를 `next(error)`로 전달한다
- [x] 에러 핸들러가 모든 라우터 이후에 등록된다
- [x] 클라이언트에게 스택 트레이스가 노출되지 않는다 (production 환경 기준)

**의존성**: BE-03, BE-06
**예상 소요 시간**: 30분

---

### BE-08 인증 미들웨어 (authenticate) 구현 ✅ 완료

**설명**

`backend/src/middleware/authenticate.js`에 JWT Access Token 검증 미들웨어를 구현한다. `Authorization: Bearer <token>` 헤더 추출 → `verifyToken()` 검증 → `req.user = { userId, email }` 주입 → `next()` 호출. 인증 불필요 라우트(`POST /signup`, `POST /login`)에는 적용하지 않는다.

**완료 조건**

- [x] `Authorization` 헤더 없는 요청 시 401 `UNAUTHORIZED`가 반환된다
- [x] 만료된 Access Token 전달 시 401 `UNAUTHORIZED`가 반환된다
- [x] 유효한 Access Token 전달 시 `req.user.userId`와 `req.user.email`이 정확히 주입된다
- [x] `req.user.userId`와 `req.user.email`이 미들웨어에서 올바르게 주입된다
- [x] 미들웨어 내부에서 DB 조회를 수행하지 않는다 (토큰 페이로드만 사용)

**의존성**: BE-03, BE-04, BE-07
**예상 소요 시간**: 30분

---

### BE-09 DB 스키마 초기화 SQL ✅ 완료

`database/schema.sql` 파일이 이미 생성되어 있다. 마이그레이션 스크립트(DB-04) 완료 후 바로 BE-10으로 진행한다.

---

### BE-10 Auth 도메인 — User Repository 구현 ✅ 완료

**설명**

`backend/src/repositories/user.repository.js`를 구현한다. 모든 SQL은 파라미터 바인딩(`$1`, `$2`) 방식만 사용하며 비즈니스 규칙은 포함하지 않는다.

구현 함수:

- `findByEmail(email)` — `Promise<User | null>`
- `findById(userId)` — `Promise<User | null>`
- `create(input)` — `Promise<User>` — `RETURNING *`
- `updateById(userId, input)` — `Promise<User | null>`
- `removeById(userId)` — `Promise<void>` — CASCADE로 연관 데이터 삭제

**완료 조건**

- [x] `findByEmail`이 존재하지 않는 이메일 조회 시 `null`을 반환한다
- [x] `create`가 `RETURNING *`으로 생성된 사용자 전체 정보를 반환한다
- [x] 모든 SQL 쿼리에서 문자열 직접 삽입이 없고 `$1`, `$2` 바인딩만 사용한다
- [x] Repository 함수 내에서 비즈니스 규칙 검증이 없다

**의존성**: BE-03, BE-05, DB-04
**예상 소요 시간**: 30분

---

### BE-11 Auth 도메인 — Service 구현 ✅ 완료

**설명**

`backend/src/services/auth.service.js`를 구현한다. 회원가입·로그인·로그아웃·토큰 갱신 비즈니스 규칙을 담당한다. Refresh Token 무효화는 `refresh_tokens` 테이블 또는 인메모리 Set으로 관리한다.

구현 함수:

- `register(email, password, name)` — 이메일 중복 확인 → `DUPLICATE_EMAIL(409)`, bcrypt 해시, 사용자 생성
- `login(email, password)` — 비밀번호 불일치 시 `UNAUTHORIZED(401)`, 토큰 2개 발급
- `logout(userId, refreshToken)` — Refresh Token 무효화
- `refresh(refreshToken)` — 토큰 검증·무효화 확인 후 새 토큰 2개 발급

**완료 조건**

- [x] 이미 존재하는 이메일로 `register` 호출 시 `AppError('DUPLICATE_EMAIL', 409)`가 throw된다
- [x] 잘못된 비밀번호로 `login` 호출 시 `AppError('UNAUTHORIZED', 401)`가 throw된다
- [x] `login` 성공 시 `accessToken`과 `refreshToken`이 모두 반환된다
- [x] `logout` 호출 시 서버의 Refresh Token이 무효화된다
- [x] 무효화된 Refresh Token으로 `refresh` 호출 시 `AppError('UNAUTHORIZED', 401)`가 throw된다

**의존성**: BE-04, BE-10
**예상 소요 시간**: 60분

---

### BE-12 Auth 도메인 — Controller 및 Router 구현 ✅ 완료

**설명**

`backend/src/controllers/auth.controller.js`와 `backend/src/routes/auth.routes.js`를 구현한다.

엔드포인트:

- `POST /api/auth/signup` → `signup` (인증 미들웨어 미적용) → 201
- `POST /api/auth/login` → `login` → 200 + `{ data: { accessToken, refreshToken } }`
- `POST /api/auth/logout` → `authenticate` → `logout` → 200
- `POST /api/auth/refresh` → `refresh` (Service 내부에서 Refresh Token 검증) → 200 + `{ data: { accessToken, refreshToken } }`

**완료 조건**

- [x] `POST /api/auth/signup` 요청 시 201 응답과 사용자 정보(비밀번호 해시 제외)가 반환된다
- [x] `POST /api/auth/login` 성공 시 응답 바디에 `accessToken`과 `refreshToken`이 모두 포함된다
- [x] `POST /api/auth/logout`에 `authenticate` 미들웨어가 적용되어 있다
- [x] Controller 함수에 try-catch가 없고 `asyncHandler` 래퍼로 에러가 전파된다

**의존성**: BE-07, BE-08, BE-11
**예상 소요 시간**: 40분

---

### BE-13 User 도메인 — Service, Controller, Router 구현 ✅ 완료

**설명**

`backend/src/services/user.service.js`, `backend/src/controllers/user.controller.js`, `backend/src/routes/user.routes.js`를 구현한다.

엔드포인트:

- `GET /api/users/me` → `authenticate` → `getMe` (비밀번호 필드 제외)
- `PATCH /api/users/me` → `authenticate` → `updateMe` (현재 비밀번호 검증 포함)
- `DELETE /api/users/me` → `authenticate` → `deleteMe` → 204 (비밀번호 검증 후 CASCADE 삭제)

**완료 조건**

- [x] `GET /api/users/me`가 비밀번호 필드를 응답에서 제외하고 반환한다
- [x] `PATCH /api/users/me`에서 비밀번호 변경 시 현재 비밀번호 불일치 시 401이 반환된다
- [x] `DELETE /api/users/me` 성공 시 204 응답과 함께 DB에서 사용자 레코드가 삭제된다
- [x] 3개 라우트 모두에 `authenticate` 미들웨어가 적용되어 있다

**의존성**: BE-07, BE-08, BE-10, BE-11
**예상 소요 시간**: 50분

---

### BE-14 Category 도메인 — Repository 구현 ✅ 완료

**설명**

`backend/src/repositories/category.repository.js`를 구현한다.

구현 함수:

- `findAllByUser(userId)` — 사용자 정의 카테고리 + 기본 카테고리(`user_id IS NULL`) 모두 조회
- `findById(categoryId)`
- `create(input)` — `RETURNING *`
- `removeById(categoryId)`
- `hasTodos(categoryId): Promise<boolean>` — `COUNT(*) FROM todos` 기반
- `existsByNameForUser(name, userId): Promise<boolean>` — 동일 user_id 범위 이름 중복 확인

**완료 조건**

- [x] `findAllByUser`가 기본 카테고리(`user_id IS NULL`)와 사용자 정의 카테고리를 모두 반환한다
- [x] `hasTodos`가 해당 카테고리에 할일이 1건 이상이면 `true`를 반환한다
- [x] `existsByNameForUser`가 동일 user_id 범위 내 이름 중복만 체크한다
- [x] Repository 함수에 `is_default` 체크 로직이 없다 (Service 책임)

**의존성**: BE-03, BE-05, DB-04
**예상 소요 시간**: 30분

---

### BE-15 Category 도메인 — Service, Controller, Router 구현 ✅ 완료

**설명**

`backend/src/services/category.service.js`, `backend/src/controllers/category.controller.js`, `backend/src/routes/category.routes.js`를 구현한다. BR-05(기본 카테고리 수정·삭제 불가)와 BR-08(할일 있는 카테고리 삭제 불가)을 Service에서 검증한다.

엔드포인트:

- `GET /api/categories` → `authenticate` → `getCategories`
- `POST /api/categories` → `authenticate` → `createCategory`
- `DELETE /api/categories/:id` → `authenticate` → `deleteCategory`

삭제 검증 순서: 존재 여부(404) → `is_default` 체크(403, BR-05) → 소유권(403, BR-03) → 할일 존재(409, BR-08) → 삭제

**완료 조건**

- [x] `GET /api/categories` 응답에 기본 카테고리와 사용자 정의 카테고리가 모두 포함된다
- [x] 이름 중복 시 409 `DUPLICATE_CATEGORY`가 반환된다
- [x] 기본 카테고리 삭제 시도 시 403 `DEFAULT_CATEGORY_IMMUTABLE`이 반환된다
- [x] 할일이 존재하는 카테고리 삭제 시도 시 409 `CATEGORY_HAS_TODOS`가 반환된다
- [x] 타인 소유 카테고리 삭제 시도 시 403 `FORBIDDEN`이 반환된다
- [x] 비즈니스 규칙 검증 로직(BR-05, BR-08)이 Service에만 위치한다

**의존성**: BE-07, BE-08, BE-14
**예상 소요 시간**: 50분

---

### BE-16 Todo 도메인 — Repository 구현 ✅ 완료

**설명**

`backend/src/repositories/todo.repository.js`를 구현한다. 동적 필터 조건을 파라미터 바인딩으로 안전하게 처리하며 SQL 문자열 직접 삽입은 금지한다.

구현 함수:

- `findAll(userId, filter: TodoFilter)` — 동적 WHERE절(`category_id`, `from`/`to`, `is_completed`), 기본 정렬 `ORDER BY due_date ASC NULLS LAST`
- `findById(todoId)`
- `create(input)` — `RETURNING *`
- `updateById(todoId, input)` — `updated_at = NOW()` 갱신 포함
- `removeById(todoId)`
- `toggleComplete(todoId)` — `is_completed = NOT is_completed, updated_at = NOW()`

**완료 조건**

- [x] `filter.category_id` 전달 시 해당 카테고리 할일만 반환된다
- [x] `filter.from`·`filter.to` 전달 시 `due_date BETWEEN` 조건이 적용된다
- [x] `filter.is_completed` 전달 시 완료 여부 필터가 적용된다
- [x] 기본 정렬이 `due_date` 오름차순이다
- [x] `toggleComplete`이 현재 `is_completed` 반대 값으로 토글하고 `updated_at`을 갱신한다
- [x] 동적 WHERE절 구성 시 SQL 문자열 직접 삽입이 없다

**의존성**: BE-03, BE-05, DB-04
**예상 소요 시간**: 50분

---

### BE-17 Todo 도메인 — Service, Controller, Router 구현 ✅ 완료

**설명**

`backend/src/services/todo.service.js`, `backend/src/controllers/todo.controller.js`, `backend/src/routes/todo.routes.js`를 구현한다. BR-03(소유권), BR-04(카테고리 필수)를 Service에서 검증한다.

엔드포인트:

- `GET /api/todos` → `authenticate` → `getTodos` (필터 쿼리 파라미터 지원)
- `POST /api/todos` → `authenticate` → `createTodo`
- `GET /api/todos/:id` → `authenticate` → `getTodoById`
- `PATCH /api/todos/:id` → `authenticate` → `updateTodo`
- `DELETE /api/todos/:id` → `authenticate` → `deleteTodo` → 204
- `PATCH /api/todos/:id/complete` → `authenticate` → `toggleComplete`

**완료 조건**

- [x] `GET /api/todos`가 로그인한 사용자의 할일만 반환한다
- [x] `GET /api/todos?category_id=1&is_completed=false` 등 필터 파라미터가 동작한다
- [x] 존재하지 않는 `category_id` 전달 시 404 `RESOURCE_NOT_FOUND`가 반환된다
- [x] 타인 소유 할일 수정 시도 시 403 `FORBIDDEN`이 반환된다
- [x] `PATCH /api/todos/:id/complete` 호출 시 `is_completed`가 토글되고 `updated_at`이 갱신된다
- [x] `DELETE /api/todos/:id` 성공 시 204 응답이 반환된다

**의존성**: BE-07, BE-08, BE-14, BE-16
**예상 소요 시간**: 60분

---

## 3. 프론트엔드 레이어 (FE)

---

### FE-01 프로젝트 초기화 및 환경 설정 ✅ 완료

**설명**

`frontend/` 디렉토리에 Vite + React 19 + TypeScript 프로젝트를 초기화한다.

설치 패키지: `react@19`, `react-dom@19`, `zustand`, `@tanstack/react-query`, `axios`, `react-router-dom`, `typescript`, `eslint`, `@typescript-eslint/eslint-plugin`, `prettier`

생성 파일:

- `vite.config.ts` — 포트 5173 고정, `/api` → `http://localhost:3000` 프록시
- `tsconfig.json` — `strict: true`
- `.env.example` — `VITE_API_BASE_URL=http://localhost:3000/api`
- `.eslintrc.json` — `@typescript-eslint/no-explicit-any: error`

**완료 조건**

- [x] `npm run dev` 실행 시 `http://localhost:5173`에서 앱이 정상 기동된다
- [x] `tsconfig.json`에 `strict: true`가 설정되어 있다
- [x] ESLint 실행 시 `any` 타입 사용에 대해 error가 발생한다
- [x] `zustand`, `@tanstack/react-query`, `axios`, `react-router-dom`이 `package.json`에 등재되어 있다

**의존성**: 없음
**예상 소요 시간**: 1시간

---

### FE-02 전역 타입 및 API 응답 타입 정의 ✅ 완료

**설명**

`frontend/src/types/` 디렉토리에 공통 타입을 정의한다.

- `api.types.ts`: `ApiResponse<T>`, `ApiError`, `ErrorCode` 열거형 9개
- `common.types.ts`: `Nullable<T>`, `Optional<T>` 등 유틸 타입

**완료 조건**

- [x] `ApiResponse<T>`, `ApiError` 타입이 정의되어 있다
- [x] `ErrorCode`가 PRD 섹션 6.2의 9개 에러 코드를 모두 포함한다
- [x] `any` 타입을 사용하지 않는다
- [x] 모든 타입에 명시적 export가 선언되어 있다

**의존성**: FE-01
**예상 소요 시간**: 30분

---

### FE-03 axios 인스턴스 및 토큰 갱신 인터셉터 구성 ✅ 완료

**설명**

`frontend/src/api/axiosInstance.ts`를 구현한다. 요청 인터셉터에서 Zustand authStore의 `accessToken`을 `Authorization: Bearer` 헤더에 자동 주입하고, 응답 인터셉터에서 401 수신 시 `POST /auth/refresh`로 토큰을 재발급한 뒤 원래 요청을 재시도한다. refresh 실패 시 `clearAuth()` 호출 후 `/login`으로 이동한다.

**완료 조건**

- [x] `axiosInstance`의 `baseURL`이 `VITE_API_BASE_URL` 환경변수로 설정된다
- [x] 요청 인터셉터가 `Authorization: Bearer <accessToken>` 헤더를 자동 주입한다
- [x] 401 응답 시 `POST /auth/refresh`가 자동 호출된다 (`_retry` 무한 루프 방지 포함)
- [x] refresh 성공 시 새 토큰으로 원래 요청이 재시도된다
- [x] refresh 실패 시 Zustand auth 상태가 초기화되고 `/login`으로 이동한다
- [x] `any` 타입을 사용하지 않는다 (`AxiosError` 타입 사용)

**의존성**: FE-02, FE-04
**예상 소요 시간**: 1시간

---

### FE-04 Zustand authStore 구성 ✅ 완료

**설명**

`frontend/src/store/authStore.ts`를 구현한다. 인증 토큰과 사용자 정보만 보관하며 `persist` 미들웨어를 사용하지 않는다(페이지 새로고침 시 소멸 — 의도된 동작).

상태: `accessToken: string | null`, `refreshToken: string | null`, `user: AuthUser | null`
액션: `setTokens(accessToken, refreshToken)`, `setUser(user)`, `clearAuth()`

`frontend/src/store/uiStore.ts`: 모달 open/close 상태, 토스트 큐 관리

**완료 조건**

- [x] `authStore`가 `accessToken`, `refreshToken`, `user` 상태를 가진다
- [x] `setTokens()`, `setUser()`, `clearAuth()` 액션이 구현되어 있다
- [x] `persist` 미들웨어가 사용되지 않는다 (localStorage 저장 없음)
- [x] `uiStore`가 모달 상태와 토스트 큐를 관리한다

**의존성**: FE-02
**예상 소요 시간**: 45분

---

### FE-05 TanStack Query 클라이언트 설정 ✅ 완료

**설명**

`frontend/src/App.tsx`에 `QueryClient`를 설정하고 `QueryClientProvider`로 주입한다. `staleTime: 30000`, `retry: 1`, 전역 `onError` 콜백(401 시 `clearAuth()`)을 설정한다.

**완료 조건**

- [x] `QueryClientProvider`가 컴포넌트 트리의 최상위에 위치한다
- [x] `staleTime`이 설정되어 있다
- [x] `retry` 횟수가 명시적으로 설정되어 있다

**의존성**: FE-01
**예상 소요 시간**: 30분

---

### FE-06 유틸리티 함수 구현 ✅ 완료

**설명**

`frontend/src/utils/` 디렉토리에 순수 함수를 구현한다.

- `date.ts`: `formatDate(dateString)`, `isOverdue(dueDateString)`, `isPastDate(dateString)`, `getTodayString()`
- `errorMessage.ts`: `getErrorMessage(code: ErrorCode | string) → string` — 9개 에러 코드 → 한국어 사용자 메시지 변환

**완료 조건**

- [x] `isOverdue()`가 오늘 날짜 기준으로 정확히 동작한다
- [x] `getErrorMessage()`가 9개 에러 코드를 모두 한국어 메시지로 변환한다
- [x] 모든 함수의 반환 타입이 명시적으로 선언되어 있다

**의존성**: FE-02
**예상 소요 시간**: 45분

---

### FE-07 공통 UI 컴포넌트 구현 ✅ 완료

**설명**

`frontend/src/components/` 디렉토리에 재사용 UI 컴포넌트를 구현한다. 모든 컴포넌트는 도메인 타입을 import하지 않고 props만 사용하며 Mobile First CSS를 적용한다.

구현 컴포넌트:

- `Button.tsx` — `variant: 'primary' | 'secondary' | 'danger'`, `isLoading`
- `Input.tsx` — `label`, `error` (에러 메시지 하단 표시)
- `Modal.tsx` — `isOpen`, `onClose`, ESC 키·배경 클릭으로 닫힘
- `Spinner.tsx` — CSS 애니메이션 기반 로딩
- `ErrorMessage.tsx` — `message: string | null` (null이면 렌더링 안 함)
- `Badge.tsx` — `isCompleted: boolean` (완료: 초록, 미완료: 회색)

**완료 조건**

- [x] 6개 컴포넌트 파일이 `frontend/src/components/` 경로에 생성된다
- [x] `Button` 컴포넌트의 3가지 variant가 시각적으로 구별된다
- [x] `Modal` 컴포넌트가 ESC 키와 배경 클릭으로 닫힌다
- [x] 모든 컴포넌트가 도메인 타입을 import하지 않는다
- [x] 모바일 뷰(375px)에서 레이아웃이 깨지지 않는다

**의존성**: FE-01
**예상 소요 시간**: 1시간 30분

---

### FE-08 라우팅 구성 및 보호 라우트 구현 ✅ 완료

**설명**

`frontend/src/router.tsx`에 React Router 라우트를 정의하고, `ProtectedRoute` 컴포넌트로 인증이 필요한 경로를 보호한다. `authStore.accessToken` 유무로 인증 여부를 판단한다.

라우트:

- `/login`, `/signup` — 비인증 접근 가능 (인증 상태면 `/`로 리다이렉트)
- `/` → `TodoListPage`, `/categories` → `CategoryPage`, `/profile` → `ProfilePage` (ProtectedRoute)
- 없는 경로 → `/`로 리다이렉트

**완료 조건**

- [x] `/`, `/categories`, `/profile`에 비인증 접근 시 `/login`으로 리다이렉트된다
- [x] 로그인 상태에서 `/login` 접근 시 `/`로 리다이렉트된다
- [x] `ProtectedRoute`가 `authStore.accessToken` 기준으로 인증을 판단한다

**의존성**: FE-04
**예상 소요 시간**: 1시간

---

### FE-09 인증 도메인 API 함수 및 타입 구현

**설명**

`frontend/src/features/auth/types/auth.types.ts`와 `frontend/src/api/auth.api.ts`를 구현한다.

타입: `LoginRequest`, `SignupRequest`, `AuthTokens`, `AuthUser`, `UpdateProfileRequest`, `DeleteAccountRequest`

API 함수: `login`, `signup`, `logout`, `refreshAccessToken`, `getMe`, `updateMe`, `deleteMe`

**완료 조건**

- [x] 모든 타입이 PRD 엔드포인트 스펙과 일치한다
- [x] 모든 함수가 `axiosInstance`를 사용한다 (직접 axios import 금지)
- [x] `any` 타입을 사용하지 않는다

**의존성**: FE-03
**예상 소요 시간**: 30분

---

### FE-10 인증 Feature 구현 (로그인·회원가입 폼 + Hook) ✅ 완료

**설명**

`frontend/src/features/auth/hooks/useAuth.ts`, `LoginForm.tsx`, `SignupForm.tsx`를 구현한다.

- `useLogin()` — 성공 시 `setTokens()` + `setUser()` → `/`로 이동
- `useSignup()` — 성공 시 `/login`으로 이동
- `useLogout()` — 성공/실패 무관하게 `clearAuth()` → `/login`으로 이동 (S-11 대안 흐름)
- `useDeleteAccount()` — 성공 시 `clearAuth()` → `/signup`으로 이동

**완료 조건**

- [x] 로그인 성공 시 `authStore`에 `accessToken`과 `refreshToken`이 저장된다
- [x] 이메일·비밀번호 미입력 시 클라이언트 단에서 오류 메시지가 표시된다
- [x] 잘못된 자격증명(401) 시 서버 에러 메시지가 폼에 표시된다
- [x] 이메일 중복(409) 시 "이미 사용 중인 이메일입니다." 메시지가 표시된다
- [x] 제출 중 버튼이 `isLoading` 상태가 되어 중복 클릭이 방지된다
- [x] 로그아웃 시 서버 오류 여부와 무관하게 `authStore`가 초기화된다

**의존성**: FE-07, FE-09
**예상 소요 시간**: 2시간

---

### FE-11 인증 Page 구성 (LoginPage, SignupPage) ✅ 완료

**설명**

`frontend/src/pages/LoginPage.tsx`와 `SignupPage.tsx`를 구현한다. 레이아웃 조합과 Feature 컴포넌트 마운팅만 담당하며, 페이지 간 링크(로그인 ↔ 회원가입)를 포함한다.

**완료 조건**

- [x] `/login` 접근 시 `LoginForm`이 표시된다
- [x] `/signup` 접근 시 `SignupForm`이 표시된다
- [x] 페이지 간 링크 이동이 동작한다
- [x] 모바일 뷰에서 폼이 중앙 정렬된다

**의존성**: FE-08, FE-10
**예상 소요 시간**: 30분

---

### FE-12 카테고리 도메인 API·타입·Hook 구현 ✅ 완료

**설명**

`frontend/src/features/category/types/category.types.ts`, `frontend/src/api/category.api.ts`, `useCategoryList.ts`, `useCategoryMutations.ts`를 구현한다.

- `useCategoryList`: `useQuery(['categories'])`
- `useCreateCategory`: 성공 시 `['categories']` 캐시 무효화
- `useDeleteCategory`: 성공 시 `['categories']`와 `['todos']` 캐시 무효화

**완료 조건**

- [x] `Category` 타입이 DB 스키마 `categories` 테이블 컬럼과 일치한다
- [x] `useCategoryList`가 TanStack Query `useQuery`로 구현되어 캐시가 동작한다
- [x] 카테고리 생성/삭제 후 `['categories']` 쿼리 캐시가 무효화된다
- [x] 카테고리 삭제 후 `['todos']` 쿼리 캐시도 무효화된다

**의존성**: FE-03
**예상 소요 시간**: 1시간

---

### FE-13 할일 도메인 API·타입·Hook 구현 ✅ 완료

**설명**

`frontend/src/features/todo/types/todo.types.ts`, `frontend/src/api/todo.api.ts`, `useTodoList.ts`, `useTodoMutations.ts`, `useTodoFilter.ts`를 구현한다.

- `useTodoList(filter)`: `queryKey: ['todos', filter]` — 필터 변경 시 자동 재요청
- `useTodoFilter`: `from > to` 조건 시 "시작일이 종료일보다 늦을 수 없습니다." 에러 반환

**완료 조건**

- [x] `Todo` 타입이 DB 스키마 `todos` 테이블 컬럼과 일치한다
- [x] `getTodos(filter)`가 필터를 쿼리 스트링으로 올바르게 직렬화한다 (`undefined` 필터는 전송하지 않음)
- [x] 모든 mutation 성공 시 `['todos']` 캐시가 무효화된다
- [x] `useTodoFilter`에서 `from > to` 조건 시 에러 메시지가 반환된다

**의존성**: FE-03, FE-12
**예상 소요 시간**: 1시간 30분

---

### FE-14 할일 Feature 컴포넌트 및 Page 구현 ✅ 완료

**설명**

MVP의 핵심 화면. `frontend/src/features/todo/components/`에 `TodoFilter.tsx`, `TodoList.tsx`, `TodoItem.tsx`, `TodoForm.tsx`를 구현하고, `frontend/src/pages/TodoListPage.tsx`에서 조합한다.

주요 동작:

- `TodoFilter`: 카테고리·완료여부·기간 필터 UI
- `TodoItem`: 완료 체크박스 토글(S-07), 수정 모달 열기, 삭제 확인 다이얼로그(S-06)
- `TodoForm`: 등록/수정 공통 폼, 오늘 이전 날짜 입력 시 안내 메시지(BR-06, 저장 차단 없음)
- `TodoListPage`: "할일 추가" 버튼, 헤더·네비게이션

**완료 조건**

- [x] 페이지 진입 시 필터 없이 전체 할일이 종료 예정일 오름차순으로 표시된다
- [x] 카테고리·완료여부·기간 필터가 모두 정상 동작한다
- [x] 기간 필터에서 `from > to` 입력 시 오류 메시지가 표시된다
- [x] 완료 체크박스 클릭 시 즉시 UI가 업데이트되고 서버에 toggle 요청이 전송된다
- [x] 할일 등록/수정 성공 시 모달이 닫히고 목록이 갱신된다
- [x] 할일 수정 폼에 기존 값이 미리 채워진다
- [x] 삭제 확인 다이얼로그에서 "취소" 클릭 시 삭제되지 않는다
- [x] 목록이 비어 있을 때 "등록된 할일이 없습니다." 메시지가 표시된다
- [x] 오늘 이전 종료 예정일 입력 시 권장 안내 메시지가 표시되되 저장은 가능하다
- [x] 모바일 화면(375px)에서 레이아웃이 깨지지 않는다

**의존성**: FE-07, FE-13
**예상 소요 시간**: 2시간 30분

---

### FE-15 카테고리 Feature 컴포넌트 및 Page 구현 ✅ 완료

**설명**

`frontend/src/features/category/components/CategoryList.tsx`, `CategoryForm.tsx`와 `frontend/src/pages/CategoryPage.tsx`를 구현한다.

- `CategoryList`: `is_default: true` 항목에 삭제 버튼 비표시/비활성화(BR-05)
- `CategoryForm`: 이름 중복(409) 에러 메시지, 성공 시 입력 필드 초기화

**완료 조건**

- [x] 기본 카테고리에 삭제 버튼이 표시되지 않거나 비활성화된다
- [x] 카테고리 추가 성공 시 목록이 즉시 갱신된다
- [x] 이름 중복(409) 시 오류 메시지가 표시된다
- [x] 할일이 있는 카테고리 삭제 시도(409) 시 오류 메시지가 표시된다
- [x] 삭제 확인 다이얼로그에서 "취소" 클릭 시 삭제되지 않는다
- [x] 추가 성공 후 입력 필드가 초기화된다

**의존성**: FE-07, FE-12
**예상 소요 시간**: 1시간

---

### FE-16 프로필 Feature 구현 (ProfilePage, 개인정보 수정, 회원 탈퇴) ✅ 완료

**설명**

`frontend/src/pages/ProfilePage.tsx`를 구현한다. `GET /users/me`로 현재 사용자 정보를 불러와 이름/비밀번호 변경 폼에 미리 채운다. 회원 탈퇴 섹션에서 확인 모달 표시 후 `DELETE /users/me` 호출 → 성공 시 `clearAuth()` → `/signup`으로 이동.

**완료 조건**

- [x] 페이지 진입 시 현재 사용자 이름이 이름 필드에 미리 채워진다
- [x] 이름 변경 성공 시 `authStore.user.name`이 업데이트된다
- [x] 비밀번호 변경 시 현재 비밀번호 불일치(401) 오류 메시지가 표시된다
- [x] 변경 항목 없이 저장 시도 시 클라이언트 유효성 오류가 표시된다
- [x] 회원 탈퇴 경고 모달에서 "취소" 클릭 시 탈퇴되지 않는다
- [x] 탈퇴 성공 시 `authStore`가 초기화되고 `/signup`으로 이동한다

**의존성**: FE-07, FE-09, FE-10
**예상 소요 시간**: 1시간 30분

---

## 4. 병렬 진행 권장 순서

### Day 1 — 기반 인프라

| 병렬 그룹 | Task                        | 담당 |
| --------- | --------------------------- | ---- |
| **순차**  | DB-01(로컬 DB 생성) → DB-02 | DB   |
| **순차**  | BE-01 → BE-02, BE-03 (병렬) | BE   |
| **동시**  | FE-01                       | FE   |

| 병렬 그룹 | Task                                                          |
| --------- | ------------------------------------------------------------- |
| **동시**  | DB-03, DB-04, BE-04, BE-05, FE-02                             |
| **동시**  | DB-05, DB-06, DB-08, BE-06, FE-03, FE-04, FE-05, FE-06, FE-07 |

### Day 2 — 도메인 구현

| 병렬 그룹 | Task                                                  |
| --------- | ----------------------------------------------------- |
| **동시**  | DB-07, BE-07, BE-08, BE-09(완료), FE-08               |
| **동시**  | BE-10, BE-14, BE-16, FE-09, FE-12                     |
| **동시**  | BE-11, BE-15, BE-17(BE-14 후), FE-10, FE-13(FE-12 후) |

### Day 3 — 화면 구현 및 통합

| 병렬 그룹 | Task                                     |
| --------- | ---------------------------------------- |
| **동시**  | BE-12, BE-13, FE-11, FE-14, FE-15, FE-16 |
| **순차**  | 통합 테스트 → 버그 수정                  |

---

## 5. Task 요약표

### 데이터베이스

| Task ID  | Task 이름                                    | 의존성              | 예상 시간    |
| -------- | -------------------------------------------- | ------------------- | ------------ |
| DB-01    | 로컬 DB 생성 (todolist_db, todolist_test_db) | 없음                | 10분         |
| DB-02    | 환경변수 구성                                | DB-01               | 15분         |
| DB-03    | pg Pool 모듈 구현                            | DB-02               | 30분         |
| DB-04    | 마이그레이션 스크립트 구현                   | DB-01, DB-02        | 30분         |
| DB-05    | 시드 데이터 검증                             | DB-04               | 20분         |
| DB-06    | 인덱스·트리거 검증                           | DB-04               | 20분         |
| DB-07    | 테스트 DB 격리 환경 구성                     | DB-01, DB-03, DB-04 | 45분         |
| DB-08    | pg Pool 에러핸들링 통합                      | DB-03               | 30분         |
| **소계** |                                              |                     | **약 3시간** |

### 백엔드

| Task ID  | Task 이름                         | 의존성                     | 예상 시간         |
| -------- | --------------------------------- | -------------------------- | ----------------- |
| BE-01    | 프로젝트 초기화                   | 없음                       | 30분              |
| BE-02    | 환경변수 모듈                     | BE-01                      | 20분              |
| BE-03    | AppError 클래스 및 에러 코드 상수 | BE-01                      | 20분              |
| BE-04    | 공통 유틸리티 함수                | BE-02, BE-03               | 40분              |
| BE-05    | pg Pool 모듈                      | BE-02                      | 20분              |
| BE-06    | Express 서버 진입점               | BE-02, BE-05               | 20분              |
| BE-07    | 공통 에러 처리 미들웨어           | BE-03, BE-06               | 30분              |
| BE-08    | authenticate 미들웨어             | BE-03, BE-04, BE-07        | 30분              |
| BE-09    | DB 스키마 SQL                     | —                          | ✅ 완료           |
| BE-10    | User Repository                   | BE-03, BE-05, DB-04        | 30분              |
| BE-11    | Auth Service                      | BE-04, BE-10               | 60분              |
| BE-12    | Auth Controller·Router            | BE-07, BE-08, BE-11        | 40분              |
| BE-13    | User Controller·Router            | BE-07, BE-08, BE-10, BE-11 | 50분              |
| BE-14    | Category Repository               | BE-03, BE-05, DB-04        | 30분              |
| BE-15    | Category Controller·Router        | BE-07, BE-08, BE-14        | 50분              |
| BE-16    | Todo Repository                   | BE-03, BE-05, DB-04        | 50분              |
| BE-17    | Todo Controller·Router            | BE-07, BE-08, BE-14, BE-16 | 60분              |
| **소계** |                                   |                            | **약 9시간 30분** |

### 프론트엔드

| Task ID  | Task 이름               | 의존성              | 예상 시간     |
| -------- | ----------------------- | ------------------- | ------------- |
| FE-01    | 프로젝트 초기화         | 없음                | 1시간         |
| FE-02    | 전역 타입 정의          | FE-01               | 30분          |
| FE-03    | axios 인스턴스·인터셉터 | FE-02, FE-04        | 1시간         |
| FE-04    | Zustand authStore       | FE-02               | 45분          |
| FE-05    | TanStack Query 설정     | FE-01               | 30분          |
| FE-06    | 유틸리티 함수           | FE-02               | 45분          |
| FE-07    | 공통 UI 컴포넌트        | FE-01               | 1시간 30분    |
| FE-08    | 라우팅·보호 라우트      | FE-04               | 1시간         |
| FE-09    | 인증 API·타입           | FE-03               | 30분          |
| FE-10    | 인증 Feature (폼·Hook)  | FE-07, FE-09        | 2시간         |
| FE-11    | 인증 Page               | FE-08, FE-10        | 30분          |
| FE-12    | 카테고리 API·Hook       | FE-03               | 1시간         |
| FE-13    | 할일 API·Hook           | FE-03, FE-12        | 1시간 30분    |
| FE-14    | 할일 Feature·Page       | FE-07, FE-13        | 2시간 30분    |
| FE-15    | 카테고리 Feature·Page   | FE-07, FE-12        | 1시간         |
| FE-16    | 프로필 Feature·Page     | FE-07, FE-09, FE-10 | 1시간 30분    |
| **소계** |                         |                     | **약 17시간** |
