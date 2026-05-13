# TodoListApp 기술 아키텍처 다이어그램

| 항목 | 내용 |
|------|------|
| 버전 | v1.0 |
| 작성일 | 2026-05-13 |
| 참조 문서 | 1-domain-definition.md, 2-prd.md, 4-project-principles.md |

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.2 | 2026-05-13 | 인증 방식 변경: Refresh Token HttpOnly Cookie → Zustand 메모리 반영 |
| v1.1 | 2026-05-13 | 일관성 검토 반영: ERD PK/FK 타입 uuid→integer, 포트 번호 정합화(React 5173·Express 3000), PostgreSQL 버전 명시 |
| v1.0 | 2026-05-13 | 최초 작성 |

---

## 1. 시스템 컨텍스트

브라우저에서 React 앱을 통해 Express API 서버와 통신하고, API 서버가 PostgreSQL 데이터베이스에 접근하는 전체 흐름을 나타낸다.

```mermaid
graph LR
    A[Browser] -->|HTTP / HTTPS| B[React App\nPort 5173]
    B -->|REST API\nJSON| C[Express API\nPort 3000]
    C -->|SQL Query| D[(PostgreSQL 17\nPort 5432)]
    B -->|Access Token + Refresh Token\nZustand Memory| B
```

---

## 2. 백엔드 레이어 구조

Router 에서 시작해 단방향으로 흐르는 레이어 구조이며, 각 레이어는 단일 책임을 가진다.

```mermaid
graph TD
    A[Router\n경로 등록 및 요청 분기]
    B[Middleware\n인증 토큰 검증 authenticate]
    C[Controller\n요청 파싱 및 응답 반환]
    D[Service\n비즈니스 로직 처리]
    E[Repository\nSQL 쿼리 실행]
    F[(PostgreSQL 17\n데이터 영속화)]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
```

---

## 3. JWT 인증 흐름

로그인 시 Access Token(15분)과 Refresh Token(7일)을 모두 응답 바디로 전달하여 Zustand 메모리에 저장하고, Access Token 만료 시 Refresh Token으로 재발급하는 흐름을 나타낸다.

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as React App
    participant A as Express API
    participant D as PostgreSQL

    B->>R: 로그인 요청 (email, password)
    R->>A: POST /api/auth/login
    A->>D: 사용자 조회 및 비밀번호 검증
    D-->>A: 사용자 정보 반환
    A-->>R: Access Token + Refresh Token (body)
    R->>R: Access Token·Refresh Token Zustand 저장

    B->>R: API 요청 (예: Todo 목록 조회)
    R->>A: GET /api/todos (Authorization: Bearer <AccessToken>)
    A-->>R: 200 OK + 데이터 반환

    Note over R,A: Access Token 만료 (15분 경과)
    R->>A: POST /api/auth/refresh (Authorization: Bearer <RefreshToken>)
    A-->>R: 새 Access Token + Refresh Token (body)
    R->>A: GET /api/todos (새 Access Token 사용)
    A-->>R: 200 OK + 데이터 반환
```

---

## 4. DB ERD

users, categories, todos 3개 테이블과 각 테이블 간 관계를 표현한다. categories 의 user_id 는 nullable 로, 기본 카테고리는 시스템 공용이다.

```mermaid
erDiagram
    users {
        integer user_id PK
        string email
        string password
        string name
        string provider
        timestamp created_at
    }

    categories {
        integer category_id PK
        integer user_id FK
        string name
        boolean is_default
    }

    todos {
        integer todo_id PK
        integer user_id FK
        integer category_id FK
        string title
        text description
        date due_date
        boolean is_completed
        timestamp created_at
        timestamp updated_at
    }

    users ||--o{ todos : "작성"
    users ||--o{ categories : "소유"
    categories ||--o{ todos : "분류"
```
