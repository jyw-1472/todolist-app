# TodoListApp 제품 요구사항 정의서 (PRD)

**버전:** 1.0  
**작성일:** 2026-05-13  
**작성자:** Product Manager  
**참조 문서:** `1-domain-definition.md`

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.3 | 2026-05-14 | jung young woo | JWT 설계 원칙에 토큰 로테이션 동작 추가 |
| 1.2 | 2026-05-13 | Product Manager | 인증 방식 변경: Refresh Token 저장소를 HttpOnly Cookie → Zustand 메모리로 변경 |
| 1.1 | 2026-05-13 | Product Manager | 검토 반영: BR-05 수정 불가 명시, 로그아웃·토큰갱신·회원탈퇴 UC 추가, 단건 조회 API 추가, 필터 파라미터 정의, updated_at 갱신 방식 명시, 에러 코드 목록 추가, provider 컬럼 도메인 이탈 사유 명시 |
| 1.0 | 2026-05-13 | Product Manager | 최초 작성 |

---

## 1. 제품 개요

### 1-1. 문제 정의

개인 단위의 할일을 체계적으로 관리할 수 있는 전용 애플리케이션이 부재하다. 인증된 사용자 기반으로 할일을 안전하게 저장·관리하고, 카테고리를 활용해 분류할 수 있는 기능이 필요하다.

### 1-2. 제품 목표

인증 기반의 개인 할일 관리 웹 애플리케이션을 제공하여, 사용자가 자신의 할일을 카테고리별로 등록·조회·완료 처리할 수 있도록 한다.

### 1-3. 성공 기준

| 지표 | 목표 |
|------|------|
| 1차 릴리즈 완료 | 3일 내 MVP 배포 |
| 동시 접속 처리 | 300명 이상 안정 처리 |
| API 응답 시간 | 일반 CRUD 요청 500ms 이하 |
| 인증 보안 | JWT 기반 토큰 만료·갱신 정상 동작 |

---

## 2. 타겟 사용자

### 2-1. 주요 페르소나

| 항목 | 내용 |
|------|------|
| 연령대 | 20대 ~ 50대 |
| 직군 | 직장인 |
| 사용 환경 | PC 웹 브라우저, 모바일 웹 브라우저 |
| 핵심 니즈 | 업무·개인 할일을 카테고리별로 정리하고 완료 여부를 추적하고 싶다 |

### 2-2. 사용 환경

- **지원 플랫폼:** Web, Mobile Web (반응형 웹 UI)
- **미지원:** 네이티브 앱 (Android, iOS) — 2차 검토 대상
- **브라우저:** Chrome, Safari, Edge 최신 2개 버전 기준

---

## 3. 기술 스택

### 3-1. 프론트엔드

| 항목 | 선택 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 상태 관리 | Zustand |
| 서버 상태 | TanStack Query |
| UI 반응형 | CSS (모바일 우선 반응형) |

### 3-2. 백엔드

| 항목 | 선택 |
|------|------|
| 런타임 | Node.js |
| 프레임워크 | Express |
| API 방식 | REST API |
| DB 연동 라이브러리 | **pg** (node-postgres) — ORM 미사용, 직접 SQL 작성 |

### 3-3. 데이터베이스

| 항목 | 선택 |
|------|------|
| DBMS | PostgreSQL 17 |

### 3-4. 인증

| 단계 | 방식 |
|------|------|
| 1차 (MVP) | JWT (Access Token + Refresh Token) |
| 2차 (향후) | OAuth Social 로그인 (Google, Facebook 등) 확장 |

> **JWT 설계 원칙**
> - Access Token: 만료 시간 짧게 (예: 15분), Zustand 메모리 저장
> - Refresh Token: 만료 시간 길게 (예: 7일), Zustand 메모리 저장 (페이지 새로고침 시 소멸 → 재로그인 필요, 의도된 동작)
> - 토큰 로테이션: `POST /api/auth/refresh` 호출 시 기존 Refresh Token을 서버 인메모리 블랙리스트에 추가하고 새 토큰 쌍(Access + Refresh)을 발급한다. 무효화된 Refresh Token으로 재갱신 시도 시 401을 반환한다.
> - 소셜 로그인 확장을 고려해 사용자 테이블에 `provider` 컬럼 예약

---

## 4. 기능 요구사항

### 4-1. MVP 범위 (1차 릴리즈 — 3일)

도메인 정의서의 UC-01 ~ UC-10 전체를 1차에 포함한다.

#### 인증

| UC | 기능 | 상세 요구사항 |
|----|------|--------------|
| UC-01 | 회원가입 | 이메일(고유)·비밀번호·이름 입력 후 계정 생성. 비밀번호는 bcrypt 해시 저장 |
| UC-02 | 로그인 | 이메일·비밀번호 검증 후 Access Token + Refresh Token 발급 |
| UC-03 | 개인정보 수정 | 이름·비밀번호 변경 가능. 비밀번호 변경 시 현재 비밀번호 확인 필요 |
| UC-11 | 로그아웃 | Refresh Token 무효화 처리. 클라이언트 측 Access Token 파기 |
| UC-12 | 토큰 갱신 | Refresh Token 검증 후 Access Token 재발급. Refresh Token 만료 시 재로그인 유도 |
| UC-13 | 회원 탈퇴 | 본인 확인 후 사용자·할일·사용자 정의 카테고리 데이터 즉시 삭제 |

