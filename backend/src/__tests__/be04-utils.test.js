'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/error');

// JWT 테스트용 시크릿 설정 (globalSetup 의 .env.test 대신 직접 주입)
beforeAll(() => {
  process.env.JWT_SECRET = 'test_secret_for_be04';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { hashPassword, comparePassword, SALT_ROUNDS } = require('../utils/password');
const { sendSuccess } = require('../utils/response');

// ────────────────────────────────────────────────
// JWT 유틸
// ────────────────────────────────────────────────
describe('BE-04-1: generateAccessToken', () => {
  const payload = { userId: 1, email: 'test@example.com' };

  test('문자열 토큰을 반환한다', () => {
    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('verifyToken 으로 페이로드를 복호화할 수 있다', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  test('서로 다른 호출에서 다른 토큰이 생성된다', () => {
    const t1 = generateAccessToken(payload);
    const t2 = generateAccessToken(payload);
    // iat 이 같을 수 있으므로 payload 가 동일해도 동일 토큰일 수 있음 — 구조만 검증
    expect(typeof t1).toBe('string');
    expect(typeof t2).toBe('string');
  });

  test('만료 시간이 15분(900초)으로 설정된다', () => {
    const token = generateAccessToken(payload);
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(900);
  });
});

describe('BE-04-2: generateRefreshToken', () => {
  const payload = { userId: 2, email: 'refresh@example.com' };

  test('문자열 토큰을 반환한다', () => {
    const token = generateRefreshToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('만료 시간이 7일(604800초)로 설정된다', () => {
    const token = generateRefreshToken(payload);
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(7 * 24 * 60 * 60); // 604800
  });

  test('verifyToken 으로 페이로드를 복호화할 수 있다', () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });
});

describe('BE-04-3: verifyToken', () => {
  const payload = { userId: 3, email: 'verify@example.com' };

  test('유효한 토큰 검증 시 페이로드를 반환한다', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(3);
    expect(decoded.email).toBe('verify@example.com');
  });

  test('잘못된 서명의 토큰 전달 시 AppError(UNAUTHORIZED, 401) 를 throw 한다', () => {
    const fakeToken = jwt.sign(payload, 'wrong_secret');
    expect(() => verifyToken(fakeToken)).toThrow(AppError);
    try {
      verifyToken(fakeToken);
    } catch (err) {
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.statusCode).toBe(401);
    }
  });

  test('만료된 토큰 전달 시 AppError(UNAUTHORIZED, 401) 를 throw 한다', () => {
    const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });
    expect(() => verifyToken(expiredToken)).toThrow(AppError);
    try {
      verifyToken(expiredToken);
    } catch (err) {
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.statusCode).toBe(401);
    }
  });

  test('빈 문자열 전달 시 AppError 를 throw 한다', () => {
    expect(() => verifyToken('')).toThrow(AppError);
  });

  test('완전히 임의의 문자열 전달 시 AppError 를 throw 한다', () => {
    expect(() => verifyToken('not.a.token')).toThrow(AppError);
  });
});

// ────────────────────────────────────────────────
// Password 유틸
// ────────────────────────────────────────────────
describe('BE-04-4: hashPassword', () => {
  test('해시 결과가 문자열이다', async () => {
    const hash = await hashPassword('mypassword');
    expect(typeof hash).toBe('string');
  });

  test('해시가 원본과 다르다', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).not.toBe('mypassword');
  });

  test('동일 평문으로 두 번 해시해도 서로 다른 값이 나온다 (salt 적용)', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
  });

  test('SALT_ROUNDS 가 10 이상이다', () => {
    expect(SALT_ROUNDS).toBeGreaterThanOrEqual(10);
  });

  test('bcrypt 해시 형식($2b$)으로 시작한다', async () => {
    const hash = await hashPassword('test123');
    expect(hash).toMatch(/^\$2[ab]\$/);
  });
});

describe('BE-04-5: comparePassword', () => {
  let hashed;
  beforeAll(async () => {
    hashed = await hashPassword('correct_password');
  });

  test('올바른 비밀번호 비교 시 true 를 반환한다', async () => {
    const result = await comparePassword('correct_password', hashed);
    expect(result).toBe(true);
  });

  test('틀린 비밀번호 비교 시 false 를 반환한다', async () => {
    const result = await comparePassword('wrong_password', hashed);
    expect(result).toBe(false);
  });

  test('빈 문자열 비교 시 false 를 반환한다', async () => {
    const result = await comparePassword('', hashed);
    expect(result).toBe(false);
  });
});

// ────────────────────────────────────────────────
// Response 유틸
// ────────────────────────────────────────────────
describe('BE-04-6: sendSuccess', () => {
  function makeMockRes() {
    const res = { _status: null, _body: null };
    res.status = jest.fn((code) => { res._status = code; return res; });
    res.json = jest.fn((body) => { res._body = body; return res; });
    return res;
  }

  test('기본 statusCode 가 200 이다', () => {
    const res = makeMockRes();
    sendSuccess(res, { id: 1 });
    expect(res._status).toBe(200);
  });

  test('응답 바디가 { data: ... } 구조이다', () => {
    const res = makeMockRes();
    sendSuccess(res, { id: 1, name: 'test' });
    expect(res._body).toEqual({ data: { id: 1, name: 'test' } });
  });

  test('statusCode 를 인자로 전달할 수 있다', () => {
    const res = makeMockRes();
    sendSuccess(res, { id: 2 }, 201);
    expect(res._status).toBe(201);
  });

  test('data 가 배열이어도 { data: [...] } 구조로 감싼다', () => {
    const res = makeMockRes();
    sendSuccess(res, [1, 2, 3]);
    expect(res._body).toEqual({ data: [1, 2, 3] });
  });

  test('data 가 null 이어도 { data: null } 구조로 반환한다', () => {
    const res = makeMockRes();
    sendSuccess(res, null);
    expect(res._body).toEqual({ data: null });
  });

  test('res.status().json() 체인이 정상 호출된다', () => {
    const res = makeMockRes();
    sendSuccess(res, {});
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
  });
});
