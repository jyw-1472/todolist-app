# TodoListApp 프론트엔드 통합 가이드

**버전:** 1.0  
**작성일:** 2026-05-14  
**참조 문서:** `2-prd.md`, `4-project-principles.md`, `swagger/swagger.json`

> 이 문서는 백엔드 API 서버와 프론트엔드를 연동하기 위한 실제 구현 기준 가이드이다.  
> Swagger UI: `http://localhost:3000/api-docs`

---

## 1. 서버 기본 정보

| 항목 | 값 |
|------|----|
| Base URL | `http://localhost:3000/api` |
| Content-Type | `application/json` |
| 인증 방식 | `Authorization: Bearer <accessToken>` |
| API 문서 | `http://localhost:3000/api-docs` |

---

## 2. 표준 응답 구조

### 2-1. 성공 응답

**단건 / 생성 / 수정:**
```json
{ "data": { "todo_id": 1, "title": "보고서 작성", "is_completed": false } }
```

**목록:**
```json
{ "data": [ { "todo_id": 1, "title": "보고서 작성" } ] }
```

**삭제 성공:** `204 No Content` — 응답 바디 없음

### 2-2. 에러 응답

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "할일을 찾을 수 없습니다."
  }
}
```

### 2-3. 에러 코드 전체 목록

| 코드 | HTTP 상태 | 발생 상황 |
|------|----------|----------|
| `VALIDATION_ERROR` | 400 | 필수 필드 누락, 타입 오류 |
| `UNAUTHORIZED` | 401 | 토큰 없음·만료, 비밀번호 불일치 |
| `FORBIDDEN` | 403 | 타인 소유 리소스 접근, 기본 카테고리 삭제 시도 |
| `RESOURCE_NOT_FOUND` | 404 | 존재하지 않는 리소스 |
| `DUPLICATE_EMAIL` | 409 | 이미 사용 중인 이메일 (회원가입) |
| `DUPLICATE_CATEGORY` | 409 | 동일 사용자 범위 카테고리 이름 중복 |
| `CATEGORY_HAS_TODOS` | 409 | 할일이 있는 카테고리 삭제 시도 |
| `DEFAULT_CATEGORY_IMMUTABLE` | 403 | 기본 카테고리 삭제 시도 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

---

## 3. 인증 (Auth)

### 3-1. 토큰 관리 방식

| 토큰 | 만료 | 저장 위치 | 전달 방식 |
|------|------|----------|---------|
| Access Token | 15분 | Zustand 메모리 | `Authorization: Bearer` 헤더 |
| Refresh Token | 7일 | Zustand 메모리 | `Authorization: Bearer` 헤더 (갱신 요청 시) / `req.body` (로그아웃 시) |

> 메모리 저장이므로 페이지 새로고침 시 소멸 → 재로그인 필요 (의도된 동작)

### 3-2. 토큰 로테이션

`POST /api/auth/refresh` 호출 시:
- 서버가 기존 Refresh Token을 블랙리스트에 추가하여 무효화
- 새 Access Token + 새 Refresh Token 쌍을 발급
- 무효화된 Refresh Token으로 재갱신 시도 시 401 반환

### 3-3. axios 인터셉터 구현 예시

```typescript
// api/axiosInstance.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://localhost:3000/api
});

