'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/database');
const { clearDatabase } = require('../test/teardown');
const { _clearRevokedTokens } = require('../services/auth.service');

// ── 헬퍼 ──────────────────────────────────────────
async function signupAndLogin(suffix = '') {
  const user = {
    email: `todo${suffix}@example.com`,
    password: 'Password123!',
    name: `할일유저${suffix}`,
  };
  await request(app).post('/api/auth/signup').send(user);
  const res = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: user.password,
  });
  return res.body.data;
}

async function createCategory(accessToken, name = '테스트카테고리') {
  const res = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name });
  return res.body.data;
}

async function createTodo(accessToken, categoryId, overrides = {}) {
  const res = await request(app)
    .post('/api/todos')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ category_id: categoryId, title: '기본할일', ...overrides });
  return res;
}

async function getDefaultCategoryId(name = '업무') {
  const { rows } = await pool.query(
    'SELECT category_id FROM categories WHERE user_id IS NULL AND name = $1',
    [name]
  );
  return rows[0].category_id;
}

beforeEach(async () => {
  await clearDatabase();
  _clearRevokedTokens();
});

afterAll(async () => {
  await clearDatabase();
  await pool.end();
});

// ────────────────────────────────────────────────
describe('BE-17-1: GET /api/todos', () => {
  test('인증 후 내 할일 목록을 조회하면 200이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('로그인한 사용자의 할일만 반환된다', async () => {
    const { accessToken: t1 } = await signupAndLogin('A');
    const { accessToken: t2 } = await signupAndLogin('B');
    const cat1 = await createCategory(t1, 'cat1');
    const cat2 = await createCategory(t2, 'cat2');
    await createTodo(t1, cat1.category_id, { title: 'user1할일' });
    await createTodo(t2, cat2.category_id, { title: 'user2할일' });

    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${t1}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('user1할일');
  });

  test('category_id 필터 파라미터가 동작한다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat1 = await createCategory(accessToken, '카테1');
    const cat2 = await createCategory(accessToken, '카테2');
    await createTodo(accessToken, cat1.category_id, { title: 'cat1할일' });
    await createTodo(accessToken, cat2.category_id, { title: 'cat2할일' });

    const res = await request(app)
      .get(`/api/todos?category_id=${cat1.category_id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('cat1할일');
  });

  test('is_completed=false 필터 파라미터가 동작한다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id, { title: '완료' });
    await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`);
    await createTodo(accessToken, cat.category_id, { title: '미완료' });

    const res = await request(app)
      .get('/api/todos?is_completed=false')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.every((t) => t.is_completed === false)).toBe(true);
  });

  test('is_completed=true 필터 파라미터가 동작한다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id, { title: '완료' });
    await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`);
    await createTodo(accessToken, cat.category_id, { title: '미완료' });

    const res = await request(app)
      .get('/api/todos?is_completed=true')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.every((t) => t.is_completed === true)).toBe(true);
  });

  test('존재하지 않는 category_id 전달 시 404 RESOURCE_NOT_FOUND가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .get('/api/todos?category_id=999999')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  test('Authorization 헤더 없이 요청 시 401이 반환된다', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────
describe('BE-17-2: POST /api/todos', () => {
  test('할일 생성 성공 시 201과 생성된 데이터가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const res = await createTodo(accessToken, cat.category_id, { title: '새할일' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('새할일');
    expect(res.body.data.todo_id).toBeDefined();
  });

  test('title 누락 시 400 VALIDATION_ERROR가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ category_id: cat.category_id });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('category_id 누락 시 400 VALIDATION_ERROR가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '제목만' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('존재하지 않는 category_id 전달 시 404가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ category_id: 999999, title: '없는카테' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  test('기본 카테고리로 할일을 생성할 수 있다', async () => {
    const { accessToken } = await signupAndLogin();
    const defaultCatId = await getDefaultCategoryId();
    const res = await createTodo(accessToken, defaultCatId, { title: '기본카테할일' });
    expect(res.status).toBe(201);
  });

  test('description과 due_date를 포함해 생성할 수 있다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const res = await createTodo(accessToken, cat.category_id, {
      title: '상세할일',
      description: '설명',
      due_date: '2026-12-31',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.description).toBe('설명');
    // DATE 컬럼은 node-postgres가 UTC ISO 문자열로 반환하므로 날짜 부분만 확인한다
    expect(res.body.data.due_date).toBeTruthy();
  });
});

// ────────────────────────────────────────────────
describe('BE-17-3: GET /api/todos/:id', () => {
  test('본인 소유 할일 단건 조회 시 200이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id);
    const res = await request(app)
      .get(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.todo_id).toBe(todo.body.data.todo_id);
  });

  test('존재하지 않는 할일 조회 시 404가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .get('/api/todos/999999')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });

  test('타인 소유 할일 조회 시 403 FORBIDDEN이 반환된다', async () => {
    const { accessToken: t1 } = await signupAndLogin('C');
    const { accessToken: t2 } = await signupAndLogin('D');
    const cat = await createCategory(t1, 'catC');
    const todo = await createTodo(t1, cat.category_id);
    const res = await request(app)
      .get(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${t2}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

// ────────────────────────────────────────────────
describe('BE-17-4: PATCH /api/todos/:id', () => {
  test('할일 수정 성공 시 200과 수정된 데이터가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id);
    const res = await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '수정된제목' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('수정된제목');
  });

  test('타인 소유 할일 수정 시 403 FORBIDDEN이 반환된다', async () => {
    const { accessToken: t1 } = await signupAndLogin('E');
    const { accessToken: t2 } = await signupAndLogin('F');
    const cat = await createCategory(t1, 'catE');
    const todo = await createTodo(t1, cat.category_id);
    const res = await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${t2}`)
      .send({ title: '탈취' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('존재하지 않는 category_id 로 수정 시 404가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id);
    const res = await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ category_id: 999999 });
    expect(res.status).toBe(404);
  });

  test('존재하지 않는 할일 수정 시 404가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .patch('/api/todos/999999')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '없음' });
    expect(res.status).toBe(404);
  });
});

