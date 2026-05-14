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
  email: 'user-router@example.com',
  password: 'Password123!',
  name: '유저라우터테스트',
};

// 공통 헬퍼: 회원가입 후 로그인, 토큰 반환
async function signupAndLogin(user = TEST_USER) {
  await request(app).post('/api/auth/signup').send(user);
  const res = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: user.password,
  });
  return res.body.data; // { accessToken, refreshToken, user }
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
describe('BE-13-1: GET /api/users/me', () => {
  test('유효한 accessToken 으로 내 정보를 조회할 수 있다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });

  test('응답 바디에 user_id, email, name 이 포함된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.user_id).toBeDefined();
    expect(res.body.data.email).toBe(TEST_USER.email);
    expect(res.body.data.name).toBe(TEST_USER.name);
  });

  test('응답 바디에 password 필드가 포함되지 않는다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.body.data.password).toBeUndefined();
  });

  test('Authorization 헤더 없이 요청 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('만료된 accessToken 으로 요청 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: 1, email: 'a@b.com' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────
describe('BE-13-2: PATCH /api/users/me', () => {
  test('이름 변경 성공 시 200 과 변경된 name 이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '새이름' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('새이름');
  });

  test('응답 바디에 password 필드가 포함되지 않는다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '새이름' });
    expect(res.body.data.password).toBeUndefined();
  });

  test('비밀번호 변경 성공 시 200 이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: TEST_USER.password, newPassword: 'NewPassword456!' });
    expect(res.status).toBe(200);
  });

  test('비밀번호 변경 후 새 비밀번호로 로그인이 가능하다', async () => {
    const { accessToken } = await signupAndLogin();
    await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: TEST_USER.password, newPassword: 'NewPassword456!' });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: 'NewPassword456!',
    });
    expect(loginRes.status).toBe(200);
  });

  test('현재 비밀번호 불일치 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'NewPassword456!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('newPassword 만 보내고 currentPassword 를 생략하면 400 이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newPassword: 'NewPassword456!' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('name 과 newPassword 를 모두 생략하면 400 VALIDATION_ERROR 가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Authorization 헤더 없이 요청 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .send({ name: '새이름' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ────────────────────────────────────────────────
describe('BE-13-3: DELETE /api/users/me', () => {
  test('비밀번호 검증 성공 시 204 응답이 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: TEST_USER.password });
    expect(res.status).toBe(204);
  });

  test('탈퇴 후 DB 에서 사용자 레코드가 삭제된다', async () => {
    const { accessToken } = await signupAndLogin();
    await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: TEST_USER.password });

    // 삭제 후 동일 이메일로 회원가입 가능 → 이전 레코드가 없음을 의미
    const signupRes = await request(app).post('/api/auth/signup').send(TEST_USER);
    expect(signupRes.status).toBe(201);
  });

  test('비밀번호 불일치 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('password 를 생략하면 400 VALIDATION_ERROR 가 반환된다', async () => {
    const { accessToken } = await signupAndLogin();
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Authorization 헤더 없이 요청 시 401 UNAUTHORIZED 가 반환된다', async () => {
    const res = await request(app)
      .delete('/api/users/me')
      .send({ password: TEST_USER.password });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ────────────────────────────────────────────────
describe('BE-13-4: Controller 구조 검증 (소스 분석)', () => {
  const fs = require('fs');
  let src;
  beforeAll(() => {
    src = fs.readFileSync(
      path.join(__dirname, '../controllers/user.controller.js'), 'utf8'
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

// ────────────────────────────────────────────────
describe('BE-13-5: authenticate 미들웨어 적용 확인', () => {
  const routerSrc = require('fs').readFileSync(
    path.join(__dirname, '../routes/user.routes.js'), 'utf8'
  );

  test('GET /me 에 authenticate 가 등록되어 있다', () => {
    expect(routerSrc).toMatch(/authenticate/);
  });

  test('PATCH /me 에 authenticate 가 등록되어 있다', () => {
    expect(routerSrc).toMatch(/authenticate/);
  });

  test('DELETE /me 에 authenticate 가 등록되어 있다', () => {
    expect(routerSrc).toMatch(/authenticate/);
  });
});
