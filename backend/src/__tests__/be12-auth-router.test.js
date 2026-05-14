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

const TEST_USER = {
  email: 'router@example.com',
  password: 'Password123!',
  name: '라우터테스트',
};

beforeEach(async () => {
  await clearDatabase();
  _clearRevokedTokens();
});

afterAll(async () => {
  await clearDatabase();
  await pool.end();
});

// 공통 헬퍼: 회원가입 후 로그인
async function signupAndLogin(user = TEST_USER) {
  await request(app).post('/api/auth/signup').send(user);
  const res = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: user.password,
  });
  return res.body.data;
}

// ────────────────────────────────────────────────
describe('BE-12-1: POST /api/auth/signup', () => {
  test('정상 회원가입 시 201 응답이 반환된다', async () => {
    const res = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(res.status).toBe(201);
  });

  test('응답 바디에 user_id, email, name 이 포함된다', async () => {
    const res = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(res.body.data.user_id).toBeDefined();
    expect(res.body.data.email).toBe(TEST_USER.email);
    expect(res.body.data.name).toBe(TEST_USER.name);
  });

  test('응답 바디에 password 가 포함되지 않는다', async () => {
    const res = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(res.body.data.password).toBeUndefined();
  });

  test('email 누락 시 400 VALIDATION_ERROR 가 반환된다', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      password: TEST_USER.password,
      name: TEST_USER.name,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('password 누락 시 400 VALIDATION_ERROR 가 반환된다', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: TEST_USER.email,
      name: TEST_USER.name,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('name 누락 시 400 VALIDATION_ERROR 가 반환된다', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('중복 이메일 회원가입 시 409 DUPLICATE_EMAIL 이 반환된다', async () => {
    await request(app).post('/api/auth/signup').send(TEST_USER);
    const res = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });
});

// ────────────────────────────────────────────────
describe('BE-12-2: POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(TEST_USER);
  });

  test('정상 로그인 시 200 응답이 반환된다', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
  });

  test('응답 바디에 accessToken 과 refreshToken 이 포함된다', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  test('응답 바디에 user 객체(비밀번호 제외)가 포함된다', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('email 누락 시 400 VALIDATION_ERROR 가 반환된다', async () => {
    const res = await request(app).post('/api/auth/login').send({
      password: TEST_USER.password,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('password 누락 시 400 VALIDATION_ERROR 가 반환된다', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
    });
    expect(res.status).toBe(400);
  });

  test('잘못된 비밀번호로 로그인 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('존재하지 않는 이메일로 로그인 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notexist@example.com',
      password: TEST_USER.password,
    });
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────
describe('BE-12-3: POST /api/auth/logout', () => {
  test('유효한 accessToken 으로 로그아웃 시 200 이 반환된다', async () => {
    const { accessToken, refreshToken } = await signupAndLogin();
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(res.status).toBe(200);
  });

  test('Authorization 헤더 없이 logout 요청 시 401 이 반환된다', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('logout 후 해당 refreshToken 으로 refresh 시 401 이 반환된다', async () => {
    const { accessToken, refreshToken } = await signupAndLogin();

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);
    expect(refreshRes.status).toBe(401);
  });

  test('authenticate 미들웨어가 적용되어 있다 (만료된 accessToken → 401)', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: 1, email: 'a@b.com' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({});
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────
describe('BE-12-4: POST /api/auth/refresh', () => {
  test('유효한 refreshToken 으로 새 토큰 쌍이 반환된다', async () => {
    const { refreshToken } = await signupAndLogin();
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  test('Authorization 헤더 없이 refresh 요청 시 401 이 반환된다', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('만료된 refreshToken 으로 refresh 시 401 이 반환된다', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: 1, email: 'a@b.com' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test('잘못된 서명의 refreshToken 으로 refresh 시 401 이 반환된다', async () => {
    const jwt = require('jsonwebtoken');
    const fakeToken = jwt.sign({ userId: 1, email: 'a@b.com' }, 'wrong_secret');
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });

  test('refresh 후 이전 refreshToken 은 무효화된다 (토큰 로테이션)', async () => {
    const { refreshToken: oldToken } = await signupAndLogin();

    await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${oldToken}`);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────
describe('BE-12-5: Controller 구조 검증 (소스 분석)', () => {
  const fs = require('fs');
  let src;
  beforeAll(() => {
    src = fs.readFileSync(
      path.join(__dirname, '../controllers/auth.controller.js'), 'utf8'
    );
  });

  test('controller 에 try-catch 가 없다', () => {
    expect(src).not.toMatch(/try\s*\{/);
  });

  test('asyncHandler 래퍼가 사용된다', () => {
    expect(src).toMatch(/asyncHandler/);
  });

  test('sendSuccess 가 사용된다', () => {
    expect(src).toMatch(/sendSuccess/);
  });
});