// 요청 인터셉터 — Access Token 자동 주입
axiosInstance.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 응답 인터셉터 — 401 시 토큰 자동 갱신
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axiosInstance.post('/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        // 토큰 로테이션: 새 토큰 쌍 저장
        useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
        error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axiosInstance(error.config);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

---

## 4. API 엔드포인트 상세

### 4-1. 인증 API

#### POST /api/auth/signup — 회원가입

- 인증 불필요

**요청 바디:**
```json
{ "email": "user@example.com", "password": "Password123!", "name": "홍길동" }
```

**성공 (201):**
```json
{
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "provider": "local",
    "created_at": "2026-05-14T09:00:00.000Z"
  }
}
```

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| 필수 필드 누락 | `VALIDATION_ERROR` | 400 |
| 이메일 중복 | `DUPLICATE_EMAIL` | 409 |

---

#### POST /api/auth/login — 로그인

- 인증 불필요

**요청 바디:**
```json
{ "email": "user@example.com", "password": "Password123!" }
```

**성공 (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "name": "홍길동",
      "provider": "local",
      "created_at": "2026-05-14T09:00:00.000Z"
    }
  }
}
```

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| 필수 필드 누락 | `VALIDATION_ERROR` | 400 |
| 이메일 없음 또는 비밀번호 불일치 | `UNAUTHORIZED` | 401 |

> 보안상 "이메일 없음"과 "비밀번호 불일치"를 동일한 메시지로 응답한다.

---

#### POST /api/auth/logout — 로그아웃

- 인증 필요 (`Authorization: Bearer <accessToken>`)

**요청 바디:**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

**성공 (200):**
```json
{ "data": null }
```

> `refreshToken`을 바디에 담아 전송해야 서버 블랙리스트에 등록된다.  
> 바디가 없어도 200이 반환되므로, 클라이언트는 반드시 `clearAuth()`를 호출해야 한다.

---

#### POST /api/auth/refresh — Access Token 갱신

- 인증: `Authorization: Bearer <refreshToken>` (Refresh Token을 헤더로 전달)
- 요청 바디 없음

**성공 (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| 헤더 없음 | `UNAUTHORIZED` | 401 |
| 토큰 만료·서명 오류 | `UNAUTHORIZED` | 401 |
| 이미 무효화된 Refresh Token | `UNAUTHORIZED` | 401 |

> 갱신 성공 시 기존 Refresh Token은 무효화된다. 반드시 새로 받은 토큰 쌍을 저장해야 한다.

---

### 4-2. 사용자 API

모든 엔드포인트에 `Authorization: Bearer <accessToken>` 헤더 필요.

**User 객체 (응답에서 password 필드는 항상 제외됨):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "홍길동",
  "provider": "local",
  "created_at": "2026-05-14T09:00:00.000Z"
}
```

---

#### GET /api/users/me — 내 정보 조회

**성공 (200):**
```json
{ "data": { /* User 객체 */ } }
```

---

#### PATCH /api/users/me — 내 정보 수정

**요청 바디 (name 또는 newPassword 중 하나 이상 필수):**
```json
{
  "name": "새이름",
  "currentPassword": "OldPassword1!",
  "newPassword": "NewPassword1!"
}
```

| 수정 항목 | 필요 필드 |
|----------|---------|
| 이름만 변경 | `name` |
| 비밀번호만 변경 | `currentPassword` + `newPassword` |
| 이름 + 비밀번호 동시 변경 | `name` + `currentPassword` + `newPassword` |

**성공 (200):**
```json
{ "data": { /* 수정된 User 객체 */ } }
```

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| name, newPassword 모두 없음 | `VALIDATION_ERROR` | 400 |
| newPassword만 있고 currentPassword 없음 | `VALIDATION_ERROR` | 400 |
| 현재 비밀번호 불일치 | `UNAUTHORIZED` | 401 |

---

#### DELETE /api/users/me — 회원 탈퇴

**요청 바디:**
```json
{ "password": "Password123!" }
```

**성공:** `204 No Content`

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| password 미입력 | `VALIDATION_ERROR` | 400 |
| 비밀번호 불일치 | `UNAUTHORIZED` | 401 |

> 탈퇴 성공 시 users, todos, 사용자 정의 categories 데이터가 CASCADE로 즉시 삭제된다.  
> 클라이언트는 `clearAuth()` 후 `/signup`으로 이동해야 한다.

---

### 4-3. 카테고리 API

모든 엔드포인트에 `Authorization: Bearer <accessToken>` 헤더 필요.

**Category 객체:**
```json
{
  "category_id": 1,
  "user_id": null,
  "name": "전체",
  "is_default": true
}
```

| 카테고리 종류 | `user_id` | `is_default` |
|-------------|----------|-------------|
| 기본 카테고리 (전체) | `null` | `true` |
| 시스템 카테고리 (업무·개인·쇼핑·기타) | `null` | `false` |
| 사용자 정의 카테고리 | 사용자 ID | `false` |

---

#### GET /api/categories — 카테고리 목록 조회

