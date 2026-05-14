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
    email: `cat${suffix}@example.com`,
    password: 'Password123!',
    name: `카테고리유저${suffix}`,
  };
  await request(app).post('/api/auth/signup').send(user);
  const res = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: user.password,
  });
  return res.body.data; // { accessToken, refreshToken, user }
}

async function createCategory(accessToken, name) {
  return request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name });
}

// 시스템 기본 카테고리 ID 조회 헬퍼 (예: '업무')
async function getDefaultCategoryId(name = '업무') {
  const { rows } = await pool.query(
    'SELECT category_id FROM categories WHERE user_id IS NULL AND name = $1',
    [name]
  );
  return rows[0]?.category_id;
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
describe('BE-15-1: GET /api/categories', () => {
  test('인증 후 카테고리 목록을 조회하면 200이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });

  test('응답에 기본 카테고리 5건이 포함된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`);
    const defaults = res.body.data.filter((c) => c.user_id === null);
    expect(defaults.length).toBe(5);
  });

  test('사용자 정의 카테고리를 생성하면 목록에 포함된다', async () => {
    const { accessToken } = await signupAndLogin();
    await createCategory(accessToken, '내카테고리');
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`);
    const names = res.body.data.map((c) => c.name);
    expect(names).toContain('내카테고리');
  });

  test('다른 사용자의 카테고리는 포함되지 않는다', async () => {
    const { accessToken: token1 } = await signupAndLogin('A');
    const { accessToken: token2 } = await signupAndLogin('B');
    await createCategory(token1, 'user1전용');
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token2}`);
    const names = res.body.data.map((c) => c.name);
    expect(names).not.toContain('user1전용');
  });

  test('Authorization 헤더 없이 요청 시 401이 반환된다', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ────────────────────────────────────────────────
describe('BE-15-2: POST /api/categories', () => {
  test('카테고리 생성 성공 시 201이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await createCategory(accessToken, '새카테고리');
    expect(res.status).toBe(201);
  });

  test('응답에 생성된 카테고리 정보가 포함된다', async () => {
    const { accessToken, user } = await signupAndLogin();
    const res = await createCategory(accessToken, '응답테스트');
    expect(res.body.data.name).toBe('응답테스트');
    expect(res.body.data.user_id).toBe(user.user_id);
    expect(res.body.data.category_id).toBeDefined();
  });

  test('동일 사용자 범위 내 이름 중복 시 409 DUPLICATE_CATEGORY가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    await createCategory(accessToken, '중복카테고리');
    const res = await createCategory(accessToken, '중복카테고리');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_CATEGORY');
  });

  test('다른 사용자가 동일 이름을 사용해도 201이 반환된다', async () => {
    const { accessToken: token1 } = await signupAndLogin('X');
    const { accessToken: token2 } = await signupAndLogin('Y');
    await createCategory(token1, '공유이름');
    const res = await createCategory(token2, '공유이름');
    expect(res.status).toBe(201);
  });

  test('name 누락 시 400 VALIDATION_ERROR가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Authorization 헤더 없이 요청 시 401이 반환된다', async () => {
    const res = await request(app).post('/api/categories').send({ name: '테스트' });
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────
describe('BE-15-3: DELETE /api/categories/:id', () => {
  test('본인 소유의 빈 카테고리 삭제 성공 시 204가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const created = await createCategory(accessToken, '삭제대상');
    const categoryId = created.body.data.category_id;
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(204);
  });

  test('기본 카테고리 삭제 시도 시 403 DEFAULT_CATEGORY_IMMUTABLE이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const defaultId = await getDefaultCategoryId('업무');
    const res = await request(app)
      .delete(`/api/categories/${defaultId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('DEFAULT_CATEGORY_IMMUTABLE');
  });

  test('is_default=TRUE인 전체 카테고리 삭제 시도 시 403이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const defaultId = await getDefaultCategoryId('전체');
    const res = await request(app)
      .delete(`/api/categories/${defaultId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('DEFAULT_CATEGORY_IMMUTABLE');
  });

  test('타인 소유 카테고리 삭제 시도 시 403 FORBIDDEN이 반환된다', async () => {
    const { accessToken: token1 } = await signupAndLogin('P');
    const { accessToken: token2 } = await signupAndLogin('Q');
    const created = await createCategory(token1, 'user1카테고리');
    const categoryId = created.body.data.category_id;
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('할일이 존재하는 카테고리 삭제 시 409 CATEGORY_HAS_TODOS가 반환된다', async () => {
    const { accessToken, user } = await signupAndLogin();
    const created = await createCategory(accessToken, '할일있는카테고리');
    const categoryId = created.body.data.category_id;
    // 해당 카테고리에 할일 추가
    await pool.query(
      'INSERT INTO todos (user_id, category_id, title) VALUES ($1, $2, $3)',
      [user.user_id, categoryId, '테스트할일']
    );
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_HAS_TODOS');
  });

  test('존재하지 않는 카테고리 삭제 시 404 RESOURCE_NOT_FOUND가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .delete('/api/categories/999999')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  test('Authorization 헤더 없이 요청 시 401이 반환된다', async () => {
    const res = await request(app).delete('/api/categories/1');
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────
describe('BE-15-4: Controller 구조 검증', () => {
  const fs = require('fs');
  let src;
  beforeAll(() => {
    src = fs.readFileSync(
      path.join(__dirname, '../controllers/category.controller.js'), 'utf8'
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

// ────────────────────────────────────────────────
describe('BE-15-5: 비즈니스 규칙이 Service에만 위치한다', () => {
  const fs = require('fs');
  const controllerSrc = fs.readFileSync(
    path.join(__dirname, '../controllers/category.controller.js'), 'utf8'
  );
  const serviceSrc = fs.readFileSync(
    path.join(__dirname, '../services/category.service.js'), 'utf8'
  );

  test('Service에 is_default 체크 로직이 있다', () => {
    expect(serviceSrc).toMatch(/is_default/);
  });

  test('Controller에 is_default 체크 로직이 없다', () => {
    expect(controllerSrc).not.toMatch(/is_default/);
  });

  test('Service에 hasTodos 검증이 있다', () => {
    expect(serviceSrc).toMatch(/hasTodos/);
  });
});