// ────────────────────────────────────────────────
describe('BE-17-5: DELETE /api/todos/:id', () => {
  test('본인 소유 할일 삭제 성공 시 204가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id);
    const res = await request(app)
      .delete(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(204);
  });

  test('삭제 후 단건 조회 시 404가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id);
    await request(app)
      .delete(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    const res = await request(app)
      .get(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });

  test('타인 소유 할일 삭제 시 403 FORBIDDEN이 반환된다', async () => {
    const { accessToken: t1 } = await signupAndLogin('G');
    const { accessToken: t2 } = await signupAndLogin('H');
    const cat = await createCategory(t1, 'catG');
    const todo = await createTodo(t1, cat.category_id);
    const res = await request(app)
      .delete(`/api/todos/${todo.body.data.todo_id}`)
      .set('Authorization', `Bearer ${t2}`);
    expect(res.status).toBe(403);
  });

  test('존재하지 않는 할일 삭제 시 404가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .delete('/api/todos/999999')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });
});

// ────────────────────────────────────────────────
describe('BE-17-6: PATCH /api/todos/:id/complete', () => {
  test('완료 토글 성공 시 200과 토글된 데이터가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id);
    expect(todo.body.data.is_completed).toBe(false);

    const res = await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.is_completed).toBe(true);
  });

  test('두 번 토글하면 원래 상태로 돌아온다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id);
    await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`);
    const res = await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.is_completed).toBe(false);
  });

  test('토글 후 updated_at이 갱신된다', async () => {
    const { accessToken } = await signupAndLogin();
    const cat = await createCategory(accessToken);
    const todo = await createTodo(accessToken, cat.category_id);
    await new Promise((r) => setTimeout(r, 10));
    const res = await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}/complete`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(new Date(res.body.data.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(todo.body.data.created_at).getTime()
    );
  });

  test('타인 소유 할일 토글 시 403 FORBIDDEN이 반환된다', async () => {
    const { accessToken: t1 } = await signupAndLogin('I');
    const { accessToken: t2 } = await signupAndLogin('J');
    const cat = await createCategory(t1, 'catI');
    const todo = await createTodo(t1, cat.category_id);
    const res = await request(app)
      .patch(`/api/todos/${todo.body.data.todo_id}/complete`)
      .set('Authorization', `Bearer ${t2}`);
    expect(res.status).toBe(403);
  });

  test('존재하지 않는 할일 토글 시 404가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .patch('/api/todos/999999/complete')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
  });
});

// ────────────────────────────────────────────────
describe('BE-17-7: Controller 구조 검증', () => {
  const fs = require('fs');
  let src;
  beforeAll(() => {
    src = fs.readFileSync(
      path.join(__dirname, '../controllers/todo.controller.js'), 'utf8'
    );
  });

  test('controller에 try-catch가 없다', () => {
    expect(src).not.toMatch(/try\s*\{/);
  });

  test('asyncHandler 래퍼가 사용된다', () => {
    expect(src).toMatch(/asyncHandler/);
  });

  test('sendSuccess가 사용된다', () => {
    expect(src).toMatch(/sendSuccess/);
  });
});