**성공 (200):**
```json
{
  "data": [
    { "category_id": 1, "user_id": null, "name": "전체", "is_default": true },
    { "category_id": 2, "user_id": null, "name": "업무", "is_default": false },
    { "category_id": 6, "user_id": 3, "name": "스터디", "is_default": false }
  ]
}
```

> 기본·시스템 카테고리와 사용자 정의 카테고리가 `category_id` 오름차순으로 함께 반환된다.

---

#### POST /api/categories — 카테고리 생성

**요청 바디:**
```json
{ "name": "스터디" }
```

**성공 (201):**
```json
{ "data": { "category_id": 6, "user_id": 3, "name": "스터디", "is_default": false } }
```

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| name 없음 | `VALIDATION_ERROR` | 400 |
| 사용자 범위 내 이름 중복 | `DUPLICATE_CATEGORY` | 409 |

> 사용자 범위 내 중복만 검사한다. 시스템 카테고리(업무·개인 등)와 같은 이름은 생성 가능하다.

---

#### DELETE /api/categories/:id — 카테고리 삭제

**성공:** `204 No Content`

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| 카테고리 없음 | `RESOURCE_NOT_FOUND` | 404 |
| 기본/시스템 카테고리 (`user_id IS NULL`) | `DEFAULT_CATEGORY_IMMUTABLE` | 403 |
| 타인 소유 카테고리 | `FORBIDDEN` | 403 |
| 카테고리에 할일 존재 | `CATEGORY_HAS_TODOS` | 409 |

> 삭제 전 할일을 모두 다른 카테고리로 이동하거나 삭제해야 한다.

---

### 4-4. 할일 API

모든 엔드포인트에 `Authorization: Bearer <accessToken>` 헤더 필요.

**Todo 객체:**
```json
{
  "todo_id": 1,
  "user_id": 3,
  "category_id": 2,
  "title": "보고서 작성",
  "description": "Q2 성과 보고서",
  "due_date": "2026-05-20",
  "is_completed": false,
  "created_at": "2026-05-14T09:00:00.000Z",
  "updated_at": "2026-05-14T09:00:00.000Z"
}
```

---

#### GET /api/todos — 할일 목록 조회

**쿼리 파라미터 (모두 선택):**

| 파라미터 | 타입 | 예시 | 설명 |
|---------|------|------|------|
| `category_id` | 숫자 | `?category_id=2` | 특정 카테고리 필터 |
| `from` | YYYY-MM-DD | `?from=2026-05-01` | due_date 시작 범위 |
| `to` | YYYY-MM-DD | `?to=2026-05-31` | due_date 종료 범위 |
| `is_completed` | `"true"` \| `"false"` | `?is_completed=false` | 완료 여부 필터 |

> `is_completed`는 문자열 `"true"` 또는 `"false"`로 전달해야 한다.

**복합 필터 예시:**
```
GET /api/todos?category_id=2&is_completed=false&from=2026-05-01&to=2026-05-31
```

**성공 (200):**
```json
{ "data": [ /* Todo 객체 배열 */ ] }
```

> 정렬: `due_date ASC NULLS LAST` (종료 예정일 오름차순, null은 마지막)  
> 본인 소유 할일만 반환된다.

---

#### POST /api/todos — 할일 생성

**요청 바디:**
```json
{
  "category_id": 2,
  "title": "보고서 작성",
  "description": "Q2 성과 보고서",
  "due_date": "2026-05-20"
}
```

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `category_id` | 필수 | 숫자 | 유효한 카테고리 ID |
| `title` | 필수 | 문자열 | 할일 제목 |
| `description` | 선택 | 문자열 | 상세 설명 |
| `due_date` | 선택 | YYYY-MM-DD | 종료 예정일 (과거 날짜도 허용, 저장 차단 없음) |

**성공 (201):**
```json
{ "data": { /* 생성된 Todo 객체 */ } }
```

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| title 또는 category_id 없음 | `VALIDATION_ERROR` | 400 |
| 존재하지 않는 category_id | `RESOURCE_NOT_FOUND` | 404 |

---

#### GET /api/todos/:id — 할일 단건 조회