#### 할일 (Todo) CRUD

| UC | 기능 | 상세 요구사항 |
|----|------|--------------|
| UC-04 | 할일 등록 | 제목(필수)·설명·종료 예정일·카테고리(필수) 입력. 신규 등록 시 오늘 이후 날짜 권장 안내 |
| UC-05 | 할일 수정 | 제목·설명·종료 예정일·카테고리 변경 가능 |
| UC-06 | 할일 삭제 | 본인 소유 할일만 삭제 가능 |
| UC-07 | 완료 처리 | 완료 상태 토글 (완료 ↔ 미완료). 완료 후 재조회 및 취소 가능 |
| UC-08 | 할일 목록 조회 | 카테고리·기간·완료 여부 조건으로 필터링. 기본 정렬: 종료 예정일 오름차순. 필터 파라미터: `category_id`, `from`(YYYY-MM-DD), `to`(YYYY-MM-DD), `is_completed`(true/false) |

#### 카테고리 (Category) 관리

| UC | 기능 | 상세 요구사항 |
|----|------|--------------|
| UC-09 | 카테고리 추가 | 사용자 정의 카테고리 생성. 이름 중복 불가 (사용자 범위 내) |
| UC-10 | 카테고리 삭제 | 소속 할일이 없는 사용자 정의 카테고리만 삭제 가능. 기본 카테고리 삭제·수정 불가 (BR-05) |

### 4-2. 2차 릴리즈 (향후)

| 항목 | 내용 |
|------|------|
| 소셜 로그인 | Google, Facebook OAuth 인증 연동 |
| 다크 모드 | 테마 전환 기능 |
| 다국어 지원 | i18n 적용 (한국어 외 1개 언어 이상) |

---

## 5. 비기능 요구사항

### 5-1. 성능

| 항목 | 요구사항 |
|------|---------|
| 동시 접속자 | 300명 기준 안정 처리 |
| API 응답 시간 | 일반 CRUD 500ms 이하 (목록 조회 포함) |
| DB 커넥션 풀 | pg Pool 사용, 적정 max/min 설정 |

### 5-2. 보안

| 항목 | 요구사항 |
|------|---------|
| 비밀번호 저장 | bcrypt 해시 (salt rounds ≥ 10) |
| 인증 토큰 | JWT, Access Token·Refresh Token 모두 Zustand 메모리 저장. API 요청 시 `Authorization: Bearer` 헤더로 전달 |
| 데이터 격리 | 사용자는 본인 소유 데이터에만 접근 가능 (API 레벨 검증 필수) |
| SQL 인젝션 방지 | pg 파라미터 바인딩($1, $2, ...) 사용, 문자열 직접 삽입 금지 |
| CORS | 허용 오리진 명시적 설정 |

### 5-3. 데이터 정책

| 항목 | 정책 |
|------|------|
| 회원 탈퇴 | 탈퇴 즉시 사용자·할일·사용자 정의 카테고리 데이터 즉시 삭제 |
| 기본 카테고리 | 시스템 소유, 삭제 불가 |
| 백업 | 소규모 개인 프로젝트 수준 — 별도 정책 없음 (운영 환경 설정 시 재검토) |

### 5-4. 접근성 및 UX

| 항목 | 요구사항 |
|------|---------|
| 반응형 | 모바일 우선(Mobile First) 반응형 레이아웃 |
| 다크 모드 | 1차 미포함, 2차 대상 |
| 다국어 | 1차 한국어 단일, 2차 i18n 확장 |

---

## 6. API 설계 방향

### 6-1. 기본 원칙

