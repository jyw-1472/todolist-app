'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { clearDatabase } = require('../test/teardown');
const {
  register, login, logout, refresh, _clearRevokedTokens,
} = require('../services/auth.service');

const TEST_USER = {
  email: 'auth@example.com',
  password: 'Password123!',
  name: '테스트유저',
};

beforeEach(async () => {
  await clearDatabase();
  _clearRevokedTokens();
});

afterAll(async () => {
  await clearDatabase();
  await pool.end();
});

// ────────────────────────────────────────────────
describe('BE-11-1: register', () => {
  test('정상 회원가입 시 user 객체(비밀번호 제외)를 반환한다', async () => {
    const user = await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    expect(user.user_id).toBeDefined();
    expect(user.email).toBe(TEST_USER.email);
    expect(user.name).toBe(TEST_USER.name);
    expect(user.password).toBeUndefined();
  });

  test('반환된 user_id 가 숫자 타입이다', async () => {
    const user = await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    expect(typeof user.user_id).toBe('number');
  });

  test('비밀번호가 bcrypt 해시로 저장된다 (원문이 아님)', async () => {
    const { findByEmail } = require('../repositories/user.repository');
    await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    const stored = await findByEmail(TEST_USER.email);
    expect(stored.password).not.toBe(TEST_USER.password);
    expect(stored.password).toMatch(/^\$2b\$/);
  });

  test('중복 이메일로 register 호출 시 AppError DUPLICATE_EMAIL(409)이 throw된다', async () => {
    await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    await expect(
      register(TEST_USER.email, TEST_USER.password, TEST_USER.name)
    ).rejects.toMatchObject({ code: 'DUPLICATE_EMAIL', statusCode: 409 });
  });
});

// ────────────────────────────────────────────────
describe('BE-11-2: login', () => {
  beforeEach(async () => {
    await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
  });

  test('정상 로그인 시 accessToken 과 refreshToken 이 반환된다', async () => {
    const result = await login(TEST_USER.email, TEST_USER.password);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  test('정상 로그인 시 user 객체(비밀번호 제외)가 반환된다', async () => {
    const result = await login(TEST_USER.email, TEST_USER.password);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(TEST_USER.email);
    expect(result.user.password).toBeUndefined();
  });

  test('존재하지 않는 이메일로 login 시 AppError UNAUTHORIZED(401)이 throw된다', async () => {
    await expect(
      login('notexist@example.com', TEST_USER.password)
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
  });

  test('잘못된 비밀번호로 login 시 AppError UNAUTHORIZED(401)이 throw된다', async () => {
    await expect(
      login(TEST_USER.email, 'wrongpassword')
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
  });

  test('발급된 accessToken 페이로드에 userId 와 email 이 포함된다', async () => {
    const result = await login(TEST_USER.email, TEST_USER.password);
    const decoded = jwt.decode(result.accessToken);
    expect(decoded.email).toBe(TEST_USER.email);
    expect(typeof decoded.userId).toBe('number');
  });
});

// ────────────────────────────────────────────────
describe('BE-11-3: logout', () => {
  test('logout 후 해당 refreshToken 으로 refresh 시 UNAUTHORIZED가 throw된다', async () => {
    await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    const { refreshToken } = await login(TEST_USER.email, TEST_USER.password);

    logout(refreshToken);

    expect(() => refresh(refreshToken)).toThrowError(
      expect.objectContaining({ code: 'UNAUTHORIZED', statusCode: 401 })
    );
  });

  test('logout 은 refreshToken 없이 호출해도 에러가 발생하지 않는다', () => {
    expect(() => logout(null)).not.toThrow();
    expect(() => logout(undefined)).not.toThrow();
  });
});

// ────────────────────────────────────────────────
describe('BE-11-4: refresh', () => {
  test('유효한 refreshToken 으로 새 accessToken 과 refreshToken 이 반환된다', async () => {
    await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    const { refreshToken } = await login(TEST_USER.email, TEST_USER.password);

    const result = refresh(refreshToken);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  test('refresh 후 이전 refreshToken 은 무효화된다 (토큰 로테이션)', async () => {
    await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    const { refreshToken: oldToken } = await login(TEST_USER.email, TEST_USER.password);

    refresh(oldToken);

    expect(() => refresh(oldToken)).toThrow();
  });

  test('새로 발급된 refreshToken 으로 다시 refresh 가 가능하다', async () => {
    await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    const { refreshToken: first } = await login(TEST_USER.email, TEST_USER.password);

    const { refreshToken: second } = refresh(first);
    const result = refresh(second);
    expect(result.accessToken).toBeDefined();
  });

  test('만료된 refreshToken 전달 시 UNAUTHORIZED가 throw된다', () => {
    const expiredToken = jwt.sign(
      { userId: 1, email: 'a@b.com' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    expect(() => refresh(expiredToken)).toThrow();
  });

  test('잘못된 서명의 refreshToken 전달 시 UNAUTHORIZED가 throw된다', () => {
    const fakeToken = jwt.sign(
      { userId: 1, email: 'a@b.com' },
      'wrong_secret'
    );
    expect(() => refresh(fakeToken)).toThrow();
  });

  test('무효화된 refreshToken 으로 refresh 시 UNAUTHORIZED(401)가 throw된다', async () => {
    await register(TEST_USER.email, TEST_USER.password, TEST_USER.name);
    const { refreshToken } = await login(TEST_USER.email, TEST_USER.password);

    logout(refreshToken);

    expect(() => refresh(refreshToken)).toThrowError(
      expect.objectContaining({ code: 'UNAUTHORIZED', statusCode: 401 })
    );
  });
});