**성공 (200):**
```json
{ "data": { /* Todo 객체 */ } }
```

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| 유효하지 않은 ID (숫자 아님) | `VALIDATION_ERROR` | 400 |
| 할일 없음 | `RESOURCE_NOT_FOUND` | 404 |
| 타인 소유 할일 | `FORBIDDEN` | 403 |

---

#### PATCH /api/todos/:id — 할일 수정

**요청 바디 (모든 필드 선택, 하나 이상 포함):**
```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "due_date": "2026-05-25",
  "category_id": 3
}
```

**성공 (200):**
```json
{ "data": { /* 수정된 Todo 객체 */ } }
```

> `updated_at`이 자동으로 현재 시각으로 갱신된다.

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| 할일 없음 | `RESOURCE_NOT_FOUND` | 404 |
| 타인 소유 할일 | `FORBIDDEN` | 403 |
| 존재하지 않는 category_id | `RESOURCE_NOT_FOUND` | 404 |

---

#### DELETE /api/todos/:id — 할일 삭제

**성공:** `204 No Content`

**에러:**
| 상황 | 코드 | HTTP |
|------|------|------|
| 할일 없음 | `RESOURCE_NOT_FOUND` | 404 |
| 타인 소유 할일 | `FORBIDDEN` | 403 |

---

#### PATCH /api/todos/:id/complete — 완료 상태 토글

- 요청 바디 없음

**성공 (200):**
```json
{
  "data": {
    "todo_id": 1,
    "is_completed": true,
    "updated_at": "2026-05-14T10:30:00.000Z"
  }
}
```

> `is_completed`가 현재 값의 반대로 토글되고 `updated_at`이 갱신된다.  
> 완료 취소도 동일 엔드포인트로 처리한다.

---

## 5. 주요 비즈니스 규칙 (프론트엔드 관련)

| 규칙 | 처리 방식 |
|------|---------|
| BR-03: 본인 소유 데이터만 접근 | 403 `FORBIDDEN` → 목록에서 제거하거나 오류 메시지 표시 |
| BR-05: 기본 카테고리 삭제 불가 | `is_default: true` 또는 `user_id: null` 인 경우 삭제 버튼 비표시 |
| BR-06: due_date 과거 날짜 허용 | 서버는 저장을 막지 않음. 클라이언트에서 권장 안내 메시지만 표시 |
| BR-07: 완료 취소 가능 | 완료된 할일도 목록에 표시, 동일 토글 엔드포인트로 취소 |
| BR-08: 할일 있는 카테고리 삭제 불가 | 409 `CATEGORY_HAS_TODOS` → "할일을 먼저 삭제하세요." 안내 |

---

## 6. 주의사항 및 엣지 케이스

### 6-1. 회원 탈퇴 후 토큰 재사용

탈퇴 후 기존 Access Token으로 `GET /api/users/me` 요청 시 **401이 아닌 404**가 반환된다.  
(미들웨어는 토큰 유효성만 검증하므로 통과하지만, 서비스 레이어에서 사용자 없음으로 처리)

→ 탈퇴 API 성공 즉시 `clearAuth()`를 호출하여 토큰을 파기해야 한다.

### 6-2. is_completed 필터 타입

`is_completed` 쿼리 파라미터는 반드시 **문자열** `"true"` 또는 `"false"`로 전달해야 한다.  
boolean 타입 `true`를 그대로 전달하면 axios가 `"true"` 문자열로 직렬화하므로 정상 동작한다.  
undefined인 경우 필터를 전달하지 않아야 한다.

```typescript
// ✅ 올바른 필터 직렬화
const params = {
  ...(filter.category_id !== undefined && { category_id: filter.category_id }),
  ...(filter.from && { from: filter.from }),
  ...(filter.to && { to: filter.to }),
  ...(filter.is_completed !== undefined && { is_completed: String(filter.is_completed) }),
};
```

### 6-3. 로그아웃 시 서버 오류 처리

로그아웃 API가 실패하더라도 클라이언트는 반드시 `clearAuth()`를 호출해야 한다.  
서버에서 Refresh Token 블랙리스트 등록에 실패해도 클라이언트 상태를 초기화하는 것이 우선이다.