- RESTful 설계: 리소스 명사형 URL, HTTP 메서드로 행위 표현
- 응답 형식: JSON
- 인증 필요 API: `Authorization: Bearer <access_token>` 헤더 필수
- 에러 응답 구조 일관성 유지

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "요청한 리소스를 찾을 수 없습니다."
  }
}
```

### 6-2. 표준 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|----------|------|
| `VALIDATION_ERROR` | 400 | 요청 바디·파라미터 유효성 오류 |
| `UNAUTHORIZED` | 401 | 인증 토큰 없음 또는 만료 |
| `FORBIDDEN` | 403 | 본인 소유가 아닌 리소스 접근 시도 |
| `RESOURCE_NOT_FOUND` | 404 | 요청한 리소스 없음 |
| `DUPLICATE_EMAIL` | 409 | 이미 사용 중인 이메일 (회원가입) |
| `DUPLICATE_CATEGORY` | 409 | 동일 사용자 범위 내 카테고리 이름 중복 |
| `CATEGORY_HAS_TODOS` | 409 | 할일이 존재하는 카테고리 삭제 시도 (BR-08) |
| `DEFAULT_CATEGORY_IMMUTABLE` | 403 | 기본 카테고리 수정·삭제 시도 (BR-05) |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

### 6-3. 주요 엔드포인트

| 메서드 | 경로 | 설명 | 인증 | UC |
|--------|------|------|------|----|
| POST | /api/auth/signup | 회원가입 | 불필요 | UC-01 |
| POST | /api/auth/login | 로그인 | 불필요 | UC-02 |
| POST | /api/auth/refresh | Access Token 재발급 | 필요 (Refresh Token을 Authorization 헤더로 전달) | UC-12 |
| POST | /api/auth/logout | 로그아웃 | 필요 | UC-11 |
| GET | /api/users/me | 내 정보 조회 | 필요 | UC-03 |
| PATCH | /api/users/me | 내 정보 수정 | 필요 | UC-03 |
| DELETE | /api/users/me | 회원 탈퇴 | 필요 | UC-13 |
| GET | /api/todos | 할일 목록 조회 (`?category_id=&from=&to=&is_completed=`) | 필요 | UC-08 |
| POST | /api/todos | 할일 등록 | 필요 | UC-04 |
| GET | /api/todos/:id | 할일 단건 조회 | 필요 | UC-05 |
| PATCH | /api/todos/:id | 할일 수정 | 필요 | UC-05 |
| DELETE | /api/todos/:id | 할일 삭제 | 필요 | UC-06 |
| PATCH | /api/todos/:id/complete | 완료 상태 토글 | 필요 | UC-07 |
| GET | /api/categories | 카테고리 목록 조회 | 필요 | UC-08 |
| POST | /api/categories | 카테고리 추가 | 필요 | UC-09 |
| DELETE | /api/categories/:id | 카테고리 삭제 | 필요 | UC-10 |

---

## 7. 데이터 모델 (DB 스키마 방향)

도메인 정의서 기반. `users.provider` 컬럼은 도메인 모델에 없으나 2차 OAuth 확장 시 마이그레이션 비용을 줄이기 위해 1차부터 예약한다.

```sql
-- 사용자
CREATE TABLE users (
  user_id    SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255),                   -- 소셜 로그인 사용자는 NULL 허용
  name       VARCHAR(100) NOT NULL,
  provider   VARCHAR(50) DEFAULT 'local',    -- 'local' | 'google' | 'facebook' (2차 확장 예약)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 카테고리
CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(user_id) ON DELETE CASCADE, -- NULL이면 기본 카테고리
  name        VARCHAR(100) NOT NULL,
  is_default  BOOLEAN DEFAULT FALSE
);

-- 할일
CREATE TABLE todos (
  todo_id      SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id  INTEGER NOT NULL REFERENCES categories(category_id),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  due_date     DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()  -- 수정 시 애플리케이션 레벨에서 NOW()로 갱신
);
```

---

## 8. 화면 구성 (와이어프레임 수준)

| 화면 | 주요 구성 요소 |
|------|--------------|
| 회원가입 | 이메일·비밀번호·이름 입력 폼, 제출 버튼 |
| 로그인 | 이메일·비밀번호 입력 폼, 로그인 버튼 |
| 할일 목록 | 카테고리 필터, 완료 여부 필터, 기간 필터, 할일 카드 목록, 추가 버튼 |
| 할일 등록/수정 | 제목·설명·종료 예정일·카테고리 선택 폼 |
| 카테고리 관리 | 카테고리 목록, 추가 입력, 삭제 버튼 |
| 내 정보 수정 | 이름·비밀번호 변경 폼, 회원 탈퇴 버튼 |

---

## 9. 개발 일정 (MVP 3일)

| 일차 | 작업 범위 |
|------|----------|
| Day 1 | 프로젝트 초기 설정, DB 스키마 생성, 인증 API (회원가입·로그인·JWT) |
| Day 2 | 할일 CRUD API, 카테고리 API, 프론트엔드 인증 화면 + 라우팅 |
| Day 3 | 프론트엔드 할일·카테고리 화면, 반응형 UI 검증, 통합 테스트 및 버그 수정 |

---

## 10. 미결 사항 및 제약

| 항목 | 내용 |
|------|------|
| 소셜 로그인 | 2차 대상. 1차 DB 스키마에 `provider` 컬럼 예약 (도메인 모델 이탈 사유: 향후 마이그레이션 비용 최소화) |
| 다크 모드 | 2차 대상. CSS 변수 기반 설계로 추후 테마 적용 용이하게 구성 권장 |
| 다국어 | 2차 대상. 1차부터 텍스트 하드코딩 최소화 권장 |
| 알림 기능 | 미정 (종료 예정일 기반 Push/Email 알림) — 2차 이후 검토 |
| 배포 환경 | 미정. 소규모 개인 프로젝트 수준 (VPS, PaaS 등) |
