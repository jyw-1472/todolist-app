-- TodoListApp Database Schema
-- PostgreSQL 17
-- Generated from docs/6-erd.md

-- ============================================================
-- 초기화 (의존성 역순으로 DROP)
-- ============================================================
DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

DROP FUNCTION IF EXISTS set_updated_at();

-- ============================================================
-- updated_at 자동 갱신 함수
-- ============================================================
CREATE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
  user_id    SERIAL        PRIMARY KEY,
  email      VARCHAR(255)  NOT NULL UNIQUE,
  password   VARCHAR(255),                          -- 소셜 로그인 시 NULL
  name       VARCHAR(100)  NOT NULL,
  provider   VARCHAR(50)   NOT NULL DEFAULT 'local', -- local | google | facebook
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE categories (
  category_id SERIAL        PRIMARY KEY,
  user_id     INTEGER       REFERENCES users(user_id) ON DELETE CASCADE, -- NULL = 시스템 기본 카테고리
  name        VARCHAR(100)  NOT NULL,
  is_default  BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- ============================================================
-- todos
-- ============================================================
CREATE TABLE todos (
  todo_id     SERIAL        PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id INTEGER       NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  due_date    DATE,
  is_completed BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_todos_user_id     ON todos(user_id);
CREATE INDEX idx_todos_category_id ON todos(category_id);

CREATE TRIGGER trg_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 시드 데이터 — 시스템 기본 카테고리 (user_id = NULL)
-- ============================================================
INSERT INTO categories (user_id, name, is_default) VALUES
  (NULL, '전체',   TRUE),
  (NULL, '업무',   FALSE),
  (NULL, '개인',   FALSE),
  (NULL, '쇼핑',   FALSE),
  (NULL, '기타',   FALSE);