```typescript
// ✅ 서버 오류 무관하게 clearAuth 호출
async function logout() {
  try {
    const refreshToken = useAuthStore.getState().refreshToken;
    await axiosInstance.post('/auth/logout', { refreshToken });
  } finally {
    useAuthStore.getState().clearAuth();
    navigate('/login');
  }
}
```

### 6-4. 토큰 갱신 경쟁 조건 (Race Condition)

여러 API 요청이 동시에 401을 받아 `POST /auth/refresh`를 중복 호출하면 두 번째 요청부터 무효화된 토큰으로 갱신을 시도하여 실패한다.  
인터셉터에서 갱신 중 플래그(`isRefreshing`)와 대기 큐 패턴으로 처리하는 것을 권장한다.

```typescript
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

// 갱신 중이면 큐에 추가, 갱신 완료 후 일괄 처리
axiosInstance.interceptors.response.use(null, async (error) => {
  if (error.response?.status !== 401 || error.config._retry) {
    return Promise.reject(error);
  }
  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingQueue.push((newToken) => {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        resolve(axiosInstance(error.config));
      });
    });
  }
  isRefreshing = true;
  error.config._retry = true;
  try {
    const refreshToken = useAuthStore.getState().refreshToken;
    const { data } = await axiosInstance.post('/auth/refresh', null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    const { accessToken, refreshToken: newRefreshToken } = data.data;
    useAuthStore.getState().setTokens(accessToken, newRefreshToken);
    pendingQueue.forEach((cb) => cb(accessToken));
    pendingQueue = [];
    error.config.headers.Authorization = `Bearer ${accessToken}`;
    return axiosInstance(error.config);
  } catch {
    pendingQueue = [];
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    return Promise.reject(error);
  } finally {
    isRefreshing = false;
  }
});
```

### 6-5. 카테고리 삭제와 할일 캐시 무효화

카테고리 삭제 후에는 해당 카테고리를 참조하는 할일 목록 캐시도 무효화해야 한다.

```typescript
// TanStack Query 예시
const deleteCategory = useMutation({
  mutationFn: (categoryId: number) => categoryApi.delete(categoryId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['todos'] }); // 할일 캐시도 무효화
  },
});
```

---

## 7. authStore 상태 설계 참고

```typescript
// store/authStore.ts
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    user_id: number;
    email: string;
    name: string;
    provider: string;
    created_at: string;
  } | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthState['user']) => void;
  clearAuth: () => void;
}

// persist 미들웨어 사용 금지 — 페이지 새로고침 시 소멸이 의도된 동작
```

---

## 8. 빠른 참조 — 엔드포인트 요약

| 메서드 | 경로 | 인증 | 성공 코드 | 설명 |
|--------|------|------|----------|------|
| POST | `/auth/signup` | 불필요 | 201 | 회원가입 |
| POST | `/auth/login` | 불필요 | 200 | 로그인 |
| POST | `/auth/logout` | AT | 200 | 로그아웃 (body에 refreshToken) |
| POST | `/auth/refresh` | RT (헤더) | 200 | 토큰 갱신 |
| GET | `/users/me` | AT | 200 | 내 정보 조회 |
| PATCH | `/users/me` | AT | 200 | 이름·비밀번호 수정 |
| DELETE | `/users/me` | AT | 204 | 회원 탈퇴 (body에 password) |
| GET | `/categories` | AT | 200 | 카테고리 목록 |
| POST | `/categories` | AT | 201 | 카테고리 생성 |
| DELETE | `/categories/:id` | AT | 204 | 카테고리 삭제 |
| GET | `/todos` | AT | 200 | 할일 목록 (필터 지원) |
| POST | `/todos` | AT | 201 | 할일 생성 |
| GET | `/todos/:id` | AT | 200 | 할일 단건 조회 |
| PATCH | `/todos/:id` | AT | 200 | 할일 수정 |
| DELETE | `/todos/:id` | AT | 204 | 할일 삭제 |
| PATCH | `/todos/:id/complete` | AT | 200 | 완료 상태 토글 |

> AT = Access Token, RT = Refresh Token
